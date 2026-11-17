//! Modelos de dados e regras de validação para Perfil e Identidade Civil.
//!
//! Não registrar dados pessoais nos logs do sistema (LGPD / Privacidade em primeiro lugar).

use serde::{Deserialize, Serialize};

/// Tipo de pessoa jurídica ou física.
pub const PERSON_TYPE_PF: &str = "PF";
pub const PERSON_TYPE_PJ: &str = "PJ";

fn default_person_type() -> String {
    PERSON_TYPE_PF.to_string()
}

/// DTO canônico do Perfil do Usuário e Qualificação Civil exposto via Tauri IPC.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UserProfileDto {
    pub person_type: String,
    pub username: String,
    pub first_name: String,
    pub last_name: String,
    pub display_name: String,
    pub cpf: String,
    pub rg: String,
    pub rg_issuer: String,
    pub cnh: String,
    pub cnh_category: String,
    pub mother_name: String,
    pub father_name: String,
    pub birth_date: String,
    pub nationality: String,
    pub marital_status: String,
    pub company_name: String,
    pub cnpj: String,
    pub legal_representative: String,
    pub legal_representative_cpf: String,
    pub email: String,
    pub phone_number: String,
    pub country: String,
    pub zip_code: String,
    pub state: String,
    pub city: String,
    pub neighborhood: String,
    pub address: String,
    pub address_number: String,
    pub complement: String,
    pub occupation: String,
    pub company: String,
    pub website: String,
    pub about: String,
    pub is_public: bool,
    pub completeness_score: u32,
    pub revision: u64,
    pub updated_at: String,
    #[serde(default)]
    pub photo_url: Option<String>,
    #[serde(default)]
    pub cover_url: Option<String>,
    #[serde(default)]
    pub linked_providers: Vec<String>,
}

impl Default for UserProfileDto {
    fn default() -> Self {
        Self {
            person_type: PERSON_TYPE_PF.to_string(),
            username: String::new(),
            first_name: String::new(),
            last_name: String::new(),
            display_name: String::new(),
            cpf: String::new(),
            rg: String::new(),
            rg_issuer: String::new(),
            cnh: String::new(),
            cnh_category: String::new(),
            mother_name: String::new(),
            father_name: String::new(),
            birth_date: String::new(),
            nationality: "Brasileira".to_string(),
            marital_status: String::new(),
            company_name: String::new(),
            cnpj: String::new(),
            legal_representative: String::new(),
            legal_representative_cpf: String::new(),
            email: String::new(),
            phone_number: String::new(),
            country: "Brasil".to_string(),
            zip_code: String::new(),
            state: String::new(),
            city: String::new(),
            neighborhood: String::new(),
            address: String::new(),
            address_number: String::new(),
            complement: String::new(),
            occupation: String::new(),
            company: String::new(),
            website: String::new(),
            about: String::new(),
            is_public: false,
            completeness_score: 0,
            revision: 0,
            updated_at: String::new(),
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
        }
    }
}

/// Projeção pública com allowlist estrita de campos não-sensíveis.
///
/// Dados como CPF, filiação, data de nascimento, RG, CNPJ e endereço residencial
/// NUNCA são expostos em projeções públicas, mesmo que `is_public` seja true.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PublicUserProfileDto {
    pub display_name: String,
    pub username: String,
    pub occupation: String,
    pub company: String,
    pub website: String,
    pub about: String,
    pub photo_url: Option<String>,
    pub cover_url: Option<String>,
    pub is_public: bool,
}

impl UserProfileDto {
    /// Gera a projeção pública segura caso o perfil esteja configurado como público.
    pub fn to_public_projection(&self) -> Option<PublicUserProfileDto> {
        if !self.is_public {
            return None;
        }

        Some(PublicUserProfileDto {
            display_name: self.display_name.clone(),
            username: self.username.clone(),
            occupation: self.occupation.clone(),
            company: self.company.clone(),
            website: self.website.clone(),
            about: self.about.clone(),
            photo_url: self.photo_url.clone(),
            cover_url: self.cover_url.clone(),
            is_public: true,
        })
    }
}

