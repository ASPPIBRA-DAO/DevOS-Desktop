use std::collections::HashMap;

use crate::modules::documents::models::{DocumentError, DocumentKind, DocumentRequest};
use crate::modules::documents::ports::{DocumentRenderer, RenderedDocument};
use crate::platform::typst_engine::{
    compile_typst_document_to_pdf, compile_typst_document_with_preview, TypstCompileOptions,
};
#[cfg(test)]
use crate::platform::typst_engine::compile_typst_document;

static CITIZEN_TEMPLATE: &str = include_str!("../../../templates/extrato_citizen_ledger.typ");

static INVOICE_TEMPLATE: &str = include_str!("../../../templates/invoice_bill.typ");

static CONTRATO_CESSAO_TEMPLATE: &str =
    include_str!("../../../templates/contrato_cessao_posse.typ");

static RECONCILIATION_TEMPLATE: &str =
    include_str!("../../../templates/real_estate_reconciliation.typ");

static ASPPIBRA_LAYOUT: &str = include_str!("../../../templates/asppibra_layout.typ");
static CORE_BRANDING: &str = include_str!("../../../templates/core/branding.typ");
static CORE_TYPOGRAPHY: &str = include_str!("../../../templates/core/typography.typ");
static CORE_PAGE_ABNT: &str = include_str!("../../../templates/core/page_abnt.typ");
static CORE_HEADER_FOOTER: &str = include_str!("../../../templates/core/header_footer.typ");
static CORE_DATA_TAGS: &str = include_str!("../../../templates/core/data_tags.typ");

pub static CANONICAL_TYPST_STATIC_SOURCES: &[(&str, &str)] = &[
    ("asppibra_layout.typ", ASPPIBRA_LAYOUT),
    ("core/branding.typ", CORE_BRANDING),
    ("core/typography.typ", CORE_TYPOGRAPHY),
    ("core/page_abnt.typ", CORE_PAGE_ABNT),
    ("core/header_footer.typ", CORE_HEADER_FOOTER),
    ("core/data_tags.typ", CORE_DATA_TAGS),
    // Aliases sem prefixo para máxima resiliência de resolução relativa a partir de subdiretórios:
    ("branding.typ", CORE_BRANDING),
    ("typography.typ", CORE_TYPOGRAPHY),
    ("page_abnt.typ", CORE_PAGE_ABNT),
    ("header_footer.typ", CORE_HEADER_FOOTER),
    ("data_tags.typ", CORE_DATA_TAGS),
];

static ROBOTO_REGULAR: &[u8] = include_bytes!("../../../assets/fonts/Roboto-Regular.ttf");

static ROBOTO_BOLD: &[u8] = include_bytes!("../../../assets/fonts/Roboto-Bold.ttf");

/// Adaptador de renderização documental baseado no compilador nativo Typst.
///
/// Encapsula o carregamento dos templates `.typ`, fontes institucionais,
/// injeção de parâmetros JSON e invocação do motor de compilação em memória.
///
/// Produz exclusivamente os bytes binários do documento (`RenderedDocument`),
/// sem dependência de regras de integridade ou autorização.
#[derive(Default, Clone, Debug)]
pub struct TypstDocumentRenderer;

impl TypstDocumentRenderer {
    pub fn new() -> Self {
        Self
    }
}

impl TypstDocumentRenderer {
    fn resolve_template_and_payload(
        request: &DocumentRequest,
    ) -> Result<(&'static str, String), DocumentError> {
        match request {
            DocumentRequest::CitizenLedger(payload) => {
                let json_str = serde_json::to_string(&payload.data)
                    .map_err(|error| DocumentError::SerializationError(error.to_string()))?;

                Ok((CITIZEN_TEMPLATE, json_str))
            }

            DocumentRequest::InvoiceBill(payload) => {
                let json_value = serde_json::json!({
                    "invoice": payload
                });

                let json_str = serde_json::to_string(&json_value)
                    .map_err(|error| DocumentError::SerializationError(error.to_string()))?;

                Ok((INVOICE_TEMPLATE, json_str))
            }

            DocumentRequest::CessaoPosse(payload) => {
                let json_str = serde_json::to_string(&payload)
                    .map_err(|error| DocumentError::SerializationError(error.to_string()))?;

                Ok((CONTRATO_CESSAO_TEMPLATE, json_str))
            }

            DocumentRequest::RealEstateReconciliation(payload) => {
                let json_str = serde_json::to_string(&payload.data)
                    .map_err(|error| DocumentError::SerializationError(error.to_string()))?;

                Ok((RECONCILIATION_TEMPLATE, json_str))
            }
        }
    }
}

impl DocumentRenderer for TypstDocumentRenderer {
    fn supports(&self, kind: DocumentKind) -> bool {
        matches!(
            kind,
            DocumentKind::CitizenLedger
                | DocumentKind::InvoiceBill
                | DocumentKind::CessaoPosse
                | DocumentKind::RealEstateReconciliation
        )
    }

    fn render(&self, request: DocumentRequest) -> Result<RenderedDocument, DocumentError> {
        let (template_source, json_payload) = Self::resolve_template_and_payload(&request)?;

        let mut string_inputs = HashMap::new();
        string_inputs.insert("data", json_payload);

        let options = TypstCompileOptions {
            template_source,
            fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
            string_inputs,
            static_sources: CANONICAL_TYPST_STATIC_SOURCES,
        };

        let compiled = compile_typst_document_with_preview(options)
            .map_err(|error| DocumentError::CompilationError(error.to_string()))?;

        Ok(RenderedDocument::with_pages(
            compiled.pdf_bytes,
            compiled.pages,
        ))
    }

