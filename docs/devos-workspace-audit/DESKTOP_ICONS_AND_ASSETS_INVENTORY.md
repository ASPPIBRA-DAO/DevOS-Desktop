# 🏛️ Inventário de Ícones e Identidade Visual do DevOS
## Catálogo de Assets, Resoluções e Mapeamento para os 3 Lançadores

**Data:** 05/11/2026  
**Auditor:** ASPPIBRA DevOS Engine  
**Referência:** Fases 4 e 10 da Ordem 5.3  

---

## 1. Catálogo dos Ícones e Assets Existentes no Repositório

A auditoria dos diretórios `src-tauri/icons/` e `public/` catalogou todos os ativos visuais disponíveis no projeto:

| Identificador Visual | Arquivo Físico | Dimensão | Formato | Utilização Atual | Pode ser Reutilizado? |
|---|---|---|---|---|---|
| **Logo Oficial DevOS** | `src-tauri/icons/icon.png` | 512 × 512 | PNG (RGBA) | Ícone principal Tauri / Janela | ✅ **Sim** (Lançador 1) |
| **Ícone HD DevOS** | `src-tauri/icons/128x128@2x.png` | 256 × 256 | PNG (RGBA) | Bundle Tauri Desktop | ✅ Sim |
| **Ícone Médio DevOS** | `src-tauri/icons/128x128.png` | 128 × 128 | PNG (RGBA) | Bundle Tauri Desktop | ✅ Sim |
| **Favicon / Tray** | `src-tauri/icons/32x32.png` | 32 × 32 | PNG (RGBA) | Barra de títulos e tarefas | ✅ Sim |
| **Globo Institucional SVG** | `src-tauri/icons/devos-globe.svg` | Vetorial | SVG (UTF-8) | Identidade ASPPIBRA-DAO | ✅ **Sim** (Lançador 2) |
| **Globo Rede DePIN SVG** | `src-tauri/icons/GisGlobeO.svg` | Vetorial | SVG (ASCII) | Logo da barra superior / Web | ✅ Sim |
| **Logo Único** | `public/logo/logo-single.svg` | Vetorial | SVG | Cabeçalho e componentes | ✅ Sim |
| **Pasta Institucional** | `public/assets/icons/files/ic-folder.svg` | Vetorial | SVG | Gerenciador de arquivos web | ✅ **Sim** (Lançador 3) |
| **Cadeado de Segurança** | Ícones `@iconify/react` (`solar:lock-bold`) | Vetorial | Código React | Interfaces de autenticação | 🟡 Disponível apenas em runtime Web |
| **Identidade IPFS** | Ícones `@iconify/react` (`solar:server-path-bold`) | Vetorial | Código React | Visão IPFS | 🟡 Disponível apenas em runtime Web |

---

## 2. Mapeamento dos Três Lançadores da Área de Trabalho

Para a implantação futura dos atalhos `.desktop`, os seguintes arquivos de imagem serão vinculados:

### Lançador 1 — 🏛️ ASPPIBRA-DAO DevOS
- **Nome do Arquivo:** `ASPPIBRA-DAO DevOS.desktop`
- **Função:** Iniciar o aplicativo nativo Tauri.
- **Ícone Vinculado:**  
  `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/icons/icon.png` (512x512 PNG de alta fidelidade).
- **Compatibilidade GNOME:** Reconhecido nativamente por qualquer desktop Linux XDG.

### Lançador 2 — 🌐🔒 Minha Identidade DevOS
- **Nome do Arquivo:** `Minha Identidade DevOS.desktop`
- **Função:** Abrir o diretório de identidade digital (`01 - IDENTIDADE DIGITAL`) via `xdg-open`.
- **Ícone Vinculado:**  
  `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/src-tauri/icons/devos-globe.svg`.
- **Conceito Visual:** Representa o Globo institucional da ASPPIBRA-DAO em rede segura.

### Lançador 3 — 📁 Meu Workspace DevOS
- **Nome do Arquivo:** `Meu Workspace DevOS.desktop`
- **Função:** Abrir diretamente a pasta raiz `/home/sandro/Área de trabalho/DevOS` no gerenciador de arquivos GNOME Files (`nautilus`).
- **Ícone Vinculado:**  
  `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/public/assets/icons/files/ic-folder.svg`.

---

## 3. Diretriz de Conformidade

- **Nenhum arquivo de imagem foi gerado ou alterado** nesta ordem de auditoria.
- Todos os recursos mapeados já existem no repositório oficial e possuem resolução adequada para exibição nítida na Área de Trabalho do GNOME.

