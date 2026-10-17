use std::str::FromStr;
use bip32::{DerivationPath, XPrv};
use k256::PublicKey;
use serde::{Deserialize, Serialize};

use super::address::public_key_to_address;

#[derive(Debug, thiserror::Error)]
pub enum DerivationError {
    #[error("Invalid derivation path: {0}")]
    InvalidPath(String),
    #[error("BIP32 derivation error: {0}")]
    Bip32Error(String),
    #[error("Public key parse error: {0}")]
    KeyError(String),
}

/// Representa o preview público de uma carteira derivada
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DerivedWalletPreview {
    pub index: u32,
    pub derivation_path: String,
    pub address: String,
    pub label: String,
    pub network: String,
}

pub struct DerivationService;

impl DerivationService {
    /// Deriva a chave estendida privada a partir da seed de 64 bytes e do caminho BIP-44
    pub fn derive_xprv(seed: &[u8; 64], path_str: &str) -> Result<XPrv, DerivationError> {
        let path = DerivationPath::from_str(path_str)
            .map_err(|e| DerivationError::InvalidPath(format!("{}: {}", path_str, e)))?;

        XPrv::derive_from_path(seed, &path)
            .map_err(|e| DerivationError::Bip32Error(e.to_string()))
    }

    /// Deriva a chave pública e endereço EVM para um caminho específico
    pub fn derive_address(seed: &[u8; 64], path_str: &str) -> Result<String, DerivationError> {
        let xprv = Self::derive_xprv(seed, path_str)?;
        let pubkey_bytes = xprv.public_key().to_bytes();
        let public_key = PublicKey::from_sec1_bytes(&pubkey_bytes)
            .map_err(|e| DerivationError::KeyError(e.to_string()))?;

        Ok(public_key_to_address(&public_key))
    }

    /// Deriva um lote de carteiras EVM para um ramo de conta e índices especificados.
    /// Exemplo: `m/44'/60'/{account_branch}'/0/{index}`
    pub fn derive_batch(
        seed: &[u8; 64],
        account_branch: u32,
        count: u32,
        base_label: &str,
        network: &str,
    ) -> Result<Vec<DerivedWalletPreview>, DerivationError> {
        let mut previews = Vec::with_capacity(count as usize);

        for i in 0..count {
            let path_str = format!("m/44'/60'/{}'/0/{}", account_branch, i);
            let address = Self::derive_address(seed, &path_str)?;
            let label = if base_label.trim().is_empty() {
                format!("Conta #{}", i + 1)
            } else {
                format!("{} #{}", base_label.trim(), i + 1)
            };

            previews.push(DerivedWalletPreview {
                index: i,
                derivation_path: path_str,
                address,
                label,
                network: network.to_string(),
            });
        }

        Ok(previews)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::wallets::mnemonic::MnemonicService;

    #[test]
    fn test_derivation_standard_test_vector() {
        // Mnemônica de teste canônica BIP-39 (12 palavras "abandon ... about")
        let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let seed = MnemonicService::to_seed(phrase, "").expect("seed valida");

        // Caminho padrao Ethereum: m/44'/60'/0'/0/0
        let path = "m/44'/60'/0'/0/0";
        let addr = DerivationService::derive_address(&seed, path).expect("derivação ok");

        // Endereço conhecido e auditado para essa seed e caminho
        assert_eq!(addr, "0x9858EfFD232B4033E47d90003D41EC34EcaEda94");

        // Caminho índice 1: m/44'/60'/0'/0/1
        let path1 = "m/44'/60'/0'/0/1";
        let addr1 = DerivationService::derive_address(&seed, path1).expect("derivação ok");
        assert_eq!(addr1, "0x6Fac4D18c912343BF86fa7049364Dd4E424Ab9C0");
    }

    #[test]
    fn test_derivation_batch_consistency() {
        let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let seed = MnemonicService::to_seed(phrase, "").expect("seed valida");

        let batch = DerivationService::derive_batch(&seed, 0, 3, "DAO Tesouraria", "Arbitrum One")
            .expect("batch ok");

        assert_eq!(batch.len(), 3);
        assert_eq!(batch[0].derivation_path, "m/44'/60'/0'/0/0");
        assert_eq!(batch[0].address, "0x9858EfFD232B4033E47d90003D41EC34EcaEda94");
        assert_eq!(batch[1].derivation_path, "m/44'/60'/0'/0/1");
        assert_eq!(batch[1].address, "0x6Fac4D18c912343BF86fa7049364Dd4E424Ab9C0");
        assert_eq!(batch[0].label, "DAO Tesouraria #1");
        assert_eq!(batch[0].network, "Arbitrum One");
    }
}
