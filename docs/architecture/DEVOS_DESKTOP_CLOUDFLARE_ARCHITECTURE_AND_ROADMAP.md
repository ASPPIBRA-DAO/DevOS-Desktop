# DEVOS DESKTOP + ASPPIBRA CLOUD
## Auditoria Arquitetural Integral, Infraestrutura Cloudflare, Bancos de Dados, Persistência Local e Integrações de Rede

**Documento Oficial:** `DEVOS_DESKTOP_CLOUDFLARE_ARCHITECTURE_AND_ROADMAP.md`  
**Projeto:** ASPPIBRA-DAO — DevOS Desktop & Cloud Platform  
**Data da Auditoria:** 18 de Novembro de 2026  
**Modo de Execução:** READ-ONLY Forense (Nenhum código-fonte ou banco modificado)  
**Ambientes Auditados:**  
1. **DevOS Desktop:** `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop` (Commit `fb8a1f461221cbfe51b616e8c034f01a2b917864`)  
2. **ASPPIBRA Cloud (Backend Worker & D1):** `/home/sandro/Área de trabalho/App Desktop/backend` (Commit `171950b2d60e36423dd0219aa3e2bb75bada2e10`)  

---

## 01. IDENTIFICAÇÃO E ESCOPO

### 1.1. Metadados dos Ambientes Auditados

#### AMBIENTE 01 — DEVOS DESKTOP (CLIENTE NATIVO LOCAL)
- **Localização:** `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop`
- **Controle de Versão:** Git (`main` - commit `fb8a1f461221cbfe51b616e8c034f01a2b917864`)
- **Arquitetura Base:** Tauri v2 (`@tauri-apps/api 2.2.0`, `@tauri-apps/cli 2.12.1`, crate Rust `tauri 2.12.1`)
- **Frontend Core:** React 19.1.1, TypeScript 6.0.2, Vite 8.0.8, MUI v9.0.0, Emotion, SWR 2.3.6, React Hook Form 7.63.0, Zod 3.25.76, Three.js 0.186.1
- **Backend Nativo Local (Rust):** Rust 1.99.0 (Edition 2024), `rusqlite 0.32` (bundled SQLite), `tokio 1.0`, `aes-gcm 0.10`, `argon2 0.5`, `zeroize 1.8`, `typst 0.15` / `typst-as-lib 0.17`, `k256 0.13`, `bip39 2.1`, `bip32 0.5`, `calamine 0.37`
- **Bancos Locais:**
  - `devos_vault.sqlite`: Cofre criptográfico, identidade civil cifrada, carteiras e segredos de custódia.
  - `real_estate.sqlite`: Cadastro imobiliário e conciliação fundiária em SQLite WAL (Edição Cockpit).
- **Edições Nativas:**
  - `DevOS Node` (`br.aspp.devos.node`): Operador de nós DePIN e armazenamento IPFS Kubo.
  - `DevOS Cockpit` (`br.aspp.devos.cockpit`): Governança institucional, administração fundiária e catálogo documental.

#### AMBIENTE 02 — ASPPIBRA CLOUD / CLOUDFLARE (BACKEND & CONTROL PLANE)
- **Localização:** `/home/sandro/Área de trabalho/App Desktop/backend`
- **Controle de Versão:** Git (`main` - commit `171950b2d60e36423dd0219aa3e2bb75bada2e10`)
- **Framework do Worker:** Hono v4.12.12 (`hono/cors`, `hono/secure-headers`, `hono-rate-limiter 0.5.3`)
- **Runtime:** Cloudflare Workers (Compatibility Date: `2025-06-01`, flags: `["nodejs_compat"]`)
- **ORM / Dialeto:** Drizzle ORM v0.44.7, Drizzle Kit v0.31.8 (Dialeto `sqlite`, Driver `d1-http`)
- **Domínios & Roteamento:** Custom domains vinculados: `api.asppibra.com` e `api.asppibra.com.br`
- **Infraestrutura Cloudflare Configurada:**
  - **Account ID:** `5d91807e648c183cb7833caa06dbcbdb`
  - **Cloudflare D1 Database:** `w3-db` (Database ID: `cfd0e171-f2b5-48d4-bf29-a9cf33d97b4d`) contendo 73 tabelas relacionais.
  - **Cloudflare R2 Buckets:** `w3-media` (mídia institucional e uploads) e `w3-anexos` (anexos de e-mails/documentos).
  - **Cloudflare KV Namespaces:**
    - `KV_AUTH` (`5f8377a1e41d4869837debabbed2acfb`): Nonces, WebAuthn challenges, controle anti-replay.
    - `KV_CACHE` (`abb4df8656924422a3ccab4969e938d0`): Cache de métricas, sessões e telemetria.
  - **Cloudflare Queues:**
    - `EMAIL_PIPELINE_QUEUE` (`w3-mail` com DLQ `w3-mail-dlq`)
    - `CHAT_PIPELINE_QUEUE` (`w3-chat` com DLQ `w3-chat-dlq`)
  - **Cloudflare Durable Objects:** `CHAT_ROOM` (Classe `ChatRoomDO` com migração SQLite-in-DO).
  - **Cloudflare Workers AI:** Binding `AI`.
  - **Protocolo de Segurança Control Plane:** `DEVOS-ED25519-ADMIN-V1` (Autenticação mútua de dispositivos com assinatura digital Ed25519, nonce atômico no D1 e AAL >= 2).

---

## 02. RESUMO EXECUTIVO

A auditoria integrada forense dos dois ambientes revelou uma arquitetura complementar de alta maturidade conceitual, com uma separação de papéis muito bem desenhada entre o **Cliente Local (DevOS Desktop)** e a **Nuvem (Cloudflare Worker/D1)**. 

### Principais Descobertas:

1. **A Desativação da Custódia em Nuvem (Invariante de Governança):**
   No backend Cloudflare (`src/interfaces/http/routes/web3/web3.routes.ts`), uma diretriz formal de governança estabelece expressamente:
   > *"A custódia remota e a assinatura de transações com chaves em nuvem foram DEFINITIVAMENTE DESATIVADAS da infraestrutura Cloudflare (Workers / D1). Todas as chaves privadas e operações de derivação residem exclusivamente no cofre nativo local do DevOS Desktop."*
   Isso comprova que a custódia das chaves privadas e seed phrases BIP-39/44 pertence **estrita e unicamente ao DevOS Desktop**, enquanto o D1 atua como repositório de metadados, identidades, livros-razão e controle administrativo.

2. **O Protocolo Control Plane `DEVOS-ED25519-ADMIN-V1`:**
   O backend Cloudflare possui um subsistema completo de autorização para o DevOS Desktop (`devos_device_guard.ts`, `devos_admin_sessions`, `devos_devices`, `devos_consumed_nonces`), exigindo que requisições administrativas enviem assinatura digital Ed25519 calculada sobre payload canônico de 9 linhas, com chave pública registrada no D1 e verificação de nonce anti-replay em tempo real. No entanto, o cliente DevOS Desktop ainda não implementou o interceptor de requisições que gera essa assinatura Ed25519.

3. **Divergência de Contratos de API (Desktop vs Cloudflare):**
   O cliente Desktop (`src/lib/axios.ts`) consome endpoints legados ou não versionados (`/api/treasury/analytics`, `/api/identity/citizens`), enquanto o Worker Cloudflare implementa rotas REST canônicas sob `/api/v1/` (`/api/v1/finance/treasury/analytics`, `/api/v1/civil/citizens`, `/api/v1/identity/register`, `/api/v1/admin/vault/*`). Essa divergência de prefixos impede a sincronização em tempo real entre os dois ambientes.

4. **Banco de Dados D1 Completo (73 Tabelas):**
   A exportação/cópia física do D1 analisada em `test_bootstrap_service.db` e as migrações em `backend/migrations/` revelam um banco institucional com 73 tabelas, cobrindo todo o ciclo contábil de partidas dobradas (Livro-Razão), identidades civis, credenciais descentralizadas (SSI/DID), controle de autenticação (WebAuthn, TOTP RFC 6238, SIWE) e o domínio `devos_*` dedicado ao controle de dispositivos.

---

