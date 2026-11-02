// ASPPIBRA DAO - Template Oficial Unificado do Contrato de Cessão de Posse (Typst)
// Minuta Extensa Completa (18 Capítulos) - Única Fonte de Verdade
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
  margin: (top: 2.4cm, bottom: 2.2cm, left: 3cm, right: 2cm),
  header: context {
    let i = counter(page).get().first()
    if i == 1 {
      // CABEÇALHO OFICIAL DA PRIMEIRA PÁGINA
      block(width: 100%, inset: (bottom: 4pt))[
        #grid(
          columns: (1fr, auto),
          align: (left + horizon, right + horizon),
          [
            #text(size: 13pt, weight: "bold", fill: rgb("#111827"))[ASPPIBRA-DAO] \
            #v(1pt)
            #text(size: 7pt, fill: rgb("#6B7280"), weight: "bold")[DOCUMENTO OFICIAL • PROTOCOLO DE REGULARIZAÇÃO]
          ],
          [
            #rect(
              fill: rgb("#F9FAFB"),
              stroke: 1pt + rgb("#E5E7EB"),
              radius: 3pt,
              inset: (x: 8pt, y: 4pt),
              [
                #align(right)[
                  #text(size: 6pt, weight: "bold", fill: rgb("#4B5563"))[Nº DE REGISTRO] \
                  #text(size: 9.5pt, weight: "bold", fill: rgb("#111827"), font: "monospace")[#doc_number]
                ]
              ]
            )
          ]
        )
        #v(3pt)
        #line(length: 100%, stroke: 2pt + rgb("#111827"))
        #v(-3pt)
        #line(length: 100%, stroke: 1pt + rgb("#D4AF37"))
      ]
    } else {
      // CABEÇALHO CORRIDO LEVE NAS PÁGINAS SEGUINTES
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
    
    // RODAPÉ OFICIAL UNIFICADO
    block(width: 100%, stroke: (top: 1.5pt + rgb("#111827")), inset: (top: 3pt))[
      #line(length: 100%, stroke: 0.75pt + rgb("#D4AF37"))
      #v(2pt)
      #grid(
        columns: (1.6fr, 1fr, 1.4fr),
        align: (left + horizon, center + horizon, right + horizon),
        text(size: 6.5pt, fill: rgb("#4B5563"))[Autenticação Digital • Lei Federal 14.063/2020 • ICP-Brasil / DAO],
        text(size: 7.5pt, weight: "bold", fill: rgb("#0A3B18"))[Página #i de #n],
        text(size: 6.5pt, fill: rgb("#4B5563"))[ASPPIBRA DAO • Cód: #text(weight: "bold", fill: rgb("#111827"))[#auth_code]],
      )
    ]
  }
)

#set text(
  font: ("Roboto", "Liberation Sans", "Arial"),
  size: 8.5pt,
  fill: rgb("#1F2937"),
  lang: "pt",
)

#set par(
  justify: true,
  leading: 0.6em,
  first-line-indent: 1.25cm,
)

#let section_heading(title) = {
  v(8pt)
  align(center)[#text(weight: "bold", size: 9pt, fill: rgb("#111827"))[#title]]
  v(3pt)
}

// TÍTULO DO INSTRUMENTO
#align(center)[
  #text(size: 11pt, weight: "bold", fill: rgb("#111827"))[
    INSTRUMENTO PARTICULAR DE CESSÃO DE POSSE DE IMÓVEL
  ]
]

#v(6pt)

// ====================================================================
// CAPÍTULO I – DAS PARTES
// ====================================================================
#section_heading("CAPÍTULO I – DAS PARTES")

1.1. *CEDENTE:* #text(fill: rgb("#0A3B18"), weight: "bold")[#get_val("cedenteNome", "NOME COMPLETO DO CEDENTE")], #get_val("cedenteNacionalidade", "nacionalidade"), maior e capaz, estado civil #get_val("cedenteEstadoCivil", "estado civil"), profissão #get_val("cedenteProfissao", "profissão"), portador(a) da Carteira de Identidade (RG) nº #get_val("cedenteRg", "número do RG"), órgão expedidor #get_val("cedenteRgOrgaoUf", "órgão e UF"), inscrito(a) no CPF sob o nº #get_val("cedenteCpf", "número do CPF"), residente e domiciliado(a) na #get_val("cedenteEndereco", "endereço completo com CEP"), endereço eletrônico (e-mail): #get_val("cedenteEmail", "e-mail do cedente") e telefone/WhatsApp: #get_val("cedenteTelefone", "telefone com DDD"), doravante denominado(a) simplesmente *CEDENTE*.

1.2. *CÔNJUGE / COMPANHEIRO(A) DO CEDENTE:* #get_val("conjugeNome", "NOME COMPLETO DO CÔNJUGE/COMPANHEIRO(A)"), #get_val("conjugeNacionalidade", "nacionalidade"), maior e capaz, estado civil #get_val("conjugeEstadoCivil", "estado civil"), profissão #get_val("conjugeProfissao", "profissão"), portador(a) da Carteira de Identidade (RG) nº #get_val("conjugeRg", "número do RG"), órgão expedidor #get_val("conjugeRgOrgaoUf", "órgão e UF"), inscrito(a) no CPF/MF sob o nº #get_val("conjugeCpf", "número do CPF"), residente e domiciliado(a) na #get_val("conjugeEndereco", "endereço completo com CEP"), endereço eletrônico (e-mail): #get_val("conjugeEmail", "e-mail do cônjuge") e telefone/WhatsApp: #get_val("conjugeTelefone", "telefone com DDD"), na qualidade de *OUTORGANTE UXÓRIO / MARITAL / ANUENTE*.

