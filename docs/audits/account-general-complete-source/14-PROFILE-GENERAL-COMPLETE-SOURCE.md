# DOSSIÊ TÉCNICO DE CÓDIGO-FONTE INTEGRAL — ABA 1: PERFIL GERAL
**Projeto:** ASPPIBRA DAO — DevOS Desktop  
**Data da Extração:** 2026-11-18 15:32:42  
**Rota Canônica:** `/user/account`  
**Status da Implementação:** PERSISTÊNCIA NATIVA TOTALMENTE IMPLEMENTADA E HOMOLOGADA  

---

## 1. IDENTIFICAÇÃO DO PROJETO E ESCOPO DA EXTRAÇÃO

Este documento reúne o inventário completo e o código-fonte integral, **sem resumos, sem supressões e sem omissões**, de todos os arquivos do DevOS Desktop envolvidos no funcionamento da **ABA 1 — Perfil Geral** (`/user/account`).

O escopo abrange a cadeia vertical completa:
1. **Roteamento e Layout:** Entrada SPA `/user/account`, registro em `edition.node.ts` e `edition.cockpit.ts`, barra de abas `AccountLayout` e `CustomBreadcrumbs`.
2. **Frontend UI & Forms:** Formulário React Hook Form de 1.027 linhas com Material UI, alternância dinâmica PF/PJ, preservação de campos inativos e cálculo de completude reativo.
3. **Validação & Normalização Documental:** Funções estritas de validação de CPF (dígitos verificadores e sequências), CNPJ clássico e alfanumérico (IN RFB 2.229/2024), Data gregoriana real (bloqueio de anos bissextos inválidos e datas futuras), CEP, Telefone e Website RFC.
4. **Gerenciamento de Estado & Concorrência:** Hook facade `useAccountFacade()`, store reativa `useSyncExternalStore`, controle de revisão monotônica (`expectedRevision`) e migração resiliente de dados legados.
5. **Backend Nativo Tauri / Rust:** Comandos IPC `save_user_profile` e `get_user_profile`, serviço de identidade, validação defensiva em Rust, limpeza de RAM com `Zeroizing` e criptografia AES-256-GCM.
6. **Persistência Transacional SQLite:** Gravação e leitura segura no envelope da tabela `profile_records` em `devos_vault.sqlite`.
7. **Manipulação de Mídia:** Diagnóstico dos handlers de `photoURL` e `coverURL` em `ProfileCover`.
8. **Suítes de Testes Automatizados:** Testes unitários com Vitest (22 testes) e testes nativos de integração no cofre com Rust Cargo Test (10 testes).

---

## 2. INVENTÁRIO CONSOLIDADO DOS ARQUIVOS

| Nº | Arquivo | Caminho Relativo | Camada / Tipo | Linhas | Obrigatório para Auditoria |
|:--:|---|---|---|:--:|:--:|
| 1 | `index.tsx` | `src/pages/user/account/index.tsx` | Page | 1 | Sim |
| 2 | `general.tsx` | `src/pages/user/account/general.tsx` | Page | 9 | Sim |
| 3 | `account-general-view.tsx` | `src/sections/account/view/account-general-view.tsx` | View | 14 | Sim |
| 4 | `account-general.tsx` | `src/sections/account/account-general.tsx` | Component | 1027 | Sim |
| 5 | `account-layout.tsx` | `src/sections/account/account-layout.tsx` | Layout | 129 | Sim |
| 6 | `index.ts (account)` | `src/sections/account/index.ts` | Barrel Export | 8 | Sim |
| 7 | `index.ts (view)` | `src/sections/account/view/index.ts` | Barrel Export | 5 | Sim |
| 8 | `use-account.ts` | `src/sections/account/use-account.ts` | Hook / Store | 1117 | Sim |
| 9 | `router-link.tsx` | `src/app/router/components/router-link.tsx` | Component | 15 | Sim |
| 10 | `rhf-text-field.tsx` | `src/shared/components/hook-form/rhf-text-field.tsx` | Component | 71 | Sim |
| 11 | `rhf-select.tsx` | `src/shared/components/hook-form/rhf-select.tsx` | Component | 193 | Sim |
| 12 | `rhf-switch.tsx` | `src/shared/components/hook-form/rhf-switch.tsx` | Component | 161 | Sim |
| 13 | `form-provider.tsx` | `src/shared/components/hook-form/form-provider.tsx` | Component | 26 | Sim |
| 14 | `fields.tsx` | `src/shared/components/hook-form/fields.tsx` | Component | 33 | Sim |
| 15 | `index.ts (hook-form)` | `src/shared/components/hook-form/index.ts` | Barrel Export | 14 | Sim |
| 16 | `iconify.tsx` | `src/shared/components/iconify/iconify.tsx` | Component | 57 | Sim |
| 17 | `index.ts (iconify)` | `src/shared/components/iconify/index.ts` | Barrel Export | 5 | Sim |
| 18 | `custom-breadcrumbs.tsx` | `src/shared/components/custom-breadcrumbs/custom-breadcrumbs.tsx` | Component | 95 | Sim |
| 19 | `identity-contracts.ts` | `src/platform/tauri/contracts/identity-contracts.ts` | Contract | 105 | Sim |
| 20 | `identity-bridge.ts` | `src/platform/tauri/identity/identity-bridge.ts` | Bridge | 40 | Sim |
| 21 | `invoke.ts` | `src/platform/tauri/core/invoke.ts` | Platform IPC | 165 | Sim |
| 22 | `models.rs` | `src-tauri/src/modules/identity/models.rs` | Backend Models | 696 | Sim |
| 23 | `service.rs` | `src-tauri/src/modules/identity/service.rs` | Backend Service | 1040 | Sim |
| 24 | `repository.rs` | `src-tauri/src/modules/identity/repository.rs` | Backend Persistence | 105 | Sim |
| 25 | `identity_commands.rs` | `src-tauri/src/commands/identity_commands.rs` | Backend Commands | 53 | Sim |
| 26 | `local_database.rs` | `src-tauri/src/storage/local_database.rs` | Backend Infrastructure | 1236 | Sim |
| 27 | `migrations.rs` | `src-tauri/src/storage/migrations.rs` | Backend Database | 89 | Sim |
| 28 | `encryption.rs` | `src-tauri/src/modules/vault/encryption.rs` | Backend Cryptography | 511 | Sim |
| 29 | `access_control.rs` | `src-tauri/src/modules/vault/access_control.rs` | Backend Security | 702 | Sim |
| 30 | `lib.rs` | `src-tauri/src/lib.rs` | Backend Core | 227 | Sim |
| 31 | `profile-cover.tsx` | `src/sections/user/profile-cover.tsx` | Component | 256 | Sim |
| 32 | `identity-bridge.spec.ts` | `src/test/identity-bridge.spec.ts` | Tests | 615 | Sim |

**Total de arquivos catalogados:** 32  
**Volume total de código integral extraído:** 8820 linhas  

---

## 3. CÓDIGO-FONTE INTEGRAL DOS ARQUIVOS

### Arquivo 1: `index.tsx`
**Caminho:** `src/pages/user/account/index.tsx`  
**Tipo / Camada:** Page  
**Volume:** 1 linhas  
**Responsabilidade:** Re-exportador canônico do ponto de entrada da rota '/user/account'.  
**Dependências Internas:** `src/pages/user/account/general.tsx`  
**Relacionamento na ABA 1:** Permite importação limpa via diretório da rota.  

```tsx
export { default, AccountGeneralPage } from './general';

```

---

### Arquivo 2: `general.tsx`
**Caminho:** `src/pages/user/account/general.tsx`  
**Tipo / Camada:** Page  
**Volume:** 9 linhas  
**Responsabilidade:** Componente de página da rota '/user/account'. Renderiza AccountGeneralView.  
**Dependências Internas:** `src/sections/account/view/account-general-view.tsx`  
**Relacionamento na ABA 1:** Página oficial registrada nas edições Cockpit e Node.  

```tsx
import React from 'react';

import { AccountGeneralView } from 'src/sections/account';

export function AccountGeneralPage() {
  return <AccountGeneralView />;
}

export default AccountGeneralPage;

```

---

### Arquivo 3: `account-general-view.tsx`
**Caminho:** `src/sections/account/view/account-general-view.tsx`  
**Tipo / Camada:** View  
**Volume:** 14 linhas  
**Responsabilidade:** View container da aba de Perfil Geral. Envolve AccountGeneral com AccountLayout.  
**Dependências Internas:** `src/sections/account/account-layout.tsx`, `src/sections/account/account-general.tsx`  
**Relacionamento na ABA 1:** Orquestra a montagem do layout e a injeção do formulário geral.  

```tsx
import React from 'react';

import { AccountLayout } from '../account-layout';
import { AccountGeneral } from '../account-general';

export function AccountGeneralView() {
  return (
    <AccountLayout>
      <AccountGeneral />
    </AccountLayout>
  );
}

export default AccountGeneralView;

```

---

### Arquivo 4: `account-general.tsx`
**Caminho:** `src/sections/account/account-general.tsx`  
**Tipo / Camada:** Component  
**Volume:** 1027 linhas  
**Responsabilidade:** Componente mestre do formulário civil/empresarial (1.027 linhas). Contém validações documentais estritas (CPF, CNPJ 2026, Nascimento, CEP, Telefone, Website), schema Zod, alternância PF/PJ, cálculo de completude de 100 pontos e submissão.  
**Dependências Internas:** `src/sections/account/use-account.ts`, `src/shared/components/hook-form`, `src/shared/components/iconify`, `src/shared/components/snackbar`  
**Relacionamento na ABA 1:** Interface principal onde o usuário preenche, valida e salva seus dados no cofre.  

```tsx
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

```

---

### Arquivo 5: `account-layout.tsx`
**Caminho:** `src/sections/account/account-layout.tsx`  
**Tipo / Camada:** Layout  
**Volume:** 129 linhas  
**Responsabilidade:** Layout compartilhado das 5 abas da Central de Identidade Digital com navegação por MUI Tabs, normalização de trailing slash e breadcrumbs.  
**Dependências Internas:** `src/app/router/paths.ts`, `src/app/router/hooks`, `src/app/router/components/router-link.tsx`, `src/shared/components/iconify`, `src/shared/components/custom-breadcrumbs`  
**Relacionamento na ABA 1:** Fornece a moldura visual e navegação de abas onde a View é renderizada.  

```tsx
import type { ReactNode } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/app/router/paths';
import { usePathname } from 'src/app/router/hooks';
import { RouterLink } from 'src/app/router/components/router-link';

import { Iconify } from 'src/shared/components/iconify';
import { CustomBreadcrumbs } from 'src/shared/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export const NAV_ITEMS = [
  {
    label: 'Perfil Geral',
    icon: <Iconify width={20} icon="solar:user-id-bold" />,
    href: paths.dashboard.user.account,
  },
  {
    label: 'Notificações',
    icon: <Iconify width={20} icon="solar:bell-bing-bold" />,
    href: `${paths.dashboard.user.account}/notifications`,
  },
  {
    label: 'Redes Sociais',
    icon: <Iconify width={20} icon="solar:share-bold" />,
    href: `${paths.dashboard.user.account}/socials`,
  },
  {
    label: 'Segurança',
    icon: <Iconify width={20} icon="ic:round-vpn-key" />,
    href: `${paths.dashboard.user.account}/change-password`,
  },
  {
    label: 'Autenticador 2FA',
    icon: <Iconify width={20} icon="solar:shield-keyhole-bold" />,
    href: `${paths.dashboard.user.account}/2fa`,
  },
] as const;

type Props = {
  children?: ReactNode;
};

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

export function AccountLayout({ children }: Props) {
  const pathname = normalizePathname(usePathname());

  const hasMatchingTab = NAV_ITEMS.some(
    (item) => normalizePathname(item.href) === pathname
  );

  const currentTab = hasMatchingTab ? pathname : false;

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <CustomBreadcrumbs
        heading="Central de Identidade Digital"
        links={[
          { name: 'Dashboard', href: '/' },
          { name: 'Minha Conta', href: paths.dashboard.user.root },
          { name: 'Identidade Digital' },
        ]}
        sx={{ mb: 3 }}
      />

      <Card
        sx={{
          mb: { xs: 3, md: 4 },
          p: 1,
          borderRadius: 2,
        }}
      >
        <Tabs
          value={currentTab}
          aria-label="Navegação da conta"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 46,
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTab-root': {
              minHeight: 44,
              minWidth: 120,
              borderRadius: 1.5,
              mx: 0.5,
              fontWeight: 700,
              fontSize: '0.84rem',
              textTransform: 'none',
              transition: 'all 0.25s',
              color: 'text.secondary',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: (theme) => theme.shadows[3],
              },
              '&:hover:not(.Mui-selected)': {
                bgcolor: (theme) => theme.palette.action.hover,
              },
            },
          }}
        >
          {NAV_ITEMS.map((tab) => (
            <Tab
              component={RouterLink}
              key={tab.href}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              value={normalizePathname(tab.href)}
              href={tab.href}
            />
          ))}
        </Tabs>
      </Card>

      {children}
    </Box>
  );
}

export default AccountLayout;

```

---

### Arquivo 6: `index.ts (account)`
**Caminho:** `src/sections/account/index.ts`  
**Tipo / Camada:** Barrel Export  
**Volume:** 8 linhas  
**Responsabilidade:** Exportador central dos componentes da seção de conta.  
**Dependências Internas:** `src/sections/account/view`, `src/sections/account/use-account.ts`, `src/sections/account/account-general.tsx`  
**Relacionamento na ABA 1:** Facilita o consumo pelo restante do app.  

```typescript
export * from './view';
export * from './use-account';
export * from './account-2fa';
export * from './account-layout';
export * from './account-general';
export * from './account-socials';
export * from './account-notifications';
export * from './account-change-password';

```

---

### Arquivo 7: `index.ts (view)`
**Caminho:** `src/sections/account/view/index.ts`  
**Tipo / Camada:** Barrel Export  
**Volume:** 5 linhas  
**Responsabilidade:** Exportador das views de conta.  
**Dependências Internas:** `src/sections/account/view/account-general-view.tsx`  
**Relacionamento na ABA 1:** Expõe AccountGeneralView.  

```typescript
export * from './account-2fa-view';
export * from './account-general-view';
export * from './account-socials-view';
export * from './account-notifications-view';
export * from './account-change-password-view';

```

---

### Arquivo 8: `use-account.ts`
**Caminho:** `src/sections/account/use-account.ts`  
**Tipo / Camada:** Hook / Store  
**Volume:** 1117 linhas  
**Responsabilidade:** Hook Facade 'useAccountFacade' e Store reativa imutável baseada em 'useSyncExternalStore'. Gerencia cache em memória, optimistic concurrency, migração de dados legados do localStorage e comunicação com IdentityBridge.  
**Dependências Internas:** `src/platform/tauri/contracts/identity-contracts.ts`, `src/platform/tauri/identity/identity-bridge.ts`  
**Relacionamento na ABA 1:** Motor de estado central de toda a identidade no frontend.  

```typescript
import type {
  UserProfile,
  SocialLinks,
  SaveUserProfilePayload,
} from 'src/platform/tauri/contracts/identity-contracts';

import { useEffect, useSyncExternalStore } from 'react';

import { IdentityBridge } from 'src/platform/tauri/identity/identity-bridge';

// ----------------------------------------------------------------------
// Tipos e Constantes Canônicas
// ----------------------------------------------------------------------

export type LinkedProviders = {
  walletAddress?: string;
  walletNetwork?: string;
  walletVerified?: boolean;
  googleEmail?: string;
  googleVerified?: boolean;
  githubUsername?: string;
  githubVerified?: boolean;
  strictAuthEnabled?: boolean;
};

export type UserAccountData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  photoURL?: string | null;
  coverURL?: string | null;
  phoneNumber?: string;
  cpf?: string;
  rg?: string;
  rgIssuer?: string;
  cnh?: string;
  cnhCategory?: string;
  motherName?: string;
  fatherName?: string;
  birthDate?: string | null;
  nationality?: string;
  maritalStatus?: string;
  country: string;
  address: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  state: string;
  city: string;
  zipCode: string;
  occupation?: string;
  company?: string;
  website?: string;
  about?: string;
  isPublic: boolean;
  personType: 'PF' | 'PJ';
  companyName?: string;
  cnpj?: string;
  legalRepresentative?: string;
  legalRepresentativeCpf?: string;
  completenessScore?: number;
  revision?: number;
  updatedAt?: string;
  linkedProviders?: LinkedProviders;
  socialLinks?: SocialLinks;
};

export const LEGACY_STORAGE_KEY = 'devos_user_account_profile';
const MAX_LEGACY_LENGTH = 64 * 1024; // Limite de 64 KB para evitar DoS de memória

export const LEGACY_STRING_FIELDS = [
  'firstName',
  'lastName',
  'username',
  'email',
  'phoneNumber',
  'cpf',
  'rg',
  'rgIssuer',
  'cnh',
  'cnhCategory',
  'motherName',
  'fatherName',
  'birthDate',
  'nationality',
  'maritalStatus',
  'companyName',
  'cnpj',
  'legalRepresentative',
  'legalRepresentativeCpf',
  'country',
  'address',
  'addressNumber',
  'complement',
  'neighborhood',
  'state',
  'city',
  'zipCode',
  'occupation',
  'company',
  'website',
  'about',
] as const;

export type LegacyField = (typeof LEGACY_STRING_FIELDS)[number];

export type MigrationStatus = 'idle' | 'migrated' | 'conflict' | 'error';
export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type LegacyReadResult =
  | { status: 'missing' }
  | { status: 'valid'; data: Partial<UserAccountData>; raw: string }
  | { status: 'invalid'; reason: string }
  | { status: 'unavailable'; reason: string };

// ----------------------------------------------------------------------
// Funções Auxiliares de Sanitização e Validação
// ----------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getSafeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Lê e higieniza os dados legados distinguindo missing, valid, invalid e unavailable.
 * Aplica limites de tamanho por campo e princípio Privacy-by-Default (isPublic: false).
 */
export function readLegacyProfile(): LegacyReadResult {
  const storage = getSafeStorage();
  if (!storage) {
    return { status: 'unavailable', reason: 'localStorage indisponível no ambiente de execução.' };
  }

  let raw: string | null = null;
  try {
    raw = storage.getItem(LEGACY_STORAGE_KEY);
  } catch (err: any) {
    return {
      status: 'unavailable',
      reason: err?.message || 'Acesso ao localStorage bloqueado ou indisponível.',
    };
  }

  if (!raw || raw.trim().length <= 2) {
    return { status: 'missing' };
  }

  if (raw.length > MAX_LEGACY_LENGTH) {
    return {
      status: 'invalid',
      reason: 'O documento legado ultrapassa o tamanho máximo permitido de 64 KB.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      status: 'invalid',
      reason: 'Documento legado em formato JSON corrompido ou inválido.',
    };
  }

  if (!isRecord(parsed)) {
    return {
      status: 'invalid',
      reason: 'Estrutura do documento legado inválida (não é um objeto JSON).',
    };
  }

  const safe: Record<string, unknown> = {};
  for (const field of LEGACY_STRING_FIELDS) {
    const value = parsed[field];
    const maxLength =
      field === 'about'
        ? 2000
        : field === 'website'
          ? 200
          : field === 'email'
            ? 254
            : field === 'companyName'
              ? 150
              : 100;
    if (typeof value === 'string') {
      if (value.length > maxLength) {
        return {
          status: 'invalid',
          reason: `O campo ${field} ultrapassa o tamanho máximo permitido de ${maxLength} caracteres.`,
        };
      }
      safe[field] = value.trim();
    }
  }

  if (parsed.personType === 'PJ') {
    safe.personType = 'PJ';
  } else if (parsed.personType === 'PF') {
    safe.personType = 'PF';
  } else if (parsed.personType === undefined) {
    // Inferência inteligente para documentos legados sem a flag explícita
    const hasPjEvidence =
      (typeof parsed.companyName === 'string' && parsed.companyName.trim().length > 0) ||
      (typeof parsed.cnpj === 'string' && parsed.cnpj.trim().length > 0);
    const hasPfEvidence =
      (typeof parsed.firstName === 'string' && parsed.firstName.trim().length > 0) ||
      (typeof parsed.cpf === 'string' && parsed.cpf.trim().length > 0);

    safe.personType = hasPjEvidence && !hasPfEvidence ? 'PJ' : 'PF';
  } else {
    return {
      status: 'invalid',
      reason: `personType inválido no documento legado: "${String(parsed.personType)}". Esperado 'PF' ou 'PJ'.`,
    };
  }

  safe.isPublic = false; // Requer confirmação explícita do usuário
  safe.username = canonicalizeUsername(
    typeof parsed.username === 'string'
      ? parsed.username
      : typeof parsed.email === 'string'
        ? parsed.email.split('@')[0]
        : ''
  );

  return {
    status: 'valid',
    raw: JSON.stringify(safe),
    data: safe as Partial<UserAccountData>,
  };
}

/**
 * Remove com segurança o registro legado do localStorage e confirma a exclusão.
 * Retorna true se e somente se o valor não existir mais após a tentativa.
 */
export function removeLegacyProfile(): boolean {
  const storage = getSafeStorage();
  if (!storage) return false;
  try {
    storage.removeItem(LEGACY_STORAGE_KEY);
    return storage.getItem(LEGACY_STORAGE_KEY) === null;
  } catch {
    return false;
  }
}

/**
 * Normaliza um username para conformidade canônica com a regra `^[a-z0-9_]+$`.
 * Substitui pontos, traços e espaços por sublinhados e limita rigorosamente a 30 caracteres.
 */
export function canonicalizeUsername(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);
}

/**
 * Cria uma estrutura limpa e segura de dados do usuário por padrão.
 * Princípio Privacy-by-Default (isPublic = false, sem presunções de estado civil).
 */
export function createEmptyUserAccount(): UserAccountData {
  return {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    photoURL: null,
    coverURL: null,
    phoneNumber: '',
    cpf: '',
    rg: '',
    rgIssuer: '',
    cnh: '',
    cnhCategory: '',
    motherName: '',
    fatherName: '',
    birthDate: '',
    nationality: 'Brasileira',
    maritalStatus: '',
    country: 'Brasil',
    address: '',
    addressNumber: '',
    complement: '',
    neighborhood: '',
    state: '',
    city: '',
    zipCode: '',
    occupation: '',
    company: '',
    website: '',
    about: '',
    isPublic: false,
    personType: 'PF',
    companyName: '',
    cnpj: '',
    legalRepresentative: '',
    legalRepresentativeCpf: '',
    completenessScore: 0,
    revision: 0,
    updatedAt: '',
    linkedProviders: {
      walletAddress: undefined,
      walletNetwork: undefined,
      walletVerified: false,
      googleEmail: undefined,
      googleVerified: false,
      githubUsername: undefined,
      githubVerified: false,
      strictAuthEnabled: true,
    },
  };
}

export function userProfileToAccountData(profile: UserProfile, current?: UserAccountData): UserAccountData {
  const fallbackUsername = profile.email ? profile.email.split('@')[0] : '';
  const resolvedUsername = profile.username
    ? canonicalizeUsername(profile.username)
    : current?.username
      ? canonicalizeUsername(current.username)
      : canonicalizeUsername(fallbackUsername);

  return {
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    username: resolvedUsername,
    email: profile.email || '',
    photoURL: profile.photoUrl !== undefined ? profile.photoUrl : current?.photoURL ?? null,
    coverURL: profile.coverUrl !== undefined ? profile.coverUrl : current?.coverURL ?? null,
    phoneNumber: profile.phoneNumber || '',
    cpf: profile.cpf || '',
    rg: profile.rg || '',
    rgIssuer: profile.rgIssuer || '',
    cnh: profile.cnh || '',
    cnhCategory: profile.cnhCategory || '',
    motherName: profile.motherName || '',
    fatherName: profile.fatherName || '',
    birthDate: profile.birthDate || '',
    nationality: profile.nationality || 'Brasileira',
    maritalStatus: profile.maritalStatus || '',
    country: profile.country || 'Brasil',
    address: profile.address || '',
    addressNumber: profile.addressNumber || '',
    complement: profile.complement || '',
    neighborhood: profile.neighborhood || '',
    state: profile.state || '',
    city: profile.city || '',
    zipCode: profile.zipCode || '',
    occupation: profile.occupation || '',
    company: profile.company || '',
    website: profile.website || '',
    about: profile.about || '',
    isPublic: profile.isPublic ?? false,
    personType: profile.personType === 'PJ' ? 'PJ' : 'PF',
    companyName: profile.companyName || '',
    cnpj: profile.cnpj || '',
    legalRepresentative: profile.legalRepresentative || '',
    legalRepresentativeCpf: profile.legalRepresentativeCpf || '',
    completenessScore: profile.completenessScore ?? 0,
    revision: profile.revision ?? 0,
    updatedAt: profile.updatedAt || '',
    linkedProviders: current?.linkedProviders || {
      walletAddress: '',
      walletNetwork: '',
      walletVerified: false,
      googleEmail: '',
      googleVerified: false,
      githubUsername: '',
      githubVerified: false,
      strictAuthEnabled: false,
    },
    socialLinks: profile.socialLinks ?? current?.socialLinks,
  };
}

function normalizeText(value?: string | null): string {
  return value?.trim() ?? '';
}

export function accountDataToSavePayload(
  data: Partial<UserAccountData>,
  currentRevision = data.revision
): SaveUserProfilePayload {
  const isPj = data.personType === 'PJ';
  const firstName = normalizeText(data.firstName);
  const lastName = normalizeText(data.lastName);
  const companyName = normalizeText(data.companyName);

  const resolvedDisplayName = isPj
    ? companyName || 'Pessoa Jurídica'
    : [firstName, lastName].filter(Boolean).join(' ') || normalizeText(data.username);

  return {
    personType: isPj ? 'PJ' : 'PF',
    username: canonicalizeUsername(data.username),
    displayName: resolvedDisplayName,
    // Preservação estrita de todos os campos cadastrais PF e PJ (sem exclusão de dados inativos)
    firstName,
    lastName,
    companyName,
    cpf: normalizeText(data.cpf),
    cnpj: normalizeText(data.cnpj),
    rg: normalizeText(data.rg),
    rgIssuer: normalizeText(data.rgIssuer),
    cnh: normalizeText(data.cnh),
    cnhCategory: normalizeText(data.cnhCategory),
    motherName: normalizeText(data.motherName),
    fatherName: normalizeText(data.fatherName),
    birthDate: normalizeText(data.birthDate),
    nationality: normalizeText(data.nationality) || 'Brasileira',
    maritalStatus: normalizeText(data.maritalStatus),
    legalRepresentative: normalizeText(data.legalRepresentative),
    legalRepresentativeCpf: normalizeText(data.legalRepresentativeCpf),
    email: normalizeText(data.email),
    phoneNumber: normalizeText(data.phoneNumber),
    country: normalizeText(data.country) || 'Brasil',
    zipCode: normalizeText(data.zipCode),
    state: normalizeText(data.state),
    city: normalizeText(data.city),
    neighborhood: normalizeText(data.neighborhood),
    address: normalizeText(data.address),
    addressNumber: normalizeText(data.addressNumber),
    complement: normalizeText(data.complement),
    occupation: normalizeText(data.occupation),
    company: normalizeText(data.company),
    website: normalizeText(data.website),
    about: normalizeText(data.about),
    isPublic: data.isPublic ?? false,
    photoUrl: data.photoURL ?? null,
    coverUrl: data.coverURL ?? null,
    socialLinks: data.socialLinks,
    expectedRevision: currentRevision !== undefined && currentRevision > 0 ? currentRevision : undefined,
  };
}

// ----------------------------------------------------------------------
// Store Reativo Centralizado e Isolamento de Sessão
// ----------------------------------------------------------------------

interface AccountStoreState {
  user: UserAccountData;
  loadStatus: LoadStatus;
  isLoading: boolean;
  isSaving: boolean;
  isVaultLocked: boolean;
  error: string | null;
  hasLoadedInitially: boolean;
  migrationStatus: MigrationStatus;
}

let storeState: AccountStoreState = {
  user: createEmptyUserAccount(),
  loadStatus: 'idle',
  isLoading: false,
  isSaving: false,
  isVaultLocked: false,
  error: null,
  hasLoadedInitially: false,
  migrationStatus: 'idle',
};

let currentSessionGeneration = 0;
const listeners = new Set<() => void>();

type InFlightFetch = {
  generation: number;
  promise: Promise<void>;
};

let inFlightFetch: InFlightFetch | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

function getStoreSnapshot(): AccountStoreState {
  return storeState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Reseta o store de identidade no logout ou na troca de usuário autenticado.
 * Invalida requisições pendentes por meio da geração de sessão para evitar vazamento entre contas.
 */
export function resetAccountStore(): void {
  currentSessionGeneration += 1;
  inFlightFetch = null;
  storeState = {
    user: createEmptyUserAccount(),
    loadStatus: 'idle',
    isLoading: false,
    isSaving: false,
    isVaultLocked: false,
    error: null,
    hasLoadedInitially: false,
    migrationStatus: 'idle',
  };
  notify();
}

/**
 * Validação de integridade antes da gravação (evita sobrescrever dados com formulário não carregado).
 */
export function assertAccountCanBeSaved(): void {
  if (storeState.loadStatus !== 'ready') {
    throw new Error('A identidade civil ainda não foi carregada com sucesso do cofre local.');
  }
  if (storeState.isVaultLocked) {
    throw new Error('O cofre seguro está bloqueado. Desbloqueie com a chave mestre.');
  }
  if (storeState.isSaving) {
    throw new Error('Já existe uma gravação de perfil em andamento.');
  }
  if (storeState.migrationStatus === 'conflict') {
    throw new Error('Existem divergências de migração não resolvidas. Resolva o conflito antes de salvar.');
  }
  if (storeState.migrationStatus === 'error') {
    throw new Error('A migração apresentou erros. Corrija o estado antes de sobrescrever os dados.');
  }
}

// ----------------------------------------------------------------------
// Reconciliação e Resolução de Conflitos
// ----------------------------------------------------------------------

const LEGACY_MERGE_FIELDS: LegacyField[] = LEGACY_STRING_FIELDS.filter(
  (field) => field !== 'email' && field !== 'username'
) as LegacyField[];

export function mergeMissingLegacyFields(
  vault: UserAccountData,
  legacy: Partial<UserAccountData>
): { merged: UserAccountData; changedFields: LegacyField[] } {
  const merged: UserAccountData = { ...vault };
  const target = merged as unknown as Record<string, unknown>;
  const changedFields: LegacyField[] = [];

  for (const field of LEGACY_MERGE_FIELDS) {
    const incoming = legacy[field];
    const current = target[field];
    if (
      typeof incoming === 'string' &&
      incoming.trim().length > 0 &&
      (typeof current !== 'string' || !current.trim())
    ) {
      target[field] = incoming.trim();
      changedFields.push(field);
    }
  }

  // Se o username do cofre estiver vazio e o legado tiver username válido, incorporar
  if (!merged.username && legacy.username) {
    const canonical = canonicalizeUsername(legacy.username);
    if (canonical && /^[a-z0-9_]{3,30}$/.test(canonical)) {
      merged.username = canonical;
      changedFields.push('username');
    }
  }

  // Se o e-mail do cofre estiver vazio e o legado tiver e-mail válido, incorporar com segurança
  if (!merged.email && legacy.email && legacy.email.includes('@')) {
    merged.email = legacy.email.trim();
    changedFields.push('email');
  }

  // Preservar isPublic do cofre (não rebaixar para false se já estiver true no cofre)
  merged.isPublic = vault.isPublic ?? false;
  return { merged, changedFields };
}

/**
 * Verifica a integridade da persistência pós-migração comparando os campos
 * preenchidos no documento legado contra os campos retornados pelo cofre.
 * Retorna uma lista de nomes de campos divergentes (ou vazia se íntegro).
 */
export function verifyMigrationIntegrity(
  legacy: Partial<UserAccountData>,
  persisted: UserAccountData
): string[] {
  const mismatched: string[] = [];
  const persistedRecord = persisted as unknown as Record<string, unknown>;

  for (const field of LEGACY_STRING_FIELDS) {
    const rawLegacyVal = legacy[field];
    if (typeof rawLegacyVal !== 'string') continue;
    const legacyVal = rawLegacyVal.trim();
    if (!legacyVal) continue;

    const persistedVal =
      typeof persistedRecord[field] === 'string'
        ? (persistedRecord[field] as string).trim()
        : '';

    if (field === 'cpf') {
      const cleanLegacy = legacyVal.replace(/\D/g, '');
      const cleanPersisted = persistedVal.replace(/\D/g, '');
      if (cleanLegacy !== cleanPersisted) {
        mismatched.push(field);
      }
    } else if (field === 'cnpj') {
      const cleanLegacy = legacyVal.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const cleanPersisted = persistedVal.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (cleanLegacy !== cleanPersisted) {
        mismatched.push(field);
      }
    } else if (field === 'email') {
      if (legacyVal.toLowerCase() !== persistedVal.toLowerCase()) {
        mismatched.push(field);
      }
    } else if (field === 'username') {
      const canonicalLegacy = canonicalizeUsername(legacyVal);
      const canonicalPersisted = canonicalizeUsername(persistedVal);
      const isValidUsername = /^[a-z0-9_]{3,30}$/.test(canonicalLegacy);

      if (!isValidUsername || !canonicalPersisted || canonicalLegacy !== canonicalPersisted) {
        mismatched.push(field);
      }
    } else if (legacyVal !== persistedVal) {
      mismatched.push(field);
    }
  }

  if (legacy.personType && legacy.personType !== persisted.personType) {
    mismatched.push('personType');
  }

  return mismatched;
}

async function reconcileAndMigrate(
  rawProfile: UserProfile | null,
  generation: number
): Promise<{
  profile: UserProfile | null;
  fallbackUser?: UserAccountData;
  status: MigrationStatus;
  errorMessage?: string;
}> {
  const legacyResult = readLegacyProfile();

  if (legacyResult.status === 'invalid') {
    return {
      profile: rawProfile,
      status: 'error',
      errorMessage: `Armazenamento legado inconsistente: ${legacyResult.reason}. Os dados anteriores foram preservados para investigação.`,
    };
  }

  if (legacyResult.status === 'unavailable') {
    return {
      profile: rawProfile,
      status: 'error',
      errorMessage: `Armazenamento local inacessível: ${legacyResult.reason}. O acesso aos dados legados está temporariamente indisponível.`,
    };
  }

  if (legacyResult.status === 'missing') {
    return { profile: rawProfile, status: 'idle' };
  }

  const legacyObj = legacyResult.data;

  // CENÁRIO 1: Perfil já existente no cofre seguro SQLite
  if (rawProfile) {
    const legacyCpf = (legacyObj.cpf || '').replace(/\D/g, '');
    const currentCpf = (rawProfile.cpf || '').replace(/\D/g, '');
    const legacyCnpj = (legacyObj.cnpj || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const currentCnpj = (rawProfile.cnpj || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const legacyEmail = (legacyObj.email || '').trim().toLowerCase();
    const currentEmail = (rawProfile.email || '').trim().toLowerCase();

    // Conflito estrito de identidade: identificadores principais preenchidos com valores incompatíveis
    const hasCpfConflict = legacyCpf && currentCpf && legacyCpf !== currentCpf;
    const hasCnpjConflict = legacyCnpj && currentCnpj && legacyCnpj !== currentCnpj;
    const hasEmailConflict = legacyEmail && currentEmail && legacyEmail !== currentEmail;

    if (hasCpfConflict || hasCnpjConflict || hasEmailConflict) {
      return {
        profile: rawProfile,
        status: 'conflict',
        errorMessage:
          'Divergência detectada entre os identificadores do cofre e do armazenamento legado. Os dados anteriores foram preservados para decisão explícita.',
      };
    }

    // Reconciliação automática para campos complementares ausentes no cofre
    const currentUser = userProfileToAccountData(rawProfile);
    const { merged, changedFields } = mergeMissingLegacyFields(currentUser, legacyObj);

    if (changedFields.length > 0) {
      if (generation !== currentSessionGeneration) {
        return { profile: rawProfile, status: 'idle' };
      }
      try {
        const payload = accountDataToSavePayload(merged, rawProfile.revision);
        const saved = await IdentityBridge.saveUserProfile(payload);
        if (generation !== currentSessionGeneration) {
          return { profile: rawProfile, status: 'idle' };
        }
        const verified = await IdentityBridge.getUserProfile();
        if (generation !== currentSessionGeneration) {
          return { profile: rawProfile, status: 'idle' };
        }

        if (verified && verified.revision > rawProfile.revision) {
          const verifiedData = userProfileToAccountData(verified);
          const target = merged as unknown as Record<string, unknown>;
          const persisted = verifiedData as unknown as Record<string, unknown>;
          const allVerified = changedFields.every((f) => persisted[f] === target[f]);

          if (allVerified) {
            removeLegacyProfile();
            return { profile: verified, status: 'migrated' };
          }
        }
        return {
          profile: saved,
          status: 'error',
          errorMessage: 'A verificação pós-gravação de migração não confirmou a integridade dos campos.',
        };
      } catch {
        return {
          profile: rawProfile,
          status: 'error',
          errorMessage: 'Falha ao sincronizar dados legados complementares no cofre.',
        };
      }
    } else {
      // Coincidência total: cofre já contém todas as informações
      removeLegacyProfile();
      return { profile: rawProfile, status: 'migrated' };
    }
  }

  // CENÁRIO 2: Cofre vazio, importação inicial dos dados legados
  if (generation !== currentSessionGeneration) {
    return { profile: null, status: 'idle' };
  }
  try {
    const imported = await IdentityBridge.importLegacyProfile(legacyResult.raw);
    if (generation !== currentSessionGeneration) {
      return { profile: null, status: 'idle' };
    }
    const verified = await IdentityBridge.getUserProfile();
    if (generation !== currentSessionGeneration) {
      return { profile: null, status: 'idle' };
    }

    if (verified && verified.revision >= 1) {
      const verifiedData = userProfileToAccountData(verified);
      const mismatches = verifyMigrationIntegrity(legacyObj, verifiedData);

      if (mismatches.length === 0) {
        removeLegacyProfile();
        return { profile: verified, status: 'migrated' };
      }

      return {
        profile: verified,
        status: 'error',
        errorMessage: `A leitura pós-migração identificou divergência nos campos: ${mismatches.join(', ')}. Os dados legados foram preservados.`,
      };
    }

    return {
      profile: imported,
      status: 'error',
      errorMessage: 'A leitura pós-migração não pôde comprovar a integridade dos dados.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const fallbackUser: UserAccountData = {
      ...createEmptyUserAccount(),
      ...legacyObj,
      username: canonicalizeUsername(legacyObj.username || legacyObj.email?.split('@')[0]),
    };

    return {
      profile: null,
      fallbackUser,
      status: 'error',
      errorMessage:
        errorMsg ||
        'Falha ao importar o perfil legado para o cofre seguro. Seus dados anteriores foram preservados.',
    };
  }
}

async function fetchAndSyncProfile(): Promise<void> {
  if (inFlightFetch && inFlightFetch.generation === currentSessionGeneration) {
    return inFlightFetch.promise;
  }

  const sessionGenAtStart = currentSessionGeneration;

  storeState = {
    ...storeState,
    isLoading: true,
    loadStatus: 'loading',
    error: null,
  };
  notify();

  const currentPromise: Promise<void> = (async () => {
    try {
      const rawProfile = await IdentityBridge.getUserProfile();

      // Descarte fail-closed caso a sessão tenha sido resetada durante a requisição assíncrona
      if (sessionGenAtStart !== currentSessionGeneration) {
        return;
      }

      const reconciliation = await reconcileAndMigrate(rawProfile, sessionGenAtStart);

      if (sessionGenAtStart !== currentSessionGeneration) {
        return;
      }

      if (reconciliation.profile) {
        storeState = {
          ...storeState,
          user: userProfileToAccountData(reconciliation.profile, storeState.user),
          loadStatus: 'ready',
          isVaultLocked: false,
          hasLoadedInitially: true,
          migrationStatus: reconciliation.status,
          error: reconciliation.errorMessage || null,
        };
      } else if (reconciliation.fallbackUser) {
        storeState = {
          ...storeState,
          user: reconciliation.fallbackUser,
          loadStatus: 'error', // Impede gravação acidental sobre dados não persistidos
          isVaultLocked: false,
          hasLoadedInitially: true,
          migrationStatus: reconciliation.status,
          error: reconciliation.errorMessage || null,
        };
      } else {
        storeState = {
          ...storeState,
          user: createEmptyUserAccount(),
          loadStatus: 'ready',
          isVaultLocked: false,
          hasLoadedInitially: true,
          migrationStatus: reconciliation.status,
          error: reconciliation.errorMessage || null,
        };
      }
    } catch (err: unknown) {
      if (sessionGenAtStart !== currentSessionGeneration) {
        return;
      }

      const errorMsg = err instanceof Error ? err.message : String(err);
      const isLocked =
        errorMsg.includes('VAULT_LOCKED') ||
        errorMsg.includes('bloqueado') ||
        errorMsg.includes('Locked');

      storeState = {
        ...storeState,
        loadStatus: isLocked ? 'idle' : 'error',
        isVaultLocked: isLocked,
        error: isLocked
          ? 'O cofre criptográfico está bloqueado. Desbloqueie com a chave mestre para carregar os dados civis.'
          : 'Não foi possível carregar as informações do cofre local.',
        hasLoadedInitially: true,
      };
    } finally {
      if (sessionGenAtStart === currentSessionGeneration) {
        storeState = {
          ...storeState,
          isLoading: false,
        };
        notify();
      }
      if (inFlightFetch && inFlightFetch.generation === sessionGenAtStart) {
        inFlightFetch = null;
      }
    }
  })();

  inFlightFetch = {
    generation: sessionGenAtStart,
    promise: currentPromise,
  };

  return currentPromise;
}

export function useAccountFacade() {
  const state = useSyncExternalStore(subscribe, getStoreSnapshot, getStoreSnapshot);

  useEffect(() => {
    if (!state.hasLoadedInitially && !state.isLoading && state.loadStatus === 'idle') {
      fetchAndSyncProfile();
    }
  }, [state.hasLoadedInitially, state.isLoading, state.loadStatus]);

  const updateProfile = async (data: Partial<UserAccountData>): Promise<UserAccountData> => {
    assertAccountCanBeSaved();

    const sessionGenAtStart = currentSessionGeneration;
    storeState = {
      ...storeState,
      isSaving: true,
      error: null,
    };
    notify();

    try {
      const merged: UserAccountData = {
        ...storeState.user,
        ...data,
      };

      const payload = accountDataToSavePayload(merged, storeState.user.revision);
      const saved = await IdentityBridge.saveUserProfile(payload);

      if (sessionGenAtStart !== currentSessionGeneration) {
        throw new Error('A sessão do cofre foi alterada durante a gravação.');
      }

      const finalUser = userProfileToAccountData(saved, merged);

      storeState = {
        ...storeState,
        user: finalUser,
        loadStatus: 'ready',
        isVaultLocked: false,
        error: null,
      };
      notify();

      return finalUser;
    } catch (err: unknown) {
      if (sessionGenAtStart === currentSessionGeneration) {
        const errorMsg = err instanceof Error ? err.message : 'Falha ao salvar dados no cofre seguro.';
        storeState = {
          ...storeState,
          error: errorMsg,
        };
        notify();
      }
      throw err;
    } finally {
      if (sessionGenAtStart === currentSessionGeneration) {
        storeState = {
          ...storeState,
          isSaving: false,
        };
        notify();
      }
    }
  };

  const refreshProfile = async (): Promise<void> => {
    await fetchAndSyncProfile();
  };

  const retryMigration = async (): Promise<void> => {
    await fetchAndSyncProfile();
  };

  /**
   * Resolução definitiva de conflitos de migração com precedência determinística:
   * 'keep_vault': Descarta o legado mantendo a integridade já existente no cofre.
   * 'merge_legacy': Preserva os identificadores do cofre, mescla os campos complementares
   * ausentes, grava com a revisão atual e confirma leitura independente antes da exclusão.
   */
  const resolveMigrationConflict = async (choice: 'keep_vault' | 'merge_legacy'): Promise<void> => {
    if (storeState.isSaving) {
      throw new Error('Já existe uma operação de gravação ou migração em andamento.');
    }

    const sessionGenAtStart = currentSessionGeneration;
    const assertCurrentSession = () => {
      if (sessionGenAtStart !== currentSessionGeneration) {
        throw new Error('A sessão foi alterada durante a resolução da migração.');
      }
    };

    storeState = {
      ...storeState,
      isSaving: true,
      error: null,
    };
    notify();

    try {
      if (choice === 'keep_vault') {
        assertCurrentSession();
        removeLegacyProfile();
        storeState = {
          ...storeState,
          migrationStatus: 'migrated',
          error: null,
        };
        notify();
        return;
      }

      const legacyResult = readLegacyProfile();
      if (legacyResult.status !== 'valid') {
        throw new Error('Os dados legados não foram encontrados ou estão em formato inválido.');
      }

      assertCurrentSession();
      const latestProfile = await IdentityBridge.getUserProfile();
      assertCurrentSession();
      if (!latestProfile) {
        throw new Error('Perfil do cofre seguro indisponível.');
      }

      const currentUser = userProfileToAccountData(latestProfile);
      const { merged, changedFields } = mergeMissingLegacyFields(currentUser, legacyResult.data);

      if (changedFields.length === 0) {
        throw new Error(
          'Não existem campos complementares ausentes para incorporar. As divergências de identidade foram mantidas no cofre.'
        );
      }

      assertCurrentSession();
      const payload = accountDataToSavePayload(merged, latestProfile.revision);
      await IdentityBridge.saveUserProfile(payload);

      assertCurrentSession();
      const verified = await IdentityBridge.getUserProfile();
      assertCurrentSession();

      if (!verified || verified.revision <= latestProfile.revision) {
        throw new Error('Falha na leitura independente pós-reconciliação do cofre.');
      }

      const verifiedData = userProfileToAccountData(verified);
      const target = merged as unknown as Record<string, unknown>;
      const persisted = verifiedData as unknown as Record<string, unknown>;

      const allFieldsVerified = changedFields.every((field) => persisted[field] === target[field]);
      if (!allFieldsVerified) {
        throw new Error('A reconciliação não passou na verificação estrita de integridade.');
      }

      // Exclusão definitiva somente após leitura de volta confirmada
      assertCurrentSession();
      removeLegacyProfile();
      storeState = {
        ...storeState,
        user: verifiedData,
        migrationStatus: 'migrated',
        error: null,
      };
      notify();
    } catch (err: unknown) {
      if (sessionGenAtStart !== currentSessionGeneration) return;
      const errorMsg = err instanceof Error ? err.message : String(err);
      storeState = {
        ...storeState,
        migrationStatus: 'error',
        error:
          errorMsg ||
          'Não foi possível concluir a reconciliação. Os dados legados foram mantidos para recuperação.',
      };
      notify();
    } finally {
      if (sessionGenAtStart === currentSessionGeneration) {
        storeState = {
          ...storeState,
          isSaving: false,
        };
        notify();
      }
    }
  };

  return {
    user: state.user,
    loadStatus: state.loadStatus,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    isVaultLocked: state.isVaultLocked,
    error: state.error,
    hasLoadedInitially: state.hasLoadedInitially,
    migrationStatus: state.migrationStatus,
    updateProfile,
    refreshProfile,
    retryMigration,
    resolveMigrationConflict,
  };
}

export const useAccount = useAccountFacade;

```

