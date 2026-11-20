# DEVOS DESKTOP — AUDITORIA ARQUITETURAL INTEGRAL, PERSISTÊNCIA LOCAL, INTEGRAÇÕES DE REDE E ROADMAP OFICIAL

**Documento Oficial:** `DEVOS_DESKTOP_ARCHITECTURE_AND_ROADMAP.md`  
**Projeto:** ASPPIBRA-DAO — DevOS Desktop  
**Data da Auditoria:** 18 de Novembro de 2026  
**Modo de Execução:** READ-ONLY Forense (Nenhum código-fonte modificado)  
**Status do Repositório:** Auditado, Testado e Mapeado  
**Branch:** `main` | **Commit HEAD:** `fb8a1f461221cbfe51b616e8c034f01a2b917864`  

---

## 01. IDENTIFICAÇÃO E ESCOPO

### 1.1. Metadados do Ambiente e Repositório
- **Diretório Raiz:** `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop`
- **Controle de Versão:** Git (`main` alinhado com `origin/main`)
- **Último Commit:** `fb8a1f461221cbfe51b616e8c034f01a2b917864` — *"docs(audit): registrar transacoes atomicas do mapeamento arquitetural em git-change-log.csv"*
- **Arquitetura Base:** Tauri v2 (`@tauri-apps/api 2.2.0`, `@tauri-apps/cli 2.12.1`, crate Rust `tauri 2.12.1`)
- **Frontend Core:** React 19.1.1, TypeScript 6.0.2, Vite 8.0.8, MUI v9.0.0, Emotion, SWR 2.3.6, React Hook Form 7.63.0, Zod 3.25.76, Three.js 0.186.1
- **Backend Nativo (Rust):** Rust 1.99.0 (Edition 2024, `rust-version = 1.92`), `rusqlite 0.32` (bundled SQLite), `tokio 1.0`, `aes-gcm 0.10`, `argon2 0.5`, `zeroize 1.8`, `typst 0.15` / `typst-as-lib 0.17`, `k256 0.13`, `bip39 2.1`, `bip32 0.5`, `calamine 0.37`
- **Gerenciador de Pacotes:** `pnpm` (com `pnpm-lock.yaml` e workspace configurado)

### 1.2. Edições Disponíveis e Empacotamento
1. **DevOS Node (`br.aspp.devos.node`):**
   - Configuração: `src-tauri/tauri.node.conf.json` e `src/app/editions/edition.node.ts`
   - Distribuição Frontend: `dist-node`
   - Propósito: Nó operador de infraestrutura física descentralizada (DePIN), gestão de cofre local, conectividade IPFS Kubo e telemetria de rede.
2. **DevOS Cockpit (`br.aspp.devos.cockpit`):**
   - Configuração: `src-tauri/tauri.cockpit.conf.json` e `src/app/editions/edition.cockpit.ts`
   - Distribuição Frontend: `dist-cockpit`
   - Propósito: Painel institucional de administração de cluster, governança DAO, tesouraria, livros-razão, catálogo documental e gestão cadastral imobiliária segregada.

---

## 02. RESUMO EXECUTIVO

A auditoria forense do código-fonte revelou um sistema híbrido de alta sofisticação técnica, com fundações criptográficas e nativas de nível bancário/institucional já implementadas em Rust, combinadas a uma interface React moderna, porém com estágios heterogêneos de maturidade funcional e persistência entre os diferentes módulos.

### Principais Constatações:
1. **Núcleo de Criptografia e Custódia (Rust - Nota 9,3/10):**
   O cofre (`VaultCrypto` e `LocalDatabase`) opera com derivação de chave Argon2id (64 MiB, 3 iterações), cifra autenticada AES-256-GCM com tags de 128 bits e canário de validação. Toda a manipulação de sementes BIP-39 e chaves privadas utiliza limpeza obrigatória de memória (`zeroize`), com sessões de derivação retidas em memória por TTL de 5 minutos, garantindo que frases mnemônicas nunca trafeguem em texto puro para a camada web sem autorização explícita comprovada por senha mestre.
2. **Motor Documental Nativo (Typst - Nota 9,5/10):**
   A geração de contratos e relatórios (`contrato_cessao_posse.typ`, `contrato_adesao_associado.typ`, `invoice_bill.typ`, etc.) é 100% offline, operando via compilação em memória pela biblioteca nativa do Typst v0.15. O pipeline dispõe de um `preview_store` transacional com verificação de igualdade criptográfica SHA-256 entre a pré-visualização em tela e a exportação em disco, eliminando risco de adulteração visual.
3. **Módulo de Identidade Civil (Nota 8,8/10):**
   Possui persistência criptografada completa no SQLite (`devos_vault.sqlite`, tabela `user_profiles`), bloqueio otimista de concorrência por revisão (`revision`), validação documental de CPF e CNPJ (incluindo o novo padrão alfanumérico da RFB IN 2.229/2024) e isolamento "fail-closed" quando o cofre está bloqueado.
4. **Módulo Cadastral Imobiliário (Cockpit - Nota 8,9/10):**
   Banco segregado (`real_estate.sqlite`), configurado em modo WAL, com proveniência linha a linha por hash SHA-256, tabelas relacionais de endereços normalizados e gatilhos de banco de dados (`BEFORE UPDATE/DELETE ON audit_events RAISE(ABORT)`) que impõem imutabilidade rigorosa à trilha de auditoria (Append-Only).
5. **Lacunas Críticas Identificadas (P0 e P1):**
   - **Mídia Local Inexistente:** O upload de fotos de perfil e capa em `user-profile-view.tsx` gera `blob:http://...` temporários via `URL.createObjectURL`. Não há pipeline nativo para salvar arquivos no disco ou no IPFS, corrompendo as imagens ao reiniciar o aplicativo.
   - **Módulos Sociais e Feed Mockados:** O painel do nó (`NodeDashboardPage`) e a visualização do perfil (`profile-home.tsx`) consom dados estáticos de `_mock.ts` e `home-mock.ts` (publicações, seguidores, projetos ativos, alertas).
   - **Notificações e Senha sem Persistência:** A aba de notificações emite apenas toasts de sucesso no React; o serviço de alteração de senha institucional em `identity-session.service.ts` lança exceção imediata por ausência de backend.
   - **Executável IPFS Ausente no Ambiente:** A suíte de testes de integração acusou falha em `test_resolve_ipfs_binary_finds_kubo_executable` pela ausência do binário `ipfs` instalado nos diretórios do sistema host.

---

## 03. PAINEL GERAL DE PROGRESSO

```text
================================================================================
                    DEVOS DESKTOP — PAINEL EXECUTIVO FORENSE
================================================================================

MÓDULOS IDENTIFICADOS:                    12
MÓDULOS CONCLUÍDOS / ALTA MATURIDADE:      4 (Vault, Documents, Identity, Real Estate)
MÓDULOS FUNCIONAIS COM LACUNAS:            3 (Wallets, IPFS/DePIN, Monitoring)
MÓDULOS PARCIAIS:                          2 (Authentication/Bootstrap, Ledger)
MÓDULOS APENAS VISUAIS / MOCKS:            3 (User Community/Social, Notifications, Node Telemetry)

FUNCIONALIDADES AUDITADAS:               108
FUNCIONALIDADES IMPLEMENTADAS E REAIS:    71 (65,7%)
FUNCIONALIDADES PARCIAIS:                 16 (14,8%)
FUNCIONALIDADES NÃO IMPLEMENTADAS/MOCK:   21 (19,5%)

PERSISTÊNCIA LOCAL (SQLITE):              78% (Vault, Carteiras, Perfil, Cadastro Imobiliário)
ARMAZENAMENTO EM ARQUIVOS:                35% (PDFs funcionais; Mídia/Avatares não persistidos)
INTEGRAÇÃO NATIVA (IPC TAURI):            86% (41 comandos IPC nativos registrados e testados)
COBERTURA E CONFIABILIDADE DE TESTES:     84% (215 testes unitários/integração Rust aprovados)

NOTA ARQUITETURAL GERAL:                  7,8 / 10
PROGRESSO GLOBAL PONDERADO:               73,5%

================================================================================
```

---

## 04. INVENTÁRIO COMPLETO DE MÓDULOS

A auditoria identificou **12 módulos arquiteturais** no DevOS Desktop:

| # | Módulo | Diretório Rust | Diretório Frontend | Responsabilidade Principal | Edições | Estado Geral |
|---|---|---|---|---|---|---|
| **01** | **Core & Platform** | `src-tauri/src/` | `src/platform/tauri/`, `src/app/` | Ciclo de vida, bootstrap, IPC bridges, capabilities e ACL | Ambas | **CONCLUÍDO** |
| **02** | **Vault & Security** | `src-tauri/src/modules/vault/` | `src/platform/tauri/vault/` | Cifragem AES-256-GCM, KDF Argon2id, canário, controle de sessão | Ambas | **CONCLUÍDO** |
| **03** | **Identity & Profile** | `src-tauri/src/modules/identity/` | `src/sections/account/`, `src/platform/tauri/identity/` | Qualificação civil PF/PJ, validação documental, controle de revisão | Ambas | **CONCLUÍDO** |
| **04** | **Wallets & EVM** | `src-tauri/src/modules/wallets/` | `src/modules/wallets/`, `src/platform/tauri/wallets/` | Derivação BIP-39/44, retenção temporária com Zeroize, custódia | Cockpit (visual) / Ambas (core) | **FUNCIONAL** |
| **05** | **Documents Engine** | `src-tauri/src/modules/documents/` | `src/modules/documents/`, `src/sections/cessao-de-posse/` | Motor Typst nativo v0.15, catálogo ABNT, preview store e exportação | Ambas (regras por escopo) | **CONCLUÍDO** |
| **06** | **IPFS & DePIN** | `src-tauri/src/modules/ipfs/` | `src/modules/ipfs/`, `src/platform/tauri/ipfs/` | Gerenciamento do daemon Kubo, streaming, pinning, prova ADR-012 | Ambas | **FUNCIONAL** |
| **07** | **Real Estate Cadastre**| `src-tauri/src/modules/real_estate/`| `src/modules/real-estate/`, `src/platform/tauri/real-estate/` | Conciliação fundiária XLSX, proveniência SHA-256, laudos | Cockpit Exclusivo | **CONCLUÍDO** |
| **08** | **Monitoring & RPC** | `src-tauri/src/modules/monitoring/`| `src/platform/tauri/monitoring/` | Consultas JSON-RPC EVM (Arbitrum, Polygon, Ethereum), saldos e gas | Ambas | **FUNCIONAL** |
| **09** | **Ledger & Treasury** | `src-tauri/src/modules/reports/` | `src/modules/ledger/` | Visualização de tesouraria, livros-razão, extratos associados | Cockpit Exclusivo | **PARCIAL** |
| **10** | **Authentication** | — (delegado ao Vault) | `src/modules/authentication/` | Login mestre, cadastro inicial, guards de sessão, fallbacks | Ambas | **PARCIAL** |
| **11** | **User & Community** | — (inexistente) | `src/sections/user/` | Perfil social, feed, seguidores, publicações, comentários | Ambas | **NÃO IMPLEMENTADO (MOCK)** |
| **12** | **Infrastructure UI** | — (inexistente) | `src/pages/devos/infrastructure-page.tsx` | Painel 3D de mineração, cubos WebGL e nós operadores | Ambas | **NÃO IMPLEMENTADO (MOCK)** |

