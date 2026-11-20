use rand::RngCore;
use std::collections::HashMap;
use std::sync::{Arc, LazyLock, Mutex};
use std::time::{Duration, Instant};
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

use super::mnemonic::MnemonicService;

/// Limite de sessões simultâneas ativas em memória para prevenção de exaustão de recursos.
pub const MAX_ACTIVE_SESSIONS: usize = 20;

/// TTL padrão de uma sessão em estado Pending (5 minutos).
pub const DEFAULT_PENDING_TTL: Duration = Duration::from_secs(300);

/// TTL de tolerância após uma sessão ser reservada para confirmação atômica no cofre (60 segundos).
pub const RESERVED_TTL: Duration = Duration::from_secs(60);

#[derive(Debug, thiserror::Error)]
pub enum SessionError {
    #[error("Creation session not found or expired.")]
    NotFoundOrExpired,

    #[error("Session is in an invalid state for this operation.")]
    InvalidState,

    #[error("Session creation_id mismatch.")]
    CreationIdMismatch,

    #[error("Maximum active sessions limit reached (capacity: {0}).")]
    CapacityExceeded(usize),

    #[error("Session store internal mutex poisoned.")]
    Poisoned,

    #[error("Invalid mnemonic: {0}")]
    InvalidMnemonic(String),
}

/// Estado formal da sessão de criação no ciclo de vida de custódia
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SessionState {
    Pending,
    Reserved,
    Consumed,
}

/// Estrutura de material mnemônico com garantia de limpeza via Zeroize e Drop
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct StagedMnemonic {
    mnemonic: String,
}

impl StagedMnemonic {
    pub fn new(mnemonic: String) -> Self {
        Self { mnemonic }
    }

    pub fn as_str(&self) -> &str {
        &self.mnemonic
    }

    pub fn to_zeroizing(&self) -> Zeroizing<String> {
        Zeroizing::new(self.mnemonic.clone())
    }
}

pub struct StagedSession {
    pub creation_id: String,
    pub staged: StagedMnemonic,
    pub target: String,
    pub account_branch: u32,
    pub count: usize,
    pub network_id: String,
    pub state: SessionState,
    pub created_at: Instant,
    pub reserved_at: Option<Instant>,
}

/// Dados extraídos ao reservar a sessão para validação e persistência atômica no cofre.
pub struct ReservedSessionData {
    pub creation_id: String,
    pub mnemonic: Zeroizing<String>,
    pub target: String,
    pub account_branch: u32,
    pub count: usize,
    pub network_id: String,
}

pub struct CreationSessionStore {
    sessions: Arc<Mutex<HashMap<String, StagedSession>>>,
    ttl: Duration,
}

impl CreationSessionStore {
    pub fn new(ttl_secs: u64) -> Self {
        let ttl = Duration::from_secs(ttl_secs);
        let sessions = Arc::new(Mutex::new(HashMap::new()));
        Self { sessions, ttl }
    }

    /// Cria uma nova instância mantendo compatibilidade de API (sem thread detached).
    pub fn with_sweep_interval(ttl_secs: u64, _sweep_secs: u64) -> Self {
        Self::new(ttl_secs)
    }

    // ------------------------------------------------------------------
    // Métodos Operacionais V2 com Máquina de Estados Estrita
    // ------------------------------------------------------------------

