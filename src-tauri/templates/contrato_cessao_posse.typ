// ASPPIBRA DAO - Template Oficial do Contrato de Cessão de Posse (Typst)
#let raw_input = sys.inputs.at("data", default: "{}")
#let data = json(bytes(raw_input))

#let doc_number = data.at("document_number", default: "2026-0001/CP")
#let auth_code = data.at("auth_code", default: "2026-X7Y9")
#let cdata = data.at("data", default: (:))

#let get_val(key, default_val) = {
  if type(cdata) == dictionary and key in cdata {
    let v = cdata.at(key)
    if v != none and str(v) != "" { str(v) } else { default_val }
  } else {
    default_val
  }
}

#set document(
  title: "Contrato_Cessao_Posse_" + doc_number,
  author: "ASPPIBRA DAO",
)

#set page(
  paper: "a4",
  margin: (top: 2.2cm, bottom: 2.2cm, left: 3cm, right: 2cm),
  header: context {
    let i = counter(page).get().first()
    if i > 1 {
      grid(
        columns: (1fr, 1fr),
        align: (left, right),
        text(size: 7pt, fill: rgb("#6B7280"), weight: "bold")[ASPPIBRA-DAO • Contrato de Cessão de Posse de Imóvel],
        text(size: 7pt, fill: rgb("#111827"), font: "monospace", weight: "bold")[Nº #doc_number],
      )
      v(-2pt)
      line(length: 100%, stroke: 0.5pt + rgb("#E5E7EB"))
    }
  },
  footer: context {
    let i = counter(page).get().first()
    let n = counter(page).final().first()
    
    block(width: 100%, stroke: (top: 1.5pt + rgb("#111827")), inset: (top: 4pt))[
      #line(length: 100%, stroke: 0.75pt + rgb("#D4AF37"))
      #v(2pt)
      #grid(
        columns: (1.5fr, 1fr, 1.5fr),
        align: (left + horizon, center + horizon, right + horizon),
        text(size: 6.5pt, fill: rgb("#4B5563"))[Autenticação Digital • Lei 14.063/2020 • ICP-Brasil / DAO],
        text(size: 7.5pt, weight: "bold", fill: rgb("#0A3B18"))[Página #i de #n],
        text(size: 6.5pt, fill: rgb("#4B5563"))[ASPPIBRA DAO • Cód: #text(weight: "bold", fill: rgb("#111827"))[#auth_code]],
      )
    ]
  }
)

#set text(
  font: ("Roboto", "Liberation Sans", "Arial"),
  size: 9pt,
  fill: rgb("#1F2937"),
  lang: "pt",
)

#set par(
  justify: true,
  leading: 0.65em,
  first-line-indent: 1.5cm,
)

// CABEÇALHO DA PRIMEIRA PÁGINA
#block(width: 100%, inset: (bottom: 8pt))[
  #grid(
    columns: (1fr, auto),
    align: (left + horizon, right + horizon),
    [
      #text(size: 14pt, weight: "bold", fill: rgb("#111827"))[ASPPIBRA-DAO] \
      #v(2pt)
      #text(size: 7.5pt, fill: rgb("#6B7280"), weight: "bold")[DOCUMENTO OFICIAL • PROTOCOLO DE REGULARIZAÇÃO]
    ],
    [
      #rect(
        fill: rgb("#F9FAFB"),
        stroke: 1pt + rgb("#E5E7EB"),
        radius: 3pt,
        inset: (x: 8pt, y: 5pt),
        [
          #align(right)[
            #text(size: 6.5pt, weight: "bold", fill: rgb("#4B5563"))[Nº DE REGISTRO] \
            #text(size: 10pt, weight: "bold", fill: rgb("#111827"), font: "monospace")[#doc_number]
          ]
        ]
      )
    ]
  )
  #v(4pt)
  #line(length: 100%, stroke: 2pt + rgb("#111827"))
  #v(-3pt)
  #line(length: 100%, stroke: 1pt + rgb("#D4AF37"))
]

#v(8pt)

// TÍTULO DO INSTRUMENTO
#align(center)[
  #text(size: 11.5pt, weight: "bold", fill: rgb("#111827"))[
    INSTRUMENTO PARTICULAR DE CESSÃO DE DIREITOS POSSESSÓRIOS DE IMÓVEL URBANO
  ]
]

#v(10pt)