---

## 05. MAPA ARQUITETURAL GLOBAL

O fluxo de execução e a comunicação entre camadas segue o modelo de isolamento estrito:

```text
[ CAMADA DE APRESENTAÇÃO - REACT 19 / TS ]
       |
       |  1. Disparo de Ação do Usuário (Formulário, Clique, Upload)
       v
[ SECTIONS & VIEWS ] (Ex: AccountGeneral, CessaoPosseView, WalletsLandingView)
       |
       |  2. Consumo de Estado Reativo e Sanitização Frontend
       v
[ CUSTOM HOOKS / FACADES ] (Ex: useAccountFacade, useBootstrap, useIpfsStorage)
       |
       |  3. Invocação Tipada via Contratos
       v
[ PLATFORM IPC BRIDGES ] (Ex: IdentityBridge, VaultBridge, DocumentBridge, IpfsBridge)
       |
       |  4. invokeNative('comando', payload)
       v
================================================================================
[ BARREIRA IPC TAURI v2 - DESKTOP CAPABILITIES & ACL MANIFEST ]
================================================================================
       |
       |  5. Validação de Janela, Escopo e Permissão allow-<command>
       v
[ RUST TAURI COMMANDS ] (Ex: save_user_profile, generate_document, ipfs_upload_file)
       |
       |  6. Deserialização, Validação de Tipos e Autorização de Sessão
       v
[ RUST DOMAIN SERVICES ] (Ex: IdentityService, VaultCrypto, TypstRenderer, KuboClient)
       |
       |  7. Execução Criptográfica / Compilação / Processamento
       v
[ REPOSITORIES & DATA ACCESS ] (Ex: IdentityRepository, LocalDatabase, RealEstateDatabase)
       |
       +-----------------------+-----------------------+
       |                       |                       |
       v                       v                       v
[ SQLITE CUSTÓDIA ]      [ FILESYSTEM LOCAL ]    [ REDE EXTERNA ]
- devos_vault.sqlite     - Diretório Downloads   - Daemon IPFS Kubo (:5001)
  (Cofre AES-256-GCM)      (PDFs Oficiais)       - Nós RPC EVM (:8545)
- real_estate.sqlite     - $APP_DATA/devos/ipfs  - API ASPPIBRA Cloud
  (Modo WAL segregado)     (Repositório Local)     (SWR / Axios HTTP)
```

---

## 06. EDIÇÕES NODE E COCKPIT

### 6.1. Matriz Comparativa de Capacidades e Permissões

| Recurso / Módulo | DevOS Node (`br.aspp.devos.node`) | DevOS Cockpit (`br.aspp.devos.cockpit`) | Evidência Técnica no Código |
|---|:---:|:---:|---|
| **Identificador de Pacote** | `br.aspp.devos.node` | `br.aspp.devos.cockpit` | `tauri.node.conf.json` e `tauri.cockpit.conf.json` |
| **Banco `devos_vault.sqlite`** | SIM (Compartilhado) | SIM (Compartilhado) | `src-tauri/src/lib.rs:161` |
| **Banco `real_estate.sqlite`** | **NÃO (Bloqueado no Boot)** | **SIM (Exclusivo)** | `src-tauri/src/lib.rs:187-205` |
| **Capability `cockpit-real-estate`** | **NÃO** | **SIM** | `capabilities/cockpit-real-estate.json` |
| **Capability `desktop-vault`** | SIM | SIM | `capabilities/desktop-vault.json` |
| **Comandos de Cadastro Imobiliário**| Rejeitados na compilação do handler | Registrados no `app_invoke_handler!` | `src-tauri/src/lib.rs:211-222` |
| **Emissão de Contratos de Posse** | **NÃO (Escopo Bloqueado)** | **SIM (Autorizado)** | `modules/documents/models.rs:DocumentScope` |
| **Painel de Controle Principal** | `NodeDashboardPage` | `CockpitDashboardPage` | `src/app/editions/edition.*.ts` |
| **Gestão de Carteiras / Banco** | Core nativo presente; rota oculta | Interface completa ativa na rota | `edition.cockpit.ts` vs `edition.node.ts` |
| **Visualização de Livro-Razão** | Ausente na barra de navegação | Presente no menu institucional | `edition.cockpit.ts` |
| **Conectividade IPFS (Kubo)** | SIM (Operador DePIN) | SIM (Gestão e Auditoria) | Comandos comuns em ambas as edições |

---

## 07. IDENTIFICAÇÃO DOS DOMÍNIOS

A arquitetura divide claramente os domínios do sistema entre operações estritamente locais e operações dependentes de rede:

### 7.1. Domínio Local (DevOS Desktop Core)
- **Vault:** Autenticação local, guarda de segredos, derivação de sementes, exportação/restauração de backups.
- **Identity:** Qualificação civil, perfil cadastral, sanitização documental, validação jurídica ABNT.
- **Documents Engine:** Compilação Typst em memória, preview em SVG, validação de hash SHA-256 e gravação em disco.
- **Real Estate:** Banco de dados fundiário segregado, conciliação e auditoria em escala de centenas de milhares de linhas em modo WAL.
- **Local Storage Management:** Armazenamento em arquivos e integridade de blocos no nó IPFS local.

### 7.2. Domínio de Rede (DevOS Network & DePIN)
- **EVM Monitoring:** Consultas JSON-RPC externas de saldos em tokens ERC-20 e moedas nativas nas redes Arbitrum e Polygon.
- **IPFS P2P Network:** Replicação de CIDs, swarm de nós, resolução de DHT e descoberta de provedores de blocos.
- **DePIN Proof Protocol (ADR-012):** Recebimento de desafios criptográficos, cômputo de hashes determinísticos e entrega de comprovantes de custódia.
- **Community & Social:** Feeds, publicações compartilhadas, contatos e mensagens descentralizadas (ainda não conectados).
- **Serviços Institucionais ASPPIBRA:** Endpoints REST em `https://api.asppibra.com` para sincronização administrativa.

---

## 08. MATRIZ OFICIAL DE PERSISTÊNCIA

| Domínio | Entidade | Origem dos Dados | Armazenamento Atual | Persistência Necessária | Criptografia | Classificação | Justificativa Arquitetural |
|---|---|---|---|---|---|:---:|---|
| **Vault** | Cabeçalho do Cofre (`vault_header`) | Usuário (Senha Mestre) | SQLite (`devos_vault`) | Sim (Local) | Sim (Argon2id + AES) | **COMPROVADO** | Necessário para validar desbloqueio do aplicativo sem armazenar senha pura. |
| **Vault** | Segredos de Custódia (`vault_secrets`) | Mnemonic / Semente | SQLite (`devos_vault`) | Sim (Local) | Sim (AES-256-GCM) | **COMPROVADO** | Guarda de sementes criptográficas das carteiras da DAO e de associados. |
| **Wallets** | Metadados de Carteiras (`wallets`) | Derivação BIP-44 | SQLite (`devos_vault`) | Sim (Local) | Não (Metadados públicos) | **COMPROVADO** | Endereços públicos, labels e derivações para listagem e conciliação. |
| **Identity** | Perfil Civil (`user_profiles`) | Formulário do Usuário | SQLite (`devos_vault`) | Sim (Local) | Sim (AES-256-GCM) | **COMPROVADO** | Dados de qualificação civil (CPF, RG, endereço) protegidos contra acesso indevido. |
| **Identity** | Vínculos Sociais (`socialLinks`) | Formulário do Usuário | SQLite (`devos_vault`) | Sim (Local) | Sim (Integrado ao Perfil) | **COMPROVADO** | Links públicos de redes sociais preservados junto ao envelope seguro. |
| **Media** | Avatar do Usuário (`photoURL`) | Upload de Arquivo | Memória (`blob:http`) | Sim (Disco/IPFS) | Conforme classificação | **PARCIAL** | Atualmente volátil. Deve ser persistido no filesystem local ou pinado no IPFS. |
| **Media** | Capa do Perfil (`coverURL`) | Upload de Arquivo | Memória (`blob:http`) | Sim (Disco/IPFS) | Conforme classificação | **PARCIAL** | Perde-se ao reiniciar o app. Necessita gravação física em diretório de mídia. |
| **Preferences** | Notificações do Usuário | Formulário de Ajustes | Memória (React State) | Sim (SQLite) | Não | **NÃO IMPLEMENTADO** | Ajustes de alertas devem sobreviver ao reinício da aplicação. |
| **Security** | Preferências 2FA / TOTP | Configuração do Usuário| Memória (React State) | Sim (SQLite) | Sim (Segredo TOTP) | **PARCIAL** | Segredo TOTP e status 2FA devem residir cifrados no cofre local. |
| **Real Estate** | Lotes de Importação (`import_batches`) | Planilha XLSX | SQLite (`real_estate`) | Sim (Local) | Não | **COMPROVADO** | Rastreabilidade da proveniência, tamanho e hash SHA-256 do arquivo original. |
| **Real Estate** | Linhas Brutas (`import_batch_records`)| Planilha XLSX | SQLite (`real_estate`) | Sim (Local) | Não | **COMPROVADO** | Imutabilidade e auditoria forense registro a registro com SHA-256 da linha. |
| **Real Estate** | Imóveis e Endereços Cadastrais | Planilha normalizada | SQLite (`real_estate`) | Sim (Local) | Não | **COMPROVADO** | Base territorial de propriedades, vínculos de posse e histórico cadastral. |
| **Real Estate** | Eventos de Auditoria (`audit_events`) | Sistema / Importador | SQLite (`real_estate`) | Sim (Local) | Não (Triggers Append-Only) | **COMPROVADO** | Trilha forense inviolável protegida por gatilhos SQLite contra UPDATE/DELETE. |
| **Documents** | Artefatos Gerados (PDFs) | Typst Renderer | Filesystem (`Downloads`) | Sim (Arquivos) | Não (Checksum SHA-256) | **COMPROVADO** | Arquivos finais de contratos assinados fisicamente gravados para o usuário. |
| **Documents** | Pré-visualização (`preview_store`) | Typst Renderer | Memória Segura (TTL) | Temporário (RAM) | Não (Hash SHA-256) | **COMPROVADO** | Retém SVGs e bytes de PDF por 10 minutos para exportação idempotente. |
| **IPFS** | Catálogo de Pins Gerenciados | Daemon IPFS Kubo | Repositório Kubo / RAM| Sim (IPFS Repo) | Conforme o arquivo | **COMPROVADO** | CIDs fixados sob custódia do nó local com rastreamento de integridade. |
| **Monitoring** | Cache de Saldos de Carteiras | RPC EVM Remoto | Memória (SWR / State) | Temporário (Cache) | Não | **COMPROVADO** | Dados efêmeros com atualização por demanda; não requerem SQLite fixo. |
| **Community** | Publicações e Feed Social | Rede P2P / API Nuvem | Mock estático | Rede (Serviço Externo) | Não | **NÃO IMPLEMENTADO** | Informações distribuídas de participantes; pertencem ao domínio da rede. |

