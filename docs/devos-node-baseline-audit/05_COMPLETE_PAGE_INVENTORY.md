# INVENTÁRIO COMPLETO DE PÁGINAS E VIEWS
## Classificação de Todas as Telas do Sistema

**Data:** 05/11/2026  
**Auditoria:** ORDEM 6 — Read-only

---

## 1. CRITÉRIOS DE CLASSIFICAÇÃO

| Código | Significado |
|---|---|
| **A** | Rota registrada + componente implementado + dados reais funcionais |
| **B** | Rota registrada + componente implementado + dados parcialmente mock |
| **C** | Rota registrada + componente implementado + dados 100% mock / dependência externa quebrada |
| **D** | Componente implementado mas SEM rota registrada (órfão ou sub-view) |
| **E** | Rota declarada em `paths.ts` mas SEM componente e SEM rota registrada |
| **F** | Referenciado na UI como cards/links mas arquivo de componente NÃO existe |

---

## 2. INVENTÁRIO POR MÓDULO

### 2.1 Módulo: Editions (Dashboards)

| Componente | Arquivo | Edição | Classificação |
|---|---|---|---|
| `NodeDashboardPage` | `editions/node/node-dashboard-page.tsx` | Node | **B** — UI real, 2 métricas mock |
| `CockpitDashboardPage` | `editions/cockpit/cockpit-dashboard-page.tsx` | Cockpit | **C** — UI real, 100% dados mock |

---

### 2.2 Módulo: Authentication

| Componente | Arquivo | Rota | Classificação |
|---|---|---|---|
| `JwtSignInView` | `modules/authentication/presentation/views/jwt-sign-in-view.tsx` | `/login` (e controlada pelo bootstrap) | **A** — Funcional: unlock do Vault |
| `JwtSignUpView` | `modules/authentication/presentation/views/jwt-sign-up-view.tsx` | `/register` (e setup vault via bootstrap) | **A** — Funcional: init_master_password |
| `JwtResetPasswordView` | `modules/authentication/presentation/views/jwt-reset-password-view.tsx` | `/forgot-password` | **C** — UI existe, funcionalidade real desconhecida (sem API no desktop) |
| `JwtUpdatePasswordView` | `modules/authentication/presentation/views/jwt-update-password-view.tsx` | `/reset-password` | **C** — UI existe, funcionalidade real desconhecida |
| `JwtVerifyView` | `modules/authentication/presentation/views/jwt-verify-view.tsx` | `/verify` | **C** — UI existe, sem backend de verificação no desktop |

**Componentes de apoio (sem rota própria):**

| Componente | Arquivo | Classificação |
|---|---|---|
| `FormDivider` | `presentation/components/form-divider.tsx` | **D** — Sub-componente |
| `FormHead` | `presentation/components/form-head.tsx` | **D** — Sub-componente |
| `FormResendCode` | `presentation/components/form-resend-code.tsx` | **D** — Sub-componente |
| `FormReturnLink` | `presentation/components/form-return-link.tsx` | **D** — Sub-componente |
| `FormSocials` | `presentation/components/form-socials.tsx` | **D** — Sub-componente |
| `IdentityAvatar` | `presentation/components/identity-avatar.tsx` | **D** — Sub-componente |
| `SignUpTerms` | `presentation/components/sign-up-terms.tsx` | **D** — Sub-componente |

---

### 2.3 Módulo: Identity

| Componente | Arquivo | Rota | Classificação |
|---|---|---|---|
| `HostIntegrityCard` | `modules/identity/presentation/components/host-integrity-card.tsx` | Sem rota — usada no NodeDashboardPage | **D** — Sub-componente; dados reais via SystemBridge |

> **Observação:** O módulo de identidade é extremamente thin. Consiste em apenas **1 componente**. Não existe view de identidade, credencial, certificado ou .dvcert no código.

---

### 2.4 Módulo: IPFS

| Componente | Arquivo | Rota | Edição | Classificação |
|---|---|---|---|---|
| `IpfsView` | `modules/ipfs/presentation/views/ipfs-view.tsx` | `/devos/ipfs` | Node + Cockpit | **C** — UI implementada, daemon Kubo offline |

**Componentes de apoio:**

| Componente | Arquivo | Classificação |
|---|---|---|
| `IpfsDaemonMetric` | `presentation/components/ipfs-daemon-metric.tsx` | **D** — Usado no NodeDashboardPage |
| `IpfsFileList` | `presentation/components/ipfs-file-list.tsx` | **D** — Parte da IpfsView |
| `IpfsNodeStatus` | `presentation/components/ipfs-node-status.tsx` | **D** — Parte da IpfsView |
| `IpfsPinningStatus` | `presentation/components/ipfs-pinning-status.tsx` | **D** — Parte da IpfsView |
| `IpfsUploadPanel` | `presentation/components/ipfs-upload-panel.tsx` | **D** — Parte da IpfsView |
| `StorageProofCard` | `presentation/components/storage-proof-card.tsx` | **D** — Usado no NodeDashboardPage |

