//! Script de compilação do DevOS Desktop (Tauri v2).
//!
//! Declara todos os comandos nativos para os quais o Tauri deve gerar automaticamente
//! as permissões de controle de acesso (ACL).

/// Lista centralizada e canônica de comandos IPC expostos pela aplicação nativa.
const TAURI_APP_COMMANDS: &[&str] = &[
    // Sistema e cofre criptográfico
    "get_device_status",
    "get_vault_status",
    "init_master_password",
    "unlock_vault",
    "lock_vault",
    // Geração, gerenciamento e custódia de carteiras
    "generate_seed_and_preview",
    "reveal_pending_mnemonic",
    "cancel_pending_creation",
    "confirm_and_save_wallets",
    "list_stored_wallets",
    "export_authorized_secret",
    "export_vault_backup",
    "restore_vault_backup",
    // Monitoramento e consultas financeiras
    "fetch_wallet_balance",
    "batch_fetch_wallet_balances",
    // Geração de documentos e relatórios nativos (Typst)
    "generate_document",
    // Módulo imobiliário e importação de dados (Cockpit)
    "get_real_estate_stats",
    "preview_real_estate_import",
    "execute_real_estate_import",
    "list_import_batches",
    "list_audit_findings",
    "list_properties",
    "select_spreadsheet_file",
];

fn main() {
    let attributes = tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(TAURI_APP_COMMANDS),
    );

    tauri_build::try_build(attributes).expect(
        "Falha ao executar tauri-build e gerar o manifesto de permissões da aplicação",
    );
}
