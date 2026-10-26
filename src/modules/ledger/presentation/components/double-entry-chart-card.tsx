import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ButtonGroup from '@mui/material/ButtonGroup';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/shared/components/iconify';
import { fCurrency } from 'src/shared/utils/format-number';
import { Chart, useChart } from 'src/shared/components/chart';

import {
  PERIOD_DATA,
  LEDGER_ACCOUNTS,
  LEDGER_METADATA,
} from '../../domain/ledger-canonical-data';

// ----------------------------------------------------------------------

type ChartMode = 'flow' | 'cumulative' | 'accounts';

type DoubleEntryChartCardProps = {
  onOpenCitizenLedger?: () => void;
};

export function DoubleEntryChartCard({ onOpenCitizenLedger }: DoubleEntryChartCardProps) {
  const theme = useTheme();
  const [chartMode, setChartMode] = useState<ChartMode>('flow');
  const containerRef = useRef<HTMLDivElement>(null);

  // Redesenha o gráfico quando a barra lateral expande/recolhe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return () => {};
    const observer = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const series = useMemo(() => {
    if (chartMode === 'flow') {
      return [
        {
          name: 'Créditos Contábeis (Entradas)',
          type: 'column',
          data: PERIOD_DATA.credits,
        },
        {
          name: 'Débitos Contábeis (Saídas)',
          type: 'column',
          data: PERIOD_DATA.debits,
        },
        {
          name: 'Saldo Líquido Periódico',
          type: 'line',
          data: PERIOD_DATA.netBalance,
        },
      ];
    }

    if (chartMode === 'cumulative') {
      return [
        {
          name: 'Reserva Canônica Cumulativa (D1)',
          type: 'area',
          data: PERIOD_DATA.cumulativeReserves,
        },
      ];
    }

    // Modo accounts: Distribuição dos saldos das contas D1
    return [
      {
        name: 'Saldo Conciliado D1',
        type: 'bar',
        data: LEDGER_ACCOUNTS.map((acc) => {
          const raw = acc.saldoDisponivel.replace('R$ ', '').replace(/,/g, '');
          return parseFloat(raw) || 0;
        }),
      },
    ];
  }, [chartMode]);

  const chartColors = useMemo(() => {
    if (chartMode === 'flow') return ['#00A76F', '#FF5630', '#0284C7'];
    if (chartMode === 'cumulative') return ['#00A76F'];
    return ['#6366F1'];
  }, [chartMode]);

  const chartOptions = useChart({
    colors: chartColors,
    chart: {
      stacked: false,
      toolbar: { show: false },
      redrawOnParentResize: true,
      redrawOnWindowResize: true,
      zoom: { enabled: false },
    },
    stroke: {
      width: chartMode === 'flow' ? [0, 0, 2.5] : chartMode === 'cumulative' ? [2] : [0],
      curve: 'smooth',
    },
    plotOptions: {
      bar: {
        columnWidth: chartMode === 'accounts' ? '55%' : '48%',
        borderRadius: 4,
        horizontal: chartMode === 'accounts',
      },
    },
    fill: {
      type: chartMode === 'cumulative' ? 'gradient' : 'solid',
      gradient: {
        type: 'vertical',
        shadeIntensity: 0,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    xaxis: {
      categories:
        chartMode === 'accounts'
          ? LEDGER_ACCOUNTS.map((acc) => `Conta #${acc.accountId} • ${acc.accountName.split(' ')[0]}`)
          : PERIOD_DATA.categories,
      tickPlacement: 'on',
      labels: {
        rotate: -35,
        rotateAlways: false,
        hideOverlappingLabels: true,
        trim: true,
        style: {
          fontSize: '10px',
          fontWeight: 600,
          colors: theme.palette.text.secondary,
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
          if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
          return `R$ ${val.toFixed(0)}`;
        },
        style: {
          fontSize: '10px',
          colors: theme.palette.text.secondary,
        },
      },
    },
    tooltip: {
      y: { formatter: (val: number) => fCurrency(val) },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
      fontWeight: 600,
      markers: { shape: 'circle' },
      itemMargin: { horizontal: 6, vertical: 2 },
    },
    responsive: [
      {
        breakpoint: 1280,
        options: {
          legend: { position: 'top', horizontalAlign: 'center' },
          xaxis: { labels: { rotate: -45, style: { fontSize: '9px' } } },
        },
      },
      {
        breakpoint: 768,
        options: {
          legend: { position: 'bottom', horizontalAlign: 'center' },
          xaxis: { labels: { rotate: -45, style: { fontSize: '9px' } } },
        },
      },
    ],
  });

  return (
    <Card
      ref={containerRef}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      {/* 1. CABEÇALHO COM CONTROLES */}
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1.5}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          mb: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: 'text.primary',
                fontSize: { xs: '0.95rem', sm: '1.1rem' },
              }}
            >
              Balanço Dinâmico & Auditoria Contábil D1
            </Typography>
            <Chip
              label="TEMPO REAL • V16"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 800, fontSize: '0.62rem', height: 20 }}
            />
          </Stack>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
              fontSize: '0.72rem',
              lineHeight: 1.3,
            }}
          >
            Fluxo analítico de débitos e créditos sincronizado com a escrituração canônica SQLite Cloudflare D1
          </Typography>
        </Box>

        {/* SELETOR DE MODO DE VISUALIZAÇÃO */}
        <ButtonGroup
          size="small"
          variant="outlined"
          sx={{
            borderRadius: 1.25,
            overflow: 'hidden',
            flexShrink: 0,
            '& .MuiButton-root': {
              px: { xs: 1, sm: 1.25 },
              py: 0.5,
              fontWeight: 700,
              fontSize: { xs: '0.68rem', sm: '0.72rem' },
              whiteSpace: 'nowrap',
            },
          }}
        >
          <Button
            variant={chartMode === 'flow' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setChartMode('flow')}
            startIcon={<Iconify icon={'solar:chart-2-bold' as any} width={15} />}
          >
            Débito vs Crédito
          </Button>

          <Button
            variant={chartMode === 'cumulative' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setChartMode('cumulative')}
            startIcon={<Iconify icon={'solar:graph-up-bold' as any} width={15} />}
          >
            Reserva Cumulativa
          </Button>

          <Button
            variant={chartMode === 'accounts' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setChartMode('accounts')}
            startIcon={<Iconify icon={'solar:wallet-money-bold' as any} width={15} />}
          >
            Plano de Contas
          </Button>

          {onOpenCitizenLedger && (
            <Button
              variant="outlined"
              color="primary"
              onClick={onOpenCitizenLedger}
              startIcon={<Iconify icon={'solar:user-id-bold' as any} width={15} />}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.16),
                },
              }}
            >
              Extrato por Associado
            </Button>
          )}
        </ButtonGroup>
      </Stack>

      {/* 2. KPIS CONSOLIDADOS */}
      <Grid container spacing={1.25} sx={{ mb: 1.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 6, xl: 3 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 1.25,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              minWidth: 0,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
              Reserva Gênesis (Conta #1)
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace', fontSize: { xs: '1rem', sm: '1.1rem' }, my: 0.25 }}>
              {LEDGER_METADATA.reservaGenesis}
            </Typography>
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.68rem' }}>
              ● 100% Lastreado Fiduciário
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 6, xl: 3 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 1.25,
              bgcolor: alpha(theme.palette.success.main, 0.05),
              border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
              minWidth: 0,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
              Volume Movimentado
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'success.main', fontFamily: 'monospace', fontSize: { xs: '1rem', sm: '1.1rem' }, my: 0.25 }}>
              {LEDGER_METADATA.volumeTotal}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.68rem' }}>
              42 transações liquidadas
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 6, xl: 3 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 1.25,
              bgcolor: alpha(theme.palette.info.main, 0.05),
              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
              minWidth: 0,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
              Tesouraria Consolidada
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace', fontSize: { xs: '1rem', sm: '1.1rem' }, my: 0.25 }}>
              R$ 36.623,00
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.68rem' }}>
              Conta #11 • Ref: PM4
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 6, xl: 3 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 1.25,
              bgcolor: alpha(theme.palette.warning.main, 0.05),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
              minWidth: 0,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
              Auditoria D1 Canônica
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'warning.main', fontFamily: 'monospace', fontSize: { xs: '1rem', sm: '1.1rem' }, my: 0.25 }}>
              43 Lançamentos
            </Typography>
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.68rem' }}>
              ● 0 Inconsistências
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

      {/* 3. GRÁFICO APEXCHARTS */}
      <Box sx={{ width: '100%', minWidth: 0, overflow: 'hidden', pt: 0.5 }}>
        <Chart
          type={chartMode === 'accounts' ? 'bar' : chartMode === 'cumulative' ? 'area' : 'line'}
          series={series}
          options={chartOptions}
          sx={{
            height: { xs: 240, sm: 260, md: 280, xl: 310 },
            width: '100%',
          }}
        />
      </Box>
    </Card>
  );
}
