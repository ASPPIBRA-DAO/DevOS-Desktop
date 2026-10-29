import type { Breakpoint } from '@mui/material/styles';
import type { AuthCenteredContentProps } from './content';
import type {
  MainSectionProps,
  HeaderSectionProps,
  LayoutSectionProps,
} from '../core';

import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { WindowBridge } from 'src/platform/tauri/window/window-bridge';

import { Logo } from 'src/shared/components/logo';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { AuthCenteredContent } from './content';
import { SettingsButton } from '../components/settings-button';
import {
  MainSection,
  LayoutSection,
  HeaderSection,
} from '../core';
import {
  AuthGlobeBackground,
  type AuthGlobeBackgroundProps,
} from './globe-background';

// ----------------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<
  LayoutSectionProps,
  'sx' | 'children' | 'cssVars'
>;

export type AuthCenteredLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  disableBackgroundGlobe?: boolean;
  globeProps?: Partial<AuthGlobeBackgroundProps>;
  slotProps?: {
    header?: HeaderSectionProps;
    main?: MainSectionProps;
    content?: AuthCenteredContentProps;
  };
};

// ----------------------------------------------------------------------
// Layout centralizado de autenticação
// ----------------------------------------------------------------------

export function AuthCenteredLayout({
  sx,
  cssVars,
  children,
  slotProps,
  layoutQuery = 'md',
  disableBackgroundGlobe = false,
  globeProps,
}: AuthCenteredLayoutProps) {
  // ------------------------------------------------------------
  // Janela nativa
  // ------------------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    try {
      const request = WindowBridge.setFullscreen(true);

      // Captura rejeições sem expor detalhes internos da ponte.
      void Promise.resolve(request).catch(() => {
        if (isMounted) {
          console.warn(
            'Não foi possível ajustar a janela para a tela de autenticação.'
          );
        }
      });
    } catch {
      // Também trata uma eventual exceção síncrona da ponte.
      console.warn(
        'Não foi possível solicitar o modo de tela cheia.'
      );
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // ------------------------------------------------------------
  // Cabeçalho
  // ------------------------------------------------------------

  const renderHeader = () => {
    const headerSlotProps: HeaderSectionProps['slotProps'] = {
      container: {
        maxWidth: false,
      },
    };

    // Mantém a composição profunda dos slots de forma estritamente tipada
    const mergedHeaderSlotProps: HeaderSectionProps['slotProps'] = {
      ...headerSlotProps,
      ...slotProps?.header?.slotProps,
      container: {
        ...headerSlotProps.container,
        ...slotProps?.header?.slotProps?.container,
      },
    };

    const headerSlots: HeaderSectionProps['slots'] = {
      leftArea: (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {/** @slot Logo */}
          <Logo />

          <Box
            sx={{
              display: {
                xs: 'none',
                sm: 'flex',
              },
              flexDirection: 'column',
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: 'info.main',
                fontFamily: 'var(--font-orbitron), sans-serif',
                letterSpacing: 2,
                fontWeight: 700,
                fontSize: '0.72rem',
                lineHeight: 1.2,
              }}
            >
              DevOS // Secure Enterprise
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: 'text.disabled',
                fontSize: '0.65rem',
                letterSpacing: 1,
              }}
            >
              Ambiente Nativo de Hardware
            </Typography>
          </Box>
        </Box>
      ),

      rightArea: (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: {
              xs: 1,
              sm: 2,
            },
          }}
        >
          <Box
            sx={{
              display: {
                xs: 'none',
                md: 'flex',
              },
              alignItems: 'center',
              gap: 0.8,
              px: 1.2,
              py: 0.4,
              borderRadius: 1,
              bgcolor: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'success.main',
                boxShadow: '0 0 8px #22c55e',
              }}
            />

            <Typography
              variant="caption"
              sx={{
                color: 'success.main',
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: 1,
              }}
            >
              HSM ATIVO
            </Typography>
          </Box>

          {/** @slot Help link */}
          <Link
            href={paths.faqs}
            component={RouterLink}
            sx={{
              typography: 'subtitle2',
              color: 'info.main',
              fontFamily: 'var(--font-orbitron), sans-serif',
              textDecoration: 'none',
              fontSize: '0.8rem',
              '&:hover': {
                textShadow: '0 0 8px rgba(0, 184, 217, 0.8)',
              },
            }}
          >
            Precisa de ajuda?
          </Link>

          {/** @slot Settings button */}
          <SettingsButton />
        </Box>
      ),
    };

    const headerSx = slotProps?.header?.sx;

    return (
      <HeaderSection
        disableElevation
        layoutQuery={layoutQuery}
        {...slotProps?.header}
        slots={{
          ...headerSlots,
          ...slotProps?.header?.slots,
        }}
        slotProps={mergedHeaderSlotProps}
        sx={[
          {
            position: {
              [layoutQuery]: 'fixed',
            },
          },
          ...(Array.isArray(headerSx)
            ? headerSx
            : headerSx == null
              ? []
              : [headerSx]),
        ]}
      />
    );
  };

  // ------------------------------------------------------------
  // Rodapé
  // ------------------------------------------------------------

  const renderFooter = () => (
    <Box
      component="footer"
      sx={{
        py: 1.5,
        px: {
          xs: 2,
          md: 4,
        },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'text.disabled',
          fontFamily: 'var(--font-orbitron), sans-serif',
          fontSize: '0.68rem',
          letterSpacing: 1,
        }}
      >
        DEVOS COCKPIT // HARDWARE SECURITY MODULE
      </Typography>

      <Typography
        variant="caption"
        sx={{
          color: 'info.main',
          fontFamily: 'var(--font-orbitron), sans-serif',
          fontSize: '0.68rem',
          letterSpacing: 1,
          opacity: 0.8,
        }}
      >
        DEPIN MESH // ONLINE
      </Typography>
    </Box>
  );

  // ------------------------------------------------------------
  // Conteúdo principal
  // ------------------------------------------------------------

  const renderMain = () => {
    const mainSx = slotProps?.main?.sx;

    return (
      <MainSection
        {...slotProps?.main}
        sx={[
          (theme) => ({
            alignItems: 'center',
            justifyContent: 'center',
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            pt: {
              xs: 7,
              md: 8,
            },
            pb: {
              xs: 2.5,
              md: 3,
            },
            px: 2,
          }),
          ...(Array.isArray(mainSx)
            ? mainSx
            : mainSx == null
              ? []
              : [mainSx]),
        ]}
      >
        <AuthCenteredContent {...slotProps?.content}>
          {children}
        </AuthCenteredContent>
      </MainSection>
    );
  };

  // ------------------------------------------------------------
  // Composição final
  // ------------------------------------------------------------

  return (
    <LayoutSection
      headerSection={renderHeader()}
      footerSection={renderFooter()}
      cssVars={{
        '--layout-auth-content-width': '520px',
        ...cssVars,
      }}
      sx={[
        {
          position: 'relative',
          overflowX: 'hidden',
          overflowY: 'auto',
          bgcolor: '#030712',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',

          '&::-webkit-scrollbar': {
            width: 6,
          },

          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(0, 184, 217, 0.25)',
            borderRadius: 3,

            '&:hover': {
              bgcolor: 'rgba(0, 184, 217, 0.5)',
            },
          },
        },
        ...(Array.isArray(sx)
          ? sx
          : sx == null
            ? []
            : [sx]),
      ]}
    >
      {/** @slot 3D Web3 Rotating Globe Background */}
      {!disableBackgroundGlobe && (
        <AuthGlobeBackground {...globeProps} />
      )}

      {renderMain()}
    </LayoutSection>
  );
}
