//! Camada de serviço de negócios para Perfil do Usuário e Qualificação Civil.
//!
//! Orquestra validações, criptografia de ponta a ponta (AES-256-GCM com chave derivada
//! do cofre) e persistência transacional em SQLite.

use url::Url;
use zeroize::Zeroizing;

use super::models::{
    PERSON_TYPE_PF, PERSON_TYPE_PJ, SaveUserProfileRequest, SocialLinksDto, UserProfileDto,
    calculate_completeness_score, validate_and_normalize_date, validate_cep, validate_cnpj,
    validate_cpf,
};
use super::repository::IdentityRepository;
use crate::modules::vault::access_control::VaultSession;
use crate::modules::vault::encryption::{AadDomain, AeadEnvelope, Subkeys, VaultCrypto};
use crate::storage::local_database::{LocalDatabase, StorageError};

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

    #[error("CRYPTO_ERROR: Falha na operação criptográfica dos dados do perfil.")]
    Crypto,

    #[error("STORAGE_ERROR: {0}")]
    Storage(String),

    #[error("SERIALIZATION_ERROR: Falha ao processar os dados do perfil.")]
    Serialization,
}

impl From<StorageError> for IdentityError {
    fn from(err: StorageError) -> Self {
        match err {
            StorageError::InvalidData(msg) if msg.starts_with("CONCURRENCY_CONFLICT") => {
                IdentityError::ConcurrencyConflict(msg)
            }
            other => IdentityError::Storage(other.to_string()),
        }
    }
}

pub fn normalize_username(raw: &str) -> String {
    let lower = raw.trim().to_lowercase();
    let sanitized: String = lower
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect();
    let mut result = String::new();
    let mut last_was_underscore = false;
    for c in sanitized.chars() {
        if c == '_' {
            if !last_was_underscore && !result.is_empty() {
                result.push(c);
                last_was_underscore = true;
            }
        } else {
            result.push(c);
            last_was_underscore = false;
        }
    }
    if result.ends_with('_') {
        result.pop();
    }
    if result.len() > 30 {
        result.truncate(30);
    }
    result
}

