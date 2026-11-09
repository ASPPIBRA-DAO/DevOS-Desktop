# LAYOUTS E COMPONENTES COMPARTILHADOS
## Arquitetura Visual e Componentes Reutilizáveis

**Data:** 05/11/2026  
**Auditoria:** ORDEM 6 — Read-only

---

## 1. LAYOUTS DISPONÍVEIS

O sistema possui **2 layouts principais**:

```
src/app/layouts/
├── authentication/        → AuthCenteredLayout (telas de auth/setup)
│   └── auth-centered/
│       ├── layout.tsx     → Layout principal
│       ├── content.tsx    → Container de conteúdo
│       ├── globe-background.tsx → Animação de globo no fundo
│       └── index.ts
└── devos/
    └── layout.tsx         → DevOSLayout (telas autenticadas)
```

---

## 2. AuthCenteredLayout

**Arquivo:** `src/app/layouts/authentication/auth-centered/layout.tsx`  
**Usado em:** Todas as rotas de autenticação + bootstrap states UNINITIALIZED e READY_LOCKED

**Características:**
- Layout centralizado para telas de login/setup
- Background com animação de globo (`GlobeBackground`)
- Responsivo (xs → md)
- Sem sidebar

**Quando é exibido:**
- Bootstrap state = `UNINITIALIZED` → `JwtSignUpView` (setup do vault)
- Bootstrap state = `READY_LOCKED` → `JwtSignInView` (desbloqueio)
- Rota `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify`

---

## 3. DevOSLayout

**Arquivo:** `src/app/layouts/devos/layout.tsx`  
**Usado em:** Todas as rotas autenticadas (READY_UNLOCKED ou WEB_PREVIEW)

### 3.1 Estrutura do Layout

```
DevOSLayout
├── 1. HEADER (HeaderSection)
│   ├── WindowModeToggle (alternar janela/tela cheia)
│   ├── NavToggleButton (expandir/colapsar sidebar)
│   ├── MenuButton
│   ├── [spacer]
│   ├── Iconify icon (solar:bell-bing-bold) — Notificações
│   ├── Iconify icon (solar:settings-bold) — Configurações
│   └── AccountDrawer — Avatar e menu de conta
│
├── 2. SIDEBAR (Drawer — mobile) / NavSectionVertical (desktop)
│   ├── Logo ASPPIBRA
│   ├── NavSectionVertical / NavSectionMini (grupos de navegação)
│   │   └── DEVOS_NAV_DATA (5 grupos: FINANCEIRO, OPERAÇÕES, CONTROL PLANE, SECURITY, INFRASTRUCTURE)
│   └── Status box: "mock-node-alpha" / "Control Plane Sandbox • Mocks Ativos" ← HARDCODED
│
├── 3. MAIN (MainSection)
│   └── Container > {children ?? <Outlet />}
│
└── 4. FOOTER
    └── "ASPPIBRA DAO • Architecture Baseline v2.2.2 • Control Plane Sandbox (v2.2.3)" ← HARDCODED
        "Safety Status: INV-001 through INV-017 Enforced • In-Memory Mocks Active" ← HARDCODED
```

### 3.2 Comportamento do Sidebar

```typescript
// layout.tsx
const layoutQuery: Breakpoint = 'lg';
const isNavMini = useBoolean();  // estado de mini/expandido

// Mobile: Drawer overlay
// Desktop (lg+): sidebar fixo à esquerda
//   - Expandido: pl = 'calc(var(--layout-nav-vertical-width) + 14px)'
//   - Mini: pl = 'calc(var(--layout-nav-mini-width) + 14px)'
```

### 3.3 Variáveis CSS do Layout

```typescript
// devosLayoutVars(theme) define:
--layout-nav-vertical-width: (valor do tema)
--layout-nav-mini-width: (valor do tema)
--layout-transition-easing: (valor do tema)
--layout-transition-duration: (valor do tema)
```

### 3.4 getSectionTitle — Título Dinâmico por Rota

