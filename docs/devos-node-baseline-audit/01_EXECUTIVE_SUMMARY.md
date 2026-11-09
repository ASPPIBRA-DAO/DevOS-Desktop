# ORDEM 6 — AUDITORIA FORENSE: RESUMO EXECUTIVO
## ASPPIBRA-DAO DevOS Desktop — Baseline de Estado Atual

**Data da auditoria:** 05/11/2026  
**Branch auditado:** `main`  
**HEAD:** `6831a40ca4c27e2c2cb9bcc754d8e7fc130cb07a`  
**Commit message:** `feat(ledger): eliminate simulated mock data and silent fallbacks`  
**Natureza:** Auditoria read-only — ZERO modificações no código

---

## 1. PRODUTO PRIORITÁRIO

| Dimensão | Valor |
|---|---|
| **Produto foco** | DevOS Node — Holder Beta 1.0 |
| **Produto secundário** | DevOS Cockpit — Founder (preservado, não alterado) |
| **Edição Node** | Software nativo para operadores de nó / participantes Holder |
| **Edição Cockpit** | Software nativo para administração institucional / Founders |
| **Perfil Holder** | Credencial de participação comunitária |
| **Perfil Founder** | Credencial de fundador institucional |

> **ATENÇÃO:** Estas quatro dimensões são distintas e não devem ser confundidas: Node e Cockpit são **edições de software**; Holder e Founder são **perfis de participação**.

---

## 2. RESPOSTAS ÀS 20 QUESTÕES CENTRAIS DA ORDEM 6

### 2.1 Como o aplicativo está organizado atualmente?

O repositório segue uma arquitetura **Tauri v2 + React + TypeScript**. O frontend está em `src/` e o backend nativo em `src-tauri/src/`. A separação entre edições é feita em **build time** via arquivo `@edition` (alias Vite configurado em `vite.config.ts`), que aponta para `edition.node.ts` ou `edition.cockpit.ts`.

```
DevOS-Desktop/
├── src/                        # Frontend React/TypeScript
│   ├── app/                    # Bootstrap, router, layouts, editions
│   ├── modules/                # Módulos de domínio (8 módulos)
│   ├── platform/tauri/         # Bridges IPC Frontend→Rust
│   ├── shared/                 # Componentes e utilitários compartilhados
│   ├── pages/                  # Páginas standalone (InfrastructurePage)
│   └── sections/               # Seções independentes (CessaoPosseView)
└── src-tauri/src/              # Backend Rust/Tauri
    ├── commands/               # 7 arquivos de handlers IPC
    ├── modules/                # 7 módulos Rust de domínio
    ├── storage/                # Gestão de SQLite
    └── platform/               # Plataforma Typst
```

### 2.2 Quais páginas existem?

**Páginas/Views do frontend (total: 20 componentes de tela):**

| Arquivo | Módulo/Local | Tipo |
|---|---|---|
| `node-dashboard-page.tsx` | `editions/node/` | Dashboard Node |
| `cockpit-dashboard-page.tsx` | `editions/cockpit/` | Dashboard Cockpit |
| `jwt-sign-in-view.tsx` | `modules/authentication/` | Auth — Login |
| `jwt-sign-up-view.tsx` | `modules/authentication/` | Auth — Cadastro/Setup Vault |
| `jwt-reset-password-view.tsx` | `modules/authentication/` | Auth — Reset Senha |
| `jwt-update-password-view.tsx` | `modules/authentication/` | Auth — Nova Senha |
| `jwt-verify-view.tsx` | `modules/authentication/` | Auth — Verificação |
| `ipfs-view.tsx` | `modules/ipfs/` | IPFS & DePIN |
| `LedgerView.tsx` | `modules/ledger/` | Livro-Razão |
| `CitizenLedgerView.tsx` | `modules/ledger/citizen-ledger/` | Ledger por Cidadão |
| `real-estate-view.tsx` | `modules/real-estate/` | Cadastro Imobiliário |
| `wallets-landing-view.tsx` | `modules/wallets/` | Hub Bancário/Carteiras |
| `CessaoPosseView.tsx` | `sections/cessao-de-posse/` | Cessão de Posse |
| `infrastructure-page.tsx` | `pages/devos/` | Infraestrutura |
| `not-found-view.tsx` | `app/pages/` | 404 |
| `error-view.tsx` | `app/pages/` | Erro genérico |

### 2.3 Quais componentes são utilizados?

