//! Módulos públicos de comandos da aplicação.
//!
//! Cada módulo agrupa comandos relacionados a uma área funcional.
//! Os módulos permanecem acessíveis individualmente, enquanto suas
//! reexportações preservam o acesso simplificado aos itens públicos
//! utilizado pelo restante do aplicativo.

pub mod document_commands;
pub mod monitoring_commands;
pub mod real_estate_commands;
pub mod system_commands;
pub mod vault_commands;
pub mod wallet_commands;

// Mantém a API pública existente e a compatibilidade com os imports atuais.
pub use self::document_commands::*;
pub use self::monitoring_commands::*;
pub use self::real_estate_commands::*;
pub use self::system_commands::*;
pub use self::vault_commands::*;
pub use self::wallet_commands::*;