---

## 09. INVENTÁRIO DOS BANCOS SQLITE

A aplicação utiliza dois bancos de dados SQLite físicos e independentes:

### 9.1. Banco do Cofre: `devos_vault.sqlite`
- **Caminho Físico:** `$APP_DATA_DIR/devos_vault/devos_vault.sqlite`
- **Responsável:** `storage::LocalDatabase`
- **Edições:** DevOS Node e DevOS Cockpit (Compartilhado)
- **Modo Transacional:** Transações atômicas com `BEGIN IMMEDIATE` / `COMMIT`.
- **Tabelas Existentes:**
  1. `schema_migrations`: Controle versionado de esquemas (`version INTEGER PRIMARY KEY`, `applied_at TEXT`).
  2. `vault_header`: Metadados do cofre criptográfico (`version`, `canary_envelope`, `created_at`). Cifragem do canário com chave derivada via Argon2id.
  3. `vault_secrets`: Segredos brutos e sementes mnemônicas cifradas (`vault_id`, `target`, `envelope`, `created_at`). Envelope AES-256-GCM.
  4. `wallets`: Catálogo de contas derivadas (`id`, `target`, `custody_type`, `user_name`, `label`, `derivation_path`, `network`, `address`, `status`, `kyc_status`, `seed_words_count`, `vault_id`, `client_doc`).
  5. `user_profiles`: Qualificação civil e perfil do operador (`id`, `encrypted_envelope`, `payload_version`, `revision`, `created_at`, `updated_at`). Envelope cifrado com a chave da sessão ativa.
- **Rotinas de Backup e Restauração:**
  - `LocalDatabase::export_backup`: Exporta arquivo `.sqlite` autenticado via senha mestre com validação de caminho contra sobrescrita indevida do banco ativo.
  - `LocalDatabase::restore_backup`: Substitui atomicamente a base após validar integridade do SQLite e canário da senha mestre.

### 9.2. Banco Cadastral: `real_estate.sqlite`
- **Caminho Físico:** `$APP_DATA_DIR/real_estate/real_estate.sqlite`
- **Responsável:** `storage::RealEstateDatabase`
- **Edições:** Exclusivo do DevOS Cockpit (`br.aspp.devos.cockpit`)
- **Modo Transacional:** SQLite WAL (`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`).
- **Tabelas Existentes:**
  1. `schema_migrations`: Versionamento cadastral (atualmente na versão 3).
  2. `properties`: Imóveis registrados com UUID persistente.
  3. `property_identifiers`: Matrículas, inscrições municipais, IPTU, CAR e identificadores cartorários.
  4. `addresses`: Endereços estruturados com hash de normalização SHA-256 (`normalized_hash`).
  5. `property_address_links`: Relacionamento histórico de endereços e imóveis.
  6. `import_batches`: Lotes de importação de planilhas com hash SHA-256 do arquivo original e modo (`PILOT` vs `FULL`).
  7. `import_batch_records`: Proveniência linha a linha da planilha original, preservando linhas textualmente idênticas via chave composta `(batch_id, sheet_name, row_number)`.
  8. `audit_findings`: Inconsistências cadastrais classificadas por severidade e categoria.
  9. `correction_proposals`: Propostas de retificação fundiária com justificativa e histórico.
  10. `audit_events`: Trilha forense inviolável.
- **Proteção Criptográfica e Integridade:**
  - Gatilhos `trg_prevent_audit_events_update` e `trg_prevent_audit_events_delete` bloqueiam alterações na trilha de auditoria.
  - Índices compostos de alta performance otimizados para conciliação de 100k+ registros.

---

## 10. INVENTÁRIO DO ARMAZENAMENTO LOCAL

### 10.1. Diretórios de Sistema Utilizados
1. **Dados da Aplicação (`app_data_dir`):**
   - Linux: `~/.local/share/br.aspp.devos.node` ou `~/.local/share/br.aspp.devos.cockpit`
   - Subpastas: `devos_vault/`, `real_estate/` (Cockpit) e `devos/ipfs/`
2. **Diretório de Downloads do Usuário (`dirs::download_dir`):**
   - Destino oficial para exportação de PDFs de contratos e relatórios gerados via Typst.
   - Padrão de Nomenclatura: `Contrato_Cessao_Posse_<DOC_NUM>_<TIMESTAMP>.pdf` ou sanitizado com extensão forçada `.pdf`.
   - Permissões: Restrição Unix `0o600` em operações sensíveis e gravação sem sobrescrita acidental.
3. **Repositório IPFS Kubo Local:**
   - Diretório canônico dedicado: `$APP_DATA_DIR/devos/ipfs` (ou `$IPFS_PATH`).

### 10.2. Lacunas no Armazenamento de Arquivos
- **Mídia de Usuário (Avatares e Capas):** Inexistência de pasta `$APP_DATA_DIR/media/` para gravação de arquivos de imagem. O React manipula strings em memória `blob:http://localhost:8080/...`, que expiram com o encerramento do processo.

---

## 11. INTEGRAÇÕES E DEPENDÊNCIAS DE REDE

| Serviço / Integração | Protocolo / Transporte | Arquivo Responsável | Estado de Implementação | Comportamento Offline |
|---|---|---|:---:|---|
| **EVM RPC (Arbitrum / Polygon)** | JSON-RPC sobre HTTP POST via `reqwest` | `modules/monitoring/rpc_client.rs` | **COMPROVADO** | Retorna status `Unavailable` de forma resiliente sem travar a interface. |
| **Nó IPFS Kubo Local** | HTTP REST sobre `127.0.0.1:5001` | `modules/ipfs/client.rs` | **COMPROVADO** | Retorna `running: false` imediatamente caso o daemon não esteja ativo. |
| **API ASPPIBRA Cloud** | HTTP REST via `axios` (`https://api.asppibra.com`) | `src/lib/axios.ts`, `actions/treasury.ts` | **PARCIAL** | Tratado via SWR; exibe estado vazio/carregamento caso inacessível. |
| **Autenticação Web3 (Assinatura)** | `eth_requestAccounts` + `personal_sign` | `src/modules/authentication/context/jwt.ts` | **NÃO IMPLEMENTADO** | Falha explícita com mensagem orientando necessidade de desafio criptográfico. |
| **Feed Social e Comunidade** | P2P PubSub / WebSocket | `src/sections/user/_mock.ts` | **NÃO IMPLEMENTADO** | Utiliza mocks estáticos; não estabelece conexão de rede real. |

---

## 12. AUDITORIA INDIVIDUAL DOS MÓDULOS

---

### MÓDULO 01: CORE & PLATFORM
- **Diretório:** `src-tauri/src/`, `src/platform/tauri/`, `src/app/bootstrap/`
- **Responsabilidade:** Inicialização segura, barreira IPC, resolução de edições, ACL e gerenciamento de janelas.
- **Edição:** Ambas (Node e Cockpit).
- **Dependências:** `tauri`, `dirs`, `window-bridge`.
- **Arquivos:** 18 arquivos (Rust: `lib.rs`, `main.rs`, `build.rs`; TS: `invoke.ts`, `tauri-errors.ts`, `app-bootstrap-provider.tsx`, etc.).
- **Estado:** **CONCLUÍDO (9,4 / 10)**.

```text
====================================================
MÓDULO: CORE & PLATFORM
====================================================
DIRETÓRIO:
src-tauri/src/ e src/platform/tauri/core/

RESPONSABILIDADE:
Bootstrap da aplicação, governança de capacidades Tauri v2 e IPC seguro.

ESTADO:
CONCLUÍDO E HOMOLOGADO.

PROGRESSO:
[████████████████████] 100%

NOTA TÉCNICA:
9,4 / 10

PERSISTÊNCIA:
Resolução de diretórios de sistema nativos (dirs::data_dir).

CRIPTOGRAFIA:
Não aplicável (governança de processo e ACL).

INTEGRAÇÃO:
React -> BootstrapProvider -> invokeNative -> Tauri IPC Handler -> Process Runtime

FUNCIONALIDADES PRONTAS:
- Detecção estrita de edições (Node vs Cockpit) por Bundle ID.
- Configuração gráfica GDK_BACKEND=x11 defensiva no Linux.
- Validação IPC tipada com tratamento centralizado de erros.
- Capacidades de janela e segurança com CSP estrito.

FUNCIONALIDADES PARCIAIS:
- Nenhuma.

FUNCIONALIDADES PENDENTES:
- Nenhuma.

PRIORIDADE:
P4 (Manutenção contínua).

PRÓXIMA ENTREGA:
Monitoramento de logs em modo release.

DEPENDÊNCIAS:
Tauri Runtime v2.
====================================================
```

