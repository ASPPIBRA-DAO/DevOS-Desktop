# ESTADO ATUAL DO REPOSITÓRIO
## ASPPIBRA-DAO DevOS Desktop — Baseline Técnico

**Data:** 05/11/2026  
**Auditoria:** ORDEM 6 — Read-only

---

## 1. IDENTIFICAÇÃO DO REPOSITÓRIO

| Campo | Valor |
|---|---|
| **Caminho local** | `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop` |
| **Remote** | `https://github.com/ASPPIBRA-DAO/DevOS-Desktop.git` |
| **Branch ativa** | `main` |
| **HEAD** | `6831a40ca4c27e2c2cb9bcc754d8e7fc130cb07a` |
| **Commit message** | `feat(ledger): eliminate simulated mock data and silent fallbacks` |
| **Status do working tree** | Limpo — apenas `docs/` não rastreado (`?? docs/`) |

---

## 2. ESTRUTURA DE DIRETÓRIOS COMPLETA

```
DevOS-Desktop/
├── src/                                # Frontend React + TypeScript
│   ├── actions/                        # Server actions
│   │   ├── identity.ts
│   │   └── treasury.ts
│   ├── app/                            # Núcleo da aplicação
│   │   ├── bootstrap/
│   │   │   ├── app-bootstrap-provider.tsx  # Máquina de estados do Vault
│   │   │   └── index.ts
│   │   ├── editions/                   # Configuração de edições
│   │   │   ├── cockpit/
│   │   │   │   └── cockpit-dashboard-page.tsx
│   │   │   ├── node/
│   │   │   │   └── node-dashboard-page.tsx
│   │   │   ├── edition.cockpit.ts      # 11 rotas do Cockpit
│   │   │   ├── edition.node.ts         # 6 rotas do Node
│   │   │   └── types.ts                # EditionConfig interface
│   │   ├── layouts/
│   │   │   ├── authentication/         # Layout de tela de auth
│   │   │   ├── components/             # MenuButton, NavToggle, etc.
│   │   │   ├── core/                   # HeaderSection, MainSection, etc.
│   │   │   └── devos/
│   │   │       └── layout.tsx          # DevOSLayout principal
│   │   ├── pages/
│   │   │   ├── error-view.tsx
│   │   │   ├── index.ts
│   │   │   └── not-found-view.tsx
│   │   ├── providers/
│   │   │   ├── app-providers.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   └── theme-provider.tsx
│   │   └── router/
│   │       ├── app-router.tsx          # Router principal (state machine)
│   │       ├── components/router-link.tsx
│   │       ├── hooks.ts
│   │       └── paths.ts                # Mapa de paths da aplicação
│   ├── assets/icons/                   # Ícones customizados
│   ├── global-config.ts
│   ├── lib/axios.ts                    # Cliente HTTP + endpoints
│   ├── locales/                        # Internacionalização
│   ├── main.tsx                        # Ponto de entrada React
│   ├── modules/                        # Módulos de domínio
│   │   ├── authentication/
│   │   │   ├── application/            # facades.ts, hooks.ts, identity-session.service.ts
│   │   │   ├── context/jwt.ts          # signInWithPassword, signUp
│   │   │   └── presentation/
│   │   │       ├── components/         # form-divider, form-head, sign-up-terms, etc.
│   │   │       └── views/              # 5 views JWT
│   │   ├── identity/
│   │   │   └── presentation/components/
│   │   │       └── host-integrity-card.tsx
│   │   ├── ipfs/
│   │   │   └── presentation/
│   │   │       ├── components/         # 6 componentes IPFS
│   │   │       └── views/ipfs-view.tsx
│   │   ├── ledger/
│   │   │   └── presentation/
│   │   │       ├── citizen-ledger/     # view + 3 componentes
│   │   │       ├── components/double-entry-chart-card.tsx
│   │   │       ├── hooks/treasury-hooks.ts
│   │   │       └── LedgerView.tsx
│   │   ├── real-estate/
│   │   │   └── presentation/
│   │   │       ├── components/         # 4 componentes
│   │   │       └── real-estate-view.tsx
│   │   ├── reports/
│   │   │   └── presentation/components/
│   │   │       └── ReconciliationReportButton.tsx
│   │   └── wallets/
│   │       └── presentation/
│   │           ├── components/vault-status-metric.tsx
│   │           └── views/wallets-landing-view.tsx
│   ├── pages/devos/
│   │   └── infrastructure-page.tsx
│   ├── platform/tauri/                 # Bridges IPC Frontend→Rust
│   │   ├── contracts/                  # 7 arquivos de tipos IPC
│   │   ├── core/                       # invoke.ts, tauri-errors.ts
│   │   ├── documents/document-bridge.ts
│   │   ├── ipfs/ipfs-bridge.ts
│   │   ├── monitoring/monitoring-bridge.ts
│   │   ├── real-estate/real-estate-bridge.ts
│   │   ├── system/system-bridge.ts
│   │   ├── vault/vault-bridge.ts
│   │   ├── wallets/wallet-bridge.ts
│   │   ├── window/window-bridge.ts
│   │   └── index.ts                    # Re-exporta todos os bridges
│   ├── sections/
│   │   ├── cessao-de-posse/            # CessaoPosseView + Content
│   │   └── devos/ledger/index.ts
│   ├── shared/                         # Componentes compartilhados
│   │   ├── components/                 # 20+ componentes
│   │   └── utils/                      # formatters, pdf-binary-utils
│   ├── test/                           # Testes frontend
│   │   ├── fixtures/ledger-fixtures.ts
│   │   └── 15 arquivos .spec.ts(x)
│   └── theme/                          # Sistema de tema MUI
│       ├── core/
│       ├── tokens/
│       └── with-settings/
│
├── src-tauri/                          # Backend Rust/Tauri
│   ├── src/
│   │   ├── commands/                   # Handlers IPC
│   │   │   ├── document_commands.rs    # 3 comandos
│   │   │   ├── ipfs_commands.rs        # 11 comandos IPFS
│   │   │   ├── mod.rs
│   │   │   ├── monitoring_commands.rs
│   │   │   ├── real_estate_commands.rs # 7 comandos (Cockpit only)
│   │   │   ├── system_commands.rs      # get_device_status
│   │   │   ├── vault_commands.rs       # 8 comandos de vault
│   │   │   └── wallet_commands.rs      # 7+ comandos de wallet
│   │   ├── modules/
│   │   │   ├── documents/              # 5 arquivos (models, service, typst_renderer, etc.)
│   │   │   ├── ipfs/                   # 6 arquivos (client, content, daemon, integrity, etc.)
│   │   │   ├── mod.rs
│   │   │   ├── monitoring/             # rpc_client.rs
│   │   │   ├── real_estate/            # importer, normalization
│   │   │   ├── reports/                # engine, models
│   │   │   ├── vault/                  # access_control, encryption
│   │   │   └── wallets/                # address, creation_session, derivation, mnemonic
│   │   ├── platform/
│   │   │   ├── mod.rs
│   │   │   └── typst_engine.rs
│   │   ├── shared/mod.rs
│   │   ├── storage/
│   │   │   ├── local_database.rs       # devos_vault.sqlite
│   │   │   ├── migrations.rs           # Migrações do vault
│   │   │   ├── mod.rs
│   │   │   ├── real_estate_database.rs # real_estate.sqlite
│   │   │   └── real_estate_migrations.rs
│   │   ├── tests/                      # Testes de integração Rust
│   │   │   ├── document_integration_test.rs
│   │   │   ├── ipfs_integration_tests.rs
│   │   │   ├── mod.rs
│   │   │   ├── real_estate_integration_tests.rs
│   │   │   └── security_tests.rs
│   │   ├── lib.rs                      # Ponto de entrada da lib Rust
│   │   └── main.rs
│   ├── capabilities/                   # Permissões Tauri
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── tauri.node.conf.json            # bundleId: br.aspp.devos.node
│   └── tauri.cockpit.conf.json         # bundleId: br.aspp.devos.cockpit
│
├── docs/                               # Documentação (não rastreada no git)
│   ├── devos-workspace-audit/          # Auditoria anterior (Ordem 5.3)
│   └── devos-node-baseline-audit/      # Esta auditoria (Ordem 6)
│
├── package.json
├── vite.config.ts                      # Alias @edition e configuração multi-modo
├── tsconfig.json
├── .gitignore
└── README.md (se existir)
```

