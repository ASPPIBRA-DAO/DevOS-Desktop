# GRAFO DE DEPENDÊNCIAS
## Mapeamento de Dependências entre Camadas

**Data:** 05/11/2026  
**Auditoria:** ORDEM 6 — Read-only

---

## 1. DIAGRAMA DE CAMADAS

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAMADA DE UI                             │
│                     Pages / Views / Components                  │
├─────────────────────────────────────────────────────────────────┤
│                     CAMADA DE APLICAÇÃO                         │
│               Hooks / Facades / Services / SWR                  │
├─────────────────────────────────────────────────────────────────┤
│                    CAMADA DE PLATAFORMA                         │
│              Bridges IPC (TypeScript → Tauri)                   │
├─────────────────────────────────────────────────────────────────┤
│                    CAMADA NATIVA (RUST)                         │
│          Commands → Modules → Storage / Platform                │
├─────────────────────────────────────────────────────────────────┤
│                    INFRAESTRUTURA EXTERNA                       │
│    SQLite (local) | IPFS/Kubo (local) | API ASPPIBRA (remota)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. CADEIAS DE DEPENDÊNCIA POR FUNCIONALIDADE

### 2.1 Cadeia: Bootstrap / Inicialização

```
AppBootstrapProvider
  └── isTauriDesktop()
  └── VaultBridge.getVaultStatus()
      └── Tauri IPC: get_vault_status
          └── commands/vault_commands.rs
              └── State<LocalDatabase>
                  └── storage/local_database.rs
                      └── devos_vault.sqlite (~/.local/share/<bundleId>/devos_vault/)
```

**Estados possíveis:**
- Falha no DB → `FATAL_ERROR`
- `is_initialized: false` → `UNINITIALIZED`
- `is_initialized: true, is_unlocked: false` → `READY_LOCKED`
- `is_initialized: true, is_unlocked: true` → `READY_UNLOCKED`
- `isTauriDesktop() === false` → `WEB_PREVIEW`

---

### 2.2 Cadeia: Login / Desbloqueio do Vault

```
JwtSignInView
  └── signInWithPassword({ password })
      └── [Se desktop]: VaultBridge.unlock(password)
          └── Tauri IPC: unlock_vault
              └── commands/vault_commands.rs
                  └── modules/vault/access_control.rs
                      └── State<LocalDatabase>
                          └── devos_vault.sqlite
      └── [Se web]: retorna true (sem verificação real)
  └── bootstrap.unlock(password)
      └── setState('READY_UNLOCKED')
```

**Gap crítico:** Após o unlock, **nenhum JWT é obtido** da API ASPPIBRA.

---

### 2.3 Cadeia: Node Dashboard (NodeDashboardPage)

```
NodeDashboardPage
  ├── SystemBridge.getDeviceStatus()
  │   └── Tauri IPC: get_device_status
  │       └── commands/system_commands.rs
  │           └── Retorna: { enrolled: bool, status: string }
  │
  ├── WalletBridge.getVaultStatus()
  │   └── Tauri IPC: get_vault_status
  │       └── State<LocalDatabase, VaultSession>
  │           └── devos_vault.sqlite
  │
  └── IpfsBridge.getDaemonStatus()
      └── Tauri IPC: get_ipfs_daemon_status
          └── modules/ipfs/daemon.rs
              └── Verifica: ~/.local/share/devos/ipfs/ (repo Kubo)
              └── [Kubo offline → retorna: running: false]
```

**Métricas hardcoded (sem cadeia de dependência real):**
```
formatAsppbr(50000) → "50.000 ASPPBR" (Stake Operacional)
formatAsppbr(1450)  → "1.450 ASPPBR" (Recompensa de Época)
```

---

### 2.4 Cadeia: Wallet Genesis (criação de carteira)

```
[UI wizard — NÃO EXISTE, apenas hub de cards]
  └── WalletBridge.generateSeedAndPreview()
      └── Tauri IPC: generate_seed_and_preview
          └── commands/wallet_commands.rs
              └── modules/wallets/mnemonic.rs (BIP-39 entropy)
              └── modules/wallets/creation_session.rs
              └── [Armazena sessão temporária na memória]
  └── [Usuário verifica mnemônico]
  └── WalletBridge.confirmAndSaveWallets(sessionId, password)
      └── Tauri IPC: confirm_and_save_wallets
          └── modules/wallets/derivation.rs (BIP-44 paths)
          └── modules/wallets/address.rs (endereços EVM)
          └── modules/vault/encryption.rs (AES-256-GCM)
          └── State<LocalDatabase>
              └── devos_vault.sqlite (armazena wallet criptografada)
```

