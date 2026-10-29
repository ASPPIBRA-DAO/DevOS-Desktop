import { invoke, isTauri } from '@tauri-apps/api/core';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';

import {
  invokeNative,
  NativeIpcTimeoutError,
} from '../platform/tauri/core/invoke';

/**
 * Substitui a fronteira nativa do Tauri por mocks controlados.
 *
 * O invokeNative continua sendo executado de verdade; somente sua
 * dependência de transporte é simulada.
 */
vi.mock('@tauri-apps/api/core', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    invoke: vi.fn(),
    isTauri: vi.fn(),
  };
});

/**
 * Configura uma resposta mockada para a camada IPC.
 *
 * Como invoke<T>() é genérico, a conversão é feita exclusivamente
 * no limite do mock. Os consumidores de invokeNative continuam
 * recebendo os tipos definidos nas chamadas de produção.
 */
function mockInvokeResponse(response: unknown): void {
  vi.mocked(invoke).mockResolvedValue(response as never);
}

describe('Tauri IPC Test Infrastructure — invokeNative', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();

    // O cenário padrão representa uma execução no Tauri Desktop.
    vi.mocked(isTauri).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();

    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  it('deve retornar a resposta mockada e invocar o comando correto', async () => {
    const response = {
      enrolled: false,
      status: 'UNINITIALIZED',
    };

    mockInvokeResponse(response);

    const result = await invokeNative<{
      enrolled: boolean;
      status: string;
    }>('get_device_status');

    expect(result).toEqual(response);

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('get_device_status', {});
  });

  it('deve rejeitar com erro IPC formatado sem expor dados sensíveis', async () => {
    const testSecret = 'DO_NOT_LEAK_TEST_SECRET';

    vi.mocked(invoke).mockRejectedValue(
      new Error(`Falha ao processar masterPassword=${testSecret}`)
    );

    const error = await invokeNative('unlock_vault', {
      masterPassword: testSecret,
    }).then(
      () => undefined,
      (reason: unknown) => reason
    );

    expect(error).toBeInstanceOf(Error);

    if (!(error instanceof Error)) {
      throw new Error('invokeNative deveria rejeitar com uma instância de Error');
    }

    expect(error.message).toContain('[Rust Core IPC Error] (unlock_vault):');
    expect(error.message).not.toContain(testSecret);

    expect(invoke).toHaveBeenCalledWith('unlock_vault', {
      masterPassword: testSecret,
    });
  });

  it.each([
    { description: 'timeout negativo', value: -1 },
    { description: 'timeout igual a zero', value: 0 },
    { description: 'NaN', value: Number.NaN },
    { description: 'infinito', value: Number.POSITIVE_INFINITY },
  ])(
    'deve rejeitar com RangeError quando timeoutMs for inválido: $description',
    async ({ value }) => {
      await expect(
        invokeNative('get_device_status', {}, { timeoutMs: value })
      ).rejects.toThrow('timeoutMs deve ser um número finito maior que zero.');

      // A validação deve ocorrer antes da invocação nativa.
      expect(invoke).not.toHaveBeenCalled();
    }
  );

  it('deve rejeitar com erro de ambiente quando executado fora do Tauri', async () => {
    vi.mocked(isTauri).mockReturnValue(false);

    await expect(invokeNative('get_device_status')).rejects.toThrow(
      "Ambiente não suportado: O comando nativo 'get_device_status' exige execução dentro do aplicativo Desktop DevOS (Tauri v2)."
    );

    expect(invoke).not.toHaveBeenCalled();
  });

  it('deve rejeitar com NativeIpcTimeoutError quando a chamada exceder o prazo', async () => {
    vi.useFakeTimers();

    const delayedResponse = new Promise<unknown>((resolve) => {
      setTimeout(() => {
        resolve({ ok: true });
      }, 100);
    });

    vi.mocked(invoke).mockReturnValue(delayedResponse as never);

    const invocation = invokeNative<{ ok: boolean }>(
      'slow_command',
      {},
      { timeoutMs: 15 }
    );

    const rejectionAssertion = expect(invocation).rejects.toBeInstanceOf(NativeIpcTimeoutError);

    await vi.advanceTimersByTimeAsync(15);
    await rejectionAssertion;

    expect(invoke).toHaveBeenCalledWith('slow_command', {});

    // Libera o temporizador da operação simulada.
    // O timeout do frontend não cancela a operação nativa real.
    await vi.advanceTimersByTimeAsync(85);
  });

  it('deve limpar o temporizador quando a chamada terminar antes do prazo', async () => {
    vi.useFakeTimers();

    const response = { ok: true };
    mockInvokeResponse(response);

    await expect(
      invokeNative<{ ok: boolean }>('fast_command', {}, { timeoutMs: 1_000 })
    ).resolves.toEqual(response);

    expect(vi.getTimerCount()).toBe(0);
  });
});
