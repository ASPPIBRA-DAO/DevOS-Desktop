import type { VaultStatus } from '../../../../platform/tauri';

import React from 'react';

import { colors } from '../../../../shared/theme/palette';
import { MetricBox } from '../../../../shared/components/MetricBox';

export interface VaultStatusMetricProps {
  status: VaultStatus | null;
}

/**
 * Componente do módulo de Carteiras responsável por apresentar o estado
 * do cofre de chaves nativo (inicialização, bloqueio e carteiras SQLite).
 */
export function VaultStatusMetric({ status }: VaultStatusMetricProps) {
  const isInitialized = Boolean(status?.is_initialized);
  const isUnlocked = Boolean(status?.is_unlocked);
  const walletsCount = status?.dao_wallets_count || 0;

  const value = isInitialized
    ? isUnlocked
      ? 'Desbloqueado'
      : 'Trancado'
    : 'Não Inicializado';

  const accentColor = isUnlocked ? colors.success.main : colors.warning.main;

  return (
    <MetricBox
      label="Cofre Nativo Local"
      value={value}
      subtext={`${walletsCount} carteiras persistidas no SQLite`}
      accentColor={accentColor}
    />
  );
}
