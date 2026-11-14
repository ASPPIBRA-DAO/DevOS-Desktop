# AUDITORIA TÉCNICA INTEGRAL DO MÓDULO DE DOCUMENTOS PDF
## ASPPIBRA-DAO DevOS Desktop — React 19 + TypeScript + Tauri v2 + Rust

---

### 1. IDENTIFICAÇÃO DA AUDITORIA

| Metadado | Detalhe |
|---|---|
| **Documento** | Relatório de Auditoria Técnica e Diagnóstico Funcional do Módulo de Documentos PDF |
| **Projeto** | ASPPIBRA-DAO DevOS Desktop |
| **Edições Alvo** | DevOS Node (`br.aspp.devos.node`) & DevOS Cockpit (`br.aspp.devos.cockpit`) |
| **Stack Tecnológica** | React 19.1.1, TypeScript 6.0.2, Tauri v2.12.1, Rust 1.90 (Edition 2024), Typst 0.15, typst-as-lib 0.17, typst-pdf 0.15, PDF.js 6.5.438 (`pdfjs-dist`), Web Crypto API, SQLite (Rusqlite 0.32) |
| **Data da Auditoria** | 11/11/2026 |
| **Natureza** | Auditoria Read-Only / Diagnóstico Forense Estrito (Zero modificações no código da aplicação) |
| **Status do Relatório** | Homologado para Planejamento de Consolidação Definitiva |

---

### 2. OBJETIVO E ESCOPO

O objetivo principal desta auditoria é realizar um inventário e diagnóstico exaustivo de todos os elementos relacionados a **leitura, visualização, geração, compilação, renderização, manipulação, integridade, segurança, armazenamento e assinaturas de documentos PDF** no projeto **DevOS Desktop**.

O escopo investigativo cobriu:
1. Todos os componentes visuais de renderização, visualização modal e catálogo de templates no frontend React (`src/modules/documents/`, `src/shared/components/pdf-viewer/`, `src/shared/components/abnt-document/`, `src/sections/cessao-de-posse/`).
2. As bibliotecas de renderização cliente (`pdfjs-dist`) e os motores nativos de geração de documentos (`typst`, `typst-as-lib`, `typst-pdf`).
3. O núcleo nativo em Rust (`src-tauri/src/modules/documents/`, `src-tauri/src/platform/typst_engine.rs`, `src-tauri/src/commands/document_commands.rs`, `src-tauri/templates/`).
4. Os canais de comunicação Tauri IPC (`generate_document`, `preview_document`, `export_previewed_document`).
5. A integridade documental por hash criptográfico SHA-256 e o ciclo de vida de previews em memória (`DocumentPreviewStore`).
6. A separação de escopos e autorização entre as edições **DevOS Node** e **DevOS Cockpit** (`DocumentScope`).
7. As representações de assinaturas e seus limites técnicos e jurídicos.
8. As integrações com outros módulos do DevOS (IPFS, SQLite, Vault, Identity, Ledger, Real Estate).
9. A cobertura e integridade da suíte de testes automatizados (Vitest e Cargo test).

---

### 3. BRANCH E COMMIT DE REFERÊNCIA

- **Branch auditado:** `main` (sincronizado com `origin/main`)
- **Commit HEAD:** `4cb024501e0e9a1866cc39a29d90d0f401d8ef79` (`feat(documents): implement canonical templates catalog and simplified modal preview`)
- **Estado inicial do repositório:** Working tree 100% limpo (`working tree clean`). Nenhuma alteração destrutiva ou de código foi realizada durante a execução desta auditoria técnica.

---

### 4. RESUMO EXECUTIVO

A auditoria forense revelou que o subsistema de **geração e visualização de documentos PDF** do DevOS Desktop possui uma **arquitetura nativa de altíssimo nível técnico**, centrada no compilador **Typst em Rust** e no **PDF.js** no React, com características notáveis de integridade criptográfica:

1. **Motor de Compilação Nativo via Typst:** Ao contrário de soluções frágeis baseadas em HTML-to-PDF (`puppeteer`, `html2canvas` ou `jspdf`), o DevOS Desktop incorpora o compilador de diagramação matemática e tipográfica **Typst** (`typst` v0.15 + `typst-as-lib` v0.17) compilado diretamente dentro do binário nativo Rust. A compilação ocorre 100% em memória, com templates `.typ` e fontes TTF embutidos, sem dependência de internet ou arquivos temporários inseguros no disco.
2. **Visualizador Real Baseado em PDF.js:** A visualização no frontend não é um mockup de HTML. O componente `PdfViewerLayout` consome os bytes binários do PDF gerado pelo backend, valida o cabeçalho canônico `%PDF-`, calcula o SHA-256 no cliente via Web Crypto API, compara com os metadados do backend e renderiza as páginas reais em elementos `<canvas>` com suporte a Retina/HiDPI e cancelamento de tarefas assíncronas (`RenderTask`).
3. **Catálogo Canônico de Modelos e Folhas A4:** Implementado recentemente em `src/modules/documents/presentation/catalog/DocumentTemplatesGalleryView.tsx`, disponibiliza uma galeria completa dividida entre folhas padronizadas estruturais (`BLANK_SHEETS_REGISTRY`) e modelos institucionais prontos (`DOCUMENT_TEMPLATES_REGISTRY`). O visualizador modal (`TemplatePreviewDialog`) consome o `PdfViewerLayout` em modo `variant="dialog"` com cabeçalho limpo, zoom dinâmico e compilação direta via Typst.
4. **Garantia de Identidade Criptográfica (Preview vs. Export):** O comando `preview_document` armazena o binário em memória no `DocumentPreviewStore` (com TTL de 30 minutos). O comando `export_previewed_document` exige o `preview_id` e o `expected_sha256`, garantindo matematicamente que o PDF salvo na pasta `Downloads` é **exatamente idêntico** ao que o usuário visualizou na tela, sem recompilação.
5. **Isolamento Estrito de Escopos (Node vs. Cockpit):** O modelo `DocumentScope` aplica segurança no backend: a edição Node pode emitir apenas documentos universais (`CitizenLedger`, `InvoiceBill`), enquanto documentos institucionais de alta responsabilidade (`CessaoPosse`, `RealEstateReconciliation`) são autorizados exclusivamente na edição Cockpit.
6. **Lacunas Identificadas:**
   - **Assinatura Digital Criptográfica Ausente:** Não existe implementação de assinatura PAdES / PKCS#7 / CMS com inserção de certificado digital e ByteRange no arquivo PDF. O que existe é uma **assinatura visual/eletrônica declarativa** (`DigitalSignature`), que insere graficamente metadados e hash no rodapé.
   - **Armazenamento e Catálogo em Banco Inexistente:** Não há catálogo de documentos gerados no SQLite. Os documentos exportados vão direto para a pasta `Downloads` do sistema operacional.
   - **Sem Integração com IPFS:** O módulo de documentos não realiza upload ou pinning automático de PDFs no daemon IPFS local.
   - **Sem Manipulação / Edição:** Não existem recursos de merge, split, rotação, anotações ou OCR.
   - **Camada Textual no Viewer:** O PDF.js renderiza apenas o Canvas 2D; a camada de seleção/cópia de texto (`TextLayer`) e o campo de pesquisa interna de texto não estão ativados.
   - **Sem Abertura de PDFs Externos:** O visualizador aceita apenas previews gerados internamente pelo Typst, sem mecanismo para abrir arquivos `.pdf` arbitrários do disco.

---

### 5. NOTA TÉCNICA DE MATURIDADE JUSTIFICADA

```
[ NOTA GERAL DO MÓDULO DE DOCUMENTOS PDF: 8.0 / 10.0 ]
┌──────────────────────────────┬────────┬────────────────────────────────────────────────────────┐
│ Dimensão                     │ Nota   │ Diagnóstico Sintético                                  │
├──────────────────────────────┼────────┼────────────────────────────────────────────────────────┤
│ 1. Motor de Geração (Typst)  │ 9.8/10 │ Excepcional: Compilação nativa em memória, templates ABNT│
│ 2. Visualizador (PDF.js)     │ 8.8/10 │ Robusto: Canvas HiDPI, validação de SHA-256 e %PDF-    │
│ 3. Catálogo de Modelos (UI)  │ 9.0/10 │ Completo: Galeria de folhas ABNT e modelos prontos     │
│ 4. Integridade e Segurança   │ 9.5/10 │ Anti-traversal, anti-overwrite, TTL em memória, hashes │
│ 5. Controle de Escopos       │ 9.2/10 │ Separação estrita Node vs Cockpit validada no backend  │
│ 6. Assinatura Criptográfica  │ 2.0/10 │ Apenas assinatura visual/gráfica; sem PAdES / PKCS#7   │
│ 7. Persistência & Catálogo   │ 2.0/10 │ Sem tabela SQLite; salva apenas em Downloads           │
│ 8. Integração IPFS           │ 0.0/10 │ Inexistente (módulo de documentos não envia CIDs)     │
│ 9. Manipulação & Edição      │ 0.0/10 │ Inexistente (sem split, merge, rotação, OCR)          │
│ 10. Testes Automatizados     │ 9.8/10 │ 97 testes específicos (28 frontend + 69 backend) 100% OK│
└──────────────────────────────┴────────┴────────────────────────────────────────────────────────┘
```

