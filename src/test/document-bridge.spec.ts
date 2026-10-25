import type { vi } from 'vitest';

import { it, expect, describe } from 'vitest';
import { isTauri } from '@tauri-apps/api/core';

import {
  generateDocument,
  type DocumentRequest,
  type GenerateDocumentPayload,
} from 'src/platform/tauri';

import { mockIpcError, mockIpcResponse } from './test-utils';

describe('DocumentBridge — Native Typst Engine IPC Contract', () => {
  it('deve lançar erro quando invocado fora do ambiente nativo desktop', async () => {
    (isTauri as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);

    const payload: GenerateDocumentPayload = {
      request: {
        kind: 'citizen_ledger',
        payload: {
          data: {
            meta: { generated_at: '2026-10-25', reference_period: '2026-10', audit_hash: 'h1' },
            associate: {
              id: '1',
              name: 'Teste',
              cpf: '000',
              email: 'a@b.c',
              avatar_letter: 'T',
              address_line1: 'R1',
              address_line2: 'R2',
            },
            summary: { total_contracted: '100', total_paid: '100', outstanding_balance: '0' },
            transactions: [],
          },
        },
      },
    };

    await expect(generateDocument(payload)).rejects.toThrow(
      "Ambiente não suportado: O comando nativo 'generate_document' exige execução dentro do aplicativo Desktop DevOS (Tauri v2)."
    );
  });

  it('deve invocar generate_document no Tauri com payload de citizen_ledger', async () => {
    const mockOutput = {
      success: true,
      file_path: '/path/extrato.pdf',
      file_name: 'extrato.pdf',
      message: 'Documento gerado e autenticado com sucesso',
      metadata: {
        document_kind: 'citizen_ledger' as const,
        generated_at_utc: '2026-10-25T14:00:00Z',
        sha256_checksum: 'keccak256_hash_mock_123',
        byte_size: 4096,
        template_id: 'extrato_citizen_ledger.typ',
      },
    };

    mockIpcResponse('generate_document', mockOutput);

    const payload: GenerateDocumentPayload = {
      request: {
        kind: 'citizen_ledger',
        payload: {
          associate_id: 'ASSOC-01',
          data: {
            meta: { generated_at: '25/10/2026', reference_period: '2026-10', audit_hash: 'audit_proof' },
            associate: {
              id: 'ASSOC-01',
              name: 'Associado Teste',
              cpf: '123.456.789-00',
              email: 'assoc@test.com',
              avatar_letter: 'A',
              address_line1: 'Rua A',
              address_line2: 'Cidade B',
            },
            summary: { total_contracted: '5000', total_paid: '5000', outstanding_balance: '0' },
            transactions: [],
          },
        },
      },
      open_after_export: false,
    };

    const result = await generateDocument(payload);

    expect(result).toEqual(mockOutput);
    expect(result.metadata.document_kind).toBe('citizen_ledger');
    expect(result.metadata.template_id).toBe('extrato_citizen_ledger.typ');
  });

  it('deve invocar generate_document no Tauri com payload de invoice_bill', async () => {
    const mockOutput = {
      success: true,
      file_path: '/path/fatura.pdf',
      file_name: 'fatura.pdf',
      message: 'Documento gerado e autenticado com sucesso',
      metadata: {
        document_kind: 'invoice_bill' as const,
        generated_at_utc: '2026-10-25T14:00:00Z',
        sha256_checksum: 'mockinvoicehash456',
        byte_size: 8192,
        template_id: 'invoice_bill.typ',
      },
    };

    mockIpcResponse('generate_document', mockOutput);

    const request: DocumentRequest = {
      kind: 'invoice_bill',
      payload: {
        id: 'INV-001',
        member_name: 'Membro Teste',
        member_doc: 'CPF 000.000.000-00',
        description: 'Serviço Mensal',
        reference_month: '2026-10',
        amount: 2500,
        due_date: '2026-10-30',
        payment_method: 'Pix',
        status: 'paid',
        items: [
          {
            id: 'it1',
            description: 'Item 1',
            quantity: 1,
            price: 2500,
            total: 2500,
          },
        ],
      },
    };

    const payload: GenerateDocumentPayload = {
      request,
      open_after_export: true,
    };

    const result = await generateDocument(payload);

    expect(result.metadata.document_kind).toBe('invoice_bill');
    expect(result.metadata.sha256_checksum).toBe('mockinvoicehash456');
  });

  it('deve formatar mensagens de erro retornadas pelo Tauri IPC', async () => {
    mockIpcError('generate_document', 'Permissão negada pela ACL do Tauri');

    const payload: GenerateDocumentPayload = {
      request: {
        kind: 'citizen_ledger',
        payload: {
          data: {
            meta: { generated_at: '2026-10-25', reference_period: '2026-10', audit_hash: 'h1' },
            associate: {
              id: '1',
              name: 'Teste',
              cpf: '000',
              email: 'a@b.c',
              avatar_letter: 'T',
              address_line1: 'R1',
              address_line2: 'R2',
            },
            summary: { total_contracted: '100', total_paid: '100', outstanding_balance: '0' },
            transactions: [],
          },
        },
      },
    };

    await expect(generateDocument(payload)).rejects.toThrow(
      '[Rust Core IPC Error] (generate_document): Permissão negada pela ACL do Tauri'
    );
  });
});
