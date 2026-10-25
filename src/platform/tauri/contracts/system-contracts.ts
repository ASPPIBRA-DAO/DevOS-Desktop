/**
 * Contratos IPC do Domínio de Sistema e Dispositivo Host
 * Sincronizados com `src-tauri/src/commands/system_commands.rs`.
 */

export interface DeviceStatusResponse {
  enrolled: boolean;
  status: string;
}
