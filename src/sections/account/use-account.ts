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

export type LegacyReadResult =
  | { status: 'missing' }
  | { status: 'valid'; data: Partial<UserAccountData>; raw: string }
  | { status: 'invalid'; reason: string }
  | { status: 'unavailable'; reason: string };

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
 * Lê e higieniza os dados legados distinguindo missing, valid, invalid e unavailable.
 * Aplica limites de tamanho por campo e princípio Privacy-by-Default (isPublic: false).
 */
export function readLegacyProfile(): LegacyReadResult {
  const storage = getSafeStorage();
  if (!storage) {
    return { status: 'unavailable', reason: 'localStorage indisponível no ambiente de execução.' };
  }

  let raw: string | null = null;
  try {
    raw = storage.getItem(LEGACY_STORAGE_KEY);
  } catch (err: any) {
    return {
      status: 'unavailable',
      reason: err?.message || 'Acesso ao localStorage bloqueado ou indisponível.',
    };
  }

  if (!raw || raw.trim().length <= 2) {
    return { status: 'missing' };
  }

  if (raw.length > MAX_LEGACY_LENGTH) {
    return {
      status: 'invalid',
      reason: 'O documento legado ultrapassa o tamanho máximo permitido de 64 KB.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      status: 'invalid',
      reason: 'Documento legado em formato JSON corrompido ou inválido.',
    };
  }

  if (!isRecord(parsed)) {
    return {
      status: 'invalid',
      reason: 'Estrutura do documento legado inválida (não é um objeto JSON).',
    };
  }

  const safe: Record<string, unknown> = {};
  for (const field of LEGACY_STRING_FIELDS) {
    const value = parsed[field];
    const maxLength = field === 'about' ? 2000 : field === 'website' ? 200 : field === 'email' ? 254 : 150;
    if (typeof value === 'string') {
      if (value.length > maxLength) {
        return {
          status: 'invalid',
          reason: `O campo ${field} ultrapassa o tamanho máximo permitido de ${maxLength} caracteres.`,
        };
      }
      safe[field] = value.trim();
    }
  }

  if (parsed.personType === 'PJ') {
    safe.personType = 'PJ';
  } else if (parsed.personType === 'PF' || parsed.personType === undefined) {
    safe.personType = 'PF';
  } else {
    return {
      status: 'invalid',
      reason: `personType inválido no documento legado: "${String(parsed.personType)}". Esperado 'PF' ou 'PJ'.`,
    };
  }

  safe.isPublic = false; // Requer confirmação explícita do usuário
  safe.username = canonicalizeUsername(
    typeof parsed.username === 'string'
      ? parsed.username
      : typeof parsed.email === 'string'
        ? parsed.email.split('@')[0]
        : ''
  );

  return {
    status: 'valid',
    raw: JSON.stringify(safe),
    data: safe as Partial<UserAccountData>,
  };
}

