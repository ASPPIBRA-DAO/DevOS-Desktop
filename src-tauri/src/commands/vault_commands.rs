use std::fmt::Display;
use std::path::PathBuf;

use tauri::State;
use zeroize::Zeroizing;

use crate::modules::vault::access_control::{
    AccessControlError, VaultHeaderV2, VaultSession, VaultStatus,
};
use crate::modules::vault::encryption::{AadDomain, Subkeys, VaultCrypto, WalletTargetTag};
use crate::storage::local_database::{LocalDatabase, StorageError};

// ----------------------------------------------------------------------
// Tratamento centralizado de erros
// ----------------------------------------------------------------------

/// Registra o erro técnico internamente e retorna uma mensagem
/// controlada para a interface IPC.
///
/// Não registrar senhas, segredos decifrados ou outros dados sensíveis.
fn map_storage_error(
    operation: &'static str,
    error: impl Display,
    public_message: &'static str,
) -> String {
    log::error!("[Vault Security] {}: {}", operation, error);
    public_message.to_string()
}

// ----------------------------------------------------------------------
// Validação de entradas
// ----------------------------------------------------------------------

/// Valida o tamanho de uma senha mestre sem modificar seu conteúdo.
///
/// O limite de bytes é verificado antes de contar caracteres para evitar
/// percorrer uma string excessivamente grande.
///
/// Cada caractere Unicode armazenado em UTF-8 ocupa no máximo quatro
/// bytes. Portanto, uma senha com mais de 512 bytes necessariamente
/// excede o limite de 128 caracteres Unicode.
fn validate_master_password_size(password: &str) -> Result<usize, String> {
    if password.is_empty() {
        return Err("A senha mestre é obrigatória.".to_string());
    }

    if password.len() > 512 {
        return Err(
            "VAULT_ERR_INVALID_LENGTH: A senha mestre não pode exceder 128 caracteres.".to_string(),
        );
    }

    let char_count = password.chars().count();
    if char_count > 128 {
        return Err(
            "VAULT_ERR_INVALID_LENGTH: A senha mestre não pode exceder 128 caracteres.".to_string(),
        );
    }

    Ok(char_count)
}

/// Rejeita espaços e caracteres invisíveis nas extremidades da senha.
///
/// Os espaços internos continuam permitidos. A senha não é normalizada
/// nem alterada antes de ser enviada à camada criptográfica.
fn is_marginal_whitespace_or_invisible(c: char) -> bool {
    c.is_whitespace() || c == '\u{FEFF}' || c == '\u{200B}' || c == '\u{00A0}'
}

/// Valida os requisitos da senha durante a inicialização.
fn validate_setup_password(password: &str) -> Result<(), String> {
    let char_count = validate_master_password_size(password)?;

    if char_count < 12 {
        return Err(
            "VAULT_ERR_INVALID_LENGTH: A senha mestre deve possuir pelo menos 12 caracteres para garantir a segurança criptográfica institucional.".to_string(),
        );
    }

    let starts_with_whitespace = password
        .chars()
        .next()
        .map(is_marginal_whitespace_or_invisible)
        .unwrap_or(false);

    let ends_with_whitespace = password
        .chars()
        .last()
        .map(is_marginal_whitespace_or_invisible)
        .unwrap_or(false);

    if starts_with_whitespace || ends_with_whitespace {
        return Err(
            "VAULT_ERR_MARGINAL_WHITESPACE: A senha mestre não pode conter espaços, quebras de linha ou caracteres invisíveis no início ou no fim.".to_string(),
        );
    }

    Ok(())
}

/// Converte um caminho fornecido pelo chamador em PathBuf,
/// rejeitando entradas vazias ou contendo apenas espaços.
fn parse_non_empty_path(raw_path: String, purpose: &'static str) -> Result<PathBuf, String> {
    if raw_path.trim().is_empty() {
        return Err(format!(
            "VAULT_ERR_INVALID_PATH: O caminho de {} não foi informado.",
            purpose
        ));
    }

    Ok(PathBuf::from(raw_path))
}

