use serde::{Deserialize, Serialize};

/// Dados de entrada para a geração do Extrato do Cidadão.
///
/// `data` mantém a flexibilidade do contrato JSON atual. A estrutura e os
/// campos esperados pelo template devem ser validados na camada de serviço.
///
/// `associate_id` é opcional e não substitui verificações de autorização.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CitizenLedgerPayload {
    pub associate_id: Option<String>,
    pub data: serde_json::Value,
}

/// Item individual de uma fatura associativa.
///
/// Os valores numéricos preservam o contrato atual baseado em `f64`.
/// A consistência entre quantidade, preço e total deve ser verificada
/// pela camada responsável pelas regras financeiras.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InvoiceReportItem {
    /// Identificador do item.
    pub id: String,

    /// Descrição apresentada no documento.
    pub description: String,

    /// Serviço associado ao item, quando aplicável.
    pub service: Option<String>,

    /// Quantidade informada para o item.
    pub quantity: f64,

    /// Preço unitário informado para o item.
    pub price: f64,

    /// Total do item segundo os dados de origem.
    pub total: f64,
}

/// Dados de entrada para a geração de uma fatura associativa.
///
/// Este DTO define o contrato de transporte, mas não calcula nem valida
/// autonomamente os totais, tributos ou descontos.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InvoiceReportPayload {
    /// Identificador da fatura.
    pub id: String,

    /// Nome do associado.
    pub member_name: String,

    /// Documento de identificação conforme o contrato atual.
    pub member_doc: String,

    /// E-mail do associado, quando disponível.
    pub member_email: Option<String>,

    /// Endereço do associado, quando disponível.
    pub member_address: Option<String>,

    /// Descrição geral da fatura.
    pub description: String,

    /// Período de referência conforme o formato aceito pelo sistema.
    pub reference_month: String,

    /// Valor total informado para a fatura.
    ///
    /// A validação monetária e a política de arredondamento pertencem
    /// à camada responsável pelas regras financeiras.
    pub amount: f64,

    /// Data de vencimento.
    pub due_date: String,

    /// Data de liquidação, quando aplicável.
    pub settled_date: Option<String>,

    /// Método de pagamento informado.
    pub payment_method: String,

    /// Estado da fatura conforme o contrato atual.
    pub status: String,

    /// Itens incluídos na fatura.
    pub items: Vec<InvoiceReportItem>,

    /// Tributos, quando aplicáveis.
    pub taxes: Option<f64>,

    /// Desconto, quando aplicável.
    pub discount: Option<f64>,

    /// Protocolo D1 associado à fatura, quando disponível.
    pub d1_protocol: Option<String>,
}

/// Dados de entrada para a geração do Contrato de Cessão de Posse.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CessaoPossePayload {
    /// Número de controle ou registro do documento.
    #[serde(default = "default_contract_doc_number")]
    pub document_number: String,

    /// Código de autenticação / rastreio institucional.
    #[serde(default = "default_contract_auth_code")]
    pub auth_code: String,

    /// Dados estruturados ou dinâmicos do contrato (partes, imóvel, valores, etc.).
    #[serde(default)]
    pub data: serde_json::Value,
}

fn default_contract_doc_number() -> String {
    "2026-0001/CP".to_string()
}

