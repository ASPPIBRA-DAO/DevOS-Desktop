import type { UserAccountData } from './use-account';

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
// Funções de Validação Documental Oficial e Estrita
// ----------------------------------------------------------------------

const CNPJ_WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function calculateCnpjDigit(values: number[], weights: number[]): number {
  const sum = values.reduce((total, value, index) => total + value * weights[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Validação rigorosa de CNPJ (numérico clássico ou alfanumérico RFB IN 2.229/2024).
 * Retorna true exclusivamente para CNPJs válidos com conteúdo preenchido.
 */
export function isStrictValidCnpj(input: string | undefined | null): boolean {
  if (!input || typeof input !== 'string') return false;
  const value = input.trim().toUpperCase();

  const isPlain = /^[A-Z0-9]{12}\d{2}$/.test(value);
  const isMasked = /^[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2}$/.test(value);

  if (!isPlain && !isMasked) return false;

  const normalized = value.replace(/[./-]/g, '');
  if (!/^[A-Z0-9]{12}\d{2}$/.test(normalized)) return false;
  if (/^(\d)\1{13}$/.test(normalized)) return false;

  // Conversão oficial: código ASCII menos 48
  const baseValues = Array.from(normalized.slice(0, 12), (character) => character.charCodeAt(0) - 48);
  const firstDigit = calculateCnpjDigit(baseValues, CNPJ_WEIGHTS_1);
  const secondDigit = calculateCnpjDigit([...baseValues, firstDigit], CNPJ_WEIGHTS_2);
  const calculated = `${firstDigit}${secondDigit}`;

  return normalized.slice(12) === calculated;
}

/**
 * Validação rigorosa de CPF com checagem de dígitos verificadores e rejeição de sequências.
 * Retorna true exclusivamente para CPFs válidos com conteúdo preenchido.
 */
export function isStrictValidCpf(cpf: string | undefined | null): boolean {
  if (!cpf) return false;
  const trimmed = cpf.trim();
  if (!trimmed) return false;

  // Aceita exclusivamente 11 dígitos ou formato 000.000.000-00
  if (!/^\d{11}$/.test(trimmed) && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(trimmed)) {
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
 * Validação rigorosa de data (ISO YYYY-MM-DD ou DD/MM/AAAA) no calendário gregoriano.
 * Rejeita dias inexistentes (ex: 29/02 em não-bissextos) e datas futuras.
 */
export function isStrictValidBirthDate(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  const trimmed = dateStr.trim();
  if (!trimmed) return false;

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
    return false;
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return dateObj <= today;
}

/**
 * Validação estrita de CEP (8 dígitos numéricos puros ou máscara 00000-000).
 */
export function isStrictValidCep(cep: string | undefined | null): boolean {
  if (!cep) return false;
  const trimmed = cep.trim();
  if (!trimmed) return false;
  return /^\d{5}-?\d{3}$/.test(trimmed);
}

/**
 * Validação de telefone com DDD (10 a 13 dígitos numéricos).
 */
export function isStrictValidPhone(phone: string | undefined | null): boolean {
  if (!phone) return false;
  const trimmed = phone.trim();
  if (!trimmed) return false;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) return false;
  return /^[+]?[0-9\s().-]{10,25}$/.test(trimmed) && !/[a-zA-Z]/.test(trimmed);
}

/**
 * Validação de URL de website com construtor nativo URL.
 * Exige HTTP/HTTPS e hostname válido com domínio (bloqueia credenciais embutidas).
 */
export function isStrictValidWebsite(url: string | undefined | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    if (parsed.username || parsed.password) {
      return false; // Rejeita credenciais embutidas na URL
    }
    if (!parsed.hostname || !parsed.hostname.includes('.') || parsed.hostname.endsWith('.')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------
// Schema de Validação Zod com Sanitização Trim
// ----------------------------------------------------------------------

export const UpdateUserSchema = z
  .object({
    personType: z.enum(['PF', 'PJ']),
    firstName: z.string().trim().max(100, 'Máximo de 100 caracteres'),
    lastName: z.string().trim().max(100, 'Máximo de 100 caracteres'),
    companyName: z.string().trim().max(150, 'Máximo de 150 caracteres'),
    cnpj: z.string().trim().max(20, 'Máximo de 20 caracteres'),
    legalRepresentative: z.string().trim().max(100, 'Máximo de 100 caracteres'),
    legalRepresentativeCpf: z.string().trim().max(20, 'Máximo de 20 caracteres'),
    username: z
      .string()
      .trim()
      .min(3, { message: 'Username deve ter pelo menos 3 caracteres' })
      .max(30, { message: 'Username deve ter no máximo 30 caracteres' })
      .regex(/^[a-z0-9_]+$/, {
        message: 'Apenas letras minúsculas, números e sublinhados são permitidos',
      }),
    email: z.string().trim().email({ message: 'E-mail inválido!' }),
    photoURL: z.string().nullable().optional(),
    coverURL: z.string().nullable().optional(),
    phoneNumber: z.string().trim().max(30, 'Telefone inválido'),
    cpf: z.string().trim().max(20, 'CPF inválido'),
    birthDate: z.string().trim(),
    nationality: z.string().trim().max(50),
    maritalStatus: z.string().trim(),
    rg: z.string().trim().max(30),
    rgIssuer: z.string().trim().max(30),
    cnh: z.string().trim().max(30),
    cnhCategory: z.string().trim().max(10),
    motherName: z.string().trim().max(100),
    fatherName: z.string().trim().max(100),
    country: z.string().trim().min(1, { message: 'País obrigatório!' }),
    address: z.string().trim().min(1, { message: 'Endereço obrigatório!' }),
    addressNumber: z.string().trim().max(30),
    complement: z.string().trim().max(100),
    neighborhood: z.string().trim().max(100),
    state: z.string().trim().min(1, { message: 'Estado obrigatório!' }),
    city: z.string().trim().min(1, { message: 'Cidade obrigatória!' }),
    zipCode: z.string().trim().min(1, { message: 'CEP obrigatório!' }),
    occupation: z.string().trim().max(100),
    company: z.string().trim().max(100),
    website: z.string().trim().max(200),
    about: z.string().trim().max(2000, 'Máximo de 2.000 caracteres'),
    isPublic: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Website seguro
    if (data.website && data.website.length > 0 && !isStrictValidWebsite(data.website)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['website'],
        message: 'Website deve ser uma URL absoluta válida com http:// ou https:// e domínio completo',
      });
    }

    // Telefone
    if (data.phoneNumber && data.phoneNumber.length > 0 && !isStrictValidPhone(data.phoneNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phoneNumber'],
        message: 'Telefone inválido. Informe o DDD e o número completo (10 ou 11 dígitos).',
      });
    }

    // CEP
    if (data.zipCode && data.zipCode.length > 0 && !isStrictValidCep(data.zipCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['zipCode'],
        message: 'CEP deve conter exatamente 8 dígitos numéricos no formato 00000-000.',
      });
    }

    if (data.personType === 'PF') {
      if (!data.firstName || data.firstName.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['firstName'],
          message: 'Nome é obrigatório para Pessoa Física!',
        });
      }
      if (!data.lastName || data.lastName.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lastName'],
          message: 'Sobrenome é obrigatório para Pessoa Física!',
        });
      }
      if (data.cpf && data.cpf.length > 0 && !isStrictValidCpf(data.cpf)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cpf'],
          message: 'CPF inválido. Verifique os dígitos verificadores e o formato.',
        });
      }
      if (data.birthDate && data.birthDate.length > 0 && !isStrictValidBirthDate(data.birthDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['birthDate'],
          message: 'Data de nascimento inválida, inexistente no calendário ou no futuro.',
        });
      }
    } else if (data.personType === 'PJ') {
      if (!data.companyName || data.companyName.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['companyName'],
          message: 'Razão Social / Nome da Empresa é obrigatório para Pessoa Jurídica!',
        });
      }
      if (data.cnpj && data.cnpj.length > 0 && !isStrictValidCnpj(data.cnpj)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cnpj'],
          message: 'CNPJ inválido (suporta formato numérico e alfanumérico RFB 2026).',
        });
      }
      if (
        data.legalRepresentativeCpf &&
        data.legalRepresentativeCpf.length > 0 &&
        !isStrictValidCpf(data.legalRepresentativeCpf)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legalRepresentativeCpf'],
          message: 'CPF do representante legal inválido.',
        });
      }
    }
  });

