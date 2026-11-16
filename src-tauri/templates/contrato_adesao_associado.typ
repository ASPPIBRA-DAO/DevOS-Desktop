// ============================================================================
// ASPPIBRA DAO - CONTRATO DE ADESÃO ASSOCIATIVA E TERMO DE COMPROMISSO INSTITUCIONAL
// INSTRUMENTO PARTICULAR DE INGRESSO AO QUADRO SOCIAL E GOVERNANÇA INSTITUCIONAL
// (MODELO CANÔNICO ABNT NBR 14724 / ESTATUTO SOCIAL DE 2025)
// ============================================================================

#import "asppibra_layout.typ": *

// Leitura segura do payload JSON injetado via sys.inputs.data
#let raw_input = if "data" in sys.inputs {
  json(bytes(sys.inputs.data))
} else {
  (:)
}

// Extração estrita de metadados obrigatórios do documento
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
  message: "contrato_adesao_associado.typ: document_number obrigatório ausente ou vazio no payload.",
)
#assert(
  auth_code != none and auth_code != "",
  message: "contrato_adesao_associado.typ: auth_code obrigatório ausente ou vazio no payload.",
)

#let contract_data = if "data" in raw_input and type(raw_input.data) == dictionary {
  raw_input.data
} else {
  raw_input
}

// Helper local para obter valor estilizado ou tag fallback
#let get_val(key, default_val) = {
  let val = contract_data.at(key, default: none)
  if val != none and str(val).trim() != "" {
    text(weight: "bold", fill: color_primary)[#str(val).trim()]
  } else {
    asppibra_tag(default_val, none)
  }
}

// Helper local para obter valor textual puro ou tag fallback
#let get_plain(key, default_val) = {
  let val = contract_data.at(key, default: none)
  if val != none and str(val).trim() != "" {
    str(val).trim()
  } else {
    asppibra_tag(default_val, none)
  }
}

#let get_plain_raw(key, fallback) = {
  let val = contract_data.at(key, default: none)
  if val != none and str(val).trim() != "" {
    str(val).trim()
  } else {
    fallback
  }
}

// Configuração Global do Documento e Geometria ABNT
#set document(
  title: "Contrato de Adesão Associativa - " + doc_number,
  author: asppibra_razao_social,
  keywords: ("Adesão Associativa", "ASPPIBRA", "Governança DAO", "Quadro Social", "Estatuto Social"),
)

#set page(
  paper: standard_paper,
  margin: margins_institutional_contract,
  header: context {
    let i = counter(page).get().first()
    if i > 1 {
      asppibra_header_running(
        doc_number: doc_number,
        doc_title: "Contrato de Adesão Associativa e Termo de Compromisso",
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

#v(6pt)

// Título Principal
#block(width: 100%, above: 4pt, below: 10pt)[
  #set par(first-line-indent: 0pt)
  #align(center)[
    #text(size: font_size_heading, weight: "bold", fill: color_primary)[
      CONTRATO DE ADESÃO ASSOCIATIVA E TERMO DE COMPROMISSO INSTITUCIONAL
    ] \
    #v(3pt)
    #text(size: font_size_subtitle, weight: "bold", fill: color_primary_text)[
      ASSOCIAÇÃO DOS PROPRIETÁRIOS E POSSUIDORES DE IMÓVEIS NO BRASIL – ASPPIBRA
    ] \
    #v(2pt)
    #text(size: font_size_caption, style: "italic", fill: color_secondary_text)[
      Instrumento Particular de Ingresso ao Quadro Social e Governança Institucional (Estatuto Social 2025)
    ]
  ]
]

#v(4pt)

// Preâmbulo e Qualificação das Partes em 2 Cards Independentes
#par(justify: true)[
  Pelo presente instrumento particular de Adesão Associativa e Termo de Compromisso Institucional, celebram o presente contrato as partes a seguir qualificadas:
]

#v(6pt)

// Card 1: Associação (ASPPIBRA)
#block(
  width: 100%,
  stroke: 0.6pt + color_border,
  inset: 10pt,
  radius: 4pt,
  fill: color_bg_box,
)[
  #set par(first-line-indent: 0pt, leading: 5.5pt)
  #grid(
    columns: (1fr, auto),
    [
      #text(weight: "bold", size: 8.5pt, fill: color_primary)[1. QUALIFICAÇÃO DA ASSOCIAÇÃO (ASPPIBRA)]
    ],
    [
      #text(size: 7.5pt, weight: "bold", fill: color_secondary_text)[PRIMEIRA PARTE]
    ],
  )
  #v(3pt)
  #line(length: 100%, stroke: 0.4pt + color_border_light)
  #v(4pt)
  #text(size: 8pt)[
    *Razão Social:* #text(weight: "bold")[ASSOCIAÇÃO DOS PROPRIETÁRIOS E POSSUIDORES DE IMÓVEIS NO BRASIL – ASPPIBRA] \
    *Natureza Jurídica:* Pessoa jurídica de direito privado, constituída sob a forma de associação civil sem fins lucrativos \
    *CNPJ:* #get_plain("asppibra_cnpj", "59.416.732/0001-20") \
    *Sede e Foro:* Comarca de Maricá, Estado do Rio de Janeiro \
    *Representante Legal:* Sr.(a) #get_val("rep_legal_nome", "Sandro de Souza") \
    *Qualificação:* CPF nº #get_plain("rep_legal_cpf", "000.000.000-00"), na qualidade de #get_val("rep_legal_cargo", "Presidente Executivo") \
    #v(3pt)
    #text(size: 7.5pt, style: "italic", fill: color_secondary_text)[Doravante denominada simplesmente *ASSOCIAÇÃO* ou *ASPPIBRA*.]
  ]
]

#v(6pt)

// Card 2: Associado(a)
#block(
  width: 100%,
  stroke: 0.6pt + color_border,
  inset: 10pt,
  radius: 4pt,
  fill: color_bg_box,
)[
  #set par(first-line-indent: 0pt, leading: 5.5pt)
  #grid(
    columns: (1fr, auto),
    [
      #text(weight: "bold", size: 8.5pt, fill: color_primary)[2. QUALIFICAÇÃO DO(A) ASSOCIADO(A)]
    ],
    [
      #text(size: 7.5pt, weight: "bold", fill: color_secondary_text)[SEGUNDA PARTE]
    ],
  )
  #v(3pt)
  #line(length: 100%, stroke: 0.4pt + color_border_light)
  #v(4pt)
  #text(size: 8pt)[
    • *Nome completo / Razão Social:* #get_val("associado_nome", "NÃO INFORMADO") \
    • *CPF / CNPJ:* #get_plain("associado_cpf_cnpj", get_plain_raw("associado_cpf", "000.000.000-00")) \
    • *RG / Documento de identificação:* #get_plain("associado_rg", "00000000-0") \
    • *Data de nascimento / constituição:* #get_plain("associado_nascimento", "DD/MM/AAAA") \
    • *Nacionalidade:* #get_val("associado_nacionalidade", "Brasileira") • *Estado civil:* #get_val("associado_estado_civil", "Solteiro(a)") \
    • *Profissão / Atividade econômica:* #get_val("associado_profissao", "Autônomo(a)") \
    • *Endereço completo:* #get_val("associado_endereco", "Logradouro, nº, Bairro") \
    • *Município / UF / CEP:* #get_val("associado_municipio", "Maricá") / #get_plain("associado_uf", "RJ") — CEP: #get_plain("associado_cep", "24900-000") \
    • *Telefone / WhatsApp:* #get_plain("associado_telefone", "(00) 00000-0000") \
    • *E-mail:* #get_plain("associado_email", "contato@exemplo.com") \
    • *Representante legal (quando pessoa jurídica):* #get_val("associado_rep_legal", "—") (CPF: #get_plain("associado_rep_cpf", "—")) \
    #v(3pt)
    #text(size: 7.5pt, style: "italic", fill: color_secondary_text)[Doravante denominado(a) simplesmente *ASSOCIADO(A)*.]
  ]
]

#v(6pt)

#par(justify: true)[
  As partes, devidamente qualificadas, resolvem celebrar o presente *CONTRATO DE ADESÃO ASSOCIATIVA*, que será regido pelo Código Civil Brasileiro, pelo Estatuto Social da ASPPIBRA, pelo Regimento Interno, pelas normas institucionais aplicáveis e pelas cláusulas e condições a seguir estabelecidas.
]

// ============================================================================
// CAPÍTULO I – DA NATUREZA JURÍDICA, DO OBJETO E DAS FINALIDADES DO VÍNCULO ASSOCIATIVO
// ============================================================================
#section_heading("CAPÍTULO I – DA NATUREZA JURÍDICA, DO OBJETO E DAS FINALIDADES DO VÍNCULO ASSOCIATIVO")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA PRIMEIRA – DA NATUREZA JURÍDICA DA ASSOCIAÇÃO]
#v(2pt)

1.1. A ASPPIBRA é uma associação civil de direito privado, sem fins lucrativos, constituída por pessoas físicas e jurídicas que possuam interesse em colaborar com suas finalidades institucionais, observadas as condições estabelecidas no Estatuto Social.

