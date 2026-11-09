# 🏛️ Inventário das Edições Nativas: DevOS Node vs DevOS Cockpit

**Data:** 05/11/2026  
**Auditor:** ASPPIBRA DevOS Engine  
**Referência:** Fase 1 da Ordem 5.3  

---

## 1. Arquitetura Multi-Edição do DevOS Desktop

O projeto `DevOS-Desktop` adota um padrão de arquitetura unificada multi-edição construído sobre **Tauri v2** e **Vite + React 19**, com injeção condicional de contratos e capacidades tanto na camada web (frontend) quanto no núcleo nativo Rust (backend).

### 1.1. Configuração Vite e Resolução por Alias `@edition`

No arquivo [vite.config.ts](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/vite.config.ts#L21-L27), a compilação do frontend é alternada pelo parâmetro `--mode`:

```typescript
// vite.config.ts (Linhas 21-27)
export default defineConfig(({ mode }) => {
  const isCockpit = mode === 'cockpit';
  const outDir = isCockpit ? 'dist-cockpit' : 'dist-node';
  const editionFile = isCockpit
    ? path.resolve(process.cwd(), 'src/app/editions/edition.cockpit.ts')
    : path.resolve(process.cwd(), 'src/app/editions/edition.node.ts');
```

A dependência `@edition` é injetada estaticamente em tempo de compilação, garantindo que o bundle de distribuição (`dist-cockpit` ou `dist-node`) contenha exclusivamente os metadados e rotas da respectiva edição.

### 1.2. Condicionalismo no Núcleo Rust (`src-tauri/src/lib.rs`)

No backend nativo Rust ([src-tauri/src/lib.rs](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src-tauri/src/lib.rs#L174-L180)), a inicialização de banco de dados e permissões varia dinamicamente:

```rust
// src-tauri/src/lib.rs (Linhas 174-180)
// 3. Inicializar banco do Cadastro Imobiliário (real_estate.sqlite) exclusivamente na edição Cockpit
if is_cockpit {
    let real_estate_dir = app_data_dir.join("real_estate");
    let real_estate_db = storage::RealEstateDatabase::new(real_estate_dir);
    storage::RealEstateMigrationManager::run_migrations(&real_estate_db)...
```

---

## 2. Matriz Comparativa Integral: Node x Cockpit

| Característica | DevOS Node (Edição Operador) | DevOS Cockpit (Edição Master) | Evidência Técnica |
|---|---|---|---|
| **Identificador do Aplicativo (Bundle ID)** | `br.aspp.devos.node` | `br.aspp.devos.cockpit` | `tauri.node.conf.json` / `tauri.cockpit.conf.json` |
| **Nome Apresentado (Product Name)** | DevOS Node | DevOS Admin | Campo `productName` nos configs Tauri |
| **Título da Janela Principal** | `DevOS — Node Operator` | `DevOS — DAO Admin Master` | Campo `app.windows[0].title` |
| **Executável Alvo** | `app` | `app` | `Cargo.toml` (`[package] name = "app"`) |
| **Configuração Tauri** | `src-tauri/tauri.node.conf.json` | `src-tauri/tauri.cockpit.conf.json` | Arquivos de manifesto de build |
| **Frontend Dist** | `../dist-node` | `../dist-cockpit` | Campo `build.frontendDist` |
| **Capacidades de Segurança (Capabilities)** | `["desktop-vault"]` | `["desktop-vault", "cockpit-real-estate"]` | Campo `app.security.capabilities` |
| **Dashboard Principal (`/`)** | `NodeDashboardPage` | `CockpitDashboardPage` | `edition.node.ts` / `edition.cockpit.ts` |
| **Banco de Dados Criptográfico** | `devos_vault.sqlite` | `devos_vault.sqlite` | Inicializado em ambas as edições |
| **Banco Imobiliário Territorial** | Não inicializado | `real_estate.sqlite` (WAL) | Condicionado a `is_cockpit` no Rust |
| **Módulo IPFS** | Disponível (`/ipfs`) | Disponível (`/ipfs`) | Compartilhado em ambas as edições |
| **Módulo Bancário / Wallets** | Oculto no menu nativo | Disponível (`/wallets`, `/banking`) | Configurado apenas no Cockpit |
| **Módulo Livro-Razão / DAO** | Oculto no menu nativo | Disponível (`/ledger`, `/dao`) | Configurado apenas no Cockpit |
| **Módulo Cessão de Posse** | Oculto no menu nativo | Disponível (`/cessao-posse`) | Configurado apenas no Cockpit |
| **Módulo Infraestrutura DePIN** | Disponível (`/infrastructure`) | Disponível (`/infrastructure`) | Compartilhado em ambas as edições |
| **Ícones de Empacotamento** | `icons/32x32.png`, `128x128.png`, `icon.ico` | `icons/32x32.png`, `128x128.png`, `icon.ico` | Ambos utilizam a mesma pasta de ícones |
| **Build de Produção Gerado?** | ❌ Não compilado em release | ❌ Não compilado em release | `src-tauri/target/release` não contém binário |
| **Instalação Real no S.O.?** | ❌ Não instalado no `/usr/bin` ou `~/.local` | ❌ Não instalado no `/usr/bin` ou `~/.local` | Sem entradas no `/usr/share/applications` |
| **Status Real** | Configurado para build (`pnpm run tauri:node:build`) | Configurado para build (`pnpm run tauri:cockpit:build`) | Código-fonte pronto, binário não empacotado |

---

## 3. Rotas e Componentes Registrados por Edição

### 3.1. DevOS Node (`edition.node.ts`)
1. `/` — **Painel do Nó:** `NodeDashboardPage` (Métricas de hardware, telemetria DePIN, integridade do host e status IPFS).
2. `/ipfs` — **Armazenamento IPFS:** `IpfsView` (Painel de pinning e arquivos locais).
3. `/cadastre` — **Banco Imobiliário:** `RealEstateView` (Consulta de registros).
4. `/database` — **Banco Imobiliário (Explorer):** `RealEstateView`.
5. `/real-estate` — **Cadastro Imobiliário (Legado):** `RealEstateView`.
6. `/infrastructure` — **Infraestrutura:** `InfrastructurePage` (Monitoramento de blocos e nós da rede).

### 3.2. DevOS Cockpit (`edition.cockpit.ts`)
Inclui todas as rotas do Node e adiciona a camada master institucional:
1. `/` — **Visão Geral Master:** `CockpitDashboardPage` (Cluster, governança da DAO, métricas consolidadas).
2. `/wallets` & `/banking` — **Carteiras & Banco Digital:** `WalletsLandingView` (Gestão de contas e custódia).
3. `/cessao-posse` — **Cessão de Posse:** `CessaoPosseView` (Editor e gerador contratual Typst).
4. `/ledger` & `/dao` — **Livro-Razão & Tesouraria:** `LedgerView` (Auditoria financeira da DAO).

---

## 4. Diagnóstico de Execução e Conclusão da Fase 1

- As duas edições **não conflitam** entre si, pois utilizam Bundle IDs diferentes (`br.aspp.devos.node` e `br.aspp.devos.cockpit`), o que resulta em diretórios de dados isolados no Linux (`~/.local/share/br.aspp.devos.node` e `~/.local/share/br.aspp.devos.cockpit`).
- **Nenhuma das duas edições está instalada formalmente no sistema operacional.** Existem apenas como alvos de compilação no código-fonte e através do executável compilado de depuração (`target/debug/app`).
- O atalho da Área de Trabalho deverá ser projetado com flexibilidade para disparar a edição desejada ou a edição padrão definida para o participante.

