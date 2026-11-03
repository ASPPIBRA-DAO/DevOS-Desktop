// ASPPIBRA DAO - Template Oficial de Recibo e Fatura Associativa (Typst)
#let data = json(bytes(sys.inputs.data))
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
  title: "Fatura_" + str(data.invoice.id),
  author: "ASPPIBRA DAO",
  description: "Subtotal: R$ " + str(subtotal_amount) + " | Tributos: R$ " + str(taxes_amount) + " | Desconto: R$ " + str(discount_amount) + " | Total: R$ " + str(final_total),
)

#set page(
  paper: "a4",
  margin: (top: 2.2cm, bottom: 2.2cm, left: 1.8cm, right: 1.8cm),
  footer: context {
    let i = counter(page).get().first()
    let n = counter(page).final().first()
    
    block(width: 100%, stroke: (top: 1.5pt + rgb("#10B981")), inset: (top: 6pt))[
      #grid(
        columns: (1.5fr, 1fr, 1.5fr),
        align: (left, center, right),
        text(size: 6.5pt, fill: rgb("#718096"))[ASPPIBRA DAO • CNPJ: 26.325.396/0001-30],
        text(size: 7pt, weight: "bold", fill: rgb("#10B981"))[Página #i de #n],
        text(size: 6.5pt, fill: rgb("#718096"))[Controle Documental DevOS],
      )
    ]
  }
)

#set text(
  font: ("Roboto", "Liberation Sans", "Arial"),
  size: 8.5pt,
  fill: rgb("#2D3748"),
  lang: "pt",
)

// 1. CABEÇALHO INSTITUCIONAL & STATUS DA FATURA
#grid(
  columns: (1.2fr, 1fr),
  align: (left + top, right + top),
  [
    #box[
      #text(size: 16pt, weight: "bold", fill: rgb("#1A202C"))[ASPPIBRA ]
      #text(size: 16pt, weight: "bold", fill: rgb("#10B981"))[DAO]
    ] \
    #v(2pt)
    #text(size: 7.5pt, fill: rgb("#718096"))[Associação dos Proprietários e Posseiros de Imóveis no Brasil] \
    #text(size: 7pt, fill: rgb("#718096"))[Tesouraria Central e Controle de Faturamento Descentralizado]
  ],
  [
    #box(
      radius: 3pt,
      inset: (x: 8pt, y: 4pt),
      fill: if data.invoice.status == "paid" { rgb("#DCFCE7") } else if data.invoice.status == "overdue" { rgb("#FEE2E2") } else { rgb("#FEF3C7") },
      stroke: 1pt + if data.invoice.status == "paid" { rgb("#16A34A") } else if data.invoice.status == "overdue" { rgb("#DC2626") } else { rgb("#D97706") },
    )[
      #text(
        size: 8.5pt,
        weight: "bold",
        fill: if data.invoice.status == "paid" { rgb("#15803D") } else if data.invoice.status == "overdue" { rgb("#B91C1C") } else { rgb("#B45309") }
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
    #text(size: 11pt, weight: "bold", fill: rgb("#1A202C"))[Fatura: #data.invoice.id] \
    #text(size: 7.5pt, fill: rgb("#718096"))[Ref: #data.invoice.reference_month]
  ]
)

#v(10pt)
#line(length: 100%, stroke: 0.8pt + rgb("#E2E8F0"))
#v(8pt)

// 2. DADOS DO PAGADOR E DA EMISSÃO
#grid(
  columns: (1fr, 1fr),
  gutter: 12pt,
  rect(
    width: 100%,
    radius: 4pt,
    stroke: 1pt + rgb("#E2E8F0"),
    inset: 10pt,
    [
      #text(size: 7pt, weight: "bold", fill: rgb("#718096"))[FATURADO PARA (MEMBRO DA DAO)] \
      #v(2pt)
      #text(size: 10pt, weight: "bold", fill: rgb("#1A202C"))[#data.invoice.member_name] \
      #v(2pt)
      #text(size: 7.5pt, fill: rgb("#4A5568"))[Documento: #data.invoice.member_doc] \
      #if "member_email" in data.invoice and data.invoice.member_email != none [
        #text(size: 7.5pt, fill: rgb("#4A5568"))[E-mail: #data.invoice.member_email] \
      ]
      #if "member_address" in data.invoice and data.invoice.member_address != none [
        #text(size: 7.5pt, fill: rgb("#4A5568"))[Endereço: #data.invoice.member_address]
      ]
    ]
  ),
  rect(
    width: 100%,
    radius: 4pt,
    stroke: 1pt + rgb("#E2E8F0"),
    inset: 10pt,
    [
      #text(size: 7pt, weight: "bold", fill: rgb("#718096"))[DETALHES DA COBRANÇA] \
      #v(2pt)
      #grid(
        columns: (1fr, 1.2fr),
        row-gutter: 3pt,
        text(size: 7.5pt, fill: rgb("#718096"))[Vencimento:],
        text(size: 7.5pt, weight: "bold", fill: rgb("#1A202C"))[#data.invoice.due_date],
        text(size: 7.5pt, fill: rgb("#718096"))[Liquidação:],
        text(size: 7.5pt, weight: "bold", fill: rgb("#10B981"))[
          #if "settled_date" in data.invoice and data.invoice.settled_date != none [
            #data.invoice.settled_date
          ] else [
            Pendente
          ]
        ],
        text(size: 7.5pt, fill: rgb("#718096"))[Método:],
        text(size: 7.5pt, weight: "bold", fill: rgb("#1A202C"))[#data.invoice.payment_method],
        text(size: 7.5pt, fill: rgb("#718096"))[Protocolo Interno:],
        text(size: 6.5pt, fill: rgb("#4A5568"))[
          #if "d1_protocol" in data.invoice and data.invoice.d1_protocol != none [
            #data.invoice.d1_protocol
          ] else [
            FATURA-#data.invoice.id
          ]
        ],
      )
    ]
  )
)

