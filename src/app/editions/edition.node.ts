import type { EditionConfig } from './types';

import { paths } from '../router/paths';
import { IpfsView } from '../../modules/ipfs';
import { NodeDashboardPage } from './node/node-dashboard-page';
import { InfrastructurePage } from '../../pages/devos/infrastructure-page';

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
  ],
};

export default currentEdition;
