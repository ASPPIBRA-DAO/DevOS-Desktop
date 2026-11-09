# 🏛️ Auditoria do Nó IPFS Local e Armazenamento Descentralizado
## Estado de Instalação, Daemon Kubo, Portas, Repositório e Serviços Rust

**Data:** 05/11/2026  
**Auditor:** ASPPIBRA DevOS Engine  
**Referência:** Fase 8 da Ordem 5.3  

---

## 1. Arquitetura da Integração IPFS no DevOS Desktop

O DevOS Desktop implementa uma camada completa de orquestração do **Kubo (IPFS oficial em Go)** através do módulo nativo Rust localizado em `src-tauri/src/modules/ipfs/`:

1. **Controlador de Ciclo de Vida do Daemon ([daemon.rs](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src-tauri/src/modules/ipfs/daemon.rs)):**
   - **Políticas de Segurança:** Nunca executa chamadas via shell (`sh -c` ou `bash -c`). Invoca binários diretamente com argumentos estritos.
   - **Verificação de Concorrência:** Testa se a porta `127.0.0.1:5001` (API RPC) já está em uso antes de tentar qualquer inicialização de processo.
   - **Preservação de Processos Externos:** Se um nó IPFS externo já estiver em execução na máquina do usuário, o DevOS conecta-se a ele como cliente sem tentar encerrá-lo ou reiniciar o serviço.
2. **Cliente RPC Kubo ([client.rs](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src-tauri/src/modules/ipfs/client.rs)):**
   - Comunicação via chamadas HTTP locais na API `http://127.0.0.1:5001/api/v0/`.
   - Suporte a verificação de versão, ID do nó (`/id`), adição de arquivos multipart (`/add`), download (`/cat`) e pinning (`/pin/add`, `/pin/rm`).
3. **Gerenciador de Pinning ([pinning.rs](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src-tauri/src/modules/ipfs/pinning.rs)):**
   - Suporte a serviços remotos de pinning compatíveis com a especificação IPFS Pinning Service API (PSA).

---

## 2. Inspeção Técnica do Ambiente Local

A auditoria de rede e processos realizada no sistema operacional revelou os seguintes dados reais:

| Item Auditado | Comando / Teste | Resultado Comprovado | Situação |
|---|---|---|---|
| **Binário Kubo / IPFS** | `which ipfs kubo` | Nenhum executável retornado no PATH | `NÃO INSTALADO` |
| **Porta RPC 5001** | `ss -tulpn \| grep 5001` | Nenhuma porta aberta | `OFFLINE` |
| **Porta Gateway 8080** | `ss -tulpn \| grep 8080` | Nenhuma porta aberta | `OFFLINE` |
| **Processo Ativo** | `pgrep -x ipfs; pgrep -x kubo` | Nenhum processo em execução | `INATIVO` |
| **Repositório Físico Canônico** | `~/.local/share/devos/ipfs` | Diretório ainda não criado | `NÃO INICIALIZADO` |
| **Peer ID Local** | API RPC `/id` | Inexistente (Daemon offline) | `NÃO DISPONÍVEL` |
| **Integração Frontend** | [src/modules/ipfs](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src/modules/ipfs) | Telas e cards de telemetria prontos | `IMPLEMENTADO NA UI` |

---

## 3. Caminho Canônico do Repositório IPFS no DevOS

Conforme definido no método `DaemonManager::get_dedicated_devos_repo_dir()` ([daemon.rs, linha 46](file:///home/sandro/Área%20de%20trabalho/App%20Desktop/DevOS-Desktop/src-tauri/src/modules/ipfs/daemon.rs#L46)), o diretório de dados canônico dedicado para o repositório IPFS do DevOS é:

```text
/home/sandro/.local/share/devos/ipfs/
```

Caso a variável de ambiente `IPFS_PATH` esteja definida pelo usuário, o DevOS a respeita como caminho preferencial.

---

## 4. Diretriz de Não-Interferência para a Implantação do Workspace

Conforme a **Seção 7 da Ordem**:
1. **NÃO INICIALIZAR O DAEMON IPFS** nesta auditoria ou na primeira apresentação do Workspace.
2. **NÃO GERAR PEER ID FICTÍCIO** nem chaves criptográficas simuladas de nó.
3. A pasta `DevOS/04 - REDE IPFS/` na Área de Trabalho conterá as subpastas `Conteúdos/` e `Configuração/`, acompanhadas de um `LEIA-ME.md` didático explicando as quatro categorias conceituais:
   - **Arquivos Locais:** Dados armazenados exclusivamente no disco do usuário.
   - **Conteúdos Publicados:** Arquivos indexados com CID (Content Identifier) distribuídos sob demanda.
   - **Conteúdos Pinados:** Arquivos que o nó operador se compromete a manter retidos localmente.
   - **Conteúdos Privados Criptografados:** Arquivos cifrados antes do upload para a rede.