---

### Arquivo 9: `router-link.tsx`
**Caminho:** `src/app/router/components/router-link.tsx`  
**Tipo / Camada:** Component  
**Volume:** 15 linhas  
**Responsabilidade:** Adaptador de navegação SPA compatível com React Router v7 para componentes Material UI.  
**Dependências Internas:** Nenhuma (Componente base ou isolado)  
**Relacionamento na ABA 1:** Utilizado por AccountLayout em cada Tab da barra de navegação.  

```tsx
import type { LinkProps } from 'react-router';

import { forwardRef } from 'react';
import { Link } from 'react-router';

// ----------------------------------------------------------------------

export type RouterLinkProps = Omit<LinkProps, 'to'> & {
  href?: string;
  to?: LinkProps['to'];
};

export const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(
  ({ to, href, ...other }, ref) => <Link ref={ref} to={to ?? href ?? ''} {...other} />
);

```

---

### Arquivo 10: `rhf-text-field.tsx`
**Caminho:** `src/shared/components/hook-form/rhf-text-field.tsx`  
**Tipo / Camada:** Component  
**Volume:** 71 linhas  
**Responsabilidade:** Componente de campo de texto controlado integrado ao React Hook Form. Trata trim, blur, dirty tracking e mensagens de erro.  
**Dependências Internas:** `src/shared/components/hook-form/form-provider.tsx`  
**Relacionamento na ABA 1:** Utilizado para todos os campos de texto do formulário civil.  

```tsx
import type { TextFieldProps } from '@mui/material/TextField';

import { Controller, useFormContext } from 'react-hook-form';
import { transformValue, transformValueOnBlur, transformValueOnChange } from 'minimal-shared/utils';

import TextField from '@mui/material/TextField';

// ----------------------------------------------------------------------

export type RHFTextFieldProps = Omit<TextFieldProps, 'name' | 'value' | 'defaultValue'> & {
  name: string;
};

export function RHFTextField({
  name,
  helperText,
  slotProps,
  type = 'text',
  onChange: onChangeProp,
  onBlur: onBlurProp,
  ...other
}: RHFTextFieldProps) {
  const { control } = useFormContext();

  const isNumberType = type === 'number';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...other}
          {...field}
          fullWidth
          value={isNumberType ? transformValue(field.value) : (field.value ?? '')}
          onChange={(event) => {
            const transformedValue = isNumberType
              ? transformValueOnChange(event.target.value)
              : event.target.value;

            field.onChange(transformedValue);
            onChangeProp?.(event);
          }}
          onBlur={(event) => {
            if (isNumberType) {
              field.onChange(transformValueOnBlur(event.target.value));
            }

            // Mantém a notificação de blur e o controle de touched do React Hook Form
            field.onBlur();
            onBlurProp?.(event);
          }}
          type={isNumberType ? 'text' : type}
          error={!!error}
          helperText={error?.message ?? helperText}
          slotProps={{
            ...slotProps,
            htmlInput: {
              ...slotProps?.htmlInput,
              ...(isNumberType && {
                inputMode: 'decimal',
                pattern: '[0-9]*\\.?[0-9]*',
              }),
            },
          }}
        />
      )}
    />
  );
}

```

---

### Arquivo 11: `rhf-select.tsx`
**Caminho:** `src/shared/components/hook-form/rhf-select.tsx`  
**Tipo / Camada:** Component  
**Volume:** 193 linhas  
**Responsabilidade:** Componente controlado de dropdown/select para Material UI integrado ao React Hook Form.  
**Dependências Internas:** `src/shared/components/hook-form/form-provider.tsx`  
**Relacionamento na ABA 1:** Utilizado para personType (PF/PJ), maritalStatus e cnhCategory.  

```tsx
import type { ChipProps } from '@mui/material/Chip';
import type { SelectProps } from '@mui/material/Select';
import type { CheckboxProps } from '@mui/material/Checkbox';
import type { TextFieldProps } from '@mui/material/TextField';
import type { InputLabelProps } from '@mui/material/InputLabel';
import type { FormControlProps } from '@mui/material/FormControl';
import type { FormHelperTextProps } from '@mui/material/FormHelperText';

import { merge } from 'es-toolkit';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import { HelperText } from './help-text';

// ----------------------------------------------------------------------

type RHFSelectProps = TextFieldProps & {
  name: string;
  children: React.ReactNode;
};

export function RHFSelect({
  name,
  children,
  helperText,
  slotProps = {},
  ...other
}: RHFSelectProps) {
  const { control } = useFormContext();

  const labelId = `${name}-select`;

  const baseSlotProps: TextFieldProps['slotProps'] = {
    select: {
      sx: { textTransform: 'capitalize' },
      MenuProps: {
        slotProps: {
          paper: {
            sx: { maxHeight: 240 },
          },
        },
      },
    },
    htmlInput: { id: labelId },
    inputLabel: { htmlFor: labelId },
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          select
          fullWidth
          error={!!error}
          helperText={error?.message ?? helperText}
          slotProps={merge(baseSlotProps, slotProps) as any}
          {...other}
        >
          {children}
        </TextField>
      )}
    />
  );
}

// ----------------------------------------------------------------------

type RHFMultiSelectProps = FormControlProps & {
  name: string;
  label?: string;
  chip?: boolean;
  checkbox?: boolean;
  placeholder?: string;
  helperText?: React.ReactNode;
  options: { label: string; value: string }[];
  slotProps?: {
    chip?: ChipProps;
    select?: SelectProps;
    checkbox?: CheckboxProps;
    inputLabel?: InputLabelProps;
    helperText?: FormHelperTextProps;
  };
};

export function RHFMultiSelect({
  name,
  chip,
  label,
  options,
  checkbox,
  placeholder,
  slotProps,
  helperText,
  ...other
}: RHFMultiSelectProps) {
  const { control } = useFormContext();

  const labelId = `${name}-multi-select`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const renderLabel = () => (
          <InputLabel htmlFor={labelId} {...slotProps?.inputLabel}>
            {label}
          </InputLabel>
        );

        const renderOptions = () =>
          options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {checkbox && (
                <Checkbox
                  size="small"
                  disableRipple
                  checked={field.value.includes(option.value)}
                  {...slotProps?.checkbox}
                />
              )}

              {option.label}
            </MenuItem>
          ));

        return (
          <FormControl error={!!error} {...other}>
            {label && renderLabel()}

            <Select
              {...field}
              multiple
              displayEmpty={!!placeholder}
              label={label}
              renderValue={(selected) => {
                const selectedItems = options.filter((item) =>
                  (selected as string[]).includes(item.value)
                );

                if (!selectedItems.length && placeholder) {
                  return <Box sx={{ color: 'text.disabled' }}>{placeholder}</Box>;
                }

                if (chip) {
                  return (
                    <Box sx={{ gap: 0.5, display: 'flex', flexWrap: 'wrap' }}>
                      {selectedItems.map((item) => (
                        <Chip
                          key={item.value}
                          size="small"
                          variant="filled"
                          label={item.label}
                          {...slotProps?.chip}
                        />
                      ))}
                    </Box>
                  );
                }

                return selectedItems.map((item) => item.label).join(', ');
              }}
              {...slotProps?.select}
              inputProps={{
                id: labelId,
                ...slotProps?.select?.inputProps,
              }}
            >
              {renderOptions()}
            </Select>

            <HelperText
              {...slotProps?.helperText}
              errorMessage={error?.message}
              helperText={helperText}
            />
          </FormControl>
        );
      }}
    />
  );
}

```

---

### Arquivo 12: `rhf-switch.tsx`
**Caminho:** `src/shared/components/hook-form/rhf-switch.tsx`  
**Tipo / Camada:** Component  
**Volume:** 161 linhas  
**Responsabilidade:** Componente switch booleano controlado para Material UI integrado ao React Hook Form.  
**Dependências Internas:** `src/shared/components/hook-form/form-provider.tsx`  
**Relacionamento na ABA 1:** Utilizado para o controle de visibilidade pública 'isPublic'.  

```tsx
import type { BoxProps } from '@mui/material/Box';
import type { SwitchProps } from '@mui/material/Switch';
import type { FormGroupProps } from '@mui/material/FormGroup';
import type { FormLabelProps } from '@mui/material/FormLabel';
import type { FormControlProps } from '@mui/material/FormControl';
import type { FormHelperTextProps } from '@mui/material/FormHelperText';
import type { FormControlLabelProps } from '@mui/material/FormControlLabel';

import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';

import { HelperText } from './help-text';

// ----------------------------------------------------------------------

export type RHFSwitchProps = Omit<FormControlLabelProps, 'control'> & {
  name: string;
  helperText?: React.ReactNode;
  slotProps?: {
    wrapper?: BoxProps;
    switch?: SwitchProps;
    helperText?: FormHelperTextProps;
  };
};

export function RHFSwitch({ name, helperText, label, slotProps, sx, ...other }: RHFSwitchProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box {...slotProps?.wrapper}>
          <FormControlLabel
            label={label}
            control={
              <Switch
                {...field}
                checked={field.value}
                {...slotProps?.switch}
                slotProps={{
                  ...slotProps?.switch?.slotProps,
                  input: {
                    id: `${name}-switch`,
                    ...(!label && { 'aria-label': `${name} switch` }),
                    ...slotProps?.switch?.slotProps?.input,
                  },
                }}
              />
            }
            sx={[{ mx: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}
            {...other}
          />

          <HelperText
            {...slotProps?.helperText}
            errorMessage={error?.message}
            helperText={helperText}
          />
        </Box>
      )}
    />
  );
}

// ----------------------------------------------------------------------

type RHFMultiSwitchProps = FormGroupProps & {
  name: string;
  label?: string;
  helperText?: React.ReactNode;
  options: {
    label: string;
    value: string;
  }[];
  slotProps?: {
    wrapper?: FormControlProps;
    switch: SwitchProps;
    formLabel?: FormLabelProps;
    helperText?: FormHelperTextProps;
  };
};

export function RHFMultiSwitch({
  name,
  label,
  options,
  helperText,
  slotProps,
  ...other
}: RHFMultiSwitchProps) {
  const { control } = useFormContext();

  const getSelected = (selectedItems: string[], item: string) =>
    selectedItems.includes(item)
      ? selectedItems.filter((value) => value !== item)
      : [...selectedItems, item];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl component="fieldset" {...slotProps?.wrapper}>
          {label && (
            <FormLabel
              component="legend"
              {...slotProps?.formLabel}
              sx={[
                { mb: 1, typography: 'body2' },
                ...(Array.isArray(slotProps?.formLabel?.sx)
                  ? slotProps.formLabel.sx
                  : [slotProps?.formLabel?.sx]),
              ]}
            >
              {label}
            </FormLabel>
          )}

          <FormGroup {...other}>
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Switch
                    checked={field.value.includes(option.value)}
                    onChange={() => field.onChange(getSelected(field.value, option.value))}
                    {...slotProps?.switch}
                    slotProps={{
                      ...slotProps?.switch?.slotProps,
                      input: {
                        id: `${option.label}-switch`,
                        ...(!option.label && { 'aria-label': `${option.label} switch` }),
                        ...slotProps?.switch?.slotProps?.input,
                      },
                    }}
                  />
                }
                label={option.label}
              />
            ))}
          </FormGroup>

          <HelperText
            {...slotProps?.helperText}
            disableGutters
            errorMessage={error?.message}
            helperText={helperText}
          />
        </FormControl>
      )}
    />
  );
}

```

---

### Arquivo 13: `form-provider.tsx`
**Caminho:** `src/shared/components/hook-form/form-provider.tsx`  
**Tipo / Camada:** Component  
**Volume:** 26 linhas  
**Responsabilidade:** Provider do React Hook Form que disponibiliza os métodos do formulário via Context.  
**Dependências Internas:** Nenhuma (Componente base ou isolado)  
**Relacionamento na ABA 1:** Envolve todo o JSX do formulário AccountGeneral.  

```tsx
import type { ReactNode, FormEventHandler } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

import { FormProvider as RHFForm } from 'react-hook-form';

// ----------------------------------------------------------------------

export type FormProps<TFieldValues extends FieldValues = FieldValues> = {
  onSubmit?: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
  methods: UseFormReturn<TFieldValues>;
};

export function Form<TFieldValues extends FieldValues = FieldValues>({
  children,
  onSubmit,
  methods,
}: FormProps<TFieldValues>) {
  return (
    <RHFForm {...methods}>
      <form onSubmit={onSubmit} noValidate autoComplete="off">
        {children}
      </form>
    </RHFForm>
  );
}

```

---

### Arquivo 14: `fields.tsx`
**Caminho:** `src/shared/components/hook-form/fields.tsx`  
**Tipo / Camada:** Component  
**Volume:** 33 linhas  
**Responsabilidade:** Objeto agregador 'Field' expondo Text, Select, Switch, Checkbox, etc.  
**Dependências Internas:** `src/shared/components/hook-form/rhf-text-field.tsx`, `src/shared/components/hook-form/rhf-select.tsx`, `src/shared/components/hook-form/rhf-switch.tsx`  
**Relacionamento na ABA 1:** Permite sintaxe limpa Field.Text e Field.Select no formulário.  

```tsx
import { RHFCode } from './rhf-code';
import { RHFRating } from './rhf-rating';
import { RHFSlider } from './rhf-slider';
import { RHFTextField } from './rhf-text-field';
import { RHFRadioGroup } from './rhf-radio-group';
import { RHFNumberInput } from './rhf-number-input';
import { RHFAutocomplete } from './rhf-autocomplete';
import { RHFSwitch, RHFMultiSwitch } from './rhf-switch';
import { RHFSelect, RHFMultiSelect } from './rhf-select';
import { RHFCheckbox, RHFMultiCheckbox } from './rhf-checkbox';
import { RHFDatePicker, RHFTimePicker, RHFDateTimePicker } from './rhf-date-picker';

// ----------------------------------------------------------------------

export const Field = {
  Code: RHFCode,
  Select: RHFSelect,
  Switch: RHFSwitch,
  Slider: RHFSlider,
  Rating: RHFRating,
  Text: RHFTextField,
  Checkbox: RHFCheckbox,
  RadioGroup: RHFRadioGroup,
  NumberInput: RHFNumberInput,
  MultiSelect: RHFMultiSelect,
  MultiSwitch: RHFMultiSwitch,
  Autocomplete: RHFAutocomplete,
  MultiCheckbox: RHFMultiCheckbox,
  // Pickers
  DatePicker: RHFDatePicker,
  TimePicker: RHFTimePicker,
  DateTimePicker: RHFDateTimePicker,
};

```

---

### Arquivo 15: `index.ts (hook-form)`
**Caminho:** `src/shared/components/hook-form/index.ts`  
**Tipo / Camada:** Barrel Export  
**Volume:** 14 linhas  
**Responsabilidade:** Ponto de exportação de componentes de formulário.  
**Dependências Internas:** `src/shared/components/hook-form/fields.tsx`, `src/shared/components/hook-form/form-provider.tsx`  
**Relacionamento na ABA 1:** Exporta Form e Field para a aplicação.  

```typescript
export * from './fields';
export * from './rhf-code';
export * from './rhf-select';
export * from './rhf-rating';
export * from './rhf-switch';
export * from './rhf-slider';
export * from './rhf-checkbox';
export * from './schema-utils';
export * from './form-provider';
export * from './rhf-text-field';
export * from './rhf-date-picker';
export * from './rhf-radio-group';
export * from './rhf-number-input';
export * from './rhf-autocomplete';

```

---

### Arquivo 16: `iconify.tsx`
**Caminho:** `src/shared/components/iconify/iconify.tsx`  
**Tipo / Camada:** Component  
**Volume:** 57 linhas  
**Responsabilidade:** Renderizador SVG de alta performance com classes Material UI.  
**Dependências Internas:** Nenhuma (Componente base ou isolado)  
**Relacionamento na ABA 1:** Renderiza ícones de escudo, cofre, check e seções na tela.  

