import type { UserProfile, SaveUserProfilePayload } from 'src/platform/tauri/contracts/identity-contracts';

import { useEffect, useSyncExternalStore } from 'react';

import { IdentityBridge } from 'src/platform/tauri/identity/identity-bridge';

export type LinkedProviders = {
  walletAddress?: string;
  walletNetwork?: string;
  walletVerified?: boolean;
  googleEmail?: string;
  googleVerified?: boolean;
  githubUsername?: string;
  githubVerified?: boolean;
  strictAuthEnabled?: boolean;
};

export type UserAccountData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  photoURL?: string | null;
  coverURL?: string | null;
  phoneNumber?: string;
  cpf?: string;
  rg?: string;
  rgIssuer?: string;
  cnh?: string;
  cnhCategory?: string;
  motherName?: string;
  fatherName?: string;
  birthDate?: string | null;
  nationality?: string;
  gender?: string;
  maritalStatus?: string;
  country: string;
  address: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  state: string;
  city: string;
  zipCode: string;
  occupation?: string;
  company?: string;
  website?: string;
  about?: string;
  isPublic: boolean;
  personType: 'PF' | 'PJ';
  companyName?: string;
  cnpj?: string;
  legalRepresentative?: string;
  legalRepresentativeCpf?: string;
  completenessScore?: number;
  revision?: number;
  updatedAt?: string;
  linkedProviders?: LinkedProviders;
};

const LEGACY_STORAGE_KEY = 'devos_user_account_profile';

/**
 * Cria uma estrutura limpa e segura de dados do usuário por padrão.
 * Princípio Privacy-by-Default (isPublic = false, sem dados pessoais predefinidos).
 */
export function createEmptyUserAccount(): UserAccountData {
  return {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    photoURL: null,
    coverURL: null,
    phoneNumber: '',
    cpf: '',
    rg: '',
    rgIssuer: '',
    cnh: '',
    cnhCategory: '',
    motherName: '',
    fatherName: '',
    birthDate: '',
    nationality: 'Brasileira',
    gender: '',
    maritalStatus: '',
    country: 'Brasil',
    address: '',
    addressNumber: '',
    complement: '',
    neighborhood: '',
    state: '',
    city: '',
    zipCode: '',
    occupation: '',
    company: '',
    website: '',
    about: '',
    isPublic: false,
    personType: 'PF',
    companyName: '',
    cnpj: '',
    legalRepresentative: '',
    legalRepresentativeCpf: '',
    completenessScore: 0,
    revision: 0,
    updatedAt: '',
    linkedProviders: {
      walletAddress: '',
      walletNetwork: '',
      walletVerified: false,
      googleEmail: '',
      googleVerified: false,
      githubUsername: '',
      githubVerified: false,
      strictAuthEnabled: false,
    },
  };
}

function userProfileToAccountData(profile: UserProfile, current?: UserAccountData): UserAccountData {
  return {
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    username: profile.username || current?.username || (profile.email ? profile.email.split('@')[0] : ''),
    email: profile.email || '',
    photoURL: profile.photoUrl ?? current?.photoURL ?? null,
    coverURL: profile.coverUrl ?? current?.coverURL ?? null,
    phoneNumber: profile.phoneNumber || '',
    cpf: profile.cpf || '',
    rg: profile.rg || '',
    rgIssuer: profile.rgIssuer || '',
    cnh: profile.cnh || '',
    cnhCategory: profile.cnhCategory || '',
    motherName: profile.motherName || '',
    fatherName: profile.fatherName || '',
    birthDate: profile.birthDate || '',
    nationality: profile.nationality || 'Brasileira',
    gender: current?.gender || '',
    maritalStatus: profile.maritalStatus || '',
    country: profile.country || 'Brasil',
    address: profile.address || '',
    addressNumber: profile.addressNumber || '',
    complement: profile.complement || '',
    neighborhood: profile.neighborhood || '',
    state: profile.state || '',
    city: profile.city || '',
    zipCode: profile.zipCode || '',
    occupation: profile.occupation || '',
    company: profile.company || '',
    website: profile.website || '',
    about: profile.about || '',
    isPublic: profile.isPublic ?? false,
    personType: (profile.personType as 'PF' | 'PJ') || 'PF',
    companyName: profile.companyName || '',
    cnpj: profile.cnpj || '',
    legalRepresentative: profile.legalRepresentative || '',
    legalRepresentativeCpf: profile.legalRepresentativeCpf || '',
    completenessScore: profile.completenessScore ?? 0,
    revision: profile.revision ?? 0,
    updatedAt: profile.updatedAt || '',
    linkedProviders: current?.linkedProviders || {
      walletAddress: '',
      walletNetwork: '',
      walletVerified: false,
      googleEmail: '',
      googleVerified: false,
      githubUsername: '',
      githubVerified: false,
      strictAuthEnabled: false,
    },
  };
}

