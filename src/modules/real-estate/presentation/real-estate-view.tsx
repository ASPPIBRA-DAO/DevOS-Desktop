import React, { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { colors } from '../../../shared/theme/palette';
import { ReconciliationReportButton } from '../../reports';
import { Iconify } from '../../../shared/components/iconify';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { RealEstateMetricsBar } from './components/real-estate-metrics-bar';
import { TerritorialHubSelector } from './components/territorial-hub-selector';
import { RealEstateImporterCard } from './components/real-estate-importer-card';
import { RealEstateSpreadsheetTable } from './components/real-estate-spreadsheet-table';
import {
  RealEstateBridge,
  type PropertySummary,
  type RealEstateStats,
  type XlsxPreviewReport,
  type ImportBatchSummary,
  type AuditFindingSummary,
  type ImportExecutionReport,
} from '../../../platform/tauri/real-estate/real-estate-bridge';

export function RealEstateView() {
  const [stats, setStats] = useState<RealEstateStats | null>(null);
  const [filePath, setFilePath] = useState('/home/sandro/Downloads/Mapa5.xlsx');
  const [sheetName, setSheetName] = useState('endereco');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<XlsxPreviewReport | null>(null);
  const [executionReport, setExecutionReport] = useState<ImportExecutionReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Controle Hierárquico Territorial (Estado / Município)
  const [selectedStateUf, setSelectedStateUf] = useState('RJ');
  const [selectedCityId, setSelectedCityId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('city=marica')) {
      return 'marica';
    }
    return null;
  });

  // Dados auxiliares para as abas
  const [batches, setBatches] = useState<ImportBatchSummary[]>([]);
  const [findings, setFindings] = useState<AuditFindingSummary[]>([]);
  const [properties, setProperties] = useState<PropertySummary[]>([]);

  const loadStatsAndData = useCallback(async () => {
    try {
      const s = await RealEstateBridge.getStats();
      setStats(s);
      const b = await RealEstateBridge.listBatches(20);
      setBatches(b);
      const f = await RealEstateBridge.listFindings(50);
      setFindings(f);
      const p = await RealEstateBridge.listProperties(50);
      setProperties(p);
    } catch (err: unknown) {
      console.warn('Erro ao carregar dados imobiliários:', err);
    }
  }, []);

  useEffect(() => {
    loadStatsAndData();
  }, [loadStatsAndData]);

  const handleGeneratePreview = async () => {
    setErrorMessage(null);
    setIsLoadingPreview(true);
    setExecutionReport(null);
    try {
      const rep = await RealEstateBridge.previewImport(filePath, sheetName);
      setPreview(rep);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExecuteImport = async (limit?: number) => {
    setErrorMessage(null);
    setIsImporting(true);
    try {
      const rep = await RealEstateBridge.executeImport(filePath, sheetName, limit);
      setExecutionReport(rep);
      await loadStatsAndData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsImporting(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const selected = await RealEstateBridge.selectFile();
      if (selected) {
        setFilePath(selected);
      }
    } catch (err: unknown) {
      console.warn('Falha ao abrir seletor nativo:', err);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* 1. VISÃO A: HUB TERRITORIAL (SELETOR DE ESTADOS E MUNICÍPIOS) */}
      {!selectedCityId ? (
        <TerritorialHubSelector
          selectedStateUf={selectedStateUf}
          onSelectState={setSelectedStateUf}
          onSelectCity={(cityId) => setSelectedCityId(cityId)}
          stats={stats}
        />
      ) : (
        /* 2. VISÃO B: AMBIENTE DE ANÁLISE E FILTRAGEM DO MUNICÍPIO SELECIONADO */
        <>
          {/* Barra de Navegação e Contexto Municipal */}
          <Box
            sx={{
              mb: 3.5,
              p: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              background: 'linear-gradient(135deg, rgba(0, 167, 111, 0.08) 0%, rgba(15, 23, 42, 0.04) 100%)',
              border: '1px solid rgba(0, 167, 111, 0.25)',
              boxShadow: '0 4px 16px -2px rgba(0, 167, 111, 0.08)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedCityId(null)}
                startIcon={<Iconify icon="solar:arrow-left-bold" />}
                sx={{
                  fontWeight: 700,
                  bgcolor: 'background.paper',
                  borderColor: 'rgba(0, 167, 111, 0.4)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 167, 111, 0.1)',
                    borderColor: colors.primary.main,
                  },
                }}
              >
                Trocar Estado / Município
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.85rem' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Brasil</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>❯</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Rio de Janeiro (RJ)</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>❯</Typography>
                <Chip
                  size="small"
                  label="Maricá (Base Ativa)"
                  color="primary"
                  sx={{ fontWeight: 800, fontSize: '0.75rem' }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <ReconciliationReportButton stats={stats} batches={batches} findings={findings} />
              <Button
                variant="outlined"
                size="small"
                onClick={loadStatsAndData}
                startIcon={<Iconify icon="solar:restart-bold" />}
              >
                Atualizar Painel
              </Button>
            </Box>
          </Box>

          {/* Header Institucional de Maricá */}
          <Box sx={{ mb: 4, pb: 2.5, borderBottom: `1px solid ${colors.background.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  Maricá — Cadastro Territorial & Auditoria
                </Typography>
                <StatusBadge status="ACTIVE" label="Base Operacional" />
                <Chip
                  size="small"
                  label="real_estate.sqlite (WAL)"
                  sx={{
                    bgcolor: 'rgba(0, 167, 111, 0.12)',
                    color: colors.primary.main,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                />
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
              Ingestão rastreável de cadastros territoriais, proveniência criptográfica (SHA-256) e normalização idempotente para o município de <strong>Maricá - RJ</strong>.
            </Typography>
          </Box>

      {/* Métricas Consolidadas */}
      <RealEstateMetricsBar stats={stats} />

      {/* Caixa de Importação Cadastral V1 */}
      <RealEstateImporterCard
        filePath={filePath}
        setFilePath={setFilePath}
        sheetName={sheetName}
        setSheetName={setSheetName}
        isLoadingPreview={isLoadingPreview}
        isImporting={isImporting}
        preview={preview}
        executionReport={executionReport}
        errorMessage={errorMessage}
        handlePickFile={handlePickFile}
        handleGeneratePreview={handleGeneratePreview}
        handleExecuteImport={handleExecuteImport}
      />

      {/* Seção com Abas de Navegação */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label={`Lotes de Importação (${batches.length})`} />
          <Tab label={`Apontamentos de Auditoria (${findings.length})`} />
          <Tab label={`Planilha Cadastral (${properties.length})`} />
        </Tabs>
      </Box>

      {/* Aba 0: Lotes de Importação */}
      {activeTab === 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Arquivo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Aba</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Modo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Linhas Lidas</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Importados</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Última Linha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Inconsistências</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Data / Hora</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3, color: colors.text.secondary }}>
                    Nenhum lote importado até o momento.
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell sx={{ fontWeight: 700 }}>#{b.id}</TableCell>
                    <TableCell>{b.source_filename}</TableCell>
                    <TableCell>{b.sheet_name}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={b.import_mode}
                        color={b.import_mode === 'FULL' ? 'primary' : 'info'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={b.status}
                        color={
                          b.status === 'COMPLETED'
                            ? 'success'
                            : b.status === 'PILOT_COMPLETED'
                            ? 'info'
                            : b.status === 'IN_PROGRESS'
                            ? 'warning'
                            : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell>{b.total_rows_read.toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{b.total_records_imported.toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{b.last_processed_row.toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{b.total_inconsistencies_detected}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{b.started_at}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Aba 1: Apontamentos de Auditoria */}
      {activeTab === 1 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Categoria</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Gravidade</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Origem</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status Análise</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Registrado Em</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {findings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: colors.text.secondary }}>
                    Nenhuma inconsistência aberta encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                findings.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell sx={{ fontWeight: 700 }}>#{f.id}</TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={f.category} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={f.severity}
                        color={f.severity === 'HIGH' ? 'error' : f.severity === 'MEDIUM' ? 'warning' : 'info'}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{f.source}</TableCell>
                    <TableCell>{f.description}</TableCell>
                    <TableCell>{f.analysis_status}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{f.created_at}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Aba 2: Planilha Cadastral Territorial (Espelho do Banco SQLite WAL) */}
      {activeTab === 2 && (
        <RealEstateSpreadsheetTable
          properties={properties}
          preview={preview}
          isLoading={isLoadingPreview || isImporting}
          onRefresh={loadStatsAndData}
          onTriggerPreview={handleGeneratePreview}
          onTriggerPilot={() => handleExecuteImport(50)}
        />
      )}
        </>
      )}
    </Box>
  );
}

export default RealEstateView;
