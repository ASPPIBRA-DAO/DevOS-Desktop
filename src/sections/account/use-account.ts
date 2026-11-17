import type { UserProfile, SaveUserProfilePayload } from 'src/platform/tauri/contracts/identity-contracts';

import { useEffect, useSyncExternalStore } from 'react';

import { IdentityBridge } from 'src/platform/tauri/identity/identity-bridge';

// ----------------------------------------------------------------------
// Tipos e Constantes Canônicas
// ----------------------------------------------------------------------

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

export const LEGACY_STORAGE_KEY = 'devos_user_account_profile';
const MAX_LEGACY_LENGTH = 64 * 1024; // Limite de 64 KB para evitar DoS de memória

export const LEGACY_STRING_FIELDS = [
  'firstName',
  'lastName',
  'username',
  'email',
  'phoneNumber',
  'cpf',
  'rg',
  'rgIssuer',
  'cnh',
  'cnhCategory',
  'motherName',
  'fatherName',
  'birthDate',
  'nationality',
  'maritalStatus',
  'companyName',
  'cnpj',
  'legalRepresentative',
  'legalRepresentativeCpf',
  'country',
  'address',
  'addressNumber',
  'complement',
  'neighborhood',
  'state',
  'city',
  'zipCode',
  'occupation',
  'company',
  'website',
  'about',
] as const;

export type LegacyField = (typeof LEGACY_STRING_FIELDS)[number];

export type MigrationStatus = 'idle' | 'migrated' | 'conflict' | 'error';
export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

// ----------------------------------------------------------------------
// Funções Auxiliares de Sanitização e Validação
// ----------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getSafeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Lê e higieniza os dados legados com checagem de tamanho, remoção de chaves arbitrárias
 * e aplicação do princípio Privacy-by-Default (isPublic sempre false na importação).
 */
export function readLegacyProfile(): { raw: string; data: Partial<UserAccountData> } | null {
  const storage = getSafeStorage();
  if (!storage) return null;

  const raw = storage.getItem(LEGACY_STORAGE_KEY);
  if (!raw || raw.trim().length <= 2) return null;

  if (raw.length > MAX_LEGACY_LENGTH) {
    throw new Error('O documento legado ultrapassa o tamanho máximo permitido de 64 KB.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Documento legado em formato JSON corrompido ou inválido.');
  }

  if (!isRecord(parsed)) {
    throw new Error('Estrutura do documento legado inválida.');
  }

  const safe: Record<string, unknown> = {};
  for (const field of LEGACY_STRING_FIELDS) {
    const value = parsed[field];
    const maxLength = field === 'about' ? 2000 : field === 'website' ? 200 : field === 'email' ? 254 : 150;
    if (typeof value === 'string' && value.length <= maxLength) {
      safe[field] = value.trim();
    }
  }

  safe.personType = parsed.personType === 'PJ' ? 'PJ' : 'PF';
  safe.isPublic = false; // Requer confirmação explícita do usuário
  safe.username = canonicalizeUsername(
    typeof parsed.username === 'string'
      ? parsed.username
      : typeof parsed.email === 'string'
        ? parsed.email.split('@')[0]
        : ''
  );

  return {
    raw: JSON.stringify(safe),
    data: safe as Partial<UserAccountData>,
  };
}

/**
 * Normaliza um username para conformidade canônica com a regra `^[a-z0-9_]+$`.
 * Substitui pontos, traços e espaços por sublinhados e limita a 30 caracteres.
 */
export function canonicalizeUsername(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);
}

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

