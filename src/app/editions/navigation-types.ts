/**
 * Item individual de navegação da edição
 */
export interface EditionNavigationItem {
  title: string;
  path: string;
  icon: string;
}

/**
 * Grupo de navegação da edição com tipagem de array não-vazio
 */
export interface EditionNavigationGroup {
  id: string;
  subheader: string;
  items: [EditionNavigationItem, ...EditionNavigationItem[]];
}