1.2. A associação possui personalidade jurídica própria, autonomia administrativa e financeira e capacidade para exercer direitos e assumir obrigações em nome próprio.

1.3. A ASPPIBRA poderá adotar, para fins de governança digital e identificação em ecossistemas tecnológicos, a denominação ASPPIBRA-DAO, conforme previsto em seu Estatuto Social.

1.4. A condição de associado não representa participação societária, investimento, aquisição de quotas, participação no capital social ou titularidade de parcela do patrimônio da associação.

1.5. A relação estabelecida entre as partes possui natureza exclusivamente associativa, nos limites definidos pela legislação e pelas normas institucionais.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA SEGUNDA – DO OBJETO DO CONTRATO]
#v(2pt)

2.1. O presente contrato tem por objeto formalizar a adesão do(a) ASSOCIADO(A) ao quadro social da ASPPIBRA, estabelecendo os direitos, deveres, responsabilidades, condições de participação e obrigações decorrentes do vínculo associativo.

2.2. Por meio deste instrumento, o(a) ASSOCIADO(A) manifesta expressamente sua vontade de integrar a associação, colaborar com suas finalidades institucionais e observar integralmente as disposições estatutárias e regulamentares.

2.3. O ingresso do(a) ASSOCIADO(A) será efetivado após:
#h(12pt)*I –* O preenchimento da documentação cadastral; \
#h(12pt)*II –* A apresentação dos documentos exigidos; \
#h(12pt)*III –* A análise e aprovação documental pela Diretoria Executiva; \
#h(12pt)*IV –* O registro do aceite ao presente instrumento; \
#h(12pt)*V –* A conclusão dos procedimentos administrativos de admissão. \

2.4. O presente contrato não substitui o Estatuto Social nem possui finalidade de alterar as competências dos órgãos administrativos e deliberativos da associação.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA TERCEIRA – DAS FINALIDADES INSTITUCIONAIS]
#v(2pt)

3.1. O(A) ASSOCIADO(A) declara ciência de que a ASPPIBRA possui como finalidade principal promover o direito à moradia, à propriedade e à regularização fundiária, urbana e rural, contribuindo para a segurança jurídica da posse e para o desenvolvimento social.

3.2. São também finalidades institucionais da associação:
#h(12pt)*I –* Promover e apoiar projetos de Regularização Fundiária Urbana e Rural – REURB; \
#h(12pt)*II –* Desenvolver iniciativas relacionadas à mediação e à gestão de conflitos fundiários e possessórios; \
#h(12pt)*III –* Incentivar o desenvolvimento socioeconômico e o combate à pobreza; \
#h(12pt)*IV –* Promover a inovação, a transformação digital e o desenvolvimento de soluções tecnológicas; \
#h(12pt)*V –* Incentivar a utilização de tecnologias emergentes, incluindo blockchain e inteligência artificial, em projetos de interesse público; \
#h(12pt)*VI –* Promover a defesa, preservação e conservação do meio ambiente; \
#h(12pt)*VII –* Apoiar projetos de sustentabilidade, recuperação ambiental e desenvolvimento territorial; \
#h(12pt)*VIII –* Promover atividades de educação, capacitação e formação cidadã; \
#h(12pt)*IX –* Desenvolver ações de articulação institucional e participação em políticas públicas; \
#h(12pt)*X –* Estabelecer parcerias com entidades públicas e privadas, nacionais e internacionais, compatíveis com suas finalidades estatutárias. \

3.3. O(A) ASSOCIADO(A) declara compreender que sua participação está vinculada às finalidades institucionais da ASPPIBRA, não representando garantia de obtenção de resultados específicos em procedimentos administrativos, fundiários, ambientais, judiciais ou de qualquer outra natureza.

// ============================================================================
// CAPÍTULO II – DA ADMISSÃO E FORMALIZAÇÃO DO VÍNCULO ASSOCIATIVO
// ============================================================================
#section_heading("CAPÍTULO II – DA ADMISSÃO E FORMALIZAÇÃO DO VÍNCULO ASSOCIATIVO")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA QUARTA – DOS REQUISITOS PARA ADMISSÃO]
#v(2pt)

4.1. Poderão integrar o quadro associativo da ASPPIBRA as pessoas físicas ou jurídicas proprietárias ou possuidoras de imóveis situados no território nacional, desde que manifestem interesse em colaborar com os objetivos da associação e se comprometam com suas normas institucionais.

4.2. O interessado deverá:
#h(12pt)*I –* Apresentar documentação de identificação pessoal ou empresarial; \
#h(12pt)*II –* Demonstrar sua condição de proprietário ou possuidor de imóvel, conforme os documentos aceitos pela associação; \
#h(12pt)*III –* Declarar possuir objetivos compatíveis com as finalidades institucionais; \
#h(12pt)*IV –* Fornecer informações cadastrais verdadeiras e atualizadas; \
#h(12pt)*V –* Aceitar as disposições do Estatuto Social e do Regimento Interno; \
#h(12pt)*VI –* Comprometer-se com o cumprimento das obrigações associativas. \

4.3. No caso de pessoa jurídica, a adesão será realizada por seu representante legal ou procurador devidamente constituído, mediante apresentação dos documentos que comprovem seus poderes de representação.

4.4. No caso de interessados menores de 18 (dezoito) anos, a admissão dependerá de autorização expressa dos responsáveis legais e da observância das condições de representação ou assistência exigidas pela legislação aplicável e pelo Estatuto Social.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA QUINTA – DO PROCEDIMENTO DE INSCRIÇÃO E APROVAÇÃO]
#v(2pt)

5.1. A inscrição poderá ser realizada por meio de formulário eletrônico disponibilizado no site oficial da ASPPIBRA ou presencialmente em unidade credenciada.

5.2. O interessado deverá apresentar os documentos solicitados pela associação para análise de sua elegibilidade.

5.3. A Diretoria Executiva será responsável pela avaliação e deliberação sobre os pedidos de admissão.

5.4. A Diretoria Executiva poderá recusar propostas de ingresso mediante decisão fundamentada, observadas as disposições estatutárias e os critérios institucionais aplicáveis.

5.5. A apresentação do pedido de inscrição não garante a admissão automática do interessado.

5.6. A condição de associado somente será reconhecida após a aprovação documental e a formalização do aceite ao presente contrato.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA SEXTA – DA DECLARAÇÃO DE CIÊNCIA DO ESTATUTO E REGIMENTO INTERNO]
#v(2pt)

6.1. O(A) ASSOCIADO(A) declara que teve acesso ao Estatuto Social da ASPPIBRA e ao respectivo Regimento Interno, comprometendo-se a observar todas as disposições aplicáveis.

6.2. O(A) ASSOCIADO(A) reconhece que o Estatuto Social constitui a norma fundamental de organização da associação e que o Regimento Interno estabelece procedimentos complementares para sua execução.

6.3. O(A) ASSOCIADO(A) compromete-se a respeitar as deliberações legítimas da Assembleia Geral, da Diretoria Executiva e dos demais órgãos competentes, respeitadas suas atribuições estatutárias.

6.4. As disposições deste contrato deverão ser interpretadas em conformidade com o Estatuto Social e com a legislação vigente.

// ============================================================================
// CAPÍTULO III – DOS DIREITOS DOS ASSOCIADOS
// ============================================================================
#section_heading("CAPÍTULO III – DOS DIREITOS DOS ASSOCIADOS")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA SÉTIMA – DOS DIREITOS E PRERROGATIVAS ASSOCIATIVAS]
#v(2pt)

7.1. São assegurados ao(à) ASSOCIADO(A), observadas as condições estatutárias, os seguintes direitos:
#h(12pt)*I –* Participar das Assembleias Gerais, com direito à voz e ao voto; \
#h(12pt)*II –* Acessar informações institucionais da associação; \
#h(12pt)*III –* Consultar relatórios de atividades e demonstrativos financeiros; \
#h(12pt)*IV –* Ter conhecimento das deliberações dos órgãos competentes; \
#h(12pt)*V –* Participar voluntariamente dos projetos, programas e atividades institucionais; \
#h(12pt)*VI –* Apresentar sugestões, propostas e projetos de interesse coletivo; \
#h(12pt)*VII –* Participar das discussões relacionadas ao aprimoramento institucional; \
#h(12pt)*VIII –* Colaborar com as atividades e iniciativas da associação; \
#h(12pt)*IX –* Candidatar-se aos cargos executivos, observados os requisitos de elegibilidade estabelecidos no Estatuto Social e no Regimento Interno; \
#h(12pt)*X –* Participar de grupos de trabalho, comissões e núcleos regionais regularmente instituídos; \
#h(12pt)*XI –* Acessar benefícios, serviços e conteúdos disponibilizados aos associados adimplentes, observadas as regras específicas de cada iniciativa; \
#h(12pt)*XII –* Exercer os demais direitos previstos no Estatuto Social. \

7.2. O exercício dos direitos associativos observará as condições de regularidade cadastral, financeira e institucional estabelecidas no Estatuto Social e no Regimento Interno.

