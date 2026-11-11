import type { PDFDocumentProxy, PDFDocumentLoadingTask } from 'pdfjs-dist';
import type { DocumentPreviewResult } from 'src/platform/tauri/contracts/document-contracts';

import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/app/router/hooks';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';
import {
  isValidPdfHeader,
  computeSha256Hex,
  base64ToUint8Array,
} from 'src/shared/utils/pdf-binary-utils';

import { pdfjsLib } from './pdf-engine';
import { PdfPageCanvas } from './PdfPageCanvas';

export type PdfViewerLayoutProps = {
  children?: React.ReactNode;
  documentTitle: string;
  preview?: DocumentPreviewResult | null;
  variant?: 'default' | 'dialog';
  onBack?: () => void;
  onView?: () => void;
  onExport?: () => void;
  onClose?: () => void;
  action?: React.ReactNode;
  stickyTop?: number | string | Record<string, number | string>;
  toolbarMaxWidth?: number | string;
  showBackButton?: boolean;
  showViewButton?: boolean;
  showExportButton?: boolean;
  isExporting?: boolean;
  isViewing?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  viewButtonText?: string;
  exportButtonText?: string;
  initialZoom?: number;
  onZoomChange?: (zoom: number) => void;
  onPageChange?: (page: number) => void;
};

