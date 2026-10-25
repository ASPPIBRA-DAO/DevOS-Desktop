import type { Breakpoint } from '@mui/material/styles';
import type { NavSectionProps } from 'src/components/nav-section';

import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';
import { NavSectionMini, NavSectionVertical } from 'src/components/nav-section';

import { layoutClasses } from '../core';
import { NavUpgrade } from '../components/nav-upgrade';
import { NavToggleButton } from '../components/nav-toggle-button';

// ----------------------------------------------------------------------

export type NavVerticalProps = React.ComponentProps<'div'> &
  NavSectionProps & {
    isNavMini: boolean;
    layoutQuery?: Breakpoint;
    onToggleNav: () => void;
    slots?: {
      topArea?: React.ReactNode;
      bottomArea?: React.ReactNode;
    };
  };

export function NavVertical({
  sx,
  data,
  slots,
  cssVars,
  className,
  isNavMini,
  onToggleNav,
  checkPermissions,
  layoutQuery = 'md',
  ...other
}: NavVerticalProps) {
  const renderNavVertical = () => (
    <>
      {slots?.topArea ?? (
        <Box sx={{ pl: 3.5, pt: 2.5, pb: 1, flexShrink: 0 }}>
          <Logo />
        </Box>
      )}

      <Scrollbar
        fillContent
        sx={{
          height: 1,
          minHeight: 0,
          flex: '1 1 auto',
          overflow: 'hidden',
          borderRadius: 'inherit',
        }}
      >
        <NavSectionVertical
          data={data}
          cssVars={cssVars}
          checkPermissions={checkPermissions}
          sx={{ px: 2, flex: '1 1 auto' }}
        />

        {slots?.bottomArea ?? <NavUpgrade />}
      </Scrollbar>
    </>
  );

  const renderNavMini = () => (
    <>
      {slots?.topArea ?? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2.5 }}>
          <Logo />
        </Box>
      )}

      <NavSectionMini
        data={data}
        cssVars={cssVars}
        checkPermissions={checkPermissions}
        sx={[
          (theme) => ({
            ...theme.mixins.hideScrollY,
            pb: 2,
            px: 0.5,
            flex: '1 1 auto',
            overflowY: 'auto',
            borderRadius: 'inherit',
          }),
        ]}
      />

      {slots?.bottomArea}
    </>
  );

  return (
    <NavRoot
      isNavMini={isNavMini}
      layoutQuery={layoutQuery}
      className={mergeClasses([layoutClasses.nav.root, layoutClasses.nav.vertical, className])}
      sx={sx}
      {...other}
    >
      <NavToggleButton
        isNavMini={isNavMini}
        onClick={onToggleNav}
        sx={[
          (theme) => ({
            display: 'none',
            [theme.breakpoints.up(layoutQuery)]: { display: 'inline-flex' },
          }),
        ]}
      />
      {isNavMini ? renderNavMini() : renderNavVertical()}
    </NavRoot>
  );
}

// ----------------------------------------------------------------------

const NavRoot = styled('div', {
  shouldForwardProp: (prop: string) => !['isNavMini', 'layoutQuery', 'sx'].includes(prop),
})<Pick<NavVerticalProps, 'isNavMini' | 'layoutQuery'>>(
  ({ isNavMini, layoutQuery = 'md', theme }) => ({
    top: 16,
    left: 16,
    height: 'calc(100vh - 32px)',
    display: 'none',
    position: 'fixed',
    flexDirection: 'column',
    zIndex: 'var(--layout-nav-zIndex)',
    width: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
    borderRadius: 20,
    overflow: 'visible',

    // 💎 VIDROMORFISMO 3D (TRANSLUCÊNCIA CRISTALINA + APPLE RETINA BLUR)
    background:
      'linear-gradient(180deg, rgba(255, 255, 255, 0.82) 0%, rgba(248, 250, 252, 0.70) 50%, rgba(241, 245, 249, 0.80) 100%)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.75)',
    boxShadow: [
      '0 20px 48px -10px rgba(15, 23, 42, 0.12)',
      '0 8px 20px -4px rgba(15, 23, 42, 0.06)',
      'inset 0 1.5px 0 rgba(255, 255, 255, 0.95)',
      'inset 1.5px 0 0 rgba(255, 255, 255, 0.75)',
      'inset 0 -1.5px 0 rgba(0, 0, 0, 0.04)',
      'inset -1.5px 0 0 rgba(0, 0, 0, 0.03)',
    ].join(', '),

    // ✨ REFLEXO GLOSSY DIAGONAL 3D (WET GLASS SHEEN)
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '100%',
      borderRadius: 'inherit',
      background:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.08) 25%, transparent 55%)',
      pointerEvents: 'none',
      zIndex: 1,
    },

    // 🌑 MODO DARK / CYBER (OBSIDIAN TRANSLÚCIDO FLUTUANTE COM CHANFRO DE LUZ)
    ...theme.applyStyles('dark', {
      background:
        'linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, rgba(2, 8, 23, 0.70) 50%, rgba(15, 23, 42, 0.82) 100%)',
      backdropFilter: 'blur(24px) saturate(190%)',
      WebkitBackdropFilter: 'blur(24px) saturate(190%)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: [
        '0 24px 60px -12px rgba(0, 0, 0, 0.75)',
        '0 10px 24px -4px rgba(0, 0, 0, 0.55)',
        'inset 0 1.5px 0 rgba(255, 255, 255, 0.22)',
        'inset 1px 0 0 rgba(255, 255, 255, 0.08)',
        'inset 0 -1.5px 0 rgba(0, 0, 0, 0.5)',
      ].join(', '),
      '&::before': {
        background:
          'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 30%, transparent 60%)',
      },
    }),

    transition: theme.transitions.create(
      ['width', 'box-shadow', 'background-color', 'top', 'left', 'height'],
      {
        easing: 'var(--layout-transition-easing)',
        duration: 'var(--layout-transition-duration)',
      }
    ),
    [theme.breakpoints.up(layoutQuery)]: { display: 'flex' },
  })
);
