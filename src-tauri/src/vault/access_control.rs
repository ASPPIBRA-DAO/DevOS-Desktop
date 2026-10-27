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

use std::sync::Mutex;

#[derive(Default, Debug, Clone, Copy, PartialEq, Eq)]
struct SessionState {
    unlocked: bool,
    epoch: u64,
}

/// Gerenciador autoritativo da sessão do cofre em memória com garantia de exclusão mútua total
#[derive(Default)]
pub struct VaultSession {
    state: Mutex<SessionState>,
}

impl VaultSession {
    pub fn new() -> Self {
        Self {
            state: Mutex::new(SessionState {
                unlocked: false,
                epoch: 0,
            }),
        }
    }

    pub fn is_unlocked(&self) -> bool {
        self.state.lock().map(|s| s.unlocked).unwrap_or(false)
    }

    /// Obtém a época atômica atual da sessão para validação de operações concorrentes
    pub fn current_epoch(&self) -> u64 {
        self.state.lock().map(|s| s.epoch).unwrap_or(0)
    }

    /// Bloqueia a sessão imediatamente e incrementa a época atômica, invalidando qualquer unlock em trânsito
    pub fn lock(&self) {
        if let Ok(mut s) = self.state.lock() {
            s.unlocked = false;
            s.epoch = s.epoch.wrapping_add(1);
        }
    }

    /// Desbloqueia a sessão SOMENTE se a época não foi alterada por um bloqueio concorrente.
    /// A validação da época e a alteração do estado de desbloqueio ocorrem sob a mesma exclusão mútua indivisível.
    pub fn try_unlock(&self, expected_epoch: u64) -> bool {
        if let Ok(mut s) = self.state.lock() {
            if s.epoch != expected_epoch {
                return false;
            }
            s.unlocked = true;
            true
        } else {
            false
        }
    }

    /// Define o estado diretamente (compatibilidade de testes)
    pub fn set_unlocked(&self, unlocked: bool) {
        if let Ok(mut s) = self.state.lock() {
            s.unlocked = unlocked;
        }
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
        assert!(
            !unlocked,
            "O unlock atrasado deveria ter sido rejeitado pela mudança de época"
        );
        assert!(
            !session.is_unlocked(),
            "O cofre deve permanecer estritamente bloqueado"
        );
    }

    #[test]
    fn test_vault_session_deterministic_concurrency_barrier() {
        use std::sync::{Arc, Barrier};
        use std::thread;

        let session = Arc::new(VaultSession::new());
        let barrier = Arc::new(Barrier::new(2));

        let s_clone = Arc::clone(&session);
        let b_clone = Arc::clone(&barrier);

        // Thread de Desbloqueio (simulando cálculo demorado de KDF Argon2id):
        let handle = thread::spawn(move || {
            let epoch = s_clone.current_epoch();
            // Ponto 1: Notifica a thread de bloqueio que o cálculo começou
            b_clone.wait();
            // Ponto 2: Aguarda a thread de bloqueio intervir e executar session.lock()
            b_clone.wait();
            // Tenta concluir o unlock após a intervenção concorrente
            s_clone.try_unlock(epoch)
        });

        // Thread de Controle (simulando chamada de lock_vault pelo usuário):
        // 1. Aguarda a thread de unlock capturar a época inicial
        barrier.wait();
        // 2. Executa o bloqueio concorrente imediato
        session.lock();
        // 3. Libera a thread de unlock para tentar concluir
        barrier.wait();

        let unlock_result = handle.join().expect("Thread de teste falhou");
        assert!(
            !unlock_result,
            "O unlock atrasado DEVE ser recusado sob exclusão mútua"
        );
        assert!(
            !session.is_unlocked(),
            "O cofre DEVE permanecer bloqueado sob exclusão mútua"
        );
    }
}
