use crate::commands::get_device_status;
use crate::storage::{
    LocalDatabase, MigrationManager, RealEstateDatabase, RealEstateMigrationManager,
};

use serde_json::Value;
use std::fs;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};

// -----------------------------------------------------------------------------
// Helpers de teste
// -----------------------------------------------------------------------------

/// Diretório temporário exclusivo para um teste com garantia de limpeza RAII.
///
/// O diretório é removido automaticamente quando o valor sai de escopo,
/// inclusive quando uma asserção intermediária provoca um panic.
struct TestTempDir {
    path: PathBuf,
}

impl TestTempDir {
    fn new(prefix: &str) -> Self {
        let base_dir = std::env::temp_dir();

        for _ in 0..16 {
            let candidate = base_dir.join(format!(
                "devos_test_{}_{}_{}",
                prefix,
                std::process::id(),
                rand::random::<u128>()
            ));

            match fs::create_dir(&candidate) {
                Ok(()) => {
                    return Self { path: candidate };
                }
                Err(error) if error.kind() == ErrorKind::AlreadyExists => {
                    // Tenta outro identificador em caso de colisão.
                }
                Err(error) => {
                    panic!(
                        "Não foi possível criar o diretório temporário '{}': {}",
                        candidate.display(),
                        error
                    );
                }
            }
        }

        panic!(
            "Não foi possível criar um diretório temporário exclusivo após várias tentativas para '{}'",
            prefix
        );
    }

    fn path(&self) -> &Path {
        &self.path
    }
}

impl Drop for TestTempDir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}

/// Resolve caminhos a partir da raiz do pacote Rust (src-tauri).
fn manifest_path(relative_path: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join(relative_path)
}

/// Lê e interpreta um arquivo JSON com mensagens contextuais de erro.
fn read_json(path: &Path) -> Value {
    let content = fs::read_to_string(path).unwrap_or_else(|error| {
        panic!("Falha ao ler o arquivo JSON '{}': {}", path.display(), error)
    });

    serde_json::from_str(&content).unwrap_or_else(|error| {
        panic!("JSON inválido em '{}': {}", path.display(), error)
    })
}

/// Conta objetos estruturais do esquema SQLite (tabelas, índices, triggers e views).
fn schema_object_count(conn: &rusqlite::Connection) -> rusqlite::Result<i64> {
    conn.query_row(
        "SELECT COUNT(*)
         FROM sqlite_master
         WHERE type IN ('table', 'index', 'trigger', 'view')
           AND name NOT LIKE 'sqlite_%'",
        [],
        |row| row.get(0),
    )
}

/// Valida explicitamente se a conexão SQLite está operando em modo WAL.
fn assert_wal_mode(conn: &rusqlite::Connection, database_name: &str) {
    let journal_mode: String = conn
        .query_row("PRAGMA journal_mode;", [], |row| row.get(0))
        .unwrap_or_else(|error| {
            panic!(
                "Falha ao consultar journal_mode do banco '{}': {}",
                database_name, error
            )
        });

    assert_eq!(
        journal_mode.to_ascii_lowercase(),
        "wal",
        "O banco '{}' deveria utilizar WAL, mas journal_mode retornou '{}'",
        database_name,
        journal_mode
    );
}

/// Confirma que uma tabela está ausente no banco especificado.
/// Apenas QueryReturnedNoRows é aceito como prova válida de ausência.
fn assert_table_absent(
    conn: &rusqlite::Connection,
    table_name: &str,
    database_name: &str,
) {
    let result: rusqlite::Result<i32> = conn.query_row(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?1",
        [table_name],
        |row| row.get(0),
    );

    match result {
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            // A tabela não existe, comprovando a segregação física.
        }
        Ok(_) => {
            panic!(
                "Violação de segregação: a tabela '{}' existe no banco '{}'",
                table_name, database_name
            );
        }
        Err(error) => {
            panic!(
                "Não foi possível verificar a ausência da tabela '{}' no banco '{}': {}",
                table_name, database_name, error
            );
        }
    }
}

