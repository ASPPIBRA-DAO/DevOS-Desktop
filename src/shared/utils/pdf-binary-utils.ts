/**
 * ASPPIBRA DevOS — Utilitários de Manipulação e Validação de Binários PDF
 *
 * Provê conversão e inspeção estritamente em memória de streams binárias de PDF,
 * cálculo de SHA-256 e gerenciamento de ciclo de vida de URLs de Blob.
 */

const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

/**
 * Converte uma string Base64 em Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/\s+/g, '');
  if (!clean) {
    return new Uint8Array(0);
  }

  // Suporte a ambientes navegadores e Node.js
  if (typeof atob === 'function') {
    const binaryString = atob(clean);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(clean, 'base64'));
  }

  throw new Error('Ambiente não suporta decodificação Base64 nativa.');
}

/**
 * Converte um Uint8Array em string Base64 padrão.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    return '';
  }

  if (typeof btoa === 'function') {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }

  throw new Error('Ambiente não suporta codificação Base64 nativa.');
}

/**
 * Verifica se os bytes contêm o cabeçalho canônico %PDF-.
 */
export function isValidPdfHeader(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_HEADER.length) {
    return false;
  }
  for (let i = 0; i < PDF_HEADER.length; i += 1) {
    if (bytes[i] !== PDF_HEADER[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Calcula o hash SHA-256 canônico em hexadecimal minúsculo sobre o buffer binário.
 */
export async function computeSha256Hex(bytes: Uint8Array): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback para Node.js / testes
  try {
    const nodeCrypto = await import('node:crypto');
    return nodeCrypto.createHash('sha256').update(bytes).digest('hex');
  } catch {
    throw new Error('Nenhum provedor criptográfico disponível para cálculo de SHA-256.');
  }
}

/**
 * Cria uma URL de Blob para os bytes de PDF e retorna função de limpeza associada.
 */
export function createPdfBlobSession(bytes: Uint8Array): {
  blobUrl: string;
  revoke: () => void;
} {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return {
      blobUrl: '',
      revoke: () => {},
    };
  }

  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  let revoked = false;

  return {
    blobUrl,
    revoke: () => {
      if (!revoked) {
        revoked = true;
        URL.revokeObjectURL(blobUrl);
      }
    },
  };
}
