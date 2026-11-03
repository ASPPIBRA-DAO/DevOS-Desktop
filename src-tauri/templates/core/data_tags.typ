// ====================================================================
// ASPPIBRA DAO - Componente de Tags e Destaque Visual de Dados
// Módulo: core/data_tags.typ
// ====================================================================

#import "branding.typ": *
#import "typography.typ": *

// Renderizador Dinâmico de Tags e Valores Oficiais
#let asppibra_tag(tag_label, value) = {
  if value != none and str(value) != "" and str(value) != tag_label {
    underline(strong(str(value)))
  } else {
    box(
      fill: color_gold_light,
      stroke: 0.8pt + color_gold,
      radius: 2pt,
      inset: (x: 4pt, y: 1.5pt),
      baseline: 1pt,
      [#text(size: font_size_tag, weight: "bold", fill: color_gold_dark)[#tag_label]]
    )
  }
}
