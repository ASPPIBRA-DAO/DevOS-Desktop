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

export type SignUpSchemaType = z.infer<typeof SignUpSchema>;

export const SignUpSchema = z.object({
  firstName: z.string().min(1, { message: 'O nome é obrigatório!' }),
  lastName: z.string().min(1, { message: 'O sobrenome é obrigatório!' }),
  email: schemaUtils.email(),
  password: z
    .string()
    .min(1, { message: 'A senha mestre é obrigatória!' })
    .min(12, { message: 'A senha mestre deve ter pelo menos 12 caracteres para segurança institucional!' }),
});

// ----------------------------------------------------------------------

export interface JwtSignUpViewProps {
  isInitVault?: boolean;
}

export function JwtSignUpView({ isInitVault = false }: JwtSignUpViewProps) {
  const theme = useTheme();
  const router = useRouter();
  const showPassword = useBoolean();
  const { checkUserSession } = useAuthContext();
  const { refreshStatus } = useBootstrap();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: SignUpSchemaType = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleSocialLogin = (provider: 'google' | 'github') => {
    const providerName = provider === 'google' ? 'Google' : 'GitHub';
    setErrorMessage(
      `Conta do ${providerName} não vinculada a nenhum operador existente. O primeiro acesso institucional requer o preenchimento do formulário abaixo para criação do cofre seguro.`
    );
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      await checkUserSession?.();
      await refreshStatus();

      router.push(paths.dashboard.root);
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{ display: 'flex', gap: { xs: 3, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}
      >
        <Field.Text
          name="firstName"
          label="Nome"
          placeholder="Ex: Sandro"
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
                '& input': {
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  color: 'info.main',
                  '&:-webkit-autofill': {
                    WebkitBoxShadow: '0 0 0 100px #020817 inset',
                    WebkitTextFillColor: theme.palette.info.main,
                    transition: 'background-color 5000s ease-in-out 0s',
                  },
                },
                '& fieldset': { borderColor: alpha(theme.palette.info.main, 0.2) },
                '&:hover fieldset': { borderColor: `${theme.palette.info.main} !important` },
                '&.Mui-focused fieldset': { borderColor: `${theme.palette.info.main} !important` },
              },
            },
          }}
        />
        <Field.Text
          name="lastName"
          label="Sobrenome"
          placeholder="Ex: Operador"
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
                '& input': {
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  color: 'info.main',
                  '&:-webkit-autofill': {
                    WebkitBoxShadow: '0 0 0 100px #020817 inset',
                    WebkitTextFillColor: theme.palette.info.main,
                    transition: 'background-color 5000s ease-in-out 0s',
                  },
                },
                '& fieldset': { borderColor: alpha(theme.palette.info.main, 0.2) },
                '&:hover fieldset': { borderColor: `${theme.palette.info.main} !important` },
                '&.Mui-focused fieldset': { borderColor: `${theme.palette.info.main} !important` },
              },
            },
          }}
        />
      </Box>

      <Field.Text
        name="email"
        label="E-mail Institucional"
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
              '& input': {
                fontFamily: 'var(--font-orbitron), sans-serif',
                color: 'info.main',
                '&:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 100px #020817 inset',
                  WebkitTextFillColor: theme.palette.info.main,
                  transition: 'background-color 5000s ease-in-out 0s',
                },
              },
              '& fieldset': { borderColor: alpha(theme.palette.info.main, 0.2) },
              '&:hover fieldset': { borderColor: `${theme.palette.info.main} !important` },
              '&.Mui-focused fieldset': { borderColor: `${theme.palette.info.main} !important` },
            },
          },
        }}
      />

      <Field.Text
        name="password"
        label="Nova Senha Mestre"
        placeholder="Mínimo 12 caracteres seguros"
        type={showPassword.value ? 'text' : 'password'}
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
              '& input': {
                fontFamily: 'var(--font-orbitron), sans-serif',
                color: 'info.main',
                '&:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 100px #020817 inset',
                  WebkitTextFillColor: theme.palette.info.main,
                  transition: 'background-color 5000s ease-in-out 0s',
                },
              },
              '& fieldset': { borderColor: alpha(theme.palette.info.main, 0.2) },
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

      <Button
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
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
            transform: 'scale(1.02)',
            boxShadow: `0 0 25px ${alpha(theme.palette.info.main, 0.4)}`,
          },
        }}
      >
        {isInitVault ? 'CRIAR COFRE SEGURO' : 'SOLICITAR ACESSO'}
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
      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <Typography
          variant="h5"
          component="h1"
          sx={{
            color: 'info.main',
            mb: 1,
            fontWeight: 900,
            fontFamily: 'var(--font-orbitron), sans-serif',
          }}
        >
          {isInitVault ? 'INICIALIZAÇÃO DO COFRE' : 'SOLICITAR ACESSO'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.500', fontSize: 13 }}>
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

      {!!errorMessage && (
        <Alert
          severity="error"
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

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      <FormDivider label="OU IDENTIFIQUE-SE COM" />

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

      <SignUpTerms sx={{ color: 'grey.600', mt: 2 }} />
    </Box>
  );
}
