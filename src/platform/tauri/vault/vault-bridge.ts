import { invokeNative } from '../core/invoke';
import { type VaultStatus } from '../contracts/vault-contracts';

export const VaultBridge = {
  /**
   * Consulta o estado do cofre (se ja foi inicializado e quantas carteiras possui)
   */
  async getStatus(): Promise<VaultStatus> {
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
  async unlock(masterPassword: string): Promise<boolean> {
    return invokeNative<boolean>('unlock_vault', { masterPassword });
  },

  /**
   * Exporta a frase mnemônica de forma autorizada mediante senha mestre
   */
  async exportAuthorizedSecret(masterPassword: string, vaultId: string): Promise<string> {
    return invokeNative<string>('export_authorized_secret', {
      masterPassword,
      vaultId,
    });
  },

  /**
   * Exporta um backup atômico e criptografado do cofre local SQLite
   */
  async exportBackup(masterPassword: string, destinationPath: string): Promise<number> {
    return invokeNative<number>('export_vault_backup', {
      masterPassword,
      destinationPath,
    });
  },

  /**
   * Restaura o cofre a partir de um arquivo de backup verificado
   */
  async restoreBackup(masterPassword: string, sourcePath: string): Promise<boolean> {
    return invokeNative<boolean>('restore_vault_backup', {
      masterPassword,
      sourcePath,
    });
  },
};
