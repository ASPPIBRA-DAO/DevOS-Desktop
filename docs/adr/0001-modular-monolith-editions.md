# ADR 0001: Monólito Modular com Múltiplas Edições (Cockpit & Node)

**Status:** Aprovado  
**Data:** 2026-10-24  
**Decisores:** Time de Engenharia ASPPIBRA DAO  

---

## Contexto

O DevOS Desktop atende a dois perfis de público distintos com requisitos operacionais e de segurança divergentes:
1. **Operadores de Nós (Edição Node):** Usuários que mantêm nós IPFS, monitoram conectividade e necessitam de uma interface leve, segura e focada em operações de rede e custódia básica de carteiras.
2. **Fundadores / Gestores / Auditores (Edição Cockpit):** Usuários técnicos que necessitam de ferramentas avançadas, como importação massiva de planilhas cadastrais imobiliárias (arquivos de centenas de milhares de linhas), auditoria de inconsistências e propostas de retificação.

Dividir o projeto em dois repositórios independentes acarretaria duplicação de esforço na manutenção de bridges, componentes visuais (`edger-lights`), cofres locais e rotinas criptográficas.

---

## Decisão

Adota-se a arquitetura de **Monólito Modular Multi-Edição**:
1. Uma única base de código fonte (`src/` e `src-tauri/`).
2. Configurações Tauri dedicadas:
   - `src-tauri/tauri.node.conf.json` (ID: `br.aspp.devos.node`)
   - `src-tauri/tauri.cockpit.conf.json` (ID: `br.aspp.devos.cockpit`)
3. Aliases dinâmicos no Vite:
   - Resolução de `@edition` para `edition.node.ts` ou `edition.cockpit.ts` conforme a flag `--mode`.
   - Saídas de compilação segregadas (`dist-node` e `dist-cockpit`).
4. **Segregação Nativa de Bancos:**
   - O banco `devos_vault.sqlite` é compartilhado por ambas as edições.
   - O banco `real_estate.sqlite` só é inicializado e gerenciado pelo runtime Tauri quando `app.config().identifier == "br.aspp.devos.cockpit"`.

---

## Consequências

### Positivas
- Compartilhamento integral da biblioteca de design (`shared/components`), utilitários e sistema de segurança nativo.
- Menor superfície de ataque na edição Node: o binário e a interface não expõem rotas nem capabilities de importação imobiliária.
- Manutenção centralizada das regras de governança e auditoria do Git (`AGENTS.md`).

### Limitações / Mitigações
- É necessário garantir via CI que ambas as edições sejam compiladas (`pnpm build:node` e `pnpm build:cockpit`) para evitar regressões cruzadas.
