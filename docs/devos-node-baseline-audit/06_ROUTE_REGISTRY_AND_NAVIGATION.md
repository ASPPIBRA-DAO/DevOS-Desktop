# REGISTRO DE ROTAS E NAVEGAÇÃO
## Mapa Completo de Rotas por Edição

**Data:** 05/11/2026  
**Auditoria:** ORDEM 6 — Read-only

---

## 1. ARQUITETURA DE ROTEAMENTO

O roteamento do DevOS Desktop é implementado com **React Router v7** e controlado pela máquina de estados do bootstrap.

### 1.1 Fluxo de Decisão do Router

```
AppRouter (app-router.tsx)
│
├── state === 'UNINITIALIZED'
│       └── Renderiza: AuthCenteredLayout > JwtSignUpView (isInitVault=true)
│               → Usuário cria senha mestre → inicializa vault
│
├── state === 'READY_LOCKED'
│       └── Renderiza: AuthCenteredLayout > JwtSignInView
│               → Usuário desbloqueia vault
│
└── state === 'READY_UNLOCKED' | 'WEB_PREVIEW'
        └── Renderiza: Routes completas
                ├── /login → JwtSignInView
                ├── /register → JwtSignUpView
                ├── /forgot-password → JwtResetPasswordView
                ├── /reset-password → JwtUpdatePasswordView
                ├── /verify → JwtVerifyView
                └── <DevOSLayout>  ← Layout principal com sidebar
                        ├── [currentEdition.routes...] ← dinâmico por edição
                        └── * → NotFoundView
```

### 1.2 Como as Rotas são Registradas

```typescript
// app-router.tsx
<Route element={<DevOSLayout />}>
  {currentEdition.routes.map((r) => {
    const Component = r.component;
    return <Route key={r.path} path={r.path} element={<Component />} />;
  })}
  <Route path="*" element={<NotFoundView />} />
</Route>
```

`currentEdition` é importado de `@edition` (alias Vite). Em modo Node, aponta para `edition.node.ts`; em modo Cockpit, para `edition.cockpit.ts`.

---

## 2. ÁRVORE DE ROTAS — EDIÇÃO NODE

```
/ (DevOSLayout)
│
├── /                           → NodeDashboardPage          [B] Parcialmente mock
├── /devos/ipfs                 → IpfsView                   [C] UI ok, daemon offline
├── /devos/cadastre             → RealEstateView             [❌ QUEBRADO] DB não inicializado
├── /devos/database             → RealEstateView             [❌ QUEBRADO] DB não inicializado
├── /real-estate                → RealEstateView             [❌ QUEBRADO] DB não inicializado
└── /devos/infrastructure       → InfrastructurePage         [🟡] Verificar

Rotas de autenticação (fora do DevOSLayout):
├── /login                      → JwtSignInView              [A]
├── /register                   → JwtSignUpView              [A]
├── /forgot-password            → JwtResetPasswordView       [C]
├── /reset-password             → JwtUpdatePasswordView      [C]
└── /verify                     → JwtVerifyView              [C]
```

**Total de rotas da aplicação (Node):** 11  
**Rotas funcionais:** 4 (/, /login, /register, /devos/ipfs parcialmente)  
**Rotas quebradas:** 3 (cadastre, database, real-estate)  
**Rotas com funcionalidade incompleta:** 4 (forgot-password, reset-password, verify, infrastructure)

---

## 3. ÁRVORE DE ROTAS — EDIÇÃO COCKPIT

```
/ (DevOSLayout)
│
├── /                           → CockpitDashboardPage       [C] 100% hardcoded
├── /devos/wallets              → WalletsLandingView         [B] Hub de cards (sub-módulos ausentes)
├── /banking                    → WalletsLandingView         [B] Alias de /devos/wallets
├── /devos/ipfs                 → IpfsView                   [C] UI ok, daemon offline
├── /devos/cadastre             → RealEstateView             [A] Funcional com real_estate.sqlite
├── /devos/cessao-posse         → CessaoPosseView            [🟡] Verificar
├── /devos/database             → RealEstateView             [A] Alias do cadastre
├── /devos/ledger               → LedgerView                 [C] Sem JWT → dados da API falharão
├── /devos/dao                  → LedgerView                 [C] Alias de /devos/ledger
├── /real-estate                → RealEstateView             [A] Rota legada funcional
└── /devos/infrastructure       → InfrastructurePage         [🟡] Verificar

Rotas de autenticação (mesmas do Node):
├── /login → /register → /forgot-password → /reset-password → /verify
```

