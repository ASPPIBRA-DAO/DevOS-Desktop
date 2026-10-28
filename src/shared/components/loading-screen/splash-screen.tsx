import type { Theme, SxProps } from '@mui/material/styles';

import React, { Fragment } from 'react';

import Portal from '@mui/material/Portal';
import { styled } from '@mui/material/styles';

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
  slotProps?: {
    wrapper?: React.ComponentProps<typeof LoadingWrapper>;
  };
};

export function SplashScreen({
  portal = true,
  enableThree = true,
  onAnimationComplete,
  slots,
  slotProps,
  sx,
  ...other
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

// ----------------------------------------------------------------------

const LoadingWrapper = styled('div')({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
});

const LoadingContent = styled('div')(({ theme }) => ({
  right: 0,
  bottom: 0,
  zIndex: 9998,
  flexGrow: 1,
  width: '100%',
  height: '100%',
  display: 'flex',
  position: 'fixed',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#0b0f19',
}));
