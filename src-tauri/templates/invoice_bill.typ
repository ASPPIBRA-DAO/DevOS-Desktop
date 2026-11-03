// ============================================================================
// ASPPIBRA DAO - Template Oficial de Recibo e Fatura Associativa (Typst)
// Consome a Biblioteca Institucional Modular (asppibra_layout.typ)
// ============================================================================

#import "asppibra_layout.typ": *

#let data = json(bytes(sys.inputs.data))

#let raw_id = if type(data) == dictionary and "invoice" in data and type(data.invoice) == dictionary {
  data.invoice.at("id", default: none)
} else {
  none
}

#let doc_number = if raw_id != none and str(raw_id).trim() != "" {
  str(raw_id).trim()
} else {
  none
}

#let raw_protocol = if type(data) == dictionary and "invoice" in data and type(data.invoice) == dictionary {
  data.invoice.at("d1_protocol", default: none)
} else {
  none
}

#let ref_month = if type(data) == dictionary and "invoice" in data and type(data.invoice) == dictionary {
  data.invoice.at("reference_month", default: "")
} else {
  ""
}

#let auth_code = if raw_protocol != none and str(raw_protocol).trim() != "" {
  str(raw_protocol).trim()
} else if doc_number != none {
  "FAT-" + doc_number + (if ref_month != none and str(ref_month).trim() != "" { "-" + str(ref_month).trim() } else { "" })
} else {
  none
}

#let subtotal_amount = calc.round(data.invoice.amount, digits: 2)
#let taxes_amount = if "taxes" in data.invoice and data.invoice.taxes != none {
  calc.round(data.invoice.taxes, digits: 2)
} else {
  0.0
}
#let discount_amount = if "discount" in data.invoice and data.invoice.discount != none {
  calc.round(data.invoice.discount, digits: 2)
} else {
  0.0
}
#let final_total = calc.round(subtotal_amount + taxes_amount - discount_amount, digits: 2)

#set document(
  title: "Fatura_" + str(doc_number),
  author: asppibra_sigla,
  description: "Subtotal: R$ " + str(subtotal_amount) + " | Tributos: R$ " + str(taxes_amount) + " | Desconto: R$ " + str(discount_amount) + " | Total: R$ " + str(final_total),
)

#set page(
  paper: standard_paper,
  margin: margins_institutional_financial,
  header: context {
    let i = counter(page).get().first()
    if i > 1 {
      asppibra_header_running(
        doc_number: doc_number,
        doc_title: "Fatura e Recibo Associativo",
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

// 2. TÍTULO FUNCIONAL E STATUS DA FATURA
#grid(
  columns: (1.2fr, 1fr),
  align: (left + horizon, right + horizon),
  [
    #text(size: font_size_heading, weight: "bold", fill: color_primary)[FATURA E RECIBO ASSOCIATIVO] \
    #v(2pt)
    #text(size: font_size_subtitle, fill: color_secondary_text)[#asppibra_razao_social_curta • CNPJ: #asppibra_cnpj] \
    #text(size: font_size_running, fill: color_muted_text)[Tesouraria Central e Controle de Faturamento Associativo]
  ],
  [
    #box(
      radius: 3pt,
      inset: (x: 8pt, y: 4pt),
      fill: if data.invoice.status == "paid" { color_status_paid_bg } else if data.invoice.status == "overdue" { color_status_overdue_bg } else { color_status_pending_bg },
      stroke: 1pt + if data.invoice.status == "paid" { color_status_paid } else if data.invoice.status == "overdue" { color_status_overdue } else { color_status_pending },
    )[
      #text(
        size: font_size_body,
        weight: "bold",
        fill: if data.invoice.status == "paid" { color_status_paid } else if data.invoice.status == "overdue" { color_status_overdue } else { color_status_pending }
      )[
        #{
          if data.invoice.status == "paid" [LIQUIDADA / PAGA]
          else if data.invoice.status == "overdue" [EM ATRASO / VENCIDA]
          else if data.invoice.status == "draft" [RASCUNHO / NÃO EMITIDA]
          else [PENDENTE DE LIQUIDAÇÃO]
        }
      ]
    ] \
    #v(4pt)
    #text(size: 10pt, weight: "bold", fill: color_primary)[Fatura Nº #doc_number] \
    #text(size: font_size_subtitle, fill: color_secondary_text)[Competência: #data.invoice.reference_month]
  ]
)

#v(8pt)
#line(length: 100%, stroke: 0.8pt + color_border)
#v(8pt)

