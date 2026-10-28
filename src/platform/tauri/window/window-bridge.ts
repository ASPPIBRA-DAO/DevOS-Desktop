import { LogicalSize } from '@tauri-apps/api/dpi';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { isTauriDesktop } from '../core/invoke';

// ----------------------------------------------------------------------
// ASPPIBRA DevOS — Ponte Nativa de Controle de Janela (Tauri v2)
// ----------------------------------------------------------------------

export class WindowBridge {
  private static hasRestored = false;

  /**
   * Dimensões ideais para modo janela desktop (cabe perfeitamente em telas 1366x768 e Full HD)
   */
  static readonly DEFAULT_WINDOW_SIZE = { width: 1200, height: 680 };

  /**
   * Consulta se a janela atual está em modo tela cheia.
   */
  static async isFullscreen(): Promise<boolean> {
    if (!isTauriDesktop()) return false;
    try {
      const appWindow = getCurrentWindow();
      return await appWindow.isFullscreen();
    } catch {
      return false;
    }
  }

  /**
   * Define o estado de tela cheia da janela nativa.
   */
  static async setFullscreen(fullscreen: boolean): Promise<boolean> {
    if (!isTauriDesktop()) return false;
    try {
      if (fullscreen) {
        this.hasRestored = false;
      }
      const appWindow = getCurrentWindow();
      await appWindow.setFullscreen(fullscreen);
      if (!fullscreen) {
        setTimeout(async () => {
          try {
            await appWindow.setSize(
              new LogicalSize(this.DEFAULT_WINDOW_SIZE.width, this.DEFAULT_WINDOW_SIZE.height)
            );
            await appWindow.center();
          } catch {
            // ignore
          }
        }, 80);
      }
      return fullscreen;
    } catch (err: unknown) {
      console.warn('[WindowBridge] Falha ao definir tela cheia:', err);
      return false;
    }
  }

  /**
   * Alterna entre modo tela cheia e modo janela normal.
   */
  static async toggleFullscreen(): Promise<boolean> {
    if (!isTauriDesktop()) return false;
    try {
      const appWindow = getCurrentWindow();
      const current = await appWindow.isFullscreen();
      const next = !current;
      await appWindow.setFullscreen(next);
      if (!next) {
        setTimeout(async () => {
          try {
            await appWindow.setSize(
              new LogicalSize(this.DEFAULT_WINDOW_SIZE.width, this.DEFAULT_WINDOW_SIZE.height)
            );
            await appWindow.center();
          } catch {
            // ignore
          }
        }, 80);
      }
      return next;
    } catch {
      try {
        const appWindow = getCurrentWindow();
        await appWindow.setFullscreen(false);
        setTimeout(async () => {
          try {
            await appWindow.setSize(
              new LogicalSize(this.DEFAULT_WINDOW_SIZE.width, this.DEFAULT_WINDOW_SIZE.height)
            );
            await appWindow.center();
          } catch {
            // ignore
          }
        }, 80);
        return false;
      } catch (err: unknown) {
        console.warn('[WindowBridge] Falha ao alternar tela cheia:', err);
        return false;
      }
    }
  }

  /**
   * Restaura a janela do modo tela cheia nativa (Fullscreen de inicialização)
   * para o modo janela padrão de trabalho com decorações normais do sistema.
   */
  static async restoreWindowAfterBoot(): Promise<void> {
    if (!isTauriDesktop() || this.hasRestored) {
      return;
    }

    try {
      this.hasRestored = true;
      const appWindow = getCurrentWindow();
      await appWindow.setFullscreen(false);
      setTimeout(async () => {
        try {
          await appWindow.setSize(
            new LogicalSize(this.DEFAULT_WINDOW_SIZE.width, this.DEFAULT_WINDOW_SIZE.height)
          );
          await appWindow.center();
        } catch {
          // ignore
        }
      }, 80);
    } catch (err: unknown) {
      console.warn('[WindowBridge] Falha ao restaurar modo janela:', err);
    }
  }

  /**
   * Reseta a flag interna de restauração (utilizado em reinicializações / retries)
   */
  static reset(): void {
    this.hasRestored = false;
  }
}
