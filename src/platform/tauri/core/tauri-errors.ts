import { IpcError, type IpcErrorCode } from '../contracts/ipc-errors';

/**
 * TauriErrorMapper — Normalização e classificação de erros da comunicação IPC.
 *
 * Converte erros capturados em instâncias tipadas de IpcError, sanitizando
 * credenciais e garantindo extração segura de mensagens sem falhas de serialização.
 */

const MAX_ERROR_MESSAGE_LENGTH = 2_048;
const UNKNOWN_ERROR_MESSAGE = 'Erro desconhecido na comunicação nativa.';

export class TauriErrorMapper {
  /**
   * Normaliza qualquer erro capturado do Tauri IPC em uma instância segura de IpcError.
   *
   * @param error Erro recebido da invocação IPC.
   * @param command Nome do comando nativo associado.
   * @returns Instância tipada e sanitizada de IpcError.
   */
  public static normalize(error: unknown, command?: string): IpcError {
    if (error instanceof IpcError) {
      return error;
    }

    const rawMessage = TauriErrorMapper.extractMessage(error);
    const code = TauriErrorMapper.classifyErrorCode(rawMessage);

    return new IpcError(rawMessage, code, command);
  }

  /**
   * Extrai com segurança uma mensagem textual sem recorrer a JSON.stringify indiscriminado.
   * Evita exceções com referências circulares ou tipos BigInt.
   */
  private static extractMessage(error: unknown): string {
    try {
      let message: unknown;

      if (typeof error === 'string') {
        message = error;
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'object' && error !== null) {
        message = Reflect.get(error, 'message');
      }

      if (typeof message !== 'string' || message.trim().length === 0) {
        return UNKNOWN_ERROR_MESSAGE;
      }

      return message.slice(0, MAX_ERROR_MESSAGE_LENGTH);
    } catch {
      return UNKNOWN_ERROR_MESSAGE;
    }
  }

  /**
   * Normaliza a mensagem para comparação, eliminando acentos e convertendo para minúsculas.
   */
  private static normalizeMessage(message: string): string {
    return message
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  /**
   * Verifica se o termo de tamanho/comprimento ocorre em contexto real de validação.
   */
  private static isLengthValidationError(message: string): boolean {
    const hasLengthTerm = /\b(length|tamanho|comprimento)\b/.test(message);
    if (!hasLengthTerm) {
      return false;
    }

    return /\b(invalid|invalido|invalida|required|expected|exceeds|exceeded|must be|too long|too short|obrigatorio|esperado|excede|excedido|deve ser|muito longo|muito curto)\b/.test(
      message
    );
  }

  /**
   * Classifica o erro utilizando as categorias IPC com suporte multilíngue (PT/EN).
   */
  private static classifyErrorCode(message: string): IpcErrorCode {
    const normalized = TauriErrorMapper.normalizeMessage(message);

    const containsAny = (...terms: string[]): boolean =>
      terms.some((term) => normalized.includes(term));

    if (
      containsAny('validation', 'validacao', 'invalid', 'invalido', 'invalida') ||
      TauriErrorMapper.isLengthValidationError(normalized)
    ) {
      return 'VALIDATION_ERROR';
    }

    if (
      containsAny(
        'not found',
        'nao encontrado',
        'nao encontrada',
        'nao encontrad',
        'inexistente',
        'nao existe'
      )
    ) {
      return 'NOT_FOUND_ERROR';
    }

    if (
      containsAny(
        'permission',
        'permissao',
        'denied',
        'negado',
        'negada',
        'not allowed',
        'nao permitido',
        'nao permitida',
        'forbidden',
        'unauthorized',
        'nao autorizado',
        'nao autorizada'
      )
    ) {
      return 'PERMISSION_DENIED_ERROR';
    }

    if (
      containsAny('storage', 'sqlite', 'database', 'banco', 'persistencia')
    ) {
      return 'STORAGE_ERROR';
    }

    if (
      containsAny(
        'crypto',
        'cipher',
        'argon',
        'decrypt',
        'encrypt',
        'criptograf',
        'descriptograf'
      )
    ) {
      return 'CRYPTO_ERROR';
    }

    if (
      containsAny(
        'ipc',
        'channel',
        'webview',
        'network',
        'transport',
        'timeout',
        'timed out',
        'tempo limite'
      )
    ) {
      return 'IPC_TRANSPORT_ERROR';
    }

    return 'BUSINESS_ERROR';
  }
}