// 3. DADOS DO PAGADOR E DETALHES DA COBRANÇA
#grid(
  columns: (1fr, 1fr),
  gutter: 12pt,
  rect(
    width: 100%,
    radius: 4pt,
    stroke: 1pt + color_border,
    fill: color_bg_box,
    inset: 10pt,
    [
      #text(size: font_size_running, weight: "bold", fill: color_secondary_text)[FATURADO PARA (MEMBRO ASSOCIADO)] \
      #v(3pt)
      #text(size: 10pt, weight: "bold", fill: color_primary)[#data.invoice.member_name] \
      #v(2pt)
      #text(size: font_size_subtitle, fill: color_primary_text)[Documento: #data.invoice.member_doc] \
      #if "member_email" in data.invoice and data.invoice.member_email != none [
        #text(size: font_size_subtitle, fill: color_primary_text)[E-mail: #data.invoice.member_email] \
      ]
      #if "member_address" in data.invoice and data.invoice.member_address != none [
        #text(size: font_size_subtitle, fill: color_primary_text)[Endereço: #data.invoice.member_address]
      ]
    ]
  ),
  rect(
    width: 100%,
    radius: 4pt,
    stroke: 1pt + color_border,
    fill: color_bg_box,
    inset: 10pt,
    [
      #text(size: font_size_running, weight: "bold", fill: color_secondary_text)[DETALHES DA COBRANÇA] \
      #v(3pt)
      #grid(
        columns: (1fr, 1.2fr),
        row-gutter: 3.5pt,
        text(size: font_size_subtitle, fill: color_secondary_text)[Vencimento:],
        text(size: font_size_subtitle, weight: "bold", fill: color_primary)[#data.invoice.due_date],
        text(size: font_size_subtitle, fill: color_secondary_text)[Liquidação:],
        text(size: font_size_subtitle, weight: "bold", fill: if "settled_date" in data.invoice and data.invoice.settled_date != none { color_status_paid } else { color_secondary_text })[
          #if "settled_date" in data.invoice and data.invoice.settled_date != none [
            #data.invoice.settled_date
          ] else [
            Pendente
          ]
        ],
        text(size: font_size_subtitle, fill: color_secondary_text)[Método:],
        text(size: font_size_subtitle, weight: "bold", fill: color_primary)[#data.invoice.payment_method],
        text(size: font_size_subtitle, fill: color_secondary_text)[Protocolo Interno:],
        text(size: font_size_caption, font: font_family_mono, fill: color_primary_text)[#auth_code],
      )
    ]
  )
)

#v(6pt)

// 4. TABELA DE ITENS DA FATURA
#section_heading("ITENS E SERVIÇOS DISCRIMINADOS")

#table(
  columns: (30pt, 1fr, 45pt, 75pt, 75pt),
  stroke: (x, y) => if y == 0 { (bottom: 1.5pt + color_gold) } else { (bottom: 0.5pt + color_border) },
  fill: (x, y) => if y == 0 { color_primary } else if calc.even(y) { color_bg_box } else { color_bg_white },
  align: (center + horizon, left + horizon, center + horizon, right + horizon, right + horizon),
  inset: (x: 6pt, y: 6pt),

  table.header(
    text(size: font_size_running, weight: "bold", fill: color_bg_white)[\#],
    text(size: font_size_running, weight: "bold", fill: color_bg_white)[DESCRIÇÃO / SERVIÇO],
    text(size: font_size_running, weight: "bold", fill: color_bg_white)[QTD],
    text(size: font_size_running, weight: "bold", fill: color_bg_white)[VALOR UNIT.],
    text(size: font_size_running, weight: "bold", fill: color_bg_white)[TOTAL],
  ),

  ..for (idx, item) in data.invoice.items.enumerate() {
    (
      text(size: font_size_subtitle, fill: color_secondary_text)[#(idx + 1)],
      [
        #text(size: 8pt, weight: "bold", fill: color_primary)[#item.description] \
        #if "service" in item and item.service != none [
          #text(size: font_size_caption, fill: color_muted_text)[#item.service]
        ]
      ],
      text(size: font_size_subtitle, fill: color_primary_text)[#item.quantity],
      text(size: font_size_subtitle, fill: color_primary_text)[R\$ #calc.round(item.price, digits: 2)],
      text(size: 8pt, weight: "bold", fill: color_primary)[R\$ #calc.round(item.total, digits: 2)],
    )
  }
)

#v(10pt)

// 5. TOTAIS E SUMÁRIO FINANCEIRO
#align(right)[
  #block(width: 48%)[
    #rect(
      width: 100%,
      radius: 4pt,
      stroke: 1pt + color_border,
      fill: color_bg_box,
      inset: 10pt,
    )[
      #grid(
        columns: (1fr, 1fr),
        row-gutter: 5pt,
        align: (left + horizon, right + horizon),
        text(size: font_size_subtitle, fill: color_secondary_text)[Subtotal:],
        text(size: 8pt, weight: "bold", fill: color_primary_text)[R\$ #subtotal_amount],

        ..(if taxes_amount > 0 {
          (
            text(size: font_size_subtitle, fill: color_secondary_text)[Tributos / Taxas:],
            text(size: 8pt, fill: color_primary_text)[R\$ #taxes_amount],
          )
        } else { () }),
        ..(if discount_amount > 0 {
          (
            text(size: font_size_subtitle, fill: color_secondary_text)[Desconto:],
            text(size: 8pt, fill: color_status_paid)[- R\$ #discount_amount],
          )
        } else { () }),

        grid.hline(stroke: 1pt + color_gold),
        text(size: font_size_section, weight: "bold", fill: color_primary)[VALOR TOTAL:],
        text(size: font_size_heading, weight: "bold", fill: if data.invoice.status == "paid" { color_status_paid } else { color_primary })[
          R\$ #final_total
        ],
      )
    ]
  ]
]

#v(12pt)

// 6. QUADRO DE RASTREABILIDADE E CONTROLE INTERNO
#rect(
  width: 100%,
  radius: 4pt,
  fill: color_bg_box,
  stroke: (paint: color_border, dash: "dashed", thickness: 0.8pt),
  inset: 8pt,
  [
    #text(size: font_size_running, weight: "bold", fill: color_primary)[RASTREABILIDADE E CONTROLE DOCUMENTAL INTERNO (DEVOS)] \
    #v(2pt)
    #text(size: font_size_caption, font: font_family_mono, fill: color_secondary_text)[
      IDENTIFICADOR INTERNO: FATURA-#doc_number | COMPETÊNCIA: #data.invoice.reference_month | CÓDIGO: #auth_code
    ] \
    #v(2pt)
    #text(size: font_size_caption, fill: color_muted_text)[
      Documento emitido pelo sistema DevOS Desktop para controle administrativo e financeiro interno da #asppibra_razao_social_curta (#asppibra_sigla).
    ]
  ]
)
