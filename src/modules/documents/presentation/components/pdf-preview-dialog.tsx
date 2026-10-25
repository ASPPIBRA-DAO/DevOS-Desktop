import type { DocumentProps } from '@react-pdf/renderer';

import React, { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { PdfExportService } from '../../services/pdf-export-service';

export interface PdfPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  filename: string;
  documentElement: React.ReactElement<DocumentProps> | null;
}

export const PdfPreviewDialog: React.FC<PdfPreviewDialogProps> = ({
  open,
  onClose,
  title,
  filename,
  documentElement,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    if (open && documentElement) {
      setLoading(true);
      setError(null);

      PdfExportService.renderToBlob(documentElement)
        .then((blob) => {
          if (!active) return;
          if (currentUrlRef.current) {
            PdfExportService.revokePreviewUrl(currentUrlRef.current);
          }
          const url = PdfExportService.createPreviewUrl(blob);
          currentUrlRef.current = url;
          setPdfBlob(blob);
          setPreviewUrl(url);
          setLoading(false);
        })
        .catch((err: Error) => {
          if (!active) return;
          setError(err?.message || 'Falha ao compilar documento PDF.');
          setLoading(false);
        });
    }

    return () => {
      active = false;
      if (currentUrlRef.current) {
        PdfExportService.revokePreviewUrl(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, [open, documentElement]);

  const handleDownload = () => {
    if (pdfBlob) {
      PdfExportService.downloadPdf(pdfBlob, filename);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: '#0a0e17',
            border: '1px solid #1e293b',
            borderRadius: 2,
            minHeight: 520,
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: '#00e5ff', fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Visualizador DevOS
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, py: 8 }}>
            <CircularProgress size={36} sx={{ color: '#00e5ff', mb: 2 }} />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Compilando visualização em alta fidelidade...
            </Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ p: 3, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#f87171' }}>
              Erro na geração do documento
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              {error}
            </Typography>
          </Box>
        )}

        {!loading && !error && previewUrl && (
          <Box
            component="iframe"
            src={previewUrl}
            title={title}
            sx={{
              width: '100%',
              height: 480,
              border: '1px solid #334155',
              borderRadius: 1,
              backgroundColor: '#1e293b',
            }}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: '1px solid #1e293b' }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8' }}>
          Fechar
        </Button>
        <Button
          variant="contained"
          onClick={handleDownload}
          disabled={loading || !pdfBlob}
          sx={{
            backgroundColor: '#00e5ff',
            color: '#0a0e17',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#00b4d8',
            },
          }}
        >
          Exportar PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};
