export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export interface IdentitySessionServiceContract {
  changePassword(payload: ChangePasswordRequest): Promise<void>;
  forgotPassword(email: string): Promise<boolean>;
  resetPassword(token: string, email: string, password: string): Promise<boolean>;
  resendVerification(email: string): Promise<boolean>;
}

export const IdentitySessionService: IdentitySessionServiceContract = {
  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    if (!payload.currentPassword || !payload.newPassword) {
      throw new Error('Credenciais incompletas para alteração de senha.');
    }
    // Operação segura aguardando conexão com endpoint institucional
    throw new Error('Serviço institucional de autenticação não conectado.');
  },

  async forgotPassword(email: string): Promise<boolean> {
    if (!email) return false;
    // Simulação ou conexão com endpoint de recuperação
    return true;
  },

  async resetPassword(token: string, email: string, password: string): Promise<boolean> {
    if (!token || !email || !password) return false;
    // Simulação ou redefinição de chave
    return true;
  },

  async resendVerification(email: string): Promise<boolean> {
    if (!email) return false;
    // Reenvio de verificação
    return true;
  },
};
