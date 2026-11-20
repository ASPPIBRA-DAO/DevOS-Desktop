use aes_gcm::aead::{Aead, KeyInit, Payload};
use aes_gcm::{Aes256Gcm, Nonce};
use argon2::{Algorithm, Argon2, Params, Version};
use hmac::{Hmac, Mac};
use rand::RngCore;
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

type HmacSha256 = Hmac<Sha256>;

// ----------------------------------------------------------------------
// Parâmetros criptográficos legados (V1) e normativos (V2)
// ----------------------------------------------------------------------

const ENVELOPE_VERSION_V1: u32 = 1;
pub const ENVELOPE_VERSION_V2: u32 = 2;

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

    #[error("Corrupted or unsupported cryptographic parameters")]
    CorruptedOrUnsupportedParameters,

    #[error("Entropy generation failed: {0}")]
    EntropyFailed(String),

    // Mantido para compatibilidade com consumidores existentes.
    #[error("Hex decode error: {0}")]
    HexError(String),

    // Mantido para compatibilidade com consumidores existentes.
    #[error("Serialization error: {0}")]
    SerializationError(String),
}

// ----------------------------------------------------------------------
// Envelopes Criptográficos (V1 e V2)
// ----------------------------------------------------------------------

/// Envelope criptográfico V1 legado com proteção AEAD e derivação direta de senha.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EncryptedEnvelope {
    pub version: u32,
    pub kdf: String,
    pub cipher: String,
    pub salt_hex: String,
    pub nonce_hex: String,
    pub ciphertext_hex: String,
}

/// Envelope de dados V2 cifrados com a DEK em memória (AES-256-GCM + AAD).
/// Não possui salt de KDF porque a chave é simétrica e derivada internamente via HKDF.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AeadEnvelope {
    pub version: u32,
    pub cipher: String,
    pub nonce_hex: String,
    pub ciphertext_hex: String,
}

/// Envelope de custódia da DEK protegida pela KEK derivada da senha mestre (Argon2id + AES-256-GCM).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct WrappedDekEnvelope {
    pub version: u32,
    pub kdf_profile: String,
    pub kdf_algorithm: String,
    pub kdf_version: u32,
    pub kdf_salt_hex: String,
    pub memory_kib: u32,
    pub iterations: u32,
    pub parallelism: u32,
    pub cipher: String,
    pub nonce_hex: String,
    pub wrapped_dek_hex: String,
}

// ----------------------------------------------------------------------
// Perfil Homologado de KDF (Anti-DoS e Anti-Exaustão)
// ----------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum KdfProfile {
    Argon2idV2Profile1,
}

impl KdfProfile {
    pub const PROFILE_NAME: &'static str = "Argon2idV2Profile1";
    pub const ALGORITHM: &'static str = "Argon2id";
    pub const VERSION: u32 = 0x13;
    pub const MEMORY_KIB: u32 = 65536; // 64 MiB
    pub const ITERATIONS: u32 = 3;
    pub const PARALLELISM: u32 = 1;
    pub const SALT_LEN: usize = 16;
    pub const NONCE_LEN: usize = 12;
    pub const WRAPPED_DEK_LEN: usize = 48; // 32 bytes chave + 16 bytes tag GCM

    /// Valida estritamente os parâmetros do envelope ANTES de qualquer alocação ou cálculo Argon2id.
    pub fn validate_and_decode(
        env: &WrappedDekEnvelope,
    ) -> Result<([u8; 16], [u8; 12], Vec<u8>), VaultCryptoError> {
        if env.kdf_profile != Self::PROFILE_NAME
            || env.kdf_algorithm != Self::ALGORITHM
            || env.kdf_version != Self::VERSION
            || env.memory_kib != Self::MEMORY_KIB
            || env.iterations != Self::ITERATIONS
            || env.parallelism != Self::PARALLELISM
            || env.cipher != "AES-256-GCM"
        {
            return Err(VaultCryptoError::CorruptedOrUnsupportedParameters);
        }

        let salt_bytes = hex::decode(&env.kdf_salt_hex)
            .map_err(|_| VaultCryptoError::CorruptedOrUnsupportedParameters)?;
        if salt_bytes.len() != Self::SALT_LEN {
            return Err(VaultCryptoError::CorruptedOrUnsupportedParameters);
        }
        let mut salt = [0u8; 16];
        salt.copy_from_slice(&salt_bytes);

        let nonce_bytes = hex::decode(&env.nonce_hex)
            .map_err(|_| VaultCryptoError::CorruptedOrUnsupportedParameters)?;
        if nonce_bytes.len() != Self::NONCE_LEN {
            return Err(VaultCryptoError::CorruptedOrUnsupportedParameters);
        }
        let mut nonce = [0u8; 12];
        nonce.copy_from_slice(&nonce_bytes);

        let wrapped_dek = hex::decode(&env.wrapped_dek_hex)
            .map_err(|_| VaultCryptoError::CorruptedOrUnsupportedParameters)?;
        if wrapped_dek.len() != Self::WRAPPED_DEK_LEN {
            return Err(VaultCryptoError::CorruptedOrUnsupportedParameters);
        }

        Ok((salt, nonce, wrapped_dek))
    }
}

