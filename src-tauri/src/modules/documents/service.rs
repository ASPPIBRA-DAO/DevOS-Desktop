use chrono::Utc;
use sha2::{Digest, Sha256};
use std::sync::Arc;

use crate::modules::documents::models::{
    DocumentError, DocumentKind, DocumentMetadata, DocumentOutput, DocumentRequest, DocumentScope,
};
use crate::modules::documents::ports::{DocumentRenderer, RenderedDocument};

/// Serviço orquestrador para geração, autorização, validação e integridade de documentos canônicos.
///
/// Atua como camada de coordenação e domínio:
/// 1. Valida o payload de entrada contra regras estruturais e de integridade (`request.validate()`).
/// 2. Valida a autorização de escopo contra o contexto confiável do backend (`self.validate_scope()`).
/// 3. Verifica se o renderizador injetado suporta o tipo documental solicitado (`self.renderer.supports()`).
/// 4. Delega a compilação física ao adaptador de renderização (`self.renderer.render()`).
/// 5. Garante a integridade documental calculando o hash SHA-256 canônico,
///    o tamanho em bytes, o carimbo de data/hora UTC e os metadados de emissão.
#[derive(Clone)]
pub struct DocumentsService {
    renderer: Arc<dyn DocumentRenderer>,
    system_scope: DocumentScope,
}

impl DocumentsService {
    /// Inicializa o serviço com um renderizador injetado via `Arc` no escopo padrão Universal.
    pub fn new(renderer: Arc<dyn DocumentRenderer>) -> Self {
        Self {
            renderer,
            system_scope: DocumentScope::Universal,
        }
    }

    /// Alias semântico para inicialização com renderizador injetado via `Arc`.
    pub fn with_renderer(renderer: Arc<dyn DocumentRenderer>) -> Self {
        Self::new(renderer)
    }

