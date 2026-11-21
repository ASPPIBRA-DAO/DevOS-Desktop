//! Modelos de dados e regras de validação para Perfil e Identidade Civil.
//!
//! Não registrar dados pessoais nos logs do sistema (LGPD / Privacidade em primeiro lugar).

use std::fmt;

use chrono::Datelike;
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

pub const CURRENT_PROFILE_PAYLOAD_VERSION: u32 = 1;

/// Tipo de pessoa jurídica ou física.
pub const PERSON_TYPE_PF: &str = "PF";
pub const PERSON_TYPE_PJ: &str = "PJ";

/// DTO canônico de presenças sociais digitais cifrado no cofre.
#[derive(Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub struct SocialLinksDto {
    #[serde(default)]
    pub facebook: Option<String>,
    #[serde(default)]
    pub instagram: Option<String>,
    #[serde(default)]
    pub linkedin: Option<String>,
    #[serde(default)]
    pub twitter: Option<String>,
}

impl fmt::Debug for SocialLinksDto {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("SocialLinksDto")
            .field("facebook", &self.facebook.as_ref().map(|_| "[REDACTED]"))
            .field("instagram", &self.instagram.as_ref().map(|_| "[REDACTED]"))
            .field("linkedin", &self.linkedin.as_ref().map(|_| "[REDACTED]"))
            .field("twitter", &self.twitter.as_ref().map(|_| "[REDACTED]"))
            .finish()
    }
}

impl Zeroize for SocialLinksDto {
    fn zeroize(&mut self) {
        self.facebook.zeroize();
        self.instagram.zeroize();
        self.linkedin.zeroize();
        self.twitter.zeroize();
    }
}

/// DTO canônico do Perfil do Usuário e Qualificação Civil exposto via Tauri IPC.
///
/// Implementa `Debug` com redação estrita de PII (`[REDACTED_BY_LGPD]`) e trait `Zeroize` para
/// higienização explícita de memória. Possui `#[serde(default)]` no struct para evolução retrocompatível de schema.
#[derive(Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", default)]
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
    #[serde(default)]
    pub social_links: Option<SocialLinksDto>,
}

impl fmt::Debug for UserProfileDto {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("UserProfileDto")
            .field("person_type", &self.person_type)
            .field("username", &"[REDACTED_BY_LGPD]")
            .field("is_public", &self.is_public)
            .field("completeness_score", &self.completeness_score)
            .field("revision", &self.revision)
            .field("updated_at", &self.updated_at)
            .field("pii_data", &"[REDACTED_BY_LGPD]")
            .finish()
    }
}

impl Zeroize for UserProfileDto {
    fn zeroize(&mut self) {
        self.person_type.zeroize();
        self.username.zeroize();
        self.first_name.zeroize();
        self.last_name.zeroize();
        self.display_name.zeroize();
        self.cpf.zeroize();
        self.rg.zeroize();
        self.rg_issuer.zeroize();
        self.cnh.zeroize();
        self.cnh_category.zeroize();
        self.mother_name.zeroize();
        self.father_name.zeroize();
        self.birth_date.zeroize();
        self.nationality.zeroize();
        self.marital_status.zeroize();
        self.company_name.zeroize();
        self.cnpj.zeroize();
        self.legal_representative.zeroize();
        self.legal_representative_cpf.zeroize();
        self.email.zeroize();
        self.phone_number.zeroize();
        self.country.zeroize();
        self.zip_code.zeroize();
        self.state.zeroize();
        self.city.zeroize();
        self.neighborhood.zeroize();
        self.address.zeroize();
        self.address_number.zeroize();
        self.complement.zeroize();
        self.occupation.zeroize();
        self.company.zeroize();
        self.website.zeroize();
        self.about.zeroize();
        self.is_public.zeroize();
        self.completeness_score.zeroize();
        self.revision.zeroize();
        self.updated_at.zeroize();
        self.photo_url.zeroize();
        self.cover_url.zeroize();
        self.linked_providers.zeroize();
        self.social_links.zeroize();
    }
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
            social_links: None,
        }
    }
}