**Componentes principais:**
- `DevOSLayout` (`app/layouts/devos/layout.tsx`) — layout principal com sidebar nav
- `AuthCenteredLayout` (`app/layouts/authentication/`) — layout de autenticação
- `HostIntegrityCard` (`modules/identity/`) — status do dispositivo host
- `StorageProofCard` (`modules/ipfs/`) — prova DePIN
- `IpfsDaemonMetric` (`modules/ipfs/`) — métrica do daemon IPFS
- `VaultStatusMetric` (`modules/wallets/`) — status do cofre
- `DoubleEntryChartCard` (`modules/ledger/`) — gráfico de partidas dobradas
- `SplashScreen` — tela de inicialização com animação Three.js
- Componentes MUI: Box, Card, Typography, Button, Stack, Grid, Drawer, etc.

### 2.4 Quais páginas possuem rotas?

**Edição Node (`edition.node.ts`) — 6 rotas:**

| Rota | Componente | Observação |
|---|---|---|
| `/` | `NodeDashboardPage` | ✅ Funcional — usa bridges Tauri reais |
| `/devos/ipfs` | `IpfsView` | 🟡 UI pronta, daemon Kubo offline |
| `/devos/cadastre` | `RealEstateView` | ❌ **ERRO CRÍTICO** — real_estate.sqlite NÃO inicializado no Node |
| `/devos/database` | `RealEstateView` | ❌ **ERRO CRÍTICO** — mesmo problema |
| `/real-estate` | `RealEstateView` | ❌ **ERRO CRÍTICO** — rota legada, mesmo problema |
| `/devos/infrastructure` | `InfrastructurePage` | 🟡 Verificar implementação |

**Edição Cockpit (`edition.cockpit.ts`) — 11 rotas:**

| Rota | Componente | Observação |
|---|---|---|
| `/` | `CockpitDashboardPage` | 🟡 Métricas hardcoded (mock) |
| `/devos/wallets` | `WalletsLandingView` | 🟡 Hub com sub-módulos não implementados |
| `/banking` | `WalletsLandingView` | 🟡 Alias de `/devos/wallets` |
| `/devos/ipfs` | `IpfsView` | 🟡 UI pronta, daemon offline |
| `/devos/cadastre` | `RealEstateView` | ✅ real_estate.sqlite inicializado |
| `/devos/cessao-posse` | `CessaoPosseView` | 🟡 Verificar |
| `/devos/database` | `RealEstateView` | ✅ Alias do banco imobiliário |
| `/devos/ledger` | `LedgerView` | ⚠️ Chama API remota — sem JWT no desktop |
| `/devos/dao` | `LedgerView` | ⚠️ Alias de `/devos/ledger` |
| `/real-estate` | `RealEstateView` | ✅ Legado |
| `/devos/infrastructure` | `InfrastructurePage` | 🟡 |

### 2.5 Quais páginas estão acessíveis?

**No Node (desktop desbloqueado):** `/` e `/devos/ipfs` têm chance de funcionar. As 3 rotas imobiliárias causarão crash/erro por ausência de `RealEstateDatabase` no estado Tauri.

**No Cockpit (desktop desbloqueado):** `/`, `/devos/ipfs`, `/devos/cadastre`, `/devos/database`, `/real-estate` têm chance de funcionar. `/devos/ledger` e `/devos/dao` dependem de JWT da API remota.

### 2.6 Quais páginas estão órfãs ou desconectadas?

**Páginas no código mas SEM rota em NENHUMA edição:**
- `CitizenLedgerView` — acessada apenas como sub-view interno de `LedgerView` (tab switch)
- `CessaoPosseContent` — componente interno de `CessaoPosseView`
- Muitos sub-módulos listados no `WalletsLandingView` como cards (ex: `conta-view.tsx`, `banking-cartoes-view.tsx`) — referenciados por nome/tag mas **os arquivos não existem no repositório**

**Rotas em `paths.ts` sem componente registrado em NENHUMA edição:**
- `paths.devos.cessaoPosse` — apenas no Cockpit
- `paths.devos.analytics`, `paths.devos.blog`, `paths.devos.notifications`, `paths.devos.security`, `paths.devos.audit`, `paths.devos.apis` — em nenhuma edição

### 2.7 Quais funcionalidades estão realmente implementadas?

