import type { DeviceStatusResponse } from '../../../../platform/tauri';

import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Card } from '../../../../shared/components/Card';
import { colors } from '../../../../shared/theme/palette';
import { StatusBadge } from '../../../../shared/components/StatusBadge';

export interface HostIntegrityCardProps {
  deviceStatus: DeviceStatusResponse | null;
  isDesktop: boolean;
}

/**
 * Componente do módulo de Identidade responsável por apresentar
 * a integridade do hardware host e status de isolamento de privilégios.
 */
export function HostIntegrityCard({ deviceStatus, isDesktop }: HostIntegrityCardProps) {
  return (
    <Card variant="glass">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Integridade do Host
        </Typography>
        <StatusBadge
          status={deviceStatus?.status || 'UNINITIALIZED'}
          label={deviceStatus?.status || 'UNINITIALIZED'}
        />
      </Box>

      <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2.5 }}>
        O núcleo nativo Rust executa em sandbox com controle estrito de privilégios (Zero-Privilege Capability Manifest).
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            py: 1,
            borderBottom: `1px solid ${colors.background.border}`,
          }}
        >
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Ambiente de Execução:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.primary.light }}>
            {isDesktop ? 'Tauri v2 Desktop Nativo (Linux)' : 'Web Browser Preview'}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            py: 1,
            borderBottom: `1px solid ${colors.background.border}`,
          }}
        >
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Dispositivo Inscrito:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {deviceStatus?.enrolled ? 'Sim (Hardware Vinculado)' : 'Não (Aguardando Enrollment)'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Isolamento de Segredos:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.success.light }}>
            Ativo (Argon2id + Zeroize em RAM)
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
