// ============================================================================
// ASPPIBRA DAO - TERMO DE ADESÃO E FILIAÇÃO ASSOCIATIVA
// INSTRUMENTO PARTICULAR DE INGRESSO AO QUADRO SOCIAL E GOVERNANÇA DAO
// (MODELO CANÔNICO ABNT NBR 14724 / GOVERNANÇA INSTITUCIONAL)
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

// Helpers locais para extração e renderização tipada de tags
#let get_val(key, label) = {
  let val = contract_data.at(key, default: none)
  asppibra_tag(label, val)
}

#let get_plain(key, default_val) = {
  let val = contract_data.at(key, default: none)
  if val != none and str(val).trim() != "" {
    str(val).trim()
  } else {
    default_val
  }
}

// Configuração Global do Documento e Geometria ABNT NBR 14724
#set document(
  title: "Termo de Adesão e Filiação Associativa - " + doc_number,
  author: asppibra_razao_social,
  keywords: ("Filiação", "Associado", "ASPPIBRA", "Governança DAO", "Regularização Fundiária"),
)

#set page(
  paper: standard_paper,
  margin: margins_institutional_contract,
  header: context {
    let i = counter(page).get().first()
    if i > 1 {
      asppibra_header_running(
        doc_number: doc_number,
        doc_title: "Termo de Adesão e Filiação Associativa • ASPPIBRA DAO",
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

// Cabeçalho Institucional Oficial da 1ª Página
#asppibra_header_first_page(doc_number: doc_number)

#v(8pt)

// Título Oficial Centralizado do Instrumento
#align(center)[
  #text(size: font_size_title, weight: "bold", fill: color_primary)[
    TERMO DE ADESÃO, FILIAÇÃO ASSOCIATIVA E COMPROMISSO DE GOVERNANÇA
  ] \
  #v(2pt)
  #text(size: font_size_caption, fill: color_secondary_text, weight: "bold")[
    PROTOCOLO INSTITUCIONAL Nº #doc_number • AUTENTICAÇÃO: #auth_code
  ]
]

#v(10pt)

// ============================================================================
// PREÂMBULO: QUALIFICAÇÃO COMPLETA DAS PARTES
// ============================================================================

#section_heading("1. QUALIFICAÇÃO DAS PARTES CONTRATANTES")

#par[
  Pelo presente instrumento particular, de um lado, na qualidade de entidade associativa civil de representação e governança comunitária:
]

#v(3pt)

#rect(
  width: 100%,
  stroke: 0.6pt + color_border,
  radius: 4pt,
  fill: color_bg_box,
  inset: 10pt,
)[
  #text(weight: "bold", size: font_size_running, fill: color_primary)[ENTIDADE ASSOCIATIVA / DAO:] \
  #text(weight: "bold")[#asppibra_razao_social], pessoa jurídica de direito privado constituída sob a forma de associação civil sem fins lucrativos, inscrita no CNPJ/MF sob o nº #text(weight: "bold")[#asppibra_cnpj], com sede administrativa no Município de Maricá, Estado do Rio de Janeiro, doravante denominada simplesmente #text(weight: "bold")[#asppibra_razao_social_curta] ou #text(weight: "bold")[ASSOCIAÇÃO]; e, de outro lado, na qualidade de proponente ingressante:
  
  #v(6pt)
  #line(length: 100%, stroke: 0.5pt + color_border_light)
  #v(6pt)

  #text(weight: "bold", size: font_size_running, fill: color_primary)[MEMBRO ASSOCIADO ADERENTE:] \
  *Nome Completo:* #get_val("associado_nome", "NOME COMPLETO DO ASSOCIADO") \
  *Nacionalidade:* #get_val("associado_nacionalidade", "Brasileira") | *Estado Civil:* #get_val("associado_estado_civil", "ESTADO CIVIL") \
  *Profissão:* #get_val("associado_profissao", "PROFISSÃO") \
  *Documento de Identidade (RG):* #get_val("associado_rg", "RG / ÓRGÃO EXPEDIDOR") \
  *Cadastro de Pessoa Física (CPF/MF):* #get_val("associado_cpf", "000.000.000-00") \
  *Endereço Residencial:* #get_val("associado_endereco", "LOGRADOURO, NÚMERO, BAIRRO, MUNICÍPIO/UF, CEP") \
  *Correio Eletrônico (E-mail):* #get_val("associado_email", "email@dominio.com") | *Telefone:* #get_val("associado_telefone", "(00) 00000-0000") \
  *Categoria de Ingresso:* #get_val("associado_categoria", "Associado Titular Efetivo") \
  *Matrícula Associativa / ASP-ID:* #get_val("associado_id", "ASP-" + doc_number), \
  doravante denominado simplesmente #text(weight: "bold")[ASSOCIADO].
]

