import { invokeNative } from '../core/invoke';

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
}

export const RealEstateBridge = {
  /**
   * Consulta métricas consolidadas do banco de dados do Cadastro Imobiliário local (real_estate.sqlite).
   * Disponível exclusivamente na edição DevOS Cockpit.
   */
  async getStats(): Promise<RealEstateStats> {
    return invokeNative<RealEstateStats>('get_real_estate_stats');
  },

  /**
   * Gera prévia detalhada da planilha XLSX sem gravar dados nas tabelas cadastrais.
   */
  async previewImport(filePath: string, sheetName?: string): Promise<XlsxPreviewReport> {
    return invokeNative<XlsxPreviewReport>('preview_real_estate_import', {
      filePath,
      sheetName: sheetName ?? null,
    });
  },

  /**
   * Executa a importação controlada em lotes transacionais com proveniência e detecção de duplicidades.
   */
  async executeImport(filePath: string, sheetName: string, rowLimit?: number): Promise<ImportExecutionReport> {
    return invokeNative<ImportExecutionReport>('execute_real_estate_import', {
      filePath,
      sheetName,
      rowLimit: rowLimit ?? null,
    });
  },

  /**
   * Lista os lotes de importação já processados.
   */
  async listBatches(limit?: number): Promise<ImportBatchSummary[]> {
    return invokeNative<ImportBatchSummary[]>('list_import_batches', {
      limit: limit ?? null,
    });
  },

  /**
   * Lista as inconsistências detectadas pelo importador de auditoria.
   */
  async listFindings(limit?: number): Promise<AuditFindingSummary[]> {
    return invokeNative<AuditFindingSummary[]>('list_audit_findings', {
      limit: limit ?? null,
    });
  },

  /**
   * Lista propriedades cadastradas no banco local.
   */
  async listProperties(limit?: number): Promise<PropertySummary[]> {
    return invokeNative<PropertySummary[]>('list_properties', {
      limit: limit ?? null,
    });
  },

  /**
   * Abre o seletor nativo do sistema operacional para escolha de arquivo XLSX.
   */
  async selectFile(): Promise<string | null> {
    return invokeNative<string | null>('select_spreadsheet_file');
  },
};