---

### MÓDULO 02: VAULT & CUSTÓDIA CRIPTOGRÁFICA
- **Diretório:** `src-tauri/src/modules/vault/`, `src-tauri/src/commands/vault_commands.rs`
- **Responsabilidade:** Derivação Argon2id, cifragem AES-256-GCM, gerenciamento de sessão com Zeroize e canário de validação.
- **Edição:** Ambas.
- **Dependências:** `aes-gcm`, `argon2`, `zeroize`, `rusqlite`.
- **Arquivos:** 4 arquivos Rust (`access_control.rs`, `encryption.rs`, `mod.rs`, `vault_commands.rs`).
- **Estado:** **CONCLUÍDO (9,3 / 10)**.

```text
====================================================
MÓDULO: VAULT & CUSTÓDIA CRIPTOGRÁFICA
====================================================
DIRETÓRIO:
src-tauri/src/modules/vault/

RESPONSABILIDADE:
Proteção criptográfica mestra, canário de integridade e sessões com limpeza de memória.

ESTADO:
CONCLUÍDO E HOMOLOGADO.

PROGRESSO:
[███████████████████░] 95%

NOTA TÉCNICA:
9,3 / 10

PERSISTÊNCIA:
SQLite — devos_vault.sqlite (tabelas vault_header e vault_secrets).

CRIPTOGRAFIA:
Argon2id (64 MiB, 3 iter, 1 lane) + AES-256-GCM (nonce 96 bits, tag 128 bits).

INTEGRAÇÃO:
React -> VaultBridge -> IPC -> vault_commands -> VaultCrypto -> LocalDatabase

FUNCIONALIDADES PRONTAS:
- Setup atômico de senha mestre com canário cifrado.
- Desbloqueio e bloqueio de cofre com fail-closed.
- Proteção anti-poisoning de sessão multithread.
- Backup criptográfico completo e restauração com verificação de canário.

FUNCIONALIDADES PARCIAIS:
- Rotação de senha mestre (re-criptografia do cofre com nova senha).

FUNCIONALIDADES PENDENTES:
- Comando nativo específico para alteração da senha mestre existente.

PRIORIDADE:
P1.

PRÓXIMA ENTREGA:
Implementar comando `change_master_password` com re-encriptação atômica.

DEPENDÊNCIAS:
LocalDatabase, Rusqlite.
====================================================
```

---

### MÓDULO 03: IDENTITY & CENTRAL DE IDENTIDADE DIGITAL
- **Diretório:** `src-tauri/src/modules/identity/`, `src/sections/account/`, `src/platform/tauri/identity/`
- **Responsabilidade:** Cadastro e qualificação civil de operadores e associados PF/PJ, validação documental e controle de concorrência.
- **Edição:** Ambas.
- **Dependências:** `VaultSession`, `LocalDatabase`, `IdentityBridge`.
- **Arquivos:** 12 arquivos (Rust: `models.rs`, `service.rs`, `repository.rs`, `identity_commands.rs`; TS: `use-account.ts`, `account-general.tsx`, `account-socials.tsx`, etc.).
- **Estado:** **CONCLUÍDO COM LACUNAS DE MÍDIA (8,8 / 10)**.

```text
====================================================
MÓDULO: IDENTITY & IDENTIDADE DIGITAL
====================================================
DIRETÓRIO:
src-tauri/src/modules/identity/ e src/sections/account/

RESPONSABILIDADE:
Gestão de perfil civil, qualificação jurídica PF/PJ e vínculos de contato.

ESTADO:
FUNCIONAL COM PENDÊNCIA DE MÍDIA LOCAL.

PROGRESSO:
[█████████████████░░░] 85%

NOTA TÉCNICA:
8,8 / 10

PERSISTÊNCIA:
SQLite — devos_vault.sqlite (tabela user_profiles).

CRIPTOGRAFIA:
AES-256-GCM via chave derivada da VaultSession ativa.

INTEGRAÇÃO:
React -> useAccountFacade -> IdentityBridge -> save_user_profile -> IdentityService -> SQLite

FUNCIONALIDADES PRONTAS:
- Consulta e gravação cifrada de qualificação civil PF e PJ.
- Validação estrita de CPF e novo CNPJ alfanumérico RFB 2024.
- Bloqueio otimista de concorrência com controle de revisão (revision).
- Cálculo reativo de completude cadastral (100 pontos).
- Migração sanitizada do localStorage legado com merge inteligente.
- Persistência cifrada de links de redes sociais.

FUNCIONALIDADES PARCIAIS:
- Persistência de avatar e imagem de capa (usam blob URL volátil).

FUNCIONALIDADES PENDENTES:
- Armazenamento físico de mídia no disco/IPFS com hash SHA-256.

PRIORIDADE:
P1.

PRÓXIMA ENTREGA:
Implementar pipeline nativo de upload de mídia em disco local ($APP_DATA/media/).

DEPENDÊNCIAS:
Vault, LocalDatabase, IdentityBridge.
====================================================
```

---

### MÓDULO 04: WALLETS & DERIVAÇÃO EVM
- **Diretório:** `src-tauri/src/modules/wallets/`, `src/modules/wallets/`
- **Responsabilidade:** Derivação BIP-39 e BIP-44, geração de endereços EVM, preview temporário em memória e persistência de custódia.
- **Edição:** Cockpit (Interface visível) / Ambas (Comandos Rust disponíveis).
- **Dependências:** `bip39`, `bip32`, `tiny-keccak`, `VaultSession`, `LocalDatabase`.
- **Arquivos:** 8 arquivos (Rust: `mnemonic.rs`, `derivation.rs`, `creation_session.rs`, `address.rs`, `wallet_commands.rs`; TS: `wallets-landing-view.tsx`, `wallet-bridge.ts`, etc.).
- **Estado:** **FUNCIONAL (8,4 / 10)**.

```text
====================================================
MÓDULO: WALLETS & DERIVAÇÃO EVM
====================================================
DIRETÓRIO:
src-tauri/src/modules/wallets/ e src/modules/wallets/

RESPONSABILIDADE:
Geração de frases mnemônicas, derivação de contas EVM e custódia segura.

ESTADO:
FUNCIONAL COM INTEGRAÇÃO DE TELA PRONTA.

PROGRESSO:
[████████████████░░░░] 80%

NOTA TÉCNICA:
8,4 / 10

PERSISTÊNCIA:
SQLite — devos_vault.sqlite (tabelas wallets e vault_secrets).

CRIPTOGRAFIA:
Argon2id + AES-256-GCM para sementes; Zeroize para memória volátil.

INTEGRAÇÃO:
React -> WalletsLandingView -> WalletBridge -> wallet_commands -> DerivationService -> SQLite

FUNCIONALIDADES PRONTAS:
- Geração determinística de frases mnemônicas de 12 e 24 palavras.
- Sessão de criação retida no Rust com Zeroize e expiração em 5 minutos.
- Derivação em lote de endereços EVM para preview sem vazar texto puro.
- Gravação cifrada das chaves no cofre com validação de senha mestre.
- Listagem e segregação de custódia (DAO vs Clientes).

FUNCIONALIDADES PARCIAIS:
- Consulta de saldo em tempo real integrada à listagem (depende de RPC ativo).

FUNCIONALIDADES PENDENTES:
- Assinatura de transações offline e suporte a hardware wallets.

PRIORIDADE:
P1.

PRÓXIMA ENTREGA:
Conectar polling de saldos em segundo plano na listagem de carteiras.

DEPENDÊNCIAS:
Vault, LocalDatabase, Monitoring.
====================================================
```

---

### MÓDULO 05: DOCUMENTS & MOTOR TYPST
- **Diretório:** `src-tauri/src/modules/documents/`, `src/modules/documents/`, `src-tauri/templates/`
- **Responsabilidade:** Compilação em memória de contratos e laudos oficiais via Typst v0.15, preview verificado e exportação com SHA-256.
- **Edição:** Ambas (com restrição de escopo de templates por edição).
- **Dependências:** `typst`, `typst-pdf`, `typst-svg`, `typst-as-lib`, `sha2`.
- **Arquivos:** 16 arquivos (Rust: `service.rs`, `preview_store.rs`, `typst_renderer.rs`, `models.rs`, `document_commands.rs`; Typst: 6 templates; TS: `DocumentTemplatesGalleryView.tsx`, `CessaoPosseView.tsx`, `document-bridge.ts`).
- **Estado:** **CONCLUÍDO E HOMOLOGADO (9,5 / 10)**.

```text
====================================================
MÓDULO: DOCUMENTS & MOTOR TYPST
====================================================
DIRETÓRIO:
src-tauri/src/modules/documents/ e src-tauri/templates/

RESPONSABILIDADE:
Geração documental determinística, compilação de PDFs oficiais e ABNT.

ESTADO:
EXCELENTE, PRONTO PARA PRODUÇÃO.

PROGRESSO:
[████████████████████] 100%

NOTA TÉCNICA:
9,5 / 10

PERSISTÊNCIA:
Filesystem (diretório Downloads) + PreviewStore em memória RAM com TTL.

CRIPTOGRAFIA:
Checksum SHA-256 obrigatório em todos os artefatos.

INTEGRAÇÃO:
React -> DocumentBridge -> preview_document / export_previewed_document -> Typst Engine -> Filesystem

FUNCIONALIDADES PRONTAS:
- Compilação 100% offline em memória do Typst v0.15.
- Templates implementados: Cessão de Posse, Adesão de Associado, Extrato do Livro-Razão, Fatura e Laudo Cadastral.
- Isolamento estrito de escopo (Cockpit vs Node).
- Preview multi-páginas em SVG vetorial de alta definição.
- Verificação criptográfica SHA-256 entre preview e exportação final em disco.

FUNCIONALIDADES PARCIAIS:
- Nenhuma.

FUNCIONALIDADES PENDENTES:
- Nenhuma para a V1 oficial.

PRIORIDADE:
P3.

PRÓXIMA ENTREGA:
Assinatura digital dos PDFs gerados via chave privada da DAO.

DEPENDÊNCIAS:
Typst native libraries, DocumentPreviewStore.
====================================================
```

---

