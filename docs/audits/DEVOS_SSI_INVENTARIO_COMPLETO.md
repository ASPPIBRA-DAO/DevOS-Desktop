# AUDITORIA E INVENTÁRIO ESTRUTURAL COMPLETO
## DevOS Identity Wallet (Módulo SSI) — ASPPIBRA-DAO / DevOS Desktop
**Data do Levantamento:** 20 de Novembro de 2026  
**Tipo de Auditoria:** Inspeção de Código-Fonte Real (Read-Only / No-Op)  
**Objetivo:** Mapeamento real, inventário de arquivos, rastreabilidade de testes e divergências estruturais entre a documentação de planejamento e a implementação efetiva.  

---

## 1. IDENTIFICAÇÃO DO PROJETO E COMMIT ANALISADO

* **Projeto:** ASPPIBRA DevOS Desktop (Desktop Client Soberano / Cockpit & Node Editions)
* **Repositório:** `DevOS-Desktop`
* **Commit Base Analisado:** `fb8a1f461221cbfe51b616e8c034f01a2b917864`
* **Data do Commit Base:** `Wed Nov 18 15:12:12 2026 -0300`
* **Mensagem do Commit:** `docs(audit): registrar transacoes atomicas do mapeamento arquitetural em git-change-log.csv`
* **Branch Ativa:** `main` (com alterações locais rastreadas da Fase 1-A e 1-A.2)
* **Ambiente de Execução:** Linux x86_64 / Rust 1.92 (Edition 2024) / Tauri v2.12.1

---

## 2. LOCALIZAÇÃO EFETIVA DO MÓDULO SSI

* **Diretório Raiz do Módulo SSI:**  
  `DevOS-Desktop/src-tauri/src/modules/ssi/`
* **Registro no Grafo de Módulos Rust:**  
  O módulo está devidamente declarado e registrado publicamente em `src-tauri/src/modules/mod.rs`:
  ```rust
  pub mod ssi;
  ```
* **Verificação de Multiplicidade/Estruturas Zumbis:**  
  Não foram encontradas outras implementações ativas do SSI no backend nativo do Desktop. Não existem pastas duplicadas, módulos fantasmas ou bifurcações não registradas no `src-tauri`. (Modelos legados em TypeScript identificados no repositório de serviços em nuvem `backend/src/db/ssi/` e `backend/src/domains/ssi/` operam exclusivamente como orquestradores em Cloudflare Workers D1 e não residem no código do cliente Desktop).

---

## 3. ÁRVORE COMPLETA DE DIRETÓRIOS E ARQUIVOS REAIS

A estrutura abaixo reflete **estritamente os diretórios e arquivos físicos encontrados no disco**, sem adições especulativas:

```text
DevOS-Desktop/src-tauri/src/modules/ssi/
├── mod.rs                                (206 linhas | 7.852 bytes)
├── repository.rs                         (208 linhas | 7.212 bytes)
├── vault_integration.rs                  (117 linhas | 4.449 bytes)
├── did/
│   ├── mod.rs                            (  3 linhas |    38 bytes)
│   └── did_key.rs                        (125 linhas | 4.484 bytes)
└── keys/
    ├── mod.rs                            (  3 linhas |    44 bytes)
    └── derivation.rs                     (178 linhas | 6.220 bytes)
```

**Subdiretórios existentes no módulo:**
1. `src-tauri/src/modules/ssi/` (Raiz do subsistema)
2. `src-tauri/src/modules/ssi/did/` (Submódulo de identificadores W3C)
3. `src-tauri/src/modules/ssi/keys/` (Submódulo criptográfico de chaves)

---

## 4. INVENTÁRIO DETALHADO DOS ARQUIVOS ENCONTRADOS

