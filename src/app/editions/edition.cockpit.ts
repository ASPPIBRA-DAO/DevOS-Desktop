import type { EditionConfig } from './types';

import { CockpitDashboardPage } from './cockpit/cockpit-dashboard-page';
import { RealEstateView } from '../../modules/real-estate/presentation/real-estate-view';

export const currentEdition: EditionConfig = {
  editionId: 'cockpit',
  name: 'DevOS Cockpit',
  subtitle: 'Coordenação Institucional & Fundadores',
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
