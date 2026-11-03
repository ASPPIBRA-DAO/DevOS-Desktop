//! Fachada pública do módulo de documentos do DevOS Desktop.
//!
//! Organiza e expõe os contratos, as abstrações de renderização e os serviços
//! responsáveis pela geração documental.
//!
//! # Submódulos
//!
//! - [`models`]: modelos, enums, requisições, resultados e erros documentais.
//! - [`ports`]: contratos e abstrações dos mecanismos de renderização.
//! - [`service`]: implementação dos serviços de geração documental.
//!
//! Os itens públicos dos submódulos são reexportados para preservar uma
//! interface de consumo simples e compatível com os imports existentes.

pub mod models;
pub mod ports;
pub mod service;
pub mod typst_renderer;

// Mantém os modelos disponíveis diretamente na raiz do módulo.
pub use models::*;

// Mantém as abstrações disponíveis diretamente na raiz do módulo.
pub use ports::*;

// Mantém os serviços disponíveis diretamente na raiz do módulo.
pub use service::*;

// Mantém o renderizador Typst disponível na raiz do módulo.
pub use typst_renderer::*;

/// Cria uma instância do `DocumentsService` configurada com o renderizador institucional Typst.
///
/// Atua como ponto canônico de composição (Composition Root) para consumidores que
/// requerem a pilha documental padrão da aplicação.
pub fn default_documents_service() -> DocumentsService {
    DocumentsService::new(std::sync::Arc::new(TypstDocumentRenderer::new()))
}
