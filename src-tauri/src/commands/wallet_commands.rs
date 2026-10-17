use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use serde::{Deserialize, Serialize};

use crate::storage::local_database::{LocalDatabase, StoredSecret, StoredWallet};
use crate::storage::migrations::MigrationManager;
use crate::vault::access_control::{VaultHeader, VaultStatus};
use crate::vault::encryption::VaultCrypto;
use crate::wallets::creation_session::GLOBAL_CREATION_STORE;
use crate::wallets::derivation::{DerivationService, DerivedWalletPreview};
use crate::wallets::mnemonic::MnemonicService;
use zeroize::Zeroize;

fn get_db(app: &AppHandle) -> Result<LocalDatabase, String> {
    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Falha ao resolver diretório de dados: {}", e))?
        .join("devos_vault");

    let db = LocalDatabase::new(base_dir);
    MigrationManager::run_migrations(&db).map_err(|e| format!("Erro nas migrações locais: {}", e))?;
    Ok(db)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratePreviewResponse {
    pub session_id: String,
    pub words_count: usize,
    pub previews: Vec<DerivedWalletPreview>,
    pub mnemonic: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SaveWalletsRequest {
    pub master_password: String,
    pub session_id: Option<String>,
    pub mnemonic: Option<String>,
    pub target: String, // "DAO" | "CLIENT"
    pub network: String,
    pub previews: Vec<DerivedWalletPreview>,
    pub client_name: Option<String>,
    pub client_doc: Option<String>,
}

#[tauri::command]
pub fn get_vault_status(app: AppHandle) -> Result<VaultStatus, String> {
    let db = get_db(&app)?;
    db.get_status(false).map_err(|e| e.to_string())
}

fn is_marginal_whitespace_or_invisible(c: char) -> bool {
    c.is_whitespace() || c == '\u{FEFF}' || c == '\u{200B}' || c == '\u{00A0}'
}

#[tauri::command]
pub fn init_master_password(app: AppHandle, master_password: String) -> Result<bool, String> {
    // 1. Encapsulamento IMEDIATO na entrada: qualquer retorno de erro ou término de escopo zera a memória RAM do heap
    let master_password = zeroize::Zeroizing::new(master_password);

    // 2. Contagem rigorosa de caracteres Unicode (Code Points)
    let char_count = master_password.chars().count();
    if char_count < 12 {
        return Err("VAULT_ERR_INVALID_LENGTH: A senha mestre deve possuir pelo menos 12 caracteres para garantir a segurança criptográfica institucional.".to_string());
    }
    if char_count > 128 {
        return Err("VAULT_ERR_INVALID_LENGTH: A senha mestre não pode exceder 128 caracteres.".to_string());
    }

    // 3. Verificação estrita de qualquer caractere Unicode Whitespace ou invisível nas extremidades (inclui U+FEFF, U+200B, U+00A0)
    let starts_with_whitespace = master_password.chars().next().map(is_marginal_whitespace_or_invisible).unwrap_or(false);
    let ends_with_whitespace = master_password.chars().last().map(is_marginal_whitespace_or_invisible).unwrap_or(false);
    if starts_with_whitespace || ends_with_whitespace {
        return Err("VAULT_ERR_MARGINAL_WHITESPACE: A senha mestre não pode conter espaços, quebras de linha ou caracteres invisíveis no início ou no fim.".to_string());
    }

    // 4. Obtenção do banco e VERIFICAÇÃO ANTECIPADA (Fail-Fast):
    // Impede o custo computacional e de memória do Argon2id (64 MB) caso o cofre já esteja inicializado
    let db = get_db(&app).map_err(|e| format!("VAULT_ERR_STORAGE: Falha ao acessar armazenamento local: {}", e))?;
    if db.get_header().map_err(|e| format!("VAULT_ERR_STORAGE: {}", e))?.is_some() {
        return Err("VAULT_ERR_ALREADY_INITIALIZED: O cofre já foi inicializado anteriormente.".to_string());
    }

    // 5. Criação do envelope canário com KDF pesado (Argon2id + AES-256-GCM) somente se o cofre estiver livre
    let header = VaultHeader::new(&master_password).map_err(|e| format!("VAULT_ERR_CRYPTO: {}", e))?;

    // 6. Persistência atômica definitiva com bloqueio imediato SQLite (garantia final contra condições de corrida)
    db.initialize_vault_if_absent(&header).map_err(|e| {
        match e {
            crate::storage::local_database::StorageError::AlreadyInitialized => {
                "VAULT_ERR_ALREADY_INITIALIZED: O cofre já foi inicializado anteriormente.".to_string()
            }
            _ => format!("VAULT_ERR_STORAGE: {}", e),
        }
    })?;

    Ok(true)
}

#[tauri::command]
pub fn unlock_vault(app: AppHandle, master_password: String) -> Result<bool, String> {
    let db = get_db(&app)?;
    let header = db.get_header().map_err(|e| e.to_string())?
        .ok_or_else(|| "Cofre não inicializado. Crie a senha mestre primeiro.".to_string())?;

    if header.verify_password(&master_password) {
        Ok(true)
    } else {
        Err("Senha mestre incorreta.".to_string())
    }
}

/// Gera uma nova mnemônica de forma segura, armazena em sessão efêmera (Rust Zeroize)
/// e retorna os previews dos endereços SEM transferir o texto puro da mnemônica por padrão.
#[tauri::command]
pub fn generate_seed_and_preview(
    word_count: usize,
    _target: String,
    account_branch: u32,
    count: u32,
    base_label: String,
    network: String,
) -> Result<GeneratePreviewResponse, String> {
    let mnemonic = MnemonicService::generate(word_count)
        .map_err(|e| format!("Falha na geração da mnemônica: {}", e))?;

    let seed = MnemonicService::to_seed(&mnemonic, "")
        .map_err(|e| format!("Falha na derivação da seed: {}", e))?;

    let previews = DerivationService::derive_batch(&seed, account_branch, count, &base_label, &network)
        .map_err(|e| format!("Falha ao derivar carteiras EVM: {}", e))?;

    // Registra a mnemônica exclusivamente na memória segura do Rust (Zeroize + 5 min TTL)
    let session_id = GLOBAL_CREATION_STORE.create_session(mnemonic);

    Ok(GeneratePreviewResponse {
        session_id,
        words_count: word_count,
        previews,
        mnemonic: None, // Frase retida no Rust por design de segurança!
    })
}

/// Revela a mnemônica efêmera da sessão mediante autorização explícita comprovada por senha mestre
#[tauri::command]
pub fn reveal_pending_mnemonic(
    app: AppHandle,
    session_id: String,
    master_password: String,
) -> Result<String, String> {
    let db = get_db(&app)?;
    let header = db.get_header().map_err(|e| e.to_string())?
        .ok_or_else(|| "Cofre não inicializado. Defina a senha mestre antes de inspecionar segredos.".to_string())?;

    if !header.verify_password(&master_password) {
        return Err("Senha mestre inválida. Autorização negada para revelação da frase mnemônica.".to_string());
    }

    let zeroizing_phrase = GLOBAL_CREATION_STORE
        .get_mnemonic(&session_id)
        .ok_or_else(|| "Sessão de criação expirada ou inexistente. Gere as carteiras novamente.".to_string())?;

    Ok(zeroizing_phrase.to_string())
}

/// Cancela a criação pendente e destrói imediatamente o segredo da memória do Rust
#[tauri::command]
pub fn cancel_pending_creation(session_id: String) -> Result<bool, String> {
    Ok(GLOBAL_CREATION_STORE.cancel_session(&session_id))
}

/// Confirma e sela no cofre local consumindo atomicamente a sessão em Rust (sem eco de segredo)
#[tauri::command]
pub fn confirm_and_save_wallets(
    app: AppHandle,
    mut request: SaveWalletsRequest,
) -> Result<Vec<StoredWallet>, String> {
    let db = get_db(&app)?;

    // 1. Valida senha mestre
    let header = db.get_header().map_err(|e| e.to_string())?
        .ok_or_else(|| "Cofre não inicializado. Defina a senha mestre antes de salvar carteiras.".to_string())?;

    if !header.verify_password(&request.master_password) {
        request.master_password.zeroize();
        return Err("Senha mestre inválida. Operação de custódia cancelada.".to_string());
    }

    // 2. Obtém a mnemônica da sessão em Rust (ou fallback)
    let mut mnemonic = if let Some(ref sid) = request.session_id {
        GLOBAL_CREATION_STORE
            .consume_mnemonic(sid)
            .ok_or_else(|| {
                request.master_password.zeroize();
                "Sessão de criação expirada ou inválida. Gere as carteiras novamente.".to_string()
            })?
    } else if let Some(ref m) = request.mnemonic {
        zeroize::Zeroizing::new(m.clone())
    } else {
        request.master_password.zeroize();
        return Err("Nenhuma sessão de criação ativa ou mnemônica informada.".to_string());
    };

    if !MnemonicService::validate(&mnemonic) {
        mnemonic.zeroize();
        request.master_password.zeroize();
        return Err("Frase mnemônica inválida.".to_string());
    }

    // 3. Cifra o segredo com AES-256-GCM + Argon2id
    let envelope = VaultCrypto::encrypt(&request.master_password, mnemonic.as_bytes())
        .map_err(|e| {
            mnemonic.zeroize();
            request.master_password.zeroize();
            format!("Falha ao cifrar o envelope: {}", e)
        })?;

    let words_count = mnemonic.split_whitespace().count();
    // Limpa a mnemônica e senha mestre da memória nativa imediatamente após cifragem
    mnemonic.zeroize();
    request.master_password.zeroize();

    let now_ts = chrono::Utc::now().timestamp();
    let now_iso = chrono::Utc::now().format("%Y-%m-%d %H:%M").to_string();

    // 4. Cria ID de cofre independente e segregado (DAO vs Associado)
    let vault_id = if request.target == "DAO" {
        format!("dao_vault_{}_{}", now_ts, rand::random::<u16>())
    } else {
        let slug = request.client_name.as_deref().unwrap_or("client")
            .chars().filter(|c| c.is_alphanumeric()).take(10).collect::<String>();
        format!("client_vault_{}_{}_{}", slug, now_ts, rand::random::<u16>())
    };

    let secret_record = StoredSecret {
        vault_id: vault_id.clone(),
        target: request.target.clone(),
        envelope,
        created_at: now_iso.clone(),
    };
    db.save_secret(secret_record).map_err(|e| e.to_string())?;

    // 5. Salva os metadados públicos
    let current_wallets = db.list_wallets().map_err(|e| e.to_string())?;
    let start_id = if request.target == "DAO" {
        current_wallets.iter().filter(|w| w.target == "DAO").map(|w| w.id).max().unwrap_or(0) + 1
    } else {
        current_wallets.iter().filter(|w| w.target == "CLIENT").map(|w| w.id).max().unwrap_or(100) + 1
    };

    let new_stored: Vec<StoredWallet> = request.previews.into_iter().enumerate().map(|(idx, preview)| {
        let user_name = if request.target == "DAO" {
            "ASPPIBRA DAO".to_string()
        } else {
            request.client_name.clone().unwrap_or_else(|| preview.label.clone())
        };

        StoredWallet {
            id: start_id + (idx as u64),
            target: request.target.clone(),
            custody_type: "CUSTODIAL_LOCAL".to_string(),
            user: user_name,
            label: preview.label,
            derivation_path: preview.derivation_path,
            network: preview.network,
            address: preview.address,
            status: "ACTIVE".to_string(),
            kyc_status: "UNVERIFIED".to_string(),
            seed_words_count: words_count,
            created_at: now_iso.clone(),
            vault_id: Some(vault_id.clone()),
            client_doc: request.client_doc.clone(),
        }
    }).collect();

    let all_wallets = db.append_wallets(&new_stored).map_err(|e| e.to_string())?;
    Ok(all_wallets)
}

#[tauri::command]
pub fn list_stored_wallets(app: AppHandle) -> Result<Vec<StoredWallet>, String> {
    let db = get_db(&app)?;
    db.list_wallets().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_authorized_secret(
    app: AppHandle,
    master_password: String,
    vault_id: String,
) -> Result<String, String> {
    let db = get_db(&app)?;

    let header = db.get_header().map_err(|e| e.to_string())?
        .ok_or_else(|| "Cofre não inicializado.".to_string())?;

    if !header.verify_password(&master_password) {
        return Err("Senha mestre incorreta. Acesso aos segredos negado.".to_string());
    }

    let secret = db.get_secret_by_vault_id(&vault_id).map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Registro criptográfico para o cofre '{}' não encontrado.", vault_id))?;

    let decrypted_bytes = VaultCrypto::decrypt(&master_password, &secret.envelope)
        .map_err(|_| "Falha ao decifrar o envelope do cofre. Dados corrompidos ou chave inválida.".to_string())?;

    String::from_utf8(decrypted_bytes)
        .map_err(|e| format!("Erro de codificação UTF-8 na frase decifrada: {}", e))
}

#[tauri::command]
pub fn export_vault_backup(
    app: AppHandle,
    master_password: String,
    destination_path: String,
) -> Result<u64, String> {
    let db = get_db(&app)?;
    let header = db.get_header().map_err(|e| e.to_string())?
        .ok_or_else(|| "Cofre não inicializado.".to_string())?;

    if !header.verify_password(&master_password) {
        return Err("Senha mestre incorreta. Exportação de backup cancelada.".to_string());
    }

    let dest = PathBuf::from(destination_path);
    db.export_backup(&dest).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn restore_vault_backup(
    app: AppHandle,
    master_password: String,
    source_path: String,
) -> Result<bool, String> {
    let db = get_db(&app)?;
    let src = PathBuf::from(source_path);

    if let Ok(Some(header)) = db.get_header() {
        if !header.verify_password(&master_password) {
            return Err("Senha mestre incorreta. Restauração de backup cancelada.".to_string());
        }
    }

    db.restore_backup(&src).map_err(|e| e.to_string())?;
    Ok(true)
}
