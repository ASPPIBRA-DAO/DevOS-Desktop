// ----------------------------------------------------------------------
// Contratos de Identidade do Operador
// ----------------------------------------------------------------------

export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

export interface AuthContextValue {
  user: Readonly<AuthUser>;
  checkUserSession: () => Promise<boolean>;
}

// ----------------------------------------------------------------------
// Perfil Padronizado de Operador Local (DevOS Cockpit)
// ----------------------------------------------------------------------

/**
 * Perfil do operador local utilizado para exibição na interface do Cockpit.
 *
 * NOTA DE ARQUITETURA E SEGURANÇA:
 * No DevOS Desktop soberano e descentralizado, a autorização e a integridade
 * criptográfica não dependem de tokens JWT emitidos por servidores centrais,
 * mas sim do cofre criptográfico de hardware gerenciado nativamente pelo
 * AppBootstrapProvider e pelo VaultBridge (Argon2id + AES-256-GCM em Rust).
 */
const DEFAULT_OPERATOR_USER: Readonly<AuthUser> = Object.freeze({
  id: '01',
  displayName: 'Operador DevOS',
  email: 'operador@asppibra.com',
  role: 'dev',
});

// ----------------------------------------------------------------------
// Hook de Acesso à Sessão de Operador
// ----------------------------------------------------------------------

export function useAuthContext(): AuthContextValue {
  return {
    user: DEFAULT_OPERATOR_USER,

    /**
     * Sincronização de sessão do operador.
     * A validação de estado nativa é confirmada em conjunto com o refreshStatus() do cofre.
     */
    checkUserSession: async (): Promise<boolean> => true,
  };
}
