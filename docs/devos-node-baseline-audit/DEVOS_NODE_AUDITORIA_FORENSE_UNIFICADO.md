# DEVOS NODE — AUDITORIA FORENSE BASELINE 1.0
## ASPPIBRA-DAO DevOS Desktop — Documento Unificado

**Ordem:** ORDEM 6 — Auditoria Forense do Estado Atual  
**Data:** 05/11/2026  
**Branch auditado:** `main` | **HEAD:** `6831a40ca4c27e2c2cb9bcc754d8e7fc130cb07a`  
**Commit:** `feat(ledger): eliminate simulated mock data and silent fallbacks`  
**Natureza:** Auditoria exclusivamente read-only — ZERO modificações no código  
**Produto prioritário:** DevOS Node → Holder Beta 1.0  
**Produto secundário:** DevOS Cockpit → Founder (preservado, não alterado)

---

> [!IMPORTANT]
> **As quatro dimensões do projeto são distintas e não devem ser confundidas:**
> - **Edição Node** = software nativo para operadores de nó / participantes Holder
> - **Edição Cockpit** = software nativo para administração institucional / Founders
> - **Perfil Holder** = credencial de participação comunitária
> - **Perfil Founder** = credencial de fundador institucional

---

## ÍNDICE

1. [Resumo Executivo](#1-resumo-executivo)
2. [Estado Atual do Repositório](#2-estado-atual-do-repositório)
3. [Edições Nativas: Node vs Cockpit](#3-edições-nativas-node-vs-cockpit)
4. [Auditoria dos Dashboards: Holder e Founder](#4-auditoria-dos-dashboards-holder-e-founder)
5. [Inventário Completo de Páginas e Views](#5-inventário-completo-de-páginas-e-views)
6. [Registro de Rotas e Navegação](#6-registro-de-rotas-e-navegação)
7. [Layouts e Componentes Compartilhados](#7-layouts-e-componentes-compartilhados)
8. [Inventário de Módulos e Serviços](#8-inventário-de-módulos-e-serviços)
9. [Grafo de Dependências](#9-grafo-de-dependências)
10. [Fontes de Dados e Integrações](#10-fontes-de-dados-e-integrações)
11. [Matriz de Testabilidade Manual](#11-matriz-de-testabilidade-manual)
12. [Fluxo de Bootstrap e Autenticação](#12-fluxo-de-bootstrap-e-autenticação)
13. [Compatibilidade Node / Cockpit](#13-compatibilidade-node--cockpit)
14. [Checklist de Estado Atual](#14-checklist-de-estado-atual)
15. [Roteiro Mínimo de Implementação](#15-roteiro-mínimo-de-implementação)

---

---

# 1. RESUMO EXECUTIVO

## 1.1 Produto Prioritário

| Dimensão | Valor |
|---|---|
| **Produto foco** | DevOS Node — Holder Beta 1.0 |
| **Produto secundário** | DevOS Cockpit — Founder (preservado, não alterado) |
| **Edição Node** | Software nativo para operadores de nó / participantes Holder |
| **Edição Cockpit** | Software nativo para administração institucional / Founders |
| **Perfil Holder** | Credencial de participação comunitária |
| **Perfil Founder** | Credencial de fundador institucional |

## 1.2 Respostas às 20 Questões Centrais da Ordem 6

### Q1 — Como o aplicativo está organizado?

O repositório segue uma arquitetura **Tauri v2 + React + TypeScript**. O frontend está em `src/` e o backend nativo em `src-tauri/src/`. A separação entre edições ocorre em **build time** via alias Vite `@edition`, que aponta para `edition.node.ts` ou `edition.cockpit.ts`.

```
DevOS-Desktop/
├── src/                        # Frontend React/TypeScript
│   ├── app/                    # Bootstrap, router, layouts, editions
│   ├── modules/                # 8 módulos de domínio
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

### Q2 — Quais páginas existem? (20 componentes de tela)

| Componente | Local | Tipo |
|---|---|---|
| `NodeDashboardPage` | `editions/node/` | Dashboard Node |
| `CockpitDashboardPage` | `editions/cockpit/` | Dashboard Cockpit |
| `JwtSignInView` | `modules/authentication/` | Login |
| `JwtSignUpView` | `modules/authentication/` | Cadastro/Setup Vault |
| `JwtResetPasswordView` | `modules/authentication/` | Reset Senha |
| `JwtUpdatePasswordView` | `modules/authentication/` | Nova Senha |
| `JwtVerifyView` | `modules/authentication/` | Verificação |
| `IpfsView` | `modules/ipfs/` | IPFS & DePIN |
| `LedgerView` | `modules/ledger/` | Livro-Razão |
| `CitizenLedgerView` | `modules/ledger/citizen-ledger/` | Ledger por Cidadão |
| `RealEstateView` | `modules/real-estate/` | Cadastro Imobiliário |
| `WalletsLandingView` | `modules/wallets/` | Hub Bancário/Carteiras |
| `CessaoPosseView` | `sections/cessao-de-posse/` | Cessão de Posse |
| `InfrastructurePage` | `pages/devos/` | Infraestrutura |
| `NotFoundView` | `app/pages/` | 404 |
| `ErrorView` | `app/pages/` | Erro genérico |

### Q3 — Quais componentes são utilizados?

Principais: `DevOSLayout`, `AuthCenteredLayout`, `HostIntegrityCard`, `StorageProofCard`, `IpfsDaemonMetric`, `VaultStatusMetric`, `DoubleEntryChartCard`, `SplashScreen`, MetricBox, StatusBadge, Card (MUI).

### Q4 — Quais páginas possuem rotas?

**Edição Node (6 rotas):**

| Rota | Componente | Status |
|---|---|---|
| `/` | `NodeDashboardPage` | ✅ Funcional (parcialmente mock) |
| `/devos/ipfs` | `IpfsView` | 🟡 UI pronta, daemon offline |
| `/devos/cadastre` | `RealEstateView` | ❌ **QUEBRADO** — DB não inicializado |
| `/devos/database` | `RealEstateView` | ❌ **QUEBRADO** — DB não inicializado |
| `/real-estate` | `RealEstateView` | ❌ **QUEBRADO** — rota legada, mesmo problema |
| `/devos/infrastructure` | `InfrastructurePage` | 🟡 Verificar |

**Edição Cockpit (11 rotas):**

| Rota | Componente | Status |
|---|---|---|
| `/` | `CockpitDashboardPage` | 🟡 Dados 100% hardcoded |
| `/devos/wallets` | `WalletsLandingView` | 🟡 Hub com sub-módulos ausentes |
| `/banking` | `WalletsLandingView` | 🟡 Alias de `/devos/wallets` |
| `/devos/ipfs` | `IpfsView` | 🟡 UI ok, daemon offline |
| `/devos/cadastre` | `RealEstateView` | ✅ real_estate.sqlite inicializado |
| `/devos/cessao-posse` | `CessaoPosseView` | 🟡 Verificar |
| `/devos/database` | `RealEstateView` | ✅ Alias do banco imobiliário |
| `/devos/ledger` | `LedgerView` | ⚠️ Sem JWT → dados da API falharão |
| `/devos/dao` | `LedgerView` | ⚠️ Alias de `/devos/ledger` |
| `/real-estate` | `RealEstateView` | ✅ Legado OK |
| `/devos/infrastructure` | `InfrastructurePage` | 🟡 |

### Q5 — Quais páginas estão acessíveis?

**Node (desktop desbloqueado):** `/` e `/devos/ipfs` têm chance de funcionar. As 3 rotas imobiliárias causarão crash/erro por ausência de `RealEstateDatabase` no estado Tauri.

### Q6 — Quais páginas estão órfãs ou desconectadas?

- `CitizenLedgerView` — apenas sub-view interno de `LedgerView`
- Sub-módulos do `WalletsLandingView` (conta, cartões, rede, etc.) — referenciados por nome mas **arquivos não existem**
- 7 rotas em `paths.ts` sem componente: analytics, blog, notifications, security, audit, apis, invoices

### Q7 — Quais funcionalidades estão realmente implementadas?

| Funcionalidade | Status |
|---|---|
| Bootstrap / Splash screen | ✅ |
| Inicialização do Vault | ✅ |
| Login / Desbloqueio | ✅ |
| Node Dashboard (métricas parciais) | ✅ Parcial |
| IPFS (UI completa) | ✅ UI / ❌ Daemon offline |
| Wallet Genesis (Rust) | ✅ Rust / ❌ UI wizard não existe |
| Ledger / Tesouraria | ✅ UI / ❌ Sem JWT |
| Cadastro Imobiliário | ✅ Cockpit only |
| Certificado de Identidade (.dvcert) | ❌ Não existe |
| Credencial Holder | ❌ Não implementada |
| Governança DAO | ❌ Sem rota |

### Q8 — Quais serviços Rust estão disponíveis?

**Comuns às duas edições (macro `app_invoke_handler!`):**
```
Sistema:    get_device_status
Vault:      get_vault_status, init_master_password, unlock_vault, lock_vault,
            export_authorized_secret, export_vault_backup, restore_vault_backup
Wallets:    generate_seed_and_preview, reveal_pending_mnemonic, cancel_pending_creation,
            confirm_and_save_wallets, list_stored_wallets, fetch_wallet_balance, batch_fetch_wallet_balances
Documentos: generate_document, preview_document, export_previewed_document
IPFS:       get_ipfs_daemon_status, execute_storage_proof, ipfs_upload_file, ipfs_download_file,
            ipfs_pin_cid, ipfs_unpin_cid, ipfs_verify_cid_custody, ipfs_verify_all_pins,
            ipfs_query_providers, ipfs_list_managed_pins, ipfs_start_daemon, ipfs_stop_daemon, ipfs_restart_daemon
```

**Exclusivos do Cockpit (+7):**
```
Real Estate: get_real_estate_stats, preview_real_estate_import, execute_real_estate_import,
             list_import_batches, list_audit_findings, list_properties, select_spreadsheet_file
```

### Q9 — Quais bridges Tauri existem?

| Bridge | Arquivo |
|---|---|
| `VaultBridge` | `platform/tauri/vault/vault-bridge.ts` |
| `WalletBridge` | `platform/tauri/wallets/wallet-bridge.ts` |
| `IpfsBridge` | `platform/tauri/ipfs/ipfs-bridge.ts` |
| `SystemBridge` | `platform/tauri/system/system-bridge.ts` |
| `DocumentBridge` | `platform/tauri/documents/document-bridge.ts` |
| `MonitoringBridge` | `platform/tauri/monitoring/monitoring-bridge.ts` |
| `RealEstateBridge` | `platform/tauri/real-estate/real-estate-bridge.ts` |
| `WindowBridge` | `platform/tauri/window/window-bridge.ts` |

### Q10 — Quais páginas compartilham serviços?

`NodeDashboardPage` compartilha componentes de identity, ipfs e wallets. `DevOSLayout` é compartilhado por TODAS as rotas autenticadas. `HostIntegrityCard`, `StorageProofCard`, `IpfsDaemonMetric` são usados pelo Node Dashboard.

### Q11 — Como funciona a separação Node/Cockpit?

Em 3 níveis: (1) Build time via alias Vite `@edition`; (2) Runtime Rust: `is_cockpit = config().identifier == "br.aspp.devos.cockpit"`; (3) Capabilidades Tauri: Node tem `["desktop-vault"]`, Cockpit tem `["desktop-vault", "cockpit-real-estate"]`.

### Q12 — Como estão implementados os dashboards Holder e Founder?

Os dashboards **não são denominados "Holder" ou "Founder"** no código:
- **`NodeDashboardPage`** = dashboard da edição Node (futuro Holder) — dados reais do vault/IPFS/device + 2 métricas hardcoded
- **`CockpitDashboardPage`** = dashboard da edição Cockpit (futuro Founder) — 100% hardcoded, sem nenhum bridge

### Q13 — Quais módulos estão prontos para testes manuais?

Bootstrap, Node Dashboard (UI), IPFS (UI), Real Estate (Cockpit), Auth (login/logout), Wallets Hub (UI cards), Ledger (UI renderizável sem dados reais).

### Q14 — Quais funcionalidades dependem da API ASPPIBRA?

`useGetTreasuryAnalytics()`, `useGetCitizenLedger(id)`, `useGetCitizens()` — todas chamam `https://api.asppibra.com` via SWR+axios. Sem JWT (que nunca é obtido no desktop), todas falharão com 401.

### Q15 — Quais funcionalidades dependem de SQLite local?

| Banco | Edição | Usado por |
|---|---|---|
| `devos_vault.sqlite` | Ambas | Vault, Wallets |
| `real_estate.sqlite` | Apenas Cockpit | Real Estate |

### Q16 — Quais funcionalidades dependem do Vault, Wallet ou IPFS?

- **Vault:** Bootstrap, qualquer acesso autenticado
- **Wallet Genesis:** Rust pronto, UI wizard ausente
- **IPFS:** IpfsView, StorageProofCard, IpfsDaemonMetric, NodeDashboardPage

### Q17 — Qual é a estrutura de layout mais adequada?

O `DevOSLayout` já existe e está operacional. Problema: `DEVOS_NAV_DATA` é hardcoded e igual para ambas as edições, mostrando itens inválidos no Node.

### Q18 — Qual é a sequência mínima de alterações?

Ver Seção 15 — Roteiro Mínimo de Implementação.

## 1.3 Achados Críticos (Top 5)

> [!CAUTION]
> **CRÍTICO 1 — Rotas Imobiliárias Quebradas no Node**
> `edition.node.ts` registra 3 rotas para `RealEstateView`, mas `real_estate.sqlite` **não é inicializado** no Node. Causará erro Tauri ao acessar.
> **Evidência:** `src-tauri/src/lib.rs` — bloco `if is_cockpit { ... real_estate_db ... }`

> [!CAUTION]
> **CRÍTICO 2 — Ausência de JWT no Fluxo de Autenticação Desktop**
> `signInWithPassword()` chama apenas `VaultBridge.unlock()`. **Nenhuma chamada à API** para JWT. Hooks de Ledger/Treasury falharão com 401.
> **Evidência:** `src/modules/authentication/context/jwt.ts`

> [!WARNING]
> **CRÍTICO 3 — Métricas Hardcoded no Node Dashboard**
> `Stake Operacional: 50.000 ASPPBR` e `Recompensa: 1.450 ASPPBR` são valores fixos no código.
> **Evidência:** `src/app/editions/node/node-dashboard-page.tsx`

> [!WARNING]
> **CRÍTICO 4 — Cockpit Dashboard 100% Mock**
> `CockpitDashboardPage` exibe `"128 Nós"`, `"512 TB"`, `"99.98%"`, `"6.400.000 ASPPBR"` como strings literais. Nenhum dado real.

> [!WARNING]
> **CRÍTICO 5 — IPFS Daemon Não Instalado**
> UI e Rust completamente implementados, mas o binário Kubo não está instalado no sistema. Todos os comandos IPFS retornarão erro.

## 1.4 Inventário de Tecnologias

| Tecnologia | Estado |
|---|---|
| Tauri v2 | ✅ Funcional |
| React 18+ | ✅ Funcional |
| TypeScript 5+ | ✅ Funcional |
| MUI v6 | ✅ Funcional |
| React Router v7 | ✅ Funcional |
| SWR + Axios | ✅ Sem JWT → dados externos falham |
| Rust (compilado) | ✅ Binário 796MB |
| SQLite (vault) | ✅ Funcional |
| SQLite (real_estate) | ✅ Cockpit only |
| Typst (PDF) | ✅ Embutido no Rust |
| BIP-39/BIP-44 (Rust) | ✅ Implementado |
| Three.js (splash) | ✅ Funcional |
| Kubo (IPFS) | ❌ Não instalado |

## 1.5 Conclusão Executiva

O repositório possui **base técnica sólida** com arquitetura bem estruturada. As divergências entre o que a interface promete e o que o backend entrega são corrigíveis com um plano de implementação estruturado. A primeira entrega **DevOS Node → Holder Beta 1.0** é viável com as etapas definidas na Seção 15.

---

---

# 2. ESTADO ATUAL DO REPOSITÓRIO

## 2.1 Identificação

| Campo | Valor |
|---|---|
| **Caminho local** | `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop` |
| **Remote** | `https://github.com/ASPPIBRA-DAO/DevOS-Desktop.git` |
| **Branch ativa** | `main` |
| **HEAD** | `6831a40ca4c27e2c2cb9bcc754d8e7fc130cb07a` |
| **Commit message** | `feat(ledger): eliminate simulated mock data and silent fallbacks` |
| **Status do working tree** | Limpo — apenas `docs/` não rastreado (`?? docs/`) |

## 2.2 Toolchain

| Ferramenta | Status no sistema |
|---|---|
| **Rust / cargo** | ✅ Binário compilado existe em `src-tauri/target/debug/app` (796MB) |
| **Node.js** | Disponível para sessões do usuário |
| **pnpm** | Disponível para sessões do usuário |
| **Kubo (IPFS)** | ❌ Não instalado |
| **Typst** | Integrado ao binário Rust |

## 2.3 Configurações de Edição

```json
// tauri.node.conf.json
{ "identifier": "br.aspp.devos.node", "capabilities": ["desktop-vault"] }

// tauri.cockpit.conf.json
{ "identifier": "br.aspp.devos.cockpit", "capabilities": ["desktop-vault", "cockpit-real-estate"] }
```

## 2.4 Bancos SQLite (Runtime)

| Banco | Path em runtime (Linux) |
|---|---|
| `devos_vault.sqlite` | `~/.local/share/br.aspp.devos.node/devos_vault/` |
| `real_estate.sqlite` | `~/.local/share/br.aspp.devos.cockpit/real_estate/` |

## 2.5 API Remota

```typescript
// src/lib/axios.ts
baseURL: 'https://api.asppibra.com'
endpoints:
  platform.treasury.analytics  → GET /api/treasury/analytics
  platform.treasury.root       → /api/treasury
  platform.identity.citizens   → GET /api/identity/citizens
```

---

---

# 3. EDIÇÕES NATIVAS: NODE VS COCKPIT

## 3.1 Mecanismo de Separação

A separação ocorre em 3 camadas simultâneas:

**1. Alias Vite:** `@edition` → `edition.node.ts` ou `edition.cockpit.ts` dependendo do `--mode`

**2. Runtime Rust (`lib.rs`):**
```rust
const COCKPIT_IDENTIFIER: &str = "br.aspp.devos.cockpit";
let is_cockpit = context.config().identifier == COCKPIT_IDENTIFIER;
// Se Cockpit → inicializa real_estate.sqlite + registra 7 comandos extras
```

**3. Capabilidades Tauri:** `desktop-vault` (ambas) + `cockpit-real-estate` (Cockpit only)

## 3.2 Comparativo de Rotas

| # | Path | Componente | Node | Cockpit |
|---|---|---|---|---|
| 1 | `/` | NodeDashboardPage / CockpitDashboardPage | ✅ B | 🟡 C |
| 2 | `/devos/wallets` | WalletsLandingView | ❌ | 🟡 B |
| 3 | `/banking` | WalletsLandingView | ❌ | 🟡 B |
| 4 | `/devos/ipfs` | IpfsView | 🟡 C | 🟡 C |
| 5 | `/devos/cadastre` | RealEstateView | ❌ QUEBRADO | ✅ A |
| 6 | `/devos/cessao-posse` | CessaoPosseView | ❌ | 🟡 |
| 7 | `/devos/database` | RealEstateView | ❌ QUEBRADO | ✅ A |
| 8 | `/devos/ledger` | LedgerView | ❌ | ⚠️ C |
| 9 | `/devos/dao` | LedgerView | ❌ | ⚠️ C |
| 10 | `/real-estate` | RealEstateView | ❌ QUEBRADO | ✅ A |
| 11 | `/devos/infrastructure` | InfrastructurePage | 🟡 | 🟡 |

**Legenda:** A=funcional | B=parcialmente mock | C=quebrado/sem dados | ❌=não registrado

## 3.3 Rotas Ausentes no Node (críticas para o Holder)

| Path | Componente | Impacto para Holder |
|---|---|---|
| `/devos/wallets` | `WalletsLandingView` | 🔴 Holder precisa de carteiras |
| `/devos/ledger` | `LedgerView` | 🔴 Holder precisa ver extrato |
| `/devos/dao` | `LedgerView` | 🔴 Tesouraria |
| `/devos/cessao-posse` | `CessaoPosseView` | 🟡 Contratos |

---

---

# 4. AUDITORIA DOS DASHBOARDS: HOLDER E FOUNDER

## 4.1 NodeDashboardPage (destinado ao Holder)

**Arquivo:** `src/app/editions/node/node-dashboard-page.tsx`

| Elemento | Fonte | Estado |
|---|---|---|
| Stake Operacional (50.000 ASPPBR) | `formatAsppbr(50000)` | ❌ Hardcoded |
| Recompensa de Época (1.450 ASPPBR) | `formatAsppbr(1450)` | ❌ Hardcoded |
| Status do Vault | `WalletBridge.getVaultStatus()` | ✅ Real |
| Status do daemon IPFS | `IpfsBridge.getDaemonStatus()` | ✅ Real (daemon offline) |
| Status do dispositivo | `SystemBridge.getDeviceStatus()` | ✅ Real |

## 4.2 CockpitDashboardPage (destinado ao Founder)

**Arquivo:** `src/app/editions/cockpit/cockpit-dashboard-page.tsx`

**Dados:** 100% HARDCODED — sem nenhum bridge, hook ou API call
- `"128 Nós"` / `"512 TB"` / `"99.98%"` / `"6.400.000 ASPPBR"` — strings literais fixas

## 4.3 Perfis Holder e Founder — Estado no Código

> [!WARNING]
> Os perfis **Holder** e **Founder** não existem como código. São apenas conceitos em texto da UI e comentários. A implementação completa dos perfis é parte do roadmap.

| Funcionalidade Holder | Status |
|---|---|
| Credencial Holder (.dvcert) | ❌ NÃO EXISTE |
| `role: "HOLDER"` no JWT | ❌ NÃO EXISTE |
| View de identidade Holder | ❌ NÃO EXISTE |
| Rota exclusiva de Holder | ❌ NÃO EXISTE |
| Vínculo carteira → rede | ❌ NÃO IMPLEMENTADO |

---

---

# 5. INVENTÁRIO COMPLETO DE PÁGINAS E VIEWS

## Critérios de Classificação

| Código | Significado |
|---|---|
| **A** | Rota registrada + componente implementado + dados reais funcionais |
| **B** | Rota registrada + componente implementado + dados parcialmente mock |
| **C** | Rota registrada + componente implementado + dados 100% mock / dependência externa quebrada |
| **D** | Componente implementado mas SEM rota registrada (sub-view ou órfão) |
| **E** | Rota declarada em `paths.ts` mas SEM componente e SEM rota registrada |
| **F** | Referenciado na UI como cards/links mas arquivo NÃO existe |

## Inventário

| Componente | Módulo | Node | Cockpit | Class. |
|---|---|---|---|---|
| `NodeDashboardPage` | editions/node | ✅ | — | B |
| `CockpitDashboardPage` | editions/cockpit | — | ✅ | C |
| `JwtSignInView` | authentication | ✅ | ✅ | A |
| `JwtSignUpView` | authentication | ✅ | ✅ | A |
| `JwtResetPasswordView` | authentication | ✅ | ✅ | C |
| `JwtUpdatePasswordView` | authentication | ✅ | ✅ | C |
| `JwtVerifyView` | authentication | ✅ | ✅ | C |
| `IpfsView` | ipfs | ✅ | ✅ | C |
| `LedgerView` | ledger | — | ✅ | C |
| `CitizenLedgerView` | ledger | — | — | D |
| `RealEstateView` | real-estate | ⚠️ QUEBRADA | ✅ | A/C |
| `WalletsLandingView` | wallets | — | ✅ | B |
| `CessaoPosseView` | sections | — | ✅ | 🟡 |
| `InfrastructurePage` | pages/devos | ✅ | ✅ | 🟡 |
| `NotFoundView` | app/pages | ✅ | ✅ | A |
| `ErrorView` | app/pages | — | — | D |

## Rotas E (paths.ts sem componente)

`analytics`, `blog`, `notifications`, `security`, `audit`, `apis`, `invoices` — aparecem no sidebar mas levam ao 404.

## Sub-módulos F (referenciados no WalletsLandingView mas inexistentes)

`overview-banking-view.tsx`, `conta-view.tsx`, `banking-cartoes-view.tsx`, `banking-rede-view.tsx`, `banking-transacoes-view.tsx`, `receber/index.tsx` e outros — aparecem como cards clicáveis mas os arquivos não existem no repositório.

---

---

# 6. REGISTRO DE ROTAS E NAVEGAÇÃO

## 6.1 Fluxo do AppRouter

```
AppBootstrapProvider (state machine)
│
├── state = 'UNINITIALIZED'  → AuthCenteredLayout > JwtSignUpView (isInitVault=true)
├── state = 'READY_LOCKED'   → AuthCenteredLayout > JwtSignInView
└── state = 'READY_UNLOCKED' | 'WEB_PREVIEW'
        └── Routes
                ├── /login, /register, /forgot-password, /reset-password, /verify → AuthCenteredLayout
                └── <DevOSLayout>
                        ├── currentEdition.routes.map(r => <Route path={r.path} />)
                        └── * → NotFoundView
```

## 6.2 Sidebar DEVOS_NAV_DATA — Itens Sem Rota no Node

O sidebar é **idêntico** nas duas edições. No Node, os seguintes itens levam ao 404 ou causam erro:

```
FINANCEIRO:    Tesouraria (/devos/dao) → 404 no Node
               Carteiras (/devos/wallets) → 404 no Node
               Livro-Razão (/devos/ledger) → 404 no Node
               Faturas (/devos/invoices) → 404 em AMBAS as edições

OPERAÇÕES:     Banco Imobiliário (/devos/cadastre) → ERRO no Node
               Cessão de Posse → 404 no Node
               Hub Analítico → 404 em AMBAS
               Blog → 404 em AMBAS

CONTROL PLANE: Observability (/) → ✅
               IPFS → 🟡 (daemon offline)
               Database Explorer → ERRO no Node
               Notificações → 404 em AMBAS

SECURITY:      Security → 404 em AMBAS
               Audit → 404 em AMBAS

INFRASTRUCTURE: APIs → 404 em AMBAS
                Infrastructure → 🟡
```

## 6.3 Detalhe das 3 Rotas Mortas no Node

```rust
// lib.rs — real_estate_db só registrada no Cockpit:
if is_cockpit {
    app.manage(real_estate_db);  // ← NUNCA EXECUTADO no Node
}

// real_estate_commands.rs — comando usa State<RealEstateDatabase>:
pub fn get_real_estate_stats(app: AppHandle) -> Result<RealEstateStats, String> {
    // Tauri tenta obter State<RealEstateDatabase>
    // → não encontrado → retorna erro
}
```

---

---

# 7. LAYOUTS E COMPONENTES COMPARTILHADOS

## 7.1 DevOSLayout — Estrutura

```
DevOSLayout (app/layouts/devos/layout.tsx)
├── HEADER
│   ├── WindowModeToggle, NavToggleButton, MenuButton
│   └── AccountDrawer (avatar, logout)
│
├── SIDEBAR
│   ├── Logo ASPPIBRA
│   ├── DEVOS_NAV_DATA (5 grupos — idêntico nas 2 edições)
│   └── Status: "mock-node-alpha" ← HARDCODED
│
├── MAIN
│   └── Container > <Outlet />
│
└── FOOTER
    └── "Architecture Baseline v2.2.2 • In-Memory Mocks Active" ← HARDCODED
```

## 7.2 AuthCenteredLayout

Usado em todas as telas de autenticação e estados de bootstrap UNINITIALIZED/READY_LOCKED. Layout centralizado com fundo de globo Three.js.

## 7.3 Componentes Shared Críticos

| Componente | Localização | Usado em |
|---|---|---|
| `MetricBox` | `shared/components/data-display/` | NodeDashboardPage, CockpitDashboardPage |
| `StatusBadge` | `shared/components/data-display/` | NodeDashboardPage, CockpitDashboardPage |
| `Card` | `shared/components/data-display/` | Múltiplos módulos |
| `Iconify` | `shared/components/iconify/` | Todos os módulos |
| `SplashScreen` | `shared/components/loading-screen/` | BootstrapProvider |
| `NavSectionVertical` | `shared/components/nav-section/` | DevOSLayout |

## 7.4 Providers da Aplicação

```
<ErrorBoundary>
  <ThemeProvider>
    <SWRConfig>
      <BootstrapProvider>  → Máquina de estados do Vault
        <AppRouter />
```

---

---

# 8. INVENTÁRIO DE MÓDULOS E SERVIÇOS

## 8.1 Módulos Frontend

### Authentication
- **Fluxo desktop:** `signInWithPassword()` → `VaultBridge.unlock()` → sem JWT
- **Fluxo web:** valida e-mail não-vazio → retorna true (sem verificação)
- **Gap:** `signInWithWeb3()` lança exceção explícita — não implementado

### Identity
- **Estado:** Extremamente thin — apenas `HostIntegrityCard` (1 componente)
- **Ausente:** View de identidade, certificado, credencial, registro

### IPFS
- **Frontend:** UI completa (6 componentes + IpfsView)
- **Backend Rust:** Completo (6 arquivos: client, content, daemon, integrity, models, pinning)
- **Bloqueio:** Kubo não instalado → todos os comandos falham

### Ledger
- **Frontend:** `LedgerView` (tabs macro/citizen) + `CitizenLedgerView` + hooks SWR
- **Gap:** Chama `https://api.asppibra.com` sem JWT → 401 em todos os endpoints
- **Rota:** Não registrada no Node

### Real Estate
- **Status:** Funcional apenas no Cockpit
- **No Node:** 3 rotas registradas mas DB não inicializado → erro Tauri

### Wallets
- **Backend Rust:** BIP-39/BIP-44 completo (mnemonic, derivation, address, creation_session)
- **Frontend:** `WalletsLandingView` como hub de cards (sub-módulos ausentes como arquivos)
- **Gap:** Wizard de criação de wallet não existe
- **Rota:** Não registrada no Node

## 8.2 Módulos Rust

| Módulo | Arquivos | Status |
|---|---|---|
| vault/ | access_control.rs, encryption.rs | ✅ Completo |
| wallets/ | address.rs, creation_session.rs, derivation.rs, mnemonic.rs | ✅ Completo |
| ipfs/ | client.rs, content.rs, daemon.rs, integrity.rs, models.rs, pinning.rs | ✅ Completo (Kubo ausente) |
| documents/ | models.rs, service.rs, typst_renderer.rs, preview_store.rs, ports.rs | ✅ Completo |
| real_estate/ | importer.rs, normalization.rs | ✅ Cockpit only |
| monitoring/ | rpc_client.rs | ✅ Implementado, sem view |
| reports/ | engine.rs, models.rs | ✅ Implementado, apenas botão |

## 8.3 Storage

| Banco | Struct | Inicializado em | Migrações |
|---|---|---|---|
| `devos_vault.sqlite` | `LocalDatabase` | Ambas | `MigrationManager::run_migrations` |
| `real_estate.sqlite` | `RealEstateDatabase` | Apenas Cockpit | `RealEstateMigrationManager::run_migrations` |

---

---

# 9. GRAFO DE DEPENDÊNCIAS

## 9.1 Cadeia: Bootstrap / Inicialização

```
AppBootstrapProvider → isTauriDesktop()
                     → VaultBridge.getVaultStatus()
                       → Tauri IPC: get_vault_status
                         → commands/vault_commands.rs
                           → State<LocalDatabase>
                             → devos_vault.sqlite
```

## 9.2 Cadeia: Login / Desbloqueio

```
JwtSignInView → signInWithPassword({ password })
              → [Desktop] VaultBridge.unlock(password)
                → Tauri IPC: unlock_vault
                  → modules/vault/access_control.rs
                    → devos_vault.sqlite
              → [GAP] SEM chamada à API ASPPIBRA para JWT
              → bootstrap.setState('READY_UNLOCKED')
```

## 9.3 Cadeia: Node Dashboard

```
NodeDashboardPage
  ├── SystemBridge.getDeviceStatus() → get_device_status → system_commands.rs → hardware
  ├── WalletBridge.getVaultStatus() → get_vault_status → vault_commands.rs → SQLite
  ├── IpfsBridge.getDaemonStatus() → get_ipfs_daemon_status → ipfs/daemon.rs → [Kubo offline]
  ├── formatAsppbr(50000) → "50.000 ASPPBR" ← HARDCODED
  └── formatAsppbr(1450) → "1.450 ASPPBR" ← HARDCODED
```

## 9.4 Cadeia: Wallet Genesis

```
[UI wizard — NÃO EXISTE]
  → WalletBridge.generateSeedAndPreview()
    → Tauri IPC: generate_seed_and_preview
      → commands/wallet_commands.rs
        → modules/wallets/mnemonic.rs (BIP-39)
        → modules/wallets/creation_session.rs
  → WalletBridge.confirmAndSaveWallets(sessionId, password)
    → modules/wallets/derivation.rs (BIP-44)
    → modules/wallets/address.rs (endereços EVM)
    → modules/vault/encryption.rs (AES-256-GCM)
    → devos_vault.sqlite
```

## 9.5 Cadeia: Ledger (BLOQUEADO)

```
LedgerView → DoubleEntryChartCard
           → useGetTreasuryAnalytics()
             → SWR: axios.get('https://api.asppibra.com/api/treasury/analytics')
               → [Requer Authorization: Bearer <JWT>]
                 → [JWT NUNCA OBTIDO NO DESKTOP → 401]
```

## 9.6 Cadeia: IPFS (BLOQUEADO)

```
IpfsView → IpfsBridge.uploadFile(filePath)
         → Tauri IPC: ipfs_upload_file
           → modules/ipfs/content.rs
             → modules/ipfs/client.rs
               → Kubo HTTP API (localhost:5001)
                 → [KUBO NÃO INSTALADO → ERRO]
```

## 9.7 Dependências Externas — Resumo

| Dependência | Tipo | Estado |
|---|---|---|
| `https://api.asppibra.com` | API REST remota | ⚠️ Sem JWT no desktop |
| Kubo IPFS daemon | Local (port 5001) | ❌ Não instalado |
| Blockchain RPC | Externo | 🟡 URL não verificada |
| SQLite (devos_vault) | Local | ✅ Funcional |
| SQLite (real_estate) | Local | ✅ Cockpit only |
| Typst engine | Embutido no binário | ✅ Funcional |

---

---

# 10. FONTES DE DADOS E INTEGRAÇÕES

## 10.1 SQLite Local

| Banco | Edição | Dados | Status |
|---|---|---|---|
| `devos_vault.sqlite` | Ambas | Senha mestre, carteiras BIP-39/44 criptografadas | ✅ Funcional |
| `real_estate.sqlite` | Cockpit only | Propriedades imobiliárias, lotes, auditoria | ✅ Cockpit / ❌ Node |

## 10.2 API ASPPIBRA

```typescript
baseURL: 'https://api.asppibra.com'

GET /api/treasury/analytics        → useGetTreasuryAnalytics()   ← ❌ sem JWT
GET /api/treasury/citizen/{id}/ledger → useGetCitizenLedger(id)  ← ❌ sem JWT
GET /api/identity/citizens         → useGetCitizens()             ← ❌ sem JWT
```

## 10.3 Dados Hardcoded — Lista Completa

| Valor | Local |
|---|---|
| `"50.000 ASPPBR"` (stake) | `node-dashboard-page.tsx` |
| `"1.450 ASPPBR"` (recompensa) | `node-dashboard-page.tsx` |
| `"128 Nós"` | `cockpit-dashboard-page.tsx` |
| `"512 TB"` | `cockpit-dashboard-page.tsx` |
| `"99.98%"` | `cockpit-dashboard-page.tsx` |
| `"6.400.000 ASPPBR"` | `cockpit-dashboard-page.tsx` |
| `"mock-node-alpha"` | `layout.tsx` sidebar |
| `"Control Plane Sandbox • Mocks Ativos"` | `layout.tsx` sidebar |
| `"Architecture Baseline v2.2.2"` | `layout.tsx` footer |
| `"In-Memory Mocks Active"` | `layout.tsx` footer |

---

---

# 11. MATRIZ DE TESTABILIDADE MANUAL

## Testável Agora (sem dependências externas)

| Funcionalidade | Resultado esperado |
|---|---|
| Setup do Vault (1º acesso) | Vault inicializado, login automático |
| Login / Desbloqueio | Estado READY_UNLOCKED |
| Logout / Bloqueio | Estado READY_LOCKED |
| Node Dashboard (UI) | Métricas parciais (vault real, IPFS offline, stake mock) |
| Cockpit Dashboard (UI) | 4 métricas hardcoded, 2 botões de navegação |
| Navegação Infrastructure | Renderiza InfrastructurePage |
| Backup/Restore do Vault | Arquivos criptografados gerados/restaurados |
| Real Estate Import (Cockpit) | Import de planilha funciona |
| NotFoundView | Exibe 404 |
| WEB_PREVIEW mode | Banner de alerta + dados fallback |

## Testável Apenas com Kubo Instalado

Upload, download, pinning, prova DePIN, status real do daemon.

## Testável Apenas com JWT da API

Treasury Analytics, Citizen Ledger, lista de cidadãos, dados reais de tesouraria.

## Não Testável (não implementado)

Credencial Holder, registro de identidade, governança DAO, Wallet Genesis wizard, Auth Web3.

## Rotas que Causam Erro (não 404)

| Rota | Edição | Tipo de Falha |
|---|---|---|
| `/devos/cadastre` | Node | Tauri error: `RealEstateDatabase` state not managed |
| `/devos/database` | Node | Tauri error: `RealEstateDatabase` state not managed |
| `/real-estate` | Node | Tauri error: `RealEstateDatabase` state not managed |

---

---

# 12. FLUXO DE BOOTSTRAP E AUTENTICAÇÃO

## 12.1 Estados

```typescript
type BootstrapState =
  | 'INITIALIZING'    // Splash ativo — verificando vault
  | 'READY_UNLOCKED'  // App acessível
  | 'READY_LOCKED'    // Tela de login
  | 'UNINITIALIZED'   // Tela de setup (1º acesso)
  | 'WEB_PREVIEW'     // Modo demonstração web
  | 'TIMEOUT_WARNING' // IPC lento — aviso de retry
  | 'FATAL_ERROR'     // Falha crítica do vault
```

## 12.2 Diagrama de Fluxo

```
                   INITIALIZING (splash)
                         │
         ┌───────────────┼──────────────────┐
      Timeout          Falha             Sucesso
         │               │                  │
  TIMEOUT_WARNING   FATAL_ERROR      is_initialized?
         │               │            /         \
       retry           retry        false       true
                                     │           │
                               UNINITIALIZED  is_unlocked?
                                     │        /       \
                               [setup vault] false     true
                                             │          │
                                       READY_LOCKED  READY_UNLOCKED
                                             │
                                       signInWithPassword
                                       VaultBridge.unlock
                                       [SEM JWT DA API]
                                             │
                                       READY_UNLOCKED
```

## 12.3 Cenários Chave

**1º Acesso:** `UNINITIALIZED` → `JwtSignUpView (isInitVault)` → `initMasterPassword + unlock` → `READY_UNLOCKED`

**Uso Diário:** `READY_LOCKED` → `JwtSignInView` → `unlock_vault` → `[SEM JWT]` → `READY_UNLOCKED`

**Browser sem Tauri:** `WEB_PREVIEW` → dados fallback estáticos

## 12.4 GAP Crítico — Fluxo de JWT Necessário

```
Fluxo necessário para o Holder Beta:
  VaultBridge.unlock(password) → { success: true }
  → POST api.asppibra.com/auth/desktop-session { vault_signature, device_id }
  → Receber JWT { role: "HOLDER", holder_id, exp, ... }
  → Armazenar JWT em memória (não em localStorage)
  → axios passa Authorization: Bearer <JWT> em todas as requisições
  → useGetTreasuryAnalytics() e useGetCitizenLedger() funcionam
```

## 12.5 Proteção de Rotas — Estado Atual

**Não há proteção de rotas** além do bootstrap. Qualquer usuário que desbloqueie o vault tem acesso a todas as rotas da edição, sem verificação de role, credencial ou permissão por rota.

---

---

# 13. COMPATIBILIDADE NODE / COCKPIT

## 13.1 Componentes de Alto Risco (afetam AMBAS as edições)

| Componente | Risco |
|---|---|
| `DevOSLayout` | 🔴 ALTO — layout de todas as rotas autenticadas |
| `AppBootstrapProvider` | 🔴 ALTO — máquina de estados |
| `AppRouter` | 🔴 ALTO — roteamento |
| `paths.ts` | 🟡 MÉDIO — alterar um path afeta todos os links |
| `VaultBridge` | 🔴 ALTO — auth de ambas as edições |
| `IpfsView` | 🟡 MÉDIO — usada nas 2 edições |
| `lib/axios.ts` | 🟡 MÉDIO — base URL e endpoints |

## 13.2 Componentes Exclusivos (sem risco cruzado)

| Componente | Exclusivo de |
|---|---|
| `NodeDashboardPage` | Node |
| `edition.node.ts` | Node |
| `CockpitDashboardPage` | Cockpit |
| `edition.cockpit.ts` | Cockpit |
| `WalletsLandingView` (rota) | Cockpit |
| `LedgerView` (rota) | Cockpit |
| `CessaoPosseView` (rota) | Cockpit |
| `RealEstateView` (funcional) | Cockpit |

## 13.3 Regras de Compatibilidade

1. **Nunca remover comandos Rust comuns** do `app_invoke_handler!()` — afeta ambas as edições
2. **Preservar o bloco `if is_cockpit`** em `lib.rs` — garante isolamento do banco imobiliário
3. **`DEVOS_NAV_DATA` é compartilhado** — adicionar item afeta ambas as edições
4. **`paths.ts` é compartilhado** — alterar um path afeta todos os links

## 13.4 Plano de Isolamento para o Holder Beta

| Alteração | Risco para Cockpit | Estratégia |
|---|---|---|
| Remover rotas imobiliárias do Node | ✅ ZERO | Cockpit mantém as mesmas |
| Adicionar wallets/ledger ao Node | ✅ ZERO | Cockpit já as tem |
| Corrigir `DEVOS_NAV_DATA` | 🟡 BAIXO | Testar Cockpit após |
| Implementar JWT no fluxo auth | 🟡 MÉDIO | Testar ambas as edições |
| Criar view de identidade Holder | ✅ ZERO | Nova view, sem afeto ao Cockpit |
| Criar wizard de Wallet Genesis | ✅ ZERO | Pode ser restrito ao Node |

---

---

# 14. CHECKLIST DE ESTADO ATUAL

**Legenda:** ✅ Implementado | 🟡 Parcial | ❌ Ausente | ⚠️ Quebrado

## Infraestrutura Base

| Item | Status |
|---|---|
| Binário Tauri compilado | ✅ |
| SQLite vault funcionando | ✅ |
| Separação Node/Cockpit | ✅ |
| Bootstrap / Splash screen | ✅ |
| Sistema de temas MUI | ✅ |
| Layout principal (DevOSLayout) | ✅ |

## Autenticação e Vault

| Item | Status |
|---|---|
| Inicialização da senha mestre | ✅ |
| Desbloqueio do vault | ✅ |
| Bloqueio do vault | ✅ |
| Backup/Restore criptografado | ✅ |
| JWT da API ASPPIBRA | ❌ |
| Validação de role (HOLDER/FOUNDER) | ❌ |
| Proteção de rotas por perfil | ❌ |
| Reset de senha (desktop) | ⚠️ |

## Identidade e Credencial Holder

| Item | Status |
|---|---|
| HostIntegrityCard (hardware) | 🟡 |
| View de identidade (página) | ❌ |
| Certificado digital (.dvcert) | ❌ |
| Credencial Holder | ❌ |
| Registro na infraestrutura ASPPIBRA | ❌ |

## Wallet Genesis

| Item | Status |
|---|---|
| Geração BIP-39 (Rust) | ✅ |
| Derivação BIP-44 (Rust) | ✅ |
| Endereços EVM (Rust) | ✅ |
| Criptografia AES-256-GCM (Rust) | ✅ |
| UI wizard de criação | ❌ |
| Fluxo de verificação do mnemônico | ❌ |
| Rota de wallets no Node | ❌ |

## Dashboard do Nó

| Item | Status |
|---|---|
| NodeDashboardPage | ✅ |
| Status real do vault | ✅ |
| Status real do IPFS | 🟡 |
| Status real do dispositivo | ✅ |
| Stake Operacional (dado real) | ❌ |
| Recompensa de Época (dado real) | ❌ |

## IPFS e DePIN

| Item | Status |
|---|---|
| Módulo IPFS Rust completo | ✅ |
| UI de IPFS completa | ✅ |
| IpfsView registrada no Node | ✅ |
| Kubo instalado | ❌ |
| Upload/Download funcionando | ❌ |

## Ledger e Tesouraria

| Item | Status |
|---|---|
| LedgerView implementada | ✅ |
| CitizenLedgerView implementada | ✅ |
| Rota de ledger no Node | ❌ |
| JWT para chamadas à API | ❌ |
| Dados reais de tesouraria | ❌ |

## Governança e Fundos

| Item | Status |
|---|---|
| View de governança | ❌ |
| Rota de governança | ❌ |
| Sistema de votação | ❌ |

## Documentos e Relatórios

| Item | Status |
|---|---|
| Typst integrado ao Rust | ✅ |
| Geração de PDF | ✅ |
| View completa de documentos | ❌ |
| Rota de documentos | ❌ |

## Rotas Node Edition

| Rota | Status |
|---|---|
| Dashboard (/) | ✅ |
| IPFS (/devos/ipfs) | 🟡 |
| Infrastructure (/devos/infrastructure) | 🟡 |
| Wallets (/devos/wallets) | ❌ |
| Ledger (/devos/ledger) | ❌ |
| /devos/cadastre | ⚠️ QUEBRADA |
| /devos/database | ⚠️ QUEBRADA |
| /real-estate | ⚠️ QUEBRADA |

## Pontuação Geral

| Categoria | ✅ | 🟡 | ❌ | ⚠️ |
|---|---|---|---|---|
| Infraestrutura base | 6 | 0 | 0 | 0 |
| Auth / Vault | 5 | 0 | 4 | 1 |
| Identidade / Credencial | 0 | 1 | 4 | 0 |
| Wallet Genesis | 4 | 0 | 3 | 0 |
| Node Dashboard | 3 | 1 | 2 | 0 |
| IPFS / DePIN | 3 | 0 | 2 | 0 |
| Ledger / Tesouraria | 2 | 0 | 3 | 0 |
| Governança / Fundos | 0 | 0 | 3 | 0 |
| Documentos / Relatórios | 3 | 0 | 2 | 0 |
| Rotas Node | 1 | 2 | 3 | 3 |
| **TOTAL** | **27** | **4** | **26** | **4** |

> **~43% dos itens avaliados estão implementados, ~40% ausentes, ~6% parciais, ~6% quebrados.**

---

---

# 15. ROTEIRO MÍNIMO DE IMPLEMENTAÇÃO

> [!IMPORTANT]
> **PRINCÍPIO FUNDAMENTAL**
> Nenhuma etapa inicia sem autorização explícita. Cada etapa só começa após a anterior ser aprovada e testada. Nenhuma etapa modifica o Cockpit sem verificação explícita.

## ETAPA 0 — CORREÇÕES CRÍTICAS (bugs ativos)
**Prioridade:** 🔴 IMEDIATA | **Risco para Cockpit:** ✅ ZERO

| # | Ação | Arquivo |
|---|---|---|
| 0.1 | Remover 3 rotas imobiliárias do Node | `src/app/editions/edition.node.ts` |
| 0.2 | Corrigir `DEVOS_NAV_DATA` para filtrar por edição ativa | `src/app/layouts/devos/layout.tsx` |
| 0.3 | Remover texto "mock-node-alpha" do sidebar | `src/app/layouts/devos/layout.tsx` |
| 0.4 | Remover footer "In-Memory Mocks Active" | `src/app/layouts/devos/layout.tsx` |

## ETAPA 1 — ROTAS ESSENCIAIS DO HOLDER NO NODE
**Prioridade:** 🔴 ALTA | **Risco para Cockpit:** ✅ ZERO

| # | Ação | Arquivo |
|---|---|---|
| 1.1 | Adicionar rota `/devos/wallets` → `WalletsLandingView` ao Node | `edition.node.ts` |
| 1.2 | Adicionar rota `/devos/ledger` → `LedgerView` ao Node | `edition.node.ts` |
| 1.3 | Ajustar `DEVOS_NAV_DATA` para o Node | `layout.tsx` |

## ETAPA 2 — WIZARD DE WALLET GENESIS
**Prioridade:** 🔴 ALTA | **Risco para Cockpit:** ✅ ZERO

| # | Ação |
|---|---|
| 2.1 | Criar `WalletSetupWizardView` |
| 2.2 | Step 1: Geração do mnemônico (`generate_seed_and_preview`) |
| 2.3 | Step 2: Exibição e confirmação do mnemônico |
| 2.4 | Step 3: Salvamento (`confirm_and_save_wallets`) |
| 2.5 | Registrar rota `/devos/wallet-setup` no Node |
| 2.6 | Link para wizard no NodeDashboardPage (vault vazio) |

## ETAPA 3 — INTEGRAÇÃO DE JWT DA API
**Prioridade:** 🔴 ALTA | **Risco para Cockpit:** 🟡 MÉDIO (testar)

| # | Ação |
|---|---|
| 3.1 | Após `VaultBridge.unlock()`, chamar endpoint de autenticação institucional |
| 3.2 | Receber JWT e armazenar em memória |
| 3.3 | Configurar axios para incluir `Authorization: Bearer <JWT>` |
| 3.4 | Verificar que `useGetTreasuryAnalytics` e `useGetCitizenLedger` funcionam |

## ETAPA 4 — MÓDULO DE IDENTIDADE DO HOLDER
**Prioridade:** 🔴 ALTA | **Risco para Cockpit:** ✅ ZERO

| # | Ação |
|---|---|
| 4.1 | Criar `HolderIdentityView` |
| 4.2 | Exibir dados do JWT (nome, ID, role) |
| 4.3 | Exibir status da credencial Holder |
| 4.4 | Exibir endereço da carteira vinculada |
| 4.5 | Registrar rota `/devos/identity` no Node |

## ETAPA 5 — NODE DASHBOARD COM DADOS REAIS
**Prioridade:** 🟡 MÉDIA | **Risco para Cockpit:** ✅ ZERO

| # | Ação |
|---|---|
| 5.1 | Substituir stake hardcoded por dado real (API ou RPC) |
| 5.2 | Substituir recompensa hardcoded por dado real |
| 5.3 | Adicionar indicador de credencial Holder no dashboard |

## ETAPA 6 — KUBO E IPFS FUNCIONAL
**Prioridade:** 🟡 MÉDIA

| # | Ação |
|---|---|
| 6.1 | Instalar Kubo no sistema |
| 6.2 | Inicializar repositório IPFS |
| 6.3 | Testar `IpfsView` com daemon real |
| 6.4 | Verificar prova de armazenamento DePIN |

## ETAPA 7 — DEVOS WORKSPACE NA ÁREA DE TRABALHO
**Prioridade:** 🟡 MÉDIA | **Risco para Cockpit:** ✅ ZERO

| # | Ação |
|---|---|
| 7.1 | Criar estrutura de pastas `DevOS/` na Área de Trabalho |
| 7.2 | Criar atalho para o executável Node |
| 7.3 | Criar LEIA-ME.md e ESTRUTURA.md |

## Dependências entre Etapas

```
Etapa 0 → vem primeiro (sem dependências)
Etapa 1 → depende de Etapa 0
Etapa 2 → independente, pode ser paralela com Etapa 1
Etapa 3 → pré-requisito para Etapas 4 e 5
Etapa 4 → depende de Etapa 3
Etapa 5 → depende de Etapa 3
Etapa 6 → independente
Etapa 7 → pode ser feita a qualquer momento
```

## Critério de Entrega da Beta 1.0

- [x] Etapa 0 — Bugs corrigidos
- [x] Etapa 1 — Rotas de wallets e ledger no Node
- [x] Etapa 2 — Wizard de Wallet Genesis funcional
- [x] Etapa 3 — JWT da API integrado
- [x] Etapa 4 — Identidade Holder visível
- [ ] Etapa 5 — Dados reais no dashboard (opcional para Beta)
- [ ] Etapa 6 — IPFS funcional (opcional para Beta)
- [ ] Etapa 7 — Workspace na Área de Trabalho (opcional para Beta)

---

---

*Documento unificado gerado por **ORDEM 6 — Auditoria Forense do Estado Atual***  
*Branch: `main` | HEAD: `6831a40ca4c27e2c2cb9bcc754d8e7fc130cb07a`*  
*Natureza: exclusivamente read-only — ZERO modificações no código-fonte*  
*ASPPIBRA-DAO DevOS Desktop — 05/11/2026*

