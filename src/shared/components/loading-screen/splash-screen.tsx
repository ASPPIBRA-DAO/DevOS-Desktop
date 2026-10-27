import type { Theme, SxProps } from '@mui/material/styles';
import type { AnimateLogoProps } from '../animate';

import React, { Suspense, Fragment } from 'react';

import Portal from '@mui/material/Portal';
import { styled } from '@mui/material/styles';

import { AnimateLogoZoom } from '../animate';

// Carregamento sob demanda (Lazy) para garantir impacto ZERO no bundle inicial
const LazyThreeSplash = React.lazy(() =>
  import('../three-splash').then((m) => ({ default: m.ThreeSplashView }))
);

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
    logo?: AnimateLogoProps;
  };
};

export function SplashScreen({
  portal = true,
  enableThree = false,
  onAnimationComplete,
  slots,
  slotProps,
  sx,
  ...other
}: SplashScreenProps) {
  const PortalWrapper = portal ? Portal : Fragment;

  // Se o modo Three.js estiver habilitado, renderiza a cena 3D cinematográfica sob demanda
  if (enableThree) {
    return (
      <PortalWrapper>
        <Suspense
          fallback={
            <LoadingWrapper {...slotProps?.wrapper}>
              <LoadingContent sx={sx} {...other}>
                {slots?.logo ?? <AnimateLogoZoom {...slotProps?.logo} />}
              </LoadingContent>
            </LoadingWrapper>
          }
        >
          <LazyThreeSplash
            onComplete={onAnimationComplete}
            slots={{ customScene: slots?.threeScene }}
          />
        </Suspense>
      </PortalWrapper>
    );
  }

  // Fallback padrão: Logo animado 2D existente
  return (
    <PortalWrapper>
      <LoadingWrapper {...slotProps?.wrapper}>
        <LoadingContent sx={sx} {...other}>
          {slots?.logo ?? <AnimateLogoZoom {...slotProps?.logo} />}
        </LoadingContent>
      </LoadingWrapper>
    </PortalWrapper>
  );
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
