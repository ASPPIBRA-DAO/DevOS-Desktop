// ----------------------------------------------------------------------
// ASPPIBRA DevOS — Livro-Razão & Double-Entry Ledger (Domain Models)
// ----------------------------------------------------------------------

export interface LedgerAccount {
  id: number;
  accountId: number;
  accountName: string;
  accountType: string;
  titular: string;
  assetCode: string;
  saldoDisponivel: string;
  saldoBloqueado: string;
  saldoTotal: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: number;
  transactionId: number;
  accountId: number;
  accountName: string;
  assetCode: string;
  direction: 'credit' | 'debit';
  amountBaseUnits: string;
  amountFormatted: string;
  createdAt: string;
}

export interface LedgerTransaction {
  id: number;
  userId: number;
  userName: string;
  type: string;
  category: 'membership' | 'operational' | 'other';
  status: 'completed' | 'failed';
  description: string;
  amountFormatted: string;
  createdAt: string;
  completedAt: string | null;
  entries: LedgerEntry[];
}

export interface ITreasuryTransaction {
  id: string;
  tenant_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  amount: number;
  currency: string;
  base_currency: string;
  base_amount: number;
  exchange_rate: number;
  type: 'income' | 'expense' | 'transfer';
  direction: 'inbound' | 'outbound';
  category: string;
  tags: string[];
  payer_id: string;
  recipient_id: string;
  counterparty_name?: string;
  origin_institution?: string;
  destination_institution?: string;
  payment_method: string;
  external_reference: string | null;
  status: 'pending' | 'confirmed' | 'failed' | 'canceled';
  reconciliation_status: 'matched' | 'unmatched' | 'manual_review';
  risk_score: {
    level: 'low' | 'medium' | 'high';
    score: number;
  };
  integrity_hash: string;
  documents: {
    id: string;
    type: string;
    verified: boolean;
  }[];
  ai_flags: {
    type: string;
    confidence: number;
  }[];
  source_channel: string;
  notes: string | null;
}

export interface ITreasuryAnalytics {
  summary: {
    totalInflow: number;
    avgTicket: number;
    count: number;
    topRecipient: string;
  };
  monthlyTrend: {
    month: string;
    total: number;
  }[];
  distribution: {
    label: string;
    value: number;
  }[];
  availableYears: string[];
  transactions: ITreasuryTransaction[];
}

export interface IAssociateProfile {
  id: string;
  name: string;
  cpf: string;
  rg: string;
  email: string;
  phone: string;
  category: string;
  photoURL?: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface IContractProfile {
  id: string;
  planName: string;
  contractedAmount: number;
  paidAmount: number;
  openAmount: number;
  status: 'Adimplente' | 'Em Atraso' | 'Em Negociação';
}

export interface IObligationProfile {
  nextDueDate: string;
  nextDueAmount: number;
  pendingInstallments: number;
  overdueInstallments: number;
}

export interface IFinancialProfile {
  associate: IAssociateProfile;
  contract: IContractProfile;
  obligations: IObligationProfile;
  transactions: ITreasuryTransaction[];
}

export interface ICitizenSummary {
  id: string | number;
  name: string;
  aspId: string;
  cpf: string;
}