// ----------------------------------------------------------------------
// Codificação Binária Canônica de AAD (Anti-Ambiguity)
// ----------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum WalletTargetTag {
    Dao = 1,
    Client = 2,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AadDomain<'a> {
    DekWrap {
        app_id: &'a str,
        kdf_metadata_hash: [u8; 32],
    },
    WalletMnemonic {
        vault_id: &'a str,
        target: WalletTargetTag,
    },
    UserProfile {
        profile_id: u32,
        vault_instance_id: &'a str,
    },
    SsiRootSecret {
        ssi_vault_id: &'a str,
    },
    SsiCredential {
        credential_id: &'a str,
    },
    BackupPayload {
        timestamp: i64,
    },
}

impl<'a> AadDomain<'a> {
    pub const MAGIC: [u8; 4] = *b"DEV0";
    pub const FORMAT_VERSION: u16 = 2;

    pub fn to_canonical_bytes(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(64);
        buf.extend_from_slice(&Self::MAGIC);
        buf.extend_from_slice(&Self::FORMAT_VERSION.to_be_bytes());

        match self {
            AadDomain::DekWrap {
                app_id,
                kdf_metadata_hash,
            } => {
                buf.push(0x01);
                let app_bytes = app_id.as_bytes();
                buf.extend_from_slice(&(app_bytes.len() as u16).to_be_bytes());
                buf.extend_from_slice(app_bytes);
                buf.extend_from_slice(kdf_metadata_hash);
            }
            AadDomain::WalletMnemonic { vault_id, target } => {
                buf.push(0x02);
                let vault_bytes = vault_id.as_bytes();
                buf.extend_from_slice(&(vault_bytes.len() as u16).to_be_bytes());
                buf.extend_from_slice(vault_bytes);
                buf.push(*target as u8);
            }
            AadDomain::UserProfile {
                profile_id,
                vault_instance_id,
            } => {
                buf.push(0x03);
                buf.extend_from_slice(&profile_id.to_be_bytes());
                let inst_bytes = vault_instance_id.as_bytes();
                buf.extend_from_slice(&(inst_bytes.len() as u16).to_be_bytes());
                buf.extend_from_slice(inst_bytes);
            }
            AadDomain::SsiRootSecret { ssi_vault_id } => {
                buf.push(0x04);
                let ssi_bytes = ssi_vault_id.as_bytes();
                buf.extend_from_slice(&(ssi_bytes.len() as u16).to_be_bytes());
                buf.extend_from_slice(ssi_bytes);
            }
            AadDomain::SsiCredential { credential_id } => {
                buf.push(0x05);
                let cred_bytes = credential_id.as_bytes();
                buf.extend_from_slice(&(cred_bytes.len() as u16).to_be_bytes());
                buf.extend_from_slice(cred_bytes);
            }
            AadDomain::BackupPayload { timestamp } => {
                buf.push(0x06);
                buf.extend_from_slice(&timestamp.to_be_bytes());
            }
        }
        buf
    }
}

// ----------------------------------------------------------------------
// Subchaves por Domínio via HKDF-SHA256 (RFC 5869)
// ----------------------------------------------------------------------

pub struct Subkeys;

impl Subkeys {
    pub const WALLETS_INFO: &'static [u8] = b"DEVOS/WALLETS/V2";
    pub const IDENTITY_INFO: &'static [u8] = b"DEVOS/IDENTITY/V2";
    pub const SSI_INFO: &'static [u8] = b"DEVOS/SSI/V2";
    pub const BACKUP_INFO: &'static [u8] = b"DEVOS/BACKUP/V2";

