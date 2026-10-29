use rusqlite::{Connection, OptionalExtension, params};
use serde::{Deserialize, Serialize};

use std::fs::{self, OpenOptions};
use std::path::{Path, PathBuf};
use std::time::Duration;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

use crate::vault::access_control::{VaultHeader, VaultStatus};
use crate::vault::encryption::{EncryptedEnvelope, VaultCryptoError};

// ----------------------------------------------------------------------
// Erros de armazenamento
// ----------------------------------------------------------------------

#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("SQLite database error: {0}")]
    Sqlite(#[from] rusqlite::Error),

    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Vault error: {0}")]
    Vault(#[from] VaultCryptoError),

    #[error("Vault not found: {0}")]
    NotFound(String),

    #[error("Invalid data: {0}")]
    InvalidData(String),

    #[error("O cofre do DevOS já foi inicializado anteriormente.")]
    AlreadyInitialized,
}

// ----------------------------------------------------------------------
// Modelos persistidos
// ----------------------------------------------------------------------

/// Metadados públicos da carteira persistida no SQLite.
///
/// Não registrar objetos completos desta estrutura nos logs operacionais,
/// pois client_doc pode conter dados sensíveis ou informações de identificação pessoal.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct StoredWallet {
    pub id: u64,
    pub target: String,       // "DAO" | "CLIENT"
    pub custody_type: String, // "WATCH_ONLY" | "CUSTODIAL_LOCAL"
    pub user: String,         // Nome do usuário / rótulo da DAO
    pub label: String,
    pub derivation_path: String,
    pub network: String,
    pub address: String,
    pub status: String,     // "ACTIVE" | "PENDING" | "ROTATED"
    pub kyc_status: String, // "UNVERIFIED" | "SIMULATED_TEST" | "VERIFIED"
    pub seed_words_count: usize,
    pub created_at: String,
    pub vault_id: Option<String>, // NULL se WATCH_ONLY
    pub client_doc: Option<String>,
}

/// Registro criptografado do cofre (envelope AEAD) persistido no SQLite.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredSecret {
    pub vault_id: String,
    pub target: String,
    pub envelope: EncryptedEnvelope,
    pub created_at: String,
}

// ----------------------------------------------------------------------
// Banco de dados local SQLite seguro do DevOS
// ----------------------------------------------------------------------

pub struct LocalDatabase {
    db_path: PathBuf,
}

impl LocalDatabase {
    pub fn new(base_dir: PathBuf) -> Self {
        let db_path = base_dir.join("devos_vault.sqlite");
        Self { db_path }
    }

    /// Retorna o caminho do banco.
    pub fn db_path(&self) -> &PathBuf {
        &self.db_path
    }

    // ------------------------------------------------------------------
    // Utilitários internos para caminhos e arquivos
    // ------------------------------------------------------------------

    fn parent_directory(path: &Path) -> &Path {
        path.parent()
            .filter(|parent| !parent.as_os_str().is_empty())
            .unwrap_or_else(|| Path::new("."))
    }

    /// Restringe as permissões do arquivo principal e de arquivos
    /// temporários no Unix para 0600 (apenas proprietário).
    fn set_private_file_permissions(path: &Path) -> Result<(), StorageError> {
        #[cfg(unix)]
        {
            if path.exists() {
                let mut permissions = fs::metadata(path)?.permissions();
                permissions.set_mode(0o600);
                fs::set_permissions(path, permissions)?;
            }
        }

        #[cfg(not(unix))]
        {
            let _ = path;
        }

        Ok(())
    }

    fn sidecar_paths(&self) -> [PathBuf; 2] {
        [
            self.db_path.with_extension("sqlite-wal"),
            self.db_path.with_extension("sqlite-shm"),
        ]
    }

    /// Remove um arquivo somente se ele existir, propagando erros de I/O reais.
    fn remove_file_if_exists(path: &Path) -> Result<(), StorageError> {
        match fs::remove_file(path) {
            Ok(()) => Ok(()),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(error) => Err(StorageError::Io(error)),
        }
    }

    /// Confirma que uma origem ou destino não corresponde ao banco
    /// ativo nem aos seus arquivos auxiliares WAL/SHM.
    fn ensure_not_active_database_path(
        &self,
        candidate: &Path,
        operation: &str,
    ) -> Result<(), StorageError> {
        let mut reserved_paths = vec![self.db_path.clone()];
        reserved_paths.extend(self.sidecar_paths());

        let candidate_canonical = candidate.canonicalize().ok();

        for reserved in reserved_paths {
            if candidate == reserved.as_path() {
                return Err(StorageError::InvalidData(format!(
                    "O caminho informado não pode ser utilizado como {}.",
                    operation
                )));
            }

            if let (Some(candidate_real), Ok(reserved_real)) =
                (candidate_canonical.as_ref(), reserved.canonicalize())
                && candidate_real == &reserved_real
            {
                return Err(StorageError::InvalidData(format!(
                    "O caminho informado não pode ser utilizado como {}.",
                    operation
                )));
            }
        }

        Ok(())
    }

