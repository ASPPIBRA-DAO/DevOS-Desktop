use serde::{Deserialize, Serialize};
use thiserror::Error;

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
}

/// Identificador da família/modelo de documento no catálogo de emissão
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DocumentKind {
    /// Extrato de Livro-Razão do Cidadão (Citizen Ledger)
    CitizenLedger,
    /// Fatura / Recibo Associativo (Invoice Bill)
    InvoiceBill,
}

/// Escopo de segurança e permissão por edição da aplicação (Cockpit vs Node)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DocumentScope {
    CockpitOnly,
    NodeOnly,
    Universal,
}

impl DocumentKind {
    pub fn required_scope(&self) -> DocumentScope {
        match self {
            DocumentKind::CitizenLedger => DocumentScope::Universal,
            DocumentKind::InvoiceBill => DocumentScope::Universal,
        }
    }

    pub fn template_id(&self) -> &'static str {
        match self {
            DocumentKind::CitizenLedger => "extrato_citizen_ledger.typ",
            DocumentKind::InvoiceBill => "invoice_bill.typ",
        }
    }
}

/// Metadados de rastreabilidade gerados para cada emissão
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DocumentMetadata {
    pub document_kind: DocumentKind,
    pub generated_at_utc: String,
    pub sha256_checksum: String,
    pub byte_size: usize,
    pub template_id: String,
}

/// Saída padronizada de qualquer geração documental no pipeline
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DocumentOutput {
    pub pdf_bytes: Vec<u8>,
    pub metadata: DocumentMetadata,
}

/// Requisição fortemente tipada para o pipeline de geração de documentos
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", content = "payload", rename_all = "snake_case")]
pub enum DocumentRequest {
    CitizenLedger(crate::reports::models::CitizenLedgerPayload),
    InvoiceBill(crate::reports::models::InvoiceReportPayload),
}

impl DocumentRequest {
    pub fn kind(&self) -> DocumentKind {
        match self {
            DocumentRequest::CitizenLedger(_) => DocumentKind::CitizenLedger,
            DocumentRequest::InvoiceBill(_) => DocumentKind::InvoiceBill,
        }
    }
}
