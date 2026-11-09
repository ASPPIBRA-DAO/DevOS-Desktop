# AUDITORIA DOS DASHBOARDS: HOLDER E FOUNDER
## Análise das 4 Dimensões: Node / Cockpit / Holder / Founder

**Data:** 05/11/2026  
**Auditoria:** ORDEM 6 — Read-only

---

## 1. AS QUATRO DIMENSÕES — DEFINIÇÕES PRECISAS

> **REGRA FUNDAMENTAL:** Estas são quatro dimensões independentes. Nunca confundi-las.

| Dimensão | Tipo | Descrição | Localização no código |
|---|---|---|---|
| **Edição Node** | Software | Binário nativo para operadores de nó e participantes | `edition.node.ts`, `bundleId: br.aspp.devos.node` |
| **Edição Cockpit** | Software | Binário nativo para administração institucional | `edition.cockpit.ts`, `bundleId: br.aspp.devos.cockpit` |
| **Perfil Holder** | Credencial | Participante da rede ASPPIBRA-DAO | ❌ NÃO IMPLEMENTADO no código |
| **Perfil Founder** | Credencial | Fundador institucional da DAO | ❌ NÃO IMPLEMENTADO no código |

**Relação planejada (ainda não implementada):**
- Edição Node → usada por participantes com **Perfil Holder**
- Edição Cockpit → usada por administradores com **Perfil Founder**

---

## 2. ANÁLISE DO NODE DASHBOARD (destinado ao Holder)

### 2.1 Identificação

**Arquivo:** [`src/app/editions/node/node-dashboard-page.tsx`](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/app/editions/node/node-dashboard-page.tsx)  
**Componente exportado:** `NodeDashboardPage` (alias: `NodeDashboardView`)  
**Rota registrada:** `/` na edição Node

### 2.2 Estrutura Visual

```
NodeDashboardPage
├── Header do Nó
│   ├── Título: "DevOS Node"
│   ├── StatusBadge: "Motor Nativo Ativo" / "Navegador Preview"
│   ├── Subtítulo: "Painel Operacional do Nó DePIN • ASPPIBRA Storage Network (Kubo + Tauri v2)"
│   └── Botão: "Sincronizar Motor" / "Consultando Rust..."
│
├── Alerta de Erro (condicional)
│
├── Grid de Métricas (4 colunas)
│   ├── MetricBox: "Stake Operacional" → formatAsppbr(50000) ← HARDCODED
│   ├── MetricBox: "Recompensa de Época" → formatAsppbr(1450) ← HARDCODED
│   ├── VaultStatusMetric (módulo wallets) ← DADO REAL via WalletBridge
│   └── IpfsDaemonMetric (módulo ipfs) ← DADO REAL via IpfsBridge
│
└── Grid de Painéis Detalhados (2 colunas)
    ├── HostIntegrityCard (módulo identity) ← DADO REAL via SystemBridge
    └── StorageProofCard (módulo ipfs) ← Verificar implementação
```

### 2.3 Dados por Fonte

| Elemento | Fonte | Estado |
|---|---|---|
| Stake Operacional (50.000 ASPPBR) | Hardcoded — `formatAsppbr(50000)` | ❌ Mock |
| Recompensa de Época (1.450 ASPPBR) | Hardcoded — `formatAsppbr(1450)` | ❌ Mock |
| Status do Vault (is_initialized, is_unlocked) | `WalletBridge.getVaultStatus()` | ✅ Real |
| Contagem de carteiras (dao_wallets_count) | `WalletBridge.getVaultStatus()` | ✅ Real |
| Status do daemon IPFS (running, peers_count, repo_size) | `IpfsBridge.getDaemonStatus()` | ✅ Real (daemon offline) |
| Status do dispositivo (enrolled, status) | `SystemBridge.getDeviceStatus()` | ✅ Real |
| StorageProofCard | Não inspecionado completamente | 🟡 Verificar |

### 2.4 Lógica de Carregamento

```typescript
// Fluxo em modo desktop (isTauriDesktop() === true):
const [devRes, vaultRes, ipfsRes] = await Promise.all([
  SystemBridge.getDeviceStatus(),
  WalletBridge.getVaultStatus().catch(() => ({ is_initialized: false, ... })),
  IpfsBridge.getDaemonStatus(),
]);

// Fallback para web preview (sem Tauri):
setDeviceStatus({ enrolled: false, status: 'WEB_PREVIEW' });
setVaultStatus({ is_initialized: true, is_unlocked: false, dao_wallets_count: 1, client_wallets_count: 0 });
setIpfsStatus({ running: true, peers_count: 18, repo_size_bytes: 4294967296 });
```

