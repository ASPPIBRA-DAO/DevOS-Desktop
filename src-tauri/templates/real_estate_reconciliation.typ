// ASPPIBRA DAO — Template Oficial de Reconciliação Imobiliária (Typst)
// Compilação nativa de alta fidelidade para auditoria cadastral e relatórios territoriais.

#let data = json(bytes(sys.inputs.data))

#set document(
  title: "Relatorio_Analitico_Reconciliacao_Imobiliaria",
  author: "ASPPIBRA DAO • Cockpit Real Estate Engine",
)

#set page(
  paper: "a4",
  margin: (top: 2.0cm, bottom: 2.0cm, left: 1.5cm, right: 1.5cm),
  footer: context {
    let i = counter(page).get().first()
    let n = counter(page).final().first()
    
    block(width: 100%, stroke: (top: 1.5pt + rgb("#0284C7")), inset: (top: 6pt))[
      #grid(
        columns: (1.5fr, 2fr, 1fr, 1.5fr),
        align: (left, center, center, right),
        text(size: 6.5pt, fill: rgb("#64748B"))[Gerado em: #data.generatedAt],
        text(size: 6.5pt, fill: rgb("#64748B"))[Confidencial • Base Territorial Oficial de Maricá - RJ],
        text(size: 7pt, weight: "bold", fill: rgb("#0284C7"))[Página #i de #n],
        text(size: 6.5pt, fill: rgb("#64748B"))[Documento Oficial ASPPIBRA DAO],
      )
    ]
  }
)

#set text(
  font: ("Roboto", "Liberation Sans", "Arial"),
  size: 8pt,
  fill: rgb("#1E293B"),
  lang: "pt",
)

// 1. CABEÇALHO INSTITUCIONAL
#grid(
  columns: (1fr, auto),
  align: (left + bottom, right + bottom),
  [
    #box[
      #text(size: 15pt, weight: "bold", fill: rgb("#0F172A"))[ASPPIBRA ]
      #text(size: 15pt, weight: "bold", fill: rgb("#0284C7"))[DAO]
    ] \
    #v(2pt)
    #text(size: 11pt, weight: "bold", fill: rgb("#0F172A"))[Relatório Analítico de Reconciliação Imobiliária] \
    #v(1pt)
    #text(size: 7pt, fill: rgb("#64748B"))[Consolidação de auditoria cadastral e reconciliação de lotes • Gerado em: #data.generatedAt]
  ],
  [
    #rect(
      radius: 3pt,
      inset: (x: 8pt, y: 4pt),
      fill: rgb("#F0F9FF"),
      stroke: 1pt + rgb("#0284C7"),
    )[
      #text(size: 7pt, weight: "bold", fill: rgb("#0369A1"))[COCKPIT REAL ESTATE ENGINE]
    ] \
    #v(3pt)
    #text(size: 7pt, fill: rgb("#64748B"))[Base Territorial Oficial de Maricá - RJ] \
    #text(size: 7pt, weight: "bold", fill: rgb("#334155"))[SQLite WAL • Integridade Garantida]
  ]
)

#v(8pt)
#line(length: 100%, stroke: 0.8pt + rgb("#CBD5E1"))
#v(6pt)

// 2. MÉTRICAS CADASTRAIS CONSOLIDADAS (6 CARDS)
#text(size: 8.5pt, weight: "bold", fill: rgb("#0369A1"))[MÉTRICAS CADASTRAIS CONSOLIDADAS]
#v(4pt)

