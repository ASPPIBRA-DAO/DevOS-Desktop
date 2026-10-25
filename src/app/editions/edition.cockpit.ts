import type { EditionConfig } from './types';

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
      path: '/real-estate',
      label: 'Cadastro Imobiliário',
      icon: 'solar:bill-list-bold',
      component: RealEstateView,
    },
  ],
};

export default currentEdition;