### 2.5 O que está ausente para um Holder completo

| Funcionalidade Holder | Status no Node Dashboard |
|---|---|
| Identidade / Credencial Holder | ❌ Não existe |
| Carteira Genesis | ❌ Apenas status do vault, não da carteira em si |
| Saldo real ASPPBR | ❌ Hardcoded |
| Recompensas reais | ❌ Hardcoded |
| Governança / Pauta DAO | ❌ Não existe no Node |
| Livro-Razão pessoal | ❌ Rota não registrada no Node |
| Fundos / Participação | ❌ Não existe |
| Meu DevOS (Vault, Workspace) | 🟡 Apenas status parcial do vault |

---

## 3. ANÁLISE DO COCKPIT DASHBOARD (destinado ao Founder)

### 3.1 Identificação

**Arquivo:** [`src/app/editions/cockpit/cockpit-dashboard-page.tsx`](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/app/editions/cockpit/cockpit-dashboard-page.tsx)  
**Componente exportado:** `CockpitDashboardPage` (alias: `CockpitDashboardView`)  
**Rota registrada:** `/` na edição Cockpit

### 3.2 Estrutura Visual

```
CockpitDashboardPage
├── Header do Admin
│   ├── Título: "DevOS Admin"
│   ├── StatusBadge: "Edição Administrador"
│   └── Subtítulo: "Painel Institucional de Administração de Cluster & Governança ASPPIBRA DAO"
│
├── Grid de Métricas (4 colunas) ← TODOS HARDCODED
│   ├── MetricBox: "Total de Nós Ativos" → "128 Nós" ← string literal
│   ├── MetricBox: "Capacidade Total Pinada" → "512 TB" ← string literal
│   ├── MetricBox: "SLA Médio da Rede" → "99.98%" ← string literal
│   └── MetricBox: "Tesouraria / Staking" → "6.400.000 ASPPBR" ← string literal
│
└── Cards de Acesso Rápido
    ├── Card: "Banco de Dados Imobiliário & Auditoria"
    │   └── Botão → navega para paths.devos.cadastre
    └── Card: "Armazenamento Descentralizado IPFS (Kubo)"
        └── Botão → navega para paths.devos.ipfs
```

### 3.3 Dados por Fonte

| Elemento | Fonte | Estado |
|---|---|---|
| Total de Nós Ativos ("128 Nós") | String literal hardcoded | ❌ Mock total |
| Capacidade Pinada ("512 TB") | String literal hardcoded | ❌ Mock total |
| SLA Médio ("99.98%") | String literal hardcoded | ❌ Mock total |
| Tesouraria ("6.400.000 ASPPBR") | String literal hardcoded | ❌ Mock total |
| Navegação para Cadastre | `useNavigate()` | ✅ Funcional |
| Navegação para IPFS | `useNavigate()` | ✅ Funcional |

**Observação crítica:** O CockpitDashboardPage não possui NENHUM hook, bridge ou chamada de API. É 100% estático. A única funcionalidade real é navegação entre rotas.

### 3.4 O que está ausente para um Founder completo

| Funcionalidade Founder | Status no Cockpit Dashboard |
|---|---|
| Métricas reais de rede | ❌ Hardcoded |
| Contagem real de nós | ❌ Hardcoded |
| Tesouraria real | ❌ Hardcoded |
| Governança DAO | ❌ Não existe como rota |
| Gestão de Founders | ❌ Não existe |
| Métricas de Holders | ❌ Não existe |
| Relatórios institucionais | 🟡 Typst disponível no Rust |

---

## 4. PERFIL HOLDER — ESTADO NO CÓDIGO

### 4.1 O que existe relacionado ao Holder

| Componente | Estado | Referência |
|---|---|---|
| Conceito "Holder" | Mencionado na UI como `subtitle: 'Operador de Nós & Armazenamento DePIN'` | Apenas texto |
| Credencial Holder (.dvcert) | ❌ NÃO EXISTE no código | — |
| Rota Holder Dashboard | ❌ NÃO EXISTE — a edição Node usa `NodeDashboardPage` | — |
| `role: "HOLDER"` no JWT | ❌ NÃO EXISTE — sem chamada à API de autenticação | — |
| Verificação de credencial Holder | ❌ NÃO IMPLEMENTADA | — |

