use rand::RngCore;
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use std::sync::{Condvar, Mutex};
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

use super::encryption::{
    EncryptedEnvelope, KdfProfile, VaultCrypto, VaultCryptoError, WrappedDekEnvelope,
};

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

    #[error("Invalid session epoch or concurrent state transition.")]
    InvalidEpoch,

    #[error("Vault session is already unlocked.")]
    AlreadyUnlocked,

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
// Estado interno da sessão (Memória protegida)
// ----------------------------------------------------------------------

/// Estado privado da sessão.
///
/// Não derivar Debug: a estrutura contém material sensível (dek).
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

    /// Barreira de admissão: impede início de novas operações durante o bloqueio.
    admission_closed: bool,

    /// Contador de operações ativas em andamento.
    active_operations: usize,

    /// Data Encryption Key (DEK) de 256 bits instalada na sessão desbloqueada.
    dek: Option<Zeroizing<[u8; 32]>>,
}

// ----------------------------------------------------------------------
// Guard de Operação Ativa
// ----------------------------------------------------------------------

/// Guard RAII que rastreia uma operação autorizada em andamento na sessão.
pub struct VaultOperationGuard<'a> {
    session: &'a VaultSession,
    epoch: u64,
}

impl<'a> VaultOperationGuard<'a> {
    pub fn epoch(&self) -> u64 {
        self.epoch
    }
}

impl<'a> Drop for VaultOperationGuard<'a> {
    fn drop(&mut self) {
        let mut state = match self.session.state.lock() {
            Ok(s) => s,
            Err(poisoned) => {
                let mut s = poisoned.into_inner();
                VaultSession::fail_closed(&mut s);
                self.session.state.clear_poison();
                s
            }
        };
        if state.active_operations > 0 {
            state.active_operations -= 1;
            if state.active_operations == 0 && state.admission_closed {
                self.session.drain_cvar.notify_all();
            }
        }
    }
}

// ----------------------------------------------------------------------
// Gerenciador autoritativo da sessão
// ----------------------------------------------------------------------

/// Gerenciador autoritativo da sessão do cofre.
///
/// O Mutex protege as transições entre bloqueado e desbloqueado,
/// a geração da sessão e a DEK mantida em memória.
#[derive(Default)]
pub struct VaultSession {
    state: Mutex<SessionState>,
    drain_cvar: Condvar,
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
    /// Se o contador estiver esgotado, a sessão permanece bloqueada permanentemente.
    fn advance_epoch(state: &mut SessionState) -> Result<u64, AccessControlError> {
        if state.epoch_exhausted {
            state.unlocked = false;
            state.dek = None;
            return Err(AccessControlError::InvalidEpoch);
        }

        match state.epoch.checked_add(1) {
            Some(next_epoch) => {
                state.epoch = next_epoch;
                Ok(next_epoch)
            }

            None => {
                // Não reutilizar a época zero nem aceitar ABA.
                state.epoch_exhausted = true;
                state.unlocked = false;
                state.dek = None;

                log::error!(
                    "[Vault Security] Época da sessão esgotada. \
                     O cofre permanecerá bloqueado permanentemente."
                );
                Err(AccessControlError::InvalidEpoch)
            }
        }
    }

    /// Restaura o estado seguro após uma falha interna ou envenenamento de mutex.
    fn fail_closed(state: &mut SessionState) {
        state.unlocked = false;
        state.dek = None;
        state.admission_closed = true;

        let _ = Self::advance_epoch(state);
    }

    // --------------------------------------------------------------
    // Consulta do estado
    // --------------------------------------------------------------