#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 6pt,
  // Card 1: Total de Imóveis
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + rgb("#0284C7"), rest: 0.8pt + rgb("#E2E8F0")),
    inset: 7pt,
    fill: rgb("#F8FAFC"),
    [
      #text(size: 6.5pt, weight: "bold", fill: rgb("#64748B"))[TOTAL DE IMÓVEIS] \
      #v(2pt)
      #text(size: 12pt, weight: "bold", fill: rgb("#0F172A"))[#data.stats.totalProperties]
    ]
  ),
  // Card 2: Identificadores
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + rgb("#3B82F6"), rest: 0.8pt + rgb("#E2E8F0")),
    inset: 7pt,
    fill: rgb("#F8FAFC"),
    [
      #text(size: 6.5pt, weight: "bold", fill: rgb("#64748B"))[IDENTIFICADORES] \
      #v(2pt)
      #text(size: 12pt, weight: "bold", fill: rgb("#0F172A"))[#data.stats.totalIdentifiers]
    ]
  ),
  // Card 3: Endereços Vinculados
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + rgb("#6366F1"), rest: 0.8pt + rgb("#E2E8F0")),
    inset: 7pt,
    fill: rgb("#F8FAFC"),
    [
      #text(size: 6.5pt, weight: "bold", fill: rgb("#64748B"))[ENDEREÇOS VINCULADOS] \
      #v(2pt)
      #text(size: 12pt, weight: "bold", fill: rgb("#0F172A"))[#data.stats.totalAddresses]
    ]
  ),
  // Card 4: Lotes Processados
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + rgb("#8B5CF6"), rest: 0.8pt + rgb("#E2E8F0")),
    inset: 7pt,
    fill: rgb("#F8FAFC"),
    [
      #text(size: 6.5pt, weight: "bold", fill: rgb("#64748B"))[LOTES PROCESSADOS] \
      #v(2pt)
      #text(size: 12pt, weight: "bold", fill: rgb("#0F172A"))[#data.stats.totalBatches]
    ]
  ),
  // Card 5: Inconsistências Abertas
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (
      left: 3pt + if data.stats.openFindingsCount > 0 { rgb("#EF4444") } else { rgb("#10B981") },
      rest: 0.8pt + rgb("#E2E8F0")
    ),
    inset: 7pt,
    fill: rgb("#F8FAFC"),
    [
      #text(size: 6.5pt, weight: "bold", fill: rgb("#64748B"))[INCONSISTÊNCIAS ABERTAS] \
      #v(2pt)
      #text(
        size: 12pt,
        weight: "bold",
        fill: if data.stats.openFindingsCount > 0 { rgb("#DC2626") } else { rgb("#16A34A") }
      )[#data.stats.openFindingsCount]
    ]
  ),
  // Card 6: Propostas Pendentes
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + rgb("#F59E0B"), rest: 0.8pt + rgb("#E2E8F0")),
    inset: 7pt,
    fill: rgb("#F8FAFC"),
    [
      #text(size: 6.5pt, weight: "bold", fill: rgb("#64748B"))[PROPOSTAS PENDENTES] \
      #v(2pt)
      #text(size: 12pt, weight: "bold", fill: rgb("#0F172A"))[#data.stats.pendingProposalsCount]
    ]
  )
)

#v(8pt)

// 3. HISTÓRICO RECENTE DE LOTES DE IMPORTAÇÃO
#text(size: 8.5pt, weight: "bold", fill: rgb("#0369A1"))[HISTÓRICO RECENTE DE LOTES DE IMPORTAÇÃO]
#v(4pt)

