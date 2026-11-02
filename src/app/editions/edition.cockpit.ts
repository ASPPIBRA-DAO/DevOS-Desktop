import type { EditionConfig } from './types';

import { paths } from '../router/paths';
import { IpfsView } from '../../modules/ipfs';
import { LedgerView } from '../../modules/ledger';
import { WalletsLandingView } from '../../modules/wallets';
import { RealEstateView } from '../../modules/real-estate';
import { CessaoPosseView } from '../../sections/cessao-de-posse';
import { CockpitDashboardPage } from './cockpit/cockpit-dashboard-page';
import { InfrastructurePage } from '../../pages/devos/infrastructure-page';

export const currentEdition: EditionConfig = {
  editionId: 'cockpit',
  name: 'DevOS Admin',
  subtitle: 'Administração Institucional & Fundadores',
  bundleId: 'br.aspp.devos.cockpit',
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
  ],
};

export default currentEdition;
