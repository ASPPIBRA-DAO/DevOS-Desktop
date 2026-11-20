# ADR-001: Arquitetura de Custódia Criptográfica Unificada KEK/DEK

**Status:** APROVADO (Normativo Consolidado)  
**Data:** 2026-11-20  
**Autor:** Engenharia DevOS / ASPPIBRA-DAO  
**Subsistemas Afetados:** `modules/vault`, `modules/wallets`, `modules/identity`, `modules/ssi`, `storage`, `commands`  
**Prioridade:** P0 — Segurança, Integridade da Custódia e Consistência Transacional  

---

## 1. Contexto e Motivação

O DevOS Desktop possui quatro subsistemas com domínios de negócio especializados:
1. **`Vault`**: Autoridade única de custódia criptográfica, gestão de sessão e proteção de segredos.
2. **`Wallets`**: Geração BIP-39, derivação hierárquica BIP-32/BIP-44 e endereços EVM (EIP-55).
3. **`Identity`**: Cadastro civil e societário (PF/PJ), projeção pública e perfil do titular.
4. **`SSI`**: Identidade auto-soberana, DID (`did:key` Ed25519) e credenciais W3C (VC/VP).

### 1.1 Diagnóstico das Vulnerabilidades Anteriores (V1)
- **KDF Repetida em Tempo de Execução:** O modelo anterior derivava uma chave via Argon2id a cada leitura/escrita, impondo latência e alocação de memória proibitivas (64 MiB RAM, 3 iterações por registro).
- **Trânsito Recorrente de Senha no IPC:** O comando `confirm_and_save_wallets` exigia `request.master_password` via IPC em vez de operar sob uma sessão criptográfica segura.
- **Envelope Único Ambíguo:** O tipo `EncryptedEnvelope` era utilizado indistintamente para envelopar a senha e os registros de dados, inflando os dados com metadados e salts de KDF redundantes.
- **Quebra de Integridade na Confirmação:** O backend aceitava a lista `previews` do frontend sem recalcular e validar os endereços no Rust a partir da mnemônica.
- **Persistência Não Atômica:** Gravações em `vault_secrets` e `wallets` ocorriam em transações SQLite separadas, arriscando segredos órfãos.

---

## 2. Decisão Arquitetural: Hierarquia KEK / DEK e Subchaves HKDF

Fica estabelecido o modelo normativo de **Custódia Unificada KEK (Key Encryption Key) / DEK (Data Encryption Key)** com subchaves por domínio via **HKDF-SHA256 (RFC 5869)** e **AAD Canônico Binário**.

```text
========================================================================================
                      HIERARQUIA CRIPTOGRÁFICA NORMATIVA
========================================================================================

                                  Senha Mestre
                                       │
                                       ▼
                     Argon2id (Perfil Homologado DevOS)
                                       │
                                       ▼
                                 KEK (256 bits)
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
          [Inicialização]                                [Desbloqueio]
    Gera DEK Aleatória (256 bits)                  Decifra Wrapped DEK (Header)
                │                                             │
                ▼                                             ▼
     Wrap AES-256-GCM + AAD                         DEK Pura (256 bits)
                │                                             │
                ▼                                             ▼
     vault_header_v2 (SQLite)                     Instalada na VaultSession
                                                  (Zeroizing<[u8; 32]>)
                                                              │
                                                              ▼
                                                   HKDF-SHA256 (Subchaves)
                                                              │
         ┌──────────────────────────────┬─────────────────────┴──────────────┐
         ▼                              ▼                                    ▼
    Subchave Wallets              Subchave Identity                    Subchave SSI
   (DEVOS/WALLETS/V2)            (DEVOS/IDENTITY/V2)                 (DEVOS/SSI/V2)
         │                              │                                    │
         ▼                              ▼                                    ▼
Cifra Mnemônicas BIP-39         Cifra Perfis Civis               Cifra Sementes/Chaves Ed25519
(AES-256-GCM + AAD Canônico)   (AES-256-GCM + AAD Canônico)     (AES-256-GCM + AAD Canônico)
```

