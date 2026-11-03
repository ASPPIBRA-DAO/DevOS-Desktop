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
    /// Declara o escopo necessário para o tipo documental.
    ///
    /// Este método descreve a política declarada pelo modelo.
    /// A autorização efetiva deve ser aplicada na camada responsável
    /// pelo controle de acesso.
    pub fn required_scope(&self) -> DocumentScope {
        match self {
            DocumentKind::CitizenLedger => DocumentScope::Universal,
            DocumentKind::InvoiceBill => DocumentScope::Universal,
            DocumentKind::CessaoPosse => DocumentScope::CockpitOnly,
            DocumentKind::RealEstateReconciliation => DocumentScope::CockpitOnly,
        }
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

impl DocumentScope {
    /// Resolve o escopo documental da edição ativa a partir do `identifier` da aplicação Tauri.
    ///
    /// Caso o identificador não corresponda ao Cockpit (`br.aspp.devos.cockpit`),
    /// aplica por segurança o perfil restrito `NodeOnly` (princípio do menor privilégio).
    pub fn from_app_identifier(identifier: &str) -> Self {
        match identifier.trim() {
            COCKPIT_APP_IDENTIFIER => Self::CockpitOnly,
            NODE_APP_IDENTIFIER => Self::NodeOnly,
            _ => Self::NodeOnly,
        }
    }
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

/// Dados de entrada canônicos para a geração do Extrato do Cidadão.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct CitizenLedgerPayload {
    pub associate_id: Option<String>,
    pub data: serde_json::Value,
}

/// Item individual de uma fatura associativa.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct InvoiceReportItem {
    pub id: String,
    pub description: String,
    pub service: Option<String>,
    pub quantity: f64,
    pub price: f64,
    pub total: f64,
}

impl InvoiceReportItem {
    /// Valida as invariantes estruturais e numéricas do item da fatura.
    ///
    /// Garante que:
    /// - Identificador e descrição não sejam vazios.
    /// - `quantity` seja estritamente finito e maior que zero (rejeita 0.0, negativos, NaN e ±Infinito).
    /// - `price` seja finito e não negativo (rejeita negativos, NaN e ±Infinito).
    /// - `total` seja finito e não negativo (rejeita negativos, NaN e ±Infinito).
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
        if !self.quantity.is_finite() || self.quantity <= 0.0 {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui quantidade inválida (deve ser finita e maior que zero).",
                num
            )));
        }
        if !self.price.is_finite() || self.price < 0.0 {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui preço unitário inválido (deve ser finito e não negativo).",
                num
            )));
        }
        if !self.total.is_finite() || self.total < 0.0 {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui valor total inválido (deve ser finito e não negativo).",
                num
            )));
        }
        let expected_total = self.quantity * self.price;
        if (expected_total - self.total).abs() > 1e-2 {
            return Err(DocumentError::ValidationError(format!(
                "O item {} da fatura possui total ({:.2}) divergente de quantidade × preço unitário ({:.2}).",
                num, self.total, expected_total
            )));
        }
        Ok(())
    }
}

/// Dados de entrada canônicos para a geração de uma fatura associativa.
///
/// Semântica financeira oficial:
/// - `amount`: subtotal bruto da fatura (soma dos totais dos itens quando `items` não está vazio).
/// - `taxes`: tributos/taxas adicionais opcionais (>= 0).
/// - `discount`: desconto opcional concedido (>= 0 e <= `amount + taxes`).
/// - `final_total()`: valor líquido final da fatura (`amount + taxes - discount`).
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct InvoiceReportPayload {
    pub id: String,
    pub member_name: String,
    pub member_doc: String,
    pub member_email: Option<String>,
    pub member_address: Option<String>,
    pub description: String,
    pub reference_month: String,
    pub amount: f64,
    pub due_date: String,
    pub settled_date: Option<String>,
    pub payment_method: String,
    pub status: String,
    pub items: Vec<InvoiceReportItem>,
    pub taxes: Option<f64>,
    pub discount: Option<f64>,
    pub d1_protocol: Option<String>,
}

impl InvoiceReportPayload {
    /// Calcula o valor líquido final da fatura (`amount + taxes - discount`), arredondado em 2 casas decimais.
    pub fn final_total(&self) -> f64 {
        let taxes = self.taxes.unwrap_or(0.0);
        let discount = self.discount.unwrap_or(0.0);
        ((self.amount + taxes - discount) * 100.0).round() / 100.0
    }

