import type { ManagedPinRecord } from '../../../../platform/tauri';

import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { colors } from 'src/theme';
import { Card, StatusBadge } from 'src/shared/components/data-display';

export interface IpfsFileListProps {
  files: ManagedPinRecord[];
  loading?: boolean;
  onVerifyCustody: (cid: string, expectedSha256?: string) => Promise<unknown>;
  onDownload: (cid: string, fileName: string) => Promise<unknown>;
  onUnpin: (cid: string) => Promise<unknown>;
  selectedCid?: string | null;
  onSelectCid?: (cid: string) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function IpfsFileList({
  files,
  loading = false,
  onVerifyCustody,
  onDownload,
  onUnpin,
  selectedCid,
  onSelectCid,
}: IpfsFileListProps) {
  const [unpinTarget, setUnpinTarget] = useState<ManagedPinRecord | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleConfirmUnpin = async () => {
    if (!unpinTarget) return;
    setActionLoading(`unpin-${unpinTarget.cid}`);
    try {
      await onUnpin(unpinTarget.cid);
      setUnpinTarget(null);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card variant="glass">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Catálogo de Conteúdos Gerenciados
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Registros autênticos persistidos em <code>managed-pins.json</code> com rastreabilidade de contexto.
          </Typography>
        </Box>
        <StatusBadge status="ACTIVE" label={`${files.length} Item(ns) Registrado(s)`} />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : files.length === 0 ? (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 1.5,
            border: `1px dashed ${colors.background.border}`,
          }}
        >
          <Typography variant="body2" sx={{ color: colors.text.disabled }}>
            Nenhum arquivo gerenciado pelo DevOS registrado no repositório local.
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { color: colors.text.secondary, fontWeight: 700, borderColor: colors.background.border } }}>
                <TableCell>Arquivo</TableCell>
                <TableCell>CID (IPFS)</TableCell>
                <TableCell>Tamanho</TableCell>
                <TableCell>Data de Fixação</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file) => {
                const isSelected = selectedCid === file.cid;
                const isItemLoading = actionLoading?.includes(file.cid);

                return (
                  <TableRow
                    key={file.cid}
                    hover
                    selected={isSelected}
                    onClick={() => onSelectCid?.(file.cid)}
                    sx={{
                      cursor: 'pointer',
                      '& td': { borderColor: colors.background.border },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(0, 240, 255, 0.06) !important',
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{file.name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                      {file.cid.slice(0, 10)}...{file.cid.slice(-8)}
                    </TableCell>
                    <TableCell>{formatBytes(file.size_bytes)}</TableCell>
                    <TableCell sx={{ color: colors.text.secondary, fontSize: '0.8125rem' }}>
                      {new Date(file.pinned_at_utc).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status="ACTIVE" label={file.pin_type || 'recursive'} />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={Boolean(actionLoading)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onVerifyCustody(file.cid, file.original_sha256);
                          }}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            borderColor: colors.primary.main,
                            color: colors.primary.main,
                          }}
                        >
                          Verificar
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          disabled={Boolean(actionLoading)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(file.cid, file.name);
                          }}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            borderColor: colors.success.main,
                            color: colors.success.main,
                          }}
                        >
                          Baixar
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          disabled={Boolean(actionLoading)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setUnpinTarget(file);
                          }}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            borderColor: colors.error.main,
                            color: colors.error.main,
                          }}
                        >
                          Desfixar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo de Confirmação de Desfixação (Unpin) */}
      <Dialog
        open={Boolean(unpinTarget)}
        onClose={() => setUnpinTarget(null)}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: colors.background.paper,
              border: `1px solid ${colors.background.border}`,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: colors.error.light }}>
          Confirmar Desfixação (Unpin)
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: colors.text.secondary }}>
            Tem certeza de que deseja remover a fixação do arquivo <strong>{unpinTarget?.name}</strong> (CID: <code>{unpinTarget?.cid}</code>)?
            <br /><br />
            Ao desfixar, os blocos ficarão sujeitos à coleta de lixo (GC) do nó Kubo local.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUnpinTarget(null)} sx={{ color: colors.text.secondary }}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmUnpin}
            variant="contained"
            color="error"
            disabled={Boolean(actionLoading)}
          >
            {actionLoading ? 'Desfixando...' : 'Confirmar Remoção'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