1.3. *CESSIONÁRIO(A):* #text(fill: rgb("#0A3B18"), weight: "bold")[#get_val("cessionarioNome", "NOME DO CESSIONÁRIO")], #get_val("cessionarioNacionalidade", "nacionalidade"), maior e capaz, estado civil #get_val("cessionarioEstadoCivil", "estado civil"), profissão #get_val("cessionarioProfissao", "profissão"), portador(a) da Carteira de Identidade (RG) nº #get_val("cessionarioRg", "RG do cessionário"), órgão expedidor #get_val("cessionarioRgOrgaoUf", "órgão e UF do cessionário"), inscrito(a) no CPF sob o nº #get_val("cessionarioCpf", "CPF do cessionário"), residente e domiciliado(a) em #get_val("cessionarioEndereco", "endereço completo do cessionário, com CEP"), e-mail: #get_val("cessionarioEmail", "e-mail do cessionário") e telefone/WhatsApp: #get_val("cessionarioTelefone", "telefone do cessionário"), doravante denominado(a) simplesmente *CESSIONÁRIO(A)*.

1.4. Em caso de pluralidade de cessionários, estes serão doravante denominados em conjunto *CESSIONÁRIOS*, respondendo cada um individualmente pela parte do imóvel que lhe for especificamente cedida nos termos do Capítulo III, sem solidariedade entre si quanto às obrigações de pagamento relativas à parte de outrem, salvo disposição expressa em contrário, ressalvada a hipótese de cessionários unidos entre si por casamento ou união estável sob regime de bens que implique comunhão, caso em que a responsabilidade pelas obrigações de pagamento observará as regras do respectivo regime de bens, independentemente da regra de ausência de solidariedade prevista nesta Cláusula.

1.4.1. Os percentuais de participação de cada CESSIONÁRIO deverão ser expressamente indicados em tabela anexa a este instrumento (Cláusula 3.5), com a especificação, para cada CESSIONÁRIO, de sua fração de posse, de preço, de responsabilidade por benfeitorias e, quando cabível, de retenção ou devolução em caso de distrato, indicando-se ainda se as proporções são aplicáveis igualmente aos dois lotes ou de forma distinta a cada um.

1.5. *DA ASPPIBRA – ADMINISTRAÇÃO CONTRATUAL, COORDENAÇÃO OPERACIONAL, COBRANÇA, RECEBIMENTO E REPASSE*

1.5.1. *Da condição e finalidade de atuação.* A *ASPPIBRA – ASSOCIAÇÃO DOS PROPRIETÁRIOS E POSSEIROS DE IMÓVEIS NO BRASIL*, pessoa jurídica de direito privado constituída sob a forma de associação civil sem fins lucrativos, inscrita no CNPJ sob o nº 26.325.396/0001-30, com sede em #get_val("asppibraEnderecoSede", "endereço completo da sede da ASPPIBRA, com CEP"), neste ato representada na forma de seu Estatuto Social por #get_val("asppibraRepresentanteNome", "representante legal"), #get_val("asppibraRepresentanteCargo", "cargo estatutário"), portador(a) do RG nº #get_val("asppibraRepresentanteRg", "RG"), inscrito(a) no CPF sob o nº #get_val("asppibraRepresentanteCpf", "CPF"), doravante denominada "*ASPPIBRA*", intervém neste instrumento na qualidade de *INTERVENIENTE ADMINISTRADORA, COORDENADORA OPERACIONAL E MANDATÁRIA CONTRATUAL*, nos limites deste instrumento, de seu Estatuto Social e da legislação aplicável.

1.5.2. A atuação da ASPPIBRA compreende a administração operacional deste contrato, a coordenação das providências administrativas relacionadas à sua execução, a organização documental, o acompanhamento dos procedimentos de regularização fundiária e registral, a articulação entre as partes e os profissionais envolvidos e a administração operacional do fluxo de pagamentos, inclusive cobrança, recebimento, conciliação, retenções autorizadas, repasses e prestação de contas.

1.5.3. A ASPPIBRA não é CEDENTE, CESSIONÁRIA, titular dominial, possuidora ou garantidora da aquisição da propriedade ou de qualquer direito real sobre o imóvel, nem assume as obrigações materiais que este instrumento atribui diretamente às demais partes.

1.5.4. A presente intervenção não transfere à ASPPIBRA a titularidade econômica dos créditos pertencentes ao CEDENTE ou a qualquer outro titular expressamente indicado neste instrumento. Os valores que a ASPPIBRA receber em razão deste contrato, enquanto não constituírem remuneração ou despesa própria validamente exigível, serão recebidos *por conta e ordem do respectivo titular*.

1.5.5. *Dos poderes de administração.* Dentro dos limites deste instrumento, compete à ASPPIBRA:
- a) organizar, receber, conferir formalmente e encaminhar documentos;
- b) acompanhar protocolos, exigências, diligências, prazos e etapas administrativas;
- c) promover a comunicação operacional entre as partes, profissionais e entidades envolvidas;
- d) contratar, indicar, coordenar ou acompanhar profissionais legalmente habilitados, conforme a natureza de cada ato;
- e) administrar operacionalmente as obrigações financeiras previstas neste instrumento;
- f) praticar os atos administrativos necessários à execução regular do contrato, desde que não alterem direitos materiais das partes sem autorização específica.

1.5.6. A ASPPIBRA não poderá, sem autorização expressa das partes quando exigível, alterar o preço da cessão, conceder desconto ou remissão, renunciar a direitos, assumir obrigações novas em nome de qualquer parte ou alterar substancialmente este instrumento.

1.5.7. *Da contratação de profissionais e atuação jurídica.* A ASPPIBRA poderá contratar ou coordenar advogados, engenheiros, arquitetos, topógrafos, técnicos e outros profissionais legalmente habilitados necessários à execução do objeto.

1.5.8. A responsabilidade técnica, profissional e ética pelos atos próprios de profissão regulamentada permanecerá atribuída ao respectivo profissional habilitado que os praticar, sem prejuízo da responsabilidade da ASPPIBRA por seus próprios atos administrativos.

1.5.9. A ASPPIBRA não prestará, por si própria, serviços jurídicos privativos de advogado. A orientação jurídica individual, elaboração ou assinatura de peças privativas e representação judicial ou extrajudicial individual serão realizadas por advogado legalmente habilitado constituído pelo interessado.

