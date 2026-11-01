//! Testes unitários e de integração do Módulo IPFS / DePIN.
//!
//! REQUISITO DE HOMOLOGAÇÃO:
//! Os testes de `cargo test` não dependem de um daemon Kubo instalado ou ativo na máquina.
//! A resiliência a nós offline e a computação determinística dos desafios são validadas
//! em ambiente hermético. Testes com nós reais utilizam a anotação `#[ignore]`.

use crate::commands::ipfs_commands::*;
use crate::modules::ipfs::client::KuboClient;
use crate::modules::ipfs::models::*;

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
async fn test_safe_unpin_rejects_unmanaged_pin_without_force() {
    use crate::modules::ipfs::pinning::safe_unpin;

    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");
    let unmanaged_cid = "bafybeihdwdcefghrandomcidtest123456";

    // Sem force_external = true, a remocao de um CID nao catalogado DEVE ser rejeitada
    let res = safe_unpin(&client, unmanaged_cid, true, false).await;
    assert!(res.is_err());
    let err_msg = res.unwrap_err();
    assert!(err_msg.contains("não é gerenciado pelo DevOS"));
    assert!(err_msg.contains("force_external_unpin = true"));
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
async fn test_ipfs_download_rejects_empty_cid_or_invalid_dir() {
    use crate::modules::ipfs::content::download_file;

    let client = KuboClient::with_base_url("http://127.0.0.1:59999/api/v0");

    let empty_cid_options = IpfsDownloadOptions {
        cid: "   ".to_string(),
        target_path: "/tmp/dest.pdf".to_string(),
        expected_sha256: None,
    };
    assert!(download_file(&client, empty_cid_options).await.is_err());

    let invalid_dir_options = IpfsDownloadOptions {
        cid: "bafybeihdwdcefghrandomcidtest123456".to_string(),
        target_path: "/non_existent_folder_abc_123/dest.pdf".to_string(),
        expected_sha256: None,
    };
    assert!(download_file(&client, invalid_dir_options).await.is_err());
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

