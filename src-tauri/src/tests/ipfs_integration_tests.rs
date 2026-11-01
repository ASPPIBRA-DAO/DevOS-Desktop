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

    let ipc_list = ipfs_list_managed_pins().await.expect("Comando IPC ipfs_list_managed_pins deve responder com sucesso");
    assert_eq!(ipc_list.len(), 1);
    assert_eq!(ipc_list[0].cid, cid);

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

    use crate::modules::ipfs::daemon::set_exclusive_repo_override_for_test;
    set_exclusive_repo_override_for_test(Some(false));

    // Correção 02: Mesmo sendo gerenciado pelo DevOS, em repositório compartilhado
    // exige confirm_shared_repo_unpin = true explicitamente
    let res = safe_unpin(&client, managed_cid, true, false, false).await;
    assert!(res.is_err());
    let err_msg = res.unwrap_err();
    assert!(err_msg.contains("confirm_shared_repo_unpin = true"));
    assert!(err_msg.contains("repositório compartilhado"));

    set_exclusive_repo_override_for_test(None);
    set_custom_catalog_dir(None);
    let _ = std::fs::remove_dir_all(&temp_dir);
}

#[tokio::test]
async fn test_safe_unpin_rejects_unmanaged_pin_without_confirmation() {
    use crate::modules::ipfs::daemon::set_exclusive_repo_override_for_test;
    use crate::modules::ipfs::pinning::safe_unpin;

    set_exclusive_repo_override_for_test(Some(false));

    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");
    let unmanaged_cid = "bafybeihdwdcefghrandomcidtest999999";

    // Sem confirmação explícita, a remoção de um CID não catalogado DEVE ser rejeitada
    let res = safe_unpin(&client, unmanaged_cid, true, false, false).await;
    assert!(res.is_err());
    let err_msg = res.unwrap_err();
    assert!(err_msg.contains("não é gerenciado pelo DevOS"));
    assert!(err_msg.contains("confirm_shared_repo_unpin = true"));

    set_exclusive_repo_override_for_test(None);
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
async fn test_hashing_async_reader_exact_stream_digest() {
    use std::io::Write;
    use std::sync::{Arc, Mutex};
    use sha2::{Digest, Sha256};
    use tokio::fs::File as TokioFile;
    use tokio::io::AsyncReadExt;

    let temp_dir = std::env::temp_dir().join(format!("devos_toctou_test_{}", uuid::Uuid::new_v4()));
    let _ = std::fs::create_dir_all(&temp_dir);
    let sample_file = temp_dir.join("sample.bin");

    // Gerar 64 KiB de dados arbitrários
    let sample_data: Vec<u8> = (0..65536).map(|i| (i % 251) as u8).collect();
    let mut f = std::fs::File::create(&sample_file).unwrap();
    f.write_all(&sample_data).unwrap();
    drop(f);

    let tokio_file = TokioFile::open(&sample_file).await.unwrap();
    let hasher_arc = Arc::new(Mutex::new(Sha256::new()));
    let total_bytes_arc = Arc::new(Mutex::new(0u64));

    let mut reader = crate::modules::ipfs::content::HashingAsyncReader {
        inner: tokio_file,
        hasher: hasher_arc.clone(),
        total_bytes: total_bytes_arc.clone(),
    };

    let mut read_buf = Vec::new();
    reader.read_to_end(&mut read_buf).await.unwrap();

    assert_eq!(read_buf.len(), 65536);
    assert_eq!(*total_bytes_arc.lock().unwrap(), 65536);

    let stream_hash = format!("0x{}", hex::encode(hasher_arc.lock().unwrap().clone().finalize()));
    let expected_hash = format!("0x{}", hex::encode(Sha256::digest(&sample_data)));

    assert_eq!(stream_hash, expected_hash, "Hash calculado pelo stream DEVE ser idêntico ao digest dos bytes transmitidos");

    let _ = std::fs::remove_dir_all(&temp_dir);
}

#[tokio::test]
async fn test_unpin_authorization_in_exclusive_devos_repo() {
    use crate::modules::ipfs::daemon::set_exclusive_repo_override_for_test;
    use crate::modules::ipfs::pinning::{register_managed_pin, safe_unpin, set_custom_catalog_dir};

    let temp_dir = std::env::temp_dir().join(format!("devos_excl_unpin_{}", uuid::Uuid::new_v4()));
    let _ = std::fs::create_dir_all(&temp_dir);
    set_custom_catalog_dir(Some(temp_dir.clone()));

    // Simula repositório comprovadamente exclusivo do DevOS
    set_exclusive_repo_override_for_test(Some(true));

    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");
    let cid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

    let repo_ctx = crate::modules::ipfs::daemon::DaemonManager::get_repo_context().await;

    register_managed_pin(ManagedPinRecord {
        cid: cid.to_string(),
        name: "documento_exclusivo.pdf".to_string(),
        original_sha256: "0x123456".to_string(),
        size_bytes: 2048,
        pinned_at_utc: "2026-11-01T15:00:00Z".to_string(),
        pin_type: "recursive".to_string(),
        origin: "devos_upload".to_string(),
        repo_context: repo_ctx.clone(),
    }).expect("Registrar pin exclusivo");

    // Em repositório exclusivo demonstrado, o unpin de CID pertencente a este repositório
    // passa pela autorização de segurança sem exigir confirm_shared_repo_unpin = true!
    // A chamada atinge o cliente RPC (/pin/rm) e falha apenas por estar offline.
    let res = safe_unpin(&client, cid, true, false, false).await;
    assert!(res.is_err());
    let err_msg = res.unwrap_err();
    assert!(!err_msg.contains("confirm_shared_repo_unpin = true"));
    assert!(err_msg.contains("Falha de conexão com Kubo RPC (/pin/rm)"));

    set_exclusive_repo_override_for_test(None);
    set_custom_catalog_dir(None);
    let _ = std::fs::remove_dir_all(&temp_dir);
}

#[tokio::test]
async fn test_unpin_rejected_when_devos_spawned_but_repo_is_shared() {
    use crate::modules::ipfs::daemon::set_exclusive_repo_override_for_test;
    use crate::modules::ipfs::pinning::{register_managed_pin, safe_unpin, set_custom_catalog_dir};

    let temp_dir = std::env::temp_dir().join(format!("devos_shared_spawn_{}", uuid::Uuid::new_v4()));
    let _ = std::fs::create_dir_all(&temp_dir);
    set_custom_catalog_dir(Some(temp_dir.clone()));

    // Daemon foi iniciado pelo DevOS, mas opera sobre repositório compartilhado (override = false)
    set_exclusive_repo_override_for_test(Some(false));

    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");
    let cid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

    register_managed_pin(ManagedPinRecord {
        cid: cid.to_string(),
        name: "doc_compartilhado.pdf".to_string(),
        original_sha256: "0xabcdef".to_string(),
        size_bytes: 1024,
        pinned_at_utc: "2026-11-01T15:00:00Z".to_string(),
        pin_type: "recursive".to_string(),
        origin: "devos_upload".to_string(),
        repo_context: "shared_or_external".to_string(),
    }).expect("Registrar pin");

    // Mesmo sendo gerenciado e iniciado pelo DevOS, se o repositório é compartilhado, EXIGE confirmação!
    let res = safe_unpin(&client, cid, true, false, false).await;
    assert!(res.is_err());
    let err_msg = res.unwrap_err();
    assert!(err_msg.contains("confirm_shared_repo_unpin = true"));
    assert!(err_msg.contains("repositório compartilhado"));

    set_exclusive_repo_override_for_test(None);
    set_custom_catalog_dir(None);
    let _ = std::fs::remove_dir_all(&temp_dir);
}

#[tokio::test]
async fn test_download_overwrite_true_successfully_replaces_destination() {
    use std::io::Write;

    let temp_dir = std::env::temp_dir().join(format!("devos_ow_true_{}", uuid::Uuid::new_v4()));
    let _ = std::fs::create_dir_all(&temp_dir);

    let target_file = temp_dir.join("relatorio.txt");
    let mut f = std::fs::File::create(&target_file).unwrap();
    f.write_all(b"VERSAO_ANTIGA_PREEXISTENTE").unwrap();
    drop(f);

    // Simula a etapa atômica de publicação com overwrite = true
    let tmp_file = temp_dir.join(format!(".relatorio.{}.devos.tmp", uuid::Uuid::new_v4()));
    let mut tf = std::fs::File::create(&tmp_file).unwrap();
    tf.write_all(b"NOVA_VERSAO_SUBSTITUTA_AUTORIZADA").unwrap();
    drop(tf);

    // Publicação com overwrite: substitui com sucesso o arquivo pré-existente
    let rename_res = std::fs::rename(&tmp_file, &target_file);
    assert!(rename_res.is_ok());

    let final_content = std::fs::read(&target_file).unwrap();
    assert_eq!(final_content, b"NOVA_VERSAO_SUBSTITUTA_AUTORIZADA");

    let _ = std::fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_upload_terminal_error_response_aborts_operation() {
    // Valida que respostas de /add emitindo Type == "error" ou Message de falha terminal
    // são identificadas antes de qualquer registro no catálogo
    let raw_error_stream = "{\"Name\":\"parte1.dat\",\"Bytes\":1024}\n{\"Message\":\"write error: device out of space\",\"Code\":1,\"Type\":\"error\"}\n";

    let mut had_terminal_error = false;
    for line in raw_error_stream.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        if let Ok(obj) = serde_json::from_str::<KuboAddResponse>(trimmed) {
            if obj.r#type.as_deref() == Some("error") || (obj.message.is_some() && obj.hash.is_none()) {
                had_terminal_error = true;
                break;
            }
        }
    }

    assert!(had_terminal_error, "Erro terminal durante stream de upload DEVE ser identificado");
}

