import type { IFinancialProfile, ITreasuryTransaction } from '../domain/ledger-models';

import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

import { fDate } from '../../../shared/utils/format-time';
import { fNumber } from '../../../shared/utils/format-number';

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 36,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    color: '#2D3748',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1.5,
    borderBottomColor: '#10B981',
    paddingBottom: 10,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  headerTitleGreen: {
    color: '#10B981',
  },
  headerSubtitle: {
    fontSize: 8,
    color: '#718096',
    marginTop: 2,
  },
  headerRef: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'right',
  },
  headerRefSub: {
    fontSize: 7,
    color: '#718096',
    textAlign: 'right',
  },
  // Perfil do Titular
  profileCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#E6F8F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  profileCol: {
    flex: 1,
  },
  profileName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  profileLabel: {
    fontSize: 6.5,
    color: '#718096',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  profileVal: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  profileValSub: {
    fontSize: 7.5,
    color: '#4A5568',
  },
  // Resumo Executivo
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryBoxTotal: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 3.5,
    borderLeftColor: '#1A202C',
    padding: 8,
    borderRadius: 3,
  },
  summaryBoxPaid: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 3.5,
    borderLeftColor: '#10B981',
    padding: 8,
    borderRadius: 3,
  },
  summaryBoxOpen: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FED7D7',
    borderLeftWidth: 3.5,
    borderLeftColor: '#E53E3E',
    backgroundColor: '#FFF5F5',
    padding: 8,
    borderRadius: 3,
  },
  summaryLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#718096',
    textTransform: 'uppercase',
  },
  summaryLabelOpen: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#E53E3E',
    textTransform: 'uppercase',
  },
  summaryAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A202C',
    marginTop: 3,
  },
  summaryAmountPaid: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 3,
  },
  summaryAmountOpen: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E53E3E',
    marginTop: 3,
  },
  // Tabela
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A202C',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  thColDate: { width: '13%', color: '#FFFFFF', fontSize: 7, fontWeight: 'bold' },
  thColCounterparty: { width: '25%', color: '#FFFFFF', fontSize: 7, fontWeight: 'bold' },
  thColOrigin: { width: '19%', color: '#FFFFFF', fontSize: 7, fontWeight: 'bold' },
  thColDest: { width: '19%', color: '#FFFFFF', fontSize: 7, fontWeight: 'bold' },
  thColAmount: { width: '13%', color: '#FFFFFF', fontSize: 7, fontWeight: 'bold', textAlign: 'right' },
  thColStatus: { width: '11%', color: '#FFFFFF', fontSize: 7, fontWeight: 'bold', textAlign: 'center' },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tdColDate: { width: '13%', fontSize: 7, color: '#4A5568' },
  tdColCounterparty: { width: '25%', fontSize: 7.5, fontWeight: 'bold', color: '#1A202C' },
  tdColOrigin: { width: '19%', fontSize: 7, color: '#4A5568' },
  tdColDest: { width: '19%', fontSize: 7, color: '#4A5568' },
  tdColAmount: { width: '13%', fontSize: 7.5, fontWeight: 'bold', textAlign: 'right', color: '#10B981' },
  tdColAmountOut: { width: '13%', fontSize: 7.5, fontWeight: 'bold', textAlign: 'right', color: '#E53E3E' },
  tdColStatus: { width: '11%', fontSize: 6.5, fontWeight: 'bold', textAlign: 'center', color: '#10B981' },
  tdColStatusDanger: { width: '11%', fontSize: 6.5, fontWeight: 'bold', textAlign: 'center', color: '#E53E3E' },

  // Aviso Legal
  legalBox: {
    marginTop: 18,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 3,
  },
  legalText: {
    fontSize: 6.5,
    color: '#718096',
    lineHeight: 1.4,
    textAlign: 'justify',
  },
  // Rodapé
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#10B981',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 6.5,
    color: '#718096',
  },
});

interface Props {
  transactions: ITreasuryTransaction[];
  profile: IFinancialProfile;
}

