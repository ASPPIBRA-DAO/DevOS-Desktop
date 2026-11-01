//! Módulos responsáveis pelo controle de acesso e pelas operações
//! criptográficas da aplicação.
//!
//! Os módulos permanecem públicos e suas reexportações preservam
//! o acesso simplificado aos itens públicos utilizado pelos
//! consumidores existentes.

pub mod access_control;
pub mod encryption;

// Mantém a API pública existente do controle de acesso.
pub use self::access_control::*;

// Mantém a API pública existente de criptografia.
pub use self::encryption::*;
