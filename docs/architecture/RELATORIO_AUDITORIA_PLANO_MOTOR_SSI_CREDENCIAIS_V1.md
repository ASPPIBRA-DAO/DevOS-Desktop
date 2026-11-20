# MAPA ARQUITETURAL COMPLETO, ESPECIFICAÇÃO TÉCNICA E INVENTÁRIO FÍSICO
## DevOS Identity Wallet v1.0 — Motor de Identidade Auto-Soberana (W3C SSI)
**Projeto:** ASPPIBRA-DAO / DevOS Desktop  
**Data do Documento Unificado:** 20 de Novembro de 2026  
**Documento Oficial:** ESPECIFICAÇÃO NORMATIVA, AUDITORIA TÉCNICA E INVENTÁRIO DO SUBSISTEMA SSI  
**Commit Analisado:** `fb8a1f461221cbfe51b616e8c034f01a2b917864`  
**Status Geral:** FASE 1-A E 1-A.2 IMPLEMENTADAS E AUDITADAS (11/11 TESTES) • FASE 1-B AUTORIZADA COM CONDIÇÕES  
**Normas Regulatórias:** W3C VC Data Model 2.0 (Rec. 2025), W3C RDFC-1.0 (Rec. 2024), W3C Data Integrity EdDSA v1.0, W3C Bitstring Status List v1.0, OpenID4VP 1.0 (Rec. 2025), SLIP-0010, EIP-712, CAIP-10, OWASP Cryptographic Storage  

---

## 1. VISÃO INSTITUCIONAL E MATRIZ DE ATORES (W3C)

O **DevOS Identity Wallet** é o subsistema soberano cliente da ASPPIBRA-DAO. A arquitetura cumpre estritamente a separação dos três papéis canônicos estabelecidos pelo W3C:

```text
       ASPPIBRA — Associação dos Proprietários e Posseiros de Imóveis no Brasil
                             did:web:asppibra.org.br
                      (Chave Emissora HSM/KMS Protegida)
                                       │
                        EMITE CREDENCIAL W3C VC 2.0
                     (proofPurpose: assertionMethod)
                                       │
                                       ▼
                ┌──────────────────────────────────────────────┐
                │       DEVOS IDENTITY WALLET (Holder)         │
                │             did:key:z6Mku...                 │
                │      (Custódia em Vault Local Rust)          │
                └──────────────────────┬───────────────────────┘
                                       │
                        APRESENTAÇÃO W3C VP 2.0
                     (proofPurpose: authentication)
                     (OpenID4VP 1.0 / DCQL / direct_post.jwt)
                                       │
                                       ▼
                    VERIFICADOR INDEPENDENTE (Verifier)
        (Verifica criptograficamente autenticidade, integridade e
        estado da credencial, decidindo aceitação conforme suas regras)
```

### 1.1. Definições Canônicas dos Atores
* **Holder (Titular Soberano):** Pessoa física associada que controla com exclusividade sua semente BIP-39 e chaves privadas locais. Identificada pelo seu identificador público determinístico W3C `did:key:z6Mku...`.
* **Issuer (Autoridade Emissora):** **ASPPIBRA — Associação dos Proprietários e Posseiros de Imóveis no Brasil**, identificada publicamente por `did:web:asppibra.org.br`, operando chaves em infraestrutura HSM/KMS isolada com suporte a Pure EdDSA (RFC 8032).
* **Verifier (Verificador):** Sistema, instituição ou terceiro que verifica criptograficamente a autenticidade, integridade, autoria e o estado da credencial apresentada, decidindo sua aceitação conforme suas competências, finalidade e regras aplicáveis.

---

## 2. MAPA ESTRUTURAL DO CÓDIGO FONTE (RUST CORE)

O subsistema SSI foi desenhado para ser completamente modular e desacoplado, sem introduzir dependências destrutivas ou código zumbi nos módulos existentes (`wallets`, `identity`, `vault`, `storage`).

