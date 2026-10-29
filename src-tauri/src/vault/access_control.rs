use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

use super::encryption::{EncryptedEnvelope, VaultCrypto, VaultCryptoError};

// ----------------------------------------------------------------------
// Erros de controle de acesso
// ----------------------------------------------------------------------

#[derive(Debug, thiserror::Error)]
pub enum AccessControlError {
    #[error("Vault is not initialized. Please set master password first.")]
    NotInitialized,

    #[error("Vault is locked. Master password required.")]
    Locked,

    #[error("Authentication failed. Invalid master password.")]
    InvalidPassword,

    // Evita expor detalhes internos da operação criptográfica
    // por meio da representação pública do erro.
    #[error("Cryptographic operation failed.")]
    Crypto(#[from] VaultCryptoError),
}

// ----------------------------------------------------------------------
// Estado público do cofre
// ----------------------------------------------------------------------

/// Estado de segurança do cofre exposto ao frontend.
///
/// Não inclui senhas, chaves de sessão ou conteúdo criptográfico.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct VaultStatus {
    pub is_initialized: bool,
    pub is_unlocked: bool,
    pub dao_wallets_count: usize,
    pub client_wallets_count: usize,
}

// ----------------------------------------------------------------------
// Estado interno da sessão
// ----------------------------------------------------------------------

/// Estado privado da sessão.
///
/// Não derivar Debug: a estrutura contém material sensível (session_key).
#[derive(Default)]
struct SessionState {
    unlocked: bool,

    /// Geração sincronizada pelo Mutex.
    ///
    /// Uma operação iniciada com uma época antiga não pode concluir
    /// o desbloqueio depois de uma invalidação da sessão.
    epoch: u64,

    /// Indica que o contador atingiu seu limite.
    ///
    /// Nesse estado, a sessão permanece bloqueada permanentemente,
    /// evitando a reutilização de uma época por wraparound.
    epoch_exhausted: bool,

    /// Material sensível da sessão.
    ///
    /// A chave é zerada pelo mecanismo RAII ao ser descartada.
    session_key: Option<Zeroizing<String>>,
}

// ----------------------------------------------------------------------
// Gerenciador autoritativo da sessão
// ----------------------------------------------------------------------

/// Gerenciador autoritativo da sessão do cofre.
///
/// O Mutex protege as transições entre bloqueado e desbloqueado,
/// a geração da sessão e o material criptográfico mantido em memória.
#[derive(Default)]
pub struct VaultSession {
    state: Mutex<SessionState>,
}

impl VaultSession {
    /// Cria uma sessão bloqueada.
    pub fn new() -> Self {
        Self::default()
    }

    // --------------------------------------------------------------
    // Invariantes internos
    // --------------------------------------------------------------

    /// Avança a geração sem permitir wraparound.
    ///
    /// Se o contador estiver esgotado, a sessão permanece bloqueada.
    fn advance_epoch(state: &mut SessionState) {
        if state.epoch_exhausted {
            state.unlocked = false;
            state.session_key = None;
            return;
        }

        match state.epoch.checked_add(1) {
            Some(next_epoch) => {
                state.epoch = next_epoch;
            }

            None => {
                // Não reutilizar a época zero nem aceitar ABA.
                state.epoch_exhausted = true;
                state.unlocked = false;
                state.session_key = None;

                log::error!(
                    "[Vault Security] Época da sessão esgotada. \
                     O cofre permanecerá bloqueado."
                );
            }
        }
    }

    /// Restaura o estado seguro após uma falha interna.
    ///
    /// A chave é descartada, a sessão é bloqueada e a época é
    /// invalidada para impedir que operações antigas prossigam.
    fn fail_closed(state: &mut SessionState) {
        state.unlocked = false;
        state.session_key = None;

        Self::advance_epoch(state);
    }

    // --------------------------------------------------------------
    // Consulta do estado
    // --------------------------------------------------------------

