'use client';

import type { ButtonProps } from '@mui/material/Button';

import Button from '@mui/material/Button';
import { alpha, useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export interface CyberButtonProps extends ButtonProps {
  glowColor?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | string;
  target?: string;
  rel?: string;
  component?: any;
}

export function CyberButton({ glowColor = 'primary', sx, children, ...other }: CyberButtonProps) {
  const theme = useTheme();

  // Resolve a cor principal a partir do tema ou valor hex customizado
  const mainColor =
    glowColor === 'primary'
      ? theme.palette.primary.main
      : glowColor === 'secondary'
        ? theme.palette.secondary.main
        : glowColor === 'info'
          ? theme.palette.info.main
          : glowColor === 'success'
            ? theme.palette.success.main
            : glowColor === 'warning'
              ? theme.palette.warning.main
              : glowColor === 'error'
                ? theme.palette.error.main
                : glowColor;

  return (
    <Button
      sx={[
        {
          height: 48,
          px: 3,
          borderRadius: 1.5,
          fontFamily: 'var(--font-orbitron), "Orbitron", sans-serif',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: 'common.white',
          border: 'none',
          position: 'relative',
          bgcolor: alpha('#020817', 0.7),
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: theme.transitions.create(['all']),

          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '1px',
            background: `linear-gradient(180deg, 
              ${alpha(mainColor, 1)} 0%, 
              ${alpha(mainColor, 0.15)} 50%, 
              ${alpha(mainColor, 0.8)} 100%
            )`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          },

          '&:hover': {
            bgcolor: alpha(mainColor, 0.12),
            transform: 'scale(1.03)',
            boxShadow: `0 0 25px 0 ${alpha(mainColor, 0.4)}`,
            '& .MuiButton-endIcon': {
              transform: 'translateX(4px)',
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {children}
    </Button>
  );
}
