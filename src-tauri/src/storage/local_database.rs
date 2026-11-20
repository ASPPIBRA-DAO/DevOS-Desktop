use rusqlite::{Connection, OptionalExtension, params};
use serde::{Deserialize, Serialize};

use std::fs::{self, OpenOptions};
use std::path::{Path, PathBuf};
use std::time::Duration;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

use crate::modules::vault::access_control::{
    AccessControlError, VaultHeader, VaultHeaderV2, VaultStatus,
};
use crate::modules::vault::encryption::{
    AadDomain, AeadEnvelope, EncryptedEnvelope, Subkeys, VaultCrypto, VaultCryptoError,
    WalletTargetTag, WrappedDekEnvelope,
};

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

    #[error("Access control error: {0}")]
    AccessControl(#[from] AccessControlError),

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

/// Registro criptografado do cofre V2 (envelope AEAD com AAD canônico e subchaves HKDF)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredSecretV2 {
    pub vault_id: String,
    pub target: String,
    pub envelope: AeadEnvelope,
    pub created_at: String,
}

/// Registro da operação de criação de carteiras para idempotência e rastreabilidade em lote.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletCreationOp {
    pub creation_id: String,
    pub target: String,
    pub account_branch: u32,
    pub wallet_count: usize,
    pub network_id: String,
    pub intent_hash: String,
    pub created_at: String,
}

/// Calcula o hash SHA-256 canônico de intenção da operação de carteira (ADR-001 §7.3).
/// Utiliza serialização binária canônica com comprimentos explícitos para prevenir ataques de colisão.
/// Dados civis sensíveis (CPF/CNPJ/Nome) são excluídos expressamente do hash para impedir ataques de dicionário,
/// mantendo a segregação estrita entre custódia de carteiras e o domínio Identity.
pub fn compute_wallet_creation_intent_hash(
    target: &str,
    account_branch: u32,
    wallet_count: usize,
    network_id: &str,
    label: &str,
    client_reference: Option<&str>,
) -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();

    let domain = b"DEVOS/INTENT/V2";
    hasher.update((domain.len() as u32).to_be_bytes());
    hasher.update(domain);

    hasher.update((target.len() as u32).to_be_bytes());
    hasher.update(target.as_bytes());

    hasher.update(account_branch.to_be_bytes());

    hasher.update((wallet_count as u64).to_be_bytes());

    hasher.update((network_id.len() as u32).to_be_bytes());
    hasher.update(network_id.as_bytes());

    hasher.update((label.len() as u32).to_be_bytes());
    hasher.update(label.as_bytes());

    if let Some(reference) = client_reference {
        hasher.update(1u8.to_be_bytes());
        hasher.update((reference.len() as u32).to_be_bytes());
        hasher.update(reference.as_bytes());
    } else {
        hasher.update(0u8.to_be_bytes());
    }

    hex::encode(hasher.finalize())
}