| ID | Arquivo | Caminho Relativo | Extensão | Tamanho (Bytes) | Linhas | Categoria | Referenciado | Observação / Responsabilidade Técnica |
|:--:|:---|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **01** | `mod.rs` | `src-tauri/src/modules/ssi/mod.rs` | `.rs` | 7.852 | 206 | Core / Fachada | **SIM** | Fachada pública do subsistema SSI. Reexporta `did`, `keys`, `repository`, `vault_integration`. Implementa `derive_holder_did_from_seed` e abriga 4 testes de integração e persistência SQLite. |
| **02** | `repository.rs` | `src-tauri/src/modules/ssi/repository.rs` | `.rs` | 7.212 | 208 | Persistência SQLite | **SIM** | Repositório da tabela `local_dids`. Define `LocalDidRecord`, `SsiStorageError` e operações CRUD protegidas (`save_did`, `get_primary_did`, `get_did`, `list_dids`, `set_primary_did`). Enforça integridade de chave pública de 32 bytes e unicidade do DID primário via índice parcial. |
| **03** | `vault_integration.rs` | `src-tauri/src/modules/ssi/vault_integration.rs` | `.rs` | 4.449 | 117 | Integração Vault | **SIM** | Orquestrador `SsiVaultService` entre a semente BIP-39 e o banco local. Aplica o princípio **Fail-Closed**: se a semente desbloqueada divergir do registro em banco, retorna `IntegrityMismatch`. Oferece método de consulta pública `get_public_primary_identity`. |
| **04** | `mod.rs` | `src-tauri/src/modules/ssi/did/mod.rs` | `.rs` | 38 | 3 | DID | **SIM** | Módulo de reexportação de tipos e métodos de identificadores: `pub mod did_key; pub use did_key::*;`. |
| **05** | `did_key.rs` | `src-tauri/src/modules/ssi/did/did_key.rs` | `.rs` | 4.484 | 125 | DID / Cripto | **SIM** | Implementação canônica W3C CCG de `did:key` para Ed25519: prefixo multicodec varint `[0xed, 0x01]`, codificação Base58BTC com prefixo `'z'` (`did:key:z6Mk...`), decodificação reversível e 4 testes unitários. |
| **06** | `mod.rs` | `src-tauri/src/modules/ssi/keys/mod.rs` | `.rs` | 44 | 3 | Keys | **SIM** | Módulo de reexportação de gerenciamento de chaves: `pub mod derivation; pub use derivation::*;`. |
| **07** | `derivation.rs` | `src-tauri/src/modules/ssi/keys/derivation.rs` | `.rs` | 6.220 | 178 | Keys / Cripto | **SIM** | Derivação hierárquica determinística SLIP-0010 para curva Ed25519 no caminho `m/7391'/0'/0'/0'`. Estrutura `ExtendedEd25519Key` protegida na memória com traits `Zeroize`/`ZeroizeOnDrop` e formatação `Debug` segura (`[REDACTED]`). Contém 3 testes unitários. |

---

## 5. CLASSIFICAÇÃO FUNCIONAL DOS COMPONENTES EXISTENTES

* **Camada de Identificadores Descentralizados (DID):**
  * Codificação determinística Base58BTC e Multicodec Ed25519 (`did_key.rs`).
  * Validador de conformidade e integridade de formato W3C.
* **Camada Criptográfica de Derivação (Keys):**
  * Derivação SLIP-0010 pura (SHA-512 + HMAC-SHA512) com índices estritamente *hardened*.
  * Proteção de memória volátil contra despejo (*zeroize on drop*).
* **Camada de Armazenamento Soberano (Repository):**
  * Esquema relacional isolado na base `devos_vault.sqlite`.
  * Prevenção estrita de custódia indevida: apenas a chave pública (32 bytes) e metadados de derivação são gravados. Nenhuma chave privada ou semente reside na tabela.
* **Camada de Integridade do Cofre (Vault Integration):**
  * Mecanismo de conciliação criptográfica semente $\leftrightarrow$ banco de dados local com trava *fail-closed*.

---

## 6. ARQUIVOS EXTERNOS INTEGRADOS DIRETAMENTE AO SUBSISTEMA SSI

Embora o módulo resida em `modules/ssi/`, sua operação depende diretamente dos seguintes componentes do núcleo:

| Arquivo Externo | Papel na Integração | Tipo de Vínculo |
|:---|:---|:---:|
| `src-tauri/src/modules/mod.rs` | Declara e expõe publicamente `pub mod ssi;` no crate da aplicação. | Compilação |
| `src-tauri/src/storage/migrations.rs` | **Migração 3:** Executa a criação da tabela `local_dids` e do índice único parcial `idx_local_dids_single_primary` na inicialização do `LocalDatabase`. | DDL / Esquema |
| `src-tauri/src/storage/local_database.rs` | Provedor de conexões seguras SQLite com permissões POSIX restritas `0o600`. Utilizado pelo repositório SSI via injeção de conexão rusqlite. | Persistência |
| `src-tauri/src/lib.rs` | Inicializa o `LocalDatabase` apontando para o diretório `devos_vault` e invoca `MigrationManager::run_migrations(&vault_db)`. | Boot / Ciclo de Vida |
| `src-tauri/Cargo.toml` | Declara as dependências criptográficas e de serialização consumidas pelo SSI: `bs58 = "0.5"`, `ring = "0.17"`, `hmac = "0.12"`, `rusqlite = "0.32"`, `zeroize = "1.8"`, `thiserror = "2.0"`, `serde = "1.0"`, `chrono = "0.4"`. | Dependências |
| `src-tauri/Cargo.lock` | Garante resolução reproduzível e travamento determinístico de versão de todas as bibliotecas. | Build |

