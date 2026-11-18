# 03 — Inventário Completo de Componentes da Seção Conta

## 1. Visão Geral do Inventário

Foram identificados e mapeados **16 componentes e views** da seção Central de Identidade Digital, além dos componentes de formulário e utilitários compartilhados (`RHFTextField`, `FormProvider`, etc.).

---

## 2. Inventário Detalhado por Componente

### 2.1 Componente Estrutural Compartilhado: `AccountLayout`
* **Caminho:** [src/sections/account/account-layout.tsx](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/sections/account/account-layout.tsx)
* **Responsabilidade:** Renderizar os breadcrumbs da seção e a barra de navegação horizontal com abas integradas ao React Router.
* **Quem o utiliza:** Utilizado por todas as 5 views (`AccountGeneralView`, `AccountNotificationsView`, `AccountSocialsView`, `AccountChangePasswordView`, `AccountTwoFAView`).
* **Quais componentes utiliza:** `Box`, `Card`, `Tabs`, `Tab` (MUI), `CustomBreadcrumbs`, `Iconify`, `RouterLink`.
* **Props recebidas:** `{ children?: ReactNode }`.
* **Estados internos:** Nenhum (stateless / derivado do pathname).
* **Hooks utilizados:** `usePathname()` (`src/app/router/hooks.ts:16-18`).
* **Serviços chamados:** Nenhum.
* **Dependências externas:** `@mui/material`, `src/app/router`.
* **Eventos executados:** Navegação client-side via `RouterLink` nas abas.
* **Validações aplicadas:** `normalizePathname()` para sanitização de trailing slash e verificação de `hasMatchingTab` para garantir que `Tabs` receba `false` se uma rota anômala for acessada.

---

### 2.2 ABA 1 — Perfil Geral / Identidade Civil (`/user/account`)

#### 2.2.1 `AccountGeneralPage`
* **Caminho:** [src/pages/user/account/general.tsx:5-9](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/pages/user/account/general.tsx)
* **Responsabilidade:** Ponto de entrada no roteador para a rota `/user/account`.
* **Quem o utiliza:** `src/app/editions/edition.node.ts:93`, `src/app/editions/edition.cockpit.ts:190`, `src/pages/user/account/index.tsx:1`.
* **Quais componentes utiliza:** `<AccountGeneralView />`.
* **Props:** Nenhuma.
* **Estados / Hooks / Serviços:** Nenhum.

#### 2.2.2 `AccountGeneralView`
* **Caminho:** [src/sections/account/view/account-general-view.tsx:6-14](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/sections/account/view/account-general-view.tsx)
* **Responsabilidade:** Composição estrutural da tela, inserindo `AccountGeneral` dentro de `AccountLayout`.
* **Quem o utiliza:** `AccountGeneralPage`.
* **Quais componentes utiliza:** `AccountLayout`, `AccountGeneral`.
* **Props / Estados / Hooks:** Nenhum.

#### 2.2.3 `AccountGeneral` (Componente Principal da Aba 1)
* **Caminho:** [src/sections/account/account-general.tsx:412-1025](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/sections/account/account-general.tsx)
* **Responsabilidade:** Gestão cadastral completa de qualificação civil para Pessoa Física (PF) e Pessoa Jurídica (PJ), cálculo de completude de score em tempo real, visualização de privacidade (modo público/privado) e reconciliação de conflitos de migração.
* **Quem o utiliza:** `AccountGeneralView`.
* **Quais componentes utiliza:**
  - Material UI: `Box`, `Grid`, `Card`, `Stack`, `Button`, `Typography`, `Alert`, `AlertTitle`, `LinearProgress`, `Chip`, `Switch`, `FormControlLabel`, `MenuItem`.
  - Hook Form: `Form`, `Field.Text`, `Field.Select`, `Field.Switch`.
  - Ícones & Feedback: `Iconify`, `toast`.
* **Props:** Nenhuma (conecta-se autonomamente ao store reativo `useAccountFacade`).
* **Estados internos:**
  - Gerenciados via `useForm`: `isSubmitting`, `isDirty`, `dirtyFields`.