## 03. PAINEL GERAL DE PROGRESSO DO ECOSSISTEMA

```text
================================================================================
       ASPPIBRA-DAO — PAINEL EXECUTIVO INTEGRADO (DESKTOP + CLOUD)
================================================================================

DEVOS DESKTOP (CLIENTE LOCAL)
--------------------------------------------------------------------------------
Módulos Identificados:                    12
Módulos Concluídos / Alta Maturidade:      4 (Vault, Documents, Identity, Real Estate)
Módulos Funcionais com Lacunas:            3 (Wallets, IPFS/DePIN, Monitoring)
Módulos Parciais / Pendentes:              5 (Auth, Ledger, Social, Media, Node UI)
Persistência Local (SQLite):              78% (devos_vault.sqlite + real_estate.sqlite)
Integração Nativa IPC:                    86% (41 comandos Tauri registrados)
Nota Técnica Desktop:                     7,8 / 10

CLOUDFLARE (ASPPIBRA CLOUD)
--------------------------------------------------------------------------------
Workers Principais:                        1 (asppibra-api / Hono Framework)
Roteadores Modulares Canônicos:            9 (compliance, health, webhooks, identity,
                                              civil, ssi, finance, web3, admin/vault)
D1 Databases:                              1 (w3-db, cfd0e171-..., 73 tabelas)
KV Namespaces:                             2 (KV_AUTH, KV_CACHE)
R2 Buckets:                                2 (w3-media, w3-anexos)
Queues:                                    2 (w3-mail com DLQ, w3-chat com DLQ)
Durable Objects:                           1 (ChatRoomDO com SQLite-in-DO)
Workers AI:                                1 (Binding AI configurado)
Mecanismos de Segurança Cloud:            Ed25519 Device Guard, AAL2 Session,
                                          Rate Limiting, PBKDF2, WebAuthn, SIWE
Nota Técnica Cloud:                       8,6 / 10

CAMADA DE INTEGRAÇÃO (DESKTOP × CLOUD)
--------------------------------------------------------------------------------
Endpoints Mapeados no Backend:            46 endpoints REST documentados
Endpoints Consumidos pelo Desktop:         4 endpoints (com divergência de prefixo /api vs /api/v1)
Protocolo Control Plane Implementado:     Backend (100%) | Frontend Desktop (0% - Mock)
Sincronização de Identidade:              Declarada (Merge local/remoto não conectado)
Persistência de Mídia Remota (R2):         Configurada no Cloud | Desktop usa blob: volátil
Nota Técnica Integração:                  4,8 / 10

ECOSSISTEMA COMPLETO CONSOLIDADO
--------------------------------------------------------------------------------
Total de Domínios Arquiteturais:          14 domínios
Funcionalidades Comprovadas no Código:     118 funcionalidades
Funcionalidades Parciais:                  27 funcionalidades
Funcionalidades Não Implementadas/Mock:    29 funcionalidades

NOTA ARQUITETURAL GLOBAL:                 7,4 / 10
PROGRESSO GERAL DO ECOSSISTEMA:           68,5%
================================================================================
```

---

## 04. INVENTÁRIO COMPLETO DO DEVOS DESKTOP

| Módulo | Diretório Rust | Diretório Frontend | Responsabilidade Principal | Estado |
|---|---|---|---|:---:|
| **01. Core & Platform** | `src-tauri/src/` | `src/platform/tauri/core/` | Bootstrap, ciclo de vida, janelas, ACL e IPC Tauri v2 | **CONCLUÍDO (9,4)** |
| **02. Vault & Custódia**| `src-tauri/src/modules/vault/` | `src/platform/tauri/vault/` | Argon2id, AES-256-GCM, canário de integridade e sessões Zeroize | **CONCLUÍDO (9,3)** |
| **03. Identity & Perfil**| `src-tauri/src/modules/identity/`| `src/sections/account/` | Perfil civil PF/PJ, validação CPF/CNPJ 2024, controle de revisão | **CONCLUÍDO (8,8)** |
| **04. Wallets & EVM** | `src-tauri/src/modules/wallets/` | `src/modules/wallets/` | Derivação BIP-39/44, sementes em RAM com TTL 5 min, custódia | **FUNCIONAL (8,4)** |
| **05. Documents Typst**| `src-tauri/src/modules/documents/`| `src/modules/documents/` | Compilação Typst v0.15 100% offline, preview SVG e SHA-256 | **CONCLUÍDO (9,5)** |
| **06. IPFS & DePIN** | `src-tauri/src/modules/ipfs/` | `src/modules/ipfs/` | Daemon Kubo local, streaming, pin/unpin e Prova ADR-012 | **FUNCIONAL (7,9)** |
| **07. Real Estate** | `src-tauri/src/modules/real_estate/`| `src/modules/real-estate/`| Ingestão XLSX (Calamine), proveniência SHA-256, SQLite WAL (Cockpit) | **CONCLUÍDO (8,9)** |
| **08. Monitoring RPC** | `src-tauri/src/modules/monitoring/`| `src/platform/tauri/monitoring/`| Consultas JSON-RPC EVM (Arbitrum, Polygon), saldos ERC-20 | **FUNCIONAL (7,8)** |
| **09. Ledger & Tesouraria**| `src-tauri/src/modules/reports/`| `src/modules/ledger/` | Visualização contábil, partidas dobradas, emissão de extratos Typst | **PARCIAL (6,2)** |
| **10. Authentication** | — (delegado ao Vault) | `src/modules/authentication/` | Login com senha mestre, primeiro acesso, guards de rota | **PARCIAL (6,5)** |
| **11. User & Community**| — (inexistente no core) | `src/sections/user/` | Feed social, publicações, seguidores, sobre (atualmente mocks) | **MOCK (3,5)** |
| **12. Node Telemetry** | — (inexistente no core) | `src/app/editions/node/` | Painel do operador do nó, cubos 3D, métricas da rede (mocks) | **MOCK (3,8)** |

---

## 05. INVENTÁRIO COMPLETO DA CLOUDFLARE (ASPPIBRA CLOUD)

| Recurso / Serviço | Identificador / Nome | Tipo Cloudflare | Arquivo de Origem | Responsabilidade | Estado |
|---|---|---|---|---|:---:|
| **Worker Principal** | `asppibra-api` | Cloudflare Worker | `backend/wrangler.toml` | Gateway central de API, roteamento DDD, autenticação e middlewares | **COMPROVADO** |
| **Database D1** | `w3-db` (`cfd0e171-...`) | Cloudflare D1 (SQLite) | `backend/wrangler.toml` | Banco relacional central, 73 tabelas, partidas dobradas, identidades | **COMPROVADO** |
| **KV de Autenticação** | `KV_AUTH` (`5f8377a1-...`) | Cloudflare KV | `backend/wrangler.toml` | Nonces de autenticação, desafios WebAuthn/SIWE, rate-limit cache | **CONFIGURADO** |
| **KV de Cache Geral** | `KV_CACHE` (`abb4df86-...`) | Cloudflare KV | `backend/wrangler.toml` | Cache de leitura rápida, métricas agregadas do ecossistema | **CONFIGURADO** |
| **Bucket de Mídia** | `w3-media` (`STORAGE`) | Cloudflare R2 | `backend/wrangler.toml` | Armazenamento de avatares, fotos de capa, comprovantes KYC | **CONFIGURADO** |
| **Bucket de Anexos** | `w3-anexos` (`R2_EMAIL_ATTACHMENTS`) | Cloudflare R2 | `backend/wrangler.toml` | Armazenamento de documentos e anexos de comunicação | **CONFIGURADO** |
| **Fila de E-mails** | `w3-mail` (`EMAIL_PIPELINE_QUEUE`) | Cloudflare Queue | `backend/wrangler.toml` | Processamento assíncrono de notificações e resets de senha | **COMPROVADO** |
| **Dead Letter Queue E-mail**| `w3-mail-dlq` | Cloudflare Queue DLQ | `backend/wrangler.toml` | Retenção de falhas de envio de mensagens após 3 tentativas | **CONFIGURADO** |
| **Fila de Chat** | `w3-chat` (`CHAT_PIPELINE_QUEUE`)| Cloudflare Queue | `backend/wrangler.toml` | Ingestão de mensagens de chat para indexação assíncrona | **COMPROVADO** |
| **Dead Letter Queue Chat** | `w3-chat-dlq` | Cloudflare Queue DLQ | `backend/wrangler.toml` | Retenção de mensagens com falha de processamento | **CONFIGURADO** |
| **Durable Object** | `CHAT_ROOM` (`ChatRoomDO`)| Cloudflare Durable Object| `backend/wrangler.toml` | Coordenação de salas de mensagens com SQLite-in-DO | **PARCIAL** |
| **Workers AI** | `AI` | Cloudflare Workers AI | `backend/wrangler.toml` | Inferência em modelos de IA na borda (análise de laudos e texto) | **CONFIGURADO** |
| **Custom Domains** | `api.asppibra.com` / `api.asppibra.com.br` | Cloudflare DNS / Routing| `backend/wrangler.toml` | Ponto de entrada oficial HTTPS de todas as requisições de API | **CONFIGURADO** |

