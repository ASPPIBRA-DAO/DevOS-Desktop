import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { colors } from '../../theme/palette';

export type NodeStatusType =
  | 'ONLINE'
  | 'OFFLINE'
  | 'ACTIVE'
  | 'PENDING'
  | 'SYNCING'
  | 'SLASHED'
  | 'UNINITIALIZED';

export interface StatusBadgeProps {
  status: NodeStatusType | string;
  label?: string;
  pulse?: boolean;
}

const statusConfig: Record<string, { color: string; bg: string; defaultLabel: string }> = {
  ONLINE: { color: colors.success.main, bg: 'rgba(16, 185, 129, 0.12)', defaultLabel: 'Online' },
  ACTIVE: { color: colors.success.main, bg: 'rgba(16, 185, 129, 0.12)', defaultLabel: 'Ativo' },
  SYNCING: { color: colors.primary.main, bg: 'rgba(0, 240, 255, 0.12)', defaultLabel: 'Sincronizando' },
  PENDING: { color: colors.warning.main, bg: 'rgba(245, 158, 11, 0.12)', defaultLabel: 'Pendente' },
  UNINITIALIZED: { color: colors.warning.light, bg: 'rgba(245, 158, 11, 0.12)', defaultLabel: 'Não Inicializado' },
  OFFLINE: { color: colors.text.disabled, bg: 'rgba(75, 85, 99, 0.18)', defaultLabel: 'Offline' },
  SLASHED: { color: colors.error.main, bg: 'rgba(239, 68, 68, 0.15)', defaultLabel: 'Sancionado' },
};

export function StatusBadge({ status, label, pulse = true }: StatusBadgeProps) {
  const norm = status.toUpperCase();
  const cfg = statusConfig[norm] || {
    color: colors.text.secondary,
    bg: 'rgba(255, 255, 255, 0.08)',
    defaultLabel: status,
  };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.25,
        py: 0.5,
        borderRadius: 9999,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.color}33`,
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: cfg.color,
          ...(pulse && {
            boxShadow: `0 0 8px ${cfg.color}`,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 1, transform: 'scale(1)' },
              '50%': { opacity: 0.4, transform: 'scale(0.85)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          }),
        }}
      />
      <Typography
        variant="caption"
        sx={{
          color: cfg.color,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontSize: '0.6875rem',
        }}
      >
        {label || cfg.defaultLabel}
      </Typography>
    </Box>
  );
}