    /// Retorna true somente quando a sessão está desbloqueada
    /// e a geração não está esgotada.
    pub fn is_unlocked(&self) -> bool {
        match self.state.lock() {
            Ok(state) => state.unlocked && !state.epoch_exhausted,

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em is_unlocked(). \
                     Aplicando Fail-Closed."
                );

                let mut state = poisoned.into_inner();

                // Mantém o Mutex envenenado nesta operação de consulta.
                // Uma tentativa de desbloqueio que encontre o poison
                // ainda deverá ser rejeitada explicitamente.
                Self::fail_closed(&mut state);

                false
            }
        }
    }

    /// Obtém a geração atual da sessão.
    ///
    /// O estado permanece bloqueado se o Mutex estiver envenenado.
    /// Nesse caso, a época também é invalidada.
    pub fn current_epoch(&self) -> u64 {
        match self.state.lock() {
            Ok(state) => state.epoch,

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em current_epoch(). \
                     Invalidando a sessão."
                );

                let mut state = poisoned.into_inner();

                Self::fail_closed(&mut state);

                state.epoch
            }
        }
    }

    /// Verifica se existe uma chave de sessão instalada em uma
    /// sessão efetivamente desbloqueada.
    pub fn has_session_key(&self) -> bool {
        match self.state.lock() {
            Ok(mut state) => {
                if state.epoch_exhausted || !state.unlocked {
                    // Corrige também eventuais inconsistências internas.
                    state.session_key = None;
                    return false;
                }

                state.session_key.is_some()
            }

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em has_session_key(). \
                     Limpando o estado da sessão."
                );

                let mut state = poisoned.into_inner();

                Self::fail_closed(&mut state);

                false
            }
        }
    }

    // --------------------------------------------------------------
    // Bloqueio
    // --------------------------------------------------------------

    /// Bloqueia a sessão, invalida operações pendentes e descarta
    /// qualquer material sensível instalado.
    ///
    /// Se o Mutex estiver envenenado, restaura o estado seguro
    /// e limpa a flag de poison depois da recuperação.
    pub fn lock(&self) {
        match self.state.lock() {
            Ok(mut state) => {
                state.unlocked = false;
                state.session_key = None;

                Self::advance_epoch(&mut state);
            }

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em lock(). \
                     Restaurando o estado seguro."
                );

                let mut state = poisoned.into_inner();

                Self::fail_closed(&mut state);

                // O estado já foi restaurado para a condição segura.
                // Operações que encontraram o poison continuam tendo
                // que lidar explicitamente com sua tentativa.
                self.state.clear_poison();
            }
        }
    }

    // --------------------------------------------------------------
    // Desbloqueio
    // --------------------------------------------------------------

    /// Desbloqueia a sessão somente se a geração esperada continuar válida.
    ///
    /// Uma tentativa que encontrar um Mutex envenenado é recusada.
    /// A recuperação não transforma essa tentativa em um desbloqueio
    /// bem-sucedido.
    pub fn try_unlock(&self, expected_epoch: u64) -> bool {
        match self.state.lock() {
            Ok(mut state) => {
                if state.epoch_exhausted || state.epoch != expected_epoch {
                    return false;
                }

                state.unlocked = true;

                true
            }

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em try_unlock(). \
                     A tentativa atual será recusada."
                );

                let mut state = poisoned.into_inner();

                Self::fail_closed(&mut state);

                // Recupera a disponibilidade do objeto somente depois
                // de forçar o bloqueio e descartar a chave.
                //
                // Esta chamada retorna false: uma tentativa posterior
                // deverá realizar uma nova autenticação.
                self.state.clear_poison();

                false
            }
        }
    }

    /// Instala uma chave de sessão somente quando a geração esperada
    /// permanece válida.
    ///
    /// Se a operação for rejeitada, `key` sai de escopo e o tipo
    /// Zeroizing solicita a zeragem do conteúdo ao ser descartado.
    pub fn try_unlock_with_session_key(
        &self,
        expected_epoch: u64,
        key: Zeroizing<String>,
    ) -> bool {
        match self.state.lock() {
            Ok(mut state) => {
                if state.epoch_exhausted || state.epoch != expected_epoch {
                    // A chave não é instalada.
                    // O argumento será descartado na saída do método.
                    return false;
                }

                state.unlocked = true;
                state.session_key = Some(key);

                true
            }

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em \
                     try_unlock_with_session_key(). \
                     A instalação será recusada."
                );

                let mut state = poisoned.into_inner();

                Self::fail_closed(&mut state);

                self.state.clear_poison();

                // A chave recebida não foi instalada e será descartada.
                false
            }
        }
    }

    // --------------------------------------------------------------
    // Compatibilidade de testes
    // --------------------------------------------------------------

    /// Define diretamente o estado apenas durante os testes unitários.
    ///
    /// Não disponibilizar este método em builds de produção:
    /// permitir `unlocked = true` sem autenticação violaria o modelo
    /// de controle de acesso.
    #[cfg(test)]
    pub fn set_unlocked(&self, unlocked: bool) {
        match self.state.lock() {
            Ok(mut state) => {
                Self::advance_epoch(&mut state);

                if state.epoch_exhausted {
                    state.unlocked = false;
                    state.session_key = None;
                    return;
                }

                state.unlocked = unlocked;

                if !unlocked {
                    state.session_key = None;
                }
            }

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em set_unlocked(). \
                     Mantendo o Fail-Closed."
                );

                let mut state = poisoned.into_inner();

                Self::fail_closed(&mut state);

                self.state.clear_poison();
            }
        }
    }
}

