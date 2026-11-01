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
