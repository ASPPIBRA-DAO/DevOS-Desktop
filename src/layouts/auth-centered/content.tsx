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
  return (
    <Box
      className={mergeClasses([layoutClasses.content, className])}
      sx={[
        () => ({
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          my: 'auto',
          width: 1,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: { xs: '100%', sm: 480, md: 520 },
          position: 'relative',

          /**
           * ✅ HUD ABERTO FLUIDO (100vw × 100vh)
           * Sem borda de caixa fechada - fundo radial suave para legibilidade cristalina
           * mantendo o Globo 3D visível e integrado em tela cheia.
           */
          background:
            'radial-gradient(ellipse at center, rgba(2, 8, 23, 0.7) 0%, rgba(2, 8, 23, 0.35) 75%, transparent 100%)',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {children}
    </Box>
  );
}
