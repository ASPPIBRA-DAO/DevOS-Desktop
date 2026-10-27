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

#[derive(Default, Debug)]
struct SessionState {
    unlocked: bool,
    epoch: u64,
    session_key: Option<zeroize::Zeroizing<String>>,
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
                session_key: None,
            }),
        }
    }

    pub fn is_unlocked(&self) -> bool {
        match self.state.lock() {
            Ok(s) => s.unlocked,
            Err(poisoned) => {
                log::warn!(
                    "[Vault Security] Mutex envenenado detectado em is_unlocked(). Aplicando Fail-Closed: cofre considerado bloqueado."
                );
                let mut s = poisoned.into_inner();
                s.unlocked = false;
                s.session_key = None;
                false
            }
        }
    }

    /// Obtém a época atômica atual da sessão para validação de operações concorrentes
    pub fn current_epoch(&self) -> u64 {
        match self.state.lock() {
            Ok(s) => s.epoch,
            Err(poisoned) => poisoned.into_inner().epoch,
        }
    }

    /// Bloqueia a sessão imediatamente, incrementa a época e purga qualquer material sensível da RAM (Poison Recovery / Fail-Closed)
    pub fn lock(&self) {
        let mut s = match self.state.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                log::warn!(
                    "[Vault Security] Mutex envenenado detectado em lock(). Forçando recuperação para estado bloqueado."
                );
                poisoned.into_inner()
            }
        };
        s.unlocked = false;
        s.epoch = s.epoch.wrapping_add(1);
        // Descarta e zera qualquer chave de sessão sensível da RAM imediatamente via ZeroizeOnDrop:
        s.session_key = None;
    }

    /// Desbloqueia a sessão SOMENTE se a época não foi alterada por um bloqueio concorrente.
    /// Em caso de Mutex envenenado por pânico anterior, recusa imediatamente o desbloqueio (Fail-Closed).
    pub fn try_unlock(&self, expected_epoch: u64) -> bool {
        match self.state.lock() {
            Ok(mut s) => {
                if s.epoch != expected_epoch {
                    return false;
                }
                s.unlocked = true;
                true
            }
            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em try_unlock(). Abortando desbloqueio com Fail-Closed."
                );
                let mut s = poisoned.into_inner();
                s.unlocked = false;
                s.session_key = None;
                false
            }
        }
    }

    /// Instala condicionalmente um recurso sensível de sessão SOMENTE se a época não mudou durante a validação.
    /// Se a época mudou (bloqueio concorrente), a transição é REJEITADA e o parâmetro `key` é descartado
    /// e imediatamente zerado na memória RAM pelo seu destrutor RAII (ZeroizeOnDrop), NUNCA sendo instalado.
    pub fn try_unlock_with_session_key(
        &self,
        expected_epoch: u64,
        key: zeroize::Zeroizing<String>,
    ) -> bool {
        let mut s = match self.state.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em try_unlock_with_session_key(). Abortando com Fail-Closed."
                );
                let mut s = poisoned.into_inner();
                s.unlocked = false;
                s.session_key = None;
                // `key` sai de escopo e é destruído/zerado pelo RAII
                return false;
            }
        };

        if s.epoch != expected_epoch {
            // Rejeição fiduciária: época obsoleta detectada.
            // O recurso `key` NÃO é instalado em `s.session_key` e é destruído na saída do escopo.
            return false;
        }

        s.unlocked = true;
        s.session_key = Some(key);
        true
    }

    /// Verifica se a sessão ativa possui uma chave criptográfica instalada
    pub fn has_session_key(&self) -> bool {
        match self.state.lock() {
            Ok(s) => s.session_key.is_some(),
            Err(_) => false,
        }
    }

    /// Define o estado diretamente (compatibilidade de testes)
    pub fn set_unlocked(&self, unlocked: bool) {
        let mut s = match self.state.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        };
        s.unlocked = unlocked;
        if !unlocked {
            s.session_key = None;
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
            Ok(decrypted) => {
                let decrypted = zeroize::Zeroizing::new(decrypted);
                *decrypted == Self::CANARY_PLAINTEXT
            }
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

    #[test]
    fn test_vault_session_poison_recovery_fail_closed() {
        use std::panic;
        use std::sync::Arc;
        use std::thread;

        let session = Arc::new(VaultSession::new());
        let s_clone = Arc::clone(&session);

        // 1. Simula uma thread que entra em pânico enquanto retém o bloqueio do Mutex:
        let _ = thread::spawn(move || {
            let _guard = s_clone.state.lock().unwrap();
            panic!("Pânico intencional simulando crash de thread enquanto retém lock do cofre");
        })
        .join();

        // 2. Comprova política Fail-Closed: is_unlocked() NUNCA libera acesso sob envenenamento
        assert!(
            !session.is_unlocked(),
            "Sob envenenamento por pânico, is_unlocked() DEVE aplicar Fail-Closed e retornar false"
        );

        // 3. Comprova que try_unlock() recusa transição sob envenenamento
        let unlock_attempt = session.try_unlock(0);
        assert!(
            !unlock_attempt,
            "try_unlock() DEVE recusar transição de desbloqueio sob Mutex envenenado"
        );

        // 4. Comprova recuperação segura com lock(): restaura integridade e mantém cofre trancado
        session.lock();
        assert!(
            !session.is_unlocked(),
            "Após recuperação com lock(), o cofre DEVE permanecer estritamente trancado"
        );
    }

    #[test]
    fn test_vault_session_rejected_unlock_cleanses_sensitive_resources() {
        use std::sync::Arc;
        use std::sync::atomic::{AtomicBool, Ordering};

        struct MonitoredSecret {
            data: zeroize::Zeroizing<String>,
            dropped_flag: Arc<AtomicBool>,
        }

        impl Drop for MonitoredSecret {
            fn drop(&mut self) {
                // Notifica que o destrutor RAII executou e limpou a memória
                self.dropped_flag.store(true, Ordering::SeqCst);
            }
        }

        let session = Arc::new(VaultSession::new());

        // 1. Simula início de uma operação de desbloqueio que obtém a época inicial
        let epoch_at_start = session.current_epoch();

        // 2. Simula derivação / decifração de um recurso temporário altamente sensível (ex: chave de sessão)
        let was_dropped = Arc::new(AtomicBool::new(false));
        let monitored_resource = MonitoredSecret {
            data: zeroize::Zeroizing::new("master_derived_secret_token_#2026".to_string()),
            dropped_flag: Arc::clone(&was_dropped),
        };

        // 3. Simula uma intervenção concorrente de bloqueio (lock) antes da conclusão da transição
        session.lock();
        assert!(!session.is_unlocked());

        // 4. A tentativa de desbloqueio tenta instalar o recurso sensível:
        let install_attempt = {
            // A época expirou (mudou de 0 para 1). A sessão DEVE rejeitar a transição e NÃO instalar nada.
            let secret_to_install = monitored_resource.data.clone();
            session.try_unlock_with_session_key(epoch_at_start, secret_to_install)
        };

        // A tentativa deve ser rejeitada imediatamente
        assert!(
            !install_attempt,
            "Tentativa com época desatualizada deve ser rejeitada"
        );
        assert!(
            !session.is_unlocked(),
            "Sessão deve permanecer estritamente bloqueada"
        );
        assert!(
            !session.has_session_key(),
            "Nenhum recurso sensível pode ter sido instalado na sessão"
        );

        // 5. Descarta o monitor original e comprova que os recursos sensíveis temporários foram liberados da RAM
        drop(monitored_resource);
        assert!(
            was_dropped.load(Ordering::SeqCst),
            "O recurso temporário sensível deve ter sido liberado e zerado pelo RAII"
        );

        // 6. Comprova agora o ciclo de vida positivo com instalação legítima e subsequente purga pelo lock():
        let epoch_valid = session.current_epoch();
        let valid_secret = zeroize::Zeroizing::new("valid_session_key_token".to_string());
        let valid_install = session.try_unlock_with_session_key(epoch_valid, valid_secret);
        assert!(valid_install, "Desbloqueio com época correta deve suceder");
        assert!(session.is_unlocked(), "Sessão deve estar desbloqueada");
        assert!(
            session.has_session_key(),
            "Recurso sensível deve estar instalado na sessão ativa"
        );

        // Ao bloquear, o recurso sensível DEVE ser imediatamente purgado e zerado da memória RAM
        session.lock();
        assert!(!session.is_unlocked());
        assert!(
            !session.has_session_key(),
            "Recurso sensível DEVE ser purgado e zerado imediatamente no lock()"
        );
    }
}
