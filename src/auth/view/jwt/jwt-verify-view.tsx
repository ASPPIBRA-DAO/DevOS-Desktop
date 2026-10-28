import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';

import { paths } from 'src/routes/paths';
import { EmailInboxIcon } from 'src/assets/icons';
import { RouterLink } from 'src/routes/components';
import { useSearchParams } from 'src/routes/hooks';

import { getErrorMessage } from '../../utils/error-message';
import { FormResendCode } from '../../components/form-resend-code';
import { IdentitySessionService } from '../../application/identity-session.service';

// ----------------------------------------------------------------------

export function JwtVerifyView() {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [countdown, setCountdown] = useState(0);
  const [backoffLevel, setBackoffLevel] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendCode = async () => {
    if (!email) {
      toast.error('E-mail não fornecido.');
      return;
    }
    try {
      await IdentitySessionService.resendVerification(email);
      toast.success('Código reenviado! Verifique seu e-mail.');

      const levels = [60, 120, 300];
      setCountdown(levels[backoffLevel] || 300);
      if (backoffLevel < 2) setBackoffLevel((prev) => prev + 1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Box
      sx={{
        width: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <EmailInboxIcon
            sx={{
              width: 96,
              height: 96,
              color: 'info.main',
              filter: `drop-shadow(0 0 20px ${alpha(theme.palette.info.main, 0.4)})`,
            }}
          />
        </Box>
        <Typography
          variant="h5"
          sx={{
            color: 'info.main',
            mb: 1,
            fontWeight: 900,
            fontFamily: 'var(--font-orbitron), sans-serif',
          }}
        >
          VERIFIQUE SEU E-MAIL
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.500', fontSize: 13 }}>
          Enviamos um link de confirmação para o seu endereço de e-mail. Por favor, siga as
          instruções para ativar sua conta.
        </Typography>
      </Box>

      <Button
        fullWidth
        size="large"
        component={RouterLink}
        href={paths.auth.jwt.signIn}
        variant="contained"
        sx={{
          height: 60,
          fontSize: 18,
          fontFamily: 'var(--font-orbitron), sans-serif',
          fontWeight: 900,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          bgcolor: alpha('#020817', 0.9),
          color: 'common.white',
          position: 'relative',
          border: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '1.5px',
            background: `linear-gradient(180deg, 
              ${alpha(theme.palette.info.main, 1)} 0%, 
              ${alpha(theme.palette.common.white, 0.05)} 50%, 
              ${alpha(theme.palette.warning.main, 1)} 100%
            )`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          },
          transition: theme.transitions.create(['all']),
          '&:hover': {
            bgcolor: alpha(theme.palette.info.main, 0.1),
            transform: 'scale(1.03)',
            boxShadow: `0 0 25px ${alpha(theme.palette.info.main, 0.4)}`,
          },
        }}
      >
        IR PARA O LOGIN
      </Button>

      <FormResendCode
        onResendCode={handleResendCode}
        value={countdown}
        disabled={countdown > 0}
        sx={{
          color: 'info.main',
          '& .MuiButton-root': {
            color: 'info.main',
            fontWeight: 800,
            fontFamily: 'var(--font-orbitron), sans-serif',
          },
        }}
      />

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Link
          component={RouterLink}
          href={paths.auth.jwt.signIn}
          sx={{
            color: 'info.main',
            fontWeight: 800,
            fontFamily: 'var(--font-orbitron), sans-serif',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            fontSize: 13,
          }}
        >
          <Iconify icon="eva:arrow-ios-back-fill" />
          VOLTAR PARA O LOGIN
        </Link>
      </Box>
    </Box>
  );
}
