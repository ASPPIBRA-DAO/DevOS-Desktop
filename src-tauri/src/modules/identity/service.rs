//! Camada de serviço de negócios para Perfil do Usuário e Qualificação Civil.
//!
//! Orquestra validações, criptografia de ponta a ponta (AES-256-GCM com chave derivada
//! do cofre) e persistência transacional em SQLite.

use url::Url;
use zeroize::Zeroizing;

use super::models::{
    calculate_completeness_score, contains_dangerous_control_or_bidi, validate_and_normalize_date,
    validate_cep, validate_cnpj, validate_cpf, SaveUserProfileRequest, SocialLinksDto,
    UserProfileDto, CURRENT_PROFILE_PAYLOAD_VERSION, PERSON_TYPE_PF, PERSON_TYPE_PJ,
};
use super::repository::{IdentityRepository, CONCURRENCY_CONFLICT_PREFIX};
use crate::modules::vault::access_control::{AccessControlError, VaultSession};
use crate::modules::vault::encryption::{AadDomain, AeadEnvelope, Subkeys, VaultCrypto};
use crate::storage::local_database::{LocalDatabase, StorageError};

const MAX_SHORT_FIELD_CHARS: usize = 100;
const MAX_MEDIUM_FIELD_CHARS: usize = 150;
const MAX_ADDRESS_FIELD_CHARS: usize = 250;
const MAX_ABOUT_CHARS: usize = 2000;
const MAX_URL_BYTES: usize = 2048;
const MAX_EMAIL_CHARS: usize = 254;
const MAX_LEGACY_JSON_BYTES: usize = 64 * 1024;

const RESERVED_USERNAMES: &[&str] = &[
    "admin", "administrator", "root", "devos", "system", "support", "dao", "asppibra", "moderator",
];

#[derive(Debug, thiserror::Error)]
pub enum IdentityError {
    #[error(
        "VAULT_LOCKED: O cofre seguro está bloqueado. Desbloqueie com a senha mestre para acessar os dados."
    )]
    VaultLocked,

    #[error("VALIDATION_ERROR: {0}")]
    Validation(String),

    #[error("REVISION_CONFLICT: {0}")]
    ConcurrencyConflict(String),

    #[error("UNSUPPORTED_PAYLOAD_VERSION: Versão de payload não suportada ({0}). Atualize a aplicação.")]
    UnsupportedPayloadVersion(u32),

    #[error("CRYPTO_ERROR: Falha na operação criptográfica dos dados do perfil.")]
    Crypto,

    #[error("STORAGE_ERROR: Falha ao acessar a persistência do perfil.")]
    Storage(String),

    #[error("SERIALIZATION_ERROR: Falha ao processar os dados do perfil.")]
    Serialization,
}

impl From<StorageError> for IdentityError {
    fn from(err: StorageError) -> Self {
        match err {
            StorageError::InvalidData(msg) if msg.starts_with(CONCURRENCY_CONFLICT_PREFIX) => {
                IdentityError::ConcurrencyConflict(msg)
            }
            other => {
                log::error!("[Identity] Falha na camada de persistência SQLite: {other}");
                IdentityError::Storage(other.to_string())
            }
        }
    }
}

impl From<AccessControlError> for IdentityError {
    fn from(err: AccessControlError) -> Self {
        match err {
            AccessControlError::Locked => IdentityError::VaultLocked,
            _ => IdentityError::Crypto,
        }
    }
}

/// Normaliza e valida o username: apenas [a-z0-9_], sem duplicados nas extremidades,
/// comprimento entre 3 e 30 caracteres. Rejeita usernames reservados.
pub fn normalize_username(raw: &str) -> Result<String, IdentityError> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }

    if trimmed.len() > 128 {
        return Err(IdentityError::Validation(
            "O username informado excede o limite máximo de 128 bytes.".to_string(),
        ));
    }

    let mut result = String::with_capacity(30);
    let mut last_was_underscore = false;

    for c in trimmed.chars() {
        let lc = c.to_ascii_lowercase();
        if lc.is_ascii_alphanumeric() {
            if result.len() >= 30 {
                return Err(IdentityError::Validation(
                    "O username não pode exceder 30 caracteres.".to_string(),
                ));
            }
            result.push(lc);
            last_was_underscore = false;
        } else if !last_was_underscore && !result.is_empty() {
            if result.len() < 30 {
                result.push('_');
                last_was_underscore = true;
            }
        }
    }

    while result.ends_with('_') {
        result.pop();
    }

    if result.len() < 3 {
        return Err(IdentityError::Validation(
            "O username deve ter pelo menos 3 caracteres alfanuméricos.".to_string(),
        ));
    }

    if RESERVED_USERNAMES.contains(&result.as_str()) {
        return Err(IdentityError::Validation(format!(
            "O username '{}' é reservado pelo sistema.",
            result
        )));
    }

    Ok(result)
}

/// Valida URLs externas com HTTPS estrito, rejeitando esquemas perigosos (javascript:, data:, file:),
/// credenciais embutidas, portas personalizadas, endereços IP e domínios locais/privados (defesa anti-SSRF).
fn parse_safe_https_url(raw: &str, field_label: &str) -> Result<Url, IdentityError> {
    let trimmed = raw.trim();
    if trimmed.len() > MAX_URL_BYTES {
        return Err(IdentityError::Validation(format!(
            "{} excede o limite permitido de {} bytes.",
            field_label, MAX_URL_BYTES
        )));
    }

    let parsed = Url::parse(trimmed).map_err(|_| {
        IdentityError::Validation(format!("{} inválida ou malformada.", field_label))
    })?;

    if parsed.scheme() != "https" {
        return Err(IdentityError::Validation(format!(
            "{} deve utilizar protocolo seguro HTTPS.",
            field_label
        )));
    }

    if !parsed.username().is_empty() || parsed.password().is_some() {
        return Err(IdentityError::Validation(format!(
            "{} não pode conter credenciais embutidas.",
            field_label
        )));
    }

    if parsed.port().is_some() {
        return Err(IdentityError::Validation(format!(
            "Portas personalizadas não são permitidas em {}.",
            field_label
        )));
    }

    match parsed.host() {
        Some(url::Host::Domain(domain)) => {
            let d_lower = domain.to_ascii_lowercase();
            // Rejeita domínios sem ponto (ex: localhost, intranet)
            if !d_lower.contains('.') || d_lower.starts_with('.') || d_lower.ends_with('.') {
                return Err(IdentityError::Validation(format!(
                    "{} deve conter um nome de domínio qualificado válido (FQDN).",
                    field_label
                )));
            }
            // Rejeita TLDs locais / reservados para SSRF
            if d_lower.ends_with(".local")
                || d_lower.ends_with(".localhost")
                || d_lower.ends_with(".internal")
                || d_lower.ends_with(".onion")
                || d_lower.ends_with(".test")
                || d_lower.ends_with(".example")
            {
                return Err(IdentityError::Validation(format!(
                    "O domínio '{}' em {} não é permitido (endereço local ou reservado).",
                    domain, field_label
                )));
            }
        }
        Some(url::Host::Ipv4(_)) | Some(url::Host::Ipv6(_)) => {
            return Err(IdentityError::Validation(format!(
                "{} não pode apontar diretamente para endereços IP.",
                field_label
            )));
        }
        None => {
            return Err(IdentityError::Validation(format!(
                "{} deve conter um domínio válido.",
                field_label
            )));
        }
    }

    Ok(parsed)
}

