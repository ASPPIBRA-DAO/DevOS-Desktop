import type {
  VaultStatus,
  IpfsDaemonStatus,
  DeviceStatusResponse,
} from '../../../platform/tauri';

import React, { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Card } from '../../../shared/components/Card';
import { colors } from '../../../shared/theme/palette';
import { VaultStatusMetric } from '../../../modules/wallets';
// Componentes modulares de domínio
import { HostIntegrityCard } from '../../../modules/identity';
import { MetricBox } from '../../../shared/components/MetricBox';
import { formatAsppbr } from '../../../shared/utils/format-number';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { StorageProofCard, IpfsDaemonMetric } from '../../../modules/ipfs';
import {
  IpfsBridge,
  SystemBridge,
  WalletBridge,
  isTauriDesktop,
} from '../../../platform/tauri';

export function NodeDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusResponse | null>(null);
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
  const [ipfsStatus, setIpfsStatus] = useState<IpfsDaemonStatus | null>(null);
  const [lastCheck, setLastCheck] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDesktop = isTauriDesktop();

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (isDesktop) {
        const [devRes, vaultRes, ipfsRes] = await Promise.all([
          SystemBridge.getDeviceStatus(),
          WalletBridge.getVaultStatus().catch(() => ({
            is_initialized: false,
            is_unlocked: false,
            dao_wallets_count: 0,
            client_wallets_count: 0,
          })),
          IpfsBridge.getDaemonStatus(),
        ]);
        setDeviceStatus(devRes);
        setVaultStatus(vaultRes);
        setIpfsStatus(ipfsRes);
      } else {
        // Fallback ilustrativo quando aberto no navegador web comum fora do Tauri
        setDeviceStatus({ enrolled: false, status: 'WEB_PREVIEW' });
        setVaultStatus({
          is_initialized: true,
          is_unlocked: false,
          dao_wallets_count: 1,
          client_wallets_count: 0,
        });
        setIpfsStatus({ running: true, peers_count: 18, repo_size_bytes: 4294967296 });
      }
      setLastCheck(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header do Nó */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 4,
          pb: 3,
          borderBottom: `1px solid ${colors.background.border}`,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              DevOS Node
            </Typography>
            <StatusBadge
              status={isDesktop ? 'ACTIVE' : 'SYNCING'}
              label={isDesktop ? 'Motor Nativo Ativo' : 'Navegador Preview'}
            />
          </Box>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Painel Operacional do Nó DePIN • ASPPIBRA Storage Network (Kubo + Tauri v2)
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {lastCheck && (
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
              Último ping: {lastCheck}
            </Typography>
          )}
          <Button
            variant="outlined"
            onClick={loadMetrics}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{
              borderColor: colors.primary.main,
              color: colors.primary.main,
              '&:hover': {
                borderColor: colors.primary.light,
                backgroundColor: 'rgba(0, 240, 255, 0.08)',
              },
            }}
          >
            {loading ? 'Consultando Rust...' : 'Sincronizar Motor'}
          </Button>
        </Box>
      </Box>

      {/* Alerta de Erro se houver */}
      {errorMessage && (
        <Card sx={{ mb: 3, borderColor: colors.error.main, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <Typography variant="body2" sx={{ color: colors.error.light, fontWeight: 600 }}>
            {errorMessage}
          </Typography>
        </Card>
      )}

      {/* Grid de Métricas Principais */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: 'repeat(4, 1fr)',
          },
          gap: 2.5,
          mb: 4,
        }}
      >
        <MetricBox
          label="Stake Operacional"
          value={formatAsppbr(50000)}
          subtext="Garantia de custódia e pinning do nó"
          accentColor={colors.primary.main}
        />

        <MetricBox
          label="Recompensa de Época"
          value={formatAsppbr(1450)}
          subtext="Distribuído após verificação de SLA"
          accentColor={colors.success.main}
        />

        {/* Métrica do Módulo de Carteiras / Cofre */}
        <VaultStatusMetric status={vaultStatus} />

        {/* Métrica do Módulo IPFS */}
        <IpfsDaemonMetric status={ipfsStatus} />
      </Box>

      {/* Painéis Detalhados */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr 1fr',
          },
          gap: 2.5,
        }}
      >
        {/* Painel do Dispositivo Host (Módulo Identity) */}
        <HostIntegrityCard deviceStatus={deviceStatus} isDesktop={isDesktop} />

        {/* Protocolo de Prova DePIN (Módulo IPFS) */}
        <StorageProofCard />
      </Box>
    </Box>
  );
}

// Alias de compatibilidade com nomenclatura anterior
export const NodeDashboardView = NodeDashboardPage;