```text
DevOS-Desktop/src-tauri/
├── src/
│   ├── storage/
│   │   └── migrations.rs            // [IMPLEMENTADO] Migração 3 (tabela local_dids + índice único parcial)
│   └── modules/
│       └── ssi/
│           ├── mod.rs               // [IMPLEMENTADO] Fachada pública determinística e testes integrados
│           ├── repository.rs        // [IMPLEMENTADO] Repositório SQLite local_dids (chave pública e metadados)
│           ├── vault_integration.rs // [IMPLEMENTADO] Orquestração semente ➔ DID e validação fail-closed
│           ├── did/
│           │   ├── mod.rs           // [IMPLEMENTADO] Re-exports do submódulo DID
│           │   ├── did_key.rs       // [IMPLEMENTADO] Codificador/decodificador W3C did:key (0xed01 + Base58BTC 'z')
│           │   └── resolver.rs      // [FASE 1-B] Resolução local e extração de VerificationMethods
│           ├── keys/
│           │   ├── mod.rs           // [IMPLEMENTADO] Re-exports do submódulo de chaves
│           │   ├── derivation.rs    // [IMPLEMENTADO] SLIP-0010 hardened m/7391'/0'/0'/0' com zeroize
│           │   └── key_manager.rs   // [FASE 1-B] Trait de abstração Signer e acesso controlado a chaves
│           ├── crypto/
│           │   ├── mod.rs           // [FASE 1-B] Fachada criptográfica Data Integrity
│           │   ├── rdfc_canonicalizer.rs // [FASE 1-B] W3C RDF Dataset Canonicalization RDFC-1.0
│           │   └── proof_signer.rs  // [FASE 1-B] Assinador/Validador eddsa-rdfc-2022 desacoplado da semente
│           ├── credentials/
│           │   ├── mod.rs           // [PLANEJADO] Fachada de credenciais
│           │   ├── models.rs        // [PLANEJADO] Structs W3C VC 2.0 normativas
│           │   ├── issuer_verifier.rs // [FASE 1-B] Validador de assinatura institucional did:web
│           │   └── status_list.rs   // [PLANEJADO] Parser W3C Bitstring GZIP/Base64url (revocation + suspension)
│           ├── presentations/
│           │   ├── mod.rs           // [PLANEJADO] Fachada de apresentações
│           │   ├── models.rs        // [PLANEJADO] Structs W3C VP 2.0 com proofPurpose: authentication
│           │   └── openid4vp.rs     // [PLANEJADO] Parser DCQL, resolução request_uri e direct_post / direct_post.jwt
│           ├── devices/
│           │   ├── mod.rs           // [PLANEJADO] Fachada de dispositivos
│           │   ├── enrollment.rs    // [PLANEJADO] Delegação assinada da chave de instalação
│           │   └── revocation.rs    // [PLANEJADO] Despacho de revogação para a Cloudflare devos_devices
│           └── service.rs           // [PLANEJADO] Orquestrador central e persistência cifrada no SQLite
```

---

## 3. INVENTÁRIO FÍSICO DO MÓDULO SSI (AUDITORIA DO REPOSITÓRIO REAL)

O levantamento físico no diretório `DevOS-Desktop/src-tauri/src/modules/ssi/` confirma a presença de **3 diretórios e 7 arquivos Rust**, totalizando **840 linhas de código** e **30.299 bytes**, sem nenhum arquivo órfão ou duplicado.

| ID | Arquivo | Caminho Relativo | Linhas | Bytes | Categoria | Referenciado | Responsabilidade Técnica Auditada |
|:--:|:---|:---|:---:|:---:|:---:|:---:|:---|
| **01** | `mod.rs` | `src-tauri/src/modules/ssi/mod.rs` | 206 | 7.852 | Core / Fachada | **SIM** | Fachada pública do subsistema SSI. Reexporta `did`, `keys`, `repository`, `vault_integration`. Implementa `derive_holder_did_from_seed` e 4 testes integrados de ponta a ponta e SQLite. |
| **02** | `repository.rs` | `src-tauri/src/modules/ssi/repository.rs` | 208 | 7.212 | Persistência SQLite | **SIM** | Repositório da tabela `local_dids`. Define `LocalDidRecord`, `SsiStorageError` e operações CRUD seguras (`save_did`, `get_primary_did`, `get_did`, `list_dids`, `set_primary_did`). Enforça integridade da chave pública (32 bytes) e unicidade do DID primário. |
| **03** | `vault_integration.rs` | `src-tauri/src/modules/ssi/vault_integration.rs` | 117 | 4.449 | Integração Vault | **SIM** | Orquestrador `SsiVaultService` entre a semente BIP-39 e o banco local. Aplica o princípio **Fail-Closed**: se a semente desbloqueada gerar identidade divergente do banco, aborta com `IntegrityMismatch`. Disponibiliza `get_public_primary_identity`. |
| **04** | `mod.rs` | `src-tauri/src/modules/ssi/did/mod.rs` | 3 | 38 | DID | **SIM** | Módulo de reexportação: `pub mod did_key; pub use did_key::*;`. |
| **05** | `did_key.rs` | `src-tauri/src/modules/ssi/did/did_key.rs` | 125 | 4.484 | DID / Cripto | **SIM** | Implementação canônica W3C CCG de `did:key` para Ed25519: varint multicodec `[0xed, 0x01]`, multibase Base58BTC com prefixo `'z'` (`did:key:z6Mk...`), decodificação reversível e 4 testes unitários. |
| **06** | `mod.rs` | `src-tauri/src/modules/ssi/keys/mod.rs` | 3 | 44 | Keys | **SIM** | Módulo de reexportação: `pub mod derivation; pub use derivation::*;`. |
| **07** | `derivation.rs` | `src-tauri/src/modules/ssi/keys/derivation.rs` | 178 | 6.220 | Keys / Cripto | **SIM** | Derivação hierárquica determinística SLIP-0010 para curva Ed25519 no caminho $m/7391'/0'/0'/0'$. Estrutura `ExtendedEd25519Key` protegida na memória com traits `Zeroize`/`ZeroizeOnDrop` e `Debug` seguro (`[REDACTED]`). Contém 3 testes unitários. |