/// Valida e sanitiza URL opcional genérica (website, photo_url, cover_url).
fn sanitize_optional_https_url(
    value: Option<&str>,
    field_label: &str,
) -> Result<Option<String>, IdentityError> {
    let Some(raw) = value.map(str::trim).filter(|s| !s.is_empty()) else {
        return Ok(None);
    };
    let parsed = parse_safe_https_url(raw, field_label)?;
    Ok(Some(parsed.to_string()))
}

/// Valida e sanitiza rigorosamente uma URL de rede social contra a allowlist da plataforma.
pub fn sanitize_social_url(
    platform: &str,
    value: &Option<String>,
) -> Result<Option<String>, IdentityError> {
    let Some(raw_value) = value.as_deref().map(str::trim).filter(|s| !s.is_empty()) else {
        return Ok(None);
    };

    let parsed = parse_safe_https_url(raw_value, "URL de rede social")?;

    let allowed_hosts: &[&str] = match platform {
        "facebook" => &[
            "facebook.com",
            "www.facebook.com",
            "m.facebook.com",
            "fb.com",
            "www.fb.com",
        ],
        "instagram" => &["instagram.com", "www.instagram.com"],
        "linkedin" => &["linkedin.com", "www.linkedin.com"],
        "twitter" => &["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
        _ => {
            return Err(IdentityError::Validation(
                "Plataforma de rede social não autorizada.".to_string(),
            ));
        }
    };

    let hostname = parsed.host_str().unwrap_or_default().to_ascii_lowercase();
    if !allowed_hosts.contains(&hostname.as_str()) {
        return Err(IdentityError::Validation(format!(
            "O domínio '{}' não pertence à plataforma autorizada ({}).",
            hostname, platform
        )));
    }

    Ok(Some(parsed.to_string()))
}

fn validate_max_chars(value: &str, max: usize, label: &str) -> Result<(), IdentityError> {
    if value.trim().chars().count() > max {
        return Err(IdentityError::Validation(format!(
            "O campo '{}' não pode exceder {} caracteres.",
            label, max
        )));
    }
    Ok(())
}

fn validate_text_field(value: &str, max: usize, label: &str) -> Result<(), IdentityError> {
    validate_max_chars(value, max, label)?;
    if contains_dangerous_control_or_bidi(value) {
        return Err(IdentityError::Validation(format!(
            "O campo '{}' contém caracteres de controle ou caracteres bidirecionais proibidos.",
            label
        )));
    }
    Ok(())
}

fn validate_email(raw: &str) -> Result<String, IdentityError> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }
    validate_text_field(trimmed, MAX_EMAIL_CHARS, "E-mail")?;
    let mut parts = trimmed.split('@');
    let (Some(local), Some(domain), None) = (parts.next(), parts.next(), parts.next()) else {
        return Err(IdentityError::Validation("Formato de e-mail inválido.".to_string()));
    };
    if local.is_empty()
        || !domain.contains('.')
        || domain.starts_with('.')
        || domain.ends_with('.')
        || trimmed.chars().any(char::is_whitespace)
    {
        return Err(IdentityError::Validation("Formato de e-mail inválido.".to_string()));
    }
    Ok(trimmed.to_string())
}

/// Preserva o valor existente caso o novo campo chegue vazio (para transições PF <-> PJ).
fn resolve_preserved(incoming: &str, existing: Option<&str>) -> String {
    let trimmed = incoming.trim();
    if !trimmed.is_empty() {
        trimmed.to_string()
    } else {
        existing.unwrap_or_default().to_string()
    }
}

/// Resolve e valida um campo com preservação. Erros de validação NUNCA são engolidos.
fn resolve_validated<F>(
    incoming: &str,
    existing: Option<&str>,
    label: &str,
    validator: F,
) -> Result<String, IdentityError>
where
    F: Fn(&str) -> Result<String, &'static str>,
{
    // Se o usuário digitou algo novo no campo, valida o novo valor
    if !incoming.trim().is_empty() {
        return validator(incoming.trim())
            .map_err(|e| IdentityError::Validation(format!("{} inválido: {}", label, e)));
    }

    // Se veio vazio, reaproveita o existente (se houver)
    let candidate = existing.unwrap_or("").trim();
    if candidate.is_empty() {
        return Ok(String::new());
    }

    validator(candidate).map_err(|e| IdentityError::Validation(format!("{} inválido: {}", label, e)))
}

fn build_profile_aad() -> Vec<u8> {
    // Invariante de compatibilidade com a rotação de chaves do Vault em local_database.rs
    AadDomain::UserProfile {
        profile_id: 1,
        vault_instance_id: "default",
    }
    .to_canonical_bytes()
}

pub struct IdentityService;

