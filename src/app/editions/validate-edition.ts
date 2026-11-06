import type { EditionConfig } from './types';

export interface ValidationError {
  rule: string;
  message: string;
}

export function validateEdition(edition: EditionConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  const registeredPaths = new Set(edition.routes.map((r) => r.path));
  const groupIds = new Set<string>();
  const menuPaths = new Set<string>();

  // 1. Integridade básica da edição
  if (!edition.name || !edition.name.trim()) {
    errors.push({ rule: 'name-empty', message: 'Nome da edição não pode ser vazio.' });
  }
  if (!edition.bundleId || !edition.bundleId.trim()) {
    errors.push({ rule: 'bundle-empty', message: 'BundleId não pode ser vazio.' });
  }

  // 2. Validação dos grupos
  if (!edition.navigation || edition.navigation.length === 0) {
    errors.push({ rule: 'nav-empty', message: 'A edição deve ter pelo menos um grupo de navegação.' });
    return errors;
  }

  for (const group of edition.navigation) {
    // 2.1 Identificador estável de grupo
    if (!group.id || !group.id.trim()) {
      errors.push({
        rule: 'group-id-empty',
        message: `Grupo com subheader "${group.subheader}" não possui id estável.`,
      });
    } else if (groupIds.has(group.id)) {
      errors.push({ rule: 'group-id-duplicate', message: `Id de grupo duplicado: "${group.id}".` });
    } else {
      groupIds.add(group.id);
    }

    // 2.2 Subheader
    if (!group.subheader || !group.subheader.trim()) {
      errors.push({ rule: 'group-subheader-empty', message: `Grupo id "${group.id}" possui subheader vazio.` });
    }

    // 2.3 Itens do grupo (garantia de não-vazio)
    if (!group.items || group.items.length === 0) {
      errors.push({ rule: 'group-items-empty', message: `Grupo "${group.id}" não possui itens.` });
      continue;
    }

    for (const item of group.items) {
      // 2.4 Destino e título
      if (!item.title || !item.title.trim()) {
        errors.push({ rule: 'item-title-empty', message: `Item no grupo "${group.id}" possui título vazio.` });
      }
      if (!item.path || !item.path.trim()) {
        errors.push({ rule: 'item-path-empty', message: `Item "${item.title}" possui caminho vazio.` });
      }

      // 2.5 Ícone válido
      if (!item.icon || !item.icon.trim()) {
        errors.push({ rule: 'item-icon-empty', message: `Item "${item.title}" não possui ícone Iconify.` });
      }

      // 2.6 Correspondência de rotas (item deve apontar para rota registrada)
      if (!registeredPaths.has(item.path)) {
        errors.push({
          rule: 'item-route-unregistered',
          message: `Item "${item.title}" aponta para caminho não registrado: "${item.path}".`,
        });
      }

      // 2.7 Duplicação de caminhos no menu
      if (menuPaths.has(item.path)) {
        errors.push({ rule: 'item-path-duplicate', message: `Caminho duplicado no menu: "${item.path}".` });
      } else {
        menuPaths.add(item.path);
      }
    }
  }

  // 3. Integridade do grupo ativo para a rota raiz
  const hasRootItem = edition.navigation.some((g) => g.items.some((i) => i.path === '/'));
  if (!hasRootItem) {
    errors.push({
      rule: 'root-navigation-missing',
      message: 'Nenhum item de navegação aponta para a rota raiz "/". O acordeão falhará.',
    });
  }

  return errors;
}