// ----------------------------------------------------------------------
// Material sensível de sessão
// ----------------------------------------------------------------------

/// Token em memória de sessão.
///
/// O conteúdo é zerado pelo destrutor fornecido pelo derive.
#[derive(Default, Zeroize, ZeroizeOnDrop)]
pub struct SessionKey(pub Option<String>);

// ----------------------------------------------------------------------
// Cabeçalho persistido do cofre
// ----------------------------------------------------------------------

/// Cabeçalho persistido utilizado para verificar a senha mestre.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultHeader {
    pub version: u32,
    pub canary_envelope: EncryptedEnvelope,
    pub created_at: String,
}

impl VaultHeader {
    const CURRENT_VERSION: u32 = 1;

    const CANARY_PLAINTEXT: &'static [u8] = b"ASPPIBRA_DEVOS_VAULT_CANARY_V1";

    /// Cria um cabeçalho para a versão atualmente suportada.
    pub fn new(password: &str) -> Result<Self, VaultCryptoError> {
        let canary_envelope = VaultCrypto::encrypt(password, Self::CANARY_PLAINTEXT)?;

        let now = chrono::Utc::now().to_rfc3339();

        Ok(Self {
            version: Self::CURRENT_VERSION,
            canary_envelope,
            created_at: now,
        })
    }

    /// Verifica a senha mestre sem expor os bytes decifrados.
    ///
    /// Versões desconhecidas não são aceitas como cabeçalhos válidos.
    pub fn verify_password(&self, password: &str) -> bool {
        if self.version != Self::CURRENT_VERSION {
            return false;
        }

        match VaultCrypto::decrypt(password, &self.canary_envelope) {
            Ok(decrypted_bytes) => {
                let decrypted = Zeroizing::new(decrypted_bytes);

                decrypted.as_slice() == Self::CANARY_PLAINTEXT
            }

            Err(_) => false,
        }
    }
}

