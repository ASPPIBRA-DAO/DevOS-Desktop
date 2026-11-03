import type { DocumentPreviewResult } from 'src/platform/tauri/contracts/document-contracts';

import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/app/router/hooks';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';

import {
  isValidPdfHeader,
  computeSha256Hex,
  base64ToUint8Array,
} from './pdf-binary-utils';

export type PdfViewerLayoutProps = {
  children?: React.ReactNode;
  documentTitle: string;
  preview?: DocumentPreviewResult | null;
  onBack?: () => void;
  onView?: () => void;
  onExport?: () => void;
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
  onBack,
  onView,
  onExport,
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

  const displayTitle = documentTitle.endsWith('.pdf') ? documentTitle : `${documentTitle}.pdf`;

  const totalPages = useMemo(() => {
    if (preview?.pages && preview.pages.length > 0) {
      return preview.pages.length;
    }
    return 1;
  }, [preview]);

  // Validação estrita do binário do PDF ao receber ou trocar o preview
  useEffect(() => {
    let isCancelled = false;

    if (!preview || !preview.pdf_base64) {
      setChecksumVerified(false);
      setValidationError(null);
    } else {
      const validatePreviewPayload = async () => {
        try {
          const bytes = base64ToUint8Array(preview.pdf_base64);

          if (!isValidPdfHeader(bytes)) {
            if (!isCancelled) {
              setValidationError('O buffer binário recebido não possui o cabeçalho canônico %PDF-.');
              setChecksumVerified(false);
            }
            return;
          }

          const calculatedSha256 = await computeSha256Hex(bytes);
          const expectedSha256 = preview.metadata.sha256_checksum.toLowerCase();

          if (calculatedSha256.toLowerCase() !== expectedSha256) {
            if (!isCancelled) {
              setValidationError('Divergência de integridade: SHA-256 do binário difere dos metadados.');
              setChecksumVerified(false);
            }
            return;
          }

          if (!isCancelled) {
            setChecksumVerified(true);
            setValidationError(null);
          }
        } catch (err: unknown) {
          if (!isCancelled) {
            const msg = err instanceof Error ? err.message : 'Falha na validação do PDF.';
            setValidationError(msg);
            setChecksumVerified(false);
          }
        }
      };

      validatePreviewPayload();
    }

    return () => {
      isCancelled = true;
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
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: '#2b2e31',
        borderRadius: 2,
        p: { xs: 1.5, sm: 2, md: 3 },
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
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
      {/* Barra Superior do Visualizador (Perfeitamente contida e responsiva) */}
      <Box
        className="no-print"
        sx={{
          width: '100%',
          maxWidth: '240mm',
          bgcolor: '#323639',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: 1.5,
          px: { xs: 1.5, sm: 2 },
          py: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
          mb: 3,
          position: 'sticky',
          top: { xs: 60, md: 72 },
          zIndex: 100,
          '@media print': { display: 'none !important' },
        }}
      >
        {/* Lado Esquerdo: [← Voltar] + 📄 Titulo_Do_Documento.pdf */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <IconButton
            onClick={handleBack}
            size="small"
            aria-label="Voltar"
            sx={{
              color: '#ffffff',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
              p: 0.7,
            }}
          >
            <Iconify icon="solar:arrow-left-bold-duotone" width={18} />
          </IconButton>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Iconify icon="solar:document-text-bold" width={18} sx={{ color: '#8ab4f8', flexShrink: 0 }} />
            <Typography
              noWrap
              sx={{
                color: '#ffffff',
                fontSize: { xs: 11.5, sm: 13 },
                fontWeight: 700,
                fontFamily: 'monospace, "Arial", sans-serif',
                letterSpacing: '0.2px',
                maxWidth: { xs: 160, sm: 260, md: 360 },
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
          }}
        >
          {/* Paginação */}
          {preview?.pages && preview.pages.length > 0 && (
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
          <Button
            variant="outlined"
            size="small"
            onClick={handleView}
            loading={isBusy}
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

          <Button
            variant="contained"
            size="small"
            onClick={onExport}
            loading={isExporting}
            startIcon={<Iconify icon="solar:file-download-bold" width={16} />}
            sx={{
              bgcolor: '#10B981',
              color: '#ffffff',
              fontWeight: 800,
              textTransform: 'none',
              fontSize: '0.8rem',
              px: 2,
              py: 0.5,
              borderRadius: 0.75,
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
              '&:hover': {
                bgcolor: '#059669',
              },
            }}
          >
            {exportButtonText}
          </Button>
        </Stack>
      </Box>

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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          pb: 6,
          '@media print': {
            pb: 0,
            display: 'block',
          },
        }}
      >
        {isBusy ? (
          <Box sx={{ py: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={42} sx={{ color: '#10B981' }} />
            <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>
              Compilando visualização oficial do PDF via Typst Engine...
            </Typography>
          </Box>
        ) : preview?.pages && preview.pages.length > 0 ? (
          /* Renderização das Páginas Vetoriais do PDF Real */
          <Stack spacing={3} sx={{ alignItems: 'center', width: '100%' }}>
            {preview.pages.map((page) => {
              const scaledWidth = Math.round(page.width_pt * zoom);
              const scaledHeight = Math.round(page.height_pt * zoom);

              return (
                <Box
                  key={page.page_number}
                  id={`pdf-page-${page.page_number}`}
                  sx={{
                    width: scaledWidth,
                    minHeight: scaledHeight,
                    bgcolor: '#ffffff',
                    borderRadius: 0.5,
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'width 0.1s ease-out, min-height 0.1s ease-out',
                  }}
                >
                  <img
                    src={`data:image/svg+xml;base64,${page.svg_base64}`}
                    alt={`Página ${page.page_number} de ${totalPages}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'block',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        ) : (
          /* Fallback para Children / Modo Standalone Pré-Preview */
          children
        )}
      </Box>
    </Box>
  );
}
