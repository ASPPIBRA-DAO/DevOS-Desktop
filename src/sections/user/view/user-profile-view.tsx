import { useSearchParams } from 'react-router';
import React, { useState, useEffect } from 'react';

import Box from '@mui/material/Box';

import { paths } from 'src/app/router/paths';

import { CustomBreadcrumbs } from 'src/shared/components/custom-breadcrumbs';

import { ProfileHome } from '../profile-home';
import { ProfileCover } from '../profile-cover';
import { AccountTwoFA } from '../../account/account-2fa';
import { useAccountFacade } from '../../account/use-account';
import { AccountSocials } from '../../account/account-socials';
import { AccountGeneral } from '../../account/account-general';
import { AccountNotifications } from '../../account/account-notifications';
import { AccountChangePassword } from '../../account/account-change-password';

// ----------------------------------------------------------------------

export function UserProfileView() {
  const { user: accountUser, updateProfile } = useAccountFacade();
  const displayName = `${accountUser.firstName} ${accountUser.lastName}`.trim() || 'Usuário';
  const displayRole = accountUser.occupation || 'Operador de Nó';

  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'profile';
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({ [currentTab]: true });

  useEffect(() => {
    if (!visitedTabs[currentTab]) {
      setVisitedTabs((prev) => ({ ...prev, [currentTab]: true }));
    }
  }, [currentTab, visitedTabs]);

  const handleChangeTab = (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue === currentTab) return;
    setVisitedTabs((prev) => ({ ...prev, [newValue]: true }));
    setSearchParams({ tab: newValue }, { replace: true });
  };

  const handleUpdateAvatar = (photoURL: string) => {
    updateProfile({ photoURL });
  };

  const handleUpdateCover = (coverURL: string) => {
    updateProfile({ coverURL });
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Breadcrumbs de Navegação */}
      <CustomBreadcrumbs
        heading="Perfil do Usuário"
        links={[
          { name: 'Dashboard', href: '/' },
          { name: 'Usuário', href: paths.dashboard.user.profile },
          { name: displayName },
        ]}
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      {/* Banner Panorâmico com Avatar e Abas Integradas */}
      <ProfileCover
        name={displayName}
        role={displayRole}
        avatarUrl={accountUser.photoURL || undefined}
        coverUrl={accountUser.coverURL || undefined}
        currentTab={currentTab}
        onChangeTab={handleChangeTab}
        onUpdateAvatar={handleUpdateAvatar}
        onUpdateCover={handleUpdateCover}
      />

      {/* Conteúdo Dinâmico por Ferramenta Selecionada (Mantido em Cache de Renderização) */}
      <Box sx={{ display: currentTab === 'profile' ? 'block' : 'none' }}>
        {visitedTabs.profile && <ProfileHome />}
      </Box>

      <Box sx={{ display: currentTab === 'identity' ? 'block' : 'none' }}>
        {visitedTabs.identity && <AccountGeneral />}
      </Box>

      <Box sx={{ display: currentTab === 'notifications' ? 'block' : 'none' }}>
        {visitedTabs.notifications && <AccountNotifications />}
      </Box>

      <Box sx={{ display: currentTab === 'socials' ? 'block' : 'none' }}>
        {visitedTabs.socials && <AccountSocials />}
      </Box>

      <Box sx={{ display: currentTab === 'security' ? 'block' : 'none' }}>
        {visitedTabs.security && <AccountChangePassword />}
      </Box>

      <Box sx={{ display: currentTab === '2fa' ? 'block' : 'none' }}>
        {visitedTabs['2fa'] && <AccountTwoFA />}
      </Box>
    </Box>
  );
}

export default UserProfileView;
