use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
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
            Self::UnsupportedDocumentType(_) => "O tipo de documento solicitado não é suportado.",
            Self::SerializationError(_) => "Não foi possível preparar os dados do documento.",
            Self::CompilationError(_) => "Não foi possível gerar o documento.",
            Self::ValidationError(_) => "Os dados fornecidos para o documento são inválidos.",
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
                "Identificador de aplicação não homologado: '{other}'. Operações documentais bloqueadas por segurança."
            ))),
        }
    }

    /// Resolve a edição a partir do bundle identifier (compatibilidade retroativa).
    pub fn from_bundle_identifier(identifier: &str) -> Self {
        Self::try_from_bundle_identifier(identifier).unwrap_or(Self::Node)
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

    /// Resolve o perfil de visibilidade a partir do bundle identifier do Tauri.
    pub fn from_app_identifier(identifier: &str) -> Self {
        match identifier.trim() {
            COCKPIT_APP_IDENTIFIER => Self::CockpitOnly,
            NODE_APP_IDENTIFIER => Self::NodeOnly,
            _ => Self::Uninitialized, // Fail-closed em vez de fallback permissivo
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

/// Saída padronizada da geração documental.
///
/// `pdf_bytes` contém os bytes do documento gerado encapsulados em `Arc<[u8]>`,
/// permitindo compartilhamento com zero cópia entre o pipeline de geração,
/// o visualizador interno e o store de exportação temporário.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DocumentOutput {
    pub pdf_bytes: Arc<[u8]>,
    pub metadata: DocumentMetadata,
}

/// Dados de entrada canônicos para a geração do Extrato do Cidadão.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct CitizenLedgerPayload {
    pub associate_id: Option<String>,
    pub data: serde_json::Value,
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
        if self.description.trim().is_empty() {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui descrição (description) vazia.",
                num
            )));
        }
        if self.quantity <= Decimal::ZERO {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui quantidade inválida (deve ser maior que zero).",
                num
            )));
        }
        if self.price < Decimal::ZERO {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui preço unitário inválido (não pode ser negativo).",
                num
            )));
        }
        if self.total < Decimal::ZERO {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui valor total inválido (não pode ser negativo).",
                num
            )));
        }
        let expected_total = match self.quantity.checked_mul(self.price) {
            Some(res) => res.round_dp(2),
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

/// Módulos auxiliares de serialização flexível para garantir compatibilidade com números e strings do TypeScript.
pub mod lenient_decimal {
    use rust_decimal::Decimal;
    use serde::{self, Deserialize, Deserializer, Serializer};
    use std::str::FromStr;

    pub fn serialize<S>(value: &Decimal, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        rust_decimal::serde::float::serialize(value, serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Decimal, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Deserialize)]
        #[serde(untagged)]
        enum DecimalOrNumberOrStr {
            Str(String),
            Decimal(Decimal),
            Float(f64),
            Int(i64),
        }

        match DecimalOrNumberOrStr::deserialize(deserializer)? {
            DecimalOrNumberOrStr::Decimal(d) => Ok(d),
            DecimalOrNumberOrStr::Str(s) => Decimal::from_str(s.trim()).map_err(serde::de::Error::custom),
            DecimalOrNumberOrStr::Int(i) => Ok(Decimal::from(i)),
            DecimalOrNumberOrStr::Float(f) => {
                Decimal::try_from(f).map_err(serde::de::Error::custom)
            }
        }
    }
}

pub mod lenient_decimal_option {
    use rust_decimal::Decimal;
    use serde::{self, Deserialize, Deserializer, Serializer};
    use std::str::FromStr;

    pub fn serialize<S>(value: &Option<Decimal>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        rust_decimal::serde::float_option::serialize(value, serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Option<Decimal>, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Deserialize)]
        #[serde(untagged)]
        enum DecimalOrNumberOrStr {
            None,
            Str(String),
            Decimal(Decimal),
            Float(f64),
            Int(i64),
        }

