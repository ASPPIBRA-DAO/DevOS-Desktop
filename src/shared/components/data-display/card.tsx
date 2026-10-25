import type { BoxProps } from '@mui/material/Box';

import React from 'react';

import Box from '@mui/material/Box';

import { colors } from '../../theme/palette';

export interface CardProps extends BoxProps {
  variant?: 'glass' | 'solid' | 'interactive';
  glowing?: boolean;
}

export function Card({
  children,
  variant = 'glass',
  glowing = false,
  sx,
  ...rest
}: CardProps) {
  const isGlass = variant === 'glass' || variant === 'interactive';
  const isInteractive = variant === 'interactive';

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 2,
        p: 2.5,
        backgroundColor: isGlass ? colors.background.glass : colors.background.paper,
        backdropFilter: isGlass ? 'blur(16px)' : 'none',
        border: `1px solid ${glowing ? colors.primary.main : colors.background.border}`,
        boxShadow: glowing
          ? '0 0 24px -4px rgba(0, 240, 255, 0.25)'
          : '0 4px 20px -2px rgba(0, 0, 0, 0.35)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(isInteractive && {
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: 'rgba(0, 240, 255, 0.4)',
            boxShadow: '0 8px 30px -4px rgba(0, 240, 255, 0.2)',
          },
        }),
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}
