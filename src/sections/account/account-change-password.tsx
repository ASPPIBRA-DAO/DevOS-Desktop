import * as z from 'zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';
import { Form, Field } from 'src/shared/components/hook-form';

// ----------------------------------------------------------------------

const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, { message: 'Senha atual obrigatória!' }),
    newPassword: z.string().min(8, { message: 'A nova senha deve ter no mínimo 8 dígitos' }),
    confirmNewPassword: z.string().min(1, { message: 'Confirmação obrigatória!' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'As senhas não coincidem!',
    path: ['confirmNewPassword'],
  });

type ChangePasswordSchemaType = z.infer<typeof ChangePasswordSchema>;

export function AccountChangePassword() {
  const [showPassword, setShowPassword] = useState(false);

  const methods = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async () => {
    try {
      reset();
      toast.success('Senha atualizada com sucesso!');
    } catch {
      toast.error('Erro ao atualizar a senha.');
    }
  });

  return (
    <Stack spacing={4} sx={{ width: 1 }}>
      <Form methods={methods} onSubmit={onSubmit}>
        <Card sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
            Alterar Senha de Acesso
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Use no mínimo 8 caracteres contendo letras maiúsculas, números e caracteres especiais.
          </Typography>

          <Stack spacing={3}>
            <Field.Text
              name="oldPassword"
              type={showPassword ? 'text' : 'password'}
              label="Senha Atual"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                        <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Field.Text
              name="newPassword"
              type={showPassword ? 'text' : 'password'}
              label="Nova Senha"
              helperText="Mínimo 8 caracteres"
            />

            <Field.Text
              name="confirmNewPassword"
              type={showPassword ? 'text' : 'password'}
              label="Confirmar Nova Senha"
            />
          </Stack>

          <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              size="large"
              sx={{ px: 4, fontWeight: 800 }}
            >
              Atualizar Senha
            </Button>
          </Stack>
        </Card>
      </Form>

      {/* DISPOSITIVOS CONECTADOS */}
      <Card sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
          Dispositivos Conectados
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Sessões ativas com a sua credencial autenticada no momento.
        </Typography>

        <Stack spacing={2}>
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              bgcolor: (theme) => theme.palette.action.hover,
              borderRadius: 1.5,
            }}
          >
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Iconify icon="solar:laptop-minimalistic-bold" width={32} sx={{ color: 'success.main' }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>DevOS Desktop no Linux (Sessão Atual)</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>IP: 189.120.44.10 • Ativo agora</Typography>
              </Box>
            </Stack>
            <Button size="small" color="inherit" disabled sx={{ fontWeight: 700 }}>Conectado</Button>
          </Stack>

          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              bgcolor: (theme) => theme.palette.action.hover,
              borderRadius: 1.5,
            }}
          >
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Iconify icon="solar:smartphone-bold" width={32} sx={{ color: 'text.secondary' }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>App Android</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Último acesso: Ontem às 19:42</Typography>
              </Box>
            </Stack>
            <Button
              size="small"
              color="error"
              onClick={() => toast.info('Sessão remota encerrada.')}
              sx={{ fontWeight: 700 }}
            >
              Desconectar
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}

export default AccountChangePassword;
