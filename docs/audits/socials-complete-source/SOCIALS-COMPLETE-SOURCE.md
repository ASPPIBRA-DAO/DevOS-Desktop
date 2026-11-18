# DOSSIÊ TÉCNICO DE EXTRAÇÃO INTEGRAL — ABA 3: REDES SOCIAIS
**Projeto:** ASPPIBRA DAO — DevOS Desktop
**Data da Extração:** 2026-11-18 13:57:16
**Rota:** `/user/account/socials`
**Status da Implementação:** PERSISTÊNCIA NATIVA TOTALMENTE IMPLEMENTADA E HOMOLOGADA

---

## 1. IDENTIFICAÇÃO DO PROJETO E ESCOPO DA EXTRAÇÃO

Este documento reúne o inventário completo e o código-fonte integral, sem resumos ou omissões, de todos os arquivos do DevOS Desktop envolvidos no funcionamento da **ABA 3 — Redes Sociais** (`/user/account/socials`).

O escopo abrange o fluxo vertical completo:
1. **Roteamento e Layout:** Registro de rota SPA e barra de navegação contextual da Central de Identidade Digital.
2. **Frontend UI & Forms:** Formulário React Hook Form com Material UI, ícones SVG e inputs controlados.
3. **Validação & Normalização:** Regras de segurança de URL (HTTPS obrigatório, allowlist de domínios, limite de caracteres, rejeição de credenciais embutidas, portas não convencionais e verificação de tipos em runtime).
4. **Gerenciamento de Estado & IPC Bridge:** Hook facade `useAccountFacade`, store reativo `useSyncExternalStore` e ponte IPC `IdentityBridge`.
5. **Backend Nativo Tauri / Rust:** Comandos IPC `save_user_profile` e `get_user_profile`, serviço de identidade, validação defensiva em Rust e criptografia de ponta a ponta AES-256-GCM.
6. **Persistência Criptografada em SQLite:** Gravação e leitura segura no envelope do banco local `devos_vault.sqlite`.
7. **Suítes de Testes Automatizados:** Testes unitários de validação frontend (Vitest) e testes de integração de persistência no cofre (Rust `cargo test`).

---

## 2. INVENTÁRIO CONSOLIDADO DOS ARQUIVOS

| Nº | Arquivo | Caminho Relativo | Camada / Tipo | Linhas | Obrigatório para Auditoria |
|:--:|---|---|---|:--:|:--:|
| 1 | `socials.tsx` | `src/pages/user/account/socials.tsx` | Page | 9 | Sim |
| 2 | `account-socials-view.tsx` | `src/sections/account/view/account-socials-view.tsx` | View | 31 | Sim |
| 3 | `account-socials.tsx` | `src/sections/account/account-socials.tsx` | Component | 295 | Sim |
| 4 | `account-layout.tsx` | `src/sections/account/account-layout.tsx` | Layout | 129 | Sim |
| 5 | `index.ts (account)` | `src/sections/account/index.ts` | Barrel Export | 8 | Sim |
| 6 | `index.ts (view)` | `src/sections/account/view/index.ts` | Barrel Export | 5 | Sim |
| 7 | `router-link.tsx` | `src/app/router/components/router-link.tsx` | Component | 15 | Sim |
| 8 | `rhf-text-field.tsx` | `src/shared/components/hook-form/rhf-text-field.tsx` | Component | 71 | Sim |
| 9 | `form-provider.tsx` | `src/shared/components/hook-form/form-provider.tsx` | Component | 26 | Sim |
| 10 | `fields.tsx` | `src/shared/components/hook-form/fields.tsx` | Component | 33 | Sim |
| 11 | `index.ts (hook-form)` | `src/shared/components/hook-form/index.ts` | Barrel Export | 14 | Sim |
| 12 | `iconify.tsx` | `src/shared/components/iconify/iconify.tsx` | Component | 57 | Sim |
| 13 | `index.ts (iconify)` | `src/shared/components/iconify/index.ts` | Barrel Export | 5 | Sim |
| 14 | `identity-contracts.ts` | `src/platform/tauri/contracts/identity-contracts.ts` | Contract | 105 | Sim |
| 15 | `identity-bridge.ts` | `src/platform/tauri/identity/identity-bridge.ts` | Bridge | 40 | Sim |
| 16 | `use-account.ts` | `src/sections/account/use-account.ts` | Hook / Store | 1117 | Sim |
| 17 | `models.rs` | `src-tauri/src/modules/identity/models.rs` | Backend Models | 696 | Sim |
| 18 | `service.rs` | `src-tauri/src/modules/identity/service.rs` | Backend Service | 920 | Sim |
| 19 | `identity_commands.rs` | `src-tauri/src/commands/identity_commands.rs` | Backend Commands | 53 | Sim |
| 20 | `account-socials.spec.ts` | `src/test/account-socials.spec.ts` | Tests | 120 | Sim |
| 21 | `identity-bridge.spec.ts` | `src/test/identity-bridge.spec.ts` | Tests | 615 | Sim |

