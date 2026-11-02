import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useRouter } from 'src/app/router/hooks';

import { Iconify } from 'src/shared/components/iconify';

type PdfViewerLayoutProps = {
  children: React.ReactNode;
  documentTitle: string;
  onBack?: () => void;
  onView?: () => void;
  onExport?: () => void;
  isExporting?: boolean;
  isViewing?: boolean;
  viewButtonText?: string;
  exportButtonText?: string;
};

export function PdfViewerLayout({
  children,
  documentTitle,
  onBack,
  onView,
  onExport,
  isExporting = false,
  isViewing = false,
  viewButtonText = 'Visualizar',
  exportButtonText = 'Exportar',
}: PdfViewerLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleView = () => {
    if (onView) {
      onView();
    } else {
      const canvasEl = document.getElementById('pdf-document-canvas') || window;
      canvasEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const displayTitle = documentTitle.endsWith('.pdf') ? documentTitle : `${documentTitle}.pdf`;

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
      {/* Barra Superior do Visualizador (Perfeitamente contida na área de conteúdo, sem colidir com sidebar ou header do app) */}
      <Box
        className="no-print"
        sx={{
          width: '100%',
          maxWidth: '210mm',
          bgcolor: '#323639',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: 1.5,
          px: { xs: 1.5, sm: 2.5 },
          py: 1.25,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
          mb: 3,
          position: 'sticky',
          top: { xs: 60, md: 72 }, // Posicionada de forma sticky abaixo do cabeçalho do DevOS
          zIndex: 100,
          '@media print': { display: 'none !important' },
        }}
      >
        {/* Lado Esquerdo: [← Voltar] + 📄 Titulo_Do_Documento.pdf */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0, mr: 1 }}>
          <IconButton
            onClick={handleBack}
            size="small"
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
              }}
            >
              {displayTitle}
            </Typography>
          </Stack>
        </Stack>

        {/* Lado Direito: Exatamente 2 Botões [👁️ Visualizar] e [⬇️ Exportar] */}
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexShrink: 0 }}>
          {/* Botão 1: [Visualizar] */}
          <Button
            variant="outlined"
            size="small"
            onClick={handleView}
            loading={isViewing}
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

          {/* Botão 2: [⬇️ Exportar] */}
          <Button
            variant="contained"
            size="small"
            onClick={onExport}
            loading={isExporting}
            startIcon={<Iconify icon="solar:file-download-bold" width={16} />}
            sx={{
              bgcolor: '#10B981', // Verde Institucional ASPPIBRA
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

      {/* Área Central: Canvas de Leitura com Folha A4 Centralizada */}
      <Box
        id="pdf-document-canvas"
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          pb: 6,
          '@media print': {
            pb: 0,
            display: 'block',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
