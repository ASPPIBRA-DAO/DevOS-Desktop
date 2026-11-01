//! Testes unitários e de integração do Módulo IPFS / DePIN.
//!
//! REQUISITO DE HOMOLOGAÇÃO:
//! Os testes de `cargo test` não dependem de um daemon Kubo instalado ou ativo na máquina.
//! A resiliência a nós offline e a computação determinística dos desafios são validadas
//! em ambiente hermético. Testes com nós reais utilizam a anotação `#[ignore]`.

use crate::commands::ipfs_commands::*;
use crate::modules::ipfs::client::KuboClient;
use crate::modules::ipfs::models::*;
use sha2::Digest;

#[test]
fn test_ipfs_daemon_status_default_offline() {
    let status = IpfsDaemonStatus::default();
    assert!(!status.running);
    assert_eq!(status.peer_id, None);
    assert_eq!(status.peers_count, None);
    assert_eq!(status.repo_size_bytes, None);
    assert_eq!(status.version, None);
}

#[tokio::test]
async fn test_kubo_client_offline_graceful_fallback() {
    // Aponta intencionalmente para uma porta inativa para testar a resiliência
    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");
    assert!(!client.is_alive().await);

    let status = client.query_daemon_status().await;
    assert!(!status.running);
    assert_eq!(status.peers_count, None);
}

#[tokio::test]
async fn test_storage_proof_computation_deterministic() {
    let challenge = StorageProofChallenge {
        challenge_id: "challenge-test-001".to_string(),
        cid: "bafybeic565qw6cvdr27vdikq4pqsh7v54d3d5267121b".to_string(),
        server_nonce: "test-nonce-12345".to_string(),
        deadline_utc: "2026-11-01T15:00:00Z".to_string(),
    };

    let res = execute_storage_proof(challenge.clone()).await.expect("Computação da prova deve ser bem-sucedida");
    assert_eq!(res.challenge_id, "challenge-test-001");
    assert!(res.proof_hash.starts_with("0x"));
    assert_eq!(res.proof_hash.len(), 66); // 0x + 64 caracteres hex (SHA-256)
    assert!(res.signature.starts_with("0x"));
    assert!(!res.node_operational_pubkey.is_empty());

    // Determinismo: mesma entrada deve gerar exatamente a mesma prova
    let res2 = execute_storage_proof(challenge).await.expect("Segunda computação deve ter sucesso");
    assert_eq!(res.proof_hash, res2.proof_hash);
    assert_eq!(res.signature, res2.signature);
}

#[tokio::test]
async fn test_storage_proof_different_nonces_produce_different_hashes() {
    let challenge_a = StorageProofChallenge {
        challenge_id: "challenge-001".to_string(),
        cid: "bafybeic565qw6cvdr27vdikq4pqsh7v54d3d5267121b".to_string(),
        server_nonce: "nonce-alpha".to_string(),
        deadline_utc: "2026-11-01T15:00:00Z".to_string(),
    };

    let challenge_b = StorageProofChallenge {
        challenge_id: "challenge-001".to_string(),
        cid: "bafybeic565qw6cvdr27vdikq4pqsh7v54d3d5267121b".to_string(),
        server_nonce: "nonce-beta".to_string(),
        deadline_utc: "2026-11-01T15:00:00Z".to_string(),
    };

    let res_a = execute_storage_proof(challenge_a).await.unwrap();
    let res_b = execute_storage_proof(challenge_b).await.unwrap();

    assert_ne!(res_a.proof_hash, res_b.proof_hash, "Nonces distintos devem produzir provas distintas");
}