* **Hooks utilizados:**
  - `useAccountFacade()`: Retorna `{ user, loadStatus, updateProfile, isLoading, isSaving, isVaultLocked, error, migrationStatus, resolveMigrationConflict, refreshProfile }`.
  - `useForm<UpdateUserSchemaType>()`: Instância do formulário com `zodResolver(UpdateUserSchema)` em modo `onTouched`.
  - `useWatch()`: Observação reativa de 20 campos cadastrais para cálculo dinâmico do `completenessScore`.
  - `useMemo()`: Para memoização de `defaultValues` e cálculo de `completenessScore`.
  - `useEffect()`: Para sincronização externa de dados do store quando o formulário não estiver em estado `isDirty`.
* **Serviços chamados:**
  - `updateProfile(payload)` -> `IdentityBridge.saveUserProfile()`.
  - `resolveMigrationConflict('keep_vault' | 'merge_legacy')`.
  - `refreshProfile()`.
* **Dependências externas:** `react`, `react-hook-form`, `@hookform/resolvers/zod`, `zod`, `@mui/material`.
* **Eventos executados:** Submissão de formulário cadastral, alternância PF/PJ, resolução de conflitos de migração de cofre.
* **Validações aplicadas:**
  - `UpdateUserSchema` (Zod): Validações matemáticas estritas de CPF (algoritmo Módulo 11), CNPJ numérico clássico e alfanumérico (IN RFB nº 2.229/2024), CEP (8 dígitos), Data de Nascimento (ano bissexto, limite 1900 até data atual), Telefone e Website.

---

### 2.3 ABA 2 — Notificações (`/user/account/notifications`)

#### 2.3.1 `AccountNotificationsPage`
* **Caminho:** [src/pages/user/account/notifications.tsx:5-9](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/pages/user/account/notifications.tsx)
* **Responsabilidade:** Ponto de entrada no roteador para a rota `/user/account/notifications`.
* **Quem o utiliza:** `src/app/editions/edition.node.ts:99`, `src/app/editions/edition.cockpit.ts:196`.
* **Quais componentes utiliza:** `<AccountNotificationsView />`.

#### 2.3.2 `AccountNotificationsView`
* **Caminho:** [src/sections/account/view/account-notifications-view.tsx:6-14](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/sections/account/view/account-notifications-view.tsx)
* **Responsabilidade:** Encapsular `AccountNotifications` dentro de `AccountLayout`.
* **Quem o utiliza:** `AccountNotificationsPage`.
* **Quais componentes utiliza:** `AccountLayout`, `AccountNotifications`.

#### 2.3.3 `AccountNotifications`
* **Caminho:** [src/sections/account/account-notifications.tsx:36-105](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/sections/account/account-notifications.tsx)
* **Responsabilidade:** Interface visual para alternar preferências de notificação (E-mail, SMS, WhatsApp, Push Desktop) e eventos (Comentários, Transações, Alertas de Segurança).
* **Quem o utiliza:** `AccountNotificationsView`.
* **Quais componentes utiliza:** `Box`, `Card`, `Stack`, `Switch`, `Button`, `Typography`, `Controller` (react-hook-form).
* **Props:** Nenhuma.
* **Estados internos:** Gerenciados pelo `useForm` em memória (`email_notifications`, `sms_notifications`, `whatsapp_notifications`, `push_notifications`, `activity_comments`, `activity_transactions`, `security_alerts`).
* **Hooks utilizados:** `useForm()` com `defaultValues` estáticos.
* **Serviços chamados:** Nenhum (Simulação/Mock).
* **Dependências externas:** `react-hook-form`, `@mui/material`, `sonner` (`toast`).
* **Eventos executados:** `onSubmit` dispara apenas `toast.success`.
* **Validações aplicadas:** Nenhuma (sem schema Zod, sem sanitização).

---

### 2.4 ABA 3 — Redes Sociais (`/user/account/socials`)