1.5.10. A ASPPIBRA poderá exercer apoio administrativo, técnico e institucional em procedimentos de REURB, usucapião e regularização registral perante órgãos públicos e serventias.

1.5.11. *Da cobrança, mandato e recebimento.* O CEDENTE, na qualidade de titular dos créditos, autoriza e constitui a ASPPIBRA como sua *mandatária para administração operacional da cobrança, recebimento e posterior repasse*, reconhecendo o CESSIONÁRIO essa forma de pagamento.

1.5.12. Para execução do mandato, a ASPPIBRA poderá administrar cobranças por boleto bancário, Pix Cobrança, transferência bancária ou outros meios de pagamento admitidos.

1.5.13. A emissão, apresentação, identificação do beneficiário e liquidação dos instrumentos de pagamento observarão a regulamentação aplicável.

1.5.14. *Da conta operacional da ASPPIBRA.* As partes autorizam expressamente que os pagamentos sejam efetuados na conta operacional institucional da ASPPIBRA:

#align(center)[
  #block(width: 95%, stroke: 0.8pt + rgb("#111827"), radius: 3pt)[
    #rect(fill: rgb("#F3F4F6"), width: 100%, inset: (y: 4pt), stroke: (bottom: 0.8pt + rgb("#111827")))[
      #align(center)[#text(weight: "bold", size: 8pt, fill: rgb("#111827"))[DADOS DA CONTA OPERACIONAL INSTITUCIONAL (ASPPIBRA)]]
    ]
    #pad(x: 10pt, y: 6pt)[
      #grid(
        columns: (1.2fr, 2fr),
        row-gutter: 4pt,
        text(weight: "bold", size: 7.5pt)[Instituição / Banco:], text(size: 7.5pt)[#get_val("asppibraBanco", "403 - Cora SCD")],
        text(weight: "bold", size: 7.5pt)[Agência e Conta:], text(size: 7.5pt)[Agência: #get_val("asppibraAgencia", "0001") | Conta: #get_val("asppibraConta", "6193441-3")],
        text(weight: "bold", size: 7.5pt)[Titular / CNPJ:], text(size: 7.5pt)[ASPPIBRA (CNPJ: 26.325.396/0001-30)],
        text(weight: "bold", size: 7.5pt)[Chave Pix Oficial:], text(size: 7.5pt, font: "monospace", weight: "bold", fill: rgb("#0A3B18"))[#get_val("asppibraChavePix", "26.325.396/0001-30 (CNPJ)")],
      )
    ]
  ]
]

1.5.15. A indicação da conta da ASPPIBRA como conta de recebimento constitui elemento expresso deste contrato.

1.5.16. O recebimento dos valores pela ASPPIBRA não implica cessão ou transferência do crédito, permanecendo o titular econômico aquele indicado neste instrumento.

1.5.17. A ASPPIBRA manterá controle financeiro individualizado por contrato, identificando entradas, saídas, retenções e repasses.

1.5.18. A ASPPIBRA não poderá utilizar valores recebidos por conta deste contrato para finalidade estranha à relação contratual.

1.5.19. *Da eficácia do pagamento.* O pagamento efetuado na conta indicada ou por boleto/Pix disponibilizado será considerado realizado mediante a confirmação da efetiva liquidação.

1.5.20. O simples agendamento sem liquidação não constitui quitação.

1.5.21. *Da conciliação e controle financeiro.* Compete à ASPPIBRA identificar e conciliar cada pagamento recebido com o respectivo contrato ou parcela.

1.5.22. Havendo divergência ou duplicidade, a ASPPIBRA registrará a ocorrência e adotará as providências de regularização.

1.5.23. *Da retenção e destinação.* A ASPPIBRA somente reterá valores para: a) remuneração própria prevista; b) despesas e custos atribuídos; c) pagamento a profissionais autorizados; d) retenções tributárias legais; e) hipóteses expressamente autorizadas.

1.5.24. É vedada retenção arbitrária para finalidade diversa.

1.5.25. *Da remuneração da ASPPIBRA.* Pela administração contratual, gestão operacional e fluxo de pagamentos, será devida à ASPPIBRA remuneração nos termos pactuados, paga na forma deste instrumento.

1.5.26. A remuneração da ASPPIBRA não se confunde com o preço da cessão, contribuições associativas ou honorários periciais/advocatícios.

1.5.27. As retenções a título de remuneração ocorrerão apenas quando a respectiva parcela estiver vencida e exigível.

1.5.28. A remuneração da ASPPIBRA não é condicionada exclusivamente ao resultado de decisões de órgãos públicos ou serventias.

1.5.29. *Dos repasses.* Confirmado o recebimento e efetuadas as retenções autorizadas, a ASPPIBRA repassará o saldo devido ao titular em até #get_val("prazoRepasseCedenteDias", "5") dias úteis:

#align(center)[
  #block(width: 95%, stroke: 0.8pt + rgb("#111827"), radius: 3pt)[
    #rect(fill: rgb("#F3F4F6"), width: 100%, inset: (y: 4pt), stroke: (bottom: 0.8pt + rgb("#111827")))[
      #align(center)[#text(weight: "bold", size: 8pt, fill: rgb("#111827"))[DADOS PARA REPASSE AO CEDENTE]]
    ]
    #pad(x: 10pt, y: 6pt)[
      #grid(
        columns: (1.2fr, 2fr),
        row-gutter: 4pt,
        text(weight: "bold", size: 7.5pt)[Instituição / Banco:], text(size: 7.5pt)[#get_val("cedenteBanco", "Banco do Cedente")],
        text(weight: "bold", size: 7.5pt)[Agência e Conta:], text(size: 7.5pt)[Agência: #get_val("cedenteAgencia", "0000") | Conta: #get_val("cedenteConta", "00000-0")],
        text(weight: "bold", size: 7.5pt)[Titular / CPF/CNPJ:], text(size: 7.5pt)[#get_val("cedenteNomeRepasse", get_val("cedenteNome", "Nome do Cedente")) (#get_val("cedenteCpfRepasse", get_val("cedenteCpf", "CPF")))],
        text(weight: "bold", size: 7.5pt)[Chave Pix:], text(size: 7.5pt, font: "monospace", weight: "bold")[#get_val("cedenteChavePix", "Chave Pix do Cedente")],
      )
    ]
  ]
]

