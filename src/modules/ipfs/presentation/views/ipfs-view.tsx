import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Card, StatusBadge } from 'src/shared/components/data-display';

import { colors } from 'src/theme';

import { useIpfsDaemon } from '../../hooks/use-ipfs-daemon';
import { IpfsFileList } from '../components/ipfs-file-list';
import { useIpfsStorage } from '../../hooks/use-ipfs-storage';
import { IpfsNodeStatus } from '../components/ipfs-node-status';
import { IpfsUploadPanel } from '../components/ipfs-upload-panel';
import { StorageProofCard } from '../components/storage-proof-card';
import { IpfsPinningStatus } from '../components/ipfs-pinning-status';

/**
 * Visão Operacional Centralizada do Módulo IPFS & Infraestrutura DePIN.
 * Compartilhada retrocompativelmente entre DevOS Node e DevOS Cockpit.
 */
export function IpfsView() {
  const {
    status,
    loading: daemonLoading,
    actionLoading: daemonActionLoading,
    refresh: refreshDaemon,
    startDaemon,
    stopDaemon,
    restartDaemon,
    isOnline,
  } = useIpfsDaemon();
  const {
    files,
    loadingFiles,
    uploading,
    error,
    lastUploadResult,
    custodyMap,
    uploadFile,
    downloadFile,
    unpinCid,
    verifyCustody,
    clearError,
  } = useIpfsStorage();

  const [selectedCid, setSelectedCid] = useState<string | null>(null);

  const handleDownload = async (cid: string, fileName: string) => {
    // No ambiente desktop Linux, salva em /tmp ou caminho dedicado
    const targetPath = `/tmp/${fileName}`;
    await downloadFile(cid, targetPath, true);
  };

  const handleVerify = async (cid: string, expectedSha256?: string) => {
    setSelectedCid(cid);
    await verifyCustody(cid, expectedSha256);
  };

  const activeCustodyStatus = selectedCid ? custodyMap[selectedCid] : null;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto', width: '100%', minWidth: 0 }}>
      {/* Cabeçalho Institucional */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 4,
          pb: 3,
          borderBottom: `1px solid ${colors.background.border}`,
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 0.75 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.1rem' },
                wordBreak: 'break-word',
              }}
            >
              Armazenamento IPFS & DePIN
            </Typography>
            <StatusBadge
              status={isOnline ? 'ACTIVE' : 'OFFLINE'}
              label={isOnline ? 'Daemon Operacional' : 'Daemon Inativo'}
            />
          </Box>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Infraestrutura de Custódia Descentralizada • Nó Kubo Nativo & Protocolo de Desafios ADR-012
          </Typography>
        </Box>
      </Box>

      {/* Alerta de Erro */}
      {error && (
        <Card
          sx={{
            mb: 3,
            borderColor: colors.error.main,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            cursor: 'pointer',
          }}
          onClick={clearError}
        >
          <Typography variant="body2" sx={{ color: colors.error.light, fontWeight: 600 }}>
            {error} (clique para dispensar)
          </Typography>
        </Card>
      )}

      {/* Grid Superior: Telemetria do Nó e Prova de Armazenamento */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'repeat(2, minmax(0, 1fr))',
          },
          gap: { xs: 2, sm: 2.5, md: 3 },
          mb: 3,
          width: '100%',
          minWidth: 0,
        }}
      >
        <IpfsNodeStatus
          status={status}
          loading={daemonLoading}
          actionLoading={daemonActionLoading}
          onRefresh={refreshDaemon}
          onStartDaemon={startDaemon}
          onStopDaemon={stopDaemon}
          onRestartDaemon={restartDaemon}
        />
        <StorageProofCard />
      </Box>

      {/* Painel de Upload */}
      <Box sx={{ mb: 3 }}>
        <IpfsUploadPanel
          uploading={uploading}
          onUpload={uploadFile}
          lastResult={lastUploadResult}
        />
      </Box>

      {/* Indicadores de Armazenamento do CID Selecionado */}
      <Box sx={{ mb: 3 }}>
        <IpfsPinningStatus
          status={activeCustodyStatus}
          cid={selectedCid ?? files[0]?.cid}
        />
      </Box>

      {/* Catálogo de Conteúdos Gerenciados */}
      <Box>
        <IpfsFileList
          files={files}
          loading={loadingFiles}
          selectedCid={selectedCid}
          onSelectCid={setSelectedCid}
          onVerifyCustody={handleVerify}
          onDownload={handleDownload}
          onUnpin={unpinCid}
        />
      </Box>
    </Box>
  );
}
