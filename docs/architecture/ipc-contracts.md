# Contratos IPC e Integração Frontend-Backend (Tauri v2)

Este documento estabelece a especificação arquitetural oficial dos contratos de comunicação IPC (Inter-Process Communication) entre a camada de apresentação React/TypeScript e o núcleo nativo Rust/Tauri 2 do **DevOS Desktop**.

---

## 1. Arquitetura de Comunicação e Anti-Corruption Layer

O DevOS Desktop utiliza uma arquitetura em camadas estrita para isolar o código de interface do usuário das particularidades do runtime nativo Tauri.

```
┌─────────────────────────────────────────────────────────────────┐
│                     React 19 / TypeScript UI                    │
│     (Pages, Editions Cockpit/Node, Modules Presentation)        │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Consome bridges tipadas
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│               src/platform/tauri/ (Camada de Integração)         │
│  ├── contracts/        DTOs canônicos, erros e interfaces       │
│  ├── core/             invokeNative() + TauriErrorMapper        │
│  └── [domain]-bridge   Adaptadores de domínio (Anti-Corruption) │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Tauri IPC RPC (MessagePack/JSON)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Rust Tauri v2 Core (src-tauri)                │
│  ├── commands/         Handlers públicos registrados no Tauri   │
│  ├── storage/          SQLite (DevOS Vault & Real Estate)       │
│  ├── wallets/          Criptografia BIP-39/44 e Derivação       │
│  ├── real_estate/      Ingestão e Auditoria XLSX                │
│  └── monitoring/       RPC Clients Multichain                   │
└─────────────────────────────────────────────────────────────────┘
```

### Princípios Arquiteturais Fundamentais:
1. **Anti-Corruption Layer (ACL) Absoluto**: A biblioteca `@tauri-apps/api/core` é importada exclusivamente em `src/platform/tauri/core/invoke.ts`. Nenhuma tela, componente, hook ou serviço pode invocar o Tauri diretamente.
2. **Separação entre Contratos (DTOs) e Adaptadores (Bridges)**: Todos os tipos de payload de entrada e resposta residem na pasta canônica `src/platform/tauri/contracts/`. As bridges são responsáveis por expor métodos funcionais limpos, abstrair o transporte e tratar valores nulos ou fallbacks quando executado em modo web.
3. **Imutabilidade e Menor Privilégio**: As permissões são concedidas por capabilities granulares no Tauri v2 (`capabilities/`). A existência de um comando ou de um tipo TypeScript não concede autorização automática de execução à janela.

---

## 2. Inventário Completo dos Comandos Tauri v2

O backend Rust registra **21 comandos nativos** organizados em 5 submódulos de comandos.

| # | Comando Tauri Público | Módulo Rust | Função Rust | Bridge TypeScript | Capability Tauri v2 |
|---|-----------------------|-------------|-------------|-------------------|---------------------|
| 1 | `get_device_status` | `commands::system_commands` | `get_device_status` | `SystemBridge.getDeviceStatus()` | `default.json` |
| 2 | `get_vault_status` | `commands::vault_commands` | `get_vault_status` | `VaultBridge.getStatus()` | `default.json` |
| 3 | `init_master_password` | `commands::vault_commands` | `init_master_password` | `VaultBridge.initMasterPassword()` | `default.json` |
| 4 | `unlock_vault` | `commands::vault_commands` | `unlock_vault` | `VaultBridge.unlock()` | `default.json` |
| 5 | `export_authorized_secret` | `commands::vault_commands` | `export_authorized_secret` | `VaultBridge.exportAuthorizedSecret()` | `default.json` |
| 6 | `export_vault_backup` | `commands::vault_commands` | `export_vault_backup` | `VaultBridge.exportBackup()` | `default.json` |
| 7 | `restore_vault_backup` | `commands::vault_commands` | `restore_vault_backup` | `VaultBridge.restoreBackup()` | `default.json` |
| 8 | `generate_seed_and_preview` | `commands::wallet_commands` | `generate_seed_and_preview` | `WalletBridge.generateSeedAndPreview()` | `default.json` |
| 9 | `reveal_pending_mnemonic` | `commands::wallet_commands` | `reveal_pending_mnemonic` | `WalletBridge.revealPendingMnemonic()` | `default.json` |
| 10 | `cancel_pending_creation` | `commands::wallet_commands` | `cancel_pending_creation` | `WalletBridge.cancelPendingCreation()` | `default.json` |
| 11 | `confirm_and_save_wallets` | `commands::wallet_commands` | `confirm_and_save_wallets` | `WalletBridge.confirmAndSaveWallets()` | `default.json` |
| 12 | `list_stored_wallets` | `commands::wallet_commands` | `list_stored_wallets` | `WalletBridge.listStoredWallets()` | `default.json` |
| 13 | `fetch_wallet_balance` | `commands::monitoring_commands` | `fetch_wallet_balance` | `MonitoringBridge.fetchWalletBalance()` | `default.json` |
| 14 | `batch_fetch_wallet_balances` | `commands::monitoring_commands` | `batch_fetch_wallet_balances` | `MonitoringBridge.batchFetchWalletBalances()` | `default.json` |
| 15 | `get_real_estate_stats` | `commands::real_estate_commands` | `get_real_estate_stats` | `RealEstateBridge.getStats()` | `cockpit-real-estate.json` |
| 16 | `preview_real_estate_import` | `commands::real_estate_commands` | `preview_real_estate_import` | `RealEstateBridge.previewImport()` | `cockpit-real-estate.json` |
| 17 | `execute_real_estate_import` | `commands::real_estate_commands` | `execute_real_estate_import` | `RealEstateBridge.executeImport()` | `cockpit-real-estate.json` |
| 18 | `list_import_batches` | `commands::real_estate_commands` | `list_import_batches` | `RealEstateBridge.listBatches()` | `cockpit-real-estate.json` |
| 19 | `list_audit_findings` | `commands::real_estate_commands` | `list_audit_findings` | `RealEstateBridge.listFindings()` | `cockpit-real-estate.json` |
| 20 | `list_properties` | `commands::real_estate_commands` | `list_properties` | `RealEstateBridge.listProperties()` | `cockpit-real-estate.json` |
| 21 | `select_spreadsheet_file` | `commands::real_estate_commands` | `select_spreadsheet_file` | `RealEstateBridge.selectFile()` | `cockpit-real-estate.json` |

