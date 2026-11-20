# MATRIZ DE PRONTIDÃO PARA PRODUÇÃO — ABA 1: PERFIL GERAL
**Projeto:** ASPPIBRA DAO — DevOS Desktop  
**Data:** 2026-11-18  

---

## 1. PARECER TÉCNICO DE PRONTIDÃO

| Dimensão Avaliada | Nota (0 a 10) | Veredito |
|---|:---:|---|
| **Segurança e Criptografia** | 9.5 | Aprovado (AES-256-GCM, Nonce seguro, fail-closed). |
| **Qualidade da Validação** | 9.5 | Aprovado (CPF, CNPJ 2026, Nascimento real, Sanitização RFC). |
| **Persistência e Concorrência** | 9.5 | Aprovado (Transacional em SQLite, bloqueio otimista de revisão). |
| **Gerenciamento de Estado** | 9.0 | Aprovado (useSyncExternalStore, isolamento de re-render). |
| **Privacidade e LGPD** | 9.5 | Aprovado (Allowlist rígida para perfil público). |
| **Manipulação de Mídia / Upload** | 4.0 | **Pendente de Refatoração** (Uso de blob URL volátil). |
| **NOTA CONSOLIDADA** | **8.5 / 10** | **Pronta para Produção (Dados Civis) com Pendência em Mídia** |

---

## 2. AÇÕES RECOMENDADAS ANTES DO LANÇAMENTO PÚBLICO

1. **Implementar Pipeline Nativo de Mídia:** Criar comando Tauri para salvar fotografias e capas de perfil como arquivos locais ou BLOBs permanentes no SQLite, eliminando o uso de `URL.createObjectURL`.
2. **Adicionar Componente de Avatar no Próprio `AccountGeneral`:** Facilitar o upload de foto diretamente dentro da tela de Perfil Geral, sem depender exclusivamente da tela `/user/profile`.
