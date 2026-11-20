use serde::{Deserialize, Serialize};
use tauri::State;

use crate::modules::vault::access_control::VaultSession;
use crate::modules::vault::encryption::{AadDomain, Subkeys, VaultCrypto, WalletTargetTag};
use crate::modules::wallets::creation_session::GLOBAL_CREATION_STORE;
use crate::modules::wallets::derivation::{DerivationService, DerivedWalletPreview};
use crate::modules::wallets::mnemonic::MnemonicService;
use crate::storage::local_database::{
    LocalDatabase, NewWalletData, StoredSecretV2, StoredWallet, WalletCreationOp,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratePreviewResponse {
    pub session_id: String,
    pub words_count: usize,
    pub previews: Vec<DerivedWalletPreview>,
    pub mnemonic: Option<String>,
}

/// Requisição para confirmação e salvamento de carteiras no cofre.
///
/// Princípio Zero-Trust:
/// - A senha mestre NUNCA é enviada nesta requisição (o cofre já deve estar desbloqueado na sessão).
/// - A mnemônica NUNCA é enviada pelo frontend (é recuperada da sessão protegida em memória).
/// - Previews de endereços NÃO são aceitos do frontend; todos os endereços são recalculados e
///   validados estritamente no backend antes da persistência.
#[derive(Debug, Clone, Deserialize)]
pub struct SaveWalletsRequest {
    pub session_id: String,
    pub creation_id: Option<String>,
    pub label: String,
    pub client_name: Option<String>,
    pub client_doc: Option<String>,
}

/// Gera uma nova mnemônica de forma segura, armazena na memória segura do Rust (com máquina de estados)
/// e retorna os previews dos endereços SEM transferir o texto em claro da mnemônica por padrão.
#[tauri::command]
pub fn generate_seed_and_preview(
    word_count: usize,
    target: String,
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

    // Registra a mnemônica na memória segura do Rust com máquina de estados (Pending) e TTL
    let (session_id, _creation_id) = GLOBAL_CREATION_STORE
        .create_session_with_metadata(mnemonic, target, account_branch, count as usize, network)
        .map_err(|e| format!("Falha ao registrar sessão de criação: {}", e))?;

    Ok(GeneratePreviewResponse {
        session_id,
        words_count: word_count,
        previews,
        mnemonic: None, // Frase retida no Rust por design de segurança!
    })
}

/// Revela a mnemônica efêmera da sessão mediante comprovação de cofre desbloqueado.
#[tauri::command]
pub fn reveal_pending_mnemonic(
    session: State<'_, VaultSession>,
    session_id: String,
) -> Result<String, String> {
    if !session.is_unlocked() {
        return Err(
            "Acesso negado: o cofre precisa estar desbloqueado na sessão atual.".to_string(),
        );
    }

    let zeroizing_phrase = GLOBAL_CREATION_STORE
        .reveal_pending_mnemonic(&session_id)
        .map_err(|e| {
            format!(
                "Sessão de criação inválida ou expirada para revelação: {}",
                e
            )
        })?;

    Ok(zeroizing_phrase.to_string())
}

/// Cancela a criação pendente e destrói imediatamente o segredo da memória do Rust.
#[tauri::command]
pub fn cancel_pending_creation(session_id: String) -> Result<bool, String> {
    Ok(GLOBAL_CREATION_STORE.cancel_session(&session_id))
}

/// Confirma e sela no cofre local consumindo atomicamente a sessão em Rust.
///
/// Executa a derivação dos endereços no backend, cifra a mnemônica com a DEK da sessão ativa
/// e persiste tudo dentro de uma transação SQLite imediata (Immediate).
#[tauri::command]
pub fn confirm_and_save_wallets(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
    request: SaveWalletsRequest,
) -> Result<Vec<StoredWallet>, String> {
    if !session.is_unlocked() {
        return Err("Acesso negado: o cofre precisa estar desbloqueado.".to_string());
    }

    // 1. Autorização prévia e guard RAII de ciclo de vida da operação (protege até o commit SQLite)
    let _op_guard = session
        .acquire_operation()
        .map_err(|e| format!("Acesso ao cofre negado: {}", e))?;

    // 2. Reserva a sessão em memória (Pending -> Reserved), garantindo exclusividade
    let reserved = GLOBAL_CREATION_STORE
        .reserve_session(&request.session_id)
        .map_err(|e| {
            format!(
                "Falha ao reservar sessão de criação (expirada ou estado inválido): {}",
                e
            )
        })?;

    // 3. Validação de associação estrita entre session_id e creation_id
    if let Some(ref cid) = request.creation_id {
        if cid != &reserved.creation_id {
            return Err("Violação de segurança: O creation_id informado não corresponde à sessão reservada.".to_string());
        }
    }

    // 2. Deriva a seed binária no backend
    let seed = MnemonicService::to_seed(&reserved.mnemonic, "")
        .map_err(|e| format!("Falha na derivação da seed: {}", e))?;

    // 3. Recalcula deterministicamente todos os previews de endereços no backend (Zero-Trust)
    let derived_previews = DerivationService::derive_batch(
        &seed,
        reserved.account_branch,
        reserved.count as u32,
        &request.label,
        &reserved.network_id,
    )
    .map_err(|e| format!("Falha na derivação dos endereços EVM: {}", e))?;

    let now_ts = chrono::Utc::now().timestamp();
    let now_iso = chrono::Utc::now().format("%Y-%m-%d %H:%M").to_string();

    // 4. Cria ID de cofre independente e segregado (DAO vs Associado)
    let vault_id = if reserved.target.eq_ignore_ascii_case("DAO") {
        format!("dao_vault_{}_{:04x}", now_ts, rand::random::<u16>())
    } else {
        let slug = request
            .client_name
            .as_deref()
            .unwrap_or("client")
            .chars()
            .filter(|c| c.is_alphanumeric())
            .take(10)
            .collect::<String>();
        format!(
            "client_vault_{}_{}_{:04x}",
            slug,
            now_ts,
            rand::random::<u16>()
        )
    };

    let target_tag = if reserved.target.eq_ignore_ascii_case("DAO") {
        WalletTargetTag::Dao
    } else {
        WalletTargetTag::Client
    };

    let aad = AadDomain::WalletMnemonic {
        vault_id: &vault_id,
        target: target_tag,
    }
    .to_canonical_bytes();

    // 5. Cifra a mnemônica com a subchave DEVOS/WALLETS/V2 através do acesso seguro à DEK na sessão
    let envelope = session
        .with_dek(|dek| {
            let wallets_subkey = Subkeys::derive_wallets_key(dek);
            VaultCrypto::encrypt_with_aead(&wallets_subkey, reserved.mnemonic.as_bytes(), &aad)
                .map_err(crate::modules::vault::access_control::AccessControlError::Crypto)
        })
        .map_err(|e| format!("Falha na custódia criptográfica do cofre: {}", e))?;

    let words_count = reserved.mnemonic.split_whitespace().count();

    // 6. Prepara os registros para persistência atômica
    let secret_record = StoredSecretV2 {
        vault_id: vault_id.clone(),
        target: reserved.target.clone(),
        envelope,
        created_at: now_iso.clone(),
    };

    let intent_hash = crate::storage::local_database::compute_wallet_creation_intent_hash(
        &reserved.target,
        reserved.account_branch,
        reserved.count,
        &reserved.network_id,
        &request.label,
        None,
    );

    let op = WalletCreationOp {
        creation_id: reserved.creation_id.clone(),
        target: reserved.target.clone(),
        account_branch: reserved.account_branch,
        wallet_count: reserved.count,
        network_id: reserved.network_id.clone(),
        intent_hash,
        created_at: now_iso.clone(),
    };

    let wallets_data: Vec<NewWalletData> = derived_previews
        .into_iter()
        .map(|preview| {
            let user_name = if reserved.target.eq_ignore_ascii_case("DAO") {
                "ASPPIBRA DAO".to_string()
            } else {
                request
                    .client_name
                    .clone()
                    .unwrap_or_else(|| preview.label.clone())
            };

            NewWalletData {
                target: reserved.target.clone(),
                custody_type: "CUSTODIAL_LOCAL".to_string(),
                user_name,
                label: preview.label,
                derivation_path: preview.derivation_path,
                network: preview.network,
                address: preview.address,
                status: "ACTIVE".to_string(),
                kyc_status: "UNVERIFIED".to_string(),
                seed_words_count: words_count,
                vault_id: Some(vault_id.clone()),
                client_doc: request.client_doc.clone(),
            }
        })
        .collect();

    // 7. Persiste tudo atomicamente no SQLite
    let all_wallets = db
        .save_wallets_and_secret_atomic(secret_record, op, &wallets_data)
        .map_err(|e| format!("Falha ao persistir carteiras no SQLite: {}", e))?;

    // 8. Consome e remove a sessão em memória (Reserved -> Consumed)
    let _ =
        GLOBAL_CREATION_STORE.consume_reserved_session(&request.session_id, &reserved.creation_id);

    Ok(all_wallets)
}

#[tauri::command]
pub fn list_stored_wallets(db: State<'_, LocalDatabase>) -> Result<Vec<StoredWallet>, String> {
    db.list_wallets().map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::modules::vault::access_control::VaultHeaderV2;
    use std::fs;

    #[test]
    fn test_generate_and_save_wallets_flow_with_dek_session() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_wallet_cmd_{}", rand::random::<u64>()));
        let db = LocalDatabase::new(test_dir.clone());
        crate::storage::migrations::MigrationManager::run_migrations(&db).unwrap();

        let master_pwd = "MasterPasswordSecure2026!";
        let (header_v2, dek) = VaultHeaderV2::init(master_pwd, "devos-desktop").unwrap();
        db.save_header_v2(&header_v2).unwrap();

        let session = VaultSession::new();
        let expected_epoch = session.current_epoch();
        session
            .unlock_with_dek(expected_epoch, zeroize::Zeroizing::new(*dek))
            .unwrap();

        // 1. Gera seed e previews
        let preview_res = generate_seed_and_preview(
            12,
            "DAO".to_string(),
            0,
            2,
            "Caixa Primário".to_string(),
            "Arbitrum One".to_string(),
        )
        .expect("Deve gerar preview");

        assert_eq!(preview_res.previews.len(), 2);
        assert!(preview_res.mnemonic.is_none());

        // 2. Confirma e salva usando a sessão do cofre (sem enviar master_password)
        let save_req = SaveWalletsRequest {
            session_id: preview_res.session_id.clone(),
            creation_id: None,
            label: "Caixa Primário".to_string(),
            client_name: None,
            client_doc: None,
        };

        // Simula execução lógica do comando (utilizando os structs diretamente)
        let reserved = GLOBAL_CREATION_STORE
            .reserve_session(&save_req.session_id)
            .unwrap();

        let seed = MnemonicService::to_seed(&reserved.mnemonic, "").unwrap();
        let derived = DerivationService::derive_batch(
            &seed,
            reserved.account_branch,
            reserved.count as u32,
            &save_req.label,
            &reserved.network_id,
        )
        .unwrap();

        let vault_id = "dao_vault_cmd_test".to_string();
        let aad = AadDomain::WalletMnemonic {
            vault_id: &vault_id,
            target: WalletTargetTag::Dao,
        }
        .to_canonical_bytes();

        let envelope = session
            .with_dek(|d| {
                let subkey = Subkeys::derive_wallets_key(d);
                VaultCrypto::encrypt_with_aead(&subkey, reserved.mnemonic.as_bytes(), &aad)
                    .map_err(crate::modules::vault::access_control::AccessControlError::Crypto)
            })
            .unwrap();

        let secret = StoredSecretV2 {
            vault_id: vault_id.clone(),
            target: "DAO".to_string(),
            envelope,
            created_at: "2026-11-20 12:00:00".to_string(),
        };

        let intent_hash = crate::storage::local_database::compute_wallet_creation_intent_hash(
            "DAO",
            reserved.account_branch,
            reserved.count,
            &reserved.network_id,
            &save_req.label,
            None,
        );

        let op = WalletCreationOp {
            creation_id: reserved.creation_id.clone(),
            target: "DAO".to_string(),
            account_branch: reserved.account_branch,
            wallet_count: reserved.count,
            network_id: reserved.network_id.clone(),
            intent_hash,
            created_at: "2026-11-20 12:00:00".to_string(),
        };

        let wallets_data: Vec<NewWalletData> = derived
            .into_iter()
            .map(|p| NewWalletData {
                target: "DAO".to_string(),
                custody_type: "CUSTODIAL_LOCAL".to_string(),
                user_name: "ASPPIBRA DAO".to_string(),
                label: p.label,
                derivation_path: p.derivation_path,
                network: p.network,
                address: p.address,
                status: "ACTIVE".to_string(),
                kyc_status: "UNVERIFIED".to_string(),
                seed_words_count: 12,
                vault_id: Some(vault_id.clone()),
                client_doc: None,
            })
            .collect();

        let saved = db
            .save_wallets_and_secret_atomic(secret, op, &wallets_data)
            .unwrap();
        assert_eq!(saved.len(), 2);

        GLOBAL_CREATION_STORE
            .consume_reserved_session(&save_req.session_id, &reserved.creation_id)
            .unwrap();

        // Sessão deve estar limpa da memória
        assert_eq!(GLOBAL_CREATION_STORE.session_count(), 0);

        let _ = fs::remove_dir_all(test_dir);
    }
}