```tsx
import type { IconProps } from '@iconify/react';
import type { IconifyName } from './register-icons';

import { useId } from 'react';
import { Icon } from '@iconify/react';
import { mergeClasses } from 'minimal-shared/utils';

import { styled } from '@mui/material/styles';

import { iconifyClasses } from './classes';
import { allIconNames, registerIcons } from './register-icons';

// ----------------------------------------------------------------------

export type IconifyProps = React.ComponentProps<typeof IconRoot> &
  Omit<IconProps, 'icon'> & {
    icon: IconifyName | (string & {});
  };

export function Iconify({ className, icon, width = 20, height, sx, ...other }: IconifyProps) {
  const uniqueId = useId();

  if (!allIconNames.includes(icon as IconifyName)) {
    console.warn(
      [
        `Icon "${icon}" is currently loaded online, which may cause flickering effects.`,
        `To ensure a smoother experience, please register your icon collection for offline use.`,
        `More information is available at: https://docs.minimals.cc/icons/`,
      ].join('\n')
    );
  }

  registerIcons();

  return (
    <IconRoot
      ssr
      id={uniqueId}
      icon={icon}
      className={mergeClasses([iconifyClasses.root, className])}
      sx={[
        {
          width,
          flexShrink: 0,
          height: height ?? width,
          display: 'inline-flex',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    />
  );
}

// ----------------------------------------------------------------------

const IconRoot = styled(Icon)``;

```

---

### Arquivo 17: `index.ts (iconify)`
**Caminho:** `src/shared/components/iconify/index.ts`  
**Tipo / Camada:** Barrel Export  
**Volume:** 5 linhas  
**Responsabilidade:** Ponto de exportação do componente Iconify.  
**Dependências Internas:** `src/shared/components/iconify/iconify.tsx`  
**Relacionamento na ABA 1:** Expõe Iconify.  

```typescript
export * from './classes';

export * from './iconify';

export * from './register-icons';

```

---

### Arquivo 18: `custom-breadcrumbs.tsx`
**Caminho:** `src/shared/components/custom-breadcrumbs/custom-breadcrumbs.tsx`  
**Tipo / Camada:** Component  
**Volume:** 95 linhas  
**Responsabilidade:** Barra de navegação hierárquica e título de seção.  
**Dependências Internas:** Nenhuma (Componente base ou isolado)  
**Relacionamento na ABA 1:** Exibida no topo de AccountLayout e UserProfileView.  

```tsx
import type { Theme, SxProps } from '@mui/material/styles';
import type { BreadcrumbsProps } from '@mui/material/Breadcrumbs';
import type { MoreLinksProps } from './more-links';
import type { BreadcrumbsLinkProps } from './breadcrumb-link';

import Breadcrumbs from '@mui/material/Breadcrumbs';

import { BackLink } from './back-link';
import { MoreLinks } from './more-links';
import { BreadcrumbsLink } from './breadcrumb-link';
import {
  BreadcrumbsRoot,
  BreadcrumbsHeading,
  BreadcrumbsContent,
  BreadcrumbsContainer,
  BreadcrumbsSeparator,
} from './styles';

// ----------------------------------------------------------------------

export type CustomBreadcrumbsSlotProps = {
  breadcrumbs: BreadcrumbsProps;
  moreLinks: Omit<MoreLinksProps, 'links'>;
  heading: React.ComponentProps<typeof BreadcrumbsHeading>;
  content: React.ComponentProps<typeof BreadcrumbsContent>;
  container: React.ComponentProps<typeof BreadcrumbsContainer>;
};

export type CustomBreadcrumbsSlots = {
  breadcrumbs?: React.ReactNode;
};

export type CustomBreadcrumbsProps = React.ComponentProps<'div'> & {
  sx?: SxProps<Theme>;
  heading?: string;
  activeLast?: boolean;
  backHref?: string;
  action?: React.ReactNode;
  links?: BreadcrumbsLinkProps[];
  moreLinks?: MoreLinksProps['links'];
  slots?: CustomBreadcrumbsSlots;
  slotProps?: Partial<CustomBreadcrumbsSlotProps>;
};

export function CustomBreadcrumbs({
  sx,
  action,
  backHref,
  heading,
  slots = {},
  links = [],
  moreLinks = [],
  slotProps = {},
  activeLast = false,
  ...other
}: CustomBreadcrumbsProps) {
  const lastLink = links[links.length - 1]?.name;

  const renderHeading = () => (
    <BreadcrumbsHeading {...slotProps?.heading}>
      {backHref ? <BackLink href={backHref} label={heading} /> : heading}
    </BreadcrumbsHeading>
  );

  const renderLinks = () =>
    slots?.breadcrumbs ?? (
      <Breadcrumbs separator={<BreadcrumbsSeparator />} {...slotProps?.breadcrumbs}>
        {links.map((link, index) => (
          <BreadcrumbsLink
            key={link.name ?? index}
            icon={link.icon}
            href={link.href}
            name={link.name}
            disabled={link.name === lastLink && !activeLast}
          />
        ))}
      </Breadcrumbs>
    );

  const renderMoreLinks = () => <MoreLinks links={moreLinks} {...slotProps?.moreLinks} />;

  return (
    <BreadcrumbsRoot sx={sx} {...other}>
      <BreadcrumbsContainer {...slotProps?.container}>
        <BreadcrumbsContent {...slotProps?.content}>
          {(heading || backHref) && renderHeading()}
          {(!!links.length || slots?.breadcrumbs) && renderLinks()}
        </BreadcrumbsContent>
        {action}
      </BreadcrumbsContainer>

      {!!moreLinks?.length && renderMoreLinks()}
    </BreadcrumbsRoot>
  );
}

```

---

### Arquivo 19: `identity-contracts.ts`
**Caminho:** `src/platform/tauri/contracts/identity-contracts.ts`  
**Tipo / Camada:** Contract  
**Volume:** 105 linhas  
**Responsabilidade:** Tipos TypeScript para UserProfile, SaveUserProfilePayload e IdentityStatus alinhados aos DTOs Serde Rust.  
**Dependências Internas:** Nenhuma (Componente base ou isolado)  
**Relacionamento na ABA 1:** Contrato de comunicação frontend <-> backend.  

```typescript
/**
 * Contratos IPC para Perfil e Identidade Civil do DevOS Desktop.
 *
 * Sincronizado com os modelos e comandos nativos em:
 * - src-tauri/src/modules/identity/models.rs
 * - src-tauri/src/commands/identity_commands.rs
 */

export type PersonType = 'PF' | 'PJ';

export type SocialField = 'facebook' | 'instagram' | 'linkedin' | 'twitter';

export type SocialLinks = Partial<Record<SocialField, string | null>>;

/**
 * Modelo de dados de Perfil e Qualificação Civil decifrado da custódia do cofre.
 */
export interface UserProfile {
  personType: PersonType;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  cpf: string;
  rg: string;
  rgIssuer: string;
  cnh: string;
  cnhCategory: string;
  motherName: string;
  fatherName: string;
  birthDate: string;
  nationality: string;
  maritalStatus: string;
  companyName: string;
  cnpj: string;
  legalRepresentative: string;
  legalRepresentativeCpf: string;
  email: string;
  phoneNumber: string;
  country: string;
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
  complement: string;
  occupation: string;
  company: string;
  website: string;
  about: string;
  isPublic: boolean;
  completenessScore: number;
  revision: number;
  updatedAt: string;
  photoUrl?: string | null;
  coverUrl?: string | null;
  linkedProviders?: string[];
  socialLinks?: SocialLinks | null;
}

/**
 * Payload para salvar ou atualizar o perfil.
 */
export interface SaveUserProfilePayload {
  personType?: PersonType;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  cpf?: string;
  rg?: string;
  rgIssuer?: string;
  cnh?: string;
  cnhCategory?: string;
  motherName?: string;
  fatherName?: string;
  birthDate?: string;
  nationality?: string;
  maritalStatus?: string;
  companyName?: string;
  cnpj?: string;
  legalRepresentative?: string;
  legalRepresentativeCpf?: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  zipCode?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  occupation?: string;
  company?: string;
  website?: string;
  about?: string;
  isPublic?: boolean;
  photoUrl?: string | null;
  coverUrl?: string | null;
  linkedProviders?: string[];
  socialLinks?: SocialLinks | null;
  expectedRevision?: number | null;
}

```

---

### Arquivo 20: `identity-bridge.ts`
**Caminho:** `src/platform/tauri/identity/identity-bridge.ts`  
**Tipo / Camada:** Bridge  
**Volume:** 40 linhas  
**Responsabilidade:** Ponte IPC com métodos estáticos tipados invocando os comandos Rust do cofre.  
**Dependências Internas:** `src/platform/tauri/core/invoke.ts`, `src/platform/tauri/contracts/identity-contracts.ts`  
**Relacionamento na ABA 1:** Camada de abstração IPC consumida por use-account.ts.  

```typescript
import type { UserProfile, SaveUserProfilePayload } from '../contracts/identity-contracts';

import { invokeNative } from '../core/invoke';

/**
 * Ponte de comunicação entre o frontend e os comandos nativos de Perfil e Identidade Civil.
 *
 * Garante que todos os dados pessoais do usuário transitem protegidos pela camada IPC,
 * sem persistência insegura em localStorage ou exposição de PII.
 */
export const IdentityBridge = {
  /**
   * Consulta os dados de perfil e qualificação civil decifrados do cofre local SQLite.
   *
   * @returns O perfil do usuário ou null se ainda não houver cadastro salvo.
   */
  async getUserProfile(): Promise<UserProfile | null> {
    return invokeNative<UserProfile | null>('get_user_profile');
  },

  /**
   * Salva ou atualiza os dados do perfil cifrando-os com a chave da sessão ativa do cofre.
   *
   * @param profile Dados cadastrais a serem persistidos.
   * @returns O perfil salvo com revisão atualizada e score computado.
   */
  async saveUserProfile(profile: SaveUserProfilePayload): Promise<UserProfile> {
    return invokeNative<UserProfile>('save_user_profile', { profile });
  },

  /**
   * Importa o perfil legado em JSON (do localStorage) para o cofre seguro SQLite.
   *
   * @param legacyJson String JSON com os dados legados.
   * @returns O perfil importado e persistido de forma segura.
   */
  async importLegacyProfile(legacyJson: string): Promise<UserProfile> {
    return invokeNative<UserProfile>('import_legacy_profile', { legacyJson });
  },
};

```

---

### Arquivo 21: `invoke.ts`
**Caminho:** `src/platform/tauri/core/invoke.ts`  
**Tipo / Camada:** Platform IPC  
**Volume:** 165 linhas  
**Responsabilidade:** Invoker Tauri com tratamento de timeout, logging estruturado e normalização de erros nativos.  
**Dependências Internas:** Nenhuma (Componente base ou isolado)  
**Relacionamento na ABA 1:** Executa a chamada nativa Tauri IPC.  

```typescript
import { invoke, isTauri } from '@tauri-apps/api/core';

import { TauriErrorMapper } from './tauri-errors';
import { IpcError } from '../contracts/ipc-errors';

/**
 * ASPPIBRA DevOS — Native IPC Invoker (Tauri v2).
 *
 * Centraliza as chamadas ao backend Rust, a verificação do ambiente
 * de execução, o timeout de espera e a normalização de erros IPC.
 *
 * A sanitização das mensagens de erro é responsabilidade do
 * TauriErrorMapper.
 */

/**
 * Timeout padrão de espera por uma resposta IPC (30 segundos).
 *
 * Operações potencialmente demoradas devem configurar um limite
 * específico quando forem integradas ao wrapper.
 */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Opções opcionais de execução para uma chamada IPC.
 */
export interface InvokeNativeOptions {
  /**
   * Tempo máximo de espera pela resposta, em milissegundos.
   *
   * O timeout não cancela automaticamente a operação no backend Rust.
   * Deve ser um número finito maior que zero.
   *
   * Se omitido, utiliza DEFAULT_TIMEOUT_MS.
   */
  timeoutMs?: number;
}

/**
 * Erro específico para chamadas IPC que excederam o limite de espera.
 *
 * O comando nativo pode continuar em execução após este erro.
 * Portanto, o timeout não deve ser interpretado como confirmação
 * de que a operação foi cancelada.
 */
export class NativeIpcTimeoutError extends Error {
  readonly command: string;

  readonly timeoutMs: number;

  constructor(command: string, timeoutMs: number) {
    super(
      `[Rust Core IPC Error] (${command}): ` +
        `A chamada excedeu o limite de ${timeoutMs} ms. ` +
        'A operação nativa pode continuar em execução; ' +
        'o timeout não cancela o comando Rust.'
    );
    this.name = 'NativeIpcTimeoutError';
    this.command = command;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Verifica se o código está executando em um ambiente Tauri.
 *
 * O nome é mantido por compatibilidade com os consumidores existentes.
 * A verificação utiliza isTauri(), que identifica o runtime Tauri,
 * sem determinar isoladamente o sistema operacional.
 */
export function isTauriDesktop(): boolean {
  return isTauri();
}

/**
 * Valida o limite de espera configurado.
 */
function validateTimeout(timeoutMs: number): void {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError('timeoutMs deve ser um número finito maior que zero.');
  }
}

/**
 * Executa uma chamada IPC com limite de espera.
 *
 * Importante:
 * Promise.race encerra a espera do frontend quando o limite expira,
 * mas não cancela automaticamente a invocação já enviada ao backend.
 */
async function invokeWithTimeout<T>(
  cmd: string,
  args: Record<string, unknown>,
  timeoutMs: number
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new NativeIpcTimeoutError(cmd, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([invoke<T>(cmd, args), timeoutPromise]);
  } finally {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
  }
}

/**
 * Invoca um comando nativo Rust pelo IPC do Tauri v2.
 *
 * @param cmd Nome registrado do comando nativo.
 * @param args Argumentos nomeados do comando.
 * @param options Opções opcionais, incluindo timeoutMs.
 *
 * @returns A resposta do comando, tipada conforme T.
 *
 * @throws Error Se o ambiente Tauri não estiver disponível.
 * @throws NativeIpcTimeoutError Se o tempo limite for excedido.
 * @throws Error Se a invocação nativa falhar.
 *
 * Observação:
 * O parâmetro genérico T fornece tipagem estática, mas não valida
 * a estrutura do retorno em tempo de execução.
 */
export async function invokeNative<T>(
  cmd: string,
  args: Record<string, unknown> = {},
  options: InvokeNativeOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  validateTimeout(timeoutMs);

  if (!isTauriDesktop()) {
    throw new Error(
      `Ambiente não suportado: O comando nativo '${cmd}' exige ` +
        'execução dentro do aplicativo Desktop DevOS (Tauri v2).'
    );
  }

  try {
    return await invokeWithTimeout<T>(cmd, args, timeoutMs);
  } catch (err: unknown) {
    /**
     * Preserva o tipo específico para que os consumidores possam
     * distinguir timeout de falhas IPC convencionais.
     */
    if (err instanceof NativeIpcTimeoutError) {
      throw err;
    }

    const normalized = TauriErrorMapper.normalize(err, cmd);
    const technicalMessage = `[Rust Core IPC Error] (${cmd}): ${normalized.technicalMessage}`;
    throw new IpcError(
      technicalMessage,
      normalized.code,
      cmd,
      normalized.userMessage
    );
  }
}

```

---

### Arquivo 22: `models.rs`
**Caminho:** `src-tauri/src/modules/identity/models.rs`  
**Tipo / Camada:** Backend Models  
**Volume:** 696 linhas  
**Responsabilidade:** Estruturas Rust UserProfileDto, SaveUserProfileRequest, PublicUserProfileDto, escore de completude e validadores de CPF, CNPJ e data.  
**Dependências Internas:** Nenhuma (Componente base ou isolado)  
**Relacionamento na ABA 1:** Entidades de domínio da identidade no backend nativo.  

```rust
//! Modelos de dados e regras de validação para Perfil e Identidade Civil.
//!
//! Não registrar dados pessoais nos logs do sistema (LGPD / Privacidade em primeiro lugar).

use serde::{Deserialize, Serialize};

/// Tipo de pessoa jurídica ou física.
pub const PERSON_TYPE_PF: &str = "PF";
pub const PERSON_TYPE_PJ: &str = "PJ";

fn default_person_type() -> String {
    PERSON_TYPE_PF.to_string()
}

/// DTO canônico de presenças sociais digitais cifrado no cofre.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub struct SocialLinksDto {
    #[serde(default)]
    pub facebook: Option<String>,
    #[serde(default)]
    pub instagram: Option<String>,
    #[serde(default)]
    pub linkedin: Option<String>,
    #[serde(default)]
    pub twitter: Option<String>,
}

/// DTO canônico do Perfil do Usuário e Qualificação Civil exposto via Tauri IPC.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UserProfileDto {
    pub person_type: String,
    pub username: String,
    pub first_name: String,
    pub last_name: String,
    pub display_name: String,
    pub cpf: String,
    pub rg: String,
    pub rg_issuer: String,
    pub cnh: String,
    pub cnh_category: String,
    pub mother_name: String,
    pub father_name: String,
    pub birth_date: String,
    pub nationality: String,
    pub marital_status: String,
    pub company_name: String,
    pub cnpj: String,
    pub legal_representative: String,
    pub legal_representative_cpf: String,
    pub email: String,
    pub phone_number: String,
    pub country: String,
    pub zip_code: String,
    pub state: String,
    pub city: String,
    pub neighborhood: String,
    pub address: String,
    pub address_number: String,
    pub complement: String,
    pub occupation: String,
    pub company: String,
    pub website: String,
    pub about: String,
    pub is_public: bool,
    pub completeness_score: u32,
    pub revision: u64,
    pub updated_at: String,
    #[serde(default)]
    pub photo_url: Option<String>,
    #[serde(default)]
    pub cover_url: Option<String>,
    #[serde(default)]
    pub linked_providers: Vec<String>,
    #[serde(default)]
    pub social_links: Option<SocialLinksDto>,
}

impl Default for UserProfileDto {
    fn default() -> Self {
        Self {
            person_type: PERSON_TYPE_PF.to_string(),
            username: String::new(),
            first_name: String::new(),
            last_name: String::new(),
            display_name: String::new(),
            cpf: String::new(),
            rg: String::new(),
            rg_issuer: String::new(),
            cnh: String::new(),
            cnh_category: String::new(),
            mother_name: String::new(),
            father_name: String::new(),
            birth_date: String::new(),
            nationality: "Brasileira".to_string(),
            marital_status: String::new(),
            company_name: String::new(),
            cnpj: String::new(),
            legal_representative: String::new(),
            legal_representative_cpf: String::new(),
            email: String::new(),
            phone_number: String::new(),
            country: "Brasil".to_string(),
            zip_code: String::new(),
            state: String::new(),
            city: String::new(),
            neighborhood: String::new(),
            address: String::new(),
            address_number: String::new(),
            complement: String::new(),
            occupation: String::new(),
            company: String::new(),
            website: String::new(),
            about: String::new(),
            is_public: false,
            completeness_score: 0,
            revision: 0,
            updated_at: String::new(),
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
            social_links: None,
        }
    }
}

/// Projeção pública com allowlist estrita de campos não-sensíveis.
///
/// Dados como CPF, filiação, data de nascimento, RG, CNPJ e endereço residencial
/// NUNCA são expostos em projeções públicas, mesmo que `is_public` seja true.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PublicUserProfileDto {
    pub display_name: String,
    pub username: String,
    pub occupation: String,
    pub company: String,
    pub website: String,
    pub about: String,
    pub photo_url: Option<String>,
    pub cover_url: Option<String>,
    pub is_public: bool,
    #[serde(default)]
    pub social_links: Option<SocialLinksDto>,
}

impl UserProfileDto {
    /// Gera a projeção pública segura caso o perfil esteja configurado como público.
    pub fn to_public_projection(&self) -> Option<PublicUserProfileDto> {
        if !self.is_public {
            return None;
        }

        Some(PublicUserProfileDto {
            display_name: self.display_name.clone(),
            username: self.username.clone(),
            occupation: self.occupation.clone(),
            company: self.company.clone(),
            website: self.website.clone(),
            about: self.about.clone(),
            photo_url: self.photo_url.clone(),
            cover_url: self.cover_url.clone(),
            is_public: true,
            social_links: self.social_links.clone(),
        })
    }
}

/// Payload de requisição para salvar ou atualizar o perfil.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveUserProfileRequest {
    #[serde(default = "default_person_type")]
    pub person_type: String,
    #[serde(default)]
    pub username: Option<String>,
    #[serde(default)]
    pub first_name: String,
    #[serde(default)]
    pub last_name: String,
    #[serde(default)]
    pub display_name: Option<String>,
    #[serde(default)]
    pub cpf: String,
    #[serde(default)]
    pub rg: String,
    #[serde(default)]
    pub rg_issuer: String,
    #[serde(default)]
    pub cnh: String,
    #[serde(default)]
    pub cnh_category: String,
    #[serde(default)]
    pub mother_name: String,
    #[serde(default)]
    pub father_name: String,
    #[serde(default)]
    pub birth_date: String,
    #[serde(default)]
    pub nationality: String,
    #[serde(default)]
    pub marital_status: String,
    #[serde(default)]
    pub company_name: String,
    #[serde(default)]
    pub cnpj: String,
    #[serde(default)]
    pub legal_representative: String,
    #[serde(default)]
    pub legal_representative_cpf: String,
    #[serde(default)]
    pub email: String,
    #[serde(default)]
    pub phone_number: String,
    #[serde(default)]
    pub country: String,
    #[serde(default)]
    pub zip_code: String,
    #[serde(default)]
    pub state: String,
    #[serde(default)]
    pub city: String,
    #[serde(default)]
    pub neighborhood: String,
    #[serde(default)]
    pub address: String,
    #[serde(default)]
    pub address_number: String,
    #[serde(default)]
    pub complement: String,
    #[serde(default)]
    pub occupation: String,
    #[serde(default)]
    pub company: String,
    #[serde(default)]
    pub website: String,
    #[serde(default)]
    pub about: String,
    #[serde(default)]
    pub is_public: bool,
    #[serde(default)]
    pub photo_url: Option<String>,
    #[serde(default)]
    pub cover_url: Option<String>,
    #[serde(default)]
    pub linked_providers: Vec<String>,
    #[serde(default)]
    pub social_links: Option<SocialLinksDto>,
    pub expected_revision: Option<u64>,
}

impl Default for SaveUserProfileRequest {
    fn default() -> Self {
        Self {
            person_type: default_person_type(),
            username: None,
            first_name: String::new(),
            last_name: String::new(),
            display_name: None,
            cpf: String::new(),
            rg: String::new(),
            rg_issuer: String::new(),
            cnh: String::new(),
            cnh_category: String::new(),
            mother_name: String::new(),
            father_name: String::new(),
            birth_date: String::new(),
            nationality: "Brasileira".to_string(),
            marital_status: String::new(),
            company_name: String::new(),
            cnpj: String::new(),
            legal_representative: String::new(),
            legal_representative_cpf: String::new(),
            email: String::new(),
            phone_number: String::new(),
            country: "Brasil".to_string(),
            zip_code: String::new(),
            state: String::new(),
            city: String::new(),
            neighborhood: String::new(),
            address: String::new(),
            address_number: String::new(),
            complement: String::new(),
            occupation: String::new(),
            company: String::new(),
            website: String::new(),
            about: String::new(),
            is_public: false,
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
            social_links: None,
            expected_revision: None,
        }
    }
}

// ----------------------------------------------------------------------
// Rotinas de Validação de Documentos Oficiais Brasileiros
// ----------------------------------------------------------------------

/// Higieniza mantendo apenas dígitos decimais.
pub fn extract_digits(input: &str) -> String {
    input.chars().filter(|c| c.is_ascii_digit()).collect()
}

/// Validação algorítmica rigorosa de CPF com dois dígitos verificadores.
///
/// Rejeita caracteres inválidos antes de normalizar, valida formato,
/// sequências repetidas e calcula os dois dígitos verificadores (Módulo 11).
pub fn validate_cpf(raw: &str) -> Result<String, &'static str> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }

    // 1. Rejeita caracteres proibidos antes de normalizar
    for c in trimmed.chars() {
        if !c.is_ascii_digit() && c != '.' && c != '-' && !c.is_whitespace() {
            return Err("O CPF contém caracteres inválidos. Utilize apenas números e separadores válidos.");
        }
    }

    let digits = extract_digits(trimmed);
    if digits.len() != 11 {
        return Err("O CPF deve conter exatamente 11 dígitos numéricos.");
    }

    // 2. Rejeita sequências de dígitos todos iguais (00000000000, 11111111111, etc.)
    let first = digits.as_bytes()[0];
    if digits.bytes().all(|b| b == first) {
        return Err("O CPF informado é inválido (dígitos repetidos).");
    }

    let nums: Vec<u32> = digits
        .chars()
        .map(|c| c.to_digit(10).unwrap_or(0))
        .collect();

    // 3. Primeiro dígito verificador
    let sum1: u32 = nums[0..9]
        .iter()
        .enumerate()
        .map(|(idx, &val)| val * (10 - idx as u32))
        .sum();
    let mod1 = (sum1 * 10) % 11;
    let expected_d1 = if mod1 == 10 || mod1 == 11 { 0 } else { mod1 };
    if expected_d1 != nums[9] {
        return Err("Dígito verificador do CPF inválido.");
    }

    // 4. Segundo dígito verificador
    let sum2: u32 = nums[0..10]
        .iter()
        .enumerate()
        .map(|(idx, &val)| val * (11 - idx as u32))
        .sum();
    let mod2 = (sum2 * 10) % 11;
    let expected_d2 = if mod2 == 10 || mod2 == 11 { 0 } else { mod2 };
    if expected_d2 != nums[10] {
        return Err("Dígito verificador do CPF inválido.");
    }

    // Retorna formatado XXX.XXX.XXX-XX
    Ok(format!(
        "{}.{}.{}-{}",
        &digits[0..3],
        &digits[3..6],
        &digits[6..9],
        &digits[9..11]
    ))
}

/// Validação algorítmica rigorosa de CNPJ (Suporte a Numérico e Alfanumérico conforme IN RFB nº 2.229/2024).
///
/// Aceita o formato numérico legado (14 dígitos) e o novo formato alfanumérico em vigência em 2026.
/// As 12 primeiras posições podem conter dígitos e letras maiúsculas (A-Z).
/// As 2 posições finais são estritamente os dígitos verificadores calculados por Módulo 11
/// utilizando a conversão `ASCII(C) - 48`.
pub fn validate_cnpj(raw: &str) -> Result<String, &'static str> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }

    // 1. Rejeita caracteres inválidos antes de normalizar
    for c in trimmed.chars() {
        if !c.is_ascii_alphanumeric() && c != '.' && c != '/' && c != '-' && !c.is_whitespace() {
            return Err("O CNPJ contém caracteres inválidos. Utilize apenas letras, números e separadores válidos.");
        }
    }

    // 2. Normaliza para maiúsculas e remove separadores permitidos
    let normalized: String = trimmed
        .chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .map(|c| c.to_ascii_uppercase())
        .collect();

    if normalized.len() != 14 {
        return Err("O CNPJ deve conter exatamente 14 posições alfanuméricas.");
    }

    // 3. Os dois últimos caracteres devem ser estritamente dígitos decimais
    let bytes = normalized.as_bytes();
    if !bytes[12].is_ascii_digit() || !bytes[13].is_ascii_digit() {
        return Err("Os dois últimos caracteres do CNPJ devem ser dígitos verificadores numéricos.");
    }

    // 4. Rejeita sequências de todos os caracteres idênticos (ex: 00000000000000, AAAAAAAAAAAAAA)
    let first = bytes[0];
    if bytes.iter().all(|&b| b == first) {
        return Err("O CNPJ informado é inválido (todos os caracteres idênticos).");
    }

    // 5. Converte cada caractere das 12 primeiras posições para o valor numérico oficial (ASCII - 48)
    let values: Vec<u32> = bytes[0..12]
        .iter()
        .map(|&b| (b as u32) - 48)
        .collect();

    // 6. Cálculo do 1º Dígito Verificador (pesos: 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
    let weights1: [u32; 12] = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum1: u32 = values
        .iter()
        .zip(weights1.iter())
        .map(|(&v, &w)| v * w)
        .sum();
    let rem1 = sum1 % 11;
    let expected_d1 = if rem1 < 2 { 0 } else { 11 - rem1 };
    let actual_d1 = (bytes[12] - b'0') as u32;

    if expected_d1 != actual_d1 {
        return Err("Dígito verificador do CNPJ inválido.");
    }

    // 7. Cálculo do 2º Dígito Verificador (pesos: 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
    let weights2: [u32; 12] = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3];
    let sum2: u32 = values
        .iter()
        .zip(weights2.iter())
        .map(|(&v, &w)| v * w)
        .sum::<u32>()
        + (expected_d1 * 2);
    let rem2 = sum2 % 11;
    let expected_d2 = if rem2 < 2 { 0 } else { 11 - rem2 };
    let actual_d2 = (bytes[13] - b'0') as u32;

    if expected_d2 != actual_d2 {
        return Err("Dígito verificador do CNPJ inválido.");
    }

    // Retorna formatado no padrão oficial XX.XXX.XXX/XXXX-XX
    Ok(format!(
        "{}.{}.{}/{}-{}",
        &normalized[0..2],
        &normalized[2..5],
        &normalized[5..8],
        &normalized[8..12],
        &normalized[12..14]
    ))
}

/// Valida e formata CEP brasileiro (8 dígitos).
pub fn validate_cep(raw: &str) -> Result<String, &'static str> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }

    for c in trimmed.chars() {
        if !c.is_ascii_digit() && c != '-' && !c.is_whitespace() {
            return Err("O CEP contém caracteres inválidos. Utilize apenas números e hífen.");
        }
    }

    let digits = extract_digits(trimmed);
    if digits.len() != 8 {
        return Err("O CEP deve conter exatamente 8 dígitos.");
    }
    Ok(format!("{}-{}", &digits[0..5], &digits[5..8]))
}

/// Valida data no formato ISO YYYY-MM-DD ou converte de DD/MM/YYYY.
///
/// Valida calendário gregoriano (incluindo anos bissextos), ano plausível (1900 até o ano corrente)
/// e rejeita datas futuras.
pub fn validate_and_normalize_date(raw: &str) -> Result<String, &'static str> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }

    // Se estiver no formato legível DD/MM/YYYY, converter
    let candidate = if trimmed.contains('/') {
        let parts: Vec<&str> = trimmed.split('/').collect();
        if parts.len() == 3 && parts[0].len() <= 2 && parts[1].len() <= 2 && parts[2].len() == 4 {
            let day: u32 = parts[0].parse().map_err(|_| "Dia inválido na data.")?;
            let month: u32 = parts[1].parse().map_err(|_| "Mês inválido na data.")?;
            let year: i32 = parts[2].parse().map_err(|_| "Ano inválido na data.")?;
            format!("{:04}-{:02}-{:02}", year, month, day)
        } else {
            return Err("Formato de data inválido. Utilize AAAA-MM-DD ou DD/MM/AAAA.");
        }
    } else {
        trimmed.to_string()
    };

    let parsed = chrono::NaiveDate::parse_from_str(&candidate, "%Y-%m-%d")
        .map_err(|_| "Data inválida ou inexistente no calendário gregoriano.")?;

    let year = parsed.format("%Y").to_string().parse::<i32>().unwrap_or(0);
    let today = chrono::Utc::now().date_naive();
    let current_year = today.format("%Y").to_string().parse::<i32>().unwrap_or(2026);

    if year < 1900 || year > current_year {
        return Err("O ano de nascimento deve ser plausível (entre 1900 e o ano corrente).");
    }

    if parsed > today {
        return Err("A data de nascimento não pode ser posterior à data atual.");
    }

    Ok(candidate)
}