export const CitizenLedgerPdfDocument: React.FC<Props> = ({ transactions, profile }) => {
  const totalInflow = transactions
    .filter((tx) => tx.direction === 'inbound' || tx.type === 'income')
    .reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);

  const contractTotal = profile?.contract?.contractedAmount || 65000;
  const totalPaid = profile?.contract?.paidAmount ?? totalInflow;
  const outstandingBalance = profile?.contract?.openAmount ?? Math.max(0, contractTotal - totalPaid);

  const associateName = profile?.associate?.name || 'ANDRESSA DE LIMA FERREIRA';
  const associateId = profile?.associate?.id || '2024001';
  const associateCpf = profile?.associate?.cpf || '173.793.567-80';
  const associateEmail = profile?.associate?.email || 'contato@asppibra.org.br';

  return (
    <Document title={`Extrato Fiduciário - ${associateName}`}>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              ASPPIBRA <Text style={styles.headerTitleGreen}>DAO</Text>
            </Text>
            <Text style={styles.headerSubtitle}>
              Relatório Financeiro Consolidado • Livro-Razão do Cidadão
            </Text>
          </View>
          <View>
            <Text style={styles.headerRef}>Ref: {fDate(new Date(), 'YYYY-MM-A4')}</Text>
            <Text style={styles.headerRefSub}>Documento Oficial DevOS Cockpit</Text>
          </View>
        </View>

        {/* Perfil do Titular */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{associateName.charAt(0)}</Text>
          </View>
          <View style={styles.profileCol}>
            <Text style={styles.profileName}>{associateName}</Text>
            <Text style={styles.profileLabel}>CONTA ASSOCIADA</Text>
            <Text style={styles.profileVal}>
              #{associateId} (Ativo)
            </Text>
            <Text style={styles.profileLabel}>CPF / CNPJ</Text>
            <Text style={styles.profileVal}>{associateCpf}</Text>
          </View>
          <View style={styles.profileCol}>
            <Text style={styles.profileLabel}>CONTATO PRINCIPAL</Text>
            <Text style={styles.profileVal}>{associateEmail}</Text>
            <Text style={styles.profileLabel}>ENDEREÇO CADASTRADO</Text>
            <Text style={styles.profileVal}>Rua Palmira F. De Carvalho, lote 05, Quadra D</Text>
            <Text style={styles.profileValSub}>São José de Imbassaí, Maricá - RJ, 24912-000</Text>
          </View>
        </View>

        {/* Resumo Executivo */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBoxTotal}>
            <Text style={styles.summaryLabel}>VALOR TOTAL</Text>
            <Text style={styles.summaryAmount}>R$ {fNumber(contractTotal)}</Text>
          </View>
          <View style={styles.summaryBoxPaid}>
            <Text style={styles.summaryLabel}>TOTAL PAGO</Text>
            <Text style={styles.summaryAmountPaid}>R$ {fNumber(totalPaid)}</Text>
          </View>
          <View style={styles.summaryBoxOpen}>
            <Text style={styles.summaryLabelOpen}>SALDO DEVEDOR</Text>
            <Text style={styles.summaryAmountOpen}>R$ {fNumber(outstandingBalance)}</Text>
          </View>
        </View>

        {/* Tabela de Transações */}
        <View style={styles.tableHeader}>
          <Text style={styles.thColDate}>Data</Text>
          <Text style={styles.thColCounterparty}>Contraparte</Text>
          <Text style={styles.thColOrigin}>Origem</Text>
          <Text style={styles.thColDest}>Destino</Text>
          <Text style={styles.thColAmount}>Valor ($)</Text>
          <Text style={styles.thColStatus}>Status</Text>
        </View>

        {transactions.map((tx, idx) => {
          const isOut = tx.direction === 'outbound';
          const isAlt = idx % 2 !== 0;
          const statusLabel =
            tx.status === 'confirmed'
              ? 'Concluído'
              : tx.amount === 0 || tx.category === 'Falta de Pagamento'
              ? 'Falta Pgto'
              : tx.status === 'pending'
              ? 'Pendente'
              : 'Inadimplente';

          const isDanger = statusLabel === 'Falta Pgto' || statusLabel === 'Inadimplente';

          return (
            <View key={tx.id} style={[styles.tableRow, isAlt ? styles.tableRowAlt : {}]}>
              <Text style={styles.tdColDate}>{fDate(tx.created_at, 'DD/MM/YYYY')}</Text>
              <Text style={styles.tdColCounterparty}>{tx.counterparty_name || 'N/A'}</Text>
              <Text style={styles.tdColOrigin}>{tx.origin_institution || 'N/A'}</Text>
              <Text style={styles.tdColDest}>{tx.destination_institution || 'N/A'}</Text>
              <Text style={isOut ? styles.tdColAmountOut : styles.tdColAmount}>
                {fNumber(tx.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={isDanger ? styles.tdColStatusDanger : styles.tdColStatus}>
                {statusLabel}
              </Text>
            </View>
          );
        })}

        {/* Aviso Legal */}
        <View style={styles.legalBox}>
          <Text style={styles.legalText}>
            AVISO LEGAL: Este documento foi gerado eletronicamente pelos sistemas da ASPPIBRA DAO no DevOS Cockpit e reflete os registros processados durante o período de referência. As informações apresentadas constituem demonstrativo informativo das operações vinculadas à execução contratual e poderão ser utilizadas como elemento de prova eletrônica, nos termos da Medida Provisória nº 2.200-2/2001, da Lei nº 14.063/2020 e da legislação aplicável. O conteúdo é confidencial e destinado exclusivamente ao titular da conta e às partes autorizadas.
          </Text>
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Gerado em: {fDate(new Date(), 'DD/MM/YYYY')}</Text>
          <Text style={styles.footerText}>Confidencial • Hash de Auditoria D1</Text>
          <Text style={styles.footerText}>Documento Oficial ASPPIBRA DAO</Text>
        </View>
      </Page>
    </Document>
  );
};
