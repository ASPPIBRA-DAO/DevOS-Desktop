import React from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { it, vi, expect, describe } from 'vitest';

import { mockIpcResponse } from './test-utils';
import {
  LedgerView,
  LEDGER_ACCOUNTS,
  LEDGER_METADATA,
  CitizenLedgerView,
  DoubleEntryChartCard,
  FinancialHistoryPrint,
  exportCitizenLedgerPdf,
  MOCK_FINANCIAL_PROFILES,
  BLANK_FINANCIAL_PROFILE,
} from '../modules/ledger';

describe('Módulo Livro-Razão (Double-Entry & Citizen Ledger)', () => {
  it('deve possuir os dados canônicos do Balanço D1 V16 consolidados', () => {
    expect(LEDGER_METADATA.reservaGenesis).toBe('R$ 1.000.000,00');
    expect(LEDGER_METADATA.transacoesConcluidas).toBe(42);
    expect(LEDGER_ACCOUNTS.length).toBeGreaterThanOrEqual(4);

    const treasuryAccount = LEDGER_ACCOUNTS.find((acc) => acc.accountId === 1);
    expect(treasuryAccount).toBeDefined();
    expect(treasuryAccount?.accountName).toBe('DAO Treasury Account');
  });

  it('deve conter perfis mockados canônicos com integridade contábil e transações', () => {
    const andressaProfile = MOCK_FINANCIAL_PROFILES.find((p) => p.associate.id === '10');
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

  it('deve possuir perfil em branco seguro para estados sem seleção', () => {
    expect(BLANK_FINANCIAL_PROFILE.associate.id).toBe('--');
    expect(BLANK_FINANCIAL_PROFILE.contract.contractedAmount).toBe(0);
    expect(BLANK_FINANCIAL_PROFILE.transactions).toEqual([]);
  });

  it('deve instanciar componentes React do módulo com assinaturas válidas', () => {
    expect(React.isValidElement(<LedgerView />)).toBe(true);
    expect(React.isValidElement(<CitizenLedgerView />)).toBe(true);
    expect(React.isValidElement(<DoubleEntryChartCard />)).toBe(true);

    const profile = MOCK_FINANCIAL_PROFILES[0];
    expect(
      React.isValidElement(
        <FinancialHistoryPrint transactions={profile.transactions} profile={profile} preview />
      )
    ).toBe(true);
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

    const profile = MOCK_FINANCIAL_PROFILES[0];
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

  it('deve executar exportCitizenLedgerPdf com fallback gracioso em ambiente Web', async () => {
    (isTauri as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);

    const originalWindow = globalThis.window;
    const printMock = vi.fn();
    // @ts-expect-error mock temporario para ambiente Node
    globalThis.window = { print: printMock };

    const profile = MOCK_FINANCIAL_PROFILES[0];

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
    expect(result.file_name).toContain('extrato_associado_10.pdf');
    expect(printMock).toHaveBeenCalled();

    globalThis.window = originalWindow;
  });
});
