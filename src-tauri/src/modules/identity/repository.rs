//! Repositório de persistência SQLite para Perfil e Identidade Civil.
//!
//! Apenas o envelope criptográfico (AEAD AES-256-GCM) é persistido no banco local.
//! Nenhum dado pessoal em claro é armazenado em tabelas, colunas ou índices.

use rusqlite::{Connection, OptionalExtension, params};

use crate::storage::local_database::StorageError;

pub struct StoredProfileRecord {
    pub raw_envelope: String,
    pub payload_version: u32,
    pub revision: u64,
    pub created_at: String,
    pub updated_at: String,
}

pub struct IdentityRepository;

impl IdentityRepository {
    /// Carrega o registro criptografado único do usuário (id = 1).
    pub fn get_profile_record(
        conn: &Connection,
    ) -> Result<Option<StoredProfileRecord>, StorageError> {
        let result = conn
            .query_row(
                "SELECT encrypted_envelope, payload_version, revision, created_at, updated_at
                 FROM user_profiles
                 WHERE id = 1",
                [],
                |row| {
                    let raw_envelope: String = row.get(0)?;
                    let payload_version: u32 = row.get(1)?;
                    let revision: u64 = row.get(2)?;
                    let created_at: String = row.get(3)?;
                    let updated_at: String = row.get(4)?;

                    Ok(StoredProfileRecord {
                        raw_envelope,
                        payload_version,
                        revision,
                        created_at,
                        updated_at,
                    })
                },
            )
            .optional()?;

        Ok(result)
    }

    /// Salva ou atualiza atomicamente o envelope criptografado com verificação de concorrência otimista.
    pub fn save_profile_record(
        conn: &mut Connection,
        envelope_json: &str,
        expected_revision: Option<u64>,
    ) -> Result<u64, StorageError> {
        let tx = conn.transaction()?;

        let current_revision: Option<u64> = tx
            .query_row(
                "SELECT revision FROM user_profiles WHERE id = 1",
                [],
                |row| row.get(0),
            )
            .optional()?;

        if let (Some(expected), Some(current)) = (expected_revision, current_revision) {
            if expected != current {
                return Err(StorageError::InvalidData(format!(
                    "CONCURRENCY_CONFLICT: O perfil foi atualizado concorrentemente (revisão atual: {}, informada: {}).",
                    current, expected
                )));
            }
        }

        let next_revision = current_revision.unwrap_or(0) + 1;

        tx.execute(
            "INSERT INTO user_profiles (id, encrypted_envelope, payload_version, revision, created_at, updated_at)
             VALUES (1, ?1, 1, ?2, datetime('now'), datetime('now'))
             ON CONFLICT(id) DO UPDATE SET
                 encrypted_envelope = excluded.encrypted_envelope,
                 payload_version = excluded.payload_version,
                 revision = excluded.revision,
                 updated_at = datetime('now')",
            params![envelope_json, next_revision],
        )?;

        tx.commit()?;

        Ok(next_revision)
    }
}
