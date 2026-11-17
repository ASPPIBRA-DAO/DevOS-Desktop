//! Módulo de Identidade Civil, Perfil do Usuário e Qualificação Institucional.
//!
//! Fornece modelos de dados, rotinas de validação de documentos oficiais (CPF, CNPJ, CEP),
//! persistência criptográfica em cofre local SQLite e sincronização com sessão ativa.

pub mod models;
pub mod repository;
pub mod service;

pub use models::*;
pub use repository::*;
pub use service::*;