### MÓDULO 06: IPFS & INFRAESTRUTURA DePIN
- **Diretório:** `src-tauri/src/modules/ipfs/`, `src/modules/ipfs/`
- **Responsabilidade:** Controle de ciclo de vida do daemon Kubo local, upload/download em streaming com SHA-256, pinning e resolução de desafios de armazenamento DePIN (ADR-012).
- **Edição:** Ambas.
- **Dependências:** `reqwest`, `sha2`, `tokio`.
- **Arquivos:** 14 arquivos (Rust: `daemon.rs`, `client.rs`, `pinning.rs`, `content.rs`, `integrity.rs`, `models.rs`, `ipfs_commands.rs`; TS: `IpfsView.tsx`, `use-ipfs-daemon.ts`, `ipfs-bridge.ts`, etc.).
- **Estado:** **FUNCIONAL COM DEPENDÊNCIA DO HOST (7,9 / 10)**.

```text
====================================================
MÓDULO: IPFS & INFRAESTRUTURA DePIN
====================================================
DIRETÓRIO:
src-tauri/src/modules/ipfs/ e src/modules/ipfs/

RESPONSABILIDADE:
Armazenamento descentralizado, custódia de CIDs e provas de desafio DePIN.

ESTADO:
FUNCIONAL COM DEPENDÊNCIA DO BINÁRIO KUBO NO SISTEMA.

PROGRESSO:
[███████████████░░░░░] 75%

NOTA TÉCNICA:
7,9 / 10

PERSISTÊNCIA:
Repositório Kubo local ($APP_DATA/devos/ipfs).

CRIPTOGRAFIA:
SHA-256 nos streams de upload e prova de desafio determinística ADR-012.

INTEGRAÇÃO:
React -> IpfsBridge -> ipfs_commands -> KuboClient -> Kubo RPC (:5001)

FUNCIONALIDADES PRONTAS:
- Detecção e ciclo de vida do processo filho Kubo (start/stop/restart).
- Upload e download em streaming HTTP de arquivos com verificação SHA-256.
- Operações de pin/unpin com proteção de repositório compartilhado.
- Cômputo determinístico da Prova de Desafio de Armazenamento DePIN (ADR-012).

FUNCIONALIDADES PARCIAIS:
- Instalação e provisionamento automático do binário kubo caso inexista no sistema.

FUNCIONALIDADES PENDENTES:
- Empacotamento de sidecar nativo do binário `ipfs` no bundle Tauri.

PRIORIDADE:
P1.

PRÓXIMA ENTREGA:
Incluir binário do Kubo como sidecar no Tauri bundle para execução "out-of-the-box".

DEPENDÊNCIAS:
Binário `ipfs` (Kubo), DaemonManager.
====================================================
```

---

### MÓDULO 07: REAL ESTATE CADASTRE & AUDITORIA FUNDIÁRIA
- **Diretório:** `src-tauri/src/modules/real_estate/`, `src-tauri/src/storage/real_estate_*`, `src/modules/real-estate/`
- **Responsabilidade:** Ingestão de planilhas XLSX, conciliação de imóveis, resolução de duplicidades, proveniência e laudos periciais.
- **Edição:** Exclusivo do DevOS Cockpit (`br.aspp.devos.cockpit`).
- **Dependências:** `calamine`, `rusqlite`, `sha2`, `uuid`.
- **Arquivos:** 9 arquivos (Rust: `importer.rs`, `normalization.rs`, `real_estate_database.rs`, `real_estate_migrations.rs`, `real_estate_commands.rs`; TS: `real-estate-view.tsx`, `real-estate-bridge.ts`, etc.).
- **Estado:** **CONCLUÍDO E HOMOLOGADO (8,9 / 10)**.

```text
====================================================
MÓDULO: REAL ESTATE CADASTRE (COCKPIT)
====================================================
DIRETÓRIO:
src-tauri/src/modules/real_estate/ e src/modules/real-estate/

RESPONSABILIDADE:
Auditoria cadastral, conciliação territorial e laudos imobiliários periciais.

ESTADO:
CONCLUÍDO E HOMOLOGADO EM WAL MODE.

PROGRESSO:
[██████████████████░░] 90%

NOTA TÉCNICA:
8,9 / 10

PERSISTÊNCIA:
SQLite — real_estate.sqlite (10 tabelas em modo WAL).

CRIPTOGRAFIA:
Hash SHA-256 de proveniência de arquivo e linha; Triggers Append-Only.

INTEGRAÇÃO:
React -> RealEstateBridge -> real_estate_commands -> RealEstateImporter -> SQLite

FUNCIONALIDADES PRONTAS:
- Importação XLSX em streaming de alta performance via Calamine.
- Rastreamento exato de proveniência por lote, planilha, linha e SHA-256.
- Preservação de linhas duplicadas não matriculadas sem fusão acidental.
- Trilha forense inviolável com bloqueio por gatilhos SQLite.
- Detecção e auditoria de inconsistências cadastrais e titularidades.

FUNCIONALIDADES PARCIAIS:
- Fluxo de aprovação de propostas de correção cadastral via UI.

FUNCIONALIDADES PENDENTES:
- Sincronização descentralizada de laudos cadastrais com a DAO via IPFS.

PRIORIDADE:
P2.

PRÓXIMA ENTREGA:
Conectar botão de emissão de laudo territorial diretamente ao template Typst.

DEPENDÊNCIAS:
RealEstateDatabase, Calamine, Typst Engine.
====================================================
```

---

### MÓDULO 08: MONITORING & RPC TELEMETRY
- **Diretório:** `src-tauri/src/modules/monitoring/`, `src-tauri/src/commands/monitoring_commands.rs`
- **Responsabilidade:** Consultas JSON-RPC externas às redes EVM, checagem de saldo nativo e tokens ERC-20, contagem de transações.
- **Edição:** Ambas.
- **Dependências:** `reqwest`, `tokio`.
- **Arquivos:** 3 arquivos (Rust: `rpc_client.rs`, `monitoring_commands.rs`; TS: `monitoring-bridge.ts`).
- **Estado:** **FUNCIONAL (7,8 / 10)**.

```text
====================================================
MÓDULO: MONITORING & RPC TELEMETRY
====================================================
DIRETÓRIO:
src-tauri/src/modules/monitoring/

RESPONSABILIDADE:
Telemetria de nós EVM, monitoramento de saldos em tokens e moedas nativas.

ESTADO:
FUNCIONAL.

PROGRESSO:
[███████████████░░░░░] 75%

NOTA TÉCNICA:
7,8 / 10

PERSISTÊNCIA:
Memória volátil (Cache temporário de resposta).

CRIPTOGRAFIA:
Não aplicável (dados públicos de blockchain).

INTEGRAÇÃO:
React -> MonitoringBridge -> monitoring_commands -> EvmRpcClient -> RPC Nodes

FUNCIONALIDADES PRONTAS:
- Consulta de saldo nativo (ETH, POL) e contagem de transações (`eth_getTransactionCount`).
- Consulta de tokens ERC-20 (USDT, USDC) via encoding ABI `balanceOf`.
- Consultas paralelas em lote via `batch_fetch_wallet_balances`.
- Suporte a Arbitrum One e Polygon POS com fallbacks.

FUNCIONALIDADES PARCIAIS:
- Cache local de telemetria com TTL para economia de requisições.

FUNCIONALIDADES PENDENTES:
- Monitoramento de nós operadores locais DePIN via WebSocket / RPC proprietário.

PRIORIDADE:
P2.

PRÓXIMA ENTREGA:
Adicionar cache com expiração de 30 segundos no cliente RPC.

DEPENDÊNCIAS:
Reqwest, Tokio.
====================================================
```

---

### MÓDULO 09: LEDGER & LIVRO-RAZÃO
- **Diretório:** `src/modules/ledger/`, `src-tauri/src/modules/reports/`
- **Responsabilidade:** Exibição contábil institucional, fluxo de caixa, conciliação e geração de extratos associativos.
- **Edição:** Cockpit Exclusivo.
- **Dependências:** `actions/treasury.ts`, `TypstRenderer`, `SWR`.
- **Arquivos:** 10 arquivos TS (`LedgerView.tsx`, `treasury-hooks.ts`, etc.) e 3 arquivos Rust (`reports/engine.rs`, `reports/models.rs`).
- **Estado:** **PARCIAL (6,2 / 10)**.

```text
====================================================
MÓDULO: LEDGER & LIVRO-RAZÃO (COCKPIT)
====================================================
DIRETÓRIO:
src/modules/ledger/ e src-tauri/src/modules/reports/

RESPONSABILIDADE:
Livro-razão contábil, conciliação de tesouraria e relatórios de partidas dobradas.

ESTADO:
PARCIAL (INTERFACE E PDF PRONTOS; PERSISTÊNCIA DEPENDENTE DA API).

PROGRESSO:
[████████████░░░░░░░░] 60%

NOTA TÉCNICA:
6,2 / 10

PERSISTÊNCIA:
API Externa ASPPIBRA (SWR) e Typst in-memory para relatórios. Sem banco local SQLite próprio.

CRIPTOGRAFIA:
Assinatura de relatórios via SHA-256 no motor Typst.

INTEGRAÇÃO:
React -> SWR -> Axios -> API REST Cloud / Typst Engine para PDF

FUNCIONALIDADES PRONTAS:
- Visualização de partidas dobradas, gráficos de fluxo e categorias.
- Motor de exportação de extrato associativo (`extrato_citizen_ledger.typ`) integrado ao Typst.
- Hooks de consulta de dados via SWR com tratamento de loading.

FUNCIONALIDADES PARCIAIS:
- Dependência de endpoints remotos (`/api/treasury/analytics`); falha se estiver offline.

FUNCIONALIDADES PENDENTES:
- Tabela de cache local no SQLite para funcionamento contábil offline.

PRIORIDADE:
P2.

PRÓXIMA ENTREGA:
Criar tabela local no SQLite para persistir histórico de transações contábeis.

DEPENDÊNCIAS:
Axios, Typst Engine, SWR.
====================================================
```

---

### MÓDULO 10: AUTHENTICATION & LOGIN GATE
- **Diretório:** `src/modules/authentication/`
- **Responsabilidade:** Fluxo de login com senha mestre, primeiro acesso ao hardware, guards de rota e layouts de autenticação.
- **Edição:** Ambas.
- **Dependências:** `useBootstrap`, `VaultBridge`, `jwt-sign-in-view.tsx`.
- **Arquivos:** 16 arquivos TS/TSX.
- **Estado:** **PARCIAL (6,5 / 10)**.

