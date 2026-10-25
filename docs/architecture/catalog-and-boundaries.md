# Catálogo Oficial de Módulos e Fronteiras Arquiteturais (DevOS Desktop)

**Versão:** 1.0.0 (Onda 1 — Fundação Arquitetural)  
**Governança:** ASPPIBRA DAO  
**Tecnologias:** Tauri v2, Rust 2024/1.90, React 19, TypeScript 5+, Vite  

---

## 1. Separação Fundamental: Frontend vs Backend

O **DevOS Desktop** adota o padrão de **Monólito Modular** segregado fisicamente entre a interface (`src/`) e o núcleo de execução nativa segura (`src-tauri/`):

- **Backend Nativo Rust (`src-tauri/`)**:
  - **Autoridade de Domínio e Criptografia:** Concentra a derivação criptográfica BIP39/BIP32/secp256k1, algoritmos de encriptação AES-GCM com KDF Argon2id, expiração de segredos com `zeroize`, processamento de planilhas de alta performance e reconciliação cadastral.
  - **Isolamento de Persistência:** Bancos de dados SQLite fisicamente segregados (`devos_vault.sqlite` e `real_estate.sqlite`), com modo WAL, integridade referencial ativa e imutabilidade de eventos de auditoria garantida por triggers.
  - **Segurança Tauri v2:** Manifesto de menor privilégio estrito (`default.json` sem permissões) e concessão granular por capability (`desktop-vault.json`, `cockpit-real-estate.json`).

- **Frontend Desktop React (`src/`)**:
  - **Apresentação e Composição:** Renderização de interfaces ricas, vidromorfismo, animações fluidas e navegação.
  - **Orquestração de Chamadas:** Consumo dos comandos nativos por meio de adaptadores (bridges), gerenciamento de estado local e feedback visual ao usuário.
  - **Princípio da Autoridade Única:** O frontend **não replica regras de negócio de criptografia ou cálculo do Rust**, evitando código concorrente.

---

## 2. Camadas do Frontend (`src/`)

```
src/
├── app/        -> Inicialização, roteamento, layouts, edições (Cockpit / Node)
├── modules/    -> Funcionalidades de negócio com isolamento modular
├── platform/   -> Comunicação com o Tauri IPC (Anti-Corruption Layer)
├── shared/     -> Componentes compartilhados, tema, utilitários puros
└── test/       -> Infraestrutura e utilitários de teste do frontend
```

### 2.1. `app/` (Composição da Aplicação e Edições)
- Responsável por montar a árvore de componentes, gerenciar rotas e selecionar as configurações de cada edição (`edition.cockpit.ts` e `edition.node.ts`).
- **`app/providers/` (Provedores Globais):**
  - `theme-provider.tsx`: Provedor oficial do tema global (`ThemeProvider`), compondo `MuiThemeProvider` com `devosTheme` de `shared/theme` e aplicando atmosfera de vidromorfismo e iluminação radial via `CssBaseline`.
  - `error-boundary.tsx`: Captura de erros não tratados na renderização do React e exibição da tela de fallback resiliente.
- **`app/editions/` (Composição e Páginas de Edição):**
  - `cockpit/cockpit-dashboard-page.tsx`: Composição exclusiva do painel da edição Cockpit (gestão institucional e governança).
  - `node/node-dashboard-page.tsx`: Composição exclusiva do painel da edição Node (painel de métricas operacionais DePIN, orquestrando status de dispositivo, cofre e nó).
  - `edition.cockpit.ts` e `edition.node.ts`: Configurações de rotas e metadados compiladas condicionalmente via flag de modo do Vite.

### 2.2. `modules/` (Módulos Funcionais)
Cada módulo agrupa componentes, páginas e hooks específicos de um domínio:
- `identity/`: Gestão de identificadores de nós e perfis operacionais.
- `wallets/`: Interface para acompanhamento de sessões de criação, visualização de endereços e saldos.
- `vault/`: Interface para desbloqueio do cofre, configuração de senha mestra e fluxos de backup.
- `ipfs/`: Monitoramento do daemon Kubo, estatísticas de nó e operações de pinning.
- `real-estate/`: Gestão cadastral imobiliária, importação de lotes de planilhas e auditoria de divergências.
- `documents/`: Infraestrutura transversal e reutilizável de geração de documentos e PDFs baseada em `@react-pdf/renderer` (v4). Concentra templates compartilhados (`DocumentLayout`, `DocumentHeader`, `DocumentFooter`), serviços de compilação em `Blob` e download (`PdfExportService`) e visualização em modal/iframe desktop (`PdfPreviewDialog`). Não possui dependência de nenhum módulo de negócio específico.
- `reports/`: Coordenação analítica e formatação de relatórios executivos. Obtém dados brutos dos módulos responsáveis (ex: `RealEstateBridge`), compila modelos estruturados (`ReportCompilerService`), define templates de relatório (`RealEstateReconciliationReport`) e consome a infraestrutura pública de `documents` para emitir os PDFs.
- `audit/`: Apresentação transversal de registros de auditoria e apontamentos.
- `system/`: Visualização de telemetria e integridade da máquina local.

