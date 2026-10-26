import type {
  RealEstateStats,
  PropertySummary,
  ImportBatchSummary,
  AuditFindingSummary,
} from '../../../platform/tauri/real-estate/real-estate-bridge';

export interface ReconciliationReportPropertyItem {
  id: number;
  matricula: string;
  contribuinte: string;
  bairro: string;
  rua: string;
  numero: string;
  quadra: string;
  lote: string;
  complemento: string;
}

export interface ReconciliationReportModel {
  generatedAt: string;
  stats: {
    totalProperties: number;
    totalIdentifiers: number;
    totalAddresses: number;
    totalBatches: number;
    openFindingsCount: number;
    pendingProposalsCount: number;
  };
  batches: Array<{
    id: number;
    filename: string;
    status: string;
    mode: string;
    importedRecords: number;
    inconsistencies: number;
  }>;
  findings: Array<{
    id: number;
    category: string;
    severity: string;
    description: string;
    status: string;
  }>;
  properties: ReconciliationReportPropertyItem[];
}

export class ReportCompilerService {
  /**
   * Compila dados brutos das pontes nativas em um modelo analítico estruturado para relatórios.
   */
  static compileReconciliationReport(
    stats: RealEstateStats,
    batches: ImportBatchSummary[] = [],
    findings: AuditFindingSummary[] = [],
    properties: PropertySummary[] = []
  ): ReconciliationReportModel {
    return {
      generatedAt: new Date().toLocaleString('pt-BR'),
      stats: {
        totalProperties: stats.total_properties,
        totalIdentifiers: stats.total_identifiers,
        totalAddresses: stats.total_addresses,
        totalBatches: stats.total_batches,
        openFindingsCount: stats.open_findings_count,
        pendingProposalsCount: stats.pending_proposals_count,
      },
      batches: batches.slice(0, 10).map((b) => ({
        id: b.id,
        filename: b.source_filename,
        status: b.status,
        mode: b.import_mode,
        importedRecords: b.total_records_imported,
        inconsistencies: b.total_inconsistencies_detected,
      })),
      findings: findings.slice(0, 15).map((f) => ({
        id: f.id,
        category: f.category,
        severity: f.severity,
        description: f.description,
        status: f.analysis_status,
      })),
      properties: properties.map((p) => ({
        id: p.id,
        matricula: p.matricula || p.identifier || '—',
        contribuinte: p.titular || '—',
        bairro: p.bairro || '—',
        rua: p.rua || '—',
        numero: p.numero || 'S/N',
        quadra: p.quadra || '—',
        lote: p.lote || '—',
        complemento: p.complemento || '—',
      })),
    };
  }
}