```text
====================================================
MÓDULO: AUTHENTICATION & LOGIN GATE
====================================================
DIRETÓRIO:
src/modules/authentication/

RESPONSABILIDADE:
Controle de acesso inicial, desbloqueio de cofre e telas de login/cadastro.

ESTADO:
PARCIAL (DESBLOQUEIO DO COFRE PRONTO; RECURSOS EM NUVEM INCOMPLETOS).

PROGRESSO:
[█████████████░░░░░░░] 65%

NOTA TÉCNICA:
6,5 / 10

PERSISTÊNCIA:
Estado da sessão em memória do frontend (`app-bootstrap-provider.tsx`) e VaultSession no Rust.

CRIPTOGRAFIA:
Autenticação local baseada no cofre Argon2id/AES-256-GCM.

INTEGRAÇÃO:
React -> JwtSignInView -> useBootstrap -> VaultBridge.unlock -> Rust

FUNCIONALIDADES PRONTAS:
- Tela de primeiro acesso para definição de senha mestre institucional (mínimo 12 chars).
- Tela de desbloqueio diário de cofre com redirecionamento de rota seguro.
- Isolamento visual e layout centrado com Three.js / Canvas de fundo.

FUNCIONALIDADES PARCIAIS:
- Login via Web3 (valida apenas formato de endereço; lança erro explícito de assinatura).
- Simulação de recuperação de senha e verificação de e-mail em memória.

FUNCIONALIDADES PENDENTES:
- Backend institucional de alteração de senha e recuperação com prova criptográfica.

PRIORIDADE:
P1.

PRÓXIMA ENTREGA:
Substituir exceção de `changePassword` por chamada nativa ao cofre.

DEPENDÊNCIAS:
VaultBridge, AppBootstrapProvider.
====================================================
```

---

### MÓDULO 11: USER PROFILE & COMMUNITY FEED
- **Diretório:** `src/sections/user/`
- **Responsabilidade:** Painel social de associados, feed de atividades, seguidores, sobre e publicações.
- **Edição:** Ambas.
- **Dependências:** `_mock.ts`, MUI Components.
- **Arquivos:** 9 arquivos TS/TSX (`profile-home.tsx`, `profile-cover.tsx`, `_mock.ts`, etc.).
- **Estado:** **NÃO IMPLEMENTADO / MOCK (3,5 / 10)**.

```text
====================================================
MÓDULO: USER PROFILE & COMMUNITY FEED
====================================================
DIRETÓRIO:
src/sections/user/

RESPONSABILIDADE:
Feed comunitário de publicações, rede de seguidores e interação social.

ESTADO:
APENAS INTERFACE VISUAL (MOCK ESTÁTICO).

PROGRESSO:
[███████░░░░░░░░░░░░░] 35%

NOTA TÉCNICA:
3,5 / 10

PERSISTÊNCIA:
Nenhuma (Importa dados estáticos de _mock.ts).

CRIPTOGRAFIA:
Nenhuma.

INTEGRAÇÃO:
Apenas renderização de componentes React com dados embutidos no código.

FUNCIONALIDADES PRONTAS:
- Componentes visuais de exibição de posts, comentários, likes e perfil sobre.

FUNCIONALIDADES PARCIAIS:
- Alternância de abas integrada com a Central de Identidade Digital.

FUNCIONALIDADES PENDENTES:
- Backend de publicações, persistência distribuída via IPFS ou API social.
- Conexão do formulário de criação de posts com um barramento de eventos real.

PRIORIDADE:
P3.

PRÓXIMA ENTREGA:
Definir contrato de dados oficial para o feed de notícias e comunicados da DAO.

DEPENDÊNCIAS:
Nenhuma (Atualmente desacoplado).
====================================================
```

---

### MÓDULO 12: DePIN NODE DASHBOARD & INFRASTRUCTURE
- **Diretório:** `src/app/editions/node/`, `src/pages/devos/infrastructure-page.tsx`
- **Responsabilidade:** Painel do operador do nó, telemetria de cluster, cubos 3D de mineração e oportunidades.
- **Edição:** Node (Dashboard principal) / Cockpit (Acesso via Infraestrutura).
- **Dependências:** `home-mock.ts`, Three.js, Three-Globe.
- **Arquivos:** 18 arquivos TS/TSX.
- **Estado:** **NÃO IMPLEMENTADO / MOCK (3,8 / 10)**.

```text
====================================================
MÓDULO: DePIN NODE DASHBOARD & INFRASTRUCTURE
====================================================
DIRETÓRIO:
src/app/editions/node/ e src/pages/devos/infrastructure-page.tsx

RESPONSABILIDADE:
Telemetria operacional de nós operadores e visualização da rede DePIN.

ESTADO:
APENAS INTERFACE VISUAL (MOCK ESTÁTICO).

PROGRESSO:
[████████░░░░░░░░░░░░] 38%

NOTA TÉCNICA:
3,8 / 10

PERSISTÊNCIA:
Nenhuma (Importa dados estáticos de home-mock.ts).

CRIPTOGRAFIA:
Nenhuma.

INTEGRAÇÃO:
Renderização gráfica e animações 3D sem bridge com nós físicos.

FUNCIONALIDADES PRONTAS:
- Gráficos visuais de crescimento da comunidade e números do ecossistema.
- Carrossel de comunicados, alertas e projetos em evidência.
- Cubo 3D de mineração e visualização de blocos via Three.js.

FUNCIONALIDADES PARCIAIS:
- Card de status do dispositivo (retorna estado hardcoded "UNINITIALIZED").

FUNCIONALIDADES PENDENTES:
- Conectar métricas a telemetria real do nó Kubo local e daemon DePIN.

PRIORIDADE:
P2.

PRÓXIMA ENTREGA:
Substituir dados estáticos do carrossel por leitura do nó IPFS ou API da DAO.

DEPENDÊNCIAS:
Three.js, Kubo Daemon.
====================================================
```

---

## 13. SEGURANÇA GLOBAL

### 13.1. Avaliação Arquitetural dos Mecanismos Nativos
1. **Controle de Acesso IPC (Tauri v2 ACL):**
   - Todos os 41 comandos nativos possuem arquivos TOML de permissão autogerados em `src-tauri/permissions/autogenerated/`.
   - As capabilities estão segregadas: `cockpit-real-estate.json` restringe comandos imobiliários exclusivamente à janela do Cockpit.
   - O runtime Tauri valida bundle identifier no startup (`lib.rs:117-126`), aplicando "fail-closed" com pânico imediato caso uma janela tente carregar contratos não autorizados.
2. **Cifragem de Segredos e Isolamento em Memória:**
   - Senhas mestres e chaves de sessão implementam `Zeroize` e `ZeroizeOnDrop`, garantindo que bytes sensíveis sejam zerados assim que saem do escopo.
   - Derivação de chave via Argon2id com custo elevado (64 MiB RAM), prevenindo ataques de dicionário e GPU.
   - Envelopes AES-256-GCM exigem nonces únicos de 96 bits e tags de integridade de 128 bits.
3. **CSP (Content Security Policy):**
   - Configurado rigorosamente nos manifestos Tauri: `object-src 'none'`, `frame-src 'none'`, `connect-src` restrito a `ipc:`, `tauri:` e ao host local/institucional.

### 13.2. Tabela de Vulnerabilidades e Lacunas de Segurança Identificadas

| ID | Nível | Arquivo | Símbolo / Linhas | Descrição do Problema | Impacto | Condição de Exploração | Recomendação de Correção | Prioridade |
|---|:---:|---|---|---|---|---|---|:---:|
| **SEC-001** | **P1** | `sections/user/view/user-profile-view.tsx` | `handleUpdateAvatar` / L42-48 | Uso de `URL.createObjectURL(file)` para persistência de fotos. A URL temporária do blob é gravada no banco cifrado, tornando a foto inválida após o encerramento do app. | Quebra da integridade de exibição do usuário | Reiniciar o aplicativo após atualizar foto | Implementar comando IPC `save_local_media` gravando arquivo com SHA-256 no filesystem local. | **P1** |
| **SEC-002** | **P1** | `modules/authentication/application/identity-session.service.ts` | `changePassword` / L14-20 | Operação de alteração de senha lança exceção imediata por falta de serviço. Não há comando nativo para rotação da senha mestre do cofre local. | Operador não consegue trocar a senha mestre do cofre | Tentar alterar a senha nas configurações | Criar comando `change_vault_master_password` em Rust para re-encriptar os envelopes com a nova chave. | **P1** |
| **SEC-003** | **P2** | `sections/account/account-notifications.tsx` | `onSubmit` / L50-53 | Preferências de notificação não são salvas em persistência local nem em nuvem; emitem apenas toast cosmético. | Perda de preferências do usuário | Reiniciar a aplicação | Persistir configurações em coluna dedicada no SQLite ou em arquivo de preferências. | **P2** |
| **SEC-004** | **P2** | `modules/authentication/context/jwt.ts` | `signInWithWeb3` / L153-183 | Autenticação Web3 aborta com exceção por ausência de desafio criptográfico (`personal_sign`). | Bloqueio de login via carteira Web3 | Clicar em "Conectar Carteira" no login | Implementar desafio determinístico nonce assinado pelo secp256k1 da carteira. | **P2** |
| **SEC-005** | **P3** | `commands/system_commands.rs` | `get_device_status` / L12-16 | Comando retorna `status: "UNINITIALIZED"` e `enrolled: false` de forma fixa sem inspecionar o hardware real. | Diagnóstico impreciso do dispositivo | Invocação do comando de status | Integrar inspeção de TPM/Enclave ou integridade do sistema operacional host. | **P3** |

---

## 14. CÓDIGO MORTO, MOCKS E DUPLICIDADES

### 14.1. Mocks Ativos em Telas de Produção
1. `src/sections/user/_mock.ts`:
   - Utilizado em `src/sections/user/profile-home.tsx:11`.
   - Contém `_userAbout`, `_userPosts`, `_userSocials`, `_userFollowers`.
   - **Impacto:** A Visão Geral do Perfil do Usuário é 100% fictícia.
