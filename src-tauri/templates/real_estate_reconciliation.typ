// ============================================================================
// ASPPIBRA DAO — Template Oficial de Reconciliação Imobiliária (Typst)
// Consome a Biblioteca Institucional Modular (asppibra_layout.typ)
// ============================================================================

#import "asppibra_layout.typ": *

#let data = json(bytes(sys.inputs.data))

#let raw_doc_num = if type(data) == dictionary {
  if "document_number" in data and data.document_number != none and str(data.document_number).trim() != "" {
    str(data.document_number).trim()
  } else if "report_id" in data and data.report_id != none and str(data.report_id).trim() != "" {
    str(data.report_id).trim()
  } else if "reportId" in data and data.reportId != none and str(data.reportId).trim() != "" {
    str(data.reportId).trim()
  } else if "generatedAt" in data and data.generatedAt != none and str(data.generatedAt).trim() != "" {
    "REC-" + str(data.generatedAt).trim()
  } else {
    none
  }
} else {
  none
}

#let doc_number = if raw_doc_num != none and str(raw_doc_num).trim() != "" {
  str(raw_doc_num).trim()
} else {
  none
}

#let raw_auth_code = if type(data) == dictionary {
  if "auth_code" in data and data.auth_code != none and str(data.auth_code).trim() != "" {
    str(data.auth_code).trim()
  } else if "audit_hash" in data and data.audit_hash != none and str(data.audit_hash).trim() != "" {
    str(data.audit_hash).trim()
  } else if "generatedAt" in data and data.generatedAt != none and str(data.generatedAt).trim() != "" and "stats" in data and type(data.stats) == dictionary and "totalProperties" in data.stats and data.stats.totalProperties != none {
    "CAD-MARICA-" + str(data.stats.totalProperties).trim() + "IMV"
  } else {
    none
  }
} else {
  none
}

#let auth_code = if raw_auth_code != none and str(raw_auth_code).trim() != "" {
  str(raw_auth_code).trim()
} else {
  none
}

#set document(
  title: "Relatorio_Analitico_Reconciliacao_Imobiliaria",
  author: asppibra_sigla,
)

#set page(
  paper: standard_paper,
  margin: margins_institutional_territorial,
  header: context {
    let i = counter(page).get().first()
    if i > 1 {
      asppibra_header_running(
        doc_number: doc_number,
        doc_title: "Relatório Analítico de Reconciliação Imobiliária",
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
  size: 8pt,
  fill: color_primary_text,
  lang: "pt",
  region: "BR",
)

// 1. CABEÇALHO INSTITUCIONAL DA PRIMEIRA PÁGINA
#asppibra_header_first_page(doc_number: doc_number)

#v(6pt)

// 2. TÍTULO E METADADOS DA BASE TERRITORIAL
#grid(
  columns: (1fr, auto),
  align: (left + bottom, right + bottom),
  [
    #text(size: font_size_heading, weight: "bold", fill: color_primary)[RELATÓRIO ANALÍTICO DE RECONCILIAÇÃO IMOBILIÁRIA] \
    #v(2pt)
    #text(size: font_size_running, fill: color_secondary_text)[Consolidação de auditoria cadastral e reconciliação de lotes • Gerado em: #data.generatedAt]
  ],
  [
    #rect(
      radius: 3pt,
      inset: (x: 8pt, y: 4pt),
      fill: color_sky_light,
      stroke: 1pt + color_sky,
    )[
      #text(size: font_size_running, weight: "bold", fill: color_sky_dark)[COCKPIT REAL ESTATE ENGINE]
    ] \
    #v(3pt)
    #text(size: font_size_running, fill: color_secondary_text)[Base Territorial Oficial de Maricá - RJ • #asppibra_sigla]
  ]
)

#v(6pt)
#line(length: 100%, stroke: 0.8pt + color_border)
#v(4pt)

// 3. MÉTRICAS CADASTRAIS CONSOLIDADAS (6 CARDS)
#section_heading("MÉTRICAS CADASTRAIS CONSOLIDADAS")

