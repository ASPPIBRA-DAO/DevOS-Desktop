use app_lib::reports::engine::{compile_citizen_ledger_pdf, compile_invoice_pdf};
use app_lib::reports::models::{CitizenLedgerPayload, InvoiceReportItem, InvoiceReportPayload};
use serde_json::json;
use std::fs;
use std::path::Path;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let output_dir = std::env::temp_dir().join("pdf_previews");
    fs::create_dir_all(&output_dir)?;

    // 1. Compilar Extrato do Cidadão (Citizen Ledger)
    let citizen_payload = CitizenLedgerPayload {
        associate_id: Some("ASSOC-2026-7788".to_string()),
        data: json!({
            "meta": {
                "generated_at": "29/10/2026 14:00 UTC",
                "reference_period": "2026-10",
                "audit_hash": "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b"
            },
            "associate": {
                "id": "1042",
                "name": "Dr. Roberto Mendes da Silveira",
                "cpf": "000.000.000-00",
                "email": "associado@example.invalid",
                "avatar_letter": "R",
                "address_line1": "Av. Brasil Central, 4500 - Bloco A, Sala 802",
                "address_line2": "Centro Executivo, Rio de Janeiro - RJ, 20000-000"
            },
            "summary": {
                "total_contracted": "120.000,00",
                "total_paid": "75.000,00",
                "outstanding_balance": "45.000,00"
            },
            "transactions": [
                {
                    "date": "10/10/2026",
                    "counterparty": "ASPPIBRA Tesouraria Descentralizada",
                    "origin": "Conta Custódia Vault D1",
                    "destination": "Pool de Liquidez Associativa",
                    "amount": "25.000,00",
                    "direction": "inbound",
                    "status_label": "Liquidado em Bloco",
                    "status_variant": "confirmed"
                },
                {
                    "date": "18/10/2026",
                    "counterparty": "Fornecedor Infraestrutura DePIN",
                    "origin": "Pool Operacional",
                    "destination": "Hardware Node Enclave",
                    "amount": "15.000,00",
                    "direction": "outbound",
                    "status_label": "Executado",
                    "status_variant": "danger"
                },
                {
                    "date": "25/10/2026",
                    "counterparty": "Cota de Participação DAO #88",
                    "origin": "Chave PIX / D1 Transfer",
                    "destination": "Conta Custódia Vault D1",
                    "amount": "35.000,00",
                    "direction": "inbound",
                    "status_label": "Confirmado On-Chain",
                    "status_variant": "confirmed"
                }
            ]
        }),
    };

    println!("Compilando Extrato do Cidadão via Typst...");
    let citizen_pdf_bytes = compile_citizen_ledger_pdf(&citizen_payload)
        .map_err(|e| format!("Erro ao compilar extrato: {e}"))?;
    
    let citizen_pdf_path = output_dir.join("extrato_citizen_ledger_preview.pdf");
    fs::write(&citizen_pdf_path, &citizen_pdf_bytes)?;
    println!("Extrato salvo em: {}", citizen_pdf_path.display());

    // 2. Compilar Fatura / Cobrança Associativa (Invoice Bill)
    let invoice_payload = InvoiceReportPayload {
        id: "FAT-2026-ASP-0042".to_string(),
        member_name: "Dr. Roberto Mendes da Silveira".to_string(),
        member_doc: "000.000.000-00".to_string(),
        member_email: Some("associado@example.invalid".to_string()),
        member_address: Some("Av. Brasil Central, 4500 - Rio de Janeiro, RJ".to_string()),
        description: "Mensalidade e Custódia de Ativos Descentralizados - Ciclo 2026-10".to_string(),
        reference_month: "2026-10".to_string(),
        amount: 8750.0,
        due_date: "2026-11-10".to_string(),
        settled_date: Some("2026-10-28".to_string()),
        payment_method: "Pix Dinâmico / Protocolo D1".to_string(),
        status: "paid".to_string(),
        items: vec![
            InvoiceReportItem {
                id: "ITM-01".to_string(),
                description: "Cota de Participação e Governança DAO".to_string(),
                service: Some("Governança Associativa".to_string()),
                quantity: 1.0,
                price: 5000.0,
                total: 5000.0,
            },
            InvoiceReportItem {
                id: "ITM-02".to_string(),
                description: "Taxa de Custódia e Monitoramento Vault DePIN".to_string(),
                service: Some("Segurança Criptográfica Enclave".to_string()),
                quantity: 1.0,
                price: 3750.0,
                total: 3750.0,
            },
        ],
        taxes: Some(0.0),
        discount: Some(0.0),
        d1_protocol: Some("0x89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567::FAT-2026-ASP-0042".to_string()),
    };

    println!("Compilando Fatura / Cobrança via Typst...");
    let invoice_pdf_bytes = compile_invoice_pdf(&invoice_payload)
        .map_err(|e| format!("Erro ao compilar fatura: {e}"))?;
    
    let invoice_pdf_path = output_dir.join("fatura_associativa_preview.pdf");
    fs::write(&invoice_pdf_path, &invoice_pdf_bytes)?;
    println!("Fatura salva em: {}", invoice_pdf_path.display());

    Ok(())
}
