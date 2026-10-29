import { it, expect, describe } from 'vitest';

import { invokeNative, NativeIpcTimeoutError } from 'src/platform/tauri/core/invoke';

import { mockIpcError, mockIpcResponse } from './test-utils';

describe('Tauri IPC Test Infrastructure — invokeNative', () => {
  it('deve retornar a resposta mockada com sucesso', async () => {
    mockIpcResponse('get_device_status', { enrolled: false, status: 'UNINITIALIZED' });

    const result = await invokeNative<{ enrolled: boolean; status: string }>('get_device_status');
    expect(result).toEqual({ enrolled: false, status: 'UNINITIALIZED' });
  });

  it('deve propagar erro formatado quando o comando nativo falhar', async () => {
    mockIpcError('unlock_vault', 'Senha incorreta');

    await expect(invokeNative('unlock_vault', { masterPassword: 'wrong' })).rejects.toThrow(
      '[Rust Core IPC Error] (unlock_vault): Senha incorreta'
    );
  });

  it('deve rejeitar com RangeError quando timeoutMs for invalido', async () => {
    await expect(invokeNative('get_device_status', {}, { timeoutMs: -1 })).rejects.toThrow(
      'timeoutMs deve ser um número finito maior que zero.'
    );
  });

  it('deve rejeitar com NativeIpcTimeoutError quando a chamada exceder o timeoutMs configurado', async () => {
    const delayedPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ ok: true }), 100);
    });
    mockIpcResponse('slow_command', delayedPromise);

    await expect(
      invokeNative('slow_command', {}, { timeoutMs: 15 })
    ).rejects.toThrow(NativeIpcTimeoutError);
  });
});
