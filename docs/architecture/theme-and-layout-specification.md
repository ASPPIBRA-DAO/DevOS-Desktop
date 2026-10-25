# 📐 Especificação Técnica Completa: Sistema de Layout, Temas e Estilização
**Documento de Arquitetura de Interface para Agentes de IA & Engenharia Frontend**

Este documento descreve detalhadamente o funcionamento, a hierarquia de componentes, as variáveis CSS, os contratos de dados e o sistema de design (tokens, paletas e tipografia) utilizados no DevOS Desktop e no Dashboard.

---

## 1. Visão Geral da Arquitetura de Layout

A interface adota uma **arquitetura em camadas desacopladas** baseada em Material UI (MUI v6) com **CSS Variables nativas (`CssVarsProvider`)**. O layout é dividido em quatro camadas fundamentais:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        THEME PROVIDER (MUI CssVars)                    │
│   • Injeta tokens globais no DOM (:root, data-color-scheme="dark|light")│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                       LAYOUT SECTION (Orquestrador)                    │
│   • Injeta CSS vars estruturais (--layout-header-height, nav-width)    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                    HEADER SECTION (Cabeçalho)                  │   │
│   │   [Logo / Toggle]         [Searchbar]      [Alerts / Profile]  │   │
│   └────────────────────────────────────────────────────────────────┘   │
│   ┌───────────────────────────────┬────────────────────────────────┐   │
│   │    NAV SECTION (Sidebar)      │     MAIN SECTION (Conteúdo)    │   │
│   │   • Vertical (280px)          │   • Container responsivo       │   │
│   │   • Mini (88px)               │   • Roteamento (Router Outlet) │   │
│   │   • Horizontal (Top)          │                                │   │
│   └───────────────────────────────┴────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                    FOOTER SECTION (Rodapé)                     │   │
│   │   [Copyright / Links / Status da DAO / Redes Sociais]          │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detalhamento do Cabeçalho (`HeaderSection`)

### Arquivo Fonte:
👉 `dashboard/src/layouts/core/header-section.tsx`

### Anatomia e Responsabilidades:
O cabeçalho é um componente flexível, com suporte a efeito de vidro (*glassmorphism* / backdrop-filter blur) e fixação (*sticky* ou *fixed*).

### Slots de Conteúdo (Props):
* **`slots.topArea`**: Área superior opcional (avisos globais, banners de manutenção).
* **`slots.leftArea`**: Lado esquerdo (botão toggle da sidebar + Logo).
* **`slots.centerArea`**: Centro (barra de busca global / breadcrumb).
* **`slots.rightArea`**: Lado direito (seletor de idioma, notificações, carteira, perfil/avatar).
* **`slots.bottomArea`**: Área inferior opcional (menu de abas secundárias).

### Variáveis CSS Injetadas no Cabeçalho:
```css
--layout-header-mobile-height: 64px;
--layout-header-desktop-height: 72px;
--layout-header-blur: 8px;
--layout-header-zIndex: 1101; /* theme.zIndex.appBar + 1 */
```

### Comportamento Responsivo:
* **Mobile (< 900px / `md`):** Altura fixa de 64px, oculta menus horizontais, exibe botão hambúrguer para abrir a gaveta (`NavMobile`).
* **Desktop (≥ 900px / `md`):** Altura de 72px, suporta encolhimento dinâmico no scroll (*offset scroll behavior*).

---

## 3. Detalhamento da Barra de Navegação e Menus (`NavSection`)

### Arquivos Fonte:
* **Sidebar Vertical:** `dashboard/src/layouts/dashboard/nav-vertical.tsx`
* **Sidebar Compacta (Mini):** `dashboard/src/components/nav-section/mini/`
* **Menu Horizontal:** `dashboard/src/layouts/dashboard/nav-horizontal.tsx`
* **Menu Mobile (Drawer):** `dashboard/src/layouts/dashboard/nav-mobile.tsx`

### Contrato de Dados da Navegação (`NavSectionProps`):
Cada item do menu segue rigorosamente este contrato TypeScript:

```typescript
export type NavItemConfig = {
  title: string;              // Rótulo exibido (ex: 'Tesouraria', 'Imóveis')
  path: string;               // Rota URL (ex: '/devos/cadastre')
  icon?: React.ReactNode;     // Ícone SVG / Solar / Iconify
  info?: React.ReactNode;     // Badge lateral (ex: '145k', 'Novo')
  caption?: string;          // Subtítulo descritivo
  disabled?: boolean;         // Desabilitado
  roles?: string[];           // RBAC: Roles permitidas (ex: ['admin', 'auditor'])
  children?: NavItemConfig[]; // Submenus expansíveis (Accordion / Dropdown)
};

export type NavGroupConfig = {
  subheader: string;          // Título da seção (ex: 'CADASTRO IMOBILIÁRIO', 'FINANCEIRO')
  items: NavItemConfig[];
};
```

### Variáveis CSS da Navegação:
```css
--layout-nav-vertical-width: 280px;      /* Largura expandida */
--layout-nav-mini-width: 88px;           /* Largura colapsada */
--layout-nav-mobile-width: 288px;         /* Largura na gaveta mobile */
--layout-nav-zIndex: 1201;               /* theme.zIndex.drawer + 1 */
```

