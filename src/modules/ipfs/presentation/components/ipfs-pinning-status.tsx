import type {
  CustodyState,
  IntegrityState,
  AvailabilityState,
  IpfsCidCustodyStatus,
} from '../../../../platform/tauri';

import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { colors } from 'src/theme';
import { Card, StatusBadge } from 'src/shared/components/data-display';

export interface IpfsPinningStatusProps {
  status?: IpfsCidCustodyStatus | null;
  cid?: string;
}

export function IpfsPinningStatus({ status, cid }: IpfsPinningStatusProps) {
  const integrity: IntegrityState = status?.integrity ?? 'PENDING';
  const custody: CustodyState = status?.custody ?? 'NOT_PINNED';
  const availability: AvailabilityState = status?.availability ?? 'UNVERIFIED';

  const getIntegrityBadge = (state: IntegrityState) => {
    switch (state) {
      case 'CONFIRMED':
        return <StatusBadge status="ACTIVE" label="Integridade Confirmada" />;
      case 'FAILED':
        return <StatusBadge status="OFFLINE" label="Falha de Checksum" />;
      case 'PENDING':
      default:
        return <StatusBadge status="SYNCING" label="Pendente de Verificação" />;
    }
  };

  const getCustodyBadge = (state: CustodyState) => {
    switch (state) {
      case 'RECURSIVE_PIN':
        return <StatusBadge status="ACTIVE" label="Pin Recursivo (Fixado)" />;
      case 'DIRECT_PIN':
        return <StatusBadge status="ACTIVE" label="Pin Direto (Fixado)" />;
      case 'INCOMPLETE_PIN':
        return <StatusBadge status="SYNCING" label="Pin Incompleto" />;
      case 'NOT_PINNED':
      default:
        return <StatusBadge status="OFFLINE" label="Não Fixado" />;
    }
  };

  const getAvailabilityBadge = (state: AvailabilityState) => {
    switch (state) {
      case 'RECOVERY_CONFIRMED':
        return <StatusBadge status="ACTIVE" label="Recuperação P2P Confirmada" />;
      case 'PROVIDERS_FOUND':
        return <StatusBadge status="SYNCING" label={`${status?.providers_count || 1} Provedor(es) na DHT`} />;
      case 'LOOKUP_FAILED':
        return <StatusBadge status="OFFLINE" label="Falha na Busca DHT" />;
      case 'UNAVAILABLE':
        return <StatusBadge status="OFFLINE" label="Indisponível na Rede" />;
      case 'UNVERIFIED':
      default:
        return <StatusBadge status="OFFLINE" label="Não Verificada" />;
    }
  };

  return (
    <Card variant="glass" sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Indicadores de Armazenamento DePIN
        </Typography>
        {cid && (
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              color: colors.text.secondary,
              maxWidth: 240,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            CID: {cid}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {/* 1. Integridade Física */}
        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,
            border: `1px solid ${colors.background.border}`,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}
          >
            1. Integridade Criptográfica
          </Typography>
          <Box sx={{ mb: 1.5 }}>{getIntegrityBadge(integrity)}</Box>
          <Typography variant="caption" sx={{ color: colors.text.disabled, display: 'block' }}>
            {status?.recovered_sha256
              ? `Digest: ${status.recovered_sha256.slice(0, 10)}...${status.recovered_sha256.slice(-8)}`
              : 'Checksum SHA-256 local vs original'}
          </Typography>
        </Box>

        {/* 2. Custódia Local */}
        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,
            border: `1px solid ${colors.background.border}`,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}
          >
            2. Custódia Local (Nó)
          </Typography>
          <Box sx={{ mb: 1.5 }}>{getCustodyBadge(custody)}</Box>
          <Typography variant="caption" sx={{ color: colors.text.disabled, display: 'block' }}>
            {status?.is_managed_by_devos
              ? 'Conteúdo sob custódia gerenciada pelo DevOS'
              : 'Verificação física dos blocos no repositório'}
          </Typography>
        </Box>

        {/* 3. Disponibilidade Descentralizada */}
        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,
            border: `1px solid ${colors.background.border}`,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}
          >
            3. Disponibilidade P2P
          </Typography>
          <Box sx={{ mb: 1.5 }}>{getAvailabilityBadge(availability)}</Box>
          <Typography variant="caption" sx={{ color: colors.text.disabled, display: 'block' }}>
            Consulta na DHT sem falsos positivos locais
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