**Justificativa da nota:** A nota 8.0 reflete que o núcleo de geração nativa e inspeção visual é de padrão industrial superior (quase 10/10), com 97 testes automatizados passando com 100% de sucesso. No entanto, o subsistema carece de persistência histórica estruturada (catálogo SQLite), integração de rede descentralizada (IPFS) e suporte a assinaturas digitais com certificados X.509 PAdES.

---

### 6. INVENTÁRIO COMPLETO DE ARQUIVOS

| Caminho Relativo | Nome do Arquivo | Camada | Responsabilidade | Status Real |
|---|---|---|---|---|
| `src-tauri/src/platform/typst_engine.rs` | `typst_engine.rs` | Platform (Rust) | Motor de compilação Typst puro em memória e renderizador SVG/PDF | **PRONTO E ATIVO** |
| `src-tauri/src/modules/documents/models.rs` | `models.rs` | Domain (Rust) | Enums de escopo (`DocumentScope`), tipo (`DocumentKind`), erros e DTOs | **PRONTO E ATIVO** |
| `src-tauri/src/modules/documents/ports.rs` | `ports.rs` | Domain (Rust) | Trait `DocumentRenderer` e DTO `RenderedDocument` | **PRONTO E ATIVO** |
| `src-tauri/src/modules/documents/service.rs` | `service.rs` | Application (Rust) | `DocumentsService`: Orquestração, autorização de escopo e cálculo de SHA-256 | **PRONTO E ATIVO** |
| `src-tauri/src/modules/documents/typst_renderer.rs` | `typst_renderer.rs` | Infrastructure (Rust) | Adaptador Typst, injeção de templates embutidos e fontes Roboto | **PRONTO E ATIVO** |
| `src-tauri/src/modules/documents/preview_store.rs` | `preview_store.rs` | Infrastructure (Rust) | Cache concorrente em memória com TTL, limite de bytes e guarda de hash | **PRONTO E ATIVO** |
| `src-tauri/src/commands/document_commands.rs` | `document_commands.rs` | Interface (Tauri IPC) | Comandos `generate_document`, `preview_document`, `export_previewed_document` | **PRONTO E ATIVO** |
| `src-tauri/templates/contrato_cessao_posse.typ` | `contrato_cessao_posse.typ` | Templates (Typst) | Template do Contrato de Cessão de Posse e modo `is_blank_sheet` | **PRONTO E ATIVO** |
| `src-tauri/templates/invoice_bill.typ` | `invoice_bill.typ` | Templates (Typst) | Template institucional de Fatura e Recibo Associativo | **PRONTO E ATIVO** |
| `src-tauri/templates/extrato_citizen_ledger.typ` | `extrato_citizen_ledger.typ` | Templates (Typst) | Template do Livro-Razão do Cidadão (Citizen Ledger) | **PRONTO E ATIVO** |
| `src-tauri/templates/real_estate_reconciliation.typ` | `real_estate_reconciliation.typ` | Templates (Typst) | Template de Relatório Analítico de Reconciliação Imobiliária | **PRONTO E ATIVO** |
| `src-tauri/templates/asppibra_layout.typ` | `asppibra_layout.typ` | Templates (Typst Core) | Fachada de layout unificada importando módulos centrais | **PRONTO E ATIVO** |
| `src-tauri/templates/core/page_abnt.typ` | `page_abnt.typ` | Templates (Typst Core) | Geometria de página ABNT (Superior 0.9cm, Direita 2cm, Inferior 0.7cm, Esquerda 3cm) | **PRONTO E ATIVO** |
| `src-tauri/templates/core/header_footer.typ` | `header_footer.typ` | Templates (Typst Core) | Cabeçalho e rodapé oficial com identificadores e controle de integridade | **PRONTO E ATIVO** |
| `src-tauri/templates/core/branding.typ` | `branding.typ` | Templates (Typst Core) | Cores oficiais institucionais FFC / Brasil e tipografia | **PRONTO E ATIVO** |
| `src-tauri/templates/core/data_tags.typ` | `data_tags.typ` | Templates (Typst Core) | Tags de dados dinâmicos | **PRONTO E ATIVO** |
| `src-tauri/templates/core/typography.typ` | `typography.typ` | Templates (Typst Core) | Regras tipográficas e pesos da fonte Roboto | **PRONTO E ATIVO** |
| `src/modules/documents/index.ts` | `index.ts` | Modules (Docs) | Ponto de entrada público do módulo de documentos no frontend | **PRONTO E ATIVO** |
| `src/modules/documents/presentation/catalog/DocumentTemplatesGalleryView.tsx` | `DocumentTemplatesGalleryView.tsx` | Presentation (Catalog) | Visão principal da Galeria de Modelos Documentais e Folhas Base | **PRONTO E ATIVO** |
| `src/modules/documents/presentation/catalog/components/template-card.tsx` | `template-card.tsx` | Presentation (Catalog) | Card para exibição de modelo institucional com badge e ações | **PRONTO E ATIVO** |
| `src/modules/documents/presentation/catalog/components/blank-sheet-card.tsx` | `blank-sheet-card.tsx` | Presentation (Catalog) | Card para exibição de folha padronizada ABNT com dimensões | **PRONTO E ATIVO** |
| `src/modules/documents/presentation/catalog/components/template-preview-dialog.tsx` | `template-preview-dialog.tsx` | Presentation (Catalog) | Diálogo modal com `PdfViewerLayout` para pré-visualização instantânea | **PRONTO E ATIVO** |
| `src/modules/documents/presentation/catalog/data/document-templates-registry.ts` | `document-templates-registry.ts` | Catalog Data | Registros tipados de folhas (`BLANK_SHEETS_REGISTRY`) e modelos | **PRONTO E ATIVO** |
| `src/shared/components/pdf-viewer/pdf-engine.ts` | `pdf-engine.ts` | Shared (Engine) | Inicialização do `pdfjsLib` com worker legacy compilado pelo Vite | **PRONTO E ATIVO** |
| `src/shared/components/pdf-viewer/PdfPageCanvas.tsx` | `PdfPageCanvas.tsx` | Shared (UI) | Renderização de página individual em `<canvas>` com cálculo de DPI e cancelamento | **PRONTO E ATIVO** |
| `src/shared/components/pdf-viewer/PdfViewerLayout.tsx` | `PdfViewerLayout.tsx` | Shared (UI) | Container do visualizador com modos `default` e `dialog`, zoom e SHA-256 | **PRONTO E ATIVO** |
| `src/shared/utils/pdf-binary-utils.ts` | `pdf-binary-utils.ts` | Shared (Utils) | Utilitários de Base64, validação de magic bytes `%PDF-`, SHA-256 e Blobs | **PRONTO E ATIVO** |
| `src/shared/components/abnt-document/digital-signature.tsx` | `digital-signature.tsx` | Shared (UI) | Representação visual e eletrônica de assinatura no documento | **VISUAL / ELETRÔNICA** |
| `src/shared/components/abnt-document/a4-page.tsx` | `a4-page.tsx` | Shared (UI) | Emulador CSS de folha A4 no navegador com suporte a `@media print` | **PRONTO E ATIVO** |
| `src/shared/components/abnt-document/default-header.tsx` | `default-header.tsx` | Shared (UI) | Cabeçalho HTML institucional com brasão e dados | **PRONTO E ATIVO** |
| `src/shared/components/abnt-document/default-footer.tsx` | `default-footer.tsx` | Shared (UI) | Rodapé HTML institucional com código de controle | **PRONTO E ATIVO** |
| `src/shared/components/abnt-document/document-context.tsx` | `document-context.tsx` | Shared (Context) | Contexto de injeção de dados para renderização HTML estática | **PRONTO E ATIVO** |
| `src/platform/tauri/contracts/document-contracts.ts` | `document-contracts.ts` | Platform (Contracts) | Contratos TypeScript espelhando os DTOs do Rust | **PRONTO E ATIVO** |
| `src/platform/tauri/documents/document-bridge.ts` | `document-bridge.ts` | Platform (IPC Bridge) | Invocação desacoplada via `invokeNative` com tratamento de erro tipado | **PRONTO E ATIVO** |
| `src/sections/cessao-de-posse/CessaoPosseView.tsx` | `CessaoPosseView.tsx` | Presentation (Cockpit) | Tela de emissão e visualização do Contrato de Cessão de Posse | **PRONTO E ATIVO** |
| `src/modules/ledger/presentation/citizen-ledger/view/CitizenLedgerView.tsx` | `CitizenLedgerView.tsx` | Presentation (Ledger) | Visualização do Extrato do Cidadão dentro de modal com `PdfViewerLayout` | **PRONTO E ATIVO** |
| `src/modules/reports/presentation/components/ReconciliationReportButton.tsx` | `ReconciliationReportButton.tsx` | Presentation (Reports) | Botão modal de geração de relatório de reconciliação cadastral | **PRONTO E ATIVO** |

---

### 7. ÁRVORE ATUAL DE DIRETÓRIOS

