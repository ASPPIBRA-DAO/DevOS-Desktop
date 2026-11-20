//! Módulos responsáveis pelo controle de acesso e pelas operações
//! criptográficas da aplicação.

pub mod access_control;
pub mod encryption;

// Fachada pública com exportações explícitas (sem wildcard)
pub use self::access_control::{
    AccessControlError, VaultHeader, VaultHeaderV2, VaultOperationGuard, VaultSession, VaultStatus,
};

pub use self::encryption::{
    AadDomain, AeadEnvelope, ENVELOPE_VERSION_V2, EncryptedEnvelope, KdfProfile, Subkeys,
    VaultCrypto, VaultCryptoError, WalletTargetTag, WrappedDekEnvelope,
};
