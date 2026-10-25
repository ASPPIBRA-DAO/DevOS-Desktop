import { VaultBridge } from '../vault/vault-bridge';
import { invokeNative, isTauriDesktop } from '../core/invoke';
import { type VaultStatus } from '../contracts/vault-contracts';
import { MonitoringBridge } from '../monitoring/monitoring-bridge';
import { type BalanceQueryItem, type WalletBalanceReport } from '../contracts/monitoring-contracts';
import {
  type StoredWallet,
  type SaveWalletsRequest,
  type GenerateSeedOptions,
  type DerivedWalletPreview,
  type GeneratePreviewResponse,
} from '../contracts/wallet-contracts';

// Re-exportações de compatibilidade retroativa
export type {
  VaultStatus,
  StoredWallet,
  BalanceQueryItem,
  SaveWalletsRequest,
  GenerateSeedOptions,
  WalletBalanceReport,
  DerivedWalletPreview,
  GeneratePreviewResponse,
};

export const WalletBridge = {
  isDesktop: isTauriDesktop,

  // Métodos Canônicos de Carteiras
  /**
   * Gera uma nova mnemônica BIP-39 e deriva carteiras EVM para pré-visualização no Rust
   */
  async generateSeedAndPreview(options: GenerateSeedOptions): Promise<GeneratePreviewResponse> {
    return invokeNative<GeneratePreviewResponse>('generate_seed_and_preview', {
      wordCount: options.wordCount,
      target: options.target,
      accountBranch: options.accountBranch,
      count: options.count,
      baseLabel: options.baseLabel,
      network: options.network,
    });
  },

  /**
   * Revela explicitamente a frase mnemônica retida na sessão de criação em Rust mediante senha mestre
   */
  async revealPendingMnemonic(sessionId: string, masterPassword: string): Promise<string> {
    return invokeNative<string>('reveal_pending_mnemonic', { sessionId, masterPassword });
  },

  /**
   * Cancela a sessão pendente em Rust, destruindo o segredo da memória imediatamente
   */
  async cancelPendingCreation(sessionId: string): Promise<boolean> {
    return invokeNative<boolean>('cancel_pending_creation', { sessionId });
  },

  /**
   * Cifra a semente no cofre local consumindo a sessão em Rust (sem tráfego de texto puro)
   */
  async confirmAndSaveWallets(request: SaveWalletsRequest): Promise<StoredWallet[]> {
    return invokeNative<StoredWallet[]>('confirm_and_save_wallets', {
      request: {
        master_password: request.master_password,
        session_id: request.session_id || null,
        mnemonic: request.mnemonic || null,
        target: request.target,
        network: request.network,
        previews: request.previews,
        client_name: request.client_name,
        client_doc: request.client_doc,
      },
    });
  },

  /**
   * Retorna todas as carteiras persistidas localmente no banco SQLite
   */
  async listStoredWallets(): Promise<StoredWallet[]> {
    return invokeNative<StoredWallet[]>('list_stored_wallets');
  },

  // Proxies de Compatibilidade Retroativa (delegando para VaultBridge e MonitoringBridge)
  async getVaultStatus(): Promise<VaultStatus> {
    return VaultBridge.getStatus();
  },

  async initMasterPassword(masterPassword: string): Promise<boolean> {
    return VaultBridge.initMasterPassword(masterPassword);
  },

  async unlockVault(masterPassword: string): Promise<boolean> {
    return VaultBridge.unlock(masterPassword);
  },

  async exportVaultBackup(masterPassword: string, destinationPath: string): Promise<number> {
    return VaultBridge.exportBackup(masterPassword, destinationPath);
  },

  async restoreVaultBackup(masterPassword: string, sourcePath: string): Promise<boolean> {
    return VaultBridge.restoreBackup(masterPassword, sourcePath);
  },

  async exportAuthorizedSecret(masterPassword: string, vaultId: string): Promise<string> {
    return VaultBridge.exportAuthorizedSecret(masterPassword, vaultId);
  },

  async fetchWalletBalance(
    address: string,
    network: string,
    tokenSymbol?: string
  ): Promise<WalletBalanceReport> {
    return MonitoringBridge.fetchWalletBalance(address, network, tokenSymbol);
  },

  async batchFetchWalletBalances(
    queries: BalanceQueryItem[]
  ): Promise<WalletBalanceReport[]> {
    return MonitoringBridge.batchFetchWalletBalances(queries);
  },
};