### 2.1 Separação Criptográfica entre Simetria e Assinatura
- A **DEK e suas subchaves HKDF são estritamente simétricas** (AES-256-GCM).
- A DEK **nunca** é utilizada diretamente para assinar DIDs ou transações Web3.
- As chaves de assinatura assimétrica (**Ed25519** no SSI e **secp256k1** no Wallets) são geradas de forma independente, protegidas em repouso por envelopes cifrados pela subchave do respectivo domínio e operadas dentro de guards RAII isolados.
- **Isolamento de Identidade SSI:** A identidade SSI opera sob uma semente/raiz criptográfica independente protegida pelo domínio `DEVOS/SSI/V2`, prevenindo correlação indesejada entre a identidade civil e os endereços financeiros Web3.

---

## 3. Especificação Estrutural dos Envelopes Criptográficos

Para eliminar redundâncias e garantir tipagem estrita, separam-se os envelopes em duas estruturas independentes:

### 3.1 `WrappedDekEnvelope` (Proteção da DEK pela KEK)
Utilizado exclusivamente no cabeçalho do cofre (`vault_header_v2`). Armazena os metadados validados da KDF:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct WrappedDekEnvelope {
    pub version: u32,             // 2
    pub kdf_profile: String,     // "Argon2idV2Profile1"
    pub kdf_algorithm: String,   // "Argon2id"
    pub kdf_version: u32,        // 0x13
    pub kdf_salt_hex: String,    // 16 bytes hex (32 chars)
    pub memory_kib: u32,         // 65536 (64 MiB)
    pub iterations: u32,         // 3
    pub parallelism: u32,        // 1 (benchmark homologado)
    pub cipher: String,          // "AES-256-GCM"
    pub nonce_hex: String,       // 12 bytes hex (24 chars)
    pub wrapped_dek_hex: String, // 32 bytes de DEK + 16 bytes de tag GCM (96 chars hex)
}
```

### 3.2 `AeadEnvelope` (Proteção de Dados em Repouso)
Utilizado em `vault_secrets`, `user_profiles` e registros protegidos. Contém apenas os campos da cifra AEAD simétrica, sem salt ou parâmetros de KDF:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AeadEnvelope {
    pub version: u32,             // 2
    pub cipher: String,          // "AES-256-GCM"
    pub nonce_hex: String,       // 12 bytes hex (24 chars)
    pub ciphertext_hex: String,  // Payload cifrado + 16 bytes de tag GCM
}
```

---

## 4. Pré-Validação Estrita do Perfil KDF (Anti-DoS e Anti-Exaustão)

### 4.1 Validação Exata Pré-Argon2id
A verificação de integridade via AAD ocorre **após** a execução da KDF. Portanto, o hash dos parâmetros no AAD **não impede** ataques de exaustão de memória caso um banco adulterado informe parâmetros aberrantes (ex: gigabytes de memória ou valores zerados).

**Regra Normativa:** Antes de qualquer alocação de memória ou chamada ao Argon2id, o aplicativo valida os parâmetros lidos contra o perfil homologado permitido, exigindo correspondência exata de todos os campos e decodificação hexadecimal estrita:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum KdfProfile {
    Argon2idV2Profile1, // DevOS Padrão Homologado
}

impl KdfProfile {
    pub const PROFILE_NAME: &'static str = "Argon2idV2Profile1";
    pub const ALGORITHM: &'static str = "Argon2id";
    pub const VERSION: u32 = 0x13;
    pub const MEMORY_KIB: u32 = 65536; // 64 MiB
    pub const ITERATIONS: u32 = 3;
    pub const PARALLELISM: u32 = 1;
    pub const SALT_LEN: usize = 16;
    pub const NONCE_LEN: usize = 12;
    pub const WRAPPED_DEK_LEN: usize = 48; // 32 bytes chave + 16 bytes tag GCM

