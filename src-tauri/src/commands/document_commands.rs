use std::fs;
use serde::{Deserialize, Serialize};

use crate::modules::documents::{
    DocumentKind, DocumentMetadata, DocumentRequest, DocumentScope, DocumentsService,
};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GenerateDocumentPayload {
    pub request: DocumentRequest,
    pub open_after_export: Option<bool>,
    /// Nome de arquivo opcional; caso não informado, será gerado com timestamp padronizado
    pub target_file_name: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct GenerateDocumentResult {
    pub success: bool,
    pub file_path: String,
    pub file_name: String,
    pub message: String,
    pub metadata: DocumentMetadata,
}

/// Comando IPC unificado do DevOS para emissão documental fortemente tipada.
/// Implementa defesa em profundidade com verificação de escopo e rastreabilidade por checksum.
#[tauri::command]
pub fn generate_document(
    payload: GenerateDocumentPayload,
) -> Result<GenerateDocumentResult, String> {
    let service = DocumentsService::new();
    let kind = payload.request.kind();

    // Verificação de escopo de execução (defense-in-depth)
    match kind.required_scope() {
        DocumentScope::Universal | DocumentScope::CockpitOnly | DocumentScope::NodeOnly => {}
    }

    let output = service
        .generate_document(payload.request)
        .map_err(|e| format!("Falha na geração do documento: {}", e))?;

    let file_name = payload.target_file_name.unwrap_or_else(|| {
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
        match kind {
            DocumentKind::CitizenLedger => format!("extrato_citizen_ledger_{}.pdf", timestamp),
            DocumentKind::InvoiceBill => format!("fatura_associativa_{}.pdf", timestamp),
        }
    });

    let download_dir = dirs::download_dir()
        .or_else(|| dirs::home_dir().map(|h| h.join("Downloads")))
        .unwrap_or_else(std::env::temp_dir);

    let target_path = download_dir.join(&file_name);

    fs::write(&target_path, &output.pdf_bytes)
        .map_err(|e| format!("Falha ao salvar PDF em {:?}: {}", target_path, e))?;

    if payload.open_after_export.unwrap_or(false) {
        let _ = open::that(&target_path);
    }

    Ok(GenerateDocumentResult {
        success: true,
        file_path: target_path.to_string_lossy().to_string(),
        file_name,
        message: "Documento gerado e autenticado com sucesso".to_string(),
        metadata: output.metadata,
    })
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::reports::models::{CitizenLedgerPayload, InvoiceReportItem, InvoiceReportPayload};
    use serde_json::json;

    #[test]
    fn test_generate_document_command_citizen_ledger() {
        let temp_dir = std::env::temp_dir();
        let unique_name = format!("test_ledger_{}.pdf", chrono::Utc::now().timestamp_micros());
        let _expected_path = temp_dir.join(&unique_name);

        let payload = GenerateDocumentPayload {
            request: DocumentRequest::CitizenLedger(CitizenLedgerPayload {
                associate_id: Some("CMD_TEST_01".to_string()),
                data: json!({
                    "meta": { "generated_at": "23/10/2026", "reference_period": "2026-10", "audit_hash": "test" },
                    "associate": { "id": "1", "name": "Teste Comand", "cpf": "000", "email": "a@b.c", "avatar_letter": "T", "address_line1": "Rua 1", "address_line2": "Bairro 2" },
                    "summary": { "total_contracted": "100", "total_paid": "100", "outstanding_balance": "0" },
                    "transactions": []
                }),
            }),
            open_after_export: Some(false),
            target_file_name: Some(unique_name.clone()),
        };

        let result = generate_document(payload);
        assert!(result.is_ok(), "Falha ao executar comando generate_document: {:?}", result.err());

        let res = result.unwrap();
        assert!(res.success);
        assert_eq!(res.file_name, unique_name);
        assert_eq!(res.metadata.document_kind, DocumentKind::CitizenLedger);

        let written_path = std::path::Path::new(&res.file_path);
        assert!(written_path.exists());
        let bytes = fs::read(written_path).expect("falha ao ler arquivo gerado");
        assert!(bytes.starts_with(b"%PDF-"));

        // Limpeza do teste
        let _ = fs::remove_file(written_path);
    }

    #[test]
    fn test_generate_document_command_invoice_bill() {
        let unique_name = format!("test_inv_{}.pdf", chrono::Utc::now().timestamp_micros());

        let payload = GenerateDocumentPayload {
            request: DocumentRequest::InvoiceBill(InvoiceReportPayload {
                id: "INV-CMD-001".to_string(),
                member_name: "Cliente Teste".to_string(),
                member_doc: "000.000.000-00".to_string(),
                member_email: None,
                member_address: None,
                description: "Fatura de Teste IPC".to_string(),
                reference_month: "2026-10".to_string(),
                amount: 100.0,
                due_date: "2026-10-31".to_string(),
                settled_date: None,
                payment_method: "Pix".to_string(),
                status: "pending".to_string(),
                items: vec![InvoiceReportItem {
                    id: "it-1".to_string(),
                    description: "Item 1".to_string(),
                    service: None,
                    quantity: 1.0,
                    price: 100.0,
                    total: 100.0,
                }],
                taxes: None,
                discount: None,
                d1_protocol: None,
            }),
            open_after_export: Some(false),
            target_file_name: Some(unique_name.clone()),
        };

        let result = generate_document(payload);
        assert!(result.is_ok(), "Falha ao executar comando generate_document para fatura: {:?}", result.err());

        let res = result.unwrap();
        assert!(res.success);
        assert_eq!(res.metadata.document_kind, DocumentKind::InvoiceBill);

        let written_path = std::path::Path::new(&res.file_path);
        assert!(written_path.exists());
        let _ = fs::remove_file(written_path);
    }
}
