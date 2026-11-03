use chrono::{Duration as ChronoDuration, Utc};
use sha2::{Digest, Sha256};
use std::collections::VecDeque;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};
use thiserror::Error;
use uuid::Uuid;

use crate::modules::documents::models::{
    DocumentError, DocumentMetadata, DocumentOutput, DocumentScope,
};
use crate::platform::typst_engine::RenderedPagePreview;

/// Tempo de vida padrão de um preview em memória (30 minutos).
pub const DEFAULT_PREVIEW_TTL_SECS: u64 = 30 * 60;

/// Quantidade máxima padrão de previews retidos simultaneamente em memória.
pub const DEFAULT_MAX_PREVIEW_ENTRIES: usize = 16;

/// Limite máximo padrão de bytes de PDF acumulados no store em memória (64 MiB).
pub const DEFAULT_MAX_PREVIEW_TOTAL_BYTES: usize = 64 * 1024 * 1024;

#[derive(Error, Debug, Clone, PartialEq, Eq)]
pub enum PreviewStoreError {
    #[error("O preview solicitado não foi encontrado na sessão ativa.")]
    NotFound,

    #[error("A sessão de visualização do documento expirou. Gere a visualização novamente.")]
    Expired,

    #[error(
        "O hash SHA-256 informado não corresponde ao documento visualizado. Exportação bloqueada por segurança."
    )]
    ChecksumMismatch,

    #[error("Esta edição do aplicativo não está autorizada a exportar este documento.")]
    UnauthorizedScope,

    #[error("O documento gerado excede o limite de memória permitido para visualização.")]
    PayloadTooLarge,

    #[error("O buffer binário do documento não é um PDF válido.")]
    InvalidPdfBuffer,
}

impl PreviewStoreError {
    pub fn public_message(&self) -> String {
        self.to_string()
    }
}

/// Registro imutável de um documento compilado e retido temporariamente em memória
/// para visualização e posterior exportação verificada.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StoredDocumentPreview {
    pub preview_id: String,
    pub pdf_bytes: Vec<u8>,
    pub pages: Vec<RenderedPagePreview>,
    pub metadata: DocumentMetadata,
    pub sha256_checksum: String,
    pub created_at_utc: String,
    pub expires_at_utc: String,
    pub edition_scope: DocumentScope,
    pub export_count: usize,
    created_instant: Instant,
    ttl: Duration,
}

impl StoredDocumentPreview {
    pub fn is_expired_at(&self, now: Instant) -> bool {
        now.checked_duration_since(self.created_instant)
            .unwrap_or(Duration::ZERO)
            >= self.ttl
    }
}

#[derive(Debug, Default)]
struct PreviewStoreState {
    entries: VecDeque<StoredDocumentPreview>,
    total_bytes: usize,
}

/// Store concorrente estritamente em memória para sessões de preview documental.
///
/// Garante que o PDF visualizado na interface e o PDF exportado ao disco sejam
/// exatamente o mesmo artefato binário, verificado por SHA-256 e isolado por escopo.
#[derive(Clone, Debug)]
pub struct DocumentPreviewStore {
    inner: Arc<Mutex<PreviewStoreState>>,
    ttl: Duration,
    max_entries: usize,
    max_total_bytes: usize,
}

impl Default for DocumentPreviewStore {
    fn default() -> Self {
        Self::new()
    }
}

impl DocumentPreviewStore {
    pub fn new() -> Self {
        Self::with_limits(
            Duration::from_secs(DEFAULT_PREVIEW_TTL_SECS),
            DEFAULT_MAX_PREVIEW_ENTRIES,
            DEFAULT_MAX_PREVIEW_TOTAL_BYTES,
        )
    }

    pub fn with_limits(ttl: Duration, max_entries: usize, max_total_bytes: usize) -> Self {
        Self {
            inner: Arc::new(Mutex::new(PreviewStoreState::default())),
            ttl,
            max_entries: max_entries.max(1),
            max_total_bytes: max_total_bytes.max(1024),
        }
    }