#### 2.4.1 `AccountSocialsPage`
* **Caminho:** [src/pages/user/account/socials.tsx:5-9](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/pages/user/account/socials.tsx)
* **Responsabilidade:** Ponto de entrada no roteador para a rota `/user/account/socials`.
* **Quem o utiliza:** `src/app/editions/edition.node.ts:105`, `src/app/editions/edition.cockpit.ts:202`.
* **Quais componentes utiliza:** `<AccountSocialsView />`.

#### 2.4.2 `AccountSocialsView`
* **Caminho:** [src/sections/account/view/account-socials-view.tsx:18-62](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/sections/account/view/account-socials-view.tsx)
* **Responsabilidade:** Conectar a visualização de redes sociais ao store reativo `useAccountFacade`, injetar os links sociais atuais do perfil do usuário e orquestrar a persistência assíncrona.
* **Quem o utiliza:** `AccountSocialsPage`.
* **Quais componentes utiliza:** `AccountLayout`, `AccountSocials`, `Stack`, `Alert` (MUI).
* **Props recebidas:** `{ socialLinks?: SocialLinks | null; onSave?: SaveSocialLinks }`.
* **Estados internos:** Derivados do store `useAccountFacade`: `canSave`, `activeSocialLinks`.
* **Hooks utilizados:** `useAccountFacade()`.
* **Serviços chamados:** `updateProfile({ socialLinks: links })` -> `IdentityBridge.saveUserProfile()`.
* **Alertas exibidos:** Exibe avisos se o cofre estiver trancado (`isVaultLocked`), em conflito de migração (`migrationStatus === 'conflict'`) ou em erro (`error`).

#### 2.4.3 `AccountSocials`
* **Caminho:** [src/sections/account/account-socials.tsx:143-248](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/sections/account/account-socials.tsx)
* **Responsabilidade:** Formulário de cadastro de presença digital (LinkedIn, X / Twitter, Instagram, Facebook), aplicando normalização estrita de URLs.
* **Quem o utiliza:** `AccountSocialsView`.
* **Quais componentes utiliza:** `Card`, `Stack`, `Typography`, `Alert`, `Button`, `InputAdornment`, `Form`, `Field.Text`, `Iconify`.
* **Props recebidas:** `{ socialLinks?: SocialLinks | null; onSave?: SaveSocialLinks; canSave?: boolean }`.
* **Estados internos:** `methods` via `useForm<SocialFormValues>`, detecção de `hasUnsavedChanges` via `dirtyFields`.
* **Hooks utilizados:** `useForm<SocialFormValues>()`, `useEffect()`.
* **Serviços chamados:** Invoca a prop assíncrona `onSave(values)`.
* **Dependências externas:** `react-hook-form`, `@mui/material`, `src/shared/components/hook-form`.
* **Validações aplicadas:** `normalizeSocialLinks()`:
  - Protocolo exclusivo `https:`.
  - Allowlist estrita de hostnames (`ALLOWED_HOSTS`).
  - Limite de 2.048 bytes UTF-8 por URL.
  - Rejeição de credenciais embutidas (`user:pass@host`) e portas customizadas (`host:8080`).

---

### 2.5 ABA 4 — Segurança (`/user/account/change-password`)

#### 2.5.1 `AccountChangePasswordPage`
* **Caminho:** [src/pages/user/account/change-password.tsx:5-9](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/pages/user/account/change-password.tsx)
* **Responsabilidade:** Ponto de entrada da rota `/user/account/change-password`.
* **Quem o utiliza:** `src/app/editions/edition.node.ts:111`, `src/app/editions/edition.cockpit.ts:208`.
* **Quais componentes utiliza:** `<AccountChangePasswordView />`.

#### 2.5.2 `AccountChangePasswordView`
* **Caminho:** [src/sections/account/view/account-change-password-view.tsx:18-26](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/sections/account/view/account-change-password-view.tsx)
* **Responsabilidade:** Encapsular `AccountChangePassword` dentro de `AccountLayout` repassando eventuais props de handlers.
* **Quem o utiliza:** `AccountChangePasswordPage`.
* **Quais componentes utiliza:** `AccountLayout`, `AccountChangePassword`.
* **Props recebidas:** `{ onChangePassword?: ChangePasswordHandler; sessions?: SecuritySession[]; onRevokeSession?: (id: string) => Promise<void>; onConfigureBiometrics?: () => Promise<void> }`.

