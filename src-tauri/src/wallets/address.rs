use k256::elliptic_curve::sec1::ToEncodedPoint;
use k256::PublicKey;
use tiny_keccak::{Hasher, Keccak};

/// Calcula o hash Keccak-256 de uma sequência de bytes
pub fn keccak256(data: &[u8]) -> [u8; 32] {
    let mut hasher = Keccak::v256();
    let mut output = [0u8; 32];
    hasher.update(data);
    hasher.finalize(&mut output);
    output
}

/// Aplica a formatação de checksum EIP-55 a um endereço hexadecimal (sem ou com 0x)
pub fn to_eip55_checksum(address_hex: &str) -> String {
    let clean_hex = address_hex.strip_prefix("0x").unwrap_or(address_hex).to_ascii_lowercase();
    if clean_hex.len() != 40 {
        return format!("0x{}", clean_hex);
    }

    let hash = keccak256(clean_hex.as_bytes());
    let mut checksummed = String::with_capacity(42);
    checksummed.push_str("0x");

    for (i, c) in clean_hex.chars().enumerate() {
        let byte_idx = i / 2;
        let nibble = if i % 2 == 0 {
            (hash[byte_idx] >> 4) & 0x0f
        } else {
            hash[byte_idx] & 0x0f
        };

        if nibble >= 8 {
            checksummed.push(c.to_ascii_uppercase());
        } else {
            checksummed.push(c.to_ascii_lowercase());
        }
    }

    checksummed
}

/// Converte uma chave pública secp256k1 em um endereço EVM no padrão EIP-55
pub fn public_key_to_address(pubkey: &PublicKey) -> String {
    // Ponto não comprimido: 65 bytes (0x04 || X || Y)
    let encoded = pubkey.to_encoded_point(false);
    let bytes = encoded.as_bytes();

    // Keccak-256 dos 64 bytes (sem o prefixo 0x04)
    let hash = keccak256(&bytes[1..65]);

    // Os últimos 20 bytes compõem o endereço Ethereum
    let raw_address_hex = hex::encode(&hash[12..32]);
    to_eip55_checksum(&raw_address_hex)
}

/// Valida se uma string é um endereço EVM válido (42 caracteres, prefixo 0x, hex válido)
pub fn is_valid_evm_address(address: &str) -> bool {
    if !address.starts_with("0x") || address.len() != 42 {
        return false;
    }
    hex::decode(&address[2..]).map(|bytes| bytes.len() == 20).unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_eip55_checksum_known_vectors() {
        // Vetores de teste canônicos oficiais da especificação EIP-55
        let v1 = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
        let v2 = "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359";
        let v3 = "0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB";
        let v4 = "0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb";

        assert_eq!(to_eip55_checksum(&v1.to_lowercase()), v1);
        assert_eq!(to_eip55_checksum(&v2.to_lowercase()), v2);
        assert_eq!(to_eip55_checksum(&v3.to_lowercase()), v3);
        assert_eq!(to_eip55_checksum(&v4.to_lowercase()), v4);
    }

    #[test]
    fn test_validate_evm_address() {
        assert!(is_valid_evm_address("0x52908400098527886E0F7030069857D2E4169EE7"));
        assert!(!is_valid_evm_address("0x52908400098527886E0F7030069857D2E4169EE")); // 41 chars
        assert!(!is_valid_evm_address("52908400098527886E0F7030069857D2E4169EE7")); // sem 0x
        assert!(!is_valid_evm_address("0xZZ908400098527886E0F7030069857D2E4169EE7")); // hex inválido
    }
}
