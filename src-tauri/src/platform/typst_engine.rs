use std::collections::HashMap;
use thiserror::Error;
use typst::foundations::{Dict, Value};
use typst_as_lib::TypstEngine;

#[derive(Error, Debug, PartialEq, Eq)]
pub enum TypstEngineError {
    #[error("Erro de compilação Typst: {0}")]
    CompilationFailed(String),
    #[error("Erro na renderização do PDF vetorial: {0}")]
    PdfRenderingFailed(String),
    #[error("Saída inválida do compilador: o buffer não contém cabeçalho canônico %PDF-")]
    InvalidPdfOutput,
}

/// Parâmetros de compilação para o motor Typst puramente técnico e em memória.
/// Não contém regras de negócio, nomes de entidades ou caminhos de arquivos do disco.
pub struct TypstCompileOptions<'a> {
    pub template_source: &'a str,
    pub fonts: &'a [&'a [u8]],
    pub string_inputs: HashMap<&'a str, String>,
}

/// Compila um documento Typst arbitrário fornecido em memória junto com as fontes e variáveis de entrada.
/// Retorna o buffer vetorial do PDF sem dependência de janela, IPC ou operações de disco.
pub fn compile_typst_document(options: TypstCompileOptions) -> Result<Vec<u8>, TypstEngineError> {
    let mut dict = Dict::new();
    for (key, val) in options.string_inputs {
        dict.insert(key.into(), Value::Str(val.into()));
    }

    let engine = TypstEngine::builder()
        .main_file(options.template_source)
        .fonts(options.fonts.iter().copied())
        .build();

    let doc = engine
        .compile_with_input(dict)
        .output
        .map_err(|err| TypstEngineError::CompilationFailed(format!("{:?}", err)))?;

    let pdf_bytes = typst_pdf::pdf(&doc, &Default::default())
        .map_err(|err| TypstEngineError::PdfRenderingFailed(format!("{:?}", err)))?;

    if !pdf_bytes.starts_with(b"%PDF-") {
        return Err(TypstEngineError::InvalidPdfOutput);
    }

    Ok(pdf_bytes)
}

#[cfg(test)]
pub mod tests {
    use super::*;

    #[test]
    fn test_compile_minimal_typst_document() {
        let template = "#set page(paper: \"a4\")\n= Documento de Teste\nCompilação pura em memória.";
        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[],
            string_inputs: HashMap::new(),
        };

        let result = compile_typst_document(options);
        assert!(result.is_ok(), "Falha ao compilar documento mínimo: {:?}", result.err());
        let bytes = result.unwrap();
        assert!(!bytes.is_empty());
        assert!(bytes.starts_with(b"%PDF-"));
    }

    #[test]
    fn test_compile_typst_document_with_inputs() {
        let template = "#let nome = sys.inputs.at(\"nome\", default: \"Mundo\")\n#set page(paper: \"a4\")\nOlá, #nome!";
        let mut inputs = HashMap::new();
        inputs.insert("nome", "ASPPIBRA DevOS".to_string());

        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[],
            string_inputs: inputs,
        };

        let result = compile_typst_document(options);
        assert!(result.is_ok(), "Falha ao compilar com inputs injetados: {:?}", result.err());
        let bytes = result.unwrap();
        assert!(bytes.starts_with(b"%PDF-"));
    }

    #[test]
    fn test_compile_invalid_typst_syntax_returns_error() {
        let template = "#set page(paper: \"a4\"\n// falta fechar parenteses";
        let options = TypstCompileOptions {
            template_source: template,
            fonts: &[],
            string_inputs: HashMap::new(),
        };

        let result = compile_typst_document(options);
        assert!(result.is_err(), "Sintaxe Typst inválida deve retornar TypstEngineError::CompilationFailed");
        match result.unwrap_err() {
            TypstEngineError::CompilationFailed(_) => {}
            other => panic!("Esperava CompilationFailed, obteve: {:?}", other),
        }
    }
}
