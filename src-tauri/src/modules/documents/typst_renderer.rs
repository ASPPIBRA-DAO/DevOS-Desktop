use std::collections::HashMap;

use crate::modules::documents::models::{DocumentError, DocumentKind, DocumentRequest};
use crate::modules::documents::ports::{DocumentRenderer, RenderedDocument};
use crate::platform::typst_engine::{compile_typst_document, TypstCompileOptions};

static CITIZEN_TEMPLATE: &str = include_str!("../../../templates/extrato_citizen_ledger.typ");

static INVOICE_TEMPLATE: &str = include_str!("../../../templates/invoice_bill.typ");

static CONTRATO_CESSAO_TEMPLATE: &str =
    include_str!("../../../templates/contrato_cessao_posse.typ");

static RECONCILIATION_TEMPLATE: &str =
    include_str!("../../../templates/real_estate_reconciliation.typ");

static ASPPIBRA_LAYOUT: &str = include_str!("../../../templates/asppibra_layout.typ");

static ROBOTO_REGULAR: &[u8] = include_bytes!("../../../assets/fonts/Roboto-Regular.ttf");

static ROBOTO_BOLD: &[u8] = include_bytes!("../../../assets/fonts/Roboto-Bold.ttf");

/// Adaptador de renderização documental baseado no compilador nativo Typst.
///
/// Encapsula o carregamento dos templates `.typ`, fontes institucionais,
/// injeção de parâmetros JSON e invocação do motor de compilação em memória.
///
/// Produz exclusivamente os bytes binários do documento (`RenderedDocument`),
/// sem dependência de regras de integridade ou autorização.
#[derive(Default, Clone, Debug)]
pub struct TypstDocumentRenderer;

impl TypstDocumentRenderer {
    pub fn new() -> Self {
        Self
    }
}

impl DocumentRenderer for TypstDocumentRenderer {
    fn supports(&self, kind: DocumentKind) -> bool {
        matches!(
            kind,
            DocumentKind::CitizenLedger
                | DocumentKind::InvoiceBill
                | DocumentKind::CessaoPosse
                | DocumentKind::RealEstateReconciliation
        )
    }

    fn render(&self, request: DocumentRequest) -> Result<RenderedDocument, DocumentError> {
        let kind = request.kind();

        let (template_source, json_payload) = match request {
            DocumentRequest::CitizenLedger(payload) => {
                let json_str = serde_json::to_string(&payload.data)
                    .map_err(|error| DocumentError::SerializationError(error.to_string()))?;

                (CITIZEN_TEMPLATE, json_str)
            }

            DocumentRequest::InvoiceBill(payload) => {
                let json_value = serde_json::json!({
                    "invoice": payload
                });

                let json_str = serde_json::to_string(&json_value)
                    .map_err(|error| DocumentError::SerializationError(error.to_string()))?;

                (INVOICE_TEMPLATE, json_str)
            }

            DocumentRequest::CessaoPosse(payload) => {
                let json_str = serde_json::to_string(&payload)
                    .map_err(|error| DocumentError::SerializationError(error.to_string()))?;

                (CONTRATO_CESSAO_TEMPLATE, json_str)
            }

            DocumentRequest::RealEstateReconciliation(payload) => {
                let json_str = serde_json::to_string(&payload.data)
                    .map_err(|error| DocumentError::SerializationError(error.to_string()))?;

                (RECONCILIATION_TEMPLATE, json_str)
            }
        };

        let mut string_inputs = HashMap::new();
        string_inputs.insert("data", json_payload);

        let merged_template;
        let final_template_source = if matches!(kind, DocumentKind::CessaoPosse) {
            merged_template = format!("{ASPPIBRA_LAYOUT}\n{template_source}");
            &merged_template
        } else {
            template_source
        };

        let options = TypstCompileOptions {
            template_source: final_template_source,
            fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
            string_inputs,
        };

        let pdf_bytes = compile_typst_document(options)
            .map_err(|error| DocumentError::CompilationError(error.to_string()))?;

        Ok(RenderedDocument::new(pdf_bytes))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::modules::documents::models::{
        CessaoPossePayload, CitizenLedgerPayload, InvoiceReportItem, InvoiceReportPayload,
        RealEstateReconciliationPayload,
    };
    use serde_json::json;

    fn assert_valid_rendered(rendered: &RenderedDocument) {
        assert!(
            !rendered.pdf_bytes.is_empty(),
            "O PDF gerado não deve estar vazio"
        );
        assert!(
            rendered.pdf_bytes.starts_with(b"%PDF-"),
            "O PDF gerado deve iniciar com o cabeçalho %PDF-"
        );
    }

    #[test]
    fn test_typst_renderer_supports_all_canonical_kinds() {
        let renderer = TypstDocumentRenderer::new();
        assert!(renderer.supports(DocumentKind::CitizenLedger));
        assert!(renderer.supports(DocumentKind::InvoiceBill));
        assert!(renderer.supports(DocumentKind::CessaoPosse));
        assert!(renderer.supports(DocumentKind::RealEstateReconciliation));
    }

    #[test]
    fn test_typst_renderer_compiles_invoice_bill() {
        let renderer = TypstDocumentRenderer::new();
        let payload = InvoiceReportPayload {
            id: "FAT-2026-RENDER".to_string(),
            member_name: "Associado Teste".to_string(),
            member_doc: "000.111.222-33".to_string(),
            member_email: None,
            member_address: None,
            description: "Taxa Associativa".to_string(),
            reference_month: "2026-10".to_string(),
            amount: 150.0,
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Taxa de Manutenção".to_string(),
                service: None,
                quantity: 1.0,
                price: 150.0,
                total: 150.0,
            }],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        let output = renderer
            .render(DocumentRequest::InvoiceBill(payload))
            .expect("Renderização da fatura deve ter sucesso");

        assert_valid_rendered(&output);
    }