// ----------------------------------------------------------------------
// Testes unitários
// ----------------------------------------------------------------------

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
        assert!(!session.has_session_key());
    }

    #[test]
    fn test_vault_session_prevents_unlock_after_concurrent_lock() {
        let session = VaultSession::new();

        let epoch_at_start = session.current_epoch();

        session.lock();

        assert!(!session.is_unlocked());

        let unlocked = session.try_unlock(epoch_at_start);

        assert!(
            !unlocked,
            "O desbloqueio iniciado na época antiga deve ser recusado."
        );

        assert!(
            !session.is_unlocked(),
            "O cofre deve permanecer bloqueado."
        );
    }

    #[test]
    fn test_vault_session_deterministic_concurrency_barrier() {
        use std::sync::{Arc, Barrier};
        use std::thread;

        let session = Arc::new(VaultSession::new());
        let barrier = Arc::new(Barrier::new(2));

        let unlock_session = Arc::clone(&session);
        let unlock_barrier = Arc::clone(&barrier);

        let handle = thread::spawn(move || {
            let epoch = unlock_session.current_epoch();

            // A operação de desbloqueio captura a época.
            unlock_barrier.wait();

            // Aguarda a operação de bloqueio.
            unlock_barrier.wait();

            unlock_session.try_unlock(epoch)
        });

        // A thread de controle aguarda a captura da época.
        barrier.wait();

        // Invalida a tentativa concorrente.
        session.lock();

        // Autoriza o teste de desbloqueio a prosseguir.
        barrier.wait();

        let unlock_result = handle.join().expect("Thread de teste falhou.");

        assert!(
            !unlock_result,
            "A tentativa atrasada deve ser recusada."
        );

        assert!(
            !session.is_unlocked(),
            "A sessão deve permanecer bloqueada."
        );
    }

    #[test]
    fn test_vault_session_poison_recovery_fail_closed() {
        use std::sync::Arc;
        use std::thread;

        let session = Arc::new(VaultSession::new());

        let poison_session = Arc::clone(&session);

        // Simula um pânico enquanto o Mutex está bloqueado.
        let _ = thread::spawn(move || {
            let _guard = poison_session.state.lock().unwrap();

            panic!("Pânico intencional para testar a recuperação do Mutex.");
        })
        .join();

        // A consulta detecta o poison e força o estado seguro.
        assert!(
            !session.is_unlocked(),
            "A sessão deve permanecer bloqueada após o poison."
        );

        // A primeira tentativa de desbloqueio que encontra o poison
        // deve falhar, mesmo que o chamador tenha uma época numérica.
        let rejected_epoch = session.current_epoch();

        assert!(
            !session.try_unlock(rejected_epoch),
            "A tentativa que encontra o Mutex envenenado deve falhar."
        );

        // A recuperação permite iniciar uma operação nova.
        session.lock();

        assert!(!session.is_unlocked());

        let recovered_epoch = session.current_epoch();

        assert!(
            session.try_unlock(recovered_epoch),
            "Uma tentativa posterior deve poder prosseguir após a recuperação."
        );

        assert!(session.is_unlocked());
    }

    #[test]
    fn test_vault_session_stale_key_is_not_installed() {
        let session = VaultSession::new();

        // Captura a época anterior ao bloqueio.
        let stale_epoch = session.current_epoch();

        // Invalida todas as operações que utilizaram a época anterior.
        session.lock();

        let stale_key = Zeroizing::new("stale_session_key_material".to_string());

        // A chave é consumida pelo método, mas não deve ser instalada.
        let installed = session.try_unlock_with_session_key(stale_epoch, stale_key);

        assert!(
            !installed,
            "Uma chave associada a uma época antiga deve ser recusada."
        );

        assert!(
            !session.is_unlocked(),
            "A sessão deve permanecer bloqueada."
        );

        assert!(
            !session.has_session_key(),
            "Nenhuma chave deve permanecer instalada."
        );
    }

    #[test]
    fn test_vault_session_valid_key_lifecycle() {
        let session = VaultSession::new();

        let epoch = session.current_epoch();

        let key = Zeroizing::new("valid_session_key_material".to_string());

        assert!(
            session.try_unlock_with_session_key(epoch, key),
            "Uma chave associada à época válida deve ser instalada."
        );

        assert!(session.is_unlocked());
        assert!(session.has_session_key());

        session.lock();

        assert!(!session.is_unlocked());

        assert!(
            !session.has_session_key(),
            "O bloqueio deve remover a chave da sessão."
        );
    }

    #[test]
    fn test_vault_session_test_helper_invalidates_previous_epoch() {
        let session = VaultSession::new();

        let old_epoch = session.current_epoch();

        session.set_unlocked(false);

        assert!(
            !session.try_unlock(old_epoch),
            "A alteração do estado deve invalidar a época anterior."
        );
    }

    #[test]
    fn test_vault_session_lock_clears_session_key() {
        let session = VaultSession::new();

        let epoch = session.current_epoch();

        let key = Zeroizing::new("temporary_session_key_material".to_string());

        assert!(session.try_unlock_with_session_key(epoch, key));

        assert!(session.has_session_key());

        session.lock();

        assert!(!session.has_session_key());
        assert!(!session.is_unlocked());
    }
}
