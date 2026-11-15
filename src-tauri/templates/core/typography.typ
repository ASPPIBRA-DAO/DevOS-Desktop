// ====================================================================
// ASPPIBRA DAO - Tipografia Canônica e Escalas de Texto
// Módulo: core/typography.typ
// ====================================================================

#import "branding.typ": color_primary, color_primary_text

// Famílias Tipográficas Homologadas
#let font_family_base = ("Roboto", "Liberation Sans", "Arial")
#let font_family_mono = ("Roboto Mono", "Liberation Mono", "DejaVu Sans Mono", "monospace")

// Escala Tipográfica Institucional
#let font_size_title = 13.5pt
#let font_size_heading = 11pt
#let font_size_section = 9pt
#let font_size_legal = 8.5pt
#let font_size_body = 8.5pt
#let font_size_subtitle = 7.5pt
#let font_size_running = 7pt
#let font_size_caption = 6.5pt
#let font_size_tag = 7.5pt

// Parâmetros de Entrelinha e Parágrafo
#let leading_tight = 0.3em
#let leading_header = 0.35em
#let leading_body = 0.6em
#let first_line_indent_abnt = 1.25cm

// Tokens de Espaçamento Semântico
#let spacing_section_before = 8pt
#let spacing_section_after = 3pt
#let spacing_paragraph = 0.5em

// Utilitário de Cabeçalho de Seção Padronizado
#let section_heading(title) = {
  v(spacing_section_before)
  align(center)[#text(weight: "bold", size: font_size_section, fill: color_primary)[#title]]
  v(spacing_section_after)
}
