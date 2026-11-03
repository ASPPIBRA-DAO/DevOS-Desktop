// ====================================================================
// ASPPIBRA DAO - Componentes Oficiais de Cabeçalho e Rodapé
// Módulo: core/header_footer.typ
// ====================================================================

#import "branding.typ": *
#import "typography.typ": *

// Utilitário de validação estrita de strings não vazias (rejeita none, "" e "   ")
#let _is_non_empty_str(val) = {
  if val == none {
    false
  } else {
    str(val).trim() != ""
  }
}

// Cabeçalho Oficial Principal (Primeira Página)
// - Quando `require_registration: true` (padrão para instrumentos contratuais registrados),
//   exige `doc_number` legítimo, não nulo e não vazio.
// - Quando `require_registration: false` (para demonstrativos e relatórios cujos contratos de dados
//   não possuem `document_number` antes da FASE 7), não fabrica número de registro fictício,
//   exibindo a identificação institucional oficial (CNPJ) e rejeitando strings vazias se `doc_number` for passado.
#let asppibra_header_first_page(
  doc_number: none,
  require_registration: true,
  subtitle: "DOCUMENTO OFICIAL • PROTOCOLO DE REGULARIZAÇÃO",
) = {
  if require_registration {
    assert(
      _is_non_empty_str(doc_number),
      message: "asppibra_header_first_page: 'doc_number' é obrigatório, não pode ser nulo, vazio ou conter apenas espaços",
    )
  } else if doc_number != none {
    assert(
      _is_non_empty_str(doc_number),
      message: "asppibra_header_first_page: quando informado, 'doc_number' não pode ser vazio ou conter apenas espaços",
    )
  }
  assert(
    _is_non_empty_str(subtitle),
    message: "asppibra_header_first_page: 'subtitle' não pode ser nulo, vazio ou conter apenas espaços",
  )
  block(width: 100%, inset: (bottom: 2pt))[
    #grid(
      columns: (auto, 1fr, auto),
      gutter: 10pt,
      align: (left + horizon, left + horizon, right + horizon),
      // Lado Esquerdo 1: Logo Globo Institucional (28pt = 38px proporcional)
      image(bytes(asppibra_globe_svg), width: 28pt),
      // Lado Esquerdo 2: Título e Subtítulo Institucional (alinhados à esquerda, indent 0)
      [
        #set par(first-line-indent: 0pt, leading: leading_header, justify: false)
        #text(size: font_size_title, weight: "bold", fill: color_primary)[#asppibra_sigla] \
        #v(1.5pt)
        #text(size: font_size_subtitle, fill: color_muted_text, weight: "bold")[#str(subtitle).trim()]
      ],
      // Lado Direito: Caixa de Registro Institucional (somente quando há doc_number real) ou Identificação CNPJ
      [
        #rect(
          fill: color_bg_box,
          stroke: 1pt + color_border,
          radius: 3pt,
          inset: (x: 10pt, y: 5pt),
          [
            #set par(first-line-indent: 0pt, leading: leading_tight, justify: false)
            #align(right)[
              #if _is_non_empty_str(doc_number) [
                #text(size: 6pt, weight: "bold", fill: color_secondary_text)[Nº DE REGISTRO] \
                #v(1pt)
                #text(size: 9.5pt, weight: "bold", fill: color_primary, font: font_family_mono)[#str(doc_number).trim()]
              ] else [
                #text(size: 6pt, weight: "bold", fill: color_secondary_text)[IDENTIFICAÇÃO INSTITUCIONAL] \
                #v(1pt)
                #text(size: 8pt, weight: "bold", fill: color_primary, font: font_family_mono)[CNPJ #asppibra_cnpj]
              ]
            ]
          ]
        )
      ]
    )
    #v(6pt)
    // Traço Duplo Institucional Oficial: Preto 2pt + Filete Ouro #D4AF37 1pt
    #stack(
      spacing: 1.5pt,
      line(length: 100%, stroke: 2pt + color_primary),
      line(length: 100%, stroke: 1pt + color_gold),
    )
  ]
}