---

## 4. ARQUIVOS EXTERNOS INTEGRADOS DIRETAMENTE AO SSI

| Arquivo Externo | Papel na Arquitetura SSI | Natureza da Integração |
|:---|:---|:---:|
| `src-tauri/src/modules/mod.rs` | Declara e expõe publicamente `pub mod ssi;` no crate da aplicação. | Compilação |
| `src-tauri/src/storage/migrations.rs` | **Migração 3:** Executa a criação da tabela `local_dids` e do índice único parcial `idx_local_dids_single_primary` na inicialização do `LocalDatabase`. | DDL / Esquema |
| `src-tauri/src/storage/local_database.rs` | Provedor de conexões seguras SQLite com permissões POSIX restritas `0o600`. Utilizado pelo repositório SSI via injeção de conexão rusqlite. | Persistência |
| `src-tauri/src/lib.rs` | Inicializa o `LocalDatabase` apontando para o diretório `devos_vault` e invoca `MigrationManager::run_migrations(&vault_db)`. | Boot / Ciclo de Vida |
| `src-tauri/Cargo.toml` | Declara as dependências criptográficas e de serialização consumidas pelo SSI: `bs58 = "0.5"`, `ring = "0.17"`, `hmac = "0.12"`, `rusqlite = "0.32"`, `zeroize = "1.8"`, `thiserror = "2.0"`, `serde = "1.0"`, `chrono = "0.4"`. | Dependências |
| `src-tauri/Cargo.lock` | Garante resolução determinística e imutável das versões das bibliotecas. | Build |

---

## 5. INVENTÁRIO DOS 11 TESTES AUTOMATIZADOS HOMOLOGADOS

A suíte completa é executada via `cargo test modules::ssi`, apresentando **100% de aprovação (11/11 aprovados, 0 falhas e 0 warnings)**:

| ID | Nome do Teste | Arquivo de Origem | Tipo | Finalidade de Homologação |
|:--:|:---|:---|:---:|:---|
| **T01** | `test_encode_and_decode_w3c_ccg_official_vector` | `did/did_key.rs` | Unitário | Validação contra o vetor de testes oficial W3C CCG para did:key Ed25519 (`z6MkiTBz...`). |
| **T02** | `test_roundtrip_random_keys` | `did/did_key.rs` | Unitário | Teste de ida e volta (encode $\leftrightarrow$ decode) para 32 bytes aleatórios de chave pública. |
| **T03** | `test_decode_invalid_prefix` | `did/did_key.rs` | Unitário | Rejeição de identificadores com método inválido ou prefixo divergente de did:key. |
| **T04** | `test_decode_invalid_multibase` | `did/did_key.rs` | Unitário | Rejeição de strings que não iniciam com a multibase Base58BTC `'z'`. |
| **T05** | `test_slip10_ed25519_official_test_vector_1` | `keys/derivation.rs` | Unitário | Conformidade estrita com o Vetor Oficial 1 da especificação SLIP-0010. |
| **T06** | `test_deterministic_holder_derivation` | `keys/derivation.rs` | Unitário | Garante que a mesma semente mestre gera sempre o mesmo par Ed25519 em $m/7391'/0'/0'/0'$. |
| **T07** | `test_rejects_non_hardened_derivation` | `keys/derivation.rs` | Unitário | Rejeição de índices não-hardened ($index < 2^{31}$) na curva Ed25519 conforme a norma. |
| **T08** | `test_end_to_end_seed_to_did_key` | `mod.rs` | Integração E2E | Fluxo integral: Semente bruta $\rightarrow$ SLIP-0010 $\rightarrow$ Chave Pública $\rightarrow$ did:key canônico. |
| **T09** | `test_vault_integration_lifecycle` | `mod.rs` | Integração Vault | Ciclo de vida: persistência inicial, consulta pública, re-inicialização idêntica e bloqueio com `IntegrityMismatch` ao fornecer semente discrepante. |
| **T10** | `test_unique_primary_constraint` | `mod.rs` | SQLite | Validação do índice parcial `idx_local_dids_single_primary`: impede inserção de segundo registro primário. |
| **T11** | `test_unique_public_key_constraint` | `mod.rs` | SQLite | Validação da restrição `UNIQUE(public_key)` na tabela `local_dids`. |

