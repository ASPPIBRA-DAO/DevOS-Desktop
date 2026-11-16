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

    /// Contrato de Adesão e Filiação do Associado (ASPPIBRA DAO).
    ContratoAssociado,

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
            DocumentKind::ContratoAssociado => DocumentVisibility::CockpitOnly,
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
            DocumentKind::ContratoAssociado => "contrato_adesao_associado.typ",
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
            || !self
                .sha256_checksum
                .chars()
                .all(|c| matches!(c, '0'..='9' | 'a'..='f'))
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
            Some(res) => res.round_dp_with_strategy(2, RoundingStrategy::MidpointAwayFromZero),
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
            .field(
                "member_address",
                &self.member_address.as_ref().map(|_| "***"),
            )
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
                "O documento do associado (member_doc) excede o limite de 32 caracteres."
                    .to_string(),
            ));
        }
        if self.description.chars().count() > 500 {
            return Err(DocumentError::ValidationError(
                "A descrição da fatura (description) excede o limite de 500 caracteres."
                    .to_string(),
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
            && ref_month_trimmed
                .chars()
                .all(|c| c.is_ascii_digit() || c == '-')
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
                    i + 1,
                    item.id
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
        if self.document_number.chars().count() > 64 {
            return Err(DocumentError::ValidationError(
                "O número do documento (document_number) excede o limite de 64 caracteres."
                    .to_string(),
            ));
        }

        if self.auth_code.trim().is_empty() {
            return Err(DocumentError::ValidationError(
                "O código de autenticação (auth_code) não pode ser vazio.".to_string(),
            ));
        }
        if self.auth_code.chars().count() > 64 {
            return Err(DocumentError::ValidationError(
                "O código de autenticação (auth_code) excede o limite de 64 caracteres."
                    .to_string(),
            ));
        }

        match &self.data {
            serde_json::Value::Object(map) if !map.is_empty() => {
                validate_json_limits(&self.data)?;

                let mut missing_keys = Vec::new();
                for &req_key in CESSAO_REQUIRED_KEYS {
                    match map.get(req_key) {
                        Some(serde_json::Value::String(s)) if !s.trim().is_empty() => {}
                        Some(serde_json::Value::Number(_))
                            if req_key == "numeroLote" || req_key == "quadraLote" => {}
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

/// Payload estruturado para emissão de Contrato de Adesão do Associado (ASPPIBRA DAO).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ContratoAssociadoPayload {
    pub document_number: String,
    pub auth_code: String,
    pub data: serde_json::Value,
}

impl ContratoAssociadoPayload {
    pub fn validate(&self) -> Result<(), DocumentError> {
        let doc_num = self.document_number.trim();
        if doc_num.is_empty() {
            return Err(DocumentError::ValidationError(
                "O número do documento (document_number) não pode ser vazio.".to_string(),
            ));
        }
        if doc_num.len() > 64 {
            return Err(DocumentError::ValidationError(
                "O número do documento (document_number) excede o limite de 64 caracteres."
                    .to_string(),
            ));
        }

        let auth_code = self.auth_code.trim();
        if auth_code.is_empty() {
            return Err(DocumentError::ValidationError(
                "O código de autenticação (auth_code) não pode ser vazio.".to_string(),
            ));
        }
        if auth_code.len() > 64 {
            return Err(DocumentError::ValidationError(
                "O código de autenticação (auth_code) excede o limite de 64 caracteres."
                    .to_string(),
            ));
        }

        validate_json_limits(&self.data)?;

        match &self.data {
            serde_json::Value::Object(map) if !map.is_empty() => Ok(()),
            _ => Err(DocumentError::ValidationError(
                "O campo data do contrato de associado deve ser um objeto JSON não vazio."
                    .to_string(),
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
    ContratoAssociado(ContratoAssociadoPayload),
    RealEstateReconciliation(RealEstateReconciliationPayload),
}

impl DocumentRequest {
    /// Retorna o tipo documental associado à requisição.
    pub fn kind(&self) -> DocumentKind {
        match self {
            DocumentRequest::CitizenLedger(_) => DocumentKind::CitizenLedger,
            DocumentRequest::InvoiceBill(_) => DocumentKind::InvoiceBill,
            DocumentRequest::CessaoPosse(_) => DocumentKind::CessaoPosse,
            DocumentRequest::ContratoAssociado(_) => DocumentKind::ContratoAssociado,
            DocumentRequest::RealEstateReconciliation(_) => DocumentKind::RealEstateReconciliation,
        }
    }

    /// Executa a validação estrutural do payload específico do modelo documental.
    pub fn validate(&self) -> Result<(), DocumentError> {
        match self {
            DocumentRequest::CessaoPosse(payload) => payload.validate(),
            DocumentRequest::ContratoAssociado(payload) => payload.validate(),
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
                        "Campo obrigatório ausente ou vazio: 'data.meta.reference_period'."
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
    fn application_edition_try_from_bundle_identifier_fail_closed() {
        assert_eq!(
            ApplicationEdition::try_from_bundle_identifier("br.aspp.devos.cockpit").unwrap(),
            ApplicationEdition::Cockpit
        );
        assert_eq!(
            ApplicationEdition::try_from_bundle_identifier("br.aspp.devos.node").unwrap(),
            ApplicationEdition::Node
        );
        assert!(matches!(
            ApplicationEdition::try_from_bundle_identifier("qualquer.outro.id"),
            Err(DocumentError::UnauthorizedScope(_))
        ));
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
            "data": {
                "cedenteNome": "João Silva",
                "cedenteCpf": "111.222.333-44",
                "cedenteNacionalidade": "Brasileiro",
                "cedenteEstadoCivil": "Casado",
                "cedenteEndereco": "Rua das Flores, 100",
                "cessionarioNome": "Maria Santos",
                "cessionarioCpf": "555.666.777-88",
                "cessionarioNacionalidade": "Brasileira",
                "cessionarioEstadoCivil": "Solteira",
                "cessionarioEndereco": "Avenida Central, 200",
                "numeroLote": "12",
                "quadraLote": "34"
            }
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
            status: InvoiceStatus::Pending,
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
        assert!(
            DocumentRequest::InvoiceBill(base_invoice.clone())
                .validate()
                .is_ok()
        );

        // 2. Valor zero -> OK (com item gratuito coerente)
        let mut zero_invoice = base_invoice.clone();
        zero_invoice.amount = dec!(0.00);
        zero_invoice.items[0].price = dec!(0.00);
        zero_invoice.items[0].total = dec!(0.00);
        assert!(
            DocumentRequest::InvoiceBill(zero_invoice)
                .validate()
                .is_ok()
        );

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
        assert!(
            DocumentRequest::InvoiceBill(zero_discount)
                .validate()
                .is_ok()
        );
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
            status: InvoiceStatus::Pending,
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
        assert_eq!(base_invoice.final_total().unwrap(), dec!(100.00));

        // 2. Com tributos
        let mut with_taxes = base_invoice.clone();
        with_taxes.taxes = Some(dec!(15.50));
        assert!(with_taxes.validate().is_ok());
        assert_eq!(with_taxes.final_total().unwrap(), dec!(115.50));

        // 3. Com desconto
        let mut with_discount = base_invoice.clone();
        with_discount.discount = Some(dec!(20.00));
        assert!(with_discount.validate().is_ok());
        assert_eq!(with_discount.final_total().unwrap(), dec!(80.00));

        // 4. Com tributos e desconto
        let mut with_taxes_and_discount = base_invoice.clone();
        with_taxes_and_discount.taxes = Some(dec!(15.50));
        with_taxes_and_discount.discount = Some(dec!(20.00));
        assert!(with_taxes_and_discount.validate().is_ok());
        assert_eq!(with_taxes_and_discount.final_total().unwrap(), dec!(95.50));

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
            status: InvoiceStatus::Pending,
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
        assert_eq!(exact_decimal_invoice.final_total().unwrap(), dec!(0.30));
    }

    #[test]
    fn test_ledger_and_reconciliation_validation() {
        let valid_ledger = DocumentRequest::CitizenLedger(CitizenLedgerPayload {
            associate_id: Some("ASSOC-01".to_string()),
            data: json!({
                "associate": { "id": "ASSOC-01" },
                "meta": { "reference_period": "2026-10" }
            }),
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
                data: json!({
                    "generatedAt": "2026-11-15T12:00:00Z",
                    "lots": []
                }),
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
            "settled_date": "2026-10-28",
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
            status: InvoiceStatus::Pending,
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
