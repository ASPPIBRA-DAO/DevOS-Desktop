# ESPELHO REAL — MÓDULO DOCUMENTS

## 1. Identificação

| Metadado | Detalhe |
|---|---|
| **Repositório** | ASPPIBRA-DAO DevOS Desktop (`DevOS-Desktop`) |
| **Branch atual** | `main` |
| **Commit atual** | `4cb024501e0e9a1866cc39a29d90d0f401d8ef79` (*feat(documents): implement canonical templates catalog and simplified modal preview*) |
| **Data e horário do levantamento** | 14/11/2026 às 07:15:00 UTC-3 |
| **Natureza** | Espelho estrutural estrito (inventário físico e real de arquivos, sem auditoria ou refatoração) |

### Diretórios identificados como pertencentes ao módulo

#### Frontend:
- `src/modules/documents/` (Ponto de entrada e catálogo canônico de modelos)
- `src/modules/documents/presentation/`
- `src/modules/documents/presentation/catalog/`
- `src/modules/documents/presentation/catalog/components/`
- `src/modules/documents/presentation/catalog/data/`
- `src/shared/components/pdf-viewer/` (Motor visualizador baseado em PDF.js)
- `src/shared/components/abnt-document/` (Emulação visual de páginas ABNT)
- `src/sections/cessao-de-posse/` (Interface operacional de emissão de contratos)
- `src/platform/tauri/documents/` (Bridge IPC dedicada)

#### Backend:
- `src-tauri/src/modules/documents/` (Domínio, modelos, serviços e renderizador Typst em Rust)
- `src-tauri/templates/` (Templates canônicos Typst de documentos institucionais)
- `src-tauri/templates/contracts/`
- `src-tauri/templates/core/` (Módulos base Typst: ABNT, tipografia, branding, header/footer)
- `src-tauri/templates/financial/`
- `src-tauri/templates/reports/`
- `src-tauri/assets/fonts/` (Fontes TrueType institucionais embutidas no compilador)

---

## 2. Árvore completa — Frontend

A estrutura física real dos arquivos pertencentes ao módulo no frontend React/TypeScript é apresentada abaixo, com caminhos relativos à raiz do projeto `DevOS-Desktop`:

```text
src/
├── modules/
│   └── documents/
│       ├── index.ts
│       └── presentation/
│           └── catalog/
│               ├── DocumentTemplatesGalleryView.tsx
│               ├── components/
│               │   ├── blank-sheet-card.tsx
│               │   ├── template-card.tsx
│               │   └── template-preview-dialog.tsx
│               └── data/
│                   └── document-templates-registry.ts
├── platform/
│   └── tauri/
│       ├── contracts/
│       │   └── document-contracts.ts
│       └── documents/
│           └── document-bridge.ts
├── sections/
│   └── cessao-de-posse/
│       ├── CessaoPosseContent.tsx
│       ├── CessaoPosseView.tsx
│       └── index.ts
├── shared/
│   ├── components/
│   │   ├── abnt-document/
│   │   │   ├── a4-page.tsx
│   │   │   ├── abnt-text.tsx
│   │   │   ├── data-tag.tsx
│   │   │   ├── default-footer.tsx
│   │   │   ├── default-header.tsx
│   │   │   ├── digital-signature.tsx
│   │   │   ├── document-context.tsx
│   │   │   ├── document-title.tsx
│   │   │   ├── index.ts
│   │   │   └── section-title.tsx
│   │   └── pdf-viewer/
│   │       ├── PdfPageCanvas.tsx
│   │       ├── PdfViewerLayout.tsx
│   │       ├── index.ts
│   │       └── pdf-engine.ts
│   └── utils/
│       └── pdf-binary-utils.ts
└── test/
    ├── document-bridge.spec.ts
    ├── documents-and-reports.spec.tsx
    ├── pdf-binary-utils.spec.ts
    └── pdf-engine-and-viewer.spec.ts
```

### Detalhamento físico dos arquivos do Frontend:

