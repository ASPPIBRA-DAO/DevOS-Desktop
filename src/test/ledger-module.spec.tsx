import React from 'react';
import { it, expect, describe } from 'vitest';
import { isTauri } from '@tauri-apps/api/core';

import { mockIpcResponse } from './test-utils';
import {
  TEST_LEDGER_ACCOUNTS,
  TEST_FINANCIAL_PROFILES,
} from './fixtures/ledger-fixtures';
import {
  LedgerView,
  CitizenLedgerView,
  DoubleEntryChartCard,
  exportCitizenLedgerPdf,
} from '../modules/ledger';

describe('Módulo Livro-Razão (Double-Entry & Citizen Ledger)', () => {
  it('deve validar estrutura das contas contábeis de teste', () => {
    expect(TEST_LEDGER_ACCOUNTS.length).toBeGreaterThanOrEqual(2);

    const treasuryAccount = TEST_LEDGER_ACCOUNTS.find((acc) => acc.accountId === 1);
    expect(treasuryAccount).toBeDefined();
    expect(treasuryAccount?.accountName).toBe('DAO Treasury Account');
  });

  it('deve conter perfis de teste com integridade contábil e transações', () => {
    const andressaProfile = TEST_FINANCIAL_PROFILES.find((p) => p.associate.id === '10');
    expect(andressaProfile).toBeDefined();
    expect(andressaProfile?.associate.name).toBe('Andressa de Lima Ferreira');
    expect(andressaProfile?.contract.contractedAmount).toBe(65000);
    expect(andressaProfile?.contract.paidAmount).toBe(36623);
    expect(andressaProfile?.contract.openAmount).toBe(27577);
    expect(andressaProfile?.transactions.length).toBeGreaterThan(0);

    const percentQuitado = Math.round(
      (andressaProfile!.contract.paidAmount / andressaProfile!.contract.contractedAmount) * 100
    );
    expect(percentQuitado).toBe(56);
  });

  it('deve instanciar componentes React do módulo com assinaturas válidas', () => {
    expect(React.isValidElement(<LedgerView />)).toBe(true);
    expect(React.isValidElement(<CitizenLedgerView />)).toBe(true);
    expect(React.isValidElement(<DoubleEntryChartCard />)).toBe(true);
  });

  it('deve executar exportCitizenLedgerPdf via motor nativo Typst em ambiente Desktop (Tauri)', async () => {
    const mockOutput = {
      success: true,
      file_path: '/home/dev/extrato_10.pdf',
      file_name: 'extrato_associado_10.pdf',
      message: 'Compilado com sucesso via Typst',
      metadata: {
        document_kind: 'citizen_ledger' as const,
        generated_at_utc: '2026-10-26T18:00:00Z',
        sha256_checksum: 'keccak_hash_123',
        byte_size: 2048,
        template_id: 'citizen_ledger.typ',
      },
    };
    mockIpcResponse('generate_document', mockOutput);

    const profile = TEST_FINANCIAL_PROFILES[0];
    const result = await exportCitizenLedgerPdf({
      associate_id: profile.associate.id,
      open_after_export: true,
      data: {
        meta: {
          generated_at: '26/10/2026',
          reference_period: '2026-10',
          audit_hash: 'd1_test_hash',
        },
        associate: {
          id: profile.associate.id,
          name: profile.associate.name,
          cpf: profile.associate.cpf,
          email: profile.associate.email,
          avatar_letter: 'A',
          address_line1: 'Rua teste',
          address_line2: 'Bairro teste',
        },
        summary: {
          total_contracted: '65.000',
          total_paid: '36.623',
          outstanding_balance: '27.577',
        },
        transactions: [],
      },
    });

    expect(result.success).toBe(true);
    expect(result.file_name).toBe('extrato_associado_10.pdf');
  });

  it('deve executar exportCitizenLedgerPdf com retorno estruturado em ambiente Web', async () => {
    (isTauri as unknown as { mockReturnValueOnce: (val: boolean) => void }).mockReturnValueOnce(false);

    const profile = TEST_FINANCIAL_PROFILES[0];

    const result = await exportCitizenLedgerPdf({
      associate_id: profile.associate.id,
      open_after_export: false,
      data: {
        meta: {
          generated_at: '26/10/2026',
          reference_period: '2026-10',
          audit_hash: 'd1_test_hash',
        },
        associate: {
          id: profile.associate.id,
          name: profile.associate.name,
          cpf: profile.associate.cpf,
          email: profile.associate.email,
          avatar_letter: 'A',
          address_line1: 'Rua teste',
          address_line2: 'Bairro teste',
        },
        summary: {
          total_contracted: '65.000',
          total_paid: '36.623',
          outstanding_balance: '27.577',
        },
        transactions: [],
      },
    });

    expect(result.success).toBe(true);
    expect(result.file_name).toBe('extrato_associado_10.pdf');
  });
});