#v(8pt)

#par[
  Têm entre si, justo e contratado, o presente Termo de Adesão e Filiação, mediante as cláusulas e condições seguintes, às quais se obrigam mutuamente:
]

#v(6pt)

// ============================================================================
// CLÁUSULAS CONTRATUAIS
// ============================================================================

#section_heading("2. DO OBJETO E DA ADESÃO AO QUADRO SOCIAL")

#par[
  *CLÁUSULA PRIMEIRA - DA ADESÃO VOLUNTÁRIA:* O *ASSOCIADO*, por livre e espontânea vontade, adere formalmente ao quadro social da *ASPPIBRA*, declarando para todos os efeitos de direito que conhece, aceita e se submete integralmente às disposições do Estatuto Social da Entidade, ao Regimento Interno, às resoluções dos órgãos deliberativos e às diretrizes de Governança Descentralizada (DAO) em vigor.
]

#par[
  *PARÁGRAFO PRIMEIRO:* A presente filiação confere ao *ASSOCIADO* o vínculo associativo formal perante a comunidade e perante órgãos públicos e privados, habilitando-o a participar das deliberações institucionais de interesse coletivo, bem como aos projetos comunitários e territoriais promovidos pela Associação.
]

#par[
  *PARÁGRAFO SEGUNDO:* O ingresso ora pactuado é de caráter estritamente pessoal e intransferível, não gerando para o *ASSOCIADO* qualquer responsabilidade solidária ou subsidiária pelas obrigações sociais, financeiras ou tributárias contraídas pela *ASPPIBRA*, nos termos do Art. 46, inciso V, da Lei nº 10.406/2002 (Código Civil Brasileiro).
]

#v(6pt)

#section_heading("3. DAS FINALIDADES INSTITUCIONAIS E REGULARIZAÇÃO TERRITORIAL")

#par[
  *CLÁUSULA SEGUNDA - DA MISSÃO INSTITUCIONAL:* A *ASPPIBRA* tem por objeto estatutário a defesa dos direitos dos legítimos possuidores e proprietários de imóveis rurais e urbanos, a promoção da regularização fundiária de interesse social e específico (REURB), a assistência técnica e urbanística, a preservação ambiental sustentável, o fomento à agroecologia e a modernização cadastral territorial assistida por tecnologias descentralizadas.
]

#par[
  *PARÁGRAFO ÚNICO:* O *ASSOCIADO* declara que o imóvel ou posse por ele titulado ou ocupado, situado na circunscrição geográfica de atuação da Associação, integrará os levantamentos cadastrais e os processos de regularização e infraestrutura promovidos pelo corpo técnico da *ASPPIBRA*, comprometendo-se o associado a fornecer as plantas, certidões, memoriais descritivos e históricos fáticos de posse que se fizerem necessários.
]

#v(6pt)

#section_heading("4. DOS DIREITOS DO ASSOCIADO")

#par[
  *CLÁUSULA TERCEIRA - DAS PRERROGATIVAS E BENEFÍCIOS:* São direitos assegurados ao *ASSOCIADO* adimplente com suas obrigações estatutárias:
]

#list(
  [Participar com voz e voto das Assembleias Gerais Ordinárias e Extraordinárias, bem como das votações telemáticas na plataforma de governança descentralizada da DAO;],
  [Acessar a assistência jurídica, técnica, topográfica e documental promovida coletivamente pela Associação no âmbito dos projetos de regularização territorial;],
  [Solicitar e obter certidões oficiais, declarações de filiação ativa, relatórios de reconciliação cadastral e extratos de contas com validação de integridade criptográfica SHA-256;],
  [Acompanhar em tempo real os lançamentos contábeis e a aplicação dos recursos comunitários através do Livro-Razão transparente e auditável do DevOS Desktop;],
  [Usufruir da infraestrutura de telecomunicações comunitárias, rede DePIN e armazenamento descentralizado IPFS disponibilizados aos membros participantes.]
)