| Caminho Relativo | Extensão | Linhas | Tamanho (Bytes) | Papel Estrutural |
|---|:---:|---:|---:|---|
| `src/modules/documents/index.ts` | `.ts` | 27 | 754 | Ponto de exportação pública do módulo de documentos |
| `src/modules/documents/presentation/catalog/DocumentTemplatesGalleryView.tsx` | `.tsx` | 176 | 6.912 | Visão principal do catálogo de modelos e folhas base |
| `src/modules/documents/presentation/catalog/components/blank-sheet-card.tsx` | `.tsx` | 183 | 6.084 | Card para exibição e seleção de folha padronizada ABNT |
| `src/modules/documents/presentation/catalog/components/template-card.tsx` | `.tsx` | 256 | 8.314 | Card para exibição de modelo institucional pronto |
| `src/modules/documents/presentation/catalog/components/template-preview-dialog.tsx` | `.tsx` | 86 | 2.255 | Diálogo modal com `PdfViewerLayout` para pré-visualização instantânea |
| `src/modules/documents/presentation/catalog/data/document-templates-registry.ts` | `.ts` | 425 | 15.021 | Registro canônico de dados de folhas (`BLANK_SHEETS_REGISTRY`) e modelos |
| `src/platform/tauri/contracts/document-contracts.ts` | `.ts` | 143 | 3.250 | Interfaces e tipos de dados do protocolo IPC de documentos |
| `src/platform/tauri/documents/document-bridge.ts` | `.ts` | 144 | 4.030 | Bridge IPC tipada (`previewDocument`, `generateDocument`, `exportPreviewedDocument`) |
| `src/sections/cessao-de-posse/CessaoPosseContent.tsx` | `.tsx` | 1.712 | 151.201 | Conteúdo contratual e cláusulas para renderização visual |
| `src/sections/cessao-de-posse/CessaoPosseView.tsx` | `.tsx` | 254 | 7.607 | Tela operacional de emissão do Contrato de Cessão de Posse |
| `src/sections/cessao-de-posse/index.ts` | `.ts` | 2 | 73 | Exportação pública da seção de cessão de posse |
| `src/shared/components/abnt-document/a4-page.tsx` | `.tsx` | 130 | 3.682 | Emulador CSS de página formato A4 com margens ABNT |
| `src/shared/components/abnt-document/abnt-text.tsx` | `.tsx` | 58 | 1.132 | Componente tipográfico com recuo e entrelinha ABNT |
| `src/shared/components/abnt-document/data-tag.tsx` | `.tsx` | 44 | 1.036 | Tag visual para metadados e identificadores no documento |
| `src/shared/components/abnt-document/default-footer.tsx` | `.tsx` | 163 | 4.376 | Rodapé oficial ABNT com código de controle e paginação |
| `src/shared/components/abnt-document/default-header.tsx` | `.tsx` | 178 | 4.630 | Cabeçalho oficial ABNT com brasão e dados institucionais |
| `src/shared/components/abnt-document/digital-signature.tsx` | `.tsx` | 224 | 6.816 | Selo visual e representação de assinatura eletrônica |
| `src/shared/components/abnt-document/document-context.tsx` | `.tsx` | 19 | 537 | Contexto React para compartilhamento de dados do documento |
| `src/shared/components/abnt-document/document-title.tsx` | `.tsx` | 20 | 432 | Título formatado de documento oficial |
| `src/shared/components/abnt-document/index.ts` | `.ts` | 13 | 453 | Ponto de exportação pública dos componentes ABNT |
| `src/shared/components/abnt-document/section-title.tsx` | `.tsx` | 22 | 481 | Título formatado de seção contratual |
| `src/shared/components/pdf-viewer/PdfPageCanvas.tsx` | `.tsx` | 156 | 4.388 | Renderizador de página PDF em Canvas 2D via PDF.js |
| `src/shared/components/pdf-viewer/PdfViewerLayout.tsx` | `.tsx` | 870 | 30.041 | Layout do visualizador (modos `default` e `dialog`, zoom e SHA-256) |
| `src/shared/components/pdf-viewer/index.ts` | `.ts` | 3 | 98 | Ponto de exportação pública do visualizador PDF |
| `src/shared/components/pdf-viewer/pdf-engine.ts` | `.ts` | 9 | 397 | Inicialização do `pdfjsLib` com worker local legacy |
| `src/shared/utils/pdf-binary-utils.ts` | `.ts` | 122 | 3.318 | Utilitários de validação `%PDF-`, SHA-256 e conversões Base64/Blob |
| `src/test/document-bridge.spec.ts` | `.ts` | 476 | 16.273 | Testes unitários da bridge IPC de documentos (13 testes) |
| `src/test/documents-and-reports.spec.tsx` | `.tsx` | 239 | 8.081 | Testes de integração dos componentes ABNT e relatórios (6 testes) |
| `src/test/pdf-binary-utils.spec.ts` | `.ts` | 47 | 1.706 | Testes dos utilitários binários e cálculo de hash (4 testes) |
| `src/test/pdf-engine-and-viewer.spec.ts` | `.ts` | 142 | 4.887 | Testes do motor PDF.js e ciclo de vida do viewer (5 testes) |

