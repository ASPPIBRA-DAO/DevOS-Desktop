/**
 * ASPPIBRA DevOS — Document Generation IPC Contracts (Typst Engine)
 *
 * Define contratos tipados para requisições e respostas de compilação
 * e autenticação de documentos oficiais e relatórios em PDF.
 */

export type DocumentKind = 'citizen_ledger' | 'invoice_bill';

export interface DocumentMetadata {
  document_kind: DocumentKind;
  generated_at_utc: string;
  sha256_checksum: string;
  byte_size: number;
  template_id: string;
}

export interface CitizenLedgerPayload {
  associate_id?: string;
  data: {
    meta: {
      generated_at: string;
      reference_period: string;
      audit_hash: string;
    };
    associate: {
      id: string;
      name: string;
      cpf: string;
      email: string;
      avatar_letter: string;
      address_line1: string;
      address_line2: string;
    };
    summary: {
      total_contracted: string;
      total_paid: string;
      outstanding_balance: string;
    };
    transactions: Array<{
      date: string;
      counterparty: string;
      origin: string;
      destination: string;
      amount: string;
      direction: 'inbound' | 'outbound';
      status_label: string;
      status_variant: 'confirmed' | 'danger' | 'muted';
    }>;
  };
}

export interface InvoiceReportItem {
  id: string;
  description: string;
  service?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceReportPayload {
  id: string;
  member_name: string;
  member_doc: string;
  member_email?: string;
  member_address?: string;
  description: string;
  reference_month: string;
  amount: number;
  due_date: string;
  settled_date?: string;
  payment_method: string;
  status: string;
  items: InvoiceReportItem[];
  taxes?: number;
  discount?: number;
  d1_protocol?: string;
}

export type DocumentRequest =
  | { kind: 'citizen_ledger'; payload: CitizenLedgerPayload }
  | { kind: 'invoice_bill'; payload: InvoiceReportPayload };

export interface GenerateDocumentPayload {
  request: DocumentRequest;
  open_after_export?: boolean;
  target_file_name?: string;
}

export interface GenerateDocumentResult {
  success: boolean;
  file_path: string;
  file_name: string;
  message: string;
  metadata: DocumentMetadata;
}