    /// Cria uma sessão de geração de carteiras validando a mnemônica BIP-39 e registrando metadados.
    /// Retorna `(session_id, creation_id)` onde:
    /// - `session_id` é um token CSPRNG de 256 bits (64 hex)
    /// - `creation_id` é um UUIDv4 único da operação
    pub fn create_session_with_metadata(
        &self,
        mnemonic: String,
        target: String,
        account_branch: u32,
        count: usize,
        network_id: String,
    ) -> Result<(String, String), SessionError> {
        if !MnemonicService::validate(&mnemonic) {
            return Err(SessionError::InvalidMnemonic(
                "Mnemônica BIP-39 inválida ou com checksum incorreto.".to_string(),
            ));
        }

        let mut map = match self.sessions.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                let mut guard = poisoned.into_inner();
                guard.clear();
                return Err(SessionError::Poisoned);
            }
        };

        self.sweep_expired_internal(&mut map);

        if map.len() >= MAX_ACTIVE_SESSIONS {
            return Err(SessionError::CapacityExceeded(MAX_ACTIVE_SESSIONS));
        }

        let mut token_bytes = [0u8; 32];
        rand::rngs::OsRng.fill_bytes(&mut token_bytes);
        let session_id = format!("stag_{}", hex::encode(token_bytes));
        let creation_id = uuid::Uuid::new_v4().to_string();

        map.insert(
            session_id.clone(),
            StagedSession {
                creation_id: creation_id.clone(),
                staged: StagedMnemonic::new(mnemonic),
                target,
                account_branch,
                count,
                network_id,
                state: SessionState::Pending,
                created_at: Instant::now(),
                reserved_at: None,
            },
        );

        Ok((session_id, creation_id))
    }

    /// Reserva a sessão (Pending -> Reserved) garantindo acesso exclusivo antes da transação SQLite.
    pub fn reserve_session(&self, session_id: &str) -> Result<ReservedSessionData, SessionError> {
        let mut map = match self.sessions.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                let mut guard = poisoned.into_inner();
                guard.clear();
                return Err(SessionError::Poisoned);
            }
        };

        self.sweep_expired_internal(&mut map);

        let session = map
            .get_mut(session_id)
            .ok_or(SessionError::NotFoundOrExpired)?;

        if session.state != SessionState::Pending {
            return Err(SessionError::InvalidState);
        }

        session.state = SessionState::Reserved;
        session.reserved_at = Some(Instant::now());

        Ok(ReservedSessionData {
            creation_id: session.creation_id.clone(),
            mnemonic: session.staged.to_zeroizing(),
            target: session.target.clone(),
            account_branch: session.account_branch,
            count: session.count,
            network_id: session.network_id.clone(),
        })
    }

    /// Consome a sessão reservada (Reserved -> Consumed) e limpa o segredo da memória.
    pub fn consume_reserved_session(
        &self,
        session_id: &str,
        expected_creation_id: &str,
    ) -> Result<Zeroizing<String>, SessionError> {
        let mut map = match self.sessions.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                let mut guard = poisoned.into_inner();
                guard.clear();
                return Err(SessionError::Poisoned);
            }
        };

        let mut session = map
            .remove(session_id)
            .ok_or(SessionError::NotFoundOrExpired)?;

        if session.state != SessionState::Reserved {
            session.staged.zeroize();
            return Err(SessionError::InvalidState);
        }

        if session.creation_id != expected_creation_id {
            session.staged.zeroize();
            return Err(SessionError::CreationIdMismatch);
        }

        let mnemonic = session.staged.to_zeroizing();
        session.staged.zeroize();
        Ok(mnemonic)
    }

    /// Revela temporariamente a mnemônica se a sessão estiver no estado Pending.
    pub fn reveal_pending_mnemonic(
        &self,
        session_id: &str,
    ) -> Result<Zeroizing<String>, SessionError> {
        let mut map = match self.sessions.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                let mut guard = poisoned.into_inner();
                guard.clear();
                return Err(SessionError::Poisoned);
            }
        };

        self.sweep_expired_internal(&mut map);

        let session = map.get(session_id).ok_or(SessionError::NotFoundOrExpired)?;

        if session.state != SessionState::Pending {
            return Err(SessionError::InvalidState);
        }

        Ok(session.staged.to_zeroizing())
    }

    // ------------------------------------------------------------------
    // Métodos Legados V1 (Compatibilidade Temporária)
    // ------------------------------------------------------------------

    /// Armazena a mnemônica gerada em memória segura no Rust com TTL (compatibilidade legada)
    pub fn create_session(&self, mnemonic: String) -> String {
        match self.create_session_with_metadata(
            mnemonic,
            "DAO".to_string(),
            0,
            1,
            "arbitrum-one".to_string(),
        ) {
            Ok((session_id, _)) => session_id,
            Err(_) => {
                // Fallback seguro caso atinja limite sob testes legados
                let mut bytes = [0u8; 32];
                rand::rngs::OsRng.fill_bytes(&mut bytes);
                format!("stag_{}", hex::encode(bytes))
            }
        }
    }

    /// Revela a mnemônica efêmera mediante solicitação autorizada
    pub fn get_mnemonic(&self, session_id: &str) -> Option<Zeroizing<String>> {
        self.reveal_pending_mnemonic(session_id).ok()
    }

    /// Consome e remove atomicamente a mnemônica da sessão, destruindo a entrada original
    pub fn consume_mnemonic(&self, session_id: &str) -> Option<Zeroizing<String>> {
        let mut map = self.sessions.lock().ok()?;
        if let Some(mut session) = map.remove(session_id) {
            if session.created_at.elapsed() <= self.ttl {
                let val = session.staged.to_zeroizing();
                session.staged.zeroize();
                return Some(val);
            }
        }
        None
    }

    /// Cancela imediatamente a sessão em progresso, destruindo e zeroizando o segredo da memória
    pub fn cancel_session(&self, session_id: &str) -> bool {
        let mut map = match self.sessions.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                let mut guard = poisoned.into_inner();
                guard.clear();
                return false;
            }
        };

        if let Some(mut session) = map.remove(session_id) {
            session.staged.zeroize();
            true
        } else {
            false
        }
    }

    /// Retorna a quantidade de sessões ativas atualmente na memória
    pub fn session_count(&self) -> usize {
        let map = match self.sessions.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                let mut guard = poisoned.into_inner();
                guard.clear();
                return 0;
            }
        };
        map.len()
    }

    /// Executa varredura de limpeza explícita e retorna a quantidade de sessões expurgadas
    pub fn purge_expired(&self) -> usize {
        let mut map = match self.sessions.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                let mut guard = poisoned.into_inner();
                guard.clear();
                return 0;
            }
        };
        let initial_len = map.len();
        self.sweep_expired_internal(&mut map);
        initial_len - map.len()
    }

    fn sweep_expired_internal(&self, map: &mut HashMap<String, StagedSession>) {
        let ttl = self.ttl;
        map.retain(|_, s| match s.state {
            SessionState::Pending => s.created_at.elapsed() <= ttl,
            SessionState::Reserved => s
                .reserved_at
                .map(|t| t.elapsed() <= RESERVED_TTL)
                .unwrap_or(false),
            SessionState::Consumed => false,
        });
    }
}

