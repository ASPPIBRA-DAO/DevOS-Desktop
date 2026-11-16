import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';

// ----------------------------------------------------------------------

export function AccountTwoFA() {
  const [enabled, setEnabled] = useState(false);
  const [code, setCode] = useState('');

  const handleToggle = () => {
    setEnabled((prev) => !prev);
    if (!enabled) {
      toast.info('Escaneie o QR Code com o Google Authenticator ou Authy.');
    } else {
      toast.warning('2FA Desativado.');
    }
  };

  const handleVerify = () => {
    if (code.length === 6) {
      toast.success('Autenticação em 2 fatores confirmada com sucesso!');
    } else {
      toast.error('Insira o código de 6 dígitos.');
    }
  };

  return (
    <Card sx={{ p: 4, borderRadius: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Autenticação em Dois Fatores (2FA)</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Proteja sua conta solicitando um código temporário além da sua senha no login.
          </Typography>
        </Box>

        <FormControlLabel
          control={<Switch checked={enabled} onChange={handleToggle} color="success" />}
          label={enabled ? 'Ativo' : 'Inativo'}
          sx={{ fontWeight: 700 }}
        />
      </Stack>

      {enabled && (
        <Box sx={{ mt: 3, pt: 3, borderTop: (theme) => `dashed 1px ${theme.palette.divider}` }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ alignItems: 'center' }}>
            {/* QR Code Container */}
            <Box
              sx={{
                width: 180,
                height: 180,
                p: 2,
                borderRadius: 2,
                bgcolor: 'common.white',
                border: (theme) => `solid 1px ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <Iconify icon="solar:qr-code-bold" width={140} sx={{ color: 'common.black' }} />
            </Box>

            <Stack spacing={2} sx={{ width: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                1. Abra seu aplicativo autenticador e escaneie o código QR ao lado.
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                Chave manual de configuração: <strong>JBSWY3DPEHPK3PXP</strong>
              </Typography>

              <Typography variant="subtitle2" sx={{ pt: 1, fontWeight: 800 }}>
                2. Insira o código de 6 dígitos gerado:
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  size="small"
                  placeholder="000 000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  slotProps={{
                    htmlInput: {
                      maxLength: 6,
                      style: { textAlign: 'center', letterSpacing: 4, fontWeight: 700 },
                    },
                  }}
                />
                <Button variant="contained" color="primary" onClick={handleVerify} sx={{ px: 3, fontWeight: 800 }}>
                  Confirmar e Ativar
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      )}
    </Card>
  );
}

export default AccountTwoFA;
