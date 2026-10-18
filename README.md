# DevOS Desktop — ASPPIBRA DAO

> **Aplicação Desktop Nativa Institucional com IPFS & Rede de Pinning Descentralizada (Tauri v2 + Rust Core)**

---

## 🏛️ Visão Geral

O **DevOS Desktop** é o cliente nativo oficial do ecossistema **ASPPIBRA DAO**, projetado para oferecer operação de nós soberanos, gerenciamento de cofres criptográficos locais (BIP-44), telemetria em tempo real e integração com a rede descentralizada IPFS (Kubo Sidecar).

Construído sob os princípios de **Clean Architecture**, o projeto garante estrita separação entre regras de domínio puras, orquestração de aplicação, bridges de plataforma nativa e interfaces visuais responsivas.

---

## ⚡ Arquitetura Multi-Edição

O sistema utiliza compilação condicional no Rust Core e *physical tree-shaking* no bundler Vite para gerar dois executáveis desktop totalmente isolados:

* 🌐 **DevOS Node (`br.aspp.devos.node`)**: Edição pública para membros da rede e operadores de nó IPFS, com foco em telemetria, recompensas de pinning e sincronização de dados distribuídos.
* 🎛️ **DevOS Cockpit (`br.aspp.devos.cockpit`)**: Edição operacional para gestão de infraestrutura, supervisão de nós e administração da DAO.

---

## 🛠️ Stack Tecnológico

| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Native Core** | **Rust 2021 + Tauri v2** | Execução de alta performance, cofre local AEAD com derivação BIP-44 e persistência SQLite |
| **Frontend Framework** | **React 19 + TypeScript** | Renderização reativa de última geração com tipagem estrita de ponta a ponta |
| **Design System** | **Material-UI v9 (Dark Theme)** | Interface institucional dark com estética cibernética (`cyber-card`, `cyber-button`, `edger-lights`) |
| **Tooling & Bundler** | **Vite 8 + PNPM 10** | HMR ultra-rápido, tree-shaking multi-alvo e build determinístico |
| **Enforcement Arquitetural** | **Dependency-Cruiser** | Validação estática de pureza modular com barreira contra ciclos circulares |

---

## 🚀 Como Executar

### Pré-requisitos
* **Node.js**: `>= 20.0.0`
* **PNPM**: `>= 10.0.0`
* **Rust**: Toolchain estável atualizada (`rustc`, `cargo`)
* Dependências nativas do Tauri v2 para sua distribuição Linux/Desktop.

### Instalação
```bash
# Instalar dependências do workspace
pnpm install
```

### Desenvolvimento Frontend (Navegador)
```bash
# Iniciar frontend na edição Node
pnpm run dev:node

# Iniciar frontend na edição Cockpit
pnpm run dev:cockpit
```

### Desenvolvimento Desktop Nativo (Tauri v2)
```bash
# Executar a janela nativa na edição Node
pnpm run tauri:node:dev

# Executar a janela nativa na edição Cockpit
pnpm run tauri:cockpit:dev
```

---

## 🧪 Validação & Garantia de Qualidade

O projeto adota padrões rigorosos de integridade antes de qualquer commit:

```bash
# 1. Verificação estática de tipos TypeScript
pnpm run ts:check

# 2. Verificação de pureza e arquitetura limpa (Clean Architecture)
pnpm run check:arch

# 3. Testes unitários do núcleo Rust (Cofre e Armazenamento)
cd src-tauri && cargo test
```

---

## 🛡️ Segurança & Blindagem

* **Zero-Trust**: Nenhuma chave privada ou segredo trafega desprotegido na camada de visualização.
* **Cofre Criptográfico**: Derivação de chaves via Argon2id / AES-256-GCM no nível do sistema operacional.
* **Isolamento de IPC**: Comandos expostos ao frontend passam por listas de permissões explícitas no Tauri v2.

---

## 📄 Licença

Propriedade do ecossistema **ASPPIBRA DAO**. Todos os direitos reservados.