7.3. Nenhuma disposição deste contrato poderá ser interpretada como renúncia antecipada aos direitos associativos assegurados pela legislação e pelo Estatuto Social.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA OITAVA – DA PARTICIPAÇÃO NA GOVERNANÇA INSTITUCIONAL]
#v(2pt)

8.1. O(A) ASSOCIADO(A) reconhece a Assembleia Geral como órgão soberano da ASPPIBRA, constituído pelos associados em pleno gozo de seus direitos estatutários.

8.2. A administração e fiscalização institucional são exercidas pelos órgãos previstos no Estatuto Social, especialmente:
#h(12pt)*I –* Assembleia Geral; \
#h(12pt)*II –* Diretoria Executiva; \
#h(12pt)*III –* Conselho Fiscal. \

8.3. O(A) ASSOCIADO(A) poderá participar das Assembleias Gerais, apresentar propostas e exercer seu direito de manifestação e votação, conforme as regras estatutárias.

8.4. A participação em cargos de direção e fiscalização dependerá do cumprimento dos requisitos de elegibilidade, dos procedimentos eleitorais e das demais condições estabelecidas nas normas institucionais.

8.5. O(A) ASSOCIADO(A) poderá participar de grupos temáticos, comissões, núcleos regionais e outras estruturas de organização interna, desde que regularmente constituídas.

// ============================================================================
// CAPÍTULO IV – DOS DEVERES E RESPONSABILIDADES DOS ASSOCIADOS
// ============================================================================
#section_heading("CAPÍTULO IV – DOS DEVERES E RESPONSABILIDADES DOS ASSOCIADOS")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA NONA – DOS DEVERES INSTITUCIONAIS]
#v(2pt)

9.1. Constituem deveres do(a) ASSOCIADO(A):
#h(12pt)*I –* Cumprir integralmente o Estatuto Social; \
#h(12pt)*II –* Observar o Regimento Interno; \
#h(12pt)*III –* Respeitar as deliberações legítimas dos órgãos competentes; \
#h(12pt)*IV –* Efetuar pontualmente o pagamento das contribuições associativas; \
#h(12pt)*V –* Participar de forma responsável das atividades institucionais, quando assumir compromisso de participação; \
#h(12pt)*VI –* Preservar o patrimônio material, imaterial e digital da associação; \
#h(12pt)*VII –* Utilizar adequadamente os sistemas, plataformas e recursos disponibilizados; \
#h(12pt)*VIII –* Manter atualizados seus dados pessoais, empresariais e informações de contato; \
#h(12pt)*IX –* Fornecer informações verdadeiras e documentos legítimos; \
#h(12pt)*X –* Preservar a imagem institucional e respeitar o nome da associação; \
#h(12pt)*XI –* Respeitar os demais associados, dirigentes, colaboradores e representantes institucionais; \
#h(12pt)*XII –* Observar as normas de proteção de dados e segurança da informação; \
#h(12pt)*XIII –* Zelar pelos interesses institucionais da ASPPIBRA; \
#h(12pt)*XIV –* Abster-se de utilizar o vínculo associativo para finalidades ilícitas ou incompatíveis com os objetivos da entidade. \

9.2. O descumprimento dos deveres previstos nesta cláusula poderá ensejar a adoção das medidas administrativas e disciplinares previstas no Estatuto Social e no Regimento Interno, assegurados o contraditório e a ampla defesa quando cabíveis.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA DÉCIMA – DA RESPONSABILIDADE PESSOAL DO ASSOCIADO]
#v(2pt)

10.1. O(A) ASSOCIADO(A) será responsável pelos atos que praticar individualmente, inclusive aqueles realizados em nome próprio ou mediante utilização indevida de recursos, documentos, informações, credenciais ou símbolos institucionais.

10.2. O(A) ASSOCIADO(A) não poderá assumir obrigações, celebrar contratos ou representar oficialmente a ASPPIBRA perante terceiros sem autorização ou poderes regularmente conferidos.

10.3. O(A) ASSOCIADO(A) deverá reparar eventuais prejuízos causados à associação quando decorrentes de atos ilícitos, dolo, fraude, má-fé ou outras hipóteses de responsabilização reconhecidas pela legislação.

10.4. A condição de associado não implica responsabilidade automática pelas obrigações financeiras, civis, trabalhistas ou tributárias assumidas pela ASPPIBRA, observadas as exceções previstas na legislação vigente.

// ============================================================================
// CAPÍTULO V – DAS CONTRIBUIÇÕES ASSOCIATIVAS E OBRIGAÇÕES FINANCEIRAS
// ============================================================================
#section_heading("CAPÍTULO V – DAS CONTRIBUIÇÕES ASSOCIATIVAS E OBRIGAÇÕES FINANCEIRAS")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA DÉCIMA PRIMEIRA – DAS CONTRIBUIÇÕES ASSOCIATIVAS]
#v(2pt)

11.1. O(A) ASSOCIADO(A) compromete-se a contribuir financeiramente para a manutenção e o desenvolvimento das atividades institucionais da ASPPIBRA.

11.2. As contribuições associativas poderão ser ordinárias, periódicas ou extraordinárias, conforme estabelecido no Estatuto Social e nas deliberações da instância competente.

11.3. O valor da contribuição ordinária aplicável ao(à) ASSOCIADO(A) será aquele aprovado e regulamentado conforme as disposições estatutárias vigentes.

11.4. Para fins de identificação da obrigação financeira assumida, ficam registrados os seguintes dados:
#block(
  width: 100%,
  stroke: 0.5pt + color_border_light,
  inset: 8pt,
  radius: 3pt,
  fill: color_bg_box,
)[
  #grid(
    columns: (1fr, 1fr),
    row-gutter: 5pt,
    [• *Valor da contribuição associativa:* R\$ #get_val("contribuicao_valor", "0,00")],
    [• *Periodicidade:* #get_val("contribuicao_periodicidade", "Mensal")],
    [• *Data de vencimento:* Dia #get_val("contribuicao_vencimento", "10 de cada mês")],
    [• *Forma de pagamento:* #get_val("contribuicao_forma_pagamento", "PIX / Boleto / Transferência")],
    [• *Deliberação de aprovação:* #get_val("contribuicao_deliberacao", "Aprovada em Assembleia Geral")],
    [• *Referência ao Regimento Interno:* #get_val("contribuicao_regimento_ref", "Artigo 14 do Regimento")],
  )
]

11.5. Eventuais contribuições extraordinárias dependerão de aprovação pela instância competente, conforme o Estatuto Social, devendo o associado ser informado sobre os valores, a finalidade e os prazos correspondentes.

11.6. Qualquer alteração nos valores das contribuições deverá observar os procedimentos de aprovação e regulamentação previstos nas normas institucionais.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA DÉCIMA SEGUNDA – DO PAGAMENTO E DA REGULARIDADE FINANCEIRA]
#v(2pt)

12.1. O(A) ASSOCIADO(A) deverá efetuar os pagamentos nos valores, prazos e modalidades oficialmente estabelecidos pela associação.

12.2. Os pagamentos serão considerados realizados após a efetiva confirmação da operação pelos meios financeiros disponibilizados.

12.3. O(A) ASSOCIADO(A) deverá conservar os comprovantes de pagamento e comunicar à associação eventuais divergências identificadas.

12.4. A associação poderá disponibilizar mecanismos eletrônicos para consulta de contribuições, emissão de cobranças e acompanhamento da situação financeira do associado.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA DÉCIMA TERCEIRA – DA INADIMPLÊNCIA]
#v(2pt)

13.1. A ausência de pagamento das contribuições poderá resultar na suspensão de direitos ou benefícios, quando prevista nas normas estatutárias e regulamentares aplicáveis.

13.2. A inadimplência por período superior a 6 (seis) meses, após notificação formal para regularização, constitui hipótese estatutária de exclusão.

13.3. Antes da aplicação de medida disciplinar que implique exclusão, deverão ser observados o procedimento administrativo, o direito de defesa e as demais garantias estabelecidas no Estatuto Social.

13.4. A eventual regularização de débitos deverá observar os procedimentos financeiros definidos pela associação.

13.5. O desligamento voluntário não impede a cobrança de obrigações financeiras vencidas anteriormente à data de desligamento.

13.6. A exclusão ou demissão do associado não gera direito à restituição das contribuições associativas anteriormente pagas, nos termos do Estatuto Social.

// ============================================================================
// CAPÍTULO VI – DA GOVERNANÇA DIGITAL E DA CREDENCIAL DE ASSOCIADO DIGITAL – CAD
// ============================================================================
#section_heading("CAPÍTULO VI – DA GOVERNANÇA DIGITAL E DA CREDENCIAL DE ASSOCIADO DIGITAL – CAD")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA DÉCIMA QUARTA – DA CREDENCIAL DE ASSOCIADO DIGITAL]
#v(2pt)

14.1. A ASPPIBRA adota sistema de governança digital baseado em tecnologia blockchain, destinado a promover a identificação, a participação institucional e a transparência de seus procedimentos.

14.2. Para operacionalizar esse sistema, poderá ser atribuída ao(à) ASSOCIADO(A) uma Credencial de Associado Digital, denominada CAD.

14.3. A CAD constitui registro digital individual e intransferível, destinado exclusivamente à identificação e ao exercício de direitos no âmbito interno da associação.

14.4. A atribuição da CAD ocorrerá no momento da admissão do associado, observados os procedimentos técnicos e administrativos estabelecidos pela ASPPIBRA.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA DÉCIMA QUINTA – DAS FINALIDADES DA CAD]
#v(2pt)

15.1. A CAD poderá ser utilizada para:
#h(12pt)*I –* Identificação digital única e segura do associado; \
#h(12pt)*II –* Habilitação para o exercício do direito de voto em assembleias e deliberações; \
#h(12pt)*III –* Registro criptográfico de participação em eventos, cursos e projetos; \
#h(12pt)*IV –* Credencial de acesso a serviços, benefícios e conteúdos destinados aos associados adimplentes; \
#h(12pt)*V –* Outras funcionalidades institucionais compatíveis com o Estatuto Social. \

15.2. O(A) ASSOCIADO(A) compromete-se a utilizar sua credencial exclusivamente para as finalidades autorizadas pela ASPPIBRA.

15.3. Os procedimentos de atualização, validação e utilização da CAD serão estabelecidos em regulamentação interna.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA DÉCIMA SEXTA – DA NATUREZA JURÍDICA E DAS VEDAÇÕES RELATIVAS À CAD]
#v(2pt)

16.1. O(A) ASSOCIADO(A) declara ciência de que a CAD representa exclusivamente uma credencial de identificação e participação institucional.

16.2. A CAD não constitui:
#h(12pt)*I –* Valor mobiliário; \
#h(12pt)*II –* Ativo financeiro; \
#h(12pt)*III –* Instrumento de investimento; \
#h(12pt)*IV –* Participação societária; \
#h(12pt)*V –* Direito de propriedade sobre o patrimônio da associação; \
#h(12pt)*VI –* Instrumento de promessa de rentabilidade; \
#h(12pt)*VII –* Direito de resgate financeiro; \
#h(12pt)*VIII –* Qualquer forma de participação nos lucros ou resultados patrimoniais da ASPPIBRA. \

16.3. É expressamente proibida a venda, cessão, transferência, troca, negociação ou comercialização da CAD.

16.4. É igualmente vedada qualquer conversão ou resgate da CAD por moeda corrente, ativos financeiros ou quaisquer outros bens de valor econômico por parte da ASPPIBRA.

16.5. A CAD não gera direito a cashback, reversão financeira, bonificação monetária ou restituição de contribuições associativas.

16.6. O(A) ASSOCIADO(A) reconhece que a CAD possui natureza exclusivamente institucional, não podendo ser apresentada a terceiros como investimento ou ativo de natureza econômica.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA DÉCIMA SÉTIMA – DA SUSPENSÃO E CANCELAMENTO DA CAD]
#v(2pt)

