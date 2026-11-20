# COBERTURA DE TESTES AUTOMATIZADOS — ABA 1: PERFIL GERAL
**Projeto:** ASPPIBRA DAO — DevOS Desktop  
**Data:** 2026-11-18  

---

## 1. SUÍTE FRONTEND (VITEST)

A suíte em `src/test/identity-bridge.spec.ts` cobre amplamente os validadores e a lógica da ABA 1:

```text
 ✓ src/test/identity-bridge.spec.ts (22 tests)
   ✓ IdentityBridge — Tauri Native Identity & Vault IPC (22)
     ✓ deve mapear corretamente perfil completo de Pessoa Física (PF)
     ✓ deve mapear corretamente perfil completo de Pessoa Jurídica (PJ)
     ✓ isStrictValidCpf deve validar dígitos e rejeitar strings vazias, sequências ou DVs incorretos
     ✓ isStrictValidCnpj deve validar formato numérico e alfanumérico RFB 2026
     ✓ isStrictValidBirthDate deve validar datas válidas e rejeitar datas futuras ou inválidas
     ✓ isStrictValidCep deve aceitar 8 dígitos ou máscara 00000-000
     ✓ isStrictValidPhone deve aceitar telefones nacionais com DDD
     ✓ isStrictValidWebsite deve aceitar URLs HTTP/HTTPS e rejeitar credenciais embutidas
     ✓ calculateIdentityCompleteness deve atingir exatamente 100 pontos para PF completo
     ✓ calculateIdentityCompleteness deve atingir exatamente 100 pontos para PJ completo
     ✓ mapUserToFormValues deve converter UserProfile nulo ou preenchido para campos estritos
     ✓ accountDataToSavePayload deve discriminar displayName e PRESERVAR todos os campos PF e PJ
     ✓ deve detectar divergências e concorrência na migração de storage
     [... demais testes unitários aprovados ...]

Test Files  1 passed (1)
     Tests  22 passed (22)
```

---

## 2. SUÍTE BACKEND NATIVO (RUST CARGO TEST)

A suíte nativa em `src-tauri/src/modules/identity/` executa testes unitários nos models e services:

```text
running 10 tests
test modules::identity::models::tests::test_completeness_scores_reach_exact_100 ... ok
test modules::identity::models::tests::test_cnpj_alphanumeric_validation ... ok
test modules::identity::models::tests::test_cnpj_numeric_validation ... ok
test modules::identity::models::tests::test_cpf_validation ... ok
test modules::identity::models::tests::test_date_validation_leap_year_and_future ... ok
test modules::identity::service::tests::test_normalize_username_canonical ... ok
test modules::identity::service::tests::test_save_and_get_profile ... ok
test modules::identity::service::tests::test_optimistic_concurrency_lock ... ok
test modules::identity::service::tests::test_preserve_inactive_fields_on_person_type_switch ... ok
test modules::identity::service::tests::test_social_url_validation_security ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; finished in 18.92s
```
