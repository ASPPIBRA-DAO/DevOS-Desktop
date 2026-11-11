import type { DocumentPreviewResult } from 'src/platform/tauri/contracts/document-contracts';
import type { BlankSheetItem, DocumentTemplateItem } from '../data/document-templates-registry';

import React, { useState, useEffect, useCallback } from 'react';

import Dialog from '@mui/material/Dialog';

import { previewDocument } from 'src/platform/tauri';

import { toast } from 'src/shared/components/snackbar';
import { PdfViewerLayout } from 'src/shared/components/pdf-viewer';

type Props = {
  open: boolean;
  onClose: () => void;
  template: BlankSheetItem | DocumentTemplateItem | null;
};

export function TemplatePreviewDialog({ open, onClose, template }: Props) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<DocumentPreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTemplatePreview = useCallback(async () => {
    if (!open || !template) {
      setPreview(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await previewDocument({
        request: template.sampleRequest,
      });

      setPreview(res);
      toast.success(`Modelo "${template.title}" compilado via Typst Engine!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao compilar amostra do modelo';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [open, template]);

  useEffect(() => {
    loadTemplatePreview();
  }, [loadTemplatePreview]);

  if (!template) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            height: '92vh',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: '#2b2e31',
          },
        },
      }}
    >
      <PdfViewerLayout
        variant="dialog"
        documentTitle={template.title}
        preview={preview}
        isLoading={loading}
        errorMessage={error}
        onRetry={loadTemplatePreview}
        onClose={onClose}
      />
    </Dialog>
  );
}
