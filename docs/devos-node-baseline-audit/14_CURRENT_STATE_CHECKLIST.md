# CHECKLIST DE ESTADO ATUAL
## Conformidade do Sistema para o Holder Beta 1.0

**Data:** 05/11/2026 | **Auditoria:** ORDEM 6 — Read-only

**Legenda:** ✅ Implementado | 🟡 Parcial | ❌ Ausente | ⚠️ Quebrado

---

## 1. INFRAESTRUTURA BASE

| Item | Status | Evidência |
|---|---|---|
| Binário Tauri compilado | ✅ | `src-tauri/target/debug/app` (796MB) |
| SQLite vault funcionando | ✅ | `local_database.rs` + migrações |
| Separação Node/Cockpit | ✅ | `edition.node.ts` / `edition.cockpit.ts` |
| Bootstrap / Splash screen | ✅ | `app-bootstrap-provider.tsx` |
| Sistema de temas MUI | ✅ | `src/theme/` |
| Layout principal (DevOSLayout) | ✅ | `app/layouts/devos/layout.tsx` |

---

## 2. AUTENTICAÇÃO E VAULT

| Item | Status | Evidência |
|---|---|---|
| Inicialização da senha mestre | ✅ | `init_master_password` command |
| Desbloqueio do vault | ✅ | `unlock_vault` command |
| Bloqueio do vault | ✅ | `lock_vault` command |
| Backup criptografado | ✅ | `export_vault_backup` command |
| Restore do vault | ✅ | `restore_vault_backup` command |
| JWT da API ASPPIBRA | ❌ | Nunca chamado no fluxo desktop |
| Validação de role (HOLDER/FOUNDER) | ❌ | Sem implementação |
| Proteção de rotas por perfil | ❌ | Sem implementação |
| Reset de senha nativo | ⚠️ | UI existe, sem backend real no desktop |

---

## 3. IDENTIDADE E CREDENCIAL HOLDER

| Item | Status | Evidência |
|---|---|---|
| Módulo de identidade | 🟡 | Apenas `HostIntegrityCard` (status do hardware) |
| View de identidade (página) | ❌ | Não existe |
| Certificado digital (.dvcert) | ❌ | Não existe no código |
| Credencial Holder | ❌ | Não implementada |
| Registro na infraestrutura ASPPIBRA | ❌ | Não implementado |
| Vínculo carteira → participação | ❌ | Não implementado |

---

## 4. WALLET GENESIS

| Item | Status | Evidência |
|---|---|---|
| Geração BIP-39 (Rust) | ✅ | `modules/wallets/mnemonic.rs` |
| Derivação BIP-44 (Rust) | ✅ | `modules/wallets/derivation.rs` |
| Endereços EVM (Rust) | ✅ | `modules/wallets/address.rs` |
| Sessão de criação (Rust) | ✅ | `modules/wallets/creation_session.rs` |
| Criptografia AES-256-GCM (Rust) | ✅ | `modules/vault/encryption.rs` |
| UI wizard de criação de wallet | ❌ | Não existe — apenas hub de cards |
| Fluxo de verificação do mnemônico | ❌ | Não existe na UI |
| Hub de carteiras (WalletsLandingView) | 🟡 | Existe mas apenas no Cockpit |
| Rota de wallets no Node | ❌ | Não registrada em `edition.node.ts` |

---

## 5. DASHBOARD DO NÓ (Node Dashboard)

| Item | Status | Evidência |
|---|---|---|
| NodeDashboardPage existe | ✅ | `editions/node/node-dashboard-page.tsx` |
| Status real do vault | ✅ | Via WalletBridge |
| Status real do IPFS | 🟡 | UI pronta, daemon offline |
| Status real do dispositivo | ✅ | Via SystemBridge |
| Stake Operacional (dado real) | ❌ | Hardcoded: 50.000 |
| Recompensa de Época (dado real) | ❌ | Hardcoded: 1.450 |

---

## 6. IPFS E DEPIN

| Item | Status | Evidência |
|---|---|---|
| Módulo IPFS Rust completo | ✅ | `modules/ipfs/` (6 arquivos) |
| UI de IPFS completa | ✅ | `ipfs-view.tsx` + 6 componentes |
| IpfsView registrada no Node | ✅ | `edition.node.ts` |
| Kubo instalado no sistema | ❌ | Binário `ipfs` ausente |
| Upload/Download funcionando | ❌ | Requer Kubo |
| Prova DePIN funcionando | ❌ | Requer Kubo |

---

## 7. LEDGER E TESOURARIA

| Item | Status | Evidência |
|---|---|---|
| LedgerView implementada | ✅ | `modules/ledger/presentation/LedgerView.tsx` |
| CitizenLedgerView implementada | ✅ | Componente interno de LedgerView |
| Rota de ledger no Node | ❌ | Não registrada em `edition.node.ts` |
| JWT para chamar API | ❌ | Nunca obtido no desktop |
| Dados reais de tesouraria | ❌ | Sem JWT → 401 |
| Dados reais por cidadão | ❌ | Sem JWT → 401 |

---

## 8. GOVERNANÇA E FUNDOS

| Item | Status | Evidência |
|---|---|---|
| View de governança | ❌ | Não existe |
| Rota de governança | ❌ | Não registrada |
| View de fundos | ❌ | Não existe |
| Participação em pautas | ❌ | Não implementada |
| Sistema de votação | ❌ | Não implementado |

---

## 9. DOCUMENTOS E RELATÓRIOS

| Item | Status | Evidência |
|---|---|---|
| Typst integrado ao Rust | ✅ | `platform/typst_engine.rs` |
| Geração de PDF | ✅ | `generate_document` command |
| Preview de documento | ✅ | `preview_document` command |
| Export de documento | ✅ | `export_previewed_document` command |
| View completa de documentos | ❌ | Apenas botão solto |
| Rota de documentos | ❌ | Não registrada |

---

## 10. ROTAS E NAVEGAÇÃO (Node Edition)

| Item | Status |
|---|---|
| Dashboard (/) | ✅ |
| IPFS (/devos/ipfs) | 🟡 UI ok, daemon offline |
| Infrastructure (/devos/infrastructure) | 🟡 Verificar |
| Wallets (/devos/wallets) | ❌ Não registrada |
| Ledger (/devos/ledger) | ❌ Não registrada |
| Governança | ❌ Não existe |
| Cadastre (/devos/cadastre) | ⚠️ QUEBRADA — DB não inicializado |
| Database (/devos/database) | ⚠️ QUEBRADA — DB não inicializado |
| /real-estate | ⚠️ QUEBRADA — DB não inicializado |

---

## 11. PONTUAÇÃO GERAL

| Categoria | ✅ | 🟡 | ❌ | ⚠️ |
|---|---|---|---|---|
| Infraestrutura base | 6 | 0 | 0 | 0 |
| Auth / Vault | 5 | 0 | 4 | 1 |
| Identidade / Credencial | 0 | 1 | 5 | 0 |
| Wallet Genesis | 5 | 1 | 4 | 0 |
| Node Dashboard | 3 | 1 | 2 | 0 |
| IPFS / DePIN | 3 | 0 | 2 | 0 |
| Ledger / Tesouraria | 2 | 0 | 3 | 0 |
| Governança / Fundos | 0 | 0 | 5 | 0 |
| Documentos / Relatórios | 4 | 0 | 2 | 0 |
| Rotas Node | 1 | 2 | 3 | 3 |
| **TOTAL** | **29** | **5** | **30** | **4** |

**Conclusão:** Aproximadamente 43% dos itens avaliados estão implementados, 36% ausentes, 7% parciais e 6% quebrados.

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*

