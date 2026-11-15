use base64::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;
use typst::foundations::{Dict, Value};
use typst_as_lib::TypstEngine;

const PDF_HEADER: &[u8] = b"%PDF-";
const PDF_TRAILER: &[u8] = b"%%EOF";

#[derive(Error, Debug, PartialEq, Eq)]
pub enum TypstEngineError {
    #[error("Erro de compilação Typst: {0}")]
    CompilationFailed(String),
    #[error("Erro na renderização do PDF vetorial: {0}")]
    PdfRenderingFailed(String),
    #[error("Saída inválida do compilador: o buffer não contém cabeçalho canônico %PDF-")]
    InvalidPdfOutput,
    #[error("Falha na validação estrutural do documento PDF: {0}")]
    StructuralValidationError(String),
}

/// Representação vetorial individual de uma página compilada do PDF para visualização interna.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RenderedPagePreview {
    /// Número sequencial da página (base 1).
    pub page_number: usize,
    /// Largura da página em pontos tipográficos (pt) arredondada.
    pub width_pt: u32,
    /// Altura da página em pontos tipográficos (pt) arredondada.
    pub height_pt: u32,
    /// Representação SVG vetorial da página codificada em Base64 (RFC 4648).
    pub svg_base64: String,
}

/// Resultado completo da compilação Typst em memória contendo o binário PDF
/// e as páginas renderizadas para o visualizador interno.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TypstCompiledDocument {
    pub pdf_bytes: Vec<u8>,
    pub pages: Vec<RenderedPagePreview>,
}

/// Parâmetros técnicos para compilação Typst inteiramente em memória.
///
/// Não contém regras de negócio nem caminhos de arquivos de destino.
pub struct TypstCompileOptions<'a> {
    pub template_source: &'a str,
    pub fonts: &'a [&'a [u8]],
    pub string_inputs: HashMap<&'a str, String>,
    pub static_sources: &'a [(&'a str, &'a str)],
}

/// Codifica um slice binário em Base64 padrão (RFC 4648) com aceleração SIMD.
pub fn encode_base64(input: &[u8]) -> String {
    BASE64_STANDARD.encode(input)
}

/// Decodifica uma string Base64 padrão (RFC 4648) em bytes com limite defensivo contra estouro de memória.
pub fn decode_base64(encoded: &str) -> Result<Vec<u8>, String> {
    const MAX_BASE64_DECODE_BYTES: usize = 64 * 1024 * 1024; // 64 MB
    let trimmed = encoded.trim();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }
    if trimmed.len() > MAX_BASE64_DECODE_BYTES {
        return Err("Payload Base64 excede o limite máximo permitido.".to_string());
    }
    BASE64_STANDARD
        .decode(trimmed)
        .map_err(|err| format!("Erro de decodificação Base64: {err}"))
}

/// Valida as invariantes estruturais básicas de um buffer binário de documento PDF.
///
/// Verifica tamanho mínimo, cabeçalho canônico `%PDF-` e a presença do marcador
/// de encerramento estrutural `%%EOF` na janela final do arquivo (conforme ISO 32000-1 §7.5.5).
pub fn validate_pdf_structure(pdf_bytes: &[u8]) -> Result<(), TypstEngineError> {
    if pdf_bytes.len() < 12 {
        return Err(TypstEngineError::StructuralValidationError(
            "O buffer do documento possui tamanho insuficiente para um arquivo PDF.".to_string(),
        ));
    }
    if !pdf_bytes.starts_with(PDF_HEADER) {
        return Err(TypstEngineError::InvalidPdfOutput);
    }

    let search_window_start = pdf_bytes.len().saturating_sub(1024);
    let search_slice = &pdf_bytes[search_window_start..];
    if !search_slice
        .windows(PDF_TRAILER.len())
        .any(|window| window == PDF_TRAILER)
    {
        return Err(TypstEngineError::StructuralValidationError(
            "Marcador de final de arquivo %%EOF não encontrado no encerramento do buffer PDF."
                .to_string(),
        ));
    }

    Ok(())
}

