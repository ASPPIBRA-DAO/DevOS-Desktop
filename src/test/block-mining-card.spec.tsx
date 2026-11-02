import React from 'react';
import { it, expect, describe } from 'vitest';
import { renderToString } from 'react-dom/server';

import { BlockMiningCard } from '../shared/components/block-mining-card';

describe('DevOS Design System — BlockMiningCard (Inspeção & Mineração de Bloco)', () => {
  it('deve renderizar o cabeçalho, tag do bloco e status INVÁLIDO por padrão', () => {
    const html = renderToString(
      <BlockMiningCard
        blockNumber={1}
        blockTag="(Genesis)"
        isInitiallyValid={false}
      />
    );

    expect(html).toContain('BLOCO #1');
    expect(html).toContain('(Genesis)');
    expect(html).toContain('INVÁLIDO');
    expect(html).toContain('MINERAR BLOCO');
  });

  it('deve renderizar todos os campos estruturados do bloco (Timestamp, Data, Nonce, Hashes)', () => {
    const html = renderToString(
      <BlockMiningCard
        blockNumber={2}
        blockTag="(Transacional)"
        timestamp="02/01/2026 14:30:00"
        initialData="Transação #001: Alice -> Bob (100 ASPP)"
        initialNonce={7429}
        previousHash="0000abc123000000000000000000000000000000000000000000000000000000"
        initialHash="55bb88cc11223344556677889900aabbccddeeff0011223344556677889900aa"
      />
    );

    expect(html).toContain('Timestamp:');
    expect(html).toContain('02/01/2026 14:30:00');
    expect(html).toContain('Data (Conteúdo):');
    expect(html).toContain('Transação #001: Alice -&gt; Bob (100 ASPP)');
    expect(html).toContain('Nonce (Proof of Work):');
    expect(html).toContain('7429');
    expect(html).toContain('Previous Hash:');
    expect(html).toContain('0000abc123000000000000000000000000000000000000000000000000000000');
    expect(html).toContain('Hash Atual:');
    expect(html).toContain('55bb88cc11223344556677889900aabbccddeeff0011223344556677889900aa');
  });

  it('deve renderizar status VÁLIDO e botão de sucesso quando isInitiallyValid={true}', () => {
    const html = renderToString(
      <BlockMiningCard
        blockNumber={1}
        isInitiallyValid
      />
    );

    expect(html).toContain('VÁLIDO');
    expect(html).toContain('BLOCO VALIDADO &amp; MINERADO');
  });
});