17.1. As funcionalidades vinculadas à CAD poderão ser alteradas, suspensas ou revogadas pela Assembleia Geral, conforme previsto no Estatuto Social.

17.2. Em caso de demissão voluntária, a credencial será permanentemente invalidada no sistema da associação.

17.3. Em caso de exclusão, o associado perderá o acesso à plataforma de governança, sendo cancelada a respectiva CAD.

17.4. O cancelamento da CAD não gera direito a resgate, restituição ou compensação financeira.

// ============================================================================
// CAPÍTULO VII – DOS SERVIÇOS, BENEFÍCIOS E REPRESENTAÇÃO INSTITUCIONAL
// ============================================================================
#section_heading("CAPÍTULO VII – DOS SERVIÇOS, BENEFÍCIOS E REPRESENTAÇÃO INSTITUCIONAL")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA DÉCIMA OITAVA – DOS SERVIÇOS E BENEFÍCIOS ASSOCIATIVOS]
#v(2pt)

18.1. A ASPPIBRA poderá disponibilizar aos associados serviços, programas, conteúdos, projetos e benefícios compatíveis com suas finalidades institucionais.

18.2. Entre as áreas de atuação poderão estar incluídas:
#h(12pt)*I –* Orientações institucionais sobre regularização fundiária; \
#h(12pt)*II –* Programas de educação e capacitação; \
#h(12pt)*III –* Projetos de desenvolvimento territorial; \
#h(12pt)*IV –* Iniciativas de sustentabilidade ambiental; \
#h(12pt)*V –* Projetos de inovação e transformação digital; \
#h(12pt)*VI –* Programas de participação comunitária; \
#h(12pt)*VII –* Atividades de formação e desenvolvimento institucional; \
#h(12pt)*VIII –* Eventos, cursos, palestras e oficinas. \

18.3. A disponibilização de serviços e benefícios dependerá da existência de programas, projetos, parcerias, recursos e regulamentações específicas.

18.4. A condição de associado, por si só, não assegura a realização de determinado serviço, a aprovação de projetos ou a obtenção de resultados administrativos, judiciais ou patrimoniais.

18.5. Quando determinado serviço exigir contratação específica, serão estabelecidas condições próprias por meio de instrumento complementar.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA DÉCIMA NONA – DA REPRESENTAÇÃO DOS ASSOCIADOS]
#v(2pt)

19.1. A ASPPIBRA poderá representar os associados na defesa de interesses coletivos e difusos relacionados às suas finalidades institucionais, observadas as disposições legais.

19.2. A defesa de interesses individuais dependerá de mandato específico e será patrocinada exclusivamente por advogado devidamente habilitado, constituído pelo interessado.

19.3. O presente contrato não constitui procuração, mandato judicial ou autorização automática para representação individual do associado em processos administrativos ou judiciais.

19.4. Qualquer representação individual dependerá de documentação específica e dos instrumentos jurídicos apropriados.

// ============================================================================
// CAPÍTULO VIII – DAS ATIVIDADES VOLUNTÁRIAS E DA PRESTAÇÃO DE SERVIÇOS
// ============================================================================
#section_heading("CAPÍTULO VIII – DAS ATIVIDADES VOLUNTÁRIAS E DA PRESTAÇÃO DE SERVIÇOS")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA VIGÉSIMA – DA PARTICIPAÇÃO VOLUNTÁRIA]
#v(2pt)

20.1. O(A) ASSOCIADO(A) poderá colaborar voluntariamente com projetos, programas, eventos e atividades institucionais da ASPPIBRA.

20.2. A participação voluntária deverá observar as finalidades da associação e os procedimentos internos aplicáveis.

20.3. Quando houver prestação de serviço voluntário, será celebrado termo de adesão específico, no qual serão definidos o objeto e as condições de exercício das atividades, observada a Lei nº 9.608/1998.

20.4. A simples condição de associado não obriga o(a) ASSOCIADO(A) a prestar serviços voluntários à associação.

20.5. A participação voluntária não deverá ser confundida com a prestação de serviços profissionais remunerados.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA VIGÉSIMA PRIMEIRA – DA CONTRATAÇÃO DE SERVIÇOS PROFISSIONAIS]
#v(2pt)

21.1. A ASPPIBRA poderá contratar associados ou terceiros para o desempenho de atividades técnicas, consultivas, estratégicas, executivas, administrativas ou operacionais.

21.2. A contratação de serviços profissionais dependerá de instrumento próprio, com definição do objeto, das responsabilidades, dos prazos, das condições de execução e da remuneração, quando aplicável.

21.3. A contratação deverá observar os critérios estatutários de aprovação, transparência e controle, incluindo as competências da Diretoria Executiva e do Conselho Fiscal.

21.4. O vínculo associativo não constitui, por si só, contrato de trabalho, prestação de serviços ou relação profissional remunerada.

21.5. Eventuais relações de trabalho ou prestação de serviços serão regidas pelos respectivos instrumentos jurídicos e pela legislação aplicável, conforme a natureza efetiva da relação estabelecida.

// ============================================================================
// CAPÍTULO IX – DA GESTÃO FINANCEIRA E TRANSPARÊNCIA INSTITUCIONAL
// ============================================================================
#section_heading("CAPÍTULO IX – DA GESTÃO FINANCEIRA E TRANSPARÊNCIA INSTITUCIONAL")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA VIGÉSIMA SEGUNDA – DA TRANSPARÊNCIA E PRESTAÇÃO DE CONTAS]
#v(2pt)

22.1. A ASPPIBRA compromete-se a administrar seus recursos conforme os princípios de legalidade, transparência, moralidade, economicidade e eficiência.

22.2. O(A) ASSOCIADO(A) terá direito de acesso às informações institucionais e financeiras disponibilizadas pela associação, observados os procedimentos administrativos e as regras de proteção de dados.

22.3. A prestação de contas será realizada anualmente, mediante elaboração dos documentos previstos no Estatuto Social, incluindo:
#h(12pt)*I –* Relatório de atividades financeiras do exercício; \
#h(12pt)*II –* Balanço patrimonial; \
#h(12pt)*III –* Demonstração de resultados; \
#h(12pt)*IV –* Parecer do Conselho Fiscal. \

