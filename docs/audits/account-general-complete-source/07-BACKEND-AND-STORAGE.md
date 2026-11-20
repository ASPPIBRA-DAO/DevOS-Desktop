# BACKEND RUST, SQLITE E PERSISTÊNCIA NATIVA — ABA 1: PERFIL GERAL
**Projeto:** ASPPIBRA DAO — DevOS Desktop  
**Data:** 2026-11-18  

---

## 1. ARQUITETURA NATIVA EM RUST

O backend do DevOS Desktop é estruturado segundo os princípios de Clean Architecture e isolamento de infraestrutura em `src-tauri/src/modules/identity/`:

```text
src-tauri/src/
├── commands/
│   └── identity_commands.rs       <-- Entry points dos comandos IPC expostos ao Tauri
├── modules/
│   ├── identity/
│   │   ├── models.rs              <-- DTOs, entidades de domínio, regras e escore
│   │   ├── service.rs             <-- Lógica de negócio, sanitização, validação e projeções
│   │   ├── repository.rs          <-- Transações e persistência SQL em SQLite
│   │   └── mod.rs                 <-- Visibilidade do módulo
│   └── vault/
│       ├── encryption.rs          <-- Algoritmo AES-256-GCM e envelope de cofre
│       └── access_control.rs      <-- Gerenciamento de sessão e chave mestre em RAM
└── storage/
    ├── local_database.rs          <-- Connection pool Rusqlite em WAL mode
    └── migrations.rs              <-- Esquema relacional versionado
```

---

## 2. ESQUEMA DE TABELAS SQLITE (`devos_vault.sqlite`)

A tabela que armazena a identidade do usuário é criada pela migração canônica `migrations.rs`:

```sql
CREATE TABLE IF NOT EXISTS profile_records (
    id TEXT PRIMARY KEY,
    ciphertext BLOB NOT NULL,
    nonce BLOB NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### Análise da Tabela
1. **Chave Primária (`id`):** Identificador canônico do perfil (normalmente `'active_user_profile'`).
2. **Cifragem de Envelope (`ciphertext` e `nonce`):** O JSON contendo todos os dados civis e empresariais não é salvo em texto plano. Ele é cifrado com **AES-256-GCM** antes de chegar ao disco.
3. **Controle de Revisão Concorrente (`revision`):** Número inteiro monotônico incrementado a cada gravação. Impede condições de corrida e atualizações concorrentes que poderiam corromper dados.
4. **Trilhas Temporais (`created_at`, `updated_at`):** ISO 8601 UTC geradas pelo backend nativo.

---

## 3. VALIDAÇÃO DEFENSIVA DUPLA NO BACKEND (`service.rs`)

O backend Rust não confia nas validações do frontend React:
- **Normalização de Username:** Executa canonicalização RFC para minúsculas e caracteres alfanuméricos + sublinhados.
- **Sanitização de URLs Sociais e Website:** Utiliza o crate nativo `url::Url` para validar schemes `http`/`https`, hostnames completos e ausência de credenciais embutidas.
- **Limpeza de Memória com Zeroize:** Ao desserializar o JSON de perfil em memória antes de criptografar, o buffer é encapsulado em `Zeroizing<Vec<u8>>` do crate `zeroize`, garantindo que os dados em texto claro sejam sobrescritos com zeros na RAM assim que o objeto é liberado do escopo.