/// Calcula o hash SHA-256 de um arquivo de forma streaming através de chunks de 64 KiB,
/// evitando carregar arquivos grandes inteiramente na memória RAM.
fn compute_file_sha256(path: &std::path::Path) -> Result<String, String> {
    use sha2::{Digest, Sha256};
    use std::fs::File;
    use std::io::Read;

    let mut file = File::open(path).map_err(|e| format!("Falha ao abrir arquivo: {}", e))?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 65536];
    loop {
        let n = file
            .read(&mut buffer)
            .map_err(|e| format!("Falha na leitura do arquivo: {}", e))?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }
    Ok(hex::encode(hasher.finalize()))
}

/// Verifica a senha mestre contra o cabeçalho V2 (ou V1 legado).
fn verify_vault_password(db: &LocalDatabase, master_password: &str) -> Result<bool, String> {
    if let Some(h2) = db.get_header_v2().map_err(|e| e.to_string())? {
        return Ok(h2.unlock(master_password, "devos-desktop").is_ok());
    }
    if let Some(h1) = db.get_header().map_err(|e| e.to_string())? {
        return Ok(h1.verify_password(master_password));
    }
    Err("Cofre não inicializado.".to_string())
}

// ----------------------------------------------------------------------
// Consulta do estado do cofre
// ----------------------------------------------------------------------

#[tauri::command]
pub fn get_vault_status(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
) -> Result<VaultStatus, String> {
    let is_unlocked = session.is_unlocked();

    db.get_status(is_unlocked).map_err(|error| {
        map_storage_error(
            "Falha ao consultar o estado do cofre",
            error,
            "VAULT_STORAGE_ERR: Falha de acesso ao armazenamento seguro local.",
        )
    })
}

// ----------------------------------------------------------------------
// Inicialização do cofre
// ----------------------------------------------------------------------

#[tauri::command]
pub fn init_master_password(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
    master_password: String,
) -> Result<bool, String> {
    // 1. Encapsulamento IMEDIATO na entrada: qualquer retorno de erro ou término de escopo zera a memória RAM do heap
    let master_password = Zeroizing::new(master_password);

    // 2. Validação rigorosa de tamanho e caracteres marginais
    validate_setup_password(&master_password)?;

    // 3. Verificação antecipada (Fail-Fast):
    let is_v2_init = db
        .get_header_v2()
        .map_err(|error| {
            map_storage_error(
                "Falha ao consultar a inicialização do cofre",
                error,
                "VAULT_ERR_STORAGE: Não foi possível consultar o estado do cofre.",
            )
        })?
        .is_some();

    let is_v1_init = db
        .get_header()
        .map_err(|error| {
            map_storage_error(
                "Falha ao consultar a inicialização do cofre",
                error,
                "VAULT_ERR_STORAGE: Não foi possível consultar o estado do cofre.",
            )
        })?
        .is_some();

    if is_v2_init || is_v1_init {
        return Err(
            "VAULT_ERR_ALREADY_INITIALIZED: O cofre já foi inicializado anteriormente.".to_string(),
        );
    }

    // 4. Criação do cabeçalho V2 (geração da DEK de 256 bits e empacotamento com KEK derivada)
    let (header_v2, dek) =
        VaultHeaderV2::init(&master_password, "devos-desktop").map_err(|error| {
            map_storage_error(
                "Falha ao construir o cabeçalho criptográfico V2",
                error,
                "VAULT_ERR_CRYPTO: Falha ao preparar os dados criptográficos do cofre.",
            )
        })?;

    // 5. Persistência atômica definitiva com bloqueio imediato SQLite (garantia final contra condições de corrida)
    db.save_header_v2(&header_v2).map_err(|error| match error {
        StorageError::AlreadyInitialized => {
            "VAULT_ERR_ALREADY_INITIALIZED: O cofre já foi inicializado anteriormente.".to_string()
        }
        other => map_storage_error(
            "Falha ao persistir a inicialização do cofre",
            other,
            "VAULT_ERR_STORAGE: Não foi possível persistir o cofre no armazenamento seguro.",
        ),
    })?;

    let epoch = session.current_epoch();
    session
        .unlock_with_dek(epoch, zeroize::Zeroizing::new(*dek))
        .map_err(|e| e.to_string())?;

    Ok(true)
}

