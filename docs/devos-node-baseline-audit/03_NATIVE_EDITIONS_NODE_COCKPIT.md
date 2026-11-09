# EDIÇÕES NATIVAS: NODE vs COCKPIT
## Mapeamento Arquitetural Comparativo

**Data:** 05/11/2026  
**Auditoria:** ORDEM 6 — Read-only

---

## 1. CONCEITO DE EDIÇÃO

O DevOS Desktop utiliza o conceito de **edição** para produzir dois binários distintos a partir do mesmo codebase. A separação ocorre em três camadas:

```
┌─────────────────────────────────────────────────────────┐
│                   CODEBASE COMPARTILHADO                │
│              (src/ + src-tauri/src/)                    │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
    ┌──────────▼──────────┐  ┌────────▼────────────┐
    │   edition.node.ts   │  │ edition.cockpit.ts   │
    │  (alias @edition)   │  │  (alias @edition)    │
    └──────────┬──────────┘  └────────┬────────────┘
               │                      │
    ┌──────────▼──────────┐  ┌────────▼────────────┐
    │  DevOS Node Binary  │  │ DevOS Cockpit Binary │
    │ br.aspp.devos.node  │  │br.aspp.devos.cockpit │
    └─────────────────────┘  └─────────────────────┘
```

### Mecanismo de Separação

**1. Alias Vite (`vite.config.ts`):**
```typescript
// Durante o build:
// --mode node   → @edition aponta para edition.node.ts
// --mode cockpit → @edition aponta para edition.cockpit.ts
resolve: {
  alias: {
    '@edition': path.resolve(__dirname, `src/app/editions/edition.${mode}.ts`)
  }
}
```

**2. Configuração Tauri runtime (`lib.rs`):**
```rust
const COCKPIT_IDENTIFIER: &str = "br.aspp.devos.cockpit";
let is_cockpit = context.config().identifier == COCKPIT_IDENTIFIER;
```

**3. Capabilidades Tauri:**
- Node: `capabilities: ["desktop-vault"]`
- Cockpit: `capabilities: ["desktop-vault", "cockpit-real-estate"]`

---

## 2. COMPARATIVO DE EDIÇÕES

### 2.1 Identidade e Metadados

| Propriedade | DevOS Node | DevOS Cockpit |
|---|---|---|
| `editionId` | `'node'` | `'cockpit'` |
| `name` | `'DevOS Node'` | `'DevOS Admin'` |
| `subtitle` | `'Operador de Nós & Armazenamento DePIN'` | `'Administração Institucional & Fundadores'` |
| `bundleId` | `'br.aspp.devos.node'` | `'br.aspp.devos.cockpit'` |
| Arquivo de config | `edition.node.ts` | `edition.cockpit.ts` |

### 2.2 Rotas Registradas

**DevOS Node — `edition.node.ts` (6 rotas):**

| # | Path | Label | Componente | Status |
|---|---|---|---|---|
| 1 | `/` | Painel do Nó | `NodeDashboardPage` | ✅ Funcional (parcialmente mock) |
| 2 | `/devos/ipfs` | Armazenamento IPFS | `IpfsView` | 🟡 UI pronta, daemon offline |
| 3 | `/devos/cadastre` | Banco Imobiliário | `RealEstateView` | ❌ **QUEBRADO** — DB não inicializado |
| 4 | `/devos/database` | Banco Imobiliário (Explorer) | `RealEstateView` | ❌ **QUEBRADO** — DB não inicializado |
| 5 | `/real-estate` | Cadastro Imobiliário (Legado) | `RealEstateView` | ❌ **QUEBRADO** — DB não inicializado |
| 6 | `/devos/infrastructure` | Infraestrutura | `InfrastructurePage` | 🟡 Verificar |

**DevOS Cockpit — `edition.cockpit.ts` (11 rotas):**

| # | Path | Label | Componente | Status |
|---|---|---|---|---|
| 1 | `/` | Visão Geral | `CockpitDashboardPage` | 🟡 Funcional — dados 100% hardcoded |
| 2 | `/devos/wallets` | Carteiras & Banco Digital | `WalletsLandingView` | 🟡 Hub de cards (sub-módulos inexistentes) |
| 3 | `/banking` | Banco Digital (Hub) | `WalletsLandingView` | 🟡 Alias de `/devos/wallets` |
| 4 | `/devos/ipfs` | Armazenamento IPFS | `IpfsView` | 🟡 UI pronta, daemon offline |
| 5 | `/devos/cadastre` | Banco Imobiliário | `RealEstateView` | ✅ DB inicializado no Cockpit |
| 6 | `/devos/cessao-posse` | Cessão de Posse (Contrato) | `CessaoPosseView` | 🟡 Verificar |
| 7 | `/devos/database` | Banco Imobiliário (Explorer) | `RealEstateView` | ✅ Alias do banco imobiliário |
| 8 | `/devos/ledger` | Livro-Razão | `LedgerView` | ⚠️ API remota — sem JWT no desktop |
| 9 | `/devos/dao` | Tesouraria & Livro-Razão | `LedgerView` | ⚠️ Alias de `/devos/ledger` |
| 10 | `/real-estate` | Cadastro Imobiliário (Legado) | `RealEstateView` | ✅ Legado OK |
| 11 | `/devos/infrastructure` | Infraestrutura | `InfrastructurePage` | 🟡 |

