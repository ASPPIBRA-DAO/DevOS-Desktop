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

export interface IpfsUploadOptions {
  file_path: string;
  pin?: boolean;
  expected_sha256?: string;
}

export interface IpfsUploadResult {
  cid: string;
  name: string;
  size_bytes: number;
  sha256_checksum: string;
  pinned: boolean;
}

export interface IpfsDownloadOptions {
  cid: string;
  target_path: string;
  expected_sha256?: string;
  overwrite?: boolean;
}

export interface IpfsDownloadResult {
  cid: string;
  target_path: string;
  bytes_written: number;
  recovered_sha256: string;
  integrity_matched: boolean;
}

export type IpfsPinType = 'direct' | 'recursive' | 'indirect';

export interface IpfsPinRequest {
  cid: string;
  recursive?: boolean;
}

export interface IpfsPinResult {
  cid: string;
  pinned: boolean;
  pin_type: IpfsPinType;
}

export interface IpfsUnpinRequest {
  cid: string;
  recursive?: boolean;
  force_external_unpin?: boolean;
  confirm_shared_repo_unpin?: boolean;
}

export interface IpfsUnpinResult {
  cid: string;
  unpinned: boolean;
  was_managed_by_devos: boolean;
}

export interface ManagedPinRecord {
  cid: string;
  name: string;
  original_sha256: string;
  size_bytes: number;
  pinned_at_utc: string;
  pin_type: string;
  origin: string;
  repo_context?: string;
}

export type IntegrityState = 'PENDING' | 'CONFIRMED' | 'FAILED';

export type CustodyState =
  | 'NOT_PINNED'
  | 'DIRECT_PIN'
  | 'RECURSIVE_PIN'
  | 'INCOMPLETE_PIN';

export type AvailabilityState =
  | 'UNVERIFIED'
  | 'PROVIDERS_FOUND'
  | 'RECOVERY_CONFIRMED'
  | 'UNAVAILABLE'
  | 'LOOKUP_FAILED';

export interface IpfsCidCustodyStatus {
  cid: string;
  integrity: IntegrityState;
  custody: CustodyState;
  availability: AvailabilityState;
  original_sha256?: string;
  recovered_sha256?: string;
  providers_count: number;
  is_managed_by_devos: boolean;
}

export interface IpfsAllPinsVerifyResult {
  total_pins_audited: number;
  bad_nodes_count: number;
  bad_nodes: string[];
  is_clean: boolean;
}

export interface IpfsProviderPeer {
  peer_id: string;
  addresses: string[];
}

export interface IpfsProvidersResult {
  cid: string;
  providers: IpfsProviderPeer[];
}

