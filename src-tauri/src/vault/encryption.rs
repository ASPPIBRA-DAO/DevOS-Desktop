use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use argon2::{Argon2, Algorithm, Version, Params};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, ZeroizeOnDrop};

#[derive(Debug, thiserror::Error)]
pub enum VaultCryptoError {
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    #[error("Decryption failed / Invalid password or corrupted payload")]
    DecryptionFailed,
    #[error("Hex decode error: {0}")]
    HexError(String),
    #[error("Serialization error: {0}")]
    SerializationError(String),
}

/// Envelope criptográfico versionado com proteção AEAD (AES-256-GCM + Argon2id)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EncryptedEnvelope {
    pub version: u32,
    pub kdf: String,
    pub cipher: String,
    pub salt_hex: String,
    pub nonce_hex: String,
    pub ciphertext_hex: String,
}

/// Chave criptográfica temporária protegida com Zeroize ao ser descartada da memória
#[derive(Zeroize, ZeroizeOnDrop)]
struct DerivedKey([u8; 32]);

pub struct VaultCrypto;

impl VaultCrypto {
    /// Deriva uma chave simétrica de 256 bits a partir da senha e do salt usando Argon2id
    fn derive_key(password: &str, salt: &[u8]) -> Result<DerivedKey, VaultCryptoError> {
        let params = Params::new(64 * 1024, 3, 1, Some(32))
            .map_err(|e| VaultCryptoError::EncryptionFailed(format!("Argon2 params: {}", e)))?;

        let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
        let mut key_bytes = [0u8; 32];

        argon2.hash_password_into(password.as_bytes(), salt, &mut key_bytes)
            .map_err(|e| VaultCryptoError::EncryptionFailed(format!("Argon2 KDF: {}", e)))?;

        Ok(DerivedKey(key_bytes))
    }

    /// Cifra dados sensíveis utilizando Argon2id + AES-256-GCM
    pub fn encrypt(password: &str, plaintext: &[u8]) -> Result<EncryptedEnvelope, VaultCryptoError> {
        let mut rng = rand::thread_rng();

        // Salt de 16 bytes para KDF
        let mut salt = [0u8; 16];
        rng.fill_bytes(&mut salt);

        // Nonce de 12 bytes (96 bits padrão para GCM)
        let mut nonce_bytes = [0u8; 12];
        rng.fill_bytes(&mut nonce_bytes);

        let derived_key = Self::derive_key(password, &salt)?;
        let cipher = Aes256Gcm::new_from_slice(&derived_key.0)
            .map_err(|e| VaultCryptoError::EncryptionFailed(e.to_string()))?;

        let nonce = Nonce::from_slice(&nonce_bytes);
        let ciphertext = cipher.encrypt(nonce, plaintext)
            .map_err(|e| VaultCryptoError::EncryptionFailed(e.to_string()))?;

        Ok(EncryptedEnvelope {
            version: 1,
            kdf: "Argon2id".to_string(),
            cipher: "AES-256-GCM".to_string(),
            salt_hex: hex::encode(salt),
            nonce_hex: hex::encode(nonce_bytes),
            ciphertext_hex: hex::encode(ciphertext),
        })
    }

    /// Decifra e autentica o envelope criptográfico. Falha caso a senha esteja incorreta ou os dados tenham sido alterados.
    pub fn decrypt(password: &str, envelope: &EncryptedEnvelope) -> Result<Vec<u8>, VaultCryptoError> {
        if envelope.version != 1 {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        let salt = hex::decode(&envelope.salt_hex)
            .map_err(|e| VaultCryptoError::HexError(e.to_string()))?;
        let nonce_bytes = hex::decode(&envelope.nonce_hex)
            .map_err(|e| VaultCryptoError::HexError(e.to_string()))?;
        let ciphertext = hex::decode(&envelope.ciphertext_hex)
            .map_err(|e| VaultCryptoError::HexError(e.to_string()))?;

        let derived_key = Self::derive_key(password, &salt)?;
        let cipher = Aes256Gcm::new_from_slice(&derived_key.0)
            .map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let nonce = Nonce::from_slice(&nonce_bytes);
        cipher.decrypt(nonce, ciphertext.as_ref())
            .map_err(|_| VaultCryptoError::DecryptionFailed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_encrypt_decrypt_success() {
        let secret = b"phrase: abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let password = "SuperMasterPasswordDevOS#2026";

        let envelope = VaultCrypto::encrypt(password, secret).expect("encriptação bem-sucedida");
        assert_eq!(envelope.version, 1);
        assert_eq!(envelope.cipher, "AES-256-GCM");
        assert_eq!(envelope.kdf, "Argon2id");

        let decrypted = VaultCrypto::decrypt(password, &envelope).expect("decriptação bem-sucedida");
        assert_eq!(decrypted, secret);
    }

    #[test]
    fn test_vault_rejects_incorrect_password() {
        let secret = b"sensitive_wallet_seed";
        let password = "CorrectPassword123";
        let wrong_password = "WrongPassword456";

        let envelope = VaultCrypto::encrypt(password, secret).expect("encriptação ok");
        let result = VaultCrypto::decrypt(wrong_password, &envelope);
        assert!(result.is_err(), "deve rejeitar senha incorreta");
    }

    #[test]
    fn test_vault_rejects_tampered_ciphertext() {
        let secret = b"sensitive_wallet_seed";
        let password = "CorrectPassword123";

        let mut envelope = VaultCrypto::encrypt(password, secret).expect("encriptação ok");
        // Altera o último byte do texto cifrado para simular violação de integridade
        let mut tampered_bytes = hex::decode(&envelope.ciphertext_hex).unwrap();
        let last = tampered_bytes.len() - 1;
        tampered_bytes[last] ^= 0xFF;
        envelope.ciphertext_hex = hex::encode(tampered_bytes);

        let result = VaultCrypto::decrypt(password, &envelope);
        assert!(result.is_err(), "deve rejeitar envelope adulterado por integridade AEAD");
    }
}
