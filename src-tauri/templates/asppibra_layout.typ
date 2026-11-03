// ====================================================================
// ASPPIBRA DAO - Biblioteca de Layout Canônico Unificado (Typst)
// Padrão Institucional ABNT para Contratos e Documentos Oficiais
// ====================================================================

// Metadados Institucionais Oficiais (Fonte Única da Infraestrutura Documental)
#let asppibra_razao_social = "ASPPIBRA – ASSOCIAÇÃO DOS PROPRIETÁRIOS E POSSEIROS DE IMÓVEIS NO BRASIL"
#let asppibra_razao_social_curta = "ASPPIBRA – Associação dos Proprietários e Posseiros de Imóveis no Brasil"
#let asppibra_sigla = "ASPPIBRA-DAO"
#let asppibra_cnpj = "26.325.396/0001-30"

#let asppibra_globe_svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"28\" height=\"28\" viewBox=\"0 0 100 100\"><path fill=\"#111827\" d=\"M49.947 0A50 50 0 0 0 0 50a50 50 0 0 0 50 50a50 50 0 0 0 50-50A50 50 0 0 0 50 0zM52.5 5.682c5.268.896 10.302 5.236 14.268 12.437c1.278 2.321 2.42 4.927 3.408 7.75H52.5zm-5 .197v19.99H30.75c.988-2.823 2.13-5.429 3.408-7.75C37.89 11.341 42.571 7.102 47.5 5.88M35.98 7.232c-2.324 2.352-4.41 5.22-6.203 8.475c-1.68 3.05-3.125 6.467-4.312 10.162H12.01c5.535-8.706 13.975-15.37 23.97-18.637m29.41.463c9.398 3.413 17.32 9.868 22.6 18.174H75.455c-1.184-3.695-2.627-7.112-4.307-10.162c-1.676-3.045-3.613-5.749-5.757-8.012M9.257 30.87h14.808c-1.245 5.162-2.008 10.76-2.203 16.631H5.072a44.8 44.8 0 0 1 4.184-16.63m19.974 0H47.5V47.5H26.867c.212-5.935 1.043-11.554 2.363-16.63m23.27 0h19.195c1.32 5.077 2.152 10.696 2.364 16.631H52.5zm24.355 0h13.89a44.8 44.8 0 0 1 4.182 16.63H79.053c-.194-5.872-.955-11.468-2.198-16.63M5.072 52.5h16.762c.129 5.856.82 11.454 1.994 16.63H9.256A44.8 44.8 0 0 1 5.072 52.5m21.762 0H47.5v16.63H28.98c-1.245-5.1-2.006-10.715-2.146-16.63m25.666 0h21.592c-.14 5.915-.902 11.53-2.147 16.63H52.5zm26.576 0h15.852a44.8 44.8 0 0 1-4.184 16.63H77.09c1.17-5.177 1.857-10.775 1.986-16.63M12.01 74.13h13.136c1.242 4.085 2.8 7.84 4.631 11.165c1.438 2.61 3.068 4.969 4.854 7.017c-9.407-3.41-17.336-9.869-22.621-18.181m18.394 0H47.5v20.798c-.308-.017-.612-.048-.918-.07c-4.59-1.5-8.924-5.62-12.424-11.975c-1.428-2.594-2.692-5.537-3.754-8.752m22.096 0h18.021c-1.06 3.216-2.325 6.159-3.753 8.753c-3.428 6.225-7.656 10.308-12.141 11.883a46 46 0 0 1-2.127.162zm23.275 0H87.99a45.06 45.06 0 0 1-21.228 17.641c1.604-1.92 3.075-4.094 4.386-6.476c1.831-3.325 3.388-7.08 4.627-11.164\"/></svg>"