**Total de rotas da aplicação (Cockpit):** 16  
**Rotas funcionais:** 5 (login, register, cadastre, database, real-estate)  
**Rotas com dados mock:** 3 (/, /devos/wallets, /banking)  
**Rotas com dependência externa quebrada:** 4 (ledger, dao, ipfs, auth recovery)  
**Rotas a verificar:** 2 (cessao-posse, infrastructure)

---

## 4. ROTAS DECLARADAS EM paths.ts SEM COMPONENTE REGISTRADO

Estas rotas existem no arquivo `paths.ts` como destinos planejados, mas **nenhuma edição as registra**:

| Path definido em paths.ts | Valor | Referenciado em | Status |
|---|---|---|---|
| `paths.devos.analytics` | `/devos/analytics` | `layout.tsx` sidebar | **E** — Sem rota |
| `paths.devos.blog` | `/devos/blog` | `layout.tsx` sidebar | **E** — Sem rota |
| `paths.devos.notifications.root` | `/devos/notifications` | `layout.tsx` sidebar | **E** — Sem rota |
| `paths.devos.security` | `/devos/security` | `layout.tsx` sidebar | **E** — Sem rota |
| `paths.devos.audit` | `/devos/audit` | `layout.tsx` sidebar | **E** — Sem rota |
| `paths.devos.apis` | `/devos/apis` | `layout.tsx` sidebar | **E** — Sem rota |
| `paths.devos.invoices` | `/devos/invoices` | `layout.tsx` sidebar | **E** — Sem rota |
| `paths.dashboard.general.banking.root` | `/banking` | (definido mas não usado como destino independente) | **E** — paths.dashboard prefix |
| `paths.dashboard.designSystem` | `/design-system` | Não encontrado em edições | **E** — Sem rota |
| `paths.dashboard.fileManager` | `/file-manager` | Não encontrado em edições | **E** — Sem rota |
| `paths.dashboard.chat` | `/chat` | Não encontrado em edições | **E** — Sem rota |

> **Consequência:** O sidebar `DEVOS_NAV_DATA` em `layout.tsx` lista 7 itens que levarão ao `NotFoundView` quando clicados.

---

## 5. SIDEBAR NAVIGATION — DEVOS_NAV_DATA

O sidebar do `DevOSLayout` é gerado pela função `createDevosNavData()` hardcoded em `layout.tsx`. **Ele é o mesmo para ambas as edições** (não é filtrado por edição).

```typescript
// layout.tsx — DEVOS_NAV_DATA (compartilhado entre Node e Cockpit)
[
  {
    subheader: 'FINANCEIRO',
    items: [
      { title: 'Tesouraria', path: paths.devos.dao }         // Cockpit only ⚠️
      { title: 'Carteiras', path: paths.devos.wallets }      // Cockpit only ⚠️
      { title: 'Livro-Razão', path: paths.devos.ledger }     // Cockpit only ⚠️
      { title: 'Faturas', path: paths.devos.invoices }       // Sem rota em NENHUMA edição ❌
    ]
  },
  {
    subheader: 'OPERAÇÕES',
    items: [
      { title: 'Banco Imobiliário', path: paths.devos.cadastre }   // Node: QUEBRADO / Cockpit: OK
      { title: 'Cessão de Posse', path: paths.devos.cessaoPosse }  // Cockpit only ⚠️
      { title: 'Hub Analítico', path: paths.devos.analytics }      // Sem rota ❌
      { title: 'Blog', path: paths.devos.blog }                    // Sem rota ❌
    ]
  },
  {
    subheader: 'CONTROL PLANE',
    items: [
      { title: 'Observability', path: paths.devos.root }           // OK — dashboard
      { title: 'Armazenamento IPFS', path: paths.devos.ipfs }      // OK mas daemon offline
      { title: 'Database Explorer', path: paths.devos.database }   // Node: QUEBRADO / Cockpit: OK
      { title: 'Notificações', path: paths.devos.notifications.root } // Sem rota ❌
    ]
  },
  {
    subheader: 'SECURITY',
    items: [
      { title: 'Security', path: paths.devos.security }     // Sem rota ❌
      { title: 'Audit', path: paths.devos.audit }           // Sem rota ❌
    ]
  },
  {
    subheader: 'INFRASTRUCTURE',
    items: [
      { title: 'APIs', path: paths.devos.apis }                   // Sem rota ❌
      { title: 'Infrastructure', path: paths.devos.infrastructure } // OK — InfrastructurePage
    ]
  }
]
```

