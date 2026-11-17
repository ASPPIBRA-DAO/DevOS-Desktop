import type { ReactNode } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/app/router/paths';
import { usePathname } from 'src/app/router/hooks';
import { RouterLink } from 'src/app/router/components/router-link';

import { Iconify } from 'src/shared/components/iconify';
import { CustomBreadcrumbs } from 'src/shared/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export const NAV_ITEMS = [
  {
    label: 'Perfil Geral',
    icon: <Iconify width={20} icon="solar:user-id-bold" />,
    href: paths.dashboard.user.account,
  },
  {
    label: 'Notificações',
    icon: <Iconify width={20} icon="solar:bell-bing-bold" />,
    href: `${paths.dashboard.user.account}/notifications`,
  },
  {
    label: 'Redes Sociais',
    icon: <Iconify width={20} icon="solar:share-bold" />,
    href: `${paths.dashboard.user.account}/socials`,
  },
  {
    label: 'Segurança',
    icon: <Iconify width={20} icon="ic:round-vpn-key" />,
    href: `${paths.dashboard.user.account}/change-password`,
  },
  {
    label: 'Autenticador 2FA',
    icon: <Iconify width={20} icon="solar:shield-keyhole-bold" />,
    href: `${paths.dashboard.user.account}/2fa`,
  },
] as const;

type Props = {
  children?: ReactNode;
};

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

export function AccountLayout({ children }: Props) {
  const pathname = normalizePathname(usePathname());

  const hasMatchingTab = NAV_ITEMS.some(
    (item) => normalizePathname(item.href) === pathname
  );

  const currentTab = hasMatchingTab ? pathname : false;

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <CustomBreadcrumbs
        heading="Central de Identidade Digital"
        links={[
          { name: 'Dashboard', href: '/' },
          { name: 'Minha Conta', href: paths.dashboard.user.root },
          { name: 'Identidade Digital' },
        ]}
        sx={{ mb: 3 }}
      />

      <Card
        sx={{
          mb: { xs: 3, md: 4 },
          p: 1,
          borderRadius: 2,
        }}
      >
        <Tabs
          value={currentTab}
          aria-label="Navegação da conta"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 46,
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTab-root': {
              minHeight: 44,
              minWidth: 120,
              borderRadius: 1.5,
              mx: 0.5,
              fontWeight: 700,
              fontSize: '0.84rem',
              textTransform: 'none',
              transition: 'all 0.25s',
              color: 'text.secondary',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: (theme) => theme.shadows[3],
              },
              '&:hover:not(.Mui-selected)': {
                bgcolor: (theme) => theme.palette.action.hover,
              },
            },
          }}
        >
          {NAV_ITEMS.map((tab) => (
            <Tab
              component={RouterLink}
              key={tab.href}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              value={normalizePathname(tab.href)}
              href={tab.href}
            />
          ))}
        </Tabs>
      </Card>

      {children}
    </Box>
  );
}

export default AccountLayout;
