# RELATÓRIO TÉCNICO DE IMPLEMENTAÇÃO E HOMOLOGAÇÃO DE PRODUÇÃO
## TELA DE IDENTIDADE CIVIL E PERFIL DO USUÁRIO — DEVOS DESKTOP

**Projeto:** ASPPIBRA-DAO DevOS Desktop  
**Edição:** DevOS Node & DevOS Cockpit  
**Escopo:** Tela de Identidade Civil (`/user/account`) — Validação Oficial, Criptografia, Persistência SQLite e Sincronização Nativa  
**Data:** 17 de Novembro de 2026  
**Status:** **HOMOLOGADO PARA PRODUÇÃO**  
**Classificação:** Confidencial / Arquitetura Interna Core  

---

## 1. RESUMO EXECUTIVO

Esta entrega conclui a **Ordem Técnica Única de Identidade Civil do DevOS Desktop**. O módulo de cadastro e qualificação civil (`/user/account`) foi auditado, higienizado e conectado ao backend nativo **Tauri v2 + Rust + SQLite (`devos_vault.sqlite`)**, sob proteção criptográfica **Argon2id + AES-256-GCM**.

Foram eliminadas todas as causas raízes de inconsistência:
1. **CNPJ Alfanumérico (RFB 2026):** Implementado suporte completo ao novo formato oficial (IN RFB nº 2.229/2024), aceitando tanto CNPJ numérico legado quanto o formato com letras e números nas 12 primeiras posições e 2 dígitos verificadores calculados por Módulo 11 (`ASCII - 48`).
2. **Preservação de Username:** O campo `username` foi incluído em todo o ciclo de transporte, persistência cifrada e recuperação.
3. **Migração Segura e Não-Destrutiva do `localStorage`:** A chave legada `devos_user_account_profile` não é mais removida antes da confirmação de gravação e leitura de volta independente (*read-back*). Em caso de falha ou conflito, a fonte original é mantida intacta.
4. **Proteção Contra Perda de Digitação:** O formulário não executa `reset()` se o usuário estiver editando dados (`isDirty: true`).
5. **Prevenção de Flash de Formulário Vazio:** O formulário exibe *Skeleton Loading* até que o backend responda de forma definitiva (`hasLoadedInitially`).
6. **Isolamento de Payloads PF vs PJ:** Ao salvar PF, dados corporativos de PJ são desconsiderados; ao salvar PJ, dados civis exclusivos de PF não são enviados nem exigidos.
7. **Projeção Pública com Allowlist:** A opção `isPublic: true` não expõe dados sensíveis (CPF, RG, CNH, filiação, data de nascimento e endereço residencial permanecem privados em qualquer circunstância).
8. **Completeness Score Exato:** As pontuações de PF e PJ totalizam exatamente 100 pontos.

---

## 2. INVENTÁRIO DE ARQUIVOS MODIFICADOS E CRIADOS

