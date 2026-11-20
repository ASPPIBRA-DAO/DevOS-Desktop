use super::local_database::{LocalDatabase, StorageError};

pub struct MigrationManager;

impl MigrationManager {
    /// Executa as migrações versionadas no banco SQLite local dentro de transação
    pub fn run_migrations(db: &LocalDatabase) -> Result<(), StorageError> {
        let mut conn = db.get_connection()?;
        let tx = conn.transaction()?;

        // 1. Tabela de controle de versão de migrações
        tx.execute_batch(
            "CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            );",
        )?;

        // Consulta última migração aplicada
        let current_version: u32 = tx
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        // Migração 1: Estrutura inicial do cofre e tabelas de custódia
        if current_version < 1 {
            tx.execute_batch(
                "CREATE TABLE IF NOT EXISTS vault_header (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    version INTEGER NOT NULL,
                    canary_envelope TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS wallets (
                    id INTEGER PRIMARY KEY,
                    target TEXT NOT NULL,
                    custody_type TEXT NOT NULL,
                    user_name TEXT NOT NULL,
                    label TEXT NOT NULL,
                    derivation_path TEXT NOT NULL,
                    network TEXT NOT NULL,
                    address TEXT NOT NULL,
                    status TEXT NOT NULL,
                    kyc_status TEXT NOT NULL,
                    seed_words_count INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    vault_id TEXT,
                    client_doc TEXT
                );

                CREATE TABLE IF NOT EXISTS vault_secrets (
                    vault_id TEXT PRIMARY KEY,
                    target TEXT NOT NULL,
                    envelope TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                INSERT INTO schema_migrations (version, applied_at)
                VALUES (1, datetime('now'));",
            )?;
        }

        // Migração 2: Tabela de perfil e identidade civil com envelope criptográfico
        if current_version < 2 {
            tx.execute_batch(
                "CREATE TABLE IF NOT EXISTS user_profiles (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    encrypted_envelope TEXT NOT NULL,
                    payload_version INTEGER NOT NULL DEFAULT 1,
                    revision INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                INSERT INTO schema_migrations (version, applied_at)
                VALUES (2, datetime('now'));",
            )?;
        }

        // Migração 3: Tabela de Identidades Descentralizadas SSI (local_dids)
        // Regra Inegociável: Armazena estritamente metadados e chave pública de 32 bytes.
        // Nenhuma coluna armazena sementes BIP-39 ou chaves privadas.
        if current_version < 3 {
            tx.execute_batch(
                "CREATE TABLE IF NOT EXISTS local_dids (
                    did TEXT PRIMARY KEY,
                    method TEXT NOT NULL DEFAULT 'key' CHECK (method = 'key'),
                    public_key BLOB NOT NULL CHECK (length(public_key) = 32),
                    derivation_scheme TEXT NOT NULL,
                    derivation_path TEXT NOT NULL,
                    key_version INTEGER NOT NULL DEFAULT 1,
                    is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
                    created_at INTEGER NOT NULL,
                    UNIQUE(public_key)
                );

                CREATE UNIQUE INDEX IF NOT EXISTS idx_local_dids_single_primary
                ON local_dids(is_primary) WHERE is_primary = 1;

                INSERT INTO schema_migrations (version, applied_at)
                VALUES (3, datetime('now'));",
            )?;
        }

        // Migração 4: Estrutura V2 para KEK/DEK, Carteiras Segregadas e Idempotência de Lote
        if current_version < 4 {
            tx.execute_batch(
                "CREATE TABLE IF NOT EXISTS vault_header_v2 (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    version INTEGER NOT NULL CHECK (version = 2),
                    wrapped_dek TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS wallet_creation_operations (
                    creation_id TEXT PRIMARY KEY,
                    target TEXT NOT NULL CHECK (target IN ('DAO', 'CLIENT')),
                    account_branch INTEGER NOT NULL,
                    wallet_count INTEGER NOT NULL CHECK (wallet_count > 0 AND wallet_count <= 100),
                    network_id TEXT NOT NULL,
                    intent_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS wallets_v2 (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    creation_id TEXT NOT NULL REFERENCES wallet_creation_operations(creation_id) ON DELETE CASCADE,
                    target TEXT NOT NULL CHECK (target IN ('DAO', 'CLIENT')),
                    custody_type TEXT NOT NULL CHECK (custody_type IN ('WATCH_ONLY', 'CUSTODIAL_LOCAL')),
                    user_name TEXT NOT NULL,
                    label TEXT NOT NULL,
                    derivation_path TEXT NOT NULL,
                    network TEXT NOT NULL,
                    address TEXT NOT NULL,
                    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PENDING', 'ROTATED')),
                    kyc_status TEXT NOT NULL CHECK (kyc_status IN ('UNVERIFIED', 'SIMULATED_TEST', 'VERIFIED')),
                    seed_words_count INTEGER,
                    created_at TEXT NOT NULL,
                    vault_id TEXT,
                    client_doc TEXT,
                    UNIQUE (creation_id, derivation_path),
                    CHECK (
                        (custody_type = 'CUSTODIAL_LOCAL' AND vault_id IS NOT NULL AND seed_words_count IS NOT NULL AND seed_words_count IN (12, 24))
                        OR
                        (custody_type = 'WATCH_ONLY' AND vault_id IS NULL AND seed_words_count = 0)
                    )
                );

                CREATE UNIQUE INDEX IF NOT EXISTS idx_vault_secrets_target
                ON vault_secrets(vault_id, target);

                INSERT INTO schema_migrations (version, applied_at)
                VALUES (4, datetime('now'));",
            )?;
        }

        tx.commit()?;

        // Banco de dados inicializado limpo, pronto para carteiras reais
        Ok(())
    }
}
