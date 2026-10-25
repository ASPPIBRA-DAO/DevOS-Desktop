import type { Breakpoint } from '@mui/material/styles';
import type { NavItemProps, NavSectionProps } from 'src/components/nav-section';
import type { MainSectionProps, HeaderSectionProps, LayoutSectionProps } from '../core';

import { merge } from 'es-toolkit';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import { iconButtonClasses } from '@mui/material/IconButton';

import { allLangs } from 'src/locales';
import { Logo } from 'src/components/logo';
import { useAuthContext } from 'src/auth/hooks';
import { _contacts, _notifications } from 'src/_mock';
import { useSettingsContext } from 'src/components/settings';

import { NavMobile } from './nav-mobile';
import { VerticalDivider } from './content';
import { NavVertical } from './nav-vertical';
import { NavHorizontal } from './nav-horizontal';
import { _account } from '../nav-config-account';
import { Searchbar } from '../components/searchbar';
import { _workspaces } from '../nav-config-workspace';
import { MenuButton } from '../components/menu-button';
import { AccountDrawer } from '../components/account-drawer';
import { SettingsButton } from '../components/settings-button';
import { LanguagePopover } from '../components/language-popover';
import { ContactsPopover } from '../components/contacts-popover';
import { WorkspacesPopover } from '../components/workspaces-popover';
import { navData as dashboardNavData } from '../nav-config-dashboard';
import { dashboardLayoutVars, dashboardNavColorVars } from './css-vars';
import { NotificationsDrawer } from '../components/notifications-drawer';
import { MainSection, layoutClasses, HeaderSection, LayoutSection } from '../core';

// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type DashboardLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  slotProps?: {
    header?: HeaderSectionProps;
    nav?: {
      data?: NavSectionProps['data'];
    };
    main?: MainSectionProps;
  };
};

