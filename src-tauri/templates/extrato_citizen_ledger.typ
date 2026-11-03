// ============================================================================
// ASPPIBRA DAO - Template Oficial do Livro-Razão do Cidadão (Typst)
// Consome a Biblioteca Institucional Modular (asppibra_layout.typ)
// ============================================================================

#import "asppibra_layout.typ": *

#let data = json(bytes(sys.inputs.data))

#let assoc_dict = if type(data) == dictionary and "associate" in data and type(data.associate) == dictionary {
  data.associate
} else {
  (:)
}

#let meta_dict = if type(data) == dictionary and "meta" in data and type(data.meta) == dictionary {
  data.meta
} else {
  (:)
}

#let raw_doc_num = if type(data) == dictionary and "document_number" in data and data.document_number != none and str(data.document_number).trim() != "" {
  str(data.document_number).trim()
} else {
  let raw_assoc_id = assoc_dict.at("id", default: none)
  let raw_ref_period = meta_dict.at("reference_period", default: none)
  if raw_assoc_id != none and str(raw_assoc_id).trim() != "" {
    "EXT-" + str(raw_assoc_id).trim() + (if raw_ref_period != none and str(raw_ref_period).trim() != "" { "/" + str(raw_ref_period).trim() } else { "" })
  } else {
    none
  }
}

#let doc_number = if raw_doc_num != none and str(raw_doc_num).trim() != "" {
  str(raw_doc_num).trim()
} else {
  none
}

#let raw_auth_code = if type(data) == dictionary and "auth_code" in data and data.auth_code != none and str(data.auth_code).trim() != "" {
  str(data.auth_code).trim()
} else {
  let raw_audit_hash = meta_dict.at("audit_hash", default: none)
  if raw_audit_hash != none and str(raw_audit_hash).trim() != "" {
    str(raw_audit_hash).trim()
  } else {
    none
  }
}

#let auth_code = if raw_auth_code != none and str(raw_auth_code).trim() != "" {
  str(raw_auth_code).trim()
} else {
  none
}

#set document(
  title: "Relatorio_Extrato_Associado_" + str(doc_number),
  author: asppibra_sigla,
)

#set page(
  paper: standard_paper,
  margin: margins_institutional_financial,
  header: context {
    let i = counter(page).get().first()
    if i > 1 {
      asppibra_header_running(
        doc_number: doc_number,
        doc_title: "Demonstrativo Financeiro • Livro-Razão do Cidadão",
      )
    }
  },
  footer: asppibra_footer(
    doc_number: doc_number,
    auth_code: auth_code,
  ),
)

#set text(
  font: font_family_base,
  size: font_size_body,
  fill: color_primary_text,
  lang: "pt",
  region: "BR",
)

// 1. CABEÇALHO INSTITUCIONAL DA PRIMEIRA PÁGINA
#asppibra_header_first_page(doc_number: doc_number)

#v(6pt)

// 2. TÍTULO E METADADOS DE COMPETÊNCIA
#grid(
  columns: (1.3fr, 1fr),
  align: (left + bottom, right + bottom),
  [
    #text(size: font_size_heading, weight: "bold", fill: color_primary)[LIVRO-RAZÃO DO CIDADÃO] \
    #v(2pt)
    #text(size: font_size_subtitle, fill: color_secondary_text)[Relatório Financeiro Consolidado • #asppibra_razao_social_curta]
  ],
  [
    #text(size: font_size_body, weight: "bold", fill: color_primary)[Competência: #data.meta.reference_period] \
    #v(2pt)
    #text(size: font_size_running, fill: color_secondary_text)[Gerado em: #data.meta.generated_at • Cód. Rastreio: #auth_code]
  ]
)

#v(8pt)
#line(length: 100%, stroke: 0.8pt + color_border)
#v(6pt)

// 3. DADOS DO ASSOCIADO / TITULAR
#rect(
  width: 100%,
  radius: 4pt,
  stroke: 1pt + color_border,
  fill: color_bg_box,
  inset: 10pt,
)[
  #grid(
    columns: (44pt, 1.2fr, 1.5fr),
    gutter: 12pt,
    align: (center + horizon, left + horizon, left + horizon),
    // Avatar
    circle(
      radius: 20pt,
      fill: color_gold_light,
      stroke: 2pt + color_gold,
      align(center + horizon)[#text(size: 16pt, weight: "bold", fill: color_primary)[#data.associate.avatar_letter]]
    ),
    // Coluna Identificação
    [
      #text(size: 10pt, weight: "bold", fill: color_primary)[#data.associate.name] \
      #v(2pt)
      #text(size: font_size_caption, fill: color_secondary_text)[CONTA ASSOCIADA] \
      #text(size: 8pt, weight: "bold", fill: color_primary)[\##data.associate.id ]
      #text(size: 8pt, weight: "bold", fill: color_status_paid)[(Ativo)] \
      #v(2pt)
      #text(size: font_size_caption, fill: color_secondary_text)[CPF / CNPJ] \
      #text(size: 8pt, weight: "bold", fill: color_primary_text)[#data.associate.cpf]
    ],
    // Coluna Contato & Endereço
    [
      #text(size: font_size_caption, fill: color_secondary_text)[CONTATO PRINCIPAL] \
      #text(size: 8pt, weight: "bold", fill: color_primary_text)[#data.associate.email] \
      #v(2pt)
      #text(size: font_size_caption, fill: color_secondary_text)[ENDEREÇO CADASTRADO] \
      #text(size: 8pt, weight: "bold", fill: color_primary_text)[#data.associate.address_line1] \
      #text(size: font_size_subtitle, fill: color_secondary_text)[#data.associate.address_line2]
    ]
  )
]