    /// Cria um arquivo temporário exclusivo no mesmo diretório do destino.
    fn create_temporary_sibling(target: &Path, purpose: &str) -> Result<PathBuf, StorageError> {
        let parent = Self::parent_directory(target);
        fs::create_dir_all(parent)?;

        let file_name = target
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("devos-vault");

        for _ in 0..16 {
            let candidate = parent.join(format!(
                ".{}.{}.{}.tmp",
                file_name,
                purpose,
                rand::random::<u64>()
            ));

            match OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&candidate)
            {
                Ok(file) => {
                    drop(file);

                    if let Err(error) = Self::set_private_file_permissions(&candidate) {
                        let _ = fs::remove_file(&candidate);
                        return Err(error);
                    }

                    return Ok(candidate);
                }
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
                    continue;
                }
                Err(error) => return Err(StorageError::Io(error)),
            }
        }

        Err(StorageError::InvalidData(
            "Não foi possível criar um arquivo temporário exclusivo.".to_string(),
        ))
    }

    /// Instala um arquivo temporário no destino, preservando a versão anterior
    /// para rollback caso ocorra falha durante a substituição.
    fn install_staged_file(staged: &Path, destination: &Path) -> Result<(), StorageError> {
        let parent = Self::parent_directory(destination);
        fs::create_dir_all(parent)?;

        if destination.is_dir() {
            return Err(StorageError::InvalidData(
                "O destino informado é um diretório.".to_string(),
            ));
        }

        if !destination.exists() {
            match fs::rename(staged, destination) {
                Ok(()) => {
                    Self::set_private_file_permissions(destination)?;
                    return Ok(());
                }
                Err(_) => {
                    fs::copy(staged, destination)?;
                    let _ = fs::remove_file(staged);
                    Self::set_private_file_permissions(destination)?;
                    return Ok(());
                }
            }
        }

        let previous = Self::create_temporary_sibling(destination, "previous")?;
        let _ = fs::remove_file(&previous);

        fs::rename(destination, &previous)?;

        match fs::rename(staged, destination) {
            Ok(()) => {
                Self::set_private_file_permissions(destination)?;
                if let Err(error) = fs::remove_file(&previous) {
                    log::warn!(
                        "[Vault Storage] Não foi possível remover o arquivo anterior após a substituição: {}",
                        error
                    );
                }
                Ok(())
            }
            Err(replace_error) => {
                if let Err(restore_error) = fs::rename(&previous, destination) {
                    log::error!(
                        "[Vault Storage] Falha ao restaurar o banco anterior após substituição malsucedida: {}",
                        restore_error
                    );
                }
                Err(StorageError::Io(replace_error))
            }
        }
    }

    // ------------------------------------------------------------------
    // Validação de integridade do backup
    // ------------------------------------------------------------------

    /// Valida o arquivo SQLite antes de permitir uma restauração.
    fn validate_backup_file(path: &Path) -> Result<(), StorageError> {
        if !path.is_file() {
            return Err(StorageError::InvalidData(
                "O arquivo de backup não é um arquivo regular.".to_string(),
            ));
        }

        if fs::metadata(path)?.len() == 0 {
            return Err(StorageError::InvalidData(
                "O arquivo de backup está vazio.".to_string(),
            ));
        }

        let conn = Connection::open_with_flags(path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)?;

        let integrity: String = conn.query_row("PRAGMA integrity_check", [], |row| row.get(0))?;

        if !integrity.eq_ignore_ascii_case("ok") {
            log::error!(
                "[Vault Storage] O backup falhou na verificação de integridade SQLite: {}",
                integrity
            );
            return Err(StorageError::InvalidData(
                "O backup não passou na verificação de integridade.".to_string(),
            ));
        }

        let header_table_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'vault_header'",
            [],
            |row| row.get(0),
        )?;

        if header_table_count == 0 {
            return Err(StorageError::InvalidData(
                "O arquivo de backup não contém a tabela vault_header.".to_string(),
            ));
        }

        // Confirma que a tabela possui as colunas esperadas
        let _statement = conn.prepare(
            "SELECT id, version, canary_envelope, created_at FROM vault_header LIMIT 0",
        )?;

        // Quando existe um cabeçalho, confirma que o envelope pode ser desserializado
        let envelope_json: Option<String> = conn
            .query_row(
                "SELECT canary_envelope FROM vault_header WHERE id = 1",
                [],
                |row| row.get(0),
            )
            .optional()?;

        if let Some(json) = envelope_json {
            let _: EncryptedEnvelope = serde_json::from_str(&json)?;
        }

        Ok(())
    }

    // ------------------------------------------------------------------
    // Conexão SQLite
    // ------------------------------------------------------------------

    /// Abre ou cria a conexão com o banco de dados SQLite local seguro
    pub fn get_connection(&self) -> Result<Connection, StorageError> {
        let parent = Self::parent_directory(&self.db_path);
        fs::create_dir_all(parent)?;

        let conn = Connection::open(&self.db_path)?;

        // Configura busy_timeout para 5s evitando bloqueios abruptos sob concorrência
        conn.busy_timeout(Duration::from_secs(5))?;
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;

        let current_journal_mode: String =
            conn.query_row("PRAGMA journal_mode", [], |row| row.get(0))?;

        if !current_journal_mode.eq_ignore_ascii_case("wal") {
            let journal_mode: String =
                conn.query_row("PRAGMA journal_mode = WAL", [], |row| row.get(0))?;

            if !journal_mode.eq_ignore_ascii_case("wal") {
                return Err(StorageError::InvalidData(
                    "Não foi possível habilitar o modo WAL do SQLite.".to_string(),
                ));
            }
        }

        Self::set_private_file_permissions(&self.db_path)?;
        for sidecar in self.sidecar_paths() {
            if sidecar.exists() {
                let _ = Self::set_private_file_permissions(&sidecar);
            }
        }

        Ok(conn)
    }

    // ------------------------------------------------------------------
    // Cabeçalho do cofre
    // ------------------------------------------------------------------

    /// Retorna o cabeçalho persistido do cofre (se existir)
    pub fn get_header(&self) -> Result<Option<VaultHeader>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT version, canary_envelope, created_at FROM vault_header WHERE id = 1",
        )?;

        let header = stmt
            .query_row([], |row| {
                let version: u32 = row.get(0)?;
                let canary_json: String = row.get(1)?;
                let created_at: String = row.get(2)?;
                let canary_envelope: EncryptedEnvelope = serde_json::from_str(&canary_json)
                    .map_err(|e| {
                        rusqlite::Error::FromSqlConversionFailure(
                            1,
                            rusqlite::types::Type::Text,
                            Box::new(e),
                        )
                    })?;

                Ok(VaultHeader {
                    version,
                    canary_envelope,
                    created_at,
                })
            })
            .optional()?;

        Ok(header)
    }

    /// Salva o cabeçalho do cofre de forma segura (delega obrigatoriamente para initialize_vault_if_absent)
    pub fn save_header(&self, header: &VaultHeader) -> Result<(), StorageError> {
        self.initialize_vault_if_absent(header)
    }

    /// Inicializa o cabeçalho do cofre com atomicidade comprovada (TransactionBehavior::Immediate).
    /// Rejeita concorrentemente qualquer tentativa duplicada e impede sobrescrita do cabeçalho existente.
    pub fn initialize_vault_if_absent(&self, header: &VaultHeader) -> Result<(), StorageError> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;

        let existing: Option<u32> = tx
            .query_row("SELECT id FROM vault_header WHERE id = 1", [], |row| {
                row.get(0)
            })
            .optional()?;

        if existing.is_some() {
            return Err(StorageError::AlreadyInitialized);
        }

        let canary_json = serde_json::to_string(&header.canary_envelope)?;
        tx.execute(
            "INSERT INTO vault_header (id, version, canary_envelope, created_at) VALUES (1, ?1, ?2, ?3)",
            params![header.version, canary_json, header.created_at],
        )?;

        tx.commit()?;
        Ok(())
    }

    // ------------------------------------------------------------------
    // Carteiras
    // ------------------------------------------------------------------

    /// Lista todas as carteiras armazenadas na base SQLite
    pub fn list_wallets(&self) -> Result<Vec<StoredWallet>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id, client_doc FROM wallets ORDER BY id ASC"
        )?;

        let wallet_iter = stmt.query_map([], |row| {
            Ok(StoredWallet {
                id: row.get(0)?,
                target: row.get(1)?,
                custody_type: row.get(2)?,
                user: row.get(3)?,
                label: row.get(4)?,
                derivation_path: row.get(5)?,
                network: row.get(6)?,
                address: row.get(7)?,
                status: row.get(8)?,
                kyc_status: row.get(9)?,
                seed_words_count: row.get(10)?,
                created_at: row.get(11)?,
                vault_id: row.get(12)?,
                client_doc: row.get(13)?,
            })
        })?;

        let mut wallets = Vec::new();
        for w in wallet_iter {
            wallets.push(w?);
        }
        Ok(wallets)
    }

    /// Insere uma lista de carteiras dentro de uma transação atômica
    pub fn append_wallets(
        &self,
        new_wallets: &[StoredWallet],
    ) -> Result<Vec<StoredWallet>, StorageError> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction()?;

        {
            let mut stmt = tx.prepare(
                "INSERT INTO wallets (id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id, client_doc)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)"
            )?;

            for w in new_wallets {
                let id = i64::try_from(w.id).map_err(|_| {
                    StorageError::InvalidData(
                        "O ID da carteira excede o intervalo suportado pelo SQLite.".to_string(),
                    )
                })?;

                let seed_words_count = i64::try_from(w.seed_words_count).map_err(|_| {
                    StorageError::InvalidData(
                        "A quantidade de palavras excede o intervalo suportado pelo SQLite."
                            .to_string(),
                    )
                })?;

                stmt.execute(params![
                    id,
                    w.target,
                    w.custody_type,
                    w.user,
                    w.label,
                    w.derivation_path,
                    w.network,
                    w.address,
                    w.status,
                    w.kyc_status,
                    seed_words_count,
                    w.created_at,
                    w.vault_id,
                    w.client_doc
                ])?;
            }
        }

        tx.commit()?;
        self.list_wallets()
    }

    // ------------------------------------------------------------------
    // Segredos criptografados
    // ------------------------------------------------------------------

    /// Salva o envelope secreto cifrado dentro da tabela vault_secrets via UPSERT explícito
    pub fn save_secret(&self, secret: StoredSecret) -> Result<(), StorageError> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction()?;
        let envelope_json = serde_json::to_string(&secret.envelope)?;

        tx.execute(
            "INSERT INTO vault_secrets (vault_id, target, envelope, created_at)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(vault_id) DO UPDATE SET
                target = excluded.target,
                envelope = excluded.envelope,
                created_at = excluded.created_at",
            params![secret.vault_id, secret.target, envelope_json, secret.created_at],
        )?;

        tx.commit()?;
        Ok(())
    }

    /// Busca o envelope secreto correspondente a um vault_id
    pub fn get_secret_by_vault_id(
        &self,
        vault_id: &str,
    ) -> Result<Option<StoredSecret>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT vault_id, target, envelope, created_at FROM vault_secrets WHERE vault_id = ?1",
        )?;

        let secret = stmt
            .query_row(params![vault_id], |row| {
                let v_id: String = row.get(0)?;
                let target: String = row.get(1)?;
                let env_json: String = row.get(2)?;
                let created_at: String = row.get(3)?;
                let envelope: EncryptedEnvelope = serde_json::from_str(&env_json).map_err(|e| {
                    rusqlite::Error::FromSqlConversionFailure(
                        2,
                        rusqlite::types::Type::Text,
                        Box::new(e),
                    )
                })?;

                Ok(StoredSecret {
                    vault_id: v_id,
                    target,
                    envelope,
                    created_at,
                })
            })
            .optional()?;

        Ok(secret)
    }

    // ------------------------------------------------------------------
    // Status operacional
    // ------------------------------------------------------------------

    /// Retorna o status operacional do cofre SQLite utilizando conexão única e agregação direta
    pub fn get_status(&self, is_unlocked: bool) -> Result<VaultStatus, StorageError> {
        let conn = self.get_connection()?;

        let is_initialized: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM vault_header WHERE id = 1)",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        let (dao_count, client_count): (i64, i64) = conn
            .query_row(
                "SELECT \
                    COALESCE(SUM(CASE WHEN target = 'DAO' THEN 1 ELSE 0 END), 0), \
                    COALESCE(SUM(CASE WHEN target = 'CLIENT' THEN 1 ELSE 0 END), 0) \
                 FROM wallets",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap_or((0, 0));

        let dao_wallets_count = usize::try_from(dao_count).map_err(|_| {
            StorageError::InvalidData("Quantidade de carteiras DAO inválida.".to_string())
        })?;

        let client_wallets_count = usize::try_from(client_count).map_err(|_| {
            StorageError::InvalidData("Quantidade de carteiras de clientes inválida.".to_string())
        })?;

        Ok(VaultStatus {
            is_initialized,
            is_unlocked,
            dao_wallets_count,
            client_wallets_count,
        })
    }

    // ------------------------------------------------------------------
    // Checkpoint WAL
    // ------------------------------------------------------------------

    /// Executa checkpoint explícito e valida a conclusão do SQLite
    fn checkpoint_wal(&self) -> Result<(), StorageError> {
        if !self.db_path.exists() {
            return Ok(());
        }

        let conn = self.get_connection()?;
        let (busy, _log_frames, _checkpointed_frames): (i64, i64, i64) = conn.query_row(
            "PRAGMA wal_checkpoint(TRUNCATE)",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )?;

        if busy != 0 {
            return Err(StorageError::InvalidData(
                "Não foi possível concluir o checkpoint WAL devido a conexões ocupadas."
                    .to_string(),
            ));
        }

        drop(conn);
        Ok(())
    }

    // ------------------------------------------------------------------
    // Exportação de backup
    // ------------------------------------------------------------------

    /// Executa backup atômico e transacional do banco de dados SQLite via VACUUM INTO
    pub fn export_backup(&self, destination_path: &Path) -> Result<u64, StorageError> {
        self.ensure_not_active_database_path(destination_path, "destino do backup")?;

        let parent = Self::parent_directory(destination_path);
        fs::create_dir_all(parent)?;

        let staged = Self::create_temporary_sibling(destination_path, "backup")?;
        // Remove o placeholder vazio para o VACUUM INTO criar um banco novo de forma limpa
        let _ = fs::remove_file(&staged);

        let result = (|| {
            let conn = self.get_connection()?;
            let staged_name = staged.to_string_lossy().into_owned();

            conn.execute("VACUUM INTO ?1", params![staged_name])?;
            drop(conn);

            Self::set_private_file_permissions(&staged)?;

            if fs::metadata(&staged)?.len() == 0 {
                return Err(StorageError::InvalidData(
                    "O backup gerado está vazio.".to_string(),
                ));
            }

            Self::install_staged_file(&staged, destination_path)?;
            let metadata = fs::metadata(destination_path)?;
            Ok(metadata.len())
        })();

        if result.is_err() {
            let _ = fs::remove_file(&staged);
        }

        result
    }

    // ------------------------------------------------------------------
    // Restauração de backup
    // ------------------------------------------------------------------

    /// Restaura o banco de dados a partir de um arquivo de backup verificado
    pub fn restore_backup(&self, source_path: &Path) -> Result<(), StorageError> {
        if !source_path.is_file() {
            return Err(StorageError::InvalidData(
                "O arquivo de backup informado não existe ou não é um arquivo regular.".to_string(),
            ));
        }

        self.ensure_not_active_database_path(source_path, "origem do backup")?;

        let staged = Self::create_temporary_sibling(&self.db_path, "restore")?;

        let result = (|| {
            // Prepara a restauração sem destruir o banco ativo
            fs::copy(source_path, &staged)?;
            Self::set_private_file_permissions(&staged)?;

            // Valida a integridade do snapshot antes de alterar o banco atual
            Self::validate_backup_file(&staged)?;

            // Executa checkpoint WAL do banco atual
            self.checkpoint_wal()?;

            // Remove sidecars WAL/SHM associados antes da substituição atômica
            for sidecar in self.sidecar_paths() {
                Self::remove_file_if_exists(&sidecar)?;
            }

            // Substitui o banco ativo preservando versão anterior caso ocorra falha de rename
            Self::install_staged_file(&staged, &self.db_path)?;
            Self::set_private_file_permissions(&self.db_path)?;

            Ok(())
        })();

        if result.is_err() {
            let _ = fs::remove_file(&staged);
        }

        result
    }
}

