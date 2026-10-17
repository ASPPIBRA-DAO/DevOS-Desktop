use std::time::Duration;
use serde::{Deserialize, Serialize};

use crate::wallets::address::is_valid_evm_address;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum BalanceQueryStatus {
    Confirmed,
    Unavailable,
    InvalidAddress,
    NetworkUnsupported,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenContract {
    pub symbol: String,
    pub contract_address: String,
    pub decimals: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    pub name: String,
    pub chain_id: u64,
    pub rpc_url: String,
    pub native_symbol: String,
    pub native_decimals: u8,
    pub supported_tokens: Vec<TokenContract>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletBalanceReport {
    pub address: String,
    pub network: String,
    pub status: BalanceQueryStatus,
    pub raw_balance_hex: Option<String>,
    pub formatted_balance: String,
    pub symbol: String,
    pub transaction_count: Option<u64>,
    pub error_message: Option<String>,
    pub last_updated_at: String,
}

#[derive(Serialize)]
struct JsonRpcRequest<'a> {
    jsonrpc: &'static str,
    method: &'a str,
    params: serde_json::Value,
    id: u64,
}

#[derive(Deserialize)]
struct JsonRpcResponse {
    result: Option<String>,
    error: Option<serde_json::Value>,
}

pub struct EvmRpcClient;

impl EvmRpcClient {
    pub fn get_network_config(network_name: &str) -> Option<NetworkConfig> {
        let net = network_name.to_lowercase();
        if net.contains("arbitrum") {
            Some(NetworkConfig {
                name: "Arbitrum One".to_string(),
                chain_id: 42161,
                rpc_url: "https://arb1.arbitrum.io/rpc".to_string(),
                native_symbol: "ETH".to_string(),
                native_decimals: 18,
                supported_tokens: vec![
                    TokenContract {
                        symbol: "USDT".to_string(),
                        contract_address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9".to_string(),
                        decimals: 6,
                    },
                    TokenContract {
                        symbol: "USDC".to_string(),
                        contract_address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831".to_string(),
                        decimals: 6,
                    },
                ],
            })
        } else if net.contains("polygon") {
            Some(NetworkConfig {
                name: "Polygon".to_string(),
                chain_id: 137,
                rpc_url: "https://polygon-rpc.com".to_string(),
                native_symbol: "POL".to_string(),
                native_decimals: 18,
                supported_tokens: vec![
                    TokenContract {
                        symbol: "USDC".to_string(),
                        contract_address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359".to_string(),
                        decimals: 6,
                    },
                    TokenContract {
                        symbol: "USDT".to_string(),
                        contract_address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F".to_string(),
                        decimals: 6,
                    },
                ],
            })
        } else if net.contains("bnb") || net.contains("bsc") {
            Some(NetworkConfig {
                name: "BNB Chain".to_string(),
                chain_id: 56,
                rpc_url: "https://bsc-dataseed.binance.org".to_string(),
                native_symbol: "BNB".to_string(),
                native_decimals: 18,
                supported_tokens: vec![
                    TokenContract {
                        symbol: "USDT".to_string(),
                        contract_address: "0x55d398326f99059fF775485246999027B3197955".to_string(),
                        decimals: 18,
                    },
                    TokenContract {
                        symbol: "USDC".to_string(),
                        contract_address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d".to_string(),
                        decimals: 18,
                    },
                ],
            })
        } else if net.contains("ethereum") || net.contains("eth") {
            Some(NetworkConfig {
                name: "Ethereum".to_string(),
                chain_id: 1,
                rpc_url: "https://cloudflare-eth.com".to_string(),
                native_symbol: "ETH".to_string(),
                native_decimals: 18,
                supported_tokens: vec![
                    TokenContract {
                        symbol: "USDT".to_string(),
                        contract_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7".to_string(),
                        decimals: 6,
                    },
                    TokenContract {
                        symbol: "USDC".to_string(),
                        contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48".to_string(),
                        decimals: 6,
                    },
                ],
            })
        } else {
            None
        }
    }

    /// Formata valor em wei/hex para string legível com casas decimais apropriadas
    pub fn format_raw_balance(hex_value: &str, decimals: u8, symbol: &str) -> String {
        let clean = hex_value.strip_prefix("0x").unwrap_or(hex_value);
        if clean.is_empty() || clean == "0" {
            return format!("0.00 {}", symbol);
        }

        match u128::from_str_radix(clean, 16) {
            Ok(wei) => {
                let divisor = 10u128.pow(decimals as u32);
                let integer_part = wei / divisor;
                let remainder = wei % divisor;

                let frac_str = format!("{:0width$}", remainder, width = decimals as usize);
                let frac_trimmed = if frac_str.len() >= 4 {
                    &frac_str[..4]
                } else {
                    &frac_str
                };

                format!("{}.{} {}", integer_part, frac_trimmed, symbol)
            }
            Err(_) => format!("0x{} {}", clean, symbol),
        }
    }

    /// Monta o calldata para chamada balanceOf(address) do padrão ERC-20
    pub fn encode_erc20_balance_of(address: &str) -> String {
        let clean = address.strip_prefix("0x").unwrap_or(address).to_lowercase();
        // Selector 0x70a08231 + 12 bytes de zero (24 hex chars) + 20 bytes de address (40 hex chars)
        format!("0x70a08231000000000000000000000000{}", clean)
    }

    /// Consulta o saldo nativo ou de token ERC-20 na blockchain
    pub async fn fetch_balance(
        address: &str,
        network: &str,
        token_symbol: Option<&str>,
    ) -> WalletBalanceReport {
        let now = chrono::Utc::now().to_rfc3339();

        if !is_valid_evm_address(address) {
            return WalletBalanceReport {
                address: address.to_string(),
                network: network.to_string(),
                status: BalanceQueryStatus::InvalidAddress,
                raw_balance_hex: None,
                formatted_balance: "Endereço Inválido".to_string(),
                symbol: "".to_string(),
                transaction_count: None,
                error_message: Some("Endereço não atende ao padrão EVM (40 hex chars)".to_string()),
                last_updated_at: now,
            };
        }

        let config = match Self::get_network_config(network) {
            Some(cfg) => cfg,
            None => {
                return WalletBalanceReport {
                    address: address.to_string(),
                    network: network.to_string(),
                    status: BalanceQueryStatus::NetworkUnsupported,
                    raw_balance_hex: None,
                    formatted_balance: "Rede Indisponível".to_string(),
                    symbol: "".to_string(),
                    transaction_count: None,
                    error_message: Some(format!("Rede '{}' não possui endpoint RPC configurado", network)),
                    last_updated_at: now,
                };
            }
        };

        let client = match reqwest::Client::builder()
            .timeout(Duration::from_secs(6))
            .build()
        {
            Ok(c) => c,
            Err(e) => {
                return WalletBalanceReport {
                    address: address.to_string(),
                    network: network.to_string(),
                    status: BalanceQueryStatus::Unavailable,
                    raw_balance_hex: None,
                    formatted_balance: "Erro de Conexão".to_string(),
                    symbol: config.native_symbol,
                    transaction_count: None,
                    error_message: Some(format!("Falha ao instanciar cliente HTTP: {}", e)),
                    last_updated_at: now,
                };
            }
        };

        // Identifica se a consulta é de Token ERC-20 ou Moeda Nativa
        let (rpc_req, decimals, symbol) = match token_symbol {
            Some(sym) => {
                let token_match = config.supported_tokens.iter().find(|t| t.symbol.eq_ignore_ascii_case(sym));
                match token_match {
                    Some(token) => {
                        let calldata = Self::encode_erc20_balance_of(address);
                        let req = JsonRpcRequest {
                            jsonrpc: "2.0",
                            method: "eth_call",
                            params: serde_json::json!([
                                { "to": token.contract_address, "data": calldata },
                                "latest"
                            ]),
                            id: 1,
                        };
                        (req, token.decimals, token.symbol.clone())
                    }
                    None => {
                        // Se token solicitado não estiver configurado para a rede
                        let req = JsonRpcRequest {
                            jsonrpc: "2.0",
                            method: "eth_getBalance",
                            params: serde_json::json!([address, "latest"]),
                            id: 1,
                        };
                        (req, config.native_decimals, config.native_symbol.clone())
                    }
                }
            }
            None => {
                let req = JsonRpcRequest {
                    jsonrpc: "2.0",
                    method: "eth_getBalance",
                    params: serde_json::json!([address, "latest"]),
                    id: 1,
                };
                (req, config.native_decimals, config.native_symbol.clone())
            }
        };

        // Consulta também nonce de transações enviadas (eth_getTransactionCount)
        let nonce_req = JsonRpcRequest {
            jsonrpc: "2.0",
            method: "eth_getTransactionCount",
            params: serde_json::json!([address, "latest"]),
            id: 2,
        };

        let tx_count = match client.post(&config.rpc_url).json(&nonce_req).send().await {
            Ok(res) => {
                if let Ok(json_res) = res.json::<JsonRpcResponse>().await {
                    json_res.result.and_then(|h| {
                        let clean = h.strip_prefix("0x").unwrap_or(&h);
                        u64::from_str_radix(clean, 16).ok()
                    })
                } else {
                    None
                }
            }
            Err(_) => None,
        };

        match client.post(&config.rpc_url).json(&rpc_req).send().await {
            Ok(res) => {
                if !res.status().is_success() {
                    return WalletBalanceReport {
                        address: address.to_string(),
                        network: network.to_string(),
                        status: BalanceQueryStatus::Unavailable,
                        raw_balance_hex: None,
                        formatted_balance: "RPC Offline".to_string(),
                        symbol,
                        transaction_count: tx_count,
                        error_message: Some(format!("HTTP {} recebido de {}", res.status(), config.rpc_url)),
                        last_updated_at: now,
                    };
                }

                match res.json::<JsonRpcResponse>().await {
                    Ok(rpc_res) => {
                        if let Some(err) = rpc_res.error {
                            return WalletBalanceReport {
                                address: address.to_string(),
                                network: network.to_string(),
                                status: BalanceQueryStatus::Unavailable,
                                raw_balance_hex: None,
                                formatted_balance: "Erro RPC".to_string(),
                                symbol,
                                transaction_count: tx_count,
                                error_message: Some(format!("RPC error: {}", err)),
                                last_updated_at: now,
                            };
                        }

                        if let Some(hex_bal) = rpc_res.result {
                            let formatted = Self::format_raw_balance(&hex_bal, decimals, &symbol);
                            WalletBalanceReport {
                                address: address.to_string(),
                                network: network.to_string(),
                                status: BalanceQueryStatus::Confirmed,
                                raw_balance_hex: Some(hex_bal),
                                formatted_balance: formatted,
                                symbol,
                                transaction_count: tx_count,
                                error_message: None,
                                last_updated_at: now,
                            }
                        } else {
                            WalletBalanceReport {
                                address: address.to_string(),
                                network: network.to_string(),
                                status: BalanceQueryStatus::Unavailable,
                                raw_balance_hex: None,
                                formatted_balance: "Sem Resultado".to_string(),
                                symbol,
                                transaction_count: tx_count,
                                error_message: Some("Resposta RPC vazia".to_string()),
                                last_updated_at: now,
                            }
                        }
                    }
                    Err(e) => WalletBalanceReport {
                        address: address.to_string(),
                        network: network.to_string(),
                        status: BalanceQueryStatus::Unavailable,
                        raw_balance_hex: None,
                        formatted_balance: "Resposta Inválida".to_string(),
                        symbol,
                        transaction_count: tx_count,
                        error_message: Some(format!("Erro ao desserializar JSON RPC: {}", e)),
                        last_updated_at: now,
                    },
                }
            }
            Err(e) => WalletBalanceReport {
                address: address.to_string(),
                network: network.to_string(),
                status: BalanceQueryStatus::Unavailable,
                raw_balance_hex: None,
                formatted_balance: "Indisponível (Timeout)".to_string(),
                symbol,
                transaction_count: tx_count,
                error_message: Some(format!("Timeout ou falha de rede RPC: {}", e)),
                last_updated_at: now,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_raw_balance() {
        let formatted = EvmRpcClient::format_raw_balance("0xde0b6b3a7640000", 18, "ETH");
        assert_eq!(formatted, "1.0000 ETH");

        let formatted_half = EvmRpcClient::format_raw_balance("0x6f05b59d3b20000", 18, "ETH");
        assert_eq!(formatted_half, "0.5000 ETH");

        // 100 USDT (6 decimais): 100 * 10^6 = 100_000_000 = 0x5f5e100
        let formatted_usdt = EvmRpcClient::format_raw_balance("0x5f5e100", 6, "USDT");
        assert_eq!(formatted_usdt, "100.0000 USDT");

        let formatted_zero = EvmRpcClient::format_raw_balance("0x0", 18, "ETH");
        assert_eq!(formatted_zero, "0.00 ETH");
    }

    #[test]
    fn test_erc20_calldata_encoding() {
        let addr = "0x9858EfFD232B4033E47d90003D41EC34EcaEda94";
        let calldata = EvmRpcClient::encode_erc20_balance_of(addr);
        assert_eq!(
            calldata,
            "0x70a082310000000000000000000000009858effd232b4033e47d90003d41ec34ecaeda94"
        );
    }

    #[test]
    fn test_network_and_token_configurations() {
        let arb = EvmRpcClient::get_network_config("Arbitrum One").expect("Arbitrum One deve existir");
        assert_eq!(arb.chain_id, 42161);
        assert!(arb.supported_tokens.iter().any(|t| t.symbol == "USDT"));
        assert!(arb.supported_tokens.iter().any(|t| t.symbol == "USDC"));

        let eth = EvmRpcClient::get_network_config("Ethereum").expect("Ethereum deve existir");
        assert_eq!(eth.chain_id, 1);
        assert!(eth.supported_tokens.iter().any(|t| t.symbol == "USDT"));

        let poly = EvmRpcClient::get_network_config("Polygon").expect("Polygon deve existir");
        assert_eq!(poly.chain_id, 137);

        let bsc = EvmRpcClient::get_network_config("BNB Chain").expect("BNB Chain deve existir");
        assert_eq!(bsc.chain_id, 56);
    }

    #[test]
    fn test_rpc_invalid_address_handling() {
        let report = tauri::async_runtime::block_on(async {
            EvmRpcClient::fetch_balance("0xInvalidAddr", "Arbitrum One", None).await
        });
        assert_eq!(report.status, BalanceQueryStatus::InvalidAddress);
        assert_eq!(report.formatted_balance, "Endereço Inválido");
    }

    #[test]
    fn test_rpc_unsupported_network_handling() {
        let valid_addr = "0x9858EfFD232B4033E47d90003D41EC34EcaEda94";
        let report = tauri::async_runtime::block_on(async {
            EvmRpcClient::fetch_balance(valid_addr, "Cardano Mainnet", None).await
        });
        assert_eq!(report.status, BalanceQueryStatus::NetworkUnsupported);
        assert_eq!(report.formatted_balance, "Rede Indisponível");
    }
}