```text
running 11 tests
test modules::ssi::did::did_key::tests::test_decode_invalid_multibase ... ok
test modules::ssi::did::did_key::tests::test_decode_invalid_prefix ... ok
test modules::ssi::did::did_key::tests::test_encode_and_decode_w3c_ccg_official_vector ... ok
test modules::ssi::did::did_key::tests::test_roundtrip_random_keys ... ok
test modules::ssi::keys::derivation::tests::test_rejects_non_hardened_derivation ... ok
test modules::ssi::keys::derivation::tests::test_slip10_ed25519_official_test_vector_1 ... ok
test modules::ssi::keys::derivation::tests::test_deterministic_holder_derivation ... ok
test modules::ssi::tests::test_unique_public_key_constraint ... ok
test modules::ssi::tests::test_end_to_end_seed_to_did_key ... ok
test modules::ssi::tests::test_unique_primary_constraint ... ok
test modules::ssi::tests::test_vault_integration_lifecycle ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; finished in 0.01s
```

---

## 6. ESPECIFICAÇÃO CRIPTOGRÁFICA E DERIVAÇÃO HIERÁRQUICA

### 6.1. Isolamento de Domínios na Semente BIP-39
O DevOS utiliza uma única semente mestre BIP-39 (com suporte opcional a passphrase adicional), derivando ramos estritamente isolados:

| Domínio | Especificação | Caminho de Derivação | Algoritmo | Utilização |
|---|---|---|---|---|
| **EVM Financeiro** | BIP-44 | `m/44'/60'/0'/0/0` | Secp256k1 / Keccak-256 | Carteira do Token ASPPBR, Staking, Votação DAO. |
| **SSI Holder** | SLIP-0010 Hardened | `m/7391'/0'/0'/0'` | Ed25519 / SHA-512 | Identidade do Holder (`did:key`), Assinatura de VPs. |
| **Dispositivo Local** | Chave Local Isolada | Gerada localmente por instalação | Ed25519 | Autenticação do hardware em `devos_devices`. |

```text
                            SEMENTE MESTRA BIP-39
                        (Cofre Rust - Zeroize na RAM)
                                       │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
     RAMO FINANCEIRO EVM                              RAMO DE IDENTIDADE SSI
    (BIP-44 / Secp256k1)                               (SLIP-0010 / Ed25519)
            │                                                   │
   m/44'/60'/0'/0/0 (Principal)                        m/7391'/0'/0'/0' (Holder Mestre)
   m/44'/60'/0'/0/1 (Secundária)                                │
            │                                                   ▼
            ▼                                            HOLDER DID W3C
    Endereço EVM (0x...)                                (did:key:z6Mku...)
            │                                                   │
            └─────────────── PROVA DE POSSE ────────────────────┘
                       (Assinatura Cruzada EVM + DID)
                                       │
                                       ▼
                       ATRIBUTO NA CREDENCIAL W3C
```

### 6.2. Suíte Criptográfica Normativa: `eddsa-rdfc-2022`
* **Canonicalização:** W3C RDF Dataset Canonicalization RDFC-1.0 (Recomendação W3C de 21 de maio de 2024), aplicando proteções contra *dataset poisoning*.
* **Assinatura:** Pure EdDSA sobre a curva Ed25519 com SHA-512 (RFC 8032).

---

## 7. MODELO DE DADOS NORMATIVO W3C VC 2.0 E SEGREGAÇÃO DE PRIVACIDADE

Para evitar a correlação pública entre a identidade civil e o histórico financeiro na blockchain (P1 - Privacidade), o DevOS segrega os atributos em três credenciais verificáveis independentes:

1. **`AsppibraMembershipCredential` (Condição de Associado):** Atributos civis e cadastrais. Não expõe o endereço EVM.
2. **`AsppibraEvmBindingCredential` (Vinculação de Carteira):** Atributo técnico de endereço CAIP-10 e prova de posse EIP-712. Utilizada apenas quando solicitada expressamente para operações Web3/DAO.
3. **`AsppibraOrganizationCredential` (Representação Jurídica):** CNPJ e poderes de representação associados ao titular físico.

### 7.1. Exemplo Canônico: Credencial de Associado (`AsppibraMembershipCredential`)

```json
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://asppibra.org.br/credentials/contexts/membership-v1.jsonld"
  ],
  "id": "urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "type": [
    "VerifiableCredential",
    "AsppibraMembershipCredential"
  ],
  "issuer": "did:web:asppibra.org.br",
  "validFrom": "2026-11-19T00:00:00Z",
  "credentialSubject": {
    "id": "did:key:z6MkuASPP123456789...",
    "fullName": "Sandro Associado",
    "membershipNumber": "ASP-2026-0001",
    "membershipCategory": "ASSOCIADO"
  },
  "credentialStatus": [
    {
      "id": "https://asppibra.org.br/status/holder-2026#142",
      "type": "BitstringStatusListEntry",
      "statusPurpose": "revocation",
      "statusListIndex": "142",
      "statusListCredential": "https://asppibra.org.br/status/holder-2026"
    },
    {
      "id": "https://asppibra.org.br/status/suspension-2026#142",
      "type": "BitstringStatusListEntry",
      "statusPurpose": "suspension",
      "statusListIndex": "142",
      "statusListCredential": "https://asppibra.org.br/status/suspension-2026"
    }
  ],
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "eddsa-rdfc-2022",
    "created": "2026-11-19T10:00:00Z",
    "verificationMethod": "did:web:asppibra.org.br#key-2026-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z3A4K..."
  }
}
```

