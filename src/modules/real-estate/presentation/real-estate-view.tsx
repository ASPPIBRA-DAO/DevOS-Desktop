import React, { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import AlertTitle from '@mui/material/AlertTitle';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { colors } from '../../../shared/theme/palette';
import { Iconify } from '../../../shared/components/iconify';
import { MetricBox } from '../../../shared/components/MetricBox';
import { StatusBadge } from '../../../shared/components/StatusBadge';
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
      {/* Header Institucional */}
      <Box sx={{ mb: 4, pb: 3, borderBottom: `1px solid ${colors.background.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              Cadastro Imobiliário & Auditoria
            </Typography>
            <StatusBadge status="ACTIVE" label="Cockpit Exclusivo" />
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
          <Button
            variant="outlined"
            size="small"
            onClick={loadStatsAndData}
            startIcon={<Iconify icon="solar:restart-bold" />}
          >
            Atualizar Painel
          </Button>
        </Box>
        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
          Ingestão rastreável de cadastros territoriais, proveniência criptográfica (SHA-256) e normalização idempotente.
        </Typography>
      </Box>

      {/* Métricas Consolidadas */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: 'repeat(5, 1fr)',
          },
          gap: 2,
          mb: 4,
        }}
      >
        <MetricBox
          label="Imóveis Cadastrados"
          value={stats ? stats.total_properties.toLocaleString('pt-BR') : '0'}
          subtext="Entidades imobiliárias vigentes"
          accentColor={colors.primary.main}
          icon={<Iconify icon="solar:bill-list-bold" width={24} />}
        />
        <MetricBox
          label="Identificadores"
          value={stats ? stats.total_identifiers.toLocaleString('pt-BR') : '0'}
          subtext="Matrículas e IDs de origem"
          accentColor={colors.info.main}
          icon={<Iconify icon="solar:user-id-bold" width={24} />}
        />
        <MetricBox
          label="Endereços Normatizados"
          value={stats ? stats.total_addresses.toLocaleString('pt-BR') : '0'}
          subtext="Vias, bairros e lotes associados"
          accentColor={colors.success.main}
          icon={<Iconify icon="solar:file-text-bold" width={24} />}
        />
        <MetricBox
          label="Lotes Processados"
          value={stats ? stats.total_batches.toLocaleString('pt-BR') : '0'}
          subtext={stats ? `${stats.total_batch_records.toLocaleString('pt-BR')} linhas brutas` : '0 linhas'}
          accentColor={colors.secondary.main}
          icon={<Iconify icon="solar:inbox-in-bold" width={24} />}
        />
        <MetricBox
          label="Inconsistências"
          value={stats ? stats.open_findings_count.toLocaleString('pt-BR') : '0'}
          subtext="Apontamentos para auditoria"
          accentColor={colors.warning.main}
          icon={<Iconify icon="solar:danger-triangle-bold" width={24} />}
        />
      </Box>

      {/* Caixa de Importação Cadastral V1 */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:import-bold" width={22} color={colors.primary.main} />
          Importador Cadastral V1 — Planilha Territorial (.xlsx)
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 3 }}>
          Conforme diretriz arquitetural, apenas a aba <strong>endereco</strong> é importada. As abas financeiras permanecem estritamente isoladas.
        </Typography>

        {/* Atalhos de Seleção de Arquivo */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: colors.text.secondary, mr: 1, fontWeight: 600 }}>
            Atalhos de Origem:
          </Typography>
          <Chip
            label="Planilha Oficial Mapa5.xlsx"
            size="small"
            clickable
            variant={filePath === '/home/sandro/Downloads/Mapa5.xlsx' ? 'filled' : 'outlined'}
            color="primary"
            onClick={() => setFilePath('/home/sandro/Downloads/Mapa5.xlsx')}
          />
          <Chip
            label="Planilha Sintética de Testes (CI)"
            size="small"
            clickable
            variant={filePath.includes('test_synthetic.xlsx') ? 'filled' : 'outlined'}
            color="info"
            onClick={() => setFilePath('fixtures/test_synthetic.xlsx')}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2.5fr 1fr' }, gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Caminho do Arquivo .xlsx no Disco"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              fullWidth
              size="small"
              helperText="Localização do arquivo original no disco (não será alterado)."
            />
            <Button
              variant="outlined"
              color="primary"
              onClick={handlePickFile}
              startIcon={<Iconify icon="solar:add-folder-bold" width={18} />}
              sx={{ whiteSpace: 'nowrap', height: 40 }}
            >
              Procurar...
            </Button>
          </Box>

          <FormControl fullWidth size="small">
            <InputLabel id="sheet-select-label">Aba Alvo</InputLabel>
            <Select
              labelId="sheet-select-label"
              value={sheetName}
              label="Aba Alvo"
              onChange={(e) => setSheetName(e.target.value)}
            >
              <MenuItem value="endereco">endereco (Cadastro territorial)</MenuItem>
              <MenuItem value="divida" disabled>divida (Bloqueada / Financeiro)</MenuItem>
              <MenuItem value="enderecoXdivida" disabled>enderecoXdivida (Bloqueada / Cruzamento)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGeneratePreview}
            disabled={isLoadingPreview || isImporting || !filePath.trim()}
            startIcon={isLoadingPreview ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="solar:eye-bold" />}
          >
            {isLoadingPreview ? 'Lendo XLSX...' : '1. Gerar Prévia'}
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={() => handleExecuteImport(50)}
            disabled={isImporting || isLoadingPreview || !filePath.trim()}
            startIcon={isImporting ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="solar:play-circle-bold" />}
          >
            2. Executar Piloto (50 Linhas)
          </Button>

          <Button
            variant="outlined"
            color="warning"
            onClick={() => handleExecuteImport(undefined)}
            disabled={isImporting || isLoadingPreview || !filePath.trim()}
            startIcon={isImporting ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="solar:forward-bold" />}
          >
            3. Importar Planilha Completa
          </Button>
        </Box>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <Alert severity="error" sx={{ mt: 3 }}>
            <AlertTitle>Erro no Processamento</AlertTitle>
            {errorMessage}
          </Alert>
        )}

        {/* Resultado da Execução */}
        {executionReport && (
          <Alert
            severity={
              executionReport.status === 'ALREADY_COMPLETED'
                ? 'info'
                : executionReport.status === 'PILOT_COMPLETED'
                ? 'info'
                : 'success'
            }
            sx={{ mt: 3 }}
          >
            <AlertTitle>
              {executionReport.status === 'ALREADY_COMPLETED'
                ? '⚡ Lote Já Processado Anteriormente (Idempotência Ativa)'
                : executionReport.status === 'PILOT_COMPLETED'
                ? '🧪 Piloto Concluído com Sucesso (A Importação Integral Permanece Liberada)'
                : '✅ Importação Completa Concluída com Sucesso'}
            </AlertTitle>
            <Typography variant="body2">{executionReport.message}</Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <span><strong>ID do Lote:</strong> #{executionReport.batch_id}</span>
              <span><strong>Modo:</strong> {executionReport.import_mode}</span>
              <span><strong>Status:</strong> {executionReport.status}</span>
              <span><strong>Linhas Lidas:</strong> {executionReport.total_rows_read.toLocaleString('pt-BR')}</span>
              <span><strong>Registros Criados:</strong> {executionReport.total_records_imported.toLocaleString('pt-BR')}</span>
              <span><strong>Inconsistências:</strong> {executionReport.total_inconsistencies_detected}</span>
            </Box>
          </Alert>
        )}

        {/* Relatório de Pré-visualização */}
        {preview && (
          <Box sx={{ mt: 3, pt: 2, borderTop: `1px dashed ${colors.background.borderSubtle}` }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="solar:verified-check-bold" width={20} color={colors.info.main} />
              Pré-Visualização & Metadados do Arquivo
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 1.5, mb: 2 }}>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Total de Linhas</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {preview.total_rows_count.toLocaleString('pt-BR')}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Tamanho do Arquivo</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {(preview.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Hash SHA-256 (Origem)</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {preview.file_hash_sha256.substring(0, 16)}...
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Histórico de Lote</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {preview.already_imported_batch_id ? (
                    <Chip
                      size="small"
                      color={preview.already_imported_status === 'COMPLETED' ? 'success' : 'info'}
                      label={`Lote #${preview.already_imported_batch_id} (${preview.already_imported_mode || 'LOTE'} - ${preview.already_imported_status})`}
                    />
                  ) : (
                    <Chip size="small" color="success" label="Arquivo Inédito" />
                  )}
                </Box>
              </Paper>
            </Box>

            {/* Alertas da Amostra */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                size="small"
                label={`Matrículas Vazias (amostra): ${preview.empty_matricula_sample_count}`}
                color={preview.empty_matricula_sample_count > 0 ? 'warning' : 'default'}
              />
              <Chip
                size="small"
                label={`Endereços Ausentes (amostra): ${preview.empty_address_sample_count}`}
                color={preview.empty_address_sample_count > 0 ? 'warning' : 'default'}
              />
              <Chip
                size="small"
                label={`Matrículas Duplicadas (amostra): ${preview.duplicate_matricula_sample_count}`}
                color={preview.duplicate_matricula_sample_count > 0 ? 'warning' : 'default'}
              />
            </Box>

            {/* Cabeçalhos Mapeados */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              <strong>Colunas Mapeadas:</strong> {preview.recognized_headers.join(' | ')}
            </Typography>

            {/* Amostra dos Primeiros Registros */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, mt: 2 }}>
              Amostra das Primeiras Linhas da Planilha:
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 240 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {preview.recognized_headers.map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.sample_rows.slice(0, 5).map((row, idx) => (
                    <TableRow key={idx}>
                      {preview.recognized_headers.map((h) => (
                        <TableCell key={h} sx={{ fontSize: '0.8rem' }}>
                          {row[h] || '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Card>

      {/* Seção com Abas de Navegação */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label={`Lotes de Importação (${batches.length})`} />
          <Tab label={`Apontamentos de Auditoria (${findings.length})`} />
          <Tab label={`Imóveis Cadastrados (${properties.length})`} />
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

      {/* Aba 2: Imóveis Cadastrados */}
      {activeTab === 2 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>UUID Imóvel</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Matrícula de Origem</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo Identificador</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Endereço Formatado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Data Criação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: colors.text.secondary }}>
                    Nenhum imóvel cadastrado no banco local.
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell sx={{ fontWeight: 700 }}>#{p.id}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {p.uuid.substring(0, 8)}...
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.identifier || '—'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      <Chip size="small" variant="outlined" label={p.identifier_type || 'NÃO CLASSIFICADO'} />
                    </TableCell>
                    <TableCell>{p.address || '—'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{p.created_at}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
export default RealEstateView;