#### 2.5.3 `AccountChangePassword`
* **Caminho:** [src/sections/account/account-change-password.tsx:151-455](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/sections/account/account-change-password.tsx)
* **Responsabilidade:** Formulário de redefinição de senha com validação de complexidade NIST, interface de pareamento de biometria e painel de sessões ativas do usuário.
* **Quem o utiliza:** `AccountChangePasswordView`.
* **Quais componentes utiliza:** `Card`, `Stack`, `Typography`, `Alert`, `Button`, `IconButton`, `InputAdornment`, `Box`, `Iconify`, `Form`, `Field.Text`, subcomponente `PasswordField`.
* **Props recebidas:** Idênticas às do `AccountChangePasswordView`.
* **Estados internos:**
  - `showCurrentPassword`, `showNewPassword`, `showConfirmPassword` (booleanos independentes).
  - `revokingSessionId` (string | null).
  - `configuringBiometrics` (booleano).
* **Hooks utilizados:** `useForm<ChangePasswordForm>()` com `zodResolver(ChangePasswordSchema)`.
* **Serviços chamados:** Invoca `onChangePassword`, `onRevokeSession`, `onConfigureBiometrics` quando fornecidos.
* **Validações aplicadas:**
  - `ChangePasswordSchema` (Zod): Mínimo de 15 caracteres escalares Unicode (`countCharacters()`), máximo de 128 caracteres, confirmação obrigatória idêntica e proibição de repetição da senha atual.

---

### 2.6 ABA 5 — Autenticador 2FA (`/user/account/2fa`)

#### 2.6.1 `AccountTwoFAPage`
* **Caminho:** [src/pages/user/account/2fa.tsx:5-9](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/pages/user/account/2fa.tsx)
* **Responsabilidade:** Ponto de entrada no roteador para a rota `/user/account/2fa`.
* **Quem o utiliza:** `src/app/editions/edition.node.ts:117`, `src/app/editions/edition.cockpit.ts:214`.
* **Quais componentes utiliza:** `<AccountTwoFAView />`.

#### 2.6.2 `AccountTwoFAView`
* **Caminho:** [src/sections/account/view/account-2fa-view.tsx:6-14](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/sections/account/view/account-2fa-view.tsx)
* **Responsabilidade:** Encapsular `AccountTwoFA` dentro de `AccountLayout`.
* **Quem o utiliza:** `AccountTwoFAPage`.
* **Quais componentes utiliza:** `AccountLayout`, `AccountTwoFA`.

#### 2.6.3 `AccountTwoFA`
* **Caminho:** [src/sections/account/account-2fa.tsx:28-611](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/sections/account/account-2fa.tsx)
* **Responsabilidade:** Painel de segurança para configuração de TOTP 2FA, alternância de Modo Restrito de Autenticação (`strictAuthEnabled`) e gerenciamento de provedores vinculados (Carteira Web3 EVM, Google SSO, GitHub).
* **Quem o utiliza:** `AccountTwoFAView`.
* **Quais componentes utiliza:** `Box`, `Card`, `Chip`, `Stack`, `Switch`, `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `Button`, `Tooltip`, `TextField`, `Typography`, `FormControlLabel`, `Iconify`.
* **Props:** Nenhuma.
* **Estados internos:**
  - `totpEnabled` (booleano).
  - `totpCode` (string de 6 dígitos).
  - `modalType` (`'wallet' | 'google' | 'github' | null`).
  - `inputValue` (string do modal).
* **Hooks utilizados:** `useAccountFacade()`, `useState()`.
* **Serviços chamados:** `updateProfile({ linkedProviders })` via `useAccountFacade()`.
* **Validações aplicadas:**
  - TOTP: Apenas validação cega de tamanho (`totpCode.length === 6`).
  - Carteira: Apenas prefixo `0x` e tamanho mínimo de 20 caracteres (sem assinatura EIP-712).
  - Google: Apenas presença do caractere `@` (sem OAuth).
  - GitHub: Apenas remoção de `@` e trim (sem OAuth).
