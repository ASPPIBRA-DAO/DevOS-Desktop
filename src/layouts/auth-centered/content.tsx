import type { BoxProps } from '@mui/material/Box';

import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';

import { layoutClasses } from '../core';

// ----------------------------------------------------------------------

export type AuthCenteredContentProps = BoxProps;

export function AuthCenteredContent({
  sx,
  children,
  className,
  ...other
}: AuthCenteredContentProps) {
  // Normaliza os estilos personalizados sem incluir valores ausentes.
  const customSx = Array.isArray(sx)
    ? sx
    : sx == null
      ? []
      : [sx];

  return (
    <Box
      className={mergeClasses([layoutClasses.content, className])}
      sx={[
        {
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          my: 'auto',
          width: 1,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: { xs: '100%', sm: 480, md: 520 },
          position: 'relative',

          // Fundo radial translúcido integrado ao globo 3D.
          background:
            'radial-gradient(ellipse at center, rgba(2, 8, 23, 0.7) 0%, rgba(2, 8, 23, 0.35) 75%, transparent 100%)',
        },
        ...customSx,
      ]}
      {...other}
    >
      {children}
    </Box>
  );
}