    /// Armazena um `DocumentOutput` recém-compilado em memória e retorna o registro de preview.
    pub fn store_preview(
        &self,
        output: DocumentOutput,
        pages: Vec<RenderedPagePreview>,
        edition_scope: DocumentScope,
    ) -> Result<StoredDocumentPreview, PreviewStoreError> {
        if output.pdf_bytes.is_empty() || !output.pdf_bytes.starts_with(b"%PDF-") {
            return Err(PreviewStoreError::InvalidPdfBuffer);
        }

        let pdf_len = output.pdf_bytes.len();
        if pdf_len > self.max_total_bytes {
            return Err(PreviewStoreError::PayloadTooLarge);
        }

        let computed_sha256 = hex::encode(Sha256::digest(&output.pdf_bytes));
        if computed_sha256 != output.metadata.sha256_checksum.to_ascii_lowercase() {
            return Err(PreviewStoreError::ChecksumMismatch);
        }

        let now_instant = Instant::now();
        let now_utc = Utc::now();
        let ttl_chrono = ChronoDuration::from_std(self.ttl)
            .unwrap_or_else(|_| ChronoDuration::seconds(DEFAULT_PREVIEW_TTL_SECS as i64));
        let expires_utc = now_utc + ttl_chrono;

        let entry = StoredDocumentPreview {
            preview_id: Uuid::new_v4().to_string(),
            pdf_bytes: output.pdf_bytes,
            pages,
            metadata: output.metadata,
            sha256_checksum: computed_sha256,
            created_at_utc: now_utc.to_rfc3339(),
            expires_at_utc: expires_utc.to_rfc3339(),
            edition_scope,
            export_count: 0,
            created_instant: now_instant,
            ttl: self.ttl,
        };

        let mut guard = self
            .inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        Self::purge_expired_locked(&mut guard, now_instant);

        while guard.entries.len() >= self.max_entries
            || (guard.total_bytes + pdf_len > self.max_total_bytes && !guard.entries.is_empty())
        {
            if let Some(evicted) = guard.entries.pop_front() {
                guard.total_bytes = guard.total_bytes.saturating_sub(evicted.pdf_bytes.len());
            } else {
                break;
            }
        }

        guard.total_bytes += pdf_len;
        guard.entries.push_back(entry.clone());

        Ok(entry)
    }

    /// Valida existência, expiração, escopo de edição e integridade SHA-256 antes de
    /// liberar os bytes exatos do preview para exportação em disco.
    pub fn verify_and_get_for_export(
        &self,
        preview_id: &str,
        expected_sha256: &str,
        active_scope: DocumentScope,
    ) -> Result<StoredDocumentPreview, PreviewStoreError> {
        let trimmed_id = preview_id.trim();
        if trimmed_id.is_empty() {
            return Err(PreviewStoreError::NotFound);
        }

        let normalized_expected = expected_sha256.trim().to_ascii_lowercase();
        if normalized_expected.len() != 64
            || !normalized_expected.chars().all(|c| c.is_ascii_hexdigit())
        {
            return Err(PreviewStoreError::ChecksumMismatch);
        }

        let now_instant = Instant::now();
        let mut guard = self
            .inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        let pos = guard
            .entries
            .iter()
            .position(|entry| entry.preview_id == trimmed_id)
            .ok_or_else(|| {
                Self::purge_expired_locked(&mut guard, now_instant);
                PreviewStoreError::NotFound
            })?;

        if guard.entries[pos].is_expired_at(now_instant) {
            if let Some(expired_entry) = guard.entries.remove(pos) {
                guard.total_bytes = guard
                    .total_bytes
                    .saturating_sub(expired_entry.pdf_bytes.len());
            }
            Self::purge_expired_locked(&mut guard, now_instant);
            return Err(PreviewStoreError::Expired);
        }

        Self::purge_expired_locked(&mut guard, now_instant);

        let entry = guard
            .entries
            .iter_mut()
            .find(|item| item.preview_id == trimmed_id)
            .ok_or(PreviewStoreError::NotFound)?;

        if !is_scope_compatible(
            active_scope,
            entry.edition_scope,
            entry.metadata.document_kind.required_scope(),
        ) {
            return Err(PreviewStoreError::UnauthorizedScope);
        }

        let recomputed_sha256 = hex::encode(Sha256::digest(&entry.pdf_bytes));
        if recomputed_sha256 != entry.sha256_checksum
            || recomputed_sha256 != entry.metadata.sha256_checksum.to_ascii_lowercase()
            || recomputed_sha256 != normalized_expected
        {
            return Err(PreviewStoreError::ChecksumMismatch);
        }

        entry.export_count = entry.export_count.saturating_add(1);
        Ok(entry.clone())
    }

