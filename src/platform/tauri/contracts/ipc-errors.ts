export type IpcErrorCode =
  | 'VALIDATION_ERROR'
  | 'BUSINESS_ERROR'
  | 'STORAGE_ERROR'
  | 'CRYPTO_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'IPC_TRANSPORT_ERROR'
  | 'PERMISSION_DENIED_ERROR'
  | 'UNKNOWN_ERROR';

export interface SerializedIpcError {
  code: IpcErrorCode;
  message: string;
  command?: string;
  timestamp: string;
}

export class IpcError extends Error {
  public readonly code: IpcErrorCode;
  public readonly command?: string;
  public readonly timestamp: string;

  constructor(message: string, code: IpcErrorCode = 'UNKNOWN_ERROR', command?: string) {
    const sanitizedMessage = IpcError.sanitizeMessage(message);
    super(sanitizedMessage);
    this.name = 'IpcError';
    this.code = code;
    this.command = command;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Sanitiza a mensagem para assegurar que segredos, senhas ou mnemônicas
   * nunca sejam vazados em telas ou logs de erro.
   */
  public static sanitizeMessage(raw: string): string {
    if (!raw) return 'Erro desconhecido na comunicação nativa.';
    // Remove possíveis sequências de palavras mnemônicas, seeds, chaves privadas ou senhas
    return raw
      .replace(/\b(?:mnemonic|phrase|seed|private_key|words?)\b\s*[:=]\s*[^\n,]+/gi, '[REDACTED_SECRET]')
      .replace(/\b(?:password|master_password|secret|key)\b\s*[:=]\s*[^\n,]+/gi, '[REDACTED_CREDENTIAL]');
  }

  public toJSON(): SerializedIpcError {
    return {
      code: this.code,
      message: this.message,
      command: this.command,
      timestamp: this.timestamp,
    };
  }
}
