// ====================================================================
// ASPPIBRA DAO - Componente de Tags e Destaque Visual de Dados
// Módulo: core/data_tags.typ
// ====================================================================

#import "branding.typ": *
#import "typography.typ": *

// Renderizador Dinâmico de Tags e Valores Oficiais
// - Se houver valor válido preenchido (não nulo e não composto apenas por espaços),
//   o valor é renderizado com destaque institucional tipográfico (sublinhado e negrito).
// - Caso contrário (ausência de dados ou valor igual ao rótulo marcador), é renderizada
//   a tag dourada de placeholder oficial indicando o campo pendente.
#let asppibra_tag(tag_label, value) = {
  let val_trimmed = if value != none { str(value).trim() } else { "" }
  let label_trimmed = if tag_label != none and str(tag_label).trim() != "" { str(tag_label).trim() } else { "CAMPO PENDENTE" }
  if val_trimmed != "" and val_trimmed != label_trimmed {
    underline(strong(text(fill: color_primary_text)[#val_trimmed]))
  } else {
    box(
      fill: color_gold_light,
      stroke: 0.8pt + color_gold,
      radius: 2pt,
      inset: (x: 4pt, y: 1.5pt),
      baseline: 1pt,
      [#text(size: font_size_tag, weight: "bold", fill: color_gold_dark)[#label_trimmed]]
    )
  }
}