1.5.30. Havendo impedimento para repasse integral, a ASPPIBRA comunicará a parte e repassará a parcela incontroversa.

1.5.31. *Da prestação de contas.* A ASPPIBRA manterá prestação de contas individualizada com valores recebidos, datas, retenções, despesas e repasses.

1.5.32. A prestação de contas poderá ser apresentada por meio físico ou eletrônico/relatório financeiro.

1.5.33. *Da responsabilidade.* A ASPPIBRA responde por dolo ou culpa comprovada no exercício de suas atribuições administrativas.

1.5.34. A ASPPIBRA não garante resultado de procedimentos que dependam de autoridade pública, serventia ou terceiros.

1.5.35. A ASPPIBRA observará normas de integridade, transparência e prevenção de conflitos de interesse.

1.5.36. O tratamento de dados pessoais pela ASPPIBRA observará estritamente a Lei nº 13.709/2018 (LGPD).

1.5.37. *Da suspensão excepcional.* Em caso de inconsistência grave, suspeita objetiva de fraude ou ordem de autoridade, a cobrança ou repasse poderá ser temporariamente suspenso para saneamento.

1.5.38. Em caso de encerramento da atuação, a ASPPIBRA prestará contas finais e repassará valores incontroversos.

1.5.39. O encerramento não afasta o dever de prestar contas do período administrado.

1.5.40. Alteração de dados bancários deverá ser comunicada formalmente por escrito.

1.5.41. *Da autenticação institucional.* A autenticação eletrônica interna da ASPPIBRA destina-se ao controle e rastreabilidade institucional, não equivalendo a reconhecimento notarial de firma ou registro imobiliário.

1.5.42. A atuação da ASPPIBRA observará seus estatutos e deliberações de governança.

1.5.43. Esta cláusula não substitui procurações específicas eventualmente exigidas por órgãos públicos ou cartórios.

1.5.44. As partes concordam com a intervenção mandatária da ASPPIBRA para administração do fluxo financeiro.

1.5.45. A intervenção da ASPPIBRA não transfere à associação o imóvel ou a responsabilidade material principal entre CEDENTE e CESSIONÁRIO.

// ====================================================================
// CAPÍTULO II – DAS DECLARAÇÕES PRELIMINARES
// ====================================================================
#section_heading("CAPÍTULO II – DAS DECLARAÇÕES PRELIMINARES")

2.1. O CEDENTE declara exercer sobre o IMÓVEL descrito no Capítulo III posse pública, contínua e pacífica, segundo seu conhecimento efetivo e elementos documentais disponíveis.

2.1.1. O CEDENTE declara que, até a assinatura, não tem conhecimento de oposição formal ou disputa de terceiro que impeça a posse cedida.

2.1.2. A declaração é prestada com base no conhecimento efetivo do CEDENTE, não constituindo garantia absoluta contra pretensões não comunicadas de terceiros.

2.1.3. A identificação posterior de terceiro não caracteriza, por si só, falsidade do CEDENTE, salvo se demonstrada ciência prévia e omissão dolosa.

2.2. O IMÓVEL possui matrícula individualizada perante o Cartório de Registro de Imóveis competente sob o nº #get_val("numeroMatriculaImovel", "Matrícula do Imóvel"), e inscrição municipal no IPTU sob o nº #get_val("inscricaoMunicipalIptu", "Inscrição IPTU"). O CEDENTE não é titular do domínio registral, transmitindo exclusivamente os direitos possessórios, cuja eventual titulação definitiva observará o Capítulo IV.

2.3. O CEDENTE declara que não cedeu, prometeu ceder ou onerou a posse do imóvel a terceiro além do CESSIONÁRIO.

2.4. O CEDENTE declara, conforme seu conhecimento, que o imóvel não se localiza em área de preservação permanente ou de risco geológico não informado, ressalvadas as restrições urbanísticas aplicáveis: #get_val("restricoesUrbanisticas", "Zoneamento regular municipal").

2.5. *Natureza jurídica:* as partes declaram que o presente negócio tem por objeto exclusivo a cessão onerosa de direitos possessórios, não configurando compra e venda imobiliária translativa de domínio do art. 108 do Código Civil.

2.6. *Do loteamento:* o imóvel integra loteamento aprovado e registrado em conformidade com a Lei nº 6.766/1979, não sendo o CEDENTE o loteador original.

2.7. *Da situação fiscal:* os débitos tributários municipais incidentes sobre o imóvel até a data de imissão na posse são de responsabilidade exclusiva do CEDENTE:

#align(center)[
  #block(width: 95%, stroke: 0.8pt + rgb("#111827"), radius: 3pt)[
    #rect(fill: rgb("#F3F4F6"), width: 100%, inset: (y: 4pt), stroke: (bottom: 0.8pt + rgb("#111827")))[
      #align(center)[#text(weight: "bold", size: 8pt, fill: rgb("#111827"))[QUADRO-RESUMO – SITUAÇÃO FISCAL E DÉBITOS DE IPTU DO IMÓVEL]]
    ]
    #pad(x: 10pt, y: 6pt)[
      #grid(
        columns: (1.2fr, 2fr),
        row-gutter: 4pt,
        text(weight: "bold", size: 7.5pt)[Contribuinte / Titular Cadastral:], text(size: 7.5pt)[#get_val("nomeTitularCadastral", "Titular Cadastral")],
        text(weight: "bold", size: 7.5pt)[Exercícios / Anos Vencidos:], text(size: 7.5pt)[#get_val("exerciciosAnosVencidos", "Exercícios anteriores à posse")],
        text(weight: "bold", size: 7.5pt)[Valor Estimado da Dívida:], text(size: 7.5pt)[R\$ #get_val("valorTotalDivida", "0,00")],
        text(weight: "bold", size: 7.5pt)[Responsabilidade de Quitação:], text(size: 7.5pt, weight: "bold")[Exclusiva do CEDENTE (Cláusulas 5.6 e 5.7)],
      )
    ]
  ]
]

