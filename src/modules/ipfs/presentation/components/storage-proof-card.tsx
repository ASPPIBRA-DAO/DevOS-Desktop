import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Card, StatusBadge } from 'src/shared/components/data-display';

import { colors } from 'src/theme';

/**
 * Componente do módulo IPFS/DePIN responsável por apresentar o protocolo
 * de desafios de armazenamento (ADR-012) e telemetria de nó.
 */
export function StorageProofCard() {
  return (
    <Card variant="glass" sx={{ height: '100%', minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Prova de Armazenamento DePIN
        </Typography>
        <StatusBadge status="ACTIVE" label="Pull Protocol (ADR-012)" />
      </Box>

      <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2.5 }}>
        O nó opera em modo Pull (sem expor portas residuais a inbound NAT). Os desafios de storage do cluster são autenticados via chave operacional dedicada.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 0.5,
            py: 1,
            borderBottom: `1px solid ${colors.background.border}`,
          }}
        >
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Algoritmo de Prova:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              textAlign: { xs: 'left', sm: 'right' },
            }}
          >
            SHA256(ServerNonce || RawBlockBytes)
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 0.5,
            py: 1,
            borderBottom: `1px solid ${colors.background.border}`,
          }}
        >
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Tolerância a Desconexão:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, textAlign: { xs: 'left', sm: 'right' } }}>
            Janela de 24h para contestação
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 0.5,
            py: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Canal de Telemetria:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.primary.light, textAlign: { xs: 'left', sm: 'right' } }}>
            Autenticado via WebSocket TLS
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
