use super::local_database::StorageError;
use super::real_estate_database::RealEstateDatabase;

pub struct RealEstateMigrationManager;

impl RealEstateMigrationManager {
    /// Executa as migrações versionadas no banco SQLite cadastral (real_estate.sqlite) dentro de transação atômica.
    /// Configura o journal_mode = WAL na inicialização da base.
    pub fn run_migrations(db: &RealEstateDatabase) -> Result<(), StorageError> {
        db.init_wal()?;

        let mut conn = db.get_connection()?;
        let tx = conn.transaction()?;

        // 1. Tabela de controle de versão de migrações cadastrais
        tx.execute_batch(
            "CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            );",
        )?;

        // Consulta última migração aplicada
        let mut current_version: u32 = tx
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        // Migração 1: Esquema Cadastral com Proveniência, Auditoria e Histórico (DevOS Cockpit V1)
        if current_version < 1 {
            tx.execute_batch(
                "
                -- 1. Identidade estável interna dos imóveis
                CREATE TABLE IF NOT EXISTS properties (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT UNIQUE NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                -- 2. Identificadores oficiais e cadastrais associados
                CREATE TABLE IF NOT EXISTS property_identifiers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
                    identifier_type TEXT NOT NULL,
                    raw_value TEXT NOT NULL,
                    normalized_value TEXT,
                    issuer_or_source TEXT NOT NULL,
                    verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                -- 3. Endereços com preservação do conteúdo original e componentes estruturados
                CREATE TABLE IF NOT EXISTS addresses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    raw_address TEXT NOT NULL,
                    street TEXT,
                    number TEXT,
                    complement TEXT,
                    neighborhood TEXT,
                    city TEXT,
                    state TEXT,
                    postal_code TEXT,
                    normalized_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                -- 4. Associação histórica entre imóveis e endereços
                CREATE TABLE IF NOT EXISTS property_address_links (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
                    address_id INTEGER NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
                    is_primary BOOLEAN NOT NULL DEFAULT 1,
                    effective_from TEXT,
                    effective_to TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                -- 5. Lotes e histórico de importações
                CREATE TABLE IF NOT EXISTS import_batches (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_filename TEXT NOT NULL,
                    source_hash_sha256 TEXT NOT NULL,
                    source_file_size INTEGER NOT NULL,
                    sheet_name TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    completed_at TEXT,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    total_rows_read INTEGER NOT NULL DEFAULT 0,
                    total_records_imported INTEGER NOT NULL DEFAULT 0,
                    total_inconsistencies_detected INTEGER NOT NULL DEFAULT 0,
                    metadata_json TEXT
                );

                -- 6. Conteúdo original de cada registro importado e sua proveniência exata
                -- UNIQUE(batch_id, sheet_name, row_number) garante que cada linha física do arquivo seja rastreada
                -- mesmo quando duas linhas distintas possuírem conteúdo textual idêntico.
                CREATE TABLE IF NOT EXISTS import_batch_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    batch_id INTEGER NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
                    sheet_name TEXT NOT NULL,
                    row_number INTEGER NOT NULL,
                    raw_content_json TEXT NOT NULL,
                    line_hash_sha256 TEXT NOT NULL,
                    processing_status TEXT NOT NULL DEFAULT 'RAW',
                    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    CONSTRAINT uq_batch_record UNIQUE (batch_id, sheet_name, row_number)
                );

                -- 7. Inconsistências cadastrais identificadas (Auditoria)
                -- Aponta tanto para o imóvel quanto para o registro bruto de origem motivador
                CREATE TABLE IF NOT EXISTS audit_findings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
                    batch_record_id INTEGER REFERENCES import_batch_records(id) ON DELETE SET NULL,
                    category TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    source TEXT NOT NULL,
                    description TEXT NOT NULL,
                    analysis_status TEXT NOT NULL DEFAULT 'OPEN',
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    resolved_at TEXT
                );

                -- 8. Propostas de correção controladas com fluxo de aprovação
                CREATE TABLE IF NOT EXISTS correction_proposals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
                    target_record_id INTEGER REFERENCES import_batch_records(id) ON DELETE SET NULL,
                    field_name TEXT NOT NULL,
                    previous_value TEXT,
                    proposed_value TEXT NOT NULL,
                    justification TEXT NOT NULL,
                    evidence_notes TEXT,
                    proposed_by TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'PROPOSED',
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    reviewed_at TEXT,
                    reviewed_by TEXT
                );

                -- 9. Registro de operações e trilha de auditoria
                CREATE TABLE IF NOT EXISTS audit_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    details_json TEXT NOT NULL,
                    performed_by TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                -- Triggers para assegurar imutabilidade rigorosa da trilha audit_events (Append-Only)
                CREATE TRIGGER IF NOT EXISTS trg_prevent_audit_events_update
                BEFORE UPDATE ON audit_events
                BEGIN
                    SELECT RAISE(ABORT, 'audit_events is append-only and cannot be modified');
                END;

                CREATE TRIGGER IF NOT EXISTS trg_prevent_audit_events_delete
                BEFORE DELETE ON audit_events
                BEGIN
                    SELECT RAISE(ABORT, 'audit_events is append-only and cannot be deleted');
                END;

                -- Índices de consulta, performance e integridade referencial
                CREATE INDEX IF NOT EXISTS idx_properties_uuid ON properties(uuid);
                CREATE INDEX IF NOT EXISTS idx_prop_ident_prop ON property_identifiers(property_id);
                CREATE INDEX IF NOT EXISTS idx_prop_ident_raw ON property_identifiers(raw_value);
                CREATE INDEX IF NOT EXISTS idx_prop_ident_type ON property_identifiers(identifier_type);
                CREATE INDEX IF NOT EXISTS idx_prop_addr_links_prop ON property_address_links(property_id);
                CREATE INDEX IF NOT EXISTS idx_prop_addr_links_addr ON property_address_links(address_id);
                CREATE INDEX IF NOT EXISTS idx_batch_records_batch ON import_batch_records(batch_id);
                CREATE INDEX IF NOT EXISTS idx_batch_records_hash ON import_batch_records(line_hash_sha256);
                CREATE INDEX IF NOT EXISTS idx_batch_records_prop ON import_batch_records(property_id);
                CREATE INDEX IF NOT EXISTS idx_audit_findings_prop ON audit_findings(property_id);
                CREATE INDEX IF NOT EXISTS idx_audit_findings_record ON audit_findings(batch_record_id);
                CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON audit_findings(analysis_status);
                CREATE INDEX IF NOT EXISTS idx_proposals_prop ON correction_proposals(property_id);
                CREATE INDEX IF NOT EXISTS idx_proposals_status ON correction_proposals(status);
                CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);

                INSERT INTO schema_migrations (version, applied_at)
                VALUES (1, datetime('now'));
                ",
            )?;
            current_version = 1;
        }

        // Migração 2: Suporte a modos de importação (PILOT vs FULL), rastreamento de retomada e índice composto
        if current_version < 2 {
            tx.execute_batch(
                "
                -- Adiciona colunas para controle explícito de modo e retomada em import_batches
                ALTER TABLE import_batches ADD COLUMN import_mode TEXT NOT NULL DEFAULT 'FULL';
                ALTER TABLE import_batches ADD COLUMN last_processed_row INTEGER NOT NULL DEFAULT 0;

                -- Índice para busca rápida e unívoca de identificadores por origem e valor normalizado
                CREATE INDEX IF NOT EXISTS idx_prop_ident_source_norm 
                ON property_identifiers(issuer_or_source, normalized_value);

                INSERT INTO schema_migrations (version, applied_at)
                VALUES (2, datetime('now'));
                ",
            )?;
            current_version = 2;
        }

        // Migração 3: Índices compostos de alta performance para importação e auditoria em escala (100k+ registros)
        if current_version < 3 {
            tx.execute_batch(
                "
                -- Otimização crítica: busca imediata de titular declarado por imóvel sem scan de tipo
                CREATE INDEX IF NOT EXISTS idx_prop_ident_prop_type 
                ON property_identifiers(property_id, identifier_type);

                -- Otimização: verificação rápida de hash de endereço normalizado
                CREATE INDEX IF NOT EXISTS idx_addresses_norm_hash 
                ON addresses(normalized_hash);

                -- Otimização: link composto imóvel-endereço
                CREATE INDEX IF NOT EXISTS idx_prop_addr_links_prop_addr 
                ON property_address_links(property_id, address_id);

                -- Otimização: consulta de proveniência na retomada de lotes
                CREATE INDEX IF NOT EXISTS idx_batch_records_origin_lookup 
                ON import_batch_records(batch_id, sheet_name, row_number, line_hash_sha256);

                INSERT INTO schema_migrations (version, applied_at)
                VALUES (3, datetime('now'));
                ",
            )?;
        }

        tx.commit()?;
        Ok(())
    }
}
