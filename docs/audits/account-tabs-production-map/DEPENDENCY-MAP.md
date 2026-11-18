# 04 — Árvore de Dependências e Diagramas Arquiteturais

## 1. Diagrama Arquitetural Geral das 5 Abas

```mermaid
flowchart TD
    subgraph Roteador [AppRouter & Edições]
        EdNode["edition.node.ts"]
        EdCockpit["edition.cockpit.ts"]
    end

    subgraph LayoutGlobal [DevOS Layout]
        DevOSLayout["DevOSLayout (Sidebar, Header, Theme)"]
    end

    subgraph LayoutConta [Account Layout]
        AccountLayout["AccountLayout (Breadcrumbs & MUI Tabs)"]
    end

    EdNode --> DevOSLayout
    EdCockpit --> DevOSLayout
    DevOSLayout --> AccountLayout

    subgraph Abas [5 Abas de Identidade Digital]
        Tab1["Aba 1: Perfil Geral (/user/account)"]
        Tab2["Aba 2: Notificações (/user/account/notifications)"]
        Tab3["Aba 3: Redes Sociais (/user/account/socials)"]
        Tab4["Aba 4: Segurança (/user/account/change-password)"]
        Tab5["Aba 5: Autenticador 2FA (/user/account/2fa)"]
    end

    AccountLayout --> Tab1
    AccountLayout --> Tab2
    AccountLayout --> Tab3
    AccountLayout --> Tab4
    AccountLayout --> Tab5

    subgraph CamadaDados [Estado & Comunicação]
        Store["Store Reativo: useAccountFacade"]
        Bridge["IdentityBridge (Tauri IPC)"]
        AuthService["IdentitySessionService"]
    end

    Tab1 --> Store
    Tab3 --> Store
    Tab5 --> Store
    Store --> Bridge
    Tab4 -.-> AuthService

    subgraph BackendNativo [Tauri Core & SQLite]
        IpcCmds["identity_commands.rs (Rust)"]
        Vault["VaultSession & LocalDatabase"]
        Sqlite["devos_vault.sqlite (user_profiles / AES-GCM)"]
    end

    Bridge --> IpcCmds
    IpcCmds --> Vault
    Vault --> Sqlite
```

---

## 2. Diagramas Individuais por Aba

### 2.1 Aba 1 — Perfil Geral / Identidade Civil
```mermaid
sequenceDiagram
    autonumber
    actor User as Usuário
    participant AG as AccountGeneral (React)
    participant Store as useAccountFacade (Store)
    participant Bridge as IdentityBridge (IPC)
    participant Rust as identity_commands (Rust)
    participant DB as SQLite WAL (Cofre Cifrado)

    User->>AG: Acessa rota /user/account
    AG->>Store: Inscreve useAccountFacade()
    Store->>Bridge: IdentityBridge.getUserProfile()
    Bridge->>Rust: tauri::invoke('get_user_profile')
    Rust->>DB: SELECT encrypted_envelope FROM user_profiles
    DB-->>Rust: Envelope Cifrado (AES-256-GCM)
    Rust-->>Bridge: UserProfileDto (Decifrado com Chave do Cofre)
    Bridge-->>Store: UserProfile
    Store-->>AG: user (Popula formulário RHF + Completeness Score)

    User->>AG: Edita dados e clica "Salvar Alterações"
    AG->>Store: updateProfile(formData)
    Store->>Bridge: IdentityBridge.saveUserProfile(payload)
    Bridge->>Rust: tauri::invoke('save_user_profile', payload)
    Rust->>DB: INSERT/UPDATE user_profiles (Novo Envelope Cifrado)
    DB-->>Rust: OK (Revisão incrementada)
    Rust-->>Bridge: UserProfileDto atualizado
    Bridge-->>Store: UserProfile
    Store-->>AG: Sucesso (toast + form sincronizado)
```

### 2.2 Aba 2 — Notificações
```mermaid
flowchart LR
    Page[AccountNotificationsPage] --> View[AccountNotificationsView]
    View --> Layout[AccountLayout]
    View --> Component[AccountNotifications]
    Component --> RHF[useForm (Memória Local)]
    Component --> Toast[toast.success (Sem Persistência)]
```

### 2.3 Aba 3 — Redes Sociais
```mermaid
sequenceDiagram
    autonumber
    actor User as Usuário
    participant ASV as AccountSocialsView (React)
    participant AS as AccountSocials (React Form)
    participant Store as useAccountFacade (Store)
    participant Bridge as IdentityBridge (IPC)
    participant Rust as IdentityService (Rust)
    participant DB as SQLite (user_profiles)

    User->>ASV: Acessa rota /user/account/socials
    ASV->>Store: useAccountFacade()
    Store-->>ASV: user.socialLinks
    ASV->>AS: renderiza links com allowlist e HTTPS
    User->>AS: Preenche URLs e clica "Salvar Redes"
    AS->>AS: normalizeSocialLinks() (Validação Frontend)
    AS->>ASV: onSave(values)
    ASV->>Store: updateProfile({ socialLinks })
    Store->>Bridge: IdentityBridge.saveUserProfile(payload)
    Bridge->>Rust: tauri::invoke('save_user_profile', payload)
    Rust->>Rust: sanitize_social_url() (Validação Backend)
    Rust->>DB: Cifra em AES-256-GCM e grava em user_profiles
    DB-->>Rust: OK (Revisão incrementada)
    Rust-->>Bridge: UserProfileDto com socialLinks
    Bridge-->>Store: Atualiza store e notifica componentes
    Store-->>AS: Sucesso (toast.success + form limpo)
```

