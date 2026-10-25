import type {
  GenerateDocumentResult,
  GenerateDocumentPayload,
} from '../contracts/document-contracts';

import { invokeNative } from '../core/invoke';

/**
 * ASPPIBRA DevOS — Document Bridge (Typst Engine)
 *
 * Provê interface desacoplada para invocar a compilação nativa de documentos
 * com hash Keccak-256 e salvamento local através do Tauri v2.
 */
export async function generateDocument(
  payload: GenerateDocumentPayload
): Promise<GenerateDocumentResult> {
  return invokeNative<GenerateDocumentResult>('generate_document', { payload });
}
