# CLASSIFICAÇÃO FUNCIONAL — ABA 1: PERFIL GERAL
**Projeto:** ASPPIBRA DAO — DevOS Desktop  
**Data:** 2026-11-18  

---

## 1. MATRIZ DE STATUS FUNCIONAL

| Operação / Recurso | Classificação | Evidência Técnica |
|---|:---:|---|
| **Carga de Perfil Pessoal (PF)** | **IMPLEMENTADA E CONECTADA** | Lê do cofre SQLite com AES-256-GCM via `get_user_profile`. |
| **Carga de Perfil Empresarial (PJ)** | **IMPLEMENTADA E CONECTADA** | Mapeamento completo e restauração de campos PJ. |
| **Alternância Dinâmica PF <-> PJ** | **IMPLEMENTADA E CONECTADA** | Renderização reativa e preservação de campos inativos. |
| **Validação Documental de CPF** | **IMPLEMENTADA E CONECTADA** | Dígitos verificadores e rejeição de sequências (React e Rust). |
| **Validação Documental de CNPJ** | **IMPLEMENTADA E CONECTADA** | Suporte a CNPJ numérico e alfanumérico RFB 2026. |
| **Validação de Data de Nascimento** | **IMPLEMENTADA E CONECTADA** | Calendário gregoriano real com bloqueio de datas futuras. |
| **Validação de CEP e Telefone** | **IMPLEMENTADA E CONECTADA** | Máscaras estritas e validação de formato. |
| **Cálculo de Completude (100 pts)** | **IMPLEMENTADA E CONECTADA** | 100 pontos exatos para PF e PJ com atualização reativa. |
| **Persistência Criptografada** | **IMPLEMENTADA E CONECTADA** | Cifragem nativa em `profile_records` no `devos_vault.sqlite`. |
| **Controle de Concorrência** | **IMPLEMENTADA E CONECTADA** | Bloqueio otimista via `revision` em Rust. |
| **Migração de Dados Legados** | **IMPLEMENTADA E CONECTADA** | Detecção de divergências com suporte a merge ou keep_vault. |
| **Controle de Perfil Público** | **IMPLEMENTADA E CONECTADA** | Switch na UI e projeção com allowlist estrita no backend. |
| **Upload de Foto e Capa** | **MOCK / SIMULAÇÃO** | Utiliza `URL.createObjectURL` volátil em `user-profile-view.tsx`. Não possui pipeline nativo de mídia para disco/IPFS. |