2.7.2. Havendo execução fiscal em curso relativa a débitos anteriores, a quitação observará os abatimentos do preço previstos no Capítulo V.

2.8. O CEDENTE prestará informações quanto à eventual existência de inventário ou herdeiros do titular registral, cooperando com as notificações cabíveis.

// ====================================================================
// CAPÍTULO III – DO OBJETO
// ====================================================================
#section_heading("CAPÍTULO III – DO OBJETO")

3.1. O imóvel objeto da presente cessão de posse é o seguinte:

#align(center)[
  #block(width: 95%, stroke: 0.8pt + rgb("#111827"), radius: 3pt)[
    #rect(fill: rgb("#F3F4F6"), width: 100%, inset: (y: 4pt), stroke: (bottom: 0.8pt + rgb("#111827")))[
      #align(center)[#text(weight: "bold", size: 8pt, fill: rgb("#111827"))[IDENTIFICAÇÃO DETALHADA DO IMÓVEL OBJETO DA CESSÃO]]
    ]
    #pad(x: 10pt, y: 6pt)[
      #grid(
        columns: (1fr, 2fr),
        row-gutter: 4pt,
        text(weight: "bold", size: 7.5pt)[Identificação:], text(size: 7.5pt)[#get_val("identificacaoLoteImovel", "Lote individualizado")],
        text(weight: "bold", size: 7.5pt)[Lote e Quadra:], text(size: 7.5pt)[Lote: #get_val("numeroLote", "01") | Quadra: #get_val("quadraLote", "A")],
        text(weight: "bold", size: 7.5pt)[Logradouro e Localização:], text(size: 7.5pt)[#get_val("logradouroImovel", "Endereço completo do lote")],
        text(weight: "bold", size: 7.5pt)[Município / UF:], text(size: 7.5pt)[#get_val("municipioUfImovel", "Município/UF")],
        text(weight: "bold", size: 7.5pt)[Área Total:], text(size: 7.5pt)[#get_val("areaTotalImovel", "360,00 m²")],
        text(weight: "bold", size: 7.5pt)[Matrícula / Cartório:], text(size: 7.5pt)[#get_val("matriculaRegistroImovel", "Registro de Imóveis")],
        text(weight: "bold", size: 7.5pt)[Confrontações e Limites:], text(size: 7.5pt)[#get_val("confrontacoesImovel", "Conforme memorial descritivo")],
      )
    ]
  ]
]

3.2. O CEDENTE transfere ao CESSIONÁRIO a totalidade da posse, direitos e ações sobre o imóvel, respondendo pela evicção nos termos do Código Civil e da Cláusula 11.1.

3.3. O CESSIONÁRIO declara ter vistoriado o imóvel e ter ciência de sua situação fática e documental.

3.4. O CEDENTE declara que a posse está livre de gravames ou cessões concorrentes a terceiros.

3.5. Em caso de múltiplos adquirentes, as frações e proporções obedecerão a quadro anexo individualizado.

// ====================================================================
// CAPÍTULO IV – DA ORIGEM DA POSSE E REGULARIZAÇÃO FUNDIÁRIA
// ====================================================================
#section_heading("CAPÍTULO IV – DA ORIGEM DA POSSE, CADEIA POSSESSÓRIA E REGULARIZAÇÃO FUNDIÁRIA")

4.1. O CEDENTE declara exercer posse mansa e contínua desde #get_val("dataInicioPosseDeclarada", "data de início da posse").

4.2. A presente cessão formaliza os direitos possessórios e não substitui os atos notariais e registrais da usucapião ou REURB.

4.3. A regularização fundiária e titulação serão buscadas pelas vias legais pertinentes (REURB - Lei 13.465/2017, Usucapião Extrajudicial - art. 216-A da LRP ou judicial).

4.4. Cabendo usucapião extrajudicial, as partes cooperarão com a instrução notarial e documental.

4.5. Cabendo REURB, as partes cooperarão com os procedimentos administrativos do Município.

4.6. As diligências preparatórias poderão ser iniciadas antes da quitação integral do preço.

4.7. A condução dos procedimentos não configura garantia de deferimento por órgãos públicos.

4.8. Eventual indeferimento definitivo observará a apuração de responsabilidades deste contrato.

4.9. Concluída a regularização registral definitiva com abertura de matrícula em nome do adquirente, encerram-se os efeitos possessórios deste instrumento.

// ====================================================================
// CAPÍTULO V – DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO
// ====================================================================
#section_heading("CAPÍTULO V – DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO")

5.1. O preço total ajustado para a cessão integral dos direitos possessórios é de *R\$ #get_val("valorTotalPreco", "180.000,00")* (#get_val("valorTotalPrecoExtenso", "cento e oitenta mil reais")).

5.2. Em caso de pluralidade de cessionários, a responsabilidade financeira é proporcional à fração adquirida.

5.3. O preço constitui a contraprestação da posse, não abrangendo despesas atribuídas expressamente a cada parte.

5.4. Despesas técnicas preparatórias e documentais de regularização serão suportadas pelo CEDENTE.

5.5. Custas e emolumentos finais de registro perante o Cartório de Imóveis serão suportados pelo CESSIONÁRIO.

5.6. Débitos tributários anteriores à posse serão quitados pelo CEDENTE com recursos do preço ou parcelamento regular.

5.7. Sendo parcelada a dívida anterior, o CEDENTE manterá as parcelas em dia, podendo o CESSIONÁRIO quitar diretamente e abater do saldo em caso de mora do CEDENTE.

// ====================================================================
// CAPÍTULO VI – DA FORMA DE PAGAMENTO E COMPROVAÇÃO
// ====================================================================
#section_heading("CAPÍTULO VI – DA FORMA DE PAGAMENTO E COMPROVAÇÃO")

6.1. O preço será liquidado na forma administrada pela ASPPIBRA conforme o seguinte cronograma consolidado:

#align(center)[
  #block(width: 95%, stroke: 0.8pt + rgb("#111827"), radius: 3pt)[
    #rect(fill: rgb("#F3F4F6"), width: 100%, inset: (y: 4pt), stroke: (bottom: 0.8pt + rgb("#111827")))[
      #align(center)[#text(weight: "bold", size: 8pt, fill: rgb("#111827"))[QUADRO-RESUMO – FLUXO FINANCEIRO DO PREÇO]]
    ]
    #pad(x: 10pt, y: 6pt)[
      #grid(
        columns: (1.2fr, 1fr, 1.8fr),
        row-gutter: 4pt,
        text(weight: "bold", size: 7.5pt)[Item], text(weight: "bold", size: 7.5pt)[Valor (R\$)], text(weight: "bold", size: 7.5pt)[Condição / Vencimento],
        text(size: 7.5pt)[Preço Total da Cessão:], text(size: 7.5pt, weight: "bold")[R\$ #get_val("valorTotalPreco", "180.000,00")], text(size: 7.5pt)[Valor global da cessão (Cláusula 5.1)],
        text(size: 7.5pt)[Entrada / Sinal:], text(size: 7.5pt, weight: "bold")[R\$ #get_val("valorEntradaAto", "25.000,00")], text(size: 7.5pt)[No ato da assinatura (#get_val("dataPagamentoAssinatura", "à vista"))],
        text(size: 7.5pt)[Saldo Financiado:], text(size: 7.5pt, weight: "bold")[R\$ #get_val("valorSaldoRemanescente", "155.000,00")], text(size: 7.5pt)[Em #get_val("numeroCiclos", "28") ciclos quadrimestrais],
        text(size: 7.5pt)[Parcelas Mensais:], text(size: 7.5pt)[R\$ #get_val("valorParcelaMes1Ciclo", "1.000,00") /mês], text(size: 7.5pt)[Meses 1, 2 e 3 de cada ciclo],
        text(size: 7.5pt)[Reforço Quadrimestral:], text(size: 7.5pt)[R\$ #get_val("valorReforcoMes4Ciclo", "2.500,00")], text(size: 7.5pt)[Mês 4 de cada ciclo (reforço)],
        text(size: 7.5pt)[Ajuste Residual:], text(size: 7.5pt)[R\$ #get_val("valorParcelaResidualFinal", "1.000,00")], text(size: 7.5pt)[No 113º mês (quitação final)],
      )
    ]
  ]
]

6.2. A entrada constitui amortização direta do preço, não possuindo natureza de arras penitenciais.

6.3. É facultada a amortização antecipada a qualquer momento sem penalidades.

6.4. Em caso de pluralidade, o rateio observará estritamente a participação de cada adquirente.

6.5. Os pagamentos serão realizados na conta operacional da ASPPIBRA e comprovados por recibo bancário oficial.

// ====================================================================
// CAPÍTULO VII – DAS OBRIGAÇÕES TRIBUTÁRIAS, MUNICIPAIS E REGISTRAIS
// ====================================================================
#section_heading("CAPÍTULO VII – DAS OBRIGAÇÕES TRIBUTÁRIAS, MUNICIPAIS, NOTARIAIS E REGISTRAIS")

7.1. Até a imissão na posse, todos os tributos e encargos pretéritos são de responsabilidade do CEDENTE.

7.2. A partir da imissão na posse, tributos e encargos futuros correm por conta do CESSIONÁRIO.

7.3. Despesas técnicas e notariais de regularização possessória cabem ao CEDENTE.

7.4. Emolumentos finais do Registro de Imóveis cabem ao CESSIONÁRIO.

#align(center)[
  #block(width: 95%, stroke: 0.8pt + rgb("#111827"), radius: 3pt)[
    #rect(fill: rgb("#F3F4F6"), width: 100%, inset: (y: 4pt), stroke: (bottom: 0.8pt + rgb("#111827")))[
      #align(center)[#text(weight: "bold", size: 8pt, fill: rgb("#111827"))[QUADRO-RESUMO – MATRIZ DE REPARTIÇÃO DE OBRIGAÇÕES E CUSTOS]]
    ]
    #pad(x: 10pt, y: 6pt)[
      #grid(
        columns: (1.5fr, 1fr, 1.5fr),
        row-gutter: 4pt,
        text(weight: "bold", size: 7.5pt)[Obrigação], text(weight: "bold", size: 7.5pt)[Responsável], text(weight: "bold", size: 7.5pt)[Aplicação],
        text(size: 7.5pt)[IPTU e Taxas Anteriores à Posse:], text(size: 7.5pt, weight: "bold")[CEDENTE], text(size: 7.5pt)[Fatos geradores pretéritos (Cl. 7.1)],
        text(size: 7.5pt)[Despesas Notariais de Regularização:], text(size: 7.5pt, weight: "bold")[CEDENTE], text(size: 7.5pt)[Atas e instrução técnica (Cl. 7.3)],
        text(size: 7.5pt)[IPTU e Encargos Posteriores à Posse:], text(size: 7.5pt, weight: "bold")[CESSIONÁRIO], text(size: 7.5pt)[A partir da imissão física (Cl. 7.2)],
        text(size: 7.5pt)[Custas Finais de Registro (RGI):], text(size: 7.5pt, weight: "bold")[CESSIONÁRIO], text(size: 7.5pt)[Na abertura da matrícula definitiva (Cl. 7.4)],
      )
    ]
  ]
]

