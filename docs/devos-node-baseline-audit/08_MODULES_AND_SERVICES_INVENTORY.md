# INVENTÁRIO DE MÓDULOS E SERVIÇOS
## Estado Técnico de Todos os Módulos Frontend e Backend

**Data:** 05/11/2026  
**Auditoria:** ORDEM 6 — Read-only

---

## 1. MÓDULOS FRONTEND (src/modules/)

### 1.1 Módulo: Authentication

**Localização:** `src/modules/authentication/`

#### Estrutura
```
authentication/
├── application/
│   ├── facades.ts              → AuthFacade (signIn, signUp, signOut, session)
│   ├── hooks.ts                → useAuthSession, useSignIn, useSignOut
│   └── identity-session.service.ts → Serviço de sessão local
├── context/
│   └── jwt.ts                  → signInWithPassword, signInWithWeb3, signUp
└── presentation/
    ├── components/ (7 arquivos) → Componentes de formulário
    └── views/ (5 views)         → Telas de login, registro, reset, verify
```

#### Status por Funcionalidade

| Funcionalidade | Status | Notas |
|---|---|---|
| Login (unlock vault) | ✅ IMPLEMENTADO | `signInWithPassword` → `VaultBridge.unlock()` |
| Setup vault (signUp) | ✅ IMPLEMENTADO | `signUp` → `VaultBridge.initMasterPassword()` |
| Logout (lock vault) | ✅ IMPLEMENTADO | Via bootstrap `lock()` |
| Reset de senha | ⚠️ INCOMPLETO | UI existe, sem backend real no desktop |
| Verificação de e-mail | ⚠️ INCOMPLETO | UI existe, sem backend real no desktop |
| Auth Web3 | ❌ NÃO IMPLEMENTADO | `signInWithWeb3` lança exceção explícita |
| JWT da API (role: HOLDER) | ❌ NÃO IMPLEMENTADO | Nunca chamado no fluxo desktop |
| Sessão persistente | 🟡 PARCIAL | Vault session persiste entre reloads |

#### Código Crítico

```typescript
// jwt.ts — signInWithPassword no desktop:
if (isTauriDesktop()) {
  const success = await VaultBridge.unlock(password);  // ← Apenas vault local
  // SEM chamada à API para JWT
  return true;
}
```

---

### 1.2 Módulo: Identity

**Localização:** `src/modules/identity/`

#### Estrutura
```
identity/
└── presentation/
    └── components/
        └── host-integrity-card.tsx   → Único componente do módulo
```

#### Status

| Funcionalidade | Status | Notas |
|---|---|---|
| Status do dispositivo host | ✅ IMPLEMENTADO | Via `SystemBridge.getDeviceStatus()` |
| Certificado de identidade (.dvcert) | ❌ NÃO EXISTE | Sem arquivo, sem modelo, sem UI |
| Credencial Holder | ❌ NÃO EXISTE | Conceitual apenas |
| Registro de identidade na API | ❌ NÃO IMPLEMENTADO | Sem código |
| View de identidade (página) | ❌ NÃO EXISTE | Sem rota, sem view |

**Conclusão:** O módulo de identidade é extremamente thin — apenas 1 componente que mostra status do hardware. É o módulo mais crítico a ser desenvolvido para o Holder Beta.

---

### 1.3 Módulo: IPFS

**Localização:** `src/modules/ipfs/`

#### Estrutura
```
ipfs/
└── presentation/
    ├── components/
    │   ├── ipfs-daemon-metric.tsx    → Métrica do daemon no dashboard
    │   ├── ipfs-file-list.tsx        → Lista de arquivos/CIDs
    │   ├── ipfs-node-status.tsx      → Status detalhado do nó
    │   ├── ipfs-pinning-status.tsx   → Status de pins
    │   ├── ipfs-upload-panel.tsx     → Painel de upload
    │   └── storage-proof-card.tsx    → Card de prova de armazenamento DePIN
    └── views/
        └── ipfs-view.tsx             → View principal
```

#### Status