#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 6pt,
  // Card 1: Total de Imóveis
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + color_sky, rest: 0.8pt + color_border),
    inset: 7pt,
    fill: color_bg_box,
    [
      #text(size: font_size_caption, weight: "bold", fill: color_secondary_text)[TOTAL DE IMÓVEIS] \
      #v(2pt)
      #text(size: 12pt, weight: "bold", fill: color_primary)[#data.stats.totalProperties]
    ]
  ),
  // Card 2: Identificadores
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + color_gold, rest: 0.8pt + color_border),
    inset: 7pt,
    fill: color_bg_box,
    [
      #text(size: font_size_caption, weight: "bold", fill: color_secondary_text)[IDENTIFICADORES] \
      #v(2pt)
      #text(size: 12pt, weight: "bold", fill: color_primary)[#data.stats.totalIdentifiers]
    ]
  ),
  // Card 3: Endereços Vinculados
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + color_sky_dark, rest: 0.8pt + color_border),
    inset: 7pt,
    fill: color_bg_box,
    [
      #text(size: font_size_caption, weight: "bold", fill: color_secondary_text)[ENDEREÇOS VINCULADOS] \
      #v(2pt)
      #text(size: 12pt, weight: "bold", fill: color_primary)[#data.stats.totalAddresses]
    ]
  ),
  // Card 4: Lotes Processados
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + color_primary, rest: 0.8pt + color_border),
    inset: 7pt,
    fill: color_bg_box,
    [
      #text(size: font_size_caption, weight: "bold", fill: color_secondary_text)[LOTES PROCESSADOS] \
      #v(2pt)
      #text(size: 12pt, weight: "bold", fill: color_primary)[#data.stats.totalBatches]
    ]
  ),
  // Card 5: Inconsistências Abertas
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (
      left: 3pt + if data.stats.openFindingsCount > 0 { color_status_overdue } else { color_emerald },
      rest: 0.8pt + color_border
    ),
    inset: 7pt,
    fill: color_bg_box,
    [
      #text(size: font_size_caption, weight: "bold", fill: color_secondary_text)[INCONSISTÊNCIAS ABERTAS] \
      #v(2pt)
      #text(
        size: 12pt,
        weight: "bold",
        fill: if data.stats.openFindingsCount > 0 { color_status_overdue } else { color_status_paid }
      )[#data.stats.openFindingsCount]
    ]
  ),
  // Card 6: Propostas Pendentes
  rect(
    width: 100%,
    radius: 3pt,
    stroke: (left: 3pt + color_status_pending, rest: 0.8pt + color_border),
    inset: 7pt,
    fill: color_bg_box,
    [
      #text(size: font_size_caption, weight: "bold", fill: color_secondary_text)[PROPOSTAS PENDENTES] \
      #v(2pt)
      #text(size: 12pt, weight: "bold", fill: color_primary)[#data.stats.pendingProposalsCount]
    ]
  )
)

#v(4pt)

// 4. HISTÓRICO RECENTE DE LOTES DE IMPORTAÇÃO
#section_heading("HISTÓRICO RECENTE DE LOTES DE IMPORTAÇÃO")

