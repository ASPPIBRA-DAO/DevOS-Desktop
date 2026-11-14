use super::models::{
    CessaoPossePayload, CitizenLedgerPayload, InvoiceReportPayload, RealEstateReconciliationPayload,
};
use crate::modules::documents::{
    DocumentRequest, DocumentScope, active_document_scope, documents_service_with_scope,
};

/// Compila o PDF do Livro-Razão do Cidadão em memória.
///
/// Mantém a interface legada e delega a geração ao DocumentsService.
/// Não realiza operações explícitas de escrita em disco.
pub fn compile_citizen_ledger_pdf(payload: &CitizenLedgerPayload) -> Result<Vec<u8>, String> {
    compile_citizen_ledger_pdf_with_scope(payload, active_document_scope())
}

/// Compila o PDF do Livro-Razão do Cidadão com escopo explícito.
pub fn compile_citizen_ledger_pdf_with_scope(
    payload: &CitizenLedgerPayload,
    scope: DocumentScope,
) -> Result<Vec<u8>, String> {
    let request = DocumentRequest::CitizenLedger(payload.clone());
    compile_document_pdf_with_scope(request, scope)
}

/// Compila o PDF da Fatura / Recibo Associativo em memória.
///
/// Mantém a interface legada e delega a geração ao DocumentsService.
/// Não realiza operações explícitas de escrita em disco.
pub fn compile_invoice_pdf(payload: &InvoiceReportPayload) -> Result<Vec<u8>, String> {
    compile_invoice_pdf_with_scope(payload, active_document_scope())
}

/// Compila o PDF da Fatura / Recibo Associativo com escopo explícito.
pub fn compile_invoice_pdf_with_scope(
    payload: &InvoiceReportPayload,
    scope: DocumentScope,
) -> Result<Vec<u8>, String> {
    let request = DocumentRequest::InvoiceBill(payload.clone());
    compile_document_pdf_with_scope(request, scope)
}

/// Compila o PDF do Contrato de Cessão de Posse em memória,
/// passando obrigatoriamente pelas validações e autorizações do `DocumentsService`.
pub fn compile_cessao_posse_pdf(payload: &CessaoPossePayload) -> Result<Vec<u8>, String> {
    let request = DocumentRequest::CessaoPosse(payload.clone());
    compile_document_pdf(request)
}

/// Compila o PDF do Relatório de Reconciliação Imobiliária em memória,
/// passando obrigatoriamente pelas validações e autorizações do `DocumentsService`.
pub fn compile_real_estate_reconciliation_pdf(
    payload: &RealEstateReconciliationPayload,
) -> Result<Vec<u8>, String> {
    let request = DocumentRequest::RealEstateReconciliation(payload.clone());
    compile_document_pdf(request)
}

/// Executa o fluxo de compilação comum aos adaptadores legados usando o escopo ativo.
///
/// A conversão para String é mantida para preservar a API existente.
fn compile_document_pdf(request: DocumentRequest) -> Result<Vec<u8>, String> {
    compile_document_pdf_with_scope(request, active_document_scope())
}

/// Executa o fluxo de compilação delegando ao `DocumentsService` com escopo explícito.
pub fn compile_document_pdf_with_scope(
    request: DocumentRequest,
    scope: DocumentScope,
) -> Result<Vec<u8>, String> {
    documents_service_with_scope(scope)
        .generate_document(request)
        .map(|output| output.pdf_bytes.to_vec())
        .map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::modules::reports::models::InvoiceReportItem;
    use rust_decimal_macros::dec;
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

        let bytes = compile_citizen_ledger_pdf_with_scope(&payload, DocumentScope::NodeOnly)
            .unwrap_or_else(|error| {
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
            amount: dec!(5000.0),
            due_date: "2023-08-08".to_string(),
            settled_date: Some("2023-08-08".to_string()),
            payment_method: "Pix Dinâmico / D1".to_string(),
            status: "paid".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-test-1".to_string(),
                description: "Mensalidade Associativa de Teste".to_string(),
                service: Some("Contribuição Regular de Teste".to_string()),
                quantity: dec!(1.0),
                price: dec!(5000.0),
                total: dec!(5000.0),
            }],
            taxes: Some(dec!(0.0)),
            discount: Some(dec!(0.0)),
            d1_protocol: Some("TEST-PROTOCOL-INV-TEST-001".to_string()),
        };

        let bytes = compile_invoice_pdf_with_scope(&payload, DocumentScope::NodeOnly)
            .unwrap_or_else(|error| {
                panic!("Falha ao compilar o PDF da fatura associativa: {error}")
            });

        assert_valid_pdf(&bytes, "Fatura Associativa");
    }

    #[test]
    fn test_reports_engine_enforces_validation_and_scope_via_documents_service() {
        // 1. Rejeita fatura inválida (id vazio ou desconto excessivo)
        let invalid_invoice = InvoiceReportPayload {
            id: "   ".to_string(),
            member_name: "Associado Teste".to_string(),
            member_doc: "000.000.000-00".to_string(),
            member_email: None,
            member_address: None,
            description: "Fatura Inválida".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(100.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };
        assert!(compile_invoice_pdf(&invalid_invoice).is_err());

        // 2. Rejeita CessaoPosse sem document_number ou sem auth_code
        let invalid_cessao = CessaoPossePayload {
            document_number: "".to_string(),
            auth_code: "2026-X7Y9".to_string(),
            data: json!({"cedenteNome": "Teste"}),
        };
        assert!(compile_cessao_posse_pdf(&invalid_cessao).is_err());

        let invalid_auth = CessaoPossePayload {
            document_number: "2026-0001/CP".to_string(),
            auth_code: "   ".to_string(),
            data: json!({"cedenteNome": "Teste"}),
        };
        assert!(compile_cessao_posse_pdf(&invalid_auth).is_err());

        // 3. Rejeita escopo não autorizado (CessaoPosse em NodeOnly)
        let valid_cessao = CessaoPossePayload {
            document_number: "2026-0001/CP".to_string(),
            auth_code: "2026-X7Y9".to_string(),
            data: json!({"cedenteNome": "JOÃO SILVA", "cessionarioNome": "MARIA SOUZA"}),
        };
        assert!(
            compile_document_pdf_with_scope(
                DocumentRequest::CessaoPosse(valid_cessao.clone()),
                DocumentScope::NodeOnly
            )
            .is_err()
        );

        let valid_bytes = compile_document_pdf_with_scope(
            DocumentRequest::CessaoPosse(valid_cessao),
            DocumentScope::CockpitOnly,
        )
        .expect("CockpitOnly deve autorizar CessaoPosse pelo adaptador de reports");
        assert_valid_pdf(&valid_bytes, "Contrato de Cessão de Posse");
    }
}
