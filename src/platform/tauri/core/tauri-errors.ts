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
    const userMessage = TauriErrorMapper.resolveUserMessage(
      rawMessage,
      code,
      command
    );

    return new IpcError(rawMessage, code, command, userMessage);
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
      containsAny(
        'validation',
        'validacao',
        'invalid',
        'invalido',
        'invalida',
        'missing field',
        'campo ausente',
        'campo obrigatorio'
      ) ||
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

  /**
   * Converte erros técnicos do backend e do IPC em mensagens institucionais
   * compreensíveis para o usuário final, separando o diagnóstico técnico
   * da apresentação na interface.
   */
  public static resolveUserMessage(
    rawMessage: string,
    code: IpcErrorCode,
    command?: string
  ): string {
    const normalized = TauriErrorMapper.normalizeMessage(rawMessage);

    if (normalized.includes('ambiente nao suportado')) {
      return rawMessage;
    }

    // Tratamento especializado para geração e validação documental
    if (command === 'generate_document' || normalized.includes('documento')) {
      if (
        normalized.includes('missing field `document_number`') ||
        normalized.includes("missing field 'document_number'") ||
        normalized.includes('missing field document_number')
      ) {
        return 'O número do documento não foi informado. Revise os dados obrigatórios.';
      }

      if (
        normalized.includes('missing field `auth_code`') ||
        normalized.includes("missing field 'auth_code'") ||
        normalized.includes('missing field auth_code')
      ) {
        return 'O código de autenticação não foi informado.';
      }

      if (
        normalized.includes('document_number') &&
        (normalized.includes('vazio') ||
          normalized.includes('empty') ||
          normalized.includes('obrigatorio'))
      ) {
        return 'O número do documento não pode ficar vazio.';
      }

      if (
        normalized.includes('auth_code') &&
        (normalized.includes('vazio') ||
          normalized.includes('empty') ||
          normalized.includes('obrigatorio'))
      ) {
        return 'O código de autenticação não pode ficar vazio.';
      }

      if (
        normalized.includes('amount') ||
        normalized.includes('valor total da fatura')
      ) {
        return 'O valor total da fatura deve ser um número válido e não negativo.';
      }

      if (normalized.includes('taxes') || normalized.includes('tributos')) {
        return 'O valor de tributos da fatura é inválido.';
      }

      if (normalized.includes('discount') || normalized.includes('desconto')) {
        return 'O valor de desconto da fatura é inválido.';
      }

      if (
        normalized.includes('quantidade') ||
        normalized.includes('preco unitario') ||
        normalized.includes('valor total')
      ) {
        return 'Os itens da fatura possuem valores numéricos inválidos. Revise quantidades e preços.';
      }

      if (code === 'VALIDATION_ERROR') {
        return 'Os dados fornecidos para gerar o documento são inválidos. Revise as informações e tente novamente.';
      }
    }

    // Tratamento de campos ausentes em outros comandos
    const missingFieldMatch = rawMessage.match(
      /missing field [`'"]?([a-zA-Z0-9_]+)[`'"]?/
    );
    if (missingFieldMatch) {
      return `O campo obrigatório '${missingFieldMatch[1]}' não foi informado.`;
    }

    // Categorias padronizadas
    switch (code) {
      case 'VALIDATION_ERROR':
        return 'Os dados informados são inválidos. Revise as informações e tente novamente.';
      case 'PERMISSION_DENIED_ERROR':
        return 'Permissão negada para executar esta operação.';
      case 'NOT_FOUND_ERROR':
        return 'O registro solicitado não foi encontrado.';
      case 'STORAGE_ERROR':
        return 'Falha na persistência local de dados.';
      case 'CRYPTO_ERROR':
        return 'Falha na operação de segurança criptográfica.';
      case 'IPC_TRANSPORT_ERROR':
        return 'Falha de comunicação entre o aplicativo e o sistema nativo.';
      default:
        return 'Ocorreu um erro ao processar a solicitação.';
    }
  }
}
