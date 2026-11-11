// ============================================================================
// ASPPIBRA DAO - CONTRATO PARTICULAR DE CESSÃO DE DIREITOS POSSESSÓRIOS
// E OUTRAS AVENÇAS (MODELO CANÔNICO ABNT NBR 14724 / GOVERNANÇA DAO)
// ============================================================================

#import "asppibra_layout.typ": *

// Leitura segura do payload JSON injetado via sys.inputs.data
#let raw_input = if "data" in sys.inputs {
  json(bytes(sys.inputs.data))
} else {
  (:)
}

// Extração estrita de metadados de documento (sem fallbacks fictícios)
#let doc_number = if "document_number" in raw_input and raw_input.document_number != none {
  str(raw_input.document_number).trim()
} else {
  none
}

#let auth_code = if "auth_code" in raw_input and raw_input.auth_code != none {
  str(raw_input.auth_code).trim()
} else {
  none
}

#assert(
  doc_number != none and doc_number != "",
  message: "contrato_cessao_posse.typ: document_number obrigatório ausente ou vazio no payload.",
)
#assert(
  auth_code != none and auth_code != "",
  message: "contrato_cessao_posse.typ: auth_code obrigatório ausente ou vazio no payload.",
)

#let contract_data = if "data" in raw_input and type(raw_input.data) == dictionary {
  raw_input.data
} else {
  raw_input
}

// Helper local para buscar valor no dicionário do contrato e renderizar tag
#let get_val(key, label) = {
  let val = contract_data.at(key, default: none)
  asppibra_tag(label, val)
}

// Configuração Global do Documento e Geometria ABNT
#set document(
  title: "Contrato Particular de Cessão de Direitos Possessórios - " + doc_number,
  author: asppibra_razao_social,
  keywords: ("Cessão de Posse", "ASPPIBRA", "Regularização Fundiária", "Direitos Possessórios"),
)

#set page(
  paper: standard_paper,
  margin: margins_institutional_contract,
  header: context {
    let i = counter(page).get().first()
    if i > 1 {
      asppibra_header_running(
        doc_number: doc_number,
        doc_title: "Instrumento Particular de Cessão de Direitos Possessórios",
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

#set par(
  leading: leading_body,
  first-line-indent: first_line_indent_abnt,
  justify: true,
)

// Cabeçalho Institucional da 1ª Página
#asppibra_header_first_page(doc_number: doc_number)

#v(8pt)

#let is_blank_sheet = if type(contract_data) == dictionary and "is_blank_sheet" in contract_data and contract_data.is_blank_sheet == true {
  true
} else if "is_blank_sheet" in raw_input and raw_input.is_blank_sheet == true {
  true
} else {
  false
}

#if is_blank_sheet [
  #block(width: 100%, above: 4pt, below: 12pt)[
    #set par(first-line-indent: 0pt)
    #align(center)[
      #text(size: font_size_heading, weight: "bold", fill: color_primary)[
        #contract_data.at("sheet_title", default: "FOLHA A4 ABNT INSTITUCIONAL (CANÔNICA)")
      ] \
      #v(3pt)
      #text(size: font_size_subtitle, fill: color_secondary_text)[
        Padrão Canônico ABNT NBR 14724 • Infraestrutura Documental ASPPIBRA-DAO
      ]
    ]
  ]

  #v(8pt)

  #block(
    width: 100%,
    stroke: 0.6pt + color_border,
    inset: 12pt,
    radius: 4pt,
    fill: color_bg_box,
  )[
    #text(weight: "bold", size: 9pt, fill: color_primary)[ESPECIFICAÇÕES DA GEOMETRIA DESTA FOLHA (ABNT NBR 14724)] \ \
    #grid(
      columns: (1fr, 1fr),
      row-gutter: 6pt,
      [#text(size: 8pt)[*Formato Físico:* A4 (210 × 297 mm)]],
      [#text(size: 8pt)[*Orientação:* Retrato (Portrait)]],
      [#text(size: 8pt)[*Margem Superior:* 2,5 cm]],
      [#text(size: 8pt)[*Margem Inferior:* 2,2 cm]],
      [#text(size: 8pt)[*Margem Esquerda:* 3,0 cm (Encadernação / Livro-Tombo)]],
      [#text(size: 8pt)[*Margem Direita:* 2,0 cm]],
    )
  ]

  #v(14pt)

  #text(weight: "bold", size: 9.5pt, fill: color_primary)[ÁREA ÚTIL DIAGRAMADA DA FOLHA]

  #v(6pt)

  #rect(
    width: 100%,
    height: 12.5cm,
    stroke: (paint: color_primary.lighten(40%), dash: "dashed", thickness: 1pt),
    radius: 4pt,
    fill: color_bg_box.lighten(70%),
  )[
    #align(center + horizon)[
      #stack(spacing: 8pt)[
        #text(size: 11pt, weight: "bold", fill: color_primary_text)[
          Área Livre para Redação Documental
        ]
        #text(size: 8.5pt, fill: luma(120))[
          (Espaço canônico reservado para inserção de cláusulas, deliberações e minutas oficiais)
        ]
        #v(6pt)
        #text(size: 7.5pt, font: font_family_mono, fill: luma(140))[
          Margens oficiais aplicadas • Recuo ABNT de 1,25 cm • Entrelinhas 1,5
        ]
      ]
    ]
  ]
] else [
  // Título Principal do Instrumento
  #block(width: 100%, above: 4pt, below: 12pt)[
    #set par(first-line-indent: 0pt)
    #align(center)[
      #text(size: font_size_heading, weight: "bold", fill: color_primary)[
        INSTRUMENTO PARTICULAR DE CESSÃO DE POSSE DE IMÓVEL
      ]
    ]
  ]

// ============================================================================
// CAPÍTULO I – DAS PARTES
// ============================================================================
#section_heading("CAPÍTULO I – DAS PARTES")

1.1. *CEDENTE:* #get_val("cedenteNome", "NOME COMPLETO DO CEDENTE"),
  #get_val("cedenteNacionalidade", "NACIONALIDADE"), maior e capaz,
  #get_val("cedenteEstadoCivil", "ESTADO CIVIL"),
  #get_val("cedenteProfissao", "PROFISSÃO"), portador(a) da Carteira de Identidade (RG) nº
  #get_val("cedenteRg", "NÚMERO DO RG"), órgão expedidor
  #get_val("cedenteRgOrgaoUf", "ÓRGÃO E UF"), inscrito(a) no CPF sob o nº
  #get_val("cedenteCpf", "NÚMERO DO CPF"), residente e domiciliado(a) na
  #get_val("cedenteEndereco", "ENDEREÇO COMPLETO COM CEP"), endereço eletrônico (e-mail):
  #get_val("cedenteEmail", "E-MAIL DO CEDENTE") e telefone/WhatsApp:
  #get_val("cedenteTelefone", "TELEFONE COM DDD"), doravante denominado(a) simplesmente *CEDENTE*.

1.2. *CÔNJUGE / COMPANHEIRO(A) DO CEDENTE:* #get_val("conjugeNome", "NOME COMPLETO DO CÔNJUGE/COMPANHEIRO(A)"),
  #get_val("conjugeNacionalidade", "NACIONALIDADE"), maior e capaz,
  #get_val("conjugeEstadoCivil", "ESTADO CIVIL"),
  #get_val("conjugeProfissao", "PROFISSÃO"), portador(a) da Carteira de Identidade (RG) nº
  #get_val("conjugeRg", "NÚMERO DO RG"), órgão expedidor
  #get_val("conjugeRgOrgaoUf", "ÓRGÃO E UF"), inscrito(a) no CPF/MF sob o nº
  #get_val("conjugeCpf", "NÚMERO DO CPF"), residente e domiciliado(a) na
  #get_val("conjugeEndereco", "ENDEREÇO COMPLETO COM CEP"), endereço eletrônico (e-mail):
  #get_val("conjugeEmail", "E-MAIL DO CÔNJUGE") e telefone/WhatsApp:
  #get_val("conjugeTelefone", "TELEFONE COM DDD"), na qualidade de
  #get_val("conjugeQualidade", "OUTORGANTE UXÓRIO / MARITAL / ANUENTE").

1.3. *CESSIONÁRIO(A):* #get_val("cessionarioNome", "NOME DO CESSIONÁRIO"),
  #get_val("cessionarioNacionalidade", "NACIONALIDADE"), maior e capaz,
  #get_val("cessionarioEstadoCivil", "ESTADO CIVIL"),
  #get_val("cessionarioProfissao", "PROFISSÃO"), portador(a) da Carteira de Identidade (RG) nº
  #get_val("cessionarioRg", "RG DO CESSIONÁRIO"), órgão expedidor
  #get_val("cessionarioRgOrgaoUf", "ÓRGÃO E UF DO CESSIONÁRIO"), inscrito(a) no CPF sob o nº
  #get_val("cessionarioCpf", "CPF DO CESSIONÁRIO"), residente e domiciliado(a) em
  #get_val("cessionarioEndereco", "ENDEREÇO COMPLETO DO CESSIONÁRIO, COM CEP"), e-mail
  #get_val("cessionarioEmail", "E-MAIL DO CESSIONÁRIO") e telefone/WhatsApp
  #get_val("cessionarioTelefone", "TELEFONE DO CESSIONÁRIO"), doravante denominado(a) simplesmente *CESSIONÁRIO(A)*.

1.4. Em caso de pluralidade de cessionários, estes serão doravante denominados em conjunto *CESSIONÁRIOS*, respondendo cada um individualmente pela parte do imóvel que lhe for especificamente cedida nos termos do Capítulo III, sem solidariedade entre si quanto às obrigações de pagamento relativas à parte de outrem, salvo disposição expressa em contrário, ressalvada a hipótese de cessionários unidos entre si por casamento ou união estável sob regime de bens que implique comunhão, caso em que a responsabilidade pelas obrigações de pagamento observará as regras do respectivo regime de bens, independentemente da regra de ausência de solidariedade prevista nesta Cláusula.

1.4.1. Os percentuais de participação de cada CESSIONÁRIO deverão ser expressamente indicados em tabela anexa a este instrumento (Cláusula 3.5), com a especificação, para cada CESSIONÁRIO, de sua fração de posse, de preço, de responsabilidade por benfeitorias e, quando cabível, de retenção ou devolução em caso de distrato, indicando-se ainda se as proporções são aplicáveis igualmente aos dois lotes ou de forma distinta a cada um.

1.5. *DA ASPPIBRA – ADMINISTRAÇÃO CONTRATUAL, COORDENAÇÃO OPERACIONAL, COBRANÇA, RECEBIMENTO E REPASSE*

*1.5.1. Da condição e finalidade de atuação.* A *#asppibra_razao_social*, pessoa jurídica de direito privado constituída sob a forma de associação civil sem fins lucrativos, inscrita no CNPJ sob o nº #asppibra_cnpj, com sede em #get_val("asppibraEnderecoSede", "ENDEREÇO COMPLETO DA SEDE DA ASPPIBRA, COM CEP"), neste ato representada na forma de seu Estatuto Social por #get_val("asppibraRepresentanteNome", "NOME COMPLETO DO REPRESENTANTE LEGAL DA ASPPIBRA"), #get_val("asppibraRepresentanteCargo", "CARGO/FUNÇÃO ESTATUTÁRIA"), #get_val("asppibraRepresentanteNacionalidade", "NACIONALIDADE"), #get_val("asppibraRepresentanteEstadoCivil", "ESTADO CIVIL"), portador(a) da Carteira de Identidade (RG) nº #get_val("asppibraRepresentanteRg", "RG DO REPRESENTANTE LEGAL"), órgão expedidor #get_val("asppibraRepresentanteRgOrgaoUf", "ÓRGÃO E UF DO REPRESENTANTE"), inscrito(a) no CPF sob o nº #get_val("asppibraRepresentanteCpf", "CPF DO REPRESENTANTE LEGAL"), cujos poderes de representação constam de #get_val("asppibraDocumentoPoderes", "ATA DE ELEIÇÃO/PROCURAÇÃO Nº DOCUMENTO DE PODERES"), doravante denominada “*ASPPIBRA*”, intervém neste instrumento na qualidade de *INTERVENIENTE ADMINISTRADORA, COORDENADORA OPERACIONAL E MANDATÁRIA CONTRATUAL*, nos limites deste instrumento, de seu Estatuto Social e da legislação aplicável.

1.5.2. A atuação da ASPPIBRA compreende a administração operacional deste contrato, a coordenação das providências administrativas relacionadas à sua execução, a organização documental, o acompanhamento dos procedimentos de regularização fundiária e registral, a articulação entre as partes e os profissionais envolvidos e a administração operacional do fluxo de pagamentos, inclusive cobrança, recebimento, conciliação, retenções autorizadas, repasses e prestação de contas.

1.5.3. A ASPPIBRA não é CEDENTE, CESSIONÁRIA, titular dominial, possuidora ou garantidora da aquisição da propriedade ou de qualquer direito real sobre o imóvel, nem assume as obrigações materiais que este instrumento atribui diretamente às demais partes.

1.5.4. A presente intervenção não transfere à ASPPIBRA a titularidade econômica dos créditos pertencentes ao CEDENTE ou a qualquer outro titular expressamente indicado neste instrumento. Os valores que a ASPPIBRA receber em razão deste contrato, enquanto não constituírem remuneração ou despesa própria validamente exigível, serão recebidos *por conta e ordem do respectivo titular*.

*1.5.5. Dos poderes de administração.* Dentro dos limites deste instrumento, compete à ASPPIBRA: \
  a) organizar, receber, conferir formalmente e encaminhar documentos; \
  b) acompanhar protocolos, exigências, diligências, prazos e etapas administrativas; \
  c) promover a comunicação operacional entre as partes, profissionais e entidades envolvidas; \
  d) contratar, indicar, coordenar ou acompanhar profissionais legalmente habilitados, conforme a natureza de cada ato; \
  e) administrar operacionalmente as obrigações financeiras previstas neste instrumento; \
  f) praticar os atos administrativos necessários à execução regular do contrato, desde que não alterem direitos materiais das partes sem autorização específica.

1.5.6. A ASPPIBRA não poderá, sem autorização expressa das partes quando exigível, alterar o preço da cessão, conceder desconto ou remissão, renunciar a direitos, assumir obrigações novas em nome de qualquer parte ou alterar substancialmente este instrumento.

*1.5.7. Da contratação de profissionais e atuação jurídica.* A ASPPIBRA poderá contratar ou coordenar advogados, engenheiros, arquitetos, topógrafos, técnicos e outros profissionais legalmente habilitados necessários à execução do objeto.

1.5.8. A responsabilidade técnica, profissional e ética pelos atos próprios de profissão regulamentada permanecerá atribuída ao respectivo profissional habilitado que os praticar, sem prejuízo da responsabilidade da ASPPIBRA por seus próprios atos administrativos, nos termos deste instrumento e da legislação aplicável.

1.5.9. A ASPPIBRA não prestará, por si própria, serviços jurídicos privativos de advogado. A orientação jurídica individual, emissão de parecer, elaboração ou assinatura de peças privativas e representação judicial ou extrajudicial individual serão realizadas por advogado legalmente habilitado e constituído pelo interessado, mediante mandato próprio quando necessário.

1.5.10. A ASPPIBRA poderá exercer apoio administrativo, técnico e institucional em procedimentos de REURB, usucapião e regularização registral, inclusive perante órgãos públicos e serventias, observadas as competências legalmente atribuídas a cada agente e os requisitos do procedimento concreto.

*1.5.11. Da cobrança, mandato e recebimento.* O CEDENTE, na qualidade de titular dos créditos que lhe forem devidos em razão deste instrumento, autoriza e constitui a ASPPIBRA como sua *mandatária para administração operacional da cobrança, recebimento e posterior repasse*, nos limites aqui estabelecidos, reconhecendo o CESSIONÁRIO essa forma de pagamento.

1.5.12. Para execução do mandato, a ASPPIBRA poderá administrar cobranças por boleto bancário, Pix Cobrança, transferência bancária ou outros meios de pagamento admitidos, utilizando, quando necessário, instituição financeira, instituição de pagamento ou plataforma de cobrança regularmente habilitada.

1.5.13. A emissão, apresentação, identificação do beneficiário, liquidação e demais características dos boletos e instrumentos de pagamento deverão observar a legislação e a regulamentação aplicáveis, bem como as regras da instituição financeira ou de pagamento utilizada na operação.

*1.5.14. Da conta operacional da ASPPIBRA.* As partes autorizam expressamente que os valores decorrentes deste instrumento sejam pagos em *conta bancária de titularidade da ASPPIBRA, vinculada ao seu CNPJ e expressamente identificada neste instrumento*, destinada à arrecadação, administração e posterior repasse dos valores recebidos por conta e ordem dos respectivos titulares.

