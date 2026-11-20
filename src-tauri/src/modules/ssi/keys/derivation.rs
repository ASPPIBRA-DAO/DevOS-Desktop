//! Derivação de chaves criptográficas Ed25519 conforme a norma SLIP-0010.
//!
//! A norma SLIP-0010 define a derivação hierárquica para curvas de Edwards (Ed25519).
//! Para Ed25519, apenas derivações 'hardened' (índices >= 0x80000000) são permitidas.
//!
//! Caminho normativo oficial do DevOS SSI Holder:
//! `m/7391'/0'/0'/0'` (todos os níveis hardened).

use hmac::{Hmac, Mac};
use ring::signature::{Ed25519KeyPair, KeyPair};
use sha2::Sha512;
use thiserror::Error;
use zeroize::{Zeroize, ZeroizeOnDrop};

type HmacSha512 = Hmac<Sha512>;

/// Chave mestra HMAC para derivação Ed25519 segundo SLIP-0010.
const ED25519_SEED_KEY: &[u8] = b"ed25519 seed";

/// Offset para índices hardened (2^31).
pub const HARDENED_OFFSET: u32 = 0x8000_0000;

/// Namespace de derivação exclusivo da DevOS Identity Wallet: 7391'
pub const DEVOS_SSI_PURPOSE: u32 = 7391 + HARDENED_OFFSET;

/// Caminho canônico completo: m/7391'/0'/0'/0'
pub const DEVOS_DEFAULT_SSI_PATH: [u32; 4] = [
    DEVOS_SSI_PURPOSE,
    HARDENED_OFFSET,
    HARDENED_OFFSET,
    HARDENED_OFFSET,
];

#[derive(Debug, Error, PartialEq, Eq)]
pub enum Slip10Error {
    #[error("SLIP-0010 para Ed25519 suporta apenas derivação hardened (índice recebido: {0})")]
    NonHardenedIndex(u32),

    #[error("Erro ao inicializar HMAC-SHA512")]
    HmacInitError,

    #[error("Falha ao gerar o par de chaves Ed25519: {0}")]
    KeyPairGenerationFailed(String),
}

/// Chave estendida Ed25519 em memória segura.
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct ExtendedEd25519Key {
    pub private_key: [u8; 32],
    pub chain_code: [u8; 32],
}

impl std::fmt::Debug for ExtendedEd25519Key {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ExtendedEd25519Key")
            .field("private_key", &"[REDACTED]")
            .field("chain_code", &"[REDACTED]")
            .finish()
    }
}

impl ExtendedEd25519Key {
    /// Cria a chave estendida raiz (master) a partir de uma semente BIP-39 (16 a 64 bytes).
    pub fn master_from_seed(seed: &[u8]) -> Result<Self, Slip10Error> {
        let mut mac =
            HmacSha512::new_from_slice(ED25519_SEED_KEY).map_err(|_| Slip10Error::HmacInitError)?;
        mac.update(seed);
        let result = mac.finalize().into_bytes();

        let mut private_key = [0u8; 32];
        let mut chain_code = [0u8; 32];
        private_key.copy_from_slice(&result[0..32]);
        chain_code.copy_from_slice(&result[32..64]);

        Ok(Self {
            private_key,
            chain_code,
        })
    }

    /// Deriva um filho hardened conforme o passo do SLIP-0010:
    /// Data = 0x00 || parent_private_key (32 bytes) || index (4 bytes BE).
    pub fn derive_child(&self, index: u32) -> Result<Self, Slip10Error> {
        if index < HARDENED_OFFSET {
            return Err(Slip10Error::NonHardenedIndex(index));
        }

        let mut data = [0u8; 37];
        data[0] = 0x00;
        data[1..33].copy_from_slice(&self.private_key);
        data[33..37].copy_from_slice(&index.to_be_bytes());

        let mut mac =
            HmacSha512::new_from_slice(&self.chain_code).map_err(|_| Slip10Error::HmacInitError)?;
        mac.update(&data);
        let result = mac.finalize().into_bytes();

        let mut private_key = [0u8; 32];
        let mut chain_code = [0u8; 32];
        private_key.copy_from_slice(&result[0..32]);
        chain_code.copy_from_slice(&result[32..64]);

        Ok(Self {
            private_key,
            chain_code,
        })
    }