/// Confirma que uma operação SQLite foi bloqueada especificamente por violação de restrição (Trigger).
fn assert_constraint_violation(
    result: rusqlite::Result<usize>,
    operation: &str,
) {
    match result {
        Err(rusqlite::Error::SqliteFailure(sqlite_error, _))
            if sqlite_error.code == rusqlite::ErrorCode::ConstraintViolation =>
        {
            // Bloqueio correto pelo trigger de imutabilidade.
        }
        Err(error) => {
            panic!(
                "{} falhou por motivo diferente da violação de restrição esperada: {}",
                operation, error
            );
        }
        Ok(rows_affected) => {
            panic!(
                "{} foi permitida (afetou {} linhas), mas deveria ter sido rejeitada pelo trigger",
                operation, rows_affected
            );
        }
    }
}

// -----------------------------------------------------------------------------
// Testes de status e permissões Tauri
// -----------------------------------------------------------------------------

#[test]
fn test_get_device_status_returns_uninitialized() {
    let status = get_device_status();
    assert!(!status.enrolled);
    assert_eq!(status.status, "UNINITIALIZED");
}

#[test]
fn test_capabilities_zero_privilege_maintained() {
    let capability_path = manifest_path("capabilities/default.json");
    let parsed = read_json(&capability_path);

    assert_eq!(
        parsed.get("identifier").and_then(Value::as_str),
        Some("default"),
        "A capability padrão deve possuir identifier = 'default'"
    );

    let permissions = parsed
        .get("permissions")
        .and_then(Value::as_array)
        .expect("O campo 'permissions' deve ser um array");

    assert!(
        permissions.is_empty(),
        "A capability padrão deve manter Zero Privilégio (permissions vazio), mas continha: {:?}",
        permissions
    );
}

