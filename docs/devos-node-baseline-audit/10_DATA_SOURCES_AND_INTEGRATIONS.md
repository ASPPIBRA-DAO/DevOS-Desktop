# FONTES DE DADOS E INTEGRAÇÕES
## Mapeamento de Todas as Fontes de Dados do Sistema

**Data:** 05/11/2026 | **Auditoria:** ORDEM 6 — Read-only

---

## 1. FONTES DE DADOS LOCAIS

### 1.1 SQLite: devos_vault.sqlite
- **Path runtime (Linux):** `~/.local/share/br.aspp.devos.node/devos_vault/`
- **Inicializado em:** Ambas as edições (sempre)
- **Dados armazenados:** Senha mestre (hash), carteiras BIP-39/44 criptografadas, estado do vault
- **Migrações:** `storage/migrations.rs` → `MigrationManager::run_migrations`
- **Status:** ✅ FUNCIONAL

### 1.2 SQLite: real_estate.sqlite
- **Path runtime (Linux):** `~/.local/share/br.aspp.devos.cockpit/real_estate/`
- **Inicializado em:** APENAS Cockpit
- **Dados armazenados:** Propriedades imobiliárias, lotes de importação, auditoria territorial
- **Migrações:** `storage/real_estate_migrations.rs`
- **Status:** ✅ FUNCIONAL (Cockpit) | ❌ NÃO INICIALIZADO (Node)

---

## 2. FONTES DE DADOS EXTERNAS

### 2.1 API ASPPIBRA (api.asppibra.com)

**Configuração:** `src/lib/axios.ts`
```typescript
baseURL: 'https://api.asppibra.com'
```

| Endpoint | Método | Hook Consumidor | Status Desktop |
|---|---|---|---|
| `/api/treasury/analytics` | GET | `useGetTreasuryAnalytics()` | ❌ Sem JWT → 401 |
| `/api/treasury/citizen/{id}/ledger` | GET | `useGetCitizenLedger(id)` | ❌ Sem JWT → 401 |
| `/api/identity/citizens` | GET | `useGetCitizens()` | ❌ Sem JWT → 401 |

**Problema crítico:** O fluxo de autenticação desktop (`signInWithPassword`) apenas desbloqueia o Vault local. Nenhum JWT é obtido da API ASPPIBRA. Portanto, todas as chamadas à API remota falharão com 401 em contexto desktop.

### 2.2 Kubo IPFS Daemon (localhost:5001)
- **Consumidores:** `modules/ipfs/client.rs`, todos os comandos `ipfs_*`
- **Status:** ❌ Kubo não instalado no sistema
- **Repo esperado:** `~/.local/share/devos/ipfs/`

### 2.3 Blockchain RPC
- **Consumidores:** `WalletBridge.fetchWalletBalance()`, `WalletBridge.batchFetchWalletBalances()`
- **Status:** 🟡 Implementado no Rust, URL do RPC não verificada nesta auditoria

---

## 3. DADOS HARDCODED (VALORES FIXOS NO CÓDIGO)

| Valor | Local no código | Tipo de dado |
|---|---|---|
| `"50000"` → "50.000 ASPPBR" | `node-dashboard-page.tsx` MetricBox | Stake Operacional |
| `"1450"` → "1.450 ASPPBR" | `node-dashboard-page.tsx` MetricBox | Recompensa de Época |
| `"128 Nós"` | `cockpit-dashboard-page.tsx` | Total de nós ativos |
| `"512 TB"` | `cockpit-dashboard-page.tsx` | Capacidade total pinada |
| `"99.98%"` | `cockpit-dashboard-page.tsx` | SLA médio da rede |
| `"6.400.000 ASPPBR"` | `cockpit-dashboard-page.tsx` | Tesouraria/Staking |
| `"mock-node-alpha"` | `layout.tsx` sidebar | Nome do nó |
| `"Control Plane Sandbox • Mocks Ativos"` | `layout.tsx` sidebar | Status do nó |
| `"Architecture Baseline v2.2.2"` | `layout.tsx` footer | Versão |
| `"In-Memory Mocks Active"` | `layout.tsx` footer | Status de mocks |
| `peers_count: 18, repo_size_bytes: 4294967296` | `node-dashboard-page.tsx` fallback web | IPFS mock |
| `dao_wallets_count: 1` | `node-dashboard-page.tsx` fallback web | Vault mock |

---

## 4. FLUXO DE DADOS — SÍNTESE

```
FUNCIONALIDADE          FONTE DE DADOS         STATUS
─────────────────────────────────────────────────────
Vault Status            SQLite local            ✅ OK
Device Status           Sistema operacional     ✅ OK
IPFS Status             Kubo daemon (local)     ❌ Offline
Wallet Balance          Blockchain RPC          🟡 Não verificado
Treasury Analytics      API remota + JWT        ❌ Sem JWT
Citizen Ledger          API remota + JWT        ❌ Sem JWT
Citizens List           API remota + JWT        ❌ Sem JWT
Real Estate (Cockpit)   SQLite local            ✅ OK
Real Estate (Node)      SQLite local            ❌ DB não inicializado
Stake Operacional       Hardcoded               ❌ Falso
Recompensas             Hardcoded               ❌ Falso
Nós da rede             Hardcoded               ❌ Falso
```

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*