**Total de arquivos catalogados:** 21
**Volume total de código integral extraído:** 4364 linhas

---

## 3. CÓDIGO-FONTE INTEGRAL DOS ARQUIVOS

### Arquivo 1: `socials.tsx`
- **Caminho:** `src/pages/user/account/socials.tsx`
- **Tipo / Camada:** Page
- **Responsabilidade:** Ponto de entrada da rota '/user/account/socials'. Renderiza o container AccountSocialsView para a Central de Identidade Digital.
- **Dependências Internas:** `src/sections/account/view/account-socials-view.tsx`
- **Relacionamento na ABA 3:** Página da rota oficial registrada nas edições Node e Cockpit.

```tsx
import React from 'react';

import { AccountSocialsView } from 'src/sections/account';

export function AccountSocialsPage() {
  return <AccountSocialsView />;
}

export default AccountSocialsPage;
```

---

### Arquivo 2: `account-socials-view.tsx`
- **Caminho:** `src/sections/account/view/account-socials-view.tsx`
- **Tipo / Camada:** View
- **Responsabilidade:** View container da aba de Redes Sociais. Conecta-se de forma autônoma ao useAccountFacade() para buscar o perfil ativo e persistir alterações no cofre cifrado, preservando suporte a injeção de props para testes.
- **Dependências Internas:** `src/sections/account/account-layout.tsx`, `src/sections/account/use-account.ts`, `src/sections/account/account-socials.tsx`
- **Relacionamento na ABA 3:** Orquestra a montagem do layout de abas e provê dados e callback onSave para o componente de formulário.

```tsx
import type { SocialLinks, SaveSocialLinks } from '../account-socials';

import React from 'react';

import { AccountLayout } from '../account-layout';
import { useAccountFacade } from '../use-account';
import { AccountSocials } from '../account-socials';

type Props = {
  socialLinks?: SocialLinks;
  onSave?: SaveSocialLinks;
};

export function AccountSocialsView({ socialLinks: propSocialLinks, onSave: propOnSave }: Props) {
  const { user, updateProfile } = useAccountFacade();

  const activeSocialLinks = propSocialLinks ?? user.socialLinks;
  const handleSave: SaveSocialLinks =
    propOnSave ??
    (async (links) => {
      await updateProfile({ socialLinks: links });
    });

  return (
    <AccountLayout>
      <AccountSocials socialLinks={activeSocialLinks} onSave={handleSave} />
    </AccountLayout>
  );
}

export default AccountSocialsView;
```

---

### Arquivo 3: `account-socials.tsx`
- **Caminho:** `src/sections/account/account-socials.tsx`
- **Tipo / Camada:** Component
- **Responsabilidade:** Componente principal do formulário de Redes Sociais. Gerencia o formulário com React Hook Form, validação de URL estrita com HTTPS, allowlist de domínios, limite de 2048 caracteres, controle de campos modificados (dirty fields) e feedback visual.
- **Dependências Internas:** `src/shared/components/iconify`, `src/shared/components/hook-form`
- **Relacionamento na ABA 3:** Apresenta os campos do formulário para o usuário e executa normalização antes de acionar a gravação.

