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
// Schema
// ----------------------------------------------------------------------

export const SignInSchema = z.object({
  email: schemaUtils.email(),

  password: z
    .string()
    .min(1, {
      message: 'A senha é obrigatória!',
    })
    .min(6, {
      message: 'A senha deve ter pelo menos 6 caracteres!',
    }),
});

export type SignInSchemaType = z.infer<typeof SignInSchema>;

// ----------------------------------------------------------------------
// Valores padrão
// ----------------------------------------------------------------------

const DEFAULT_VALUES: SignInSchemaType = {
  email: 'operador@asppibra.com',
  password: '',
};

// ----------------------------------------------------------------------
// Tipagem mínima do provedor Web3 utilizado
// ----------------------------------------------------------------------

type EthereumProvider = {
  request: (args: {
    method: 'eth_requestAccounts';
  }) => Promise<unknown>;
};

type WindowWithEthereum = Window & {
  ethereum?: EthereumProvider;
};

// ----------------------------------------------------------------------
// Validação de navegação
// ----------------------------------------------------------------------

/**
 * Aceita apenas caminhos internos.
 *
 * URLs absolutas, caminhos relativos e URLs protocol-relative
 * são rejeitados. O destino padrão é a rota principal do dashboard.
 */
function getSafeRedirectTarget(
  returnTo: string | null
): string {
  if (
    !returnTo ||
    !returnTo.startsWith('/') ||
    returnTo.startsWith('//') ||
    returnTo.includes('\\')
  ) {
    return paths.dashboard.root;
  }

  try {
    const baseOrigin = 'https://devos.invalid';
    const candidate = new URL(returnTo, baseOrigin);

    if (candidate.origin !== baseOrigin) {
      return paths.dashboard.root;
    }

    return (
      candidate.pathname +
      candidate.search +
      candidate.hash
    );
  } catch {
    return paths.dashboard.root;
  }
}

// ----------------------------------------------------------------------
// Tratamento seguro dos parâmetros OAuth
// ----------------------------------------------------------------------

function getOAuthProviderLabel(
  provider: string | null
): string {
  if (!provider) {
    return 'Google';
  }

  switch (provider.toLowerCase()) {
    case 'google':
      return 'Google';

    case 'github':
      return 'GitHub';

    default:
      return 'provedor de identidade';
  }
}

// ----------------------------------------------------------------------
// Validação da resposta da carteira
// ----------------------------------------------------------------------

function isValidEvmAddress(
  value: unknown
): value is string {
  return (
    typeof value === 'string' &&
    /^0x[a-fA-F0-9]{40}$/.test(value)
  );
}

// ----------------------------------------------------------------------
// Componente
// ----------------------------------------------------------------------

