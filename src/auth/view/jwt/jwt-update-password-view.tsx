import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';
import { Form, Field, schemaUtils } from 'src/shared/components/hook-form';

import { paths } from 'src/routes/paths';
import { SentIcon } from 'src/assets/icons';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { getErrorMessage } from '../../utils/error-message';
import { FormResendCode } from '../../components/form-resend-code';
import { IdentitySessionService } from '../../application/identity-session.service';

// ----------------------------------------------------------------------

export type UpdatePasswordSchemaType = z.infer<typeof UpdatePasswordSchema>;

export const UpdatePasswordSchema = z
  .object({
    code: z
      .string()
      .min(1, { message: 'O código é obrigatório!' })
      .min(6, { message: 'O código deve ter pelo menos 6 caracteres!' }),
    email: schemaUtils.email(),
    password: z
      .string()
      .min(1, { message: 'A senha é obrigatória!' })
      .min(6, { message: 'A senha deve ter pelo menos 6 caracteres!' }),
    confirmPassword: z.string().min(1, { message: 'A confirmação de senha é obrigatória!' }),
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: 'As senhas não coincidem!',
    path: ['confirmPassword'],
  });

// ----------------------------------------------------------------------

export function JwtUpdatePasswordView() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token') || '';

  const showPassword = useBoolean();

  const defaultValues: UpdatePasswordSchemaType = {
    code: urlToken,
    email: '',
    password: '',
    confirmPassword: '',
  };

  const methods = useForm({
    resolver: zodResolver(UpdatePasswordSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const tokenToUse = urlToken || data.code;
      await IdentitySessionService.resetPassword(tokenToUse, data.email, data.password);
      toast.success('Senha atualizada! Faça login.');
      router.push(paths.auth.jwt.signIn);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text
        name="email"
        label="E-mail"
        placeholder="usuario@mundodigital.com"
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

      <Box
        sx={{ p: 2, border: `1px dashed ${alpha(theme.palette.info.main, 0.2)}`, borderRadius: 1 }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'info.main',
            mb: 1,
            display: 'block',
            fontFamily: 'var(--font-orbitron), sans-serif',
            fontWeight: 700,
          }}
        >
          CÓDIGO DE VERIFICAÇÃO
        </Typography>
        <Field.Code name="code" />
      </Box>

      <Field.Text
        name="password"
        label="Nova Senha"
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
                <IconButton onClick={showPassword.onToggle} edge="end" sx={{ color: 'info.main' }}>
                  <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Field.Text
        name="confirmPassword"
        label="Confirmar Nova Senha"
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
                <IconButton onClick={showPassword.onToggle} edge="end" sx={{ color: 'info.main' }}>
                  <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
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
            transform: 'scale(1.03)',
            boxShadow: `0 0 25px ${alpha(theme.palette.info.main, 0.4)}`,
          },
        }}
      >
        ATUALIZAR SENHA
      </Button>
    </Box>
  );

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
          <SentIcon
            sx={{
              width: 64,
              height: 64,
              color: 'info.main',
              filter: `drop-shadow(0 0 15px ${alpha(theme.palette.info.main, 0.4)})`,
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
          SOLICITAÇÃO ENVIADA!
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.500', fontSize: 13 }}>
          Enviamos um código de confirmação de 6 dígitos para o seu e-mail. Por favor, insira o
          código abaixo para redefinir sua senha.
        </Typography>
      </Box>

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      <FormResendCode
        onResendCode={() => {}}
        value={0}
        disabled={false}
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
