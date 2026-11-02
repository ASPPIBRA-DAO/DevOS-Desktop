import React from 'react';
import { it, expect, describe } from 'vitest';
import { renderToString } from 'react-dom/server';

import { InfrastructurePage } from '../pages/devos/infrastructure-page';

describe('DevOS Control Plane — InfrastructurePage', () => {
  it('deve renderizar a topologia de nós Cloudflare Edge e os nós mockados', () => {
    const html = renderToString(<InfrastructurePage />);

    expect(html).toContain('Cloudflare Edge &amp; Infrastructure Mesh');
    expect(html).toContain('READ ONLY MOCK');
    expect(html).toContain('São Paulo (GRU)');
    expect(html).toContain('node-gru-01');
    expect(html).toContain('Rio de Janeiro (GIG)');
  });

  it('deve renderizar a matriz de buckets de R2 Object Storage', () => {
    const html = renderToString(<InfrastructurePage />);

    expect(html).toContain('R2 Object Storage Buckets (Emulated)');
    expect(html).toContain('asppibra-dao-vault-artifacts');
    expect(html).toContain('asppibra-dao-audit-backups');
    expect(html).toContain('asppibra-dao-public-cdn');
  });
});
