import { invokeNative } from '../core/invoke';
import { type BalanceQueryItem, type WalletBalanceReport } from '../contracts/monitoring-contracts';

export const MonitoringBridge = {
  /**
   * Consulta o saldo real da blockchain (nativo ou ERC-20) via cliente RPC nativo em Rust
   */
  async fetchWalletBalance(
    address: string,
    network: string,
    tokenSymbol?: string
  ): Promise<WalletBalanceReport> {
    return invokeNative<WalletBalanceReport>('fetch_wallet_balance', {
      address,
      network,
      tokenSymbol: tokenSymbol || null,
    });
  },

  /**
   * Consulta em lote o saldo de múltiplas carteiras simultaneamente via RPC
   */
  async batchFetchWalletBalances(
    queries: BalanceQueryItem[]
  ): Promise<WalletBalanceReport[]> {
    return invokeNative<WalletBalanceReport[]>('batch_fetch_wallet_balances', {
      wallets: queries.map((q) => ({
        address: q.address,
        network: q.network,
        token_symbol: q.tokenSymbol || null,
      })),
    });
  },
};