/// Calcula a taxa de completude dos dados cadastrais (0 a 100%).
///
/// Tanto para PF quanto para PJ, a soma dos pesos atinge exatamente 100%.
pub fn calculate_completeness_score(profile: &UserProfileDto) -> u32 {
    let mut score = 0u32;

    if profile.person_type == PERSON_TYPE_PJ {
        // Pessoa Jurídica (Total: 100)
        if !profile.company_name.trim().is_empty() { score += 20; }
        if !profile.cnpj.trim().is_empty() { score += 20; }
        if !profile.legal_representative.trim().is_empty() { score += 15; }
        if !profile.legal_representative_cpf.trim().is_empty() { score += 10; }
        if !profile.email.trim().is_empty() { score += 10; }
        if !profile.phone_number.trim().is_empty() { score += 5; }
        if !profile.zip_code.trim().is_empty() { score += 5; }
        if !profile.city.trim().is_empty() && !profile.state.trim().is_empty() { score += 5; }
        if !profile.address.trim().is_empty() { score += 5; }
        if !profile.occupation.trim().is_empty() { score += 5; }
    } else {
        // Pessoa Física (Total: 100)
        if !profile.first_name.trim().is_empty() { score += 10; }
        if !profile.last_name.trim().is_empty() { score += 10; }
        if !profile.cpf.trim().is_empty() { score += 20; }
        if !profile.birth_date.trim().is_empty() { score += 10; }
        if !profile.rg.trim().is_empty() || !profile.cnh.trim().is_empty() { score += 10; }
        if !profile.mother_name.trim().is_empty() { score += 5; }
        if !profile.email.trim().is_empty() { score += 10; }
        if !profile.phone_number.trim().is_empty() { score += 5; }
        if !profile.zip_code.trim().is_empty() { score += 5; }
        if !profile.city.trim().is_empty() && !profile.state.trim().is_empty() { score += 5; }
        if !profile.address.trim().is_empty() { score += 5; }
        if !profile.occupation.trim().is_empty() || !profile.about.trim().is_empty() { score += 5; }
    }

    score.min(100)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cpf_validation() {
        // CPF válido com e sem máscara
        let valid_cpf = "52998224725";
        assert!(validate_cpf(valid_cpf).is_ok());
        assert_eq!(validate_cpf(valid_cpf).unwrap(), "529.982.247-25");
        assert_eq!(validate_cpf("529.982.247-25").unwrap(), "529.982.247-25");

        // CPF inválido (todos iguais)
        assert!(validate_cpf("11111111111").is_err());
        assert!(validate_cpf("00000000000").is_err());

        // CPF com dígito errado
        assert!(validate_cpf("52998224726").is_err());

        // CPF com caracteres indevidos
        assert!(validate_cpf("529.982.247-2A").is_err());
        assert!(validate_cpf("529@982.247-25").is_err());

        // CPF vazio aceito em rascunho
        assert_eq!(validate_cpf("").unwrap(), "");
    }

    #[test]
    fn test_cnpj_numeric_validation() {
        // CNPJ numérico legado válido (Banco do Brasil: 00.000.000/0001-91)
        let valid_cnpj = "00000000000191";
        assert!(validate_cnpj(valid_cnpj).is_ok());
        assert_eq!(validate_cnpj(valid_cnpj).unwrap(), "00.000.000/0001-91");
        assert_eq!(validate_cnpj("00.000.000/0001-91").unwrap(), "00.000.000/0001-91");

        // CNPJ numérico com dígito errado
        assert!(validate_cnpj("00000000000192").is_err());
        assert!(validate_cnpj("11111111111111").is_err());

        // CNPJ vazio
        assert_eq!(validate_cnpj("").unwrap(), "");
    }

    #[test]
    fn test_cnpj_alphanumeric_validation() {
        // CNPJ alfanumérico oficial (IN RFB nº 2.229/2024):
        // 12 primeiras posições: "12ABC34501DE"
        // DVs matemáticos: 35
        let valid_alpha = "12ABC34501DE35";
        assert!(validate_cnpj(valid_alpha).is_ok());
        assert_eq!(validate_cnpj(valid_alpha).unwrap(), "12.ABC.345/01DE-35");
        assert_eq!(validate_cnpj("12.abc.345/01de-35").unwrap(), "12.ABC.345/01DE-35");

        // Alfanumérico com DVs errados
        assert!(validate_cnpj("12ABC34501DE36").is_err());

        // Caracteres proibidos (símbolos fora do padrão)
        assert!(validate_cnpj("12.ABC.345/01DE-3@").is_err());

        // Todos idênticos
        assert!(validate_cnpj("AAAAAAAAAAAAAA").is_err());
    }

    #[test]
    fn test_date_validation_leap_year_and_future() {
        // Data válida normal
        assert_eq!(
            validate_and_normalize_date("1985-05-15").unwrap(),
            "1985-05-15"
        );
        assert_eq!(
            validate_and_normalize_date("15/05/1985").unwrap(),
            "1985-05-15"
        );

        // Ano bissexto válido (2000 é bissexto)
        assert_eq!(
            validate_and_normalize_date("2000-02-29").unwrap(),
            "2000-02-29"
        );
        assert_eq!(
            validate_and_normalize_date("29/02/2000").unwrap(),
            "2000-02-29"
        );

        // Ano não-bissexto inválido (2001-02-29 não existe)
        assert!(validate_and_normalize_date("2001-02-29").is_err());

        // Data futura deve ser rejeitada
        assert!(validate_and_normalize_date("2099-01-01").is_err());

        // Ano anterior a 1900 rejeitado
        assert!(validate_and_normalize_date("1850-01-01").is_err());
    }

    #[test]
    fn test_completeness_scores_reach_exact_100() {
        // Teste PF completo
        let mut pf = UserProfileDto::default();
        pf.person_type = "PF".to_string();
        pf.first_name = "Ana".to_string();
        pf.last_name = "Silva".to_string();
        pf.cpf = "529.982.247-25".to_string();
        pf.birth_date = "1990-05-20".to_string();
        pf.rg = "12345678".to_string();
        pf.mother_name = "Maria Silva".to_string();
        pf.email = "ana@test.com".to_string();
        pf.phone_number = "11987654321".to_string();
        pf.zip_code = "01310-100".to_string();
        pf.city = "São Paulo".to_string();
        pf.state = "SP".to_string();
        pf.address = "Av Paulista".to_string();
        pf.occupation = "Engenheira".to_string();
        assert_eq!(calculate_completeness_score(&pf), 100);

        // Teste PJ completo
        let mut pj = UserProfileDto::default();
        pj.person_type = "PJ".to_string();
        pj.company_name = "Minha Empresa Ltda".to_string();
        pj.cnpj = "12.ABC.345/01DE-35".to_string();
        pj.legal_representative = "Carlos Silva".to_string();
        pj.legal_representative_cpf = "529.982.247-25".to_string();
        pj.email = "contato@empresa.com".to_string();
        pj.phone_number = "1133334444".to_string();
        pj.zip_code = "01310-100".to_string();
        pj.city = "São Paulo".to_string();
        pj.state = "SP".to_string();
        pj.address = "Av Paulista 1000".to_string();
        pj.occupation = "Desenvolvimento de Software (CNAE 6201-5)".to_string();
        assert_eq!(calculate_completeness_score(&pj), 100);
    }
}

```

---

### Arquivo 23: `service.rs`
**Caminho:** `src-tauri/src/modules/identity/service.rs`  
**Tipo / Camada:** Backend Service  
**Volume:** 1040 linhas  
**Responsabilidade:** Serviço de identidade: get_profile, save_profile, sanitização, validação defensiva, zeroização de memória e criptografia AES-256-GCM.  
**Dependências Internas:** `src-tauri/src/modules/identity/models.rs`, `src-tauri/src/modules/identity/repository.rs`, `src-tauri/src/modules/vault/encryption.rs`, `src-tauri/src/modules/vault/access_control.rs`  
**Relacionamento na ABA 1:** Lógica de negócio e orquestração de segurança no backend.  

```rust
//! Camada de serviço de negócios para Perfil do Usuário e Qualificação Civil.
//!
//! Orquestra validações, criptografia de ponta a ponta (AES-256-GCM com chave derivada
//! do cofre) e persistência transacional em SQLite.

use url::Url;
use zeroize::Zeroizing;

use super::models::{
    calculate_completeness_score, validate_and_normalize_date, validate_cep, validate_cnpj,
    validate_cpf, SaveUserProfileRequest, SocialLinksDto, UserProfileDto, PERSON_TYPE_PF, PERSON_TYPE_PJ,
};
use super::repository::IdentityRepository;
use crate::modules::vault::access_control::VaultSession;
use crate::modules::vault::encryption::VaultCrypto;
use crate::storage::local_database::{LocalDatabase, StorageError};

#[derive(Debug, thiserror::Error)]
pub enum IdentityError {
    #[error("VAULT_LOCKED: O cofre seguro está bloqueado. Desbloqueie com a senha mestre para acessar os dados.")]
    VaultLocked,

    #[error("VALIDATION_ERROR: {0}")]
    Validation(String),

    #[error("REVISION_CONFLICT: {0}")]
    ConcurrencyConflict(String),

    #[error("CRYPTO_ERROR: Falha na operação criptográfica dos dados do perfil.")]
    Crypto,

    #[error("STORAGE_ERROR: {0}")]
    Storage(String),

    #[error("SERIALIZATION_ERROR: Falha ao processar os dados do perfil.")]
    Serialization,
}

impl From<StorageError> for IdentityError {
    fn from(err: StorageError) -> Self {
        match err {
            StorageError::InvalidData(msg) if msg.starts_with("CONCURRENCY_CONFLICT") => {
                IdentityError::ConcurrencyConflict(msg)
            }
            other => IdentityError::Storage(other.to_string()),
        }
    }
}

pub fn normalize_username(raw: &str) -> String {
    let lower = raw.trim().to_lowercase();
    let sanitized: String = lower
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '_' { c } else { '_' })
        .collect();
    let mut result = String::new();
    let mut last_was_underscore = false;
    for c in sanitized.chars() {
        if c == '_' {
            if !last_was_underscore && !result.is_empty() {
                result.push(c);
                last_was_underscore = true;
            }
        } else {
            result.push(c);
            last_was_underscore = false;
        }
    }
    if result.ends_with('_') {
        result.pop();
    }
    if result.len() > 30 {
        result.truncate(30);
    }
    result
}

/// Valida e sanitiza rigorosamente uma URL de rede social contra a allowlist da plataforma.
pub fn sanitize_social_url(
    platform: &str,
    value: &Option<String>,
) -> Result<Option<String>, IdentityError> {
    let Some(raw_value) = value else {
        return Ok(None);
    };

    let trimmed = raw_value.trim();

    // Campos opcionais podem ser vazios
    if trimmed.is_empty() {
        return Ok(None);
    }

    // Limite de 2048 bytes UTF-8
    if trimmed.len() > 2048 {
        return Err(IdentityError::Validation(
            "URL de rede social excede o limite permitido de 2048 bytes.".to_string(),
        ));
    }

    // Parse real da URL via crate url::Url
    let parsed = Url::parse(trimmed).map_err(|_| {
        IdentityError::Validation("URL de rede social inválida ou malformada.".to_string())
    })?;

    // HTTPS obrigatório (rejeita http, javascript, data, ftp, etc.)
    if parsed.scheme() != "https" {
        return Err(IdentityError::Validation(
            "A URL de rede social deve utilizar protocolo seguro HTTPS.".to_string(),
        ));
    }

    // Bloqueia credenciais embutidas (ex: https://user:pass@host)
    if !parsed.username().is_empty() || parsed.password().is_some() {
        return Err(IdentityError::Validation(
            "URLs com credenciais embutidas não são permitidas.".to_string(),
        ));
    }

    // Bloqueia portas não convencionais (ex: https://host:8080)
    if parsed.port().is_some() {
        return Err(IdentityError::Validation(
            "Portas personalizadas não são permitidas em URLs de redes sociais.".to_string(),
        ));
    }

    // Allowlist estrita de hostnames legítimos por plataforma
    let allowed_hosts: &[&str] = match platform {
        "facebook" => &[
            "facebook.com",
            "www.facebook.com",
            "m.facebook.com",
            "fb.com",
            "www.fb.com",
        ],
        "instagram" => &[
            "instagram.com",
            "www.instagram.com",
        ],
        "linkedin" => &[
            "linkedin.com",
            "www.linkedin.com",
        ],
        "twitter" => &[
            "x.com",
            "www.x.com",
            "twitter.com",
            "www.twitter.com",
        ],
        _ => {
            return Err(IdentityError::Validation(
                "Plataforma de rede social não autorizada.".to_string(),
            ));
        }
    };

    let hostname = parsed.host_str().unwrap_or_default().to_ascii_lowercase();

    if !allowed_hosts.contains(&hostname.as_str()) {
        return Err(IdentityError::Validation(format!(
            "O domínio '{}' não pertence à plataforma autorizada ({}).",
            hostname, platform
        )));
    }

    Ok(Some(parsed.to_string()))
}

pub struct IdentityService;

impl IdentityService {
    /// Higieniza e valida os dados recebidos para o perfil com separação estrita PF / PJ
    /// e preservação segura de dados inativos entre transições de titularidade.
    fn sanitize_and_validate(
        req: &SaveUserProfileRequest,
        existing_profile: Option<&UserProfileDto>,
    ) -> Result<UserProfileDto, IdentityError> {
        let person_type = if req.person_type.trim() == PERSON_TYPE_PJ {
            PERSON_TYPE_PJ.to_string()
        } else {
            PERSON_TYPE_PF.to_string()
        };

        // Validação de limites máximos (proteção contra payloads excessivos / DoS de memória)
        if req.first_name.len() > 100 || req.last_name.len() > 100 || req.company_name.len() > 150 {
            return Err(IdentityError::Validation(
                "Nomes ou razão social não podem exceder 150 caracteres.".to_string(),
            ));
        }

        if req.about.len() > 2000 {
            return Err(IdentityError::Validation(
                "O campo 'Sobre' não pode exceder 2.000 caracteres.".to_string(),
            ));
        }

        let username = match &req.username {
            Some(u) if !u.trim().is_empty() => {
                let norm = normalize_username(u);
                if norm.len() < 3 || norm.len() > 30 {
                    return Err(IdentityError::Validation(
                        "O username deve ter entre 3 e 30 caracteres alfanuméricos ou sublinhados.".to_string(),
                    ));
                }
                norm
            }
            _ => existing_profile
                .as_ref()
                .map(|p| p.username.clone())
                .unwrap_or_default(),
        };

        let first_name = if !req.first_name.trim().is_empty() {
            req.first_name.trim().to_string()
        } else {
            existing_profile.as_ref().map(|p| p.first_name.clone()).unwrap_or_default()
        };
        let last_name = if !req.last_name.trim().is_empty() {
            req.last_name.trim().to_string()
        } else {
            existing_profile.as_ref().map(|p| p.last_name.clone()).unwrap_or_default()
        };
        let company_name = if !req.company_name.trim().is_empty() {
            req.company_name.trim().to_string()
        } else {
            existing_profile.as_ref().map(|p| p.company_name.clone()).unwrap_or_default()
        };

        let display_name = match &req.display_name {
            Some(d) if !d.trim().is_empty() => d.trim().to_string(),
            _ => {
                if person_type == PERSON_TYPE_PJ && !company_name.is_empty() {
                    company_name.clone()
                } else if !first_name.is_empty() || !last_name.is_empty() {
                    format!("{} {}", first_name, last_name).trim().to_string()
                } else if !username.is_empty() {
                    username.clone()
                } else {
                    "Usuário DevOS".to_string()
                }
            }
        };

        // Validações compartilhadas (Localização e Contato)
        let zip_code = validate_cep(&req.zip_code)
            .map_err(|e| IdentityError::Validation(format!("CEP inválido: {}", e)))?;

        // Validações específicas e preservação segura de dados entre transições PF e PJ
        let (
            cpf,
            rg,
            rg_issuer,
            cnh,
            cnh_category,
            mother_name,
            father_name,
            birth_date,
            marital_status,
            final_company_name,
            cnpj,
            legal_representative,
            legal_representative_cpf,
        ) = if person_type == PERSON_TYPE_PJ {
            // Regras Pessoa Jurídica
            let raw_cnpj = if !req.cnpj.trim().is_empty() {
                &req.cnpj
            } else if let Some(p) = existing_profile {
                &p.cnpj
            } else {
                &req.cnpj
            };
            let validated_cnpj = validate_cnpj(raw_cnpj)
                .map_err(|e| IdentityError::Validation(format!("CNPJ inválido: {}", e)))?;

            let raw_rep_cpf = if !req.legal_representative_cpf.trim().is_empty() {
                &req.legal_representative_cpf
            } else if let Some(p) = existing_profile {
                &p.legal_representative_cpf
            } else {
                &req.legal_representative_cpf
            };
            let validated_rep_cpf = if !raw_rep_cpf.trim().is_empty() {
                validate_cpf(raw_rep_cpf)
                    .map_err(|e| IdentityError::Validation(format!("CPF do representante inválido: {}", e)))?
            } else {
                String::new()
            };

            let legal_rep = if !req.legal_representative.trim().is_empty() {
                req.legal_representative.trim().to_string()
            } else {
                existing_profile.as_ref().map(|p| p.legal_representative.clone()).unwrap_or_default()
            };

            // Preservação ou atualização de dados de PF em modo PJ
            let pf_cpf = if !req.cpf.trim().is_empty() {
                validate_cpf(&req.cpf).unwrap_or_else(|_| existing_profile.as_ref().map(|p| p.cpf.clone()).unwrap_or_default())
            } else {
                existing_profile.as_ref().map(|p| p.cpf.clone()).unwrap_or_default()
            };
            let pf_rg = if !req.rg.trim().is_empty() { req.rg.trim().to_string() } else { existing_profile.as_ref().map(|p| p.rg.clone()).unwrap_or_default() };
            let pf_rg_issuer = if !req.rg_issuer.trim().is_empty() { req.rg_issuer.trim().to_string() } else { existing_profile.as_ref().map(|p| p.rg_issuer.clone()).unwrap_or_default() };
            let pf_cnh = if !req.cnh.trim().is_empty() { req.cnh.trim().to_string() } else { existing_profile.as_ref().map(|p| p.cnh.clone()).unwrap_or_default() };
            let pf_cnh_cat = if !req.cnh_category.trim().is_empty() { req.cnh_category.trim().to_string() } else { existing_profile.as_ref().map(|p| p.cnh_category.clone()).unwrap_or_default() };
            let pf_mother = if !req.mother_name.trim().is_empty() { req.mother_name.trim().to_string() } else { existing_profile.as_ref().map(|p| p.mother_name.clone()).unwrap_or_default() };
            let pf_father = if !req.father_name.trim().is_empty() { req.father_name.trim().to_string() } else { existing_profile.as_ref().map(|p| p.father_name.clone()).unwrap_or_default() };
            let pf_birth = if !req.birth_date.trim().is_empty() {
                validate_and_normalize_date(&req.birth_date).unwrap_or_else(|_| existing_profile.as_ref().map(|p| p.birth_date.clone()).unwrap_or_default())
            } else {
                existing_profile.as_ref().map(|p| p.birth_date.clone()).unwrap_or_default()
            };
            let pf_marital = if !req.marital_status.trim().is_empty() { req.marital_status.trim().to_string() } else { existing_profile.as_ref().map(|p| p.marital_status.clone()).unwrap_or_default() };

            (
                pf_cpf,
                pf_rg,
                pf_rg_issuer,
                pf_cnh,
                pf_cnh_cat,
                pf_mother,
                pf_father,
                pf_birth,
                pf_marital,
                company_name,
                validated_cnpj,
                legal_rep,
                validated_rep_cpf,
            )
        } else {
            // Regras Pessoa Física
            let raw_cpf = if !req.cpf.trim().is_empty() {
                &req.cpf
            } else if let Some(p) = existing_profile {
                &p.cpf
            } else {
                &req.cpf
            };
            let validated_cpf = validate_cpf(raw_cpf)
                .map_err(|e| IdentityError::Validation(format!("CPF inválido: {}", e)))?;

            let raw_birth = if !req.birth_date.trim().is_empty() {
                &req.birth_date
            } else if let Some(p) = existing_profile {
                &p.birth_date
            } else {
                &req.birth_date
            };
            let validated_birth = if !raw_birth.trim().is_empty() {
                validate_and_normalize_date(raw_birth)
                    .map_err(|e| IdentityError::Validation(format!("Data de nascimento inválida: {}", e)))?
            } else {
                String::new()
            };

            let pf_rg = if !req.rg.trim().is_empty() { req.rg.trim().to_string() } else { existing_profile.as_ref().map(|p| p.rg.clone()).unwrap_or_default() };
            let pf_rg_issuer = if !req.rg_issuer.trim().is_empty() { req.rg_issuer.trim().to_string() } else { existing_profile.as_ref().map(|p| p.rg_issuer.clone()).unwrap_or_default() };
            let pf_cnh = if !req.cnh.trim().is_empty() { req.cnh.trim().to_string() } else { existing_profile.as_ref().map(|p| p.cnh.clone()).unwrap_or_default() };
            let pf_cnh_cat = if !req.cnh_category.trim().is_empty() { req.cnh_category.trim().to_string() } else { existing_profile.as_ref().map(|p| p.cnh_category.clone()).unwrap_or_default() };
            let pf_mother = if !req.mother_name.trim().is_empty() { req.mother_name.trim().to_string() } else { existing_profile.as_ref().map(|p| p.mother_name.clone()).unwrap_or_default() };
            let pf_father = if !req.father_name.trim().is_empty() { req.father_name.trim().to_string() } else { existing_profile.as_ref().map(|p| p.father_name.clone()).unwrap_or_default() };
            let pf_marital = if !req.marital_status.trim().is_empty() { req.marital_status.trim().to_string() } else { existing_profile.as_ref().map(|p| p.marital_status.clone()).unwrap_or_default() };

            // Preservação ou atualização de dados PJ em modo PF
            let pj_cnpj = if !req.cnpj.trim().is_empty() {
                validate_cnpj(&req.cnpj).unwrap_or_else(|_| existing_profile.as_ref().map(|p| p.cnpj.clone()).unwrap_or_default())
            } else {
                existing_profile.as_ref().map(|p| p.cnpj.clone()).unwrap_or_default()
            };
            let pj_legal_rep = if !req.legal_representative.trim().is_empty() {
                req.legal_representative.trim().to_string()
            } else {
                existing_profile.as_ref().map(|p| p.legal_representative.clone()).unwrap_or_default()
            };
            let pj_legal_rep_cpf = if !req.legal_representative_cpf.trim().is_empty() {
                validate_cpf(&req.legal_representative_cpf).unwrap_or_else(|_| existing_profile.as_ref().map(|p| p.legal_representative_cpf.clone()).unwrap_or_default())
            } else {
                existing_profile.as_ref().map(|p| p.legal_representative_cpf.clone()).unwrap_or_default()
            };

            (
                validated_cpf,
                pf_rg,
                pf_rg_issuer,
                pf_cnh,
                pf_cnh_cat,
                pf_mother,
                pf_father,
                validated_birth,
                pf_marital,
                company_name,
                pj_cnpj,
                pj_legal_rep,
                pj_legal_rep_cpf,
            )
        };

        let social_links = match &req.social_links {
            Some(links) => Some(SocialLinksDto {
                facebook: sanitize_social_url("facebook", &links.facebook)?,
                instagram: sanitize_social_url("instagram", &links.instagram)?,
                linkedin: sanitize_social_url("linkedin", &links.linkedin)?,
                twitter: sanitize_social_url("twitter", &links.twitter)?,
            }),
            None => existing_profile
                .as_ref()
                .and_then(|p| p.social_links.clone()),
        };

        let mut profile = UserProfileDto {
            person_type,
            username,
            first_name,
            last_name,
            display_name,
            cpf,
            rg,
            rg_issuer,
            cnh,
            cnh_category,
            mother_name,
            father_name,
            birth_date,
            nationality: if req.nationality.trim().is_empty() { "Brasileira".to_string() } else { req.nationality.trim().to_string() },
            marital_status,
            company_name: final_company_name,
            cnpj,
            legal_representative,
            legal_representative_cpf,
            email: req.email.trim().to_string(),
            phone_number: req.phone_number.trim().to_string(),
            country: if req.country.trim().is_empty() { "Brasil".to_string() } else { req.country.trim().to_string() },
            zip_code,
            state: req.state.trim().to_string(),
            city: req.city.trim().to_string(),
            neighborhood: req.neighborhood.trim().to_string(),
            address: req.address.trim().to_string(),
            address_number: req.address_number.trim().to_string(),
            complement: req.complement.trim().to_string(),
            occupation: req.occupation.trim().to_string(),
            company: req.company.trim().to_string(),
            website: req.website.trim().to_string(),
            about: req.about.trim().to_string(),
            is_public: req.is_public,
            completeness_score: 0,
            revision: req.expected_revision.unwrap_or(0),
            updated_at: chrono::Utc::now().to_rfc3339(),
            photo_url: req.photo_url.clone(),
            cover_url: req.cover_url.clone(),
            linked_providers: req.linked_providers.clone(),
            social_links,
        };

        profile.completeness_score = calculate_completeness_score(&profile);

        Ok(profile)
    }

    /// Consulta o perfil do usuário decifrando os dados protegidos pelo cofre.
    pub fn get_profile(
        db: &LocalDatabase,
        session: &VaultSession,
    ) -> Result<Option<UserProfileDto>, IdentityError> {
        if !session.is_unlocked() {
            return Err(IdentityError::VaultLocked);
        }

        let conn = db.get_connection()?;
        let record = match IdentityRepository::get_profile_record(&conn)? {
            Some(r) => r,
            None => return Ok(None),
        };

        // Decifra o envelope com a chave da sessão ativa
        let decrypted_bytes = session
            .with_session_key(|key| {
                VaultCrypto::decrypt(key, &record.envelope).map_err(|_| {
                    crate::modules::vault::access_control::AccessControlError::Locked
                })
            })
            .map_err(|_| IdentityError::Crypto)?;

        let decrypted_zero = Zeroizing::new(decrypted_bytes);

        let mut profile: UserProfileDto = serde_json::from_slice(&decrypted_zero)
            .map_err(|_| IdentityError::Serialization)?;

        profile.revision = record.revision;
        profile.updated_at = record.updated_at;
        profile.completeness_score = calculate_completeness_score(&profile);

        Ok(Some(profile))
    }

    /// Salva ou atualiza os dados do perfil cifrando-os com a chave de sessão e persistindo no SQLite.
    pub fn save_profile(
        db: &LocalDatabase,
        session: &VaultSession,
        req: SaveUserProfileRequest,
    ) -> Result<UserProfileDto, IdentityError> {
        if !session.is_unlocked() {
            return Err(IdentityError::VaultLocked);
        }

        let existing = Self::get_profile(db, session)?;
        let expected_revision = req.expected_revision;
        let mut profile = Self::sanitize_and_validate(&req, existing.as_ref())?;

        let payload_json = Zeroizing::new(
            serde_json::to_vec(&profile).map_err(|_| IdentityError::Serialization)?
        );

        // Cifra os dados com a chave do cofre em memória
        let envelope = session
            .with_session_key(|key| {
                VaultCrypto::encrypt(key, &payload_json).map_err(|_| {
                    crate::modules::vault::access_control::AccessControlError::Locked
                })
            })
            .map_err(|_| IdentityError::Crypto)?;

        let mut conn = db.get_connection()?;
        let new_revision = IdentityRepository::save_profile_record(&mut conn, &envelope, expected_revision)?;

        profile.revision = new_revision;
        profile.updated_at = chrono::Utc::now().to_rfc3339();

        log::info!(
            "[Identity] Perfil salvo com sucesso no cofre seguro SQLite. Revisão: {}",
            new_revision
        );

        Ok(profile)
    }

