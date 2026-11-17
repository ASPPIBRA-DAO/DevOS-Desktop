import * as z from 'zod';
import React, { useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';
import { Form, Field } from 'src/shared/components/hook-form';

import { useAccountFacade } from './use-account';

// ----------------------------------------------------------------------
// Funções de Validação Documental Oficial
// ----------------------------------------------------------------------

/**
 * Validação algorítmica de CPF com rejeição prévia de caracteres inválidos.
 */
function isValidCpf(cpf: string): boolean {
  const trimmed = cpf.trim();
  if (!trimmed) return true;

  // Rejeita qualquer caractere fora de dígitos, pontos e traços
  if (/[^0-9.-]/.test(trimmed)) {
    return false;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += parseInt(digits[i], 10) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(digits[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += parseInt(digits[i], 10) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === parseInt(digits[10], 10);
}

/**
 * Validação algorítmica de CNPJ com suporte ao formato numérico legado
 * e ao formato alfanumérico oficial (IN RFB nº 2.229/2024).
 */
function isValidCnpj(cnpj: string): boolean {
  const trimmed = cnpj.trim();
  if (!trimmed) return true;

  // Rejeita caracteres fora do conjunto permitido
  if (/[^a-zA-Z0-9./-]/.test(trimmed)) {
    return false;
  }

  const normalized = trimmed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (normalized.length !== 14) return false;

  // Os dois últimos devem ser dígitos decimais
  if (!/^\d{2}$/.test(normalized.slice(12))) {
    return false;
  }

  // Rejeita sequências de 14 caracteres idênticos
  if (/^(.)\1{13}$/.test(normalized)) {
    return false;
  }

  // Conversão de cada caractere das 12 primeiras posições por ASCII - 48
  const values: number[] = [];
  for (let i = 0; i < 12; i += 1) {
    values.push(normalized.charCodeAt(i) - 48);
  }

  // 1º Dígito Verificador (pesos: 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i += 1) sum1 += values[i] * w1[i];
  const rem1 = sum1 % 11;
  const d1 = rem1 < 2 ? 0 : 11 - rem1;
  if (d1 !== parseInt(normalized[12], 10)) return false;

  // 2º Dígito Verificador (pesos: 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3) + d1*2
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3];
  let sum2 = 0;
  for (let i = 0; i < 12; i += 1) sum2 += values[i] * w2[i];
  sum2 += d1 * 2;
  const rem2 = sum2 % 11;
  const d2 = rem2 < 2 ? 0 : 11 - rem2;
  return d2 === parseInt(normalized[13], 10);
}

/**
 * Validação rigorosa de data (ISO YYYY-MM-DD ou legível DD/MM/AAAA)
 * com verificação de calendário, ano bissexto e impedimento de datas futuras.
 */
function isValidBirthDate(dateStr: string): boolean {
  const trimmed = dateStr.trim();
  if (!trimmed) return true;

  let iso = trimmed;
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    } else {
      return false;
    }
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) return false;

  const dateObj = new Date(year, month - 1, day);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return false; // Rejeita dias inexistentes (ex: 31/04, 29/02 em não-bissextos)
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return dateObj <= today;
}

// ----------------------------------------------------------------------
// Schema de Validação Zod com Validação Condicional PF / PJ
// ----------------------------------------------------------------------

export const UpdateUserSchema = z
  .object({
    personType: z.enum(['PF', 'PJ']),
    firstName: z.string().max(100, 'Máximo de 100 caracteres'),
    lastName: z.string().max(100, 'Máximo de 100 caracteres'),
    companyName: z.string().max(150, 'Máximo de 150 caracteres'),
    cnpj: z.string().max(20, 'Máximo de 20 caracteres'),
    legalRepresentative: z.string().max(100, 'Máximo de 100 caracteres'),
    legalRepresentativeCpf: z.string().max(20, 'Máximo de 20 caracteres'),
    username: z
      .string()
      .min(3, { message: 'Username deve ter pelo menos 3 caracteres' })
      .max(30, { message: 'Username deve ter no máximo 30 caracteres' })
      .regex(/^[a-z0-9_]+$/, {
        message: 'Apenas letras minúsculas, números e sublinhados são permitidos',
      }),
    email: z.string().email({ message: 'E-mail inválido!' }),
    photoURL: z.string().nullable().optional(),
    coverURL: z.string().nullable().optional(),
    phoneNumber: z.string().max(30, 'Telefone inválido'),
    cpf: z.string().max(20, 'CPF inválido'),
    birthDate: z.string(),
    nationality: z.string().max(50),
    maritalStatus: z.string(),
    rg: z.string().max(30),
    rgIssuer: z.string().max(30),
    cnh: z.string().max(30),
    cnhCategory: z.string().max(10),
    motherName: z.string().max(100),
    fatherName: z.string().max(100),
    country: z.string().min(1, { message: 'País obrigatório!' }),
    address: z.string().min(1, { message: 'Endereço obrigatório!' }),
    addressNumber: z.string().max(30),
    complement: z.string().max(100),
    neighborhood: z.string().max(100),
    state: z.string().min(1, { message: 'Estado obrigatório!' }),
    city: z.string().min(1, { message: 'Cidade obrigatória!' }),
    zipCode: z.string().min(1, { message: 'CEP obrigatório!' }),
    occupation: z.string().max(100),
    company: z.string().max(100),
    website: z.string().max(200),
    about: z.string().max(2000, 'Máximo de 2.000 caracteres'),
    isPublic: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Validação de URL segura (bloqueia esquemas como javascript:, data:, file:)
    if (data.website && data.website.trim().length > 0) {
      const trimmedUrl = data.website.trim();
      if (!/^https?:\/\//i.test(trimmedUrl)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['website'],
          message: 'Website deve ser uma URL absoluta segura iniciando com http:// ou https://',
        });
      }
    }

    if (data.personType === 'PF') {
      if (!data.firstName || data.firstName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['firstName'],
          message: 'Nome é obrigatório para Pessoa Física!',
        });
      }
      if (!data.lastName || data.lastName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lastName'],
          message: 'Sobrenome é obrigatório para Pessoa Física!',
        });
      }
      if (data.cpf && data.cpf.trim().length > 0 && !isValidCpf(data.cpf)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cpf'],
          message: 'CPF inválido. Verifique os dígitos numéricos.',
        });
      }
      if (data.birthDate && data.birthDate.trim().length > 0 && !isValidBirthDate(data.birthDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['birthDate'],
          message: 'Data de nascimento inválida, inexistente ou no futuro.',
        });
      }
    } else if (data.personType === 'PJ') {
      if (!data.companyName || data.companyName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['companyName'],
          message: 'Razão Social / Nome da Empresa é obrigatório para Pessoa Jurídica!',
        });
      }
      if (data.cnpj && data.cnpj.trim().length > 0 && !isValidCnpj(data.cnpj)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cnpj'],
          message: 'CNPJ inválido (suporta formato numérico e alfanumérico RFB 2026).',
        });
      }
      if (
        data.legalRepresentativeCpf &&
        data.legalRepresentativeCpf.trim().length > 0 &&
        !isValidCpf(data.legalRepresentativeCpf)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legalRepresentativeCpf'],
          message: 'CPF do representante legal inválido.',
        });
      }
    }

    if (data.zipCode && data.zipCode.trim().length > 0) {
      const cleanCep = data.zipCode.replace(/\D/g, '');
      if (cleanCep.length !== 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['zipCode'],
          message: 'CEP deve conter exatamente 8 dígitos numéricos.',
        });
      }
    }
  });

