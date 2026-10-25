use calamine::{Data, Reader, open_workbook_auto};
use rusqlite::{OptionalExtension, params};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Read;
use std::path::Path;
use uuid::Uuid;

use super::normalization::{
    clean_whitespace, normalize_number_string, parse_address_and_number, sha256_digest,
};
use crate::storage::RealEstateDatabase;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct XlsxPreviewReport {
    pub file_path: String,
    pub file_hash_sha256: String,
    pub file_size_bytes: u64,
    pub detected_sheets: Vec<String>,
    pub target_sheet: String,
    pub recognized_headers: Vec<String>,
    pub total_rows_count: usize,
    pub sample_rows: Vec<serde_json::Value>,
    pub empty_matricula_sample_count: usize,
    pub empty_address_sample_count: usize,
    pub duplicate_matricula_sample_count: usize,
    pub already_imported_batch_id: Option<i64>,
    pub already_imported_status: Option<String>,
    pub already_imported_mode: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportExecutionReport {
    pub batch_id: i64,
    pub file_hash_sha256: String,
    pub import_mode: String,
    pub status: String,
    pub total_rows_read: usize,
    pub total_records_imported: usize,
    pub total_inconsistencies_detected: usize,
    pub message: String,
    pub started_at: String,
    pub completed_at: String,
}

pub struct RealEstateImporter;

impl RealEstateImporter {
    /// Computa hash SHA-256 e tamanho de um arquivo em disco após validações de pré-voo
    pub fn compute_file_metadata(path: &Path) -> Result<(String, u64), String> {
        if !path.exists() {
            return Err(format!("Arquivo não encontrado: {}", path.display()));
        }
        if !path.is_file() {
            return Err(format!(
                "O caminho informado não é um arquivo: {}",
                path.display()
            ));
        }
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        if ext != "xlsx" && ext != "xls" && ext != "xlsm" {
            return Err(format!(
                "Extensão de arquivo inválida ('.{}'). Esperado arquivo Excel (.xlsx, .xls).",
                ext
            ));
        }

        let mut file = File::open(path).map_err(|e| format!("Falha ao abrir arquivo: {}", e))?;
        let metadata = file
            .metadata()
            .map_err(|e| format!("Falha ao obter metadados do arquivo: {}", e))?;

        if metadata.len() == 0 {
            return Err(format!("Arquivo vazio (0 bytes): {}", path.display()));
        }

        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)
            .map_err(|e| format!("Falha ao ler arquivo: {}", e))?;
        let hash = sha256_digest(&buffer);

        Ok((hash, metadata.len()))
    }

    /// Converte Data de Calamine para String textual pura sem perda de caracteres
    pub fn cell_to_string(cell: &Data) -> String {
        match cell {
            Data::Empty => String::new(),
            Data::String(s) => s.to_string(),
            Data::Float(f) => {
                if f.fract() == 0.0 {
                    format!("{:.0}", f)
                } else {
                    f.to_string()
                }
            }
            Data::Int(i) => i.to_string(),
            Data::Bool(b) => b.to_string(),
            Data::DateTime(d) => d.to_string(),
            Data::DateTimeIso(iso) => iso.clone(),
            Data::DurationIso(iso) => iso.clone(),
            Data::Error(e) => format!("{:?}", e),
        }
    }

    /// Gera relatório de pré-visualização da planilha sem gravar ou alterar dados cadastrais vigentes
    pub fn generate_preview(
        db: &RealEstateDatabase,
        path: &Path,
        sheet_name_opt: Option<&str>,
    ) -> Result<XlsxPreviewReport, String> {
        let (file_hash, file_size) = Self::compute_file_metadata(path)?;

        // Verifica se o arquivo já possui lote anterior
        let previous_batch = db
            .find_batch_by_hash(&file_hash)
            .map_err(|e| e.to_string())?;

        let mut workbook =
            open_workbook_auto(path).map_err(|e| format!("Falha ao abrir planilha: {}", e))?;

        let detected_sheets = workbook.sheet_names();
        let target_sheet = match sheet_name_opt {
            Some(name) => {
                if !detected_sheets.contains(&name.to_string()) {
                    return Err(format!(
                        "Aba '{}' não encontrada na planilha. Abas disponíveis: {:?}",
                        name, detected_sheets
                    ));
                }
                name.to_string()
            }
            None => {
                if detected_sheets.contains(&"endereco".to_string()) {
                    "endereco".to_string()
                } else if let Some(first) = detected_sheets.first() {
                    first.clone()
                } else {
                    return Err("Nenhuma aba encontrada no arquivo XLSX".to_string());
                }
            }
        };

        let range = workbook
            .worksheet_range(&target_sheet)
            .map_err(|e| format!("Falha ao ler aba '{}': {}", target_sheet, e))?;

        let mut rows_iter = range.rows();
        let header_row = rows_iter
            .next()
            .ok_or_else(|| "Planilha sem linhas".to_string())?;

        let recognized_headers: Vec<String> = header_row
            .iter()
            .map(Self::cell_to_string)
            .map(|s| s.trim().to_string())
            .collect();

        let mut total_rows = 0;
        let mut sample_rows = Vec::new();
        let mut empty_matricula_sample_count = 0;
        let mut empty_address_sample_count = 0;
        let mut seen_matriculas_sample = std::collections::HashSet::new();
        let mut duplicate_matricula_sample_count = 0;

        for (row_idx, row) in rows_iter.enumerate() {
            total_rows += 1;

            if row_idx < 100 {
                let mut row_map = serde_json::Map::new();
                for (col_idx, val) in row.iter().enumerate() {
                    let header_name = recognized_headers
                        .get(col_idx)
                        .cloned()
                        .unwrap_or_else(|| format!("col_{}", col_idx));
                    let cell_str = Self::cell_to_string(val);
                    row_map.insert(header_name, serde_json::Value::String(cell_str));
                }

                let matricula = row_map
                    .get("Matrícula")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .trim();
                let rua = row_map
                    .get("Rua")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .trim();
                let bairro = row_map
                    .get("Bairro")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .trim();

                if matricula.is_empty() {
                    empty_matricula_sample_count += 1;
                } else {
                    let clean_mat = normalize_number_string(matricula);
                    if !seen_matriculas_sample.insert(clean_mat) {
                        duplicate_matricula_sample_count += 1;
                    }
                }

                if rua.is_empty() && bairro.is_empty() {
                    empty_address_sample_count += 1;
                }

                sample_rows.push(serde_json::Value::Object(row_map));
            }
        }

        Ok(XlsxPreviewReport {
            file_path: path.to_string_lossy().to_string(),
            file_hash_sha256: file_hash,
            file_size_bytes: file_size,
            detected_sheets,
            target_sheet,
            recognized_headers,
            total_rows_count: total_rows,
            sample_rows,
            empty_matricula_sample_count,
            empty_address_sample_count,
            duplicate_matricula_sample_count,
            already_imported_batch_id: previous_batch.as_ref().map(|b| b.id),
            already_imported_status: previous_batch.as_ref().map(|b| b.status.clone()),
            already_imported_mode: previous_batch.as_ref().map(|b| b.import_mode.clone()),
        })
    }

    /// Executa a importação controlada em lotes preservando proveniência integral e gerando achados de auditoria.
    /// Distingue rigorosamente modo PILOT vs FULL, garantindo que o piloto não bloqueie a importação completa.
    pub fn execute_import(
        db: &RealEstateDatabase,
        path: &Path,
        sheet_name: &str,
        row_limit: Option<usize>,
    ) -> Result<ImportExecutionReport, String> {
        let (file_hash, file_size) = Self::compute_file_metadata(path)?;
        let started_at = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let mode = if row_limit.is_some() { "PILOT" } else { "FULL" };

        // 1. Verificação de Idempotência sensível ao modo (PILOT vs FULL), aba e limite solicitado
        if mode == "PILOT" {
            if let Some(pilot_batch) = db
                .find_completed_batch(&file_hash, sheet_name, "PILOT", row_limit)
                .map_err(|e| e.to_string())?
            {
                return Ok(ImportExecutionReport {
                    batch_id: pilot_batch.id,
                    file_hash_sha256: file_hash,
                    import_mode: "PILOT".to_string(),
                    status: "ALREADY_COMPLETED".to_string(),
                    total_rows_read: pilot_batch.total_rows_read as usize,
                    total_records_imported: pilot_batch.total_records_imported as usize,
                    total_inconsistencies_detected: pilot_batch.total_inconsistencies_detected
                        as usize,
                    message: format!(
                        "Lote piloto #{} ({}, limite: {}) já concluído anteriormente para este arquivo. A importação integral permanece liberada.",
                        pilot_batch.id,
                        pilot_batch.status,
                        row_limit.unwrap_or(0)
                    ),
                    started_at: pilot_batch.started_at,
                    completed_at: pilot_batch.completed_at.unwrap_or_default(),
                });
            }
        } else {
            // Modo FULL: Apenas um lote FULL com status COMPLETED aciona ALREADY_COMPLETED.
            // Um lote PILOT_COMPLETED NÃO bloqueia o modo FULL!
            if let Some(completed_full) = db
                .find_completed_batch(&file_hash, sheet_name, "FULL", None)
                .map_err(|e| e.to_string())?
            {
                return Ok(ImportExecutionReport {
                    batch_id: completed_full.id,
                    file_hash_sha256: file_hash,
                    import_mode: "FULL".to_string(),
                    status: "ALREADY_COMPLETED".to_string(),
                    total_rows_read: completed_full.total_rows_read as usize,
                    total_records_imported: completed_full.total_records_imported as usize,
                    total_inconsistencies_detected: completed_full.total_inconsistencies_detected
                        as usize,
                    message: format!(
                        "A importação integral deste arquivo já foi concluída com sucesso no lote #{}. Nenhuma duplicata foi criada.",
                        completed_full.id
                    ),
                    started_at: completed_full.started_at,
                    completed_at: completed_full.completed_at.unwrap_or_default(),
                });
            }
        }

        let mut workbook =
            open_workbook_auto(path).map_err(|e| format!("Falha ao abrir planilha: {}", e))?;

        let range = workbook
            .worksheet_range(sheet_name)
            .map_err(|e| format!("Falha ao acessar aba '{}': {}", sheet_name, e))?;

        let total_physical_rows = range.height();
        let expected_data_rows = if total_physical_rows > 1 {
            total_physical_rows - 1
        } else {
            0
        };

        let mut rows_iter = range.rows();
        let header_row = rows_iter
            .next()
            .ok_or_else(|| "Planilha vazia".to_string())?;

        let headers: Vec<String> = header_row
            .iter()
            .map(Self::cell_to_string)
            .map(|s| s.trim().to_string())
            .collect();

        let filename = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let mut conn = db.get_connection().map_err(|e| e.to_string())?;

        // 2. Verificação de Retomada (Resume) com estrita compatibilidade de modo e parâmetros
        let initial_meta = serde_json::json!({
            "source_filename": filename,
            "import_mode": mode,
            "requested_row_limit": row_limit,
        })
        .to_string();

        let (
            batch_id,
            resume_from_row,
            mut total_rows_read,
            mut total_records_imported,
            mut total_inconsistencies,
        ) = {
            let candidate_resumable = db
                .find_resumable_batch(&file_hash, sheet_name, mode)
                .map_err(|e| e.to_string())?;

            let compatible_batch = if let Some(resumable) = candidate_resumable {
                if mode == "PILOT" {
                    // Piloto só retoma se o limite de linhas solicitado coincidir rigorosamente com o lote anterior
                    let prev_limit = resumable
                        .metadata_json
                        .as_deref()
                        .and_then(|m| serde_json::from_str::<serde_json::Value>(m).ok())
                        .and_then(|v| v.get("requested_row_limit").and_then(|l| l.as_u64()))
                        .map(|l| l as usize);

                    if prev_limit == row_limit {
                        Some(resumable)
                    } else {
                        None // Limite de linhas incompatível: inicia novo lote piloto
                    }
                } else {
                    // Modo FULL só retoma lote FULL
                    Some(resumable)
                }
            } else {
                None
            };

            if let Some(resumable) = compatible_batch {
                (
                    resumable.id,
                    resumable.last_processed_row as usize,
                    resumable.total_rows_read as usize,
                    resumable.total_records_imported as usize,
                    resumable.total_inconsistencies_detected as usize,
                )
            } else {
                let tx = conn.transaction().map_err(|e| e.to_string())?;
                tx.execute(
                    "INSERT INTO import_batches (source_filename, source_hash_sha256, source_file_size, sheet_name, import_mode, started_at, status, last_processed_row, metadata_json)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'IN_PROGRESS', 0, ?7)",
                    params![filename, file_hash, file_size as i64, sheet_name, mode, started_at, initial_meta],
                ).map_err(|e| e.to_string())?;
                let id = tx.last_insert_rowid();
                tx.commit().map_err(|e| e.to_string())?;
                (id, 0, 0, 0, 0)
            }
        };

        let mut seen_matriculas_batch = std::collections::HashSet::new();

        // 3. Processamento em blocos transacionais (chunk de 1000 linhas)
        const CHUNK_SIZE: usize = 1000;
        let mut current_chunk = Vec::with_capacity(CHUNK_SIZE);

        // CONVENÇÃO DE INDEXAÇÃO DE LINHAS (LAST_PROCESSED_ROW):
        // - Linha física 1 do Excel: Linha de Cabeçalho (desconsiderada na contagem de registros cadastrais).
        // - Linhas físicas 2..N do Excel: Linhas de Dados da planilha.
        // - `actual_row_number = row_idx + 2`: Representa o número físico exato (1-indexed) da linha no Excel.
        // - `last_processed_row`: Registra a última linha física no Excel com transação atômica confirmada no banco.
        // - Na retomada (resume): O cursor salta todas as linhas com `actual_row_number <= resume_from_row`,
        //   iniciando precisamente na linha física `resume_from_row + 1`.
        // - Linhas com dados em branco ou inconsistências continuam tendo seu `actual_row_number` computado,
        //   impedindo qualquer descompasso ou duplicidade ao reiniciar.
        for (row_idx, row) in rows_iter.enumerate() {
            let actual_row_number = row_idx + 2; // Linha 1 = cabeçalho no Excel, Linhas 2..N = dados

            // Pula linhas já processadas em lote retomado
            if actual_row_number <= resume_from_row {
                continue;
            }

            if let Some(limit) = row_limit {
                if total_rows_read >= limit {
                    break;
                }
            }
            total_rows_read += 1;

            // Mapeia colunas para JSON
            let mut row_map = serde_json::Map::new();
            for (col_idx, val) in row.iter().enumerate() {
                let h_name = headers
                    .get(col_idx)
                    .cloned()
                    .unwrap_or_else(|| format!("col_{}", col_idx));
                row_map.insert(h_name, serde_json::Value::String(Self::cell_to_string(val)));
            }

            let raw_json = serde_json::to_string(&row_map).unwrap_or_default();
            let line_hash = sha256_digest(raw_json.as_bytes());

            current_chunk.push((actual_row_number, row_map, raw_json, line_hash));

            if current_chunk.len() >= CHUNK_SIZE {
                let last_chunk_row = current_chunk
                    .last()
                    .map(|c| c.0)
                    .unwrap_or(actual_row_number);

                let (imported, inconsistencies) = Self::persist_chunk(
                    &mut conn,
                    batch_id,
                    sheet_name,
                    &current_chunk,
                    &mut seen_matriculas_batch,
                    total_rows_read,
                    total_records_imported,
                    total_inconsistencies,
                    last_chunk_row,
                )?;
                total_records_imported += imported;
                total_inconsistencies += inconsistencies;

                current_chunk.clear();
            }
        }

        // Processa o último lote residual
        if !current_chunk.is_empty() {
            let last_chunk_row = current_chunk.last().map(|c| c.0).unwrap_or(0);
            let (imported, inconsistencies) = Self::persist_chunk(
                &mut conn,
                batch_id,
                sheet_name,
                &current_chunk,
                &mut seen_matriculas_batch,
                total_rows_read,
                total_records_imported,
                total_inconsistencies,
                last_chunk_row,
            )?;
            let _ = (imported, inconsistencies);
            current_chunk.clear();
        }

        // 4. Verificação Estrita de Completude e Reconciliação
        // Conciliação de categorias mutuamente exclusivas e rastreabilidade individual por linha:
        // Cada linha física do arquivo lida DEVE possuir exatamente um registro principal persistido em import_batch_records.
        // Categorias primárias de cada linha:
        // - Associada (associated_records): Imóvel validado e vinculado (property_id IS NOT NULL)
        // - Pendente de revisão (pending_review_records): Ambiguidade cadastral retida sem associação arbitrária (property_id IS NULL)
        // - Rejeitada (rejected_records): Dados cadastrais ausentes ou inválidos (property_id IS NULL)
        // Equação de Reconciliação Cadastral:
        // total_rows_read == total_persisted_records == (associated_records + pending_review_records + rejected_records)
        // Apontamentos de auditoria (audit_findings) são mantidos em tabela separada e JAMAIS somados às linhas.
        let (total_persisted, associated_records, pending_review_records, rejected_records): (usize, usize, usize, usize) = conn.query_row(
            "SELECT 
                COUNT(*),
                COALESCE(SUM(CASE WHEN processing_status IN ('NORMALIZED', 'CONFLICT_FLAGGED') THEN 1 ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN processing_status = 'AMBIGUOUS_PENDING_REVIEW' THEN 1 ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN processing_status = 'REJECTED' THEN 1 ELSE 0 END), 0)
             FROM import_batch_records
             WHERE batch_id = ?1",
            params![batch_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
        ).map_err(|e| format!("Falha ao conciliar registros do lote #{}: {}", batch_id, e))?;

        let total_audit_findings: usize = conn.query_row(
            "SELECT COUNT(*) FROM audit_findings WHERE batch_record_id IN (SELECT id FROM import_batch_records WHERE batch_id = ?1)",
            params![batch_id],
            |r| r.get(0),
        ).unwrap_or(total_inconsistencies);

        let is_technically_complete = (mode == "FULL"
            && total_rows_read == expected_data_rows
            && total_persisted == expected_data_rows)
            || (mode == "PILOT" && total_persisted == total_rows_read);
        let all_rows_persisted = total_persisted == total_rows_read;

        let final_status = if mode == "PILOT" {
            if is_technically_complete && all_rows_persisted {
                "PILOT_COMPLETED"
            } else {
                "PARTIAL"
            }
        } else if !is_technically_complete || !all_rows_persisted {
            "PARTIAL"
        } else if rejected_records > 0 {
            "COMPLETED_WITH_REJECTIONS"
        } else if pending_review_records > 0 || total_audit_findings > 0 {
            "COMPLETED_WITH_WARNINGS"
        } else {
            "COMPLETED"
        };
        let completed_at = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        let reconciliation_meta = serde_json::json!({
            "source_filename": filename,
            "source_hash_sha256": file_hash,
            "import_mode": mode,
            "requested_row_limit": row_limit,
            "physical_excel_rows": total_physical_rows,
            "expected_data_rows": expected_data_rows,
            "total_rows_read": total_rows_read,
            "total_records_imported": associated_records,
            "associated_records": associated_records,
            "pending_review_records": pending_review_records,
            "rejected_records": rejected_records,
            "total_persisted_records": total_persisted,
            "total_audit_findings": total_audit_findings,
            "technical_completion": is_technically_complete,
            "reconciled": is_technically_complete && all_rows_persisted
        })
        .to_string();

        {
            let tx = conn.transaction().map_err(|e| e.to_string())?;
            tx.execute(
                "UPDATE import_batches
                 SET status = ?1, completed_at = ?2, total_rows_read = ?3, total_records_imported = ?4, total_inconsistencies_detected = ?5, metadata_json = ?6
                 WHERE id = ?7",
                params![final_status, completed_at, total_rows_read as i64, associated_records as i64, total_audit_findings as i64, reconciliation_meta, batch_id],
            ).map_err(|e| e.to_string())?;

            // Registra evento na trilha imutável
            tx.execute(
                "INSERT INTO audit_events (event_type, entity_type, entity_id, details_json, performed_by)
                 VALUES ('IMPORT_BATCH_COMPLETED', 'IMPORT_BATCH', ?1, ?2, 'DEVOS_COCKPIT_IMPORTER')",
                params![batch_id.to_string(), reconciliation_meta],
            ).map_err(|e| e.to_string())?;

            tx.commit().map_err(|e| e.to_string())?;
        }

        Ok(ImportExecutionReport {
            batch_id,
            file_hash_sha256: file_hash,
            import_mode: mode.to_string(),
            status: final_status.to_string(),
            total_rows_read,
            total_records_imported: associated_records,
            total_inconsistencies_detected: total_audit_findings,
            message: format!(
                "Importação ({}) finalizada no lote #{} com status {}. {} associados, {} pendentes de revisão, {} rejeitados (total linhas: {}). {} apontamentos de auditoria registrados.",
                mode,
                batch_id,
                final_status,
                associated_records,
                pending_review_records,
                rejected_records,
                total_rows_read,
                total_audit_findings
            ),
            started_at,
            completed_at,
        })
    }
}

/// Extrai um componente rotulado do texto de endereço original (ex: "Qd: 10", "Lt: 05")
pub(crate) fn extract_address_token(raw_addr: &str, token_prefix: &str) -> Option<String> {
    for part in raw_addr.split('|') {
        let trimmed = part.trim();
        if let Some(val) = trimmed.strip_prefix(token_prefix) {
            let clean = normalize_number_string(val);
            if !clean.is_empty() {
                return Some(clean);
            }
        }
    }
    None
}

/// Estrutura para resolução de identidade multi-candidato
#[derive(Debug, Clone)]
pub(crate) struct CandidateProperty {
    pub(crate) id: i64,
    pub(crate) street: Option<String>,
    pub(crate) neighborhood: Option<String>,
    pub(crate) number: Option<String>,
    pub(crate) quadra: Option<String>,
    pub(crate) lote: Option<String>,
}

impl CandidateProperty {
    /// Avalia se o endereço do candidato é compatível com os dados da linha.
    ///
    /// ### LIMITES DE CONFIANÇA DA ASSOCIAÇÃO POR ENDEREÇO INCOMPLETO:
    /// 1. A correspondência de endereço incompleto (sem número, quadra ou lote) NUNCA é utilizada
    ///    isoladamente como prova de identidade imobiliária.
    /// 2. Ela atua exclusivamente como critério conservador de confirmação simétrica quando:
    ///    a) O identificador de origem (matrícula declarada) coincide;
    ///    b) Existe exatamente 1 candidato cadastrado para essa matrícula (`matching_candidates.len() == 1`);
    ///    c) Ambos os lados possuem logradouro e bairro idênticos e ambos carecem de discriminadores (simetria estrita);
    ///    d) Não há qualquer divergência observável em nenhum campo discriminador.
    /// 3. Diante de múltiplos candidatos (`len > 1`), a linha é obrigatoriamente retida em
    ///    `AMBIGUOUS_PENDING_REVIEW` com `property_id = NULL`, impedindo fusões ou escolhas arbitrárias.
    /// 4. Se a nova linha trouxer qualquer discriminador ausente no candidato (ou vice-versa),
    ///    a assimetria impede a presunção de igualdade e força isolamento cadastral.
    pub(crate) fn matches_address(
        &self,
        row_street: &str,
        row_bairro: &str,
        row_number: &str,
        row_quadra: &str,
        row_lote: &str,
    ) -> bool {
        let cand_street = self.street.as_deref().unwrap_or("").trim();
        let cand_bairro = self.neighborhood.as_deref().unwrap_or("").trim();
        let cand_num = self.number.as_deref().unwrap_or("").trim();
        let cand_qd = self.quadra.as_deref().unwrap_or("").trim();
        let cand_lt = self.lote.as_deref().unwrap_or("").trim();

        let cur_street = row_street.trim();
        let cur_bairro = row_bairro.trim();
        let cur_num = row_number.trim();
        let cur_qd = row_quadra.trim();
        let cur_lt = row_lote.trim();

        // 1. Evidência fundamental: logradouro e bairro obrigatórios em ambos os lados
        if cand_street.is_empty()
            || cand_bairro.is_empty()
            || cur_street.is_empty()
            || cur_bairro.is_empty()
        {
            return false;
        }

        if !cand_street.eq_ignore_ascii_case(cur_street)
            || !cand_bairro.eq_ignore_ascii_case(cur_bairro)
        {
            return false;
        }

        // 2. Conflito observável em campos discriminadores:
        if !cand_num.is_empty() && !cur_num.is_empty() && !cand_num.eq_ignore_ascii_case(cur_num) {
            return false;
        }
        if !cand_qd.is_empty() && !cur_qd.is_empty() && !cand_qd.eq_ignore_ascii_case(cur_qd) {
            return false;
        }
        if !cand_lt.is_empty() && !cur_lt.is_empty() && !cand_lt.eq_ignore_ascii_case(cur_lt) {
            return false;
        }

        // 3. Ausência de evidência discriminadora (assimetria entre os lados):
        // Se um lado possui um discriminador (número, quadra ou lote) e o outro lado não possui,
        // a ausência de um campo NÃO pode ser interpretada como prova de igualdade.
        if cand_num.is_empty() != cur_num.is_empty() {
            return false;
        }
        if cand_qd.is_empty() != cur_qd.is_empty() {
            return false;
        }
        if cand_lt.is_empty() != cur_lt.is_empty() {
            return false;
        }

        true
    }
}

impl RealEstateImporter {
    /// Persiste um bloco de linhas de forma atômica e com integridade referencial estrita.
    /// Distingue rigorosamente repetições consistentes (mantendo UUID estável) de repetições conflitantes
    /// (isolando a entidade e gerando apontamento de auditoria sem fusão automática indevida).
    /// Atualiza `last_processed_row` e os contadores DENTRO da mesma transação SQL para garantir recuperação atômica.
    pub(crate) fn persist_chunk(
        conn: &mut rusqlite::Connection,
        batch_id: i64,
        sheet_name: &str,
        chunk: &[(
            usize,
            serde_json::Map<String, serde_json::Value>,
            String,
            String,
        )],
        seen_matriculas: &mut std::collections::HashSet<String>,
        total_rows_read_so_far: usize,
        total_records_imported_so_far: usize,
        total_inconsistencies_so_far: usize,
        last_chunk_row: usize,
    ) -> Result<(usize, usize), String> {
        let tx = conn
            .transaction()
            .map_err(|e| format!("Falha ao iniciar transação: {}", e))?;

        let mut imported = 0;
        let mut inconsistencies = 0;
        let now_ts = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        for (row_num, row_map, raw_json, line_hash) in chunk {
            // 1. Extração e normalização dos campos
            let raw_matricula = row_map
                .get("Matrícula")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let clean_matricula = normalize_number_string(raw_matricula);

            let raw_nome = row_map.get("Nome").and_then(|v| v.as_str()).unwrap_or("");
            let clean_nome = clean_whitespace(raw_nome);

            let raw_bairro = row_map.get("Bairro").and_then(|v| v.as_str()).unwrap_or("");
            let clean_bairro = clean_whitespace(raw_bairro);

            let raw_rua = row_map.get("Rua").and_then(|v| v.as_str()).unwrap_or("");
            let clean_rua = clean_whitespace(raw_rua);

            let raw_quadra = row_map.get("Quadra").and_then(|v| v.as_str()).unwrap_or("");
            let clean_quadra = normalize_number_string(raw_quadra);

            let raw_lote = row_map.get("Lote").and_then(|v| v.as_str()).unwrap_or("");
            let clean_lote = normalize_number_string(raw_lote);

            let raw_numero = row_map.get("Numero").and_then(|v| v.as_str()).unwrap_or("");
            let (clean_num, note_opt) = parse_address_and_number(raw_numero);

            let raw_complemento = row_map
                .get("Complemento")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let clean_comp = clean_whitespace(raw_complemento);

            let assembled_raw_addr = format!(
                "Rua: {} | Num: {} | Bairro: {} | Qd: {} | Lt: {} | Comp: {}",
                raw_rua, raw_numero, raw_bairro, raw_quadra, raw_lote, raw_complemento
            );
            let norm_hash = sha256_digest(
                format!(
                    "{}-{}-{}-{}-{}",
                    clean_rua, clean_num, clean_bairro, clean_quadra, clean_lote
                )
                .as_bytes(),
            );

            let mut final_complement = clean_comp;
            if let Some(note) = note_opt {
                if !final_complement.is_empty() {
                    final_complement = format!("{} (Nota: {})", final_complement, note);
                } else {
                    final_complement = format!("Nota: {}", note);
                }
            }

            // 2. Verificação de Rejeição Cadastral (dados obrigatórios ausentes ou linha corrompida)
            let is_rejected = row_map
                .get("_reject")
                .and_then(|v| v.as_bool())
                .unwrap_or(false)
                || row_map
                    .get("Status")
                    .and_then(|v| v.as_str())
                    .map(|s| s.eq_ignore_ascii_case("REJECTED"))
                    .unwrap_or(false)
                || row_map
                    .get("Rejeitado")
                    .and_then(|v| v.as_str())
                    .map(|s| s.eq_ignore_ascii_case("SIM") || s == "1")
                    .unwrap_or(false)
                || (clean_matricula.is_empty()
                    && clean_rua.is_empty()
                    && clean_bairro.is_empty()
                    && clean_nome.is_empty());

            if is_rejected {
                inconsistencies += 1;
                tx.execute(
                    "INSERT INTO import_batch_records (batch_id, sheet_name, row_number, raw_content_json, line_hash_sha256, processing_status, property_id, created_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, 'REJECTED', NULL, ?6)",
                    params![batch_id, sheet_name, *row_num as i64, raw_json, line_hash, now_ts],
                ).map_err(|e| format!("Falha ao inserir import_batch_records rejeitado na linha {}: {}", row_num, e))?;
                let record_id = tx.last_insert_rowid();

                tx.execute(
                    "INSERT INTO audit_findings (property_id, batch_record_id, category, severity, source, description, analysis_status, created_at)
                     VALUES (NULL, ?1, 'ROW_REJECTED', 'HIGH', 'IMPORTER_V1', ?2, 'OPEN', ?3)",
                    params![
                        record_id,
                        format!("Linha {} rejeitada por dados cadastrais ausentes ou inválidos.", row_num),
                        now_ts
                    ],
                ).map_err(|e| e.to_string())?;

                imported += 1;
                continue;
            }

            // 3. Resolução de Identidade: Repetição Consistente vs. Repetição Conflitante (Multi-candidato)
            let mut is_existing_property = false;
            let mut is_conflicting = false;
            let mut is_ambiguous = false;
            let mut conflict_reason = String::new();
            let mut ambiguous_count = 0;

            let property_id_opt: Option<i64> = if !clean_matricula.is_empty() {
                // Consulta TODOS os imóveis previamente cadastrados para essa matrícula de origem
                let mut check_stmt = tx.prepare_cached(
                    "SELECT p.id, a.street, a.neighborhood, a.number, a.raw_address
                     FROM property_identifiers pi
                     JOIN properties p ON p.id = pi.property_id
                     LEFT JOIN property_address_links pal ON pal.property_id = p.id AND pal.is_primary = 1
                     LEFT JOIN addresses a ON a.id = pal.address_id
                     WHERE pi.issuer_or_source = 'PLANILHA_MAPA5_ENDERECO' AND pi.normalized_value = ?1"
                ).map_err(|e| e.to_string())?;

                let all_candidates: Vec<CandidateProperty> = check_stmt
                    .query_map([&clean_matricula], |r| {
                        let raw_addr: Option<String> = r.get(4)?;
                        let quadra = raw_addr
                            .as_deref()
                            .and_then(|raw| extract_address_token(raw, "Qd:"));
                        let lote = raw_addr
                            .as_deref()
                            .and_then(|raw| extract_address_token(raw, "Lt:"));
                        Ok(CandidateProperty {
                            id: r.get(0)?,
                            street: r.get(1)?,
                            neighborhood: r.get(2)?,
                            number: r.get(3)?,
                            quadra,
                            lote,
                        })
                    })
                    .map_err(|e| e.to_string())?
                    .filter_map(|res| res.ok())
                    .collect();

                let matching_candidates: Vec<&CandidateProperty> = all_candidates
                    .iter()
                    .filter(|c| {
                        c.matches_address(
                            &clean_rua,
                            &clean_bairro,
                            &clean_num,
                            &clean_quadra,
                            &clean_lote,
                        )
                    })
                    .collect();

                if matching_candidates.len() == 1 {
                    // Repetição Consistente: exatamente 1 candidato compatível -> reutiliza UUID estável
                    is_existing_property = true;
                    Some(matching_candidates[0].id)
                } else if matching_candidates.len() > 1 {
                    // Ambiguidade Cadastral: mais de um candidato possui o mesmo endereço e matrícula.
                    // REGRA DE SEGURANÇA: NÃO escolher arbitrariamente nenhum deles! NÃO fundir entidades!
                    // A associação de property_id é retida pendente de análise humana (NULL).
                    is_ambiguous = true;
                    ambiguous_count = matching_candidates.len();
                    None
                } else if !all_candidates.is_empty() {
                    // Repetição Conflitante: há candidatos com esta matrícula, mas NENHUM corresponde comprovadamente ao endereço
                    is_conflicting = true;
                    let existing_summary: Vec<String> = all_candidates
                        .iter()
                        .map(|c| {
                            format!(
                                "Imóvel #{}: '{}/{}'",
                                c.id,
                                c.street.as_deref().unwrap_or(""),
                                c.neighborhood.as_deref().unwrap_or("")
                            )
                        })
                        .collect();
                    conflict_reason = format!(
                        "Divergência cadastral com {} candidato(s) existente(s) (Existentes: [{}]; Linha {}: '{}/{}')",
                        all_candidates.len(),
                        existing_summary.join(", "),
                        row_num,
                        clean_rua,
                        clean_bairro
                    );

                    let property_uuid = Uuid::new_v4().to_string();
                    tx.execute(
                        "INSERT INTO properties (uuid, created_at, updated_at) VALUES (?1, ?2, ?2)",
                        params![property_uuid, now_ts],
                    )
                    .map_err(|e| {
                        format!(
                            "Falha ao criar imóvel em conflito na linha {}: {}",
                            row_num, e
                        )
                    })?;
                    Some(tx.last_insert_rowid())
                } else {
                    // Imóvel inédito para esta matrícula
                    let property_uuid = Uuid::new_v4().to_string();
                    tx.execute(
                        "INSERT INTO properties (uuid, created_at, updated_at) VALUES (?1, ?2, ?2)",
                        params![property_uuid, now_ts],
                    )
                    .map_err(|e| format!("Falha ao criar imóvel na linha {}: {}", row_num, e))?;
                    Some(tx.last_insert_rowid())
                }
            } else {
                // Linha sem valor de matrícula: rastreabilidade por proveniência exata da linha física.
                // REGRA DE SEGURANÇA: Duas linhas físicas distintas com o mesmo conteúdo textual (ex: duas unidades sem matrícula
                // no mesmo logradouro) NÃO devem ser fundidas apenas pela igualdade de hash de linha!
                // O reprocessamento idempotente só reutiliza o imóvel se coincidir:
                // 1. Mesmo hash de arquivo de origem (source_hash_sha256)
                // 2. Mesma aba da planilha (sheet_name)
                // 3. Mesma linha física (row_number)
                // 4. Mesmo hash de conteúdo (line_hash_sha256)
                let existing_for_origin: Option<i64> = {
                    let mut origin_stmt = tx
                        .prepare_cached(
                            "SELECT ibr.property_id 
                             FROM import_batch_records ibr
                             JOIN import_batches ib ON ib.id = ibr.batch_id
                             WHERE ib.source_hash_sha256 = (SELECT source_hash_sha256 FROM import_batches WHERE id = ?1)
                               AND ibr.sheet_name = ?2 
                               AND ibr.row_number = ?3 
                               AND ibr.line_hash_sha256 = ?4 
                               AND ibr.property_id IS NOT NULL 
                             ORDER BY ibr.id DESC LIMIT 1",
                        )
                        .map_err(|e| e.to_string())?;

                    origin_stmt
                        .query_row(
                            params![batch_id, sheet_name, *row_num as i64, line_hash],
                            |r| r.get(0),
                        )
                        .optional()
                        .map_err(|e| e.to_string())?
                };

                if let Some(pid) = existing_for_origin {
                    is_existing_property = true;
                    Some(pid)
                } else {
                    let property_uuid = Uuid::new_v4().to_string();
                    tx.execute(
                        "INSERT INTO properties (uuid, created_at, updated_at) VALUES (?1, ?2, ?2)",
                        params![property_uuid, now_ts],
                    )
                    .map_err(|e| {
                        format!(
                            "Falha ao criar imóvel sem matrícula na linha {}: {}",
                            row_num, e
                        )
                    })?;
                    Some(tx.last_insert_rowid())
                }
            };

            // 3. Salva registro bruto de proveniência com status apropriado
            let record_status = if is_ambiguous {
                "AMBIGUOUS_PENDING_REVIEW"
            } else if is_conflicting {
                "CONFLICT_FLAGGED"
            } else {
                "NORMALIZED"
            };

            tx.execute(
                "INSERT INTO import_batch_records (batch_id, sheet_name, row_number, raw_content_json, line_hash_sha256, processing_status, property_id, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![batch_id, sheet_name, *row_num as i64, raw_json, line_hash, record_status, property_id_opt, now_ts],
            ).map_err(|e| format!("Falha ao inserir import_batch_records na linha {}: {}", row_num, e))?;
            let record_id = tx.last_insert_rowid();

            // 4. Registros de Auditoria e Associações
            if is_ambiguous {
                inconsistencies += 1;
                tx.execute(
                    "INSERT INTO audit_findings (property_id, batch_record_id, category, severity, source, description, analysis_status, created_at)
                     VALUES (NULL, ?1, 'AMBIGUOUS_IDENTIFIER_MATCH', 'HIGH', 'IMPORTER_V1', ?2, 'OPEN', ?3)",
                    params![
                        record_id,
                        format!("Matrícula '{}' coincide com múltiplos ({}) imóveis distintos previamente cadastrados para o mesmo endereço na Linha {}. Associação retida pendente de análise cadastral.", clean_matricula, ambiguous_count, row_num),
                        now_ts
                    ],
                ).map_err(|e| e.to_string())?;
            }

            if let Some(property_id) = property_id_opt {
                if is_conflicting {
                    inconsistencies += 1;
                    tx.execute(
                        "INSERT INTO audit_findings (property_id, batch_record_id, category, severity, source, description, analysis_status, created_at)
                         VALUES (?1, ?2, 'CONFLICTING_IDENTIFIER_DATA', 'HIGH', 'IMPORTER_V1', ?3, 'OPEN', ?4)",
                        params![
                            property_id,
                            record_id,
                            format!("Identificador de matrícula '{}' repetido na linha {} com dados incompatíveis. {}. Fusão automática prevenida.", clean_matricula, row_num, conflict_reason),
                            now_ts
                        ],
                    ).map_err(|e| e.to_string())?;

                    tx.execute(
                        "INSERT INTO property_identifiers (property_id, identifier_type, raw_value, normalized_value, issuer_or_source, verification_status, created_at)
                         VALUES (?1, 'UNCLASSIFIED_MATRICULA_CONFLICTING', ?2, ?3, 'PLANILHA_MAPA5_ENDERECO', 'CONFLICT_FLAGGED', ?4)",
                        params![property_id, raw_matricula, clean_matricula, now_ts],
                    ).map_err(|e| e.to_string())?;
                } else if !clean_matricula.is_empty() {
                    if !is_existing_property {
                        tx.execute(
                            "INSERT INTO property_identifiers (property_id, identifier_type, raw_value, normalized_value, issuer_or_source, verification_status, created_at)
                             VALUES (?1, 'UNCLASSIFIED_MATRICULA', ?2, ?3, 'PLANILHA_MAPA5_ENDERECO', 'UNVERIFIED', ?4)",
                            params![property_id, raw_matricula, clean_matricula, now_ts],
                        ).map_err(|e| format!("Falha ao associar identificador na linha {}: {}", row_num, e))?;
                    }

                    // Auditoria de repetição interna da matrícula dentro do arquivo
                    if !seen_matriculas.insert(clean_matricula.clone()) {
                        inconsistencies += 1;
                        tx.execute(
                            "INSERT INTO audit_findings (property_id, batch_record_id, category, severity, source, description, analysis_status, created_at)
                             VALUES (?1, ?2, 'DUPLICATE_IDENTIFIER_IN_BATCH', 'WARNING', 'IMPORTER_V1', ?3, 'OPEN', ?4)",
                            params![
                                property_id,
                                record_id,
                                format!("Identificador de matrícula repetido no arquivo: '{}' (Linha {})", clean_matricula, row_num),
                                now_ts
                            ],
                        ).map_err(|e| e.to_string())?;
                    }
                } else {
                    inconsistencies += 1;
                    tx.execute(
                        "INSERT INTO audit_findings (property_id, batch_record_id, category, severity, source, description, analysis_status, created_at)
                         VALUES (?1, ?2, 'MISSING_IDENTIFIER', 'WARNING', 'IMPORTER_V1', ?3, 'OPEN', ?4)",
                        params![
                            property_id,
                            record_id,
                            format!("Registro cadastral sem valor de matrícula na Linha {}", row_num),
                            now_ts
                        ],
                    ).map_err(|e| e.to_string())?;
                }

                // Registra Titular declarado se presente na planilha e ainda não associado
                if !clean_nome.is_empty() {
                    let has_titular: bool = {
                        let mut titular_stmt = tx
                        .prepare_cached(
                            "SELECT 1 FROM property_identifiers 
                         WHERE property_id = ?1 AND identifier_type = 'TITULAR_DECLARADO' AND normalized_value = ?2
                         LIMIT 1",
                        )
                        .map_err(|e| e.to_string())?;
                        titular_stmt
                            .exists(params![property_id, clean_nome])
                            .map_err(|e| e.to_string())?
                    };

                    if !has_titular {
                        tx.execute(
                        "INSERT INTO property_identifiers (property_id, identifier_type, raw_value, normalized_value, issuer_or_source, verification_status, created_at)
                         VALUES (?1, 'TITULAR_DECLARADO', ?2, ?3, 'PLANILHA_MAPA5_ENDERECO', 'UNVERIFIED', ?4)",
                        params![property_id, raw_nome, clean_nome, now_ts],
                    ).map_err(|e| format!("Falha ao salvar titular declarado na linha {}: {}", row_num, e))?;
                    }
                }

                // 5. Normalização de Endereço e Associação
                let has_addr_link: bool = {
                    let mut addr_check = tx
                        .prepare_cached(
                            "SELECT 1 FROM property_address_links pal
                     JOIN addresses a ON a.id = pal.address_id
                     WHERE pal.property_id = ?1 AND a.normalized_hash = ?2
                     LIMIT 1",
                        )
                        .map_err(|e| e.to_string())?;
                    addr_check
                        .exists(params![property_id, norm_hash])
                        .map_err(|e| e.to_string())?
                };

                if !has_addr_link {
                    tx.execute(
                    "INSERT INTO addresses (raw_address, street, number, complement, neighborhood, city, state, postal_code, normalized_hash, created_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, 'Maricá', 'RJ', '24900-000', ?6, ?7)",
                    params![assembled_raw_addr, clean_rua, clean_num, final_complement, clean_bairro, norm_hash, now_ts],
                ).map_err(|e| format!("Falha ao salvar endereço na linha {}: {}", row_num, e))?;
                    let address_id = tx.last_insert_rowid();

                    let is_first_link: bool = {
                        let mut count_stmt = tx
                        .prepare_cached(
                            "SELECT COUNT(*) FROM property_address_links WHERE property_id = ?1",
                        )
                        .map_err(|e| e.to_string())?;
                        let cnt: i64 = count_stmt
                            .query_row([property_id], |r| r.get(0))
                            .map_err(|e| e.to_string())?;
                        cnt == 0
                    };

                    tx.execute(
                    "INSERT INTO property_address_links (property_id, address_id, is_primary, effective_from, created_at)
                     VALUES (?1, ?2, ?3, ?4, ?4)",
                    params![property_id, address_id, if is_first_link { 1 } else { 0 }, now_ts],
                ).map_err(|e| e.to_string())?;
                }

                if clean_rua.is_empty() && clean_bairro.is_empty() {
                    inconsistencies += 1;
                    tx.execute(
                        "INSERT INTO audit_findings (property_id, batch_record_id, category, severity, source, description, analysis_status, created_at)
                         VALUES (?1, ?2, 'INCOMPLETE_ADDRESS', 'INFO', 'IMPORTER_V1', ?3, 'OPEN', ?4)",
                        params![
                            property_id,
                            record_id,
                            format!("Endereço cadastral sem rua e bairro preenchidos na Linha {}", row_num),
                            now_ts
                        ],
                    ).map_err(|e| e.to_string())?;
                }
            }

            imported += 1;
        }

        // 7. Atualização ATÔMICA de progresso do lote DENTRO da mesma transação SQL
        let current_total_imported = total_records_imported_so_far + imported;
        let current_total_inconsistencies = total_inconsistencies_so_far + inconsistencies;

        tx.execute(
            "UPDATE import_batches 
             SET total_rows_read = ?1, total_records_imported = ?2, total_inconsistencies_detected = ?3, last_processed_row = ?4, status = 'IN_PROGRESS'
             WHERE id = ?5",
            params![
                total_rows_read_so_far as i64,
                current_total_imported as i64,
                current_total_inconsistencies as i64,
                last_chunk_row as i64,
                batch_id
            ],
        ).map_err(|e| format!("Falha ao atualizar progresso atômico do lote: {}", e))?;

        tx.commit()
            .map_err(|e| format!("Falha ao comitar bloco transacional: {}", e))?;
        Ok((imported, inconsistencies))
    }
}