```typescript
export function getSectionTitle(pathname: string): string {
  if (pathname === '/') return 'Observability';
  if (pathname.startsWith('/devos/ipfs')) return 'Armazenamento IPFS & DePIN';
  if (pathname.startsWith('/devos/cadastre')) return 'Banco Imobiliário';
  if (pathname.startsWith('/devos/cessao-posse')) return 'Cessão de Posse';
  if (pathname.startsWith('/devos/wallets')) return 'Carteiras & Banco Digital';
  if (pathname.startsWith('/devos/ledger') || pathname.startsWith('/devos/dao')) return 'Livro-Razão';
  if (pathname.startsWith('/devos/database')) return 'Database Explorer';
  if (pathname.startsWith('/devos/infrastructure')) return 'Infraestrutura';
  if (pathname.startsWith('/devos/analytics')) return 'Hub Analítico';
  if (pathname.startsWith('/devos/blog')) return 'Blog';
  if (pathname.startsWith('/devos/notifications')) return 'Notificações';
  if (pathname.startsWith('/devos/security')) return 'Security';
  if (pathname.startsWith('/devos/audit')) return 'Audit & Compliance';
  if (pathname.startsWith('/devos/apis')) return 'API Management';
  return 'DevOS';
}
```

### 3.5 Problemas no DevOSLayout

| Problema | Descrição |
|---|---|
| `DEVOS_NAV_DATA` hardcoded | Mesmo menu para Node e Cockpit — mostra itens inválidos para o Node |
| Status box com texto mock | `"mock-node-alpha"` e `"Control Plane Sandbox • Mocks Ativos"` são strings literais |
| Footer com texto mock | `"Architecture Baseline v2.2.2"` e `"In-Memory Mocks Active"` são strings literais |
| Sem filtragem de rotas por edição | O sidebar mostra todas as seções independente da edição ativa |

---

## 4. COMPONENTES CORE DO LAYOUT

**Localização:** `src/app/layouts/core/`

| Componente | Arquivo | Função |
|---|---|---|
| `HeaderSection` | `header-section.tsx` | Container do cabeçalho |
| `LayoutSection` | `layout-section.tsx` | Wrapper principal do layout |
| `MainSection` | `main-section.tsx` | Área de conteúdo principal |
| `layoutClasses` | `classes.ts` | Classes CSS do layout |
| `cssVars` | `css-vars.ts` | Variáveis CSS |

---

## 5. COMPONENTES COMPARTILHADOS DO LAYOUT

**Localização:** `src/app/layouts/components/`

| Componente | Arquivo | Função |
|---|---|---|
| `AccountDrawer` | `account-drawer.tsx` | Menu de conta do usuário (avatar, logout) |
| `LanguagePopover` | `language-popover.tsx` | Seletor de idioma |
| `MenuButton` | `menu-button.tsx` | Botão de menu mobile |
| `NavToggleButton` | `nav-toggle-button.tsx` | Botão expandir/colapsar sidebar |
| `NotificationsDrawer` | `notifications-drawer.tsx` | Painel de notificações |
| `SearchBar` | `searchbar.tsx` | Barra de pesquisa |
| `SettingsButton` | `settings-button.tsx` | Botão de configurações |

---

## 6. COMPONENTES SHARED — CATÁLOGO COMPLETO

**Localização:** `src/shared/`

### 6.1 Data Display

```
src/shared/components/data-display/
```
Componentes usados em múltiplas telas para exibição de dados:
- `Card` — container de card estilizado
- `MetricBox` — box de métrica com label, valor, subtext e accentColor
- `StatusBadge` — badge de status com enum (ACTIVE, SYNCING, etc.)

### 6.2 Nav Section

```
src/shared/components/nav-section/ (ou src/components/nav-section/)
```
- `NavSectionVertical` — navegação expandida
- `NavSectionMini` — navegação colapsada (ícones apenas)

### 6.3 Loading Screen

