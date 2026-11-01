//! Gerenciador de conteúdo IPFS: Upload e Download em streaming com verificação de SHA-256 e proteção contra TOCTOU.
//!
//! Políticas de Integridade e Segurança (Correções 03, 04 e 05):
//! 1. Fluxo de leitura único no upload: calcula o SHA-256 exatamente sobre os blocos transmitidos ao Kubo (zero TOCTOU).
//! 2. Processamento em chunks: o arquivo nunca é carregado integralmente na memória nem convertido em Base64.
//! 3. Downloads gravados em arquivo temporário com UUID exclusivo e criação exclusiva (`create_new`), com limpeza garantida.
//! 4. Controle explícito de sobrescrita (`overwrite: bool`, padrão `false`) com publicação atômica sem substituição acidental.
//! 5. Registro em catálogo associado ao contexto do repositório (`repo_context`).

use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll};
use chrono::Utc;
use sha2::{Digest, Sha256};
use tokio::fs::File as TokioFile;
use tokio::io::{AsyncRead, ReadBuf};

use super::client::KuboClient;
use super::daemon::DaemonManager;
use super::models::{
    IpfsDownloadOptions, IpfsDownloadResult, IpfsUploadOptions, IpfsUploadResult,
    ManagedPinRecord,
};
use super::pinning::{list_managed_pins, register_managed_pin};

const CHUNK_SIZE_BYTES: usize = 65536; // 64 KiB chunks para streaming

/// Leitor assíncrono que intercepta cada bloco transmitido para calcular o SHA-256 e tamanho de forma concorrente.
struct HashingAsyncReader<R> {
    inner: R,
    hasher: Arc<Mutex<Sha256>>,
    total_bytes: Arc<Mutex<u64>>,
}

impl<R: AsyncRead + Unpin> AsyncRead for HashingAsyncReader<R> {
    fn poll_read(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut ReadBuf<'_>,
    ) -> Poll<std::io::Result<()>> {
        let prev_len = buf.filled().len();
        match Pin::new(&mut self.inner).poll_read(cx, buf) {
            Poll::Ready(Ok(())) => {
                let new_len = buf.filled().len();
                let added = &buf.filled()[prev_len..new_len];
                if !added.is_empty() {
                    let mut guard = self.hasher.lock().unwrap_or_else(|p| p.into_inner());
                    guard.update(added);
                    let mut bytes_guard = self.total_bytes.lock().unwrap_or_else(|p| p.into_inner());
                    *bytes_guard += added.len() as u64;
                }
                Poll::Ready(Ok(()))
            }
            other => other,
        }
    }
}

/// Calcula o checksum linear SHA-256 de um arquivo em streaming (utilizado para validações estáticas e testes).
pub fn compute_file_sha256(path: &Path) -> Result<(String, u64), String> {
    let mut file = File::open(path)
        .map_err(|e| format!("Falha ao abrir arquivo '{}': {e}", path.display()))?;

    let mut hasher = Sha256::new();
    let mut buffer = [0u8; CHUNK_SIZE_BYTES];
    let mut total_bytes = 0u64;

    loop {
        let n = file
            .read(&mut buffer)
            .map_err(|e| format!("Falha ao ler bloco do arquivo: {e}"))?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
        total_bytes += n as u64;
    }

    let digest = hasher.finalize();
    Ok((format!("0x{}", hex::encode(digest)), total_bytes))
}

/// Normaliza um hash hexadecimal garantindo prefixo 0x e minúsculas.
pub fn normalize_hex_hash(hash: &str) -> String {
    let trimmed = hash.trim();
    let clean = if let Some(stripped) = trimmed.strip_prefix("0x") {
        stripped
    } else {
        trimmed
    };
    format!("0x{}", clean.to_lowercase())
}