| Caminho Completo | Natureza | Papel no Sistema | Modificações / Correções Realizadas |
| :--- | :--- | :--- | :--- |
| `src-tauri/src/modules/vault/access_control.rs` | Rust (Core) | Sessão e Chave de Memória | Implementado `with_session_key()` com tratamento de envenenamento de Mutex (fail-closed) e helper de teste. |
| `src-tauri/src/commands/vault_commands.rs` | Rust (IPC) | Handlers do Cofre | Vinculado `try_unlock_with_session_key()` em `unlock_vault` e `init_master_password`, disponibilizando material sensível à camada de serviço de identidade sem vazamento para o frontend. |
| `src-tauri/src/storage/migrations.rs` | Rust (DB) | Migrações SQLite | Adicionada **Migração 2**: criação da tabela `user_profiles` com envelope criptográfico, revisão otimista e timestamps. |
| `src-tauri/src/modules/identity/models.rs` | Rust (Novo) | Domínio & Validações | Suporte a CNPJ alfanumérico (RFB 2026) e numérico legado, validação de CPF com verificação de caracteres prévios, validação de data com verificação de calendário gregoriano/bissexto e rejeição de datas futuras, `username`, `to_public_projection()` e score calibrado em 100 pontos. |
| `src-tauri/src/modules/identity/repository.rs` | Rust (Novo) | Persistência SQLite | Leitura e gravação atômica transacionada de envelopes criptográficos com trava de concorrência otimista (`revision`). |
| `src-tauri/src/modules/identity/service.rs` | Rust (Novo) | Camada de Negócios | Orquestração da validação, isolamento de dados PF vs PJ, encriptação/decriptação com `VaultCrypto`, fail-closed quando bloqueado e reconciliação segura de dados legados. |
| `src-tauri/src/modules/identity/mod.rs` | Rust (Novo) | Módulo Rust | Reexportação estruturada das rotinas de identidade. |
| `src-tauri/src/commands/identity_commands.rs` | Rust (Novo) | Comandos Tauri IPC | Exposição dos comandos `get_user_profile`, `save_user_profile` e `import_legacy_profile`. |
| `src-tauri/src/commands/mod.rs` | Rust (Core) | Módulo de Comandos | Registro e reexportação dos comandos de identidade. |
| `src-tauri/src/lib.rs` | Rust (Core) | Registro IPC Tauri | Registro dos comandos na macro unificada `app_invoke_handler!`. |
| `src-tauri/build.rs` | Rust (Build) | ACL e Manifesto | Inclusão de `get_user_profile`, `save_user_profile` e `import_legacy_profile` na constante de comandos canônicos `TAURI_APP_COMMANDS`. |
| `src-tauri/capabilities/desktop-vault.json` | JSON (Segurança) | ACL de Permissões | Autorização explícita dos comandos no runtime seguro Tauri v2. |
| `src/platform/tauri/contracts/identity-contracts.ts` | TypeScript | Tipagens e Contratos | Interfaces TypeScript `UserProfile`, `SaveUserProfilePayload` com inclusão de `username` e `PersonType`. |
| `src/platform/tauri/identity/identity-bridge.ts` | TypeScript (Novo) | Ponte de Transporte | Encapsulamento de chamadas `invokeNative` com timeout e mapeamento de erros IPC. |
| `src/platform/tauri/index.ts` | TypeScript | Ponto de Entrada IPC | Exportação dos contratos e bridge de identidade. |
| `src/sections/account/use-account.ts` | React / TS | Estado e Hook Reativo | Remoção do mock, factory limpa `createEmptyUserAccount()`, store reativo (`useSyncExternalStore`), migração não-destrutiva com leitura de volta verificada e preservação de `username`. |
| `src/sections/account/account-general.tsx` | React / TSX | Formulário de Identidade | Suporte completo a PF e PJ, validação Zod documental rigorosa (CPF, CNPJ numérico/alfanumérico, CEP, URLs sem esquemas perigosos), proteção de digitação no `reset`, cálculo exato do Completeness Score com `useWatch`, skeletons e cofre bloqueado. |
| `src/test/identity-bridge.spec.ts` | Vitest (Novo) | Testes de Integração | 7 testes unitários e contratuais cobrindo leitura, escrita PF/PJ com CNPJ alfanumérico, bloqueio de cofre, concorrência otimista e importação legada. |

---

## 3. MATRIZ DE RASTREABILIDADE DE CAMPOS