#v(10pt)

// 3. TABELA DE ITENS DA FATURA
#text(size: 9pt, weight: "bold", fill: rgb("#1A202C"))[Itens e Serviços Discriminados]
#v(4pt)

#table(
  columns: (30pt, 1fr, 45pt, 75pt, 75pt),
  stroke: (x, y) => if y == 0 { (bottom: 1.5pt + rgb("#10B981")) } else { (bottom: 0.5pt + rgb("#E2E8F0")) },
  fill: (x, y) => if y == 0 { rgb("#F8FAFC") } else if calc.even(y) { rgb("#FAFAFA") } else { rgb("#FFFFFF") },
  align: (center + horizon, left + horizon, center + horizon, right + horizon, right + horizon),
  inset: (x: 6pt, y: 6pt),
  
  // Cabeçalho
  table.header(
    text(size: 7pt, weight: "bold", fill: rgb("#475569"))[\#],
    text(size: 7pt, weight: "bold", fill: rgb("#475569"))[DESCRIÇÃO / SERVIÇO],
    text(size: 7pt, weight: "bold", fill: rgb("#475569"))[QTD],
    text(size: 7pt, weight: "bold", fill: rgb("#475569"))[VALOR UNIT.],
    text(size: 7pt, weight: "bold", fill: rgb("#475569"))[TOTAL],
  ),
  
  // Linhas
  ..for (idx, item) in data.invoice.items.enumerate() {
    (
      text(size: 7.5pt, fill: rgb("#64748B"))[#(idx + 1)],
      [
        #text(size: 8pt, weight: "bold", fill: rgb("#1E293B"))[#item.description] \
        #if "service" in item and item.service != none [
          #text(size: 6.5pt, fill: rgb("#94A3B8"))[#item.service]
        ]
      ],
      text(size: 7.5pt, fill: rgb("#334155"))[#item.quantity],
      text(size: 7.5pt, fill: rgb("#334155"))[R\$ #calc.round(item.price, digits: 2)],
      text(size: 8pt, weight: "bold", fill: rgb("#0F172A"))[R\$ #calc.round(item.total, digits: 2)],
    )
  }
)

#v(8pt)

// 4. TOTAIS E SUMÁRIO FINANCEIRO
#align(right)[
  #block(width: 45%)[
    #grid(
      columns: (1fr, 1fr),
      row-gutter: 4pt,
      align: (left, right),
      text(size: 7.5pt, fill: rgb("#718096"))[Subtotal:],
      text(size: 8pt, weight: "bold", fill: rgb("#2D3748"))[R\$ #subtotal_amount],
      
      ..(if taxes_amount > 0 {
        (
          text(size: 7.5pt, fill: rgb("#718096"))[Tributos / Taxas:],
          text(size: 8pt, fill: rgb("#2D3748"))[R\$ #taxes_amount],
        )
      } else { () }),
      ..(if discount_amount > 0 {
        (
          text(size: 7.5pt, fill: rgb("#718096"))[Desconto:],
          text(size: 8pt, fill: rgb("#16A34A"))[- R\$ #discount_amount],
        )
      } else { () }),
      
      grid.hline(stroke: 1pt + rgb("#CBD5E1")),
      text(size: 9pt, weight: "bold", fill: rgb("#0F172A"))[VALOR TOTAL:],
      text(size: 11pt, weight: "bold", fill: if data.invoice.status == "paid" { rgb("#15803D") } else { rgb("#0F172A") })[
        R\$ #final_total
      ],
    )
  ]
]

#v(14pt)

// 5. QUADRO DE RASTREABILIDADE E CONTROLE INTERNO
#rect(
  width: 100%,
  radius: 4pt,
  fill: rgb("#F8FAFC"),
  stroke: (paint: rgb("#CBD5E1"), dash: "dashed", thickness: 0.8pt),
  inset: 8pt,
  [
    #text(size: 7pt, weight: "bold", fill: rgb("#334155"))[RASTREABILIDADE E CONTROLE DOCUMENTAL INTERNO (DEVOS)] \
    #v(2pt)
    #text(size: 6.5pt, font: ("Roboto", "Courier"), fill: rgb("#475569"))[
      IDENTIFICADOR INTERNO: FATURA-#data.invoice.id | COMPETÊNCIA: #data.invoice.reference_month
    ] \
    #v(2pt)
    #text(size: 6.5pt, fill: rgb("#64748B"))[
      Documento emitido pelo sistema DevOS Desktop para controle administrativo e financeiro interno da ASPPIBRA DAO.
    ]
  ]
)