/// Projeção pública com allowlist estrita de campos não-sensíveis.
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
    #[serde(default)]
    pub social_links: Option<SocialLinksDto>,
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
            social_links: self.social_links.clone(),
        })
    }
}

/// Payload de requisição para salvar ou atualizar o perfil.
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveUserProfileRequest {
    #[serde(default)]
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
    #[serde(default, skip_deserializing)]
    pub linked_providers: Vec<String>,
    #[serde(default)]
    pub social_links: Option<SocialLinksDto>,
    /// Campos (camelCase) a apagar explicitamente (Direito à Eliminação / LGPD).
    #[serde(default)]
    pub clear_fields: Vec<String>,
    pub expected_revision: Option<u64>,
}

impl fmt::Debug for SaveUserProfileRequest {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("SaveUserProfileRequest")
            .field("person_type", &self.person_type)
            .field("is_public", &self.is_public)
            .field("clear_fields", &self.clear_fields)
            .field("expected_revision", &self.expected_revision)
            .field("pii_data", &"[REDACTED_BY_LGPD]")
            .finish()
    }
}

impl Zeroize for SaveUserProfileRequest {
    fn zeroize(&mut self) {
        self.person_type.zeroize();
        self.username.zeroize();
        self.first_name.zeroize();
        self.last_name.zeroize();
        self.display_name.zeroize();
        self.cpf.zeroize();
        self.rg.zeroize();
        self.rg_issuer.zeroize();
        self.cnh.zeroize();
        self.cnh_category.zeroize();
        self.mother_name.zeroize();
        self.father_name.zeroize();
        self.birth_date.zeroize();
        self.nationality.zeroize();
        self.marital_status.zeroize();
        self.company_name.zeroize();
        self.cnpj.zeroize();
        self.legal_representative.zeroize();
        self.legal_representative_cpf.zeroize();
        self.email.zeroize();
        self.phone_number.zeroize();
        self.country.zeroize();
        self.zip_code.zeroize();
        self.state.zeroize();
        self.city.zeroize();
        self.neighborhood.zeroize();
        self.address.zeroize();
        self.address_number.zeroize();
        self.complement.zeroize();
        self.occupation.zeroize();
        self.company.zeroize();
        self.website.zeroize();
        self.about.zeroize();
        self.photo_url.zeroize();
        self.cover_url.zeroize();
        self.linked_providers.zeroize();
        self.social_links.zeroize();
        self.clear_fields.zeroize();
        self.expected_revision.zeroize();
    }
}

impl Default for SaveUserProfileRequest {
    fn default() -> Self {
        Self {
            person_type: String::new(),
            username: None,
            first_name: String::new(),
            last_name: String::new(),
            display_name: None,
            cpf: String::new(),
            rg: String::new(),
            rg_issuer: String::new(),
            cnh: String::new(),
            cnh_category: String::new(),
            mother_name: String::new(),
            father_name: String::new(),
            birth_date: String::new(),
            nationality: String::new(),
            marital_status: String::new(),
            company_name: String::new(),
            cnpj: String::new(),
            legal_representative: String::new(),
            legal_representative_cpf: String::new(),
            email: String::new(),
            phone_number: String::new(),
            country: String::new(),
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
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
            social_links: None,
            clear_fields: Vec::new(),
            expected_revision: None,
        }
    }
}

// ----------------------------------------------------------------------
// Rotinas de Validação de Documentos Oficiais Brasileiros & Sanitização
// ----------------------------------------------------------------------

