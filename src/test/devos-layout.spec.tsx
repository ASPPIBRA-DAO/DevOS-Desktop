import React from 'react';
import { MemoryRouter } from 'react-router';
import { renderToString } from 'react-dom/server';
import { it, vi, expect, describe } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';

import { createTheme } from 'src/theme/create-theme';

import { currentEdition as nodeEdition } from '../app/editions/edition.node';
import { currentEdition as cockpitEdition } from '../app/editions/edition.cockpit';
import {
  DevOSLayout,
  getSectionTitle,
  toNavSectionData,
} from '../app/layouts/devos/layout';

// Mock do bootstrap para isolamento de renderização
vi.mock('src/app/bootstrap', () => ({
  useBootstrap: () => ({
    lock: vi.fn(),
  }),
}));

const theme = createTheme();

describe('DevOSLayout & Navigation Adapter', () => {
  describe('toNavSectionData (adaptador visual)', () => {
    it('deve converter corretamente grupos e itens preservando títulos, caminhos e subheaders', () => {
      const navData = toNavSectionData(nodeEdition.navigation);

      expect(navData).toHaveLength(2);
      expect(navData[0].subheader).toBe('VISÃO GERAL');
      expect(navData[0].items[0].title).toBe('Painel do Nó');
      expect(navData[0].items[0].path).toBe('/');
      expect(navData[1].subheader).toBe('INFRAESTRUTURA');
      expect(navData[1].items).toHaveLength(2);
    });
  });

  describe('getSectionTitle (resolução dinâmica de títulos)', () => {
    it('deve resolver título exato para a rota raiz "/" com base nas rotas da edição', () => {
      const nodeTitle = getSectionTitle('/', nodeEdition.routes, nodeEdition.name);
      expect(nodeTitle).toBe('Painel do Nó');

      const cockpitTitle = getSectionTitle('/', cockpitEdition.routes, cockpitEdition.name);
      expect(cockpitTitle).toBe('Visão Geral');
    });

    it('deve resolver título para rotas secundárias com precisão', () => {
      const ipfsTitle = getSectionTitle('/devos/ipfs', nodeEdition.routes, nodeEdition.name);
      expect(ipfsTitle).toBe('Armazenamento IPFS');
    });

    it('deve utilizar o nome do produto como fallback quando a rota não for reconhecida', () => {
      const fallbackTitle = getSectionTitle('/rota-desconhecida', nodeEdition.routes, nodeEdition.name);
      expect(fallbackTitle).toBe(nodeEdition.name);
    });
  });

  describe('Renderização com DevOSLayout', () => {
    it('deve renderizar o layout do DevOS Node sem exibir menus administrativos nem termos de mock', () => {
      const html = renderToString(
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={['/']}>
            <DevOSLayout
              navigation={nodeEdition.navigation}
              productName={nodeEdition.name}
              routes={nodeEdition.routes}
            >
              <div>Conteúdo do Nó</div>
            </DevOSLayout>
          </MemoryRouter>
        </ThemeProvider>
      );

      // Conteúdo esperado
      expect(html).toContain('Painel do Nó');
      expect(html).toContain('Armazenamento IPFS');
      expect(html).toContain('Conteúdo do Nó');
      expect(html).toContain(nodeEdition.name);

      // Termos que NUNCA devem aparecer no Node
      expect(html).not.toContain('FINANCEIRO');
      expect(html).not.toContain('OPERAÇÕES');
      expect(html).not.toContain('Banco Imobiliário');
      expect(html).not.toContain('mock-node-alpha');
      expect(html).not.toContain('Control Plane Sandbox');
      expect(html).not.toContain('Mocks Ativos');
      expect(html).not.toContain('In-Memory Mocks Active');
      expect(html).not.toContain('DevOS Cockpit');
    });

    it('deve renderizar o layout do DevOS Cockpit exibindo Operações e Cadastro Imobiliário', () => {
      const html = renderToString(
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={['/']}>
            <DevOSLayout
              navigation={cockpitEdition.navigation}
              productName={cockpitEdition.name}
              routes={cockpitEdition.routes}
            >
              <div>Conteúdo do Cockpit</div>
            </DevOSLayout>
          </MemoryRouter>
        </ThemeProvider>
      );

      // Conteúdo esperado no Cockpit
      expect(html).toContain('OPERAÇÕES');
      expect(html).toContain('Banco Imobiliário');
      expect(html).toContain('Tesouraria &amp; Livro-Razão');
      expect(html).toContain(cockpitEdition.name);

      // Termos de mock eliminados
      expect(html).not.toContain('mock-node-alpha');
      expect(html).not.toContain('Control Plane Sandbox');
      expect(html).not.toContain('Mocks Ativos');
      expect(html).not.toContain('In-Memory Mocks Active');
    });
  });
});
