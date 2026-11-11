export type UserProfile = {
  id: string;
  name: string;
  role: string;
  roles: string[];
};

/**
 * Hook provisório para perfil do usuário no DevOS Node.
 * Mantém valores padrão seguros para o ambiente nativo soberano
 * até definição da integração com o cofre de identidade local.
 */
export function useUserProfile(): UserProfile {
  return {
    id: 'node-operator-01',
    name: 'Operador de Nó Holder',
    role: 'Holder Beta',
    roles: ['holder', 'admin'],
  };
}