    /// Retorna true somente quando a sessão está desbloqueada
    /// e a geração não está esgotada.
    pub fn is_unlocked(&self) -> bool {
        match self.state.lock() {
            Ok(state) => state.unlocked && !state.epoch_exhausted && !state.admission_closed,

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em is_unlocked(). \
                     Aplicando Fail-Closed."
                );

                let mut state = poisoned.into_inner();
                Self::fail_closed(&mut state);
                self.state.clear_poison();

                false
            }
        }
    }

    /// Obtém a geração atual da sessão.
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
                self.state.clear_poison();

                state.epoch
            }
        }
    }

    /// Verifica se existe uma DEK instalada em uma sessão efetivamente desbloqueada.
    /// Operação estritamente de consulta (read-only), sem mutações de estado colaterais (VLT-001).
    pub fn has_dek(&self) -> bool {
        match self.state.lock() {
            Ok(state) => {
                state.unlocked
                    && !state.epoch_exhausted
                    && state.dek.is_some()
                    && !state.admission_closed
            }
            Err(poisoned) => {
                let mut state = poisoned.into_inner();
                Self::fail_closed(&mut state);
                self.state.clear_poison();
                false
            }
        }
    }

    // --------------------------------------------------------------
    // Bloqueio
    // --------------------------------------------------------------

    /// Bloqueia a sessão com barreira de admissão, aguarda operações em andamento concluírem, descarta a DEK e avança o epoch.
    pub fn lock(&self) {
        let mut state = match self.state.lock() {
            Ok(state) => state,
            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em lock(). \
                     Restaurando o estado seguro."
                );
                let mut state = poisoned.into_inner();
                Self::fail_closed(&mut state);
                self.state.clear_poison();
                return;
            }
        };

        // 1. Fecha imediatamente a barreira de admissão: nenhuma nova operação pode entrar
        state.admission_closed = true;

        // 2. Aguarda a conclusão e liberação do guard das operações já em trânsito (drain)
        while state.active_operations > 0 {
            state = match self.drain_cvar.wait(state) {
                Ok(s) => s,
                Err(poisoned) => {
                    let mut s = poisoned.into_inner();
                    Self::fail_closed(&mut s);
                    self.state.clear_poison();
                    return;
                }
            };
        }

        // 3. Com todas as operações concluídas e nenhum novo ingresso permitido:
        state.unlocked = false;
        state.dek = None; // ZeroizeOnDrop atua instantaneamente

        let _ = Self::advance_epoch(&mut state);
        self.state.clear_poison();
    }

    // --------------------------------------------------------------
    // Desbloqueio e Acesso Criptográfico V2 (DEK)
    // --------------------------------------------------------------

    /// Desbloqueia a sessão instalando a DEK de 256 bits, avançando o epoch monotônico.
    pub fn unlock_with_dek(
        &self,
        expected_epoch: u64,
        dek: Zeroizing<[u8; 32]>,
    ) -> Result<u64, AccessControlError> {
        let mut state = match self.state.lock() {
            Ok(state) => state,
            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em unlock_with_dek(). \
                     Aplicando Fail-Closed."
                );
                let mut state = poisoned.into_inner();
                Self::fail_closed(&mut state);
                self.state.clear_poison();
                return Err(AccessControlError::Locked);
            }
        };

        if state.epoch_exhausted || state.epoch != expected_epoch {
            return Err(AccessControlError::InvalidEpoch);
        }

        if state.unlocked {
            return Err(AccessControlError::AlreadyUnlocked);
        }

        // VLT-003: Impede instalar nova sessão enquanto houver operações ativas de época anterior pendentes
        if state.active_operations > 0 {
            log::warn!(
                "[Vault Security] unlock_with_dek rejeitado: {} operações ativas pendentes de drenagem.",
                state.active_operations
            );
            return Err(AccessControlError::Locked);
        }

        // VLT-002: Aborta imediatamente se o avanço de epoch falhar (overflow ou esgotamento)
        let new_epoch = Self::advance_epoch(&mut state)?;

        state.unlocked = true;
        state.admission_closed = false;
        state.dek = Some(dek);

        Ok(new_epoch)
    }

    /// Executa uma operação estritamente síncrona retendo acesso seguro à DEK em memória.
    ///
    /// O lock é mantido durante a execução da closure para impedir descarte concorrente da chave.
    pub fn with_dek<F, R>(&self, f: F) -> Result<R, AccessControlError>
    where
        F: FnOnce(&[u8; 32]) -> Result<R, AccessControlError>,
    {
        let state = match self.state.lock() {
            Ok(state) => state,
            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em with_dek(). \
                     Aplicando Fail-Closed."
                );
                let mut state = poisoned.into_inner();
                Self::fail_closed(&mut state);
                self.state.clear_poison();
                return Err(AccessControlError::Locked);
            }
        };

        if state.epoch_exhausted || !state.unlocked || state.admission_closed {
            return Err(AccessControlError::Locked);
        }

        match state.dek.as_ref() {
            Some(dek) => f(dek.as_slice().try_into().unwrap()),
            None => Err(AccessControlError::Locked),
        }
    }

    /// Registra uma operação autorizada ativa na sessão retornando um guard RAII.
    pub fn acquire_operation(&self) -> Result<VaultOperationGuard<'_>, AccessControlError> {
        let mut state = match self.state.lock() {
            Ok(state) => state,
            Err(poisoned) => {
                let mut state = poisoned.into_inner();
                Self::fail_closed(&mut state);
                self.state.clear_poison();
                return Err(AccessControlError::Locked);
            }
        };

        if state.epoch_exhausted || !state.unlocked || state.admission_closed || state.dek.is_none()
        {
            return Err(AccessControlError::Locked);
        }

        state.active_operations = state
            .active_operations
            .checked_add(1)
            .ok_or(AccessControlError::Locked)?;

        Ok(VaultOperationGuard {
            session: self,
            epoch: state.epoch,
        })
    }

    // --------------------------------------------------------------
    // Métodos Legados V1 (Compatibilidade Temporária de Época)
    // --------------------------------------------------------------

    pub fn try_unlock(&self, expected_epoch: u64) -> bool {
        match self.state.lock() {
            Ok(mut state) => {
                if state.epoch_exhausted || state.epoch != expected_epoch || state.admission_closed
                {
                    return false;
                }
                if Self::advance_epoch(&mut state).is_err() {
                    return false;
                }
                state.unlocked = true;
                true
            }
            Err(poisoned) => {
                let mut state = poisoned.into_inner();
                Self::fail_closed(&mut state);
                self.state.clear_poison();
                false
            }
        }
    }

    // --------------------------------------------------------------
    // Compatibilidade de testes
    // --------------------------------------------------------------

    #[cfg(test)]
    pub fn set_dek_for_test(&self, dek: &[u8; 32]) {
        if let Ok(mut state) = self.state.lock() {
            state.unlocked = true;
            state.admission_closed = false;
            let mut buf = [0u8; 32];
            buf.copy_from_slice(dek);
            state.dek = Some(Zeroizing::new(buf));
        }
    }

    #[cfg(test)]
    pub fn set_unlocked(&self, unlocked: bool) {
        match self.state.lock() {
            Ok(mut state) => {
                let _ = Self::advance_epoch(&mut state);
                if state.epoch_exhausted {
                    state.unlocked = false;
                    state.dek = None;
                    return;
                }
                state.unlocked = unlocked;
                state.admission_closed = !unlocked;
                if !unlocked {
                    state.dek = None;
                }
            }
            Err(poisoned) => {
                let mut state = poisoned.into_inner();
                Self::fail_closed(&mut state);
                self.state.clear_poison();
            }
        }
    }
}

