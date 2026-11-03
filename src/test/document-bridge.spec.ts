import type { vi } from 'vitest';

import { it, expect, describe } from 'vitest';
import { isTauri } from '@tauri-apps/api/core';

import {
  previewDocument,
  generateDocument,
  DocumentBridgeError,
  type DocumentRequest,
  exportPreviewedDocument,
  type ExportPreviewPayload,
  type PreviewDocumentPayload,
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

  it('deve formatar mensagens de erro retornadas pelo Tauri IPC separando mensagem de interface do diagnóstico técnico', async () => {
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

    try {
      await generateDocument(payload);
      expect.unreachable('Deveria ter lançado erro');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(DocumentBridgeError);
      const bridgeErr = err as DocumentBridgeError;
      expect(bridgeErr.code).toBe('PERMISSION_DENIED_ERROR');
      expect(bridgeErr.userMessage).toBe('Permissão negada para executar esta operação.');
      expect(bridgeErr.message).toBe('Permissão negada para executar esta operação.');
      expect(bridgeErr.technicalMessage).toContain('Permissão negada pela ACL do Tauri');
    }
  });

  it('deve invocar generate_document no Tauri com payload de cessao_posse', async () => {
    const mockOutput = {
      success: true,
      file_path: '/path/contrato_cessao.pdf',
      file_name: 'contrato_cessao.pdf',
      message: 'Documento gerado e autenticado com sucesso',
      metadata: {
        document_kind: 'cessao_posse' as const,
        generated_at_utc: '2026-10-25T14:00:00Z',
        sha256_checksum: 'cessaohash789',
        byte_size: 16384,
        template_id: 'contrato_cessao_posse.typ',
      },
    };

    mockIpcResponse('generate_document', mockOutput);

    const payload: GenerateDocumentPayload = {
      request: {
        kind: 'cessao_posse',
        payload: {
          document_number: '2026-0001/CP',
          auth_code: '2026-X7Y9',
          data: {
            cedenteNome: 'João da Silva',
            cessionarioNome: 'Maria Santos',
          },
        },
      },
      open_after_export: false,
    };

    const result = await generateDocument(payload);

    expect(result.metadata.document_kind).toBe('cessao_posse');
    expect(result.metadata.template_id).toBe('contrato_cessao_posse.typ');
    expect(result.metadata.sha256_checksum).toBe('cessaohash789');
  });

  it('deve propagar erro amigável ao usuário quando document_number for vazio, preservando diagnóstico técnico', async () => {
    mockIpcError(
      'generate_document',
      'Os dados fornecidos para o documento são inválidos: O número do documento (document_number) não pode ser vazio.'
    );

    const payload: GenerateDocumentPayload = {
      request: {
        kind: 'cessao_posse',
        payload: {
          document_number: '',
          auth_code: '2026-X7Y9',
        },
      },
    };

    try {
      await generateDocument(payload);
      expect.unreachable('Deveria ter lançado erro');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(DocumentBridgeError);
      const bridgeErr = err as DocumentBridgeError;
      expect(bridgeErr.code).toBe('VALIDATION_ERROR');
      expect(bridgeErr.userMessage).toBe('O número do documento não pode ficar vazio.');
      expect(bridgeErr.message).toBe('O número do documento não pode ficar vazio.');
      expect(bridgeErr.technicalMessage).toContain('O número do documento (document_number) não pode ser vazio.');
    }
  });

  it('deve propagar erro amigável ao usuário quando auth_code for vazio, preservando diagnóstico técnico', async () => {
    mockIpcError(
      'generate_document',
      'Os dados fornecidos para o documento são inválidos: O código de autenticação (auth_code) não pode ser vazio.'
    );

    const payload: GenerateDocumentPayload = {
      request: {
        kind: 'cessao_posse',
        payload: {
          document_number: '2026-0001/CP',
          auth_code: '   ',
        },
      },
    };

    try {
      await generateDocument(payload);
      expect.unreachable('Deveria ter lançado erro');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(DocumentBridgeError);
      const bridgeErr = err as DocumentBridgeError;
      expect(bridgeErr.code).toBe('VALIDATION_ERROR');
      expect(bridgeErr.userMessage).toBe('O código de autenticação não pode ficar vazio.');
      expect(bridgeErr.message).toBe('O código de autenticação não pode ficar vazio.');
      expect(bridgeErr.technicalMessage).toContain('O código de autenticação (auth_code) não pode ser vazio.');
    }
  });

  it('deve propagar erro amigável ao usuário quando document_number for apenas espaços em branco', async () => {
    mockIpcError(
      'generate_document',
      'Os dados fornecidos para o documento são inválidos: O número do documento (document_number) não pode ser vazio.'
    );

    const payload: GenerateDocumentPayload = {
      request: {
        kind: 'cessao_posse',
        payload: {
          document_number: '   \t  ',
          auth_code: '2026-X7Y9',
        },
      },
    };

    try {
      await generateDocument(payload);
      expect.unreachable('Deveria ter lançado erro');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(DocumentBridgeError);
      const bridgeErr = err as DocumentBridgeError;
      expect(bridgeErr.code).toBe('VALIDATION_ERROR');
      expect(bridgeErr.userMessage).toBe('O número do documento não pode ficar vazio.');
      expect(bridgeErr.message).toBe('O número do documento não pode ficar vazio.');
      expect(bridgeErr.technicalMessage).toContain('document_number');
    }
  });

  it('deve propagar erro amigável ao usuário quando auth_code for string vazia', async () => {
    mockIpcError(
      'generate_document',
      'Os dados fornecidos para o documento são inválidos: O código de autenticação (auth_code) não pode ser vazio.'
    );

    const payload: GenerateDocumentPayload = {
      request: {
        kind: 'cessao_posse',
        payload: {
          document_number: '2026-0001/CP',
          auth_code: '',
        },
      },
    };

    try {
      await generateDocument(payload);
      expect.unreachable('Deveria ter lançado erro');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(DocumentBridgeError);
      const bridgeErr = err as DocumentBridgeError;
      expect(bridgeErr.code).toBe('VALIDATION_ERROR');
      expect(bridgeErr.userMessage).toBe('O código de autenticação não pode ficar vazio.');
      expect(bridgeErr.message).toBe('O código de autenticação não pode ficar vazio.');
      expect(bridgeErr.technicalMessage).toContain('auth_code');
    }
  });

  it('deve propagar erro amigável ao usuário quando document_number estiver ausente no payload', async () => {
    mockIpcError(
      'generate_document',
      "invalid args `payload`: missing field `document_number` at line 1 column 40"
    );

    const payload = {
      request: {
        kind: 'cessao_posse',
        payload: {
          auth_code: '2026-X7Y9',
        },
      },
    } as unknown as GenerateDocumentPayload;

    try {
      await generateDocument(payload);
      expect.unreachable('Deveria ter lançado erro');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(DocumentBridgeError);
      const bridgeErr = err as DocumentBridgeError;
      expect(bridgeErr.code).toBe('VALIDATION_ERROR');
      expect(bridgeErr.userMessage).toBe('O número do documento não foi informado. Revise os dados obrigatórios.');
      expect(bridgeErr.message).toBe('O número do documento não foi informado. Revise os dados obrigatórios.');
      expect(bridgeErr.technicalMessage).toContain('missing field `document_number`');
    }
  });

  it('deve propagar erro amigável ao usuário quando auth_code estiver ausente no payload', async () => {
    mockIpcError(
      'generate_document',
      "invalid args `payload`: missing field `auth_code` at line 1 column 55"
    );

    const payload = {
      request: {
        kind: 'cessao_posse',
        payload: {
          document_number: '2026-0001/CP',
        },
      },
    } as unknown as GenerateDocumentPayload;

    try {
      await generateDocument(payload);
      expect.unreachable('Deveria ter lançado erro');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(DocumentBridgeError);
      const bridgeErr = err as DocumentBridgeError;
      expect(bridgeErr.code).toBe('VALIDATION_ERROR');
      expect(bridgeErr.userMessage).toBe('O código de autenticação não foi informado.');
      expect(bridgeErr.message).toBe('O código de autenticação não foi informado.');
      expect(bridgeErr.technicalMessage).toContain('missing field `auth_code`');
    }
  });

  it('deve invocar preview_document no Tauri com payload de cessao_posse retornando páginas e SHA-256', async () => {
    const mockPreviewResult = {
      success: true,
      preview_id: 'prev-uuid-1234',
      pdf_base64: 'JVBERi0xLjcK',
      page_count: 1,
      pages: [
        {
          page_number: 1,
          width_pt: 595,
          height_pt: 842,
          svg_base64: 'PHN2Zz48L3N2Zz4=',
        },
      ],
      created_at_utc: '2026-11-03T14:00:00Z',
      expires_at_utc: '2026-11-03T14:30:00Z',
      message: 'Visualização gerada com sucesso.',
      metadata: {
        document_kind: 'cessao_posse' as const,
        generated_at_utc: '2026-11-03T14:00:00Z',
        sha256_checksum: 'a'.repeat(64),
        byte_size: 1024,
        template_id: 'contrato_cessao_posse.typ',
      },
    };

    mockIpcResponse('preview_document', mockPreviewResult);

    const payload: PreviewDocumentPayload = {
      request: {
        kind: 'cessao_posse',
        payload: {
          document_number: '2026-0001/CP',
          auth_code: '2026-X7Y9',
        },
      },
    };

    const result = await previewDocument(payload);

    expect(result.success).toBe(true);
    expect(result.preview_id).toBe('prev-uuid-1234');
    expect(result.page_count).toBe(1);
    expect(result.pages).toHaveLength(1);
    expect(result.metadata.sha256_checksum).toHaveLength(64);
  });

  it('deve invocar export_previewed_document com preview_id e expected_sha256', async () => {
    const mockExportResult = {
      success: true,
      file_path: '/downloads/Contrato_Cessao_Posse.pdf',
      file_name: 'Contrato_Cessao_Posse.pdf',
      message: 'Documento verificado e exportado com sucesso.',
      metadata: {
        document_kind: 'cessao_posse' as const,
        generated_at_utc: '2026-11-03T14:00:00Z',
        sha256_checksum: 'b'.repeat(64),
        byte_size: 2048,
        template_id: 'contrato_cessao_posse.typ',
      },
    };

    mockIpcResponse('export_previewed_document', mockExportResult);

    const payload: ExportPreviewPayload = {
      preview_id: 'prev-uuid-5678',
      expected_sha256: 'b'.repeat(64),
      open_after_export: true,
      target_file_name: 'Contrato_Cessao_Posse.pdf',
    };

    const result = await exportPreviewedDocument(payload);

    expect(result.success).toBe(true);
    expect(result.file_name).toBe('Contrato_Cessao_Posse.pdf');
    expect(result.metadata.sha256_checksum).toBe('b'.repeat(64));
  });
});
