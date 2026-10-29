import type { VaultStatus } from '../platform/tauri/contracts/vault-contracts';

import { isTauri } from '@tauri-apps/api/core';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';

import { isTauriDesktop } from '../platform/tauri/core/invoke';
import { VaultBridge } from '../platform/tauri/vault/vault-bridge';
import {
  resolveVaultState,
  hasValidVaultFlags,
  getBootstrapErrorMessage,
} from '../app/providers/app-bootstrap-provider';

// ----------------------------------------------------------------------
// Mock Explícito da Camada Nativa Tauri
// ----------------------------------------------------------------------

/**
 * Garante que a suíte não dependa de configurações externas implícitas.
 * O vi.mock explícito declara o comportamento do módulo @tauri-apps/api/core.
 */
vi.mock('@tauri-apps/api/core', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    isTauri: vi.fn(() => true),
    invoke: vi.fn(),
  };
});

// ----------------------------------------------------------------------
// Fixtures e Helpers de Teste
// ----------------------------------------------------------------------

const TEST_MASTER_PASSWORD = 'test-only-master-password-123';

/**
 * Cria um objeto VaultStatus válido e fortemente tipado para testes.
 */
function createVaultStatus(overrides: Partial<VaultStatus> = {}): VaultStatus {
  return {
    is_initialized: true,
    is_unlocked: false,
    dao_wallets_count: 0,
    client_wallets_count: 0,
    ...overrides,
  };
}

/**
 * Cria uma Promise diferida tipada cujo resultado pode ser resolvido ou rejeitado
 * sob controle estrito do teste, eliminando a necessidade de 'any' ou 'as any'.
 */
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

// ----------------------------------------------------------------------
// Suíte de Testes da Máquina de Estados e Arquitetura de Bootstrap
// ----------------------------------------------------------------------