### 2.3 Comandos Rust por Edição

**Comandos comuns (ambas as edições — via macro `app_invoke_handler!`):**

```
Sistema (1):
  get_device_status

Vault (8):
  get_vault_status          init_master_password       unlock_vault
  lock_vault                export_authorized_secret   export_vault_backup
  restore_vault_backup      (+ fetch_wallet_balance via wallet group)

Wallets (7+):
  generate_seed_and_preview    reveal_pending_mnemonic   cancel_pending_creation
  confirm_and_save_wallets     list_stored_wallets        export_authorized_secret
  fetch_wallet_balance         batch_fetch_wallet_balances

Documentos (3):
  generate_document    preview_document    export_previewed_document

IPFS (13):
  get_ipfs_daemon_status    execute_storage_proof    ipfs_upload_file
  ipfs_download_file        ipfs_pin_cid             ipfs_unpin_cid
  ipfs_verify_cid_custody   ipfs_verify_all_pins     ipfs_query_providers
  ipfs_list_managed_pins    ipfs_start_daemon        ipfs_stop_daemon
  ipfs_restart_daemon
```

**Comandos exclusivos do Cockpit (+7):**

```
Real Estate (7):
  get_real_estate_stats        preview_real_estate_import    execute_real_estate_import
  list_import_batches          list_audit_findings           list_properties
  select_spreadsheet_file
```

### 2.4 Inicialização do Backend (lib.rs)

**Fluxo de inicialização — AMBAS as edições:**
1. Detecta `is_cockpit` via `config().identifier`
2. Configura `DocumentScope` com base no identificador
3. Registra plugin de log (apenas debug builds)
4. Resolve `app_data_dir`
5. Inicializa `devos_vault.sqlite` via `LocalDatabase::new(vault_dir)`
6. Roda migrações do vault via `MigrationManager::run_migrations`
7. Registra `LocalDatabase` no estado Tauri
8. Registra `VaultSession::new()` no estado Tauri

**Fluxo adicional — APENAS Cockpit:**
9. Inicializa `real_estate.sqlite` via `RealEstateDatabase::new(real_estate_dir)`
10. Roda migrações imobiliárias via `RealEstateMigrationManager::run_migrations`
11. Registra `RealEstateDatabase` no estado Tauri

### 2.5 Bancos de Dados por Edição

| Banco | Node | Cockpit | Path base (Linux) |
|---|---|---|---|
| `devos_vault.sqlite` | ✅ Inicializado | ✅ Inicializado | `~/.local/share/<bundleId>/devos_vault/` |
| `real_estate.sqlite` | ❌ NÃO inicializado | ✅ Inicializado | `~/.local/share/<bundleId>/real_estate/` |

### 2.6 Capabilidades Tauri por Edição

| Capability | Node | Cockpit |
|---|---|---|
| `desktop-vault` | ✅ | ✅ |
| `cockpit-real-estate` | ❌ | ✅ |

---

## 3. DASHBOARD POR EDIÇÃO

### 3.1 NodeDashboardPage

**Arquivo:** `src/app/editions/node/node-dashboard-page.tsx`  
**Dashboard de:** Edição Node (destinado a Holders na Beta)

**Dados reais (via bridges Tauri):**
- `SystemBridge.getDeviceStatus()` → enrollment e status do hardware
- `WalletBridge.getVaultStatus()` → status do cofre (is_initialized, is_unlocked, contagens)
- `IpfsBridge.getDaemonStatus()` → status do daemon Kubo

**Dados hardcoded (mock):**
- `Stake Operacional: 50.000 ASPPBR` → `formatAsppbr(50000)` — valor fixo
- `Recompensa de Época: 1.450 ASPPBR` → `formatAsppbr(1450)` — valor fixo