/// Dados da nova carteira a ser persistida em wallets_v2.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewWalletData {
    pub target: String,
    pub custody_type: String,
    pub user_name: String,
    pub label: String,
    pub derivation_path: String,
    pub network: String,
    pub address: String,
    pub status: String,
    pub kyc_status: String,
    pub seed_words_count: usize,
    pub vault_id: Option<String>,
    pub client_doc: Option<String>,
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
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN ('vault_header', 'vault_header_v2')",
            [],
            |row| row.get(0),
        )?;

        if header_table_count == 0 {
            return Err(StorageError::InvalidData(
                "O arquivo de backup não contém a tabela de cabeçalho do cofre (vault_header ou vault_header_v2).".to_string(),
            ));
        }

        let has_v2: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'vault_header_v2')",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if has_v2 {
            let _statement = conn.prepare(
                "SELECT id, version, wrapped_dek, created_at FROM vault_header_v2 LIMIT 0",
            )?;

            let row_v2: Option<String> = conn
                .query_row(
                    "SELECT wrapped_dek FROM vault_header_v2 WHERE id = 1",
                    [],
                    |r| r.get(0),
                )
                .optional()?;

            if let Some(wrapped_dek_json) = row_v2 {
                let _: WrappedDekEnvelope = serde_json::from_str(&wrapped_dek_json)?;
            }
        } else {
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
    // Cabeçalho do cofre V2 (KEK / DEK)
    // ------------------------------------------------------------------

    /// Retorna o cabeçalho V2 persistido do cofre (se existir)
    pub fn get_header_v2(&self) -> Result<Option<VaultHeaderV2>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn
            .prepare("SELECT version, wrapped_dek, created_at FROM vault_header_v2 WHERE id = 1")?;

        let header = stmt
            .query_row([], |row| {
                let version: u32 = row.get(0)?;
                let wrapped_dek_json: String = row.get(1)?;
                let created_at: String = row.get(2)?;

                let wrapped_dek: WrappedDekEnvelope = serde_json::from_str(&wrapped_dek_json)
                    .map_err(|e| {
                        rusqlite::Error::FromSqlConversionFailure(
                            1,
                            rusqlite::types::Type::Text,
                            Box::new(e),
                        )
                    })?;

                Ok(VaultHeaderV2 {
                    version,
                    wrapped_dek,
                    created_at,
                })
            })
            .optional()?;

        Ok(header)
    }

    /// Inicializa o cabeçalho V2 do cofre com atomicidade comprovada (TransactionBehavior::Immediate).
    /// Rejeita concorrentemente qualquer tentativa duplicada e impede sobrescrita do cabeçalho existente.
    pub fn initialize_vault_v2_if_absent(
        &self,
        header: &VaultHeaderV2,
    ) -> Result<(), StorageError> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;

        let existing: Option<u32> = tx
            .query_row("SELECT id FROM vault_header_v2 WHERE id = 1", [], |row| {
                row.get(0)
            })
            .optional()?;

        if existing.is_some() {
            return Err(StorageError::AlreadyInitialized);
        }

        let wrapped_dek_json = serde_json::to_string(&header.wrapped_dek)?;

        tx.execute(
            "INSERT INTO vault_header_v2 (id, version, wrapped_dek, created_at)
             VALUES (1, ?1, ?2, ?3)",
            params![header.version, wrapped_dek_json, header.created_at],
        )?;

        tx.commit()?;
        Ok(())
    }

    /// Salva o cabeçalho V2 do cofre
    pub fn save_header_v2(&self, header: &VaultHeaderV2) -> Result<(), StorageError> {
        self.initialize_vault_v2_if_absent(header)
    }

    /// Atualiza atomicamente a chave embrulhada (wrapped DEK) na rotação de senha V2
    pub fn rotate_vault_password_v2(&self, new_header: &VaultHeaderV2) -> Result<(), StorageError> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;

        let wrapped_dek_json = serde_json::to_string(&new_header.wrapped_dek)?;

        let rows_affected = tx.execute(
            "UPDATE vault_header_v2 SET wrapped_dek = ?1, created_at = ?2 WHERE id = 1",
            params![wrapped_dek_json, new_header.created_at],
        )?;

        if rows_affected == 0 {
            return Err(StorageError::NotFound(
                "Cabeçalho V2 não encontrado para rotação de senha.".to_string(),
            ));
        }

        tx.commit()?;
        Ok(())
    }

    // ------------------------------------------------------------------
    // Carteiras
    // ------------------------------------------------------------------

    /// Lista todas as carteiras armazenadas na base SQLite (prioriza wallets_v2)
    pub fn list_wallets(&self) -> Result<Vec<StoredWallet>, StorageError> {
        let conn = self.get_connection()?;

        let v2_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'wallets_v2'",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let use_v2 = if v2_count > 0 {
            let count: i64 = conn
                .query_row("SELECT COUNT(*) FROM wallets_v2", [], |row| row.get(0))
                .unwrap_or(0);
            count > 0
        } else {
            false
        };

        let sql = if use_v2 {
            "SELECT id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id, client_doc FROM wallets_v2 ORDER BY id ASC"
        } else {
            "SELECT id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id, client_doc FROM wallets ORDER BY id ASC"
        };

        let mut stmt = conn.prepare(sql)?;
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

    /// Salva atomicamente o segredo cifrado (envelope V2), a operação de lote e as carteiras em wallets_v2.
    pub fn save_wallets_and_secret_atomic(
        &self,
        secret: StoredSecretV2,
        op: WalletCreationOp,
        wallets: &[NewWalletData],
    ) -> Result<Vec<StoredWallet>, StorageError> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;

        // 1. Verificação antecipada de idempotência estrita (Fail-Fast)
        let existing_op: Option<(String, u32, i64, String, String)> = tx
            .query_row(
                "SELECT target, account_branch, wallet_count, network_id, intent_hash FROM wallet_creation_operations WHERE creation_id = ?1",
                params![op.creation_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
            )
            .optional()?;

        if let Some((
            stored_target,
            stored_branch,
            stored_count,
            stored_network,
            stored_intent_hash,
        )) = existing_op
        {
            let wallet_count_i64 = i64::try_from(op.wallet_count).map_err(|_| {
                StorageError::InvalidData(
                    "Quantidade de carteiras inválida para o SQLite.".to_string(),
                )
            })?;

            if stored_target == op.target
                && stored_branch == op.account_branch
                && stored_count == wallet_count_i64
                && stored_network == op.network_id
                && stored_intent_hash == op.intent_hash
            {
                // Idempotência comprovada: a operação idêntica já foi processada.
                // Não reinsere o segredo nem duplica carteiras.
                drop(tx);
                return self.list_wallets();
            } else {
                return Err(StorageError::InvalidData(format!(
                    "Violação de idempotência: A operação creation_id '{}' já foi registrada com intenção ou parâmetros distintos.",
                    op.creation_id
                )));
            }
        }

        let envelope_json = serde_json::to_string(&secret.envelope)?;

        // 2. Grava ou atualiza o envelope cifrado em vault_secrets
        tx.execute(
            "INSERT INTO vault_secrets (vault_id, target, envelope, created_at)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(vault_id) DO UPDATE SET
                target = excluded.target,
                envelope = excluded.envelope,
                created_at = excluded.created_at",
            params![
                secret.vault_id,
                secret.target,
                envelope_json,
                secret.created_at
            ],
        )?;

        // 3. Grava a operação de criação do lote (idempotência)
        let wallet_count_i64 = i64::try_from(op.wallet_count).map_err(|_| {
            StorageError::InvalidData("Quantidade de carteiras inválida para o SQLite.".to_string())
        })?;

        tx.execute(
            "INSERT INTO wallet_creation_operations (creation_id, target, account_branch, wallet_count, network_id, intent_hash, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                op.creation_id,
                op.target,
                op.account_branch,
                wallet_count_i64,
                op.network_id,
                op.intent_hash,
                op.created_at
            ],
        )?;

        // 4. Insere todas as carteiras em wallets_v2
        {
            let mut stmt = tx.prepare(
                "INSERT INTO wallets_v2 (creation_id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id, client_doc)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            )?;

            for w in wallets {
                let seed_words_count = i64::try_from(w.seed_words_count).map_err(|_| {
                    StorageError::InvalidData(
                        "A quantidade de palavras excede o intervalo suportado pelo SQLite."
                            .to_string(),
                    )
                })?;

                stmt.execute(params![
                    op.creation_id,
                    w.target,
                    w.custody_type,
                    w.user_name,
                    w.label,
                    w.derivation_path,
                    w.network,
                    w.address,
                    w.status,
                    w.kyc_status,
                    seed_words_count,
                    op.created_at,
                    w.vault_id,
                    w.client_doc
                ])?;
            }
        }

        tx.commit()?;
        self.list_wallets()
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
            params![
                secret.vault_id,
                secret.target,
                envelope_json,
                secret.created_at
            ],
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

    /// Busca o envelope secreto V2 (AeadEnvelope) correspondente a um vault_id
    pub fn get_secret_v2_by_vault_id(
        &self,
        vault_id: &str,
    ) -> Result<Option<StoredSecretV2>, StorageError> {
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
                let envelope: AeadEnvelope = serde_json::from_str(&env_json).map_err(|e| {
                    rusqlite::Error::FromSqlConversionFailure(
                        2,
                        rusqlite::types::Type::Text,
                        Box::new(e),
                    )
                })?;

                Ok(StoredSecretV2 {
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

        let is_initialized_v2: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'vault_header_v2') AND EXISTS(SELECT 1 FROM vault_header_v2 WHERE id = 1)",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        let is_initialized_v1: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'vault_header') AND EXISTS(SELECT 1 FROM vault_header WHERE id = 1)",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        let is_initialized = is_initialized_v2 || is_initialized_v1;

        let has_wallets_v2: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'wallets_v2')",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        let wallets_query = if has_wallets_v2 {
            "SELECT \
                COALESCE(SUM(CASE WHEN target = 'DAO' THEN 1 ELSE 0 END), 0), \
                COALESCE(SUM(CASE WHEN target = 'CLIENT' THEN 1 ELSE 0 END), 0) \
             FROM ( \
                 SELECT target FROM wallets_v2 \
                 UNION ALL \
                 SELECT target FROM wallets WHERE NOT EXISTS (SELECT 1 FROM wallets_v2) \
             )"
        } else {
            "SELECT \
                COALESCE(SUM(CASE WHEN target = 'DAO' THEN 1 ELSE 0 END), 0), \
                COALESCE(SUM(CASE WHEN target = 'CLIENT' THEN 1 ELSE 0 END), 0) \
             FROM wallets"
        };

        let (dao_count, client_count): (i64, i64) = conn
            .query_row(wallets_query, [], |row| Ok((row.get(0)?, row.get(1)?)))
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
    // Migração Criptográfica V1 -> V2 (KEK / DEK)
    // ------------------------------------------------------------------

    /// Executa a migração criptográfica atômica de V1 para V2:
    /// - Decifra envelopes V1 usando a senha mestre
    /// - Gera DEK de 256 bits e empacota em WrappedDekEnvelope via KEK derivada com Argon2id
    /// - Recifra os segredos com a subchave DEVOS/WALLETS/V2 e AAD canônico
    /// - Recifra o perfil de identidade civil (se presente) com DEVOS/IDENTITY/V2 e AAD canônico
    /// - Migra carteiras para wallets_v2 vinculadas a uma operação de migração sintética
    /// - Persiste vault_header_v2 com TransactionBehavior::Immediate
    pub fn migrate_v1_to_v2(&self, master_password: &str) -> Result<bool, StorageError> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;

        // Se já existe header V2, a migração criptográfica já foi efetuada
        let has_v2: bool = tx
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'vault_header_v2') AND EXISTS(SELECT 1 FROM vault_header_v2 WHERE id = 1)",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if has_v2 {
            return Ok(false);
        }

        // Se não existe header V1, não há base legada para migrar
        let v1_data: Option<(u32, String, String)> = tx
            .query_row(
                "SELECT version, canary_envelope, created_at FROM vault_header WHERE id = 1",
                [],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .optional()?;

        let (_v1_version, v1_canary_json, _v1_created_at) = match v1_data {
            Some(data) => data,
            None => return Ok(false),
        };

        let v1_canary: EncryptedEnvelope = serde_json::from_str(&v1_canary_json)?;
        let v1_header = VaultHeader {
            version: 1,
            canary_envelope: v1_canary,
            created_at: _v1_created_at,
        };

        if !v1_header.verify_password(master_password) {
            return Err(StorageError::AccessControl(
                AccessControlError::InvalidPassword,
            ));
        }

        // 1. Gera DEK de 256 bits, deriva subchaves e gera o novo cabeçalho V2
        let (header_v2, dek) = VaultHeaderV2::init(master_password, "devos-desktop")?;
        let wallets_key = Subkeys::derive_wallets_key(&dek);
        let identity_key = Subkeys::derive_identity_key(&dek);

        // 2. Decifra e recifra todos os registros em vault_secrets
        {
            let mut select_stmt =
                tx.prepare("SELECT vault_id, target, envelope FROM vault_secrets")?;
            let secrets_iter = select_stmt.query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                ))
            })?;

            let mut migrated_secrets = Vec::new();
            for s in secrets_iter {
                let (vault_id, target, env_json) = s?;
                if let Ok(v1_env) = serde_json::from_str::<EncryptedEnvelope>(&env_json) {
                    if v1_env.version == 1 {
                        let plaintext = VaultCrypto::decrypt(master_password, &v1_env)?;
                        let target_tag = if target.eq_ignore_ascii_case("DAO") {
                            WalletTargetTag::Dao
                        } else {
                            WalletTargetTag::Client
                        };
                        let aad = AadDomain::WalletMnemonic {
                            vault_id: &vault_id,
                            target: target_tag,
                        }
                        .to_canonical_bytes();
                        let new_aead =
                            VaultCrypto::encrypt_with_aead(&wallets_key, &plaintext, &aad)?;
                        migrated_secrets.push((vault_id, serde_json::to_string(&new_aead)?));
                    }
                }
            }
            drop(select_stmt);

            let mut update_stmt =
                tx.prepare("UPDATE vault_secrets SET envelope = ?1 WHERE vault_id = ?2")?;
            for (v_id, new_json) in migrated_secrets {
                update_stmt.execute(params![new_json, v_id])?;
            }
        }

        // 3. Decifra e recifra user_profiles (se a tabela e registro existirem)
        {
            let profile_exists: bool = tx
                .query_row(
                    "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user_profiles')",
                    [],
                    |row| row.get(0),
                )
                .unwrap_or(false);

            if profile_exists {
                let profile_env_json: Option<String> = tx
                    .query_row(
                        "SELECT encrypted_envelope FROM user_profiles WHERE id = 1",
                        [],
                        |row| row.get(0),
                    )
                    .optional()?;

                if let Some(json) = profile_env_json {
                    if let Ok(v1_env) = serde_json::from_str::<EncryptedEnvelope>(&json) {
                        if v1_env.version == 1 {
                            let plaintext = VaultCrypto::decrypt(master_password, &v1_env)?;
                            let aad = AadDomain::UserProfile {
                                profile_id: 1,
                                vault_instance_id: "default",
                            }
                            .to_canonical_bytes();
                            let new_aead =
                                VaultCrypto::encrypt_with_aead(&identity_key, &plaintext, &aad)?;
                            let new_json = serde_json::to_string(&new_aead)?;
                            tx.execute(
                                "UPDATE user_profiles SET encrypted_envelope = ?1 WHERE id = 1",
                                params![new_json],
                            )?;
                        }
                    }
                }
            }
        }

        // 4. Migra carteiras de wallets para wallets_v2 (se wallets_v2 estiver vazia e houver carteiras em wallets)
        {
            let v2_has_records: bool = tx
                .query_row("SELECT COUNT(*) FROM wallets_v2", [], |row| {
                    row.get::<_, i64>(0)
                })
                .unwrap_or(0)
                > 0;

            let v1_count: i64 = tx
                .query_row("SELECT COUNT(*) FROM wallets", [], |row| row.get(0))
                .unwrap_or(0);

            if !v2_has_records && v1_count > 0 {
                let creation_id = "v1-legacy-migration";
                tx.execute(
                    "INSERT INTO wallet_creation_operations (creation_id, target, account_branch, wallet_count, network_id, intent_hash, created_at)
                     VALUES (?1, 'DAO', 0, ?2, 'legacy', 'v1_synthetic_migration', datetime('now'))",
                    params![creation_id, v1_count],
                )?;

                tx.execute(
                    "INSERT INTO wallets_v2 (creation_id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id, client_doc)
                     SELECT ?1, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id, client_doc
                     FROM wallets ORDER BY id ASC",
                    params![creation_id],
                )?;
            }
        }

        // 5. Salva vault_header_v2
        let wrapped_dek_json = serde_json::to_string(&header_v2.wrapped_dek)?;
        tx.execute(
            "INSERT INTO vault_header_v2 (id, version, wrapped_dek, created_at)
             VALUES (1, ?1, ?2, ?3)",
            params![header_v2.version, wrapped_dek_json, header_v2.created_at],
        )?;

        tx.commit()?;
        Ok(true)
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
        let (busy, _log_frames, _checkpointed_frames): (i64, i64, i64) =
            conn.query_row("PRAGMA wal_checkpoint(TRUNCATE)", [], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?))
            })?;

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
            crate::modules::vault::encryption::VaultCrypto::encrypt("master_123", b"secret_words")
                .unwrap();
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
            crate::modules::vault::encryption::VaultCrypto::encrypt("master_123", b"canary_canary")
                .unwrap();
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

        let mnemonic = crate::modules::wallets::mnemonic::MnemonicService::generate(24)
            .expect("Mnemônica de 24 palavras");
        let seed = crate::modules::wallets::mnemonic::MnemonicService::to_seed(&mnemonic, "")
            .expect("Seed derivada");
        let previews = crate::modules::wallets::derivation::DerivationService::derive_batch(
            &seed,
            0,
            1,
            "Caixa Primário",
            "Arbitrum One",
        )
        .expect("Derivação");
        let derived_address = previews[0].address.clone();
        let derivation_path = previews[0].derivation_path.clone();

        let envelope = crate::modules::vault::encryption::VaultCrypto::encrypt(
            master_password,
            mnemonic.as_bytes(),
        )
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
        let decrypted_bytes = crate::modules::vault::encryption::VaultCrypto::decrypt(
            master_password,
            &retrieved_secret.envelope,
        )
        .expect("Decifragem autorizada");
        let recovered_mnemonic = String::from_utf8(decrypted_bytes).expect("UTF-8 válido");
        assert_eq!(recovered_mnemonic, mnemonic);

        let recovered_seed =
            crate::modules::wallets::mnemonic::MnemonicService::to_seed(&recovered_mnemonic, "")
                .expect("Seed recuperada");
        let recovered_previews =
            crate::modules::wallets::derivation::DerivationService::derive_batch(
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

        let fail_result = crate::modules::vault::encryption::VaultCrypto::decrypt(
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
        let test_dir =
            std::env::temp_dir().join(format!("devos_restore_invalid_{}", rand::random::<u64>()));
        let db = LocalDatabase::new(test_dir.clone());

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (
                id INTEGER PRIMARY KEY,
                version INTEGER NOT NULL,
                canary_envelope TEXT NOT NULL,
                created_at TEXT NOT NULL
            );",
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
            );",
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

    #[test]
    fn test_migration_4_creates_v2_tables_and_unique_indexes() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_mig4_test_{}", rand::random::<u64>()));
        let db = LocalDatabase::new(test_dir.clone());

        crate::storage::migrations::MigrationManager::run_migrations(&db)
            .expect("Migrações devem executar com sucesso");

        let conn = db.get_connection().unwrap();

        // Confirma existência das tabelas V2
        let table_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN ('vault_header_v2', 'wallet_creation_operations', 'wallets_v2')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(table_count, 3);

        // Confirma existência do índice único em vault_secrets
        let idx_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'index' AND name = 'idx_vault_secrets_target'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(idx_count, 1);

        let _ = std::fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_atomic_save_wallets_and_secret_v2() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_v2_atomic_{}", rand::random::<u64>()));
        let db = LocalDatabase::new(test_dir.clone());
        crate::storage::migrations::MigrationManager::run_migrations(&db).unwrap();

        let master_pwd = "AtomicSavePassword2026!";
        let (header_v2, dek) = VaultHeaderV2::init(master_pwd, "devos-desktop").unwrap();
        db.save_header_v2(&header_v2).unwrap();

        let wallets_key = Subkeys::derive_wallets_key(&dek);
        let vault_id = "dao_vault_v2_test";
        let target = "DAO";
        let aad = AadDomain::WalletMnemonic {
            vault_id,
            target: WalletTargetTag::Dao,
        }
        .to_canonical_bytes();

        let mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let aead_env =
            VaultCrypto::encrypt_with_aead(&wallets_key, mnemonic.as_bytes(), &aad).unwrap();

        let secret = StoredSecretV2 {
            vault_id: vault_id.to_string(),
            target: target.to_string(),
            envelope: aead_env,
            created_at: "2026-11-20 12:00:00".to_string(),
        };

        let creation_id = "op_batch_001";
        let op = WalletCreationOp {
            creation_id: creation_id.to_string(),
            target: target.to_string(),
            account_branch: 0,
            wallet_count: 2,
            network_id: "arbitrum-one".to_string(),
            intent_hash: "test_intent_hash_001".to_string(),
            created_at: "2026-11-20 12:00:00".to_string(),
        };

        let wallets = vec![
            NewWalletData {
                target: target.to_string(),
                custody_type: "CUSTODIAL_LOCAL".to_string(),
                user_name: "ASPPIBRA DAO".to_string(),
                label: "Conta 0".to_string(),
                derivation_path: "m/44'/60'/0'/0/0".to_string(),
                network: "Arbitrum One".to_string(),
                address: "0x1111111111111111111111111111111111111111".to_string(),
                status: "ACTIVE".to_string(),
                kyc_status: "UNVERIFIED".to_string(),
                seed_words_count: 12,
                vault_id: Some(vault_id.to_string()),
                client_doc: None,
            },
            NewWalletData {
                target: target.to_string(),
                custody_type: "CUSTODIAL_LOCAL".to_string(),
                user_name: "ASPPIBRA DAO".to_string(),
                label: "Conta 1".to_string(),
                derivation_path: "m/44'/60'/0'/0/1".to_string(),
                network: "Arbitrum One".to_string(),
                address: "0x2222222222222222222222222222222222222222".to_string(),
                status: "ACTIVE".to_string(),
                kyc_status: "UNVERIFIED".to_string(),
                seed_words_count: 12,
                vault_id: Some(vault_id.to_string()),
                client_doc: None,
            },
        ];

        let saved = db
            .save_wallets_and_secret_atomic(secret, op, &wallets)
            .expect("Gravação atômica deve ter sucesso");
        assert_eq!(saved.len(), 2);
        assert_eq!(saved[0].derivation_path, "m/44'/60'/0'/0/0");
        assert_eq!(saved[1].derivation_path, "m/44'/60'/0'/0/1");

        // Recupera o segredo e decifra com a DEK
        let retrieved_secret = db
            .get_secret_v2_by_vault_id(vault_id)
            .unwrap()
            .expect("Segredo V2 deve existir");
        let decrypted_bytes =
            VaultCrypto::decrypt_with_aead(&wallets_key, &retrieved_secret.envelope, &aad)
                .expect("Decifragem deve ter sucesso");
        assert_eq!(
            String::from_utf8(decrypted_bytes.to_vec()).unwrap(),
            mnemonic
        );

        let _ = std::fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_v1_to_v2_cryptographic_migration() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_mig_v1_v2_{}", rand::random::<u64>()));
        let db = LocalDatabase::new(test_dir.clone());
        crate::storage::migrations::MigrationManager::run_migrations(&db).unwrap();

        let master_password = "LegacyMasterPassword123!";

        // 1. Cria cabeçalho V1 e segredo V1
        let v1_header = VaultHeader::new(master_password).unwrap();
        db.save_header(&v1_header).unwrap();

        let mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let v1_envelope = VaultCrypto::encrypt(master_password, mnemonic.as_bytes()).unwrap();

        let v1_secret = StoredSecret {
            vault_id: "legacy_dao_vault".to_string(),
            target: "DAO".to_string(),
            envelope: v1_envelope,
            created_at: "2026-10-01 00:00:00".to_string(),
        };
        db.save_secret(v1_secret).unwrap();

        let v1_wallet = StoredWallet {
            id: 1,
            target: "DAO".to_string(),
            custody_type: "CUSTODIAL_LOCAL".to_string(),
            user: "ASPPIBRA DAO".to_string(),
            label: "Caixa Legado".to_string(),
            derivation_path: "m/44'/60'/0'/0/0".to_string(),
            network: "Arbitrum One".to_string(),
            address: "0x1111111111111111111111111111111111111111".to_string(),
            status: "ACTIVE".to_string(),
            kyc_status: "UNVERIFIED".to_string(),
            seed_words_count: 12,
            created_at: "2026-10-01 00:00:00".to_string(),
            vault_id: Some("legacy_dao_vault".to_string()),
            client_doc: None,
        };
        db.append_wallets(&[v1_wallet]).unwrap();

        // 2. Executa a migração V1 -> V2
        let migrated = db
            .migrate_v1_to_v2(master_password)
            .expect("Migração deve ter sucesso");
        assert!(migrated, "A migração deve ter sido aplicada");

        // Segunda execução deve ser no-op idempotente
        let second_run = db.migrate_v1_to_v2(master_password).unwrap();
        assert!(!second_run, "Segunda migração deve ser no-op");

        // 3. Valida cabeçalho V2
        let header_v2 = db.get_header_v2().unwrap().expect("Header V2 deve existir");
        let unlocked_dek = header_v2
            .unlock(master_password, "devos-desktop")
            .expect("Desbloqueio com KEK/DEK");
        let wallets_key = Subkeys::derive_wallets_key(&unlocked_dek);

        // 4. Valida decifragem do segredo recifrado em V2
        let v2_secret = db
            .get_secret_v2_by_vault_id("legacy_dao_vault")
            .unwrap()
            .expect("Segredo migrado deve existir");
        assert_eq!(v2_secret.envelope.version, 2);

        let aad = AadDomain::WalletMnemonic {
            vault_id: "legacy_dao_vault",
            target: WalletTargetTag::Dao,
        }
        .to_canonical_bytes();
        let decrypted =
            VaultCrypto::decrypt_with_aead(&wallets_key, &v2_secret.envelope, &aad).unwrap();
        assert_eq!(String::from_utf8(decrypted.to_vec()).unwrap(), mnemonic);

        // 5. Valida que carteiras aparecem através de list_wallets (migradas para wallets_v2)
        let wallets = db.list_wallets().unwrap();
        assert_eq!(wallets.len(), 1);
        assert_eq!(
            wallets[0].address,
            "0x1111111111111111111111111111111111111111"
        );

        let _ = std::fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_v2_vault_password_rotation_in_db() {
        let test_dir = std::env::temp_dir().join(format!("devos_v2_rot_{}", rand::random::<u64>()));
        let db = LocalDatabase::new(test_dir.clone());
        crate::storage::migrations::MigrationManager::run_migrations(&db).unwrap();

        let old_pwd = "OldMasterPassword123!";
        let new_pwd = "NewRotatedPassword456!";

        let (header_v2, dek) = VaultHeaderV2::init(old_pwd, "devos-desktop").unwrap();
        db.save_header_v2(&header_v2).unwrap();

        // Rotação de senha O(1)
        let rotated_header = header_v2
            .rotate_password(old_pwd, new_pwd, "devos-desktop")
            .unwrap();
        db.rotate_vault_password_v2(&rotated_header).unwrap();

        // Recarrega do banco e confirma
        let reloaded = db.get_header_v2().unwrap().unwrap();
        assert!(reloaded.unlock(old_pwd, "devos-desktop").is_err());

        let recovered_dek = reloaded.unlock(new_pwd, "devos-desktop").unwrap();
        assert_eq!(*recovered_dek, *dek);

        let _ = std::fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_atomic_save_wallets_and_secret_v2_true_idempotency() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_v2_idempotency_{}", rand::random::<u64>()));
        let db = LocalDatabase::new(test_dir.clone());
        crate::storage::migrations::MigrationManager::run_migrations(&db).unwrap();

        let dummy_envelope = crate::modules::vault::encryption::AeadEnvelope {
            version: 2,
            cipher: "AES-256-GCM".to_string(),
            nonce_hex: "0102030405060708090a0b0c".to_string(),
            ciphertext_hex: "aabbccdd11223344556677889900aabbccddeeff".to_string(),
        };

        let secret = StoredSecretV2 {
            vault_id: "test_vault_id".to_string(),
            target: "DAO".to_string(),
            envelope: dummy_envelope.clone(),
            created_at: "2026-11-20 12:00:00".to_string(),
        };

        let intent_hash = compute_wallet_creation_intent_hash(
            "DAO",
            0,
            1,
            "arbitrum_one",
            "Test Wallet",
            Some("ref_test_user_001"),
        );

        let op = WalletCreationOp {
            creation_id: "op_test_123".to_string(),
            target: "DAO".to_string(),
            account_branch: 0,
            wallet_count: 1,
            network_id: "arbitrum_one".to_string(),
            intent_hash: intent_hash.clone(),
            created_at: "2026-11-20 12:00:00".to_string(),
        };

        let wallets = vec![NewWalletData {
            target: "DAO".to_string(),
            custody_type: "CUSTODIAL_LOCAL".to_string(),
            user_name: "Test User".to_string(),
            label: "Test Wallet".to_string(),
            derivation_path: "m/44'/60'/0'/0/0".to_string(),
            network: "arbitrum_one".to_string(),
            address: "0x1234567890123456789012345678901234567890".to_string(),
            status: "ACTIVE".to_string(),
            kyc_status: "UNVERIFIED".to_string(),
            seed_words_count: 12,
            vault_id: Some("test_vault_id".to_string()),
            client_doc: None,
        }];

        // 1. Primeira execução: deve persistir normalmente
        let saved1 = db
            .save_wallets_and_secret_atomic(secret.clone(), op.clone(), &wallets)
            .expect("Primeira gravação deve ter sucesso");
        assert_eq!(saved1.len(), 1);

        // 2. Segunda execução idêntica: idempotência verdadeira (no-op, não duplica)
        let saved2 = db
            .save_wallets_and_secret_atomic(secret.clone(), op.clone(), &wallets)
            .expect("Execução repetida idêntica deve ter sucesso idempotente");
        assert_eq!(saved2.len(), 1);

        // 3. Terceira execução com creation_id idêntico mas parâmetros conflitantes: deve falhar
        let conflicting_op = WalletCreationOp {
            creation_id: "op_test_123".to_string(),
            target: "DAO".to_string(),
            account_branch: 1, // modificado!
            wallet_count: 1,
            network_id: "arbitrum_one".to_string(),
            intent_hash: "conflicting_hash_divergent".to_string(),
            created_at: "2026-11-20 12:00:00".to_string(),
        };

        let err = db
            .save_wallets_and_secret_atomic(secret, conflicting_op, &wallets)
            .unwrap_err();
        match err {
            StorageError::InvalidData(msg) => {
                assert!(msg.contains("Violação de idempotência"));
            }
            other => panic!("Esperado StorageError::InvalidData, recebido {:?}", other),
        }

        let _ = std::fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_wallets_v2_custody_type_check_constraint() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_v2_constraint_{}", rand::random::<u64>()));
        let db = LocalDatabase::new(test_dir.clone());
        crate::storage::migrations::MigrationManager::run_migrations(&db).unwrap();

        let conn = db.get_connection().unwrap();

        // Insere uma operação de referência
        conn.execute(
            "INSERT INTO wallet_creation_operations (creation_id, target, account_branch, wallet_count, network_id, intent_hash, created_at)
             VALUES ('op_c1', 'DAO', 0, 1, 'net1', 'intent_test_1', '2026-11-20')",
            [],
        )
        .unwrap();

        // 1. CUSTODIAL_LOCAL sem vault_id deve FALHAR
        let res1 = conn.execute(
            "INSERT INTO wallets_v2 (creation_id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id)
             VALUES ('op_c1', 'DAO', 'CUSTODIAL_LOCAL', 'U1', 'L1', 'm/0', 'net', '0x1', 'ACTIVE', 'UNVERIFIED', 12, '2026-11-20', NULL)",
            [],
        );
        assert!(
            res1.is_err(),
            "CUSTODIAL_LOCAL com vault_id NULL deve ser rejeitado"
        );

        // 2. CUSTODIAL_LOCAL com seed_words_count inválido (ex: 15) deve FALHAR
        let res2 = conn.execute(
            "INSERT INTO wallets_v2 (creation_id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id)
             VALUES ('op_c1', 'DAO', 'CUSTODIAL_LOCAL', 'U1', 'L1', 'm/1', 'net', '0x2', 'ACTIVE', 'UNVERIFIED', 15, '2026-11-20', 'vault1')",
            [],
        );
        assert!(
            res2.is_err(),
            "CUSTODIAL_LOCAL com seed_words_count = 15 deve ser rejeitado"
        );

        // 3. WATCH_ONLY com vault_id preenchido deve FALHAR
        let res3 = conn.execute(
            "INSERT INTO wallets_v2 (creation_id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id)
             VALUES ('op_c1', 'DAO', 'WATCH_ONLY', 'U1', 'L1', 'm/2', 'net', '0x3', 'ACTIVE', 'UNVERIFIED', 0, '2026-11-20', 'vault1')",
            [],
        );
        assert!(
            res3.is_err(),
            "WATCH_ONLY com vault_id preenchido deve ser rejeitado"
        );

        // 4. WATCH_ONLY com seed_words_count != 0 deve FALHAR
        let res4 = conn.execute(
            "INSERT INTO wallets_v2 (creation_id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id)
             VALUES ('op_c1', 'DAO', 'WATCH_ONLY', 'U1', 'L1', 'm/3', 'net', '0x4', 'ACTIVE', 'UNVERIFIED', 12, '2026-11-20', NULL)",
            [],
        );
        assert!(
            res4.is_err(),
            "WATCH_ONLY com seed_words_count != 0 deve ser rejeitado"
        );

        // 5. CUSTODIAL_LOCAL válido deve ter SUCESSO
        let res5 = conn.execute(
            "INSERT INTO wallets_v2 (creation_id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id)
             VALUES ('op_c1', 'DAO', 'CUSTODIAL_LOCAL', 'U1', 'L1', 'm/4', 'net', '0x5', 'ACTIVE', 'UNVERIFIED', 12, '2026-11-20', 'vault1')",
            [],
        );
        assert!(res5.is_ok(), "CUSTODIAL_LOCAL válido deve ser aceito");

        // 6. WATCH_ONLY válido deve ter SUCESSO
        let res6 = conn.execute(
            "INSERT INTO wallets_v2 (creation_id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id)
             VALUES ('op_c1', 'DAO', 'WATCH_ONLY', 'U1', 'L1', 'm/5', 'net', '0x6', 'ACTIVE', 'UNVERIFIED', 0, '2026-11-20', NULL)",
            [],
        );
        assert!(res6.is_ok(), "WATCH_ONLY válido deve ser aceito");

        let _ = std::fs::remove_dir_all(test_dir);
    }
}
