//! Repositório de persistência SQLite para identidades W3C did:key no devos_vault.sqlite.
//!
//! Regra Fundamental de Segurança:
//! Apenas metadados e a chave pública de 32 bytes são persistidos.
//! NENHUMA semente BIP-39 ou chave privada é salva nesta tabela.

use rusqlite::{Connection, OptionalExtension, params};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum SsiStorageError {
    #[error("Erro no banco de dados SQLite: {0}")]
    Sqlite(#[from] rusqlite::Error),

    #[error("Já existe um DID primário cadastrado no sistema (DID existente: {0})")]
    PrimaryDidAlreadyExists(String),

    #[error("Chave pública já cadastrada para outro DID")]
    DuplicatePublicKey,

    #[error("Identidade DID não encontrada: {0}")]
    NotFound(String),

    #[error("Tamanho inválido para chave pública Ed25519 (esperado 32 bytes, recebido {0})")]
    InvalidPublicKeyLength(usize),

    #[error("Método DID inválido (esperado 'key', recebido '{0}')")]
    InvalidMethod(String),
}

/// Registro estruturado da identidade persistida no SQLite (tabela local_dids).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LocalDidRecord {
    pub did: String,
    pub method: String,
    pub public_key: [u8; 32],
    pub derivation_scheme: String,
    pub derivation_path: String,
    pub key_version: u32,
    pub is_primary: bool,
    pub created_at: i64,
}

pub struct SsiRepository;

impl SsiRepository {
    /// Insere ou atualiza um registro de DID na tabela local_dids.
    ///
    /// Se is_primary for verdadeiro e já existir outro registro com is_primary = 1,
    /// a operação falha respeitando o índice parcial de unicidade `idx_local_dids_single_primary`.
    pub fn save_did(conn: &Connection, record: &LocalDidRecord) -> Result<(), SsiStorageError> {
        if record.method != "key" {
            return Err(SsiStorageError::InvalidMethod(record.method.clone()));
        }
        if record.public_key.len() != 32 {
            return Err(SsiStorageError::InvalidPublicKeyLength(
                record.public_key.len(),
            ));
        }

        let is_primary_int = if record.is_primary { 1 } else { 0 };

        conn.execute(
            "INSERT INTO local_dids (
                did, method, public_key, derivation_scheme, derivation_path, 
                key_version, is_primary, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                record.did,
                record.method,
                record.public_key.as_slice(),
                record.derivation_scheme,
                record.derivation_path,
                record.key_version,
                is_primary_int,
                record.created_at,
            ],
        )
        .map_err(|err| match &err {
            rusqlite::Error::SqliteFailure(_sqlite_err, Some(msg)) => {
                if msg.contains("idx_local_dids_single_primary")
                    || msg.contains("local_dids.is_primary")
                {
                    SsiStorageError::PrimaryDidAlreadyExists(record.did.clone())
                } else if msg.contains("UNIQUE constraint failed: local_dids.public_key") {
                    SsiStorageError::DuplicatePublicKey
                } else {
                    SsiStorageError::Sqlite(err)
                }
            }
            _ => SsiStorageError::Sqlite(err),
        })?;

        Ok(())
    }

    /// Consulta a identidade primária do titular no banco SQLite.
    pub fn get_primary_did(conn: &Connection) -> Result<Option<LocalDidRecord>, SsiStorageError> {
        let mut stmt = conn.prepare(
            "SELECT did, method, public_key, derivation_scheme, derivation_path,
                    key_version, is_primary, created_at
             FROM local_dids
             WHERE is_primary = 1
             LIMIT 1",
        )?;

        let result = stmt.query_row([], Self::row_to_record).optional()?;

        Ok(result)
    }

    /// Consulta uma identidade pelo identificador did exato.
    pub fn get_did(
        conn: &Connection,
        did: &str,
    ) -> Result<Option<LocalDidRecord>, SsiStorageError> {
        let mut stmt = conn.prepare(
            "SELECT did, method, public_key, derivation_scheme, derivation_path,
                    key_version, is_primary, created_at
             FROM local_dids
             WHERE did = ?1",
        )?;

        let result = stmt
            .query_row(params![did], Self::row_to_record)
            .optional()?;

        Ok(result)
    }

    /// Lista todas as identidades registradas localmente.
    pub fn list_dids(conn: &Connection) -> Result<Vec<LocalDidRecord>, SsiStorageError> {
        let mut stmt = conn.prepare(
            "SELECT did, method, public_key, derivation_scheme, derivation_path,
                    key_version, is_primary, created_at
             FROM local_dids
             ORDER BY is_primary DESC, created_at ASC",
        )?;

        let rows = stmt.query_map([], Self::row_to_record)?;
        let mut list = Vec::new();
        for row in rows {
            list.push(row?);
        }

        Ok(list)
    }

    /// Altera atomicamente a identidade primária dentro de uma transação.
    pub fn set_primary_did(conn: &mut Connection, did: &str) -> Result<(), SsiStorageError> {
        let tx = conn.transaction()?;

        // 1. Confere se o DID alvo existe
        let exists: bool = tx.query_row(
            "SELECT EXISTS(SELECT 1 FROM local_dids WHERE did = ?1)",
            params![did],
            |row| row.get(0),
        )?;

        if !exists {
            return Err(SsiStorageError::NotFound(did.to_string()));
        }

        // 2. Remove primário anterior
        tx.execute(
            "UPDATE local_dids SET is_primary = 0 WHERE is_primary = 1",
            [],
        )?;

        // 3. Define novo primário
        tx.execute(
            "UPDATE local_dids SET is_primary = 1 WHERE did = ?1",
            params![did],
        )?;

        tx.commit()?;
        Ok(())
    }

    fn row_to_record(row: &rusqlite::Row) -> rusqlite::Result<LocalDidRecord> {
        let did: String = row.get(0)?;
        let method: String = row.get(1)?;
        let pubkey_bytes: Vec<u8> = row.get(2)?;
        let derivation_scheme: String = row.get(3)?;
        let derivation_path: String = row.get(4)?;
        let key_version: u32 = row.get(5)?;
        let is_primary_int: i32 = row.get(6)?;
        let created_at: i64 = row.get(7)?;

        let mut public_key = [0u8; 32];
        if pubkey_bytes.len() == 32 {
            public_key.copy_from_slice(&pubkey_bytes);
        } else {
            return Err(rusqlite::Error::FromSqlConversionFailure(
                2,
                rusqlite::types::Type::Blob,
                Box::new(std::io::Error::new(
                    std::io::ErrorKind::InvalidData,
                    "Invalid public key length",
                )),
            ));
        }

        Ok(LocalDidRecord {
            did,
            method,
            public_key,
            derivation_scheme,
            derivation_path,
            key_version,
            is_primary: is_primary_int == 1,
            created_at,
        })
    }
}
