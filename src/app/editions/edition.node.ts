import type { EditionConfig } from './types';

import { paths } from '../router/paths';
import { IpfsView } from '../../modules/ipfs';
import { UserProfilePage } from '../../pages/user/profile';
import { NodeDashboardPage } from './node/node-dashboard-page';
import { AccountTwoFAPage } from '../../pages/user/account/2fa';
import { AccountGeneralPage } from '../../pages/user/account/general';
import { AccountSocialsPage } from '../../pages/user/account/socials';
import { InfrastructurePage } from '../../pages/devos/infrastructure-page';
import { AccountNotificationsPage } from '../../pages/user/account/notifications';
import { AccountChangePasswordPage } from '../../pages/user/account/change-password';

export const currentEdition: EditionConfig = {
  editionId: 'node',
  name: 'DevOS Node',
  subtitle: 'Operador de Nós & Armazenamento DePIN',
  bundleId: 'br.aspp.devos.node',
  navigation: [
    {
      id: 'overview',
      subheader: 'VISÃO GERAL',
      items: [
        {
          title: 'Painel do Nó',
          path: '/',
          icon: 'solar:server-square-bold-duotone',
        },
      ],
    },
    {
      id: 'user',
      subheader: 'USUÁRIO',
      items: [
        {
          title: 'Perfil',
          path: paths.dashboard.user.profile,
          icon: 'solar:user-id-bold',
        },
      ],
    },
    {
      id: 'infrastructure',
      subheader: 'INFRAESTRUTURA',
      items: [
        {
          title: 'Armazenamento IPFS',
          path: paths.devos.ipfs,
          icon: 'solar:server-path-bold-duotone',
        },
        {
          title: 'Infraestrutura',
          path: paths.devos.infrastructure,
          icon: 'solar:server-square-bold',
        },
      ],
    },
  ],
  routes: [
    {
      path: '/',
      label: 'Painel do Nó',
      icon: 'solar:server-square-bold-duotone',
      component: NodeDashboardPage,
    },
    {
      path: paths.devos.ipfs,
      label: 'Armazenamento IPFS',
      icon: 'solar:server-path-bold-duotone',
      component: IpfsView,
    },
    {
      path: paths.devos.infrastructure,
      label: 'Infraestrutura',
      icon: 'solar:server-square-bold',
      component: InfrastructurePage,
    },
    {
      path: '/user',
      label: 'Perfil do Usuário',
      icon: 'solar:user-id-bold',
      component: UserProfilePage,
    },
    {
      path: paths.dashboard.user.profile,
      label: 'Perfil do Usuário',
      icon: 'solar:user-id-bold',
      component: UserProfilePage,
    },
    {
      path: paths.dashboard.user.account,
      label: 'Identidade Digital',
      icon: 'solar:settings-bold',
      component: AccountGeneralPage,
    },
    {
      path: `${paths.dashboard.user.account}/notifications`,
      label: 'Notificações',
      icon: 'solar:bell-bing-bold',
      component: AccountNotificationsPage,
    },
    {
      path: `${paths.dashboard.user.account}/socials`,
      label: 'Redes Sociais',
      icon: 'solar:share-bold',
      component: AccountSocialsPage,
    },
    {
      path: `${paths.dashboard.user.account}/change-password`,
      label: 'Segurança',
      icon: 'ic:round-vpn-key',
      component: AccountChangePasswordPage,
    },
    {
      path: `${paths.dashboard.user.account}/2fa`,
      label: 'Autenticador 2FA',
      icon: 'solar:shield-keyhole-bold',
      component: AccountTwoFAPage,
    },
  ],
};

export default currentEdition;