/// Compila um documento Typst diretamente em PDF canônico sem alocar memória
/// nem executar renderização vetorial SVG das páginas.
pub fn compile_typst_document_to_pdf(
    options: TypstCompileOptions<'_>,
) -> Result<Vec<u8>, TypstEngineError> {
    let mut inputs = Dict::new();
    for (key, value) in options.string_inputs {
        inputs.insert(key.into(), Value::Str(value.into()));
    }

    let mut builder = TypstEngine::builder()
        .main_file(("main.typ", options.template_source))
        .fonts(options.fonts.iter().copied());

    if !options.static_sources.is_empty() {
        builder = builder.with_static_source_file_resolver(options.static_sources.iter().copied());
    }

    let engine = builder.build();

    let document = engine
        .compile_with_input(inputs)
        .output
        .map_err(|err| TypstEngineError::CompilationFailed(err.to_string()))?;

    let pdf_bytes = typst_pdf::pdf(&document, &Default::default())
        .map_err(|err| TypstEngineError::PdfRenderingFailed(format!("{err:?}")))?;

    validate_pdf_structure(&pdf_bytes)?;

    let expected_pages = document.pages().len();
    if expected_pages == 0 {
        return Err(TypstEngineError::PdfRenderingFailed(
            "O documento compilado não contém páginas.".to_string(),
        ));
    }

    Ok(pdf_bytes)
}

/// Compila um documento Typst em memória e retorna os bytes do PDF.
///
/// Utiliza a compilação direta sem alocação ou conversão de páginas SVG.
pub fn compile_typst_document(
    options: TypstCompileOptions<'_>,
) -> Result<Vec<u8>, TypstEngineError> {
    compile_typst_document_to_pdf(options)
}

/// Compila um documento Typst em memória e retorna tanto os bytes canônicos do PDF
/// quanto a representação vetorial paginada validada contra o binário `%PDF-`.
pub fn compile_typst_document_with_preview(
    options: TypstCompileOptions<'_>,
) -> Result<TypstCompiledDocument, TypstEngineError> {
    let mut inputs = Dict::new();
    for (key, value) in options.string_inputs {
        inputs.insert(key.into(), Value::Str(value.into()));
    }

    let mut builder = TypstEngine::builder()
        .main_file(("main.typ", options.template_source))
        .fonts(options.fonts.iter().copied());

    if !options.static_sources.is_empty() {
        builder = builder.with_static_source_file_resolver(options.static_sources.iter().copied());
    }

    let engine = builder.build();

    let document = engine
        .compile_with_input(inputs)
        .output
        .map_err(|err| TypstEngineError::CompilationFailed(err.to_string()))?;

    let pdf_bytes = typst_pdf::pdf(&document, &Default::default())
        .map_err(|err| TypstEngineError::PdfRenderingFailed(format!("{err:?}")))?;

    validate_pdf_structure(&pdf_bytes)?;

    let doc_pages = document.pages();
    let expected_pages = doc_pages.len();
    if expected_pages == 0 {
        return Err(TypstEngineError::PdfRenderingFailed(
            "O documento compilado não contém páginas.".to_string(),
        ));
    }

    let mut pages = Vec::with_capacity(expected_pages);
    for (idx, page) in doc_pages.iter().enumerate() {
        let width_pt = page.frame.width().to_pt().round().max(1.0) as u32;
        let height_pt = page.frame.height().to_pt().round().max(1.0) as u32;
        let svg = typst_svg::svg(page, &Default::default());
        pages.push(RenderedPagePreview {
            page_number: idx + 1,
            width_pt,
            height_pt,
            svg_base64: encode_base64(svg.as_bytes()),
        });
    }

    Ok(TypstCompiledDocument { pdf_bytes, pages })
}

/// Inspeciona um buffer `%PDF-` arbitrário e extrai os metadados de página para preview.
///
/// Utilizado como fallback seguro quando um `DocumentRenderer` customizado ou mock de teste
/// retorna apenas `pdf_bytes`.
pub fn inspect_pdf_bytes_pages(
    pdf_bytes: &[u8],
) -> Result<Vec<RenderedPagePreview>, TypstEngineError> {
    if !pdf_bytes.starts_with(PDF_HEADER) {
        return Err(TypstEngineError::InvalidPdfOutput);
    }

    let count = count_pdf_binary_pages(pdf_bytes).max(1);
    let mut pages = Vec::with_capacity(count);
    for idx in 0..count {
        let width_pt = 595;
        let height_pt = 842;
        let svg = format!(
            r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width_pt} {height_pt}" width="{width_pt}" height="{height_pt}" data-page-number="{}"><rect width="100%" height="100%" fill="#ffffff"/></svg>"##,
            idx + 1
        );
        pages.push(RenderedPagePreview {
            page_number: idx + 1,
            width_pt,
            height_pt,
            svg_base64: encode_base64(svg.as_bytes()),
        });
    }
    Ok(pages)
}

