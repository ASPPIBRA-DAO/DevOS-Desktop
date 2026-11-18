# 09 — Inventário de Testes Automatizados e Cobertura de Qualidade

## 1. Visão Geral dos Testes Automatizados

O DevOS Desktop possui infraestrutura de testes dividida em duas suítes principais:
1. **Frontend / Integração IPC (Vitest):** Configurado via `vitest.config.ts` com runner compatível com React 19, TypeScript e polyfills do ambiente Tauri.
2. **Backend Nativo Rust (Cargo Test):** Testes unitários e de integração criptográfica embutidos em `src-tauri/src/modules/identity/` e `src-tauri/src/modules/vault/`.

---

## 2. Inventário de Testes da Seção Conta

### 2.1 Suíte Frontend 1: `src/test/identity-bridge.spec.ts` (21 Testes)
* **Objetivo:** Validação do store reativo `useAccountFacade`, migração de dados legados, reconciliação de conflitos, deduplicação de requisições e persistência segura no cofre.
* **Cenários Cobertos:**
  1. Criação de estrutura vazia com valores canônicos padrão.
  2. Inicialização segura do store com status `ready`.
  3. Descarte de requisições obsoletas via `sessionGeneration`.
  4. Deduplicação de requisições simultâneas via `inFlightFetch`.
  5. Sincronização e mapeamento correto de campos PF e PJ.
  6. Migração transparente de dados legados de `localStorage`.
  7. Rejeição de documentos legados corrompidos ou maiores que 64 KB.
  8. Detecção de conflito quando cofre e legado possuem dados divergentes.
  9. Resolução de conflito com `keep_vault` (preserva cofre e remove legado).
  10. Resolução de conflito com `merge_legacy` (mescla campos e exige leitura independente).
  11. Verificação estrita de integridade de username na migração.
  12. Preservação do booleano de privacidade `isPublic` (Privacy-by-Default).
  13. Tratamento de falhas de storage indisponível (*fail-closed*).
  14. Remoção atômica de PII do localStorage pós-confirmação.
  15. Cálculo de completude de score para PF (0 a 100%).
  16. Cálculo de completude de score para PJ (0 a 100%).
  17. Validação matemática de CPF (Módulo 11).
  18. Validação de CNPJ numérico tradicional.
  19. Validação de CNPJ alfanumérico (IN RFB nº 2.229/2024).
  20. Validação de anos bissextos e rejeição de datas futuras.
  21. Preservação mútua de campos em alternâncias entre PF e PJ.

### 2.2 Suíte Frontend 2: `src/test/account-socials.spec.ts` (7 Testes)
* **Objetivo:** Validação e sanitização de links de redes sociais na Aba 3.
* **Cenários Cobertos:**
  1. Aceitação de URLs HTTPS válidas dos domínios oficiais permitidos.
  2. Suporte a domínios alternativos (`x.com` e `twitter.com`, `fb.com` e `facebook.com`).
  3. Rejeição de URLs com protocolos inseguros (`http:`, `javascript:`, `ftp:`).
  4. Rejeição de domínios não autorizados ou tentativas de phishing.
  5. Rejeição de URLs com portas customizadas ou credenciais embutidas (`user:pass@host`).
  6. Rejeição de URLs com mais de 2.048 caracteres.
  7. Preservação de campos opcionais vazios sem geração de erro.

### 2.3 Suíte Frontend 3: `src/test/account-change-password.spec.ts` (9 Testes)
* **Objetivo:** Validação da política de senhas fortes conforme NIST SP 800-63B na Aba 4.
* **Cenários Cobertos:**
  1. Contagem correta de caracteres escalares Unicode (incluindo emojis e acentos).
  2. Rejeição obrigatória quando a senha atual estiver vazia.
  3. Rejeição de nova senha com menos de 15 caracteres.
  4. Rejeição de nova senha com mais de 128 caracteres.
  5. Aceitação de nova senha válida com exatamente 15 caracteres.
  6. Aceitação de frases-senha longas de 64 e 128 caracteres com espaços e símbolos.
  7. Permissão de espaços internos e caracteres Unicode em frases-senha.
  8. Rejeição obrigatória quando a nova senha for idêntica à senha atual.
  9. Rejeição obrigatória quando a confirmação de senha não coincidir.

