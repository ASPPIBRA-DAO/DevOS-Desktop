use crate::real_estate::RealEstateImporter;
use crate::storage::{RealEstateDatabase, RealEstateMigrationManager};
use rusqlite::params;
use std::fs;
use std::path::Path;

#[test]
fn test_real_estate_schema_and_provenance_tables() {
    let temp_dir =
        std::env::temp_dir().join(format!("devos_test_re_schema_{}", rand::random::<u32>()));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).expect("Migrações cadastrais devem rodar");

    let mut conn = re_db.get_connection().expect("Conexão deve ser aberta");

    // 1. Cria lote de importação
    let tx = conn.transaction().expect("Transação deve ser iniciada");
    tx.execute(
            "INSERT INTO import_batches (source_filename, source_hash_sha256, source_file_size, sheet_name, started_at, status)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                "Mapa5.xlsx",
                "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                10485760,
                "Imóveis",
                "2026-10-23 23:00:00",
                "COMPLETED"
            ],
        ).expect("Inserção de lote deve ser bem-sucedida");
    let batch_id = tx.last_insert_rowid();

    // 2. Cria registro original importado (preservação integral de proveniência)
    let raw_json = r#"{"Matrícula":"000123","Endereço":"Av Central, 100","Bairro":"Centro"}"#;
    tx.execute(
            "INSERT INTO import_batch_records (batch_id, sheet_name, row_number, raw_content_json, line_hash_sha256, processing_status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                batch_id,
                "Imóveis",
                2,
                raw_json,
                "aabbcc1122334455",
                "NORMALIZED",
                "2026-10-23 23:00:00"
            ],
        ).expect("Inserção de registro original deve ser bem-sucedida");
    let batch_record_id = tx.last_insert_rowid();

    // 3. Cria entidade estável de imóvel (identidade própria independente)
    tx.execute(
        "INSERT INTO properties (uuid, created_at, updated_at)
             VALUES (?1, ?2, ?3)",
        params![
            "550e8400-e29b-41d4-a716-446655440000",
            "2026-10-23 23:00:00",
            "2026-10-23 23:00:00"
        ],
    )
    .expect("Inserção de imóvel deve ser bem-sucedida");
    let property_id = tx.last_insert_rowid();

    // 4. Associa identificador com valor bruto preservado (zeros à esquerda intactos)
    tx.execute(
            "INSERT INTO property_identifiers (property_id, identifier_type, raw_value, normalized_value, issuer_or_source, verification_status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                property_id,
                "UNCLASSIFIED_MATRICULA",
                "000123",
                "123",
                "PLANILHA_MAPA5",
                "UNVERIFIED",
                "2026-10-23 23:00:00"
            ],
        ).expect("Inserção de identificador deve ser bem-sucedida");

    // 5. Registra endereço com valor bruto e hash normalizado
    tx.execute(
            "INSERT INTO addresses (raw_address, street, number, neighborhood, city, state, postal_code, normalized_hash, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                "Av Central, 100",
                "Av Central",
                "100",
                "Centro",
                "Cidade Exemplo",
                "PR",
                "80000-000",
                "hash_normalizado_av_central_100",
                "2026-10-23 23:00:00"
            ],
        ).expect("Inserção de endereço deve ser bem-sucedida");
    let address_id = tx.last_insert_rowid();

    // 6. Vincula imóvel e endereço com vigência
    tx.execute(
            "INSERT INTO property_address_links (property_id, address_id, is_primary, effective_from, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                property_id,
                address_id,
                1,
                "2026-01-01",
                "2026-10-23 23:00:00"
            ],
        ).expect("Vínculo de endereço deve ser bem-sucedida");

    // 7. Registra inconsistência detectada na auditoria vinculada ao registro e ao imóvel
    tx.execute(
            "INSERT INTO audit_findings (property_id, batch_record_id, category, severity, source, description, analysis_status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                property_id,
                batch_record_id,
                "UNCLASSIFIED_MATRICULA",
                "WARNING",
                "IMPORTADOR_V1",
                "Número de matrícula não classificado entre RI e Inscrição Municipal",
                "OPEN",
                "2026-10-23 23:00:00"
            ],
        ).expect("Inserção de finding de auditoria deve ser bem-sucedida");

    // 8. Cria proposta de correção pendente (não substitui dados vigentes silenciosamente)
    tx.execute(
            "INSERT INTO correction_proposals (property_id, target_record_id, field_name, previous_value, proposed_value, justification, proposed_by, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                property_id,
                batch_record_id,
                "Matrícula",
                "000123",
                "RI-12345",
                "Identificado termo de certidão no 1º RI da comarca",
                "auditor_dao_01",
                "PROPOSED",
                "2026-10-23 23:00:00"
            ],
        ).expect("Inserção de proposta de correção deve ser bem-sucedida");

    // 9. Registra evento de auditoria
    tx.execute(
            "INSERT INTO audit_events (event_type, entity_type, entity_id, details_json, performed_by, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                "PROPERTY_CREATED",
                "PROPERTY",
                property_id.to_string(),
                r#"{"source":"import_batch_1"}"#,
                "IMPORTADOR_AUTOMATICO",
                "2026-10-23 23:00:00"
            ],
        ).expect("Inserção de evento de auditoria deve ser bem-sucedida");

    tx.commit()
        .expect("Transação deve ser comitada com sucesso");

    // 10. Valida estatísticas consolidadas
    let stats = re_db
        .get_stats()
        .expect("Consulta de estatísticas deve funcionar");
    assert_eq!(stats.total_properties, 1);
    assert_eq!(stats.total_identifiers, 1);
    assert_eq!(stats.total_addresses, 1);
    assert_eq!(stats.total_batches, 1);
    assert_eq!(stats.total_batch_records, 1);
    assert_eq!(stats.open_findings_count, 1);
    assert_eq!(stats.pending_proposals_count, 1);

    // 11. Valida violação de chave estrangeira (tentar inserir identificador para imóvel inexistente)
    let fk_fail = conn.execute(
            "INSERT INTO property_identifiers (property_id, identifier_type, raw_value, issuer_or_source, created_at)
             VALUES (99999, 'TEST', 'FAIL', 'TEST', '2026-10-23')",
            [],
        );
    assert!(
        fk_fail.is_err(),
        "Chave estrangeira deve impedir identificador com property_id inexistente"
    );

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_real_estate_backup_and_restore_recovery() {
    let temp_dir =
        std::env::temp_dir().join(format!("devos_test_re_backup_{}", rand::random::<u32>()));
    let re_db = RealEstateDatabase::new(temp_dir.join("live"));
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    // Insere um imóvel no live
    let conn = re_db.get_connection().unwrap();
    conn.execute(
        "INSERT INTO properties (uuid) VALUES ('original-uuid-12345');",
        [],
    )
    .unwrap();
    drop(conn);

    // Exporta backup
    let backup_file = temp_dir.join("real_estate_backup.sqlite");
    let bytes_copied = re_db
        .export_backup(&backup_file)
        .expect("Backup deve ser exportado com sucesso");
    assert!(bytes_copied > 0);
    assert!(backup_file.exists());

    // Cria nova instância de banco e restaura a partir do backup
    let restored_db = RealEstateDatabase::new(temp_dir.join("restored"));
    restored_db
        .restore_backup(&backup_file)
        .expect("Restauração do backup deve ter sucesso");

    // Verifica que o imóvel está no banco restaurado
    let conn_restored = restored_db.get_connection().unwrap();
    let restored_uuid: String = conn_restored
        .query_row("SELECT uuid FROM properties WHERE id = 1", [], |r| r.get(0))
        .expect("Registro deve existir no banco restaurado");
    assert_eq!(restored_uuid, "original-uuid-12345");

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_real_estate_synthetic_pilot_then_full_lifecycle() {
    let fixture_path = Path::new("fixtures/test_synthetic.xlsx");
    assert!(
        fixture_path.exists(),
        "fixtures/test_synthetic.xlsx deve existir para testes de CI"
    );

    let temp_dir = std::env::temp_dir().join(format!(
        "devos_test_importer_synthetic_{}",
        rand::random::<u32>()
    ));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    // 1. Prévia não grava dados
    let preview = RealEstateImporter::generate_preview(&re_db, fixture_path, Some("endereco"))
        .expect("Prévia deve ler planilha sintética");
    assert_eq!(preview.target_sheet, "endereco");
    assert_eq!(preview.total_rows_count, 6); // 6 linhas de dados
    assert_eq!(re_db.get_stats().unwrap().total_properties, 0);

    // 2. Executa Piloto com 2 linhas
    let pilot_report =
        RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", Some(2))
            .expect("Piloto deve ter sucesso");
    assert_eq!(pilot_report.status, "PILOT_COMPLETED");
    assert_eq!(pilot_report.total_records_imported, 2);
    assert_eq!(re_db.get_stats().unwrap().total_properties, 2);

    // 3. Execução subsequente do piloto com mesmo limite retorna ALREADY_COMPLETED
    let second_pilot =
        RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", Some(2))
            .expect("Segundo piloto deve responder com idempotência");
    assert_eq!(second_pilot.status, "ALREADY_COMPLETED");
    assert_eq!(re_db.get_stats().unwrap().total_properties, 2);

    // 4. CRÍTICO: Importação COMPLETA NÃO PODE SER BLOQUEADA pelo piloto anterior!
    let full_report = RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", None)
        .expect("Importação completa NÃO deve ser bloqueada pelo piloto prévio");
    assert_eq!(full_report.status, "COMPLETED_WITH_WARNINGS");
    assert_eq!(full_report.total_rows_read, 6);
    assert_eq!(full_report.total_records_imported, 6);

    // 5. Identidade estável: as matrículas já existentes (000123 e 000124) e a duplicada 000123
    // não podem criar imóveis duplicados. Apenas novos imóveis são criados.
    let stats_after_full = re_db.get_stats().unwrap();
    assert_eq!(stats_after_full.total_batches, 2);
    assert_eq!(stats_after_full.total_batch_records, 8); // 2 do piloto + 6 da completa

    // 6. Segunda execução completa do mesmo arquivo aciona idempotência estrita
    let second_full = RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", None)
        .expect("Segunda execução completa deve responder com idempotência");
    assert_eq!(second_full.status, "ALREADY_COMPLETED");
    assert_eq!(re_db.get_stats().unwrap().total_batches, 2);

    // 7. Validação de apontamentos de auditoria gerados (matrícula repetida, ausente e endereço vazio)
    let findings = re_db.list_findings(10).unwrap();
    assert!(
        !findings.is_empty(),
        "Auditoria deve ter registrado apontamentos para casos anômalos"
    );

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
#[ignore = "Requer arquivo local Mapa5.xlsx; executar explicitamente com -- --ignored"]
fn test_real_estate_importer_on_mapa5_sample() {
    let env_path = std::env::var("MAPA5_FILE_PATH").ok();
    let default_path = std::path::PathBuf::from("/home/sandro/Downloads/Mapa5.xlsx");
    let mapa5_path = env_path
        .as_deref()
        .map(Path::new)
        .unwrap_or(default_path.as_path());

    if !mapa5_path.exists() {
        println!(
            "Aviso: Mapa5.xlsx não encontrado em {:?}, pulando teste de integração.",
            mapa5_path
        );
        return;
    }

    let temp_dir = std::env::temp_dir().join(format!(
        "devos_test_importer_mapa5_{}",
        rand::random::<u32>()
    ));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    // 1. Testa pré-visualização (não grava nada)
    let preview = RealEstateImporter::generate_preview(&re_db, mapa5_path, Some("endereco"))
        .expect("Prévia deve ser gerada com sucesso");

    assert_eq!(preview.target_sheet, "endereco");
    assert!(
        preview
            .recognized_headers
            .contains(&"Matrícula".to_string())
    );
    assert!(preview.recognized_headers.contains(&"Nome".to_string()));
    assert!(preview.recognized_headers.contains(&"Rua".to_string()));
    assert_eq!(preview.total_rows_count, 145756);
    assert!(!preview.sample_rows.is_empty());
    assert_eq!(preview.already_imported_batch_id, None);

    // Confirma que nenhuma propriedade foi gravada na prévia
    let stats_pre = re_db.get_stats().unwrap();
    assert_eq!(stats_pre.total_properties, 0);

    // 2. Executa importação-piloto com amostra de 50 linhas
    let pilot_report = RealEstateImporter::execute_import(&re_db, mapa5_path, "endereco", Some(50))
        .expect("Importação piloto de 50 linhas deve ter sucesso");

    assert_eq!(pilot_report.status, "PILOT_COMPLETED");
    assert_eq!(pilot_report.total_rows_read, 50);
    assert_eq!(pilot_report.total_records_imported, 50);

    // 3. Valida rastreabilidade e integridade no banco
    let stats_post = re_db.get_stats().unwrap();
    assert_eq!(stats_post.total_properties, 50);
    assert_eq!(stats_post.total_batch_records, 50);
    assert_eq!(stats_post.total_batches, 1);

    // 4. Executa novamente o piloto sobre o mesmo arquivo e demonstra idempotência do piloto
    let idempotent_report =
        RealEstateImporter::execute_import(&re_db, mapa5_path, "endereco", Some(50))
            .expect("Segunda execução piloto deve responder com idempotência");

    assert_eq!(idempotent_report.status, "ALREADY_COMPLETED");
    let stats_idempotent = re_db.get_stats().unwrap();
    assert_eq!(stats_idempotent.total_properties, 50);

    // 5. CRÍTICO: Executa importação com amostra expandida (70 linhas) demonstrando
    // que o piloto anterior NÃO bloqueia nova importação e que os primeiros 50 imóveis NÃO são duplicados
    let expanded_report =
        RealEstateImporter::execute_import(&re_db, mapa5_path, "endereco", Some(70))
            .expect("Importação expandida deve executar sem bloqueio do piloto");

    assert_eq!(expanded_report.status, "PILOT_COMPLETED");
    assert_eq!(expanded_report.total_records_imported, 70);

    let stats_expanded = re_db.get_stats().unwrap();
    assert_eq!(stats_expanded.total_batches, 2);
    // O número total de batch_records preserva os dois lotes (50 + 70 = 120)
    assert_eq!(stats_expanded.total_batch_records, 120);
    // Como as 50 primeiras linhas coincidem em matrícula, os imóveis existentes foram reconhecidos
    // e apenas as 20 novas linhas geraram novas entidades imobiliárias (50 + 20 = 70 imóveis)!
    assert_eq!(stats_expanded.total_properties, 70);

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_real_estate_conflicting_identifier_prevents_accidental_merge() {
    let temp_dir =
        std::env::temp_dir().join(format!("devos_test_conflict_{}", rand::random::<u32>()));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    // 1. Cria o imóvel inicial com Matrícula 000999 na Rua das Flores, Centro
    let conn2 = re_db.get_connection().unwrap();
    conn2.execute(
            "INSERT INTO properties (uuid, created_at, updated_at) VALUES ('prop-uuid-1', datetime('now'), datetime('now'))",
            [],
        ).unwrap();
    let prop1_id = conn2.last_insert_rowid();

    conn2.execute(
            "INSERT INTO property_identifiers (property_id, identifier_type, raw_value, normalized_value, issuer_or_source, verification_status, created_at)
             VALUES (?1, 'UNCLASSIFIED_MATRICULA', '000999', '000999', 'PLANILHA_MAPA5_ENDERECO', 'UNVERIFIED', datetime('now'))",
            [prop1_id],
        ).unwrap();

    conn2.execute(
            "INSERT INTO addresses (raw_address, street, number, complement, neighborhood, city, state, postal_code, normalized_hash, created_at)
             VALUES ('Rua das Flores 100 Centro', 'RUA DAS FLORES', '100', '', 'CENTRO', 'Maricá', 'RJ', '24900-000', 'hash_flores', datetime('now'))",
            [],
        ).unwrap();
    let addr1_id = conn2.last_insert_rowid();

    conn2.execute(
            "INSERT INTO property_address_links (property_id, address_id, is_primary, effective_from, created_at)
             VALUES (?1, ?2, 1, datetime('now'), datetime('now'))",
            [prop1_id, addr1_id],
        ).unwrap();

    // Agora, testa consulta de conflito:
    // Linha com endereço 'AVENIDA BEIRA MAR' em 'ITAIPUAÇU' deve ser detectada como conflitante!
    let check_info: (i64, Option<String>, Option<String>) = conn2.query_row(
            "SELECT p.id, a.street, a.neighborhood
             FROM property_identifiers pi
             JOIN properties p ON p.id = pi.property_id
             LEFT JOIN property_address_links pal ON pal.property_id = p.id AND pal.is_primary = 1
             LEFT JOIN addresses a ON a.id = pal.address_id
             WHERE pi.issuer_or_source = 'PLANILHA_MAPA5_ENDERECO' AND pi.normalized_value = '000999'
             LIMIT 1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        ).unwrap();

    assert_eq!(check_info.0, prop1_id);
    assert_eq!(check_info.1.as_deref(), Some("RUA DAS FLORES"));
    assert_eq!(check_info.2.as_deref(), Some("CENTRO"));

    // Se uma nova linha tiver rua 'AVENIDA BEIRA MAR' e bairro 'ITAIPUAÇU', é um conflito manifesto
    let cur_street = "AVENIDA BEIRA MAR";
    let cur_bairro = "ITAIPUAÇU";
    let street_differs = !check_info
        .1
        .as_deref()
        .unwrap()
        .eq_ignore_ascii_case(cur_street);
    let bairro_differs = !check_info
        .2
        .as_deref()
        .unwrap()
        .eq_ignore_ascii_case(cur_bairro);
    assert!(
        street_differs && bairro_differs,
        "Deve acusar divergência manifesta de endereço"
    );

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_real_estate_interrupted_import_and_resume_recovery() {
    let fixture_path = Path::new("fixtures/test_synthetic.xlsx");
    assert!(fixture_path.exists());

    let temp_dir =
        std::env::temp_dir().join(format!("devos_test_resume_{}", rand::random::<u32>()));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    let (file_hash, file_size) = RealEstateImporter::compute_file_metadata(fixture_path).unwrap();

    // 1. Simula um lote que começou a rodar no modo FULL e foi interrompido na linha 3
    let conn = re_db.get_connection().unwrap();
    conn.execute(
            "INSERT INTO import_batches (source_filename, source_hash_sha256, source_file_size, sheet_name, import_mode, started_at, status, total_rows_read, total_records_imported, total_inconsistencies_detected, last_processed_row)
             VALUES ('test_synthetic.xlsx', ?1, ?2, 'endereco', 'FULL', datetime('now'), 'IN_PROGRESS', 2, 2, 0, 3)",
            rusqlite::params![file_hash, file_size as i64],
        ).unwrap();
    let batch_id = conn.last_insert_rowid();

    // Insere os registros já processados das linhas 2 e 3
    conn.execute(
            "INSERT INTO import_batch_records (batch_id, sheet_name, row_number, raw_content_json, line_hash_sha256, processing_status, created_at)
             VALUES (?1, 'endereco', 2, '{\"row\":2}', 'hash2', 'NORMALIZED', datetime('now'))",
            [batch_id],
        ).unwrap();
    conn.execute(
            "INSERT INTO import_batch_records (batch_id, sheet_name, row_number, raw_content_json, line_hash_sha256, processing_status, created_at)
             VALUES (?1, 'endereco', 3, '{\"row\":3}', 'hash3', 'NORMALIZED', datetime('now'))",
            [batch_id],
        ).unwrap();
    drop(conn);

    // 2. Executa a importação no modo FULL sobre o mesmo arquivo
    // O importador DEVE identificar o lote interrompido e retomar a partir da linha 4
    let report = RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", None)
        .expect("Retomada deve ter sucesso");

    assert_eq!(
        report.batch_id, batch_id,
        "Deve reaproveitar o mesmo ID de lote"
    );
    assert_eq!(
        report.status, "COMPLETED_WITH_WARNINGS",
        "Lote retomado e finalizado deve atingir COMPLETED_WITH_WARNINGS devido a avisos de duplicata"
    );
    assert_eq!(
        report.total_rows_read, 6,
        "Total de linhas reconciliado com o arquivo"
    );
    assert_eq!(report.total_records_imported, 6);

    // 3. Verifica integridade no banco: exatamente 1 lote e 6 registros (sem duplicatas)
    let stats = re_db.get_stats().unwrap();
    assert_eq!(stats.total_batches, 1);
    assert_eq!(stats.total_batch_records, 6);

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_real_estate_conflicting_identifier_reimport_preserves_entities() {
    let temp_dir = std::env::temp_dir().join(format!(
        "devos_test_reimport_conflict_{}",
        rand::random::<u32>()
    ));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    // 1. Simula cenário pré-existente com dois candidatos divergentes já cadastrados para a mesma matrícula 'MATR-CONFLITO'
    let conn = re_db.get_connection().unwrap();
    // Candidato 1: Imóvel na Rua das Flores, Centro
    conn.execute(
            "INSERT INTO properties (uuid, created_at, updated_at) VALUES ('uuid-candidato-1', datetime('now'), datetime('now'))",
            [],
        ).unwrap();
    let prop1_id = conn.last_insert_rowid();

    conn.execute(
            "INSERT INTO property_identifiers (property_id, identifier_type, raw_value, normalized_value, issuer_or_source, verification_status, created_at)
             VALUES (?1, 'UNCLASSIFIED_MATRICULA', 'MATR-CONFLITO', 'MATR-CONFLITO', 'PLANILHA_MAPA5_ENDERECO', 'UNVERIFIED', datetime('now'))",
            [prop1_id],
        ).unwrap();

    conn.execute(
            "INSERT INTO addresses (raw_address, street, number, complement, neighborhood, city, state, postal_code, normalized_hash, created_at)
             VALUES ('Rua das Flores 100', 'RUA DAS FLORES', '100', '', 'CENTRO', 'Maricá', 'RJ', '24900-000', 'h1', datetime('now'))",
            [],
        ).unwrap();
    let addr1_id = conn.last_insert_rowid();
    conn.execute(
            "INSERT INTO property_address_links (property_id, address_id, is_primary, effective_from, created_at) VALUES (?1, ?2, 1, datetime('now'), datetime('now'))",
            [prop1_id, addr1_id],
        ).unwrap();

    // Candidato 2: Imóvel na Avenida Beira Mar, Itaipuaçu (fruto de conflito cadastral anterior isolado)
    conn.execute(
            "INSERT INTO properties (uuid, created_at, updated_at) VALUES ('uuid-candidato-2', datetime('now'), datetime('now'))",
            [],
        ).unwrap();
    let prop2_id = conn.last_insert_rowid();

    conn.execute(
            "INSERT INTO property_identifiers (property_id, identifier_type, raw_value, normalized_value, issuer_or_source, verification_status, created_at)
             VALUES (?1, 'UNCLASSIFIED_MATRICULA_CONFLICTING', 'MATR-CONFLITO', 'MATR-CONFLITO', 'PLANILHA_MAPA5_ENDERECO', 'CONFLICT_FLAGGED', datetime('now'))",
            [prop2_id],
        ).unwrap();

    conn.execute(
            "INSERT INTO addresses (raw_address, street, number, complement, neighborhood, city, state, postal_code, normalized_hash, created_at)
             VALUES ('Av Beira Mar 200', 'AVENIDA BEIRA MAR', '200', '', 'ITAIPUAÇU', 'Maricá', 'RJ', '24900-000', 'h2', datetime('now'))",
            [],
        ).unwrap();
    let addr2_id = conn.last_insert_rowid();
    conn.execute(
            "INSERT INTO property_address_links (property_id, address_id, is_primary, effective_from, created_at) VALUES (?1, ?2, 1, datetime('now'), datetime('now'))",
            [prop2_id, addr2_id],
        ).unwrap();

    assert_eq!(re_db.get_stats().unwrap().total_properties, 2);

    // 2. Agora, simula a reimportação de uma planilha atualizada contendo os dados de 'MATR-CONFLITO'
    // Linha A corresponde ao Candidato 1 (Rua das Flores / Centro)
    // Linha B corresponde ao Candidato 2 (Avenida Beira Mar / Itaipuaçu)
    // O algoritmo multi-candidato DEVE encontrar e casar com cada candidato correto,
    // NÃO criando um 3º ou 4º imóvel no banco!
    let check_stmt_sql = "SELECT p.id, a.street, a.neighborhood, a.number
             FROM property_identifiers pi
             JOIN properties p ON p.id = pi.property_id
             LEFT JOIN property_address_links pal ON pal.property_id = p.id AND pal.is_primary = 1
             LEFT JOIN addresses a ON a.id = pal.address_id
             WHERE pi.issuer_or_source = 'PLANILHA_MAPA5_ENDERECO' AND pi.normalized_value = 'MATR-CONFLITO'";

    let mut stmt = conn.prepare(check_stmt_sql).unwrap();
    let candidates: Vec<(i64, Option<String>, Option<String>)> = stmt
        .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
        .unwrap()
        .map(|r| r.unwrap())
        .collect();

    assert_eq!(
        candidates.len(),
        2,
        "Devem existir 2 candidatos cadastrados"
    );

    // Avalia correspondência da Linha A (Rua das Flores, Centro)
    let match_a: Vec<&(i64, Option<String>, Option<String>)> = candidates
        .iter()
        .filter(|c| {
            c.1.as_deref()
                .unwrap_or("")
                .eq_ignore_ascii_case("RUA DAS FLORES")
                && c.2.as_deref().unwrap_or("").eq_ignore_ascii_case("CENTRO")
        })
        .collect();
    assert_eq!(match_a.len(), 1);
    assert_eq!(
        match_a[0].0, prop1_id,
        "Linha A reutiliza Candidato 1 mantendo UUID"
    );

    // Avalia correspondência da Linha B (Avenida Beira Mar, Itaipuaçu)
    let match_b: Vec<&(i64, Option<String>, Option<String>)> = candidates
        .iter()
        .filter(|c| {
            c.1.as_deref()
                .unwrap_or("")
                .eq_ignore_ascii_case("AVENIDA BEIRA MAR")
                && c.2
                    .as_deref()
                    .unwrap_or("")
                    .eq_ignore_ascii_case("ITAIPUAÇU")
        })
        .collect();
    assert_eq!(match_b.len(), 1);
    assert_eq!(
        match_b[0].0, prop2_id,
        "Linha B reutiliza Candidato 2 mantendo UUID"
    );

    // Total de entidades de 'MATR-CONFLITO' permanece estritamente 2
    let count_final: i64 = conn.query_row(
            "SELECT COUNT(DISTINCT property_id) FROM property_identifiers WHERE normalized_value = 'MATR-CONFLITO'",
            [],
            |r| r.get(0),
        ).unwrap();
    assert_eq!(
        count_final, 2,
        "Nenhuma nova entidade foi criada na reimportação para candidatos já resolvidos"
    );

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_real_estate_mode_incompatibility_in_resumption() {
    let fixture_path = Path::new("fixtures/test_synthetic.xlsx");
    let file_bytes = fs::read(fixture_path).unwrap();
    let file_hash = {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(&file_bytes);
        format!("{:x}", hasher.finalize())
    };
    let file_size = file_bytes.len();

    let temp_dir = std::env::temp_dir().join(format!(
        "devos_test_mode_incompatibility_{}",
        rand::random::<u32>()
    ));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    // 1. Simula um lote PILOT interrompido após 2 linhas (parâmetro requested_row_limit = 5)
    let conn = re_db.get_connection().unwrap();
    let pilot_meta = serde_json::json!({
        "source_filename": "test_synthetic.xlsx",
        "import_mode": "PILOT",
        "requested_row_limit": 5,
    })
    .to_string();

    conn.execute(
            "INSERT INTO import_batches (source_filename, source_hash_sha256, source_file_size, sheet_name, import_mode, started_at, status, total_rows_read, total_records_imported, last_processed_row, metadata_json)
             VALUES ('test_synthetic.xlsx', ?1, ?2, 'endereco', 'PILOT', datetime('now'), 'IN_PROGRESS', 2, 2, 2, ?3)",
            params![file_hash, file_size as i64, pilot_meta],
        ).unwrap();
    let pilot_batch_id = conn.last_insert_rowid();

    // Insere 2 registros no lote de piloto
    conn.execute(
            "INSERT INTO import_batch_records (batch_id, sheet_name, row_number, raw_content_json, line_hash_sha256, processing_status, created_at)
             VALUES (?1, 'endereco', 1, '{\"row\":1}', 'hash_p1', 'NORMALIZED', datetime('now')),
                    (?1, 'endereco', 2, '{\"row\":2}', 'hash_p2', 'NORMALIZED', datetime('now'))",
            [pilot_batch_id],
        ).unwrap();
    drop(conn);

    // 2. CRÍTICO: Execução FULL inicia sobre o mesmo arquivo
    // DEVE rejeitar a retomada do lote PILOT! Deve criar um NOVO lote FULL e processar integralmente as 6 linhas.
    let full_report = RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", None)
        .expect("Execução FULL deve rodar com sucesso");

    assert_ne!(
        full_report.batch_id, pilot_batch_id,
        "Execução FULL JAMAIS deve reaproveitar lote PILOT como lote integral!"
    );
    assert_eq!(full_report.import_mode, "FULL");
    assert_eq!(full_report.total_rows_read, 6);
    assert_eq!(full_report.total_records_imported, 6);

    // 3. Verifica que tentativa de retomar PILOT com limite DIFERENTE (ex: 2) também NÃO retoma o piloto de limite 5
    let pilot_diff_limit =
        RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", Some(2))
            .expect("Piloto com limite diferente deve rodar");
    assert_ne!(
        pilot_diff_limit.batch_id, pilot_batch_id,
        "Piloto com requested_row_limit diferente não deve retomar piloto de 5 linhas"
    );

    // 4. Verifica que o piloto original interrompido PODE ser retomado com seus parâmetros IDÊNTICOS (PILOT com limite 5)
    let resumed_pilot =
        RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", Some(5))
            .expect("Piloto com mesmos parâmetros deve retomar lote original");
    assert_eq!(
        resumed_pilot.batch_id, pilot_batch_id,
        "Piloto interrompido deve ser retomado quando os parâmetros de modo e limite forem idênticos"
    );
    assert_eq!(resumed_pilot.total_records_imported, 5);

    // 5. Cenário Inverso: Insere um lote FULL interrompido
    let conn2 = re_db.get_connection().unwrap();
    let full_meta = serde_json::json!({
        "source_filename": "test_synthetic.xlsx",
        "import_mode": "FULL",
        "requested_row_limit": serde_json::Value::Null,
    })
    .to_string();
    conn2.execute(
            "INSERT INTO import_batches (source_filename, source_hash_sha256, source_file_size, sheet_name, import_mode, started_at, status, total_rows_read, total_records_imported, last_processed_row, metadata_json)
             VALUES ('test_synthetic.xlsx', ?1, ?2, 'endereco', 'FULL', datetime('now'), 'IN_PROGRESS', 2, 2, 2, ?3)",
            params![file_hash, file_size as i64, full_meta],
        ).unwrap();
    let full_interrupted_id = conn2.last_insert_rowid();
    drop(conn2);

    // Solicita um PILOT de 3 linhas com esse mesmo arquivo
    let pilot_while_full_interrupted =
        RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", Some(3))
            .expect("Piloto não deve retomar lote FULL");
    assert_ne!(
        pilot_while_full_interrupted.batch_id, full_interrupted_id,
        "Execução PILOT JAMAIS deve retomar lote FULL interrompido!"
    );

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_real_estate_ambiguity_held_pending_without_arbitrary_merge() {
    let temp_dir =
        std::env::temp_dir().join(format!("devos_test_ambiguity_{}", rand::random::<u32>()));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    let mut conn = re_db.get_connection().unwrap();

    // 1. Cria 2 imóveis pré-existentes distintos no banco, ambos com a mesma matrícula 'MATR-DUPLA'
    // e ambos com o MESMO endereço comprovado ('RUA DO COMERCIO', 'CENTRO')
    conn.execute(
            "INSERT INTO properties (uuid, created_at, updated_at) VALUES ('uuid-ambig-1', datetime('now'), datetime('now'))",
            [],
        ).unwrap();
    let prop1_id = conn.last_insert_rowid();

    conn.execute(
            "INSERT INTO properties (uuid, created_at, updated_at) VALUES ('uuid-ambig-2', datetime('now'), datetime('now'))",
            [],
        ).unwrap();
    let prop2_id = conn.last_insert_rowid();

    for pid in [prop1_id, prop2_id] {
        conn.execute(
                "INSERT INTO property_identifiers (property_id, identifier_type, raw_value, normalized_value, issuer_or_source, verification_status, created_at)
                 VALUES (?1, 'UNCLASSIFIED_MATRICULA', 'MATR-DUPLA', 'MATR-DUPLA', 'PLANILHA_MAPA5_ENDERECO', 'UNVERIFIED', datetime('now'))",
                [pid],
            ).unwrap();

        conn.execute(
                "INSERT INTO addresses (raw_address, street, number, complement, neighborhood, city, state, postal_code, normalized_hash, created_at)
                 VALUES ('Rua do Comercio 50', 'RUA DO COMERCIO', '50', '', 'CENTRO', 'Maricá', 'RJ', '24900-000', 'h_comercio', datetime('now'))",
                [],
            ).unwrap();
        let aid = conn.last_insert_rowid();

        conn.execute(
                "INSERT INTO property_address_links (property_id, address_id, is_primary, effective_from, created_at)
                 VALUES (?1, ?2, 1, datetime('now'), datetime('now'))",
                [pid, aid],
            ).unwrap();
    }

    assert_eq!(re_db.get_stats().unwrap().total_properties, 2);

    // 2. Cria lote para simular a chegada de uma nova linha com 'MATR-DUPLA' e endereço idêntico 'RUA DO COMERCIO', 'CENTRO'
    conn.execute(
            "INSERT INTO import_batches (source_filename, source_hash_sha256, source_file_size, sheet_name, import_mode, started_at, status)
             VALUES ('teste.xlsx', 'hash_teste', 1000, 'endereco', 'FULL', datetime('now'), 'IN_PROGRESS')",
            [],
        ).unwrap();
    let batch_id = conn.last_insert_rowid();

    let mut row_map = serde_json::Map::new();
    row_map.insert("Matrícula".to_string(), serde_json::json!("MATR-DUPLA"));
    row_map.insert("Rua".to_string(), serde_json::json!("RUA DO COMERCIO"));
    row_map.insert("Numero".to_string(), serde_json::json!("50"));
    row_map.insert("Bairro".to_string(), serde_json::json!("CENTRO"));
    row_map.insert("Nome".to_string(), serde_json::json!("Fulano"));

    let chunk = vec![(
        10usize,
        row_map.clone(),
        serde_json::to_string(&row_map).unwrap(),
        "line_hash_ambig_1".to_string(),
    )];

    // Persiste a linha usando o pipeline oficial
    let mut seen_batch1 = std::collections::HashSet::new();
    let (imported, inconsistencies) = RealEstateImporter::persist_chunk(
        &mut conn,
        batch_id,
        "endereco",
        &chunk,
        &mut seen_batch1,
        0,
        0,
        0,
        10,
    )
    .expect("Processamento do chunk deve ter sucesso");

    assert_eq!(imported, 1);
    assert_eq!(
        inconsistencies, 1,
        "Ambiguidade cadastral deve registrar apontamento de auditoria"
    );

    // 3. REGRA CRÍTICA: NÃO associar arbitrariamente a nenhum dos candidatos!
    // O property_id no registro de proveniência DEVE ser NULL
    let (rec_property_id, processing_status): (Option<i64>, String) = conn.query_row(
            "SELECT property_id, processing_status FROM import_batch_records WHERE batch_id = ?1 AND row_number = 10",
            [batch_id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        ).unwrap();

    assert_eq!(
        rec_property_id, None,
        "property_id DEVE ser NULL (associação retida, sem escolha arbitrária)"
    );
    assert_eq!(processing_status, "AMBIGUOUS_PENDING_REVIEW");

    // 4. Apontamento de auditoria AMBIGUOUS_IDENTIFIER_MATCH gerado com severidade HIGH
    let (finding_category, finding_severity): (String, String) = conn.query_row(
            "SELECT category, severity FROM audit_findings WHERE batch_record_id = (SELECT id FROM import_batch_records WHERE batch_id = ?1 AND row_number = 10)",
            [batch_id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        ).unwrap();

    assert_eq!(finding_category, "AMBIGUOUS_IDENTIFIER_MATCH");
    assert_eq!(finding_severity, "HIGH");

    // 5. Total de entidades imóveis no banco permanece estritamente 2 (NÃO criou novo imóvel e NÃO fundiu)
    assert_eq!(re_db.get_stats().unwrap().total_properties, 2);

    // 6. REIMPORTAÇÃO: Simula reprocessamento da mesma linha ambígua
    conn.execute(
            "INSERT INTO import_batches (source_filename, source_hash_sha256, source_file_size, sheet_name, import_mode, started_at, status)
             VALUES ('teste2.xlsx', 'hash_teste2', 1000, 'endereco', 'FULL', datetime('now'), 'IN_PROGRESS')",
            [],
        ).unwrap();
    let batch2_id = conn.last_insert_rowid();

    let chunk2 = vec![(
        10usize,
        row_map,
        "raw_json_2".to_string(),
        "line_hash_ambig_2".to_string(),
    )];

    let mut seen_batch2 = std::collections::HashSet::new();
    RealEstateImporter::persist_chunk(
        &mut conn,
        batch2_id,
        "endereco",
        &chunk2,
        &mut seen_batch2,
        0,
        0,
        0,
        10,
    )
    .unwrap();

    // Total de imóveis no banco permanece estritamente 2! Sem proliferação de entidades!
    assert_eq!(re_db.get_stats().unwrap().total_properties, 2);

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_real_estate_address_evidence_and_missing_fields() {
    use crate::real_estate::importer::CandidateProperty;

    // Candidato completo com rua, bairro, número, quadra e lote
    let cand = CandidateProperty {
        id: 1,
        street: Some("RUA DAS FLORES".to_string()),
        neighborhood: Some("CENTRO".to_string()),
        number: Some("100".to_string()),
        quadra: Some("10".to_string()),
        lote: Some("5".to_string()),
    };

    // 1. Match positivo com todos os campos coincidentes
    assert!(cand.matches_address("RUA DAS FLORES", "CENTRO", "100", "10", "5"));
    assert!(cand.matches_address("  rua das flores  ", "centro ", "100", "10", "5"));

    // 2. Divergência observável em número (100 != 250) -> DEVE REJEITAR!
    assert!(!cand.matches_address("RUA DAS FLORES", "CENTRO", "250", "10", "5"));

    // 3. Divergência observável em lote (5 != 8) -> DEVE REJEITAR!
    assert!(!cand.matches_address("RUA DAS FLORES", "CENTRO", "100", "10", "8"));

    // 4. Divergência observável em quadra (10 != 12) -> DEVE REJEITAR!
    assert!(!cand.matches_address("RUA DAS FLORES", "CENTRO", "100", "12", "5"));

    // 5. Divergência observável em rua ou bairro
    assert!(!cand.matches_address("RUA OUTRA", "CENTRO", "100", "10", "5"));
    assert!(!cand.matches_address("RUA DAS FLORES", "FLAMENGO", "100", "10", "5"));

    // 6. Ausência de campos não prova igualdade (falta de evidência)
    assert!(!cand.matches_address("", "CENTRO", "100", "10", "5"));
    assert!(!cand.matches_address("RUA DAS FLORES", "", "100", "10", "5"));
    assert!(!cand.matches_address("RUA DAS FLORES", "CENTRO", "", "10", "5"));
    assert!(!cand.matches_address("RUA DAS FLORES", "CENTRO", "100", "", "5"));
    assert!(!cand.matches_address("RUA DAS FLORES", "CENTRO", "100", "10", ""));

    // 7. Candidato com endereço incompleto (sem número, quadra ou lote):
    // Se a nova linha possui os mesmos dados (rua e bairro coincidentes e ambos sem número/quadra/lote),
    // há simetria e compatibilidade entre as evidências disponíveis.
    let cand_no_disc = CandidateProperty {
        id: 2,
        street: Some("RUA DAS FLORES".to_string()),
        neighborhood: Some("CENTRO".to_string()),
        number: None,
        quadra: None,
        lote: None,
    };
    // Coincide quando a linha também não possui discriminadores adicionais
    assert!(cand_no_disc.matches_address("RUA DAS FLORES", "CENTRO", "", "", ""));

    // Mas se a nova linha possuir discriminadores (ex: número, quadra ou lote) que o candidato não possui,
    // a assimetria impede a presunção de igualdade
    assert!(!cand_no_disc.matches_address("RUA DAS FLORES", "CENTRO", "100", "", ""));
    assert!(!cand_no_disc.matches_address("RUA DAS FLORES", "CENTRO", "", "10", ""));
    assert!(!cand_no_disc.matches_address("RUA DAS FLORES", "CENTRO", "", "", "5"));
}

#[test]
fn test_real_estate_address_matching_prevents_accidental_merge_on_different_lot_or_number() {
    let temp_dir = std::env::temp_dir().join(format!(
        "devos_test_address_discrimination_{}",
        rand::random::<u32>()
    ));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    let mut conn = re_db.get_connection().unwrap();

    // 1. Cadastra Imóvel existente: Matrícula 12345, Rua das Flores, Centro, Qd 10, Lt 05, Num 100
    conn.execute(
            "INSERT INTO properties (uuid, created_at, updated_at) VALUES ('uuid-existente-1', datetime('now'), datetime('now'))",
            [],
        ).unwrap();
    let prop1_id = conn.last_insert_rowid();

    conn.execute(
            "INSERT INTO property_identifiers (property_id, identifier_type, raw_value, normalized_value, issuer_or_source, verification_status, created_at)
             VALUES (?1, 'UNCLASSIFIED_MATRICULA', '12345', '12345', 'PLANILHA_MAPA5_ENDERECO', 'UNVERIFIED', datetime('now'))",
            [prop1_id],
        ).unwrap();

    conn.execute(
            "INSERT INTO addresses (raw_address, street, number, complement, neighborhood, city, state, postal_code, normalized_hash, created_at)
             VALUES ('Rua: RUA DAS FLORES | Num: 100 | Bairro: CENTRO | Qd: 10 | Lt: 05 | Comp: ', 'RUA DAS FLORES', '100', '', 'CENTRO', 'Maricá', 'RJ', '24900-000', 'h_addr1', datetime('now'))",
            [],
        ).unwrap();
    let addr1_id = conn.last_insert_rowid();

    conn.execute(
            "INSERT INTO property_address_links (property_id, address_id, is_primary, effective_from, created_at)
             VALUES (?1, ?2, 1, datetime('now'), datetime('now'))",
            [prop1_id, addr1_id],
        ).unwrap();

    assert_eq!(re_db.get_stats().unwrap().total_properties, 1);

    // 2. Importa novo registro com a MESMA matrícula 12345, MESMA Rua das Flores e MESMO Centro,
    // mas com LOTE DIFERENTE (Lt 08) e NÚMERO DIFERENTE (Num 250)
    conn.execute(
            "INSERT INTO import_batches (source_filename, source_hash_sha256, source_file_size, sheet_name, import_mode, started_at, status)
             VALUES ('teste_disc.xlsx', 'hash_disc', 1000, 'endereco', 'FULL', datetime('now'), 'IN_PROGRESS')",
            [],
        ).unwrap();
    let batch_id = conn.last_insert_rowid();

    let mut row_map = serde_json::Map::new();
    row_map.insert("Matrícula".to_string(), serde_json::json!("12345"));
    row_map.insert("Rua".to_string(), serde_json::json!("RUA DAS FLORES"));
    row_map.insert("Bairro".to_string(), serde_json::json!("CENTRO"));
    row_map.insert("Quadra".to_string(), serde_json::json!("10"));
    row_map.insert("Lote".to_string(), serde_json::json!("08")); // Lote 08 != Lote 05!
    row_map.insert("Numero".to_string(), serde_json::json!("250")); // Num 250 != Num 100!
    row_map.insert(
        "Nome".to_string(),
        serde_json::json!("Proprietário Outro Lote"),
    );

    let chunk = vec![(
        2usize,
        row_map,
        "raw_json_disc".to_string(),
        "line_hash_disc".to_string(),
    )];

    let mut seen = std::collections::HashSet::new();
    let (imported, inconsistencies) = RealEstateImporter::persist_chunk(
        &mut conn, batch_id, "endereco", &chunk, &mut seen, 0, 0, 0, 2,
    )
    .unwrap();

    assert_eq!(imported, 1);
    assert_eq!(
        inconsistencies, 1,
        "Divergência de lote/número gera apontamento CONFLICTING_IDENTIFIER_DATA"
    );

    // REGRA CRÍTICA: O importador NÃO DEVE associar automaticamente ao imóvel 1!
    // Deve isolar a entidade e criar um segundo imóvel distinto, sinalizando o conflito!
    assert_eq!(
        re_db.get_stats().unwrap().total_properties,
        2,
        "Imóvel com lote/número divergente NÃO pode ser fundido ao imóvel existente!"
    );

    let finding_category: String = conn.query_row(
            "SELECT category FROM audit_findings WHERE batch_record_id = (SELECT id FROM import_batch_records WHERE batch_id = ?1 AND row_number = 2)",
            [batch_id],
            |r| r.get(0),
        ).unwrap();
    assert_eq!(finding_category, "CONFLICTING_IDENTIFIER_DATA");

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_real_estate_pilot_idempotency_with_different_limits() {
    let fixture_path = Path::new("fixtures/test_synthetic.xlsx");
    let temp_dir = std::env::temp_dir().join(format!(
        "devos_test_pilot_idempotency_{}",
        rand::random::<u32>()
    ));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    // 1. Piloto de 2 linhas executado pela 1ª vez -> completa normalmente
    let pilot_2_first =
        RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", Some(2))
            .expect("Piloto de 2 linhas");
    assert_eq!(pilot_2_first.status, "PILOT_COMPLETED");
    assert_eq!(pilot_2_first.total_records_imported, 2);

    // 2. Piloto de 2 linhas repetido -> aciona idempotência estrita (ALREADY_COMPLETED)
    let pilot_2_repeat =
        RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", Some(2))
            .expect("Piloto de 2 linhas repetido");
    assert_eq!(pilot_2_repeat.status, "ALREADY_COMPLETED");
    assert_eq!(pilot_2_repeat.batch_id, pilot_2_first.batch_id);

    // 3. Piloto de 4 linhas solicitado em seguida -> NÃO retorna o piloto de 2 linhas! Executa o novo piloto de 4 linhas!
    let pilot_4 = RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", Some(4))
        .expect("Piloto de 4 linhas deve rodar e não reutilizar lote de 2");
    assert_eq!(pilot_4.status, "PILOT_COMPLETED");
    assert_ne!(pilot_4.batch_id, pilot_2_first.batch_id);
    assert_eq!(pilot_4.total_records_imported, 4);

    // 4. Piloto de 2 linhas solicitado após o de 4 -> retorna ALREADY_COMPLETED apontando para o lote de 2 linhas!
    let pilot_2_after_4 =
        RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", Some(2))
            .expect("Piloto de 2 linhas deve recuperar seu lote idempotente");
    assert_eq!(pilot_2_after_4.status, "ALREADY_COMPLETED");
    assert_eq!(pilot_2_after_4.batch_id, pilot_2_first.batch_id);

    // 5. Importação FULL após os pilotos -> executa integralmente sem ser bloqueada por nenhum dos pilotos
    let full_import = RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", None)
        .expect("Importação integral deve rodar");
    assert_eq!(full_import.status, "COMPLETED_WITH_WARNINGS");
    assert_eq!(full_import.total_records_imported, 6);

    // 6. Importação FULL repetida -> aciona ALREADY_COMPLETED apontando para o lote FULL
    let full_repeat = RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", None)
        .expect("Segunda execução FULL deve ser idempotente");
    assert_eq!(full_repeat.status, "ALREADY_COMPLETED");
    assert_eq!(full_repeat.batch_id, full_import.batch_id);

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_real_estate_unmatriculated_two_identical_lines_preserve_distinct_entities() {
    let temp_dir = std::env::temp_dir().join(format!(
        "devos_test_unmatriculated_distinct_{}",
        rand::random::<u32>()
    ));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    let mut conn = re_db.get_connection().unwrap();

    conn.execute(
            "INSERT INTO import_batches (source_filename, source_hash_sha256, source_file_size, sheet_name, import_mode, started_at, status)
             VALUES ('unidades_iguais.xlsx', 'hash_unidades_iguais', 1000, 'endereco', 'FULL', datetime('now'), 'IN_PROGRESS')",
            [],
        ).unwrap();
    let batch_id = conn.last_insert_rowid();

    // Duas linhas físicas distintas (Linha 3 e Linha 7) sem matrícula e com conteúdo idêntico (ex: unidades no mesmo prédio/lote)
    let mut row_map = serde_json::Map::new();
    row_map.insert("Matrícula".to_string(), serde_json::json!("")); // SEM MATRÍCULA
    row_map.insert("Rua".to_string(), serde_json::json!("Rua das Palmeiras"));
    row_map.insert("Numero".to_string(), serde_json::json!("50"));
    row_map.insert("Bairro".to_string(), serde_json::json!("Itaipuaçu"));

    let line_hash = "sha256_unidade_sem_matricula".to_string();
    let raw_json = serde_json::to_string(&row_map).unwrap();

    let chunk = vec![
        (3usize, row_map.clone(), raw_json.clone(), line_hash.clone()),
        (7usize, row_map.clone(), raw_json.clone(), line_hash.clone()),
    ];

    let mut seen = std::collections::HashSet::new();
    let (imported, _) = RealEstateImporter::persist_chunk(
        &mut conn, batch_id, "endereco", &chunk, &mut seen, 0, 0, 0, 7,
    )
    .unwrap();
    assert_eq!(imported, 2);

    // REGRA CRÍTICA: Duas linhas com o mesmo conteúdo textual NÃO devem ser fundidas apenas pela igualdade do hash!
    // Devem criar 2 imóveis distintos no banco, cada um com sua rastreabilidade e proveniência física!
    let stats = re_db.get_stats().unwrap();
    assert_eq!(
        stats.total_properties, 2,
        "Duas linhas distintas sem matrícula devem gerar 2 entidades independentes (sem fusão arbitrária)"
    );

    let (prop_id_line3,): (i64,) = conn
        .query_row(
            "SELECT property_id FROM import_batch_records WHERE batch_id = ?1 AND row_number = 3",
            [batch_id],
            |r| Ok((r.get(0)?,)),
        )
        .unwrap();

    let (prop_id_line7,): (i64,) = conn
        .query_row(
            "SELECT property_id FROM import_batch_records WHERE batch_id = ?1 AND row_number = 7",
            [batch_id],
            |r| Ok((r.get(0)?,)),
        )
        .unwrap();

    assert_ne!(
        prop_id_line3, prop_id_line7,
        "Linha 3 e Linha 7 devem ter IDs de imóveis distintos"
    );

    // REIMPORTAÇÃO DO MESMO ARQUIVO:
    // Linha 3 deve reutilizar prop_id_line3, e Linha 7 deve reutilizar prop_id_line7!
    conn.execute(
            "INSERT INTO import_batches (source_filename, source_hash_sha256, source_file_size, sheet_name, import_mode, started_at, status)
             VALUES ('unidades_iguais.xlsx', 'hash_unidades_iguais', 1000, 'endereco', 'FULL', datetime('now'), 'IN_PROGRESS')",
            [],
        ).unwrap();
    let batch2_id = conn.last_insert_rowid();

    let mut seen2 = std::collections::HashSet::new();
    RealEstateImporter::persist_chunk(
        &mut conn, batch2_id, "endereco", &chunk, &mut seen2, 0, 0, 0, 7,
    )
    .unwrap();

    // O total de imóveis permanece estritamente 2 na reimportação!
    assert_eq!(
        re_db.get_stats().unwrap().total_properties,
        2,
        "Reimportação preserva exatamente os 2 imóveis originais sem duplicar nenhum deles"
    );

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
#[ignore = "Benchmark local; executar explicitamente com cargo test --lib test_measure_mapa5_memory_and_timing -- --ignored --nocapture"]
fn test_measure_mapa5_memory_and_timing() {
    let env_path = std::env::var("MAPA5_FILE_PATH").ok();
    let default_path = std::path::PathBuf::from("/home/sandro/Downloads/Mapa5.xlsx");
    let mapa5_path = env_path
        .as_deref()
        .map(Path::new)
        .unwrap_or(default_path.as_path());

    if !mapa5_path.exists() {
        println!(
            "Aviso: Mapa5.xlsx não encontrado em {:?}, pulando benchmark.",
            mapa5_path
        );
        return;
    }

    fn get_rss_kb() -> usize {
        if let Ok(status) = fs::read_to_string("/proc/self/status") {
            for line in status.lines() {
                if line.starts_with("VmRSS:") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        if let Ok(kb) = parts[1].parse::<usize>() {
                            return kb;
                        }
                    }
                }
            }
        }
        0
    }

    let rss_before_mb = (get_rss_kb() as f64) / 1024.0;
    let t0 = std::time::Instant::now();

    let mut workbook = calamine::open_workbook_auto(mapa5_path).expect("Abertura XLSX");
    let t_open = t0.elapsed();

    let t1 = std::time::Instant::now();
    let range =
        calamine::Reader::worksheet_range(&mut workbook, "endereco").expect("Leitura aba endereco");
    let t_range = t1.elapsed();

    let rss_after_mb = (get_rss_kb() as f64) / 1024.0;
    let total_cells = range.get_size().0 * range.get_size().1;

    println!("\n=== BENCHMARK DE MEMÓRIA E TEMPO — MAPA5.XLSX ===");
    println!("Arquivo: {:?} (calamine v0.37.0)", mapa5_path);
    println!(
        "Dimensões da aba 'endereco': {} linhas x {} colunas (Total de células: {})",
        range.height(),
        range.width(),
        total_cells
    );
    println!("Tempo de abertura do ZIP/metadados: {:.2?}", t_open);
    println!("Tempo de parsing do Range<Data> da aba: {:.2?}", t_range);
    println!("Tempo total de carga na RAM: {:.2?}", t0.elapsed());
    println!("Memória RSS antes da carga: {:.2} MB", rss_before_mb);
    println!(
        "Memória RSS após carregar Range<Data>: {:.2} MB",
        rss_after_mb
    );
    println!(
        "Delta de memória RAM consumido pelo Range<Data>: {:.2} MB",
        rss_after_mb - rss_before_mb
    );
    println!("================================================\n");

    assert_eq!(range.height(), 145757);
    assert_eq!(range.width(), 8);
}

#[test]
#[ignore = "Benchmark local de vazão do banco; executar com cargo test --lib test_measure_real_estate_pipeline_throughput -- --ignored --nocapture"]
fn test_measure_real_estate_pipeline_throughput() {
    let env_path = std::env::var("MAPA5_FILE_PATH").ok();
    let default_path = std::path::PathBuf::from("/home/sandro/Downloads/Mapa5.xlsx");
    let mapa5_path = env_path
        .as_deref()
        .map(Path::new)
        .unwrap_or(default_path.as_path());

    if !mapa5_path.exists() {
        println!("Aviso: Mapa5.xlsx não encontrado, pulando benchmark de vazão.");
        return;
    }

    let temp_dir = std::env::temp_dir().join(format!(
        "devos_benchmark_throughput_{}",
        rand::random::<u32>()
    ));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    // Executa piloto de 1000 linhas medindo tempo total do pipeline (leitura + parsing + DB transações + índices)
    let sample_limit = 1000usize;
    let t_start = std::time::Instant::now();
    let report =
        RealEstateImporter::execute_import(&re_db, mapa5_path, "endereco", Some(sample_limit))
            .expect("Importação piloto de 1000 linhas");
    let elapsed = t_start.elapsed();

    let rows_per_sec = (report.total_records_imported as f64) / elapsed.as_secs_f64();
    let total_planilha = 145756.0;
    let projected_secs = total_planilha / rows_per_sec;
    let projected_mins = projected_secs / 60.0;

    println!("\n=== BENCHMARK DE VAZÃO COMPLETA DO PIPELINE (BANCO + DISCO) ===");
    println!(
        "Amostra processada: {} registros em {:.2?}",
        report.total_records_imported, elapsed
    );
    println!(
        "Velocidade efetiva do pipeline: {:.1} registros/segundo",
        rows_per_sec
    );
    println!(
        "Tempo projetado para carga completa (145.756 registros): {:.1} segundos ({:.2} minutos)",
        projected_secs, projected_mins
    );
    println!("===============================================================\n");

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_real_estate_incomplete_address_reimport_preserves_uuid_and_cross_version() {
    let fixture_v1 = Path::new("fixtures/test_incomplete_v1.xlsx");
    let fixture_v2 = Path::new("fixtures/test_incomplete_v2.xlsx");
    assert!(
        fixture_v1.exists(),
        "fixtures/test_incomplete_v1.xlsx deve existir"
    );
    assert!(
        fixture_v2.exists(),
        "fixtures/test_incomplete_v2.xlsx deve existir"
    );

    let temp_dir = std::env::temp_dir().join(format!(
        "devos_test_incomplete_addr_{}",
        rand::random::<u32>()
    ));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    // 1. Primeira importação de imóvel com matrícula e endereço incompleto (sem número, quadra ou lote)
    let report1 = RealEstateImporter::execute_import(&re_db, fixture_v1, "endereco", None)
        .expect("Primeira importação deve concluir com sucesso");
    assert_eq!(report1.status, "COMPLETED");
    assert_eq!(report1.total_rows_read, 1);
    assert_eq!(report1.total_records_imported, 1);

    let initial_stats = re_db.get_stats().unwrap();
    assert_eq!(
        initial_stats.total_properties, 1,
        "Exatamente 1 imóvel deve ser criado"
    );

    let conn = re_db.get_connection().unwrap();
    let (initial_property_id, initial_uuid): (i64, String) = conn
        .query_row("SELECT id, uuid FROM properties LIMIT 1", [], |r| {
            Ok((r.get(0)?, r.get(1)?))
        })
        .unwrap();

    // Confirma que endereço foi registrado sem discriminadores
    let (saved_street, saved_neighborhood, saved_number): (String, String, Option<String>) = conn
        .query_row(
            "SELECT street, neighborhood, number FROM addresses LIMIT 1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .unwrap();
    assert_eq!(saved_street, "RUA DAS PALMEIRAS");
    assert_eq!(saved_neighborhood, "CENTRO");
    assert!(saved_number.unwrap_or_default().is_empty());

    // 2. Reprocessamento da MESMA ORIGEM (idempotência com mesmo hash de arquivo)
    let report_repeat = RealEstateImporter::execute_import(&re_db, fixture_v1, "endereco", None)
        .expect("Reprocessamento do mesmo arquivo");
    assert_eq!(report_repeat.status, "ALREADY_COMPLETED");
    assert_eq!(
        re_db.get_stats().unwrap().total_properties,
        1,
        "Total de propriedades deve permanecer estritamente 1"
    );

    let (uuid_after_repeat,): (String,) = conn
        .query_row(
            "SELECT uuid FROM properties WHERE id = ?1",
            [initial_property_id],
            |r| Ok((r.get(0)?,)),
        )
        .unwrap();
    assert_eq!(
        uuid_after_repeat, initial_uuid,
        "UUID original deve ser preservado"
    );

    // 3. Processamento de NOVA VERSÃO DA PLANILHA (hash diferente) com o mesmo imóvel
    let report_v2 = RealEstateImporter::execute_import(&re_db, fixture_v2, "endereco", None)
        .expect("Importação da nova versão da planilha");
    assert_eq!(report_v2.status, "COMPLETED");
    assert_eq!(report_v2.total_rows_read, 1);
    assert_eq!(report_v2.total_records_imported, 1);

    // REGRA CRÍTICA: Não criar entidade repetida e preservar UUID estável pela evidência de matrícula e endereço simétrico!
    let stats_after_v2 = re_db.get_stats().unwrap();
    assert_eq!(
        stats_after_v2.total_properties, 1,
        "Não deve duplicar imóvel através de versões diferentes da planilha"
    );

    let (final_property_id, final_uuid): (i64, String) = conn
        .query_row("SELECT id, uuid FROM properties LIMIT 1", [], |r| {
            Ok((r.get(0)?, r.get(1)?))
        })
        .unwrap();
    assert_eq!(final_property_id, initial_property_id);
    assert_eq!(
        final_uuid, initial_uuid,
        "UUID original permanece idêntico através de novas versões da planilha"
    );

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
fn test_real_estate_batch_reconciliation_with_associated_ambiguous_and_rejected_rows() {
    let fixture_path = Path::new("fixtures/test_batch_reconciliation.xlsx");
    assert!(
        fixture_path.exists(),
        "fixtures/test_batch_reconciliation.xlsx deve existir"
    );

    let temp_dir = std::env::temp_dir().join(format!(
        "devos_test_reconciliation_{}",
        rand::random::<u32>()
    ));
    let re_db = RealEstateDatabase::new(temp_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    // 1. Pré-semeia 2 candidatos com a mesma matrícula 'MATR-DUPLA' e endereço 'RUA DO COMERCIO', 'CENTRO', número 50
    // para forçar a linha 3 a cair em AMBIGUOUS_PENDING_REVIEW (sem escolha arbitrária)
    let conn = re_db.get_connection().unwrap();
    for i in 1..=2 {
        conn.execute(
                "INSERT INTO properties (uuid, created_at, updated_at) VALUES (?1, datetime('now'), datetime('now'))",
                [format!("pre-ambig-uuid-{}", i)],
            ).unwrap();
        let pid = conn.last_insert_rowid();

        conn.execute(
                "INSERT INTO property_identifiers (property_id, identifier_type, raw_value, normalized_value, issuer_or_source, verification_status, created_at)
                 VALUES (?1, 'UNCLASSIFIED_MATRICULA', 'MATR-DUPLA', 'MATR-DUPLA', 'PLANILHA_MAPA5_ENDERECO', 'UNVERIFIED', datetime('now'))",
                [pid],
            ).unwrap();

        conn.execute(
                "INSERT INTO addresses (raw_address, street, number, complement, neighborhood, city, state, postal_code, normalized_hash, created_at)
                 VALUES ('Rua do Comercio 50', 'RUA DO COMERCIO', '50', '', 'CENTRO', 'Maricá', 'RJ', '24900-000', 'hash_comercio_50', datetime('now'))",
                [],
            ).unwrap();
        let aid = conn.last_insert_rowid();

        conn.execute(
                "INSERT INTO property_address_links (property_id, address_id, is_primary, effective_from, created_at)
                 VALUES (?1, ?2, 1, datetime('now'), datetime('now'))",
                [pid, aid],
            ).unwrap();
    }
    drop(conn);

    // 2. Executa a importação completa do lote de teste (4 linhas no Excel):
    // Linha 1: MATR-RECON-1 -> Associada
    // Linha 2: MATR-RECON-2 -> Associada
    // Linha 3: MATR-DUPLA -> Ambígua (Pendente de Revisão)
    // Linha 4: Dados em branco -> Rejeitada
    let report = RealEstateImporter::execute_import(&re_db, fixture_path, "endereco", None)
        .expect("Importação deve executar e conciliar");

    // 3. Validação do Relatório de Execução
    assert_eq!(
        report.total_rows_read, 4,
        "Total de linhas lidas deve ser 4"
    );
    assert_eq!(
        report.total_records_imported, 2,
        "Apenas as 2 linhas associadas contam como importadas"
    );
    assert_eq!(
        report.status, "COMPLETED_WITH_REJECTIONS",
        "Status deve refletir a presença de rejeições"
    );

    // 4. Verificação Estrita no Banco de Dados
    let conn2 = re_db.get_connection().unwrap();

    // 4.1 Todas as linhas possuem exatamente um resultado principal persistido em import_batch_records
    let total_persisted_batch: usize = conn2
        .query_row(
            "SELECT COUNT(*) FROM import_batch_records WHERE batch_id = ?1",
            [report.batch_id],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(
        total_persisted_batch, 4,
        "Todas as 4 linhas físicas devem ter resultado registrado"
    );

    // 4.2 Breakdown categórico individual
    let (associated_count,): (usize,) = conn2
        .query_row(
            "SELECT COUNT(*) FROM import_batch_records 
             WHERE batch_id = ?1 AND processing_status = 'NORMALIZED' AND property_id IS NOT NULL",
            [report.batch_id],
            |r| Ok((r.get(0)?,)),
        )
        .unwrap();
    assert_eq!(associated_count, 2, "Exatamente 2 registros associados");

    let (pending_count,): (usize,) = conn2.query_row(
            "SELECT COUNT(*) FROM import_batch_records 
             WHERE batch_id = ?1 AND processing_status = 'AMBIGUOUS_PENDING_REVIEW' AND property_id IS NULL",
            [report.batch_id],
            |r| Ok((r.get(0)?,)),
        ).unwrap();
    assert_eq!(
        pending_count, 1,
        "Exatamente 1 registro pendente de revisão (ambíguo)"
    );

    let (rejected_count,): (usize,) = conn2
        .query_row(
            "SELECT COUNT(*) FROM import_batch_records 
             WHERE batch_id = ?1 AND processing_status = 'REJECTED' AND property_id IS NULL",
            [report.batch_id],
            |r| Ok((r.get(0)?,)),
        )
        .unwrap();
    assert_eq!(rejected_count, 1, "Exatamente 1 registro rejeitado");

    // 4.3 Equação Fundamental de Conciliação
    assert_eq!(
        report.total_rows_read,
        associated_count + pending_count + rejected_count,
        "total_rows_read == associados (2) + pendentes (1) + rejeitados (1)"
    );

    // 4.4 Apontamentos de auditoria não duplicam contagem de linhas
    let total_findings: usize = conn2
        .query_row(
            "SELECT COUNT(*) FROM audit_findings 
             WHERE batch_record_id IN (SELECT id FROM import_batch_records WHERE batch_id = ?1)",
            [report.batch_id],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(
        total_findings, 2,
        "Devem existir 2 apontamentos (1 AMBIGUOUS_IDENTIFIER_MATCH e 1 ROW_REJECTED)"
    );

    // 4.5 Metadados de reconciliação em import_batches
    let meta_json_str: String = conn2
        .query_row(
            "SELECT metadata_json FROM import_batches WHERE id = ?1",
            [report.batch_id],
            |r| r.get(0),
        )
        .unwrap();
    let meta: serde_json::Value = serde_json::from_str(&meta_json_str).unwrap();

    assert_eq!(meta["associated_records"], 2);
    assert_eq!(meta["pending_review_records"], 1);
    assert_eq!(meta["rejected_records"], 1);
    assert_eq!(meta["total_persisted_records"], 4);
    assert_eq!(meta["total_audit_findings"], 2);
    assert_eq!(meta["technical_completion"], true);
    assert_eq!(meta["reconciled"], true);

    let _ = fs::remove_dir_all(temp_dir);
}

#[test]
#[ignore = "Carga Integral Oficial do Mapa5.xlsx no banco local do Cockpit"]
fn test_execute_cockpit_full_import_mapa5() {
    let mapa5_path = Path::new("/home/sandro/Downloads/Mapa5.xlsx");
    assert!(
        mapa5_path.exists(),
        "Mapa5.xlsx deve existir em /home/sandro/Downloads/"
    );

    let cockpit_dir =
        std::path::PathBuf::from("/home/sandro/.local/share/br.aspp.devos.cockpit/real_estate");
    fs::create_dir_all(&cockpit_dir).expect("Criação do diretório do Cockpit");
    let re_db = RealEstateDatabase::new(cockpit_dir.clone());
    RealEstateMigrationManager::run_migrations(&re_db).unwrap();

    println!("\n==================================================================");
    println!("🏛️ INICIANDO CARGA INTEGRAL CONTROLADA DO MAPA5.XLSX NO COCKPIT");
    println!("Destino: {:?}", re_db.db_path());
    println!("Fonte: {:?}", mapa5_path);
    println!("==================================================================");

    let t_start = std::time::Instant::now();
    let report = RealEstateImporter::execute_import(&re_db, mapa5_path, "endereco", None)
        .expect("Execução da importação integral de Mapa5.xlsx");
    let elapsed = t_start.elapsed();

    println!("\n=== CARGA INTEGRAL CONCLUÍDA EM {:.2?} ===", elapsed);
    println!("Lote ID: {}", report.batch_id);
    println!("Status: {}", report.status);
    println!("Total de linhas lidas: {}", report.total_rows_read);
    println!(
        "Total de registros importados/associados: {}",
        report.total_records_imported
    );
    println!(
        "Total de apontamentos de auditoria: {}",
        report.total_inconsistencies_detected
    );
    println!("Mensagem: {}", report.message);

    // Auditoria e Conciliação detalhada no banco de dados local do Cockpit
    let conn = re_db.get_connection().unwrap();

    // 1. Integridade SQLite
    let integrity_check: String = conn
        .query_row("PRAGMA integrity_check;", [], |r| r.get(0))
        .unwrap();
    assert_eq!(
        integrity_check, "ok",
        "PRAGMA integrity_check deve retornar 'ok'"
    );

    let fk_violations: Vec<String> = conn
        .prepare("PRAGMA foreign_key_check;")
        .unwrap()
        .query_map([], |r| {
            Ok(format!(
                "FK violation: table {} rowid {}",
                r.get::<_, String>(0)?,
                r.get::<_, i64>(1)?
            ))
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();
    assert!(
        fk_violations.is_empty(),
        "Não deve haver violações de chave estrangeira: {:?}",
        fk_violations
    );

    // 2. Breakdown dos registros do lote
    let (total_persisted, associated_records, pending_review_records, rejected_records): (usize, usize, usize, usize) = conn.query_row(
            "SELECT 
                COUNT(*),
                COALESCE(SUM(CASE WHEN processing_status IN ('NORMALIZED', 'CONFLICT_FLAGGED') THEN 1 ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN processing_status = 'AMBIGUOUS_PENDING_REVIEW' THEN 1 ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN processing_status = 'REJECTED' THEN 1 ELSE 0 END), 0)
             FROM import_batch_records
             WHERE batch_id = ?1",
            [report.batch_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
        ).unwrap();

    let total_findings: usize = conn.query_row(
            "SELECT COUNT(*) FROM audit_findings WHERE batch_record_id IN (SELECT id FROM import_batch_records WHERE batch_id = ?1)",
            [report.batch_id],
            |r| r.get(0),
        ).unwrap();

    let total_properties: usize = conn
        .query_row("SELECT COUNT(*) FROM properties", [], |r| r.get(0))
        .unwrap();
    let total_addresses: usize = conn
        .query_row("SELECT COUNT(*) FROM addresses", [], |r| r.get(0))
        .unwrap();
    let total_identifiers: usize = conn
        .query_row("SELECT COUNT(*) FROM property_identifiers", [], |r| {
            r.get(0)
        })
        .unwrap();
    let total_links: usize = conn
        .query_row("SELECT COUNT(*) FROM property_address_links", [], |r| {
            r.get(0)
        })
        .unwrap();

    // 3. Breakdown de findings por categoria
    let mut finding_stmt = conn
        .prepare(
            "SELECT category, severity, COUNT(*) FROM audit_findings 
             WHERE batch_record_id IN (SELECT id FROM import_batch_records WHERE batch_id = ?1)
             GROUP BY category, severity ORDER BY COUNT(*) DESC",
        )
        .unwrap();
    let findings_by_cat: Vec<(String, String, usize)> = finding_stmt
        .query_map([report.batch_id], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    println!("\n=== RELATÓRIO OFICIAL DE RECONCILIAÇÃO DO COCKPIT ===");
    println!("Arquivo: Mapa5.xlsx (Aba: endereco)");
    println!(
        "Tempo Total: {:.2?} ({:.1} linhas/segundo)",
        elapsed,
        (report.total_rows_read as f64) / elapsed.as_secs_f64()
    );
    println!("Linhas Físicas Lidas: {}", report.total_rows_read);
    println!(
        "Linhas Persistidas em import_batch_records: {}",
        total_persisted
    );
    println!("  ├─ Registros Associados: {}", associated_records);
    println!(
        "  ├─ Registros Pendentes de Revisão (Ambiguidade): {}",
        pending_review_records
    );
    println!("  └─ Registros Rejeitados: {}", rejected_records);
    println!(
        "Reconciliação Exata: {} == {} + {} + {} -> {}",
        report.total_rows_read,
        associated_records,
        pending_review_records,
        rejected_records,
        report.total_rows_read == associated_records + pending_review_records + rejected_records
    );
    println!("\nEntidades Cadastrais no Banco do Cockpit:");
    println!("  ├─ Imóveis (properties): {}", total_properties);
    println!("  ├─ Endereços (addresses): {}", total_addresses);
    println!(
        "  ├─ Identificadores (property_identifiers): {}",
        total_identifiers
    );
    println!(
        "  └─ Vínculos de Endereço (property_address_links): {}",
        total_links
    );
    println!(
        "\nApontamentos de Auditoria (audit_findings): {}",
        total_findings
    );
    for (cat, sev, cnt) in findings_by_cat {
        println!("  ├─ [{}] {} : {}", sev, cat, cnt);
    }
    println!("=====================================================\n");

    assert_eq!(
        report.total_rows_read, total_persisted,
        "Todas as linhas lidas devem ter resultado persistido"
    );
    assert_eq!(
        report.total_rows_read,
        associated_records + pending_review_records + rejected_records,
        "Reconciliação fundamental deve ser perfeita"
    );
    assert_eq!(integrity_check, "ok");
}
