use std::fs;
use std::path::PathBuf;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

use crate::vault::access_control::{VaultHeader, VaultStatus};
use crate::vault::encryption::{EncryptedEnvelope, VaultCryptoError};

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


/// Metadados públicos da carteira persistida no SQLite
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
    pub status: String,       // "ACTIVE" | "PENDING" | "ROTATED"
    pub kyc_status: String,   // "UNVERIFIED" | "SIMULATED_TEST" | "VERIFIED"
    pub seed_words_count: usize,
    pub created_at: String,
    pub vault_id: Option<String>, // NULL se WATCH_ONLY
    pub client_doc: Option<String>,
}

/// Registro criptografado do cofre (envelope AEAD) persistido no SQLite
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredSecret {
    pub vault_id: String,
    pub target: String,
    pub envelope: EncryptedEnvelope,
    pub created_at: String,
}

/// Banco de dados local SQLite seguro do DevOS
pub struct LocalDatabase {
    db_path: PathBuf,
}

impl LocalDatabase {
    pub fn new(base_dir: PathBuf) -> Self {
        let db_path = base_dir.join("devos_vault.sqlite");
        Self { db_path }
    }

    pub fn db_path(&self) -> &PathBuf {
        &self.db_path
    }

    /// Abre ou cria a conexão com o banco de dados SQLite local
    pub fn get_connection(&self) -> Result<Connection, StorageError> {
        if let Some(parent) = self.db_path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)?;
            }
        }
        let conn = Connection::open(&self.db_path)?;
        // Habilita foreign keys e journal mode WAL para alta performance e segurança transacional
        conn.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")?;
        Ok(conn)
    }

    /// Retorna o cabeçalho persistido do cofre (se existir)
    pub fn get_header(&self) -> Result<Option<VaultHeader>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare("SELECT version, canary_envelope, created_at FROM vault_header WHERE id = 1")?;

        let header = stmt.query_row([], |row| {
            let version: u32 = row.get(0)?;
            let canary_json: String = row.get(1)?;
            let created_at: String = row.get(2)?;
            let canary_envelope: EncryptedEnvelope = serde_json::from_str(&canary_json)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(e)))?;

            Ok(VaultHeader {
                version,
                canary_envelope,
                created_at,
            })
        }).optional()?;

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

        let existing: Option<u32> = tx.query_row(
            "SELECT id FROM vault_header WHERE id = 1",
            [],
            |row| row.get(0)
        ).optional()?;

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
    pub fn append_wallets(&self, new_wallets: &[StoredWallet]) -> Result<Vec<StoredWallet>, StorageError> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction()?;

        {
            let mut stmt = tx.prepare(
                "INSERT INTO wallets (id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id, client_doc)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)"
            )?;

            for w in new_wallets {
                stmt.execute(params![
                    w.id,
                    w.target,
                    w.custody_type,
                    w.user,
                    w.label,
                    w.derivation_path,
                    w.network,
                    w.address,
                    w.status,
                    w.kyc_status,
                    w.seed_words_count as i64,
                    w.created_at,
                    w.vault_id,
                    w.client_doc
                ])?;
            }
        }

        tx.commit()?;
        self.list_wallets()
    }

    /// Salva o envelope secreto cifrado dentro da tabela vault_secrets
    pub fn save_secret(&self, secret: StoredSecret) -> Result<(), StorageError> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction()?;
        let envelope_json = serde_json::to_string(&secret.envelope)?;

        tx.execute(
            "INSERT OR REPLACE INTO vault_secrets (vault_id, target, envelope, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![secret.vault_id, secret.target, envelope_json, secret.created_at],
        )?;

        tx.commit()?;
        Ok(())
    }

    /// Busca o envelope secreto correspondente a um vault_id
    pub fn get_secret_by_vault_id(&self, vault_id: &str) -> Result<Option<StoredSecret>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare("SELECT vault_id, target, envelope, created_at FROM vault_secrets WHERE vault_id = ?1")?;

        let secret = stmt.query_row(params![vault_id], |row| {
            let v_id: String = row.get(0)?;
            let target: String = row.get(1)?;
            let env_json: String = row.get(2)?;
            let created_at: String = row.get(3)?;
            let envelope: EncryptedEnvelope = serde_json::from_str(&env_json)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(2, rusqlite::types::Type::Text, Box::new(e)))?;

            Ok(StoredSecret {
                vault_id: v_id,
                target,
                envelope,
                created_at,
            })
        }).optional()?;

        Ok(secret)
    }

    /// Retorna o status operacional do cofre SQLite
    pub fn get_status(&self, is_unlocked: bool) -> Result<VaultStatus, StorageError> {
        let is_initialized = self.get_header()?.is_some();
        let wallets = self.list_wallets()?;
        let dao_count = wallets.iter().filter(|w| w.target == "DAO").count();
        let client_count = wallets.iter().filter(|w| w.target == "CLIENT").count();

        Ok(VaultStatus {
            is_initialized,
            is_unlocked,
            dao_wallets_count: dao_count,
            client_wallets_count: client_count,
        })
    }

    /// Executa backup atômico do banco de dados SQLite para o destino especificado
    pub fn export_backup(&self, destination_path: &std::path::Path) -> Result<u64, StorageError> {
        let conn = self.get_connection()?;
        // Executa checkpoint WAL para garantir consistência dos dados em disco
        conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")?;

        if let Some(parent) = destination_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let bytes_copied = fs::copy(&self.db_path, destination_path)?;
        Ok(bytes_copied)
    }

    /// Restaura o banco de dados a partir de um arquivo de backup verificado
    pub fn restore_backup(&self, source_path: &std::path::Path) -> Result<(), StorageError> {
        if !source_path.exists() {
            return Err(StorageError::InvalidData(format!("Arquivo de backup não encontrado: {:?}", source_path)));
        }

        // Valida que o arquivo de backup é um banco SQLite íntegro com a tabela vault_header
        let test_conn = Connection::open_with_flags(source_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)?;
        let has_vault_header: bool = test_conn
            .query_row(
                "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='vault_header'",
                [],
                |row| row.get::<_, i64>(0),
            )
            .map(|count| count > 0)
            .unwrap_or(false);

        if !has_vault_header {
            return Err(StorageError::InvalidData(
                "Arquivo de backup inválido: tabela vault_header ausente.".to_string(),
            ));
        }
        drop(test_conn);

        // Remove banco ativo e arquivos WAL/SHM associados antes da substituição atômica
        let _ = fs::remove_file(&self.db_path);
        let wal_path = self.db_path.with_extension("sqlite-wal");
        let shm_path = self.db_path.with_extension("sqlite-shm");
        let _ = fs::remove_file(wal_path);
        let _ = fs::remove_file(shm_path);

        if let Some(parent) = self.db_path.parent() {
            fs::create_dir_all(parent)?;
        }

        fs::copy(source_path, &self.db_path)?;
        Ok(())
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sqlite_persistence_across_reconnect() {
        let test_dir = std::env::temp_dir().join(format!("devos_test_db_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());

        // Cria tabelas via conexão inicial
        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);
             CREATE TABLE IF NOT EXISTS wallets (id INTEGER PRIMARY KEY, target TEXT NOT NULL, custody_type TEXT NOT NULL, user_name TEXT NOT NULL, label TEXT NOT NULL, derivation_path TEXT NOT NULL, network TEXT NOT NULL, address TEXT NOT NULL, status TEXT NOT NULL, kyc_status TEXT NOT NULL, seed_words_count INTEGER NOT NULL, created_at TEXT NOT NULL, vault_id TEXT, client_doc TEXT);
             CREATE TABLE IF NOT EXISTS vault_secrets (vault_id TEXT PRIMARY KEY, target TEXT NOT NULL, envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        // Salva uma carteira
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

        db.append_wallets(&[w.clone()]).unwrap();

        // Simula reinicialização da aplicação criando nova instância de LocalDatabase
        let reloaded_db = LocalDatabase::new(test_dir.clone());
        let loaded = reloaded_db.list_wallets().unwrap();

        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].address, "0x9858EfFD232B4033E47d90003D41EC34EcaEda94");
        assert_eq!(loaded[0].custody_type, "CUSTODIAL_LOCAL");

        // Limpeza do diretório de teste
        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_wallet_isolation_and_custody_segregation() {
        let test_dir = std::env::temp_dir().join(format!("devos_test_isolation_{}", rand::random::<u32>()));
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

        db.append_wallets(&[dao_custodial, client_watch_only]).unwrap();

        let all = db.list_wallets().unwrap();
        assert_eq!(all.len(), 2);

        // Verifica que carteira watch-only NÃO possui segredo no cofre
        let secret_none = db.get_secret_by_vault_id("non_existent").unwrap();
        assert!(secret_none.is_none());

        // Salva segredo para a carteira custodial
        let fake_envelope = crate::vault::encryption::VaultCrypto::encrypt("master_123", b"secret_words").unwrap();
        let stored_secret = StoredSecret {
            vault_id: "dao_vault_1".to_string(),
            target: "DAO".to_string(),
            envelope: fake_envelope.clone(),
            created_at: "2026-10-12 00:00".to_string(),
        };
        db.save_secret(stored_secret).unwrap();

        let retrieved = db.get_secret_by_vault_id("dao_vault_1").unwrap().expect("Segredo deve existir");
        assert_eq!(retrieved.vault_id, "dao_vault_1");
        assert_eq!(retrieved.envelope.ciphertext_hex, fake_envelope.ciphertext_hex);

        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_vault_header_persistence_and_recovery() {
        let test_dir = std::env::temp_dir().join(format!("devos_test_header_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        let canary = crate::vault::encryption::VaultCrypto::encrypt("master_123", b"canary_canary").unwrap();
        let header = VaultHeader {
            version: 1,
            canary_envelope: canary.clone(),
            created_at: "2026-10-12 00:00".to_string(),
        };

        db.save_header(&header).unwrap();

        // Recarrega banco
        let reloaded_db = LocalDatabase::new(test_dir.clone());
        let loaded_header = reloaded_db.get_header().unwrap().expect("Header deve existir");
        assert_eq!(loaded_header.canary_envelope.ciphertext_hex, canary.ciphertext_hex);

        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_complete_vault_lifecycle_and_backup() {
        let test_dir = std::env::temp_dir().join(format!("devos_full_lifecycle_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());
        let master_password = "SuperMasterPassword2026!Secure";

        // Cria tabelas necessárias
        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);
             CREATE TABLE IF NOT EXISTS wallets (id INTEGER PRIMARY KEY, target TEXT NOT NULL, custody_type TEXT NOT NULL, user_name TEXT NOT NULL, label TEXT NOT NULL, derivation_path TEXT NOT NULL, network TEXT NOT NULL, address TEXT NOT NULL, status TEXT NOT NULL, kyc_status TEXT NOT NULL, seed_words_count INTEGER NOT NULL, created_at TEXT NOT NULL, vault_id TEXT, client_doc TEXT);
             CREATE TABLE IF NOT EXISTS vault_secrets (vault_id TEXT PRIMARY KEY, target TEXT NOT NULL, envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        // 1. Inicializar o cofre com uma senha mestre
        let header = VaultHeader::new(master_password).expect("Header deve ser gerado com sucesso");
        db.save_header(&header).expect("Header deve ser persistido");

        // 2. Gerar uma nova carteira BIP-39 e derivar BIP-44
        let mnemonic = crate::wallets::mnemonic::MnemonicService::generate(24).expect("Mnemônica de 24 palavras");
        let seed = crate::wallets::mnemonic::MnemonicService::to_seed(&mnemonic, "").expect("Seed derivada");
        let previews = crate::wallets::derivation::DerivationService::derive_batch(&seed, 0, 1, "Caixa Primário", "Arbitrum One").expect("Derivação");
        let derived_address = previews[0].address.clone();
        let derivation_path = previews[0].derivation_path.clone();

        // 3. Confirmar e persistir a carteira (envelope cifrado e metadados)
        let envelope = crate::vault::encryption::VaultCrypto::encrypt(master_password, mnemonic.as_bytes()).expect("Cifragem AEAD");
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

        // 4. Fechar a conexão e simular reinício do aplicativo criando nova instância de LocalDatabase
        let reloaded_db = LocalDatabase::new(test_dir.clone());

        // 5. Desbloquear o cofre (validar senha mestre)
        let reloaded_header = reloaded_db.get_header().unwrap().expect("Header recarregado deve existir");
        assert!(reloaded_header.verify_password(master_password), "Senha mestre válida deve desbloquear");
        assert!(!reloaded_header.verify_password("SenhaErrada!"), "Senha errada deve ser rejeitada");

        // 6. Recuperar os metadados da carteira
        let wallets = reloaded_db.list_wallets().expect("Listagem pós-reboot");
        assert_eq!(wallets.len(), 1);
        assert_eq!(wallets[0].address, derived_address);
        assert_eq!(wallets[0].custody_type, "CUSTODIAL_LOCAL");

        // 7. Confirmar que o endereço recuperado corresponde exatamente à chave derivada do envelope decifrado
        let retrieved_secret = reloaded_db.get_secret_by_vault_id(&vault_id).unwrap().expect("Segredo deve existir");
        let decrypted_bytes = crate::vault::encryption::VaultCrypto::decrypt(master_password, &retrieved_secret.envelope).expect("Decifragem autorizada");
        let recovered_mnemonic = String::from_utf8(decrypted_bytes).expect("UTF-8 válido");
        assert_eq!(recovered_mnemonic, mnemonic);

        let recovered_seed = crate::wallets::mnemonic::MnemonicService::to_seed(&recovered_mnemonic, "").expect("Seed recuperada");
        let recovered_previews = crate::wallets::derivation::DerivationService::derive_batch(&recovered_seed, 0, 1, "Teste", "Arbitrum One").expect("Derivação conferida");
        assert_eq!(recovered_previews[0].address, wallets[0].address, "Endereço decifrado deve coincidir com o salvo");

        // 8. Verificar que o segredo permaneceu criptografado no armazenamento
        assert!(!retrieved_secret.envelope.ciphertext_hex.is_empty());
        assert!(!retrieved_secret.envelope.ciphertext_hex.contains(&mnemonic));

        // 9. Confirmar que uma senha incorreta não permite recuperar o segredo
        let fail_result = crate::vault::encryption::VaultCrypto::decrypt("SenhaIncorreta999!", &retrieved_secret.envelope);
        assert!(fail_result.is_err(), "Decifragem com senha incorreta deve retornar erro AEAD");

        // 10. Validação de Backup e Restauração
        let backup_path = test_dir.join("backups").join("vault_backup.bak");
        let copied = reloaded_db.export_backup(&backup_path).expect("Backup deve ser exportado");
        assert!(copied > 0);
        assert!(backup_path.exists());

        // Restaura em diretório limpo
        let restore_dir = std::env::temp_dir().join(format!("devos_restored_{}", rand::random::<u32>()));
        let restored_db = LocalDatabase::new(restore_dir.clone());
        restored_db.restore_backup(&backup_path).expect("Restauração de backup deve ser concluída");

        let restored_wallets = restored_db.list_wallets().expect("Carteiras no banco restaurado");
        assert_eq!(restored_wallets.len(), 1);
        assert_eq!(restored_wallets[0].address, derived_address);

        let _ = fs::remove_dir_all(test_dir);
        let _ = fs::remove_dir_all(restore_dir);
    }

    #[test]
    fn test_atomic_initialize_vault_if_absent_prevents_overwrite() {
        let test_dir = std::env::temp_dir().join(format!("devos_atomic_vault_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());
        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        let header1 = VaultHeader::new("InitialMasterPassword123!").expect("Header 1 válido");
        let header2 = VaultHeader::new("AttackerOrOverwritePassword456!").expect("Header 2 válido");

        // Primeira chamada deve inicializar com sucesso
        let first_res = db.initialize_vault_if_absent(&header1);
        assert!(first_res.is_ok(), "Primeira inicialização deve ter sucesso");

        // Segunda chamada concorrente/duplicada deve falhar categoricamente
        let second_res = db.initialize_vault_if_absent(&header2);
        assert!(second_res.is_err(), "Segunda inicialização deve ser rejeitada");
        match second_res {
            Err(StorageError::AlreadyInitialized) => {}
            _ => panic!("Esperado StorageError::AlreadyInitialized"),
        }

        // Garante que o header persistido permanece sendo exatamente o primeiro (sem sobrescrita)
        let loaded = db.get_header().unwrap().expect("Header deve existir");
        assert!(loaded.verify_password("InitialMasterPassword123!"));
        assert!(!loaded.verify_password("AttackerOrOverwritePassword456!"));

        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_concurrent_multithread_initialization_race() {
        use std::sync::{Arc, Barrier};
        use std::thread;

        let test_dir = std::env::temp_dir().join(format!("devos_concurrency_race_{}", rand::random::<u32>()));
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
                // Todas as 10 threads aguardam aqui e disparam juntas
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

        // Exatamente UMA thread pode ter sucesso
        assert_eq!(success_count, 1, "Exatamente UMA thread concorrente deve ter sucesso na inicialização atômica");

        // O cabeçalho salvo no disco deve corresponder exatamente à thread vencedora
        let final_header = db.get_header().unwrap().expect("Header persistido");
        assert!(final_header.verify_password(&winning_password), "Header deve ser da thread vencedora");

        let _ = fs::remove_dir_all(test_dir);
    }
}
