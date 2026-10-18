import { invokeNative } from '../core/invoke';

export interface DeviceStatusResponse {
  enrolled: boolean;
  status: string;
}

export const SystemBridge = {
  /**
   * Consulta o status de registro e integridade do dispositivo host no Rust Core
   */
  async getDeviceStatus(): Promise<DeviceStatusResponse> {
    return invokeNative<DeviceStatusResponse>('get_device_status');
  },
};