22.4. A documentação deverá estar disponível aos associados com antecedência mínima de 30 (trinta) dias da Assembleia Geral convocada para sua apreciação.

22.5. O(A) ASSOCIADO(A) reconhece que as receitas e o patrimônio da associação deverão ser destinados exclusivamente à consecução de suas finalidades institucionais, vedada a distribuição indevida de lucros ou benefícios patrimoniais individuais.

// ============================================================================
// CAPÍTULO X – DA PROTEÇÃO DE DADOS PESSOAIS E SEGURANÇA DA INFORMAÇÃO
// ============================================================================
#section_heading("CAPÍTULO X – DA PROTEÇÃO DE DADOS PESSOAIS E SEGURANÇA DA INFORMAÇÃO")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA VIGÉSIMA TERCEIRA – DO TRATAMENTO DE DADOS PESSOAIS]
#v(2pt)

23.1. O(A) ASSOCIADO(A) declara ciência de que a ASPPIBRA realizará o tratamento de dados pessoais e cadastrais necessários à administração do vínculo associativo.

23.2. Os dados poderão incluir:
#h(12pt)*I –* Dados de identificação pessoal; \
#h(12pt)*II –* Dados de contato; \
#h(12pt)*III –* Informações documentais; \
#h(12pt)*IV –* Informações relacionadas à condição de proprietário ou possuidor de imóvel; \
#h(12pt)*V –* Registros financeiros e administrativos; \
#h(12pt)*VI –* Informações relacionadas à participação institucional; \
#h(12pt)*VII –* Dados necessários à identificação e utilização da CAD. \

23.3. O tratamento das informações será realizado para finalidades legítimas e compatíveis com as atividades institucionais, observada a Lei Geral de Proteção de Dados Pessoais – LGPD (Lei nº 13.709/2018).

23.4. Os dados poderão ser utilizados para:
#h(12pt)*I –* Cadastro e identificação dos associados; \
#h(12pt)*II –* Análise e formalização da admissão; \
#h(12pt)*III –* Administração das contribuições associativas; \
#h(12pt)*IV –* Comunicação institucional; \
#h(12pt)*V –* Organização de assembleias e processos deliberativos; \
#h(12pt)*VI –* Operação dos sistemas de governança digital; \
#h(12pt)*VII –* Cumprimento de obrigações legais e regulatórias; \
#h(12pt)*VIII –* Execução das finalidades estatutárias. \

23.5. A ASPPIBRA deverá adotar medidas administrativas e técnicas compatíveis com a proteção das informações sob sua responsabilidade.

23.6. O(A) ASSOCIADO(A) poderá exercer os direitos previstos na LGPD mediante solicitação encaminhada ao canal oficial de atendimento da associação.

23.7. Os procedimentos detalhados de tratamento, compartilhamento, armazenamento e conservação dos dados serão apresentados no Aviso de Privacidade da ASPPIBRA.
#block(
  width: 100%,
  stroke: 0.5pt + color_border_light,
  inset: 7pt,
  radius: 3pt,
  fill: color_bg_box,
)[
  *Canal oficial de atendimento relacionado à proteção de dados (DPO/Encarregado):* \
  • *E-mail:* #get_plain("dpo_email", "privacidade@asppibra.org.br") \
  • *Endereço eletrônico da política de privacidade:* #get_plain("politica_privacidade_url", "https://asppibra.org.br/privacidade")
]

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA VIGÉSIMA QUARTA – DA ATUALIZAÇÃO CADASTRAL]
#v(2pt)

24.1. O(A) ASSOCIADO(A) compromete-se a manter atualizadas suas informações pessoais, empresariais, documentais e de contato.

24.2. Qualquer alteração relevante deverá ser comunicada à secretaria administrativa da ASPPIBRA.

24.3. A associação não será responsável por falhas de comunicação decorrentes de informações incorretas ou desatualizadas fornecidas pelo associado, ressalvadas as hipóteses de responsabilidade legal da própria associação.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA VIGÉSIMA QUINTA – DA SEGURANÇA DA INFORMAÇÃO E COMUNICAÇÃO DIGITAL]
#v(2pt)

25.1. O(A) ASSOCIADO(A) deverá utilizar adequadamente as plataformas, credenciais, sistemas e ferramentas digitais disponibilizadas pela ASPPIBRA.

25.2. É vedado:
#h(12pt)*I –* Compartilhar credenciais pessoais de acesso; \
#h(12pt)*II –* Utilizar sistemas institucionais para finalidades ilícitas; \
#h(12pt)*III –* Tentar acessar informações sem autorização; \
#h(12pt)*IV –* Alterar ou comprometer registros digitais; \
#h(12pt)*V –* Utilizar indevidamente informações de outros associados; \
#h(12pt)*VI –* Praticar atos que comprometam a segurança, integridade ou disponibilidade das plataformas institucionais. \

25.3. A associação poderá adotar procedimentos de segurança, autenticação, monitoramento de acesso e registro de atividades, observadas as exigências legais de proteção de dados pessoais.

// ============================================================================
// CAPÍTULO XI – DA INTEGRIDADE, ÉTICA E CONDUTA INSTITUCIONAL
// ============================================================================
#section_heading("CAPÍTULO XI – DA INTEGRIDADE, ÉTICA E CONDUTA INSTITUCIONAL")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA VIGÉSIMA SEXTA – DO PROGRAMA DE INTEGRIDADE E CÓDIGO DE CONDUTA]
#v(2pt)

26.1. O(A) ASSOCIADO(A) declara ciência de que a ASPPIBRA mantém um programa de integridade destinado à prevenção, identificação e tratamento de desvios, fraudes, irregularidades e atos ilícitos relacionados às suas atividades.

26.2. O(A) ASSOCIADO(A) compromete-se a observar o Código de Conduta Ética e as políticas de integridade que tenham sido regularmente aprovados e disponibilizados pela associação.

26.3. As normas de integridade aplicáveis deverão ser observadas por associados, dirigentes, conselheiros, funcionários, voluntários e prestadores de serviços, conforme suas respectivas atribuições.

26.4. O descumprimento das normas de integridade poderá ensejar a adoção das medidas administrativas previstas no Estatuto Social e no Regimento Interno.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA VIGÉSIMA SÉTIMA – DOS CONFLITOS DE INTERESSES]
#v(2pt)

27.1. O(A) ASSOCIADO(A) que, em razão de função institucional, participação em órgão da associação ou atividade exercida em seu nome, identificar situação de potencial ou efetivo conflito de interesses deverá comunicar formalmente a ocorrência à Diretoria Executiva e ao Conselho Fiscal, quando aplicável.

27.2. O conflito de interesses caracteriza-se pela existência de interesse privado ou de terceiro capaz de influenciar ou aparentar influenciar decisões que devam observar exclusivamente os interesses institucionais da ASPPIBRA.

27.3. O membro que estiver em situação de conflito deverá abster-se de participar das discussões e deliberações relacionadas ao assunto, conforme as disposições estatutárias.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA VIGÉSIMA OITAVA – DO CANAL DE DENÚNCIAS]
#v(2pt)

28.1. A ASPPIBRA manterá canal destinado ao recebimento de relatos sobre violações ao Estatuto Social, ao Código de Conduta, às políticas internas ou à legislação vigente.

28.2. O(A) ASSOCIADO(A) poderá comunicar irregularidades de que tenha conhecimento, apresentando informações e documentos pertinentes, quando disponíveis.

28.3. A gestão e a apuração preliminar das denúncias serão realizadas conforme as competências atribuídas ao Conselho Fiscal pelo Estatuto Social.

28.4. Será garantido o tratamento imparcial dos relatos e a proteção dos dados envolvidos.

28.5. Fica expressamente vedada qualquer forma de retaliação, intimidação ou ato adverso contra denunciante de boa-fé.

// ============================================================================
// CAPÍTULO XII – DA PROPRIEDADE INTELECTUAL E DOS ATIVOS INSTITUCIONAIS
// ============================================================================
#section_heading("CAPÍTULO XII – DA PROPRIEDADE INTELECTUAL E DOS ATIVOS INSTITUCIONAIS")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA VIGÉSIMA NONA – DA TITULARIDADE DA PROPRIEDADE INTELECTUAL]
#v(2pt)

29.1. O(A) ASSOCIADO(A) declara ciência de que, conforme o Art. 45º do Estatuto Social, os ativos de propriedade intelectual desenvolvidos no âmbito das atividades institucionais da ASPPIBRA ou mediante utilização de seus recursos materiais, humanos, tecnológicos ou financeiros são destinados à titularidade da associação, observada a formalização jurídica aplicável.