#block(breakable: false, width: 100%, above: 8pt, below: 10pt)[
  #set par(first-line-indent: 0pt)
  #table(
    columns: (35%, 65%),
    inset: 6pt,
    stroke: 0.5pt + color_border,
    fill: (x, y) => if y == 0 { color_bg_box } else { none },
    table.cell(colspan: 2)[#align(center)[#text(weight: "bold")[DADOS DA CONTA OPERACIONAL (ASPPIBRA)]]],
    [#text(weight: "bold")[Instituição / Banco]], [#get_val("asppibraBanco", "403 - CORA SCD")],
    [#text(weight: "bold")[Agência e Conta]], [Agência: #get_val("asppibraAgencia", "0001") | Conta: #get_val("asppibraConta", "6193441-3")],
    [#text(weight: "bold")[Titular e CNPJ]], [ASPPIBRA – Associação dos Proprietários e Posseiros de Imóveis no Brasil (CNPJ: 26.325.396/0001-30)],
    [#text(weight: "bold")[Chave Pix]], [#get_val("asppibraChavePix", "26.325.396/0001-30 (CNPJ)")],
  )
]

1.5.15. A indicação da conta da ASPPIBRA como conta de recebimento constitui elemento expresso deste contrato e autoriza o CESSIONÁRIO a efetuar nela os pagamentos previstos neste instrumento.

1.5.16. O recebimento dos valores pela ASPPIBRA não implica cessão, transferência ou aquisição do respectivo crédito, permanecendo o titular econômico do valor aquele expressamente indicado neste instrumento.

1.5.17. A mesma conta bancária institucional poderá ser utilizada para outros contratos da ASPPIBRA, desde que a associação mantenha *controle individualizado por contrato*, permitindo identificar cada entrada, saída, retenção, despesa e repasse relacionado ao presente instrumento.

1.5.18. A ASPPIBRA não poderá utilizar os valores recebidos por conta e ordem deste contrato para finalidade estranha à respectiva relação contratual, ressalvados os descontos e pagamentos expressamente autorizados neste instrumento ou impostos por lei.

*1.5.19. Da eficácia do pagamento.* O pagamento efetuado pelo CESSIONÁRIO na conta expressamente indicada neste instrumento, ou por meio de boleto, Pix ou outro meio regularmente disponibilizado nos termos desta cláusula, será considerado realizado ao respectivo titular do crédito mediante a efetiva confirmação da liquidação, ressalvadas hipóteses de estorno, fraude, devolução, bloqueio, erro operacional ou determinação de autoridade competente.

1.5.20. O simples agendamento, emissão de boleto ou comprovante de solicitação de transferência, sem efetiva liquidação ou disponibilização do valor, não constitui quitação.

*1.5.21. Da conciliação e controle financeiro.* Compete à ASPPIBRA identificar e conciliar cada pagamento recebido com o respectivo contrato, parcela ou obrigação, mantendo registro mínimo da data, pagador, valor, finalidade, retenções e destino do recurso.

1.5.22. Havendo pagamento divergente, duplicidade, ausência de identificação suficiente, estorno, bloqueio, suspeita objetiva de fraude ou outra inconsistência relevante, a ASPPIBRA deverá registrar a ocorrência, comunicar os interessados e adotar as providências razoavelmente necessárias à regularização.

*1.5.23. Da retenção e destinação dos valores.* A ASPPIBRA somente poderá reter, compensar ou efetuar pagamentos com os valores arrecadados quando houver: \
  a) remuneração própria expressamente prevista neste instrumento; \
  b) despesa, custo ou encargo expressamente atribuído neste instrumento; \
  c) pagamento devido a profissional ou fornecedor previamente autorizado; \
  d) retenção tributária ou outro desconto imposto por lei; \
  e) outra hipótese expressamente autorizada pelas partes neste instrumento ou em documento posterior válido.

1.5.24. É vedada a retenção arbitrária ou a utilização dos valores recebidos para finalidade diversa daquela autorizada neste instrumento.

*1.5.25. Da remuneração da ASPPIBRA.* Pela administração contratual, coordenação operacional, gestão documental, acompanhamento das providências e administração do fluxo de pagamentos previstas nesta cláusula, será devida à ASPPIBRA a remuneração de R\$ #get_val("asppibraRemuneracaoValor", "VALOR DA REMUNERAÇÃO DA ASPPIBRA") (#get_val("asppibraRemuneracaoValorExtenso", "VALOR POR EXTENSO")), ou equivalente a #get_val("asppibraRemuneracaoPercentual", "PERCENTUAL (EX: 10%)")% sobre #get_val("asppibraRemuneracaoBaseCalculo", "BASE DE CÁLCULO (EX: PREÇO TOTAL DA CESSÃO)"), paga por #get_val("asppibraRemuneracaoResponsavel", "RESPONSÁVEL PELO PAGAMENTO (EX: CEDENTE)"), na forma e nos prazos previstos neste instrumento.

1.5.26. A remuneração da ASPPIBRA constitui contraprestação pelos serviços contratados, não se confundindo com o preço da cessão, contribuições associativas, despesas de terceiros ou honorários de profissionais contratados para atos técnicos ou jurídicos.

1.5.27. Quando a remuneração estiver autorizada a ser descontada dos valores arrecadados, a retenção somente ocorrerá quando a respectiva parcela estiver vencida e exigível, devendo constar da prestação de contas.

1.5.28. A remuneração da ASPPIBRA não fica condicionada exclusivamente ao deferimento, aprovação, registro, reconhecimento de direito, conclusão de REURB, usucapião ou outro resultado cuja decisão dependa de autoridade pública, serventia, Poder Judiciário, profissional independente ou terceiro, ressalvadas as condições específicas de remuneração e restituição expressamente previstas neste instrumento.

*1.5.29. Dos repasses.* Confirmado o recebimento e deduzidos somente os valores legitimamente autorizados neste instrumento, a ASPPIBRA deverá repassar ao titular do respectivo crédito o saldo que lhe for devido, para a conta indicada no contrato, no prazo máximo de #get_val("prazoRepasseCedenteDias", "PRAZO EM DIAS ÚTEIS (EX: 5 DIAS ÚTEIS)") dias úteis.

#block(breakable: false, width: 100%, above: 8pt, below: 10pt)[
  #set par(first-line-indent: 0pt)
  #table(
    columns: (28%, 37%, 35%),
    inset: 6pt,
    stroke: 0.5pt + color_border,
    fill: (x, y) => if y == 0 { color_bg_box } else { none },
    table.cell(colspan: 2)[#align(center)[#text(weight: "bold")[DADOS PARA REPASSE AO CEDENTE]]],
    [#text(weight: "bold")[Instituição / Banco]], [#get_val("cedenteBanco", "NOME DO BANCO DO CEDENTE")],
    [#text(weight: "bold")[Agência e Conta]], [Agência: #get_val("cedenteAgencia", "NÚMERO DA AGÊNCIA") | Conta: #get_val("cedenteConta", "NÚMERO DA CONTA")],
    [#text(weight: "bold")[Titular e CPF/CNPJ]], [#get_val("cedenteNomeRepasse", "NOME DO CEDENTE") (CPF/CNPJ: #get_val("cedenteCpfRepasse", "NÚMERO DO CPF/CNPJ DO CEDENTE"))],
    [#text(weight: "bold")[Chave Pix]], [#get_val("cedenteChavePix", "CHAVE PIX DO CEDENTE")],
  )
]

1.5.30. Havendo impedimento para o repasse integral, a ASPPIBRA deverá comunicar a parte interessada, indicar a causa do impedimento e, sempre que juridicamente e operacionalmente possível, repassar a parcela incontroversa, restringindo eventual retenção à parcela efetivamente impedida ou controvertida.

*1.5.31. Da prestação de contas.* A ASPPIBRA deverá manter prestação de contas individualizada deste contrato, permitindo identificar, de forma objetiva: \
  a) valores recebidos; \
  b) respectivas datas e referências; \
  c) retenções realizadas; \
  d) despesas e pagamentos efetuados; \
  e) remuneração da ASPPIBRA; \
  f) valores líquidos repassados; \
  g) respectivas datas e comprovantes.

1.5.32. A prestação de contas poderá ser apresentada por meio físico ou eletrônico, inclusive mediante relatório financeiro, extrato, comprovante bancário ou sistema de gestão que permita identificar suficientemente as movimentações relacionadas a este contrato, observadas as regras de proteção de dados e sigilo.

*1.5.33. Da responsabilidade e ausência de garantia de resultado.* A ASPPIBRA responderá, na forma da legislação civil aplicável, pelos danos diretamente decorrentes de dolo ou culpa comprovada no exercício das atribuições que lhe forem expressamente cometidas, inclusive em caso de retenção indevida, repasse indevido, desvio de finalidade ou falha injustificada na prestação de contas.

1.5.34. A ASPPIBRA não garante o deferimento, aprovação, registro, reconhecimento de propriedade, conclusão de REURB ou usucapião, nem responde por decisões ou atos de órgãos públicos, Poder Judiciário, serventias, profissionais independentes, terceiros ou pelas informações e omissões imputáveis às demais partes, ressalvada a responsabilidade que lhe seja legalmente atribuível por seus próprios atos.

*1.5.35. Da integridade, conflitos e proteção de dados.* A ASPPIBRA observará as regras de integridade, transparência e gestão de conflitos de interesses previstas em seu Estatuto Social e nas normas internas aplicáveis, devendo comunicar e tratar adequadamente situações de conflito real ou potencial.

1.5.36. O tratamento de dados pessoais realizado pela ASPPIBRA limitar-se-á às finalidades necessárias à execução do contrato, cobrança, recebimento, repasse, prestação de contas, contratação de profissionais, cumprimento de obrigações legais e demais finalidades legítimas relacionadas ao objeto, observada a Lei nº 13.709/2018.

*1.5.37. Da suspensão excepcional.* A ASPPIBRA poderá suspender temporariamente determinada cobrança, pagamento ou repasse quando houver documentação insuficiente, inconsistência relevante, suspeita objetiva de fraude, impedimento bancário, determinação de autoridade competente ou outro risco jurídico ou operacional devidamente justificado, comunicando a parte interessada e limitando a suspensão ao necessário para sua regularização.

*1.5.38. Da substituição e encerramento.* Na hipótese de substituição ou encerramento da atuação da ASPPIBRA, esta deverá apresentar prestação de contas final, interromper novas cobranças, salvo autorização para liquidação de obrigações remanescentes, repassar os valores incontroversos e entregar ou disponibilizar a documentação e informações necessárias à continuidade ou encerramento organizado do contrato.

1.5.39. A substituição ou encerramento da atuação da ASPPIBRA não afasta o dever de prestar contas dos valores por ela recebidos durante o período de sua administração.

*1.5.40. Da alteração dos dados bancários.* Qualquer alteração da conta, agência, chave Pix ou outro dado utilizado para recebimento ou repasse deverá ser formalmente comunicada e, quando modificar elemento essencial do mecanismo financeiro deste instrumento, formalizada por documento escrito ou aditivo, não produzindo efeitos mediante simples comunicação informal.

*1.5.41. Da autenticação institucional.* Eventual selo, código, número ou identificação denominada “AUTENTICAÇÃO DIGITAL” pela ASPPIBRA constitui mecanismo interno de identificação, padronização ou controle documental e *não equivale a autenticação notarial, reconhecimento de firma, registro público, certificação do Registro de Imóveis ou chancela de órgão público*, nem constitui garantia de validade ou resultado registral.

*1.5.42. Da governança e poderes específicos.* A atuação da ASPPIBRA observará as competências de seus órgãos estatutários e, quando aplicável, os procedimentos internos de aprovação e fiscalização previstos em seu Estatuto Social, inclusive aqueles relativos à contratação remunerada de serviços.

1.5.43. Esta cláusula não substitui procuração, autorização, certificado, assinatura ou outro documento específico eventualmente exigido por instituição financeira, órgão público, serventia extrajudicial, profissional habilitado ou legislação aplicável.

1.5.44. As partes declaram estar cientes e de acordo com a estrutura estabelecida nesta cláusula, segundo a qual a ASPPIBRA exercerá função ativa de administração contratual e do fluxo operacional de pagamentos, podendo receber valores em conta de sua titularidade, vinculada ao seu CNPJ, *por conta e ordem do respectivo titular do crédito*, realizando a conciliação, as retenções expressamente autorizadas, os pagamentos previstos e o posterior repasse do saldo devido, com correspondente prestação de contas.

1.5.45. A participação da ASPPIBRA no recebimento e administração dos pagamentos não altera a natureza da obrigação principal entre CEDENTE e CESSIONÁRIO, não transfere à associação a titularidade do imóvel, da posse ou dos créditos pertencentes às partes e não a torna responsável pelas obrigações materiais atribuídas diretamente a CEDENTE ou CESSIONÁRIO.


// ============================================================================
// CAPÍTULO II – DAS DECLARAÇÕES PRELIMINARES
// ============================================================================
#section_heading("CAPÍTULO II – DAS DECLARAÇÕES PRELIMINARES")

2.1. O CEDENTE declara que exerce sobre o IMÓVEL descrito no Capítulo III posse pública, contínua e pacífica, segundo seu conhecimento efetivo e de acordo com os elementos documentais e possessórios de que dispõe na data da assinatura deste instrumento.

2.1.1. O CEDENTE declara, ainda, que, até a data da assinatura, não tem conhecimento de oposição formal, reivindicação ou disputa de terceiro que lhe tenha sido comunicada e que impeça ou restrinja diretamente a posse ora cedida, ressalvadas as situações, pendências, diligências e hipóteses expressamente informadas neste instrumento e em seus anexos.

2.1.2. A declaração prevista nesta Cláusula é prestada exclusivamente com base no conhecimento efetivo do CEDENTE, não constituindo garantia de inexistência de direitos, pretensões, reivindicações, oposições ou disputas de terceiros que não lhe tenham sido comunicados ou que somente venham a ser identificados posteriormente, inclusive durante o procedimento de regularização fundiária ou de usucapião.

2.1.3. A identificação posterior de terceiro que alegue direito sobre o imóvel não caracteriza, por si só, falsidade, inadimplemento contratual ou culpa do CEDENTE, salvo se demonstrado que o CEDENTE tinha conhecimento anterior e relevante do fato e, deliberadamente, deixou de informá-lo ao(à)(s) CESSIONÁRIO(A)(S), aplicando-se, conforme o caso, o disposto nas Cláusulas 4.8, 10.3 e 11.1.

2.2. O IMÓVEL descrito no Capítulo III possui matrícula individualizada perante o Cartório de Registro de Imóveis da Comarca de #get_val("comarcaCartorioImoveis", "MUNICÍPIO/UF"), sob o nº #get_val("numeroMatriculaImovel", "NÚMERO DA MATRÍCULA") (#get_val("identificacaoLoteImovel", "IDENTIFICAÇÃO DO LOTE/IMÓVEL")), conforme certidão atualizada a ser juntada ao Anexo II, e encontra-se cadastrado perante a Prefeitura Municipal de #get_val("municipioPrefeitura", "MUNICÍPIO/UF"), Cadastro Geral Imobiliário, sob a Inscrição Imobiliária nº #get_val("inscricaoMunicipalIptu", "NÚMERO DA INSCRIÇÃO MUNICIPAL/IPTU"), conforme Certidão Fiscal Venal nº #get_val("numeroCertidaoFiscalVenal", "NÚMERO DA CERTIDÃO FISCAL VENAIS"), em nome do contribuinte cadastral #get_val("nomeTitularCadastral", "NOME DO TITULAR CADASTRAL") (CPF/CNPJ nº #get_val("cpfCnpjTitularCadastral", "NÚMERO DO CPF/CNPJ DO TITULAR")). O CEDENTE não é titular do domínio registral do IMÓVEL, transmitindo exclusivamente os direitos possessórios sobre ele exercidos, cuja regularização ou eventual aquisição de propriedade observará as vias, condições e documentação disciplinadas no Capítulo IV, não constituindo este instrumento transmissão de propriedade registral.

2.3. O CEDENTE declara, sob as penas da lei, que não cedeu, prometeu ceder, vendeu, hipotecou ou de qualquer forma transferiu ou onerou a posse do imóvel, total ou parcialmente, a qualquer outra pessoa além do(a)(s) CESSIONÁRIO(A)(S) ora contratante(s), respondendo civil e criminalmente pela veracidade desta declaração, sem prejuízo do disposto no Capítulo XI.