7.5. O CEDENTE fornecerá certidões fiscais e pessoais pertinentes.

7.6. Pagamentos efetuados pelo adquirente para saldar dívidas do cedente poderão ser compensados no saldo.

7.7. Aplica-se a regra de especialidade em caso de aparente concorrência de previsões.

// ====================================================================
// CAPÍTULO VIII – DA IMISSÃO NA POSSE E DAS BENFEITORIAS
// ====================================================================
#section_heading("CAPÍTULO VIII – DA IMISSÃO NA POSSE E DAS BENFEITORIAS")

8.1. A imissão na posse ocorrerá após a assinatura deste contrato e confirmação da entrada.

8.2. Em caso de resolução, haverá indenização por benfeitorias necessárias e úteis na forma do Código Civil.

8.3. Benfeitorias voluptuárias poderão ser levantadas sem prejuízo ou dano à coisa.

8.4. Construções e edificações correrão por conta do adquirente perante as exigências e licenças da Prefeitura Municipal.

// ====================================================================
// CAPÍTULO IX – DO INADIMPLEMENTO, JUROS E MULTA
// ====================================================================
#section_heading("CAPÍTULO IX – DO INADIMPLEMENTO, JUROS E MULTA")

9.1. O atraso no pagamento sujeitará a parcela aos seguintes encargos moratórios:
- a) Correção monetária pelo IPCA/IBGE;
- b) Juros moratórios de 1% (um por cento) ao mês pro rata die;
- c) Multa moratória de 2% (dois por cento) sobre a parcela vencida.