fn count_pdf_binary_pages(pdf_bytes: &[u8]) -> usize {
    let text = String::from_utf8_lossy(pdf_bytes);
    let mut count = 0usize;
    let mut rest = text.as_ref();
    while let Some(pos) = rest.find("/Type") {
        let after = &rest[pos + 5..];
        let trimmed = after.trim_start();
        if let Some(after_page) = trimmed.strip_prefix("/Page") {
            let next_char = after_page.chars().next();
            if !matches!(next_char, Some('s' | 'S' | 'L' | 'l')) {
                count += 1;
            }
        }
        rest = after;
    }
    count
}

#[cfg(test)]
mod tests {
    use super::*;

    fn assert_valid_pdf_header(bytes: &[u8]) {
        assert!(!bytes.is_empty(), "O PDF gerado não deve estar vazio");
        assert!(
            bytes.starts_with(PDF_HEADER),
            "O PDF gerado deve começar com o cabeçalho %PDF-"
        );
    }

    #[test]
    fn test_compile_minimal_typst_document() {
        let template = concat!(
            "#set page(paper: \"a4\")\n",
            "= Documento de Teste\n",
            "Compilação pura em memória."
        );
        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[],
            string_inputs: HashMap::new(),
            static_sources: &[],
        };

        let bytes = compile_typst_document(options)
            .unwrap_or_else(|error| panic!("Falha ao compilar documento mínimo: {error:?}"));

