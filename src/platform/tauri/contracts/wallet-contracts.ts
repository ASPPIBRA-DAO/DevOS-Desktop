/**
 * Contratos IPC do Domínio de Carteiras EVM e Derivação BIP-39/BIP-44
 * Sincronizados com `src-tauri/src/commands/wallet_commands.rs`.
 */

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
  custody_type: 'WATCH_ONLY' | 'CUSTODIAL_LOCAL' | string;
  user: string;
  label: string;
  derivation_path: string;
  network: string;
  address: string;
  status: 'ACTIVE' | 'PENDING' | 'ROTATED' | string;
  kyc_status: 'UNVERIFIED' | 'SIMULATED_TEST' | 'VERIFIED' | string;
  seed_words_count: number;
  created_at: string;
  vault_id?: string | null;
  client_doc?: string;
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

export interface GenerateSeedOptions {
  wordCount: number;
  target: 'DAO' | 'CLIENT';
  accountBranch: number;
  count: number;
  baseLabel: string;
  network: string;
}