29.2. A disposição prevista nesta cláusula poderá abranger, conforme a natureza e a finalidade das criações:
#h(12pt)*I –* Produções técnico-científicas; \
#h(12pt)*II –* Obras intelectuais; \
#h(12pt)*III –* Publicações e materiais didáticos; \
#h(12pt)*IV –* Programas de computador e softwares; \
#h(12pt)*V –* Códigos-fonte; \
#h(12pt)*VI –* Aplicativos e plataformas digitais; \
#h(12pt)*VII –* Bases de dados; \
#h(12pt)*VIII –* Marcas e patentes; \
#h(12pt)*IX –* Outros ativos de propriedade intelectual relacionados às finalidades institucionais. \

29.3. A eventual cessão dos direitos patrimoniais deverá respeitar os direitos morais dos criadores, especialmente o reconhecimento da autoria, nos termos da legislação vigente.

29.4. As criações estritamente pessoais, desenvolvidas sem utilização de recursos da associação e sem relação com suas atividades institucionais, não serão abrangidas pela cessão prevista no Estatuto, salvo disposição contratual específica em contrário.

29.5. Quando houver criação intelectual abrangida pelo Art. 45º do Estatuto Social, o(a) ASSOCIADO(A) compromete-se a colaborar com a formalização da titularidade patrimonial em favor da ASPPIBRA, mediante assinatura dos instrumentos complementares necessários.

29.6. Os documentos específicos de cessão deverão identificar, conforme aplicável, a criação abrangida, os direitos cedidos, as modalidades de utilização, o território, o prazo e as condições da cessão, observada a legislação pertinente.

29.7. A ASPPIBRA poderá conceder ao criador licença de uso não exclusiva e não onerosa da criação cedida para fins acadêmicos, científicos, artísticos ou pessoais, desde que não conflitantes com os interesses institucionais da associação.

29.8. A presente cláusula não representa autorização para apropriação de criações pessoais estranhas às atividades institucionais da ASPPIBRA.

// ============================================================================
// CAPÍTULO XIII – DA UTILIZAÇÃO DO NOME, DAS MARCAS E DOS SÍMBOLOS INSTITUCIONAIS
// ============================================================================
#section_heading("CAPÍTULO XIII – DA UTILIZAÇÃO DO NOME, DAS MARCAS E DOS SÍMBOLOS INSTITUCIONAIS")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA TRIGÉSIMA – DA IDENTIDADE INSTITUCIONAL]
#v(2pt)

30.1. O(A) ASSOCIADO(A) poderá identificar-se como integrante do quadro associativo da ASPPIBRA enquanto mantiver regularmente sua condição de associado.

30.2. A utilização do nome, das marcas, dos logotipos, dos símbolos e dos materiais institucionais deverá respeitar as orientações e autorizações estabelecidas pela associação.

30.3. É vedado ao(à) ASSOCIADO(A):
#h(12pt)*I –* Utilizar a identidade institucional para obter vantagens pessoais indevidas; \
#h(12pt)*II –* Apresentar-se como representante oficial sem autorização; \
#h(12pt)*III –* Assumir compromissos em nome da associação sem poderes para tanto; \
#h(12pt)*IV –* Utilizar marcas e símbolos da ASPPIBRA em atividades incompatíveis com suas finalidades; \
#h(12pt)*V –* Utilizar a identidade institucional após o desligamento, quando não houver autorização específica. \

30.4. O desligamento do quadro social implicará a perda da autorização de utilização da identidade associativa, observadas as regras institucionais.

// ============================================================================
// CAPÍTULO XIV – DA DEMISSÃO VOLUNTÁRIA E DO DESLIGAMENTO
// ============================================================================
#section_heading("CAPÍTULO XIV – DA DEMISSÃO VOLUNTÁRIA E DO DESLIGAMENTO")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA TRIGÉSIMA PRIMEIRA – DA DEMISSÃO VOLUNTÁRIA]
#v(2pt)

31.1. O(A) ASSOCIADO(A) poderá solicitar seu desligamento da ASPPIBRA a qualquer tempo, mediante comunicação formal e escrita à Diretoria Executiva.

31.2. O direito de demissão é incondicional e não poderá ser condicionado à quitação de eventuais débitos existentes.

31.3. A associação poderá adotar as providências legais cabíveis para cobrança de obrigações financeiras anteriores ao desligamento.

31.4. O pedido de demissão deverá ser registrado administrativamente pela ASPPIBRA, com identificação da data de recebimento e processamento.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA TRIGÉSIMA SEGUNDA – DOS EFEITOS DO DESLIGAMENTO]
#v(2pt)

32.1. A partir da efetivação do desligamento, o(a) ex-associado(a) perderá os direitos e benefícios decorrentes do vínculo associativo.

32.2. A respectiva Credencial de Associado Digital será permanentemente invalidada no sistema da associação.

32.3. As contribuições associativas anteriormente pagas não serão objeto de reembolso, conforme previsto no Estatuto Social.

32.4. O desligamento não extingue automaticamente eventuais obrigações anteriores que permaneçam legalmente exigíveis.

32.5. O(A) ex-associado(a) deverá cessar a utilização do nome, das marcas e dos símbolos institucionais da ASPPIBRA.

// ============================================================================
// CAPÍTULO XV – DA EXCLUSÃO E DAS MEDIDAS DISCIPLINARES
// ============================================================================
#section_heading("CAPÍTULO XV – DA EXCLUSÃO E DAS MEDIDAS DISCIPLINARES")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA TRIGÉSIMA TERCEIRA – DAS HIPÓTESES DE EXCLUSÃO]
#v(2pt)

33.1. A exclusão do quadro social poderá ocorrer nas hipóteses estabelecidas no Estatuto Social, incluindo:
#h(12pt)*I –* Pedido formal do próprio associado, caso em que deverá ser processado como desligamento voluntário, conforme o procedimento aplicável; \
#h(12pt)*II –* Inadimplemento das obrigações financeiras por período superior a 6 (seis) meses, após notificação formal para regularização; \
#h(12pt)*III –* Descumprimento das disposições do Estatuto Social; \
#h(12pt)*IV –* Descumprimento do Regimento Interno; \
#h(12pt)*V –* Descumprimento das deliberações legítimas dos órgãos competentes; \
#h(12pt)*VI –* Prática de conduta incompatível com os objetivos institucionais; \
#h(12pt)*VII –* Prática de atos destinados à negociação ou transferência indevida da Credencial de Associado Digital. \

33.2. A exclusão deverá estar fundamentada em hipótese estatutária e observar os procedimentos administrativos previstos nas normas institucionais e na legislação.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA TRIGÉSIMA QUARTA – DO DIREITO DE DEFESA]
#v(2pt)

34.1. O(A) ASSOCIADO(A) deverá ser formalmente notificado sobre a infração que lhe for imputada.

34.2. A notificação deverá identificar os fatos e a conduta que fundamentam a instauração do procedimento de exclusão.

34.3. Será assegurado ao(à) ASSOCIADO(A) o prazo de 30 (trinta) dias para apresentar defesa por escrito à Diretoria Executiva, contado da respectiva notificação.

34.4. A Diretoria Executiva analisará a defesa apresentada e deliberará fundamentadamente sobre o procedimento.

34.5. Da decisão da Diretoria Executiva caberá recurso à Assembleia Geral, na forma e nos termos previstos no Regimento Interno.

34.6. O procedimento deverá observar o contraditório, a ampla defesa e as garantias legais aplicáveis.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA TRIGÉSIMA QUINTA – DOS EFEITOS DA EXCLUSÃO]
#v(2pt)

35.1. A exclusão regularmente efetivada implicará a perda da condição de associado e dos direitos e benefícios dela decorrentes.

35.2. O associado excluído perderá o acesso à plataforma de governança digital e terá sua CAD definitivamente cancelada.

35.3. Não haverá restituição das contribuições associativas já pagas em razão da exclusão.

35.4. Não será devida compensação financeira ou indenização em decorrência da exclusão, ressalvadas as hipóteses de responsabilidade expressamente reconhecidas pela legislação aplicável.

35.5. O(A) ex-associado(a) ficará impedido(a) de utilizar o nome, as marcas e os símbolos institucionais da ASPPIBRA.

// ============================================================================
// CAPÍTULO XVI – DA SOLUÇÃO DE CONTROVÉRSIAS
// ============================================================================
#section_heading("CAPÍTULO XVI – DA SOLUÇÃO DE CONTROVÉRSIAS")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA TRIGÉSIMA SEXTA – DA MEDIAÇÃO]
#v(2pt)

36.1. As controvérsias decorrentes da relação associativa serão preferencialmente solucionadas por meio de diálogo institucional e mediação.

36.2. As partes poderão buscar solução consensual para conflitos relacionados à interpretação deste contrato, do Estatuto Social ou do Regimento Interno.

36.3. A mediação deverá observar a legislação aplicável e a autonomia das partes.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA TRIGÉSIMA SÉTIMA – DA ARBITRAGEM]
#v(2pt)

37.1. A arbitragem somente será utilizada caso exista cláusula compromissória expressamente aceita pelo associado em instrumento apartado, com assinatura específica, conforme previsto no Estatuto Social e na Lei nº 9.307/1996.

37.2. O presente contrato não estabelece adesão automática ou obrigatória à arbitragem.

37.3. A eventual utilização da arbitragem dependerá de manifestação expressa e específica do(a) ASSOCIADO(A), em documento próprio.