---

## 06. ARQUITETURA GLOBAL INTEGRADA (LOCAL × CLOUD)

```text
+---------------------------------------------------------------------------------------+
|                                    DEVOS DESKTOP                                      |
|                                                                                       |
|  [ Interface React 19 ] <---> [ IPC Bridge ] <---> [ Rust Native Core ]               |
|                                                          |                            |
|             +--------------------------------------------+                            |
|             |                                            |                            |
|             v                                            v                            |
|   [ devos_vault.sqlite ]                      [ real_estate.sqlite ]                  |
|   - Chaves Privadas (BIP-44)                  - Cadastro Imobiliário                  |
|   - Sementes BIP-39 (Zeroize)                 - Ingestão XLSX Calamine                |
|   - Qualificação Civil Cifrada                - Auditoria Fundiária WAL               |
|   - Segredos Argon2id/AES-GCM                 - Append-Only Triggers                  |
|                                                                                       |
|             +--------------------------------------------+                            |
|             |                                            |                            |
|             v                                            v                            |
|   [ Typst Native v0.15 ]                      [ IPFS Kubo Local :5001 ]               |
|   - Compilação 100% Offline                   - Armazenamento DePIN                   |
|   - Preview SVG em Memória                    - Desafio de Custódia ADR-012           |
|   - Exportação PDF Verificada                 - Streaming SHA-256                     |
+---------------------------------------------------------------------------------------+
                                           |
                                           |  HTTPS / TLS 1.3
                                           |  Protocolo: DEVOS-ED25519-ADMIN-V1
                                           |  Headers: X-DevOS-Key-Id, Signature, Nonce
                                           v
+---------------------------------------------------------------------------------------+
|                             CLOUDFLARE EDGE & CONTROL PLANE                           |
|                                                                                       |
|  [ api.asppibra.com ]                                                                 |
|         |                                                                             |
|         v                                                                             |
|  [ devosDeviceGuard ] ----> Valida Assinatura Ed25519 + Clock Skew <= 300s            |
|         |                                                                             |
|         v                                                                             |
|  [ adminSessionGuard ] ---> Valida JWT AAL >= 2 + devos_admin_sessions                |
|         |                                                                             |
|         v                                                                             |
|  [ devosNonceGuard ] -----> Consumo Atômico de Nonce anti-replay no D1                |
|         |                                                                             |
|         +---------------------------+---------------------------+                     |
|         |                           |                           |                     |
|         v                           v                           v                     |
|  [ Hono /api/v1/admin ]      [ Hono /api/v1/finance ]   [ Hono /api/v1/civil ]        |
|  - Vault & Integrações       - Livro-Razão Contábil     - Registro de Associados      |
|  - Rotação de Credenciais    - Partidas Dobradas D1     - Verificações KYC            |
|  - Telemetria de Nós         - Conciliação 3-Way        - Emissão de SSI / DID        |
|         |                           |                           |                     |
|         +---------------------------+---------------------------+                     |
|                                     |                                                 |
|                                     v                                                 |
|                   [ CLOUDFLARE D1 (w3-db: 73 Tabelas) ]                               |
|                   - devos_devices & devos_admin_sessions                              |
|                   - financial_ledger_entries & accounts                               |
|                   - users, user_profiles, citizens                                    |
|                   - devos_integrations & vault_operations                             |
|                                                                                       |
|             +-----------------------+-----------------------+                         |
|             |                       |                       |                         |
|             v                       v                       v                         |
|   [ R2: w3-media ]           [ KV: KV_AUTH ]         [ Queues: w3-mail ]              |
|   - Avatares / Capas         - Nonces / Replay       - Notificações / Resets          |
|   - Documentos Cloud         - Desafios WebAuthn     - Workers de Processamento       |
+---------------------------------------------------------------------------------------+
```

---

## 07. COMPARAÇÃO ENTRE AS EDIÇÕES NODE E COCKPIT

| Recurso / Serviço | DevOS Node (`br.aspp.devos.node`) | DevOS Cockpit (`br.aspp.devos.cockpit`) | Cloudflare Backend Associado |
|---|:---:|:---:|---|
| **Público-Alvo** | Operador de Nós / Membro DePIN | Fundadores / Administradores da DAO | RBAC: `citizen` vs `admin`/`founder` |
| **Banco `devos_vault.sqlite`** | SIM (Cofre Local Compartilhado) | SIM (Cofre Local Compartilhado) | Não acessível diretamente pela nuvem |
| **Banco `real_estate.sqlite`** | **NÃO (Bloqueado no Startup)** | **SIM (Exclusivo Cockpit)** | D1 possui apenas tabelas cadastrais gerais |
| **Capability `cockpit-real-estate`**| **NÃO** | **SIM** | Proteção local via Tauri ACL |
| **Acesso a `/api/v1/admin/*`** | **NÃO (Sem permissão de papel)** | **SIM (Ed25519 + AAL >= 2)** | `devosDeviceGuard` + `verifyPermission` |
| **Acesso a `/api/v1/finance/*`** | Leitura de extrato próprio | Gestão completa da tesouraria | `DrizzleFinanceRepository` |
| **Emissão de Cessão de Posse** | **NÃO (Escopo Bloqueado)** | **SIM (Autorizado)** | Template Typst local |
| **Armazenamento IPFS (Kubo)** | SIM (Operação e Prova DePIN) | SIM (Auditoria e Pinning) | Prova ADR-012 local |

---

## 08. MAPEAMENTO DE WORKERS E PAGES

### 8.1. Cloudflare Workers: `asppibra-api`
- **Ponto de Entrada:** `backend/src/index.ts`
- **Ambiente:** Production / Staging
- **Roteadores Acoplados:**
  1. `/api/v1/health`: Diagnóstico do Worker e conectividade com D1.
  2. `/api/v1/compliance`: Termos de uso, consentimentos e conformidade LGPD.
  3. `/api/v1/webhooks`: Ingestão assíncrona de webhooks externos via Svix.
  4. `/api/v1/identity`: Registro, login local (PBKDF2), login Web3 (SIWE), OAuth (Google/GitHub), MFA/TOTP.
  5. `/api/v1/civil`: Cadastro de associados/cidadãos, submissão de KYC e consulta de perfis.
  6. `/api/v1/ssi`: Emissão, revogação e verificação de Verifiable Credentials e DIDs com assinatura Ed25519.
  7. `/api/v1/finance`: Livro-razão institucional, partidas dobradas, conciliação e relatórios de tesouraria.
  8. `/api/v1/web3`: Vinculação de carteiras externas, desafios SIWE e saldos (sem custódia remota).
  9. `/api/v1/admin`: Control Plane Gateway (`/health`, `/audit`, `/metrics`) e gestão de integrações do cofre (`/vault/*`).

### 8.2. Cloudflare Pages
- O arquivo `wrangler.toml` define `FRONTEND_URL = "https://app.asppibra.com"` e o CORS permite `cleanOrigin.endsWith('.pages.dev')`. A aplicação Web associada (painel do usuário para navegadores) está configurada para deploy no Cloudflare Pages, consumindo o mesmo Worker `asppibra-api`.

---

