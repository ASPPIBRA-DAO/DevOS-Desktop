use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CitizenLedgerPayload {
    pub associate_id: Option<String>,
    pub data: serde_json::Value,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InvoiceReportItem {
    pub id: String,
    pub description: String,
    pub service: Option<String>,
    pub quantity: f64,
    pub price: f64,
    pub total: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
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

#[cfg(test)]
pub mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_citizen_ledger_payload_serialization() {
        let val = json!({
            "associate_id": "ASSOC123",
            "data": {
                "meta": { "reference_period": "2026-10" }
            }
        });
        let payload: Result<CitizenLedgerPayload, _> = serde_json::from_value(val);
        assert!(
            payload.is_ok(),
            "Falha na deserializacao de CitizenLedgerPayload"
        );
        let p = payload.unwrap();
        assert_eq!(p.associate_id, Some("ASSOC123".to_string()));
    }

    #[test]
    fn test_invoice_report_payload_serialization() {
        let val = json!({
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
        });
        let payload: Result<InvoiceReportPayload, _> = serde_json::from_value(val);
        assert!(
            payload.is_ok(),
            "Falha na deserializacao de InvoiceReportPayload"
        );
        let p = payload.unwrap();
        assert_eq!(p.id, "INV-2023-001");
        assert_eq!(p.items.len(), 1);
        assert_eq!(p.items[0].total, 5000.0);
    }
}
