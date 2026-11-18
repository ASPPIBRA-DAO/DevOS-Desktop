# Auditoria Arquitetural Completa — Central de Identidade Digital (DevOS Desktop)

## 1. Resumo Executivo

Este documento consolida a **auditoria arquitetural profunda e exaustiva** da seção **Central de Identidade Digital / Minha Conta** do DevOS Desktop, cobrindo integralmente as 5 abas operacionais do sistema:

1. **Aba 1 — Perfil Geral / Identidade Civil** (`/user/account`)
2. **Aba 2 — Notificações** (`/user/account/notifications`)
3. **Aba 3 — Redes Sociais** (`/user/account/socials`)
4. **Aba 4 — Segurança** (`/user/account/change-password`)
5. **Aba 5 — Autenticador 2FA** (`/user/account/2fa`)

A auditoria foi conduzida através de análise estática e dinâmica de código-fonte, rastreando cada rota desde o ponto de entrada no Vite/React Router, passando por layouts, páginas, views, componentes, hooks, esquemas Zod, pontes IPC do Tauri, backend nativo em Rust (`src-tauri`), migrations e banco de dados SQLite criptografado (`devos_vault.sqlite`).

---

## 2. Escopo e Metodologia

O levantamento cobriu 100% da árvore de dependências direta e transitiva da seção:
- **Frontend SPA:** React 19 (`19.1.1`), TypeScript 6 (`6.0.2`), Vite 8 (`8.0.8`), Material UI 9 (`@mui/material: ^9.0.0`), React Hook Form 7 (`7.63.0`), Zod 3.25 (`3.25.76`), React Router v7 (`7.9.3`).
- **IPC & Runtime Desktop:** Tauri v2 (`@tauri-apps/api: 2.2.0`, `tauri-build: 2.7.1`).
- **Backend Nativo (Rust):** Rust 2024 / 1.92, `rusqlite: 0.32` (bundled), `aes-gcm: 0.10`, `argon2: 0.5`, `zeroize: 1.8`, `tokio: 1.0`.
- **Persistência:** SQLite WAL local criptografado (`user_profiles`, `vault_header`, `vault_secrets`) e `localStorage` legado com rotina de migração atômica e verificação de integridade bidirecional.

---

## 3. Principais Descobertas Arquiteturais por Aba

| Dimensão | Diagnóstico Arquitetural |
|---|---|
| **Aba 1 (Perfil Geral)** | **Homologada / Pronta para Produção:** Arquitetura madura com store reativo (`useAccountFacade`), isolamento de requisições por geração de sessão, migração segura com verificação de integridade bidirecional, eliminação de PII em logs e persistência cifrada (envelope AES-256-GCM) no SQLite local via Tauri IPC. |
| **Aba 2 (Notificações)** | **Simulação / Mock:** Componente visual funcional (`AccountNotifications`), mas sem persistência em banco, sem comunicação IPC com Rust e sem conexão com daemon de mensageria. A submissão apenas exibe `toast.success` em memória. |
| **Aba 3 (Redes Sociais)** | **Homologada / Conectada:** Validação estrita de protocolo HTTPS, allowlist rígida de domínios (`ALLOWED_HOSTS`), limite de 2.048 caracteres, integrada via `AccountSocialsView` diretamente ao store `useAccountFacade` e persistida via `IdentityBridge.saveUserProfile` no SQLite cifrado do cofre nativo. |
| **Aba 4 (Segurança)** | **Interface Refatorada / Backend Desconectado:** Política de senhas alinhada ao NIST SP 800-63B (mínimo 15 caracteres, Unicode escalar, rejeição de repetição), alternadores visuais independentes de senha. No entanto, a página de entrada não injeta `onChangePassword`, desabilitando o botão de envio; ademais, o backend nativo Rust não possui comando exposto para alteração da senha mestre. |
| **Aba 5 (Autenticador 2FA)** | **Mock Crítico / Risco P0:** Apresenta chave TOTP fixa hardcoded (`JBSWY3DPEHPK3PXP`), QR Code puramente visual estático, aceita qualquer código de 6 dígitos sem validação RFC 6238, e vincula carteira Web3/Google/GitHub apenas no store local sem prova de posse criptográfica (EIP-712 ou OAuth). |

---

## 4. Índice dos Relatórios Gerados

| Arquivo | Descrição |
|---|---|
| [ROUTE-MAP.md](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/docs/audits/account-tabs-production-map/ROUTE-MAP.md) | Mapeamento completo de rotas, layouts, guards de inicialização do cofre e navegação. |
| [COMPONENT-INVENTORY.md](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/docs/audits/account-tabs-production-map/COMPONENT-INVENTORY.md) | Inventário exaustivo de todos os componentes da seção, props, estados e responsabilidades. |
| [DEPENDENCY-MAP.md](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/docs/audits/account-tabs-production-map/DEPENDENCY-MAP.md) | Árvore de dependências e diagramas de fluxo Mermaid (geral, por aba e compartilhado). |
| [SERVICES-AND-API.md](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/docs/audits/account-tabs-production-map/SERVICES-AND-API.md) | Inventário de hooks, bridges, chamadas Tauri IPC, serviços de autenticação e stores. |
| [BACKEND-AND-STORAGE.md](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/docs/audits/account-tabs-production-map/BACKEND-AND-STORAGE.md) | Mapeamento de comandos Tauri em Rust, gerenciamento de cofre, tabelas SQLite e migrações. |
| [SECURITY-AUDIT.md](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/docs/audits/account-tabs-production-map/SECURITY-AUDIT.md) | Matriz de riscos e vulnerabilidades (P0 a P3), achados com linha exata e recomendações. |
| [FUNCTIONAL-STATUS.md](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/docs/audits/account-tabs-production-map/FUNCTIONAL-STATUS.md) | Classificação detalhada do status de cada funcionalidade (Real, Mock, Parcial, Interface). |
| [TEST-COVERAGE.md](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/docs/audits/account-tabs-production-map/TEST-COVERAGE.md) | Inventário de testes automatizados unitários/integração e status de execução no Vitest e Cargo. |
| [PRODUCTION-READINESS.md](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/docs/audits/account-tabs-production-map/PRODUCTION-READINESS.md) | Matriz consolidada de prontidão para produção, bloqueadores P0/P1 e plano de remediação. |
| [component-inventory.json](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/docs/audits/account-tabs-production-map/component-inventory.json) | Inventário estruturado em formato JSON para automações, verificações e linters de conformidade. |
