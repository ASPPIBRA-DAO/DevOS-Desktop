import type { UserProfile, SaveUserProfilePayload } from '../contracts/identity-contracts';

import { invokeNative } from '../core/invoke';

/**
 * Ponte de comunicação entre o frontend e os comandos nativos de Perfil e Identidade Civil.
 *
 * Garante que todos os dados pessoais do usuário transitem protegidos pela camada IPC,
 * sem persistência insegura em localStorage ou exposição de PII.
 */
export const IdentityBridge = {
  /**
   * Consulta os dados de perfil e qualificação civil decifrados do cofre local SQLite.
   *
   * @returns O perfil do usuário ou null se ainda não houver cadastro salvo.
   */
  async getUserProfile(): Promise<UserProfile | null> {
    return invokeNative<UserProfile | null>('get_user_profile');
  },

  /**
   * Salva ou atualiza os dados do perfil cifrando-os com a chave da sessão ativa do cofre.
   *
   * @param profile Dados cadastrais a serem persistidos.
   * @returns O perfil salvo com revisão atualizada e score computado.
   */
  async saveUserProfile(profile: SaveUserProfilePayload): Promise<UserProfile> {
    return invokeNative<UserProfile>('save_user_profile', { profile });
  },

  /**
   * Importa o perfil legado em JSON (do localStorage) para o cofre seguro SQLite.
   *
   * @param legacyJson String JSON com os dados legados.
   * @returns O perfil importado e persistido de forma segura.
   */
  async importLegacyProfile(legacyJson: string): Promise<UserProfile> {
    return invokeNative<UserProfile>('import_legacy_profile', { legacyJson });
  },
};
