# FLUXO DE BOOTSTRAP E AUTENTICAÇÃO
## Máquina de Estados do Vault — Comportamento Completo

**Data:** 05/11/2026 | **Auditoria:** ORDEM 6 — Read-only

---

## 1. ESTADOS DO BOOTSTRAP

**Enum `BootstrapState`** (`app/bootstrap/app-bootstrap-provider.tsx`):

```typescript
type BootstrapState =
  | 'INITIALIZING'      // Verificando o vault (splash ativo)
  | 'READY_UNLOCKED'    // Vault desbloqueado → app acessível
  | 'READY_LOCKED'      // Vault bloqueado → tela de login
  | 'UNINITIALIZED'     // Vault não criado → tela de setup
  | 'WEB_PREVIEW'       // Sem Tauri → modo demonstração web
  | 'TIMEOUT_WARNING'   // IPC demorou demais → aviso ao usuário
  | 'FATAL_ERROR'       // Falha crítica do vault → tela de erro
```

---

## 2. DIAGRAMA DA MÁQUINA DE ESTADOS

```
                        ┌───────────────┐
                        │  INITIALIZING │ ← Splash Screen
                        └───────┬───────┘
                                │ VaultBridge.getVaultStatus()
              ┌─────────────────┼──────────────────────┐
              │                 │                      │
       Timeout                Falha                  Sucesso
              │                 │                      │
       ┌──────▼──────┐  ┌──────▼──────┐              │
       │   TIMEOUT   │  │  FATAL_ERROR│       ┌───────┴────────────────┐
       │   WARNING   │  │             │       │                        │
       └──────┬──────┘  └──────┬──────┘  is_initialized           !isTauri()
              │                │             = false                    │
           retry            retry      ┌─────▼──────┐         ┌───────▼──────┐
              └────────────────┘       │UNINITIALIZED│         │  WEB_PREVIEW │
                                       └─────┬───────┘         └──────────────┘
                                             │ signUp()
                                             │ initMasterPassword()
                                             │
                                     ┌───────▼───────┐
                                     │  READY_LOCKED  │ ← is_initialized = true
                                     └───────┬────────┘   is_unlocked = false
                                             │ signInWithPassword()
                                             │ unlock_vault
                                             │
                                     ┌───────▼────────┐
                                     │ READY_UNLOCKED  │ ← App acessível
                                     └───────┬────────┘
                                             │ lock()
                                             └──→ READY_LOCKED
```

---

## 3. COMPORTAMENTO POR CENÁRIO

### Cenário A: Primeiro acesso (vault não existe)
1. Tauri inicia → `lib.rs` inicializa `devos_vault.sqlite` vazio
2. Bootstrap chama `VaultBridge.getVaultStatus()`
3. Status: `{ is_initialized: false, is_unlocked: false }`
4. Estado: `UNINITIALIZED`
5. Renderiza: `AuthCenteredLayout > JwtSignUpView (isInitVault=true)`
6. Usuário cria senha mestre (≥12 chars)
7. `signUp()` → `VaultBridge.initMasterPassword(password)` → `VaultBridge.unlock(password)`
8. Estado: `READY_UNLOCKED`
9. App renderiza: rotas da edição ativa

### Cenário B: Uso diário (vault inicializado, bloqueado)
1. Tauri inicia → `devos_vault.sqlite` já existe
2. Bootstrap: `{ is_initialized: true, is_unlocked: false }`
3. Estado: `READY_LOCKED`
4. Renderiza: `AuthCenteredLayout > JwtSignInView`
5. Usuário insere senha
6. `signInWithPassword()` → `VaultBridge.unlock(password)`
7. **[GAP]** Nenhum JWT é obtido da API ASPPIBRA
8. Estado: `READY_UNLOCKED`

### Cenário C: Sessão anterior desbloqueada (reload)
1. Tauri reinicia → vault pode estar desbloqueado em memória?
2. **Verificar:** O vault persiste o estado de unlock entre reinicializações?
3. Provável: após reiniciar o processo, o vault volta ao estado `READY_LOCKED`
4. Bootstrap: `{ is_initialized: true, is_unlocked: false }` → `READY_LOCKED`

### Cenário D: Sem ambiente Tauri (browser direto)
1. `isTauriDesktop()` retorna `false`
2. Estado: `WEB_PREVIEW`
3. App renderiza com banner de alerta + dados fallback
4. `signInWithPassword()`: valida apenas e-mail não-vazio → retorna `true` sem verificar
5. Funcionalidades nativas não disponíveis

### Cenário E: Falha no IPC (timeout)
1. Bootstrap: `VaultBridge.getVaultStatus()` demora mais que `timeoutMs`
2. Estado: `TIMEOUT_WARNING`
3. Exibe card com CircularProgress + botão "Tentar Novamente"
4. Botão chama `runBootstrap()` → volta para `INITIALIZING`

### Cenário F: Falha crítica do vault
1. Bootstrap: `VaultBridge.getVaultStatus()` lança exceção
2. `resolveVaultState()` → `hasValidVaultFlags()` retorna `false`
3. Estado: `FATAL_ERROR`
4. Exibe card vermelho com mensagem de erro + botão "Tentar Novamente"

---

## 4. GAP CRÍTICO — AUSÊNCIA DE JWT

```
Fluxo atual (desktop):
  unlock_vault(password) → { success: true }
  → estado READY_UNLOCKED
  → SEM JWT na API ASPPIBRA

Fluxo necessário para o Holder Beta:
  unlock_vault(password) → { success: true }
  → POST api.asppibra.com/auth/desktop-session
      { vault_signature, device_id, ... }
  → Receber JWT { role: "HOLDER", holder_id, ... }
  → Armazenar JWT em memória
  → estado READY_UNLOCKED
  → Hooks SWR passam JWT no header Authorization
```

**Impacto:** Sem o JWT, `LedgerView`, `CitizenLedgerView` e `useGetCitizens` retornarão erro 401 ao tentar carregar dados.

---

## 5. PROTEÇÃO DE ROTAS

**Estado atual:** NÃO há proteção de rotas além do bootstrap.

O `AppRouter` só renderiza as rotas da edição quando `state === 'READY_UNLOCKED' || state === 'WEB_PREVIEW'`. Não há verificação adicional de:
- Role do usuário (HOLDER, FOUNDER)
- Credencial válida
- Expiração de sessão
- Permissões por rota

**Consequência:** Qualquer usuário que desbloqueie o vault tem acesso a todas as rotas da edição, sem distinção de perfil.

---

*Documento gerado por ORDEM 6 — Auditoria Forense. Read-only.*

