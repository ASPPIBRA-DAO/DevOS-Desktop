import * as z from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';
import { Form, Field } from 'src/shared/components/hook-form';
import { UploadAvatar } from 'src/shared/components/upload/avatar/upload-avatar';

import { useAccountFacade } from './use-account';

// ----------------------------------------------------------------------

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1, { message: 'Nome obrigatório!' }),
  lastName: z.string().min(1, { message: 'Sobrenome obrigatório!' }),
  username: z
    .string()
    .min(3, { message: 'Username deve ter pelo menos 3 caracteres' })
    .max(30, { message: 'Username deve ter no máximo 30 caracteres' })
    .regex(/^[a-z0-9_]+$/, {
      message: 'Apenas letras minúsculas, números e sublinhados são permitidos',
    }),
  email: z.string().email({ message: 'E-mail inválido!' }),
  photoURL: z.any().optional(),
  coverURL: z.any().optional(),
  phoneNumber: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  cnh: z.string().optional(),
  cnhCategory: z.string().optional(),
  motherName: z.string().optional(),
  fatherName: z.string().optional(),
  country: z.string().min(1, { message: 'País obrigatório!' }),
  address: z.string().min(1, { message: 'Endereço obrigatório!' }),
  neighborhood: z.string().optional(),
  state: z.string().min(1, { message: 'Estado obrigatório!' }),
  city: z.string().min(1, { message: 'Cidade obrigatória!' }),
  zipCode: z.string().min(1, { message: 'CEP obrigatório!' }),
  occupation: z.string().optional(),
  company: z.string().optional(),
  website: z.string().optional(),
  about: z.string().optional(),
  isPublic: z.boolean(),
});

export type UpdateUserSchemaType = z.infer<typeof UpdateUserSchema>;

