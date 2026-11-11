import type { BlankSheetItem, DocumentTemplateItem } from './data/document-templates-registry';

import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/shared/components/iconify';

import { TemplateCard } from './components/template-card';
import { BlankSheetCard } from './components/blank-sheet-card';
import { TemplatePreviewDialog } from './components/template-preview-dialog';
import {
  BLANK_SHEETS_REGISTRY,
  DOCUMENT_TEMPLATES_REGISTRY,
} from './data/document-templates-registry';

export function DocumentTemplatesGalleryView() {
  const [previewingItem, setPreviewingItem] = useState<BlankSheetItem | DocumentTemplateItem | null>(null);

  const handleSelectBlankSheet = (sheet: BlankSheetItem) => {
    setPreviewingItem(sheet);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* 1. Header Hero Institucional */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(0, 167, 111, 0.16) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(0, 167, 111, 0.28)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
          <Box sx={{ maxWidth: 760 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <Chip
                icon={<Iconify icon="solar:shield-star-bold" width={14} />}
                label="DevOS Cockpit • Painel do Administrador"
                size="small"
                sx={{
                  bgcolor: 'rgba(0, 167, 111, 0.2)',
                  color: '#10B981',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  border: '1px solid rgba(0, 167, 111, 0.4)',
                }}
              />
              <Chip
                label="Typst Native Engine • 100% Offline"
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            </Stack>

            <Typography variant="h4" sx={{ fontWeight: 900, color: '#ffffff', letterSpacing: -0.5, mb: 1 }}>
              Catálogo de Modelos e Folhas Oficiais
            </Typography>

            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Explore a galeria completa de contratos, faturas, extratos associativos e especificações de folhas ABNT
              compilados nativamente com garantia de integridade criptográfica SHA-256.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              flexWrap: 'wrap',
              p: 2,
              borderRadius: 1.5,
              bgcolor: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Box sx={{ textAlign: 'center', px: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#10B981' }}>
                4
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
                Modelos Prontos
              </Typography>
            </Box>
            <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
            <Box sx={{ textAlign: 'center', px: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#38bdf8' }}>
                3
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
                Padrões de Folhas
              </Typography>
            </Box>
            <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
            <Box sx={{ textAlign: 'center', px: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#f59e0b' }}>
                ABNT
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
                Normatização
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* 2. Seção de Padrões de Folhas e Estruturas Base */}
      <Box sx={{ mb: 4.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Iconify icon="solar:ruler-angular-bold" width={22} sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Padrões de Folhas & Geometrias Disponíveis
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {BLANK_SHEETS_REGISTRY.map((sheet) => (
            <Grid key={sheet.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <BlankSheetCard sheet={sheet} onSelect={handleSelectBlankSheet} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 3. Seção de Modelos de Documentos Oficiais */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:documents-bold" width={22} sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Modelos Institucionais Prontos (Typst Engine)
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Exibindo <strong>{DOCUMENT_TEMPLATES_REGISTRY.length}</strong> modelo(s)
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {DOCUMENT_TEMPLATES_REGISTRY.map((template) => (
            <Grid key={template.id} size={{ xs: 12, sm: 6, md: 6, lg: 4, xl: 3 }}>
              <TemplateCard
                template={template}
                onPreview={(t) => setPreviewingItem(t)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 4. Modal de Pré-visualização Unificado com PDF.js e Typst */}
      <TemplatePreviewDialog
        open={Boolean(previewingItem)}
        template={previewingItem}
        onClose={() => setPreviewingItem(null)}
      />
    </Box>
  );
}

export default DocumentTemplatesGalleryView;
