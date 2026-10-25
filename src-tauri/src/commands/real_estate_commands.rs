use crate::real_estate::{ImportExecutionReport, RealEstateImporter, XlsxPreviewReport};
use crate::storage::{
    AuditFindingSummary, ImportBatchSummary, PropertySummary, RealEstateDatabase, RealEstateStats,
};
use std::path::Path;
use tauri::{AppHandle, Manager};

/// Helper para obter o banco cadastral e garantir autorização de edição Cockpit
fn get_cockpit_re_db(app: &AppHandle) -> Result<tauri::State<'_, RealEstateDatabase>, String> {
    app.try_state::<RealEstateDatabase>().ok_or_else(|| {
        "Operação não autorizada: O módulo de Cadastro Imobiliário está disponível exclusivamente na edição DevOS Cockpit (br.aspp.devos.cockpit).".to_string()
    })
}

/// Consulta o estado e as métricas do banco de dados do Cadastro Imobiliário.
#[tauri::command]
pub fn get_real_estate_stats(app: AppHandle) -> Result<RealEstateStats, String> {
    let re_db = get_cockpit_re_db(&app)?;
    re_db
        .get_stats()
        .map_err(|e| format!("Falha ao consultar estatísticas cadastrais: {}", e))
}

/// Gera relatório de pré-visualização da planilha XLSX sem alterar dados cadastrais
#[tauri::command]
pub fn preview_real_estate_import(
    app: AppHandle,
    file_path: String,
    sheet_name: Option<String>,
) -> Result<XlsxPreviewReport, String> {
    let re_db = get_cockpit_re_db(&app)?;
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!(
            "Arquivo da planilha não encontrado no caminho: {}",
            file_path
        ));
    }

    RealEstateImporter::generate_preview(&re_db, path, sheet_name.as_deref())
}

/// Executa a importação controlada da planilha XLSX em lotes com proveniência e idempotência
#[tauri::command]
pub fn execute_real_estate_import(
    app: AppHandle,
    file_path: String,
    sheet_name: String,
    row_limit: Option<usize>,
) -> Result<ImportExecutionReport, String> {
    let re_db = get_cockpit_re_db(&app)?;
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!(
            "Arquivo da planilha não encontrado no caminho: {}",
            file_path
        ));
    }

    RealEstateImporter::execute_import(&re_db, path, &sheet_name, row_limit)
}

/// Lista os lotes de importação já processados
#[tauri::command]
pub fn list_import_batches(
    app: AppHandle,
    limit: Option<usize>,
) -> Result<Vec<ImportBatchSummary>, String> {
    let re_db = get_cockpit_re_db(&app)?;
    re_db
        .list_batches(limit.unwrap_or(20))
        .map_err(|e| e.to_string())
}

/// Lista inconsistências e apontamentos de auditoria cadastrais
#[tauri::command]
pub fn list_audit_findings(
    app: AppHandle,
    limit: Option<usize>,
) -> Result<Vec<AuditFindingSummary>, String> {
    let re_db = get_cockpit_re_db(&app)?;
    re_db
        .list_findings(limit.unwrap_or(50))
        .map_err(|e| e.to_string())
}

/// Lista amostra de imóveis cadastrados
#[tauri::command]
pub fn list_properties(
    app: AppHandle,
    limit: Option<usize>,
) -> Result<Vec<PropertySummary>, String> {
    let re_db = get_cockpit_re_db(&app)?;
    re_db
        .list_properties(limit.unwrap_or(50))
        .map_err(|e| e.to_string())
}

/// Abre o seletor nativo do sistema operacional para escolha de arquivo XLSX (suporta GNOME/GTK via zenity e KDE/Qt via kdialog)
#[tauri::command]
pub fn select_spreadsheet_file() -> Result<Option<String>, String> {
    // 1. Tenta zenity (comum em GNOME / XFCE / distribuições baseadas em GTK)
    let zenity_res = std::process::Command::new("zenity")
        .args([
            "--file-selection",
            "--title=Selecionar Planilha Cadastral",
            "--file-filter=Planilhas Excel (*.xlsx *.xls) | *.xlsx *.xls",
        ])
        .output();

    if let Ok(out) = zenity_res
        && out.status.success()
    {
        let path_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if !path_str.is_empty() {
            return Ok(Some(path_str));
        }
    }

    // 2. Fallback para kdialog (comum em KDE Plasma / Qt)
    let kdialog_res = std::process::Command::new("kdialog")
        .args([
            "--getopenfilename",
            ".",
            "*.xlsx *.xls | Planilhas Excel (*.xlsx, *.xls)",
            "--title",
            "Selecionar Planilha Cadastral",
        ])
        .output();

    if let Ok(out) = kdialog_res
        && out.status.success()
    {
        let path_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if !path_str.is_empty() {
            return Ok(Some(path_str));
        }
    }

    // 3. Se nenhum diálogo gráfico estiver disponível, retorna None permitindo inserção manual
    Ok(None)
}
