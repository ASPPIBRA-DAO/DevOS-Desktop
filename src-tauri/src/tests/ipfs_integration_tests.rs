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
