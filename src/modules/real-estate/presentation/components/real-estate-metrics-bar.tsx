import type { RealEstateStats } from '../../../../platform/tauri/real-estate/real-estate-bridge';

import React from 'react';

import Box from '@mui/material/Box';

import { colors } from '../../../../shared/theme/palette';
import { Iconify } from '../../../../shared/components/iconify';
import { MetricBox } from '../../../../shared/components/MetricBox';

export interface RealEstateMetricsBarProps {
  stats: RealEstateStats | null;
}

/**
 * Componente de apresentação das métricas consolidadas de cadastro territorial
 * e auditoria imobiliária.
 */
export function RealEstateMetricsBar({ stats }: RealEstateMetricsBarProps) {
  return (
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
  );
}