#v(8pt)

// 4. RESUMO EXECUTIVO (3 CARDS)
#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 8pt,
  // Card Valor Total
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + color_primary, rest: 1pt + color_border),
    inset: 8pt,
    fill: color_bg_white,
    [
      #text(size: font_size_caption, weight: "bold", fill: color_secondary_text)[VALOR TOTAL CONTRATADO] \
      #v(3pt)
      #text(size: font_size_heading, weight: "bold", fill: color_primary)[R\$ #data.summary.total_contracted]
    ]
  ),
  // Card Total Pago
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + color_emerald, rest: 1pt + color_border),
    inset: 8pt,
    fill: color_bg_white,
    [
      #text(size: font_size_caption, weight: "bold", fill: color_secondary_text)[TOTAL LIQUIDADO] \
      #v(3pt)
      #text(size: font_size_heading, weight: "bold", fill: color_status_paid)[R\$ #data.summary.total_paid]
    ]
  ),
  // Card Saldo Devedor
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + color_status_overdue, rest: 1pt + color_status_overdue),
    inset: 8pt,
    fill: color_status_overdue_bg,
    [
      #text(size: font_size_caption, weight: "bold", fill: color_status_overdue)[SALDO REMANESCENTE] \
      #v(3pt)
      #text(size: font_size_heading, weight: "bold", fill: color_status_overdue)[R\$ #data.summary.outstanding_balance]
    ]
  ),
)

#v(6pt)

// 5. TABELA DE TRANSAÇÕES FINANCEIRAS
#section_heading("HISTÓRICO DE MOVIMENTAÇÕES FINANCEIRAS")

#table(
  columns: (54pt, 1.8fr, 1.3fr, 1.3fr, 64pt, 54pt),
  stroke: (x, y) => if y == 0 { (bottom: 1.5pt + color_gold) } else { (bottom: 0.8pt + color_border) },
  fill: (col, row) => if row == 0 { color_primary } else if calc.even(row) { color_bg_box } else { color_bg_white },
  align: (col, row) => (
    if col == 4 { right + horizon }
    else if col == 5 { center + horizon }
    else { left + horizon }
  ),
  inset: (x: 5pt, y: 5.5pt),

  table.header(
    text(size: font_size_running, weight: "bold", fill: color_bg_white)[Data],
    text(size: font_size_running, weight: "bold", fill: color_bg_white)[Contraparte],
    text(size: font_size_running, weight: "bold", fill: color_bg_white)[Origem],
    text(size: font_size_running, weight: "bold", fill: color_bg_white)[Destino],
    text(size: font_size_running, weight: "bold", fill: color_bg_white)[Valor (\$)],
    text(size: font_size_running, weight: "bold", fill: color_bg_white)[Status],
  ),

  ..data.transactions.map(tx => (
    text(size: font_size_running, fill: color_primary_text)[#tx.date],
    text(size: font_size_subtitle, weight: "bold", fill: color_primary)[#tx.counterparty],
    text(size: font_size_running, fill: color_primary_text)[#tx.origin],
    text(size: font_size_running, fill: color_primary_text)[#tx.destination],
    text(
      size: font_size_subtitle,
      weight: "bold",
      fill: if tx.direction == "outbound" { color_status_overdue } else { color_status_paid }
    )[#tx.amount],
    text(
      size: font_size_caption,
      weight: "bold",
      fill: if tx.status_variant == "confirmed" { color_status_paid }
            else if tx.status_variant == "danger" { color_status_overdue }
            else { color_secondary_text }
    )[#tx.status_label],
  )).flatten()
)

#v(10pt)

// 6. AVISO DE RASTREABILIDADE E CONTROLE INTERNO
#rect(
  width: 100%,
  radius: 3pt,
  stroke: 1pt + color_border,
  fill: color_bg_box,
  inset: 8pt,
)[
  #text(size: font_size_caption, fill: color_secondary_text)[
    #text(weight: "bold", fill: color_primary)[CONTROLE DOCUMENTAL INTERNO (#asppibra_sigla • CNPJ: #asppibra_cnpj): ]
    Este documento foi gerado pelo sistema DevOS Desktop da #asppibra_razao_social_curta e reflete os registros administrativos e financeiros processados durante o período de referência (#data.meta.reference_period). As informações apresentadas constituem demonstrativo interno informativo das operações vinculadas ao cadastro do associado.
  ]
]
