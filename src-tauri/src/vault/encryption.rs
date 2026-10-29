use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use argon2::{Algorithm, Argon2, Params, Version};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, ZeroizeOnDrop};

// ----------------------------------------------------------------------
// Parâmetros criptográficos
// ----------------------------------------------------------------------

const ENVELOPE_VERSION: u32 = 1;

const KDF_NAME: &str = "Argon2id";
const CIPHER_NAME: &str = "AES-256-GCM";

const SALT_BYTES: usize = 16;
const NONCE_BYTES: usize = 12;
const KEY_BYTES: usize = 32;
const GCM_TAG_BYTES: usize = 16;

const ARGON2_MEMORY_KIB: u32 = 64 * 1024;
const ARGON2_ITERATIONS: u32 = 3;
const ARGON2_LANES: u32 = 1;

const MAX_PASSWORD_CHARS: usize = 128;
const MAX_PASSWORD_BYTES: usize = 512;

// Limite defensivo para envelopes que armazenam segredos de custódia e carteiras.
const MAX_PLAINTEXT_BYTES: usize = 16 * 1024 * 1024;
const MAX_CIPHERTEXT_BYTES: usize = MAX_PLAINTEXT_BYTES + GCM_TAG_BYTES;
const MAX_CIPHERTEXT_HEX_CHARS: usize = MAX_CIPHERTEXT_BYTES * 2;

// ----------------------------------------------------------------------
// Erros públicos
// ----------------------------------------------------------------------

#[derive(Debug, thiserror::Error)]
pub enum VaultCryptoError {
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),

    #[error("Decryption failed / Invalid password or corrupted payload")]
    DecryptionFailed,

    // Mantido para compatibilidade com consumidores existentes.
    #[error("Hex decode error: {0}")]
    HexError(String),

    // Mantido para compatibilidade com consumidores existentes.
    #[error("Serialization error: {0}")]
    SerializationError(String),
}

// ----------------------------------------------------------------------
// Envelope criptográfico versionado
// ----------------------------------------------------------------------

/// Envelope criptográfico versionado com proteção AEAD.
///
/// A versão 1 utiliza Argon2id para derivação de chave e AES-256-GCM
/// para cifragem autenticada.
///
/// Os metadados são validados explicitamente durante a decifragem.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EncryptedEnvelope {
    pub version: u32,
    pub kdf: String,
    pub cipher: String,
    pub salt_hex: String,
    pub nonce_hex: String,
    pub ciphertext_hex: String,
}

// ----------------------------------------------------------------------
// Chave derivada
// ----------------------------------------------------------------------

/// Chave temporária protegida contra leitura residual por descarte.
///
/// A chave é derivada diretamente neste objeto para evitar a criação
/// de uma cópia intermediária desnecessária na pilha.
#[derive(Zeroize, ZeroizeOnDrop)]
struct DerivedKey([u8; KEY_BYTES]);

// ----------------------------------------------------------------------
// Implementação criptográfica
// ----------------------------------------------------------------------

pub struct VaultCrypto;

impl VaultCrypto {
    // --------------------------------------------------------------
    // Validação de entradas
    // --------------------------------------------------------------

    /// Valida o tamanho máximo suportado pela API criptográfica.
    ///
    /// Não normaliza, trunca nem modifica a senha.
    fn validate_password_size(password: &str) -> Result<(), VaultCryptoError> {
        if password.len() > MAX_PASSWORD_BYTES {
            return Err(VaultCryptoError::EncryptionFailed(
                "Password exceeds the supported size limit.".to_string(),
            ));
        }

        if password.chars().count() > MAX_PASSWORD_CHARS {
            return Err(VaultCryptoError::EncryptionFailed(
                "Password exceeds the supported size limit.".to_string(),
            ));
        }

        Ok(())
    }