---

## 3. Árvore completa — Backend

A estrutura física real dos arquivos pertencentes ao módulo no backend nativo Rust/Tauri é apresentada abaixo, com caminhos relativos à raiz do projeto `DevOS-Desktop`:

```text
src-tauri/
├── assets/
│   └── fonts/
│       ├── Roboto-Bold.ttf
│       └── Roboto-Regular.ttf
├── examples/
│   └── export_pdf_previews.rs
├── permissions/
│   └── autogenerated/
│       ├── export_previewed_document.toml
│       ├── generate_document.toml
│       └── preview_document.toml
├── src/
│   ├── commands/
│   │   └── document_commands.rs
│   ├── modules/
│   │   └── documents/
│   │       ├── mod.rs
│   │       ├── models.rs
│   │       ├── ports.rs
│   │       ├── preview_store.rs
│   │       ├── service.rs
│   │       └── typst_renderer.rs
│   ├── platform/
│   │   └── typst_engine.rs
│   └── tests/
│       └── document_integration_test.rs
└── templates/
    ├── asppibra_layout.typ
    ├── contrato_cessao_posse.typ
    ├── extrato_citizen_ledger.typ
    ├── invoice_bill.typ
    ├── real_estate_reconciliation.typ
    ├── contracts/
    │   └── .gitkeep
    ├── core/
    │   ├── branding.typ
    │   ├── data_tags.typ
    │   ├── header_footer.typ
    │   ├── page_abnt.typ
    │   └── typography.typ
    ├── financial/
    │   └── .gitkeep
    └── reports/
        └── .gitkeep
```

### Detalhamento físico dos arquivos do Backend:

