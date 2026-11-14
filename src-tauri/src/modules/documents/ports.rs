use std::sync::Arc;

use crate::modules::documents::models::{DocumentError, DocumentKind, DocumentRequest};
use crate::platform::typst_engine::{
    inspect_pdf_bytes_pages, validate_pdf_structure, RenderedPagePreview,
};

/// Resultado bruto da compilação documental emitida por um renderizador.
///
/// Encapsula os bytes binários do documento gerado (PDF) compartilhados via `Arc<[u8]>`
/// para evitar cópias profundas em memória durante visualização e exportação, além
/// das páginas vetoriais correspondentes para visualização interna.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RenderedDocument {
    pub pdf_bytes: Arc<[u8]>,
    pub pages: Vec<RenderedPagePreview>,
}

impl RenderedDocument {
    /// Constrói um `RenderedDocument` validando estruturalmente o buffer PDF (%PDF- e %%EOF).
    pub fn try_new<B: Into<Arc<[u8]>>>(pdf_bytes: B) -> Result<Self, DocumentError> {
        let pdf_bytes = pdf_bytes.into();
        validate_pdf_structure(&pdf_bytes)
            .map_err(|e| DocumentError::CompilationError(e.to_string()))?;
        let pages = inspect_pdf_bytes_pages(&pdf_bytes)
            .map_err(|e| DocumentError::CompilationError(e.to_string()))?;
        Ok(Self { pdf_bytes, pages })
    }

    /// Construtor compatível com fallback controlado.
    pub fn new<B: Into<Arc<[u8]>>>(pdf_bytes: B) -> Self {
        let pdf_bytes = pdf_bytes.into();
        let pages = inspect_pdf_bytes_pages(&pdf_bytes).unwrap_or_default();
        Self { pdf_bytes, pages }
    }

    pub fn with_pages<B: Into<Arc<[u8]>>>(pdf_bytes: B, pages: Vec<RenderedPagePreview>) -> Self {
        Self {
            pdf_bytes: pdf_bytes.into(),
            pages,
        }
    }
}

/// Port abstrata para motores e adaptadores de renderização documental.
///
/// Define o contrato entre o módulo de documentos e suas implementações
/// concretas, permitindo substituir ou adicionar renderizadores sem acoplar
/// os consumidores a um mecanismo específico.
///
/// `Send + Sync` permite que implementações satisfaçam os requisitos de
/// transferência e compartilhamento entre threads do Rust. Cada implementação
/// continua responsável pela segurança de seu estado interno.
pub trait DocumentRenderer: Send + Sync {
    /// Renderiza uma requisição documental gerando os bytes físicos do arquivo
    /// e as páginas vetoriais para visualização.
    fn render(&self, request: DocumentRequest) -> Result<RenderedDocument, DocumentError>;

    /// Renderiza exclusivamente o binário PDF do documento sem alocar nem calcular
    /// representações vetoriais de páginas em SVG, otimizando CPU e memória para gravação direta.
    fn render_pdf_only(&self, request: DocumentRequest) -> Result<RenderedDocument, DocumentError> {
        self.render(request)
    }

    /// Informa se este renderizador oferece suporte ao tipo documental.
    fn supports(&self, kind: DocumentKind) -> bool;
}
