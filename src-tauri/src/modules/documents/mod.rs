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
pub mod preview_store;
pub mod service;
pub mod typst_renderer;

// Mantém os modelos disponíveis diretamente na raiz do módulo.
pub use models::*;

// Mantém as abstrações disponíveis diretamente na raiz do módulo.
pub use ports::*;

// Mantém o store de previews em memória disponível na raiz do módulo.
pub use preview_store::*;

// Mantém os serviços disponíveis diretamente na raiz do módulo.
pub use service::*;

// Mantém o renderizador Typst disponível na raiz do módulo.
pub use typst_renderer::*;

use std::sync::atomic::{AtomicU8, Ordering};

const SCOPE_COCKPIT_ONLY: u8 = 0;
const SCOPE_NODE_ONLY: u8 = 1;
const SCOPE_UNIVERSAL: u8 = 2;

static ACTIVE_DOCUMENT_SCOPE: AtomicU8 = AtomicU8::new(SCOPE_COCKPIT_ONLY);

fn encode_scope(scope: DocumentScope) -> u8 {
    match scope {
        DocumentScope::CockpitOnly => SCOPE_COCKPIT_ONLY,
        DocumentScope::NodeOnly => SCOPE_NODE_ONLY,
        DocumentScope::Universal => SCOPE_UNIVERSAL,
    }
}

fn decode_scope(code: u8) -> DocumentScope {
    match code {
        SCOPE_COCKPIT_ONLY => DocumentScope::CockpitOnly,
        SCOPE_NODE_ONLY => DocumentScope::NodeOnly,
        _ => DocumentScope::Universal,
    }
}

/// Configura o escopo documental correspondente à edição ativa da aplicação.
pub fn configure_active_document_scope(scope: DocumentScope) {
    ACTIVE_DOCUMENT_SCOPE.store(encode_scope(scope), Ordering::SeqCst);
}

/// Retorna o escopo documental configurado para a edição ativa da aplicação.
pub fn active_document_scope() -> DocumentScope {
    decode_scope(ACTIVE_DOCUMENT_SCOPE.load(Ordering::SeqCst))
}

/// Cria uma instância do `DocumentsService` configurada com o renderizador institucional Typst
/// e um escopo de edição explícito.
pub fn documents_service_with_scope(scope: DocumentScope) -> DocumentsService {
    DocumentsService::with_scope(std::sync::Arc::new(TypstDocumentRenderer::new()), scope)
}

/// Cria uma instância do `DocumentsService` configurada com o renderizador institucional Typst
/// e o escopo ativo da aplicação.
///
/// Atua como ponto canônico de composição (Composition Root) para consumidores que
/// requerem a pilha documental padrão da aplicação.
pub fn default_documents_service() -> DocumentsService {
    documents_service_with_scope(active_document_scope())
}