| Caminho Relativo | Extensão | Linhas | Tamanho (Bytes) | Papel Estrutural |
|---|:---:|---:|---:|---|
| `src-tauri/src/modules/documents/mod.rs` | `.rs` | 83 | 2.972 | Módulo raiz do domínio documental, exports e factories |
| `src-tauri/src/modules/documents/models.rs` | `.rs` | 1.027 | 37.696 | Enums (`DocumentKind`, `DocumentScope`), DTOs, erros e validações |
| `src-tauri/src/modules/documents/ports.rs` | `.rs` | 49 | 2.187 | Trait `DocumentRenderer` e DTO `RenderedDocument` |
| `src-tauri/src/modules/documents/preview_store.rs` | `.rs` | 489 | 17.023 | Cache concorrente em memória com TTL de 30m e guarda de hash |
| `src-tauri/src/modules/documents/service.rs` | `.rs` | 692 | 26.452 | `DocumentsService`: orquestração, escopos e cálculo de SHA-256 |
| `src-tauri/src/modules/documents/typst_renderer.rs` | `.rs` | 1.070 | 42.969 | Adaptador concreto Typst, injeção de templates e fontes |
| `src-tauri/src/platform/typst_engine.rs` | `.rs` | 766 | 27.240 | Compilador nativo Typst em memória via `typst_as_lib` |
| `src-tauri/src/commands/document_commands.rs` | `.rs` | 942 | 34.448 | Comandos IPC (`generate_document`, `preview_document`, `export_previewed_document`) |
| `src-tauri/src/tests/document_integration_test.rs` | `.rs` | 422 | 15.921 | Testes de integração E2E Rust para escopos, comandos e IPC |
| `src-tauri/examples/export_pdf_previews.rs` | `.rs` | 155 | 6.518 | Exemplo executável de compilação e exportação de previews Typst |
| `src-tauri/templates/asppibra_layout.typ` | `.typ` | 22 | 1.233 | Fachada unificada de templates importando os módulos core |
| `src-tauri/templates/contrato_cessao_posse.typ` | `.typ` | 1.106 | 129.641 | Template do Contrato de Cessão de Posse e modo `is_blank_sheet` |
| `src-tauri/templates/extrato_citizen_ledger.typ` | `.typ` | 268 | 9.255 | Template do Livro-Razão do Cidadão (Citizen Ledger) |
| `src-tauri/templates/invoice_bill.typ` | `.typ` | 279 | 10.525 | Template institucional de Fatura e Recibo Associativo |
| `src-tauri/templates/real_estate_reconciliation.typ` | `.typ` | 353 | 12.615 | Template do Relatório de Reconciliação Imobiliária |
| `src-tauri/templates/contracts/.gitkeep` | `.gitkeep` | 1 | 83 | Marcador de diretório para templates contratuais futuros |
| `src-tauri/templates/financial/.gitkeep` | `.gitkeep` | 1 | 95 | Marcador de diretório para templates financeiros futuros |
| `src-tauri/templates/reports/.gitkeep` | `.gitkeep` | 1 | 109 | Marcador de diretório para templates de relatórios futuros |
| `src-tauri/templates/core/branding.typ` | `.typ` | 50 | 3.650 | Definição de cores oficiais institucionais FFC / Brasil |
| `src-tauri/templates/core/data_tags.typ` | `.typ` | 23 | 747 | Tags e blocos de dados dinâmicos |
| `src-tauri/templates/core/header_footer.typ` | `.typ` | 185 | 7.374 | Cabeçalho e rodapé ABNT com identificação e controle |
| `src-tauri/templates/core/page_abnt.typ` | `.typ` | 22 | 1.246 | Geometria de página ABNT NBR 14724 |
| `src-tauri/templates/core/typography.typ` | `.typ` | 32 | 1.037 | Configurações tipográficas e mapeamento de pesos |
| `src-tauri/assets/fonts/Roboto-Bold.ttf` | `.ttf` | - | 170.348 | Fonte TrueType institucional embutida (Bold) |
| `src-tauri/assets/fonts/Roboto-Regular.ttf` | `.ttf` | - | 171.272 | Fonte TrueType institucional embutida (Regular) |
| `src-tauri/permissions/autogenerated/export_previewed_document.toml` | `.toml` | 11 | 450 | Permissão autogerada Tauri para comando `export_previewed_document` |
| `src-tauri/permissions/autogenerated/generate_document.toml` | `.toml` | 11 | 402 | Permissão autogerada Tauri para comando `generate_document` |
| `src-tauri/permissions/autogenerated/preview_document.toml` | `.toml` | 11 | 396 | Permissão autogerada Tauri para comando `preview_document` |

---

## 4. Integrações externas ao módulo

Os arquivos listados abaixo pertencem a outros módulos ou à infraestrutura compartilhada do DevOS Desktop, mas mantêm pontos de acoplamento direto ou consumo explícito com o módulo de documentos:

