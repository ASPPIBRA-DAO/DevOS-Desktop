# SERVIÇOS, CONTRATOS E COMUNICAÇÃO TAURI IPC — ABA 1: PERFIL GERAL
**Projeto:** ASPPIBRA DAO — DevOS Desktop  
**Data:** 2026-11-18  

---

## 1. CONTRATOS DE DADOS TYPESCRIPT (`identity-contracts.ts`)

A camada `src/platform/tauri/contracts/identity-contracts.ts` define a interface estrita trocada via IPC entre React e Rust:

```typescript
export interface UserProfile {
  personType: 'PF' | 'PJ';
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  cpf: string;
  rg: string;
  rgIssuer: string;
  cnh: string;
  cnhCategory: string;
  motherName: string;
  fatherName: string;
  birthDate: string;
  nationality: string;
  maritalStatus: string;
  companyName: string;
  cnpj: string;
  legalRepresentative: string;
  legalRepresentativeCpf: string;
  email: string;
  phoneNumber: string;
  country: string;
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
  complement: string;
  occupation: string;
  company: string;
  website: string;
  about: string;
  isPublic: boolean;
  completenessScore: number;
  revision: number;
  updatedAt: string;
  photoUrl?: string | null;
  coverUrl?: string | null;
  linkedProviders?: string[];
  socialLinks?: SocialLinks | null;
}

export interface SaveUserProfilePayload {
  personType?: 'PF' | 'PJ';
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  cpf?: string;
  rg?: string;
  rgIssuer?: string;
  cnh?: string;
  cnhCategory?: string;
  motherName?: string;
  fatherName?: string;
  birthDate?: string;
  nationality?: string;
  maritalStatus?: string;
  companyName?: string;
  cnpj?: string;
  legalRepresentative?: string;
  legalRepresentativeCpf?: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  zipCode?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  occupation?: string;
  company?: string;
  website?: string;
  about?: string;
  isPublic?: boolean;
  expectedRevision?: number;
  photoUrl?: string | null;
  coverUrl?: string | null;
  socialLinks?: SocialLinks | null;
}
```

---

## 2. A CLASSE `IdentityBridge` (`identity-bridge.ts`)

A classe `IdentityBridge` atua como Gateway estático e isolado para as chamadas nativas:

| Método | Comando Tauri Invocado | Finalidade |
|---|---|---|
| `getUserProfile()` | `get_user_profile` | Recupera e decifra o perfil civil completo do cofre SQLite ativo. |
| `saveUserProfile(payload)` | `save_user_profile` | Sanitiza, valida concorrência, cifra com AES-GCM e grava atomicamente. |
| `importLegacyProfile(data)` | `import_legacy_profile` | Importa com segurança dados legados oriundos do storage anterior. |
| `checkStatus()` | `get_identity_status` | Verifica se o cofre está desbloqueado e se o perfil já foi inicializado. |

---

## 3. REGISTRO DE COMANDOS NO TAURI (`lib.rs`)

Todos os comandos IPC da identidade estão compilados e registrados no dispatcher oficial do Tauri em `src-tauri/src/lib.rs`:

```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        // Comandos de Identidade e Cofre
        commands::identity_commands::get_user_profile,
        commands::identity_commands::save_user_profile,
        commands::identity_commands::import_legacy_profile,
        commands::identity_commands::get_identity_status,
        // [...]
    ])
```
