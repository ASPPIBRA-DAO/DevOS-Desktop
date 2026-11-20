//! Implementação normativa do W3C did:key para chaves públicas Ed25519.
//!
//! Conforme a especificação W3C CCG did:key:
//! - Prefixo Multicodec para Ed25519 public-key: 0xed, 0x01 (varint 0xed01).
//! - Codificação Multibase: Base58BTC com prefixo 'z'.
//! - Prefixo de esquema: "did:key:z..."

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Prefixo Multicodec de 2 bytes para chaves públicas Ed25519 (0xed, 0x01).
pub const ED25519_MULTICODEC_PREFIX: [u8; 2] = [0xed, 0x01];

/// Prefixo canônico do método DID.
pub const DID_KEY_PREFIX: &str = "did:key:";

/// Erros de codificação e decodificação do did:key.
#[derive(Debug, Error, PartialEq, Eq)]
pub enum DidKeyError {
    #[error("DID deve começar com 'did:key:'")]
    InvalidPrefix,

    #[error("Multibase deve começar com 'z' (Base58BTC)")]
    InvalidMultibasePrefix,

    #[error("Falha ao decodificar Base58BTC: {0}")]
    Base58DecodeFailed(String),

    #[error("Tamanho do buffer inválido (esperado 34 bytes com multicodec, recebido {0} bytes)")]
    InvalidBufferLength(usize),

    #[error(
        "Prefixo multicodec inválido (esperado [0xed, 0x01] para Ed25519, recebido [{0:#04x}, {1:#04x}])"
    )]
    InvalidMulticodecPrefix(u8, u8),
}

/// Representação estruturada de um DID W3C do método did:key.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DidKeyIdentity {
    pub did: String,
    pub public_key_hex: String,
    pub key_type: String,
}

/// Codifica uma chave pública Ed25519 de 32 bytes em uma string canônica did:key.
pub fn encode_did_key(public_key: &[u8; 32]) -> String {
    let mut buffer = [0u8; 34];
    buffer[0..2].copy_from_slice(&ED25519_MULTICODEC_PREFIX);
    buffer[2..34].copy_from_slice(public_key);

    let multibase = bs58::encode(&buffer).into_string();
    format!("{}z{}", DID_KEY_PREFIX, multibase)
}

/// Decodifica um did:key e retorna os 32 bytes da chave pública Ed25519 original.
pub fn decode_did_key(did: &str) -> Result<[u8; 32], DidKeyError> {
    if !did.starts_with(DID_KEY_PREFIX) {
        return Err(DidKeyError::InvalidPrefix);
    }

    let remainder = &did[DID_KEY_PREFIX.len()..];
    if !remainder.starts_with('z') {
        return Err(DidKeyError::InvalidMultibasePrefix);
    }

    let base58_payload = &remainder[1..];
    let decoded = bs58::decode(base58_payload)
        .into_vec()
        .map_err(|e| DidKeyError::Base58DecodeFailed(e.to_string()))?;

    if decoded.len() != 34 {
        return Err(DidKeyError::InvalidBufferLength(decoded.len()));
    }

    if decoded[0] != ED25519_MULTICODEC_PREFIX[0] || decoded[1] != ED25519_MULTICODEC_PREFIX[1] {
        return Err(DidKeyError::InvalidMulticodecPrefix(decoded[0], decoded[1]));
    }

    let mut public_key = [0u8; 32];
    public_key.copy_from_slice(&decoded[2..34]);
    Ok(public_key)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_and_decode_w3c_ccg_official_vector() {
        // Vetor oficial da especificação W3C CCG did:key
        // DID: did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH
        let expected_did = "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH";
        let decoded_pubkey = decode_did_key(expected_did).expect("decode official vector");
        let encoded_did = encode_did_key(&decoded_pubkey);
        assert_eq!(encoded_did, expected_did);

        // Vetor 2 com chave pública fixa
        let pubkey_hex = "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a";
        let mut pubkey = [0u8; 32];
        hex::decode_to_slice(pubkey_hex, &mut pubkey).expect("hex decode");
        let generated_did = encode_did_key(&pubkey);
        let recovered = decode_did_key(&generated_did).expect("decode generated");
        assert_eq!(recovered, pubkey);
    }

    #[test]
    fn test_decode_invalid_prefix() {
        let err = decode_did_key("did:web:asppibra.org.br").unwrap_err();
        assert_eq!(err, DidKeyError::InvalidPrefix);
    }

    #[test]
    fn test_decode_invalid_multibase() {
        let err = decode_did_key("did:key:m123456").unwrap_err();
        assert_eq!(err, DidKeyError::InvalidMultibasePrefix);
    }

    #[test]
    fn test_roundtrip_random_keys() {
        let sample_key = [42u8; 32];
        let did = encode_did_key(&sample_key);
        assert!(did.starts_with("did:key:z6Mk"));
        let recovered = decode_did_key(&did).expect("roundtrip");
        assert_eq!(recovered, sample_key);
    }
}