**Componentes utilizados:**
- `VaultStatusMetric` (do módulo wallets)
- `IpfsDaemonMetric` (do módulo ipfs)
- `HostIntegrityCard` (do módulo identity)
- `StorageProofCard` (do módulo ipfs)
- `MetricBox`, `StatusBadge`, `Card` (shared components)

**Fallback web (modo browser sem Tauri):**
- Exibe dados simulados estáticos (enrolled: false, vault mock, ipfs mock)

### 3.2 CockpitDashboardPage

**Arquivo:** `src/app/editions/cockpit/cockpit-dashboard-page.tsx`  
**Dashboard de:** Edição Cockpit (destinado a Founders na Beta)

**Dados:** 100% HARDCODED — sem nenhum bridge, hook ou API call
- `"128 Nós"` — string literal
- `"512 TB"` — string literal
- `"99.98%"` — string literal
- `"6.400.000 ASPPBR"` — string literal

**Componentes utilizados:**
- `MetricBox` (shared)
- `StatusBadge` (shared)
- `Iconify` (shared)
- 2 cards de acesso rápido: Banco Imobiliário e IPFS

**Funcionalidade real:** Apenas navegação (`useNavigate`) para `/devos/cadastre` e `/devos/ipfs`

---

## 4. ROTAS EXCLUSIVAS POR EDIÇÃO

### Rotas que existem APENAS no Node (não no Cockpit):
- Nenhuma rota exclusiva do Node. Todas as rotas do Node também existem no Cockpit.

### Rotas que existem APENAS no Cockpit (ausentes no Node):

| Path | Componente | Impacto para Holder |
|---|---|---|
| `/devos/wallets` | `WalletsLandingView` | 🔴 **CRÍTICO** — Holder precisa de carteiras |
| `/banking` | `WalletsLandingView` | 🔴 **CRÍTICO** — alias de wallets |
| `/devos/cessao-posse` | `CessaoPosseView` | 🟡 Necessário para contratos |
| `/devos/ledger` | `LedgerView` | 🔴 **CRÍTICO** — Holder precisa ver extrato |
| `/devos/dao` | `LedgerView` | 🟡 Alias de ledger |

**Conclusão:** A edição Node **não tem rotas para as funcionalidades mais importantes** de um Holder (carteiras, extrato/ledger).

---

## 5. INCOMPATIBILIDADES DETECTADAS

### 5.1 Rotas Imobiliárias no Node — ERRO CRÍTICO

O `edition.node.ts` registra rotas para `RealEstateView`, mas o banco `real_estate.sqlite` **não é inicializado** no Node:

```rust
// lib.rs — apenas no Cockpit:
if is_cockpit {
    let real_estate_db = storage::RealEstateDatabase::new(real_estate_dir);
    // ...
    app.manage(real_estate_db);  // ← NÃO existe no Node
}
```

```typescript
// edition.node.ts — rotas problemáticas:
{ path: paths.devos.cadastre, component: RealEstateView }   // ← QUEBRADO
{ path: paths.devos.database, component: RealEstateView }   // ← QUEBRADO
{ path: '/real-estate', component: RealEstateView }          // ← QUEBRADO
```

Quando o usuário acessar qualquer uma dessas rotas no Node, o `RealEstateBridge` tentará invocar um comando Rust que depende de `State<'_, RealEstateDatabase>`, mas esse estado **não foi registrado**. O Tauri retornará erro de estado não encontrado.

### 5.2 DevOS Nav Data — Itens de Menu Sem Rota

O sidebar `DEVOS_NAV_DATA` em `layout.tsx` lista itens para rotas que não existem em **nenhuma edição**:

```typescript
// layout.tsx — itens sem rota registrada:
{ title: 'Hub Analítico', path: paths.devos.analytics }      // ← Sem rota
{ title: 'Blog', path: paths.devos.blog }                    // ← Sem rota
{ title: 'Notificações', path: paths.devos.notifications.root } // ← Sem rota
{ title: 'Security', path: paths.devos.security }            // ← Sem rota
{ title: 'Audit', path: paths.devos.audit }                  // ← Sem rota
{ title: 'APIs', path: paths.devos.apis }                    // ← Sem rota
{ title: 'Faturas', path: paths.devos.invoices }             // ← Sem rota
```

Esses itens aparecerão no menu mas levarão ao `NotFoundView` quando clicados.

---

## 6. LEGENDA DE STATUS

| Símbolo | Significado |
|---|---|
| ✅ | Implementado e funcional |
| 🟡 | Implementado parcialmente ou requer verificação adicional |
| ⚠️ | Implementado com dependência externa não satisfeita |
| ❌ | Quebrado ou não implementado |

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*  
*Branch: `main` | HEAD: `6831a40`*

