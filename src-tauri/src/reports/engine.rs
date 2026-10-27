use crate::modules::documents::{DocumentRequest, DocumentsService};
use crate::reports::models::{CitizenLedgerPayload, InvoiceReportPayload};

/// Compila o documento Typst do Livro-Razão do Cidadão diretamente em memória via DocumentsService,
/// mantendo compatibilidade legada sem realizar I/O de disco.
pub fn compile_citizen_ledger_pdf(payload: &CitizenLedgerPayload) -> Result<Vec<u8>, String> {
    let service = DocumentsService::new();
    let request = DocumentRequest::CitizenLedger(payload.clone());
    service
        .generate_document(request)
        .map(|out| out.pdf_bytes)
        .map_err(|e| e.to_string())
}

/// Compila o documento Typst da Fatura / Recibo Associativo diretamente em memória via DocumentsService,
/// mantendo compatibilidade legada sem realizar I/O de disco.
pub fn compile_invoice_pdf(payload: &InvoiceReportPayload) -> Result<Vec<u8>, String> {
    let service = DocumentsService::new();
    let request = DocumentRequest::InvoiceBill(payload.clone());
    service
        .generate_document(request)
        .map(|out| out.pdf_bytes)
        .map_err(|e| e.to_string())
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::reports::models::InvoiceReportItem;
    use serde_json::json;

    #[test]
    fn test_compile_citizen_ledger_pdf_in_memory() {
        let payload = CitizenLedgerPayload {
            associate_id: Some("TEST001".to_string()),
            data: json!({
                "meta": {
                    "generated_at": "20/10/2026",
                    "reference_period": "2026-10-A4",
                    "audit_hash": "d1_test_sha256_hash"
                },
                "associate": {
                    "id": "10",
                    "name": "Andressa de Lima Ferreira",
                    "cpf": "173.793.567-80",
                    "email": "andressa.ferreira@email.com",
                    "avatar_letter": "A",
                    "address_line1": "Rua Palmira F. De Carvalho, lote 05, Quadra D",
                    "address_line2": "São José de Imbassaí, Maricá - RJ, 24912-000"
                },
                "summary": {
                    "total_contracted": "65.000,00",
                    "total_paid": "36.623,00",
                    "outstanding_balance": "27.377,00"
                },
                "transactions": [
                    {
                        "date": "08/08/2023",
                        "counterparty": "Paulo Roberto Batista Ferreira",
                        "origin": "Itaú Unibanco S.A.",
                        "destination": "Nu Pagamentos S.A.",
                        "amount": "5.000,00",
                        "direction": "inbound",
                        "status_label": "Concluído",
                        "status_variant": "confirmed"
                    }
                ]
            }),
        };

        let result = compile_citizen_ledger_pdf(&payload);
        assert!(
            result.is_ok(),
            "Falha ao compilar PDF em memória via Typst: {:?}",
            result.err()
        );
        let bytes = result.unwrap();
        assert!(!bytes.is_empty(), "Buffer de PDF gerado não pode ser vazio");
        assert!(
            bytes.starts_with(b"%PDF-"),
            "Cabeçalho do binário deve ser PDF válido (%PDF-)"
        );
    }

    #[test]
    fn test_compile_invoice_pdf_in_memory() {
        let payload = InvoiceReportPayload {
            id: "INV-2023-001".to_string(),
            member_name: "Andressa de Lima Ferreira".to_string(),
            member_doc: "CPF ***.***.780-**".to_string(),
            member_email: Some("andressa.ferreira@asppibra.org.br".to_string()),
            member_address: Some("Maricá, RJ".to_string()),
            description: "Mensalidade Associativa ASPPIBRA".to_string(),
            reference_month: "2023-08".to_string(),
            amount: 5000.0,
            due_date: "2023-08-08".to_string(),
            settled_date: Some("2023-08-08".to_string()),
            payment_method: "Pix Dinâmico / D1".to_string(),
            status: "paid".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Mensalidade Associativa".to_string(),
                service: Some("Contribuição Regular".to_string()),
                quantity: 1.0,
                price: 5000.0,
                total: 5000.0,
            }],
            taxes: Some(0.0),
            discount: Some(0.0),
            d1_protocol: Some(
                "05d4084730d36b1073d62c37ab83e9c425d795b5ff34ed949083cdbf02fd7b33::INV-2023-001"
                    .to_string(),
            ),
        };

        let result = compile_invoice_pdf(&payload);
        assert!(
            result.is_ok(),
            "Falha ao compilar fatura PDF em memória via Typst: {:?}",
            result.err()
        );
        let bytes = result.unwrap();
        assert!(!bytes.is_empty(), "Buffer de fatura PDF não pode ser vazio");
        assert!(
            bytes.starts_with(b"%PDF-"),
            "Cabeçalho da fatura deve ser PDF válido (%PDF-)"
        );
    }
}
