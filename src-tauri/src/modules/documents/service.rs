use chrono::Utc;
use sha2::{Digest, Sha256};
use std::sync::Arc;

use crate::modules::documents::models::{
    ApplicationEdition, DocumentError, DocumentKind, DocumentMetadata, DocumentOutput,
    DocumentRequest, DocumentScope, DocumentVisibility,
};
use crate::modules::documents::ports::DocumentRenderer;
use crate::modules::documents::preview_store::{DocumentPreviewStore, StoredDocumentPreview};
use crate::platform::typst_engine::RenderedPagePreview;

/// Serviço orquestrador para geração, autorização, validação e integridade de documentos canônicos.
///
/// Atua como camada de coordenação e domínio:
/// 1. Valida a autorização de escopo contra a edição confiável do sistema (`self.validate_scope()`).
/// 2. Valida o payload de entrada contra regras estruturais e de integridade (`request.validate()`).
/// 3. Verifica se o renderizador injetado suporta o tipo documental solicitado (`self.renderer.supports()`).
/// 4. Delega a compilação física ao adaptador de renderização (`self.renderer.render()` ou `render_pdf_only()`).
/// 5. Garante a integridade documental calculando o hash SHA-256 canônico,
///    o tamanho em bytes, o carimbo de data/hora UTC e os metadados de emissão.
#[derive(Clone)]
pub struct DocumentsService {
    renderer: Arc<dyn DocumentRenderer>,
    edition: ApplicationEdition,
}

impl DocumentsService {
    /// Inicializa o serviço com um renderizador e uma edição explícita da aplicação (`ApplicationEdition`).
    pub fn with_edition(renderer: Arc<dyn DocumentRenderer>, edition: ApplicationEdition) -> Self {
        Self { renderer, edition }
    }

    #[cfg(test)]
    pub fn with_renderer(renderer: Arc<dyn DocumentRenderer>) -> Self {
        Self::with_edition(renderer, ApplicationEdition::Cockpit)
    }

    // TODO(dívida): remover junto com documents_service_with_scope
    /// Inicializa o serviço validando se o escopo de sistema corresponde a uma edição autorizada.
    ///
    /// Rejeita `Universal` e `Uninitialized`, pois não representam perfis de execução reais.
    pub fn with_scope(
        renderer: Arc<dyn DocumentRenderer>,
        system_scope: DocumentScope,
    ) -> Result<Self, DocumentError> {
        let edition = ApplicationEdition::try_from_scope(system_scope)?;
        Ok(Self::with_edition(renderer, edition))
    }

    /// Retorna a edição da aplicação configurada no serviço.
    pub fn edition(&self) -> ApplicationEdition {
        self.edition
    }

    // TODO(dívida): remover após migrar document_commands.rs e reports/engine.rs
    /// Retorna o escopo de sistema atualmente configurado no serviço.
    pub fn system_scope(&self) -> DocumentScope {
        let visibility: DocumentVisibility = self.edition.as_visibility();
        visibility
    }

    // TODO(dívida): remover após migrar document_commands.rs e reports/engine.rs
    /// Valida se o escopo exigido é autorizado pelo contexto do sistema delegando à fonte canônica da verdade.
    pub fn validate_scope_for(&self, required: DocumentScope) -> Result<(), DocumentError> {
        if required.is_allowed_for(self.edition) {
            Ok(())
        } else {
            Err(DocumentError::UnauthorizedScope(format!(
                "Emissão não autorizada: o escopo exigido {required:?} é incompatível com a edição ativa {:?}.",
                self.edition
            )))
        }
    }

    /// Verifica se o escopo exigido pelo tipo documental é autorizado pelo contexto do sistema.
    fn validate_scope(&self, kind: DocumentKind) -> Result<(), DocumentError> {
        self.validate_scope_for(kind.required_visibility())
    }

