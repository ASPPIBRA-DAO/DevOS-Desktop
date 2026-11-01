//! Cliente HTTP assíncrono para a API RPC local do Kubo (porta 5001).
//!
//! A comunicação é estritamente vinculada a `127.0.0.1:5001`, sem exposição
//! de credenciais ou rotas administrativas à rede pública.

use std::time::Duration;
use reqwest::Client;

use super::models::{
    IpfsDaemonStatus, KuboIdResponse, KuboRepoStatResponse, KuboSwarmPeersResponse,
    KuboVersionResponse,
};

pub const DEFAULT_KUBO_RPC_BASE_URL: &str = "http://127.0.0.1:5001/api/v0";
const RPC_TIMEOUT_SECS: u64 = 2;

#[derive(Clone, Debug)]
pub struct KuboClient {
    base_url: String,
    client: Client,
}

impl Default for KuboClient {
    fn default() -> Self {
        Self::new()
    }
}

impl KuboClient {
    pub fn new() -> Self {
        Self::with_base_url(DEFAULT_KUBO_RPC_BASE_URL)
    }

    pub fn with_base_url(base_url: impl Into<String>) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(RPC_TIMEOUT_SECS))
            .build()
            .unwrap_or_default();

        Self {
            base_url: base_url.into(),
            client,
        }
    }

    /// Verifica de forma não bloqueante se o daemon Kubo está respondendo na rota `/version`.
    pub async fn is_alive(&self) -> bool {
        let url = format!("{}/version", self.base_url);
        match self.client.post(&url).send().await {
            Ok(res) => res.status().is_success(),
            Err(_) => false,
        }
    }

    /// Obtém a versão do Kubo (/api/v0/version).
    pub async fn get_version(&self) -> Result<KuboVersionResponse, String> {
        let url = format!("{}/version", self.base_url);
        let res = self
            .client
            .post(&url)
            .send()
            .await
            .map_err(|e| format!("Falha de conexão com Kubo RPC (/version): {e}"))?;

        res.json::<KuboVersionResponse>()
            .await
            .map_err(|e| format!("Falha ao decodificar versão do Kubo: {e}"))
    }

    /// Consulta a identificação do nó (/api/v0/id).
    pub async fn get_node_id(&self) -> Result<KuboIdResponse, String> {
        let url = format!("{}/id", self.base_url);
        let res = self
            .client
            .post(&url)
            .send()
            .await
            .map_err(|e| format!("Falha de conexão com Kubo RPC (/id): {e}"))?;

        res.json::<KuboIdResponse>()
            .await
            .map_err(|e| format!("Falha ao decodificar ID do nó: {e}"))
    }

    /// Consulta estatísticas do repositório local (/api/v0/repo/stat).
    pub async fn get_repo_stat(&self) -> Result<KuboRepoStatResponse, String> {
        let url = format!("{}/repo/stat", self.base_url);
        let res = self
            .client
            .post(&url)
            .send()
            .await
            .map_err(|e| format!("Falha de conexão com Kubo RPC (/repo/stat): {e}"))?;

        res.json::<KuboRepoStatResponse>()
            .await
            .map_err(|e| format!("Falha ao decodificar status do repositório: {e}"))
    }

    /// Consulta os peers conectados na rede (/api/v0/swarm/peers).
    pub async fn get_swarm_peers(&self) -> Result<KuboSwarmPeersResponse, String> {
        let url = format!("{}/swarm/peers", self.base_url);
        let res = self
            .client
            .post(&url)
            .send()
            .await
            .map_err(|e| format!("Falha de conexão com Kubo RPC (/swarm/peers): {e}"))?;

        res.json::<KuboSwarmPeersResponse>()
            .await
            .map_err(|e| format!("Falha ao decodificar lista de peers: {e}"))
    }

    /// Consolida o status operacional completo do nó local.
    /// Se o daemon estiver inativo, retorna imediatamente `running: false` sem travar a interface.
    pub async fn query_daemon_status(&self) -> IpfsDaemonStatus {
        if !self.is_alive().await {
            return IpfsDaemonStatus::default();
        }

        let node_id = self.get_node_id().await.ok();
        let version_info = self.get_version().await.ok();
        let repo_stat = self.get_repo_stat().await.ok();
        let swarm_peers = self.get_swarm_peers().await.ok();

        let peers_count = swarm_peers
            .and_then(|s| s.peers)
            .map(|p| p.len() as u32);

        let repo_size = repo_stat.and_then(|r| r.repo_size);
        let peer_id = node_id.and_then(|n| n.id);
        let version = version_info.and_then(|v| v.version);

        IpfsDaemonStatus {
            running: true,
            peer_id,
            repo_size_bytes: repo_size,
            peers_count,
            version,
        }
    }
}