#if data.batches.len() == 0 [
  #rect(
    width: 100%,
    radius: 3pt,
    stroke: 0.8pt + color_border,
    inset: 8pt,
    fill: color_bg_box,
    align(center)[#text(size: font_size_subtitle, fill: color_secondary_text)[Nenhum lote processado registrado no banco local.]]
  )
] else [
  #table(
    columns: (40pt, 1fr, 80pt, 75pt),
    stroke: (x, y) => if y == 0 { (bottom: 1.5pt + color_gold) } else { (bottom: 0.5pt + color_border) },
    fill: (x, y) => if y == 0 { color_primary } else if calc.even(y) { color_bg_box } else { color_bg_white },
    align: (center + horizon, left + horizon, center + horizon, right + horizon),
    inset: (x: 6pt, y: 5pt),
    table.header(
      text(size: font_size_caption, weight: "bold", fill: color_bg_white)[ID],
      text(size: font_size_caption, weight: "bold", fill: color_bg_white)[ARQUIVO DE ORIGEM],
      text(size: font_size_caption, weight: "bold", fill: color_bg_white)[STATUS],
      text(size: font_size_caption, weight: "bold", fill: color_bg_white)[IMPORTADOS],
    ),
    ..for batch in data.batches {
      (
        text(size: font_size_running, weight: "bold", fill: color_primary)[\##batch.id],
        text(size: font_size_running, fill: color_primary_text)[#batch.filename],
        text(size: font_size_running, fill: color_secondary_text)[#batch.status],
        text(size: font_size_running, weight: "bold", fill: color_sky_dark)[#batch.importedRecords],
      )
    }
  )
]

#v(4pt)

// 5. APONTAMENTOS CRÍTICOS DE AUDITORIA
#section_heading("APONTAMENTOS CRÍTICOS DE AUDITORIA")

#if data.findings.len() == 0 [
  #rect(
    width: 100%,
    radius: 3pt,
    stroke: 0.8pt + color_border,
    inset: 8pt,
    fill: color_bg_box,
    align(center)[#text(size: font_size_subtitle, fill: color_secondary_text)[Nenhuma inconsistência em aberto no momento.]]
  )
] else [
  #table(
    columns: (40pt, 90pt, 1fr, 70pt),
    stroke: (x, y) => if y == 0 { (bottom: 1.5pt + color_gold) } else { (bottom: 0.5pt + color_border) },
    fill: (x, y) => if y == 0 { color_primary } else if calc.even(y) { color_bg_box } else { color_bg_white },
    align: (center + horizon, left + horizon, left + horizon, center + horizon),
    inset: (x: 6pt, y: 5pt),
    table.header(
      text(size: font_size_caption, weight: "bold", fill: color_bg_white)[ID],
      text(size: font_size_caption, weight: "bold", fill: color_bg_white)[CATEGORIA],
      text(size: font_size_caption, weight: "bold", fill: color_bg_white)[DESCRIÇÃO],
      text(size: font_size_caption, weight: "bold", fill: color_bg_white)[SEVERIDADE],
    ),
    ..for finding in data.findings {
      (
        text(size: font_size_running, weight: "bold", fill: color_primary)[\##finding.id],
        text(size: font_size_running, fill: color_primary_text)[#finding.category],
        text(size: font_size_running, fill: color_secondary_text)[#finding.description],
        rect(
          radius: 2pt,
          inset: (x: 4pt, y: 2pt),
          fill: if finding.severity == "high" or finding.severity == "critical" { color_status_overdue_bg } else { color_status_pending_bg },
          stroke: 0.5pt + if finding.severity == "high" or finding.severity == "critical" { color_status_overdue } else { color_status_pending },
          [
            #text(
              size: 6pt,
              weight: "bold",
              fill: if finding.severity == "high" or finding.severity == "critical" { color_status_overdue } else { color_status_pending }
            )[#upper(finding.severity)]
          ]
        ),
      )
    }
  )
]

#v(4pt)

// 6. PLANILHA CADASTRAL TERRITORIAL
#section_heading("PLANILHA CADASTRAL TERRITORIAL (" + str(data.properties.len()) + " Imóveis)")

#if data.properties.len() == 0 [
  #rect(
    width: 100%,
    radius: 3pt,
    stroke: 0.8pt + color_border,
    inset: 8pt,
    fill: color_bg_box,
    align(center)[#text(size: font_size_subtitle, fill: color_secondary_text)[Nenhum imóvel cadastrado registrado no banco local.]]
  )
] else [
  #table(
    columns: (30pt, 55pt, 1.3fr, 70pt, 1fr, 28pt, 34pt, 28pt, 50pt),
    stroke: (x, y) => if y == 0 { (bottom: 1.5pt + color_gold) } else { (bottom: 0.5pt + color_border) },
    fill: (x, y) => if y == 0 { color_primary } else if calc.even(y) { color_bg_box } else { color_bg_white },
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
      text(size: 6pt, weight: "bold", fill: color_bg_white)[\#ID],
      text(size: 6pt, weight: "bold", fill: color_bg_white)[MATRÍCULA],
      text(size: 6pt, weight: "bold", fill: color_bg_white)[CONTRIBUINTE],
      text(size: 6pt, weight: "bold", fill: color_bg_white)[BAIRRO],
      text(size: 6pt, weight: "bold", fill: color_bg_white)[RUA],
      text(size: 6pt, weight: "bold", fill: color_bg_white)[Nº],
      text(size: 6pt, weight: "bold", fill: color_bg_white)[QUADRA],
      text(size: 6pt, weight: "bold", fill: color_bg_white)[LOTE],
      text(size: 6pt, weight: "bold", fill: color_bg_white)[COMPL.],
    ),
    ..for prop in data.properties {
      (
        text(size: 6pt, weight: "bold", fill: color_primary)[\##prop.id],
        text(size: 6pt, fill: color_secondary_text)[#prop.matricula],
        text(size: 6pt, weight: "bold", fill: color_primary_text)[#prop.contribuinte],
        text(size: 6pt, fill: color_secondary_text)[#prop.bairro],
        text(size: 6pt, fill: color_secondary_text)[#prop.rua],
        text(size: 6pt, fill: color_secondary_text)[#prop.numero],
        text(size: 6pt, fill: color_secondary_text)[#prop.quadra],
        text(size: 6pt, fill: color_secondary_text)[#prop.lote],
        text(size: 6pt, fill: color_secondary_text)[#prop.complemento],
      )
    }
  )
]

#if data.properties.len() > 0 and data.properties.len() < data.stats.totalProperties [
  #v(6pt)
  #rect(
    width: 100%,
    radius: 3pt,
    stroke: 0.8pt + color_border,
    inset: 6pt,
    fill: color_bg_box,
    align(center)[
      #text(size: font_size_caption, fill: color_secondary_text)[
        Documento analítico contendo #data.properties.len() registros impressos da base territorial oficial de Maricá - RJ (total de #data.stats.totalProperties imóveis cadastrados • #asppibra_razao_social_curta • CNPJ: #asppibra_cnpj). Para a extração integral sem limite de paginação, utilize a exportação completa em Planilha CSV.
      ]
    ]
  )
]
