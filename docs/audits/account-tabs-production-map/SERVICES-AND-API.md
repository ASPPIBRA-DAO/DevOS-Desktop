# 05 — Inventário de Serviços, APIs, Hooks e Integrações

## 1. Visão Geral das Camadas de Serviço

A seção Central de Identidade Digital opera sobre três camadas de abstração de dados:
1. **Camada de Estado e Store Reativo:** `useAccountFacade` em [src/sections/account/use-account.ts](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/sections/account/use-account.ts).
2. **Ponte de Comunicação IPC Nativa:** `IdentityBridge` em [src/platform/tauri/identity/identity-bridge.ts](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/platform/tauri/identity/identity-bridge.ts).
3. **Serviço de Autenticação e Sessão:** `IdentitySessionService` em [src/modules/authentication/application/identity-session.service.ts](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/modules/authentication/application/identity-session.service.ts).

---

## 2. Matriz Exaustiva de Operações e Integrações

| Nome do Serviço | Arquivo | Método | Origem | Destino | Dados Enviados | Dados Recebidos | Autenticação | Validação | Persistência | Tratamento de Erros | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **IdentityBridge.getUserProfile** | `src/platform/tauri/identity/identity-bridge.ts:17` | `getUserProfile` | `useAccountFacade (fetchAndSyncProfile)` | Rust IPC `get_user_profile` | Vazio (`{}`) | `UserProfile \| null` | Sessão ativa do cofre (`VaultSession`) | Rust (deserialização e decifração de envelope) | SQLite (`user_profiles`) | Fail-closed com `StorageError::VaultLocked` | **REAL E CONECTADO** |
| **IdentityBridge.saveUserProfile** | `src/platform/tauri/identity/identity-bridge.ts:27` | `saveUserProfile` | `useAccountFacade (updateProfile)` | Rust IPC `save_user_profile` | `SaveUserProfilePayload` | `UserProfile` | Sessão ativa do cofre (`VaultSession`) | Zod no frontend + Rust Módulo 11 (CPF/CNPJ), data e URLs | SQLite (`user_profiles` envelope AES-GCM) | Rollback em caso de erro de sessão / lock | **REAL E CONECTADO** |
| **IdentityBridge.importLegacyProfile** | `src/platform/tauri/identity/identity-bridge.ts:37` | `importLegacyProfile` | `useAccountFacade (fetchAndSyncProfile)` | Rust IPC `import_legacy_profile` | String JSON (sanitizada de localStorage) | `UserProfile` | Sessão ativa do cofre (`VaultSession`) | Verificação estrita de integridade de username e campos | SQLite (`user_profiles`) | Mantém legado intacto em caso de divergência | **REAL E CONECTADO** |
| **AccountSocialsView (handleSave)** | `src/sections/account/view/account-socials-view.tsx:28-34` | `handleSave` | `AccountSocials (onSubmit)` | `useAccountFacade.updateProfile` -> Rust IPC `save_user_profile` | `socialLinks: { facebook, instagram, linkedin, twitter }` | `UserProfile` atualizado | Sessão ativa do cofre (`VaultSession`) | Frontend: `normalizeSocialLinks` (HTTPS, allowlist); Backend: `sanitize_social_url` | SQLite (`user_profiles` dentro do envelope AES-GCM) | Rollback em caso de erro; toast de erro na UI | **REAL E CONECTADO** |
| **IdentitySessionService.changePassword** | `src/modules/authentication/application/identity-session.service.ts:11` | `changePassword` | `AccountChangePassword (onSubmit)` | Endpoint Institucional / Auth Server | `ChangePasswordRequest (currentPassword, newPassword)` | `Promise<void>` | Token de sessão do usuário | Validação NIST no Zod (frontend) | Servidor Central / Auth Backend | Lança erro explícito de serviço não conectado | **CONTRATO DEFINIDO / DESCONECTADO (PÁGINA E RUST)** |
| **IdentitySessionService.forgotPassword** | `src/modules/authentication/application/identity-session.service.ts:18` | `forgotPassword` | Views de autenticação | Recuperação de senha | `{ email: string }` | `boolean` | Nenhuma | Checagem de e-mail não vazio | Não persistido | Retorna `false` se inválido | **MOCK / SIMULADO** |
| **IdentitySessionService.resetPassword** | `src/modules/authentication/application/identity-session.service.ts:24` | `resetPassword` | Views de autenticação | Redefinição de senha | `{ token, email, password }` | `boolean` | Token temporário | Validação de presença de campos | Não persistido | Retorna `false` se inválido | **MOCK / SIMULADO** |
| **AccountNotifications.onSubmit** | `src/sections/account/account-notifications.tsx:50` | `onSubmit` interno | `AccountNotifications` | Memória / Nenhum | Preferências booleanas de canais e eventos | N/A | Nenhuma | Nenhuma | **NENHUMA** (Nem local nem backend) | Não trata erros | **MOCK TOTAL** |
| **AccountTwoFA (TOTP)** | `src/sections/account/account-2fa.tsx:58` | `handleVerifyTotp` | `AccountTwoFA` | Memória / Nenhum | Código numérico de 6 dígitos | N/A | Nenhuma | Apenas checa se `length === 6` | **NENHUMA** | Toast genérico | **MOCK TOTAL (RISCO P0)** |
| **AccountTwoFA (Provedores)** | `src/sections/account/account-2fa.tsx:93` | `handleSaveProvider` | `AccountTwoFA` | `useAccountFacade (updateProfile)` | `linkedProviders` atualizado | `void` | Sessão do cofre | Checagem básica de string (`0x`, `@`) | SQLite (`user_profiles`) | Captura erro do store | **PARCIAL** (Grava no DTO, mas sem prova criptográfica) |

---

## 3. Detalhamento do Store Reativo: `useAccountFacade`

* **Padrão de Concorrência:** Adota `useSyncExternalStore` nativo do React 19 para eliminar tearing e inconsistências visuais de renderização.
* **Isolamento de Sessão:** Utiliza `currentSessionGeneration` incremental. Operações assíncronas em andamento (`inFlightFetch`, `updateProfile`, `resolveMigrationConflict`) descartam seus resultados caso a sessão do usuário seja encerrada ou alterada antes da resolução da promessa.
* **Deduplicação de Requisições:** Mapeia `inFlightFetch` atrelado à geração da sessão, prevenindo chamadas concorrentes redundantes ao IPC nativo do Tauri.
* **Leitura Independente Pós-Gravação:** Toda gravação de perfil ou resolução de conflito de migração exige uma leitura independente de confirmação (`IdentityBridge.getUserProfile()`), checando se `persisted.revision > previous.revision` antes de notificar os componentes consumidores.
* **Preservação de Dados de Redes Sociais:** Conforme comprovado em `use-account.ts:391`, `userProfileToAccountData` preserva `socialLinks: profile.socialLinks ?? current?.socialLinks`, garantindo sincronização sem perda de dados.