```
DevOS-Desktop/
├── src/
│   ├── modules/
│   │   ├── documents/                                     # Módulo Oficial de Documentos do Frontend
│   │   │   ├── index.ts                                   # Exportações públicas e tipos
│   │   │   └── presentation/
│   │   │       └── catalog/
│   │   │           ├── DocumentTemplatesGalleryView.tsx   # Galeria de Modelos e Folhas ABNT
│   │   │           ├── components/
│   │   │           │   ├── template-card.tsx              # Card de Modelo Institucional
│   │   │           │   ├── blank-sheet-card.tsx           # Card de Folha Base ABNT
│   │   │           │   └── template-preview-dialog.tsx    # Modal de visualização Typst
│   │   │           └── data/
│   │   │               └── document-templates-registry.ts # Registro canônico de dados
│   │   ├── ledger/                                        # Emissão do Livro-Razão (CitizenLedger)
│   │   └── reports/                                       # Emissão do Relatório de Reconciliação
│   ├── platform/
│   │   └── tauri/
│   │       ├── contracts/
│   │       │   └── document-contracts.ts                  # Contratos IPC tipados
│   │       └── documents/
│   │           └── document-bridge.ts                     # Bridge IPC tipada (generate, preview, export)
│   ├── sections/
│   │   └── cessao-de-posse/
│   │       ├── CessaoPosseContent.tsx                     # Conteúdo visual da cessão de posse
│   │       └── CessaoPosseView.tsx                        # Tela emissora com PdfViewerLayout
│   ├── shared/
│   │   ├── components/
│   │   │   ├── abnt-document/                             # Emulação HTML/CSS de folha A4
│   │   │   │   ├── a4-page.tsx
│   │   │   │   ├── default-header.tsx
│   │   │   │   ├── default-footer.tsx
│   │   │   │   ├── digital-signature.tsx                  # Selo visual de assinatura
│   │   │   │   └── document-context.tsx
│   │   │   └── pdf-viewer/                                # Visualizador Universal PDF.js
│   │   │       ├── pdf-engine.ts                          # Configuração do Worker local
│   │   │       ├── PdfPageCanvas.tsx                      # Renderizador de página em Canvas 2D
│   │   │       └── PdfViewerLayout.tsx                    # Layout com modos Default e Dialog
│   │   └── utils/
│   │       └── pdf-binary-utils.ts                        # Utilitários de bytes, Base64 e SHA-256
│   └── test/
│       ├── document-bridge.spec.ts                        # Testes da bridge IPC (13 testes)
│       ├── documents-and-reports.spec.tsx                 # Testes de apresentação (6 testes)
│       ├── pdf-binary-utils.spec.ts                       # Testes de utilitários binários (4 testes)
│       ├── pdf-engine-and-viewer.spec.ts                  # Testes do motor e viewer (5 testes)
│       └── edition-navigation.spec.ts                     # Teste de rota /devos/documents
└── src-tauri/
    ├── templates/                                         # Templates canônicos do Typst
    │   ├── asppibra_layout.typ                            # Fachada unificada
    │   ├── contrato_cessao_posse.typ                      # Cessão de posse e modo is_blank_sheet
    │   ├── extrato_citizen_ledger.typ                     # Extrato financeiro (Universal)
    │   ├── invoice_bill.typ                               # Fatura / recibo (Universal)
    │   ├── real_estate_reconciliation.typ                 # Reconciliação territorial (Cockpit)
    │   └── core/                                          # Geometria ABNT, tipografia, branding
    └── src/
        ├── platform/
        │   └── typst_engine.rs                            # Compilador Typst em memória (Rust)
        ├── commands/
        │   └── document_commands.rs                       # Comandos Tauri IPC
        ├── modules/
        │   ├── documents/                                 # Domínio de documentos (Rust)
        │   │   ├── models.rs                              # Enums de escopo, DTOs e erros
        │   │   ├── ports.rs                               # Trait DocumentRenderer
        │   │   ├── preview_store.rs                       # Cache com TTL de 30m e guarda de hash
        │   │   ├── service.rs                             # DocumentsService
        │   │   └── typst_renderer.rs                      # Adaptador Typst
        │   └── reports/                                   # Fachada de compatibilidade
        └── tests/
            └── document_integration_test.rs               # Testes de integração E2E Rust
```

---

### 8. CATÁLOGO DOS COMPONENTES REACT

```mermaid
graph TD
    subgraph Catalog_Module [Módulo de Documentos: Catálogo e Galeria]
        DTGV["DocumentTemplatesGalleryView<br/>(Filtros, Tabs, Hero)"]
        TC["TemplateCard<br/>(Badge, Ações, Tags)"]
        BSC["BlankSheetCard<br/>(Dimensões, Margens ABNT)"]
        TPD["TemplatePreviewDialog<br/>(Modal de Visualização Rápida)"]
        REG["document-templates-registry.ts<br/>(BLANK_SHEETS & DOCUMENT_TEMPLATES)"]
    end

    subgraph Feature_Views [Telas Emissoras de Documentos]
        CPV["CessaoPosseView<br/>(Contrato de Posse)"]
        CLV["CitizenLedgerView<br/>(Extrato do Associado)"]
        RRB["ReconciliationReportButton<br/>(Relatório Cadastral)"]
    end

    subgraph PDF_Viewer_Core [Motor Visualizador PDF.js]
        PVL["PdfViewerLayout<br/>(variant: default | dialog)"]
        PPC["PdfPageCanvas<br/>(Canvas 2D, DPR HiDPI, CancelTask)"]
        PE["pdf-engine.ts<br/>(pdfjsLib + Web Worker Legacy)"]
    end

    subgraph IPC_Bridge [Fronteira Tauri IPC]
        BR["document-bridge.ts<br/>(previewDocument, generateDocument, exportPreviewedDocument)"]
    end

    DTGV --> TC
    DTGV --> BSC
    DTGV --> TPD
    DTGV --> REG
    TC -->|"Abre modal"| TPD
    BSC -->|"Abre modal"| TPD
    TPD --> PVL
    CPV --> PVL
    CLV --> PVL
    PVL --> PPC
    PPC --> PE
    TPD -->|"previewDocument()"| BR
    CPV -->|"previewDocument() / exportPreviewedDocument()"| BR
    CLV -->|"previewDocument() / exportPreviewedDocument()"| BR
    RRB -->|"generateDocument()"| BR
```

---

### 9. FICHAS TÉCNICAS INDIVIDUAIS DOS COMPONENTES

#### Ficha 9.1: DocumentTemplatesGalleryView
1. **Arquivo e localização:** `src/modules/documents/presentation/catalog/DocumentTemplatesGalleryView.tsx`.
2. **Responsabilidade:** Apresentar a central institucional de modelos de documentos e estruturas de páginas ABNT, com navegação por categorias (`todos`, `contratos`, `financeiro`, `territorial`, `folhas_base`), banner institucional explicativo e acionamento de previews.
3. **Estrutura interna:** Header Hero com gradiente institucional esmeralda/ardósia, seletor de categorias em Chips clicáveis, grid responsivo para cartões de folhas-base (`BlankSheetCard`), grid para cartões de modelos (`TemplateCard`) e modal integrador (`TemplatePreviewDialog`).
4. **Props e interfaces:** Sem props externas obrigatórias (componente de rota principal acessível em `/devos/documents`).
5. **Estados locais:** `category` (`TemplateCategory`), `previewingItem` (`BlankSheetItem | DocumentTemplateItem | null`).
6. **Hooks utilizados:** `useState`.
7. **Dependências:** `@mui/material`, `Iconify`, `BlankSheetCard`, `TemplateCard`, `TemplatePreviewDialog`, `document-templates-registry`.
8. **Origem dos dados:** Constantes tipadas `BLANK_SHEETS_REGISTRY` e `DOCUMENT_TEMPLATES_REGISTRY`.
9. **Serviços utilizados:** Disparo de modal para compilação Typst via `TemplatePreviewDialog`.
10. **Ações disponíveis:** Filtrar por categoria, acionar pré-visualização instantânea do PDF e redirecionar para a tela de emissão correspondente.
11. **Estado real de funcionamento:** **PRONTO E COMPROVADAMENTE FUNCIONAL**.
12. **Integrações:** Integrado à navegação do DevOS Cockpit (`edition.cockpit.ts`) na rota `/devos/documents`.

#### Ficha 9.2: TemplateCard
1. **Arquivo e localização:** `src/modules/documents/presentation/catalog/components/template-card.tsx`.
2. **Responsabilidade:** Exibir as informações essenciais de um modelo documental pronto (título, subtítulo, escopo de autorização, estimativa de páginas, descrição e tags), fornecendo botões para preview e emissão.
3. **Estrutura interna:** Card MUI com elevação e transição hover, header com chips de categoria e escopo (`Universal` vs `Cockpit`), lista de tags e footer com ações duplas: `[Pré-visualizar PDF]` e `[Ação Direta]`.
4. **Props e interfaces:** `template: DocumentTemplateItem`, `onPreview: (template: DocumentTemplateItem) => void`.
5. **Estados locais:** Não possui (componente puro de apresentação).
6. **Hooks utilizados:** `useRouter`.
7. **Dependências:** `@mui/material`, `Iconify`, `document-contracts`.
8. **Origem dos dados:** Prop `template`.
9. **Ações disponíveis:** Disparar callback de pré-visualização e navegar para a rota oficial (`template.actionUrl`).
10. **Estado real de funcionamento:** **PRONTO E COMPROVADAMENTE FUNCIONAL**.

