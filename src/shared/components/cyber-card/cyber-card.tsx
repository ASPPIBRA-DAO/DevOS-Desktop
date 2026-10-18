'use client';

import type { BoxProps } from '@mui/material/Box';
import type { Theme } from '@mui/material/styles';

import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export type CyberCardVariant = 'default' | 'hero' | 'notary' | 'catalog' | 'sidebar' | 'certificate';
export type CyberColorKey = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

export interface CyberCardProps extends BoxProps {
  variant?: CyberCardVariant;
  color?: CyberColorKey;
  glow?: boolean;
}

export function CyberCard({
  variant = 'default',
  color = 'primary',
  glow = false,
  sx,
  children,
  ...other
}: CyberCardProps) {
  const theme = useTheme();

  // Cores de acento neon
  const neonAccent =
    color === 'primary'
      ? '#00ff7f'
      : color === 'info'
        ? '#00d2ff'
        : color === 'warning'
          ? '#FFD700'
          : theme.palette[color].main;

  const mainColor = theme.palette[color]?.main || theme.palette.primary.main;
  const secondaryColor = color === 'primary' ? theme.palette.info.main : theme.palette.primary.main;

  // Variantes específicas de estilização
  const getVariantStyles = (t: Theme) => {
    switch (variant) {
      case 'hero':
        return {
          p: { xs: 3, md: 4.5 },
          border: `1px solid ${alpha(neonAccent, 0.25)}`,
          ...(glow && {
            boxShadow: `0 0 35px ${alpha(mainColor, 0.25)}`,
          }),
          '@media print': {
            border: '2px solid #000 !important',
            borderRadius: '0 !important',
            boxShadow: 'none !important',
            p: '16pt !important',
            bgcolor: '#ffffff !important',
            color: '#000000 !important',
            breakInside: 'avoid !important',
            pageBreakInside: 'avoid !important',
          },
        };

      case 'notary':
        return {
          p: { xs: 2.5, md: 3 },
          bgcolor: alpha('#020817', 0.75),
          border: `1px solid ${alpha('#00d2ff', 0.25)}`,
          '@media print': {
            bgcolor: '#ffffff !important',
            border: '1px solid #000 !important',
            borderRadius: '0 !important',
            boxShadow: 'none !important',
            p: '12pt !important',
            breakInside: 'avoid !important',
            pageBreakInside: 'avoid !important',
          },
        };

      case 'catalog':
        return {
          p: 3,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 0 35px ${alpha(mainColor, 0.25)}`,
          },
        };

      case 'sidebar':
        return {
          p: 2.5,
          bgcolor: alpha('#020817', 0.85),
          border: `1px solid ${alpha('#fff', 0.08)}`,
        };

      case 'certificate':
        return {
          p: { xs: 3, md: 5 },
          bgcolor: alpha('#020817', 0.9),
          border: `1px solid ${alpha(neonAccent, 0.3)}`,
          textAlign: 'center',
          '@media print': {
            bgcolor: '#ffffff !important',
            border: '1.5pt solid #000000 !important',
            borderRadius: '0 !important',
            boxShadow: 'none !important',
            p: '16pt !important',
            breakBefore: 'page !important',
            pageBreakBefore: 'always !important',
            breakInside: 'avoid !important',
            pageBreakInside: 'avoid !important',
          },
        };

      case 'default':
      default:
        return {
          p: 3,
        };
    }
  };

  return (
    <Box
      sx={[
        {
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: alpha('#020817', 0.85),
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          position: 'relative',
          border: 'none',
          boxShadow: `inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}, inset 0 -1px 1px ${alpha('#000', 0.5)}`,

          // 1. REFLEXO GLOSSY (WET GLASS)
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.common.white, 0.15)} 0%, 
              ${alpha(theme.palette.common.white, 0)} 40%, 
              ${alpha(theme.palette.common.white, 0)} 100%
            )`,
            pointerEvents: 'none',
            zIndex: 10,
          },

          // 2. BORDA MAGNÉTICA HIGH-TECH (1.5px)
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '1.5px',
            background: `linear-gradient(180deg, 
              ${mainColor} 0%, 
              ${alpha(theme.palette.common.white, 0.05)} 50%, 
              ${secondaryColor} 100%
            )`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            zIndex: 11,
            pointerEvents: 'none',
          },

          // Aplicação dos estilos da variante
          ...getVariantStyles(theme),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {/* 3. CAMADA INTERNA DO CONTEÚDO (Z-INDEX 9) */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 9,
          width: 1,
          height: 1,
          display: 'inherit',
          flexDirection: 'inherit',
          alignItems: 'inherit',
          justifyContent: 'inherit',
          gap: 'inherit',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