9.2. A mora será purgada no prazo de 15 (quinze) dias corridos após notificação formal.

9.3. *Gatilho Resolutório:* A resolução por inadimplemento financeiro somente ocorrerá após *3 (três) parcelas vencidas e não purgadas*, consecutivas ou não.

9.4. É vedada a cumulação de encargos com idêntica finalidade indenizatória.

9.5. Recebimento de valores em atraso sem quitação expressa não implica renúncia.

9.6. Eventual atraso do CEDENTE em obrigação líquida observará os mesmos critérios de correção e juros.

// ====================================================================
// CAPÍTULO X – DA RESOLUÇÃO, DO DISTRATO E CONSEQUÊNCIAS
// ====================================================================
#section_heading("CAPÍTULO X – DA RESOLUÇÃO, DO DISTRATO E DE SUAS CONSEQUÊNCIAS")

10.1. São causas de resolução: o inadimplemento de 3 parcelas não sanadas, descumprimento essencial não sanado em 30 dias, fraude comprovada ou perda da posse.

10.2.1. *Cláusula Penal Compensatória:* Em caso de resolução por culpa do adquirente, o CEDENTE poderá reter 20% (vinte por cento) dos valores pagos a título de prefixação de perdas e danos.

10.2.2. O saldo de 80% (oitenta por cento) constitui crédito restitutível do adquirente.

10.2.3. O imóvel será reinserido no mercado e, independentemente de nova alienação, *o saldo será integralmente pago no prazo máximo de 12 (doze) meses* da restituição da posse.

10.3. Em caso de dolo, fraude ou cessão duplicada do CEDENTE, haverá restituição integral corrigida e multa penal de 10% (dez por cento) do valor do contrato.

10.4. O credor poderá alternativamente executar as obrigações líquidas pela via judicial.

10.5. Compensações observarão estritamente a comprovação documental, vedada a duplicidade.

// ====================================================================
// CAPÍTULO XI – DA EVICÇÃO E GARANTIAS POSSESSÓRIAS
// ====================================================================
#section_heading("CAPÍTULO XI – DA EVICÇÃO, DA PERDA DA POSSE E DA VERACIDADE DAS DECLARAÇÕES")

11.1. O CEDENTE responde pela higidez e veracidade da posse transferida, respeitados os limites e a boa-fé objetiva.

11.2. Aplica-se o regime da evicção dos arts. 447 a 457 do Código Civil conforme a natureza possessória da relação.

11.3. As partes deverão cooperar na mitigação de prejuízos e preservação dos direitos possessórios.

11.4. O CEDENTE responde pela exatidão das declarações prestadas no negócio.

11.5. As disposições observam a função social, probidade e vedação ao enriquecimento sem causa.

// ====================================================================
// CAPÍTULO XII – DO CASO FORTUITO E DA FORÇA MAIOR
// ====================================================================
#section_heading("CAPÍTULO XII – DO CASO FORTUITO E DA FORÇA MAIOR")

12.1. Nenhuma parte responde por prejuízos decorrentes de fato necessário e inevitável (art. 393 do Código Civil).

12.2. Verificado o evento, os prazos ficarão suspensos mediante notificação em até 10 dias.

// ====================================================================
// CAPÍTULO XIII – DA PROTEÇÃO DE DADOS PESSOAIS (LGPD)
// ====================================================================
#section_heading("CAPÍTULO XIII – DA PROTEÇÃO DE DADOS PESSOAIS")

13.1. O tratamento dos dados pessoais observa estritamente a Lei nº 13.709/2018 para fins de execução contratual.

13.2. As partes manterão sigilo e proteção adequada sobre os dados recebidos.

13.3. Cada parte responderá pelo tratamento nas finalidades pertinentes ao negócio.

13.4. Os titulares poderão exercer seus direitos legais perante o responsável.

// ====================================================================
// CAPÍTULO XIV – DA MEDIAÇÃO, DA ARBITRAGEM E DO FORO
// ====================================================================
#section_heading("CAPÍTULO XIV – DA MEDIAÇÃO, DA ARBITRAGEM E DO FORO")

14.1. As controvérsias poderão ser submetidas prioritariamente à mediação no prazo de 30 dias.

14.2. É facultada a instituição de câmara arbitral mediante compromisso específico.

14.3. *Foro de Eleição:* Fica eleito o foro da Comarca de localização do imóvel para dirimir as questões oriundas deste contrato, com renúncia a qualquer outro.

// ====================================================================
// CAPÍTULO XV – DAS CUSTAS E HONORÁRIOS EM LITÍGIO
// ====================================================================
#section_heading("CAPÍTULO XV – DAS CUSTAS E HONORÁRIOS EM CASO DE LITÍGIO")

15.1. As custas e honorários sucumbenciais serão suportados pela parte vencida nos termos da lei processual civil.

// ====================================================================
// CAPÍTULO XVI – DA ASSINATURA ELETRÔNICA E CADASTRO
// ====================================================================
#section_heading("CAPÍTULO XVI – DA ASSINATURA ELETRÔNICA E DA ATUALIZAÇÃO CADASTRAL")

