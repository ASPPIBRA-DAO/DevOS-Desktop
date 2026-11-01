//! Módulo de auditoria de integridade, custódia e disponibilidade de CIDs.
//!
//! Consolida a matriz dos três indicadores do DevOS:
//! 1. Integridade: PENDENTE | CONFIRMADA | REPROVADA (SHA-256 original == SHA-256 recuperado).
//! 2. Custódia Local: NÃO FIXADO | PIN DIRETO | PIN RECURSIVO | PIN INCOMPLETO.
//! 3. Disponibilidade Descentralizada: NÃO VERIFICADA | PROVIDERS ENCONTRADOS | RECUPERAÇÃO CONFIRMADA | INDISPONÍVEL.

use sha2::{Digest, Sha256};

use super::client::KuboClient;
use super::content::normalize_hex_hash;
use super::models::{
    AvailabilityState, CustodyState, IntegrityState, IpfsAllPinsVerifyResult,
    IpfsCidCustodyStatus, IpfsPinType,
};
use super::pinning::{is_managed_pin, list_managed_pins};

/// Executa a auditoria completa de custódia e integridade para um CID específico.
pub async fn verify_cid_custody(
    client: &KuboClient,
    cid: &str,
    expected_sha256: Option<String>,
) -> Result<IpfsCidCustodyStatus, String> {
    if cid.trim().is_empty() {
        return Err("CID de conteúdo ausente ou vazio.".to_string());
    }

    // 1. Identificar se o CID é gerenciado pelo DevOS e buscar checksum original registrado
    let is_managed = is_managed_pin(cid);
    let registered_sha256 = if is_managed {
        list_managed_pins()
            .into_iter()
            .find(|r| r.cid == cid)
            .map(|r| r.original_sha256)
    } else {
        None
    };

    let target_expected_sha256 = expected_sha256.or(registered_sha256);

    // 2. Consulta de pin local (/api/v0/pin/ls?arg=<cid>&type=all)
    let pin_type_res = client.pin_ls(cid).await;
    let mut custody = match pin_type_res {
        Ok(Some(IpfsPinType::Direct)) => CustodyState::DirectPin,
        Ok(Some(IpfsPinType::Recursive)) | Ok(Some(IpfsPinType::Indirect)) => CustodyState::RecursivePin,
        Ok(None) => CustodyState::NotPinned,
        Err(e) => {
            log::warn!("[IPFS Integrity] Falha ao consultar pin_ls para {cid}: {e}");
            CustodyState::NotPinned
        }
    };

    // 3. Teste de recuperação local em modo offline (/api/v0/cat?arg=<cid>&offline=true)
    // Atribui estritamente a custódia local de blocos e extrai os bytes para cálculo de integridade.
    let mut recovered_sha256 = None;
    let mut local_recovery_ok = false;
    let mut dev_null = std::io::sink();
    let mut hasher = Sha256::new();

    if let Ok(bytes) = client.cat_to_writer(cid, true, &mut dev_null, &mut hasher).await {
        if bytes > 0 {
            let digest = hasher.finalize();
            recovered_sha256 = Some(format!("0x{}", hex::encode(digest)));
            local_recovery_ok = true;
        }
    }

    // Se o conteúdo estava supostamente fixado mas a recuperação local offline falhou, pin incompleto!
    if !local_recovery_ok && (custody == CustodyState::RecursivePin || custody == CustodyState::DirectPin) {
        custody = CustodyState::IncompletePin;
    }

    // 4. Avaliação do Indicador 1: Integridade
    let integrity = match (&recovered_sha256, &target_expected_sha256) {
        (Some(rec), Some(exp)) => {
            if rec == &normalize_hex_hash(exp) {
                IntegrityState::Confirmed
            } else {
                IntegrityState::Failed
            }
        }
        _ => IntegrityState::Pending,
    };

    // 5. Consulta de disponibilidade na rede (/api/v0/routing/findprovs)
    // Avalia disponibilidade descentralizada real na DHT sem confundir com a presença de blocos locais.
    let providers_res = client.routing_findprovs(cid, 5).await;
    let (availability, providers_count) = match providers_res {
        Ok(providers) => {
            let count = providers.len() as u32;
            let state = if count > 0 {
                AvailabilityState::ProvidersFound
            } else {
                AvailabilityState::Unavailable
            };
            (state, count)
        }
        Err(e) => {
            log::warn!("[IPFS Integrity] Falha ao consultar provedores na DHT para {cid}: {e}");
            (AvailabilityState::LookupFailed, 0)
        }
    };

    Ok(IpfsCidCustodyStatus {
        cid: cid.to_string(),
        integrity,
        custody,
        availability,
        original_sha256: target_expected_sha256,
        recovered_sha256,
        providers_count,
        is_managed_by_devos: is_managed,
    })
}

/// Executa a auditoria de integridade de todos os pins recursivos do repositório local.
pub async fn verify_all_pins(client: &KuboClient) -> Result<IpfsAllPinsVerifyResult, String> {
    client.pin_verify(true).await
}
