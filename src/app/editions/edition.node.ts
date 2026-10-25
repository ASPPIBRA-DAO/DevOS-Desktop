import type { EditionConfig } from './types';

import { paths } from '../../routes/paths';
import { RealEstateView } from '../../modules/real-estate';
import { NodeDashboardPage } from './node/node-dashboard-page';

export const currentEdition: EditionConfig = {
  editionId: 'node',
  name: 'DevOS Node',
  subtitle: 'Operador de Nós & Armazenamento DePIN',
  bundleId: 'br.aspp.devos.node',
  routes: [
    {
      path: '/',
      label: 'Painel do Nó',
      icon: 'solar:server-square-bold-duotone',
      component: NodeDashboardPage,
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