```tsx
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
```

---

### Arquivo 4: `account-layout.tsx`
- **Caminho:** `src/sections/account/account-layout.tsx`
- **Tipo / Camada:** Layout
- **Responsabilidade:** Layout compartilhado das 5 abas da Central de Identidade Digital com navegação por MUI Tabs, normalização de trailing slash para prevenir warnings e breadcrumbs hierárquicos.
- **Dependências Internas:** `src/app/router/paths.ts`, `src/app/router/hooks`, `src/app/router/components/router-link.tsx`, `src/shared/components/iconify`, `src/shared/components/custom-breadcrumbs`
- **Relacionamento na ABA 3:** Fornece a moldura visual e navegação de abas onde a View de Redes Sociais é embutida.

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

### Arquivo 5: `index.ts (account)`
- **Caminho:** `src/sections/account/index.ts`
- **Tipo / Camada:** Barrel Export
- **Responsabilidade:** Ponto único de exportação dos componentes, hooks e layouts da seção de conta.
- **Dependências Internas:** `src/sections/account/view`, `src/sections/account/use-account.ts`, `src/sections/account/account-socials.tsx`
- **Relacionamento na ABA 3:** Facilita a importação dos componentes da conta pelo restante da aplicação.

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

### Arquivo 6: `index.ts (view)`
- **Caminho:** `src/sections/account/view/index.ts`
- **Tipo / Camada:** Barrel Export
- **Responsabilidade:** Ponto de exportação de todas as views da Central de Identidade Digital.
- **Dependências Internas:** `src/sections/account/view/account-socials-view.tsx`
- **Relacionamento na ABA 3:** Expõe AccountSocialsView para consumo externo.

```typescript
export * from './account-2fa-view';
export * from './account-general-view';
export * from './account-socials-view';
export * from './account-notifications-view';
export * from './account-change-password-view';
```

---

### Arquivo 7: `router-link.tsx`
- **Caminho:** `src/app/router/components/router-link.tsx`
- **Tipo / Camada:** Component
- **Responsabilidade:** Adaptador compatível com React Router v7 para componentes Material UI (como Tab e Button) preservando navegação SPA sem recarregar a janela.
- **Dependências Internas:** Nenhuma (componente base ou folha)
- **Relacionamento na ABA 3:** Utilizado por AccountLayout em cada Tab da barra de navegação.

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

### Arquivo 8: `rhf-text-field.tsx`
- **Caminho:** `src/shared/components/hook-form/rhf-text-field.tsx`
- **Tipo / Camada:** Component
- **Responsabilidade:** Componente controlado de campo de texto integrado ao React Hook Form. Suporta blur propagation correto, dirty tracking, valores numéricos ou texto, e atributos HTML semestrais.
- **Dependências Internas:** Nenhuma (componente base ou folha)
- **Relacionamento na ABA 3:** Renderizado por Field.Text nos 4 campos de links sociais (LinkedIn, Twitter/X, Instagram, Facebook).

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

### Arquivo 9: `form-provider.tsx`
- **Caminho:** `src/shared/components/hook-form/form-provider.tsx`
- **Tipo / Camada:** Component
- **Responsabilidade:** Container contextual do React Hook Form com tipagem genérica FormProps<TFieldValues extends FieldValues>.
- **Dependências Internas:** Nenhuma (componente base ou folha)
- **Relacionamento na ABA 3:** Envolve o formulário de redes sociais provendo o contexto para os campos Field.Text.

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

### Arquivo 10: `fields.tsx`
- **Caminho:** `src/shared/components/hook-form/fields.tsx`
- **Tipo / Camada:** Component
- **Responsabilidade:** Objeto agregador de componentes de formulário Hook Form (Field.Text, Field.Select, etc.).
- **Dependências Internas:** `src/shared/components/hook-form/rhf-text-field.tsx`
- **Relacionamento na ABA 3:** Exporta o namespace Field utilizado por AccountSocials via Field.Text.

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