impl IdentityService {
    /// Higieniza e valida os dados recebidos para o perfil com separação estrita PF / PJ,
    /// proteção anti-XSS/SSRF/DoS, higiene de caracteres de controle/bidi e preservação segura.
    pub fn sanitize_and_validate(
        req: &SaveUserProfileRequest,
        existing: Option<&UserProfileDto>,
    ) -> Result<UserProfileDto, IdentityError> {
        let raw_person = req.person_type.trim();
        let person_type = if raw_person.is_empty() {
            existing
                .map(|p| p.person_type.clone())
                .unwrap_or_else(|| PERSON_TYPE_PF.to_string())
        } else {
            match raw_person.to_ascii_uppercase().as_str() {
                PERSON_TYPE_PF => PERSON_TYPE_PF.to_string(),
                PERSON_TYPE_PJ => PERSON_TYPE_PJ.to_string(),
                _ => {
                    return Err(IdentityError::Validation(
                        "Tipo de pessoa inválido. Utilize 'PF' ou 'PJ'.".to_string(),
                    ));
                }
            }
        };

        // 1. Limites de tamanho e higiene contra caracteres perigosos (bidi, controle)
        validate_text_field(&req.first_name, MAX_SHORT_FIELD_CHARS, "Nome")?;
        validate_text_field(&req.last_name, MAX_SHORT_FIELD_CHARS, "Sobrenome")?;
        validate_text_field(&req.company_name, MAX_MEDIUM_FIELD_CHARS, "Razão social")?;
        validate_text_field(&req.mother_name, MAX_MEDIUM_FIELD_CHARS, "Nome da mãe")?;
        validate_text_field(&req.father_name, MAX_MEDIUM_FIELD_CHARS, "Nome do pai")?;
        validate_text_field(
            &req.legal_representative,
            MAX_MEDIUM_FIELD_CHARS,
            "Representante legal",
        )?;
        validate_text_field(&req.rg, 30, "RG")?;
        validate_text_field(&req.rg_issuer, 30, "Órgão emissor")?;
        validate_text_field(&req.cnh, 30, "CNH")?;
        validate_text_field(&req.cnh_category, 10, "Categoria CNH")?;
        validate_text_field(&req.phone_number, 30, "Telefone")?;
        validate_text_field(&req.nationality, MAX_SHORT_FIELD_CHARS, "Nacionalidade")?;
        validate_text_field(&req.marital_status, 40, "Estado civil")?;
        validate_text_field(&req.country, MAX_SHORT_FIELD_CHARS, "País")?;
        validate_text_field(&req.state, 40, "Estado")?;
        validate_text_field(&req.city, MAX_SHORT_FIELD_CHARS, "Cidade")?;
        validate_text_field(&req.neighborhood, MAX_SHORT_FIELD_CHARS, "Bairro")?;
        validate_text_field(&req.address, MAX_ADDRESS_FIELD_CHARS, "Endereço")?;
        validate_text_field(&req.address_number, 20, "Número")?;
        validate_text_field(&req.complement, MAX_MEDIUM_FIELD_CHARS, "Complemento")?;
        validate_text_field(&req.occupation, MAX_MEDIUM_FIELD_CHARS, "Ocupação")?;
        validate_text_field(&req.company, MAX_MEDIUM_FIELD_CHARS, "Empresa")?;
        validate_text_field(&req.about, MAX_ABOUT_CHARS, "Sobre")?;
        if let Some(d) = req.display_name.as_deref() {
            validate_text_field(d, MAX_MEDIUM_FIELD_CHARS, "Nome de exibição")?;
        }

        // 2. Normalização e validação de identificadores
        let username = match req.username.as_deref().map(str::trim) {
            Some(u) if !u.is_empty() => normalize_username(u)?,
            _ => existing.map(|p| p.username.clone()).unwrap_or_default(),
        };

        let first_name = resolve_preserved(&req.first_name, existing.map(|p| p.first_name.as_str()));
        let last_name = resolve_preserved(&req.last_name, existing.map(|p| p.last_name.as_str()));
        let company_name =
            resolve_preserved(&req.company_name, existing.map(|p| p.company_name.as_str()));

        let display_name = match req.display_name.as_deref().map(str::trim) {
            Some(d) if !d.is_empty() => d.to_string(),
            _ if person_type == PERSON_TYPE_PJ && !company_name.is_empty() => company_name.clone(),
            _ if !first_name.is_empty() || !last_name.is_empty() => {
                format!("{} {}", first_name, last_name).trim().to_string()
            }
            _ if !username.is_empty() => username.clone(),
            _ => "Usuário DevOS".to_string(),
        };

        // 3. Validações estritas de documentos (erros NUNCA engolidos)
        let cpf = resolve_validated(&req.cpf, existing.map(|p| p.cpf.as_str()), "CPF", validate_cpf)?;
        let birth_date = resolve_validated(
            &req.birth_date,
            existing.map(|p| p.birth_date.as_str()),
            "Data de nascimento",
            validate_and_normalize_date,
        )?;
        let cnpj = resolve_validated(
            &req.cnpj,
            existing.map(|p| p.cnpj.as_str()),
            "CNPJ",
            validate_cnpj,
        )?;
        let legal_representative_cpf = resolve_validated(
            &req.legal_representative_cpf,
            existing.map(|p| p.legal_representative_cpf.as_str()),
            "CPF do representante",
            validate_cpf,
        )?;
        let zip_code = validate_cep(&req.zip_code)
            .map_err(|e| IdentityError::Validation(format!("CEP inválido: {}", e)))?;
        let email = validate_email(&req.email)?;

        // 4. Sanitização estrita de URLs (defesa contra XSS/SSRF/LFI)
        let website = sanitize_optional_https_url(Some(&req.website), "Website")?
            .unwrap_or_default();

        // Preservação de imagens: se None na requisição, preserva existente; se Some("") remove (direito ao esquecimento)
        let photo_url = match &req.photo_url {
            Some(s) if s.trim().is_empty() => None,
            Some(s) => sanitize_optional_https_url(Some(s), "URL da foto")?,
            None => existing.and_then(|p| p.photo_url.clone()),
        };

        let cover_url = match &req.cover_url {
            Some(s) if s.trim().is_empty() => None,
            Some(s) => sanitize_optional_https_url(Some(s), "URL da capa")?,
            None => existing.and_then(|p| p.cover_url.clone()),
        };

        let social_links = match &req.social_links {
            Some(links) => Some(SocialLinksDto {
                facebook: sanitize_social_url("facebook", &links.facebook)?,
                instagram: sanitize_social_url("instagram", &links.instagram)?,
                linkedin: sanitize_social_url("linkedin", &links.linkedin)?,
                twitter: sanitize_social_url("twitter", &links.twitter)?,
            }),
            None => existing.and_then(|p| p.social_links.clone()),
        };

        // Provedores vinculados (OAuth) são atestados por fluxos criptográficos de autenticação;
        // o cliente Tauri IPC não pode declarar provedores arbitrariamente pelo formulário de edição
        let linked_providers = existing.map(|p| p.linked_providers.clone()).unwrap_or_default();

        let mut profile = UserProfileDto {
            person_type,
            username,
            first_name,
            last_name,
            display_name,
            cpf,
            rg: resolve_preserved(&req.rg, existing.map(|p| p.rg.as_str())),
            rg_issuer: resolve_preserved(&req.rg_issuer, existing.map(|p| p.rg_issuer.as_str())),
            cnh: resolve_preserved(&req.cnh, existing.map(|p| p.cnh.as_str())),
            cnh_category: resolve_preserved(
                &req.cnh_category,
                existing.map(|p| p.cnh_category.as_str()),
            ),
            mother_name: resolve_preserved(
                &req.mother_name,
                existing.map(|p| p.mother_name.as_str()),
            ),
            father_name: resolve_preserved(
                &req.father_name,
                existing.map(|p| p.father_name.as_str()),
            ),
            birth_date,
            nationality: if req.nationality.trim().is_empty() {
                "Brasileira".to_string()
            } else {
                req.nationality.trim().to_string()
            },
            marital_status: resolve_preserved(
                &req.marital_status,
                existing.map(|p| p.marital_status.as_str()),
            ),
            company_name,
            cnpj,
            legal_representative: resolve_preserved(
                &req.legal_representative,
                existing.map(|p| p.legal_representative.as_str()),
            ),
            legal_representative_cpf,
            email,
            phone_number: req.phone_number.trim().to_string(),
            country: if req.country.trim().is_empty() {
                "Brasil".to_string()
            } else {
                req.country.trim().to_string()
            },
            zip_code,
            state: req.state.trim().to_string(),
            city: req.city.trim().to_string(),
            neighborhood: req.neighborhood.trim().to_string(),
            address: req.address.trim().to_string(),
            address_number: req.address_number.trim().to_string(),
            complement: req.complement.trim().to_string(),
            occupation: req.occupation.trim().to_string(),
            company: req.company.trim().to_string(),
            website,
            about: req.about.trim().to_string(),
            is_public: req.is_public,
            completeness_score: 0,
            revision: 0,
            updated_at: String::new(),
            photo_url,
            cover_url,
            linked_providers,
            social_links,
        };

        profile.completeness_score = calculate_completeness_score(&profile);
        Ok(profile)
    }

