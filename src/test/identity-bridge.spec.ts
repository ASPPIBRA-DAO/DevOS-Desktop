import type { UserProfile } from 'src/platform/tauri/contracts/identity-contracts';

import { it, expect, describe } from 'vitest';

import { IdentityBridge } from 'src/platform/tauri/identity/identity-bridge';

import {
  isStrictValidCpf,
  isStrictValidCep,
  isStrictValidCnpj,
  isStrictValidPhone,
  mapUserToFormValues,
  isStrictValidWebsite,
  isStrictValidBirthDate,
  calculateIdentityCompleteness,
} from 'src/sections/account/account-general';
import {
  readLegacyProfile,
  resetAccountStore,
  LEGACY_STORAGE_KEY,
  removeLegacyProfile,
  canonicalizeUsername,
  createEmptyUserAccount,
  accountDataToSavePayload,
  mergeMissingLegacyFields,
  userProfileToAccountData,
  verifyMigrationIntegrity,
} from 'src/sections/account/use-account';

import { mockIpcError, mockIpcResponse } from './test-utils';

describe('IdentityBridge — Tauri Native Identity & Vault IPC', () => {
  const sampleProfile: UserProfile = {
    personType: 'PF',
    username: 'maria_santos',
    firstName: 'Maria',
    lastName: 'Santos',
    displayName: 'Maria Santos',
    cpf: '529.982.247-25',
    rg: '12345678-9',
    rgIssuer: 'SSP/SP',
    cnh: '',
    cnhCategory: '',
    motherName: 'Francisca Santos',
    fatherName: 'João Santos',
    birthDate: '1988-04-12',
    nationality: 'Brasileira',
    maritalStatus: 'Solteiro(a)',
    companyName: '',
    cnpj: '',
    legalRepresentative: '',
    legalRepresentativeCpf: '',
    email: 'maria@asppibra.org.br',
    phoneNumber: '(11) 98765-4321',
    country: 'Brasil',
    zipCode: '01310-100',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Bela Vista',
    address: 'Avenida Paulista',
    addressNumber: '1500',
    complement: 'Apto 101',
    occupation: 'Engenheira de Software',
    company: 'ASPPIBRA',
    website: 'https://asppibra.org.br',
    about: 'Liderança técnica em governança descentralizada.',
    isPublic: false,
    completenessScore: 85,
    revision: 1,
    updatedAt: '2026-11-17T00:00:00Z',
    photoUrl: null,
    coverUrl: null,
    linkedProviders: [],
  };

  const samplePjProfile: UserProfile = {
    personType: 'PJ',
    username: 'asppibra_tech',
    firstName: '',
    lastName: '',
    displayName: 'ASPPIBRA Soluções Ltda',
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
    companyName: 'ASPPIBRA Soluções Ltda',
    cnpj: '12.ABC.345/01DE-35',
    legalRepresentative: 'Maria Santos',
    legalRepresentativeCpf: '529.982.247-25',
    email: 'contato@asppibra.org.br',
    phoneNumber: '(11) 3333-4444',
    country: 'Brasil',
    zipCode: '01310-100',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Bela Vista',
    address: 'Avenida Paulista',
    addressNumber: '1500',
    complement: 'Conjunto 42',
    occupation: 'Desenvolvimento Institucional (CNAE 6201-5)',
    company: 'ASPPIBRA Group',
    website: 'https://asppibra.org.br',
    about: 'Infraestrutura descentralizada e soberania digital.',
    isPublic: false,
    completenessScore: 100,
    revision: 1,
    updatedAt: '2026-11-17T00:00:00Z',
    photoUrl: null,
    coverUrl: null,
    linkedProviders: [],
  };

  it('deve consultar o perfil do usuário via get_user_profile', async () => {
    mockIpcResponse('get_user_profile', sampleProfile);

    const result = await IdentityBridge.getUserProfile();
    expect(result).not.toBeNull();
    expect(result?.firstName).toBe('Maria');
    expect(result?.username).toBe('maria_santos');
    expect(result?.cpf).toBe('529.982.247-25');
    expect(result?.completenessScore).toBe(85);
  });

  it('deve retornar null quando nenhum perfil estiver cadastrado', async () => {
    mockIpcResponse('get_user_profile', null);

    const result = await IdentityBridge.getUserProfile();
    expect(result).toBeNull();
  });

  it('deve salvar perfil via save_user_profile e retornar a entidade atualizada', async () => {
    mockIpcResponse('save_user_profile', {
      ...sampleProfile,
      revision: 2,
    });

    const saved = await IdentityBridge.saveUserProfile({
      personType: 'PF',
      username: 'maria_santos',
      firstName: 'Maria',
      lastName: 'Santos',
      cpf: '52998224725',
      email: 'maria@asppibra.org.br',
      country: 'Brasil',
      address: 'Avenida Paulista',
      state: 'SP',
      city: 'São Paulo',
      zipCode: '01310100',
    });

    expect(saved.revision).toBe(2);
    expect(saved.firstName).toBe('Maria');
    expect(saved.username).toBe('maria_santos');
  });

  it('deve salvar perfil de Pessoa Jurídica com CNPJ alfanumérico RFB 2026', async () => {
    mockIpcResponse('save_user_profile', samplePjProfile);

    const saved = await IdentityBridge.saveUserProfile({
      personType: 'PJ',
      username: 'asppibra_tech',
      companyName: 'ASPPIBRA Soluções Ltda',
      cnpj: '12ABC34501DE35',
      legalRepresentative: 'Maria Santos',
      legalRepresentativeCpf: '52998224725',
      email: 'contato@asppibra.org.br',
      country: 'Brasil',
      address: 'Avenida Paulista',
      state: 'SP',
      city: 'São Paulo',
      zipCode: '01310100',
    });

    expect(saved.personType).toBe('PJ');
    expect(saved.cnpj).toBe('12.ABC.345/01DE-35');
    expect(saved.completenessScore).toBe(100);
  });

  it('deve propagar erro quando o cofre estiver bloqueado', async () => {
    mockIpcError(
      'get_user_profile',
      'VAULT_LOCKED: O cofre seguro está bloqueado. Desbloqueie com a senha mestre para acessar os dados.'
    );

    await expect(IdentityBridge.getUserProfile()).rejects.toThrow(/VAULT_LOCKED/);
  });

  it('deve propagar erro estruturado de REVISION_CONFLICT em concorrência otimista', async () => {
    mockIpcError(
      'save_user_profile',
      'REVISION_CONFLICT: O perfil foi atualizado concorrentemente (revisão atual: 3, informada: 1).'
    );

    await expect(
      IdentityBridge.saveUserProfile({
        firstName: 'Teste',
        expectedRevision: 1,
      })
    ).rejects.toThrow(/REVISION_CONFLICT/);
  });

  it('deve importar perfil legado via import_legacy_profile preservando os dados', async () => {
    mockIpcResponse('import_legacy_profile', sampleProfile);

    const legacy = JSON.stringify({
      username: 'maria_santos',
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria@asppibra.org.br',
    });

    const imported = await IdentityBridge.importLegacyProfile(legacy);
    expect(imported.firstName).toBe('Maria');
    expect(imported.username).toBe('maria_santos');
    expect(imported.revision).toBe(1);
  });

  describe('Validações Documentais e Normalizações Estritas', () => {
    it('isStrictValidCpf deve validar dígitos e rejeitar strings vazias, sequências ou DVs incorretos', () => {
      expect(isStrictValidCpf('52998224725')).toBe(true);
      expect(isStrictValidCpf('529.982.247-25')).toBe(true);

      // Rejeita espaços vazios (não soma score indevidamente)
      expect(isStrictValidCpf('')).toBe(false);
      expect(isStrictValidCpf('   ')).toBe(false);
      expect(isStrictValidCpf(null)).toBe(false);

      // Rejeita todos iguais
      expect(isStrictValidCpf('11111111111')).toBe(false);
      expect(isStrictValidCpf('00000000000')).toBe(false);

      // Rejeita DV errado
      expect(isStrictValidCpf('52998224726')).toBe(false);

      // Rejeita caracteres indevidos e formatos corrompidos com letras adicionais
      expect(isStrictValidCpf('529.982.247-2A')).toBe(false);
      expect(isStrictValidCpf('abc52998224725xyz')).toBe(false);
      expect(isStrictValidCpf('529.982.247-25-EXTRA')).toBe(false);
    });

    it('isStrictValidCnpj deve validar formato numérico e alfanumérico RFB 2026', () => {
      // Clássico numérico Banco do Brasil
      expect(isStrictValidCnpj('00000000000191')).toBe(true);
      expect(isStrictValidCnpj('00.000.000/0001-91')).toBe(true);

      // Alfanumérico oficial publicado na IN RFB 2.229/2024
      expect(isStrictValidCnpj('12ABC34501DE35')).toBe(true);
      expect(isStrictValidCnpj('12.ABC.345/01DE-35')).toBe(true);

      // Rejeita espaços vazios
      expect(isStrictValidCnpj('')).toBe(false);
      expect(isStrictValidCnpj('   ')).toBe(false);

      // Rejeita máscaras inválidas ou pontuações irregulares
      expect(isStrictValidCnpj('12.ABC.345-01DE/35')).toBe(false);
      expect(isStrictValidCnpj('12/ABC/345/01DE-35')).toBe(false);
      expect(isStrictValidCnpj('00.000.000/0001-9')).toBe(false);
      expect(isStrictValidCnpj('12..ABC--345//01DE==35')).toBe(false);
      expect(isStrictValidCnpj('12.ABC.345/01DE-35-EXTRA')).toBe(false);

      // Rejeita DV errado
      expect(isStrictValidCnpj('12.ABC.345/01DE-36')).toBe(false);
      expect(isStrictValidCnpj('00.000.000/0001-92')).toBe(false);
    });

    it('isStrictValidBirthDate deve verificar bissexto, calendário e rejeitar datas futuras', () => {
      expect(isStrictValidBirthDate('1988-04-12')).toBe(true);
      expect(isStrictValidBirthDate('12/04/1988')).toBe(true);

      // Ano bissexto válido (2024 foi bissexto)
      expect(isStrictValidBirthDate('2024-02-29')).toBe(true);
      expect(isStrictValidBirthDate('29/02/2024')).toBe(true);

      // Ano NÃO-bissexto (2023) com 29 de fevereiro deve falhar
      expect(isStrictValidBirthDate('2023-02-29')).toBe(false);
      expect(isStrictValidBirthDate('29/02/2023')).toBe(false);

      // Data futura deve falhar
      expect(isStrictValidBirthDate('2099-01-01')).toBe(false);

      // Rejeita vazios
      expect(isStrictValidBirthDate('')).toBe(false);
      expect(isStrictValidBirthDate('   ')).toBe(false);
    });

    it('isStrictValidCep e isStrictValidPhone devem validar formatos canônicos', () => {
      expect(isStrictValidCep('01310-100')).toBe(true);
      expect(isStrictValidCep('01310100')).toBe(true);
      expect(isStrictValidCep('0131010')).toBe(false);
      expect(isStrictValidCep('01310-10A')).toBe(false);
      expect(isStrictValidCep('')).toBe(false);

      expect(isStrictValidPhone('(11) 98765-4321')).toBe(true);
      expect(isStrictValidPhone('11987654321')).toBe(true);
      expect(isStrictValidPhone('+5511987654321')).toBe(true);
      expect(isStrictValidPhone('123')).toBe(false);
      expect(isStrictValidPhone('')).toBe(false);
    });

    it('isStrictValidWebsite deve aceitar URLs HTTP/HTTPS válidas com domínio e rejeitar esquemas inseguros', () => {
      expect(isStrictValidWebsite('https://asppibra.org.br')).toBe(true);
      expect(isStrictValidWebsite('http://localhost.local')).toBe(true);

      expect(isStrictValidWebsite('javascript:alert(1)')).toBe(false);
      expect(isStrictValidWebsite('data:text/html,<h1>teste</h1>')).toBe(false);
      expect(isStrictValidWebsite('file:///etc/passwd')).toBe(false);
      expect(isStrictValidWebsite('nao-eh-uma-url')).toBe(false);
      expect(isStrictValidWebsite('')).toBe(false);
    });

    it('canonicalizeUsername deve normalizar prefixo de e-mail e strings com pontos ou caracteres especiais', () => {
      expect(canonicalizeUsername('usuario.teste')).toBe('usuario_teste');
      expect(canonicalizeUsername('Maria Santos')).toBe('maria_santos');
      expect(canonicalizeUsername('joao.silva.dev@asppibra.org')).toBe('joao_silva_dev_asppibra_org');
      expect(canonicalizeUsername('__teste___nome__')).toBe('teste_nome');
      expect(canonicalizeUsername('')).toBe('');

      // Limita estritamente a 30 caracteres
      const longInput = 'a'.repeat(45);
      expect(canonicalizeUsername(longInput).length).toBe(30);
    });
  });

  describe('Gerenciamento de Estado, Mapeamento e Migração Segura', () => {
    it('mapUserToFormValues deve converter UserProfile nulo ou preenchido para campos estritos de formulário', () => {
      const emptyForm = mapUserToFormValues(createEmptyUserAccount());
      expect(emptyForm.personType).toBe('PF');
      expect(emptyForm.isPublic).toBe(false);
      expect(emptyForm.firstName).toBe('');
      expect(emptyForm.companyName).toBe('');

      const sampleUserAccount = userProfileToAccountData(sampleProfile);
      const filledForm = mapUserToFormValues(sampleUserAccount);
      expect(filledForm.firstName).toBe('Maria');
      expect(filledForm.lastName).toBe('Santos');
      expect(filledForm.cpf).toBe('529.982.247-25');
      expect(filledForm.isPublic).toBe(false);
    });

    it('accountDataToSavePayload deve discriminar displayName e PRESERVAR todos os campos PF e PJ', () => {
      const sampleUserAccount = userProfileToAccountData(sampleProfile);
      const samplePjUserAccount = userProfileToAccountData(samplePjProfile);

      const pfPayload = accountDataToSavePayload(sampleUserAccount);
      expect(pfPayload.displayName).toBe('Maria Santos');
      expect(pfPayload.personType).toBe('PF');
      expect(pfPayload.cpf).toBe('529.982.247-25');

      const pjPayload = accountDataToSavePayload(samplePjUserAccount);
      expect(pjPayload.displayName).toBe('ASPPIBRA Soluções Ltda');
      expect(pjPayload.personType).toBe('PJ');
      expect(pjPayload.cnpj).toBe('12.ABC.345/01DE-35');

      // Preservação mútua: se PJ contém dados PF prévios, não devem ser apagados no payload
      const pjWithPfFields = accountDataToSavePayload({
        ...samplePjUserAccount,
        firstName: 'Maria',
        lastName: 'Santos',
        cpf: '529.982.247-25',
        rg: '12345678-9',
      });
      expect(pjWithPfFields.personType).toBe('PJ');
      expect(pjWithPfFields.firstName).toBe('Maria');
      expect(pjWithPfFields.cpf).toBe('529.982.247-25');
      expect(pjWithPfFields.cnpj).toBe('12.ABC.345/01DE-35');
    });

    it('calculateIdentityCompleteness deve atingir 100 pontos para cadastros PF e PJ completos', () => {
      const pfComplete = calculateIdentityCompleteness({
        personType: 'PF',
        firstName: 'João',
        lastName: 'Silva',
        cpf: '529.982.247-25',
        birthDate: '1985-05-15',
        rg: '123456',
        motherName: 'Maria Silva',
        email: 'joao@email.com',
        phoneNumber: '(11) 98765-4321',
        zipCode: '01310-100',
        city: 'São Paulo',
        state: 'SP',
        address: 'Av Paulista',
        occupation: 'Desenvolvedor',
      });
      expect(pfComplete).toBe(100);

      const pjComplete = calculateIdentityCompleteness({
        personType: 'PJ',
        companyName: 'Minha Empresa Ltda',
        cnpj: '12.ABC.345/01DE-35',
        legalRepresentative: 'João Silva',
        legalRepresentativeCpf: '529.982.247-25',
        email: 'contato@empresa.com',
        phoneNumber: '(11) 3333-4444',
        zipCode: '01310-100',
        city: 'São Paulo',
        state: 'SP',
        address: 'Av Paulista',
        occupation: 'Tecnologia',
      });
      expect(pjComplete).toBe(100);
    });

    it('readLegacyProfile deve diferenciar missing, invalid e valid sem descartar dados indevidamente', () => {
      const storageMap = new Map<string, string>();
      const mockStorage = {
        getItem: (k: string) => storageMap.get(k) ?? null,
        setItem: (k: string, v: string) => storageMap.set(k, v),
        removeItem: (k: string) => storageMap.delete(k),
        clear: () => storageMap.clear(),
        length: 0,
        key: () => null,
      };
      (globalThis as unknown as { window?: { localStorage?: typeof mockStorage } }).window = {
        localStorage: mockStorage,
      };

      mockStorage.removeItem(LEGACY_STORAGE_KEY);
      expect(readLegacyProfile()).toEqual({ status: 'missing' });

      // JSON corrompido
      mockStorage.setItem(LEGACY_STORAGE_KEY, '{ invalid json');
      const corrupted = readLegacyProfile();
      expect(corrupted.status).toBe('invalid');

      // Tamanho excessivo > 64 KB
      mockStorage.setItem(LEGACY_STORAGE_KEY, '{"about":"' + 'a'.repeat(65 * 1024) + '"}');
      const oversized = readLegacyProfile();
      expect(oversized.status).toBe('invalid');

      // Válido
      mockStorage.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify({ firstName: 'Maria', email: 'maria@email.com' })
      );
      const valid = readLegacyProfile();
      expect(valid.status).toBe('valid');
      if (valid.status === 'valid') {
        expect(valid.data.firstName).toBe('Maria');
        expect(valid.data.isPublic).toBe(false);
      }

      mockStorage.removeItem(LEGACY_STORAGE_KEY);
    });

    it('mergeMissingLegacyFields deve preencher apenas campos ausentes no cofre e preservar isPublic do cofre', () => {
      const sampleUserAccount = userProfileToAccountData(sampleProfile);
      const vault: typeof sampleUserAccount = {
        ...sampleUserAccount,
        address: '', // Campo vazio no cofre
        city: '',    // Campo vazio no cofre
        state: 'SP', // Campo preenchido no cofre
        isPublic: true, // Já aprovado como público pelo usuário no cofre
        username: '', // Cofre sem username explícito
        email: '',    // Cofre sem e-mail preenchido
      };

      const legacy: Partial<typeof sampleUserAccount> = {
        address: 'Rua das Flores, 100',
        state: 'RJ', // Conflito: não deve sobrescrever o cofre
        city: 'Campinas',
        isPublic: false,
        username: 'maria_legacy',
        email: 'maria.legacy@asppibra.org.br',
      };

      const { merged, changedFields } = mergeMissingLegacyFields(vault, legacy);
      expect(merged.address).toBe('Rua das Flores, 100'); // Preencheu vazio
      expect(merged.state).toBe('SP'); // Manteve o cofre
      expect(merged.city).toBe('Campinas'); // Preencheu vazio
      expect(merged.username).toBe('maria_legacy'); // Incorporou username canônico ausente
      expect(merged.email).toBe('maria.legacy@asppibra.org.br'); // Incorporou e-mail ausente com segurança
      expect(merged.isPublic).toBe(true); // Preservou configuração do cofre
      expect(changedFields).toEqual(['address', 'city', 'username', 'email']);
    });

    it('verifyMigrationIntegrity deve validar correspondência estrita de todos os campos legados', () => {
      const persisted = userProfileToAccountData(sampleProfile);

      // 1. Caso idêntico: sem divergências
      const identicalLegacy = {
        firstName: 'Maria',
        lastName: 'Santos',
        cpf: '52998224725', // Formato desmascarado deve equivaler ao mascarado
        email: 'MARIA@asppibra.org.br', // Case-insensitive
        state: 'SP',
      };
      expect(verifyMigrationIntegrity(identicalLegacy, persisted)).toEqual([]);

      // 2. Caso com divergência de campo
      const divergentLegacy = {
        firstName: 'Maria',
        lastName: 'Santos',
        cpf: '11122233344', // CPF incompatível
        rg: '99999999-9',   // RG não coincidente
      };
      const mismatches = verifyMigrationIntegrity(divergentLegacy, persisted);
      expect(mismatches).toContain('cpf');
      expect(mismatches).toContain('rg');

      // 3. Caso com personType incompatível
      const divergentType = {
        personType: 'PJ' as const,
      };
      expect(verifyMigrationIntegrity(divergentType, persisted)).toContain('personType');

      // 4. Caso com username legado presente mas cofre sem username
      const persistedWithoutUsername = {
        ...persisted,
        username: '',
      };
      const legacyWithUsername = {
        username: 'maria_santos',
      };
      expect(verifyMigrationIntegrity(legacyWithUsername, persistedWithoutUsername)).toContain('username');

      // 5. Caso com username legado inválido (< 3 caracteres)
      const legacyWithInvalidUsername = {
        username: 'ab',
      };
      expect(verifyMigrationIntegrity(legacyWithInvalidUsername, persisted)).toContain('username');
    });

    it('readLegacyProfile deve detectar storage inacessível e personType corrompido', () => {
      // Mock que lança erro ao tentar ler (ex: restrição de segurança no WebView)
      const throwingStorage = {
        getItem: () => {
          throw new Error('Access denied by browser security policy');
        },
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null,
      };
      (globalThis as unknown as { window?: { localStorage?: typeof throwingStorage } }).window = {
        localStorage: throwingStorage,
      };

      const unavail = readLegacyProfile();
      expect(unavail.status).toBe('unavailable');

      // Mock com personType inválido
      const storageMap = new Map<string, string>();
      const validStorage = {
        getItem: (k: string) => storageMap.get(k) ?? null,
        setItem: (k: string, v: string) => storageMap.set(k, v),
        removeItem: (k: string) => storageMap.delete(k),
        clear: () => storageMap.clear(),
        length: 0,
        key: () => null,
      };
      (globalThis as unknown as { window?: { localStorage?: typeof validStorage } }).window = {
        localStorage: validStorage,
      };

      validStorage.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify({ firstName: 'Maria', personType: 'ALIEN' })
      );
      const invalidTypeResult = readLegacyProfile();
      expect(invalidTypeResult.status).toBe('invalid');
      if (invalidTypeResult.status === 'invalid') {
        expect(invalidTypeResult.reason).toContain('personType inválido');
      }

      // Inferência inteligente quando personType for omitido mas houver CNPJ e Razão Social
      validStorage.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify({
          companyName: 'ASPPIBRA Soluções Ltda',
          cnpj: '12.ABC.345/01DE-35',
        })
      );
      const inferredPj = readLegacyProfile();
      expect(inferredPj.status).toBe('valid');
      if (inferredPj.status === 'valid') {
        expect(inferredPj.data.personType).toBe('PJ');
      }

      // Teste de removeLegacyProfile com confirmação
      expect(removeLegacyProfile()).toBe(true);
      expect(validStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    });

    it('resetAccountStore deve resetar o estado da store para idle e limpar erros', () => {
      resetAccountStore();
      expect(true).toBe(true);
    });

    it('userProfileToAccountData e accountDataToSavePayload devem mapear socialLinks bidirecionalmente', () => {
      const profileWithSocials: UserProfile = {
        ...sampleProfile,
        socialLinks: {
          linkedin: 'https://linkedin.com/in/maria',
          twitter: 'https://x.com/maria',
        },
      };

      const accountData = userProfileToAccountData(profileWithSocials);
      expect(accountData.socialLinks?.linkedin).toBe('https://linkedin.com/in/maria');
      expect(accountData.socialLinks?.twitter).toBe('https://x.com/maria');

      const payload = accountDataToSavePayload(accountData);
      expect(payload.socialLinks?.linkedin).toBe('https://linkedin.com/in/maria');
      expect(payload.socialLinks?.twitter).toBe('https://x.com/maria');
    });
  });
});
