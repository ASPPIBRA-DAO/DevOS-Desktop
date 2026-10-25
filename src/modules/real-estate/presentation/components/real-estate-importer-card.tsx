import type {
  XlsxPreviewReport,
  ImportExecutionReport,
} from '../../../../platform/tauri/real-estate/real-estate-bridge';

import React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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

import { colors } from '../../../../shared/theme/palette';
import { Iconify } from '../../../../shared/components/iconify';

export interface RealEstateImporterCardProps {
  filePath: string;
  setFilePath: (path: string) => void;
  sheetName: string;
  setSheetName: (name: string) => void;
  isLoadingPreview: boolean;
  isImporting: boolean;
  preview: XlsxPreviewReport | null;
  executionReport: ImportExecutionReport | null;
  errorMessage: string | null;
  handlePickFile: () => void;
  handleGeneratePreview: () => void;
  handleExecuteImport: (limit?: number) => void;
}

/**
 * Componente de importação de planilhas territoriais (.xlsx), prévia
 * estrutural e controle de execução idempotente de lotes cadastrais.
 */
export function RealEstateImporterCard({
  filePath,
  setFilePath,
  sheetName,
  setSheetName,
  isLoadingPreview,
  isImporting,
  preview,
  executionReport,
  errorMessage,
  handlePickFile,
  handleGeneratePreview,
  handleExecuteImport,
}: RealEstateImporterCardProps) {
  return (
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
  );
}
