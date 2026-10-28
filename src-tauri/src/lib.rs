use tauri::Manager;

pub mod commands;
pub mod modules;
pub mod monitoring;
pub mod platform;
pub mod real_estate;
pub mod reports;
pub mod storage;
pub mod vault;
pub mod wallets;

#[cfg(test)]
mod tests;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    {
        unsafe {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
            std::env::set_var("GDK_BACKEND", "x11");
        }
    }

    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // 1. Resolver diretórios de dados nativos
            let app_handle = app.handle();
            let app_data_dir = app_handle
                .path()
                .app_data_dir()
                .map_err(|e| format!("Falha ao resolver diretório de dados: {}", e))?;

            // 2. Inicializar banco do cofre (devos_vault.sqlite) com migrações centralizadas
            let vault_dir = app_data_dir.join("devos_vault");
            let vault_db = storage::LocalDatabase::new(vault_dir);
            storage::MigrationManager::run_migrations(&vault_db)
                .map_err(|e| format!("Falha nas migrações do cofre: {}", e))?;
            app.manage(vault_db);
            app.manage(vault::VaultSession::new());

            // 3. Inicializar banco do Cadastro Imobiliário (real_estate.sqlite) exclusivamente na edição Cockpit
            let is_cockpit = app.config().identifier == "br.aspp.devos.cockpit";
            if is_cockpit {
                let real_estate_dir = app_data_dir.join("real_estate");
                let real_estate_db = storage::RealEstateDatabase::new(real_estate_dir);
                storage::RealEstateMigrationManager::run_migrations(&real_estate_db)
                    .map_err(|e| format!("Falha nas migrações do cadastro imobiliário: {}", e))?;
                app.manage(real_estate_db);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_device_status,
            commands::get_vault_status,
            commands::init_master_password,
            commands::unlock_vault,
            commands::lock_vault,
            commands::generate_seed_and_preview,
            commands::reveal_pending_mnemonic,
            commands::cancel_pending_creation,
            commands::confirm_and_save_wallets,
            commands::list_stored_wallets,
            commands::export_authorized_secret,
            commands::export_vault_backup,
            commands::restore_vault_backup,
            commands::fetch_wallet_balance,
            commands::batch_fetch_wallet_balances,
            commands::get_real_estate_stats,
            commands::preview_real_estate_import,
            commands::execute_real_estate_import,
            commands::list_import_batches,
            commands::list_audit_findings,
            commands::list_properties,
            commands::select_spreadsheet_file,
            commands::generate_document
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