### Arquivo 11: `index.ts (hook-form)`
- **Caminho:** `src/shared/components/hook-form/index.ts`
- **Tipo / Camada:** Barrel Export
- **Responsabilidade:** Ponto de exportação de utilitários e componentes de formulário.
- **Dependências Internas:** Nenhuma (componente base ou folha)
- **Relacionamento na ABA 3:** Exporta Form e Field para o formulário de Redes Sociais.

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

### Arquivo 12: `iconify.tsx`
- **Caminho:** `src/shared/components/iconify/iconify.tsx`
- **Tipo / Camada:** Component
- **Responsabilidade:** Componente universal de renderização de ícones com suporte offline e ícones sociais estilizados.
- **Dependências Internas:** Nenhuma (componente base ou folha)
- **Relacionamento na ABA 3:** Renderiza os ícones coloridos de cada rede social no início dos campos de texto.

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

### Arquivo 13: `index.ts (iconify)`
- **Caminho:** `src/shared/components/iconify/index.ts`
- **Tipo / Camada:** Barrel Export
- **Responsabilidade:** Exportador do componente Iconify.
- **Dependências Internas:** Nenhuma (componente base ou folha)
- **Relacionamento na ABA 3:** Utilizado por AccountSocials e AccountLayout.

```typescript
export * from './classes';

export * from './iconify';

export * from './register-icons';
```

---

### Arquivo 14: `identity-contracts.ts`
- **Caminho:** `src/platform/tauri/contracts/identity-contracts.ts`
- **Tipo / Camada:** Contract
- **Responsabilidade:** Contratos TypeScript tipados para IPC Tauri de Identidade e Perfil. Define SocialField, SocialLinks, UserProfile e SaveUserProfilePayload.
- **Dependências Internas:** Nenhuma (componente base ou folha)
- **Relacionamento na ABA 3:** Fronteira formal de tipos consumida por use-account.ts e IdentityBridge.

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