    pub fn validate_and_decode(env: &WrappedDekEnvelope) -> Result<([u8; 16], [u8; 12], Vec<u8>), VaultCryptoError> {
        // 1. Verificação exata de identificadores e parâmetros numéricos
        if env.kdf_profile != Self::PROFILE_NAME
            || env.kdf_algorithm != Self::ALGORITHM
            || env.kdf_version != Self::VERSION
            || env.memory_kib != Self::MEMORY_KIB
            || env.iterations != Self::ITERATIONS
            || env.parallelism != Self::PARALLELISM
            || env.cipher != "AES-256-GCM"
        {
            return Err(VaultCryptoError::CorruptedOrUnsupportedParameters);
        }

        // 2. Validação e decodificação hexadecimal do salt
        let salt_bytes = hex::decode(&env.kdf_salt_hex)
            .map_err(|_| VaultCryptoError::CorruptedOrUnsupportedParameters)?;
        if salt_bytes.len() != Self::SALT_LEN {
            return Err(VaultCryptoError::CorruptedOrUnsupportedParameters);
        }
        let mut salt = [0u8; 16];
        salt.copy_from_slice(&salt_bytes);

        // 3. Validação e decodificação hexadecimal do nonce
        let nonce_bytes = hex::decode(&env.nonce_hex)
            .map_err(|_| VaultCryptoError::CorruptedOrUnsupportedParameters)?;
        if nonce_bytes.len() != Self::NONCE_LEN {
            return Err(VaultCryptoError::CorruptedOrUnsupportedParameters);
        }
        let mut nonce = [0u8; 12];
        nonce.copy_from_slice(&nonce_bytes);

        // 4. Validação e decodificação hexadecimal do wrapped_dek
        let wrapped_dek = hex::decode(&env.wrapped_dek_hex)
            .map_err(|_| VaultCryptoError::CorruptedOrUnsupportedParameters)?;
        if wrapped_dek.len() != Self::WRAPPED_DEK_LEN {
            return Err(VaultCryptoError::CorruptedOrUnsupportedParameters);
        }

        Ok((salt, nonce, wrapped_dek))
    }
}
```

### 4.2 Evidência e Homologação de Benchmark
A RFC 9106 define como recomendação geral de primeiro nível 64 MiB, 3 iterações e paralelismo 4. O DevOS adota **paralelismo 1** como baseline homologado para assegurar comportamento determinístico e evitar contenção de threads em processadores com poucos núcleos em máquinas de usuários associados. 
- **Pendência de Homologação:** A marcação definitiva de benchmark requer a execução automatizada na suíte de testes comparando tempos de desbloqueio em paralelismo 1 vs 4, registrando o tempo médio e pico de consumo de memória antes do release de produção.

---

## 5. Codificação Binária Canônica de AAD (Anti-Ambiguity)

Fica terminantemente proibida a concatenação arbitrária de strings como AAD. O contexto autenticado utiliza serialização binária determinística com prefixo de tamanho e separação de domínio.

### 5.1 Estrutura Canônica Binária
```text
[4 bytes: MAGIC b"DEV0"]
[2 bytes: FORMAT_VERSION = 2 (u16 BE)]
[1 byte:  DOMAIN_TAG (u8)]
          0x01 = DEK_WRAP
          0x02 = WALLET_MNEMONIC
          0x03 = USER_PROFILE
          0x04 = SSI_ROOT_SECRET
          0x05 = SSI_CREDENTIAL
          0x06 = BACKUP_PAYLOAD
