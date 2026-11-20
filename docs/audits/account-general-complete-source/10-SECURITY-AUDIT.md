# AUDITORIA DE SEGURANÇA (APPSEC) E RISCOS — ABA 1: PERFIL GERAL
**Projeto:** ASPPIBRA DAO — DevOS Desktop  
**Data:** 2026-11-18  

---

## 1. MATRIZ DE AVALIAÇÃO DE SEGURANÇA

| Vulnerabilidade / Ponto Auditado | Severidade | Status Atual | Impacto |
|---|:---:|:---:|---|
| **Persistência de Blob URL Volátil** | **Alta** | Identificado | Fotos e capas deixam de carregar após fechar a janela do app. |
| **Exposição Acidental de PII em Projeção Pública** | **Baixa** | Mitigado | Backend utiliza allowlist estrita em `PublicUserProfileDto`. CPF e endereço nunca vazam. |
| **Bypass de Sessão com Cofre Bloqueado** | **Inexistente** | Mitigado | Tanto a UI React quanto os comandos Rust barram execução com cofre trancado (Fail-Closed). |
| **Condição de Corrida (Lost Update)** | **Inexistente** | Mitigado | Controle de versão monotônica com `expectedRevision` e bloqueio otimista no SQLite. |
| **Injeção de Código / XSS via Campos Textuais** | **Inexistente** | Mitigado | React executa escape automático e o Zod aplica `trim()` e limites rígidos de caracteres. |
| **Exposição de Credenciais em Memória RAM** | **Baixa** | Mitigado | `Zeroizing` utilizado no Rust para limpeza de buffers de serialização. |

---

## 2. DETALHAMENTO DOS ACHADOS

### Achado 1: URLs de Mídia Voláteis (`ProfileCover.tsx`)
- **Arquivo:** `src/sections/user/profile-cover.tsx` (linhas 52 e 61).
- **Evidência:** `const url = URL.createObjectURL(file); onUpdateAvatar?.(url);`.
- **Risco:** Perda de dados visuais ao persistir strings de lifecycle temporário.
- **Recomendação:** Implementar pipeline nativo de persistência de mídia via Tauri IPC.

### Achado 2: Proteção de Dados Pessoais (LGPD)
- **Implementação Positiva:** A projeção pública foi implementada com princípio de menor privilégio. Mesmo com `isPublic: true`, o backend nunca expõe CPF, RG, filiação ou endereço completo.