/**
 * Normaliza um username para conformidade canônica com a regra `^[a-z0-9_]+$`.
 * Substitui pontos, traços e espaços por sublinhados e limita rigorosamente a 30 caracteres.
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
 * Princípio Privacy-by-Default (isPublic = false, sem presunções de estado civil).
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
      walletAddress: undefined,
      walletNetwork: undefined,
      walletVerified: false,
      googleEmail: undefined,
      googleVerified: false,
      githubUsername: undefined,
      githubVerified: false,
      strictAuthEnabled: true,
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

function normalizeText(value?: string | null): string {
  return value?.trim() ?? '';
}

export function accountDataToSavePayload(
  data: Partial<UserAccountData>,
  currentRevision = data.revision
): SaveUserProfilePayload {
  const isPj = data.personType === 'PJ';
  const firstName = normalizeText(data.firstName);
  const lastName = normalizeText(data.lastName);
  const companyName = normalizeText(data.companyName);

  const resolvedDisplayName = isPj
    ? companyName || 'Pessoa Jurídica'
    : [firstName, lastName].filter(Boolean).join(' ') || normalizeText(data.username);

  return {
    personType: isPj ? 'PJ' : 'PF',
    username: canonicalizeUsername(data.username),
    displayName: resolvedDisplayName,
    // Preservação estrita de todos os campos cadastrais PF e PJ (sem exclusão de dados inativos)
    firstName,
    lastName,
    companyName,
    cpf: normalizeText(data.cpf),
    cnpj: normalizeText(data.cnpj),
    rg: normalizeText(data.rg),
    rgIssuer: normalizeText(data.rgIssuer),
    cnh: normalizeText(data.cnh),
    cnhCategory: normalizeText(data.cnhCategory),
    motherName: normalizeText(data.motherName),
    fatherName: normalizeText(data.fatherName),
    birthDate: normalizeText(data.birthDate),
    nationality: normalizeText(data.nationality) || 'Brasileira',
    maritalStatus: normalizeText(data.maritalStatus),
    legalRepresentative: normalizeText(data.legalRepresentative),
    legalRepresentativeCpf: normalizeText(data.legalRepresentativeCpf),
    email: normalizeText(data.email),
    phoneNumber: normalizeText(data.phoneNumber),
    country: normalizeText(data.country) || 'Brasil',
    zipCode: normalizeText(data.zipCode),
    state: normalizeText(data.state),
    city: normalizeText(data.city),
    neighborhood: normalizeText(data.neighborhood),
    address: normalizeText(data.address),
    addressNumber: normalizeText(data.addressNumber),
    complement: normalizeText(data.complement),
    occupation: normalizeText(data.occupation),
    company: normalizeText(data.company),
    website: normalizeText(data.website),
    about: normalizeText(data.about),
    isPublic: data.isPublic ?? false,
    photoUrl: data.photoURL ?? null,
    coverUrl: data.coverURL ?? null,
    expectedRevision: currentRevision !== undefined && currentRevision > 0 ? currentRevision : undefined,
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

type InFlightFetch = {
  generation: number;
  promise: Promise<void>;
};

let inFlightFetch: InFlightFetch | null = null;

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
  inFlightFetch = null;
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

  // Se o username do cofre estiver vazio e o legado tiver username válido, incorporar
  if (!merged.username && legacy.username) {
    const canonical = canonicalizeUsername(legacy.username);
    if (canonical) {
      merged.username = canonical;
      changedFields.push('username');
    }
  }

  // Preservar isPublic do cofre (não rebaixar para false se já estiver true no cofre)
  merged.isPublic = vault.isPublic ?? false;
  return { merged, changedFields };
}

/**
 * Verifica a integridade da persistência pós-migração comparando os campos
 * preenchidos no documento legado contra os campos retornados pelo cofre.
 * Retorna uma lista de nomes de campos divergentes (ou vazia se íntegro).
 */
export function verifyMigrationIntegrity(
  legacy: Partial<UserAccountData>,
  persisted: UserAccountData
): string[] {
  const mismatched: string[] = [];
  const persistedRecord = persisted as unknown as Record<string, unknown>;

  for (const field of LEGACY_STRING_FIELDS) {
    const rawLegacyVal = legacy[field];
    if (typeof rawLegacyVal !== 'string') continue;
    const legacyVal = rawLegacyVal.trim();
    if (!legacyVal) continue;

    const persistedVal =
      typeof persistedRecord[field] === 'string'
        ? (persistedRecord[field] as string).trim()
        : '';

    if (field === 'cpf') {
      const cleanLegacy = legacyVal.replace(/\D/g, '');
      const cleanPersisted = persistedVal.replace(/\D/g, '');
      if (cleanLegacy !== cleanPersisted) {
        mismatched.push(field);
      }
    } else if (field === 'cnpj') {
      const cleanLegacy = legacyVal.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const cleanPersisted = persistedVal.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (cleanLegacy !== cleanPersisted) {
        mismatched.push(field);
      }
    } else if (field === 'email') {
      if (legacyVal.toLowerCase() !== persistedVal.toLowerCase()) {
        mismatched.push(field);
      }
    } else if (field === 'username') {
      const canonicalLegacy = canonicalizeUsername(legacyVal);
      const canonicalPersisted = canonicalizeUsername(persistedVal);
      if (canonicalLegacy && canonicalPersisted && canonicalLegacy !== canonicalPersisted) {
        mismatched.push(field);
      }
    } else if (legacyVal !== persistedVal) {
      mismatched.push(field);
    }
  }

  if (legacy.personType && legacy.personType !== persisted.personType) {
    mismatched.push('personType');
  }

  return mismatched;
}

