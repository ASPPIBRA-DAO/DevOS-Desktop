import type {
  IpfsDaemonStatus,
  StorageProofChallenge,
  StorageProofResponse,
} from '../contracts/ipfs-contracts';

import { invokeNative } from '../core/invoke';

// Reexporta os tipos para garantir compatibilidade retroativa integral
export type { IpfsDaemonStatus, StorageProofChallenge, StorageProofResponse };

export const IpfsBridge = {
  /**
   * Consulta o estado do daemon Kubo local
   */
  async getDaemonStatus(): Promise<IpfsDaemonStatus> {
    try {
      return await invokeNative<IpfsDaemonStatus>('get_ipfs_daemon_status');
    } catch {
      // Fallback gracioso caso o daemon ainda esteja inicializando
      return { running: false, peers_count: 0 };
    }
  },

  /**
   * Executa a computação de prova criptográfica de armazenamento DePIN (ADR-012)
   */
  async executeStorageProof(challenge: StorageProofChallenge): Promise<StorageProofResponse> {
    return invokeNative<StorageProofResponse>('execute_storage_proof', { challenge });
  },
};
