use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

use super::local_database::StorageError;

/// Estatísticas do banco cadastral imobiliário local
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RealEstateStats {
    pub total_properties: u64,
    pub total_identifiers: u64,
    pub total_addresses: u64,
    pub total_batches: u64,
    pub total_batch_records: u64,
    pub open_findings_count: u64,
    pub pending_proposals_count: u64,
    pub db_path: String,
}

/// Resumo de lote de importação
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportBatchSummary {
    pub id: i64,
    pub source_filename: String,
    pub source_hash_sha256: String,
    pub source_file_size: i64,
    pub sheet_name: String,
    pub import_mode: String,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub status: String,
    pub total_rows_read: i64,
    pub total_records_imported: i64,
    pub total_inconsistencies_detected: i64,
    pub last_processed_row: i64,
    pub metadata_json: Option<String>,
}

/// Resumo de inconsistência de auditoria
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditFindingSummary {
    pub id: i64,
    pub property_id: Option<i64>,
    pub batch_record_id: Option<i64>,
    pub category: String,
    pub severity: String,
    pub source: String,
    pub description: String,
    pub analysis_status: String,
    pub created_at: String,
}

/// Resumo de imóvel cadastrado
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertySummary {
    pub id: i64,
    pub uuid: String,
    pub identifier: Option<String>,
    pub identifier_type: Option<String>,
    pub address: Option<String>,
    pub created_at: String,
}

/// Banco de dados local SQLite dedicado exclusivamente ao Cadastro Imobiliário (DevOS Cockpit)
pub struct RealEstateDatabase {
    db_path: PathBuf,
}

impl RealEstateDatabase {
    pub fn new(base_dir: PathBuf) -> Self {
        let db_path = base_dir.join("real_estate.sqlite");
        Self { db_path }
    }

    pub fn db_path(&self) -> &PathBuf {
        &self.db_path
    }

