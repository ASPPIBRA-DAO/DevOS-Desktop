# 🏛️ Plano de Diretórios do DevOS Workspace na Área de Trabalho
## Estrutura Beta 1.0, Permissões, Políticas de Preservação e Isolamento

**Data:** 05/11/2026  
**Auditor:** ASPPIBRA DevOS Engine  
**Referência:** Fase 9 da Ordem 5.3  

---

## 1. Localização Real e Caminhos Canônicos no Linux

A verificação do sistema comprovou que o GNOME utiliza diretórios localizados em língua portuguesa:

- **Área de Trabalho Real do Usuário:**  
  `/home/sandro/Área de trabalho/`
- **Caminho Absoluto Canônico do DevOS Workspace:**  
  `/home/sandro/Área de trabalho/DevOS/`

> **Compatibilidade e Permissões:**  
> O diretório pertencerá exclusivamente ao usuário `sandro:sandro` (UID: 1000, GID: 1000).  
> Permissões padrão recomendadas:  
> • Diretórios: `0755` (`rwxr-xr-x`)  
> • Arquivos Markdown explicativos: `0644` (`rw-r--r--`)  
> **É estritamente proibido o uso de permissões globais permissivas como `0777`.**

---

## 2. Árvore Estrutural Completa do DevOS Workspace Beta 1.0

```text
/home/sandro/Área de trabalho/
│
├── 🏛️ ASPPIBRA-DAO DevOS.desktop          (Lançador do Aplicativo Nativo)
├── 🌐🔒 Minha Identidade DevOS.desktop      (Lançador para 01 - IDENTIDADE DIGITAL)
├── 📁 Meu Workspace DevOS.desktop          (Lançador para a pasta DevOS)
│
└── 📁 DevOS/
    │
    ├── 00 - INFORMAÇÕES/
    │   ├── LEIA-ME.md                      (Guia simples para o usuário não-técnico)
    │   ├── ESTRUTURA-DO-DEVOS.md           (Especificação técnica para desenvolvedores)
    │   └── LOCAL-DATABASE-INVENTORY.md     (Inventário e rastreio dos bancos físicos)
    │
    ├── 01 - IDENTIDADE DIGITAL/
    │   └── LEIA-ME.md                      (Explicação da Wallet Genesis e status do .dvcert)
    │
    ├── 02 - COFRE CRIPTOGRÁFICO/
    │   └── LEIA-ME.md                      (Custódia de chaves, Argon2 e permissões 0600)
    │
    ├── 03 - DADOS LOCAIS/
    │   ├── Cadastro Imobiliário/           (Espaço reservado para exportações cadastrais)
    │   ├── Dados Operacionais/             (Dados operacionais de nós)
    │   ├── Metadados/                      (Metadados públicos locais)
    │   └── LEIA-ME.md                      (Orientações sobre dados locais vs D1/nuvem)
    │
    ├── 04 - REDE IPFS/
    │   ├── Conteúdos/                      (Arquivos destinados a publicação/pinning)
    │   ├── Configuração/                   (Configurações de rede e bootstrap)
    │   └── LEIA-ME.md                      (Didática sobre CIDs, nós e pinning)
    │
    ├── 05 - DOCUMENTOS/
    │   ├── Contratos/                      (Contratos de Cessão de Posse gerados)
    │   ├── Extratos/                       (Extratos emitidos pelo Livro-Razão)
    │   ├── Relatórios/                     (Relatórios de auditoria e telemetria)
    │   ├── Comprovantes/                   (Recibos e comprovantes operacionais)
    │   └── LEIA-ME.md                      (Informações sobre emissão documental)
    │
    ├── 06 - SINCRONIZAÇÃO/
    │   ├── Pendentes/                      (Transações em fila offline)
    │   ├── Histórico/                      (Log de eventos sincronizados)
    │   └── LEIA-ME.md                      (Comportamento do motor de sincronização)
    │
    └── 07 - BACKUPS/
        └── LEIA-ME.md                      (Procedimentos e integridade de backups)
```

---

## 3. Política de Organização e Fronteiras de Segurança

| Categoria de Dado | Onde Deve Ficar | Justificativa Técnica |
|---|---|---|
| **Bancos SQLite Ativos** (`devos_vault.sqlite`, `real_estate.sqlite`) | `~/.local/share/br.aspp.devos.cockpit/` | Devem permanecer no caminho protegido do Tauri v2 para evitar corrupção por concorrência de I/O e exposição a indexadores do GNOME. |
| **Chaves Privadas e Sementes BIP-39** | Cifradas dentro do Vault | **Nunca** devem ser gravadas em arquivos texto na Área de Trabalho. |
| **Certificado Digital `.dvcert`** | `01 - IDENTIDADE DIGITAL/` | Quando houver emissão criptográfica real pelo módulo de identidade. Enquanto não houver, a pasta permanece vazia de chaves, contendo apenas o `LEIA-ME.md`. |
| **Minutas e PDFs Typst** | `05 - DOCUMENTOS/Contratos/` | Documentos contratuais exportados pelo usuário podem ser armazenados diretamente aqui para consulta visual. |
| **Backups Cifrados Exportados** | `07 - BACKUPS/` | Apenas cópias de segurança criptografadas explicitamente geradas pelo comando de exportação do Vault. |

---

## 4. Avaliação de Riscos Operacionais

1. **Sincronizadores de Nuvem Terceiros (ex: Dropbox, OneDrive, Google Drive):**  
   Ao manter os bancos ativos em `~/.local/share`, eliminamos o risco crítico de conflitos de gravação em arquivos `.sqlite-wal`.
2. **Espaço em Disco:**  
   O sistema possui 5,5 GB disponíveis na partição principal, volume suficiente para a estrutura de pastas e documentos explicativos da Beta 1.0.

