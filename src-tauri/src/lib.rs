use std::error::Error;
use std::fmt::Display;
use std::io;
use tauri::Manager;

// ----------------------------------------------------------------------
// Módulos
// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------
// Configuração das edições
// ----------------------------------------------------------------------

const COCKPIT_IDENTIFIER: &str = "br.aspp.devos.cockpit";

// ----------------------------------------------------------------------
// Tratamento de erros de inicialização
// ----------------------------------------------------------------------

fn startup_error(context: &str, error: impl Display) -> io::Error {
    io::Error::other(format!("{context}: {error}"))
}

// ----------------------------------------------------------------------
// Registro dos comandos
// ----------------------------------------------------------------------

/// Mantém os comandos comuns em um único lugar.
///
/// Os comandos específicos da edição são adicionados pelo chamador.
macro_rules! app_invoke_handler {
    ($($edition_command:path),* $(,)?) => {
        tauri::generate_handler![
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
            commands::generate_document
            $(, $edition_command)*
        ]
    };
}

// ----------------------------------------------------------------------
// Compatibilidade gráfica Linux
// ----------------------------------------------------------------------

/// Define os padrões gráficos necessários apenas quando o ambiente
/// ainda não tiver fornecido valores.
///
/// IMPORTANTE:
/// Esta função deve ser chamada pelo ponto de entrada do processo,
/// antes da criação de threads e da inicialização do runtime Tauri.
#[cfg(target_os = "linux")]
fn configure_linux_environment() {
    let set_dmabuf_default = std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none();
    let set_gdk_default = std::env::var_os("GDK_BACKEND").is_none();

    // SAFETY:
    // run() chama esta função antes de criar o Builder Tauri.
    // O ponto de entrada do aplicativo deve invocar run() antes de
    // iniciar qualquer thread que possa acessar o ambiente do processo.
    unsafe {
        if set_dmabuf_default {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
        if set_gdk_default {
            std::env::set_var("GDK_BACKEND", "x11");
        }
    }
}

// ----------------------------------------------------------------------
// Entrada principal do aplicativo
// ----------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    configure_linux_environment();

    let context = tauri::generate_context!();
    let is_cockpit = context.config().identifier == COCKPIT_IDENTIFIER;

    let builder = tauri::Builder::default()
        .setup(move |app| {
            #[cfg(debug_assertions)]
            {
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
                .map_err(|error| {
                    log::error!(
                        "[Startup] Falha ao resolver o diretório de dados: {}",
                        error
                    );
                    startup_error("Falha ao resolver o diretório de dados", error)
                })?;

            // 2. Inicializar banco do cofre (devos_vault.sqlite) com migrações centralizadas
            let vault_dir = app_data_dir.join("devos_vault");
            let vault_db = storage::LocalDatabase::new(vault_dir);
            storage::MigrationManager::run_migrations(&vault_db)
                .map_err(|error| {
                    log::error!(
                        "[Startup] Falha nas migrações do cofre: {}",
                        error
                    );
                    startup_error("Falha nas migrações do cofre", error)
                })?;

            if !app.manage(vault_db) {
                let error = startup_error(
                    "Falha ao registrar o banco do cofre",
                    "o estado LocalDatabase já estava registrado",
                );
                log::error!("[Startup] {}", error);
                return Err(Box::new(error) as Box<dyn Error>);
            }

            if !app.manage(vault::VaultSession::new()) {
                let error = startup_error(
                    "Falha ao registrar a sessão do cofre",
                    "o estado VaultSession já estava registrado",
                );
                log::error!("[Startup] {}", error);
                return Err(Box::new(error) as Box<dyn Error>);
            }

            // 3. Inicializar banco do Cadastro Imobiliário (real_estate.sqlite) exclusivamente na edição Cockpit
            if is_cockpit {
                let real_estate_dir = app_data_dir.join("real_estate");
                let real_estate_db = storage::RealEstateDatabase::new(real_estate_dir);
                storage::RealEstateMigrationManager::run_migrations(&real_estate_db)
                    .map_err(|error| {
                        log::error!(
                            "[Startup] Falha nas migrações imobiliárias: {}",
                            error
                        );
                        startup_error(
                            "Falha nas migrações do cadastro imobiliário",
                            error,
                        )
                    })?;

                if !app.manage(real_estate_db) {
                    let error = startup_error(
                        "Falha ao registrar o banco imobiliário",
                        "o estado RealEstateDatabase já estava registrado",
                    );
                    log::error!("[Startup] {}", error);
                    return Err(Box::new(error) as Box<dyn Error>);
                }
            }

            Ok(())
        });

    let builder = if is_cockpit {
        builder.invoke_handler(app_invoke_handler!(
            commands::get_real_estate_stats,
            commands::preview_real_estate_import,
            commands::execute_real_estate_import,
            commands::list_import_batches,
            commands::list_audit_findings,
            commands::list_properties,
            commands::select_spreadsheet_file,
        ))
    } else {
        builder.invoke_handler(app_invoke_handler!())
    };

    builder
        .run(context)
        .expect("Falha ao executar o aplicativo Tauri do DevOS Desktop");
}
