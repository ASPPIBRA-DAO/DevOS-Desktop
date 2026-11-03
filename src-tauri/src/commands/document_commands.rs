use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Component, Path, PathBuf};

use crate::modules::documents::models::DocumentError;
use crate::modules::documents::{
    active_document_scope, documents_service_with_scope, global_preview_store, DocumentKind,
    DocumentMetadata, DocumentPreviewStore, DocumentRequest, DocumentScope,
};
use crate::platform::typst_engine::{encode_base64, RenderedPagePreview};

pub type DocumentPreviewPage = RenderedPagePreview;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GenerateDocumentPayload {
    pub request: DocumentRequest,
    pub open_after_export: Option<bool>,
    /// Nome de arquivo opcional; se omitido, será gerado com timestamp UTC.
    pub target_file_name: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PreviewDocumentPayload {
    pub request: DocumentRequest,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct DocumentPreviewResult {
    pub success: bool,
    pub preview_id: String,
    pub pdf_base64: String,
    pub page_count: usize,
    pub pages: Vec<DocumentPreviewPage>,
    pub created_at_utc: String,
    pub expires_at_utc: String,
    pub message: String,
    pub metadata: DocumentMetadata,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExportPreviewPayload {
    pub preview_id: String,
    pub expected_sha256: String,
    pub open_after_export: Option<bool>,
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

/// Comando IPC unificado para geração e exportação de documentos.
#[tauri::command]
pub fn generate_document(
    payload: GenerateDocumentPayload,
) -> Result<GenerateDocumentResult, String> {
    let download_dir = resolve_download_dir();

    generate_document_in_directory(payload, &download_dir)
}

/// Comando IPC para compilação em memória e entrega de preview do PDF real ao visualizador interno.
///
/// Não grava arquivo em disco e não dispara visualizadores externos do sistema operacional.
#[tauri::command]
pub fn preview_document(payload: PreviewDocumentPayload) -> Result<DocumentPreviewResult, String> {
    preview_document_with_store_and_scope(payload, global_preview_store(), active_document_scope())
}

/// Comando IPC para exportação verificada dos bytes exatos de um PDF previamente visualizado.
///
/// Não recompila o template: valida `preview_id`, expiração, escopo de edição e igualdade
/// criptográfica SHA-256 antes de gravar o artefato em disco.
#[tauri::command]
pub fn export_previewed_document(
    payload: ExportPreviewPayload,
) -> Result<GenerateDocumentResult, String> {
    let download_dir = resolve_download_dir();

    export_previewed_document_in_directory_with_store_and_scope(
        payload,
        &download_dir,
        global_preview_store(),
        active_document_scope(),
    )
}

pub(crate) fn preview_document_with_store_and_scope(
    payload: PreviewDocumentPayload,
    store: &DocumentPreviewStore,
    active_scope: DocumentScope,
) -> Result<DocumentPreviewResult, String> {
    let service = documents_service_with_scope(active_scope);

    let (output, pages) = service
        .generate_document_with_pages(payload.request)
        .map_err(public_document_error)?;

    let stored = store
        .store_preview(output, pages, active_scope)
        .map_err(|err| err.public_message())?;

    let page_count = stored.pages.len();
    let pdf_base64 = encode_base64(&stored.pdf_bytes);

    Ok(DocumentPreviewResult {
        success: true,
        preview_id: stored.preview_id,
        pdf_base64,
        page_count,
        pages: stored.pages,
        created_at_utc: stored.created_at_utc,
        expires_at_utc: stored.expires_at_utc,
        message: "Visualização do PDF gerada em memória com sucesso.".to_string(),
        metadata: stored.metadata,
    })
}

pub(crate) fn export_previewed_document_in_directory_with_store_and_scope(
    payload: ExportPreviewPayload,
    download_dir: &Path,
    store: &DocumentPreviewStore,
    active_scope: DocumentScope,
) -> Result<GenerateDocumentResult, String> {
    let ExportPreviewPayload {
        preview_id,
        expected_sha256,
        open_after_export,
        target_file_name,
    } = payload;

    let stored = store
        .verify_and_get_for_export(&preview_id, &expected_sha256, active_scope)
        .map_err(|err| err.public_message())?;

    let kind = stored.metadata.document_kind;
    let file_name = match target_file_name {
        Some(name) => normalize_pdf_file_name(&name)?,
        None => default_file_name(kind),
    };

    fs::create_dir_all(download_dir)
        .map_err(|_| "Não foi possível preparar o diretório de destino do PDF.".to_string())?;

    let target_path = download_dir.join(&file_name);

    write_pdf_without_overwrite(&target_path, &stored.pdf_bytes)?;

    // Confirmação criptográfica pós-gravação: o arquivo gravado possui exatamente o mesmo SHA-256 do preview
    let disk_bytes = fs::read(&target_path)
        .map_err(|_| "Não foi possível verificar a integridade do PDF exportado.".to_string())?;
    let disk_sha256 = hex::encode(Sha256::digest(&disk_bytes));
    if disk_sha256 != stored.sha256_checksum {
        let _ = fs::remove_file(&target_path);
        return Err(
            "Falha de integridade pós-gravação: o hash SHA-256 do arquivo divergiu do preview."
                .to_string(),
        );
    }

    let message = if open_after_export.unwrap_or(false) {
        if open::that(&target_path).is_ok() {
            "Documento verificado e exportado com sucesso.".to_string()
        } else {
            "Documento exportado com integridade verificada, mas não foi possível abri-lo automaticamente.".to_string()
        }
    } else {
        "Documento verificado e exportado com sucesso.".to_string()
    };

    Ok(GenerateDocumentResult {
        success: true,
        file_path: target_path.to_string_lossy().into_owned(),
        file_name,
        message,
        metadata: stored.metadata,
    })
}

/// Resolve o diretório padrão, preservando a ordem de preferência existente.
fn resolve_download_dir() -> PathBuf {
    dirs::download_dir()
        .or_else(|| dirs::home_dir().map(|home| home.join("Downloads")))
        .unwrap_or_else(std::env::temp_dir)
}

/// Gera e exporta o documento para o diretório especificado usando o escopo ativo da aplicação.
///
/// Visível internamente ao crate (`pub(crate)`) para que testes unitários e de integração
/// possam utilizar um diretório temporário isolado sem modificar a interface pública do comando Tauri.
pub(crate) fn generate_document_in_directory(
    payload: GenerateDocumentPayload,
    download_dir: &Path,
) -> Result<GenerateDocumentResult, String> {
    generate_document_in_directory_with_scope(payload, download_dir, active_document_scope())
}

/// Gera e exporta o documento para o diretório especificado sob um escopo de edição explícito.
pub(crate) fn generate_document_in_directory_with_scope(
    payload: GenerateDocumentPayload,
    download_dir: &Path,
    active_scope: DocumentScope,
) -> Result<GenerateDocumentResult, String> {
    let GenerateDocumentPayload {
        request,
        open_after_export,
        target_file_name,
    } = payload;

    let kind = request.kind();

    // Validar o nome antes de compilar o documento evita processamento
    // desnecessário quando a entrada é inválida.
    let file_name = match target_file_name {
        Some(name) => normalize_pdf_file_name(&name)?,
        None => default_file_name(kind),
    };

    let service = documents_service_with_scope(active_scope);

    let output = service
        .generate_document(request)
        .map_err(public_document_error)?;

    fs::create_dir_all(download_dir)
        .map_err(|_| "Não foi possível preparar o diretório de destino do PDF.".to_string())?;

    let target_path = download_dir.join(&file_name);

    write_pdf_without_overwrite(&target_path, &output.pdf_bytes)?;

    // A abertura é opcional e ocorre depois da gravação do PDF.
    let message = if open_after_export.unwrap_or(false) {
        if open::that(&target_path).is_ok() {
            "Documento gerado e salvo com sucesso.".to_string()
        } else {
            "Documento salvo, mas não foi possível abri-lo automaticamente.".to_string()
        }
    } else {
        "Documento gerado e salvo com sucesso.".to_string()
    };

    Ok(GenerateDocumentResult {
        success: true,
        file_path: target_path.to_string_lossy().into_owned(),
        file_name,
        message,
        metadata: output.metadata,
    })
}

/// Retorna mensagens apropriadas para a fronteira IPC sem expor detalhes
/// internos de serialização, compilação ou sistema de arquivos.
fn public_document_error(error: DocumentError) -> String {
    match &error {
        DocumentError::ValidationError(detail) => {
            format!("Os dados fornecidos para o documento são inválidos: {detail}")
        }
        _ => error.public_message().to_string(),
    }
}

/// Produz um nome padrão com precisão de microssegundos para reduzir colisões.
fn default_file_name(kind: DocumentKind) -> String {
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S_%f");

    match kind {
        DocumentKind::CitizenLedger => {
            format!("extrato_citizen_ledger_{timestamp}.pdf")
        }
        DocumentKind::InvoiceBill => {
            format!("fatura_associativa_{timestamp}.pdf")
        }
        DocumentKind::CessaoPosse => {
            format!("contrato_cessao_posse_{timestamp}.pdf")
        }
        DocumentKind::RealEstateReconciliation => {
            format!("reconciliacao_imobiliaria_{timestamp}.pdf")
        }
    }
}

/// Valida e normaliza o nome de arquivo recebido pelo IPC.
///
/// Não permite caminhos, separadores ou extensões diferentes de PDF.
/// Quando a extensão estiver ausente, acrescenta `.pdf`.
fn normalize_pdf_file_name(file_name: &str) -> Result<String, String> {
    if file_name.is_empty()
        || file_name.trim() != file_name
        || file_name == "."
        || file_name == ".."
        || file_name
            .chars()
            .any(|character| character.is_control() || matches!(character, '/' | '\\' | ':'))
    {
        return Err(
            "O nome do arquivo é inválido. Informe apenas um nome de arquivo PDF.".to_string(),
        );
    }

    let path = Path::new(file_name);

    let mut components = path.components();

    if !matches!(components.next(), Some(Component::Normal(_))) || components.next().is_some() {
        return Err("O nome do arquivo deve ser um único componente, sem diretórios.".to_string());
    }

    match path.extension().and_then(|extension| extension.to_str()) {
        Some(extension) if extension.eq_ignore_ascii_case("pdf") => Ok(file_name.to_string()),
        Some(_) => Err("A extensão do arquivo deve ser .pdf.".to_string()),
        None => Ok(format!("{file_name}.pdf")),
    }
}

/// Cria um PDF sem sobrescrever um arquivo ou link simbólico preexistente.
///
/// Se a escrita falhar, tenta remover o arquivo parcial criado por esta
/// operação, sem expor o caminho do sistema de arquivos pela fronteira IPC.
fn write_pdf_without_overwrite(target_path: &Path, pdf_bytes: &[u8]) -> Result<(), String> {
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(target_path)
        .map_err(|error| {
            if error.kind() == std::io::ErrorKind::AlreadyExists {
                "Já existe um arquivo com esse nome. Escolha outro nome.".to_string()
            } else {
                "Não foi possível criar o arquivo PDF no diretório de destino.".to_string()
            }
        })?;

    if file.write_all(pdf_bytes).is_err() {
        drop(file);
        let _ = fs::remove_file(target_path);

        return Err("Ocorreu uma falha ao gravar o conteúdo do PDF.".to_string());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::modules::reports::models::{
        CitizenLedgerPayload, InvoiceReportItem, InvoiceReportPayload,
    };

    use serde_json::json;
    use std::time::{SystemTime, UNIX_EPOCH};

    struct TestDirectory {
        path: PathBuf,
    }

    impl TestDirectory {
        fn new() -> Self {
            for attempt in 0..100 {
                let timestamp = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_nanos();

                let path = std::env::temp_dir().join(format!(
                    "devos-document-test-{}-{timestamp}-{attempt}",
                    std::process::id()
                ));

                match fs::create_dir(&path) {
                    Ok(()) => return Self { path },
                    Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
                        continue;
                    }
                    Err(error) => {
                        panic!("Não foi possível criar o diretório de teste: {error}");
                    }
                }
            }

            panic!("Não foi possível obter um diretório exclusivo para o teste");
        }

        fn path(&self) -> &Path {
            &self.path
        }
    }

    impl Drop for TestDirectory {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.path);
        }
    }

    fn assert_valid_result(
        result: &GenerateDocumentResult,
        expected_kind: DocumentKind,
        directory: &Path,
    ) {
        assert!(result.success);
        assert_eq!(result.metadata.document_kind, expected_kind);

        let path = Path::new(&result.file_path);

        assert!(path.starts_with(directory));
        assert!(path.is_file());
        assert_eq!(
            path.file_name().and_then(|name| name.to_str()),
            Some(result.file_name.as_str())
        );

        let bytes = fs::read(path).expect("Não foi possível ler o PDF gerado");

        assert!(
            bytes.starts_with(b"%PDF-"),
            "O arquivo gerado deve começar com %PDF-"
        );

        assert_eq!(
            result.metadata.byte_size,
            bytes.len(),
            "O tamanho registrado deve corresponder aos bytes do PDF"
        );
    }

    #[test]
    fn test_normalize_pdf_file_name_rejects_path_traversal() {
        let invalid_names = [
            "../outside.pdf",
            "../../outside.pdf",
            "/tmp/outside.pdf",
            r"..\outside.pdf",
            r"C:\outside.pdf",
            "",
            ".",
            "..",
        ];

        for name in invalid_names {
            assert!(
                normalize_pdf_file_name(name).is_err(),
                "O nome deveria ser rejeitado: {name:?}"
            );
        }
    }

    #[test]
    fn test_normalize_pdf_file_name_enforces_pdf_extension() {
        assert_eq!(
            normalize_pdf_file_name("relatorio").unwrap(),
            "relatorio.pdf"
        );

        assert_eq!(
            normalize_pdf_file_name("relatorio.PDF").unwrap(),
            "relatorio.PDF"
        );

        assert!(normalize_pdf_file_name("relatorio.txt").is_err());
    }

    #[test]
    fn test_write_pdf_does_not_overwrite_existing_file() {
        let directory = TestDirectory::new();
        let target = directory.path().join("existing.pdf");

        fs::write(&target, b"conteudo-original")
            .expect("Não foi possível preparar o arquivo de teste");

        let result = write_pdf_without_overwrite(&target, b"%PDF-1.7\nconteudo-novo");

        assert!(result.is_err());

        let original = fs::read(&target).expect("O arquivo original deveria continuar disponível");

        assert_eq!(original, b"conteudo-original");
    }

    #[test]
    fn test_generate_document_command_citizen_ledger() {
        let directory = TestDirectory::new();
        let unique_name = "test_ledger.pdf".to_string();

        let payload = GenerateDocumentPayload {
            request: DocumentRequest::CitizenLedger(CitizenLedgerPayload {
                associate_id: Some("CMD_TEST_01".to_string()),
                data: json!({
                    "meta": {
                        "generated_at": "23/10/2026",
                        "reference_period": "2026-10",
                        "audit_hash": "test"
                    },
                    "associate": {
                        "id": "1",
                        "name": "Teste Comand",
                        "cpf": "000",
                        "email": "a@b.c",
                        "avatar_letter": "T",
                        "address_line1": "Rua 1",
                        "address_line2": "Bairro 2"
                    },
                    "summary": {
                        "total_contracted": "100",
                        "total_paid": "100",
                        "outstanding_balance": "0"
                    },
                    "transactions": []
                }),
            }),
            open_after_export: Some(false),
            target_file_name: Some(unique_name.clone()),
        };

        let result = generate_document_in_directory(payload, directory.path())
            .expect("Falha ao gerar o extrato");

        assert_eq!(result.file_name, unique_name);
        assert_valid_result(&result, DocumentKind::CitizenLedger, directory.path());
    }

    #[test]
    fn test_generate_document_command_invoice_bill() {
        let directory = TestDirectory::new();
        let unique_name = "test_invoice.pdf".to_string();

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

        let result = generate_document_in_directory(payload, directory.path())
            .expect("Falha ao gerar a fatura");

        assert_eq!(result.file_name, unique_name);
        assert_valid_result(&result, DocumentKind::InvoiceBill, directory.path());
    }

    #[test]
    fn test_generate_document_command_rejects_empty_document_number() {
        let directory = TestDirectory::new();

        // 1. String vazia
        let payload_empty = GenerateDocumentPayload {
            request: DocumentRequest::CessaoPosse(
                crate::modules::documents::models::CessaoPossePayload {
                    document_number: "".to_string(),
                    auth_code: "2026-X7Y9".to_string(),
                    data: serde_json::json!({}),
                },
            ),
            open_after_export: Some(false),
            target_file_name: None,
        };

        let result = generate_document_in_directory(payload_empty, directory.path());
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Os dados fornecidos para o documento são inválidos"));
        assert!(err_msg.contains("document_number"));

        // 2. Whitespace
        let payload_whitespace = GenerateDocumentPayload {
            request: DocumentRequest::CessaoPosse(
                crate::modules::documents::models::CessaoPossePayload {
                    document_number: "   \t\n".to_string(),
                    auth_code: "2026-X7Y9".to_string(),
                    data: serde_json::json!({}),
                },
            ),
            open_after_export: Some(false),
            target_file_name: None,
        };

        let res_ws = generate_document_in_directory(payload_whitespace, directory.path());
        assert!(res_ws.is_err());
        assert!(res_ws.unwrap_err().contains("document_number"));
    }

    #[test]
    fn test_generate_document_command_rejects_empty_auth_code() {
        let directory = TestDirectory::new();

        // 1. Whitespace
        let payload_ws = GenerateDocumentPayload {
            request: DocumentRequest::CessaoPosse(
                crate::modules::documents::models::CessaoPossePayload {
                    document_number: "2026-0001/CP".to_string(),
                    auth_code: "   ".to_string(),
                    data: serde_json::json!({}),
                },
            ),
            open_after_export: Some(false),
            target_file_name: None,
        };

        let result = generate_document_in_directory(payload_ws, directory.path());
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Os dados fornecidos para o documento são inválidos"));
        assert!(err_msg.contains("auth_code"));

        // 2. String vazia
        let payload_empty = GenerateDocumentPayload {
            request: DocumentRequest::CessaoPosse(
                crate::modules::documents::models::CessaoPossePayload {
                    document_number: "2026-0001/CP".to_string(),
                    auth_code: "".to_string(),
                    data: serde_json::json!({}),
                },
            ),
            open_after_export: Some(false),
            target_file_name: None,
        };

        let res_empty = generate_document_in_directory(payload_empty, directory.path());
        assert!(res_empty.is_err());
        assert!(res_empty.unwrap_err().contains("auth_code"));
    }

    #[test]
    fn test_ipc_payload_deserialization_rejects_missing_fields() {
        // 1. document_number ausente
        let missing_doc_num = serde_json::json!({
            "request": {
                "kind": "cessao_posse",
                "payload": {
                    "auth_code": "2026-X7Y9"
                }
            }
        });
        let res1 = serde_json::from_value::<GenerateDocumentPayload>(missing_doc_num);
        assert!(res1.is_err());
        assert!(res1
            .unwrap_err()
            .to_string()
            .contains("missing field `document_number`"));

        // 2. auth_code ausente
        let missing_auth = serde_json::json!({
            "request": {
                "kind": "cessao_posse",
                "payload": {
                    "document_number": "2026-0001/CP"
                }
            }
        });
        let res2 = serde_json::from_value::<GenerateDocumentPayload>(missing_auth);
        assert!(res2.is_err());
        assert!(res2
            .unwrap_err()
            .to_string()
            .contains("missing field `auth_code`"));
    }

    #[test]
    fn test_generate_document_command_enforces_edition_scope_for_cockpit_and_node() {
        let directory = TestDirectory::new();

        let cessao_payload = GenerateDocumentPayload {
            request: DocumentRequest::CessaoPosse(
                crate::modules::documents::models::CessaoPossePayload {
                    document_number: "2026-0001/CP".to_string(),
                    auth_code: "2026-X7Y9".to_string(),
                    data: json!({"cedenteNome": "JOÃO SILVA", "cessionarioNome": "MARIA SOUZA"}),
                },
            ),
            open_after_export: Some(false),
            target_file_name: Some("cessao_cockpit.pdf".to_string()),
        };

        // 1. CockpitOnly -> CessaoPosse é autorizado e gera PDF
        let cockpit_res = generate_document_in_directory_with_scope(
            cessao_payload.clone(),
            directory.path(),
            DocumentScope::CockpitOnly,
        )
        .expect("Cockpit deve autorizar geração de CessaoPosse");
        assert_valid_result(&cockpit_res, DocumentKind::CessaoPosse, directory.path());

        // 2. NodeOnly -> CessaoPosse é rejeitado com mensagem pública de escopo não autorizado
        let node_res = generate_document_in_directory_with_scope(
            cessao_payload,
            directory.path(),
            DocumentScope::NodeOnly,
        );
        assert!(node_res.is_err());
        assert_eq!(
            node_res.unwrap_err(),
            "Esta edição do aplicativo não está autorizada a gerar este documento."
        );

        let reconciliation_payload = GenerateDocumentPayload {
            request: DocumentRequest::RealEstateReconciliation(
                crate::modules::documents::models::RealEstateReconciliationPayload {
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
                },
            ),
            open_after_export: Some(false),
            target_file_name: Some("reconciliation_cockpit.pdf".to_string()),
        };

        // 3. CockpitOnly -> RealEstateReconciliation é autorizado e gera PDF
        let rec_cockpit = generate_document_in_directory_with_scope(
            reconciliation_payload.clone(),
            directory.path(),
            DocumentScope::CockpitOnly,
        )
        .expect("Cockpit deve autorizar geração de RealEstateReconciliation");
        assert_valid_result(
            &rec_cockpit,
            DocumentKind::RealEstateReconciliation,
            directory.path(),
        );

        // 4. NodeOnly -> RealEstateReconciliation é rejeitado
        let rec_node = generate_document_in_directory_with_scope(
            reconciliation_payload,
            directory.path(),
            DocumentScope::NodeOnly,
        );
        assert!(rec_node.is_err());
        assert_eq!(
            rec_node.unwrap_err(),
            "Esta edição do aplicativo não está autorizada a gerar este documento."
        );
    }

    #[test]
    fn test_preview_and_export_previewed_document_guarantee_identical_sha256_and_bytes() {
        let directory = TestDirectory::new();
        let store = DocumentPreviewStore::new();

        let preview_payload = PreviewDocumentPayload {
            request: DocumentRequest::CessaoPosse(
                crate::modules::documents::models::CessaoPossePayload {
                    document_number: "2026-0001/CP".to_string(),
                    auth_code: "2026-X7Y9".to_string(),
                    data: json!({
                        "cedenteNome": "CARLOS EDUARDO TESTE",
                        "cessionarioNome": "ANA PAULA TESTE",
                        "imovelLote": "15",
                        "imovelQuadra": "D"
                    }),
                },
            ),
        };

        // 1. Preview em memória não escreve no diretório de destino
        let preview = preview_document_with_store_and_scope(
            preview_payload,
            &store,
            DocumentScope::CockpitOnly,
        )
        .expect("Preview de CessaoPosse deve ter sucesso no Cockpit");

        assert!(preview.success);
        assert!(!preview.preview_id.is_empty());
        assert!(preview.page_count >= 1);
        assert_eq!(preview.pages.len(), preview.page_count);
        assert_eq!(preview.metadata.document_kind, DocumentKind::CessaoPosse);
        assert_eq!(preview.metadata.sha256_checksum.len(), 64);

        let preview_bytes = crate::platform::typst_engine::decode_base64(&preview.pdf_base64)
            .expect("pdf_base64 deve ser Base64 válido");
        assert!(preview_bytes.starts_with(b"%PDF-"));
        assert_eq!(preview_bytes.len(), preview.metadata.byte_size);
        assert_eq!(
            hex::encode(Sha256::digest(&preview_bytes)),
            preview.metadata.sha256_checksum
        );
        assert_eq!(
            fs::read_dir(directory.path()).unwrap().count(),
            0,
            "preview_document não deve criar arquivos no diretório de exportação"
        );

        // 2. Exportação verificada grava exatamente os mesmos bytes do preview
        let export_payload = ExportPreviewPayload {
            preview_id: preview.preview_id.clone(),
            expected_sha256: preview.metadata.sha256_checksum.clone(),
            open_after_export: Some(false),
            target_file_name: Some("cessao_preview_verificada.pdf".to_string()),
        };

        let exported = export_previewed_document_in_directory_with_store_and_scope(
            export_payload,
            directory.path(),
            &store,
            DocumentScope::CockpitOnly,
        )
        .expect("Exportação do preview verificado deve ter sucesso");

        assert_valid_result(&exported, DocumentKind::CessaoPosse, directory.path());
        assert_eq!(
            exported.metadata.sha256_checksum, preview.metadata.sha256_checksum,
            "O SHA-256 do documento exportado deve ser idêntico ao do preview"
        );

        let exported_disk_bytes = fs::read(&exported.file_path).unwrap();
        assert_eq!(
            exported_disk_bytes, preview_bytes,
            "Os bytes físicos exportados em disco devem ser idênticos aos bytes entregues ao preview"
        );
    }

    #[test]
    fn test_preview_and_export_enforce_scope_hash_and_expiration_guards() {
        let directory = TestDirectory::new();
        let store = DocumentPreviewStore::new();

        // 1. NodeOnly não pode gerar preview de CessaoPosse (CockpitOnly)
        let forbidden_preview = preview_document_with_store_and_scope(
            PreviewDocumentPayload {
                request: DocumentRequest::CessaoPosse(
                    crate::modules::documents::models::CessaoPossePayload {
                        document_number: "2026-0001/CP".to_string(),
                        auth_code: "2026-X7Y9".to_string(),
                        data: json!({}),
                    },
                ),
            },
            &store,
            DocumentScope::NodeOnly,
        );
        assert!(forbidden_preview.is_err());
        assert_eq!(
            forbidden_preview.unwrap_err(),
            "Esta edição do aplicativo não está autorizada a gerar este documento."
        );

        // 2. Preview válido em CockpitOnly
        let preview = preview_document_with_store_and_scope(
            PreviewDocumentPayload {
                request: DocumentRequest::CitizenLedger(CitizenLedgerPayload {
                    associate_id: Some("ASSOC-PREVIEW-01".to_string()),
                    data: json!({
                        "meta": {
                            "generated_at": "23/10/2026",
                            "reference_period": "2026-10",
                            "audit_hash": "hash-1"
                        },
                        "associate": {
                            "id": "1",
                            "name": "Associado Preview",
                            "cpf": "000.111.222-33",
                            "email": "preview@asppibra.org",
                            "avatar_letter": "A",
                            "address_line1": "Rua A, 10",
                            "address_line2": "Centro"
                        },
                        "summary": {
                            "total_contracted": "500,00",
                            "total_paid": "500,00",
                            "outstanding_balance": "0,00"
                        },
                        "transactions": []
                    }),
                }),
            },
            &store,
            DocumentScope::CockpitOnly,
        )
        .expect("Preview de CitizenLedger deve ter sucesso");

        // 3. Rejeita exportação com SHA-256 divergente
        let bad_hash_res = export_previewed_document_in_directory_with_store_and_scope(
            ExportPreviewPayload {
                preview_id: preview.preview_id.clone(),
                expected_sha256: "f".repeat(64),
                open_after_export: Some(false),
                target_file_name: Some("nao_deve_gravar.pdf".to_string()),
            },
            directory.path(),
            &store,
            DocumentScope::CockpitOnly,
        );
        assert!(bad_hash_res.is_err());
        assert!(bad_hash_res.unwrap_err().contains("SHA-256"));
        assert!(!directory.path().join("nao_deve_gravar.pdf").exists());

        // 4. Rejeita exportação com preview_id inexistente
        let unknown_id_res = export_previewed_document_in_directory_with_store_and_scope(
            ExportPreviewPayload {
                preview_id: "preview-id-inexistente".to_string(),
                expected_sha256: preview.metadata.sha256_checksum.clone(),
                open_after_export: Some(false),
                target_file_name: Some("nao_deve_gravar_2.pdf".to_string()),
            },
            directory.path(),
            &store,
            DocumentScope::CockpitOnly,
        );
        assert!(unknown_id_res.is_err());
        assert!(unknown_id_res.unwrap_err().contains("não foi encontrado"));
    }
}