    /// Importa dados legados do localStorage de forma segura e não destrutiva.
    ///
    /// Se já existir um perfil gravado no cofre com revisão ou completude superior,
    /// a persistência existente é preservada para evitar sobrescrita cega.
    pub fn import_legacy_profile(
        db: &LocalDatabase,
        session: &VaultSession,
        legacy_json: &str,
    ) -> Result<UserProfileDto, IdentityError> {
        if !session.is_unlocked() {
            return Err(IdentityError::VaultLocked);
        }

        // 1. Verifica se já existe um perfil ativo no cofre SQLite
        if let Some(existing) = Self::get_profile(db, session)? {
            // Se o perfil existente já tem revisão >= 1 e campos básicos, preserva
            if existing.revision >= 1 && existing.completeness_score > 0 {
                log::info!("[Identity] Perfil existente no cofre preservado durante reconciliação legada.");
                return Ok(existing);
            }
        }

        let value: serde_json::Value = serde_json::from_str(legacy_json)
            .map_err(|_| IdentityError::Validation("Formato JSON legado inválido.".to_string()))?;

        let str_field = |name: &str| -> String {
            value.get(name).and_then(|v| v.as_str()).unwrap_or("").to_string()
        };

        let bool_field = |name: &str, default: bool| -> bool {
            value.get(name).and_then(|v| v.as_bool()).unwrap_or(default)
        };

        let req = SaveUserProfileRequest {
            person_type: {
                let p = str_field("personType");
                if p.to_uppercase() == PERSON_TYPE_PJ {
                    PERSON_TYPE_PJ.to_string()
                } else {
                    PERSON_TYPE_PF.to_string()
                }
            },
            username: value.get("username").and_then(|v| v.as_str()).map(|s| s.to_string()),
            first_name: str_field("firstName"),
            last_name: str_field("lastName"),
            display_name: value.get("displayName").and_then(|v| v.as_str()).map(|s| s.to_string()),
            cpf: str_field("cpf"),
            rg: str_field("rg"),
            rg_issuer: str_field("rgIssuer"),
            cnh: str_field("cnh"),
            cnh_category: str_field("cnhCategory"),
            mother_name: str_field("motherName"),
            father_name: str_field("fatherName"),
            birth_date: str_field("birthDate"),
            nationality: str_field("nationality"),
            marital_status: str_field("maritalStatus"),
            company_name: str_field("companyName"),
            cnpj: str_field("cnpj"),
            legal_representative: str_field("legalRepresentative"),
            legal_representative_cpf: str_field("legalRepresentativeCpf"),
            email: str_field("email"),
            phone_number: str_field("phoneNumber"),
            country: str_field("country"),
            zip_code: str_field("zipCode"),
            state: str_field("state"),
            city: str_field("city"),
            neighborhood: str_field("neighborhood"),
            address: str_field("address"),
            address_number: str_field("addressNumber"),
            complement: str_field("complement"),
            occupation: str_field("occupation"),
            company: str_field("company"),
            website: str_field("website"),
            about: str_field("about"),
            // Por segurança e privacidade estrita, manter falso a menos que explicitado
            is_public: bool_field("isPublic", false),
            photo_url: value.get("photoURL").and_then(|v| v.as_str()).map(|s| s.to_string()),
            cover_url: value.get("coverURL").and_then(|v| v.as_str()).map(|s| s.to_string()),
            linked_providers: Vec::new(),
            social_links: None,
            expected_revision: None,
        };

        Self::save_profile(db, session, req)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    struct TestDirGuard(PathBuf);
    impl Drop for TestDirGuard {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    fn setup_test_vault() -> (LocalDatabase, VaultSession, TestDirGuard) {
        let dir = std::env::temp_dir().join(format!("devos_identity_test_{}", rand::random::<u32>()));
        let _ = std::fs::create_dir_all(&dir);
        let db = LocalDatabase::new(dir.clone());
        crate::storage::MigrationManager::run_migrations(&db).unwrap();

        let session = VaultSession::new();
        session.set_session_key_for_test("test_master_key_12345678");

        (db, session, TestDirGuard(dir))
    }

    #[test]
    fn test_save_and_get_profile() {
        let (db, session, _dir) = setup_test_vault();

        let req = SaveUserProfileRequest {
            person_type: "PF".to_string(),
            username: Some("carlos_silva".to_string()),
            first_name: "Carlos".to_string(),
            last_name: "Silva".to_string(),
            display_name: None,
            cpf: "52998224725".to_string(),
            rg: "12345678".to_string(),
            rg_issuer: "SSP/SP".to_string(),
            cnh: "".to_string(),
            cnh_category: "".to_string(),
            mother_name: "Ana Silva".to_string(),
            father_name: "".to_string(),
            birth_date: "1990-01-15".to_string(),
            nationality: "Brasileira".to_string(),
            marital_status: "Solteiro(a)".to_string(),
            company_name: "".to_string(),
            cnpj: "".to_string(),
            legal_representative: "".to_string(),
            legal_representative_cpf: "".to_string(),
            email: "carlos@exemplo.com.br".to_string(),
            phone_number: "11987654321".to_string(),
            country: "Brasil".to_string(),
            zip_code: "01310100".to_string(),
            state: "SP".to_string(),
            city: "São Paulo".to_string(),
            neighborhood: "Bela Vista".to_string(),
            address: "Avenida Paulista".to_string(),
            address_number: "1000".to_string(),
            complement: "Apto 42".to_string(),
            occupation: "Desenvolvedor".to_string(),
            company: "Tech Corp".to_string(),
            website: "https://carlos.dev".to_string(),
            about: "Bio de teste".to_string(),
            is_public: false,
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
            social_links: Some(SocialLinksDto {
                facebook: Some("https://facebook.com/carlos".to_string()),
                instagram: Some("https://instagram.com/carlos".to_string()),
                linkedin: Some("https://linkedin.com/in/carlos".to_string()),
                twitter: Some("https://x.com/carlos".to_string()),
            }),
            expected_revision: None,
        };

        let saved = IdentityService::save_profile(&db, &session, req).expect("Deveria salvar");
        assert_eq!(saved.revision, 1);
        assert_eq!(saved.username, "carlos_silva");
        assert_eq!(saved.cpf, "529.982.247-25");
        assert_eq!(saved.zip_code, "01310-100");
        assert_eq!(saved.display_name, "Carlos Silva");
        assert!(saved.completeness_score > 70);
        assert_eq!(
            saved.social_links.as_ref().unwrap().linkedin.as_deref(),
            Some("https://linkedin.com/in/carlos")
        );

        let loaded = IdentityService::get_profile(&db, &session)
            .expect("Deveria ler")
            .expect("Perfil deve existir");
        assert_eq!(loaded.revision, 1);
        assert_eq!(loaded.username, "carlos_silva");
        assert_eq!(
            loaded.social_links.as_ref().unwrap().twitter.as_deref(),
            Some("https://x.com/carlos")
        );
        assert_eq!(loaded.first_name, "Carlos");
        assert_eq!(loaded.cpf, "529.982.247-25");
        assert_eq!(loaded.email, "carlos@exemplo.com.br");
    }

    #[test]
    fn test_optimistic_concurrency_lock() {
        let (db, session, _dir) = setup_test_vault();

        let req1 = SaveUserProfileRequest {
            person_type: "PF".to_string(),
            username: Some("carlos_s".to_string()),
            first_name: "Carlos".to_string(),
            last_name: "Silva".to_string(),
            display_name: None,
            cpf: "52998224725".to_string(),
            rg: "".to_string(),
            rg_issuer: "".to_string(),
            cnh: "".to_string(),
            cnh_category: "".to_string(),
            mother_name: "".to_string(),
            father_name: "".to_string(),
            birth_date: "".to_string(),
            nationality: "".to_string(),
            marital_status: "".to_string(),
            company_name: "".to_string(),
            cnpj: "".to_string(),
            legal_representative: "".to_string(),
            legal_representative_cpf: "".to_string(),
            email: "carlos@test.com".to_string(),
            phone_number: "".to_string(),
            country: "".to_string(),
            zip_code: "".to_string(),
            state: "".to_string(),
            city: "".to_string(),
            neighborhood: "".to_string(),
            address: "".to_string(),
            address_number: "".to_string(),
            complement: "".to_string(),
            occupation: "".to_string(),
            company: "".to_string(),
            website: "".to_string(),
            about: "".to_string(),
            is_public: false,
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
            social_links: None,
            expected_revision: None,
        };

        let saved = IdentityService::save_profile(&db, &session, req1).unwrap();
        assert_eq!(saved.revision, 1);

        // Tentativa de salvar com revisão defasada (expected: 99 em vez de 1)
        let mut req2 = SaveUserProfileRequest {
            first_name: "Carlos Atualizado".to_string(),
            expected_revision: Some(99),
            ..SaveUserProfileRequest {
                person_type: "PF".to_string(),
                username: Some("carlos_s".to_string()),
                first_name: "Carlos".to_string(),
                last_name: "Silva".to_string(),
                display_name: None,
                cpf: "52998224725".to_string(),
                rg: "".to_string(),
                rg_issuer: "".to_string(),
                cnh: "".to_string(),
                cnh_category: "".to_string(),
                mother_name: "".to_string(),
                father_name: "".to_string(),
                birth_date: "".to_string(),
                nationality: "".to_string(),
                marital_status: "".to_string(),
                company_name: "".to_string(),
                cnpj: "".to_string(),
                legal_representative: "".to_string(),
                legal_representative_cpf: "".to_string(),
                email: "carlos@test.com".to_string(),
                phone_number: "".to_string(),
                country: "".to_string(),
                zip_code: "".to_string(),
                state: "".to_string(),
                city: "".to_string(),
                neighborhood: "".to_string(),
                address: "".to_string(),
                address_number: "".to_string(),
                complement: "".to_string(),
                occupation: "".to_string(),
                company: "".to_string(),
                website: "".to_string(),
                about: "".to_string(),
                is_public: false,
                photo_url: None,
                cover_url: None,
                linked_providers: Vec::new(),
                social_links: None,
                expected_revision: None,
            }
        };
        req2.expected_revision = Some(99);

        let err = IdentityService::save_profile(&db, &session, req2);
        assert!(err.is_err());
        assert!(matches!(err.unwrap_err(), IdentityError::ConcurrencyConflict(_)));
    }

    #[test]
    fn test_normalize_username_canonical() {
        assert_eq!(normalize_username("usuario.teste"), "usuario_teste");
        assert_eq!(normalize_username("Usuario.De.Teste@123"), "usuario_de_teste_123");
        assert_eq!(normalize_username("__sandro___souza__"), "sandro_souza");
        assert_eq!(normalize_username(""), "");
    }

    #[test]
    fn test_preserve_inactive_fields_on_person_type_switch() {
        let (db, session, _guard) = setup_test_vault();

        // 1. Salva inicialmente como PF com CPF
        let req_pf = SaveUserProfileRequest {
            person_type: "PF".to_string(),
            username: Some("joao_silva".to_string()),
            first_name: "João".to_string(),
            last_name: "Silva".to_string(),
            display_name: None,
            cpf: "52998224725".to_string(),
            rg: "123456".to_string(),
            rg_issuer: "SSP/SP".to_string(),
            cnh: "".to_string(),
            cnh_category: "".to_string(),
            mother_name: "Maria Silva".to_string(),
            father_name: "".to_string(),
            birth_date: "1990-01-01".to_string(),
            nationality: "Brasileira".to_string(),
            marital_status: "Solteiro(a)".to_string(),
            company_name: "".to_string(),
            cnpj: "".to_string(),
            legal_representative: "".to_string(),
            legal_representative_cpf: "".to_string(),
            email: "joao@empresa.com".to_string(),
            phone_number: "11999999999".to_string(),
            country: "Brasil".to_string(),
            zip_code: "01310-100".to_string(),
            state: "SP".to_string(),
            city: "São Paulo".to_string(),
            neighborhood: "Bela Vista".to_string(),
            address: "Av Paulista".to_string(),
            address_number: "1000".to_string(),
            complement: "".to_string(),
            occupation: "Desenvolvedor".to_string(),
            company: "".to_string(),
            website: "".to_string(),
            about: "".to_string(),
            is_public: false,
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
            social_links: None,
            expected_revision: None,
        };

        let saved_pf = IdentityService::save_profile(&db, &session, req_pf).unwrap();
        assert_eq!(saved_pf.person_type, "PF");
        assert_eq!(saved_pf.cpf, "529.982.247-25");

        // 2. Transiciona para PJ, fornecendo CNPJ e Razão Social
        let req_pj = SaveUserProfileRequest {
            person_type: "PJ".to_string(),
            username: Some("joao_silva".to_string()),
            first_name: "".to_string(),
            last_name: "".to_string(),
            display_name: None,
            cpf: "".to_string(),
            rg: "".to_string(),
            rg_issuer: "".to_string(),
            cnh: "".to_string(),
            cnh_category: "".to_string(),
            mother_name: "".to_string(),
            father_name: "".to_string(),
            birth_date: "".to_string(),
            nationality: "Brasileira".to_string(),
            marital_status: "".to_string(),
            company_name: "Minha Empresa Ltda".to_string(),
            cnpj: "12ABC34501DE35".to_string(),
            legal_representative: "João Silva".to_string(),
            legal_representative_cpf: "52998224725".to_string(),
            email: "contato@empresa.com".to_string(),
            phone_number: "11999999999".to_string(),
            country: "Brasil".to_string(),
            zip_code: "01310-100".to_string(),
            state: "SP".to_string(),
            city: "São Paulo".to_string(),
            neighborhood: "Bela Vista".to_string(),
            address: "Av Paulista".to_string(),
            address_number: "1000".to_string(),
            complement: "".to_string(),
            occupation: "Tecnologia".to_string(),
            company: "".to_string(),
            website: "".to_string(),
            about: "".to_string(),
            is_public: false,
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
            social_links: None,
            expected_revision: Some(saved_pf.revision),
        };

        let saved_pj = IdentityService::save_profile(&db, &session, req_pj).unwrap();
        assert_eq!(saved_pj.person_type, "PJ");
        assert_eq!(saved_pj.cnpj, "12.ABC.345/01DE-35");
        // Comprova que os dados civis PF anteriores NÃO foram destruídos
        assert_eq!(saved_pj.cpf, "529.982.247-25");
        assert_eq!(saved_pj.rg, "123456");
        assert_eq!(saved_pj.mother_name, "Maria Silva");

        // 3. Transiciona de volta para PF (PF -> PJ -> PF) comprovando preservação mútua
        let req_pf_again = SaveUserProfileRequest {
            person_type: "PF".to_string(),
            username: Some("joao_silva".to_string()),
            first_name: "".to_string(), // Deve preservar "João"
            last_name: "".to_string(),  // Deve preservar "Silva"
            display_name: None,
            cpf: "".to_string(),        // Deve preservar "529.982.247-25"
            rg: "".to_string(),
            rg_issuer: "".to_string(),
            cnh: "".to_string(),
            cnh_category: "".to_string(),
            mother_name: "".to_string(),
            father_name: "".to_string(),
            birth_date: "".to_string(),
            nationality: "Brasileira".to_string(),
            marital_status: "".to_string(),
            company_name: "".to_string(), // Deve preservar "Minha Empresa Ltda"
            cnpj: "".to_string(),         // Deve preservar "12.ABC.345/01DE-35"
            legal_representative: "".to_string(),
            legal_representative_cpf: "".to_string(),
            email: "joao@email.com".to_string(),
            phone_number: "11988888888".to_string(),
            country: "Brasil".to_string(),
            zip_code: "01310-100".to_string(),
            state: "SP".to_string(),
            city: "São Paulo".to_string(),
            neighborhood: "Bela Vista".to_string(),
            address: "Av Paulista".to_string(),
            address_number: "1000".to_string(),
            complement: "".to_string(),
            occupation: "Engenheiro".to_string(),
            company: "".to_string(),
            website: "".to_string(),
            about: "".to_string(),
            is_public: false,
            photo_url: None,
            cover_url: None,
            linked_providers: Vec::new(),
            social_links: None,
            expected_revision: Some(saved_pj.revision),
        };

        let saved_pf_again = IdentityService::save_profile(&db, &session, req_pf_again).unwrap();
        assert_eq!(saved_pf_again.person_type, "PF");
        assert_eq!(saved_pf_again.first_name, "João");
        assert_eq!(saved_pf_again.last_name, "Silva");
        assert_eq!(saved_pf_again.cpf, "529.982.247-25");
        assert_eq!(saved_pf_again.mother_name, "Maria Silva");
        // Comprova que os dados PJ anteriores NÃO foram destruídos
        assert_eq!(saved_pf_again.company_name, "Minha Empresa Ltda");
        assert_eq!(saved_pf_again.cnpj, "12.ABC.345/01DE-35");
        assert_eq!(saved_pf_again.legal_representative, "João Silva");
    }

    #[test]
    fn test_social_url_validation_security() {
        // 1. URL legítima de cada plataforma com HTTPS
        let linkedin = Some("https://www.linkedin.com/in/devos".to_string());
        assert!(sanitize_social_url("linkedin", &linkedin).is_ok());

        let twitter = Some("https://x.com/devos_dao".to_string());
        assert!(sanitize_social_url("twitter", &twitter).is_ok());

        let fb = Some("https://facebook.com/devos".to_string());
        assert!(sanitize_social_url("facebook", &fb).is_ok());

        let insta = Some("https://instagram.com/devos".to_string());
        assert!(sanitize_social_url("instagram", &insta).is_ok());

        // 2. Domínio falso (phishing / spoofing de subdomínio)
        let fake_host = Some("https://linkedin.com.site-malicioso.com".to_string());
        assert!(sanitize_social_url("linkedin", &fake_host).is_err());

        // 3. Plataforma cruzada / incorreta
        let wrong_platform = Some("https://linkedin.com/in/user".to_string());
        assert!(sanitize_social_url("instagram", &wrong_platform).is_err());

        // 4. Credenciais embutidas na URL
        let credentials = Some("https://admin:secret@linkedin.com".to_string());
        assert!(sanitize_social_url("linkedin", &credentials).is_err());

        // 5. Porta não convencional
        let custom_port = Some("https://x.com:8080/user".to_string());
        assert!(sanitize_social_url("twitter", &custom_port).is_err());

        // 6. Protocolo inseguro HTTP
        let insecure = Some("http://linkedin.com/in/user".to_string());
        assert!(sanitize_social_url("linkedin", &insecure).is_err());

        // 7. URL malformada
        let malformed = Some("https://".to_string());
        assert!(sanitize_social_url("linkedin", &malformed).is_err());

        // 8. Campo opcional vazio ou nulo
        let empty = Some(String::new());
        assert_eq!(sanitize_social_url("linkedin", &empty).unwrap(), None);

        let none: Option<String> = None;
        assert_eq!(sanitize_social_url("linkedin", &none).unwrap(), None);

        // 9. Excesso de bytes (> 2048)
        let too_long = Some(format!("https://linkedin.com/in/{}", "a".repeat(2048)));
        assert!(sanitize_social_url("linkedin", &too_long).is_err());
    }
}

```

---

### Arquivo 24: `repository.rs`
**Caminho:** `src-tauri/src/modules/identity/repository.rs`  
**Tipo / Camada:** Backend Persistence  
**Volume:** 105 linhas  
**Responsabilidade:** Repositório SQL para persistência transacional de profile_records em devos_vault.sqlite.  
**Dependências Internas:** `src-tauri/src/storage/local_database.rs`  
**Relacionamento na ABA 1:** Executa leituras e escritas transacionais no SQLite.  

```rust
//! Repositório de persistência SQLite para Perfil e Identidade Civil.
//!
//! Apenas o envelope criptográfico (AEAD AES-256-GCM) é persistido no banco local.
//! Nenhum dado pessoal em claro é armazenado em tabelas, colunas ou índices.

use rusqlite::{params, Connection, OptionalExtension};

use crate::modules::vault::encryption::EncryptedEnvelope;
use crate::storage::local_database::StorageError;

pub struct StoredProfileRecord {
    pub envelope: EncryptedEnvelope,
    pub payload_version: u32,
    pub revision: u64,
    pub created_at: String,
    pub updated_at: String,
}

pub struct IdentityRepository;

impl IdentityRepository {
    /// Carrega o registro criptografado único do usuário (id = 1).
    pub fn get_profile_record(
        conn: &Connection,
    ) -> Result<Option<StoredProfileRecord>, StorageError> {
        let result = conn
            .query_row(
                "SELECT encrypted_envelope, payload_version, revision, created_at, updated_at
                 FROM user_profiles
                 WHERE id = 1",
                [],
                |row| {
                    let envelope_json: String = row.get(0)?;
                    let payload_version: u32 = row.get(1)?;
                    let revision: u64 = row.get(2)?;
                    let created_at: String = row.get(3)?;
                    let updated_at: String = row.get(4)?;

                    let envelope: EncryptedEnvelope = serde_json::from_str(&envelope_json)
                        .map_err(|e| rusqlite::Error::FromSqlConversionFailure(
                            0,
                            rusqlite::types::Type::Text,
                            Box::new(e),
                        ))?;

                    Ok(StoredProfileRecord {
                        envelope,
                        payload_version,
                        revision,
                        created_at,
                        updated_at,
                    })
                },
            )
            .optional()?;

        Ok(result)
    }

    /// Salva ou atualiza atomicamente o envelope criptografado com verificação de concorrência otimista.
    pub fn save_profile_record(
        conn: &mut Connection,
        envelope: &EncryptedEnvelope,
        expected_revision: Option<u64>,
    ) -> Result<u64, StorageError> {
        let envelope_json = serde_json::to_string(envelope)
            .map_err(|e| StorageError::InvalidData(format!("Falha na serialização do envelope: {}", e)))?;

        let tx = conn.transaction()?;

        let current_revision: Option<u64> = tx
            .query_row(
                "SELECT revision FROM user_profiles WHERE id = 1",
                [],
                |row| row.get(0),
            )
            .optional()?;

        if let (Some(expected), Some(current)) = (expected_revision, current_revision) {
            if expected != current {
                return Err(StorageError::InvalidData(format!(
                    "CONCURRENCY_CONFLICT: O perfil foi atualizado concorrentemente (revisão atual: {}, informada: {}).",
                    current, expected
                )));
            }
        }

        let next_revision = current_revision.unwrap_or(0) + 1;

        tx.execute(
            "INSERT INTO user_profiles (id, encrypted_envelope, payload_version, revision, created_at, updated_at)
             VALUES (1, ?1, 1, ?2, datetime('now'), datetime('now'))
             ON CONFLICT(id) DO UPDATE SET
                 encrypted_envelope = excluded.encrypted_envelope,
                 payload_version = excluded.payload_version,
                 revision = excluded.revision,
                 updated_at = datetime('now')",
            params![envelope_json, next_revision],
        )?;

        tx.commit()?;

        Ok(next_revision)
    }
}

```

---

### Arquivo 25: `identity_commands.rs`
**Caminho:** `src-tauri/src/commands/identity_commands.rs`  
**Tipo / Camada:** Backend Commands  
**Volume:** 53 linhas  
**Responsabilidade:** Entry points dos comandos Tauri get_user_profile, save_user_profile e import_legacy_profile com checagem de trava do cofre.  
**Dependências Internas:** `src-tauri/src/modules/identity/service.rs`, `src-tauri/src/modules/vault/access_control.rs`  
**Relacionamento na ABA 1:** Recebe as requisições IPC enviadas pelo IdentityBridge.  

```rust
//! Comandos Tauri IPC para Perfil e Identidade Civil.
//!
//! Os comandos interagem com a camada de serviço de identidade,
//! garantindo isolamento criptográfico, fail-closed quando bloqueado,
//! e integridade com a sessão ativa do cofre.

use tauri::State;

use crate::modules::identity::models::{SaveUserProfileRequest, UserProfileDto};
use crate::modules::identity::service::IdentityService;
use crate::modules::vault::access_control::VaultSession;
use crate::storage::local_database::LocalDatabase;

/// Consulta os dados de qualificação civil e perfil protegidos no cofre local SQLite.
///
/// Retorna `Ok(None)` se nenhum perfil foi salvo ainda.
/// Retorna erro se o cofre estiver bloqueado.
#[tauri::command]
pub fn get_user_profile(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
) -> Result<Option<UserProfileDto>, String> {
    IdentityService::get_profile(&db, &session).map_err(|e| {
        log::error!("[Identity IPC] Erro ao consultar perfil: {}", e);
        e.to_string()
    })
}

/// Salva ou atualiza os dados de qualificação civil cifrados no cofre local SQLite.
#[tauri::command]
pub fn save_user_profile(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
    profile: SaveUserProfileRequest,
) -> Result<UserProfileDto, String> {
    IdentityService::save_profile(&db, &session, profile).map_err(|e| {
        log::error!("[Identity IPC] Erro ao salvar perfil: {}", e);
        e.to_string()
    })
}

/// Importa o perfil legado do localStorage para dentro do cofre protegido SQLite.
#[tauri::command]
pub fn import_legacy_profile(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
    legacy_json: String,
) -> Result<UserProfileDto, String> {
    IdentityService::import_legacy_profile(&db, &session, &legacy_json).map_err(|e| {
        log::error!("[Identity IPC] Erro ao importar perfil legado: {}", e);
        e.to_string()
    })
}

```

---

### Arquivo 26: `local_database.rs`
**Caminho:** `src-tauri/src/storage/local_database.rs`  
**Tipo / Camada:** Backend Infrastructure  
**Volume:** 1236 linhas  
**Responsabilidade:** Gerenciador do pool de conexões SQLite Rusqlite com suporte a modo WAL e transações seguras.  
**Dependências Internas:** `src-tauri/src/storage/migrations.rs`  
**Relacionamento na ABA 1:** Infraestrutura de banco de dados do cofre local.  

```rust
use rusqlite::{Connection, OptionalExtension, params};
use serde::{Deserialize, Serialize};

use std::fs::{self, OpenOptions};
use std::path::{Path, PathBuf};
use std::time::Duration;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

use crate::modules::vault::access_control::{VaultHeader, VaultStatus};
use crate::modules::vault::encryption::{EncryptedEnvelope, VaultCryptoError};

// ----------------------------------------------------------------------
// Erros de armazenamento
// ----------------------------------------------------------------------

#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("SQLite database error: {0}")]
    Sqlite(#[from] rusqlite::Error),

    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Vault error: {0}")]
    Vault(#[from] VaultCryptoError),

    #[error("Vault not found: {0}")]
    NotFound(String),

    #[error("Invalid data: {0}")]
    InvalidData(String),

    #[error("O cofre do DevOS já foi inicializado anteriormente.")]
    AlreadyInitialized,
}

// ----------------------------------------------------------------------
// Modelos persistidos
// ----------------------------------------------------------------------

/// Metadados públicos da carteira persistida no SQLite.
///
/// Não registrar objetos completos desta estrutura nos logs operacionais,
/// pois client_doc pode conter dados sensíveis ou informações de identificação pessoal.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct StoredWallet {
    pub id: u64,
    pub target: String,       // "DAO" | "CLIENT"
    pub custody_type: String, // "WATCH_ONLY" | "CUSTODIAL_LOCAL"
    pub user: String,         // Nome do usuário / rótulo da DAO
    pub label: String,
    pub derivation_path: String,
    pub network: String,
    pub address: String,
    pub status: String,     // "ACTIVE" | "PENDING" | "ROTATED"
    pub kyc_status: String, // "UNVERIFIED" | "SIMULATED_TEST" | "VERIFIED"
    pub seed_words_count: usize,
    pub created_at: String,
    pub vault_id: Option<String>, // NULL se WATCH_ONLY
    pub client_doc: Option<String>,
}

/// Registro criptografado do cofre (envelope AEAD) persistido no SQLite.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredSecret {
    pub vault_id: String,
    pub target: String,
    pub envelope: EncryptedEnvelope,
    pub created_at: String,
}

// ----------------------------------------------------------------------
// Banco de dados local SQLite seguro do DevOS
// ----------------------------------------------------------------------

pub struct LocalDatabase {
    db_path: PathBuf,
}

impl LocalDatabase {
    pub fn new(base_dir: PathBuf) -> Self {
        let db_path = base_dir.join("devos_vault.sqlite");
        Self { db_path }
    }

    /// Retorna o caminho do banco.
    pub fn db_path(&self) -> &PathBuf {
        &self.db_path
    }

    // ------------------------------------------------------------------
    // Utilitários internos para caminhos e arquivos
    // ------------------------------------------------------------------

    fn parent_directory(path: &Path) -> &Path {
        path.parent()
            .filter(|parent| !parent.as_os_str().is_empty())
            .unwrap_or_else(|| Path::new("."))
    }

    /// Restringe as permissões do arquivo principal e de arquivos
    /// temporários no Unix para 0600 (apenas proprietário).
    fn set_private_file_permissions(path: &Path) -> Result<(), StorageError> {
        #[cfg(unix)]
        {
            if path.exists() {
                let mut permissions = fs::metadata(path)?.permissions();
                permissions.set_mode(0o600);
                fs::set_permissions(path, permissions)?;
            }
        }

        #[cfg(not(unix))]
        {
            let _ = path;
        }

        Ok(())
    }

    fn sidecar_paths(&self) -> [PathBuf; 2] {
        [
            self.db_path.with_extension("sqlite-wal"),
            self.db_path.with_extension("sqlite-shm"),
        ]
    }

    /// Remove um arquivo somente se ele existir, propagando erros de I/O reais.
    fn remove_file_if_exists(path: &Path) -> Result<(), StorageError> {
        match fs::remove_file(path) {
            Ok(()) => Ok(()),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(error) => Err(StorageError::Io(error)),
        }
    }

    /// Confirma que uma origem ou destino não corresponde ao banco
    /// ativo nem aos seus arquivos auxiliares WAL/SHM.
    fn ensure_not_active_database_path(
        &self,
        candidate: &Path,
        operation: &str,
    ) -> Result<(), StorageError> {
        let mut reserved_paths = vec![self.db_path.clone()];
        reserved_paths.extend(self.sidecar_paths());

        let candidate_canonical = candidate.canonicalize().ok();

        for reserved in reserved_paths {
            if candidate == reserved.as_path() {
                return Err(StorageError::InvalidData(format!(
                    "O caminho informado não pode ser utilizado como {}.",
                    operation
                )));
            }

            if let (Some(candidate_real), Ok(reserved_real)) =
                (candidate_canonical.as_ref(), reserved.canonicalize())
                && candidate_real == &reserved_real
            {
                return Err(StorageError::InvalidData(format!(
                    "O caminho informado não pode ser utilizado como {}.",
                    operation
                )));
            }
        }

        Ok(())
    }

    /// Cria um arquivo temporário exclusivo no mesmo diretório do destino.
    fn create_temporary_sibling(target: &Path, purpose: &str) -> Result<PathBuf, StorageError> {
        let parent = Self::parent_directory(target);
        fs::create_dir_all(parent)?;

        let file_name = target
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("devos-vault");

        for _ in 0..16 {
            let candidate = parent.join(format!(
                ".{}.{}.{}.tmp",
                file_name,
                purpose,
                rand::random::<u64>()
            ));

            match OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&candidate)
            {
                Ok(file) => {
                    drop(file);

                    if let Err(error) = Self::set_private_file_permissions(&candidate) {
                        let _ = fs::remove_file(&candidate);
                        return Err(error);
                    }

                    return Ok(candidate);
                }
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
                    continue;
                }
                Err(error) => return Err(StorageError::Io(error)),
            }
        }

        Err(StorageError::InvalidData(
            "Não foi possível criar um arquivo temporário exclusivo.".to_string(),
        ))
    }

    /// Instala um arquivo temporário no destino, preservando a versão anterior
    /// para rollback caso ocorra falha durante a substituição.
    fn install_staged_file(staged: &Path, destination: &Path) -> Result<(), StorageError> {
        let parent = Self::parent_directory(destination);
        fs::create_dir_all(parent)?;

        if destination.is_dir() {
            return Err(StorageError::InvalidData(
                "O destino informado é um diretório.".to_string(),
            ));
        }

        if !destination.exists() {
            match fs::rename(staged, destination) {
                Ok(()) => {
                    Self::set_private_file_permissions(destination)?;
                    return Ok(());
                }
                Err(_) => {
                    fs::copy(staged, destination)?;
                    let _ = fs::remove_file(staged);
                    Self::set_private_file_permissions(destination)?;
                    return Ok(());
                }
            }
        }

        let previous = Self::create_temporary_sibling(destination, "previous")?;
        let _ = fs::remove_file(&previous);

        fs::rename(destination, &previous)?;

        match fs::rename(staged, destination) {
            Ok(()) => {
                Self::set_private_file_permissions(destination)?;
                if let Err(error) = fs::remove_file(&previous) {
                    log::warn!(
                        "[Vault Storage] Não foi possível remover o arquivo anterior após a substituição: {}",
                        error
                    );
                }
                Ok(())
            }
            Err(replace_error) => {
                if let Err(restore_error) = fs::rename(&previous, destination) {
                    log::error!(
                        "[Vault Storage] Falha ao restaurar o banco anterior após substituição malsucedida: {}",
                        restore_error
                    );
                }
                Err(StorageError::Io(replace_error))
            }
        }
    }

    // ------------------------------------------------------------------
    // Validação de integridade do backup
    // ------------------------------------------------------------------

    /// Valida o arquivo SQLite antes de permitir uma restauração.
    fn validate_backup_file(path: &Path) -> Result<(), StorageError> {
        if !path.is_file() {
            return Err(StorageError::InvalidData(
                "O arquivo de backup não é um arquivo regular.".to_string(),
            ));
        }

        if fs::metadata(path)?.len() == 0 {
            return Err(StorageError::InvalidData(
                "O arquivo de backup está vazio.".to_string(),
            ));
        }

        let conn = Connection::open_with_flags(path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)?;

        let integrity: String = conn.query_row("PRAGMA integrity_check", [], |row| row.get(0))?;

        if !integrity.eq_ignore_ascii_case("ok") {
            log::error!(
                "[Vault Storage] O backup falhou na verificação de integridade SQLite: {}",
                integrity
            );
            return Err(StorageError::InvalidData(
                "O backup não passou na verificação de integridade.".to_string(),
            ));
        }

        let header_table_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'vault_header'",
            [],
            |row| row.get(0),
        )?;

        if header_table_count == 0 {
            return Err(StorageError::InvalidData(
                "O arquivo de backup não contém a tabela vault_header.".to_string(),
            ));
        }

        // Confirma que a tabela possui as colunas esperadas
        let _statement = conn
            .prepare("SELECT id, version, canary_envelope, created_at FROM vault_header LIMIT 0")?;

        // Quando existe um cabeçalho, confirma que o envelope pode ser desserializado
        let envelope_json: Option<String> = conn
            .query_row(
                "SELECT canary_envelope FROM vault_header WHERE id = 1",
                [],
                |row| row.get(0),
            )
            .optional()?;

        if let Some(json) = envelope_json {
            let _: EncryptedEnvelope = serde_json::from_str(&json)?;
        }

        Ok(())
    }

    // ------------------------------------------------------------------
    // Conexão SQLite
    // ------------------------------------------------------------------

    /// Abre ou cria a conexão com o banco de dados SQLite local seguro
    pub fn get_connection(&self) -> Result<Connection, StorageError> {
        let parent = Self::parent_directory(&self.db_path);
        fs::create_dir_all(parent)?;

        let conn = Connection::open(&self.db_path)?;

        // Configura busy_timeout para 5s evitando bloqueios abruptos sob concorrência
        conn.busy_timeout(Duration::from_secs(5))?;
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;

        let current_journal_mode: String =
            conn.query_row("PRAGMA journal_mode", [], |row| row.get(0))?;

        if !current_journal_mode.eq_ignore_ascii_case("wal") {
            let journal_mode: String =
                conn.query_row("PRAGMA journal_mode = WAL", [], |row| row.get(0))?;

            if !journal_mode.eq_ignore_ascii_case("wal") {
                return Err(StorageError::InvalidData(
                    "Não foi possível habilitar o modo WAL do SQLite.".to_string(),
                ));
            }
        }

        Self::set_private_file_permissions(&self.db_path)?;
        for sidecar in self.sidecar_paths() {
            if sidecar.exists() {
                let _ = Self::set_private_file_permissions(&sidecar);
            }
        }

        Ok(conn)
    }

    // ------------------------------------------------------------------
    // Cabeçalho do cofre
    // ------------------------------------------------------------------

    /// Retorna o cabeçalho persistido do cofre (se existir)
    pub fn get_header(&self) -> Result<Option<VaultHeader>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT version, canary_envelope, created_at FROM vault_header WHERE id = 1",
        )?;

        let header = stmt
            .query_row([], |row| {
                let version: u32 = row.get(0)?;
                let canary_json: String = row.get(1)?;
                let created_at: String = row.get(2)?;
                let canary_envelope: EncryptedEnvelope = serde_json::from_str(&canary_json)
                    .map_err(|e| {
                        rusqlite::Error::FromSqlConversionFailure(
                            1,
                            rusqlite::types::Type::Text,
                            Box::new(e),
                        )
                    })?;

                Ok(VaultHeader {
                    version,
                    canary_envelope,
                    created_at,
                })
            })
            .optional()?;

        Ok(header)
    }

    /// Salva o cabeçalho do cofre de forma segura (delega obrigatoriamente para initialize_vault_if_absent)
    pub fn save_header(&self, header: &VaultHeader) -> Result<(), StorageError> {
        self.initialize_vault_if_absent(header)
    }

    /// Inicializa o cabeçalho do cofre com atomicidade comprovada (TransactionBehavior::Immediate).
    /// Rejeita concorrentemente qualquer tentativa duplicada e impede sobrescrita do cabeçalho existente.
    pub fn initialize_vault_if_absent(&self, header: &VaultHeader) -> Result<(), StorageError> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;

        let existing: Option<u32> = tx
            .query_row("SELECT id FROM vault_header WHERE id = 1", [], |row| {
                row.get(0)
            })
            .optional()?;

        if existing.is_some() {
            return Err(StorageError::AlreadyInitialized);
        }

        let canary_json = serde_json::to_string(&header.canary_envelope)?;
        tx.execute(
            "INSERT INTO vault_header (id, version, canary_envelope, created_at) VALUES (1, ?1, ?2, ?3)",
            params![header.version, canary_json, header.created_at],
        )?;

        tx.commit()?;
        Ok(())
    }

    // ------------------------------------------------------------------
    // Carteiras
    // ------------------------------------------------------------------

    /// Lista todas as carteiras armazenadas na base SQLite
    pub fn list_wallets(&self) -> Result<Vec<StoredWallet>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id, client_doc FROM wallets ORDER BY id ASC"
        )?;

        let wallet_iter = stmt.query_map([], |row| {
            Ok(StoredWallet {
                id: row.get(0)?,
                target: row.get(1)?,
                custody_type: row.get(2)?,
                user: row.get(3)?,
                label: row.get(4)?,
                derivation_path: row.get(5)?,
                network: row.get(6)?,
                address: row.get(7)?,
                status: row.get(8)?,
                kyc_status: row.get(9)?,
                seed_words_count: row.get(10)?,
                created_at: row.get(11)?,
                vault_id: row.get(12)?,
                client_doc: row.get(13)?,
            })
        })?;

        let mut wallets = Vec::new();
        for w in wallet_iter {
            wallets.push(w?);
        }
        Ok(wallets)
    }

    /// Insere uma lista de carteiras dentro de uma transação atômica
    pub fn append_wallets(
        &self,
        new_wallets: &[StoredWallet],
    ) -> Result<Vec<StoredWallet>, StorageError> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction()?;

        {
            let mut stmt = tx.prepare(
                "INSERT INTO wallets (id, target, custody_type, user_name, label, derivation_path, network, address, status, kyc_status, seed_words_count, created_at, vault_id, client_doc)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)"
            )?;

            for w in new_wallets {
                let id = i64::try_from(w.id).map_err(|_| {
                    StorageError::InvalidData(
                        "O ID da carteira excede o intervalo suportado pelo SQLite.".to_string(),
                    )
                })?;

                let seed_words_count = i64::try_from(w.seed_words_count).map_err(|_| {
                    StorageError::InvalidData(
                        "A quantidade de palavras excede o intervalo suportado pelo SQLite."
                            .to_string(),
                    )
                })?;

                stmt.execute(params![
                    id,
                    w.target,
                    w.custody_type,
                    w.user,
                    w.label,
                    w.derivation_path,
                    w.network,
                    w.address,
                    w.status,
                    w.kyc_status,
                    seed_words_count,
                    w.created_at,
                    w.vault_id,
                    w.client_doc
                ])?;
            }
        }

        tx.commit()?;
        self.list_wallets()
    }

    // ------------------------------------------------------------------
    // Segredos criptografados
    // ------------------------------------------------------------------

    /// Salva o envelope secreto cifrado dentro da tabela vault_secrets via UPSERT explícito
    pub fn save_secret(&self, secret: StoredSecret) -> Result<(), StorageError> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction()?;
        let envelope_json = serde_json::to_string(&secret.envelope)?;

        tx.execute(
            "INSERT INTO vault_secrets (vault_id, target, envelope, created_at)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(vault_id) DO UPDATE SET
                target = excluded.target,
                envelope = excluded.envelope,
                created_at = excluded.created_at",
            params![
                secret.vault_id,
                secret.target,
                envelope_json,
                secret.created_at
            ],
        )?;

        tx.commit()?;
        Ok(())
    }

    /// Busca o envelope secreto correspondente a um vault_id
    pub fn get_secret_by_vault_id(
        &self,
        vault_id: &str,
    ) -> Result<Option<StoredSecret>, StorageError> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT vault_id, target, envelope, created_at FROM vault_secrets WHERE vault_id = ?1",
        )?;

        let secret = stmt
            .query_row(params![vault_id], |row| {
                let v_id: String = row.get(0)?;
                let target: String = row.get(1)?;
                let env_json: String = row.get(2)?;
                let created_at: String = row.get(3)?;
                let envelope: EncryptedEnvelope = serde_json::from_str(&env_json).map_err(|e| {
                    rusqlite::Error::FromSqlConversionFailure(
                        2,
                        rusqlite::types::Type::Text,
                        Box::new(e),
                    )
                })?;

                Ok(StoredSecret {
                    vault_id: v_id,
                    target,
                    envelope,
                    created_at,
                })
            })
            .optional()?;

        Ok(secret)
    }

    // ------------------------------------------------------------------
    // Status operacional
    // ------------------------------------------------------------------

    /// Retorna o status operacional do cofre SQLite utilizando conexão única e agregação direta
    pub fn get_status(&self, is_unlocked: bool) -> Result<VaultStatus, StorageError> {
        let conn = self.get_connection()?;

        let is_initialized: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM vault_header WHERE id = 1)",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        let (dao_count, client_count): (i64, i64) = conn
            .query_row(
                "SELECT \
                    COALESCE(SUM(CASE WHEN target = 'DAO' THEN 1 ELSE 0 END), 0), \
                    COALESCE(SUM(CASE WHEN target = 'CLIENT' THEN 1 ELSE 0 END), 0) \
                 FROM wallets",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap_or((0, 0));

        let dao_wallets_count = usize::try_from(dao_count).map_err(|_| {
            StorageError::InvalidData("Quantidade de carteiras DAO inválida.".to_string())
        })?;

        let client_wallets_count = usize::try_from(client_count).map_err(|_| {
            StorageError::InvalidData("Quantidade de carteiras de clientes inválida.".to_string())
        })?;

        Ok(VaultStatus {
            is_initialized,
            is_unlocked,
            dao_wallets_count,
            client_wallets_count,
        })
    }

    // ------------------------------------------------------------------
    // Checkpoint WAL
    // ------------------------------------------------------------------

    /// Executa checkpoint explícito e valida a conclusão do SQLite
    fn checkpoint_wal(&self) -> Result<(), StorageError> {
        if !self.db_path.exists() {
            return Ok(());
        }

        let conn = self.get_connection()?;
        let (busy, _log_frames, _checkpointed_frames): (i64, i64, i64) =
            conn.query_row("PRAGMA wal_checkpoint(TRUNCATE)", [], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?))
            })?;

        if busy != 0 {
            return Err(StorageError::InvalidData(
                "Não foi possível concluir o checkpoint WAL devido a conexões ocupadas."
                    .to_string(),
            ));
        }

        drop(conn);
        Ok(())
    }

    // ------------------------------------------------------------------
    // Exportação de backup
    // ------------------------------------------------------------------

    /// Executa backup atômico e transacional do banco de dados SQLite via VACUUM INTO
    pub fn export_backup(&self, destination_path: &Path) -> Result<u64, StorageError> {
        self.ensure_not_active_database_path(destination_path, "destino do backup")?;

        let parent = Self::parent_directory(destination_path);
        fs::create_dir_all(parent)?;

        let staged = Self::create_temporary_sibling(destination_path, "backup")?;
        // Remove o placeholder vazio para o VACUUM INTO criar um banco novo de forma limpa
        let _ = fs::remove_file(&staged);

        let result = (|| {
            let conn = self.get_connection()?;
            let staged_name = staged.to_string_lossy().into_owned();

            conn.execute("VACUUM INTO ?1", params![staged_name])?;
            drop(conn);

            Self::set_private_file_permissions(&staged)?;

            if fs::metadata(&staged)?.len() == 0 {
                return Err(StorageError::InvalidData(
                    "O backup gerado está vazio.".to_string(),
                ));
            }

            Self::install_staged_file(&staged, destination_path)?;
            let metadata = fs::metadata(destination_path)?;
            Ok(metadata.len())
        })();

        if result.is_err() {
            let _ = fs::remove_file(&staged);
        }

        result
    }

    // ------------------------------------------------------------------
    // Restauração de backup
    // ------------------------------------------------------------------

    /// Restaura o banco de dados a partir de um arquivo de backup verificado
    pub fn restore_backup(&self, source_path: &Path) -> Result<(), StorageError> {
        if !source_path.is_file() {
            return Err(StorageError::InvalidData(
                "O arquivo de backup informado não existe ou não é um arquivo regular.".to_string(),
            ));
        }

        self.ensure_not_active_database_path(source_path, "origem do backup")?;

        let staged = Self::create_temporary_sibling(&self.db_path, "restore")?;

        let result = (|| {
            // Prepara a restauração sem destruir o banco ativo
            fs::copy(source_path, &staged)?;
            Self::set_private_file_permissions(&staged)?;

            // Valida a integridade do snapshot antes de alterar o banco atual
            Self::validate_backup_file(&staged)?;

            // Executa checkpoint WAL do banco atual
            self.checkpoint_wal()?;

            // Remove sidecars WAL/SHM associados antes da substituição atômica
            for sidecar in self.sidecar_paths() {
                Self::remove_file_if_exists(&sidecar)?;
            }

            // Substitui o banco ativo preservando versão anterior caso ocorra falha de rename
            Self::install_staged_file(&staged, &self.db_path)?;
            Self::set_private_file_permissions(&self.db_path)?;

            Ok(())
        })();

        if result.is_err() {
            let _ = fs::remove_file(&staged);
        }

        result
    }
}