fn default_contract_auth_code() -> String {
    "2026-X7Y9".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{json, Value};

    fn sample_invoice_payload_json() -> Value {
        json!({
            "id": "INV-2023-001",
            "member_name": "Andressa de Lima Ferreira",
            "member_doc": "CPF ***.***.780-**",
            "member_email": "andressa.ferreira@asppibra.org.br",
            "description": "Mensalidade Associativa",
            "reference_month": "2023-08",
            "amount": 5000.0,
            "due_date": "2023-08-08",
            "settled_date": "2023-08-08",
            "payment_method": "Pix Dinamico",
            "status": "paid",
            "items": [
                {
                    "id": "item-1",
                    "description": "Mensalidade Agosto",
                    "service": "Contribuicao Associativa",
                    "quantity": 1.0,
                    "price": 5000.0,
                    "total": 5000.0
                }
            ],
            "taxes": 0.0,
            "discount": 0.0,
            "d1_protocol": "D1-PROT-12345"
        })
    }

    #[test]
    fn test_citizen_ledger_payload_deserialization() {
        let value = json!({
            "associate_id": "ASSOC123",
            "data": {
                "meta": {
                    "reference_period": "2026-10"
                }
            }
        });

        let payload: CitizenLedgerPayload =
            serde_json::from_value(value)
                .expect("CitizenLedgerPayload deve aceitar o contrato válido");

        assert_eq!(
            payload.associate_id.as_deref(),
            Some("ASSOC123")
        );

        assert_eq!(
            payload.data["meta"]["reference_period"],
            "2026-10"
        );
    }

    #[test]
    fn test_citizen_ledger_payload_accepts_missing_optional_associate_id() {
        let value = json!({
            "data": {
                "meta": {
                    "reference_period": "2026-10"
                }
            }
        });

        let payload: CitizenLedgerPayload =
            serde_json::from_value(value)
                .expect("associate_id deve poder estar ausente");

        assert_eq!(payload.associate_id, None);
    }

    #[test]
    fn test_invoice_report_payload_deserialization() {
        let payload: InvoiceReportPayload =
            serde_json::from_value(sample_invoice_payload_json())
                .expect("InvoiceReportPayload deve aceitar o contrato válido");

        assert_eq!(payload.id, "INV-2023-001");
        assert_eq!(payload.items.len(), 1);
        assert_eq!(payload.items[0].total, 5000.0);
        assert_eq!(payload.amount, 5000.0);

        assert_eq!(
            payload.member_email.as_deref(),
            Some("andressa.ferreira@asppibra.org.br")
        );

        assert_eq!(
            payload.member_address,
            None
        );
    }

    #[test]
    fn test_invoice_report_payload_accepts_missing_optional_fields() {
        let mut value = sample_invoice_payload_json();

        let object = value
            .as_object_mut()
            .expect("O fixture deve representar um objeto JSON");

        object.remove("member_email");
        object.remove("member_address");
        object.remove("settled_date");
        object.remove("taxes");
        object.remove("discount");
        object.remove("d1_protocol");

        let payload: InvoiceReportPayload =
            serde_json::from_value(value)
                .expect("Campos opcionais podem estar ausentes");

        assert_eq!(payload.member_email, None);
        assert_eq!(payload.member_address, None);
        assert_eq!(payload.settled_date, None);
        assert_eq!(payload.taxes, None);
        assert_eq!(payload.discount, None);
        assert_eq!(payload.d1_protocol, None);
    }

    #[test]
    fn test_invoice_report_payload_rejects_missing_required_fields() {
        let value = json!({
            "id": "INV-2023-001"
        });

        let result =
            serde_json::from_value::<InvoiceReportPayload>(value);

        assert!(
            result.is_err(),
            "A ausência de campos obrigatórios deve ser rejeitada"
        );
    }

    #[test]
    fn test_invoice_report_payload_preserves_serialized_contract() {
        let payload: InvoiceReportPayload =
            serde_json::from_value(sample_invoice_payload_json())
                .expect("Fixture deve ser desserializado");

        let serialized = serde_json::to_value(&payload)
            .expect("InvoiceReportPayload deve ser serializável");

        assert_eq!(serialized["id"], "INV-2023-001");
        assert_eq!(serialized["amount"], 5000.0);
        assert_eq!(serialized["status"], "paid");

        assert!(
            serialized["items"].is_array(),
            "O campo items deve continuar sendo um array"
        );

        assert_eq!(serialized["items"][0]["id"], "item-1");
        assert_eq!(serialized["member_address"], Value::Null);
    }
}
