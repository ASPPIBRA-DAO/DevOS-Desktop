import * as z from 'zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';
import { Form, Field } from 'src/shared/components/hook-form';

// ----------------------------------------------------------------------

export const MIN_PASSWORD_LENGTH = 15;
export const MAX_PASSWORD_LENGTH = 128;

export function countCharacters(value: string): number {
  return Array.from(value).length;
}

// ----------------------------------------------------------------------

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, {
      message: 'Informe sua senha atual.',
    }),

    newPassword: z
      .string()
      .refine((value) => countCharacters(value) >= MIN_PASSWORD_LENGTH, {
        message: `A nova senha deve possuir pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      })
      .refine((value) => countCharacters(value) <= MAX_PASSWORD_LENGTH, {
        message: `A nova senha não pode ultrapassar ${MAX_PASSWORD_LENGTH} caracteres.`,
      }),

    confirmNewPassword: z.string().min(1, {
      message: 'Confirme sua nova senha.',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'As senhas não coincidem.',
        path: ['confirmNewPassword'],
      });
    }

    if (data.currentPassword && data.newPassword === data.currentPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'A nova senha deve ser diferente da senha atual.',
        path: ['newPassword'],
      });
    }
  });

export type ChangePasswordForm = z.infer<typeof ChangePasswordSchema>;

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordHandler = (payload: ChangePasswordPayload) => Promise<void>;

// ----------------------------------------------------------------------

export type SecuritySession = {
  id: string;
  deviceName: string;
  lastActiveAt: string;
  isCurrent: boolean;
};

type Props = {
  onChangePassword?: ChangePasswordHandler;
  sessions?: SecuritySession[];
  onRevokeSession?: (sessionId: string) => Promise<void>;
  onConfigureBiometrics?: () => Promise<void>;
};

// ----------------------------------------------------------------------

type PasswordFieldProps = {
  name: keyof ChangePasswordForm;
  label: string;
  autoComplete: string;
  visible: boolean;
  onToggle: () => void;
  helperText?: string;
};

function PasswordField({
  name,
  label,
  autoComplete,
  visible,
  onToggle,
  helperText,
}: PasswordFieldProps) {
  return (
    <Field.Text
      name={name}
      label={label}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      helperText={helperText}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                type="button"
                edge="end"
                aria-label={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
                aria-pressed={visible}
                onClick={onToggle}
              >
                <Iconify icon={visible ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

// ----------------------------------------------------------------------

function formatLastActive(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return date.toLocaleString();
}

// ----------------------------------------------------------------------

export function AccountChangePassword({
  onChangePassword,
  sessions,
  onRevokeSession,
  onConfigureBiometrics,
}: Props) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [configuringBiometrics, setConfiguringBiometrics] = useState(false);

  // --------------------------------------------------------------------

  const methods = useForm<ChangePasswordForm>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    mode: 'onBlur',
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // --------------------------------------------------------------------

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    if (!onChangePassword) {
      toast.error('O serviço de alteração de senha não está configurado.');
      return;
    }

    try {
      await onChangePassword({
        currentPassword,
        newPassword,
      });

      // Só limpa os campos após confirmação real do servidor.
      reset();

      toast.success('Senha atualizada com sucesso!');
    } catch {
      toast.error(
        'Não foi possível atualizar sua senha. Verifique suas credenciais e tente novamente.'
      );
    }
  });

  // --------------------------------------------------------------------

  const handleConfigureBiometrics = async () => {
    if (!onConfigureBiometrics) {
      return;
    }

    setConfiguringBiometrics(true);

    try {
      await onConfigureBiometrics();
      toast.success('Configuração biométrica concluída.');
    } catch {
      toast.error('Não foi possível configurar a autenticação biométrica.');
    } finally {
      setConfiguringBiometrics(false);
    }
  };

  // --------------------------------------------------------------------

  const handleRevokeSession = async (sessionId: string) => {
    if (!onRevokeSession) {
      return;
    }

    setRevokingSessionId(sessionId);

    try {
      await onRevokeSession(sessionId);
      toast.success('Sessão encerrada com sucesso.');
    } catch {
      toast.error('Não foi possível encerrar a sessão.');
    } finally {
      setRevokingSessionId(null);
    }
  };

  // --------------------------------------------------------------------

  return (
    <Stack spacing={4} sx={{ width: 1 }}>
      {/* ALTERAÇÃO DE SENHA */}
      <Form methods={methods} onSubmit={onSubmit}>
        <Card sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
            Alterar Senha de Acesso
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Utilize uma senha longa, exclusiva e difícil de adivinhar. Recomenda-se o uso de
            frases-senha e de um gerenciador de senhas.
          </Typography>

          {!onChangePassword && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              O serviço de autenticação ainda não está conectado. A alteração de senha está
              temporariamente desabilitada.
            </Alert>
          )}

          <Stack spacing={3}>
            <PasswordField
              name="currentPassword"
              label="Senha Atual"
              autoComplete="current-password"
              visible={showCurrentPassword}
              onToggle={() => setShowCurrentPassword((prev) => !prev)}
            />

            <PasswordField
              name="newPassword"
              label="Nova Senha"
              autoComplete="new-password"
              visible={showNewPassword}
              onToggle={() => setShowNewPassword((prev) => !prev)}
              helperText="Mínimo de 15 caracteres. Espaços e caracteres Unicode são permitidos."
            />

            <PasswordField
              name="confirmNewPassword"
              label="Confirmar Nova Senha"
              autoComplete="new-password"
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
            />
          </Stack>

          <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={!onChangePassword || isSubmitting}
              size="large"
              sx={{ px: 4, fontWeight: 800 }}
            >
              {isSubmitting ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
          </Stack>
        </Card>
      </Form>

      {/* AUTENTICAÇÃO BIOMÉTRICA */}
      <Card sx={{ p: 4, borderRadius: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            gap: 2.5,
          }}
        >
          <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0, 167, 111, 0.12)',
                color: 'primary.main',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:scanner-bold" width={30} />
            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Face ID e Biometria
              </Typography>

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Configure autenticação por meio dos mecanismos seguros disponíveis no dispositivo.
              </Typography>
            </Box>
          </Stack>

          <Button
            type="button"
            variant="contained"
            color="primary"
            disabled={!onConfigureBiometrics || configuringBiometrics}
            startIcon={<Iconify icon="solar:shield-check-bold" />}
            onClick={() => {
              void handleConfigureBiometrics();
            }}
            sx={{
              fontWeight: 800,
              px: 3,
              flexShrink: 0,
            }}
          >
            {configuringBiometrics ? 'Configurando...' : 'Configurar Biometria'}
          </Button>
        </Stack>

        {!onConfigureBiometrics && (
          <Alert severity="info" sx={{ mt: 3 }}>
            A integração biométrica ainda não está disponível.
          </Alert>
        )}
      </Card>

      {/* DISPOSITIVOS CONECTADOS */}
      <Card sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
          Dispositivos Conectados
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Consulte os dispositivos autenticados em sua conta. Encerre sessões que você não
          reconhece.
        </Typography>

        {sessions === undefined ? (
          <Alert severity="info">
            O serviço de consulta de sessões ainda não está conectado.
          </Alert>
        ) : sessions.length === 0 ? (
          <Alert severity="info">Nenhuma sessão adicional foi encontrada.</Alert>
        ) : (
          <Stack spacing={2}>
            {sessions.map((session) => (
              <Stack
                key={session.id}
                direction={{ xs: 'column', sm: 'row' }}
                sx={{
                  alignItems: { sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                  p: 2,
                  bgcolor: (theme) => theme.palette.action.hover,
                  borderRadius: 1.5,
                }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Iconify
                    icon="solar:laptop-minimalistic-bold"
                    width={32}
                    sx={{
                      color: session.isCurrent ? 'success.main' : 'text.secondary',
                    }}
                  />

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {session.deviceName}
                      {session.isCurrent ? ' (Sessão Atual)' : ''}
                    </Typography>

                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Última atividade: {formatLastActive(session.lastActiveAt)}
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  type="button"
                  size="small"
                  color="error"
                  disabled={
                    session.isCurrent ||
                    !onRevokeSession ||
                    revokingSessionId === session.id
                  }
                  onClick={() => {
                    void handleRevokeSession(session.id);
                  }}
                  sx={{ fontWeight: 700 }}
                >
                  {revokingSessionId === session.id
                    ? 'Desconectando...'
                    : session.isCurrent
                      ? 'Sessão Atual'
                      : 'Desconectar'}
                </Button>
              </Stack>
            ))}
          </Stack>
        )}
      </Card>
    </Stack>
  );
}

export default AccountChangePassword;
