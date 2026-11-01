import type { BoxProps } from '@mui/material/Box';

import React, { useState, useEffect } from 'react';

import Box from '@mui/material/Box';

import {
  Web3GlobeScene,
  isWebGLAvailable,
  isReducedMotionPreferred,
} from 'src/shared/components/three-splash';

// ----------------------------------------------------------------------

export type AuthGlobeBackgroundProps = BoxProps & {
  disabled?: boolean;
  autoRotateSpeed?: number;
  cameraPosition?: [number, number, number];
};

export function AuthGlobeBackground({
  disabled = false,
  autoRotateSpeed = 0.5,
  cameraPosition = [0, 0, 320],
  sx,
  ...other
}: AuthGlobeBackgroundProps) {
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    const webGLOk = isWebGLAvailable();
    const reducedMotion = isReducedMotionPreferred();
    setCanRender3D(webGLOk && !reducedMotion && !disabled);
  }, [disabled]);

  if (!canRender3D) {
    return null;
  }

  return (
    <Box
      data-testid="auth-globe-background"
      sx={[
        {
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          /**
           * Vinheta radial de iluminação Web3:
           * Mantém o globo visível e brilhante ao redor do card central,
           * e funde suavemente as bordas com o fundo escuro #030712 do DevOS.
           */
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% 50%, rgba(3, 7, 18, 0.25) 0%, rgba(3, 7, 18, 0.7) 65%, #030712 100%)',
            pointerEvents: 'none',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Web3GlobeScene
        cameraPosition={cameraPosition}
        autoRotateSpeed={autoRotateSpeed}
        style={{ width: '100%', height: '100%' }}
      />
    </Box>
  );
}