/// Executa o upload de um arquivo para o nó IPFS em streaming com eliminação da janela TOCTOU.
///
/// O arquivo é lido uma única vez: enquanto os chunks são transmitidos via HTTP para o Kubo,
/// o hasher SHA-256 é atualizado incrementalmente com os exatos mesmos bytes transmitidos.
pub async fn upload_file(
    client: &KuboClient,
    options: IpfsUploadOptions,
) -> Result<IpfsUploadResult, String> {
    let path = PathBuf::from(&options.file_path);

    if !path.exists() {
        return Err(format!("Arquivo não encontrado: '{}'", path.display()));
    }
    if !path.is_file() {
        return Err(format!("O caminho informado não é um arquivo: '{}'", path.display()));
    }

    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unnamed_file")
        .to_string();

    // 1. Abrir arquivo com Tokio para o único fluxo de leitura
    let tokio_file = TokioFile::open(&path)
        .await
        .map_err(|e| format!("Falha ao abrir arquivo para streaming assíncrono: {e}"))?;

    let hasher_arc = Arc::new(Mutex::new(Sha256::new()));
    let total_bytes_arc = Arc::new(Mutex::new(0u64));

    let hashing_reader = HashingAsyncReader {
        inner: tokio_file,
        hasher: hasher_arc.clone(),
        total_bytes: total_bytes_arc.clone(),
    };

    let stream = tokio_util::io::ReaderStream::new(hashing_reader);
    let body = reqwest::Body::wrap_stream(stream);

    // 2. Transmitir para o Kubo via /api/v0/add com pin explícito
    let add_response = client
        .add_file_multipart(&file_name, body, options.pin)
        .await?;

    let cid = add_response
        .hash
        .ok_or_else(|| "Kubo RPC não retornou o CID do arquivo adicionado.".to_string())?;

    // 3. Obter o SHA-256 exato dos bytes transmitidos
    let digest = hasher_arc
        .lock()
        .unwrap_or_else(|p| p.into_inner())
        .clone()
        .finalize();
    let sha256_checksum = format!("0x{}", hex::encode(digest));
    let file_size = *total_bytes_arc.lock().unwrap_or_else(|p| p.into_inner());

    // 4. Se um hash esperado foi especificado, validar contra os bytes transmitidos
    if let Some(ref expected) = options.expected_sha256 {
        let normalized_expected = normalize_hex_hash(expected);
        if sha256_checksum != normalized_expected {
            // Em caso de divergência, desfaz a fixação no Kubo para não reter dados corrompidos
            if options.pin {
                let _ = client.pin_rm(&cid, true).await;
            }
            return Err(format!(
                "Integridade pós-transmissão violada: SHA-256 dos bytes transmitidos ('{sha256_checksum}') difere do esperado ('{normalized_expected}')."
            ));
        }
    }

    // 5. Se pin=true, registrar no catálogo managed-pins.json associado ao contexto do repositório
    if options.pin {
        let repo_context = DaemonManager::get_repo_context().await;
        let record = ManagedPinRecord {
            cid: cid.clone(),
            name: file_name.clone(),
            original_sha256: sha256_checksum.clone(),
            size_bytes: file_size,
            pinned_at_utc: Utc::now().to_rfc3339(),
            pin_type: "recursive".to_string(),
            origin: "devos_upload".to_string(),
            repo_context,
        };
        let _ = register_managed_pin(record);
    }

    Ok(IpfsUploadResult {
        cid,
        name: file_name,
        size_bytes: file_size,
        sha256_checksum,
        pinned: options.pin,
    })
}