// ----------------------------------------------------------------------
// Desbloqueio do cofre
// ----------------------------------------------------------------------

#[tauri::command]
pub fn unlock_vault(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
    master_password: String,
) -> Result<bool, String> {
    let master_password = Zeroizing::new(master_password);

    validate_master_password_size(&master_password)?;

    let epoch_at_start = session.current_epoch();

    // 1. Tenta carregar o cabeçalho V2 (KEK / DEK)
    let header_v2 = db.get_header_v2().map_err(|error| {
        map_storage_error(
            "Falha ao ler cabeçalho V2",
            error,
            "VAULT_STORAGE_ERR: Falha ao ler o cabeçalho do cofre.",
        )
    })?;

    if let Some(h2) = header_v2 {
        let dek = h2
            .unlock(&master_password, "devos-desktop")
            .map_err(|_| "Senha mestre incorreta.".to_string())?;

        session
            .unlock_with_dek(epoch_at_start, dek)
            .map_err(|error| format!("Falha ao desbloquear sessão: {}", error))?;

        return Ok(true);
    }

    // 2. Se não houver V2, verifica se existe cabeçalho V1 para migração automática transparente
    let header_v1 = db
        .get_header()
        .map_err(|error| {
            map_storage_error(
                "Falha ao ler cabeçalho V1",
                error,
                "VAULT_STORAGE_ERR: Falha ao ler o cabeçalho do cofre.",
            )
        })?
        .ok_or_else(|| "Cofre não inicializado. Crie a senha mestre primeiro.".to_string())?;

    if !header_v1.verify_password(&master_password) {
        return Err("Senha mestre incorreta.".to_string());
    }

    // Executa a migração atômica V1 -> V2
    db.migrate_v1_to_v2(&master_password)
        .map_err(|e| format!("Falha na migração criptográfica V1 -> V2: {}", e))?;

    let new_h2 = db
        .get_header_v2()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Falha ao recuperar o novo cabeçalho V2 após migração.".to_string())?;

    let dek = new_h2
        .unlock(&master_password, "devos-desktop")
        .map_err(|_| "Senha mestre incorreta.".to_string())?;

    session
        .unlock_with_dek(epoch_at_start, dek)
        .map_err(|error| format!("Falha ao desbloquear sessão: {}", error))?;

    Ok(true)
}

// ----------------------------------------------------------------------
// Bloqueio do cofre
// ----------------------------------------------------------------------

#[tauri::command]
pub fn lock_vault(session: State<'_, VaultSession>) -> Result<bool, String> {
    session.lock();
    Ok(true)
}

// ----------------------------------------------------------------------
// Exportação de um segredo autorizado
// ----------------------------------------------------------------------

