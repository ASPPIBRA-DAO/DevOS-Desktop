import type { RenderTask, PDFDocumentProxy } from 'pdfjs-dist';

import React, { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

export interface PdfPageCanvasProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  zoom: number;
  onPageMeasured?: (pageNumber: number, width: number, height: number) => void;
}

export function PdfPageCanvas({
  pdfDoc,
  pageNumber,
  zoom,
  onPageMeasured,
}: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [pageDims, setPageDims] = useState<{ width: number; height: number }>({
    width: Math.round(595 * zoom),
    height: Math.round(842 * zoom),
  });

  useEffect(() => {
    let isCancelled = false;
    let activeRenderTask: RenderTask | null = null;

    async function renderPage() {
      try {
        setIsRendering(true);
        setRenderError(null);

        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        // Viewport nativo baseado na escala de zoom atual
        const viewport = page.getViewport({ scale: zoom });
        const width = Math.round(viewport.width);
        const height = Math.round(viewport.height);

        setPageDims({ width, height });
        onPageMeasured?.(pageNumber, width, height);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        // Suporte a telas de alta densidade (Retina e escala do WebKitGTK / Linux)
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.save();
        ctx.scale(dpr, dpr);

        const renderContext = {
          canvasContext: ctx,
          canvas,
          viewport,
        };

        activeRenderTask = page.render(renderContext);
        await activeRenderTask.promise;

        if (!isCancelled) {
          setIsRendering(false);
        }
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === 'RenderingCancelledException') {
          return;
        }
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Falha na renderização da página.';
          setRenderError(msg);
          setIsRendering(false);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (activeRenderTask) {
        try {
          activeRenderTask.cancel();
        } catch {
          // No-op
        }
      }
    };
  }, [pdfDoc, pageNumber, zoom, onPageMeasured]);

  return (
    <Box
      id={`pdf-page-${pageNumber}`}
      sx={{
        width: pageDims.width,
        minHeight: pageDims.height,
        bgcolor: '#ffffff',
        borderRadius: 0.5,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'width 0.1s ease-out, min-height 0.1s ease-out',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: renderError ? 'none' : 'block',
          width: `${pageDims.width}px`,
          height: `${pageDims.height}px`,
        }}
      />

      {isRendering && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 2,
          }}
        >
          <CircularProgress size={28} sx={{ color: '#10B981' }} />
        </Box>
      )}

      {renderError && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography sx={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
            {renderError}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