/// Verifica a presença de caracteres de controle proibidos (exceto \n, \r, \t),
/// controles bidirecionais e caracteres invisíveis que possam ocultar conteúdo ou alterar
/// a semântica visual (bidi, separadores de linha, joiners invisíveis, BOM, bloco Tags).
pub fn contains_dangerous_control_or_bidi(text: &str) -> bool {
    text.chars().any(|c| {
        (c != '\n' && c != '\r' && c != '\t' && c.is_control())
            || matches!(
                c,
                '\u{061C}'                      // Arabic Letter Mark (bidi)
                    | '\u{200B}'..='\u{200F}'   // ZWSP, ZWNJ, ZWJ, LRM, RLM
                    | '\u{2028}'..='\u{2029}'   // Separadores de linha/parágrafo
                    | '\u{202A}'..='\u{202E}'   // Embeddings/overrides bidi
                    | '\u{2060}'..='\u{2064}'   // Word joiner e operadores invisíveis
                    | '\u{2066}'..='\u{206F}'   // Isolates bidi e controles adicionais
                    | '\u{FEFF}'                // BOM / ZWNBSP
                    | '\u{E0000}'..='\u{E007F}' // Bloco Tags (texto invisível)
            )
    })
}

/// Higieniza mantendo apenas dígitos decimais.
pub fn extract_digits(input: &str) -> String {
    input.chars().filter(|c| c.is_ascii_digit()).collect()
}

/// Validação algorítmica rigorosa de CPF com dois dígitos verificadores
/// (sem alocação durante a validação; apenas a string formatada final aloca).
pub fn validate_cpf(raw: &str) -> Result<String, &'static str> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }

    if trimmed.len() > 64 {
        return Err("O CPF informado excede o limite de tamanho permitido.");
    }

    let mut nums = [0u32; 11];
    let mut len = 0usize;

    for c in trimmed.chars() {
        if c.is_ascii_digit() {
            if len >= 11 {
                return Err("O CPF deve conter exatamente 11 dígitos numéricos.");
            }
            nums[len] = (c as u8 - b'0') as u32;
            len += 1;
        } else if c != '.' && c != '-' && !c.is_whitespace() {
            return Err(
                "O CPF contém caracteres inválidos. Utilize apenas números e separadores válidos.",
            );
        }
    }

    if len != 11 {
        return Err("O CPF deve conter exatamente 11 dígitos numéricos.");
    }

    if nums.iter().all(|&d| d == nums[0]) {
        return Err("O CPF informado é inválido (dígitos repetidos).");
    }

    // Primeiro dígito verificador
    let sum1: u32 = nums[0..9]
        .iter()
        .enumerate()
        .map(|(idx, &val)| val * (10 - idx as u32))
        .sum();
    let mod1 = (sum1 * 10) % 11;
    let expected_d1 = if mod1 == 10 { 0 } else { mod1 };
    if expected_d1 != nums[9] {
        return Err("Dígito verificador do CPF inválido.");
    }

    // Segundo dígito verificador
    let sum2: u32 = nums[0..10]
        .iter()
        .enumerate()
        .map(|(idx, &val)| val * (11 - idx as u32))
        .sum();
    let mod2 = (sum2 * 10) % 11;
    let expected_d2 = if mod2 == 10 { 0 } else { mod2 };
    if expected_d2 != nums[10] {
        return Err("Dígito verificador do CPF inválido.");
    }

    Ok(format!(
        "{}{}{}.{}{}{}.{}{}{}-{}{}",
        nums[0], nums[1], nums[2], nums[3], nums[4], nums[5], nums[6], nums[7], nums[8], nums[9],
        nums[10]
    ))
}

