use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, ZeroizeOnDrop};

use super::encryption::{EncryptedEnvelope, VaultCrypto, VaultCryptoError};

#[derive(Debug, thiserror::Error)]
pub enum AccessControlError {
    #[error("Vault is not initialized. Please set master password first.")]
    NotInitialized,
    #[error("Vault is locked. Master password required.")]
    Locked,
    #[error("Authentication failed. Invalid master password.")]
    InvalidPassword,
    #[error("Crypto error: {0}")]
    Crypto(#[from] VaultCryptoError),
}

/// Estado de segurança do cofre exposto ao frontend (sem expor segredos)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct VaultStatus {
    pub is_initialized: bool,
    pub is_unlocked: bool,
    pub dao_wallets_count: usize,
    pub client_wallets_count: usize,
}

use std::sync::atomic::{AtomicBool, Ordering};

/// Gerenciador autoritativo da sessão do cofre em memória
#[derive(Default)]
pub struct VaultSession {
    unlocked: AtomicBool,
}

impl VaultSession {
    pub fn new() -> Self {
        Self {
            unlocked: AtomicBool::new(false),
        }
    }

    pub fn is_unlocked(&self) -> bool {
        self.unlocked.load(Ordering::SeqCst)
    }

    pub fn set_unlocked(&self, unlocked: bool) {
        self.unlocked.store(unlocked, Ordering::SeqCst);
    }
}

/// Token em memória de sessão desbloqueada com descarte seguro
#[derive(Default, Zeroize, ZeroizeOnDrop)]
pub struct SessionKey(pub Option<String>);

/// Estrutura de configuração persistida do cofre para verificação de senha mestre
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultHeader {
    pub version: u32,
    pub canary_envelope: EncryptedEnvelope,
    pub created_at: String,
}

impl VaultHeader {
    const CANARY_PLAINTEXT: &'static [u8] = b"ASPPIBRA_DEVOS_VAULT_CANARY_V1";

    pub fn new(password: &str) -> Result<Self, VaultCryptoError> {
        let canary_envelope = VaultCrypto::encrypt(password, Self::CANARY_PLAINTEXT)?;
        let now = chrono::Utc::now().to_rfc3339();

        Ok(Self {
            version: 1,
            canary_envelope,
            created_at: now,
        })
    }

    pub fn verify_password(&self, password: &str) -> bool {
        match VaultCrypto::decrypt(password, &self.canary_envelope) {
            Ok(decrypted) => decrypted == Self::CANARY_PLAINTEXT,
            Err(_) => false,
        }
    }
}
