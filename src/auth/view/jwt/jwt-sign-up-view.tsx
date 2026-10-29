import type { TextFieldProps } from '@mui/material/TextField';

import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { signUp } from '../../context/jwt';
import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormDivider, SignUpTerms } from '../../components';

// ----------------------------------------------------------------------
// Schema de validação
// ----------------------------------------------------------------------

export const SignUpSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, {
      message: 'O nome é obrigatório!',
    }),

  lastName: z
    .string()
    .trim()
    .min(1, {
      message: 'O sobrenome é obrigatório!',
    }),

  email: schemaUtils.email(),

  password: z
    .string()
    .min(1, {
      message: 'A senha mestre é obrigatória!',
    })
    .min(12, {
      message:
        'A senha mestre deve ter pelo menos 12 caracteres para segurança institucional!',
    }),
});

export type SignUpSchemaType = z.infer<typeof SignUpSchema>;

// ----------------------------------------------------------------------
// Valores padrão
// ----------------------------------------------------------------------

const DEFAULT_VALUES: SignUpSchemaType = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

// ----------------------------------------------------------------------
// Tipos públicos
// ----------------------------------------------------------------------

export interface JwtSignUpViewProps {
  isInitVault?: boolean;
}

// ----------------------------------------------------------------------
// Tela de cadastro e inicialização do cofre
// ----------------------------------------------------------------------