/// Payload de requisição para salvar ou atualizar o perfil.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveUserProfileRequest {
    #[serde(default = "default_person_type")]
    pub person_type: String,
    #[serde(default)]
    pub username: Option<String>,
    #[serde(default)]
    pub first_name: String,
    #[serde(default)]
    pub last_name: String,
    #[serde(default)]
    pub display_name: Option<String>,
    #[serde(default)]
    pub cpf: String,
    #[serde(default)]
    pub rg: String,
    #[serde(default)]
    pub rg_issuer: String,
    #[serde(default)]
    pub cnh: String,
    #[serde(default)]
    pub cnh_category: String,
    #[serde(default)]
    pub mother_name: String,
    #[serde(default)]
    pub father_name: String,
    #[serde(default)]
    pub birth_date: String,
    #[serde(default)]
    pub nationality: String,
    #[serde(default)]
    pub marital_status: String,
    #[serde(default)]
    pub company_name: String,
    #[serde(default)]
    pub cnpj: String,
    #[serde(default)]
    pub legal_representative: String,
    #[serde(default)]
    pub legal_representative_cpf: String,
    #[serde(default)]
    pub email: String,
    #[serde(default)]
    pub phone_number: String,
    #[serde(default)]
    pub country: String,
    #[serde(default)]
    pub zip_code: String,
    #[serde(default)]
    pub state: String,
    #[serde(default)]
    pub city: String,
    #[serde(default)]
    pub neighborhood: String,
    #[serde(default)]
    pub address: String,
    #[serde(default)]
    pub address_number: String,
    #[serde(default)]
    pub complement: String,
    #[serde(default)]
    pub occupation: String,
    #[serde(default)]
    pub company: String,
    #[serde(default)]
    pub website: String,
    #[serde(default)]
    pub about: String,
    #[serde(default)]
    pub is_public: bool,
    #[serde(default)]
    pub photo_url: Option<String>,
    #[serde(default)]
    pub cover_url: Option<String>,
    #[serde(default)]
    pub linked_providers: Vec<String>,
    pub expected_revision: Option<u64>,
}

// ----------------------------------------------------------------------
// Rotinas de Validação de Documentos Oficiais Brasileiros
// ----------------------------------------------------------------------

/// Higieniza mantendo apenas dígitos decimais.
pub fn extract_digits(input: &str) -> String {
    input.chars().filter(|c| c.is_ascii_digit()).collect()
}

/// Validação algorítmica rigorosa de CPF com dois dígitos verificadores.
///
/// Rejeita caracteres inválidos antes de normalizar, valida formato,
/// sequências repetidas e calcula os dois dígitos verificadores (Módulo 11).
pub fn validate_cpf(raw: &str) -> Result<String, &'static str> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }

    // 1. Rejeita caracteres proibidos antes de normalizar
    for c in trimmed.chars() {
        if !c.is_ascii_digit() && c != '.' && c != '-' && !c.is_whitespace() {
            return Err("O CPF contém caracteres inválidos. Utilize apenas números e separadores válidos.");
        }
    }

    let digits = extract_digits(trimmed);
    if digits.len() != 11 {
        return Err("O CPF deve conter exatamente 11 dígitos numéricos.");
    }

    // 2. Rejeita sequências de dígitos todos iguais (00000000000, 11111111111, etc.)
    let first = digits.as_bytes()[0];
    if digits.bytes().all(|b| b == first) {
        return Err("O CPF informado é inválido (dígitos repetidos).");
    }

    let nums: Vec<u32> = digits
        .chars()
        .map(|c| c.to_digit(10).unwrap_or(0))
        .collect();

    // 3. Primeiro dígito verificador
    let sum1: u32 = nums[0..9]
        .iter()
        .enumerate()
        .map(|(idx, &val)| val * (10 - idx as u32))
        .sum();
    let mod1 = (sum1 * 10) % 11;
    let expected_d1 = if mod1 == 10 || mod1 == 11 { 0 } else { mod1 };
    if expected_d1 != nums[9] {
        return Err("Dígito verificador do CPF inválido.");
    }

    // 4. Segundo dígito verificador
    let sum2: u32 = nums[0..10]
        .iter()
        .enumerate()
        .map(|(idx, &val)| val * (11 - idx as u32))
        .sum();
    let mod2 = (sum2 * 10) % 11;
    let expected_d2 = if mod2 == 10 || mod2 == 11 { 0 } else { mod2 };
    if expected_d2 != nums[10] {
        return Err("Dígito verificador do CPF inválido.");
    }

    // Retorna formatado XXX.XXX.XXX-XX
    Ok(format!(
        "{}.{}.{}-{}",
        &digits[0..3],
        &digits[3..6],
        &digits[6..9],
        &digits[9..11]
    ))
}