// CAPÍTULO I
#text(weight: "bold", size: 9.5pt, fill: rgb("#111827"))[CAPÍTULO I – DAS PARTES]

#v(4pt)

1.1. *CEDENTE:* #text(fill: rgb("#0A3B18"), weight: "bold")[#get_val("cedenteNome", "NOME COMPLETO DO CEDENTE")], nacionalidade #get_val("cedenteNacionalidade", "brasileira"), maior e capaz, estado civil #get_val("cedenteEstadoCivil", "solteiro(a)"), profissão #get_val("cedenteProfissao", "autônomo(a)"), portador(a) da Carteira de Identidade (RG) nº #get_val("cedenteRg", "00.000.000-0"), órgão expedidor #get_val("cedenteRgOrgaoUf", "SSP/UF"), inscrito(a) no CPF/MF sob o nº #get_val("cedenteCpf", "000.000.000-00"), residente e domiciliado(a) na #get_val("cedenteEndereco", "Endereço completo do cedente, CEP 00000-000"), endereço eletrônico: #get_val("cedenteEmail", "cedente@exemplo.com.br") e telefone/WhatsApp: #get_val("cedenteTelefone", "(00) 00000-0000"), doravante denominado(a) simplesmente *CEDENTE*.

1.2. *CÔNJUGE / COMPANHEIRO(A) DO CEDENTE:* #get_val("conjugeNome", "NOME COMPLETO DO CÔNJUGE"), nacionalidade #get_val("conjugeNacionalidade", "brasileira"), maior e capaz, profissão #get_val("conjugeProfissao", "do lar"), RG nº #get_val("conjugeRg", "00.000.000-0"), CPF/MF nº #get_val("conjugeCpf", "000.000.000-00"), na qualidade de *OUTORGANTE UXÓRIO / MARITAL / ANUENTE*.

1.3. *CESSIONÁRIO(A):* #text(fill: rgb("#0A3B18"), weight: "bold")[#get_val("cessionarioNome", "NOME DO CESSIONÁRIO")], nacionalidade #get_val("cessionarioNacionalidade", "brasileira"), maior e capaz, estado civil #get_val("cessionarioEstadoCivil", "casado(a)"), profissão #get_val("cessionarioProfissao", "comerciante"), portador(a) do RG nº #get_val("cessionarioRg", "00.000.000-0"), órgão expedidor #get_val("cessionarioRgOrgaoUf", "SSP/UF"), inscrito(a) no CPF/MF sob o nº #get_val("cessionarioCpf", "000.000.000-00"), residente e domiciliado(a) em #get_val("cessionarioEndereco", "Endereço do cessionário, CEP 00000-000"), e-mail: #get_val("cessionarioEmail", "cessionario@exemplo.com.br") e WhatsApp: #get_val("cessionarioTelefone", "(00) 00000-0000"), doravante denominado(a) simplesmente *CESSIONÁRIO(A)*.

1.4. *INTERVENIENTE ADMINISTRADORA:* *ASPPIBRA – ASSOCIAÇÃO DOS PROPRIETÁRIOS E POSSEIROS DE IMÓVEIS NO BRASIL*, pessoa jurídica de direito privado sem fins lucrativos, inscrita no CNPJ sob o nº 26.325.396/0001-30, com sede institucional, representada na forma de seu Estatuto Social por seu representante legal, doravante denominada simplesmente *ASPPIBRA*, atuando na qualidade de *INTERVENIENTE ADMINISTRADORA, COORDENADORA OPERACIONAL E MANDATÁRIA CONTRATUAL*.

#v(4pt)

// TABELA CONTA OPERACIONAL
#align(center)[
  #block(width: 95%, stroke: 0.8pt + rgb("#111827"), radius: 3pt)[
    #rect(fill: rgb("#F3F4F6"), width: 100%, inset: (y: 5pt), stroke: (bottom: 0.8pt + rgb("#111827")))[
      #align(center)[#text(weight: "bold", size: 8pt, fill: rgb("#111827"))[CONTA OPERACIONAL INSTITUCIONAL AUTORIZADA (ASPPIBRA)]]
    ]
    #pad(x: 10pt, y: 6pt)[
      #grid(
        columns: (1.2fr, 2fr),
        row-gutter: 4pt,
        text(weight: "bold", size: 7.5pt)[Instituição / Banco:], text(size: 7.5pt)[403 - CORA SCD],
        text(weight: "bold", size: 7.5pt)[Agência e Conta:], text(size: 7.5pt)[Agência: 0001 | Conta Corrente: 6193441-3],
        text(weight: "bold", size: 7.5pt)[Favorecido / CNPJ:], text(size: 7.5pt)[ASPPIBRA (CNPJ: 26.325.396/0001-30)],
        text(weight: "bold", size: 7.5pt)[Chave Pix Oficial:], text(size: 7.5pt, font: "monospace", weight: "bold", fill: rgb("#0A3B18"))[26.325.396/0001-30 (CNPJ)],
      )
    ]
  ]
]