    /// Valida as invariantes estruturais e numéricas da fatura antes da emissão.
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
        if !self.amount.is_finite() || self.amount < 0.0 {
            return Err(DocumentError::ValidationError(
                "O subtotal da fatura (amount) deve ser um número finito e não negativo."
                    .to_string(),
            ));
        }
        let taxes_val = match self.taxes {
            Some(taxes) => {
                if !taxes.is_finite() || taxes < 0.0 {
                    return Err(DocumentError::ValidationError(
                        "O valor de tributos (taxes) deve ser um número finito e não negativo."
                            .to_string(),
                    ));
                }
                taxes
            }
            None => 0.0,
        };
        let discount_val = match self.discount {
            Some(discount) => {
                if !discount.is_finite() || discount < 0.0 {
                    return Err(DocumentError::ValidationError(
                        "O valor de desconto (discount) deve ser um número finito e não negativo."
                            .to_string(),
                    ));
                }
                discount
            }
            None => 0.0,
        };
        if discount_val - (self.amount + taxes_val) > 1e-2 {
            return Err(DocumentError::ValidationError(
                "O valor de desconto (discount) não pode exceder o subtotal acrescido de tributos."
                    .to_string(),
            ));
        }
        for (i, item) in self.items.iter().enumerate() {
            item.validate(i)?;
        }
        if !self.items.is_empty() {
            let items_sum: f64 = self.items.iter().map(|item| item.total).sum();
            if (items_sum - self.amount).abs() > 1e-2 {
                return Err(DocumentError::ValidationError(format!(
                    "A soma dos itens da fatura ({:.2}) diverge do subtotal informado em amount ({:.2}).",
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

        if !self.data.is_null() && !self.data.is_object() {
            return Err(DocumentError::ValidationError(
                "O campo data do contrato de cessão de posse deve ser um objeto JSON.".to_string(),
            ));
        }

        Ok(())
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
            DocumentKind::CessaoPosse.required_scope(),
            DocumentScope::CockpitOnly
        );

        assert_eq!(
            DocumentKind::RealEstateReconciliation.required_scope(),
            DocumentScope::CockpitOnly
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
    fn document_scope_resolves_from_app_identifier() {
        assert_eq!(
            DocumentScope::from_app_identifier("br.aspp.devos.cockpit"),
            DocumentScope::CockpitOnly
        );
        assert_eq!(
            DocumentScope::from_app_identifier("br.aspp.devos.node"),
            DocumentScope::NodeOnly
        );
        assert_eq!(
            DocumentScope::from_app_identifier("unknown.edition"),
            DocumentScope::NodeOnly
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
            "data": {}
        });
        assert!(serde_json::from_value::<CessaoPossePayload>(missing_doc_num).is_err());

        // Deserialização rejeita ausência de auth_code
        let missing_auth = json!({
            "document_number": "2026-0001/CP",
            "data": {}
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

        let mut invalid_data = valid_payload;
        invalid_data.data = json!("não é objeto");
        assert!(matches!(
            invalid_data.validate(),
            Err(DocumentError::ValidationError(_))
        ));
    }

    #[test]
    fn test_invoice_monetary_validation_handles_finite_and_special_values() {
        let base_invoice = InvoiceReportPayload {
            id: "INV-01".to_string(),
            member_name: "Associado".to_string(),
            member_doc: "000".to_string(),
            member_email: None,
            member_address: None,
            description: "Desc".to_string(),
            reference_month: "2026-10".to_string(),
            amount: 100.0,
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "paid".to_string(),
            items: vec![InvoiceReportItem {
                id: "it-1".to_string(),
                description: "Item 1".to_string(),
                service: None,
                quantity: 1.0,
                price: 100.0,
                total: 100.0,
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
        zero_invoice.amount = 0.0;
        zero_invoice.items[0].price = 0.0;
        zero_invoice.items[0].total = 0.0;
        assert!(DocumentRequest::InvoiceBill(zero_invoice)
            .validate()
            .is_ok());

        // 3. Valor negativo -> Err
        let mut negative_invoice = base_invoice.clone();
        negative_invoice.amount = -10.0;
        assert!(matches!(
            DocumentRequest::InvoiceBill(negative_invoice).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 4. NaN -> Err
        let mut nan_invoice = base_invoice.clone();
        nan_invoice.amount = f64::NAN;
        assert!(matches!(
            DocumentRequest::InvoiceBill(nan_invoice).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 5. Infinito Positivo -> Err
        let mut pos_inf_invoice = base_invoice.clone();
        pos_inf_invoice.amount = f64::INFINITY;
        assert!(matches!(
            DocumentRequest::InvoiceBill(pos_inf_invoice).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 6. Infinito Negativo -> Err
        let mut neg_inf_invoice = base_invoice.clone();
        neg_inf_invoice.amount = f64::NEG_INFINITY;
        assert!(matches!(
            DocumentRequest::InvoiceBill(neg_inf_invoice).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 7. Item com quantidade negativa ou zero -> Err
        let mut invalid_item_qty = base_invoice.clone();
        invalid_item_qty.items[0].quantity = 0.0;
        assert!(matches!(
            DocumentRequest::InvoiceBill(invalid_item_qty).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 8. Item com quantidade NaN ou infinito -> Err
        let mut nan_item_qty = base_invoice.clone();
        nan_item_qty.items[0].quantity = f64::NAN;
        assert!(matches!(
            DocumentRequest::InvoiceBill(nan_item_qty).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut inf_item_qty = base_invoice.clone();
        inf_item_qty.items[0].quantity = f64::INFINITY;
        assert!(matches!(
            DocumentRequest::InvoiceBill(inf_item_qty).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut neg_inf_item_qty = base_invoice.clone();
        neg_inf_item_qty.items[0].quantity = f64::NEG_INFINITY;
        assert!(matches!(
            DocumentRequest::InvoiceBill(neg_inf_item_qty).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 9. Item com preço unitário negativo ou NaN ou infinito -> Err
        let mut invalid_item_price = base_invoice.clone();
        invalid_item_price.items[0].price = -5.0;
        assert!(matches!(
            DocumentRequest::InvoiceBill(invalid_item_price).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut nan_item_price = base_invoice.clone();
        nan_item_price.items[0].price = f64::NAN;
        assert!(matches!(
            DocumentRequest::InvoiceBill(nan_item_price).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut inf_item_price = base_invoice.clone();
        inf_item_price.items[0].price = f64::INFINITY;
        assert!(matches!(
            DocumentRequest::InvoiceBill(inf_item_price).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut neg_inf_item_price = base_invoice.clone();
        neg_inf_item_price.items[0].price = f64::NEG_INFINITY;
        assert!(matches!(
            DocumentRequest::InvoiceBill(neg_inf_item_price).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 10. Item com total negativo, NaN ou infinito -> Err
        let mut invalid_item_total = base_invoice.clone();
        invalid_item_total.items[0].total = -1.0;
        assert!(matches!(
            DocumentRequest::InvoiceBill(invalid_item_total).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut nan_item_total = base_invoice.clone();
        nan_item_total.items[0].total = f64::NAN;
        assert!(matches!(
            DocumentRequest::InvoiceBill(nan_item_total).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut inf_item_total = base_invoice.clone();
        inf_item_total.items[0].total = f64::INFINITY;
        assert!(matches!(
            DocumentRequest::InvoiceBill(inf_item_total).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut neg_inf_item_total = base_invoice.clone();
        neg_inf_item_total.items[0].total = f64::NEG_INFINITY;
        assert!(matches!(
            DocumentRequest::InvoiceBill(neg_inf_item_total).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 11. Tributos opcionais com valor negativo ou não-finito -> Err
        let mut invalid_taxes = base_invoice.clone();
        invalid_taxes.taxes = Some(-10.0);
        assert!(matches!(
            DocumentRequest::InvoiceBill(invalid_taxes).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut nan_taxes = base_invoice.clone();
        nan_taxes.taxes = Some(f64::NAN);
        assert!(matches!(
            DocumentRequest::InvoiceBill(nan_taxes).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut inf_taxes = base_invoice.clone();
        inf_taxes.taxes = Some(f64::INFINITY);
        assert!(matches!(
            DocumentRequest::InvoiceBill(inf_taxes).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut neg_inf_taxes = base_invoice.clone();
        neg_inf_taxes.taxes = Some(f64::NEG_INFINITY);
        assert!(matches!(
            DocumentRequest::InvoiceBill(neg_inf_taxes).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut zero_taxes = base_invoice.clone();
        zero_taxes.taxes = Some(0.0);
        assert!(DocumentRequest::InvoiceBill(zero_taxes).validate().is_ok());

        // 12. Desconto opcional com valor negativo ou não-finito -> Err
        let mut invalid_discount = base_invoice.clone();
        invalid_discount.discount = Some(-5.0);
        assert!(matches!(
            DocumentRequest::InvoiceBill(invalid_discount).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut nan_discount = base_invoice.clone();
        nan_discount.discount = Some(f64::NAN);
        assert!(matches!(
            DocumentRequest::InvoiceBill(nan_discount).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut inf_discount = base_invoice.clone();
        inf_discount.discount = Some(f64::INFINITY);
        assert!(matches!(
            DocumentRequest::InvoiceBill(inf_discount).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut neg_inf_discount = base_invoice.clone();
        neg_inf_discount.discount = Some(f64::NEG_INFINITY);
        assert!(matches!(
            DocumentRequest::InvoiceBill(neg_inf_discount).validate(),
            Err(DocumentError::ValidationError(_))
        ));

        let mut zero_discount = base_invoice;
        zero_discount.discount = Some(0.0);
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
            quantity: 2.0,
            price: 50.0,
            total: 100.0,
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

        // 4. Quantidade: 0.0, negativo, NaN, +Inf, -Inf -> Err
        for invalid_qty in [
            0.0,
            -1.0,
            -0.0001,
            f64::NAN,
            f64::INFINITY,
            f64::NEG_INFINITY,
        ] {
            let mut item = base_item.clone();
            item.quantity = invalid_qty;
            assert!(
                matches!(item.validate(0), Err(DocumentError::ValidationError(_))),
                "Deveria rejeitar quantity: {invalid_qty}"
            );
        }

        // 5. Preço unitário: negativo, NaN, +Inf, -Inf -> Err
        for invalid_price in [-1.0, -0.0001, f64::NAN, f64::INFINITY, f64::NEG_INFINITY] {
            let mut item = base_item.clone();
            item.price = invalid_price;
            assert!(
                matches!(item.validate(0), Err(DocumentError::ValidationError(_))),
                "Deveria rejeitar price: {invalid_price}"
            );
        }
        // Preço e total zero -> Ok (itens gratuitos ou cortesias institucionais)
        let mut zero_price = base_item.clone();
        zero_price.price = 0.0;
        zero_price.total = 0.0;
        assert!(zero_price.validate(0).is_ok());

        // 6. Total: negativo, NaN, +Inf, -Inf -> Err
        for invalid_total in [-1.0, -0.0001, f64::NAN, f64::INFINITY, f64::NEG_INFINITY] {
            let mut item = base_item.clone();
            item.total = invalid_total;
            assert!(
                matches!(item.validate(0), Err(DocumentError::ValidationError(_))),
                "Deveria rejeitar total: {invalid_total}"
            );
        }
        // Total divergente de quantity * price -> Err
        let mut mismatched_total = base_item;
        mismatched_total.total = 99.0;
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
            amount: 100.0,
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![
                InvoiceReportItem {
                    id: "it-1".to_string(),
                    description: "Item A".to_string(),
                    service: None,
                    quantity: 1.0,
                    price: 60.0,
                    total: 60.0,
                },
                InvoiceReportItem {
                    id: "it-2".to_string(),
                    description: "Item B".to_string(),
                    service: None,
                    quantity: 2.0,
                    price: 20.0,
                    total: 40.0,
                },
            ],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        // 1. Sem tributos e sem desconto
        assert!(base_invoice.validate().is_ok());
        assert_eq!(base_invoice.final_total(), 100.0);

        // 2. Com tributos
        let mut with_taxes = base_invoice.clone();
        with_taxes.taxes = Some(15.5);
        assert!(with_taxes.validate().is_ok());
        assert_eq!(with_taxes.final_total(), 115.5);

        // 3. Com desconto
        let mut with_discount = base_invoice.clone();
        with_discount.discount = Some(20.0);
        assert!(with_discount.validate().is_ok());
        assert_eq!(with_discount.final_total(), 80.0);

        // 4. Com tributos e desconto
        let mut with_taxes_and_discount = base_invoice.clone();
        with_taxes_and_discount.taxes = Some(15.5);
        with_taxes_and_discount.discount = Some(20.0);
        assert!(with_taxes_and_discount.validate().is_ok());
        assert_eq!(with_taxes_and_discount.final_total(), 95.5);

        // 5. Desconto excessivo (> amount + taxes) -> ValidationError
        let mut excessive_discount = base_invoice.clone();
        excessive_discount.taxes = Some(10.0);
        excessive_discount.discount = Some(115.0);
        assert!(matches!(
            excessive_discount.validate(),
            Err(DocumentError::ValidationError(_))
        ));

        // 6. Soma dos itens divergente de amount -> ValidationError
        let mut mismatched_subtotal = base_invoice;
        mismatched_subtotal.amount = 150.0;
        assert!(matches!(
            mismatched_subtotal.validate(),
            Err(DocumentError::ValidationError(_))
        ));
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
}
