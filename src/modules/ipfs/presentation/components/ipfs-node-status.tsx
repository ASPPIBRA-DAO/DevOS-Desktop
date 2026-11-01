import type { IpfsDaemonStatus } from '../../../../platform/tauri';

import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { colors } from 'src/theme';
import { Card, StatusBadge } from 'src/shared/components/data-display';

export interface IpfsNodeStatusProps {
  status: IpfsDaemonStatus | null;
  loading?: boolean;
  onRefresh?: () => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Painel Operacional do Nó IPFS / Kubo com telemetria e diagnóstico em tempo real.
 */
export function IpfsNodeStatus({ status, loading = false, onRefresh }: IpfsNodeStatusProps) {
  const [copied, setCopied] = useState(false);

  const isRunning = Boolean(status?.running);
  const peerId = status?.peer_id || 'Não detectado';
  const peersCount = status?.peers_count ?? 0;
  const version = status?.version || 'Kubo (Offline)';
  const repoSize = formatBytes(status?.repo_size_bytes);

  const handleCopyPeerId = () => {
    if (status?.peer_id) {
      navigator.clipboard.writeText(status.peer_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card variant="glass" sx={{ height: '100%' }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Telemetria do Nó Kubo
          </Typography>
          <StatusBadge
            status={isRunning ? 'ACTIVE' : 'OFFLINE'}
            label={isRunning ? 'ONLINE' : 'OFFLINE'}
          />
        </Box>
        {onRefresh && (
          <Button
            size="small"
            variant="outlined"
            onClick={onRefresh}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{
              borderColor: colors.primary.main,
              color: colors.primary.main,
              textTransform: 'none',
              fontSize: '0.8125rem',
              '&:hover': {
                borderColor: colors.primary.light,
                backgroundColor: 'rgba(0, 240, 255, 0.08)',
              },
            }}
          >
            {loading ? 'Consultando...' : 'Atualizar'}
          </Button>
        )}
      </Box>

      {/* Grid de Informações Técnicas */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* PeerID */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1,
            borderBottom: `1px solid ${colors.background.border}`,
          }}
        >
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Identidade do Nó (PeerID):
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontFamily: 'monospace',
                maxWidth: { xs: 180, sm: 260 },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {peerId}
            </Typography>
            {status?.peer_id && (
              <Tooltip title={copied ? 'Copiado!' : 'Copiar PeerID'}>
                <Button
                  size="small"
                  onClick={handleCopyPeerId}
                  sx={{
                    minWidth: 28,
                    p: 0.5,
                    color: copied ? colors.success.main : colors.primary.main,
                  }}
                >
                  {copied ? '✓' : '⧉'}
                </Button>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Versão Kubo */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            py: 1,
            borderBottom: `1px solid ${colors.background.border}`,
          }}
        >
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Versão do Motor:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {version}
          </Typography>
        </Box>

        {/* Peers Conectados */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            py: 1,
            borderBottom: `1px solid ${colors.background.border}`,
          }}
        >
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Enxame P2P (Peers Ativos):
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: isRunning ? colors.primary.light : colors.text.disabled }}
          >
            {isRunning ? `${peersCount} conexões ativas` : '0 peers (daemon desligado)'}
          </Typography>
        </Box>

        {/* Consumo do Repositório */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            py: 1,
            borderBottom: `1px solid ${colors.background.border}`,
          }}
        >
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Tamanho do Repositório:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {repoSize}
          </Typography>
        </Box>

        {/* Endereço RPC Local */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Interface Administrativa RPC:
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontFamily: 'monospace', color: colors.success.light }}
          >
            127.0.0.1:5001 (Local Estrito)
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
