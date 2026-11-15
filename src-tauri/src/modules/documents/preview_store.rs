use chrono::{Duration as ChronoDuration, Utc};
use sha2::{Digest, Sha256};
use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};
use thiserror::Error;
use uuid::Uuid;

use crate::modules::documents::models::{
    ApplicationEdition, DocumentError, DocumentMetadata, DocumentOutput, DocumentScope,
};
use crate::platform::typst_engine::RenderedPagePreview;

/// Tempo de vida padrão de um preview em memória (30 minutos).
pub const DEFAULT_PREVIEW_TTL_SECS: u64 = 30 * 60;

/// Quantidade máxima padrão de previews retidos simultaneamente em memória.
pub const DEFAULT_MAX_PREVIEW_ENTRIES: usize = 16;

/// Limite máximo padrão de bytes de memória acumulados no store (64 MiB).
pub const DEFAULT_MAX_PREVIEW_TOTAL_BYTES: usize = 64 * 1024 * 1024;

/// Trait abstrata para obtenção de tempo monotônico injetável,
/// permitindo testes unitários e de integração determinísticos sem dependência de `thread::sleep`.
pub trait MonotonicClock: Send + Sync {
    fn now(&self) -> Instant;
}

/// Implementação padrão de relógio monotônico ancorada no relógio do sistema operacional.
#[derive(Clone, Copy, Debug, Default)]
pub struct SystemMonotonicClock;

impl MonotonicClock for SystemMonotonicClock {
    fn now(&self) -> Instant {
        Instant::now()
    }
}

/// Relógio monotônico mockável para manipulação determinística de tempo em testes de TTL e expiração.
#[cfg(test)]
#[derive(Clone, Debug)]
pub struct MockMonotonicClock {
    current: Arc<Mutex<Instant>>,
}

#[cfg(test)]
impl MockMonotonicClock {
    pub fn new(start: Instant) -> Self {
        Self {
            current: Arc::new(Mutex::new(start)),
        }
    }

    pub fn advance(&self, duration: Duration) {
        let mut guard = self.current.lock().unwrap();
        *guard += duration;
    }

    pub fn set(&self, instant: Instant) {
        let mut guard = self.current.lock().unwrap();
        *guard = instant;
    }
}

#[cfg(test)]
impl MonotonicClock for MockMonotonicClock {
    fn now(&self) -> Instant {
        *self.current.lock().unwrap()
    }
}

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

    #[error("A capacidade máxima do repositório foi atingida e todos os itens estão em exportação ativa.")]
    CapacityExceeded,

    #[error("O bilhete de reserva de exportação é inválido ou já foi finalizado.")]
    InvalidReservation,

    #[error("O buffer binário do documento não é um PDF válido.")]
    InvalidPdfBuffer,

    #[error("Inconsistência nos metadados do documento gerado.")]
    MetadataMismatch,

    #[error("Falha na validação estrutural do documento: {0}")]
    StructuralValidationError(String),
}

impl PreviewStoreError {
    pub fn public_message(&self) -> String {
        match self {
            Self::StructuralValidationError(_) => {
                "O documento gerado contém inconsistências estruturais e não pôde ser verificado.".to_string()
            }
            Self::MetadataMismatch => {
                "Os metadados do documento gerado são inconsistentes. Gere a visualização novamente.".to_string()
            }
            _ => self.to_string(),
        }
    }
}

/// Bilhete transacional de reserva de preview para exportação segura em disco com garantia RAII.
///
/// Garante que enquanto um documento estiver sendo gravado e verificado,
/// ele não seja expurgado da memória por expiração ou concorrência.
/// Caso o bilhete seja descartado (drop) sem confirmação nem aborto explícito,
/// ele é abortado automaticamente desfazendo o incremento de exportações ativas.
pub struct ExportReservation {
    preview_id: String,
    pdf_bytes: Arc<[u8]>,
    metadata: DocumentMetadata,
    edition_scope: DocumentScope,
    reservation_token: Uuid,
    state: Arc<Mutex<PreviewStoreState>>,
    finished: std::sync::atomic::AtomicBool,
}

