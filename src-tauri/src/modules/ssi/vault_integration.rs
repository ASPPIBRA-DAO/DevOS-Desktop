//! Serviço de integração segura entre o Vault e a Identidade SSI do Holder.
//!
//! Responsabilidade:
//! - Derivar o DID a partir da semente BIP-39 (SLIP-0010).
//! - Persistir apenas metadados e chave pública de 32 bytes no devos_vault.sqlite.
//! - Validar a integridade criptográfica após reinicializações (Fail-Closed).
//! - Rejeitar silenciosamente qualquer divergência entre semente e registro local.

use rusqlite::Connection;
use thiserror::Error;
use zeroize::Zeroizing;

use crate::modules::vault::encryption::{
    AadDomain, AeadEnvelope, Subkeys, VaultCrypto, VaultCryptoError,
};

use super::SsiError;
use super::did;
use super::keys;
use super::repository::{LocalDidRecord, SsiRepository, SsiStorageError};

#[derive(Debug, Error)]
pub enum SsiVaultError {
    #[error("O cofre do DevOS está bloqueado. Desbloqueio com senha mestre necessário.")]
    VaultLocked,

    #[error("Erro no repositório SSI SQLite: {0}")]
    Storage(#[from] SsiStorageError),

    #[error("Erro de derivação criptográfica SSI: {0}")]
    Crypto(#[from] SsiError),

    #[error("Erro criptográfico do cofre: {0}")]
    VaultCrypto(#[from] VaultCryptoError),

    #[error(
        "Violação de Integridade Criptográfica: O DID derivado da semente ({expected_did}) não corresponde ao registro persistido no banco ({stored_did})"
    )]
    IntegrityMismatch {
        expected_did: String,
        stored_did: String,
    },

    #[error("Identidade soberana primária não encontrada no cofre")]
    PrimaryIdentityNotFound,
}

pub struct SsiVaultService;

impl SsiVaultService {
    /// Inicializa a identidade soberana primária do holder a partir da semente BIP-39 desbloqueada,
    /// ou verifica com rigor se o registro persistido confere com a semente fornecida.
    ///
    /// Regra de Segurança:
    /// Se a identidade já existir, o método NUNCA a sobrescreve silenciosamente.
    /// Em caso de divergência criptográfica, retorna `SsiVaultError::IntegrityMismatch`.
    pub fn initialize_or_verify_primary_identity(
        conn: &mut Connection,
        seed: &[u8],
    ) -> Result<LocalDidRecord, SsiVaultError> {
        // 1. Derivação determinística no caminho SLIP-0010 m/7391'/0'/0'/0'
        let ssi_key = keys::derive_holder_ssi_key(seed).map_err(SsiError::Slip10)?;
        let public_key = ssi_key.public_key().map_err(SsiError::Slip10)?;
        let expected_did = did::encode_did_key(&public_key);

        // 2. Consulta o registro persistido atual
        let existing = SsiRepository::get_primary_did(conn)?;

        if let Some(record) = existing {
            // Verificação rigorosa de integridade
            if record.did != expected_did || record.public_key != public_key {
                return Err(SsiVaultError::IntegrityMismatch {
                    expected_did,
                    stored_did: record.did,
                });
            }

            Ok(record)
        } else {
            // 3. Primeira inicialização: persiste o DID primário
            let now = chrono::Utc::now().timestamp();
            let new_record = LocalDidRecord {
                did: expected_did,
                method: "key".to_string(),
                public_key,
                derivation_scheme: "SLIP-0010".to_string(),
                derivation_path: "m/7391'/0'/0'/0'".to_string(),
                key_version: 1,
                is_primary: true,
                created_at: now,
            };

            SsiRepository::save_did(conn, &new_record)?;
            Ok(new_record)
        }
    }

    /// Reconstrói a identidade a partir da semente e valida contra o cofre SQLite.
    pub fn reconstruct_and_verify(
        conn: &Connection,
        seed: &[u8],
    ) -> Result<LocalDidRecord, SsiVaultError> {
        let ssi_key = keys::derive_holder_ssi_key(seed).map_err(SsiError::Slip10)?;
        let public_key = ssi_key.public_key().map_err(SsiError::Slip10)?;
        let expected_did = did::encode_did_key(&public_key);

        let stored =
            SsiRepository::get_primary_did(conn)?.ok_or(SsiVaultError::PrimaryIdentityNotFound)?;

        if stored.did != expected_did || stored.public_key != public_key {
            return Err(SsiVaultError::IntegrityMismatch {
                expected_did,
                stored_did: stored.did,
            });
        }

        Ok(stored)
    }

