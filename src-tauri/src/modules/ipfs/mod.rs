//! Módulo IPFS & Infraestrutura DePIN do DevOS Desktop.
//!
//! Fornece comunicação com a API RPC do Kubo, controle seguro do ciclo de vida
//! do daemon local e resolução de desafios criptográficos de armazenamento.

pub mod client;
pub mod daemon;
pub mod models;

pub use client::*;
pub use daemon::*;
pub use models::*;
