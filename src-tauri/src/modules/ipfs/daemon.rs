//! Controlador de ciclo de vida e diagnóstico do processo Kubo (IPFS Daemon).
//!
//! Políticas de Segurança:
//! 1. Nunca utiliza comandos de shell (`sh -c` ou `bash -c`).
//! 2. Verifica a porta `127.0.0.1:5001` antes de qualquer tentativa de inicialização.
//! 3. Não inicia processos concorrentes se uma instância já estiver respondendo.
//! 4. Nunca encerra processos externos iniciados fora do ciclo do DevOS.

use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

use super::client::KuboClient;
use super::models::IpfsDaemonStatus;

static SPAWNED_DAEMON_CHILD: Mutex<Option<Child>> = Mutex::new(None);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DaemonOrigin {
    External,
    DevOsSpawned,
    Offline,
}

pub struct DaemonManager;

impl DaemonManager {
    /// Verifica se o binário `ipfs` (Kubo) está instalado e acessível no PATH do sistema.
    pub fn is_binary_installed() -> bool {
        Command::new("ipfs")
            .arg("version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
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

    /// Consulta o status completo do daemon local via cliente HTTP RPC.
    pub async fn get_status() -> IpfsDaemonStatus {
        let client = KuboClient::new();
        client.query_daemon_status().await
    }

    /// Tenta iniciar o `ipfs daemon` de forma segura caso ele não esteja ativo.
    ///
    /// Se já existir um daemon respondendo na porta 5001, retorna com sucesso sem criar concorrência.
    pub async fn start_daemon_if_needed() -> Result<DaemonOrigin, String> {
        let client = KuboClient::new();
        if client.is_alive().await {
            return Ok(DaemonOrigin::External);
        }

        if !Self::is_binary_installed() {
            return Err("Binário 'ipfs' (Kubo) não encontrado no PATH do sistema.".to_string());
        }

        let mut guard = SPAWNED_DAEMON_CHILD.lock().unwrap_or_else(|p| p.into_inner());
        if guard.is_some() {
            return Ok(DaemonOrigin::DevOsSpawned);
        }

        let child = Command::new("ipfs")
            .arg("daemon")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("Falha ao iniciar processo 'ipfs daemon': {e}"))?;

        *guard = Some(child);
        Ok(DaemonOrigin::DevOsSpawned)
    }

    /// Encerra controladamente o daemon SOMENTE se ele tiver sido iniciado pelo DevOS.
    pub fn shutdown_if_spawned_by_devos() -> Result<bool, String> {
        let mut guard = SPAWNED_DAEMON_CHILD.lock().unwrap_or_else(|p| p.into_inner());
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