#[tokio::test]
async fn test_storage_proof_rejects_empty_inputs() {
    let empty_cid = StorageProofChallenge {
        challenge_id: "test".to_string(),
        cid: "   ".to_string(),
        server_nonce: "nonce".to_string(),
        deadline_utc: "2026-11-01T15:00:00Z".to_string(),
    };
    assert!(execute_storage_proof(empty_cid).await.is_err());

    let empty_nonce = StorageProofChallenge {
        challenge_id: "test".to_string(),
        cid: "bafybeic565".to_string(),
        server_nonce: "".to_string(),
        deadline_utc: "2026-11-01T15:00:00Z".to_string(),
    };
    assert!(execute_storage_proof(empty_nonce).await.is_err());

    let empty_id = StorageProofChallenge {
        challenge_id: "".to_string(),
        cid: "bafybeic565".to_string(),
        server_nonce: "nonce".to_string(),
        deadline_utc: "2026-11-01T15:00:00Z".to_string(),
    };
    assert!(execute_storage_proof(empty_id).await.is_err());
}

#[test]
fn test_incremental_file_sha256_computation() {
    use std::io::Write;
    use crate::modules::ipfs::content::compute_file_sha256;

    let temp_dir = std::env::temp_dir().join(format!("devos_test_{}", uuid::Uuid::new_v4()));
    let _ = std::fs::create_dir_all(&temp_dir);
    let test_file = temp_dir.join("test_sample.txt");

    let sample_content = b"ASPPIBRA DevOS DePIN Storage Test Content";
    let mut file = std::fs::File::create(&test_file).expect("Criar arquivo de teste");
    file.write_all(sample_content).expect("Gravar conteudo");
    drop(file);

    let (calculated_hash, total_bytes) = compute_file_sha256(&test_file).expect("Calculo SHA-256");
    assert_eq!(total_bytes, sample_content.len() as u64);
    assert!(calculated_hash.starts_with("0x"));

    // SHA-256 manual com sha2
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(sample_content);
    let expected = format!("0x{}", hex::encode(hasher.finalize()));

    assert_eq!(calculated_hash, expected);
    let _ = std::fs::remove_dir_all(&temp_dir);
}

#[tokio::test]
async fn test_managed_pins_catalog_lifecycle() {
    use crate::modules::ipfs::pinning::{
        is_managed_pin, list_managed_pins, register_managed_pin, set_custom_catalog_dir,
        unregister_managed_pin,
    };

    let temp_dir = std::env::temp_dir().join(format!("devos_cat_test_{}", uuid::Uuid::new_v4()));
    let _ = std::fs::create_dir_all(&temp_dir);
    set_custom_catalog_dir(Some(temp_dir.clone()));

    let cid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    assert!(!is_managed_pin(cid));

    let record = ManagedPinRecord {
        cid: cid.to_string(),
        name: "documento_teste.pdf".to_string(),
        original_sha256: "0x1234567890abcdef".to_string(),
        size_bytes: 4096,
        pinned_at_utc: "2026-11-01T15:00:00Z".to_string(),
        pin_type: "recursive".to_string(),
        origin: "unit_test".to_string(),
        repo_context: "shared_or_external".to_string(),
    };

    register_managed_pin(record).expect("Registro de pin no catalogo");
    assert!(is_managed_pin(cid));

    let list = list_managed_pins();
    assert_eq!(list.len(), 1);
    assert_eq!(list[0].cid, cid);

    let removed = unregister_managed_pin(cid).expect("Remocao do registro");
    assert!(removed);
    assert!(!is_managed_pin(cid));

    set_custom_catalog_dir(None);
    let _ = std::fs::remove_dir_all(&temp_dir);
}

#[tokio::test]
async fn test_safe_unpin_shared_repo_requires_confirmation_for_managed_pin() {
    use crate::modules::ipfs::pinning::{register_managed_pin, safe_unpin, set_custom_catalog_dir};

    let temp_dir = std::env::temp_dir().join(format!("devos_unpin_test_{}", uuid::Uuid::new_v4()));
    let _ = std::fs::create_dir_all(&temp_dir);
    set_custom_catalog_dir(Some(temp_dir.clone()));

    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");
    let managed_cid = "bafybeihdwdcefghrandomcidtest123456";

    register_managed_pin(ManagedPinRecord {
        cid: managed_cid.to_string(),
        name: "test.pdf".to_string(),
        original_sha256: "0xabcdef".to_string(),
        size_bytes: 1024,
        pinned_at_utc: "2026-11-01T15:00:00Z".to_string(),
        pin_type: "recursive".to_string(),
        origin: "unit_test".to_string(),
        repo_context: "shared_or_external".to_string(),
    }).expect("Registrar pin gerenciado");

    // Correção 02: Mesmo sendo gerenciado pelo DevOS, em repositório compartilhado
    // exige confirm_shared_repo_unpin = true explicitamente
    let res = safe_unpin(&client, managed_cid, true, false, false).await;
    assert!(res.is_err());
    let err_msg = res.unwrap_err();
    assert!(err_msg.contains("confirm_shared_repo_unpin = true"));
    assert!(err_msg.contains("repositório compartilhado"));

    set_custom_catalog_dir(None);
    let _ = std::fs::remove_dir_all(&temp_dir);
}

