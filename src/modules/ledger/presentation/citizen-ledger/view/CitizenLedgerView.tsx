import type { Theme } from '@mui/material/styles';
import type { DocumentPreviewResult } from 'src/platform/tauri';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate, fNumber } from 'src/shared/utils';
import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';
import { PdfViewerLayout } from 'src/shared/components/pdf-viewer';

import { useGetCitizenLedger } from '../../hooks/treasury-hooks';
import { AssociateSearchCard } from '../components/associate-search-card';
import { FinancialSummaryHeader } from '../components/financial-summary-header';
import { FinancialTransactionsTable } from '../components/financial-transactions-table';
import {
  exportCitizenLedgerPdf,
  previewCitizenLedgerPdf,
  exportPreviewedCitizenLedgerPdf,
  type ExportCitizenLedgerPdfPayload,
} from '../../../services/ledger-export-service';

// ----------------------------------------------------------------------

export function CitizenLedgerView() {
  const [selectedYear, setSelectedYear] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [openPreview, setOpenPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<DocumentPreviewResult | null>(null);

  const [selectedCitizenId, setSelectedCitizenId] = useState<string | null>(null);

  const { profile, profileLoading, profileError } = useGetCitizenLedger(selectedCitizenId);

  const handleSelectProfile = (id: string | null) => {
    setSelectedCitizenId(id);
    setPdfPreview(null);
  };

  const transactions = profile?.transactions || [];

  const transactionYears = Array.from<string>(
    new Set(
      transactions.map((tx: any) =>
        new Date(tx.created_at).getFullYear().toString()
      )
    )
  ).sort((a: string, b: string) => b.localeCompare(a));

  const availableYears = transactionYears.length > 0 ? ['Todos', ...transactionYears] : ['Todos'];

  const dataFiltered = transactions
    .filter((tx: any) => {
      const txYear = tx.created_at ? tx.created_at.substring(0, 4) : '';
      const matchesYear = selectedYear === 'Todos' || txYear === selectedYear;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        tx.counterparty_name?.toLowerCase().includes(searchLower) ||
        tx.origin_institution?.toLowerCase().includes(searchLower) ||
        tx.destination_institution?.toLowerCase().includes(searchLower) ||
        tx.category?.toLowerCase().includes(searchLower) ||
        tx.payment_method?.toLowerCase().includes(searchLower);

      return matchesYear && matchesSearch;
    })
    .sort((a: any, b: any) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return timeA - timeB;
    });

  const buildLedgerPayload = (): ExportCitizenLedgerPdfPayload => {
    if (!profile) {
      throw new Error('Nenhum associado selecionado para emissão.');
    }

    const totalInflow = dataFiltered
      .filter((tx: any) => tx.direction === 'inbound' || tx.type === 'income')
      .reduce((acc: number, tx: any) => acc + (Number(tx.amount) || 0), 0);

    const contractTotal = profile.contract?.contractedAmount ?? 0;
    const totalPaid = profile.contract?.paidAmount ?? totalInflow;
    const outstandingBalance = profile.contract?.openAmount ?? Math.max(0, contractTotal - totalPaid);

    return {
      associate_id: profile.associate.id,
      open_after_export: true,
      data: {
        meta: {
          generated_at: fDate(new Date(), 'DD/MM/YYYY HH:mm'),
          reference_period: selectedYear === 'Todos' ? fDate(new Date(), 'YYYY-MM') : selectedYear,
          audit_hash: '',
        },
        associate: {
          id: profile.associate.id,
          name: profile.associate.name,
          cpf: profile.associate.cpf || '',
          email: profile.associate.email || '',
          avatar_letter: profile.associate.name?.charAt(0) || 'A',
          address_line1: (profile.associate as any).address_line1 || 'Endereço não informado',
          address_line2: (profile.associate as any).address_line2 || '',
        },
        summary: {
          total_contracted: fNumber(contractTotal),
          total_paid: fNumber(totalPaid),
          outstanding_balance: fNumber(outstandingBalance),
        },
        transactions: dataFiltered.map((row: any) => {
          const isOutbound = row.direction === 'outbound';
          const statusLabel =
            row.status === 'confirmed'
              ? 'Concluído'
              : row.amount === 0 || row.category === 'Falta de Pagamento'
              ? 'Falta Pgto'
              : row.status === 'pending'
              ? 'Pendente'
              : 'Inadimplente';

          const statusVariant =
            row.status === 'confirmed'
              ? 'confirmed'
              : row.amount === 0 || row.category === 'Falta de Pagamento'
              ? 'danger'
              : 'muted';

          return {
            date: fDate(row.created_at, 'DD/MM/YYYY'),
            counterparty: row.counterparty_name || 'N/A',
            origin: row.origin_institution || 'N/A',
            destination: row.destination_institution || 'N/A',
            amount: fNumber(row.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            direction: isOutbound ? 'outbound' : 'inbound',
            status_label: statusLabel,
            status_variant: statusVariant,
          };
        }),
      },
    };
  };

  const handleOpenPreview = async () => {
    if (!profile) return;
    setOpenPreview(true);
    setPreviewLoading(true);
    setPdfPreview(null);
    try {
      const payload = buildLedgerPayload();
      const res = await previewCitizenLedgerPdf(payload);
      setPdfPreview(res);
      toast.success('Visualização nativa do PDF compilada via Typst Engine!');
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Falha ao compilar extrato em PDF';
      toast.error(msg);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!profile) return;

    try {
      setExporting(true);

      if (pdfPreview?.preview_id && pdfPreview.metadata.sha256_checksum) {
        const result = await exportPreviewedCitizenLedgerPdf(pdfPreview);
        toast.success(`Relatório verificado e exportado com sucesso! Arquivo: ${result.file_name || result.file_path}`);
        return;
      }

      const payload = buildLedgerPayload();
      const result = await exportCitizenLedgerPdf(payload, profile, dataFiltered);
      toast.success(`Relatório compilado com sucesso! Arquivo: ${result.file_name || result.file_path}`);
    } catch (err: any) {
      toast.error(err.message || 'Falha ao compilar relatório em PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Box className="no-print">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={
                previewLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon={'solar:eye-bold' as any} />
                )
              }
              onClick={handleOpenPreview}
              sx={{ borderRadius: 1.5 }}
              disabled={!profile || previewLoading}
            >
              Visualizar Extrato A4
            </Button>

            <Button
              variant="contained"
              color="primary"
              startIcon={
                exporting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon={'eva:file-text-fill' as any} />
                )
              }
              onClick={handleExportPdf}
              disabled={exporting || !profile}
              sx={{ borderRadius: 1.5 }}
            >
              {exporting ? 'Compilando via Typst...' : 'Exportar PDF A4'}
            </Button>
          </Box>
        </Box>

        <AssociateSearchCard
          selectedAssociateId={selectedCitizenId}
          onSelectAssociate={handleSelectProfile}
          selectedProfile={profile}
        />

        {profileLoading && (
          <Box sx={{ width: '100%', my: 4 }}>
            <LinearProgress color="primary" />
          </Box>
        )}

        {profileError && (
          <Alert severity="warning" sx={{ my: 3 }}>
            Serviço financeiro indisponível. Não foi possível consultar os dados oficiais do associado.
          </Alert>
        )}

        {!selectedCitizenId && !profileLoading && !profileError && (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: (theme) => `1px dashed ${theme.palette.divider}`,
              my: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Nenhum associado selecionado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Utilize o campo de busca acima para localizar um associado e consultar seu histórico contábil oficial.
            </Typography>
          </Box>
        )}

        {!profileLoading && profile && (
          <>
            <FinancialSummaryHeader
              years={availableYears as string[]}
              selectedYear={selectedYear}
              onSelectYear={setSelectedYear}
              onSearch={setSearchQuery}
              searchQuery={searchQuery}
              profile={profile}
            />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <FinancialTransactionsTable
                  title="Histórico e Extrato de Movimentações"
                  tableData={dataFiltered}
                />
              </Grid>
            </Grid>
          </>
        )}
      </Box>

      {/* Modal de Visualização Nativa do PDF Oficial */}
      <Dialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        fullWidth
        maxWidth="lg"
        slotProps={{
          paper: {
            sx: {
              height: '94vh',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: (theme: Theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f1f5f9'),
              borderRadius: 2,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            py: 1.75,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: (theme: Theme) => `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Iconify icon={'solar:document-text-bold' as any} width={24} sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Visualização do Documento Oficial • Extrato Financeiro do Associado
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                ASPPIBRA Citizen Ledger • Renderização Nativa Typst
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={() => setOpenPreview(false)} sx={{ color: 'text.secondary' }}>
            <Iconify icon={'eva:close-fill' as any} />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            flex: 1,
            p: 0,
            overflowY: 'hidden',
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0b0f19' : '#e2e8f0'),
          }}
        >
          {previewLoading ? (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Compilando demonstrativo oficial via Typst Engine nativo...
              </Typography>
            </Box>
          ) : (
            <PdfViewerLayout
              documentTitle={`Extrato_${profile?.associate.id || 'associado'}`}
              preview={pdfPreview}
              onBack={() => setOpenPreview(false)}
              onExport={handleExportPdf}
              isExporting={exporting}
              viewButtonText="Atualizar"
              exportButtonText="Exportar PDF Oficial"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
