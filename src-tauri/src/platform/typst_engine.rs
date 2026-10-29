use std::collections::HashMap;
use thiserror::Error;
use typst::foundations::{Dict, Value};
use typst_as_lib::TypstEngine;

const PDF_HEADER: &[u8] = b"%PDF-";

#[derive(Error, Debug, PartialEq, Eq)]
pub enum TypstEngineError {
    #[error("Erro de compilação Typst: {0}")]
    CompilationFailed(String),
    #[error("Erro na renderização do PDF vetorial: {0}")]
    PdfRenderingFailed(String),
    #[error("Saída inválida do compilador: o buffer não contém cabeçalho canônico %PDF-")]
    InvalidPdfOutput,
}

/// Parâmetros técnicos para compilação Typst inteiramente em memória.
///
/// Não contém regras de negócio nem caminhos de arquivos de destino.
pub struct TypstCompileOptions<'a> {
    pub template_source: &'a str,
    pub fonts: &'a [&'a [u8]],
    pub string_inputs: HashMap<&'a str, String>,
}

/// Compila um documento Typst em memória e retorna os bytes do PDF.
///
/// A função não realiza operações explícitas de escrita em disco e não
/// depende de janela, IPC ou serviços específicos da aplicação.
pub fn compile_typst_document(
    options: TypstCompileOptions<'_>,
) -> Result<Vec<u8>, TypstEngineError> {
    let mut inputs = Dict::new();
    for (key, value) in options.string_inputs {
        inputs.insert(key.into(), Value::Str(value.into()));
    }

    let engine = TypstEngine::builder()
        .main_file(options.template_source)
        .fonts(options.fonts.iter().copied())
        .build();

    let document = engine
        .compile_with_input(inputs)
        .output
        .map_err(|err| TypstEngineError::CompilationFailed(err.to_string()))?;

    let pdf_bytes = typst_pdf::pdf(&document, &Default::default())
        .map_err(|err| TypstEngineError::PdfRenderingFailed(format!("{err:?}")))?;

    if !pdf_bytes.starts_with(PDF_HEADER) {
        return Err(TypstEngineError::InvalidPdfOutput);
    }

    Ok(pdf_bytes)
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
        };

        let bytes = compile_typst_document(options).unwrap_or_else(|error| {
            panic!("Falha ao compilar documento mínimo: {error:?}")
        });

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
        };

        let bytes = compile_typst_document(options).unwrap_or_else(|error| {
            panic!("Falha ao compilar documento com entradas injetadas: {error:?}")
        });

        assert_valid_pdf_header(&bytes);
    }

    #[test]
    fn test_invalid_typst_syntax_returns_compilation_error() {
        let template = concat!(
            "#set page(paper: \"a4\"\n",
            "// falta fechar parenteses"
        );
        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[],
            string_inputs: HashMap::new(),
        };

        let error = compile_typst_document(options)
            .expect_err("Sintaxe Typst inválida deve retornar um erro");

        assert!(
            matches!(&error, TypstEngineError::CompilationFailed(_)),
            "Esperava CompilationFailed, mas recebeu: {error:?}"
        );
    }
}