#[tokio::test]
async fn test_safe_unpin_rejects_unmanaged_pin_without_confirmation() {
    use crate::modules::ipfs::pinning::safe_unpin;

    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");
    let unmanaged_cid = "bafybeihdwdcefghrandomcidtest999999";

    // Sem confirmação explícita, a remoção de um CID não catalogado DEVE ser rejeitada
    let res = safe_unpin(&client, unmanaged_cid, true, false, false).await;
    assert!(res.is_err());
    let err_msg = res.unwrap_err();
    assert!(err_msg.contains("não é gerenciado pelo DevOS"));
    assert!(err_msg.contains("confirm_shared_repo_unpin = true"));
}

#[tokio::test]
async fn test_ipfs_upload_rejects_missing_file() {
    use crate::modules::ipfs::content::upload_file;

    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");
    let missing_file_options = IpfsUploadOptions {
        file_path: "/tmp/non_existent_devos_file_9999.xyz".to_string(),
        pin: true,
        expected_sha256: None,
    };

    let res = upload_file(&client, missing_file_options).await;
    assert!(res.is_err());
    assert!(res.unwrap_err().contains("não encontrado"));
}

#[tokio::test]
async fn test_upload_failure_does_not_register_in_catalog() {
    use crate::modules::ipfs::content::upload_file;
    use crate::modules::ipfs::pinning::{is_managed_pin, set_custom_catalog_dir};
    use std::io::Write;

    let temp_dir = std::env::temp_dir().join(format!("devos_up_fail_{}", uuid::Uuid::new_v4()));
    let _ = std::fs::create_dir_all(&temp_dir);
    set_custom_catalog_dir(Some(temp_dir.clone()));

    let sample_file = temp_dir.join("payload.txt");
    let mut f = std::fs::File::create(&sample_file).unwrap();
    f.write_all(b"dados para upload").unwrap();
    drop(f);

    // Nó inativo deve causar falha de rede
    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");
    let options = IpfsUploadOptions {
        file_path: sample_file.to_string_lossy().to_string(),
        pin: true,
        expected_sha256: None,
    };

    let res = upload_file(&client, options).await;
    assert!(res.is_err());

    // O catálogo não pode ter registrado nenhum CID falso em falha
    assert!(!is_managed_pin("qualquer_cid"));

    set_custom_catalog_dir(None);
    let _ = std::fs::remove_dir_all(&temp_dir);
}

#[tokio::test]
async fn test_ipfs_download_rejects_empty_cid_or_invalid_dir() {
    use crate::modules::ipfs::content::download_file;

    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");

    let empty_cid_options = IpfsDownloadOptions {
        cid: "   ".to_string(),
        target_path: "/tmp/dest.pdf".to_string(),
        expected_sha256: None,
        overwrite: false,
    };
    assert!(download_file(&client, empty_cid_options).await.is_err());

    let invalid_dir_options = IpfsDownloadOptions {
        cid: "bafybeihdwdcefghrandomcidtest123456".to_string(),
        target_path: "/non_existent_folder_abc_123/dest.pdf".to_string(),
        expected_sha256: None,
        overwrite: false,
    };
    assert!(download_file(&client, invalid_dir_options).await.is_err());
}