    /// Valida o pipeline comum (autorização de escopo, regras de payload e suporte do renderizador).
    fn validate_pipeline(&self, request: &DocumentRequest) -> Result<(), DocumentError> {
        self.validate_scope(request.kind())?;
        request.validate()?;
        if !self.renderer.supports(request.kind()) {
            return Err(DocumentError::UnsupportedDocumentType(format!(
                "O renderizador documental configurado não oferece suporte ao tipo {:?}",
                request.kind()
            )));
        }
        Ok(())
    }

    /// Valida a integridade do PDF gerado e constrói o `DocumentOutput` canônico com metadados e SHA-256.
    fn build_document_output(
        kind: DocumentKind,
        pdf_bytes: Arc<[u8]>,
    ) -> Result<DocumentOutput, DocumentError> {
        crate::platform::typst_engine::validate_pdf_structure(&pdf_bytes)
            .map_err(|e| DocumentError::CompilationError(e.to_string()))?;

        let checksum = Sha256::digest(&pdf_bytes);
        let sha256_checksum = hex::encode(checksum);
        let byte_size = pdf_bytes.len();
        let generated_at_utc = Utc::now().to_rfc3339();

        let metadata = DocumentMetadata {
            document_kind: kind,
            generated_at_utc,
            sha256_checksum,
            byte_size,
            template_id: kind.template_id().to_string(),
        };

        Ok(DocumentOutput {
            pdf_bytes,
            metadata,
        })
    }

    /// Ponto de entrada padrão para geração, autorização, validação e integridade documental.
    pub fn generate_document(
        &self,
        request: DocumentRequest,
    ) -> Result<DocumentOutput, DocumentError> {
        let kind = request.kind();
        self.validate_pipeline(&request)?;
        let rendered = self.renderer.render_pdf_only(request)?;
        Self::build_document_output(kind, rendered.pdf_bytes)
    }

    /// Gera o documento canônico com validação, autorização de escopo e cálculo de SHA-256,
    /// retornando tanto o `DocumentOutput` quanto as páginas vetoriais para visualização interna.
    pub fn generate_document_with_pages(
        &self,
        request: DocumentRequest,
    ) -> Result<(DocumentOutput, Vec<RenderedPagePreview>), DocumentError> {
        let kind = request.kind();
        self.validate_pipeline(&request)?;
        let rendered = self.renderer.render(request)?;
        let output = Self::build_document_output(kind, rendered.pdf_bytes)?;
        Ok((output, rendered.pages))
    }