### 1. Inicialização e Registro de Comandos Tauri (Backend):
- **`src-tauri/src/lib.rs`** (linhas 58-60): Registra os comandos `commands::generate_document`, `commands::preview_document` e `commands::export_previewed_document` no invocador global do Tauri (`tauri::generate_handler!`).
- **`src-tauri/src/commands/mod.rs`**: Exporta o módulo `pub mod document_commands;` e reexporta seus comandos públicos.
- **`src-tauri/capabilities/desktop-vault.json`**: Declara a lista de permissões da janela principal, incluindo `"allow-generate-document"`, `"allow-preview-document"` e `"allow-export-previewed-document"`.

### 2. Delegações de Compilação no Módulo Reports (Backend):
- **`src-tauri/src/modules/reports/engine.rs`**: As funções `compile_citizen_ledger_pdf`, `compile_invoice_pdf`, `compile_cessao_posse_pdf` e `compile_real_estate_reconciliation_pdf` constroem `DocumentRequest` e delegam a compilação diretamente ao `DocumentsService`.
- **`src-tauri/src/modules/reports/models.rs`**: Reexporta publicamente os modelos `CessaoPossePayload`, `CitizenLedgerPayload`, `InvoiceReportItem`, etc., originários de `crate::modules::documents::models`.
- **`src-tauri/src/modules/reports/mod.rs`**: Fachada do módulo de relatórios expondo as funções do engine documental.

### 3. Rotas e Navegação de Edições (Frontend):
- **`src/app/router/paths.ts`** (linhas 82-83): Define os caminhos canônicos `paths.devos.cessaoPosse` (`/devos/cessao-posse`) e `paths.devos.documents` (`/devos/documents`).
- **`src/app/editions/edition.cockpit.ts`**: Registra as entradas do menu de navegação e as rotas mapeando `/devos/documents` para `DocumentTemplatesGalleryView` e `/devos/cessao-posse` para `CessaoPosseView`.
- **`src/test/edition-navigation.spec.ts`**: Teste de navegação automatizado que valida o registro da rota `/devos/documents` na edição Cockpit.

### 4. Fachadas e Re-exportações Públicas (Frontend):
- **`src/platform/tauri/index.ts`**: Reexporta os contratos tipados e as funções IPC `generateDocument`, `previewDocument`, `exportPreviewedDocument` e a classe de erro `DocumentBridgeError`.
- **`src/platform/tauri/contracts/index.ts`**: Reexporta os contratos de `document-contracts.ts`.
- **`src/shared/components/index.ts`**: Reexporta os componentes de `abnt-document`.

### 5. Consumidores de Emissão Documental (Frontend):
- **`src/modules/ledger/presentation/citizen-ledger/view/CitizenLedgerView.tsx`**: Consome `previewDocument`, `exportPreviewedDocument` e `PdfViewerLayout` para visualizar e exportar o Livro-Razão do Cidadão em PDF.
- **`src/modules/reports/presentation/components/ReconciliationReportButton.tsx`**: Consome `generateDocument` para gerar e exportar em lote o relatório analítico de reconciliação cadastral em PDF.

---

## 5. Situação dos arquivos

### Arquivos rastreados pelo Git (Tracked)
Todos os **58 arquivos** pertencentes ao módulo listados nas Seções 2 e 3 estão rastreados pelo Git no repositório.

### Arquivos modificados (Modified)
Nenhum arquivo de código, template ou configuração do módulo foi modificado.
- A única alteração pendente no repositório pertence à documentação de auditoria prévia:
  - `docs/audits/PDF_DOCUMENTS_MODULE_AUDIT.md` (não adicionado ao stage).

### Arquivos não rastreados (Untracked)
- **Nenhum arquivo não rastreado (`untracked`)** existe nas pastas pertencentes ao módulo.

### Arquivos ignorados relevantes (Ignored)
- Os diretórios padrão ignorados pelo `.gitignore` que contêm artefatos gerados ou temporários do módulo são:
  - `src-tauri/target/` (contém os binários compilados das crates `typst`, `typst-as-lib`, `typst-pdf` e `pdf-writer`).
  - `node_modules/pdfjs-dist/` (distribuição instalada do visualizador PDF.js).
  - `dist-node/` e `dist-cockpit/` (artefatos de empacotamento web).