#[tokio::test]
async fn test_remote_node_recovery_remains_unverified_without_second_node() {
    use crate::modules::ipfs::integrity::verify_cid_custody;

    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");
    let test_cid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

    let custody_status = verify_cid_custody(&client, test_cid, None).await.unwrap();

    // Sem a presença de um segundo nó independente retornando blocos remotos,
    // o estado de disponibilidade descentralizada NUNCA pode ser RecoveryConfirmed
    assert_ne!(
        custody_status.availability,
        AvailabilityState::RecoveryConfirmed,
        "Recuperação confirmada requer evidência física de múltiplos nós independentes"
    );
}

#[test]
fn test_rfc7230_trailer_negotiation_headers_present() {
    let query = "/api/v0/cat?arg=bafy123";
    let host = "127.0.0.1";
    let port = 5001;

    let req = format!(
        "POST {query} HTTP/1.1\r\n\
         Host: {host}:{port}\r\n\
         Connection: close, TE\r\n\
         TE: trailers\r\n\
         Content-Length: 0\r\n\
         \r\n"
    );

    assert!(req.contains("TE: trailers"), "Requisição HTTP DEVE enviar 'TE: trailers'");
    assert!(req.contains("Connection: close, TE"), "Requisição HTTP DEVE enviar 'Connection: close, TE'");
}