    /// Deriva uma subchave de 256 bits a partir da Master DEK utilizando HKDF-SHA256.
    pub fn derive_subkey(master_dek: &[u8; 32], info: &[u8]) -> Zeroizing<[u8; 32]> {
        let salt = [0u8; 32]; // RFC 5869 §2.2 default zero salt
        let mut extractor =
            <HmacSha256 as hmac::Mac>::new_from_slice(&salt).expect("Valid HMAC key");
        extractor.update(master_dek);
        let prk = extractor.finalize().into_bytes();

        let mut expander = <HmacSha256 as hmac::Mac>::new_from_slice(&prk).expect("Valid PRK");
        expander.update(info);
        expander.update(&[0x01]);
        let okm = expander.finalize().into_bytes();

        let mut subkey = [0u8; 32];
        subkey.copy_from_slice(&okm[0..32]);
        Zeroizing::new(subkey)
    }

    pub fn derive_wallets_key(master_dek: &[u8; 32]) -> Zeroizing<[u8; 32]> {
        Self::derive_subkey(master_dek, Self::WALLETS_INFO)
    }

    pub fn derive_identity_key(master_dek: &[u8; 32]) -> Zeroizing<[u8; 32]> {
        Self::derive_subkey(master_dek, Self::IDENTITY_INFO)
    }

    pub fn derive_ssi_key(master_dek: &[u8; 32]) -> Zeroizing<[u8; 32]> {
        Self::derive_subkey(master_dek, Self::SSI_INFO)
    }

    pub fn derive_backup_key(master_dek: &[u8; 32]) -> Zeroizing<[u8; 32]> {
        Self::derive_subkey(master_dek, Self::BACKUP_INFO)
    }
}

// ----------------------------------------------------------------------
// Chave derivada V1 (Legada)
// ----------------------------------------------------------------------

#[derive(Zeroize, ZeroizeOnDrop)]
struct DerivedKey([u8; KEY_BYTES]);

// ----------------------------------------------------------------------
// Implementação Criptográfica Central
// ----------------------------------------------------------------------

pub struct VaultCrypto;

impl VaultCrypto {
    // --------------------------------------------------------------
    // Validação de entradas
    // --------------------------------------------------------------

    fn validate_password_size(password: &str) -> Result<(), VaultCryptoError> {
        if password.len() > MAX_PASSWORD_BYTES || password.chars().count() > MAX_PASSWORD_CHARS {
            return Err(VaultCryptoError::EncryptionFailed(
                "Password exceeds the supported size limit.".to_string(),
            ));
        }
        Ok(())
    }

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

    fn validate_envelope_metadata(envelope: &EncryptedEnvelope) -> Result<(), VaultCryptoError> {
        if envelope.version != ENVELOPE_VERSION_V1
            || envelope.kdf != KDF_NAME
            || envelope.cipher != CIPHER_NAME
        {
            return Err(VaultCryptoError::DecryptionFailed);
        }
        Ok(())
    }

    // --------------------------------------------------------------
    // Métodos Normativos V2 (KEK / DEK / AAD)
    // --------------------------------------------------------------

    /// Gera uma DEK criptograficamente segura de 256 bits usando CSPRNG do sistema operacional (OsRng).
    pub fn generate_dek() -> Result<Zeroizing<[u8; 32]>, VaultCryptoError> {
        let mut dek = [0u8; 32];
        OsRng.try_fill_bytes(&mut dek).map_err(|e| {
            VaultCryptoError::EntropyFailed(format!("Falha no CSPRNG do SO: {}", e))
        })?;
        Ok(Zeroizing::new(dek))
    }

    /// Deriva a KEK de 256 bits a partir da senha mestre utilizando Argon2id com o perfil homologado.
    pub fn derive_kek(
        password: &str,
        salt: &[u8; 16],
    ) -> Result<Zeroizing<[u8; 32]>, VaultCryptoError> {
        Self::validate_password_size(password)?;
        let params = Params::new(
            KdfProfile::MEMORY_KIB,
            KdfProfile::ITERATIONS,
            KdfProfile::PARALLELISM,
            Some(32),
        )
        .map_err(|_| VaultCryptoError::CorruptedOrUnsupportedParameters)?;

        let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
        let mut kek = [0u8; 32];
        argon2
            .hash_password_into(password.as_bytes(), salt, &mut kek)
            .map_err(|_| {
                VaultCryptoError::EncryptionFailed("Argon2id key derivation failed.".to_string())
            })?;
        Ok(Zeroizing::new(kek))
    }

