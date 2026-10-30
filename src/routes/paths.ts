// ----------------------------------------------------------------------
// Prefixos das rotas
// ----------------------------------------------------------------------

const ROOTS = {
  DASHBOARD: '',
  DEVOS: '/devos',
} as const;

// ----------------------------------------------------------------------
// Destinos provisórios
// ----------------------------------------------------------------------
//
// Estes valores são placeholders, não rotas funcionais.
// Devem ser substituídos quando as páginas correspondentes
// estiverem implementadas e registradas no roteador.
//

const PLACEHOLDER_PATH = '#';

// ----------------------------------------------------------------------
// Rotas da aplicação
// ----------------------------------------------------------------------

export const paths = {
  // Páginas institucionais ainda sem destino definido.
  about: PLACEHOLDER_PATH,
  contact: PLACEHOLDER_PATH,
  faqs: PLACEHOLDER_PATH,
  pricing: PLACEHOLDER_PATH,
  minimalStore: PLACEHOLDER_PATH,

  // ------------------------------------------------------------
  // Autenticação
  // ------------------------------------------------------------

  auth: {
    jwt: {
      signIn: '/login',
      signUp: '/register',
      resetPassword: '/forgot-password',
      updatePassword: '/reset-password',
      verify: '/verify',
    },
  },

  // ------------------------------------------------------------
  // Dashboard
  // ------------------------------------------------------------

  dashboard: {
    root: '/',
    designSystem: '/design-system',
    fileManager: '/file-manager',
    chat: '/chat',

    user: {
      root: '/user',
      new: '/user/new',
      account: '/user/account',
    },

    general: {
      app: `${ROOTS.DASHBOARD}/app`,
      file: `${ROOTS.DASHBOARD}/file`,

      banking: {
        root: `${ROOTS.DASHBOARD}/banking`,
        treasury: `${ROOTS.DASHBOARD}/banking/treasury`,
        payments: `${ROOTS.DASHBOARD}/banking/payments`,
      },
    },
  },

  // ------------------------------------------------------------
  // DevOS
  // ------------------------------------------------------------

  devos: {
    root: ROOTS.DEVOS,
    cadastre: `${ROOTS.DEVOS}/cadastre`,
    cessaoPosse: `${ROOTS.DEVOS}/cessao-posse`,
    dao: `${ROOTS.DEVOS}/dao`,
    wallets: `${ROOTS.DEVOS}/wallets`,
    ledger: `${ROOTS.DEVOS}/ledger`,
    invoices: `${ROOTS.DEVOS}/invoices`,
    analytics: `${ROOTS.DEVOS}/analytics`,
    blog: `${ROOTS.DEVOS}/blog`,
    database: `${ROOTS.DEVOS}/database`,

    notifications: {
      root: `${ROOTS.DEVOS}/notifications`,
    },

    security: `${ROOTS.DEVOS}/security`,
    audit: `${ROOTS.DEVOS}/audit`,
    apis: `${ROOTS.DEVOS}/apis`,
    infrastructure: `${ROOTS.DEVOS}/infrastructure`,
  },
};
