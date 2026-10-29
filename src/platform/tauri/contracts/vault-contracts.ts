/**
 * Contratos IPC do domínio do cofre criptográfico DevOS.
 *
 * Os formatos definidos neste arquivo devem permanecer sincronizados
 * com os comandos e as estruturas serializadas em:
 *
 * src-tauri/src/commands/vault_commands.rs
 *
 * Observação:
 * As interfaces TypeScript fornecem verificação estática, mas não
 * validam automaticamente os dados recebidos em tempo de execução.
 */

/**
 * Estado atual do cofre criptográfico.
 *
 * Os nomes das propriedades correspondem exatamente ao formato
 * serializado pelo backend Rust (snake_case por padrão do Serde).
 */
export interface VaultStatus {
  /** Indica se o cofre já foi inicializado. */
  is_initialized: boolean;

  /** Indica se o cofre está atualmente desbloqueado. */
  is_unlocked: boolean;

  /** Quantidade de carteiras associadas à DAO. */
  dao_wallets_count: number;

  /** Quantidade de carteiras associadas aos clientes. */
  client_wallets_count: number;
}

/**
 * Dados necessários para inicializar a senha mestre do cofre.
 *
 * A senha é um dado sensível e não deve ser incluída em logs,
 * mensagens de diagnóstico ou armazenamento desnecessário.
 */
export interface InitMasterPasswordPayload {
  /** Senha mestre fornecida pelo usuário. */
  masterPassword: string;
}

/**
 * Dados necessários para solicitar o desbloqueio do cofre.
 */
export interface UnlockVaultPayload {
  /** Senha mestre fornecida pelo usuário. */
  masterPassword: string;
}

/**
 * Dados necessários para solicitar a exportação autorizada
 * de um segredo pertencente a um cofre específico.
 */
export interface ExportAuthorizedSecretPayload {
  /** Senha mestre utilizada na autorização da operação. */
  masterPassword: string;

  /** Identificador do cofre cujo segredo será exportado. */
  vaultId: string;
}

/**
 * Dados necessários para solicitar a exportação de um backup
 * criptografado do cofre local.
 */
export interface ExportVaultBackupPayload {
  /** Senha mestre exigida pela operação nativa. */
  masterPassword: string;

  /** Caminho de destino do arquivo de backup. */
  destinationPath: string;
}

/**
 * Dados necessários para solicitar a restauração do cofre
 * a partir de um arquivo de backup.
 */
export interface RestoreVaultBackupPayload {
  /** Senha mestre exigida pela operação nativa. */
  masterPassword: string;

  /** Caminho do arquivo de backup que será restaurado. */
  sourcePath: string;
}