#[test]
fn test_command_acl_manifest_autogenerated() {
    let autogen_path = manifest_path("permissions/autogenerated/get_device_status.toml");
    let content = fs::read_to_string(&autogen_path).unwrap_or_else(|error| {
        panic!("Falha ao ler '{}': {}", autogen_path.display(), error)
    });

    assert!(
        content
            .lines()
            .any(|line| line.trim() == r#"identifier = "allow-get-device-status""#),
        "O TOML deve declarar a permissão allow-get-device-status"
    );

    assert!(
        content
            .lines()
            .any(|line| line.trim() == r#"commands.allow = ["get_device_status"]"#),
        "A permissão allow-get-device-status deve autorizar get_device_status"
    );

    assert!(
        content
            .lines()
            .any(|line| line.trim() == r#"identifier = "deny-get-device-status""#),
        "O TOML deve declarar a permissão deny-get-device-status"
    );

    assert!(
        content
            .lines()
            .any(|line| line.trim() == r#"commands.deny = ["get_device_status"]"#),
        "A permissão deny-get-device-status deve negar get_device_status"
    );

    let acl_manifest_path = manifest_path("gen/schemas/acl-manifests.json");
    let manifest_json = read_json(&acl_manifest_path);

    let app_acl = manifest_json
        .get("__app-acl__")
        .expect("__app-acl__ deve existir em acl-manifests.json");

    let default_permission = app_acl
        .get("default_permission")
        .expect("O campo default_permission deve existir");

    assert!(
        default_permission.is_null(),
        "default_permission deve ser nulo para evitar concessões implícitas"
    );

    let permissions = app_acl
        .get("permissions")
        .and_then(Value::as_object)
        .expect("O campo permissions deve ser um objeto na ACL gerada");

    assert!(
        permissions.contains_key("allow-get-device-status"),
        "allow-get-device-status deve estar registrado na ACL do aplicativo"
    );
}

#[test]
fn test_cockpit_real_estate_capability_file_exists() {
    let capability_path = manifest_path("capabilities/cockpit-real-estate.json");
    let parsed = read_json(&capability_path);

    assert_eq!(
        parsed.get("identifier").and_then(Value::as_str),
        Some("cockpit-real-estate"),
        "O identificador da capability deve ser cockpit-real-estate"
    );

    let windows = parsed
        .get("windows")
        .and_then(Value::as_array)
        .expect("O campo windows deve ser um array");

    assert!(
        windows.iter().any(|window| window.as_str() == Some("main")),
        "A capability do Cockpit deve estar associada à janela main"
    );

    let permissions = parsed
        .get("permissions")
        .and_then(Value::as_array)
        .expect("O campo permissions deve ser um array");

    for expected_permission in [
        "allow-get-real-estate-stats",
        "allow-preview-real-estate-import",
        "allow-execute-real-estate-import",
    ] {
        assert!(
            permissions
                .iter()
                .any(|permission| permission.as_str() == Some(expected_permission)),
            "A capability do Cockpit deve conter a permissão '{}'",
            expected_permission
        );
    }
}

#[test]
fn test_node_edition_excludes_cockpit_real_estate_capability() {
    let node_conf_path = manifest_path("tauri.node.conf.json");
    let parsed = read_json(&node_conf_path);

    let capabilities = parsed
        .get("app")
        .and_then(|app| app.get("security"))
        .and_then(|security| security.get("capabilities"))
        .and_then(Value::as_array)
        .expect("app.security.capabilities deve existir como array em tauri.node.conf.json");

    let has_cockpit_real_estate = capabilities
        .iter()
        .any(|capability| capability.as_str() == Some("cockpit-real-estate"));

    assert!(
        !has_cockpit_real_estate,
        "VIOLAÇÃO DE SEGURANÇA: A edição Node não deve conter a capability 'cockpit-real-estate'"
    );

    let has_desktop_vault = capabilities
        .iter()
        .any(|capability| capability.as_str() == Some("desktop-vault"));

    assert!(
        has_desktop_vault,
        "A edição Node deve conter a capability 'desktop-vault'"
    );
}

// -----------------------------------------------------------------------------
// Testes de persistência e ciclo de vida das migrações
// -----------------------------------------------------------------------------

#[test]
fn test_persistence_initialization_and_single_migration_lifecycle() {
    let temp_dir = TestTempDir::new("centralized_db");

    // 1. Inicializa o banco do cofre
    let vault_db = LocalDatabase::new(temp_dir.path().join("devos_vault"));

    MigrationManager::run_migrations(&vault_db)
        .expect("A migração inicial do cofre deve ser executada");

    let vault_schema_after_first = {
        let conn = vault_db
            .get_connection()
            .expect("Deve ser possível abrir o banco do cofre após a migração");
        schema_object_count(&conn).expect("Deve ser possível contar objetos do cofre")
    };

    MigrationManager::run_migrations(&vault_db)
        .expect("A repetição da migração do cofre deve ser aceita e idempotente");

    let vault_schema_after_second = {
        let conn = vault_db
            .get_connection()
            .expect("Deve ser possível reabrir o banco do cofre");
        schema_object_count(&conn).expect("Deve ser possível contar objetos do cofre após repetição")
    };

    assert_eq!(
        vault_schema_after_first, vault_schema_after_second,
        "A repetição das migrações do cofre não deve alterar a contagem de objetos do esquema"
    );

    // 2. Inicializa o banco cadastral
    let real_estate_db = RealEstateDatabase::new(temp_dir.path().join("real_estate"));

    RealEstateMigrationManager::run_migrations(&real_estate_db)
        .expect("A migração inicial do cadastro deve ser executada");

    let re_schema_after_first = {
        let conn = real_estate_db
            .get_connection()
            .expect("Deve ser possível abrir o banco cadastral após a migração");
        schema_object_count(&conn).expect("Deve ser possível contar objetos do cadastro")
    };

    RealEstateMigrationManager::run_migrations(&real_estate_db)
        .expect("A repetição da migração cadastral deve ser aceita e idempotente");

    let re_schema_after_second = {
        let conn = real_estate_db
            .get_connection()
            .expect("Deve ser possível reabrir o banco cadastral");
        schema_object_count(&conn).expect("Deve ser possível contar objetos do cadastro após repetição")
    };

    assert_eq!(
        re_schema_after_first, re_schema_after_second,
        "A repetição das migrações cadastrais não deve alterar o esquema"
    );

    // 3. Valida foreign_keys ativas e modo WAL em ambas as conexões
    let conn_vault = vault_db
        .get_connection()
        .expect("A conexão com o cofre deve abrir");

    let fk_vault: i32 = conn_vault
        .query_row("PRAGMA foreign_keys;", [], |row| row.get(0))
        .expect("Deve ser possível consultar foreign_keys no cofre");

    assert_eq!(fk_vault, 1, "Foreign keys devem estar ativas no cofre");
    assert_wal_mode(&conn_vault, "devos_vault.sqlite");

    let conn_real_estate = real_estate_db
        .get_connection()
        .expect("A conexão com o cadastro deve abrir");

    let fk_real_estate: i32 = conn_real_estate
        .query_row("PRAGMA foreign_keys;", [], |row| row.get(0))
        .expect("Deve ser possível consultar foreign_keys no cadastro");

    assert_eq!(fk_real_estate, 1, "Foreign keys devem estar ativas no cadastro");
    assert_wal_mode(&conn_real_estate, "real_estate.sqlite");
}

// -----------------------------------------------------------------------------
// Testes de imutabilidade dos eventos de auditoria
// -----------------------------------------------------------------------------

#[test]
fn test_audit_events_immutability_trigger() {
    let temp_dir = TestTempDir::new("audit_trigger");
    let real_estate_db = RealEstateDatabase::new(temp_dir.path().to_path_buf());

    RealEstateMigrationManager::run_migrations(&real_estate_db)
        .expect("As migrações do banco cadastral devem ser executadas");

    let conn = real_estate_db
        .get_connection()
        .expect("Deve ser possível abrir a conexão do banco cadastral");

    // Insere um evento de auditoria
    conn.execute(
        "INSERT INTO audit_events
         (event_type, entity_type, entity_id, details_json, performed_by)
         VALUES ('TEST_EVENT', 'TEST_ENTITY', '1', '{}', 'TEST_USER');",
        [],
    )
    .expect("A inserção de um evento de auditoria deve ser permitida");

    // Utiliza o ID real da linha recém-inserida
    let event_id = conn.last_insert_rowid();

    // UPDATE deve ser rejeitado pelo trigger de imutabilidade com ConstraintViolation
    let update_result = conn.execute(
        "UPDATE audit_events SET performed_by = 'HACKER' WHERE id = ?1;",
        [event_id],
    );

    assert_constraint_violation(update_result, "UPDATE em audit_events");

    // DELETE também deve ser rejeitado pelo trigger
    let delete_result = conn.execute(
        "DELETE FROM audit_events WHERE id = ?1;",
        [event_id],
    );

    assert_constraint_violation(delete_result, "DELETE em audit_events");
}

// -----------------------------------------------------------------------------
// Testes de segregação física dos bancos
// -----------------------------------------------------------------------------

#[test]
fn test_vault_and_real_estate_physical_segregation() {
    let temp_dir = TestTempDir::new("segregation");

    let vault_db = LocalDatabase::new(temp_dir.path().join("devos_vault"));
    let real_estate_db = RealEstateDatabase::new(temp_dir.path().join("real_estate"));

    MigrationManager::run_migrations(&vault_db)
        .expect("As migrações do cofre devem ser executadas");

    RealEstateMigrationManager::run_migrations(&real_estate_db)
        .expect("As migrações do cadastro devem ser executadas");

    // Confirma que os bancos utilizam arquivos físicos diferentes
    assert_ne!(
        vault_db.db_path(),
        real_estate_db.db_path(),
        "O cofre e o cadastro devem usar arquivos de banco separados"
    );

    assert!(
        vault_db.db_path().ends_with("devos_vault.sqlite"),
        "O caminho do banco do cofre deve terminar em devos_vault.sqlite"
    );

    assert!(
        real_estate_db.db_path().ends_with("real_estate.sqlite"),
        "O caminho do banco cadastral deve terminar em real_estate.sqlite"
    );

    assert!(
        vault_db.db_path().exists(),
        "O arquivo físico do banco do cofre deve existir"
    );

    assert!(
        real_estate_db.db_path().exists(),
        "O arquivo físico do banco cadastral deve existir"
    );

    // Verifica que tabelas específicas não vazaram entre os bancos
    let conn_vault = vault_db
        .get_connection()
        .expect("Deve ser possível abrir o banco do cofre");

    assert_table_absent(&conn_vault, "properties", "devos_vault.sqlite");

    let conn_real_estate = real_estate_db
        .get_connection()
        .expect("Deve ser possível abrir o banco cadastral");

    assert_table_absent(&conn_real_estate, "vault_header", "real_estate.sqlite");
}