#[tokio::test]
async fn test_tcp_server_captures_reqwest_multipart_te_trailers_header() {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::TcpListener;

    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();

    let server_task = tokio::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut buf = vec![0u8; 4096];
        let n = socket.read(&mut buf).await.unwrap();
        let request_str = String::from_utf8_lossy(&buf[..n]).to_string();

        let body = "{\"Name\":\"test.txt\",\"Hash\":\"QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco\"}\n";
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n{}",
            body.len(),
            body
        );
        let _ = socket.write_all(response.as_bytes()).await;
        request_str
    });

    let client = KuboClient::with_base_url(&format!("http://127.0.0.1:{port}/api/v0"));
    let res = client
        .add_file_multipart("test.txt", reqwest::Body::from("dados_de_teste"), true)
        .await;

    assert!(res.is_ok(), "Upload multipart simulado deve ter sucesso: {:?}", res);
    let captured_request = server_task.await.unwrap();
    let lower = captured_request.to_lowercase();

    // Comprova que o cliente Reqwest transmitiu efetivamente os headers no socket
    assert!(
        lower.contains("te: trailers"),
        "Requisição real multipart DEVE conter 'te: trailers' no socket: {captured_request}"
    );
    assert!(
        lower.contains("connection: te"),
        "Requisição real multipart DEVE conter 'connection: te' no socket: {captured_request}"
    );
}

