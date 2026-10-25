import { vi, beforeEach } from 'vitest';

/**
 * ASPPIBRA DevOS Desktop — Vitest Global Test Setup
 * 
 * Fornece mocks estruturados e determinísticos para a camada nativa Tauri IPC (@tauri-apps/api/core)
 * sem interferir na integridade dos testes de unidade puros.
 */

// Registro de manipuladores simulados de comandos IPC
export const ipcHandlers = new Map<string, (args: Record<string, unknown>) => unknown>();

// Configura mock padronizado do runtime Tauri v2
vi.mock('@tauri-apps/api/core', () => ({
  isTauri: vi.fn(() => true),
  invoke: vi.fn(async (cmd: string, args: Record<string, unknown> = {}) => {
    const handler = ipcHandlers.get(cmd);
    if (handler) {
      return handler(args);
    }
    // Retorno padrão seguro para comandos não registrados em mock
    return null;
  }),
}));

beforeEach(() => {
  ipcHandlers.clear();
  vi.clearAllMocks();
});