### 2.3. `platform/tauri/` (Camada Anti-Corrupção / Bridges)
- É a **única camada autorizada a invocar comandos Tauri** (`invokeNative`).
- Nenhuma view em `modules/` ou `app/` deve chamar `@tauri-apps/api/core` diretamente.
- Concentra a conversão de contratos e normalização de erros nativos.

### 2.4. `shared/components/` (Biblioteca Reutilizável de Interface)
- Organizada progressivamente em categorias funcionais por responsabilidade:
  - `data-display/`: Apresentação de dados, métricas, status e cartões (`Card`, `MetricBox`, `StatusBadge`, `Table`, `Chart`).
  - `edger-lights/`: Componentes e tokens da linha visual institucional (CyberCard, StatusIndicator, GlowText).
  - `primitives/`: Elementos visuais atômicos básicos (`CyberButton`, ícones).
  - `forms/`: Componentes de formulários e integração react-hook-form.
  - `navigation/`: Componentes de navegação e breadcrumbs.
  - `feedback/`: Diálogos, popovers, telas de carregamento e snackbars.
  - `media/`: Imagens, thumbnails e ilustrações.
  - `animation/`: Variantes e utilitários de animação (Framer Motion).
  - `upload/`: Componentes de seleção e upload de arquivos.
  - `layout/`: Scrollbars, barras de progresso e utilitários de espaço.
- **Regra de Preservação e Compatibilidade Retroativa:**
  - Nenhum componente ou arquivo é excluído.
  - Ao categorizar um componente para uma subpasta canônica, o caminho antigo é preservado por meio de um arquivo shim de re-exportação (ex: `src/shared/components/Card.tsx` re-exporta de `./data-display/card`).
  - `src/shared/components/index.ts` serve como ponto de entrada público consolidado.
- **Regra Rígida de Dependência:** `shared/` nunca pode importar de `modules/`, `app/` ou `platform/tauri/`.

---

## 3. Responsabilidade do Armazenamento e Bancos de Dados

O DevOS Desktop adota **segregação física estrita** de armazenamento:

1. **`devos_vault.sqlite` (Cofre Local):**
   - Diretório: `<app_data_dir>/devos_vault/`
   - Tabelas: `vault_header`, `vault_wallets`, `vault_audit_events`.
   - Gerenciado por `storage::LocalDatabase` e `storage::MigrationManager`.
   - Inicializado em todas as edições do aplicativo.

2. **`real_estate.sqlite` (Cadastro Imobiliário e Reconciliação):**
   - Diretório: `<app_data_dir>/real_estate/`
   - Tabelas: `properties`, `property_identifiers`, `addresses`, `property_address_links`, `import_batches`, `import_batch_records`, `audit_findings`, `correction_proposals`, `audit_events`.
   - Gerenciado por `storage::RealEstateDatabase` e `storage::RealEstateMigrationManager`.
   - Inicializado **exclusivamente na edição Cockpit** (`br.aspp.devos.cockpit`).

---

## 4. Regras de Dependência e Governança

As dependências são fiscalizadas pelo `dependency-cruiser` (`pnpm check:arch`):

| Origem | Destino Permitido | Destino Proibido |
|---|---|---|
| `src/shared` | Utilitários externos, libs puras | `src/modules`, `src/app`, `src/platform` |
| `src/modules/<m>` | `src/shared`, `src/platform/tauri/<m>` | Outro `src/modules/<outro>` internamente |
| `src/app` | `src/modules`, `src/shared`, `src/platform` | Lógica interna privada de módulos |
| `src/presentation` | `src/shared`, hooks locais, bridges | `@tauri-apps/api` direto |

---

## 5. Critérios para Criação de Novos Módulos

Antes de criar um novo módulo em `src/modules/` ou no Rust:
1. **Regra YAGNI:** Módulos só devem ser materializados com arquivos reais em uso; pastas vazias são proibidas.
2. **Autoridade do Rust:** Se o módulo envolver chaves, criptografia ou I/O pesado, a lógica reside no Rust com bridge tipado no TypeScript.
3. **Preservação do Zero Privilégio:** Todo novo comando Tauri deve ter arquivo `.toml` de ACL autogerado e capability explicitamente atribuída.
