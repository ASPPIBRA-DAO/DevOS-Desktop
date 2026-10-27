use serde::{Deserialize, Serialize};
use tauri::State;

use crate::storage::local_database::{LocalDatabase, StoredSecret, StoredWallet};
use crate::vault::access_control::VaultSession;
use crate::vault::encryption::VaultCrypto;
use crate::wallets::creation_session::GLOBAL_CREATION_STORE;
use crate::wallets::derivation::{DerivationService, DerivedWalletPreview};
use crate::wallets::mnemonic::MnemonicService;
use zeroize::Zeroize;

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

    let previews =
        DerivationService::derive_batch(&seed, account_branch, count, &base_label, &network)
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
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
    session_id: String,
    master_password: String,
) -> Result<String, String> {
    // Autorização de Backend Mandatória: cofre DEVE estar desbloqueado na sessão
    if !session.is_unlocked() {
        return Err("Acesso negado: o cofre precisa estar desbloqueado.".to_string());
    }

    let master_password = zeroize::Zeroizing::new(master_password);

    let header = db.get_header().map_err(|e| e.to_string())?.ok_or_else(|| {
        "Cofre não inicializado. Defina a senha mestre antes de inspecionar segredos.".to_string()
    })?;

    if !header.verify_password(&master_password) {
        return Err(
            "Senha mestre inválida. Autorização negada para revelação da frase mnemônica."
                .to_string(),
        );
    }

    let zeroizing_phrase = GLOBAL_CREATION_STORE
        .get_mnemonic(&session_id)
        .ok_or_else(|| {
            "Sessão de criação expirada ou inexistente. Gere as carteiras novamente.".to_string()
        })?;

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
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
    mut request: SaveWalletsRequest,
) -> Result<Vec<StoredWallet>, String> {
    // Autorização de Backend Mandatória: cofre DEVE estar desbloqueado na sessão
    if !session.is_unlocked() {
        return Err("Acesso negado: o cofre precisa estar desbloqueado.".to_string());
    }

    // 1. Valida senha mestre
    let header = db.get_header().map_err(|e| e.to_string())?.ok_or_else(|| {
        "Cofre não inicializado. Defina a senha mestre antes de salvar carteiras.".to_string()
    })?;

    if !header.verify_password(&request.master_password) {
        request.master_password.zeroize();
        return Err("Senha mestre inválida. Operação de custódia cancelada.".to_string());
    }

    // 2. Obtém a mnemônica da sessão em Rust (ou fallback)
    let mut mnemonic = if let Some(ref sid) = request.session_id {
        GLOBAL_CREATION_STORE.consume_mnemonic(sid).ok_or_else(|| {
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
    let envelope =
        VaultCrypto::encrypt(&request.master_password, mnemonic.as_bytes()).map_err(|e| {
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
        let slug = request
            .client_name
            .as_deref()
            .unwrap_or("client")
            .chars()
            .filter(|c| c.is_alphanumeric())
            .take(10)
            .collect::<String>();
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
        current_wallets
            .iter()
            .filter(|w| w.target == "DAO")
            .map(|w| w.id)
            .max()
            .unwrap_or(0)
            + 1
    } else {
        current_wallets
            .iter()
            .filter(|w| w.target == "CLIENT")
            .map(|w| w.id)
            .max()
            .unwrap_or(100)
            + 1
    };

    let new_stored: Vec<StoredWallet> = request
        .previews
        .into_iter()
        .enumerate()
        .map(|(idx, preview)| {
            let user_name = if request.target == "DAO" {
                "ASPPIBRA DAO".to_string()
            } else {
                request
                    .client_name
                    .clone()
                    .unwrap_or_else(|| preview.label.clone())
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
        })
        .collect();

    let all_wallets = db.append_wallets(&new_stored).map_err(|e| e.to_string())?;
    Ok(all_wallets)
}

#[tauri::command]
pub fn list_stored_wallets(db: State<'_, LocalDatabase>) -> Result<Vec<StoredWallet>, String> {
    db.list_wallets().map_err(|e| e.to_string())
}