export function PdfViewerLayout({
  children,
  documentTitle,
  preview,
  variant = 'default',
  onBack,
  onView,
  onExport,
  onClose,
  action,
  stickyTop,
  toolbarMaxWidth,
  showBackButton = true,
  showViewButton = true,
  showExportButton = true,
  isExporting = false,
  isViewing = false,
  isLoading = false,
  errorMessage = null,
  onRetry,
  viewButtonText = 'Visualizar',
  exportButtonText = 'Exportar',
  initialZoom = 1.0,
  onZoomChange,
  onPageChange,
}: PdfViewerLayoutProps) {
  const router = useRouter();

  const [zoom, setZoom] = useState<number>(initialZoom);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [checksumVerified, setChecksumVerified] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Estado do documento PDF real interpretado pelo PDF.js
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numDocPages, setNumDocPages] = useState<number>(1);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);

  const displayTitle = documentTitle.endsWith('.pdf') ? documentTitle : `${documentTitle}.pdf`;

  const totalPages = useMemo(() => {
    if (pdfDoc) {
      return numDocPages;
    }
    if (preview?.page_count && preview.page_count > 0) {
      return preview.page_count;
    }
    if (preview?.pages && preview.pages.length > 0) {
      return preview.pages.length;
    }
    return 1;
  }, [pdfDoc, numDocPages, preview]);

  // Validação estrita do binário do PDF e carregamento via PDF.js ao receber preview
  useEffect(() => {
    let isCancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    let loadedDoc: PDFDocumentProxy | null = null;

    if (!preview || !preview.pdf_base64) {
      setPdfDoc(null);
      setNumDocPages(1);
      setChecksumVerified(false);
      setValidationError(null);
      setIsPdfLoading(false);
    } else {
      const validateAndLoadPdf = async () => {
        try {
          setIsPdfLoading(true);
          const bytes = base64ToUint8Array(preview.pdf_base64);

          // 1. Validação canônica do cabeçalho %PDF-
          if (!isValidPdfHeader(bytes)) {
            if (!isCancelled) {
              setValidationError('O buffer binário recebido não possui o cabeçalho canônico %PDF-.');
              setChecksumVerified(false);
              setIsPdfLoading(false);
            }
            return;
          }

          // 2. Cálculo do SHA-256 no cliente sobre os bytes reais do PDF
          const calculatedSha256 = await computeSha256Hex(bytes);
          const expectedSha256 = preview.metadata.sha256_checksum.toLowerCase();

          if (calculatedSha256.toLowerCase() !== expectedSha256) {
            if (!isCancelled) {
              setValidationError('Divergência de integridade: SHA-256 do binário difere dos metadados.');
              setChecksumVerified(false);
              setIsPdfLoading(false);
            }
            return;
          }

          if (isCancelled) return;
          setChecksumVerified(true);
          setValidationError(null);

          // 3. Fornecimento de cópia defensiva do buffer para o PDF.js
          const pdfBufferCopy = bytes.slice();
          loadingTask = pdfjsLib.getDocument({
            data: pdfBufferCopy,
            cMapPacked: true,
          });

          const doc = await loadingTask.promise;
          if (isCancelled) {
            doc.loadingTask.destroy();
            return;
          }

          loadedDoc = doc;
          setPdfDoc(doc);
          setNumDocPages(doc.numPages);
          setCurrentPage(1);
          setIsPdfLoading(false);
        } catch (err: unknown) {
          if (!isCancelled) {
            const msg = err instanceof Error ? err.message : 'Falha na validação e interpretação do PDF.';
            setValidationError(msg);
            setChecksumVerified(false);
            setIsPdfLoading(false);
          }
        }
      };

      validateAndLoadPdf();
    }

    return () => {
      isCancelled = true;
      if (loadingTask) {
        try {
          loadingTask.destroy();
        } catch {
          // No-op
        }
      }
      if (loadedDoc) {
        try {
          loadedDoc.loadingTask.destroy();
        } catch {
          // No-op
        }
      }
    };
  }, [preview]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }, [onBack, router]);

  const handleView = useCallback(() => {
    if (onView) {
      onView();
    } else {
      const canvasEl = document.getElementById('pdf-document-canvas') || window;
      canvasEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [onView]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => {
      const next = Math.min(2.5, Math.round((prev + 0.1) * 10) / 10);
      onZoomChange?.(next);
      return next;
    });
  }, [onZoomChange]);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(0.5, Math.round((prev - 0.1) * 10) / 10);
      onZoomChange?.(next);
      return next;
    });
  }, [onZoomChange]);

  const handleZoomReset = useCallback(() => {
    setZoom(1.0);
    onZoomChange?.(1.0);
  }, [onZoomChange]);

  const handleFitWidth = useCallback(() => {
    setZoom(1.15);
    onZoomChange?.(1.15);
  }, [onZoomChange]);

  const handleFitPage = useCallback(() => {
    setZoom(0.85);
    onZoomChange?.(0.85);
  }, [onZoomChange]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = Math.max(1, prev - 1);
      onPageChange?.(next);
      const pageEl = document.getElementById(`pdf-page-${next}`);
      pageEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return next;
    });
  }, [onPageChange]);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = Math.min(totalPages, prev + 1);
      onPageChange?.(next);
      const pageEl = document.getElementById(`pdf-page-${next}`);
      pageEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return next;
    });
  }, [totalPages, onPageChange]);

  // Suporte à navegação via teclado (PageUp, PageDown, Home, End)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'PageUp') {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentPage(1);
        onPageChange?.(1);
        document.getElementById('pdf-page-1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentPage(totalPages);
        onPageChange?.(totalPages);
        document.getElementById(`pdf-page-${totalPages}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrevPage, handleNextPage, totalPages, onPageChange]);

  const handleCopySha256 = useCallback(() => {
    if (preview?.metadata.sha256_checksum) {
      navigator.clipboard?.writeText(preview.metadata.sha256_checksum);
      toast.success('SHA-256 copiado para a área de transferência.');
    }
  }, [preview]);

  const sha256Short = useMemo(() => {
    if (!preview?.metadata.sha256_checksum) return null;
    const hash = preview.metadata.sha256_checksum;
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  }, [preview]);

  const isBusy = isViewing || isLoading;

  return (
    <Box
      sx={{
        width: '100%',
        height: variant === 'dialog' ? '100%' : 'auto',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: '#2b2e31',
        borderRadius: variant === 'dialog' ? 0 : 2,
        p: variant === 'dialog' ? 0 : { xs: 1.5, sm: 2, md: 3 },
        boxShadow: variant === 'dialog' ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.2)',
        border: variant === 'dialog' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
        overflow: variant === 'dialog' ? 'hidden' : 'visible',
        '@media print': {
          p: 0,
          m: 0,
          bgcolor: 'transparent',
          boxShadow: 'none',
          border: 'none',
          borderRadius: 0,
          display: 'block',
        },
      }}
    >
      {variant === 'dialog' ? (
        <DialogTitle
          sx={{
            py: 1.5,
            px: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            width: '100%',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {/* Lado Esquerdo: Ícone + Título + Subtítulo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flexShrink: 1 }}>
            <Box
              sx={{
                p: 0.8,
                borderRadius: 1,
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                display: 'inline-flex',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:document-text-bold" width={22} />
            </Box>
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, color: 'text.primary' }}>
                Pré-visualização do Modelo: {documentTitle}
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block' }}>
                Renderização Nativa Typst • Amostra com Dados Padrão da DAO
              </Typography>
            </Box>
          </Box>

          {/* Lado Direito: Paginação, Zoom, Enquadramento e Fechar */}
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexShrink: 0 }}>
            {/* Paginação */}
            {(Boolean(pdfDoc) || Boolean(preview?.pdf_base64)) && (
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  alignItems: 'center',
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'grey.100'),
                  px: 1,
                  py: 0.35,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <IconButton
                  size="small"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  aria-label="Página anterior"
                  sx={{ p: 0.35 }}
                >
                  <Iconify icon="solar:alt-arrow-left-bold" width={16} />
                </IconButton>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, minWidth: 55, textAlign: 'center', color: 'text.primary' }}>
                  {currentPage} / {totalPages}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  aria-label="Próxima página"
                  sx={{ p: 0.35 }}
                >
                  <Iconify icon="solar:alt-arrow-right-bold" width={16} />
                </IconButton>
              </Stack>
            )}

            {/* Controle de Zoom e Enquadramento */}
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                alignItems: 'center',
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'grey.100'),
                px: 1,
                py: 0.35,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <IconButton
                size="small"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                aria-label="Diminuir zoom"
                sx={{ p: 0.35 }}
              >
                <Iconify icon="solar:magnifer-zoom-out-bold" width={16} />
              </IconButton>
              <Tooltip title="Clique para resetar 100%">
                <Typography
                  onClick={handleZoomReset}
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    minWidth: 42,
                    textAlign: 'center',
                    color: 'text.primary',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {Math.round(zoom * 100)}%
                </Typography>
              </Tooltip>
              <IconButton
                size="small"
                onClick={handleZoomIn}
                disabled={zoom >= 2.5}
                aria-label="Aumentar zoom"
                sx={{ p: 0.35 }}
              >
                <Iconify icon="solar:magnifer-zoom-in-bold" width={16} />
              </IconButton>

              <Button
                size="small"
                variant="outlined"
                onClick={handleFitWidth}
                sx={{
                  fontSize: '0.7rem',
                  minWidth: 'auto',
                  px: 0.85,
                  py: 0.25,
                  textTransform: 'none',
                  color: 'text.secondary',
                  borderColor: 'divider',
                }}
              >
                Largura
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={handleFitPage}
                sx={{
                  fontSize: '0.7rem',
                  minWidth: 'auto',
                  px: 0.85,
                  py: 0.25,
                  textTransform: 'none',
                  color: 'text.secondary',
                  borderColor: 'divider',
                }}
              >
                Página
              </Button>
            </Stack>

            {/* Fechar */}
            {onClose && (
              <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                <Iconify icon="eva:close-fill" width={22} />
              </IconButton>
            )}
          </Stack>
        </DialogTitle>
      ) : (
        /* Barra Superior do Visualizador (Perfeitamente contida e responsiva) */
        <Box
          className="no-print"
          sx={{
            width: '100%',
            maxWidth: toolbarMaxWidth ?? '240mm',
            bgcolor: '#323639',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: 1.5,
            px: { xs: 1.5, sm: 2 },
            py: 1,
            display: 'flex',
            flexWrap: 'nowrap',
            gap: 1.5,
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            mb: 3,
            position: 'sticky',
            top: stickyTop ?? { xs: 60, md: 72 },
            zIndex: 100,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            '@media print': { display: 'none !important' },
          }}
        >
          {/* Lado Esquerdo: [← Voltar] + 📄 Titulo_Do_Documento.pdf */}
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0, flexShrink: 1 }}>
            {showBackButton && (
              <IconButton
                onClick={handleBack}
                size="small"
                aria-label="Voltar"
                sx={{
                  color: '#ffffff',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                  p: 0.7,
                  flexShrink: 0,
                }}
              >
                <Iconify icon="solar:arrow-left-bold-duotone" width={18} />
              </IconButton>
            )}

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
              <Iconify icon="solar:document-text-bold" width={18} sx={{ color: '#8ab4f8', flexShrink: 0 }} />
              <Typography
                noWrap
                sx={{
                  color: '#ffffff',
                  fontSize: { xs: 11.5, sm: 13 },
                  fontWeight: 700,
                  fontFamily: 'monospace, "Arial", sans-serif',
                  letterSpacing: '0.2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: { xs: 140, sm: 220, md: 360 },
                }}
              >
                {displayTitle}
              </Typography>
            </Stack>
          </Stack>

          {/* Centro: Controles de Paginação, Zoom e Badge de Integridade SHA-256 */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.25)',
              px: 1.25,
              py: 0.4,
              borderRadius: 1,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              flexShrink: 0,
            }}
          >
            {/* Paginação */}
            {(Boolean(pdfDoc) || Boolean(preview?.pdf_base64)) && (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', pr: 1, borderRight: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <IconButton
                  size="small"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  aria-label="Página anterior"
                  sx={{ color: '#ffffff', p: 0.4, '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.25)' } }}
                >
                  <Iconify icon="solar:alt-arrow-left-bold" width={14} />
                </IconButton>
                <Typography sx={{ color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, minWidth: 70, textAlign: 'center' }}>
                  {currentPage} / {totalPages}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  aria-label="Próxima página"
                  sx={{ color: '#ffffff', p: 0.4, '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.25)' } }}
                >
                  <Iconify icon="solar:alt-arrow-right-bold" width={14} />
                </IconButton>
              </Stack>
            )}

            {/* Zoom */}
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <IconButton
                size="small"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                aria-label="Diminuir zoom"
                sx={{ color: '#ffffff', p: 0.4, '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.25)' } }}
              >
                <Iconify icon="solar:magnifer-zoom-out-bold" width={14} />
              </IconButton>
              <Tooltip title="Clique para resetar 100%">
                <Typography
                  onClick={handleZoomReset}
                  sx={{
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    minWidth: 42,
                    textAlign: 'center',
                    '&:hover': { color: '#8ab4f8' },
                  }}
                >
                  {Math.round(zoom * 100)}%
                </Typography>
              </Tooltip>
              <IconButton
                size="small"
                onClick={handleZoomIn}
                disabled={zoom >= 2.5}
                aria-label="Aumentar zoom"
                sx={{ color: '#ffffff', p: 0.4, '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.25)' } }}
              >
                <Iconify icon="solar:magnifer-zoom-in-bold" width={14} />
              </IconButton>

              <Button
                size="small"
                onClick={handleFitWidth}
                sx={{ color: '#d1d5db', fontSize: '0.7rem', minWidth: 'auto', px: 0.75, py: 0.2, textTransform: 'none' }}
              >
                Largura
              </Button>
              <Button
                size="small"
                onClick={handleFitPage}
                sx={{ color: '#d1d5db', fontSize: '0.7rem', minWidth: 'auto', px: 0.75, py: 0.2, textTransform: 'none' }}
              >
                Página
              </Button>
            </Stack>

            {/* Badge SHA-256 Verificado */}
            {preview?.metadata.sha256_checksum && (
              <Tooltip title={`SHA-256 Canônico do PDF: ${preview.metadata.sha256_checksum} (Clique para copiar)`}>
                <Stack
                  direction="row"
                  spacing={0.5}
                  onClick={handleCopySha256}
                  sx={{
                    alignItems: 'center',
                    ml: 1,
                    pl: 1,
                    borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
                    cursor: 'pointer',
                    bgcolor: checksumVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    px: 0.75,
                    py: 0.2,
                    borderRadius: 0.5,
                    border: `1px solid ${checksumVerified ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                    '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.25)' },
                  }}
                >
                  <Iconify
                    icon={checksumVerified ? 'solar:check-circle-bold' : 'solar:danger-triangle-bold'}
                    width={14}
                    sx={{ color: checksumVerified ? '#10B981' : '#F59E0B' }}
                  />
                  <Typography sx={{ color: '#ffffff', fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 600 }}>
                    SHA-256: {sha256Short}
                  </Typography>
                </Stack>
              </Tooltip>
            )}
          </Stack>

          {/* Lado Direito: Botões de Ação [👁️ Visualizar] e [⬇️ Exportar] */}
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexShrink: 0 }}>
            {action}

            {showViewButton && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleView}
                loading={isBusy || isPdfLoading}
                startIcon={<Iconify icon="solar:eye-bold" width={16} />}
                sx={{
                  color: '#f8fafc',
                  borderColor: 'rgba(255, 255, 255, 0.28)',
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  px: 1.75,
                  py: 0.5,
                  borderRadius: 0.75,
                  '&:hover': {
                    borderColor: '#ffffff',
                    bgcolor: 'rgba(255, 255, 255, 0.12)',
                  },
                }}
              >
                {viewButtonText}
              </Button>
            )}

            {showExportButton && (
              <Button
                variant="contained"
                size="small"
                onClick={onExport}
                loading={isExporting}
                startIcon={<Iconify icon="solar:download-square-bold" width={16} />}
                sx={{
                  bgcolor: '#10B981',
                  color: '#ffffff',
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  px: 2,
                  py: 0.5,
                  borderRadius: 0.75,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  '&:hover': {
                    bgcolor: '#059669',
                  },
                }}
              >
                {exportButtonText}
              </Button>
            )}

            {onClose && (
              <Tooltip title="Fechar">
                <IconButton
                  onClick={onClose}
                  size="small"
                  aria-label="Fechar"
                  sx={{
                    color: '#ffffff',
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.4)' },
                    p: 0.7,
                    ml: 0.5,
                  }}
                >
                  <Iconify icon="eva:close-fill" width={20} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>
      )}

      {/* Alerta de Erro de Renderização / Integridade */}
      {(errorMessage || validationError) && (
        <Box
          sx={{
            width: '100%',
            maxWidth: '210mm',
            mb: 3,
            p: 2,
            borderRadius: 1.5,
            bgcolor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Iconify icon="solar:danger-triangle-bold" width={22} sx={{ color: '#ef4444' }} />
            <Typography sx={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600 }}>
              {errorMessage || validationError}
            </Typography>
          </Stack>
          {onRetry && (
            <Button
              size="small"
              variant="outlined"
              onClick={onRetry}
              sx={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)', textTransform: 'none' }}
            >
              Tentar Novamente
            </Button>
          )}
        </Box>
      )}

      {/* Área Central: Canvas de Leitura do Documento */}
      <Box
        id="pdf-document-canvas"
        sx={{
          width: '100%',
          flexGrow: variant === 'dialog' ? 1 : 0,
          overflowY: variant === 'dialog' ? 'auto' : 'visible',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          p: variant === 'dialog' ? { xs: 1.5, sm: 2, md: 3 } : 0,
          pb: 6,
          '@media print': {
            pb: 0,
            display: 'block',
          },
        }}
      >
        {isBusy || isPdfLoading ? (
          <Box sx={{ py: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={42} sx={{ color: '#10B981' }} />
            <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>
              {isBusy
                ? 'Compilando documento via Typst Engine...'
                : 'Interpretando bytes reais do PDF via PDF.js...'}
            </Typography>
          </Box>
        ) : pdfDoc ? (
          /* Renderização das Páginas Reais do PDF em Canvas via PDF.js */
          <Stack spacing={3} sx={{ alignItems: 'center', width: '100%' }}>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
              <PdfPageCanvas
                key={pageNum}
                pdfDoc={pdfDoc}
                pageNumber={pageNum}
                zoom={zoom}
              />
            ))}
          </Stack>
        ) : (
          /* Fallback para Children / Modo Standalone Pré-Preview */
          children
        )}
      </Box>
    </Box>
  );
}