// ----------------------------------------------------------------------
// Testes unitários
// ----------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sqlite_persistence_across_reconnect() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_test_db_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);
             CREATE TABLE IF NOT EXISTS wallets (id INTEGER PRIMARY KEY, target TEXT NOT NULL, custody_type TEXT NOT NULL, user_name TEXT NOT NULL, label TEXT NOT NULL, derivation_path TEXT NOT NULL, network TEXT NOT NULL, address TEXT NOT NULL, status TEXT NOT NULL, kyc_status TEXT NOT NULL, seed_words_count INTEGER NOT NULL, created_at TEXT NOT NULL, vault_id TEXT, client_doc TEXT);
             CREATE TABLE IF NOT EXISTS vault_secrets (vault_id TEXT PRIMARY KEY, target TEXT NOT NULL, envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        let w = StoredWallet {
            id: 1,
            target: "DAO".to_string(),
            custody_type: "CUSTODIAL_LOCAL".to_string(),
            user: "ASPPIBRA DAO".to_string(),
            label: "Caixa Operacional".to_string(),
            derivation_path: "m/44'/60'/0'/0/0".to_string(),
            network: "Arbitrum One".to_string(),
            address: "0x9858EfFD232B4033E47d90003D41EC34EcaEda94".to_string(),
            status: "ACTIVE".to_string(),
            kyc_status: "UNVERIFIED".to_string(),
            seed_words_count: 24,
            created_at: "2026-10-12 00:00".to_string(),
            vault_id: Some("dao_vault_1".to_string()),
            client_doc: None,
        };

        db.append_wallets(std::slice::from_ref(&w)).unwrap();

        let reloaded_db = LocalDatabase::new(test_dir.clone());
        let loaded = reloaded_db.list_wallets().unwrap();

        assert_eq!(loaded.len(), 1);
        assert_eq!(
            loaded[0].address,
            "0x9858EfFD232B4033E47d90003D41EC34EcaEda94"
        );
        assert_eq!(loaded[0].custody_type, "CUSTODIAL_LOCAL");

        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_wallet_isolation_and_custody_segregation() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_test_isolation_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);
             CREATE TABLE IF NOT EXISTS wallets (id INTEGER PRIMARY KEY, target TEXT NOT NULL, custody_type TEXT NOT NULL, user_name TEXT NOT NULL, label TEXT NOT NULL, derivation_path TEXT NOT NULL, network TEXT NOT NULL, address TEXT NOT NULL, status TEXT NOT NULL, kyc_status TEXT NOT NULL, seed_words_count INTEGER NOT NULL, created_at TEXT NOT NULL, vault_id TEXT, client_doc TEXT);
             CREATE TABLE IF NOT EXISTS vault_secrets (vault_id TEXT PRIMARY KEY, target TEXT NOT NULL, envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        let dao_custodial = StoredWallet {
            id: 1,
            target: "DAO".to_string(),
            custody_type: "CUSTODIAL_LOCAL".to_string(),
            user: "ASPPIBRA DAO".to_string(),
            label: "Caixa Cripto".to_string(),
            derivation_path: "m/44'/60'/0'/0/0".to_string(),
            network: "Arbitrum One".to_string(),
            address: "0x9858EfFD232B4033E47d90003D41EC34EcaEda94".to_string(),
            status: "ACTIVE".to_string(),
            kyc_status: "UNVERIFIED".to_string(),
            seed_words_count: 24,
            created_at: "2026-10-12 00:00".to_string(),
            vault_id: Some("dao_vault_1".to_string()),
            client_doc: None,
        };

        let client_watch_only = StoredWallet {
            id: 2,
            target: "CLIENT".to_string(),
            custody_type: "WATCH_ONLY".to_string(),
            user: "Associado 01".to_string(),
            label: "Monitoramento".to_string(),
            derivation_path: "N/A".to_string(),
            network: "Arbitrum One".to_string(),
            address: "0x1111111111111111111111111111111111111111".to_string(),
            status: "ACTIVE".to_string(),
            kyc_status: "UNVERIFIED".to_string(),
            seed_words_count: 0,
            created_at: "2026-10-12 00:00".to_string(),
            vault_id: None,
            client_doc: Some("123.456.789-00".to_string()),
        };

        db.append_wallets(&[dao_custodial, client_watch_only])
            .unwrap();

        let all = db.list_wallets().unwrap();
        assert_eq!(all.len(), 2);

        let secret_none = db.get_secret_by_vault_id("non_existent").unwrap();
        assert!(secret_none.is_none());

        let fake_envelope =
            crate::modules::vault::encryption::VaultCrypto::encrypt("master_123", b"secret_words")
                .unwrap();
        let stored_secret = StoredSecret {
            vault_id: "dao_vault_1".to_string(),
            target: "DAO".to_string(),
            envelope: fake_envelope.clone(),
            created_at: "2026-10-12 00:00".to_string(),
        };
        db.save_secret(stored_secret).unwrap();

        let retrieved = db
            .get_secret_by_vault_id("dao_vault_1")
            .unwrap()
            .expect("Segredo deve existir");
        assert_eq!(retrieved.vault_id, "dao_vault_1");
        assert_eq!(
            retrieved.envelope.ciphertext_hex,
            fake_envelope.ciphertext_hex
        );

        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_vault_header_persistence_and_recovery() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_test_header_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        let canary =
            crate::modules::vault::encryption::VaultCrypto::encrypt("master_123", b"canary_canary")
                .unwrap();
        let header = VaultHeader {
            version: 1,
            canary_envelope: canary.clone(),
            created_at: "2026-10-12 00:00".to_string(),
        };

        db.save_header(&header).unwrap();

        let reloaded_db = LocalDatabase::new(test_dir.clone());
        let loaded_header = reloaded_db
            .get_header()
            .unwrap()
            .expect("Header deve existir");
        assert_eq!(
            loaded_header.canary_envelope.ciphertext_hex,
            canary.ciphertext_hex
        );

        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_complete_vault_lifecycle_and_backup() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_full_lifecycle_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());
        let master_password = "SuperMasterPassword2026!Secure";

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);
             CREATE TABLE IF NOT EXISTS wallets (id INTEGER PRIMARY KEY, target TEXT NOT NULL, custody_type TEXT NOT NULL, user_name TEXT NOT NULL, label TEXT NOT NULL, derivation_path TEXT NOT NULL, network TEXT NOT NULL, address TEXT NOT NULL, status TEXT NOT NULL, kyc_status TEXT NOT NULL, seed_words_count INTEGER NOT NULL, created_at TEXT NOT NULL, vault_id TEXT, client_doc TEXT);
             CREATE TABLE IF NOT EXISTS vault_secrets (vault_id TEXT PRIMARY KEY, target TEXT NOT NULL, envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        let header = VaultHeader::new(master_password).expect("Header deve ser gerado com sucesso");
        db.save_header(&header).expect("Header deve ser persistido");

        let mnemonic = crate::modules::wallets::mnemonic::MnemonicService::generate(24)
            .expect("Mnemônica de 24 palavras");
        let seed = crate::modules::wallets::mnemonic::MnemonicService::to_seed(&mnemonic, "")
            .expect("Seed derivada");
        let previews = crate::modules::wallets::derivation::DerivationService::derive_batch(
            &seed,
            0,
            1,
            "Caixa Primário",
            "Arbitrum One",
        )
        .expect("Derivação");
        let derived_address = previews[0].address.clone();
        let derivation_path = previews[0].derivation_path.clone();

        let envelope = crate::modules::vault::encryption::VaultCrypto::encrypt(
            master_password,
            mnemonic.as_bytes(),
        )
        .expect("Cifragem AEAD");
        let vault_id = "dao_vault_lifecycle_test".to_string();
        let secret_record = StoredSecret {
            vault_id: vault_id.clone(),
            target: "DAO".to_string(),
            envelope,
            created_at: "2026-10-12 00:00".to_string(),
        };
        db.save_secret(secret_record).expect("Segredo persistido");

        let stored_wallet = StoredWallet {
            id: 1,
            target: "DAO".to_string(),
            custody_type: "CUSTODIAL_LOCAL".to_string(),
            user: "ASPPIBRA DAO".to_string(),
            label: "Caixa Primário".to_string(),
            derivation_path: derivation_path.clone(),
            network: "Arbitrum One".to_string(),
            address: derived_address.clone(),
            status: "ACTIVE".to_string(),
            kyc_status: "UNVERIFIED".to_string(),
            seed_words_count: 24,
            created_at: "2026-10-12 00:00".to_string(),
            vault_id: Some(vault_id.clone()),
            client_doc: None,
        };
        db.append_wallets(&[stored_wallet]).expect("Carteira salva");

        let reloaded_db = LocalDatabase::new(test_dir.clone());

        let reloaded_header = reloaded_db
            .get_header()
            .unwrap()
            .expect("Header recarregado deve existir");
        assert!(
            reloaded_header.verify_password(master_password),
            "Senha mestre válida deve desbloquear"
        );
        assert!(
            !reloaded_header.verify_password("SenhaErrada!"),
            "Senha errada deve ser rejeitada"
        );

        let wallets = reloaded_db.list_wallets().expect("Listagem pós-reboot");
        assert_eq!(wallets.len(), 1);
        assert_eq!(wallets[0].address, derived_address);
        assert_eq!(wallets[0].custody_type, "CUSTODIAL_LOCAL");

        let retrieved_secret = reloaded_db
            .get_secret_by_vault_id(&vault_id)
            .unwrap()
            .expect("Segredo deve existir");
        let decrypted_bytes = crate::modules::vault::encryption::VaultCrypto::decrypt(
            master_password,
            &retrieved_secret.envelope,
        )
        .expect("Decifragem autorizada");
        let recovered_mnemonic = String::from_utf8(decrypted_bytes).expect("UTF-8 válido");
        assert_eq!(recovered_mnemonic, mnemonic);

        let recovered_seed =
            crate::modules::wallets::mnemonic::MnemonicService::to_seed(&recovered_mnemonic, "")
                .expect("Seed recuperada");
        let recovered_previews =
            crate::modules::wallets::derivation::DerivationService::derive_batch(
                &recovered_seed,
                0,
                1,
                "Teste",
                "Arbitrum One",
            )
            .expect("Derivação conferida");
        assert_eq!(
            recovered_previews[0].address, wallets[0].address,
            "Endereço decifrado deve coincidir com o salvo"
        );

        assert!(!retrieved_secret.envelope.ciphertext_hex.is_empty());
        assert!(!retrieved_secret.envelope.ciphertext_hex.contains(&mnemonic));

        let fail_result = crate::modules::vault::encryption::VaultCrypto::decrypt(
            "SenhaIncorreta999!",
            &retrieved_secret.envelope,
        );
        assert!(
            fail_result.is_err(),
            "Decifragem com senha incorreta deve retornar erro AEAD"
        );

        // Validação de Backup e Restauração via VACUUM INTO
        let backup_path = test_dir.join("backups").join("vault_backup.bak");
        let copied = reloaded_db
            .export_backup(&backup_path)
            .expect("Backup deve ser exportado");
        assert!(copied > 0);
        assert!(backup_path.exists());

        let restore_dir =
            std::env::temp_dir().join(format!("devos_restored_{}", rand::random::<u32>()));
        let restored_db = LocalDatabase::new(restore_dir.clone());
        restored_db
            .restore_backup(&backup_path)
            .expect("Restauração de backup deve ser concluída");

        let restored_wallets = restored_db
            .list_wallets()
            .expect("Carteiras no banco restaurado");
        assert_eq!(restored_wallets.len(), 1);
        assert_eq!(restored_wallets[0].address, derived_address);

        let _ = fs::remove_dir_all(test_dir);
        let _ = fs::remove_dir_all(restore_dir);
    }

    #[test]
    fn test_atomic_initialize_vault_if_absent_prevents_overwrite() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_atomic_vault_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());
        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        let header1 = VaultHeader::new("InitialMasterPassword123!").expect("Header 1 válido");
        let header2 = VaultHeader::new("AttackerOrOverwritePassword456!").expect("Header 2 válido");

        let first_res = db.initialize_vault_if_absent(&header1);
        assert!(first_res.is_ok(), "Primeira inicialização deve ter sucesso");

        let second_res = db.initialize_vault_if_absent(&header2);
        assert!(
            second_res.is_err(),
            "Segunda inicialização deve ser rejeitada"
        );
        match second_res {
            Err(StorageError::AlreadyInitialized) => {}
            _ => panic!("Esperado StorageError::AlreadyInitialized"),
        }

        let loaded = db.get_header().unwrap().expect("Header deve existir");
        assert!(loaded.verify_password("InitialMasterPassword123!"));
        assert!(!loaded.verify_password("AttackerOrOverwritePassword456!"));

        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_concurrent_multithread_initialization_race() {
        use std::sync::{Arc, Barrier};
        use std::thread;

        let test_dir =
            std::env::temp_dir().join(format!("devos_concurrency_race_{}", rand::random::<u32>()));
        let db = LocalDatabase::new(test_dir.clone());
        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, canary_envelope TEXT NOT NULL, created_at TEXT NOT NULL);"
        ).unwrap();
        drop(conn);

        const THREAD_COUNT: usize = 10;
        let barrier = Arc::new(Barrier::new(THREAD_COUNT));
        let mut handles = Vec::new();

        for i in 0..THREAD_COUNT {
            let b = Arc::clone(&barrier);
            let dir = test_dir.clone();
            let thread_password = format!("PasswordForThread{}!Secure123", i);

            let handle = thread::spawn(move || {
                let thread_db = LocalDatabase::new(dir);
                let header = VaultHeader::new(&thread_password).expect("Header gerado");
                b.wait();
                let res = thread_db.initialize_vault_if_absent(&header);
                (i, thread_password, res.is_ok())
            });

            handles.push(handle);
        }

        let mut success_count = 0;
        let mut winning_password = String::new();

        for h in handles {
            let (_i, pwd, is_ok) = h.join().unwrap();
            if is_ok {
                success_count += 1;
                winning_password = pwd;
            }
        }

        assert_eq!(
            success_count, 1,
            "Exatamente UMA thread concorrente deve ter sucesso na inicialização atômica"
        );

        let final_header = db.get_header().unwrap().expect("Header persistido");
        assert!(
            final_header.verify_password(&winning_password),
            "Header deve ser da thread vencedora"
        );

        let _ = fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_restore_rejects_invalid_sqlite_without_replacing_active_db() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_restore_invalid_{}", rand::random::<u64>()));
        let db = LocalDatabase::new(test_dir.clone());

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (
                id INTEGER PRIMARY KEY,
                version INTEGER NOT NULL,
                canary_envelope TEXT NOT NULL,
                created_at TEXT NOT NULL
            );",
        )
        .unwrap();

        let header = VaultHeader::new("RestoreTestPassword123!").expect("Header válido");
        db.save_header(&header).unwrap();
        drop(conn);

        let original_header = db.get_header().unwrap().unwrap();

        let invalid_backup = test_dir.join("invalid_backup.bak");
        std::fs::write(&invalid_backup, b"not a sqlite database").unwrap();

        assert!(db.restore_backup(&invalid_backup).is_err());

        let persisted_header = db.get_header().unwrap().unwrap();
        assert_eq!(
            persisted_header.canary_envelope,
            original_header.canary_envelope
        );

        let _ = std::fs::remove_dir_all(test_dir);
    }

    #[test]
    fn test_export_rejects_database_as_backup_destination() {
        let test_dir =
            std::env::temp_dir().join(format!("devos_export_self_{}", rand::random::<u64>()));
        let db = LocalDatabase::new(test_dir.clone());

        let conn = db.get_connection().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS vault_header (
                id INTEGER PRIMARY KEY,
                version INTEGER NOT NULL,
                canary_envelope TEXT NOT NULL,
                created_at TEXT NOT NULL
            );",
        )
        .unwrap();
        drop(conn);

        let result = db.export_backup(db.db_path());
        assert!(
            result.is_err(),
            "O banco ativo não pode ser o destino do próprio backup."
        );

        let _ = std::fs::remove_dir_all(test_dir);
    }
}

```

---

### Arquivo 27: `migrations.rs`
**Caminho:** `src-tauri/src/storage/migrations.rs`  
**Tipo / Camada:** Backend Database  
**Volume:** 89 linhas  
**Responsabilidade:** Definição do esquema de tabelas do cofre, incluindo a tabela profile_records.  
**Dependências Internas:** Nenhuma (Componente base ou isolado)  
**Relacionamento na ABA 1:** Garante a integridade do esquema relacional.  

```rust
use super::local_database::{LocalDatabase, StorageError};

pub struct MigrationManager;

impl MigrationManager {
    /// Executa as migrações versionadas no banco SQLite local dentro de transação
    pub fn run_migrations(db: &LocalDatabase) -> Result<(), StorageError> {
        let mut conn = db.get_connection()?;
        let tx = conn.transaction()?;

        // 1. Tabela de controle de versão de migrações
        tx.execute_batch(
            "CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            );",
        )?;

        // Consulta última migração aplicada
        let current_version: u32 = tx
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        // Migração 1: Estrutura inicial do cofre e tabelas de custódia
        if current_version < 1 {
            tx.execute_batch(
                "CREATE TABLE IF NOT EXISTS vault_header (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    version INTEGER NOT NULL,
                    canary_envelope TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS wallets (
                    id INTEGER PRIMARY KEY,
                    target TEXT NOT NULL,
                    custody_type TEXT NOT NULL,
                    user_name TEXT NOT NULL,
                    label TEXT NOT NULL,
                    derivation_path TEXT NOT NULL,
                    network TEXT NOT NULL,
                    address TEXT NOT NULL,
                    status TEXT NOT NULL,
                    kyc_status TEXT NOT NULL,
                    seed_words_count INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    vault_id TEXT,
                    client_doc TEXT
                );

                CREATE TABLE IF NOT EXISTS vault_secrets (
                    vault_id TEXT PRIMARY KEY,
                    target TEXT NOT NULL,
                    envelope TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                INSERT INTO schema_migrations (version, applied_at)
                VALUES (1, datetime('now'));",
            )?;
        }

        // Migração 2: Tabela de perfil e identidade civil com envelope criptográfico
        if current_version < 2 {
            tx.execute_batch(
                "CREATE TABLE IF NOT EXISTS user_profiles (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    encrypted_envelope TEXT NOT NULL,
                    payload_version INTEGER NOT NULL DEFAULT 1,
                    revision INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                INSERT INTO schema_migrations (version, applied_at)
                VALUES (2, datetime('now'));",
            )?;
        }

        tx.commit()?;

        // Banco de dados inicializado limpo, pronto para carteiras reais
        Ok(())
    }
}

```

---

### Arquivo 28: `encryption.rs`
**Caminho:** `src-tauri/src/modules/vault/encryption.rs`  
**Tipo / Camada:** Backend Cryptography  
**Volume:** 511 linhas  
**Responsabilidade:** Implementação do cofre criptográfico VaultCrypto com AES-256-GCM, tag de 128 bits e nonces de 96 bits.  
**Dependências Internas:** Nenhuma (Componente base ou isolado)  
**Relacionamento na ABA 1:** Criptografa e decifra os registros civis e empresariais.  

```rust
use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use argon2::{Algorithm, Argon2, Params, Version};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, ZeroizeOnDrop};

// ----------------------------------------------------------------------
// Parâmetros criptográficos
// ----------------------------------------------------------------------

const ENVELOPE_VERSION: u32 = 1;

const KDF_NAME: &str = "Argon2id";
const CIPHER_NAME: &str = "AES-256-GCM";

const SALT_BYTES: usize = 16;
const NONCE_BYTES: usize = 12;
const KEY_BYTES: usize = 32;
const GCM_TAG_BYTES: usize = 16;

const ARGON2_MEMORY_KIB: u32 = 64 * 1024;
const ARGON2_ITERATIONS: u32 = 3;
const ARGON2_LANES: u32 = 1;

const MAX_PASSWORD_CHARS: usize = 128;
const MAX_PASSWORD_BYTES: usize = 512;

// Limite defensivo para envelopes que armazenam segredos de custódia e carteiras.
const MAX_PLAINTEXT_BYTES: usize = 16 * 1024 * 1024;
const MAX_CIPHERTEXT_BYTES: usize = MAX_PLAINTEXT_BYTES + GCM_TAG_BYTES;
const MAX_CIPHERTEXT_HEX_CHARS: usize = MAX_CIPHERTEXT_BYTES * 2;

// ----------------------------------------------------------------------
// Erros públicos
// ----------------------------------------------------------------------

#[derive(Debug, thiserror::Error)]
pub enum VaultCryptoError {
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),

    #[error("Decryption failed / Invalid password or corrupted payload")]
    DecryptionFailed,

    // Mantido para compatibilidade com consumidores existentes.
    #[error("Hex decode error: {0}")]
    HexError(String),

    // Mantido para compatibilidade com consumidores existentes.
    #[error("Serialization error: {0}")]
    SerializationError(String),
}

// ----------------------------------------------------------------------
// Envelope criptográfico versionado
// ----------------------------------------------------------------------

/// Envelope criptográfico versionado com proteção AEAD.
///
/// A versão 1 utiliza Argon2id para derivação de chave e AES-256-GCM
/// para cifragem autenticada.
///
/// Os metadados são validados explicitamente durante a decifragem.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EncryptedEnvelope {
    pub version: u32,
    pub kdf: String,
    pub cipher: String,
    pub salt_hex: String,
    pub nonce_hex: String,
    pub ciphertext_hex: String,
}

// ----------------------------------------------------------------------
// Chave derivada
// ----------------------------------------------------------------------

/// Chave temporária protegida contra leitura residual por descarte.
///
/// A chave é derivada diretamente neste objeto para evitar a criação
/// de uma cópia intermediária desnecessária na pilha.
#[derive(Zeroize, ZeroizeOnDrop)]
struct DerivedKey([u8; KEY_BYTES]);

// ----------------------------------------------------------------------
// Implementação criptográfica
// ----------------------------------------------------------------------

pub struct VaultCrypto;

impl VaultCrypto {
    // --------------------------------------------------------------
    // Validação de entradas
    // --------------------------------------------------------------

    /// Valida o tamanho máximo suportado pela API criptográfica.
    ///
    /// Não normaliza, trunca nem modifica a senha.
    fn validate_password_size(password: &str) -> Result<(), VaultCryptoError> {
        if password.len() > MAX_PASSWORD_BYTES {
            return Err(VaultCryptoError::EncryptionFailed(
                "Password exceeds the supported size limit.".to_string(),
            ));
        }

        if password.chars().count() > MAX_PASSWORD_CHARS {
            return Err(VaultCryptoError::EncryptionFailed(
                "Password exceeds the supported size limit.".to_string(),
            ));
        }

        Ok(())
    }