---

## 3. ESTADO DO GIT

```bash
$ git status
On branch main
Your branch is up to date with 'origin/main'.

Untracked files:
  docs/

nothing added to commit but untracked files present

$ git log --oneline -5
6831a40 feat(ledger): eliminate simulated mock data and silent fallbacks
# (commits anteriores não verificados nesta auditoria)
```

---

## 4. TOOLCHAIN DISPONÍVEL

| Ferramenta | Status no sandbox | Status no sistema do usuário |
|---|---|---|
| **Rust / cargo** | ✅ Binário compilado existe em `src-tauri/target/debug/app` (796MB) | Disponível |
| **Node.js** | ❌ Não disponível no PATH do sandbox | Disponível para sessões do usuário |
| **pnpm** | ❌ Não disponível no PATH do sandbox | Disponível para sessões do usuário |
| **Kubo (IPFS)** | ❌ Não instalado no sistema | Ausente |
| **Typst** | Integrado ao binário Rust | Via `typst_engine.rs` |

---

## 5. CONFIGURAÇÕES DE EDIÇÃO

### tauri.node.conf.json (edição Node)
```json
{
  "identifier": "br.aspp.devos.node",
  "capabilities": ["desktop-vault"]
}
```

### tauri.cockpit.conf.json (edição Cockpit)
```json
{
  "identifier": "br.aspp.devos.cockpit",
  "capabilities": ["desktop-vault", "cockpit-real-estate"]
}
```

---

## 6. ENDPOINT DA API REMOTA

```typescript
// src/lib/axios.ts
baseURL: 'https://api.asppibra.com'

endpoints:
  platform.treasury.analytics  → GET /api/treasury/analytics
  platform.treasury.root       → /api/treasury
  platform.identity.citizens   → GET /api/identity/citizens
```

**Estado:** API externa — sem verificação de disponibilidade nesta auditoria.

---

## 7. BANCOS SQLITE (RUNTIME)

| Banco | Path em runtime (Linux) | Inicializado em |
|---|---|---|
| `devos_vault.sqlite` | `~/.local/share/br.aspp.devos.node/devos_vault/` | Ambas as edições — SEMPRE |
| `real_estate.sqlite` | `~/.local/share/br.aspp.devos.cockpit/real_estate/` | Apenas Cockpit |

**Observação:** O banco do vault existe no sistema se o aplicativo já foi executado alguma vez. Esta auditoria não inspecionou o conteúdo dos bancos de dados existentes.

---

## 8. BINÁRIO COMPILADO

```
src-tauri/target/debug/app
Tamanho: 796 MB (ELF 64-bit LSB pie executable, x86-64)
```

O binário compilado existe mas pode estar desatualizado em relação ao código-fonte atual (HEAD `6831a40`). Uma recompilação é necessária para garantir correspondência com o último commit.

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*  
*Branch: `main` | HEAD: `6831a40`*