export function userProfileToAccountData(profile: UserProfile, current?: UserAccountData): UserAccountData {
  const fallbackUsername = profile.email ? profile.email.split('@')[0] : '';
  const resolvedUsername = profile.username
    ? canonicalizeUsername(profile.username)
    : current?.username
      ? canonicalizeUsername(current.username)
      : canonicalizeUsername(fallbackUsername);

  return {
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    username: resolvedUsername,
    email: profile.email || '',
    photoURL: profile.photoUrl !== undefined ? profile.photoUrl : current?.photoURL ?? null,
    coverURL: profile.coverUrl !== undefined ? profile.coverUrl : current?.coverURL ?? null,
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
    personType: profile.personType === 'PJ' ? 'PJ' : 'PF',
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

export function accountDataToSavePayload(
  data: Partial<UserAccountData>,
  currentRevision?: number
): SaveUserProfilePayload {
  const isPj = data.personType === 'PJ';
  const resolvedDisplayName = isPj
    ? data.companyName?.trim() || undefined
    : data.firstName && data.lastName
      ? `${data.firstName} ${data.lastName}`.trim()
      : data.firstName?.trim() || undefined;

  return {
    personType: isPj ? 'PJ' : 'PF',
    username: canonicalizeUsername(data.username),
    firstName: data.firstName,
    lastName: data.lastName,
    displayName: resolvedDisplayName,
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
// Store Reativo Centralizado e Isolamento de Sessão
// ----------------------------------------------------------------------

interface AccountStoreState {
  user: UserAccountData;
  loadStatus: LoadStatus;
  isLoading: boolean;
  isSaving: boolean;
  isVaultLocked: boolean;
  error: string | null;
  hasLoadedInitially: boolean;
  migrationStatus: MigrationStatus;
}

let storeState: AccountStoreState = {
  user: createEmptyUserAccount(),
  loadStatus: 'idle',
  isLoading: false,
  isSaving: false,
  isVaultLocked: false,
  error: null,
  hasLoadedInitially: false,
  migrationStatus: 'idle',
};

let currentSessionGeneration = 0;
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

/**
 * Reseta o store de identidade no logout ou na troca de usuário autenticado.
 * Invalida requisições pendentes por meio da geração de sessão para evitar vazamento entre contas.
 */
export function resetAccountStore(): void {
  currentSessionGeneration += 1;
  storeState = {
    user: createEmptyUserAccount(),
    loadStatus: 'idle',
    isLoading: false,
    isSaving: false,
    isVaultLocked: false,
    error: null,
    hasLoadedInitially: false,
    migrationStatus: 'idle',
  };
  notify();
}

/**
 * Validação de integridade antes da gravação (evita sobrescrever dados com formulário não carregado).
 */
export function assertAccountCanBeSaved(): void {
  if (storeState.loadStatus !== 'ready') {
    throw new Error('A identidade civil ainda não foi carregada com sucesso do cofre local.');
  }
  if (storeState.isVaultLocked) {
    throw new Error('O cofre seguro está bloqueado. Desbloqueie com a chave mestre.');
  }
  if (storeState.isSaving) {
    throw new Error('Já existe uma gravação de perfil em andamento.');
  }
  if (storeState.migrationStatus === 'conflict') {
    throw new Error('Existem divergências de migração não resolvidas. Resolva o conflito antes de salvar.');
  }
  if (storeState.migrationStatus === 'error') {
    throw new Error('A migração apresentou erros. Corrija o estado antes de sobrescrever os dados.');
  }
}

// ----------------------------------------------------------------------
// Reconciliação e Resolução de Conflitos
// ----------------------------------------------------------------------

const LEGACY_MERGE_FIELDS: LegacyField[] = LEGACY_STRING_FIELDS.filter(
  (field) => field !== 'email' && field !== 'username'
) as LegacyField[];

export function mergeMissingLegacyFields(
  vault: UserAccountData,
  legacy: Partial<UserAccountData>
): { merged: UserAccountData; changedFields: LegacyField[] } {
  const merged: UserAccountData = { ...vault };
  const target = merged as unknown as Record<string, unknown>;
  const changedFields: LegacyField[] = [];

  for (const field of LEGACY_MERGE_FIELDS) {
    const incoming = legacy[field];
    const current = target[field];
    if (
      typeof incoming === 'string' &&
      incoming.trim().length > 0 &&
      (typeof current !== 'string' || !current.trim())
    ) {
      target[field] = incoming.trim();
      changedFields.push(field);
    }
  }

  merged.isPublic = false;
  return { merged, changedFields };
}

async function reconcileAndMigrate(rawProfile: UserProfile | null): Promise<{
  profile: UserProfile | null;
  fallbackUser?: UserAccountData;
  status: MigrationStatus;
  errorMessage?: string;
}> {
  let legacy: { raw: string; data: Partial<UserAccountData> } | null = null;
  try {
    legacy = readLegacyProfile();
  } catch (err: any) {
    return {
      profile: rawProfile,
      status: 'error',
      errorMessage: err?.message || 'Falha ao ler o armazenamento legado.',
    };
  }

  if (!legacy) {
    return { profile: rawProfile, status: 'idle' };
  }

  const legacyObj = legacy.data;

  // CENÁRIO 1: Perfil já existente no cofre seguro SQLite
  if (rawProfile) {
    const legacyCpf = (legacyObj.cpf || '').replace(/\D/g, '');
    const currentCpf = (rawProfile.cpf || '').replace(/\D/g, '');
    const legacyCnpj = (legacyObj.cnpj || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const currentCnpj = (rawProfile.cnpj || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const legacyEmail = (legacyObj.email || '').trim().toLowerCase();
    const currentEmail = (rawProfile.email || '').trim().toLowerCase();

    // Conflito direto: dados essenciais preenchidos com valores incompatíveis
    const hasCpfConflict = legacyCpf && currentCpf && legacyCpf !== currentCpf;
    const hasCnpjConflict = legacyCnpj && currentCnpj && legacyCnpj !== currentCnpj;
    const hasEmailConflict = legacyEmail && currentEmail && legacyEmail !== currentEmail;

    if (hasCpfConflict || hasCnpjConflict || hasEmailConflict) {
      return {
        profile: rawProfile,
        status: 'conflict',
        errorMessage:
          'Divergência detectada entre os dados do cofre e do armazenamento legado. Os dados anteriores foram preservados para decisão explícita.',
      };
    }

    // Reconciliação automática para campos não-conflitantes ausentes no cofre
    const currentUser = userProfileToAccountData(rawProfile);
    const { merged, changedFields } = mergeMissingLegacyFields(currentUser, legacyObj);

    if (changedFields.length > 0) {
      try {
        const payload = accountDataToSavePayload(merged, rawProfile.revision);
        const saved = await IdentityBridge.saveUserProfile(payload);
        const verified = await IdentityBridge.getUserProfile();

        if (verified && verified.revision > rawProfile.revision) {
          getSafeStorage()?.removeItem(LEGACY_STORAGE_KEY);
          return { profile: verified, status: 'migrated' };
        }
        return { profile: saved, status: 'migrated' };
      } catch {
        return {
          profile: rawProfile,
          status: 'error',
          errorMessage: 'Falha ao sincronizar dados legados complementares no cofre.',
        };
      }
    } else {
      // Coincidência total: cofre já contém todas as informações
      getSafeStorage()?.removeItem(LEGACY_STORAGE_KEY);
      return { profile: rawProfile, status: 'migrated' };
    }
  }

  // CENÁRIO 2: Cofre vazio, importação inicial dos dados legados
  try {
    const imported = await IdentityBridge.importLegacyProfile(legacy.raw);
    const verified = await IdentityBridge.getUserProfile();

    if (verified && verified.revision >= 1) {
      const verifiedFirst = (verified.firstName || '').trim();
      const legacyFirst = (legacyObj.firstName || '').trim();
      const verifiedEmail = (verified.email || '').trim().toLowerCase();
      const legacyEmail = (legacyObj.email || '').trim().toLowerCase();

      if (!legacyFirst || verifiedFirst === legacyFirst || verifiedEmail === legacyEmail) {
        getSafeStorage()?.removeItem(LEGACY_STORAGE_KEY);
        return { profile: verified, status: 'migrated' };
      }
    }

    return {
      profile: imported,
      status: 'error',
      errorMessage: 'A leitura pós-migração não pôde comprovar a integridade dos dados.',
    };
  } catch (err: any) {
    const fallbackUser: UserAccountData = {
      ...createEmptyUserAccount(),
      ...legacyObj,
      username: canonicalizeUsername(legacyObj.username || legacyObj.email?.split('@')[0]),
    };

    return {
      profile: null,
      fallbackUser,
      status: 'error',
      errorMessage:
        err?.message ||
        'Falha ao importar o perfil legado para o cofre seguro. Seus dados anteriores foram preservados.',
    };
  }
}

let inFlightFetch: Promise<void> | null = null;

async function fetchAndSyncProfile(): Promise<void> {
  if (inFlightFetch) {
    return inFlightFetch;
  }

  const sessionGenAtStart = currentSessionGeneration;

  storeState = {
    ...storeState,
    isLoading: true,
    loadStatus: 'loading',
    error: null,
  };
  notify();

  inFlightFetch = (async () => {
    try {
      const rawProfile = await IdentityBridge.getUserProfile();

      // Descarte fail-closed caso a sessão tenha sido resetada durante a requisição assíncrona
      if (sessionGenAtStart !== currentSessionGeneration) {
        return;
      }

      const reconciliation = await reconcileAndMigrate(rawProfile);

      if (sessionGenAtStart !== currentSessionGeneration) {
        return;
      }

      if (reconciliation.profile) {
        storeState = {
          ...storeState,
          user: userProfileToAccountData(reconciliation.profile, storeState.user),
          loadStatus: 'ready',
          isVaultLocked: false,
          hasLoadedInitially: true,
          migrationStatus: reconciliation.status,
          error: reconciliation.errorMessage || null,
        };
      } else if (reconciliation.fallbackUser) {
        storeState = {
          ...storeState,
          user: reconciliation.fallbackUser,
          loadStatus: 'error', // Impede gravação acidental sobre dados não persistidos
          isVaultLocked: false,
          hasLoadedInitially: true,
          migrationStatus: reconciliation.status,
          error: reconciliation.errorMessage || null,
        };
      } else {
        storeState = {
          ...storeState,
          user: createEmptyUserAccount(),
          loadStatus: 'ready',
          isVaultLocked: false,
          hasLoadedInitially: true,
          migrationStatus: reconciliation.status,
          error: reconciliation.errorMessage || null,
        };
      }
    } catch (err: any) {
      if (sessionGenAtStart !== currentSessionGeneration) {
        return;
      }

      const errorMsg = err?.message || String(err);
      const isLocked =
        errorMsg.includes('VAULT_LOCKED') ||
        errorMsg.includes('bloqueado') ||
        errorMsg.includes('Locked');

      storeState = {
        ...storeState,
        loadStatus: isLocked ? 'idle' : 'error',
        isVaultLocked: isLocked,
        error: isLocked
          ? 'O cofre criptográfico está bloqueado. Desbloqueie com a chave mestre para carregar os dados civis.'
          : 'Não foi possível carregar as informações do cofre local.',
        hasLoadedInitially: true,
      };
    } finally {
      if (sessionGenAtStart === currentSessionGeneration) {
        storeState = {
          ...storeState,
          isLoading: false,
        };
        notify();
      }
      inFlightFetch = null;
    }
  })();

  return inFlightFetch;
}

export function useAccountFacade() {
  const state = useSyncExternalStore(subscribe, getStoreSnapshot, getStoreSnapshot);

  useEffect(() => {
    if (!state.hasLoadedInitially && !state.isLoading && state.loadStatus === 'idle') {
      fetchAndSyncProfile();
    }
  }, [state.hasLoadedInitially, state.isLoading, state.loadStatus]);

  const updateProfile = async (data: Partial<UserAccountData>): Promise<UserAccountData> => {
    assertAccountCanBeSaved();

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
        loadStatus: 'ready',
        isVaultLocked: false,
        error: null,
      };
      notify();

      return finalUser;
    } catch (err: any) {
      const errorMsg = err?.message || 'Falha ao salvar dados no cofre seguro.';
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

  const retryMigration = async (): Promise<void> => {
    await fetchAndSyncProfile();
  };

  /**
   * Resolução definitiva de conflitos de migração com precedência determinística:
   * 'keep_vault': Descarta o legado mantendo a integridade já existente no cofre.
   * 'merge_legacy': Preserva os identificadores do cofre, mescla os campos complementares
   * vazios, grava com a revisão atual e confirma antes da exclusão.
   */
  const resolveMigrationConflict = async (choice: 'keep_vault' | 'merge_legacy'): Promise<void> => {
    try {
      if (choice === 'keep_vault') {
        getSafeStorage()?.removeItem(LEGACY_STORAGE_KEY);
        storeState = {
          ...storeState,
          migrationStatus: 'migrated',
          error: null,
        };
        notify();
        return;
      }

      const legacy = readLegacyProfile();
      if (!legacy) {
        throw new Error('Os dados legados não foram encontrados no armazenamento.');
      }

      const latestProfile = await IdentityBridge.getUserProfile();
      if (!latestProfile) {
        throw new Error('Perfil do cofre seguro indisponível.');
      }

      const currentUser = userProfileToAccountData(latestProfile);
      const { merged, changedFields } = mergeMissingLegacyFields(currentUser, legacy.data);

      let verifiedProfile = latestProfile;
      if (changedFields.length > 0) {
        const payload = accountDataToSavePayload(merged, latestProfile.revision);
        await IdentityBridge.saveUserProfile(payload);

        const verified = await IdentityBridge.getUserProfile();
        if (!verified) {
          throw new Error('Falha na leitura independente pós-reconciliação.');
        }

        const verifiedData = userProfileToAccountData(verified);
        const target = merged as unknown as Record<string, unknown>;
        const persisted = verifiedData as unknown as Record<string, unknown>;

        const allFieldsVerified = changedFields.every((field) => persisted[field] === target[field]);
        if (!allFieldsVerified) {
          throw new Error('A reconciliação não passou na verificação estrita de integridade.');
        }

        verifiedProfile = verified;
      }

      // Exclusão definitiva somente após leitura de volta confirmada
      getSafeStorage()?.removeItem(LEGACY_STORAGE_KEY);
      storeState = {
        ...storeState,
        user: userProfileToAccountData(verifiedProfile),
        migrationStatus: 'migrated',
        error: null,
      };
      notify();
    } catch (err: any) {
      storeState = {
        ...storeState,
        migrationStatus: 'error',
        error:
          err?.message ||
          'Não foi possível concluir a reconciliação. Os dados legados foram mantidos para recuperação.',
      };
      notify();
    }
  };

  return {
    user: state.user,
    loadStatus: state.loadStatus,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    isVaultLocked: state.isVaultLocked,
    error: state.error,
    hasLoadedInitially: state.hasLoadedInitially,
    migrationStatus: state.migrationStatus,
    updateProfile,
    refreshProfile,
    retryMigration,
    resolveMigrationConflict,
  };
}