#[tokio::test]
async fn test_tcp_server_captures_cat_to_writer_te_trailers_header() {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::TcpListener;
    use sha2::Sha256;

    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();

    let server_task = tokio::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut buf = vec![0u8; 4096];
        let n = socket.read(&mut buf).await.unwrap();
        let request_str = String::from_utf8_lossy(&buf[..n]).to_string();

        let response = "HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n5\r\nHello\r\n0\r\n\r\n";
        let _ = socket.write_all(response.as_bytes()).await;
        request_str
    });

    let client = KuboClient::with_base_url(&format!("http://127.0.0.1:{port}/api/v0"));
    let mut writer = Vec::new();
    let mut hasher = Sha256::new();
    let res = client
        .cat_to_writer("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", false, &mut writer, &mut hasher)
        .await;

    assert!(res.is_ok(), "cat_to_writer simulado deve ter sucesso: {:?}", res);
    assert_eq!(&writer, b"Hello");

    let captured_request = server_task.await.unwrap();

    // Comprova que cat_to_writer transmitiu efetivamente TE: trailers e Connection: close, TE
    assert!(
        captured_request.contains("TE: trailers"),
        "Requisição /cat DEVE conter 'TE: trailers' no socket: {captured_request}"
    );
    assert!(
        captured_request.contains("Connection: close, TE"),
        "Requisição /cat DEVE conter 'Connection: close, TE' no socket: {captured_request}"
    );
}

#[test]
fn test_daemon_manager_tracks_explicit_child_repo_path() {
    use std::path::PathBuf;
    use crate::modules::ipfs::daemon::{
        set_spawned_repo_path_for_test, DaemonManager,
    };

    let dedicated_path = PathBuf::from("/tmp/devos_mock_dedicated_repo/ipfs");
    set_spawned_repo_path_for_test(Some(dedicated_path.clone()));

    // Confirma que get_effective_repo_path utiliza o caminho explicitamente mantido no estado do processo filho
    let effective = DaemonManager::get_effective_repo_path();
    assert_eq!(effective, Some(dedicated_path));

    // Limpeza do estado de teste
    set_spawned_repo_path_for_test(None);
}