- **Nenhum arquivo de código-fonte ou recurso essencial do módulo está ignorado.**

---

## 6. Estatísticas

As contagens abaixo representam números reais e exatos obtidos por contagem direta no sistema de arquivos do repositório:

| Indicador | Frontend | Backend | Total |
|---|---:|---:|---:|
| **Diretórios dedicados** | 9 | 7 | **16** |
| **Arquivos totais** | 30 | 28 | **58** |
| **Arquivos de código** | 26 | 8 | **34** |
| **Arquivos de teste** | 4 | 2 | **6** |
| **Templates e recursos** | 0 | 15 | **15** |
| **Configurações próprias** | 0 | 3 | **3** |

### Discriminação dos arquivos:

- **Frontend (30 arquivos / 6.343 linhas de código):**
  - Código TypeScript/TSX: 26 arquivos (4.864 linhas).
  - Testes Vitest: 4 arquivos (904 linhas, totalizando 28 testes automatizados).
- **Backend (28 arquivos / 8.071 linhas de texto + 341.620 bytes de fontes):**
  - Código Rust (`.rs`): 8 arquivos (5.118 linhas).
  - Testes e Exemplos Rust: 2 arquivos (577 linhas, 69 testes unitários/integrados).
  - Templates Typst (`.typ`): 10 arquivos (2.355 linhas).
  - Arquivos `.gitkeep`: 3 arquivos (3 linhas).
  - Fontes TrueType (`.ttf`): 2 arquivos binários (341.620 bytes).
  - Permissões Tauri (`.toml`): 3 arquivos (33 linhas).

---

## 7. Limites do levantamento

### Diretórios e escopos incluídos:
1. `src/modules/documents/` (catálogo, cards, modal de visualização e registros).
2. `src/shared/components/pdf-viewer/` (layout, engine e canvas do visualizador PDF.js).
3. `src/shared/components/abnt-document/` (componentes estruturais de layout A4/ABNT).
4. `src/sections/cessao-de-posse/` (interface e conteúdo contratual de cessão de posse).
5. `src/shared/utils/pdf-binary-utils.ts` (funções binárias de hash e validação de PDF).
6. `src/platform/tauri/contracts/document-contracts.ts` e `src/platform/tauri/documents/document-bridge.ts`.
7. `src-tauri/src/modules/documents/` (domínio, models, ports, preview_store, service, typst_renderer).
8. `src-tauri/src/platform/typst_engine.rs` (motor Typst puro).
9. `src-tauri/src/commands/document_commands.rs` (comandos IPC).
10. `src-tauri/templates/` (todos os templates `.typ` e subdiretórios `core/`, `contracts/`, `financial/`, `reports/`).
11. `src-tauri/assets/fonts/` (fontes TTF embutidas no compilador).
12. `src-tauri/permissions/autogenerated/*document*.toml` (permissões IPC).
13. Arquivos de testes dedicados em `src/test/` e `src-tauri/src/tests/`.

### Diretórios e escopos excluídos:
1. `node_modules/` e dependências externas instaladas via pnpm.
2. `src-tauri/target/` (artefatos de build, rlibs, intermediate objects e deps geradas pelo Cargo).
3. `dist-node/` e `dist-cockpit/` (bundles de compilação Vite).
4. `.git/` (metadados e objetos internos do Git).
5. Telas consumidoras gerais de relatórios ou do ledger (`CitizenLedgerView.tsx`, `ReconciliationReportButton.tsx`), que pertencem aos módulos `ledger` e `reports` respectivamente, sendo catalogadas exclusivamente na seção de integrações externas.

### Arquivos que não puderam ser classificados:
- Nenhum. Todos os 58 arquivos identificados possuem papéis estruturais claros e foram categorizados com 100% de precisão.

### Eventuais limitações encontradas:
- O repositório não utiliza arquivos de estilos separados (`.css`/`.scss`) no módulo de documentos, concentrando a estilização em objetos CSS-in-JS via Emotion / MUI `sx` e regras tipográficas nativas no Typst.