---

## 3. Matriz Detalhada de Contratos e DTOs

### 3.1. Sistema Host (`system-contracts.ts`)
- **Comando**: `get_device_status`
- **Entrada**: Nenhuma
- **Retorno Rust**: `Result<DeviceStatusResponse, String>`
- **Serialização**: `{ enrolled: bool, status: String }`
- **Contrato TS**: `DeviceStatusResponse`

### 3.2. Cofre Criptográfico (`vault-contracts.ts`)
- **`get_vault_status`**: Retorna `VaultStatus` contendo `{ is_initialized, is_unlocked, dao_wallets_count, client_wallets_count }`.
- **`init_master_password`**: Recebe `{ masterPassword: string }`, retorna `boolean`.
- **`unlock_vault`**: Recebe `{ masterPassword: string }`, retorna `boolean`.
- **`export_authorized_secret`**: Recebe `{ masterPassword: string, vaultId: string }`, retorna a frase mnemônica cifrada autorizada.
- **`export_vault_backup`**: Recebe `{ masterPassword: string, destinationPath: string }`, retorna `number` (bytes gravados).
- **`restore_vault_backup`**: Recebe `{ masterPassword: string, sourcePath: string }`, retorna `boolean`.

### 3.3. Carteiras Digitais (`wallet-contracts.ts`)
- **`generate_seed_and_preview`**:
  - **Entrada**: `GenerateSeedOptions` (`wordCount`, `target`, `accountBranch`, `count`, `baseLabel`, `network`).
  - **Retorno**: `GeneratePreviewResponse` (`session_id`, `words_count`, `previews`). O segredo nunca transita em texto puro nesta etapa; permanece protegido em memória com Zeroize no Rust.
- **`confirm_and_save_wallets`**:
  - **Entrada**: `SaveWalletsRequest` (`master_password`, `session_id`, `target`, `network`, `previews`, etc.).
  - **Retorno**: `StoredWallet[]`.
- **`list_stored_wallets`**: Retorna array com todas as carteiras locais armazenadas.

### 3.4. Monitoramento Multichain (`monitoring-contracts.ts`)
- **`fetch_wallet_balance`**: Recebe `address`, `network`, opcional `tokenSymbol`. Retorna `WalletBalanceReport`.
- **`batch_fetch_wallet_balances`**: Recebe `BalanceQueryItem[]`. Retorna `WalletBalanceReport[]`.

### 3.5. Cadastro Imobiliário e Auditoria (`real-estate-contracts.ts`)
- **`get_real_estate_stats`**: Retorna `RealEstateStats` (total de imóveis, lotes, pendências, caminho do banco SQLite).
- **`preview_real_estate_import`**: Recebe `filePath`, `sheetName?`. Retorna `XlsxPreviewReport` com contagens prévias, hash SHA-256 e detecção de planilhas.
- **`execute_real_estate_import`**: Recebe `filePath`, `sheetName`, `rowLimit?`. Retorna `ImportExecutionReport`.
- **`list_import_batches`**: Retorna `ImportBatchSummary[]`.
- **`list_audit_findings`**: Retorna `AuditFindingSummary[]`.
- **`list_properties`**: Retorna `PropertySummary[]`.
- **`select_spreadsheet_file`**: Dispara caixa de diálogo nativa do SO e retorna caminho selecionado.

---