    #[test]
    fn test_typst_renderer_compiles_cessao_posse() {
        let renderer = TypstDocumentRenderer::new();
        let payload = CessaoPossePayload {
            document_number: "2026-0001/CP".to_string(),
            auth_code: "2026-X7Y9".to_string(),
            data: json!({
                "cedenteNome": "JOÃO SILVA TESTE",
                "cessionarioNome": "MARIA SOUZA TESTE",
                "imovelLote": "12",
                "imovelQuadra": "B"
            }),
        };

        let output = renderer
            .render(DocumentRequest::CessaoPosse(payload))
            .expect("Renderização da cessão de posse deve ter sucesso");

        assert_valid_rendered(&output);
    }

    #[test]
    fn test_typst_renderer_compiles_citizen_ledger() {
        let renderer = TypstDocumentRenderer::new();
        let payload = CitizenLedgerPayload {
            associate_id: Some("ASSOC-TEST".to_string()),
            data: json!({
                "meta": {
                    "generated_at": "23/10/2026",
                    "reference_period": "2026-10",
                    "audit_hash": "audit_hash_test"
                },
                "associate": {
                    "id": "123",
                    "name": "Associado Teste",
                    "cpf": "123.456.789-00",
                    "email": "associado@example.com",
                    "avatar_letter": "A",
                    "address_line1": "Rua Teste, 100",
                    "address_line2": "Centro"
                },
                "summary": {
                    "total_contracted": "1.000,00",
                    "total_paid": "1.000,00",
                    "outstanding_balance": "0,00"
                },
                "transactions": []
            }),
        };

        let output = renderer
            .render(DocumentRequest::CitizenLedger(payload))
            .expect("Renderização do extrato deve ter sucesso");

        assert_valid_rendered(&output);
    }

    #[test]
    fn test_typst_renderer_compiles_real_estate_reconciliation() {
        let renderer = TypstDocumentRenderer::new();
        let payload = RealEstateReconciliationPayload {
            data: json!({
                "generatedAt": "31/10/2026 13:00:00",
                "stats": {
                    "totalProperties": 1,
                    "totalIdentifiers": 1,
                    "totalAddresses": 1,
                    "totalBatches": 1,
                    "openFindingsCount": 0,
                    "pendingProposalsCount": 0
                },
                "batches": [],
                "findings": [],
                "properties": []
            }),
        };

        let output = renderer
            .render(DocumentRequest::RealEstateReconciliation(payload))
            .expect("Renderização da reconciliação deve ter sucesso");

        assert_valid_rendered(&output);
    }
}