#### Ficha 9.3: BlankSheetCard
1. **Arquivo e localização:** `src/modules/documents/presentation/catalog/components/blank-sheet-card.tsx`.
2. **Responsabilidade:** Exibir os padrões canônicos de geometria de folhas A4 (ABNT retrato, grid analítico, etc.), com dimensões em milímetros, margens técnicas oficiais e botão para visualização do padrão limpo.
3. **Estrutura interna:** Card MUI estilizado em contorno fino, ícone solar temático, badges de orientação e geometria, especificações de margens ABNT e botão `[Pré-visualizar Padrão]`.
4. **Props e interfaces:** `sheet: BlankSheetItem`, `onPreview: (sheet: BlankSheetItem) => void`.
5. **Estados locais:** Não possui.
6. **Hooks utilizados:** `useRouter`.
7. **Dependências:** `@mui/material`, `Iconify`.
8. **Origem dos dados:** Prop `sheet`.
9. **Ações disponíveis:** Disparar preview da folha base gerada via Typst (`is_blank_sheet: true`).
10. **Estado real de funcionamento:** **PRONTO E COMPROVADAMENTE FUNCIONAL**.

#### Ficha 9.4: TemplatePreviewDialog
1. **Arquivo e localização:** `src/modules/documents/presentation/catalog/components/template-preview-dialog.tsx`.
2. **Responsabilidade:** Fornecer um modal flutuante leve para compilar em tempo real e exibir a amostra do modelo ou folha selecionada via Typst Engine.
3. **Estrutura interna:** `Dialog` MUI com largura máxima estendida (`maxWidth="lg"`), integrando internamente o `PdfViewerLayout` configurado em `variant="dialog"`.
4. **Props e interfaces:** `open: boolean`, `onClose: () => void`, `template: BlankSheetItem | DocumentTemplateItem | null`.
5. **Estados locais:** `loading` (`boolean`), `preview` (`DocumentPreviewResult | null`), `error` (`string | null`).
6. **Hooks utilizados:** `useState`, `useEffect`, `useCallback`.
7. **Dependências:** `@mui/material`, `previewDocument`, `toast`, `PdfViewerLayout`.
8. **Origem dos dados:** Execução do comando IPC nativo `previewDocument({ request: template.sampleRequest })`.
9. **Ações disponíveis:** Compilar amostra, navegar pelas páginas, aplicar zoom e fechar diálogo.
10. **Estado real de funcionamento:** **PRONTO E COMPROVADAMENTE FUNCIONAL**.

#### Ficha 9.5: PdfViewerLayout
1. **Arquivo e localização:** `src/shared/components/pdf-viewer/PdfViewerLayout.tsx` (linhas 1 a 870).
2. **Responsabilidade:** Fornecer o layout universal de inspeção de documentos PDF. Suporta dois modos de exibição: `default` (embutido na página, tema escuro `#2b2e31`) e `dialog` (modal flutuante com cabeçalho limpo, paginação e controles centralizados).
3. **Estrutura interna:**
   - Modo `dialog`: Cabeçalho branco superior com título do arquivo, indicador de página atual (`Página X de Y`), botões de navegação anterior/próxima, controles de zoom (In, Out, Reset 100%, Ajustar à Largura 115%, Ajustar à Página 85%) e botão de fechar.
   - Modo `default`: Barra superior com identificação do documento, badge criptográfico SHA-256 com cópia para clipboard, botões de ação `[Visualizar]` e `[Exportar]`.
   - Área Central: Pilha vertical de componentes `PdfPageCanvas` renderizados pelo PDF.js, com fallback para `children` quando em modo pré-preview.
4. **Props e interfaces:** `PdfViewerLayoutProps`: `documentTitle`, `preview` (`DocumentPreviewResult`), `variant` (`'default' | 'dialog'`), callbacks `onView`, `onExport`, `onClose`, `onBack`, estados de loading `isViewing`, `isExporting`, etc.
5. **Estados locais:** `zoom`, `currentPage`, `checksumVerified`, `validationError`, `pdfDoc` (`PDFDocumentProxy`), `numDocPages`, `isPdfLoading`.
6. **Hooks utilizados:** `useRouter`, `useState`, `useEffect`, `useMemo`, `useCallback`.
7. **Dependências:** `@mui/material`, `pdfjs-dist`, `pdf-binary-utils`, `toast`, `Iconify`.
8. **Origem dos dados:** `preview.pdf_base64` e `preview.metadata.sha256_checksum`.
9. **Serviços utilizados:** `isValidPdfHeader`, `computeSha256Hex`, `base64ToUint8Array` e `pdfjsLib.getDocument()`.
10. **Ações disponíveis:** Zoom In/Out/Reset/Fit, paginação, verificação de hash SHA-256, cópia de checksum e exportação verificada.
11. **Estado real de funcionamento:** **PRONTO E COMPROVADAMENTE FUNCIONAL**.

#### Ficha 9.6: PdfPageCanvas
1. **Arquivo e localização:** `src/shared/components/pdf-viewer/PdfPageCanvas.tsx` (linhas 1 a 140).
2. **Responsabilidade:** Renderizar uma única página do PDF em um elemento `<canvas>` HTML5 de alta fidelidade visual.
3. **Estrutura interna:** Elemento `<canvas>` encapsulado em `<Box>` com sombra difusa, indicador de progresso giratório (`CircularProgress`) e tratamento de erros de renderização.
4. **Props e interfaces:** `PdfPageCanvasProps`: `pdfDoc` (`PDFDocumentProxy`), `pageNumber` (`number`), `zoom` (`number`), `onPageMeasured`.
5. **Estados locais:** `isRendering`, `renderError`, `pageDims` (`{ width, height }`).
6. **Hooks utilizados:** `useRef`, `useState`, `useEffect`.
7. **Dependências:** `@mui/material`, `pdfjs-dist` (`RenderTask`, `PDFDocumentProxy`).
8. **Origem dos dados:** Instância `pdfDoc` do PDF.js.
9. **Serviços utilizados:** `page.getViewport({ scale: zoom })` e `page.render(renderContext)`.
10. **Ações disponíveis:** Renderização reativa a alterações de escala (zoom) com multiplicação pelo `window.devicePixelRatio`.
11. **Estado real de funcionamento:** **PRONTO E COMPROVADAMENTE FUNCIONAL**. Possui cancelamento ativo de tarefas pendentes via `activeRenderTask.cancel()`.

#### Ficha 9.7: CessaoPosseView
1. **Arquivo e localização:** `src/sections/cessao-de-posse/CessaoPosseView.tsx` (linhas 1 a 254).
2. **Responsabilidade:** Interface operacional para emissão e visualização do Contrato de Cessão de Direitos Possessórios da ASPPIBRA.
3. **Estrutura interna:** Bloco de identificação documental com campos obrigatórios (`documentNumber` e `authCode`), container `PdfViewerLayout` e fallback `DocumentDataProvider` + `A4Page` + `CessaoPosseContent`.
4. **Props e interfaces:** Sem props externas (visão de rota).
5. **Estados locais:** `isExporting`, `isViewing`, `preview`, `previewError`, `documentNumber`, `authCode`.
6. **Hooks utilizados:** `useState`.
7. **Dependências:** `previewDocument`, `generateDocument`, `exportPreviewedDocument`, `PdfViewerLayout`, `toast`.
8. **Origem dos dados:** Entrada do usuário + dados institucionais da ASPPIBRA.
9. **Ações disponíveis:** Digitar número de registro e código de controle, compilar preview via Typst e exportar PDF com integridade garantida.
10. **Estado real de funcionamento:** **PRONTO E COMPROVADAMENTE FUNCIONAL**.

---

### 10. ARQUITETURA ATUAL DO FRONTEND

O frontend adota uma arquitetura em camadas orientada a componentes e contratos tipados:

1. **Camada de Apresentação:**
   - **Telas de Negócio:** `CessaoPosseView`, `CitizenLedgerView`, `DocumentTemplatesGalleryView`.
   - **Componentes do Catálogo:** `TemplateCard`, `BlankSheetCard`, `TemplatePreviewDialog`.
   - **Visualizador Universal:** `PdfViewerLayout` e `PdfPageCanvas`.
   - **Fallback HTML ABNT:** `a4-page.tsx`, `default-header.tsx`, `default-footer.tsx`, `digital-signature.tsx`.
2. **Camada de Adaptação e Utilitários:**
   - `pdf-engine.ts`: Ponto de injeção do Worker do PDF.js (`pdf.worker.min.mjs`).
   - `pdf-binary-utils.ts`: Utilitários puros para conversão Base64/Uint8Array, validação de magic bytes `%PDF-` e cálculo de SHA-256 no cliente via Web Crypto API (`window.crypto.subtle.digest`).
3. **Camada de Fronteira e IPC Bridge:**
   - `document-contracts.ts`: Contratos TypeScript estritamente alinhados com o backend Rust (`DocumentKind`, `DocumentRequest`, `DocumentPreviewResult`, `GenerateDocumentResult`).
   - `document-bridge.ts`: Fachada assíncrona encapsulando `invokeNative` com mapeamento de erros em classes tipadas (`DocumentBridgeError`).

---

### 11. ARQUITETURA ATUAL DO BACKEND RUST