#if data.batches.len() == 0 [
  #rect(
    width: 100%,
    radius: 3pt,
    stroke: 0.8pt + rgb("#E2E8F0"),
    inset: 8pt,
    fill: rgb("#F8FAFC"),
    align(center)[#text(size: 7.5pt, fill: rgb("#64748B"))[Nenhum lote processado registrado no banco local.]]
  )
] else [
  #table(
    columns: (40pt, 1fr, 80pt, 75pt),
    stroke: (x, y) => if y == 0 { (bottom: 1.5pt + rgb("#0284C7")) } else { (bottom: 0.5pt + rgb("#E2E8F0")) },
    fill: (x, y) => if y == 0 { rgb("#F1F5F9") } else if calc.even(y) { rgb("#F8FAFC") } else { rgb("#FFFFFF") },
    align: (center + horizon, left + horizon, center + horizon, right + horizon),
    inset: (x: 6pt, y: 5pt),
    table.header(
      text(size: 6.5pt, weight: "bold", fill: rgb("#475569"))[ID],
      text(size: 6.5pt, weight: "bold", fill: rgb("#475569"))[ARQUIVO DE ORIGEM],
      text(size: 6.5pt, weight: "bold", fill: rgb("#475569"))[STATUS],
      text(size: 6.5pt, weight: "bold", fill: rgb("#475569"))[IMPORTADOS],
    ),
    ..for batch in data.batches {
      (
        text(size: 7pt, weight: "bold", fill: rgb("#0F172A"))[\##batch.id],
        text(size: 7pt, fill: rgb("#334155"))[#batch.filename],
        text(size: 7pt, fill: rgb("#475569"))[#batch.status],
        text(size: 7pt, weight: "bold", fill: rgb("#0284C7"))[#batch.importedRecords],
      )
    }
  )
]

#v(8pt)

// 4. APONTAMENTOS CRÍTICOS DE AUDITORIA
#text(size: 8.5pt, weight: "bold", fill: rgb("#0369A1"))[APONTAMENTOS CRÍTICOS DE AUDITORIA]
#v(4pt)

#if data.findings.len() == 0 [
  #rect(
    width: 100%,
    radius: 3pt,
    stroke: 0.8pt + rgb("#E2E8F0"),
    inset: 8pt,
    fill: rgb("#F8FAFC"),
    align(center)[#text(size: 7.5pt, fill: rgb("#64748B"))[Nenhuma inconsistência em aberto no momento.]]
  )
] else [
  #table(
    columns: (40pt, 90pt, 1fr, 70pt),
    stroke: (x, y) => if y == 0 { (bottom: 1.5pt + rgb("#0284C7")) } else { (bottom: 0.5pt + rgb("#E2E8F0")) },
    fill: (x, y) => if y == 0 { rgb("#F1F5F9") } else if calc.even(y) { rgb("#F8FAFC") } else { rgb("#FFFFFF") },
    align: (center + horizon, left + horizon, left + horizon, center + horizon),
    inset: (x: 6pt, y: 5pt),
    table.header(
      text(size: 6.5pt, weight: "bold", fill: rgb("#475569"))[ID],
      text(size: 6.5pt, weight: "bold", fill: rgb("#475569"))[CATEGORIA],
      text(size: 6.5pt, weight: "bold", fill: rgb("#475569"))[DESCRIÇÃO],
      text(size: 6.5pt, weight: "bold", fill: rgb("#475569"))[SEVERIDADE],
    ),
    ..for finding in data.findings {
      (
        text(size: 7pt, weight: "bold", fill: rgb("#0F172A"))[\##finding.id],
        text(size: 7pt, fill: rgb("#334155"))[#finding.category],
        text(size: 7pt, fill: rgb("#475569"))[#finding.description],
        rect(
          radius: 2pt,
          inset: (x: 4pt, y: 2pt),
          fill: if finding.severity == "high" or finding.severity == "critical" { rgb("#FEE2E2") } else { rgb("#FEF3C7") },
          stroke: 0.5pt + if finding.severity == "high" or finding.severity == "critical" { rgb("#EF4444") } else { rgb("#F59E0B") },
          [
            #text(
              size: 6pt,
              weight: "bold",
              fill: if finding.severity == "high" or finding.severity == "critical" { rgb("#B91C1C") } else { rgb("#B45309") }
            )[#upper(finding.severity)]
          ]
        ),
      )
    }
  )
]

#v(8pt)

// 5. PLANILHA CADASTRAL TERRITORIAL
#text(size: 8.5pt, weight: "bold", fill: rgb("#0369A1"))[PLANILHA CADASTRAL TERRITORIAL (#data.properties.len() Imóveis)]
#v(4pt)

#if data.properties.len() == 0 [
  #rect(
    width: 100%,
    radius: 3pt,
    stroke: 0.8pt + rgb("#E2E8F0"),
    inset: 8pt,
    fill: rgb("#F8FAFC"),
    align(center)[#text(size: 7.5pt, fill: rgb("#64748B"))[Nenhum imóvel cadastrado registrado no banco local.]]
  )
] else [
  #table(
    columns: (30pt, 55pt, 1.3fr, 70pt, 1fr, 28pt, 34pt, 28pt, 50pt),
    stroke: (x, y) => if y == 0 { (bottom: 1.5pt + rgb("#0284C7")) } else { (bottom: 0.5pt + rgb("#E2E8F0")) },
    fill: (x, y) => if y == 0 { rgb("#F1F5F9") } else if calc.even(y) { rgb("#F8FAFC") } else { rgb("#FFFFFF") },
    align: (
      center + horizon,
      left + horizon,
      left + horizon,
      left + horizon,
      left + horizon,
      center + horizon,
      center + horizon,
      center + horizon,
      left + horizon
    ),
    inset: (x: 4pt, y: 4pt),
    table.header(
      text(size: 6pt, weight: "bold", fill: rgb("#475569"))[\#ID],
      text(size: 6pt, weight: "bold", fill: rgb("#475569"))[MATRÍCULA],
      text(size: 6pt, weight: "bold", fill: rgb("#475569"))[CONTRIBUINTE],
      text(size: 6pt, weight: "bold", fill: rgb("#475569"))[BAIRRO],
      text(size: 6pt, weight: "bold", fill: rgb("#475569"))[RUA],
      text(size: 6pt, weight: "bold", fill: rgb("#475569"))[Nº],
      text(size: 6pt, weight: "bold", fill: rgb("#475569"))[QUADRA],
      text(size: 6pt, weight: "bold", fill: rgb("#475569"))[LOTE],
      text(size: 6pt, weight: "bold", fill: rgb("#475569"))[COMPL.],
    ),
    ..for prop in data.properties {
      (
        text(size: 6pt, weight: "bold", fill: rgb("#0F172A"))[\##prop.id],
        text(size: 6pt, fill: rgb("#475569"))[#prop.matricula],
        text(size: 6pt, weight: "bold", fill: rgb("#1E293B"))[#prop.contribuinte],
        text(size: 6pt, fill: rgb("#475569"))[#prop.bairro],
        text(size: 6pt, fill: rgb("#475569"))[#prop.rua],
        text(size: 6pt, fill: rgb("#475569"))[#prop.numero],
        text(size: 6pt, fill: rgb("#475569"))[#prop.quadra],
        text(size: 6pt, fill: rgb("#475569"))[#prop.lote],
        text(size: 6pt, fill: rgb("#475569"))[#prop.complemento],
      )
    }
  )
]

#if data.properties.len() > 0 and data.properties.len() < data.stats.totalProperties [
  #v(6pt)
  #rect(
    width: 100%,
    radius: 3pt,
    stroke: 0.8pt + rgb("#CBD5E1"),
    inset: 6pt,
    fill: rgb("#F8FAFC"),
    align(center)[
      #text(size: 6.5pt, fill: rgb("#64748B"))[
        Documento analítico contendo #data.properties.len() registros impressos da base territorial oficial de Maricá - RJ (total de #data.stats.totalProperties imóveis cadastrados). Para a extração integral sem limite de paginação, utilize a exportação completa em Planilha CSV.
      ]
    ]
  )
]