---

## 7. MAPA DE DEPENDÊNCIAS E FLUXO DE COMUNICAÇÃO

### 7.1. Fluxo Real em Execução (Fases 1-A e 1-A.2)

```text
               APLICAÇÃO / TESTES / COFRE
                           │
                           ▼
          src-tauri/src/modules/ssi/mod.rs
          (derive_holder_did_from_seed)
              │                         │
              ▼                         ▼
   modules/ssi/keys/             modules/ssi/did/
   (derivation.rs - SLIP-0010)   (did_key.rs - W3C Multicodec)
   [Chave Ed25519 em Zeroize]    [did:key:z6Mk...]
              │                         │
              └────────────┬────────────┘
                           ▼
         modules/ssi/vault_integration.rs
              (SsiVaultService)
          [Verificação Fail-Closed]
                           │
                           ▼
            modules/ssi/repository.rs
             (SsiRepository - SQLite)
                           │
                           ▼
         devos_vault.sqlite (local_dids)
         (Chave Pública 32 bytes + Metadados)
```

### 7.2. Comunicação Externa: Consumo Atual
* **Quem chama o SSI:** Os testes automatizados internos de integração (`mod.rs`) e serviços de cofre em homologação.
* **Quem o SSI consome externamente:** 
  * `rusqlite::Connection` (do módulo `storage::local_database`)
  * `ring::signature::Ed25519KeyPair` (da biblioteca `ring` para verificação de pares)
  * `hmac::Hmac<sha2::Sha512>` (para a derivação SLIP-0010)
  * `bs58` (para o multibase W3C Base58BTC)
  * `zeroize::Zeroize` (para expurgo da memória RAM)
* **Frontend e IPC:** **Ainda não conectados**. O frontend React e a tabela de comandos IPC Tauri (`src-tauri/src/commands/`) ainda não possuem manipuladores de SSI (o desenvolvimento desses comandos está alocado nas Fases 3 e 4).

---

## 8. INVENTÁRIO DOS TESTES AUTOMATIZADOS

Existem **11 testes automatizados**, todos compilando e passando com **100% de sucesso (0 falhas e 0 warnings)** via comando `cargo test modules::ssi`:

| ID | Nome do Teste | Arquivo de Origem | Tipo de Teste | Finalidade do Teste |
|:--:|:---|:---|:---:|:---|
| **T01** | `test_encode_and_decode_w3c_ccg_official_vector` | `did/did_key.rs` | Unitário Criptográfico | Validação contra o vetor de testes oficial do W3C CCG para did:key Ed25519 (`z6MkiTBz...`). |
| **T02** | `test_roundtrip_random_keys` | `did/did_key.rs` | Unitário Criptográfico | Teste de ida e volta (encode $\leftrightarrow$ decode) para 32 bytes aleatórios. |
| **T03** | `test_decode_invalid_prefix` | `did/did_key.rs` | Unitário Validação | Rejeição de identificadores com método inválido ou prefixo divergente de did:key. |
| **T04** | `test_decode_invalid_multibase` | `did/did_key.rs` | Unitário Validação | Rejeição de strings que não iniciam com a multibase Base58BTC `'z'`. |
| **T05** | `test_slip10_ed25519_official_test_vector_1` | `keys/derivation.rs` | Unitário Criptográfico | Conformidade estrita com o Vetor Oficial 1 da especificação SLIP-0010. |
| **T06** | `test_deterministic_holder_derivation` | `keys/derivation.rs` | Unitário Determinismo | Garante que a mesma semente mestre gera sempre o mesmo par Ed25519 em $m/7391'/0'/0'/0'$. |
| **T07** | `test_rejects_non_hardened_derivation` | `keys/derivation.rs` | Unitário Validação | Impede derivações não-hardened ($index < 2^{31}$) na curva Ed25519 conforme a norma. |
| **T08** | `test_end_to_end_seed_to_did_key` | `mod.rs` | Integração E2E | Teste de ponta a ponta: Semente bruta $\rightarrow$ SLIP-0010 $\rightarrow$ Chave Pública $\rightarrow$ did:key canônico. |
| **T09** | `test_vault_integration_lifecycle` | `mod.rs` | Integração Vault / Fail-Closed | Ciclo de vida completo: criação primária, consulta pública, re-autenticação determinística e bloqueio com `IntegrityMismatch` ao fornecer semente discrepante. |
| **T10** | `test_unique_primary_constraint` | `mod.rs` | Persistência SQLite | Validação do índice parcial único `idx_local_dids_single_primary`: impede inserção de segundo registro primário. |
| **T11** | `test_unique_public_key_constraint` | `mod.rs` | Persistência SQLite | Validação da restrição `UNIQUE(public_key)` na tabela `local_dids`. |