/// Valida e sanitiza rigorosamente uma URL de rede social contra a allowlist da plataforma.
pub fn sanitize_social_url(
    platform: &str,
    value: &Option<String>,
) -> Result<Option<String>, IdentityError> {
    let Some(raw_value) = value else {
        return Ok(None);
    };

    let trimmed = raw_value.trim();

    // Campos opcionais podem ser vazios
    if trimmed.is_empty() {
        return Ok(None);
    }

    // Limite de 2048 bytes UTF-8
    if trimmed.len() > 2048 {
        return Err(IdentityError::Validation(
            "URL de rede social excede o limite permitido de 2048 bytes.".to_string(),
        ));
    }

    // Parse real da URL via crate url::Url
    let parsed = Url::parse(trimmed).map_err(|_| {
        IdentityError::Validation("URL de rede social inválida ou malformada.".to_string())
    })?;

    // HTTPS obrigatório (rejeita http, javascript, data, ftp, etc.)
    if parsed.scheme() != "https" {
        return Err(IdentityError::Validation(
            "A URL de rede social deve utilizar protocolo seguro HTTPS.".to_string(),
        ));
    }

    // Bloqueia credenciais embutidas (ex: https://user:pass@host)
    if !parsed.username().is_empty() || parsed.password().is_some() {
        return Err(IdentityError::Validation(
            "URLs com credenciais embutidas não são permitidas.".to_string(),
        ));
    }

    // Bloqueia portas não convencionais (ex: https://host:8080)
    if parsed.port().is_some() {
        return Err(IdentityError::Validation(
            "Portas personalizadas não são permitidas em URLs de redes sociais.".to_string(),
        ));
    }

    // Allowlist estrita de hostnames legítimos por plataforma
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

pub struct IdentityService;

impl IdentityService {
    /// Higieniza e valida os dados recebidos para o perfil com separação estrita PF / PJ
    /// e preservação segura de dados inativos entre transições de titularidade.
    fn sanitize_and_validate(
        req: &SaveUserProfileRequest,
        existing_profile: Option<&UserProfileDto>,
    ) -> Result<UserProfileDto, IdentityError> {
        let person_type = if req.person_type.trim() == PERSON_TYPE_PJ {
            PERSON_TYPE_PJ.to_string()
        } else {
            PERSON_TYPE_PF.to_string()
        };

        // Validação de limites máximos (proteção contra payloads excessivos / DoS de memória)
        if req.first_name.len() > 100 || req.last_name.len() > 100 || req.company_name.len() > 150 {
            return Err(IdentityError::Validation(
                "Nomes ou razão social não podem exceder 150 caracteres.".to_string(),
            ));
        }

        if req.about.len() > 2000 {
            return Err(IdentityError::Validation(
                "O campo 'Sobre' não pode exceder 2.000 caracteres.".to_string(),
            ));
        }

        let username = match &req.username {
            Some(u) if !u.trim().is_empty() => {
                let norm = normalize_username(u);
                if norm.len() < 3 || norm.len() > 30 {
                    return Err(IdentityError::Validation(
                        "O username deve ter entre 3 e 30 caracteres alfanuméricos ou sublinhados."
                            .to_string(),
                    ));
                }
                norm
            }
            _ => existing_profile
                .as_ref()
                .map(|p| p.username.clone())
                .unwrap_or_default(),
        };

        let first_name = if !req.first_name.trim().is_empty() {
            req.first_name.trim().to_string()
        } else {
            existing_profile
                .as_ref()
                .map(|p| p.first_name.clone())
                .unwrap_or_default()
        };
        let last_name = if !req.last_name.trim().is_empty() {
            req.last_name.trim().to_string()
        } else {
            existing_profile
                .as_ref()
                .map(|p| p.last_name.clone())
                .unwrap_or_default()
        };
        let company_name = if !req.company_name.trim().is_empty() {
            req.company_name.trim().to_string()
        } else {
            existing_profile
                .as_ref()
                .map(|p| p.company_name.clone())
                .unwrap_or_default()
        };

        let display_name = match &req.display_name {
            Some(d) if !d.trim().is_empty() => d.trim().to_string(),
            _ => {
                if person_type == PERSON_TYPE_PJ && !company_name.is_empty() {
                    company_name.clone()
                } else if !first_name.is_empty() || !last_name.is_empty() {
                    format!("{} {}", first_name, last_name).trim().to_string()
                } else if !username.is_empty() {
                    username.clone()
                } else {
                    "Usuário DevOS".to_string()
                }
            }
        };

        // Validações compartilhadas (Localização e Contato)
        let zip_code = validate_cep(&req.zip_code)
            .map_err(|e| IdentityError::Validation(format!("CEP inválido: {}", e)))?;

        // Validações específicas e preservação segura de dados entre transições PF e PJ
        let (
            cpf,
            rg,
            rg_issuer,
            cnh,
            cnh_category,
            mother_name,
            father_name,
            birth_date,
            marital_status,
            final_company_name,
            cnpj,
            legal_representative,
            legal_representative_cpf,
        ) = if person_type == PERSON_TYPE_PJ {
            // Regras Pessoa Jurídica
            let raw_cnpj = if !req.cnpj.trim().is_empty() {
                &req.cnpj
            } else if let Some(p) = existing_profile {
                &p.cnpj
            } else {
                &req.cnpj
            };
            let validated_cnpj = validate_cnpj(raw_cnpj)
                .map_err(|e| IdentityError::Validation(format!("CNPJ inválido: {}", e)))?;

            let raw_rep_cpf = if !req.legal_representative_cpf.trim().is_empty() {
                &req.legal_representative_cpf
            } else if let Some(p) = existing_profile {
                &p.legal_representative_cpf
            } else {
                &req.legal_representative_cpf
            };
            let validated_rep_cpf = if !raw_rep_cpf.trim().is_empty() {
                validate_cpf(raw_rep_cpf).map_err(|e| {
                    IdentityError::Validation(format!("CPF do representante inválido: {}", e))
                })?
            } else {
                String::new()
            };

            let legal_rep = if !req.legal_representative.trim().is_empty() {
                req.legal_representative.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.legal_representative.clone())
                    .unwrap_or_default()
            };

            // Preservação ou atualização de dados de PF em modo PJ
            let pf_cpf = if !req.cpf.trim().is_empty() {
                validate_cpf(&req.cpf).unwrap_or_else(|_| {
                    existing_profile
                        .as_ref()
                        .map(|p| p.cpf.clone())
                        .unwrap_or_default()
                })
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.cpf.clone())
                    .unwrap_or_default()
            };
            let pf_rg = if !req.rg.trim().is_empty() {
                req.rg.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.rg.clone())
                    .unwrap_or_default()
            };
            let pf_rg_issuer = if !req.rg_issuer.trim().is_empty() {
                req.rg_issuer.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.rg_issuer.clone())
                    .unwrap_or_default()
            };
            let pf_cnh = if !req.cnh.trim().is_empty() {
                req.cnh.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.cnh.clone())
                    .unwrap_or_default()
            };
            let pf_cnh_cat = if !req.cnh_category.trim().is_empty() {
                req.cnh_category.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.cnh_category.clone())
                    .unwrap_or_default()
            };
            let pf_mother = if !req.mother_name.trim().is_empty() {
                req.mother_name.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.mother_name.clone())
                    .unwrap_or_default()
            };
            let pf_father = if !req.father_name.trim().is_empty() {
                req.father_name.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.father_name.clone())
                    .unwrap_or_default()
            };
            let pf_birth = if !req.birth_date.trim().is_empty() {
                validate_and_normalize_date(&req.birth_date).unwrap_or_else(|_| {
                    existing_profile
                        .as_ref()
                        .map(|p| p.birth_date.clone())
                        .unwrap_or_default()
                })
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.birth_date.clone())
                    .unwrap_or_default()
            };
            let pf_marital = if !req.marital_status.trim().is_empty() {
                req.marital_status.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.marital_status.clone())
                    .unwrap_or_default()
            };

            (
                pf_cpf,
                pf_rg,
                pf_rg_issuer,
                pf_cnh,
                pf_cnh_cat,
                pf_mother,
                pf_father,
                pf_birth,
                pf_marital,
                company_name,
                validated_cnpj,
                legal_rep,
                validated_rep_cpf,
            )
        } else {
            // Regras Pessoa Física
            let raw_cpf = if !req.cpf.trim().is_empty() {
                &req.cpf
            } else if let Some(p) = existing_profile {
                &p.cpf
            } else {
                &req.cpf
            };
            let validated_cpf = validate_cpf(raw_cpf)
                .map_err(|e| IdentityError::Validation(format!("CPF inválido: {}", e)))?;

            let raw_birth = if !req.birth_date.trim().is_empty() {
                &req.birth_date
            } else if let Some(p) = existing_profile {
                &p.birth_date
            } else {
                &req.birth_date
            };
            let validated_birth = if !raw_birth.trim().is_empty() {
                validate_and_normalize_date(raw_birth).map_err(|e| {
                    IdentityError::Validation(format!("Data de nascimento inválida: {}", e))
                })?
            } else {
                String::new()
            };

            let pf_rg = if !req.rg.trim().is_empty() {
                req.rg.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.rg.clone())
                    .unwrap_or_default()
            };
            let pf_rg_issuer = if !req.rg_issuer.trim().is_empty() {
                req.rg_issuer.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.rg_issuer.clone())
                    .unwrap_or_default()
            };
            let pf_cnh = if !req.cnh.trim().is_empty() {
                req.cnh.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.cnh.clone())
                    .unwrap_or_default()
            };
            let pf_cnh_cat = if !req.cnh_category.trim().is_empty() {
                req.cnh_category.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.cnh_category.clone())
                    .unwrap_or_default()
            };
            let pf_mother = if !req.mother_name.trim().is_empty() {
                req.mother_name.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.mother_name.clone())
                    .unwrap_or_default()
            };
            let pf_father = if !req.father_name.trim().is_empty() {
                req.father_name.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.father_name.clone())
                    .unwrap_or_default()
            };
            let pf_marital = if !req.marital_status.trim().is_empty() {
                req.marital_status.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.marital_status.clone())
                    .unwrap_or_default()
            };

            // Preservação ou atualização de dados PJ em modo PF
            let pj_cnpj = if !req.cnpj.trim().is_empty() {
                validate_cnpj(&req.cnpj).unwrap_or_else(|_| {
                    existing_profile
                        .as_ref()
                        .map(|p| p.cnpj.clone())
                        .unwrap_or_default()
                })
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.cnpj.clone())
                    .unwrap_or_default()
            };
            let pj_legal_rep = if !req.legal_representative.trim().is_empty() {
                req.legal_representative.trim().to_string()
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.legal_representative.clone())
                    .unwrap_or_default()
            };
            let pj_legal_rep_cpf = if !req.legal_representative_cpf.trim().is_empty() {
                validate_cpf(&req.legal_representative_cpf).unwrap_or_else(|_| {
                    existing_profile
                        .as_ref()
                        .map(|p| p.legal_representative_cpf.clone())
                        .unwrap_or_default()
                })
            } else {
                existing_profile
                    .as_ref()
                    .map(|p| p.legal_representative_cpf.clone())
                    .unwrap_or_default()
            };

            (
                validated_cpf,
                pf_rg,
                pf_rg_issuer,
                pf_cnh,
                pf_cnh_cat,
                pf_mother,
                pf_father,
                validated_birth,
                pf_marital,
                company_name,
                pj_cnpj,
                pj_legal_rep,
                pj_legal_rep_cpf,
            )
        };

        let social_links = match &req.social_links {
            Some(links) => Some(SocialLinksDto {
                facebook: sanitize_social_url("facebook", &links.facebook)?,
                instagram: sanitize_social_url("instagram", &links.instagram)?,
                linkedin: sanitize_social_url("linkedin", &links.linkedin)?,
                twitter: sanitize_social_url("twitter", &links.twitter)?,
            }),
            None => existing_profile
                .as_ref()
                .and_then(|p| p.social_links.clone()),
        };

        let mut profile = UserProfileDto {
            person_type,
            username,
            first_name,
            last_name,
            display_name,
            cpf,
            rg,
            rg_issuer,
            cnh,
            cnh_category,
            mother_name,
            father_name,
            birth_date,
            nationality: if req.nationality.trim().is_empty() {
                "Brasileira".to_string()
            } else {
                req.nationality.trim().to_string()
            },
            marital_status,
            company_name: final_company_name,
            cnpj,
            legal_representative,
            legal_representative_cpf,
            email: req.email.trim().to_string(),
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
            website: req.website.trim().to_string(),
            about: req.about.trim().to_string(),
            is_public: req.is_public,
            completeness_score: 0,
            revision: req.expected_revision.unwrap_or(0),
            updated_at: chrono::Utc::now().to_rfc3339(),
            photo_url: req.photo_url.clone(),
            cover_url: req.cover_url.clone(),
            linked_providers: req.linked_providers.clone(),
            social_links,
        };

        profile.completeness_score = calculate_completeness_score(&profile);

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
        let record = match IdentityRepository::get_profile_record(&conn)? {
            Some(r) => r,
            None => return Ok(None),
        };

        let aad = AadDomain::UserProfile {
            profile_id: 1,
            vault_instance_id: "default",
        }
        .to_canonical_bytes();

        // Decifra o envelope com a subchave DEVOS/IDENTITY/V2 através da DEK da sessão
        let decrypted_bytes = session
            .with_dek(|dek| {
                let identity_key = Subkeys::derive_identity_key(dek);
                if let Ok(aead) = serde_json::from_str::<AeadEnvelope>(&record.raw_envelope) {
                    VaultCrypto::decrypt_with_aead(&identity_key, &aead, &aad).map_err(|e| {
                        crate::modules::vault::access_control::AccessControlError::Crypto(e)
                    })
                } else {
                    Err(crate::modules::vault::access_control::AccessControlError::Locked)
                }
            })
            .map_err(|_| IdentityError::Crypto)?;

        let decrypted_zero = Zeroizing::new(decrypted_bytes);

        let mut profile: UserProfileDto =
            serde_json::from_slice(&decrypted_zero).map_err(|_| IdentityError::Serialization)?;

        profile.revision = record.revision;
        profile.updated_at = record.updated_at;
        profile.completeness_score = calculate_completeness_score(&profile);

        Ok(Some(profile))
    }

    /// Salva ou atualiza os dados do perfil cifrando-os com a subchave de identidade e persistindo no SQLite.
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

        let existing = Self::get_profile(db, session)?;
        let expected_revision = req.expected_revision;
        let mut profile = Self::sanitize_and_validate(&req, existing.as_ref())?;

        let payload_json =
            Zeroizing::new(serde_json::to_vec(&profile).map_err(|_| IdentityError::Serialization)?);

        let aad = AadDomain::UserProfile {
            profile_id: 1,
            vault_instance_id: "default",
        }
        .to_canonical_bytes();

        // Cifra os dados com a subchave DEVOS/IDENTITY/V2
        let envelope = session
            .with_dek(|dek| {
                let identity_key = Subkeys::derive_identity_key(dek);
                VaultCrypto::encrypt_with_aead(&identity_key, &payload_json, &aad).map_err(|e| {
                    crate::modules::vault::access_control::AccessControlError::Crypto(e)
                })
            })
            .map_err(|_| IdentityError::Crypto)?;

        let envelope_json =
            serde_json::to_string(&envelope).map_err(|_| IdentityError::Serialization)?;

        let mut conn = db.get_connection()?;
        let new_revision =
            IdentityRepository::save_profile_record(&mut conn, &envelope_json, expected_revision)?;

        profile.revision = new_revision;
        profile.updated_at = chrono::Utc::now().to_rfc3339();

        log::info!(
            "[Identity] Perfil salvo com sucesso no cofre seguro SQLite via subchave V2 KEK/DEK. Revisão: {}",
            new_revision
        );

        Ok(profile)
    }

    /// Importa dados legados do localStorage de forma segura e não destrutiva.
    ///
    /// Se já existir um perfil gravado no cofre com revisão ou completude superior,
    /// a persistência existente é preservada para evitar sobrescrita cega.
    pub fn import_legacy_profile(
        db: &LocalDatabase,
        session: &VaultSession,
        legacy_json: &str,
    ) -> Result<UserProfileDto, IdentityError> {
        if !session.is_unlocked() {
            return Err(IdentityError::VaultLocked);
        }

        // 1. Verifica se já existe um perfil ativo no cofre SQLite
        if let Some(existing) = Self::get_profile(db, session)? {
            // Se o perfil existente já tem revisão >= 1 e campos básicos, preserva
            if existing.revision >= 1 && existing.completeness_score > 0 {
                log::info!(
                    "[Identity] Perfil existente no cofre preservado durante reconciliação legada."
                );
                return Ok(existing);
            }
        }

        let value: serde_json::Value = serde_json::from_str(legacy_json)
            .map_err(|_| IdentityError::Validation("Formato JSON legado inválido.".to_string()))?;

        let str_field = |name: &str| -> String {
            value
                .get(name)
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string()
        };

        let bool_field = |name: &str, default: bool| -> bool {
            value.get(name).and_then(|v| v.as_bool()).unwrap_or(default)
        };

        let req = SaveUserProfileRequest {
            person_type: {
                let p = str_field("personType");
                if p.to_uppercase() == PERSON_TYPE_PJ {
                    PERSON_TYPE_PJ.to_string()
                } else {
                    PERSON_TYPE_PF.to_string()
                }
            },
            username: value
                .get("username")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            first_name: str_field("firstName"),
            last_name: str_field("lastName"),
            display_name: value
                .get("displayName")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            cpf: str_field("cpf"),
            rg: str_field("rg"),
            rg_issuer: str_field("rgIssuer"),
            cnh: str_field("cnh"),
            cnh_category: str_field("cnhCategory"),
            mother_name: str_field("motherName"),
            father_name: str_field("fatherName"),
            birth_date: str_field("birthDate"),
            nationality: str_field("nationality"),
            marital_status: str_field("maritalStatus"),
            company_name: str_field("companyName"),
            cnpj: str_field("cnpj"),
            legal_representative: str_field("legalRepresentative"),
            legal_representative_cpf: str_field("legalRepresentativeCpf"),
            email: str_field("email"),
            phone_number: str_field("phoneNumber"),
            country: str_field("country"),
            zip_code: str_field("zipCode"),
            state: str_field("state"),
            city: str_field("city"),
            neighborhood: str_field("neighborhood"),
            address: str_field("address"),
            address_number: str_field("addressNumber"),
            complement: str_field("complement"),
            occupation: str_field("occupation"),
            company: str_field("company"),
            website: str_field("website"),
            about: str_field("about"),
            // Por segurança e privacidade estrita, manter falso a menos que explicitado
            is_public: bool_field("isPublic", false),
            photo_url: value
                .get("photoURL")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            cover_url: value
                .get("coverURL")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            linked_providers: Vec::new(),
            social_links: None,
            expected_revision: None,
        };

        Self::save_profile(db, session, req)
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
        session.set_session_key_for_test("test_master_key_12345678");

        (db, session, TestDirGuard(dir))
    }

    #[test]
    fn test_save_and_get_profile() {
        let (db, session, _dir) = setup_test_vault();

        let req = SaveUserProfileRequest {
            person_type: "PF".to_string(),
            username: Some("carlos_silva".to_string()),
            first_name: "Carlos".to_string(),
            last_name: "Silva".to_string(),
            display_name: None,
            cpf: "52998224725".to_string(),
            rg: "12345678".to_string(),
            rg_issuer: "SSP/SP".to_string(),
            cnh: "".to_string(),
            cnh_category: "".to_string(),
            mother_name: "Ana Silva".to_string(),
            father_name: "".to_string(),
            birth_date: "1990-01-15".to_string(),
            nationality: "Brasileira".to_string(),
            marital_status: "Solteiro(a)".to_string(),
            company_name: "".to_string(),
            cnpj: "".to_string(),
            legal_representative: "".to_string(),
            legal_representative_cpf: "".to_string(),
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
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
            social_links: Some(SocialLinksDto {
                facebook: Some("https://facebook.com/carlos".to_string()),
                instagram: Some("https://instagram.com/carlos".to_string()),
                linkedin: Some("https://linkedin.com/in/carlos".to_string()),
                twitter: Some("https://x.com/carlos".to_string()),
            }),
            expected_revision: None,
        };

        let saved = IdentityService::save_profile(&db, &session, req).expect("Deveria salvar");
        assert_eq!(saved.revision, 1);
        assert_eq!(saved.username, "carlos_silva");
        assert_eq!(saved.cpf, "529.982.247-25");
        assert_eq!(saved.zip_code, "01310-100");
        assert_eq!(saved.display_name, "Carlos Silva");
        assert!(saved.completeness_score > 70);
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
    }

    #[test]
    fn test_optimistic_concurrency_lock() {
        let (db, session, _dir) = setup_test_vault();

        let req1 = SaveUserProfileRequest {
            person_type: "PF".to_string(),
            username: Some("carlos_s".to_string()),
            first_name: "Carlos".to_string(),
            last_name: "Silva".to_string(),
            display_name: None,
            cpf: "52998224725".to_string(),
            rg: "".to_string(),
            rg_issuer: "".to_string(),
            cnh: "".to_string(),
            cnh_category: "".to_string(),
            mother_name: "".to_string(),
            father_name: "".to_string(),
            birth_date: "".to_string(),
            nationality: "".to_string(),
            marital_status: "".to_string(),
            company_name: "".to_string(),
            cnpj: "".to_string(),
            legal_representative: "".to_string(),
            legal_representative_cpf: "".to_string(),
            email: "carlos@test.com".to_string(),
            phone_number: "".to_string(),
            country: "".to_string(),
            zip_code: "".to_string(),
            state: "".to_string(),
            city: "".to_string(),
            neighborhood: "".to_string(),
            address: "".to_string(),
            address_number: "".to_string(),
            complement: "".to_string(),
            occupation: "".to_string(),
            company: "".to_string(),
            website: "".to_string(),
            about: "".to_string(),
            is_public: false,
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
            social_links: None,
            expected_revision: None,
        };

        let saved = IdentityService::save_profile(&db, &session, req1).unwrap();
        assert_eq!(saved.revision, 1);

        // Tentativa de salvar com revisão defasada (expected: 99 em vez de 1)
        let mut req2 = SaveUserProfileRequest {
            first_name: "Carlos Atualizado".to_string(),
            expected_revision: Some(99),
            ..SaveUserProfileRequest {
                person_type: "PF".to_string(),
                username: Some("carlos_s".to_string()),
                first_name: "Carlos".to_string(),
                last_name: "Silva".to_string(),
                display_name: None,
                cpf: "52998224725".to_string(),
                rg: "".to_string(),
                rg_issuer: "".to_string(),
                cnh: "".to_string(),
                cnh_category: "".to_string(),
                mother_name: "".to_string(),
                father_name: "".to_string(),
                birth_date: "".to_string(),
                nationality: "".to_string(),
                marital_status: "".to_string(),
                company_name: "".to_string(),
                cnpj: "".to_string(),
                legal_representative: "".to_string(),
                legal_representative_cpf: "".to_string(),
                email: "carlos@test.com".to_string(),
                phone_number: "".to_string(),
                country: "".to_string(),
                zip_code: "".to_string(),
                state: "".to_string(),
                city: "".to_string(),
                neighborhood: "".to_string(),
                address: "".to_string(),
                address_number: "".to_string(),
                complement: "".to_string(),
                occupation: "".to_string(),
                company: "".to_string(),
                website: "".to_string(),
                about: "".to_string(),
                is_public: false,
                photo_url: None,
                cover_url: None,
                linked_providers: Vec::new(),
                social_links: None,
                expected_revision: None,
            }
        };
        req2.expected_revision = Some(99);

        let err = IdentityService::save_profile(&db, &session, req2);
        assert!(err.is_err());
        assert!(matches!(
            err.unwrap_err(),
            IdentityError::ConcurrencyConflict(_)
        ));
    }

    #[test]
    fn test_normalize_username_canonical() {
        assert_eq!(normalize_username("usuario.teste"), "usuario_teste");
        assert_eq!(
            normalize_username("Usuario.De.Teste@123"),
            "usuario_de_teste_123"
        );
        assert_eq!(normalize_username("__sandro___souza__"), "sandro_souza");
        assert_eq!(normalize_username(""), "");
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
            display_name: None,
            cpf: "52998224725".to_string(),
            rg: "123456".to_string(),
            rg_issuer: "SSP/SP".to_string(),
            cnh: "".to_string(),
            cnh_category: "".to_string(),
            mother_name: "Maria Silva".to_string(),
            father_name: "".to_string(),
            birth_date: "1990-01-01".to_string(),
            nationality: "Brasileira".to_string(),
            marital_status: "Solteiro(a)".to_string(),
            company_name: "".to_string(),
            cnpj: "".to_string(),
            legal_representative: "".to_string(),
            legal_representative_cpf: "".to_string(),
            email: "joao@empresa.com".to_string(),
            phone_number: "11999999999".to_string(),
            country: "Brasil".to_string(),
            zip_code: "01310-100".to_string(),
            state: "SP".to_string(),
            city: "São Paulo".to_string(),
            neighborhood: "Bela Vista".to_string(),
            address: "Av Paulista".to_string(),
            address_number: "1000".to_string(),
            complement: "".to_string(),
            occupation: "Desenvolvedor".to_string(),
            company: "".to_string(),
            website: "".to_string(),
            about: "".to_string(),
            is_public: false,
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
            social_links: None,
            expected_revision: None,
        };

        let saved_pf = IdentityService::save_profile(&db, &session, req_pf).unwrap();
        assert_eq!(saved_pf.person_type, "PF");
        assert_eq!(saved_pf.cpf, "529.982.247-25");

        // 2. Transiciona para PJ, fornecendo CNPJ e Razão Social
        let req_pj = SaveUserProfileRequest {
            person_type: "PJ".to_string(),
            username: Some("joao_silva".to_string()),
            first_name: "".to_string(),
            last_name: "".to_string(),
            display_name: None,
            cpf: "".to_string(),
            rg: "".to_string(),
            rg_issuer: "".to_string(),
            cnh: "".to_string(),
            cnh_category: "".to_string(),
            mother_name: "".to_string(),
            father_name: "".to_string(),
            birth_date: "".to_string(),
            nationality: "Brasileira".to_string(),
            marital_status: "".to_string(),
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
            complement: "".to_string(),
            occupation: "Tecnologia".to_string(),
            company: "".to_string(),
            website: "".to_string(),
            about: "".to_string(),
            is_public: false,
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
            social_links: None,
            expected_revision: Some(saved_pf.revision),
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
            first_name: "".to_string(), // Deve preservar "João"
            last_name: "".to_string(),  // Deve preservar "Silva"
            display_name: None,
            cpf: "".to_string(), // Deve preservar "529.982.247-25"
            rg: "".to_string(),
            rg_issuer: "".to_string(),
            cnh: "".to_string(),
            cnh_category: "".to_string(),
            mother_name: "".to_string(),
            father_name: "".to_string(),
            birth_date: "".to_string(),
            nationality: "Brasileira".to_string(),
            marital_status: "".to_string(),
            company_name: "".to_string(), // Deve preservar "Minha Empresa Ltda"
            cnpj: "".to_string(),         // Deve preservar "12.ABC.345/01DE-35"
            legal_representative: "".to_string(),
            legal_representative_cpf: "".to_string(),
            email: "joao@email.com".to_string(),
            phone_number: "11988888888".to_string(),
            country: "Brasil".to_string(),
            zip_code: "01310-100".to_string(),
            state: "SP".to_string(),
            city: "São Paulo".to_string(),
            neighborhood: "Bela Vista".to_string(),
            address: "Av Paulista".to_string(),
            address_number: "1000".to_string(),
            complement: "".to_string(),
            occupation: "Engenheiro".to_string(),
            company: "".to_string(),
            website: "".to_string(),
            about: "".to_string(),
            is_public: false,
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
            social_links: None,
            expected_revision: Some(saved_pj.revision),
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
    fn test_social_url_validation_security() {
        // 1. URL legítima de cada plataforma com HTTPS
        let linkedin = Some("https://www.linkedin.com/in/devos".to_string());
        assert!(sanitize_social_url("linkedin", &linkedin).is_ok());

        let twitter = Some("https://x.com/devos_dao".to_string());
        assert!(sanitize_social_url("twitter", &twitter).is_ok());

        let fb = Some("https://facebook.com/devos".to_string());
        assert!(sanitize_social_url("facebook", &fb).is_ok());

        let insta = Some("https://instagram.com/devos".to_string());
        assert!(sanitize_social_url("instagram", &insta).is_ok());

        // 2. Domínio falso (phishing / spoofing de subdomínio)
        let fake_host = Some("https://linkedin.com.site-malicioso.com".to_string());
        assert!(sanitize_social_url("linkedin", &fake_host).is_err());

        // 3. Plataforma cruzada / incorreta
        let wrong_platform = Some("https://linkedin.com/in/user".to_string());
        assert!(sanitize_social_url("instagram", &wrong_platform).is_err());

        // 4. Credenciais embutidas na URL
        let credentials = Some("https://admin:secret@linkedin.com".to_string());
        assert!(sanitize_social_url("linkedin", &credentials).is_err());

        // 5. Porta não convencional
        let custom_port = Some("https://x.com:8080/user".to_string());
        assert!(sanitize_social_url("twitter", &custom_port).is_err());

        // 6. Protocolo inseguro HTTP
        let insecure = Some("http://linkedin.com/in/user".to_string());
        assert!(sanitize_social_url("linkedin", &insecure).is_err());

        // 7. URL malformada
        let malformed = Some("https://".to_string());
        assert!(sanitize_social_url("linkedin", &malformed).is_err());

        // 8. Campo opcional vazio ou nulo
        let empty = Some(String::new());
        assert_eq!(sanitize_social_url("linkedin", &empty).unwrap(), None);

        let none: Option<String> = None;
        assert_eq!(sanitize_social_url("linkedin", &none).unwrap(), None);

        // 9. Excesso de bytes (> 2048)
        let too_long = Some(format!("https://linkedin.com/in/{}", "a".repeat(2048)));
        assert!(sanitize_social_url("linkedin", &too_long).is_err());
    }
}
