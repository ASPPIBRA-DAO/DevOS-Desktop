import { invokeNative } from '../core/invoke';
import {
  type PropertySummary,
  type RealEstateStats,
  type XlsxPreviewReport,
  type ImportBatchSummary,
  type AuditFindingSummary,
  type ImportExecutionReport,
} from '../contracts/real-estate-contracts';

// Re-exportações de tipos para compatibilidade com consumidores existentes
export type {
  PropertySummary,
  RealEstateStats,
  XlsxPreviewReport,
  ImportBatchSummary,
  AuditFindingSummary,
  ImportExecutionReport,
};

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
