// ----------------------------------------------------------------------
// ASPPIBRA DevOS — Contratos IPC do Módulo IPFS & DePIN
// ----------------------------------------------------------------------

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
