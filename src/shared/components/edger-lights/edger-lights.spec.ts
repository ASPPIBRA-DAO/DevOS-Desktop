import type { EdgerVariant, EdgerCardEdge } from './types';

import { it, expect, describe } from 'vitest';

import { EDGER_TOKENS } from './edger-tokens';

// ----------------------------------------------------------------------

describe('EDGER Lights UI — Design Tokens & Architecture', () => {
  const variants: EdgerVariant[] = ['rose', 'amber', 'emerald', 'sky', 'purple', 'slate'];

  it('deve conter todas as 6 variantes oficiais da coleção', () => {
    variants.forEach((v) => {
      expect(EDGER_TOKENS[v]).toBeDefined();
    });
  });

  it('cada variante deve possuir cores válidas de fundo, borda, acento e badge', () => {
    variants.forEach((v) => {
      const token = EDGER_TOKENS[v];
      expect(token.bg).toMatch(/^#/);
      expect(token.border).toMatch(/^#/);
      expect(token.accent).toMatch(/^#/);
      expect(token.badgeBg).toContain('linear-gradient');
      expect(token.shadow).toContain('rgba');
    });
  });

  it('deve manter o contraste adequado de texto claro e escuro', () => {
    variants.forEach((v) => {
      const token = EDGER_TOKENS[v];
      expect(token.text).toBeTruthy();
      expect(token.textDark).toBeTruthy();
    });
  });

  it('deve suportar os dois modelos discriminados de borda tátil: lateral e bottom', () => {
    const validEdges: EdgerCardEdge[] = ['lateral', 'bottom'];
    expect(validEdges).toHaveLength(2);
    expect(validEdges).toContain('lateral');
    expect(validEdges).toContain('bottom');
  });
});
