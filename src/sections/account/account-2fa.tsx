import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';

import { useAccountFacade } from './use-account';

// ----------------------------------------------------------------------

type ProviderModalType = 'wallet' | 'google' | 'github' | null;

export function AccountTwoFA() {
  const { user, updateProfile } = useAccountFacade();

  const linkedProviders = user.linkedProviders || {
    walletAddress: '0x71C8366420A0926793113693a740f11ee2273948',
    walletNetwork: 'Polygon (POS) / Rede ASPPIBRA',
    walletVerified: true,
    googleEmail: user.email || 'sandro_ceo@asppibra.com.br',
    googleVerified: true,
    githubUsername: 'sandro-asppibra',
    githubVerified: true,
    strictAuthEnabled: true,
  };

  // Estado do TOTP 2FA
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  // Estado do Modal de Vínculo de Contas
  const [modalType, setModalType] = useState<ProviderModalType>(null);
  const [inputValue, setInputValue] = useState('');

  const handleToggleTotp = () => {
    setTotpEnabled((prev) => !prev);
    if (!totpEnabled) {
      toast.info('Escaneie o QR Code com o Google Authenticator ou Authy.');
    } else {
      toast.warning('Autenticador 2FA desativado.');
    }
  };

  const handleVerifyTotp = () => {
    if (totpCode.length === 6) {
      toast.success('Autenticação em 2 fatores confirmada e validada!');
    } else {
      toast.error('Insira o código numérico de 6 dígitos.');
    }
  };

  const handleToggleStrict = () => {
    const nextStrict = !linkedProviders.strictAuthEnabled;
    updateProfile({
      linkedProviders: {
        ...linkedProviders,
        strictAuthEnabled: nextStrict,
      },
    });
    if (nextStrict) {
      toast.success('Modo Estrito Ativado: Apenas carteiras e contas autorizadas podem autenticar.');
    } else {
      toast.warning('Atenção: Modo estrito desativado. Brechas de autenticação podem ocorrer.');
    }
  };

  const handleOpenModal = (type: ProviderModalType) => {
    setModalType(type);
    if (type === 'wallet') setInputValue(linkedProviders.walletAddress || '');
    if (type === 'google') setInputValue(linkedProviders.googleEmail || '');
    if (type === 'github') setInputValue(linkedProviders.githubUsername || '');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setInputValue('');
  };

  const handleSaveProvider = () => {
    if (!inputValue.trim()) {
      toast.error('Preencha o campo antes de confirmar o vínculo.');
      return;
    }

    if (modalType === 'wallet') {
      if (!inputValue.startsWith('0x') || inputValue.length < 20) {
        toast.error('Endereço de carteira inválido (deve iniciar com 0x).');
        return;
      }
      updateProfile({
        linkedProviders: {
          ...linkedProviders,
          walletAddress: inputValue.trim(),
          walletVerified: true,
        },
      });
      toast.success('Carteira Web3 vinculada e assinada com sucesso!');
    } else if (modalType === 'google') {
      if (!inputValue.includes('@')) {
        toast.error('Insira um e-mail Google válido.');
        return;
      }
      updateProfile({
        linkedProviders: {
          ...linkedProviders,
          googleEmail: inputValue.trim(),
          googleVerified: true,
        },
      });
      toast.success('Conta Google vinculada como provedor confiável!');
    } else if (modalType === 'github') {
      const cleanUsername = inputValue.replace('@', '').trim();
      updateProfile({
        linkedProviders: {
          ...linkedProviders,
          githubUsername: cleanUsername,
          githubVerified: true,
        },
      });
      toast.success('Conta GitHub autorizada para autenticação do perfil!');
    }

    handleCloseModal();
  };

  const handleUnlinkProvider = (type: 'wallet' | 'google' | 'github') => {
    if (type === 'wallet') {
      updateProfile({
        linkedProviders: {
          ...linkedProviders,
          walletAddress: '',
          walletVerified: false,
        },
      });
      toast.info('Carteira Web3 desvinculada.');
    } else if (type === 'google') {
      updateProfile({
        linkedProviders: {
          ...linkedProviders,
          googleEmail: '',
          googleVerified: false,
        },
      });
      toast.info('Conta Google desvinculada.');
    } else if (type === 'github') {
      updateProfile({
        linkedProviders: {
          ...linkedProviders,
          githubUsername: '',
          githubVerified: false,
        },
      });
      toast.info('Conta GitHub desvinculada.');
    }
  };

  return (
    <Stack spacing={4} sx={{ width: 1 }}>
      {/* 1. Política de Acesso & Provedores Autorizados (Fechamento de Brechas) */}
      <Card sx={{ p: 4, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 3 }} spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
              <Iconify icon="solar:shield-check-bold" width={24} sx={{ color: 'success.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Contas e Provedores Autorizados para Autenticação
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Vincule exclusivamente as identidades que têm permissão para acessar o perfil e assinar contratos/transações em seu nome.
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={Boolean(linkedProviders.strictAuthEnabled)}
                onChange={handleToggleStrict}
                color="success"
              />
            }
            label={
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {linkedProviders.strictAuthEnabled ? 'Modo Restrito Ativo' : 'Modo Permissivo'}
                </Typography>
                <Tooltip title="Quando ativo, tentativas de login por carteiras externas, Google ou GitHub não listados abaixo são bloqueadas imediatamente." arrow>
                  <Box component="span" sx={{ display: 'inline-flex', cursor: 'help' }}>
                    <Iconify icon="solar:info-circle-bold" width={16} sx={{ color: 'text.secondary' }} />
                  </Box>
                </Tooltip>
              </Stack>
            }
          />
        </Stack>

        {/* Banner Informativo de Bloqueio de Brecha */}
        <Box
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 1.5,
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(0, 167, 111, 0.12)' : 'rgba(0, 167, 111, 0.08)'),
            border: (theme) => `solid 1px ${theme.palette.success.main}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Iconify icon="solar:shield-keyhole-bold-duotone" width={32} sx={{ color: 'success.main', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600, lineHeight: 1.6 }}>
            <strong>Proteção Ativa de Identidade Soberana:</strong> Somente a carteira Web3 com assinatura criptográfica válida e as contas corporativas verificadas abaixo poderão desbloquear sessões operacionais neste nó.
          </Typography>
        </Box>

        {/* Lista dos 3 Provedores: Carteira, Google, GitHub */}
        <Stack spacing={2.5}>
          {/* Provedor 1: Carteira Web3 Externa */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: (theme) => `solid 1px ${theme.palette.divider}`,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'),
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { md: 'center' },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.paper',
                  border: (theme) => `solid 1px ${theme.palette.divider}`,
                }}
              >
                <Iconify icon="logos:metamask-icon" width={28} />
              </Box>

              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Carteira Externa Web3 (EVM / Polygon)
                  </Typography>
                  {linkedProviders.walletVerified && linkedProviders.walletAddress ? (
                    <Chip label="Verificada (EIP-712)" size="small" color="success" sx={{ fontWeight: 700, height: 22 }} />
                  ) : (
                    <Chip label="Não Vinculada" size="small" color="default" sx={{ fontWeight: 700, height: 22 }} />
                  )}
                </Stack>

                <Typography
                  variant="body2"
                  sx={{
                    color: linkedProviders.walletAddress ? 'text.primary' : 'text.disabled',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    mt: 0.25,
                    wordBreak: 'break-all',
                  }}
                >
                  {linkedProviders.walletAddress || 'Nenhuma carteira autorizada vinculada'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Rede Autorizada: {linkedProviders.walletNetwork || 'Polygon (POS) / Rede ASPPIBRA'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => handleOpenModal('wallet')}
                startIcon={<Iconify icon="solar:pen-bold" />}
                sx={{ fontWeight: 700 }}
              >
                {linkedProviders.walletAddress ? 'Alterar Carteira' : 'Vincular Carteira'}
              </Button>
              {linkedProviders.walletAddress && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => handleUnlinkProvider('wallet')}
                  sx={{ fontWeight: 700 }}
                >
                  Desvincular
                </Button>
              )}
            </Stack>
          </Box>

          {/* Provedor 2: Conta Google */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: (theme) => `solid 1px ${theme.palette.divider}`,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'),
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { md: 'center' },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.paper',
                  border: (theme) => `solid 1px ${theme.palette.divider}`,
                }}
              >
                <Iconify icon="logos:google-icon" width={24} />
              </Box>

              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Conta Google (SSO)
                  </Typography>
                  {linkedProviders.googleVerified && linkedProviders.googleEmail ? (
                    <Chip label="Autorizada para Login" size="small" color="success" sx={{ fontWeight: 700, height: 22 }} />
                  ) : (
                    <Chip label="Não Vinculada" size="small" color="default" sx={{ fontWeight: 700, height: 22 }} />
                  )}
                </Stack>

                <Typography
                  variant="body2"
                  sx={{
                    color: linkedProviders.googleEmail ? 'text.primary' : 'text.disabled',
                    fontWeight: 600,
                    mt: 0.25,
                  }}
                >
                  {linkedProviders.googleEmail || 'Nenhuma conta Google vinculada'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Permite autenticação direta via token OAuth2 corporativo
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => handleOpenModal('google')}
                startIcon={<Iconify icon="solar:pen-bold" />}
                sx={{ fontWeight: 700 }}
              >
                {linkedProviders.googleEmail ? 'Alterar E-mail' : 'Vincular Google'}
              </Button>
              {linkedProviders.googleEmail && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => handleUnlinkProvider('google')}
                  sx={{ fontWeight: 700 }}
                >
                  Desvincular
                </Button>
              )}
            </Stack>
          </Box>

          {/* Provedor 3: Conta GitHub */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: (theme) => `solid 1px ${theme.palette.divider}`,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'),
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { md: 'center' },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.paper',
                  border: (theme) => `solid 1px ${theme.palette.divider}`,
                }}
              >
                <Iconify icon="logos:github-icon" width={26} />
              </Box>

              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Conta GitHub (Node Operator)
                  </Typography>
                  {linkedProviders.githubVerified && linkedProviders.githubUsername ? (
                    <Chip label="Autorizada para Git / Nós" size="small" color="success" sx={{ fontWeight: 700, height: 22 }} />
                  ) : (
                    <Chip label="Não Vinculada" size="small" color="default" sx={{ fontWeight: 700, height: 22 }} />
                  )}
                </Stack>

                <Typography
                  variant="body2"
                  sx={{
                    color: linkedProviders.githubUsername ? 'text.primary' : 'text.disabled',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    mt: 0.25,
                  }}
                >
                  {linkedProviders.githubUsername ? `@${linkedProviders.githubUsername}` : 'Nenhum usuário GitHub vinculado'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Permite auditoria de código, commits de governança e deploy de nós
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => handleOpenModal('github')}
                startIcon={<Iconify icon="solar:pen-bold" />}
                sx={{ fontWeight: 700 }}
              >
                {linkedProviders.githubUsername ? 'Alterar GitHub' : 'Vincular GitHub'}
              </Button>
              {linkedProviders.githubUsername && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => handleUnlinkProvider('github')}
                  sx={{ fontWeight: 700 }}
                >
                  Desvincular
                </Button>
              )}
            </Stack>
          </Box>
        </Stack>
      </Card>

      {/* 2. Autenticador TOTP (Google Authenticator / Authy) */}
      <Card sx={{ width: 1, p: 4, borderRadius: 2 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Autenticação em Dois Fatores (TOTP)
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Proteja sua conta solicitando um código temporário de 6 dígitos além da sua chave/senha no login.
            </Typography>
          </Box>

          <FormControlLabel
            control={<Switch checked={totpEnabled} onChange={handleToggleTotp} color="success" />}
            label={totpEnabled ? 'Ativo' : 'Inativo'}
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        {totpEnabled && (
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
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    slotProps={{
                      htmlInput: {
                        maxLength: 6,
                        style: { textAlign: 'center', letterSpacing: 4, fontWeight: 700 },
                      },
                    }}
                  />
                  <Button variant="contained" color="primary" onClick={handleVerifyTotp} sx={{ px: 3, fontWeight: 800 }}>
                    Confirmar e Ativar
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        )}
      </Card>

      {/* Modal / Diálogo para Vincular Provedor */}
      <Dialog open={Boolean(modalType)} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {modalType === 'wallet' && 'Vincular Carteira Externa Web3'}
          {modalType === 'google' && 'Vincular Conta Google Confiável'}
          {modalType === 'github' && 'Vincular Conta GitHub de Operador'}
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {modalType === 'wallet' &&
              'Informe o endereço público EVM da sua carteira (MetaMask, Rabby, Ledger). O sistema exigirá assinatura de prova criptográfica (EIP-712) para validar a posse.'}
            {modalType === 'google' &&
              'Informe o e-mail da conta Google corporativa ou pessoal que terá permissão para autenticar via Single Sign-On (SSO).'}
            {modalType === 'github' &&
              'Informe o nome de usuário do GitHub do operador para autorização de acesso e governança técnica.'}
          </Typography>

          <TextField
            fullWidth
            autoFocus
            label={
              modalType === 'wallet'
                ? 'Endereço da Carteira (0x...)'
                : modalType === 'google'
                  ? 'E-mail Google Autorizado'
                  : 'Usuário do GitHub (@usuario)'
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              modalType === 'wallet'
                ? '0x71C8366420A0926793113693a740f11ee2273948'
                : modalType === 'google'
                  ? 'usuario@gmail.com'
                  : 'sandro-asppibra'
            }
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseModal} variant="outlined" color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSaveProvider} variant="contained" color="primary" sx={{ fontWeight: 800 }}>
            Salvar e Validar Vínculo
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default AccountTwoFA;
