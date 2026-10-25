import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { colors } from '../../../shared/theme/palette';
import { MetricBox } from '../../../shared/components/MetricBox';
import { StatusBadge } from '../../../shared/components/StatusBadge';

export function CockpitDashboardPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 4, pb: 3, borderBottom: `1px solid ${colors.background.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            DevOS Admin
          </Typography>
          <StatusBadge status="ACTIVE" label="Edição Administrador" />
        </Box>
        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
          Painel Institucional de Administração de Cluster & Governança ASPPIBRA DAO
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: 'repeat(4, 1fr)',
          },
          gap: 2.5,
        }}
      >
        <MetricBox
          label="Total de Nós Ativos"
          value="128 Nós"
          subtext="Rede global de armazenamento"
          accentColor={colors.primary.main}
        />
        <MetricBox
          label="Capacidade Total Pinada"
          value="512 TB"
          subtext="Replicação mínima 3x por CID"
          accentColor={colors.success.main}
        />
        <MetricBox
          label="SLA Médio da Rede"
          value="99.98%"
          subtext="Desafios DePIN validados com sucesso"
          accentColor={colors.info.main}
        />
        <MetricBox
          label="Tesouraria / Staking"
          value="6.400.000 ASPPBR"
          subtext="Bloqueado em smart contract de nós"
          accentColor={colors.warning.main}
        />
      </Box>
    </Box>
  );
}

// Alias de compatibilidade com nomenclatura anterior
export const CockpitDashboardView = CockpitDashboardPage;
