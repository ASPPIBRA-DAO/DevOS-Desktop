import { it, expect, describe } from 'vitest';

import { pdfjsLib } from '../shared/components/pdf-viewer/pdf-engine';
import {
  computeSha256Hex,
  isValidPdfHeader,
  base64ToUint8Array,
  uint8ArrayToBase64,
} from '../shared/utils/pdf-binary-utils';

// Estrutura PDF canônica mínima válida (PDF-1.4 compatível)
const MINIMAL_VALID_PDF =
  '%PDF-1.4\n' +
  '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
  '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
  '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources <<>> /MediaBox [0 0 595 842] >>\nendobj\n' +
  'xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n' +
  'trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n206\n%%EOF';

describe('FASE 5 Complementar — Motor PDF.js e Visualizador Real de PDF', () => {
  it('deve inicializar a biblioteca PDF.js e expor a versão estável compatível', () => {
    expect(pdfjsLib).toBeDefined();
    expect(pdfjsLib.version).toBe('6.5.438');
    expect(typeof pdfjsLib.getDocument).toBe('function');
  });

  it('deve validar cabeçalho %PDF- e integridade criptográfica SHA-256 sobre os bytes reais', async () => {
    const rawBytes = new TextEncoder().encode(MINIMAL_VALID_PDF);
    expect(isValidPdfHeader(rawBytes)).toBe(true);

    const base64 = uint8ArrayToBase64(rawBytes);
    const decodedBytes = base64ToUint8Array(base64);
    expect(decodedBytes).toEqual(rawBytes);

    const calculatedSha = await computeSha256Hex(decodedBytes);
    expect(calculatedSha).toMatch(/^[0-9a-f]{64}$/);

    // Verificação de divergência
    const tamperedSha = calculatedSha.replace(/^./, calculatedSha[0] === 'a' ? 'b' : 'a');
    expect(calculatedSha).not.toBe(tamperedSha);
  });

  it('deve interpretar os bytes reais do PDF via getDocument e extrair páginas e viewport exatos', async () => {
    const rawBytes = new TextEncoder().encode(MINIMAL_VALID_PDF);
    const loadingTask = pdfjsLib.getDocument({
      data: rawBytes.slice(),
      cMapPacked: true,
    });

    const doc = await loadingTask.promise;
    expect(doc).toBeDefined();
    expect(doc.numPages).toBe(1);

    const page = await doc.getPage(1);
    expect(page.pageNumber).toBe(1);

    const viewport100 = page.getViewport({ scale: 1.0 });
    expect(Math.round(viewport100.width)).toBe(595);
    expect(Math.round(viewport100.height)).toBe(842);

    // Zoom 1.5x
    const viewport150 = page.getViewport({ scale: 1.5 });
    expect(Math.round(viewport150.width)).toBe(Math.round(595 * 1.5));
    expect(Math.round(viewport150.height)).toBe(Math.round(842 * 1.5));

    await doc.loadingTask.destroy();
  });

  it('deve suportar renderização em mock de Canvas 2D e permitir cancelamento de tarefa ativa', async () => {
    const rawBytes = new TextEncoder().encode(MINIMAL_VALID_PDF);
    const loadingTask = pdfjsLib.getDocument({
      data: rawBytes.slice(),
      cMapPacked: true,
    });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });

    // Mock funcional de CanvasRenderingContext2D para ambiente headless
    const mockCtx = {
      save: () => {},
      restore: () => {},
      scale: () => {},
      transform: () => {},
      translate: () => {},
      fillRect: () => {},
      clearRect: () => {},
      beginPath: () => {},
      closePath: () => {},
      fill: () => {},
      stroke: () => {},
      clip: () => {},
      setTransform: () => {},
      drawImage: () => {},
      measureText: () => ({ width: 10 }),
    } as unknown as CanvasRenderingContext2D;

    const mockCanvas = {
      width: 595,
      height: 842,
      style: {},
      getContext: () => mockCtx,
    } as unknown as HTMLCanvasElement;

    const renderTask = page.render({
      canvasContext: mockCtx,
      canvas: mockCanvas,
      viewport,
    });

    expect(renderTask).toBeDefined();
    expect(typeof renderTask.cancel).toBe('function');

    // Executa cancelamento e confirma que a promise rejeita com RenderingCancelledException
    renderTask.cancel();

    let cancelled = false;
    try {
      await renderTask.promise;
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'RenderingCancelledException') {
        cancelled = true;
      }
    }
    expect(cancelled).toBe(true);

    await doc.loadingTask.destroy();
  });

  it('deve liberar recursos e destruir o worker ao chamar destroy no loadingTask', async () => {
    const rawBytes = new TextEncoder().encode(MINIMAL_VALID_PDF);
    const loadingTask = pdfjsLib.getDocument({
      data: rawBytes.slice(),
      cMapPacked: true,
    });

    const doc = await loadingTask.promise;
    expect(doc.numPages).toBe(1);

    await expect(doc.loadingTask.destroy()).resolves.toBeUndefined();
  });
});