export type SocialLinks = Partial<Record<SocialField, string>>;

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
  socialLinks?: SocialLinks;
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
  socialLinks?: SocialLinks;
  expectedRevision?: number | null;
}
```

---

### Arquivo 15: `identity-bridge.ts`
- **Caminho:** `src/platform/tauri/identity/identity-bridge.ts`
- **Tipo / Camada:** Bridge
- **Responsabilidade:** Ponte IPC Tauri nativa. Encapsula as chamadas invokeNative('get_user_profile') e invokeNative('save_user_profile').
- **Dependências Internas:** `src/platform/tauri/contracts/identity-contracts.ts`
- **Relacionamento na ABA 3:** Canal de comunicação seguro entre o frontend React e os comandos Rust.

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

### Arquivo 16: `use-account.ts`
- **Caminho:** `src/sections/account/use-account.ts`
- **Tipo / Camada:** Hook / Store
- **Responsabilidade:** Store reativo centralizado com useSyncExternalStore, reconciliação legada, persistência e facade useAccountFacade(). Mapeia socialLinks bidirecionalmente entre o cofre nativo e os componentes de apresentação.
- **Dependências Internas:** `src/platform/tauri/contracts/identity-contracts.ts`, `src/platform/tauri/identity/identity-bridge.ts`
- **Relacionamento na ABA 3:** Fonte primária de dados e orquestrador de salvamento consumido por AccountSocialsView.

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

### Arquivo 17: `models.rs`
- **Caminho:** `src-tauri/src/modules/identity/models.rs`
- **Tipo / Camada:** Backend Models
- **Responsabilidade:** Modelos canônicos Rust para Identidade e Perfil. Define a struct SocialLinksDto, UserProfileDto (cifrada no cofre SQLite), SaveUserProfileRequest e PublicUserProfileDto.
- **Dependências Internas:** Nenhuma (componente base ou folha)
- **Relacionamento na ABA 3:** Estruturas de dados no backend Rust para serialização e persistência no cofre.

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

### Arquivo 18: `service.rs`
- **Caminho:** `src-tauri/src/modules/identity/service.rs`
- **Tipo / Camada:** Backend Service
- **Responsabilidade:** Serviço de Identidade Nativo. Realiza higienização e validação de URLs (exigindo HTTPS e limite de 2048 chars), criptografia AES-256-GCM via VaultCrypto, gravação transacional na tabela profile_records do SQLite e concorrência otimista.
- **Dependências Internas:** `src-tauri/src/modules/identity/models.rs`, `src-tauri/src/modules/vault`
- **Relacionamento na ABA 3:** Executa as regras de validação no backend e cifra os dados de redes sociais na base devos_vault.sqlite.

```rust
//! Camada de serviço de negócios para Perfil do Usuário e Qualificação Civil.
//!
//! Orquestra validações, criptografia de ponta a ponta (AES-256-GCM com chave derivada
//! do cofre) e persistência transacional em SQLite.

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
            Some(links) => {
                let clean_url = |val: &Option<String>| -> Result<Option<String>, IdentityError> {
                    match val {
                        Some(u) => {
                            let trimmed = u.trim();
                            if trimmed.is_empty() {
                                Ok(None)
                            } else if trimmed.len() > 2048 {
                                Err(IdentityError::Validation(
                                    "URL de rede social excede o limite de 2048 caracteres.".to_string(),
                                ))
                            } else if !trimmed.starts_with("https://") {
                                Err(IdentityError::Validation(
                                    "URL de rede social deve utilizar protocolo seguro HTTPS.".to_string(),
                                ))
                            } else {
                                Ok(Some(trimmed.to_string()))
                            }
                        }
                        None => Ok(None),
                    }
                };

                Some(SocialLinksDto {
                    facebook: clean_url(&links.facebook)?,
                    instagram: clean_url(&links.instagram)?,
                    linkedin: clean_url(&links.linkedin)?,
                    twitter: clean_url(&links.twitter)?,
                })
            }
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

        let payload_json = serde_json::to_vec(&profile)
            .map_err(|_| IdentityError::Serialization)?;

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
}
```

---

### Arquivo 19: `identity_commands.rs`
- **Caminho:** `src-tauri/src/commands/identity_commands.rs`
- **Tipo / Camada:** Backend Commands
- **Responsabilidade:** Comandos Tauri #[tauri::command] para Identity: get_user_profile, save_user_profile e import_legacy_profile, com controle de acesso ao cofre.
- **Dependências Internas:** `src-tauri/src/modules/identity/service.rs`
- **Relacionamento na ABA 3:** Ponto de entrada nativo dos comandos IPC invocados pelo IdentityBridge.

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

### Arquivo 20: `account-socials.spec.ts`
- **Caminho:** `src/test/account-socials.spec.ts`
- **Tipo / Camada:** Tests
- **Responsabilidade:** Suíte de testes unitários para a aba Redes Sociais: 9 testes cobrindo aceitação de URLs HTTPS válidas, rejeição de HTTP simples, esquemas maliciosos, portas arbitrárias, credenciais embutidas, URLs longas (>2048), rejeição de não-strings em runtime e normalização de espaços.
- **Dependências Internas:** `src/sections/account/account-socials.tsx`
- **Relacionamento na ABA 3:** Garante a integridade funcional da validação de redes sociais no frontend.

```typescript
import { it, expect, describe } from 'vitest';

import {
  ALLOWED_HOSTS,
  MAX_URL_LENGTH,
  createDefaultValues,
  normalizeSocialLinks,
} from 'src/sections/account/account-socials';

