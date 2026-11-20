# DOSSIÊ TÉCNICO DE EXTRAÇÃO INTEGRAL — ABA 1: PERFIL GERAL
**Projeto:** ASPPIBRA DAO — DevOS Desktop  
**Data da Extração:** 2026-11-18  
**Rota Canônica:** `/user/account`  
**Status da Implementação:** PERSISTÊNCIA NATIVA TOTALMENTE IMPLEMENTADA E HOMOLOGADA (COM OBSERVAÇÃO SOBRE UPLOAD DE MÍDIA)

---

## 1. IDENTIFICAÇÃO E ESCOPO DA AUDITORIA

Este compêndio documenta exaustivamente a arquitetura, implementações, regras de validação, gerenciamento de estado reativo, integração IPC, persistência transacional em SQLite criptografado (AES-256-GCM) e o código-fonte integral da **ABA 1 — Perfil Geral** da Central de Identidade Digital do DevOS Desktop.

O escopo investigado abrange o ciclo de vida completo dos dados cadastrais civis e empresariais:
1. **Roteamento e Layout:** Entrada SPA `/user/account`, integração via `@edition` (Node e Cockpit) e layout unificado `AccountLayout`.
2. **Campos Pessoais (PF):** Nome, Sobrenome, CPF, RG, Órgão Emissor, CNH, Categoria CNH, Data de Nascimento, Filiação (Nome da Mãe e Pai), Nacionalidade, Estado Civil.
3. **Campos Empresariais (PJ):** Razão Social, CNPJ (numérico e alfanumérico RFB IN 2.229/2024), Representante Legal, CPF do Representante.
4. **Endereço Completo:** País, CEP, Estado (UF), Cidade, Bairro, Logradouro, Número/Km, Complemento.
5. **Dados Profissionais/Institucionais:** Ocupação/CNAE, Empresa/Grupo Econômico, Website com validação RFC, Biografia/Apresentação (até 2.000 caracteres).
6. **Mídia e Fotografia:** Diagnóstico do campo `photoURL` e `coverURL`, identificando a persistência atual via string e o mock de preview via `URL.createObjectURL`.
7. **Privacidade e LGPD:** Controle `isPublic` e geração de projeção pública restrita (`PublicUserProfileDto`) no Rust.
8. **Motor de Completude:** Cálculo determinístico somando exatamente 100 pontos para PF e PJ.
9. **Persistência Criptográfica Nativa:** Cifragem no cofre `devos_vault.sqlite`, controle de revisão concorrente (`expected_revision`), bridge IPC e migração resiliente de dados legados (`devos_user_account_profile`).

---

## 2. ÍNDICE DOS DOCUMENTOS DO DOSSIÊ

| Documento | Título | Conteúdo Principal |
|:---:|---|---|
| **01** | `01-README.md` | Identificação, escopo, resumo executivo e índice. |
| **02** | `02-ROUTE-MAP.md` | Mapeamento completo de rotas, layouts, guards e breadcrumbs. |
| **03** | `03-COMPONENT-INVENTORY.md` | Inventário estrutural de componentes visuais e dependências. |
| **04** | `04-FORMS-AND-VALIDATION.md` | Schemas Zod, validadores de CPF, CNPJ, Data, CEP e regras PF/PJ. |
| **05** | `05-STATE-AND-HOOKS.md` | Store reativa `use-account.ts`, facade, concorrência e migração. |
| **06** | `06-SERVICES-AND-IPC.md` | `IdentityBridge`, contratos TypeScript e comandos Tauri IPC. |
| **07** | `07-BACKEND-AND-STORAGE.md` | Módulos Rust (`models.rs`, `service.rs`, `repository.rs`, SQLite). |
| **08** | `08-CRYPTOGRAPHY-AND-PRIVACY.md` | AES-256-GCM, isolamento de chaves, `Zeroizing` e projeção pública. |
| **09** | `09-UPLOAD-AND-MEDIA.md` | Investigação de fotos/avatares, URLs voláteis e persistência. |
| **10** | `10-SECURITY-AUDIT.md` | Análise AppSec, vulnerabilidades, LGPD e vetores de risco. |
| **11** | `11-FUNCTIONAL-STATUS.md` | Matriz de funcionalidades reais vs parciais vs simuladas. |
| **12** | `12-TEST-COVERAGE.md` | Cobertura de testes unitários e de integração (Vitest e Cargo Test). |
| **13** | `13-PRODUCTION-READINESS.md` | Matriz de prontidão para homologação em produção. |
| **14** | `14-PROFILE-GENERAL-COMPLETE-SOURCE.md` | Código-fonte integral de todos os arquivos relevantes (sem cortes). |
| **15** | `15-component-inventory.json` | Inventário estruturado em JSON para ferramentas automatizadas. |