---

## 9. ARQUIVOS PLANEJADOS QUE AINDA NÃO EXISTEM

Comparando a implementação física atual com o roadmap aprovado da arquitetura, constata-se que os seguintes **17 arquivos/módulos planejados ainda não foram criados**:

### Fase 1-B (Motor de Assinatura e Verificação W3C Data Integrity):
1. `src-tauri/src/modules/ssi/did/resolver.rs` (Resolução local de VerificationMethods)
2. `src-tauri/src/modules/ssi/keys/key_manager.rs` (Trait de abstração `Signer` desacoplado da semente)
3. `src-tauri/src/modules/ssi/crypto/mod.rs` (Fachada criptográfica Data Integrity)
4. `src-tauri/src/modules/ssi/crypto/rdfc_canonicalizer.rs` (Canonicalizador W3C RDFC-1.0)
5. `src-tauri/src/modules/ssi/crypto/proof_signer.rs` (Assinador Pure EdDSA `eddsa-rdfc-2022`)
6. `src-tauri/src/modules/ssi/credentials/mod.rs` (Fachada de credenciais)
7. `src-tauri/src/modules/ssi/credentials/models.rs` (Structs W3C VC 2.0 normativas)
8. `src-tauri/src/modules/ssi/credentials/issuer_verifier.rs` (Validador de assinaturas institucionais `did:web`)

### Fase 2 e 3 (Persistência Cifrada, Dispositivos e Emissão):
9. `src-tauri/src/modules/ssi/devices/mod.rs` (Fachada de dispositivos autorizados)
10. `src-tauri/src/modules/ssi/devices/enrollment.rs` (Delegação criptográfica de chaves de hardware)
11. `src-tauri/src/modules/ssi/devices/revocation.rs` (Despacho de desativação)
12. `src-tauri/src/modules/ssi/service.rs` (Orquestrador central de serviços de identidade)
13. `src-tauri/src/commands/ssi_commands.rs` (Comandos IPC Tauri para invocação do frontend)

### Fase 4 e 5 (Apresentações, Listas de Status e OpenID4VP):
14. `src-tauri/src/modules/ssi/credentials/status_list.rs` (Parser W3C Bitstring GZIP de revogação/suspensão)
15. `src-tauri/src/modules/ssi/presentations/mod.rs` (Fachada de apresentações)
16. `src-tauri/src/modules/ssi/presentations/models.rs` (Structs W3C VP 2.0 com `proofPurpose: authentication`)
17. `src-tauri/src/modules/ssi/presentations/openid4vp.rs` (Parser DCQL, resolução de QR Code e `direct_post.jwt`)

---

## 10. ARQUIVOS EXISTENTES NÃO DOCUMENTADOS

* **Nenhum**. Todos os 7 arquivos físicos existentes no diretório `src-tauri/src/modules/ssi/` constam no relatório normativo de arquitetura.
* Não foram encontrados scripts temporários, arquivos `.bak`, arquivos de rascunho ou testes soltos desvinculados da suíte oficial do Cargo.

---

## 11. DUPLICIDADES E DIVERGÊNCIAS ARQUITETURAIS

1. **Ausência de Duplicidades:** Não há duplicação de lógica entre `did_key.rs` e outros módulos de identidade existentes (`modules/identity/` foca exclusivamente no perfil civil em JSON cifrado).
2. **Separação de Responsabilidades:** `repository.rs` atua puramente como driver de banco de dados, enquanto `vault_integration.rs` custodia a lógica de verificação criptográfica, mantendo a integridade referencial intacta.
3. **Ponto de Atenção para a Fase 1-B:** Conforme apontado na auditoria anterior, a função `derive_holder_did_from_seed` na raiz do módulo `mod.rs` recebe a semente bruta. Para a Fase 1-B, a introdução do trait `Signer` em `key_manager.rs` desacoplará as operações de assinatura dessa dependência direta.

---

## 12. RESUMO QUANTITATIVO DO SUBSISTEMA SSI

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
  <sub>Documento oficial de auditoria técnica • ASPPIBRA-DAO / DevOS Desktop v1.0</sub>
</div>
