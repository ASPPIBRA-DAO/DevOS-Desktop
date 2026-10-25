import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Card } from '../../../../shared/components/Card';
import { colors } from '../../../../shared/theme/palette';
import { StatusBadge } from '../../../../shared/components/StatusBadge';

/**
 * Componente do módulo IPFS/DePIN responsável por apresentar o protocolo
 * de desafios de armazenamento (ADR-012) e telemetria de nó.
 */
export function StorageProofCard() {
  return (
    <Card variant="glass">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Prova de Armazenamento DePIN
        </Typography>
        <StatusBadge status="ACTIVE" label="Pull Protocol (ADR-012)" />
      </Box>

      <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2.5 }}>
        O nó opera em modo Pull (sem expor portas residuais a inbound NAT). Os desafios de storage do cluster são autenticados via chave operacional dedicada.
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
            Algoritmo de Prova:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
            SHA256(ServerNonce || RawBlockBytes)
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
            Tolerância a Desconexão:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Janela de 24h para contestação
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Canal de Telemetria:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.primary.light }}>
            Autenticado via WebSocket TLS
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
