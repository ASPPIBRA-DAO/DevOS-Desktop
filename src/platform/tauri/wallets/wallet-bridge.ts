import { invokeNative, isTauriDesktop } from '../core/invoke';

export interface VaultStatus {
  is_initialized: boolean;
  is_unlocked: boolean;
  dao_wallets_count: number;
  client_wallets_count: number;
}

export interface DerivedWalletPreview {
  index: number;
  derivation_path: string;
  address: string;
  label: string;
  network: string;
}

export interface GeneratePreviewResponse {
  session_id: string;
  words_count: number;
  previews: DerivedWalletPreview[];
  mnemonic?: string | null;
}

export interface StoredWallet {
  id: number;
  target: 'DAO' | 'CLIENT';
  custody_type: 'WATCH_ONLY' | 'CUSTODIAL_LOCAL';
  user: string;
  label: string;
  derivation_path: string;
  network: string;
  address: string;
  status: 'ACTIVE' | 'PENDING' | 'ROTATED';
  kyc_status: 'UNVERIFIED' | 'SIMULATED_TEST' | 'VERIFIED';
  seed_words_count: number;
  created_at: string;
  vault_id?: string | null;
  client_doc?: string;
}

export interface WalletBalanceReport {
  address: string;
  network: string;
  status: 'Confirmed' | 'Unavailable' | 'InvalidAddress' | 'NetworkUnsupported';
  raw_balance_hex?: string;
  formatted_balance: string;
  symbol: string;
  transaction_count?: number | null;
  error_message?: string;
  last_updated_at: string;
}

export interface SaveWalletsRequest {
  master_password: string;
  session_id?: string;
  mnemonic?: string;
  target: 'DAO' | 'CLIENT';
  network: string;
  previews: DerivedWalletPreview[];
  client_name?: string;
  client_doc?: string;
}

export const WalletBridge = {
  isDesktop: isTauriDesktop,

  /**
   * Consulta o estado do cofre (se ja foi inicializado e quantas carteiras possui)
   */
  async getVaultStatus(): Promise<VaultStatus> {
    return invokeNative<VaultStatus>('get_vault_status');
  },

  /**
   * Inicializa a senha mestre do cofre DevOS
   */
  async initMasterPassword(masterPassword: string): Promise<boolean> {
    return invokeNative<boolean>('init_master_password', { masterPassword });
  },

  /**
   * Valida a senha mestre para desbloqueio do cofre
   */
  async unlockVault(masterPassword: string): Promise<boolean> {
    return invokeNative<boolean>('unlock_vault', { masterPassword });
  },

  /**
   * Gera uma nova mnemonica BIP-39 e deriva carteiras EVM para pre-visualizacao no Rust
   */
  async generateSeedAndPreview(options: {
    wordCount: number;
    target: 'DAO' | 'CLIENT';
    accountBranch: number;
    count: number;
    baseLabel: string;
    network: string;
  }): Promise<GeneratePreviewResponse> {
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
   * Revela explicitamente a frase mnemonica retida na sessao de criacao em Rust mediante senha mestre
   */
  async revealPendingMnemonic(sessionId: string, masterPassword: string): Promise<string> {
    return invokeNative<string>('reveal_pending_mnemonic', { sessionId, masterPassword });
  },

  /**
   * Cancela a sessao pendente em Rust, destruindo o segredo da memoria imediatamente
   */
  async cancelPendingCreation(sessionId: string): Promise<boolean> {
    return invokeNative<boolean>('cancel_pending_creation', { sessionId });
  },

  /**
   * Cifra a semente no cofre local consumindo a sessao em Rust (sem trafego de texto puro)
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
   * Exporta um backup atomico e criptografado do cofre local SQLite
   */
  async exportVaultBackup(masterPassword: string, destinationPath: string): Promise<number> {
    return invokeNative<number>('export_vault_backup', {
      masterPassword,
      destinationPath,
    });
  },

  /**
   * Restaura o cofre a partir de um arquivo de backup verificado
   */
  async restoreVaultBackup(masterPassword: string, sourcePath: string): Promise<boolean> {
    return invokeNative<boolean>('restore_vault_backup', {
      masterPassword,
      sourcePath,
    });
  },

  /**
   * Retorna todas as carteiras persistidas localmente no banco SQLite
   */
  async listStoredWallets(): Promise<StoredWallet[]> {
    return invokeNative<StoredWallet[]>('list_stored_wallets');
  },

  /**
   * Exporta a frase mnemonica de forma autorizada mediante senha mestre
   */
  async exportAuthorizedSecret(masterPassword: string, vaultId: string): Promise<string> {
    return invokeNative<string>('export_authorized_secret', {
      masterPassword,
      vaultId,
    });
  },

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
   * Consulta em lote o saldo de multiplas carteiras simultaneamente via RPC
   */
  async batchFetchWalletBalances(
    queries: { address: string; network: string; tokenSymbol?: string }[]
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
