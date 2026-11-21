//! Repositório de persistência SQLite para Perfil e Identidade Civil.
//!
//! Apenas o envelope criptográfico (AEAD AES-256-GCM) é persistido no banco local.
//! Nenhum dado pessoal em claro é armazenado em tabelas, colunas ou índices.

use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};

use crate::storage::local_database::StorageError;

pub const CONCURRENCY_CONFLICT_PREFIX: &str = "CONCURRENCY_CONFLICT";
const PROFILE_ROW_ID: i64 = 1;

#[derive(Debug)]
pub struct StoredProfileRecord {
    pub raw_envelope: String,
    pub payload_version: u32,
    pub revision: u64,
    #[allow(dead_code)]
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
                 WHERE id = ?1",
                params![PROFILE_ROW_ID],
                |row| {
                    Ok(StoredProfileRecord {
                        raw_envelope: row.get(0)?,
                        payload_version: row.get(1)?,
                        revision: row.get(2)?,
                        created_at: row.get(3)?,
                        updated_at: row.get(4)?,
                    })
                },
            )
            .optional()?;

        Ok(result)
    }

    /// Salva ou atualiza atomicamente o envelope criptografado com transação IMMEDIATE
    /// e verificação estrita de concorrência otimista.
    pub fn save_profile_record(
        conn: &mut Connection,
        envelope_json: &str,
        payload_version: u32,
        expected_revision: Option<u64>,
        timestamp_rfc3339: &str,
    ) -> Result<u64, StorageError> {
        let tx = conn.transaction_with_behavior(TransactionBehavior::Immediate)?;

        let current_revision: Option<u64> = tx
            .query_row(
                "SELECT revision FROM user_profiles WHERE id = ?1",
                params![PROFILE_ROW_ID],
                |row| row.get(0),
            )
            .optional()?;

        // Regra Inviolável de Concorrência Otimista:
        // 1. Se registro já existe, expected_revision é OBRIGATÓRIO e deve ser igual ao atual.
        // 2. Se registro não existe, expected_revision só pode ser None ou Some(0).
        match (current_revision, expected_revision) {
            (Some(current), Some(expected)) if current == expected => {}
            (Some(current), other) => {
                return Err(StorageError::InvalidData(format!(
                    "{}: O perfil foi atualizado concorrentemente (revisão atual: {}, informada: {:?}).",
                    CONCURRENCY_CONFLICT_PREFIX, current, other
                )));
            }
            (None, None) | (None, Some(0)) => {}
            (None, Some(expected)) => {
                return Err(StorageError::InvalidData(format!(
                    "{}: Nenhum perfil existente para a revisão esperada informada ({}).",
                    CONCURRENCY_CONFLICT_PREFIX, expected
                )));
            }
        }

        let next_revision = current_revision
            .unwrap_or(0)
            .checked_add(1)
            .ok_or_else(|| StorageError::InvalidData("Overflow de revisão do perfil.".to_string()))?;

        tx.execute(
            "INSERT INTO user_profiles (id, encrypted_envelope, payload_version, revision, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?5)
             ON CONFLICT(id) DO UPDATE SET
                 encrypted_envelope = excluded.encrypted_envelope,
                 payload_version = excluded.payload_version,
                 revision = excluded.revision,
                 updated_at = excluded.updated_at",
            params![
                PROFILE_ROW_ID,
                envelope_json,
                payload_version,
                next_revision,
                timestamp_rfc3339
            ],
        )?;

        tx.commit()?;

        Ok(next_revision)
    }
}
