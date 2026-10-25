/**
 * Contratos IPC do Domínio de Cadastro Imobiliário e Reconciliação
 * Sincronizados com `src-tauri/src/commands/real_estate_commands.rs`.
 */

export interface RealEstateStats {
  total_properties: number;
  total_identifiers: number;
  total_addresses: number;
  total_batches: number;
  total_batch_records: number;
  open_findings_count: number;
  pending_proposals_count: number;
  db_path: string;
}

export interface XlsxPreviewReport {
  file_path: string;
  file_hash_sha256: string;
  file_size_bytes: number;
  detected_sheets: string[];
  target_sheet: string;
  recognized_headers: string[];
  total_rows_count: number;
  sample_rows: Record<string, string>[];
  empty_matricula_sample_count: number;
  empty_address_sample_count: number;
  duplicate_matricula_sample_count: number;
  already_imported_batch_id: number | null;
  already_imported_status: string | null;
  already_imported_mode: string | null;
}

export interface ImportExecutionReport {
  batch_id: number;
  file_hash_sha256: string;
  import_mode: string;
  status: string;
  total_rows_read: number;
  total_records_imported: number;
  total_inconsistencies_detected: number;
  message: string;
  started_at: string;
  completed_at: string;
}

export interface ImportBatchSummary {
  id: number;
  source_filename: string;
  source_hash_sha256: string;
  sheet_name: string;
  import_mode: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  total_rows_read: number;
  total_records_imported: number;
  total_inconsistencies_detected: number;
  last_processed_row: number;
}

export interface AuditFindingSummary {
  id: number;
  property_id: number | null;
  batch_record_id: number | null;
  category: string;
  severity: string;
  source: string;
  description: string;
  analysis_status: string;
  created_at: string;
}

export interface PropertySummary {
  id: number;
  uuid: string;
  identifier: string | null;
  identifier_type: string | null;
  address: string | null;
  created_at: string;
  // Campos enriquecidos para exibição em formato de planilha
  matricula?: string | null;
  titular?: string | null;
  bairro?: string | null;
  rua?: string | null;
  numero?: string | null;
  quadra?: string | null;
  lote?: string | null;
  complemento?: string | null;
  status?: string;
}

