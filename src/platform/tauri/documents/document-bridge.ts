import type {
  ExportPreviewPayload,
  DocumentPreviewResult,
  GenerateDocumentResult,
  PreviewDocumentPayload,
  GenerateDocumentPayload,
} from '../contracts/document-contracts';

import { invokeNative } from '../core/invoke';
import { TauriErrorMapper } from '../core/tauri-errors';
import { IpcError, type IpcErrorCode } from '../contracts/ipc-errors';

/**
 * Erro de fronteira na geração documental do DevOS.
 *
 * Separa a apresentação amigável voltada para o usuário (interface/toast)
 * dos diagnósticos técnicos detalhados destinados aos desenvolvedores e auditoria.
 */
export class DocumentBridgeError extends Error {
  public readonly code: IpcErrorCode;

  public readonly command: string;

  public readonly technicalMessage: string;

  public readonly userMessage: string;

  constructor(
    userMessage: string,
    technicalMessage: string,
    code: IpcErrorCode = 'VALIDATION_ERROR',
    command = 'generate_document'
  ) {
    super(userMessage);
    this.name = 'DocumentBridgeError';
    this.code = code;
    this.command = command;
    this.technicalMessage = technicalMessage;
    this.userMessage = userMessage;
  }
}

/**
 * ASPPIBRA DevOS — Document Bridge (Typst Engine)
 *
 * Provê interface desacoplada para invocar a compilação nativa de documentos
 * com integridade SHA-256 e salvamento local através do Tauri v2.
 */
export async function generateDocument(
  payload: GenerateDocumentPayload
): Promise<GenerateDocumentResult> {
  try {
    return await invokeNative<GenerateDocumentResult>('generate_document', {
      payload,
    });
  } catch (err: unknown) {
    if (err instanceof DocumentBridgeError) {
      throw err;
    }

    const normalized = TauriErrorMapper.normalize(err, 'generate_document');
    const technicalDetail =
      err instanceof IpcError
        ? err.technicalMessage
        : err instanceof Error
          ? err.message
          : normalized.technicalMessage;

    throw new DocumentBridgeError(
      normalized.userMessage,
      technicalDetail,
      normalized.code,
      'generate_document'
    );
  }
}

/**
 * Compila o documento Typst em memória no backend e retorna o preview do PDF
 * com SHA-256 e páginas vetoriais para renderização no visualizador interno.
 * Não grava em disco e não abre visualizadores externos do SO.
 */
export async function previewDocument(
  payload: PreviewDocumentPayload
): Promise<DocumentPreviewResult> {
  try {
    return await invokeNative<DocumentPreviewResult>('preview_document', {
      payload,
    });
  } catch (err: unknown) {
    if (err instanceof DocumentBridgeError) {
      throw err;
    }

    const normalized = TauriErrorMapper.normalize(err, 'preview_document');
    const technicalDetail =
      err instanceof IpcError
        ? err.technicalMessage
        : err instanceof Error
          ? err.message
          : normalized.technicalMessage;

    throw new DocumentBridgeError(
      normalized.userMessage,
      technicalDetail,
      normalized.code,
      'preview_document'
    );
  }
}

/**
 * Exporta em disco exatamente os mesmos bytes de um PDF previamente visualizado,
 * validando o ID do preview e a igualdade estrita do SHA-256.
 * Nunca recompila o documento no momento da exportação.
 */
export async function exportPreviewedDocument(
  payload: ExportPreviewPayload
): Promise<GenerateDocumentResult> {
  try {
    return await invokeNative<GenerateDocumentResult>('export_previewed_document', {
      payload,
    });
  } catch (err: unknown) {
    if (err instanceof DocumentBridgeError) {
      throw err;
    }

    const normalized = TauriErrorMapper.normalize(err, 'export_previewed_document');
    const technicalDetail =
      err instanceof IpcError
        ? err.technicalMessage
        : err instanceof Error
          ? err.message
          : normalized.technicalMessage;

    throw new DocumentBridgeError(
      normalized.userMessage,
      technicalDetail,
      normalized.code,
      'export_previewed_document'
    );
  }
}