    /// Remove explicitamente um preview do store em memória.
    pub fn remove(&self, preview_id: &str) -> bool {
        let mut guard = self
            .inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        if let Some(pos) = guard
            .entries
            .iter()
            .position(|entry| entry.preview_id == preview_id)
        {
            if let Some(removed) = guard.entries.remove(pos) {
                guard.total_bytes = guard.total_bytes.saturating_sub(removed.pdf_bytes.len());
                return true;
            }
        }
        false
    }

    /// Quantidade atual de previews ativos (após expurgo de expirados).
    pub fn active_count(&self) -> usize {
        let now_instant = Instant::now();
        let mut guard = self
            .inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        Self::purge_expired_locked(&mut guard, now_instant);
        guard.entries.len()
    }

    /// Total de bytes de PDF atualmente armazenados (após expurgo de expirados).
    pub fn active_total_bytes(&self) -> usize {
        let now_instant = Instant::now();
        let mut guard = self
            .inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        Self::purge_expired_locked(&mut guard, now_instant);
        guard.total_bytes
    }

    fn purge_expired_locked(state: &mut PreviewStoreState, now: Instant) {
        let mut remaining = VecDeque::with_capacity(state.entries.len());
        let mut bytes = 0usize;
        for entry in state.entries.drain(..) {
            if !entry.is_expired_at(now) {
                bytes += entry.pdf_bytes.len();
                remaining.push_back(entry);
            }
        }
        state.entries = remaining;
        state.total_bytes = bytes;
    }
}

fn is_scope_compatible(
    active_scope: DocumentScope,
    stored_edition_scope: DocumentScope,
    required_doc_scope: DocumentScope,
) -> bool {
    if active_scope != stored_edition_scope {
        return false;
    }
    matches!(
        (required_doc_scope, active_scope),
        (DocumentScope::Universal, _)
            | (DocumentScope::CockpitOnly, DocumentScope::CockpitOnly)
            | (DocumentScope::NodeOnly, DocumentScope::NodeOnly)
    )
}

impl From<PreviewStoreError> for DocumentError {
    fn from(error: PreviewStoreError) -> Self {
        match error {
            PreviewStoreError::UnauthorizedScope => {
                DocumentError::UnauthorizedScope(error.to_string())
            }
            _ => DocumentError::ValidationError(error.to_string()),
        }
    }
}

static GLOBAL_PREVIEW_STORE: OnceLock<DocumentPreviewStore> = OnceLock::new();