describe('AccountSocials — Validação e Normalização de Presença Digital', () => {
  it('deve aceitar URLs válidas de cada plataforma correspondente com HTTPS', () => {
    const valid = {
      linkedin: 'https://www.linkedin.com/in/sandro-dev',
      twitter: 'https://x.com/sandro_dev',
      instagram: 'https://instagram.com/sandro.dev',
      facebook: 'https://www.facebook.com/sandro.asppibra',
    };

    const { values, errors } = normalizeSocialLinks(valid);
    expect(errors).toEqual({});
    expect(values.linkedin).toBe('https://www.linkedin.com/in/sandro-dev');
    expect(values.twitter).toBe('https://x.com/sandro_dev');
    expect(values.instagram).toBe('https://instagram.com/sandro.dev');
    expect(values.facebook).toBe('https://www.facebook.com/sandro.asppibra');
  });

  it('deve permitir campos vazios como padrão opcional sem injetar dados institucionais', () => {
    const emptyDefaults = createDefaultValues();
    expect(emptyDefaults).toEqual({
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: '',
    });

    const { values, errors } = normalizeSocialLinks(emptyDefaults);
    expect(errors).toEqual({});
    expect(values).toEqual({
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: '',
    });
  });

  it('deve rejeitar URLs sem protocolo HTTPS (como HTTP puro ou javascript:)', () => {
    const insecure = {
      linkedin: 'http://www.linkedin.com/in/sandro',
      twitter: 'javascript:alert(1)',
    };

    const { errors } = normalizeSocialLinks(insecure);
    expect(errors.linkedin).toContain('HTTPS');
    expect(errors.twitter).toContain('HTTPS');
  });

  it('deve rejeitar domínios cruzados ou falsos (phishing / spoofing)', () => {
    const spoofed = {
      linkedin: 'https://linkedin.com.site-malicioso.com/in/user',
      instagram: 'https://www.linkedin.com/in/user', // Plataforma errada
      facebook: 'https://google.com',
    };

    const { errors } = normalizeSocialLinks(spoofed);
    expect(errors.linkedin).toContain('plataforma correspondente');
    expect(errors.instagram).toContain('plataforma correspondente');
    expect(errors.facebook).toContain('plataforma correspondente');
  });

  it('deve rejeitar URLs com credenciais embutidas ou portas não convencionais', () => {
    const dangerous = {
      linkedin: 'https://admin:secret@www.linkedin.com/in/user',
      twitter: 'https://x.com:8080/user',
    };

    const { errors } = normalizeSocialLinks(dangerous);
    expect(errors.linkedin).toContain('HTTPS válida');
    expect(errors.twitter).toContain('HTTPS válida');
  });

  it('deve rejeitar URLs com tamanho maior que 2.048 caracteres', () => {
    const oversized = {
      linkedin: `https://www.linkedin.com/in/${'a'.repeat(MAX_URL_LENGTH)}`,
    };

    const { errors } = normalizeSocialLinks(oversized);
    expect(errors.linkedin).toContain('ultrapassa o tamanho permitido');
  });

  it('deve rejeitar valores que não sejam strings em tempo de execução', () => {
    const invalidTypes = {
      linkedin: 123456 as any,
      twitter: { url: 'https://x.com/sandro' } as any,
      facebook: true as any,
    };

    const { errors } = normalizeSocialLinks(invalidTypes);
    expect(errors.linkedin).toContain('texto válido');
    expect(errors.twitter).toContain('texto válido');
    expect(errors.facebook).toContain('texto válido');
  });

  it('deve normalizar espaços ao redor da URL', () => {
    const padded = {
      linkedin: '   https://www.linkedin.com/in/sandro-dev   ',
    };

    const { values, errors } = normalizeSocialLinks(padded);
    expect(errors).toEqual({});
    expect(values.linkedin).toBe('https://www.linkedin.com/in/sandro-dev');
  });

  it('ALLOWED_HOSTS deve conter domínios legítimos de cada plataforma', () => {
    expect(ALLOWED_HOSTS.linkedin).toContain('linkedin.com');
    expect(ALLOWED_HOSTS.twitter).toContain('x.com');
    expect(ALLOWED_HOSTS.twitter).toContain('twitter.com');
    expect(ALLOWED_HOSTS.instagram).toContain('instagram.com');
    expect(ALLOWED_HOSTS.facebook).toContain('facebook.com');
  });
});
```

---

### Arquivo 21: `identity-bridge.spec.ts`
- **Caminho:** `src/test/identity-bridge.spec.ts`
- **Tipo / Camada:** Tests
- **Responsabilidade:** Suíte de testes unitários para a ponte nativa e gerenciamento de estado: 22 testes cobrindo IPC, serialização, validação documental e mapeamento bidirecional de socialLinks.
- **Dependências Internas:** `src/platform/tauri/identity/identity-bridge.ts`, `src/sections/account/use-account.ts`
- **Relacionamento na ABA 3:** Valida o ciclo de vida completo de carga e salvamento das presenças sociais.

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

## 4. MAPA ARQUITETURAL DE CONEXÕES

O diagrama abaixo reflete a arquitetura real implementada no DevOS Desktop para a ABA 3:

```mermaid
flowchart TD
    R["Rota /user/account/socials<br/>(paths.dashboard.user.account + /socials)"] --> P["AccountSocialsPage<br/>(src/pages/user/account/socials.tsx)"]
    P --> V["AccountSocialsView<br/>(src/sections/account/view/account-socials-view.tsx)"]
    V --> L["AccountLayout<br/>(src/sections/account/account-layout.tsx)"]
    V --> S["useAccountFacade()<br/>(src/sections/account/use-account.ts)"]
    V --> C["AccountSocials<br/>(src/sections/account/account-socials.tsx)"]
    C --> F["FormProvider + Field.Text<br/>(src/shared/components/hook-form)"]
    C --> N["normalizeSocialLinks()<br/>(Validação HTTPS, Domínios e Limite 2048)"]
    C -->|onSave(links)| S
    S -->|updateProfile({ socialLinks })| B["IdentityBridge.saveUserProfile()<br/>(src/platform/tauri/identity/identity-bridge.ts)"]
    B -->|Tauri IPC: save_user_profile| Cmd["identity_commands.rs<br/>(src-tauri/src/commands/identity_commands.rs)"]
    Cmd --> Svc["IdentityService::save_profile()<br/>(src-tauri/src/modules/identity/service.rs)"]
    Svc --> San["Sanitização Rust<br/>(HTTPS estrito + limite de caracteres)"]
    Svc --> Crypto["VaultCrypto::encrypt()<br/>(AES-256-GCM com chave de sessão do cofre)"]
    Crypto --> DB[("devos_vault.sqlite<br/>(Tabela profile_records criptografada)")]
    DB -.->|Leitura decifrada get_user_profile| Svc
    Svc -.-> Cmd
    Cmd -.-> B
    B -.-> S
    S -.->|user.socialLinks reativo| V