[Campos subsequentes codificados como: 2 bytes LEN (u16 BE) + BYTES]
```

### 5.2 Contextos de Domínio Definidos
1. **DEK Wrap (`0x01`):** `MAGIC || V2 || 0x01 || LEN(app_id) || app_id || KDF_METADATA_HASH`
   - O `KDF_METADATA_HASH` (SHA-256 dos parâmetros canônicos do Argon2id) autentica os parâmetros na verificação GCM, impedindo substituição de metadados.
2. **Mnemônica de Carteira (`0x02`):** `MAGIC || V2 || 0x02 || LEN(vault_id) || vault_id || TARGET_TAG (0x01=DAO, 0x02=CLIENT)`
   - **Isolamento de Rede:** O `network_id` **não** integra o AAD da semente raiz BIP-39. Uma mnemônica EVM é agnóstica a rede e pode derivar carteiras em múltiplas blockchains. O `network_id` reside exclusivamente nos metadados das carteiras derivadas (`wallets_v2.network_id`).
3. **Perfil Civil (`0x03`):** `MAGIC || V2 || 0x03 || PROFILE_ID (u32 BE) || LEN(vault_instance_id) || vault_instance_id`
4. **SSI Root Secret (`0x04`):** `MAGIC || V2 || 0x04 || LEN(ssi_vault_id) || ssi_vault_id`
5. **Credencial SSI (`0x05`):** `MAGIC || V2 || 0x05 || LEN(credential_id) || credential_id`
6. **Payload de Backup (`0x06`):** `MAGIC || V2 || 0x06 || BACKUP_TIMESTAMP (i64 BE)`

---

## 6. Subchaves via HKDF-SHA256 e Política de Nonces AES-GCM

### 6.1 Derivação de Subchaves HKDF (RFC 5869)
A partir da Master DEK instalada na sessão, subchaves de 256 bits são derivadas para cada domínio:
- `Salt`: 32 bytes de zeros (`[0u8; 32]`), conforme padrão RFC 5869 §2.2.
- `Info`: Identificadores canônicos de domínio:
  - `DEVOS/WALLETS/V2`
  - `DEVOS/IDENTITY/V2`
  - `DEVOS/SSI/V2`
  - `DEVOS/BACKUP/V2`

**Fronteira de Encapsulamento:** Os módulos `Wallets`, `Identity` e `SSI` **nunca recebem a DEK raiz**. Eles consomem métodos de alto nível expostos pelo `VaultService` (ex: `VaultService::encrypt_wallet_secret`, `VaultService::decrypt_profile`), que derivam e aplicam a subchave internamente.

### 6.2 Política de Nonces AES-256-GCM
1. **Tamanho Fixo:** 12 bytes (96 bits), conforme NIST SP 800-38D.
2. **Fonte de Entropia:** `rand::rngs::OsRng` através de chamada falível (`try_fill_bytes`). Se a fonte de entropia do sistema operacional falhar, a operação aborta com erro explícito sem fallback.
3. **Unicidade Estrita:** Um nonce novo é gerado para cada mensagem cifrada.
4. **Limite Operacional:** O limite de invocações sob a mesma subchave segue a recomendação NIST de no máximo $2^{32}$ cifragens.
5. **Tag de Autenticação:** 16 bytes (128 bits) em todos os envelopes.

---

## 7. Invariantes de Estado, Concorrência e Bloqueio na `VaultSession`

Arquivo: [`src-tauri/src/modules/vault/access_control.rs`](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src-tauri/src/modules/vault/access_control.rs)

### 7.1 Semântica de Operações e Bloqueio em Voo
Para resolver a condição de corrida entre a decifragem da chave e o commit no SQLite:
1. **Barreira de Admissão:** O comando `lock()` ativa imediatamente uma barreira de encerramento (`admission_closed = true`). Novas operações são rejeitadas de imediato com `AccessControlError::Locked`.
2. **Sincronização de Operações Ativas:** O cofre rastreia operações autorizadas em andamento via contador atômico / guard RAII (`VaultOperationGuard`). O método `lock()` aguarda o término das operações ativas já admitidas.
3. **Limpeza da DEK:** Ao término das operações ativas, a DEK é zerada da memória nativa (`ZeroizeOnDrop`), o estado é marcado como `unlocked = false`, o epoch é avançado e o cofre fica locked.
4. **Verificação Transacional Pré-Commit:** Toda operação de persistência valida que o epoch capturado no início da transação continua correspondendo ao epoch atual da sessão no momento do commit SQLite. Se o cofre foi bloqueado concorrentemente, o commit é abortado e a transação sofre rollback.

### 7.2 Tratamento Universal de Mutex Poison (Fail-Closed)
Todos os métodos da `VaultSession` tratam `PoisonError` restaurando o estado seguro:

```rust
impl VaultSession {
    fn advance_epoch(state: &mut SessionState) {
        if state.epoch_exhausted {
            state.unlocked = false;
            state.dek = None;
            return;
        }
        match state.epoch.checked_add(1) {
            Some(next) => state.epoch = next,
            None => {
                log::error!("[Vault Security] Epoch overflow. Bloqueio permanente.");
                state.epoch_exhausted = true;
                state.unlocked = false;
                state.dek = None;
            }
        }
    }