    /// Gera o documento com suas páginas vetoriais e o armazena no store em memória utilizando
    /// o escopo confiável do próprio serviço, garantindo que o chamador não possa forjar o escopo.
    pub fn generate_preview(
        &self,
        request: DocumentRequest,
        store: &DocumentPreviewStore,
    ) -> Result<StoredDocumentPreview, DocumentError> {
        let (output, pages) = self.generate_document_with_pages(request)?;
        let stored = store
            .store_preview(output, pages, self.edition.as_visibility())
            .map_err(DocumentError::from)?;
        Ok(stored)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;
    use sha2::{Digest, Sha256};

    use crate::modules::documents::models::InvoiceStatus;
    use crate::modules::documents::ports::RenderedDocument;
    use crate::modules::documents::typst_renderer::TypstDocumentRenderer;
    use crate::modules::reports::models::{
        CitizenLedgerPayload, InvoiceReportItem, InvoiceReportPayload,
    };

    use serde_json::json;

    fn create_test_service() -> DocumentsService {
        DocumentsService::with_scope(
            std::sync::Arc::new(TypstDocumentRenderer::new()),
            DocumentScope::CockpitOnly,
        )
        .expect("Falha ao criar serviço de teste")
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
            associate_id: Some("123".to_string()),
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
            amount: dec!(1500.0),
            due_date: "2026-10-30".to_string(),
            settled_date: Some("2026-10-23".to_string()),
            payment_method: "Pix / D1".to_string(),
            status: InvoiceStatus::Paid,
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Taxa de Manutenção".to_string(),
                service: Some("Operação DevOS".to_string()),
                quantity: dec!(1.0),
                price: dec!(1500.0),
                total: dec!(1500.0),
            }],
            taxes: Some(dec!(0.0)),
            discount: Some(dec!(0.0)),
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
                "cedenteCpf": "111.222.333-44",
                "cedenteNacionalidade": "Brasileiro",
                "cedenteEstadoCivil": "Casado",
                "cedenteEndereco": "Rua A, 1",
                "cessionarioNome": "MARIA SOUZA TESTE",
                "cessionarioCpf": "555.666.777-88",
                "cessionarioNacionalidade": "Brasileira",
                "cessionarioEstadoCivil": "Solteira",
                "cessionarioEndereco": "Rua B, 2",
                "numeroLote": "12",
                "quadraLote": "B"
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
            amount: dec!(100.0),
            due_date: "2026-10-31".to_string(),
            settled_date: Some("2026-10-25".to_string()),
            payment_method: "Pix".to_string(),
            status: InvoiceStatus::Paid,
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
            Ok(RenderedDocument::new(
                b"%PDF-1.7 mock output payload buffer\n%%EOF".to_vec(),
            ))
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
            amount: dec!(100.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: InvoiceStatus::Pending,
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Item 1".to_string(),
                service: None,
                quantity: dec!(1.0),
                price: dec!(100.0),
                total: dec!(100.0),
            }],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        let output = service
            .generate_document(DocumentRequest::InvoiceBill(payload))
            .expect("Mock deve renderizar com sucesso");

        assert_eq!(mock.invocations(), 1);
        let expected_bytes = b"%PDF-1.7 mock output payload buffer\n%%EOF";
        assert_eq!(&*output.pdf_bytes, expected_bytes);
        assert_eq!(output.metadata.document_kind, DocumentKind::InvoiceBill);
        assert_eq!(output.metadata.byte_size, expected_bytes.len());
        let expected_sha = hex::encode(Sha256::digest(expected_bytes));
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
            amount: dec!(100.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: InvoiceStatus::Pending,
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Item 1".to_string(),
                service: None,
                quantity: dec!(1.0),
                price: dec!(100.0),
                total: dec!(100.0),
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
            amount: dec!(100.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: InvoiceStatus::Pending,
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
        // Serviço configurado com escopo CockpitOnly
        let service =
            DocumentsService::with_scope(mock.clone(), DocumentScope::CockpitOnly).unwrap();

        let payload = InvoiceReportPayload {
            id: "FAT-SCOPE-001".to_string(),
            member_name: "Mock Member".to_string(),
            member_doc: "000.000.000-00".to_string(),
            member_email: None,
            member_address: None,
            description: "Mock Description".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(100.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: InvoiceStatus::Pending,
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Item 1".to_string(),
                service: None,
                quantity: dec!(1.0),
                price: dec!(100.0),
                total: dec!(100.0),
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
        let node_service = DocumentsService::with_scope(mock.clone(), DocumentScope::NodeOnly)
            .expect("NodeOnly é um escopo válido");

        // Tentativa de emissão exigindo CockpitOnly é rejeitada com UnauthorizedScope
        let auth_res = node_service.validate_scope_for(DocumentScope::CockpitOnly);
        assert!(matches!(auth_res, Err(DocumentError::UnauthorizedScope(_))));

        // Escopo Universal não é uma edição executável e é rejeitado na criação do serviço
        assert!(matches!(
            DocumentsService::with_scope(mock.clone(), DocumentScope::Universal),
            Err(DocumentError::UnauthorizedScope(_))
        ));

        // Renderizador nunca é invocado em caso de violação de autorização
        assert_eq!(mock.invocations(), 0);
    }

    #[test]
    fn test_documents_service_enforces_cockpit_and_node_scopes_for_all_document_kinds() {
        let all_kinds = vec![
            DocumentKind::CitizenLedger,
            DocumentKind::InvoiceBill,
            DocumentKind::CessaoPosse,
            DocumentKind::RealEstateReconciliation,
        ];
        let mock = std::sync::Arc::new(MockRenderer::new(all_kinds));

        let ledger_req = DocumentRequest::CitizenLedger(CitizenLedgerPayload {
            associate_id: Some("ASSOC-01".to_string()),
            data: json!({
                "associate": { "id": "ASSOC-01" },
                "meta": { "reference_period": "2026-10" }
            }),
        });
        let invoice_req = DocumentRequest::InvoiceBill(InvoiceReportPayload {
            id: "FAT-SCOPE-02".to_string(),
            member_name: "Associado Escopo".to_string(),
            member_doc: "111.222.333-44".to_string(),
            member_email: None,
            member_address: None,
            description: "Fatura Escopo".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(100.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: InvoiceStatus::Pending,
            items: vec![InvoiceReportItem {
                id: "it-1".to_string(),
                description: "Item".to_string(),
                service: None,
                quantity: dec!(1.0),
                price: dec!(100.0),
                total: dec!(100.0),
            }],
            taxes: None,
            discount: None,
            d1_protocol: None,
        });
        let cessao_req =
            DocumentRequest::CessaoPosse(crate::modules::documents::models::CessaoPossePayload {
                document_number: "2026-0001/CP".to_string(),
                auth_code: "2026-X7Y9".to_string(),
                data: json!({
                    "cedenteNome": "Cedente Exemplo",
                    "cedenteCpf": "111.222.333-44",
                    "cedenteNacionalidade": "Brasileiro",
                    "cedenteEstadoCivil": "Casado",
                    "cedenteEndereco": "Rua A, 1",
                    "cessionarioNome": "Cessionário Exemplo",
                    "cessionarioCpf": "555.666.777-88",
                    "cessionarioNacionalidade": "Brasileiro",
                    "cessionarioEstadoCivil": "Solteiro",
                    "cessionarioEndereco": "Rua B, 2",
                    "numeroLote": "10",
                    "quadraLote": "20"
                }),
            });
        let reconciliation_req = DocumentRequest::RealEstateReconciliation(
            crate::modules::documents::models::RealEstateReconciliationPayload {
                data: json!({
                    "generatedAt": "2026-11-15T12:00:00Z",
                    "stats": {}
                }),
            },
        );

        // 1. Edição Cockpit (CockpitOnly): aceita Universal e CockpitOnly
        let cockpit_service =
            DocumentsService::with_scope(mock.clone(), DocumentScope::CockpitOnly).unwrap();
        assert!(
            cockpit_service
                .generate_document(ledger_req.clone())
                .is_ok()
        );
        assert!(
            cockpit_service
                .generate_document(invoice_req.clone())
                .is_ok()
        );
        assert!(
            cockpit_service
                .generate_document(cessao_req.clone())
                .is_ok()
        );
        assert!(
            cockpit_service
                .generate_document(reconciliation_req.clone())
                .is_ok()
        );
        assert_eq!(mock.invocations(), 4);

        // 2. Edição Node (NodeOnly): aceita Universal (CitizenLedger, InvoiceBill),
        // mas rejeita documentos restritos ao Cockpit (CessaoPosse, RealEstateReconciliation)
        let node_service =
            DocumentsService::with_scope(mock.clone(), DocumentScope::NodeOnly).unwrap();
        assert!(node_service.generate_document(ledger_req).is_ok());
        assert!(node_service.generate_document(invoice_req).is_ok());
        assert_eq!(mock.invocations(), 6);

        assert!(matches!(
            node_service.generate_document(cessao_req),
            Err(DocumentError::UnauthorizedScope(_))
        ));
        assert!(matches!(
            node_service.generate_document(reconciliation_req),
            Err(DocumentError::UnauthorizedScope(_))
        ));
        assert_eq!(mock.invocations(), 6);
    }
}
