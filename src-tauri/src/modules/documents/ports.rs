use crate::modules::documents::models::{
    DocumentError, DocumentKind, DocumentOutput, DocumentRequest,
};

/// Trait abstrato (Port) para motores e adaptadores de renderização de documentos
pub trait DocumentRenderer: Send + Sync {
    /// Renderiza uma requisição de documento retornando os bytes do PDF e metadados
    fn render(&self, request: DocumentRequest) -> Result<DocumentOutput, DocumentError>;

    /// Informa se o renderer suporta o tipo de documento requisitado
    fn supports(&self, kind: DocumentKind) -> bool;
}
