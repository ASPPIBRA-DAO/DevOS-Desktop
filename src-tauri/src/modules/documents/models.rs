use serde::{Deserialize, Serialize};
use thiserror::Error;

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
}

impl DocumentError {
    /// Retorna uma mensagem apropriada para apresentação ao usuário.
    ///
    /// Não substitui o tratamento de erros na camada IPC.
    /// O chamador deve utilizar este método em vez de expor diretamente
    /// os detalhes técnicos contidos nas variantes do erro.
    pub fn public_message(&self) -> &'static str {
        match self {
            Self::UnsupportedDocumentType(_) => {
                "O tipo de documento solicitado não é suportado."
            }
            Self::SerializationError(_) => {
                "Não foi possível preparar os dados do documento."
            }
            Self::CompilationError(_) => {
                "Não foi possível gerar o documento."
            }
            Self::ValidationError(_) => {
                "Os dados fornecidos para o documento são inválidos."
            }
            Self::UnauthorizedScope(_) => {
                "Esta edição do aplicativo não está autorizada a gerar este documento."
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
}

impl DocumentKind {
    /// Declara o escopo necessário para o tipo documental.
    ///
    /// Este método descreve a política declarada pelo modelo.
    /// A autorização efetiva deve ser aplicada na camada responsável
    /// pelo controle de acesso.
    pub fn required_scope(&self) -> DocumentScope {
        match self {
            DocumentKind::CitizenLedger => DocumentScope::Universal,
            DocumentKind::InvoiceBill => DocumentScope::Universal,
            DocumentKind::CessaoPosse => DocumentScope::Universal,
        }
    }

    /// Retorna o identificador do template utilizado pelo tipo documental.
    pub fn template_id(&self) -> &'static str {
        match self {
            DocumentKind::CitizenLedger => "extrato_citizen_ledger.typ",
            DocumentKind::InvoiceBill => "invoice_bill.typ",
            DocumentKind::CessaoPosse => "contrato_cessao_posse.typ",
        }
    }
}

/// Escopo de segurança e permissão por edição da aplicação.
///
/// A declaração do escopo não substitui a verificação de autorização
/// no comando ou serviço responsável pela operação.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DocumentScope {
    CockpitOnly,
    NodeOnly,
    Universal,
}

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

/// Saída padronizada da geração documental.
///
/// `pdf_bytes` contém os bytes do documento gerado.
/// Ao transportar PDFs grandes por IPC serializado como JSON, considere
/// o custo da representação binária como uma sequência de números.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DocumentOutput {
    pub pdf_bytes: Vec<u8>,
    pub metadata: DocumentMetadata,
}

/// Requisição fortemente tipada para o pipeline de geração.
///
/// A representação serializada contém o discriminador `kind` e o
/// conteúdo correspondente em `payload`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", content = "payload", rename_all = "snake_case")]
pub enum DocumentRequest {
    CitizenLedger(crate::reports::models::CitizenLedgerPayload),
    InvoiceBill(crate::reports::models::InvoiceReportPayload),
    CessaoPosse(crate::reports::models::CessaoPossePayload),
}

impl DocumentRequest {
    /// Retorna o tipo documental associado à requisição.
    pub fn kind(&self) -> DocumentKind {
        match self {
            DocumentRequest::CitizenLedger(_) => DocumentKind::CitizenLedger,
            DocumentRequest::InvoiceBill(_) => DocumentKind::InvoiceBill,
            DocumentRequest::CessaoPosse(_) => DocumentKind::CessaoPosse,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::reports::models::CitizenLedgerPayload;
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
    fn document_scope_uses_snake_case() {
        assert_eq!(
            serde_json::to_string(&DocumentScope::CockpitOnly).unwrap(),
            "\"cockpit_only\""
        );

        assert_eq!(
            serde_json::to_string(&DocumentScope::NodeOnly).unwrap(),
            "\"node_only\""
        );

        assert_eq!(
            serde_json::to_string(&DocumentScope::Universal).unwrap(),
            "\"universal\""
        );
    }

    #[test]
    fn document_kinds_keep_expected_scopes_and_template_ids() {
        assert_eq!(
            DocumentKind::CitizenLedger.required_scope(),
            DocumentScope::Universal
        );

        assert_eq!(
            DocumentKind::InvoiceBill.required_scope(),
            DocumentScope::Universal
        );

        assert_eq!(
            DocumentKind::CitizenLedger.template_id(),
            "extrato_citizen_ledger.typ"
        );

        assert_eq!(
            DocumentKind::InvoiceBill.template_id(),
            "invoice_bill.typ"
        );
    }

    #[test]
    fn citizen_ledger_request_preserves_wire_contract() {
        let request = DocumentRequest::CitizenLedger(CitizenLedgerPayload {
            associate_id: None,
            data: json!({}),
        });

        assert_eq!(request.kind(), DocumentKind::CitizenLedger);

        let serialized = serde_json::to_value(&request)
            .expect("A requisição deve ser serializável");

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
        let internal_detail =
            "/private/path/template.typ: conteúdo confidencial de entrada";

        let error = DocumentError::CompilationError(
            internal_detail.to_string(),
        );

        let message = error.public_message();

        assert_eq!(
            message,
            "Não foi possível gerar o documento."
        );

        assert!(
            !message.contains(internal_detail),
            "A mensagem pública não deve expor detalhes internos"
        );
    }
}