// ============================================================================
// CAPÍTULO XVII – DAS COMUNICAÇÕES E NOTIFICAÇÕES
// ============================================================================
#section_heading("CAPÍTULO XVII – DAS COMUNICAÇÕES E NOTIFICAÇÕES")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA TRIGÉSIMA OITAVA – DOS MEIOS OFICIAIS DE COMUNICAÇÃO]
#v(2pt)

38.1. As comunicações entre a associação e o(a) ASSOCIADO(A) poderão ocorrer por meios físicos ou eletrônicos.

38.2. São considerados meios de comunicação institucional:
#h(12pt)*I –* E-mail cadastrado; \
#h(12pt)*II –* Plataforma digital oficial; \
#h(12pt)*III –* Sistema eletrônico de governança; \
#h(12pt)*IV –* Aplicativos oficiais de comunicação; \
#h(12pt)*V –* Correspondência física; \
#h(12pt)*VI –* Outros meios formalmente reconhecidos pela associação. \

38.3. O(A) ASSOCIADO(A) declara que os dados de contato informados no presente instrumento são verdadeiros e compromete-se a mantê-los atualizados.

38.4. As convocações de Assembleias Gerais deverão observar os meios, os prazos e os procedimentos estabelecidos no Estatuto Social.

38.5. As notificações relacionadas a procedimentos administrativos disciplinares deverão permitir a comprovação de seu envio e recebimento, conforme as regras institucionais aplicáveis.

// ============================================================================
// CAPÍTULO XVIII – DA VIGÊNCIA E DISPOSIÇÕES FINAIS
// ============================================================================
#section_heading("CAPÍTULO XVIII – DA VIGÊNCIA E DISPOSIÇÕES FINAIS")

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA TRIGÉSIMA NONA – DA VIGÊNCIA]
#v(2pt)

39.1. O presente contrato produzirá efeitos após a aprovação da admissão pela Diretoria Executiva e a formalização do aceite pelo(a) ASSOCIADO(A).

39.2. O vínculo associativo permanecerá vigente por prazo indeterminado, enquanto o(a) ASSOCIADO(A) integrar regularmente o quadro social da ASPPIBRA.

39.3. A vigência do vínculo não impede a ocorrência de demissão voluntária ou exclusão, observados os procedimentos estatutários.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA QUADRAGÉSIMA – DAS ALTERAÇÕES ESTATUTÁRIAS E REGULAMENTARES]
#v(2pt)

40.1. O(A) ASSOCIADO(A) declara ciência de que o Estatuto Social e o Regimento Interno poderão sofrer alterações mediante os procedimentos de aprovação previstos nas normas institucionais.

40.2. As alterações regularmente aprovadas serão aplicáveis aos associados, respeitados os direitos assegurados pela legislação e os procedimentos de publicidade e comunicação institucional.

40.3. Nenhuma disposição deste contrato poderá ser utilizada para afastar competências legalmente atribuídas à Assembleia Geral ou aos demais órgãos da ASPPIBRA.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA QUADRAGÉSIMA PRIMEIRA – DOS CASOS OMISSOS]
#v(2pt)

41.1. Os casos omissos e as dúvidas relacionadas à aplicação deste contrato serão tratados conforme o Estatuto Social, o Regimento Interno e a legislação vigente.

41.2. Compete à Diretoria Executiva deliberar sobre os casos omissos, podendo solicitar parecer do Conselho Fiscal, conforme previsto no Estatuto.

41.3. As deliberações poderão ser submetidas a referendo da Assembleia Geral nas hipóteses estatutariamente previstas.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA QUADRAGÉSIMA SEGUNDA – DA INTEGRALIDADE DO INSTRUMENTO]
#v(2pt)

42.1. O presente contrato representa o instrumento de formalização do vínculo associativo entre as partes.

42.2. Integram a relação associativa, para todos os efeitos aplicáveis, o Estatuto Social, o Regimento Interno e as normas institucionais regularmente aprovadas.

42.3. Os instrumentos complementares eventualmente assinados pelo(a) ASSOCIADO(A) serão considerados parte integrante da relação jurídica correspondente, respeitadas suas finalidades específicas.

42.4. A eventual invalidade de uma disposição contratual não prejudicará automaticamente a validade das demais, desde que seja possível preservar a finalidade do instrumento e a compatibilidade com a legislação.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA QUADRAGÉSIMA TERCEIRA – DO FORO]
#v(2pt)

43.1. Para dirimir eventuais questões judiciais decorrentes da relação associativa, fica indicado o foro da Comarca de Maricá, Estado do Rio de Janeiro, conforme previsto no Estatuto Social, observadas as regras legais de competência aplicáveis.

#v(6pt)
#text(weight: "bold", fill: color_primary)[CLÁUSULA QUADRAGÉSIMA QUARTA – DA ACEITAÇÃO E ASSINATURA]
#v(2pt)

44.1. O(A) ASSOCIADO(A) declara que leu integralmente o presente contrato, compreendeu seu conteúdo e concorda com as obrigações e condições nele estabelecidas.

44.2. Declara, ainda, que recebeu ou teve acesso ao Estatuto Social da ASPPIBRA e ao Regimento Interno, comprometendo-se a observar suas disposições.

44.3. As partes reconhecem a validade das assinaturas físicas ou eletrônicas utilizadas para formalização deste instrumento, observados os requisitos legais aplicáveis.

44.4. O presente instrumento será firmado em vias de igual teor ou por meio eletrônico, permanecendo uma cópia disponível para cada parte.
#v(10pt)

#par(justify: true)[
  E, por estarem de pleno acordo, as partes assinam o presente instrumento.
]

#v(4pt)
#align(center)[
  #text(weight: "bold")[#get_val("cidade_emissao", "Maricá")] - #get_plain("uf_emissao", "RJ"), #get_val("data_extenso", "____ de __________________ de 2026").
]

#v(16pt)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 20pt,
  [
    #line(length: 100%, stroke: 0.6pt + color_primary)
    #v(2pt)
    #text(weight: "bold", size: 8pt)[PELA ASSOCIAÇÃO] \
    #text(size: 7.5pt)[*ASPPIBRA*] \
    #text(size: 7.5pt)[Representante: #get_val("rep_legal_nome", "Sandro de Souza")] \
    #text(size: 7pt, fill: color_secondary_text)[CPF: #get_plain("rep_legal_cpf", "000.000.000-00") • Cargo: #get_val("rep_legal_cargo", "Presidente Executivo")]
  ],
  [
    #line(length: 100%, stroke: 0.6pt + color_primary)
    #v(2pt)
    #text(weight: "bold", size: 8pt)[PELO ASSOCIADO] \
    #text(size: 7.5pt)[#get_val("associado_nome", "NOME COMPLETO / RAZÃO SOCIAL")] \
    #text(size: 7pt, fill: color_secondary_text)[CPF/CNPJ: #get_plain("associado_cpf_cnpj", get_plain_raw("associado_cpf", "000.000.000-00"))] \
    #text(size: 7pt, fill: color_secondary_text)[Rep. Legal (se PJ): #get_val("associado_rep_legal", "—")]
  ],
)

#v(14pt)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 20pt,
  [
    #line(length: 90%, stroke: 0.5pt + color_border_light)
    #v(2pt)
    #text(size: font_size_caption)[*TESTEMUNHA 1*] \
    #text(size: font_size_caption)[Nome: #get_val("testemunha1_nome", "___________________________")] \
    #text(size: font_size_caption, fill: color_secondary_text)[CPF: #get_plain("testemunha1_cpf", "___________________________")]
  ],
  [
    #line(length: 90%, stroke: 0.5pt + color_border_light)
    #v(2pt)
    #text(size: font_size_caption)[*TESTEMUNHA 2*] \
    #text(size: font_size_caption)[Nome: #get_val("testemunha2_nome", "___________________________")] \
    #text(size: font_size_caption, fill: color_secondary_text)[CPF: #get_plain("testemunha2_cpf", "___________________________")]
  ],
)

// ============================================================================
// ANEXO I – DECLARAÇÃO CADASTRAL E DE VÍNCULO IMOBILIÁRIO
// ============================================================================
#pagebreak()

#section_heading("ANEXO I – DECLARAÇÃO CADASTRAL E DE VÍNCULO IMOBILIÁRIO")

#v(4pt)

Eu, *#get_val("associado_nome", "NOME DO ASSOCIADO")*, inscrito(a) no CPF/CNPJ sob nº *#get_plain("associado_cpf_cnpj", get_plain_raw("associado_cpf", "000.000.000-00"))*, declaro, para fins de ingresso no quadro associativo da ASPPIBRA, que possuo a seguinte relação com imóvel situado no território nacional:

#v(6pt)