// ----------------------------------------------------------------------
// Material sensível de sessão legado
// ----------------------------------------------------------------------

#[derive(Default, Zeroize, ZeroizeOnDrop)]
pub struct SessionKey(pub Option<String>);

// ----------------------------------------------------------------------
// Cabeçalho persistido do cofre V2 (Normativo)
// ----------------------------------------------------------------------

/// Cabeçalho persistido V2 do cofre utilizando KEK / DEK e verificação estrita.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultHeaderV2 {
    pub version: u32,
    pub wrapped_dek: WrappedDekEnvelope,
    pub created_at: String,
}

impl VaultHeaderV2 {
    pub const CURRENT_VERSION: u32 = 2;

    /// Inicializa o cofre gerando DEK aleatória e derivando KEK a partir da senha mestre.
    pub fn init(
        password: &str,
        app_id: &str,
    ) -> Result<(Self, Zeroizing<[u8; 32]>), AccessControlError> {
        let mut salt = [0u8; 16];
        OsRng
            .try_fill_bytes(&mut salt)
            .map_err(|e| VaultCryptoError::EntropyFailed(format!("Falha ao gerar salt: {}", e)))?;

        let dek = VaultCrypto::generate_dek()?;
        let kek = VaultCrypto::derive_kek(password, &salt)?;
        let wrapped_dek = VaultCrypto::wrap_dek(&kek, &dek, &salt, app_id)?;

        let header = Self {
            version: Self::CURRENT_VERSION,
            wrapped_dek,
            created_at: chrono::Utc::now().to_rfc3339(),
        };

        Ok((header, dek))
    }

