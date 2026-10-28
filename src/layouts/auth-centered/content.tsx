import type { BoxProps } from '@mui/material/Box';

import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';

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
        (theme) => ({
          py: { xs: 2.5, sm: 3 },
          px: { xs: 2.5, sm: 3.5 },
          my: 'auto',
          width: 1,
          zIndex: 2,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 'var(--layout-auth-content-width)',
          position: 'relative',

          /** * ✅ ESTILO CRYSTAL (SocialFi 2026)
           * Fundo Deep Midnight + Estabilidade Total WebKitGTK
           */
          bgcolor: alpha('#020817', 0.95),

          /** * ✅ BORDA CRYSTAL REATIVA
           * Efeito de "fio de luz" gradiente (Ciano -> Branco -> Âmbar)
           */
          border: '1px solid rgba(0, 184, 217, 0.25)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '1px',
            background: `linear-gradient(180deg, 
              ${alpha(theme.palette.info.main, 0.9)} 0%, 
              ${alpha(theme.palette.common.white, 0.1)} 50%, 
              ${alpha(theme.palette.warning.main, 0.9)} 100%
            )`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          },

          boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.5)}, 0 0 30px rgba(0, 184, 217, 0.15)`,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {children}
    </Box>
  );
}
