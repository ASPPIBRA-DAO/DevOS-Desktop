import type { ReactNode } from 'react';

import React from 'react';

import { ipcHandlers } from './setup';

/**
 * Utilitários compartilhados para testes de componentes e bridges do DevOS Desktop.
 */

/**
 * Registra uma resposta simulada para um comando nativo do Tauri IPC.
 */
export function mockIpcResponse<T>(cmd: string, response: T): void {
  ipcHandlers.set(cmd, () => response);
}

/**
 * Registra um erro simulado para um comando nativo do Tauri IPC.
 */
export function mockIpcError(cmd: string, errorMessage: string): void {
  ipcHandlers.set(cmd, () => {
    throw new Error(errorMessage);
  });
}

/**
 * Remove qualquer mock registrado para um comando específico.
 */
export function clearIpcMock(cmd: string): void {
  ipcHandlers.delete(cmd);
}

/**
 * Provedor mínimo para encapsular componentes em testes sem dependências de tela cheia.
 */
export function TestWrapper({ children }: { children: ReactNode }): React.ReactElement {
  return <>{children}</>;
}
