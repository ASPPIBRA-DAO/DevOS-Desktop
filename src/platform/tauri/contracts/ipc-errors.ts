/**
 * Códigos padronizados de erro da comunicação IPC.
 *
 * Os valores fazem parte do contrato público e devem permanecer
 * sincronizados com o TauriErrorMapper e os consumidores existentes.
 */
export type IpcErrorCode =
  | 'VALIDATION_ERROR'
  | 'BUSINESS_ERROR'
  | 'STORAGE_ERROR'
  | 'CRYPTO_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'IPC_TRANSPORT_ERROR'
  | 'PERMISSION_DENIED_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Representação serializável de um erro IPC.
 */
export interface SerializedIpcError {
  code: IpcErrorCode;
  message: string;
  command?: string;
  timestamp: string;
}

/**
 * Limite máximo da mensagem bruta processada pela sanitização.
 *
 * Evita processar mensagens excessivamente grandes e limita o
 * trabalho realizado pelas expressões regulares.
 */
const MAX_RAW_MESSAGE_LENGTH = 8_192;

/**
 * Limite máximo da mensagem disponibilizada aos consumidores.
 */
const MAX_SANITIZED_MESSAGE_LENGTH = 4_096;

/**
 * Mensagem padrão usada quando não existe uma mensagem utilizável.
 */
const UNKNOWN_IPC_ERROR_MESSAGE = 'Erro desconhecido na comunicação nativa.';

/**
 * Marcadores utilizados para substituir valores sensíveis reconhecidos.
 */
const REDACTED_SECRET = '[REDACTED_SECRET]';
const REDACTED_CREDENTIAL = '[REDACTED_CREDENTIAL]';

/**
 * Identifica campos associados a frases mnemônicas, seeds,
 * material de recuperação e chaves privadas.
 *
 * Os nomes aceitam variantes em camelCase, snake_case e kebab-case,
 * além de formatos JSON delimitados por aspas.
 */
const SENSITIVE_MATERIAL_PATTERN =
  /(^|[^A-Za-z0-9_])(["']?(?:mnemonic(?:[\s_-]?phrase)?|seed(?:[\s_-]?phrase)?|recovery[\s_-]?phrase|phrase|words?|private[\s_-]?key)["']?\s*[:=]\s*)("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\r\n]*)/gi;

/**
 * Identifica campos associados a credenciais, senhas, chaves de API e tokens.
 *
 * Valores delimitados por aspas são tratados como uma unidade JSON.
 * Nos demais casos, a captura termina em separadores comuns de propriedades.
 */
const CREDENTIAL_PATTERN =
  /(^|[^A-Za-z0-9_])(["']?(?:master[\s_-]?password|password|secret|api[\s_-]?key|access[\s_-]?token|refresh[\s_-]?token|authorization|token|key)["']?\s*[:=]\s*)("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\r\n,;}\]]+)/gi;

/**
 * Representa um erro normalizado da comunicação IPC.
 *
 * A mensagem é sanitizada antes de ser disponibilizada por meio
 * da propriedade Error.message.
 */
export class IpcError extends Error {
  public readonly code: IpcErrorCode;

  public readonly command?: string;

  public readonly timestamp: string;

  constructor(
    message: string,
    code: IpcErrorCode = 'UNKNOWN_ERROR',
    command?: string
  ) {
    const sanitizedMessage = IpcError.sanitizeMessage(message);

    super(sanitizedMessage);

    this.name = 'IpcError';
    this.code = code;
    this.command = command;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Sanitiza uma mensagem de erro antes de sua exposição.
   *
   * A função reconhece padrões de credenciais em camelCase, snake_case e JSON,
   * limita o tamanho processado e fornece fallback seguro para entradas vazias.
   */
  public static sanitizeMessage(raw: string): string {
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return UNKNOWN_IPC_ERROR_MESSAGE;
    }

    const wasInputTruncated = raw.length > MAX_RAW_MESSAGE_LENGTH;
    const boundedMessage = raw.slice(0, MAX_RAW_MESSAGE_LENGTH);

    let sanitizedMessage = boundedMessage
      .replace(
        SENSITIVE_MATERIAL_PATTERN,
        `$1$2${REDACTED_SECRET}`
      )
      .replace(
        CREDENTIAL_PATTERN,
        `$1$2${REDACTED_CREDENTIAL}`
      )
      .trim();

    if (sanitizedMessage.length === 0) {
      return UNKNOWN_IPC_ERROR_MESSAGE;
    }

    const wasOutputTruncated =
      sanitizedMessage.length > MAX_SANITIZED_MESSAGE_LENGTH;

    if (wasOutputTruncated) {
      sanitizedMessage = sanitizedMessage.slice(
        0,
        MAX_SANITIZED_MESSAGE_LENGTH - 1
      );
    }

    if (wasInputTruncated || wasOutputTruncated) {
      sanitizedMessage = `${sanitizedMessage.trimEnd()}…`;
    }

    return sanitizedMessage;
  }

  /**
   * Produz uma representação serializável do erro.
   *
   * A mensagem serializada corresponde à mensagem já sanitizada.
   * A propriedade command é omitida quando não está definida.
   */
  public toJSON(): SerializedIpcError {
    return {
      code: this.code,
      message: this.message,
      ...(this.command !== undefined ? { command: this.command } : {}),
      timestamp: this.timestamp,
    };
  }
}
