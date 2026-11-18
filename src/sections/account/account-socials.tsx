import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';
import { Form, Field } from 'src/shared/components/hook-form';

// ----------------------------------------------------------------------

export type SocialField = 'facebook' | 'instagram' | 'linkedin' | 'twitter';

export type SocialLinks = Partial<Record<SocialField, string>>;

export type SocialFormValues = Record<SocialField, string>;

export type SaveSocialLinks = (links: SocialFormValues) => Promise<void> | void;

type Props = {
  socialLinks?: SocialLinks;
  onSave?: SaveSocialLinks;
};

type SocialFieldConfig = {
  name: SocialField;
  label: string;
  icon: string;
  color: string;
};

// ----------------------------------------------------------------------

export const SOCIAL_FIELDS = [
  {
    name: 'linkedin',
    label: 'LinkedIn',
    icon: 'eva:linkedin-fill',
    color: '#0A66C2',
  },
  {
    name: 'twitter',
    label: 'X / Twitter',
    icon: 'ri:twitter-x-fill',
    color: 'text.primary',
  },
  {
    name: 'instagram',
    label: 'Instagram',
    icon: 'ant-design:instagram-filled',
    color: '#DF3E30',
  },
  {
    name: 'facebook',
    label: 'Facebook',
    icon: 'eva:facebook-fill',
    color: '#1877F2',
  },
] as const satisfies readonly SocialFieldConfig[];

// ----------------------------------------------------------------------

export const ALLOWED_HOSTS: Record<SocialField, readonly string[]> = {
  facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.com', 'www.fb.com'],
  instagram: ['instagram.com', 'www.instagram.com'],
  linkedin: ['linkedin.com', 'www.linkedin.com'],
  twitter: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
};

export const MAX_URL_LENGTH = 2048;

// ----------------------------------------------------------------------

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

// ----------------------------------------------------------------------

export function createDefaultValues(socialLinks?: SocialLinks): SocialFormValues {
  return {
    facebook: safeString(socialLinks?.facebook),
    instagram: safeString(socialLinks?.instagram),
    linkedin: safeString(socialLinks?.linkedin),
    twitter: safeString(socialLinks?.twitter),
  };
}

// ----------------------------------------------------------------------

export function normalizeSocialLinks(
  input: Partial<Record<SocialField, unknown>>
): {
  values: SocialFormValues;
  errors: Partial<Record<SocialField, string>>;
} {
  const values: SocialFormValues = {
    facebook: '',
    instagram: '',
    linkedin: '',
    twitter: '',
  };
  const errors: Partial<Record<SocialField, string>> = {};

  for (const field of SOCIAL_FIELDS) {
    const { name } = field;
    const candidate = input[name];

    if (candidate === undefined || candidate === null) {
      values[name] = '';
      continue;
    }

    if (typeof candidate !== 'string') {
      errors[name] = 'O valor informado deve ser um texto válido.';
      continue;
    }

    const rawValue = candidate.trim();

    // Campos opcionais podem permanecer vazios
    if (!rawValue) {
      values[name] = '';
      continue;
    }

    if (rawValue.length > MAX_URL_LENGTH) {
      errors[name] = 'A URL ultrapassa o tamanho permitido de 2.048 caracteres.';
      continue;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawValue);
    } catch {
      errors[name] = 'Informe uma URL válida, incluindo https://.';
      continue;
    }

    const validProtocol = parsedUrl.protocol === 'https:';
    const validHost = ALLOWED_HOSTS[name].includes(parsedUrl.hostname.toLowerCase());
    const hasCredentials = Boolean(parsedUrl.username) || Boolean(parsedUrl.password);
    const hasCustomPort = Boolean(parsedUrl.port);

    if (!validProtocol || !validHost || hasCredentials || hasCustomPort) {
      errors[name] = 'Informe uma URL HTTPS válida da plataforma correspondente.';
      continue;
    }

    values[name] = parsedUrl.href;
  }

  return { values, errors };
}

// ----------------------------------------------------------------------

export function AccountSocials({ socialLinks, onSave }: Props) {
  const methods = useForm<SocialFormValues>({
    defaultValues: createDefaultValues(socialLinks),
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { isSubmitting, dirtyFields },
  } = methods;

  const facebook = socialLinks?.facebook;
  const instagram = socialLinks?.instagram;
  const linkedin = socialLinks?.linkedin;
  const twitter = socialLinks?.twitter;

  const hasUnsavedChanges = Object.keys(dirtyFields).length > 0;

  // Sincroniza os valores quando as propriedades externas mudarem, preservando campos modificados
  useEffect(() => {
    reset(
      createDefaultValues({
        facebook,
        instagram,
        linkedin,
        twitter,
      }),
      {
        keepDirtyValues: true,
      }
    );
  }, [reset, facebook, instagram, linkedin, twitter]);

  const onSubmit = handleSubmit(async (submittedValues) => {
    clearErrors();

    const { values, errors } = normalizeSocialLinks(submittedValues);
    const invalidFields = Object.keys(errors) as SocialField[];

    if (invalidFields.length > 0) {
      invalidFields.forEach((field) => {
        const message = errors[field];
        if (message) {
          setError(field, {
            type: 'validate',
            message,
          });
        }
      });
      toast.error('Verifique as URLs informadas antes de continuar.');
      return;
    }

    // Não simula uma operação de persistência inexistente
    if (!onSave) {
      toast.error('O serviço de salvamento ainda não foi configurado.');
      return;
    }

    try {
      await onSave(values);
      // Atualiza a referência inicial do formulário após o sucesso
      reset(values);
      toast.success('Redes sociais salvas com sucesso!');
    } catch {
      toast.error('Não foi possível salvar suas redes sociais. Tente novamente.');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ width: 1, p: 4, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
          Presença Digital
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Conecte seus perfis profissionais para exibição no diretório institucional.
        </Typography>

        {!onSave && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            O serviço de salvamento ainda não está conectado. Os dados não poderão ser persistidos até
            que a integração com a API seja configurada.
          </Alert>
        )}

        {hasUnsavedChanges && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Existem alterações ainda não salvas no formulário.
          </Alert>
        )}

        <Stack spacing={3}>
          {SOCIAL_FIELDS.map((field) => (
            <Field.Text
              key={field.name}
              name={field.name}
              label={field.label}
              type="url"
              autoComplete="url"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify width={22} icon={field.icon} sx={{ color: field.color }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          ))}
        </Stack>

        <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 4 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !onSave}
            size="large"
            sx={{ px: 4, fontWeight: 800 }}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Redes'}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}

export default AccountSocials;
