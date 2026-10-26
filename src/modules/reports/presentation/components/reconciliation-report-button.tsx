import type {
  RealEstateStats,
  PropertySummary,
  ImportBatchSummary,
  AuditFindingSummary,
} from '../../../../platform/tauri/real-estate/real-estate-bridge';

import React, { useState } from 'react';

import Button from '@mui/material/Button';

import { PdfPreviewDialog } from '../../../documents';
import { ReportCompilerService } from '../../services/report-compiler-service';
import { RealEstateReconciliationReport } from '../../templates/real-estate-reconciliation-report';

export interface ReconciliationReportButtonProps {
  stats: RealEstateStats | null;
  batches?: ImportBatchSummary[];
  findings?: AuditFindingSummary[];
  properties?: PropertySummary[];
  disabled?: boolean;
}

export const ReconciliationReportButton: React.FC<ReconciliationReportButtonProps> = ({
  stats,
  batches = [],
  findings = [],
  properties = [],
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  if (!stats) return null;

  const reportModel = ReportCompilerService.compileReconciliationReport(
    stats,
    batches,
    findings,
    properties
  );
  const documentElement = <RealEstateReconciliationReport data={reportModel} />;

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setOpen(true)}
        disabled={disabled}
        sx={{
          borderColor: '#00e5ff',
          color: '#00e5ff',
          textTransform: 'none',
          fontWeight: 600,
          '&:hover': {
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(0, 229, 255, 0.08)',
          },
        }}
      >
        Exportar Relatório PDF
      </Button>

      <PdfPreviewDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Relatório de Reconciliação Cadastral"
        filename={`relatorio-reconciliacao-${Date.now()}.pdf`}
        documentElement={documentElement}
      />
    </>
  );
};