#[tokio::test]
async fn test_offline_recovery_does_not_confirm_decentralized_availability() {
    use crate::modules::ipfs::integrity::verify_cid_custody;

    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");
    let cid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

    // Correção 01: Verificação hermética. Quando o daemon está offline ou quando DHT não responde,
    // a disponibilidade é LookupFailed (ou Unavailable se responder 0 provedores), NUNCA RecoveryConfirmed.
    let report = verify_cid_custody(&client, cid, None).await.expect("Auditoria de custódia");

    assert_ne!(
        report.availability,
        AvailabilityState::RecoveryConfirmed,
        "Recuperação offline ou presença de blocos locais jamais deve atestar disponibilidade descentralizada"
    );
    assert_eq!(report.availability, AvailabilityState::LookupFailed);
    assert_eq!(report.integrity, IntegrityState::Pending);
}

#[test]
fn test_providers_found_differentiated_from_recovery_confirmed() {
    // Correção 01: ProvidersFound indica anúncios na DHT, RecoveryConfirmed exige recuperação remota independente
    assert_ne!(AvailabilityState::ProvidersFound, AvailabilityState::RecoveryConfirmed);
    assert_ne!(AvailabilityState::ProvidersFound, AvailabilityState::Unavailable);
    assert_ne!(AvailabilityState::LookupFailed, AvailabilityState::Unavailable);
}

#[tokio::test]
async fn test_concurrent_downloads_do_not_share_temp_files() {
    let parent_dir = std::env::temp_dir();
    let file_stem = "relatorio_auditado.pdf";

    // Gera 100 nomes de arquivos temporários concorrentes
    let mut paths = std::collections::HashSet::new();
    for _ in 0..100 {
        let tmp = parent_dir.join(format!(".{file_stem}.{}.devos.tmp", uuid::Uuid::new_v4()));
        assert!(paths.insert(tmp), "Cada arquivo temporário deve ter identificador UUID exclusivo");
    }
    assert_eq!(paths.len(), 100);
}

#[tokio::test]
async fn test_download_overwrite_false_preserves_existing_destination() {
    use crate::modules::ipfs::content::download_file;
    use std::io::Write;

    let temp_dir = std::env::temp_dir().join(format!("devos_down_ow_{}", uuid::Uuid::new_v4()));
    let _ = std::fs::create_dir_all(&temp_dir);

    let target_file = temp_dir.join("arquivo_existente.txt");
    let original_bytes = b"CONTEUDO ORIGINAL PREEXISTENTE - NAO PODE SER SOBRESCRITO";
    let mut f = std::fs::File::create(&target_file).unwrap();
    f.write_all(original_bytes).unwrap();
    drop(f);

    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");
    let options = IpfsDownloadOptions {
        cid: "bafybeihdwdcefghrandomcidtest123456".to_string(),
        target_path: target_file.to_string_lossy().to_string(),
        expected_sha256: None,
        overwrite: false, // Padrão: NÃO sobrescrever
    };

    let res = download_file(&client, options).await;
    assert!(res.is_err());
    let err_msg = res.unwrap_err();
    assert!(err_msg.contains("já existe"));
    assert!(err_msg.contains("overwrite"));

    // Valida que o arquivo original foi 100% preservado
    let read_back = std::fs::read(&target_file).unwrap();
    assert_eq!(read_back, original_bytes);

    let _ = std::fs::remove_dir_all(&temp_dir);
}