**Resumo do sidebar na edição Node:**
- 2 itens funcionais: Observability (/), Infrastructure (/devos/infrastructure)
- 1 item parcial: IPFS (UI ok, daemon offline)
- 3 itens quebrados: Banco Imobiliário, Database Explorer, Cessão de Posse
- 7 itens inválidos (sem rota registrada no Node): Tesouraria, Carteiras, Livro-Razão, Faturas, Analytics, Blog, Notificações, Security, Audit, APIs

**Correção necessária:** O `DEVOS_NAV_DATA` precisa ser dinâmico por edição, usando `currentEdition.routes` como fonte de verdade.

---

## 6. ROTAS MORTAS NO NODE EDITION — DETALHE TÉCNICO

As 3 rotas imobiliárias no Node são "dead routes" porque causarão falha em runtime:

```typescript
// edition.node.ts — rotas problemáticas:
{
  path: paths.devos.cadastre,   // '/devos/cadastre'
  component: RealEstateView,
},
{
  path: paths.devos.database,   // '/devos/database'
  component: RealEstateView,
},
{
  path: '/real-estate',
  component: RealEstateView,
},
```

```typescript
// real-estate-bridge.ts — invocar qualquer comando imobiliário:
// Os comandos são: get_real_estate_stats, list_properties, etc.
// Eles dependem de State<'_, RealEstateDatabase> no Rust
```

```rust
// lib.rs — RealEstateDatabase só é registrada no Cockpit:
if is_cockpit {
    let real_estate_db = storage::RealEstateDatabase::new(real_estate_dir);
    // ...
    app.manage(real_estate_db);  // ← NÃO EXECUTADO no Node
}
```

```rust
// real_estate_commands.rs — exemplo de um comando:
pub fn get_real_estate_stats(app: AppHandle) -> Result<RealEstateStats, String> {
    // Rust tentará acessar State<RealEstateDatabase>
    // Se não registrado → retorna erro de estado não encontrado
}
```

**Comportamento esperado quando o usuário acessa essas rotas no Node:**
1. UI renderiza o `RealEstateView`
2. O componente tenta invocar comandos Tauri de real estate
3. Tauri retorna erro: estado `RealEstateDatabase` não encontrado
4. UI exibe erro (dependendo de como o RealEstateView trata erros)

---

## 7. PATHS.TS — MAPA COMPLETO

```typescript
// src/app/router/paths.ts
export const paths = {
  about: '#',          // PLACEHOLDER
  contact: '#',        // PLACEHOLDER
  faqs: '#',           // PLACEHOLDER
  pricing: '#',        // PLACEHOLDER
  minimalStore: '#',   // PLACEHOLDER

  auth: {
    jwt: {
      signIn: '/login',
      signUp: '/register',
      resetPassword: '/forgot-password',
      updatePassword: '/reset-password',
      verify: '/verify',
    },
  },

  dashboard: {
    root: '/',
    designSystem: '/design-system',    // SEM ROTA
    fileManager: '/file-manager',      // SEM ROTA
    chat: '/chat',                     // SEM ROTA
    user: { root: '/user', new: '/user/new', account: '/user/account' },  // SEM ROTA
    general: {
      app: '/app',                     // SEM ROTA
      file: '/file',                   // SEM ROTA
      banking: {
        root: '/banking',              // = WalletsLandingView (Cockpit only)
        treasury: '/banking/treasury', // SEM ROTA
        payments: '/banking/payments', // SEM ROTA
      },
    },
  },

  devos: {
    root: '/devos',                    // SEM ROTA (rotas usam '/' como raiz)
    cadastre: '/devos/cadastre',       // Node: QUEBRADO / Cockpit: OK
    cessaoPosse: '/devos/cessao-posse',// Cockpit only
    dao: '/devos/dao',                 // Cockpit only
    wallets: '/devos/wallets',         // Cockpit only
    ledger: '/devos/ledger',           // Cockpit only
    invoices: '/devos/invoices',       // SEM ROTA
    analytics: '/devos/analytics',     // SEM ROTA
    blog: '/devos/blog',               // SEM ROTA
    database: '/devos/database',       // Node: QUEBRADO / Cockpit: OK
    notifications: { root: '/devos/notifications' },  // SEM ROTA
    security: '/devos/security',       // SEM ROTA
    audit: '/devos/audit',             // SEM ROTA
    apis: '/devos/apis',               // SEM ROTA
    infrastructure: '/devos/infrastructure',  // Ambas edições: 🟡
    ipfs: '/devos/ipfs',              // Ambas edições: UI ok
  },
};
```

**Observação:** `paths.devos.root` aponta para `/devos` mas o dashboard raiz está em `/` (sem prefixo). Isso é incoerente — o dashboard está em `/`, não em `/devos/`.

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*  
*Branch: `main` | HEAD: `6831a40`*

