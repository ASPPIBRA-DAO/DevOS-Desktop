/**
 * Contratos IPC do Domínio de Monitoramento e Telemetria RPC Multichain
 * Sincronizados com `src-tauri/src/commands/monitoring_commands.rs`.
 */

export interface WalletBalanceReport {
  address: string;
  network: string;
  status: 'Confirmed' | 'Unavailable' | 'InvalidAddress' | 'NetworkUnsupported' | string;
  raw_balance_hex?: string;
  formatted_balance: string;
  symbol: string;
  transaction_count?: number | null;
  error_message?: string;
  last_updated_at: string;
}

export interface BalanceQueryItem {
  address: string;
  network: string;
  tokenSymbol?: string;
}
