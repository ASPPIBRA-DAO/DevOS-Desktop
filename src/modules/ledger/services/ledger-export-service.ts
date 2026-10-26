import type { GenerateDocumentResult } from '../../documents';

import { generateDocument } from '../../documents';
import { isTauriDesktop } from '../../../platform/tauri/core/invoke';

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
  payload: ExportCitizenLedgerPdfPayload
): Promise<GenerateDocumentResult> {
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

  // Fallback para modo Web: aciona a impressao/preview do navegador
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.print();
  }
  return {
    success: true,
    file_path: 'browser://print',
    file_name: `extrato_associado_${payload.associate_id || 'documento'}.pdf`,
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