    /// Calcula o hash SHA-256 canônico dos metadados da KDF para injeção no AAD do Wrapped DEK.
    pub fn compute_kdf_metadata_hash(
        profile: &str,
        algorithm: &str,
        version: u32,
        salt: &[u8; 16],
        memory_kib: u32,
        iterations: u32,
        parallelism: u32,
        cipher: &str,
        envelope_version: u32,
    ) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(profile.as_bytes());
        hasher.update(algorithm.as_bytes());
        hasher.update(version.to_be_bytes());
        hasher.update(salt);
        hasher.update(memory_kib.to_be_bytes());
        hasher.update(iterations.to_be_bytes());
        hasher.update(parallelism.to_be_bytes());
        hasher.update(cipher.as_bytes());
        hasher.update(envelope_version.to_be_bytes());
        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        hash
    }

    /// Envolve a DEK com a KEK utilizando AES-256-GCM + AAD Canônico com hash dos parâmetros da KDF.
    pub fn wrap_dek(
        kek: &[u8; 32],
        dek: &[u8; 32],
        salt: &[u8; 16],
        app_id: &str,
    ) -> Result<WrappedDekEnvelope, VaultCryptoError> {
        let mut nonce = [0u8; 12];
        OsRng.try_fill_bytes(&mut nonce).map_err(|e| {
            VaultCryptoError::EntropyFailed(format!("Falha no CSPRNG ao gerar nonce: {}", e))
        })?;

        let kdf_hash = Self::compute_kdf_metadata_hash(
            KdfProfile::PROFILE_NAME,
            KdfProfile::ALGORITHM,
            KdfProfile::VERSION,
            salt,
            KdfProfile::MEMORY_KIB,
            KdfProfile::ITERATIONS,
            KdfProfile::PARALLELISM,
            "AES-256-GCM",
            2,
        );

        let aad = AadDomain::DekWrap {
            app_id,
            kdf_metadata_hash: kdf_hash,
        }
        .to_canonical_bytes();

        let cipher = Aes256Gcm::new_from_slice(kek).map_err(|_| {
            VaultCryptoError::EncryptionFailed("AES-256-GCM init failed".to_string())
        })?;

        let ciphertext = cipher
            .encrypt(
                Nonce::from_slice(&nonce),
                Payload {
                    msg: dek,
                    aad: &aad,
                },
            )
            .map_err(|_| {
                VaultCryptoError::EncryptionFailed("AES-256-GCM wrap failed".to_string())
            })?;

        Ok(WrappedDekEnvelope {
            version: 2,
            kdf_profile: KdfProfile::PROFILE_NAME.to_string(),
            kdf_algorithm: KdfProfile::ALGORITHM.to_string(),
            kdf_version: KdfProfile::VERSION,
            kdf_salt_hex: hex::encode(salt),
            memory_kib: KdfProfile::MEMORY_KIB,
            iterations: KdfProfile::ITERATIONS,
            parallelism: KdfProfile::PARALLELISM,
            cipher: "AES-256-GCM".to_string(),
            nonce_hex: hex::encode(nonce),
            wrapped_dek_hex: hex::encode(ciphertext),
        })
    }

    /// Desenvolve a DEK validando estritamente os parâmetros do envelope ANTES de qualquer cálculo.
    pub fn unwrap_dek(
        kek: &[u8; 32],
        env: &WrappedDekEnvelope,
        app_id: &str,
    ) -> Result<Zeroizing<[u8; 32]>, VaultCryptoError> {
        let (salt, nonce, ciphertext) = KdfProfile::validate_and_decode(env)?;

        let kdf_hash = Self::compute_kdf_metadata_hash(
            &env.kdf_profile,
            &env.kdf_algorithm,
            env.kdf_version,
            &salt,
            env.memory_kib,
            env.iterations,
            env.parallelism,
            &env.cipher,
            env.version,
        );

        let aad = AadDomain::DekWrap {
            app_id,
            kdf_metadata_hash: kdf_hash,
        }
        .to_canonical_bytes();

        let cipher =
            Aes256Gcm::new_from_slice(kek).map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let decrypted = cipher
            .decrypt(
                Nonce::from_slice(&nonce),
                Payload {
                    msg: &ciphertext,
                    aad: &aad,
                },
            )
            .map_err(|_| VaultCryptoError::DecryptionFailed)?;

        if decrypted.len() != 32 {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        let mut dek = [0u8; 32];
        dek.copy_from_slice(&decrypted);
        Ok(Zeroizing::new(dek))
    }

    /// Cifra dados locais usando uma subchave simétrica de 256 bits e AAD canônico.
    pub fn encrypt_with_aead(
        key: &[u8; 32],
        plaintext: &[u8],
        aad: &[u8],
    ) -> Result<AeadEnvelope, VaultCryptoError> {
        if plaintext.len() > MAX_PLAINTEXT_BYTES {
            return Err(VaultCryptoError::EncryptionFailed(
                "Plaintext exceeds size limit".to_string(),
            ));
        }

        let mut nonce = [0u8; 12];
        OsRng
            .try_fill_bytes(&mut nonce)
            .map_err(|e| VaultCryptoError::EntropyFailed(format!("Falha no CSPRNG: {}", e)))?;

        let cipher = Aes256Gcm::new_from_slice(key).map_err(|_| {
            VaultCryptoError::EncryptionFailed("AES-256-GCM init failed".to_string())
        })?;

        let ciphertext = cipher
            .encrypt(
                Nonce::from_slice(&nonce),
                Payload {
                    msg: plaintext,
                    aad,
                },
            )
            .map_err(|_| {
                VaultCryptoError::EncryptionFailed("AES-256-GCM encryption failed".to_string())
            })?;

        Ok(AeadEnvelope {
            version: 2,
            cipher: "AES-256-GCM".to_string(),
            nonce_hex: hex::encode(nonce),
            ciphertext_hex: hex::encode(ciphertext),
        })
    }

    /// Decifra dados locais autenticando estritamente contra o AAD canônico.
    pub fn decrypt_with_aead(
        key: &[u8; 32],
        env: &AeadEnvelope,
        aad: &[u8],
    ) -> Result<Zeroizing<Vec<u8>>, VaultCryptoError> {
        if env.version != 2 || env.cipher != "AES-256-GCM" {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        if env.nonce_hex.len() != 24 {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        Self::validate_ciphertext_hex_length(env.ciphertext_hex.len())?;

        let nonce_bytes =
            hex::decode(&env.nonce_hex).map_err(|_| VaultCryptoError::DecryptionFailed)?;
        let ciphertext =
            hex::decode(&env.ciphertext_hex).map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let cipher =
            Aes256Gcm::new_from_slice(key).map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let decrypted = cipher
            .decrypt(
                Nonce::from_slice(&nonce_bytes),
                Payload {
                    msg: &ciphertext,
                    aad,
                },
            )
            .map_err(|_| VaultCryptoError::DecryptionFailed)?;

        Ok(Zeroizing::new(decrypted))
    }

    /// Cifra um payload de backup institucional utilizando a subchave de domínio DEVOS/BACKUP/V2 e AAD canônico.
    pub fn seal_backup_payload(
        dek: &[u8; 32],
        timestamp: i64,
        payload: &[u8],
    ) -> Result<AeadEnvelope, VaultCryptoError> {
        let subkey = Subkeys::derive_backup_key(dek);
        let aad = AadDomain::BackupPayload { timestamp }.to_canonical_bytes();
        Self::encrypt_with_aead(&subkey, payload, &aad)
    }

    /// Decifra um payload de backup institucional utilizando a subchave de domínio DEVOS/BACKUP/V2 e AAD canônico.
    pub fn unseal_backup_payload(
        dek: &[u8; 32],
        timestamp: i64,
        envelope: &AeadEnvelope,
    ) -> Result<Zeroizing<Vec<u8>>, VaultCryptoError> {
        let subkey = Subkeys::derive_backup_key(dek);
        let aad = AadDomain::BackupPayload { timestamp }.to_canonical_bytes();
        Self::decrypt_with_aead(&subkey, envelope, &aad)
    }

    // --------------------------------------------------------------
    // Métodos Legados V1 (Mantidos para Migração e Compatibilidade)
    // --------------------------------------------------------------

    fn derive_key(password: &str, salt: &[u8; SALT_BYTES]) -> Result<DerivedKey, VaultCryptoError> {
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
        let mut derived_key = DerivedKey([0u8; KEY_BYTES]);

        argon2
            .hash_password_into(password.as_bytes(), salt, &mut derived_key.0)
            .map_err(|_| {
                VaultCryptoError::EncryptionFailed("Argon2id key derivation failed.".to_string())
            })?;

        Ok(derived_key)
    }

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

        let mut salt = [0u8; SALT_BYTES];
        OsRng
            .try_fill_bytes(&mut salt)
            .map_err(|e| VaultCryptoError::EntropyFailed(format!("CSPRNG error: {}", e)))?;

        let mut nonce_bytes = [0u8; NONCE_BYTES];
        OsRng
            .try_fill_bytes(&mut nonce_bytes)
            .map_err(|e| VaultCryptoError::EntropyFailed(format!("CSPRNG error: {}", e)))?;

        let derived_key = Self::derive_key(password, &salt)?;
        let cipher = Aes256Gcm::new_from_slice(&derived_key.0).map_err(|_| {
            VaultCryptoError::EncryptionFailed("AES-256-GCM initialization failed.".to_string())
        })?;

        let nonce = Nonce::from_slice(&nonce_bytes);
        let ciphertext = cipher.encrypt(nonce, plaintext).map_err(|_| {
            VaultCryptoError::EncryptionFailed("AES-256-GCM encryption failed.".to_string())
        })?;

        Ok(EncryptedEnvelope {
            version: ENVELOPE_VERSION_V1,
            kdf: KDF_NAME.to_string(),
            cipher: CIPHER_NAME.to_string(),
            salt_hex: hex::encode(salt),
            nonce_hex: hex::encode(nonce_bytes),
            ciphertext_hex: hex::encode(ciphertext),
        })
    }

    pub fn decrypt(
        password: &str,
        envelope: &EncryptedEnvelope,
    ) -> Result<Vec<u8>, VaultCryptoError> {
        Self::validate_envelope_metadata(envelope)?;

        if password.len() > MAX_PASSWORD_BYTES || password.chars().count() > MAX_PASSWORD_CHARS {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        if envelope.salt_hex.len() != SALT_BYTES * 2 || envelope.nonce_hex.len() != NONCE_BYTES * 2
        {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        Self::validate_ciphertext_hex_length(envelope.ciphertext_hex.len())?;

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

        let derived_key =
            Self::derive_key(password, &salt).map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let cipher = Aes256Gcm::new_from_slice(&derived_key.0)
            .map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let nonce = Nonce::from_slice(&nonce_bytes);
        cipher
            .decrypt(nonce, ciphertext.as_ref())
            .map_err(|_| VaultCryptoError::DecryptionFailed)
    }
}

// ----------------------------------------------------------------------
// Testes unitários (Fase 0)
// ----------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kek_dek_lifecycle_and_aead_with_aad() {
        let password = "SuperMasterPasswordDevOS#2026";
        let app_id = "br.aspp.devos";
        let salt = [0x42u8; 16];

        // 1. Gera DEK aleatória e deriva KEK
        let dek = VaultCrypto::generate_dek().expect("DEK generation");
        let kek = VaultCrypto::derive_kek(password, &salt).expect("KEK derivation");

        // 2. Wrap da DEK com KEK + AAD
        let wrapped_env = VaultCrypto::wrap_dek(&kek, &dek, &salt, app_id).expect("Wrap DEK");
        assert_eq!(wrapped_env.version, 2);
        assert_eq!(wrapped_env.kdf_profile, KdfProfile::PROFILE_NAME);

        // 3. Unwrap da DEK e verificação de igualdade dos bytes
        let unwrapped_dek =
            VaultCrypto::unwrap_dek(&kek, &wrapped_env, app_id).expect("Unwrap DEK");
        assert_eq!(*dek, *unwrapped_dek);

        // 4. Derivação de subchaves HKDF
        let wallet_sub = Subkeys::derive_wallets_key(&unwrapped_dek);
        let identity_sub = Subkeys::derive_identity_key(&unwrapped_dek);
        assert_ne!(*wallet_sub, *identity_sub);

        // 5. Cifragem de mnemônica com subchave Wallets + AAD Canônico
        let mnemonic_payload = b"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let aad = AadDomain::WalletMnemonic {
            vault_id: "dao_vault_123",
            target: WalletTargetTag::Dao,
        }
        .to_canonical_bytes();

        let aead_env = VaultCrypto::encrypt_with_aead(&wallet_sub, mnemonic_payload, &aad)
            .expect("AEAD encrypt");
        assert_eq!(aead_env.version, 2);

        // 6. Decifragem com AAD correto
        let decrypted =
            VaultCrypto::decrypt_with_aead(&wallet_sub, &aead_env, &aad).expect("AEAD decrypt");
        assert_eq!(decrypted.as_slice(), mnemonic_payload);

        // 7. Rejeição com AAD adulterado (ex: trocando de DAO para CLIENT)
        let tampered_aad = AadDomain::WalletMnemonic {
            vault_id: "dao_vault_123",
            target: WalletTargetTag::Client,
        }
        .to_canonical_bytes();
        let fail_result = VaultCrypto::decrypt_with_aead(&wallet_sub, &aead_env, &tampered_aad);
        assert!(fail_result.is_err(), "AAD adulterado DEVE falhar");
    }

    #[test]
    fn test_kdf_profile_rejects_zeroed_or_corrupted_parameters_before_argon2() {
        let mut env = WrappedDekEnvelope {
            version: 2,
            kdf_profile: KdfProfile::PROFILE_NAME.to_string(),
            kdf_algorithm: KdfProfile::ALGORITHM.to_string(),
            kdf_version: KdfProfile::VERSION,
            kdf_salt_hex: "00".repeat(16),
            memory_kib: 65536,
            iterations: 3,
            parallelism: 1,
            cipher: "AES-256-GCM".to_string(),
            nonce_hex: "00".repeat(12),
            wrapped_dek_hex: "00".repeat(48),
        };

        // Base válida decodifica
        assert!(KdfProfile::validate_and_decode(&env).is_ok());

        // Rejeita memória zerada
        env.memory_kib = 0;
        assert!(matches!(
            KdfProfile::validate_and_decode(&env),
            Err(VaultCryptoError::CorruptedOrUnsupportedParameters)
        ));

        // Rejeita iterações zeradas
        env.memory_kib = 65536;
        env.iterations = 0;
        assert!(matches!(
            KdfProfile::validate_and_decode(&env),
            Err(VaultCryptoError::CorruptedOrUnsupportedParameters)
        ));

        // Rejeita paralelismo zerado
        env.iterations = 3;
        env.parallelism = 0;
        assert!(matches!(
            KdfProfile::validate_and_decode(&env),
            Err(VaultCryptoError::CorruptedOrUnsupportedParameters)
        ));

        // Rejeita hex inválido (caracteres não-hex)
        env.parallelism = 1;
        env.kdf_salt_hex = "ZZ".repeat(16);
        assert!(matches!(
            KdfProfile::validate_and_decode(&env),
            Err(VaultCryptoError::CorruptedOrUnsupportedParameters)
        ));
    }

    #[test]
    fn test_unwrap_dek_rejects_wrong_kek_or_tampered_aad() {
        let app_id = "br.aspp.devos";
        let salt = [0x55u8; 16];
        let dek = VaultCrypto::generate_dek().unwrap();
        let kek = VaultCrypto::derive_kek("Password123", &salt).unwrap();
        let wrong_kek = VaultCrypto::derive_kek("WrongPassword456", &salt).unwrap();

        let wrapped = VaultCrypto::wrap_dek(&kek, &dek, &salt, app_id).unwrap();

        // KEK errada falha
        assert!(VaultCrypto::unwrap_dek(&wrong_kek, &wrapped, app_id).is_err());

        // App ID adulterado falha
        assert!(VaultCrypto::unwrap_dek(&kek, &wrapped, "br.aspp.attacker").is_err());
    }

    // --------------------------------------------------------------
    // Testes de regressão V1 legados
    // --------------------------------------------------------------

    fn make_invalid_envelope_v1() -> EncryptedEnvelope {
        EncryptedEnvelope {
            version: ENVELOPE_VERSION_V1,
            kdf: KDF_NAME.to_string(),
            cipher: CIPHER_NAME.to_string(),
            salt_hex: "00".repeat(SALT_BYTES),
            nonce_hex: "00".repeat(NONCE_BYTES),
            ciphertext_hex: "00".repeat(GCM_TAG_BYTES),
        }
    }

    #[test]
    fn test_vault_v1_encrypt_decrypt_success() {
        let secret = b"sensitive_wallet_seed";
        let password = "SuperMasterPasswordDevOS#2026";
        let envelope = VaultCrypto::encrypt(password, secret).expect("Encryption V1");
        assert_eq!(envelope.version, ENVELOPE_VERSION_V1);
        let decrypted = VaultCrypto::decrypt(password, &envelope).expect("Decryption V1");
        assert_eq!(decrypted, secret);
    }

    #[test]
    fn test_vault_v1_rejects_incorrect_password() {
        let secret = b"sensitive_wallet_seed";
        let password = "CorrectPassword123";
        let wrong_password = "WrongPassword456";
        let envelope = VaultCrypto::encrypt(password, secret).expect("Encryption V1");
        let result = VaultCrypto::decrypt(wrong_password, &envelope);
        assert!(result.is_err());
    }

    #[test]
    fn test_vault_v1_rejects_tampered_ciphertext() {
        let secret = b"sensitive_wallet_seed";
        let password = "CorrectPassword123";
        let mut envelope = VaultCrypto::encrypt(password, secret).expect("Encryption V1");
        let mut tampered = hex::decode(&envelope.ciphertext_hex).unwrap();
        let last = tampered.len() - 1;
        tampered[last] ^= 0xFF;
        envelope.ciphertext_hex = hex::encode(tampered);
        let result = VaultCrypto::decrypt(password, &envelope);
        assert!(result.is_err());
    }

    #[test]
    fn test_vault_v1_rejects_unsupported_version() {
        let mut envelope = make_invalid_envelope_v1();
        envelope.version = ENVELOPE_VERSION_V1 + 99;
        let result = VaultCrypto::decrypt("CorrectPassword123", &envelope);
        assert!(matches!(result, Err(VaultCryptoError::DecryptionFailed)));
    }

    #[test]
    fn test_argon2id_v2_profile1_benchmark_and_spec_conformance() {
        use std::time::Instant;

        assert_eq!(KdfProfile::PROFILE_NAME, "Argon2idV2Profile1");
        assert_eq!(KdfProfile::ALGORITHM, "Argon2id");
        assert_eq!(KdfProfile::VERSION, 0x13);
        assert_eq!(KdfProfile::MEMORY_KIB, 65536); // 64 MiB
        assert_eq!(KdfProfile::ITERATIONS, 3);
        assert_eq!(KdfProfile::PARALLELISM, 1);
        assert_eq!(KdfProfile::SALT_LEN, 16);
        assert_eq!(KdfProfile::NONCE_LEN, 12);
        assert_eq!(KdfProfile::WRAPPED_DEK_LEN, 48);

        let password = "CorrectMasterPassword123!";
        let salt = [0x5au8; 16];

        let start = Instant::now();
        let kek = VaultCrypto::derive_kek(password, &salt).expect("Argon2id derivation");
        let elapsed = start.elapsed();

        assert_eq!(kek.len(), 32);
        println!(
            "Argon2idV2Profile1 Benchmark: m={} KiB, t={}, p={} -> Elapsed: {:?}",
            KdfProfile::MEMORY_KIB,
            KdfProfile::ITERATIONS,
            KdfProfile::PARALLELISM,
            elapsed
        );
        // Garante que o tempo de execução é institucionalmente razoável (< 15s em debug não-otimizado, ~150-250ms em release)
        assert!(
            elapsed.as_secs() < 15,
            "Argon2id derivation took too long: {:?}",
            elapsed
        );
    }

    #[test]
    fn test_cross_domain_hkdf_cryptographic_isolation() {
        let master_dek = [0x77u8; 32];
        let wallets_key = Subkeys::derive_wallets_key(&master_dek);
        let identity_key = Subkeys::derive_identity_key(&master_dek);
        let ssi_key = Subkeys::derive_ssi_key(&master_dek);
        let backup_key = Subkeys::derive_backup_key(&master_dek);

        // Todas as subchaves devem ser mutuamente exclusivas e distintas de 256 bits
        assert_ne!(*wallets_key, *identity_key);
        assert_ne!(*wallets_key, *ssi_key);
        assert_ne!(*wallets_key, *backup_key);
        assert_ne!(*identity_key, *ssi_key);
        assert_ne!(*identity_key, *backup_key);
        assert_ne!(*ssi_key, *backup_key);
        assert_ne!(*wallets_key, master_dek);

        // Um envelope cifrado sob DEVOS/BACKUP/V2 não pode ser decifrado sob nenhuma outra subchave
        let payload = b"devos-institutional-backup-manifest-payload";
        let timestamp = 1732100000i64;
        let backup_env = VaultCrypto::seal_backup_payload(&master_dek, timestamp, payload).unwrap();

        // 1. Decifra com a subchave correta DEVOS/BACKUP/V2
        let decrypted =
            VaultCrypto::unseal_backup_payload(&master_dek, timestamp, &backup_env).unwrap();
        assert_eq!(decrypted.as_slice(), payload);

        // 2. Falha com AAD divergente (timestamp divergente)
        let aad_fail = VaultCrypto::unseal_backup_payload(&master_dek, timestamp + 1, &backup_env);
        assert!(
            aad_fail.is_err(),
            "Decifragem com AAD divergente deve ser rejeitada"
        );

        // 3. Falha se tentado decifrar com subchave de outro domínio (ex: Wallets, SSI, Identity)
        let aad = AadDomain::BackupPayload { timestamp }.to_canonical_bytes();
        let fail_wallets = VaultCrypto::decrypt_with_aead(&wallets_key, &backup_env, &aad);
        assert!(
            fail_wallets.is_err(),
            "Subchave DEVOS/WALLETS/V2 não pode decifrar backup"
        );

        let fail_ssi = VaultCrypto::decrypt_with_aead(&ssi_key, &backup_env, &aad);
        assert!(
            fail_ssi.is_err(),
            "Subchave DEVOS/SSI/V2 não pode decifrar backup"
        );

        let fail_identity = VaultCrypto::decrypt_with_aead(&identity_key, &backup_env, &aad);
        assert!(
            fail_identity.is_err(),
            "Subchave DEVOS/IDENTITY/V2 não pode decifrar backup"
        );
    }
}
