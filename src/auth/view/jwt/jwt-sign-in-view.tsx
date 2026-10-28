import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';

import { useBootstrap } from 'src/app/providers/app-bootstrap-provider';

import { Iconify } from 'src/shared/components/iconify';
import { Form, Field, schemaUtils } from 'src/shared/components/hook-form';

import { paths } from 'src/routes/paths';
import { CONFIG } from 'src/global-config';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormDivider } from '../../components';
import { signInWithWeb3, signInWithPassword } from '../../context/jwt';

// ----------------------------------------------------------------------

export type SignInSchemaType = z.infer<typeof SignInSchema>;

export const SignInSchema = z.object({
  email: schemaUtils.email(),
  password: z
    .string()
    .min(1, { message: 'A senha é obrigatória!' })
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres!' }),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const theme = useTheme();
  const router = useRouter();
  const showPassword = useBoolean();
  const { checkUserSession } = useAuthContext();
  const { unlock, refreshStatus } = useBootstrap();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<{
    type: 'warning' | 'info' | 'error';
    title: string;
    description: string;
  } | null>(null);

  const defaultValues: SignInSchemaType = {
    email: 'operador@asppibra.com',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      // Tenta desbloquear o cofre seguro local
      const unlocked = await unlock(data.password);
      if (!unlocked) {
        // Fallback para autenticação de sessão
        await signInWithPassword({ email: data.email, password: data.password });
      }

      await checkUserSession?.();
      await refreshStatus();

      const redirectUrl = returnTo || paths.dashboard.root;
      router.push(redirectUrl);
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const handleWeb3Login = async () => {
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('Instale a MetaMask ou wallet EVM para continuar.');
      }
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      await signInWithWeb3(address);
      await checkUserSession?.();
      await refreshStatus();

      const redirectUrl = returnTo || paths.dashboard.root;
      router.push(redirectUrl);
    } catch (error) {
      console.error(error);
      const msg = getErrorMessage(error);
      if (msg.includes('não vinculada') || msg.includes('Carteira Web3') || msg.includes('IDENTITY_NOT_LINKED')) {
        setAuthNotice({
          type: 'warning',
          title: 'Vínculo com Carteira Web3 Pendente',
          description: 'Sua assinatura MetaMask foi validada com sucesso, porém esta carteira ainda não está vinculada a nenhuma conta autorizada no ecossistema ASPPIBRA. Para acessar por este método, entre primeiro com sua senha mestre para vincular sua carteira no seu perfil.'
        });
        setErrorMessage(null);
      } else {
        setErrorMessage(msg);
        setAuthNotice(null);
      }
    }
  };

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const providerParam = searchParams.get('provider') || 'Google';
    if (errorParam === 'IDENTITY_NOT_LINKED') {
      setAuthNotice({
        type: 'warning',
        title: `Vínculo com ${providerParam} Pendente`,
        description: `Sua conta do ${providerParam} foi autenticada com sucesso, porém ela ainda não está vinculada a nenhuma conta autorizada no ecossistema ASPPIBRA. Para acessar por este método, entre primeiro com sua credencial cadastrada.`
      });
    } else if (errorParam === 'OAUTH_NOT_CONFIGURED') {
      setAuthNotice({
        type: 'info',
        title: `Serviço ${providerParam}`,
        description: `O serviço de login com ${providerParam} está em sincronização. Por favor, utilize sua senha mestre cadastrada para acessar o portal.`
      });
    } else if (errorParam) {
      setAuthNotice({
        type: 'error',
        title: 'Falha na Autenticação',
        description: `Não foi possível concluir o acesso com ${providerParam}: ${errorParam}`
      });
    }
  }, [searchParams]);

  const handleSocialLogin = (provider: 'google' | 'github') => {
    const serverUrl = CONFIG.serverUrl || 'https://api.asppibra.com';
    window.location.href = `${serverUrl}/api/v1/identity/oauth/${provider}/login`;
  };

  const renderForm = () => (
    <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
      <Field.Text
        name="email"
        label="Identificador / E-mail"
        placeholder="operador@asppibra.com"
        slotProps={{
          inputLabel: {
            shrink: true,
            sx: {
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontWeight: 600,
              color: 'info.main',
            },
          },
          input: {
            sx: {
              borderRadius: 1,
              bgcolor: 'rgba(2, 8, 23, 0.65)',
              '& input': {
                fontFamily: 'var(--font-orbitron), sans-serif',
                color: 'info.main',
                '&:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 100px #020817 inset',
                  WebkitTextFillColor: theme.palette.info.main,
                  transition: 'background-color 5000s ease-in-out 0s',
                },
              },
              '& fieldset': { borderColor: alpha(theme.palette.info.main, 0.25) },
              '&:hover fieldset': { borderColor: `${theme.palette.info.main} !important` },
              '&.Mui-focused fieldset': { borderColor: `${theme.palette.info.main} !important` },
            },
          },
        }}
      />

      <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Field.Text
          name="password"
          label="Senha Mestre do Cofre"
          type={showPassword.value ? 'text' : 'password'}
          autoFocus
          slotProps={{
            inputLabel: {
              shrink: true,
              sx: {
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontWeight: 600,
                color: 'info.main',
              },
            },
            input: {
              sx: {
                borderRadius: 1,
                bgcolor: 'rgba(2, 8, 23, 0.65)',
                '& input': {
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  color: 'info.main',
                  '&:-webkit-autofill': {
                    WebkitBoxShadow: '0 0 0 100px #020817 inset',
                    WebkitTextFillColor: theme.palette.info.main,
                    transition: 'background-color 5000s ease-in-out 0s',
                  },
                },
                '& fieldset': { borderColor: alpha(theme.palette.info.main, 0.25) },
                '&:hover fieldset': { borderColor: `${theme.palette.info.main} !important` },
                '&.Mui-focused fieldset': { borderColor: `${theme.palette.info.main} !important` },
              },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword.value ? 'Ocultar senha' : 'Exibir senha'}
                    onClick={showPassword.onToggle}
                    edge="end"
                    sx={{ color: 'info.main' }}
                  >
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: 'grey.500', fontSize: 11 }}>
          Primeiro acesso?{' '}
          <Link
            component={RouterLink}
            href={paths.auth.jwt.signUp}
            sx={{
              color: 'info.main',
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            CRIAR COFRE
          </Link>
        </Typography>
        <Link
          component={RouterLink}
          href={paths.auth.jwt.resetPassword}
          variant="caption"
          sx={{
            color: 'info.main',
            fontFamily: 'var(--font-orbitron), sans-serif',
            fontWeight: 800,
            textDecoration: 'none',
            fontSize: 10,
          }}
        >
          ESQUECEU A SENHA?
        </Link>
      </Box>

      <Button
        fullWidth
        size="large"
        type="submit"
        variant="outlined"
        loading={isSubmitting}
        sx={{
          height: 48,
          fontSize: 15,
          fontFamily: 'var(--font-orbitron), sans-serif',
          fontWeight: 900,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          bgcolor: alpha('#020817', 0.8),
          color: 'info.main',
          borderColor: alpha(theme.palette.info.main, 0.5),
          boxShadow: `0 0 15px ${alpha(theme.palette.info.main, 0.2)}`,
          transition: theme.transitions.create(['all']),
          '&:hover': {
            bgcolor: alpha(theme.palette.info.main, 0.15),
            borderColor: 'info.main',
            transform: 'translateY(-2px)',
            boxShadow: `0 5px 25px ${alpha(theme.palette.info.main, 0.5)}`,
          },
        }}
      >
        DESBLOQUEAR COFRE
      </Button>
    </Box>
  );

  return (
    <Box
      sx={{
        width: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{
          textAlign: 'center',
          mb: 1,
          color: 'info.main',
          fontFamily: 'var(--font-orbitron), sans-serif',
          fontWeight: 900,
          letterSpacing: '0.06em',
          textShadow: '0 0 25px rgba(0, 184, 217, 0.45)',
        }}
      >
        ACESSO AO COFRE
      </Typography>

      {authNotice && (
        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            bgcolor:
              authNotice.type === 'warning'
                ? alpha(theme.palette.warning.main, 0.08)
                : authNotice.type === 'error'
                  ? alpha(theme.palette.error.main, 0.08)
                  : alpha(theme.palette.info.main, 0.08),
            border: '1px solid',
            borderColor:
              authNotice.type === 'warning'
                ? alpha(theme.palette.warning.main, 0.3)
                : authNotice.type === 'error'
                  ? alpha(theme.palette.error.main, 0.3)
                  : alpha(theme.palette.info.main, 0.3),
            boxShadow: `0 4px 20px ${alpha(
              authNotice.type === 'warning'
                ? theme.palette.warning.main
                : authNotice.type === 'error'
                  ? theme.palette.error.main
                  : theme.palette.info.main,
              0.08
            )}`,
          }}
        >
          <Iconify
            icon={
              (authNotice.type === 'warning'
                ? 'solar:shield-warning-bold-duotone'
                : authNotice.type === 'error'
                  ? 'solar:danger-triangle-bold-duotone'
                  : 'solar:info-circle-bold-duotone') as any
            }
            width={24}
            sx={{
              flexShrink: 0,
              mt: 0.25,
              color:
                authNotice.type === 'warning'
                  ? 'warning.main'
                  : authNotice.type === 'error'
                    ? 'error.main'
                    : 'info.main',
            }}
          />

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 0.5,
                fontWeight: 600,
                color:
                  authNotice.type === 'warning'
                    ? 'warning.light'
                    : authNotice.type === 'error'
                      ? 'error.light'
                      : 'info.light',
              }}
            >
              {authNotice.title}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: 13,
                lineHeight: 1.55,
              }}
            >
              {authNotice.description}
            </Typography>
          </Box>
        </Box>
      )}

      {!!errorMessage && !authNotice && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      <FormDivider label="OU ENTRE COM" />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => handleSocialLogin('google')}
          startIcon={<Iconify icon="logos:google-icon" />}
          sx={{
            color: 'white',
            borderColor: alpha(theme.palette.info.main, 0.2),
            fontFamily: 'var(--font-orbitron), sans-serif',
            fontWeight: 700,
            fontSize: 13,
            '&:hover': {
              borderColor: 'info.main',
              bgcolor: alpha(theme.palette.info.main, 0.05),
              transform: 'translateY(-2px)',
              boxShadow: `0 5px 15px ${alpha(theme.palette.info.main, 0.2)}`,
            },
          }}
        >
          Google
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => handleSocialLogin('github')}
          startIcon={<Iconify icon="logos:github-icon" />}
          sx={{
            color: 'white',
            borderColor: alpha(theme.palette.info.main, 0.2),
            fontFamily: 'var(--font-orbitron), sans-serif',
            fontWeight: 700,
            fontSize: 13,
            '&:hover': {
              borderColor: 'info.main',
              bgcolor: alpha(theme.palette.info.main, 0.05),
              transform: 'translateY(-2px)',
              boxShadow: `0 5px 15px ${alpha(theme.palette.info.main, 0.2)}`,
            },
          }}
        >
          GitHub
        </Button>
      </Box>

      <Button
        fullWidth
        variant="contained"
        onClick={handleWeb3Login}
        startIcon={
          <Iconify icon="logos:metamask-icon" width={24} />
        }
        sx={{
          height: 48,
          fontSize: 14,
          fontFamily: 'var(--font-orbitron), sans-serif',
          fontWeight: 900,
          letterSpacing: 1,
          color: 'info.main',
          bgcolor: alpha('#020817', 0.9),
          border: `1px solid ${alpha(theme.palette.info.main, 0.4)}`,
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: 'info.main',
            backgroundColor: alpha('#020817', 0.95),
            boxShadow: `0 0 30px ${alpha(theme.palette.info.main, 0.6)}`,
            transform: 'scale(1.02)',
          },
        }}
      >
        WALLET METAMASK
      </Button>
    </Box>
  );
}