#v(8pt)

// CAPÍTULO II
#text(weight: "bold", size: 9.5pt, fill: rgb("#111827"))[CAPÍTULO II – DO OBJETO E DA ORIGEM DA POSSE]

#v(4pt)

2.1. O presente instrumento tem por objeto a cessão e transferência onerosa, definitiva e irrevogável dos direitos possessórios legítimos, mansos e pacíficos incidentes sobre o imóvel correspondente ao *Lote nº #get_val("imovelLote", "01")*, da *Quadra nº #get_val("imovelQuadra", "A")*, com área aproximada de *#get_val("imovelArea", "360,00 m²")*, situado no perímetro de regularização fundiária coordenado pela ASPPIBRA.

2.2. O CEDENTE declara, sob as penas da lei (art. 299 do Código Penal), ser titular exclusivo da posse direta, mansa, justa e pacífica sobre o imóvel há mais de #get_val("tempoPosseAnos", "5 (cinco)") anos, sem qualquer interrupção, oposição ou litígio judicial ou extrajudicial.

#v(8pt)

// CAPÍTULO III
#text(weight: "bold", size: 9.5pt, fill: rgb("#111827"))[CAPÍTULO III – DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO]

#v(4pt)

3.1. Pela cessão dos direitos possessórios descritos neste instrumento, o CESSIONÁRIO pagará a quantia total e certa de *R$ #get_val("valorTotal", "65.000,00")* (#get_val("valorTotalExtenso", "sessenta e cinco mil reais")), a ser liquidada da seguinte forma:

- *a) Entrada / Sinal:* R$ #get_val("valorSinal", "15.000,00") (#get_val("valorSinalExtenso", "quinze mil reais")), pagos na data de assinatura deste contrato;
- *b) Saldo Remanescente:* R$ #get_val("valorSaldo", "50.000,00"), dividido em #get_val("qtdParcelas", "36") parcelas mensais e sucessivas no valor de R$ #get_val("valorParcela", "1.388,89") cada.

3.2. As partes convencionam expressamente que todos os pagamentos serão canalizados por meio da conta operacional da ASPPIBRA discriminada no Capítulo I, a qual atua como mandatária para arrecadação, conciliação e repasse aos titulares de direito.

#v(8pt)

// CAPÍTULO IV
#text(weight: "bold", size: 9.5pt, fill: rgb("#111827"))[CAPÍTULO IV – DA TRANSMISSÃO DA POSSE E DAS BENFEITORIAS]

#v(4pt)

4.1. A posse direta e física sobre o imóvel é transmitida ao CESSIONÁRIO a partir da comprovação do pagamento da entrada estipulada, momento a partir do qual correrão por sua conta exclusiva todos os impostos, taxas, tarifas e contribuições incidentes sobre o bem.

#v(8pt)

// CAPÍTULO V
#text(weight: "bold", size: 9.5pt, fill: rgb("#111827"))[CAPÍTULO V – DA REGULARIZAÇÃO FUNDIÁRIA E ATUAÇÃO DA ASPPIBRA]

#v(4pt)

5.1. A ASPPIBRA coordenará as medidas administrativas perante o Município e os Cartórios de Registro de Imóveis competentes com vistas à titulação definitiva da propriedade com fulcro na Lei Federal nº 13.465/2017 (REURB) ou usucapião administrativa (art. 216-A da LRP).

#v(8pt)

// CAPÍTULO VI
#text(weight: "bold", size: 9.5pt, fill: rgb("#111827"))[CAPÍTULO VI – DA PROTEÇÃO DE DADOS (LGPD) E ASSINATURA ELETRÔNICA]

#v(4pt)

6.1. As partes reconhecem a plena validade jurídica, integridade e eficácia probatória do presente instrumento firmado por meio de assinaturas eletrônicas com hash SHA-256 e autenticação criptográfica, nos exatos termos da Lei nº 14.063/2020 e da Medida Provisória nº 2.200-2/2001.

