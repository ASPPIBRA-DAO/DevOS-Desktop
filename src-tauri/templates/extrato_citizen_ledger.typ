// ASPPIBRA DAO - Template Oficial do Livro-Razão do Cidadão (Typst)
#let data = json(bytes(sys.inputs.data))

#set document(
  title: "Relatorio_Extrato_Associado_" + str(data.associate.id),
  author: "ASPPIBRA DAO",
)

#set page(
  paper: "a4",
  margin: (top: 2.2cm, bottom: 2.2cm, left: 1.8cm, right: 1.8cm),
  footer: context {
    let i = counter(page).get().first()
    let n = counter(page).final().first()
    
    block(width: 100%, stroke: (top: 1.5pt + rgb("#10B981")), inset: (top: 6pt))[
      #grid(
        columns: (1fr, 1.5fr, 1fr, 1.5fr),
        align: (left, center, center, right),
        text(size: 6.5pt, fill: rgb("#718096"))[Gerado em: #data.meta.generated_at],
        text(size: 6.5pt, fill: rgb("#718096"))[Confidencial • Hash D1: #data.meta.audit_hash],
        text(size: 7pt, weight: "bold", fill: rgb("#10B981"))[Página #i de #n],
        text(size: 6.5pt, fill: rgb("#718096"))[Documento Oficial ASPPIBRA DAO],
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

// 1. CABEÇALHO INSTITUCIONAL
#grid(
  columns: (1fr, 1fr),
  align: (left + bottom, right + bottom),
  [
    #box[
      #text(size: 16pt, weight: "bold", fill: rgb("#1A202C"))[ASPPIBRA ]
      #text(size: 16pt, weight: "bold", fill: rgb("#10B981"))[DAO]
    ] \
    #v(2pt)
    #text(size: 7.5pt, fill: rgb("#718096"))[Relatório Financeiro Consolidado • Livro-Razão do Cidadão]
  ],
  [
    #text(size: 8.5pt, weight: "bold", fill: rgb("#1A202C"))[Ref: #data.meta.reference_period] \
    #v(2pt)
    #text(size: 7pt, fill: rgb("#718096"))[Documento Oficial DevOS Cockpit]
  ]
)

#v(8pt)
#line(length: 100%, stroke: 0.8pt + rgb("#E2E8F0"))
#v(6pt)

// 2. DADOS DO ASSOCIADO / TITULAR
#rect(
  width: 100%,
  radius: 4pt,
  stroke: 1pt + rgb("#E2E8F0"),
  inset: 10pt,
)[
  #grid(
    columns: (44pt, 1.2fr, 1.5fr),
    gutter: 12pt,
    align: (center + horizon, left + horizon, left + horizon),
    // Avatar
    circle(
      radius: 20pt,
      fill: rgb("#E6F8F3"),
      stroke: 2pt + rgb("#10B981"),
      align(center + horizon)[#text(size: 16pt, weight: "bold", fill: rgb("#1A202C"))[#data.associate.avatar_letter]]
    ),
    // Coluna Identificação
    [
      #text(size: 10pt, weight: "bold", fill: rgb("#1A202C"))[#data.associate.name] \
      #v(2pt)
      #text(size: 6.5pt, fill: rgb("#718096"))[CONTA ASSOCIADA] \
      #text(size: 8pt, weight: "bold", fill: rgb("#1A202C"))[\##data.associate.id ]
      #text(size: 8pt, weight: "bold", fill: rgb("#10B981"))[(Ativo)] \
      #v(2pt)
      #text(size: 6.5pt, fill: rgb("#718096"))[CPF / CNPJ] \
      #text(size: 8pt, weight: "bold", fill: rgb("#2D3748"))[#data.associate.cpf]
    ],
    // Coluna Contato & Endereço
    [
      #text(size: 6.5pt, fill: rgb("#718096"))[CONTATO PRINCIPAL] \
      #text(size: 8pt, weight: "bold", fill: rgb("#2D3748"))[#data.associate.email] \
      #v(2pt)
      #text(size: 6.5pt, fill: rgb("#718096"))[ENDEREÇO CADASTRADO] \
      #text(size: 8pt, weight: "bold", fill: rgb("#2D3748"))[#data.associate.address_line1] \
      #text(size: 7.5pt, fill: rgb("#718096"))[#data.associate.address_line2]
    ]
  )
]

#v(8pt)

// 3. RESUMO EXECUTIVO (3 CARDS)
#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 8pt,
  // Card Valor Total
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + rgb("#1A202C"), rest: 1pt + rgb("#E2E8F0")),
    inset: 8pt,
    fill: rgb("#FFFFFF"),
    [
      #text(size: 6.5pt, weight: "bold", fill: rgb("#718096"))[VALOR TOTAL] \
      #v(3pt)
      #text(size: 11pt, weight: "bold", fill: rgb("#1A202C"))[R\$ #data.summary.total_contracted]
    ]
  ),
  // Card Total Pago
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + rgb("#10B981"), rest: 1pt + rgb("#E2E8F0")),
    inset: 8pt,
    fill: rgb("#FFFFFF"),
    [
      #text(size: 6.5pt, weight: "bold", fill: rgb("#718096"))[TOTAL PAGO] \
      #v(3pt)
      #text(size: 11pt, weight: "bold", fill: rgb("#10B981"))[R\$ #data.summary.total_paid]
    ]
  ),
  // Card Saldo Devedor
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + rgb("#E53E3E"), rest: 1pt + rgb("#E53E3E")),
    inset: 8pt,
    fill: rgb("#FFF5F5"),
    [
      #text(size: 6.5pt, weight: "bold", fill: rgb("#E53E3E"))[SALDO DEVEDOR] \
      #v(3pt)
      #text(size: 11pt, weight: "bold", fill: rgb("#E53E3E"))[R\$ #data.summary.outstanding_balance]
    ]
  ),
)

