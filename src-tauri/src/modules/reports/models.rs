/// Módulo de Compatibilidade de Modelos de Relatórios e Documentos.
///
/// Todos os modelos documentais canônicos estão centralizados no domínio
/// `crate::modules::documents::models`. Este módulo reexporta publicamente
/// esses tipos para preservar total compatibilidade retroativa com os
/// componentes e consumidores existentes.
pub use crate::modules::documents::models::{
    CessaoPossePayload, CitizenLedgerPayload, InvoiceReportItem, InvoiceReportPayload,
    RealEstateReconciliationPayload,
};

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

        let payload: CitizenLedgerPayload = serde_json::from_value(value)
            .expect("CitizenLedgerPayload deve aceitar o contrato válido");

        assert_eq!(payload.associate_id.as_deref(), Some("ASSOC123"));

        assert_eq!(payload.data["meta"]["reference_period"], "2026-10");
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
            serde_json::from_value(value).expect("associate_id deve poder estar ausente");

        assert_eq!(payload.associate_id, None);
    }

    #[test]
    fn test_invoice_report_payload_deserialization() {
        let payload: InvoiceReportPayload = serde_json::from_value(sample_invoice_payload_json())
            .expect("InvoiceReportPayload deve aceitar o contrato válido");

        assert_eq!(payload.id, "INV-2023-001");
        assert_eq!(payload.items.len(), 1);
        assert_eq!(payload.items[0].total, 5000.0);
        assert_eq!(payload.amount, 5000.0);

        assert_eq!(
            payload.member_email.as_deref(),
            Some("andressa.ferreira@asppibra.org.br")
        );

        assert_eq!(payload.member_address, None);
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
            serde_json::from_value(value).expect("Campos opcionais podem estar ausentes");

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

        let result = serde_json::from_value::<InvoiceReportPayload>(value);

        assert!(
            result.is_err(),
            "A ausência de campos obrigatórios deve ser rejeitada"
        );
    }

    #[test]
    fn test_invoice_report_payload_preserves_serialized_contract() {
        let payload: InvoiceReportPayload = serde_json::from_value(sample_invoice_payload_json())
            .expect("Fixture deve ser desserializado");

        let serialized =
            serde_json::to_value(&payload).expect("InvoiceReportPayload deve ser serializável");

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