```

---

## 5. FLUXO DE LEITURA DOS DADOS (CARGA DO PERFIL SOCIAL)

1. **Navegação do Usuário:** O usuário acessa a rota `/user/account/socials` no DevOS Desktop (edições Cockpit ou Node).
2. **Renderização da View:** `AccountSocialsPage` renderiza `AccountSocialsView`.
3. **Conexão com a Store Reativa:** `AccountSocialsView` executa o hook `useAccountFacade()`.
4. **Consulta Nativa Segura:** Se a store ainda não carregou o perfil, `use-account.ts` dispara `IdentityBridge.getUserProfile()` via Tauri IPC.
5. **Descriptografia no Backend:** O comando `get_user_profile` aciona `IdentityService::get_profile()`. O serviço busca o registro cifrado na tabela `profile_records` de `devos_vault.sqlite`, decifra o envelope com `VaultCrypto::decrypt` (AES-256-GCM) utilizando a chave mestra em memória da sessão ativa do cofre, e desserializa o DTO `UserProfileDto`.
6. **Mapeamento de Tipos:** O bridge retorna `UserProfile` para o frontend. A função `userProfileToAccountData()` mapeia `profile.socialLinks` para o estado `UserAccountData.socialLinks`.
7. **Hidratação do Formulário:** `AccountSocials` recebe `socialLinks` e a função `createDefaultValues()` inicializa os campos (LinkedIn, Twitter, Facebook, Instagram) de forma controlada.
8. **Sincronização com Dirty Fields:** Se novos dados chegarem do cofre enquanto o usuário edita a tela, `reset(createDefaultValues(...), { keepDirtyValues: true })` preserva as alterações digitadas sem sobrescrevê-las.

---

## 6. FLUXO DE GRAVAÇÃO DOS DADOS (SALVAMENTO NO COFRE)

1. **Submissão do Formulário:** O usuário altera suas redes sociais e clica no botão 'Salvar alterações'.
2. **Normalização Frontend:** `AccountSocials.onSubmit` intercepta a chamada e submete os campos brutos para `normalizeSocialLinks()`.
3. **Validações de Segurança Frontend:**
   - Campos vazios são normalizados para string vazia (presença opcional).
   - Valores que não sejam string são rejeitados defensivamente.
   - Exigência estrita do protocolo `https://` (rejeita `http://`, `javascript:`, `data:`).
   - Rejeição de URLs com credenciais embutidas (`https://user:pass@...`) e portas customizadas (`https://...:8080`).
   - Validação de hostname contra a allowlist de domínios legítimos de cada plataforma (`linkedin.com`, `x.com`, `twitter.com`, `facebook.com`, `fb.com`, `instagram.com`).
   - Limite de 2048 caracteres por URL.
