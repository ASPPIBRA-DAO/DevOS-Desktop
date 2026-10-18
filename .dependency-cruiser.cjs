/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Dependências circulares são terminantemente proibidas na arquitetura.',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'domain-layer-purity',
      severity: 'error',
      comment: 'A camada domain deve ser código puro (TypeScript) sem frameworks ou UI.',
      from: {
        path: '^src/modules/[^/]+/domain',
      },
      to: {
        path: '(^src/shared/components|^src/platform|^src/app|^node_modules/react|^node_modules/@mui)',
      },
    },
    {
      name: 'application-layer-purity',
      severity: 'error',
      comment: 'A camada application não deve acoplar com UI nem com bridges de plataforma diretamente.',
      from: {
        path: '^src/modules/[^/]+/application',
      },
      to: {
        path: '(^src/shared/components|^src/platform/tauri|^src/app|^node_modules/react|^node_modules/@mui)',
      },
    },
    {
      name: 'shared-no-modules',
      severity: 'error',
      comment: 'A camada shared não pode depender de módulos de negócio específicos.',
      from: {
        path: '^src/shared',
      },
      to: {
        path: '^src/modules',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
};