| Funcionalidade | Status |
|---|---|
| Bootstrap / Splash screen | ✅ Implementado |
| Inicialização do Vault (senha mestre) | ✅ Implementado |
| Login / Desbloqueio do Vault | ✅ Implementado |
| Node Dashboard (métricas de nó) | ✅ Implementado (parcialmente mock) |
| IPFS — UI de upload/download/pinning | ✅ UI implementada |
| IPFS — daemon Kubo ativo | ❌ Binário Kubo não instalado no sistema |
| Wallet Genesis — geração BIP-39 | ✅ Rust implementado, UI como hub de cards |
| Ledger / Tesouraria | ⚠️ UI implementada, dados via API remota (sem JWT) |
| Cadastro Imobiliário | ✅ Cockpit only |
| Cessão de Posse | 🟡 Seção existe, verificar completude |
| Certificado de Identidade (.dvcert) | ❌ Não existe no código |
| Credencial Holder | ❌ Não implementada |
| Governança DAO | ❌ Não implementada como rota |

### 2.8 Quais serviços Rust já estão disponíveis?

**Comandos Rust disponíveis em ambas as edições (via macro `app_invoke_handler!`):**

```
Sistema:          get_device_status
Vault:            get_vault_status, init_master_password, unlock_vault, lock_vault,
                  export_authorized_secret, export_vault_backup, restore_vault_backup
Wallets:          generate_seed_and_preview, reveal_pending_mnemonic,
                  cancel_pending_creation, confirm_and_save_wallets,
                  list_stored_wallets, fetch_wallet_balance, batch_fetch_wallet_balances
Documentos:       generate_document, preview_document, export_previewed_document
IPFS:             get_ipfs_daemon_status, execute_storage_proof, ipfs_upload_file,
                  ipfs_download_file, ipfs_pin_cid, ipfs_unpin_cid,
                  ipfs_verify_cid_custody, ipfs_verify_all_pins,
                  ipfs_query_providers, ipfs_list_managed_pins,
                  ipfs_start_daemon, ipfs_stop_daemon, ipfs_restart_daemon
```

**Comandos adicionais APENAS no Cockpit:**
```
Real Estate:      get_real_estate_stats, preview_real_estate_import,
                  execute_real_estate_import, list_import_batches,
                  list_audit_findings, list_properties, select_spreadsheet_file
```

### 2.9 Quais bridges Tauri conectam o frontend ao backend nativo?

| Bridge | Arquivo | Comandos expostos |
|---|---|---|
| `VaultBridge` | `platform/tauri/vault/vault-bridge.ts` | unlock, lock, getVaultStatus, initMasterPassword, exportSecret, backup, restore |
| `WalletBridge` | `platform/tauri/wallets/wallet-bridge.ts` | generateSeed, confirmSave, listWallets, fetchBalance, etc. |
| `IpfsBridge` | `platform/tauri/ipfs/ipfs-bridge.ts` | getDaemonStatus, upload, download, pin, startDaemon, etc. |
| `SystemBridge` | `platform/tauri/system/system-bridge.ts` | getDeviceStatus |
| `DocumentBridge` | `platform/tauri/documents/document-bridge.ts` | generate, preview, export |
| `MonitoringBridge` | `platform/tauri/monitoring/monitoring-bridge.ts` | (monitoramento) |
| `RealEstateBridge` | `platform/tauri/real-estate/real-estate-bridge.ts` | Cockpit only |
| `WindowBridge` | `platform/tauri/window/window-bridge.ts` | controle de janela |

### 2.10 Quais páginas compartilham serviços e componentes?

- `NodeDashboardPage` compartilha: `HostIntegrityCard` (identity), `StorageProofCard` + `IpfsDaemonMetric` (ipfs), `VaultStatusMetric` (wallets)
- `IpfsView` compartilha bridges com `NodeDashboardPage`
- `LedgerView` e `CitizenLedgerView` compartilham hooks de treasury
- `DevOSLayout` é compartilhado por TODAS as rotas autenticadas de ambas as edições
- Componentes `data-display` (Card, MetricBox, StatusBadge) são usados em múltiplos módulos

### 2.11 Como funciona a separação entre DevOS Node e DevOS Cockpit?

A separação ocorre em **3 níveis**:

1. **Build time (Vite):** O alias `@edition` aponta para `edition.node.ts` ou `edition.cockpit.ts`, determinando quais rotas/componentes são incluídos no bundle
2. **Runtime Rust (lib.rs):** A constante `COCKPIT_IDENTIFIER = "br.aspp.devos.cockpit"` é comparada com `config().identifier`. Se for Cockpit, inicializa `real_estate.sqlite` e registra 7 comandos adicionais
3. **Capabilidades Tauri:** `tauri.node.conf.json` declara `["desktop-vault"]`; `tauri.cockpit.conf.json` declara `["desktop-vault", "cockpit-real-estate"]`

