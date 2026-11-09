# 🏛️ Auditoria de Instalação, Executáveis e Lançadores Nativo
## ASPPIBRA-DAO DevOS Desktop

**Data:** 05/11/2026  
**Auditor:** ASPPIBRA DevOS Engine  
**Referência:** Fase 5 da Ordem 5.3  

---

## 1. Mapeamento de Executáveis e Binários Compilados

A varredura completa do disco e da árvore do projeto localizou os seguintes binários:

| Localização Físico-Relativa | Caminho Absoluto Real | Tipo de Build | Tamanho | Data de Modificação | Status |
|---|---|---|---|---|---|
| `src-tauri/target/debug/app` | `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/target/debug/app` | ELF 64-bit LSB (Debug) | ~796 MB | 04/11/2026 16:24 | ✅ Binário funcional compilado |
| `src-tauri/target/release/app` | `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/target/release/app` | Release | — | — | ❌ Inexistente (Não compilado) |
| `src-tauri/target/release/bundle` | `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/target/release/bundle` | Pacotes (.deb, AppImage) | — | — | ❌ Inexistente |
| `/usr/bin/devos` | `/usr/bin/devos` | Sistema Global | — | — | ❌ Inexistente |
| `~/.local/bin/devos` | `/home/sandro/.local/bin/devos` | Usuário Local | — | — | ❌ Inexistente |

---

## 2. Inspeção de Pacotes e Instalações do Sistema Operacional

1. **Pacotes DEB / RPM:**
   - Consulta ao gerenciador `dpkg -l | grep -i aspp` e `dpkg -l | grep -i devos` retorna vazio.
   - Não há pacote instalado no sistema operacional.
2. **Entradas no Menu de Aplicativos (`.desktop`):**
   - Diretórios `/usr/share/applications` e `~/.local/share/applications` não possuem nenhuma entrada registrada para DevOS ou ASPPIBRA.
3. **AppImage:**
   - Não foram localizados arquivos `.AppImage` no diretório HOME, Documentos ou Downloads.

---

## 3. Análise dos Scripts de Execução no `package.json`

O arquivo `package.json` define os seguintes comandos operacionais:

```json
{
  "scripts": {
    "tauri:node:dev": "GDK_BACKEND=x11 tauri dev --config src-tauri/tauri.node.conf.json",
    "tauri:admin:dev": "GDK_BACKEND=x11 tauri dev --config src-tauri/tauri.cockpit.conf.json",
    "tauri:cockpit:dev": "GDK_BACKEND=x11 tauri dev --config src-tauri/tauri.cockpit.conf.json",
    "tauri:node:build": "tauri build --config src-tauri/tauri.node.conf.json",
    "tauri:admin:build": "tauri build --config src-tauri/tauri.cockpit.conf.json",
    "tauri:cockpit:build": "tauri build --config src-tauri/tauri.cockpit.conf.json"
  }
}
```

> **Alerta de Conformidade com a Seção 3.1 da Ordem 1:**  
> A regra estabelece: *"Não utilizar pnpm dev ou comandos de desenvolvimento como lançador de produção. Não criar atalhos apontando para executáveis inexistentes. Se não existir uma instalação ou build executável apropriado, documentar a pendência e não criar um atalho enganoso."*

---

## 4. Avaliação Técnica do Lançador da Área de Trabalho

Para a implantação futura do atalho `ASPPIBRA-DAO DevOS.desktop`, existem duas opções técnicas:

### Opção A: Utilizar o Binário Nativo Existente (Recomendado para Prévia Imediata)
- **Executável:** `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/target/debug/app`
- **Vantagens:** É um executável nativo ELF real, não depende de servidor Vite ativo (`pnpm dev`), abre o Webview oficial do Tauri v2 diretamente e já está compilado no disco.
- **Desvantagens:** Tamanho do arquivo não otimizado (~796 MB com símbolos de debug).

### Opção B: Gerar Build de Produção Oficial (`tauri build`)
- **Comando:** `pnpm run tauri:cockpit:build` (ou `tauri:node:build`)
- **Resultado:** Gerará o binário stripped em `src-tauri/target/release/app` (~30-50 MB) e o pacote `.deb` / `AppImage` em `src-tauri/target/release/bundle/`.
- **Recomendação:** Deve ser realizada em uma etapa posterior mediante autorização expressa, pois a presente ordem veta compilações e alterações de build.

---

## 5. Diretriz para a Próxima Ordem

Quando autorizada a criação do atalho `.desktop`, o lançador deverá referenciar o binário nativo existente (`/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/target/debug/app`), com o ícone oficial `src-tauri/icons/icon.png`, sem acionar ferramentas de desenvolvimento Node.js.