2.4. O CEDENTE declara, ainda, conforme seu efetivo conhecimento, que o imóvel: (a) não se localiza em área de preservação permanente, unidade de conservação, área de risco geológico (encosta, alagamento) ou terreno de domínio público; e (b) está sujeito às seguintes restrições urbanísticas (zoneamento, área mínima de lote, recuos): #get_val("restricoesUrbanisticas", "RESTRIÇÕES URBANÍSTICAS"). Caso o CEDENTE tenha conhecimento de qualquer restrição, risco ou irregularidade urbanística/ambiental não mencionada nesta cláusula, deverá informá-la expressamente antes da assinatura, sob pena de responder pelos prejuízos decorrentes da omissão, nos termos do Capítulo XI.

2.5. Natureza jurídica do contrato: as partes declaram, para todos os fins de direito, que o presente instrumento tem por objeto exclusivo a cessão onerosa de direitos possessórios sobre o imóvel descrito no Capítulo III, não configurando compra e venda de imóvel nem qualquer outro negócio jurídico de transmissão de propriedade sujeito à forma pública exigida pelo art. 108 do Código Civil. As referências a &ldquo;preço&rdquo;, &ldquo;pagamento&rdquo; e &ldquo;quitação&rdquo; ao longo deste instrumento dizem respeito exclusivamente à contraprestação pecuniária pela cessão dos direitos possessórios, e não à transferência do domínio registral do imóvel. A eventual aquisição da propriedade pelo(a)(s) CESSIONÁRIO(A)(S), quando cabível, dar-se-á pelas vias de regularização fundiária ou reconhecimento de usucapião disciplinadas no Capítulo IV, modos que prescindem de outorga de escritura pública de compra e venda pelo CEDENTE.

2.6. Do loteamento e da regularidade urbanística: o imóvel integra o loteamento denominado #get_val("nomeLoteamento", "NOME DO LOTEAMENTO"), devidamente aprovado pela Prefeitura Municipal de #get_val("municipioLoteamento", "MUNICÍPIO") sob o Processo Administrativo nº #get_val("processoAdmLoteamento", "Nº PROCESSO ADM") e registrado junto ao #get_val("cartorioLoteamento", "CARTÓRIO DE REGISTRO") sob o Registro nº #get_val("registroLoteamento", "Nº REGISTRO DO LOTEAMENTO"), em conformidade com a Lei nº 6.766/1979. As partes reconhecem e declaram que a responsabilidade legal, administrativa e penal atribuída ao loteador (arts. 50 a 52 da Lei nº 6.766/1979) não recai sobre o CEDENTE, uma vez que este não é o loteador original nem seu sucessor na respectiva posição jurídica perante o empreendimento, figurando exclusivamente como possuidor de lote individualizado, já dotado de matrícula própria, integrante de loteamento regularmente constituído e aprovado, cuja posse foi por ele adquirida na forma da Cláusula 4.1.

2.7. Da eventual dívida ativa: sem prejuízo da situação cadastral e registral descrita na Cláusula 2.2, os débitos tributários municipais incidentes sobre o #get_val("identificacaoLoteTerreno", "IDENTIFICAÇÃO DO LOTE/TERRENO"), em nome do contribuinte cadastral #get_val("nomeTitularCadastral", "NOME DO TITULAR CADASTRAL"), são detalhados na Cláusula 2.7.1 e no quadro-resumo a seguir, integrando o acervo informativo e documental do imóvel para fins das providências previstas no Capítulo IV.

2.7.1. O CEDENTE declara ter conhecimento de que o lote possui débitos tributários municipais (IPTU) vencidos e em aberto, conforme apurado junto ao portal de emissão de guias da Prefeitura Municipal de #get_val("municipioPrefeitura", "MUNICÍPIO/UF"), com data de referência de #get_val("dataReferenciaIptu", "DATA DE REFERÊNCIA"), relativos aos exercícios de #get_val("exerciciosAnosVencidos", "EXERCÍCIOS/ANOS VENCIDOS"), no valor total atualizado de aproximadamente R\$ #get_val("valorTotalDivida", "VALOR TOTAL") (#get_val("valorTotalDividaExtenso", "VALOR POR EXTENSO")), além da parcela do IPTU/#get_val("anoVigenteIptu", "ANO VIGENTE") no valor de R\$ #get_val("valorParcelaIptu", "VALOR DA PARCELA") (parcelada em #get_val("numeroParcelasIptu", "NÚMERO DE PARCELAS") vezes) e saldo a vencer de R\$ #get_val("saldoVencerIptu", "VALOR DO SALDO A VENCER"). Não foi identificada, com base na documentação ora disponível, a efetiva inscrição desses débitos em dívida ativa, nem a existência de execução fiscal ajuizada relativa a tais débitos, cabendo a obtenção de certidão de dívida ativa e de certidão específica de distribuição de ações fiscais em nome do titular registral/cadastral antes da assinatura deste instrumento. Por estarem os valores acima sujeitos à atualização monetária contínua, o CEDENTE obriga-se a reconfirmá-los junto à Prefeitura Municipal de #get_val("municipioPrefeitura", "MUNICÍPIO/UF") imediatamente antes da assinatura, comprometendo-se a informar ao(à)(s) CESSIONÁRIO(A)(S) qualquer alteração relevante, inclusive eventual ajuizamento de execução fiscal de que venha a ter conhecimento, sob pena de responder pelos prejuízos decorrentes da omissão, nos termos do Capítulo #get_val("capituloPenalidadesOmissao", "NÚMERO DO CAPÍTULO").

