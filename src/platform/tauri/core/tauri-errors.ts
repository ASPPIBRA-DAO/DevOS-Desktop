import { IpcError, type IpcErrorCode } from '../contracts/ipc-errors';

export class TauriErrorMapper {
  /**
   * Normaliza qualquer erro capturado do Tauri IPC em uma instância segura de IpcError.
   */
  public static normalize(error: unknown, command?: string): IpcError {
    if (error instanceof IpcError) {
      return error;
    }

    const rawMessage = typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : JSON.stringify(error);

    const code = TauriErrorMapper.classifyErrorCode(rawMessage);
    return new IpcError(rawMessage, code, command);
  }

  private static classifyErrorCode(message: string): IpcErrorCode {
    const lower = message.toLowerCase();

    if (lower.includes('validation') || lower.includes('invalido') || lower.includes('invalid') || lower.includes('length')) {
      return 'VALIDATION_ERROR';
    }
    if (lower.includes('not found') || lower.includes('nao encontrado') || lower.includes('inexistente')) {
      return 'NOT_FOUND_ERROR';
    }
    if (lower.includes('permission') || lower.includes('permissão') || lower.includes('denied') || lower.includes('not allowed')) {
      return 'PERMISSION_DENIED_ERROR';
    }
    if (lower.includes('storage') || lower.includes('sqlite') || lower.includes('database') || lower.includes('banco')) {
      return 'STORAGE_ERROR';
    }
    if (lower.includes('crypto') || lower.includes('cipher') || lower.includes('argon') || lower.includes('decrypt')) {
      return 'CRYPTO_ERROR';
    }
    if (lower.includes('ipc') || lower.includes('channel') || lower.includes('webview') || lower.includes('network')) {
      return 'IPC_TRANSPORT_ERROR';
    }

    return 'BUSINESS_ERROR';
  }
}