#[tauri::command]
pub fn export_authorized_secret(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
    master_password: String,
    vault_id: String,
) -> Result<String, String> {
    let epoch_at_start = session.current_epoch();

    let _op_guard = session
        .acquire_operation()
        .map_err(|_| "Acesso negado: o cofre precisa estar desbloqueado.".to_string())?;

    if session.current_epoch() != epoch_at_start {
        return Err("Acesso negado: o cofre precisa estar desbloqueado.".to_string());
    }

    let master_password = Zeroizing::new(master_password);

    validate_master_password_size(&master_password)?;

    // 1. Tenta recuperar segredo V2
    let secret_v2 = db
        .get_secret_v2_by_vault_id(&vault_id)
        .map_err(|e| e.to_string())?;

    if let Some(s2) = secret_v2 {
        let tag = if s2.target.eq_ignore_ascii_case("DAO") {
            WalletTargetTag::Dao
        } else {
            WalletTargetTag::Client
        };
        let aad = AadDomain::WalletMnemonic {
            vault_id: &vault_id,
            target: tag,
        }
        .to_canonical_bytes();

        let decrypted_bytes = session
            .with_dek(|dek| {
                let subkey = Subkeys::derive_wallets_key(dek);
                VaultCrypto::decrypt_with_aead(&subkey, &s2.envelope, &aad)
                    .map_err(AccessControlError::Crypto)
            })
            .map_err(|e| format!("Falha na decifragem do segredo V2: {}", e))?;

        let plaintext =
            Zeroizing::new(String::from_utf8(decrypted_bytes.to_vec()).map_err(|_| {
                "O conteúdo decifrado não possui codificação UTF-8 válida.".to_string()
            })?);

        return Ok((*plaintext).clone());
    }

    // 2. Fallback para segredo V1 (se ainda não migrado)
    let secret_v1 = db
        .get_secret_by_vault_id(&vault_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Registro criptográfico não encontrado.".to_string())?;

    let decrypted = VaultCrypto::decrypt(&master_password, &secret_v1.envelope)
        .map_err(|_| "Falha ao decifrar envelope V1.".to_string())?;

    let plaintext =
        Zeroizing::new(String::from_utf8(decrypted).map_err(|_| {
            "O conteúdo decifrado não possui codificação UTF-8 válida.".to_string()
        })?);

    Ok((*plaintext).clone())
}

// ----------------------------------------------------------------------
// Exportação de backup
// ----------------------------------------------------------------------

#[tauri::command]
pub fn export_vault_backup(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
    master_password: String,
    destination_path: String,
) -> Result<u64, String> {
    let destination = parse_non_empty_path(destination_path, "destino do backup")?;

    let epoch_at_start = session.current_epoch();

    let _op_guard = session
        .acquire_operation()
        .map_err(|_| "Acesso negado: o cofre precisa estar desbloqueado.".to_string())?;

    if session.current_epoch() != epoch_at_start {
        return Err("Acesso negado: o cofre precisa estar desbloqueado.".to_string());
    }

    let master_password = Zeroizing::new(master_password);

    validate_master_password_size(&master_password)?;

    let is_valid = verify_vault_password(&db, &master_password)?;
    if !is_valid {
        return Err("Senha mestre incorreta. Exportação de backup cancelada.".to_string());
    }

    if !session.is_unlocked() || session.current_epoch() != epoch_at_start {
        return Err(
            "A sessão do cofre foi invalidada durante a autorização do backup.".to_string(),
        );
    }

    let file_len = db.export_backup(&destination).map_err(|error| {
        map_storage_error(
            "Falha ao exportar o backup",
            error,
            "VAULT_STORAGE_ERR: Não foi possível exportar o backup do cofre.",
        )
    })?;

    // 2. Calcula SHA-256 do snapshot SQLite exportado de forma streaming e autentica o manifesto via AEAD (DEVOS/BACKUP/V2)
    let sqlite_sha256 = compute_file_sha256(&destination)?;

    let now_ts = chrono::Utc::now().timestamp();
    let manifest_bytes = serde_json::to_vec(&serde_json::json!({
        "version": 2,
        "vault_scope": "devos-desktop",
        "backup_destination": destination.to_string_lossy(),
        "timestamp": now_ts,
        "file_bytes": file_len,
        "sqlite_sha256": sqlite_sha256,
    }))
    .map_err(|e| e.to_string())?;

    let manifest_envelope = session
        .with_dek(|dek| {
            VaultCrypto::seal_backup_payload(dek, now_ts, &manifest_bytes)
                .map_err(AccessControlError::Crypto)
        })
        .map_err(|e| format!("Falha ao selar manifesto criptográfico do backup: {}", e))?;

    let manifest_path = destination.with_extension("manifest.json");
    let manifest_file_content = serde_json::to_string_pretty(&serde_json::json!({
        "version": 2,
        "timestamp": now_ts,
        "envelope": manifest_envelope,
    }))
    .map_err(|e| e.to_string())?;
    std::fs::write(&manifest_path, manifest_file_content)
        .map_err(|e| format!("Falha ao gravar manifesto do backup: {}", e))?;

    Ok(file_len)
}

// ----------------------------------------------------------------------
// Restauração de backup
// ----------------------------------------------------------------------

#[tauri::command]
pub fn restore_vault_backup(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
    master_password: String,
    source_path: String,
) -> Result<bool, String> {
    let master_password = Zeroizing::new(master_password);

    validate_master_password_size(&master_password)?;

    let source = parse_non_empty_path(source_path, "origem do backup")?;
    if !source.exists() {
        return Err(format!(
            "Arquivo de backup não encontrado: {}",
            source.display()
        ));
    }

    // 1. Inspeciona o arquivo SQLite de backup para verificar se possui cabeçalho V2
    let temp_conn = rusqlite::Connection::open_with_flags(
        &source,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(|e| format!("Falha ao inspecionar integridade do backup: {}", e))?;

    let has_v2_table: bool = temp_conn
        .query_row(
            "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='vault_header_v2'",
            [],
            |r| r.get::<_, i64>(0),
        )
        .map(|c| c > 0)
        .unwrap_or(false);

    let manifest_path = source.with_extension("manifest.json");

    if has_v2_table || manifest_path.exists() {
        // V2 backup: manifesto autenticado é OBRIGATÓRIO (VLT-004)
        if !manifest_path.exists() {
            return Err(
                "Restauração de backup V2 cancelada: manifesto criptográfico '.manifest.json' obrigatório não encontrado."
                    .to_string(),
            );
        }

        let computed_sha256 = compute_file_sha256(&source)?;
        let source_file_len = std::fs::metadata(&source)
            .map_err(|e| format!("Falha ao obter metadados do backup: {}", e))?
            .len();

        let manifest_json = std::fs::read_to_string(&manifest_path)
            .map_err(|e| format!("Falha ao ler manifesto do backup: {}", e))?;

        let (manifest_ts, env) =
            if let Ok(wrapper) = serde_json::from_str::<serde_json::Value>(&manifest_json) {
                if let (Some(ts), Some(env_val)) = (
                    wrapper.get("timestamp").and_then(|v| v.as_i64()),
                    wrapper.get("envelope"),
                ) {
                    let env: crate::modules::vault::encryption::AeadEnvelope =
                        serde_json::from_value(env_val.clone())
                            .map_err(|e| format!("Envelope inválido: {}", e))?;
                    (ts, env)
                } else {
                    let env: crate::modules::vault::encryption::AeadEnvelope =
                        serde_json::from_str(&manifest_json)
                            .map_err(|e| format!("Manifesto inválido: {}", e))?;
                    (0i64, env)
                }
            } else {
                return Err("Formato de manifesto corrompido ou ilegível.".to_string());
            };

        let wrapped_dek_json: String = temp_conn
            .query_row(
                "SELECT wrapped_dek FROM vault_header_v2 WHERE id = 1",
                [],
                |r| r.get(0),
            )
            .map_err(|e| format!("Cabeçalho V2 não encontrado no backup: {}", e))?;

        let wrapped_dek: crate::modules::vault::encryption::WrappedDekEnvelope =
            serde_json::from_str(&wrapped_dek_json)
                .map_err(|e| format!("Cabeçalho V2 no backup corrompido: {}", e))?;

        let h2 = crate::modules::vault::access_control::VaultHeaderV2 {
            version: 2,
            wrapped_dek,
            created_at: String::new(),
        };

        let source_dek = h2.unlock(&master_password, "devos-desktop").map_err(|_| {
            "Senha mestre incorreta para validação do manifesto de backup.".to_string()
        })?;

        let manifest_payload =
            VaultCrypto::unseal_backup_payload(&source_dek, manifest_ts, &env)
                .map_err(|e| format!("Falha na autenticação simétrica do manifesto AEAD: {}", e))?;

        let manifest_val: serde_json::Value = serde_json::from_slice(&manifest_payload)
            .map_err(|e| format!("Payload corrompido no manifesto de backup: {}", e))?;

        let expected_sha256 = manifest_val
            .get("sqlite_sha256")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Manifesto inválido: campo 'sqlite_sha256' ausente.".to_string())?;

        if expected_sha256 != computed_sha256 {
            return Err(
                "Falha de integridade: o hash SHA-256 do arquivo SQLite não confere com o manifesto autenticado."
                    .to_string(),
            );
        }

        let expected_bytes = manifest_val
            .get("file_bytes")
            .and_then(|v| v.as_u64())
            .ok_or_else(|| "Manifesto inválido: campo 'file_bytes' ausente.".to_string())?;

        if expected_bytes != source_file_len {
            return Err(
                "Falha de integridade: o tamanho do arquivo SQLite não confere com o manifesto autenticado."
                    .to_string(),
            );
        }
    }

    // 2. Valida a senha contra o cofre atual antes de qualquer alteração
    let is_valid = verify_vault_password(&db, &master_password)?;
    if !is_valid {
        return Err("Senha mestre incorreta. Restauração de backup cancelada.".to_string());
    }

    // 3. Bloqueia a sessão antes de qualquer substituição do armazenamento (Fail-Closed).
    session.lock();

    // 4. Executa a restauração no banco de dados local
    db.restore_backup(&source).map_err(|error| {
        map_storage_error(
            "Falha ao restaurar o backup",
            error,
            "VAULT_STORAGE_ERR: Não foi possível restaurar o backup do cofre.",
        )
    })?;

    Ok(true)
}

// ----------------------------------------------------------------------
// Rotação de senha mestre do cofre
// ----------------------------------------------------------------------

#[tauri::command]
pub fn rotate_vault_password(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
    current_password: String,
    new_password: String,
) -> Result<bool, String> {
    let current_password = Zeroizing::new(current_password);
    let new_password = Zeroizing::new(new_password);

    validate_master_password_size(&current_password)?;
    validate_setup_password(&new_password)?;

    let epoch_at_start = session.current_epoch();

    let _op_guard = session
        .acquire_operation()
        .map_err(|_| "Acesso negado: o cofre precisa estar desbloqueado.".to_string())?;

    if session.current_epoch() != epoch_at_start {
        return Err("Acesso negado: o cofre precisa estar desbloqueado.".to_string());
    }

    let header_v2 = db
        .get_header_v2()
        .map_err(|e| {
            map_storage_error(
                "Falha ao ler cabeçalho V2",
                e,
                "VAULT_STORAGE_ERR: Falha ao ler o cabeçalho do cofre.",
            )
        })?
        .ok_or_else(|| "Cofre V2 não inicializado ou migrado.".to_string())?;

    let rotated_header = header_v2
        .rotate_password(&current_password, &new_password, "devos-desktop")
        .map_err(|_| "Senha mestre atual incorreta.".to_string())?;

    db.rotate_vault_password_v2(&rotated_header).map_err(|e| {
        map_storage_error(
            "Falha ao persistir a rotação da senha mestre",
            e,
            "VAULT_STORAGE_ERR: Falha ao atualizar a senha mestre no armazenamento seguro.",
        )
    })?;

    Ok(true)
}