    /// Configura o modo WAL uma única vez na inicialização/migração da base
    pub fn init_wal(&self) -> Result<(), StorageError> {
        if let Some(parent) = self.db_path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)?;
            }
        }
        let conn = Connection::open(&self.db_path)?;
        conn.execute_batch("PRAGMA journal_mode = WAL;")?;
        Ok(())
    }

    /// Abre conexão com o banco cadastral local com foreign keys ativas e timeout de concorrência
    pub fn get_connection(&self) -> Result<Connection, StorageError> {
        if let Some(parent) = self.db_path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)?;
            }
        }
        let conn = Connection::open(&self.db_path)?;
        conn.execute_batch(
            "PRAGMA foreign_keys = ON;
             PRAGMA busy_timeout = 5000;",
        )?;
        Ok(conn)
    }

    /// Retorna métricas consolidadas dos registros cadastrais
    pub fn get_stats(&self) -> Result<RealEstateStats, StorageError> {
        let conn = self.get_connection()?;

        let total_properties: u64 = conn
            .query_row("SELECT COUNT(*) FROM properties", [], |r| r.get(0))
            .unwrap_or(0);

        let total_identifiers: u64 = conn
            .query_row("SELECT COUNT(*) FROM property_identifiers", [], |r| {
                r.get(0)
            })
            .unwrap_or(0);

        let total_addresses: u64 = conn
            .query_row("SELECT COUNT(*) FROM addresses", [], |r| r.get(0))
            .unwrap_or(0);

        let total_batches: u64 = conn
            .query_row("SELECT COUNT(*) FROM import_batches", [], |r| r.get(0))
            .unwrap_or(0);

        let total_batch_records: u64 = conn
            .query_row("SELECT COUNT(*) FROM import_batch_records", [], |r| {
                r.get(0)
            })
            .unwrap_or(0);

        let open_findings_count: u64 = conn
            .query_row(
                "SELECT COUNT(*) FROM audit_findings WHERE analysis_status IN ('OPEN', 'INVESTIGATING')",
                [],
                |r| r.get(0)
            )
            .unwrap_or(0);

        let pending_proposals_count: u64 = conn
            .query_row(
                "SELECT COUNT(*) FROM correction_proposals WHERE status IN ('PROPOSED', 'UNDER_REVIEW')",
                [],
                |r| r.get(0)
            )
            .unwrap_or(0);

        Ok(RealEstateStats {
            total_properties,
            total_identifiers,
            total_addresses,
            total_batches,
            total_batch_records,
            open_findings_count,
            pending_proposals_count,
            db_path: self.db_path.to_string_lossy().to_string(),
        })
    }

    /// Localiza lote anterior mais recente pelo hash SHA-256 do arquivo fonte
    pub fn find_batch_by_hash(
        &self,
        sha256: &str,
    ) -> Result<Option<ImportBatchSummary>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, source_filename, source_hash_sha256, source_file_size, sheet_name, import_mode, started_at, completed_at, status, total_rows_read, total_records_imported, total_inconsistencies_detected, last_processed_row, metadata_json
             FROM import_batches
             WHERE source_hash_sha256 = ?1
             ORDER BY id DESC LIMIT 1"
        )?;

        let batch = stmt.query_row([sha256], |row| {
            Ok(ImportBatchSummary {
                id: row.get(0)?,
                source_filename: row.get(1)?,
                source_hash_sha256: row.get(2)?,
                source_file_size: row.get(3)?,
                sheet_name: row.get(4)?,
                import_mode: row.get(5)?,
                started_at: row.get(6)?,
                completed_at: row.get(7)?,
                status: row.get(8)?,
                total_rows_read: row.get(9)?,
                total_records_imported: row.get(10)?,
                total_inconsistencies_detected: row.get(11)?,
                last_processed_row: row.get(12)?,
                metadata_json: row.get(13)?,
            })
        });

        match batch {
            Ok(b) => Ok(Some(b)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(StorageError::Sqlite(e)),
        }
    }

    /// Localiza lote previamente concluído para este mesmo arquivo, aba, modo específico (PILOT vs FULL) e limite solicitado (se PILOT)
    pub fn find_completed_batch(
        &self,
        sha256: &str,
        sheet_name: &str,
        mode: &str,
        requested_row_limit: Option<usize>,
    ) -> Result<Option<ImportBatchSummary>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, source_filename, source_hash_sha256, source_file_size, sheet_name, import_mode, started_at, completed_at, status, total_rows_read, total_records_imported, total_inconsistencies_detected, last_processed_row, metadata_json
             FROM import_batches
             WHERE source_hash_sha256 = ?1 AND sheet_name = ?2 AND import_mode = ?3 AND status IN ('COMPLETED', 'COMPLETED_WITH_WARNINGS', 'COMPLETED_WITH_REJECTIONS', 'PILOT_COMPLETED')
             ORDER BY id DESC"
        )?;

        let batches = stmt.query_map(rusqlite::params![sha256, sheet_name, mode], |row| {
            Ok(ImportBatchSummary {
                id: row.get(0)?,
                source_filename: row.get(1)?,
                source_hash_sha256: row.get(2)?,
                source_file_size: row.get(3)?,
                sheet_name: row.get(4)?,
                import_mode: row.get(5)?,
                started_at: row.get(6)?,
                completed_at: row.get(7)?,
                status: row.get(8)?,
                total_rows_read: row.get(9)?,
                total_records_imported: row.get(10)?,
                total_inconsistencies_detected: row.get(11)?,
                last_processed_row: row.get(12)?,
                metadata_json: row.get(13)?,
            })
        })?;

        for batch_res in batches {
            let batch = batch_res.map_err(StorageError::Sqlite)?;
            if mode == "PILOT" {
                let prev_limit = batch
                    .metadata_json
                    .as_deref()
                    .and_then(|m| serde_json::from_str::<serde_json::Value>(m).ok())
                    .and_then(|v| v.get("requested_row_limit").and_then(|l| l.as_u64()))
                    .map(|l| l as usize)
                    .or(Some(batch.total_records_imported as usize));

                if prev_limit == requested_row_limit {
                    return Ok(Some(batch));
                }
            } else {
                return Ok(Some(batch));
            }
        }

        Ok(None)
    }

    /// Localiza lote interrompido para retomada segura com estrita compatibilidade de modo (IN_PROGRESS ou PARTIAL)
    pub fn find_resumable_batch(
        &self,
        sha256: &str,
        sheet_name: &str,
        import_mode: &str,
    ) -> Result<Option<ImportBatchSummary>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, source_filename, source_hash_sha256, source_file_size, sheet_name, import_mode, started_at, completed_at, status, total_rows_read, total_records_imported, total_inconsistencies_detected, last_processed_row, metadata_json
             FROM import_batches
             WHERE source_hash_sha256 = ?1 AND sheet_name = ?2 AND import_mode = ?3 AND status IN ('IN_PROGRESS', 'PARTIAL')
             ORDER BY id DESC LIMIT 1"
        )?;

        let batch = stmt.query_row(rusqlite::params![sha256, sheet_name, import_mode], |row| {
            Ok(ImportBatchSummary {
                id: row.get(0)?,
                source_filename: row.get(1)?,
                source_hash_sha256: row.get(2)?,
                source_file_size: row.get(3)?,
                sheet_name: row.get(4)?,
                import_mode: row.get(5)?,
                started_at: row.get(6)?,
                completed_at: row.get(7)?,
                status: row.get(8)?,
                total_rows_read: row.get(9)?,
                total_records_imported: row.get(10)?,
                total_inconsistencies_detected: row.get(11)?,
                last_processed_row: row.get(12)?,
                metadata_json: row.get(13)?,
            })
        });

        match batch {
            Ok(b) => Ok(Some(b)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(StorageError::Sqlite(e)),
        }
    }

    /// Busca imóvel previamente cadastrado com base no identificador de origem (ex: Matrícula da planilha Mapa5)
    pub fn find_property_by_source_identifier(
        &self,
        source: &str,
        normalized_value: &str,
    ) -> Result<Option<i64>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT property_id FROM property_identifiers
             WHERE issuer_or_source = ?1 AND normalized_value = ?2
             LIMIT 1",
        )?;

        let res = stmt.query_row(rusqlite::params![source, normalized_value], |row| {
            row.get(0)
        });
        match res {
            Ok(id) => Ok(Some(id)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(StorageError::Sqlite(e)),
        }
    }

    /// Lista os últimos lotes de importação
    pub fn list_batches(&self, limit: usize) -> Result<Vec<ImportBatchSummary>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, source_filename, source_hash_sha256, source_file_size, sheet_name, import_mode, started_at, completed_at, status, total_rows_read, total_records_imported, total_inconsistencies_detected, last_processed_row, metadata_json
             FROM import_batches
             ORDER BY id DESC LIMIT ?1"
        )?;

        let batch_iter = stmt.query_map([limit as i64], |row| {
            Ok(ImportBatchSummary {
                id: row.get(0)?,
                source_filename: row.get(1)?,
                source_hash_sha256: row.get(2)?,
                source_file_size: row.get(3)?,
                sheet_name: row.get(4)?,
                import_mode: row.get(5)?,
                started_at: row.get(6)?,
                completed_at: row.get(7)?,
                status: row.get(8)?,
                total_rows_read: row.get(9)?,
                total_records_imported: row.get(10)?,
                total_inconsistencies_detected: row.get(11)?,
                last_processed_row: row.get(12)?,
                metadata_json: row.get(13)?,
            })
        })?;

        let mut batches = Vec::new();
        for b in batch_iter {
            batches.push(b?);
        }
        Ok(batches)
    }

    /// Lista as inconsistências de auditoria mais recentes
    pub fn list_findings(&self, limit: usize) -> Result<Vec<AuditFindingSummary>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, property_id, batch_record_id, category, severity, source, description, analysis_status, created_at
             FROM audit_findings
             ORDER BY id DESC LIMIT ?1"
        )?;

        let finding_iter = stmt.query_map([limit as i64], |row| {
            Ok(AuditFindingSummary {
                id: row.get(0)?,
                property_id: row.get(1)?,
                batch_record_id: row.get(2)?,
                category: row.get(3)?,
                severity: row.get(4)?,
                source: row.get(5)?,
                description: row.get(6)?,
                analysis_status: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?;

        let mut findings = Vec::new();
        for f in finding_iter {
            findings.push(f?);
        }
        Ok(findings)
    }

    /// Lista amostra de imóveis cadastrados
    pub fn list_properties(&self, limit: usize) -> Result<Vec<PropertySummary>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT p.id, p.uuid, i.raw_value, i.identifier_type, a.raw_address, p.created_at
             FROM properties p
             LEFT JOIN property_identifiers i ON i.property_id = p.id
             LEFT JOIN property_address_links pal ON pal.property_id = p.id AND pal.is_primary = 1
             LEFT JOIN addresses a ON a.id = pal.address_id
             GROUP BY p.id
             ORDER BY p.id DESC LIMIT ?1",
        )?;

        let prop_iter = stmt.query_map([limit as i64], |row| {
            Ok(PropertySummary {
                id: row.get(0)?,
                uuid: row.get(1)?,
                identifier: row.get(2)?,
                identifier_type: row.get(3)?,
                address: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;

        let mut props = Vec::new();
        for p in prop_iter {
            props.push(p?);
        }
        Ok(props)
    }

    /// Realiza backup seguro e atômico do banco cadastral com WAL checkpoint
    pub fn export_backup(&self, destination_path: &Path) -> Result<u64, StorageError> {
        let conn = self.get_connection()?;
        conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")?;

        if destination_path.exists() {
            let _ = fs::remove_file(destination_path);
        }

        let dest_str = destination_path.to_string_lossy();
        conn.execute("VACUUM INTO ?1;", [&*dest_str])?;

        let metadata = fs::metadata(destination_path)?;
        Ok(metadata.len())
    }

    /// Restaura backup cadastral verificando integridade
    pub fn restore_backup(&self, source_path: &Path) -> Result<(), StorageError> {
        if !source_path.exists() {
            return Err(StorageError::NotFound(format!(
                "Arquivo de backup não encontrado: {:?}",
                source_path
            )));
        }

        if let Some(parent) = self.db_path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)?;
            }
        }

        let wal_path = self.db_path.with_extension("sqlite-wal");
        let shm_path = self.db_path.with_extension("sqlite-shm");
        let _ = fs::remove_file(&wal_path);
        let _ = fs::remove_file(&shm_path);

        fs::copy(source_path, &self.db_path)?;

        let conn = self.get_connection()?;
        conn.query_row("PRAGMA quick_check;", [], |_| Ok(()))?;
        Ok(())
    }
}
