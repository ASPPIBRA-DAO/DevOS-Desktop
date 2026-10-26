import type { ReconciliationReportModel } from '../../services/report-compiler-service';
import type {
  RealEstateStats,
  PropertySummary,
  ImportBatchSummary,
  AuditFindingSummary,
} from '../../../../platform/tauri/real-estate/real-estate-bridge';

import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { PdfPreviewDialog } from '../../../documents';
import { colors } from '../../../../shared/theme/palette';
import { Iconify } from '../../../../shared/components/iconify';
import { ReportCompilerService } from '../../services/report-compiler-service';
import { RealEstateBridge } from '../../../../platform/tauri/real-estate/real-estate-bridge';
import { RealEstateReconciliationReport } from '../../templates/real-estate-reconciliation-report';

export interface ReconciliationReportButtonProps {
  stats: RealEstateStats | null;
  batches?: ImportBatchSummary[];
  findings?: AuditFindingSummary[];
  properties?: PropertySummary[];
  selectedNeighborhood?: string;
  searchTerm?: string;
  disabled?: boolean;
}

export const ReconciliationReportButton: React.FC<ReconciliationReportButtonProps> = ({
  stats,
  batches = [],
  findings = [],
  properties = [],
  selectedNeighborhood = 'ALL',
  searchTerm = '',
  disabled = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [reportLimit, setReportLimit] = useState<number>(2500);
  const [reportModel, setReportModel] = useState<ReconciliationReportModel | null>(null);

  if (!stats) return null;

  const isAllSelected = selectedNeighborhood === 'ALL';
  const filterLabel = isAllSelected
    ? 'Todos os Bairros (145.756 registros no banco)'
    : `Bairro: ${selectedNeighborhood}`;

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleGeneratePdf = async () => {
    setIsCompiling(true);
    try {
      // Busca a base de propriedades para o relatório de acordo com o limite selecionado e filtros ativos
      const fetchedProps = await RealEstateBridge.listProperties(
        reportLimit,
        0,
        selectedNeighborhood,
        searchTerm
      );
      const propsToUse = fetchedProps && fetchedProps.length > 0 ? fetchedProps : properties;
      const compiled = ReportCompilerService.compileReconciliationReport(
        stats,
        batches,
        findings,
        propsToUse
      );
      setReportModel(compiled);
      setModalOpen(false);
      setPreviewOpen(true);
    } catch (err) {
      console.error('Erro ao compilar relatório cadastral:', err);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownloadFullCsv = () => {
    const params = new URLSearchParams();
    if (selectedNeighborhood && selectedNeighborhood !== 'ALL') {
      params.set('bairro', selectedNeighborhood);
    }
    if (searchTerm && searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    }
    const url = `/api/real-estate/export-csv?${params.toString()}`;
    const link = document.createElement('a');
    link.href = url;
    link.download =
      selectedNeighborhood && selectedNeighborhood !== 'ALL'
        ? `cadastro-imobiliario-marica-${selectedNeighborhood.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`
        : 'cadastro-imobiliario-marica-completo-145756.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Button
        variant="contained"
        size="small"
        onClick={handleOpenModal}
        disabled={disabled}
        startIcon={<Iconify icon="solar:printer-bold" width={18} />}
        sx={{
          bgcolor: colors.primary.main,
          color: '#ffffff',
          textTransform: 'none',
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(0, 167, 111, 0.24)',
          '&:hover': {
            bgcolor: colors.primary.dark,
          },
        }}
      >
        Imprimir / Exportar Cadastros
      </Button>

      {/* Modal de Configuração de Escopo e Formato de Impressão */}
      <Dialog
        open={modalOpen}
        onClose={() => !isCompiling && setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2.5,
              bgcolor: 'background.paper',
              border: '1px solid rgba(145, 158, 171, 0.2)',
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: 'rgba(0, 167, 111, 0.12)',
              color: colors.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="solar:printer-bold" width={22} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Impressão & Exportação Cadastral
            </Typography>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
              Base Territorial de Maricá • SQLite WAL Oficial
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2.5 }}>
          {/* Card de Contexto Ativo */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: 2,
              bgcolor: 'rgba(0, 167, 111, 0.05)',
              border: '1px solid rgba(0, 167, 111, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block', fontWeight: 600 }}>
                Escopo Selecionado na Planilha:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: colors.primary.main }}>
                {filterLabel}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: colors.text.secondary, fontWeight: 600 }}>
              Total no Banco: <strong>{stats.total_properties.toLocaleString('pt-BR')}</strong>
            </Typography>
          </Box>

          {/* Opção 1: Relatório em PDF */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Iconify icon="solar:document-text-bold" width={18} color="primary.main" />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                1. Relatório Analítico em PDF (Visualização & Impressão)
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block', mb: 1.5 }}>
              Compila o relatório formal diagramado em A4 com métricas, auditoria e a planilha cadastral com todas as 9 colunas.
            </Typography>

            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <FormLabel component="legend" sx={{ fontSize: '0.75rem', fontWeight: 700, mb: 0.5 }}>
                Volume de registros no documento PDF:
              </FormLabel>
              <RadioGroup
                value={reportLimit}
                onChange={(e) => setReportLimit(Number(e.target.value))}
              >
                <FormControlLabel
                  value={500}
                  control={<Radio size="small" />}
                  label={<Typography variant="body2">500 Registros (~16 páginas)</Typography>}
                />
                <FormControlLabel
                  value={1000}
                  control={<Radio size="small" />}
                  label={<Typography variant="body2">1.000 Registros (~32 páginas)</Typography>}
                />
                <FormControlLabel
                  value={2500}
                  control={<Radio size="small" />}
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 700, color: colors.primary.main }}>
                      2.500 Registros (Capacidade Máxima do PDF • ~78 páginas)
                    </Typography>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <Divider />

          {/* Opção 2: Exportação da Planilha Completa (145.756 Linhas) */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Iconify icon="solar:database-bold" width={18} color="info.main" />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                2. Extração Integral da Base Completa (145.756 Linhas)
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block', mb: 1.5 }}>
              Para auditar ou carregar todos os 145.756 registros no Excel, Calc ou banco de dados sem as limitações de paginação do PDF:
            </Typography>

            <Button
              variant="outlined"
              size="small"
              onClick={handleDownloadFullCsv}
              startIcon={<Iconify icon="solar:file-download-bold" />}
              sx={{
                fontWeight: 700,
                borderColor: 'rgba(145, 158, 171, 0.32)',
                color: 'text.primary',
                '&:hover': {
                  borderColor: colors.primary.main,
                  bgcolor: 'rgba(0, 167, 111, 0.08)',
                },
              }}
            >
              Baixar Planilha Completa ({isAllSelected ? '145.756 Cadastros em CSV' : `${selectedNeighborhood} em CSV`})
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setModalOpen(false)} disabled={isCompiling} sx={{ color: colors.text.secondary }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGeneratePdf}
            disabled={isCompiling}
            startIcon={
              isCompiling ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Iconify icon="solar:printer-bold" />
              )
            }
            sx={{
              bgcolor: colors.primary.main,
              fontWeight: 700,
              '&:hover': { bgcolor: colors.primary.dark },
            }}
          >
            {isCompiling ? 'Carregando Dados do SQLite...' : `Gerar PDF (${reportLimit.toLocaleString('pt-BR')} Linhas)`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Visualizador de Alta Fidelidade do PDF para Impressão */}
      <PdfPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Relatório Cadastral de Maricá (${reportLimit.toLocaleString('pt-BR')} Imóveis)`}
        filename={`relatorio-cadastral-marica-${Date.now()}.pdf`}
        documentElement={reportModel ? <RealEstateReconciliationReport data={reportModel} /> : null}
      />
    </>
  );
};
export default ReconciliationReportButton;