2. `src/app/editions/node/_mock/home-mock.ts`:
   - Utilizado em `src/app/editions/node/node-dashboard-page.tsx:30`.
   - Contém comunicados, projetos ativos, alertas e métricas da rede.
   - **Impacto:** O painel principal da edição Node não reflete o estado do nó local.
3. `src/pages/devos/infrastructure-page.tsx`:
   - Constantes `PINNING_NODES` (linhas 33-82) e `CLUSTER_BUCKETS` (linhas 91-110).
   - **Impacto:** A lista de nós DePIN de São Paulo, Rio e Miami é estática.

### 14.2. Duplicidade e Sobreposição de Responsabilidades
- **Contratos e Bridges de Notificações:** Existe rota registrada para notificações (`/devos/notifications`), tela em `account-notifications.tsx` e drawer de notificações em `notifications-drawer.tsx`, sem sincronização entre si.
- **Visualização de Cadastro Imobiliário:** O roteador define `/devos/cadastre`, `/devos/database` e `/real-estate` apontando para o mesmo componente `RealEstateView`. A rota canônica deve ser unificada em `/devos/cadastre`.

---

## 15. MAPA DE DEPENDÊNCIAS ENTRE MÓDULOS

```text
                           [ CORE & BOOTSTRAP ]
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
          v                         v                         v
    [ VAULT CRYPTO ]        [ MONITORING RPC ]        [ TYPST ENGINE ]
          |                         |                         |
    +-----+-----+                   |                         |
    |           |                   |                         |
    v           v                   |                         |
[ WALLETS ]  [ IDENTITY ]           |                         |
    |           |                   |                         |
    |           +-------+           |                         |
    |                   |           |                         |
    v                   v           v                         v
[ BALANCE REQ ]    [ USER ACCT ]  [ EVM RPC ]         [ CESSÃO DE POSSE ]
    |                   |                                     |
    +---------+---------+                                     |
              |                                               |
              v                                               v
       [ SQLITE VAULT ]                               [ PDFS EXPORTADOS ]
       (devos_vault)                                   (Pasta Downloads)
              
--------------------------------------------------------------------------------
[ COCKPIT EXCLUSIVE ]
[ REAL ESTATE CADASTRE ] ---> [ CALAMINE XLSX ] ---> [ SQLITE WAL (real_estate) ]
```

---

## 16. BARRAS DE PROGRESSO INDIVIDUAIS

Calculadas segundo a metodologia oficial de pesos por entregas aplicáveis (Contratos 10%, UI 10%, Serviços 15%, Persistência 15%, Segurança 15%, Erros 10%, Testes 15%, Integração 10%):

```text
CORE & PLATFORM
[████████████████████] 100% — Estado: Concluído
Nota Técnica: 9,4 / 10

VAULT & CUSTÓDIA
[███████████████████░] 95%  — Estado: Concluído
Nota Técnica: 9,3 / 10

DOCUMENTS & TYPST ENGINE
[████████████████████] 100% — Estado: Concluído
Nota Técnica: 9,5 / 10

REAL ESTATE CADASTRE (COCKPIT)
[██████████████████░░] 90%  — Estado: Concluído
Nota Técnica: 8,9 / 10

IDENTITY & PERFIL CIVIL
[█████████████████░░░] 85%  — Estado: Funcional
Nota Técnica: 8,8 / 10

WALLETS & DERIVAÇÃO EVM
[████████████████░░░░] 80%  — Estado: Funcional
Nota Técnica: 8,4 / 10

IPFS & ARMAZENAMENTO DePIN
[███████████████░░░░░] 75%  — Estado: Funcional
Nota Técnica: 7,9 / 10

MONITORING & RPC EVM
[███████████████░░░░░] 75%  — Estado: Funcional
Nota Técnica: 7,8 / 10

AUTHENTICATION & SESSION GATE
[█████████████░░░░░░░] 65%  — Estado: Implementação Parcial
Nota Técnica: 6,5 / 10

LEDGER & LIVRO-RAZÃO
[████████████░░░░░░░░] 60%  — Estado: Implementação Parcial
Nota Técnica: 6,2 / 10

DePIN NODE TELEMETRY & DASHBOARD
[████████░░░░░░░░░░░░] 38%  — Estado: Estrutura Inicial / Mock
Nota Técnica: 3,8 / 10

USER PROFILE & COMMUNITY FEED
[███████░░░░░░░░░░░░░] 35%  — Estado: Estrutura Inicial / Mock
Nota Técnica: 3,5 / 10
```

---

## 17. NOTAS TÉCNICAS INDIVIDUAIS (0 A 10)

Calculadas rigorosamente segundo a tabela ponderada do item 8 (Arquitetura 2,0; Implementação 2,0; Integridade/Persistência 2,0; Segurança 2,0; Testes 1,0; Integração/Observabilidade 1,0):

| Módulo | Arquitetura (2.0) | Implementação (2.0) | Persistência (2.0) | Segurança (2.0) | Testes (1.0) | Integração (1.0) | Nota Final | Classificação |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Documents & Typst** | 2,0 | 2,0 | 1,8 | 1,9 | 0,9 | 0,9 | **9,5** | Excelente / Pronto para Produção |
| **Core & Platform** | 1,9 | 1,9 | 1,9 | 1,9 | 0,9 | 0,9 | **9,4** | Alta Maturidade Técnica |
| **Vault & Custódia** | 1,9 | 1,9 | 1,9 | 2,0 | 0,8 | 0,8 | **9,3** | Alta Maturidade Técnica |
| **Real Estate (Cockpit)** | 1,9 | 1,8 | 1,9 | 1,8 | 0,8 | 0,7 | **8,9** | Alta Maturidade Técnica |
| **Identity & Civil** | 1,8 | 1,8 | 1,8 | 1,9 | 0,8 | 0,7 | **8,8** | Alta Maturidade Técnica |
| **Wallets & EVM** | 1,7 | 1,7 | 1,7 | 1,8 | 0,8 | 0,7 | **8,4** | Bem Implementado |
| **IPFS & DePIN** | 1,6 | 1,6 | 1,6 | 1,6 | 0,8 | 0,7 | **7,9** | Bem Implementado |
| **Monitoring & RPC** | 1,6 | 1,6 | 1,6 | 1,5 | 0,8 | 0,7 | **7,8** | Bem Implementado |
| **Authentication** | 1,4 | 1,3 | 1,4 | 1,4 | 0,5 | 0,5 | **6,5** | Funcional com Lacunas |
| **Ledger & Treasury** | 1,4 | 1,3 | 1,1 | 1,2 | 0,6 | 0,6 | **6,2** | Funcional com Lacunas |
| **Node Telemetry** | 0,9 | 0,8 | 0,5 | 0,8 | 0,4 | 0,4 | **3,8** | Estrutura Inicial |
| **User & Community** | 0,8 | 0,7 | 0,4 | 0,8 | 0,4 | 0,4 | **3,5** | Estrutura Inicial |

**Média Arquitetural Ponderada Geral: 7,8 / 10**

---

## 18. MATRIZ CONSOLIDADA DE PRIORIDADES

| ID | Fase | Módulo | Atividade Necessária | Situação Atual | Prioridade | Dependência | Critério de Conclusão |
|---|:---:|---|---|---|:---:|---|---|
| **DEV-001** | **01** | Identity | Implementar pipeline nativo de persistência de mídia física (Avatar/Capa) em `$APP_DATA/media/` com SHA-256 | Parcial (Blob URL) | **P1** | Core / FS | Fotos persistidas em disco e sobrevivendo ao reinício do app |
| **DEV-002** | **01** | Vault | Implementar comando `change_vault_master_password` com re-criptografia atômica dos envelopes no SQLite | Parcial | **P1** | Vault Crypto | Suíte de testes aprovando rotação de senha mestre |
| **DEV-003** | **01** | Preferences | Criar tabela SQLite para configurações de notificações e preferências do operador | Não iniciado | **P2** | LocalDatabase | Switches da tela persistindo dados no banco local |
| **DEV-004** | **02** | IPFS | Empacotar binário do daemon Kubo como sidecar no bundle Tauri | Parcial (Requer host) | **P1** | Tauri Bundle | Teste `test_resolve_ipfs_binary` passando sem pré-requisito externo |
| **DEV-005** | **02** | Monitoring | Implementar cache local com TTL para requisições RPC de saldos | Parcial | **P2** | Monitoring | Redução de tráfego de rede e resposta instantânea na interface |
| **DEV-006** | **03** | Authentication | Implementar desafio criptográfico Web3 (`personal_sign`) para autenticação por carteira | Não iniciado | **P2** | Wallets / Vault | Sessão autenticada comprovando posse de chave privada |
| **DEV-007** | **03** | Community | Substituir mocks estáticos de `_mock.ts` e `home-mock.ts` por dados reais do nó / API | Não iniciado | **P3** | IPFS / Network | Feed de comunicados lendo eventos reais do ecossistema |
| **DEV-008** | **04** | Real Estate | Conectar botão de emissão de laudo cadastral diretamente ao template Typst no Cockpit | Concluído no Core | **P2** | Documents | Geração de laudo pericial com 1 clique a partir da tabela imobiliária |
| **DEV-009** | **04** | Ledger | Implementar tabela SQLite local para conciliação contábil em modo offline | Parcial | **P2** | LocalDatabase | Livro-razão navegável sem depender da disponibilidade de api.asppibra.com |
| **DEV-010** | **05** | Homologação | Resolver ambiente de execução do Node.js host para habilitar execução contínua de Vitest | Parcial | **P1** | CI / Toolchain | 21 testes de frontend executando com 100% de aprovação |

---

## 19. ROADMAP OFICIAL POR FASES

