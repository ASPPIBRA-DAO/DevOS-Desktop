import type { Theme, SxProps } from '@mui/material/styles';

import React, { Fragment } from 'react';

import Portal from '@mui/material/Portal';

import { ThreeSplashView } from '../three-splash';

// ----------------------------------------------------------------------

export type SplashScreenProps = React.ComponentProps<'div'> & {
  portal?: boolean;
  sx?: SxProps<Theme>;
  enableThree?: boolean;
  onAnimationComplete?: () => void;
  slots?: {
    logo?: React.ReactNode;
    threeScene?: React.ReactNode;
  };
};

export function SplashScreen({
  portal = true,
  enableThree = true,
  onAnimationComplete,
  slots,
}: SplashScreenProps) {
  const PortalWrapper = portal ? Portal : Fragment;

  // Renderiza a cena com a animação do globo Three.js
  if (enableThree) {
    return (
      <PortalWrapper>
        <ThreeSplashView
          onComplete={onAnimationComplete}
          slots={{ customScene: slots?.threeScene }}
        />
      </PortalWrapper>
    );
  }

  return null;
}