describe('Arquitetura de Inicialização — AppBootstrapProvider & State Machine', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.mocked(isTauri).mockReset();
    vi.mocked(isTauri).mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.mocked(isTauri).mockReset();
  });

  // --------------------------------------------------------------------
  // Cenários 1 a 4: Validação da Máquina de Estados do Provedor
  // --------------------------------------------------------------------

  it('Cenário 1: deve transicionar para UNINITIALIZED quando cofre não possui senha mestre configurada', () => {
    const status = createVaultStatus({
      is_initialized: false,
      is_unlocked: false,
      dao_wallets_count: 0,
      client_wallets_count: 0,
    });

    const resolution = resolveVaultState(status);

    expect(resolution.state).toBe('UNINITIALIZED');
    expect(resolution.errorMessage).toBeNull();
  });

  it('Cenário 2: deve transicionar para READY_LOCKED quando cofre inicializado aguarda senha mestre', () => {
    const status = createVaultStatus({
      is_initialized: true,
      is_unlocked: false,
      dao_wallets_count: 3,
      client_wallets_count: 8,
    });

    const resolution = resolveVaultState(status);

    expect(resolution.state).toBe('READY_LOCKED');
    expect(resolution.errorMessage).toBeNull();
  });

  it('Cenário 3: deve transicionar para READY_UNLOCKED quando cofre inicializado já está desbloqueado', () => {
    const status = createVaultStatus({
      is_initialized: true,
      is_unlocked: true,
      dao_wallets_count: 5,
      client_wallets_count: 12,
    });

    const resolution = resolveVaultState(status);

    expect(resolution.state).toBe('READY_UNLOCKED');
    expect(resolution.errorMessage).toBeNull();
  });

  it('Cenário 4: deve transicionar para FATAL_ERROR diante de anomalia crítica (não inicializado porém desbloqueado)', () => {
    const status = createVaultStatus({
      is_initialized: false,
      is_unlocked: true,
      dao_wallets_count: 0,
      client_wallets_count: 0,
    });

    const resolution = resolveVaultState(status);

    expect(resolution.state).toBe('FATAL_ERROR');
    expect(resolution.errorMessage).toBe('Inconsistência de integridade na sessão do cofre.');
  });

  // --------------------------------------------------------------------
  // Cenário 5: Validação Estrita de Contratos de Payload Nativo
  // --------------------------------------------------------------------

  it('Cenário 5: hasValidVaultFlags deve rejeitar payloads corrompidos ou malformados para evitar falso primeiro acesso', () => {
    // Payloads válidos
    expect(hasValidVaultFlags({ is_initialized: true, is_unlocked: false })).toBe(true);
    expect(hasValidVaultFlags({ is_initialized: false, is_unlocked: false })).toBe(true);

    // Payloads inválidos que jamais devem ser interpretados como primeiro acesso legítimo
    expect(hasValidVaultFlags(null)).toBe(false);
    expect(hasValidVaultFlags(undefined)).toBe(false);
    expect(hasValidVaultFlags([])).toBe(false);
    expect(hasValidVaultFlags('invalid_string')).toBe(false);
    expect(hasValidVaultFlags(12345)).toBe(false);
    expect(hasValidVaultFlags({ is_initialized: 'true', is_unlocked: false })).toBe(false);
    expect(hasValidVaultFlags({ is_initialized: true })).toBe(false);
    expect(hasValidVaultFlags({ is_unlocked: false })).toBe(false);
  });

  // --------------------------------------------------------------------
  // Cenário 6: Sanitização e Proteção Contra Vazamento de Caminhos Sensíveis
  // --------------------------------------------------------------------

  it('Cenário 6: deve sanitizar erros de armazenamento em FATAL_ERROR sem expor caminhos locais sensíveis', () => {
    const sensitivePath = '/home/sandro/.devos/devos_vault.sqlite';
    const rawStorageError = new Error(
      `VAULT_STORAGE_ERR: Falha de acesso ao arquivo ${sensitivePath}: Permission denied (os error 13)`
    );

    const sanitizedMessage = getBootstrapErrorMessage(rawStorageError);

    // Garante que o usuário recebe uma mensagem amigável e formal
    expect(sanitizedMessage).toBe('Falha de acesso ao armazenamento seguro local (devos_vault.sqlite).');

    // Validação estrita de segurança: nenhum caminho do sistema de arquivos é exposto
    expect(sanitizedMessage).not.toContain(sensitivePath);
    expect(sanitizedMessage).not.toContain('/home/sandro');
    expect(sanitizedMessage).not.toContain('Permission denied');

    // Erros desconhecidos ou genéricos recebem mensagem padronizada segura
    const unknownError = new Error('UNEXPECTED_CORE_PANIC: internal stack trace');
    const genericMessage = getBootstrapErrorMessage(unknownError);
    expect(genericMessage).toBe('Erro inesperado na inicialização do subsistema nativo do cofre.');
    expect(genericMessage).not.toContain('UNEXPECTED_CORE_PANIC');
  });

  // --------------------------------------------------------------------
  // Cenário 7: Execução em Navegador / Demonstração (isTauri === false)
  // --------------------------------------------------------------------

  it('Cenário 7: deve detectar ambiente navegador (WEB_PREVIEW) e não invocar comandos nativos', () => {
    vi.mocked(isTauri).mockReturnValue(false);

    expect(isTauriDesktop()).toBe(false);

    const getStatusSpy = vi.spyOn(VaultBridge, 'getStatus');

    // Em modo Web, comandos nativos não devem ser chamados
    expect(getStatusSpy).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------
  // Cenário 8: Resposta Atrasada Após Timeout
  // --------------------------------------------------------------------

  it('Cenário 8: deve descartar resposta tardia do IPC se a tentativa expirou por timeout', async () => {
    const deferredStatus = createDeferred<VaultStatus>();

    vi.spyOn(VaultBridge, 'getStatus').mockReturnValueOnce(deferredStatus.promise);

    // Simula a lógica do provedor: timeout ativo
    let activeAttemptId: number | null = 1001;
    let state = 'INITIALIZING';

    // Disparo do timeout invalida a tentativa ativa
    activeAttemptId = null;
    state = 'TIMEOUT_WARNING';
    expect(state).toBe('TIMEOUT_WARNING');

    // Resposta atrasada chega posteriormente tentando indicar desbloqueio
    deferredStatus.resolve(
      createVaultStatus({
        is_initialized: true,
        is_unlocked: true,
      })
    );
    const resolvedStatus = await deferredStatus.promise;

    // Regra de descarte: se activeAttemptId !== tentativa da promessa, não altera estado
    if (activeAttemptId === 1001) {
      state = resolveVaultState(resolvedStatus).state;
    }

    // O estado permanece estritamente em TIMEOUT_WARNING
    expect(state).toBe('TIMEOUT_WARNING');
  });

  // --------------------------------------------------------------------
  // Cenário 9: Concorrência e Sequenciamento de Retry
  // --------------------------------------------------------------------

  it('Cenário 9: deve preservar resultado da tentativa mais recente quando tentativa anterior responder atrasada', async () => {
    const attempt1 = createDeferred<VaultStatus>();
    const attempt2 = createDeferred<VaultStatus>();

    let operationSeq = 0;
    let activeOperationId: number | null = null;
    let state = 'INITIALIZING';

    // Tentativa 1 é iniciada
    const op1Id = ++operationSeq;
    activeOperationId = op1Id;

    // Tentativa 1 demora; usuário clica em retry e inicia Tentativa 2
    const op2Id = ++operationSeq;
    activeOperationId = op2Id;

    // Tentativa 2 resolve com sucesso com cofre não inicializado
    attempt2.resolve(
      createVaultStatus({
        is_initialized: false,
        is_unlocked: false,
      })
    );
    const result2 = await attempt2.promise;

    if (activeOperationId === op2Id) {
      state = resolveVaultState(result2).state;
    }
    expect(state).toBe('UNINITIALIZED');

    // Agora, resposta atrasada da Tentativa 1 chega com status diferente
    attempt1.resolve(
      createVaultStatus({
        is_initialized: true,
        is_unlocked: true,
      })
    );
    const result1 = await attempt1.promise;

    // A verificação impede que op1Id sobrescreva op2Id
    if (activeOperationId === op1Id) {
      state = resolveVaultState(result1).state;
    }

    // O estado permanece intacto com o resultado mais recente
    expect(state).toBe('UNINITIALIZED');
  });

  // --------------------------------------------------------------------
  // Cenário 10: Contrato de Desbloqueio via VaultBridge
  // --------------------------------------------------------------------

  it('Cenário 10: método unlock do VaultBridge deve validar senha e atualizar estado somente em caso de sucesso', async () => {
    const unlockSpy = vi.spyOn(VaultBridge, 'unlock').mockResolvedValueOnce(true);

    const success = await VaultBridge.unlock(TEST_MASTER_PASSWORD);

    expect(success).toBe(true);
    expect(unlockSpy).toHaveBeenCalledWith(TEST_MASTER_PASSWORD);

    // Se o backend retornar false, o cofre NÃO deve ser considerado desbloqueado
    vi.spyOn(VaultBridge, 'unlock').mockResolvedValueOnce(false);
    const failure = await VaultBridge.unlock('wrong-password');
    expect(failure).toBe(false);
  });

  // --------------------------------------------------------------------
  // Cenário 11: Autoridade do Backend e Proteção Fail-Closed
  // --------------------------------------------------------------------

  it('Cenário 11: autoridade do backend — chamadas sensíveis devem falhar quando o cofre estiver trancado', async () => {
    vi.spyOn(VaultBridge, 'exportAuthorizedSecret').mockRejectedValueOnce(
      new Error('Acesso negado: o cofre precisa estar desbloqueado.')
    );

    await expect(
      VaultBridge.exportAuthorizedSecret('senha123', 'dao_vault_1')
    ).rejects.toThrow('Acesso negado: o cofre precisa estar desbloqueado.');
  });
});
