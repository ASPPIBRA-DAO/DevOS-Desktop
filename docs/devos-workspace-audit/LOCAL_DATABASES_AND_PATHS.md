# 🏛️ Auditoria e Mapeamento dos Bancos de Dados Locais SQLite
## Localização Física, Permissões, Schemas e Proteção Criptográfica

**Data:** 05/11/2026  
**Auditor:** ASPPIBRA DevOS Engine  
**Referência:** Fase 6 da Ordem 5.3  

---

## 1. Princípio Fundamental de Preservação de Dados

> **REGRA INEGOCIÁVEL (Seção 4 e 9 da Ordem):**  
> Os bancos de dados locais são administrados exclusivamente pelo núcleo nativo Rust do DevOS Desktop.  
> **Nenhum banco de dados deve ser movido, copiado, renomeado ou criado artificialmente nesta etapa.**  
> O futuro DevOS Workspace funcionará como uma camada visual e documental, apontando referências e transparência sem corromper as travas de arquivo ou as permissões de custódia do sistema operacional.

---

## 2. Inventário Detalhado dos Bancos de Dados

### 2.1. Banco Criptográfico de Custódia: `devos_vault.sqlite`

- **Finalidade:** Armazenamento seguro de custódia, cabeçalho do cofre com envelope de verificação (canário), metadados de carteiras criptográficas e envelopes cifrados com chaves mestras e sementes BIP-39.
- **Módulo Responsável:** `storage::LocalDatabase` ([src-tauri/src/storage/local_database.rs](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src-tauri/src/storage/local_database.rs#L81-L90)) e `modules::vault` ([src-tauri/src/modules/vault](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src-tauri/src/modules/vault)).
- **Caminho Físico Resolvido pelo Rust:**
  - Na Edição Cockpit: `/home/sandro/.local/share/br.aspp.devos.cockpit/devos_vault/devos_vault.sqlite`
  - Na Edição Node: `/home/sandro/.local/share/br.aspp.devos.node/devos_vault/devos_vault.sqlite`
- **Mecanismo de Resolução:** `app_handle.path().app_data_dir().join("devos_vault")`.
- **Proteção no Sistema Operacional:**  
  O arquivo e seu diretório recebem permissões estritas Unix `0600` (somente leitura/escrita pelo proprietário `sandro`), impedindo qualquer acesso por processos não autorizados.
- **Tabelas do Schema (Migração 1):**
  - `schema_migrations`: Controle versionado de atualizações estruturais.
  - `vault_header`: Armazena `version`, `canary_envelope` e data de criação.
  - `wallets`: Metadados das carteiras associadas (`derivation_path`, `network`, `address`, `status`, `kyc_status`).
  - `vault_secrets`: Envelopes criptografados contendo os segredos reais protegidos por Argon2 + AES-256-GCM.
- **Arquivos Auxiliares (Sidecars):**
  - `devos_vault.sqlite-wal` (Write-Ahead Logging)
  - `devos_vault.sqlite-shm` (Shared Memory)

---

### 2.2. Banco Cadastral Territorial Imobiliário: `real_estate.sqlite`

- **Finalidade:** Base de dados cadastrais imobiliários, auditoria territorial do município de Maricá - RJ, histórico de importações de planilhas e proveniência de registros.
- **Módulo Responsável:** `storage::RealEstateDatabase` ([src-tauri/src/storage/real_estate_database.rs](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src-tauri/src/storage/real_estate_database.rs)) e migrações [real_estate_migrations.rs](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src-tauri/src/storage/real_estate_migrations.rs).
- **Caminho Físico Resolvido pelo Rust:**
  - Exclusivo da Edição Cockpit: `/home/sandro/.local/share/br.aspp.devos.cockpit/real_estate/real_estate.sqlite`
- **Proteção e Modo Operacional:**
  - Configurado com `PRAGMA journal_mode = WAL` para suporte a alta concorrência de leitura e escritas atômicas.
  - Integridade referencial com chaves estrangeiras atômicas (`PRAGMA foreign_keys = ON`).
- **Tabelas do Schema (Migração 1):**
  - `schema_migrations`: Versionamento das migrações territoriais.
  - `properties`: Identificadores UUID estáveis de cada imóvel.
  - `property_identifiers`: Matrículas, inscrições municipais e selos cadastrais.
  - `addresses`: Endereços normalizados e componentes estruturados.
  - `property_batches`: Controle de lotes de importação e hash SHA-256 de proveniência.

---

## 3. Matriz de Comparação: Localização Real vs Futuro Workspace

| Banco de Dados | Caminho Físico Canônico Atual | Caminho Proposto no Workspace | Ação Permitida na Implantação |
|---|---|---|---|
| `devos_vault.sqlite` | `~/.local/share/br.aspp.devos.cockpit/devos_vault/devos_vault.sqlite` | `DevOS/02 - COFRE CRIPTOGRÁFICO/` | **Manter no caminho atual.** Inserir documento explicativo sobre custódia e isolamento `0600`. Não criar link simbólico com permissão aberta. |
| `real_estate.sqlite` | `~/.local/share/br.aspp.devos.cockpit/real_estate/real_estate.sqlite` | `DevOS/03 - DADOS LOCAIS/Cadastro Imobiliário/` | **Manter no caminho atual.** Inserir inventário descritivo. Os dados são operados via Cockpit. |
| `devos_local.sqlite` | Não existe no projeto | — | **Não criar.** Veto explícito da ordem contra bancos vazios. |

---

## 4. Dependências Técnicas que Impedem a Movimentação Física

Qualquer tentativa de mover os arquivos `.sqlite` diretamente para a Área de Trabalho acarretaria:
1. **Quebra dos Contratos de Boot do Tauri:** O código Rust em `src-tauri/src/lib.rs` utiliza `app_handle.path().app_data_dir()`, um caminho padronizado pelo XDG.
2. **Perda de Permissões Unix:** Na Área de Trabalho, diretórios e arquivos podem ser expostos a visualizadores de desktop e indexadores do GNOME Tracker.
3. **Travamento de Concorrência SQLite:** Arquivos WAL e SHM podem ser corrompidos se sincronizados por softwares de nuvem ou backup em tempo real enquanto o app estiver em execução.