impl std::fmt::Debug for ExportReservation {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ExportReservation")
            .field("preview_id", &self.preview_id)
            .field("pdf_bytes_len", &self.pdf_bytes.len())
            .field("sha256_checksum", &self.metadata.sha256_checksum)
            .field("edition_scope", &self.edition_scope)
            .field("reservation_token", &self.reservation_token)
            .field("finished", &self.finished.load(std::sync::atomic::Ordering::Relaxed))
            .finish()
    }
}

impl ExportReservation {
    pub fn preview_id(&self) -> &str {
        &self.preview_id
    }

    pub fn pdf_bytes(&self) -> &Arc<[u8]> {
        &self.pdf_bytes
    }

    pub fn metadata(&self) -> &DocumentMetadata {
        &self.metadata
    }

    pub fn edition_scope(&self) -> DocumentScope {
        self.edition_scope
    }

    pub fn reservation_token(&self) -> Uuid {
        self.reservation_token
    }

    /// Confirma a exportação física do documento em disco.
    ///
    /// Consome o bilhete de reserva, remove o token do store mapeado,
    /// decrementa o contador de exportações ativas em andamento e incrementa
    /// o total histórico de exportações bem-sucedidas.
    pub fn confirm(self) -> Result<(), PreviewStoreError> {
        let mut guard = self
            .state
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        let mapped_preview_id = guard
            .active_reservations
            .remove(&self.reservation_token)
            .ok_or(PreviewStoreError::InvalidReservation)?;

        // Marca como finalizado para que o Drop não tente abortar novamente
        self.finished
            .store(true, std::sync::atomic::Ordering::SeqCst);

        if let Some(entry) = guard
            .entries
            .iter_mut()
            .find(|item| item.preview_id == mapped_preview_id)
        {
            entry.in_flight_exports = entry.in_flight_exports.saturating_sub(1);
            entry.export_count = entry.export_count.saturating_add(1);
        }

        Ok(())
    }

    /// Cancela a reserva de exportação manualmente (ex.: falha de gravação ou hash divergente).
    ///
    /// Consome o bilhete de reserva, remove o token e decrementa o contador
    /// de exportações ativas em andamento.
    pub fn abort(self) {
        let mut guard = self
            .state
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        if let Some(mapped_preview_id) = guard
            .active_reservations
            .remove(&self.reservation_token)
            && let Some(entry) = guard
                .entries
                .iter_mut()
                .find(|item| item.preview_id == mapped_preview_id)
        {
            self.finished
                .store(true, std::sync::atomic::Ordering::SeqCst);

            entry.in_flight_exports = entry.in_flight_exports.saturating_sub(1);
        }
    }
}

impl Drop for ExportReservation {
    fn drop(&mut self) {
        if !self.finished.swap(true, std::sync::atomic::Ordering::SeqCst) {
            let mut guard = self
                .state
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());

            if let Some(mapped_preview_id) = guard
                .active_reservations
                .remove(&self.reservation_token)
                && let Some(entry) = guard
                    .entries
                    .iter_mut()
                    .find(|item| item.preview_id == mapped_preview_id)
            {
                entry.in_flight_exports = entry.in_flight_exports.saturating_sub(1);
            }
        }
    }
}

/// Registro imutável de um documento compilado e retido temporariamente em memória
/// para visualização e posterior exportação verificada.
#[derive(Clone, PartialEq, Eq)]
pub struct StoredDocumentPreview {
    pub preview_id: String,
    pub pdf_bytes: Arc<[u8]>,
    pub pages: Arc<[RenderedPagePreview]>,
    pub metadata: DocumentMetadata,
    pub sha256_checksum: String,
    pub created_at_utc: String,
    pub expires_at_utc: String,
    pub edition_scope: DocumentScope,
    pub export_count: usize,
    pub in_flight_exports: usize,
    created_instant: Instant,
    ttl: Duration,
}