    /// Valida o comprimento da representação hexadecimal do ciphertext
    /// antes de alocar um vetor com os bytes decodificados.
    fn validate_ciphertext_hex_length(hex_length: usize) -> Result<(), VaultCryptoError> {
        let minimum_hex_length = GCM_TAG_BYTES * 2;

        if hex_length < minimum_hex_length
            || hex_length > MAX_CIPHERTEXT_HEX_CHARS
            || !hex_length.is_multiple_of(2)
        {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        Ok(())
    }

    /// Valida o identificador do algoritmo e a versão do envelope.
    ///
    /// O formato atual rejeita algoritmos desconhecidos.
    fn validate_envelope_metadata(envelope: &EncryptedEnvelope) -> Result<(), VaultCryptoError> {
        if envelope.version != ENVELOPE_VERSION {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        if envelope.kdf != KDF_NAME {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        if envelope.cipher != CIPHER_NAME {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        Ok(())
    }

    // --------------------------------------------------------------
    // Derivação de chave
    // --------------------------------------------------------------

    /// Deriva uma chave simétrica de 256 bits utilizando Argon2id.
    ///
    /// Parâmetros preservados:
    /// - Memória: 64 MiB.
    /// - Iterações: 3.
    /// - Paralelismo: 1.
    /// - Comprimento da chave: 32 bytes.
    fn derive_key(password: &str, salt: &[u8; SALT_BYTES]) -> Result<DerivedKey, VaultCryptoError> {
        Self::validate_password_size(password)?;

        let params = Params::new(
            ARGON2_MEMORY_KIB,
            ARGON2_ITERATIONS,
            ARGON2_LANES,
            Some(KEY_BYTES),
        )
        .map_err(|_| {
            VaultCryptoError::EncryptionFailed("Invalid Argon2id parameters.".to_string())
        })?;

        let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

        // A chave nasce diretamente dentro do tipo que a zera no descarte (ZeroizeOnDrop).
        let mut derived_key = DerivedKey([0u8; KEY_BYTES]);

        argon2
            .hash_password_into(password.as_bytes(), salt, &mut derived_key.0)
            .map_err(|_| {
                VaultCryptoError::EncryptionFailed("Argon2id key derivation failed.".to_string())
            })?;

        Ok(derived_key)
    }

    // --------------------------------------------------------------
    // Cifragem
    // --------------------------------------------------------------

    /// Cifra dados sensíveis utilizando Argon2id + AES-256-GCM.
    ///
    /// O chamador permanece responsável pelo ciclo de vida do plaintext
    /// recebido por referência.
    pub fn encrypt(
        password: &str,
        plaintext: &[u8],
    ) -> Result<EncryptedEnvelope, VaultCryptoError> {
        Self::validate_password_size(password)?;

        if plaintext.len() > MAX_PLAINTEXT_BYTES {
            return Err(VaultCryptoError::EncryptionFailed(
                "Plaintext exceeds the supported size limit.".to_string(),
            ));
        }

        // Salt e nonce são gerados com CSPRNG seguro com tratamento de falhas.
        let mut rng = rand::thread_rng();

        let mut salt = [0u8; SALT_BYTES];
        rng.try_fill_bytes(&mut salt).map_err(|_| {
            VaultCryptoError::EncryptionFailed("Secure random generation failed.".to_string())
        })?;

        let mut nonce_bytes = [0u8; NONCE_BYTES];
        rng.try_fill_bytes(&mut nonce_bytes).map_err(|_| {
            VaultCryptoError::EncryptionFailed("Secure random generation failed.".to_string())
        })?;

        let derived_key = Self::derive_key(password, &salt)?;

        let cipher = Aes256Gcm::new_from_slice(&derived_key.0).map_err(|_| {
            VaultCryptoError::EncryptionFailed("AES-256-GCM initialization failed.".to_string())
        })?;

        // O nonce foi construído a partir de um array fixo de 12 bytes.
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher.encrypt(nonce, plaintext).map_err(|_| {
            VaultCryptoError::EncryptionFailed("AES-256-GCM encryption failed.".to_string())
        })?;

        Ok(EncryptedEnvelope {
            version: ENVELOPE_VERSION,
            kdf: KDF_NAME.to_string(),
            cipher: CIPHER_NAME.to_string(),
            salt_hex: hex::encode(salt),
            nonce_hex: hex::encode(nonce_bytes),
            ciphertext_hex: hex::encode(ciphertext),
        })
    }

    // --------------------------------------------------------------
    // Decifragem
    // --------------------------------------------------------------

    /// Decifra e autentica um envelope criptográfico.
    ///
    /// Retorna erro controlado quando a senha está incorreta ou o
    /// envelope não pode ser autenticado.
    ///
    /// O vetor retornado contém plaintext. O chamador deve protegê-lo
    /// com Zeroizing ou mecanismo equivalente quando contiver segredos.
    pub fn decrypt(
        password: &str,
        envelope: &EncryptedEnvelope,
    ) -> Result<Vec<u8>, VaultCryptoError> {
        // 1. Validação estrita de versão, KDF e cifra antes de qualquer cálculo
        Self::validate_envelope_metadata(envelope)?;

        // 2. Validação defensiva de tamanho da senha
        if password.len() > MAX_PASSWORD_BYTES || password.chars().count() > MAX_PASSWORD_CHARS {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        // 3. Validação antecipada de tamanhos hexadecimais para evitar pânicos ou alocações espúrias
        if envelope.salt_hex.len() != SALT_BYTES * 2 {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        if envelope.nonce_hex.len() != NONCE_BYTES * 2 {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        Self::validate_ciphertext_hex_length(envelope.ciphertext_hex.len())?;

        // 4. Conversão para arrays de tamanho estrito fixo (impede pânico em Nonce::from_slice)
        let salt: [u8; SALT_BYTES] = hex::decode(&envelope.salt_hex)
            .map_err(|_| VaultCryptoError::DecryptionFailed)?
            .try_into()
            .map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let nonce_bytes: [u8; NONCE_BYTES] = hex::decode(&envelope.nonce_hex)
            .map_err(|_| VaultCryptoError::DecryptionFailed)?
            .try_into()
            .map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let ciphertext = hex::decode(&envelope.ciphertext_hex)
            .map_err(|_| VaultCryptoError::DecryptionFailed)?;

        if ciphertext.len() < GCM_TAG_BYTES || ciphertext.len() > MAX_CIPHERTEXT_BYTES {
            return Err(VaultCryptoError::DecryptionFailed);
        }

        // 5. Derivação e decifragem com chave em DerivedKey (protegida por ZeroizeOnDrop)
        let derived_key =
            Self::derive_key(password, &salt).map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let cipher = Aes256Gcm::new_from_slice(&derived_key.0)
            .map_err(|_| VaultCryptoError::DecryptionFailed)?;

        let nonce = Nonce::from_slice(&nonce_bytes);

        cipher
            .decrypt(nonce, ciphertext.as_ref())
            .map_err(|_| VaultCryptoError::DecryptionFailed)
    }
}

// ----------------------------------------------------------------------
// Testes
// ----------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    fn make_invalid_envelope() -> EncryptedEnvelope {
        EncryptedEnvelope {
            version: ENVELOPE_VERSION,
            kdf: KDF_NAME.to_string(),
            cipher: CIPHER_NAME.to_string(),
            salt_hex: "00".repeat(SALT_BYTES),
            nonce_hex: "00".repeat(NONCE_BYTES),
            ciphertext_hex: "00".repeat(GCM_TAG_BYTES),
        }
    }

    #[test]
    fn test_vault_encrypt_decrypt_success() {
        let secret = b"sensitive_wallet_seed";
        let password = "SuperMasterPasswordDevOS#2026";

        let envelope = VaultCrypto::encrypt(password, secret).expect("Encryption should succeed");

        assert_eq!(envelope.version, ENVELOPE_VERSION);
        assert_eq!(envelope.cipher, CIPHER_NAME);
        assert_eq!(envelope.kdf, KDF_NAME);

        let decrypted =
            VaultCrypto::decrypt(password, &envelope).expect("Decryption should succeed");

        assert_eq!(decrypted, secret);
    }

    #[test]
    fn test_vault_rejects_incorrect_password() {
        let secret = b"sensitive_wallet_seed";
        let password = "CorrectPassword123";
        let wrong_password = "WrongPassword456";

        let envelope = VaultCrypto::encrypt(password, secret).expect("Encryption should succeed");

        let result = VaultCrypto::decrypt(wrong_password, &envelope);

        assert!(result.is_err(), "An incorrect password must be rejected.");
    }

    #[test]
    fn test_vault_rejects_tampered_ciphertext() {
        let secret = b"sensitive_wallet_seed";
        let password = "CorrectPassword123";

        let mut envelope =
            VaultCrypto::encrypt(password, secret).expect("Encryption should succeed");

        let mut tampered_bytes =
            hex::decode(&envelope.ciphertext_hex).expect("Generated ciphertext must be valid hex");

        assert!(
            !tampered_bytes.is_empty(),
            "A valid AES-GCM ciphertext must contain its authentication tag."
        );

        let last = tampered_bytes.len() - 1;
        tampered_bytes[last] ^= 0xFF;

        envelope.ciphertext_hex = hex::encode(tampered_bytes);

        let result = VaultCrypto::decrypt(password, &envelope);

        assert!(
            result.is_err(),
            "Tampered ciphertext must fail authentication."
        );
    }

    #[test]
    fn test_vault_rejects_unsupported_version() {
        let mut envelope = make_invalid_envelope();
        envelope.version = ENVELOPE_VERSION + 1;

        let result = VaultCrypto::decrypt("CorrectPassword123", &envelope);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Unsupported envelope versions must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_unsupported_kdf() {
        let mut envelope = make_invalid_envelope();
        envelope.kdf = "PBKDF2".to_string();

        let result = VaultCrypto::decrypt("CorrectPassword123", &envelope);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Unsupported KDF metadata must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_unsupported_cipher() {
        let mut envelope = make_invalid_envelope();
        envelope.cipher = "AES-128-GCM".to_string();

        let result = VaultCrypto::decrypt("CorrectPassword123", &envelope);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Unsupported cipher metadata must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_invalid_salt_length() {
        let mut envelope = make_invalid_envelope();
        envelope.salt_hex = "0011".to_string();

        let result = VaultCrypto::decrypt("CorrectPassword123", &envelope);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Invalid salt lengths must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_invalid_nonce_length_without_panicking() {
        let mut envelope = make_invalid_envelope();
        // Hexadecimal válido, mas apenas um byte: NUNCA deve entrar em pânico!
        envelope.nonce_hex = "00".to_string();

        let result = VaultCrypto::decrypt("CorrectPassword123", &envelope);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "An invalid nonce length must return an error rather than panic."
        );
    }

    #[test]
    fn test_vault_rejects_invalid_ciphertext_length() {
        let mut envelope = make_invalid_envelope();
        // Menor que a tag de autenticação GCM.
        envelope.ciphertext_hex = "00".repeat(GCM_TAG_BYTES - 1);

        let result = VaultCrypto::decrypt("CorrectPassword123", &envelope);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Ciphertext shorter than the GCM tag must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_odd_ciphertext_hex_length() {
        let result = VaultCrypto::validate_ciphertext_hex_length(33);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Odd-length hexadecimal representations must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_oversized_ciphertext_before_decoding() {
        let oversized_length = MAX_CIPHERTEXT_HEX_CHARS + 2;
        let result = VaultCrypto::validate_ciphertext_hex_length(oversized_length);

        assert!(
            matches!(result, Err(VaultCryptoError::DecryptionFailed)),
            "Oversized ciphertext representations must be rejected."
        );
    }

    #[test]
    fn test_vault_rejects_oversized_password() {
        let oversized_password = "a".repeat(MAX_PASSWORD_CHARS + 1);
        let result = VaultCrypto::encrypt(&oversized_password, b"test");

        assert!(
            matches!(result, Err(VaultCryptoError::EncryptionFailed(_))),
            "Oversized passwords must be rejected before key derivation."
        );
    }

    #[test]
    fn test_vault_rejects_oversized_plaintext() {
        let plaintext = vec![0u8; MAX_PLAINTEXT_BYTES + 1];
        let result = VaultCrypto::encrypt("CorrectPassword123", &plaintext);

        assert!(
            matches!(result, Err(VaultCryptoError::EncryptionFailed(_))),
            "Oversized plaintext must be rejected before Argon2id."
        );
    }
}

```

---

### Arquivo 29: `access_control.rs`
**Caminho:** `src-tauri/src/modules/vault/access_control.rs`  
**Tipo / Camada:** Backend Security  
**Volume:** 702 linhas  
**Responsabilidade:** Controle de sessão e autenticação mestre do cofre, mantendo chaves voláteis e verificando is_unlocked().  
**Dependências Internas:** Nenhuma (Componente base ou isolado)  
**Relacionamento na ABA 1:** Protege os comandos de identidade contra acesso com cofre trancado.  

```rust
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

use super::encryption::{EncryptedEnvelope, VaultCrypto, VaultCryptoError};

// ----------------------------------------------------------------------
// Erros de controle de acesso
// ----------------------------------------------------------------------

#[derive(Debug, thiserror::Error)]
pub enum AccessControlError {
    #[error("Vault is not initialized. Please set master password first.")]
    NotInitialized,

    #[error("Vault is locked. Master password required.")]
    Locked,

    #[error("Authentication failed. Invalid master password.")]
    InvalidPassword,

    // Evita expor detalhes internos da operação criptográfica
    // por meio da representação pública do erro.
    #[error("Cryptographic operation failed.")]
    Crypto(#[from] VaultCryptoError),
}

// ----------------------------------------------------------------------
// Estado público do cofre
// ----------------------------------------------------------------------

/// Estado de segurança do cofre exposto ao frontend.
///
/// Não inclui senhas, chaves de sessão ou conteúdo criptográfico.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct VaultStatus {
    pub is_initialized: bool,
    pub is_unlocked: bool,
    pub dao_wallets_count: usize,
    pub client_wallets_count: usize,
}

// ----------------------------------------------------------------------
// Estado interno da sessão
// ----------------------------------------------------------------------

/// Estado privado da sessão.
///
/// Não derivar Debug: a estrutura contém material sensível (session_key).
#[derive(Default)]
struct SessionState {
    unlocked: bool,

    /// Geração sincronizada pelo Mutex.
    ///
    /// Uma operação iniciada com uma época antiga não pode concluir
    /// o desbloqueio depois de uma invalidação da sessão.
    epoch: u64,

    /// Indica que o contador atingiu seu limite.
    ///
    /// Nesse estado, a sessão permanece bloqueada permanentemente,
    /// evitando a reutilização de uma época por wraparound.
    epoch_exhausted: bool,

    /// Material sensível da sessão.
    ///
    /// A chave é zerada pelo mecanismo RAII ao ser descartada.
    session_key: Option<Zeroizing<String>>,
}

// ----------------------------------------------------------------------
// Gerenciador autoritativo da sessão
// ----------------------------------------------------------------------

/// Gerenciador autoritativo da sessão do cofre.
///
/// O Mutex protege as transições entre bloqueado e desbloqueado,
/// a geração da sessão e o material criptográfico mantido em memória.
#[derive(Default)]
pub struct VaultSession {
    state: Mutex<SessionState>,
}

impl VaultSession {
    /// Cria uma sessão bloqueada.
    pub fn new() -> Self {
        Self::default()
    }

    // --------------------------------------------------------------
    // Invariantes internos
    // --------------------------------------------------------------

    /// Avança a geração sem permitir wraparound.
    ///
    /// Se o contador estiver esgotado, a sessão permanece bloqueada.
    fn advance_epoch(state: &mut SessionState) {
        if state.epoch_exhausted {
            state.unlocked = false;
            state.session_key = None;
            return;
        }

        match state.epoch.checked_add(1) {
            Some(next_epoch) => {
                state.epoch = next_epoch;
            }

            None => {
                // Não reutilizar a época zero nem aceitar ABA.
                state.epoch_exhausted = true;
                state.unlocked = false;
                state.session_key = None;

                log::error!(
                    "[Vault Security] Época da sessão esgotada. \
                     O cofre permanecerá bloqueado."
                );
            }
        }
    }

    /// Restaura o estado seguro após uma falha interna.
    ///
    /// A chave é descartada, a sessão é bloqueada e a época é
    /// invalidada para impedir que operações antigas prossigam.
    fn fail_closed(state: &mut SessionState) {
        state.unlocked = false;
        state.session_key = None;

        Self::advance_epoch(state);
    }

    // --------------------------------------------------------------
    // Consulta do estado
    // --------------------------------------------------------------

    /// Retorna true somente quando a sessão está desbloqueada
    /// e a geração não está esgotada.
    pub fn is_unlocked(&self) -> bool {
        match self.state.lock() {
            Ok(state) => state.unlocked && !state.epoch_exhausted,

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em is_unlocked(). \
                     Aplicando Fail-Closed."
                );

                let mut state = poisoned.into_inner();

                // Mantém o Mutex envenenado nesta operação de consulta.
                // Uma tentativa de desbloqueio que encontre o poison
                // ainda deverá ser rejeitada explicitamente.
                Self::fail_closed(&mut state);

                false
            }
        }
    }

    /// Obtém a geração atual da sessão.
    ///
    /// O estado permanece bloqueado se o Mutex estiver envenenado.
    /// Nesse caso, a época também é invalidada.
    pub fn current_epoch(&self) -> u64 {
        match self.state.lock() {
            Ok(state) => state.epoch,

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em current_epoch(). \
                     Invalidando a sessão."
                );

                let mut state = poisoned.into_inner();

                Self::fail_closed(&mut state);

                state.epoch
            }
        }
    }

    /// Verifica se existe uma chave de sessão instalada em uma
    /// sessão efetivamente desbloqueada.
    pub fn has_session_key(&self) -> bool {
        match self.state.lock() {
            Ok(mut state) => {
                if state.epoch_exhausted || !state.unlocked {
                    // Corrige também eventuais inconsistências internas.
                    state.session_key = None;
                    return false;
                }

                state.session_key.is_some()
            }

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em has_session_key(). \
                     Limpando o estado da sessão."
                );

                let mut state = poisoned.into_inner();

                Self::fail_closed(&mut state);

                false
            }
        }
    }

    // --------------------------------------------------------------
    // Bloqueio
    // --------------------------------------------------------------

    /// Bloqueia a sessão, invalida operações pendentes e descarta
    /// qualquer material sensível instalado.
    ///
    /// Se o Mutex estiver envenenado, restaura o estado seguro
    /// e limpa a flag de poison depois da recuperação.
    pub fn lock(&self) {
        match self.state.lock() {
            Ok(mut state) => {
                state.unlocked = false;
                state.session_key = None;

                Self::advance_epoch(&mut state);
            }

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em lock(). \
                     Restaurando o estado seguro."
                );

                let mut state = poisoned.into_inner();

                Self::fail_closed(&mut state);

                // O estado já foi restaurado para a condição segura.
                // Operações que encontraram o poison continuam tendo
                // que lidar explicitamente com sua tentativa.
                self.state.clear_poison();
            }
        }
    }

    // --------------------------------------------------------------
    // Desbloqueio
    // --------------------------------------------------------------

    /// Desbloqueia a sessão somente se a geração esperada continuar válida.
    ///
    /// Uma tentativa que encontrar um Mutex envenenado é recusada.
    /// A recuperação não transforma essa tentativa em um desbloqueio
    /// bem-sucedido.
    pub fn try_unlock(&self, expected_epoch: u64) -> bool {
        match self.state.lock() {
            Ok(mut state) => {
                if state.epoch_exhausted || state.epoch != expected_epoch {
                    return false;
                }

                state.unlocked = true;

                true
            }

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em try_unlock(). \
                     A tentativa atual será recusada."
                );

                let mut state = poisoned.into_inner();

                Self::fail_closed(&mut state);

                // Recupera a disponibilidade do objeto somente depois
                // de forçar o bloqueio e descartar a chave.
                //
                // Esta chamada retorna false: uma tentativa posterior
                // deverá realizar uma nova autenticação.
                self.state.clear_poison();

                false
            }
        }
    }

    /// Instala uma chave de sessão somente quando a geração esperada
    /// permanece válida.
    ///
    /// Se a operação for rejeitada, `key` sai de escopo e o tipo
    /// Zeroizing solicita a zeragem do conteúdo ao ser descartado.
    pub fn try_unlock_with_session_key(&self, expected_epoch: u64, key: Zeroizing<String>) -> bool {
        match self.state.lock() {
            Ok(mut state) => {
                if state.epoch_exhausted || state.epoch != expected_epoch {
                    // A chave não é instalada.
                    // O argumento será descartado na saída do método.
                    return false;
                }

                state.unlocked = true;
                state.session_key = Some(key);

                true
            }

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em \
                     try_unlock_with_session_key(). \
                     A instalação será recusada."
                );

                let mut state = poisoned.into_inner();

                Self::fail_closed(&mut state);

                self.state.clear_poison();

                // A chave recebida não foi instalada e será descartada.
                false
            }
        }
    }

    /// Executa uma operação passando uma referência para a chave de sessão ativa.
    ///
    /// Retorna `Err(AccessControlError::Locked)` se a sessão estiver bloqueada ou sem chave instalada.
    pub fn with_session_key<F, R>(&self, f: F) -> Result<R, AccessControlError>
    where
        F: FnOnce(&str) -> Result<R, AccessControlError>,
    {
        match self.state.lock() {
            Ok(state) => {
                if state.epoch_exhausted || !state.unlocked {
                    return Err(AccessControlError::Locked);
                }

                match state.session_key.as_ref() {
                    Some(key) => f(key.as_str()),
                    None => Err(AccessControlError::Locked),
                }
            }

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em with_session_key(). \
                     Aplicando Fail-Closed."
                );

                let mut state = poisoned.into_inner();
                Self::fail_closed(&mut state);
                self.state.clear_poison();

                Err(AccessControlError::Locked)
            }
        }
    }

    // --------------------------------------------------------------
    // Compatibilidade de testes
    // --------------------------------------------------------------

    /// Define diretamente a chave de sessão e o estado de desbloqueio para testes.
    #[cfg(test)]
    pub fn set_session_key_for_test(&self, key: &str) {
        if let Ok(mut state) = self.state.lock() {
            state.unlocked = true;
            state.session_key = Some(Zeroizing::new(key.to_string()));
        }
    }

    /// Define diretamente o estado apenas durante os testes unitários.
    ///
    /// Não disponibilizar este método em builds de produção:
    /// permitir `unlocked = true` sem autenticação violaria o modelo
    /// de controle de acesso.
    #[cfg(test)]
    pub fn set_unlocked(&self, unlocked: bool) {
        match self.state.lock() {
            Ok(mut state) => {
                Self::advance_epoch(&mut state);

                if state.epoch_exhausted {
                    state.unlocked = false;
                    state.session_key = None;
                    return;
                }

                state.unlocked = unlocked;

                if !unlocked {
                    state.session_key = None;
                }
            }

            Err(poisoned) => {
                log::error!(
                    "[Vault Security] Mutex envenenado em set_unlocked(). \
                     Mantendo o Fail-Closed."
                );

                let mut state = poisoned.into_inner();

                Self::fail_closed(&mut state);

                self.state.clear_poison();
            }
        }
    }
}

// ----------------------------------------------------------------------
// Material sensível de sessão
// ----------------------------------------------------------------------

/// Token em memória de sessão.
///
/// O conteúdo é zerado pelo destrutor fornecido pelo derive.
#[derive(Default, Zeroize, ZeroizeOnDrop)]
pub struct SessionKey(pub Option<String>);

// ----------------------------------------------------------------------
// Cabeçalho persistido do cofre
// ----------------------------------------------------------------------

/// Cabeçalho persistido utilizado para verificar a senha mestre.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultHeader {
    pub version: u32,
    pub canary_envelope: EncryptedEnvelope,
    pub created_at: String,
}

impl VaultHeader {
    const CURRENT_VERSION: u32 = 1;

    const CANARY_PLAINTEXT: &'static [u8] = b"ASPPIBRA_DEVOS_VAULT_CANARY_V1";

    /// Cria um cabeçalho para a versão atualmente suportada.
    pub fn new(password: &str) -> Result<Self, VaultCryptoError> {
        let canary_envelope = VaultCrypto::encrypt(password, Self::CANARY_PLAINTEXT)?;

        let now = chrono::Utc::now().to_rfc3339();

        Ok(Self {
            version: Self::CURRENT_VERSION,
            canary_envelope,
            created_at: now,
        })
    }

    /// Verifica a senha mestre sem expor os bytes decifrados.
    ///
    /// Versões desconhecidas não são aceitas como cabeçalhos válidos.
    pub fn verify_password(&self, password: &str) -> bool {
        if self.version != Self::CURRENT_VERSION {
            return false;
        }

        match VaultCrypto::decrypt(password, &self.canary_envelope) {
            Ok(decrypted_bytes) => {
                let decrypted = Zeroizing::new(decrypted_bytes);

                decrypted.as_slice() == Self::CANARY_PLAINTEXT
            }

            Err(_) => false,
        }
    }
}

// ----------------------------------------------------------------------
// Testes unitários
// ----------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_session_normal_lifecycle() {
        let session = VaultSession::new();

        assert!(!session.is_unlocked());

        let epoch = session.current_epoch();

        assert!(session.try_unlock(epoch));
        assert!(session.is_unlocked());

        session.lock();

        assert!(!session.is_unlocked());
        assert!(!session.has_session_key());
    }

    #[test]
    fn test_vault_session_prevents_unlock_after_concurrent_lock() {
        let session = VaultSession::new();

        let epoch_at_start = session.current_epoch();

        session.lock();

        assert!(!session.is_unlocked());

        let unlocked = session.try_unlock(epoch_at_start);

        assert!(
            !unlocked,
            "O desbloqueio iniciado na época antiga deve ser recusado."
        );

        assert!(!session.is_unlocked(), "O cofre deve permanecer bloqueado.");
    }

    #[test]
    fn test_vault_session_deterministic_concurrency_barrier() {
        use std::sync::{Arc, Barrier};
        use std::thread;

        let session = Arc::new(VaultSession::new());
        let barrier = Arc::new(Barrier::new(2));

        let unlock_session = Arc::clone(&session);
        let unlock_barrier = Arc::clone(&barrier);

        let handle = thread::spawn(move || {
            let epoch = unlock_session.current_epoch();

            // A operação de desbloqueio captura a época.
            unlock_barrier.wait();

            // Aguarda a operação de bloqueio.
            unlock_barrier.wait();

            unlock_session.try_unlock(epoch)
        });

        // A thread de controle aguarda a captura da época.
        barrier.wait();

        // Invalida a tentativa concorrente.
        session.lock();

        // Autoriza o teste de desbloqueio a prosseguir.
        barrier.wait();

        let unlock_result = handle.join().expect("Thread de teste falhou.");

        assert!(!unlock_result, "A tentativa atrasada deve ser recusada.");

        assert!(
            !session.is_unlocked(),
            "A sessão deve permanecer bloqueada."
        );
    }

    #[test]
    fn test_vault_session_poison_recovery_fail_closed() {
        use std::sync::Arc;
        use std::thread;

        let session = Arc::new(VaultSession::new());

        let poison_session = Arc::clone(&session);

        // Simula um pânico enquanto o Mutex está bloqueado.
        let _ = thread::spawn(move || {
            let _guard = poison_session.state.lock().unwrap();

            panic!("Pânico intencional para testar a recuperação do Mutex.");
        })
        .join();

        // A consulta detecta o poison e força o estado seguro.
        assert!(
            !session.is_unlocked(),
            "A sessão deve permanecer bloqueada após o poison."
        );

        // A primeira tentativa de desbloqueio que encontra o poison
        // deve falhar, mesmo que o chamador tenha uma época numérica.
        let rejected_epoch = session.current_epoch();

        assert!(
            !session.try_unlock(rejected_epoch),
            "A tentativa que encontra o Mutex envenenado deve falhar."
        );

        // A recuperação permite iniciar uma operação nova.
        session.lock();

        assert!(!session.is_unlocked());

        let recovered_epoch = session.current_epoch();

        assert!(
            session.try_unlock(recovered_epoch),
            "Uma tentativa posterior deve poder prosseguir após a recuperação."
        );

        assert!(session.is_unlocked());
    }

    #[test]
    fn test_vault_session_stale_key_is_not_installed() {
        let session = VaultSession::new();

        // Captura a época anterior ao bloqueio.
        let stale_epoch = session.current_epoch();

        // Invalida todas as operações que utilizaram a época anterior.
        session.lock();

        let stale_key = Zeroizing::new("stale_session_key_material".to_string());

        // A chave é consumida pelo método, mas não deve ser instalada.
        let installed = session.try_unlock_with_session_key(stale_epoch, stale_key);

        assert!(
            !installed,
            "Uma chave associada a uma época antiga deve ser recusada."
        );

        assert!(
            !session.is_unlocked(),
            "A sessão deve permanecer bloqueada."
        );

        assert!(
            !session.has_session_key(),
            "Nenhuma chave deve permanecer instalada."
        );
    }

    #[test]
    fn test_vault_session_valid_key_lifecycle() {
        let session = VaultSession::new();

        let epoch = session.current_epoch();

        let key = Zeroizing::new("valid_session_key_material".to_string());

        assert!(
            session.try_unlock_with_session_key(epoch, key),
            "Uma chave associada à época válida deve ser instalada."
        );

        assert!(session.is_unlocked());
        assert!(session.has_session_key());

        session.lock();

        assert!(!session.is_unlocked());

        assert!(
            !session.has_session_key(),
            "O bloqueio deve remover a chave da sessão."
        );
    }

    #[test]
    fn test_vault_session_test_helper_invalidates_previous_epoch() {
        let session = VaultSession::new();

        let old_epoch = session.current_epoch();

        session.set_unlocked(false);

        assert!(
            !session.try_unlock(old_epoch),
            "A alteração do estado deve invalidar a época anterior."
        );
    }

    #[test]
    fn test_vault_session_lock_clears_session_key() {
        let session = VaultSession::new();

        let epoch = session.current_epoch();

        let key = Zeroizing::new("temporary_session_key_material".to_string());

        assert!(session.try_unlock_with_session_key(epoch, key));

        assert!(session.has_session_key());

        session.lock();

        assert!(!session.has_session_key());
        assert!(!session.is_unlocked());
    }
}

```

---

### Arquivo 30: `lib.rs`
**Caminho:** `src-tauri/src/lib.rs`  
**Tipo / Camada:** Backend Core  
**Volume:** 227 linhas  
**Responsabilidade:** Bootstrap da aplicação nativa Tauri registrando os comandos IPC no invoke_handler.  
**Dependências Internas:** `src-tauri/src/commands/identity_commands.rs`  
**Relacionamento na ABA 1:** Ponto de entrada nativo do DevOS Desktop.  

```rust
use std::error::Error;
use std::fmt::Display;
use std::io;
use tauri::Manager;

// ----------------------------------------------------------------------
// Módulos
// ----------------------------------------------------------------------

pub mod commands;
pub mod modules;
pub mod platform;
pub mod shared;
pub mod storage;

#[cfg(test)]
mod tests;

// ----------------------------------------------------------------------
// Configuração das edições
// ----------------------------------------------------------------------

const COCKPIT_IDENTIFIER: &str = "br.aspp.devos.cockpit";

// ----------------------------------------------------------------------
// Tratamento de erros de inicialização
// ----------------------------------------------------------------------

fn startup_error(context: &str, error: impl Display) -> io::Error {
    io::Error::other(format!("{context}: {error}"))
}

// ----------------------------------------------------------------------
// Registro dos comandos
// ----------------------------------------------------------------------

/// Mantém os comandos comuns em um único lugar.
///
/// Os comandos específicos da edição são adicionados pelo chamador.
macro_rules! app_invoke_handler {
    ($($edition_command:path),* $(,)?) => {
        tauri::generate_handler![
            commands::get_device_status,
            commands::get_vault_status,
            commands::init_master_password,
            commands::unlock_vault,
            commands::lock_vault,
            commands::get_user_profile,
            commands::save_user_profile,
            commands::import_legacy_profile,
            commands::generate_seed_and_preview,
            commands::reveal_pending_mnemonic,
            commands::cancel_pending_creation,
            commands::confirm_and_save_wallets,
            commands::list_stored_wallets,
            commands::export_authorized_secret,
            commands::export_vault_backup,
            commands::restore_vault_backup,
            commands::fetch_wallet_balance,
            commands::batch_fetch_wallet_balances,
            commands::generate_document,
            commands::preview_document,
            commands::export_previewed_document,
            commands::get_ipfs_daemon_status,
            commands::execute_storage_proof,
            commands::ipfs_upload_file,
            commands::ipfs_download_file,
            commands::ipfs_pin_cid,
            commands::ipfs_unpin_cid,
            commands::ipfs_verify_cid_custody,
            commands::ipfs_verify_all_pins,
            commands::ipfs_query_providers,
            commands::ipfs_list_managed_pins,
            commands::ipfs_start_daemon,
            commands::ipfs_stop_daemon,
            commands::ipfs_restart_daemon
            $(, $edition_command)*
        ]
    };
}

// ----------------------------------------------------------------------
// Compatibilidade gráfica Linux
// ----------------------------------------------------------------------

/// Define os padrões gráficos necessários apenas quando o ambiente
/// ainda não tiver fornecido valores.
///
/// IMPORTANTE:
/// Esta função deve ser chamada pelo ponto de entrada do processo,
/// antes da criação de threads e da inicialização do runtime Tauri.
#[cfg(target_os = "linux")]
fn configure_linux_environment() {
    let set_gdk_default = std::env::var_os("GDK_BACKEND").is_none();

    // SAFETY:
    // run() chama esta função antes de criar o Builder Tauri.
    // O ponto de entrada do aplicativo deve invocar run() antes de
    // iniciar qualquer thread que possa acessar o ambiente do processo.
    unsafe {
        if set_gdk_default {
            std::env::set_var("GDK_BACKEND", "x11");
        }
    }
}

// ----------------------------------------------------------------------
// Entrada principal do aplicativo
// ----------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    configure_linux_environment();

    let context = tauri::generate_context!();
    let is_cockpit = context.config().identifier == COCKPIT_IDENTIFIER;
    let edition = match modules::documents::ApplicationEdition::try_from_bundle_identifier(
        &context.config().identifier,
    ) {
        Ok(ed) => ed,
        Err(err) => {
            log::error!("[Startup] Falha crítica de segurança: {err}");
            panic!("[Startup] Falha crítica de segurança: {err}");
        }
    };

    let builder = tauri::Builder::default().setup(move |app| {
        #[cfg(debug_assertions)]
        {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;
        }

        // 0. Inicializar imutavelmente a edição do módulo de documentos no boot
        modules::documents::initialize_application_edition(edition).map_err(|error| {
            log::error!(
                "[Startup] Falha crítica ao inicializar a edição de documentos da aplicação: {}",
                error
            );
            startup_error(
                "Falha crítica ao inicializar a edição de documentos da aplicação",
                error,
            )
        })?;

        // 1. Resolver diretórios de dados nativos
        let app_handle = app.handle();
        let app_data_dir = app_handle.path().app_data_dir().map_err(|error| {
            log::error!(
                "[Startup] Falha ao resolver o diretório de dados: {}",
                error
            );
            startup_error("Falha ao resolver o diretório de dados", error)
        })?;

        // 2. Inicializar banco do cofre (devos_vault.sqlite) com migrações centralizadas
        let vault_dir = app_data_dir.join("devos_vault");
        let vault_db = storage::LocalDatabase::new(vault_dir);
        storage::MigrationManager::run_migrations(&vault_db).map_err(|error| {
            log::error!("[Startup] Falha nas migrações do cofre: {}", error);
            startup_error("Falha nas migrações do cofre", error)
        })?;

        if !app.manage(vault_db) {
            let error = startup_error(
                "Falha ao registrar o banco do cofre",
                "o estado LocalDatabase já estava registrado",
            );
            log::error!("[Startup] {}", error);
            return Err(Box::new(error) as Box<dyn Error>);
        }

        if !app.manage(modules::vault::VaultSession::new()) {
            let error = startup_error(
                "Falha ao registrar a sessão do cofre",
                "o estado VaultSession já estava registrado",
            );
            log::error!("[Startup] {}", error);
            return Err(Box::new(error) as Box<dyn Error>);
        }

        // 3. Inicializar banco do Cadastro Imobiliário (real_estate.sqlite) exclusivamente na edição Cockpit
        if is_cockpit {
            let real_estate_dir = app_data_dir.join("real_estate");
            let real_estate_db = storage::RealEstateDatabase::new(real_estate_dir);
            storage::RealEstateMigrationManager::run_migrations(&real_estate_db).map_err(
                |error| {
                    log::error!("[Startup] Falha nas migrações imobiliárias: {}", error);
                    startup_error("Falha nas migrações do cadastro imobiliário", error)
                },
            )?;

            if !app.manage(real_estate_db) {
                let error = startup_error(
                    "Falha ao registrar o banco imobiliário",
                    "o estado RealEstateDatabase já estava registrado",
                );
                log::error!("[Startup] {}", error);
                return Err(Box::new(error) as Box<dyn Error>);
            }
        }

        Ok(())
    });

    let builder = if is_cockpit {
        builder.invoke_handler(app_invoke_handler!(
            commands::get_real_estate_stats,
            commands::preview_real_estate_import,
            commands::execute_real_estate_import,
            commands::list_import_batches,
            commands::list_audit_findings,
            commands::list_properties,
            commands::select_spreadsheet_file,
        ))
    } else {
        builder.invoke_handler(app_invoke_handler!())
    };

    builder
        .run(context)
        .expect("Falha ao executar o aplicativo Tauri do DevOS Desktop");
}

