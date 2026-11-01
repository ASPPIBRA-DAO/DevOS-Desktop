//! Cliente HTTP assíncrono para a API RPC local do Kubo (porta 5001).
//!
//! A comunicação é estritamente vinculada a `127.0.0.1:5001`, sem exposição
//! de credenciais ou rotas administrativas à rede pública.

use std::time::Duration;
use reqwest::multipart::{Form, Part};
use reqwest::{Body, Client, Response};
use sha2::Digest;

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

        let response_text = res
            .text()
            .await
            .map_err(|e| format!("Falha ao ler stream de resposta de /add: {e}"))?;

        let mut final_response: Option<KuboAddResponse> = None;

        for line in response_text.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }

            let obj: KuboAddResponse = serde_json::from_str(trimmed)
                .map_err(|e| format!("Falha ao decodificar linha JSON de /add ('{trimmed}'): {e}"))?;

            // Se Kubo comunicar um erro terminal em qualquer linha da resposta
            if obj.r#type.as_deref() == Some("error") || (obj.message.is_some() && obj.hash.is_none()) {
                let msg = obj
                    .message
                    .unwrap_or_else(|| "Erro desconhecido informado pelo Kubo em /add".to_string());
                return Err(format!("Kubo /api/v0/add encerrou com erro terminal: {msg}"));
            }

            if obj.hash.is_some() {
                final_response = Some(obj);
            }
        }

        final_response.ok_or_else(|| {
            format!("Kubo /api/v0/add não retornou um CID válido na resposta: {response_text}")
        })
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

    /// Executa a leitura de arquivo via `/api/v0/cat?arg=<cid>` em streaming com leitura
    /// direta de frames e captura estrita de erros terminais em trailers HTTP (ex: X-Stream-Error).
    pub async fn cat_to_writer<W: std::io::Write>(
        &self,
        cid: &str,
        offline: bool,
        mut writer: W,
        hasher: &mut sha2::Sha256,
    ) -> Result<u64, String> {
        use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

        let (host, port, base_path) = parse_http_target(&self.base_url)?;

        let mut stream = tokio::time::timeout(
            Duration::from_secs(STATUS_TIMEOUT_SECS * 5),
            tokio::net::TcpStream::connect((host.as_str(), port)),
        )
        .await
        .map_err(|_| "Timeout ao conectar ao daemon Kubo (/cat)".to_string())?
        .map_err(|e| format!("Falha de conexão com Kubo em {host}:{port}: {e}"))?;

        let query = if offline {
            format!("{base_path}/cat?arg={cid}&offline=true")
        } else {
            format!("{base_path}/cat?arg={cid}")
        };

        let req = format!(
            "POST {query} HTTP/1.1\r\n\
             Host: {host}:{port}\r\n\
             Connection: close\r\n\
             Content-Length: 0\r\n\
             \r\n"
        );

        stream
            .write_all(req.as_bytes())
            .await
            .map_err(|e| format!("Falha ao enviar requisição /cat ao Kubo: {e}"))?;

        let mut buf_reader = BufReader::new(stream);

        // 1. Ler linha de status HTTP
        let mut status_line = String::new();
        buf_reader
            .read_line(&mut status_line)
            .await
            .map_err(|e| format!("Falha ao ler status HTTP de /cat: {e}"))?;

        if !status_line.contains("200") {
            let mut remaining_headers = String::new();
            while let Ok(n) = buf_reader.read_line(&mut remaining_headers).await {
                if n == 0 || remaining_headers.ends_with("\r\n\r\n") || remaining_headers.ends_with("\n\n") {
                    break;
                }
            }
            let mut err_body = String::new();
            let _ = tokio::io::AsyncReadExt::read_to_string(&mut buf_reader, &mut err_body).await;
            return Err(format!(
                "Kubo RPC (/cat) retornou erro: {} - {}",
                status_line.trim(),
                err_body.trim()
            ));
        }

        // 2. Consumir cabeçalhos até a linha em branco (\r\n)
        let mut is_chunked = false;
        let mut content_length: Option<u64> = None;

        loop {
            let mut header_line = String::new();
            let n = buf_reader
                .read_line(&mut header_line)
                .await
                .map_err(|e| format!("Falha ao ler cabeçalhos HTTP: {e}"))?;

            if n == 0 || header_line.trim().is_empty() {
                break;
            }

            let lower = header_line.to_lowercase();
            if lower.starts_with("transfer-encoding:") && lower.contains("chunked") {
                is_chunked = true;
            } else if lower.starts_with("content-length:") {
                if let Some((_, val)) = header_line.split_once(':') {
                    content_length = val.trim().parse::<u64>().ok();
                }
            }
        }

        // 3. Decodificar corpo
        if is_chunked {
            decode_chunked_response(buf_reader, &mut writer, hasher).await
        } else if let Some(len) = content_length {
            use tokio::io::AsyncReadExt;
            let mut remaining = len;
            let mut buf = vec![0u8; 65536];
            while remaining > 0 {
                let to_read = std::cmp::min(remaining, buf.len() as u64) as usize;
                buf_reader
                    .read_exact(&mut buf[..to_read])
                    .await
                    .map_err(|e| format!("Falha de transporte ao ler stream de dados: {e}"))?;

                hasher.update(&buf[..to_read]);
                writer
                    .write_all(&buf[..to_read])
                    .map_err(|e| format!("Falha ao gravar bloco: {e}"))?;

                remaining -= to_read as u64;
            }
            Ok(len)
        } else {
            use tokio::io::AsyncReadExt;
            let mut buf = vec![0u8; 65536];
            let mut total = 0u64;
            loop {
                let n = buf_reader
                    .read(&mut buf)
                    .await
                    .map_err(|e| format!("Falha de transporte ao ler stream: {e}"))?;
                if n == 0 {
                    break;
                }
                hasher.update(&buf[..n]);
                writer
                    .write_all(&buf[..n])
                    .map_err(|e| format!("Falha ao gravar bloco: {e}"))?;
                total += n as u64;
            }
            Ok(total)
        }
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

/// Parse de URL local para extração de host, porta e path base
pub fn parse_http_target(base_url: &str) -> Result<(String, u16, String), String> {
    let url = base_url.trim();
    let stripped = url
        .strip_prefix("http://")
        .ok_or_else(|| format!("URL Kubo não suportada (apenas http:// local): {url}"))?;
    let mut parts = stripped.splitn(2, '/');
    let host_port = parts.next().unwrap_or("127.0.0.1:5001");
    let base_path = parts.next().map(|p| format!("/{p}")).unwrap_or_default();

    let mut hp = host_port.splitn(2, ':');
    let host = hp.next().unwrap_or("127.0.0.1").to_string();
    let port = hp.next().and_then(|p| p.parse::<u16>().ok()).unwrap_or(5001);

    Ok((host, port, base_path))
}

/// Decodifica um fluxo HTTP/1.1 chunked em streaming, gravando no writer e atualizando o hasher.
/// Intercepta frames terminais de erro e trailers HTTP (ex: X-Stream-Error do Kubo).
pub async fn decode_chunked_response<R, W>(
    mut reader: R,
    mut writer: W,
    hasher: &mut sha2::Sha256,
) -> Result<u64, String>
where
    R: tokio::io::AsyncBufRead + Unpin,
    W: std::io::Write,
{
    use sha2::Digest;
    use tokio::io::{AsyncBufReadExt, AsyncReadExt};

    let mut total_bytes = 0u64;

    loop {
        let mut line = String::new();
        let n = reader
            .read_line(&mut line)
            .await
            .map_err(|e| format!("Falha de transporte ao ler tamanho de chunk HTTP: {e}"))?;

        if n == 0 {
            return Err("Conexão com Kubo encerrada prematuramente antes do término do stream chunked.".to_string());
        }

        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        // Chunk header: <hex_size>[;extensions]
        let hex_part = trimmed.split(';').next().unwrap_or(trimmed).trim();
        let chunk_size = usize::from_str_radix(hex_part, 16)
            .map_err(|e| format!("Tamanho de chunk HTTP hexadecimal inválido ('{hex_part}'): {e}"))?;

        if chunk_size == 0 {
            // Último chunk recebido (0\r\n). Agora lemos os trailers HTTP até linha vazia.
            loop {
                let mut trailer_line = String::new();
                let tn = reader
                    .read_line(&mut trailer_line)
                    .await
                    .map_err(|e| format!("Falha ao ler trailer HTTP do Kubo: {e}"))?;

                if tn == 0 || trailer_line.trim().is_empty() {
                    break; // Fim dos trailers
                }

                let lower = trailer_line.to_lowercase();
                if lower.starts_with("x-stream-error:") || lower.starts_with("x-ipfs-error:") {
                    let err_msg = trailer_line
                        .split_once(':')
                        .map(|(_, msg)| msg.trim())
                        .unwrap_or("erro desconhecido");
                    return Err(format!(
                        "Erro terminal do Kubo recebido via HTTP trailer (X-Stream-Error): {err_msg}"
                    ));
                }
            }
            break;
        }

        // Lê exatamente chunk_size bytes
        let mut chunk_buf = vec![0u8; chunk_size];
        reader
            .read_exact(&mut chunk_buf)
            .await
            .map_err(|e| format!("Falha de transporte ao ler corpo do chunk HTTP: {e}"))?;

        hasher.update(&chunk_buf);
        writer
            .write_all(&chunk_buf)
            .map_err(|e| format!("Falha ao gravar bytes recebidos: {e}"))?;

        total_bytes += chunk_size as u64;

        // Consome o \r\n após o corpo do chunk
        let mut crlf = [0u8; 2];
        reader
            .read_exact(&mut crlf)
            .await
            .map_err(|e| format!("Falha ao ler delimitador de chunk HTTP: {e}"))?;
    }

    Ok(total_bytes)
}