impl std::fmt::Debug for StoredDocumentPreview {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("StoredDocumentPreview")
            .field("preview_id", &self.preview_id)
            .field("pdf_bytes_len", &self.pdf_bytes.len())
            .field("pages_count", &self.pages.len())
            .field("metadata", &self.metadata)
            .field("sha256_checksum", &self.sha256_checksum)
            .field("created_at_utc", &self.created_at_utc)
            .field("expires_at_utc", &self.expires_at_utc)
            .field("edition_scope", &self.edition_scope)
            .field("export_count", &self.export_count)
            .field("in_flight_exports", &self.in_flight_exports)
            .finish()
    }
}

impl StoredDocumentPreview {
    pub fn is_expired_at(&self, now: Instant) -> bool {
        now.checked_duration_since(self.created_instant)
            .unwrap_or(Duration::ZERO)
            >= self.ttl
    }

    /// Calcula os bytes totais estimados retidos em memória (PDF + strings SVG das páginas).
    pub fn estimated_retained_bytes(&self) -> usize {
        let pdf_len = self.pdf_bytes.len();
        let svg_len: usize = self.pages.iter().map(|p| p.svg_base64.len()).sum();
        pdf_len + svg_len + std::mem::size_of::<Self>()
    }
}

#[derive(Debug, Default)]
struct PreviewStoreState {
    entries: VecDeque<StoredDocumentPreview>,
    active_reservations: HashMap<Uuid, String>,
    total_retained_bytes: usize,
}