## 4. Avaliação Técnica do Tauri Specta (Decisão Arquitetural)

### Contexto da Avaliação
Foi avaliada a adoção da biblioteca `tauri-specta` para geração automática de bindings TypeScript a partir do código Rust.

### Fatores Críticos Analisados:
1. **Maturidade das Versões**: O `tauri-specta` para Tauri v2 encontra-se em estágio de pré-lançamento (`2.0.0-rc.*`). A adoção de release candidates em código de custódia e segurança financeira viola os critérios de estabilidade do projeto.
2. **Invasividade no Registro de Comandos**: O `tauri-specta` substitui o mecanismo padrão `tauri::generate_handler![]` por um builder proprietário (`ts.into_plugin()` ou `collect_commands!`), alterando a inicialização em `lib.rs` e aumentando o risco de regressão com o carregamento de plugins oficiais (como `tauri-plugin-dialog`, `opener`, etc.).
3. **Acoplamento Multi-Edição (Cockpit vs Node)**: No DevOS Desktop, comandos específicos (como `real_estate`) são restritos por capabilities à edição Cockpit. O Tauri Specta gera um arquivo de bindings monolítico que mistura comandos de todas as edições, quebrando o isolamento de tipos e criando falsas expectativas de disponibilidade em janelas que não possuem privilégios.
4. **Erros Customizados**: O Specta exige derivações complexas de `specta::Type` em tipos de erro nativos, frequentemente exigindo conversões intermediárias ou mascarando detalhes de erro.

### Decisão Arquitetural:
> **Decisão**: **Manter a arquitetura de contratos TypeScript explícitos canônicos em `src/platform/tauri/contracts/`, sincronizados com os tipos Rust e validados por suítes de testes automatizados (`ipc-contracts.spec.ts`).**
> 
> Essa abordagem garante:
> - Máxima estabilidade operacional e independência de dependências externas experimentais.
> - Estrita aderência ao padrão do Tauri 2 sem customização de builders.
> - Facilidade de auditoria e governança através de tipagem canônica e testes unitários/integrados.

---

## 5. Política e Tratamento de Erros IPC

Para garantir que informações confidenciais (senhas mestre, frases mnemônicas, chaves privadas) nunca sejam expostas em logs, notificações ou interfaces, foi estabelecida uma política unificada de tratamento de erros nativos:

1. **Classe `IpcError`**:
   - Encapsula a mensagem de erro, código de erro categorizado (`IpcErrorCode`), comando de origem e timestamp.
   - **Sanitização Ativa (Redaction)**: O construtor sanitiza a mensagem automaticamente via expressões regulares, substituindo frases mnemônicas por `[REDACTED_SECRET]` e credenciais/senhas por `[REDACTED_CREDENTIAL]`.
2. **`TauriErrorMapper.normalize()`**:
   - Classifica erros nativos em categorias padronizadas:
     - `VALIDATION_ERROR`: Falhas de validação de argumentos ou formato de endereço.
     - `NOT_FOUND_ERROR`: Registros inexistentes no banco SQLite local.
     - `PERMISSION_DENIED_ERROR`: Violação de capabilities ou restrições de segurança do Tauri.
     - `STORAGE_ERROR`: Falhas de escrita ou transação em banco SQLite.
     - `CRYPTO_ERROR`: Senha incorreta ou falha de decifragem Argon2id/ChaCha20-Poly1305.
     - `IPC_TRANSPORT_ERROR`: Falhas de comunicação no canal IPC.
     - `BUSINESS_ERROR`: Demais exceções de regras de negócio.

---

## 6. Governança para Novos Comandos IPC

Ao adicionar um novo comando IPC no DevOS Desktop, o desenvolvedor deve obrigatoriamente seguir o fluxo abaixo:

1. **Rust Backend**:
   - Implementar a função em `src-tauri/src/commands/[dominio]_commands.rs` com a anotação `#[tauri::command]`.
   - Garantir que structs de entrada e saída derivem `serde::Serialize` e `serde::Deserialize` com convenção `camelCase` ou `snake_case` compatível.
   - Registrar o comando no vetor do Tauri em `src-tauri/src/lib.rs`.
   - Declarar a permissão em `src-tauri/capabilities/`.
2. **TypeScript Frontend**:
   - Adicionar os DTOs em `src/platform/tauri/contracts/[dominio]-contracts.ts`.
   - Expor o método tipado na bridge correspondente em `src/platform/tauri/[dominio]/[dominio]-bridge.ts`.
   - Reexportar os contratos públicos em `src/platform/tauri/contracts/index.ts` e `src/platform/tauri/index.ts`.
3. **Testes e Validação**:
   - Adicionar caso de teste em `src/test/ipc-contracts.spec.ts`.
   - Executar a matriz de qualidade: `pnpm check:arch`, `pnpm lint`, `pnpm ts:check`, `pnpm test`, `cargo test`.
