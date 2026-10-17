use serde::Deserialize;

use crate::monitoring::rpc_client::{EvmRpcClient, WalletBalanceReport};

#[derive(Debug, Deserialize)]
pub struct WalletBalanceQuery {
    pub address: String,
    pub network: String,
    pub token_symbol: Option<String>,
}

#[tauri::command]
pub async fn fetch_wallet_balance(
    address: String,
    network: String,
    token_symbol: Option<String>,
) -> Result<WalletBalanceReport, String> {
    Ok(EvmRpcClient::fetch_balance(&address, &network, token_symbol.as_deref()).await)
}

#[tauri::command]
pub async fn batch_fetch_wallet_balances(
    wallets: Vec<WalletBalanceQuery>,
) -> Result<Vec<WalletBalanceReport>, String> {
    let mut futures = Vec::with_capacity(wallets.len());
    for q in wallets {
        futures.push(tokio::spawn(async move {
            EvmRpcClient::fetch_balance(&q.address, &q.network, q.token_symbol.as_deref()).await
        }));
    }

    let mut reports = Vec::with_capacity(futures.len());
    for f in futures {
        if let Ok(report) = f.await {
            reports.push(report);
        }
    }

    Ok(reports)
}