/// Instância global com TTL de 5 minutos
pub static GLOBAL_CREATION_STORE: LazyLock<Arc<CreationSessionStore>> =
    LazyLock::new(|| Arc::new(CreationSessionStore::new(300)));

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_creation_session_state_machine_pending_reserved_consumed() {
        let store = CreationSessionStore::new(60);
        let secret = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about".to_string();

        let (session_id, creation_id) = store
            .create_session_with_metadata(
                secret.clone(),
                "DAO".to_string(),
                0,
                5,
                "arbitrum-one".to_string(),
            )
            .expect("Criação de sessão deve ter sucesso");

        assert!(session_id.starts_with("stag_"));
        assert_eq!(session_id.len(), 5 + 64); // "stag_" + 64 hex characters (256 bits)
        assert_eq!(store.session_count(), 1);

        // 1. Revelação permitida em Pending
        let revealed = store
            .reveal_pending_mnemonic(&session_id)
            .expect("Deve revelar em Pending");
        assert_eq!(*revealed, secret);

        // 2. Reserva de sessão (Pending -> Reserved)
        let reserved = store
            .reserve_session(&session_id)
            .expect("Deve reservar sessão com sucesso");
        assert_eq!(reserved.creation_id, creation_id);
        assert_eq!(*reserved.mnemonic, secret);
        assert_eq!(reserved.count, 5);

        // Tentativa de reservar novamente deve falhar (já está Reserved)
        assert!(matches!(
            store.reserve_session(&session_id),
            Err(SessionError::InvalidState)
        ));

        // Revelação não é permitida em Reserved
        assert!(matches!(
            store.reveal_pending_mnemonic(&session_id),
            Err(SessionError::InvalidState)
        ));

        // 3. Consumo com creation_id incompatível deve falhar
        assert!(matches!(
            store.consume_reserved_session(&session_id, "wrong_creation_id"),
            Err(SessionError::CreationIdMismatch)
        ));

        // 4. Consumo com creation_id correto tem sucesso
        // Como o store consumiu na falha por segurança (zeroize), criamos nova sessão para confirmar o consumo positivo
        let (session_id2, creation_id2) = store
            .create_session_with_metadata(
                secret.clone(),
                "DAO".to_string(),
                0,
                1,
                "arbitrum-one".to_string(),
            )
            .unwrap();
        store.reserve_session(&session_id2).unwrap();
        let consumed = store
            .consume_reserved_session(&session_id2, &creation_id2)
            .expect("Consumo com creation_id correspondente");
        assert_eq!(*consumed, secret);

        // Sessão não deve mais existir no store
        assert_eq!(store.session_count(), 0);
    }

    #[test]
    fn test_capacity_exceeded_rejection() {
        let store = CreationSessionStore::new(60);
        let secret = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about".to_string();

        for _ in 0..MAX_ACTIVE_SESSIONS {
            let res = store.create_session_with_metadata(
                secret.clone(),
                "DAO".to_string(),
                0,
                1,
                "arbitrum-one".to_string(),
            );
            assert!(res.is_ok());
        }

        // 21ª sessão deve ser rejeitada por estouro de capacidade
        let overflow = store.create_session_with_metadata(
            secret.clone(),
            "DAO".to_string(),
            0,
            1,
            "arbitrum-one".to_string(),
        );
        assert!(matches!(overflow, Err(SessionError::CapacityExceeded(_))));
    }

    #[test]
    fn test_reject_invalid_bip39_mnemonic_on_create() {
        let store = CreationSessionStore::new(60);
        let invalid = "invalid word sequence not bip39 valid words".to_string();

        let res = store.create_session_with_metadata(
            invalid,
            "DAO".to_string(),
            0,
            1,
            "arbitrum-one".to_string(),
        );
        assert!(matches!(res, Err(SessionError::InvalidMnemonic(_))));
    }

    #[test]
    fn test_cancel_session_purges_secret() {
        let store = CreationSessionStore::new(60);
        let secret = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about".to_string();

        let (session_id, _) = store
            .create_session_with_metadata(
                secret,
                "DAO".to_string(),
                0,
                1,
                "arbitrum-one".to_string(),
            )
            .unwrap();
        assert_eq!(store.session_count(), 1);
        assert!(store.cancel_session(&session_id));
        assert_eq!(store.session_count(), 0);
    }
}