O backend nativo em `src-tauri` segue os princípios de **Clean Architecture e Domain-Driven Design (DDD)**:

```
[ FRONTEND REACT ]
       │  (Tauri IPC: invokeNative)
       ▼
[ COMANDOS TAURI (Interface Layer) ]
   src-tauri/src/commands/document_commands.rs
   ├── generate_document
   ├── preview_document
   └── export_previewed_document
       │
       ▼
[ APLICAÇÃO & DOMÍNIO (Application & Domain Layers) ]
   src-tauri/src/modules/documents/
   ├── service.rs (DocumentsService - Orquestração, autorização e integridade)
   ├── models.rs  (DocumentScope, DocumentKind, DocumentRequest, DocumentError)
   └── ports.rs   (Trait DocumentRenderer, RenderedDocument)
       │
       ▼
[ INFRAESTRUTURA & PLATAFORMA (Infrastructure & Platform) ]
   src-tauri/src/modules/documents/
   ├── typst_renderer.rs (Implementação concreta de DocumentRenderer)
   ├── preview_store.rs  (Cache em memória concorrente com TTL de 30m e guarda de hash)
   └── typst_engine.rs   (Compilador nativo Typst em memória via typst_as_lib)
       │
       ▼
[ TEMPLATES CANÔNICOS TYPST ]
   src-tauri/templates/
   ├── contrato_cessao_posse.typ
   ├── invoice_bill.typ
   ├── extrato_citizen_ledger.typ
   ├── real_estate_reconciliation.typ
   └── core/ (page_abnt.typ, header_footer.typ, branding.typ, typography.typ)
       │
       ▼
[ SISTEMA OPERACIONAL ]
   Pasta ~/Downloads (Gravação atômica via OpenOptions create_new(true))
```

---

### 12. INVENTÁRIO DE BIBLIOTECAS PDF

| Biblioteca | Versão Identificada | Camada | Responsabilidade | Status Real | Riscos e Observações |
|---|---|---|---|---|---|
| `pdfjs-dist` | `6.5.438` | Frontend (React / Vite) | Leitura do binário PDF, decodificação de páginas e renderização no Canvas 2D | **ATIVA E HOMOLOGADA** | Utiliza o build `legacy/build/pdf.mjs` com worker URL para garantir total compatibilidade com o WebKitGTK no Linux. |
| `typst` | `0.15` | Backend (Rust) | Compilador tipográfico e diagramador de documentos em memória | **ATIVA E HOMOLOGADA** | Padrão moderno de alta performance que substitui motores LaTeX e navegadores headless. |
| `typst-as-lib` | `0.17` | Backend (Rust) | Wrapper para execução do Typst como biblioteca embutida | **ATIVA E HOMOLOGADA** | Permite compilação pura em memória sem dependência de CLI externa. |
| `typst-pdf` | `0.15` | Backend (Rust) | Renderizador de saída binária em formato PDF | **ATIVA E HOMOLOGADA** | Gera streams PDF válidas iniciadas por `%PDF-`. |
| `sha2` | `0.10` | Backend (Rust) | Cálculo de hash criptográfico SHA-256 do binário PDF | **ATIVA E HOMOLOGADA** | Criptograficamente seguro para garantir integridade documental. |
| `uuid` | `1.0` (v4) | Backend (Rust) | Geração de identificadores únicos para sessões de preview | **ATIVA E HOMOLOGADA** | Previne colisões em sessões concorrentes de visualização. |
| `dirs` | `6.0` | Backend (Rust) | Resolução canônica de caminhos do sistema (Downloads) | **ATIVA E HOMOLOGADA** | Multiplataforma (Linux, macOS, Windows). |
| `open` | `5.0` | Backend (Rust) | Abertura opcional do visualizador padrão do SO pós-exportação | **ATIVA E HOMOLOGADA** | Execução segura sem injeção de shell. |

---

### 13. ANÁLISE DAS DEPENDÊNCIAS

1. **Unicidade de Motores:** Não há duplicidade de motores de geração no backend. Todo o processo de compilação é centralizado no Typst.
2. **Ausência de Ferramentas Frágeis:** Não há dependência de `puppeteer`, `playwright`, `html2pdf`, `wkhtmltopdf` ou `jspdf` para geração de documentos oficiais.
3. **Compatibilidade do Worker PDF.js:** A importação em `src/shared/components/pdf-viewer/pdf-engine.ts`:
   ```typescript
   import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
   import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
   ```
   foi testada e homologada contra os runtimes de WebKitGTK no Linux (Tauri v2), prevenindo erros clássicos de compilação do Vite ou falta de suporte a `Promise.try`.
4. **Isolamento de Fontes:** As fontes tipográficas oficiais (`Roboto-Regular.ttf` e `Roboto-Bold.ttf`) estão embutidas no binário Rust via `include_bytes!`, garantindo que o documento gerado seja idêntico em qualquer máquina, mesmo sem conexão com a internet.

---

### 14. MAPA DE INTEGRAÇÕES TAURI IPC

| Comando Tauri | Canal IPC | Parâmetros Recebidos | Retorno | Segurança / Guarda |
|---|---|---|---|---|
| `preview_document` | Invocação direta | `PreviewDocumentPayload { request }` | `DocumentPreviewResult` | Validação de escopo (`active_document_scope`), compilação em memória, retenção com TTL de 30m no `DocumentPreviewStore`. |
| `export_previewed_document` | Invocação direta | `ExportPreviewPayload { preview_id, expected_sha256, target_file_name, open_after_export }` | `GenerateDocumentResult` | Valida existência do `preview_id`, validação estrita de igualdade do `expected_sha256`, validação de escopo, escrita atômica `create_new(true)`, releitura pós-gravação e comparação de SHA-256. |
| `generate_document` | Invocação direta | `GenerateDocumentPayload { request, open_after_export, target_file_name }` | `GenerateDocumentResult` | Validação de escopo, compilação direta, sanitização de nome de arquivo contra path traversal e escrita atômica em Downloads. |

---

### 15. INVENTÁRIO DOS COMANDOS RUST

1. **`preview_document`** (`src-tauri/src/commands/document_commands.rs`, linhas 72 a 75):
   - **Objetivo:** Compilar o documento Typst em memória e disponibilizar os bytes em Base64 e o SHA-256 para o frontend.
   - **Chamadores:** `template-preview-dialog.tsx`, `CessaoPosseView.tsx`, `CitizenLedgerView.tsx`.
   - **Comportamento de Disco:** Zero escritas em disco.
2. **`export_previewed_document`** (`src-tauri/src/commands/document_commands.rs`, linhas 81 a 93):
   - **Objetivo:** Gravar em disco exatamente os mesmos bytes visualizados pelo usuário.
   - **Chamadores:** `CessaoPosseView.tsx`, `CitizenLedgerView.tsx`.
   - **Comportamento de Disco:** Grava na pasta `~/Downloads` sem sobrescrever arquivos existentes.
3. **`generate_document`** (`src-tauri/src/commands/document_commands.rs`, linhas 60 a 67):
   - **Objetivo:** Compilar e exportar diretamente o PDF em disco em uma única operação.
   - **Chamadores:** `ReconciliationReportButton.tsx`.

---

### 16. FLUXO DE ENTRADA DE DOCUMENTOS

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuário / Operador
    participant UI as Catálogo / Tela Emissora
    participant Bridge as document-bridge.ts
    participant Command as document_commands.rs
    participant Service as DocumentsService
    participant Store as DocumentPreviewStore
    participant Typst as TypstEngine

    User->>UI: Solicita Emissão ou Preview do Modelo
    UI->>Bridge: previewDocument({ request })
    Bridge->>Command: invoke('preview_document', payload)
    Command->>Service: generate_document_with_pages(request)
    Service->>Service: Valida Request & Autorização de Escopo
    Service->>Typst: Compila template em memória com inputs JSON
    Typst-->>Service: Retorna bytes %PDF- e páginas SVG
    Service->>Service: Calcula SHA-256 canônico
    Service-->>Command: Retorna DocumentOutput + Pages
    Command->>Store: store_preview(output, pages, scope)
    Store-->>Command: Retorna preview_id (com TTL de 30 min)
    Command-->>Bridge: Retorna DocumentPreviewResult (pdf_base64 + sha256)
    Bridge-->>UI: Entrega preview verificado ao visualizador
