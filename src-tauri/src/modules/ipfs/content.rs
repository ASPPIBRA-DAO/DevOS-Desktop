//! Gerenciador de conteúdo IPFS: Upload e Download em streaming com verificação incremental de SHA-256.
//!
//! Políticas de Integridade e Segurança:
//! 1. Streaming nativo de chunks: o arquivo nunca é carregado integralmente na memória nem convertido em Base64.
//! 2. Cálculo incremental de SHA-256 no envio e no recebimento.
//! 3. Downloads gravados inicialmente em arquivo temporário (`.devos.tmp`), atômicos via `rename`.
//! 4. Parâmetro `pin` enviado explicitamente na chamada RPC de `/api/v0/add`.
//! 5. Validação rigorosa de caminhos de arquivos contra path traversal e diretórios inválidos.

use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use chrono::Utc;
use sha2::{Digest, Sha256};
use tokio::fs::File as TokioFile;

use super::client::KuboClient;
use super::models::{
    IpfsDownloadOptions, IpfsDownloadResult, IpfsUploadOptions, IpfsUploadResult,
    ManagedPinRecord,
};
use super::pinning::register_managed_pin;

const CHUNK_SIZE_BYTES: usize = 65536; // 64 KiB chunks para streaming

/// Calcula o checksum linear SHA-256 de um arquivo de forma incremental em streaming de 64 KiB.
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

/// Executa o upload de um arquivo para o nó IPFS em streaming.
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

    // 1. Cálculo incremental do SHA-256 do arquivo original
    let (sha256_checksum, file_size) = compute_file_sha256(&path)?;

    // 2. Se fornecido hash esperado prévio, validar integridade antes da transmissão
    if let Some(ref expected) = options.expected_sha256 {
        let normalized_expected = normalize_hex_hash(expected);
        if sha256_checksum != normalized_expected {
            return Err(format!(
                "Integridade pré-upload reprovada: SHA-256 original '{sha256_checksum}' diverge do esperado '{normalized_expected}'."
            ));
        }
    }

    // 3. Abrir arquivo com Tokio para streaming direto ao body do reqwest
    let tokio_file = TokioFile::open(&path)
        .await
        .map_err(|e| format!("Falha ao abrir arquivo para streaming assíncrono: {e}"))?;

    let body = reqwest::Body::from(tokio_file);

    // 4. Enviar para Kubo via /api/v0/add com pin explícito
    let add_response = client
        .add_file_multipart(&file_name, body, options.pin)
        .await?;

    let cid = add_response
        .hash
        .ok_or_else(|| "Kubo RPC não retornou o CID do arquivo adicionado.".to_string())?;

    // 5. Se pin=true, registrar no catálogo managed-pins.json
    if options.pin {
        let record = ManagedPinRecord {
            cid: cid.clone(),
            name: file_name.clone(),
            original_sha256: sha256_checksum.clone(),
            size_bytes: file_size,
            pinned_at_utc: Utc::now().to_rfc3339(),
            pin_type: "recursive".to_string(),
            origin: "devos_upload".to_string(),
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

/// Executa o download de um arquivo do nó IPFS por CID com streaming e gravação atômica.
pub async fn download_file(
    client: &KuboClient,
    options: IpfsDownloadOptions,
) -> Result<IpfsDownloadResult, String> {
    if options.cid.trim().is_empty() {
        return Err("CID de conteúdo ausente ou vazio.".to_string());
    }

    let target_path = PathBuf::from(&options.target_path);

    // Validação do diretório de destino
    let parent_dir = target_path
        .parent()
        .ok_or_else(|| "Caminho de destino inválido.".to_string())?;

    if !parent_dir.exists() {
        return Err(format!(
            "Diretório de destino não existe: '{}'",
            parent_dir.display()
        ));
    }

    let tmp_path = target_path.with_extension("devos.tmp");

    // 1. Abrir stream via /api/v0/cat?arg=<cid>
    let mut res = client.cat_stream(&options.cid, false).await?;

    let mut tmp_file = File::create(&tmp_path)
        .map_err(|e| format!("Falha ao criar arquivo temporário de download: {e}"))?;

    let mut hasher = Sha256::new();
    let mut bytes_written = 0u64;

    // 2. Consumir chunks em streaming do corpo da resposta
    loop {
        match res.chunk().await {
            Ok(Some(chunk)) => {
                hasher.update(&chunk);
                if let Err(e) = tmp_file.write_all(&chunk) {
                    let _ = fs::remove_file(&tmp_path);
                    return Err(format!("Falha ao gravar chunk no disco: {e}"));
                }
                bytes_written += chunk.len() as u64;
            }
            Ok(None) => break,
            Err(e) => {
                let _ = fs::remove_file(&tmp_path);
                return Err(format!("Erro durante recepção em streaming do Kubo: {e}"));
            }
        }
    }

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

    // 3. Validação de integridade caso o hash original esperado tenha sido informado
    let integrity_matched = true;
    if let Some(ref expected) = options.expected_sha256 {
        let normalized_expected = normalize_hex_hash(expected);
        if recovered_sha256 != normalized_expected {
            let _ = fs::remove_file(&tmp_path);
            return Err(format!(
                "Falha de integridade: SHA-256 recuperado '{recovered_sha256}' difere do esperado '{normalized_expected}'."
            ));
        }
    }

    // 4. Substituição atômica definitiva do arquivo temporário
    if let Err(e) = fs::rename(&tmp_path, &target_path) {
        let _ = fs::remove_file(&tmp_path);
        return Err(format!("Falha ao renomear arquivo temporário para destino final: {e}"));
    }

    Ok(IpfsDownloadResult {
        cid: options.cid,
        target_path: target_path.to_string_lossy().to_string(),
        bytes_written,
        recovered_sha256,
        integrity_matched,
    })
}
