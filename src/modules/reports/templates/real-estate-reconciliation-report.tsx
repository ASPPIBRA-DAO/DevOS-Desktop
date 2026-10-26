import type { ReconciliationReportModel } from '../services/report-compiler-service';

import React from 'react';
import { Text, View, Document, StyleSheet } from '@react-pdf/renderer';

import { DocumentLayout } from '../../documents';

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metricCard: {
    width: '31%',
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#1e293b',
  },
  metricLabel: {
    fontSize: 7,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 2,
  },
  table: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#334155',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e293b',
  },
  col1: { width: '15%' },
  col2: { width: '45%' },
  col3: { width: '20%' },
  col4: { width: '20%', textAlign: 'right' },
  propColId: { width: '6%', textAlign: 'center' },
  propColMatricula: { width: '11%' },
  propColContribuinte: { width: '22%' },
  propColBairro: { width: '14%' },
  propColRua: { width: '17%' },
  propColNumero: { width: '6%', textAlign: 'center' },
  propColQuadra: { width: '7%', textAlign: 'center' },
  propColLote: { width: '7%', textAlign: 'center' },
  propColComplemento: { width: '10%' },
  headerText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#cbd5e1',
    textTransform: 'uppercase',
  },
  cellText: {
    fontSize: 7,
    color: '#94a3b8',
  },
  cellTextEmphasis: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#e2e8f0',
  },
});

export interface RealEstateReconciliationReportProps {
  data: ReconciliationReportModel;
}

export const RealEstateReconciliationReport: React.FC<RealEstateReconciliationReportProps> = ({ data }) => (
  <Document title="Relatorio-Reconciliacao-Imobiliaria-ASPPIBRA">
    <DocumentLayout
      title="Relatório Analítico de Reconciliação Imobiliária"
      subtitle={`Consolidação de auditoria cadastral e reconciliação de lotes • Gerado em: ${data.generatedAt}`}
      systemTag="Cockpit Real Estate Engine"
    >
      <Text style={styles.sectionTitle}>Métricas Cadastrais Consolidadas</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total de Imóveis</Text>
          <Text style={styles.metricValue}>{data.stats.totalProperties}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Identificadores</Text>
          <Text style={styles.metricValue}>{data.stats.totalIdentifiers}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Endereços Vinculados</Text>
          <Text style={styles.metricValue}>{data.stats.totalAddresses}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Lotes Processados</Text>
          <Text style={styles.metricValue}>{data.stats.totalBatches}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Inconsistências Abertas</Text>
          <Text style={[styles.metricValue, { color: data.stats.openFindingsCount > 0 ? '#f87171' : '#4ade80' }]}>
            {data.stats.openFindingsCount}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Propostas Pendentes</Text>
          <Text style={styles.metricValue}>{data.stats.pendingProposalsCount}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Histórico Recente de Lotes de Importação</Text>
      <View style={styles.table}>
        <View style={styles.tableRowHeader}>
          <Text style={[styles.headerText, styles.col1]}>ID</Text>
          <Text style={[styles.headerText, styles.col2]}>Arquivo de Origem</Text>
          <Text style={[styles.headerText, styles.col3]}>Status</Text>
          <Text style={[styles.headerText, styles.col4]}>Importados</Text>
        </View>
        {data.batches.length === 0 ? (
          <View style={styles.tableRow}>
            <Text style={[styles.cellText, { width: '100%', textAlign: 'center' }]}>
              Nenhum lote processado registrado no banco local.
            </Text>
          </View>
        ) : (
          data.batches.map((batch) => (
            <View key={batch.id} style={styles.tableRow}>
              <Text style={[styles.cellTextEmphasis, styles.col1]}>#{batch.id}</Text>
              <Text style={[styles.cellText, styles.col2]}>{batch.filename}</Text>
              <Text style={[styles.cellText, styles.col3]}>{batch.status}</Text>
              <Text style={[styles.cellTextEmphasis, styles.col4]}>{batch.importedRecords}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>Apontamentos Críticos de Auditoria</Text>
      <View style={styles.table}>
        <View style={styles.tableRowHeader}>
          <Text style={[styles.headerText, styles.col1]}>ID</Text>
          <Text style={[styles.headerText, styles.col3]}>Categoria</Text>
          <Text style={[styles.headerText, styles.col2]}>Descrição</Text>
          <Text style={[styles.headerText, styles.col4]}>Severidade</Text>
        </View>
        {data.findings.length === 0 ? (
          <View style={styles.tableRow}>
            <Text style={[styles.cellText, { width: '100%', textAlign: 'center' }]}>
              Nenhuma inconsistência em aberto no momento.
            </Text>
          </View>
        ) : (
          data.findings.map((finding) => (
            <View key={finding.id} style={styles.tableRow}>
              <Text style={[styles.cellTextEmphasis, styles.col1]}>#{finding.id}</Text>
              <Text style={[styles.cellText, styles.col3]}>{finding.category}</Text>
              <Text style={[styles.cellText, styles.col2]}>{finding.description}</Text>
              <Text
                style={[
                  styles.cellTextEmphasis,
                  styles.col4,
                  { color: finding.severity === 'high' ? '#f87171' : '#fbbf24' },
                ]}
              >
                {finding.severity}
              </Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>Planilha Cadastral Territorial (Imóveis Registrados)</Text>
      <View style={styles.table}>
        <View style={styles.tableRowHeader}>
          <Text style={[styles.headerText, styles.propColId]}>#ID</Text>
          <Text style={[styles.headerText, styles.propColMatricula]}>Matrícula</Text>
          <Text style={[styles.headerText, styles.propColContribuinte]}>Contribuinte</Text>
          <Text style={[styles.headerText, styles.propColBairro]}>Bairro</Text>
          <Text style={[styles.headerText, styles.propColRua]}>Rua</Text>
          <Text style={[styles.headerText, styles.propColNumero]}>Nº</Text>
          <Text style={[styles.headerText, styles.propColQuadra]}>Quadra</Text>
          <Text style={[styles.headerText, styles.propColLote]}>Lote</Text>
          <Text style={[styles.headerText, styles.propColComplemento]}>Complemento</Text>
        </View>
        {!data.properties || data.properties.length === 0 ? (
          <View style={styles.tableRow}>
            <Text style={[styles.cellText, { width: '100%', textAlign: 'center' }]}>
              Nenhum imóvel cadastrado registrado no banco local.
            </Text>
          </View>
        ) : (
          data.properties.map((prop) => (
            <View key={prop.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.cellTextEmphasis, styles.propColId]}>#{prop.id}</Text>
              <Text style={[styles.cellText, styles.propColMatricula]}>{prop.matricula}</Text>
              <Text style={[styles.cellTextEmphasis, styles.propColContribuinte]}>{prop.contribuinte}</Text>
              <Text style={[styles.cellText, styles.propColBairro]}>{prop.bairro}</Text>
              <Text style={[styles.cellText, styles.propColRua]}>{prop.rua}</Text>
              <Text style={[styles.cellText, styles.propColNumero]}>{prop.numero}</Text>
              <Text style={[styles.cellText, styles.propColQuadra]}>{prop.quadra}</Text>
              <Text style={[styles.cellText, styles.propColLote]}>{prop.lote}</Text>
              <Text style={[styles.cellText, styles.propColComplemento]}>{prop.complemento}</Text>
            </View>
          ))
        )}
      </View>
    </DocumentLayout>
  </Document>
);
