use bip39::{Language, Mnemonic};
use serde::{Deserialize, Serialize};

#[derive(Debug, thiserror::Error)]
pub enum MnemonicError {
    #[error("Invalid word count: {0}. Supported: 12 or 24")]
    InvalidWordCount(usize),
    #[error("Mnemonic parse error: {0}")]
    ParseError(String),
}

/// Geração e validação de frases mnemônicas BIP-39 com entropia criptograficamente segura.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MnemonicService;

impl MnemonicService {
    /// Gera uma nova mnemônica BIP-39 em inglês com 12 ou 24 palavras
    pub fn generate(word_count: usize) -> Result<String, MnemonicError> {
        if word_count != 12 && word_count != 24 {
            return Err(MnemonicError::InvalidWordCount(word_count));
        }

        let mnemonic = Mnemonic::generate_in(Language::English, word_count)
            .map_err(|e| MnemonicError::ParseError(e.to_string()))?;
        Ok(mnemonic.to_string())
    }

    /// Valida uma frase mnemônica existente
    pub fn validate(phrase: &str) -> bool {
        Mnemonic::parse_in_normalized(Language::English, phrase).is_ok()
    }

    /// Deriva a seed binária de 64 bytes a partir da frase mnemônica e passphrase opcional
    pub fn to_seed(phrase: &str, passphrase: &str) -> Result<[u8; 64], MnemonicError> {
        let mnemonic = Mnemonic::parse_in_normalized(Language::English, phrase)
            .map_err(|e| MnemonicError::ParseError(e.to_string()))?;

        let seed = mnemonic.to_seed(passphrase);
        let mut seed_bytes = [0u8; 64];
        seed_bytes.copy_from_slice(&seed);
        Ok(seed_bytes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_12_and_24_words() {
        let m12 = MnemonicService::generate(12).expect("deve gerar 12 palavras");
        assert_eq!(m12.split_whitespace().count(), 12);
        assert!(MnemonicService::validate(&m12));

        let m24 = MnemonicService::generate(24).expect("deve gerar 24 palavras");
        assert_eq!(m24.split_whitespace().count(), 24);
        assert!(MnemonicService::validate(&m24));
    }

    #[test]
    fn test_reject_invalid_word_count() {
        let err = MnemonicService::generate(15);
        assert!(err.is_err());
    }

    #[test]
    fn test_reject_invalid_mnemonic() {
        assert!(!MnemonicService::validate("invalid word phrase that is not real bip39 checksum"));
    }
}