    fn fail_closed(state: &mut SessionState) {
        state.unlocked = false;
        state.dek = None;
        Self::advance_epoch(state);
    }

    pub fn lock(&self) {
        let mut state = match self.state.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                log::error!("[Vault Security] Mutex envenenado em lock(). Recuperando estado seguro.");
                poisoned.into_inner()
            }
        };
        Self::fail_closed(&mut state);
        self.state.clear_poison();
    }

    pub(crate) fn with_dek<F, R>(&self, f: F) -> Result<R, AccessControlError>
    where
        F: FnOnce(&[u8; 32]) -> Result<R, AccessControlError>,
    {
        let mut state = match self.state.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                log::error!("[Vault Security] Mutex envenenado em with_dek(). Aplicando fail-closed.");
                let mut state = poisoned.into_inner();
                Self::fail_closed(&mut state);
                self.state.clear_poison();
                return Err(AccessControlError::Locked);
            }
        };

        if state.epoch_exhausted || !state.unlocked {
            return Err(AccessControlError::Locked);
        }

        match state.dek.as_ref() {
            Some(dek) => f(dek.as_slice().try_into().unwrap()),
            None => Err(AccessControlError::Locked),
        }
    }
}
```

---

## 8. Módulo `Wallets`: Criação Segura, Idempotência e Persistência Atômica

### 8.1 Semântica de Identificadores e Idempotência
Distingue-se rigorosamente a finalidade de cada identificador:
- **`session_id` (256 bits CSPRNG):** Token efêmero em memória para acesso autorizado à mnemônica em criação.
- **`creation_id` (UUIDv4 - 128 bits, RFC 9562):** Identificador exclusivo da operação de criação persistida para garantir **idempotência de rede e reinicialização**.

Estrutura imutável com campos privados:
```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WalletTarget {
    Dao,
    Client,
}

pub struct StagedWalletCreation {
    creation_id: String,          // UUIDv4 único
    mnemonic: StagedMnemonic,     // Zeroize + ZeroizeOnDrop
    target: WalletTarget,         // Tipado
    account_branch: u32,
    count: u32,                   // Validado: 1..=100
    network_id: String,           // ex: "eip155:42161"
    state: CreationState,         // Pending | Reserved | Consumed
    created_at: Instant,
}
```

- **Recuperação Idempotente:** Caso o aplicativo sofra interrupção após o commit no banco mas antes da resposta ao frontend, uma chamada repetida com o mesmo `creation_id` detecta o registro na tabela `wallet_creation_operations` e retorna as carteiras já salvas, sem criar duplicatas.
- **Limpeza Oportunística:** A cada operação no `CreationSessionStore`, sessões expiradas (TTL: 5 min) ou consumidas são purgadas, sem threads de fundo.

### 8.2 Zero-Trust no Recálculo de Endereços
No comando `confirm_and_save_wallets`:
- O request recebe exclusivamente: `session_id`, `creation_id`, `client_name` e `base_label`.
- **Eliminados permanentemente:** `master_password`, `mnemonic: Option<String>` e `previews: Vec<DerivedWalletPreview>`.
- O Rust reserva a sessão com RAII guard (`CreationState::Reserved`), deriva a seed `Zeroizing<[u8; 64]>`, recalcula os endereços no intervalo `0..count` e valida o caminho BIP-44. Apenas os dados recalculados e validados pelo Rust são encaminhados ao SQLite.

---

## 9. Infraestrutura SQLite e DDL da Migração 4

### 9.1 Ativação Correta de Integridade Referencial (`PRAGMA foreign_keys`)
Conforme a documentação oficial do SQLite, executar `PRAGMA foreign_keys = ON;` dentro de uma transação ativa não produz efeito.

**Regra Normativa:** A configuração é aplicada na fábrica de conexões [`LocalDatabase::get_connection`](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src-tauri/src/storage/local_database.rs) imediatamente após abrir cada conexão e antes de qualquer início de transação:

```rust
let conn = Connection::open(&self.db_path)?;
conn.pragma_update(None, "foreign_keys", "ON")?;