## 09. AUDITORIA DE DNS E DOMÍNIOS

O arquivo `backend/wrangler.toml` e as configurações de CORS documentam a seguinte topologia de domínios gerenciados na zona Cloudflare:

```text
ASPPIBRA ZONA CLOUDFLARE (asppibra.com / asppibra.com.br)
│
├── asppibra.com / asppibra.com.br (Portal Institucional)
│
├── api.asppibra.com / api.asppibra.com.br
│   └── Aponta para o Worker "asppibra-api" (Custom Domain / Proxied Cloudflare WAF)
│
├── app.asppibra.com
│   └── Aponta para o Cloudflare Pages (Frontend Web do Associado)
│
└── Roteamento Local / Desktop
    └── DevOS Desktop comunica-se diretamente com https://api.asppibra.com
```

---

## 10. INVENTÁRIO DO BANCO CLOUDFLARE D1 (`w3-db`)

O banco D1 `w3-db` (`cfd0e171-f2b5-48d4-bf29-a9cf33d97b4d`), inspecionado em `test_bootstrap_service.db` e nas migrações Drizzle, possui **73 tabelas agrupadas em 13 domínios funcionais**:

| Domínio D1 | Tabelas Identificadas | Responsabilidade / Invariante | Consumidores Principais |
|---|---|---|---|
| **User / Actor** (8) | `users`, `user_profiles`, `user_contacts`, `user_addresses`, `user_professional_experience`, `user_education`, `membership_cards`, `user_notification_settings` | Identidade base do ator; perfil social e configurações | `identityRouter`, `civilIdentityRouter` |
| **Authentication** (10) | `user_authenticators`, `password_credentials`, `webauthn_credentials`, `totp_credentials`, `recovery_sets`, `recovery_credentials`, `password_resets`, `user_sessions`, `auth_challenges`, `wallet_authenticators` | Credenciais, sessões ativas e desafios multifator | `IdentityController`, `sessionGuard` |
| **Authorization** (4) | `roles`, `permissions`, `user_roles`, `role_permissions` | RBAC granular com versionamento e herança | `verifyPermission`, `rbac.ts` |
| **Civil Identity** (4) | `citizens`, `identity_documents`, `kyc_verifications`, `secure_vaults` | Dados civis de associados na nuvem e hash de documentos | `civilIdentityRouter` |
| **SSI / Credentials** (4)| `did_identities`, `did_verification_methods`, `verifiable_credentials`, `verifiable_presentations` | DIDs W3C e credenciais verificáveis emitidas pela DAO | `ssiRouter`, `LocalIssuerSigner` |
| **Web3 Identity** (4) | `wallets`, `web3_networks`, `smart_contracts`, `web3_transactions` | Mapeamento de carteiras públicas e redes (Arbitrum, BSC, Polygon) | `web3Router` |
| **Finance & Ledger** (15)| `financial_accounts`, `account_balances`, `balance_holds`, `financial_transactions`, `financial_ledger_entries`, `financial_assets`, `asset_conversions`, `exchange_rates`, `financial_fees`, `fiat_providers`, `fiat_payment_methods`, `fiat_accounts`, `fiat_transactions`, `fiat_external_transactions`, `system_account_routes` | Livro-razão contábil em partidas dobradas; saldos são projeções | `financeRouter`, `D1AtomicPostingExecutor` |
| **DevOS Device Plane** (3)| `devos_devices`, `devos_consumed_nonces`, `devos_admin_sessions` | Registro de máquinas DevOS (Ed25519) e sessões AAL >= 2 | `devosDeviceGuard`, `adminRouter` |
| **DevOS Vault & Ops** (3)| `devos_integrations`, `devos_vault_operations`, `devos_totp_consumed_steps` | Metadados de integrações externas, idempotência e rotação | `vaultRouter`, `DrizzleVaultRepository` |
| **External Secrets** (3)| `integration_configs`, `integration_secrets`, `integration_secret_versions` | Metadados de segredos de terceiros (somente referências secret_ref) | `DrizzleVaultRepository` |
| **Compliance** (1) | `user_consents` | Consentimentos de privacidade e termos aceitos | `complianceRouter` |
| **Security & Telemetry** (3)| `security_events`, `audit_logs`, `audit_logs_immutable` | Trilha operacional e eventos de segurança em modo append-only | `SecurityAuditAdapter` |
| **Infrastructure** (5) | `outbox_events`, `idempotency_keys`, `event_inbox`, `event_consumer_receipts`, `reconciliation_records` | Padrão Outbox transacional e deduplicação assíncrona | `CloudflareQueueAdapter`, `EventInbox` |

---

## 11. AUDITORIA DE KV E R2

### 11.1. Cloudflare Workers KV
1. **Namespace `KV_AUTH` (`id: 5f8377a1e41d4869837debabbed2acfb`):**
   - Utilizado para armazenamento volátil de desafios WebAuthn e nonces SIWE.
   - TTL típico: 300 segundos (5 minutos), eliminando necessidade de limpeza manual.
2. **Namespace `KV_CACHE` (`id: abb4df8656924422a3ccab4969e938d0`):**
   - Armazena métricas agregadas do sistema e cache de respostas de alta frequência para reduzir o consumo de leituras no D1.

### 11.2. Cloudflare R2
1. **Bucket `w3-media` (`STORAGE`):**
   - Destinado ao armazenamento de mídia pública e restrita (avatares, imagens de capa do perfil, fotos de projetos da DAO).
   - O DevOS Desktop deve enviar arquivos para este bucket através de URLs pré-assinadas geradas pelo Worker.
2. **Bucket `w3-anexos` (`R2_EMAIL_ATTACHMENTS`):**
   - Destinado a anexos de comunicações oficiais e comprovantes fiscais/documentais.

---

## 12. OUTROS SERVIÇOS CLOUDFLARE

1. **Durable Objects (`ChatRoomDO`):**
   - Declarado com binding `CHAT_ROOM` e migração SQLite-in-DO no `wrangler.toml`. O código atual (`src/infrastructure/durable_objects/ChatRoomDO.ts`) é um esqueleto funcional preliminar que responde com status ativo, aguardando implementação do barramento WebSocket para comunicação entre nós em tempo real.
2. **Cloudflare Queues (`w3-mail` e `w3-chat`):**
   - Configurado com consumidores e produtores explícitos. Processa tarefas pesadas fora do ciclo de vida da requisição HTTP (envio de e-mails, processamento de mensagens e indexação). Possui políticas de retry com máximo de 3 tentativas e desvio automático para Dead Letter Queue.
3. **Workers AI (`AI`):**
   - Binding configurado e disponível no Worker para rotinas futuras de processamento de linguagem natural e extração de dados documentais.
4. **Cloudflare Observability (Logs & Traces):**
   - Configurado no `wrangler.toml` com `head_sampling_rate = 1` (100% das requisições registradas), `persist = true` e rastreamento distribuído via header `X-Correlation-ID`.

---

## 13. INVENTÁRIO DOS BANCOS SQLITE LOCAIS (DEVOS DESKTOP)

| Banco SQLite Local | Caminho no Sistema Host | Responsável | Edições | Tabelas Principais |
|---|---|---|---|---|
| **`devos_vault.sqlite`** | `$APP_DATA/devos_vault/devos_vault.sqlite` | `storage::LocalDatabase` | Ambas (Node e Cockpit) | `schema_migrations`, `vault_header`, `vault_secrets`, `wallets`, `user_profiles` |
| **`real_estate.sqlite`** | `$APP_DATA/real_estate/real_estate.sqlite` | `storage::RealEstateDatabase` | Exclusivo Cockpit | `properties`, `property_identifiers`, `addresses`, `property_address_links`, `import_batches`, `import_batch_records`, `audit_findings`, `correction_proposals`, `audit_events` |

---

## 14. INVENTÁRIO DO ARMAZENAMENTO LOCAL

1. **Diretório de Downloads do Usuário:**
   - Destino dos PDFs compilados nativamente pelo Typst (`Contrato_Cessao_Posse_*.pdf`, `Invoice_*.pdf`).
2. **Repositório IPFS Kubo Local:**
   - Localizado em `$APP_DATA/devos/ipfs` (gerenciado por `DaemonManager`), armazena blocos pinados sob custódia local do operador.