/// Store concorrente estritamente em memória para sessões de preview documental.
///
/// Garante que o PDF visualizado na interface e o PDF exportado ao disco sejam
/// exatamente o mesmo artefato binário, verificado por SHA-256 e isolado por escopo.
#[derive(Clone)]
pub struct DocumentPreviewStore {
    inner: Arc<Mutex<PreviewStoreState>>,
    clock: Arc<dyn MonotonicClock>,
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
        Self::with_clock_and_limits(
            Arc::new(SystemMonotonicClock),
            ttl,
            max_entries,
            max_total_bytes,
        )
    }

    pub fn with_clock_and_limits(
        clock: Arc<dyn MonotonicClock>,
        ttl: Duration,
        max_entries: usize,
        max_total_bytes: usize,
    ) -> Self {
        Self {
            inner: Arc::new(Mutex::new(PreviewStoreState::default())),
            clock,
            ttl,
            max_entries: max_entries.max(1),
            max_total_bytes: max_total_bytes.max(1024),
        }
    }

    /// Armazena um `DocumentOutput` recém-compilado em memória e retorna o registro de preview.
    pub fn store_preview<P: Into<Arc<[RenderedPagePreview]>>>(
        &self,
        output: DocumentOutput,
        pages: P,
        edition_scope: DocumentScope,
    ) -> Result<StoredDocumentPreview, PreviewStoreError> {
        let edition = ApplicationEdition::try_from_scope(edition_scope)
            .map_err(|_| PreviewStoreError::UnauthorizedScope)?;
        if !output
            .metadata
            .document_kind
            .required_visibility()
            .is_allowed_for(edition)
        {
            return Err(PreviewStoreError::UnauthorizedScope);
        }

        // Validação estrita de consistência dos metadados documentais (incluindo timestamp ISO 8601)
        if output.metadata.byte_size != output.pdf_bytes.len()
            || output.metadata.template_id != output.metadata.document_kind.template_id()
            || output.metadata.validate().is_err()
        {
            return Err(PreviewStoreError::MetadataMismatch);
        }

        if output.pdf_bytes.is_empty() || !output.pdf_bytes.starts_with(b"%PDF-") {
            return Err(PreviewStoreError::InvalidPdfBuffer);
        }

        let pages_arc: Arc<[RenderedPagePreview]> = pages.into();
        let entry_retained_bytes = output.pdf_bytes.len()
            + pages_arc.iter().map(|p| p.svg_base64.len()).sum::<usize>()
            + std::mem::size_of::<StoredDocumentPreview>();
        if entry_retained_bytes > self.max_total_bytes {
            return Err(PreviewStoreError::PayloadTooLarge);
        }

        crate::platform::typst_engine::validate_pdf_structure(&output.pdf_bytes)
            .map_err(|e| PreviewStoreError::StructuralValidationError(e.to_string()))?;

        let computed_sha256 = hex::encode(Sha256::digest(&output.pdf_bytes));
        if computed_sha256 != output.metadata.sha256_checksum.to_ascii_lowercase() {
            return Err(PreviewStoreError::ChecksumMismatch);
        }

        let now_instant = self.clock.now();
        let now_utc = Utc::now();
        let ttl_chrono = ChronoDuration::from_std(self.ttl)
            .unwrap_or_else(|_| ChronoDuration::seconds(DEFAULT_PREVIEW_TTL_SECS as i64));
        let expires_utc = now_utc + ttl_chrono;

        let entry = StoredDocumentPreview {
            preview_id: Uuid::new_v4().to_string(),
            pdf_bytes: output.pdf_bytes,
            pages: pages_arc,
            metadata: output.metadata,
            sha256_checksum: computed_sha256,
            created_at_utc: now_utc.to_rfc3339(),
            expires_at_utc: expires_utc.to_rfc3339(),
            edition_scope,
            export_count: 0,
            in_flight_exports: 0,
            created_instant: now_instant,
            ttl: self.ttl,
        };

        let mut guard = self
            .inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        Self::purge_expired_locked(&mut guard, now_instant);

        while guard.entries.len() >= self.max_entries
            || (guard.total_retained_bytes + entry_retained_bytes > self.max_total_bytes
                && !guard.entries.is_empty())
        {
            let evict_idx = guard
                .entries
                .iter()
                .position(|e| e.in_flight_exports == 0);

            if let Some(idx) = evict_idx {
                if let Some(evicted) = guard.entries.remove(idx) {
                    guard.total_retained_bytes = guard
                        .total_retained_bytes
                        .saturating_sub(evicted.estimated_retained_bytes());
                }
            } else {
                return Err(PreviewStoreError::CapacityExceeded);
            }
        }

        guard.total_retained_bytes += entry_retained_bytes;
        guard.entries.push_back(entry.clone());

        Ok(entry)
    }

    /// Inicia uma transação de exportação reservando o preview e protegendo-o contra expurgo.
    ///
    /// O cálculo criptográfico de SHA-256 é executado estritamente FORA do lock do repositório,
    /// garantindo que buffers binários de até 64 MiB não causem contenção de concorrência.
    pub fn begin_export(
        &self,
        preview_id: &str,
        expected_sha256: &str,
        active_scope: DocumentScope,
    ) -> Result<ExportReservation, PreviewStoreError> {
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

        let now_instant = self.clock.now();
        let token = Uuid::new_v4();

        // 1. Fase sob o lock: validação rápida e reserva do slot
        let (pdf_bytes, metadata, edition_scope, stored_sha256) = {
            let mut guard = self
                .inner
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());

            let pos = Self::locate_valid_entry_locked(&mut guard, trimmed_id, now_instant)?;
            let entry = &mut guard.entries[pos];

            if !is_scope_compatible(
                active_scope,
                entry.edition_scope,
                entry.metadata.document_kind.required_visibility(),
            ) {
                return Err(PreviewStoreError::UnauthorizedScope);
            }

            entry.in_flight_exports = entry.in_flight_exports.saturating_add(1);

            let pdf_bytes = entry.pdf_bytes.clone();
            let metadata = entry.metadata.clone();
            let edition_scope = entry.edition_scope;
            let stored_sha256 = entry.sha256_checksum.clone();

            guard
                .active_reservations
                .insert(token, trimmed_id.to_string());

            (pdf_bytes, metadata, edition_scope, stored_sha256)
        };

        // 2. Fase fora do lock: cálculo intensivo de hashing
        let recomputed_sha256 = hex::encode(Sha256::digest(&pdf_bytes));
        if recomputed_sha256 != stored_sha256
            || recomputed_sha256 != metadata.sha256_checksum.to_ascii_lowercase()
            || recomputed_sha256 != normalized_expected
        {
            // Reabre o lock para desfazer o incremento e remover a reserva
            let mut guard = self
                .inner
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());

            guard.active_reservations.remove(&token);
            if let Some(entry) = guard
                .entries
                .iter_mut()
                .find(|item| item.preview_id == trimmed_id)
            {
                entry.in_flight_exports = entry.in_flight_exports.saturating_sub(1);
            }

            return Err(PreviewStoreError::ChecksumMismatch);
        }

        Ok(ExportReservation {
            preview_id: trimmed_id.to_string(),
            pdf_bytes,
            metadata,
            edition_scope,
            reservation_token: token,
            state: Arc::clone(&self.inner),
            finished: std::sync::atomic::AtomicBool::new(false),
        })
    }

    /// Valida existência, expiração, escopo de edição e integridade SHA-256 antes de
    /// liberar os bytes exatos do preview para exportação em disco, em fluxo unificado sem vazamento de reservas.
    #[cfg(test)]
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

        let now_instant = self.clock.now();

        let (mut entry_clone, pdf_bytes, stored_sha256, metadata_sha256) = {
            let mut guard = self
                .inner
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());

            let pos = Self::locate_valid_entry_locked(&mut guard, trimmed_id, now_instant)?;
            let entry = &guard.entries[pos];
            if !is_scope_compatible(
                active_scope,
                entry.edition_scope,
                entry.metadata.document_kind.required_visibility(),
            ) {
                return Err(PreviewStoreError::UnauthorizedScope);
            }

            (
                entry.clone(),
                entry.pdf_bytes.clone(),
                entry.sha256_checksum.clone(),
                entry.metadata.sha256_checksum.to_ascii_lowercase(),
            )
        };

        // Validação de hash fora do lock
        let recomputed_sha256 = hex::encode(Sha256::digest(&pdf_bytes));
        if recomputed_sha256 != stored_sha256
            || recomputed_sha256 != metadata_sha256
            || recomputed_sha256 != normalized_expected
        {
            return Err(PreviewStoreError::ChecksumMismatch);
        }

        // Incremento de export_count
        {
            let mut guard = self
                .inner
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());
            if let Some(entry) = guard
                .entries
                .iter_mut()
                .find(|item| item.preview_id == trimmed_id)
            {
                entry.export_count = entry.export_count.saturating_add(1);
                entry_clone.export_count = entry.export_count;
            }
        }

        Ok(entry_clone)
    }

    /// Remove explicitamente um preview do store em memória (se não estiver em exportação ativa).
    pub fn remove(&self, preview_id: &str) -> bool {
        let trimmed_id = preview_id.trim();
        if trimmed_id.is_empty() {
            return false;
        }

        let mut guard = self
            .inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        if let Some(pos) = guard
            .entries
            .iter()
            .position(|entry| entry.preview_id == trimmed_id && entry.in_flight_exports == 0)
            && let Some(removed) = guard.entries.remove(pos)
        {
            guard.total_retained_bytes = guard
                .total_retained_bytes
                .saturating_sub(removed.estimated_retained_bytes());
            return true;
        }
        false
    }

    /// Quantidade atual de previews ativos (após expurgo de expirados).
    pub fn active_count(&self) -> usize {
        let now_instant = self.clock.now();
        let mut guard = self
            .inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        Self::purge_expired_locked(&mut guard, now_instant);
        guard.entries.len()
    }

    /// Total de bytes atualmente retidos (após expurgo de expirados).
    pub fn active_total_bytes(&self) -> usize {
        let now_instant = self.clock.now();
        let mut guard = self
            .inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        Self::purge_expired_locked(&mut guard, now_instant);
        guard.total_retained_bytes
    }

    fn locate_valid_entry_locked(
        state: &mut PreviewStoreState,
        id: &str,
        now: Instant,
    ) -> Result<usize, PreviewStoreError> {
        let maybe_pos = state
            .entries
            .iter()
            .position(|entry| entry.preview_id == id);

        match maybe_pos {
            None => {
                Self::purge_expired_locked(state, now);
                Err(PreviewStoreError::NotFound)
            }
            Some(p) => {
                if state.entries[p].is_expired_at(now) {
                    if state.entries[p].in_flight_exports == 0
                        && let Some(expired_entry) = state.entries.remove(p)
                    {
                        state.total_retained_bytes = state
                            .total_retained_bytes
                            .saturating_sub(expired_entry.estimated_retained_bytes());
                    }
                    Self::purge_expired_locked(state, now);
                    return Err(PreviewStoreError::Expired);
                }

                Self::purge_expired_locked(state, now);

                state
                    .entries
                    .iter()
                    .position(|entry| entry.preview_id == id)
                    .ok_or(PreviewStoreError::NotFound)
            }
        }
    }

    fn purge_expired_locked(state: &mut PreviewStoreState, now: Instant) {
        state.entries.retain(|entry| {
            let keep = !entry.is_expired_at(now) || entry.in_flight_exports > 0;
            if !keep {
                state.total_retained_bytes = state
                    .total_retained_bytes
                    .saturating_sub(entry.estimated_retained_bytes());
            }
            keep
        });
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
    match ApplicationEdition::try_from_scope(active_scope) {
        Ok(edition) => required_doc_scope.is_allowed_for(edition),
        Err(_) => false,
    }
}