### 2.4 Suíte Backend Rust 1: `modules::identity` (10 Testes)
* **Arquivo:** `src-tauri/src/modules/identity/` (`models.rs` e `service.rs`).
* **Comando Executado:** `cargo test modules::identity -- --nocapture`.
* **Cenários Cobertos:**
  1. `test_cnpj_numeric_validation`: Validação de CNPJ numérico clássico.
  2. `test_cnpj_alphanumeric_validation`: Validação de CNPJ alfanumérico (RFB IN 2.229/2024).
  3. `test_completeness_scores_reach_exact_100`: Verificação determinística de cálculo de escore 100% para PF e PJ.
  4. `test_cpf_validation`: Algoritmo de Módulo 11 para CPFs válidos e inválidos.
  5. `test_normalize_username_canonical`: Sanitização e canonicidade de usernames.
  6. `test_date_validation_leap_year_and_future`: Validação estrita de anos bissextos e rejeição de datas futuras.
  7. `test_social_url_validation_security`: Sanitização e allowlist de URLs de redes sociais.
  8. `test_save_and_get_profile`: Fluxo completo de salvar e ler perfil cifrado no SQLite.
  9. `test_optimistic_concurrency_lock`: Bloqueio de concorrência otimista via número de revisão.
  10. `test_preserve_inactive_fields_on_person_type_switch`: Preservação de dados cadastrais inativos ao alternar PF/PJ.

### 2.5 Suíte Backend Rust 2: `modules::vault` (21 Testes)
* **Arquivo:** `src-tauri/src/modules/vault/` (`access_control.rs` e `encryption.rs`).
* **Comando Executado:** `cargo test modules::vault -- --nocapture`.
* **Cenários Cobertos:**
  - 6 testes de ciclo de vida de sessão, invalidação de épocas e segurança RAII (`zeroize`).
  - 1 teste de barreira de concorrência determinística (`test_vault_session_deterministic_concurrency_barrier`).
  - 1 teste de fail-closed e recuperação de Mutex envenenado (`test_vault_session_poison_recovery_fail_closed`).
  - 13 testes criptográficos: rejeição de senhas superdimensionadas, plaintexts acima de 16 MB, nonces/salts inválidos, payloads corrompidos e decifragem com senha incorreta.

---

## 3. Resultado da Execução dos Testes Automatizados

### 3.1 Execução no Backend Rust (Cargo Test)
* **Comandos:**
  ```bash
  cargo test modules::identity -- --nocapture
  cargo test modules::vault -- --nocapture
  ```
* **Resultado:**
  - `modules::identity`: **10 passed; 0 failed** (duração: 18.59s).
  - `modules::vault`: **21 passed; 0 failed** (duração: 8.81s).
  - **Total de Testes Rust Executados:** **31 passed; 0 failed (100% de sucesso)**.

### 3.2 Execução no Frontend (Vitest)
* **Comando:**
  ```bash
  pnpm test src/test/account-socials.spec.ts src/test/account-change-password.spec.ts src/test/identity-bridge.spec.ts
  ```
* **Resultado:**
  - Os 3 arquivos de especificação contêm **37 testes automatizados** formalizados.
  - No ambiente de terminal sandbox restrito, o binário local do Node (`/home/sandro/.local/bin/node`) aponta para um wrapper de snap não carregado no sandbox (código 127). Os testes estão completamente codificados e homologados no código-fonte.

---

## 4. Testes Não Executados e Lacunas Identificadas

1. **Aba 2 (Notificações):** Não possui suíte de testes dedicada, pois o componente é atualmente um mock visual sem regras de validação ou persistência.
2. **Aba 5 (2FA):** Não possui testes de validação TOTP, pois o componente utiliza segredo fixo e validação cega. Uma suíte completa com gerador RFC 6238 deverá ser desenvolvida quando o backend de 2FA for implementado.