    fn render_pdf_only(&self, request: DocumentRequest) -> Result<RenderedDocument, DocumentError> {
        let (template_source, json_payload) = Self::resolve_template_and_payload(&request)?;

        let mut string_inputs = HashMap::new();
        string_inputs.insert("data", json_payload);

        let options = TypstCompileOptions {
            template_source,
            fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
            string_inputs,
            static_sources: CANONICAL_TYPST_STATIC_SOURCES,
        };

        let pdf_bytes = compile_typst_document_to_pdf(options)
            .map_err(|error| DocumentError::CompilationError(error.to_string()))?;

        Ok(RenderedDocument::with_pages(pdf_bytes, Vec::new()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::modules::documents::models::{
        CessaoPossePayload, CitizenLedgerPayload, InvoiceReportItem, InvoiceReportPayload,
        RealEstateReconciliationPayload,
    };
    use rust_decimal_macros::dec;
    use serde_json::json;

    fn assert_valid_rendered(rendered: &RenderedDocument) {
        assert!(
            !rendered.pdf_bytes.is_empty(),
            "O PDF gerado não deve estar vazio"
        );
        assert!(
            rendered.pdf_bytes.starts_with(b"%PDF-"),
            "O PDF gerado deve iniciar com o cabeçalho %PDF-"
        );
        assert!(
            !rendered.pages.is_empty(),
            "A renderização deve produzir ao menos uma página vetorial para preview"
        );
    }

    #[test]
    fn test_typst_renderer_supports_all_canonical_kinds() {
        let renderer = TypstDocumentRenderer::new();
        assert!(renderer.supports(DocumentKind::CitizenLedger));
        assert!(renderer.supports(DocumentKind::InvoiceBill));
        assert!(renderer.supports(DocumentKind::CessaoPosse));
        assert!(renderer.supports(DocumentKind::RealEstateReconciliation));
    }

    #[test]
    fn test_typst_renderer_compiles_invoice_bill() {
        let renderer = TypstDocumentRenderer::new();
        let payload = InvoiceReportPayload {
            id: "FAT-2026-RENDER".to_string(),
            member_name: "Associado Teste".to_string(),
            member_doc: "000.111.222-33".to_string(),
            member_email: None,
            member_address: None,
            description: "Taxa Associativa".to_string(),
            reference_month: "2026-10".to_string(),
            amount: dec!(150.0),
            due_date: "2026-10-31".to_string(),
            settled_date: None,
            payment_method: "Pix".to_string(),
            status: "pending".to_string(),
            items: vec![InvoiceReportItem {
                id: "item-1".to_string(),
                description: "Taxa de Manutenção".to_string(),
                service: None,
                quantity: dec!(1.0),
                price: dec!(150.0),
                total: dec!(150.0),
            }],
            taxes: None,
            discount: None,
            d1_protocol: None,
        };

        let output = renderer
            .render(DocumentRequest::InvoiceBill(payload))
            .expect("Renderização da fatura deve ter sucesso");

        assert_valid_rendered(&output);
    }

    #[test]
    fn test_typst_renderer_compiles_cessao_posse() {
        let renderer = TypstDocumentRenderer::new();
        let payload = CessaoPossePayload {
            document_number: "2026-0001/CP".to_string(),
            auth_code: "2026-X7Y9".to_string(),
            data: json!({
                "cedenteNome": "JOÃO SILVA TESTE",
                "cessionarioNome": "MARIA SOUZA TESTE",
                "imovelLote": "12",
                "imovelQuadra": "B"
            }),
        };

        let output = renderer
            .render(DocumentRequest::CessaoPosse(payload))
            .expect("Renderização da cessão de posse deve ter sucesso");

        assert_valid_rendered(&output);
    }

    #[test]
    fn test_typst_renderer_compiles_citizen_ledger() {
        let renderer = TypstDocumentRenderer::new();
        let payload = CitizenLedgerPayload {
            associate_id: Some("ASSOC-TEST".to_string()),
            data: json!({
                "meta": {
                    "generated_at": "23/10/2026",
                    "reference_period": "2026-10",
                    "audit_hash": "audit_hash_test"
                },
                "associate": {
                    "id": "123",
                    "name": "Associado Teste",
                    "cpf": "123.456.789-00",
                    "email": "associado@example.com",
                    "avatar_letter": "A",
                    "address_line1": "Rua Teste, 100",
                    "address_line2": "Centro"
                },
                "summary": {
                    "total_contracted": "1.000,00",
                    "total_paid": "1.000,00",
                    "outstanding_balance": "0,00"
                },
                "transactions": []
            }),
        };

        let output = renderer
            .render(DocumentRequest::CitizenLedger(payload))
            .expect("Renderização do extrato deve ter sucesso");

        assert_valid_rendered(&output);
    }

    #[test]
    fn test_typst_renderer_compiles_real_estate_reconciliation() {
        let renderer = TypstDocumentRenderer::new();
        let payload = RealEstateReconciliationPayload {
            data: json!({
                "generatedAt": "31/10/2026 13:00:00",
                "stats": {
                    "totalProperties": 1,
                    "totalIdentifiers": 1,
                    "totalAddresses": 1,
                    "totalBatches": 1,
                    "openFindingsCount": 0,
                    "pendingProposalsCount": 0
                },
                "batches": [],
                "findings": [],
                "properties": []
            }),
        };

        let output = renderer
            .render(DocumentRequest::RealEstateReconciliation(payload))
            .expect("Renderização da reconciliação deve ter sucesso");

        assert_valid_rendered(&output);
    }

    #[test]
    fn test_canonical_typst_static_sources_contain_all_core_modules() {
        let registered_paths: Vec<&str> = CANONICAL_TYPST_STATIC_SOURCES
            .iter()
            .map(|(path, _)| *path)
            .collect();

        assert!(registered_paths.contains(&"asppibra_layout.typ"));
        assert!(registered_paths.contains(&"core/branding.typ"));
        assert!(registered_paths.contains(&"core/typography.typ"));
        assert!(registered_paths.contains(&"core/page_abnt.typ"));
        assert!(registered_paths.contains(&"core/header_footer.typ"));
        assert!(registered_paths.contains(&"core/data_tags.typ"));

        // Garante que nenhum dos módulos estáticos embutidos está vazio
        for (path, content) in CANONICAL_TYPST_STATIC_SOURCES {
            assert!(
                !content.trim().is_empty(),
                "O módulo Typst {path} não deve estar vazio"
            );
        }
    }

    #[test]
    fn test_modular_core_templates_render_via_facade_and_direct_imports() {
        let template = r##"
        #import "asppibra_layout.typ": *

        #set page(
          paper: standard_paper,
          margin: margins_abnt_legal,
          header: asppibra_header_running(
              doc_number: "2026-TEST/MODULAR",
              doc_title: "Documento de Teste Modular",
          ),
          footer: asppibra_footer(doc_number: "2026-TEST/MODULAR", auth_code: "AUTH-MOD-01"),
        )

        #asppibra_header_first_page(doc_number: "2026-TEST/MODULAR")

        #section_heading("TESTE MODULAR INSTITUCIONAL")

        Entidade: #asppibra_razao_social \
        CNPJ Oficial: #asppibra_cnpj \
        Sigla: #asppibra_sigla \
        Tag Teste: #asppibra_tag("CAMPO_OBRIGATORIO", "Valor Preenchido")
        "##;

        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
            string_inputs: HashMap::new(),
            static_sources: CANONICAL_TYPST_STATIC_SOURCES,
        };

        let pdf_bytes = compile_typst_document(options)
            .expect("Compilação via facade modular asppibra_layout.typ deve funcionar");

        assert_valid_rendered(&RenderedDocument::new(pdf_bytes));
    }

    #[test]
    fn test_direct_core_modules_imports_without_facade() {
        let template = r##"
        #import "core/branding.typ": asppibra_razao_social, asppibra_cnpj, asppibra_sigla, color_gold
        #import "core/typography.typ": font_family_base, section_heading, font_size_title
        #import "core/page_abnt.typ": standard_paper, margins_institutional_contract
        #import "core/header_footer.typ": asppibra_header_first_page, asppibra_footer
        #import "core/data_tags.typ": asppibra_tag

        #set page(
          paper: standard_paper,
          margin: margins_institutional_contract,
          footer: asppibra_footer(doc_number: "2026-DIRECT/01", auth_code: "AUTH-01"),
        )

        #asppibra_header_first_page(doc_number: "2026-DIRECT/01")
        #section_heading("IMPORTAÇÃO DIRETA DOS MÓDULOS")

        Entidade: #asppibra_razao_social \
        CNPJ: #asppibra_cnpj \
        Sigla: #asppibra_sigla \
        Campo: #asppibra_tag("PROPRIETARIO", "Associado Direto")
        "##;

        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
            string_inputs: HashMap::new(),
            static_sources: CANONICAL_TYPST_STATIC_SOURCES,
        };

