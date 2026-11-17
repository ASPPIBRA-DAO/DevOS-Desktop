import type { UserProfile } from 'src/platform/tauri/contracts/identity-contracts';

import { it, expect, describe } from 'vitest';

import { IdentityBridge } from 'src/platform/tauri/identity/identity-bridge';

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
});