/// Executa o download de um arquivo do nó IPFS por CID com streaming seguro, temporário exclusivo e prevenção de sobrescrita.
pub async fn download_file(
    client: &KuboClient,
    options: IpfsDownloadOptions,
) -> Result<IpfsDownloadResult, String> {
    if options.cid.trim().is_empty() {
        return Err("CID de conteúdo ausente ou vazio.".to_string());
    }

    let target_path = PathBuf::from(&options.target_path);

    if target_path.is_dir() {
        return Err(format!(
            "O caminho de destino é um diretório e não um arquivo: '{}'",
            target_path.display()
        ));
    }

    let parent_dir = target_path
        .parent()
        .ok_or_else(|| "Caminho de destino inválido.".to_string())?;

    if !parent_dir.exists() {
        return Err(format!(
            "Diretório de destino não existe: '{}'",
            parent_dir.display()
        ));
    }

    // Se overwrite for false e o arquivo já existir, rejeita imediatamente antes de iniciar o download
    if !options.overwrite && target_path.exists() {
        return Err(format!(
            "O arquivo de destino já existe e a opção de sobrescrita (overwrite) não foi habilitada: '{}'",
            target_path.display()
        ));
    }

    // Criação de arquivo temporário com UUID exclusivo no mesmo diretório
    let file_stem = target_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("download");
    let tmp_path = parent_dir.join(format!(".{file_stem}.{}.devos.tmp", uuid::Uuid::new_v4()));

    // Criação exclusiva com create_new (falha se já existir arquivo com o mesmo nome)
    let mut tmp_file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&tmp_path)
        .map_err(|e| format!("Falha ao criar arquivo temporário exclusivo: {e}"))?;

    // 1. Executar download em streaming com captura direta de frames e trailers HTTP
    let mut hasher = Sha256::new();
    let bytes_written = match client
        .cat_to_writer(&options.cid, false, &mut tmp_file, &mut hasher)
        .await
    {
        Ok(b) => b,
        Err(e) => {
            let _ = fs::remove_file(&tmp_path);
            return Err(e);
        }
    };

    if let Err(e) = tmp_file.flush() {
        let _ = fs::remove_file(&tmp_path);
        return Err(format!("Falha ao descarregar buffer do arquivo temporário: {e}"));
    }
    if let Err(e) = tmp_file.sync_all() {
        let _ = fs::remove_file(&tmp_path);
        return Err(format!("Falha ao sincronizar arquivo temporário: {e}"));
    }
    drop(tmp_file);

    let digest = hasher.finalize();
    let recovered_sha256 = format!("0x{}", hex::encode(digest));

    // 3. Validação de integridade contra referência (informada ou buscada no catálogo)
    let reference_sha256 = options.expected_sha256.or_else(|| {
        list_managed_pins()
            .into_iter()
            .find(|r| r.cid == options.cid)
            .map(|r| r.original_sha256)
    });

    let mut integrity_matched = false;
    if let Some(ref ref_hash) = reference_sha256 {
        let normalized_ref = normalize_hex_hash(ref_hash);
        if recovered_sha256 != normalized_ref {
            let _ = fs::remove_file(&tmp_path);
            return Err(format!(
                "Falha de integridade: SHA-256 recuperado ('{recovered_sha256}') difere da referência esperada ('{normalized_ref}')."
            ));
        }
        integrity_matched = true;
    }

    // 4. Publicação atômica do arquivo com salvaguarda estrita contra sobrescrita concorrente
    if options.overwrite {
        if let Err(e) = fs::rename(&tmp_path, &target_path) {
            let _ = fs::remove_file(&tmp_path);
            return Err(format!("Falha ao publicar arquivo final com sobrescrita: {e}"));
        }
    } else {
        // Tenta link físico atômico: falha com AlreadyExists se target_path foi criado concorrentemente
        match fs::hard_link(&tmp_path, &target_path) {
            Ok(()) => {
                let _ = fs::remove_file(&tmp_path);
            }
            Err(err) if err.kind() == std::io::ErrorKind::AlreadyExists => {
                let _ = fs::remove_file(&tmp_path);
                return Err(format!(
                    "O arquivo de destino já existe ou foi criado concorrentemente ('{}'). Sobrescrita rejeitada (overwrite = false).",
                    target_path.display()
                ));
            }
            Err(_err) => {
                // Fallback para rename com checagem se hard_link falhar por cross-device link
                if target_path.exists() {
                    let _ = fs::remove_file(&tmp_path);
                    return Err(format!(
                        "O arquivo de destino já existe ('{}'). Sobrescrita rejeitada (overwrite = false).",
                        target_path.display()
                    ));
                }
                if let Err(e) = fs::rename(&tmp_path, &target_path) {
                    let _ = fs::remove_file(&tmp_path);
                    return Err(format!("Falha ao mover arquivo temporário: {e}"));
                }
            }
        }
    }

    Ok(IpfsDownloadResult {
        cid: options.cid,
        target_path: target_path.to_string_lossy().to_string(),
        bytes_written,
        recovered_sha256,
        integrity_matched,
    })
}