---

## 8. PROTOCOLO DE VINCULAÇÃO EVM (EIP-712 ESTRUTURADO)

A vinculação da carteira EVM ao DID utiliza domínio EIP-712 estruturado limpo (sem contrato fictício), com identificador no padrão CAIP-10, nonce único de 32 bytes e validade temporal:

```json
{
  "types": {
    "EIP712Domain": [
      { "name": "name", "type": "string" },
      { "name": "version", "type": "string" },
      { "name": "chainId", "type": "uint256" }
    ],
    "AsppibraHolderBinding": [
      { "name": "holderDid", "type": "string" },
      { "name": "evmAddress", "type": "address" },
      { "name": "nonce", "type": "bytes32" },
      { "name": "issuedAt", "type": "uint64" },
      { "name": "expiresAt", "type": "uint64" },
      { "name": "purpose", "type": "string" }
    ]
  },
  "primaryType": "AsppibraHolderBinding",
  "domain": {
    "name": "ASPPIBRA-DAO Identity Registry",
    "version": "1.0",
    "chainId": 137
  },
  "message": {
    "holderDid": "did:key:z6Mku...",
    "evmAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "nonce": "0x4b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c",
    "issuedAt": 1795092000,
    "expiresAt": 1795092600,
    "purpose": "ASPPIBRA_HOLDER_EVM_BINDING"
  }
}
```

* O digest estruturado EIP-712 assinado pela carteira EVM é contra-assinado pela chave Ed25519 do DID.
* O backend da nuvem consome o nonce atomicamente contra replay attacks.

---

## 9. MÚLTIPLOS DISPOSITIVOS E EVOLUÇÃO DO MÉTODO DID

### 9.1. Modelo Criptográfico de Delegação (Sem Replicação Indiscriminada de Semente)
Para mitigar o risco de comprometimento da raiz de identidade em caso de roubo de computadores secundários, a arquitetura adota a **Delegação Criptográfica**:

```text
                  HOLDER IDENTITY
                         │
                         ▼
             CHAVE RAIZ DE IDENTIDADE
          (Isolada no Cofre Principal)
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
 AUTORIZAÇÃO A     AUTORIZAÇÃO B     AUTORIZAÇÃO C
       │                 │                 │
       ▼                 ▼                 ▼
  DEVICE KEY A      DEVICE KEY B      DEVICE KEY C
 (Desktop Trabalho)(Desktop Pessoal) (Dispositivo Móvel)
```

* **Chaves de Instalação Locais:** Cada computador gera seu próprio par Ed25519 independente, gerido no cofre da máquina.
* **Atestado de Autorização:** A chave raiz assina uma delegação autorizando a `DEVICE_KEY` específica a realizar apresentações com escopo e validade temporal delimitados.
* **Revogação Instantânea:** Caso uma máquina seja extraviada, sua chave correspondente é revogada na lista de status ou na tabela `devos_devices`, sem expor ou obrigar a alteração da raiz de identidade do titular.

### 9.2. Avaliação de Métodos DID com Suporte a Rotação (`did:webvh v1.0`)
Reconhecendo que a especificação oficial `did:key` não suporta rotação de chaves, revogação ou atualização de métodos de verificação (sendo ligada imutavelmente à chave pública inicial), a arquitetura programa a evolução para **`did:webvh v1.0`** (ou método compatível com histórico verificável e rotação descentralizada da DIF - *Decentralized Identity Foundation*) antes da emissão de credenciais institucionais definitivas e permanentes.

---

## 10. PROTOCOLO DE APRESENTAÇÃO: OPENID4VP 1.0 COM DCQL E DIRECT_POST.JWT

1. **Solicitação:** O Verificador apresenta um QR Code contendo `openid4vp://?client_id=...&request_uri=https://verifier.org/requests/123`.
2. **Resolução Segura:** O DevOS busca o Request Object assinado, validando a integridade do domínio solicitante contra ataques de SSRF (Server-Side Request Forgery).
3. **Consulta de Atributos:** O payload adota a especificação normativa **`dcql_query`** (Digital Credentials Query Language) para selecionar cirurgicamente apenas os atributos requeridos.
4. **Consentimento Explícito:** O DevOS exibe a tela de autorização informando o domínio solicitante e solicitando confirmação do titular.
5. **Despacho Cifrado (`direct_post.jwt`):** Para credenciais que contenham dados civis ou sensíveis, o DevOS cifra a Apresentação Verificável (W3C VP 2.0) utilizando JWE direcionado à chave pública do Verificador, transmitindo via HTTP POST seguro (**`direct_post.jwt`**).

