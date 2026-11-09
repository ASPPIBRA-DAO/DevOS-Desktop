# 🏛️ RELATÓRIO UNIFICADO DE AUDITORIA DE PRÉ-IMPLANTAÇÃO
# DEVOS WORKSPACE BETA 1.0 — ASPPIBRA-DAO DEVOS DESKTOP

**Data da Auditoria:** 05/11/2026  
**Projeto:** ASPPIBRA-DAO DevOS Desktop  
**Versão Alvo:** Workspace Beta 1.0  
**Status do Ambiente:** Auditado, Inspecionado e Validado (Sem Alterações Destrutivas)  
**Documento Consolidado:** Unificação Integral das Fases 0 a 13 da Ordem 5.3  

---

## SUMÁRIO EXECUTIVO

1. [Identificação do Ambiente Local (Fase 0)](#1-identificação-do-ambiente-local-fase-0)
2. [Edições Nativas: DevOS Node vs DevOS Cockpit (Fase 1)](#2-edições-nativas-devos-node-vs-devos-cockpit-fase-1)
3. [Perfis de Participação: Founder vs Holder (Fase 2)](#3-perfis-de-participação-founder-vs-holder-fase-2)
4. [Instalação Real, Executáveis e Lançadores (Fase 5)](#4-instalação-real-executáveis-e-lançadores-fase-5)
5. [Mapeamento e Preservação dos Bancos SQLite (Fase 6)](#5-mapeamento-e-preservação-dos-bancos-sqlite-fase-6)
6. [Wallet Genesis e Certificado Digital .dvcert (Fase 7)](#6-wallet-genesis-e-certificado-digital-dvcert-fase-7)
7. [Nó IPFS Local e Armazenamento Descentralizado (Fase 8)](#7-nó-ipfs-local-e-armazenamento-descentralizado-fase-8)
8. [Plano de Diretórios do DevOS Workspace na Área de Trabalho (Fase 9)](#8-plano-de-diretórios-do-devos-workspace-na-área-de-trabalho-fase-9)
9. [Catálogo de Ícones e Mapeamento dos Lançadores (Fases 4 e 10)](#9-catálogo-de-ícones-e-mapeamento-dos-lançadores-fases-4-e-10)
10. [Primeira Experiência do Usuário e Sequência de Boot (Fases 3 e 11)](#10-primeira-experiência-do-usuário-e-sequência-de-boot-fases-3-e-11)
11. [Checklist Integral de Conformidade (Fase 12)](#11-checklist-integral-de-conformidade-fase-12)
12. [Matriz de Recomendações e Plano de Ação Mínimo (Fases 13 e 16)](#12-matriz-de-recomendações-e-plano-de-ação-mínimo-fases-13-e-16)

---

## 1. IDENTIFICAÇÃO DO AMBIENTE LOCAL (FASE 0)

A inspeção do sistema operacional foi executada via chamadas canônicas do Linux e do padrão XDG, sem adotar suposições prévias de nomes de pastas em inglês:

| Informação | Resultado Real Comprovado | Comando / Fonte |
|---|---|---|
| **Sistema Operacional** | Linux Ubuntu | `cat /etc/os-release` |
| **Versão / Codename** | Ubuntu 26.04.1 LTS (Resolute Raccoon) | `VERSION="26.04.1 LTS (Resolute Raccoon)"` |
| **Arquitetura do Kernel** | `x86_64` (Kernel 7.0.0-42-generic) | `uname -a` |
| **Ambiente Gráfico** | GNOME (`ubuntu:GNOME`) | `$XDG_CURRENT_DESKTOP`, `$GDMSESSION` |
| **Gerenciador de Janelas** | Mutter / GNOME Shell | Sessão padrão Ubuntu |
| **Gerenciador de Arquivos** | GNOME Files (`/usr/bin/nautilus`) | `which nautilus` |
| **Lançador de Sistema** | XDG Open (`/usr/bin/xdg-open`) | `which xdg-open` |
| **Diretório HOME** | `/home/sandro` | `$HOME` |
| **Área de Trabalho Real** | `/home/sandro/Área de trabalho` | `xdg-user-dir DESKTOP` (pt-BR) |
| **Diretório Documentos** | `/home/sandro/Documentos` | `xdg-user-dir DOCUMENTS` (pt-BR) |
| **Diretório Downloads** | `/home/sandro/Downloads` | `xdg-user-dir DOWNLOAD` |
| **Usuário Proprietário** | `sandro:sandro` (UID: 1000, GID: 1000) | `id -u`, `id -g` |
| **Espaço Disponível** | 5,5 GB livres na partição raiz | `df -h /home/sandro` |

> **Constatação Crucial sobre o Desktop:**  
> A Área de Trabalho do usuário **está localizada em português do Brasil:** `/home/sandro/Área de trabalho`.  
> O diretório `~/Desktop` existe no disco mas está vazio (`total 0`) e **não é** monitorado pelo GNOME. Qualquer pasta ou atalho inserido em `~/Desktop` ficaria invisível ao usuário na tela principal do computador.

---

## 2. EDIÇÕES NATIVAS: DEVOS NODE VS DEVOS COCKPIT (FASE 1)

O DevOS Desktop implementa uma arquitetura multi-edição compartilhando o mesmo núcleo nativo Rust (`src-tauri`) e interface Vite + React 19 (`src`).

### 2.1. Injeção Condicional no Frontend e Backend
1. **Frontend (Vite):** O arquivo `vite.config.ts` utiliza o modo `--mode cockpit` ou `--mode node` para alternar o alias `@edition` entre `src/app/editions/edition.cockpit.ts` (gerando `dist-cockpit`) e `src/app/editions/edition.node.ts` (gerando `dist-node`).
2. **Backend (Rust):** O arquivo `src-tauri/src/lib.rs` avalia se a edição é Cockpit (`is_cockpit`) para inicializar exclusivamente nela o banco de dados territorial `real_estate.sqlite`. O banco do cofre `devos_vault.sqlite` é inicializado em ambas.

### 2.2. Matriz Comparativa: Node x Cockpit

| Característica | DevOS Node (Edição Operador) | DevOS Cockpit (Edição Master) |
|---|---|---|
| **Identificador (Bundle ID)** | `br.aspp.devos.node` | `br.aspp.devos.cockpit` |
| **Nome Apresentado** | DevOS Node | DevOS Admin |
| **Título da Janela** | `DevOS — Node Operator` | `DevOS — DAO Admin Master` |
| **Executável Binário** | `app` (`[package] name = "app"`) | `app` (`[package] name = "app"`) |
| **Manifesto Tauri** | `src-tauri/tauri.node.conf.json` | `src-tauri/tauri.cockpit.conf.json` |
| **Distribuição Web** | `../dist-node` | `../dist-cockpit` |
| **Permissões Tauri** | `["desktop-vault"]` | `["desktop-vault", "cockpit-real-estate"]` |
| **Dashboard Principal (`/`)** | `NodeDashboardPage` (Métricas do Nó/DePIN) | `CockpitDashboardPage` (Cluster e DAO) |
| **Banco `devos_vault.sqlite`** | Ativo em `~/.local/share/br.aspp.devos.node/` | Ativo em `~/.local/share/br.aspp.devos.cockpit/` |
| **Banco `real_estate.sqlite`** | Desativado por design | Ativo em `~/.local/share/br.aspp.devos.cockpit/` |
| **Módulos Exclusivos** | Telemetria pura de nó operador | Wallets, Banco Digital, Livro-Razão, Cessão de Posse |
| **Instalação no S.O.** | Não empacotado / Não instalado | Não empacotado / Não instalado |

---

## 3. PERFIS DE PARTICIPAÇÃO: FOUNDER VS HOLDER (FASE 2)

### 3.1. Desambiguação das Quatro Dimensões
É mandatório não confundir edições de compilação com perfis de usuário:

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

- **Edição:** Define quais módulos de baixo nível estão compilados no software (ex.: presença do SQLite territorial).
- **Perfil:** Define a visão de negócio e as permissões de acesso (RBAC) do participante conforme sua credencial e chave na DAO.

### 3.2. Matriz de Recursos: Founder x Holder

| Recurso / Módulo | Perfil Founder | Perfil Holder | Componente Compartilhado | Situação Atual |
|---|---|---|---|---|
| **Dashboard Principal** | Visão Executiva DAO / Cluster / Reservas | Telemetria do Nó / Staking / Cotas | Base MUI + Cards Glassmorphism | `CockpitDashboardPage` (Founder) / `NodeDashboardPage` (Holder) |
| **Governança Institucional** | Voto com peso institucional, novas pautas | Voto comunitário, consulta de pautas | `LedgerView` / Módulo DAO | 🟡 Parcial na UI |
| **Fundos e Tesouraria** | Gestão de tesouraria, alocação e autorização | Consulta de saldo de cotas e rendimentos | `WalletsLandingView` | 🟡 Parcial na UI |
| **Identidade Digital** | Emissão de certificados master, auditoria | Consulta do `.dvcert` pessoal | `HostIntegrityCard` | ❌ Visualizador pendente |
| **Wallet & Custódia** | Múltiplas carteiras, chave mestre institucional | Carteira pessoal Genesis do nó | Módulo `wallets` e `vault` | ✅ Derivação BIP-32/44 pronta |
| **Extrato e Livro-Razão** | Livro-razão global com auditoria fiscal | Extrato das operações da própria cota | `LedgerView` | 🟡 Implementado em leitura |
| **Documentos Contratuais** | Minuta, aprovação e assinatura de cessões | Visualização e download de contratos próprios | `CessaoPosseView` | ✅ Renderer Typst operacional |
| **Nó IPFS** | Monitoramento de pinning da rede e da DAO | Pinning de dados locais e comprovantes | `IpfsView` | 🟡 UI pronta, daemon offline |

> **Diretriz de Não-Duplicação:**  
> A diferença entre Founder e Holder **não exige a criação de dois aplicativos separados.** A base de código é compartilhada e as diferenças devem ser tratadas por controle de permissões vinculado à credencial do participante.

---

## 4. INSTALAÇÃO REAL, EXECUTÁVEIS E LANÇADORES (FASE 5)

A varredura completa do disco comprovou:

1. **Binário Compilado Funcional:**  
   Existe um executável nativo compilado em modo debug (ELF 64-bit, x86_64) em:  
   `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/target/debug/app` (796 MB).
2. **Ausência de Instalação Global:**  
   Não existem binários em `/usr/bin/devos` nem em `~/.local/bin/devos`.
3. **Ausência de Pacotes de Release:**  
   O diretório `src-tauri/target/release/bundle/` não existe (nenhum `.deb` ou `AppImage` foi empacotado).
4. **Política para o Lançador `.desktop`:**  
   A regra da Seção 3.1 proíbe comandos de desenvolvimento (`pnpm dev` ou `tauri dev`).  
   Portanto, o atalho `ASPPIBRA-DAO DevOS.desktop` na Área de Trabalho deverá apontar diretamente para o binário nativo existente (`src-tauri/target/debug/app`), abrindo o Webview do Tauri com zero dependência do Node.js.

---

## 5. MAPEAMENTO E PRESERVAÇÃO DOS BANCOS SQLITE (FASE 6)

### 5.1. Inventário Físico dos Bancos de Dados
Os bancos de dados locais são geridos exclusivamente pelo Rust (`LocalDatabase` e `RealEstateDatabase`):

| Banco de Dados | Caminho Físico Canônico Real | Finalidade e Conteúdo | Proteção no S.O. | Situação |
|---|---|---|---|---|
| `devos_vault.sqlite` | `/home/sandro/.local/share/br.aspp.devos.cockpit/devos_vault/devos_vault.sqlite` | Cofre de custódia, canary envelope, metadados de carteiras (`wallets`) e envelopes cifrados (`vault_secrets`). | Permissão estrita Unix `0600` (somente proprietário). Criptografia Argon2 + AES-GCM. | Ativo via `MigrationManager` |
| `real_estate.sqlite` | `/home/sandro/.local/share/br.aspp.devos.cockpit/real_estate/real_estate.sqlite` | Base cadastral territorial imobiliária, matrículas, endereços, auditoria e lotes de importação. | `PRAGMA journal_mode = WAL` + chaves estrangeiras atômicas. | Ativo no Cockpit via `RealEstateMigrationManager` |
| `devos_local.sqlite` | Inexistente no projeto | — | — | **Não criar** (Veto explícito) |

### 5.2. Regra Inegociável de Não-Movimentação
**Nenhum banco de dados deve ser movido, copiado ou duplicado para a Área de Trabalho.**  
- Mover os bancos quebraria a resolução do Tauri (`app_data_dir()`).
- Mover os bancos para a Área de Trabalho comprometeria o isolamento `0600` e exporia os arquivos a indexadores do GNOME e sincronizadores de nuvem (Dropbox/OneDrive), corrompendo arquivos auxiliares WAL e SHM.
- O DevOS Workspace manterá apenas o inventário transparente em `00 - INFORMAÇÕES/LOCAL-DATABASE-INVENTORY.md`.

---

## 6. WALLET GENESIS E CERTIFICADO DIGITAL .DVCERT (FASE 7)

### 6.1. Wallet Genesis e Custódia Nativa
- **Infraestrutura Pronta:** O código Rust implementa geração mnemônica BIP-39 com suporte a 12/24 palavras e proteção de memória via trait `Zeroize` / `ZeroizeOnDrop` (`creation_session.rs`).
- **Derivação Determinística:** Derivação canônica EVM `m/44'/60'/{account}'/0/{index}` e conversão para endereço `0x` via `tiny_keccak::keccak256` (`derivation.rs`).
- **Comportamento Atual no Boot:** A carteira Genesis **não é gerada automaticamente** na inicialização. O bootstrap apenas cria o cofre com a senha mestre. A emissão da carteira depende de interação explícita na UI de carteiras.

### 6.2. Diagnóstico do Certificado `.dvcert`
- **Situação:** `NÃO IMPLEMENTADO`.
- Não existe estrutura de dados, gerador, algoritmo de assinatura, validador ou arquivo `.dvcert` no disco ou no código.
- **Diretriz Mandatória:** Nenhum certificado falso ou chave simulada será criada. A pasta `01 - IDENTIDADE DIGITAL/` conterá exclusivamente a documentação registrando:  
  `STATUS: CONFIGURAÇÃO DE IDENTIDADE EM DESENVOLVIMENTO`.

---

## 7. NÓ IPFS LOCAL E ARMAZENAMENTO DESCENTRALIZADO (FASE 8)

### 7.1. Auditoria do Daemon e Portas
- **Binário IPFS/Kubo:** Não instalado no PATH do sistema operacional (`which ipfs kubo` retorna vazio).
- **Status das Portas:** Porta 5001 (RPC API) e porta 8080 (Gateway HTTP) estão **offline**.
- **Processos:** Nenhum processo IPFS em execução na máquina.

### 7.2. Arquitetura Rust e Repositório Canônico
- O módulo Rust `src-tauri/src/modules/ipfs/` possui controle de ciclo de vida seguro: nunca utiliza shell (`sh -c`) e não interrompe processos de IPFS externos.
- O caminho canônico do repositório dedicado DevOS está definido no código como:  
  `/home/sandro/.local/share/devos/ipfs/`
- **Diretriz:** O daemon **não será inicializado** na implantação do Workspace. A pasta `DevOS/04 - REDE IPFS/` conterá as subpastas `Conteúdos/` e `Configuração/` acompanhadas de um `LEIA-ME.md` didático.

---

## 8. PLANO DE DIRETÓRIOS DO DEVOS WORKSPACE NA ÁREA DE TRABALHO (FASE 9)

### 8.1. Estrutura Canônica Validada para a Área de Trabalho

```text
/home/sandro/Área de trabalho/
│
├── 🏛️ ASPPIBRA-DAO DevOS.desktop          (Lançador do Aplicativo Nativo)
├── 🌐🔒 Minha Identidade DevOS.desktop      (Lançador para 01 - IDENTIDADE DIGITAL)
├── 📁 Meu Workspace DevOS.desktop          (Lançador para a pasta DevOS)
│
└── 📁 DevOS/
    │
    ├── 00 - INFORMAÇÕES/
    │   ├── LEIA-ME.md                      (Guia simples para o usuário não-técnico)
    │   ├── ESTRUTURA-DO-DEVOS.md           (Especificação técnica para desenvolvedores)
    │   └── LOCAL-DATABASE-INVENTORY.md     (Inventário dos bancos de dados físicos)
    │
    ├── 01 - IDENTIDADE DIGITAL/
    │   └── LEIA-ME.md                      (Wallet Genesis e status do .dvcert em desenvolvimento)
    │
    ├── 02 - COFRE CRIPTOGRÁFICO/
    │   └── LEIA-ME.md                      (Custódia segura, Argon2 e isolamento Unix 0600)
    │
    ├── 03 - DADOS LOCAIS/
    │   ├── Cadastro Imobiliário/           (Diretório para exportações cadastrais locais)
    │   ├── Dados Operacionais/             (Dados operacionais dos nós)
    │   ├── Metadados/                      (Metadados territoriais públicos)
    │   └── LEIA-ME.md                      (Orientações sobre armazenamento local vs nuvem D1)
    │
    ├── 04 - REDE IPFS/
    │   ├── Conteúdos/                      (Arquivos para publicação e pinning)
    │   ├── Configuração/                   (Configurações de rede e nós bootstrap)
    │   └── LEIA-ME.md                      (Conceitos de CIDs, pinning e distribuição)
    │
    ├── 05 - DOCUMENTOS/
    │   ├── Contratos/                      (Contratos de Cessão de Posse gerados)
    │   ├── Extratos/                       (Extratos do Livro-Razão)
    │   ├── Relatórios/                     (Relatórios de auditoria e telemetria)
    │   ├── Comprovantes/                   (Recibos e comprovantes operacionais)
    │   └── LEIA-ME.md                      (Instruções sobre documentação oficial)
    │
    ├── 06 - SINCRONIZAÇÃO/
    │   ├── Pendentes/                      (Fila de operações offline)
    │   ├── Histórico/                      (Histórico de eventos sincronizados)
    │   └── LEIA-ME.md                      (Comportamento do motor de sincronização)
    │
    └── 07 - BACKUPS/
        └── LEIA-ME.md                      (Procedimentos e integridade de backups locais)
```

### 8.2. Permissões de Segurança
- Proprietário: `sandro:sandro` (UID: 1000).
- Diretórios: `0755` (`rwxr-xr-x`).
- Arquivos explicativos: `0644` (`rw-r--r--`).
- **Proibido expressamente o uso de `0777`.**

---

## 9. CATÁLOGO DE ÍCONES E MAPEAMENTO DOS LANÇADORES (FASES 4 E 10)

Todos os recursos gráficos já existem no repositório com alta fidelidade visual:

| Lançador da Área de Trabalho | Destino Operacional | Arquivo de Ícone Vinculado | Resolução / Formato |
|---|---|---|---|
| **`ASPPIBRA-DAO DevOS.desktop`** | `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/target/debug/app` | `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/icons/icon.png` | 512 × 512 PNG (RGBA) |
| **`Minha Identidade DevOS.desktop`** | `01 - IDENTIDADE DIGITAL/` (via `xdg-open`) | `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/icons/devos-globe.svg` | Vetorial SVG |
| **`Meu Workspace DevOS.desktop`** | `/home/sandro/Área de trabalho/DevOS/` (via `xdg-open` / `nautilus`) | `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/public/assets/icons/files/ic-folder.svg` | Vetorial SVG |

---

## 10. PRIMEIRA EXPERIÊNCIA DO USUÁRIO E SEQUÊNCIA DE BOOT (FASES 3 E 11)

A máquina de estados implementada em `AppBootstrapProvider` ([app-bootstrap-provider.tsx](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/app/bootstrap/app-bootstrap-provider.tsx)) define o ciclo de vida real:

```text
[1. Executável Rust (app)] 
        │
        ▼
[2. Setup Tauri Core] ──> Executa migrações no devos_vault.sqlite (e real_estate.sqlite se Cockpit)
        │
        ▼
[3. Splash HTML (index.html)] ──> Animação inicial
        │
        ▼
[4. Bootstrap Provider (React)] ──> Consulta IPC: VaultBridge.getVaultStatus()
        │
        ├── Se 'UNINITIALIZED' (Cofre novo no hardware):
        │   └── Renderiza <JwtSignUpView isInitVault /> (Criação da Senha Mestre de 12+ caracteres)
        │
        ├── Se 'READY_LOCKED' (Cofre existente e bloqueado):
        │   └── Renderiza <JwtSignInView /> (Desbloqueio com Senha Mestre)
        │
        └── Se 'READY_UNLOCKED' (Cofre liberado):
            └── Renderiza <DevOSLayout> com as rotas de currentEdition (@edition)
```

---

## 11. CHECKLIST INTEGRAL DE CONFORMIDADE (FASE 12)

| Categoria | Item | Estado | Observação Técnica Comprovada |
|---|---|:---:|---|
| **Aplicativo** | DevOS Node configurado | ✅ | `tauri.node.conf.json`, `dist-node`, `edition.node.ts`. |
| | DevOS Cockpit configurado | ✅ | `tauri.cockpit.conf.json`, `dist-cockpit`, `edition.cockpit.ts`. |
| | Executável compilado funcional | ✅ | `src-tauri/target/debug/app` (796 MB). |
| | Build de produção empacotado | ❌ | `src-tauri/target/release` sem binários. |
| | Instalação global no S.O. | ❌ | Ausente em `/usr/bin/` ou `~/.local/bin/`. |
| | Lançadores `.desktop` criados | ❌ | Aguardando expressamente a próxima ordem. |
| **Dashboards** | Dashboard Founder (`CockpitDashboardPage`) | ✅ | Totalmente implementado no Cockpit. |
| | Dashboard Holder (`NodeDashboardPage`) | ✅ | Totalmente implementado no Node. |
| | Menus segregados por edição | ✅ | 11 rotas no Cockpit, 6 rotas no Node. |
| | RBAC dinâmico por credencial | 🟡 | Restrição estática por build; RBAC na UI em desenvolvimento. |
| **Identidade** | Wallet Genesis no código | 🟡 | Módulos BIP-39/44 prontos; auto-geração no boot pendente. |
| | Cofre criptográfico (Vault) | ✅ | `LocalDatabase`, PBKDF2/Argon2 e AES-256-GCM operacionais. |
| | Certificado `.dvcert` emitido | ❌ | `NÃO IMPLEMENTADO` (Sem formato ou gerador no código). |
| | Visualizador de identidade | 🟡 | Existe `HostIntegrityCard`; tela consolidada pendente. |
| **Bancos** | `devos_vault.sqlite` identificado | ✅ | `~/.local/share/br.aspp.devos.cockpit/devos_vault/devos_vault.sqlite`. |
| | `real_estate.sqlite` identificado | ✅ | `~/.local/share/br.aspp.devos.cockpit/real_estate/real_estate.sqlite`. |
| | Bancos movidos ou duplicados | ❌ | **Nenhum banco movido** (Conformidade estrita). |
| | Criação de `devos_local.sqlite` | ❌ | **Não criado** (Veto estrito da ordem). |
| **IPFS** | Controlador Kubo no Rust | ✅ | `daemon.rs`, `client.rs` e `pinning.rs` operacionais. |
| | Daemon IPFS em execução | ❌ | Daemon offline; portas 5001 e 8080 livres. |
| | Repositório canônico mapeado | ✅ | `~/.local/share/devos/ipfs/` definido no Rust. |
| **Workspace** | Área de Trabalho real mapeada | ✅ | `/home/sandro/Área de trabalho` (confirmado via XDG). |
| | Estrutura de pastas `00` a `07` | ❌ | Aguardando autorização para criação física. |
| | Documentos didáticos planejados | ✅ | Conteúdo integral formatado e pronto para implantação. |
| **Ícones** | Ícone do App (`icon.png`) | ✅ | 512×512 PNG disponível. |
| | Ícone de Identidade (`devos-globe.svg`) | ✅ | Vetorial SVG institucional disponível. |
| | Ícone de Pasta (`ic-folder.svg`) | ✅ | Vetorial SVG disponível. |

---

## 12. MATRIZ DE RECOMENDAÇÕES E PLANO DE AÇÃO MÍNIMO (FASES 13 E 16)

### 12.1. Classificação dos Itens de Auditoria
- **PRESERVAR:** Localização e permissões `0600` do `devos_vault.sqlite` e modo WAL do `real_estate.sqlite` em `~/.local/share`.
- **REUTILIZAR:** Recursos visuais existentes (`icon.png`, `devos-globe.svg`, `ic-folder.svg`) e componentes de dashboard.
- **AJUSTAR:** Lançador `.desktop` apontando para o binário ELF existente em `target/debug/app`.
- **IMPLEMENTAR (Na Próxima Ordem):** Criação física da pasta `/home/sandro/Área de trabalho/DevOS/` e dos três atalhos `.desktop`.
- **DECIDIR (Desenvolvimento Futuro):** Especificação do formato `.dvcert` e geração determinística automática da Wallet Genesis no bootstrap.
- **AGUARDAR:** Instalação e ativação do daemon local IPFS.

### 12.2. Sequência Mínima para a Próxima Ordem de Implantação
1. **Etapa 1:** Criar a pasta `/home/sandro/Área de trabalho/DevOS/` e seus 8 diretórios funcionais (`00` a `07`) com permissão `0755`.
2. **Etapa 2:** Gerar os documentos `LEIA-ME.md`, `ESTRUTURA-DO-DEVOS.md` e `LOCAL-DATABASE-INVENTORY.md` registrando a realidade auditada, mantendo o status de desenvolvimento da identidade digital.
3. **Etapa 3:** Criar os 3 arquivos `.desktop` com permissão `chmod +x` na Área de Trabalho real do Linux GNOME.

---

**FIM DO RELATÓRIO UNIFICADO**  
*Documento homologado para orientação autônoma de agentes de IA e desenvolvedores da equipe ASPPIBRA-DAO.*

