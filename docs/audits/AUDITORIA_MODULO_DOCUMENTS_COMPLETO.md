# Auditoria Técnica Completa — Módulo Documents (DevOS Desktop)

Este arquivo consolida o código-fonte integral de todos os 6 arquivos do módulo `documents`.
Todos os arquivos estão 100% completos, sem omissões, comentários removidos ou partes truncadas.

## Índice de Arquivos

- [`mod.rs`](#file-mod-rs) (120 linhas)
- [`ports.rs`](#file-ports-rs) (87 linhas)
- [`models.rs`](#file-models-rs) (1807 linhas)
- [`preview_store.rs`](#file-preview_store-rs) (1114 linhas)
- [`service.rs`](#file-service-rs) (718 linhas)
- [`typst_renderer.rs`](#file-typst_renderer-rs) (1237 linhas)

---

<a id="file-mod-rs"></a>
## File: `mod.rs`
Caminho: `src/modules/documents/mod.rs` (120 linhas)

```rust
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
    ApplicationEdition, CessaoPossePayload, CitizenLedgerPayload, DocumentError, DocumentKind,
    DocumentMetadata, DocumentOutput, DocumentRequest, DocumentScope, DocumentVisibility,
    InvoiceReportItem, InvoiceReportPayload, InvoiceStatus, RealEstateReconciliationPayload,
    COCKPIT_APP_IDENTIFIER, NODE_APP_IDENTIFIER,
};

// Mantém as abstrações e portas disponíveis na raiz do módulo.
pub use ports::{DocumentRenderer, RenderedDocument};

// Mantém o store de previews em memória e reserva de exportação disponíveis na raiz do módulo.
pub use preview_store::{
    global_preview_store, DocumentPreviewStore, ExportReservation, PreviewStoreError,
    StoredDocumentPreview,
};
#[cfg(test)]
pub use preview_store::MockMonotonicClock;

// Mantém os serviços de geração disponíveis na raiz do módulo.
pub use service::DocumentsService;

// Mantém o renderizador Typst e helpers de formatação disponíveis na raiz do módulo.
pub use typst_renderer::{format_decimal_br, TypstDocumentRenderer};

use std::sync::OnceLock;

static ACTIVE_APPLICATION_EDITION: OnceLock<ApplicationEdition> = OnceLock::new();

/// Define a edição uma única vez no boot; chamadas seguintes retornam erro.
pub fn initialize_application_edition(edition: ApplicationEdition) -> Result<(), DocumentError> {
    ACTIVE_APPLICATION_EDITION
        .set(edition)
        .map_err(|_| {
            DocumentError::UnauthorizedScope(
                "A edição da aplicação já foi previamente configurada e é imutável.".to_string(),
            )
        })
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
```

---

<a id="file-ports-rs"></a>
## File: `ports.rs`
Caminho: `src/modules/documents/ports.rs` (87 linhas)

```rust
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
#[derive(Clone, PartialEq, Eq)]
pub struct RenderedDocument {
    pub pdf_bytes: Arc<[u8]>,
    pub pages: Vec<RenderedPagePreview>,
}

impl std::fmt::Debug for RenderedDocument {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("RenderedDocument")
            .field("pdf_bytes_len", &self.pdf_bytes.len())
            .field("pages_count", &self.pages.len())
            .finish()
    }
}

impl RenderedDocument {
    /// Constrói um `RenderedDocument` validando estruturalmente o buffer PDF (%PDF- e %%EOF).
    ///
    /// As mensagens de erro são técnicas e podem conter trechos do documento; não devem
    /// ser exibidas nem registradas sem filtro (usar [`DocumentError::public_message()`]).
    pub fn try_new<B: Into<Arc<[u8]>>>(pdf_bytes: B) -> Result<Self, DocumentError> {
        let pdf_bytes = pdf_bytes.into();
        validate_pdf_structure(&pdf_bytes)
            .map_err(|e| DocumentError::CompilationError(e.to_string()))?;
        let pages = inspect_pdf_bytes_pages(&pdf_bytes)
            .map_err(|e| DocumentError::CompilationError(e.to_string()))?;
        Ok(Self { pdf_bytes, pages })
    }

    /// Construtor de teste compatível (não valida PDF). Não deve ser usado em código de produção.
    #[cfg(test)]
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
///
/// As mensagens de erro retornadas pelas operações são técnicas e podem conter
/// trechos do documento; não devem ser exibidas nem registradas sem filtro
/// (usar [`DocumentError::public_message()`]).
pub trait DocumentRenderer: Send + Sync {
    /// Renderiza uma requisição documental gerando os bytes físicos do arquivo
    /// e as páginas vetoriais para visualização.
    fn render(&self, request: DocumentRequest) -> Result<RenderedDocument, DocumentError>;

    /// Renderiza exclusivamente o binário PDF do documento.
    ///
    /// A implementação padrão deste método delega diretamente a [`render`](Self::render)
    /// (portanto gerando e alocando as páginas na memória). Renderizadores que queiram
    /// economizar CPU e memória para gravação direta devem sobrescrever este método.
    fn render_pdf_only(&self, request: DocumentRequest) -> Result<RenderedDocument, DocumentError> {
        self.render(request)
    }

    /// Informa se este renderizador oferece suporte ao tipo documental.
    fn supports(&self, kind: DocumentKind) -> bool;
}
```

---

<a id="file-models-rs"></a>
## File: `models.rs`
Caminho: `src/modules/documents/models.rs` (1807 linhas)

```rust
use chrono::NaiveDate;
use rust_decimal::{Decimal, RoundingStrategy};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use thiserror::Error;

/// Teto máximo de tamanho do payload JSON em bytes para proteção contra exaustão de memória (32 MiB).
pub const MAX_PAYLOAD_JSON_BYTES: usize = 32 * 1024 * 1024;

/// Limite máximo de elementos por array em payloads JSON para evitar travamento do compilador (200.000).
pub const MAX_ARRAY_ITEMS: usize = 200_000;

/// Limite máximo de profundidade de aninhamento em payloads JSON (64).
pub const MAX_JSON_DEPTH: usize = 64;

/// Chaves obrigatórias mínimas para emissão válida de um Contrato de Cessão de Posse.
pub const CESSAO_REQUIRED_KEYS: &[&str] = &[
    "cedenteNome",
    "cedenteCpf",
    "cedenteNacionalidade",
    "cedenteEstadoCivil",
    "cedenteEndereco",
    "cessionarioNome",
    "cessionarioCpf",
    "cessionarioNacionalidade",
    "cessionarioEstadoCivil",
    "cessionarioEndereco",
    "numeroLote",
    "quadraLote",
];

/// Status do ciclo de vida financeiro de uma fatura associativa.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InvoiceStatus {
    Pending,
    Paid,
    Overdue,
    Cancelled,
}

/// Erros do pipeline de emissão documental.
///
/// As variantes podem conter detalhes técnicos para diagnóstico interno.
/// Na fronteira IPC, utilize `public_message()` para obter uma mensagem
/// destinada à apresentação ao usuário.
#[derive(Error, Debug, PartialEq, Eq, Clone, Serialize, Deserialize)]
pub enum DocumentError {
    #[error("Tipo de documento não suportado: {0}")]
    UnsupportedDocumentType(String),

    #[error("Falha na serialização do payload: {0}")]
    SerializationError(String),

    #[error("Erro durante a compilação do documento: {0}")]
    CompilationError(String),

    #[error("Erro de validação dos dados de entrada: {0}")]
    ValidationError(String),

    #[error("Acesso não autorizado para esta edição do sistema: {0}")]
    UnauthorizedScope(String),

    #[error("Preview do documento não encontrado: {0}")]
    PreviewNotFound(String),

    #[error("Sessão de preview expirada: {0}")]
    PreviewExpired(String),

    #[error("Falha de integridade do documento: {0}")]
    IntegrityError(String),

    #[error("Capacidade do armazenamento de previews excedida: {0}")]
    PreviewCapacity(String),
}

impl DocumentError {
    /// Retorna uma mensagem apropriada para apresentação ao usuário.
    ///
    /// Não substitui o tratamento de erros na camada IPC.
    /// O chamador deve utilizar este método em vez de expor diretamente
    /// os detalhes técnicos contidos nas variantes do erro.
    pub fn public_message(&self) -> &'static str {
        match self {
            Self::UnsupportedDocumentType(_) => "O tipo de documento solicitado não é suportado.",
            Self::SerializationError(_) => "Não foi possível preparar os dados do documento.",
            Self::CompilationError(_) => "Não foi possível gerar o documento.",
            Self::ValidationError(_) => "Os dados fornecidos para o documento são inválidos.",
            Self::UnauthorizedScope(_) => {
                "Esta edição do aplicativo não está autorizada a gerar este documento."
            }
            Self::PreviewNotFound(_) => "O preview do documento solicitado não foi encontrado.",
            Self::PreviewExpired(_) => {
                "A sessão de visualização do documento expirou. Gere a visualização novamente."
            }
            Self::IntegrityError(_) => {
                "Falha na verificação de integridade do documento. Gere a visualização novamente."
            }
            Self::PreviewCapacity(_) => {
                "A capacidade temporária de visualização de documentos foi atingida. Tente novamente em instantes."
            }
        }
    }
}

/// Identificador da família/modelo de documento no catálogo de emissão.
///
/// A representação serializada utiliza `snake_case`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DocumentKind {
    /// Extrato de Livro-Razão do Cidadão (Citizen Ledger).
    CitizenLedger,

    /// Fatura / Recibo Associativo (Invoice Bill).
    InvoiceBill,

    /// Contrato de Cessão de Posse de Imóvel.
    CessaoPosse,

    /// Relatório Analítico de Reconciliação Imobiliária.
    RealEstateReconciliation,
}

impl DocumentKind {
    /// Declara a visibilidade necessária para o tipo documental.
    pub fn required_visibility(&self) -> DocumentVisibility {
        match self {
            DocumentKind::CitizenLedger => DocumentVisibility::Universal,
            DocumentKind::InvoiceBill => DocumentVisibility::Universal,
            DocumentKind::CessaoPosse => DocumentVisibility::CockpitOnly,
            DocumentKind::RealEstateReconciliation => DocumentVisibility::CockpitOnly,
        }
    }

    /// Declara o escopo necessário para o tipo documental (compatibilidade com versões anteriores).
    #[deprecated(note = "use required_visibility")]
    pub fn required_scope(&self) -> DocumentScope {
        self.required_visibility()
    }

    /// Retorna o identificador do template utilizado pelo tipo documental.
    pub fn template_id(&self) -> &'static str {
        match self {
            DocumentKind::CitizenLedger => "extrato_citizen_ledger.typ",
            DocumentKind::InvoiceBill => "invoice_bill.typ",
            DocumentKind::CessaoPosse => "contrato_cessao_posse.typ",
            DocumentKind::RealEstateReconciliation => "real_estate_reconciliation.typ",
        }
    }
}

pub const COCKPIT_APP_IDENTIFIER: &str = "br.aspp.devos.cockpit";
pub const NODE_APP_IDENTIFIER: &str = "br.aspp.devos.node";

/// Edição executável da aplicação DevOS Desktop.
///
/// Modela qual binário/perfil de aplicação está em execução.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ApplicationEdition {
    Node,
    Cockpit,
}

impl ApplicationEdition {
    /// Resolve a edição executável estrita a partir do bundle identifier do Tauri.
    ///
    /// Rejeita identificadores desconhecidos ou não homologados para garantir fail-closed.
    pub fn try_from_bundle_identifier(identifier: &str) -> Result<Self, DocumentError> {
        match identifier.trim() {
            COCKPIT_APP_IDENTIFIER => Ok(Self::Cockpit),
            NODE_APP_IDENTIFIER => Ok(Self::Node),
            other => Err(DocumentError::UnauthorizedScope(format!(
                "Identificador de aplicação não homologado: '{}'. Operações documentais bloqueadas por segurança.",
                truncate_val_for_err(other, 32)
            ))),
        }
    }

    /// Retorna a visibilidade documental correspondente à edição da aplicação.
    pub fn as_visibility(&self) -> DocumentVisibility {
        match self {
            Self::Cockpit => DocumentVisibility::CockpitOnly,
            Self::Node => DocumentVisibility::NodeOnly,
        }
    }

    /// Converte um escopo de documento configurado em uma edição executável real.
    ///
    /// `Universal` e `Uninitialized` não são edições reais e retornam erro de escopo não autorizado.
    pub fn try_from_scope(scope: DocumentScope) -> Result<Self, DocumentError> {
        match scope {
            DocumentVisibility::CockpitOnly => Ok(Self::Cockpit),
            DocumentVisibility::NodeOnly => Ok(Self::Node),
            _ => Err(DocumentError::UnauthorizedScope(format!(
                "O escopo documental {scope:?} não corresponde a uma edição executável autorizada."
            ))),
        }
    }
}

/// Disponibilidade e requisito de visibilidade de um documento no catálogo institucional.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DocumentVisibility {
    CockpitOnly,
    NodeOnly,
    Universal,
    Uninitialized,
}

impl DocumentVisibility {
    /// Verifica se esta visibilidade documental é autorizada para uma determinada edição da aplicação.
    pub fn is_allowed_for(&self, edition: ApplicationEdition) -> bool {
        match (self, edition) {
            (DocumentVisibility::Uninitialized, _) => false,
            (DocumentVisibility::Universal, _) => true,
            (DocumentVisibility::CockpitOnly, ApplicationEdition::Cockpit) => true,
            (DocumentVisibility::NodeOnly, ApplicationEdition::Node) => true,
            _ => false,
        }
    }

    /// Resolve o perfil de visibilidade a partir do bundle identifier do Tauri em fail-closed.
    pub fn try_from_app_identifier(identifier: &str) -> Result<Self, DocumentError> {
        match identifier.trim() {
            COCKPIT_APP_IDENTIFIER => Ok(Self::CockpitOnly),
            NODE_APP_IDENTIFIER => Ok(Self::NodeOnly),
            other => Err(DocumentError::UnauthorizedScope(format!(
                "Identificador de aplicação não homologado: '{}'.",
                truncate_val_for_err(other, 32)
            ))),
        }
    }
}

/// Alias para manter compatibilidade transitiva de código existente.
pub type DocumentScope = DocumentVisibility;

/// Metadados de rastreabilidade gerados para cada emissão.
///
/// `sha256_checksum` deve conter SHA-256 dos bytes exatos do PDF.
/// `byte_size` representa o tamanho desses bytes.
/// `generated_at_utc` deve representar um instante em UTC.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DocumentMetadata {
    pub document_kind: DocumentKind,
    pub generated_at_utc: String,
    pub sha256_checksum: String,
    pub byte_size: usize,
    pub template_id: String,
}

impl DocumentMetadata {
    /// Valida as invariantes estruturais e formato temporal ISO 8601 / RFC 3339 dos metadados.
    pub fn validate(&self) -> Result<(), DocumentError> {
        if self.generated_at_utc.trim().is_empty() {
            return Err(DocumentError::ValidationError(
                "O timestamp generated_at_utc não pode ser vazio.".to_string(),
            ));
        }
        chrono::DateTime::parse_from_rfc3339(self.generated_at_utc.trim()).map_err(|_| {
            DocumentError::ValidationError(format!(
                "Timestamp generated_at_utc ('{}') não está no formato ISO 8601 / RFC 3339 válido.",
                truncate_val_for_err(&self.generated_at_utc, 32)
            ))
        })?;
        if self.sha256_checksum.len() != 64
            || !self.sha256_checksum.chars().all(|c| matches!(c, '0'..='9' | 'a'..='f'))
        {
            return Err(DocumentError::ValidationError(
                "O checksum sha256 deve ser uma string hexadecimal de exatamente 64 caracteres em minúsculas."
                    .to_string(),
            ));
        }
        if self.template_id.trim().is_empty() {
            return Err(DocumentError::ValidationError(
                "O template_id não pode ser vazio.".to_string(),
            ));
        }
        Ok(())
    }
}

/// Saída padronizada da geração documental (tipo interno do serviço e store, não exposto em IPC).
///
/// `pdf_bytes` contém os bytes do documento gerado encapsulados em `Arc<[u8]>`,
/// permitindo compartilhamento com zero cópia entre o pipeline de geração,
/// o visualizador interno e o store de exportação temporário.
#[derive(Clone, PartialEq, Eq)]
pub struct DocumentOutput {
    pub pdf_bytes: Arc<[u8]>,
    pub metadata: DocumentMetadata,
}

impl std::fmt::Debug for DocumentOutput {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("DocumentOutput")
            .field("pdf_bytes_len", &self.pdf_bytes.len())
            .field("sha256_checksum", &self.metadata.sha256_checksum)
            .field("metadata", &self.metadata)
            .finish()
    }
}

/// Dados de entrada canônicos para a geração do Extrato do Cidadão.
#[derive(Serialize, Deserialize, Clone, PartialEq)]
pub struct CitizenLedgerPayload {
    pub associate_id: Option<String>,
    pub data: serde_json::Value,
}

impl std::fmt::Debug for CitizenLedgerPayload {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let keys_count = match &self.data {
            serde_json::Value::Object(map) => Some(map.len()),
            _ => None,
        };
        f.debug_struct("CitizenLedgerPayload")
            .field("associate_id", &self.associate_id.as_ref().map(|_| "***"))
            .field("data_keys_count", &keys_count)
            .finish()
    }
}

#[inline]
fn scale_exceeds(d: &Decimal, max: u32) -> bool {
    d.normalize().scale() > max
}

/// Item individual de uma fatura associativa com precisão monetária decimal.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct InvoiceReportItem {
    pub id: String,
    pub description: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub service: Option<String>,
    #[serde(with = "lenient_decimal")]
    pub quantity: Decimal,
    #[serde(with = "lenient_decimal")]
    pub price: Decimal,
    #[serde(with = "lenient_decimal")]
    pub total: Decimal,
}

impl InvoiceReportItem {
    /// Valida as invariantes estruturais e numéricas do item da fatura com aritmética decimal exata.
    pub fn validate(&self, item_index: usize) -> Result<(), DocumentError> {
        let num = item_index + 1;
        if self.id.trim().is_empty() {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui identificador (id) vazio.",
                num
            )));
        }
        if self.id.chars().count() > 64 {
            return Err(DocumentError::ValidationError(format!(
                "O identificador do item {} (id) excede o limite de 64 caracteres.",
                num
            )));
        }
        if self.description.trim().is_empty() {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui descrição (description) vazia.",
                num
            )));
        }
        if self.description.chars().count() > 300 {
            return Err(DocumentError::ValidationError(format!(
                "A descrição do item {} (description) excede o limite de 300 caracteres.",
                num
            )));
        }
        if let Some(ref service) = self.service
            && service.chars().count() > 100
        {
            return Err(DocumentError::ValidationError(format!(
                "O serviço do item {} (service) excede o limite de 100 caracteres.",
                num
            )));
        }
        if self.quantity <= Decimal::ZERO {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui quantidade inválida (deve ser maior que zero).",
                num
            )));
        }
        if scale_exceeds(&self.quantity, 4) {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui quantidade com mais de 4 casas decimais.",
                num
            )));
        }
        if self.price < Decimal::ZERO {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui preço unitário inválido (não pode ser negativo).",
                num
            )));
        }
        if scale_exceeds(&self.price, 2) {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui preço unitário com mais de 2 casas decimais.",
                num
            )));
        }
        if self.total < Decimal::ZERO {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui valor total inválido (não pode ser negativo).",
                num
            )));
        }
        if scale_exceeds(&self.total, 2) {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui total com mais de 2 casas decimais.",
                num
            )));
        }
        let expected_total = match self.quantity.checked_mul(self.price) {
            Some(res) => {
                res.round_dp_with_strategy(2, RoundingStrategy::MidpointAwayFromZero)
            }
            None => {
                return Err(DocumentError::ValidationError(format!(
                    "O item {} da fatura causou overflow aritmético no cálculo de quantidade × preço.",
                    num
                )));
            }
        };
        if self.total != expected_total {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui total ({}) divergente de quantidade × preço unitário ({}).",
                num, self.total, expected_total
            )));
        }
        Ok(())
    }
}

fn truncate_val_for_err(val: &str, max_len: usize) -> String {
    if val.chars().count() <= max_len {
        val.to_string()
    } else {
        let prefix: String = val.chars().take(max_len).collect();
        format!("{prefix}...")
    }
}

/// Módulos auxiliares de serialização flexível para garantir compatibilidade com números e strings do TypeScript.
pub mod lenient_decimal {
    use super::truncate_val_for_err;
    use rust_decimal::Decimal;
    use serde::{self, Deserializer, Serializer};
    use std::str::FromStr;

    pub fn serialize<S>(value: &Decimal, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        rust_decimal::serde::str::serialize(value, serializer)
    }

    pub struct DecimalVisitor;

    impl<'de> serde::de::Visitor<'de> for DecimalVisitor {
        type Value = Decimal;

        fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
            formatter.write_str("um número decimal ou representação textual de número decimal")
        }

        fn visit_i64<E>(self, v: i64) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            Ok(Decimal::from(v))
        }

        fn visit_u64<E>(self, v: u64) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            Ok(Decimal::from(v))
        }

        fn visit_f64<E>(self, v: f64) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            if v.is_nan() || v.is_infinite() {
                return Err(E::custom("valor decimal inválido: NaN ou infinito"));
            }
            Decimal::try_from(v)
                .or_else(|_| Decimal::from_str(&v.to_string()))
                .or_else(|_| Decimal::from_scientific(&v.to_string()))
                .map_err(|_| E::custom(format!("valor decimal inválido: '{v}'")))
        }

        fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            let trimmed = v.trim();
            if trimmed.is_empty() {
                return Err(E::custom(format!(
                    "valor decimal inválido: string vazia ou em branco '{}'",
                    truncate_val_for_err(v, 32)
                )));
            }
            if v.contains(',') {
                return Err(E::custom(
                    "valor decimal inválido: use ponto como separador decimal",
                ));
            }
            Decimal::from_str(trimmed)
                .or_else(|_| Decimal::from_scientific(trimmed))
                .map_err(|_| {
                    E::custom(format!(
                        "valor decimal inválido: '{}'",
                        truncate_val_for_err(v, 32)
                    ))
                })
        }
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Decimal, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_any(DecimalVisitor)
    }
}

pub mod lenient_decimal_option {
    use super::lenient_decimal::DecimalVisitor;
    use rust_decimal::Decimal;
    use serde::{self, Deserializer, Serializer};

    pub fn serialize<S>(value: &Option<Decimal>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        rust_decimal::serde::str_option::serialize(value, serializer)
    }

    pub struct OptionDecimalVisitor;

    impl<'de> serde::de::Visitor<'de> for OptionDecimalVisitor {
        type Value = Option<Decimal>;

        fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
            formatter.write_str("um número decimal, string de número decimal ou nulo")
        }

        fn visit_none<E>(self) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            Ok(None)
        }

        fn visit_unit<E>(self) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            Ok(None)
        }

        fn visit_some<D>(self, deserializer: D) -> Result<Self::Value, D::Error>
        where
            D: Deserializer<'de>,
        {
            deserializer.deserialize_any(DecimalVisitor).map(Some)
        }

        fn visit_i64<E>(self, v: i64) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            DecimalVisitor.visit_i64(v).map(Some)
        }

        fn visit_u64<E>(self, v: u64) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            DecimalVisitor.visit_u64(v).map(Some)
        }

        fn visit_f64<E>(self, v: f64) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            DecimalVisitor.visit_f64(v).map(Some)
        }

        fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            DecimalVisitor.visit_str(v).map(Some)
        }
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Option<Decimal>, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_any(OptionDecimalVisitor)
    }
}

/// Dados de entrada canônicos para a geração de uma fatura associativa com precisão decimal.
#[derive(Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct InvoiceReportPayload {
    pub id: String,
    pub member_name: String,
    pub member_doc: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub member_email: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub member_address: Option<String>,
    pub description: String,
    pub reference_month: String,
    #[serde(with = "lenient_decimal")]
    pub amount: Decimal,
    pub due_date: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub settled_date: Option<String>,
    pub payment_method: String,
    pub status: InvoiceStatus,
    pub items: Vec<InvoiceReportItem>,
    #[serde(default, with = "lenient_decimal_option")]
    pub taxes: Option<Decimal>,
    #[serde(default, with = "lenient_decimal_option")]
    pub discount: Option<Decimal>,
    /// Identificador do protocolo transacional legado D1 (mantido opcional para retrocompatibilidade contratual).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub d1_protocol: Option<String>,
}

impl std::fmt::Debug for InvoiceReportPayload {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("InvoiceReportPayload")
            .field("id", &self.id)
            .field("member_name", &"***")
            .field("member_doc", &"***")
            .field("member_email", &self.member_email.as_ref().map(|_| "***"))
            .field("member_address", &self.member_address.as_ref().map(|_| "***"))
            .field("description", &self.description)
            .field("reference_month", &self.reference_month)
            .field("amount", &self.amount)
            .field("due_date", &self.due_date)
            .field("settled_date", &self.settled_date)
            .field("payment_method", &self.payment_method)
            .field("status", &self.status)
            .field("items", &self.items)
            .field("taxes", &self.taxes)
            .field("discount", &self.discount)
            .field("d1_protocol", &self.d1_protocol)
            .finish()
    }
}

impl InvoiceReportPayload {
    /// Calcula o valor líquido final da fatura (`amount + taxes - discount`) com arredondamento em 2 casas decimais.
    ///
    /// Retorna `Err(DocumentError::ValidationError)` se ocorrer overflow aritmético.
    pub fn final_total(&self) -> Result<Decimal, DocumentError> {
        let taxes = self.taxes.unwrap_or(Decimal::ZERO);
        let discount = self.discount.unwrap_or(Decimal::ZERO);
        self.amount
            .checked_add(taxes)
            .and_then(|sum| sum.checked_sub(discount))
            .map(|final_val| {
                final_val.round_dp_with_strategy(2, RoundingStrategy::MidpointAwayFromZero)
            })
            .ok_or_else(|| {
                DocumentError::ValidationError(
                    "Overflow aritmético no cálculo do valor total líquido da fatura (amount + taxes - discount).".to_string(),
                )
            })
    }

    /// Valida as invariantes estruturais e numéricas da fatura antes da emissão com cálculo exato.
    pub fn validate(&self) -> Result<(), DocumentError> {
        if self.id.trim().is_empty() {
            return Err(DocumentError::ValidationError(
                "O identificador da fatura (id) não pode ser vazio.".to_string(),
            ));
        }
        if self.id.chars().count() > 64 {
            return Err(DocumentError::ValidationError(
                "O identificador da fatura (id) excede o limite de 64 caracteres.".to_string(),
            ));
        }
        if self.member_name.trim().is_empty() {
            return Err(DocumentError::ValidationError(
                "O nome do associado (member_name) não pode ser vazio.".to_string(),
            ));
        }
        if self.member_name.chars().count() > 200 {
            return Err(DocumentError::ValidationError(
                "O nome do associado (member_name) excede o limite de 200 caracteres.".to_string(),
            ));
        }
        if self.member_doc.chars().count() > 32 {
            return Err(DocumentError::ValidationError(
                "O documento do associado (member_doc) excede o limite de 32 caracteres.".to_string(),
            ));
        }
        if self.description.chars().count() > 500 {
            return Err(DocumentError::ValidationError(
                "A descrição da fatura (description) excede o limite de 500 caracteres.".to_string(),
            ));
        }
        if let Some(ref address) = self.member_address
            && address.chars().count() > 300
        {
            return Err(DocumentError::ValidationError(
                "O endereço do associado (member_address) excede o limite de 300 caracteres."
                    .to_string(),
            ));
        }
        if let Some(ref email) = self.member_email
            && email.chars().count() > 254
        {
            return Err(DocumentError::ValidationError(
                "O e-mail do associado (member_email) excede o limite de 254 caracteres."
                    .to_string(),
            ));
        }
        if self.amount < Decimal::ZERO {
            return Err(DocumentError::ValidationError(
                "O subtotal da fatura (amount) não pode ser negativo.".to_string(),
            ));
        }
        if scale_exceeds(&self.amount, 2) {
            return Err(DocumentError::ValidationError(
                "O subtotal da fatura (amount) possui mais de 2 casas decimais.".to_string(),
            ));
        }
        if self.items.is_empty() {
            return Err(DocumentError::ValidationError(
                "A fatura deve conter pelo menos um item.".to_string(),
            ));
        }
        if self.items.len() > 500 {
            return Err(DocumentError::ValidationError(
                "A fatura excede o limite máximo permitido de 500 itens.".to_string(),
            ));
        }
        if self.payment_method.trim().is_empty() {
            return Err(DocumentError::ValidationError(
                "A forma de pagamento (payment_method) não pode ser vazia.".to_string(),
            ));
        }
        if self.payment_method.chars().count() > 64 {
            return Err(DocumentError::ValidationError(
                "A forma de pagamento (payment_method) excede o limite de 64 caracteres."
                    .to_string(),
            ));
        }

        // Validação de datas
        NaiveDate::parse_from_str(self.due_date.trim(), "%Y-%m-%d").map_err(|_| {
            DocumentError::ValidationError(format!(
                "Data de vencimento (due_date) inválida: '{}'. Formato esperado: YYYY-MM-DD.",
                truncate_val_for_err(&self.due_date, 32)
            ))
        })?;

        match self.status {
            InvoiceStatus::Paid => {
                let settled = self.settled_date.as_deref().unwrap_or("").trim();
                if settled.is_empty() {
                    return Err(DocumentError::ValidationError(
                        "Data de liquidação (settled_date) é obrigatória quando o status da fatura é 'paid'.".to_string(),
                    ));
                }
                NaiveDate::parse_from_str(settled, "%Y-%m-%d").map_err(|_| {
                    DocumentError::ValidationError(format!(
                        "Data de liquidação (settled_date) inválida: '{}'. Formato esperado: YYYY-MM-DD.",
                        truncate_val_for_err(settled, 32)
                    ))
                })?;
            }
            InvoiceStatus::Pending => {
                if let Some(ref settled) = self.settled_date
                    && !settled.trim().is_empty()
                {
                    return Err(DocumentError::ValidationError(
                        "Data de liquidação (settled_date) não deve ser informada quando o status da fatura é 'pending'.".to_string(),
                    ));
                }
            }
            _ => {
                if let Some(ref settled) = self.settled_date
                    && !settled.trim().is_empty()
                {
                    NaiveDate::parse_from_str(settled.trim(), "%Y-%m-%d").map_err(|_| {
                        DocumentError::ValidationError(format!(
                            "Data de liquidação (settled_date) inválida: '{}'. Formato esperado: YYYY-MM-DD.",
                            truncate_val_for_err(settled.trim(), 32)
                        ))
                    })?;
                }
            }
        }

        let ref_month_trimmed = self.reference_month.trim();
        let is_valid_ref_month = ref_month_trimmed.len() == 7
            && ref_month_trimmed.as_bytes()[4] == b'-'
            && ref_month_trimmed.chars().all(|c| c.is_ascii_digit() || c == '-')
            && NaiveDate::parse_from_str(&format!("{ref_month_trimmed}-01"), "%Y-%m-%d").is_ok();

        if !is_valid_ref_month {
            return Err(DocumentError::ValidationError(format!(
                "Mês de referência (reference_month) inválido: '{}'. Formato esperado: YYYY-MM.",
                truncate_val_for_err(&self.reference_month, 32)
            )));
        }

        let taxes_val = match self.taxes {
            Some(taxes) => {
                if taxes < Decimal::ZERO {
                    return Err(DocumentError::ValidationError(
                        "O valor de tributos (taxes) não pode ser negativo.".to_string(),
                    ));
                }
                if scale_exceeds(&taxes, 2) {
                    return Err(DocumentError::ValidationError(
                        "O valor de tributos (taxes) possui mais de 2 casas decimais.".to_string(),
                    ));
                }
                taxes
            }
            None => Decimal::ZERO,
        };
        let discount_val = match self.discount {
            Some(discount) => {
                if discount < Decimal::ZERO {
                    return Err(DocumentError::ValidationError(
                        "O valor de desconto (discount) não pode ser negativo.".to_string(),
                    ));
                }
                if scale_exceeds(&discount, 2) {
                    return Err(DocumentError::ValidationError(
                        "O valor de desconto (discount) possui mais de 2 casas decimais."
                            .to_string(),
                    ));
                }
                discount
            }
            None => Decimal::ZERO,
        };
        let subtotal_with_taxes = match self.amount.checked_add(taxes_val) {
            Some(sum) => sum,
            None => {
                return Err(DocumentError::ValidationError(
                    "Overflow aritmético ao somar subtotal e tributos da fatura.".to_string(),
                ));
            }
        };
        if discount_val > subtotal_with_taxes {
            return Err(DocumentError::ValidationError(
                "O valor de desconto (discount) não pode exceder o subtotal acrescido de tributos."
                    .to_string(),
            ));
        }

        // Garante que o valor final líquido é computável sem overflow
        self.final_total()?;
        let mut seen_ids = std::collections::HashSet::new();
        for (i, item) in self.items.iter().enumerate() {
            item.validate(i)?;
            let trimmed_id = item.id.trim();
            if !seen_ids.insert(trimmed_id) {
                return Err(DocumentError::ValidationError(format!(
                    "O item {} da fatura possui identificador duplicado: '{}'.",
                    i + 1, item.id
                )));
            }
        }

        let mut items_sum = Decimal::ZERO;
        for item in &self.items {
            items_sum = match items_sum.checked_add(item.total) {
                Some(sum) => sum,
                None => {
                    return Err(DocumentError::ValidationError(
                        "Overflow aritmético ao totalizar itens da fatura.".to_string(),
                    ));
                }
            };
        }
        if items_sum != self.amount {
            return Err(DocumentError::ValidationError(format!(
                "A soma dos itens da fatura ({}) diverge do subtotal informado em amount ({}).",
                items_sum, self.amount
            )));
        }

        Ok(())
    }
}

/// Dados de entrada canônicos para a geração do Relatório Analítico de Reconciliação Imobiliária.
#[derive(Serialize, Deserialize, Clone, PartialEq)]
pub struct RealEstateReconciliationPayload {
    pub data: serde_json::Value,
}

impl std::fmt::Debug for RealEstateReconciliationPayload {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let entries_count = match &self.data {
            serde_json::Value::Object(map) => Some(map.len()),
            serde_json::Value::Array(arr) => Some(arr.len()),
            _ => None,
        };
        f.debug_struct("RealEstateReconciliationPayload")
            .field("data_entries_count", &entries_count)
            .finish()
    }
}

/// Dados de entrada canônicos para a geração do Contrato de Cessão de Posse.
///
/// `document_number` e `auth_code` são identificadores institucionais obrigatórios.
/// Valores padrão provisórios foram eliminados para garantir que documentos oficiais
/// nunca sejam emitidos silenciosamente com números fictícios.
#[derive(Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct CessaoPossePayload {
    /// Número de controle ou registro oficial do documento institucional.
    pub document_number: String,

    /// Código oficial de autenticação e rastreio institucional.
    pub auth_code: String,

    /// Dados estruturados do contrato (partes, imóvel, condições, etc.).
    #[serde(default)]
    pub data: serde_json::Value,
}

impl std::fmt::Debug for CessaoPossePayload {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let keys = match &self.data {
            serde_json::Value::Object(map) => map.keys().cloned().collect::<Vec<_>>(),
            _ => Vec::new(),
        };
        f.debug_struct("CessaoPossePayload")
            .field("document_number", &self.document_number)
            .field("auth_code", &"***")
            .field("data_keys", &keys)
            .finish()
    }
}

struct CountingWriter(usize);

impl std::io::Write for CountingWriter {
    #[inline]
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.0 = self.0.saturating_add(buf.len());
        Ok(buf.len())
    }

    #[inline]
    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}

/// Valida limites de tamanho em bytes, quantidade máxima de itens em arrays e profundidade de aninhamento de payloads JSON.
fn validate_json_limits(val: &serde_json::Value) -> Result<(), DocumentError> {
    fn check_val(v: &serde_json::Value, current_depth: usize) -> Result<(), DocumentError> {
        if current_depth > MAX_JSON_DEPTH {
            return Err(DocumentError::ValidationError(format!(
                "Estrutura do payload JSON excede a profundidade máxima permitida de {MAX_JSON_DEPTH} níveis."
            )));
        }

        match v {
            serde_json::Value::Array(arr) => {
                if arr.len() > MAX_ARRAY_ITEMS {
                    return Err(DocumentError::ValidationError(format!(
                        "Array no payload excede o limite máximo permitido de {MAX_ARRAY_ITEMS} elementos."
                    )));
                }
                for item in arr {
                    check_val(item, current_depth + 1)?;
                }
            }
            serde_json::Value::Object(obj) => {
                for item in obj.values() {
                    check_val(item, current_depth + 1)?;
                }
            }
            _ => {}
        }
        Ok(())
    }

    let mut writer = CountingWriter(0);
    serde_json::to_writer(&mut writer, val)
        .map_err(|e| DocumentError::SerializationError(e.to_string()))?;

    if writer.0 > MAX_PAYLOAD_JSON_BYTES {
        return Err(DocumentError::ValidationError(format!(
            "Payload JSON ({} bytes) excede o limite máximo permitido de {MAX_PAYLOAD_JSON_BYTES} bytes.",
            writer.0
        )));
    }

    check_val(val, 1)
}

impl CessaoPossePayload {
    /// Valida as invariantes estruturais do contrato antes da emissão.
    pub fn validate(&self) -> Result<(), DocumentError> {
        if self.document_number.trim().is_empty() {
            return Err(DocumentError::ValidationError(
                "O número do documento (document_number) não pode ser vazio.".to_string(),
            ));
        }

        if self.auth_code.trim().is_empty() {
            return Err(DocumentError::ValidationError(
                "O código de autenticação (auth_code) não pode ser vazio.".to_string(),
            ));
        }

        match &self.data {
            serde_json::Value::Object(map) if !map.is_empty() => {
                validate_json_limits(&self.data)?;

                let mut missing_keys = Vec::new();
                for &req_key in CESSAO_REQUIRED_KEYS {
                    match map.get(req_key) {
                        Some(serde_json::Value::String(s)) if !s.trim().is_empty() => {}
                        Some(serde_json::Value::Number(_)) => {}
                        _ => {
                            missing_keys.push(req_key);
                        }
                    }
                }
                if !missing_keys.is_empty() {
                    return Err(DocumentError::ValidationError(format!(
                        "Campos obrigatórios ausentes ou vazios no contrato de cessão de posse: {}.",
                        missing_keys.join(", ")
                    )));
                }
                Ok(())
            }
            _ => Err(DocumentError::ValidationError(
                "O campo data do contrato de cessão de posse deve ser um objeto JSON não vazio contendo os dados do contrato.".to_string(),
            )),
        }
    }
}

/// Requisição fortemente tipada para o pipeline de geração.
///
/// A representação serializada contém o discriminador `kind` e o
/// conteúdo correspondente em `payload`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", content = "payload", rename_all = "snake_case")]
#[allow(clippy::large_enum_variant)]
pub enum DocumentRequest {
    CitizenLedger(CitizenLedgerPayload),
    InvoiceBill(InvoiceReportPayload),
    CessaoPosse(CessaoPossePayload),
    RealEstateReconciliation(RealEstateReconciliationPayload),
}

impl DocumentRequest {
    /// Retorna o tipo documental associado à requisição.
    pub fn kind(&self) -> DocumentKind {
        match self {
            DocumentRequest::CitizenLedger(_) => DocumentKind::CitizenLedger,
            DocumentRequest::InvoiceBill(_) => DocumentKind::InvoiceBill,
            DocumentRequest::CessaoPosse(_) => DocumentKind::CessaoPosse,
            DocumentRequest::RealEstateReconciliation(_) => DocumentKind::RealEstateReconciliation,
        }
    }

    /// Executa a validação estrutural do payload específico do modelo documental.
    pub fn validate(&self) -> Result<(), DocumentError> {
        match self {
            DocumentRequest::CessaoPosse(payload) => payload.validate(),
            DocumentRequest::InvoiceBill(payload) => payload.validate(),

            DocumentRequest::CitizenLedger(payload) => {
                if !payload.data.is_object() {
                    return Err(DocumentError::ValidationError(
                        "Os dados do demonstrativo do livro-razão (data) devem ser um objeto JSON."
                            .to_string(),
                    ));
                }

                validate_json_limits(&payload.data)?;

                let associate_id = payload
                    .data
                    .get("associate")
                    .and_then(|a| a.get("id"))
                    .and_then(|id| id.as_str())
                    .unwrap_or("")
                    .trim();

                if associate_id.is_empty() {
                    return Err(DocumentError::ValidationError(
                        "Campo obrigatório ausente ou vazio: 'data.associate.id'.".to_string(),
                    ));
                }

                if let Some(ref direct_id) = payload.associate_id {
                    let direct_trimmed = direct_id.trim();
                    if !direct_trimmed.is_empty() && direct_trimmed != associate_id {
                        return Err(DocumentError::ValidationError(format!(
                            "Inconsistência nos dados do extrato: associate_id ('{direct_trimmed}') diverge de data.associate.id ('{associate_id}')."
                        )));
                    }
                }

                let ref_period = payload
                    .data
                    .get("meta")
                    .and_then(|m| m.get("reference_period"))
                    .and_then(|rp| rp.as_str())
                    .unwrap_or("")
                    .trim();

                if ref_period.is_empty() {
                    return Err(DocumentError::ValidationError(
                        "Campo obrigatório ausente ou vazio: 'data.meta.reference_period'.".to_string(),
                    ));
                }

                Ok(())
            }

            DocumentRequest::RealEstateReconciliation(payload) => {
                if !payload.data.is_object() {
                    return Err(DocumentError::ValidationError(
                        "Os dados da reconciliação imobiliária (data) devem ser um objeto JSON."
                            .to_string(),
                    ));
                }

                validate_json_limits(&payload.data)?;

                let generated_at = payload
                    .data
                    .get("generatedAt")
                    .and_then(|g| g.as_str())
                    .unwrap_or("")
                    .trim();

                if generated_at.is_empty() {
                    return Err(DocumentError::ValidationError(
                        "Campo obrigatório ausente ou vazio: 'data.generatedAt'.".to_string(),
                    ));
                }

                Ok(())
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;
    use serde_json::json;

    #[test]
    fn document_kind_uses_expected_serialization() {
        assert_eq!(
            serde_json::to_string(&DocumentKind::CitizenLedger).unwrap(),
            "\"citizen_ledger\""
        );

        assert_eq!(
            serde_json::to_string(&DocumentKind::InvoiceBill).unwrap(),
            "\"invoice_bill\""
        );
    }

    #[test]
    fn document_visibility_uses_snake_case() {
        assert_eq!(
            serde_json::to_string(&DocumentVisibility::CockpitOnly).unwrap(),
            "\"cockpit_only\""
        );

        assert_eq!(
            serde_json::to_string(&DocumentVisibility::NodeOnly).unwrap(),
            "\"node_only\""
        );

        assert_eq!(
            serde_json::to_string(&DocumentVisibility::Universal).unwrap(),
            "\"universal\""
        );
    }

    #[test]
    fn application_edition_and_visibility_authorization_matrix() {
        assert!(DocumentVisibility::Universal.is_allowed_for(ApplicationEdition::Cockpit));
        assert!(DocumentVisibility::Universal.is_allowed_for(ApplicationEdition::Node));

        assert!(DocumentVisibility::CockpitOnly.is_allowed_for(ApplicationEdition::Cockpit));
        assert!(!DocumentVisibility::CockpitOnly.is_allowed_for(ApplicationEdition::Node));

        assert!(DocumentVisibility::NodeOnly.is_allowed_for(ApplicationEdition::Node));
        assert!(!DocumentVisibility::NodeOnly.is_allowed_for(ApplicationEdition::Cockpit));
    }

    #[test]
    fn application_edition_from_bundle_identifier_principle_of_least_privilege() {
        assert_eq!(
            ApplicationEdition::from_bundle_identifier("br.aspp.devos.cockpit"),
            ApplicationEdition::Cockpit
        );
        assert_eq!(
            ApplicationEdition::from_bundle_identifier("br.aspp.devos.node"),
            ApplicationEdition::Node
        );
        assert_eq!(
            ApplicationEdition::from_bundle_identifier("qualquer.outro.id"),
            ApplicationEdition::Node
        );
    }

    #[test]
    fn document_kinds_keep_expected_visibilities_and_template_ids() {
        assert_eq!(
            DocumentKind::CitizenLedger.required_visibility(),
            DocumentVisibility::Universal
        );

        assert_eq!(
            DocumentKind::InvoiceBill.required_visibility(),
            DocumentVisibility::Universal
        );

        assert_eq!(
            DocumentKind::CessaoPosse.required_visibility(),
            DocumentVisibility::CockpitOnly
        );

        assert_eq!(
            DocumentKind::RealEstateReconciliation.required_visibility(),
            DocumentVisibility::CockpitOnly
        );

        assert_eq!(
            DocumentKind::CitizenLedger.template_id(),
            "extrato_citizen_ledger.typ"
        );

        assert_eq!(DocumentKind::InvoiceBill.template_id(), "invoice_bill.typ");

        assert_eq!(
            DocumentKind::CessaoPosse.template_id(),
            "contrato_cessao_posse.typ"
        );

        assert_eq!(
            DocumentKind::RealEstateReconciliation.template_id(),
            "real_estate_reconciliation.typ"
        );
    }

    #[test]
    fn citizen_ledger_request_preserves_wire_contract() {
        let request = DocumentRequest::CitizenLedger(CitizenLedgerPayload {
            associate_id: None,
            data: json!({}),
        });

        assert_eq!(request.kind(), DocumentKind::CitizenLedger);

        let serialized =
            serde_json::to_value(&request).expect("A requisição deve ser serializável");

        assert_eq!(serialized["kind"], "citizen_ledger");
        assert!(
            serialized.get("payload").is_some(),
            "A representação deve manter o campo payload"
        );
    }

    #[test]
    fn unknown_document_kind_is_rejected_by_deserialization() {
        let value = json!({
            "kind": "unknown_document",
            "payload": {}
        });

        let result = serde_json::from_value::<DocumentRequest>(value);

        assert!(
            result.is_err(),
            "Tipos documentais desconhecidos devem ser rejeitados"
        );
    }

    #[test]
    fn public_error_messages_do_not_expose_internal_details() {
        let internal_detail = "/private/path/template.typ: conteúdo confidencial de entrada";

        let error = DocumentError::CompilationError(internal_detail.to_string());

        let message = error.public_message();

        assert_eq!(message, "Não foi possível gerar o documento.");

        assert!(
            !message.contains(internal_detail),
            "A mensagem pública não deve expor detalhes internos"
        );
    }

    #[test]
    fn test_cessao_posse_payload_requires_official_identifiers_and_validates() {
        // Deserialização rejeita ausência de document_number
        let missing_doc_num = json!({
            "auth_code": "2026-X7Y9",
            "data": { "chave": "valor" }
        });
        assert!(serde_json::from_value::<CessaoPossePayload>(missing_doc_num).is_err());

        // Deserialização rejeita ausência de auth_code
        let missing_auth = json!({
            "document_number": "2026-0001/CP",
            "data": { "chave": "valor" }
        });
        assert!(serde_json::from_value::<CessaoPossePayload>(missing_auth).is_err());

        // Payload válido desserializa e valida com sucesso
        let valid_json = json!({
            "document_number": "2026-0001/CP",
            "auth_code": "2026-X7Y9",
            "data": { "chave": "valor" }
        });
        let valid_payload = serde_json::from_value::<CessaoPossePayload>(valid_json).unwrap();
        assert!(valid_payload.validate().is_ok());

        // Rejeita identificador vazio ou somente espaços
        let mut invalid_number = valid_payload.clone();
        invalid_number.document_number = "   ".to_string();
        assert!(matches!(
            invalid_number.validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut invalid_auth = valid_payload.clone();
        invalid_auth.auth_code = "".to_string();
        assert!(matches!(
            invalid_auth.validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // Rejeita data não objeto
        let mut invalid_data = valid_payload.clone();
        invalid_data.data = json!("não é objeto");
        assert!(matches!(
            invalid_data.validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // Rejeita data objeto vazio {}
        let mut empty_data = valid_payload;
        empty_data.data = json!({});
        assert!(matches!(
            empty_data.validate(),
            Err(DocumentError::ValidationError(_))
        ));
    }

    #[test]
    fn test_invoice_monetary_validation_with_decimal_precision() {
        let base_invoice = InvoiceReportPayload {
            id: "INV-01".to_string(),
            member_name: "Associado".to_string(),
            member_doc: "000".to_string(),
            member_email: None,
            member_address: None,
            description: "Desc".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(100.00),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "paid".to_string(),
            items: vec![InvoiceReportItem {
                id: "it-1".to_string(),
                description: "Item 1".to_string(),
                service: None,
                quantity: dec!(1.0),
                price: dec!(100.00),
                total: dec!(100.00),
            }],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        // 1. Valor positivo válido -> OK
        assert!(DocumentRequest::InvoiceBill(base_invoice.clone())
            .validate()
            .is_ok());

        // 2. Valor zero -> OK (com item gratuito coerente)
        let mut zero_invoice = base_invoice.clone();
        zero_invoice.amount = dec!(0.00);
        zero_invoice.items[0].price = dec!(0.00);
        zero_invoice.items[0].total = dec!(0.00);
        assert!(DocumentRequest::InvoiceBill(zero_invoice)
            .validate()
            .is_ok());

        // 3. Valor negativo -> Err
        let mut negative_invoice = base_invoice.clone();
        negative_invoice.amount = dec!(-10.00);
        assert!(matches!(
            DocumentRequest::InvoiceBill(negative_invoice).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 4. Item com quantidade negativa ou zero -> Err
        let mut invalid_item_qty = base_invoice.clone();
        invalid_item_qty.items[0].quantity = dec!(0.0);
        assert!(matches!(
            DocumentRequest::InvoiceBill(invalid_item_qty).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut neg_item_qty = base_invoice.clone();
        neg_item_qty.items[0].quantity = dec!(-1.5);
        assert!(matches!(
            DocumentRequest::InvoiceBill(neg_item_qty).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 5. Item com preço unitário negativo -> Err
        let mut invalid_item_price = base_invoice.clone();
        invalid_item_price.items[0].price = dec!(-5.00);
        assert!(matches!(
            DocumentRequest::InvoiceBill(invalid_item_price).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 6. Item com total negativo -> Err
        let mut invalid_item_total = base_invoice.clone();
        invalid_item_total.items[0].total = dec!(-1.00);
        assert!(matches!(
            DocumentRequest::InvoiceBill(invalid_item_total).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 7. Tributos opcionais com valor negativo -> Err
        let mut invalid_taxes = base_invoice.clone();
        invalid_taxes.taxes = Some(dec!(-10.00));
        assert!(matches!(
            DocumentRequest::InvoiceBill(invalid_taxes).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut zero_taxes = base_invoice.clone();
        zero_taxes.taxes = Some(dec!(0.00));
        assert!(DocumentRequest::InvoiceBill(zero_taxes).validate().is_ok());

        // 8. Desconto opcional com valor negativo -> Err
        let mut invalid_discount = base_invoice.clone();
        invalid_discount.discount = Some(dec!(-5.00));
        assert!(matches!(
            DocumentRequest::InvoiceBill(invalid_discount).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut zero_discount = base_invoice;
        zero_discount.discount = Some(dec!(0.00));
        assert!(DocumentRequest::InvoiceBill(zero_discount)
            .validate()
            .is_ok());
    }

    #[test]
    fn test_invoice_item_validation_exhaustive() {
        let base_item = InvoiceReportItem {
            id: "item-10".to_string(),
            description: "Serviço de Registro Notarial".to_string(),
            service: Some("Cartório".to_string()),
            quantity: dec!(2.0),
            price: dec!(50.00),
            total: dec!(100.00),
        };

        // 1. Item válido -> Ok
        assert!(base_item.validate(0).is_ok());

        // 2. Identificador vazio -> Err
        let mut empty_id = base_item.clone();
        empty_id.id = "   ".to_string();
        assert!(matches!(
            empty_id.validate(0),
            Err(DocumentError::ValidationError(_))
        ));

        // 3. Descrição vazia -> Err
        let mut empty_desc = base_item.clone();
        empty_desc.description = "".to_string();
        assert!(matches!(
            empty_desc.validate(0),
            Err(DocumentError::ValidationError(_))
        ));

        // 4. Quantidade <= 0 -> Err
        for invalid_qty in [dec!(0.0), dec!(-1.0), dec!(-0.0001)] {
            let mut item = base_item.clone();
            item.quantity = invalid_qty;
            assert!(
                matches!(item.validate(0), Err(DocumentError::ValidationError(_))),
                "Deveria rejeitar quantity: {invalid_qty}"
            );
        }

        // 5. Preço unitário < 0 -> Err
        for invalid_price in [dec!(-1.0), dec!(-0.0001)] {
            let mut item = base_item.clone();
            item.price = invalid_price;
            assert!(
                matches!(item.validate(0), Err(DocumentError::ValidationError(_))),
                "Deveria rejeitar price: {invalid_price}"
            );
        }
        // Preço e total zero -> Ok (itens gratuitos ou cortesias institucionais)
        let mut zero_price = base_item.clone();
        zero_price.price = dec!(0.0);
        zero_price.total = dec!(0.0);
        assert!(zero_price.validate(0).is_ok());

        // 6. Total < 0 -> Err
        for invalid_total in [dec!(-1.0), dec!(-0.0001)] {
            let mut item = base_item.clone();
            item.total = invalid_total;
            assert!(
                matches!(item.validate(0), Err(DocumentError::ValidationError(_))),
                "Deveria rejeitar total: {invalid_total}"
            );
        }
        // Total divergente de quantity * price -> Err
        let mut mismatched_total = base_item;
        mismatched_total.total = dec!(99.00);
        assert!(matches!(
            mismatched_total.validate(0),
            Err(DocumentError::ValidationError(_))
        ));
    }

    #[test]
    fn test_invoice_financial_calculation_and_consistency_validation() {
        let base_invoice = InvoiceReportPayload {
            id: "INV-FIN-01".to_string(),
            member_name: "Associado Financeiro".to_string(),
            member_doc: "123.456.789-00".to_string(),
            member_email: None,
            member_address: None,
            description: "Fatura Mensal".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(100.00),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![
                InvoiceReportItem {
                    id: "it-1".to_string(),
                    description: "Item A".to_string(),
                    service: None,
                    quantity: dec!(1.0),
                    price: dec!(60.00),
                    total: dec!(60.00),
                },
                InvoiceReportItem {
                    id: "it-2".to_string(),
                    description: "Item B".to_string(),
                    service: None,
                    quantity: dec!(2.0),
                    price: dec!(20.00),
                    total: dec!(40.00),
                },
            ],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        // 1. Sem tributos e sem desconto
        assert!(base_invoice.validate().is_ok());
        assert_eq!(base_invoice.final_total(), dec!(100.00));

        // 2. Com tributos
        let mut with_taxes = base_invoice.clone();
        with_taxes.taxes = Some(dec!(15.50));
        assert!(with_taxes.validate().is_ok());
        assert_eq!(with_taxes.final_total(), dec!(115.50));

        // 3. Com desconto
        let mut with_discount = base_invoice.clone();
        with_discount.discount = Some(dec!(20.00));
        assert!(with_discount.validate().is_ok());
        assert_eq!(with_discount.final_total(), dec!(80.00));

        // 4. Com tributos e desconto
        let mut with_taxes_and_discount = base_invoice.clone();
        with_taxes_and_discount.taxes = Some(dec!(15.50));
        with_taxes_and_discount.discount = Some(dec!(20.00));
        assert!(with_taxes_and_discount.validate().is_ok());
        assert_eq!(with_taxes_and_discount.final_total(), dec!(95.50));

        // 5. Desconto excessivo (> amount + taxes) -> ValidationError
        let mut excessive_discount = base_invoice.clone();
        excessive_discount.taxes = Some(dec!(10.00));
        excessive_discount.discount = Some(dec!(115.00));
        assert!(matches!(
            excessive_discount.validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 6. Soma dos itens divergente de amount -> ValidationError (mesmo por 1 centavo!)
        let mut mismatched_subtotal = base_invoice.clone();
        mismatched_subtotal.amount = dec!(100.01);
        assert!(matches!(
            mismatched_subtotal.validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 7. Aritmética decimal exata sem erro IEEE 754 (0.10 + 0.20 = 0.30 exato)
        let exact_decimal_invoice = InvoiceReportPayload {
            id: "INV-EXACT-01".to_string(),
            member_name: "Associado Precisão".to_string(),
            member_doc: "000".to_string(),
            member_email: None,
            member_address: None,
            description: "Precisão Centesimal".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(0.30),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![
                InvoiceReportItem {
                    id: "it-1".to_string(),
                    description: "Parcela 1".to_string(),
                    service: None,
                    quantity: dec!(1.0),
                    price: dec!(0.10),
                    total: dec!(0.10),
                },
                InvoiceReportItem {
                    id: "it-2".to_string(),
                    description: "Parcela 2".to_string(),
                    service: None,
                    quantity: dec!(1.0),
                    price: dec!(0.20),
                    total: dec!(0.20),
                },
            ],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };
        assert!(exact_decimal_invoice.validate().is_ok());
        assert_eq!(exact_decimal_invoice.final_total(), dec!(0.30));
    }

    #[test]
    fn test_ledger_and_reconciliation_validation() {
        let valid_ledger = DocumentRequest::CitizenLedger(CitizenLedgerPayload {
            associate_id: Some("ASSOC-01".to_string()),
            data: json!({ "meta": {} }),
        });
        assert!(valid_ledger.validate().is_ok());

        let invalid_ledger_data = DocumentRequest::CitizenLedger(CitizenLedgerPayload {
            associate_id: None,
            data: json!([1, 2, 3]),
        });
        assert!(matches!(
            invalid_ledger_data.validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let valid_reconciliation =
            DocumentRequest::RealEstateReconciliation(RealEstateReconciliationPayload {
                data: json!({ "lots": [] }),
            });
        assert!(valid_reconciliation.validate().is_ok());

        let invalid_reconciliation_data =
            DocumentRequest::RealEstateReconciliation(RealEstateReconciliationPayload {
                data: json!("não é json object"),
            });
        assert!(matches!(
            invalid_reconciliation_data.validate(),
            Err(DocumentError::ValidationError(_))
        ));
    }

    #[test]
    fn test_lenient_decimal_deserializes_both_numbers_and_strings() {
        let json_from_ts = json!({
            "id": "INV-TS-01",
            "member_name": "TypeScript Frontend",
            "member_doc": "000.000.000-00",
            "description": "Fatura via Frontend",
            "reference_month": "2026-10",
            "amount": 2500, // número inteiro enviado pelo TypeScript
            "due_date": "2026-10-31",
            "payment_method": "Pix",
            "status": "paid",
            "items": [
                {
                    "id": "it-1",
                    "description": "Item 1",
                    "quantity": 1, // número inteiro
                    "price": 2500.50, // número float
                    "total": "2500.50" // ou string numérica
                }
            ],
            "taxes": "0.00",
            "discount": 0
        });

        let parsed: InvoiceReportPayload = serde_json::from_value(json_from_ts)
            .expect("Deve desserializar números e strings flexivelmente sem erro");
        assert_eq!(parsed.amount, dec!(2500));
        assert_eq!(parsed.items[0].price, dec!(2500.50));
        assert_eq!(parsed.items[0].total, dec!(2500.50));
    }

    #[test]
    fn test_invoice_rejects_duplicate_item_ids() {
        let invoice = InvoiceReportPayload {
            id: "INV-DUP-01".to_string(),
            member_name: "Associado".to_string(),
            member_doc: "000".to_string(),
            member_email: None,
            member_address: None,
            description: "Duplicidade".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(200.00),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![
                InvoiceReportItem {
                    id: "item-rep".to_string(),
                    description: "Item 1".to_string(),
                    service: None,
                    quantity: dec!(1.0),
                    price: dec!(100.00),
                    total: dec!(100.00),
                },
                InvoiceReportItem {
                    id: "item-rep".to_string(), // ID repetido!
                    description: "Item 2".to_string(),
                    service: None,
                    quantity: dec!(1.0),
                    price: dec!(100.00),
                    total: dec!(100.00),
                },
            ],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        assert!(matches!(
            invoice.validate(),
            Err(DocumentError::ValidationError(msg)) if msg.contains("identificador duplicado")
        ));
    }

    #[test]
    fn test_cessao_posse_rejects_blank_party_names() {
        let blank_cedente = CessaoPossePayload {
            document_number: "2026-0001/CP".to_string(),
            auth_code: "2026-X7Y9".to_string(),
            data: json!({
                "cedenteNome": "   ", // Espaços em branco
                "cessionarioNome": "MARIA SOUZA TESTE"
            }),
        };
        assert!(matches!(
            blank_cedente.validate(),
            Err(DocumentError::ValidationError(msg)) if msg.contains("cedenteNome")
        ));
    }
}
```

---

<a id="file-preview_store-rs"></a>
## File: `preview_store.rs`
Caminho: `src/modules/documents/preview_store.rs` (1114 linhas)

```rust
use chrono::{Duration as ChronoDuration, Utc};
use sha2::{Digest, Sha256};
use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};
use thiserror::Error;
use uuid::Uuid;

use crate::modules::documents::models::{
    ApplicationEdition, DocumentError, DocumentMetadata, DocumentOutput, DocumentScope,
};
use crate::platform::typst_engine::RenderedPagePreview;

/// Tempo de vida padrão de um preview em memória (30 minutos).
pub const DEFAULT_PREVIEW_TTL_SECS: u64 = 30 * 60;

/// Quantidade máxima padrão de previews retidos simultaneamente em memória.
pub const DEFAULT_MAX_PREVIEW_ENTRIES: usize = 16;

/// Limite máximo padrão de bytes de memória acumulados no store (64 MiB).
pub const DEFAULT_MAX_PREVIEW_TOTAL_BYTES: usize = 64 * 1024 * 1024;

/// Trait abstrata para obtenção de tempo monotônico injetável,
/// permitindo testes unitários e de integração determinísticos sem dependência de `thread::sleep`.
pub trait MonotonicClock: Send + Sync {
    fn now(&self) -> Instant;
}

/// Implementação padrão de relógio monotônico ancorada no relógio do sistema operacional.
#[derive(Clone, Copy, Debug, Default)]
pub struct SystemMonotonicClock;

impl MonotonicClock for SystemMonotonicClock {
    fn now(&self) -> Instant {
        Instant::now()
    }
}

/// Relógio monotônico mockável para manipulação determinística de tempo em testes de TTL e expiração.
#[cfg(test)]
#[derive(Clone, Debug)]
pub struct MockMonotonicClock {
    current: Arc<Mutex<Instant>>,
}

#[cfg(test)]
impl MockMonotonicClock {
    pub fn new(start: Instant) -> Self {
        Self {
            current: Arc::new(Mutex::new(start)),
        }
    }

    pub fn advance(&self, duration: Duration) {
        let mut guard = self.current.lock().unwrap();
        *guard += duration;
    }

    pub fn set(&self, instant: Instant) {
        let mut guard = self.current.lock().unwrap();
        *guard = instant;
    }
}

#[cfg(test)]
impl MonotonicClock for MockMonotonicClock {
    fn now(&self) -> Instant {
        *self.current.lock().unwrap()
    }
}

#[derive(Error, Debug, Clone, PartialEq, Eq)]
pub enum PreviewStoreError {
    #[error("O preview solicitado não foi encontrado na sessão ativa.")]
    NotFound,

    #[error("A sessão de visualização do documento expirou. Gere a visualização novamente.")]
    Expired,

    #[error(
        "O hash SHA-256 informado não corresponde ao documento visualizado. Exportação bloqueada por segurança."
    )]
    ChecksumMismatch,

    #[error("Esta edição do aplicativo não está autorizada a exportar este documento.")]
    UnauthorizedScope,

    #[error("O documento gerado excede o limite de memória permitido para visualização.")]
    PayloadTooLarge,

    #[error("A capacidade máxima do repositório foi atingida e todos os itens estão em exportação ativa.")]
    CapacityExceeded,

    #[error("O bilhete de reserva de exportação é inválido ou já foi finalizado.")]
    InvalidReservation,

    #[error("O buffer binário do documento não é um PDF válido.")]
    InvalidPdfBuffer,

    #[error("Inconsistência nos metadados do documento gerado.")]
    MetadataMismatch,

    #[error("Falha na validação estrutural do documento: {0}")]
    StructuralValidationError(String),
}

impl PreviewStoreError {
    pub fn public_message(&self) -> String {
        match self {
            Self::StructuralValidationError(_) => {
                "O documento gerado contém inconsistências estruturais e não pôde ser verificado.".to_string()
            }
            Self::MetadataMismatch => {
                "Os metadados do documento gerado são inconsistentes. Gere a visualização novamente.".to_string()
            }
            _ => self.to_string(),
        }
    }
}

/// Bilhete transacional de reserva de preview para exportação segura em disco com garantia RAII.
///
/// Garante que enquanto um documento estiver sendo gravado e verificado,
/// ele não seja expurgado da memória por expiração ou concorrência.
/// Caso o bilhete seja descartado (drop) sem confirmação nem aborto explícito,
/// ele é abortado automaticamente desfazendo o incremento de exportações ativas.
pub struct ExportReservation {
    preview_id: String,
    pdf_bytes: Arc<[u8]>,
    metadata: DocumentMetadata,
    edition_scope: DocumentScope,
    reservation_token: Uuid,
    state: Arc<Mutex<PreviewStoreState>>,
    finished: std::sync::atomic::AtomicBool,
}

impl std::fmt::Debug for ExportReservation {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ExportReservation")
            .field("preview_id", &self.preview_id)
            .field("pdf_bytes_len", &self.pdf_bytes.len())
            .field("sha256_checksum", &self.metadata.sha256_checksum)
            .field("edition_scope", &self.edition_scope)
            .field("reservation_token", &self.reservation_token)
            .field("finished", &self.finished.load(std::sync::atomic::Ordering::Relaxed))
            .finish()
    }
}

impl ExportReservation {
    pub fn preview_id(&self) -> &str {
        &self.preview_id
    }

    pub fn pdf_bytes(&self) -> &Arc<[u8]> {
        &self.pdf_bytes
    }

    pub fn metadata(&self) -> &DocumentMetadata {
        &self.metadata
    }

    pub fn edition_scope(&self) -> DocumentScope {
        self.edition_scope
    }

    pub fn reservation_token(&self) -> Uuid {
        self.reservation_token
    }

    /// Confirma a exportação física do documento em disco.
    ///
    /// Consome o bilhete de reserva, remove o token do store mapeado,
    /// decrementa o contador de exportações ativas em andamento e incrementa
    /// o total histórico de exportações bem-sucedidas.
    pub fn confirm(self) -> Result<(), PreviewStoreError> {
        let mut guard = self
            .state
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        let mapped_preview_id = guard
            .active_reservations
            .remove(&self.reservation_token)
            .ok_or(PreviewStoreError::InvalidReservation)?;

        // Marca como finalizado para que o Drop não tente abortar novamente
        self.finished
            .store(true, std::sync::atomic::Ordering::SeqCst);

        if let Some(entry) = guard
            .entries
            .iter_mut()
            .find(|item| item.preview_id == mapped_preview_id)
        {
            entry.in_flight_exports = entry.in_flight_exports.saturating_sub(1);
            entry.export_count = entry.export_count.saturating_add(1);
        }

        Ok(())
    }

    /// Cancela a reserva de exportação manualmente (ex.: falha de gravação ou hash divergente).
    ///
    /// Consome o bilhete de reserva, remove o token e decrementa o contador
    /// de exportações ativas em andamento.
    pub fn abort(self) {
        let mut guard = self
            .state
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        if let Some(mapped_preview_id) = guard
            .active_reservations
            .remove(&self.reservation_token)
            && let Some(entry) = guard
                .entries
                .iter_mut()
                .find(|item| item.preview_id == mapped_preview_id)
        {
            self.finished
                .store(true, std::sync::atomic::Ordering::SeqCst);

            entry.in_flight_exports = entry.in_flight_exports.saturating_sub(1);
        }
    }
}

impl Drop for ExportReservation {
    fn drop(&mut self) {
        if !self.finished.swap(true, std::sync::atomic::Ordering::SeqCst) {
            let mut guard = self
                .state
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());

            if let Some(mapped_preview_id) = guard
                .active_reservations
                .remove(&self.reservation_token)
                && let Some(entry) = guard
                    .entries
                    .iter_mut()
                    .find(|item| item.preview_id == mapped_preview_id)
            {
                entry.in_flight_exports = entry.in_flight_exports.saturating_sub(1);
            }
        }
    }
}

/// Registro imutável de um documento compilado e retido temporariamente em memória
/// para visualização e posterior exportação verificada.
#[derive(Clone, PartialEq, Eq)]
pub struct StoredDocumentPreview {
    pub preview_id: String,
    pub pdf_bytes: Arc<[u8]>,
    pub pages: Arc<[RenderedPagePreview]>,
    pub metadata: DocumentMetadata,
    pub sha256_checksum: String,
    pub created_at_utc: String,
    pub expires_at_utc: String,
    pub edition_scope: DocumentScope,
    pub export_count: usize,
    pub in_flight_exports: usize,
    created_instant: Instant,
    ttl: Duration,
}

impl std::fmt::Debug for StoredDocumentPreview {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("StoredDocumentPreview")
            .field("preview_id", &self.preview_id)
            .field("pdf_bytes_len", &self.pdf_bytes.len())
            .field("pages_count", &self.pages.len())
            .field("metadata", &self.metadata)
            .field("sha256_checksum", &self.sha256_checksum)
            .field("created_at_utc", &self.created_at_utc)
            .field("expires_at_utc", &self.expires_at_utc)
            .field("edition_scope", &self.edition_scope)
            .field("export_count", &self.export_count)
            .field("in_flight_exports", &self.in_flight_exports)
            .finish()
    }
}

impl StoredDocumentPreview {
    pub fn is_expired_at(&self, now: Instant) -> bool {
        now.checked_duration_since(self.created_instant)
            .unwrap_or(Duration::ZERO)
            >= self.ttl
    }

    /// Calcula os bytes totais estimados retidos em memória (PDF + strings SVG das páginas).
    pub fn estimated_retained_bytes(&self) -> usize {
        let pdf_len = self.pdf_bytes.len();
        let svg_len: usize = self.pages.iter().map(|p| p.svg_base64.len()).sum();
        pdf_len + svg_len + std::mem::size_of::<Self>()
    }
}

#[derive(Debug, Default)]
struct PreviewStoreState {
    entries: VecDeque<StoredDocumentPreview>,
    active_reservations: HashMap<Uuid, String>,
    total_retained_bytes: usize,
}

/// Store concorrente estritamente em memória para sessões de preview documental.
///
/// Garante que o PDF visualizado na interface e o PDF exportado ao disco sejam
/// exatamente o mesmo artefato binário, verificado por SHA-256 e isolado por escopo.
#[derive(Clone)]
pub struct DocumentPreviewStore {
    inner: Arc<Mutex<PreviewStoreState>>,
    clock: Arc<dyn MonotonicClock>,
    ttl: Duration,
    max_entries: usize,
    max_total_bytes: usize,
}

impl Default for DocumentPreviewStore {
    fn default() -> Self {
        Self::new()
    }
}

impl DocumentPreviewStore {
    pub fn new() -> Self {
        Self::with_limits(
            Duration::from_secs(DEFAULT_PREVIEW_TTL_SECS),
            DEFAULT_MAX_PREVIEW_ENTRIES,
            DEFAULT_MAX_PREVIEW_TOTAL_BYTES,
        )
    }

    pub fn with_limits(ttl: Duration, max_entries: usize, max_total_bytes: usize) -> Self {
        Self::with_clock_and_limits(
            Arc::new(SystemMonotonicClock),
            ttl,
            max_entries,
            max_total_bytes,
        )
    }

    pub fn with_clock_and_limits(
        clock: Arc<dyn MonotonicClock>,
        ttl: Duration,
        max_entries: usize,
        max_total_bytes: usize,
    ) -> Self {
        Self {
            inner: Arc::new(Mutex::new(PreviewStoreState::default())),
            clock,
            ttl,
            max_entries: max_entries.max(1),
            max_total_bytes: max_total_bytes.max(1024),
        }
    }

    /// Armazena um `DocumentOutput` recém-compilado em memória e retorna o registro de preview.
    pub fn store_preview<P: Into<Arc<[RenderedPagePreview]>>>(
        &self,
        output: DocumentOutput,
        pages: P,
        edition_scope: DocumentScope,
    ) -> Result<StoredDocumentPreview, PreviewStoreError> {
        let edition = ApplicationEdition::try_from_scope(edition_scope)
            .map_err(|_| PreviewStoreError::UnauthorizedScope)?;
        if !output
            .metadata
            .document_kind
            .required_visibility()
            .is_allowed_for(edition)
        {
            return Err(PreviewStoreError::UnauthorizedScope);
        }

        // Validação estrita de consistência dos metadados documentais (incluindo timestamp ISO 8601)
        if output.metadata.byte_size != output.pdf_bytes.len()
            || output.metadata.template_id != output.metadata.document_kind.template_id()
            || output.metadata.validate().is_err()
        {
            return Err(PreviewStoreError::MetadataMismatch);
        }

        if output.pdf_bytes.is_empty() || !output.pdf_bytes.starts_with(b"%PDF-") {
            return Err(PreviewStoreError::InvalidPdfBuffer);
        }

        let pages_arc: Arc<[RenderedPagePreview]> = pages.into();
        let entry_retained_bytes = output.pdf_bytes.len()
            + pages_arc.iter().map(|p| p.svg_base64.len()).sum::<usize>()
            + std::mem::size_of::<StoredDocumentPreview>();
        if entry_retained_bytes > self.max_total_bytes {
            return Err(PreviewStoreError::PayloadTooLarge);
        }

        crate::platform::typst_engine::validate_pdf_structure(&output.pdf_bytes)
            .map_err(|e| PreviewStoreError::StructuralValidationError(e.to_string()))?;

        let computed_sha256 = hex::encode(Sha256::digest(&output.pdf_bytes));
        if computed_sha256 != output.metadata.sha256_checksum.to_ascii_lowercase() {
            return Err(PreviewStoreError::ChecksumMismatch);
        }

        let now_instant = self.clock.now();
        let now_utc = Utc::now();
        let ttl_chrono = ChronoDuration::from_std(self.ttl)
            .unwrap_or_else(|_| ChronoDuration::seconds(DEFAULT_PREVIEW_TTL_SECS as i64));
        let expires_utc = now_utc + ttl_chrono;

        let entry = StoredDocumentPreview {
            preview_id: Uuid::new_v4().to_string(),
            pdf_bytes: output.pdf_bytes,
            pages: pages_arc,
            metadata: output.metadata,
            sha256_checksum: computed_sha256,
            created_at_utc: now_utc.to_rfc3339(),
            expires_at_utc: expires_utc.to_rfc3339(),
            edition_scope,
            export_count: 0,
            in_flight_exports: 0,
            created_instant: now_instant,
            ttl: self.ttl,
        };

        let mut guard = self
            .inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        Self::purge_expired_locked(&mut guard, now_instant);

        while guard.entries.len() >= self.max_entries
            || (guard.total_retained_bytes + entry_retained_bytes > self.max_total_bytes
                && !guard.entries.is_empty())
        {
            let evict_idx = guard
                .entries
                .iter()
                .position(|e| e.in_flight_exports == 0);

            if let Some(idx) = evict_idx {
                if let Some(evicted) = guard.entries.remove(idx) {
                    guard.total_retained_bytes = guard
                        .total_retained_bytes
                        .saturating_sub(evicted.estimated_retained_bytes());
                }
            } else {
                return Err(PreviewStoreError::CapacityExceeded);
            }
        }

        guard.total_retained_bytes += entry_retained_bytes;
        guard.entries.push_back(entry.clone());

        Ok(entry)
    }

    /// Inicia uma transação de exportação reservando o preview e protegendo-o contra expurgo.
    ///
    /// O cálculo criptográfico de SHA-256 é executado estritamente FORA do lock do repositório,
    /// garantindo que buffers binários de até 64 MiB não causem contenção de concorrência.
    pub fn begin_export(
        &self,
        preview_id: &str,
        expected_sha256: &str,
        active_scope: DocumentScope,
    ) -> Result<ExportReservation, PreviewStoreError> {
        let trimmed_id = preview_id.trim();
        if trimmed_id.is_empty() {
            return Err(PreviewStoreError::NotFound);
        }

        let normalized_expected = expected_sha256.trim().to_ascii_lowercase();
        if normalized_expected.len() != 64
            || !normalized_expected.chars().all(|c| c.is_ascii_hexdigit())
        {
            return Err(PreviewStoreError::ChecksumMismatch);
        }

        let now_instant = self.clock.now();
        let token = Uuid::new_v4();

        // 1. Fase sob o lock: validação rápida e reserva do slot
        let (pdf_bytes, metadata, edition_scope, stored_sha256) = {
            let mut guard = self
                .inner
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());

            let pos = Self::locate_valid_entry_locked(&mut guard, trimmed_id, now_instant)?;
            let entry = &mut guard.entries[pos];

            if !is_scope_compatible(
                active_scope,
                entry.edition_scope,
                entry.metadata.document_kind.required_visibility(),
            ) {
                return Err(PreviewStoreError::UnauthorizedScope);
            }

            entry.in_flight_exports = entry.in_flight_exports.saturating_add(1);

            let pdf_bytes = entry.pdf_bytes.clone();
            let metadata = entry.metadata.clone();
            let edition_scope = entry.edition_scope;
            let stored_sha256 = entry.sha256_checksum.clone();

            guard
                .active_reservations
                .insert(token, trimmed_id.to_string());

            (pdf_bytes, metadata, edition_scope, stored_sha256)
        };

        // 2. Fase fora do lock: cálculo intensivo de hashing
        let recomputed_sha256 = hex::encode(Sha256::digest(&pdf_bytes));
        if recomputed_sha256 != stored_sha256
            || recomputed_sha256 != metadata.sha256_checksum.to_ascii_lowercase()
            || recomputed_sha256 != normalized_expected
        {
            // Reabre o lock para desfazer o incremento e remover a reserva
            let mut guard = self
                .inner
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());

            guard.active_reservations.remove(&token);
            if let Some(entry) = guard
                .entries
                .iter_mut()
                .find(|item| item.preview_id == trimmed_id)
            {
                entry.in_flight_exports = entry.in_flight_exports.saturating_sub(1);
            }

            return Err(PreviewStoreError::ChecksumMismatch);
        }

        Ok(ExportReservation {
            preview_id: trimmed_id.to_string(),
            pdf_bytes,
            metadata,
            edition_scope,
            reservation_token: token,
            state: Arc::clone(&self.inner),
            finished: std::sync::atomic::AtomicBool::new(false),
        })
    }

    /// Valida existência, expiração, escopo de edição e integridade SHA-256 antes de
    /// liberar os bytes exatos do preview para exportação em disco, em fluxo unificado sem vazamento de reservas.
    #[cfg(test)]
    pub fn verify_and_get_for_export(
        &self,
        preview_id: &str,
        expected_sha256: &str,
        active_scope: DocumentScope,
    ) -> Result<StoredDocumentPreview, PreviewStoreError> {
        let trimmed_id = preview_id.trim();
        if trimmed_id.is_empty() {
            return Err(PreviewStoreError::NotFound);
        }

        let normalized_expected = expected_sha256.trim().to_ascii_lowercase();
        if normalized_expected.len() != 64
            || !normalized_expected.chars().all(|c| c.is_ascii_hexdigit())
        {
            return Err(PreviewStoreError::ChecksumMismatch);
        }

        let now_instant = self.clock.now();

        let (mut entry_clone, pdf_bytes, stored_sha256, metadata_sha256) = {
            let mut guard = self
                .inner
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());

            let pos = Self::locate_valid_entry_locked(&mut guard, trimmed_id, now_instant)?;
            let entry = &guard.entries[pos];
            if !is_scope_compatible(
                active_scope,
                entry.edition_scope,
                entry.metadata.document_kind.required_visibility(),
            ) {
                return Err(PreviewStoreError::UnauthorizedScope);
            }

            (
                entry.clone(),
                entry.pdf_bytes.clone(),
                entry.sha256_checksum.clone(),
                entry.metadata.sha256_checksum.to_ascii_lowercase(),
            )
        };

        // Validação de hash fora do lock
        let recomputed_sha256 = hex::encode(Sha256::digest(&pdf_bytes));
        if recomputed_sha256 != stored_sha256
            || recomputed_sha256 != metadata_sha256
            || recomputed_sha256 != normalized_expected
        {
            return Err(PreviewStoreError::ChecksumMismatch);
        }

        // Incremento de export_count
        {
            let mut guard = self
                .inner
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());
            if let Some(entry) = guard
                .entries
                .iter_mut()
                .find(|item| item.preview_id == trimmed_id)
            {
                entry.export_count = entry.export_count.saturating_add(1);
                entry_clone.export_count = entry.export_count;
            }
        }

        Ok(entry_clone)
    }

    /// Remove explicitamente um preview do store em memória (se não estiver em exportação ativa).
    pub fn remove(&self, preview_id: &str) -> bool {
        let trimmed_id = preview_id.trim();
        if trimmed_id.is_empty() {
            return false;
        }

        let mut guard = self
            .inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        if let Some(pos) = guard
            .entries
            .iter()
            .position(|entry| entry.preview_id == trimmed_id && entry.in_flight_exports == 0)
            && let Some(removed) = guard.entries.remove(pos)
        {
            guard.total_retained_bytes = guard
                .total_retained_bytes
                .saturating_sub(removed.estimated_retained_bytes());
            return true;
        }
        false
    }

    /// Quantidade atual de previews ativos (após expurgo de expirados).
    pub fn active_count(&self) -> usize {
        let now_instant = self.clock.now();
        let mut guard = self
            .inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        Self::purge_expired_locked(&mut guard, now_instant);
        guard.entries.len()
    }

    /// Total de bytes atualmente retidos (após expurgo de expirados).
    pub fn active_total_bytes(&self) -> usize {
        let now_instant = self.clock.now();
        let mut guard = self
            .inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        Self::purge_expired_locked(&mut guard, now_instant);
        guard.total_retained_bytes
    }

    fn locate_valid_entry_locked(
        state: &mut PreviewStoreState,
        id: &str,
        now: Instant,
    ) -> Result<usize, PreviewStoreError> {
        let maybe_pos = state
            .entries
            .iter()
            .position(|entry| entry.preview_id == id);

        match maybe_pos {
            None => {
                Self::purge_expired_locked(state, now);
                Err(PreviewStoreError::NotFound)
            }
            Some(p) => {
                if state.entries[p].is_expired_at(now) {
                    if state.entries[p].in_flight_exports == 0
                        && let Some(expired_entry) = state.entries.remove(p)
                    {
                        state.total_retained_bytes = state
                            .total_retained_bytes
                            .saturating_sub(expired_entry.estimated_retained_bytes());
                    }
                    Self::purge_expired_locked(state, now);
                    return Err(PreviewStoreError::Expired);
                }

                Self::purge_expired_locked(state, now);

                state
                    .entries
                    .iter()
                    .position(|entry| entry.preview_id == id)
                    .ok_or(PreviewStoreError::NotFound)
            }
        }
    }

    fn purge_expired_locked(state: &mut PreviewStoreState, now: Instant) {
        state.entries.retain(|entry| {
            let keep = !entry.is_expired_at(now) || entry.in_flight_exports > 0;
            if !keep {
                state.total_retained_bytes = state
                    .total_retained_bytes
                    .saturating_sub(entry.estimated_retained_bytes());
            }
            keep
        });
    }
}

fn is_scope_compatible(
    active_scope: DocumentScope,
    stored_edition_scope: DocumentScope,
    required_doc_scope: DocumentScope,
) -> bool {
    if active_scope != stored_edition_scope {
        return false;
    }
    match ApplicationEdition::try_from_scope(active_scope) {
        Ok(edition) => required_doc_scope.is_allowed_for(edition),
        Err(_) => false,
    }
}

impl From<PreviewStoreError> for DocumentError {
    fn from(error: PreviewStoreError) -> Self {
        match error {
            PreviewStoreError::NotFound => DocumentError::PreviewNotFound(error.to_string()),
            PreviewStoreError::Expired => DocumentError::PreviewExpired(error.to_string()),
            PreviewStoreError::UnauthorizedScope => {
                DocumentError::UnauthorizedScope(error.to_string())
            }
            PreviewStoreError::CapacityExceeded | PreviewStoreError::PayloadTooLarge => {
                DocumentError::PreviewCapacity(error.to_string())
            }
            PreviewStoreError::ChecksumMismatch
            | PreviewStoreError::InvalidPdfBuffer
            | PreviewStoreError::MetadataMismatch
            | PreviewStoreError::StructuralValidationError(_) => {
                DocumentError::IntegrityError(error.to_string())
            }
            PreviewStoreError::InvalidReservation => {
                DocumentError::ValidationError(error.to_string())
            }
        }
    }
}

static GLOBAL_PREVIEW_STORE: OnceLock<DocumentPreviewStore> = OnceLock::new();

/// Retorna a instância global compartilhada do `DocumentPreviewStore` em memória.
pub fn global_preview_store() -> &'static DocumentPreviewStore {
    GLOBAL_PREVIEW_STORE.get_or_init(DocumentPreviewStore::new)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::modules::documents::models::DocumentKind;
    use crate::platform::typst_engine::encode_base64;

    fn sample_output(kind: DocumentKind, content_suffix: &str) -> DocumentOutput {
        let bytes = format!("%PDF-1.7\n% mock content payload stream: {content_suffix}\n%%EOF").into_bytes();
        let sha256 = hex::encode(Sha256::digest(&bytes));
        DocumentOutput {
            metadata: DocumentMetadata {
                document_kind: kind,
                generated_at_utc: "2026-11-03T12:00:00Z".to_string(),
                sha256_checksum: sha256,
                byte_size: bytes.len(),
                template_id: kind.template_id().to_string(),
            },
            pdf_bytes: bytes.into(),
        }
    }

    fn sample_pages() -> Vec<RenderedPagePreview> {
        let svg = r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595 842" width="595" height="842"><rect width="100%" height="100%" fill="#ffffff"/></svg>"##;
        vec![RenderedPagePreview {
            page_number: 1,
            width_pt: 595,
            height_pt: 842,
            svg_base64: encode_base64(svg.as_bytes()),
        }]
    }

    #[test]
    fn test_preview_store_saves_and_verifies_identical_bytes_and_sha256() {
        let store = DocumentPreviewStore::new();
        let output = sample_output(DocumentKind::CessaoPosse, "contrato-posse-001");
        let original_bytes = output.pdf_bytes.clone();
        let original_sha = output.metadata.sha256_checksum.clone();

        let stored = store
            .store_preview(output, sample_pages(), DocumentScope::CockpitOnly)
            .expect("Deve armazenar preview em memória");

        assert!(!stored.preview_id.is_empty());
        assert_eq!(stored.sha256_checksum, original_sha);
        assert_eq!(stored.pdf_bytes, original_bytes);

        let verified = store
            .verify_and_get_for_export(
                &stored.preview_id,
                &original_sha,
                DocumentScope::CockpitOnly,
            )
            .expect("Deve verificar e recuperar preview para exportação");

        assert_eq!(verified.pdf_bytes, original_bytes);
        assert_eq!(verified.sha256_checksum, original_sha);
        assert_eq!(verified.export_count, 1);
    }

    #[test]
    fn test_preview_store_rejects_unknown_id_and_mismatched_sha256() {
        let store = DocumentPreviewStore::new();
        let output = sample_output(DocumentKind::InvoiceBill, "fatura-001");
        let sha = output.metadata.sha256_checksum.clone();

        let stored = store
            .store_preview(output, sample_pages(), DocumentScope::NodeOnly)
            .unwrap();

        // ID inexistente
        assert_eq!(
            store.verify_and_get_for_export("id-inexistente", &sha, DocumentScope::NodeOnly),
            Err(PreviewStoreError::NotFound)
        );

        // SHA-256 divergente
        let wrong_sha = "0".repeat(64);
        assert_eq!(
            store.verify_and_get_for_export(
                &stored.preview_id,
                &wrong_sha,
                DocumentScope::NodeOnly
            ),
            Err(PreviewStoreError::ChecksumMismatch)
        );
    }

    #[test]
    fn test_preview_store_enforces_ttl_expiration_deterministically() {
        let clock = Arc::new(MockMonotonicClock::new(Instant::now()));
        let store = DocumentPreviewStore::with_clock_and_limits(
            clock.clone(),
            Duration::from_secs(10),
            8,
            1024 * 1024,
        );
        let output = sample_output(DocumentKind::CitizenLedger, "extrato-ttl");
        let sha = output.metadata.sha256_checksum.clone();

        let stored = store
            .store_preview(output, sample_pages(), DocumentScope::CockpitOnly)
            .unwrap();

        // Avanço determinístico sem thread::sleep
        clock.advance(Duration::from_secs(15));

        assert_eq!(
            store.verify_and_get_for_export(&stored.preview_id, &sha, DocumentScope::CockpitOnly),
            Err(PreviewStoreError::Expired)
        );
        assert_eq!(store.active_count(), 0);
    }

    #[test]
    fn test_preview_store_enforces_scope_isolation_and_evicts_oldest() {
        let store = DocumentPreviewStore::with_limits(Duration::from_secs(60), 2, 1024 * 1024);

        let out1 = sample_output(DocumentKind::CessaoPosse, "doc-1");
        let sha1 = out1.metadata.sha256_checksum.clone();
        let p1 = store
            .store_preview(out1, sample_pages(), DocumentScope::CockpitOnly)
            .unwrap();

        // NodeOnly não pode exportar preview criado em CockpitOnly
        assert_eq!(
            store.verify_and_get_for_export(&p1.preview_id, &sha1, DocumentScope::NodeOnly),
            Err(PreviewStoreError::UnauthorizedScope)
        );

        // Limite de max_entries = 2: inserir mais 2 deve remover p1
        let out2 = sample_output(DocumentKind::InvoiceBill, "doc-2");
        let _p2 = store
            .store_preview(out2, sample_pages(), DocumentScope::CockpitOnly)
            .unwrap();

        let out3 = sample_output(DocumentKind::CitizenLedger, "doc-3");
        let sha3 = out3.metadata.sha256_checksum.clone();
        let p3 = store
            .store_preview(out3, sample_pages(), DocumentScope::CockpitOnly)
            .unwrap();

        assert_eq!(store.active_count(), 2);
        assert_eq!(
            store.verify_and_get_for_export(&p1.preview_id, &sha1, DocumentScope::CockpitOnly),
            Err(PreviewStoreError::NotFound)
        );
        assert!(store
            .verify_and_get_for_export(&p3.preview_id, &sha3, DocumentScope::CockpitOnly)
            .is_ok());
    }

    #[test]
    fn test_preview_store_transactional_export_lifecycle() {
        let store = DocumentPreviewStore::new();
        let output = sample_output(DocumentKind::CitizenLedger, "tx-export-01");
        let sha = output.metadata.sha256_checksum.clone();

        let stored = store
            .store_preview(output, sample_pages(), DocumentScope::NodeOnly)
            .expect("Deve armazenar preview");

        // 1. Iniciar reserva de exportação
        let reservation = store
            .begin_export(&stored.preview_id, &sha, DocumentScope::NodeOnly)
            .expect("Deve iniciar reserva de exportação");

        assert_eq!(reservation.preview_id, stored.preview_id);
        assert_eq!(reservation.pdf_bytes, stored.pdf_bytes);

        // 2. Abortar reserva e verificar contadores
        store.abort_export(&reservation);

        // 3. Iniciar nova reserva e confirmar sucesso
        let new_reservation = store
            .begin_export(&stored.preview_id, &sha, DocumentScope::NodeOnly)
            .expect("Deve iniciar nova reserva");

        store
            .confirm_export_success(&new_reservation)
            .expect("Confirmação deve ter sucesso");

        // Tentativa de reconfirmar o mesmo bilhete deve ser rejeitada
        assert_eq!(
            store.confirm_export_success(&new_reservation),
            Err(PreviewStoreError::InvalidReservation)
        );
    }

    #[test]
    fn test_preview_store_fifo_eviction_protects_in_flight_exports() {
        // Capacidade estrita para apenas 2 itens
        let store = DocumentPreviewStore::with_limits(Duration::from_secs(60), 2, 1024 * 1024);

        let out1 = sample_output(DocumentKind::CitizenLedger, "doc-pinned-1");
        let sha1 = out1.metadata.sha256_checksum.clone();
        let p1 = store
            .store_preview(out1, sample_pages(), DocumentScope::NodeOnly)
            .unwrap();

        // Reservar p1 em exportação ativa (in_flight_exports = 1)
        let res1 = store
            .begin_export(&p1.preview_id, &sha1, DocumentScope::NodeOnly)
            .unwrap();

        let out2 = sample_output(DocumentKind::InvoiceBill, "doc-unpinned-2");
        let sha2 = out2.metadata.sha256_checksum.clone();
        let _p2 = store
            .store_preview(out2, sample_pages(), DocumentScope::NodeOnly)
            .unwrap();

        // Inserir p3: como a capacidade é 2 e p1 está em exportação ativa, p2 deve ser despejado em vez de p1
        let out3 = sample_output(DocumentKind::CitizenLedger, "doc-new-3");
        let sha3 = out3.metadata.sha256_checksum.clone();
        let p3 = store
            .store_preview(out3, sample_pages(), DocumentScope::NodeOnly)
            .unwrap();

        // p1 ainda deve existir (pois estava protegido)
        store.confirm_export_success(&res1).unwrap();
        assert!(store
            .verify_and_get_for_export(&p1.preview_id, &sha1, DocumentScope::NodeOnly)
            .is_ok());

        // p2 foi despejado
        assert_eq!(
            store.verify_and_get_for_export("doc-unpinned-2", &sha2, DocumentScope::NodeOnly),
            Err(PreviewStoreError::NotFound)
        );

        // p3 está ativo
        assert!(store
            .verify_and_get_for_export(&p3.preview_id, &sha3, DocumentScope::NodeOnly)
            .is_ok());
    }

    #[test]
    fn test_preview_store_rejects_corrupted_pdf_structure() {
        let store = DocumentPreviewStore::new();

        // Buffer sem cabeçalho %PDF-
        let bad_header = DocumentOutput {
            metadata: DocumentMetadata {
                document_kind: DocumentKind::InvoiceBill,
                generated_at_utc: "2026-11-03T12:00:00Z".to_string(),
                sha256_checksum: hex::encode(Sha256::digest(b"NOT_A_PDF_STREAM")),
                byte_size: 16,
                template_id: DocumentKind::InvoiceBill.template_id().to_string(),
            },
            pdf_bytes: b"NOT_A_PDF_STREAM".to_vec().into(),
        };

        assert_eq!(
            store.store_preview(bad_header, sample_pages(), DocumentScope::NodeOnly),
            Err(PreviewStoreError::InvalidPdfBuffer)
        );

        // Buffer com cabeçalho mas sem marcador %%EOF
        let truncated_trailer = b"%PDF-1.7\ntruncated-content-stream-without-eof";
        let bad_trailer = DocumentOutput {
            metadata: DocumentMetadata {
                document_kind: DocumentKind::InvoiceBill,
                generated_at_utc: "2026-11-03T12:00:00Z".to_string(),
                sha256_checksum: hex::encode(Sha256::digest(truncated_trailer)),
                byte_size: truncated_trailer.len(),
                template_id: DocumentKind::InvoiceBill.template_id().to_string(),
            },
            pdf_bytes: truncated_trailer.to_vec().into(),
        };

        assert!(matches!(
            store.store_preview(bad_trailer, sample_pages(), DocumentScope::NodeOnly),
            Err(PreviewStoreError::StructuralValidationError(_))
        ));
    }

    #[test]
    fn test_preview_store_rejects_tampered_preview_id_in_reservation() {
        let store = DocumentPreviewStore::new();
        let output = sample_output(DocumentKind::InvoiceBill, "tamper-test");
        let sha = output.metadata.sha256_checksum.clone();

        let stored = store
            .store_preview(output, sample_pages(), DocumentScope::NodeOnly)
            .unwrap();

        let mut reservation = store
            .begin_export(&stored.preview_id, &sha, DocumentScope::NodeOnly)
            .unwrap();

        // Adulterar maliciosamente o preview_id na reserva deve ser rejeitado
        reservation.preview_id = "preview-id-adulterado".to_string();

        assert_eq!(
            store.confirm_export_success(&reservation),
            Err(PreviewStoreError::InvalidReservation)
        );
    }

    #[test]
    fn test_preview_store_protects_in_flight_export_when_ttl_expires() {
        let clock = Arc::new(MockMonotonicClock::new(Instant::now()));
        let store = DocumentPreviewStore::with_clock_and_limits(
            clock.clone(),
            Duration::from_secs(10),
            8,
            1024 * 1024,
        );
        let output = sample_output(DocumentKind::CitizenLedger, "in-flight-ttl-protect");
        let sha = output.metadata.sha256_checksum.clone();

        let stored = store
            .store_preview(output, sample_pages(), DocumentScope::NodeOnly)
            .unwrap();

        // 1. Inicia exportação ativa enquanto dentro do TTL
        let reservation = store
            .begin_export(&stored.preview_id, &sha, DocumentScope::NodeOnly)
            .unwrap();

        // 2. O tempo avança além do TTL (expirado)
        clock.advance(Duration::from_secs(15));

        // 3. Novas requisições de exportação devem ser rejeitadas como Expired
        assert_eq!(
            store.begin_export(&stored.preview_id, &sha, DocumentScope::NodeOnly).map(|_| ()),
            Err(PreviewStoreError::Expired)
        );

        // 4. Mas o documento NÃO pode ser destruído da memória enquanto a exportação anterior estiver ativa
        assert!(store.confirm_export_success(&reservation).is_ok());

        // 5. Após a finalização da exportação ativa, o item agora pode ser expurgado
        assert_eq!(store.active_count(), 0);
    }

    #[test]
    fn test_preview_store_error_public_message_sanitizes_internal_details() {
        let err = PreviewStoreError::StructuralValidationError("/secret/path: PDF stream malformed".to_string());
        let public_msg = err.public_message();
        assert!(!public_msg.contains("/secret/path"));
        assert_eq!(public_msg, "O documento gerado contém inconsistências estruturais e não pôde ser verificado.");
    }
}
```

---

<a id="file-service-rs"></a>
## File: `service.rs`
Caminho: `src/modules/documents/service.rs` (718 linhas)

```rust
use chrono::Utc;
use sha2::{Digest, Sha256};
use std::sync::Arc;

use crate::modules::documents::models::{
    ApplicationEdition, DocumentError, DocumentKind, DocumentMetadata, DocumentOutput,
    DocumentRequest, DocumentScope, DocumentVisibility,
};
use crate::modules::documents::ports::DocumentRenderer;
use crate::modules::documents::preview_store::{DocumentPreviewStore, StoredDocumentPreview};
use crate::platform::typst_engine::RenderedPagePreview;

/// Serviço orquestrador para geração, autorização, validação e integridade de documentos canônicos.
///
/// Atua como camada de coordenação e domínio:
/// 1. Valida a autorização de escopo contra a edição confiável do sistema (`self.validate_scope()`).
/// 2. Valida o payload de entrada contra regras estruturais e de integridade (`request.validate()`).
/// 3. Verifica se o renderizador injetado suporta o tipo documental solicitado (`self.renderer.supports()`).
/// 4. Delega a compilação física ao adaptador de renderização (`self.renderer.render()` ou `render_pdf_only()`).
/// 5. Garante a integridade documental calculando o hash SHA-256 canônico,
///    o tamanho em bytes, o carimbo de data/hora UTC e os metadados de emissão.
#[derive(Clone)]
pub struct DocumentsService {
    renderer: Arc<dyn DocumentRenderer>,
    edition: ApplicationEdition,
}

impl DocumentsService {
    /// Inicializa o serviço com um renderizador e uma edição explícita da aplicação (`ApplicationEdition`).
    pub fn with_edition(renderer: Arc<dyn DocumentRenderer>, edition: ApplicationEdition) -> Self {
        Self { renderer, edition }
    }

    // TODO(dívida): remover junto com documents_service_with_scope
    /// Inicializa o serviço validando se o escopo de sistema corresponde a uma edição autorizada.
    ///
    /// Rejeita `Universal` e `Uninitialized`, pois não representam perfis de execução reais.
    pub fn with_scope(
        renderer: Arc<dyn DocumentRenderer>,
        system_scope: DocumentScope,
    ) -> Result<Self, DocumentError> {
        let edition = ApplicationEdition::try_from_scope(system_scope)?;
        Ok(Self::with_edition(renderer, edition))
    }

    /// Retorna a edição da aplicação configurada no serviço.
    pub fn edition(&self) -> ApplicationEdition {
        self.edition
    }

    // TODO(dívida): remover após migrar document_commands.rs e reports/engine.rs
    /// Retorna o escopo de sistema atualmente configurado no serviço.
    pub fn system_scope(&self) -> DocumentScope {
        let visibility: DocumentVisibility = self.edition.as_visibility();
        visibility
    }

    // TODO(dívida): remover após migrar document_commands.rs e reports/engine.rs
    /// Valida se o escopo exigido é autorizado pelo contexto do sistema delegando à fonte canônica da verdade.
    pub fn validate_scope_for(&self, required: DocumentScope) -> Result<(), DocumentError> {
        if required.is_allowed_for(self.edition) {
            Ok(())
        } else {
            Err(DocumentError::UnauthorizedScope(format!(
                "Emissão não autorizada: o escopo exigido {required:?} é incompatível com a edição ativa {:?}.",
                self.edition
            )))
        }
    }

    /// Verifica se o escopo exigido pelo tipo documental é autorizado pelo contexto do sistema.
    fn validate_scope(&self, kind: DocumentKind) -> Result<(), DocumentError> {
        self.validate_scope_for(kind.required_visibility())
    }

    /// Valida o pipeline comum (autorização de escopo, regras de payload e suporte do renderizador).
    fn validate_pipeline(&self, request: &DocumentRequest) -> Result<(), DocumentError> {
        self.validate_scope(request.kind())?;
        request.validate()?;
        if !self.renderer.supports(request.kind()) {
            return Err(DocumentError::UnsupportedDocumentType(format!(
                "O renderizador documental configurado não oferece suporte ao tipo {:?}",
                request.kind()
            )));
        }
        Ok(())
    }

    /// Valida a integridade do PDF gerado e constrói o `DocumentOutput` canônico com metadados e SHA-256.
    fn build_document_output(
        kind: DocumentKind,
        pdf_bytes: Arc<[u8]>,
    ) -> Result<DocumentOutput, DocumentError> {
        crate::platform::typst_engine::validate_pdf_structure(&pdf_bytes)
            .map_err(|e| DocumentError::CompilationError(e.to_string()))?;

        let checksum = Sha256::digest(&pdf_bytes);
        let sha256_checksum = hex::encode(checksum);
        let byte_size = pdf_bytes.len();
        let generated_at_utc = Utc::now().to_rfc3339();

        let metadata = DocumentMetadata {
            document_kind: kind,
            generated_at_utc,
            sha256_checksum,
            byte_size,
            template_id: kind.template_id().to_string(),
        };

        Ok(DocumentOutput {
            pdf_bytes,
            metadata,
        })
    }

    /// Ponto de entrada padrão para geração, autorização, validação e integridade documental.
    pub fn generate_document(
        &self,
        request: DocumentRequest,
    ) -> Result<DocumentOutput, DocumentError> {
        let kind = request.kind();
        self.validate_pipeline(&request)?;
        let rendered = self.renderer.render_pdf_only(request)?;
        Self::build_document_output(kind, rendered.pdf_bytes)
    }

    /// Gera o documento canônico com validação, autorização de escopo e cálculo de SHA-256,
    /// retornando tanto o `DocumentOutput` quanto as páginas vetoriais para visualização interna.
    pub fn generate_document_with_pages(
        &self,
        request: DocumentRequest,
    ) -> Result<(DocumentOutput, Vec<RenderedPagePreview>), DocumentError> {
        let kind = request.kind();
        self.validate_pipeline(&request)?;
        let rendered = self.renderer.render(request)?;
        let output = Self::build_document_output(kind, rendered.pdf_bytes)?;
        Ok((output, rendered.pages))
    }

    /// Gera o documento com suas páginas vetoriais e o armazena no store em memória utilizando
    /// o escopo confiável do próprio serviço, garantindo que o chamador não possa forjar o escopo.
    pub fn generate_preview(
        &self,
        request: DocumentRequest,
        store: &DocumentPreviewStore,
    ) -> Result<StoredDocumentPreview, DocumentError> {
        let (output, pages) = self.generate_document_with_pages(request)?;
        let stored = store
            .store_preview(output, pages, self.edition.as_visibility())
            .map_err(DocumentError::from)?;
        Ok(stored)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;
    use sha2::{Digest, Sha256};

    use crate::modules::documents::ports::RenderedDocument;
    use crate::modules::documents::typst_renderer::TypstDocumentRenderer;
    use crate::modules::reports::models::{
        CitizenLedgerPayload, InvoiceReportItem, InvoiceReportPayload,
    };

    use serde_json::json;

    fn create_test_service() -> DocumentsService {
        DocumentsService::with_scope(
            std::sync::Arc::new(TypstDocumentRenderer::new()),
            DocumentScope::CockpitOnly,
        )
    }

    fn assert_valid_document_output(output: &DocumentOutput, expected_kind: DocumentKind) {
        assert!(
            !output.pdf_bytes.is_empty(),
            "O PDF gerado não deve estar vazio"
        );

        assert!(
            output.pdf_bytes.starts_with(b"%PDF-"),
            "O PDF deve começar com o cabeçalho %PDF-"
        );

        assert_eq!(
            output.metadata.document_kind, expected_kind,
            "O tipo documental dos metadados está incorreto"
        );

        assert_eq!(
            output.metadata.byte_size,
            output.pdf_bytes.len(),
            "O tamanho registrado deve corresponder aos bytes do PDF"
        );

        let expected_checksum = hex::encode(Sha256::digest(&output.pdf_bytes));

        assert_eq!(
            output.metadata.sha256_checksum, expected_checksum,
            "O hash SHA-256 deve corresponder aos bytes do PDF"
        );

        assert_eq!(
            output.metadata.sha256_checksum.len(),
            64,
            "A representação hexadecimal de SHA-256 deve conter 64 caracteres"
        );

        assert_eq!(
            output.metadata.template_id,
            expected_kind.template_id(),
            "O identificador do template está incorreto"
        );

        assert!(
            !output.metadata.generated_at_utc.is_empty(),
            "A data de geração deve estar preenchida"
        );
    }

    #[test]
    fn test_documents_service_generates_citizen_ledger() {
        let service = create_test_service();

        let payload = CitizenLedgerPayload {
            associate_id: Some("MEMBER-123".to_string()),
            data: json!({
                "meta": {
                    "generated_at": "23/10/2026",
                    "reference_period": "2026-10",
                    "audit_hash": "mock_audit_hash_v2"
                },
                "associate": {
                    "id": "123",
                    "name": "Maria Silva",
                    "cpf": "123.456.789-00",
                    "email": "maria@example.com",
                    "avatar_letter": "M",
                    "address_line1": "Rua das Flores, 100",
                    "address_line2": "Centro, Cidade - UF"
                },
                "summary": {
                    "total_contracted": "10.000,00",
                    "total_paid": "10.000,00",
                    "outstanding_balance": "0,00"
                },
                "transactions": []
            }),
        };

        let request = DocumentRequest::CitizenLedger(payload);

        let output = service
            .generate_document(request)
            .unwrap_or_else(|error| panic!("Falha ao gerar documento de extrato: {error:?}"));

        assert_valid_document_output(&output, DocumentKind::CitizenLedger);
    }

    #[test]
    fn test_documents_service_generates_invoice_bill() {
        let service = create_test_service();

        let payload = InvoiceReportPayload {
            id: "INV-2026-999".to_string(),
            member_name: "João Santos".to_string(),
            member_doc: "CPF ***.***.999-**".to_string(),
            member_email: Some("joao@example.com".to_string()),
            member_address: Some("Rio de Janeiro, RJ".to_string()),
            description: "Mensalidade Associativa".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(1500.0),
            due_date: "2026-10-30".to_string(),
            settled_date: Some("2026-10-23".to_string()),
            payment_method: "Pix / D1".to_string(),
            status: "paid".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Taxa de Manutenção".to_string(),
                service: Some("Operação DevOS".to_string()),
                quantity: dec!(1.0),
                price: dec!(1500.0),
                total: dec!(1500.0),
            }],
            taxes: Some(dec!(0.0)),
            discount: Some(dec!(0.0)),
            d1_protocol: Some("d1_protocol_sample_hash".to_string()),
        };

        let request = DocumentRequest::InvoiceBill(payload);

        let output = service
            .generate_document(request)
            .unwrap_or_else(|error| panic!("Falha ao gerar fatura: {error:?}"));

        assert_valid_document_output(&output, DocumentKind::InvoiceBill);
    }

    #[test]
    fn test_generate_cessao_posse_document() {
        let service = create_test_service();

        let payload = crate::modules::reports::models::CessaoPossePayload {
            document_number: "2026-0001/CP".to_string(),
            auth_code: "2026-X7Y9".to_string(),
            data: serde_json::json!({
                "cedenteNome": "JOÃO SILVA TESTE",
                "cessionarioNome": "MARIA SOUZA TESTE",
                "imovelLote": "12",
                "imovelQuadra": "B"
            }),
        };

        let request = DocumentRequest::CessaoPosse(payload);

        let output = service
            .generate_document(request)
            .unwrap_or_else(|error| panic!("Falha ao gerar contrato de cessão: {error:?}"));

        assert_valid_document_output(&output, DocumentKind::CessaoPosse);
    }

    #[test]
    fn test_generate_real_estate_reconciliation_document() {
        let service = create_test_service();

        let payload = crate::modules::reports::models::RealEstateReconciliationPayload {
            data: serde_json::json!({
                "generatedAt": "31/10/2026 13:00:00",
                "stats": {
                    "totalProperties": 145756,
                    "totalIdentifiers": 145756,
                    "totalAddresses": 142100,
                    "totalBatches": 12,
                    "openFindingsCount": 3,
                    "pendingProposalsCount": 1
                },
                "batches": [
                    {
                        "id": 1,
                        "filename": "lote_marica_2026_01.csv",
                        "status": "CONCLUIDO",
                        "mode": "INCREMENTAL",
                        "importedRecords": 12500,
                        "inconsistencies": 2
                    }
                ],
                "findings": [
                    {
                        "id": 101,
                        "category": "CADASTRO",
                        "severity": "high",
                        "description": "Inconsistência de numeração na Rua 15",
                        "status": "OPEN"
                    }
                ],
                "properties": [
                    {
                        "id": 1,
                        "matricula": "MATR-00123",
                        "contribuinte": "MARIA DA SILVA SANTOS",
                        "bairro": "CENTRO",
                        "rua": "RUA ALVARES DE CASTRO",
                        "numero": "350",
                        "quadra": "12",
                        "lote": "04",
                        "complemento": "SALA 101"
                    }
                ]
            }),
        };

        let request = DocumentRequest::RealEstateReconciliation(payload);

        let output = service
            .generate_document(request)
            .unwrap_or_else(|error| panic!("Falha ao gerar relatório de reconciliação: {error:?}"));

        assert_valid_document_output(&output, DocumentKind::RealEstateReconciliation);
    }

    #[test]
    fn test_documents_service_rejects_invalid_cessao_posse_payload() {
        let service = create_test_service();
        let invalid_payload = crate::modules::documents::models::CessaoPossePayload {
            document_number: "   ".to_string(),
            auth_code: "2026-X7Y9".to_string(),
            data: serde_json::json!({}),
        };
        let request = DocumentRequest::CessaoPosse(invalid_payload);

        let result = service.generate_document(request);
        assert!(matches!(result, Err(DocumentError::ValidationError(_))));
    }

    #[test]
    fn test_documents_service_rejects_invalid_invoice_bill_payload() {
        let service = create_test_service();
        let invalid_payload = InvoiceReportPayload {
            id: "".to_string(),
            member_name: "Cliente".to_string(),
            member_doc: "000".to_string(),
            member_email: None,
            member_address: None,
            description: "Desc".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(100.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "paid".to_string(),
            items: vec![],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };
        let request = DocumentRequest::InvoiceBill(invalid_payload);

        let result = service.generate_document(request);
        assert!(matches!(result, Err(DocumentError::ValidationError(_))));
    }

    struct MockRenderer {
        supported_kinds: Vec<DocumentKind>,
        render_invocations: std::sync::atomic::AtomicUsize,
    }

    impl MockRenderer {
        fn new(supported_kinds: Vec<DocumentKind>) -> Self {
            Self {
                supported_kinds,
                render_invocations: std::sync::atomic::AtomicUsize::new(0),
            }
        }

        fn invocations(&self) -> usize {
            self.render_invocations
                .load(std::sync::atomic::Ordering::SeqCst)
        }
    }

    impl DocumentRenderer for MockRenderer {
        fn supports(&self, kind: DocumentKind) -> bool {
            self.supported_kinds.contains(&kind)
        }

        fn render(&self, _request: DocumentRequest) -> Result<RenderedDocument, DocumentError> {
            self.render_invocations
                .fetch_add(1, std::sync::atomic::Ordering::SeqCst);
            Ok(RenderedDocument::new(
                b"%PDF-1.7 mock output payload buffer\n%%EOF".to_vec(),
            ))
        }
    }

    #[test]
    fn test_documents_service_delegates_to_injected_renderer_and_centralizes_integrity() {
        let mock = std::sync::Arc::new(MockRenderer::new(vec![DocumentKind::InvoiceBill]));
        let service = DocumentsService::with_renderer(mock.clone());

        let payload = InvoiceReportPayload {
            id: "FAT-MOCK-001".to_string(),
            member_name: "Mock Member".to_string(),
            member_doc: "000.000.000-00".to_string(),
            member_email: None,
            member_address: None,
            description: "Mock Description".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(100.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Item 1".to_string(),
                service: None,
                quantity: dec!(1.0),
                price: dec!(100.0),
                total: dec!(100.0),
            }],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        let output = service
            .generate_document(DocumentRequest::InvoiceBill(payload))
            .expect("Mock deve renderizar com sucesso");

        assert_eq!(mock.invocations(), 1);
        let expected_bytes = b"%PDF-1.7 mock output payload buffer\n%%EOF";
        assert_eq!(&*output.pdf_bytes, expected_bytes);
        assert_eq!(output.metadata.document_kind, DocumentKind::InvoiceBill);
        assert_eq!(output.metadata.byte_size, expected_bytes.len());
        let expected_sha = hex::encode(Sha256::digest(expected_bytes));
        assert_eq!(output.metadata.sha256_checksum, expected_sha);
    }

    #[test]
    fn test_documents_service_rejects_unsupported_document_kind_from_renderer() {
        let mock = std::sync::Arc::new(MockRenderer::new(vec![DocumentKind::CessaoPosse]));
        let service = DocumentsService::with_renderer(mock.clone());

        let payload = InvoiceReportPayload {
            id: "FAT-MOCK-002".to_string(),
            member_name: "Mock Member".to_string(),
            member_doc: "000.000.000-00".to_string(),
            member_email: None,
            member_address: None,
            description: "Mock Description".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(100.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Item 1".to_string(),
                service: None,
                quantity: dec!(1.0),
                price: dec!(100.0),
                total: dec!(100.0),
            }],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        let result = service.generate_document(DocumentRequest::InvoiceBill(payload));
        assert!(matches!(
            result,
            Err(DocumentError::UnsupportedDocumentType(_))
        ));
        assert_eq!(mock.invocations(), 0);
    }

    #[test]
    fn test_documents_service_validates_before_delegating_to_renderer() {
        let mock = std::sync::Arc::new(MockRenderer::new(vec![DocumentKind::InvoiceBill]));
        let service = DocumentsService::with_renderer(mock.clone());

        let invalid_payload = InvoiceReportPayload {
            id: "".to_string(),
            member_name: "Mock Member".to_string(),
            member_doc: "000.000.000-00".to_string(),
            member_email: None,
            member_address: None,
            description: "Mock Description".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(100.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        let result = service.generate_document(DocumentRequest::InvoiceBill(invalid_payload));
        assert!(matches!(result, Err(DocumentError::ValidationError(_))));
        assert_eq!(mock.invocations(), 0);
    }

    #[test]
    fn test_documents_service_authorizes_scope_matching() {
        let mock = std::sync::Arc::new(MockRenderer::new(vec![DocumentKind::InvoiceBill]));
        // Serviço configurado com escopo universal explícito
        let service = DocumentsService::with_scope(mock.clone(), DocumentScope::Universal);

        let payload = InvoiceReportPayload {
            id: "FAT-SCOPE-001".to_string(),
            member_name: "Mock Member".to_string(),
            member_doc: "000.000.000-00".to_string(),
            member_email: None,
            member_address: None,
            description: "Mock Description".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(100.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Item 1".to_string(),
                service: None,
                quantity: dec!(1.0),
                price: dec!(100.0),
                total: dec!(100.0),
            }],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        let result = service.generate_document(DocumentRequest::InvoiceBill(payload));
        assert!(result.is_ok());
        assert_eq!(mock.invocations(), 1);
    }

    #[test]
    fn test_documents_service_rejects_unauthorized_scope() {
        let mock = std::sync::Arc::new(MockRenderer::new(vec![DocumentKind::InvoiceBill]));
        // Serviço configurado com escopo restrito a NodeOnly
        let node_service = DocumentsService::with_scope(mock.clone(), DocumentScope::NodeOnly);

        // Tentativa de emissão exigindo CockpitOnly é rejeitada com UnauthorizedScope
        let auth_res = node_service.validate_scope_for(DocumentScope::CockpitOnly);
        assert!(matches!(auth_res, Err(DocumentError::UnauthorizedScope(_))));

        // Serviço Universal também rejeita escopos restritos a Cockpit ou Node
        let universal_service =
            DocumentsService::with_scope(mock.clone(), DocumentScope::Universal);
        assert!(matches!(
            universal_service.validate_scope_for(DocumentScope::CockpitOnly),
            Err(DocumentError::UnauthorizedScope(_))
        ));
        assert!(matches!(
            universal_service.validate_scope_for(DocumentScope::NodeOnly),
            Err(DocumentError::UnauthorizedScope(_))
        ));

        // Renderizador nunca é invocado em caso de violação de autorização
        assert_eq!(mock.invocations(), 0);
    }

    #[test]
    fn test_documents_service_enforces_cockpit_and_node_scopes_for_all_document_kinds() {
        let all_kinds = vec![
            DocumentKind::CitizenLedger,
            DocumentKind::InvoiceBill,
            DocumentKind::CessaoPosse,
            DocumentKind::RealEstateReconciliation,
        ];
        let mock = std::sync::Arc::new(MockRenderer::new(all_kinds));

        let ledger_req = DocumentRequest::CitizenLedger(CitizenLedgerPayload {
            associate_id: Some("ASSOC-01".to_string()),
            data: json!({"meta": {}}),
        });
        let invoice_req = DocumentRequest::InvoiceBill(InvoiceReportPayload {
            id: "FAT-SCOPE-02".to_string(),
            member_name: "Associado Escopo".to_string(),
            member_doc: "111.222.333-44".to_string(),
            member_email: None,
            member_address: None,
            description: "Fatura Escopo".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(100.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![InvoiceReportItem {
                id: "it-1".to_string(),
                description: "Item".to_string(),
                service: None,
                quantity: dec!(1.0),
                price: dec!(100.0),
                total: dec!(100.0),
            }],
            taxes: None,
            discount: None,
            d1_protocol: None,
        });
        let cessao_req =
            DocumentRequest::CessaoPosse(crate::modules::documents::models::CessaoPossePayload {
                document_number: "2026-0001/CP".to_string(),
                auth_code: "2026-X7Y9".to_string(),
                data: json!({"cedenteNome": "Cedente"}),
            });
        let reconciliation_req = DocumentRequest::RealEstateReconciliation(
            crate::modules::documents::models::RealEstateReconciliationPayload {
                data: json!({"stats": {}}),
            },
        );

        // 1. Edição Cockpit (CockpitOnly): aceita Universal e CockpitOnly
        let cockpit_service =
            DocumentsService::with_scope(mock.clone(), DocumentScope::CockpitOnly);
        assert!(cockpit_service
            .generate_document(ledger_req.clone())
            .is_ok());
        assert!(cockpit_service
            .generate_document(invoice_req.clone())
            .is_ok());
        assert!(cockpit_service
            .generate_document(cessao_req.clone())
            .is_ok());
        assert!(cockpit_service
            .generate_document(reconciliation_req.clone())
            .is_ok());
        assert_eq!(mock.invocations(), 4);

        // 2. Edição Node (NodeOnly): aceita Universal (CitizenLedger, InvoiceBill),
        // mas rejeita documentos restritos ao Cockpit (CessaoPosse, RealEstateReconciliation)
        let node_service = DocumentsService::with_scope(mock.clone(), DocumentScope::NodeOnly);
        assert!(node_service.generate_document(ledger_req).is_ok());
        assert!(node_service.generate_document(invoice_req).is_ok());
        assert_eq!(mock.invocations(), 6);

        assert!(matches!(
            node_service.generate_document(cessao_req),
            Err(DocumentError::UnauthorizedScope(_))
        ));
        assert!(matches!(
            node_service.generate_document(reconciliation_req),
            Err(DocumentError::UnauthorizedScope(_))
        ));
        assert_eq!(mock.invocations(), 6);
    }
}
```

---

<a id="file-typst_renderer-rs"></a>
## File: `typst_renderer.rs`
Caminho: `src/modules/documents/typst_renderer.rs` (1237 linhas)

```rust
use std::collections::HashMap;

use rust_decimal::{Decimal, RoundingStrategy};

use crate::modules::documents::models::{DocumentError, DocumentKind, DocumentRequest};
use crate::modules::documents::ports::{DocumentRenderer, RenderedDocument};
use crate::platform::typst_engine::{
    compile_typst_document_to_pdf, compile_typst_document_with_preview, TypstCompileOptions,
};
#[cfg(test)]
use crate::platform::typst_engine::compile_typst_document;

static CITIZEN_TEMPLATE: &str = include_str!("../../../templates/extrato_citizen_ledger.typ");

static INVOICE_TEMPLATE: &str = include_str!("../../../templates/invoice_bill.typ");

static CONTRATO_CESSAO_TEMPLATE: &str =
    include_str!("../../../templates/contrato_cessao_posse.typ");

static RECONCILIATION_TEMPLATE: &str =
    include_str!("../../../templates/real_estate_reconciliation.typ");

static ASPPIBRA_LAYOUT: &str = include_str!("../../../templates/asppibra_layout.typ");
static CORE_BRANDING: &str = include_str!("../../../templates/core/branding.typ");
static CORE_TYPOGRAPHY: &str = include_str!("../../../templates/core/typography.typ");
static CORE_PAGE_ABNT: &str = include_str!("../../../templates/core/page_abnt.typ");
static CORE_HEADER_FOOTER: &str = include_str!("../../../templates/core/header_footer.typ");
static CORE_DATA_TAGS: &str = include_str!("../../../templates/core/data_tags.typ");

pub static CANONICAL_TYPST_STATIC_SOURCES: &[(&str, &str)] = &[
    ("asppibra_layout.typ", ASPPIBRA_LAYOUT),
    ("core/branding.typ", CORE_BRANDING),
    ("core/typography.typ", CORE_TYPOGRAPHY),
    ("core/page_abnt.typ", CORE_PAGE_ABNT),
    ("core/header_footer.typ", CORE_HEADER_FOOTER),
    ("core/data_tags.typ", CORE_DATA_TAGS),
    // Aliases sem prefixo para máxima resiliência de resolução relativa a partir de subdiretórios:
    ("branding.typ", CORE_BRANDING),
    ("typography.typ", CORE_TYPOGRAPHY),
    ("page_abnt.typ", CORE_PAGE_ABNT),
    ("header_footer.typ", CORE_HEADER_FOOTER),
    ("data_tags.typ", CORE_DATA_TAGS),
];

static ROBOTO_REGULAR: &[u8] = include_bytes!("../../../assets/fonts/Roboto-Regular.ttf");

static ROBOTO_BOLD: &[u8] = include_bytes!("../../../assets/fonts/Roboto-Bold.ttf");

static CANONICAL_FONTS: &[&[u8]] = &[ROBOTO_REGULAR, ROBOTO_BOLD];

/// Adaptador de renderização documental baseado no compilador nativo Typst.
///
/// Encapsula o carregamento dos templates `.typ`, fontes institucionais,
/// injeção de parâmetros JSON e invocação do motor de compilação em memória.
///
/// Produz exclusivamente os bytes binários do documento (`RenderedDocument`),
/// sem dependência de regras de integridade ou autorização.
#[derive(Default, Clone, Debug)]
pub struct TypstDocumentRenderer;

impl TypstDocumentRenderer {
    pub fn new() -> Self {
        Self
    }
}

/// Formata um valor `Decimal` no padrão monetário brasileiro (ex.: 1234.56 -> "1.234,56", 10.0 -> "10,00").
pub fn format_decimal_br(val: Decimal) -> String {
    let rounded = val.round_dp_with_strategy(2, RoundingStrategy::MidpointAwayFromZero);
    let is_negative = rounded.is_sign_negative() && !rounded.is_zero();
    let abs_val = rounded.abs();
    let s = format!("{:.2}", abs_val);
    let parts: Vec<&str> = s.split('.').collect();
    let int_part = parts[0];
    let frac_part = if parts.len() > 1 { parts[1] } else { "00" };

    let int_bytes = int_part.as_bytes();
    let len = int_bytes.len();
    let mut formatted_int = String::with_capacity(len + (len / 3));

    for (idx, &byte) in int_bytes.iter().enumerate() {
        if idx > 0 && (len - idx).is_multiple_of(3) {
            formatted_int.push('.');
        }
        formatted_int.push(byte as char);
    }

    let sign = if is_negative { "-" } else { "" };
    format!("{sign}{formatted_int},{frac_part}")
}

/// Formata uma quantidade `Decimal` no padrão numérico brasileiro (até 4 casas decimais, sem zeros à direita supérfluos e sem ",00" em inteiros).
pub(crate) fn format_quantity_br(q: Decimal) -> String {
    let normalized = q
        .round_dp_with_strategy(4, RoundingStrategy::MidpointAwayFromZero)
        .normalize();
    let is_negative = normalized.is_sign_negative() && !normalized.is_zero();
    let abs_val = normalized.abs();
    let s = abs_val.to_string();
    let parts: Vec<&str> = s.split('.').collect();
    let int_part = parts[0];

    let int_bytes = int_part.as_bytes();
    let len = int_bytes.len();
    let mut formatted_int = String::with_capacity(len + (len / 3));

    for (idx, &byte) in int_bytes.iter().enumerate() {
        if idx > 0 && (len - idx).is_multiple_of(3) {
            formatted_int.push('.');
        }
        formatted_int.push(byte as char);
    }

    let sign = if is_negative { "-" } else { "" };
    if parts.len() > 1 && !parts[1].is_empty() {
        format!("{sign}{formatted_int},{}", parts[1])
    } else {
        format!("{sign}{formatted_int}")
    }
}

impl TypstDocumentRenderer {
    fn resolve_template_and_payload(
        request: &DocumentRequest,
    ) -> Result<(&'static str, String), DocumentError> {
        match request {
            DocumentRequest::CitizenLedger(payload) => {
                let json_str = serde_json::to_string(&payload.data)
                    .map_err(|error| DocumentError::SerializationError(error.to_string()))?;

                Ok((CITIZEN_TEMPLATE, json_str))
            }

            DocumentRequest::InvoiceBill(payload) => {
                let final_total = payload.final_total()?;
                let mut invoice_json = serde_json::to_value(payload)
                    .map_err(|error| DocumentError::SerializationError(error.to_string()))?;

                if let serde_json::Value::Object(ref mut map) = invoice_json {
                    // Remove identificadores legados que não fazem parte do contrato visual do Typst
                    map.remove("d1_protocol");

                    let amount_fmt = format_decimal_br(payload.amount);
                    let taxes_fmt = format_decimal_br(payload.taxes.unwrap_or(Decimal::ZERO));
                    let discount_fmt = format_decimal_br(payload.discount.unwrap_or(Decimal::ZERO));
                    let final_total_fmt = format_decimal_br(final_total);

                    map.insert(
                        "amount_fmt".to_string(),
                        serde_json::Value::String(amount_fmt.clone()),
                    );
                    map.insert(
                        "subtotal_fmt".to_string(),
                        serde_json::Value::String(amount_fmt),
                    );
                    map.insert(
                        "taxes_fmt".to_string(),
                        serde_json::Value::String(taxes_fmt),
                    );
                    map.insert(
                        "discount_fmt".to_string(),
                        serde_json::Value::String(discount_fmt),
                    );
                    map.insert(
                        "final_total_fmt".to_string(),
                        serde_json::Value::String(final_total_fmt),
                    );

                    let formatted_items: Vec<serde_json::Value> = payload
                        .items
                        .iter()
                        .map(|item| {
                            let mut item_map = serde_json::Map::new();
                            item_map.insert("id".to_string(), serde_json::Value::String(item.id.clone()));
                            item_map.insert(
                                "description".to_string(),
                                serde_json::Value::String(item.description.clone()),
                            );
                            if let Some(ref service) = item.service {
                                item_map.insert(
                                    "service".to_string(),
                                    serde_json::Value::String(service.clone()),
                                );
                            }
                            item_map.insert(
                                "quantity".to_string(),
                                serde_json::Value::String(item.quantity.to_string()),
                            );
                            item_map.insert(
                                "price".to_string(),
                                serde_json::Value::String(item.price.to_string()),
                            );
                            item_map.insert(
                                "total".to_string(),
                                serde_json::Value::String(item.total.to_string()),
                            );
                            item_map.insert(
                                "quantity_fmt".to_string(),
                                serde_json::Value::String(format_quantity_br(item.quantity)),
                            );
                            item_map.insert(
                                "price_fmt".to_string(),
                                serde_json::Value::String(format_decimal_br(item.price)),
                            );
                            item_map.insert(
                                "total_fmt".to_string(),
                                serde_json::Value::String(format_decimal_br(item.total)),
                            );
                            serde_json::Value::Object(item_map)
                        })
                        .collect();

                    map.insert("items".to_string(), serde_json::Value::Array(formatted_items));
                }

                let json_value = serde_json::json!({
                    "invoice": invoice_json
                });

                let json_str = serde_json::to_string(&json_value)
                    .map_err(|error| DocumentError::SerializationError(error.to_string()))?;

                Ok((INVOICE_TEMPLATE, json_str))
            }

            DocumentRequest::CessaoPosse(payload) => {
                let json_str = serde_json::to_string(&payload)
                    .map_err(|error| DocumentError::SerializationError(error.to_string()))?;

                Ok((CONTRATO_CESSAO_TEMPLATE, json_str))
            }

            DocumentRequest::RealEstateReconciliation(payload) => {
                let json_str = serde_json::to_string(&payload.data)
                    .map_err(|error| DocumentError::SerializationError(error.to_string()))?;

                Ok((RECONCILIATION_TEMPLATE, json_str))
            }
        }
    }

    /// Constrói de forma centralizada e sem duplicação as opções de compilação Typst.
    fn build_options(
        request: &DocumentRequest,
    ) -> Result<TypstCompileOptions<'static>, DocumentError> {
        let (template_source, json_payload) = Self::resolve_template_and_payload(request)?;

        let mut string_inputs = HashMap::new();
        string_inputs.insert("data", json_payload);

        Ok(TypstCompileOptions {
            template_source,
            fonts: CANONICAL_FONTS,
            string_inputs,
            static_sources: CANONICAL_TYPST_STATIC_SOURCES,
        })
    }
}

impl DocumentRenderer for TypstDocumentRenderer {
    fn supports(&self, kind: DocumentKind) -> bool {
        matches!(
            kind,
            DocumentKind::CitizenLedger
                | DocumentKind::InvoiceBill
                | DocumentKind::CessaoPosse
                | DocumentKind::RealEstateReconciliation
        )
    }

    fn render(&self, request: DocumentRequest) -> Result<RenderedDocument, DocumentError> {
        let options = Self::build_options(&request)?;

        let compiled = compile_typst_document_with_preview(options)
            .map_err(|error| DocumentError::CompilationError(error.to_string()))?;

        Ok(RenderedDocument::with_pages(
            compiled.pdf_bytes,
            compiled.pages,
        ))
    }

    fn render_pdf_only(&self, request: DocumentRequest) -> Result<RenderedDocument, DocumentError> {
        let options = Self::build_options(&request)?;

        let pdf_bytes = compile_typst_document_to_pdf(options)
            .map_err(|error| DocumentError::CompilationError(error.to_string()))?;

        Ok(RenderedDocument::with_pages(pdf_bytes, Vec::new()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::modules::documents::models::{
        CessaoPossePayload, CitizenLedgerPayload, InvoiceReportItem, InvoiceReportPayload,
        RealEstateReconciliationPayload,
    };
    use rust_decimal_macros::dec;
    use serde_json::json;

    fn assert_valid_rendered(rendered: &RenderedDocument) {
        assert!(
            !rendered.pdf_bytes.is_empty(),
            "O PDF gerado não deve estar vazio"
        );
        assert!(
            rendered.pdf_bytes.starts_with(b"%PDF-"),
            "O PDF gerado deve iniciar com o cabeçalho %PDF-"
        );
        assert!(
            !rendered.pages.is_empty(),
            "A renderização deve produzir ao menos uma página vetorial para preview"
        );
    }

    #[test]
    fn test_typst_renderer_supports_all_canonical_kinds() {
        let renderer = TypstDocumentRenderer::new();
        assert!(renderer.supports(DocumentKind::CitizenLedger));
        assert!(renderer.supports(DocumentKind::InvoiceBill));
        assert!(renderer.supports(DocumentKind::CessaoPosse));
        assert!(renderer.supports(DocumentKind::RealEstateReconciliation));
    }

    #[test]
    fn test_typst_renderer_compiles_invoice_bill() {
        let renderer = TypstDocumentRenderer::new();
        let payload = InvoiceReportPayload {
            id: "FAT-2026-RENDER".to_string(),
            member_name: "Associado Teste".to_string(),
            member_doc: "000.111.222-33".to_string(),
            member_email: None,
            member_address: None,
            description: "Taxa Associativa".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(150.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Taxa de Manutenção".to_string(),
                service: None,
                quantity: dec!(1.0),
                price: dec!(150.0),
                total: dec!(150.0),
            }],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        let output = renderer
            .render(DocumentRequest::InvoiceBill(payload))
            .expect("Renderização da fatura deve ter sucesso");

        assert_valid_rendered(&output);
    }

    #[test]
    fn test_typst_renderer_compiles_cessao_posse() {
        let renderer = TypstDocumentRenderer::new();
        let payload = CessaoPossePayload {
            document_number: "2026-0001/CP".to_string(),
            auth_code: "2026-X7Y9".to_string(),
            data: json!({
                "cedenteNome": "JOÃO SILVA TESTE",
                "cessionarioNome": "MARIA SOUZA TESTE",
                "imovelLote": "12",
                "imovelQuadra": "B"
            }),
        };

        let output = renderer
            .render(DocumentRequest::CessaoPosse(payload))
            .expect("Renderização da cessão de posse deve ter sucesso");

        assert_valid_rendered(&output);
    }

    #[test]
    fn test_typst_renderer_compiles_citizen_ledger() {
        let renderer = TypstDocumentRenderer::new();
        let payload = CitizenLedgerPayload {
            associate_id: Some("ASSOC-TEST".to_string()),
            data: json!({
                "meta": {
                    "generated_at": "23/10/2026",
                    "reference_period": "2026-10",
                    "audit_hash": "audit_hash_test"
                },
                "associate": {
                    "id": "123",
                    "name": "Associado Teste",
                    "cpf": "123.456.789-00",
                    "email": "associado@example.com",
                    "avatar_letter": "A",
                    "address_line1": "Rua Teste, 100",
                    "address_line2": "Centro"
                },
                "summary": {
                    "total_contracted": "1.000,00",
                    "total_paid": "1.000,00",
                    "outstanding_balance": "0,00"
                },
                "transactions": []
            }),
        };

        let output = renderer
            .render(DocumentRequest::CitizenLedger(payload))
            .expect("Renderização do extrato deve ter sucesso");

        assert_valid_rendered(&output);
    }

    #[test]
    fn test_typst_renderer_compiles_real_estate_reconciliation() {
        let renderer = TypstDocumentRenderer::new();
        let payload = RealEstateReconciliationPayload {
            data: json!({
                "generatedAt": "31/10/2026 13:00:00",
                "stats": {
                    "totalProperties": 1,
                    "totalIdentifiers": 1,
                    "totalAddresses": 1,
                    "totalBatches": 1,
                    "openFindingsCount": 0,
                    "pendingProposalsCount": 0
                },
                "batches": [],
                "findings": [],
                "properties": []
            }),
        };

        let output = renderer
            .render(DocumentRequest::RealEstateReconciliation(payload))
            .expect("Renderização da reconciliação deve ter sucesso");

        assert_valid_rendered(&output);
    }

    #[test]
    fn test_canonical_typst_static_sources_contain_all_core_modules() {
        let registered_paths: Vec<&str> = CANONICAL_TYPST_STATIC_SOURCES
            .iter()
            .map(|(path, _)| *path)
            .collect();

        assert!(registered_paths.contains(&"asppibra_layout.typ"));
        assert!(registered_paths.contains(&"core/branding.typ"));
        assert!(registered_paths.contains(&"core/typography.typ"));
        assert!(registered_paths.contains(&"core/page_abnt.typ"));
        assert!(registered_paths.contains(&"core/header_footer.typ"));
        assert!(registered_paths.contains(&"core/data_tags.typ"));

        // Garante que nenhum dos módulos estáticos embutidos está vazio
        for (path, content) in CANONICAL_TYPST_STATIC_SOURCES {
            assert!(
                !content.trim().is_empty(),
                "O módulo Typst {path} não deve estar vazio"
            );
        }
    }

    #[test]
    fn test_modular_core_templates_render_via_facade_and_direct_imports() {
        let template = r##"
        #import "asppibra_layout.typ": *

        #set page(
          paper: standard_paper,
          margin: margins_abnt_legal,
          header: asppibra_header_running(
              doc_number: "2026-TEST/MODULAR",
              doc_title: "Documento de Teste Modular",
          ),
          footer: asppibra_footer(doc_number: "2026-TEST/MODULAR", auth_code: "AUTH-MOD-01"),
        )

        #asppibra_header_first_page(doc_number: "2026-TEST/MODULAR")

        #section_heading("TESTE MODULAR INSTITUCIONAL")

        Entidade: #asppibra_razao_social \
        CNPJ Oficial: #asppibra_cnpj \
        Sigla: #asppibra_sigla \
        Tag Teste: #asppibra_tag("CAMPO_OBRIGATORIO", "Valor Preenchido")
        "##;

        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
            string_inputs: HashMap::new(),
            static_sources: CANONICAL_TYPST_STATIC_SOURCES,
        };

        let pdf_bytes = compile_typst_document(options)
            .expect("Compilação via facade modular asppibra_layout.typ deve funcionar");

        assert_valid_rendered(&RenderedDocument::new(pdf_bytes));
    }

    #[test]
    fn test_direct_core_modules_imports_without_facade() {
        let template = r##"
        #import "core/branding.typ": asppibra_razao_social, asppibra_cnpj, asppibra_sigla, color_gold
        #import "core/typography.typ": font_family_base, section_heading, font_size_title
        #import "core/page_abnt.typ": standard_paper, margins_institutional_contract
        #import "core/header_footer.typ": asppibra_header_first_page, asppibra_footer
        #import "core/data_tags.typ": asppibra_tag

        #set page(
          paper: standard_paper,
          margin: margins_institutional_contract,
          footer: asppibra_footer(doc_number: "2026-DIRECT/01", auth_code: "AUTH-01"),
        )

        #asppibra_header_first_page(doc_number: "2026-DIRECT/01")
        #section_heading("IMPORTAÇÃO DIRETA DOS MÓDULOS")

        Entidade: #asppibra_razao_social \
        CNPJ: #asppibra_cnpj \
        Sigla: #asppibra_sigla \
        Campo: #asppibra_tag("PROPRIETARIO", "Associado Direto")
        "##;

        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
            string_inputs: HashMap::new(),
            static_sources: CANONICAL_TYPST_STATIC_SOURCES,
        };

        let pdf_bytes = compile_typst_document(options)
            .expect("Compilação com importação direta dos módulos core/ deve funcionar");

        assert_valid_rendered(&RenderedDocument::new(pdf_bytes));
    }

    #[test]
    fn test_transitive_nested_imports_multi_tier() {
        // Testa a cadeia transitiva:
        // Documento -> asppibra_layout.typ -> core/header_footer.typ -> branding.typ / typography.typ
        let template = r##"
        #import "asppibra_layout.typ": asppibra_header_first_page, asppibra_footer, asppibra_tag, margins_contract, standard_paper

        #set page(
          paper: standard_paper,
          margin: margins_contract,
          footer: asppibra_footer(doc_number: "2026-TIER/01", auth_code: "HASH-OK"),
        )

        #asppibra_header_first_page(doc_number: "2026-TIER/01")
        #asppibra_tag("VALIDACAO_TRANSITIVA", "Sucesso em Memória")
        "##;

        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
            string_inputs: HashMap::new(),
            static_sources: CANONICAL_TYPST_STATIC_SOURCES,
        };

        let pdf_bytes = compile_typst_document(options)
            .expect("Cadeia transitiva completa em memória deve compilar perfeitamente");

        assert_valid_rendered(&RenderedDocument::new(pdf_bytes));
    }

    #[test]
    fn test_page_abnt_profiles_and_backward_compatibility_aliases() {
        let template = r##"
        #import "core/page_abnt.typ": *

        #let c1 = margins_institutional_contract
        #let c2 = margins_contract
        #let c3 = margins_abnt_legal

        #let f1 = margins_institutional_financial
        #let f2 = margins_financial

        #let t1 = margins_institutional_territorial
        #let t2 = margins_territorial
        #let t3 = margins_report

        #set page(paper: standard_paper, margin: c1)
        [Perfis de Margens Verificados: Contratual, Financeiro e Territorial]
        "##;

        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
            string_inputs: HashMap::new(),
            static_sources: CANONICAL_TYPST_STATIC_SOURCES,
        };

        let pdf_bytes = compile_typst_document(options)
            .expect("Perfis institucionais de margens e aliases devem compilar corretamente");

        assert_valid_rendered(&RenderedDocument::new(pdf_bytes));
    }

    #[test]
    fn test_footer_does_not_claim_icp_brasil_authentication() {
        // Garante que o template do rodapé em core/header_footer.typ
        // NÃO alega autenticação ICP-Brasil
        let footer_source = include_str!("../../../templates/core/header_footer.typ");
        assert!(
            !footer_source.contains("ICP-Brasil"),
            "O rodapé não deve conter alegação indevida de certificação ICP-Brasil"
        );
        assert!(
            footer_source.contains("Registro Nº"),
            "O rodapé deve conter a identificação explícita do número de registro"
        );
        assert!(
            footer_source.contains("DevOS"),
            "O rodapé deve refletir a identificação do sistema emissor DevOS"
        );
    }

    #[test]
    fn test_footer_rejects_none_empty_and_whitespace_only_parameters() {
        let invalid_cases = [
            ("doc_number: none", "auth_code: \"2026-X7Y9\""),
            ("doc_number: \"\"", "auth_code: \"2026-X7Y9\""),
            ("doc_number: \"   \"", "auth_code: \"2026-X7Y9\""),
            ("doc_number: \"2026-0001/CP\"", "auth_code: none"),
            ("doc_number: \"2026-0001/CP\"", "auth_code: \"\""),
            ("doc_number: \"2026-0001/CP\"", "auth_code: \"   \""),
        ];

        for (doc_part, auth_part) in invalid_cases {
            let template = format!(
                r##"
                #import "core/header_footer.typ": asppibra_footer
                #asppibra_footer({doc_part}, {auth_part})
                "##
            );
            let options = TypstCompileOptions {
                template_source: &template,
                fonts: &[],
                string_inputs: HashMap::new(),
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };
            assert!(
                compile_typst_document(options).is_err(),
                "asppibra_footer deve falhar para {doc_part}, {auth_part}"
            );
        }
    }

    #[test]
    fn test_header_rejects_none_empty_and_whitespace_only_parameters() {
        // 1. First page header: doc_number rejeita none, "" e "   "
        for invalid_doc in ["none", "\"\"", "\"   \""] {
            let template = format!(
                r##"
                #import "core/header_footer.typ": asppibra_header_first_page
                #asppibra_header_first_page(doc_number: {invalid_doc})
                "##
            );
            let options = TypstCompileOptions {
                template_source: &template,
                fonts: &[],
                string_inputs: HashMap::new(),
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };
            assert!(
                compile_typst_document(options).is_err(),
                "asppibra_header_first_page deve falhar para doc_number={invalid_doc}"
            );
        }

        // 2. Running header: doc_number e doc_title rejeitam none, "" e "   "
        let invalid_cases = [
            ("doc_number: none", "doc_title: \"Contrato de Posse\""),
            ("doc_number: \"\"", "doc_title: \"Contrato de Posse\""),
            ("doc_number: \"   \"", "doc_title: \"Contrato de Posse\""),
            ("doc_number: \"2026-0001/CP\"", "doc_title: none"),
            ("doc_number: \"2026-0001/CP\"", "doc_title: \"\""),
            ("doc_number: \"2026-0001/CP\"", "doc_title: \"   \""),
        ];

        for (doc_part, title_part) in invalid_cases {
            let template = format!(
                r##"
                #import "core/header_footer.typ": asppibra_header_running
                #asppibra_header_running({doc_part}, {title_part})
                "##
            );
            let options = TypstCompileOptions {
                template_source: &template,
                fonts: &[],
                string_inputs: HashMap::new(),
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };
            assert!(
                compile_typst_document(options).is_err(),
                "asppibra_header_running deve falhar para {doc_part}, {title_part}"
            );
        }
    }

    #[test]
    fn test_cessao_posse_template_rejects_missing_empty_or_whitespace_metadata() {
        let renderer = TypstDocumentRenderer::new();

        for (doc_num, auth_code) in [
            ("", "2026-X7Y9"),
            ("   ", "2026-X7Y9"),
            ("2026-0001/CP", ""),
            ("2026-0001/CP", "   "),
        ] {
            let payload = CessaoPossePayload {
                document_number: doc_num.to_string(),
                auth_code: auth_code.to_string(),
                data: json!({"cedenteNome": "Teste"}),
            };

            let result = renderer.render(DocumentRequest::CessaoPosse(payload));
            assert!(
                result.is_err(),
                "O template contrato_cessao_posse.typ deve rejeitar document_number='{doc_num}' e auth_code='{auth_code}'"
            );
        }

        // Também valida JSON bruto sem document_number ou sem auth_code (ausência total da chave)
        for raw_json in [
            json!({"auth_code": "2026-X7Y9", "data": {}}),
            json!({"document_number": "2026-0001/CP", "data": {}}),
            json!({"data": {}}),
        ] {
            let mut string_inputs = HashMap::new();
            string_inputs.insert("data", raw_json.to_string());

            let options = TypstCompileOptions {
                template_source: CONTRATO_CESSAO_TEMPLATE,
                fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
                string_inputs,
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };

            assert!(
                compile_typst_document(options).is_err(),
                "O template contrato_cessao_posse.typ deve falhar quando document_number ou auth_code estão ausentes no JSON"
            );
        }
    }

    #[test]
    fn test_cessao_posse_template_uses_canonical_import_and_has_no_duplicate_section_heading() {
        assert!(
            CONTRATO_CESSAO_TEMPLATE.contains("#import \"asppibra_layout.typ\": *"),
            "contrato_cessao_posse.typ deve importar canonicamente asppibra_layout.typ"
        );
        assert!(
            !CONTRATO_CESSAO_TEMPLATE.contains("#let section_heading"),
            "contrato_cessao_posse.typ não deve redeclarar section_heading localmente"
        );
        assert!(
            !CONTRATO_CESSAO_TEMPLATE.contains("2026-0001/CP"),
            "contrato_cessao_posse.typ não deve conter fallback hardcoded 2026-0001/CP"
        );
        assert!(
            !CONTRATO_CESSAO_TEMPLATE.contains("2026-X7Y9"),
            "contrato_cessao_posse.typ não deve conter fallback hardcoded 2026-X7Y9"
        );
    }

    #[test]
    fn test_templates_do_not_contain_unverified_legal_or_d1_claims() {
        let templates = [
            ("extrato_citizen_ledger.typ", CITIZEN_TEMPLATE),
            ("invoice_bill.typ", INVOICE_TEMPLATE),
            ("contrato_cessao_posse.typ", CONTRATO_CESSAO_TEMPLATE),
            ("real_estate_reconciliation.typ", RECONCILIATION_TEMPLATE),
            ("core/header_footer.typ", CORE_HEADER_FOOTER),
        ];

        let forbidden_system_claims = [
            "CHANCELA DIGITAL DE AUDITORIA",
            "Autenticação digital sob a Lei Federal nº 14.063/2020",
            "protocolo criptográfico com carimbo do tempo",
            "VERIFICADO ✓",
            "Cloudflare D1",
            "Protocolo D1",
            "Hash D1",
            "AUTENTICAÇÃO CRIPTOGRÁFICA D1 LEDGER",
            "poderão ser utilizadas como elemento de prova eletrônica",
            "05d4084730d36b1073d62c37ab83e9c425d795b5ff34ed949083cdbf02fd7b33",
        ];

        for (name, source) in templates {
            for forbidden in forbidden_system_claims {
                assert!(
                    !source.contains(forbidden),
                    "O template {name} não deve conter a alegação de sistema não implementada '{forbidden}'"
                );
            }
        }

        // Templates não contratuais e componentes de cabeçalho/rodapé não devem mencionar ICP-Brasil ou Lei 14.063/2020
        for (name, source) in [
            ("extrato_citizen_ledger.typ", CITIZEN_TEMPLATE),
            ("invoice_bill.typ", INVOICE_TEMPLATE),
            ("real_estate_reconciliation.typ", RECONCILIATION_TEMPLATE),
            ("core/header_footer.typ", CORE_HEADER_FOOTER),
        ] {
            for term in ["ICP-Brasil", "14.063/2020", "carimbo do tempo"] {
                assert!(
                    !source.contains(term),
                    "O template {name} não deve conter '{term}'"
                );
            }
        }

        // Garante que as cláusulas jurídicas materiais 16.1 e 16.2 do contrato foram preservadas
        assert!(
            CONTRATO_CESSAO_TEMPLATE.contains(
                "16.1. As partes reconhecem, desde já, a validade jurídica, a autenticidade e a força probante da assinatura eletrônica aposta a este instrumento"
            ),
            "A cláusula contratual material 16.1 deve ser preservada integralmente"
        );
        assert!(
            CONTRATO_CESSAO_TEMPLATE.contains(
                "16.2. Consideram-se válidas, para fins de celebração e prova deste contrato entre as partes, as assinaturas eletrônicas nas modalidades simples, avançada ou qualificada (certificado ICP-Brasil)"
            ),
            "A cláusula contratual material 16.2 deve ser preservada integralmente"
        );
    }

    #[test]
    fn test_all_four_templates_import_canonical_layout_and_apply_institutional_profiles() {
        let expectations = [
            (
                "contrato_cessao_posse.typ",
                CONTRATO_CESSAO_TEMPLATE,
                "margins_institutional_contract",
            ),
            (
                "invoice_bill.typ",
                INVOICE_TEMPLATE,
                "margins_institutional_financial",
            ),
            (
                "extrato_citizen_ledger.typ",
                CITIZEN_TEMPLATE,
                "margins_institutional_financial",
            ),
            (
                "real_estate_reconciliation.typ",
                RECONCILIATION_TEMPLATE,
                "margins_institutional_territorial",
            ),
        ];

        for (name, source, expected_margin_profile) in expectations {
            assert!(
                source.contains("#import \"asppibra_layout.typ\": *"),
                "O template {name} deve importar explicitamente '#import \"asppibra_layout.typ\": *'"
            );
            assert!(
                source.contains(expected_margin_profile),
                "O template {name} deve aplicar o perfil geométrico {expected_margin_profile}"
            );
            assert!(
                source.contains("asppibra_header_first_page("),
                "O template {name} deve utilizar o cabeçalho institucional da 1ª página (asppibra_header_first_page)"
            );
            assert!(
                source.contains("asppibra_header_running("),
                "O template {name} deve utilizar o cabeçalho institucional corrente (asppibra_header_running)"
            );
            assert!(
                source.contains("asppibra_footer("),
                "O template {name} deve utilizar o rodapé institucional (asppibra_footer)"
            );
            assert!(
                source.contains("section_heading("),
                "O template {name} deve utilizar os títulos de seção institucionais (section_heading)"
            );
        }
    }

    #[test]
    fn test_all_non_contract_templates_reject_missing_or_empty_identifiers() {
        // 1. Garante que nenhum dos 3 templates não contratuais fabrica doc_number ou auth_code fictícios
        for (name, source) in [
            ("invoice_bill.typ", INVOICE_TEMPLATE),
            ("extrato_citizen_ledger.typ", CITIZEN_TEMPLATE),
            ("real_estate_reconciliation.typ", RECONCILIATION_TEMPLATE),
        ] {
            assert!(
                source.contains("require_registration: false"),
                "O template {name} deve utilizar require_registration: false nos cabeçalhos/rodapés até a FASE 7"
            );
            for forbidden_fabrication in [
                "\"FAT-\" +",
                "\"EXT-\" +",
                "\"REC-\" +",
                "\"CAD-MARICA-\"",
                "d1_protocol",
            ] {
                assert!(
                    !source.contains(forbidden_fabrication),
                    "O template {name} não deve fabricar identificador documental fictício ('{forbidden_fabrication}')"
                );
            }
        }

        // 2. InvoiceBill sem id ou com id vazio deve falhar na compilação do template
        for invalid_invoice_json in [
            json!({"invoice": {"id": "", "reference_month": "2026-10", "amount": 100.0, "status": "pending", "member_name": "Teste", "member_doc": "000", "due_date": "2026-10-31", "payment_method": "Pix", "items": []}}),
            json!({"invoice": {"id": "   ", "reference_month": "2026-10", "amount": 100.0, "status": "pending", "member_name": "Teste", "member_doc": "000", "due_date": "2026-10-31", "payment_method": "Pix", "items": []}}),
        ] {
            let mut string_inputs = HashMap::new();
            string_inputs.insert("data", invalid_invoice_json.to_string());
            let options = TypstCompileOptions {
                template_source: INVOICE_TEMPLATE,
                fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
                string_inputs,
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };
            assert!(
                compile_typst_document(options).is_err(),
                "invoice_bill.typ deve rejeitar fatura sem id válido"
            );
        }

        // 3. CitizenLedger sem associate.id ou sem meta.reference_period deve falhar na compilação do template
        for invalid_ledger_json in [
            json!({"meta": {"generated_at": "23/10/2026", "reference_period": ""}, "associate": {"id": "123", "name": "A", "cpf": "0", "email": "a@b", "avatar_letter": "A", "address_line1": "R", "address_line2": "B"}, "summary": {"total_contracted": "0", "total_paid": "0", "outstanding_balance": "0"}, "transactions": []}),
            json!({"meta": {"generated_at": "23/10/2026", "reference_period": "2026-10"}, "associate": {"id": "   ", "name": "A", "cpf": "0", "email": "a@b", "avatar_letter": "A", "address_line1": "R", "address_line2": "B"}, "summary": {"total_contracted": "0", "total_paid": "0", "outstanding_balance": "0"}, "transactions": []}),
        ] {
            let mut string_inputs = HashMap::new();
            string_inputs.insert("data", invalid_ledger_json.to_string());
            let options = TypstCompileOptions {
                template_source: CITIZEN_TEMPLATE,
                fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
                string_inputs,
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };
            assert!(
                compile_typst_document(options).is_err(),
                "extrato_citizen_ledger.typ deve rejeitar extrato sem associate.id ou sem meta.reference_period"
            );
        }

        // 4. RealEstateReconciliation sem generatedAt deve falhar na compilação do template
        for invalid_rec_json in [
            json!({"generatedAt": "   ", "stats": {"totalProperties": 1, "totalIdentifiers": 1, "totalAddresses": 1, "totalBatches": 1, "openFindingsCount": 0, "pendingProposalsCount": 0}, "batches": [], "findings": [], "properties": []}),
            json!({"stats": {"totalProperties": 1, "totalIdentifiers": 1, "totalAddresses": 1, "totalBatches": 1, "openFindingsCount": 0, "pendingProposalsCount": 0}, "batches": [], "findings": [], "properties": []}),
        ] {
            let mut string_inputs = HashMap::new();
            string_inputs.insert("data", invalid_rec_json.to_string());
            let options = TypstCompileOptions {
                template_source: RECONCILIATION_TEMPLATE,
                fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
                string_inputs,
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };
            assert!(
                compile_typst_document(options).is_err(),
                "real_estate_reconciliation.typ deve rejeitar payload sem generatedAt válido"
            );
        }
    }

    #[test]
    fn test_cessao_posse_template_reconciles_full_legal_content_and_dynamic_fields() {
        // 0. Garante que não há artefatos residuais de JSX no template Typst
        for jsx_artifact in ["{' '}", "{\" \"}", "<Clause>", "</Clause>", "<DataTag"] {
            assert!(
                !CONTRATO_CESSAO_TEMPLATE.contains(jsx_artifact),
                "contrato_cessao_posse.typ não deve conter artefato residual de JSX: {jsx_artifact}"
            );
        }
        // 1. Verifica que todos os 17 capítulos + seções de assinaturas e testemunhas estão presentes (idênticos ao CessaoPosseContent.tsx)
        let required_sections = [
            "CAPÍTULO I – DAS PARTES",
            "CAPÍTULO II – DAS DECLARAÇÕES PRELIMINARES",
            "CAPÍTULO III – DO OBJETO",
            "CAPÍTULO IV – DA ORIGEM DA POSSE, CADEIA POSSESSÓRIA E REGULARIZAÇÃO FUNDIÁRIA",
            "CAPÍTULO V – DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO",
            "CAPÍTULO VI – DA FORMA DE PAGAMENTO E COMPROVAÇÃO",
            "CAPÍTULO VII – DAS OBRIGAÇÕES TRIBUTÁRIAS, MUNICIPAIS, NOTARIAIS E REGISTRAIS",
            "CAPÍTULO VIII – DA IMISSÃO NA POSSE E DAS BENFEITORIAS",
            "CAPÍTULO IX – DO INADIMPLEMENTO, JUROS E MULTA",
            "CAPÍTULO X – DA RESOLUÇÃO, DO DISTRATO E DE SUAS CONSEQUÊNCIAS",
            "CAPÍTULO XI – DA EVICÇÃO, DA PERDA DA POSSE E DA VERACIDADE DAS DECLARAÇÕES DO CEDENTE",
            "CAPÍTULO XII – DO CASO FORTUITO E DA FORÇA MAIOR",
            "CAPÍTULO XIII – DA PROTEÇÃO DE DADOS PESSOAIS",
            "CAPÍTULO XIV – DA MEDIAÇÃO, DA ARBITRAGEM E DO FORO",
            "CAPÍTULO XV – DAS CUSTAS E HONORÁRIOS EM CASO DE LITÍGIO",
            "CAPÍTULO XVI – DA ASSINATURA ELETRÔNICA E DA ATUALIZAÇÃO CADASTRAL",
            "CAPÍTULO XVII – DISPOSIÇÕES GERAIS",
            "ASSINATURAS E VALIDAÇÃO DIGITAL",
            "TESTEMUNHAS INSTRUMENTÁRIAS",
        ];

        for section in required_sections {
            assert!(
                CONTRATO_CESSAO_TEMPLATE.contains(section),
                "O template contrato_cessao_posse.typ deve conter a seção '{section}'"
            );
        }

        // 2. Verifica que as subcláusulas e parágrafos reconciliados (que estavam condensados antes da Fase 4) estão integralmente presentes
        let required_clauses = [
            "1.5.1.",
            "1.5.8.",
            "1.5.12.",
            "1.5.17.",
            "1.5.25.",
            "1.5.34.",
            "1.5.45.",
            "2.7.1.",
            "2.7.2.",
            "2.8.",
            "2.8.1.",
            "3.3.1.",
            "3.3.2.",
            "3.3.3.",
            "4.1.1.",
            "4.2.1.",
            "4.3.1.",
            "4.9.",
            "5.7.1.",
            "5.7.2.",
            "6.5.",
            "7.5.1.",
            "7.7.",
            "8.4.1.",
            "9.6.",
            "10.2.1.",
            "10.2.2.",
            "10.2.3.",
            "10.2.3.1.",
            "10.2.3.2.",
            "10.2.3.3.",
            "10.3.1.",
            "10.3.2.",
            "10.3.3.",
            "10.3.4.",
            "10.5.",
            "11.1.1.",
            "11.1.2.",
            "11.1.3.",
            "11.5.",
            "12.1.",
            "12.2.",
            "13.1.",
            "13.2.",
            "13.3.",
            "13.4.",
            "14.1.",
            "14.2.",
            "14.3.",
            "15.1.",
            "16.1.",
            "16.2.",
            "16.3.",
            "16.4.",
            "16.5.",
            "16.6.",
            "17.1.",
            "17.2.",
            "17.3.",
            "17.4.",
            "17.5.",
            "17.6.",
            "17.7.",
            "17.8.",
            "17.9.",
            "17.10.",
        ];

        for clause_marker in required_clauses {
            assert!(
                CONTRATO_CESSAO_TEMPLATE.contains(clause_marker),
                "O template contrato_cessao_posse.typ deve conter a cláusula reconciliada '{clause_marker}'"
            );
        }

        // 3. Verifica a presença dos campos dinâmicos reconciliados que estavam ausentes antes da Fase 4
        let reconciled_fields = [
            "conjugeQualidade",
            "asppibraRepresentanteNacionalidade",
            "asppibraRepresentanteEstadoCivil",
            "asppibraRepresentanteRgOrgaoUf",
            "asppibraDocumentoPoderes",
            "asppibraRemuneracaoValor",
            "asppibraRemuneracaoValorExtenso",
            "asppibraRemuneracaoPercentual",
            "asppibraRemuneracaoBaseCalculo",
            "asppibraRemuneracaoResponsavel",
            "comarcaCartorioImoveis",
            "municipioPrefeitura",
            "numeroCertidaoFiscalVenal",
            "cpfCnpjTitularCadastral",
            "nomeLoteamento",
            "municipioLoteamento",
            "processoAdmLoteamento",
            "cartorioLoteamento",
            "registroLoteamento",
            "identificacaoLoteTerreno",
            "dataReferenciaIptu",
            "valorTotalDividaExtenso",
            "anoVigenteIptu",
            "valorParcelaIptu",
            "numeroParcelasIptu",
            "saldoVencerIptu",
            "capituloPenalidadesOmissao",
            "prazoComprovacaoQuitacaoDivida",
            "prazoApresentacaoComprovanteParcelamento",
            "totalParcelasMensais",
            "valorTotalCiclo",
            "vencimentoPrimeiroCiclo",
            "prazoEntregaCertidoes",
            "prazoEntregaCertidoesDisponibilizadas",
            "plataformaAssinatura",
            "municipioAssinatura",
            "diaAssinatura",
            "mesAssinatura",
            "anoAssinatura",
            "cedenteAssinatura",
            "cessionarioAssinatura",
            "conjugeAssinatura",
            "asppibraAssinatura",
            "testemunha1Assinatura",
            "testemunha2Assinatura",
            "testemunha3Assinatura",
        ];

        for field in reconciled_fields {
            let pattern = format!("#get_val(\"{field}\",");
            assert!(
                CONTRATO_CESSAO_TEMPLATE.contains(&pattern),
                "O template contrato_cessao_posse.typ deve conter o campo dinâmico reconciliado '{field}'"
            );
        }

        // 4. Compila o contrato reconciliado preenchendo os campos dinâmicos e verifica o PDF gerado
        let renderer = TypstDocumentRenderer::new();
        let payload = CessaoPossePayload {
            document_number: "2026-FASE4-0001/CP".to_string(),
            auth_code: "AUTH-FASE4-2026".to_string(),
            data: json!({
                "cedenteNome": "CARLOS ALBERTO MENDES",
                "cessionarioNome": "FERNANDA LIMA COSTA",
                "conjugeQualidade": "anuente",
                "asppibraRepresentanteNome": "SANDRO PEREIRA",
                "asppibraRemuneracaoValor": "3.500,00",
                "nomeLoteamento": "Jardim Atlântico",
                "municipioLoteamento": "Maricá/RJ",
                "numeroLote": "14",
                "quadraLote": "B",
                "valorTotalCessao": "120.000,00",
                "plataformaAssinatura": "Gov.br",
                "municipioAssinatura": "Maricá/RJ",
                "diaAssinatura": "03",
                "mesAssinatura": "novembro",
                "anoAssinatura": "2026"
            }),
        };

        let rendered = renderer
            .render(DocumentRequest::CessaoPosse(payload))
            .expect("O contrato reconciliado deve compilar com sucesso");

        assert_valid_rendered(&rendered);
        assert!(
            rendered.pdf_bytes.len() > 20_000,
            "O PDF do contrato integral reconciliado deve possuir tamanho substancial (> 20 KB), obtido: {} bytes",
            rendered.pdf_bytes.len()
        );
    }

    #[test]
    fn test_invoice_bill_template_renders_exact_final_total_across_scenarios() {
        let renderer = TypstDocumentRenderer::new();

        let scenarios = [
            // (amount, taxes, discount, expected_total_str)
            (dec!(150.0), None, None, "Total: R$ 150"),
            (dec!(150.0), Some(dec!(15.5)), None, "Total: R$ 165.5"),
            (dec!(150.0), None, Some(dec!(20.0)), "Total: R$ 130"),
            (dec!(150.0), Some(dec!(15.5)), Some(dec!(20.0)), "Total: R$ 145.5"),
        ];

        for (amount, taxes, discount, expected_total_marker) in scenarios {
            let payload = InvoiceReportPayload {
                id: "FAT-CALC-TEST".to_string(),
                member_name: "Associado Financeiro".to_string(),
                member_doc: "123.456.789-00".to_string(),
                member_email: None,
                member_address: None,
                description: "Fatura Teste Cálculo".to_string(),
                reference_month: "2026-10".to_string(),
                amount,
                due_date: "2026-10-31".to_string(),
                settled_date: None,
                payment_method: "Pix".to_string(),
                status: "pending".to_string(),
                items: vec![InvoiceReportItem {
                    id: "item-1".to_string(),
                    description: "Serviço Associativo".to_string(),
                    service: None,
                    quantity: dec!(1.0),
                    price: amount,
                    total: amount,
                }],
                taxes,
                discount,
                d1_protocol: None,
            };

            let rendered = renderer
                .render(DocumentRequest::InvoiceBill(payload))
                .expect("Renderização da fatura deve compilar com sucesso");

            assert_valid_rendered(&rendered);

            let pdf_lossy = String::from_utf8_lossy(&rendered.pdf_bytes);
            assert!(
                pdf_lossy.contains(expected_total_marker),
                "PDF da fatura deve conter '{expected_total_marker}' para amount={amount}, taxes={taxes:?}, discount={discount:?}"
            );
        }
    }
}
```

---

