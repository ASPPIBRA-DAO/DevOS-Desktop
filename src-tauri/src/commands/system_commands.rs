use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct DeviceStatusResponse {
    pub enrolled: bool,
    pub status: String,
}

/// Comando mínimo e não-privilegiado para consulta de status do dispositivo.
/// Restrito pelo manifesto de comandos do aplicativo (AppManifest) e governado pela ACL do Tauri v2.
#[tauri::command]
pub fn get_device_status() -> DeviceStatusResponse {
    DeviceStatusResponse {
        enrolled: false,
        status: "UNINITIALIZED".to_string(),
    }
}
