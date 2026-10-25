import { it, expect, describe } from 'vitest';

import { invokeNative } from 'src/platform/tauri/core/invoke';

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
});