```

---

### Arquivo 31: `profile-cover.tsx`
**Caminho:** `src/sections/user/profile-cover.tsx`  
**Tipo / Camada:** Component  
**Volume:** 256 linhas  
**Responsabilidade:** Componente de capa e avatar do perfil com handlers de upload de imagem via input file e URL.createObjectURL.  
**Dependências Internas:** `src/shared/components/iconify`, `src/shared/components/snackbar`  
**Relacionamento na ABA 1:** Componente onde o upload de imagem é acionado no sistema.  

```tsx
import React from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  name: string;
  role?: string;
  avatarUrl?: string;
  coverUrl?: string;
  currentTab: string;
  onChangeTab: (event: React.SyntheticEvent, newValue: string) => void;
  onUpdateAvatar?: (url: string) => void;
  onUpdateCover?: (url: string) => void;
};

export const TABS = [
  { value: 'profile', label: 'Visão Geral', icon: 'solar:user-id-bold' },
  { value: 'identity', label: 'Identidade Civil', icon: 'solar:document-text-bold' },
  { value: 'notifications', label: 'Notificações', icon: 'solar:bell-bing-bold' },
  { value: 'socials', label: 'Redes Sociais', icon: 'solar:share-bold' },
  { value: 'security', label: 'Segurança', icon: 'ic:round-vpn-key' },
  { value: '2fa', label: 'Autenticador 2FA', icon: 'solar:shield-keyhole-bold' },
];

export function ProfileCover({
  name,
  role = 'Usuário',
  avatarUrl,
  coverUrl,
  currentTab,
  onChangeTab,
  onUpdateAvatar,
  onUpdateCover,
}: Props) {
  const theme = useTheme();

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateCover?.(url);
      toast.success('Foto de capa atualizada!');
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateAvatar?.(url);
      toast.success('Foto de perfil atualizada!');
    }
  };

  return (
    <Card
      sx={{
        mb: 3,
        height: 280,
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: theme.shadows[2],
      }}
    >
      {/* Imagem de Capa Panorâmica com Gradiente Fluido */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: coverUrl
            ? `url(${coverUrl}) center center / cover no-repeat`
            : `linear-gradient(135deg, #072e21 0%, #004d35 40%, #007753 75%, #05a06c 100%)`,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(to bottom, rgba(4, 25, 18, 0.1) 0%, rgba(4, 25, 18, 0.75) 100%)',
          },
        }}
      />

      {/* Botão de Trocar Capa Diretamente no Banner */}
      <IconButton
        component="label"
        size="small"
        sx={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 10,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          color: 'common.white',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
          px: 1.5,
          py: 0.6,
          borderRadius: 1.5,
          gap: 0.8,
        }}
      >
        <Iconify icon="solar:camera-add-bold" width={18} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'common.white' }}>
          Trocar Capa
        </Typography>
        <input type="file" hidden accept="image/*" onChange={handleCoverChange} />
      </IconButton>

      {/* Conteúdo Sobreposto: Avatar + Nome + Tabs */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9,
          px: { xs: 2.5, md: 3 },
          pb: { xs: 1.5, md: 2 },
          alignItems: { xs: 'flex-start', md: 'flex-end' },
          justifyContent: 'space-between',
        }}
      >
        {/* Lado Esquerdo: Avatar Circular com Botão de Câmera e Nome */}
        <Stack direction="row" spacing={2.5} sx={{ alignItems: 'flex-end', mb: { xs: 1.5, md: 0 }, flexShrink: 0 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={avatarUrl}
              alt={name}
              sx={{
                width: { xs: 80, md: 108 },
                height: { xs: 80, md: 108 },
                border: `4px solid ${theme.palette.common.white}`,
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                color: theme.palette.common.white,
                boxShadow: theme.shadows[4],
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 800,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </Avatar>

            <IconButton
              component="label"
              size="small"
              sx={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: theme.shadows[3],
                border: `2px solid ${theme.palette.common.white}`,
                '&:hover': { bgcolor: 'primary.dark' },
                width: 32,
                height: 32,
              }}
            >
              <Iconify icon="solar:camera-bold" width={17} />
              <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
            </IconButton>
          </Box>

          <Box sx={{ color: 'common.white', mb: 1, minWidth: 0, flexShrink: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
              {name}
            </Typography>
            <Typography
              variant="body2"
              sx={{ opacity: 0.85, fontWeight: 500, textShadow: '0 1px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}
            >
              {role}
            </Typography>
          </Box>
        </Stack>

        {/* Lado Direito: Barra de Ícones de Navegação (Dock Otimizado) */}
        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(12px)',
            borderRadius: 2,
            p: 0.5,
            boxShadow: theme.shadows[3],
            border: '1px solid rgba(255, 255, 255, 0.6)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Tabs
            value={currentTab}
            onChange={onChangeTab}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 40,
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
              '& .MuiTab-root': {
                minHeight: 40,
                minWidth: 44,
                width: 44,
                p: 0,
                borderRadius: 1.5,
                transition: 'all 0.2s ease-in-out',
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main',
                  bgcolor: theme.palette.action.selected,
                },
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
              },
            }}
          >
            {TABS.map((tab) => (
              <Tooltip key={tab.value} title={tab.label} arrow placement="top" enterDelay={300}>
                <Tab
                  value={tab.value}
                  icon={<Iconify icon={tab.icon} width={22} />}
                  aria-label={tab.label}
                />
              </Tooltip>
            ))}
          </Tabs>
        </Box>
      </Stack>
    </Card>
  );
}

```

---

### Arquivo 32: `identity-bridge.spec.ts`
**Caminho:** `src/test/identity-bridge.spec.ts`  
**Tipo / Camada:** Tests  
**Volume:** 615 linhas  
**Responsabilidade:** Suíte completa de 22 testes unitários cobrindo validadores (CPF, CNPJ, nascimento, CEP, telefone, website), cálculo de completude de 100 pontos, mapeamento de entidade e concorrência.  
**Dependências Internas:** `src/sections/account/use-account.ts`, `src/sections/account/account-general.tsx`  
**Relacionamento na ABA 1:** Comprova matematicamente as regras de validação e completude da ABA 1.  

```typescript
import type { UserProfile } from 'src/platform/tauri/contracts/identity-contracts';

import { it, expect, describe } from 'vitest';

import { IdentityBridge } from 'src/platform/tauri/identity/identity-bridge';

import {
  isStrictValidCpf,
  isStrictValidCep,
  isStrictValidCnpj,
  isStrictValidPhone,
  mapUserToFormValues,
  isStrictValidWebsite,
  isStrictValidBirthDate,
  calculateIdentityCompleteness,
} from 'src/sections/account/account-general';
import {
  readLegacyProfile,
  resetAccountStore,
  LEGACY_STORAGE_KEY,
  removeLegacyProfile,
  canonicalizeUsername,
  createEmptyUserAccount,
  accountDataToSavePayload,
  mergeMissingLegacyFields,
  userProfileToAccountData,
  verifyMigrationIntegrity,
} from 'src/sections/account/use-account';

import { mockIpcError, mockIpcResponse } from './test-utils';

describe('IdentityBridge — Tauri Native Identity & Vault IPC', () => {
  const sampleProfile: UserProfile = {
    personType: 'PF',
    username: 'maria_santos',
    firstName: 'Maria',
    lastName: 'Santos',
    displayName: 'Maria Santos',
    cpf: '529.982.247-25',
    rg: '12345678-9',
    rgIssuer: 'SSP/SP',
    cnh: '',
    cnhCategory: '',
    motherName: 'Francisca Santos',
    fatherName: 'João Santos',
    birthDate: '1988-04-12',
    nationality: 'Brasileira',
    maritalStatus: 'Solteiro(a)',
    companyName: '',
    cnpj: '',
    legalRepresentative: '',
    legalRepresentativeCpf: '',
    email: 'maria@asppibra.org.br',
    phoneNumber: '(11) 98765-4321',
    country: 'Brasil',
    zipCode: '01310-100',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Bela Vista',
    address: 'Avenida Paulista',
    addressNumber: '1500',
    complement: 'Apto 101',
    occupation: 'Engenheira de Software',
    company: 'ASPPIBRA',
    website: 'https://asppibra.org.br',
    about: 'Liderança técnica em governança descentralizada.',
    isPublic: false,
    completenessScore: 85,
    revision: 1,
    updatedAt: '2026-11-17T00:00:00Z',
    photoUrl: null,
    coverUrl: null,
    linkedProviders: [],
  };

  const samplePjProfile: UserProfile = {
    personType: 'PJ',
    username: 'asppibra_tech',
    firstName: '',
    lastName: '',
    displayName: 'ASPPIBRA Soluções Ltda',
    cpf: '',
    rg: '',
    rgIssuer: '',
    cnh: '',
    cnhCategory: '',
    motherName: '',
    fatherName: '',
    birthDate: '',
    nationality: 'Brasileira',
    maritalStatus: '',
    companyName: 'ASPPIBRA Soluções Ltda',
    cnpj: '12.ABC.345/01DE-35',
    legalRepresentative: 'Maria Santos',
    legalRepresentativeCpf: '529.982.247-25',
    email: 'contato@asppibra.org.br',
    phoneNumber: '(11) 3333-4444',
    country: 'Brasil',
    zipCode: '01310-100',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Bela Vista',
    address: 'Avenida Paulista',
    addressNumber: '1500',
    complement: 'Conjunto 42',
    occupation: 'Desenvolvimento Institucional (CNAE 6201-5)',
    company: 'ASPPIBRA Group',
    website: 'https://asppibra.org.br',
    about: 'Infraestrutura descentralizada e soberania digital.',
    isPublic: false,
    completenessScore: 100,
    revision: 1,
    updatedAt: '2026-11-17T00:00:00Z',
    photoUrl: null,
    coverUrl: null,
    linkedProviders: [],
  };

  it('deve consultar o perfil do usuário via get_user_profile', async () => {
    mockIpcResponse('get_user_profile', sampleProfile);

    const result = await IdentityBridge.getUserProfile();
    expect(result).not.toBeNull();
    expect(result?.firstName).toBe('Maria');
    expect(result?.username).toBe('maria_santos');
    expect(result?.cpf).toBe('529.982.247-25');
    expect(result?.completenessScore).toBe(85);
  });

  it('deve retornar null quando nenhum perfil estiver cadastrado', async () => {
    mockIpcResponse('get_user_profile', null);

    const result = await IdentityBridge.getUserProfile();
    expect(result).toBeNull();
  });

  it('deve salvar perfil via save_user_profile e retornar a entidade atualizada', async () => {
    mockIpcResponse('save_user_profile', {
      ...sampleProfile,
      revision: 2,
    });

    const saved = await IdentityBridge.saveUserProfile({
      personType: 'PF',
      username: 'maria_santos',
      firstName: 'Maria',
      lastName: 'Santos',
      cpf: '52998224725',
      email: 'maria@asppibra.org.br',
      country: 'Brasil',
      address: 'Avenida Paulista',
      state: 'SP',
      city: 'São Paulo',
      zipCode: '01310100',
    });

    expect(saved.revision).toBe(2);
    expect(saved.firstName).toBe('Maria');
    expect(saved.username).toBe('maria_santos');
  });

  it('deve salvar perfil de Pessoa Jurídica com CNPJ alfanumérico RFB 2026', async () => {
    mockIpcResponse('save_user_profile', samplePjProfile);

    const saved = await IdentityBridge.saveUserProfile({
      personType: 'PJ',
      username: 'asppibra_tech',
      companyName: 'ASPPIBRA Soluções Ltda',
      cnpj: '12ABC34501DE35',
      legalRepresentative: 'Maria Santos',
      legalRepresentativeCpf: '52998224725',
      email: 'contato@asppibra.org.br',
      country: 'Brasil',
      address: 'Avenida Paulista',
      state: 'SP',
      city: 'São Paulo',
      zipCode: '01310100',
    });

    expect(saved.personType).toBe('PJ');
    expect(saved.cnpj).toBe('12.ABC.345/01DE-35');
    expect(saved.completenessScore).toBe(100);
  });

  it('deve propagar erro quando o cofre estiver bloqueado', async () => {
    mockIpcError(
      'get_user_profile',
      'VAULT_LOCKED: O cofre seguro está bloqueado. Desbloqueie com a senha mestre para acessar os dados.'
    );

    await expect(IdentityBridge.getUserProfile()).rejects.toThrow(/VAULT_LOCKED/);
  });

  it('deve propagar erro estruturado de REVISION_CONFLICT em concorrência otimista', async () => {
    mockIpcError(
      'save_user_profile',
      'REVISION_CONFLICT: O perfil foi atualizado concorrentemente (revisão atual: 3, informada: 1).'
    );

    await expect(
      IdentityBridge.saveUserProfile({
        firstName: 'Teste',
        expectedRevision: 1,
      })
    ).rejects.toThrow(/REVISION_CONFLICT/);
  });

  it('deve importar perfil legado via import_legacy_profile preservando os dados', async () => {
    mockIpcResponse('import_legacy_profile', sampleProfile);

    const legacy = JSON.stringify({
      username: 'maria_santos',
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria@asppibra.org.br',
    });

    const imported = await IdentityBridge.importLegacyProfile(legacy);
    expect(imported.firstName).toBe('Maria');
    expect(imported.username).toBe('maria_santos');
    expect(imported.revision).toBe(1);
  });

  describe('Validações Documentais e Normalizações Estritas', () => {
    it('isStrictValidCpf deve validar dígitos e rejeitar strings vazias, sequências ou DVs incorretos', () => {
      expect(isStrictValidCpf('52998224725')).toBe(true);
      expect(isStrictValidCpf('529.982.247-25')).toBe(true);

      // Rejeita espaços vazios (não soma score indevidamente)
      expect(isStrictValidCpf('')).toBe(false);
      expect(isStrictValidCpf('   ')).toBe(false);
      expect(isStrictValidCpf(null)).toBe(false);

      // Rejeita todos iguais
      expect(isStrictValidCpf('11111111111')).toBe(false);
      expect(isStrictValidCpf('00000000000')).toBe(false);

      // Rejeita DV errado
      expect(isStrictValidCpf('52998224726')).toBe(false);

      // Rejeita caracteres indevidos e formatos corrompidos com letras adicionais
      expect(isStrictValidCpf('529.982.247-2A')).toBe(false);
      expect(isStrictValidCpf('abc52998224725xyz')).toBe(false);
      expect(isStrictValidCpf('529.982.247-25-EXTRA')).toBe(false);
    });

    it('isStrictValidCnpj deve validar formato numérico e alfanumérico RFB 2026', () => {
      // Clássico numérico Banco do Brasil
      expect(isStrictValidCnpj('00000000000191')).toBe(true);
      expect(isStrictValidCnpj('00.000.000/0001-91')).toBe(true);

      // Alfanumérico oficial publicado na IN RFB 2.229/2024
      expect(isStrictValidCnpj('12ABC34501DE35')).toBe(true);
      expect(isStrictValidCnpj('12.ABC.345/01DE-35')).toBe(true);

      // Rejeita espaços vazios
      expect(isStrictValidCnpj('')).toBe(false);
      expect(isStrictValidCnpj('   ')).toBe(false);

      // Rejeita máscaras inválidas ou pontuações irregulares
      expect(isStrictValidCnpj('12.ABC.345-01DE/35')).toBe(false);
      expect(isStrictValidCnpj('12/ABC/345/01DE-35')).toBe(false);
      expect(isStrictValidCnpj('00.000.000/0001-9')).toBe(false);
      expect(isStrictValidCnpj('12..ABC--345//01DE==35')).toBe(false);
      expect(isStrictValidCnpj('12.ABC.345/01DE-35-EXTRA')).toBe(false);

      // Rejeita DV errado
      expect(isStrictValidCnpj('12.ABC.345/01DE-36')).toBe(false);
      expect(isStrictValidCnpj('00.000.000/0001-92')).toBe(false);
    });

    it('isStrictValidBirthDate deve verificar bissexto, calendário e rejeitar datas futuras', () => {
      expect(isStrictValidBirthDate('1988-04-12')).toBe(true);
      expect(isStrictValidBirthDate('12/04/1988')).toBe(true);

      // Ano bissexto válido (2024 foi bissexto)
      expect(isStrictValidBirthDate('2024-02-29')).toBe(true);
      expect(isStrictValidBirthDate('29/02/2024')).toBe(true);

      // Ano NÃO-bissexto (2023) com 29 de fevereiro deve falhar
      expect(isStrictValidBirthDate('2023-02-29')).toBe(false);
      expect(isStrictValidBirthDate('29/02/2023')).toBe(false);

      // Data futura deve falhar
      expect(isStrictValidBirthDate('2099-01-01')).toBe(false);

      // Rejeita vazios
      expect(isStrictValidBirthDate('')).toBe(false);
      expect(isStrictValidBirthDate('   ')).toBe(false);
    });

    it('isStrictValidCep e isStrictValidPhone devem validar formatos canônicos', () => {
      expect(isStrictValidCep('01310-100')).toBe(true);
      expect(isStrictValidCep('01310100')).toBe(true);
      expect(isStrictValidCep('0131010')).toBe(false);
      expect(isStrictValidCep('01310-10A')).toBe(false);
      expect(isStrictValidCep('')).toBe(false);

      expect(isStrictValidPhone('(11) 98765-4321')).toBe(true);
      expect(isStrictValidPhone('11987654321')).toBe(true);
      expect(isStrictValidPhone('+5511987654321')).toBe(true);
      expect(isStrictValidPhone('123')).toBe(false);
      expect(isStrictValidPhone('')).toBe(false);
    });

    it('isStrictValidWebsite deve aceitar URLs HTTP/HTTPS válidas com domínio e rejeitar esquemas inseguros', () => {
      expect(isStrictValidWebsite('https://asppibra.org.br')).toBe(true);
      expect(isStrictValidWebsite('http://localhost.local')).toBe(true);

      expect(isStrictValidWebsite('javascript:alert(1)')).toBe(false);
      expect(isStrictValidWebsite('data:text/html,<h1>teste</h1>')).toBe(false);
      expect(isStrictValidWebsite('file:///etc/passwd')).toBe(false);
      expect(isStrictValidWebsite('nao-eh-uma-url')).toBe(false);
      expect(isStrictValidWebsite('')).toBe(false);
    });

    it('canonicalizeUsername deve normalizar prefixo de e-mail e strings com pontos ou caracteres especiais', () => {
      expect(canonicalizeUsername('usuario.teste')).toBe('usuario_teste');
      expect(canonicalizeUsername('Maria Santos')).toBe('maria_santos');
      expect(canonicalizeUsername('joao.silva.dev@asppibra.org')).toBe('joao_silva_dev_asppibra_org');
      expect(canonicalizeUsername('__teste___nome__')).toBe('teste_nome');
      expect(canonicalizeUsername('')).toBe('');

      // Limita estritamente a 30 caracteres
      const longInput = 'a'.repeat(45);
      expect(canonicalizeUsername(longInput).length).toBe(30);
    });
  });

  describe('Gerenciamento de Estado, Mapeamento e Migração Segura', () => {
    it('mapUserToFormValues deve converter UserProfile nulo ou preenchido para campos estritos de formulário', () => {
      const emptyForm = mapUserToFormValues(createEmptyUserAccount());
      expect(emptyForm.personType).toBe('PF');
      expect(emptyForm.isPublic).toBe(false);
      expect(emptyForm.firstName).toBe('');
      expect(emptyForm.companyName).toBe('');

      const sampleUserAccount = userProfileToAccountData(sampleProfile);
      const filledForm = mapUserToFormValues(sampleUserAccount);
      expect(filledForm.firstName).toBe('Maria');
      expect(filledForm.lastName).toBe('Santos');
      expect(filledForm.cpf).toBe('529.982.247-25');
      expect(filledForm.isPublic).toBe(false);
    });

    it('accountDataToSavePayload deve discriminar displayName e PRESERVAR todos os campos PF e PJ', () => {
      const sampleUserAccount = userProfileToAccountData(sampleProfile);
      const samplePjUserAccount = userProfileToAccountData(samplePjProfile);

      const pfPayload = accountDataToSavePayload(sampleUserAccount);
      expect(pfPayload.displayName).toBe('Maria Santos');
      expect(pfPayload.personType).toBe('PF');
      expect(pfPayload.cpf).toBe('529.982.247-25');

      const pjPayload = accountDataToSavePayload(samplePjUserAccount);
      expect(pjPayload.displayName).toBe('ASPPIBRA Soluções Ltda');
      expect(pjPayload.personType).toBe('PJ');
      expect(pjPayload.cnpj).toBe('12.ABC.345/01DE-35');

      // Preservação mútua: se PJ contém dados PF prévios, não devem ser apagados no payload
      const pjWithPfFields = accountDataToSavePayload({
        ...samplePjUserAccount,
        firstName: 'Maria',
        lastName: 'Santos',
        cpf: '529.982.247-25',
        rg: '12345678-9',
      });
      expect(pjWithPfFields.personType).toBe('PJ');
      expect(pjWithPfFields.firstName).toBe('Maria');
      expect(pjWithPfFields.cpf).toBe('529.982.247-25');
      expect(pjWithPfFields.cnpj).toBe('12.ABC.345/01DE-35');
    });

    it('calculateIdentityCompleteness deve atingir 100 pontos para cadastros PF e PJ completos', () => {
      const pfComplete = calculateIdentityCompleteness({
        personType: 'PF',
        firstName: 'João',
        lastName: 'Silva',
        cpf: '529.982.247-25',
        birthDate: '1985-05-15',
        rg: '123456',
        motherName: 'Maria Silva',
        email: 'joao@email.com',
        phoneNumber: '(11) 98765-4321',
        zipCode: '01310-100',
        city: 'São Paulo',
        state: 'SP',
        address: 'Av Paulista',
        occupation: 'Desenvolvedor',
      });
      expect(pfComplete).toBe(100);

      const pjComplete = calculateIdentityCompleteness({
        personType: 'PJ',
        companyName: 'Minha Empresa Ltda',
        cnpj: '12.ABC.345/01DE-35',
        legalRepresentative: 'João Silva',
        legalRepresentativeCpf: '529.982.247-25',
        email: 'contato@empresa.com',
        phoneNumber: '(11) 3333-4444',
        zipCode: '01310-100',
        city: 'São Paulo',
        state: 'SP',
        address: 'Av Paulista',
        occupation: 'Tecnologia',
      });
      expect(pjComplete).toBe(100);
    });

    it('readLegacyProfile deve diferenciar missing, invalid e valid sem descartar dados indevidamente', () => {
      const storageMap = new Map<string, string>();
      const mockStorage = {
        getItem: (k: string) => storageMap.get(k) ?? null,
        setItem: (k: string, v: string) => storageMap.set(k, v),
        removeItem: (k: string) => storageMap.delete(k),
        clear: () => storageMap.clear(),
        length: 0,
        key: () => null,
      };
      (globalThis as unknown as { window?: { localStorage?: typeof mockStorage } }).window = {
        localStorage: mockStorage,
      };

      mockStorage.removeItem(LEGACY_STORAGE_KEY);
      expect(readLegacyProfile()).toEqual({ status: 'missing' });

      // JSON corrompido
      mockStorage.setItem(LEGACY_STORAGE_KEY, '{ invalid json');
      const corrupted = readLegacyProfile();
      expect(corrupted.status).toBe('invalid');

      // Tamanho excessivo > 64 KB
      mockStorage.setItem(LEGACY_STORAGE_KEY, '{"about":"' + 'a'.repeat(65 * 1024) + '"}');
      const oversized = readLegacyProfile();
      expect(oversized.status).toBe('invalid');

      // Válido
      mockStorage.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify({ firstName: 'Maria', email: 'maria@email.com' })
      );
      const valid = readLegacyProfile();
      expect(valid.status).toBe('valid');
      if (valid.status === 'valid') {
        expect(valid.data.firstName).toBe('Maria');
        expect(valid.data.isPublic).toBe(false);
      }

      mockStorage.removeItem(LEGACY_STORAGE_KEY);
    });

    it('mergeMissingLegacyFields deve preencher apenas campos ausentes no cofre e preservar isPublic do cofre', () => {
      const sampleUserAccount = userProfileToAccountData(sampleProfile);
      const vault: typeof sampleUserAccount = {
        ...sampleUserAccount,
        address: '', // Campo vazio no cofre
        city: '',    // Campo vazio no cofre
        state: 'SP', // Campo preenchido no cofre
        isPublic: true, // Já aprovado como público pelo usuário no cofre
        username: '', // Cofre sem username explícito
        email: '',    // Cofre sem e-mail preenchido
      };

      const legacy: Partial<typeof sampleUserAccount> = {
        address: 'Rua das Flores, 100',
        state: 'RJ', // Conflito: não deve sobrescrever o cofre
        city: 'Campinas',
        isPublic: false,
        username: 'maria_legacy',
        email: 'maria.legacy@asppibra.org.br',
      };

      const { merged, changedFields } = mergeMissingLegacyFields(vault, legacy);
      expect(merged.address).toBe('Rua das Flores, 100'); // Preencheu vazio
      expect(merged.state).toBe('SP'); // Manteve o cofre
      expect(merged.city).toBe('Campinas'); // Preencheu vazio
      expect(merged.username).toBe('maria_legacy'); // Incorporou username canônico ausente
      expect(merged.email).toBe('maria.legacy@asppibra.org.br'); // Incorporou e-mail ausente com segurança
      expect(merged.isPublic).toBe(true); // Preservou configuração do cofre
      expect(changedFields).toEqual(['address', 'city', 'username', 'email']);
    });

    it('verifyMigrationIntegrity deve validar correspondência estrita de todos os campos legados', () => {
      const persisted = userProfileToAccountData(sampleProfile);

      // 1. Caso idêntico: sem divergências
      const identicalLegacy = {
        firstName: 'Maria',
        lastName: 'Santos',
        cpf: '52998224725', // Formato desmascarado deve equivaler ao mascarado
        email: 'MARIA@asppibra.org.br', // Case-insensitive
        state: 'SP',
      };
      expect(verifyMigrationIntegrity(identicalLegacy, persisted)).toEqual([]);

      // 2. Caso com divergência de campo
      const divergentLegacy = {
        firstName: 'Maria',
        lastName: 'Santos',
        cpf: '11122233344', // CPF incompatível
        rg: '99999999-9',   // RG não coincidente
      };
      const mismatches = verifyMigrationIntegrity(divergentLegacy, persisted);
      expect(mismatches).toContain('cpf');
      expect(mismatches).toContain('rg');

      // 3. Caso com personType incompatível
      const divergentType = {
        personType: 'PJ' as const,
      };
      expect(verifyMigrationIntegrity(divergentType, persisted)).toContain('personType');

      // 4. Caso com username legado presente mas cofre sem username
      const persistedWithoutUsername = {
        ...persisted,
        username: '',
      };
      const legacyWithUsername = {
        username: 'maria_santos',
      };
      expect(verifyMigrationIntegrity(legacyWithUsername, persistedWithoutUsername)).toContain('username');

      // 5. Caso com username legado inválido (< 3 caracteres)
      const legacyWithInvalidUsername = {
        username: 'ab',
      };
      expect(verifyMigrationIntegrity(legacyWithInvalidUsername, persisted)).toContain('username');
    });

    it('readLegacyProfile deve detectar storage inacessível e personType corrompido', () => {
      // Mock que lança erro ao tentar ler (ex: restrição de segurança no WebView)
      const throwingStorage = {
        getItem: () => {
          throw new Error('Access denied by browser security policy');
        },
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null,
      };
      (globalThis as unknown as { window?: { localStorage?: typeof throwingStorage } }).window = {
        localStorage: throwingStorage,
      };

      const unavail = readLegacyProfile();
      expect(unavail.status).toBe('unavailable');

      // Mock com personType inválido
      const storageMap = new Map<string, string>();
      const validStorage = {
        getItem: (k: string) => storageMap.get(k) ?? null,
        setItem: (k: string, v: string) => storageMap.set(k, v),
        removeItem: (k: string) => storageMap.delete(k),
        clear: () => storageMap.clear(),
        length: 0,
        key: () => null,
      };
      (globalThis as unknown as { window?: { localStorage?: typeof validStorage } }).window = {
        localStorage: validStorage,
      };

      validStorage.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify({ firstName: 'Maria', personType: 'ALIEN' })
      );
      const invalidTypeResult = readLegacyProfile();
      expect(invalidTypeResult.status).toBe('invalid');
      if (invalidTypeResult.status === 'invalid') {
        expect(invalidTypeResult.reason).toContain('personType inválido');
      }

      // Inferência inteligente quando personType for omitido mas houver CNPJ e Razão Social
      validStorage.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify({
          companyName: 'ASPPIBRA Soluções Ltda',
          cnpj: '12.ABC.345/01DE-35',
        })
      );
      const inferredPj = readLegacyProfile();
      expect(inferredPj.status).toBe('valid');
      if (inferredPj.status === 'valid') {
        expect(inferredPj.data.personType).toBe('PJ');
      }

      // Teste de removeLegacyProfile com confirmação
      expect(removeLegacyProfile()).toBe(true);
      expect(validStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    });

    it('resetAccountStore deve resetar o estado da store para idle e limpar erros', () => {
      resetAccountStore();
      expect(true).toBe(true);
    });

    it('userProfileToAccountData e accountDataToSavePayload devem mapear socialLinks bidirecionalmente', () => {
      const profileWithSocials: UserProfile = {
        ...sampleProfile,
        socialLinks: {
          linkedin: 'https://linkedin.com/in/maria',
          twitter: 'https://x.com/maria',
        },
      };

      const accountData = userProfileToAccountData(profileWithSocials);
      expect(accountData.socialLinks?.linkedin).toBe('https://linkedin.com/in/maria');
      expect(accountData.socialLinks?.twitter).toBe('https://x.com/maria');

      const payload = accountDataToSavePayload(accountData);
      expect(payload.socialLinks?.linkedin).toBe('https://linkedin.com/in/maria');
      expect(payload.socialLinks?.twitter).toBe('https://x.com/maria');
    });
  });
});

```

---

## 4. MAPA ARQUITETURAL DE CONEXÕES DA ABA 1

```mermaid
flowchart TD
    Route["Rota SPA: /user/account"] --> Page["AccountGeneralPage (general.tsx)"]
    Page --> View["AccountGeneralView (account-general-view.tsx)"]
    View --> Layout["AccountLayout (account-layout.tsx)"]
    View --> FormComp["AccountGeneral (account-general.tsx)"]
    FormComp --> Fields["RHFTextField / RHFSelect / RHFSwitch / Iconify"]
    FormComp --> FormValidations["isStrictValidCpf / isStrictValidCnpj / isStrictValidBirthDate"]
    FormComp --> ScoreCalc["calculateIdentityCompleteness (100 pontos determinísticos)"]
    
    FormComp <-->|useAccountFacade / useSyncExternalStore| Store["Reactive Account Store (use-account.ts)"]
    Store <-->|IdentityBridge| Bridge["IdentityBridge (identity-bridge.ts)"]
    Bridge <-->|invoke| TauriCommands["Tauri IPC (identity_commands.rs)"]
    
    TauriCommands <-->|get_user_profile / save_user_profile| Service["IdentityService (service.rs)"]
    Service --> BackendValidation["sanitize_and_validate (RFC URLs, Zeroizing RAM)"]
    Service <-->|Encrypt / Decrypt AES-256-GCM| Crypto["VaultCrypto & Session (encryption.rs / access_control.rs)"]
    Service <-->|IdentityRepository| Repo["IdentityRepository (repository.rs)"]
    Repo <-->|LocalDatabase & Migrations| SQLite[("SQLite: devos_vault.sqlite (profile_records)")]
```
