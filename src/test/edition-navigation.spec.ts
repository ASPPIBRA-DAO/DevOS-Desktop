import { it, expect, describe } from 'vitest';

import { validateEdition } from '../app/editions/validate-edition';
import { currentEdition as nodeEdition } from '../app/editions/edition.node';
import { currentEdition as cockpitEdition } from '../app/editions/edition.cockpit';

describe('Editions Navigation & Architecture Validation', () => {
  it('deve validar que a edição DevOS Node não possui erros de contrato de navegação', () => {
    const errors = validateEdition(nodeEdition);
    expect(errors).toEqual([]);
  });

  it('deve validar que a edição DevOS Cockpit não possui erros de contrato de navegação', () => {
    const errors = validateEdition(cockpitEdition);
    expect(errors).toEqual([]);
  });

  it('deve garantir que o DevOS Node possui estritamente seus itens operacionais e nenhum item imobiliário ou administrativo', () => {
    const nodePaths = nodeEdition.navigation.flatMap((g) => g.items.map((i) => i.path));

    // Itens obrigatórios do Node
    expect(nodePaths).toContain('/');
    expect(nodePaths).toContain('/devos/ipfs');
    expect(nodePaths).toContain('/devos/infrastructure');
    expect(nodePaths).toHaveLength(3);

    // Itens que NÃO devem estar no menu do Node
    expect(nodePaths).not.toContain('/devos/cadastre');
    expect(nodePaths).not.toContain('/devos/database');
    expect(nodePaths).not.toContain('/real-estate');
    expect(nodePaths).not.toContain('/devos/dao');
    expect(nodePaths).not.toContain('/devos/ledger');
    expect(nodePaths).not.toContain('/devos/wallets');
    expect(nodePaths).not.toContain('/devos/cessao-posse');

    // Nenhuma rota imobiliária deve estar na lista de rotas do Node
    const registeredNodePaths = nodeEdition.routes.map((r) => r.path);
    expect(registeredNodePaths).not.toContain('/devos/cadastre');
    expect(registeredNodePaths).not.toContain('/devos/database');
    expect(registeredNodePaths).not.toContain('/real-estate');
  });

  it('deve garantir que o DevOS Cockpit possui seus itens operacionais e administrativos com Tesouraria & Livro-Razão unificados', () => {
    const cockpitPaths = cockpitEdition.navigation.flatMap((g) => g.items.map((i) => i.path));

    // Itens do Cockpit
    expect(cockpitPaths).toContain('/');
    expect(cockpitPaths).toContain('/devos/ledger');
    expect(cockpitPaths).toContain('/devos/wallets');
    expect(cockpitPaths).toContain('/devos/cadastre');
    expect(cockpitPaths).toContain('/devos/cessao-posse');
    expect(cockpitPaths).toContain('/devos/ipfs');
    expect(cockpitPaths).toContain('/devos/infrastructure');
    expect(cockpitPaths).toHaveLength(7);

    // O menu do Cockpit NÃO deve ter duplicação de /devos/dao (está unificado em /devos/ledger)
    expect(cockpitPaths).not.toContain('/devos/dao');
  });

  it('deve garantir que as rotas-alias do Cockpit permanecem ativas na lista routes', () => {
    const registeredCockpitPaths = cockpitEdition.routes.map((r) => r.path);

    // Aliases mandatórios que devem continuar existindo para compatibilidade
    expect(registeredCockpitPaths).toContain('/devos/dao');
    expect(registeredCockpitPaths).toContain('/banking');
    expect(registeredCockpitPaths).toContain('/devos/database');
    expect(registeredCockpitPaths).toContain('/real-estate');
  });
});