export type UpdateUserSchemaType = z.infer<typeof UpdateUserSchema>;

/**
 * Mapeador canônico único entre entidade UserAccountData e valores do formulário.
 * Elimina duplicidade de código entre defaultValues e reset pós-salvamento.
 */
export function mapUserToFormValues(user: UserAccountData): UpdateUserSchemaType {
  return {
    personType: user.personType === 'PJ' ? 'PJ' : 'PF',
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
    maritalStatus: user.maritalStatus || '',
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
  };
}

/**
 * Função pura para cálculo determinístico do escore de completude cadastral (0 a 100).
 * Calibrada com pesos exatos para PF e PJ.
 */
export function calculateIdentityCompleteness(values: Partial<UpdateUserSchemaType>): number {
  let score = 0;
  if (values.personType === 'PJ') {
    if (values.companyName && values.companyName.trim().length > 0) score += 20;
    if (isStrictValidCnpj(values.cnpj)) score += 20;
    if (values.legalRepresentative && values.legalRepresentative.trim().length > 0) score += 15;
    if (isStrictValidCpf(values.legalRepresentativeCpf)) score += 10;
    if (values.email && values.email.trim().includes('@')) score += 10;
    if (isStrictValidPhone(values.phoneNumber)) score += 5;
    if (isStrictValidCep(values.zipCode)) score += 5;
    if (values.city && values.city.trim().length > 0 && values.state && values.state.trim().length > 0)
      score += 5;
    if (values.address && values.address.trim().length > 0) score += 5;
    if (values.occupation && values.occupation.trim().length > 0) score += 5;
  } else {
    if (values.firstName && values.firstName.trim().length > 0) score += 10;
    if (values.lastName && values.lastName.trim().length > 0) score += 10;
    if (isStrictValidCpf(values.cpf)) score += 20;
    if (isStrictValidBirthDate(values.birthDate)) score += 10;
    if (
      (values.rg && values.rg.trim().length > 0) ||
      (values.cnh && values.cnh.trim().length > 0)
    )
      score += 10;
    if (values.motherName && values.motherName.trim().length > 0) score += 5;
    if (values.email && values.email.trim().includes('@')) score += 10;
    if (isStrictValidPhone(values.phoneNumber)) score += 5;
    if (isStrictValidCep(values.zipCode)) score += 5;
    if (values.city && values.city.trim().length > 0 && values.state && values.state.trim().length > 0)
      score += 5;
    if (values.address && values.address.trim().length > 0) score += 5;
    if (
      (values.occupation && values.occupation.trim().length > 0) ||
      (values.about && values.about.trim().length > 0)
    )
      score += 5;
  }

  return Math.min(score, 100);
}

