use chrono::Utc;
use sha2::{Digest, Sha256};
use std::collections::HashMap;

use crate::modules::documents::models::{
    DocumentError, DocumentKind, DocumentMetadata, DocumentOutput, DocumentRequest,
};
use crate::modules::documents::ports::DocumentRenderer;
use crate::platform::typst_engine::{TypstCompileOptions, compile_typst_document};

static CITIZEN_TEMPLATE: &str =
    include_str!("../../../templates/extrato_citizen_ledger.typ");

static INVOICE_TEMPLATE: &str =
    include_str!("../../../templates/invoice_bill.typ");

static CONTRATO_CESSAO_TEMPLATE: &str =
    include_str!("../../../templates/contrato_cessao_posse.typ");

static RECONCILIATION_TEMPLATE: &str =
    include_str!("../../../templates/real_estate_reconciliation.typ");

static ROBOTO_REGULAR: &[u8] =
    include_bytes!("../../../assets/fonts/Roboto-Regular.ttf");

static ROBOTO_BOLD: &[u8] =
    include_bytes!("../../../assets/fonts/Roboto-Bold.ttf");

#[derive(Default, Clone)]
pub struct DocumentsService;

impl DocumentsService {
    pub fn new() -> Self {
        Self
    }

    /// Ponto de entrada padrão para orquestração documental.
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
            DocumentKind::CitizenLedger
                | DocumentKind::InvoiceBill
                | DocumentKind::CessaoPosse
                | DocumentKind::RealEstateReconciliation
        )
    }

    fn render(
        &self,
        request: DocumentRequest,
    ) -> Result<DocumentOutput, DocumentError> {
        let kind = request.kind();

        let (template_source, json_payload) = match request {
            DocumentRequest::CitizenLedger(payload) => {
                let json_str = serde_json::to_string(&payload.data)
                    .map_err(|error| {
                        DocumentError::SerializationError(error.to_string())
                    })?;

                (CITIZEN_TEMPLATE, json_str)
            }

            DocumentRequest::InvoiceBill(payload) => {
                let json_value = serde_json::json!({
                    "invoice": payload
                });

                let json_str = serde_json::to_string(&json_value)
                    .map_err(|error| {
                        DocumentError::SerializationError(error.to_string())
                    })?;

                (INVOICE_TEMPLATE, json_str)
            }

            DocumentRequest::CessaoPosse(payload) => {
                let json_str = serde_json::to_string(&payload)
                    .map_err(|error| {
                        DocumentError::SerializationError(error.to_string())
                    })?;

                (CONTRATO_CESSAO_TEMPLATE, json_str)
            }

            DocumentRequest::RealEstateReconciliation(payload) => {
                let json_str = serde_json::to_string(&payload.data)
                    .map_err(|error| {
                        DocumentError::SerializationError(error.to_string())
                    })?;

                (RECONCILIATION_TEMPLATE, json_str)
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
            .map_err(|error| {
                DocumentError::CompilationError(error.to_string())
            })?;

        // O campo sha256_checksum deve conter SHA-256 dos bytes
        // efetivamente retornados, e não Keccak-256.
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
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::reports::models::{
        CitizenLedgerPayload,
        InvoiceReportItem,
        InvoiceReportPayload,
    };

    use serde_json::json;

    fn assert_valid_document_output(
        output: &DocumentOutput,
        expected_kind: DocumentKind,
    ) {
        assert!(
            !output.pdf_bytes.is_empty(),
            "O PDF gerado não deve estar vazio"
        );

        assert!(
            output.pdf_bytes.starts_with(b"%PDF-"),
            "O PDF deve começar com o cabeçalho %PDF-"
        );

        assert_eq!(
            output.metadata.document_kind,
            expected_kind,
            "O tipo documental dos metadados está incorreto"
        );

        assert_eq!(
            output.metadata.byte_size,
            output.pdf_bytes.len(),
            "O tamanho registrado deve corresponder aos bytes do PDF"
        );

        let expected_checksum =
            hex::encode(Sha256::digest(&output.pdf_bytes));

        assert_eq!(
            output.metadata.sha256_checksum,
            expected_checksum,
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

        let output = service
            .generate_document(request)
            .unwrap_or_else(|error| {
                panic!(
                    "Falha ao gerar documento de extrato: {error:?}"
                )
            });

        assert_valid_document_output(
            &output,
            DocumentKind::CitizenLedger,
        );
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

        let output = service
            .generate_document(request)
            .unwrap_or_else(|error| {
                panic!("Falha ao gerar fatura: {error:?}")
            });

        assert_valid_document_output(
            &output,
            DocumentKind::InvoiceBill,
        );
    }

    #[test]
    fn test_generate_cessao_posse_document() {
        let service = DocumentsService::new();

        let payload = crate::reports::models::CessaoPossePayload {
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
            .unwrap_or_else(|error| {
                panic!("Falha ao gerar contrato de cessão: {error:?}")
            });

        assert_valid_document_output(
            &output,
            DocumentKind::CessaoPosse,
        );
    }

    #[test]
    fn test_generate_real_estate_reconciliation_document() {
        let service = DocumentsService::new();

        let payload = crate::reports::models::RealEstateReconciliationPayload {
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
            .unwrap_or_else(|error| {
                panic!("Falha ao gerar relatório de reconciliação: {error:?}")
            });

        assert_valid_document_output(
            &output,
            DocumentKind::RealEstateReconciliation,
        );
    }
}
