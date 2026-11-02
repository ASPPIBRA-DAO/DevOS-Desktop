import React from 'react';
import { it, expect, describe } from 'vitest';
import { renderToString } from 'react-dom/server';

import { BlockchainCube } from '../shared/components/blockchain-cube';

describe('DevOS Design System — BlockchainCube (Motor 3D & Telemetria Criptográfica)', () => {
  it('deve renderizar o palco isométrico, viewport 3D e tema padrão esmeralda', () => {
    const html = renderToString(<BlockchainCube />);

    expect(html).toContain('bchain-cube-viewport');
    expect(html).toContain('bchain-theme-emerald');
    expect(html).toContain('bchain-cube-stage');
    expect(html).toContain('bchain-cube-container');
    expect(html).toContain('bchain-cube-3d');
  });

  it('deve renderizar os elementos ambientais (grid, halo, partículas, ondas e sombra)', () => {
    const html = renderToString(
      <BlockchainCube
        showGrid
        showHalo
        showParticles
        showWaves
        showShadow
      />
    );

    expect(html).toContain('bchain-cube-floor-grid');
    expect(html).toContain('bchain-cube-floor-halo');
    expect(html).toContain('bchain-cube-orbit p1');
    expect(html).toContain('bchain-cube-orbit p2');
    expect(html).toContain('bchain-cube-wave');
    expect(html).toContain('bchain-cube-wave w2');
    expect(html).toContain('bchain-cube-shadow');
  });

  it('deve renderizar os dados criptográficos em todas as 6 faces do bloco', () => {
    const html = renderToString(
      <BlockchainCube
        blockNumber="BLOCO #4092"
        merkleRoot="0xabc123...def456"
        nonce="849201"
        status="CONFIRMADO"
        hash="0x778899...aabbcc"
        network="ASPPIBRA DEPIN"
        nodeCount="64 NÓS"
        consensusType="PoS DAG"
        txCount="15.820"
        tps="1.200"
        cid="bafybeihdwdcefgh4k5l6"
        protocol="DEPIN V2"
      />
    );

    // Top: Bloco, Merkle Root e Nonce
    expect(html).toContain('BLOCO #4092');
    expect(html).toContain('MERKLE ROOT');
    expect(html).toContain('0xabc123...def456');
    expect(html).toContain('NONCE');
    expect(html).toContain('849201');

    // Front: Status e Hash
    expect(html).toContain('BLOCK NODE');
    expect(html).toContain('CONFIRMADO');
    expect(html).toContain('0x778899...aabbcc');

    // Back: Rede e Consenso
    expect(html).toContain('NETWORK');
    expect(html).toContain('ASPPIBRA DEPIN');
    expect(html).toContain('64 NÓS');
    expect(html).toContain('PoS DAG');

    // Left: Transações e TPS
    expect(html).toContain('TRANSAÇÕES');
    expect(html).toContain('15.820');
    expect(html).toContain('TX/SEC: 1.200');

    // Right: IPFS CID e Protocolo
    expect(html).toContain('DESCENTRALIZED');
    expect(html).toContain('IPFS CID');
    expect(html).toContain('bafybeihdwdcefgh4k5l6');
    expect(html).toContain('DEPIN V2');
  });

  it('deve aceitar troca de variantes temáticas como gold, teal e quartz', () => {
    const htmlGold = renderToString(<BlockchainCube themeVariant="gold" />);
    expect(htmlGold).toContain('bchain-theme-gold');

    const htmlTeal = renderToString(<BlockchainCube themeVariant="teal" />);
    expect(htmlTeal).toContain('bchain-theme-teal');

    const htmlQuartz = renderToString(<BlockchainCube themeVariant="quartz" />);
    expect(htmlQuartz).toContain('bchain-theme-quartz');
  });

  it('deve ocultar elementos ambientais quando desativados por props', () => {
    const html = renderToString(
      <BlockchainCube
        showGrid={false}
        showHalo={false}
        showParticles={false}
        showWaves={false}
        showShadow={false}
      />
    );

    expect(html).not.toContain('bchain-cube-floor-grid');
    expect(html).not.toContain('bchain-cube-floor-halo');
    expect(html).not.toContain('bchain-cube-orbit');
    expect(html).not.toContain('bchain-cube-wave');
    expect(html).not.toContain('bchain-cube-shadow');
  });
});
