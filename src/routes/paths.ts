const ROOTS = {
  AUTH: '',
  DASHBOARD: '',
  DEVOS: '/devos',
};

export const paths = {
  about: '#',
  contact: '#',
  faqs: '#',
  pricing: '#',
  minimalStore: '#',
  auth: {
    jwt: {
      signIn: '/login',
      signUp: '/register',
      resetPassword: '/forgot-password',
      updatePassword: '/reset-password',
      verify: '/verify',
    },
  },
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
  devos: {
    root: ROOTS.DEVOS,
    cadastre: `${ROOTS.DEVOS}/cadastre`,
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
