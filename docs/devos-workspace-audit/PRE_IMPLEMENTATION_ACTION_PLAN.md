# 🏛️ Plano de Ação de Pré-Implantação e Matriz de Recomendações
## Diretrizes Operacionais para a Transição à Próxima Ordem

**Data:** 05/11/2026  
**Auditor:** ASPPIBRA DevOS Engine  
**Referência:** Fases 13, 16 e 19 da Ordem 5.3  

---

## 1. Matriz de Recomendações Técnicas

| Item | Situação Atual | Evidência Técnica | Ação Mínima Recomendada | Classificação | Prioridade |
|---|---|---|---|:---:|:---:|
| **Localização dos Bancos** | Resolvidos em `~/.local/share` | `src-tauri/src/lib.rs` | Não mover nem duplicar; referenciar nos docs | **PRESERVAR** | Crítica |
| **Proteção do Vault (0600)** | Permissão restrita no Unix | `local_database.rs:113` | Manter isolamento contra leituras de terceiros | **PRESERVAR** | Crítica |
| **Ícones Institucionais** | Assets em `src-tauri/icons/` | `icon.png`, `devos-globe.svg` | Utilizar caminhos absolutos nos `.desktop` | **REUTILIZAR** | Alta |
| **Componentes de Dashboard** | `CockpitDashboardPage` / `NodeDashboardPage` | `@edition` estático | Manter base unificada; aplicar RBAC na UI | **REUTILIZAR** | Alta |
| **Lançador do Aplicativo** | Binário em `target/debug/app` | ELF 64-bit compilado | Criar `.desktop` apontando para o binário real | **AJUSTAR** | Alta |
| **Pasta DevOS na Área de Trabalho** | Área de Trabalho em pt-BR | `xdg-user-dir DESKTOP` | Criar árvore `00` a `07` com permissão 0755 | **IMPLEMENTAR** | Alta |
| **Documentação Didática (LEIA-ME)** | Inexistente na Área de Trabalho | — | Escrever Markdown explicativo transparente | **IMPLEMENTAR** | Alta |
| **Certificado `.dvcert`** | Não existe no código | Busca exaustiva | Não simular arquivo; documentar como pendente | **DECIDIR** | Média |
| **Wallet Genesis Automática** | Requer ação na UI | `creation_session.rs` | Implementar geração determinística no setup | **DECIDIR** | Média |
| **Nó IPFS Local** | Daemon offline / não instalado | `ss -tulpn` | Manter inativo; apenas criar pastas no Workspace | **AGUARDAR** | Baixa |

---

## 2. Sequência Mínima de Execução para a Próxima Ordem (Implantação da Beta 1.0)

Assim que o usuário autorizar expressamente a execução da implantação da Área de Trabalho, os passos deverão seguir rigorosamente a seguinte ordem cronológica:

### Passo 1: Criação da Estrutura de Pastas na Área de Trabalho Real
1. Criar o diretório raiz `/home/sandro/Área de trabalho/DevOS/` com permissão `0755`.
2. Criar os 8 diretórios funcionais (`00 - INFORMAÇÕES/` até `07 - BACKUPS/`).
3. Criar as subpastas em `03 - DADOS LOCAIS/`, `04 - REDE IPFS/`, `05 - DOCUMENTOS/` e `06 - SINCRONIZAÇÃO/`.

### Passo 2: Geração dos Documentos Explicativos Oficiais
1. `00 - INFORMAÇÕES/LEIA-ME.md`: Apresentação geral do DevOS Workspace para o participante.
2. `00 - INFORMAÇÕES/ESTRUTURA-DO-DEVOS.md`: Especificação arquitetural para desenvolvedores.
3. `00 - INFORMAÇÕES/LOCAL-DATABASE-INVENTORY.md`: O inventário oficial dos bancos SQLite.
4. `01 - IDENTIDADE DIGITAL/LEIA-ME.md`: Explicação da Wallet Genesis e declaração explícita de `STATUS: CONFIGURAÇÃO DE IDENTIDADE EM DESENVOLVIMENTO`.
5. `02 - COFRE CRIPTOGRÁFICO/LEIA-ME.md`: Explicação da custódia segura e das permissões `0600`.
6. `03 - DADOS LOCAIS/LEIA-ME.md`, `04 - REDE IPFS/LEIA-ME.md`, `05 - DOCUMENTOS/LEIA-ME.md`, `06 - SINCRONIZAÇÃO/LEIA-ME.md` e `07 - BACKUPS/LEIA-ME.md`.

### Passo 3: Criação dos Três Lançadores na Área de Trabalho
1. **`ASPPIBRA-DAO DevOS.desktop`:**
   - `Exec=/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/target/debug/app`
   - `Icon=/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/icons/icon.png`
2. **`Minha Identidade DevOS.desktop`:**
   - `Exec=/usr/bin/xdg-open "/home/sandro/Área de trabalho/DevOS/01 - IDENTIDADE DIGITAL"`
   - `Icon=/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/icons/devos-globe.svg`
3. **`Meu Workspace DevOS.desktop`:**
   - `Exec=/usr/bin/xdg-open "/home/sandro/Área de trabalho/DevOS"`
   - `Icon=/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/public/assets/icons/files/ic-folder.svg`
4. Aplicar permissão de execução: `chmod +x` e marcar como confiável no GNOME.

---

## 3. Critérios de Homologação Final

- [ ] A pasta `DevOS/` está visível diretamente na Área de Trabalho em `/home/sandro/Área de trabalho/`.
- [ ] Nenhum banco de dados foi movido ou duplicado.
- [ ] Nenhum arquivo `.dvcert` falso ou chave simulada foi criada.
- [ ] O daemon IPFS não foi disparado sem necessidade.
- [ ] Os três atalhos abrem seus respectivos destinos reais sem erros.