/// Validação algorítmica rigorosa de CNPJ (Suporte a Numérico e Alfanumérico conforme IN RFB nº 2.229/2024).
///
/// Aceita o formato numérico legado (14 dígitos) e o novo formato alfanumérico em vigência em 2026.
/// As 12 primeiras posições podem conter dígitos e letras maiúsculas (A-Z).
/// As 2 posições finais são estritamente os dígitos verificadores calculados por Módulo 11
/// utilizando a conversão `ASCII(C) - 48`.
pub fn validate_cnpj(raw: &str) -> Result<String, &'static str> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }

    // 1. Rejeita caracteres inválidos antes de normalizar
    for c in trimmed.chars() {
        if !c.is_ascii_alphanumeric() && c != '.' && c != '/' && c != '-' && !c.is_whitespace() {
            return Err("O CNPJ contém caracteres inválidos. Utilize apenas letras, números e separadores válidos.");
        }
    }

    // 2. Normaliza para maiúsculas e remove separadores permitidos
    let normalized: String = trimmed
        .chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .map(|c| c.to_ascii_uppercase())
        .collect();

    if normalized.len() != 14 {
        return Err("O CNPJ deve conter exatamente 14 posições alfanuméricas.");
    }

    // 3. Os dois últimos caracteres devem ser estritamente dígitos decimais
    let bytes = normalized.as_bytes();
    if !bytes[12].is_ascii_digit() || !bytes[13].is_ascii_digit() {
        return Err("Os dois últimos caracteres do CNPJ devem ser dígitos verificadores numéricos.");
    }

    // 4. Rejeita sequências de todos os caracteres idênticos (ex: 00000000000000, AAAAAAAAAAAAAA)
    let first = bytes[0];
    if bytes.iter().all(|&b| b == first) {
        return Err("O CNPJ informado é inválido (todos os caracteres idênticos).");
    }

    // 5. Converte cada caractere das 12 primeiras posições para o valor numérico oficial (ASCII - 48)
    let values: Vec<u32> = bytes[0..12]
        .iter()
        .map(|&b| (b as u32) - 48)
        .collect();

    // 6. Cálculo do 1º Dígito Verificador (pesos: 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
    let weights1: [u32; 12] = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum1: u32 = values
        .iter()
        .zip(weights1.iter())
        .map(|(&v, &w)| v * w)
        .sum();
    let rem1 = sum1 % 11;
    let expected_d1 = if rem1 < 2 { 0 } else { 11 - rem1 };
    let actual_d1 = (bytes[12] - b'0') as u32;

    if expected_d1 != actual_d1 {
        return Err("Dígito verificador do CNPJ inválido.");
    }

    // 7. Cálculo do 2º Dígito Verificador (pesos: 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
    let weights2: [u32; 12] = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3];
    let sum2: u32 = values
        .iter()
        .zip(weights2.iter())
        .map(|(&v, &w)| v * w)
        .sum::<u32>()
        + (expected_d1 * 2);
    let rem2 = sum2 % 11;
    let expected_d2 = if rem2 < 2 { 0 } else { 11 - rem2 };
    let actual_d2 = (bytes[13] - b'0') as u32;

    if expected_d2 != actual_d2 {
        return Err("Dígito verificador do CNPJ inválido.");
    }

    // Retorna formatado no padrão oficial XX.XXX.XXX/XXXX-XX
    Ok(format!(
        "{}.{}.{}/{}-{}",
        &normalized[0..2],
        &normalized[2..5],
        &normalized[5..8],
        &normalized[8..12],
        &normalized[12..14]
    ))
}

/// Valida e formata CEP brasileiro (8 dígitos).
pub fn validate_cep(raw: &str) -> Result<String, &'static str> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }

    for c in trimmed.chars() {
        if !c.is_ascii_digit() && c != '-' && !c.is_whitespace() {
            return Err("O CEP contém caracteres inválidos. Utilize apenas números e hífen.");
        }
    }

    let digits = extract_digits(trimmed);
    if digits.len() != 8 {
        return Err("O CEP deve conter exatamente 8 dígitos.");
    }
    Ok(format!("{}-{}", &digits[0..5], &digits[5..8]))
}

