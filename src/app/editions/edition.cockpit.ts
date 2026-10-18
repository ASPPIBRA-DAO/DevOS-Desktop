import type { EditionConfig } from './types';

import { CockpitDashboardView } from '../../modules/ipfs/presentation/cockpit-dashboard-view';

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
      component: CockpitDashboardView,
    },
  ],
};

export default currentEdition;