// ----------------------------------------------------------------------
// Testes unitários
// ----------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sqlite_persistence_across_reconnect() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_test_db_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);
             CREATE TABLE IF NOT EXISTS wallets (id INTEGER PRIMARY KEY, target TEXT NOT NULL, custody_type TEXT NOT NULL, user_name TEXT NOT NULL, label TEXT NOT NULL, derivation_path TEXT NOT NULL, network TEXT NOT NULL, address TEXT NOT NULL, status TEXT NOT NULL, kyc_status TEXT NOT NULL, seed_words_count INTEGER NOT NULL, created_at TEXT NOT NULL, vault_id TEXT, client_doc TEXT);
             CREATE TABLE IF NOT EXISTS vault_secrets (vault_id TEXT PRIMARY KEY, target TEXT NOT NULL, envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        let w = StoredWallet {
            id: 1,
            target: "DAO".to_string(),
            custody_type: "CUSTODIAL_LOCAL".to_string(),
            user: "ASPPIBRA DAO".to_string(),
            label: "Caixa Operacional".to_string(),
            derivation_path: "m/44'/60'/0'/0/0".to_string(),
            network: "Arbitrum One".to_string(),
            address: "0x9858EfFD232B4033E47d90003D41EC34EcaEda94".to_string(),
            status: "ACTIVE".to_string(),
            kyc_status: "UNVERIFIED".to_string(),
            seed_words_count: 24,
            created_at: "2026-10-12 00:00".to_string(),
            vault_id: Some("dao_vault_1".to_string()),
            client_doc: None,
        };

        db.append_wallets(std::slice::from_ref(&w)).unwrap();

        let reloaded_db = LocalDatabase::new(test_dir.clone());
        let loaded = reloaded_db.list_wallets().unwrap();

        assert_eq!(loaded.len(), 1);
        assert_eq!(
            loaded[0].address,
            "0x9858EfFD232B4033E47d90003D41EC34EcaEda94"
        );
        assert_eq!(loaded[0].custody_type, "CUSTODIAL_LOCAL");

        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_wallet_isolation_and_custody_segregation() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_test_isolation_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);
             CREATE TABLE IF NOT EXISTS wallets (id INTEGER PRIMARY KEY, target TEXT NOT NULL, custody_type TEXT NOT NULL, user_name TEXT NOT NULL, label TEXT NOT NULL, derivation_path TEXT NOT NULL, network TEXT NOT NULL, address TEXT NOT NULL, status TEXT NOT NULL, kyc_status TEXT NOT NULL, seed_words_count INTEGER NOT NULL, created_at TEXT NOT NULL, vault_id TEXT, client_doc TEXT);
             CREATE TABLE IF NOT EXISTS vault_secrets (vault_id TEXT PRIMARY KEY, target TEXT NOT NULL, envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        let dao_custodial = StoredWallet {
            id: 1,
            target: "DAO".to_string(),
            custody_type: "CUSTODIAL_LOCAL".to_string(),
            user: "ASPPIBRA DAO".to_string(),
            label: "Caixa Cripto".to_string(),
            derivation_path: "m/44'/60'/0'/0/0".to_string(),
            network: "Arbitrum One".to_string(),
            address: "0x9858EfFD232B4033E47d90003D41EC34EcaEda94".to_string(),
            status: "ACTIVE".to_string(),
            kyc_status: "UNVERIFIED".to_string(),
            seed_words_count: 24,
            created_at: "2026-10-12 00:00".to_string(),
            vault_id: Some("dao_vault_1".to_string()),
            client_doc: None,
        };

        let client_watch_only = StoredWallet {
            id: 2,
            target: "CLIENT".to_string(),
            custody_type: "WATCH_ONLY".to_string(),
            user: "Associado 01".to_string(),
            label: "Monitoramento".to_string(),
            derivation_path: "N/A".to_string(),
            network: "Arbitrum One".to_string(),
            address: "0x1111111111111111111111111111111111111111".to_string(),
            status: "ACTIVE".to_string(),
            kyc_status: "UNVERIFIED".to_string(),
            seed_words_count: 0,
            created_at: "2026-10-12 00:00".to_string(),
            vault_id: None,
            client_doc: Some("123.456.789-00".to_string()),
        };

        db.append_wallets(&[dao_custodial, client_watch_only])
            .unwrap();

        let all = db.list_wallets().unwrap();
        assert_eq!(all.len(), 2);

        let secret_none = db.get_secret_by_vault_id("non_existent").unwrap();
        assert!(secret_none.is_none());

        let fake_envelope =
            crate::vault::encryption::VaultCrypto::encrypt("master_123", b"secret_words").unwrap();
        let stored_secret = StoredSecret {
            vault_id: "dao_vault_1".to_string(),
            target: "DAO".to_string(),
            envelope: fake_envelope.clone(),
            created_at: "2026-10-12 00:00".to_string(),
        };
        db.save_secret(stored_secret).unwrap();

        let retrieved = db
            .get_secret_by_vault_id("dao_vault_1")
            .unwrap()
            .expect("Segredo deve existir");
        assert_eq!(retrieved.vault_id, "dao_vault_1");
        assert_eq!(
            retrieved.envelope.ciphertext_hex,
            fake_envelope.ciphertext_hex
        );

        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_vault_header_persistence_and_recovery() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_test_header_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        let canary =
            crate::vault::encryption::VaultCrypto::encrypt("master_123", b"canary_canary").unwrap();
        let header = VaultHeader {
            version: 1,
            canary_envelope: canary.clone(),
            created_at: "2026-10-12 00:00".to_string(),
        };

        db.save_header(&header).unwrap();

        let reloaded_db = LocalDatabase::new(test_dir.clone());
        let loaded_header = reloaded_db
            .get_header()
            .unwrap()
            .expect("Header deve existir");
        assert_eq!(
            loaded_header.canary_envelope.ciphertext_hex,
            canary.ciphertext_hex
        );

        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_complete_vault_lifecycle_and_backup() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_full_lifecycle_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());
        let master_password = "SuperMasterPassword2026!Secure";

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);
             CREATE TABLE IF NOT EXISTS wallets (id INTEGER PRIMARY KEY, target TEXT NOT NULL, custody_type TEXT NOT NULL, user_name TEXT NOT NULL, label TEXT NOT NULL, derivation_path TEXT NOT NULL, network TEXT NOT NULL, address TEXT NOT NULL, status TEXT NOT NULL, kyc_status TEXT NOT NULL, seed_words_count INTEGER NOT NULL, created_at TEXT NOT NULL, vault_id TEXT, client_doc TEXT);
             CREATE TABLE IF NOT EXISTS vault_secrets (vault_id TEXT PRIMARY KEY, target TEXT NOT NULL, envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        let header = VaultHeader::new(master_password).expect("Header deve ser gerado com sucesso");
        db.save_header(&header).expect("Header deve ser persistido");

        let mnemonic = crate::wallets::mnemonic::MnemonicService::generate(24)
            .expect("Mnemônica de 24 palavras");
        let seed = crate::wallets::mnemonic::MnemonicService::to_seed(&mnemonic, "")
            .expect("Seed derivada");
        let previews = crate::wallets::derivation::DerivationService::derive_batch(
            &seed,
            0,
            1,
            "Caixa Primário",
            "Arbitrum One",
        )
        .expect("Derivação");
        let derived_address = previews[0].address.clone();
        let derivation_path = previews[0].derivation_path.clone();

        let envelope =
            crate::vault::encryption::VaultCrypto::encrypt(master_password, mnemonic.as_bytes())
                .expect("Cifragem AEAD");
        let vault_id = "dao_vault_lifecycle_test".to_string();
        let secret_record = StoredSecret {
            vault_id: vault_id.clone(),
            target: "DAO".to_string(),
            envelope,
            created_at: "2026-10-12 00:00".to_string(),
        };
        db.save_secret(secret_record).expect("Segredo persistido");

        let stored_wallet = StoredWallet {
            id: 1,
            target: "DAO".to_string(),
            custody_type: "CUSTODIAL_LOCAL".to_string(),
            user: "ASPPIBRA DAO".to_string(),
            label: "Caixa Primário".to_string(),
            derivation_path: derivation_path.clone(),
            network: "Arbitrum One".to_string(),
            address: derived_address.clone(),
            status: "ACTIVE".to_string(),
            kyc_status: "UNVERIFIED".to_string(),
            seed_words_count: 24,
            created_at: "2026-10-12 00:00".to_string(),
            vault_id: Some(vault_id.clone()),
            client_doc: None,
        };
        db.append_wallets(&[stored_wallet]).expect("Carteira salva");

        let reloaded_db = LocalDatabase::new(test_dir.clone());

        let reloaded_header = reloaded_db
            .get_header()
            .unwrap()
            .expect("Header recarregado deve existir");
        assert!(
            reloaded_header.verify_password(master_password),
            "Senha mestre válida deve desbloquear"
        );
        assert!(
            !reloaded_header.verify_password("SenhaErrada!"),
            "Senha errada deve ser rejeitada"
        );

        let wallets = reloaded_db.list_wallets().expect("Listagem pós-reboot");
        assert_eq!(wallets.len(), 1);
        assert_eq!(wallets[0].address, derived_address);
        assert_eq!(wallets[0].custody_type, "CUSTODIAL_LOCAL");

        let retrieved_secret = reloaded_db
            .get_secret_by_vault_id(&vault_id)
            .unwrap()
            .expect("Segredo deve existir");
        let decrypted_bytes = crate::vault::encryption::VaultCrypto::decrypt(
            master_password,
            &retrieved_secret.envelope,
        )
        .expect("Decifragem autorizada");
        let recovered_mnemonic = String::from_utf8(decrypted_bytes).expect("UTF-8 válido");
        assert_eq!(recovered_mnemonic, mnemonic);

        let recovered_seed =
            crate::wallets::mnemonic::MnemonicService::to_seed(&recovered_mnemonic, "")
                .expect("Seed recuperada");
        let recovered_previews = crate::wallets::derivation::DerivationService::derive_batch(
            &recovered_seed,
            0,
            1,
            "Teste",
            "Arbitrum One",
        )
        .expect("Derivação conferida");
        assert_eq!(
            recovered_previews[0].address, wallets[0].address,
            "Endereço decifrado deve coincidir com o salvo"
        );

        assert!(!retrieved_secret.envelope.ciphertext_hex.is_empty());
        assert!(!retrieved_secret.envelope.ciphertext_hex.contains(&mnemonic));

        let fail_result = crate::vault::encryption::VaultCrypto::decrypt(
            "SenhaIncorreta999!",
            &retrieved_secret.envelope,
        );
        assert!(
            fail_result.is_err(),
            "Decifragem com senha incorreta deve retornar erro AEAD"
        );

        // Validação de Backup e Restauração via VACUUM INTO
        let backup_path = test_dir.join("backups").join("vault_backup.bak");
        let copied = reloaded_db
            .export_backup(&backup_path)
            .expect("Backup deve ser exportado");
        assert!(copied > 0);
        assert!(backup_path.exists());

        let restore_dir =
            std::env::temp_dir().join(format!("devos_restored_{}", rand::random::<u32>()));
        let restored_db = LocalDatabase::new(restore_dir.clone());
        restored_db
            .restore_backup(&backup_path)
            .expect("Restauração de backup deve ser concluída");

        let restored_wallets = restored_db
            .list_wallets()
            .expect("Carteiras no banco restaurado");
        assert_eq!(restored_wallets.len(), 1);
        assert_eq!(restored_wallets[0].address, derived_address);

        let _ = fs::remove_dir_all(test_dir);
        let _ = fs::remove_dir_all(restore_dir);
    }

    #[test]
    fn test_atomic_initialize_vault_if_absent_prevents_overwrite() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_atomic_vault_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());
        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        let header1 = VaultHeader::new("InitialMasterPassword123!").expect("Header 1 válido");
        let header2 = VaultHeader::new("AttackerOrOverwritePassword456!").expect("Header 2 válido");

        let first_res = db.initialize_vault_if_absent(&header1);
        assert!(first_res.is_ok(), "Primeira inicialização deve ter sucesso");

        let second_res = db.initialize_vault_if_absent(&header2);
        assert!(
            second_res.is_err(),
            "Segunda inicialização deve ser rejeitada"
        );
        match second_res {
            Err(StorageError::AlreadyInitialized) => {}
            _ => panic!("Esperado StorageError::AlreadyInitialized"),
        }

        let loaded = db.get_header().unwrap().expect("Header deve existir");
        assert!(loaded.verify_password("InitialMasterPassword123!"));
        assert!(!loaded.verify_password("AttackerOrOverwritePassword456!"));

        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_concurrent_multithread_initialization_race() {
        use std::sync::{Arc, Barrier};
        use std::thread;

        let test_dir =
            std::env::temp_dir().join(format!("devos_concurrency_race_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());
        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        const THREAD_COUNT: usize = 10;
        let barrier = Arc::new(Barrier::new(THREAD_COUNT));
        let mut handles = Vec::new();

        for i in 0..THREAD_COUNT {
            let b = Arc::clone(&barrier);
            let dir = test_dir.clone();
            let thread_password = format!("PasswordForThread{}!Secure123", i);

            let handle = thread::spawn(move || {
                let thread_db = LocalDatabase::new(dir);
                let header = VaultHeader::new(&thread_password).expect("Header gerado");
                b.wait();
                let res = thread_db.initialize_vault_if_absent(&header);
                (i, thread_password, res.is_ok())
            });

            handles.push(handle);
        }

        let mut success_count = 0;
        let mut winning_password = String::new();

        for h in handles {
            let (_i, pwd, is_ok) = h.join().unwrap();
            if is_ok {
                success_count += 1;
                winning_password = pwd;
            }
        }

        assert_eq!(
            success_count, 1,
            "Exatamente UMA thread concorrente deve ter sucesso na inicialização atômica"
        );

        let final_header = db.get_header().unwrap().expect("Header persistido");
        assert!(
            final_header.verify_password(&winning_password),
            "Header deve ser da thread vencedora"
        );

        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_restore_rejects_invalid_sqlite_without_replacing_active_db() {
        let test_dir = std::env::temp_dir()
            .join(format!("devos_restore_invalid_{}", rand::random::<u64>()));
        let db = LocalDatabase::new(test_dir.clone());

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (
                id INTEGER PRIMARY KEY,
                version INTEGER NOT NULL,
                canary_envelope TEXT NOT NULL,
                created_at TEXT NOT NULL
            );"
        )
        .unwrap();

        let header = VaultHeader::new("RestoreTestPassword123!").expect("Header válido");
        db.save_header(&header).unwrap();
        drop(conn);

        let original_header = db.get_header().unwrap().unwrap();

        let invalid_backup = test_dir.join("invalid_backup.bak");
        std::fs::write(&invalid_backup, b"not a sqlite database").unwrap();

        assert!(db.restore_backup(&invalid_backup).is_err());

        let persisted_header = db.get_header().unwrap().unwrap();
        assert_eq!(
            persisted_header.canary_envelope,
            original_header.canary_envelope
        );

        let _ = std::fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_export_rejects_database_as_backup_destination() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_export_self_{}", rand::random::<u64>()));
        let db = LocalDatabase::new(test_dir.clone());

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (
                id INTEGER PRIMARY KEY,
                version INTEGER NOT NULL,
                canary_envelope TEXT NOT NULL,
                created_at TEXT NOT NULL
            );"
        )
        .unwrap();
        drop(conn);

        let result = db.export_backup(db.db_path());
        assert!(
            result.is_err(),
            "O banco ativo não pode ser o destino do próprio backup."
        );

        let _ = std::fs::remove_dir_all(test_dir);
    }
}