export function JwtSignInView() {
  const theme = useTheme();
  const router = useRouter();
  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const {
    state: bootstrapState,
    unlock,
    refreshStatus,
  } = useBootstrap();

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [isWeb3Submitting, setIsWeb3Submitting] =
    useState(false);

  const [authNotice, setAuthNotice] = useState<{
    type: 'warning' | 'info' | 'error';
    title: string;
    description: string;
  } | null>(null);

  const searchParams = useSearchParams();

  const oauthError = searchParams.get('error');

  const providerLabel = getOAuthProviderLabel(
    searchParams.get('provider')
  );

  const redirectTarget = getSafeRedirectTarget(
    searchParams.get('returnTo')
  );

  // ------------------------------------------------------------
  // Formulário
  // ------------------------------------------------------------

  const methods = useForm<SignInSchemaType>({
    resolver: zodResolver(SignInSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // ------------------------------------------------------------
  // Estilos compartilhados
  // ------------------------------------------------------------

  const fieldInputSx = {
    borderRadius: 1,
    bgcolor: 'rgba(2, 8, 23, 0.65)',

    '& input': {
      fontFamily: 'var(--font-orbitron), sans-serif',
      color: theme.palette.info.main,

      '&:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 100px #020817 inset',
        WebkitTextFillColor: theme.palette.info.main,
        transition: 'background-color 5000s ease-in-out 0s',
      },
    },

    '& fieldset': {
      borderColor: alpha(theme.palette.info.main, 0.25),
    },

    '&:hover fieldset': {
      borderColor: `${theme.palette.info.main} !important`,
    },

    '&.Mui-focused fieldset': {
      borderColor: `${theme.palette.info.main} !important`,
    },
  };

  const commonFieldSlotProps = {
    inputLabel: {
      shrink: true,
      sx: {
        fontFamily: 'var(--font-orbitron), sans-serif',
        fontWeight: 600,
        color: 'info.main',
      },
    },

    input: {
      sx: fieldInputSx,
    },
  };

  const socialButtonSx = {
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
  };

  // ------------------------------------------------------------
  // Confirmação do estado do cofre e navegação
  // ------------------------------------------------------------

  /**
   * No modo nativo, só navega após confirmar que o cofre
   * está inicializado e desbloqueado.
   *
   * No modo WEB_PREVIEW, não exige a existência de um cofre
   * nativo para concluir o fluxo de autenticação web.
   */
  const completeSignIn = async (): Promise<boolean> => {
    await checkUserSession?.();

    if (bootstrapState === 'WEB_PREVIEW') {
      router.push(redirectTarget);
      return true;
    }

    const status = await refreshStatus();

    if (
      !status ||
      !status.is_initialized ||
      !status.is_unlocked
    ) {
      setErrorMessage(
        'Não foi possível confirmar que o cofre está inicializado ' +
          'e desbloqueado. Verifique a senha mestre e tente novamente.'
      );

      return false;
    }

    router.push(redirectTarget);

    return true;
  };

  // ------------------------------------------------------------
  // Login com senha mestre
  // ------------------------------------------------------------

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage(null);
    setAuthNotice(null);

    try {
      if (bootstrapState === 'WEB_PREVIEW') {
        // A autenticação web não deve depender da ponte nativa.
        await signInWithPassword({
          email: data.email,
          password: data.password,
        });
      } else {
        // Primeiro tenta desbloquear o cofre local.
        const unlocked = await unlock(data.password);

        if (!unlocked) {
          // Mantém o fallback de autenticação existente.
          await signInWithPassword({
            email: data.email,
            password: data.password,
          });
        }
      }

      await completeSignIn();
    } catch (error: unknown) {
      // Não registrar o objeto bruto de erro.
      const message = getErrorMessage(error);

      setErrorMessage(
        message ||
          'Não foi possível concluir a autenticação.'
      );
    }
  });

  // ------------------------------------------------------------
  // Login Web3
  // ------------------------------------------------------------

  const handleWeb3Login = async () => {
    if (isWeb3Submitting) {
      return;
    }

    setIsWeb3Submitting(true);
    setErrorMessage(null);
    setAuthNotice(null);

    try {
      if (typeof window === 'undefined') {
        throw new Error(
          'A carteira Web3 não está disponível neste ambiente.'
        );
      }

      const ethereum = (
        window as WindowWithEthereum
      ).ethereum;

      if (!ethereum) {
        throw new Error(
          'Instale a MetaMask ou uma carteira EVM para continuar.'
        );
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (
        !Array.isArray(accounts) ||
        !isValidEvmAddress(accounts[0])
      ) {
        throw new Error(
          'A carteira não retornou um endereço EVM válido.'
        );
      }

      const address = accounts[0];

      await signInWithWeb3(address);

      await checkUserSession?.();

      // Em modo desktop, a autenticação Web3 não substitui
      // a confirmação do estado de desbloqueio do cofre local.
      if (bootstrapState !== 'WEB_PREVIEW') {
        const status = await refreshStatus();

        if (
          !status ||
          !status.is_initialized ||
          !status.is_unlocked
        ) {
          setAuthNotice({
            type: 'warning',
            title: status?.is_initialized
              ? 'Cofre local bloqueado'
              : 'Estado do cofre não confirmado',
            description: status?.is_initialized
              ? 'Sua identidade Web3 foi autenticada, mas o cofre local continua bloqueado. Entre com a senha mestre para liberar o acesso.'
              : 'A identidade Web3 foi autenticada, mas não foi possível confirmar o estado do cofre. Verifique a inicialização e tente novamente.',
          });

          return;
        }
      }

      router.push(redirectTarget);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      const normalizedMessage = message.toLowerCase();

      const isIdentityNotLinked =
        normalizedMessage.includes('não vinculada') ||
        normalizedMessage.includes('carteira web3') ||
        normalizedMessage.includes('identity_not_linked');

      if (isIdentityNotLinked) {
        setAuthNotice({
          type: 'warning',
          title: 'Vínculo com Carteira Web3 Pendente',
          description:
            'Sua carteira ainda não está vinculada a uma conta autorizada no ecossistema ASPPIBRA. Entre primeiro com sua senha mestre para realizar o procedimento de vinculação.',
        });

        setErrorMessage(null);
      } else {
        setErrorMessage(
          message ||
            'Não foi possível concluir a autenticação Web3. Verifique a carteira e tente novamente.'
        );

        setAuthNotice(null);
      }
    } finally {
      setIsWeb3Submitting(false);
    }
  };

  // ------------------------------------------------------------
  // Login OAuth
  // ------------------------------------------------------------

  useEffect(() => {
    if (!oauthError) {
      setAuthNotice(null);
      return;
    }

    switch (oauthError) {
      case 'IDENTITY_NOT_LINKED':
        setAuthNotice({
          type: 'warning',
          title: `Vínculo com ${providerLabel} Pendente`,
          description:
            `Sua conta do ${providerLabel} foi autenticada, ` +
            'mas ainda não está vinculada a uma conta autorizada ' +
            'no ecossistema ASPPIBRA. Entre com sua credencial cadastrada para continuar.',
        });
        break;

      case 'OAUTH_NOT_CONFIGURED':
        setAuthNotice({
          type: 'info',
          title: `Serviço ${providerLabel}`,
          description:
            `O serviço de login com ${providerLabel} está em sincronização. ` +
            'Utilize sua senha mestre cadastrada para acessar o portal.',
        });
        break;

      default:
        // Não exibe diretamente o conteúdo arbitrário do parâmetro error.
        setAuthNotice({
          type: 'error',
          title: 'Falha na Autenticação',
          description:
            `Não foi possível concluir o acesso com ${providerLabel}. ` +
            'Tente novamente ou utilize sua senha mestre.',
        });
        break;
    }
  }, [
    oauthError,
    providerLabel,
  ]);

  const handleSocialLogin = (
    provider: 'google' | 'github'
  ) => {
    if (typeof window === 'undefined') {
      setErrorMessage(
        'O login social não está disponível neste ambiente.'
      );
      return;
    }

    try {
      const serverUrl =
        CONFIG.serverUrl || 'https://api.asppibra.com';

      const oauthUrl = new URL(
        `${serverUrl.replace(/\/+$/, '')}/api/v1/identity/oauth/${provider}/login`
      );

      if (
        oauthUrl.protocol !== 'https:' &&
        oauthUrl.protocol !== 'http:'
      ) {
        throw new Error('Protocolo OAuth inválido.');
      }

      window.location.assign(oauthUrl.toString());
    } catch {
      setErrorMessage(
        'Não foi possível iniciar a autenticação pelo provedor selecionado.'
      );
    }
  };

  // ------------------------------------------------------------
  // Formulário
  // ------------------------------------------------------------

  const renderForm = () => (
    <Box
      sx={{
        gap: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Field.Text
        name="email"
        label="Identificador / E-mail"
        placeholder="operador@asppibra.com"
        autoComplete="username"
        slotProps={commonFieldSlotProps}
      />

      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Field.Text
          name="password"
          label="Senha Mestre do Cofre"
          type={showPassword.value ? 'text' : 'password'}
          autoComplete="current-password"
          autoFocus
          slotProps={{
            ...commonFieldSlotProps,

            input: {
              ...commonFieldSlotProps.input,

              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    aria-label={
                      showPassword.value
                        ? 'Ocultar senha'
                        : 'Exibir senha'
                    }
                    aria-pressed={showPassword.value}
                    onClick={showPassword.onToggle}
                    edge="end"
                    sx={{
                      color: 'info.main',
                    }}
                  >
                    <Iconify
                      icon={
                        showPassword.value
                          ? 'solar:eye-bold'
                          : 'solar:eye-closed-bold'
                      }
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'grey.500',
            fontSize: 11,
          }}
        >
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

          transition: theme.transitions.create([
            'background-color',
            'border-color',
            'transform',
            'box-shadow',
          ]),

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

  // ------------------------------------------------------------
  // Renderização
  // ------------------------------------------------------------

  const noticeIcon =
    authNotice?.type === 'warning'
      ? 'solar:shield-warning-bold-duotone'
      : authNotice?.type === 'error'
        ? 'solar:danger-triangle-bold-duotone'
        : 'solar:info-circle-bold-duotone';

  const noticeColor =
    authNotice?.type === 'warning'
      ? theme.palette.warning.main
      : authNotice?.type === 'error'
        ? theme.palette.error.main
        : theme.palette.info.main;

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
          role="status"
          aria-live="polite"
          sx={{
            p: 2,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,

            bgcolor: alpha(noticeColor, 0.08),

            border: '1px solid',
            borderColor: alpha(noticeColor, 0.3),

            boxShadow: `0 4px 20px ${alpha(noticeColor, 0.08)}`,
          }}
        >
          <Iconify
            icon={noticeIcon}
            width={24}
            sx={{
              flexShrink: 0,
              mt: 0.25,
              color: noticeColor,
            }}
          />

          <Box
            sx={{
              flex: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                mb: 0.5,
                fontWeight: 600,
                color: noticeColor,
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
        <Alert
          severity="error"
          aria-live="polite"
          sx={{
            mb: 1,
          }}
        >
          {errorMessage}
        </Alert>
      )}

      <Form
        methods={methods}
        onSubmit={onSubmit}
      >
        {renderForm()}
      </Form>

      <FormDivider label="OU ENTRE COM" />

      <Box
        sx={{
          display: 'flex',
          gap: 2,
        }}
      >
        <Button
          type="button"
          fullWidth
          variant="outlined"
          onClick={() => handleSocialLogin('google')}
          startIcon={<Iconify icon="logos:google-icon" />}
          sx={socialButtonSx}
        >
          Google
        </Button>

        <Button
          type="button"
          fullWidth
          variant="outlined"
          onClick={() => handleSocialLogin('github')}
          startIcon={<Iconify icon="logos:github-icon" />}
          sx={socialButtonSx}
        >
          GitHub
        </Button>
      </Box>

      <Button
        type="button"
        fullWidth
        variant="contained"
        loading={isWeb3Submitting}
        onClick={handleWeb3Login}
        startIcon={
          <Iconify
            icon="logos:metamask-icon"
            width={24}
          />
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

          transition: theme.transitions.create([
            'background-color',
            'border-color',
            'transform',
            'box-shadow',
          ]),

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