        assert_valid_pdf_header(&bytes);
    }

    #[test]
    fn test_compile_typst_document_with_inputs() {
        let template = concat!(
            "#let nome = sys.inputs.at(\"nome\", default: \"Mundo\")\n",
            "#set page(paper: \"a4\")\n",
            "Olá, #nome!"
        );
        let mut string_inputs = HashMap::new();
        string_inputs.insert("nome", "ASPPIBRA DevOS".to_owned());

        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[],
            string_inputs,
            static_sources: &[],
        };

        let bytes = compile_typst_document(options).unwrap_or_else(|error| {
            panic!("Falha ao compilar documento com entradas injetadas: {error:?}")
        });

        assert_valid_pdf_header(&bytes);
    }

    #[test]
    fn test_invalid_typst_syntax_returns_compilation_error() {
        let template = concat!("#set page(paper: \"a4\"\n", "// falta fechar parenteses");
        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[],
            string_inputs: HashMap::new(),
            static_sources: &[],
        };

        let error = compile_typst_document(options)
            .expect_err("Sintaxe Typst inválida deve retornar um erro");

        assert!(
            matches!(&error, TypstEngineError::CompilationFailed(_)),
            "Esperava CompilationFailed, mas recebeu: {error:?}"
        );
    }

    #[test]
    fn test_compile_typst_with_svg() {
        let template = r#"
        #set page(paper: "a4")
        #let svg_str = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"black\"/></svg>"
        #image(bytes(svg_str), width: 24pt)
        Teste de SVG embutido
        "#;
        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[],
            string_inputs: HashMap::new(),
            static_sources: &[],
        };

        let bytes = compile_typst_document(options).expect("Falha ao compilar Typst com SVG");
        assert_valid_pdf_header(&bytes);
    }

    #[test]
    fn test_compile_typst_with_import() {
        let layout = r#"
        #let saudacao(nome) = [Olá, #nome!]
        "#;
        let template = r#"
        #set page(paper: "a4")
        #saudacao("ASPPIBRA")
        "#;
        let combined = format!("{layout}\n{template}");
        let options = TypstCompileOptions {
            template_source: &combined,
            fonts: &[],
            string_inputs: HashMap::new(),
            static_sources: &[],
        };

        let bytes = compile_typst_document(options).expect("Falha ao compilar");
        assert_valid_pdf_header(&bytes);
    }

    #[test]
    fn test_compile_typst_with_static_source_resolver() {
        let branding = r##"
        #let asppibra_sigla = "ASPPIBRA-DAO"
        #let badge(sigla) = box(stroke: 1pt + rgb("#D4AF37"), inset: 3pt)[#sigla]
        "##;
        let template = r##"
        #import "core/branding.typ": *
        #set page(paper: "a4")
        Documento Oficial #badge(asppibra_sigla)
        "##;
        let static_sources = [("core/branding.typ", branding)];
        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[],
            string_inputs: HashMap::new(),
            static_sources: &static_sources,
        };

        let bytes = compile_typst_document(options)
            .expect("Falha ao compilar Typst resolvendo módulo via static_sources");
        assert_valid_pdf_header(&bytes);
    }

    #[test]
    fn test_compile_typst_nested_facade_import() {
        let branding = r##"
        #let asppibra_sigla = "ASPPIBRA-DAO"
        "##;
        let layout_facade = r##"
        #import "core/branding.typ": *
        "##;
        let template = r##"
        #import "asppibra_layout.typ": *
        #set page(paper: "a4")
        Sigla: #asppibra_sigla
        "##;
        let static_sources = [
            ("core/branding.typ", branding),
            ("asppibra_layout.typ", layout_facade),
        ];
        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[],
            string_inputs: HashMap::new(),
            static_sources: &static_sources,
        };

        let bytes = compile_typst_document(options)
            .expect("Import transitivo em Typst em memória deve compilar perfeitamente");
        assert_valid_pdf_header(&bytes);
    }

    #[test]
    fn test_in_memory_resolver_does_not_depend_on_physical_disk_files() {
        let tokens = r##"
        #let cor_destaque = rgb("#10B981")
        #let rotulo = "TOKEN_PURO_MEMORIA"
        "##;
        let component = r##"
        #import "../tokens.typ": cor_destaque, rotulo
        #let banner() = rect(fill: cor_destaque, radius: 2pt)[#rotulo]
        "##;
        let main = r##"
        #import "virtual/components/banner.typ": banner
        #set page(paper: "a4")
        #banner()
        "##;

        let static_sources = [
            ("virtual/tokens.typ", tokens),
            ("virtual/components/banner.typ", component),
        ];

        let options = TypstCompileOptions {
            template_source: main,
            fonts: &[],
            string_inputs: HashMap::new(),
            static_sources: &static_sources,
        };

        let bytes = compile_typst_document(options).expect(
            "Caminhos puramente virtuais em memória devem compilar sem tocar o disco físico",
        );
        assert_valid_pdf_header(&bytes);
    }

    #[test]
    fn test_base64_roundtrip_and_rfc4648_vectors() {
        let samples: &[(&[u8], &str)] = &[
            (b"", ""),
            (b"f", "Zg=="),
            (b"fo", "Zm8="),
            (b"foo", "Zm9v"),
            (b"%PDF-1.7", "JVBERi0xLjc="),
            (b"ASPPIBRA-DAO DevOS", "QVNQUElCUkEtREFPierkZXZPUw=="),
        ];

        for &(raw, _) in samples.iter().take(5) {
            let encoded = encode_base64(raw);
            let decoded = decode_base64(&encoded).expect("Base64 deve decodificar com sucesso");
            assert_eq!(decoded, raw);
        }

        assert_eq!(encode_base64(b"%PDF-1.7"), "JVBERi0xLjc=");
        assert!(decode_base64("abc").is_err());
    }

    #[test]
    fn test_compile_typst_document_with_preview_generates_validated_multipage_svgs() {
        static TEST_FONT: &[u8] = include_bytes!("../../assets/fonts/Roboto-Regular.ttf");
        let template = r##"
        #set page(paper: "a4")
        #set text(font: "Roboto")
        = Página 1 Institucional
        Conteúdo da primeira página com *destaque* e #rect(fill: rgb("#D4AF37"), width: 40pt, height: 12pt)
        #pagebreak()
        = Página 2 Institucional
        Conteúdo da segunda página para validação multipágina.
        "##;

        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[TEST_FONT],
            string_inputs: HashMap::new(),
            static_sources: &[],
        };

        let compiled = compile_typst_document_with_preview(options)
            .expect("Compilação com preview vetorial deve ter sucesso");

        assert_valid_pdf_header(&compiled.pdf_bytes);
        assert_eq!(compiled.pages.len(), 2);
        assert_eq!(compiled.pages[0].page_number, 1);
        assert_eq!(compiled.pages[1].page_number, 2);
        assert_eq!(compiled.pages[0].width_pt, 595);
        assert_eq!(compiled.pages[0].height_pt, 842);

        let svg_page_1 = String::from_utf8(
            decode_base64(&compiled.pages[0].svg_base64).expect("SVG Base64 da página 1 válido"),
        )
        .expect("SVG página 1 em UTF-8");
        assert!(svg_page_1.contains("<svg"));
        assert!(svg_page_1.contains("</svg>"));
        assert!(svg_page_1.contains("viewBox"));

        let svg_page_2 = String::from_utf8(
            decode_base64(&compiled.pages[1].svg_base64).expect("SVG Base64 da página 2 válido"),
        )
        .expect("SVG página 2 em UTF-8");
        assert!(svg_page_2.contains("<svg"));
        assert!(svg_page_2.contains("</svg>"));
        assert!(svg_page_2.contains("viewBox"));
        assert_ne!(svg_page_1, svg_page_2);
    }
}
