use crate::modules::documents::{DocumentRequest, DocumentsService};
use crate::reports::models::{CitizenLedgerPayload, InvoiceReportPayload};

/// Compila o PDF do Livro-Razão do Cidadão em memória.
///
/// Mantém a interface legada e delega a geração ao DocumentsService.
/// Não realiza operações explícitas de escrita em disco.
pub fn compile_citizen_ledger_pdf(
    payload: &CitizenLedgerPayload,
) -> Result<Vec<u8>, String> {
    let request = DocumentRequest::CitizenLedger(payload.clone());
    compile_document_pdf(request)
}

/// Compila o PDF da Fatura / Recibo Associativo em memória.
///
/// Mantém a interface legada e delega a geração ao DocumentsService.
/// Não realiza operações explícitas de escrita em disco.
pub fn compile_invoice_pdf(
    payload: &InvoiceReportPayload,
) -> Result<Vec<u8>, String> {
    let request = DocumentRequest::InvoiceBill(payload.clone());
    compile_document_pdf(request)
}

/// Executa o fluxo de compilação comum aos adaptadores legados.
///
/// A conversão para String é mantida para preservar a API existente.
fn compile_document_pdf(request: DocumentRequest) -> Result<Vec<u8>, String> {
    DocumentsService::new()
        .generate_document(request)
        .map(|output| output.pdf_bytes)
        .map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::reports::models::InvoiceReportItem;
    use serde_json::json;

    fn assert_valid_pdf(bytes: &[u8], document_name: &str) {
        assert!(
            !bytes.is_empty(),
            "{document_name}: o buffer PDF não pode ser vazio"
        );
        assert!(
            bytes.starts_with(b"%PDF-"),
            "{document_name}: o buffer deve começar com %PDF-"
        );
    }

    #[test]
    fn test_compile_citizen_ledger_pdf_in_memory() {
        let payload = CitizenLedgerPayload {
            associate_id: Some("TEST001".to_string()),
            data: json!({
                "meta": {
                    "generated_at": "20/10/2026",
                    "reference_period": "2026-10",
                    "audit_hash": "test-audit-sha256-hash"
                },
                "associate": {
                    "id": "TEST-10",
                    "name": "Pessoa Associada de Teste",
                    "cpf": "000.000.000-00",
                    "email": "associado@example.invalid",
                    "avatar_letter": "T",
                    "address_line1": "Rua de Teste, 100",
                    "address_line2": "Município de Teste - UF, 00000-000"
                },
                "summary": {
                    "total_contracted": "65.000,00",
                    "total_paid": "36.623,00",
                    "outstanding_balance": "28.377,00"
                },
                "transactions": [
                    {
                        "date": "08/08/2023",
                        "counterparty": "Contraparte de Teste",
                        "origin": "Instituição de Origem",
                        "destination": "Instituição de Destino",
                        "amount": "5.000,00",
                        "direction": "inbound",
                        "status_label": "Concluído",
                        "status_variant": "confirmed"
                    }
                ]
            }),
        };

        let bytes = compile_citizen_ledger_pdf(&payload).unwrap_or_else(|error| {
            panic!("Falha ao compilar o PDF do Livro-Razão do Cidadão: {error}")
        });

        assert_valid_pdf(&bytes, "Livro-Razão do Cidadão");
    }

    #[test]
    fn test_compile_invoice_pdf_in_memory() {
        let payload = InvoiceReportPayload {
            id: "INV-TEST-001".to_string(),
            member_name: "Pessoa Associada de Teste".to_string(),
            member_doc: "000.000.000-00".to_string(),
            member_email: Some("associado@example.invalid".to_string()),
            member_address: Some("Endereço de Teste, Município de Teste - UF".to_string()),
            description: "Mensalidade Associativa de Teste".to_string(),
            reference_month: "2023-08".to_string(),
            amount: 5000.0,
            due_date: "2023-08-08".to_string(),
            settled_date: Some("2023-08-08".to_string()),
            payment_method: "Pix Dinâmico / D1".to_string(),
            status: "paid".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-test-1".to_string(),
                description: "Mensalidade Associativa de Teste".to_string(),
                service: Some("Contribuição Regular de Teste".to_string()),
                quantity: 1.0,
                price: 5000.0,
                total: 5000.0,
            }],
            taxes: Some(0.0),
            discount: Some(0.0),
            d1_protocol: Some("TEST-PROTOCOL-INV-TEST-001".to_string()),
        };

        let bytes = compile_invoice_pdf(&payload).unwrap_or_else(|error| {
            panic!("Falha ao compilar o PDF da fatura associativa: {error}")
        });

        assert_valid_pdf(&bytes, "Fatura Associativa");
    }
}

