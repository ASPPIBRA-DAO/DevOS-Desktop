import type { BlankSheetItem } from '../data/document-templates-registry';

import React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/shared/components/iconify';

type Props = {
  sheet: BlankSheetItem;
  onSelect?: (sheet: BlankSheetItem) => void;
};

export function BlankSheetCard({ sheet, onSelect }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isLandscape = sheet.orientation === 'landscape';

  return (
    <Card
      onClick={() => onSelect?.(sheet)}
      sx={{
        p: 2,
        cursor: 'pointer',
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.25s ease-in-out',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(145, 158, 171, 0.2)',
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#ffffff',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: sheet.accentColor,
          boxShadow: `0 12px 28px -4px ${alpha(sheet.accentColor, 0.25)}`,
        },
      }}
    >
      <Box>
        {/* Simulação Visual da Folha em Escala Miniatura */}
        <Box
          sx={{
            width: '100%',
            height: 140,
            borderRadius: 1.5,
            bgcolor: isDark ? '#0f172a' : '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            border: '1px dashed',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(145, 158, 171, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* A miniatura da folha de papel com margens representadas */}
          <Box
            sx={{
              width: isLandscape ? 120 : 85,
              height: isLandscape ? 85 : 120,
              bgcolor: '#ffffff',
              borderRadius: 0.5,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
              p: 0.8,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              border: `1px solid ${alpha(sheet.accentColor, 0.4)}`,
            }}
          >
            {/* Linha representando o cabeçalho */}
            <Box sx={{ height: 4, width: '70%', bgcolor: sheet.accentColor, borderRadius: 0.25 }} />

            {/* Linhas simulando o corpo de texto */}
            <Stack spacing={0.4} sx={{ width: '100%' }}>
              <Box sx={{ height: 2.5, width: '100%', bgcolor: '#e2e8f0', borderRadius: 0.25 }} />
              <Box sx={{ height: 2.5, width: '92%', bgcolor: '#e2e8f0', borderRadius: 0.25 }} />
              <Box sx={{ height: 2.5, width: '85%', bgcolor: '#e2e8f0', borderRadius: 0.25 }} />
              <Box sx={{ height: 2.5, width: '60%', bgcolor: '#e2e8f0', borderRadius: 0.25 }} />
            </Stack>

            {/* Linha representando o rodapé com código */}
            <Box sx={{ height: 3, width: '40%', bgcolor: '#cbd5e1', borderRadius: 0.25, alignSelf: 'flex-end' }} />
          </Box>

          <Chip
            size="small"
            label={sheet.dimensions}
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.9)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
        </Box>

        {/* Título e Padrão Normativo */}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
          <Box
            sx={{
              p: 0.6,
              borderRadius: 1,
              bgcolor: alpha(sheet.accentColor, 0.12),
              color: sheet.accentColor,
              display: 'inline-flex',
            }}
          >
            <Iconify icon={sheet.icon} width={18} />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {sheet.title}
          </Typography>
        </Stack>

        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, display: 'block', mb: 1 }}>
          {sheet.standard}
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.78rem', lineHeight: 1.45, mb: 1.5 }}>
          {sheet.description}
        </Typography>
      </Box>

      {/* Margens Técnicas Oficiais */}
      <Box
        sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(145, 158, 171, 0.08)',
          border: '1px solid',
          borderColor: 'divider',
          mb: 1.5,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
          <strong>Margens ABNT:</strong> {sheet.margins}
        </Typography>
      </Box>

      {/* Botão de Visualização Padronizado */}
      <Button
        fullWidth
        size="small"
        variant="outlined"
        startIcon={<Iconify icon="solar:eye-bold" width={16} />}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(sheet);
        }}
        sx={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'none',
          whiteSpace: 'nowrap',
          color: sheet.accentColor,
          borderColor: alpha(sheet.accentColor, 0.4),
          '&:hover': {
            borderColor: sheet.accentColor,
            bgcolor: alpha(sheet.accentColor, 0.08),
          },
        }}
      >
        Visualizar
      </Button>
    </Card>
  );
}