### 2.12 Como estão implementados os dashboards Holder e Founder?

**IMPORTANTE:** Os dashboards não são denominados "Holder Dashboard" e "Founder Dashboard" no código atual. As denominações no código são:

- **NodeDashboardPage** (`editions/node/node-dashboard-page.tsx`) — Dashboard da edição Node (uso por Holders no futuro)
  - Componentes: métricas de Vault + IPFS + Device + StorageProof
  - Dados: bridges Tauri reais + fallback web
  - Métricas de stake/recompensa: **HARDCODED** (`formatAsppbr(50000)`, `formatAsppbr(1450)`)

- **CockpitDashboardPage** (`editions/cockpit/cockpit-dashboard-page.tsx`) — Dashboard da edição Cockpit (uso por Founders no futuro)
  - Componentes: métricas de rede + botões de acesso rápido
  - Dados: **TODOS HARDCODED** (`"128 Nós"`, `"512 TB"`, `"99.98%"`, `"6.400.000 ASPPBR"`)
  - Sem bridges Tauri — sem dados reais

### 2.13 Quais módulos estão prontos para testes manuais?

| Módulo | Testável manualmente |
|---|---|
| Bootstrap / Vault Setup | ✅ Sim — binário compilado existe |
| Node Dashboard (UI) | ✅ Sim — com dados parcialmente mock |
| IPFS (UI) | ✅ UI testável — sem daemon real |
| Real Estate (Cockpit) | ✅ Cockpit only |
| Auth (login/logout) | ✅ Sim |
| Wallets Hub (UI cards) | ✅ Cards visíveis — sub-módulos inexistentes |
| Ledger (UI) | 🟡 UI renderizável — sem dados reais sem JWT |

### 2.14 Quais funcionalidades dependem da API ASPPIBRA?

Dependências de `https://api.asppibra.com` (via axios + SWR):
- `useGetTreasuryAnalytics()` → `GET /api/treasury/analytics`
- `useGetCitizenLedger(id)` → `GET /api/treasury/citizen/{id}/ledger`
- `useGetCitizens()` → `GET /api/identity/citizens`

**Problema crítico:** O login desktop (`signInWithPassword`) apenas desbloqueia o Vault local via `VaultBridge.unlock()`. **Não há chamada à API para obter JWT**. Portanto, as 3 funções acima falharão com 401 em contexto desktop.

### 2.15 Quais funcionalidades dependem de bancos SQLite locais?

| Banco | Localização (runtime) | Usado por |
|---|---|---|
| `devos_vault.sqlite` | `<app_data>/devos_vault/` | Vault, Wallets — AMBAS as edições |
| `real_estate.sqlite` | `<app_data>/real_estate/` | Real Estate — APENAS Cockpit |

**Localização no sistema (Linux):** `~/.local/share/br.aspp.devos.node/` e `~/.local/share/br.aspp.devos.cockpit/`

### 2.16 Quais funcionalidades dependem do Vault, Wallet ou IPFS?

- **Vault:** Bootstrap inteiro, qualquer acesso autenticado ao sistema
- **Wallet Genesis:** Geração de carteira BIP-39/44 — Rust pronto, UI como hub
- **IPFS:** `IpfsView`, `StorageProofCard`, `IpfsDaemonMetric`, `NodeDashboardPage` (métrica)

### 2.17 Qual é a estrutura de layout mais adequada para organizar o aplicativo?

O `DevOSLayout` já existe e está operacional. Ele implementa:
- Sidebar vertical com navegação por grupos (FINANCEIRO, OPERAÇÕES, CONTROL PLANE, SECURITY, INFRASTRUCTURE)
- Header com WindowModeToggle, MenuButton, NavToggleButton
- Suporte a mini-nav (modo colapsado)
- Footer de status (atualmente com texto de sandbox/mock)

**Problema:** O `DEVOS_NAV_DATA` hardcoded no layout aponta para rotas que não existem em nenhuma edição (ex: `analytics`, `blog`, `security`, `audit`, `apis`). O sidebar mostrará itens que não têm rota registrada.

### 2.18 Qual é a sequência mínima de alterações para não quebrar o código existente?

Ver documento `15_MINIMUM_IMPLEMENTATION_ROADMAP.md` para a sequência detalhada.

**Resumo da sequência segura:**
1. Remover as 3 rotas imobiliárias do `edition.node.ts`
2. Adicionar rotas de Wallets e Ledger ao Node (com API guard)
3. Corrigir o `DEVOS_NAV_DATA` para refletir apenas rotas reais do Node
4. Implementar fluxo de obtenção de JWT na API após unlock do vault
5. Implementar credencial Holder