#block(breakable: false, width: 100%, above: 8pt, below: 10pt)[
  #set par(first-line-indent: 0pt)
  #table(
    columns: (16%, 22%, 34%, 28%),
    inset: 6pt,
    stroke: 0.5pt + color_border,
    fill: (x, y) => if y == 0 { color_bg_box } else { none },
    table.cell(colspan: 2)[#align(center)[#text(weight: "bold")[QUADRO-RESUMO – SITUAÇÃO FISCAL E DÉBITOS DE IPTU DO IMÓVEL]]],
    [#text(weight: "bold")[Contribuinte Cadastral / Titular]], [#get_val("nomeTitularCadastral", "NOME DO TITULAR CADASTRAL") (CPF/CNPJ: #get_val("cpfCnpjTitularCadastral", "NÚMERO DO CPF/CNPJ DO TITULAR"))],
    [#text(weight: "bold")[Exercícios Vencidos]], [#get_val("exerciciosAnosVencidos", "EXERCÍCIOS/ANOS VENCIDOS")],
    [#text(weight: "bold")[Valor Estimado da Dívida Vencida]], [R\$ #get_val("valorTotalDivida", "VALOR TOTAL") (Data ref.: #get_val("dataReferenciaIptu", "DATA DE REFERÊNCIA"))],
    [#text(weight: "bold")[IPTU do Ano Vigente (#get_val("anoVigenteIptu", "ANO VIGENTE"))]], [R\$ #get_val("valorParcelaIptu", "VALOR DA PARCELA") (#get_val("numeroParcelasIptu", "NÚMERO DE PARCELAS")x) | Saldo a vencer: R\$ #get_val("saldoVencerIptu", "VALOR DO SALDO A VENCER")],
    [#text(weight: "bold")[Responsabilidade de Quitação]], [Exclusiva do CEDENTE (mediante abatimento no preço, conforme Cláusulas 5.6 e 5.7)],
  )
]

2.7.2. Sem prejuízo do disposto nas Cláusulas 5.6 e 5.7 quanto à quitação ou ao parcelamento da dívida ativa incidente sobre o imóvel com recursos do preço, e havendo execução fiscal em curso sobre o imóvel, as partes desde já convencionam que: (a) a quitação de débitos tributários incidentes sobre o lote observará a divisão de responsabilidades prevista no Capítulo VII; (b) o(a)(s) CESSIONÁRIO(A)(S), uma vez imitido(a)(s) na posse, poderá(ão) adotar as medidas processuais cabíveis para proteção da posse, inclusive, quando presentes os pressupostos legais, a oposição de embargos de terceiro no respectivo processo, para resguardo da posse ora cedida, cabendo ao CEDENTE prestar toda a colaboração documental necessária a essa defesa; e (c) caso o imóvel venha a ser efetivamente arrematado em hasta pública em decorrência de execução fiscal ajuizada contra o titular registral antes da consolidação da usucapião ou da regularização fundiária em favor do(a)(s) CESSIONÁRIO(A)(S), aplicar-se-á o disposto na Cláusula 10.3.4 (distrato por evicção), sem prejuízo do direito de regresso do CEDENTE contra quem de direito.

2.8. Da titularidade registral em nome de (#get_val("nomeTitularCadastral", "NOME DO TITULAR CADASTRAL")): sendo o titular registral e/ou cadastral do imóvel #get_val("identificacaoLoteTerreno", "IDENTIFICAÇÃO DO LOTE/TERRENO") pessoa (#get_val("nomeTitularCadastral", "NOME DO TITULAR CADASTRAL")), cujo espólio ainda não tenha sido objeto de partilha ou cujo inventário se encontre em curso, o CEDENTE obriga-se a diligenciar e informar ao(à)(s) CESSIONÁRIO(A)(S), antes da assinatura deste instrumento, sempre que deles tiver conhecimento: (a) se há inventário aberto (judicial ou extrajudicial) relativo ao espólio, com indicação do respectivo número e cartório/vara; (b) a identificação do(a) inventariante e dos herdeiros conhecidos; e (c) se há qualquer manifestação de oposição, reivindicação ou disputa desses herdeiros quanto à posse exercida sobre o imóvel.

2.8.1. A existência de inventário aberto e de herdeiros identificados e cientes da posse exercida pelo CEDENTE, sem oposição destes, não impede, por si só, a adoção das providências de regularização fundiária ou de usucapião referidas no Capítulo IV, mas exige diligência documental redobrada, incluindo a notificação pessoal dos herdeiros conhecidos e do(a) inventariante no âmbito dos procedimentos cabíveis, na forma da legislação aplicável, cujo custeio técnico e preparatório será suportado pelo CEDENTE, nos termos das Cláusulas 5.4 e 7.3.

Havendo oposição de qualquer herdeiro ou inventariante à posse exercida pelo CEDENTE, o CEDENTE deverá comunicar imediatamente o fato ao(à)(s) CESSIONÁRIO(A)(S), fornecer toda a documentação disponível relacionada à oposição e adotar, às suas expensas, as providências juridicamente cabíveis para esclarecimento e regular prosseguimento da situação possessória. Enquanto perdurar a oposição e não estiver definida a viabilidade jurídica de prosseguimento da regularização ou da usucapião, não se presumirá a conclusão do procedimento nem a existência de direito à regularização registral. Caso a oposição resulte em indeferimento, extinção ou arquivamento definitivo do procedimento de regularização fundiária ou de usucapião, sem possibilidade jurídica de prosseguimento pela via adotada, aplicar-se-á a Cláusula 4.8, sem prejuízo das demais responsabilidades contratuais do CEDENTE, quando a causa for a ele imputável.


// ============================================================================
// CAPÍTULO III – DO OBJETO
// ============================================================================
#section_heading("CAPÍTULO III – DO OBJETO")

3.1. O imóvel objeto da presente cessão de posse é o seguinte (doravante designado simplesmente *IMÓVEL* ou *LOTE*):

#block(breakable: false, width: 100%, above: 8pt, below: 10pt)[
  #set par(first-line-indent: 0pt)
  #table(
    columns: (28%, 27%, 45%),
    inset: 6pt,
    stroke: 0.5pt + color_border,
    fill: (x, y) => if y == 0 { color_bg_box } else { none },
    table.cell(colspan: 2)[#text(weight: "bold")[#get_val("identificacaoLoteImovel", "IDENTIFICAÇÃO DO LOTE/IMÓVEL (EX: LOTE 00 - IMÓVEL MUNICIPAL Nº 0000)")]],
    [#text(weight: "bold")[Lote]], [#get_val("numeroLote", "NÚMERO DO LOTE")],
    [#text(weight: "bold")[Quadra]], [#get_val("quadraLote", "QUADRA")],
    [#text(weight: "bold")[Logradouro / Loteamento]], [#get_val("logradouroImovel", "LOGRADOURO COMPLETO, BAIRRO E CEP")],
    [#text(weight: "bold")[Município/UF]], [#get_val("municipioUfImovel", "MUNICÍPIO/UF")],
    [#text(weight: "bold")[Área total]], [#get_val("areaTotalImovel", "ÁREA TOTAL (M² E EXTENSO)") – conforme Certidão Fiscal Venal nº #get_val("numeroCertidaoFiscalVenal", "Nº DA CERTIDÃO"), Inscrição Cadastral #get_val("inscricaoCadastral", "Nº DA INSCRIÇÃO")],
    [#text(weight: "bold")[Matrícula / Registro]], [#get_val("matriculaRegistroImovel", "Nº DA MATRÍCULA E CARTÓRIO COMPETENTE")],
    [#text(weight: "bold")[Confrontações e Limites]], [#get_val("confrontacoesImovel", "CONFRONTAÇÕES E LIMITES DO LOTE")],
  )
]

3.2. O CEDENTE cede e transfere ao(à)(s) CESSIONÁRIO(A)(S) a totalidade da posse, direitos e ações que exerce sobre o imóvel individualmente descrito na Cláusula 3.1, objeto do preço pactuado na forma do Capítulo V, para que dele use(m), goze(m) e disponha(m) livremente, obrigando-se o CEDENTE, por si, seus herdeiros e sucessores, a manter esta cessão firme, boa e valiosa a qualquer tempo, respondendo pela evicção nos termos dos arts. 447 a 457 do Código Civil e do Capítulo XI deste instrumento, observados os limites e a alocação de risco possessório estabelecidos na Cláusula 11.1.

3.3. O(A)(S) CESSIONÁRIO(A)(S) declara(m) ter vistoriado o imóvel previamente à assinatura deste instrumento e ter ciência do seu estado físico e de conservação, bem como das informações, documentos, ressalvas, pendências, débitos e situações descritos nas Cláusulas 2.2, 2.7, 2.7.1, 2.7.2, 2.8 e 2.8.1 (doravante “Riscos Divulgados”), efetivamente apresentados pelo CEDENTE até a presente data.

3.3.1. Quanto aos Riscos Divulgados, a ciência e a aceitação expressa do(a)(s) CESSIONÁRIO(A)(S) excluem a responsabilidade do CEDENTE pela mera existência, materialização ou desdobramento desses riscos especificamente descritos, incluindo eventual atraso, dificuldade ou custo adicional decorrente de sua natureza já conhecida na data da assinatura, ressalvado o disposto na Cláusula 3.3.3.

3.3.2. Não se incluem entre os Riscos Divulgados, permanecendo sob responsabilidade plena do CEDENTE nos termos deste instrumento: (a) fatos, ônus, gravames, oposições, débitos ou pendências não informados nas cláusulas referidas na Cláusula 3.3, ainda que existentes na data da assinatura; (b) fatos supervenientes cuja origem seja anterior à assinatura e dos quais o CEDENTE tinha efetivo conhecimento e deixou de informar; e (c) qualquer inexatidão relevante nas informações prestadas sobre os Riscos Divulgados que decorra de declaração falsa ou omissão dolosa do CEDENTE.

3.3.3. A exclusão de responsabilidade prevista na Cláusula 3.3.1 não abrange o descumprimento, pelo CEDENTE, das obrigações específicas por ele assumidas neste instrumento em razão dos próprios Riscos Divulgados (por exemplo, as obrigações de custeio e diligência previstas nas Cláusulas 2.7.1, 2.7.2, 2.8.1, 4.3, 5.6 e 5.7), as quais permanecem plenamente exigíveis.

3.4. O CEDENTE declara que os direitos possessórios ora cedidos não foram objeto de cessão anterior, promessa de cessão, hipoteca ou qualquer outra forma de transferência ou oneração a terceiros, e não estão sujeitos a penhora, constrição judicial ou direito de terceiro que impeça ou restrinja sua transferência ao(à)(s) CESSIONÁRIO(A)(S), sob pena de responsabilização do CEDENTE nos termos do Capítulo XI. Fica expressamente ressalvado que os débitos tributários municipais (IPTU) incidentes sobre o imóvel, anteriores à imissão na posse e já declarados na Cláusula 2.7.1, não configuram violação desta declaração, permanecendo de responsabilidade exclusiva do CEDENTE e sujeitos ao tratamento previsto nas Cláusulas 5.6, 5.7 e no Capítulo VII.

3.5. Em caso de fracionamento do imóvel entre múltiplos cessionários, cada fração será identificada em tabela própria (Parte A, Parte B etc.), com medidas e confrontações individualizadas, e cada cessionário responderá exclusivamente pela parte que lhe for atribuída, na forma da Cláusula 1.4.


// ============================================================================
// CAPÍTULO IV – DA ORIGEM DA POSSE, CADEIA POSSESSÓRIA E REGULARIZAÇÃO FUNDIÁRIA
// ============================================================================
#section_heading("CAPÍTULO IV – DA ORIGEM DA POSSE, CADEIA POSSESSÓRIA E REGULARIZAÇÃO FUNDIÁRIA")

4.1. O CEDENTE declara exercer sobre o IMÓVEL posse pública, contínua e pacífica desde #get_val("dataInicioPosseDeclarada", "DATA DE INÍCIO DA POSSE DECLARADA"), conforme declaração e documentação constantes do *Anexo III – Documentação da Posse*, que integra este instrumento.

4.1.1. A origem, o tempo, a natureza e a continuidade da posse, inclusive eventual soma de períodos de possuidores anteriores, serão demonstrados pela documentação indicada no Anexo III, com a identificação dos respectivos possuidores, períodos, forma de transmissão ou sucessão e elementos de prova disponíveis.

4.2. O presente instrumento formaliza exclusivamente a cessão dos direitos possessórios descritos no Capítulo III, não substituindo os documentos, atos notariais, elementos técnicos ou demais provas exigidos pela legislação para eventual usucapião ou regularização fundiária.

4.2.1. Os dados relativos à posse utilizados neste contrato permanecerão vinculados, no sistema eletrônico, às respectivas fontes documentais, sempre que aplicável, com identificação do documento, data e versão. A referência a documento externo não implica certificação de sua veracidade ou suficiência, cuja análise caberá à autoridade, serventia ou profissional competente.

4.3. A regularização da situação possessória e a eventual aquisição da propriedade pelo(a)(s) CESSIONÁRIO(A)(S) serão buscadas pela via juridicamente cabível ao caso concreto, inclusive usucapião, REURB ou outra modalidade legalmente admitida, conforme a situação do IMÓVEL e a documentação disponível.

4.3.1. Quando houver análise de viabilidade da regularização, a via inicialmente indicada constará do *Anexo IV – Enquadramento e Viabilidade da Regularização* e poderá ser alterada quando a análise jurídica, técnica, notarial, administrativa ou registral indicar modalidade ou procedimento diverso, sem que isso constitua, por si só, inadimplemento contratual ou garantia de resultado.

4.4. Sendo juridicamente cabível a usucapião extrajudicial, as partes obrigam-se a cooperar para sua instrução e processamento, fornecendo documentos, informações, declarações, comparecimentos e anuências de sua responsabilidade, observada a legislação e a regulamentação aplicáveis. A eventual ata notarial será lavrada pelo tabelião competente e não implicará, por si só, reconhecimento da propriedade ou garantia de deferimento.

4.5. Quando cabível a REURB, as partes cooperarão com o respectivo procedimento administrativo e com os profissionais habilitados, observadas as competências legais do Município, do Registro de Imóveis, do tabelião, do advogado e dos profissionais técnicos. A modalidade de REURB será aquela definida ou reconhecida no procedimento competente.

4.5.1. A ASPPIBRA poderá prestar apoio administrativo e operacional na organização documental, acompanhamento de protocolos e comunicação entre os envolvidos, sem exercer atribuições privativas das autoridades, serventias ou profissionais legalmente competentes.

4.6. As providências de análise, preparação e regularização poderão ser iniciadas antes da quitação integral do preço, quando juridicamente e operacionalmente possível. O CEDENTE e o(a)(s) CESSIONÁRIO(A)(S) deverão fornecer, nos prazos estabelecidos neste instrumento, os documentos, informações e atos que lhes competirem, respondendo cada parte pelas consequências de seu próprio atraso ou descumprimento.

4.7. A existência ou adoção de procedimento de usucapião, REURB ou outra forma de regularização não constitui garantia de resultado pelas partes ou pela ASPPIBRA, sem prejuízo das obrigações de cooperação expressamente assumidas neste instrumento.

4.8. O indeferimento, extinção ou arquivamento definitivo do procedimento de regularização será tratado conforme a causa e a responsabilidade pelo evento, aplicando-se, conforme o caso, as disposições deste instrumento sobre impossibilidade de cumprimento, inadimplemento, perda da posse e resolução. Se o impedimento decorrer exclusivamente de ato ou decisão de órgão público, serventia, profissional habilitado ou terceiro não vinculado às partes, não haverá presunção de inadimplemento, devendo ser avaliada a existência de outra via juridicamente cabível.

4.9. Enquanto não concluída a regularização registral, este instrumento continuará disciplinando a relação possessória, sem se confundir a cessão dos direitos possessórios com transmissão do domínio. Concluída a regularização e praticado o ato registral correspondente, cessarão os efeitos deste instrumento quanto à sua finalidade de disciplinar a situação possessória objeto da presente cessão, permanecendo vigentes as obrigações que, por sua natureza ou previsão contratual, devam subsistir.


// ============================================================================
// CAPÍTULO V – DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO
// ============================================================================
#section_heading("CAPÍTULO V – DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO")

5.1. O preço total ajustado para a cessão integral dos direitos possessórios que o CEDENTE exerce sobre o imóvel objeto deste instrumento é de R\$ #get_val("valorTotalPreco", "180.000,00") (#get_val("valorTotalPrecoExtenso", "cento e oitenta mil reais")), a ser pago na forma e nos prazos estabelecidos neste Capítulo e no Capítulo VI.

5.2. Havendo pluralidade de CESSIONÁRIOS, cada qual responderá exclusivamente pelo pagamento da fração do preço correspondente à sua participação na aquisição, na forma estabelecida neste instrumento, não havendo solidariedade entre os CESSIONÁRIOS quanto ao inadimplemento de obrigação exclusivamente atribuível a outro CESSIONÁRIO.

5.3. O preço estabelecido na Cláusula 5.1 constitui o valor total da cessão dos direitos possessórios objeto deste instrumento, não compreendendo as despesas e os custos que, por disposição expressa deste contrato, sejam de responsabilidade específica de cada parte.

5.4. As despesas necessárias à regularização fundiária do imóvel e à instrução e desenvolvimento do procedimento de usucapião, quando juridicamente cabível, serão suportadas pelo CEDENTE, na forma estabelecida no Capítulo IV, não sendo tais despesas consideradas parcela adicional do preço de aquisição dos direitos possessórios.

5.5. As custas e os emolumentos devidos ao Registro de Imóveis para os atos de regularização registral final do imóvel não integram o preço previsto na Cláusula 5.1 e serão suportados pelo(a)(s) CESSIONÁRIO(A)(S), na forma estabelecida no Capítulo VII, sendo seus valores apurados no momento próprio conforme os atos efetivamente praticados, a situação registral do imóvel e os demais elementos que possam influenciar sua cobrança.

5.6. Verificada a existência de dívida ativa municipal, execução fiscal ou qualquer outro débito anterior à imissão na posse que seja de responsabilidade do CEDENTE, este deverá adotar, com recursos provenientes do preço da cessão previsto na Cláusula 5.1, as providências necessárias à quitação integral da dívida ou, quando admitido pelo órgão competente e expressamente adequado ao caso, à formalização de parcelamento regular, apresentando ao(à)(s) CESSIONÁRIO(A)(S), no prazo máximo de #get_val("prazoComprovacaoQuitacaoDivida", "PRAZO EM DIAS (EX: 30 DIAS)") contados do recebimento de cada parcela do preço, os respectivos comprovantes de quitação ou o instrumento formal de parcelamento, com indicação das parcelas, valores e vencimentos. A utilização dos recursos do preço para essa finalidade não caracteriza transferência da dívida ao(à)(s) CESSIONÁRIO(A)(S) nem cria obrigação adicional além do preço estabelecido na Cláusula 5.1, permanecendo o CEDENTE responsável, com recursos próprios, por eventual diferença não coberta pelos valores recebidos.

5.6.1. O eventual limite financeiro estabelecido no cronograma de pagamento para utilização imediata na quitação de dívida anterior não limitará a responsabilidade do CEDENTE pelo pagamento integral dos débitos, encargos, multas, juros, honorários ou demais valores cuja origem ou fato gerador seja anterior à imissão na posse e que sejam de sua responsabilidade.

5.7. Sendo a dívida objeto de parcelamento, o CEDENTE ficará obrigado a manter todas as parcelas rigorosamente em dia até sua quitação integral, sem transferência dessa obrigação ao(à)(s) CESSIONÁRIO(A)(S). O CEDENTE deverá apresentar os respectivos comprovantes sempre que solicitado, no prazo máximo de #get_val("prazoApresentacaoComprovanteParcelamento", "PRAZO EM DIAS (EX: 10 DIAS)").

5.7.1. Na hipótese de o CEDENTE deixar de pagar qualquer parcela de dívida cuja responsabilidade lhe caiba, o(a)(s) CESSIONÁRIO(A)(S) poderá, mediante comunicação prévia por escrito, efetuar diretamente o pagamento ao respectivo credor ou órgão competente e descontar integralmente o valor desembolsado das parcelas do preço ainda devidas ao CEDENTE, considerando-se esse pagamento como cumprimento válido da obrigação de pagar o preço, até o limite do valor efetivamente desembolsado.

5.7.2. O inadimplemento pelo CEDENTE das obrigações previstas nesta Cláusula será considerado descumprimento de obrigação contratual, sujeitando-o às consequências previstas no Capítulo X, sem prejuízo do direito do(a)(s) CESSIONÁRIO(A)(S) de efetuar os pagamentos necessários para evitar a majoração do débito ou prejuízo ao imóvel e promover o respectivo abatimento no saldo do preço.


// ============================================================================
// CAPÍTULO VI – DA FORMA DE PAGAMENTO E COMPROVAÇÃO
// ============================================================================
#section_heading("CAPÍTULO VI – DA FORMA DE PAGAMENTO E COMPROVAÇÃO")

6.1. O preço total da presente cessão de posse, estipulado na Cláusula 5.1, será pago pelo(a)(s) CESSIONÁRIO(A)(S) mediante a estrutura operacional de cobrança, arrecadação e repasse administrada pela ASPPIBRA na qualidade de mandatária do CEDENTE, na forma estabelecida nas Cláusulas 1.5.11 a 1.5.20, conforme os valores, etapas, parcelas e cronograma de vencimentos detalhados no Quadro-Resumo a seguir:

#block(breakable: false, width: 100%, above: 8pt, below: 10pt)[
  #set par(first-line-indent: 0pt)
  #table(
    columns: (32%, 23%, 45%),
    inset: 6pt,
    stroke: 0.5pt + color_border,
    fill: (x, y) => if y == 0 { color_bg_box } else { none },
    table.cell(colspan: 3)[#align(center)[#text(weight: "bold")[QUADRO-RESUMO – FLUXO FINANCEIRO DO PREÇO]]],
    [#text(weight: "bold")[Item]], [#align(center)[#text(weight: "bold")[Valor (R\$)]]], [#text(weight: "bold")[Condição / Vencimento]],
    [#text(weight: "bold")[Preço Total]], [#align(center)[#text(weight: "bold")[R\$ #get_val("valorTotalPreco", "180.000,00")]]], [Valor global da cessão (Cláusula 5.1)],
    [#text(weight: "bold")[Entrada (Sinal)]], [#align(center)[#text(weight: "bold")[R\$ #get_val("valorEntradaAto", "25.000,00")]]], [No ato da assinatura (#get_val("dataPagamentoAssinatura", "À VISTA"))],
    [#text(weight: "bold")[Saldo Financiado]], [#align(center)[#text(weight: "bold")[R\$ #get_val("valorSaldoRemanescente", "155.000,00")]]], [Em #get_val("numeroCiclos", "28") ciclos quadrimestrais (#get_val("totalParcelasMensais", "112") meses)],
    [#text(weight: "bold")[Parcelas Mensais (M1 a M3)]], [#align(center)[R\$ #get_val("valorParcelaMes1Ciclo", "1.000,00") / mês]], [Meses 1, 2 e 3 de cada ciclo (mensal)],
    [#text(weight: "bold")[Reforço do Ciclo (M4)]], [#align(center)[R\$ #get_val("valorReforcoMes4Ciclo", "2.500,00")]], [Mês 4 de cada ciclo (balão quadrimestral)],
    [#text(weight: "bold")[Total por Ciclo (4 meses)]], [#align(center)[#text(weight: "bold")[R\$ #get_val("valorTotalCiclo", "5.500,00")]]], [3 mensais + 1 reforço (28 ciclos = R\$ 154.000)],
    [#text(weight: "bold")[Ajuste Final de Quitação]], [#align(center)[R\$ #get_val("valorParcelaResidualFinal", "1.000,00")]], [No 113º mês (quitação integral de R\$ 155.000)],
    [#text(weight: "bold")[Início dos Vencimentos]], [#align(center)[1º Ciclo]], [#get_val("vencimentoPrimeiroCiclo", "30 dias após a entrada")],
  )
]

6.2. Da entrada: os valores pagos a título de sinal e parcelas de entrada discriminados no Quadro-Resumo constituem amortização direta do preço ajustado na Cláusula 5.1, não possuindo natureza de arras ou sinal penitencial, aplicando-se a quitação exclusivamente ao valor efetivamente recebido e identificado no respectivo comprovante bancário.

6.3. Dos ciclos e antecipação: após quitada a entrada, o saldo remanescente será pago na sequência estipulada de ciclos quadrimestrais, vencendo-se a primeira parcela na data fixada no Quadro-Resumo e as demais no mesmo dia dos meses subsequentes. É facultado ao(à)(s) CESSIONÁRIO(A)(S) amortizar ou quitar antecipadamente quaisquer parcelas ou ciclos, a qualquer tempo, sem penalidade, com redução nominal imediata do saldo devedor remanescente.

6.4. Havendo pluralidade de CESSIONÁRIOS, os pagamentos previstos no cronograma serão rateados na proporção de suas respectivas quotas-partes na aquisição da posse, respondendo cada qual exclusivamente por sua fração, ressalvadas as hipóteses de compensação ou retenção contratual expressamente previstas neste instrumento.

6.5. Da comprovação e guarda: os pagamentos serão realizados na conta operacional da ASPPIBRA ou mediante meios de pagamento por ela regularmente emitidos (boleto bancário, Pix Cobrança ou transferência identificada), na forma da Cláusula 1.5, comprovando-se mediante recibo ou comprovante de liquidação efetiva que permita identificar o pagador, o beneficiário, o valor, a data e a finalidade. As partes comprometem-se a conservar os comprovantes de pagamento pelo prazo mínimo de 5 (cinco) anos.


// ============================================================================
// CAPÍTULO VII – DAS OBRIGAÇÕES TRIBUTÁRIAS, MUNICIPAIS, NOTARIAIS E REGISTRAIS
// ============================================================================
#section_heading("CAPÍTULO VII – DAS OBRIGAÇÕES TRIBUTÁRIAS, MUNICIPAIS, NOTARIAIS E REGISTRAIS")

7.1. Até a data da efetiva imissão do(a)(s) CESSIONÁRIO(A)(S) na posse do imóvel, permanecerão sob responsabilidade exclusiva do CEDENTE todos os tributos, taxas, contribuições, tarifas, encargos e demais obrigações incidentes sobre o imóvel ou dele decorrentes, cujo fato gerador ou origem seja anterior à imissão na posse, incluindo, quando aplicável, IPTU, taxas municipais, contribuições de melhoria, encargos de loteamento e obrigações perante associação de moradores.

7.2. A partir da efetiva imissão na posse, passarão a ser de responsabilidade do(a)(s) CESSIONÁRIO(A)(S), na proporção de sua respectiva participação, os tributos, taxas, tarifas, contribuições e demais encargos cujo fato gerador ou origem seja posterior à imissão na posse, incluindo IPTU e taxas municipais, consumo de água, energia elétrica, serviços, contribuições de associação de moradores, loteamento e demais despesas ordinárias relacionadas ao imóvel.

7.2.1. A transferência da responsabilidade prevista na Cláusula 7.2 não abrangerá débitos, multas, juros, encargos ou obrigações cuja origem ou fato gerador seja anterior à imissão na posse, ainda que sua cobrança, lançamento ou exigibilidade ocorra posteriormente, permanecendo tais valores sob responsabilidade exclusiva do CEDENTE, quando a ele imputáveis.

7.3. Serão de responsabilidade do CEDENTE, na forma estabelecida no Capítulo IV, as despesas necessárias à regularização fundiária do imóvel e à instrução, formalização, desenvolvimento e processamento do procedimento de usucapião, quando juridicamente cabível, incluindo despesas técnicas, administrativas, documentais e notariais, independentemente de tais despesas ocorrerem antes ou depois da quitação integral do preço pelo(a)(s) CESSIONÁRIO(A)(S), desde que estejam relacionadas às obrigações atribuídas ao CEDENTE por este instrumento ou à regularização da situação possessória, documental, cadastral, urbanística ou registral existente até a data da imissão na posse. Permanecem excluídas da responsabilidade do CEDENTE as custas e os emolumentos devidos ao Registro de Imóveis pelo registro ou pela regularização registral final em nome do(a)(s) CESSIONÁRIO(A)(S), os quais serão suportados por estes na forma das Cláusulas 5.5 e 7.4.

7.4. Serão de responsabilidade exclusiva do(a)(s) CESSIONÁRIO(A)(S), na proporção de sua respectiva participação, as custas, emolumentos e demais despesas devidas ao Registro de Imóveis para a prática dos atos de regularização registral final do imóvel, inclusive registro, averbação, abertura de matrícula ou outros atos registrais efetivamente exigidos no caso concreto.

7.4.1. Os custos previstos na Cláusula 7.4 não integram o preço estabelecido na Cláusula 5.1 e serão apurados e pagos no momento da prática dos respectivos atos registrais, conforme a situação efetiva do imóvel e os valores oficialmente cobrados pela serventia competente.

7.4.2. As despesas registrais previstas nesta Cláusula poderão considerar, quando legalmente relevantes, a situação física, cadastral e registral do imóvel, inclusive eventual existência ou realização de construções, benfeitorias ou outras circunstâncias que influenciem a prática ou o valor dos atos registrais.

7.4.3. Eventuais tributos incidentes sobre ato específico de transmissão, regularização ou registro somente serão de responsabilidade da parte indicada neste instrumento quando efetivamente exigíveis por lei em razão do ato praticado, não constituindo esta cláusula reconhecimento prévio da incidência de determinado tributo.

#block(breakable: false, width: 100%, above: 8pt, below: 10pt)[
  #set par(first-line-indent: 0pt)
  #table(
    columns: (25%, 22%, 28%, 25%),
    inset: 6pt,
    stroke: 0.5pt + color_border,
    fill: (x, y) => if y == 0 { color_bg_box } else { none },
    table.cell(colspan: 3)[#align(center)[#text(weight: "bold")[QUADRO-RESUMO – MATRIZ DE REPARTIÇÃO DE OBRIGAÇÕES, TRIBUTOS E CUSTOS]]],
    [#text(weight: "bold")[Natureza da Despesa / Obrigação]], [#align(center)[#text(weight: "bold")[Responsável]]], [#text(weight: "bold")[Período / Condição de Aplicação]],
    [#text(weight: "bold")[IPTU, Taxas Municipais e Encargos Pretéritos]], [#align(center)[#text(weight: "bold")[CEDENTE]]], [Fatos geradores anteriores à imissão na posse (Cl. 7.1)],
    [#text(weight: "bold")[Dívida Ativa e Regularização Fiscal Anterior]], [#align(center)[#text(weight: "bold")[CEDENTE]]], [Quitação via preço ou parcelamento próprio (Cl. 5.6 e 7.6)],
    [#text(weight: "bold")[Regularização Fundiária, Usucapião e Ata Notarial]], [#align(center)[#text(weight: "bold")[CEDENTE]]], [Custeio integral de despesas técnicas e notariais (Cl. 7.3)],
    [#text(weight: "bold")[IPTU, Taxas Municipais e Contribuições Futuras]], [#align(center)[#text(weight: "bold")[CESSIONÁRIO]]], [A partir da efetiva imissão na posse (Cl. 7.2)],
    [#text(weight: "bold")[Contas de Consumo (Água, Energia, Serviços)]], [#align(center)[#text(weight: "bold")[CESSIONÁRIO]]], [A partir da efetiva imissão na posse (Cl. 7.2)],
    [#text(weight: "bold")[Custas e Emolumentos Finais do Cartório de Registro (RGI)]], [#align(center)[#text(weight: "bold")[CESSIONÁRIO]]], [No ato do registro definitivo / matrícula própria (Cl. 7.4)],
  )
]

7.5. O CEDENTE obriga-se a entregar ao(à)(s) CESSIONÁRIO(A)(S), no prazo de até #get_val("prazoEntregaCertidoes", "PRAZO EM DIAS (EX: 15 DIAS)") contados da assinatura deste instrumento, as certidões e documentos relativos ao imóvel e à sua situação jurídica que estejam disponíveis e sejam necessários à verificação de débitos, ônus, gravames e restrições existentes, incluindo certidão ou documento equivalente relativo aos débitos municipais e certidão da matrícula, transcrição ou registro disponível, quando existente.

7.5.1. Quando a emissão de qualquer certidão ou documento depender de prazo superior a #get_val("prazoEntregaCertidoes", "PRAZO EM DIAS (EX: 15 DIAS)") por parte do órgão ou serventia competente, o CEDENTE deverá comprovar o respectivo requerimento dentro do prazo contratual e entregar o documento ao(à)(s) CESSIONÁRIO(A)(S) no prazo de até #get_val("prazoEntregaCertidoesDisponibilizadas", "PRAZO EM DIAS ÚTEIS (EX: 5 DIAS ÚTEIS)") contados de sua disponibilização.

7.5.2. O CEDENTE deverá também fornecer, quando juridicamente pertinentes e disponíveis, certidões pessoais destinadas à verificação de ações, execuções, protestos ou outros fatos que possam repercutir sobre os direitos objeto deste instrumento, observados os limites e a finalidade de cada certidão.

7.6. Constatada, a qualquer tempo, a existência de tributos, taxas, contribuições, encargos, multas, juros, execuções, débitos ou quaisquer outras obrigações cuja origem ou fato gerador seja anterior à imissão na posse e cuja responsabilidade seja do CEDENTE, este ficará obrigado ao seu pagamento integral, independentemente de tais valores terem sido identificados antes ou depois da assinatura deste instrumento.

7.6.1. Caso o(a)(s) CESSIONÁRIO(A)(S) efetue qualquer pagamento de débito cuja responsabilidade seja do CEDENTE, para evitar restrição, acréscimo, execução, prejuízo ao imóvel ou outra consequência, o valor efetivamente desembolsado poderá ser integralmente compensado com parcelas do preço ainda devidas ao CEDENTE, mediante comunicação prévia por escrito e apresentação do respectivo comprovante.

7.6.2. A compensação prevista na Cláusula 7.6.1 não caracterizará inadimplemento do(a)(s) CESSIONÁRIO(A)(S), permanecendo o pagamento realizado diretamente ao credor ou órgão competente reconhecido, até o respectivo limite, como cumprimento da obrigação pecuniária correspondente.

7.7. As responsabilidades previstas neste Capítulo não afastam outras obrigações atribuídas às partes pelos demais capítulos deste instrumento, prevalecendo, em caso de aparente sobreposição, a disposição que atribuir de forma mais específica a responsabilidade pela despesa, tributo, obrigação ou ato correspondente.


// ============================================================================
// CAPÍTULO VIII – DA IMISSÃO NA POSSE E DAS BENFEITORIAS
// ============================================================================
#section_heading("CAPÍTULO VIII – DA IMISSÃO NA POSSE E DAS BENFEITORIAS")

8.1. A imissão do(a)(s) CESSIONÁRIO(A)(S) na posse do imóvel ocorrerá imediatamente após a assinatura deste instrumento por todas as partes e testemunhas, salvo estipulação diversa expressa.

8.2. Em caso de resolução ou distrato deste contrato por inadimplemento do(a)(s) CESSIONÁRIO(A)(S), nos termos do Capítulo X, este(a)(s) fará(ão) jus à indenização ou retenção pelas benfeitorias necessárias e úteis comprovadamente realizadas no imóvel, ressalvado o direito do CEDENTE de optar pelo pagamento do valor de tais benfeitorias, apurado por avaliação de comum acordo ou, na falta deste, por perito nomeado de comum acordo pelas partes, em vez de permitir sua retirada, na forma dos arts. 1.219 e 1.222 do Código Civil.

8.3. Benfeitorias voluptuárias poderão ser levantadas pelo(a)(s) CESSIONÁRIO(A)(S), desde que sua retirada não cause dano ou depreciação ao imóvel, sem indenização.

8.4. Das construções: uma vez imitido(a)(s) na posse, o(a)(s) CESSIONÁRIO(A)(S) poderá(ão) edificar no imóvel, por sua conta e risco, correndo exclusivamente às suas expensas a obtenção de licenciamento junto à Prefeitura Municipal e demais órgãos competentes, a regularização da obra e o cumprimento das obrigações tributárias, administrativas e legais dela decorrentes perante o Município e demais autoridades, respondendo o(a)(s) CESSIONÁRIO(A)(S) por eventuais multas, embargos, demolições ou outras consequências decorrentes de construção irregular ou não licenciada.

8.4.1. Construções de porte relevante (tais como casa, galpão ou estrutura assemelhada), diferentemente das benfeitorias tratadas na Cláusula 8.2, deverão ser comunicadas ao CEDENTE, com indicação de sua natureza e área, e serão consideradas para fins de apuração, no momento próprio, das custas e emolumentos registrais previstos na Cláusula 7.4.1, bem como do respectivo valor em caso de distrato, apurado por avaliação de comum acordo ou, na falta deste, por perito nomeado de comum acordo pelas partes.


// ============================================================================
// CAPÍTULO IX – DO INADIMPLEMENTO, JUROS E MULTA
// ============================================================================
#section_heading("CAPÍTULO IX – DO INADIMPLEMENTO, JUROS E MULTA")

9.1. O atraso no pagamento de qualquer parcela devida pelo(a) CESSIONÁRIO(A) sujeitará a obrigação vencida, independentemente de prova de prejuízo, aos seguintes encargos, calculados cumulativamente entre si exclusivamente durante o período de mora: \
  (a) correção monetária pelo IPCA/IBGE, ou por índice oficial que legalmente o substitua, desde a data do vencimento até a data do efetivo pagamento; \
  (b) juros moratórios de 1% (um por cento) ao mês, calculados pro rata die sobre o valor atualizado da parcela em atraso; e \
  (c) multa moratória de 2% (dois por cento) sobre o valor da parcela vencida e não paga.

§ 1º. Os encargos previstos nesta Cláusula incidirão somente até a data do efetivo pagamento ou, na hipótese de resolução do contrato, até a data da resolução, observadas as regras de não cumulatividade previstas na Cláusula 9.4.

§ 2º. Havendo necessidade efetiva de cobrança extrajudicial por advogado em razão do inadimplemento, poderão ser cobrados honorários advocatícios extrajudiciais correspondentes aos serviços efetivamente prestados, limitados a 10% (dez por cento) do valor atualizado da obrigação vencida e exigida, desde que haja comprovação da atuação profissional e desde que tais honorários não sejam cumulados com honorários sucumbenciais fixados judicialmente relativamente ao mesmo trabalho.

9.2. Verificado o inadimplemento de obrigação com vencimento certo, o(a) CESSIONÁRIO(A) será considerado(a) constituído(a) em mora na forma do art. 397 do Código Civil, sem prejuízo de notificação formal para os fins de resolução contratual. Para fins de constituição de prazo contratual específico para purgação da mora, o CEDENTE notificará o(a) CESSIONÁRIO(A) por escrito, por carta com aviso de recebimento, notificação extrajudicial em cartório ou meio eletrônico que permita comprovação do envio e do recebimento.

§ 1º. Recebida a notificação, o(a) CESSIONÁRIO(A) terá prazo de 15 (quinze) dias corridos para purgar integralmente a mora, mediante pagamento das parcelas vencidas e dos encargos previstos na Cláusula 9.1.

§ 2º. O pagamento parcial não importará purgação da mora, salvo se expressamente aceito pelo CEDENTE por escrito, hipótese em que o saldo remanescente permanecerá sujeito aos encargos contratuais.

§ 3º. A faculdade contratual de purgação da mora prevista nesta Cláusula não constitui renúncia a qualquer direito decorrente da legislação aplicável e não altera, por mera estipulação contratual, a natureza jurídica da relação existente entre as partes.

*9.3. DOS EFEITOS DA MORA E DA LIMITAÇÃO DO GATILHO RESOLUTÓRIO.* A mora do(a) CESSIONÁRIO(A) e sua eventual repercussão na vigência deste contrato observarão as seguintes regras: \
  (a) o inadimplemento de qualquer parcela, isoladamente considerado, constitui mora do(a) CESSIONÁRIO(A) e autoriza o CEDENTE a exigir o valor devido, acrescido dos encargos previstos na Cláusula 9.1, observado o prazo de 15 (quinze) dias corridos para purgação da mora previsto na Cláusula 9.2, não constituindo, por si só, causa de resolução do contrato; \
  (b) para fins de resolução por inadimplemento financeiro, somente serão computadas as parcelas que, depois de regularmente vencidas e após o decurso do prazo de 15 (quinze) dias corridos concedido na notificação para purgação da mora, permaneçam sem quitação integral; \
  (c) a resolução do contrato por inadimplemento financeiro somente poderá ser promovida quando houver *3 (três) parcelas, consecutivas ou não, vencidas e não sanadas*, observado, em relação a cada parcela, o procedimento prévio de notificação e purgação previsto neste Capítulo; \
  (d) a quitação integral de determinada parcela dentro do prazo de purgação da mora fará com que essa parcela *não seja computada* para o cômputo das 3 (três) parcelas necessárias à resolução; \
  (e) a ocorrência de uma ou duas parcelas inadimplidas e não sanadas autoriza a cobrança dos valores vencidos e respectivos encargos moratórios, inclusive pela via judicial, mas não autoriza, exclusivamente por esse fundamento, a resolução do contrato; e \
  (f) a regra deste dispositivo não prejudica as demais hipóteses autônomas de resolução previstas neste contrato, especialmente aquelas decorrentes de fraude, falsidade, cessão duplicada, disposição indevida dos direitos possessórios ou outras faltas graves expressamente qualificadas como causa de resolução no Capítulo X.

Parágrafo único. Verificado o preenchimento do requisito previsto na alínea “c”, o CEDENTE poderá promover a resolução do contrato mediante notificação formal do(a) CESSIONÁRIO(A), aplicando-se os procedimentos de restituição da posse, retenção compensatória, comercialização do imóvel e restituição de saldo previstos no Capítulo X.

9.4. É vedada a cumulação de mecanismos destinados a reparar o mesmo inadimplemento quando houver identidade de fundamento e finalidade econômica, observando-se a seguinte disciplina: \
  (a) enquanto permanecer vigente o contrato e o CEDENTE não houver optado pela resolução nem pelo procedimento judicial incompatível com a manutenção da relação contratual, incidirão os encargos de mora previstos na Cláusula 9.1; \
  (b) optando o CEDENTE pela resolução por inadimplemento do(a) CESSIONÁRIO(A), a cláusula penal compensatória prevista na Cláusula 10.2.1 constituirá a reparação contratual prefixada pela resolução e substituirá, a partir da data da resolução, a incidência de multa, juros e demais encargos moratórios futuros, permanecendo os encargos da Cláusula 9.1 limitados ao período anterior à resolução; \
  (c) optando o CEDENTE pela cobrança judicial sem resolução, poderão ser exigidos o principal vencido, os encargos moratórios da Cláusula 9.1, as despesas processuais recuperáveis e os honorários advocatícios fixados judicialmente, vedada, nessa hipótese, a cobrança da cláusula penal compensatória prevista na Cláusula 10.2.1; \
  (d) a adoção de uma das alternativas previstas nesta Cláusula não impedirá a posterior adoção de providência juridicamente cabível em razão de novo inadimplemento autônomo, desde que não haja dupla reparação pelo mesmo fato.

9.5. O recebimento de parcela em atraso pelo CEDENTE, sem ressalva escrita quanto a eventual saldo remanescente, não importará novação, renúncia ou alteração das demais disposições contratuais.

9.6. O eventual atraso do CEDENTE no cumprimento de obrigação pecuniária líquida e exigível sujeitará o valor devido, desde o vencimento até o efetivo pagamento, à mesma correção monetária pelo IPCA/IBGE e aos mesmos juros moratórios de 1% (um por cento) ao mês, calculados pro rata die, sem incidência da multa moratória prevista para o atraso do(a) CESSIONÁRIO(A), salvo se outra penalidade específica estiver expressamente prevista neste instrumento.

#block(breakable: false, width: 100%, above: 8pt, below: 10pt)[
  #set par(first-line-indent: 0pt)
  #table(
    columns: (16%, 34%, 50%),
    inset: 6pt,
    stroke: 0.5pt + color_border,
    fill: (x, y) => if y == 0 { color_bg_box } else { none },
    table.cell(colspan: 3)[#align(center)[#text(weight: "bold")[QUADRO-RESUMO – ENCARGOS MORATÓRIOS E REGRAS DE INADIMPLEMENTO]]],
    [#text(weight: "bold")[Item]], [#align(center)[#text(weight: "bold")[Parâmetro]]], [#text(weight: "bold")[Aplicação]],
    [#text(weight: "bold")[Correção Monetária]], [#align(center)[IPCA/IBGE]], [Desde o vencimento até o pagamento],
    [#text(weight: "bold")[Juros de Mora]], [#align(center)[1% ao mês]], [Pro rata die],
    [#text(weight: "bold")[Multa Moratória]], [#align(center)[2%]], [Sobre a parcela vencida],
    [#text(weight: "bold")[Prazo de Purgação da Mora]], [#align(center)[15 dias corridos]], [Contados do recebimento da notificação],
    [#text(weight: "bold")[Gatilho Resolutório por Inadimplemento Financeiro]], [#align(center)[3 parcelas não sanadas]], [Parcelas vencidas consecutivas ou não, cujo prazo de 15 dias de purgação tenha decorrido sem quitação (Cláusula 9.3)],
    [#text(weight: "bold")[Cláusula Penal Compensatória]], [#align(center)[20%]], [Sobre os valores efetivamente pagos pelo(a) CESSIONÁRIO(A), conforme Cláusula 10.2.1],
    [#text(weight: "bold")[Prazo para Início da Comercialização após Resolução]], [#align(center)[30 dias corridos]], [Contados da efetiva restituição da posse ao CEDENTE],
    [#text(weight: "bold")[Revisão do Preço de Oferta]], [#align(center)[A cada 180 dias]], [Ou antes, mediante justificativa objetiva de mercado],
    [#text(weight: "bold")[Prazo Máximo para Restituição]], [#align(center)[12 meses]], [Contados da restituição da posse ao CEDENTE, independentemente da conclusão da nova venda],
    [#text(weight: "bold")[Prazo para Repasse após Recebimento de Venda]], [#align(center)[15 dias úteis]], [Contados do efetivo recebimento dos recursos pelo CEDENTE],
  )
]


// ============================================================================
// CAPÍTULO X – DA RESOLUÇÃO, DO DISTRATO E DE SUAS CONSEQUÊNCIAS
// ============================================================================
#section_heading("CAPÍTULO X – DA RESOLUÇÃO, DO DISTRATO E DE SUAS CONSEQUÊNCIAS")

10.1. Constituem causas de resolução deste instrumento por inadimplemento ou impossibilidade superveniente, sem prejuízo de outras hipóteses legalmente admissíveis: \
  (a) o inadimplemento financeiro qualificado de 3 (três) parcelas, consecutivas ou não, vencidas e não purgadas no prazo contratual, nos exatos termos e limites definidos na Cláusula 9.3; \
  (b) o descumprimento de obrigação contratual essencial por qualquer das partes, não sanado no prazo de 30 (trinta) dias corridos após notificação escrita, quando a natureza da obrigação admitir saneamento; \
  (c) a prática comprovada de ato de dolo, fraude, falsidade material relevante, cessão duplicada ou ocultação deliberada de fato relevante por qualquer das partes; \
  (d) a perda total da posse por decisão judicial ou administrativa definitiva, quando não houver solução contratualmente ou juridicamente admissível para manutenção da relação; \
  (e) o indeferimento definitivo da regularização fundiária nas hipóteses e condições especificamente previstas no instrumento, desde que a causa do indeferimento não decorra de ato ou omissão imputável à parte que pretenda invocá-lo; e \
  (f) o distrato formal celebrado por mútuo acordo entre as partes.

§ 1º. Sempre que a causa de resolução decorrer de inadimplemento sanável, a resolução somente produzirá efeitos após observados a notificação e o prazo de cura previstos neste instrumento, ressalvadas as hipóteses de inadimplemento grave ou de impossibilidade de saneamento.

§ 2º. A resolução por inadimplemento não se confunde com distrato por mútuo acordo, que dependerá de manifestação expressa e escrita de todas as partes envolvidas.

10.2. RESOLUÇÃO POR CULPA OU INADIMPLEMENTO DO(A) CESSIONÁRIO(A). Verificada a hipótese prevista na Cláusula 10.1(a) (três parcelas vencidas e não sanadas nos termos da Cláusula 9.3) ou outra infração contratual que autorize a resolução por culpa do(a) CESSIONÁRIO(A), o contrato poderá ser resolvido mediante notificação formal, retornando a posse ao CEDENTE e aplicando-se o procedimento de retenção, comercialização e restituição estabelecido nesta Cláusula.

*10.2.1. Na hipótese de resolução motivada por culpa ou inadimplemento do(a) CESSIONÁRIO(A), o CEDENTE poderá reter, a título de cláusula penal compensatória e prefixação das perdas e danos decorrentes especificamente da resolução, o equivalente a 20% (vinte por cento) da totalidade dos valores efetivamente pagos pelo(a) CESSIONÁRIO(A) até a data da resolução, incluindo valores pagos a título de entrada ou sinal, desde que estes integrem economicamente a remuneração contratual.*

§ 1º. O saldo correspondente a 80% (oitenta por cento) dos valores efetivamente pagos pelo(a) CESSIONÁRIO(A), descontados apenas os valores que este instrumento expressamente qualifique como não restituíveis, constituirá crédito líquido contratual do(a) CESSIONÁRIO(A).

§ 2º. A retenção prevista nesta Cláusula não poderá ser utilizada cumulativamente para compensar os mesmos prejuízos que já tenham sido abrangidos pela cláusula penal, sendo vedada a cobrança em duplicidade de despesas, multas ou indenizações com idêntica finalidade econômica.

§ 3º. A redução judicial da cláusula penal, quando cabível nos termos da legislação civil, não constitui renúncia prévia das partes à aplicação da penalidade, mas observância ao regime legal aplicável.

*10.2.2. A cláusula penal prevista na Cláusula 10.2.1 destina-se exclusivamente à compensação, conforme o caso concreto, de prejuízos decorrentes da resolução, inclusive fruição do imóvel, despesas administrativas diretamente relacionadas à contratação originária e outros custos comprovadamente vinculados ao inadimplemento, sem prejuízo da vedação de duplicidade de cobrança.*

10.2.3. RESTITUIÇÃO DO SALDO AO(À) CESSIONÁRIO(A). Formalizada a resolução por culpa ou inadimplemento do(a) CESSIONÁRIO(A) e efetivamente restituída a posse ao CEDENTE, o saldo restitutível previsto na Cláusula 10.2.1 deverá ser apurado e reconhecido documentalmente no prazo máximo de 15 (quinze) dias úteis.

§ 1º. A nova comercialização do imóvel poderá ser utilizada como mecanismo operacional para geração dos recursos necessários à restituição, mas a restituição NÃO ficará indefinidamente condicionada à venda do imóvel.

§ 2º. O CEDENTE deverá iniciar a comercialização do imóvel no prazo máximo de 30 (trinta) dias corridos contados da efetiva desocupação e restituição da posse, mediante divulgação por meios habituais do mercado e, quando conveniente, intermediação profissional.

§ 3º. O preço de oferta inicial deverá ser fixado com base em avaliação de mercado realizada por corretor de imóveis regularmente inscrito no CRECI, por empresa de avaliação ou por outro profissional tecnicamente habilitado, ou mediante média de pelo menos 2 (duas) avaliações independentes quando houver disponibilidade razoável desses profissionais.

§ 4º. O CEDENTE não poderá fixar deliberadamente preço artificialmente elevado nem adotar conduta que, de forma injustificada, dificulte ou impeça a venda.

§ 5º. Decorridos 180 (cento e oitenta) dias sem conclusão da nova alienação, o preço de oferta deverá ser reavaliado com base nas condições reais de mercado, registrando-se a alteração e o respectivo fundamento.

§ 6º. O CEDENTE deverá empregar esforços efetivos e razoáveis para a comercialização, podendo o(a) CESSIONÁRIO(A), mediante solicitação escrita não mais frequente que uma vez a cada 60 (sessenta) dias, receber informações objetivas sobre o andamento da comercialização, incluindo meios utilizados para divulgação, preço de oferta vigente e, se houver, propostas formalmente recebidas.

§ 7º. Eventuais despesas de intermediação e custos diretamente vinculados à nova alienação somente poderão ser deduzidos do produto da nova venda quando: \
  (a) forem efetivamente pagos ou inequivocamente devidos; \
  (b) forem documentalmente comprovados; \
  (c) forem lícitos e diretamente relacionados à nova operação; e \
  (d) não tiverem sido anteriormente considerados ou compensados pela cláusula penal da Cláusula 10.2.1.

10.2.3.1. VENDA À VISTA. Sendo o imóvel alienado mediante pagamento à vista, o CEDENTE deverá repassar ao(à) CESSIONÁRIO(A) o saldo restitutível que ainda estiver pendente no prazo máximo de 15 (quinze) dias úteis contados do efetivo recebimento dos respectivos recursos, observadas as deduções expressamente permitidas por este instrumento.

10.2.3.2. VENDA PARCELADA. Sendo a nova alienação realizada mediante pagamento parcelado, o CEDENTE poderá efetuar os repasses ao(à) CESSIONÁRIO(A) de forma proporcional aos valores efetivamente recebidos do novo adquirente, no prazo máximo de 15 (quinze) dias úteis após cada recebimento.

*10.2.3.3. PRAZO MÁXIMO DE RESTITUIÇÃO. Independentemente da realização ou não da nova venda, o saldo restitutível integralmente apurado deverá ser pago pelo CEDENTE ao(à) CESSIONÁRIO(A) no prazo máximo de 12 (doze) meses contados da efetiva restituição da posse ao CEDENTE.*

§ 1º. A existência de negociação, anúncio, proposta ou expectativa de venda não prorrogará o prazo máximo previsto nesta Cláusula.

§ 2º. Caso, ao final do prazo previsto no caput, ainda exista saldo não restituído, o CEDENTE deverá quitá-lo com recursos próprios, sem prejuízo do direito de prosseguir com a comercialização do imóvel posteriormente.

10.2.3.4. PRESTAÇÃO DE CONTAS. Por ocasião de cada repasse e, obrigatoriamente, na data de quitação do saldo, o CEDENTE entregará ao(à) CESSIONÁRIO(A) demonstrativo escrito contendo: \
  (a) o valor total efetivamente pago durante a vigência do contrato; \
  (b) o valor correspondente à retenção de 20% (vinte por cento); \
  (c) o saldo líquido inicialmente apurado para restituição; \
  (d) o valor da nova alienação, quando realizada; \
  (e) os valores efetivamente recebidos do novo adquirente; \
  (f) a discriminação individualizada de despesas deduzidas; \
  (g) os respectivos comprovantes, quando exigidos pelo(a) CESSIONÁRIO(A); e \
  (h) o valor efetivamente repassado e o saldo remanescente, se houver.

10.2.3.5. INSUFICIÊNCIA OU EXCEDENTE DO PRODUTO DA NOVA VENDA.

§ 1º. O direito do(a) CESSIONÁRIO(A) à restituição decorre do saldo contratualmente apurado e não do preço obtido pelo CEDENTE na futura alienação.

§ 2º. Caso o produto líquido da nova alienação seja inferior ao saldo contratualmente devido ao(à) CESSIONÁRIO(A), o CEDENTE continuará responsável pelo pagamento da diferença, observado o prazo máximo estabelecido na Cláusula 10.2.3.3.

§ 3º. Caso o produto líquido da nova alienação seja superior ao saldo devido ao(à) CESSIONÁRIO(A), o excedente pertencerá ao CEDENTE, desde que a alienação tenha observado os critérios objetivos de mercado previstos nesta Cláusula e não tenha ocorrido fraude, simulação ou subavaliação deliberada.

10.2.4. Havendo pluralidade de cessionários, a resolução da parcela ou da posição contratual de um deles não afetará, por si só, a relação jurídica relativa aos demais, desde que as obrigações e os direitos de cada posição contratual sejam autônomos e individualizáveis.

10.3. DA RESPONSABILIDADE DO CEDENTE POR DECLARAÇÃO FALSA, FRAUDE OU OMISSÃO DELIBERADA. Caso se comprove que, na data da assinatura deste instrumento, o CEDENTE: \
  (a) prestou declaração materialmente falsa sobre fato relevante de seu conhecimento; \
  (b) omitiu deliberadamente informação relevante sobre cessão anterior, oneração, constrição, oposição ou reivindicação de terceiro de que tivesse conhecimento; \
  (c) realizou cessão duplicada ou incompatível da mesma posse; ou \
  (d) praticou ato doloso ou fraudulento destinado a induzir o(a)(s) CESSIONÁRIO(A)(S) em erro quanto à situação possessória objeto deste contrato, \
  o(a)(s) CESSIONÁRIO(A)(S) poderá(ão) requerer a resolução do contrato, fazendo jus à restituição integral e monetariamente atualizada dos valores efetivamente pagos, acrescida da indenização pelas benfeitorias indenizáveis comprovadamente realizadas, observado o regime contratual previsto neste instrumento e a legislação aplicável.

10.3.1. A mera existência ou posterior descoberta de oposição, reivindicação, pretensão ou direito de terceiro que não fosse do conhecimento do CEDENTE na data da assinatura e que não tenha sido deliberadamente ocultado não caracterizará, por si só, inadimplemento ou culpa contratual do CEDENTE, devendo o fato ser apurado quanto à sua origem, anterioridade, conhecimento e imputabilidade.

§ 1º. Nas hipóteses deste item, serão aplicadas, conforme o caso, as regras de alocação de risco, impossibilidade de regularização e perda da posse previstas neste instrumento.

10.3.2. A responsabilidade prevista na Cláusula 10.3 não exclui outros direitos legalmente assegurados quando houver dolo ou fraude comprovados.

§ 1º. Na ausência de dolo ou fraude, as consequências indenizatórias observarão a extensão efetivamente comprovada do dano e não haverá cumulação de penalidades com idêntica finalidade.

§ 2º. Havendo dolo, fraude, cessão duplicada ou ocultação deliberada, a multa prevista na Cláusula 10.3.3 poderá coexistir com perdas e danos suplementares quando estes forem expressamente comprovados e não estiverem abrangidos pela própria multa, observada a legislação civil aplicável.

10.3.3. Comprovado dolo, fraude, cessão duplicada ou ocultação deliberada nas hipóteses previstas na Cláusula 10.3, será devida ao(à)(s) CESSIONÁRIO(A)(S), além da restituição integral e corrigida dos valores pagos e das benfeitorias indenizáveis cabíveis, multa penal de 10% (dez por cento) sobre o valor total nominal do contrato, sem prejuízo de perdas e danos suplementares comprovados quando juridicamente cabíveis.

10.3.4. PERDA DA POSSE E EVICÇÃO. Caso o(a)(s) CESSIONÁRIO(A)(S) venha(m) a perder total ou parcialmente a posse do imóvel em razão de decisão judicial ou administrativa que reconheça direito anterior de terceiro, a responsabilidade do CEDENTE será determinada de acordo com a origem, anterioridade, conhecimento e imputabilidade do fato. \
  (a) Se a perda decorrer de fato, ato, omissão, cessão anterior, oneração, falsidade, fraude ou declaração materialmente falsa imputável ao CEDENTE, serão aplicáveis os direitos de resolução, restituição integral e corrigida dos valores pagos, indenização pelas benfeitorias indenizáveis e, quando cabível, a multa penal prevista nas Cláusulas 10.3.2 e 10.3.3. \
  (b) Se a perda decorrer de direito anterior de terceiro que não fosse conhecido do CEDENTE e que não tenha sido deliberadamente ocultado, não haverá, por esse único fato, presunção de culpa do CEDENTE, sendo assegurada ao(à)(s) CESSIONÁRIO(A)(S), conforme o caso e a natureza jurídica do evento, a restituição integral e corrigida dos valores pagos e o tratamento contratual aplicável à impossibilidade de manutenção da relação. \
  (c) Em qualquer hipótese de perda parcial, a extensão da restituição, das indenizações e das demais consequências deverá observar a proporção efetivamente atingida, salvo quando a parcela remanescente se mostrar economicamente ou juridicamente inútil ao objeto contratual.

10.4. ALTERNATIVAMENTE À RESOLUÇÃO, o CEDENTE poderá promover a cobrança judicial das obrigações pecuniárias certas, líquidas e exigíveis, desde que permaneça vigente o contrato e que a cobrança não corresponda ao mesmo fundamento econômico já compensado por cláusula penal de resolução.

§ 1º. Na hipótese de cobrança judicial sem resolução, o(a) CESSIONÁRIO(A) responderá pelo principal atualizado, pelos encargos de mora previstos na Cláusula 9.1 e pelas despesas processuais e honorários advocatícios fixados judicialmente, na forma da legislação processual.

§ 2º. Este instrumento poderá ser utilizado como título executivo extrajudicial quando, na forma definitiva e consideradas as formalidades legalmente exigidas, estiverem presentes os requisitos de certeza, liquidez e exigibilidade da obrigação e os requisitos formais previstos no Código de Processo Civil.

10.5. Em qualquer hipótese de resolução, os valores comprovadamente pagos pelo CEDENTE para quitar débitos anteriores à imissão na posse do(a) CESSIONÁRIO(A), quando contratualmente atribuídos ao(à) CESSIONÁRIO(A) e documentalmente comprovados, poderão ser compensados ou excluídos do saldo restituível na exata medida em que este instrumento assim estabelecer, vedada, em qualquer hipótese, a compensação em duplicidade.

Parágrafo único. Sempre que houver exclusão, compensação ou dedução de valores, o CEDENTE deverá apresentar documentação idônea que demonstre a origem, o valor e a efetiva utilização do montante.


// ============================================================================
// CAPÍTULO XI – DA EVICÇÃO, DA PERDA DA POSSE E DA VERACIDADE DAS DECLARAÇÕES DO CEDENTE
// ============================================================================
#section_heading("CAPÍTULO XI – DA EVICÇÃO, DA PERDA DA POSSE E DA VERACIDADE DAS DECLARAÇÕES DO CEDENTE")

11.1. O CEDENTE responderá, nos limites deste instrumento e da legislação aplicável, pelas consequências decorrentes da perda da posse quando esta tiver origem em fato, ato, omissão, cessão anterior, oneração, declaração materialmente falsa, fraude ou outro comportamento juridicamente imputável ao CEDENTE.

§ 1º. A responsabilidade do CEDENTE será aferida considerando-se, entre outros elementos: \
  (a) a anterioridade do direito ou fato em relação à assinatura; \
  (b) o conhecimento efetivo ou razoavelmente exigível do CEDENTE; \
  (c) a existência de comunicação prévia ao CEDENTE; \
  (d) a eventual omissão deliberada de informação relevante; e \
  (e) o nexo entre o fato e a perda total ou parcial da posse.

11.1.1. A perda total ou parcial da posse decorrente de direito anterior de terceiro que não fosse conhecido do CEDENTE na data da assinatura e que não tenha sido por ele deliberadamente ocultado não caracterizará, isoladamente, inadimplemento contratual ou culpa do CEDENTE.

Parágrafo único. Nessa hipótese, serão observadas as regras deste instrumento relativas à impossibilidade de regularização, à perda da posse e à resolução, conforme a causa e os efeitos concretamente verificados.

11.1.2. A simples existência de herdeiro, sucessor, titular registral ou terceiro que posteriormente apresente pretensão, oposição ou reivindicação sobre o imóvel não implicará automaticamente responsabilidade indenizatória do CEDENTE.

Parágrafo único. Deverão ser apuradas a origem da pretensão, sua anterioridade, a ciência do CEDENTE, eventual omissão deliberada e o nexo causal entre o fato e a perda ou restrição efetivamente suportada pelo(a)(s) CESSIONÁRIO(A)(S).

11.1.3. Nas hipóteses em que a perda da posse não decorrer de dolo, fraude, cessão duplicada ou ocultação deliberada do CEDENTE, eventual responsabilidade deste será limitada às consequências expressamente previstas neste instrumento e à extensão efetivamente demonstrada do prejuízo, vedada a cumulação de múltiplas penalidades destinadas a compensar o mesmo dano.

11.1.4. A existência de procedimento de usucapião, REURB, regularização administrativa, ação judicial ou qualquer outro mecanismo de reconhecimento ou regularização do direito possessório não constitui garantia de resultado por parte do CEDENTE.

Parágrafo único. As obrigações do CEDENTE relacionadas à cooperação, entrega de documentos, prestação de informações ou prática de atos necessários serão de meio, salvo quando este instrumento expressamente estabelecer obrigação de resultado determinada e juridicamente possível.

11.1.5. O CEDENTE obriga-se a comunicar ao(à)(s) CESSIONÁRIO(A)(S), no prazo máximo de 10 (dez) dias corridos contados da ciência, qualquer notificação, ação judicial, reivindicação, oposição, embargo, constrição ou pretensão formal de terceiro relacionada à posse objeto deste instrumento, quando conhecida durante a vigência contratual.

11.2. DA RESPONSABILIDADE POR PERDA DA POSSE E DA EVENTUAL EVICÇÃO. As partes reconhecem que o objeto deste instrumento é a cessão de direitos possessórios, de modo que eventual aplicação do regime jurídico da evicção deverá ser compatibilizada com a natureza possessória da relação e com a causa concreta da perda da posse.

§ 1º. Quando juridicamente caracterizada hipótese de evicção ou de perda de direito com fundamento no regime legal aplicável, serão observadas as disposições dos arts. 447 a 457 do Código Civil naquilo que forem compatíveis com a natureza do negócio celebrado e sem prejuízo da disciplina contratual específica estabelecida neste Capítulo.

§ 2º. A eventual regularização futura da situação possessória, inclusive por usucapião ou REURB, não exclui nem cria automaticamente responsabilidade do CEDENTE; a responsabilidade será determinada conforme a causa concreta do prejuízo e as disposições deste instrumento.

§ 3º. Havendo decisão definitiva que reconheça direito anterior de terceiro e provoque perda total ou substancial da posse, serão aplicadas, conforme o caso, as consequências previstas na Cláusula 10.3.4.

11.3. COOPERAÇÃO E MITIGAÇÃO DO PREJUÍZO. Verificada ameaça concreta de perda da posse ou de restrição relevante ao exercício possessório, as partes deverão cooperar de boa-fé para a preservação de direitos, produção de provas, obtenção de documentos e adoção de medidas administrativas ou judiciais razoáveis.

§ 1º. Nenhuma das partes poderá, deliberadamente, agravar o prejuízo ou criar obstáculos artificiais à defesa dos direitos envolvidos.

§ 2º. As despesas extraordinárias decorrentes de medidas de defesa somente serão imputadas a uma das partes quando houver previsão contratual específica, ato de responsabilidade comprovada ou determinação legal ou judicial.

11.4. DECLARAÇÕES E RESPONSABILIDADE PELA VERACIDADE. O CEDENTE declara, sob sua responsabilidade, que as informações e documentos por ele fornecidos relacionados à posse são verdadeiros segundo seu conhecimento e que não omitirá deliberadamente fato relevante de que tenha ciência e que possa influenciar a aquisição ou o exercício dos direitos possessórios objeto deste instrumento.

Parágrafo único. A responsabilidade prevista nesta Cláusula não alcança fatos futuros ou fatos de terceiro desconhecidos do CEDENTE, salvo quando houver prova de que o CEDENTE deles tinha conhecimento ou concorreu para sua ocorrência.

11.5. As disposições deste Capítulo deverão ser interpretadas em conjunto com os princípios da boa-fé objetiva, cooperação, equilíbrio contratual, conservação dos negócios jurídicos e vedação ao enriquecimento sem causa, sempre preservando a finalidade econômica lícita do instrumento e a reparação proporcional ao dano efetivamente demonstrado.


// ============================================================================
// CAPÍTULO XII – DO CASO FORTUITO E DA FORÇA MAIOR
// ============================================================================
#section_heading("CAPÍTULO XII – DO CASO FORTUITO E DA FORÇA MAIOR")

12.1. Nenhuma das partes responderá por descumprimento de obrigação decorrente de caso fortuito ou força maior, assim entendido o fato necessário, imprevisível ou inevitável, cujos efeitos não era possível evitar ou impedir, nos termos do art. 393 do Código Civil, não se caracterizando como tal a paralisação do processo de regularização fundiária decorrente de omissão, documento incorreto, irregularidade ou inadimplemento imputável a qualquer das partes. Configurado o caso fortuito ou força maior, nos termos acima, este poderá decorrer, exemplificativamente, de decisão administrativa ou judicial superveniente não provocada pelas partes, calamidade pública ou determinação de autoridade competente.

12.2. Verificado o evento de força maior, os prazos deste instrumento ficarão suspensos pelo tempo correspondente, devendo a parte impedida comunicar o fato à outra por escrito, no prazo de 10 (dez) dias a contar de seu conhecimento.


// ============================================================================
// CAPÍTULO XIII – DA PROTEÇÃO DE DADOS PESSOAIS
// ============================================================================
#section_heading("CAPÍTULO XIII – DA PROTEÇÃO DE DADOS PESSOAIS")

13.1. Os dados pessoais das partes e testemunhas constantes deste instrumento serão tratados exclusivamente para fins de formalização, execução, registro e eventual defesa de direitos relacionados a este contrato, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais).

13.2. As partes comprometem-se a manter sigilo sobre os dados pessoais uns dos outros a que tiverem acesso em razão deste contrato, não os utilizando para finalidade diversa nem os compartilhando com terceiros sem autorização ou amparo legal, ressalvado o compartilhamento necessário à execução deste contrato, inclusive com a Prefeitura Municipal, o Cartório de Registro de Imóveis, o Tabelionato de Notas, profissionais habilitados, a câmara ou o(s) árbitro(s) escolhidos e advogados das partes.

13.3. Para os fins da Lei nº 13.709/2018, cada parte é responsável pelo tratamento de dados pessoais que realizar por decisão própria quanto às finalidades e aos meios do tratamento, figurando o CEDENTE como controlador dos dados pessoais cujo tratamento ele efetivamente decida, em regra os necessários à execução deste contrato e ao cumprimento de obrigação legal ou regulatória (art. 7º, incisos II e V, da referida Lei). Os dados serão conservados pelo prazo necessário ao cumprimento das obrigações contratuais, fiscais e de eventual defesa em processo judicial, administrativo ou arbitral, observados os prazos prescricionais aplicáveis.

13.4. O titular dos dados pode exercer, mediante solicitação ao CEDENTE pelos meios de contato informados na Cláusula 1, os direitos previstos no art. 18 da Lei nº 13.709/2018, incluindo confirmação de tratamento, acesso, correção, anonimização ou eliminação de dados desnecessários ou tratados em desconformidade com a lei, observadas as hipóteses de retenção legítima de dados previstas na própria Lei.


// ============================================================================
// CAPÍTULO XIV – DA MEDIAÇÃO, DA ARBITRAGEM E DO FORO
// ============================================================================
#section_heading("CAPÍTULO XIV – DA MEDIAÇÃO, DA ARBITRAGEM E DO FORO")

14.1. As partes elegem, como forma preferencial de solução de controvérsias relativas a este contrato, a mediação, a ser conduzida por mediador ou câmara de mediação de escolha consensual, no prazo de até 30 (trinta) dias a contar da notificação da controvérsia, sem prejuízo da adoção imediata, por qualquer das partes, das medidas judiciais ou arbitrais de urgência cabíveis, quando necessárias para evitar dano grave ou de difícil reparação.

14.2. Não solucionado o conflito pela mediação, as partes poderão convencionar, mediante compromisso arbitral específico, a submissão do litígio à arbitragem, nos termos da Lei nº 9.307/1996, hipótese em que deverão ser definidos, no respectivo compromisso: a câmara arbitral escolhida, o número de árbitros, a forma de custeio das despesas arbitrais e o direito aplicável.

*14.3. Não havendo consenso quanto à arbitragem, ou nas hipóteses em que a lei exija a via judicial, fica eleito o foro da Comarca de Itatiaia/RJ (município de situação do imóvel, conforme Cláusulas 2.2 e 3.1) para dirimir quaisquer questões oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.*


// ============================================================================
// CAPÍTULO XV – DAS CUSTAS E HONORÁRIOS EM CASO DE LITÍGIO
// ============================================================================
#section_heading("CAPÍTULO XV – DAS CUSTAS E HONORÁRIOS EM CASO DE LITÍGIO")

15.1. As custas processuais e os honorários advocatícios, em qualquer demanda judicial relativa a este contrato, serão suportados pela parte vencida, na proporção de seu decaimento, nos termos da legislação processual aplicável. Na arbitragem, as despesas, custas e honorários observarão a convenção arbitral, o regulamento da instituição escolhida e a decisão do tribunal arbitral, não se aplicando atribuição prévia e automática de responsabilidade a qualquer das partes independentemente do resultado do litígio.


// ============================================================================
// CAPÍTULO XVI – DA ASSINATURA ELETRÔNICA E DA ATUALIZAÇÃO CADASTRAL
// ============================================================================
#section_heading("CAPÍTULO XVI – DA ASSINATURA ELETRÔNICA E DA ATUALIZAÇÃO CADASTRAL")

16.1. As partes reconhecem, desde já, a validade jurídica, a autenticidade e a força probante da assinatura eletrônica aposta a este instrumento, quando firmado por meio de plataforma de assinatura eletrônica de escolha das partes (ex.: #get_val("plataformaAssinatura", "PLATAFORMA DE ASSINATURA")), nos termos do art. 10, §2º, da Medida Provisória nº 2.200-2/2001, e da Lei nº 14.063/2020, sendo dispensado o reconhecimento de firma em cartório para a validade entre as partes.

16.2. Consideram-se válidas, para fins de celebração e prova deste contrato entre as partes, as assinaturas eletrônicas nas modalidades simples, avançada ou qualificada (certificado ICP-Brasil), sem prejuízo de exigências adicionais de forma que o Registro de Imóveis, o Tabelionato de Notas ou outro órgão competente venham a exigir para os atos de sua respectiva competência, sendo de responsabilidade exclusiva de cada parte a guarda de suas credenciais de acesso à plataforma escolhida, bem como a conferência dos dados do documento antes de assinar.

16.3. Caso este instrumento, ou a cessão de posse nele formalizada, precise ser levado a registro em Cartório de Registro de Imóveis ou de Títulos e Documentos, ou submetido a exigência de reconhecimento de firma por órgão público, as partes comprometem-se a comparecer perante tabelião, quando solicitadas, para as formalidades adicionais eventualmente exigidas, sem que isso afete a validade e a eficácia do contrato já firmado eletronicamente entre elas.

16.4. Cada parte declara e se obriga a manter atualizados, durante toda a vigência deste contrato e até a quitação integral das obrigações dele decorrentes, o endereço de e-mail, o número de telefone/WhatsApp e o endereço residencial informados na Cláusula 1, comunicando à outra parte, por escrito, qualquer alteração no prazo de até 10 (dez) dias contados da mudança.

16.5. Toda comunicação, notificação, cobrança ou aviso previsto neste contrato poderá ser validamente realizado por e-mail ou por mensagem de texto/aplicativo de mensagens (WhatsApp ou similar) dirigido ao endereço eletrônico e ao número de telefone informados na Cláusula 1 ou posteriormente atualizados na forma da Cláusula 16.4, presumindo-se recebida a comunicação, para fins meramente informativos ou de rotina: (a) em se tratando de e-mail, na data de seu envio, salvo prova de erro de transmissão apresentada pelo destinatário; e (b) em se tratando de mensagem por aplicativo, no momento em que exibido o status de entrega/leitura ou equivalente pela plataforma utilizada. Para a constituição em mora (Cláusula 9.2), a notificação de rescisão ou distrato (Capítulo X) e a comunicação de instauração de procedimento arbitral, exige-se comprovação objetiva do efetivo recebimento pelo destinatário, não bastando a presunção prevista nesta Cláusula.

16.6. A parte que deixar de atualizar seus dados de contato na forma da Cláusula 16.4 não poderá alegar, em seu benefício, desconhecimento de comunicação enviada aos dados anteriormente informados, presumindo-se válida e eficaz a notificação assim realizada.


// ============================================================================
// CAPÍTULO XVII – DISPOSIÇÕES GERAIS
// ============================================================================
#section_heading("CAPÍTULO XVII – DISPOSIÇÕES GERAIS")

*17.1. DA VIGÊNCIA, DO CUMPRIMENTO E DA SOBREVIVÊNCIA DAS OBRIGAÇÕES.* Este contrato entra em vigor na data de sua assinatura e permanecerá vigente até o cumprimento integral ou a extinção das obrigações dele decorrentes, observados, conforme o caso, a quitação integral do preço, o cumprimento das obrigações de cooperação e das providências necessárias à regularização da situação possessória ou à adoção da via juridicamente cabível.

§ 1º. A tramitação, demora ou pendência de procedimento perante órgão público, serventia extrajudicial, profissional habilitado ou terceiro não vinculado às partes não constituirá, por si só, inadimplemento nem manterá indefinidamente obrigações já integralmente cumpridas, sem prejuízo daquelas que ainda dependerem de ato ou cooperação de responsabilidade de qualquer das partes.

§ 2º. Permanecerão vigentes, após o cumprimento ou extinção das obrigações principais, pelo período necessário à sua satisfação e nos limites de sua natureza, as obrigações relativas à restituição de valores, indenizações, responsabilidade por perda da posse ou evicção, tributos e encargos pretéritos, prestação de contas, guarda e disponibilização de documentos, proteção de dados, solução de controvérsias e demais obrigações que, por sua natureza ou por expressa previsão contratual, devam subsistir.

§ 3º. A vigência deste contrato não constitui garantia de deferimento, aprovação, registro, reconhecimento de propriedade ou conclusão de procedimento de usucapião, REURB ou outra modalidade de regularização cuja decisão dependa de autoridade pública, serventia, profissional legalmente habilitado ou terceiro.

*17.2. DA BOA-FÉ, DA PROBIDADE, DA FUNÇÃO SOCIAL E DA COOPERAÇÃO.* As partes obrigam-se a executar este contrato de acordo com os princípios da boa-fé objetiva, da probidade e da função social do contrato, nos termos dos arts. 421 e 422 do Código Civil, adotando comportamento leal, transparente e cooperativo durante toda a relação contratual.

Parágrafo único. O dever de cooperação compreende, conforme a responsabilidade de cada parte, a prestação tempestiva de informações, entrega de documentos, comparecimento a atos necessários, comunicação de fatos relevantes e adoção de medidas razoáveis para evitar ou reduzir prejuízos relacionados ao objeto deste contrato, vedada a criação deliberada de obstáculos ao seu cumprimento ou à regularização da situação possessória.

*17.3. DA INTERPRETAÇÃO E DAS CLÁUSULAS DE DESTAQUE.* Este instrumento decorre da negociação e adaptação das partes às condições específicas do imóvel, da situação possessória e da operação contratada, devendo suas disposições ser interpretadas de acordo com a intenção negocial manifestada, a boa-fé, a natureza do negócio e as regras previstas na legislação civil, especialmente nos arts. 112 e 113 do Código Civil.

§ 1º. Em caso de aparente divergência entre disposição geral e disposição específica, prevalecerá a disposição específica quanto ao fato, obrigação, despesa, risco ou procedimento por ela diretamente disciplinado, sem prejuízo da interpretação sistemática do contrato.

§ 2º. Permanecerão graficamente destacadas na versão final do instrumento as cláusulas que estabeleçam limitação relevante de direitos, retenção ou perda de valores, cláusula penal, alocação especial de riscos, obrigações extraordinárias, hipóteses de resolução ou eleição de foro, de modo a assegurar sua visualização e ciência antes da assinatura.

§ 3º. O destaque gráfico não importa renúncia a direito indisponível, não impede o controle de validade ou eficácia pelas autoridades competentes e não afasta a aplicação de normas cogentes.

*17.4. DA VINCULAÇÃO DAS PARTES E DOS SUCESSORES.* Este instrumento obriga as partes, seus herdeiros e sucessores, na medida em que os direitos e obrigações nele previstos sejam transmissíveis, observados a natureza da obrigação, os limites da sucessão e a legislação aplicável.

Parágrafo único. As obrigações de caráter personalíssimo ou que, por disposição legal ou natureza jurídica, não sejam transmissíveis não se estenderão automaticamente aos sucessores.

*17.5. DAS ALTERAÇÕES, DOS ADITIVOS E DAS ATUALIZAÇÕES DOCUMENTAIS.* Qualquer alteração que modifique o objeto, preço, forma de pagamento, direitos, obrigações, responsabilidades, garantias, penalidades, alocação de riscos, hipóteses de resolução ou outro elemento material deste contrato somente será válida se formalizada por escrito, mediante termo aditivo assinado por todas as partes cuja posição jurídica seja afetada.

§ 1º. A substituição ou atualização de certidões, comprovantes, documentos técnicos, relatórios, protocolos ou outros documentos que não alterem direitos ou obrigações materiais poderá ser realizada por termo de atualização ou protocolo documental, desde que identificado o documento, sua data, versão, finalidade e vinculação ao presente contrato.

§ 2º. Nenhuma atualização de anexo poderá alterar unilateralmente o conteúdo material deste contrato ou substituir obrigação estabelecida em termo aditivo regularmente celebrado.

*17.6. DA TOLERÂNCIA E DA AUSÊNCIA DE RENÚNCIA.* A eventual tolerância de qualquer das partes quanto ao descumprimento ou cumprimento imperfeito de qualquer disposição deste contrato não constituirá novação, alteração contratual, renúncia, remissão ou precedente obrigatório, salvo manifestação expressa e escrita em sentido diverso.

Parágrafo único. A aceitação pontual de pagamento, documento, prazo ou providência em condições diversas das originalmente previstas não impedirá a exigência futura das demais obrigações contratuais, ressalvados os direitos que tenham sido validamente modificados por escrito.

*17.7. DA NULIDADE OU INEFICÁCIA PARCIAL.* Caso qualquer disposição deste instrumento seja declarada nula, inválida, inexigível ou ineficaz, total ou parcialmente, por decisão judicial, arbitral ou determinação de autoridade competente, as demais disposições permanecerão válidas e eficazes na máxima extensão admitida pela legislação.

Parágrafo único. As partes buscarão, de boa-fé, substituir a disposição afetada por outra juridicamente válida que preserve, tanto quanto possível, sua finalidade econômica e jurídica, sem reproduzir o vício que tenha determinado sua invalidação, permanecendo aplicável, na ausência de substituição válida, a disciplina legal pertinente.

*17.8. DOS ANEXOS E DA INTEGRAÇÃO DOCUMENTAL.* Integram este contrato, para todos os fins, os anexos expressamente identificados neste instrumento, observada a seguinte classificação: \
  \
  *Anexo I – Documentação do regime de bens, estado civil e anuências do CEDENTE*, quando juridicamente pertinentes; \
  *Anexo II – Documentação imobiliária, fiscal, registral e de diligência*, incluindo certidão atualizada da matrícula perante o Cartório de Registro de Imóveis, certidões fiscais e negativas imobiliárias; \
  *Anexo III – Documentação da origem e da cadeia possessória*, contendo os elementos disponíveis relativos ao início, continuidade, natureza, exercício e transmissão da posse, com identificação dos respectivos possuidores e períodos; \
  *Anexo IV – Documentação da regularização*, compreendendo, conforme o procedimento adotado, documentos de análise de viabilidade, usucapião, REURB, requerimentos, plantas, memoriais, atas notariais, protocolos, exigências, decisões e demais atos administrativos, notariais, registrais ou técnicos produzidos durante a execução contratual.

§ 1º. Os anexos obrigatórios para a celebração (Anexos I, II e III) deverão estar disponíveis, identificados e vinculados ao instrumento na data da celebração, não sendo admissível deixar em aberto seu conteúdo material essencial.

§ 2º. Os documentos produzidos posteriormente serão incorporados ao Anexo IV por termo de atualização, protocolo documental ou mecanismo eletrônico equivalente que permita identificar o documento, sua data, versão e relação com o procedimento correspondente.

§ 3º. A ausência de documento exigido pela legislação, autoridade, serventia ou profissional competente não será suprida pela simples previsão desta cláusula, devendo ser obtido o documento ou adotado o meio juridicamente admitido no caso concreto.

*17.9. DA CELEBRAÇÃO, DAS ASSINATURAS E DA FORÇA PROBATÓRIA.* Este instrumento poderá ser celebrado em meio físico ou eletrônico, conforme a modalidade admitida pela legislação aplicável, produzindo efeitos entre os signatários a partir da conclusão válida de sua assinatura.

§ 1º. Na modalidade física, o instrumento será assinado pelas partes, pelo(a) cônjuge ou companheiro(a) anuente, quando aplicável, pela ASPPIBRA, na qualidade definida neste contrato, e por 3 (três) testemunhas, em 2 (duas) vias de igual teor e forma, para fins de reforço probatório e observância das formalidades pactuadas.

§ 2º. Na modalidade eletrônica, poderão ser utilizadas assinaturas eletrônicas admitidas pela legislação aplicável, observados os requisitos específicos do ato e eventuais exigências do órgão público, serventia extrajudicial, instituição financeira ou terceiro perante o qual o instrumento venha a ser apresentado.

§ 3º. A plataforma de assinatura eletrônica utilizada deverá, sempre que tecnicamente disponível, preservar a versão integral do documento, a identificação dos signatários, a data e hora da assinatura e as evidências de autoria e integridade, inclusive do documento e de seus anexos.

§ 4º. A assinatura eletrônica não dispensa eventual formalidade adicional exigida por lei ou pela autoridade competente para ato posterior, inclusive reconhecimento de firma, procuração, instrumento público, registro ou apresentação perante serventia extrajudicial.

§ 5º. A eventual força executiva deste instrumento dependerá do preenchimento dos requisitos legais aplicáveis ao título e da certeza, liquidez e exigibilidade da obrigação que se pretenda cobrar.

*17.10. DO RECONHECIMENTO DE FIRMA, DO REGISTRO EM TÍTULOS E DOCUMENTOS E DA APRESENTAÇÃO PERANTE TERCEIROS.* Quando celebrado fisicamente, o reconhecimento de firma poderá ser realizado como medida adicional de segurança e comprovação de autoria, especialmente quando o instrumento for destinado à apresentação perante terceiros.

§ 1º. O instrumento poderá ser levado ao Registro de Títulos e Documentos quando juridicamente útil ou conveniente, inclusive para os efeitos que a legislação atribua a esse registro, sem que tal providência implique, por si só, transferência do domínio, constituição de direito real imobiliário, reconhecimento de usucapião ou substituição de ato que deva ser praticado no Registro de Imóveis.

§ 2º. O reconhecimento de firma, a autenticação, o registro em Títulos e Documentos ou a apresentação deste instrumento a qualquer serventia ou autoridade não constituem, por si sós, reconhecimento da propriedade, aprovação de REURB, reconhecimento de usucapião ou certificação da regularidade urbanística, ambiental, fiscal, possessória ou registral do imóvel.

§ 3º. Quando este instrumento for apresentado a órgão público, Registro de Imóveis, Tabelionato de Notas ou outra entidade competente, as partes comprometem-se a fornecer os documentos, assinaturas, reconhecimentos, procurações ou demais formalidades especificamente exigidos para o ato.

§ 4º. Nenhuma disposição deste capítulo será interpretada como renúncia antecipada à adoção de forma pública, registro, averbação, certificação, reconhecimento ou qualquer outra formalidade que seja legalmente exigível para determinado ato.

§ 5º. Este capítulo não altera a natureza jurídica da cessão de direitos possessórios estabelecida neste instrumento, não constitui transmissão de propriedade registral e não substitui qualquer requisito legal, técnico, administrativo, notarial ou registral exigível para a eventual regularização ou aquisição da propriedade.

// ============================================================================
// ENCERRAMENTO E ASSINATURAS
// ============================================================================
#v(12pt)
#block(width: 100%)[
  #set par(first-line-indent: 0pt)
  #align(center)[
    #text(weight: "bold", size: font_size_section, fill: color_primary)[
      #get_val("municipioAssinatura", "MUNICÍPIO DA ASSINATURA"), #get_val("diaAssinatura", "DIA") de #get_val("mesAssinatura", "MÊS") de #get_val("anoAssinatura", "ANO").
    ]
  ]
]

#v(14pt)
#section_heading("ASSINATURAS E VALIDAÇÃO DIGITAL")

#block(breakable: false, width: 100%, above: 8pt)[
  #set par(first-line-indent: 0pt)
  #grid(
    columns: (1fr, 1fr),
    gutter: 14pt,
    // 1. CEDENTE
    rect(width: 100%, stroke: 0.8pt + color_primary, radius: 3pt, inset: 10pt)[
      #align(center)[
        #v(8pt)
        #get_val("cedenteAssinatura", "ASSINATURA DO CEDENTE")
        #v(4pt)
        #line(length: 90%, stroke: 0.6pt + color_primary)
        #v(4pt)
        #text(weight: "bold", size: font_size_section, fill: color_primary)[CEDENTE] \
        #text(size: font_size_body)[#get_val("cedenteNome", "NOME COMPLETO DO CEDENTE")]
      ]
    ],
    // 2. CESSIONÁRIO(A)
    rect(width: 100%, stroke: 0.8pt + color_primary, radius: 3pt, inset: 10pt)[
      #align(center)[
        #v(8pt)
        #get_val("cessionarioAssinatura", "ASSINATURA DO CESSIONÁRIO")
        #v(4pt)
        #line(length: 90%, stroke: 0.6pt + color_primary)
        #v(4pt)
        #text(weight: "bold", size: font_size_section, fill: color_primary)[CESSIONÁRIO(A)] \
        #text(size: font_size_body)[#get_val("cessionarioNome", "NOME COMPLETO DO CESSIONÁRIO")]
      ]
    ],
    // 3. CÔNJUGE DO CEDENTE (outorgante/anuente)
    rect(width: 100%, stroke: 0.8pt + color_primary, radius: 3pt, inset: 10pt)[
      #align(center)[
        #v(8pt)
        #get_val("conjugeAssinatura", "ASSINATURA DO CÔNJUGE/COMPANHEIRO")
        #v(4pt)
        #line(length: 90%, stroke: 0.6pt + color_primary)
        #v(4pt)
        #text(weight: "bold", size: font_size_section, fill: color_primary)[CÔNJUGE DO CEDENTE (outorgante/anuente)] \
        #text(size: font_size_body)[#get_val("conjugeNome", "NOME DO CÔNJUGE DO CEDENTE")]
      ]
    ],
    // 4. INTERVENIENTE ASPPIBRA
    rect(width: 100%, stroke: 0.8pt + color_primary, radius: 3pt, inset: 10pt)[
      #align(center)[
        #v(8pt)
        #get_val("asppibraAssinatura", "ASSINATURA DO REPRESENTANTE DA ASPPIBRA")
        #v(4pt)
        #line(length: 90%, stroke: 0.6pt + color_primary)
        #v(4pt)
        #text(weight: "bold", size: font_size_section, fill: color_primary)[INTERVENIENTE ASPPIBRA] \
        #text(size: font_size_subtitle, weight: "bold")[#asppibra_razao_social_curta – CNPJ nº #asppibra_cnpj]
      ]
    ],
  )
]

#v(12pt)
#section_heading("TESTEMUNHAS INSTRUMENTÁRIAS")

#block(breakable: false, width: 100%, above: 8pt)[
  #set par(first-line-indent: 0pt)
  #grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 12pt,
    // Testemunha 1
    rect(width: 100%, stroke: 0.6pt + color_border, radius: 3pt, inset: 8pt)[
      #align(center)[
        #v(8pt)
        #get_val("testemunha1Assinatura", "ASSINATURA DA 1ª TESTEMUNHA")
        #v(4pt)
        #line(length: 90%, stroke: 0.5pt + color_secondary_text)
        #v(3pt)
        #text(weight: "bold", size: font_size_body, fill: color_primary)[TESTEMUNHA 1] \
        #text(size: font_size_subtitle)[#get_val("testemunha1Nome", "NOME DA 1ª TESTEMUNHA")]
      ]
    ],
    // Testemunha 2
    rect(width: 100%, stroke: 0.6pt + color_border, radius: 3pt, inset: 8pt)[
      #align(center)[
        #v(8pt)
        #get_val("testemunha2Assinatura", "ASSINATURA DA 2ª TESTEMUNHA")
        #v(4pt)
        #line(length: 90%, stroke: 0.5pt + color_secondary_text)
        #v(3pt)
        #text(weight: "bold", size: font_size_body, fill: color_primary)[TESTEMUNHA 2] \
        #text(size: font_size_subtitle)[#get_val("testemunha2Nome", "NOME DA 2ª TESTEMUNHA")]
      ]
    ],
    // Testemunha 3
    rect(width: 100%, stroke: 0.6pt + color_border, radius: 3pt, inset: 8pt)[
      #align(center)[
        #v(8pt)
        #get_val("testemunha3Assinatura", "ASSINATURA DA 3ª TESTEMUNHA")
        #v(4pt)
        #line(length: 90%, stroke: 0.5pt + color_secondary_text)
        #v(3pt)
        #text(weight: "bold", size: font_size_body, fill: color_primary)[TESTEMUNHA 3] \
        #text(size: font_size_subtitle)[#get_val("testemunha3Nome", "NOME DA 3ª TESTEMUNHA")]
      ]
    ],
  )
]
]
