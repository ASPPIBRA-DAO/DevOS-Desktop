use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Component, Path, PathBuf};

use crate::modules::documents::models::DocumentError;
use crate::modules::documents::{
    DocumentKind, DocumentMetadata, DocumentRequest, DocumentScope, DocumentsService,
};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GenerateDocumentPayload {
    pub request: DocumentRequest,
    pub open_after_export: Option<bool>,
    /// Nome de arquivo opcional; se omitido, será gerado com timestamp UTC.
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

/// Resolve o diretório padrão, preservando a ordem de preferência existente.
fn resolve_download_dir() -> PathBuf {
    dirs::download_dir()
        .or_else(|| dirs::home_dir().map(|home| home.join("Downloads")))
        .unwrap_or_else(std::env::temp_dir)
}

/// Gera e exporta o documento para o diretório especificado.
///
/// A função é privada para que os testes possam usar um diretório isolado,
/// sem modificar a interface pública do comando Tauri.
fn generate_document_in_directory(
    payload: GenerateDocumentPayload,
    download_dir: &Path,
) -> Result<GenerateDocumentResult, String> {
    let GenerateDocumentPayload {
        request,
        open_after_export,
        target_file_name,
    } = payload;

    let kind = request.kind();

    validate_document_scope(kind.required_scope())?;

    // Validar o nome antes de compilar o documento evita processamento
    // desnecessário quando a entrada é inválida.
    let file_name = match target_file_name {
        Some(name) => normalize_pdf_file_name(&name)?,
        None => default_file_name(kind),
    };

    let service = DocumentsService::new();

    let output = service
        .generate_document(request)
        .map_err(public_document_error)?;

    fs::create_dir_all(download_dir)
        .map_err(|_| {
            "Não foi possível preparar o diretório de destino do PDF.".to_string()
        })?;

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
    error.public_message().to_string()
}

/// Atualmente, apenas os documentos universais são aceitos.
///
/// Os escopos específicos exigem uma fonte confiável que identifique a
/// edição do aplicativo. Até essa integração existir, falhamos de forma
/// segura em vez de aceitar silenciosamente escopos restritos.
fn validate_document_scope(scope: DocumentScope) -> Result<(), String> {
    match scope {
        DocumentScope::Universal => Ok(()),
        DocumentScope::CockpitOnly | DocumentScope::NodeOnly => Err(
            "O escopo específico deste documento ainda não está configurado para a edição atual."
                .to_string(),
        ),
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
            .any(|character| {
                character.is_control()
                    || matches!(character, '/' | '\\' | ':')
            })
    {
        return Err(
            "O nome do arquivo é inválido. Informe apenas um nome de arquivo PDF."
                .to_string(),
        );
    }

    let path = Path::new(file_name);

    let mut components = path.components();

    if !matches!(components.next(), Some(Component::Normal(_)))
        || components.next().is_some()
    {
        return Err(
            "O nome do arquivo deve ser um único componente, sem diretórios."
                .to_string(),
        );
    }

    match path.extension().and_then(|extension| extension.to_str()) {
        Some(extension) if extension.eq_ignore_ascii_case("pdf") => {
            Ok(file_name.to_string())
        }
        Some(_) => Err(
            "A extensão do arquivo deve ser .pdf.".to_string(),
        ),
        None => Ok(format!("{file_name}.pdf")),
    }
}

/// Cria um PDF sem sobrescrever um arquivo ou link simbólico preexistente.
///
/// Se a escrita falhar, tenta remover o arquivo parcial criado por esta
/// operação, sem expor o caminho do sistema de arquivos pela fronteira IPC.
fn write_pdf_without_overwrite(
    target_path: &Path,
    pdf_bytes: &[u8],
) -> Result<(), String> {
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(target_path)
        .map_err(|error| {
            if error.kind() == std::io::ErrorKind::AlreadyExists {
                "Já existe um arquivo com esse nome. Escolha outro nome.".to_string()
            } else {
                "Não foi possível criar o arquivo PDF no diretório de destino."
                    .to_string()
            }
        })?;

    if file.write_all(pdf_bytes).is_err() {
        drop(file);
        let _ = fs::remove_file(target_path);

        return Err(
            "Ocorreu uma falha ao gravar o conteúdo do PDF.".to_string(),
        );
    }

    Ok(())
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
                    Err(error)
                        if error.kind() == std::io::ErrorKind::AlreadyExists =>
                    {
                        continue;
                    }
                    Err(error) => {
                        panic!(
                            "Não foi possível criar o diretório de teste: {error}"
                        );
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

        let bytes = fs::read(path)
            .expect("Não foi possível ler o PDF gerado");

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

        let result = write_pdf_without_overwrite(
            &target,
            b"%PDF-1.7\nconteudo-novo",
        );

        assert!(result.is_err());

        let original = fs::read(&target)
            .expect("O arquivo original deveria continuar disponível");

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

        let result = generate_document_in_directory(
            payload,
            directory.path(),
        )
        .expect("Falha ao gerar o extrato");

        assert_eq!(result.file_name, unique_name);
        assert_valid_result(
            &result,
            DocumentKind::CitizenLedger,
            directory.path(),
        );
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

        let result = generate_document_in_directory(
            payload,
            directory.path(),
        )
        .expect("Falha ao gerar a fatura");

        assert_eq!(result.file_name, unique_name);
        assert_valid_result(
            &result,
            DocumentKind::InvoiceBill,
            directory.path(),
        );
    }
}