        let pdf_bytes = compile_typst_document(options)
            .expect("Compilação com importação direta dos módulos core/ deve funcionar");

        assert_valid_rendered(&RenderedDocument::new(pdf_bytes));
    }

    #[test]
    fn test_transitive_nested_imports_multi_tier() {
        // Testa a cadeia transitiva:
        // Documento -> asppibra_layout.typ -> core/header_footer.typ -> branding.typ / typography.typ
        let template = r##"
        #import "asppibra_layout.typ": asppibra_header_first_page, asppibra_footer, asppibra_tag, margins_contract, standard_paper

        #set page(
          paper: standard_paper,
          margin: margins_contract,
          footer: asppibra_footer(doc_number: "2026-TIER/01", auth_code: "HASH-OK"),
        )

        #asppibra_header_first_page(doc_number: "2026-TIER/01")
        #asppibra_tag("VALIDACAO_TRANSITIVA", "Sucesso em Memória")
        "##;

        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
            string_inputs: HashMap::new(),
            static_sources: CANONICAL_TYPST_STATIC_SOURCES,
        };

        let pdf_bytes = compile_typst_document(options)
            .expect("Cadeia transitiva completa em memória deve compilar perfeitamente");

        assert_valid_rendered(&RenderedDocument::new(pdf_bytes));
    }

    #[test]
    fn test_page_abnt_profiles_and_backward_compatibility_aliases() {
        let template = r##"
        #import "core/page_abnt.typ": *

        #let c1 = margins_institutional_contract
        #let c2 = margins_contract
        #let c3 = margins_abnt_legal

        #let f1 = margins_institutional_financial
        #let f2 = margins_financial

        #let t1 = margins_institutional_territorial
        #let t2 = margins_territorial
        #let t3 = margins_report

        #set page(paper: standard_paper, margin: c1)
        [Perfis de Margens Verificados: Contratual, Financeiro e Territorial]
        "##;

        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
            string_inputs: HashMap::new(),
            static_sources: CANONICAL_TYPST_STATIC_SOURCES,
        };

        let pdf_bytes = compile_typst_document(options)
            .expect("Perfis institucionais de margens e aliases devem compilar corretamente");

        assert_valid_rendered(&RenderedDocument::new(pdf_bytes));
    }

    #[test]
    fn test_footer_does_not_claim_icp_brasil_authentication() {
        // Garante que o template do rodapé em core/header_footer.typ
        // NÃO alega autenticação ICP-Brasil
        let footer_source = include_str!("../../../templates/core/header_footer.typ");
        assert!(
            !footer_source.contains("ICP-Brasil"),
            "O rodapé não deve conter alegação indevida de certificação ICP-Brasil"
        );
        assert!(
            footer_source.contains("Registro Nº"),
            "O rodapé deve conter a identificação explícita do número de registro"
        );
        assert!(
            footer_source.contains("DevOS"),
            "O rodapé deve refletir a identificação do sistema emissor DevOS"
        );
    }

    #[test]
    fn test_footer_rejects_none_empty_and_whitespace_only_parameters() {
        let invalid_cases = [
            ("doc_number: none", "auth_code: \"2026-X7Y9\""),
            ("doc_number: \"\"", "auth_code: \"2026-X7Y9\""),
            ("doc_number: \"   \"", "auth_code: \"2026-X7Y9\""),
            ("doc_number: \"2026-0001/CP\"", "auth_code: none"),
            ("doc_number: \"2026-0001/CP\"", "auth_code: \"\""),
            ("doc_number: \"2026-0001/CP\"", "auth_code: \"   \""),
        ];

        for (doc_part, auth_part) in invalid_cases {
            let template = format!(
                r##"
                #import "core/header_footer.typ": asppibra_footer
                #asppibra_footer({doc_part}, {auth_part})
                "##
            );
            let options = TypstCompileOptions {
                template_source: &template,
                fonts: &[],
                string_inputs: HashMap::new(),
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };
            assert!(
                compile_typst_document(options).is_err(),
                "asppibra_footer deve falhar para {doc_part}, {auth_part}"
            );
        }
    }

    #[test]
    fn test_header_rejects_none_empty_and_whitespace_only_parameters() {
        // 1. First page header: doc_number rejeita none, "" e "   "
        for invalid_doc in ["none", "\"\"", "\"   \""] {
            let template = format!(
                r##"
                #import "core/header_footer.typ": asppibra_header_first_page
                #asppibra_header_first_page(doc_number: {invalid_doc})
                "##
            );
            let options = TypstCompileOptions {
                template_source: &template,
                fonts: &[],
                string_inputs: HashMap::new(),
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };
            assert!(
                compile_typst_document(options).is_err(),
                "asppibra_header_first_page deve falhar para doc_number={invalid_doc}"
            );
        }

        // 2. Running header: doc_number e doc_title rejeitam none, "" e "   "
        let invalid_cases = [
            ("doc_number: none", "doc_title: \"Contrato de Posse\""),
            ("doc_number: \"\"", "doc_title: \"Contrato de Posse\""),
            ("doc_number: \"   \"", "doc_title: \"Contrato de Posse\""),
            ("doc_number: \"2026-0001/CP\"", "doc_title: none"),
            ("doc_number: \"2026-0001/CP\"", "doc_title: \"\""),
            ("doc_number: \"2026-0001/CP\"", "doc_title: \"   \""),
        ];

        for (doc_part, title_part) in invalid_cases {
            let template = format!(
                r##"
                #import "core/header_footer.typ": asppibra_header_running
                #asppibra_header_running({doc_part}, {title_part})
                "##
            );
            let options = TypstCompileOptions {
                template_source: &template,
                fonts: &[],
                string_inputs: HashMap::new(),
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };
            assert!(
                compile_typst_document(options).is_err(),
                "asppibra_header_running deve falhar para {doc_part}, {title_part}"
            );
        }
    }

    #[test]
    fn test_cessao_posse_template_rejects_missing_empty_or_whitespace_metadata() {
        let renderer = TypstDocumentRenderer::new();

        for (doc_num, auth_code) in [
            ("", "2026-X7Y9"),
            ("   ", "2026-X7Y9"),
            ("2026-0001/CP", ""),
            ("2026-0001/CP", "   "),
        ] {
            let payload = CessaoPossePayload {
                document_number: doc_num.to_string(),
                auth_code: auth_code.to_string(),
                data: json!({"cedenteNome": "Teste"}),
            };

            let result = renderer.render(DocumentRequest::CessaoPosse(payload));
            assert!(
                result.is_err(),
                "O template contrato_cessao_posse.typ deve rejeitar document_number='{doc_num}' e auth_code='{auth_code}'"
            );
        }

        // Também valida JSON bruto sem document_number ou sem auth_code (ausência total da chave)
        for raw_json in [
            json!({"auth_code": "2026-X7Y9", "data": {}}),
            json!({"document_number": "2026-0001/CP", "data": {}}),
            json!({"data": {}}),
        ] {
            let mut string_inputs = HashMap::new();
            string_inputs.insert("data", raw_json.to_string());

            let options = TypstCompileOptions {
                template_source: CONTRATO_CESSAO_TEMPLATE,
                fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
                string_inputs,
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };

            assert!(
                compile_typst_document(options).is_err(),
                "O template contrato_cessao_posse.typ deve falhar quando document_number ou auth_code estão ausentes no JSON"
            );
        }
    }

    #[test]
    fn test_cessao_posse_template_uses_canonical_import_and_has_no_duplicate_section_heading() {
        assert!(
            CONTRATO_CESSAO_TEMPLATE.contains("#import \"asppibra_layout.typ\": *"),
            "contrato_cessao_posse.typ deve importar canonicamente asppibra_layout.typ"
        );
        assert!(
            !CONTRATO_CESSAO_TEMPLATE.contains("#let section_heading"),
            "contrato_cessao_posse.typ não deve redeclarar section_heading localmente"
        );
        assert!(
            !CONTRATO_CESSAO_TEMPLATE.contains("2026-0001/CP"),
            "contrato_cessao_posse.typ não deve conter fallback hardcoded 2026-0001/CP"
        );
        assert!(
            !CONTRATO_CESSAO_TEMPLATE.contains("2026-X7Y9"),
            "contrato_cessao_posse.typ não deve conter fallback hardcoded 2026-X7Y9"
        );
    }

    #[test]
    fn test_templates_do_not_contain_unverified_legal_or_d1_claims() {
        let templates = [
            ("extrato_citizen_ledger.typ", CITIZEN_TEMPLATE),
            ("invoice_bill.typ", INVOICE_TEMPLATE),
            ("contrato_cessao_posse.typ", CONTRATO_CESSAO_TEMPLATE),
            ("real_estate_reconciliation.typ", RECONCILIATION_TEMPLATE),
            ("core/header_footer.typ", CORE_HEADER_FOOTER),
        ];

        let forbidden_system_claims = [
            "CHANCELA DIGITAL DE AUDITORIA",
            "Autenticação digital sob a Lei Federal nº 14.063/2020",
            "protocolo criptográfico com carimbo do tempo",
            "VERIFICADO ✓",
            "Cloudflare D1",
            "Protocolo D1",
            "Hash D1",
            "AUTENTICAÇÃO CRIPTOGRÁFICA D1 LEDGER",
            "poderão ser utilizadas como elemento de prova eletrônica",
            "05d4084730d36b1073d62c37ab83e9c425d795b5ff34ed949083cdbf02fd7b33",
        ];

        for (name, source) in templates {
            for forbidden in forbidden_system_claims {
                assert!(
                    !source.contains(forbidden),
                    "O template {name} não deve conter a alegação de sistema não implementada '{forbidden}'"
                );
            }
        }

        // Templates não contratuais e componentes de cabeçalho/rodapé não devem mencionar ICP-Brasil ou Lei 14.063/2020
        for (name, source) in [
            ("extrato_citizen_ledger.typ", CITIZEN_TEMPLATE),
            ("invoice_bill.typ", INVOICE_TEMPLATE),
            ("real_estate_reconciliation.typ", RECONCILIATION_TEMPLATE),
            ("core/header_footer.typ", CORE_HEADER_FOOTER),
        ] {
            for term in ["ICP-Brasil", "14.063/2020", "carimbo do tempo"] {
                assert!(
                    !source.contains(term),
                    "O template {name} não deve conter '{term}'"
                );
            }
        }

        // Garante que as cláusulas jurídicas materiais 16.1 e 16.2 do contrato foram preservadas
        assert!(
            CONTRATO_CESSAO_TEMPLATE.contains(
                "16.1. As partes reconhecem, desde já, a validade jurídica, a autenticidade e a força probante da assinatura eletrônica aposta a este instrumento"
            ),
            "A cláusula contratual material 16.1 deve ser preservada integralmente"
        );
        assert!(
            CONTRATO_CESSAO_TEMPLATE.contains(
                "16.2. Consideram-se válidas, para fins de celebração e prova deste contrato entre as partes, as assinaturas eletrônicas nas modalidades simples, avançada ou qualificada (certificado ICP-Brasil)"
            ),
            "A cláusula contratual material 16.2 deve ser preservada integralmente"
        );
    }

    #[test]
    fn test_all_four_templates_import_canonical_layout_and_apply_institutional_profiles() {
        let expectations = [
            (
                "contrato_cessao_posse.typ",
                CONTRATO_CESSAO_TEMPLATE,
                "margins_institutional_contract",
            ),
            (
                "invoice_bill.typ",
                INVOICE_TEMPLATE,
                "margins_institutional_financial",
            ),
            (
                "extrato_citizen_ledger.typ",
                CITIZEN_TEMPLATE,
                "margins_institutional_financial",
            ),
            (
                "real_estate_reconciliation.typ",
                RECONCILIATION_TEMPLATE,
                "margins_institutional_territorial",
            ),
        ];

        for (name, source, expected_margin_profile) in expectations {
            assert!(
                source.contains("#import \"asppibra_layout.typ\": *"),
                "O template {name} deve importar explicitamente '#import \"asppibra_layout.typ\": *'"
            );
            assert!(
                source.contains(expected_margin_profile),
                "O template {name} deve aplicar o perfil geométrico {expected_margin_profile}"
            );
            assert!(
                source.contains("asppibra_header_first_page("),
                "O template {name} deve utilizar o cabeçalho institucional da 1ª página (asppibra_header_first_page)"
            );
            assert!(
                source.contains("asppibra_header_running("),
                "O template {name} deve utilizar o cabeçalho institucional corrente (asppibra_header_running)"
            );
            assert!(
                source.contains("asppibra_footer("),
                "O template {name} deve utilizar o rodapé institucional (asppibra_footer)"
            );
            assert!(
                source.contains("section_heading("),
                "O template {name} deve utilizar os títulos de seção institucionais (section_heading)"
            );
        }
    }

    #[test]
    fn test_all_non_contract_templates_reject_missing_or_empty_identifiers() {
        // 1. Garante que nenhum dos 3 templates não contratuais fabrica doc_number ou auth_code fictícios
        for (name, source) in [
            ("invoice_bill.typ", INVOICE_TEMPLATE),
            ("extrato_citizen_ledger.typ", CITIZEN_TEMPLATE),
            ("real_estate_reconciliation.typ", RECONCILIATION_TEMPLATE),
        ] {
            assert!(
                source.contains("require_registration: false"),
                "O template {name} deve utilizar require_registration: false nos cabeçalhos/rodapés até a FASE 7"
            );
            for forbidden_fabrication in [
                "\"FAT-\" +",
                "\"EXT-\" +",
                "\"REC-\" +",
                "\"CAD-MARICA-\"",
                "d1_protocol",
            ] {
                assert!(
                    !source.contains(forbidden_fabrication),
                    "O template {name} não deve fabricar identificador documental fictício ('{forbidden_fabrication}')"
                );
            }
        }

        // 2. InvoiceBill sem id ou com id vazio deve falhar na compilação do template
        for invalid_invoice_json in [
            json!({"invoice": {"id": "", "reference_month": "2026-10", "amount": 100.0, "status": "pending", "member_name": "Teste", "member_doc": "000", "due_date": "2026-10-31", "payment_method": "Pix", "items": []}}),
            json!({"invoice": {"id": "   ", "reference_month": "2026-10", "amount": 100.0, "status": "pending", "member_name": "Teste", "member_doc": "000", "due_date": "2026-10-31", "payment_method": "Pix", "items": []}}),
        ] {
            let mut string_inputs = HashMap::new();
            string_inputs.insert("data", invalid_invoice_json.to_string());
            let options = TypstCompileOptions {
                template_source: INVOICE_TEMPLATE,
                fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
                string_inputs,
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };
            assert!(
                compile_typst_document(options).is_err(),
                "invoice_bill.typ deve rejeitar fatura sem id válido"
            );
        }

        // 3. CitizenLedger sem associate.id ou sem meta.reference_period deve falhar na compilação do template
        for invalid_ledger_json in [
            json!({"meta": {"generated_at": "23/10/2026", "reference_period": ""}, "associate": {"id": "123", "name": "A", "cpf": "0", "email": "a@b", "avatar_letter": "A", "address_line1": "R", "address_line2": "B"}, "summary": {"total_contracted": "0", "total_paid": "0", "outstanding_balance": "0"}, "transactions": []}),
            json!({"meta": {"generated_at": "23/10/2026", "reference_period": "2026-10"}, "associate": {"id": "   ", "name": "A", "cpf": "0", "email": "a@b", "avatar_letter": "A", "address_line1": "R", "address_line2": "B"}, "summary": {"total_contracted": "0", "total_paid": "0", "outstanding_balance": "0"}, "transactions": []}),
        ] {
            let mut string_inputs = HashMap::new();
            string_inputs.insert("data", invalid_ledger_json.to_string());
            let options = TypstCompileOptions {
                template_source: CITIZEN_TEMPLATE,
                fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
                string_inputs,
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };
            assert!(
                compile_typst_document(options).is_err(),
                "extrato_citizen_ledger.typ deve rejeitar extrato sem associate.id ou sem meta.reference_period"
            );
        }

        // 4. RealEstateReconciliation sem generatedAt deve falhar na compilação do template
        for invalid_rec_json in [
            json!({"generatedAt": "   ", "stats": {"totalProperties": 1, "totalIdentifiers": 1, "totalAddresses": 1, "totalBatches": 1, "openFindingsCount": 0, "pendingProposalsCount": 0}, "batches": [], "findings": [], "properties": []}),
            json!({"stats": {"totalProperties": 1, "totalIdentifiers": 1, "totalAddresses": 1, "totalBatches": 1, "openFindingsCount": 0, "pendingProposalsCount": 0}, "batches": [], "findings": [], "properties": []}),
        ] {
            let mut string_inputs = HashMap::new();
            string_inputs.insert("data", invalid_rec_json.to_string());
            let options = TypstCompileOptions {
                template_source: RECONCILIATION_TEMPLATE,
                fonts: &[ROBOTO_REGULAR, ROBOTO_BOLD],
                string_inputs,
                static_sources: CANONICAL_TYPST_STATIC_SOURCES,
            };
            assert!(
                compile_typst_document(options).is_err(),
                "real_estate_reconciliation.typ deve rejeitar payload sem generatedAt válido"
            );
        }
    }

    #[test]
    fn test_cessao_posse_template_reconciles_full_legal_content_and_dynamic_fields() {
        // 0. Garante que não há artefatos residuais de JSX no template Typst
        for jsx_artifact in ["{' '}", "{\" \"}", "<Clause>", "</Clause>", "<DataTag"] {
            assert!(
                !CONTRATO_CESSAO_TEMPLATE.contains(jsx_artifact),
                "contrato_cessao_posse.typ não deve conter artefato residual de JSX: {jsx_artifact}"
            );
        }
        // 1. Verifica que todos os 17 capítulos + seções de assinaturas e testemunhas estão presentes (idênticos ao CessaoPosseContent.tsx)
        let required_sections = [
            "CAPÍTULO I – DAS PARTES",
            "CAPÍTULO II – DAS DECLARAÇÕES PRELIMINARES",
            "CAPÍTULO III – DO OBJETO",
            "CAPÍTULO IV – DA ORIGEM DA POSSE, CADEIA POSSESSÓRIA E REGULARIZAÇÃO FUNDIÁRIA",
            "CAPÍTULO V – DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO",
            "CAPÍTULO VI – DA FORMA DE PAGAMENTO E COMPROVAÇÃO",
            "CAPÍTULO VII – DAS OBRIGAÇÕES TRIBUTÁRIAS, MUNICIPAIS, NOTARIAIS E REGISTRAIS",
            "CAPÍTULO VIII – DA IMISSÃO NA POSSE E DAS BENFEITORIAS",
            "CAPÍTULO IX – DO INADIMPLEMENTO, JUROS E MULTA",
            "CAPÍTULO X – DA RESOLUÇÃO, DO DISTRATO E DE SUAS CONSEQUÊNCIAS",
            "CAPÍTULO XI – DA EVICÇÃO, DA PERDA DA POSSE E DA VERACIDADE DAS DECLARAÇÕES DO CEDENTE",
            "CAPÍTULO XII – DO CASO FORTUITO E DA FORÇA MAIOR",
            "CAPÍTULO XIII – DA PROTEÇÃO DE DADOS PESSOAIS",
            "CAPÍTULO XIV – DA MEDIAÇÃO, DA ARBITRAGEM E DO FORO",
            "CAPÍTULO XV – DAS CUSTAS E HONORÁRIOS EM CASO DE LITÍGIO",
            "CAPÍTULO XVI – DA ASSINATURA ELETRÔNICA E DA ATUALIZAÇÃO CADASTRAL",
            "CAPÍTULO XVII – DISPOSIÇÕES GERAIS",
            "ASSINATURAS E VALIDAÇÃO DIGITAL",
            "TESTEMUNHAS INSTRUMENTÁRIAS",
        ];

        for section in required_sections {
            assert!(
                CONTRATO_CESSAO_TEMPLATE.contains(section),
                "O template contrato_cessao_posse.typ deve conter a seção '{section}'"
            );
        }

        // 2. Verifica que as subcláusulas e parágrafos reconciliados (que estavam condensados antes da Fase 4) estão integralmente presentes
        let required_clauses = [
            "1.5.1.",
            "1.5.8.",
            "1.5.12.",
            "1.5.17.",
            "1.5.25.",
            "1.5.34.",
            "1.5.45.",
            "2.7.1.",
            "2.7.2.",
            "2.8.",
            "2.8.1.",
            "3.3.1.",
            "3.3.2.",
            "3.3.3.",
            "4.1.1.",
            "4.2.1.",
            "4.3.1.",
            "4.9.",
            "5.7.1.",
            "5.7.2.",
            "6.5.",
            "7.5.1.",
            "7.7.",
            "8.4.1.",
            "9.6.",
            "10.2.1.",
            "10.2.2.",
            "10.2.3.",
            "10.2.3.1.",
            "10.2.3.2.",
            "10.2.3.3.",
            "10.3.1.",
            "10.3.2.",
            "10.3.3.",
            "10.3.4.",
            "10.5.",
            "11.1.1.",
            "11.1.2.",
            "11.1.3.",
            "11.5.",
            "12.1.",
            "12.2.",
            "13.1.",
            "13.2.",
            "13.3.",
            "13.4.",
            "14.1.",
            "14.2.",
            "14.3.",
            "15.1.",
            "16.1.",
            "16.2.",
            "16.3.",
            "16.4.",
            "16.5.",
            "16.6.",
            "17.1.",
            "17.2.",
            "17.3.",
            "17.4.",
            "17.5.",
            "17.6.",
            "17.7.",
            "17.8.",
            "17.9.",
            "17.10.",
        ];

        for clause_marker in required_clauses {
            assert!(
                CONTRATO_CESSAO_TEMPLATE.contains(clause_marker),
                "O template contrato_cessao_posse.typ deve conter a cláusula reconciliada '{clause_marker}'"
            );
        }

        // 3. Verifica a presença dos campos dinâmicos reconciliados que estavam ausentes antes da Fase 4
        let reconciled_fields = [
            "conjugeQualidade",
            "asppibraRepresentanteNacionalidade",
            "asppibraRepresentanteEstadoCivil",
            "asppibraRepresentanteRgOrgaoUf",
            "asppibraDocumentoPoderes",
            "asppibraRemuneracaoValor",
            "asppibraRemuneracaoValorExtenso",
            "asppibraRemuneracaoPercentual",
            "asppibraRemuneracaoBaseCalculo",
            "asppibraRemuneracaoResponsavel",
            "comarcaCartorioImoveis",
            "municipioPrefeitura",
            "numeroCertidaoFiscalVenal",
            "cpfCnpjTitularCadastral",
            "nomeLoteamento",
            "municipioLoteamento",
            "processoAdmLoteamento",
            "cartorioLoteamento",
            "registroLoteamento",
            "identificacaoLoteTerreno",
            "dataReferenciaIptu",
            "valorTotalDividaExtenso",
            "anoVigenteIptu",
            "valorParcelaIptu",
            "numeroParcelasIptu",
            "saldoVencerIptu",
            "capituloPenalidadesOmissao",
            "prazoComprovacaoQuitacaoDivida",
            "prazoApresentacaoComprovanteParcelamento",
            "totalParcelasMensais",
            "valorTotalCiclo",
            "vencimentoPrimeiroCiclo",
            "prazoEntregaCertidoes",
            "prazoEntregaCertidoesDisponibilizadas",
            "plataformaAssinatura",
            "municipioAssinatura",
            "diaAssinatura",
            "mesAssinatura",
            "anoAssinatura",
            "cedenteAssinatura",
            "cessionarioAssinatura",
            "conjugeAssinatura",
            "asppibraAssinatura",
            "testemunha1Assinatura",
            "testemunha2Assinatura",
            "testemunha3Assinatura",
        ];

        for field in reconciled_fields {
            let pattern = format!("#get_val(\"{field}\",");
            assert!(
                CONTRATO_CESSAO_TEMPLATE.contains(&pattern),
                "O template contrato_cessao_posse.typ deve conter o campo dinâmico reconciliado '{field}'"
            );
        }

        // 4. Compila o contrato reconciliado preenchendo os campos dinâmicos e verifica o PDF gerado
        let renderer = TypstDocumentRenderer::new();
        let payload = CessaoPossePayload {
            document_number: "2026-FASE4-0001/CP".to_string(),
            auth_code: "AUTH-FASE4-2026".to_string(),
            data: json!({
                "cedenteNome": "CARLOS ALBERTO MENDES",
                "cessionarioNome": "FERNANDA LIMA COSTA",
                "conjugeQualidade": "anuente",
                "asppibraRepresentanteNome": "SANDRO PEREIRA",
                "asppibraRemuneracaoValor": "3.500,00",
                "nomeLoteamento": "Jardim Atlântico",
                "municipioLoteamento": "Maricá/RJ",
                "numeroLote": "14",
                "quadraLote": "B",
                "valorTotalCessao": "120.000,00",
                "plataformaAssinatura": "Gov.br",
                "municipioAssinatura": "Maricá/RJ",
                "diaAssinatura": "03",
                "mesAssinatura": "novembro",
                "anoAssinatura": "2026"
            }),
        };

        let rendered = renderer
            .render(DocumentRequest::CessaoPosse(payload))
            .expect("O contrato reconciliado deve compilar com sucesso");

        assert_valid_rendered(&rendered);
        assert!(
            rendered.pdf_bytes.len() > 20_000,
            "O PDF do contrato integral reconciliado deve possuir tamanho substancial (> 20 KB), obtido: {} bytes",
            rendered.pdf_bytes.len()
        );
    }

    #[test]
    fn test_invoice_bill_template_renders_exact_final_total_across_scenarios() {
        let renderer = TypstDocumentRenderer::new();

        let scenarios = [
            // (amount, taxes, discount, expected_total_str)
            (dec!(150.0), None, None, "Total: R$ 150"),
            (dec!(150.0), Some(dec!(15.5)), None, "Total: R$ 165.5"),
            (dec!(150.0), None, Some(dec!(20.0)), "Total: R$ 130"),
            (dec!(150.0), Some(dec!(15.5)), Some(dec!(20.0)), "Total: R$ 145.5"),
        ];

        for (amount, taxes, discount, expected_total_marker) in scenarios {
            let payload = InvoiceReportPayload {
                id: "FAT-CALC-TEST".to_string(),
                member_name: "Associado Financeiro".to_string(),
                member_doc: "123.456.789-00".to_string(),
                member_email: None,
                member_address: None,
                description: "Fatura Teste Cálculo".to_string(),
                reference_month: "2026-10".to_string(),
                amount,
                due_date: "2026-10-31".to_string(),
                settled_date: None,
                payment_method: "Pix".to_string(),
                status: "pending".to_string(),
                items: vec![InvoiceReportItem {
                    id: "item-1".to_string(),
                    description: "Serviço Associativo".to_string(),
                    service: None,
                    quantity: dec!(1.0),
                    price: amount,
                    total: amount,
                }],
                taxes,
                discount,
                d1_protocol: None,
            };

            let rendered = renderer
                .render(DocumentRequest::InvoiceBill(payload))
                .expect("Renderização da fatura deve compilar com sucesso");

            assert_valid_rendered(&rendered);

            let pdf_lossy = String::from_utf8_lossy(&rendered.pdf_bytes);
            assert!(
                pdf_lossy.contains(expected_total_marker),
                "PDF da fatura deve conter '{expected_total_marker}' para amount={amount}, taxes={taxes:?}, discount={discount:?}"
            );
        }
    }
}