---

## 11. ARQUITETURA DE PERSISTÊNCIA LOCAL PROTEGIDA (`devos_vault.sqlite`)

### 11.1. Integridade Referencial Estrita
O driver SQLite do DevOS executa obrigatoriamente `PRAGMA foreign_keys = ON;` em **todas** as conexões abertas (`LocalDatabase::get_connection`), assegurando que restrições `FOREIGN KEY ... ON DELETE RESTRICT` sejam rigorosamente aplicadas em tempo de execução.

### 11.2. Esquema DDL Consolidado

```sql
-- Identidades Soberanas Geradas Localmente (Migração 3 - IMPLEMENTADA)
CREATE TABLE IF NOT EXISTS local_dids (
    did TEXT PRIMARY KEY,
    method TEXT NOT NULL DEFAULT 'key' CHECK (method = 'key'),
    public_key BLOB NOT NULL CHECK (length(public_key) = 32),
    derivation_scheme TEXT NOT NULL,
    derivation_path TEXT NOT NULL,
    key_version INTEGER NOT NULL DEFAULT 1,
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
    created_at INTEGER NOT NULL,
    UNIQUE(public_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_local_dids_single_primary 
ON local_dids(is_primary) WHERE is_primary = 1;

-- Dispositivos Autorizados pelo Holder (Fase 2)
CREATE TABLE IF NOT EXISTS local_authorized_devices (
    device_id TEXT PRIMARY KEY,
    holder_did TEXT NOT NULL,
    device_public_key TEXT NOT NULL,
    device_name TEXT NOT NULL,
    authorization_signature TEXT NOT NULL,
    enrolled_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    FOREIGN KEY(holder_did) REFERENCES local_dids(did) ON DELETE RESTRICT
);

-- Credenciais Institucionais Custodiadas (Payload Cifrado em Repouso via AES-256-GCM) (Fase 2)
-- Segurança OWASP: encryption_version, key_version, AAD vinculado (id + holder_did + issuer_did) e nonce único.
CREATE TABLE IF NOT EXISTS local_verifiable_credentials (
    id TEXT PRIMARY KEY,
    holder_did TEXT NOT NULL,
    credential_type TEXT NOT NULL,
    issuer_did TEXT NOT NULL,
    valid_from TEXT NOT NULL,
    encrypted_payload BLOB NOT NULL,
    nonce BLOB NOT NULL UNIQUE,
    encryption_version INTEGER NOT NULL DEFAULT 1,
    key_version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'NOT_VERIFIED', -- NOT_VERIFIED, VALID, STALE, UNKNOWN, SUSPENDED, REVOKED, INVALID
    last_status_sync_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(holder_did) REFERENCES local_dids(did) ON DELETE RESTRICT
);

-- Cache de Listas de Status de Revogação e Suspensão (W3C Bitstring GZIP) (Fase 2)
CREATE TABLE IF NOT EXISTS local_status_list_cache (
    status_list_url TEXT PRIMARY KEY,
    issuer_did TEXT NOT NULL,
    purpose TEXT NOT NULL, -- 'revocation' ou 'suspension'
    bitstring_bits BLOB NOT NULL,
    fetched_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);

-- Histórico de Auditoria Local de Apresentações (Fase 2)
CREATE TABLE IF NOT EXISTS local_ssi_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    verifier_domain TEXT,
    challenge_used TEXT,
    occurred_at INTEGER NOT NULL
);
```

---

## 12. CONTRATOS IPC TAURI DEFINITIVOS (BACKEND NATIVO ➔ FRONTEND)

| Comando IPC | Parâmetros de Entrada | Retorno Tipado | Finalidade de Segurança |
|---|---|---|---|
| `ssi_get_holder_did` | N/A | `Result<HolderDidDto, SsiError>` | Retorna o DID público `did:key:z6Mku...` e o status da chave mestre. |
| `ssi_request_holder_credential` | `{ evm_signature: String, nonce: String }` | `Result<VcRequestReceipt, SsiError>` | Despacha solicitação assinada para a Cloud com prova EIP-712. |
| `ssi_import_credential` | `{ vc_json: String }` | `Result<ImportedVcSummary, SsiError>` | Valida assinatura do emissor, cifra e salva no cofre local. |
| `ssi_list_credentials` | N/A | `Result<Vec<CredentialCardDto>, SsiError>` | Lista credenciais ativas para exibição visual no Passaporte. |
| `ssi_generate_presentation` | `{ challenge: String, domain: String, credential_id: String }` | `Result<W3cVerifiablePresentation, SsiError>` | Produz e assina a VP anti-replay contendo `proofPurpose: authentication`. |
| `ssi_sync_credential_status` | `{ credential_id: String }` | `Result<CredentialStatusDto, SsiError>` | Baixa as Bitstrings de revogação/suspensão e atualiza o estado local. |
| `ssi_revoke_device` | `{ device_id: String }` | `Result<bool, SsiError>` | Revoga localmente e despacha a ordem de desativação para a Cloudflare. |