    /// Valida o comprimento da representação hexadecimal do ciphertext
    /// antes de alocar um vetor com os bytes decodificados.
    fn validate_ciphertext_hex_length(hex_length: usize) -> Result<(), VaultCryptoError> {
        let minimum_hex_length = GCM_TAG_BYTES * 2;

        if hex_length < minimum_hex_length
            || hex_length > MAX_CIPHERTEXT_HEX_CHARS
            || !hex_length.is_multiple_of(2)
        {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        Ok(())
    }

    /// Valida o identificador do algoritmo e a versão do envelope.
    ///
    /// O formato atual rejeita algoritmos desconhecidos.
    fn validate_envelope_metadata(envelope: &EncryptedEnvelope) -> Result<(), VaultCryptoError> {
        if envelope.version != ENVELOPE_VERSION {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        if envelope.kdf != KDF_NAME {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        if envelope.cipher != CIPHER_NAME {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        Ok(())
    }

    // --------------------------------------------------------------
    // Derivação de chave
    // --------------------------------------------------------------

    /// Deriva uma chave simétrica de 256 bits utilizando Argon2id.
    ///
    /// Parâmetros preservados:
    /// - Memória: 64 MiB.
    /// - Iterações: 3.
    /// - Paralelismo: 1.
    /// - Comprimento da chave: 32 bytes.
    fn derive_key(
        password: &str,
        salt: &[u8; SALT_BYTES],
    ) -> Result<DerivedKey, VaultCryptoError> {
        Self::validate_password_size(password)?;

        let params = Params::new(
            ARGON2_MEMORY_KIB,
            ARGON2_ITERATIONS,
            ARGON2_LANES,
            Some(KEY_BYTES),
        )
        .map_err(|_| {
            VaultCryptoError::EncryptionFailed("Invalid Argon2id parameters.".to_string())
        })?;

        let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

        // A chave nasce diretamente dentro do tipo que a zera no descarte (ZeroizeOnDrop).
        let mut derived_key = DerivedKey([0u8; KEY_BYTES]);

        argon2
            .hash_password_into(password.as_bytes(), salt, &mut derived_key.0)
            .map_err(|_| {
                VaultCryptoError::EncryptionFailed("Argon2id key derivation failed.".to_string())
            })?;

        Ok(derived_key)
    }

    // --------------------------------------------------------------
    // Cifragem
    // --------------------------------------------------------------

    /// Cifra dados sensíveis utilizando Argon2id + AES-256-GCM.
    ///
    /// O chamador permanece responsável pelo ciclo de vida do plaintext
    /// recebido por referência.
    pub fn encrypt(
        password: &str,
        plaintext: &[u8],
    ) -> Result<EncryptedEnvelope, VaultCryptoError> {
        Self::validate_password_size(password)?;

        if plaintext.len() > MAX_PLAINTEXT_BYTES {
            return Err(VaultCryptoError::EncryptionFailed(
                "Plaintext exceeds the supported size limit.".to_string(),
            ));
        }

        // Salt e nonce são gerados com CSPRNG seguro com tratamento de falhas.
        let mut rng = rand::thread_rng();

        let mut salt = [0u8; SALT_BYTES];
        rng.try_fill_bytes(&mut salt).map_err(|_| {
            VaultCryptoError::EncryptionFailed("Secure random generation failed.".to_string())
        })?;

        let mut nonce_bytes = [0u8; NONCE_BYTES];
        rng.try_fill_bytes(&mut nonce_bytes).map_err(|_| {
            VaultCryptoError::EncryptionFailed("Secure random generation failed.".to_string())
        })?;

        let derived_key = Self::derive_key(password, &salt)?;

        let cipher = Aes256Gcm::new_from_slice(&derived_key.0).map_err(|_| {
            VaultCryptoError::EncryptionFailed("AES-256-GCM initialization failed.".to_string())
        })?;

        // O nonce foi construído a partir de um array fixo de 12 bytes.
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher.encrypt(nonce, plaintext).map_err(|_| {
            VaultCryptoError::EncryptionFailed("AES-256-GCM encryption failed.".to_string())
        })?;

        Ok(EncryptedEnvelope {
            version: ENVELOPE_VERSION,
            kdf: KDF_NAME.to_string(),
            cipher: CIPHER_NAME.to_string(),
            salt_hex: hex::encode(salt),
            nonce_hex: hex::encode(nonce_bytes),
            ciphertext_hex: hex::encode(ciphertext),
        })
    }

    // --------------------------------------------------------------
    // Decifragem
    // --------------------------------------------------------------

    /// Decifra e autentica um envelope criptográfico.
    ///
    /// Retorna erro controlado quando a senha está incorreta ou o
    /// envelope não pode ser autenticado.
    ///
    /// O vetor retornado contém plaintext. O chamador deve protegê-lo
    /// com Zeroizing ou mecanismo equivalente quando contiver segredos.
    pub fn decrypt(
        password: &str,
        envelope: &EncryptedEnvelope,
    ) -> Result<Vec<u8>, VaultCryptoError> {
        // 1. Validação estrita de versão, KDF e cifra antes de qualquer cálculo
        Self::validate_envelope_metadata(envelope)?;

        // 2. Validação defensiva de tamanho da senha
        if password.len() > MAX_PASSWORD_BYTES || password.chars().count() > MAX_PASSWORD_CHARS {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        // 3. Validação antecipada de tamanhos hexadecimais para evitar pânicos ou alocações espúrias
        if envelope.salt_hex.len() != SALT_BYTES * 2 {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        if envelope.nonce_hex.len() != NONCE_BYTES * 2 {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        Self::validate_ciphertext_hex_length(envelope.ciphertext_hex.len())?;

        // 4. Conversão para arrays de tamanho estrito fixo (impede pânico em Nonce::from_slice)
        let salt: [u8; SALT_BYTES] = hex::decode(&envelope.salt_hex)
            .map_err(|_| VaultCryptoError::DecryptionFailed)?
            .try_into()
            .map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let nonce_bytes: [u8; NONCE_BYTES] = hex::decode(&envelope.nonce_hex)
            .map_err(|_| VaultCryptoError::DecryptionFailed)?
            .try_into()
            .map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let ciphertext = hex::decode(&envelope.ciphertext_hex)
            .map_err(|_| VaultCryptoError::DecryptionFailed)?;

        if ciphertext.len() < GCM_TAG_BYTES || ciphertext.len() > MAX_CIPHERTEXT_BYTES {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        // 5. Derivação e decifragem com chave em DerivedKey (protegida por ZeroizeOnDrop)
        let derived_key = Self::derive_key(password, &salt)
            .map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let cipher = Aes256Gcm::new_from_slice(&derived_key.0)
            .map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let nonce = Nonce::from_slice(&nonce_bytes);

        cipher
            .decrypt(nonce, ciphertext.as_ref())
            .map_err(|_| VaultCryptoError::DecryptionFailed)
    }
}

// ----------------------------------------------------------------------
// Testes
// ----------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    fn make_invalid_envelope() -> EncryptedEnvelope {
        EncryptedEnvelope {
            version: ENVELOPE_VERSION,
            kdf: KDF_NAME.to_string(),
            cipher: CIPHER_NAME.to_string(),
            salt_hex: "00".repeat(SALT_BYTES),
            nonce_hex: "00".repeat(NONCE_BYTES),
            ciphertext_hex: "00".repeat(GCM_TAG_BYTES),
        }
    }

    #[test]
    fn test_vault_encrypt_decrypt_success() {
        let secret = b"sensitive_wallet_seed";
        let password = "SuperMasterPasswordDevOS#2026";

        let envelope =
            VaultCrypto::encrypt(password, secret).expect("Encryption should succeed");

        assert_eq!(envelope.version, ENVELOPE_VERSION);
        assert_eq!(envelope.cipher, CIPHER_NAME);
        assert_eq!(envelope.kdf, KDF_NAME);

        let decrypted =
            VaultCrypto::decrypt(password, &envelope).expect("Decryption should succeed");

        assert_eq!(decrypted, secret);
    }

    #[test]
    fn test_vault_rejects_incorrect_password() {
        let secret = b"sensitive_wallet_seed";
        let password = "CorrectPassword123";
        let wrong_password = "WrongPassword456";

        let envelope =
            VaultCrypto::encrypt(password, secret).expect("Encryption should succeed");

        let result = VaultCrypto::decrypt(wrong_password, &envelope);

        assert!(result.is_err(), "An incorrect password must be rejected.");
    }

    #[test]
    fn test_vault_rejects_tampered_ciphertext() {
        let secret = b"sensitive_wallet_seed";
        let password = "CorrectPassword123";

        let mut envelope =
            VaultCrypto::encrypt(password, secret).expect("Encryption should succeed");

        let mut tampered_bytes = hex::decode(&envelope.ciphertext_hex)
            .expect("Generated ciphertext must be valid hex");

        assert!(
            !tampered_bytes.is_empty(),
            "A valid AES-GCM ciphertext must contain its authentication tag."
        );

        let last = tampered_bytes.len() - 1;
        tampered_bytes[last] ^= 0xFF;

        envelope.ciphertext_hex = hex::encode(tampered_bytes);

        let result = VaultCrypto::decrypt(password, &envelope);

        assert!(
            result.is_err(),
            "Tampered ciphertext must fail authentication."
        );
    }

    #[test]
    fn test_vault_rejects_unsupported_version() {
        let mut envelope = make_invalid_envelope();
        envelope.version = ENVELOPE_VERSION + 1;

        let result = VaultCrypto::decrypt("CorrectPassword123", &envelope);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Unsupported envelope versions must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_unsupported_kdf() {
        let mut envelope = make_invalid_envelope();
        envelope.kdf = "PBKDF2".to_string();

        let result = VaultCrypto::decrypt("CorrectPassword123", &envelope);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Unsupported KDF metadata must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_unsupported_cipher() {
        let mut envelope = make_invalid_envelope();
        envelope.cipher = "AES-128-GCM".to_string();

        let result = VaultCrypto::decrypt("CorrectPassword123", &envelope);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Unsupported cipher metadata must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_invalid_salt_length() {
        let mut envelope = make_invalid_envelope();
        envelope.salt_hex = "0011".to_string();

        let result = VaultCrypto::decrypt("CorrectPassword123", &envelope);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Invalid salt lengths must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_invalid_nonce_length_without_panicking() {
        let mut envelope = make_invalid_envelope();
        // Hexadecimal válido, mas apenas um byte: NUNCA deve entrar em pânico!
        envelope.nonce_hex = "00".to_string();

        let result = VaultCrypto::decrypt("CorrectPassword123", &envelope);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "An invalid nonce length must return an error rather than panic."
        );
    }

    #[test]
    fn test_vault_rejects_invalid_ciphertext_length() {
        let mut envelope = make_invalid_envelope();
        // Menor que a tag de autenticação GCM.
        envelope.ciphertext_hex = "00".repeat(GCM_TAG_BYTES - 1);

        let result = VaultCrypto::decrypt("CorrectPassword123", &envelope);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Ciphertext shorter than the GCM tag must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_odd_ciphertext_hex_length() {
        let result = VaultCrypto::validate_ciphertext_hex_length(33);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Odd-length hexadecimal representations must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_oversized_ciphertext_before_decoding() {
        let oversized_length = MAX_CIPHERTEXT_HEX_CHARS + 2;
        let result = VaultCrypto::validate_ciphertext_hex_length(oversized_length);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Oversized ciphertext representations must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_oversized_password() {
        let oversized_password = "a".repeat(MAX_PASSWORD_CHARS + 1);
        let result = VaultCrypto::encrypt(&oversized_password, b"test");

        assert!(
            matches!(result, Err(VaultCryptoError::EncryptionFailed(_))),
            "Oversized passwords must be rejected before key derivation."
        );
    }

    #[test]
    fn test_vault_rejects_oversized_plaintext() {
        let plaintext = vec![0u8; MAX_PLAINTEXT_BYTES + 1];
        let result = VaultCrypto::encrypt("CorrectPassword123", &plaintext);

        assert!(
            matches!(result, Err(VaultCryptoError::EncryptionFailed(_))),
            "Oversized plaintext must be rejected before Argon2id."
        );
    }
}
