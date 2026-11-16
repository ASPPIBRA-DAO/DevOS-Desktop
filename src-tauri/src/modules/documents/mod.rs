//! Fachada pública do módulo de documentos do DevOS Desktop.
//!
//! Organiza e expõe os contratos, as abstrações de renderização e os serviços
//! responsáveis pela geração documental.
//!
//! A edição da aplicação (`Cockpit` ou `Node`) define a disponibilidade e o escopo de documentos.
//! Ela é fixada uma única vez no boot a partir do identificador do bundle da aplicação,
//! atuando como regra de produto/distribuição (e não como barreira de segurança isolada).
//!
//! # Submódulos
//!
//! - [`models`]: modelos, enums, requisições, resultados e erros documentais.
//! - [`ports`]: contratos e abstrações dos mecanismos de renderização.
//! - [`preview_store`]: gerenciamento seguro de cache em memória para visualização e exportação.
//! - [`service`]: implementação dos serviços de geração documental.
//! - [`typst_renderer`]: renderizador institucional baseado no motor Typst.
//!
//! Os itens públicos dos submódulos são reexportados para preservar uma
//! interface de consumo simples e compatível com os imports existentes.

pub mod models;
pub mod ports;
pub mod preview_store;
pub mod service;
pub mod typst_renderer;

// Mantém os modelos disponíveis diretamente na raiz do módulo (exceto módulos auxiliares internos).
pub use models::{
    ApplicationEdition, COCKPIT_APP_IDENTIFIER, CessaoPossePayload, CitizenLedgerPayload,
    DocumentError, DocumentKind, DocumentMetadata, DocumentOutput, DocumentRequest, DocumentScope,
    DocumentVisibility, InvoiceReportItem, InvoiceReportPayload, InvoiceStatus,
    NODE_APP_IDENTIFIER, RealEstateReconciliationPayload,
};

// Mantém as abstrações e portas disponíveis na raiz do módulo.
pub use ports::{DocumentRenderer, RenderedDocument};

// Mantém o store de previews em memória e reserva de exportação disponíveis na raiz do módulo.
#[cfg(test)]
pub use preview_store::MockMonotonicClock;
pub use preview_store::{
    DocumentPreviewStore, ExportReservation, PreviewStoreError, StoredDocumentPreview,
    global_preview_store,
};

// Mantém os serviços de geração disponíveis na raiz do módulo.
pub use service::DocumentsService;

// Mantém o renderizador Typst e helpers de formatação disponíveis na raiz do módulo.
pub use typst_renderer::{TypstDocumentRenderer, format_decimal_br};

use std::sync::OnceLock;

static ACTIVE_APPLICATION_EDITION: OnceLock<ApplicationEdition> = OnceLock::new();

/// Define a edição uma única vez no boot; chamadas seguintes retornam erro.
pub fn initialize_application_edition(edition: ApplicationEdition) -> Result<(), DocumentError> {
    ACTIVE_APPLICATION_EDITION.set(edition).map_err(|_| {
        DocumentError::UnauthorizedScope(
            "A edição da aplicação já foi previamente configurada e é imutável.".to_string(),
        )
    })
}

/// Retorna a edição ativa da aplicação, ou erro se o sistema ainda não foi inicializado.
pub fn get_active_application_edition() -> Result<ApplicationEdition, DocumentError> {
    ACTIVE_APPLICATION_EDITION.get().copied().ok_or_else(|| {
        DocumentError::UnauthorizedScope(
            "Operações documentais bloqueadas: a edição da aplicação não foi inicializada."
                .to_string(),
        )
    })
}

// TODO(dívida): remover após migrar document_commands.rs e reports/engine.rs.
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

/// Ponto canônico de composição de produção para instanciar o `DocumentsService`
/// com o renderizador institucional Typst e uma edição explícita.
pub fn documents_service_for_edition(edition: ApplicationEdition) -> DocumentsService {
    DocumentsService::with_edition(std::sync::Arc::new(TypstDocumentRenderer::new()), edition)
}

/// Cria uma instância do `DocumentsService` configurada com o renderizador institucional Typst
/// e um escopo de edição explícito.
///
/// Retorna erro de escopo não autorizado se `scope` for `Universal` ou `Uninitialized`.
pub fn documents_service_with_scope(
    scope: DocumentScope,
) -> Result<DocumentsService, DocumentError> {
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
