use std::fmt::Display;
use std::path::PathBuf;

use tauri::State;
use zeroize::{Zeroize, Zeroizing};

use crate::storage::local_database::{LocalDatabase, StorageError};
use crate::vault::access_control::{VaultHeader, VaultSession, VaultStatus};
use crate::vault::encryption::VaultCrypto;

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
    master_password: String,
) -> Result<bool, String> {
    // 1. Encapsulamento IMEDIATO na entrada: qualquer retorno de erro ou término de escopo zera a memória RAM do heap
    let master_password = Zeroizing::new(master_password);

    // 2. Validação rigorosa de tamanho e caracteres marginais
    validate_setup_password(&master_password)?;

    // 3. Verificação antecipada (Fail-Fast):
    // Impede o custo computacional e de memória do Argon2id (64 MB) caso o cofre já esteja inicializado
    let existing_header = db.get_header().map_err(|error| {
        map_storage_error(
            "Falha ao consultar a inicialização do cofre",
            error,
            "VAULT_ERR_STORAGE: Não foi possível consultar o estado do cofre.",
        )
    })?;

    if existing_header.is_some() {
        return Err(
            "VAULT_ERR_ALREADY_INITIALIZED: O cofre já foi inicializado anteriormente.".to_string(),
        );
    }

    // 4. Criação do envelope canário com KDF pesado (Argon2id + AES-256-GCM) somente se o cofre estiver livre
    let header = VaultHeader::new(&master_password).map_err(|error| {
        map_storage_error(
            "Falha ao construir o cabeçalho criptográfico",
            error,
            "VAULT_ERR_CRYPTO: Falha ao preparar os dados criptográficos do cofre.",
        )
    })?;

    // 5. Persistência atômica definitiva com bloqueio imediato SQLite (garantia final contra condições de corrida)
    db.initialize_vault_if_absent(&header)
        .map_err(|error| match error {
            StorageError::AlreadyInitialized => {
                "VAULT_ERR_ALREADY_INITIALIZED: O cofre já foi inicializado anteriormente."
                    .to_string()
            }
            other => map_storage_error(
                "Falha ao persistir a inicialização do cofre",
                other,
                "VAULT_ERR_STORAGE: Não foi possível persistir o cofre no armazenamento seguro.",
            ),
        })?;

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

    let header = db
        .get_header()
        .map_err(|error| {
            map_storage_error(
                "Falha ao recuperar o cabeçalho para desbloqueio",
                error,
                "VAULT_STORAGE_ERR: Falha ao ler o cabeçalho do cofre.",
            )
        })?
        .ok_or_else(|| "Cofre não inicializado. Crie a senha mestre primeiro.".to_string())?;

    if !header.verify_password(&master_password) {
        return Err("Senha mestre incorreta.".to_string());
    }

    if session.try_unlock(epoch_at_start) {
        Ok(true)
    } else {
        Err(
            "Operação de desbloqueio abortada: o cofre foi bloqueado concorrentemente.".to_string(),
        )
    }
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

    if !session.is_unlocked() || session.current_epoch() != epoch_at_start {
        return Err("Acesso negado: o cofre precisa estar desbloqueado.".to_string());
    }

    let master_password = Zeroizing::new(master_password);

    validate_master_password_size(&master_password)?;

    let header = db
        .get_header()
        .map_err(|error| {
            map_storage_error(
                "Falha ao recuperar o cabeçalho durante a exportação de segredo",
                error,
                "VAULT_STORAGE_ERR: Não foi possível consultar o cofre.",
            )
        })?
        .ok_or_else(|| "Cofre não inicializado.".to_string())?;

    if !header.verify_password(&master_password) {
        return Err("Senha mestre incorreta. Acesso aos segredos negado.".to_string());
    }

    let secret = db
        .get_secret_by_vault_id(&vault_id)
        .map_err(|error| {
            map_storage_error(
                "Falha ao consultar o registro criptográfico",
                error,
                "VAULT_STORAGE_ERR: Não foi possível consultar o registro criptográfico.",
            )
        })?
        .ok_or_else(|| "Registro criptográfico do cofre não encontrado.".to_string())?;

    let decrypted_bytes = VaultCrypto::decrypt(&master_password, &secret.envelope).map_err(|_| {
        "Falha ao decifrar o envelope do cofre. Dados corrompidos ou chave inválida.".to_string()
    })?;

    let mut plaintext = match String::from_utf8(decrypted_bytes) {
        Ok(value) => value,
        Err(error) => {
            let mut invalid_bytes = error.into_bytes();
            invalid_bytes.zeroize();
            return Err("O conteúdo decifrado não possui uma codificação UTF-8 válida.".to_string());
        }
    };

    if !session.is_unlocked() || session.current_epoch() != epoch_at_start {
        plaintext.zeroize();
        return Err(
            "A sessão do cofre foi invalidada durante a exportação. Operação cancelada.".to_string(),
        );
    }

    Ok(plaintext)
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

    if !session.is_unlocked() || session.current_epoch() != epoch_at_start {
        return Err("Acesso negado: o cofre precisa estar desbloqueado.".to_string());
    }

    let master_password = Zeroizing::new(master_password);

    validate_master_password_size(&master_password)?;

    let header = db
        .get_header()
        .map_err(|error| {
            map_storage_error(
                "Falha ao consultar o cabeçalho para backup",
                error,
                "VAULT_STORAGE_ERR: Não foi possível consultar o cofre para exportação.",
            )
        })?
        .ok_or_else(|| "Cofre não inicializado.".to_string())?;

    if !header.verify_password(&master_password) {
        return Err("Senha mestre incorreta. Exportação de backup cancelada.".to_string());
    }

    if !session.is_unlocked() || session.current_epoch() != epoch_at_start {
        return Err(
            "A sessão do cofre foi invalidada durante a autorização do backup.".to_string(),
        );
    }

    db.export_backup(&destination).map_err(|error| {
        map_storage_error(
            "Falha ao exportar o backup",
            error,
            "VAULT_STORAGE_ERR: Não foi possível exportar o backup do cofre.",
        )
    })
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

    let existing_header = db.get_header().map_err(|error| {
        map_storage_error(
            "Falha ao consultar o cabeçalho antes da restauração",
            error,
            "VAULT_STORAGE_ERR: Não foi possível verificar o estado atual do cofre.",
        )
    })?;

    if let Some(header) = existing_header
        && !header.verify_password(&master_password)
    {
        return Err("Senha mestre incorreta. Restauração de backup cancelada.".to_string());
    }

    // Bloqueia a sessão antes de qualquer substituição do armazenamento (Fail-Closed).
    session.lock();

    db.restore_backup(&source).map_err(|error| {
        map_storage_error(
            "Falha ao restaurar o backup",
            error,
            "VAULT_STORAGE_ERR: Não foi possível restaurar o backup do cofre.",
        )
    })?;

    Ok(true)
}
