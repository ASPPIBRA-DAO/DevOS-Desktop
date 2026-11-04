import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ButtonGroup from '@mui/material/ButtonGroup';
import { alpha, useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';

import { fCurrency } from 'src/shared/utils';
import { Iconify } from 'src/shared/components/iconify';
import { Chart, useChart } from 'src/shared/components/chart';

import { useGetTreasuryAnalytics } from '../hooks/treasury-hooks';

// ----------------------------------------------------------------------

type ChartMode = 'flow' | 'cumulative' | 'accounts';

type DoubleEntryChartCardProps = {
  onOpenCitizenLedger?: () => void;
};

export function DoubleEntryChartCard({ onOpenCitizenLedger }: DoubleEntryChartCardProps) {
  const theme = useTheme();
  const [chartMode, setChartMode] = useState<ChartMode>('flow');
  const containerRef = useRef<HTMLDivElement>(null);

  const { analytics, analyticsLoading, analyticsError, analyticsEmpty } = useGetTreasuryAnalytics();

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

  const categories = useMemo(() => {
    if (!analytics) return [];
    if (chartMode === 'accounts') {
      return (analytics.distribution || []).map((d) => d.label);
    }
    return (analytics.monthlyTrend || []).map((m) => m.month);
  }, [analytics, chartMode]);

  const series = useMemo(() => {
    if (!analytics) return [];

    if (chartMode === 'flow') {
      return [
        {
          name: 'Entradas Contábeis',
          type: 'column',
          data: (analytics.monthlyTrend || []).map((m) => m.total),
        },
      ];
    }

    if (chartMode === 'cumulative') {
      let run = 0;
      const cumulativeData = (analytics.monthlyTrend || []).map((m) => {
        run += m.total;
        return run;
      });

      return [
        {
          name: 'Reserva Cumulativa Oficial',
          type: 'area',
          data: cumulativeData,
        },
      ];
    }

    // Modo accounts: Distribuição
    return [
      {
        name: 'Distribuição Contábil',
        type: 'bar',
        data: (analytics.distribution || []).map((d) => d.value),
      },
    ];
  }, [analytics, chartMode]);

  const chartColors = useMemo(() => {
    if (chartMode === 'flow') return ['#00A76F'];
    if (chartMode === 'cumulative') return ['#0284C7'];
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
      width: chartMode === 'flow' ? [0] : chartMode === 'cumulative' ? [2] : [0],
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
      categories,
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
              Balanço Geral & Auditoria de Tesouraria
            </Typography>
            <Chip
              label="BASE OFICIAL DAO"
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
            Demonstrativo contábil consultado diretamente na API oficial da ASPPIBRA DAO
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
            Fluxo Mensal
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
            Distribuição
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

      {analyticsLoading && (
        <Box sx={{ width: '100%', my: 3 }}>
          <LinearProgress color="primary" />
        </Box>
      )}

      {analyticsError && (
        <Alert severity="warning" sx={{ my: 2 }}>
          Serviço financeiro indisponível. Não foi possível consultar os dados oficiais do Balanço Geral.
        </Alert>
      )}

      {/* 2. KPIS CONSOLIDADOS */}
      {!analyticsLoading && !analyticsError && analytics && (
        <>
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
                  Volume Arrecadado
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace', fontSize: { xs: '1rem', sm: '1.1rem' }, my: 0.25 }}>
                  {fCurrency(analytics.summary.totalInflow || 0)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.68rem' }}>
                  ● Consulta Oficial
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
                  Transações Liquidadas
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'success.main', fontFamily: 'monospace', fontSize: { xs: '1rem', sm: '1.1rem' }, my: 0.25 }}>
                  {analytics.summary.count || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.68rem' }}>
                  Lançamentos confirmados
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
                  Ticket Médio
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace', fontSize: { xs: '1rem', sm: '1.1rem' }, my: 0.25 }}>
                  {fCurrency(analytics.summary.avgTicket || 0)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.68rem' }}>
                  Por associado adimplente
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
                  Destinatário Principal
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'warning.main', fontSize: { xs: '0.85rem', sm: '0.95rem' }, my: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {analytics.summary.topRecipient || 'Tesouraria ASPPIBRA'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.68rem' }}>
                  ● Conta Verificada
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

          {/* 3. GRÁFICO APEXCHARTS */}
          {series.length > 0 && categories.length > 0 ? (
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
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum dado analítico disponível para exibição no gráfico.
              </Typography>
            </Box>
          )}
        </>
      )}

      {analyticsEmpty && !analyticsLoading && !analyticsError && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Nenhum registro financeiro disponível na base oficial.
          </Typography>
        </Box>
      )}
    </Card>
  );
}