export function AccountGeneral() {
  const { user, updateProfile } = useAccountFacade();

  const defaultValues: UpdateUserSchemaType = {
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    photoURL: user.photoURL,
    coverURL: user.coverURL,
    phoneNumber: user.phoneNumber || '',
    cpf: user.cpf || '',
    rg: user.rg || '',
    cnh: user.cnh || '',
    cnhCategory: user.cnhCategory || '',
    motherName: user.motherName || '',
    fatherName: user.fatherName || '',
    country: user.country || 'Brasil',
    address: user.address || '',
    neighborhood: user.neighborhood || '',
    state: user.state || '',
    city: user.city || '',
    zipCode: user.zipCode || '',
    occupation: user.occupation || '',
    company: user.company || '',
    website: user.website || '',
    about: user.about || '',
    isPublic: user.isPublic,
  };

  const methods = useForm<UpdateUserSchemaType>({
    mode: 'all',
    resolver: zodResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  const values = watch();
  const coverURL = values.coverURL;
  const coverPreview = typeof coverURL === 'string' ? coverURL : null;

  // Lógica do Completeness Score
  const getScore = () => {
    let score = 0;
    if (values.photoURL) score += 15;
    if (values.firstName && values.lastName) score += 15;
    if (values.email) score += 10;
    if (values.phoneNumber) score += 10;
    if (values.address && values.zipCode) score += 10;
    if (values.cpf) score += 15;
    if (values.about) score += 5;
    if (values.occupation) score += 10;
    if (values.rg) score += 10;
    return Math.min(score, 100);
  };

  const completenessScore = getScore();

  const handleCoverChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const fakeUrl = URL.createObjectURL(file);
        setValue('coverURL', fakeUrl, { shouldDirty: true });
      }
    },
    [setValue]
  );

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        photoURL: user.photoURL,
        coverURL: user.coverURL,
        phoneNumber: user.phoneNumber || '',
        cpf: user.cpf || '',
        rg: user.rg || '',
        cnh: user.cnh || '',
        cnhCategory: user.cnhCategory || '',
        motherName: user.motherName || '',
        fatherName: user.fatherName || '',
        country: user.country || 'Brasil',
        address: user.address || '',
        neighborhood: user.neighborhood || '',
        state: user.state || '',
        city: user.city || '',
        zipCode: user.zipCode || '',
        occupation: user.occupation || '',
        company: user.company || '',
        website: user.website || '',
        about: user.about || '',
        isPublic: user.isPublic,
      });
    }
  }, [user, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateProfile(data);
      toast.success('Identidade civil atualizada com sucesso!');
    } catch {
      toast.error('Erro ao salvar os dados.');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      {/* BARRA: PROGRESSO DA IDENTIDADE */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Progresso da sua Identidade
          </Typography>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
            {completenessScore}%
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={completenessScore}
          color={completenessScore > 75 ? 'success' : 'primary'}
          sx={{ height: 8, borderRadius: 1, mb: 2 }}
        />

        <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>• Foto (+15)</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>• CPF (+15)</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>• Endereço (+10)</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>• Biografia (+5)</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>• Biometria (+15)</Typography>
        </Stack>
      </Card>

      <Grid container spacing={3}>
        {/* COLUNA ESQUERDA: CAPA, AVATAR E BIOMETRIA */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
              {/* Capa */}
              <Box
                sx={{
                  height: 120,
                  borderRadius: 1.5,
                  mb: 2,
                  position: 'relative',
                  bgcolor: 'grey.300',
                  backgroundImage: coverPreview ? `url(${coverPreview})` : 'linear-gradient(135deg, #072e21 0%, #007753 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <IconButton
                  component="label"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                  }}
                >
                  <Iconify icon="solar:camera-add-bold" width={18} />
                  <input type="file" hidden accept="image/*" onChange={handleCoverChange} />
                </IconButton>
              </Box>

              {/* Upload de Avatar */}
              <Controller
                name="photoURL"
                control={control}
                render={({ field }) => (
                  <UploadAvatar
                    value={field.value}
                    onDrop={(acceptedFiles) => {
                      const file = acceptedFiles[0];
                      if (file) {
                        field.onChange(URL.createObjectURL(file));
                      }
                    }}
                    helperText={
                      <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: 'text.disabled' }}>
                        Avatar: *.jpeg, *.jpg, *.png
                      </Typography>
                    }
                  />
                )}
              />

              <Field.Switch
                name="isPublic"
                label="Perfil Público"
                sx={{ mt: 2.5, justifyContent: 'center' }}
              />
            </Card>

            {/* CARD: FACE ID & BIOMETRIA */}
            <Card sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  mx: 'auto',
                  mb: 1.5,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0, 167, 111, 0.12)',
                  color: 'primary.main',
                }}
              >
                <Iconify icon="solar:scanner-bold" width={32} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Face ID & Biometria
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 2 }}>
                Valide sua prova de vida e identidade biométrica no sistema.
              </Typography>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                startIcon={<Iconify icon="solar:shield-check-bold" />}
                onClick={() => toast.info('Módulo biométrico nativo pronto para pareamento de câmera.')}
              >
                Configurar Biometria
              </Button>
            </Card>
          </Stack>
        </Grid>

        {/* COLUNA DIREITA: FORMULÁRIO DE IDENTIDADE CIVIL */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            {/* Bloco 1: Sua Identidade */}
            <Card sx={{ p: 3.5, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
                <Iconify icon="solar:user-id-bold" width={22} sx={{ color: 'primary.main' }} />
                Sua Identidade
              </Typography>

              <Box sx={{ rowGap: 2.5, columnGap: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <Field.Text name="firstName" label="Nome" />
                <Field.Text name="lastName" label="Sobrenome" />
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Field.Text name="email" label="Email de Acesso" />
                </Box>
                <Field.Text name="username" label="@username (Identificador Único)" />
                <Field.Text name="phoneNumber" label="Telefone" />
                <Field.Text name="cpf" label="CPF" />
                <Field.Text name="rg" label="RG" />
                <Field.Text name="cnh" label="Nº Registro CNH" />
                <Field.Select name="cnhCategory" label="Categoria da CNH">
                  {['A', 'B', 'AB', 'C', 'D', 'E'].map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Field.Select>
                <Field.Text name="motherName" label="Nome da Mãe" />
                <Field.Text name="fatherName" label="Nome do Pai" />
              </Box>
            </Card>

            {/* Bloco 2: Endereço Residencial */}
            <Card sx={{ p: 3.5, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
                <Iconify icon="solar:map-point-wave-bold" width={22} sx={{ color: 'primary.main' }} />
                Endereço Residencial
              </Typography>

              <Box sx={{ rowGap: 2.5, columnGap: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <Field.Text name="country" label="País" />
                <Field.Text name="zipCode" label="CEP" />
                <Field.Text name="state" label="Estado" />
                <Field.Text name="city" label="Cidade" />
                <Field.Text name="neighborhood" label="Bairro" />
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Field.Text name="address" label="Endereço Completo" />
                </Box>
              </Box>
            </Card>

            {/* Bloco 3: Perfil Profissional */}
            <Card sx={{ p: 3.5, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
                <Iconify icon="solar:case-round-bold" width={22} sx={{ color: 'primary.main' }} />
                Perfil Profissional
              </Typography>

              <Box sx={{ rowGap: 2.5, columnGap: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <Field.Text name="occupation" label="Profissão / Especialidade" />
                <Field.Text name="company" label="Empresa Atual" />
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Field.Text name="website" label="Website Pessoal ou Portfólio" />
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Field.Text name="about" multiline rows={4} label="Biografia Resumida" />
                </Box>
              </Box>
            </Card>

            {/* Botão de Salvar */}
            <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 1 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || !isDirty}
                size="large"
                sx={{ px: 4, fontWeight: 800 }}
              >
                Salvar Alterações
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
}

export default AccountGeneral;
