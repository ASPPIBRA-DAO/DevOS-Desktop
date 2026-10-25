import React from 'react';
import { it, expect, describe } from 'vitest';
import { Text, View, Document } from '@react-pdf/renderer';

import { PdfExportService } from '../modules/documents/services/pdf-export-service';
import { DocumentLayout } from '../modules/documents/templates/shared/document-layout';
import { ReportCompilerService } from '../modules/reports/services/report-compiler-service';
import { RealEstateReconciliationReport } from '../modules/reports/templates/real-estate-reconciliation-report';

describe('Módulos Documents & Reports — Geração e Compilação', () => {
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

  it('deve compilar o modelo de relatório analítico a partir dos dados do backend', () => {
    const compiled = ReportCompilerService.compileReconciliationReport(
      mockStats,
      mockBatches,
      mockFindings
    );

    expect(compiled.stats.totalProperties).toBe(42);
    expect(compiled.stats.openFindingsCount).toBe(2);
    expect(compiled.batches).toHaveLength(1);
    expect(compiled.batches[0].filename).toBe('lote_teste_01.xlsx');
    expect(compiled.findings).toHaveLength(1);
    expect(compiled.findings[0].category).toBe('DUPLICATE_IDENTIFIER');
  });

  it('deve suportar compilação segura mesmo sem lotes ou apontamentos', () => {
    const compiled = ReportCompilerService.compileReconciliationReport(mockStats);

    expect(compiled.stats.totalProperties).toBe(42);
    expect(compiled.batches).toEqual([]);
    expect(compiled.findings).toEqual([]);
  });

  it('deve gerar um Blob PDF real e válido com cabeçalho mágico %PDF-', async () => {
    const testDoc = (
      <Document>
        <DocumentLayout title="Documento de Teste DevOS" systemTag="Test Environment">
          <View>
            <Text>Conteúdo de validação do motor React-PDF v4</Text>
          </View>
        </DocumentLayout>
      </Document>
    );

    const blob = await PdfExportService.renderToBlob(testDoc);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(500);
    expect(blob.type).toBe('application/pdf');

    // Validação da assinatura mágica do cabeçalho binário do PDF (%PDF-)
    const arrayBuffer = await blob.arrayBuffer();
    const headerBytes = new Uint8Array(arrayBuffer.slice(0, 5));
    const headerString = String.fromCharCode(...headerBytes);
    expect(headerString).toBe('%PDF-');
  });

  it('deve renderizar o relatório analítico completo de reconciliação em formato PDF real', async () => {
    const compiled = ReportCompilerService.compileReconciliationReport(
      mockStats,
      mockBatches,
      mockFindings
    );
    const reportElement = <RealEstateReconciliationReport data={compiled} />;

    const blob = await PdfExportService.renderToBlob(reportElement);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toBe('application/pdf');

    const arrayBuffer = await blob.arrayBuffer();
    const headerString = String.fromCharCode(...new Uint8Array(arrayBuffer.slice(0, 5)));
    expect(headerString).toBe('%PDF-');
  });
});
