# ROTEIRO MÍNIMO DE IMPLEMENTAÇÃO
## Sequência Segura para o DevOS Node → Holder Beta 1.0

**Data:** 05/11/2026 | **Auditoria:** ORDEM 6 — Read-only

---

## PRINCÍPIO FUNDAMENTAL

> Nenhuma etapa deve ser iniciada sem autorização explícita.  
> Cada etapa só começa após a anterior ser aprovada e testada.  
> Nenhuma etapa modifica o Cockpit sem verificação explícita.

---

## ETAPA 0 — CORREÇÕES CRÍTICAS (BUGS ATIVOS)
**Prioridade:** 🔴 IMEDIATA | **Risco para Cockpit:** ✅ ZERO

| # | Ação | Arquivo | Impacto |
|---|---|---|---|
| 0.1 | Remover 3 rotas imobiliárias do Node | `edition.node.ts` | Elimina 3 rotas quebradas |
| 0.2 | Corrigir `DEVOS_NAV_DATA` para filtrar por edição | `layouts/devos/layout.tsx` | Sidebar mostrará apenas itens válidos |
| 0.3 | Remover texto "mock-node-alpha" do sidebar | `layouts/devos/layout.tsx` | UI mais profissional |
| 0.4 | Remover footer "In-Memory Mocks Active" | `layouts/devos/layout.tsx` | UI mais profissional |

---

## ETAPA 1 — ROTAS ESSENCIAIS DO HOLDER NO NODE
**Prioridade:** 🔴 ALTA | **Risco para Cockpit:** ✅ ZERO

| # | Ação | Arquivo | Dependência |
|---|---|---|---|
| 1.1 | Adicionar rota `/devos/wallets` → `WalletsLandingView` ao Node | `edition.node.ts` | — |
| 1.2 | Adicionar rota `/devos/ledger` → `LedgerView` ao Node | `edition.node.ts` | Etapa 3 (JWT) |
| 1.3 | Verificar e ajustar `DEVOS_NAV_DATA` para o Node | `layout.tsx` | Etapa 0.2 |

---

## ETAPA 2 — WIZARD DE WALLET GENESIS
**Prioridade:** 🔴 ALTA | **Risco para Cockpit:** ✅ ZERO

| # | Ação | Arquivo a criar |
|---|---|---|
| 2.1 | Criar `WalletSetupWizardView` (tela de setup da carteira) | `modules/wallets/presentation/views/wallet-setup-wizard-view.tsx` |
| 2.2 | Implementar Step 1: Geração do mnemônico (via `generate_seed_and_preview`) | (dentro da view) |
| 2.3 | Implementar Step 2: Exibição e confirmação do mnemônico | (dentro da view) |
| 2.4 | Implementar Step 3: Confirmação e salvamento (via `confirm_and_save_wallets`) | (dentro da view) |
| 2.5 | Registrar rota `/devos/wallet-setup` no Node | `edition.node.ts` |
| 2.6 | Adicionar link para wizard no `NodeDashboardPage` (quando vault vazio) | `node-dashboard-page.tsx` |

---

## ETAPA 3 — INTEGRAÇÃO DE JWT DA API
**Prioridade:** 🔴 ALTA | **Risco para Cockpit:** 🟡 MÉDIO (testar)

| # | Ação | Arquivo |
|---|---|---|
| 3.1 | Após `VaultBridge.unlock()`, chamar endpoint de autenticação institucional | `modules/authentication/context/jwt.ts` |
| 3.2 | Receber JWT e armazenar em memória (não em localStorage) | novo serviço |
| 3.3 | Configurar axios para incluir `Authorization: Bearer <JWT>` | `src/lib/axios.ts` |
| 3.4 | Verificar que `useGetTreasuryAnalytics` e `useGetCitizenLedger` passam a funcionar | `treasury-hooks.ts` |

---

## ETAPA 4 — MÓDULO DE IDENTIDADE DO HOLDER
**Prioridade:** 🔴 ALTA | **Risco para Cockpit:** ✅ ZERO

| # | Ação | Arquivo a criar |
|---|---|---|
| 4.1 | Criar `HolderIdentityView` (página de identidade do participante) | `modules/identity/presentation/views/holder-identity-view.tsx` |
| 4.2 | Exibir dados do participante obtidos do JWT (nome, ID, role) | (dentro da view) |
| 4.3 | Exibir status da credencial Holder | (dentro da view) |
| 4.4 | Exibir endereço da carteira vinculada | (dentro da view) |
| 4.5 | Registrar rota `/devos/identity` no Node | `edition.node.ts` |
| 4.6 | Adicionar ao `DEVOS_NAV_DATA` do Node | `layout.tsx` |

---

## ETAPA 5 — NODE DASHBOARD COM DADOS REAIS
**Prioridade:** 🟡 MÉDIA | **Risco para Cockpit:** ✅ ZERO

| # | Ação | Arquivo |
|---|---|---|
| 5.1 | Substituir stake hardcoded por dado real (via API ou RPC) | `node-dashboard-page.tsx` |
| 5.2 | Substituir recompensa hardcoded por dado real | `node-dashboard-page.tsx` |
| 5.3 | Adicionar indicador de credencial Holder no dashboard | `node-dashboard-page.tsx` |

---

## ETAPA 6 — INSTALAÇÃO DO KUBO E IPFS FUNCIONAL
**Prioridade:** 🟡 MÉDIA | **Risco para Cockpit:** 🟡 MÉDIO

| # | Ação |
|---|---|
| 6.1 | Instalar Kubo (binário `ipfs`) no sistema |
| 6.2 | Inicializar repositório IPFS em `~/.local/share/devos/ipfs/` |
| 6.3 | Testar `IpfsView` com daemon real |
| 6.4 | Verificar prova de armazenamento DePIN |

---

## ETAPA 7 — DEVOS WORKSPACE NA ÁREA DE TRABALHO
**Prioridade:** 🟡 MÉDIA | **Risco para Cockpit:** ✅ ZERO

| # | Ação |
|---|---|
| 7.1 | Criar estrutura de pastas `DevOS/` na Área de Trabalho |
| 7.2 | Criar atalho para o executável Node |
| 7.3 | Criar LEIA-ME.md e ESTRUTURA.md |
| 7.4 | Criar atalho para identidade digital |

---

## DEPENDÊNCIAS ENTRE ETAPAS

```
Etapa 0 (correções) → deve vir primeiro, sem dependências
Etapa 1 (rotas) → depende de Etapa 0
Etapa 2 (wallet wizard) → independente, pode ser paralela com Etapa 1
Etapa 3 (JWT) → pré-requisito para Etapa 4 e 5
Etapa 4 (identidade) → depende de Etapa 3
Etapa 5 (dashboard real) → depende de Etapa 3
Etapa 6 (IPFS) → independente
Etapa 7 (workspace) → pode ser feita a qualquer momento
```

---

## CRITÉRIO DE ENTREGA DA BETA 1.0

O Holder Beta 1.0 estará pronto quando:
- [x] Etapa 0 — Bugs corrigidos
- [x] Etapa 1 — Rotas de wallets e ledger no Node
- [x] Etapa 2 — Wizard de Wallet Genesis funcional
- [x] Etapa 3 — JWT da API integrado
- [x] Etapa 4 — Identidade Holder visível
- [ ] Etapa 5 — Dados reais no dashboard (opcional para Beta)
- [ ] Etapa 6 — IPFS funcional (opcional para Beta)
- [ ] Etapa 7 — Workspace na Área de Trabalho (opcional para Beta)

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*  
*Branch: `main` | HEAD: `6831a40`*