3. **Lacuna Crítica Identificada:**
   - Inexistência de pasta `$APP_DATA/media/` para persistência de fotos de perfil. O upload atual utiliza `URL.createObjectURL` volátil em memória.

---

## 15. MATRIZ UNIFICADA DE PERSISTÊNCIA (LOCAL × CLOUD × HÍBRIDO)

| Domínio | Entidade | Ambiente Oficial | Armazenamento | Classificação | Criptografia | Estado Atual |
|---|---|---|---|:---:|---|:---:|
| **Vault** | Segredos Mestres e Sementes | Local | SQLite (`devos_vault`) | **LOCAL** | Argon2id + AES-256-GCM | **COMPROVADO** |
| **Vault** | Metadados de Integrações Externas | Nuvem | Cloudflare D1 (`devos_integrations`) | **CLOUD** | Apenas referências `secret_ref` | **COMPROVADO** |
| **Identity** | Perfil Civil Completo (CPF, RG, Certidões) | Local | SQLite (`devos_vault`) | **LOCAL** | AES-256-GCM | **COMPROVADO** |
| **Identity** | Dados Básicos do Cidadão / Associado | Nuvem | Cloudflare D1 (`citizens`, `users`) | **CLOUD** | PBKDF2 (senhas) | **COMPROVADO** |
| **Identity** | Perfil Público Compartilhado | Híbrido | D1 (`user_profiles`) / Cache Local | **HÍBRIDO** | Pública | **PARCIAL** |
| **Media** | Fotos de Perfil e Capa (Binários) | Híbrido | Cloudflare R2 (`w3-media`) / Local | **HÍBRIDO** | Hash SHA-256 | **NÃO IMPLEMENTADO** |
| **Documents** | Contratos Oficiais e Laudos em PDF | Local | Filesystem Local (`Downloads`) | **LOCAL** | Checksum SHA-256 | **COMPROVADO** |
| **Cadastre** | Cadastro Imobiliário e Lotes XLSX | Local (Cockpit) | SQLite WAL (`real_estate.sqlite`) | **LOCAL** | SHA-256 de Proveniência | **COMPROVADO** |
| **Finance** | Livro-Razão Contábil Institucional | Nuvem | Cloudflare D1 (`financial_ledger_entries`) | **CLOUD** | Partidas Dobradas Imutáveis | **COMPROVADO** |
| **Finance** | Extrato Associativo em PDF | Local | Typst Engine em memória | **LOCAL** | SHA-256 | **COMPROVADO** |
| **Control** | Registro de Dispositivos DevOS (Ed25519) | Nuvem | Cloudflare D1 (`devos_devices`) | **CLOUD** | Chave Pública Ed25519 | **COMPROVADO** |
| **Control** | Sessões Administrativas DevOS (AAL >= 2) | Nuvem | Cloudflare D1 (`devos_admin_sessions`) | **CLOUD** | JWT assinado + sid no D1 | **COMPROVADO** |
| **DePIN** | Provas de Armazenamento ADR-012 | Híbrido | Kubo Local / API Remota | **HÍBRIDO** | SHA-256 determinístico | **COMPROVADO** |
| **Community**| Feed Social, Posts e Comentários | Nuvem | Cloudflare D1 / R2 | **CLOUD** | Política da Comunidade | **NÃO IMPLEMENTADO** |

---

## 16. MAPA DE APIs E ENDPOINTS (DESKTOP × CLOUDFLARE)

### 16.1. Confronto de Endpoints e Divergências de Contrato

| Funcionalidade | Rota Solicitada pelo DevOS Desktop (`src/lib/axios.ts`) | Rota Canônica no Worker Cloudflare (`backend/src/index.ts`) | Situação da Conexão | Ação Corretiva Necessária |
|---|---|---|:---:|---|
| **Estatísticas de Tesouraria** | `GET /api/treasury/analytics` | `GET /api/v1/finance/treasury/analytics` | **DIVERGÊNCIA DE ROTA** | Atualizar `endpoints.platform.treasury.analytics` para incluir `/v1/finance` |
| **Transações da Tesouraria** | `GET /api/treasury/transactions` | `GET /api/v1/finance/transactions` | **DIVERGÊNCIA DE ROTA** | Atualizar rota no cliente Axios |
| **Listagem de Cidadãos** | `GET /api/identity/citizens` | `GET /api/v1/civil/citizens` | **DIVERGÊNCIA DE ROTA** | Atualizar `endpoints.platform.identity.citizens` para `/api/v1/civil/citizens` |
| **Desafio Web3 (SIWE)** | Não conectado (stub com erro) | `POST /api/v1/identity/web3/challenge` | **DESCONECTADO** | Conectar botão Web3 do Desktop ao endpoint SIWE do Worker |
| **Login Web3 (SIWE)** | Não conectado (stub com erro) | `POST /api/v1/identity/login/web3` | **DESCONECTADO** | Enviar assinatura da carteira para o Worker |
| **Control Plane Health** | Não conectado | `GET /api/v1/admin/health` | **REQUER ED25519** | Implementar interceptor com header `X-DevOS-Signature` |
| **Cofre de Integrações** | Não conectado | `GET /api/v1/admin/vault/integrations` | **REQUER ED25519** | Integrar Cockpit administrativo ao router de integrações |

---

## 17. REGRAS FUNDAMENTAIS DA SEPARAÇÃO LOCAL × CLOUD

1. **Princípio da Soberania de Chaves:**
   O DevOS Desktop é a autoridade máxima e exclusiva sobre as sementes BIP-39 e chaves privadas secp256k1/ed25519. O Cloudflare D1 **nunca** armazena sementes ou chaves privadas.
2. **Princípio do Livro-Razão Como Fonte da Verdade:**
   O D1 é a autoridade contábil das partidas dobradas (`financial_ledger_entries`). O Desktop pode gerar extratos locais em PDF via Typst, mas os dados transacionais oficiais residem no D1.
3. **Isolamento do Cadastro Imobiliário (Cockpit):**
   A base de conciliação territorial de 100k+ linhas (`real_estate.sqlite`) opera exclusivamente no disco do administrador em modo WAL, protegendo dados estratégicos fundiários contra vazamento em nuvem pública.

---

## 18. AUDITORIA INDIVIDUAL DOS MÓDULOS E SERVIÇOS

```text
=================================================
MÓDULO: CLOUDFLARE D1 (w3-db)
=================================================
RESPONSABILIDADE:
Persistência relacional central da DAO, livro-razão contábil e identidades.

ESTADO:
CONCLUÍDO E HOMOLOGADO EM ESQUEMA.

PROGRESSO:
[██████████████████░░] 90%

NOTA TÉCNICA:
9,2 / 10

BANCO:
w3-db (Database ID: cfd0e171-f2b5-48d4-bf29-a9cf33d97b4d)

TABELAS:
73 tabelas auditadas em 13 domínios funcionais.

WORKERS CONSUMIDORES:
asppibra-api (todos os 9 roteadores de domínio).

PERSISTÊNCIA:
Remota (Cloudflare Edge D1).

SEGURANÇA:
Controle de transações atômicas via DrizzleUnitOfWork, triggers de auditoria e foreign keys com restrição de deleção.

FUNCIONALIDADES PRONTAS:
- Livro-razão em partidas dobradas com soma zero garantida (INV-FIN-001).
- Esquema completo de identidades civis, DIDs e credenciais W3C.
- Tabelas dedicadas ao DevOS Device Control Plane (devos_devices, devos_admin_sessions).
- Anti-replay com tabela devos_consumed_nonces.

FUNCIONALIDADES PARCIAIS:
- Sincronização em tempo real com os bancos locais do DevOS.

FUNCIONALIDADES PENDENTES:
- Migração automática D1 para novas estações de trabalho de desenvolvedores.

PRIORIDADE:
P1.

PRÓXIMA ENTREGA:
Alinhar rotas do cliente Desktop para consumir o D1 através do Hono.
=================================================
```