```
src/shared/components/loading-screen/
```
- `SplashScreen` — tela de inicialização com animação Three.js (globo)

### 6.4 Iconify

```
src/shared/components/iconify/
```
- `Iconify` — wrapper para ícones da biblioteca Iconify (`solar:*` prefix)

### 6.5 Window Mode Toggle

```
src/shared/components/window-mode-toggle/
```
- `WindowModeToggle` — alternar entre modo janela e tela cheia

### 6.6 Upload

```
src/shared/components/upload/
```
- Componentes de upload de arquivo

### 6.7 Outros Componentes

```
src/shared/components/
├── animate/           → Animações (Framer Motion)
├── blockchain-cube/   → Cubo 3D de blockchain (Three.js)
├── globe/             → Globo wire-frame (Three.js)
├── pdf-viewer/        → Visualizador de PDF
├── settings/          → Painel de configurações do tema
├── snackbar/          → Notificações toast
└── [outros...]
```

---

## 7. COMPONENTES COMPARTILHADOS ENTRE MÓDULOS

### 7.1 Componentes usados em múltiplos módulos

| Componente | Usado em |
|---|---|
| `MetricBox` | NodeDashboardPage, CockpitDashboardPage |
| `StatusBadge` | NodeDashboardPage, CockpitDashboardPage |
| `Card` | NodeDashboardPage, LedgerView, WalletsLandingView |
| `Iconify` | Praticamente todos os módulos |
| `Iconify solar:*` icons | Todos os módulos |
| `DevOSLayout` | Todas as rotas autenticadas |
| `paths` (router) | Todos os módulos para navegação |

### 7.2 Hooks compartilhados

| Hook | Localização | Usado em |
|---|---|---|
| `useBootstrap` | `app/bootstrap` | AppRouter, DevOSLayout |
| `usePathname` | `app/router/hooks` | DevOSLayout |
| `useBoolean` | `minimal-shared/hooks` | DevOSLayout, outros |

---

## 8. PROVIDERS DA APLICAÇÃO

**Localização:** `src/app/providers/app-providers.tsx`

```typescript
// Hierarquia de providers:
<ErrorBoundary>           → Captura erros globais
  <ThemeProvider>          → Tema MUI
    <SWRConfig>            → Configuração global do SWR (cache de API)
      <BootstrapProvider>  → Máquina de estados do Vault
        <App />            → AppRouter
```

---

## 9. SISTEMA DE TEMAS

**Localização:** `src/theme/`

```
theme/
├── core/           → Paleta, tipografia, sombras, componentes MUI
├── tokens/colors.ts → Tokens de cor customizados (colors.primary.main, etc.)
├── with-settings/   → Configurações de cor (presets, RTL)
├── create-theme.ts  → Factory do tema
└── theme-config.ts  → Configurações padrão
```

**Cores especiais definidas em `tokens/colors.ts`:**
```typescript
colors.primary.main   → Ciano #00f0ff
colors.success.main   → Verde #00ff7f
colors.error.main     → Vermelho #ef4444
colors.background.border → Borda escura
colors.text.secondary → Texto secundário
```

---

## 10. RECOMENDAÇÕES PARA O HOLDER BETA

Baseado na análise do layout, as seguintes correções são necessárias antes da Beta:

| Item | Prioridade | Ação |
|---|---|---|
| `DEVOS_NAV_DATA` dinâmico por edição | 🔴 Alta | Filtrar itens com base em `currentEdition.routes` |
| Remover texto "mock-node-alpha" do sidebar | 🔴 Alta | Substituir por status real do nó |
| Remover footer com "Mocks Ativos" | 🟡 Média | Substituir por versão e status real |
| Adicionar rota de Wallets ao Node | 🔴 Alta | Registrar em `edition.node.ts` |
| Adicionar rota de Ledger ao Node | 🔴 Alta | Registrar em `edition.node.ts` |

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*  
*Branch: `main` | HEAD: `6831a40`*

