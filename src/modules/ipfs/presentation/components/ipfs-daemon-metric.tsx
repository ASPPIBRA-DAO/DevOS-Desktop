import type { IpfsDaemonStatus } from '../../../../platform/tauri';

import React from 'react';

import { colors } from '../../../../shared/theme/palette';
import { MetricBox } from '../../../../shared/components/MetricBox';

export interface IpfsDaemonMetricProps {
  status: IpfsDaemonStatus | null;
}

/**
 * Componente do módulo IPFS responsável por exibir a métrica de estado
 * do daemon Kubo e contagem de peers conectados.
 */
export function IpfsDaemonMetric({ status }: IpfsDaemonMetricProps) {
  const isRunning = Boolean(status?.running);
  const peersCount = status?.peers_count || 0;

  return (
    <MetricBox
      label="Daemon IPFS Local"
      value={isRunning ? `${peersCount} Peers` : 'Inativo'}
      subtext={isRunning ? 'Kubo daemon operacional' : 'Aguardando inicialização'}
      accentColor={isRunning ? colors.primary.main : colors.text.disabled}
    />
  );
}