    /// Desbloqueia o cofre e recupera a DEK validando estritamente os parâmetros do envelope.
    pub fn unlock(
        &self,
        password: &str,
        app_id: &str,
    ) -> Result<Zeroizing<[u8; 32]>, AccessControlError> {
        if self.version != Self::CURRENT_VERSION {
            return Err(AccessControlError::InvalidPassword);
        }

        let (salt, _, _) = KdfProfile::validate_and_decode(&self.wrapped_dek)
            .map_err(|_| AccessControlError::InvalidPassword)?;

        let kek = VaultCrypto::derive_kek(password, &salt)
            .map_err(|_| AccessControlError::InvalidPassword)?;

        let dek = VaultCrypto::unwrap_dek(&kek, &self.wrapped_dek, app_id)
            .map_err(|_| AccessControlError::InvalidPassword)?;

        Ok(dek)
    }

    /// Rotação da senha mestre com custo independente da quantidade de registros (O(1)).
    pub fn rotate_password(
        &self,
        current_password: &str,
        new_password: &str,
        app_id: &str,
    ) -> Result<Self, AccessControlError> {
        let dek = self.unlock(current_password, app_id)?;

        let mut new_salt = [0u8; 16];
        OsRng.try_fill_bytes(&mut new_salt).map_err(|e| {
            VaultCryptoError::EntropyFailed(format!("Falha ao gerar novo salt: {}", e))
        })?;

        let new_kek = VaultCrypto::derive_kek(new_password, &new_salt)?;
        let new_wrapped_dek = VaultCrypto::wrap_dek(&new_kek, &dek, &new_salt, app_id)?;

        Ok(Self {
            version: Self::CURRENT_VERSION,
            wrapped_dek: new_wrapped_dek,
            created_at: chrono::Utc::now().to_rfc3339(),
        })
    }
}

// ----------------------------------------------------------------------
// Cabeçalho persistido do cofre V1 (Legado)
// ----------------------------------------------------------------------

/// Cabeçalho persistido V1 utilizado para verificar a senha mestre via canário.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultHeader {
    pub version: u32,
    pub canary_envelope: EncryptedEnvelope,
    pub created_at: String,
}

impl VaultHeader {
    const CURRENT_VERSION: u32 = 1;
    const CANARY_PLAINTEXT: &'static [u8] = b"ASPPIBRA_DEVOS_VAULT_CANARY_V1";

