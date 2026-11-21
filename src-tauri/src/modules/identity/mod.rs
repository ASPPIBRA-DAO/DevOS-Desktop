//! Módulo de Identidade Civil, Perfil do Usuário e Qualificação Institucional.
//!
//! Fornece modelos de dados, rotinas de validação de documentos oficiais (CPF, CNPJ, CEP),
//! persistência criptográfica em cofre local SQLite e sincronização com sessão ativa.

pub mod models;
pub(crate) mod repository;
pub mod service;

pub use models::{
    calculate_completeness_score, contains_dangerous_control_or_bidi, extract_digits,
    validate_and_normalize_date, validate_cep, validate_cnpj, validate_cpf, PublicUserProfileDto,
    SaveUserProfileRequest, SocialLinksDto, UserProfileDto, CURRENT_PROFILE_PAYLOAD_VERSION,
    PERSON_TYPE_PF, PERSON_TYPE_PJ,
};
pub use service::{normalize_username, sanitize_social_url, IdentityError, IdentityService};