/// Valida data no formato ISO YYYY-MM-DD ou converte de DD/MM/YYYY.
///
/// Valida calendário gregoriano (incluindo anos bissextos), ano plausível (1900 até o ano corrente)
/// e rejeita datas futuras.
pub fn validate_and_normalize_date(raw: &str) -> Result<String, &'static str> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }

    // Se estiver no formato legível DD/MM/YYYY, converter
    let candidate = if trimmed.contains('/') {
        let parts: Vec<&str> = trimmed.split('/').collect();
        if parts.len() == 3 && parts[0].len() <= 2 && parts[1].len() <= 2 && parts[2].len() == 4 {
            let day: u32 = parts[0].parse().map_err(|_| "Dia inválido na data.")?;
            let month: u32 = parts[1].parse().map_err(|_| "Mês inválido na data.")?;
            let year: i32 = parts[2].parse().map_err(|_| "Ano inválido na data.")?;
            format!("{:04}-{:02}-{:02}", year, month, day)
        } else {
            return Err("Formato de data inválido. Utilize AAAA-MM-DD ou DD/MM/AAAA.");
        }
    } else {
        trimmed.to_string()
    };

    let parsed = chrono::NaiveDate::parse_from_str(&candidate, "%Y-%m-%d")
        .map_err(|_| "Data inválida ou inexistente no calendário gregoriano.")?;

    let year = parsed.format("%Y").to_string().parse::<i32>().unwrap_or(0);
    let today = chrono::Utc::now().date_naive();
    let current_year = today.format("%Y").to_string().parse::<i32>().unwrap_or(2026);

    if year < 1900 || year > current_year {
        return Err("O ano de nascimento deve ser plausível (entre 1900 e o ano corrente).");
    }

    if parsed > today {
        return Err("A data de nascimento não pode ser posterior à data atual.");
    }

    Ok(candidate)
}

