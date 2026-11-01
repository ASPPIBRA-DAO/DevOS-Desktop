//! Modelos de dados e DTOs para o módulo IPFS e desafios DePIN.
//!
//! Alinhados com os contratos tipados definidos em `ipfs-contracts.ts`.

use serde::{Deserialize, Serialize};

/// Estado operacional do nó Kubo/IPFS local.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpfsDaemonStatus {
    pub running: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repo_size_bytes: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peers_count: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
}

impl Default for IpfsDaemonStatus {
    fn default() -> Self {
        Self {
            running: false,
            peer_id: None,
            repo_size_bytes: None,
            peers_count: None,
            version: None,
        }
    }
}

/// Desafio criptográfico de armazenamento DePIN (ADR-012).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct StorageProofChallenge {
    pub challenge_id: String,
    pub cid: String,
    pub server_nonce: String,
    pub deadline_utc: String,
}

/// Resposta comprovatória de desafio de disponibilidade e integridade local.
///
/// NOTA DE INTEGRIDADE ARQUITETURAL:
/// Esta resposta atesta a integridade do bloco computado localmente e a resolução
/// do desafio sobre o CID informado. NÃO constitui prova de persistência permanente
/// ou replicação global no enxame sem evidências independentes de múltiplos nós.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct StorageProofResponse {
    pub challenge_id: String,
    pub proof_hash: String,
    pub signature: String,
    pub node_operational_pubkey: String,
}

/// Resposta bruta da rota `/api/v0/id` do Kubo.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboIdResponse {
    #[serde(rename = "ID")]
    pub id: Option<String>,
    pub agent_version: Option<String>,
    pub protocol_version: Option<String>,
}

/// Resposta bruta da rota `/api/v0/version` do Kubo.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboVersionResponse {
    pub version: Option<String>,
    pub commit: Option<String>,
}

/// Resposta da rota `/api/v0/repo/stat` do Kubo.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboRepoStatResponse {
    pub repo_size: Option<u64>,
    pub num_objects: Option<u64>,
}

/// Resposta da rota `/api/v0/swarm/peers` do Kubo.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboSwarmPeersResponse {
    pub peers: Option<Vec<KuboPeerInfo>>,
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboPeerInfo {
    pub peer: Option<String>,
    pub addr: Option<String>,
}

fn default_true() -> bool {
    true
}

/// Opções de envio de arquivo para o nó IPFS.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpfsUploadOptions {
    pub file_path: String,
    #[serde(default = "default_true")]
    pub pin: bool,
    pub expected_sha256: Option<String>,
}

/// Resultado do envio de arquivo para o nó IPFS.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpfsUploadResult {
    pub cid: String,
    pub name: String,
    pub size_bytes: u64,
    pub sha256_checksum: String,
    pub pinned: bool,
}

/// Opções de download e recuperação de conteúdo via IPFS.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpfsDownloadOptions {
    pub cid: String,
    pub target_path: String,
    pub expected_sha256: Option<String>,
}

/// Resultado do download e recuperação com validação de checksum.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpfsDownloadResult {
    pub cid: String,
    pub target_path: String,
    pub bytes_written: u64,
    pub recovered_sha256: String,
    pub integrity_matched: bool,
}

/// Tipos de pinagem suportados pelo Kubo.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum IpfsPinType {
    Direct,
    Recursive,
    Indirect,
}

/// Requisição para fixar (pin) um CID.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpfsPinRequest {
    pub cid: String,
    #[serde(default = "default_true")]
    pub recursive: bool,
}

/// Resultado da operação de pinagem.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpfsPinResult {
    pub cid: String,
    pub pinned: bool,
    pub pin_type: IpfsPinType,
}

/// Requisição para remover (unpin) a fixação de um CID.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpfsUnpinRequest {
    pub cid: String,
    #[serde(default = "default_true")]
    pub recursive: bool,
    #[serde(default)]
    pub force_external_unpin: bool,
}

/// Resultado da operação de desfixação.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpfsUnpinResult {
    pub cid: String,
    pub unpinned: bool,
    pub was_managed_by_devos: bool,
}

/// Estado da integridade de conteúdo do DevOS.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum IntegrityState {
    Pending,
    Confirmed,
    Failed,
}

/// Estado da custódia local de conteúdo do DevOS.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CustodyState {
    NotPinned,
    DirectPin,
    RecursivePin,
    IncompletePin,
}

/// Estado da disponibilidade descentralizada do DevOS.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AvailabilityState {
    Unverified,
    ProvidersFound,
    RecoveryConfirmed,
    Unavailable,
}

/// Relatório consolidado dos três indicadores de armazenamento para um CID específico.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpfsCidCustodyStatus {
    pub cid: String,
    pub integrity: IntegrityState,
    pub custody: CustodyState,
    pub availability: AvailabilityState,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_sha256: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recovered_sha256: Option<String>,
    pub providers_count: u32,
    pub is_managed_by_devos: bool,
}

/// Resultado da auditoria global de todos os pins recursivos do repositório Kubo.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpfsAllPinsVerifyResult {
    pub total_pins_audited: u32,
    pub bad_nodes_count: u32,
    pub bad_nodes: Vec<String>,
    pub is_clean: bool,
}

/// Informações de um peer fornecedor de determinado CID.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpfsProviderPeer {
    pub peer_id: String,
    pub addresses: Vec<String>,
}

/// Resposta de consulta de provedores para um CID.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpfsProvidersResult {
    pub cid: String,
    pub providers: Vec<IpfsProviderPeer>,
}

/// Registro de catálogo local de pins gerenciados pelo DevOS ($APP_DATA_DIR/ipfs/managed-pins.json).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ManagedPinRecord {
    pub cid: String,
    pub name: String,
    pub original_sha256: String,
    pub size_bytes: u64,
    pub pinned_at_utc: String,
    pub pin_type: String,
    pub origin: String,
}

/// Resposta bruta da rota `/api/v0/add` do Kubo.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboAddResponse {
    pub name: Option<String>,
    pub hash: Option<String>,
    pub size: Option<String>,
    pub bytes: Option<u64>,
}

/// Resposta bruta da rota `/api/v0/pin/add` do Kubo.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboPinAddResponse {
    pub pins: Option<Vec<String>>,
}

/// Resposta bruta da rota `/api/v0/pin/rm` do Kubo.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboPinRmResponse {
    pub pins: Option<Vec<String>>,
}

/// Item de pin na rota `/api/v0/pin/ls` do Kubo.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboPinLsItem {
    pub r#type: Option<String>,
}

/// Resposta bruta da rota `/api/v0/pin/ls` do Kubo.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboPinLsResponse {
    pub keys: Option<std::collections::HashMap<String, KuboPinLsItem>>,
}

/// Item da rota `/api/v0/pin/verify` do Kubo.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboPinVerifyItem {
    pub cid: Option<String>,
    pub pin_status: Option<KuboPinVerifyStatus>,
}

/// Status de integridade de pin na rota `/api/v0/pin/verify`.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboPinVerifyStatus {
    pub ok: Option<bool>,
    pub bad_nodes: Option<Vec<String>>,
}

/// Item da rota `/api/v0/routing/findprovs` do Kubo.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboRoutingFindprovsItem {
    pub extra: Option<String>,
    #[serde(rename = "ID")]
    pub id: Option<String>,
    pub r#type: Option<i32>,
    pub responses: Option<Vec<KuboRoutingProviderResponse>>,
}

/// Informações de resposta de provedor na rota routing/findprovs.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct KuboRoutingProviderResponse {
    #[serde(rename = "ID")]
    pub id: Option<String>,
    pub addrs: Option<Vec<String>>,
}