| Funcionalidade | Status | Notas |
|---|---|---|
| UI de gerenciamento IPFS | ✅ IMPLEMENTADO | View completa |
| Status do daemon | ✅ UI pronta | `IpfsBridge.getDaemonStatus()` — retorna erro: daemon offline |
| Upload de arquivo | ✅ UI pronta | Bridge: `ipfs_upload_file` — falha sem daemon |
| Download de arquivo | ✅ UI pronta | Bridge: `ipfs_download_file` — falha sem daemon |
| Pinning/Unpinning | ✅ UI pronta | Bridge: `ipfs_pin_cid`, `ipfs_unpin_cid` — falha sem daemon |
| Prova DePIN | ✅ UI pronta | Bridge: `execute_storage_proof` — falha sem daemon |
| Iniciar daemon | ✅ UI pronta | Bridge: `ipfs_start_daemon` — falha: Kubo não instalado |
| Kubo instalado | ❌ NÃO | Binário `ipfs` ausente no sistema |

**Conclusão:** Módulo mais completo em termos de código. Requer apenas a instalação do Kubo para funcionar.

---

### 1.4 Módulo: Ledger

**Localização:** `src/modules/ledger/`

#### Estrutura
```
ledger/
├── domain/
│   └── ledger-models.ts          → Interfaces de dados (ITreasuryAnalytics, etc.)
└── presentation/
    ├── citizen-ledger/
    │   ├── components/ (3 arquivos)
    │   └── view/CitizenLedgerView.tsx
    ├── components/
    │   └── double-entry-chart-card.tsx
    ├── hooks/
    │   └── treasury-hooks.ts       → useGetTreasuryAnalytics, useGetCitizenLedger, useGetCitizens
    └── LedgerView.tsx
```

#### Status

| Funcionalidade | Status | Notas |
|---|---|---|
| View de Livro-Razão (macro) | ✅ UI implementada | `LedgerView` com tabs macro/citizen |
| View de Ledger por Cidadão | ✅ UI implementada | `CitizenLedgerView` com busca por associado |
| Dados de tesouraria (analytics) | ❌ SEM DADOS | `useGetTreasuryAnalytics` → API remota → sem JWT |
| Dados de ledger por cidadão | ❌ SEM DADOS | `useGetCitizenLedger` → API remota → sem JWT |
| Lista de cidadãos | ❌ SEM DADOS | `useGetCitizens` → API remota → sem JWT |
| Gráfico de partidas dobradas | ✅ UI pronta | Sem dados reais |

**Dependência crítica:** Todo o módulo depende de `https://api.asppibra.com` via JWT que nunca é obtido no fluxo desktop.

---

### 1.5 Módulo: Real Estate

**Localização:** `src/modules/real-estate/`

#### Estrutura
```
real-estate/
└── presentation/
    ├── components/ (4 arquivos)   → Métricas, importador, tabela, seletor territorial
    └── real-estate-view.tsx       → View principal
```

#### Status por Edição

| Funcionalidade | Cockpit | Node |
|---|---|---|
| View de cadastro imobiliário | ✅ FUNCIONAL | ❌ QUEBRADO (DB não inicializado) |
| Importação de planilha | ✅ FUNCIONAL | ❌ N/A |
| Listagem de propriedades | ✅ FUNCIONAL | ❌ N/A |
| Métricas imobiliárias | ✅ FUNCIONAL | ❌ N/A |
| Auditoria de dados | ✅ FUNCIONAL | ❌ N/A |
| Cessão de Posse | ✅ (via CessaoPosseView) | ❌ Sem rota |

---

### 1.6 Módulo: Reports

**Localização:** `src/modules/reports/`

#### Estrutura
```
reports/
└── presentation/
    └── components/
        └── ReconciliationReportButton.tsx → Botão de geração de relatório
```

#### Status

| Funcionalidade | Status | Notas |
|---|---|---|
| Geração de relatório (Typst → PDF) | 🟡 PARCIAL | Backend Rust pronto, UI apenas como botão |
| View de relatórios | ❌ NÃO EXISTE | Sem rota, sem view completa |

---

### 1.7 Módulo: Wallets

**Localização:** `src/modules/wallets/`

#### Estrutura
```
wallets/
└── presentation/
    ├── components/
    │   └── vault-status-metric.tsx      → Métrica de status do cofre
    └── views/
        └── wallets-landing-view.tsx     → Hub de carteiras (cards de módulos)
```

#### Status

