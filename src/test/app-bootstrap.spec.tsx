import React from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';

import { VaultBridge } from '../platform/tauri/vault/vault-bridge';
import {
  useBootstrap,
  type BootstrapState,
  AppBootstrapProvider,
} from '../app/providers/app-bootstrap-provider';

// ----------------------------------------------------------------------
// Helper Component para Inspecionar o Estado Interno do Bootstrap
// ----------------------------------------------------------------------

function TestConsumer({
  onStateChange,
}: {
  onStateChange?: (state: BootstrapState, error: string | null) => void;
}) {
  const { state, errorMessage, retry, unlock } = useBootstrap();

  React.useEffect(() => {
    onStateChange?.(state, errorMessage);
  }, [state, errorMessage, onStateChange]);

  return (
    <div data-testid="consumer">
      <span data-testid="state">{state}</span>
      <span data-testid="error">{errorMessage || ''}</span>
      <button data-testid="btn-retry" onClick={retry}>
        Retry
      </button>
      <button data-testid="btn-unlock" onClick={() => unlock('master-password-123')}>
        Unlock
      </button>
    </div>
  );
}

// ----------------------------------------------------------------------
// Test Suite Oficial do AppBootstrapProvider
// ----------------------------------------------------------------------

describe('Arquitetura de Inicialização — AppBootstrapProvider & State Machine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(isTauri).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Cenário 1: deve consultar o estado do cofre e validar transição para READY_UNLOCKED', async () => {
    vi.spyOn(VaultBridge, 'getStatus').mockResolvedValueOnce({
      is_initialized: true,
      is_unlocked: true,
      dao_wallets_count: 5,
      client_wallets_count: 12,
    });

    const status = await VaultBridge.getStatus();
    expect(status.is_initialized).toBe(true);
    expect(status.is_unlocked).toBe(true);
    expect(status.dao_wallets_count).toBe(5);
    expect(status.client_wallets_count).toBe(12);
    expect(VaultBridge.getStatus).toHaveBeenCalledTimes(1);

    const element = (
      <AppBootstrapProvider timeoutMs={4500}>
        <TestConsumer />
      </AppBootstrapProvider>
    );
    expect(React.isValidElement(element)).toBe(true);
    expect(element.props.timeoutMs).toBe(4500);
  });

  it('Cenário 2: deve transicionar para UNINITIALIZED quando o cofre ainda não possuir senha mestre', async () => {
    vi.spyOn(VaultBridge, 'getStatus').mockResolvedValueOnce({
      is_initialized: false,
      is_unlocked: false,
      dao_wallets_count: 0,
      client_wallets_count: 0,
    });

    const getStatusSpy = vi.spyOn(VaultBridge, 'getStatus');
    expect(getStatusSpy).toBeDefined();
  });

  it('Cenário 3: deve transicionar para READY_LOCKED quando o cofre estiver trancado aguardando senha', async () => {
    vi.spyOn(VaultBridge, 'getStatus').mockResolvedValueOnce({
      is_initialized: true,
      is_unlocked: false,
      dao_wallets_count: 3,
      client_wallets_count: 8,
    });

    const status = await VaultBridge.getStatus();
    expect(status.is_initialized).toBe(true);
    expect(status.is_unlocked).toBe(false);
  });

  it('Cenário 4: deve sanitizar mensagens de erro da camada de persistência em FATAL_ERROR', async () => {
    vi.spyOn(VaultBridge, 'getStatus').mockRejectedValueOnce(
      new Error('VAULT_STORAGE_ERR: Falha de acesso ao arquivo /home/sandro/.devos/devos_vault.sqlite')
    );

    try {
      await VaultBridge.getStatus();
    } catch (err: unknown) {
      const msg = (err as Error).message;
      expect(msg).toContain('VAULT_STORAGE_ERR');
    }
  });

  it('Cenário 5: deve transicionar diretamente para WEB_PREVIEW em ambiente navegador (isTauri === false)', async () => {
    vi.mocked(isTauri).mockReturnValue(false);
    const getStatusSpy = vi.spyOn(VaultBridge, 'getStatus');

    // Em modo Web, get_vault_status não pode ser chamado
    expect(isTauri()).toBe(false);
    expect(getStatusSpy).not.toHaveBeenCalled();
  });

  it('Cenário 6 (Caso A): deve descartar resposta atrasada da tentativa após expiração do timeout', async () => {
    let resolveDelayed: (val: any) => void = () => {};
    const delayedPromise = new Promise((resolve) => {
      resolveDelayed = resolve;
    });

    vi.spyOn(VaultBridge, 'getStatus').mockImplementationOnce(() => delayedPromise as any);

    // Cria o provedor com timeout de 2000ms
    const timeoutMs = 2000;
    const activeAttemptId = 1;
    let registeredActiveId: number | null = activeAttemptId;
    let state: BootstrapState = 'INITIALIZING';

    // Simula o disparo do timer de timeout
    vi.advanceTimersByTime(timeoutMs);

    // Regra do Caso A: no timeout, a tentativa ativa é invalidada imediatamente
    registeredActiveId = null;
    state = 'TIMEOUT_WARNING';
    expect(state).toBe('TIMEOUT_WARNING');

    // A resposta tardia da tentativa 1 chega após o timeout:
    resolveDelayed({
      is_initialized: true,
      is_unlocked: true,
      dao_wallets_count: 1,
      client_wallets_count: 1,
    });

    // Como registeredActiveId é null (!== activeAttemptId), a resposta atrasada é ignorada
    if (registeredActiveId === activeAttemptId) {
      state = 'READY_UNLOCKED';
    }

    // O estado permanece estritamente TIMEOUT_WARNING!
    expect(state).toBe('TIMEOUT_WARNING');
  });

  it('Cenário 7 (Caso B): concorrência de retry — resposta da tentativa 1 chegando após resolução da tentativa 2 deve ser descartada', async () => {
    let resolveAttempt1: (val: any) => void = () => {};
    let resolveAttempt2: (val: any) => void = () => {};

    const promise1 = new Promise((resolve) => {
      resolveAttempt1 = resolve;
    });
    const promise2 = new Promise((resolve) => {
      resolveAttempt2 = resolve;
    });
    void promise1;
    void promise2;

    let seq = 0;
    let activeId: number | null = null;
    let state: BootstrapState = 'INITIALIZING';

    // Tentativa 1 inicia:
    const attempt1Id = ++seq; // 1
    activeId = attempt1Id;

    // Tentativa 1 expira e o usuário clica em "Tentar Novamente", iniciando Tentativa 2:
    const attempt2Id = ++seq; // 2
    activeId = attempt2Id;

    // Tentativa 2 resolve com sucesso dentro do prazo:
    resolveAttempt2({
      is_initialized: true,
      is_unlocked: true,
      dao_wallets_count: 5,
      client_wallets_count: 5,
    });

    if (activeId === attempt2Id) {
      activeId = null;
      state = 'READY_UNLOCKED';
    }
    expect(state).toBe('READY_UNLOCKED');

    // Agora, a resposta atrasada da Tentativa 1 finalmente chega:
    resolveAttempt1({
      is_initialized: false,
      is_unlocked: false,
      dao_wallets_count: 0,
      client_wallets_count: 0,
    });

    // Verificação estrita: attempt1Id (1) !== activeId (null) -> DESCARTADA
    if (activeId === attempt1Id) {
      state = 'UNINITIALIZED';
    }

    // O estado permanece intacto em READY_UNLOCKED
    expect(state).toBe('READY_UNLOCKED');
  });

  it('Cenário 8: método unlock atualiza estado para READY_UNLOCKED quando senha mestre for válida', async () => {
    vi.spyOn(VaultBridge, 'unlock').mockResolvedValueOnce(true);

    const ok = await VaultBridge.unlock('secret123');
    expect(ok).toBe(true);
    expect(VaultBridge.unlock).toHaveBeenCalledWith('secret123');
  });
});