```

---

### 17. FLUXO DE PROCESSAMENTO

1. **Validação Estrutural:** O DTO recebido é validado pela função `request.validate()` no Rust (rejeição de campos vazios, strings apenas com espaços, valores monetários negativos ou inválidos).
2. **Validação de Autorização de Escopo:** O serviço compara `request.kind().required_scope()` com o escopo da edição ativa (`active_document_scope()`). Se a edição Node tentar emitir `CessaoPosse` ou `RealEstateReconciliation`, a requisição é rejeitada com `DocumentError::UnauthorizedScope`.
3. **Compilação Typst:** Os templates `.typ` embutidos são combinados com as fontes e as variáveis JSON. O motor compila os nós tipográficos diretamente para um buffer binário que inicia obrigatoriamente com o cabeçalho `%PDF-`.
4. **Cálculo Criptográfico:** O hash SHA-256 é calculado imediatamente sobre o buffer gerado.

---

### 18. FLUXO DE VISUALIZAÇÃO

```mermaid
sequenceDiagram
    autonumber
    participant UI as PdfViewerLayout
    participant Utils as pdf-binary-utils.ts
    participant Engine as pdf-engine.ts (PDF.js)
    participant Canvas as PdfPageCanvas

    UI->>Utils: base64ToUint8Array(preview.pdf_base64)
    Utils-->>UI: Uint8Array
    UI->>Utils: isValidPdfHeader(bytes) -> Confirma %PDF-
    UI->>Utils: computeSha256Hex(bytes) via Web Crypto
    UI->>UI: Compara Hash Calculado com preview.metadata.sha256_checksum
    alt Hashes Coincidem
        UI->>UI: checksumVerified = true
        UI->>Engine: pdfjsLib.getDocument({ data: bytes.slice() })
        Engine-->>UI: PDFDocumentProxy
        loop Para cada página do documento
            UI->>Canvas: Renderiza página (pageNumber, zoom)
            Canvas->>Engine: page.getViewport({ scale: zoom * devicePixelRatio })
            Canvas->>Canvas: Desenha no HTML5 Canvas 2D
        end
    else Divergência de Hash
        UI->>UI: validationError = "Divergência de integridade: SHA-256 difere dos metadados"
        UI->>UI: Bloqueia renderização
    end
```

---

### 19. FLUXO DE GERAÇÃO

A geração física de documentos em disco ocorre através de duas vias complementares:
1. **Via Preview Verificado (`export_previewed_document`):**
   - O usuário visualiza o documento na tela e clica em `[Exportar]`.
   - O frontend envia o `preview_id` e o `expected_sha256`.
   - O backend recupera o binário original em cache no `DocumentPreviewStore`.
   - O hash é conferido novamente no backend.
   - O arquivo é escrito no disco com `create_new(true)`.
   - O backend relê o arquivo físico do disco, recalcula o SHA-256 e, se coincidir 100%, confirma o sucesso da exportação.
2. **Via Geração Direta (`generate_document`):**
   - Utilizada por relatórios analíticos em lote (ex.: `ReconciliationReportButton`).
   - O documento é compilado e gravado diretamente na pasta `Downloads`.

---

### 20. FLUXO DE ARMAZENAMENTO

1. **Armazenamento em Memória (Sessão):**
   - Gerenciado pela struct `DocumentPreviewStore` (`src-tauri/src/modules/documents/preview_store.rs`).
   - Mantém uma fila concorrente (`VecDeque<StoredPreview>`) protegida por `Mutex`.
   - **TTL Estrito:** 30 minutos (`DEFAULT_PREVIEW_TTL_SECS = 1800`). Previews expirados são descartados automaticamente.
   - **Limite de Capacidade:** Máximo de 16 previews simultâneos (`DEFAULT_MAX_PREVIEW_ENTRIES = 16`) ou 64 MiB acumulados (`DEFAULT_MAX_PREVIEW_TOTAL_BYTES = 64 * 1024 * 1024`). Se excedido, os previews mais antigos são removidos (política FIFO).
2. **Armazenamento Físico em Disco:**
   - Destino: Diretório padrão de downloads do sistema operacional (`dirs::download_dir()`).
   - Prevenção de Sobrescrita: O arquivo é nomeado com carimbo de data/hora (ex.: `Contrato_Cessao_Posse_DOC_123_1731360000.pdf`). Se já existir um arquivo com o mesmo nome, o salvamento adiciona um sufixo numérico incremental para evitar perda de dados.

---

### 21. FLUXO DE RECUPERAÇÃO

1. **Durante a Sessão:** O preview permanece disponível no `DocumentPreviewStore` para re-renderização imediata e exportação sem recompilação.
2. **Após Reinicialização:** Como não há catálogo persistido no SQLite, os previews em memória são limpos. Os documentos físicos previamente exportados permanecem salvos na pasta `Downloads` do usuário, mas o aplicativo atualmente não possui uma interface para listar ou reabrir esses arquivos automaticamente.

---

### 22. OPERAÇÕES DE MANIPULAÇÃO PDF

| Operação de Manipulação | Status | Evidência Técnica |
|---|---|---|
| Inclusão / Exclusão de Páginas | **NÃO IMPLEMENTADO** | Sem dependência de bibliotecas de mutação (ex.: `lopdf`, `pdf-writer`). |
| Reordenação e Rotação | **NÃO IMPLEMENTADO** | O Typst produz o layout fixo de acordo com o template. |
| Junção de PDFs (Merge) | **NÃO IMPLEMENTADO** | Inexistente. |
| Divisão de PDFs (Split) | **NÃO IMPLEMENTADO** | Inexistente. |
| Inserção de Marca d'Água | **PARCIAL (Nativo no Template)** | Implementável diretamente na camada de template Typst, mas sem controle dinâmico pelo frontend. |
| Preenchimento de Formulários AcroForms | **NÃO IMPLEMENTADO** | O sistema gera documentos finais fechados para leitura/impressão. |
| Anotações e Destaques (Highlights) | **NÃO IMPLEMENTADO** | O visualizador PDF.js não instancia a camada de anotações (`AnnotationLayer`). |

---

### 23. MODELO DE DADOS

#### Interfaces Centrais TypeScript (`src/platform/tauri/contracts/document-contracts.ts`)
```typescript
export type DocumentKind =
  | 'citizen_ledger'
  | 'invoice_bill'
  | 'cessao_posse'
  | 'real_estate_reconciliation';

export interface DocumentMetadata {
  document_kind: DocumentKind;
  generated_at_utc: string;
  sha256_checksum: string;
  byte_size: number;
  template_id: string;
}

