export function useAuthContext() {
  return {
    user: {
      id: '01',
      displayName: 'Operador DevOS',
      email: 'operador@asppibra.com',
      role: 'dev',
    },
    checkUserSession: async () => {
      // Sincroniza sessão
      return true;
    },
  };
}