    /// Carrega e decifra o perfil utilizando uma conexão aberta e a sessão do cofre ativa.
    fn load_profile_with_conn(
        conn: &rusqlite::Connection,
        session: &VaultSession,
    ) -> Result<Option<UserProfileDto>, IdentityError> {
        let Some(record) = IdentityRepository::get_profile_record(conn)? else {
            return Ok(None);
        };

        if record.payload_version > CURRENT_PROFILE_PAYLOAD_VERSION {
            return Err(IdentityError::UnsupportedPayloadVersion(
                record.payload_version,
            ));
        }

        let aead: AeadEnvelope =
            serde_json::from_str(&record.raw_envelope).map_err(|_| IdentityError::Serialization)?;
        let aad = build_profile_aad();

        let decrypted_bytes = session.with_dek(|dek| {
            let identity_key = Subkeys::derive_identity_key(dek);
            VaultCrypto::decrypt_with_aead(&identity_key, &aead, &aad)
                .map_err(|e| {
                    log::warn!("[Identity] Falha na decifragem do envelope criptográfico do perfil");
                    AccessControlError::Crypto(e)
                })
        })?;

        let decrypted_zero = Zeroizing::new(decrypted_bytes);
        let mut profile: UserProfileDto =
            serde_json::from_slice(&decrypted_zero).map_err(|_| IdentityError::Serialization)?;

        profile.revision = record.revision;
        profile.updated_at = record.updated_at;
        profile.completeness_score = calculate_completeness_score(&profile);

        Ok(Some(profile))
    }

    /// Executa o fluxo atômico de validação, cifragem e salvamento em transação SQLite.
    fn save_profile_internal(
        conn: &mut rusqlite::Connection,
        session: &VaultSession,
        req: SaveUserProfileRequest,
        existing: Option<&UserProfileDto>,
    ) -> Result<UserProfileDto, IdentityError> {
        let mut profile = Self::sanitize_and_validate(&req, existing)?;
        let now_rfc3339 = chrono::Utc::now().to_rfc3339();
        profile.updated_at = now_rfc3339.clone();

        // Serialização com buffer Zeroizing pré-alocado para evitar realocações de PII no heap
        let mut payload_buf = Zeroizing::new(Vec::with_capacity(4096));
        serde_json::to_writer(&mut *payload_buf, &profile)
            .map_err(|_| IdentityError::Serialization)?;

        let aad = build_profile_aad();

        let envelope = session.with_dek(|dek| {
            let identity_key = Subkeys::derive_identity_key(dek);
            VaultCrypto::encrypt_with_aead(&identity_key, &payload_buf, &aad)
                .map_err(AccessControlError::Crypto)
        })?;

        let envelope_json =
            serde_json::to_string(&envelope).map_err(|_| IdentityError::Serialization)?;

        let new_revision = IdentityRepository::save_profile_record(
            conn,
            &envelope_json,
            CURRENT_PROFILE_PAYLOAD_VERSION,
            req.expected_revision,
            &now_rfc3339,
        )?;

        profile.revision = new_revision;

        log::info!(
            "[Identity] Perfil salvo com sucesso no cofre seguro SQLite. Revisão: {}",
            new_revision
        );

        Ok(profile)
    }

    /// Consulta o perfil do usuário decifrando os dados protegidos pelo cofre.
    pub fn get_profile(
        db: &LocalDatabase,
        session: &VaultSession,
    ) -> Result<Option<UserProfileDto>, IdentityError> {
        if !session.is_unlocked() {
            return Err(IdentityError::VaultLocked);
        }
        let _op_guard = session
            .acquire_operation()
            .map_err(|_| IdentityError::VaultLocked)?;

        let conn = db.get_connection()?;
        Self::load_profile_with_conn(&conn, session)
    }

    /// Salva ou atualiza os dados do perfil cifrando-os com a subchave de identidade.
    pub fn save_profile(
        db: &LocalDatabase,
        session: &VaultSession,
        req: SaveUserProfileRequest,
    ) -> Result<UserProfileDto, IdentityError> {
        if !session.is_unlocked() {
            return Err(IdentityError::VaultLocked);
        }
        let _op_guard = session
            .acquire_operation()
            .map_err(|_| IdentityError::VaultLocked)?;

        let mut conn = db.get_connection()?;
        let existing = Self::load_profile_with_conn(&conn, session)?;

        // Verificação antecipada de concorrência antes de processar merge
        match (existing.as_ref(), req.expected_revision) {
            (Some(current), Some(expected)) if current.revision != expected => {
                return Err(IdentityError::ConcurrencyConflict(format!(
                    "{}: O perfil foi atualizado concorrentemente (revisão atual: {}, informada: {}).",
                    CONCURRENCY_CONFLICT_PREFIX, current.revision, expected
                )));
            }
            (Some(current), None) => {
                return Err(IdentityError::ConcurrencyConflict(format!(
                    "{}: Revisão esperada não informada para perfil existente (revisão atual: {}).",
                    CONCURRENCY_CONFLICT_PREFIX, current.revision
                )));
            }
            (None, Some(expected)) if expected != 0 => {
                return Err(IdentityError::ConcurrencyConflict(format!(
                    "{}: Nenhum perfil existente para a revisão esperada informada ({}).",
                    CONCURRENCY_CONFLICT_PREFIX, expected
                )));
            }
            _ => {}
        }

        Self::save_profile_internal(&mut conn, session, req, existing.as_ref())
    }