---

## 13. MAPA DE UI/UX — DEVOS IDENTITY WALLET (FRONTEND REACT)

O **DevOS Identity Wallet** é um módulo independente de primeiro nível no Cockpit, exibindo:
1. **Passaporte Digital do Holder:**
   * Crachá institucional com logotipo da ASPPIBRA.
   * **DID Pessoal:** `did:key:z6Mku...` com botão de cópia rápida.
   * **Badge de Status Dinâmico:**
     * `VALID`: Selo verde "Associado Verificado pela ASPPIBRA-DAO".
     * `STALE`: Selo amarelo "Offline (Verificado em DD/MM às HH:MM)".
     * `SUSPENDED / REVOKED`: Selo vermelho "Identidade Suspensa / Revogada".
2. **Leitor de QR Code OpenID4VP:**
   * Scanner ou input de URI para leitura de solicitações externas de apresentação.
   * Modal de consentimento prévio com aviso explícito de compartilhamento.
3. **Gestão de Dispositivos Autorizados:**
   * Lista de computadores autorizados com data de inscrição e botão de revogação imediata.
4. **Log de Auditoria Local:**
   * Linha do tempo de todas as apresentações (VPs) geradas, domínios solicitantes e datas.

---

## 14. ARQUIVOS PLANEJADOS AINDA NÃO EXISTENTES (17 ARQUIVOS)

A auditoria física do código-fonte em relação ao mapa arquitetural identificou que os seguintes **17 componentes** estão programados para as fases subsequentes e ainda não foram criados:

| Componente Planejado | Localização Relativa | Fase de Alocação | Finalidade Técnica |
|:---|:---|:---:|:---|
| `resolver.rs` | `src-tauri/src/modules/ssi/did/resolver.rs` | Fase 1-B | Resolução local e extração de VerificationMethods |
| `key_manager.rs` | `src-tauri/src/modules/ssi/keys/key_manager.rs` | Fase 1-B | Trait de abstração `Signer` desacoplado da semente |
| `mod.rs` | `src-tauri/src/modules/ssi/crypto/mod.rs` | Fase 1-B | Fachada criptográfica Data Integrity |
| `rdfc_canonicalizer.rs` | `src-tauri/src/modules/ssi/crypto/rdfc_canonicalizer.rs` | Fase 1-B | W3C RDF Dataset Canonicalization (RDFC-1.0) |
| `proof_signer.rs` | `src-tauri/src/modules/ssi/crypto/proof_signer.rs` | Fase 1-B | Assinador Pure EdDSA (`eddsa-rdfc-2022`) |
| `mod.rs` | `src-tauri/src/modules/ssi/credentials/mod.rs` | Fase 1-B | Fachada do módulo de credenciais |
| `models.rs` | `src-tauri/src/modules/ssi/credentials/models.rs` | Fase 1-B | Structs W3C VC 2.0 normativas em JSON-LD |
| `issuer_verifier.rs` | `src-tauri/src/modules/ssi/credentials/issuer_verifier.rs` | Fase 1-B | Validador de assinatura institucional `did:web` |
| `mod.rs` | `src-tauri/src/modules/ssi/devices/mod.rs` | Fase 2 | Fachada de dispositivos autorizados |
| `enrollment.rs` | `src-tauri/src/modules/ssi/devices/enrollment.rs` | Fase 2 | Delegação assinada da chave de instalação |
| `revocation.rs` | `src-tauri/src/modules/ssi/devices/revocation.rs` | Fase 2 | Despacho de revogação para `devos_devices` |
| `service.rs` | `src-tauri/src/modules/ssi/service.rs` | Fase 2 | Orquestrador central e persistência cifrada |
| `ssi_commands.rs` | `src-tauri/src/commands/ssi_commands.rs` | Fase 3 | Handlers IPC Tauri para consumo no Frontend |
| `status_list.rs` | `src-tauri/src/modules/ssi/credentials/status_list.rs` | Fase 5 | Parser W3C Bitstring GZIP (revogação/suspensão) |
| `mod.rs` | `src-tauri/src/modules/ssi/presentations/mod.rs` | Fase 5 | Fachada de apresentações verificáveis |
| `models.rs` | `src-tauri/src/modules/ssi/presentations/models.rs` | Fase 5 | Structs W3C VP 2.0 (`proofPurpose: authentication`) |
| `openid4vp.rs` | `src-tauri/src/modules/ssi/presentations/openid4vp.rs` | Fase 5 | Parser DCQL, QR Code e `direct_post.jwt` |

