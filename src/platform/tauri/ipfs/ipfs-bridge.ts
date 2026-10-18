import { invokeNative } from '../core/invoke';

export interface IpfsDaemonStatus {
  running: boolean;
  peer_id?: string;
  repo_size_bytes?: number;
  peers_count?: number;
  version?: string;
}

export interface StorageProofChallenge {
  challenge_id: string;
  cid: string;
  server_nonce: string;
  deadline_utc: string;
}

export interface StorageProofResponse {
  challenge_id: string;
  proof_hash: string;
  signature: string;
  node_operational_pubkey: string;
}

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