### Comportamentos de Estado da Sidebar:
1. **Expandida (Padrão):** Exibe ícones, rótulos e submenus abertos.
2. **Mini / Colapsada:** Apenas ícones centralizados; ao passar o mouse (*hover*), exibe *popover* flutuante com os itens filhos.
3. **Toggle Persistente:** O estado colapsado/expandido é salvo no `localStorage` do usuário (`settings.navLayout`).

---

## 4. Detalhamento do Rodapé (`Footer`)

### Arquivo Fonte:
👉 `dashboard/src/layouts/main/footer.tsx`

### Estrutura do Rodapé:
* **Bloco Institucional:** Logo da ASPPIBRA DAO, slogan e badges de redes sociais.
* **Bloco de Navegação em Colunas:**
  - *Comunidade:* Governança, Estatuto, Votações, Fórum.
  - *Transparência:* Contratos Inteligentes, Balanços, Auditoria.
  - *Legal:* Termos de Uso, Privacidade (LGPD), Compliance.
* **Linha Final (Bottom Bar):**
  - Copyright perpétuo: `© 2026 ASPPIBRA DAO. Todos os direitos reservados.`
  - Indicador do status da rede (ex: `Mainnet / Nó Local Ativo`).

---

## 5. Sistema de Design, Temas e Tokens (`theme/`)

O sistema foi concebido para suportar alternância perfeita entre **Light Mode** e **Dark Mode** via atributos HTML (`data-color-scheme="dark"`).

### A. Paleta de Cores Mestra
Arquivo: `dashboard/src/theme/theme-config.ts`

| Token | Lighter | Light | **Main (Principal)** | Dark | Darker |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`primary`** | `#C8FAD6` | `#5BE49B` | **`#00A76F`** | `#007867` | `#004B50` |
| **`secondary`** | `#EFD6FF` | `#C684FF` | **`#8E33FF`** | `#5119B7` | `#27097A` |
| **`info`** | `#CAFDF5` | `#61F3F3` | **`#00B8D9`** | `#006C9C` | `#003768` |
| **`success`** | `#D3FCD2` | `#77ED8B` | **`#22C55E`** | `#118D57` | `#065E49` |
| **`warning`** | `#FFF5CC` | `#FFD666` | **`#FFAB00`** | `#B76E00` | `#7A4100` |
| **`error`** | `#FFE9D5` | `#FFAC82` | **`#FF5630`** | `#B71D18` | `#7A0916` |

### B. Cores de Fundo e Superfícies (Dark vs Light)
Arquivo: `dashboard/src/theme/core/palette.ts`

* **Light Mode:**
  - `background.default`: `#FFFFFF`
  - `background.paper`: `#FFFFFF`
  - `background.neutral`: `#F4F6F8`
  - `text.primary`: `#1C252E`
  - `text.secondary`: `#637381`
* **Dark Mode:**
  - `background.default`: `#141A21`
  - `background.paper`: `#1C252E`
  - `background.neutral`: `#28323D`
  - `text.primary`: `#FFFFFF`
  - `text.secondary`: `#919EAB`

### C. Tipografia e Escala de Fontes
Arquivo: `dashboard/src/theme/core/typography.ts`
* **Família Primária:** `'Public Sans Variable', -apple-system, BlinkMacSystemFont, sans-serif`
* **Família Secundária (Headings/Destaques):** `'Barlow', sans-serif`
* **Pesos Disponíveis:** `400 (Regular)`, `500 (Medium)`, `600 (Semi-Bold)`, `700 (Bold)`, `800 (Extra-Bold)`
* **Escala Modular:**
  - `h1`: 64px / line-height: 80px (responsivo: 40px no mobile)
  - `h2`: 48px / line-height: 64px
  - `h3`: 32px / line-height: 48px
  - `h4`: 24px / line-height: 36px
  - `subtitle1`: 16px / line-height: 24px (Semi-Bold)
  - `body1`: 16px / line-height: 24px (Regular)
  - `body2`: 14px / line-height: 22px
  - `caption`: 12px / line-height: 18px

---

## 6. Diretrizes para a Migração e Otimização

Ao migrar ou reescrever a base de estilização em `/home/sandro/Área de trabalho/App Desktop/DevOS-Desktop/`:

1. **Preserve os Prefixos e Nomes das Variáveis CSS:**
   - Mantenha `--layout-header-desktop-height`, `--layout-nav-vertical-width` e os canais RGB (`--palette-primary-mainChannel`), pois os componentes internos dependem dessas variáveis para cálculo de margens e padding dinâmicos.
2. **Utilize o Padrão de Slots:**
   - O cabeçalho e o layout devem receber slots (`leftArea`, `rightArea`, `topArea`), em vez de acoplar botões de forma rígida dentro do componente.
3. **Separe o Tema dos Componentes:**
   - Não declare cores hexadecimais diretamente no JSX (`style={{ color: '#00A76F' }}`). Use as tokens do tema (`color: 'primary.main'` ou `var(--palette-primary-main)`).
4. **Zero Layout Shift (CLS):**
   - Garanta que a sidebar reserve o espaço correspondente (`width: 280px` ou `88px`) na renderização inicial para evitar saltos visuais na tela.