---

## 3. ACHADOS CRÍTICOS (TOP 5)

### ❌ CRÍTICO 1 — Rotas Imobiliárias no Node Edition
O `edition.node.ts` registra 3 rotas apontando para `RealEstateView`, mas o banco `real_estate.sqlite` **não é inicializado** no Node. Qualquer acesso a essas rotas no desktop Node causará pânico no Rust por estado não registrado.

**Evidência:** `src-tauri/src/lib.rs` linha `if is_cockpit { ... real_estate_db ... }`  
**Arquivo com bug:** `src/app/editions/edition.node.ts` (rotas `/devos/cadastre`, `/devos/database`, `/real-estate`)

### ❌ CRÍTICO 2 — Ausência de JWT no Fluxo de Autenticação Desktop
O login desktop (`signInWithPassword`) chama `VaultBridge.unlock(password)` e retorna `true`. **Não há chamada à API** para obter token JWT com `role: "HOLDER"`. Consequência: hooks `useGetTreasuryAnalytics` e `useGetCitizenLedger` falharão com 401 em produção.

**Evidência:** `src/modules/authentication/context/jwt.ts` — bloco `if (isTauriDesktop())`

### ⚠️ CRÍTICO 3 — Métricas Hardcoded no Dashboard Node
O `NodeDashboardPage` exibe `Stake Operacional: 50.000 ASPPBR` e `Recompensa: 1.450 ASPPBR` como valores fixos no código (`formatAsppbr(50000)`, `formatAsppbr(1450)`). Esses valores não vêm de nenhum backend real.

**Evidência:** `src/app/editions/node/node-dashboard-page.tsx` — MetricBox components

### ⚠️ CRÍTICO 4 — Cockpit Dashboard 100% Mock
O `CockpitDashboardPage` exibe todos os dados como strings literais hardcoded: `"128 Nós"`, `"512 TB"`, `"99.98%"`, `"6.400.000 ASPPBR"`. Não há bridge, hook ou API call nesta página.

**Evidência:** `src/app/editions/cockpit/cockpit-dashboard-page.tsx`

### ⚠️ CRÍTICO 5 — IPFS Daemon Não Instalado
O módulo IPFS tem implementação completa em Rust e UI completa em React, mas o binário Kubo (`ipfs`) **não está instalado no sistema**. Todos os comandos IPFS retornarão erro de daemon offline.

**Evidência:** Verificação do sistema — `ipfs` não encontrado em PATH

---

## 4. INVENTÁRIO DE TECNOLOGIAS

| Tecnologia | Versão/Estado | Localização |
|---|---|---|
| Tauri | v2 | `src-tauri/Cargo.toml` |
| React | 18+ | `package.json` |
| TypeScript | 5+ | `tsconfig.json` |
| MUI (Material UI) | v6 | imports em toda a UI |
| React Router | v7 | `app-router.tsx` |
| SWR | presente | treasury-hooks.ts |
| Axios | presente | `src/lib/axios.ts` |
| Rust | stable | compilado em `src-tauri/target/debug/app` (796MB) |
| SQLite | 2 bancos | vault + real_estate |
| Typst | integrado | `src-tauri/src/platform/typst_engine.rs` |
| Three.js | splash screen | `SplashScreen` component |
| BIP-39/BIP-44 | Rust | `src-tauri/src/modules/wallets/` |
| Kubo (IPFS) | NÃO INSTALADO | binário ausente |

---

## 5. CONCLUSÃO EXECUTIVA

O repositório DevOS Desktop possui **uma base técnica sólida** com arquitetura bem estruturada, separação de edições funcional e módulos Rust implementados para as operações críticas (Vault, Wallets, IPFS, Documentos).

No entanto, o estado atual apresenta **divergências significativas** entre o que a interface promete e o que o backend entrega:

- **3 rotas quebradas** no Node Edition (imobiliário)
- **Métricas estáticas** nos dois dashboards principais
- **Autenticação institucional ausente** (sem JWT → sem dados reais do Ledger)
- **IPFS daemon offline** (Kubo não instalado)
- **Credencial Holder inexistente** no código

A primeira entrega **DevOS Node → Holder Beta 1.0** é viável, mas requer um plano de implementação estruturado que comece pela correção das rotas, integração do JWT e disponibilização do fluxo completo de criação da Wallet Genesis para o usuário Holder.

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Natureza: read-only.*  
*Referência de código: branch `main`, HEAD `6831a40`*