export type UpdateUserSchemaType = z.infer<typeof UpdateUserSchema>;

export function AccountGeneral() {
  const {
    user,
    updateProfile,
    isLoading,
    isSaving,
    isVaultLocked,
    error,
    hasLoadedInitially,
    refreshProfile,
  } = useAccountFacade();

  const defaultValues: UpdateUserSchemaType = useMemo(
    () => ({
      personType: user.personType || 'PF',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      companyName: user.companyName || '',
      cnpj: user.cnpj || '',
      legalRepresentative: user.legalRepresentative || '',
      legalRepresentativeCpf: user.legalRepresentativeCpf || '',
      username: user.username || '',
      email: user.email || '',
      photoURL: user.photoURL ?? null,
      coverURL: user.coverURL ?? null,
      phoneNumber: user.phoneNumber || '',
      cpf: user.cpf || '',
      birthDate: user.birthDate || '',
      nationality: user.nationality || 'Brasileira',
      maritalStatus: user.maritalStatus || 'Solteiro(a)',
      rg: user.rg || '',
      rgIssuer: user.rgIssuer || '',
      cnh: user.cnh || '',
      cnhCategory: user.cnhCategory || '',
      motherName: user.motherName || '',
      fatherName: user.fatherName || '',
      country: user.country || 'Brasil',
      address: user.address || '',
      addressNumber: user.addressNumber || '',
      complement: user.complement || '',
      neighborhood: user.neighborhood || '',
      state: user.state || '',
      city: user.city || '',
      zipCode: user.zipCode || '',
      occupation: user.occupation || '',
      company: user.company || '',
      website: user.website || '',
      about: user.about || '',
      isPublic: user.isPublic ?? false,
    }),
    [user]
  );

  const methods = useForm<UpdateUserSchemaType>({
    mode: 'onTouched',
    resolver: zodResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    reset,
    control,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  // Proteção contra perda de digitação: Não reseta o formulário se o usuário estiver editando (isDirty)
  useEffect(() => {
    if (!isDirty) {
      reset(defaultValues);
    }
  }, [defaultValues, reset, isDirty]);

  // Monitora com useWatch apenas os campos que compõem o cálculo do Completeness Score
  const watchedPersonType = useWatch({ control, name: 'personType' });
  const watchedFirstName = useWatch({ control, name: 'firstName' });
  const watchedLastName = useWatch({ control, name: 'lastName' });
  const watchedCompanyName = useWatch({ control, name: 'companyName' });
  const watchedCpf = useWatch({ control, name: 'cpf' });
  const watchedCnpj = useWatch({ control, name: 'cnpj' });
  const watchedLegalRep = useWatch({ control, name: 'legalRepresentative' });
  const watchedLegalRepCpf = useWatch({ control, name: 'legalRepresentativeCpf' });
  const watchedEmail = useWatch({ control, name: 'email' });
  const watchedPhone = useWatch({ control, name: 'phoneNumber' });
  const watchedZip = useWatch({ control, name: 'zipCode' });
  const watchedCity = useWatch({ control, name: 'city' });
  const watchedState = useWatch({ control, name: 'state' });
  const watchedAddress = useWatch({ control, name: 'address' });
  const watchedBirthDate = useWatch({ control, name: 'birthDate' });
  const watchedRg = useWatch({ control, name: 'rg' });
  const watchedCnh = useWatch({ control, name: 'cnh' });
  const watchedMother = useWatch({ control, name: 'motherName' });
  const watchedOccupation = useWatch({ control, name: 'occupation' });
  const watchedAbout = useWatch({ control, name: 'about' });

  // Cálculo rigoroso do Completeness Score totalizando exatamente 100 pontos para PF e PJ
  const completenessScore = useMemo(() => {
    let score = 0;
    if (watchedPersonType === 'PJ') {
      // PJ: 20 + 20 + 15 + 10 + 10 + 5 + 5 + 5 + 5 + 5 = 100
      if (watchedCompanyName && watchedCompanyName.trim()) score += 20;
      if (watchedCnpj && isValidCnpj(watchedCnpj)) score += 20;
      if (watchedLegalRep && watchedLegalRep.trim()) score += 15;
      if (watchedLegalRepCpf && isValidCpf(watchedLegalRepCpf)) score += 10;
      if (watchedEmail && watchedEmail.trim()) score += 10;
      if (watchedPhone && watchedPhone.trim()) score += 5;
      if (watchedZip && watchedZip.trim()) score += 5;
      if (watchedCity && watchedCity.trim() && watchedState && watchedState.trim()) score += 5;
      if (watchedAddress && watchedAddress.trim()) score += 5;
      if (watchedOccupation && watchedOccupation.trim()) score += 5;
    } else {
      // PF: 10 + 10 + 20 + 10 + 10 + 5 + 10 + 5 + 5 + 5 + 5 + 5 = 100
      if (watchedFirstName && watchedFirstName.trim()) score += 10;
      if (watchedLastName && watchedLastName.trim()) score += 10;
      if (watchedCpf && isValidCpf(watchedCpf)) score += 20;
      if (watchedBirthDate && isValidBirthDate(watchedBirthDate)) score += 10;
      if ((watchedRg && watchedRg.trim()) || (watchedCnh && watchedCnh.trim())) score += 10;
      if (watchedMother && watchedMother.trim()) score += 5;
      if (watchedEmail && watchedEmail.trim()) score += 10;
      if (watchedPhone && watchedPhone.trim()) score += 5;
      if (watchedZip && watchedZip.trim()) score += 5;
      if (watchedCity && watchedCity.trim() && watchedState && watchedState.trim()) score += 5;
      if (watchedAddress && watchedAddress.trim()) score += 5;
      if ((watchedOccupation && watchedOccupation.trim()) || (watchedAbout && watchedAbout.trim()))
        score += 5;
    }

    return Math.min(score, 100);
  }, [
    watchedPersonType,
    watchedFirstName,
    watchedLastName,
    watchedCompanyName,
    watchedCpf,
    watchedCnpj,
    watchedLegalRep,
    watchedLegalRepCpf,
    watchedEmail,
    watchedPhone,
    watchedZip,
    watchedCity,
    watchedState,
    watchedAddress,
    watchedBirthDate,
    watchedRg,
    watchedCnh,
    watchedMother,
    watchedOccupation,
    watchedAbout,
  ]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateProfile(data);
      toast.success('Identidade civil sincronizada e protegida no cofre local!');
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao salvar dados no cofre seguro.');
    }
  });

  if (isVaultLocked) {
    return (
      <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Iconify
          icon="solar:shield-keyhole-bold"
          width={64}
          sx={{ color: 'warning.main', mb: 2, mx: 'auto' }}
        />
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
          Cofre Criptográfico Bloqueado
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', mb: 3, maxWidth: 520, mx: 'auto' }}
        >
          Seus dados de identificação civil e qualificação documental são armazenados com
          criptografia nativa AES-256-GCM / Argon2id. O cofre precisa estar desbloqueado pelo login
          mestre para que você possa visualizar e atualizar suas informações com segurança.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="solar:lock-keyhole-minimalistic-bold" />}
          onClick={refreshProfile}
          sx={{ px: 3, py: 1, fontWeight: 700 }}
        >
          Recarregar Estado do Cofre
        </Button>
      </Card>
    );
  }

  // Previne a exibição de formulário vazio enquanto a primeira resposta do backend não chega
  if (!hasLoadedInitially || isLoading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={140} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rounded" height={360} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rounded" height={260} sx={{ borderRadius: 2 }} />
      </Stack>
    );
  }

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 1.5 }}>
          {error}
        </Alert>
      )}

      {/* BARRA: PROGRESSO DA IDENTIDADE + VISIBILIDADE DO PERFIL */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2, gap: 1.5 }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Progresso da sua Identidade
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              Complete suas informações civis para habilitação de contratos e governança DAO.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
            <Field.Switch name="isPublic" label="Perfil Público" />
            <Typography
              variant="subtitle2"
              sx={{
                color: 'primary.main',
                fontWeight: 800,
                bgcolor: 'rgba(0, 167, 111, 0.12)',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {completenessScore}% Completo
            </Typography>
          </Stack>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={completenessScore}
          color={completenessScore > 75 ? 'success' : 'primary'}
          sx={{ height: 8, borderRadius: 1, mb: 2 }}
        />

        <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            • Nome / Razão Social (+20)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            • CPF / CNPJ (+20)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            • Documento Civil (+10)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            • Endereço (+15)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            • Contato (+15)
          </Typography>
        </Stack>
      </Card>

      {/* FORMULÁRIO DE IDENTIDADE CIVIL */}
      <Stack spacing={3.5} sx={{ width: 1 }}>
        {/* Bloco 1: Sua Identidade */}
        <Card sx={{ p: 3.5, borderRadius: 2 }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}
          >
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}
            >
              <Iconify icon="solar:user-id-bold" width={22} sx={{ color: 'primary.main' }} />
              Sua Identidade
            </Typography>

            <Field.Select name="personType" label="Tipo de Titularidade" sx={{ maxWidth: 220 }}>
              <MenuItem value="PF">Pessoa Física (PF)</MenuItem>
              <MenuItem value="PJ">Pessoa Jurídica (PJ)</MenuItem>
            </Field.Select>
          </Stack>

          <Box
            sx={{
              rowGap: 2.5,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            {watchedPersonType === 'PJ' ? (
              <>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Field.Text
                    name="companyName"
                    label="Razão Social / Nome da Empresa"
                    placeholder="Ex: Minha Empresa Ltda"
                  />
                </Box>
                <Field.Text
                  name="cnpj"
                  label="CNPJ (Numérico ou Alfanumérico RFB)"
                  placeholder="00.000.000/0001-00 ou 12.ABC.345/01DE-35"
                />
                <Field.Text
                  name="legalRepresentative"
                  label="Nome do Representante Legal"
                  placeholder="Nome completo do responsável"
                />
                <Field.Text
                  name="legalRepresentativeCpf"
                  label="CPF do Representante Legal"
                  placeholder="000.000.000-00"
                />
              </>
            ) : (
              <>
                <Field.Text name="firstName" label="Nome" placeholder="Nome" />
                <Field.Text name="lastName" label="Sobrenome" placeholder="Sobrenome" />
                <Field.Text name="cpf" label="CPF (Identificador Civil)" placeholder="000.000.000-00" />
                <Field.Text
                  name="birthDate"
                  label="Data de Nascimento (AAAA-MM-DD)"
                  placeholder="Ex: 1985-05-15"
                />
                <Field.Select name="maritalStatus" label="Estado Civil">
                  {['Solteiro(a)', 'Casado(a)', 'União Estável', 'Divorciado(a)', 'Viúvo(a)'].map(
                    (status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    )
                  )}
                </Field.Select>
                <Field.Text name="nationality" label="Nacionalidade" placeholder="Brasileira" />
                <Field.Text name="rg" label="RG (Opcional)" placeholder="Número do RG" />
                <Field.Text
                  name="rgIssuer"
                  label="Órgão Emissor / UF"
                  placeholder="Ex: SSP/SP"
                />
                <Field.Text name="cnh" label="Nº Registro CNH (Opcional)" />
                <Field.Select name="cnhCategory" label="Categoria da CNH (Opcional)">
                  {['', 'A', 'B', 'AB', 'C', 'D', 'E'].map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat || 'Nenhuma'}
                    </MenuItem>
                  ))}
                </Field.Select>
                <Field.Text name="motherName" label="Nome da Mãe" />
                <Field.Text name="fatherName" label="Nome do Pai" />
              </>
            )}

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Field.Text
                name="email"
                label="Email de Acesso (Gerenciado pela Autenticação)"
                disabled
                helperText="O email é a credencial mestre de autenticação da conta e não pode ser alterado por este formulário civil."
              />
            </Box>
            <Field.Text name="username" label="@username (Identificador do Nó)" />
            <Field.Text name="phoneNumber" label="Telefone / WhatsApp" placeholder="(00) 00000-0000" />
          </Box>
        </Card>

        {/* Bloco 2: Endereço Residencial ou Comercial */}
        <Card sx={{ p: 3.5, borderRadius: 2 }}>
          <Typography
            variant="h6"
            sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}
          >
            <Iconify icon="solar:map-point-wave-bold" width={22} sx={{ color: 'primary.main' }} />
            {watchedPersonType === 'PJ' ? 'Endereço Comercial / Sede' : 'Endereço Residencial'}
          </Typography>

          <Box
            sx={{
              rowGap: 2.5,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <Field.Text name="country" label="País" />
            <Field.Text name="zipCode" label="CEP" placeholder="00000-000" />
            <Field.Text name="state" label="Estado (UF)" placeholder="Ex: SP" />
            <Field.Text name="city" label="Cidade" />
            <Field.Text name="neighborhood" label="Bairro" />
            <Field.Text
              name="addressNumber"
              label="Número / Km"
              placeholder="Ex: 120 ou Km 4"
            />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Field.Text name="address" label="Logradouro / Rua / Estrada" />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Field.Text name="complement" label="Complemento (Opcional - Sala, Lote, Apto)" />
            </Box>
          </Box>
        </Card>

        {/* Bloco 3: Perfil Profissional / Institucional */}
        <Card sx={{ p: 3.5, borderRadius: 2 }}>
          <Typography
            variant="h6"
            sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}
          >
            <Iconify icon="solar:case-round-bold" width={22} sx={{ color: 'primary.main' }} />
            {watchedPersonType === 'PJ' ? 'Dados Institucionais' : 'Perfil Profissional'}
          </Typography>

          <Box
            sx={{
              rowGap: 2.5,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <Field.Text
              name="occupation"
              label={watchedPersonType === 'PJ' ? 'Ramo de Atuação / CNAE' : 'Profissão / Especialidade'}
            />
            <Field.Text
              name="company"
              label={watchedPersonType === 'PJ' ? 'Grupo Econômico / Filial' : 'Empresa Atual'}
            />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Field.Text name="website" label="Website Institucional ou Portfólio" placeholder="https://exemplo.com.br" />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Field.Text
                name="about"
                multiline
                rows={4}
                label={watchedPersonType === 'PJ' ? 'Apresentação Institucional' : 'Biografia Resumida'}
                helperText="Máximo de 2.000 caracteres."
              />
            </Box>
          </Box>
        </Card>

        {/* Botão de Salvar */}
        <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 1 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting || isSaving || !isDirty}
            size="large"
            startIcon={
              isSubmitting || isSaving ? (
                <Iconify icon="solar:refresh-circle-bold" className="animate-spin" />
              ) : (
                <Iconify icon="solar:diskette-bold" />
              )
            }
            sx={{ px: 4, fontWeight: 800 }}
          >
            {isSubmitting || isSaving ? 'Salvando no Cofre...' : 'Salvar Alterações'}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}

export default AccountGeneral;