#v(6pt)

#section_heading("5. DOS DEVERES E COMPROMISSOS DO ASSOCIADO")

#par[
  *CLÁUSULA QUARTA - DAS OBRIGAÇÕES SOCIAIS:* Constituem deveres fundamentais do *ASSOCIADO*:
]

#list(
  [Cumprir e fazer cumprir o Estatuto Social, os Regimentos e as deliberações emanadas da Diretoria e da Assembleia Comunitária;],
  [Manter rigorosamente atualizados seus dados cadastrais, endereço residencial, contatos telefônicos e endereço eletrônico no sistema DevOS Desktop;],
  [Recolher tempestivamente as contribuições associativas de custeio e manutenção deliberadas em assembleia, destinadas à sustentabilidade operacional da infraestrutura coletiva;],
  [Zelar pelo patrimônio comum, pela convivência pacífica e harmoniosa entre os posseiros vizinhos e pela proteção às áreas de preservação permanente (APP);],
  [Não utilizar o nome, a marca ou a sigla da ASPPIBRA para fins político-partidários, individuais ou contrários aos interesses da coletividade de associados.]
)

#v(6pt)

#section_heading("6. DA CONTRIBUIÇÃO DE CUSTEIO E DO LIVRO-RAZÃO")

#par[
  *CLÁUSULA QUINTA - DA SUSTENTABILIDADE FINANCEIRA:* A manutenção dos serviços operacionais, auditorias técnicas, sistemas computacionais e representação coletiva da *ASPPIBRA* é viabilizada pelo Fundo Associativo Comunitário.
]

#par[
  *PARÁGRAFO PRIMEIRO:* O *ASSOCIADO* compromete-se ao pagamento da contribuição associativa regular no valor de #get_val("contribuicao_valor", "R$ 0,00 (Consulte tabela estatutária)"), com periodicidade #get_val("contribuicao_periodicidade", "Mensal"), vencível no dia #get_val("contribuicao_vencimento", "10") de cada mês, através das modalidades de liquidação disponibilizadas no Banco Digital da Associação (Pix Instantâneo ou Livro-Razão Comunitário).
]

#par[
  *PARÁGRAFO SEGUNDO:* Todos os aportes, contribuições e liquidações são escriturados de forma imutável no Livro-Razão de partidas dobradas do sistema DevOS, garantindo ao *ASSOCIADO* a visualização a qualquer momento do respectivo Extrato Financeiro Oficial autenticado.
]

#v(6pt)

#section_heading("7. DA PRIVACIDADE, SEGURANÇA E PROTEÇÃO DE DADOS (LGPD)")

#par[
  *CLÁUSULA SEXTA - DO TRATAMENTO DE DADOS PESSOAIS:* Em atendimento às disposições da Lei Federal nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD), o *ASSOCIADO* autoriza expressamente a *ASPPIBRA* a realizar o tratamento e a custódia de seus dados cadastrais, patrimoniais e documentais, única e exclusivamente para as finalidades legítimas de representação associativa, formulação de processos administrativos de regularização fundiária (REURB), auditoria interna e emissão de declarações institucionais.
]

#par[
  *PARÁGRAFO ÚNICO:* A Associação compromete-se a manter os dados armazenados sob parâmetros de segurança da informação, criptografia em repouso e trilha de auditoria inviolável, assegurando ao titular o direito de acesso, confirmação e retificação cadastral a qualquer tempo.
]

#v(6pt)

#section_heading("8. DO DESLIGAMENTO E PENALIDADES")

#par[
  *CLÁUSULA SÉTIMA - DA DESFILIAÇÃO E EXCLUSÃO:* O *ASSOCIADO* poderá solicitar seu desligamento voluntário do quadro social a qualquer momento, mediante comunicação formal protocolada junto à Secretaria da Associação ou via aplicativo oficial, desde que quitadas eventuais obrigações pecuniárias pendentes até a data do pedido.
]