/// Retorna a instância global compartilhada do `DocumentPreviewStore` em memória.
pub fn global_preview_store() -> &'static DocumentPreviewStore {
    GLOBAL_PREVIEW_STORE.get_or_init(DocumentPreviewStore::new)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::modules::documents::models::DocumentKind;
    use crate::platform::typst_engine::encode_base64;

    fn sample_output(kind: DocumentKind, content_suffix: &str) -> DocumentOutput {
        let bytes = format!("%PDF-1.7\n{content_suffix}\n%%EOF").into_bytes();
        let sha256 = hex::encode(Sha256::digest(&bytes));
        DocumentOutput {
            metadata: DocumentMetadata {
                document_kind: kind,
                generated_at_utc: "2026-11-03T12:00:00Z".to_string(),
                sha256_checksum: sha256,
                byte_size: bytes.len(),
                template_id: kind.template_id().to_string(),
            },
            pdf_bytes: bytes,
        }
    }

    fn sample_pages() -> Vec<RenderedPagePreview> {
        let svg = r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595 842" width="595" height="842"><rect width="100%" height="100%" fill="#ffffff"/></svg>"##;
        vec![RenderedPagePreview {
            page_number: 1,
            width_pt: 595,
            height_pt: 842,
            svg_base64: encode_base64(svg.as_bytes()),
        }]
    }

    #[test]
    fn test_preview_store_saves_and_verifies_identical_bytes_and_sha256() {
        let store = DocumentPreviewStore::new();
        let output = sample_output(DocumentKind::CessaoPosse, "contrato-posse-001");
        let original_bytes = output.pdf_bytes.clone();
        let original_sha = output.metadata.sha256_checksum.clone();

        let stored = store
            .store_preview(output, sample_pages(), DocumentScope::CockpitOnly)
            .expect("Deve armazenar preview em memória");

        assert!(!stored.preview_id.is_empty());
        assert_eq!(stored.sha256_checksum, original_sha);
        assert_eq!(stored.pdf_bytes, original_bytes);

        let verified = store
            .verify_and_get_for_export(
                &stored.preview_id,
                &original_sha,
                DocumentScope::CockpitOnly,
            )
            .expect("Deve verificar e recuperar preview para exportação");

        assert_eq!(verified.pdf_bytes, original_bytes);
        assert_eq!(verified.sha256_checksum, original_sha);
        assert_eq!(verified.export_count, 1);
    }

    #[test]
    fn test_preview_store_rejects_unknown_id_and_mismatched_sha256() {
        let store = DocumentPreviewStore::new();
        let output = sample_output(DocumentKind::InvoiceBill, "fatura-001");
        let sha = output.metadata.sha256_checksum.clone();

        let stored = store
            .store_preview(output, sample_pages(), DocumentScope::NodeOnly)
            .unwrap();

        // ID inexistente
        assert_eq!(
            store.verify_and_get_for_export("id-inexistente", &sha, DocumentScope::NodeOnly),
            Err(PreviewStoreError::NotFound)
        );

        // SHA-256 divergente
        let wrong_sha = "0".repeat(64);
        assert_eq!(
            store.verify_and_get_for_export(
                &stored.preview_id,
                &wrong_sha,
                DocumentScope::NodeOnly
            ),
            Err(PreviewStoreError::ChecksumMismatch)
        );
    }

    #[test]
    fn test_preview_store_enforces_ttl_expiration() {
        let store = DocumentPreviewStore::with_limits(Duration::from_millis(15), 8, 1024 * 1024);
        let output = sample_output(DocumentKind::CitizenLedger, "extrato-ttl");
        let sha = output.metadata.sha256_checksum.clone();

        let stored = store
            .store_preview(output, sample_pages(), DocumentScope::CockpitOnly)
            .unwrap();

        std::thread::sleep(Duration::from_millis(30));

        assert_eq!(
            store.verify_and_get_for_export(&stored.preview_id, &sha, DocumentScope::CockpitOnly),
            Err(PreviewStoreError::Expired)
        );
        assert_eq!(store.active_count(), 0);
    }

    #[test]
    fn test_preview_store_enforces_scope_isolation_and_evicts_oldest() {
        let store = DocumentPreviewStore::with_limits(Duration::from_secs(60), 2, 1024 * 1024);

        let out1 = sample_output(DocumentKind::CessaoPosse, "doc-1");
        let sha1 = out1.metadata.sha256_checksum.clone();
        let p1 = store
            .store_preview(out1, sample_pages(), DocumentScope::CockpitOnly)
            .unwrap();

        // NodeOnly não pode exportar preview criado em CockpitOnly
        assert_eq!(
            store.verify_and_get_for_export(&p1.preview_id, &sha1, DocumentScope::NodeOnly),
            Err(PreviewStoreError::UnauthorizedScope)
        );

        // Limite de max_entries = 2: inserir mais 2 deve remover p1
        let out2 = sample_output(DocumentKind::InvoiceBill, "doc-2");
        let _p2 = store
            .store_preview(out2, sample_pages(), DocumentScope::CockpitOnly)
            .unwrap();

        let out3 = sample_output(DocumentKind::CitizenLedger, "doc-3");
        let sha3 = out3.metadata.sha256_checksum.clone();
        let p3 = store
            .store_preview(out3, sample_pages(), DocumentScope::CockpitOnly)
            .unwrap();

        assert_eq!(store.active_count(), 2);
        assert_eq!(
            store.verify_and_get_for_export(&p1.preview_id, &sha1, DocumentScope::CockpitOnly),
            Err(PreviewStoreError::NotFound)
        );
        assert!(store
            .verify_and_get_for_export(&p3.preview_id, &sha3, DocumentScope::CockpitOnly)
            .is_ok());
    }
}