### 2.4 Aba 4 — Segurança
```mermaid
flowchart TD
    Page[AccountChangePasswordPage] --> View[AccountChangePasswordView]
    View --> Layout[AccountLayout]
    View --> Comp[AccountChangePassword]
    Comp --> Zod[ChangePasswordSchema - NIST SP 800-63B]
    Comp --> Field1[PasswordField (Senha Atual)]
    Comp --> Field2[PasswordField (Nova Senha)]
    Comp --> Field3[PasswordField (Confirmação)]
    Comp --> CardBio[Card Biometria / onConfigureBiometrics]
    Comp --> CardSess[Card Dispositivos / onRevokeSession]
    Comp --> AuthCall[onChangePassword Callback - Desconectado]
```

### 2.5 Aba 5 — Autenticador 2FA
```mermaid
flowchart TD
    Page[AccountTwoFAPage] --> View[AccountTwoFAView]
    View --> Layout[AccountLayout]
    View --> Comp[AccountTwoFA]
    Comp --> Store[useAccountFacade]
    Comp --> SwitchStrict[Modo Restrito (Strict Auth)]
    Comp --> SwitchTotp[TOTP 2FA (QR Code Estático & Chave Fixa)]
    Comp --> Modal[Modal Vincular Provedor]
    Modal --> Wallet[Carteira Web3 (Sem Prova EIP-712)]
    Modal --> Google[Google SSO (Sem OAuth)]
    Modal --> Github[GitHub Operador (Sem OAuth)]
    SwitchStrict --> UpdateStore[updateProfile linkedProviders]
```

---

## 3. Diagrama de Comunicação Frontend / Backend

```mermaid
sequenceDiagram
    autonumber
    participant React as Frontend React 19
    participant Invoke as invokeNative (Tauri Core)
    participant RustCmds as identity_commands.rs
    participant RustService as IdentityService
    participant Crypto as VaultCrypto (Argon2id + AES-GCM)
    participant SQLite as LocalDatabase (SQLite WAL)

    Note over React,SQLite: Fluxo Completo de Persistência Criptográfica
    React->>Invoke: invokeNative('save_user_profile', { profile })
    Invoke->>RustCmds: save_user_profile(db, session, profile)
    RustCmds->>RustService: IdentityService::save_profile(&db, &session, profile)
    RustService->>RustService: Valida CPF, CNPJ, Data, Redes Sociais
    RustService->>Crypto: Cifra payload com chave da VaultSession ativa
    Crypto-->>RustService: EncryptedEnvelope { nonce, ciphertext }
    RustService->>SQLite: IdentityRepository::save_profile_record(&mut conn, envelope)
    SQLite-->>RustService: next_revision (commit transacional)
    RustService-->>RustCmds: UserProfileDto
    RustCmds-->>Invoke: Ok(UserProfileDto)
    Invoke-->>React: Retorno tipado no frontend
```

---

## 4. Diagrama de Persistência e Tabelas do Banco de Dados

```mermaid
erDiagram
    VAULT_HEADER {
        int id PK "CHECK (id = 1)"
        int version "Versão do esquema"
        string canary_envelope "Envelope canário para validação da senha"
        string created_at "Data de criação"
    }

    USER_PROFILES {
        int id PK "CHECK (id = 1)"
        string encrypted_envelope "Envelope criptográfico AES-256-GCM"
        int payload_version "Versão do payload (1)"
        int revision "Revisão otimista incremental"
        string created_at "Data de criação"
        string updated_at "Data de atualização"
    }

    VAULT_SECRETS {
        string vault_id PK "Identificador único do segredo"
        string target "Destino ou finalidade do segredo"
        string envelope "Envelope AES-256-GCM do segredo"
        string created_at "Data de criação"
    }

    WALLETS {
        int id PK "Auto-incremental"
        string address "Endereço público da carteira"
        string network "Rede blockchain"
        string derivation_path "Caminho de derivação BIP-44"
        string vault_id FK "Chave estrangeira para vault_secrets"
    }

    SCHEMA_MIGRATIONS {
        int version PK "Versão da migração aplicada"
        string applied_at "Data de aplicação"
    }

    VAULT_HEADER ||--o{ USER_PROFILES : "Protegidos pela mesma Master Key"
    VAULT_SECRETS ||--o{ WALLETS : "Custódia da chave privada"
```
