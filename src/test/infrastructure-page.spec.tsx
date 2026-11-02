import React from 'react';
import { it, expect, describe } from 'vitest';
import { renderToString } from 'react-dom/server';

import { InfrastructurePage } from '../pages/devos/infrastructure-page';

describe('DevOS Control Plane — InfrastructurePage (Rede de Nós & Recompensas)', () => {
  it('deve renderizar o hero 3D do BlockchainCube e badge DePIN Proof-of-Stake', () => {
    const html = renderToString(<InfrastructurePage />);

    expect(html).toContain('bchain-cube-viewport');
    expect(html).toContain('bchain-cube-stage');
    expect(html).toContain('DEPIN • PROOF-OF-STAKE • HOLDERS ATIVOS');
    expect(html).toContain('BLOCO #1');
    expect(html).toContain('(Genesis)');
    expect(html).toContain('Nonce (Proof of Work):');
    expect(html).toContain('MINERAR BLOCO');
    expect(html).toContain('REDE DE PINNING');
    expect(html).toContain('Todos os Nós Aptos a Recompensa');
  });

  it('deve renderizar os 4 nós operacionais com APY, stake e recompensas', () => {
    const html = renderToString(<InfrastructurePage />);

    expect(html).toContain('node-gru-01');
    expect(html).toContain('São Paulo');
    expect(html).toContain('+8.5% APY');
    expect(html).toContain('R$ 1.450,00');

    expect(html).toContain('node-gig-01');
    expect(html).toContain('Rio de Janeiro');
    expect(html).toContain('+8.2% APY');

    expect(html).toContain('node-mia-01');
    expect(html).toContain('Miami');

    expect(html).toContain('node-iad-01');
    expect(html).toContain('Virginia');
  });

  it('deve renderizar os buckets de armazenamento em cluster com CIDs raiz e quotas', () => {
    const html = renderToString(<InfrastructurePage />);

    expect(html).toContain('Armazenamento em Nuvem (Cluster)');
    expect(html).toContain('TOTAL: 18,02 GB');
    expect(html).toContain('asppibra-dao-vault-artifacts');
    expect(html).toContain('CDN Global');
    expect(html).toContain('bafybeich3...3x4y5z');
    expect(html).toContain('4,80 GB (Quota: 24%)');
    expect(html).toContain('ipfs-cube-loader');
  });
});