---

### 2.5 Cadeia: IPFS (upload de arquivo)

```
IpfsView → IpfsUploadPanel
  └── IpfsBridge.uploadFile(filePath)
      └── Tauri IPC: ipfs_upload_file
          └── commands/ipfs_commands.rs
              └── modules/ipfs/content.rs
                  └── modules/ipfs/client.rs (HTTP client para Kubo)
                      └── Kubo daemon HTTP API (localhost:5001)
                          └── [KUBO NÃO INSTALADO → ERRO]
```

---

### 2.6 Cadeia: Ledger / Tesouraria (LedgerView)

```
LedgerView
  └── DoubleEntryChartCard
      └── useGetTreasuryAnalytics(year?)
          └── SWR: fetcher(url)
              └── axios.get('https://api.asppibra.com/api/treasury/analytics')
                  └── [Requer Authorization: Bearer <JWT>]
                      └── [JWT NUNCA OBTIDO NO DESKTOP → 401]

LedgerView → CitizenLedgerView
  └── AssociateSearchCard
  └── useGetCitizens()
      └── axios.get('https://api.asppibra.com/api/identity/citizens')
          └── [Mesmo problema: sem JWT]
  └── useGetCitizenLedger(citizenId)
      └── axios.get(`https://api.asppibra.com/api/treasury/citizen/${id}/ledger`)
          └── [Mesmo problema: sem JWT]
```

---

### 2.7 Cadeia: Cadastro Imobiliário (Cockpit only)

```
RealEstateView (Cockpit)
  └── RealEstateImporterCard
      └── RealEstateBridge.selectSpreadsheetFile()
          └── Tauri IPC: select_spreadsheet_file
              └── commands/real_estate_commands.rs
                  └── Diálogo nativo de seleção de arquivo
  └── RealEstateBridge.previewRealEstateImport(filePath)
      └── Tauri IPC: preview_real_estate_import
          └── modules/real_estate/importer.rs
              └── State<RealEstateDatabase>
                  └── real_estate.sqlite

NOTA: RealEstateDatabase só existe no estado Tauri da edição Cockpit.
      No Node, qualquer bridge de real estate → Tauri panic/error.
```

---

### 2.8 Cadeia: Geração de Documentos (Typst → PDF)

```
ReconciliationReportButton (ou DocumentBridge chamado de qualquer módulo)
  └── DocumentBridge.generateDocument(payload)
      └── Tauri IPC: generate_document
          └── commands/document_commands.rs
              └── modules/documents/service.rs
                  └── modules/documents/typst_renderer.rs
                      └── platform/typst_engine.rs
                          └── [Typst embutido no binário Rust]
                          └── Gera PDF em memória
              └── modules/documents/preview_store.rs
                  └── [Armazena preview temporário]
```

---

## 3. GRAFO DE DEPENDÊNCIAS POR BRIDGE

### VaultBridge (`platform/tauri/vault/vault-bridge.ts`)

```
Consumers:          → app/bootstrap/app-bootstrap-provider.tsx
                    → modules/authentication/context/jwt.ts
                    → modules/wallets/presentation/ (via hooks)

Rust commands:      get_vault_status
                    init_master_password
                    unlock_vault
                    lock_vault
                    export_authorized_secret
                    export_vault_backup
                    restore_vault_backup

Rust modules:       modules/vault/ (access_control, encryption)
                    storage/local_database.rs
                    storage/migrations.rs

Data stores:        devos_vault.sqlite
```

### WalletBridge (`platform/tauri/wallets/wallet-bridge.ts`)

```
Consumers:          → app/editions/node/node-dashboard-page.tsx (VaultStatusMetric)
                    → modules/wallets/presentation/

Rust commands:      generate_seed_and_preview
                    reveal_pending_mnemonic
                    cancel_pending_creation
                    confirm_and_save_wallets
                    list_stored_wallets
                    fetch_wallet_balance
                    batch_fetch_wallet_balances

