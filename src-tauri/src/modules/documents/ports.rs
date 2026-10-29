use crate::modules::documents::models::{
    DocumentError,
    DocumentKind,
    DocumentOutput,
    DocumentRequest,
};

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
    /// Renderiza uma requisição documental.
    ///
    /// Retorna os bytes do documento e seus metadados em caso de sucesso,
    /// ou um `DocumentError` quando a operação não puder ser concluída.
    ///
    /// Implementações devem tratar tipos não suportados de acordo com o
    /// contrato de `DocumentError`, sem indicar sucesso quando a renderização
    /// não tiver sido concluída.
    ///
    /// A validação dos dados e os controles de autorização devem respeitar
    /// as responsabilidades definidas pelas camadas superiores e pela
    /// implementação concreta.
    fn render(
        &self,
        request: DocumentRequest,
    ) -> Result<DocumentOutput, DocumentError>;

    /// Informa se este renderizador oferece suporte ao tipo documental.
    ///
    /// Este método descreve a capacidade do renderizador para um determinado
    /// `DocumentKind`. Não garante que um payload específico seja válido,
    /// que a renderização será bem-sucedida ou que a operação esteja
    /// autorizada no contexto atual da aplicação.
    fn supports(
        &self,
        kind: DocumentKind,
    ) -> bool;
}
