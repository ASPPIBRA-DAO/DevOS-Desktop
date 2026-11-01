//! Controlador de ciclo de vida e diagnóstico do processo Kubo (IPFS Daemon).
//!
//! Políticas de Segurança:
//! 1. Nunca utiliza comandos de shell (`sh -c` ou `bash -c`).
//! 2. Verifica a porta `127.0.0.1:5001` antes de qualquer tentativa de inicialização.
//! 3. Não inicia processos concorrentes se uma instância já estiver respondendo.
//! 4. Nunca encerra processos externos iniciados fora do ciclo do DevOS.

use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

use super::client::KuboClient;
use super::models::IpfsDaemonStatus;

static SPAWNED_DAEMON_CHILD: Mutex<Option<Child>> = Mutex::new(None);
static SPAWNED_REPO_PATH: Mutex<Option<PathBuf>> = Mutex::new(None);

#[cfg(test)]
static EXCLUSIVE_REPO_OVERRIDE: Mutex<Option<bool>> = Mutex::new(None);

#[cfg(test)]
pub fn set_exclusive_repo_override_for_test(val: Option<bool>) {
    let mut g = EXCLUSIVE_REPO_OVERRIDE.lock().unwrap_or_else(|p| p.into_inner());
    *g = val;
}

#[cfg(test)]
pub fn set_spawned_repo_path_for_test(val: Option<PathBuf>) {
    let mut g = SPAWNED_REPO_PATH.lock().unwrap_or_else(|p| p.into_inner());
    *g = val;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DaemonOrigin {
    External,
    DevOsSpawned,
    Offline,
}

pub struct DaemonManager;

impl DaemonManager {
    /// Obtém o diretório de dados canônico dedicado para o repositório IPFS do DevOS ($APP_DATA_DIR/devos/ipfs).
    pub fn get_dedicated_devos_repo_dir() -> Option<PathBuf> {
        dirs::data_dir().map(|d| d.join("devos").join("ipfs"))
    }

    /// Obtém o caminho efetivo do repositório Kubo.
    /// Prioriza o caminho explicitamente mantido no estado do processo filho iniciado pelo DevOS.
    /// Caso não tenha sido iniciado pelo DevOS, recorre ao IPFS_PATH do processo atual se definido.
    pub fn get_effective_repo_path() -> Option<PathBuf> {
        if let Some(ref path) = *SPAWNED_REPO_PATH.lock().unwrap_or_else(|p| p.into_inner()) {
            return Some(path.clone());
        }
        if let Ok(ipfs_path_val) = std::env::var("IPFS_PATH") {
            return Some(PathBuf::from(ipfs_path_val));
        }
        None
    }

    /// Resolve o caminho executável do binário `ipfs` (Kubo).
    ///
    /// Primeiro testa se `ipfs` responde no `PATH` atual. Se não responder
    /// (comum quando o app é iniciado por gerenciador gráfico de desktop sem shell interativo),
    /// procura nos diretórios canônicos de usuário (~/.local/opt/kubo, ~/.local/bin) e do sistema (/usr/local/bin, /usr/bin).
    pub fn resolve_ipfs_binary() -> Option<PathBuf> {
        // 1. Tentar `ipfs` diretamente no PATH
        if let Ok(status) = Command::new("ipfs")
            .arg("version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
        {
            if status.success() {
                return Some(PathBuf::from("ipfs"));
            }
        }

        // 2. Verificar diretórios canônicos do usuário
        if let Ok(home) = std::env::var("HOME") {
            let home_path = Path::new(&home);
            let user_candidates = [
                home_path.join(".local/opt/kubo/v0.43.1/ipfs"),
                home_path.join(".local/bin/ipfs"),
                home_path.join(".bin/ipfs"),
            ];
            for candidate in user_candidates {
                if candidate.is_file() {
                    if let Ok(status) = Command::new(&candidate)
                        .arg("version")
                        .stdout(Stdio::null())
                        .stderr(Stdio::null())
                        .status()
                    {
                        if status.success() {
                            return Some(candidate);
                        }
                    }
                }
            }
        }

        // 3. Verificar diretórios de sistema
        let system_candidates = [
            PathBuf::from("/usr/local/bin/ipfs"),
            PathBuf::from("/usr/bin/ipfs"),
            PathBuf::from("/opt/kubo/ipfs"),
        ];
        for candidate in system_candidates {
            if candidate.is_file() {
                if let Ok(status) = Command::new(&candidate)
                    .arg("version")
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .status()
                {
                    if status.success() {
                        return Some(candidate);
                    }
                }
            }
        }

        None
    }

    /// Verifica se o binário `ipfs` (Kubo) está instalado e acessível no sistema.
    pub fn is_binary_installed() -> bool {
        Self::resolve_ipfs_binary().is_some()
    }

    /// Identifica a origem do daemon: externo, gerido pelo DevOS ou inativo.
    pub async fn check_daemon_origin() -> DaemonOrigin {
        let client = KuboClient::new();
        if client.is_alive().await {
            let guard = SPAWNED_DAEMON_CHILD.lock().unwrap_or_else(|p| p.into_inner());
            if guard.is_some() {
                DaemonOrigin::DevOsSpawned
            } else {
                DaemonOrigin::External
            }
        } else {
            DaemonOrigin::Offline
        }
    }

    /// Consulta o status completo do daemon local via cliente HTTP RPC, enriquecido com a origem do daemon.
    pub async fn get_status() -> IpfsDaemonStatus {
        let client = KuboClient::new();
        let mut status = client.query_daemon_status().await;
        if status.running {
            let origin = Self::check_daemon_origin().await;
            status.origin = Some(match origin {
                DaemonOrigin::DevOsSpawned => "DevOsSpawned".to_string(),
                DaemonOrigin::External => "External".to_string(),
                DaemonOrigin::Offline => "Offline".to_string(),
            });
        }
        status
    }

    /// Tenta iniciar o `ipfs daemon` de forma segura caso ele não esteja ativo.
    /// Configura explicitamente a variável IPFS_PATH apontando para o repositório dedicado.
    pub async fn start_daemon_if_needed() -> Result<DaemonOrigin, String> {
        let client = KuboClient::new();
        if client.is_alive().await {
            return Ok(DaemonOrigin::External);
        }

        let bin_path = Self::resolve_ipfs_binary()
            .ok_or_else(|| "Binário 'ipfs' (Kubo) não encontrado no PATH do sistema nem nos caminhos canônicos (~/.local/opt/kubo, ~/.local/bin, /usr/local/bin).".to_string())?;

        let mut guard = SPAWNED_DAEMON_CHILD.lock().unwrap_or_else(|p| p.into_inner());
        if guard.is_some() {
            return Ok(DaemonOrigin::DevOsSpawned);
        }

        let dedicated_dir = Self::get_dedicated_devos_repo_dir();

        let mut cmd = Command::new(&bin_path);
        cmd.arg("daemon")
            .stdout(Stdio::null())
            .stderr(Stdio::null());

        if let Some(ref dir) = dedicated_dir {
            cmd.env("IPFS_PATH", dir);
        }

        let child = cmd
            .spawn()
            .map_err(|e| format!("Falha ao iniciar processo 'ipfs daemon': {e}"))?;

        *guard = Some(child);
        let mut repo_guard = SPAWNED_REPO_PATH.lock().unwrap_or_else(|p| p.into_inner());
        *repo_guard = dedicated_dir;

        Ok(DaemonOrigin::DevOsSpawned)
    }

    /// Verifica se o daemon atual opera comprovadamente sobre um repositório exclusivo do DevOS.
    ///
    /// Retorna `true` apenas se:
    /// 1. A origem do processo for `DaemonOrigin::DevOsSpawned`; E
    /// 2. O repositório apontar comprovadamente para um caminho isolado do DevOS
    ///    (mantido no estado do processo filho ou em IPFS_PATH canônico).
    ///
    /// Em qualquer outro caso (daemon externo ou daemon utilizando o repositório padrão ~/.ipfs),
    /// o repositório é estritamente considerado compartilhado.
    pub async fn is_exclusive_devos_repo() -> bool {
        #[cfg(test)]
        {
            if let Some(val) = *EXCLUSIVE_REPO_OVERRIDE.lock().unwrap_or_else(|p| p.into_inner()) {
                return val;
            }
        }

        if Self::check_daemon_origin().await != DaemonOrigin::DevOsSpawned {
            return false;
        }

        if let Some(effective_path) = Self::get_effective_repo_path() {
            if let Some(devos_repo_dir) = Self::get_dedicated_devos_repo_dir() {
                let canon_effective = effective_path.canonicalize().unwrap_or(effective_path);
                let canon_devos = devos_repo_dir.canonicalize().unwrap_or(devos_repo_dir);
                return canon_effective.starts_with(canon_devos);
            }
        }

        false
    }

    /// Obtém o identificador estável de contexto do repositório ativo.
    /// Combina o identificador canônico dedicado da instalação e o PeerID do nó.
    /// Em nós externos ou repositórios compartilhados, retorna 'shared_or_external'.
    pub async fn get_repo_context() -> String {
        let is_exclusive = Self::is_exclusive_devos_repo().await;
        if is_exclusive {
            let path_fingerprint = Self::get_effective_repo_path()
                .map(|p| {
                    use sha2::{Digest, Sha256};
                    let canon = p.canonicalize().unwrap_or(p);
                    let hash = Sha256::digest(canon.to_string_lossy().as_bytes());
                    hex::encode(&hash[0..6])
                })
                .unwrap_or_else(|| "devos_dedicated".to_string());

            let client = KuboClient::new();
            if let Ok(node_id) = client.get_node_id().await {
                if let Some(id) = node_id.id {
                    return format!("devos_repo_{path_fingerprint}_peer_{id}");
                }
            }
            format!("devos_repo_{path_fingerprint}")
        } else {
            "shared_or_external".to_string()
        }
    }

    /// Encerra controladamente o daemon SOMENTE se ele tiver sido iniciado pelo DevOS.
    pub fn shutdown_if_spawned_by_devos() -> Result<bool, String> {
        let mut guard = SPAWNED_DAEMON_CHILD.lock().unwrap_or_else(|p| p.into_inner());
        let mut repo_guard = SPAWNED_REPO_PATH.lock().unwrap_or_else(|p| p.into_inner());
        *repo_guard = None;

        if let Some(mut child) = guard.take() {
            log::info!("[IPFS Daemon] Encerrando daemon iniciado pelo DevOS (PID: {:?})", child.id());
            let _ = child.kill();
            let _ = child.wait();
            Ok(true)
        } else {
            Ok(false)
        }
    }
}