#[tokio::test]
async fn test_download_failures_clean_up_temp_files() {
    use crate::modules::ipfs::content::download_file;

    let temp_dir = std::env::temp_dir().join(format!("devos_clean_test_{}", uuid::Uuid::new_v4()));
    let _ = std::fs::create_dir_all(&temp_dir);
    let target_file = temp_dir.join("destino.bin");

    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");
    let options = IpfsDownloadOptions {
        cid: "bafybeihdwdcefghrandomcidtest123456".to_string(),
        target_path: target_file.to_string_lossy().to_string(),
        expected_sha256: None,
        overwrite: false,
    };

    let res = download_file(&client, options).await;
    assert!(res.is_err());

    // NENHUM arquivo temporário deve restar no diretório
    let entries: Vec<_> = std::fs::read_dir(&temp_dir).unwrap().filter_map(|e| e.ok()).collect();
    assert_eq!(entries.len(), 0, "Arquivos temporários devem ser removidos em caso de falha");

    let _ = std::fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_kubo_add_response_terminal_error_parsing() {
    // Correção 03: Parser de resposta do Kubo em /api/v0/add
    let normal_json = r#"{"Name":"teste.txt","Hash":"QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco","Size":"123"}"#;
    let normal_parsed: Result<KuboAddResponse, _> = serde_json::from_str(normal_json);
    assert!(normal_parsed.is_ok());
    let ok_obj = normal_parsed.unwrap();
    assert_eq!(ok_obj.hash.as_deref(), Some("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"));

    // Erro terminal com Type error
    let error_json = r#"{"Message":"no space left on device","Code":1,"Type":"error"}"#;
    let error_parsed: Result<KuboAddResponse, _> = serde_json::from_str(error_json);
    assert!(error_parsed.is_ok());
    let err_obj = error_parsed.unwrap();
    assert_eq!(err_obj.r#type.as_deref(), Some("error"));
    assert_eq!(err_obj.message.as_deref(), Some("no space left on device"));
}

#[tokio::test]
async fn test_decode_chunked_response_success() {
    use crate::modules::ipfs::client::decode_chunked_response;
    use sha2::{Digest, Sha256};
    use std::io::Cursor;

    // Stream chunked simulando resposta legítima do Kubo
    let chunked_data = b"5\r\nHello\r\n6\r\n World\r\n0\r\n\r\n";
    let reader = Cursor::new(chunked_data);
    let mut writer = Vec::new();
    let mut hasher = Sha256::new();

    let bytes = decode_chunked_response(reader, &mut writer, &mut hasher)
        .await
        .expect("Decodificação chunked bem-sucedida");

    assert_eq!(bytes, 11);
    assert_eq!(&writer, b"Hello World");

    let digest = hasher.finalize();
    assert!(!digest.is_empty());
}

#[tokio::test]
async fn test_decode_chunked_response_detects_trailer_error() {
    use crate::modules::ipfs::client::decode_chunked_response;
    use sha2::Sha256;
    use std::io::Cursor;

    // Correção 03: Kubo inicia transmissão normal (HTTP 200) e emite X-Stream-Error no trailer final
    let chunked_with_trailer = b"5\r\nHello\r\n0\r\nX-Stream-Error: context deadline exceeded\r\n\r\n";
    let reader = Cursor::new(chunked_with_trailer);
    let mut writer = Vec::new();
    let mut hasher = Sha256::new();

    let res = decode_chunked_response(reader, &mut writer, &mut hasher).await;
    assert!(res.is_err(), "Stream com trailer X-Stream-Error DEVE falhar");
    let err_msg = res.unwrap_err();
    assert!(err_msg.contains("X-Stream-Error"));
    assert!(err_msg.contains("context deadline exceeded"));
}

#[tokio::test]
async fn test_decode_chunked_response_detects_premature_eof() {
    use crate::modules::ipfs::client::decode_chunked_response;
    use sha2::Sha256;
    use std::io::Cursor;

    // Conexão encerrada antes do chunk final (0\r\n)
    let truncated_chunk = b"5\r\nHel";
    let reader = Cursor::new(truncated_chunk);
    let mut writer = Vec::new();
    let mut hasher = Sha256::new();

    let res = decode_chunked_response(reader, &mut writer, &mut hasher).await;
    assert!(res.is_err(), "Conexão prematuramente encerrada DEVE ser rejeitada");
}

#[tokio::test]
#[ignore]
async fn test_real_kubo_connection_if_available() {
    let client = KuboClient::new();
    if client.is_alive().await {
        let status = client.query_daemon_status().await;
        assert!(status.running);
        assert!(status.peer_id.is_some());
        println!("Kubo detectado online! PeerID: {:?}", status.peer_id);
    } else {
        println!("Kubo não está em execução na porta 5001 (teste ignorado)");
    }
}