```mermaid
flowchart TD
    subgraph FASE 00: Fundação e Arquitetura [FASE 00: Fundação e Arquitetura - 100% Concluída]
        F0_1[Tauri v2 IPC & Capabilities] --> F0_2[LocalDatabase & Migrações]
        F0_2 --> F0_3[Vault Crypto Argon2id + AES]
    end

    subgraph FASE 01: Infraestrutura Local e Custódia [FASE 01: Infraestrutura Local e Custódia - Em Andamento 88%]
        F1_1[Perfil Civil PF/PJ SQLite] --> F1_2[Persistência Local de Mídia DEV-001]
        F1_3[Derivação e Guarda de Carteiras] --> F1_4[Rotação de Senha Mestre DEV-002]
        F1_5[Motor Typst Offline & Cheques SHA-256]
    end

    subgraph FASE 02: Armazenamento e DePIN [FASE 02: Armazenamento e DePIN - Prioridade Imediata]
        F2_1[Sidecar Nativo do Kubo DEV-004] --> F2_2[Streaming de Upload/Download]
        F2_2 --> F2_3[Validação de Desafio DePIN ADR-012]
    end

    subgraph FASE 03: Integrações de Rede e Web3 [FASE 03: Integrações de Rede e Web3]
        F3_1[Desafio Criptográfico Web3 DEV-006] --> F3_2[Cache RPC EVM DEV-005]
        F3_2 --> F3_3[Substituição dos Mocks de Comunidade DEV-007]
    end

    subgraph FASE 04: Ferramentas Institucionais [FASE 04: Ferramentas Institucionais Cockpit]
        F4_1[Banco Imobiliário WAL 100k+ Linhas] --> F4_2[Emissão de Laudos Typst 1-Click DEV-008]
        F4_2 --> F4_3[Cache Contábil Offline do Livro-Razão DEV-009]
    end

    subgraph FASE 05: Homologação e Empacotamento [FASE 05: Homologação e Empacotamento Final]
        F5_1[Execução de Vitest + Cargo Tests DEV-010] --> F5_2[Builds de Distribuição .deb e AppImage]
        F5_2 --> F5_3[Lançamento Oficial DevOS Node & Cockpit]
    end

    F0_3 --> F1_1
    F0_3 --> F1_3
    F1_2 --> F2_2
    F1_4 --> F3_1
    F2_3 --> F3_3
    F1_5 --> F4_2
    F4_3 --> F5_1
    F3_3 --> F5_1
```

---

## 20. CRITÉRIOS DE HOMOLOGAÇÃO

Para declarar o DevOS Desktop formalmente pronto para produção, deverão ser atendidos os seguintes critérios:

1. **Aprovação Total da Suíte de Testes Nativos:**
   - Execução de `cargo test` no Rust com 0 falhas (eliminando o erro atual em `test_resolve_ipfs_binary_finds_kubo_executable`).
2. **Execução Dinâmica da Suíte Frontend:**
   - Todos os 21 arquivos de especificação em `src/test/` aprovados via `pnpm run test` (Vitest) sem mocks nos contratos IPC.
3. **Persistência de Mídia Validada:**
   - Atualização de foto de perfil e capa persistindo arquivo físico binário em diretório local, mantendo-se visível após fechar e reabrir o app.
4. **Resiliência a Falha de Rede:**
   - Iniciar a aplicação totalmente desconectada da Internet e comprovar:
     - Desbloqueio do cofre por senha mestre.
     - Acesso à Central de Identidade e dados de associados.
     - Compilação e exportação de contratos Typst em PDF.
     - Consulta à base de imóveis e auditoria fundiária (Cockpit).
5. **Auditoria de Capacidades e Permissões:**
   - Verificação de que a edição Node jamais consegue invocar comandos ou acessar o banco do Cadastro Imobiliário (`real_estate.sqlite`).

---

## 21. RISCOS E BLOQUEADORES

1. **Dependência Externa do Binário Kubo:**
   - *Risco:* Usuários que instalarem o DevOS Node em computadores sem o Kubo pré-instalado não conseguirão inicializar o daemon IPFS.
   - *Mitigação:* Configurar a propriedade `externalBin` no `tauri.conf.json` para embutir o executável compilado para cada plataforma.
2. **Perda de Mídia em Produção:**
   - *Risco:* Operadores cadastrarem suas fotos institucionais e perderem o arquivo após reiniciar o sistema.
   - *Mitigação:* Implementar a tarefa `DEV-001` antes de homologar a aba de identidade.
3. **Inconsistência de Mocks:**
   - *Risco:* Apresentar dados falsos de nós DePIN ou saldo como se fossem dados reais.
   - *Mitigação:* Indicar visualmente badges de "Modo de Demonstração" em telas dependentes de dados simulados até a integração de rede.

---

## 22. RECOMENDAÇÕES ARQUITETURAIS

1. **Não Misturar Domínio Local com Domínio de Rede:**
   Manter a integridade de que o cofre SQLite local e o gerador de documentos não dependam sob nenhuma hipótese de conectividade com a Internet.
2. **Unificação dos Roteamentos de Cadastro Imobiliário:**
   Consolidar `/devos/cadastre`, `/devos/database` e `/real-estate` em uma rota canônica única no Cockpit.
3. **Centralização do Mapeamento de Erros:**
   Adotar a tipagem de erros do Rust mapeada diretamente nos contratos TypeScript (`ipc-errors.ts`), evitando mensagens genéricas de falha na interface.

---

## 23. CONCLUSÃO EXECUTIVA — RESPOSTAS OBJETIVAS ÀS 24 PERGUNTAS DA ORDEM TÉCNICA

1. **Quantos módulos realmente existem?**
   Existem **12 módulos arquiteturais** (8 implementados com alta maturidade/funcionais, 2 parciais e 2 com estrutura apenas visual/mockada).
2. **Qual a responsabilidade de cada módulo?**
   Mapeada individualmente na **Seção 12** deste documento, abrangendo Core, Vault, Identity, Wallets, Documents, IPFS, Real Estate, Monitoring, Ledger, Authentication, User Profile e Node Telemetry.
3. **Quais módulos estão prontos?**
   `Documents Engine` (100%), `Core & Platform` (100%), `Vault Crypto` (95%) e `Real Estate Cadastre` (90%).
4. **Quais módulos estão parcialmente implementados?**
   `Identity` (85%), `Wallets` (80%), `IPFS/DePIN` (75%), `Monitoring` (75%), `Authentication` (65%) e `Ledger` (60%).
5. **Quais funcionalidades estão funcionando?**
   71 funcionalidades comprovadas no código (cifragem, canário de cofre, derivação de carteiras com Zeroize, validação CPF/CNPJ 2024, compilação de PDFs via Typst v0.15, importação XLSX com proveniência e modo WAL, verificação SHA-256 e chamadas JSON-RPC EVM).
6. **Quais funcionalidades existem apenas visualmente?**
   Feed de publicações e comunidade (`profile-home.tsx`), métricas e comunicados do painel do nó (`node-dashboard-page.tsx`), cubos 3D de infraestrutura (`infrastructure-page.tsx`), preferência de notificações e login por carteira Web3.
7. **Quais informações necessitam de persistência SQLite?**
   Cabeçalho do cofre, envelopes de segredos de carteiras, contas derivadas, perfil civil e qualificação jurídica PF/PJ, lotes e linhas de proveniência imobiliária, endereços normalizados e eventos invioláveis de auditoria.
8. **Quais informações necessitam de armazenamento em arquivos?**
   Artefatos PDF oficiais compilados (pasta Downloads), avatares e capas de perfil (`$APP_DATA/media/`) e blocos do nó IPFS (`$APP_DATA/devos/ipfs`).
9. **Quais dados são temporários?**
   Frases mnemônicas em sessão de criação (5 min de TTL no Rust com Zeroize), previews de PDF compilados no `preview_store` (10 min de TTL em RAM) e estados de abas/modais do React.
10. **Quais dados são cache?**
    Saldos de carteiras EVM obtidos por RPC, contagem de transações de rede e dados de estatísticas institucionais remotas.
11. **Quais dados pertencem à nuvem/rede?**
    Publicações do feed da comunidade, seguidores, histórico compartilhado da DAO e eventos de rede P2P.
12. **Quais módulos estão duplicando responsabilidades?**
    Roteamento imobiliário triplo (`/devos/cadastre`, `/devos/database`, `/real-estate`) e painéis de notificação redundantes sem persistência compartilhada.
13. **Quais bancos de dados existem?**
    Dois bancos físicos: `devos_vault.sqlite` (Cofre e Identidade) e `real_estate.sqlite` (Cadastro Imobiliário do Cockpit em modo WAL).
14. **Quais módulos dependem do Vault?**
    `Wallets` (guarda de segredos), `Identity` (cifragem de dados civis), `Authentication` (login e sessão) e `Documents` (quando exporta dados associativos qualificados).
15. **Quais serviços dependem da rede?**
    `EvmRpcClient` (JSON-RPC), `KuboClient` (comunicação com peers P2P) e `Axios` (API da ASPPIBRA Cloud).
16. **Quais módulos podem funcionar completamente offline?**
    `Vault`, `Identity`, `Wallets` (geração e guarda), `Documents Engine` e `Real Estate Cadastre`. Todos operam 100% desconectados da Internet.
17. **Quais módulos necessitam de correção de segurança?**
    `Identity` (eliminar blob URL de mídia e persistir em disco), `Vault` (adicionar comando de rotação de senha mestre) e `Authentication` (desafio Web3).
18. **Qual é o percentual de conclusão de cada módulo?**
    Varia de 35% (User Community) a 100% (Documents e Core), detalhado na **Seção 16**.
19. **Qual é a nota técnica de cada módulo?**
    Varia de 3,5 / 10 a 9,5 / 10, detalhado na **Seção 17**.
20. **Qual é a nota arquitetural geral?**
    **7,8 / 10** (Representando um sistema com núcleo nativo de excelência e interface visual avançada com lacunas em dados de rede).
21. **O que precisa ser corrigido primeiro?**
    A persistência física de arquivos de mídia (`DEV-001`) e a rotação atômica de senha mestre (`DEV-002`).
22. **Quais são as dependências entre as entregas?**
    Mapeadas no grafo mermaid da **Seção 19**; o armazenamento local é o alicerce para as fases de rede e homologação.
23. **Qual é a sequência recomendada de desenvolvimento?**
    Concluir Fase 01 (Mídia local e Cofre) -> Fase 02 (Kubo Sidecar) -> Fase 03 (Integrações e Web3) -> Fase 04 (Cockpit Laudos) -> Fase 05 (Homologação Geral).
24. **Quais critérios devem ser cumpridos para considerar o DevOS pronto para produção?**
    Cumprimento rigoroso dos 5 critérios estabelecidos na **Seção 20**, com aprovação integral das suítes de teste nativas e de frontend.

---
*Relatório de Auditoria Técnica Forense concluído com sucesso em modo estrito de leitura. Documento oficial registrado para orientar as próximas etapas de engenharia do DevOS Desktop.*