export function AccountGeneral() {
  const {
    user,
    loadStatus,
    updateProfile,
    isLoading,
    isSaving,
    isVaultLocked,
    error,
    hasLoadedInitially,
    migrationStatus,
    refreshProfile,
    retryMigration,
    resolveMigrationConflict,
  } = useAccountFacade();

  const defaultValues: UpdateUserSchemaType = useMemo(() => mapUserToFormValues(user), [user]);

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

  // Proteção contra perda de digitação: Só sincroniza os defaults externos se o formulário não estiver em edição
  useEffect(() => {
    if (!isDirty) {
      reset(defaultValues);
    }
  }, [defaultValues, reset, isDirty]);

  // Monitoramento agrupado de campos para cálculo de completude de alta performance
  const [
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
  ] = useWatch({
    control,
    name: [
      'personType',
      'firstName',
      'lastName',
      'companyName',
      'cpf',
      'cnpj',
      'legalRepresentative',
      'legalRepresentativeCpf',
      'email',
      'phoneNumber',
      'zipCode',
      'city',
      'state',
      'address',
      'birthDate',
      'rg',
      'cnh',
      'motherName',
      'occupation',
      'about',
    ],
  });

  // Cálculo rigoroso do Completeness Score totalizando exatamente 100 pontos para PF e PJ
  const completenessScore = useMemo(
    () =>
      calculateIdentityCompleteness({
        personType: watchedPersonType,
        firstName: watchedFirstName,
        lastName: watchedLastName,
        companyName: watchedCompanyName,
        cpf: watchedCpf,
        cnpj: watchedCnpj,
        legalRepresentative: watchedLegalRep,
        legalRepresentativeCpf: watchedLegalRepCpf,
        email: watchedEmail,
        phoneNumber: watchedPhone,
        zipCode: watchedZip,
        city: watchedCity,
        state: watchedState,
        address: watchedAddress,
        birthDate: watchedBirthDate,
        rg: watchedRg,
        cnh: watchedCnh,
        motherName: watchedMother,
        occupation: watchedOccupation,
        about: watchedAbout,
      }),
    [
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
    ]
  );

  const canSave =
    loadStatus === 'ready' &&
    !isVaultLocked &&
    !isSaving &&
    migrationStatus !== 'conflict' &&
    migrationStatus !== 'error' &&
    isDirty;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const updatedUser = await updateProfile(data);
      // Sincroniza formulário com a entidade persistida e zera isDirty de forma centralizada
      reset(mapUserToFormValues(updatedUser));
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
          criptografia nativa. O cofre precisa estar desbloqueado pelo login
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

  // Previne a liberação de formulário vazio editável caso o backend tenha falhado
  if (loadStatus === 'error') {
    return (
      <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Iconify
          icon="solar:danger-triangle-bold"
          width={64}
          sx={{ color: 'error.main', mb: 2, mx: 'auto' }}
        />
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
          Falha na Comunicação com o Cofre Seguro
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', mb: 3, maxWidth: 520, mx: 'auto' }}
        >
          {error ||
            'Não foi possível recuperar seus dados cadastrais. Para proteger seus registros de sobrescrita acidental, a edição está temporariamente travada.'}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="solar:refresh-circle-bold" />}
          onClick={refreshProfile}
          sx={{ px: 3, py: 1, fontWeight: 700 }}
        >
          Tentar Novamente
        </Button>
      </Card>
    );
  }

  if (!hasLoadedInitially || isLoading || loadStatus === 'loading' || loadStatus === 'idle') {
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
      {/* Alerta de Divergência/Conflito de Migração */}
      {migrationStatus === 'conflict' && (
        <Alert
          severity="warning"
          sx={{ mb: 3, borderRadius: 1.5 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                color="inherit"
                size="small"
                disabled={isSaving}
                onClick={() => resolveMigrationConflict('merge_legacy')}
              >
                Mesclar Dados
              </Button>
              <Button
                color="inherit"
                size="small"
                disabled={isSaving}
                onClick={() => resolveMigrationConflict('keep_vault')}
              >
                Manter Cofre
              </Button>
            </Stack>
          }
        >
          Existem dados cadastrais no armazenamento anterior divergentes do cofre local. Seus dados
          antigos foram preservados em segurança.
        </Alert>
      )}

      {/* Alerta de Falha de Migração */}
      {migrationStatus === 'error' && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 1.5 }}
          action={
            <Button color="inherit" size="small" onClick={retryMigration}>
              Tentar Novamente
            </Button>
          }
        >
          {error ||
            'Não foi possível migrar os dados antigos com segurança para o cofre. Seus dados anteriores estão preservados e o salvamento foi travado para evitar sobrescrita acidental.'}
        </Alert>
      )}

      {error && migrationStatus !== 'error' && (
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

        {/* Legenda Dinâmica e Calibrada com os Pesos Exatos */}
        <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {watchedPersonType === 'PJ' ? (
            <>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • Razão Social (+20)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • CNPJ (+20)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • Representante (+15)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • CPF Rep. (+10)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • Email (+10)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • Endereço (+15)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • Contato & Ramo (+10)
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • Nome & Sobrenome (+20)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • CPF (+20)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • Documento Civil (+10)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • Nascimento (+10)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • Filiação (+5)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • Email (+10)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • Endereço (+15)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                • Contato & Profissão (+10)
              </Typography>
            </>
          )}
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
                <Field.Text
                  name="cpf"
                  label="CPF (Identificador Civil)"
                  placeholder="000.000.000-00"
                />
                <Field.Text
                  name="birthDate"
                  label="Data de Nascimento (AAAA-MM-DD)"
                  placeholder="Ex: 1985-05-15"
                />
                <Field.Select name="maritalStatus" label="Estado Civil">
                  {[
                    { value: '', label: 'Não informado' },
                    { value: 'Solteiro(a)', label: 'Solteiro(a)' },
                    { value: 'Casado(a)', label: 'Casado(a)' },
                    { value: 'União Estável', label: 'União Estável' },
                    { value: 'Divorciado(a)', label: 'Divorciado(a)' },
                    { value: 'Viúvo(a)', label: 'Viúvo(a)' },
                  ].map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
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
            <Field.Text
              name="phoneNumber"
              label="Telefone / WhatsApp"
              placeholder="(00) 00000-0000"
            />
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
              label={
                watchedPersonType === 'PJ'
                  ? 'Ramo de Atuação / CNAE'
                  : 'Profissão / Especialidade'
              }
            />
            <Field.Text
              name="company"
              label={watchedPersonType === 'PJ' ? 'Grupo Econômico / Filial' : 'Empresa Atual'}
            />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Field.Text
                name="website"
                label="Website Institucional ou Portfólio"
                placeholder="https://exemplo.com.br"
              />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Field.Text
                name="about"
                multiline
                rows={4}
                label={
                  watchedPersonType === 'PJ'
                    ? 'Apresentação Institucional'
                    : 'Biografia Resumida'
                }
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
            disabled={!canSave || isSubmitting}
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