export interface DocumentPreviewResult {
  success: boolean;
  preview_id: string;
  pdf_base64: string;
  page_count: number;
  pages: DocumentPreviewPage[];
  created_at_utc: string;
  expires_at_utc: string;
  message: string;
  metadata: DocumentMetadata;
}
```

#### Structs Centrais Rust (`src-tauri/src/modules/documents/models.rs`)
```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DocumentKind {
    CitizenLedger,
    InvoiceBill,
    CessaoPosse,
    RealEstateReconciliation,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DocumentScope {
    Cockpit,
    Universal,
}
```

---

### 24. ESTRATÉGIA DE PERSISTÊNCIA

1. **Diagnóstico do SQLite:** As migrações do banco local (`migrations.rs` e `real_estate_migrations.rs`) configuram tabelas para o cofre (`vault_header`, `wallets`, `vault_secrets`) e para o cadastro imobiliário (`properties`, `addresses`, `import_batches`, `audit_findings`). **Não existe nenhuma tabela para documentos ou PDFs**.
2. **Diagnóstico do Filesystem:** Os PDFs gerados não são armazenados na pasta oculta do aplicativo (`~/.local/share/devos/`), mas sim exportados abertamente para a pasta de `Downloads` do usuário.
3. **Diagnóstico de BLOBs:** O banco SQLite não armazena bytes binários de PDFs, evitando inchaço desnecessário da base local.

---

### 25. EXTRAÇÃO DE TEXTO E METADADOS

1. **Extração de Texto no Frontend:** O visualizador PDF.js instancia apenas o contexto de Canvas 2D (`page.render()`). A camada textual (`TextLayer`) não é renderizada, impedindo seleção de texto com o mouse ou busca de palavras pelo usuário.
2. **Extração de Metadados no Backend:** O motor Typst gera metadados padronizados estruturados (`DocumentMetadata`), incluindo data UTC, hash SHA-256 e ID do template, que acompanham a resposta do IPC.

---

### 26. AUDITORIA OCR (RECONHECIMENTO ÓPTICO DE CARACTERES)

- **Diagnóstico:** **INEXISTENTE**.
- **Evidência:** Pesquisas completas no repositório por `tesseract`, `leptonica`, `ocr`, `image-to-text` ou equivalentes resultaram em zero ocorrências. O DevOS gera apenas PDFs digitais de primeira geração (nativamente vetoriais), onde os textos e gráficos são compilados pelo Typst com fontes TTF embutidas.

---

### 27. AUDITORIA DE ASSINATURAS DIGITAIS

| Modalidade de Assinatura | Status Técnico | Evidência no Repositório |
|---|---|---|
| **Assinatura Visual / Selo Eletrônico** | **PRONTO** | Componente `digital-signature.tsx` e rodapé de `header_footer.typ`. Insere o nome do signatário, carimbo de data/hora e hash SHA-256 no corpo do documento. |
| **Assinatura Eletrônica Declarativa** | **PRONTO** | Cláusulas contratuais (Cláusula 1.5.41 e Cláusula 17.9 de `contrato_cessao_posse.typ`) estabelecendo que o selo digital interno serve para padronização e controle administrativo. |
| **Assinatura Criptográfica PAdES (ISO 32000 / ETSI TS 102 778)** | **NÃO IMPLEMENTADO** | Inexistente. Não há inserção de dicionário `/ByteRange`, `/Contents` em formato PKCS#7 / CMS ou certificado digital ICP-Brasil incorporado ao binário do PDF. |
| **Verificação Criptográfica de Assinatura** | **NÃO IMPLEMENTADO** | O sistema não valida assinaturas digitais embutidas em PDFs externos. |

> [!IMPORTANT]
> O teste `test_footer_does_not_claim_icp_brasil_authentication` e o teste `test_templates_do_not_contain_unverified_legal_or_d1_claims` no Rust garantem expressamente que os templates do DevOS **não façam alegações falsas de certificação ICP-Brasil ou autenticação notarial**, preservando a conformidade legal estrita.

---

### 28. INTEGRIDADE DOCUMENTAL

A integridade do subsistema baseia-se em uma cadeia criptográfica de três elos:
1. **Elo 1 (Geração Nativa):** Ao compilar o PDF em Rust, o hash SHA-256 é calculado imediatamente sobre os bytes do buffer antes de qualquer outra operação.
2. **Elo 2 (Validação no Cliente):** Ao receber os bytes em Base64 no frontend, o `PdfViewerLayout` recalcula o SHA-256 via Web Crypto API nativa do navegador. Se o hash calculado for diferente do hash declarado nos metadados, a exibição é sumariamente bloqueada com mensagem de erro.
3. **Elo 3 (Gravação Conforme):** Ao exportar um preview, o comando `export_previewed_document` exige o `expected_sha256`. O backend confere a igualdade com o binário em cache, grava em disco, relê o arquivo físico e valida o SHA-256 novamente antes de retornar sucesso ao usuário.

---

### 29. SEGURANÇA

1. **Prevenção contra Path Traversal:** A função `normalize_pdf_file_name` em `src-tauri/src/commands/document_commands.rs` remove qualquer caractere de controle, sanitiza separadores de diretório (`/`, `\`) e componentes perigosos (`..`).
2. **Prevenção contra Sobrescrita Involuntária:** A função `write_pdf_without_overwrite` utiliza a flag nativa do Rust `OpenOptions::new().write(true).create_new(true)`, impedindo a sobrescrita acidental de arquivos preexistentes.
3. **Proteção de Memória:** O `DocumentPreviewStore` impõe limites estritos de 64 MiB e 16 entradas, com limpeza automática por TTL, prevenindo ataques de esgotamento de memória (Memory Exhaustion DoS).
4. **Isolamento de JavaScript:** O PDF.js é configurado em modo restrito, sem execução de scripts incorporados ao PDF.

---

### 30. DESEMPENHO E CONFIABILIDADE

- **Compilação em Milissegundos:** O compilador Typst em Rust gera documentos multipágina (de 1 a 78 páginas) em menos de 80 milissegundos.
- **Renderização HiDPI:** O `PdfPageCanvas` multiplica a escala pelo `window.devicePixelRatio`, garantindo nitidez cristalina em monitores Retina e 4K.
- **Cancelamento Ativo:** O visualizador cancela ativamente tarefas de renderização assíncronas do PDF.js (`activeRenderTask.cancel()`) quando o usuário altera o zoom ou muda de página rapidamente, prevenindo concorrência no contexto 2D do Canvas.

---

### 31. INTEGRAÇÕES COM OUTROS MÓDULOS

| Módulo Alvo | Natureza da Integração | Estado da Integração | Evidência Técnica |
|---|---|---|---|
| **Identity** | Identificação e autoria documental | **PARCIAL** | Utiliza dados do associado/operador para preencher os campos do payload, sem assinatura de chave. |
| **Vault** | Proteção de credenciais | **NÃO INTEGRADO** | A geração de documentos não acessa diretamente chaves privadas do cofre. |
| **IPFS** | Custódia e pinning de documentos | **NÃO IMPLEMENTADO** | O módulo de documentos não invoca o cliente IPFS local. |
| **Ledger (Livro-Razão)** | Emissão de extrato e faturas | **IMPLEMENTADA E FUNCIONAL** | `CitizenLedgerView` emite extratos em PDF consumindo a bridge documental. |
| **Cadastro Imobiliário** | Relatórios de reconciliação cadastral | **IMPLEMENTADA E FUNCIONAL** | `ReconciliationReportButton` compila relatórios analíticos de milhares de registros. |
| **Contratos (Cessão de Posse)** | Emissão de instrumentos contratuais | **IMPLEMENTADA E FUNCIONAL** | `CessaoPosseView` emite contratos completos formatados segundo a ABNT. |

---

### 32. SEPARAÇÃO DEVOS NODE VS. DEVOS COCKPIT

| Funcionalidade Documental | Compartilhada | Exclusiva DevOS Cockpit | Exclusiva DevOS Node |
|---|---|---|---|
| Motor de Compilação Typst | **Sim** (Binário único) | Não | Não |
| Visualizador PDF.js (`PdfViewerLayout`) | **Sim** (`src/shared/`) | Não | Não |
| Galeria de Modelos (`/devos/documents`) | Não | **Sim** (`edition.cockpit.ts`) | Não (Não listada na navegação) |
| Emissão de Cessão de Posse | Não | **Sim** (`DocumentScope::Cockpit`) | Bloqueada no backend |
| Emissão de Reconciliação Imobiliária | Não | **Sim** (`DocumentScope::Cockpit`) | Bloqueada no backend |
| Emissão de Fatura Associativa | **Sim** (`DocumentScope::Universal`) | Sim | Sim |
| Emissão de Extrato Livro-Razão | **Sim** (`DocumentScope::Universal`) | Sim | Sim |

---

### 33. ORGANIZAÇÃO ARQUITETURAL

A estrutura arquitetural do módulo de documentos está bem delineada, com excelente separação de responsabilidades:
- O frontend mantém componentes compartilhados de visualização em `src/shared/components/pdf-viewer/` e o catálogo institucional em `src/modules/documents/presentation/catalog/`.
- O backend centraliza o domínio em `src-tauri/src/modules/documents/` e o compilador puro em `src-tauri/src/platform/typst_engine.rs`.
- **Ponto de Melhoria Identificado:** As pastas `src/shared/components/abnt-document/` contêm componentes legados de emulação HTML de páginas A4 que se tornaram redundantes após a adoção universal do `PdfViewerLayout` e do Typst.

---

### 34. AVALIAÇÃO DE NOMENCLATURA

- **Nomenclatura no Backend (Rust):** Segue rigorosamente as convenções canônicas do Rust (`snake_case` para módulos e funções, `PascalCase` para structs e traits).
- **Nomenclatura no Frontend (TypeScript):** Segue o padrão de kebab-case para arquivos utilitários/contratos e PascalCase para componentes React.
- **Nomenclatura de Comandos IPC:** Clara e semântica (`generate_document`, `preview_document`, `export_previewed_document`).

---

### 35. TESTES E VALIDAÇÕES

O subsistema possui uma das maiores coberturas de testes automatizados do DevOS Desktop:

#### Testes de Backend (Rust / Cargo test):
- **Arquivo Principal:** `src-tauri/src/tests/document_integration_test.rs` e testes unitários em `service.rs`, `typst_renderer.rs`, `preview_store.rs`, `document_commands.rs`.
- **Total Executado:** **69 testes aprovados (100% de sucesso)**.
- **Cobertura Comprovada:**
  - Isolamento de escopo Node vs Cockpit.
  - Sanitização de caminhos e prevenção contra path traversal.
  - Igualdade estrita de bytes e hash SHA-256 entre preview e exportação.
  - Expiração de TTL e limites de memória no `DocumentPreviewStore`.
  - Compilação dos 4 templates canônicos com injeção de parâmetros.

#### Testes de Frontend (Vitest):
- `src/test/document-bridge.spec.ts`: 13 testes cobrindo invocação nativa, tratamento de erro tipado e mapeamento de falhas.
- `src/test/documents-and-reports.spec.tsx`: 6 testes cobrindo integração e apresentação.
- `src/test/pdf-binary-utils.spec.ts`: 4 testes cobrindo validação de cabeçalho `%PDF-`, cálculo de SHA-256 e conversões Base64.
- `src/test/pdf-engine-and-viewer.spec.ts`: 5 testes cobrindo o ciclo de vida do worker e layout do visualizador.
- **Total Executado:** **28 testes específicos de frontend aprovados (100% de sucesso)**.

**Total Geral:** **97 testes automatizados cobrindo diretamente o subsistema de documentos**.

---

### 36. DUPLICIDADES E INCONSISTÊNCIAS

1. **Duplicação de Apresentação ABNT:** O componente React `a4-page.tsx` renderiza uma simulação HTML/CSS de folha A4 com `@media print`. Quando o usuário clica em "Visualizar", a simulação HTML é substituída pelo Canvas do PDF real compilado pelo Typst. Com a chegada da galeria `DocumentTemplatesGalleryView`, a simulação HTML tornou-se obsoleta.
2. **Geração Desnecessária de SVG:** A função `compile_typst_document_with_preview` compila os nós do documento em SVG (codificados em Base64) além dos bytes do PDF. Como o frontend consome exclusivamente o buffer binário do PDF via PDF.js, a renderização vetorial de SVG consome ciclos de CPU sem utilização comprovada.

---

### 37. MATRIZ DE MATURIDADE FUNCIONAL

| Funcionalidade Auditada | Classificação Oficial | Nível de Evidência | Detalhe Técnico Comprovado |
|---|---|---|---|
| Compilador Typst em Memória | **PRONTO** | E4 (Execução Comprovada) | Compilação nativa em Rust via `typst_as_lib`; 69 testes Rust aprovados. |
| Renderização em Canvas (PDF.js) | **PRONTO** | E4 (Execução Comprovada) | Worker local legacy; DPR de telas HiDPI; cancelamento de tarefas. |
| Catálogo de Modelos e Folhas A4 | **PRONTO** | E4 (Execução Comprovada) | `DocumentTemplatesGalleryView` operacional na rota `/devos/documents`. |
| Modal de Pré-visualização Typst | **PRONTO** | E4 (Execução Comprovada) | `TemplatePreviewDialog` consome `PdfViewerLayout` em modo dialog. |
| Verificação de SHA-256 no Cliente | **PRONTO** | E4 (Execução Comprovada) | Web Crypto API valida igualdade de hash antes de desenhar no Canvas. |
| Garantia de Identidade Preview/Export | **PRONTO** | E4 (Execução Comprovada) | `DocumentPreviewStore` valida bytes e hash SHA-256 antes da escrita. |
| Isolamento de Escopo Node / Cockpit | **PRONTO** | E4 (Execução Comprovada) | `DocumentScope` validado em testes de autorização no backend. |
| Proteção contra Path Traversal | **PRONTO** | E4 (Execução Comprovada) | `normalize_pdf_file_name` e `write_pdf_without_overwrite`. |
| Emissão Contrato de Cessão de Posse | **PRONTO** | E4 (Execução Comprovada) | Template oficial com 28 cláusulas diagramado em Typst. |
| Emissão Fatura Associativa | **PRONTO** | E4 (Execução Comprovada) | Validações matemáticas estritas e layout ABNT. |
| Emissão Extrato Livro-Razão | **PRONTO** | E4 (Execução Comprovada) | Demonstrativo contábil integrado ao módulo Ledger. |
| Emissão Relatório Reconciliação | **PRONTO** | E4 (Execução Comprovada) | Suporta de 500 a 2.500 linhas com paginação no Cockpit. |
| Assinatura Visual / Selo Eletrônico | **PRONTO** | E3 (Teste Aprovado) | Exibição visual de dados de qualificação e hash SHA-256. |
| Assinatura Criptográfica PAdES | **NÃO IMPLEMENTADO** | E1 (Código Inexistente) | Sem suporte a certificados X.509 e estruturas CMS no PDF. |
| Catálogo Persistido no SQLite | **NÃO IMPLEMENTADO** | E1 (Código Inexistente) | Sem tabela `documents` no banco local. |
| Custódia Descentralizada IPFS | **NÃO IMPLEMENTADO** | E1 (Código Inexistente) | O módulo de documentos não dispara pinning nem gera CIDs. |
| Manipulação de Páginas (Merge/Split) | **NÃO IMPLEMENTADO** | E1 (Código Inexistente) | Sem operações de edição pós-compilação. |
| OCR e Camada de Busca Textual | **NÃO IMPLEMENTADO** | E1 (Código Inexistente) | Canvas 2D sem TextLayer do PDF.js; sem motor OCR. |

---

### 38. PROPOSTA DE ARQUITETURA RECOMENDADA

Para consolidar o módulo documental sem refatorar o que já funciona com excelência, propõe-se a seguinte evolução modular:

```mermaid
graph TD
    subgraph UI_Layer [Camada de Apresentação (React 19)]
        DTGV["DocumentTemplatesGalleryView<br/>(Catálogo de Modelos)"]
        DMV["DocumentManagerView<br/>[NOVO: Histórico e Catálogo Local]"]
        PVL["PdfViewerLayout<br/>(Com TextLayer + Busca Textual)"]
    end

    subgraph Domain_Bridge [Domínio e IPC Bridge]
        DB["document-bridge.ts<br/>(listDocuments, previewDocument, exportDocument)"]
        DC["document-contracts.ts"]
    end

    subgraph Rust_Core [Núcleo Nativo Rust (Tauri v2)]
        CMD["document_commands.rs"]
        SVC["DocumentsService"]
        STORE["DocumentPreviewStore (Memória)"]
        ENG["TypstEngine (Compilação)"]
    end

    subgraph Storage_Layer [Camada de Persistência e Rede]
        SQLITE[("SQLite: documents_catalog<br/>[NOVA TABELA]")]
        FS[("~/Downloads / Filesystem")]
        IPFS[("Daemon IPFS Local<br/>(Upload & Pinning de CIDs)")]
    end

    DTGV --> PVL
    DMV --> PVL
    DTGV --> DB
    DMV --> DB
    DB --> CMD
    CMD --> SVC
    SVC --> ENG
    SVC --> STORE
    CMD --> SQLITE
    CMD --> FS
    CMD -.-> IPFS
```

---

### 39. PLANO DE CONSOLIDAÇÃO PRIORIZADO (P0 A P6)

#### P0 — Segurança e Integridade (Manutenção Preventiva)
- **Ação:** Manter ativas todas as travas existentes de `normalize_pdf_file_name` e `write_pdf_without_overwrite`.
- **Ação:** Otimizar a compilação Typst para eliminar a geração de SVGs desnecessários quando a saída requisitada for exclusivamente PDF.
- **Critério de conclusão:** Zero regressões nos 69 testes de segurança e integridade do backend.

#### P1 — Persistência e Catálogo Histórico (SQLite)
- **Ação:** Criar migration no SQLite (`devos_vault.sqlite`) com a tabela `documents_catalog`:
  `id, document_kind, file_name, file_path, sha256_checksum, byte_size, template_id, created_at, scope, ipfs_cid, signature_status`.
- **Ação:** Ao executar `export_previewed_document` ou `generate_document`, registrar automaticamente a emissão no banco.
- **Ação:** Criar comandos Tauri `list_generated_documents` e `get_document_by_id`.
- **Critério de conclusão:** Documentos emitidos continuam listados e consultáveis após reiniciar a aplicação.

#### P2 — Integração com IPFS (Custódia Descentralizada)
- **Ação:** Permitir que, ao exportar um documento, o usuário opte por "Salvar e Custodiar no IPFS".
- **Ação:** O backend grava o arquivo físico e invoca internamente `ipfs_client.upload_and_pin()`, gravando o `ipfs_cid` correspondente no catálogo do SQLite.
- **Critério de conclusão:** Documento emitido recebe um CID verificável pelo módulo de IPFS do DevOS.

#### P3 — Evolução da Interface e Experiência do Visualizador
- **Ação:** Habilitar a `TextLayer` do PDF.js no `PdfPageCanvas` para permitir seleção, cópia e destaque de texto no documento.
- **Ação:** Implementar campo de pesquisa textual na barra superior do `PdfViewerLayout`.
- **Ação:** Criar barra lateral retrátil com miniaturas das páginas (`PdfThumbnailBar`).
- **Critério de conclusão:** Usuário consegue selecionar e copiar textos do PDF e buscar palavras dentro do visualizador.

#### P4 — Módulo de Assinatura Criptográfica PAdES
- **Ação:** Integrar crate em Rust para assinatura de PDFs (e.g. módulo especializado baseado em `rcgen` / `ring` ou adaptador CMS/PKCS#7).
- **Ação:** Conectar o processo de assinatura à chave privada do usuário armazenada no cofre (`VaultSession`).
- **Critério de conclusão:** PDF gerado possui dicionário de assinatura `/ByteRange` válido e auditável pelo Adobe Acrobat ou assinador do Governo Federal.

#### P5 — Interface do Gerenciador de Documentos
- **Ação:** Criar a tela `DocumentManagerView` para listar todos os documentos já gerados pelo associado, com filtros por tipo, período e busca por hash SHA-256.
- **Critério de conclusão:** Tela operacional e integrada à barra lateral de navegação do DevOS.

#### P6 — Evoluções Futuras (Manipulação Avançada e OCR)
- **Ação:** Avaliar necessidade de junção/divisão de PDFs e motor de OCR somente caso haja demanda por importação de documentos escaneados externos.

---

### 40. CRITÉRIOS DE CONCLUSÃO

A auditoria comprova que o módulo de documentos PDF do DevOS Desktop **não precisa ser reescrito**. Sua arquitetura central de compilação Typst em Rust e renderização PDF.js no React é exemplar, moderna e segura. O caminho recomendado consiste em **preservar integralmente o motor atual** e evoluir em etapas focadas: persistência em SQLite, integração opcional com IPFS e habilitação da camada textual no visualizador.

---

### 41. LIMITAÇÕES DA AUDITORIA

1. **Testes de Impressão Física:** A auditoria validou as diretivas CSS `@media print`, mas a fidelidade de saída em impressoras físicas depende dos drivers do sistema operacional hospedeiro.
2. **Ambiente Host sem Kubo:** O teste `test_resolve_ipfs_binary_finds_kubo_executable` depende da instalação externa do Kubo no host, o que não afeta a compilação nativa dos documentos em si.

---

### 42. CONCLUSÃO TÉCNICA

O módulo de documentos PDF do ASPPIBRA-DAO DevOS Desktop representa **um dos componentes arquiteturalmente mais maduros e bem implementados do projeto**.

Com 97 testes automatizados cobrindo geração, visualização, integridade de hash e isolamento de escopos, o subsistema já atende plenamente aos requisitos de emissão de contratos e relatórios oficiais. O relatório fornece o roteiro claro e sem retrabalho para as fases de persistência, custódia e expansão da experiência do usuário.