// Cabeçalho Corrente para Páginas Subsequentes
#let asppibra_header_running(
  doc_number: none,
  doc_title: none,
  require_registration: true,
) = {
  if require_registration {
    assert(
      _is_non_empty_str(doc_number),
      message: "asppibra_header_running: 'doc_number' é obrigatório, não pode ser nulo, vazio ou conter apenas espaços",
    )
  } else if doc_number != none {
    assert(
      _is_non_empty_str(doc_number),
      message: "asppibra_header_running: quando informado, 'doc_number' não pode ser vazio ou conter apenas espaços",
    )
  }
  assert(
    _is_non_empty_str(doc_title),
    message: "asppibra_header_running: 'doc_title' é obrigatório, não pode ser nulo, vazio ou conter apenas espaços",
  )
  set par(first-line-indent: 0pt, justify: false)
  grid(
    columns: (1fr, auto),
    align: (left + horizon, right + horizon),
    text(size: font_size_running, fill: color_muted_text, weight: "bold")[#asppibra_sigla • #str(doc_title).trim()],
    if _is_non_empty_str(doc_number) {
      text(size: font_size_running, fill: color_primary, font: font_family_mono, weight: "bold")[Nº #str(doc_number).trim()]
    } else {
      text(size: font_size_running, fill: color_secondary_text, font: font_family_mono)[CNPJ #asppibra_cnpj]
    },
  )
  v(-2pt)
  line(length: 100%, stroke: 0.5pt + color_border)
}

// Rodapé Institucional com Identificação de Registro (quando aplicável)
#let asppibra_footer(
  doc_number: none,
  auth_code: none,
  require_registration: true,
) = {
  if require_registration {
    assert(
      _is_non_empty_str(doc_number),
      message: "asppibra_footer: 'doc_number' é obrigatório, não pode ser nulo, vazio ou conter apenas espaços",
    )
    assert(
      _is_non_empty_str(auth_code),
      message: "asppibra_footer: 'auth_code' é obrigatório, não pode ser nulo, vazio ou conter apenas espaços",
    )
  } else {
    if doc_number != none {
      assert(
        _is_non_empty_str(doc_number),
        message: "asppibra_footer: quando informado, 'doc_number' não pode ser vazio ou conter apenas espaços",
      )
    }
    if auth_code != none {
      assert(
        _is_non_empty_str(auth_code),
        message: "asppibra_footer: quando informado, 'auth_code' não pode ser vazio ou conter apenas espaços",
      )
    }
  }
  context {
    let i = counter(page).get().first()
    let n = counter(page).final().first()
    set par(first-line-indent: 0pt, justify: false)
    block(width: 100%, inset: (top: 2pt))[
      #stack(
        spacing: 1.5pt,
        line(length: 100%, stroke: 1.5pt + color_primary),
        line(length: 100%, stroke: 0.75pt + color_gold),
      )
      #v(3pt)
      #grid(
        columns: (1.6fr, 1fr, 1.4fr),
        align: (left + horizon, center + horizon, right + horizon),
        if _is_non_empty_str(doc_number) {
          text(size: font_size_caption, fill: color_secondary_text)[Registro Nº #text(weight: "bold", fill: color_primary)[#str(doc_number).trim()] • DevOS]
        } else {
          text(size: font_size_caption, fill: color_secondary_text)[#asppibra_sigla • CNPJ: #text(weight: "bold", fill: color_primary)[#asppibra_cnpj]]
        },
        text(size: font_size_subtitle, weight: "bold", fill: color_primary)[Página #i de #n],
        if _is_non_empty_str(auth_code) {
          text(size: font_size_caption, fill: color_secondary_text)[ASPPIBRA DAO • Cód: #text(weight: "bold", fill: color_primary)[#str(auth_code).trim()]]
        } else {
          text(size: font_size_caption, fill: color_secondary_text)[Emissão Documental Interna • DevOS]
        },
      )
    ]
  }
}
