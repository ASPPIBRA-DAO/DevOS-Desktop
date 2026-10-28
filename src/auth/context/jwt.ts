import { VaultBridge } from 'src/platform/tauri/vault/vault-bridge';
import { isTauriDesktop } from 'src/platform/tauri/core/invoke';

export interface SignInParams {
  email?: string;
  password?: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export async function signInWithPassword({ email, password }: SignInParams): Promise<boolean> {
  if (!password) {
    throw new Error('A senha mestre é obrigatória.');
  }

  if (isTauriDesktop()) {
    const success = await VaultBridge.unlock(password);
    if (!success) {
      throw new Error('Senha mestre incorreta.');
    }
    return true;
  }

  // Modo Web Preview: simula login
  return true;
}

export async function signInWithWeb3(address: string): Promise<boolean> {
  if (!address) {
    throw new Error('Endereço da carteira não informado.');
  }
  return true;
}

export async function signUp({ email, password, firstName, lastName }: SignUpParams): Promise<boolean> {
  if (!password) {
    throw new Error('A senha mestre é obrigatória.');
  }

  if (isTauriDesktop()) {
    const success = await VaultBridge.initMasterPassword(password);
    if (!success) {
      throw new Error('Falha ao inicializar a senha mestre do cofre.');
    }
    return true;
  }

  return true;
}