#v(8pt)

// CAPÍTULO VII
#text(weight: "bold", size: 9.5pt, fill: rgb("#111827"))[CAPÍTULO VII – DA ARBITRAGEM E DO FORO]

#v(4pt)

7.1. Eventuais litígios oriundos deste contrato poderão ser dirimidos prioritariamente perante a Câmara Arbitral designada pela ASPPIBRA ou, subsidiariamente, no Foro da Comarca de localização do imóvel.

#v(14pt)

// DATA E CIDADE
#align(right)[
  #text(size: 8.5pt)[#get_val("cidadeData", "Brasília - DF, 20 de outubro de 2026.")]
]

#v(16pt)

// BLOCO DE ASSINATURAS
#block(width: 100%, breakable: false)[
  #grid(
    columns: (1fr, 1fr),
    column-gutter: 20pt,
    row-gutter: 22pt,
    [
      #line(length: 90%, stroke: 0.8pt + rgb("#111827"))
      #text(weight: "bold", size: 8pt)[CEDENTE: ] #text(size: 8pt)[#get_val("cedenteNome", "NOME COMPLETO DO CEDENTE")] \
      #text(size: 7pt, fill: rgb("#6B7280"))[CPF: #get_val("cedenteCpf", "000.000.000-00")]
    ],
    [
      #line(length: 90%, stroke: 0.8pt + rgb("#111827"))
      #text(weight: "bold", size: 8pt)[CESSIONÁRIO: ] #text(size: 8pt)[#get_val("cessionarioNome", "NOME DO CESSIONÁRIO")] \
      #text(size: 7pt, fill: rgb("#6B7280"))[CPF: #get_val("cessionarioCpf", "000.000.000-00")]
    ],
    [
      #line(length: 90%, stroke: 0.8pt + rgb("#111827"))
      #text(weight: "bold", size: 8pt)[ASPPIBRA (ADMINISTRADORA)] \
      #text(size: 7pt, fill: rgb("#6B7280"))[CNPJ: 26.325.396/0001-30]
    ],
    [
      #line(length: 90%, stroke: 0.8pt + rgb("#111827"))
      #text(weight: "bold", size: 8pt)[CÔNJUGE ANUENTE] \
      #text(size: 7pt, fill: rgb("#6B7280"))[CPF: #get_val("conjugeCpf", "000.000.000-00")]
    ],
    [
      #line(length: 90%, stroke: 0.8pt + rgb("#6B7280"))
      #text(size: 7.5pt)[1ª Testemunha:] \
      #text(size: 7pt, fill: rgb("#6B7280"))[Nome: \ CPF:]
    ],
    [
      #line(length: 90%, stroke: 0.8pt + rgb("#6B7280"))
      #text(size: 7.5pt)[2ª Testemunha:] \
      #text(size: 7pt, fill: rgb("#6B7280"))[Nome: \ CPF:]
    ]
  )
  
  #v(14pt)
  
  // CHANCELA DE SEGURANÇA E REGISTRO D1
  #rect(
    fill: rgb("#F9FAFB"),
    stroke: 1pt + rgb("#D4AF37"),
    radius: 4pt,
    width: 100%,
    inset: (x: 10pt, y: 7pt),
    [
      #grid(
        columns: (1fr, auto),
        align: (left + horizon, right + horizon),
        [
          #text(weight: "bold", size: 7.5pt, fill: rgb("#0A3B18"))[CHANCELA DIGITAL DE AUDITORIA E INTEGRIDADE (DEVOS CORE)] \
          #text(size: 6.5pt, fill: rgb("#4B5563"))[Assinatura eletrônica realizada via Chave Privada do Associado e Protocolo Edge Cloudflare D1.] \
          #text(size: 6.5pt, font: "monospace", fill: rgb("#111827"))[Protocolo: ASPPIBRA-DOC-#auth_code-SECURE]
        ],
        [
          #rect(
            fill: rgb("#FFFFFF"),
            stroke: 1pt + rgb("#0A3B18"),
            radius: 2pt,
            inset: (x: 6pt, y: 3pt),
            text(size: 6.5pt, weight: "bold", fill: rgb("#0A3B18"))[VERIFICADO ✓]
          )
        ]
      )
    ]
  )
]
