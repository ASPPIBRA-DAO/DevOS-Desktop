//! Cliente HTTP assíncrono para a API RPC local do Kubo (porta 5001).
//!
//! A comunicação é estritamente vinculada a `127.0.0.1:5001`, sem exposição
//! de credenciais ou rotas administrativas à rede pública.

use std::time::Duration;
use reqwest::multipart::{Form, Part};
use reqwest::{Body, Client, Response};

use super::models::{
    IpfsAllPinsVerifyResult, IpfsDaemonStatus, IpfsPinType, IpfsProviderPeer,
    KuboAddResponse, KuboIdResponse, KuboPinAddResponse, KuboPinLsResponse,
    KuboPinRmResponse, KuboPinVerifyItem, KuboRepoStatResponse,
    KuboRoutingFindprovsItem, KuboSwarmPeersResponse, KuboVersionResponse,
};

pub const DEFAULT_KUBO_RPC_BASE_URL: &str = "http://127.0.0.1:5001/api/v0";
const STATUS_TIMEOUT_SECS: u64 = 2;
const TRANSFER_TIMEOUT_SECS: u64 = 300;
const ROUTING_TIMEOUT_SECS: u64 = 20;

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
            .timeout(Duration::from_secs(STATUS_TIMEOUT_SECS))
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

    /// Envia um fluxo de arquivo para o Kubo via `/api/v0/add`.
    /// O parâmetro `pin` é definido explicitamente conforme política do DevOS.
    pub async fn add_file_multipart(
        &self,
        file_name: &str,
        body: Body,
        pin: bool,
    ) -> Result<KuboAddResponse, String> {
        let url = format!("{}/add?pin={}&quieter=true", self.base_url, pin);
        let part = Part::stream(body).file_name(file_name.to_string());
        let form = Form::new().part("file", part);

        let res = self
            .client
            .post(&url)
            .timeout(Duration::from_secs(TRANSFER_TIMEOUT_SECS))
            .multipart(form)
            .send()
            .await
            .map_err(|e| format!("Falha de conexão com Kubo RPC (/add): {e}"))?;

        if !res.status().is_success() {
            let status = res.status();
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Kubo RPC (/add) retornou status {status}: {err_text}"));
        }

        res.json::<KuboAddResponse>()
            .await
            .map_err(|e| format!("Falha ao decodificar resposta de upload do Kubo: {e}"))
    }

    /// Abre um stream de leitura de arquivo via `/api/v0/cat?arg=<cid>`.
    /// Permite especificar se deve operar em modo offline (somente blocos locais).
    pub async fn cat_stream(&self, cid: &str, offline: bool) -> Result<Response, String> {
        let url = format!(
            "{}/cat?arg={}{}",
            self.base_url,
            cid,
            if offline { "&offline=true" } else { "" }
        );

        let res = self
            .client
            .post(&url)
            .timeout(Duration::from_secs(TRANSFER_TIMEOUT_SECS))
            .send()
            .await
            .map_err(|e| format!("Falha de conexão com Kubo RPC (/cat): {e}"))?;

        if !res.status().is_success() {
            let status = res.status();
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Kubo RPC (/cat) retornou status {status}: {err_text}"));
        }

        Ok(res)
    }

    /// Fixa um CID no repositório local via `/api/v0/pin/add`.
    pub async fn pin_add(&self, cid: &str, recursive: bool) -> Result<Vec<String>, String> {
        let url = format!(
            "{}/pin/add?arg={}&recursive={}",
            self.base_url, cid, recursive
        );

        let res = self
            .client
            .post(&url)
            .timeout(Duration::from_secs(TRANSFER_TIMEOUT_SECS))
            .send()
            .await
            .map_err(|e| format!("Falha de conexão com Kubo RPC (/pin/add): {e}"))?;

        if !res.status().is_success() {
            let status = res.status();
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Kubo RPC (/pin/add) retornou status {status}: {err_text}"));
        }

        let body = res
            .json::<KuboPinAddResponse>()
            .await
            .map_err(|e| format!("Falha ao decodificar resposta de pin/add: {e}"))?;

        Ok(body.pins.unwrap_or_default())
    }

    /// Remove a fixação de um CID via `/api/v0/pin/rm`.
    pub async fn pin_rm(&self, cid: &str, recursive: bool) -> Result<Vec<String>, String> {
        let url = format!(
            "{}/pin/rm?arg={}&recursive={}",
            self.base_url, cid, recursive
        );

        let res = self
            .client
            .post(&url)
            .timeout(Duration::from_secs(STATUS_TIMEOUT_SECS * 10))
            .send()
            .await
            .map_err(|e| format!("Falha de conexão com Kubo RPC (/pin/rm): {e}"))?;

        if !res.status().is_success() {
            let status = res.status();
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Kubo RPC (/pin/rm) retornou status {status}: {err_text}"));
        }

        let body = res
            .json::<KuboPinRmResponse>()
            .await
            .map_err(|e| format!("Falha ao decodificar resposta de pin/rm: {e}"))?;

        Ok(body.pins.unwrap_or_default())
    }

    /// Consulta se um CID específico está fixado via `/api/v0/pin/ls?arg=<cid>&type=all`.
    /// Retorna `Ok(Some(pin_type))` se estiver fixado, `Ok(None)` se não estiver fixado.
    pub async fn pin_ls(&self, cid: &str) -> Result<Option<IpfsPinType>, String> {
        let url = format!("{}/pin/ls?arg={}&type=all", self.base_url, cid);

        let res = self
            .client
            .post(&url)
            .timeout(Duration::from_secs(STATUS_TIMEOUT_SECS * 5))
            .send()
            .await
            .map_err(|e| format!("Falha de conexão com Kubo RPC (/pin/ls): {e}"))?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            // Quando não está fixado, o Kubo retorna 500 com mensagem contendo "not pinned" ou "is not pinned"
            if err_text.contains("not pinned") || err_text.contains("is not pinned") {
                return Ok(None);
            }
            return Err(format!("Kubo RPC (/pin/ls) retornou erro: {err_text}"));
        }

        let body = res
            .json::<KuboPinLsResponse>()
            .await
            .map_err(|e| format!("Falha ao decodificar resposta de pin/ls: {e}"))?;

        if let Some(keys) = body.keys {
            if let Some(item) = keys.get(cid) {
                let pin_type = match item.r#type.as_deref() {
                    Some("direct") => IpfsPinType::Direct,
                    Some("indirect") => IpfsPinType::Indirect,
                    _ => IpfsPinType::Recursive,
                };
                return Ok(Some(pin_type));
            }
        }

        Ok(None)
    }

    /// Executa a auditoria completa de todos os pins recursivos do repositório via `/api/v0/pin/verify?verbose=true`.
    pub async fn pin_verify(&self, verbose: bool) -> Result<IpfsAllPinsVerifyResult, String> {
        let url = format!("{}/pin/verify?verbose={}", self.base_url, verbose);

        let res = self
            .client
            .post(&url)
            .timeout(Duration::from_secs(ROUTING_TIMEOUT_SECS * 3))
            .send()
            .await
            .map_err(|e| format!("Falha de conexão com Kubo RPC (/pin/verify): {e}"))?;

        if !res.status().is_success() {
            let status = res.status();
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Kubo RPC (/pin/verify) retornou status {status}: {err_text}"));
        }

        let text = res
            .text()
            .await
            .map_err(|e| format!("Falha ao ler stream de pin/verify: {e}"))?;

        let mut total_audited = 0u32;
        let mut bad_nodes = Vec::new();

        for line in text.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            if let Ok(item) = serde_json::from_str::<KuboPinVerifyItem>(trimmed) {
                total_audited += 1;
                if let Some(status) = item.pin_status {
                    if status.ok != Some(true) {
                        if let Some(mut bad) = status.bad_nodes {
                            bad_nodes.append(&mut bad);
                        } else if let Some(cid) = item.cid {
                            bad_nodes.push(cid);
                        }
                    }
                }
            }
        }

        let is_clean = bad_nodes.is_empty();
        Ok(IpfsAllPinsVerifyResult {
            total_pins_audited: total_audited,
            bad_nodes_count: bad_nodes.len() as u32,
            bad_nodes,
            is_clean,
        })
    }

    /// Consulta provedores que anunciam determinado CID na DHT via `/api/v0/routing/findprovs`.
    pub async fn routing_findprovs(
        &self,
        cid: &str,
        num_providers: u32,
    ) -> Result<Vec<IpfsProviderPeer>, String> {
        let url = format!(
            "{}/routing/findprovs?arg={}&num-providers={}",
            self.base_url, cid, num_providers
        );

        let res = self
            .client
            .post(&url)
            .timeout(Duration::from_secs(ROUTING_TIMEOUT_SECS))
            .send()
            .await
            .map_err(|e| format!("Falha de conexão com Kubo RPC (/routing/findprovs): {e}"))?;

        if !res.status().is_success() {
            let status = res.status();
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Kubo RPC (/routing/findprovs) retornou status {status}: {err_text}"));
        }

        let text = res
            .text()
            .await
            .map_err(|e| format!("Falha ao ler stream de routing/findprovs: {e}"))?;

        let mut providers = Vec::new();

        for line in text.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            if let Ok(item) = serde_json::from_str::<KuboRoutingFindprovsItem>(trimmed) {
                if let Some(responses) = item.responses {
                    for r in responses {
                        if let Some(peer_id) = r.id {
                            if !peer_id.is_empty() {
                                providers.push(IpfsProviderPeer {
                                    peer_id,
                                    addresses: r.addrs.unwrap_or_default(),
                                });
                            }
                        }
                    }
                } else if let Some(peer_id) = item.id {
                    if !peer_id.is_empty() {
                        providers.push(IpfsProviderPeer {
                            peer_id,
                            addresses: Vec::new(),
                        });
                    }
                }
            }
        }

        Ok(providers)
    }
}
