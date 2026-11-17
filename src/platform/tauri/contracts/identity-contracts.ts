/**
 * Contratos IPC para Perfil e Identidade Civil do DevOS Desktop.
 *
 * Sincronizado com os modelos e comandos nativos em:
 * - src-tauri/src/modules/identity/models.rs
 * - src-tauri/src/commands/identity_commands.rs
 */

export type PersonType = 'PF' | 'PJ';

/**
 * Modelo de dados de Perfil e Qualificação Civil decifrado da custódia do cofre.
 */
export interface UserProfile {
  personType: PersonType;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  cpf: string;
  rg: string;
  rgIssuer: string;
  cnh: string;
  cnhCategory: string;
  motherName: string;
  fatherName: string;
  birthDate: string;
  nationality: string;
  maritalStatus: string;
  companyName: string;
  cnpj: string;
  legalRepresentative: string;
  legalRepresentativeCpf: string;
  email: string;
  phoneNumber: string;
  country: string;
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
  complement: string;
  occupation: string;
  company: string;
  website: string;
  about: string;
  isPublic: boolean;
  completenessScore: number;
  revision: number;
  updatedAt: string;
  photoUrl?: string | null;
  coverUrl?: string | null;
  linkedProviders?: string[];
}

/**
 * Payload para salvar ou atualizar o perfil.
 */
export interface SaveUserProfilePayload {
  personType?: PersonType;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  cpf?: string;
  rg?: string;
  rgIssuer?: string;
  cnh?: string;
  cnhCategory?: string;
  motherName?: string;
  fatherName?: string;
  birthDate?: string;
  nationality?: string;
  maritalStatus?: string;
  companyName?: string;
  cnpj?: string;
  legalRepresentative?: string;
  legalRepresentativeCpf?: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  zipCode?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  occupation?: string;
  company?: string;
  website?: string;
  about?: string;
  isPublic?: boolean;
  photoUrl?: string | null;
  coverUrl?: string | null;
  linkedProviders?: string[];
  expectedRevision?: number | null;
}