/// Validação algorítmica rigorosa de CNPJ (Suporte a Numérico e Alfanumérico conforme IN RFB nº 2.229/2024).
///
/// Aceita o formato numérico legado (14 dígitos) e o novo formato alfanumérico em vigência em 2026.
/// As 12 primeiras posições podem conter dígitos e letras maiúsculas (A-Z).
/// As 2 posições finais são estritamente os dígitos verificadores numéricos calculados por Módulo 11 (ASCII - 48).
pub fn validate_cnpj(raw: &str) -> Result<String, &'static str> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }

    if trimmed.len() > 64 {
        return Err("O CNPJ informado excede o limite de tamanho permitido.");
    }

    let mut bytes = [0u8; 14];
    let mut len = 0usize;

    for c in trimmed.chars() {
        if c.is_ascii_alphanumeric() {
            if len >= 14 {
                return Err("O CNPJ deve conter exatamente 14 posições alfanuméricas.");
            }
            bytes[len] = (c as u8).to_ascii_uppercase();
            len += 1;
        } else if c != '.' && c != '/' && c != '-' && !c.is_whitespace() {
            return Err(
                "O CNPJ contém caracteres inválidos. Utilize apenas letras, números e separadores válidos.",
            );
        }
    }

    if len != 14 {
        return Err("O CNPJ deve conter exatamente 14 posições alfanuméricas.");
    }

    if !bytes[12].is_ascii_digit() || !bytes[13].is_ascii_digit() {
        return Err("Os dois últimos caracteres do CNPJ devem ser dígitos verificadores numéricos.");
    }

    if bytes.iter().all(|&b| b == bytes[0]) {
        return Err("O CNPJ informado é inválido (todos os caracteres idênticos).");
    }

    let mut values = [0u32; 12];
    for (dst, &b) in values.iter_mut().zip(bytes[0..12].iter()) {
        *dst = (b as u32) - 48;
    }

    // 1º Dígito Verificador (pesos: 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
    const WEIGHTS1: [u32; 12] = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum1: u32 = values.iter().zip(WEIGHTS1).map(|(&v, w)| v * w).sum();
    let rem1 = sum1 % 11;
    let expected_d1 = if rem1 < 2 { 0 } else { 11 - rem1 };
    if expected_d1 != (bytes[12] - b'0') as u32 {
        return Err("Dígito verificador do CNPJ inválido.");
    }

    // 2º Dígito Verificador (pesos: 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3)
    const WEIGHTS2: [u32; 12] = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3];
    let sum2: u32 = values.iter().zip(WEIGHTS2).map(|(&v, w)| v * w).sum::<u32>()
        + (expected_d1 * 2);
    let rem2 = sum2 % 11;
    let expected_d2 = if rem2 < 2 { 0 } else { 11 - rem2 };
    if expected_d2 != (bytes[13] - b'0') as u32 {
        return Err("Dígito verificador do CNPJ inválido.");
    }

    let normalized = std::str::from_utf8(&bytes)
        .map_err(|_| "O CNPJ contém caracteres inválidos.")?;
    Ok(format!(
        "{}.{}.{}/{}-{}",
        &normalized[0..2],
        &normalized[2..5],
        &normalized[5..8],
        &normalized[8..12],
        &normalized[12..14]
    ))
}

/// Valida e formata CEP brasileiro (8 dígitos, zero alocações intermediárias de heap).
pub fn validate_cep(raw: &str) -> Result<String, &'static str> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }

    if trimmed.len() > 32 {
        return Err("O CEP informado excede o limite de tamanho permitido.");
    }

    let mut digits = [0u8; 8];
    let mut len = 0usize;

    for c in trimmed.chars() {
        if c.is_ascii_digit() {
            if len >= 8 {
                return Err("O CEP deve conter exatamente 8 dígitos.");
            }
            digits[len] = c as u8;
            len += 1;
        } else if c != '-' && !c.is_whitespace() {
            return Err("O CEP contém caracteres inválidos. Utilize apenas números e hífen.");
        }
    }

    if len != 8 {
        return Err("O CEP deve conter exatamente 8 dígitos.");
    }

    let s = std::str::from_utf8(&digits).unwrap_or_default();
    Ok(format!("{}-{}", &s[0..5], &s[5..8]))
}

