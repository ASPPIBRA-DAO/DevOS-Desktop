import React from 'react';
import { it, expect, describe } from 'vitest';
import { renderToString } from 'react-dom/server';

import allIcons from '../shared/components/iconify/icon-sets';
import { GisGlobeO, GlobeWireIcon } from '../shared/components/globe-wire';

// ----------------------------------------------------------------------
// Suíte de Testes: Componente React Oficial GisGlobeO (Font-GIS)
// ----------------------------------------------------------------------

describe('GisGlobeO — Componente React Oficial GisGlobeO do DevOS', () => {
  it('deve renderizar o SVG nativo com viewBox 100x100 e atributos padrao', () => {
    const html = renderToString(<GisGlobeO />);

    expect(html).toContain('viewBox="0 0 100 100"');
    expect(html).toContain('<path');
    expect(html).toContain('fill="currentColor"');
    expect(html).toContain('M49.947 0A50 50 0 0 0 0 50');
  });

  it('deve respeitar a propriedade size customizada', () => {
    const html = renderToString(<GisGlobeO size={48} />);

    expect(html).toContain('width="48"');
    expect(html).toContain('height="48"');
  });

  it('deve suportar o alias GlobeWireIcon por compatibilidade', () => {
    const html = renderToString(<GlobeWireIcon size={32} />);

    expect(html).toContain('width="32"');
    expect(html).toContain('height="32"');
  });

  it('deve conter as chaves gis:globe-o e custom:globe-wire registradas no mapa offline do Iconify', () => {
    const gisGlobe = (allIcons as Record<string, { body: string; width?: number; height?: number }>)[
      'gis:globe-o'
    ];
    const customGlobe = (allIcons as Record<string, { body: string; width?: number; height?: number }>)[
      'custom:globe-wire'
    ];

    expect(gisGlobe).toBeDefined();
    expect(gisGlobe.body).toContain('M49.947 0A50 50 0 0 0 0 50');
    expect(gisGlobe.width).toBe(100);
    expect(gisGlobe.height).toBe(100);

    expect(customGlobe).toBeDefined();
    expect(customGlobe.body).toContain('M49.947 0A50 50 0 0 0 0 50');
  });
});