function accountDataToSavePayload(
  data: Partial<UserAccountData>,
  currentRevision?: number
): SaveUserProfilePayload {
  return {
    personType: data.personType,
    username: data.username,
    firstName: data.firstName,
    lastName: data.lastName,
    displayName:
      data.companyName ||
      (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}`.trim() : undefined),
    cpf: data.cpf,
    rg: data.rg,
    rgIssuer: data.rgIssuer,
    cnh: data.cnh,
    cnhCategory: data.cnhCategory,
    motherName: data.motherName,
    fatherName: data.fatherName,
    birthDate: data.birthDate || '',
    nationality: data.nationality,
    maritalStatus: data.maritalStatus,
    companyName: data.companyName,
    cnpj: data.cnpj,
    legalRepresentative: data.legalRepresentative,
    legalRepresentativeCpf: data.legalRepresentativeCpf,
    email: data.email,
    phoneNumber: data.phoneNumber,
    country: data.country,
    zipCode: data.zipCode,
    state: data.state,
    city: data.city,
    neighborhood: data.neighborhood,
    address: data.address,
    addressNumber: data.addressNumber,
    complement: data.complement,
    occupation: data.occupation,
    company: data.company,
    website: data.website,
    about: data.about,
    isPublic: data.isPublic ?? false,
    photoUrl: data.photoURL,
    coverUrl: data.coverURL,
    expectedRevision: currentRevision,
  };
}

// ----------------------------------------------------------------------
// Store Reativo Centralizado (Sincronização entre abas e componentes)
// ----------------------------------------------------------------------

interface AccountStoreState {
  user: UserAccountData;
  isLoading: boolean;
  isSaving: boolean;
  isVaultLocked: boolean;
  error: string | null;
  hasLoadedInitially: boolean;
  migrationStatus: 'idle' | 'migrated' | 'conflict' | 'error';
}

let storeState: AccountStoreState = {
  user: createEmptyUserAccount(),
  isLoading: false,
  isSaving: false,
  isVaultLocked: false,
  error: null,
  hasLoadedInitially: false,
  migrationStatus: 'idle',
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function getStoreSnapshot(): AccountStoreState {
  return storeState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let inFlightFetch: Promise<void> | null = null;

async function fetchAndSyncProfile(): Promise<void> {
  if (inFlightFetch) {
    return inFlightFetch;
  }

  storeState = {
    ...storeState,
    isLoading: true,
    error: null,
  };
  notify();

  inFlightFetch = (async () => {
    try {
      const rawProfile = await IdentityBridge.getUserProfile();

      if (rawProfile) {
        storeState = {
          ...storeState,
          user: userProfileToAccountData(rawProfile, storeState.user),
          isVaultLocked: false,
          hasLoadedInitially: true,
        };

        // Se já existe perfil gravado no cofre SQLite, verifica se a chave legada ainda existe
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (legacy && rawProfile.revision >= 1) {
              // Somente remove após confirmar persistência segura
              localStorage.removeItem(LEGACY_STORAGE_KEY);
            }
          }
        } catch {
          // Ignora erro de acesso ao localStorage
        }
      } else {
        // Sem perfil salvo no SQLite. Verifica se há migração pendente do localStorage
        let migratedSuccessfully = false;

        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (legacyData && legacyData.trim().length > 2) {
              // Importa para o cofre seguro SQLite
              await IdentityBridge.importLegacyProfile(legacyData);

              // Leitura de volta independente para comprovar a persistência
              const verified = await IdentityBridge.getUserProfile();

              if (verified && verified.revision >= 1) {
                storeState = {
                  ...storeState,
                  user: userProfileToAccountData(verified, storeState.user),
                  isVaultLocked: false,
                  hasLoadedInitially: true,
                  migrationStatus: 'migrated',
                };
                migratedSuccessfully = true;
                // Exclusão definitiva somente após leitura de volta confirmada
                localStorage.removeItem(LEGACY_STORAGE_KEY);
              }
            }
          }
        } catch {
          // Em caso de falha, PRESERVA o localStorage original sem exclusão
          storeState = {
            ...storeState,
            migrationStatus: 'error',
          };
        }

        if (!migratedSuccessfully) {
          storeState = {
            ...storeState,
            user: createEmptyUserAccount(),
            isVaultLocked: false,
            hasLoadedInitially: true,
          };
        }
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const isLocked =
        errorMsg.includes('VAULT_LOCKED') ||
        errorMsg.includes('bloqueado') ||
        errorMsg.includes('Locked');

      storeState = {
        ...storeState,
        isVaultLocked: isLocked,
        error: isLocked
          ? 'O cofre criptográfico está bloqueado. Desbloqueie com a senha mestre para carregar os dados civis.'
          : errorMsg,
        hasLoadedInitially: true,
      };
    } finally {
      storeState = {
        ...storeState,
        isLoading: false,
      };
      inFlightFetch = null;
      notify();
    }
  })();

  return inFlightFetch;
}

export function useAccountFacade() {
  const state = useSyncExternalStore(subscribe, getStoreSnapshot, getStoreSnapshot);

  useEffect(() => {
    if (!state.hasLoadedInitially && !state.isLoading) {
      fetchAndSyncProfile();
    }
  }, [state.hasLoadedInitially, state.isLoading]);

  const updateProfile = async (data: Partial<UserAccountData>): Promise<UserAccountData> => {
    storeState = {
      ...storeState,
      isSaving: true,
      error: null,
    };
    notify();

    try {
      const merged: UserAccountData = {
        ...storeState.user,
        ...data,
      };

      const payload = accountDataToSavePayload(merged, storeState.user.revision);
      const saved = await IdentityBridge.saveUserProfile(payload);

      const finalUser = userProfileToAccountData(saved, merged);

      storeState = {
        ...storeState,
        user: finalUser,
        isVaultLocked: false,
        error: null,
      };
      notify();

      return finalUser;
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      storeState = {
        ...storeState,
        error: errorMsg,
      };
      notify();
      throw err;
    } finally {
      storeState = {
        ...storeState,
        isSaving: false,
      };
      notify();
    }
  };

  const refreshProfile = async (): Promise<void> => {
    await fetchAndSyncProfile();
  };

  return {
    user: state.user,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    isVaultLocked: state.isVaultLocked,
    error: state.error,
    hasLoadedInitially: state.hasLoadedInitially,
    migrationStatus: state.migrationStatus,
    updateProfile,
    refreshProfile,
  };
}