        match Option::<DecimalOrNumberOrStr>::deserialize(deserializer)? {
            None | Some(DecimalOrNumberOrStr::None) => Ok(None),
            Some(DecimalOrNumberOrStr::Decimal(d)) => Ok(Some(d)),
            Some(DecimalOrNumberOrStr::Str(s)) => {
                let trimmed = s.trim();
                if trimmed.is_empty() {
                    Ok(None)
                } else {
                    Decimal::from_str(trimmed)
                        .map(Some)
                        .map_err(serde::de::Error::custom)
                }
            }
            Some(DecimalOrNumberOrStr::Int(i)) => Ok(Some(Decimal::from(i))),
            Some(DecimalOrNumberOrStr::Float(f)) => {
                Decimal::try_from(f).map(Some).map_err(serde::de::Error::custom)
            }
        }
    }
}

/// Dados de entrada canônicos para a geração de uma fatura associativa com precisão decimal.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
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
    pub status: String,
    pub items: Vec<InvoiceReportItem>,
    #[serde(default, with = "lenient_decimal_option")]
    pub taxes: Option<Decimal>,
    #[serde(default, with = "lenient_decimal_option")]
    pub discount: Option<Decimal>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub d1_protocol: Option<String>,
}

impl InvoiceReportPayload {
    /// Calcula o valor líquido final da fatura (`amount + taxes - discount`) com arredondamento em 2 casas decimais.
    pub fn final_total(&self) -> Decimal {
        let taxes = self.taxes.unwrap_or(Decimal::ZERO);
        let discount = self.discount.unwrap_or(Decimal::ZERO);
        self.amount
            .checked_add(taxes)
            .and_then(|sum| sum.checked_sub(discount))
            .map(|final_val| final_val.round_dp(2))
            .unwrap_or((self.amount + taxes - discount).round_dp(2))
    }

    /// Valida as invariantes estruturais e numéricas da fatura antes da emissão com cálculo exato.
    pub fn validate(&self) -> Result<(), DocumentError> {
        if self.id.trim().is_empty() {
            return Err(DocumentError::ValidationError(
                "O identificador da fatura (id) não pode ser vazio.".to_string(),
            ));
        }
        if self.member_name.trim().is_empty() {
            return Err(DocumentError::ValidationError(
                "O nome do associado (member_name) não pode ser vazio.".to_string(),
            ));
        }
        if self.amount < Decimal::ZERO {
            return Err(DocumentError::ValidationError(
                "O subtotal da fatura (amount) não pode ser negativo.".to_string(),
            ));
        }
        let taxes_val = match self.taxes {
            Some(taxes) => {
                if taxes < Decimal::ZERO {
                    return Err(DocumentError::ValidationError(
                        "O valor de tributos (taxes) não pode ser negativo.".to_string(),
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
        if !self.items.is_empty() {
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
        }
        Ok(())
    }
}

/// Dados de entrada canônicos para a geração do Relatório Analítico de Reconciliação Imobiliária.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct RealEstateReconciliationPayload {
    pub data: serde_json::Value,
}

/// Dados de entrada canônicos para a geração do Contrato de Cessão de Posse.
///
/// `document_number` e `auth_code` são identificadores institucionais obrigatórios.
/// Valores padrão provisórios foram eliminados para garantir que documentos oficiais
/// nunca sejam emitidos silenciosamente com números fictícios.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct CessaoPossePayload {
    /// Número de controle ou registro oficial do documento institucional.
    pub document_number: String,

    /// Código oficial de autenticação e rastreio institucional.
    pub auth_code: String,

    /// Dados estruturados do contrato (partes, imóvel, condições, etc.).
    #[serde(default)]
    pub data: serde_json::Value,
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
                for (key, val) in map {
                    if let serde_json::Value::String(s) = val {
                        if s.trim().is_empty()
                            && (key == "cedenteNome" || key == "cessionarioNome")
                        {
                            return Err(DocumentError::ValidationError(format!(
                                "O campo essencial '{key}' do contrato de cessão de posse não pode ser vazio."
                            )));
                        }
                    }
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
                Ok(())
            }

            DocumentRequest::RealEstateReconciliation(payload) => {
                if !payload.data.is_object() {
                    return Err(DocumentError::ValidationError(
                        "Os dados da reconciliação imobiliária (data) devem ser um objeto JSON."
                            .to_string(),
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
