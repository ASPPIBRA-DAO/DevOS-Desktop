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
  const tabFromUrl = searchParams.get('tab') || 'profile';
  const [currentTab, setCurrentTab] = useState(tabFromUrl);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== currentTab) {
      setCurrentTab(tab);
    }
  }, [searchParams, currentTab]);

  const handleChangeTab = (_event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
    setSearchParams({ tab: newValue });
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

      {/* Conteúdo Dinâmico por Ferramenta Selecionada */}
      {currentTab === 'profile' && <ProfileHome />}
      {currentTab === 'identity' && <AccountGeneral />}
      {currentTab === 'notifications' && <AccountNotifications />}
      {currentTab === 'socials' && <AccountSocials />}
      {currentTab === 'security' && <AccountChangePassword />}
      {currentTab === '2fa' && <AccountTwoFA />}
    </Box>
  );
}

export default UserProfileView;