#let asppibra_header_first_page(doc_number: "2026-0001/CP") = {
  block(width: 100%, inset: (bottom: 2pt))[
    #grid(
      columns: (auto, 1fr, auto),
      gutter: 10pt,
      align: (left + horizon, left + horizon, right + horizon),
      // Lado Esquerdo 1: Logo Globo Institucional (28pt = 38px proporcional)
      image(bytes(asppibra_globe_svg), width: 28pt),
      // Lado Esquerdo 2: Título e Subtítulo Institucional (alinhados à esquerda, indent 0)
      [
        #set par(first-line-indent: 0pt, leading: 0.35em, justify: false)
        #text(size: 13.5pt, weight: "bold", fill: rgb("#111827"))[ASPPIBRA-DAO] \
        #v(1.5pt)
        #text(size: 7.5pt, fill: rgb("#6B7280"), weight: "bold")[DOCUMENTO OFICIAL • PROTOCOLO DE REGULARIZAÇÃO]
      ],
      // Lado Direito: Caixa de Registro Institucional
      [
        #rect(
          fill: rgb("#F9FAFB"),
          stroke: 1pt + rgb("#E5E7EB"),
          radius: 3pt,
          inset: (x: 10pt, y: 5pt),
          [
            #set par(first-line-indent: 0pt, leading: 0.3em, justify: false)
            #align(right)[
              #text(size: 6pt, weight: "bold", fill: rgb("#4B5563"))[Nº DE REGISTRO] \
              #v(1pt)
              #text(size: 9.5pt, weight: "bold", fill: rgb("#111827"), font: "monospace")[#doc_number]
            ]
          ]
        )
      ]
    )
    #v(6pt)
    // Traço Duplo Institucional Oficial sem vão branco: Preto 2pt + Filete Ouro #D4AF37 1pt
    #stack(
      spacing: 1.5pt,
      line(length: 100%, stroke: 2pt + rgb("#111827")),
      line(length: 100%, stroke: 1pt + rgb("#D4AF37")),
    )
  ]
}

#let asppibra_header_running(doc_number: "2026-0001/CP", doc_title: "Contrato de Cessão de Posse de Imóvel") = {
  set par(first-line-indent: 0pt, justify: false)
  grid(
    columns: (1fr, auto),
    align: (left + horizon, right + horizon),
    text(size: 7pt, fill: rgb("#6B7280"), weight: "bold")[ASPPIBRA-DAO • #doc_title],
    text(size: 7pt, fill: rgb("#111827"), font: "monospace", weight: "bold")[Nº #doc_number],
  )
  v(-2pt)
  line(length: 100%, stroke: 0.5pt + rgb("#E5E7EB"))
}

#let asppibra_footer(doc_number: "2026-0001/CP", auth_code: "2026-X7Y9") = {
  context {
    let i = counter(page).get().first()
    let n = counter(page).final().first()
    set par(first-line-indent: 0pt, justify: false)
    block(width: 100%, inset: (top: 2pt))[
      #stack(
        spacing: 1.5pt,
        line(length: 100%, stroke: 1.5pt + rgb("#111827")),
        line(length: 100%, stroke: 0.75pt + rgb("#D4AF37")),
      )
      #v(3pt)
      #grid(
        columns: (1.6fr, 1fr, 1.4fr),
        align: (left + horizon, center + horizon, right + horizon),
        text(size: 6.5pt, fill: rgb("#4B5563"))[Autenticação Digital • Lei Federal 14.063/2020 • ICP-Brasil / DAO],
        text(size: 7.5pt, weight: "bold", fill: rgb("#111827"))[Página #i de #n],
        text(size: 6.5pt, fill: rgb("#4B5563"))[ASPPIBRA DAO • Cód: #text(weight: "bold", fill: rgb("#111827"))[#auth_code]],
      )
    ]
  }
}

#let asppibra_tag(tag_label, value) = {
  if value != none and str(value) != "" and str(value) != tag_label {
    underline(strong(str(value)))
  } else {
    box(
      fill: rgb("#FFF8E1"),
      stroke: 0.8pt + rgb("#D4AF37"),
      radius: 2pt,
      inset: (x: 4pt, y: 1.5pt),
      baseline: 1pt,
      [#text(size: 7.5pt, weight: "bold", fill: rgb("#B8860B"))[#tag_label]]
    )
  }
}