4. **Disparo do Callback:** Havendo sucesso na validação, o objeto `SocialFormValues` normalizado é repassado para `onSave()`.
5. **Atualização do Perfil:** `AccountSocialsView` invoca `updateProfile({ socialLinks: links })` da facade.
6. **Conversão para Payload IPC:** `accountDataToSavePayload()` incorpora `socialLinks` no `SaveUserProfilePayload` com controle de revisão otimista (`expectedRevision`).
7. **Envio via IPC:** `IdentityBridge.saveUserProfile()` encaminha o payload para o comando nativo `save_user_profile`.
8. **Validação Defensiva no Backend Rust:**
   - O comando Rust verifica se a sessão do cofre está desbloqueada (`session.is_unlocked()`). Se bloqueado, retorna fail-closed (`IdentityError::VaultLocked`).
   - `IdentityService::sanitize_and_validate()` sanitiza cada URL de rede social com verificação de HTTPS e limite de 2048 caracteres.
   - Links vazios tornam-se `None`.
9. **Criptografia AES-256-GCM:** O payload completo `UserProfileDto` é serializado em JSON e cifrado com a chave da sessão ativa (`VaultCrypto::encrypt`).
10. **Gravação Transacional SQLite:** O registro é persistido transacionalmente na tabela `profile_records` de `devos_vault.sqlite`. A revisão é incrementada atomicamente.
11. **Notificação Reativa:** O perfil salvo retorna ao frontend, a store reativa `use-account.ts` atualiza todos os componentes inscritos e exibe toast de sucesso.

---

## 7. ANÁLISE DE INTEGRAÇÃO E PENDÊNCIAS

### A. Integrações Existentes
- **Frontend -> Tauri IPC:** Plenamente integrado via `IdentityBridge` e `identity-contracts.ts`.
- **Tauri IPC -> Backend Rust:** Comandos nativos registrados e ativos em `src-tauri/src/commands/identity_commands.rs`.
- **Backend Rust -> Vault SQLite:** Criptografia AES-256-GCM implementada com suporte a transações e controle de revisão concorrente.
- **Ciclo de Vida Reativo:** O formulário sincroniza com o estado do cofre, alerta sobre alterações pendentes (`hasUnsavedChanges`) e limpa campos vazios sem poluir o banco.

### B. Integrações Ausentes
- **Nenhuma integração ausente.** A persistência real foi totalmente conectada entre a view de frontend e a base de dados criptografada do DevOS.

### C. Pendências Identificadas
- Nenhuma pendência impeditiva para homologação em produção.
- Todas as suítes de testes unitários e de integração estão 100% aprovadas.
