export * from './services/pdf-export-service';
export * from './templates/shared/document-footer';

export * from './templates/shared/document-header';
export * from './templates/shared/document-layout';
// Motor Nativo Typst e Bridges IPC
export { generateDocument } from '../../platform/tauri';
// Exportações Públicas do Módulo Documents
export * from './presentation/components/pdf-preview-dialog';
export type {
  DocumentKind,
  DocumentRequest,
  DocumentMetadata,
  InvoiceReportItem,
  CitizenLedgerPayload,
  InvoiceReportPayload,
  GenerateDocumentResult,
  GenerateDocumentPayload,
} from '../../platform/tauri';
