# 🏛️ Matriz de Perfis de Participação: Founder vs Holder
## Auditoria dos Perfis e Diretrizes de Não-Duplicação de Dashboards

**Data:** 05/11/2026  
**Auditor:** ASPPIBRA DevOS Engine  
**Referência:** Fase 2 da Ordem 5.3  

---

## 1. Desambiguação Fundamental das Quatro Dimensões

Para garantir integridade arquitetural na versão Beta 1.0, o DevOS adota uma separação taxativa entre **Edição Nativa de Software** e **Perfil de Participação do Usuário**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        DEVOS ARCHITECTURE MATRIX                       │
├───────────────────────────────────┬────────────────────────────────────┤
│         EDIÇÕES NATIVAS           │       PERFIS DE PARTICIPAÇÃO       │
│      (Distribuição de Build)      │      (Credencial do Usuário)       │
├───────────────────────────────────┼────────────────────────────────────┤
│ • DevOS Node (Operador de Nó)     │ • Perfil Holder (Participante/Cota)│
│ • DevOS Cockpit (DAO Master)      │ • Perfil Founder (Fundador/Admin)  │
└───────────────────────────────────┴────────────────────────────────────┘
```

> **Regra de Ouro:**  
> A edição de software (Node ou Cockpit) define quais **recursos de baixo nível** estão compilados no executável (ex.: presença do banco `real_estate.sqlite` ou capacidade `cockpit-real-estate`).  
> O perfil (Founder ou Holder) define o **nível de autorização e visão de negócio** do participante sobre os módulos ativos, através de sua credencial digital e carteira Genesis.  
> **Não se deve criar quatro aplicativos nem duplicar código de telas que possam ser compartilhadas via controle de permissões (RBAC).**

---

## 2. Levantamento do Estado Atual no Código-Fonte

A busca textual por termos relacionados a perfis no frontend e backend revelou:

1. **Ocorrência de `Holder`:**
   - [src/pages/devos/infrastructure-page.tsx](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/pages/devos/infrastructure-page.tsx#L145-L359): Apresenta o selo `"DEPIN • PROOF-OF-STAKE • HOLDERS ATIVOS"` e o campo descritivo `"Holder / Operador:"` ao detalhar os nós de armazenamento da rede.
2. **Ocorrência de `Founder`:**
   - [src/app/editions/edition.cockpit.ts](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/app/editions/edition.cockpit.ts#L13): Contém o subtítulo `"Administração Institucional & Fundadores"`.
3. **Ausência de Controle Dinâmico por Credencial:**
   - No estado atual, o sistema **não possui** um `RoleGuard` ou seletor dinâmico que alterne a experiência entre Founder e Holder em tempo de execução com base no certificado digital do usuário.
   - A distinção visual atualmente ocorre de forma fixa em tempo de build (via `@edition` entre `dist-node` e `dist-cockpit`).

---

## 3. Matriz Comparativa de Recursos: Founder x Holder

Abaixo está o mapeamento dos recursos previstos para a versão Beta 1.0 e seu status de implementação:

| Recurso / Módulo | Perfil Founder | Perfil Holder | Componente Compartilhado | Situação Atual |
|---|---|---|---|---|
| **Dashboard Principal** | Visão Executiva DAO / Cluster / Reservas | Telemetria do Nó / Staking / Cotas | Base MUI + Cards Glassmorphism | `CockpitDashboardPage` (Founder) / `NodeDashboardPage` (Holder) |
| **Governança Institucional** | Voto com peso de fundador, criação de propostas | Voto comunitário, consulta de propostas | `LedgerView` / Módulo DAO | 🟡 Parcialmente implementado em UI |
| **Fundos e Tesouraria** | Gestão de tesouraria, alocação e autorização | Consulta de saldo de cotas e rendimentos | `WalletsLandingView` | 🟡 Parcialmente implementado em UI |
| **Identidade Digital** | Emissão de certificados master, auditoria | Consulta do `.dvcert` pessoal | `HostIntegrityCard` | ❌ Visualizador de identidade pendente |
| **Wallet & Custódia** | Múltiplas carteiras, chave mestre institucional | Carteira pessoal Genesis do nó | Módulo `wallets` e `vault` | ✅ Derivação BIP-32/44 pronta no Rust |
| **Extrato e Livro-Razão** | Livro-razão global com auditoria fiscal | Extrato das operações da própria cota | `LedgerView` | 🟡 Implementado em modo leitura |
| **Documentos Contratuais** | Minuta, aprovação e assinatura de cessões | Visualização e download de contratos próprios | `CessaoPosseView` | ✅ Renderer Typst operacional no Rust |
| **Nó IPFS** | Monitoramento de pinning da rede e da DAO | Pinning de dados locais e comprovantes | `IpfsView` | 🟡 UI pronta, integração de daemon pendente |
| **Administração de Hubs** | Seleção e importação territorial de cidades | Apenas consulta pública de cidades ativas | `TerritorialHubSelector` | ✅ Componente pronto no Cockpit |
| **Configurações Gerais** | Parâmetros de rede, endpoints e backups | Configurações locais do nó e senha | `Settings` | 🟡 Básico implementado |

---

## 4. Natureza das Diferenças Identificadas

1. **Diferenças Visuais:**
   - Títulos institucionais (`DevOS Admin` vs `DevOS Node`).
   - Métricas de topo (Cluster global vs Recursos do hardware local).
2. **Diferenças Funcionais:**
   - Edição de minutas contratuais e importação de planilhas imobiliárias (exclusivo Founder/Cockpit).
   - Ingestão de dados e auditoria de blocos da rede DePIN.
3. **Diferenças Baseadas em Permissões / Credenciais:**
   - No futuro, quando o certificado `.dvcert` for emitido, a assinatura criptográfica de desafios de login deverá retornar o claim de perfil (`role: "FOUNDER" | "HOLDER"`).

---

## 5. Recomendação Arquitetural para a Beta 1.0

- **NÃO DUPLICAR APLICATIVOS:** Manter o projeto unificado.
- Para a experiência inicial de apresentação visual no Workspace da Área de Trabalho, os dois perfis devem ser documentados em `00 - INFORMAÇÕES/LEIA-ME.md` com total transparência.
- A transição entre os perfis deverá ser acionada via credencial de sessão, sem exigir builds separados para usuários finais que operem no mesmo computador.

