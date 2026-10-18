import { invoke, isTauri } from '@tauri-apps/api/core';

/**
 * ASPPIBRA DevOS — Native IPC Invoker (Tauri v2)
 *
 * Encapsula chamadas ao motor nativo Rust com verificação de ambiente,
 * tipagem estrita de retorno e tratamento padronizado de exceções.
 */

export function isTauriDesktop(): boolean {
  return isTauri();
}

export async function invokeNative<T>(cmd: string, args: Record<string, unknown> = {}): Promise<T> {
  if (isTauriDesktop()) {
    try {
      return await invoke<T>(cmd, args);
    } catch (err: unknown) {
      const msg = typeof err === 'string' ? err : (err as Error)?.message || JSON.stringify(err);
      throw new Error(`[Rust Core IPC Error] (${cmd}): ${msg}`);
    }
  }

  throw new Error(
    `Ambiente não suportado: O comando nativo '${cmd}' exige execução dentro do aplicativo Desktop DevOS (Tauri v2).`
  );
}