### 4.2 O que o Holder precisaria e não tem

Baseado no escopo definido (10 funcionalidades para o Holder Beta):

| # | Funcionalidade | Estado atual |
|---|---|---|
| 1 | Baixar e instalar o aplicativo | ✅ Binário existe |
| 2 | Inicializar DevOS Workspace | 🟡 Vault inicializável, Workspace estrutural não implementado |
| 3 | Criar e proteger Vault | ✅ Funcional via `init_master_password` + `unlock_vault` |
| 4 | Criar Wallet Genesis | 🟡 Rust pronto, sem fluxo guiado na UI |
| 5 | Registrar identidade na infraestrutura | ❌ NÃO IMPLEMENTADO |
| 6 | Criar/obter credencial oficial de Holder | ❌ NÃO IMPLEMENTADO |
| 7 | Vincular carteira à participação na rede | ❌ NÃO IMPLEMENTADO |
| 8 | Acessar Holder Dashboard | 🟡 NodeDashboardPage existe (parcialmente mock) |
| 9 | Consultar governança e fundos | ❌ Sem rota no Node |
| 10 | Usar recursos de identidade, carteira e infra | 🟡 Parcial — vault sim, identidade não |

---

## 5. PERFIL FOUNDER — ESTADO NO CÓDIGO

### 5.1 O que existe relacionado ao Founder

| Componente | Estado | Referência |
|---|---|---|
| Conceito "Founder" | No subtitle do Cockpit: `'Administração Institucional & Fundadores'` | Apenas texto |
| Credencial Founder | ❌ NÃO EXISTE | — |
| Rota Founder Dashboard | A edição Cockpit usa `CockpitDashboardPage` | Funciona, mas dados mock |
| `role: "FOUNDER"` ou similar | ❌ NÃO EXISTE no código | — |
| Privilégios administrativos | ❌ Não verificados por código — qualquer um com o binário Cockpit acessa tudo | — |

### 5.2 O que o Founder precisaria e não tem

| Funcionalidade | Estado atual |
|---|---|
| Métricas reais de rede | ❌ Hardcoded |
| Visão de todos os Holders | ❌ NÃO IMPLEMENTADO |
| Gestão de governança | ❌ NÃO IMPLEMENTADO como rota |
| Relatórios institucionais | 🟡 Typst pronto no Rust, sem UI completa |
| Autenticação privilegiada | ❌ Sem distinção entre Founder e usuário comum do Cockpit |

---

## 6. MATRIZ 4-DIMENSÕES

```
                    EDIÇÃO NODE          EDIÇÃO COCKPIT
                 ┌──────────────────┬──────────────────────┐
PERFIL HOLDER    │  Destino correto  │   Não adequada       │
                 │  (parcialmente    │   (funcionalidades   │
                 │   implementado)   │   excessivas)        │
                 ├──────────────────┼──────────────────────┤
PERFIL FOUNDER   │  Não adequada     │  Destino correto     │
                 │  (sem ferramentas │  (totalmente mock)   │
                 │   administrativas)│                      │
                 └──────────────────┴──────────────────────┘
```

**Conclusão:** A arquitetura de separação Node/Cockpit está correta. Os perfis Holder/Founder **não existem como código** — são apenas conceitos no texto da UI e nos comentários. A implementação completa dos perfis é parte do roadmap para a Beta 1.0.

---

## 7. COMPARATIVO FINAL

| Atributo | NodeDashboardPage | CockpitDashboardPage |
|---|---|---|
| **Para quem** | Futuros Holders | Futuros Founders |
| **Dados reais** | Vault + IPFS + Device (via bridges) | Nenhum |
| **Dados mock** | Stake + Recompensa (2 métricas) | Tudo (4 métricas) |
| **Interatividade** | Botão "Sincronizar Motor" | Botões de navegação |
| **Dependências** | SystemBridge, WalletBridge, IpfsBridge | Apenas `useNavigate` |
| **Pronto para produção** | 🟡 Parcial | ❌ Apenas mockup |
| **Credencial de perfil** | ❌ Não implementada | ❌ Não implementada |

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*  
*Branch: `main` | HEAD: `6831a40`*

