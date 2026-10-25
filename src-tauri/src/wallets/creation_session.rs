use std::collections::HashMap;
use std::sync::{Arc, LazyLock, Mutex};
use std::time::{Duration, Instant};
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

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
    pub staged: StagedMnemonic,
    pub created_at: Instant,
}

pub struct CreationSessionStore {
    sessions: Arc<Mutex<HashMap<String, StagedSession>>>,
    ttl: Duration,
}

impl CreationSessionStore {
    pub fn new(ttl_secs: u64) -> Self {
        Self::with_sweep_interval(ttl_secs, 15)
    }

    /// Cria uma nova instância com rotina em background periódica para expurgo autônomo
    pub fn with_sweep_interval(ttl_secs: u64, sweep_secs: u64) -> Self {
        let ttl = Duration::from_secs(ttl_secs);
        let sessions: Arc<Mutex<HashMap<String, StagedSession>>> =
            Arc::new(Mutex::new(HashMap::new()));

        let reaper_sessions = Arc::clone(&sessions);
        let sweep_duration = Duration::from_secs(sweep_secs.max(1));
        let _ = std::thread::Builder::new()
            .name("devos_session_reaper".to_string())
            .spawn(move || {
                loop {
                    std::thread::sleep(sweep_duration);
                    if let Ok(mut map) = reaper_sessions.lock() {
                        map.retain(|_, s| s.created_at.elapsed() <= ttl);
                    }
                }
            });

        Self { sessions, ttl }
    }

    /// Armazena a mnemônica gerada em memória segura no Rust com TTL
    pub fn create_session(&self, mnemonic: String) -> String {
        let mut map = self.sessions.lock().unwrap();
        self.cleanup_expired_internal(&mut map);

        let session_id = format!(
            "stag_{}_{:08x}",
            chrono::Utc::now().timestamp_millis(),
            rand::random::<u32>()
        );

        map.insert(
            session_id.clone(),
            StagedSession {
                staged: StagedMnemonic::new(mnemonic),
                created_at: Instant::now(),
            },
        );

        session_id
    }

    /// Revela a mnemônica efêmera mediante solicitação autorizada
    pub fn get_mnemonic(&self, session_id: &str) -> Option<Zeroizing<String>> {
        let mut map = self.sessions.lock().unwrap();
        if let Some(session) = map.get(session_id) {
            if session.created_at.elapsed() <= self.ttl {
                return Some(session.staged.to_zeroizing());
            } else {
                map.remove(session_id);
            }
        }
        None
    }

    /// Consome e remove atomicamente a mnemônica da sessão, destruindo a entrada original
    pub fn consume_mnemonic(&self, session_id: &str) -> Option<Zeroizing<String>> {
        let mut map = self.sessions.lock().unwrap();
        if let Some(session) = map.remove(session_id) {
            if session.created_at.elapsed() <= self.ttl {
                return Some(session.staged.to_zeroizing());
            }
        }
        None
    }

    /// Cancela imediatamente a sessão em progresso, destruindo e zeroizando o segredo da memória
    pub fn cancel_session(&self, session_id: &str) -> bool {
        let mut map = self.sessions.lock().unwrap();
        if let Some(mut session) = map.remove(session_id) {
            session.staged.zeroize();
            true
        } else {
            false
        }
    }

    /// Retorna a quantidade de sessões ativas atualmente na memória
    pub fn session_count(&self) -> usize {
        let map = self.sessions.lock().unwrap();
        map.len()
    }

    /// Executa varredura de limpeza explícita e retorna a quantidade de sessões expurgadas
    pub fn purge_expired(&self) -> usize {
        let mut map = self.sessions.lock().unwrap();
        let initial_len = map.len();
        let ttl = self.ttl;
        map.retain(|_, s| s.created_at.elapsed() <= ttl);
        initial_len - map.len()
    }

    fn cleanup_expired_internal(&self, map: &mut HashMap<String, StagedSession>) {
        let ttl = self.ttl;
        map.retain(|_, s| s.created_at.elapsed() <= ttl);
    }
}

/// Instância global com TTL de 5 minutos e varredura de fundo a cada 15 segundos
pub static GLOBAL_CREATION_STORE: LazyLock<Arc<CreationSessionStore>> =
    LazyLock::new(|| Arc::new(CreationSessionStore::new(300)));

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_creation_session_lifecycle_and_zeroize() {
        let store = CreationSessionStore::new(60);
        let secret = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about".to_string();

        let session_id = store.create_session(secret.clone());
        assert!(session_id.starts_with("stag_"));
        assert_eq!(store.session_count(), 1);

        // Recupera mnemônica temporariamente com wrapper Zeroizing
        let revealed = store
            .get_mnemonic(&session_id)
            .expect("Sessão deve existir");
        assert_eq!(*revealed, secret);

        // Consome mnemônica atomicamente para gravação no cofre
        let consumed = store
            .consume_mnemonic(&session_id)
            .expect("Sessão deve existir");
        assert_eq!(*consumed, secret);

        // Verifica que a sessão consumida não pode ser reutilizada
        assert!(store.get_mnemonic(&session_id).is_none());
        assert!(store.consume_mnemonic(&session_id).is_none());
        assert_eq!(store.session_count(), 0);
    }

    #[test]
    fn test_cancel_session_purges_secret() {
        let store = CreationSessionStore::new(60);
        let secret = "test test test test test test test test test test test junk".to_string();

        let session_id = store.create_session(secret);
        assert_eq!(store.session_count(), 1);
        assert!(store.cancel_session(&session_id));
        // Cancelamento invalida a sessão e limpa o segredo
        assert!(store.get_mnemonic(&session_id).is_none());
        assert!(store.consume_mnemonic(&session_id).is_none());
        assert_eq!(store.session_count(), 0);
    }

    #[test]
    fn test_expiration_purges_secret() {
        // TTL de 0 segundos: expira imediatamente
        let store = CreationSessionStore::new(0);
        let secret = "word word word word word word word word word word word word".to_string();

        let session_id = store.create_session(secret);
        std::thread::sleep(Duration::from_millis(50));

        // Sessão expirada não permite recuperação nem consumo
        assert!(store.get_mnemonic(&session_id).is_none());
        assert!(store.consume_mnemonic(&session_id).is_none());
    }

    #[test]
    fn test_periodic_cleanup_sweeps_without_user_request() {
        // TTL de 1 segundo e intervalo de varredura de fundo de 1 segundo
        let store = CreationSessionStore::with_sweep_interval(1, 1);
        let secret =
            "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu".to_string();

        let _session_id = store.create_session(secret);
        assert_eq!(store.session_count(), 1);

        // Aguarda 2.2 segundos SEM nenhuma requisição do usuário
        std::thread::sleep(Duration::from_millis(2200));

        // A thread em segundo plano deve ter expurgado autonomamente a sessão expirada
        assert_eq!(
            store.session_count(),
            0,
            "A sessão expirada deve ser expurgada autonomamente pelo reaper em background"
        );
    }
}