    /// Importa dados legados do localStorage de forma segura, limitada e resiliente (tolerante a erros parciais).
    pub fn import_legacy_profile(
        db: &LocalDatabase,
        session: &VaultSession,
        legacy_json: &str,
    ) -> Result<UserProfileDto, IdentityError> {
        if !session.is_unlocked() {
            return Err(IdentityError::VaultLocked);
        }
        if legacy_json.len() > MAX_LEGACY_JSON_BYTES {
            return Err(IdentityError::Validation(
                "Payload JSON legado excede o limite máximo permitido de 64 KB.".to_string(),
            ));
        }

        let _op_guard = session
            .acquire_operation()
            .map_err(|_| IdentityError::VaultLocked)?;

        let mut conn = db.get_connection()?;
        let existing = Self::load_profile_with_conn(&conn, session)?;

        // Se o perfil existente já tem revisão >= 1 e campos básicos preenchidos, preserva
        if let Some(ref profile) = existing {
            if profile.revision >= 1 && profile.completeness_score > 0 {
                log::info!(
                    "[Identity] Perfil existente no cofre preservado durante reconciliação legada."
                );
                return Ok(profile.clone());
            }
        }

        let value: serde_json::Value = serde_json::from_str(legacy_json)
            .map_err(|_| IdentityError::Validation("Formato JSON legado inválido.".to_string()))?;

        let str_field = |name: &str| -> String {
            value
                .get(name)
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .trim()
                .to_string()
        };
        let opt_str_field = |name: &str| -> Option<String> {
            value
                .get(name)
                .and_then(|v| v.as_str())
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(ToString::to_string)
        };

        // Validação tolerante com descarte de campos inválidos sem abortar a migração
        let tolerant_cpf = |name: &str| -> String {
            let val = str_field(name);
            if val.is_empty() {
                return String::new();
            }
            match validate_cpf(&val) {
                Ok(v) => v,
                Err(_) => {
                    log::warn!(
                        "[Identity] Campo legado '{}' inválido descartado durante migração",
                        name
                    );
                    String::new()
                }
            }
        };

        let tolerant_cnpj = |name: &str| -> String {
            let val = str_field(name);
            if val.is_empty() {
                return String::new();
            }
            match validate_cnpj(&val) {
                Ok(v) => v,
                Err(_) => {
                    log::warn!(
                        "[Identity] Campo legado '{}' inválido descartado durante migração",
                        name
                    );
                    String::new()
                }
            }
        };

        let tolerant_date = |name: &str| -> String {
            let val = str_field(name);
            if val.is_empty() {
                return String::new();
            }
            match validate_and_normalize_date(&val) {
                Ok(v) => v,
                Err(_) => {
                    log::warn!(
                        "[Identity] Campo legado '{}' inválido descartado durante migração",
                        name
                    );
                    String::new()
                }
            }
        };

        let tolerant_cep = |name: &str| -> String {
            let val = str_field(name);
            if val.is_empty() {
                return String::new();
            }
            match validate_cep(&val) {
                Ok(v) => v,
                Err(_) => {
                    log::warn!(
                        "[Identity] Campo legado '{}' inválido descartado durante migração",
                        name
                    );
                    String::new()
                }
            }
        };

        let tolerant_email = |name: &str| -> String {
            let val = str_field(name);
            if val.is_empty() {
                return String::new();
            }
            match validate_email(&val) {
                Ok(v) => v,
                Err(_) => {
                    log::warn!(
                        "[Identity] Campo legado '{}' inválido descartado durante migração",
                        name
                    );
                    String::new()
                }
            }
        };

        let tolerant_url = |name: &str| -> Option<String> {
            let val = opt_str_field(name)?;
            match parse_safe_https_url(&val, name) {
                Ok(u) => Some(u.to_string()),
                Err(_) => {
                    log::warn!(
                        "[Identity] Campo legado '{}' inválido descartado durante migração",
                        name
                    );
                    None
                }
            }
        };

        let tolerant_text = |name: &str, max: usize| -> String {
            let val = str_field(name);
            if val.chars().count() > max || contains_dangerous_control_or_bidi(&val) {
                log::warn!(
                    "[Identity] Campo legado '{}' inválido descartado durante migração",
                    name
                );
                String::new()
            } else {
                val
            }
        };

        let req = SaveUserProfileRequest {
            person_type: {
                let p = str_field("personType");
                if p.eq_ignore_ascii_case(PERSON_TYPE_PJ) {
                    PERSON_TYPE_PJ.to_string()
                } else {
                    PERSON_TYPE_PF.to_string()
                }
            },
            username: opt_str_field("username").and_then(|u| normalize_username(&u).ok()),
            first_name: tolerant_text("firstName", MAX_SHORT_FIELD_CHARS),
            last_name: tolerant_text("lastName", MAX_SHORT_FIELD_CHARS),
            display_name: opt_str_field("displayName")
                .map(|_| tolerant_text("displayName", MAX_MEDIUM_FIELD_CHARS)),
            cpf: tolerant_cpf("cpf"),
            rg: tolerant_text("rg", 30),
            rg_issuer: tolerant_text("rgIssuer", 30),
            cnh: tolerant_text("cnh", 30),
            cnh_category: tolerant_text("cnhCategory", 10),
            mother_name: tolerant_text("motherName", MAX_MEDIUM_FIELD_CHARS),
            father_name: tolerant_text("fatherName", MAX_MEDIUM_FIELD_CHARS),
            birth_date: tolerant_date("birthDate"),
            nationality: {
                let n = tolerant_text("nationality", MAX_SHORT_FIELD_CHARS);
                if n.is_empty() {
                    "Brasileira".to_string()
                } else {
                    n
                }
            },
            marital_status: tolerant_text("maritalStatus", 40),
            company_name: tolerant_text("companyName", MAX_MEDIUM_FIELD_CHARS),
            cnpj: tolerant_cnpj("cnpj"),
            legal_representative: tolerant_text("legalRepresentative", MAX_MEDIUM_FIELD_CHARS),
            legal_representative_cpf: tolerant_cpf("legalRepresentativeCpf"),
            email: tolerant_email("email"),
            phone_number: tolerant_text("phoneNumber", 30),
            country: {
                let c = tolerant_text("country", MAX_SHORT_FIELD_CHARS);
                if c.is_empty() {
                    "Brasil".to_string()
                } else {
                    c
                }
            },
            zip_code: tolerant_cep("zipCode"),
            state: tolerant_text("state", 40),
            city: tolerant_text("city", MAX_SHORT_FIELD_CHARS),
            neighborhood: tolerant_text("neighborhood", MAX_SHORT_FIELD_CHARS),
            address: tolerant_text("address", MAX_ADDRESS_FIELD_CHARS),
            address_number: tolerant_text("addressNumber", 20),
            complement: tolerant_text("complement", MAX_MEDIUM_FIELD_CHARS),
            occupation: tolerant_text("occupation", MAX_MEDIUM_FIELD_CHARS),
            company: tolerant_text("company", MAX_MEDIUM_FIELD_CHARS),
            website: tolerant_url("website").unwrap_or_default(),
            about: tolerant_text("about", MAX_ABOUT_CHARS),
            // Privacidade por padrão: nunca herdar visibilidade pública do legado
            is_public: false,
            photo_url: tolerant_url("photoURL"),
            cover_url: tolerant_url("coverURL"),
            expected_revision: existing.as_ref().map(|p| p.revision),
            ..Default::default()
        };

        Self::save_profile_internal(&mut conn, session, req, existing.as_ref())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    struct TestDirGuard(PathBuf);
    impl Drop for TestDirGuard {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    fn setup_test_vault() -> (LocalDatabase, VaultSession, TestDirGuard) {
        let dir =
            std::env::temp_dir().join(format!("devos_identity_test_{}", rand::random::<u32>()));
        let _ = std::fs::create_dir_all(&dir);
        let db = LocalDatabase::new(dir.clone());
        crate::storage::MigrationManager::run_migrations(&db).unwrap();

        let session = VaultSession::new();
        session.set_dek_for_test(&[0x42u8; 32]);

        (db, session, TestDirGuard(dir))
    }

    fn sample_req(cpf: &str) -> SaveUserProfileRequest {
        SaveUserProfileRequest {
            person_type: "PF".to_string(),
            username: Some("carlos_silva".to_string()),
            first_name: "Carlos".to_string(),
            last_name: "Silva".to_string(),
            cpf: cpf.to_string(),
            email: "carlos@exemplo.com.br".to_string(),
            zip_code: "01310-100".to_string(),
            city: "São Paulo".to_string(),
            state: "SP".to_string(),
            address: "Avenida Paulista".to_string(),
            website: "https://carlos.dev".to_string(),
            ..Default::default()
        }
    }

    #[test]
    fn test_save_and_get_profile() {
        let (db, session, _dir) = setup_test_vault();

        let req = SaveUserProfileRequest {
            person_type: "PF".to_string(),
            username: Some("carlos_silva".to_string()),
            first_name: "Carlos".to_string(),
            last_name: "Silva".to_string(),
            cpf: "52998224725".to_string(),
            rg: "12345678".to_string(),
            rg_issuer: "SSP/SP".to_string(),
            mother_name: "Ana Silva".to_string(),
            birth_date: "1990-01-15".to_string(),
            nationality: "Brasileira".to_string(),
            marital_status: "Solteiro(a)".to_string(),
            email: "carlos@exemplo.com.br".to_string(),
            phone_number: "11987654321".to_string(),
            country: "Brasil".to_string(),
            zip_code: "01310100".to_string(),
            state: "SP".to_string(),
            city: "São Paulo".to_string(),
            neighborhood: "Bela Vista".to_string(),
            address: "Avenida Paulista".to_string(),
            address_number: "1000".to_string(),
            complement: "Apto 42".to_string(),
            occupation: "Desenvolvedor".to_string(),
            company: "Tech Corp".to_string(),
            website: "https://carlos.dev".to_string(),
            about: "Bio de teste".to_string(),
            is_public: false,
            photo_url: Some("https://storage.devos.app/avatar.png".to_string()),
            cover_url: Some("https://storage.devos.app/cover.png".to_string()),
            social_links: Some(SocialLinksDto {
                facebook: Some("https://facebook.com/carlos".to_string()),
                instagram: Some("https://instagram.com/carlos".to_string()),
                linkedin: Some("https://linkedin.com/in/carlos".to_string()),
                twitter: Some("https://x.com/carlos".to_string()),
            }),
            expected_revision: None,
            ..Default::default()
        };

        let saved = IdentityService::save_profile(&db, &session, req).expect("Deveria salvar");
        assert_eq!(saved.revision, 1);
        assert_eq!(saved.username, "carlos_silva");
        assert_eq!(saved.cpf, "529.982.247-25");
        assert_eq!(saved.zip_code, "01310-100");
        assert_eq!(saved.display_name, "Carlos Silva");
        assert!(saved.completeness_score > 70);
        assert_eq!(
            saved.photo_url.as_deref(),
            Some("https://storage.devos.app/avatar.png")
        );
        assert_eq!(
            saved.social_links.as_ref().unwrap().linkedin.as_deref(),
            Some("https://linkedin.com/in/carlos")
        );

        let loaded = IdentityService::get_profile(&db, &session)
            .expect("Deveria ler")
            .expect("Perfil deve existir");
        assert_eq!(loaded.revision, 1);
        assert_eq!(loaded.username, "carlos_silva");
        assert_eq!(
            loaded.social_links.as_ref().unwrap().twitter.as_deref(),
            Some("https://x.com/carlos")
        );
        assert_eq!(loaded.first_name, "Carlos");
        assert_eq!(loaded.cpf, "529.982.247-25");
        assert_eq!(loaded.email, "carlos@exemplo.com.br");

        // Atualização preservando photo_url quando photo_url é None
        let mut update_req = sample_req("52998224725");
        update_req.photo_url = None;
        update_req.expected_revision = Some(1);
        let updated = IdentityService::save_profile(&db, &session, update_req).unwrap();
        assert_eq!(
            updated.photo_url.as_deref(),
            Some("https://storage.devos.app/avatar.png")
        );

        // Atualização com remoção explícita de photo_url quando photo_url é Some("")
        let mut remove_photo_req = sample_req("52998224725");
        remove_photo_req.photo_url = Some("   ".to_string());
        remove_photo_req.expected_revision = Some(2);
        let removed = IdentityService::save_profile(&db, &session, remove_photo_req).unwrap();
        assert_eq!(removed.photo_url, None);
    }

    #[test]
    fn test_lost_update_prevention_on_concurrent_writes() {
        let (db, session, _guard) = setup_test_vault();

        // 1. Criação inicial com sucesso (revisão 1)
        let saved = IdentityService::save_profile(&db, &session, sample_req("52998224725")).unwrap();
        assert_eq!(saved.revision, 1);

        // 2. Tentativa de salvar sem expected_revision quando o perfil já existe deve conflitar
        let mut missing_rev_req = sample_req("52998224725");
        missing_rev_req.first_name = "Sobrescrita Não Autorizada".to_string();
        missing_rev_req.expected_revision = None;
        let err_missing = IdentityService::save_profile(&db, &session, missing_rev_req).unwrap_err();
        assert!(matches!(err_missing, IdentityError::ConcurrencyConflict(_)));

        // 3. Tentativa de salvar com revisão defasada deve falhar categoricamente
        let mut conflicting_req = sample_req("52998224725");
        conflicting_req.expected_revision = Some(99);
        let err_obsolete = IdentityService::save_profile(&db, &session, conflicting_req).unwrap_err();
        assert!(matches!(err_obsolete, IdentityError::ConcurrencyConflict(_)));

        // 4. Salvamento com revisão correta deve ter sucesso e incrementar para 2
        let mut valid_next_req = sample_req("52998224725");
        valid_next_req.first_name = "Carlos Atualizado".to_string();
        valid_next_req.expected_revision = Some(1);
        let updated = IdentityService::save_profile(&db, &session, valid_next_req).unwrap();
        assert_eq!(updated.revision, 2);
        assert_eq!(updated.first_name, "Carlos Atualizado");
    }

    #[test]
    fn test_error_not_swallowed_on_inactive_mode() {
        let (db, session, _guard) = setup_test_vault();
        let saved = IdentityService::save_profile(&db, &session, sample_req("52998224725")).unwrap();

        // Usuário em modo PJ envia CPF inválido: o erro DEVE ser reportado e NÃO engolido
        let pj_req = SaveUserProfileRequest {
            person_type: "PJ".to_string(),
            company_name: "Empresa Teste".to_string(),
            cnpj: "12ABC34501DE35".to_string(),
            cpf: "11111111111".to_string(), // CPF comprovadamente inválido
            expected_revision: Some(saved.revision),
            ..Default::default()
        };

        let result = IdentityService::save_profile(&db, &session, pj_req);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), IdentityError::Validation(_)));
    }

    #[test]
    fn test_url_xss_and_ssrf_rejection() {
        let mut req = sample_req("52998224725");

        // Esquema javascript:
        req.website = "javascript:alert(document.cookie)".to_string();
        assert!(IdentityService::sanitize_and_validate(&req, None).is_err());

        // Esquema data:
        req.website = "data:text/html,<script>alert(1)</script>".to_string();
        assert!(IdentityService::sanitize_and_validate(&req, None).is_err());

        // Esquema file:
        req.website = "file:///etc/passwd".to_string();
        assert!(IdentityService::sanitize_and_validate(&req, None).is_err());

        // Credenciais embutidas
        req.website = "https://user:pass@legitimo.com".to_string();
        assert!(IdentityService::sanitize_and_validate(&req, None).is_err());

        // Portas customizadas
        req.website = "https://legitimo.com:8443/perfil".to_string();
        assert!(IdentityService::sanitize_and_validate(&req, None).is_err());

        // SSRF: IP literal IPv4
        req.website = "https://127.0.0.1/admin".to_string();
        assert!(IdentityService::sanitize_and_validate(&req, None).is_err());

        // SSRF: IP privado 192.168.1.1
        req.website = "https://192.168.1.1/secret".to_string();
        assert!(IdentityService::sanitize_and_validate(&req, None).is_err());

        // SSRF: localhost sem ponto
        req.website = "https://localhost/api".to_string();
        assert!(IdentityService::sanitize_and_validate(&req, None).is_err());

        // SSRF: domínio .local / .internal
        req.website = "https://servidor.local/status".to_string();
        assert!(IdentityService::sanitize_and_validate(&req, None).is_err());
        req.website = "https://servidor.internal/status".to_string();
        assert!(IdentityService::sanitize_and_validate(&req, None).is_err());
    }

    #[test]
    fn test_reserved_usernames_rejection() {
        assert!(normalize_username("admin").is_err());
        assert!(normalize_username("root").is_err());
        assert!(normalize_username("devos").is_err());
        assert!(normalize_username("suporte_valido").is_ok());
    }

    #[test]
    fn test_pii_redacted_in_debug_formatting() {
        let profile = UserProfileDto {
            first_name: "Carlos".to_string(),
            cpf: "529.982.247-25".to_string(),
            address: "Rua Secreta, 123".to_string(),
            social_links: Some(SocialLinksDto {
                linkedin: Some("https://linkedin.com/in/secreto".to_string()),
                ..Default::default()
            }),
            ..Default::default()
        };

        let debug_output = format!("{:?}", profile);
        assert!(!debug_output.contains("Carlos"));
        assert!(!debug_output.contains("529.982.247-25"));
        assert!(!debug_output.contains("Rua Secreta"));
        assert!(debug_output.contains("[REDACTED_BY_LGPD]"));

        let social_debug = format!("{:?}", profile.social_links.unwrap());
        assert!(!social_debug.contains("secreto"));
        assert!(social_debug.contains("[REDACTED]"));
    }

    #[test]
    fn test_normalize_username_canonical() {
        assert_eq!(normalize_username("usuario.teste").unwrap(), "usuario_teste");
        assert_eq!(
            normalize_username("Usuario.De.Teste@123").unwrap(),
            "usuario_de_teste_123"
        );
        assert_eq!(normalize_username("__sandro___souza__").unwrap(), "sandro_souza");
        assert_eq!(normalize_username("").unwrap(), "");

        // 30 caracteres válidos com separador final não devem quebrar
        let max_len_input = "abcdefghijklmnopqrstuvwxyz1234.";
        let normalized = normalize_username(max_len_input).expect("Deve normalizar");
        assert!(normalized.len() <= 30);
        assert!(!normalized.ends_with('_'));
    }

    #[test]
    fn test_preserve_inactive_fields_on_person_type_switch() {
        let (db, session, _guard) = setup_test_vault();

        // 1. Salva inicialmente como PF com CPF
        let req_pf = SaveUserProfileRequest {
            person_type: "PF".to_string(),
            username: Some("joao_silva".to_string()),
            first_name: "João".to_string(),
            last_name: "Silva".to_string(),
            cpf: "52998224725".to_string(),
            rg: "123456".to_string(),
            rg_issuer: "SSP/SP".to_string(),
            mother_name: "Maria Silva".to_string(),
            birth_date: "1990-01-01".to_string(),
            nationality: "Brasileira".to_string(),
            marital_status: "Solteiro(a)".to_string(),
            email: "joao@empresa.com".to_string(),
            phone_number: "11999999999".to_string(),
            country: "Brasil".to_string(),
            zip_code: "01310-100".to_string(),
            state: "SP".to_string(),
            city: "São Paulo".to_string(),
            neighborhood: "Bela Vista".to_string(),
            address: "Av Paulista".to_string(),
            address_number: "1000".to_string(),
            occupation: "Desenvolvedor".to_string(),
            expected_revision: None,
            ..Default::default()
        };

        let saved_pf = IdentityService::save_profile(&db, &session, req_pf).unwrap();
        assert_eq!(saved_pf.person_type, "PF");
        assert_eq!(saved_pf.cpf, "529.982.247-25");

        // 2. Transiciona para PJ, fornecendo CNPJ e Razão Social
        let req_pj = SaveUserProfileRequest {
            person_type: "PJ".to_string(),
            username: Some("joao_silva".to_string()),
            company_name: "Minha Empresa Ltda".to_string(),
            cnpj: "12ABC34501DE35".to_string(),
            legal_representative: "João Silva".to_string(),
            legal_representative_cpf: "52998224725".to_string(),
            email: "contato@empresa.com".to_string(),
            phone_number: "11999999999".to_string(),
            country: "Brasil".to_string(),
            zip_code: "01310-100".to_string(),
            state: "SP".to_string(),
            city: "São Paulo".to_string(),
            neighborhood: "Bela Vista".to_string(),
            address: "Av Paulista".to_string(),
            address_number: "1000".to_string(),
            occupation: "Tecnologia".to_string(),
            expected_revision: Some(saved_pf.revision),
            ..Default::default()
        };

        let saved_pj = IdentityService::save_profile(&db, &session, req_pj).unwrap();
        assert_eq!(saved_pj.person_type, "PJ");
        assert_eq!(saved_pj.cnpj, "12.ABC.345/01DE-35");
        // Comprova que os dados civis PF anteriores NÃO foram destruídos
        assert_eq!(saved_pj.cpf, "529.982.247-25");
        assert_eq!(saved_pj.rg, "123456");
        assert_eq!(saved_pj.mother_name, "Maria Silva");

        // 3. Transiciona de volta para PF (PF -> PJ -> PF) comprovando preservação mútua
        let req_pf_again = SaveUserProfileRequest {
            person_type: "PF".to_string(),
            username: Some("joao_silva".to_string()),
            email: "joao@email.com".to_string(),
            phone_number: "11988888888".to_string(),
            country: "Brasil".to_string(),
            zip_code: "01310-100".to_string(),
            state: "SP".to_string(),
            city: "São Paulo".to_string(),
            neighborhood: "Bela Vista".to_string(),
            address: "Av Paulista".to_string(),
            address_number: "1000".to_string(),
            occupation: "Engenheiro".to_string(),
            expected_revision: Some(saved_pj.revision),
            ..Default::default()
        };

        let saved_pf_again = IdentityService::save_profile(&db, &session, req_pf_again).unwrap();
        assert_eq!(saved_pf_again.person_type, "PF");
        assert_eq!(saved_pf_again.first_name, "João");
        assert_eq!(saved_pf_again.last_name, "Silva");
        assert_eq!(saved_pf_again.cpf, "529.982.247-25");
        assert_eq!(saved_pf_again.mother_name, "Maria Silva");
        // Comprova que os dados PJ anteriores NÃO foram destruídos
        assert_eq!(saved_pf_again.company_name, "Minha Empresa Ltda");
        assert_eq!(saved_pf_again.cnpj, "12.ABC.345/01DE-35");
        assert_eq!(saved_pf_again.legal_representative, "João Silva");
    }

    #[test]
    fn test_tolerant_legacy_migration_discards_bad_fields() {
        let (db, session, _guard) = setup_test_vault();

        // JSON com CPF inválido, data malformada e avatar em data URI (inseguro)
        let legacy_json = r#"{
            "firstName": "Legado",
            "lastName": "Válido",
            "cpf": "111.111.111-11",
            "birthDate": "99/99/9999",
            "email": "legado@exemplo.com",
            "photoURL": "data:image/png;base64,iVBORw0KGgo...",
            "zipCode": "01310-100",
            "city": "São Paulo",
            "state": "SP"
        }"#;

        let migrated = IdentityService::import_legacy_profile(&db, &session, legacy_json)
            .expect("Migração tolerante deve suceder mesmo com campos inválidos");

        assert_eq!(migrated.first_name, "Legado");
        assert_eq!(migrated.last_name, "Válido");
        assert_eq!(migrated.email, "legado@exemplo.com");
        assert_eq!(migrated.zip_code, "01310-100");
        // Campos inválidos devem ter sido descartados com segurança
        assert_eq!(migrated.cpf, "");
        assert_eq!(migrated.birth_date, "");
        assert_eq!(migrated.photo_url, None);
    }

    #[test]
    fn test_bidi_and_control_character_rejection_in_profile() {
        let mut req = sample_req("52998224725");
        req.first_name = "Carlos\u{202E}Invertido".to_string();
        let result = IdentityService::sanitize_and_validate(&req, None);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), IdentityError::Validation(_)));
    }

    #[test]
    fn test_social_url_validation_security() {
        let linkedin = Some("https://www.linkedin.com/in/devos".to_string());
        assert!(sanitize_social_url("linkedin", &linkedin).is_ok());

        let twitter = Some("https://x.com/devos_dao".to_string());
        assert!(sanitize_social_url("twitter", &twitter).is_ok());

        let fb = Some("https://facebook.com/devos".to_string());
        assert!(sanitize_social_url("facebook", &fb).is_ok());

        let insta = Some("https://instagram.com/devos".to_string());
        assert!(sanitize_social_url("instagram", &insta).is_ok());

        let fake_host = Some("https://linkedin.com.site-malicioso.com".to_string());
        assert!(sanitize_social_url("linkedin", &fake_host).is_err());

        let wrong_platform = Some("https://linkedin.com/in/user".to_string());
        assert!(sanitize_social_url("instagram", &wrong_platform).is_err());

        let credentials = Some("https://admin:secret@linkedin.com".to_string());
        assert!(sanitize_social_url("linkedin", &credentials).is_err());

        let custom_port = Some("https://x.com:8080/user".to_string());
        assert!(sanitize_social_url("twitter", &custom_port).is_err());

        let insecure = Some("http://linkedin.com/in/user".to_string());
        assert!(sanitize_social_url("linkedin", &insecure).is_err());

        let malformed = Some("https://".to_string());
        assert!(sanitize_social_url("linkedin", &malformed).is_err());

        let empty = Some(String::new());
        assert_eq!(sanitize_social_url("linkedin", &empty).unwrap(), None);

        let none: Option<String> = None;
        assert_eq!(sanitize_social_url("linkedin", &none).unwrap(), None);

        let too_long = Some(format!("https://linkedin.com/in/{}", "a".repeat(2048)));
        assert!(sanitize_social_url("linkedin", &too_long).is_err());
    }
}