    /// Deriva a chave pública Ed25519 de 32 bytes correspondente à chave privada.
    pub fn public_key(&self) -> Result<[u8; 32], Slip10Error> {
        let key_pair = Ed25519KeyPair::from_seed_unchecked(&self.private_key)
            .map_err(|e| Slip10Error::KeyPairGenerationFailed(format!("{:?}", e)))?;

        let mut pubkey = [0u8; 32];
        pubkey.copy_from_slice(key_pair.public_key().as_ref());
        Ok(pubkey)
    }

    /// Assina uma mensagem utilizando a chave privada Ed25519 em memória segura.
    pub fn sign(&self, message: &[u8]) -> Result<[u8; 64], Slip10Error> {
        let key_pair = Ed25519KeyPair::from_seed_unchecked(&self.private_key)
            .map_err(|e| Slip10Error::KeyPairGenerationFailed(format!("{:?}", e)))?;
        let sig = key_pair.sign(message);
        let mut sig_bytes = [0u8; 64];
        sig_bytes.copy_from_slice(sig.as_ref());
        Ok(sig_bytes)
    }
}

/// Deriva a chave Ed25519 do titular no caminho padrão oficial m/7391'/0'/0'/0'.
pub fn derive_holder_ssi_key(seed: &[u8]) -> Result<ExtendedEd25519Key, Slip10Error> {
    let mut current = ExtendedEd25519Key::master_from_seed(seed)?;

    for &index in &DEVOS_DEFAULT_SSI_PATH {
        current = current.derive_child(index)?;
    }

    Ok(current)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_slip10_ed25519_official_test_vector_1() {
        // Vetor oficial SLIP-0010 para Ed25519 - Test Vector 1
        // Seed (hex): 000102030405060708090a0b0c0d0e0f
        let seed_hex = "000102030405060708090a0b0c0d0e0f";
        let seed = hex::decode(seed_hex).expect("hex decode");

        let master = ExtendedEd25519Key::master_from_seed(&seed).expect("master key");

        // Master private key esperado do Test Vector 1
        let expected_master_priv =
            "2b4be7f19ee27bbf30c667b642d5f4aa69fd169872f8fc3059c08ebae2eb19e7";
        assert_eq!(hex::encode(master.private_key), expected_master_priv);

        let expected_master_chain =
            "90046a93de5380a72b5e45010748567d5ea02bbf6522f979e05c0d8d8ca9fffb";
        assert_eq!(hex::encode(master.chain_code), expected_master_chain);

        // Filho m/0' derivado com sucesso
        let child_0 = master.derive_child(HARDENED_OFFSET).expect("child 0'");
        assert_eq!(child_0.private_key.len(), 32);
        assert_eq!(child_0.chain_code.len(), 32);
    }

    #[test]
    fn test_rejects_non_hardened_derivation() {
        let seed = [1u8; 64];
        let master = ExtendedEd25519Key::master_from_seed(&seed).expect("master");
        let err = master.derive_child(0).unwrap_err();
        assert_eq!(err, Slip10Error::NonHardenedIndex(0));
    }

    #[test]
    fn test_deterministic_holder_derivation() {
        let seed = [99u8; 64];
        let key1 = derive_holder_ssi_key(&seed).expect("first");
        let key2 = derive_holder_ssi_key(&seed).expect("second");

        assert_eq!(key1.private_key, key2.private_key);
        assert_eq!(key1.chain_code, key2.chain_code);

        let pub1 = key1.public_key().expect("pub1");
        let pub2 = key2.public_key().expect("pub2");
        assert_eq!(pub1, pub2);
    }
}
