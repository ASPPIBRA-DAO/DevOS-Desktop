use std::path::PathBuf;
use tauri::State;

use crate::storage::local_database::LocalDatabase;
use crate::vault::access_control::{VaultHeader, VaultStatus};
use crate::vault::encryption::VaultCrypto;

#[tauri::command]
pub fn get_vault_status(db: State<'_, LocalDatabase>) -> Result<VaultStatus, String> {
    db.get_status(false).map_err(|e| e.to_string())
}

fn is_marginal_whitespace_or_invisible(c: char) -> bool {
    c.is_whitespace() || c == '\u{FEFF}' || c == '\u{200B}' || c == '\u{00A0}'
}

#[tauri::command]
pub fn init_master_password(
    db: State<'_, LocalDatabase>,
    master_password: String,
) -> Result<bool, String> {
    // 1. Encapsulamento IMEDIATO na entrada: qualquer retorno de erro ou término de escopo zera a memória RAM do heap
    let master_password = zeroize::Zeroizing::new(master_password);

    // 2. Contagem rigorosa de caracteres Unicode (Code Points)
    let char_count = master_password.chars().count();
    if char_count < 12 {
        return Err("VAULT_ERR_INVALID_LENGTH: A senha mestre deve possuir pelo menos 12 caracteres para garantir a segurança criptográfica institucional.".to_string());
    }
    if char_count > 128 {
        return Err(
            "VAULT_ERR_INVALID_LENGTH: A senha mestre não pode exceder 128 caracteres.".to_string(),
        );
    }

    // 3. Verificação estrita de qualquer caractere Unicode Whitespace ou invisível nas extremidades (inclui U+FEFF, U+200B, U+00A0)
    let starts_with_whitespace = master_password
        .chars()
        .next()
        .map(is_marginal_whitespace_or_invisible)
        .unwrap_or(false);
    let ends_with_whitespace = master_password
        .chars()
        .last()
        .map(is_marginal_whitespace_or_invisible)
        .unwrap_or(false);
    if starts_with_whitespace || ends_with_whitespace {
        return Err("VAULT_ERR_MARGINAL_WHITESPACE: A senha mestre não pode conter espaços, quebras de linha ou caracteres invisíveis no início ou no fim.".to_string());
    }

    // 4. Obtenção do banco gerenciado e VERIFICAÇÃO ANTECIPADA (Fail-Fast):
    // Impede o custo computacional e de memória do Argon2id (64 MB) caso o cofre já esteja inicializado
    if db
        .get_header()
        .map_err(|e| format!("VAULT_ERR_STORAGE: {}", e))?
        .is_some()
    {
        return Err(
            "VAULT_ERR_ALREADY_INITIALIZED: O cofre já foi inicializado anteriormente.".to_string(),
        );
    }

    // 5. Criação do envelope canário com KDF pesado (Argon2id + AES-256-GCM) somente se o cofre estiver livre
    let header =
        VaultHeader::new(&master_password).map_err(|e| format!("VAULT_ERR_CRYPTO: {}", e))?;

    // 6. Persistência atômica definitiva com bloqueio imediato SQLite (garantia final contra condições de corrida)
    db.initialize_vault_if_absent(&header)
        .map_err(|e| match e {
            crate::storage::local_database::StorageError::AlreadyInitialized => {
                "VAULT_ERR_ALREADY_INITIALIZED: O cofre já foi inicializado anteriormente."
                    .to_string()
            }
            _ => format!("VAULT_ERR_STORAGE: {}", e),
        })?;

    Ok(true)
}

#[tauri::command]
pub fn unlock_vault(db: State<'_, LocalDatabase>, master_password: String) -> Result<bool, String> {
    let header = db
        .get_header()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Cofre não inicializado. Crie a senha mestre primeiro.".to_string())?;

    if header.verify_password(&master_password) {
        Ok(true)
    } else {
        Err("Senha mestre incorreta.".to_string())
    }
}

#[tauri::command]
pub fn export_authorized_secret(
    db: State<'_, LocalDatabase>,
    master_password: String,
    vault_id: String,
) -> Result<String, String> {
    let header = db
        .get_header()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Cofre não inicializado.".to_string())?;

    if !header.verify_password(&master_password) {
        return Err("Senha mestre incorreta. Acesso aos segredos negado.".to_string());
    }

    let secret = db
        .get_secret_by_vault_id(&vault_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| {
            format!(
                "Registro criptográfico para o cofre '{}' não encontrado.",
                vault_id
            )
        })?;

    let decrypted_bytes =
        VaultCrypto::decrypt(&master_password, &secret.envelope).map_err(|_| {
            "Falha ao decifrar o envelope do cofre. Dados corrompidos ou chave inválida."
                .to_string()
        })?;

    String::from_utf8(decrypted_bytes)
        .map_err(|e| format!("Erro de codificação UTF-8 na frase decifrada: {}", e))
}

#[tauri::command]
pub fn export_vault_backup(
    db: State<'_, LocalDatabase>,
    master_password: String,
    destination_path: String,
) -> Result<u64, String> {
    let header = db
        .get_header()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Cofre não inicializado.".to_string())?;

    if !header.verify_password(&master_password) {
        return Err("Senha mestre incorreta. Exportação de backup cancelada.".to_string());
    }

    let dest = PathBuf::from(destination_path);
    db.export_backup(&dest).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn restore_vault_backup(
    db: State<'_, LocalDatabase>,
    master_password: String,
    source_path: String,
) -> Result<bool, String> {
    let src = PathBuf::from(source_path);

    if let Ok(Some(header)) = db.get_header()
        && !header.verify_password(&master_password)
    {
        return Err("Senha mestre incorreta. Restauração de backup cancelada.".to_string());
    }

    db.restore_backup(&src).map_err(|e| e.to_string())?;
    Ok(true)
}
