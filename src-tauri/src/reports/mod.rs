//! Fachada pública do módulo de relatórios do DevOS Desktop.
//!
//! Organiza e disponibiliza os modelos e as funções responsáveis pela
//! compilação dos relatórios financeiros e documentais.
//!
//! # Submódulos
//!
//! - [`engine`]: implementação das operações de compilação dos relatórios.
//! - [`models`]: modelos e contratos de dados utilizados pelo módulo.
//!
//! # API pública
//!
//! As funções de compilação são reexportadas explicitamente para manter
//! uma interface de consumo previsível. Os modelos públicos são
//! reexportados para preservar os caminhos de importação existentes.

pub mod engine;
pub mod models;

// Operações públicas de compilação dos relatórios.
pub use engine::{
    compile_citizen_ledger_pdf,
    compile_invoice_pdf,
};

// Modelos e contratos públicos do módulo.
pub use models::*;
