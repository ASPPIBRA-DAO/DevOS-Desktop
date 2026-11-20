//! Módulo de Identidade Auto-Soberana (SSI) do DevOS Desktop.
//!
//! Implementação normativa aderente às especificações W3C:
//! - W3C did:key Ed25519 (Multicodec 0xed01 + Base58BTC)
//! - SLIP-0010 Derivação Hardened (m/7391'/0'/0'/0')
//! - Isolamento estrito de memória com trait Zeroize

pub mod did;
pub mod keys;
pub mod repository;
pub mod vault_integration;

pub use did::*;
pub use keys::*;
pub use repository::*;
pub use vault_integration::*;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum SsiError {
    #[error("Erro de derivação SLIP-0010: {0}")]
    Slip10(#[from] keys::Slip10Error),

    #[error("Erro de codificação W3C did:key: {0}")]
    DidKey(#[from] did::DidKeyError),
}

/// Deriva de forma determinística o W3C did:key oficial do Holder a partir de sua semente BIP-39.
pub fn derive_holder_did_from_seed(seed: &[u8]) -> Result<String, SsiError> {
    let extended_key = keys::derive_holder_ssi_key(seed)?;
    let public_key = extended_key.public_key()?;
    Ok(did::encode_did_key(&public_key))
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup_in_memory_db() -> Connection {
        let conn = Connection::open_in_memory().expect("open in-memory db");
        conn.execute_batch(
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
            ON local_dids(is_primary) WHERE is_primary = 1;",
        )
        .expect("create schema");
        conn
    }

    #[test]
    fn test_end_to_end_seed_to_did_key() {
        // Semente arbitrária de 64 bytes
        let seed = [7u8; 64];
        let did = derive_holder_did_from_seed(&seed).expect("did derivation");

        // Deve ser um did:key canônico válido iniciando com prefixo Ed25519
        assert!(did.starts_with("did:key:z6Mk"));

        // Deve ser reversível e decodificável
        let decoded_pub = did::decode_did_key(&did).expect("decode");
        assert_eq!(decoded_pub.len(), 32);

        // Determinismo: mesma semente produz exatamente o mesmo DID
        let did_again = derive_holder_did_from_seed(&seed).expect("did derivation 2");
        assert_eq!(did, did_again);
    }

    #[test]
    fn test_vault_integration_lifecycle() {
        let mut conn = setup_in_memory_db();
        let seed_alice = [0x42u8; 64];

        // 1. Inicializa primeira identidade primária
        let record = SsiVaultService::initialize_or_verify_primary_identity(&mut conn, &seed_alice)
            .expect("initialization must succeed");

        assert!(record.is_primary);
        assert_eq!(record.method, "key");
        assert_eq!(record.derivation_scheme, "SLIP-0010");
        assert_eq!(record.derivation_path, "m/7391'/0'/0'/0'");
        assert_eq!(record.key_version, 1);
        assert!(record.did.starts_with("did:key:z6Mk"));

        // 2. Consulta pública (sem semente)
        let public_record = SsiVaultService::get_public_primary_identity(&conn)
            .expect("query public")
            .expect("must exist");
        assert_eq!(public_record.did, record.did);
        assert_eq!(public_record.public_key, record.public_key);

        // 3. Re-inicialização com a MESMA semente (deve verificar e aprovar sem duplicar)
        let verified =
            SsiVaultService::initialize_or_verify_primary_identity(&mut conn, &seed_alice)
                .expect("verification with same seed must succeed");
        assert_eq!(verified.did, record.did);

        // 4. Reconstrução e verificação explícita
        let recon = SsiVaultService::reconstruct_and_verify(&conn, &seed_alice)
            .expect("reconstruct must succeed");
        assert_eq!(recon.did, record.did);

        // 5. Teste Fail-Closed: tentativa com semente DIFERENTE deve falhar com IntegrityMismatch
        let seed_bob = [0x99u8; 64];
        let mismatch_result =
            SsiVaultService::initialize_or_verify_primary_identity(&mut conn, &seed_bob);
        match mismatch_result {
            Err(SsiVaultError::IntegrityMismatch {
                expected_did,
                stored_did,
            }) => {
                assert_eq!(stored_did, record.did);
                assert_ne!(expected_did, record.did);
            }
            other => panic!("Expected IntegrityMismatch, got: {:?}", other),
        }

        let mismatch_recon = SsiVaultService::reconstruct_and_verify(&conn, &seed_bob);
        assert!(matches!(
            mismatch_recon,
            Err(SsiVaultError::IntegrityMismatch { .. })
        ));
    }

    #[test]
    fn test_unique_primary_constraint() {
        let conn = setup_in_memory_db();
        let pubkey_1 = [1u8; 32];
        let pubkey_2 = [2u8; 32];

        let rec1 = LocalDidRecord {
            did: "did:key:z6MkSample1".to_string(),
            method: "key".to_string(),
            public_key: pubkey_1,
            derivation_scheme: "SLIP-0010".to_string(),
            derivation_path: "m/7391'/0'/0'/0'".to_string(),
            key_version: 1,
            is_primary: true,
            created_at: 1000,
        };

        SsiRepository::save_did(&conn, &rec1).expect("first primary saves");

        // Tentativa de salvar segundo registro com is_primary = true deve ser barrada pelo índice parcial
        let rec2 = LocalDidRecord {
            did: "did:key:z6MkSample2".to_string(),
            method: "key".to_string(),
            public_key: pubkey_2,
            derivation_scheme: "SLIP-0010".to_string(),
            derivation_path: "m/7391'/0'/0'/1'".to_string(),
            key_version: 1,
            is_primary: true,
            created_at: 1001,
        };

        let err = SsiRepository::save_did(&conn, &rec2).unwrap_err();
        match err {
            SsiStorageError::PrimaryDidAlreadyExists(_) => {}
            other => panic!("Expected PrimaryDidAlreadyExists, got {:?}", other),
        }

        // Se is_primary = false, deve permitir salvar com chave pública diferente
        let mut rec2_secondary = rec2.clone();
        rec2_secondary.is_primary = false;
        SsiRepository::save_did(&conn, &rec2_secondary).expect("secondary saves fine");

        let all = SsiRepository::list_dids(&conn).expect("list");
        assert_eq!(all.len(), 2);
    }

    #[test]
    fn test_unique_public_key_constraint() {
        let conn = setup_in_memory_db();
        let pubkey = [3u8; 32];

        let rec1 = LocalDidRecord {
            did: "did:key:z6MkSamplePub1".to_string(),
            method: "key".to_string(),
            public_key: pubkey,
            derivation_scheme: "SLIP-0010".to_string(),
            derivation_path: "m/7391'/0'/0'/0'".to_string(),
            key_version: 1,
            is_primary: false,
            created_at: 1000,
        };
        SsiRepository::save_did(&conn, &rec1).expect("first saves");

        let rec2 = LocalDidRecord {
            did: "did:key:z6MkSamplePub2".to_string(),
            method: "key".to_string(),
            public_key: pubkey, // Mesma chave pública
            derivation_scheme: "SLIP-0010".to_string(),
            derivation_path: "m/7391'/0'/0'/1'".to_string(),
            key_version: 1,
            is_primary: false,
            created_at: 1001,
        };

        let err = SsiRepository::save_did(&conn, &rec2).unwrap_err();
        assert!(matches!(err, SsiStorageError::DuplicatePublicKey));
    }
}