#par[
  *PARÁGRAFO ÚNICO:* A exclusão de associado em razão de falta grave, infração estatutária reiterada ou conduta lesiva à coletividade somente será aplicada após regular procedimento administrativo que assegure o direito de ampla defesa e contraditório perante o Conselho Deliberativo da Associação.
]

#v(6pt)

#section_heading("9. DA VALIDADE JURÍDICA E FORMALIZAÇÃO ELETRÔNICA")

#par[
  *CLÁUSULA OITAVA - DA FORÇA EXECUTIVA E PROTOCOLO DIGITAL:* As partes declaram e reconhecem a plena eficácia jurídica deste instrumento particular emitido e autenticado por meio eletrônico pelo sistema DevOS Desktop, conferindo ao hash criptográfico SHA-256 e ao identificador de protocolo gravados no rodapé valor comprobatório de autenticidade, integridade e tempestividade do consentimento, nos moldes do Art. 10, § 2º, da Medida Provisória nº 2.200-2/2001 e do Art. 784, inciso III, do Código de Processo Civil.
]

#v(6pt)

#section_heading("10. DO FORO")

#par[
  *CLÁUSULA NONA - DA ELEIÇÃO DE FORO:* Para dirimir quaisquer litígios decorrentes do presente Termo de Adesão ou da relação associativa que não possam ser compostos administrativamente pela mediação comunitária, as partes elegem expressamente o Foro da Comarca de #get_plain("cidade_foro", "Maricá"), Estado do #get_plain("estado_foro", "Rio de Janeiro"), com renúncia expressa a qualquer outro, por mais privilegiado que seja.
]

#v(14pt)

// ============================================================================
// FECHAMENTO E BLOCO FORMAL DE ASSINATURAS
// ============================================================================

#align(center)[
  #text(weight: "bold")[
    #get_plain("cidade_emissao", "Maricá/RJ"), #get_plain("data_extenso", "15 de Novembro de 2026").
  ]
]

#v(20pt)

// Assinaturas Principais Lado a Lado
#grid(
  columns: (1fr, 1fr),
  column-gutter: 24pt,
  align: center,
  [
    #line(length: 90%, stroke: 0.8pt + color_primary_text)
    #v(3pt)
    #text(weight: "bold", size: font_size_running)[#asppibra_razao_social_curta] \
    #text(size: font_size_caption, fill: color_secondary_text)[DIRETORIA INSTITUCIONAL / GOVERNANÇA DAO] \
    #text(size: font_size_caption, fill: color_secondary_text)[CNPJ: #asppibra_cnpj]
  ],
  [
    #line(length: 90%, stroke: 0.8pt + color_primary_text)
    #v(3pt)
    #text(weight: "bold", size: font_size_running)[#get_val("associado_nome", "NOME DO ASSOCIADO")] \
    #text(size: font_size_caption, fill: color_secondary_text)[MEMBRO ASSOCIADO ADERENTE] \
    #text(size: font_size_caption, fill: color_secondary_text)[CPF: #get_val("associado_cpf", "000.000.000-00")]
  ],
)

#v(24pt)

// Testemunhas Formais Instrumentais
#align(center)[
  #text(weight: "bold", size: font_size_caption, fill: color_secondary_text)[TESTEMUNHAS INSTRUMENTAIS:]
]

#v(12pt)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 24pt,
  align: center,
  [
    #line(length: 85%, stroke: 0.5pt + color_border_light)
    #v(2pt)
    #text(size: font_size_caption)[1. Nome: #get_val("testemunha1_nome", "___________________________")] \
    #text(size: font_size_caption, fill: color_secondary_text)[CPF: #get_val("testemunha1_cpf", "___________________________")]
  ],
  [
    #line(length: 85%, stroke: 0.5pt + color_border_light)
    #v(2pt)
    #text(size: font_size_caption)[2. Nome: #get_val("testemunha2_nome", "___________________________")] \
    #text(size: font_size_caption, fill: color_secondary_text)[CPF: #get_val("testemunha2_cpf", "___________________________")]
  ],
)

#v(14pt)

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
