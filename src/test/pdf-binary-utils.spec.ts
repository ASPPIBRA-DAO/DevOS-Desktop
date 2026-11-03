import { it, expect, describe } from 'vitest';

import {
  isValidPdfHeader,
  computeSha256Hex,
  base64ToUint8Array,
  uint8ArrayToBase64,
  createPdfBlobSession,
} from '../shared/components/abnt-document/pdf-binary-utils';

describe('PDF Binary Utils — Manipulação e Validação', () => {
  it('deve realizar roundtrip fiel entre Base64 e Uint8Array', () => {
    const raw = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // %PDF-1.7
    const base64 = uint8ArrayToBase64(raw);
    expect(base64).toBe('JVBERi0xLjc=');

    const decoded = base64ToUint8Array(base64);
    expect(decoded).toEqual(raw);
  });

  it('deve identificar cabeçalho canônico %PDF- com precisão', () => {
    const validPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x00, 0x00]);
    expect(isValidPdfHeader(validPdf)).toBe(true);

    const invalidPdf = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG header
    expect(isValidPdfHeader(invalidPdf)).toBe(false);

    expect(isValidPdfHeader(new Uint8Array([]))).toBe(false);
  });

  it('deve calcular SHA-256 canônico em minúsculas com 64 caracteres hex', async () => {
    const data = new TextEncoder().encode('%PDF-1.7\nASPPIBRA-DAO');
    const sha = await computeSha256Hex(data);

    expect(sha).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(sha)).toBe(true);
  });

  it('deve gerenciar sessão de Blob URL e função de revogação', () => {
    const data = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const session = createPdfBlobSession(data);

    expect(session).toBeDefined();
    expect(typeof session.revoke).toBe('function');
    expect(() => session.revoke()).not.toThrow();
  });
});