16.1. As partes reconhecem a plena eficácia da assinatura eletrônica (MP 2.200-2/2001 e Lei 14.063/2020).

16.2. São válidas assinaturas simples, avançadas ou qualificadas ICP-Brasil.

16.3. As partes comparecerão em cartório se exigida solenidade adicional por terceiros ou serventias.

16.4. Os contratantes obrigam-se a manter dados cadastrais e endereços permanentemente atualizados.

16.5. Notificações por e-mail ou WhatsApp serão válidas com a comprovação do envio ou leitura.

16.6. A falta de atualização cadastral impede a alegação de desconhecimento das notificações enviadas.

// ====================================================================
// CAPÍTULO XVII – DISPOSIÇÕES GERAIS
// ====================================================================
#section_heading("CAPÍTULO XVII – DISPOSIÇÕES GERAIS")

17.1. O contrato vigora até a liquidação de todas as obrigações pactuadas, subsistindo as cláusulas que por natureza devam perdurar.

17.2. Aplica-se o dever mútuo de lealdade, cooperação e transparência.

17.3. As cláusulas de destaque vinculam as partes conforme a intenção declarada.

17.4. O contrato obriga as partes e seus sucessores legais a qualquer título.

17.5. Aditivos e alterações contratuais exigem forma escrita firmada por todas as partes.

17.6. A mera tolerância não constitui renúncia de direitos ou novação.

17.7. A nulidade de cláusula isolada não prejudica a eficácia das demais disposições.

17.8. Integram o contrato os Anexos I (regime de bens), II (documentação fiscal/imobiliária), III (cadeia possessória) e IV (regularização).

17.9. O contrato poderá ser assinado física ou eletronicamente na presença de testemunhas instrumentárias.

17.10. O registro em Títulos e Documentos poderá ser realizado para fins de conservação e eficácia perante terceiros.

#v(14pt)

// DATA E LOCAL
#align(center)[
  #text(weight: "bold", size: 8.5pt)[
    #get_val("municipioAssinatura", "Brasília - DF"), #get_val("diaAssinatura", "20") de #get_val("mesAssinatura", "outubro") de #get_val("anoAssinatura", "2026").
  ]
]

#v(14pt)

// BLOCO DE ASSINATURAS E VALIDAÇÃO DIGITAL
#section_heading("ASSINATURAS E VALIDAÇÃO DIGITAL")

#v(6pt)

#block(width: 100%, breakable: false)[
  #grid(
    columns: (1fr, 1fr),
    column-gutter: 20pt,
    row-gutter: 22pt,
    [
      #line(length: 95%, stroke: 0.8pt + rgb("#111827"))
      #text(weight: "bold", size: 8pt)[CEDENTE: ] #text(size: 8pt)[#get_val("cedenteNome", "NOME COMPLETO DO CEDENTE")] \
      #text(size: 7pt, fill: rgb("#6B7280"))[CPF: #get_val("cedenteCpf", "000.000.000-00")]
    ],
    [
      #line(length: 95%, stroke: 0.8pt + rgb("#111827"))
      #text(weight: "bold", size: 8pt)[CESSIONÁRIO(A): ] #text(size: 8pt)[#get_val("cessionarioNome", "NOME DO CESSIONÁRIO")] \
      #text(size: 7pt, fill: rgb("#6B7280"))[CPF: #get_val("cessionarioCpf", "000.000.000-00")]
    ],
    [
      #line(length: 95%, stroke: 0.8pt + rgb("#111827"))
      #text(weight: "bold", size: 8pt)[CÔNJUGE DO CEDENTE (ANUENTE)] \
      #text(size: 7pt, fill: rgb("#6B7280"))[CPF: #get_val("conjugeCpf", "000.000.000-00")]
    ],
    [
      #line(length: 95%, stroke: 0.8pt + rgb("#111827"))
      #text(weight: "bold", size: 8pt)[INTERVENIENTE ASPPIBRA (ADMINISTRADORA)] \
      #text(size: 7pt, fill: rgb("#6B7280"))[CNPJ: 26.325.396/0001-30]
    ]
  )
]

#v(14pt)

// TESTEMUNHAS INSTRUMENTÁRIAS
#section_heading("TESTEMUNHAS INSTRUMENTÁRIAS")

#v(6pt)

#block(width: 100%, breakable: false)[
  #grid(
    columns: (1fr, 1fr, 1fr),
    column-gutter: 14pt,
    [
      #line(length: 100%, stroke: 0.8pt + rgb("#6B7280"))
      #text(weight: "bold", size: 7.5pt)[1ª Testemunha:] \
      #text(size: 7pt)[Nome: #get_val("testemunha1Nome", "____________________")] \
      #text(size: 7pt, fill: rgb("#6B7280"))[CPF: #get_val("testemunha1Cpf", "000.000.000-00")]
    ],
    [
      #line(length: 100%, stroke: 0.8pt + rgb("#6B7280"))
      #text(weight: "bold", size: 7.5pt)[2ª Testemunha:] \
      #text(size: 7pt)[Nome: #get_val("testemunha2Nome", "____________________")] \
      #text(size: 7pt, fill: rgb("#6B7280"))[CPF: #get_val("testemunha2Cpf", "000.000.000-00")]
    ],
    [
      #line(length: 100%, stroke: 0.8pt + rgb("#6B7280"))
      #text(weight: "bold", size: 7.5pt)[3ª Testemunha:] \
      #text(size: 7pt)[Nome: #get_val("testemunha3Nome", "____________________")] \
      #text(size: 7pt, fill: rgb("#6B7280"))[CPF: #get_val("testemunha3Cpf", "000.000.000-00")]
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
          #text(size: 6.5pt, fill: rgb("#4B5563"))[Autenticação digital sob a Lei Federal nº 14.063/2020 e protocolo criptográfico com carimbo do tempo.] \
          #text(size: 6.5pt, font: "monospace", fill: rgb("#111827"))[Protocolo: ASPPIBRA-DOC-#{auth_code}-SECURE]
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
