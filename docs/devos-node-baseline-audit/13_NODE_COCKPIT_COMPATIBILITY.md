# COMPATIBILIDADE NODE / COCKPIT
## Risco de Regressão em Componentes Compartilhados

**Data:** 05/11/2026 | **Auditoria:** ORDEM 6 — Read-only

---

## 1. COMPONENTES COMPARTILHADOS E RISCO

Qualquer alteração nos componentes abaixo afeta AMBAS as edições simultaneamente:

| Componente | Localização | Risco de Regressão |
|---|---|---|
| `DevOSLayout` | `app/layouts/devos/layout.tsx` | 🔴 ALTO — layout de todas as rotas |
| `AuthCenteredLayout` | `app/layouts/authentication/` | 🔴 ALTO — telas de auth |
| `AppBootstrapProvider` | `app/bootstrap/` | 🔴 ALTO — máquina de estados |
| `AppRouter` | `app/router/app-router.tsx` | 🔴 ALTO — roteamento |
| `paths.ts` | `app/router/paths.ts` | 🟡 MÉDIO — alterar um path afeta todos os links |
| `VaultBridge` | `platform/tauri/vault/` | 🔴 ALTO — auth de ambas as edições |
| `IpfsView` | `modules/ipfs/presentation/` | 🟡 MÉDIO — usada nas 2 edições |
| `InfrastructurePage` | `pages/devos/` | 🟡 MÉDIO — usada nas 2 edições |
| `MetricBox`, `StatusBadge`, `Card` | `shared/components/` | 🟡 MÉDIO — usados em múltiplos módulos |
| `lib/axios.ts` | `src/lib/` | 🟡 MÉDIO — base URL e endpoints |
| `theme/` | `src/theme/` | 🟡 MÉDIO — visual de toda a UI |

---

## 2. COMPONENTES EXCLUSIVOS POR EDIÇÃO

### Apenas Node:
- `NodeDashboardPage` — `editions/node/node-dashboard-page.tsx`
- `edition.node.ts` — configuração da edição

### Apenas Cockpit:
- `CockpitDashboardPage` — `editions/cockpit/cockpit-dashboard-page.tsx`
- `edition.cockpit.ts` — configuração da edição
- `WalletsLandingView` — apenas registrada no Cockpit
- `LedgerView` / `CitizenLedgerView` — apenas registradas no Cockpit
- `CessaoPosseView` — apenas registrada no Cockpit
- `RealEstateView` — funcional apenas no Cockpit

---

## 3. REGRAS DE COMPATIBILIDADE

### Regra 1 — Nunca remover comandos Rust comuns
Os comandos listados em `app_invoke_handler!()` em `lib.rs` são registrados em AMBAS as edições. Remover qualquer um deles quebrará a edição que ainda o usa.

### Regra 2 — Preservar a separação `is_cockpit`
O bloco `if is_cockpit { ... }` em `lib.rs` garante que `RealEstateDatabase` só existe no Cockpit. Qualquer alteração neste bloco precisa ser testada nas duas edições.

### Regra 3 — DEVOS_NAV_DATA é compartilhado
A função `createDevosNavData()` em `layout.tsx` gera o mesmo menu para Node e Cockpit. Adicionar um item novo afeta ambos.

### Regra 4 — paths.ts é compartilhado
Alterar um path em `paths.ts` afeta todos os componentes que referenciam aquele path.

---

## 4. PLANO DE ISOLAMENTO PARA O HOLDER BETA

Para modificar o Node sem afetar o Cockpit:

| Alteração | Risco para Cockpit | Estratégia |
|---|---|---|
| Remover rotas imobiliárias do `edition.node.ts` | ✅ ZERO | Cockpit mantém as mesmas rotas |
| Adicionar rotas de wallets/ledger ao `edition.node.ts` | ✅ ZERO | Cockpit já as tem |
| Corrigir `DEVOS_NAV_DATA` para ser dinâmico por edição | 🟡 BAIXO | Testar Cockpit após alteração |
| Implementar JWT no fluxo de auth | 🟡 MÉDIO | Testar ambas as edições após |
| Criar view de identidade Holder | ✅ ZERO | Nova view, sem afeto ao Cockpit |
| Criar wizard de Wallet Genesis | ✅ ZERO | Pode ser restrito ao Node |

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*