    pub fn new(password: &str) -> Result<Self, VaultCryptoError> {
        let canary_envelope = VaultCrypto::encrypt(password, Self::CANARY_PLAINTEXT)?;
        let now = chrono::Utc::now().to_rfc3339();

        Ok(Self {
            version: Self::CURRENT_VERSION,
            canary_envelope,
            created_at: now,
        })
    }

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
// Testes unitários (Fases 1 e 2)
// ----------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_header_v2_init_unlock_and_rotation_o1() {
        let password = "SuperMasterPasswordDevOS#2026";
        let new_password = "NewRotatedPasswordDevOS#2027";
        let app_id = "br.aspp.devos";

        // 1. Inicializa o cabeçalho V2
        let (header, initial_dek) = VaultHeaderV2::init(password, app_id).expect("Init V2");
        assert_eq!(header.version, 2);

        // 2. Desbloqueia com a senha correta e confere igualdade exata da DEK
        let unlocked_dek = header.unlock(password, app_id).expect("Unlock V2");
        assert_eq!(*initial_dek, *unlocked_dek);

        // 3. Rejeita senha incorreta
        assert!(header.unlock("WrongPassword", app_id).is_err());

        // 4. Rotação de senha em O(1) de dados
        let rotated_header = header
            .rotate_password(password, new_password, app_id)
            .expect("Rotate password");
        assert_eq!(rotated_header.version, 2);

        // 5. Senha antiga não destrava mais o novo cabeçalho
        assert!(rotated_header.unlock(password, app_id).is_err());