#text(weight: "bold", fill: color_primary)[1. IDENTIFICAÇÃO DO IMÓVEL]
#block(
  width: 100%,
  stroke: 0.5pt + color_border_light,
  inset: 8pt,
  radius: 3pt,
  fill: color_bg_box,
)[
  • *Endereço / Localização:* #get_val("imovel_endereco", "__________________________________________________") \
  • *Município:* #get_val("imovel_municipio", "___________________________") • *UF:* #get_plain("imovel_uf", "____") • *CEP:* #get_plain("imovel_cep", "__________") \
  • *Identificação adicional (Lote, Quadra, Gleba, Matrícula):* #get_val("imovel_identificacao", "__________________________________________________")
]

#v(6pt)
#text(weight: "bold", fill: color_primary)[2. NATUREZA DA RELAÇÃO COM O IMÓVEL]
#block(
  width: 100%,
  stroke: 0.5pt + color_border_light,
  inset: 8pt,
  radius: 3pt,
  fill: color_bg_box,
)[
  ( ) Proprietário(a). \
  ( ) Possuidor(a). \
  ( ) Outra condição admitida pela regulamentação da associação: #get_val("imovel_relacao_outra", "__________________________")
]

#v(6pt)
#text(weight: "bold", fill: color_primary)[3. DOCUMENTAÇÃO APRESENTADA]
#block(
  width: 100%,
  stroke: 0.5pt + color_border_light,
  inset: 8pt,
  radius: 3pt,
  fill: color_bg_box,
)[
  ( ) Matrícula ou certidão imobiliária. \
  ( ) Escritura ou instrumento de aquisição. \
  ( ) Contrato particular. \
  ( ) Documentação de posse. \
  ( ) Outros documentos: #get_val("imovel_docs_outros", "__________________________")
]

#v(6pt)
#par(justify: true)[
  Declaro que as informações prestadas são verdadeiras e autorizo sua utilização para análise da minha solicitação de ingresso, observadas as disposições da LGPD.
]

#v(14pt)
#align(center)[
  Local e data: #get_val("cidade_emissao", "Maricá/RJ"), #get_val("data_extenso", "____ de __________________ de 2026").
]

#v(18pt)
#align(center)[
  #line(length: 60%, stroke: 0.6pt + color_primary)
  #v(2pt)
  #text(weight: "bold", size: 8pt)[#get_val("associado_nome", "ASSINATURA DO ASSOCIADO")] \
  #text(size: 7.5pt, fill: color_secondary_text)[CPF/CNPJ: #get_plain("associado_cpf_cnpj", get_plain_raw("associado_cpf", "000.000.000-00"))]
]

// ============================================================================
// ANEXO II – TERMO DE CIÊNCIA E COMPROMISSO INSTITUCIONAL
// ============================================================================
#pagebreak()

#section_heading("ANEXO II – TERMO DE CIÊNCIA E COMPROMISSO INSTITUCIONAL")

#v(6pt)

Eu, *#get_val("associado_nome", "NOME DO ASSOCIADO")*, na qualidade de associado(a) da *ASSOCIAÇÃO DOS PROPRIETÁRIOS E POSSUIDORES DE IMÓVEIS NO BRASIL – ASPPIBRA*, declaro expressamente:

#block(inset: (left: 10pt), spacing: 5pt)[
  *I –* Que conheço as finalidades institucionais da associação; \
  *II –* Que tive acesso ao Estatuto Social e ao Regimento Interno; \
  *III –* Que compreendo meus direitos e deveres associativos; \
  *IV –* Que me comprometo a respeitar as normas institucionais; \
  *V –* Que reconheço a natureza não lucrativa da associação; \
  *VI –* Que compreendo a natureza exclusivamente institucional da Credencial de Associado Digital – CAD; \
  *VII –* Que reconheço a inexistência de direitos patrimoniais individuais sobre os bens da associação; \
  *VIII –* Que me comprometo a preservar o patrimônio material, imaterial e digital da ASPPIBRA; \
  *IX –* Que observarei as normas de proteção de dados e segurança da informação; \
  *X –* Que cumprirei as deliberações legítimas dos órgãos competentes.
]

#v(6pt)
#par(justify: true)[
  Declaro, finalmente, que minha adesão é voluntária e consciente, assumindo o compromisso de contribuir para o fortalecimento e desenvolvimento das finalidades institucionais da ASPPIBRA.
]

#v(14pt)
#align(center)[
  Local e data: #get_val("cidade_emissao", "Maricá/RJ"), #get_val("data_extenso", "____ de __________________ de 2026").
]

#v(18pt)
#align(center)[
  #line(length: 60%, stroke: 0.6pt + color_primary)
  #v(2pt)
  #text(weight: "bold", size: 8pt)[#get_val("associado_nome", "ASSINATURA DO ASSOCIADO")] \
  #text(size: 7.5pt, fill: color_secondary_text)[CPF/CNPJ: #get_plain("associado_cpf_cnpj", get_plain_raw("associado_cpf", "000.000.000-00"))]
]

// ============================================================================
// ANEXO III – QUADRO DE CONTRIBUIÇÃO ASSOCIATIVA
// ============================================================================
#pagebreak()

#section_heading("ANEXO III – QUADRO DE CONTRIBUIÇÃO ASSOCIATIVA")

#v(6pt)

#block(
  width: 100%,
  stroke: 0.6pt + color_border,
  inset: 10pt,
  radius: 4pt,
  fill: color_bg_box,
)[
  #grid(
    columns: (1fr, 1fr),
    row-gutter: 8pt,
    [• *Identificação do associado:* #get_val("associado_nome", "______________________________")],
    [• *CPF / CNPJ:* #get_plain("associado_cpf_cnpj", get_plain_raw("associado_cpf", "__________________________"))],
    [• *Categoria ou modalidade:* #get_val("associado_categoria", "Associado Titular Efetivo")],
    [• *Valor da contribuição:* R\$ #get_val("contribuicao_valor", "_______________________________")],
    [• *Periodicidade:* #get_val("contribuicao_periodicidade", "________________________________________")],
    [• *Vencimento:* #get_val("contribuicao_vencimento", "_________________________________________")],
    [• *Forma de pagamento:* #get_val("contribuicao_forma_pagamento", "__________________________________")],
    [• *Aprovação institucional:* #get_val("contribuicao_deliberacao", "_____________________")],
    [• *Referência Regimento Interno:* #get_val("contribuicao_regimento_ref", "_________________________")],
    [• *Início da obrigação financeira:* #get_val("contribuicao_data_inicio", "____________________")],
  )
]

#v(8pt)
#par(justify: true)[
  Declaro estar ciente das obrigações financeiras associativas acima identificadas.
]

#v(14pt)
#align(center)[
  Local e data: #get_val("cidade_emissao", "Maricá/RJ"), #get_val("data_extenso", "____ de __________________ de 2026").
]

#v(18pt)
#align(center)[
  #line(length: 60%, stroke: 0.6pt + color_primary)
  #v(2pt)
  #text(weight: "bold", size: 8pt)[#get_val("associado_nome", "ASSINATURA DO ASSOCIADO")] \
  #text(size: 7.5pt, fill: color_secondary_text)[CPF/CNPJ: #get_plain("associado_cpf_cnpj", get_plain_raw("associado_cpf", "000.000.000-00"))]
]

// ============================================================================
// DECLARAÇÃO FINAL DE ADESÃO
// ============================================================================
#v(14pt)

#section_heading("DECLARAÇÃO FINAL DE ADESÃO")

#v(6pt)
#par(justify: true)[
  Declaro que todas as informações fornecidas neste instrumento e em seus anexos são verdadeiras, assumindo responsabilidade pela autenticidade dos documentos apresentados e pela atualização das informações cadastrais.
]

#par(justify: true)[
  Declaro, ainda, que minha adesão à ASPPIBRA representa manifestação livre e consciente de vontade, comprometendo-me a respeitar o Estatuto Social, o Regimento Interno e as normas institucionais regularmente aprovadas.
]

#v(14pt)
#align(center)[
  Local e data: #get_val("cidade_emissao", "Maricá/RJ"), #get_val("data_extenso", "____ de __________________ de 2026").
]

#v(18pt)
#align(center)[
  #line(length: 60%, stroke: 0.6pt + color_primary)
  #v(2pt)
  #text(weight: "bold", size: 8pt)[#get_val("associado_nome", "ASSINATURA DO ASSOCIADO")] \
  #text(size: 7.5pt, fill: color_secondary_text)[CPF/CNPJ: #get_plain("associado_cpf_cnpj", get_plain_raw("associado_cpf", "000.000.000-00"))]
]

#v(16pt)

// Carimbo e Selo Criptográfico de Integridade
#rect(
  width: 100%,
  stroke: 1pt + color_emerald_dark,
  radius: 4pt,
  fill: color_emerald_light,
  inset: 8pt,
)[
  #align(center)[
    #text(size: 7.5pt, weight: "bold", fill: color_primary)[
      PROTOCOLO ELETRÔNICO OFICIAL • CERTIFICAÇÃO DE INTEGRIDADE DIGITÁRIA DEVOS DESKTOP
    ] \
    #text(size: 7pt, fill: color_secondary_text)[
      Identificador: #doc_number • Código de Rastreabilidade: #auth_code • Digest SHA-256 Validado no Motor Nativo Typst
    ]
  ]
]