| Campo do Formulário | DTO TypeScript (`UserProfile`) | IPC Tauri Payload | DTO Rust (`UserProfileDto`) | Persistência SQLite | Leitura de Volta |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `personType` | `personType: 'PF' \| 'PJ'` | `personType` | `person_type: String` | `encrypted_envelope` (JSON) | Confirmado |
| `username` | `username: string` | `username` | `username: String` | `encrypted_envelope` (JSON) | Confirmado |
| `firstName` | `firstName: string` | `firstName` | `first_name: String` | `encrypted_envelope` (JSON) | Confirmado |
| `lastName` | `lastName: string` | `lastName` | `last_name: String` | `encrypted_envelope` (JSON) | Confirmado |
| `companyName` | `companyName: string` | `companyName` | `company_name: String` | `encrypted_envelope` (JSON) | Confirmado |
| `cnpj` | `cnpj: string` | `cnpj` | `cnpj: String` | `encrypted_envelope` (JSON) | Confirmado |
| `legalRepresentative` | `legalRepresentative: string` | `legalRepresentative` | `legal_representative: String` | `encrypted_envelope` (JSON) | Confirmado |
| `legalRepresentativeCpf`| `legalRepresentativeCpf: string` | `legalRepresentativeCpf`| `legal_representative_cpf: String` | `encrypted_envelope` (JSON) | Confirmado |
| `email` | `email: string` | `email` | `email: String` | `encrypted_envelope` (JSON) | Confirmado |
| `phoneNumber` | `phoneNumber: string` | `phoneNumber` | `phone_number: String` | `encrypted_envelope` (JSON) | Confirmado |
| `cpf` | `cpf: string` | `cpf` | `cpf: String` | `encrypted_envelope` (JSON) | Confirmado |
| `birthDate` | `birthDate: string` | `birthDate` | `birth_date: String` | `encrypted_envelope` (JSON) | Confirmado |
| `nationality` | `nationality: string` | `nationality` | `nationality: String` | `encrypted_envelope` (JSON) | Confirmado |
| `maritalStatus` | `maritalStatus: string` | `maritalStatus` | `marital_status: String` | `encrypted_envelope` (JSON) | Confirmado |
| `rg` | `rg: string` | `rg` | `rg: String` | `encrypted_envelope` (JSON) | Confirmado |
| `rgIssuer` | `rgIssuer: string` | `rgIssuer` | `rg_issuer: String` | `encrypted_envelope` (JSON) | Confirmado |
| `cnh` | `cnh: string` | `cnh` | `cnh: String` | `encrypted_envelope` (JSON) | Confirmado |
| `cnhCategory` | `cnhCategory: string` | `cnhCategory` | `cnh_category: String` | `encrypted_envelope` (JSON) | Confirmado |
| `motherName` | `motherName: string` | `motherName` | `mother_name: String` | `encrypted_envelope` (JSON) | Confirmado |
| `fatherName` | `fatherName: string` | `fatherName` | `father_name: String` | `encrypted_envelope` (JSON) | Confirmado |
| `country` | `country: string` | `country` | `country: String` | `encrypted_envelope` (JSON) | Confirmado |
| `zipCode` | `zipCode: string` | `zipCode` | `zip_code: String` | `encrypted_envelope` (JSON) | Confirmado |
| `state` | `state: string` | `state` | `state: String` | `encrypted_envelope` (JSON) | Confirmado |
| `city` | `city: string` | `city` | `city: String` | `encrypted_envelope` (JSON) | Confirmado |
| `neighborhood` | `neighborhood: string` | `neighborhood` | `neighborhood: String` | `encrypted_envelope` (JSON) | Confirmado |
| `address` | `address: string` | `address` | `address: String` | `encrypted_envelope` (JSON) | Confirmado |
| `addressNumber` | `addressNumber: string` | `addressNumber` | `address_number: String` | `encrypted_envelope` (JSON) | Confirmado |
| `complement` | `complement: string` | `complement` | `complement: String` | `encrypted_envelope` (JSON) | Confirmado |
| `occupation` | `occupation: string` | `occupation` | `occupation: String` | `encrypted_envelope` (JSON) | Confirmado |
| `company` | `company: string` | `company` | `company: String` | `encrypted_envelope` (JSON) | Confirmado |
| `website` | `website: string` | `website` | `website: String` | `encrypted_envelope` (JSON) | Confirmado |
| `about` | `about: string` | `about` | `about: String` | `encrypted_envelope` (JSON) | Confirmado |
| `isPublic` | `isPublic: boolean` | `isPublic` | `is_public: bool` | `encrypted_envelope` (JSON) | Confirmado |
| `completenessScore`| `completenessScore: number` | Calculado | `completeness_score: u32` | `encrypted_envelope` (JSON) | Confirmado |
| `revision` | `revision: number` | `expectedRevision`| `revision: u64` | `user_profiles.revision` | Confirmado |

---

## 4. ESPECIFICAÇÃO OFICIAL DO CNPJ ALFANUMÉRICO (IN RFB Nº 2.229/2024)

### 4.1 Algoritmo Módulo 11 Unificado
- **Estrutura:** 14 posições.
  - Posições 1 a 12: Caracteres alfanuméricos (`0-9` e `A-Z`).
  - Posições 13 e 14: Dígitos verificadores decimais (`0-9`).
- **Conversão de Caractere para Valor:**  
  $$\text{Valor}(C) = \text{ASCII}(C) - 48$$  
  - Para dígitos `'0'` a `'9'`: $48 - 48 = 0$ até $57 - 48 = 9$.
  - Para letras `'A'` a `'Z'`: $65 - 48 = 17$ até $90 - 48 = 42$.