/// Calcula a taxa de completude dos dados cadastrais (0 a 100%).
///
/// Tanto para PF quanto para PJ, a soma dos pesos atinge exatamente 100%.
pub fn calculate_completeness_score(profile: &UserProfileDto) -> u32 {
    let mut score = 0u32;

    if profile.person_type == PERSON_TYPE_PJ {
        // Pessoa Jurídica (Total: 100)
        if !profile.company_name.trim().is_empty() { score += 20; }
        if !profile.cnpj.trim().is_empty() { score += 20; }
        if !profile.legal_representative.trim().is_empty() { score += 15; }
        if !profile.legal_representative_cpf.trim().is_empty() { score += 10; }
        if !profile.email.trim().is_empty() { score += 10; }
        if !profile.phone_number.trim().is_empty() { score += 5; }
        if !profile.zip_code.trim().is_empty() { score += 5; }
        if !profile.city.trim().is_empty() && !profile.state.trim().is_empty() { score += 5; }
        if !profile.address.trim().is_empty() { score += 5; }
        if !profile.occupation.trim().is_empty() { score += 5; }
    } else {
        // Pessoa Física (Total: 100)
        if !profile.first_name.trim().is_empty() { score += 10; }
        if !profile.last_name.trim().is_empty() { score += 10; }
        if !profile.cpf.trim().is_empty() { score += 20; }
        if !profile.birth_date.trim().is_empty() { score += 10; }
        if !profile.rg.trim().is_empty() || !profile.cnh.trim().is_empty() { score += 10; }
        if !profile.mother_name.trim().is_empty() { score += 5; }
        if !profile.email.trim().is_empty() { score += 10; }
        if !profile.phone_number.trim().is_empty() { score += 5; }
        if !profile.zip_code.trim().is_empty() { score += 5; }
        if !profile.city.trim().is_empty() && !profile.state.trim().is_empty() { score += 5; }
        if !profile.address.trim().is_empty() { score += 5; }
        if !profile.occupation.trim().is_empty() || !profile.about.trim().is_empty() { score += 5; }
    }

    score.min(100)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cpf_validation() {
        // CPF válido com e sem máscara
        let valid_cpf = "52998224725";
        assert!(validate_cpf(valid_cpf).is_ok());
        assert_eq!(validate_cpf(valid_cpf).unwrap(), "529.982.247-25");
        assert_eq!(validate_cpf("529.982.247-25").unwrap(), "529.982.247-25");

        // CPF inválido (todos iguais)
        assert!(validate_cpf("11111111111").is_err());
        assert!(validate_cpf("00000000000").is_err());

        // CPF com dígito errado
        assert!(validate_cpf("52998224726").is_err());

        // CPF com caracteres indevidos
        assert!(validate_cpf("529.982.247-2A").is_err());
        assert!(validate_cpf("529@982.247-25").is_err());

        // CPF vazio aceito em rascunho
        assert_eq!(validate_cpf("").unwrap(), "");
    }

    #[test]
    fn test_cnpj_numeric_validation() {
        // CNPJ numérico legado válido (Banco do Brasil: 00.000.000/0001-91)
        let valid_cnpj = "00000000000191";
        assert!(validate_cnpj(valid_cnpj).is_ok());
        assert_eq!(validate_cnpj(valid_cnpj).unwrap(), "00.000.000/0001-91");
        assert_eq!(validate_cnpj("00.000.000/0001-91").unwrap(), "00.000.000/0001-91");

        // CNPJ numérico com dígito errado
        assert!(validate_cnpj("00000000000192").is_err());
        assert!(validate_cnpj("11111111111111").is_err());

        // CNPJ vazio
        assert_eq!(validate_cnpj("").unwrap(), "");
    }

    #[test]
    fn test_cnpj_alphanumeric_validation() {
        // CNPJ alfanumérico oficial (IN RFB nº 2.229/2024):
        // 12 primeiras posições: "12ABC34501DE"
        // DVs matemáticos: 35
        let valid_alpha = "12ABC34501DE35";
        assert!(validate_cnpj(valid_alpha).is_ok());
        assert_eq!(validate_cnpj(valid_alpha).unwrap(), "12.ABC.345/01DE-35");
        assert_eq!(validate_cnpj("12.abc.345/01de-35").unwrap(), "12.ABC.345/01DE-35");

        // Alfanumérico com DVs errados
        assert!(validate_cnpj("12ABC34501DE36").is_err());

        // Caracteres proibidos (símbolos fora do padrão)
        assert!(validate_cnpj("12.ABC.345/01DE-3@").is_err());

        // Todos idênticos
        assert!(validate_cnpj("AAAAAAAAAAAAAA").is_err());
    }

    #[test]
    fn test_date_validation_leap_year_and_future() {
        // Data válida normal
        assert_eq!(
            validate_and_normalize_date("1985-05-15").unwrap(),
            "1985-05-15"
        );
        assert_eq!(
            validate_and_normalize_date("15/05/1985").unwrap(),
            "1985-05-15"
        );

        // Ano bissexto válido (2000 é bissexto)
        assert_eq!(
            validate_and_normalize_date("2000-02-29").unwrap(),
            "2000-02-29"
        );
        assert_eq!(
            validate_and_normalize_date("29/02/2000").unwrap(),
            "2000-02-29"
        );

        // Ano não-bissexto inválido (2001-02-29 não existe)
        assert!(validate_and_normalize_date("2001-02-29").is_err());

        // Data futura deve ser rejeitada
        assert!(validate_and_normalize_date("2099-01-01").is_err());

        // Ano anterior a 1900 rejeitado
        assert!(validate_and_normalize_date("1850-01-01").is_err());
    }

    #[test]
    fn test_completeness_scores_reach_exact_100() {
        // Teste PF completo
        let mut pf = UserProfileDto::default();
        pf.person_type = "PF".to_string();
        pf.first_name = "Ana".to_string();
        pf.last_name = "Silva".to_string();
        pf.cpf = "529.982.247-25".to_string();
        pf.birth_date = "1990-05-20".to_string();
        pf.rg = "12345678".to_string();
        pf.mother_name = "Maria Silva".to_string();
        pf.email = "ana@test.com".to_string();
        pf.phone_number = "11987654321".to_string();
        pf.zip_code = "01310-100".to_string();
        pf.city = "São Paulo".to_string();
        pf.state = "SP".to_string();
        pf.address = "Av Paulista".to_string();
        pf.occupation = "Engenheira".to_string();
        assert_eq!(calculate_completeness_score(&pf), 100);

        // Teste PJ completo
        let mut pj = UserProfileDto::default();
        pj.person_type = "PJ".to_string();
        pj.company_name = "Minha Empresa Ltda".to_string();
        pj.cnpj = "12.ABC.345/01DE-35".to_string();
        pj.legal_representative = "Carlos Silva".to_string();
        pj.legal_representative_cpf = "529.982.247-25".to_string();
        pj.email = "contato@empresa.com".to_string();
        pj.phone_number = "1133334444".to_string();
        pj.zip_code = "01310-100".to_string();
        pj.city = "São Paulo".to_string();
        pj.state = "SP".to_string();
        pj.address = "Av Paulista 1000".to_string();
        pj.occupation = "Desenvolvimento de Software (CNAE 6201-5)".to_string();
        assert_eq!(calculate_completeness_score(&pj), 100);
    }
}
