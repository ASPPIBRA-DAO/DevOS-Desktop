import type { DocumentTemplateItem } from '../data/document-templates-registry';

import React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { RouterLink } from 'src/app/router/components/router-link';

import { Iconify } from 'src/shared/components/iconify';

type Props = {
  template: DocumentTemplateItem;
  onPreview: (template: DocumentTemplateItem) => void;
};

export function TemplateCard({ template, onPreview }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getCategoryColor = () => {
    switch (template.category) {
      case 'contratos':
        return '#00A76F'; // Verde Oficial Institucional
      case 'financeiro':
        return '#0284C7'; // Azul D1 / Banco Digital
      case 'territorial':
        return '#D97706'; // Âmbar Terra / Maricá
      default:
        return '#9333EA';
    }
  };

  const accent = getCategoryColor();

  return (
    <Card
      sx={{
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.25s ease-in-out',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(145, 158, 171, 0.22)',
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: accent,
          boxShadow: `0 14px 32px -4px ${alpha(accent, 0.22)}`,
        },
      }}
    >
      <Box>
        {/* Capa Miniatura do Documento com Gradiente e Selo Oficial */}
        <Box
          sx={{
            height: 160,
            width: '100%',
            position: 'relative',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: isDark
              ? `linear-gradient(135deg, ${alpha(accent, 0.2)} 0%, rgba(15, 23, 42, 0.95) 100%)`
              : `linear-gradient(135deg, ${alpha(accent, 0.12)} 0%, #f8fafc 100%)`,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Topo da Capa: Categoria e Escopo */}
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip
              size="small"
              label={template.category.toUpperCase()}
              sx={{
                bgcolor: alpha(accent, 0.18),
                color: accent,
                fontWeight: 800,
                fontSize: '0.65rem',
                border: `1px solid ${alpha(accent, 0.3)}`,
              }}
            />

            <Chip
              size="small"
              icon={<Iconify icon={template.scope === 'cockpit' ? 'solar:shield-star-bold' : 'solar:users-group-two-rounded-bold'} width={14} />}
              label={template.scope === 'cockpit' ? 'Admin' : 'Universal'}
              sx={{
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)',
              }}
            />
          </Stack>

          {/* Centro da Capa: Brasão / Ícone Representativo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 'auto' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 1.5,
                bgcolor: '#ffffff',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accent,
                border: `1px solid ${alpha(accent, 0.3)}`,
              }}
            >
              <Iconify
                icon={
                  template.category === 'contratos'
                    ? 'solar:document-text-bold-duotone'
                    : template.category === 'financeiro'
                      ? 'solar:wallet-money-bold-duotone'
                      : 'solar:city-bold-duotone'
                }
                width={26}
              />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  lineHeight: 1.25,
                  color: isDark ? '#ffffff' : '#0f172a',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: '2.3rem',
                }}
              >
                {template.title}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                Typst Engine • {template.pageCountApprox}
              </Typography>
            </Box>
          </Box>

          {/* Base da Capa: Identificador de Integridade */}
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Iconify icon="solar:check-circle-bold" width={12} sx={{ color: '#10B981' }} />
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontFamily: 'monospace' }}>
              SHA-256 e ABNT Validados
            </Typography>
          </Stack>
        </Box>

        {/* Corpo do Cartão */}
        <Box sx={{ p: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '3.6rem',
            }}
          >
            {template.description}
          </Typography>

          {/* Tags de Identificação */}
          <Stack direction="row" spacing={0.6} sx={{ flexWrap: 'wrap', gap: 0.6, minHeight: 48 }}>
            {template.tags.map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 20, px: 0.5 }}
              />
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Ações no Rodapé: Visualizar e Emitir */}
      <Box
        sx={{
          p: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(145, 158, 171, 0.04)',
        }}
      >
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onPreview(template)}
            startIcon={<Iconify icon="solar:eye-bold" width={16} />}
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              minWidth: 0,
              px: 1,
              py: 0.75,
              flex: 1,
            }}
          >
            Visualizar
          </Button>

          <Button
            component={RouterLink}
            href={template.actionUrl}
            size="small"
            variant="contained"
            startIcon={<Iconify icon="solar:pen-new-round-bold" width={16} />}
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              minWidth: 0,
              px: 1,
              py: 0.75,
              bgcolor: accent,
              flex: 1,
              '&:hover': {
                bgcolor: alpha(accent, 0.85),
              },
            }}
          >
            Emitir
          </Button>
        </Stack>
      </Box>
    </Card>
  );
}

