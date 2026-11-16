import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { paths } from 'src/app/router/paths';
import { CustomBreadcrumbs } from 'src/shared/components/custom-breadcrumbs';

import { ProfileHome } from '../profile-home';
import { ProfileCover } from '../profile-cover';
import { useUserProfile } from 'src/app/editions/node/hooks/use-user-profile';

// ----------------------------------------------------------------------

export function UserProfileView() {
  const user = useUserProfile();
  const [currentTab, setCurrentTab] = useState('profile');

  const handleChangeTab = (_event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Breadcrumbs de Navegação */}
      <CustomBreadcrumbs
        heading="Profile"
        links={[
          { name: 'Dashboard', href: '/' },
          { name: 'User', href: paths.dashboard.user.root },
          { name: user?.name || 'Usuário' },
        ]}
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      {/* Banner Panorâmico com Avatar e Abas */}
      <ProfileCover
        name={user?.name || 'Usuário'}
        role={user?.role || 'CTO at Gleichner, Mueller and Tromp'}
        currentTab={currentTab}
        onChangeTab={handleChangeTab}
      />

      {/* Conteúdo Dinâmico por Aba */}
      {currentTab === 'profile' && <ProfileHome />}

      {currentTab !== 'profile' && (
        <Card
          sx={{
            p: 5,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: (theme) => `1px dashed ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, textTransform: 'capitalize' }}>
            Aba: {currentTab}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto' }}>
            Esta subpágina está preparada na arquitetura e aguarda a definição das subrotas personalizadas que você irá orientar.
          </Typography>
        </Card>
      )}
    </Box>
  );
}

export default UserProfileView;
