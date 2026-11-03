use crate::modules::documents::models::{DocumentError, DocumentKind, DocumentRequest};

/// Resultado bruto da compilação documental emitida por um renderizador.
///
/// Encapsula exclusivamente os bytes binários do documento gerado (por exemplo, PDF),
/// sem metadados de emissão ou cálculos criptográficos de integridade.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RenderedDocument {
    pub pdf_bytes: Vec<u8>,
}

impl RenderedDocument {
    pub fn new(pdf_bytes: Vec<u8>) -> Self {
        Self { pdf_bytes }
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
    /// Renderiza uma requisição documental gerando os bytes físicos do arquivo.
    ///
    /// Retorna `RenderedDocument` em caso de sucesso, ou `DocumentError` quando
    /// a compilação física falhar.
    fn render(&self, request: DocumentRequest) -> Result<RenderedDocument, DocumentError>;

    /// Informa se este renderizador oferece suporte ao tipo documental.
    ///
    /// Este método descreve a capacidade do renderizador para um determinado
    /// `DocumentKind`. Não garante que um payload específico seja válido,
    /// que a renderização será bem-sucedida ou que a operação esteja
    /// autorizada no contexto atual da aplicação.
    fn supports(&self, kind: DocumentKind) -> bool;
}