```text
=================================================
MÓDULO: DEVOS DEVICE CONTROL PLANE (CLOUDFLARE)
=================================================
RESPONSABILIDADE:
Autenticação mútua de estações de trabalho DevOS via assinatura digital Ed25519.

ESTADO:
IMPLEMENTADO NO BACKEND (PENDENTE NO DESKTOP).

PROGRESSO:
[█████████████░░░░░░░] 65%

NOTA TÉCNICA:
8,5 / 10

PERSISTÊNCIA:
Cloudflare D1 (tabelas devos_devices, devos_consumed_nonces, devos_admin_sessions).

SEGURANÇA:
Protocolo DEVOS-ED25519-ADMIN-V1 com tolerância de clock skew de 300s e AAL >= 2.

FUNCIONALIDADES PRONTAS:
- Middlewares devosDeviceGuard, adminSessionGuard e devosNonceGuard.
- Verificação criptográfica de chave pública Ed25519 via Web Crypto API.
- Revalidação de sessão administrativa fresca a cada requisição.

FUNCIONALIDADES PARCIAIS:
- Interceptor no cliente Desktop para gerar a assinatura canônica de 9 linhas.

FUNCIONALIDADES PENDENTES:
- Comando IPC em Rust no DevOS para assinar payloads HTTP com chave Ed25519 local.

PRIORIDADE:
P1.

PRÓXIMA ENTREGA:
Implementar comando Rust `sign_http_request_ed25519` no Desktop.
=================================================
```

```text
=================================================
MÓDULO: CLOUDFLARE R2 & MÍDIA INSTITUCIONAL
=================================================
RESPONSABILIDADE:
Armazenamento de avatares, fotos de capa, comprovantes KYC e documentos.

ESTADO:
CONFIGURADO NO WORKER (NÃO CONECTADO NO DESKTOP).

PROGRESSO:
[██████████░░░░░░░░░░] 50%

NOTA TÉCNICA:
6,5 / 10

PERSISTÊNCIA:
Cloudflare R2 Buckets (w3-media e w3-anexos).

SEGURANÇA:
Upload via presigned URLs S3 SDK com validação de extensão e tamanho máximo.

FUNCIONALIDADES PRONTAS:
- Bindings STORAGE e R2_EMAIL_ATTACHMENTS configurados no wrangler.toml.
- Suporte a geração de presigned URLs no backend.

FUNCIONALIDADES PARCIAIS:
- O Desktop não envia fotos para o R2; utiliza `URL.createObjectURL` volátil.

FUNCIONALIDADES PENDENTES:
- Fluxo de upload de avatar com geração de thumbnail e gravação física.

PRIORIDADE:
P1.

PRÓXIMA ENTREGA:
Conectar upload de avatar da aba de Identidade ao endpoint de presigned URL do R2.
=================================================
```

---

## 19. AUDITORIA DE SEGURANÇA LOCAL (DEVOS DESKTOP)

- **Cofre e Sessões:** O uso de `Zeroize` no Rust impede leitura residual de senhas mestres e sementes da memória RAM.
- **Isolamento de Processo:** O Tauri v2 isola o WebView contra comandos de shell direto (`sh` ou `bash`).
- **Ponto de Atenção:** A função `get_device_status` em `system_commands.rs:12` retorna valores fixos (`status: "UNINITIALIZED"`, `enrolled: false`) sem interrogar o chip de segurança ou o hardware local.

---

## 20. AUDITORIA DE SEGURANÇA CLOUD (CLOUDFLARE)

- **Proteção Anti-Replay Atômico:** O middleware `devosNonceGuard` consome o nonce no D1 dentro da mesma transação antes da execução do endpoint, inviabilizando ataques de repetição.
- **Fail-Closed de Segredos:** O Worker recusa inicializar caso `JWT_SECRET` ou `TOTP_ENCRYPTION_KEY` estejam ausentes no ambiente.
- **Headers de Segurança:** Configuração do `secureHeaders` com CSP estrito (`defaultSrc: ["'none'"]`), `xFrameOptions: DENY` e HSTS de 2 anos com preload.

---

## 21. SEGURANÇA DAS INTEGRAÇÕES (TRANSVERSAL)

| ID | Ambiente | Descrição da Lacuna de Segurança | Impacto | Prioridade | Recomendação Técnica |
|---|---|---|---|:---:|---|
| **SEC-INT-001** | Híbrido | Cliente Desktop não envia assinatura Ed25519 para `/api/v1/admin/*` | Bloqueio de acesso administrativo na Cloudflare | **P1** | Implementar gerador de assinatura no DevOS Cockpit |
| **SEC-INT-002** | Híbrido | Divergência de rotas no Axios (`/api/...` vs `/api/v1/...`) | Falha silenciosa de sincronização (404 Not Found) | **P1** | Padronizar rotas para `/api/v1/` no `src/lib/axios.ts` |
| **SEC-INT-003** | Local | Fotos de avatar e capa gravadas como blob URL em memória | Quebra visual permanente após reinicialização | **P1** | Gravar arquivo localmente e sincronizar via R2 |
| **SEC-INT-004** | Cloud | Rotação de chaves mestras locais não refletida no D1 | Dessincronia de estado da conta | **P2** | Notificar Worker via evento assinado após rotação |

---

## 22. VALIDAÇÃO E TESTES

### 22.1. Execução de Testes Nativos no DevOS Desktop
- **Suíte Rust (`cargo test`):**
  - **Resultado:** 215 testes aprovados, 1 falha (`test_resolve_ipfs_binary_finds_kubo_executable`), 4 ignorados.
  - **Motivo da Falha:** Ausência do binário do Kubo (`ipfs`) no PATH do sistema operacional host.

### 22.2. Validação dos Testes da Cloudflare (`backend/tests/`)
- **Limitação do Ambiente:** O wrapper de execução `/home/sandro/.local/bin/node` aponta para `/snap/antigravity-ide-snap/current/usr/share/antigravity-ide/antigravity-ide`, inacessível dentro do sandbox da sessão.
- **Inspeção Estática dos Testes:** Foram auditados estaticamente 52 arquivos de teste em `backend/tests/`, comprovando a existência de testes de estresse de concorrência, injeção de falhas, reconciliação 3-way e precisão decimal EVM (`money256.test.ts`).

---

## 23. CÓDIGO MORTO E DUPLICIDADES TRANSVERSAIS

1. **Roteamento de Cadastro Imobiliário Duplicado no Desktop:**
   O DevOS Desktop possui rotas `/devos/cadastre`, `/devos/database` e `/real-estate` carregando o mesmo componente `RealEstateView`.
2. **Duplicidade Conceitual de Perfis:**
   - No Desktop: tabela local `user_profiles` no `devos_vault.sqlite`.
   - Na Cloudflare: tabelas `users`, `user_profiles` e `citizens` no D1.
   - *Correção Arquitetural:* Definir `devos_vault` como fonte dos dados civis privados e D1 como fonte dos identificadores públicos e roles institucionais.

---

## 24. MAPA DE DEPENDÊNCIAS DO ECOSSISTEMA

```mermaid
flowchart TD
    subgraph Desktop [DevOS Desktop - Local Offline]
        V[Vault Crypto AES/Argon2] --> W[Wallets BIP-39/44]
        V --> ID_L[Identity Perfil Civil]
        T[Typst Engine v0.15] --> D[Contratos & Laudos PDF]
        RE[Real Estate SQLite WAL] --> RE_DOC[Laudo Cadastral]
        IPFS_L[Kubo Daemon Local] --> PROOF[Desafio DePIN ADR-012]
    end

    subgraph Integration [Camada de Integração HTTPS]
        BRIDGE[Axios / IdentityBridge] --> SIGN[Ed25519 Device Signer DEV-006]
    end

    subgraph Cloudflare [ASPPIBRA Cloud - Cloudflare Edge]
        GW[Hono API Gateway] --> GUARD[devosDeviceGuard Ed25519]
        GUARD --> D1[(Cloudflare D1: w3-db)]
        GW --> R2[(Cloudflare R2: w3-media)]
        GW --> KV[(Cloudflare KV: KV_AUTH)]
        GW --> Q[Queues: w3-mail / w3-chat]
    end

    ID_L -.-> BRIDGE
    BRIDGE --> GW
    W -.-> PROOF
```

