use sha2::{Digest, Sha256};

/// Normaliza cadeias de caracteres numéricas provenientes do Excel que sofreram sufixo decimal artificial (.0)
/// preservando rigorosamente zeros à esquerda e sem modificar strings não decimais.
/// Exemplo: "7656.0" -> "7656", "0.0" -> "0", "00123.0" -> "00123", "00123" -> "00123"
pub fn normalize_number_string(val: &str) -> String {
    let trimmed = val.trim();
    if let Some(stripped) = trimmed.strip_suffix(".0") {
        stripped.to_string()
    } else if let Some(stripped) = trimmed.strip_suffix(",0") {
        stripped.to_string()
    } else {
        trimmed.to_string()
    }
}

/// Normaliza e remove espaços redundantes das extremidades e múltiplos espaços internos contíguos
pub fn clean_whitespace(val: &str) -> String {
    val.split_whitespace().collect::<Vec<&str>>().join(" ")
}

/// Separa valores do campo "Numero" que contenham notas de bairro ou loteamento concatenadas após múltiplos espaços
/// Exemplo: " 0                                            CHÁCARAS DE INOÃ" -> ("0", Some("CHÁCARAS DE INOÃ"))
pub fn parse_address_and_number(raw_num: &str) -> (String, Option<String>) {
    let trimmed = raw_num.trim();
    if trimmed.is_empty() {
        return (String::new(), None);
    }

    let parts: Vec<&str> = trimmed
        .split("   ")
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();
    if parts.len() > 1 {
        let number_clean = normalize_number_string(parts[0]);
        let note = parts[1..].join(" ");
        (number_clean, Some(clean_whitespace(&note)))
    } else {
        (normalize_number_string(trimmed), None)
    }
}

/// Calcula o hash criptográfico SHA-256 de uma sequência de bytes e retorna em hexadecimal minúsculo
pub fn sha256_digest(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_number_string_preserves_leading_zeros() {
        assert_eq!(normalize_number_string("7656.0"), "7656");
        assert_eq!(normalize_number_string("0.0"), "0");
        assert_eq!(normalize_number_string("39.0"), "39");
        assert_eq!(normalize_number_string("000123.0"), "000123");
        assert_eq!(normalize_number_string("000123"), "000123");
        assert_eq!(normalize_number_string("  10411.0  "), "10411");
        assert_eq!(normalize_number_string("RI-123.45"), "RI-123.45");
    }

    #[test]
    fn test_clean_whitespace_and_parse_concatenated_number() {
        assert_eq!(
            clean_whitespace("  BRUNO   NUNES    SANTOS  "),
            "BRUNO NUNES SANTOS"
        );
        let (num, note) = parse_address_and_number(
            " 0                                            CHÁCARAS DE INOÃ",
        );
        assert_eq!(num, "0");
        assert_eq!(note, Some("CHÁCARAS DE INOÃ".to_string()));

        let (num_simple, note_none) = parse_address_and_number("  145  ");
        assert_eq!(num_simple, "145");
        assert_eq!(note_none, None);
    }
}