export function DashboardLayout({
  sx,
  cssVars,
  children,
  slotProps,
  layoutQuery = 'lg',
}: DashboardLayoutProps) {
  const theme = useTheme();

  const { user } = useAuthContext();

  const settings = useSettingsContext();

  const navVars = dashboardNavColorVars(theme, settings.state.navColor, settings.state.navLayout);

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const navData = slotProps?.nav?.data ?? dashboardNavData;

  const isNavMini = settings.state.navLayout === 'mini';
  const isNavHorizontal = settings.state.navLayout === 'horizontal';

  const canDisplayItemByRole = (allowedRoles: NavItemProps['allowedRoles']): boolean => {
    if (!allowedRoles) {
      return false;
    }
    if (user?.role === 'dev') {
      return false;
    }
    if (!user?.role) return false;
    return !allowedRoles.includes(user.role);
  };

  const renderHeader = () => {
    const headerSlotProps: HeaderSectionProps['slotProps'] = {
      container: {
        maxWidth: false,
        sx: {
          px: { xs: 1.5, [layoutQuery]: 2.5 },
          ...(isNavHorizontal && {
            bgcolor: 'var(--layout-nav-bg)',
            height: { [layoutQuery]: 'var(--layout-nav-horizontal-height)' },
            [`& .${iconButtonClasses.root}`]: { color: 'var(--layout-nav-text-secondary-color)' },
          }),
        },
      },
    };

    const headerSlots: HeaderSectionProps['slots'] = {
      topArea: (
        <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
          This is an info Alert.
        </Alert>
      ),
      bottomArea: isNavHorizontal ? (
        <NavHorizontal
          data={navData}
          layoutQuery={layoutQuery}
          cssVars={navVars.section}
          checkPermissions={canDisplayItemByRole}
        />
      ) : null,
      leftArea: (
        <>
          {/** @slot Nav mobile */}
          <MenuButton
            onClick={onOpen}
            sx={{ mr: 1, ml: -1, [theme.breakpoints.up(layoutQuery)]: { display: 'none' } }}
          />
          <NavMobile
            data={navData}
            open={open}
            onClose={onClose}
            cssVars={navVars.section}
            checkPermissions={canDisplayItemByRole}
          />

          {/** @slot Logo */}
          {isNavHorizontal && (
            <Logo
              sx={{
                display: 'none',
                [theme.breakpoints.up(layoutQuery)]: { display: 'inline-flex' },
              }}
            />
          )}

          {/** @slot Divider */}
          {isNavHorizontal && (
            <VerticalDivider sx={{ [theme.breakpoints.up(layoutQuery)]: { display: 'flex' } }} />
          )}

          {/** @slot Workspace popover */}
          <WorkspacesPopover
            data={_workspaces}
            sx={{ ...(isNavHorizontal && { color: 'var(--layout-nav-text-primary-color)' }) }}
          />
        </>
      ),
      rightArea: (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 0.85 },
            '& .MuiIconButton-root:not(.account-button)': {
              width: 38,
              height: 38,
              borderRadius: 1.5,
              background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
              border: '1px solid rgba(145, 158, 171, 0.22)',
              boxShadow:
                '0 2px 6px -1px rgba(15, 23, 42, 0.08), inset 0 1.5px 0 #ffffff, inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
              transition: theme.transitions.create(
                ['background', 'border-color', 'box-shadow', 'transform'],
                { duration: theme.transitions.duration.shorter }
              ),
              '&:hover': {
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)',
                borderColor: 'rgba(0, 167, 111, 0.45)',
                boxShadow:
                  '0 6px 16px -2px rgba(0, 167, 111, 0.22), inset 0 1.5px 0 #ffffff',
                transform: 'translateY(-1.5px)',
              },
              '&:active': {
                transform: 'translateY(1px)',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
              },
              ...theme.applyStyles('dark', {
                background:
                  'linear-gradient(180deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow:
                  '0 2px 8px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                '&:hover': {
                  borderColor: 'rgba(0, 255, 127, 0.5)',
                  boxShadow:
                    '0 0 14px rgba(0, 255, 127, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                },
                '&:active': {
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
                },
              }),
            },
          }}
        >
          {/** @slot Searchbar */}
          <Searchbar data={navData} />

          {/** @slot Language popover */}
          <LanguagePopover data={allLangs} />

          {/** @slot Notifications popover */}
          <NotificationsDrawer data={_notifications} />

          {/** @slot Contacts popover */}
          <ContactsPopover data={_contacts} />

          {/** @slot Settings button */}
          <SettingsButton />

          {/** @slot Account drawer */}
          <AccountDrawer data={_account} />
        </Box>
      ),
    };

    return (
      <HeaderSection
        layoutQuery={layoutQuery}
        disableOffset
        disableElevation
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {}) as any}
        sx={[
          {
            position: 'sticky',
            top: { xs: 8, [layoutQuery]: 16 },
            mt: { xs: 1, [layoutQuery]: 2 },
            mb: { xs: 1.5, [layoutQuery]: 2.5 },
            left: 0,
            right: 0,
            mx: 'auto',
            width: { xs: 'calc(100% - 24px)', [layoutQuery]: 'calc(100% - 32px)' },
            borderRadius: { xs: 2, [layoutQuery]: '20px' },
            overflow: 'hidden',

            // 💎 VIDROMORFISMO 3D (TRANSLUCÊNCIA CRISTALINA + APPLE RETINA BLUR)
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

            // 💡 LINHA DE LUZ ESPECULAR INFERIOR CONTÍNUA (BISEL HOLOGRÁFICO)
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

            // 🌑 MODO DARK CYBER / OBSIDIAN GLASS
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
          ...(Array.isArray(slotProps?.header?.sx)
            ? slotProps.header.sx
            : [slotProps?.header?.sx]),
        ]}
      />
    );
  };

  const renderSidebar = () => (
    <NavVertical
      data={navData}
      isNavMini={isNavMini}
      layoutQuery={layoutQuery}
      cssVars={navVars.section}
      checkPermissions={canDisplayItemByRole}
      onToggleNav={() =>
        settings.setField(
          'navLayout',
          settings.state.navLayout === 'vertical' ? 'mini' : 'vertical'
        )
      }
    />
  );

  const renderFooter = () => null;

  const renderMain = () => <MainSection {...slotProps?.main}>{children}</MainSection>;

  return (
    <LayoutSection
      /** **************************************
       * @Header
       *************************************** */
      headerSection={renderHeader()}
      /** **************************************
       * @Sidebar
       *************************************** */
      sidebarSection={isNavHorizontal ? null : renderSidebar()}
      /** **************************************
       * @Footer
       *************************************** */
      footerSection={renderFooter()}
      /** **************************************
       * @Styles
       *************************************** */
      cssVars={{ ...dashboardLayoutVars(theme), ...navVars.layout, ...cssVars }}
      sx={[
        {
          minHeight: '100vh',
          background: [
            'radial-gradient(at 0% 0%, rgba(0, 167, 111, 0.05) 0px, transparent 45%)',
            'radial-gradient(at 100% 0%, rgba(0, 210, 255, 0.05) 0px, transparent 45%)',
            'radial-gradient(at 50% 50%, rgba(145, 158, 171, 0.04) 0px, transparent 60%)',
            theme.vars.palette.background.neutral,
          ].join(', '),
          ...theme.applyStyles('dark', {
            background: [
              'radial-gradient(at 0% 0%, rgba(0, 255, 127, 0.06) 0px, transparent 50%)',
              'radial-gradient(at 100% 0%, rgba(0, 210, 255, 0.05) 0px, transparent 50%)',
              '#020817',
            ].join(', '),
          }),
          [`& .${layoutClasses.sidebarContainer}`]: {
            minHeight: '100vh',
            [theme.breakpoints.up(layoutQuery)]: {
              pl: isNavMini
                ? 'calc(var(--layout-nav-mini-width) + 16px)'
                : 'calc(var(--layout-nav-vertical-width) + 16px)',
              transition: theme.transitions.create(['padding-left'], {
                easing: 'var(--layout-transition-easing)',
                duration: 'var(--layout-transition-duration)',
              }),
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {renderMain()}
    </LayoutSection>
  );
}