#v(10pt)

// 4. TABELA DE TRANSAÇÕES FINANCEIRAS
#table(
  columns: (54pt, 1.8fr, 1.3fr, 1.3fr, 64pt, 54pt),
  stroke: (x, y) => if y == 0 { none } else { (bottom: 0.8pt + rgb("#E2E8F0")) },
  fill: (col, row) => if row == 0 { rgb("#1A202C") } else if calc.even(row) { rgb("#F8FAFC") } else { rgb("#FFFFFF") },
  align: (col, row) => (
    if col == 4 { right + horizon }
    else if col == 5 { center + horizon }
    else { left + horizon }
  ),
  inset: (x: 5pt, y: 5.5pt),

  // Cabeçalho repetido em todas as páginas
  table.header(
    text(size: 7pt, weight: "bold", fill: rgb("#FFFFFF"))[Data],
    text(size: 7pt, weight: "bold", fill: rgb("#FFFFFF"))[Contraparte],
    text(size: 7pt, weight: "bold", fill: rgb("#FFFFFF"))[Origem],
    text(size: 7pt, weight: "bold", fill: rgb("#FFFFFF"))[Destino],
    text(size: 7pt, weight: "bold", fill: rgb("#FFFFFF"))[Valor (\$)],
    text(size: 7pt, weight: "bold", fill: rgb("#FFFFFF"))[Status],
  ),

  // Linhas de dados
  ..data.transactions.map(tx => (
    text(size: 7pt, fill: rgb("#2D3748"))[#tx.date],
    text(size: 7.5pt, weight: "bold", fill: rgb("#1A202C"))[#tx.counterparty],
    text(size: 7pt, fill: rgb("#2D3748"))[#tx.origin],
    text(size: 7pt, fill: rgb("#2D3748"))[#tx.destination],
    text(
      size: 7.5pt,
      weight: "bold",
      fill: if tx.direction == "outbound" { rgb("#E53E3E") } else { rgb("#10B981") }
    )[#tx.amount],
    text(
      size: 6.5pt,
      weight: "bold",
      fill: if tx.status_variant == "confirmed" { rgb("#10B981") }
            else if tx.status_variant == "danger" { rgb("#E53E3E") }
            else { rgb("#718096") }
    )[#tx.status_label],
  )).flatten()
)

#v(10pt)

// 5. AVISO LEGAL
#rect(
  width: 100%,
  radius: 3pt,
  stroke: 1pt + rgb("#E2E8F0"),
  fill: rgb("#F8FAFC"),
  inset: 8pt,
)[
  #text(size: 6.5pt, fill: rgb("#718096"))[
    #text(weight: "bold", fill: rgb("#2D3748"))[AVISO LEGAL: ]
    Este documento foi gerado eletronicamente pelos sistemas da ASPPIBRA DAO no DevOS Cockpit e reflete os registros processados durante o período de referência. As informações apresentadas constituem demonstrativo informativo das operações vinculadas à execução contratual e poderão ser utilizadas como elemento de prova eletrônica, nos termos da Medida Provisória nº 2.200-2/2001, da Lei nº 14.063/2020 e da legislação aplicável. O conteúdo é confidencial e destinado exclusivamente ao titular da conta e às partes autorizadas.
  ]
]