- **1º Dígito Verificador:**
  - Pesos: $[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]$
  - $\text{Soma}_1 = \sum_{i=0}^{11} (\text{Valor}_i \times \text{Peso}_i)$
  - $\text{Resto}_1 = \text{Soma}_1 \pmod{11}$
  - $\text{DV}_1 = 0 \text{ se } \text{Resto}_1 < 2 \text{ senão } 11 - \text{Resto}_1$
- **2º Dígito Verificador:**
  - Pesos para as 12 posições: $[6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3]$ mais $\text{DV}_1 \times 2$.
  - $\text{Soma}_2 = \sum_{i=0}^{11} (\text{Valor}_i \times \text{Peso}_i) + (\text{DV}_1 \times 2)$
  - $\text{Resto}_2 = \text{Soma}_2 \pmod{11}$
  - $\text{DV}_2 = 0 \text{ se } \text{Resto}_2 < 2 \text{ senão } 11 - \text{Resto}_2$

O vetor de teste oficial alfanumérico implementado e validado nos testes unitários:  
Entrada: `12ABC34501DE35` $\rightarrow$ Formatado: `12.ABC.345/01DE-35` (**VÁLIDO**).

---

## 5. BATERIA DE TESTES AUTOMATIZADOS E EVIDÊNCIAS

### 5.1 Testes Unitários Rust (`cargo test --lib modules::identity`)
```text
running 7 tests
test modules::identity::models::tests::test_cnpj_alphanumeric_validation ... ok
test modules::identity::models::tests::test_cpf_validation ... ok
test modules::identity::models::tests::test_date_validation_leap_year_and_future ... ok
test modules::identity::models::tests::test_cnpj_numeric_validation ... ok
test modules::identity::models::tests::test_completeness_scores_reach_exact_100 ... ok
test modules::identity::service::tests::test_save_and_get_profile ... ok
test modules::identity::service::tests::test_optimistic_concurrency_lock ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 210 filtered out; finished in 6.03s
```

### 5.2 Testes Unitários Frontend (`vitest src/test/identity-bridge.spec.ts`)
```text
 ✓ src/test/identity-bridge.spec.ts (7 tests) 21ms
   ✓ IdentityBridge — Tauri Native Identity & Vault IPC (7)
     ✓ deve consultar o perfil do usuário via get_user_profile
     ✓ deve retornar null quando nenhum perfil estiver cadastrado
     ✓ deve salvar perfil via save_user_profile e retornar a entidade atualizada
     ✓ deve salvar perfil de Pessoa Jurídica com CNPJ alfanumérico RFB 2026
     ✓ deve propagar erro quando o cofre estiver bloqueado
     ✓ deve propagar erro estruturado de REVISION_CONFLICT em concorrência otimista
     ✓ deve importar perfil legado via import_legacy_profile preservando os dados

 Test Files  1 passed (1)
      Tests  7 passed (7)
```

### 5.3 Suite Completa de Regressão Frontend (`vitest run`)
- **18 arquivos de teste executados**
- **134 testes aprovados** (0 falhas)
- Verificação estática de tipos TypeScript (`tsc --noEmit`): **0 erros**.

---

## 6. LISTA DE RISCOS MITIGADOS E DECISÕES ARQUITETURAIS

1. **Risco de perda na migração (P0):** Mitigado com leitura de volta obrigatória (`verified.revision >= 1`) antes de qualquer remoção de chave no `localStorage`.
2. **CNPJ alfanumérico 2026 (P0):** Implementação unificada com Módulo 11 oficial da RFB, compatível com legado numérico e novo alfanumérico.
3. **Perda de digitação por reset prematuro (P1):** Condicionamento de `reset()` no formulário apenas quando `!isDirty`.
4. **Segregação PF vs PJ (P1):** Eliminação de conflitos de payload ao limpar campos exclusivos da outra modalidade antes da persistência.
5. **Score de completude calibrado (P2):** Pontuação exata de 100 pontos para PF e 100 pontos para PJ.

---
**Homologado por:** Engenheiro de Sistemas DevOS & Arquiteto de Software  
**ASPPIBRA DAO — DevOS Desktop**