/// Valida data no formato ISO YYYY-MM-DD ou DD/MM/YYYY e retorna formato canônico ISO YYYY-MM-DD.
pub fn validate_and_normalize_date(raw: &str) -> Result<String, &'static str> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }

    if trimmed.len() > 32 {
        return Err("Formato de data inválido. Utilize AAAA-MM-DD ou DD/MM/AAAA.");
    }

    let parsed = if trimmed.contains('/') {
        let mut parts = trimmed.split('/');
        let (Some(d), Some(m), Some(y), None) =
            (parts.next(), parts.next(), parts.next(), parts.next())
        else {
            return Err("Formato de data inválido. Utilize AAAA-MM-DD ou DD/MM/AAAA.");
        };

        if d.is_empty()
            || m.is_empty()
            || d.len() > 2
            || m.len() > 2
            || y.len() != 4
            || !d.bytes().all(|b| b.is_ascii_digit())
            || !m.bytes().all(|b| b.is_ascii_digit())
            || !y.bytes().all(|b| b.is_ascii_digit())
        {
            return Err("Formato de data inválido. Utilize AAAA-MM-DD ou DD/MM/AAAA.");
        }

        let day: u32 = d.parse().map_err(|_| "Dia inválido na data.")?;
        let month: u32 = m.parse().map_err(|_| "Mês inválido na data.")?;
        let year: i32 = y.parse().map_err(|_| "Ano inválido na data.")?;

        chrono::NaiveDate::from_ymd_opt(year, month, day)
            .ok_or("Data inválida ou inexistente no calendário gregoriano.")?
    } else {
        chrono::NaiveDate::parse_from_str(trimmed, "%Y-%m-%d")
            .map_err(|_| "Data inválida ou inexistente no calendário gregoriano.")?
    };

    let today = chrono::Utc::now().date_naive();
    if parsed.year() < 1900 {
        return Err("O ano de nascimento deve ser plausível (a partir de 1900).");
    }

    if parsed > today {
        return Err("A data de nascimento não pode ser posterior à data atual.");
    }

    Ok(parsed.format("%Y-%m-%d").to_string())
}

