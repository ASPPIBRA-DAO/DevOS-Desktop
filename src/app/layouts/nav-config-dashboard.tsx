import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';
import { CONFIG } from 'src/global-config';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  folder: icon('ic-folder'),
  params: icon('ic-params'),
  banking: icon('ic-banking'),
  invoice: icon('ic-invoice'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  subpaths: icon('ic-subpaths'),
  menuItem: icon('ic-menu-item'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
};

// ----------------------------------------------------------------------

export const navData: NavSectionProps['data'] = [
  /**
   * 🌐 OVERVIEW GLOBAL
   */
  {
    subheader: 'OVERVIEW',
    items: [
      { title: 'Início', path: paths.dashboard.root, icon: ICONS.dashboard },
      { title: 'Design System', path: paths.dashboard.designSystem, icon: ICONS.params },
    ],
  },
  /**
   * 📂 GRUPO: USUÁRIOS
   */
  {
    subheader: 'USUÁRIO',
    items: [
      {
        title: 'Usuário',
        path: paths.dashboard.user.root,
        icon: ICONS.user,
        children: [
          { title: 'Perfil', path: paths.dashboard.user.root },
          { title: 'Novo Usuário', path: paths.dashboard.user.new },
          { title: 'Conta', path: paths.dashboard.user.account, deepMatch: true },
        ],
      },
      {
        title: 'Bancário',
        path: paths.dashboard.general.banking.root,
        icon: ICONS.banking,
        children: [
          { title: 'Visão Geral', path: paths.dashboard.general.banking.root },
          { title: 'Transações', path: `${paths.dashboard.general.banking.root}/transacoes` },
          { title: 'Cartões', path: `${paths.dashboard.general.banking.root}/cartoes` },
          { title: 'Sua Rede', path: `${paths.dashboard.general.banking.root}/rede` },
          { title: 'Conta', path: `${paths.dashboard.general.banking.root}/conta` },
          { 
            title: 'Tesouraria DAO', 
            path: paths.dashboard.general.banking.treasury,
            allowedRoles: ['admin', 'dev']
          },
          { 
            title: 'Fluxo Pagamentos', 
            path: paths.dashboard.general.banking.payments,
            allowedRoles: ['admin', 'dev']
          },
        ],
      },
      {
        title: 'Gestor de Arquivos',
        path: paths.dashboard.fileManager,
        icon: ICONS.folder,
        children: [
          { title: 'Arquivos App', path: paths.dashboard.general.file },
          { title: 'Gerenciador', path: paths.dashboard.fileManager },
          { title: 'Fotos', path: `${paths.dashboard.fileManager}/image` },
          { title: 'Vídeos', path: `${paths.dashboard.fileManager}/video` },
          { title: 'Documentos', path: `${paths.dashboard.fileManager}/document` },
        ],
      },
      { title: 'Chat', path: paths.dashboard.chat, icon: ICONS.chat },
    ],
  },
];
