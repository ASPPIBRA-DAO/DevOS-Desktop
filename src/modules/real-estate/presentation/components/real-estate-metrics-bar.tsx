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
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)',
        },
        gap: 2,
        mb: 3.5,
        width: '100%',
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
        label="Métrica 02"
        value="N/A"
        subtext="Aguardando definição"
        accentColor={colors.text.secondary}
        icon={<Iconify icon="solar:chart-square-linear" width={24} />}
      />
      <MetricBox
        label="Métrica 03"
        value="N/A"
        subtext="Aguardando definição"
        accentColor={colors.text.secondary}
        icon={<Iconify icon="solar:chart-square-linear" width={24} />}
      />
      <MetricBox
        label="Métrica 04"
        value="N/A"
        subtext="Aguardando definição"
        accentColor={colors.text.secondary}
        icon={<Iconify icon="solar:chart-square-linear" width={24} />}
      />
    </Box>
  );
}
