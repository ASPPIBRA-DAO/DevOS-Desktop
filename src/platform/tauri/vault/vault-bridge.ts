import type {
  VaultStatus,
  UnlockVaultPayload,
  ExportVaultBackupPayload,
  RestoreVaultBackupPayload,
  InitMasterPasswordPayload,
  ExportAuthorizedSecretPayload,
} from '../contracts/vault-contracts';

import { invokeNative } from '../core/invoke';

/**
 * Ponte de comunicação entre o frontend e os comandos nativos do cofre.
 *
 * A implementação delega as operações ao invokeNative, mantendo
 * a comunicação IPC centralizada e as responsabilidades de segurança,
 * persistência e criptografia no backend Rust.
 */
export const VaultBridge = {
  /**
   * Consulta o estado atual do cofre (se já foi inicializado,
   * se está desbloqueado e a contagem de carteiras).
   *
   * @returns Estado do cofre conforme o contrato VaultStatus.
   */
  async getStatus(): Promise<VaultStatus> {
    return invokeNative<VaultStatus>('get_vault_status');
  },

  /**
   * Inicializa a senha mestre do cofre DevOS.
   *
   * A validação definitiva da senha e a inicialização do cofre
   * são responsabilidades do comando nativo.
   *
   * @param masterPassword Senha mestre fornecida pelo usuário.
   * @returns true quando o cofre for inicializado com sucesso.
   */
  async initMasterPassword(masterPassword: string): Promise<boolean> {
    const payload: InitMasterPasswordPayload = {
      masterPassword,
    };
    return invokeNative<boolean>('init_master_password', { ...payload });
  },

  /**
   * Solicita ao backend a validação da senha mestre e o desbloqueio
   * da sessão do cofre.
   *
   * @param masterPassword Senha mestre fornecida pelo usuário.
   * @returns true se a senha for válida e a sessão for desbloqueada.
   */
  async unlock(masterPassword: string): Promise<boolean> {
    const payload: UnlockVaultPayload = {
      masterPassword,
    };
    return invokeNative<boolean>('unlock_vault', { ...payload });
  },

  /**
   * Solicita o bloqueio imediato da sessão do cofre no backend Rust.
   *
   * @returns true quando a sessão for descarregada da memória.
   */
  async lock(): Promise<boolean> {
    return invokeNative<boolean>('lock_vault');
  },

  /**
   * Solicita a exportação autorizada de um segredo do cofre.
   *
   * O backend valida a senha mestre e a autorização antes de descriptografar.
   * O consumidor deve evitar registrar ou reter desnecessariamente o segredo.
   *
   * @param masterPassword Senha mestre utilizada na autorização.
   * @param vaultId Identificador do cofre cujo segredo será exportado.
   * @returns Segredo autorizado em formato textual.
   */
  async exportAuthorizedSecret(
    masterPassword: string,
    vaultId: string
  ): Promise<string> {
    const payload: ExportAuthorizedSecretPayload = {
      masterPassword,
      vaultId,
    };
    return invokeNative<string>('export_authorized_secret', { ...payload });
  },

  /**
   * Solicita a exportação de um backup atômico e criptografado do cofre local SQLite.
   *
   * @param masterPassword Senha mestre exigida pelo comando nativo.
   * @param destinationPath Caminho de destino do arquivo de backup.
   * @returns Tamanho total em bytes do arquivo de backup exportado.
   */
  async exportBackup(
    masterPassword: string,
    destinationPath: string
  ): Promise<number> {
    const payload: ExportVaultBackupPayload = {
      masterPassword,
      destinationPath,
    };
    return invokeNative<number>('export_vault_backup', { ...payload });
  },

  /**
   * Solicita a restauração do cofre a partir de um backup previamente validado.
   *
   * O backend verifica a integridade do SQLite e preserva versão de rollback
   * antes de substituir o arquivo do cofre ativo.
   *
   * @param masterPassword Senha mestre exigida pelo comando nativo.
   * @param sourcePath Caminho do arquivo de backup de origem.
   * @returns true quando a substituição for concluída com sucesso.
   */
  async restoreBackup(
    masterPassword: string,
    sourcePath: string
  ): Promise<boolean> {
    const payload: RestoreVaultBackupPayload = {
      masterPassword,
      sourcePath,
    };
    return invokeNative<boolean>('restore_vault_backup', { ...payload });
  },
};
