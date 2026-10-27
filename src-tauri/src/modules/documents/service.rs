use chrono::Utc;
use std::collections::HashMap;

use crate::modules::documents::models::{
    DocumentError, DocumentKind, DocumentMetadata, DocumentOutput, DocumentRequest,
};
use crate::modules::documents::ports::DocumentRenderer;
use crate::platform::typst_engine::{TypstCompileOptions, compile_typst_document};
use crate::wallets::address::keccak256;

static CITIZEN_TEMPLATE: &str = include_str!("../../../templates/extrato_citizen_ledger.typ");
static INVOICE_TEMPLATE: &str = include_str!("../../../templates/invoice_bill.typ");
static ROBOTO_REGULAR: &[u8] = include_bytes!("../../../assets/fonts/Roboto-Regular.ttf");
static ROBOTO_BOLD: &[u8] = include_bytes!("../../../assets/fonts/Roboto-Bold.ttf");

#[derive(Default, Clone)]
pub struct DocumentsService;

impl DocumentsService {
    pub fn new() -> Self {
        Self
    }

    /// Ponto de entrada padrão para orquestração documental
    pub fn generate_document(
        &self,
        request: DocumentRequest,
    ) -> Result<DocumentOutput, DocumentError> {
        self.render(request)
    }
}

impl DocumentRenderer for DocumentsService {
    fn supports(&self, kind: DocumentKind) -> bool {
        matches!(
            kind,
            DocumentKind::CitizenLedger | DocumentKind::InvoiceBill
        )
    }

    fn render(&self, request: DocumentRequest) -> Result<DocumentOutput, DocumentError> {
        let kind = request.kind();
        let (template_source, json_payload) = match request {
            DocumentRequest::CitizenLedger(payload) => {
                let json_str = serde_json::to_string(&payload.data)
                    .map_err(|e| DocumentError::SerializationError(e.to_string()))?;
                (CITIZEN_TEMPLATE, json_str)
            }
            DocumentRequest::InvoiceBill(payload) => {
                let json_val = serde_json::json!({
                    "invoice": payload
                });
                let json_str = serde_json::to_string(&json_val)
                    .map_err(|e| DocumentError::SerializationError(e.to_string()))?;
                (INVOICE_TEMPLATE, json_str)
            }
        };

        let mut string_inputs = HashMap::new();
        string_inputs.insert("data", json_payload);

        let options = TypstCompileOptions {
            template_source,
            fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
            string_inputs,
        };

        let pdf_bytes = compile_typst_document(options)
            .map_err(|err| DocumentError::CompilationError(err.to_string()))?;

        let checksum_bytes = keccak256(&pdf_bytes);
        let sha256_checksum = hex::encode(checksum_bytes);
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
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::reports::models::{CitizenLedgerPayload, InvoiceReportItem, InvoiceReportPayload};
    use serde_json::json;

    #[test]
    fn test_documents_service_generates_citizen_ledger() {
        let service = DocumentsService::new();
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
        let result = service.generate_document(request);

        assert!(
            result.is_ok(),
            "Falha ao gerar documento de extrato: {:?}",
            result.err()
        );
        let output = result.unwrap();
        assert!(!output.pdf_bytes.is_empty());
        assert!(output.pdf_bytes.starts_with(b"%PDF-"));
        assert_eq!(output.metadata.document_kind, DocumentKind::CitizenLedger);
        assert_eq!(output.metadata.byte_size, output.pdf_bytes.len());
        assert!(!output.metadata.sha256_checksum.is_empty());
    }

    #[test]
    fn test_documents_service_generates_invoice_bill() {
        let service = DocumentsService::new();
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
        let result = service.generate_document(request);

        assert!(result.is_ok(), "Falha ao gerar fatura: {:?}", result.err());
        let output = result.unwrap();
        assert!(!output.pdf_bytes.is_empty());
        assert!(output.pdf_bytes.starts_with(b"%PDF-"));
        assert_eq!(output.metadata.document_kind, DocumentKind::InvoiceBill);
        assert_eq!(output.metadata.byte_size, output.pdf_bytes.len());
        assert!(!output.metadata.sha256_checksum.is_empty());
    }
}