        // 6. Nova senha destrava e recupera EXATAMENTE a mesma DEK original
        let rotated_dek = rotated_header
            .unlock(new_password, app_id)
            .expect("Unlock rotated");
        assert_eq!(*initial_dek, *rotated_dek);
    }

    #[test]
    fn test_vault_session_v2_unlock_with_dek_lifecycle() {
        let session = VaultSession::new();
        assert!(!session.is_unlocked());
        assert!(!session.has_dek());

        let epoch = session.current_epoch();
        let dek = VaultCrypto::generate_dek().unwrap();

        // Desbloqueia com DEK
        let new_epoch = session
            .unlock_with_dek(epoch, dek)
            .expect("Unlock with DEK");
        assert!(new_epoch > epoch, "Epoch DEVE avançar no unlock");
        assert!(session.is_unlocked());
        assert!(session.has_dek());

        // with_dek executa com sucesso
        let read_result = session.with_dek(|raw_dek| {
            assert_eq!(raw_dek.len(), 32);
            Ok(42)
        });
        assert_eq!(read_result.unwrap(), 42);

        // Rejeita segundo unlock enquanto desbloqueado
        let another_dek = VaultCrypto::generate_dek().unwrap();
        assert!(matches!(
            session.unlock_with_dek(new_epoch, another_dek),
            Err(AccessControlError::AlreadyUnlocked)
        ));

        // Bloqueio descarta DEK e avança epoch
        session.lock();
        assert!(!session.is_unlocked());
        assert!(!session.has_dek());

        // with_dek rejeita quando bloqueado
        assert!(matches!(
            session.with_dek(|_| Ok(())),
            Err(AccessControlError::Locked)
        ));
    }

    #[test]
    fn test_vault_session_v2_prevents_unlock_after_concurrent_lock() {
        let session = VaultSession::new();
        let epoch = session.current_epoch();

        // Bloqueio concorrente invalida o epoch
        session.lock();

        let dek = VaultCrypto::generate_dek().unwrap();
        let result = session.unlock_with_dek(epoch, dek);
        assert!(matches!(result, Err(AccessControlError::InvalidEpoch)));
        assert!(!session.is_unlocked());
    }

    #[test]
    fn test_vault_session_v2_poison_recovery_fail_closed() {
        use std::sync::Arc;
        use std::thread;

        let session = Arc::new(VaultSession::new());
        let dek = VaultCrypto::generate_dek().unwrap();
        let epoch = session.current_epoch();
        session.unlock_with_dek(epoch, dek).unwrap();

        let poison_session = Arc::clone(&session);

        // Pânico intencional enquanto mantém o lock
        let _ = thread::spawn(move || {
            let _guard = poison_session.state.lock().unwrap();
            panic!("Pânico simulado para teste de envenenamento.");
        })
        .join();

        // with_dek detecta poison, aplica fail-closed e rejeita com Locked
        assert!(matches!(
            session.with_dek(|_| Ok(())),
            Err(AccessControlError::Locked)
        ));

        // Sessão foi bloqueada e DEK foi limpa
        assert!(!session.is_unlocked());
        assert!(!session.has_dek());

        // Recuperação permite novo ciclo limpo
        session.lock();
        let clean_epoch = session.current_epoch();
        let clean_dek = VaultCrypto::generate_dek().unwrap();
        assert!(session.unlock_with_dek(clean_epoch, clean_dek).is_ok());
        assert!(session.is_unlocked());
    }

    // --------------------------------------------------------------
    // Testes de regressão V1 legados
    // --------------------------------------------------------------

    #[test]
    fn test_vault_session_normal_lifecycle() {
        let session = VaultSession::new();
        assert!(!session.is_unlocked());

        let epoch = session.current_epoch();
        assert!(session.try_unlock(epoch));
        assert!(session.is_unlocked());

        session.lock();
        assert!(!session.is_unlocked());
        assert!(!session.has_dek());
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
            unlock_barrier.wait();
            unlock_barrier.wait();
            unlock_session.try_unlock(epoch)
        });

        barrier.wait();
        session.lock();
        barrier.wait();

        let unlock_result = handle.join().expect("Thread falhou");
        assert!(!unlock_result);
        assert!(!session.is_unlocked());
    }

    #[test]
    fn test_concurrent_operation_guard_drain_and_lock_barrier() {
        use std::sync::{Arc, Barrier};
        use std::thread;
        use std::time::Duration;

        let session = Arc::new(VaultSession::new());
        let epoch = session.current_epoch();
        let dek = VaultCrypto::generate_dek().unwrap();
        session.unlock_with_dek(epoch, dek).unwrap();

        let barrier_start = Arc::new(Barrier::new(2));
        let barrier_done = Arc::new(Barrier::new(2));

        let sess_thread_a = Arc::clone(&session);
        let b_start_a = Arc::clone(&barrier_start);
        let b_done_a = Arc::clone(&barrier_done);

        // Thread A: adquire guard da operação, simula trabalho de escrita e transação
        let handle_a = thread::spawn(move || {
            let guard = sess_thread_a.acquire_operation().expect("Adquire guard");

            // 1. Aquisição da DEK e cifragem do segredo
            let dek_read = sess_thread_a.with_dek(|d| Ok(*d));
            assert!(dek_read.is_ok());

            // 2. Notifica que guard foi adquirido e cifragem concluída, iniciando a transação SQLite
            b_start_a.wait();

            // 3. Simula tempo de transação SQLite / commit em andamento
            thread::sleep(Duration::from_millis(50));

            // 4. Conclui a transação e libera o guard
            drop(guard);
            b_done_a.wait();
        });

        // Thread B: aguarda Thread A adquirir o guard
        barrier_start.wait();

        // Spawn do lock em Thread B
        let sess_thread_b = Arc::clone(&session);
        let handle_b = thread::spawn(move || {
            // Chama lock(). Deve aguardar Thread A liberar seu guard
            sess_thread_b.lock();
            assert!(!sess_thread_b.is_unlocked());
            assert!(!sess_thread_b.has_dek());
        });

        // Aguarda breve para lock() fechar admissão
        thread::sleep(Duration::from_millis(15));
        // Qualquer nova operação tentada após o início do lock é REJEITADA imediatamente
        assert!(matches!(
            session.acquire_operation(),
            Err(AccessControlError::Locked)
        ));

        barrier_done.wait();
        handle_a.join().unwrap();
        handle_b.join().unwrap();

        // Sessão está bloqueada definitivamente
        assert!(!session.is_unlocked());
        assert!(!session.has_dek());
    }

    #[test]
    fn test_has_dek_is_pure_query_and_does_not_mutate_state() {
        let session = VaultSession::new();
        let epoch = session.current_epoch();
        let dek = VaultCrypto::generate_dek().unwrap();
        session.unlock_with_dek(epoch, dek).unwrap();

        assert!(session.has_dek());
        assert!(session.has_dek());
        assert!(session.is_unlocked());

        session.lock();
        assert!(!session.has_dek());
        assert!(!session.is_unlocked());
    }

    #[test]
    fn test_unlock_with_dek_rejects_when_epoch_exhausted() {
        let session = VaultSession::new();
        let dek = VaultCrypto::generate_dek().unwrap();

        // Simula epoch no limite de u64
        session.state.lock().unwrap().epoch = u64::MAX;
        let result = session.unlock_with_dek(u64::MAX, dek);
        assert!(matches!(result, Err(AccessControlError::InvalidEpoch)));
        assert!(!session.is_unlocked());
        assert!(!session.has_dek());
    }

    #[test]
    fn test_unlock_with_dek_rejects_when_operations_still_active() {
        let session = VaultSession::new();
        let epoch = session.current_epoch();
        let dek = VaultCrypto::generate_dek().unwrap();
        session.unlock_with_dek(epoch, dek).unwrap();

        let guard = session.acquire_operation().unwrap();

        let dek2 = VaultCrypto::generate_dek().unwrap();
        let result = session.unlock_with_dek(session.current_epoch(), dek2);
        assert!(matches!(result, Err(AccessControlError::AlreadyUnlocked)));

        drop(guard);
    }

    #[test]
    fn test_concurrency_stress_admission_closed_interleaving_impossible() {
        use std::sync::Arc;
        use std::sync::atomic::{AtomicUsize, Ordering};
        use std::thread;
        use std::time::Duration;

        let session = Arc::new(VaultSession::new());
        let epoch = session.current_epoch();
        let dek = Zeroizing::new([0x77u8; 32]);
        session.unlock_with_dek(epoch, dek).unwrap();

        let num_threads = 20;
        let successful_ops = Arc::new(AtomicUsize::new(0));
        let rejected_ops = Arc::new(AtomicUsize::new(0));
        let mut handles = Vec::new();

        // 20 threads tentam adquirir e operar simultaneamente
        for _ in 0..num_threads {
            let sess = Arc::clone(&session);
            let succ = Arc::clone(&successful_ops);
            let rej = Arc::clone(&rejected_ops);
            handles.push(thread::spawn(move || {
                match sess.acquire_operation() {
                    Ok(guard) => {
                        // Se admitido, o DEK deve existir e estar acessível de forma consistente
                        let val = sess.with_dek(|d| Ok(d[0]));
                        assert_eq!(val.unwrap(), 0x77);
                        thread::sleep(Duration::from_millis(5));
                        drop(guard);
                        succ.fetch_add(1, Ordering::SeqCst);
                    }
                    Err(AccessControlError::Locked) => {
                        rej.fetch_add(1, Ordering::SeqCst);
                    }
                    Err(e) => panic!("Erro inesperado: {:?}", e),
                }
            }));
        }

        // Uma thread concorrente dispara lock() no meio do tráfego
        let sess_lock = Arc::clone(&session);
        let lock_handle = thread::spawn(move || {
            thread::sleep(Duration::from_millis(1));
            sess_lock.lock();
        });

        lock_handle.join().unwrap();
        for h in handles {
            h.join().unwrap();
        }

        // Total de operações tentadas é exatamente 20
        assert_eq!(
            successful_ops.load(Ordering::SeqCst) + rejected_ops.load(Ordering::SeqCst),
            num_threads
        );

        // Nenhuma operação ativa restou
        assert_eq!(session.state.lock().unwrap().active_operations, 0);
        assert!(!session.is_unlocked());
        assert!(!session.has_dek());
    }
}
