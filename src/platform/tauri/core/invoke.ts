import { invoke, isTauri } from '@tauri-apps/api/core';

import { TauriErrorMapper } from './tauri-errors';

/**
 * ASPPIBRA DevOS — Native IPC Invoker (Tauri v2).
 *
 * Centraliza as chamadas ao backend Rust, a verificação do ambiente
 * de execução, o timeout de espera e a normalização de erros IPC.
 *
 * A sanitização das mensagens de erro é responsabilidade do
 * TauriErrorMapper.
 */

/**
 * Timeout padrão de espera por uma resposta IPC (30 segundos).
 *
 * Operações potencialmente demoradas devem configurar um limite
 * específico quando forem integradas ao wrapper.
 */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Opções opcionais de execução para uma chamada IPC.
 */
export interface InvokeNativeOptions {
  /**
   * Tempo máximo de espera pela resposta, em milissegundos.
   *
   * O timeout não cancela automaticamente a operação no backend Rust.
   * Deve ser um número finito maior que zero.
   *
   * Se omitido, utiliza DEFAULT_TIMEOUT_MS.
   */
  timeoutMs?: number;
}

/**
 * Erro específico para chamadas IPC que excederam o limite de espera.
 *
 * O comando nativo pode continuar em execução após este erro.
 * Portanto, o timeout não deve ser interpretado como confirmação
 * de que a operação foi cancelada.
 */
export class NativeIpcTimeoutError extends Error {
  readonly command: string;

  readonly timeoutMs: number;

  constructor(command: string, timeoutMs: number) {
    super(
      `[Rust Core IPC Error] (${command}): ` +
        `A chamada excedeu o limite de ${timeoutMs} ms. ` +
        'A operação nativa pode continuar em execução; ' +
        'o timeout não cancela o comando Rust.'
    );
    this.name = 'NativeIpcTimeoutError';
    this.command = command;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Verifica se o código está executando em um ambiente Tauri.
 *
 * O nome é mantido por compatibilidade com os consumidores existentes.
 * A verificação utiliza isTauri(), que identifica o runtime Tauri,
 * sem determinar isoladamente o sistema operacional.
 */
export function isTauriDesktop(): boolean {
  return isTauri();
}

/**
 * Valida o limite de espera configurado.
 */
function validateTimeout(timeoutMs: number): void {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError('timeoutMs deve ser um número finito maior que zero.');
  }
}

/**
 * Executa uma chamada IPC com limite de espera.
 *
 * Importante:
 * Promise.race encerra a espera do frontend quando o limite expira,
 * mas não cancela automaticamente a invocação já enviada ao backend.
 */
async function invokeWithTimeout<T>(
  cmd: string,
  args: Record<string, unknown>,
  timeoutMs: number
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new NativeIpcTimeoutError(cmd, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([invoke<T>(cmd, args), timeoutPromise]);
  } finally {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
  }
}

/**
 * Invoca um comando nativo Rust pelo IPC do Tauri v2.
 *
 * @param cmd Nome registrado do comando nativo.
 * @param args Argumentos nomeados do comando.
 * @param options Opções opcionais, incluindo timeoutMs.
 *
 * @returns A resposta do comando, tipada conforme T.
 *
 * @throws Error Se o ambiente Tauri não estiver disponível.
 * @throws NativeIpcTimeoutError Se o tempo limite for excedido.
 * @throws Error Se a invocação nativa falhar.
 *
 * Observação:
 * O parâmetro genérico T fornece tipagem estática, mas não valida
 * a estrutura do retorno em tempo de execução.
 */
export async function invokeNative<T>(
  cmd: string,
  args: Record<string, unknown> = {},
  options: InvokeNativeOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  validateTimeout(timeoutMs);

  if (!isTauriDesktop()) {
    throw new Error(
      `Ambiente não suportado: O comando nativo '${cmd}' exige ` +
        'execução dentro do aplicativo Desktop DevOS (Tauri v2).'
    );
  }

  try {
    return await invokeWithTimeout<T>(cmd, args, timeoutMs);
  } catch (err: unknown) {
    /**
     * Preserva o tipo específico para que os consumidores possam
     * distinguir timeout de falhas IPC convencionais.
     */
    if (err instanceof NativeIpcTimeoutError) {
      throw err;
    }

    const normalized = TauriErrorMapper.normalize(err, cmd);
    throw new Error(`[Rust Core IPC Error] (${cmd}): ${normalized.message}`);
  }
}
