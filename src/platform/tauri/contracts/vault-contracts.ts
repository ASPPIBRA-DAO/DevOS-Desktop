/**
 * Contratos IPC do Domínio do Cofre Criptográfico (DevOS Vault)
 * Sincronizados com `src-tauri/src/commands/vault_commands.rs`.
 */

export interface VaultStatus {
  is_initialized: boolean;
  is_unlocked: boolean;
  dao_wallets_count: number;
  client_wallets_count: number;
}

export interface InitMasterPasswordPayload {
  masterPassword: string;
}

export interface UnlockVaultPayload {
  masterPassword: string;
}

export interface ExportAuthorizedSecretPayload {
  masterPassword: string;
  vaultId: string;
}

export interface ExportVaultBackupPayload {
  masterPassword: string;
  destinationPath: string;
}

export interface RestoreVaultBackupPayload {
  masterPassword: string;
  sourcePath: string;
}
