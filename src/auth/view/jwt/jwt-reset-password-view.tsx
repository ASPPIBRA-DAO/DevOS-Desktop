import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';

import { PasswordIcon } from 'src/assets/icons';
import { Iconify } from 'src/shared/components/iconify';
import { Form, Field, schemaUtils } from 'src/shared/components/hook-form';
import { toast } from 'src/shared/components/snackbar';

import { getErrorMessage } from '../../utils/error-message';
import { IdentitySessionService } from '../../application/identity-session.service';

// ----------------------------------------------------------------------

export type ResetPasswordSchemaType = z.infer<typeof ResetPasswordSchema>;

export const ResetPasswordSchema = z.object({
  email: schemaUtils.email(),
});

// ----------------------------------------------------------------------

export function JwtResetPasswordView() {
  const theme = useTheme();
  const router = useRouter();

  const defaultValues: ResetPasswordSchemaType = {
    email: '',
  };

  const methods = useForm({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await IdentitySessionService.forgotPassword(data.email);
      toast.success('Se o e-mail existir, enviaremos o link.');
      router.push(paths.auth.jwt.updatePassword);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text
        name="email"
        label="E-mail de Recuperação"
        placeholder="usuario@mundodigital.com"
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
        ENVIAR SOLICITAÇÃO
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
          <PasswordIcon
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
          ESQUECEU A SENHA?
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.500', fontSize: 13 }}>
          Insira o e-mail associado à sua conta e enviaremos um link de recuperação.
        </Typography>
      </Box>

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

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
