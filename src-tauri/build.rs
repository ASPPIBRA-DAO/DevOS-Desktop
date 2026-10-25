fn main() {
    let attributes =
        tauri_build::Attributes::new().app_manifest(tauri_build::AppManifest::new().commands(&[
            "get_device_status",
            "get_vault_status",
            "init_master_password",
            "unlock_vault",
            "generate_seed_and_preview",
            "reveal_pending_mnemonic",
            "cancel_pending_creation",
            "confirm_and_save_wallets",
            "list_stored_wallets",
            "export_authorized_secret",
            "export_vault_backup",
            "restore_vault_backup",
            "fetch_wallet_balance",
            "batch_fetch_wallet_balances",
            "get_real_estate_stats",
            "preview_real_estate_import",
            "execute_real_estate_import",
            "list_import_batches",
            "list_audit_findings",
            "list_properties",
            "select_spreadsheet_file",
        ]));
    tauri_build::try_build(attributes).expect("failed to run tauri-build");
}
