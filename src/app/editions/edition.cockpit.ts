import type { EditionConfig } from './types';

import { paths } from '../router/paths';
import { IpfsView } from '../../modules/ipfs';
import { LedgerView } from '../../modules/ledger';
import { WalletsLandingView } from '../../modules/wallets';
import { RealEstateView } from '../../modules/real-estate';
import { UserProfilePage } from '../../pages/user/profile';
import { AccountTwoFAPage } from '../../pages/user/account/2fa';
import { CessaoPosseView } from '../../sections/cessao-de-posse';
import { AccountGeneralPage } from '../../pages/user/account/general';
import { AccountSocialsPage } from '../../pages/user/account/socials';
import { DocumentTemplatesGalleryView } from '../../modules/documents';
import { CockpitDashboardPage } from './cockpit/cockpit-dashboard-page';
import { InfrastructurePage } from '../../pages/devos/infrastructure-page';
import { AccountNotificationsPage } from '../../pages/user/account/notifications';
import { AccountChangePasswordPage } from '../../pages/user/account/change-password';

export const currentEdition: EditionConfig = {
  editionId: 'cockpit',
  name: 'DevOS Admin',
  subtitle: 'Administração Institucional & Fundadores',
  bundleId: 'br.aspp.devos.cockpit',
  navigation: [
    {
      id: 'overview',
      subheader: 'VISÃO GERAL',
      items: [
        {
          title: 'Dashboard Institucional',
          path: '/',
          icon: 'solar:widget-5-bold-duotone',
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
      id: 'financial',
      subheader: 'FINANCEIRO',
      items: [
        {
          title: 'Tesouraria & Livro-Razão',
          path: paths.devos.ledger,
          icon: 'solar:book-bookmark-bold',
        },
        {
          title: 'Carteiras & Banco Digital',
          path: paths.devos.wallets,
          icon: 'solar:wallet-bold',
        },
      ],
    },
    {
      id: 'operations',
      subheader: 'OPERAÇÕES',
      items: [
        {
          title: 'Banco Imobiliário',
          path: paths.devos.cadastre,
          icon: 'solar:city-bold',
        },
      ],
    },
    {
      id: 'documents',
      subheader: 'DOCUMENTOS',
      items: [
        {
          title: 'Catálogo',
          path: paths.devos.documents,
          icon: 'solar:documents-bold',
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
      label: 'Visão Geral',
      icon: 'solar:widget-5-bold-duotone',
      component: CockpitDashboardPage,
    },
    {
      path: paths.devos.wallets,
      label: 'Carteiras & Banco Digital',
      icon: 'solar:wallet-bold',
      component: WalletsLandingView,
    },
    {
      path: '/banking',
      label: 'Banco Digital (Hub)',
      icon: 'solar:wallet-bold',
      component: WalletsLandingView,
    },
    {
      path: paths.devos.ipfs,
      label: 'Armazenamento IPFS',
      icon: 'solar:server-path-bold-duotone',
      component: IpfsView,
    },
    {
      path: paths.devos.cadastre,
      label: 'Banco Imobiliário',
      icon: 'solar:city-bold',
      component: RealEstateView,
    },
    {
      path: paths.devos.cessaoPosse,
      label: 'Cessão de Posse (Contrato)',
      icon: 'solar:document-text-bold-duotone',
      component: CessaoPosseView,
    },
    {
      path: paths.devos.documents,
      label: 'Catálogo de Modelos',
      icon: 'solar:documents-bold',
      component: DocumentTemplatesGalleryView,
    },
    {
      path: paths.devos.database,
      label: 'Banco Imobiliário (Explorer)',
      icon: 'solar:database-bold',
      component: RealEstateView,
    },
    {
      path: paths.devos.ledger,
      label: 'Livro-Razão',
      icon: 'solar:book-bookmark-bold',
      component: LedgerView,
    },
    {
      path: paths.devos.dao,
      label: 'Tesouraria & Livro-Razão',
      icon: 'solar:shield-star-bold',
      component: LedgerView,
    },
    {
      path: '/real-estate',
      label: 'Cadastro Imobiliário (Legado)',
      icon: 'solar:bill-list-bold',
      component: RealEstateView,
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
