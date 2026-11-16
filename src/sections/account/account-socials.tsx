import React from 'react';
import { useForm } from 'react-hook-form';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';
import { Form, Field } from 'src/shared/components/hook-form';

// ----------------------------------------------------------------------

export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
};

type Props = {
  socialLinks?: SocialLinks;
};

export function AccountSocials({ socialLinks }: Props) {
  const methods = useForm<SocialLinks>({
    defaultValues: {
      facebook: socialLinks?.facebook || 'https://www.facebook.com/asppibra',
      instagram: socialLinks?.instagram || 'https://www.instagram.com/asppibra',
      linkedin: socialLinks?.linkedin || 'https://www.linkedin.com/company/asppibra',
      twitter: socialLinks?.twitter || 'https://www.twitter.com/asppibra',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(() => {
    toast.success('Redes sociais sincronizadas com sucesso!');
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
          Presença Digital
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Conecte seus perfis profissionais para exibição no diretório institucional.
        </Typography>

        <Stack spacing={3}>
          <Field.Text
            name="linkedin"
            label="LinkedIn"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify width={22} icon="eva:linkedin-fill" sx={{ color: '#0A66C2' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Field.Text
            name="twitter"
            label="X / Twitter"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify width={22} icon="ri:twitter-x-fill" sx={{ color: 'text.primary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Field.Text
            name="instagram"
            label="Instagram"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify width={22} icon="ant-design:instagram-filled" sx={{ color: '#DF3E30' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Field.Text
            name="facebook"
            label="Facebook"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify width={22} icon="eva:facebook-fill" sx={{ color: '#1877F2' }} />
                  </InputAdornment>
                ),
              },
            }}
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
            Salvar Redes
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}

export default AccountSocials;