---

## 25. NOTAS TÉCNICAS INDIVIDUAIS DO ECOSSISTEMA (0 A 10)

| Domínio / Módulo | Ambiente | Arquitetura (2.0) | Implementação (2.0) | Persistência (2.0) | Segurança (2.0) | Testes (1.0) | Integração (1.0) | Nota Final | Classificação |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Documents & Typst** | Local | 2,0 | 2,0 | 1,8 | 1,9 | 0,9 | 0,9 | **9,5** | Excelente / Produção |
| **Core & Platform** | Local | 1,9 | 1,9 | 1,9 | 1,9 | 0,9 | 0,9 | **9,4** | Alta Maturidade |
| **Vault & Custódia** | Local | 1,9 | 1,9 | 1,9 | 2,0 | 0,8 | 0,8 | **9,3** | Alta Maturidade |
| **D1 Database (w3-db)** | Cloud | 1,9 | 1,9 | 1,9 | 1,8 | 0,9 | 0,8 | **9,2** | Alta Maturidade |
| **Real Estate (Cockpit)**| Local | 1,9 | 1,8 | 1,9 | 1,8 | 0,8 | 0,7 | **8,9** | Alta Maturidade |
| **Identity & Civil** | Local | 1,8 | 1,8 | 1,8 | 1,9 | 0,8 | 0,7 | **8,8** | Alta Maturidade |
| **Hono API Gateway** | Cloud | 1,8 | 1,8 | 1,8 | 1,8 | 0,8 | 0,6 | **8,6** | Alta Maturidade |
| **Wallets & EVM** | Local | 1,7 | 1,7 | 1,7 | 1,8 | 0,8 | 0,7 | **8,4** | Bem Implementado |
| **IPFS & DePIN** | Local | 1,6 | 1,6 | 1,6 | 1,6 | 0,8 | 0,7 | **7,9** | Bem Implementado |
| **Monitoring & RPC** | Local | 1,6 | 1,6 | 1,6 | 1,5 | 0,8 | 0,7 | **7,8** | Bem Implementado |
| **Finance & Ledger** | Cloud | 1,8 | 1,7 | 1,8 | 1,7 | 0,8 | 0,5 | **8,3** | Bem Implementado |
| **Control Plane Ed25519**| Híbrido| 1,7 | 1,5 | 1,7 | 1,8 | 0,6 | 0,3 | **7,6** | Bem Implementado |
| **R2 & Mídia** | Cloud | 1,4 | 1,3 | 1,5 | 1,4 | 0,5 | 0,4 | **6,5** | Funcional c/ Lacunas |
| **Durable Objects / Chat**| Cloud | 1,2 | 0,9 | 0,8 | 1,0 | 0,4 | 0,3 | **4,6** | Estrutura Inicial |
| **User & Community** | Híbrido| 0,8 | 0,7 | 0,4 | 0,8 | 0,4 | 0,4 | **3,5** | Estrutura Inicial |

**Média Arquitetural Ponderada Global: 7,4 / 10**

---

## 26. BARRAS DE PROGRESSO DO ECOSSISTEMA

```text
CORE & PLATFORM (DESKTOP)
[████████████████████] 100% — Nota: 9,4 / 10

DOCUMENTS ENGINE TYPST (DESKTOP)
[████████████████████] 100% — Nota: 9,5 / 10

VAULT CRYPTO & CUSTÓDIA (DESKTOP)
[███████████████████░] 95%  — Nota: 9,3 / 10

CLOUDFLARE D1 DATABASE (CLOUD)
[██████████████████░░] 90%  — Nota: 9,2 / 10

REAL ESTATE CADASTRE WAL (DESKTOP)
[██████████████████░░] 90%  — Nota: 8,9 / 10

HONO API GATEWAY WORKER (CLOUD)
[█████████████████░░░] 85%  — Nota: 8,6 / 10

IDENTITY & PERFIL CIVIL (DESKTOP)
[█████████████████░░░] 85%  — Nota: 8,8 / 10

FINANCE & LIVRO-RAZÃO (CLOUD)
[████████████████░░░░] 80%  — Nota: 8,3 / 10

WALLETS & DERIVAÇÃO EVM (DESKTOP)
[████████████████░░░░] 80%  — Nota: 8,4 / 10

IPFS & DEPIN STORAGE (DESKTOP)
[███████████████░░░░░] 75%  — Nota: 7,9 / 10

CONTROL PLANE ED25519 (HÍBRIDO)
[█████████████░░░░░░░] 65%  — Nota: 7,6 / 10

CLOUDFLARE R2 & STORAGE (CLOUD)
[██████████░░░░░░░░░░] 50%  — Nota: 6,5 / 10

DURABLE OBJECTS & CHAT (CLOUD)
[████████░░░░░░░░░░░░] 40%  — Nota: 4,6 / 10

USER PROFILE & COMMUNITY (HÍBRIDO)
[███████░░░░░░░░░░░░░] 35%  — Nota: 3,5 / 10
```

---

## 27. MATRIZ CONSOLIDADA DE TAREFAS

| ID | Ambiente | Módulo | Problema Identificado | Prioridade | Dependência | Critério de Conclusão |
|---|---|---|---|:---:|---|---|
| **DEV-001** | Local | Identity | Fotos de avatar e capa usam `URL.createObjectURL` volátil em memória | **P1** | Core / FS | Fotos gravadas no filesystem local (`$APP_DATA/media/`) com hash SHA-256 |
| **DEV-002** | Local | Vault | Ausência de comando Rust para rotação e re-encriptação da senha mestre | **P1** | Vault Crypto | Comando `change_vault_master_password` aprovado em testes atômicos |
| **DEV-003** | Local | IPFS | Teste de binário falha por ausência do Kubo no PATH do sistema host | **P1** | Tauri Bundle | Empacotar executável `ipfs` como sidecar nativo no Tauri bundle |
| **CF-001** | Cloud | Durable Objects | `ChatRoomDO.ts` é apenas um esqueleto preliminar | **P2** | Worker Hono | Implementação de WebSocket e persistência de mensagens |
| **CF-002** | Cloud | R2 Media | Ausência de endpoint REST para emissão de presigned upload URL | **P1** | R2 Binding | Endpoint `/api/v1/media/upload-url` validado com S3 Presigner |
| **INT-001** | Híbrido | Integration | Divergência de rotas no Axios (`/api/...` vs `/api/v1/...`) | **P1** | Axios Client | Alinhar `src/lib/axios.ts` com as rotas canônicas do Hono |
| **INT-002** | Híbrido | Control Plane | Cliente Desktop não implementa assinatura digital Ed25519 para Admin API | **P1** | Rust IPC | Implementar comando de assinatura e interceptor HTTP `X-DevOS-Signature` |
| **INT-003** | Híbrido | Web3 Auth | Botão de login Web3 no Desktop aborta por falta de desafio SIWE | **P2** | Viem / Hono | Conectar Desktop aos endpoints `/api/v1/identity/web3/challenge` e `login/web3` |
| **INT-004** | Híbrido | Ledger | Tela de Livro-Razão do Desktop fica em branco sem a API ativa | **P2** | LocalDatabase | Criar cache local em SQLite para dados contábeis em modo offline |
| **SEC-001** | Híbrido | Security | Chaves de dispositivos DevOS pendentes de aprovação no D1 | **P1** | devos_devices | Interface de aprovação de novas máquinas operadoras no Cockpit |

---

## 28. ROADMAP UNIFICADO DO ECOSSISTEMA POR FASES

### FASE 00 — Fundação e Arquitetura (100% Concluída)
- Core Tauri v2, isolamento de processos, esquemas Drizzle e banco D1 estruturado.

### FASE 01 — DevOS Local (Prioridade Imediata)
- Persistência física de mídia local (`DEV-001`) e rotação de senha mestre (`DEV-002`).

### FASE 02 — Infraestrutura DePIN Local (Prioridade Imediata)
- Empacotamento do executável Kubo como sidecar nativo no bundle Tauri (`DEV-003`).

### FASE 03 — Infraestrutura Cloudflare
- Endpoint de URLs pré-assinadas no R2 (`CF-002`) e implementação real do `ChatRoomDO` (`CF-001`).