impl From<PreviewStoreError> for DocumentError {
    fn from(error: PreviewStoreError) -> Self {
        match error {
            PreviewStoreError::NotFound => DocumentError::PreviewNotFound(error.to_string()),
            PreviewStoreError::Expired => DocumentError::PreviewExpired(error.to_string()),
            PreviewStoreError::UnauthorizedScope => {
                DocumentError::UnauthorizedScope(error.to_string())
            }
            PreviewStoreError::CapacityExceeded | PreviewStoreError::PayloadTooLarge => {
                DocumentError::PreviewCapacity(error.to_string())
            }
            PreviewStoreError::ChecksumMismatch
            | PreviewStoreError::InvalidPdfBuffer
            | PreviewStoreError::MetadataMismatch
            | PreviewStoreError::StructuralValidationError(_) => {
                DocumentError::IntegrityError(error.to_string())
            }
            PreviewStoreError::InvalidReservation => {
                DocumentError::ValidationError(error.to_string())
            }
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
        let bytes = format!("%PDF-1.7\n% mock content payload stream: {content_suffix}\n%%EOF").into_bytes();
        let sha256 = hex::encode(Sha256::digest(&bytes));
        DocumentOutput {
            metadata: DocumentMetadata {
                document_kind: kind,
                generated_at_utc: "2026-11-03T12:00:00Z".to_string(),
                sha256_checksum: sha256,
                byte_size: bytes.len(),
                template_id: kind.template_id().to_string(),
            },
            pdf_bytes: bytes.into(),
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
    fn test_preview_store_enforces_ttl_expiration_deterministically() {
        let clock = Arc::new(MockMonotonicClock::new(Instant::now()));
        let store = DocumentPreviewStore::with_clock_and_limits(
            clock.clone(),
            Duration::from_secs(10),
            8,
            1024 * 1024,
        );
        let output = sample_output(DocumentKind::CitizenLedger, "extrato-ttl");
        let sha = output.metadata.sha256_checksum.clone();

        let stored = store
            .store_preview(output, sample_pages(), DocumentScope::CockpitOnly)
            .unwrap();

        // Avanço determinístico sem thread::sleep
        clock.advance(Duration::from_secs(15));

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

    #[test]
    fn test_preview_store_transactional_export_lifecycle() {
        let store = DocumentPreviewStore::new();
        let output = sample_output(DocumentKind::CitizenLedger, "tx-export-01");
        let sha = output.metadata.sha256_checksum.clone();

        let stored = store
            .store_preview(output, sample_pages(), DocumentScope::NodeOnly)
            .expect("Deve armazenar preview");

        // 1. Iniciar reserva de exportação
        let reservation = store
            .begin_export(&stored.preview_id, &sha, DocumentScope::NodeOnly)
            .expect("Deve iniciar reserva de exportação");

        assert_eq!(reservation.preview_id(), stored.preview_id);
        assert_eq!(reservation.pdf_bytes(), &stored.pdf_bytes);

        // 2. Abortar reserva e verificar contadores
        reservation.abort();

        // 3. Iniciar nova reserva e confirmar sucesso
        let new_reservation = store
            .begin_export(&stored.preview_id, &sha, DocumentScope::NodeOnly)
            .expect("Deve iniciar nova reserva");

        new_reservation
            .confirm()
            .expect("Confirmação deve ter sucesso");
    }

    #[test]
    fn test_preview_store_fifo_eviction_protects_in_flight_exports() {
        // Capacidade estrita para apenas 2 itens
        let store = DocumentPreviewStore::with_limits(Duration::from_secs(60), 2, 1024 * 1024);

        let out1 = sample_output(DocumentKind::CitizenLedger, "doc-pinned-1");
        let sha1 = out1.metadata.sha256_checksum.clone();
        let p1 = store
            .store_preview(out1, sample_pages(), DocumentScope::NodeOnly)
            .unwrap();

        // Reservar p1 em exportação ativa (in_flight_exports = 1)
        let res1 = store
            .begin_export(&p1.preview_id, &sha1, DocumentScope::NodeOnly)
            .unwrap();

        let out2 = sample_output(DocumentKind::InvoiceBill, "doc-unpinned-2");
        let sha2 = out2.metadata.sha256_checksum.clone();
        let _p2 = store
            .store_preview(out2, sample_pages(), DocumentScope::NodeOnly)
            .unwrap();

        // Inserir p3: como a capacidade é 2 e p1 está em exportação ativa, p2 deve ser despejado em vez de p1
        let out3 = sample_output(DocumentKind::CitizenLedger, "doc-new-3");
        let sha3 = out3.metadata.sha256_checksum.clone();
        let p3 = store
            .store_preview(out3, sample_pages(), DocumentScope::NodeOnly)
            .unwrap();

        // p1 ainda deve existir (pois estava protegido)
        res1.confirm().unwrap();
        assert!(store
            .verify_and_get_for_export(&p1.preview_id, &sha1, DocumentScope::NodeOnly)
            .is_ok());

        // p2 foi despejado
        assert_eq!(
            store.verify_and_get_for_export("doc-unpinned-2", &sha2, DocumentScope::NodeOnly),
            Err(PreviewStoreError::NotFound)
        );

        // p3 está ativo
        assert!(store
            .verify_and_get_for_export(&p3.preview_id, &sha3, DocumentScope::NodeOnly)
            .is_ok());
    }

    #[test]
    fn test_preview_store_rejects_corrupted_pdf_structure() {
        let store = DocumentPreviewStore::new();

        // Buffer sem cabeçalho %PDF-
        let bad_header = DocumentOutput {
            metadata: DocumentMetadata {
                document_kind: DocumentKind::InvoiceBill,
                generated_at_utc: "2026-11-03T12:00:00Z".to_string(),
                sha256_checksum: hex::encode(Sha256::digest(b"NOT_A_PDF_STREAM")),
                byte_size: 16,
                template_id: DocumentKind::InvoiceBill.template_id().to_string(),
            },
            pdf_bytes: b"NOT_A_PDF_STREAM".to_vec().into(),
        };

        assert_eq!(
            store.store_preview(bad_header, sample_pages(), DocumentScope::NodeOnly),
            Err(PreviewStoreError::InvalidPdfBuffer)
        );

        // Buffer com cabeçalho mas sem marcador %%EOF
        let truncated_trailer = b"%PDF-1.7\ntruncated-content-stream-without-eof";
        let bad_trailer = DocumentOutput {
            metadata: DocumentMetadata {
                document_kind: DocumentKind::InvoiceBill,
                generated_at_utc: "2026-11-03T12:00:00Z".to_string(),
                sha256_checksum: hex::encode(Sha256::digest(truncated_trailer)),
                byte_size: truncated_trailer.len(),
                template_id: DocumentKind::InvoiceBill.template_id().to_string(),
            },
            pdf_bytes: truncated_trailer.to_vec().into(),
        };

        assert!(matches!(
            store.store_preview(bad_trailer, sample_pages(), DocumentScope::NodeOnly),
            Err(PreviewStoreError::StructuralValidationError(_))
        ));
    }

    #[test]
    fn test_preview_store_reservation_raii_aborts_on_drop() {
        let store = DocumentPreviewStore::new();
        let output = sample_output(DocumentKind::InvoiceBill, "raii-test");
        let sha = output.metadata.sha256_checksum.clone();

        let stored = store
            .store_preview(output, sample_pages(), DocumentScope::NodeOnly)
            .unwrap();

        {
            let _res = store
                .begin_export(&stored.preview_id, &sha, DocumentScope::NodeOnly)
                .unwrap();
            // Ao sair deste escopo sem chamar confirm(), o bilhete é descartado e abortado via RAII Drop
        }

        // Uma nova reserva deve ser iniciada e confirmada normalmente
        let second_res = store
            .begin_export(&stored.preview_id, &sha, DocumentScope::NodeOnly)
            .unwrap();
        assert!(second_res.confirm().is_ok());
    }

    #[test]
    fn test_preview_store_protects_in_flight_export_when_ttl_expires() {
        let clock = Arc::new(MockMonotonicClock::new(Instant::now()));
        let store = DocumentPreviewStore::with_clock_and_limits(
            clock.clone(),
            Duration::from_secs(10),
            8,
            1024 * 1024,
        );
        let output = sample_output(DocumentKind::CitizenLedger, "in-flight-ttl-protect");
        let sha = output.metadata.sha256_checksum.clone();

        let stored = store
            .store_preview(output, sample_pages(), DocumentScope::NodeOnly)
            .unwrap();

        // 1. Inicia exportação ativa enquanto dentro do TTL
        let reservation = store
            .begin_export(&stored.preview_id, &sha, DocumentScope::NodeOnly)
            .unwrap();

        // 2. O tempo avança além do TTL (expirado)
        clock.advance(Duration::from_secs(15));

        // 3. Novas requisições de exportação devem ser rejeitadas como Expired
        assert_eq!(
            store.begin_export(&stored.preview_id, &sha, DocumentScope::NodeOnly).map(|_| ()),
            Err(PreviewStoreError::Expired)
        );

        // 4. Mas o documento NÃO pode ser destruído da memória enquanto a exportação anterior estiver ativa
        assert!(reservation.confirm().is_ok());

        // 5. Após a finalização da exportação ativa, o item agora pode ser expurgado
        assert_eq!(store.active_count(), 0);
    }

    #[test]
    fn test_preview_store_error_public_message_sanitizes_internal_details() {
        let err = PreviewStoreError::StructuralValidationError("/secret/path: PDF stream malformed".to_string());
        let public_msg = err.public_message();
        assert!(!public_msg.contains("/secret/path"));
        assert_eq!(public_msg, "O documento gerado contém inconsistências estruturais e não pôde ser verificado.");
    }
}
