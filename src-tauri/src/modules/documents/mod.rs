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

use std::sync::OnceLock;

static ACTIVE_APPLICATION_EDITION: OnceLock<ApplicationEdition> = OnceLock::new();

/// Inicializa imutavelmente a edição do DevOS na subida do executável.
///
/// Aplica o princípio do fail-closed: a edição só pode ser configurada uma única vez no boot.
pub fn initialize_application_edition(edition: ApplicationEdition) -> Result<(), &'static str> {
    ACTIVE_APPLICATION_EDITION
        .set(edition)
        .map_err(|_| "A edição da aplicação já foi previamente configurada e é imutável.")
}

/// Retorna a edição ativa da aplicação, ou erro se o sistema ainda não foi inicializado.
pub fn get_active_application_edition() -> Result<ApplicationEdition, DocumentError> {
    ACTIVE_APPLICATION_EDITION
        .get()
        .copied()
        .ok_or_else(|| {
            DocumentError::UnauthorizedScope(
                "Operações documentais bloqueadas: a edição da aplicação não foi inicializada."
                    .to_string(),
            )
        })
}

/// Retorna a edição ativa da aplicação.
/// Em caso de chamada antes da inicialização, opera em fail-closed retornando Node (compatibilidade retroativa).
pub fn active_application_edition() -> ApplicationEdition {
    ACTIVE_APPLICATION_EDITION
        .get()
        .copied()
        .unwrap_or(ApplicationEdition::Node)
}

/// Configura o escopo documental correspondente à edição ativa da aplicação (compatibilidade).
pub fn configure_active_document_scope(scope: DocumentScope) -> Result<(), &'static str> {
    let edition = match scope {
        DocumentVisibility::CockpitOnly => ApplicationEdition::Cockpit,
        _ => ApplicationEdition::Node,
    };
    initialize_application_edition(edition)
}

/// Retorna o escopo documental configurado para a edição ativa da aplicação.
///
/// FAIL-CLOSED ESTRITO: Se a aplicação não tiver sido inicializada oficialmente via `initialize_application_edition`,
/// retorna `DocumentVisibility::Uninitialized`, bloqueando todas as operações documentais.
pub fn active_document_scope() -> DocumentScope {
    match ACTIVE_APPLICATION_EDITION.get() {
        Some(ApplicationEdition::Cockpit) => DocumentVisibility::CockpitOnly,
        Some(ApplicationEdition::Node) => DocumentVisibility::NodeOnly,
        None => DocumentVisibility::Uninitialized,
    }
}

/// Cria uma instância do `DocumentsService` configurada para uma edição explícita.
/// Útil para testes automatizados isolados de cada edição sem depender de estado global.
pub fn documents_service_for_edition(edition: ApplicationEdition) -> DocumentsService {
    DocumentsService::with_edition(std::sync::Arc::new(TypstDocumentRenderer::new()), edition)
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
///
/// Aplica fail-closed estrito: falha com `DocumentError::UnauthorizedScope` caso a aplicação
/// não tenha sido inicializada oficialmente no boot.
pub fn default_documents_service() -> Result<DocumentsService, DocumentError> {
    let edition = get_active_application_edition()?;
    Ok(documents_service_for_edition(edition))
}
