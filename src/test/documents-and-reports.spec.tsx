import { it, expect, describe } from 'vitest';

import { mockIpcResponse } from './test-utils';
import { generateDocument } from '../modules/documents';
import { ReportCompilerService } from '../modules/reports/services/report-compiler-service';

describe('Módulos Documents & Reports — Geração e Compilação Nativa', () => {
  const mockStats = {
    total_properties: 42,
    total_identifiers: 84,
    total_addresses: 42,
    total_batches: 3,
    total_batch_records: 120,
    open_findings_count: 2,
    pending_proposals_count: 1,
    db_path: '/tmp/test_real_estate.sqlite',
  };

  const mockBatches = [
    {
      id: 1,
      source_filename: 'lote_teste_01.xlsx',
      source_hash_sha256: 'a1b2c3d4e5f6',
      sheet_name: 'Imoveis',
      import_mode: 'upsert',
      started_at: '2026-10-24T10:00:00Z',
      completed_at: '2026-10-24T10:01:00Z',
      status: 'completed',
      total_rows_read: 50,
      total_records_imported: 50,
      total_inconsistencies_detected: 1,
      last_processed_row: 50,
    },
  ];

  const mockFindings = [
    {
      id: 101,
      property_id: 1,
      batch_record_id: 12,
      category: 'DUPLICATE_IDENTIFIER',
      severity: 'high',
      source: 'INGESTION',
      description: 'Matrícula duplicada detectada na planilha.',
      analysis_status: 'OPEN',
      created_at: '2026-10-24T10:01:00Z',
    },
  ];

  const mockProperties = [
    {
      id: 1,
      uuid: 'uuid-1',
      identifier: '7656.0',
      identifier_type: 'MATRICULA',
      address: 'Rua DOIS, 0 - Chácaras de Inoã',
      created_at: '2026-10-24T10:00:00Z',
      matricula: '7656.0',
      titular: 'BRUNO NUNES SANTOS',
      bairro: 'Chácaras de Inoã',
      rua: 'DOIS',
      numero: '0',
      quadra: '0.0',
      lote: '39.0',
      complemento: 'Chácaras de Inoã',
      status: 'NORMALIZADO',
    },
  ];

  it('deve compilar o modelo de relatório analítico a partir dos dados do backend', () => {
    const compiled = ReportCompilerService.compileReconciliationReport(
      mockStats,
      mockBatches,
      mockFindings,
      mockProperties
    );

    expect(compiled.stats.totalProperties).toBe(42);
    expect(compiled.stats.openFindingsCount).toBe(2);
    expect(compiled.batches).toHaveLength(1);
    expect(compiled.batches[0].filename).toBe('lote_teste_01.xlsx');
    expect(compiled.findings).toHaveLength(1);
    expect(compiled.findings[0].category).toBe('DUPLICATE_IDENTIFIER');
    expect(compiled.properties).toHaveLength(1);
    expect(compiled.properties[0].matricula).toBe('7656.0');
    expect(compiled.properties[0].contribuinte).toBe('BRUNO NUNES SANTOS');
    expect(compiled.properties[0].rua).toBe('DOIS');
  });

  it('deve suportar compilação segura mesmo sem lotes ou apontamentos', () => {
    const compiled = ReportCompilerService.compileReconciliationReport(mockStats);

    expect(compiled.stats.totalProperties).toBe(42);
    expect(compiled.batches).toEqual([]);
    expect(compiled.findings).toEqual([]);
    expect(compiled.properties).toEqual([]);
  });

  it('deve orquestrar a geração do relatório analítico via motor nativo Typst (IPC generate_document)', async () => {
    const compiled = ReportCompilerService.compileReconciliationReport(
      mockStats,
      mockBatches,
      mockFindings,
      mockProperties
    );

    const mockOutput = {
      success: true,
      file_path: '/tmp/relatorio-cadastral-marica.pdf',
      file_name: 'relatorio-cadastral-marica.pdf',
      message: 'Documento gerado com sucesso.',
      metadata: {
        document_kind: 'real_estate_reconciliation' as const,
        generated_at_utc: '2026-10-31T13:00:00Z',
        sha256_checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        byte_size: 15420,
        template_id: 'real_estate_reconciliation.typ',
      },
    };
    mockIpcResponse('generate_document', mockOutput);

    const result = await generateDocument({
      request: {
        kind: 'real_estate_reconciliation',
        payload: {
          data: compiled as unknown as Record<string, unknown>,
        },
      },
      open_after_export: true,
      target_file_name: 'relatorio-cadastral-marica.pdf',
    });

    expect(result.success).toBe(true);
    expect(result.file_name).toBe('relatorio-cadastral-marica.pdf');
    expect(result.metadata.document_kind).toBe('real_estate_reconciliation');
    expect(result.metadata.template_id).toBe('real_estate_reconciliation.typ');
    expect(result.metadata.sha256_checksum).toHaveLength(64);
  });
});