Rust modules:       modules/wallets/ (address, creation_session, derivation, mnemonic)
                    modules/vault/ (encryption)
                    storage/local_database.rs

Data stores:        devos_vault.sqlite
External:           Blockchain RPC (fetch_wallet_balance)
```

### IpfsBridge (`platform/tauri/ipfs/ipfs-bridge.ts`)

```
Consumers:          → app/editions/node/node-dashboard-page.tsx
                    → modules/ipfs/presentation/

Rust commands:      get_ipfs_daemon_status
                    execute_storage_proof
                    ipfs_upload_file, ipfs_download_file
                    ipfs_pin_cid, ipfs_unpin_cid
                    ipfs_verify_cid_custody, ipfs_verify_all_pins
                    ipfs_query_providers, ipfs_list_managed_pins
                    ipfs_start_daemon, ipfs_stop_daemon, ipfs_restart_daemon

Rust modules:       modules/ipfs/ (client, content, daemon, integrity, pinning)

External:           Kubo daemon HTTP API (localhost:5001) [NÃO INSTALADO]
                    IPFS Network (providers, peers)
```

### SystemBridge (`platform/tauri/system/system-bridge.ts`)

```
Consumers:          → app/editions/node/node-dashboard-page.tsx

Rust commands:      get_device_status

Rust modules:       commands/system_commands.rs

External:           Hardware/OS info
```

### DocumentBridge (`platform/tauri/documents/document-bridge.ts`)

```
Consumers:          → modules/reports/presentation/

Rust commands:      generate_document
                    preview_document
                    export_previewed_document

Rust modules:       modules/documents/
                    platform/typst_engine.rs
```

### RealEstateBridge (`platform/tauri/real-estate/real-estate-bridge.ts`)

```
Consumers:          → modules/real-estate/presentation/

Rust commands:      get_real_estate_stats [Cockpit only]
                    preview_real_estate_import [Cockpit only]
                    execute_real_estate_import [Cockpit only]
                    list_import_batches [Cockpit only]
                    list_audit_findings [Cockpit only]
                    list_properties [Cockpit only]
                    select_spreadsheet_file [Cockpit only]

Data stores:        real_estate.sqlite [Cockpit only]

ATENÇÃO: Se chamado do Node → Tauri error: state not managed
```

---

## 4. DEPENDÊNCIAS EXTERNAS

| Dependência | Tipo | Estado | Consumidores |
|---|---|---|---|
| `https://api.asppibra.com` | API REST remota | ⚠️ Sem JWT no desktop | LedgerView, CitizenLedgerView, useGetCitizens |
| Kubo IPFS daemon | Local (port 5001) | ❌ Não instalado | IpfsView, NodeDashboardPage (métrica) |
| Blockchain RPC | Externo | 🟡 URL não verificada | WalletBridge.fetchWalletBalance |
| SQLite (devos_vault) | Local | ✅ Funcional | Vault, Wallets |
| SQLite (real_estate) | Local | ✅ Cockpit only | Real Estate |
| Typst engine | Embutido no binário | ✅ Funcional | Documents, Reports |

---

## 5. GRAFO DE IMPACTO PARA O HOLDER BETA

```
IMPACTO ALTO (bloqueia o Holder):
  ├── Ausência de fluxo de Wallet Genesis na UI
  │   └── Usuário não consegue criar carteira sem wizard
  ├── Ausência de JWT após vault unlock
  │   └── LedgerView não carrega dados → experiência quebrada
  ├── Rotas imobiliárias no Node
  │   └── 3 itens do sidebar causam erro → confiança no produto
  └── Ausência de credencial Holder
      └── Sem identidade → sem participação institucional

IMPACTO MÉDIO (reduz funcionalidade):
  ├── Métricas de stake/recompensa hardcoded
  │   └── Usuário vê valores falsos no dashboard
  ├── IPFS daemon offline
  │   └── Upload/download não funciona
  └── CockpitDashboardPage 100% mock
      └── Não afeta Holder (edição separada)

IMPACTO BAIXO (cosmético ou futuro):
  ├── Sidebar com itens inválidos
  ├── Texto "mock-node-alpha" no sidebar
  └── Footer "In-Memory Mocks Active"
```

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*  
*Branch: `main` | HEAD: `6831a40`*

