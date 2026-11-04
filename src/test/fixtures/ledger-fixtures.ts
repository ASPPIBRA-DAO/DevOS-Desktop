import type {
  LedgerAccount,
  ICitizenSummary,
  IFinancialProfile,
  ITreasuryTransaction,
} from 'src/modules/ledger/domain/ledger-models';

export const TEST_LEDGER_ACCOUNTS: LedgerAccount[] = [
  {
    id: 1,
    accountId: 1,
    accountName: 'DAO Treasury Account',
    accountType: 'treasury',
    titular: 'Tesouraria / Sistema',
    assetCode: 'BRL',
    saldoDisponivel: 'R$ 1,000,000.00',
    saldoBloqueado: 'R$ 0.00',
    saldoTotal: 'R$ 1,000,000.00',
    updatedAt: '2026-08-19 15:57:47 UTC',
  },
  {
    id: 2,
    accountId: 4,
    accountName: 'Felipe Dev Primary Account',
    accountType: 'user_available',
    titular: 'Felipe Dev',
    assetCode: 'BRL',
    saldoDisponivel: 'R$ 1,000.00',
    saldoBloqueado: 'R$ 0.00',
    saldoTotal: 'R$ 1,000.00',
    updatedAt: '2026-08-19 15:57:47 UTC',
  },
];

export const TEST_TRANSACTION: ITreasuryTransaction = {
  id: 'tx-001',
  tenant_id: 'tenant-asppibra',
  version: 1,
  created_at: '2026-10-10T14:30:00Z',
  updated_at: '2026-10-10T14:30:00Z',
  processed_at: '2026-10-10T14:30:00Z',
  amount: 950,
  currency: 'BRL',
  base_currency: 'BRL',
  base_amount: 950,
  exchange_rate: 1,
  type: 'income',
  direction: 'inbound',
  category: 'Mensalidade',
  tags: ['mensalidade'],
  payer_id: '10',
  recipient_id: '1',
  counterparty_name: 'Tesouraria ASPPIBRA',
  origin_institution: 'Banco Itaú',
  destination_institution: 'Cora SCD',
  payment_method: 'Pix',
  external_reference: 'PIX-12345',
  status: 'confirmed',
  reconciliation_status: 'matched',
  risk_score: {
    level: 'low',
    score: 0.05,
  },
  integrity_hash: '0x1234abcd',
  documents: [],
  ai_flags: [],
  source_channel: 'app',
  notes: null,
};

export const TEST_FINANCIAL_PROFILES: IFinancialProfile[] = [
  {
    associate: {
      id: '10',
      name: 'Andressa de Lima Ferreira',
      cpf: '173.793.567-80',
      rg: '24.891.002-9',
      email: 'andressa.ferreira@email.com',
      phone: '+55 21 98765-4321',
      category: 'Associada Titular',
      photoURL: '',
      status: 'active',
    },
    contract: {
      id: '#2024001',
      planName: 'Contrato de Adesão & Governança',
      contractedAmount: 65000,
      paidAmount: 36623,
      openAmount: 27577,
      status: 'Adimplente',
    },
    obligations: {
      nextDueDate: '2026-11-10',
      nextDueAmount: 950,
      pendingInstallments: 29,
      overdueInstallments: 0,
    },
    transactions: [TEST_TRANSACTION],
  },
];

export const TEST_CITIZENS: ICitizenSummary[] = [
  {
    id: '10',
    aspId: 'ASP-10',
    name: 'Andressa de Lima Ferreira',
    cpf: '173.793.567-80',
  },
];