#[cfg(debug_assertions)]
{
    let fk_status: i64 = conn.query_row("PRAGMA foreign_keys;", [], |r| r.get(0))?;
    debug_assert_eq!(fk_status, 1, "Foreign keys devem estar ativas no SQLite");
}
```

### 9.2 DDL da Migração 4 (Estrutura do Banco V2)
Arquivo: [`src-tauri/src/storage/migrations.rs`](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src-tauri/src/storage/migrations.rs)

```sql
-- 1. Cabeçalho do cofre V2 com KEK/DEK
CREATE TABLE IF NOT EXISTS vault_header_v2 (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    version INTEGER NOT NULL,          -- 2
    wrapped_dek TEXT NOT NULL,         -- JSON serializado de WrappedDekEnvelope
    created_at TEXT NOT NULL
);

-- 2. Tabela de operações de criação (Garante Idempotência de Lotes)
CREATE TABLE IF NOT EXISTS wallet_creation_operations (
    creation_id TEXT PRIMARY KEY,
    target TEXT NOT NULL CHECK (target IN ('DAO', 'CLIENT')),
    vault_id TEXT NOT NULL,
    operation_status TEXT NOT NULL CHECK (operation_status IN ('PENDING', 'COMMITTED', 'FAILED')),
    created_at TEXT NOT NULL,
    FOREIGN KEY (vault_id, target) REFERENCES vault_secrets(vault_id, target)
);

-- 3. Tabela wallets_v2 com constraint condicional para WATCH_ONLY e suporte a lotes
CREATE TABLE IF NOT EXISTS wallets_v2 (
    id INTEGER PRIMARY KEY,
    creation_id TEXT NOT NULL,
    target TEXT NOT NULL CHECK (target IN ('DAO', 'CLIENT')),
    custody_type TEXT NOT NULL CHECK (custody_type IN ('CUSTODIAL_LOCAL', 'WATCH_ONLY')),
    user_name TEXT NOT NULL,
    label TEXT NOT NULL,
    derivation_path TEXT NOT NULL,
    network_id TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'REVOKED')),
    kyc_status TEXT NOT NULL,
    seed_words_count INTEGER,          -- Nullable para WATCH_ONLY
    created_at TEXT NOT NULL,
    vault_id TEXT,
    FOREIGN KEY (vault_id, target) REFERENCES vault_secrets(vault_id, target) ON DELETE RESTRICT,
    FOREIGN KEY (creation_id) REFERENCES wallet_creation_operations(creation_id),
    UNIQUE (creation_id, derivation_path),
    CONSTRAINT chk_custody_integrity CHECK (
        (
            custody_type = 'CUSTODIAL_LOCAL'
            AND vault_id IS NOT NULL
            AND seed_words_count IS NOT NULL
            AND seed_words_count IN (12, 24)
        )
        OR
        (
            custody_type = 'WATCH_ONLY'
            AND vault_id IS NULL
            AND seed_words_count IS NULL
        )
    )
);

