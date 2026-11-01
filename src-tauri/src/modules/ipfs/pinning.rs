//! Gerenciador de catálogo de pins e proteção de custódia do DevOS.
//!
//! Controla os CIDs gerenciados pelo aplicativo em `$APP_DATA_DIR/ipfs/managed-pins.json`.
//! Regras de Segurança:
//! 1. Nunca remove pins externos compartilhados sem autorização expressa (`force_external_unpin = true`).
//! 2. Gravação atômica via arquivo temporário para proteção contra corrupção em caso de queda de energia.
//! 3. Sincronização concorrente via Mutex em memória.

use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;

use super::client::KuboClient;
use super::models::{IpfsUnpinResult, ManagedPinRecord};

static CATALOG_MUTEX: Mutex<()> = Mutex::new(());
static CUSTOM_CATALOG_DIR: Mutex<Option<PathBuf>> = Mutex::new(None);

/// Define um diretório customizado para o catálogo (utilizado exclusivamente em testes).
pub fn set_custom_catalog_dir(dir: Option<PathBuf>) {
    let mut guard = CUSTOM_CATALOG_DIR.lock().unwrap_or_else(|p| p.into_inner());
    *guard = dir;
}

/// Retorna o caminho do arquivo `managed-pins.json`.
pub fn get_catalog_path() -> PathBuf {
    let guard = CUSTOM_CATALOG_DIR.lock().unwrap_or_else(|p| p.into_inner());
    let base_dir = if let Some(ref custom) = *guard {
        custom.clone()
    } else if let Some(mut base) = dirs::data_dir() {
        base.push("devos");
        base.push("ipfs");
        base
    } else {
        PathBuf::from("ipfs_data")
    };

    let _ = fs::create_dir_all(&base_dir);
    base_dir.join("managed-pins.json")
}

/// Carrega a lista de pins gerenciados do disco.
pub fn list_managed_pins() -> Vec<ManagedPinRecord> {
    let _lock = CATALOG_MUTEX.lock().unwrap_or_else(|p| p.into_inner());
    load_records_internal()
}

fn load_records_internal() -> Vec<ManagedPinRecord> {
    let path = get_catalog_path();
    if !path.exists() {
        return Vec::new();
    }

    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str::<Vec<ManagedPinRecord>>(&content).unwrap_or_default(),
        Err(e) => {
            log::warn!("[IPFS Pinning] Falha ao ler catálogo managed-pins.json: {e}");
            Vec::new()
        }
    }
}

fn save_records_internal(records: &[ManagedPinRecord]) -> Result<(), String> {
    let path = get_catalog_path();
    let tmp_path = path.with_extension("json.tmp");

    let json_bytes = serde_json::to_vec_pretty(records)
        .map_err(|e| format!("Falha ao serializar catálogo de pins: {e}"))?;

    let mut tmp_file = File::create(&tmp_path)
        .map_err(|e| format!("Falha ao criar arquivo temporário de catálogo: {e}"))?;

    tmp_file
        .write_all(&json_bytes)
        .map_err(|e| format!("Falha ao gravar arquivo temporário de catálogo: {e}"))?;

    tmp_file
        .flush()
        .map_err(|e| format!("Falha ao descarregar buffer do catálogo: {e}"))?;

    tmp_file
        .sync_all()
        .map_err(|e| format!("Falha ao sincronizar catálogo no disco: {e}"))?;

    fs::rename(&tmp_path, &path)
        .map_err(|e| format!("Falha ao substituir catálogo atômico: {e}"))?;

    Ok(())
}

/// Verifica se um CID está registrado como conteúdo gerenciado pelo DevOS.
pub fn is_managed_pin(cid: &str) -> bool {
    let _lock = CATALOG_MUTEX.lock().unwrap_or_else(|p| p.into_inner());
    load_records_internal().iter().any(|r| r.cid == cid)
}

/// Registra um novo pin no catálogo gerenciado.
pub fn register_managed_pin(record: ManagedPinRecord) -> Result<(), String> {
    let _lock = CATALOG_MUTEX.lock().unwrap_or_else(|p| p.into_inner());
    let mut records = load_records_internal();

    records.retain(|r| r.cid != record.cid);
    records.push(record);

    save_records_internal(&records)
}

/// Remove o registro de um pin do catálogo gerenciado.
pub fn unregister_managed_pin(cid: &str) -> Result<bool, String> {
    let _lock = CATALOG_MUTEX.lock().unwrap_or_else(|p| p.into_inner());
    let mut records = load_records_internal();
    let initial_len = records.len();

    records.retain(|r| r.cid != cid);
    let removed = records.len() < initial_len;

    if removed {
        save_records_internal(&records)?;
    }

    Ok(removed)
}

/// Executa a desfixação segura de um CID.
///
/// Se o CID não pertencer ao catálogo do DevOS e `force_external == false`,
/// a operação é rejeitada para impedir a exclusão inadvertida de dados de terceiros
/// em daemons compartilhados.
pub async fn safe_unpin(
    client: &KuboClient,
    cid: &str,
    recursive: bool,
    force_external: bool,
) -> Result<IpfsUnpinResult, String> {
    let was_managed = is_managed_pin(cid);

    if !was_managed && !force_external {
        return Err(format!(
            "O CID '{cid}' não é gerenciado pelo DevOS. Para desfixar conteúdos externos de terceiros no daemon compartilhado, é necessária confirmação explícita (force_external_unpin = true)."
        ));
    }

    let _ = client.pin_rm(cid, recursive).await?;

    if was_managed {
        let _ = unregister_managed_pin(cid);
    }

    Ok(IpfsUnpinResult {
        cid: cid.to_string(),
        unpinned: true,
        was_managed_by_devos: was_managed,
    })
}
