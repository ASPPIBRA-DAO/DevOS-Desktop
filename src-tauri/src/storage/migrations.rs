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

        tx.commit()?;

        // Banco de dados inicializado limpo, pronto para carteiras reais
        Ok(())
    }
}
