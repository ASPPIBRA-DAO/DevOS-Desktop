import type {
  AvailabilityState,
  CustodyState,
  IntegrityState,
  IpfsAllPinsVerifyResult,
  IpfsCidCustodyStatus,
  IpfsDaemonStatus,
  IpfsDownloadOptions,
  IpfsDownloadResult,
  IpfsPinRequest,
  IpfsPinResult,
  IpfsPinType,
  IpfsProviderPeer,
  IpfsProvidersResult,
  IpfsUnpinRequest,
  IpfsUnpinResult,
  IpfsUploadOptions,
  IpfsUploadResult,
  StorageProofChallenge,
  StorageProofResponse,
} from '../contracts/ipfs-contracts';

import { invokeNative } from '../core/invoke';

// Reexporta os tipos para garantir compatibilidade retroativa integral
export type {
  AvailabilityState,
  CustodyState,
  IntegrityState,
  IpfsAllPinsVerifyResult,
  IpfsCidCustodyStatus,
  IpfsDaemonStatus,
  IpfsDownloadOptions,
  IpfsDownloadResult,
  IpfsPinRequest,
  IpfsPinResult,
  IpfsPinType,
  IpfsProviderPeer,
  IpfsProvidersResult,
  IpfsUnpinRequest,
  IpfsUnpinResult,
  IpfsUploadOptions,
  IpfsUploadResult,
  StorageProofChallenge,
  StorageProofResponse,
};

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

  /**
   * Envia um arquivo para o nó IPFS em streaming
   */
  async uploadFile(options: IpfsUploadOptions): Promise<IpfsUploadResult> {
    return invokeNative<IpfsUploadResult>('ipfs_upload_file', { options });
  },

  /**
   * Recupera um arquivo do nó IPFS por CID em streaming, gravando atomicamente no destino
   */
  async downloadFile(options: IpfsDownloadOptions): Promise<IpfsDownloadResult> {
    return invokeNative<IpfsDownloadResult>('ipfs_download_file', { options });
  },

  /**
   * Fixa (pin) um CID no repositório local
   */
  async pinCid(request: IpfsPinRequest): Promise<IpfsPinResult> {
    return invokeNative<IpfsPinResult>('ipfs_pin_cid', { request });
  },

  /**
   * Remove a fixação (unpin) de um CID com proteção contra exclusão de pins externos
   */
  async unpinCid(request: IpfsUnpinRequest): Promise<IpfsUnpinResult> {
    return invokeNative<IpfsUnpinResult>('ipfs_unpin_cid', { request });
  },

  /**
   * Audita os três indicadores de armazenamento (Integridade, Custódia e Disponibilidade) para um CID específico
   */
  async verifyCidCustody(
    cid: string,
    expectedSha256?: string
  ): Promise<IpfsCidCustodyStatus> {
    return invokeNative<IpfsCidCustodyStatus>('ipfs_verify_cid_custody', {
      cid,
      expectedSha256,
    });
  },

  /**
   * Executa a auditoria de integridade de todos os pins recursivos do repositório
   */
  async verifyAllPins(): Promise<IpfsAllPinsVerifyResult> {
    return invokeNative<IpfsAllPinsVerifyResult>('ipfs_verify_all_pins');
  },

  /**
   * Consulta os provedores que anunciam determinado CID na DHT
   */
  async queryProviders(cid: string): Promise<IpfsProvidersResult> {
    return invokeNative<IpfsProvidersResult>('ipfs_query_providers', { cid });
  },
};

