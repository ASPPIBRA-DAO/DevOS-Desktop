import type { EditionConfig } from './types';

import { paths } from '../../routes/paths';
import { RealEstateView } from '../../modules/real-estate';
import { CockpitDashboardPage } from './cockpit/cockpit-dashboard-page';

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
      path: paths.devos.cadastre,
      label: 'Banco Imobiliário',
      icon: 'solar:city-bold',
      component: RealEstateView,
    },
    {
      path: paths.devos.database,
      label: 'Banco Imobiliário (Explorer)',
      icon: 'solar:database-bold',
      component: RealEstateView,
    },
    {
      path: '/real-estate',
      label: 'Cadastro Imobiliário (Legado)',
      icon: 'solar:bill-list-bold',
      component: RealEstateView,
    },
  ],
};

export default currentEdition;
