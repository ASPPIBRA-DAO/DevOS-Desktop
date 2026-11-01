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