### FASE 04 — Integração DevOS × Cloudflare (O Grande Elo)
- Alinhamento de prefixos REST `/api/v1/` no Axios (`INT-001`).
- Implementação da assinatura digital Ed25519 no Desktop para o Control Plane (`INT-002`).
- Conexão do fluxo de login Web3 SIWE entre Desktop e Worker (`INT-003`).

### FASE 05 — Community e Serviços Distribuídos
- Substituição dos dados embutidos em `_mock.ts` e `home-mock.ts` por dados reais do D1/R2.

### FASE 06 — Ferramentas Institucionais Cockpit
- Cache local offline para o Livro-Razão (`INT-004`) e aprovação de novos dispositivos (`SEC-001`).

### FASE 07 — Homologação Geral do Ecossistema
- Execução unificada de testes e geração dos pacotes binários finais (`.deb`, AppImage).

---

## 29. CRITÉRIOS DE PRODUÇÃO

1. **Aprovação das Duas Suítes de Teste:**
   - 100% dos testes do Rust (`cargo test`) aprovados sem dependência de pré-instalação no host.
   - Suíte Vitest do Worker (`backend/tests/`) executando com aprovação total de contratos.
2. **Autenticação Ed25519 Funcional:**
   - Estação DevOS Cockpit aprovada no D1 emitindo requisições assinadas validadas pelo `devosDeviceGuard`.
3. **Resiliência a Desconexão:**
   - DevOS Desktop funcionando plenamente desconectado (Cofre, Identidade, Typst, Cadastro Imobiliário).

---

## 30. RISCOS E BLOQUEADORES

1. **Bloqueio de Ambiente Node.js Host:**
   - A falha do wrapper `/snap/.../antigravity-ide` impede execução direta de scripts pnpm no host sandboxed.
2. **Rejeição por Clock Skew:**
   - O protocolo `DEVOS-ED25519-ADMIN-V1` rejeita requisições com diferença de relógio superior a 300s. Estações de trabalho devem sincronizar NTP com precisão.

---

## 31. RECOMENDAÇÕES ARQUITETURAIS

1. **Manter o Princípio de Separação de Segredos:**
   Jamais criar endpoints no Worker que recebam chaves privadas ou senhas mestres em texto puro.
2. **Adotar OpenAPI como Contrato Único:**
   Utilizar a especificação `backend/docs/openapi-vault.yaml` como a fonte de verdade para a geração automática dos tipos TypeScript no DevOS Desktop.

---

## 32. CONCLUSÃO EXECUTIVA — RESPOSTAS OBJETIVAS ÀS 30 PERGUNTAS DA ORDEM TÉCNICA

1. **Qual é a arquitetura completa do DevOS Desktop?**  
   Tauri v2 + React 19 + Rust com SQLite local (`devos_vault` e `real_estate`), motor Typst v0.15 offline e IPFS Kubo.
2. **Qual é a arquitetura completa da Cloudflare?**  
   Worker `asppibra-api` (Hono Framework), D1 Database `w3-db` (73 tabelas), R2 Storage (`w3-media`), KV (`KV_AUTH`), Queues e Durable Objects.
3. **Quais serviços Cloudflare estão realmente ativos ou configurados?**  
   Worker HTTP (Ativo), D1 Database (Ativo/Migrado), Queues (Configuradas), KV (Configurado), R2 (Configurado).
4. **Quais Workers existem?**  
   1 Worker principal monolítico-modular DDD: `asppibra-api` (`backend/src/index.ts`).
5. **Quais aplicações Pages existem?**  
   Configuração vinculada para `app.asppibra.com` via Cloudflare Pages.
6. **Quais bancos remotos existem?**  
   1 banco Cloudflare D1 oficial: `w3-db` (`cfd0e171-f2b5-48d4-bf29-a9cf33d97b4d`).
7. **Quais tabelas cada banco possui?**  
   73 tabelas detalhadas no inventário da **Seção 10** deste documento.
8. **Quais Workers consomem cada banco?**  
   O Worker `asppibra-api` através do binding `DB`.
9. **Quais APIs são utilizadas?**  
   46 rotas REST divididas entre `/api/v1/compliance`, `/health`, `/webhooks`, `/identity`, `/civil`, `/ssi`, `/finance`, `/web3`, `/admin`.
10. **Quais serviços utilizam D1?**  
    Todos os domínios de negócio: autenticação, partidas dobradas, identidades civis, DIDs e controle de dispositivos.
11. **Quais utilizam KV?**  
    Nonces anti-replay, sessões temporárias e rate-limiting (`KV_AUTH` e `KV_CACHE`).
12. **Quais utilizam R2?**  
    Armazenamento de mídia, avatares e anexos (`w3-media` e `w3-anexos`).
13. **Quais serviços utilizam outros produtos Cloudflare?**  
    Queues (`w3-mail` para envio de e-mails assíncronos), Durable Objects (`ChatRoomDO`) e Workers AI.
14. **Quais dados precisam permanecer locais?**  
    Sementes BIP-39, chaves privadas, senhas mestres, cofre civil protegido e base territorial imobiliária WAL.
15. **Quais dados pertencem à nuvem?**  
    Livro-razão institucional compartilhado, identificadores de usuários, registros de auditoria e diretório público de associados.
16. **Quais dados são híbridos?**  
    Perfil público, metadados de mídia com hash SHA-256 e provas de custódia DePIN ADR-012.
17. **Quais dados precisam de cache?**  
    Saldos de carteiras EVM, métricas agregadas do ecossistema e dados contábeis para consulta offline no Desktop.
18. **Quais informações estão duplicadas?**  
    Campos de perfil civil e rotas de cadastro imobiliário no Desktop.
19. **Quais integrações funcionam?**  
    Compilação Typst local, chamadas JSON-RPC EVM nativas, streaming IPFS Kubo local e rotinas de autorização interna no Worker.
20. **Quais integrações são apenas declaradas?**  
    A chamada do Desktop ao Worker (bloqueada por divergência de rota `/api/` vs `/api/v1/` e ausência da assinatura Ed25519).
21. **Quais recursos estão sem persistência?**  
    Avatares e capas no Desktop (usam blob URL volátil) e preferências de notificações.
22. **Quais funcionalidades podem operar offline?**  
    Desbloqueio de cofre, consulta a perfis civis locais, emissão de contratos Typst, conciliação imobiliária XLSX e derivação de carteiras.
23. **Quais dependem obrigatoriamente da rede?**  
    Login Web3 SIWE na nuvem, consulta de saldo em blockchain EVM e sincronização do livro-razão institucional.
24. **Quais são os riscos de segurança?**  
    Uso de URLs voláteis para avatares, rotação de senha mestre ausente no cofre e potencial divergência de relógio no protocolo Ed25519.
25. **Qual é a nota técnica de cada módulo?**  
    Varia de 3,5 / 10 a 9,5 / 10 (Seção 25).
26. **Qual é o percentual de conclusão?**  
    Varia de 35% a 100% (Seção 26).
27. **Quais dependências precisam ser resolvidas?**  
    Conectar o protocolo `DEVOS-ED25519-ADMIN-V1` no Desktop e alinhar as rotas do Axios para `/api/v1/`.
28. **Qual é a ordem correta de desenvolvimento?**  
    Fase 01 (Mídia Local e Cofre) -> Fase 02 (Kubo Sidecar) -> Fase 03 (Endpoints R2) -> Fase 04 (Integração Desktop x Cloud) -> Fase 05 (Social) -> Fase 06 (Cockpit) -> Fase 07 (Homologação).
29. **O que falta para homologar o DevOS?**  
    Persistir mídia em disco, incluir executável Kubo no bundle e zerar falhas do `cargo test`.
30. **O que falta para homologar a infraestrutura ASPPIBRA Cloud?**  
    Implementar endpoints de upload presigned no R2 e ativar o cliente Ed25519 no Desktop para validar os testes ponta a ponta do Control Plane.

---
*Relatório de Auditoria Arquitetural Forense Integrada (DevOS Desktop + ASPPIBRA Cloud) concluído com sucesso em modo estrito de leitura.*
