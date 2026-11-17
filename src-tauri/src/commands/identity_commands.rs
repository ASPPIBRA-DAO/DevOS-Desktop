//! Comandos Tauri IPC para Perfil e Identidade Civil.
//!
//! Os comandos interagem com a camada de serviço de identidade,
//! garantindo isolamento criptográfico, fail-closed quando bloqueado,
//! e integridade com a sessão ativa do cofre.

use tauri::State;

use crate::modules::identity::models::{SaveUserProfileRequest, UserProfileDto};
use crate::modules::identity::service::IdentityService;
use crate::modules::vault::access_control::VaultSession;
use crate::storage::local_database::LocalDatabase;

/// Consulta os dados de qualificação civil e perfil protegidos no cofre local SQLite.
///
/// Retorna `Ok(None)` se nenhum perfil foi salvo ainda.
/// Retorna erro se o cofre estiver bloqueado.
#[tauri::command]
pub fn get_user_profile(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
) -> Result<Option<UserProfileDto>, String> {
    IdentityService::get_profile(&db, &session).map_err(|e| {
        log::error!("[Identity IPC] Erro ao consultar perfil: {}", e);
        e.to_string()
    })
}

/// Salva ou atualiza os dados de qualificação civil cifrados no cofre local SQLite.
#[tauri::command]
pub fn save_user_profile(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
    profile: SaveUserProfileRequest,
) -> Result<UserProfileDto, String> {
    IdentityService::save_profile(&db, &session, profile).map_err(|e| {
        log::error!("[Identity IPC] Erro ao salvar perfil: {}", e);
        e.to_string()
    })
}

/// Importa o perfil legado do localStorage para dentro do cofre protegido SQLite.
#[tauri::command]
pub fn import_legacy_profile(
    db: State<'_, LocalDatabase>,
    session: State<'_, VaultSession>,
    legacy_json: String,
) -> Result<UserProfileDto, String> {
    IdentityService::import_legacy_profile(&db, &session, &legacy_json).map_err(|e| {
        log::error!("[Identity IPC] Erro ao importar perfil legado: {}", e);
        e.to_string()
    })
}