/// Calcula a taxa de completude dos dados cadastrais (0 a 100%).
pub fn calculate_completeness_score(profile: &UserProfileDto) -> u32 {
    let filled = |s: &str| !s.trim().is_empty();
    let mut score = 0u32;

    if profile.person_type == PERSON_TYPE_PJ {
        if filled(&profile.company_name) { score += 20; }
        if filled(&profile.cnpj) { score += 20; }
        if filled(&profile.legal_representative) { score += 15; }
        if filled(&profile.legal_representative_cpf) { score += 10; }
        if filled(&profile.email) { score += 10; }
        if filled(&profile.phone_number) { score += 5; }
        if filled(&profile.zip_code) { score += 5; }
        if filled(&profile.city) && filled(&profile.state) { score += 5; }
        if filled(&profile.address) { score += 5; }
        if filled(&profile.occupation) { score += 5; }
    } else {
        if filled(&profile.first_name) { score += 10; }
        if filled(&profile.last_name) { score += 10; }
        if filled(&profile.cpf) { score += 20; }
        if filled(&profile.birth_date) { score += 10; }
        if filled(&profile.rg) || filled(&profile.cnh) { score += 10; }
        if filled(&profile.mother_name) { score += 5; }
        if filled(&profile.email) { score += 10; }
        if filled(&profile.phone_number) { score += 5; }
        if filled(&profile.zip_code) { score += 5; }
        if filled(&profile.city) && filled(&profile.state) { score += 5; }
        if filled(&profile.address) { score += 5; }
        if filled(&profile.occupation) || filled(&profile.about) { score += 5; }
    }

    score.min(100)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cpf_validation() {
        let valid_cpf = "52998224725";
        assert!(validate_cpf(valid_cpf).is_ok());
        assert_eq!(validate_cpf(valid_cpf).unwrap(), "529.982.247-25");
        assert_eq!(validate_cpf("529.982.247-25").unwrap(), "529.982.247-25");

        assert!(validate_cpf("11111111111").is_err());
        assert!(validate_cpf("00000000000").is_err());
        assert!(validate_cpf("52998224726").is_err());
        assert!(validate_cpf("529.982.247-2A").is_err());
        assert!(validate_cpf("529@982.247-25").is_err());
        assert_eq!(validate_cpf("").unwrap(), "");
    }

    #[test]
    fn test_cnpj_numeric_validation() {
        let valid_cnpj = "00000000000191";
        assert!(validate_cnpj(valid_cnpj).is_ok());
        assert_eq!(validate_cnpj(valid_cnpj).unwrap(), "00.000.000/0001-91");
        assert_eq!(
            validate_cnpj("00.000.000/0001-91").unwrap(),
            "00.000.000/0001-91"
        );

        assert!(validate_cnpj("00000000000192").is_err());
        assert!(validate_cnpj("11111111111111").is_err());
        assert_eq!(validate_cnpj("").unwrap(), "");
    }

    #[test]
    fn test_cnpj_alphanumeric_validation() {
        let valid_alpha = "12ABC34501DE35";
        assert!(validate_cnpj(valid_alpha).is_ok());
        assert_eq!(validate_cnpj(valid_alpha).unwrap(), "12.ABC.345/01DE-35");
        assert_eq!(
            validate_cnpj("12.abc.345/01de-35").unwrap(),
            "12.ABC.345/01DE-35"
        );

        assert!(validate_cnpj("12ABC34501DE36").is_err());
        assert!(validate_cnpj("12.ABC.345/01DE-3@").is_err());
        assert!(validate_cnpj("AAAAAAAAAAAAAA").is_err());
    }

    #[test]
    fn test_date_validation_leap_year_and_future() {
        assert_eq!(
            validate_and_normalize_date("1985-05-15").unwrap(),
            "1985-05-15"
        );
        assert_eq!(
            validate_and_normalize_date("15/05/1985").unwrap(),
            "1985-05-15"
        );
        assert_eq!(
            validate_and_normalize_date("2000-02-29").unwrap(),
            "2000-02-29"
        );
        assert_eq!(
            validate_and_normalize_date("29/02/2000").unwrap(),
            "2000-02-29"
        );

        assert!(validate_and_normalize_date("2001-02-29").is_err());
        assert!(validate_and_normalize_date("2099-01-01").is_err());
        assert!(validate_and_normalize_date("1850-01-01").is_err());
        assert!(validate_and_normalize_date("+1/+5/1990").is_err());
        assert!(validate_and_normalize_date("15/+5/1990").is_err());
    }

    #[test]
    fn test_completeness_scores_reach_exact_100() {
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

    #[test]
    fn test_dangerous_invisible_and_bidi_extended_set() {
        for s in [
            "a\u{061C}b",
            "a\u{2028}b",
            "a\u{2029}b",
            "a\u{2060}b",
            "a\u{FEFF}b",
            "a\u{E0041}b",
        ] {
            assert!(contains_dangerous_control_or_bidi(s), "deveria rejeitar {:?}", s);
        }
        assert!(!contains_dangerous_control_or_bidi("José & Cia.\nLinha 2\tTab"));
    }

    #[test]
    fn test_zeroize_clears_all_pii_fields_including_username_nationality_country() {
        let mut profile = UserProfileDto {
            username: "usuario_privado".to_string(),
            nationality: "Portuguesa".to_string(),
            country: "Portugal".to_string(),
            cpf: "529.982.247-25".to_string(),
            ..Default::default()
        };
        profile.zeroize();
        assert!(profile.username.is_empty());
        assert!(profile.nationality.is_empty());
        assert!(profile.country.is_empty());
        assert!(profile.cpf.is_empty());

        let mut req = SaveUserProfileRequest {
            username: Some("usuario_privado".to_string()),
            nationality: "Portuguesa".to_string(),
            country: "Portugal".to_string(),
            ..Default::default()
        };
        req.zeroize();
        assert!(req.username.is_none());
        assert!(req.nationality.is_empty());
        assert!(req.country.is_empty());
    }

    #[test]
    fn test_profile_dto_tolerates_payload_missing_fields() {
        let dto: UserProfileDto =
            serde_json::from_str(r#"{"personType":"PF","username":"abc"}"#)
                .expect("payload antigo deve ser aceito");
        assert_eq!(dto.username, "abc");
        assert_eq!(dto.nationality, "Brasileira");
        assert!(dto.linked_providers.is_empty());
    }

    #[test]
    fn test_save_request_serde_defaults() {
        let req: SaveUserProfileRequest =
            serde_json::from_str(r#"{"linkedProviders":["google.com"]}"#).unwrap();
        assert_eq!(req.person_type, "");
        assert!(req.linked_providers.is_empty());
        assert!(req.clear_fields.is_empty());
        assert_eq!(req.expected_revision, None);
    }
}