    /// Consulta pública dos metadados da identidade primária (não requer semente nem desbloqueio).
    pub fn get_public_primary_identity(
        conn: &Connection,
    ) -> Result<Option<LocalDidRecord>, SsiVaultError> {
        let record = SsiRepository::get_primary_did(conn)?;
        Ok(record)
    }

    /// Cifra o segredo raiz SSI utilizando a subchave de domínio DEVOS/SSI/V2 e AAD canônico.
    /// Respeita a fronteira estrita de custódia: a DEK mestre nunca é exposta fora do cofre.
    pub fn seal_ssi_root_secret(
        dek: &[u8; 32],
        ssi_vault_id: &str,
        secret_bytes: &[u8],
    ) -> Result<AeadEnvelope, SsiVaultError> {
        let subkey = Subkeys::derive_ssi_key(dek);
        let aad = AadDomain::SsiRootSecret { ssi_vault_id }.to_canonical_bytes();
        let envelope = VaultCrypto::encrypt_with_aead(&subkey, secret_bytes, &aad)?;
        Ok(envelope)
    }

    /// Decifra o segredo raiz SSI utilizando a subchave de domínio DEVOS/SSI/V2 e AAD canônico.
    pub fn unseal_ssi_root_secret(
        dek: &[u8; 32],
        ssi_vault_id: &str,
        envelope: &AeadEnvelope,
    ) -> Result<Zeroizing<Vec<u8>>, SsiVaultError> {
        let subkey = Subkeys::derive_ssi_key(dek);
        let aad = AadDomain::SsiRootSecret { ssi_vault_id }.to_canonical_bytes();
        let decrypted = VaultCrypto::decrypt_with_aead(&subkey, envelope, &aad)?;
        Ok(decrypted)
    }

    /// Cifra uma credencial verificável emitida/recebida utilizando a subchave DEVOS/SSI/V2 e AAD canônico.
    pub fn seal_ssi_credential(
        dek: &[u8; 32],
        credential_id: &str,
        cred_bytes: &[u8],
    ) -> Result<AeadEnvelope, SsiVaultError> {
        let subkey = Subkeys::derive_ssi_key(dek);
        let aad = AadDomain::SsiCredential { credential_id }.to_canonical_bytes();
        let envelope = VaultCrypto::encrypt_with_aead(&subkey, cred_bytes, &aad)?;
        Ok(envelope)
    }

    /// Decifra uma credencial verificável utilizando a subchave DEVOS/SSI/V2 e AAD canônico.
    pub fn unseal_ssi_credential(
        dek: &[u8; 32],
        credential_id: &str,
        envelope: &AeadEnvelope,
    ) -> Result<Zeroizing<Vec<u8>>, SsiVaultError> {
        let subkey = Subkeys::derive_ssi_key(dek);
        let aad = AadDomain::SsiCredential { credential_id }.to_canonical_bytes();
        let decrypted = VaultCrypto::decrypt_with_aead(&subkey, envelope, &aad)?;
        Ok(decrypted)
    }

    /// Gera entropia de 64 bytes para semente raiz SSI completamente independente da seed Web3 (ADR-001 §2.1).
    pub fn generate_independent_ssi_root_entropy() -> [u8; 64] {
        use rand::RngCore;
        let mut entropy = [0u8; 64];
        rand::rngs::OsRng.fill_bytes(&mut entropy);
        entropy
    }

