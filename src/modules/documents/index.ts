export * from './presentation/catalog/data/document-templates-registry';

export { DocumentTemplatesGalleryView } from './presentation/catalog/DocumentTemplatesGalleryView';

// ASPPIBRA DevOS — Motor Documental Nativo (Typst Engine & Tauri IPC)
export {
  previewDocument,
  generateDocument,
  DocumentBridgeError,
  exportPreviewedDocument,
} from '../../platform/tauri';
export type {
  DocumentKind,
  DocumentRequest,
  DocumentMetadata,
  InvoiceReportItem,
  CessaoPossePayload,
  DocumentPreviewPage,
  CitizenLedgerPayload,
  InvoiceReportPayload,
  ExportPreviewPayload,
  DocumentPreviewResult,
  GenerateDocumentResult,
  PreviewDocumentPayload,
  GenerateDocumentPayload,
  RealEstateReconciliationPayload,
} from '../../platform/tauri';
