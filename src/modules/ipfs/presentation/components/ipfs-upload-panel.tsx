import type { IpfsUploadResult } from '../../../../platform/tauri';

import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { Card, StatusBadge } from 'src/shared/components/data-display';

import { colors } from 'src/theme';

export interface IpfsUploadPanelProps {
  uploading: boolean;
  onUpload: (filePath: string, pin: boolean) => Promise<IpfsUploadResult>;
  lastResult?: IpfsUploadResult | null;
}

export function IpfsUploadPanel({ uploading, onUpload, lastResult }: IpfsUploadPanelProps) {
  const [filePath, setFilePath] = useState('');
  const [pin, setPin] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath.trim()) {
      setLocalError('Informe o caminho do arquivo para envio.');
      return;
    }
    setLocalError(null);
    try {
      await onUpload(filePath.trim(), pin);
      setFilePath('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Card variant="glass" sx={{ height: '100%', minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Upload & Custódia de Arquivos
        </Typography>
        <StatusBadge status="ACTIVE" label="Streaming Nativo" />
      </Box>

      <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 3 }}>
        Transmissão direta para o nó Kubo local via RPC streaming sem conversão intermediária em Base64, com cálculo de SHA-256 em tempo real.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          fullWidth
          label="Caminho Absoluto do Arquivo"
          placeholder="/home/usuario/documento.pdf"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          disabled={uploading}
          variant="outlined"
          size="small"
          helperText="O arquivo será lido pelo processo nativo com hashing assíncrono em passagem única"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            },
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={pin}
                onChange={(e) => setPin(e.target.checked)}
                disabled={uploading}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Fixar no repositório local (Pin Recursivo)
              </Typography>
            }
          />

          <Button
            type="submit"
            variant="contained"
            disabled={uploading || !filePath.trim()}
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{
              backgroundColor: colors.primary.main,
              color: '#000',
              fontWeight: 700,
              textTransform: 'none',
              px: 3,
              '&:hover': {
                backgroundColor: colors.primary.light,
              },
            }}
          >
            {uploading ? 'Enviando...' : 'Enviar para IPFS'}
          </Button>
        </Box>

        {localError && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${colors.error.main}`,
            }}
          >
            <Typography variant="caption" sx={{ color: colors.error.light, fontWeight: 600 }}>
              {localError}
            </Typography>
          </Box>
        )}

        {/* Feedback do Último Upload */}
        {lastResult && (
          <Box
            sx={{
              mt: 1,
              p: 2,
              borderRadius: 1.5,
              backgroundColor: 'rgba(0, 240, 255, 0.04)',
              border: `1px solid ${colors.primary.main}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: colors.primary.light, fontWeight: 700, mb: 1 }}>
              Upload Concluído com Sucesso!
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.8125rem' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>CID:</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {lastResult.cid}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>SHA-256:</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: colors.success.light }}>
                  {lastResult.sha256_checksum.slice(0, 16)}...{lastResult.sha256_checksum.slice(-8)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>Tamanho:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {lastResult.size_bytes} bytes
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Card>
  );
}