    /// Assina um payload/declaração SSI com a chave Ed25519 derivada da raiz SSI segura.
    /// A chave privada e a semente residem exclusivamente em memória segura com Zeroize.
    pub fn sign_with_ssi_root(
        root_entropy: &[u8],
        payload: &[u8],
    ) -> Result<[u8; 64], SsiVaultError> {
        let ssi_key = keys::derive_holder_ssi_key(root_entropy).map_err(SsiError::Slip10)?;
        let signature = ssi_key.sign(payload).map_err(SsiError::Slip10)?;
        Ok(signature)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ssi_independent_root_entropy_lifecycle_and_isolated_signing() {
        use ring::signature::UnparsedPublicKey;

        // 1. Gera raiz SSI independente (não derivada da seed Web3)
        let ssi_root1 = SsiVaultService::generate_independent_ssi_root_entropy();
        let ssi_root2 = SsiVaultService::generate_independent_ssi_root_entropy();
        assert_ne!(ssi_root1, ssi_root2);

        // 2. Deriva chave pública Ed25519 e DID correspondente
        let key = keys::derive_holder_ssi_key(&ssi_root1).expect("Derivação da chave SSI");
        let pubkey = key.public_key().expect("Chave pública Ed25519");
        let did = did::encode_did_key(&pubkey);
        assert!(did.starts_with("did:key:z6Mk"));

        // 3. Assinatura de uma declaração de posse / credencial W3C
        let statement = b"DevOS Verifiable Presentation: Holder Alice Authorization Token";
        let signature =
            SsiVaultService::sign_with_ssi_root(&ssi_root1, statement).expect("Assinatura Ed25519");

        // 4. Validação da assinatura com a chave pública derivada
        let verifier = UnparsedPublicKey::new(&ring::signature::ED25519, pubkey.as_slice());
        assert!(verifier.verify(statement, signature.as_slice()).is_ok());

        // 5. Rejeição de adulteração do payload
        let tampered_statement = b"DevOS Verifiable Presentation: Holder ATTACKER Token";
        assert!(
            verifier
                .verify(tampered_statement, signature.as_slice())
                .is_err()
        );
    }

    #[test]
    fn test_ssi_v2_custody_sealing_unsealing_and_domain_binding() {
        let master_dek = [0x55u8; 32];
        let root_secret = b"bip39-seed-or-ed25519-entropy-64-bytes-devos-ssi-holder";
        let ssi_vault_id = "ssi_holder_root_primary";

        // 1. Cifragem com DEVOS/SSI/V2 e AAD canônico SsiRootSecret
        let envelope =
            SsiVaultService::seal_ssi_root_secret(&master_dek, ssi_vault_id, root_secret)
                .expect("Cifragem do segredo raiz SSI");
        assert_eq!(envelope.version, 2);
        assert_eq!(envelope.cipher, "AES-256-GCM");

        // 2. Decifragem autorizada
        let decrypted =
            SsiVaultService::unseal_ssi_root_secret(&master_dek, ssi_vault_id, &envelope)
                .expect("Decifragem deve ter sucesso");
        assert_eq!(decrypted.as_slice(), root_secret);

        // 3. Violação de integridade por AAD divergente (ssi_vault_id forjado)
        let aad_mismatch = SsiVaultService::unseal_ssi_root_secret(
            &master_dek,
            "ssi_attacker_vault_id",
            &envelope,
        );
        assert!(
            aad_mismatch.is_err(),
            "Decifragem com AAD divergente deve falhar"
        );

        // 4. Isolamento contra chaves de outros domínios
        let wallets_key = Subkeys::derive_wallets_key(&master_dek);
        let aad = AadDomain::SsiRootSecret { ssi_vault_id }.to_canonical_bytes();
        let wrong_domain = VaultCrypto::decrypt_with_aead(&wallets_key, &envelope, &aad);
        assert!(
            wrong_domain.is_err(),
            "Chave DEVOS/WALLETS/V2 não pode decifrar segredo SSI"
        );
    }

    #[test]
    fn test_ssi_v2_credential_sealing_and_verification() {
        let master_dek = [0x88u8; 32];
        let credential_json = br#"{"@context":["https://www.w3.org/2018/credentials/v1"],"type":["VerifiableCredential"],"credentialSubject":{"id":"did:key:z6Mk..."}}"#;
        let cred_id = "vc:devos:diploma:123";

        let env = SsiVaultService::seal_ssi_credential(&master_dek, cred_id, credential_json)
            .expect("Cifragem de credencial");
        let unsealed = SsiVaultService::unseal_ssi_credential(&master_dek, cred_id, &env)
            .expect("Decifragem de credencial");
        assert_eq!(unsealed.as_slice(), credential_json);

        // AAD divergente
        let fail =
            SsiVaultService::unseal_ssi_credential(&master_dek, "vc:devos:diploma:999", &env);
        assert!(fail.is_err());
    }
}