    /// Inicializa o serviço com qualquer implementação concreta de `DocumentRenderer`.
    pub fn new_with_renderer<R: DocumentRenderer + 'static>(renderer: R) -> Self {
        Self::new(Arc::new(renderer))
    }

    /// Inicializa o serviço com um renderizador e um escopo de sistema autorizado específico.
    pub fn with_scope(renderer: Arc<dyn DocumentRenderer>, system_scope: DocumentScope) -> Self {
        Self {
            renderer,
            system_scope,
        }
    }

    /// Retorna o escopo de sistema atualmente configurado no serviço.
    pub fn system_scope(&self) -> DocumentScope {
        self.system_scope
    }

    /// Valida se o escopo exigido é autorizado pelo contexto do sistema.
    pub fn validate_scope_for(&self, required: DocumentScope) -> Result<(), DocumentError> {
        match (required, self.system_scope) {
            (DocumentScope::Universal, _) => Ok(()),
            (DocumentScope::CockpitOnly, DocumentScope::CockpitOnly) => Ok(()),
            (DocumentScope::NodeOnly, DocumentScope::NodeOnly) => Ok(()),
            _ => Err(DocumentError::UnauthorizedScope(format!(
                "Emissão não autorizada: o escopo exigido {required:?} é incompatível com o contexto ativo {:?}",
                self.system_scope
            ))),
        }
    }

    /// Verifica se o escopo exigido pelo tipo documental é autorizado pelo contexto do sistema.
    fn validate_scope(&self, kind: DocumentKind) -> Result<(), DocumentError> {
        self.validate_scope_for(kind.required_scope())
    }

    /// Ponto de entrada padrão para geração, autorização, validação e integridade documental.
    pub fn generate_document(
        &self,
        request: DocumentRequest,
    ) -> Result<DocumentOutput, DocumentError> {
        // 1. Validação estrita das regras de domínio e integridade do payload
        request.validate()?;

        let kind = request.kind();

        // 2. Validação obrigatória de autorização de escopo
        self.validate_scope(kind)?;

        // 3. Verificação se o motor injetado suporta o tipo requisitado
        if !self.renderer.supports(kind) {
            return Err(DocumentError::UnsupportedDocumentType(format!(
                "O renderizador documental configurado não oferece suporte ao tipo {kind:?}"
            )));
        }

        // 4. Delegação da renderização física ao motor especializado
        let rendered = self.renderer.render(request)?;

        // 5. Centralização da integridade documental e montagem canônica dos metadados
        let checksum = Sha256::digest(&rendered.pdf_bytes);
        let sha256_checksum = hex::encode(checksum);
        let byte_size = rendered.pdf_bytes.len();
        let generated_at_utc = Utc::now().to_rfc3339();

        let metadata = DocumentMetadata {
            document_kind: kind,
            generated_at_utc,
            sha256_checksum,
            byte_size,
            template_id: kind.template_id().to_string(),
        };

        Ok(DocumentOutput {
            pdf_bytes: rendered.pdf_bytes,
            metadata,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sha2::{Digest, Sha256};

    use crate::modules::documents::typst_renderer::TypstDocumentRenderer;
    use crate::modules::reports::models::{
        CitizenLedgerPayload, InvoiceReportItem, InvoiceReportPayload,
    };

    use serde_json::json;

    fn create_test_service() -> DocumentsService {
        DocumentsService::new_with_renderer(TypstDocumentRenderer::new())
    }

    fn assert_valid_document_output(output: &DocumentOutput, expected_kind: DocumentKind) {
        assert!(
            !output.pdf_bytes.is_empty(),
            "O PDF gerado não deve estar vazio"
        );

        assert!(
            output.pdf_bytes.starts_with(b"%PDF-"),
            "O PDF deve começar com o cabeçalho %PDF-"
        );

        assert_eq!(
            output.metadata.document_kind, expected_kind,
            "O tipo documental dos metadados está incorreto"
        );

        assert_eq!(
            output.metadata.byte_size,
            output.pdf_bytes.len(),
            "O tamanho registrado deve corresponder aos bytes do PDF"
        );

        let expected_checksum = hex::encode(Sha256::digest(&output.pdf_bytes));

        assert_eq!(
            output.metadata.sha256_checksum, expected_checksum,
            "O hash SHA-256 deve corresponder aos bytes do PDF"
        );

        assert_eq!(
            output.metadata.sha256_checksum.len(),
            64,
            "A representação hexadecimal de SHA-256 deve conter 64 caracteres"
        );

        assert_eq!(
            output.metadata.template_id,
            expected_kind.template_id(),
            "O identificador do template está incorreto"
        );

        assert!(
            !output.metadata.generated_at_utc.is_empty(),
            "A data de geração deve estar preenchida"
        );
    }

    #[test]
    fn test_documents_service_generates_citizen_ledger() {
        let service = create_test_service();

        let payload = CitizenLedgerPayload {
            associate_id: Some("MEMBER-123".to_string()),
            data: json!({
                "meta": {
                    "generated_at": "23/10/2026",
                    "reference_period": "2026-10",
                    "audit_hash": "mock_audit_hash_v2"
                },
                "associate": {
                    "id": "123",
                    "name": "Maria Silva",
                    "cpf": "123.456.789-00",
                    "email": "maria@example.com",
                    "avatar_letter": "M",
                    "address_line1": "Rua das Flores, 100",
                    "address_line2": "Centro, Cidade - UF"
                },
                "summary": {
                    "total_contracted": "10.000,00",
                    "total_paid": "10.000,00",
                    "outstanding_balance": "0,00"
                },
                "transactions": []
            }),
        };

        let request = DocumentRequest::CitizenLedger(payload);

        let output = service
            .generate_document(request)
            .unwrap_or_else(|error| panic!("Falha ao gerar documento de extrato: {error:?}"));

        assert_valid_document_output(&output, DocumentKind::CitizenLedger);
    }

    #[test]
    fn test_documents_service_generates_invoice_bill() {
        let service = create_test_service();

        let payload = InvoiceReportPayload {
            id: "INV-2026-999".to_string(),
            member_name: "João Santos".to_string(),
            member_doc: "CPF ***.***.999-**".to_string(),
            member_email: Some("joao@example.com".to_string()),
            member_address: Some("Rio de Janeiro, RJ".to_string()),
            description: "Mensalidade Associativa".to_string(),
            reference_month: "2026-10".to_string(),
            amount: 1500.0,
            due_date: "2026-10-30".to_string(),
            settled_date: Some("2026-10-23".to_string()),
            payment_method: "Pix / D1".to_string(),
            status: "paid".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Taxa de Manutenção".to_string(),
                service: Some("Operação DevOS".to_string()),
                quantity: 1.0,
                price: 1500.0,
                total: 1500.0,
            }],
            taxes: Some(0.0),
            discount: Some(0.0),
            d1_protocol: Some("d1_protocol_sample_hash".to_string()),
        };

        let request = DocumentRequest::InvoiceBill(payload);

        let output = service
            .generate_document(request)
            .unwrap_or_else(|error| panic!("Falha ao gerar fatura: {error:?}"));

        assert_valid_document_output(&output, DocumentKind::InvoiceBill);
    }

    #[test]
    fn test_generate_cessao_posse_document() {
        let service = create_test_service();

        let payload = crate::modules::reports::models::CessaoPossePayload {
            document_number: "2026-0001/CP".to_string(),
            auth_code: "2026-X7Y9".to_string(),
            data: serde_json::json!({
                "cedenteNome": "JOÃO SILVA TESTE",
                "cessionarioNome": "MARIA SOUZA TESTE",
                "imovelLote": "12",
                "imovelQuadra": "B"
            }),
        };

        let request = DocumentRequest::CessaoPosse(payload);

        let output = service
            .generate_document(request)
            .unwrap_or_else(|error| panic!("Falha ao gerar contrato de cessão: {error:?}"));

        assert_valid_document_output(&output, DocumentKind::CessaoPosse);
    }

    #[test]
    fn test_generate_real_estate_reconciliation_document() {
        let service = create_test_service();

        let payload = crate::modules::reports::models::RealEstateReconciliationPayload {
            data: serde_json::json!({
                "generatedAt": "31/10/2026 13:00:00",
                "stats": {
                    "totalProperties": 145756,
                    "totalIdentifiers": 145756,
                    "totalAddresses": 142100,
                    "totalBatches": 12,
                    "openFindingsCount": 3,
                    "pendingProposalsCount": 1
                },
                "batches": [
                    {
                        "id": 1,
                        "filename": "lote_marica_2026_01.csv",
                        "status": "CONCLUIDO",
                        "mode": "INCREMENTAL",
                        "importedRecords": 12500,
                        "inconsistencies": 2
                    }
                ],
                "findings": [
                    {
                        "id": 101,
                        "category": "CADASTRO",
                        "severity": "high",
                        "description": "Inconsistência de numeração na Rua 15",
                        "status": "OPEN"
                    }
                ],
                "properties": [
                    {
                        "id": 1,
                        "matricula": "MATR-00123",
                        "contribuinte": "MARIA DA SILVA SANTOS",
                        "bairro": "CENTRO",
                        "rua": "RUA ALVARES DE CASTRO",
                        "numero": "350",
                        "quadra": "12",
                        "lote": "04",
                        "complemento": "SALA 101"
                    }
                ]
            }),
        };

        let request = DocumentRequest::RealEstateReconciliation(payload);

        let output = service
            .generate_document(request)
            .unwrap_or_else(|error| panic!("Falha ao gerar relatório de reconciliação: {error:?}"));

        assert_valid_document_output(&output, DocumentKind::RealEstateReconciliation);
    }

    #[test]
    fn test_documents_service_rejects_invalid_cessao_posse_payload() {
        let service = create_test_service();
        let invalid_payload = crate::modules::documents::models::CessaoPossePayload {
            document_number: "   ".to_string(),
            auth_code: "2026-X7Y9".to_string(),
            data: serde_json::json!({}),
        };
        let request = DocumentRequest::CessaoPosse(invalid_payload);

        let result = service.generate_document(request);
        assert!(matches!(result, Err(DocumentError::ValidationError(_))));
    }

    #[test]
    fn test_documents_service_rejects_invalid_invoice_bill_payload() {
        let service = create_test_service();
        let invalid_payload = InvoiceReportPayload {
            id: "".to_string(),
            member_name: "Cliente".to_string(),
            member_doc: "000".to_string(),
            member_email: None,
            member_address: None,
            description: "Desc".to_string(),
            reference_month: "2026-10".to_string(),
            amount: 100.0,
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "paid".to_string(),
            items: vec![],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };
        let request = DocumentRequest::InvoiceBill(invalid_payload);

        let result = service.generate_document(request);
        assert!(matches!(result, Err(DocumentError::ValidationError(_))));
    }

    struct MockRenderer {
        supported_kinds: Vec<DocumentKind>,
        render_invocations: std::sync::atomic::AtomicUsize,
    }

    impl MockRenderer {
        fn new(supported_kinds: Vec<DocumentKind>) -> Self {
            Self {
                supported_kinds,
                render_invocations: std::sync::atomic::AtomicUsize::new(0),
            }
        }

        fn invocations(&self) -> usize {
            self.render_invocations
                .load(std::sync::atomic::Ordering::SeqCst)
        }
    }

    impl DocumentRenderer for MockRenderer {
        fn supports(&self, kind: DocumentKind) -> bool {
            self.supported_kinds.contains(&kind)
        }

        fn render(&self, _request: DocumentRequest) -> Result<RenderedDocument, DocumentError> {
            self.render_invocations
                .fetch_add(1, std::sync::atomic::Ordering::SeqCst);
            Ok(RenderedDocument::new(b"%PDF-1.7 mock output".to_vec()))
        }
    }

    #[test]
    fn test_documents_service_delegates_to_injected_renderer_and_centralizes_integrity() {
        let mock = std::sync::Arc::new(MockRenderer::new(vec![DocumentKind::InvoiceBill]));
        let service = DocumentsService::with_renderer(mock.clone());

        let payload = InvoiceReportPayload {
            id: "FAT-MOCK-001".to_string(),
            member_name: "Mock Member".to_string(),
            member_doc: "000.000.000-00".to_string(),
            member_email: None,
            member_address: None,
            description: "Mock Description".to_string(),
            reference_month: "2026-10".to_string(),
            amount: 100.0,
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Item 1".to_string(),
                service: None,
                quantity: 1.0,
                price: 100.0,
                total: 100.0,
            }],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        let output = service
            .generate_document(DocumentRequest::InvoiceBill(payload))
            .expect("Mock deve renderizar com sucesso");

        assert_eq!(mock.invocations(), 1);
        assert_eq!(output.pdf_bytes, b"%PDF-1.7 mock output");
        assert_eq!(output.metadata.document_kind, DocumentKind::InvoiceBill);
        assert_eq!(output.metadata.byte_size, 20);
        let expected_sha = hex::encode(Sha256::digest(b"%PDF-1.7 mock output"));
        assert_eq!(output.metadata.sha256_checksum, expected_sha);
    }

    #[test]
    fn test_documents_service_rejects_unsupported_document_kind_from_renderer() {
        let mock = std::sync::Arc::new(MockRenderer::new(vec![DocumentKind::CessaoPosse]));
        let service = DocumentsService::with_renderer(mock.clone());

        let payload = InvoiceReportPayload {
            id: "FAT-MOCK-002".to_string(),
            member_name: "Mock Member".to_string(),
            member_doc: "000.000.000-00".to_string(),
            member_email: None,
            member_address: None,
            description: "Mock Description".to_string(),
            reference_month: "2026-10".to_string(),
            amount: 100.0,
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Item 1".to_string(),
                service: None,
                quantity: 1.0,
                price: 100.0,
                total: 100.0,
            }],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        let result = service.generate_document(DocumentRequest::InvoiceBill(payload));
        assert!(matches!(
            result,
            Err(DocumentError::UnsupportedDocumentType(_))
        ));
        assert_eq!(mock.invocations(), 0);
    }

    #[test]
    fn test_documents_service_validates_before_delegating_to_renderer() {
        let mock = std::sync::Arc::new(MockRenderer::new(vec![DocumentKind::InvoiceBill]));
        let service = DocumentsService::with_renderer(mock.clone());

        let invalid_payload = InvoiceReportPayload {
            id: "".to_string(),
            member_name: "Mock Member".to_string(),
            member_doc: "000.000.000-00".to_string(),
            member_email: None,
            member_address: None,
            description: "Mock Description".to_string(),
            reference_month: "2026-10".to_string(),
            amount: 100.0,
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        let result = service.generate_document(DocumentRequest::InvoiceBill(invalid_payload));
        assert!(matches!(result, Err(DocumentError::ValidationError(_))));
        assert_eq!(mock.invocations(), 0);
    }

    #[test]
    fn test_documents_service_authorizes_scope_matching() {
        let mock = std::sync::Arc::new(MockRenderer::new(vec![DocumentKind::InvoiceBill]));
        // Serviço configurado com escopo universal explícito
        let service = DocumentsService::with_scope(mock.clone(), DocumentScope::Universal);

        let payload = InvoiceReportPayload {
            id: "FAT-SCOPE-001".to_string(),
            member_name: "Mock Member".to_string(),
            member_doc: "000.000.000-00".to_string(),
            member_email: None,
            member_address: None,
            description: "Mock Description".to_string(),
            reference_month: "2026-10".to_string(),
            amount: 100.0,
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Item 1".to_string(),
                service: None,
                quantity: 1.0,
                price: 100.0,
                total: 100.0,
            }],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        let result = service.generate_document(DocumentRequest::InvoiceBill(payload));
        assert!(result.is_ok());
        assert_eq!(mock.invocations(), 1);
    }

    #[test]
    fn test_documents_service_rejects_unauthorized_scope() {
        let mock = std::sync::Arc::new(MockRenderer::new(vec![DocumentKind::InvoiceBill]));
        // Serviço configurado com escopo restrito a NodeOnly
        let node_service = DocumentsService::with_scope(mock.clone(), DocumentScope::NodeOnly);

        // Tentativa de emissão exigindo CockpitOnly é rejeitada com UnauthorizedScope
        let auth_res = node_service.validate_scope_for(DocumentScope::CockpitOnly);
        assert!(matches!(auth_res, Err(DocumentError::UnauthorizedScope(_))));

        // Serviço Universal também rejeita escopos restritos a Cockpit ou Node
        let universal_service =
            DocumentsService::with_scope(mock.clone(), DocumentScope::Universal);
        assert!(matches!(
            universal_service.validate_scope_for(DocumentScope::CockpitOnly),
            Err(DocumentError::UnauthorizedScope(_))
        ));
        assert!(matches!(
            universal_service.validate_scope_for(DocumentScope::NodeOnly),
            Err(DocumentError::UnauthorizedScope(_))
        ));

        // Renderizador nunca é invocado em caso de violação de autorização
        assert_eq!(mock.invocations(), 0);
    }
}
