import type { Theme, Breakpoint } from '@mui/material/styles';
import type { NavSectionProps } from 'src/components/nav-section';

import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { useBoolean } from 'minimal-shared/hooks';
import { varAlpha, mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { styled, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { Logo } from 'src/components/logo';
import { usePathname } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import { NavSectionMini, NavSectionVertical } from 'src/components/nav-section';

import { MenuButton } from '../components/menu-button';
import { NavToggleButton } from '../components/nav-toggle-button';
import { MainSection, layoutClasses, HeaderSection, LayoutSection } from '../core';

// ----------------------------------------------------------------------

type Props = {
  children?: React.ReactNode;
};

export const DEVOS_NAV_DATA: NavSectionProps['data'] = [
  {
    subheader: 'FINANCEIRO',
    items: [
      {
        title: 'Tesouraria',
        path: paths.devos.dao,
        icon: <Iconify icon={'solar:shield-star-bold' as any} />,
      },
      {
        title: 'Carteiras',
        path: paths.devos.wallets,
        icon: <Iconify icon={'solar:wallet-bold' as any} />,
      },
      {
        title: 'Livro-Razão',
        path: paths.devos.ledger,
        icon: <Iconify icon={'solar:book-bookmark-bold' as any} />,
      },
      {
        title: 'Faturas',
        path: paths.devos.invoices,
        icon: <Iconify icon={'solar:bill-list-bold' as any} />,
      },
    ],
  },
  {
    subheader: 'OPERAÇÕES',
    items: [
      {
        title: 'Hub Analítico',
        path: paths.devos.analytics,
        icon: <Iconify icon={'solar:chart-square-bold' as any} />,
      },
      {
        title: 'Blog',
        path: paths.devos.blog,
        icon: <Iconify icon={'solar:document-text-bold' as any} />,
      },
    ],
  },
  {
    subheader: 'CONTROL PLANE',
    items: [
      {
        title: 'Observability',
        path: paths.devos.root,
        icon: <Iconify icon={'solar:graph-up-bold' as any} />,
      },
      {
        title: 'Database',
        path: paths.devos.database,
        icon: <Iconify icon={'solar:database-bold' as any} />,
      },
      {
        title: 'Notificações',
        path: paths.devos.notifications.root,
        icon: <Iconify icon={'solar:bell-bing-bold' as any} />,
      },
    ],
  },
  {
    subheader: 'SECURITY',
    items: [
      {
        title: 'Security',
        path: paths.devos.security,
        icon: <Iconify icon={'solar:shield-keyhole-bold' as any} />,
      },
      {
        title: 'Audit',
        path: paths.devos.audit,
        icon: <Iconify icon={'solar:document-text-bold' as any} />,
      },
    ],
  },
  {
    subheader: 'INFRASTRUCTURE',
    items: [
      {
        title: 'APIs',
        path: paths.devos.apis,
        icon: <Iconify icon={'solar:key-square-bold' as any} />,
      },
      {
        title: 'Infrastructure',
        path: paths.devos.infrastructure,
        icon: <Iconify icon={'solar:server-square-bold' as any} />,
      },
    ],
  },
];

export function getSectionTitle(pathname: string): string {
  if (pathname === paths.devos.root || pathname === `${paths.devos.root}/`) {
    return 'Observability';
  }
  if (pathname.startsWith(paths.devos.dao)) {
    return 'Tesouraria';
  }
  if (pathname.startsWith(paths.devos.wallets)) {
    return 'Carteiras';
  }
  if (pathname.startsWith(paths.devos.ledger)) {
    return 'Livro-Razão';
  }
  if (pathname.startsWith(paths.devos.invoices)) {
    return 'Faturas';
  }
  if (pathname.startsWith(paths.devos.analytics)) {
    return 'Hub Analítico';
  }
  if (pathname.startsWith(paths.devos.blog)) {
    return 'Blog';
  }
  if (pathname.startsWith(paths.devos.database)) {
    return 'Database';
  }
  if (pathname.startsWith(paths.devos.notifications.root)) {
    return 'Notificações';
  }
  if (pathname.startsWith(paths.devos.security)) {
    return 'Security';
  }
  if (pathname.startsWith(paths.devos.audit)) {
    return 'Audit';
  }
  if (pathname.startsWith(paths.devos.apis)) {
    return 'APIs';
  }
  if (pathname.startsWith(paths.devos.infrastructure)) {
    return 'Infrastructure';
  }
  return 'DevOS Cockpit';
}

function devosLayoutVars(theme: Theme) {
  const {
    vars: { palette },
  } = theme;

  return {
    '--layout-transition-easing': 'linear',
    '--layout-transition-duration': '120ms',
    '--layout-nav-zIndex': theme.zIndex.drawer + 1,
    '--layout-header-zIndex': theme.zIndex.appBar + 1,
    '--layout-nav-mini-width': '64px',
    '--layout-nav-vertical-width': '220px',
    '--layout-nav-horizontal-height': '64px',
    '--layout-dashboard-content-pt': theme.spacing(1),
    '--layout-dashboard-content-pb': theme.spacing(8),
    '--layout-dashboard-content-px': theme.spacing(5),
    '--layout-nav-bg': palette.background.default,
    '--layout-nav-horizontal-bg': varAlpha(palette.background.defaultChannel, 0.8),
    '--layout-nav-border-color': varAlpha(palette.grey['500Channel'], 0.12),
    '--layout-nav-text-primary-color': palette.text.primary,
    '--layout-nav-text-secondary-color': palette.text.secondary,
    '--layout-nav-text-disabled-color': palette.text.disabled,
    ...theme.applyStyles('dark', {
      '--layout-nav-border-color': varAlpha(palette.grey['500Channel'], 0.08),
      '--layout-nav-horizontal-bg': varAlpha(palette.background.defaultChannel, 0.96),
    }),
  };
}

// ----------------------------------------------------------------------

type NavRootProps = {
  isNavMini: boolean;
  layoutQuery?: Breakpoint;
};

const NavRoot = styled('div', {
  shouldForwardProp: (prop: string) => !['isNavMini', 'layoutQuery', 'sx'].includes(prop),
})<NavRootProps>(({ isNavMini, layoutQuery = 'md', theme }) => ({
  top: 10,
  left: 10,
  height: 'calc(100vh - 20px)',
  display: 'none',
  position: 'fixed',
  flexDirection: 'column',
  zIndex: 'var(--layout-nav-zIndex)',
  width: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
  borderRadius: 14,
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
}));

// ----------------------------------------------------------------------

export function DevOSLayout({ children }: Props) {
  const theme = useTheme();
  const pathname = usePathname();

  const isNavMini = useBoolean(false);
  const mobileNav = useBoolean(false);

  const layoutQuery: Breakpoint = 'md';

  useEffect(() => {
    document.title = 'DevOS — v2.2.3';
  }, []);

  useEffect(() => {
    if (mobileNav.value) {
      mobileNav.onFalse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const currentSection = getSectionTitle(pathname);

  // --------------------------------------------------------------------
  // 1. CABEÇALHO SUPERIOR (GLASSMORPHIC FLOATING CARD)
  // --------------------------------------------------------------------
  const renderHeader = () => (
    <HeaderSection
      className="no-print"
      layoutQuery={layoutQuery}
      disableOffset
      disableElevation
      slots={{
        leftArea: (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <MenuButton
              onClick={mobileNav.onTrue}
              sx={{ mr: 1, ml: -1, [theme.breakpoints.up(layoutQuery)]: { display: 'none' } }}
            />

            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                letterSpacing: -0.2,
                color: 'text.primary',
              }}
            >
              {currentSection}
            </Typography>
          </Stack>
        ),
        rightArea: null,
      }}
      slotProps={{
        container: {
          maxWidth: false,
          sx: {
            height: { xs: 46, [layoutQuery]: 50 },
            px: { xs: 1.5, [layoutQuery]: 2 },
          },
        },
      }}
      sx={[
        {
          '--layout-header-desktop-height': '50px',
          '--layout-header-mobile-height': '46px',
          position: 'sticky',
          top: { xs: 6, [layoutQuery]: 10 },
          mt: 0,
          mb: { xs: 1, [layoutQuery]: 1.5 },
          left: 0,
          right: 0,
          mx: 'auto',
          width: { xs: 'calc(100% - 20px)', [layoutQuery]: 'calc(100% - 28px)' },
          borderRadius: { xs: 1.5, [layoutQuery]: '14px' },
          overflow: 'hidden',
          isolation: 'isolate',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'transform',

          // 💎 VIDROMORFISMO 3D (PADRÃO DASHBOARD WEB)
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.82) 0%, rgba(248, 250, 252, 0.68) 50%, rgba(241, 245, 249, 0.78) 100%)',
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
          zIndex: 'var(--layout-header-zIndex)',

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

          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '2px',
            background:
              'linear-gradient(90deg, rgba(0, 167, 111, 0.6) 0%, rgba(145, 158, 171, 0.25) 35%, rgba(0, 210, 255, 0.5) 100%)',
            pointerEvents: 'none',
            zIndex: 2,
          },

          ...theme.applyStyles('dark', {
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.78) 0%, rgba(2, 8, 23, 0.70) 50%, rgba(15, 23, 42, 0.82) 100%)',
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
            '&::after': {
              background:
                'linear-gradient(90deg, rgba(0, 255, 127, 0.6) 0%, rgba(255, 255, 255, 0.12) 35%, rgba(0, 210, 255, 0.5) 100%)',
            },
          }),
        },
      ]}
    />
  );

  // --------------------------------------------------------------------
  // 2. BARRA LATERAL VERTICAL (DESKTOP) — AUTOCONTIDA
  // --------------------------------------------------------------------
  const renderSidebar = () => (
    <NavRoot
      isNavMini={isNavMini.value}
      layoutQuery={layoutQuery}
      className={mergeClasses([layoutClasses.nav.root, layoutClasses.nav.vertical, 'no-print'])}
      sx={{
        '@media print': {
          display: 'none !important',
        },
      }}
    >
      <NavToggleButton
        isNavMini={isNavMini.value}
        onClick={isNavMini.onToggle}
        sx={[
          {
            display: 'none',
            [theme.breakpoints.up(layoutQuery)]: { display: 'inline-flex' },
          },
        ]}
      />

      {isNavMini.value ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2.5, flexShrink: 0 }}>
            <Logo href={paths.devos.root} />
          </Box>

          <NavSectionMini
            data={DEVOS_NAV_DATA}
            sx={[
              {
                ...theme.mixins.hideScrollY,
                pb: 2,
                px: 0.5,
                flex: '1 1 auto',
                overflowY: 'auto',
                borderRadius: 'inherit',
              },
            ]}
          />
        </>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              pl: 2.25,
              pt: 2,
              pb: 1.25,
              flexShrink: 0,
            }}
          >
            <Logo href={paths.devos.root} sx={{ width: 34, height: 34 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2 }}>
                ASPPIBRA - DAO
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              minHeight: 0,
              flex: '1 1 0',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'scroll',
              overflowX: 'hidden',
              scrollBehavior: 'smooth',
              overscrollBehavior: 'contain',
              borderRadius: 'inherit',
              pr: '3px',

              // 🎚️ BARRA DE ROLAGEM NATIVA 3D VIDROMÓRFICA ULTRA-ELEGANTE E SEMPRE ATIVA
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0, 167, 111, 0.85) rgba(145, 158, 171, 0.1)',

              '&::-webkit-scrollbar': {
                width: '8px',
                display: 'block !important',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0, 0, 0, 0.04)',
                borderRadius: '8px',
                margin: '8px 0',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.06)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                ...theme.applyStyles('dark', {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.4)',
                }),
              },
              '&::-webkit-scrollbar-thumb': {
                background:
                  'linear-gradient(180deg, rgba(0, 167, 111, 0.95) 0%, rgba(0, 120, 103, 0.85) 100%)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow:
                  '0 2px 6px rgba(0, 167, 111, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                minHeight: '40px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                ...theme.applyStyles('dark', {
                  background:
                    'linear-gradient(180deg, rgba(0, 255, 127, 0.9) 0%, rgba(0, 167, 111, 0.8) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow:
                    '0 2px 8px rgba(0, 255, 127, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
                }),
                '&:hover': {
                  background:
                    'linear-gradient(180deg, #00ff7f 0%, #00d2ff 100%)',
                  boxShadow:
                    '0 0 14px rgba(0, 255, 127, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                },
              },
            }}
          >
            <NavSectionVertical
              data={DEVOS_NAV_DATA}
              sx={{ px: 1.25, flex: '1 0 auto' }}
            />

            <Box sx={{ px: 1.25, pb: 1.5, pt: 1, flexShrink: 0, mt: 'auto' }}>
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 1.25,
                  bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      boxShadow: `0 0 6px ${theme.vars.palette.success.main}`,
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    mock-node-alpha
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', fontSize: '0.68rem' }}
                >
                  Control Plane Sandbox • Mocks Ativos
                </Typography>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </NavRoot>
  );

  // --------------------------------------------------------------------
  // 3. BARRA LATERAL MOBILE (DRAWER RESPONSIVO)
  // --------------------------------------------------------------------
  const renderMobileNav = () => (
    <Drawer
      open={mobileNav.value}
      onClose={mobileNav.onFalse}
      slotProps={{
        paper: {
          className: mergeClasses([layoutClasses.nav.root, layoutClasses.nav.vertical]),
          sx: {
            overflow: 'unset',
            bgcolor: 'var(--layout-nav-bg)',
            width: 'var(--layout-nav-vertical-width)',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <Box sx={{ pl: 1.5, pt: 1, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Logo href={paths.devos.root} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            ASPPIBRA DevOS
          </Typography>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
            Control Plane
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          minHeight: 0,
          flex: '1 1 0',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'scroll',
          overflowX: 'hidden',
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain',
          my: 1,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 167, 111, 0.85) rgba(145, 158, 171, 0.1)',
          '&::-webkit-scrollbar': {
            width: '8px',
            display: 'block !important',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.04)',
            borderRadius: '4px',
            ...theme.applyStyles('dark', {
              background: 'rgba(255, 255, 255, 0.05)',
            }),
          },
          '&::-webkit-scrollbar-thumb': {
            background:
              'linear-gradient(180deg, rgba(0, 167, 111, 0.95) 0%, rgba(0, 120, 103, 0.85) 100%)',
            borderRadius: '4px',
            ...theme.applyStyles('dark', {
              background:
                'linear-gradient(180deg, rgba(0, 255, 127, 0.9) 0%, rgba(0, 167, 111, 0.8) 100%)',
            }),
          },
        }}
      >
        <NavSectionVertical
          data={DEVOS_NAV_DATA}
          sx={{ px: 1, flex: '1 0 auto' }}
        />
      </Box>

      <Box sx={{ pt: 1 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'success.main',
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
              mock-node-alpha
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', fontSize: '0.68rem' }}
          >
            Control Plane Sandbox • Mocks Ativos
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );

  // --------------------------------------------------------------------
  // 4. ÁREA PRINCIPAL
  // --------------------------------------------------------------------
  const renderMain = () => (
    <MainSection
      sx={{
        minWidth: 0,
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        '@media print': {
          p: '0 !important',
          m: '0 !important',
          width: '100% !important',
          maxWidth: '100% !important',
          display: 'block !important',
        },
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1680,
          px: { xs: 1.5, sm: 2, md: 3 },
          py: { xs: 2, md: 3 },
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: '100%',
          overflowX: 'hidden',
          '@media print': {
            p: '0 !important',
            m: '0 !important',
            width: '100% !important',
            maxWidth: '100% !important',
            display: 'block !important',
          },
        }}
      >
        {children ?? <Outlet />}
      </Container>
    </MainSection>
  );

  // --------------------------------------------------------------------
  // 5. RODAPÉ DE STATUS
  // --------------------------------------------------------------------
  const renderFooter = () => (
    <Box
      className="no-print"
      sx={{
        px: 3,
        py: 2,
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        color: 'text.secondary',
        '@media print': {
          display: 'none !important',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          ASPPIBRA DAO • Architecture Baseline v2.2.2 • Control Plane Sandbox (v2.2.3)
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          Safety Status: INV-001 through INV-017 Enforced • In-Memory Mocks Active
        </Typography>
      </Stack>
    </Box>
  );

  return (
    <LayoutSection
      headerSection={renderHeader()}
      sidebarSection={renderSidebar()}
      footerSection={renderFooter()}
      cssVars={devosLayoutVars(theme)}
      sx={[
        {
          minHeight: '100vh',
          background: [
            'radial-gradient(at 0% 0%, rgba(0, 167, 111, 0.05) 0px, transparent 45%)',
            'radial-gradient(at 100% 0%, rgba(0, 210, 255, 0.05) 0px, transparent 45%)',
            'radial-gradient(at 50% 50%, rgba(145, 158, 171, 0.04) 0px, transparent 60%)',
            theme.vars.palette.background.neutral,
          ].join(', '),
          backgroundAttachment: 'fixed',
          ...theme.applyStyles('dark', {
            background: [
              'radial-gradient(at 0% 0%, rgba(0, 255, 127, 0.06) 0px, transparent 50%)',
              'radial-gradient(at 100% 0%, rgba(0, 210, 255, 0.05) 0px, transparent 50%)',
              '#020817',
            ].join(', '),
            backgroundAttachment: 'fixed',
          }),
          [`& .${layoutClasses.sidebarContainer}`]: {
            minHeight: '100vh',
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
            '@media print': {
              pl: '0 !important',
              minHeight: 'auto !important',
            },
            [theme.breakpoints.up(layoutQuery)]: {
              pl: isNavMini.value
                ? 'calc(var(--layout-nav-mini-width) + 14px)'
                : 'calc(var(--layout-nav-vertical-width) + 14px)',
              transition: theme.transitions.create(['padding-left'], {
                easing: 'var(--layout-transition-easing)',
                duration: 'var(--layout-transition-duration)',
              }),
            },
          },
        },
      ]}
    >
      {renderMobileNav()}
      {renderMain()}
    </LayoutSection>
  );
}