| Funcionalidade | Status | Notas |
|---|---|---|
| Hub de carteiras (landing) | ✅ UI implementada | Cards de módulos futuros |
| Fluxo de criação de Wallet Genesis | ⚠️ INCOMPLETO | Backend Rust pronto, UI de wizard não existe |
| Sub-módulos listados (conta, cartões, rede, etc.) | ❌ NÃO EXISTEM | Apenas cards descritivos, arquivos inexistentes |
| Vault Status Metric | ✅ IMPLEMENTADO | Dados reais via WalletBridge |
| Listar carteiras salvas | ✅ IMPLEMENTADO | `WalletBridge.listStoredWallets()` |
| Saldo real de carteiras | ⚠️ PARCIAL | `WalletBridge.fetchWalletBalance()` — depende de RPC |
| Exportar segredo autorizado | ✅ IMPLEMENTADO | `WalletBridge.exportAuthorizedSecret()` |
| Backup/Restore do vault | ✅ IMPLEMENTADO | `WalletBridge.exportVaultBackup()` / `restoreVaultBackup()` |

---

## 2. MÓDULOS RUST (src-tauri/src/modules/)

### 2.1 Módulo: Vault

**Localização:** `src-tauri/src/modules/vault/`

```
vault/
├── access_control.rs   → Lógica de autenticação e controle de acesso
├── encryption.rs        → Criptografia AES-256-GCM
└── mod.rs               → VaultSession struct, re-exportações
```

| Funcionalidade | Status |
|---|---|
| `VaultSession` (estado da sessão) | ✅ IMPLEMENTADO |
| Inicialização da senha mestre | ✅ IMPLEMENTADO |
| Desbloqueio/Bloqueio do vault | ✅ IMPLEMENTADO |
| Criptografia AES-256-GCM | ✅ IMPLEMENTADO |
| Export de segredo autorizado | ✅ IMPLEMENTADO |
| Backup/Restore criptografado | ✅ IMPLEMENTADO |

---

### 2.2 Módulo: Wallets (Rust)

**Localização:** `src-tauri/src/modules/wallets/`

```
wallets/
├── address.rs          → Derivação de endereços EVM
├── creation_session.rs → Sessão temporária de criação
├── derivation.rs       → BIP-44 derivation paths
├── mnemonic.rs         → Geração BIP-39 (entropy → mnemônico → seed)
└── mod.rs
```

| Funcionalidade | Status |
|---|---|
| Geração de mnemônico BIP-39 | ✅ IMPLEMENTADO |
| Derivação de seed BIP-44 | ✅ IMPLEMENTADO |
| Derivação de endereços EVM | ✅ IMPLEMENTADO |
| Sessão de criação temporária | ✅ IMPLEMENTADO |
| Salvar wallets no vault | ✅ IMPLEMENTADO |
| Listar wallets salvas | ✅ IMPLEMENTADO |
| Fetch de saldo (via RPC) | ✅ IMPLEMENTADO |

**Conclusão:** A criptografia de carteiras está completamente implementada no Rust. Falta a UI de wizard para guiar o usuário.

---

### 2.3 Módulo: IPFS (Rust)

**Localização:** `src-tauri/src/modules/ipfs/`

```
ipfs/
├── client.rs      → HTTP client para Kubo API local
├── content.rs     → Gestão de conteúdo CID
├── daemon.rs      → Inicialização e controle do daemon Kubo
├── integrity.rs   → Verificação de integridade de pins
├── models.rs      → Tipos (IpfsDaemonStatus, etc.)
├── mod.rs
└── pinning.rs     → Operações de pinning/unpinning
```

| Funcionalidade | Status |
|---|---|
| Controle do daemon Kubo | ✅ IMPLEMENTADO | Kubo não instalado |
| Upload de arquivo | ✅ IMPLEMENTADO | Kubo não instalado |
| Download de arquivo | ✅ IMPLEMENTADO | Kubo não instalado |
| Pinning/Unpinning | ✅ IMPLEMENTADO | Kubo não instalado |
| Prova de armazenamento DePIN | ✅ IMPLEMENTADO | Kubo não instalado |
| Verificação de integridade | ✅ IMPLEMENTADO | Kubo não instalado |

**Repo IPFS esperado:** `~/.local/share/devos/ipfs/` (via Kubo)

---

### 2.4 Módulo: Documents (Rust)

**Localização:** `src-tauri/src/modules/documents/`

```
documents/
├── models.rs           → Tipos de documentos
├── mod.rs
├── ports.rs            → Portas (interfaces)
├── preview_store.rs    → Armazenamento temporário de preview
├── service.rs          → Serviço de geração de documentos
└── typst_renderer.rs   → Renderizador Typst → PDF
```