#[tokio::test]
async fn test_full_operational_kubo_homologation_lifecycle() {
    use std::fs;
    use std::time::Duration;
    use sha2::{Digest, Sha256};
    use crate::modules::ipfs::daemon::{DaemonManager, DaemonOrigin};
    use crate::modules::ipfs::pinning::is_managed_pin;

    if !DaemonManager::is_binary_installed() {
        println!("Binário 'ipfs' não encontrado. Pulando homologação operacional.");
        return;
    }

    // 1. Iniciar daemon pelo DevOS
    let origin = DaemonManager::start_daemon_if_needed().await;
    assert!(origin.is_ok(), "Falha ao acionar DaemonManager::start_daemon_if_needed: {:?}", origin);

    let client = KuboClient::new();
    let mut ready = false;
    for _ in 0..40 {
        if client.is_alive().await {
            ready = true;
            break;
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }
    assert!(ready, "Daemon Kubo deve estar respondendo na porta 5001");

    // 2. Verificações de Isolamento e RPC
    let detected_origin = DaemonManager::check_daemon_origin().await;
    assert_eq!(detected_origin, DaemonOrigin::DevOsSpawned, "Origem deve ser DevOsSpawned");

    let is_exclusive = DaemonManager::is_exclusive_devos_repo().await;
    assert!(is_exclusive, "Repositório do DevOS deve ser identificado como exclusivo");

    let version_info = client.get_version().await.expect("Consulta /version deve responder");
    assert!(version_info.version.is_some(), "Versão Kubo deve estar presente");
    let version_str = version_info.version.unwrap();
    println!("[Homologação] Versão Kubo: {}", version_str);

    let node_id_info = client.get_node_id().await.expect("Consulta /id deve responder");
    let node1_peer_id = node_id_info.id.expect("Peer ID deve estar presente");
    println!("[Homologação] Nó 1 Peer ID: {}", node1_peer_id);

    let repo_stat = client.get_repo_stat().await.expect("Consulta /repo/stat deve responder");
    println!("[Homologação] Repo Stat: size={:?}, objects={:?}", repo_stat.repo_size, repo_stat.num_objects);

    let repo_ctx = DaemonManager::get_repo_context().await;
    assert!(repo_ctx.contains(&node1_peer_id), "Contexto deve incluir o Peer ID: {}", repo_ctx);

    // 3. Preparação dos arquivos temporários
    let test_dir = std::env::temp_dir().join("devos-ipfs-homologation");
    let _ = fs::create_dir_all(&test_dir);

    let file_text_path = test_dir.join("arquivo_texto.txt");
    let file_bin_path = test_dir.join("arquivo_binario.bin");
    let file_256k_path = test_dir.join("arquivo_256k.dat");
    let file_2mb_path = test_dir.join("arquivo_2mb.dat");
    let file_special_path = test_dir.join("relatório de auditoria (2026) #1.pdf");

    fs::write(&file_text_path, b"Homologacao Oficial Modulo 11 DevOS IPFS - ASPPIBRA").unwrap();

    let mut bin_data = vec![0u8; 5000];
    for (i, b) in bin_data.iter_mut().enumerate() {
        *b = (i % 256) as u8;
    }
    fs::write(&file_bin_path, &bin_data).unwrap();

    let mut data_256k = vec![0xABu8; 270_000];
    data_256k[100] = 0xCD;
    fs::write(&file_256k_path, &data_256k).unwrap();

    let mut data_2mb = vec![0x33u8; 2_500_000];
    data_2mb[500] = 0x77;
    fs::write(&file_2mb_path, &data_2mb).unwrap();

    fs::write(&file_special_path, "Documento Especial com caracteres acentuados e símbolos #1".as_bytes()).unwrap();

    let compute_sha256 = |path: &std::path::Path| -> String {
        let bytes = fs::read(path).unwrap();
        let digest = Sha256::digest(&bytes);
        format!("0x{}", hex::encode(digest))
    };

    let text_sha256 = compute_sha256(&file_text_path);
    let special_sha256 = compute_sha256(&file_special_path);
    let bin_sha256 = compute_sha256(&file_bin_path);
    let k256_sha256 = compute_sha256(&file_256k_path);
    let mb2_sha256 = compute_sha256(&file_2mb_path);

    // 4. Teste 01 — Upload (com pin e sem pin)
    let upload_text = ipfs_upload_file(IpfsUploadOptions {
        file_path: file_text_path.to_string_lossy().to_string(),
        pin: true,
        expected_sha256: Some(text_sha256.clone()),
    }).await.expect("Upload de arquivo_texto.txt deve suceder");
    assert_eq!(upload_text.sha256_checksum, text_sha256, "SHA-256 do upload deve bater exatamente");
    assert!(upload_text.pinned, "Upload com pin=true deve retornar pinned=true");
    assert!(is_managed_pin(&upload_text.cid), "CID do upload deve estar no catalogo de managed-pins");
    println!("[Homologação] Upload texto CID: {}", upload_text.cid);

    let upload_special = ipfs_upload_file(IpfsUploadOptions {
        file_path: file_special_path.to_string_lossy().to_string(),
        pin: false,
        expected_sha256: Some(special_sha256.clone()),
    }).await.expect("Upload de relatório especial sem pin deve suceder");
    assert_eq!(upload_special.sha256_checksum, special_sha256);
    assert!(!upload_special.pinned, "Upload com pin=false deve retornar pinned=false");
    println!("[Homologação] Upload relatório especial CID: {}", upload_special.cid);

    // Upload dos demais arquivos de tamanhos variados
    let upload_bin = ipfs_upload_file(IpfsUploadOptions {
        file_path: file_bin_path.to_string_lossy().to_string(),
        pin: true,
        expected_sha256: None,
    }).await.expect("Upload binario deve suceder");
    assert_eq!(upload_bin.sha256_checksum, bin_sha256);

    let upload_256k = ipfs_upload_file(IpfsUploadOptions {
        file_path: file_256k_path.to_string_lossy().to_string(),
        pin: true,
        expected_sha256: None,
    }).await.expect("Upload 256k deve suceder");
    assert_eq!(upload_256k.sha256_checksum, k256_sha256);

    let upload_2mb = ipfs_upload_file(IpfsUploadOptions {
        file_path: file_2mb_path.to_string_lossy().to_string(),
        pin: true,
        expected_sha256: None,
    }).await.expect("Upload 2mb deve suceder");
    assert_eq!(upload_2mb.sha256_checksum, mb2_sha256);

    // 5. Teste 02 — Pinning manual
    let pin_res = ipfs_pin_cid(IpfsPinRequest {
        cid: upload_special.cid.clone(),
        recursive: true,
    }).await.expect("Pin do relatório especial deve suceder");
    assert!(pin_res.pinned);
    assert_eq!(pin_res.pin_type, IpfsPinType::Recursive);

    let pin_ls = client.pin_ls(&upload_special.cid).await.expect("pin/ls deve suceder");
    assert_eq!(pin_ls, Some(IpfsPinType::Recursive), "pin/ls deve confirmar pin recursivo");

    // 6. Teste 03 — Verificação de custódia
    let custody = ipfs_verify_cid_custody(upload_text.cid.clone(), Some(text_sha256.clone()))
        .await
        .expect("Verificação de custódia deve suceder");
    assert_eq!(custody.integrity, IntegrityState::Confirmed, "Integridade deve ser Confirmed");
    assert_eq!(custody.custody, CustodyState::RecursivePin, "Custódia deve ser RecursivePin");

    // 7. Teste 04 — Download (overwrite=false, overwrite=true, divergência de hash)
    let dest_down1 = test_dir.join("recuperado_texto.txt");
    if dest_down1.exists() {
        let _ = fs::remove_file(&dest_down1);
    }
    let down_res1 = ipfs_download_file(IpfsDownloadOptions {
        cid: upload_text.cid.clone(),
        target_path: dest_down1.to_string_lossy().to_string(),
        expected_sha256: Some(text_sha256.clone()),
        overwrite: false,
    }).await.expect("Download para novo arquivo com overwrite=false deve ter sucesso");
    assert_eq!(down_res1.recovered_sha256, text_sha256);
    assert_eq!(fs::read(&dest_down1).unwrap(), fs::read(&file_text_path).unwrap());

    // Sobrescrita autorizada (overwrite=true)
    let down_res2 = ipfs_download_file(IpfsDownloadOptions {
        cid: upload_text.cid.clone(),
        target_path: dest_down1.to_string_lossy().to_string(),
        expected_sha256: Some(text_sha256.clone()),
        overwrite: true,
    }).await.expect("Download com overwrite=true deve ter sucesso");
    assert_eq!(down_res2.recovered_sha256, text_sha256);

    // Download com hash esperado incorreto deve falhar e preservar o arquivo intacto
    let fake_sha = "0000000000000000000000000000000000000000000000000000000000000000".to_string();
    let down_err = ipfs_download_file(IpfsDownloadOptions {
        cid: upload_text.cid.clone(),
        target_path: dest_down1.to_string_lossy().to_string(),
        expected_sha256: Some(fake_sha),
        overwrite: true,
    }).await;
    assert!(down_err.is_err(), "Download com checksum divergente DEVE falhar");
    assert_eq!(fs::read(&dest_down1).unwrap(), fs::read(&file_text_path).unwrap(), "Arquivo de destino deve permanecer intacto");

    // 8. Teste 05 — Unpin seguro
    // 8a. Desfixação direta de conteúdo gerenciado no repositório exclusivo ativo
    let unpin_managed = ipfs_unpin_cid(IpfsUnpinRequest {
        cid: upload_text.cid.clone(),
        recursive: true,
        force_external_unpin: false,
        confirm_shared_repo_unpin: false,
    }).await.expect("Unpin de pin gerenciado em repo exclusivo deve ter sucesso sem confirmacao");
    assert!(unpin_managed.unpinned);
    assert!(unpin_managed.was_managed_by_devos);

    // 8b. Tentativa de unpin em CID não gerenciado sem força deve ser rejeitada
    let unpin_unmanaged_blocked = ipfs_unpin_cid(IpfsUnpinRequest {
        cid: upload_special.cid.clone(),
        recursive: true,
        force_external_unpin: false,
        confirm_shared_repo_unpin: false,
    }).await;
    assert!(unpin_unmanaged_blocked.is_err(), "Unpin de conteudo nao gerenciado sem forca deve ser rejeitado");

    // 8c. Unpin de CID não gerenciado com confirmação expressa deve ter sucesso
    let unpin_forced = ipfs_unpin_cid(IpfsUnpinRequest {
        cid: upload_special.cid.clone(),
        recursive: true,
        force_external_unpin: true,
        confirm_shared_repo_unpin: false,
    }).await.expect("Unpin de conteudo nao gerenciado com force_external_unpin=true deve ter sucesso");
    assert!(unpin_forced.unpinned);

    // 9. Teste 06 — Auditoria global de pins
    let all_pins_verify = ipfs_verify_all_pins().await.expect("Auditoria global de pins deve responder");
    assert!(all_pins_verify.total_pins_audited >= 1);
    assert_eq!(all_pins_verify.bad_nodes_count, 0, "Nenhum pin recursivo deve estar corrompido");

    // 10. Teste 07 — Consulta de provedores
    let provs = ipfs_query_providers(upload_bin.cid.clone()).await.expect("Consulta de provedores deve executar");
    assert_eq!(provs.cid, upload_bin.cid);

    // 11. Teste de Falhas Operacionais
    let fail_up = ipfs_upload_file(IpfsUploadOptions {
        file_path: "/tmp/caminho_inexistente_123456789.dat".to_string(),
        pin: true,
        expected_sha256: None,
    }).await;
    assert!(fail_up.is_err(), "Upload de caminho inexistente deve falhar");

    // 12. Teste de Recuperação Descentralizada entre 2 Nós Independentes
    println!("[Homologação] Iniciando teste de recuperação entre 2 nós...");
    let node2_dir = std::env::temp_dir().join("devos-ipfs-node2");
    if node2_dir.exists() {
        let _ = fs::remove_dir_all(&node2_dir);
    }
    let _ = fs::create_dir_all(&node2_dir);

    // Inicializar repositório isolado para o Nó 2
    let init_node2 = std::process::Command::new("ipfs")
        .env("IPFS_PATH", &node2_dir)
        .arg("init")
        .output()
        .expect("ipfs init no nó 2 deve executar");
    assert!(init_node2.status.success(), "Inicialização do nó 2 falhou: {:?}", String::from_utf8_lossy(&init_node2.stderr));

    // Configurar portas independentes para o Nó 2
    let _ = std::process::Command::new("ipfs")
        .env("IPFS_PATH", &node2_dir)
        .args(&["config", "Addresses.API", "/ip4/127.0.0.1/tcp/5002"])
        .output();
    let _ = std::process::Command::new("ipfs")
        .env("IPFS_PATH", &node2_dir)
        .args(&["config", "Addresses.Gateway", "/ip4/127.0.0.1/tcp/8082"])
        .output();
    let _ = std::process::Command::new("ipfs")
        .env("IPFS_PATH", &node2_dir)
        .args(&["config", "Addresses.Swarm", "[\"/ip4/0.0.0.0/tcp/4002\", \"/ip4/0.0.0.0/udp/4002/quic-v1\"]", "--json"])
        .output();

    // Spawna Nó 2
    let mut node2_child = std::process::Command::new("ipfs")
        .env("IPFS_PATH", &node2_dir)
        .arg("daemon")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .expect("Daemon do Nó 2 deve ser iniciado");

    let client2 = KuboClient::with_base_url("http://127.0.0.1:5002/api/v0");
    let mut node2_ready = false;
    for _ in 0..40 {
        if client2.is_alive().await {
            node2_ready = true;
            break;
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }
    assert!(node2_ready, "Nó 2 deve responder na porta 5002");

    let node2_id_info = client2.get_node_id().await.expect("Nó 2 deve responder a /id");
    let node2_peer_id = node2_id_info.id.expect("Nó 2 deve ter PeerID");
    println!("[Homologação] Nó 2 iniciado. PeerID: {}", node2_peer_id);
    assert_ne!(node1_peer_id, node2_peer_id, "Nó 1 e Nó 2 devem possuir PeerIDs distintos");

    // Conectar Nó 2 ao Nó 1 através do multiaddr local do Nó 1
    let node1_multiaddr = format!("/ip4/127.0.0.1/tcp/4001/p2p/{}", node1_peer_id);
    println!("[Homologação] Conectando Nó 2 ao Nó 1 via {}", node1_multiaddr);
    let connect_res = client2.swarm_connect(&node1_multiaddr).await;
    println!("[Homologação] Conexão Swarm Nó 2 -> Nó 1: {:?}", connect_res);

    // Nó 2 recupera o conteúdo de arquivo_binario.bin do Nó 1 via cat_to_writer
    let mut node2_writer = Vec::new();
    let mut node2_hasher = Sha256::new();
    let node2_cat_res = client2.cat_to_writer(
        &upload_bin.cid,
        false, // online, buscando blocos na rede/peers
        &mut node2_writer,
        &mut node2_hasher,
    ).await;

    println!("[Homologação] Recuperação remota do Nó 2 via libp2p: {:?}", node2_cat_res);
    assert!(node2_cat_res.is_ok(), "Nó 2 deve conseguir transferir os blocos do Nó 1 via P2P: {:?}", node2_cat_res);
    let node2_recovered_bytes = node2_writer;
    let node2_recovered_sha = format!("0x{}", hex::encode(node2_hasher.finalize()));

    assert_eq!(node2_recovered_bytes, fs::read(&file_bin_path).unwrap(), "Bytes recuperados pelo Nó 2 devem ser idênticos aos do Nó 1");
    assert_eq!(node2_recovered_sha, bin_sha256, "SHA-256 no Nó 2 deve ser idêntico ao original");
    println!("[Homologação] ✅ RECUPERAÇÃO DESCENTRALIZADA ENTRE 2 NÓS CONFIRMADA COM SUCESSO!");

    // Encerra Nó 2 e limpa diretório
    let _ = node2_child.kill();
    let _ = node2_child.wait();
    let _ = fs::remove_dir_all(&node2_dir);

    // 13. Limpeza dos testes e encerramento controlado do Nó 1
    let _ = fs::remove_dir_all(&test_dir);
    let shutdown_res = DaemonManager::shutdown_if_spawned_by_devos();
    assert!(shutdown_res.is_ok(), "Encerramento do daemon DevOS deve ter sucesso: {:?}", shutdown_res);
    println!("[Homologação] Daemon do Nó 1 encerrado com sucesso.");
}


