# MATRIZ DE TESTABILIDADE MANUAL
## O que pode ser testado agora vs. requer integração

**Data:** 05/11/2026 | **Auditoria:** ORDEM 6 — Read-only

---

## 1. TESTÁVEL AGORA (sem dependências externas)

| Funcionalidade | Como testar | Resultado esperado |
|---|---|---|
| **Setup do Vault** (primeiro acesso) | Executar binário + criar senha ≥12 chars | Vault inicializado, login automático |
| **Login / Desbloqueio** | Executar binário + inserir senha | Estado READY_UNLOCKED |
| **Logout / Bloqueio** | Botão de logout no AccountDrawer | Estado READY_LOCKED |
| **Bootstrap — FATAL_ERROR** | Corromper devos_vault.sqlite | Exibe tela de erro com retry |
| **Bootstrap — TIMEOUT_WARNING** | Bloquear o IPC por mais de N segundos | Exibe aviso de timeout |
| **Node Dashboard (UI)** | Acessar `/` após login | Métricas parciais (vault real, IPFS offline, stake mock) |
| **Cockpit Dashboard (UI)** | Acessar `/` no binário Cockpit | 4 métricas hardcoded, 2 botões de navegação |
| **Navegação — Infrastructure** | Clicar em Infrastructure no sidebar | Renderiza InfrastructurePage |
| **Backup do Vault** | Usar função de backup no AccountDrawer | Gera arquivo de backup criptografado |
| **Restore do Vault** | Usar função de restore com arquivo válido | Restaura vault |
| **Real Estate Import (Cockpit)** | Abrir Cockpit → Banco Imobiliário → importar planilha | Import funciona |
| **Geração de PDF (Typst)** | Acionar ReconciliationReportButton (se acessível) | PDF gerado |
| **NotFoundView** | Navegar para rota inexistente | Exibe 404 |
| **WEB_PREVIEW mode** | Abrir `index.html` no browser sem Tauri | Banner de modo web + fallback |

---

## 2. TESTÁVEL APENAS COM KUBO INSTALADO

| Funcionalidade | Dependência |
|---|---|
| Status real do daemon IPFS | `kubo` instalado em PATH |
| Upload de arquivo para IPFS | Kubo ativo + repo inicializado |
| Download de CID | Kubo ativo |
| Pinning / Unpinning | Kubo ativo |
| Prova de armazenamento DePIN | Kubo ativo + desafio válido |
| Verificação de peers | Kubo ativo + rede IPFS |

---

## 3. TESTÁVEL APENAS COM JWT DA API

| Funcionalidade | Dependência |
|---|---|
| Treasury Analytics | JWT válido com role adequada |
| Citizen Ledger por ID | JWT válido + citizenId válido |
| Lista de Cidadãos | JWT válido |
| Dados reais de Tesouraria | JWT + API disponível |

---

## 4. NÃO TESTÁVEL (não implementado)

| Funcionalidade | Motivo |
|---|---|
| Credencial Holder | Não existe no código |
| Registro de identidade | Não existe no código |
| Governança DAO | Sem rota/view no Node |
| Wallet Genesis (wizard) | UI wizard não implementada |
| Auth Web3 | Lança exceção explícita |
| Fundos / participação DAO | Não implementado |

---

## 5. ROTAS QUEBRADAS (geram erro em vez de 404)

| Rota | Edição | Tipo de Falha |
|---|---|---|
| `/devos/cadastre` | Node | Tauri error: `RealEstateDatabase` state not managed |
| `/devos/database` | Node | Tauri error: `RealEstateDatabase` state not managed |
| `/real-estate` | Node | Tauri error: `RealEstateDatabase` state not managed |

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*

