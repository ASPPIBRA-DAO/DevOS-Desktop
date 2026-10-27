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

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};

/// Gerenciador autoritativo da sessão do cofre em memória com controle de concorrência por época (Epoch)
#[derive(Default)]
pub struct VaultSession {
    unlocked: AtomicBool,
    epoch: AtomicU64,
}

impl VaultSession {
    pub fn new() -> Self {
        Self {
            unlocked: AtomicBool::new(false),
            epoch: AtomicU64::new(0),
        }
    }

    pub fn is_unlocked(&self) -> bool {
        self.unlocked.load(Ordering::SeqCst)
    }

    /// Obtém a época atômica atual da sessão para validação de operações concorrentes
    pub fn current_epoch(&self) -> u64 {
        self.epoch.load(Ordering::SeqCst)
    }

    /// Bloqueia a sessão imediatamente e incrementa a época atômica, invalidando qualquer unlock em trânsito
    pub fn lock(&self) {
        self.unlocked.store(false, Ordering::SeqCst);
        self.epoch.fetch_add(1, Ordering::SeqCst);
    }

    /// Desbloqueia a sessão SOMENTE se a época não foi alterada por um bloqueio concorrente
    pub fn try_unlock(&self, expected_epoch: u64) -> bool {
        if self.epoch.load(Ordering::SeqCst) != expected_epoch {
            return false;
        }
        self.unlocked.store(true, Ordering::SeqCst);
        true
    }

    /// Define o estado diretamente (compatibilidade de testes)
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_session_normal_lifecycle() {
        let session = VaultSession::new();
        assert!(!session.is_unlocked());

        let epoch = session.current_epoch();
        assert!(session.try_unlock(epoch));
        assert!(session.is_unlocked());

        session.lock();
        assert!(!session.is_unlocked());
    }

    #[test]
    fn test_vault_session_prevents_unlock_after_concurrent_lock() {
        let session = VaultSession::new();
        // 1. Simula início do unlock capturando a época 0
        let epoch_at_start = session.current_epoch();

        // 2. Simula chamada concorrente de lock antes do término do hash Argon2id
        session.lock();
        assert!(!session.is_unlocked());

        // 3. O unlock tenta concluir com a época obsoleta
        let unlocked = session.try_unlock(epoch_at_start);
        assert!(!unlocked, "O unlock atrasado deveria ter sido rejeitado pela mudança de época");
        assert!(!session.is_unlocked(), "O cofre deve permanecer estritamente bloqueado");
    }
}