---

## 15. ROADMAP E DETALHAMENTO DA FASE 1-B

### 15.1. Tabela Geral de Fases

| Fase | Descrição do Escopo | Status Atual |
|---|---|---|
| **Fase 0** | Definição normativa, arquitetural e formalização institucional. | **100% CONCLUÍDA** |
| **Fase 1-A** | Fundação técnica em Rust (`did_key.rs`, SLIP-0010, testes unitários). | **100% IMPLEMENTADA E HOMOLOGADA** |
| **Fase 1-A.2** | Integração SSI com Vault e Persistência do DID (`local_dids`, migração 3, integridade Fail-Closed). | **100% IMPLEMENTADA E HOMOLOGADA (11 TESTES)** |
| **Fase 1-B** | Motor de Assinatura e Verificação W3C Data Integrity (`eddsa-rdfc-2022`, RDFC-1.0, Trait Signer). | **AUTORIZADA COM CONDIÇÕES (EM ANDAMENTO)** |
| **Fase 2** | Migrações SQLite e repositório de persistência de credenciais cifradas AES-256-GCM. | Planejada |
| **Fase 3** | Integração institucional de emissão (KMS/Cloudflare) e protocolo EIP-712. | Planejada |
| **Fase 4** | Componentes visuais React (DevOS Identity Wallet, Passaporte, QR Code). | Planejada |
| **Fase 5** | Parser OpenID4VP DCQL, verificação Bitstring e migração de `secure_vaults`. | Planejada |

### 15.2. Componentes e Responsabilidades da Fase 1-B

| Componente | Localização | Responsabilidade Técnica |
|---|---|---|
| `rdfc_canonicalizer.rs` | `modules/ssi/crypto/` | Implementação normativa do W3C RDF Dataset Canonicalization (RDFC-1.0 / May 2024 Rec). |
| `proof_signer.rs` | `modules/ssi/crypto/` | Assinador Pure EdDSA (`eddsa-rdfc-2022`) gerando `proofPurpose: assertionMethod` e `authentication`. |
| `issuer_verifier.rs` | `modules/ssi/credentials/` | Verificador de integridade criptográfica e validade de assinaturas institucionais (`did:web`). |
| `resolver.rs` | `modules/ssi/did/` | Resolução determinística local de DIDs e extração de VerificationMethods. |
| `key_manager.rs` | `modules/ssi/keys/` | Trait de abstração `Signer` desacoplada da semente BIP-39, permitindo chaves locais ou delegadas. |

### 15.3. Bateria de Testes Obrigatórios da Fase 1-B (Critérios de Homologação)
1. Vetores oficiais de canonicalização RDFC-1.0 (W3C).
2. Assinatura Ed25519 em conformidade com RFC 8032.
3. Verificação de assinaturas válidas em documentos canônicos.
4. Rejeição de assinaturas adulteradas (adulteração de bytes no `proofValue`).
5. Rejeição de alterações no payload (modificação de chave ou valor no documento).
6. Validação estrita de `proofPurpose: assertionMethod` (emissão de credenciais).
7. Validação estrita de `proofPurpose: authentication` (apresentações VPs).
8. Proteção contra contextos JSON-LD não autorizados (injeção de esquemas externos).
9. Tratamento robusto e seguro de documentos malformados ou incompletos.
10. Testes de interoperabilidade com vetores oficiais W3C Data Integrity.

---

## 16. RESUMO QUANTITATIVO GERAL CONSOLIDADO

* **Diretórios físicos inspecionados no SSI:** `3` (`ssi`, `ssi/did`, `ssi/keys`)
* **Total de arquivos Rust no módulo SSI:** `7` arquivos
* **Total de linhas de código Rust no SSI:** `840` linhas
* **Total de bytes em arquivos do SSI:** `30.299` bytes
* **Total de testes automatizados implementados:** `11` testes
* **Taxa de aprovação dos testes:** `100%` (11 aprovados, 0 falhas, 0 warnings)
* **Arquivos de integração externa essenciais:** `6` arquivos (`mod.rs`, `migrations.rs`, `local_database.rs`, `lib.rs`, `Cargo.toml`, `Cargo.lock`)
* **Arquivos não referenciados / órfãos:** `0` arquivos
* **Arquivos planejados ainda inexistentes:** `17` arquivos (distribuídos nas Fases 1-B a 5)
* **Status Geral da Implementação:** **Fase 1-A e Fase 1-A.2 100% Implementadas e Auditadas**.

---

<div align="center">
  <sub>Documento oficial unificado de arquitetura, especificação e inventário • ASPPIBRA-DAO • DevOS Desktop v1.0</sub>
</div>
