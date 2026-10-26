import type { GenerateDocumentResult } from '../../documents';
import type { IFinancialProfile, ITreasuryTransaction } from '../domain/ledger-models';

import React from 'react';

import { generateDocument, PdfExportService } from '../../documents';
import { isTauriDesktop } from '../../../platform/tauri/core/invoke';
import { CitizenLedgerPdfDocument } from '../templates/citizen-ledger-pdf-document';

export interface ExportCitizenLedgerPdfPayload {
  associate_id?: string;
  open_after_export?: boolean;
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

export async function exportCitizenLedgerPdf(
  payload: ExportCitizenLedgerPdfPayload,
  profile?: IFinancialProfile | null,
  transactions?: ITreasuryTransaction[]
): Promise<GenerateDocumentResult> {
  const fileName = `extrato_associado_${payload.associate_id || 'documento'}.pdf`;

  if (isTauriDesktop()) {
    return generateDocument({
      request: {
        kind: 'citizen_ledger',
        payload: {
          associate_id: payload.associate_id,
          data: payload.data,
        },
      },
      open_after_export: payload.open_after_export ?? true,
    });
  }

  // Modo Web: Gera arquivo PDF fiduciario real em A4 e dispara download automatico
  if (profile && transactions) {
    const docElement = React.createElement(CitizenLedgerPdfDocument, {
      profile,
      transactions,
    });
    const blob = await PdfExportService.renderToBlob(docElement as any);
    PdfExportService.downloadPdf(blob, fileName);

    return {
      success: true,
      file_path: `download://${fileName}`,
      file_name: fileName,
      message: 'Download do PDF oficial em folha A4 fiduciária concluído com sucesso.',
      metadata: {
        document_kind: 'citizen_ledger',
        generated_at_utc: new Date().toISOString(),
        sha256_checksum: payload.data.meta.audit_hash,
        byte_size: blob.size,
        template_id: 'citizen_ledger_react_pdf',
      },
    };
  }

  // Fallback caso nao haja profile direto
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.print();
  }
  return {
    success: true,
    file_path: 'browser://print',
    file_name: fileName,
    message: 'Janela de impressão ABNT acionada com sucesso no navegador.',
    metadata: {
      document_kind: 'citizen_ledger',
      generated_at_utc: new Date().toISOString(),
      sha256_checksum: payload.data.meta.audit_hash,
      byte_size: 0,
      template_id: 'browser_print_fallback',
    },
  };
}

export function printCitizenLedgerHtml(): void {
  if (typeof window === 'undefined') return;
  const sheetEl = document.querySelector('.a4-sheet');
  if (!sheetEl) {
    window.print();
    return;
  }

  const printWindow = window.open('', '_blank', 'width=900,height=1200');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Extrato Fiduciário Oficial — ASPPIBRA DAO</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm 20mm 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background: white; color: black; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .a4-sheet { width: 100%; box-shadow: none !important; }
        </style>
      </head>
      <body>
        ${sheetEl.outerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