async function reconcileAndMigrate(
  rawProfile: UserProfile | null,
  generation: number
): Promise<{
  profile: UserProfile | null;
  fallbackUser?: UserAccountData;
  status: MigrationStatus;
  errorMessage?: string;
}> {
  const legacyResult = readLegacyProfile();

  if (legacyResult.status === 'invalid') {
    return {
      profile: rawProfile,
      status: 'error',
      errorMessage: `Armazenamento legado inconsistente: ${legacyResult.reason}. Os dados anteriores foram preservados para investigação.`,
    };
  }

  if (legacyResult.status === 'unavailable') {
    return {
      profile: rawProfile,
      status: 'error',
      errorMessage: `Armazenamento local inacessível: ${legacyResult.reason}. O acesso aos dados legados está temporariamente indisponível.`,
    };
  }

  if (legacyResult.status === 'missing') {
    return { profile: rawProfile, status: 'idle' };
  }

  const legacyObj = legacyResult.data;

  // CENÁRIO 1: Perfil já existente no cofre seguro SQLite
  if (rawProfile) {
    const legacyCpf = (legacyObj.cpf || '').replace(/\D/g, '');
    const currentCpf = (rawProfile.cpf || '').replace(/\D/g, '');
    const legacyCnpj = (legacyObj.cnpj || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const currentCnpj = (rawProfile.cnpj || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const legacyEmail = (legacyObj.email || '').trim().toLowerCase();
    const currentEmail = (rawProfile.email || '').trim().toLowerCase();

    // Conflito estrito de identidade: identificadores principais preenchidos com valores incompatíveis
    const hasCpfConflict = legacyCpf && currentCpf && legacyCpf !== currentCpf;
    const hasCnpjConflict = legacyCnpj && currentCnpj && legacyCnpj !== currentCnpj;
    const hasEmailConflict = legacyEmail && currentEmail && legacyEmail !== currentEmail;

    if (hasCpfConflict || hasCnpjConflict || hasEmailConflict) {
      return {
        profile: rawProfile,
        status: 'conflict',
        errorMessage:
          'Divergência detectada entre os identificadores do cofre e do armazenamento legado. Os dados anteriores foram preservados para decisão explícita.',
      };
    }

    // Reconciliação automática para campos complementares ausentes no cofre
    const currentUser = userProfileToAccountData(rawProfile);
    const { merged, changedFields } = mergeMissingLegacyFields(currentUser, legacyObj);

    if (changedFields.length > 0) {
      if (generation !== currentSessionGeneration) {
        return { profile: rawProfile, status: 'idle' };
      }
      try {
        const payload = accountDataToSavePayload(merged, rawProfile.revision);
        const saved = await IdentityBridge.saveUserProfile(payload);
        if (generation !== currentSessionGeneration) {
          return { profile: rawProfile, status: 'idle' };
        }
        const verified = await IdentityBridge.getUserProfile();
        if (generation !== currentSessionGeneration) {
          return { profile: rawProfile, status: 'idle' };
        }

        if (verified && verified.revision > rawProfile.revision) {
          const verifiedData = userProfileToAccountData(verified);
          const target = merged as unknown as Record<string, unknown>;
          const persisted = verifiedData as unknown as Record<string, unknown>;
          const allVerified = changedFields.every((f) => persisted[f] === target[f]);

          if (allVerified) {
            getSafeStorage()?.removeItem(LEGACY_STORAGE_KEY);
            return { profile: verified, status: 'migrated' };
          }
        }
        return {
          profile: saved,
          status: 'error',
          errorMessage: 'A verificação pós-gravação de migração não confirmou a integridade dos campos.',
        };
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
  if (generation !== currentSessionGeneration) {
    return { profile: null, status: 'idle' };
  }
  try {
    const imported = await IdentityBridge.importLegacyProfile(legacyResult.raw);
    if (generation !== currentSessionGeneration) {
      return { profile: null, status: 'idle' };
    }
    const verified = await IdentityBridge.getUserProfile();
    if (generation !== currentSessionGeneration) {
      return { profile: null, status: 'idle' };
    }

    if (verified && verified.revision >= 1) {
      const verifiedData = userProfileToAccountData(verified);
      const mismatches = verifyMigrationIntegrity(legacyObj, verifiedData);

      if (mismatches.length === 0) {
        getSafeStorage()?.removeItem(LEGACY_STORAGE_KEY);
        return { profile: verified, status: 'migrated' };
      }

      return {
        profile: verified,
        status: 'error',
        errorMessage: `A leitura pós-migração identificou divergência nos campos: ${mismatches.join(', ')}. Os dados legados foram preservados.`,
      };
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

async function fetchAndSyncProfile(): Promise<void> {
  if (inFlightFetch && inFlightFetch.generation === currentSessionGeneration) {
    return inFlightFetch.promise;
  }

  const sessionGenAtStart = currentSessionGeneration;

  storeState = {
    ...storeState,
    isLoading: true,
    loadStatus: 'loading',
    error: null,
  };
  notify();

  const currentPromise: Promise<void> = (async () => {
    try {
      const rawProfile = await IdentityBridge.getUserProfile();

      // Descarte fail-closed caso a sessão tenha sido resetada durante a requisição assíncrona
      if (sessionGenAtStart !== currentSessionGeneration) {
        return;
      }

      const reconciliation = await reconcileAndMigrate(rawProfile, sessionGenAtStart);

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
      if (inFlightFetch && inFlightFetch.generation === sessionGenAtStart) {
        inFlightFetch = null;
      }
    }
  })();

  inFlightFetch = {
    generation: sessionGenAtStart,
    promise: currentPromise,
  };

  return currentPromise;
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

    const sessionGenAtStart = currentSessionGeneration;
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

      if (sessionGenAtStart !== currentSessionGeneration) {
        throw new Error('A sessão do cofre foi alterada durante a gravação.');
      }

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
      if (sessionGenAtStart === currentSessionGeneration) {
        const errorMsg = err?.message || 'Falha ao salvar dados no cofre seguro.';
        storeState = {
          ...storeState,
          error: errorMsg,
        };
        notify();
      }
      throw err;
    } finally {
      if (sessionGenAtStart === currentSessionGeneration) {
        storeState = {
          ...storeState,
          isSaving: false,
        };
        notify();
      }
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
   * ausentes, grava com a revisão atual e confirma leitura independente antes da exclusão.
   */
  const resolveMigrationConflict = async (choice: 'keep_vault' | 'merge_legacy'): Promise<void> => {
    if (storeState.isSaving) {
      throw new Error('Já existe uma operação de gravação ou migração em andamento.');
    }

    const sessionGenAtStart = currentSessionGeneration;
    const assertCurrentSession = () => {
      if (sessionGenAtStart !== currentSessionGeneration) {
        throw new Error('A sessão foi alterada durante a resolução da migração.');
      }
    };

    storeState = {
      ...storeState,
      isSaving: true,
      error: null,
    };
    notify();

    try {
      if (choice === 'keep_vault') {
        assertCurrentSession();
        getSafeStorage()?.removeItem(LEGACY_STORAGE_KEY);
        storeState = {
          ...storeState,
          migrationStatus: 'migrated',
          error: null,
        };
        notify();
        return;
      }

      const legacyResult = readLegacyProfile();
      if (legacyResult.status !== 'valid') {
        throw new Error('Os dados legados não foram encontrados ou estão em formato inválido.');
      }

      assertCurrentSession();
      const latestProfile = await IdentityBridge.getUserProfile();
      assertCurrentSession();
      if (!latestProfile) {
        throw new Error('Perfil do cofre seguro indisponível.');
      }

      const currentUser = userProfileToAccountData(latestProfile);
      const { merged, changedFields } = mergeMissingLegacyFields(currentUser, legacyResult.data);

      if (changedFields.length === 0) {
        throw new Error(
          'Não existem campos complementares ausentes para incorporar. As divergências de identidade foram mantidas no cofre.'
        );
      }

      assertCurrentSession();
      const payload = accountDataToSavePayload(merged, latestProfile.revision);
      await IdentityBridge.saveUserProfile(payload);

      assertCurrentSession();
      const verified = await IdentityBridge.getUserProfile();
      assertCurrentSession();

      if (!verified || verified.revision <= latestProfile.revision) {
        throw new Error('Falha na leitura independente pós-reconciliação do cofre.');
      }

      const verifiedData = userProfileToAccountData(verified);
      const target = merged as unknown as Record<string, unknown>;
      const persisted = verifiedData as unknown as Record<string, unknown>;

      const allFieldsVerified = changedFields.every((field) => persisted[field] === target[field]);
      if (!allFieldsVerified) {
        throw new Error('A reconciliação não passou na verificação estrita de integridade.');
      }

      // Exclusão definitiva somente após leitura de volta confirmada
      assertCurrentSession();
      getSafeStorage()?.removeItem(LEGACY_STORAGE_KEY);
      storeState = {
        ...storeState,
        user: verifiedData,
        migrationStatus: 'migrated',
        error: null,
      };
      notify();
    } catch (err: any) {
      if (sessionGenAtStart !== currentSessionGeneration) return;
      storeState = {
        ...storeState,
        migrationStatus: 'error',
        error:
          err?.message ||
          'Não foi possível concluir a reconciliação. Os dados legados foram mantidos para recuperação.',
      };
      notify();
    } finally {
      if (sessionGenAtStart === currentSessionGeneration) {
        storeState = {
          ...storeState,
          isSaving: false,
        };
        notify();
      }
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

export const useAccount = useAccountFacade;