| Funcionalidade | Status |
|---|---|
| Renderização Typst → PDF | ✅ IMPLEMENTADO |
| Preview de documento | ✅ IMPLEMENTADO |
| Export de documento | ✅ IMPLEMENTADO |
| Escopo de documento por edição | ✅ IMPLEMENTADO (`DocumentScope::from_app_identifier`) |

**Escopo por edição:**
- Node → Documentos do nó (relatórios de operação)
- Cockpit → Documentos administrativos + Real Estate

---

### 2.5 Módulo: Real Estate (Rust)

**Localização:** `src-tauri/src/modules/real_estate/`

```
real_estate/
├── importer.rs         → Importação de planilhas
├── mod.rs
└── normalization.rs    → Normalização de dados imobiliários
```

| Funcionalidade | Edição | Status |
|---|---|---|
| Importação de planilha | Cockpit | ✅ IMPLEMENTADO |
| Normalização de dados | Cockpit | ✅ IMPLEMENTADO |
| Listagem de propriedades | Cockpit | ✅ IMPLEMENTADO |
| Auditoria de lotes | Cockpit | ✅ IMPLEMENTADO |

---

### 2.6 Módulo: Monitoring (Rust)

**Localização:** `src-tauri/src/modules/monitoring/`

```
monitoring/
├── mod.rs
└── rpc_client.rs   → Cliente RPC para monitoramento blockchain
```

| Funcionalidade | Status |
|---|---|
| Cliente RPC | ✅ IMPLEMENTADO | Dependência de RPC endpoint externo |
| Uso na UI | ❌ NÃO CONECTADO | MonitoringBridge existe mas sem view |

---

### 2.7 Módulo: Reports (Rust)

**Localização:** `src-tauri/src/modules/reports/`

```
reports/
├── engine.rs   → Motor de geração de relatórios
├── models.rs   → Modelos de relatório
└── mod.rs
```

| Funcionalidade | Status |
|---|---|
| Motor de relatórios | ✅ IMPLEMENTADO |
| Integração com Typst | ✅ via DocumentScope |
| UI de relatórios | ❌ Apenas botão em ReconciliationReportButton |

---

## 3. STORAGE (src-tauri/src/storage/)

```
storage/
├── local_database.rs         → LocalDatabase (devos_vault.sqlite)
├── migrations.rs             → MigrationManager para vault
├── mod.rs
├── real_estate_database.rs   → RealEstateDatabase (real_estate.sqlite)
└── real_estate_migrations.rs → RealEstateMigrationManager
```

| Banco | Struct | Inicializado em | Migrações |
|---|---|---|---|
| `devos_vault.sqlite` | `LocalDatabase` | Ambas as edições | `MigrationManager::run_migrations` |
| `real_estate.sqlite` | `RealEstateDatabase` | Apenas Cockpit | `RealEstateMigrationManager::run_migrations` |

---

## 4. PLATFORM (src-tauri/src/platform/)

```
platform/
├── mod.rs
└── typst_engine.rs   → Engine Typst integrado ao binário Rust
```

O Typst está embutido diretamente no binário, sem dependência de instalação externa.

---

## 5. RESUMO DE MATURIDADE POR MÓDULO

| Módulo | Backend Rust | Frontend UI | Integração | Status Geral |
|---|---|---|---|---|
| Authentication | ✅ Vault pronto | ✅ Pronto | 🟡 Sem JWT da API | PARCIAL |
| Identity | ❌ Sem módulo | ❌ Apenas 1 componente | ❌ | INCIPIENTE |
| IPFS | ✅ Completo | ✅ Completo | ❌ Kubo ausente | AGUARDA INSTALAÇÃO |
| Ledger | ❌ Sem módulo Rust | ✅ UI pronta | ❌ Sem JWT | BLOQUEADO por API |
| Real Estate | ✅ Completo | ✅ Completo | ✅ Cockpit funcional | COCKPIT OK |
| Documents | ✅ Typst pronto | 🟡 Apenas botão | 🟡 Parcial | PARCIAL |
| Wallets | ✅ BIP-39/44 completo | 🟡 Hub de cards | 🟡 Sem wizard | PARCIAL |
| Monitoring | ✅ RPC pronto | ❌ Sem view | ❌ | NÃO CONECTADO |
| Reports | ✅ Motor pronto | 🟡 Apenas botão | 🟡 | PARCIAL |

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*  
*Branch: `main` | HEAD: `6831a40`*

