import type { Theme } from '@mui/material/styles';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate } from 'src/shared/utils/format-time';
import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';
import { fNumber } from 'src/shared/utils/format-number';

import { useGetCitizenLedger } from '../../hooks/treasury-hooks';
import { AssociateSearchCard } from '../components/associate-search-card';
import { FinancialHistoryPrint } from '../components/financial-history-print';
import { BLANK_FINANCIAL_PROFILE } from '../../../domain/ledger-canonical-data';
import { FinancialSummaryHeader } from '../components/financial-summary-header';
import { FinancialTransactionsTable } from '../components/financial-transactions-table';
import {
  exportCitizenLedgerPdf,
  type ExportCitizenLedgerPdfPayload,
} from '../../../services/ledger-export-service';

// ----------------------------------------------------------------------

export function CitizenLedgerView() {
  const [selectedYear, setSelectedYear] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [openPreview, setOpenPreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [selectedCitizenId, setSelectedCitizenId] = useState<string | null>('10');

  const { profile, profileLoading } = useGetCitizenLedger(selectedCitizenId);

  const handleSelectProfile = (id: string | null) => {
    setSelectedCitizenId(id);
  };

  const profileToRender = profile || BLANK_FINANCIAL_PROFILE;

  const transactionYears = Array.from<string>(
    new Set(
      profileToRender.transactions.map((tx: any) =>
        new Date(tx.created_at).getFullYear().toString()
      )
    )
  ).sort((a: string, b: string) => b.localeCompare(a));

  const availableYears = transactionYears.length > 0 ? ['Todos', ...transactionYears] : ['Todos'];

  const dataFiltered = profileToRender.transactions
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

  const handleExportPdf = async () => {
    if (!profile) return;

    try {
      setExporting(true);

      const totalInflow = dataFiltered
        .filter((tx: any) => tx.direction === 'inbound' || tx.type === 'income')
        .reduce((acc: number, tx: any) => acc + (Number(tx.amount) || 0), 0);

      const contractTotal = profile?.contract?.contractedAmount || 65000;
      const totalPaid = profile?.contract?.paidAmount ?? totalInflow;
      const outstandingBalance = profile?.contract?.openAmount ?? Math.max(0, contractTotal - totalPaid);

      const payload: ExportCitizenLedgerPdfPayload = {
        associate_id: profile.associate.id,
        open_after_export: true,
        data: {
          meta: {
            generated_at: fDate(new Date(), 'DD/MM/YYYY'),
            reference_period: fDate(new Date(), 'YYYY-MM-A4'),
            audit_hash: `d1_sha256_${profile.associate.id}_ledger`,
          },
          associate: {
            id: profile.associate.id,
            name: profile.associate.name || 'ANDRESSA DE LIMA FERREIRA',
            cpf: profile.associate.cpf || '173.793.567-80',
            email: profile.associate.email || 'contato@asppibra.org.br',
            avatar_letter: profile.associate.name?.charAt(0) || 'A',
            address_line1: 'Rua Palmira F. De Carvalho, lote 05, Quadra D',
            address_line2: 'São José de Imbassaí, Maricá - RJ, 24912-000',
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

      const result = await exportCitizenLedgerPdf(payload);
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
              startIcon={<Iconify icon={'solar:eye-bold' as any} />}
              onClick={() => setOpenPreview(true)}
              sx={{ borderRadius: 1.5 }}
              disabled={!profile}
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

        {!profileLoading && (
          <>
            <FinancialSummaryHeader
              years={availableYears as string[]}
              selectedYear={selectedYear}
              onSelectYear={setSelectedYear}
              onSearch={setSearchQuery}
              searchQuery={searchQuery}
              profile={profileToRender}
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

      {/* Extrato Oficial Fiduciário A4 Padrão (Garante que a impressão e PDF gerem sempre a folha A4 e nunca a interface) */}
      <FinancialHistoryPrint
        transactions={dataFiltered}
        profile={profileToRender}
        preview={false}
      />

      {/* Modal de Pré-Visualização do Relatório Oficial em Alta Fidelidade */}
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
                Pré-Visualização do Relatório Oficial • Extrato Contábil D1
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Documento A4 Padrão ABNT / ASPPIBRA DAO Cockpit
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon={'solar:printer-bold' as any} />}
              onClick={() => {
                setOpenPreview(false);
                setTimeout(() => window.print(), 150);
              }}
              sx={{ borderRadius: 1.5 }}
            >
              Imprimir Folha A4
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
              {exporting ? 'Compilando via Typst...' : 'Exportar PDF Oficial'}
            </Button>

            <IconButton onClick={() => setOpenPreview(false)} sx={{ color: 'text.secondary' }}>
              <Iconify icon={'eva:close-fill' as any} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            flex: 1,
            p: 3,
            overflowY: 'auto',
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0b0f19' : '#e2e8f0'),
          }}
        >
          <Box sx={{ maxWidth: 860, mx: 'auto', my: 2 }}>
            <FinancialHistoryPrint
              transactions={dataFiltered}
              profile={profileToRender}
              preview
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