-- 4. Índice único composto normalizado (Case-Insensitive) para endereços na mesma rede
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_network_address ON wallets_v2(network_id, lower(address));
```

### 9.3 Persistência SQLite Atômica com Retorno Estrito
No método `save_wallets_and_secret_atomic`:
- Executado sob transação `TransactionBehavior::Immediate`.
- Insere o registro em `vault_secrets`.
- Insere a operação em `wallet_creation_operations`.
- Insere as carteiras em lote na tabela `wallets_v2`.
- Os IDs gerados são recuperados **dentro da mesma transação** antes do commit. A função retorna exclusivamente as carteiras criadas naquela chamada, eliminando interferência de concorrência.
- Commit finaliza a transação. Somente após o commit a sessão em memória transiciona para `CreationState::Consumed`.

### 9.4 Protocolo de Migração Criptográfica V1 $\rightarrow$ V2
Distingue-se a **migração estrutural SQLite** (executada no boot pelo `MigrationManager`) da **migração criptográfica de dados** (executada no primeiro desbloqueio autenticado com a senha mestre):
1. Detecta existência de cabeçalho V1 (`vault_header`).
2. Valida a senha contra o canário V1.
3. Abre transação SQLite `IMMEDIATE`.
4. Decifra todos os registros de `vault_secrets` e `user_profiles` usando a senha V1.
5. Gera a nova DEK de 256 bits via CSPRNG e deriva a KEK com Argon2id.
6. Grava `vault_header_v2`.
7. Recifra os segredos com as subchaves da DEK e os novos AADs canônicos V2.
8. Copia os registros de `wallets` para `wallets_v2` e dropa tabelas V1 de forma controlada.
9. Executa commit atômico. Se qualquer decifragem falhar, o rollback preserva integralmente os dados V1.

---

## 10. Rotação de Senha Mestre

A rotação de senha mestre opera com custo independente da quantidade de registros armazenados ($O(1)$ em registros do banco):
1. O usuário informa a senha atual e a nova senha.
2. A sessão decifra a DEK atual.
3. Deriva uma nova KEK com novo salt aleatório via Argon2id para a nova senha.
4. Cifra a **mesma DEK** com a nova KEK.
5. Atualiza atomicamente o registro único em `vault_header_v2`.
6. Nenhum registro em `vault_secrets`, `wallets_v2` ou `user_profiles` precisa ser alterado.

---

## 11. Roteiro de Execução e Portões de Aceite

| Fase | Escopo Técnico | Critério de Aceite (Portão de Homologação) |
|:---:|---|---|
| **0** | Envelopes (`AeadEnvelope`, `WrappedDekEnvelope`), HKDF, AAD canônico e pré-validação estrita `KdfProfile` em `encryption.rs`. | Testes unitários com vetores canônicos, rejeição de parâmetros zerados/excessivos e validação de hex. |
| **1** | `VaultHeaderV2` e rotação de senha em `access_control.rs`. | Teste de init, unlock e rotação sem quebra de integridade. |
| **2** | `VaultSession` reescrita com barreira de admissão, guard de operação, epoch monotônico e fail-closed com poison recovery universal. | Testes de concorrência com disputa de epoch, poison recovery e validação pré-commit. |
| **3** | Migração Estrutural (Migração 4) e Migração Criptográfica V1 $\rightarrow$ V2 em `storage`. | Teste de migração idempotente com rollback seguro em falha forçada e constraints válidas. |
| **4** | `CreationSessionStore` vinculado à intenção, 256 bits CSPRNG, `creation_id` e limpeza oportunística. | Testes de ciclo de vida e recuperação idempotente via `wallet_creation_operations`. |
| **5** | Comandos `wallet_commands.rs` com recálculo mandatório no Rust e Zero-Trust. | Teste de confirmação rejeitando requisições manipuladas pelo frontend. |
| **6** | Persistência atômica no SQLite (`save_wallets_and_secret_atomic`) com IDs retornados estritos. | Teste de inserção conjunta: nenhum segredo órfão gravado sem carteiras. |
| **7** | Atualização dos consumidores (`Identity`, Backup/Restore, `SSI`) e benchmark Argon2id. | Sucesso integral em `cargo test` de todos os módulos da aplicação e benchmark documentado. |

---

## 12. Validação Normativa

Este documento é a especificação oficial definitiva de engenharia para a custódia do DevOS Desktop. Nenhuma alteração de chaves, parâmetros de cifragem ou regras de persistência poderá ser efetuada em desacordo com estas diretrizes.