export function JwtSignUpView({
  isInitVault = false,
}: JwtSignUpViewProps) {
  const theme = useTheme();
  const router = useRouter();

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const { refreshStatus } = useBootstrap();

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  /**
   * Registra se signUp já foi concluído com sucesso nesta montagem.
   *
   * Caso a verificação posterior do cofre falhe, uma nova submissão
   * tentará verificar a sessão e o cofre novamente sem reenviar
   * imediatamente a operação de cadastro.
   */
  const [registrationCompleted, setRegistrationCompleted] =
    useState(false);

  // ------------------------------------------------------------
  // Formulário
  // ------------------------------------------------------------

  const methods = useForm<SignUpSchemaType>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // ------------------------------------------------------------
  // Estilos compartilhados dos campos
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
  } satisfies NonNullable<TextFieldProps['slotProps']>;

  // ------------------------------------------------------------
  // Estilos compartilhados dos botões sociais
  // ------------------------------------------------------------

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
  // Identificação social
  // ------------------------------------------------------------

  const handleSocialLogin = (
    provider: 'google' | 'github'
  ) => {
    const providerName =
      provider === 'google' ? 'Google' : 'GitHub';

    setErrorMessage(
      `Conta do ${providerName} não vinculada a nenhum operador existente. ` +
        'O primeiro acesso institucional requer o preenchimento do formulário abaixo para criação do cofre seguro.'
    );
  };

  // ------------------------------------------------------------
  // Submissão
  // ------------------------------------------------------------

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage(null);

    try {
      // 1. Executa o cadastro apenas quando ainda não foi concluído.
      if (!registrationCompleted) {
        await signUp({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        });

        // Marca a operação como concluída para evitar sua repetição
        // imediata quando a verificação posterior falhar.
        setRegistrationCompleted(true);
      }

      // 2. Atualiza a sessão de autenticação, se disponível.
      await checkUserSession?.();

      // 3. Consulta o estado atual do cofre.
      const status = await refreshStatus();

      // 4. Não navegar quando não for possível confirmar o estado.
      if (!status) {
        setErrorMessage(
          'Não foi possível confirmar o estado atual do cofre. ' +
            'Tente verificar novamente antes de acessar o dashboard.'
        );

        return;
      }

      // 5. Não considerar o cadastro operacional se o cofre
      // continuar sem inicialização.
      if (!status.is_initialized) {
        setErrorMessage(
          'O cadastro foi processado, mas o cofre ainda não está ' +
            'confirmado como inicializado. Verifique o estado do ambiente.'
        );

        return;
      }

      // 6. Não encaminhar para o dashboard com o cofre bloqueado.
      if (!status.is_unlocked) {
        setErrorMessage(
          'O cofre está inicializado, mas permanece bloqueado. ' +
            'O dashboard não será aberto enquanto o estado de desbloqueio ' +
            'não for confirmado.'
        );

        return;
      }

      // 7. Navegar somente após a confirmação do estado esperado.
      router.push(paths.dashboard.root);
    } catch (error: unknown) {
      // Não registrar o objeto bruto de erro no console.
      const feedbackMessage = getErrorMessage(error);

      setErrorMessage(
        typeof feedbackMessage === 'string' &&
          feedbackMessage.trim().length > 0
          ? feedbackMessage
          : 'Não foi possível concluir a operação de cadastro.'
      );
    }
  });

  // ------------------------------------------------------------
  // Campos e botão de envio
  // ------------------------------------------------------------

  const renderForm = () => (
    <Box
      sx={{
        gap: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Nome e sobrenome */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: {
            xs: 'column',
            sm: 'row',
          },
        }}
      >
        <Field.Text
          name="firstName"
          label="Nome"
          placeholder="Ex: Sandro"
          autoComplete="given-name"
          slotProps={commonFieldSlotProps}
        />

        <Field.Text
          name="lastName"
          label="Sobrenome"
          placeholder="Ex: Operador"
          autoComplete="family-name"
          slotProps={commonFieldSlotProps}
        />
      </Box>

      {/* E-mail */}
      <Field.Text
        name="email"
        label="E-mail Institucional"
        placeholder="operador@asppibra.com"
        autoComplete="email"
        slotProps={commonFieldSlotProps}
      />

      {/* Senha mestre */}
      <Field.Text
        name="password"
        label="Nova Senha Mestre"
        placeholder="Mínimo 12 caracteres seguros"
        type={showPassword.value ? 'text' : 'password'}
        autoComplete="new-password"
        slotProps={{
          ...commonFieldSlotProps,

          input: {
            sx: fieldInputSx,

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

      {/* Envio do formulário */}
      <Button
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        sx={{
          height: 48,
          fontSize: 15,
          fontFamily: 'var(--font-orbitron), sans-serif',
          fontWeight: 900,
          letterSpacing: '0.12em',
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

            background: `linear-gradient(
              180deg,
              ${alpha(theme.palette.info.main, 1)} 0%,
              ${alpha(theme.palette.common.white, 0.05)} 50%,
              ${alpha(theme.palette.warning.main, 1)} 100%
            )`,

            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',

            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          },

          transition: theme.transitions.create([
            'background-color',
            'transform',
            'box-shadow',
          ]),

          '&:hover': {
            bgcolor: alpha(theme.palette.info.main, 0.1),
            transform: 'scale(1.02)',
            boxShadow: `0 0 25px ${alpha(theme.palette.info.main, 0.4)}`,
          },
        }}
      >
        {registrationCompleted
          ? 'VERIFICAR ESTADO DO COFRE'
          : isInitVault
            ? 'CRIAR COFRE SEGURO'
            : 'SOLICITAR ACESSO'}
      </Button>
    </Box>
  );

  // ------------------------------------------------------------
  // Renderização da página
  // ------------------------------------------------------------

  return (
    <Box
      sx={{
        width: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      {/* Cabeçalho */}
      <Box
        sx={{
          mb: 1,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{
            color: 'info.main',
            mb: 0.5,
            fontWeight: 900,
            fontFamily: 'var(--font-orbitron), sans-serif',
            letterSpacing: '0.06em',
            textShadow: '0 0 20px rgba(0, 184, 217, 0.45)',
          }}
        >
          {isInitVault
            ? 'INICIALIZAÇÃO DO COFRE'
            : 'SOLICITAR ACESSO'}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: 'grey.500',
            fontSize: 13,
          }}
        >
          {isInitVault ? (
            'Defina a senha mestre que protegerá todas as chaves no hardware local.'
          ) : (
            <>
              Já possui uma conta?{' '}
              <Link
                component={RouterLink}
                href={paths.auth.jwt.signIn}
                sx={{
                  color: 'info.main',
                  fontWeight: 800,
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  textDecoration: 'none',
                }}
              >
                ENTRAR
              </Link>
            </>
          )}
        </Typography>
      </Box>

      {/* Mensagens de erro e feedback */}
      {!!errorMessage && (
        <Alert
          severity="error"
          aria-live="polite"
          sx={{
            mb: 3,
            textAlign: 'left',
            fontFamily: 'var(--font-orbitron), sans-serif',
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Formulário principal */}
      <Form
        methods={methods}
        onSubmit={onSubmit}
      >
        {renderForm()}
      </Form>

      {/* Separador */}
      <FormDivider label="OU IDENTIFIQUE-SE COM" />

      {/* Opções de identificação social existentes */}
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

      {/* Termos existentes */}
      <SignUpTerms
        sx={{
          color: 'grey.600',
          mt: 0.5,
          fontSize: 11,
        }}
      />
    </Box>
  );
}
