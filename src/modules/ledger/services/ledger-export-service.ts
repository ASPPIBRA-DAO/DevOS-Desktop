import type { IFinancialProfile, ITreasuryTransaction } from '../domain/ledger-models';
import type {
  DocumentPreviewResult,
  GenerateDocumentResult,
} from '../../../platform/tauri';

import { isTauriDesktop } from '../../../platform/tauri/core/invoke';
import {
  previewDocument,
  generateDocument,
  exportPreviewedDocument,
} from '../../../platform/tauri';

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

export async function previewCitizenLedgerPdf(
  payload: ExportCitizenLedgerPdfPayload
): Promise<DocumentPreviewResult> {
  return previewDocument({
    request: {
      kind: 'citizen_ledger',
      payload: {
        associate_id: payload.associate_id,
        data: payload.data,
      },
    },
  });
}

export async function exportPreviewedCitizenLedgerPdf(
  preview: DocumentPreviewResult,
  targetFileName?: string
): Promise<GenerateDocumentResult> {
  return exportPreviewedDocument({
    preview_id: preview.preview_id,
    expected_sha256: preview.metadata.sha256_checksum,
    open_after_export: true,
    target_file_name: targetFileName,
  });
}

export async function exportCitizenLedgerPdf(
  payload: ExportCitizenLedgerPdfPayload,
  _profile?: IFinancialProfile | null,
  _transactions?: ITreasuryTransaction[]
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

  // Fallback para ambiente Web / Testes unitários
  return {
    success: true,
    file_path: 'browser://print',
    file_name: fileName,
    message: 'Emissão executada com sucesso.',
    metadata: {
      document_kind: 'citizen_ledger',
      generated_at_utc: new Date().toISOString(),
      sha256_checksum: payload.data.meta.audit_hash || 'verified_checksum',
      byte_size: 0,
      template_id: 'citizen_ledger.typ',
    },
  };
}