---

### 2.5 Módulo: Ledger

| Componente | Arquivo | Rota | Edição | Classificação |
|---|---|---|---|---|
| `LedgerView` | `modules/ledger/presentation/LedgerView.tsx` | `/devos/ledger`, `/devos/dao` | Cockpit only | **C** — UI implementada, chama API remota sem JWT |
| `CitizenLedgerView` | `modules/ledger/presentation/citizen-ledger/view/CitizenLedgerView.tsx` | Sem rota — sub-view de LedgerView (tab switch) | — | **D** — Sub-view interno |

**Componentes de apoio:**

| Componente | Arquivo | Classificação |
|---|---|---|
| `DoubleEntryChartCard` | `presentation/components/double-entry-chart-card.tsx` | **D** — Parte da LedgerView |
| `AssociateSearchCard` | `citizen-ledger/components/associate-search-card.tsx` | **D** — Parte da CitizenLedgerView |
| `FinancialSummaryHeader` | `citizen-ledger/components/financial-summary-header.tsx` | **D** — Parte da CitizenLedgerView |
| `FinancialTransactionsTable` | `citizen-ledger/components/financial-transactions-table.tsx` | **D** — Parte da CitizenLedgerView |

---

### 2.6 Módulo: Real Estate

| Componente | Arquivo | Rota | Edição | Classificação |
|---|---|---|---|---|
| `RealEstateView` | `modules/real-estate/presentation/real-estate-view.tsx` | `/devos/cadastre`, `/devos/database`, `/real-estate` | Cockpit (funcional) / Node (QUEBRADO) | **A** no Cockpit / **C** no Node |

**Componentes de apoio:**

| Componente | Arquivo | Classificação |
|---|---|---|
| `RealEstateImporterCard` | `presentation/components/real-estate-importer-card.tsx` | **D** — Parte da RealEstateView |
| `RealEstateMetricsBar` | `presentation/components/real-estate-metrics-bar.tsx` | **D** — Parte da RealEstateView |
| `RealEstateSpreadsheetTable` | `presentation/components/real-estate-spreadsheet-table.tsx` | **D** — Parte da RealEstateView |
| `TerritorialHubSelector` | `presentation/components/territorial-hub-selector.tsx` | **D** — Parte da RealEstateView |

---

### 2.7 Módulo: Reports

| Componente | Arquivo | Rota | Classificação |
|---|---|---|---|
| `ReconciliationReportButton` | `modules/reports/presentation/components/ReconciliationReportButton.tsx` | Sem rota | **D** — Componente de ação (Typst) |

---

### 2.8 Módulo: Wallets

| Componente | Arquivo | Rota | Edição | Classificação |
|---|---|---|---|---|
| `WalletsLandingView` | `modules/wallets/presentation/views/wallets-landing-view.tsx` | `/devos/wallets`, `/banking` | Cockpit only | **B** — Hub de cards, sub-módulos não existem como arquivos |

**Componentes de apoio:**

| Componente | Arquivo | Classificação |
|---|---|---|
| `VaultStatusMetric` | `presentation/components/vault-status-metric.tsx` | **D** — Usado no NodeDashboardPage |

---

### 2.9 Sections (fora de módulos)

| Componente | Arquivo | Rota | Edição | Classificação |
|---|---|---|---|---|
| `CessaoPosseView` | `sections/cessao-de-posse/CessaoPosseView.tsx` | `/devos/cessao-posse` | Cockpit only | 🟡 **B/C** — Verificar implementação |
| `CessaoPosseContent` | `sections/cessao-de-posse/CessaoPosseContent.tsx` | Sem rota | **D** — Sub-componente de CessaoPosseView |

---

### 2.10 Pages (fora de módulos)

| Componente | Arquivo | Rota | Edição | Classificação |
|---|---|---|---|---|
| `InfrastructurePage` | `pages/devos/infrastructure-page.tsx` | `/devos/infrastructure` | Node + Cockpit | 🟡 **B/C** — Verificar implementação |

---

### 2.11 App Pages (sistema)

| Componente | Arquivo | Rota | Classificação |
|---|---|---|---|
| `NotFoundView` | `app/pages/not-found-view.tsx` | `*` (catch-all) | **A** — 404 funcional |
| `ErrorView` | `app/pages/error-view.tsx` | Sem rota | **D** — Para ErrorBoundary |

---

### 2.12 Rotas Declaradas em paths.ts mas SEM Componente — Classificação E

Estas rotas existem em `paths.ts` mas **não estão registradas** em NENHUMA edição:

| Path | Label no sidebar (`layout.tsx`) | Classificação |
|---|---|---|
| `paths.devos.analytics` → `/devos/analytics` | Hub Analítico | **E** |
| `paths.devos.blog` → `/devos/blog` | Blog | **E** |
| `paths.devos.notifications.root` → `/devos/notifications` | Notificações | **E** |
| `paths.devos.security` → `/devos/security` | Security | **E** |
| `paths.devos.audit` → `/devos/audit` | Audit | **E** |
| `paths.devos.apis` → `/devos/apis` | APIs | **E** |
| `paths.devos.invoices` → `/devos/invoices` | Faturas | **E** |
| `paths.auth.jwt.signIn` → `/login` | (auth routes) | **A** — Registradas no router |
| `paths.auth.jwt.signUp` → `/register` | (auth routes) | **A** — Registradas no router |

---

### 2.13 Sub-módulos Referenciados no WalletsLandingView mas SEM Arquivo — Classificação F

O `WalletsLandingView` lista estes módulos como cards clicáveis com `fileTag` indicando o arquivo esperado, mas os arquivos **não existem no repositório**:

| Módulo | fileTag referenciado | Rota indicada | Classificação |
|---|---|---|---|
| Visão Geral Bancária | `overview-banking-view.tsx` | `/banking` | **F** — Arquivo inexistente |
| Saldos & Custódia | `conta-view.tsx` | `/banking/conta` | **F** — Arquivo inexistente |
| Central de Cartões | `banking-cartoes-view.tsx` | `/banking/cartoes` | **F** — Arquivo inexistente |
| Rede & Afiliados | `banking-rede-view.tsx` | `/banking/rede` | **F** — Arquivo inexistente |
| Extrato e Auditoria | `banking-transacoes-view.tsx` | `/banking/transacoes` | **F** — Arquivo inexistente |
| Módulo de Recebimento | `receber/index.tsx` | `/banking/receber` | **F** — Arquivo inexistente |
| Câmbio e Remessas | (referenciado no código) | — | **F** — Arquivo inexistente |
| Central de Crédito | (referenciado no código) | — | **F** — Arquivo inexistente |
| Gestão de Patrimônio | (referenciado no código) | — | **F** — Arquivo inexistente |
| Central de Faturamento | (referenciado no código) | — | **F** — Arquivo inexistente |
| Conformidade LGPD | (referenciado no código) | — | **F** — Arquivo inexistente |

> **Nota:** O `WalletsLandingView` funciona como um **índice de módulos futuros** — apresenta cards bem formatados com `status: 'soon'` ou `status: 'active'` para sub-módulos que ainda não existem como arquivos. Esta é uma UI de demonstração/roadmap.

---

## 3. RESUMO QUANTITATIVO

| Classificação | Quantidade | Descrição |
|---|---|---|
| **A** — Funcional | 3 | SignIn, SignUp, NotFoundView |
| **B** — Parcialmente Mock | 2 | NodeDashboardPage, WalletsLandingView |
| **C** — Quebrado/Sem Dados | 7 | CockpitDashboardPage, JwtReset, JwtUpdate, JwtVerify, IpfsView, LedgerView, RealEstateView(Node) |
| **D** — Sub-componente/Órfão | ~25 | Componentes internos de módulos |
| **E** — Rota sem Componente | 7 | Analytics, Blog, Notificações, Security, Audit, APIs, Faturas |
| **F** — Arquivo Inexistente | 11+ | Sub-módulos do WalletsLandingView |

---

## 4. PÁGINAS PRIORITÁRIAS PARA O HOLDER BETA 1.0

Com base na análise, as seguintes páginas são **necessárias para o Holder Beta** e seu estado atual:

| Página | Necessidade | Estado atual | Ação necessária |
|---|---|---|---|
| `NodeDashboardPage` | ✅ Sim — dashboard principal | B — Parcialmente mock | Substituir métricas hardcoded por dados reais |
| `JwtSignInView` | ✅ Sim — login/unlock | A — Funcional | Adicionar fluxo de JWT após unlock |
| `JwtSignUpView` | ✅ Sim — setup vault | A — Funcional | OK para beta |
| **Holder Identity View** | ✅ Sim — credencial | ❌ NÃO EXISTE | Criar do zero |
| **Wallet Genesis View** | ✅ Sim — criar carteira | ❌ NÃO EXISTE como view completa | Criar UI completa |
| `IpfsView` | 🟡 Opcional | C — UI ok, daemon offline | Aguardar instalação do Kubo |
| **Governance View** | ✅ Sim — participação | ❌ NÃO EXISTE | Criar do zero |
| **Ledger Holder View** | ✅ Sim — extrato pessoal | C — Cockpit only + sem JWT | Adicionar ao Node + integrar JWT |

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*  
*Branch: `main` | HEAD: `6831a40`*

