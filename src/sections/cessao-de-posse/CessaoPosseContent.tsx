'use client';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';

import {
  Clause,
  DataTag,
  ABNTText,
  SectionTitle,
  DocumentTitle,
  DigitalSignature,
} from 'src/shared/components/abnt-document';

export function CessaoPosseContent() {
  return (
    <Box>
      <DocumentTitle>
        INSTRUMENTO PARTICULAR DE CESSÃO DE POSSE DE IMÓVEL
      </DocumentTitle>

      {/* CAPÍTULO I */}
      <SectionTitle>CAPÍTULO I – DAS PARTES</SectionTitle>
      
      <Clause>
        1.1. <strong>CEDENTE:</strong> <DataTag text="NOME COMPLETO DO CEDENTE" field="cedenteNome" />,{' '}
        <DataTag text="NACIONALIDADE" field="cedenteNacionalidade" />, maior e capaz,{' '}
        <DataTag text="ESTADO CIVIL" field="cedenteEstadoCivil" />,{' '}
        <DataTag text="PROFISSÃO" field="cedenteProfissao" />, portador(a) da Carteira de Identidade (RG) nº{' '}
        <DataTag text="NÚMERO DO RG" field="cedenteRg" />, órgão expedidor{' '}
        <DataTag text="ÓRGÃO E UF" field="cedenteRgOrgaoUf" />, inscrito(a) no CPF sob o nº{' '}
        <DataTag text="NÚMERO DO CPF" field="cedenteCpf" />, residente e domiciliado(a) na{' '}
        <DataTag text="ENDEREÇO COMPLETO COM CEP" field="cedenteEndereco" />, endereço eletrônico (e-mail):{' '}
        <DataTag text="E-MAIL DO CEDENTE" field="cedenteEmail" /> e telefone/WhatsApp:{' '}
        <DataTag text="TELEFONE COM DDD" field="cedenteTelefone" />, doravante denominado(a) simplesmente <strong>CEDENTE</strong>.
      </Clause>

      <Clause>
        1.2. <strong>CÔNJUGE / COMPANHEIRO(A) DO CEDENTE:</strong> <DataTag text="NOME COMPLETO DO CÔNJUGE/COMPANHEIRO(A)" field="conjugeNome" />,{' '}
        <DataTag text="NACIONALIDADE" field="conjugeNacionalidade" />, maior e capaz,{' '}
        <DataTag text="ESTADO CIVIL" field="conjugeEstadoCivil" />,{' '}
        <DataTag text="PROFISSÃO" field="conjugeProfissao" />, portador(a) da Carteira de Identidade (RG) nº{' '}
        <DataTag text="NÚMERO DO RG" field="conjugeRg" />, órgão expedidor{' '}
        <DataTag text="ÓRGÃO E UF" field="conjugeRgOrgaoUf" />, inscrito(a) no CPF/MF sob o nº{' '}
        <DataTag text="NÚMERO DO CPF" field="conjugeCpf" />, residente e domiciliado(a) na{' '}
        <DataTag text="ENDEREÇO COMPLETO COM CEP" field="conjugeEndereco" />, endereço eletrônico (e-mail):{' '}
        <DataTag text="E-MAIL DO CÔNJUGE" field="conjugeEmail" /> e telefone/WhatsApp:{' '}
        <DataTag text="TELEFONE COM DDD" field="conjugeTelefone" />, na qualidade de{' '}
        <DataTag text="OUTORGANTE UXÓRIO / MARITAL / ANUENTE" field="conjugeQualidade" />.
      </Clause>

      <Clause>
        1.3. <strong>CESSIONÁRIO(A):</strong> <DataTag text="NOME DO CESSIONÁRIO" field="cessionarioNome" />,{' '}
        <DataTag text="NACIONALIDADE" field="cessionarioNacionalidade" />, maior e capaz,{' '}
        <DataTag text="ESTADO CIVIL" field="cessionarioEstadoCivil" />,{' '}
        <DataTag text="PROFISSÃO" field="cessionarioProfissao" />, portador(a) da Carteira de Identidade (RG) nº{' '}
        <DataTag text="RG DO CESSIONÁRIO" field="cessionarioRg" />, órgão expedidor{' '}
        <DataTag text="ÓRGÃO E UF DO CESSIONÁRIO" field="cessionarioRgOrgaoUf" />, inscrito(a) no CPF sob o nº{' '}
        <DataTag text="CPF DO CESSIONÁRIO" field="cessionarioCpf" />, residente e domiciliado(a) em{' '}
        <DataTag text="ENDEREÇO COMPLETO DO CESSIONÁRIO, COM CEP" field="cessionarioEndereco" />, e-mail{' '}
        <DataTag text="E-MAIL DO CESSIONÁRIO" field="cessionarioEmail" /> e telefone/WhatsApp{' '}
        <DataTag text="TELEFONE DO CESSIONÁRIO" field="cessionarioTelefone" />, doravante denominado(a) simplesmente <strong>CESSIONÁRIO(A)</strong>.
      </Clause>

      <Clause>
        1.4. Em caso de pluralidade de cessionários, estes serão doravante denominados em conjunto <strong>CESSIONÁRIOS</strong>, respondendo cada um individualmente pela parte do imóvel que lhe for especificamente cedida nos termos do Capítulo III, sem solidariedade entre si quanto às obrigações de pagamento relativas à parte de outrem, salvo disposição expressa em contrário, ressalvada a hipótese de cessionários unidos entre si por casamento ou união estável sob regime de bens que implique comunhão, caso em que a responsabilidade pelas obrigações de pagamento observará as regras do respectivo regime de bens, independentemente da regra de ausência de solidariedade prevista nesta Cláusula.
      </Clause>

      <Clause>
        1.4.1. Os percentuais de participação de cada CESSIONÁRIO deverão ser expressamente indicados em tabela anexa a este instrumento (Cláusula 3.5), com a especificação, para cada CESSIONÁRIO, de sua fração de posse, de preço, de responsabilidade por benfeitorias e, quando cabível, de retenção ou devolução em caso de distrato, indicando-se ainda se as proporções são aplicáveis igualmente aos dois lotes ou de forma distinta a cada um.
      </Clause>

      <Clause>
        1.5. <strong>DA ASPPIBRA – ADMINISTRAÇÃO CONTRATUAL, COORDENAÇÃO OPERACIONAL, COBRANÇA, RECEBIMENTO E REPASSE</strong>
      </Clause>

      <Clause>
        <strong>1.5.1. Da condição e finalidade de atuação.</strong> A <strong>ASPPIBRA – ASSOCIAÇÃO DOS PROPRIETÁRIOS E POSSEIROS DE IMÓVEIS NO BRASIL</strong>, pessoa jurídica de direito privado constituída sob a forma de associação civil sem fins lucrativos, inscrita no CNPJ sob o nº 26.325.396/0001-30, com sede em <DataTag text="ENDEREÇO COMPLETO DA SEDE DA ASPPIBRA, COM CEP" field="asppibraEnderecoSede" />, neste ato representada na forma de seu Estatuto Social por <DataTag text="NOME COMPLETO DO REPRESENTANTE LEGAL DA ASPPIBRA" field="asppibraRepresentanteNome" />, <DataTag text="CARGO/FUNÇÃO ESTATUTÁRIA" field="asppibraRepresentanteCargo" />, <DataTag text="NACIONALIDADE" field="asppibraRepresentanteNacionalidade" />, <DataTag text="ESTADO CIVIL" field="asppibraRepresentanteEstadoCivil" />, portador(a) da Carteira de Identidade (RG) nº <DataTag text="RG DO REPRESENTANTE LEGAL" field="asppibraRepresentanteRg" />, órgão expedidor <DataTag text="ÓRGÃO E UF DO REPRESENTANTE" field="asppibraRepresentanteRgOrgaoUf" />, inscrito(a) no CPF sob o nº <DataTag text="CPF DO REPRESENTANTE LEGAL" field="asppibraRepresentanteCpf" />, cujos poderes de representação constam de <DataTag text="ATA DE ELEIÇÃO/PROCURAÇÃO Nº DOCUMENTO DE PODERES" field="asppibraDocumentoPoderes" />, doravante denominada “<strong>ASPPIBRA</strong>”, intervém neste instrumento na qualidade de <strong>INTERVENIENTE ADMINISTRADORA, COORDENADORA OPERACIONAL E MANDATÁRIA CONTRATUAL</strong>, nos limites deste instrumento, de seu Estatuto Social e da legislação aplicável.
      </Clause>

      <Clause>
        1.5.2. A atuação da ASPPIBRA compreende a administração operacional deste contrato, a coordenação das providências administrativas relacionadas à sua execução, a organização documental, o acompanhamento dos procedimentos de regularização fundiária e registral, a articulação entre as partes e os profissionais envolvidos e a administração operacional do fluxo de pagamentos, inclusive cobrança, recebimento, conciliação, retenções autorizadas, repasses e prestação de contas.
      </Clause>

      <Clause>
        1.5.3. A ASPPIBRA não é CEDENTE, CESSIONÁRIA, titular dominial, possuidora ou garantidora da aquisição da propriedade ou de qualquer direito real sobre o imóvel, nem assume as obrigações materiais que este instrumento atribui diretamente às demais partes.
      </Clause>

      <Clause>
        1.5.4. A presente intervenção não transfere à ASPPIBRA a titularidade econômica dos créditos pertencentes ao CEDENTE ou a qualquer outro titular expressamente indicado neste instrumento. Os valores que a ASPPIBRA receber em razão deste contrato, enquanto não constituírem remuneração ou despesa própria validamente exigível, serão recebidos <strong>por conta e ordem do respectivo titular</strong>.
      </Clause>

      <Clause>
        <strong>1.5.5. Dos poderes de administração.</strong> Dentro dos limites deste instrumento, compete à ASPPIBRA:
        <br />
        a) organizar, receber, conferir formalmente e encaminhar documentos;
        <br />
        b) acompanhar protocolos, exigências, diligências, prazos e etapas administrativas;
        <br />
        c) promover a comunicação operacional entre as partes, profissionais e entidades envolvidas;
        <br />
        d) contratar, indicar, coordenar ou acompanhar profissionais legalmente habilitados, conforme a natureza de cada ato;
        <br />
        e) administrar operacionalmente as obrigações financeiras previstas neste instrumento;
        <br />
        f) praticar os atos administrativos necessários à execução regular do contrato, desde que não alterem direitos materiais das partes sem autorização específica.
      </Clause>

      <Clause>
        1.5.6. A ASPPIBRA não poderá, sem autorização expressa das partes quando exigível, alterar o preço da cessão, conceder desconto ou remissão, renunciar a direitos, assumir obrigações novas em nome de qualquer parte ou alterar substancialmente este instrumento.
      </Clause>

      <Clause>
        <strong>1.5.7. Da contratação de profissionais e atuação jurídica.</strong> A ASPPIBRA poderá contratar ou coordenar advogados, engenheiros, arquitetos, topógrafos, técnicos e outros profissionais legalmente habilitados necessários à execução do objeto.
      </Clause>

      <Clause>
        1.5.8. A responsabilidade técnica, profissional e ética pelos atos próprios de profissão regulamentada permanecerá atribuída ao respectivo profissional habilitado que os praticar, sem prejuízo da responsabilidade da ASPPIBRA por seus próprios atos administrativos, nos termos deste instrumento e da legislação aplicável.
      </Clause>

      <Clause>
        1.5.9. A ASPPIBRA não prestará, por si própria, serviços jurídicos privativos de advogado. A orientação jurídica individual, emissão de parecer, elaboração ou assinatura de peças privativas e representação judicial ou extrajudicial individual serão realizadas por advogado legalmente habilitado e constituído pelo interessado, mediante mandato próprio quando necessário.
      </Clause>

      <Clause>
        1.5.10. A ASPPIBRA poderá exercer apoio administrativo, técnico e institucional em procedimentos de REURB, usucapião e regularização registral, inclusive perante órgãos públicos e serventias, observadas as competências legalmente atribuídas a cada agente e os requisitos do procedimento concreto.
      </Clause>

      <Clause>
        <strong>1.5.11. Da cobrança, mandato e recebimento.</strong> O CEDENTE, na qualidade de titular dos créditos que lhe forem devidos em razão deste instrumento, autoriza e constitui a ASPPIBRA como sua <strong>mandatária para administração operacional da cobrança, recebimento e posterior repasse</strong>, nos limites aqui estabelecidos, reconhecendo o CESSIONÁRIO essa forma de pagamento.
      </Clause>

      <Clause>
        1.5.12. Para execução do mandato, a ASPPIBRA poderá administrar cobranças por boleto bancário, Pix Cobrança, transferência bancária ou outros meios de pagamento admitidos, utilizando, quando necessário, instituição financeira, instituição de pagamento ou plataforma de cobrança regularmente habilitada.
      </Clause>

      <Clause>
        1.5.13. A emissão, apresentação, identificação do beneficiário, liquidação e demais características dos boletos e instrumentos de pagamento deverão observar a legislação e a regulamentação aplicáveis, bem como as regras da instituição financeira ou de pagamento utilizada na operação.
      </Clause>

      <Clause>
        <strong>1.5.14. Da conta operacional da ASPPIBRA.</strong> As partes autorizam expressamente que os valores decorrentes deste instrumento sejam pagos em <strong>conta bancária de titularidade da ASPPIBRA, vinculada ao seu CNPJ e expressamente identificada neste instrumento</strong>, destinada à arrecadação, administração e posterior repasse dos valores recebidos por conta e ordem dos respectivos titulares.
      </Clause>

      {/* TABELA DE DADOS DA CONTA OPERACIONAL DA ASPPIBRA */}
      <Box sx={{ my: 1.5, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, borderColor: '#000', maxWidth: 650, mx: 'auto' }}>
          <Table size="small">
            <TableBody>
              <TableRow sx={{ bgcolor: '#F4F6F8' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '9.5pt', borderBottom: '1.5px solid #000', textAlign: 'center' }}>
                  DADOS DA CONTA OPERACIONAL (ASPPIBRA)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '35%', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Instituição / Banco</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>
                  <DataTag text="403 - CORA SCD" field="asppibraBanco" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Agência e Conta</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>
                  Agência: <DataTag text="0001" field="asppibraAgencia" /> | Conta: <DataTag text="6193441-3" field="asppibraConta" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Titular e CNPJ</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>
                  ASPPIBRA – Associação dos Proprietários e Posseiros de Imóveis no Brasil (CNPJ: 26.325.396/0001-30)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '9pt' }}>Chave Pix</TableCell>
                <TableCell sx={{ fontSize: '9pt' }}>
                  <DataTag text="26.325.396/0001-30 (CNPJ)" field="asppibraChavePix" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Clause>
        1.5.15. A indicação da conta da ASPPIBRA como conta de recebimento constitui elemento expresso deste contrato e autoriza o CESSIONÁRIO a efetuar nela os pagamentos previstos neste instrumento.
      </Clause>

      <Clause>
        1.5.16. O recebimento dos valores pela ASPPIBRA não implica cessão, transferência ou aquisição do respectivo crédito, permanecendo o titular econômico do valor aquele expressamente indicado neste instrumento.
      </Clause>

      <Clause>
        1.5.17. A mesma conta bancária institucional poderá ser utilizada para outros contratos da ASPPIBRA, desde que a associação mantenha <strong>controle individualizado por contrato</strong>, permitindo identificar cada entrada, saída, retenção, despesa e repasse relacionado ao presente instrumento.
      </Clause>

      <Clause>
        1.5.18. A ASPPIBRA não poderá utilizar os valores recebidos por conta e ordem deste contrato para finalidade estranha à respectiva relação contratual, ressalvados os descontos e pagamentos expressamente autorizados neste instrumento ou impostos por lei.
      </Clause>

      <Clause>
        <strong>1.5.19. Da eficácia do pagamento.</strong> O pagamento efetuado pelo CESSIONÁRIO na conta expressamente indicada neste instrumento, ou por meio de boleto, Pix ou outro meio regularmente disponibilizado nos termos desta cláusula, será considerado realizado ao respectivo titular do crédito mediante a efetiva confirmação da liquidação, ressalvadas hipóteses de estorno, fraude, devolução, bloqueio, erro operacional ou determinação de autoridade competente.
      </Clause>

      <Clause>
        1.5.20. O simples agendamento, emissão de boleto ou comprovante de solicitação de transferência, sem efetiva liquidação ou disponibilização do valor, não constitui quitação.
      </Clause>

      <Clause>
        <strong>1.5.21. Da conciliação e controle financeiro.</strong> Compete à ASPPIBRA identificar e conciliar cada pagamento recebido com o respectivo contrato, parcela ou obrigação, mantendo registro mínimo da data, pagador, valor, finalidade, retenções e destino do recurso.
      </Clause>

      <Clause>
        1.5.22. Havendo pagamento divergente, duplicidade, ausência de identificação suficiente, estorno, bloqueio, suspeita objetiva de fraude ou outra inconsistência relevante, a ASPPIBRA deverá registrar a ocorrência, comunicar os interessados e adotar as providências razoavelmente necessárias à regularização.
      </Clause>

      <Clause>
        <strong>1.5.23. Da retenção e destinação dos valores.</strong> A ASPPIBRA somente poderá reter, compensar ou efetuar pagamentos com os valores arrecadados quando houver:
        <br />
        a) remuneração própria expressamente prevista neste instrumento;
        <br />
        b) despesa, custo ou encargo expressamente atribuído neste instrumento;
        <br />
        c) pagamento devido a profissional ou fornecedor previamente autorizado;
        <br />
        d) retenção tributária ou outro desconto imposto por lei;
        <br />
        e) outra hipótese expressamente autorizada pelas partes neste instrumento ou em documento posterior válido.
      </Clause>

      <Clause>
        1.5.24. É vedada a retenção arbitrária ou a utilização dos valores recebidos para finalidade diversa daquela autorizada neste instrumento.
      </Clause>

      <Clause>
        <strong>1.5.25. Da remuneração da ASPPIBRA.</strong> Pela administração contratual, coordenação operacional, gestão documental, acompanhamento das providências e administração do fluxo de pagamentos previstas nesta cláusula, será devida à ASPPIBRA a remuneração de R$ <DataTag text="VALOR DA REMUNERAÇÃO DA ASPPIBRA" field="asppibraRemuneracaoValor" /> (<DataTag text="VALOR POR EXTENSO" field="asppibraRemuneracaoValorExtenso" />), ou equivalente a <DataTag text="PERCENTUAL (EX: 10%)" field="asppibraRemuneracaoPercentual" />% sobre <DataTag text="BASE DE CÁLCULO (EX: PREÇO TOTAL DA CESSÃO)" field="asppibraRemuneracaoBaseCalculo" />, paga por <DataTag text="RESPONSÁVEL PELO PAGAMENTO (EX: CEDENTE)" field="asppibraRemuneracaoResponsavel" />, na forma e nos prazos previstos neste instrumento.
      </Clause>

      <Clause>
        1.5.26. A remuneração da ASPPIBRA constitui contraprestação pelos serviços contratados, não se confundindo com o preço da cessão, contribuições associativas, despesas de terceiros ou honorários de profissionais contratados para atos técnicos ou jurídicos.
      </Clause>

      <Clause>
        1.5.27. Quando a remuneração estiver autorizada a ser descontada dos valores arrecadados, a retenção somente ocorrerá quando a respectiva parcela estiver vencida e exigível, devendo constar da prestação de contas.
      </Clause>

      <Clause>
        1.5.28. A remuneração da ASPPIBRA não fica condicionada exclusivamente ao deferimento, aprovação, registro, reconhecimento de direito, conclusão de REURB, usucapião ou outro resultado cuja decisão dependa de autoridade pública, serventia, Poder Judiciário, profissional independente ou terceiro, ressalvadas as condições específicas de remuneração e restituição expressamente previstas neste instrumento.
      </Clause>

      <Clause>
        <strong>1.5.29. Dos repasses.</strong> Confirmado o recebimento e deduzidos somente os valores legitimamente autorizados neste instrumento, a ASPPIBRA deverá repassar ao titular do respectivo crédito o saldo que lhe for devido, para a conta indicada no contrato, no prazo máximo de <DataTag text="PRAZO EM DIAS ÚTEIS (EX: 5 DIAS ÚTEIS)" field="prazoRepasseCedenteDias" /> dias úteis.
      </Clause>

      {/* TABELA DE DADOS PARA REPASSE AO CEDENTE */}
      <Box sx={{ my: 1.5, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, borderColor: '#000', maxWidth: 650, mx: 'auto' }}>
          <Table size="small">
            <TableBody>
              <TableRow sx={{ bgcolor: '#F4F6F8' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '9.5pt', borderBottom: '1.5px solid #000', textAlign: 'center' }}>
                  DADOS PARA REPASSE AO CEDENTE
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '35%', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Instituição / Banco</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>
                  <DataTag text="NOME DO BANCO DO CEDENTE" field="cedenteBanco" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Agência e Conta</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>
                  Agência: <DataTag text="NÚMERO DA AGÊNCIA" field="cedenteAgencia" /> | Conta: <DataTag text="NÚMERO DA CONTA" field="cedenteConta" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Titular e CPF/CNPJ</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>
                  <DataTag text="NOME DO CEDENTE" field="cedenteNomeRepasse" /> (CPF/CNPJ: <DataTag text="NÚMERO DO CPF/CNPJ DO CEDENTE" field="cedenteCpfRepasse" />)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '9pt' }}>Chave Pix</TableCell>
                <TableCell sx={{ fontSize: '9pt' }}>
                  <DataTag text="CHAVE PIX DO CEDENTE" field="cedenteChavePix" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Clause>
        1.5.30. Havendo impedimento para o repasse integral, a ASPPIBRA deverá comunicar a parte interessada, indicar a causa do impedimento e, sempre que juridicamente e operacionalmente possível, repassar a parcela incontroversa, restringindo eventual retenção à parcela efetivamente impedida ou controvertida.
      </Clause>

      <Clause>
        <strong>1.5.31. Da prestação de contas.</strong> A ASPPIBRA deverá manter prestação de contas individualizada deste contrato, permitindo identificar, de forma objetiva:
        <br />
        a) valores recebidos;
        <br />
        b) respectivas datas e referências;
        <br />
        c) retenções realizadas;
        <br />
        d) despesas e pagamentos efetuados;
        <br />
        e) remuneração da ASPPIBRA;
        <br />
        f) valores líquidos repassados;
        <br />
        g) respectivas datas e comprovantes.
      </Clause>

      <Clause>
        1.5.32. A prestação de contas poderá ser apresentada por meio físico ou eletrônico, inclusive mediante relatório financeiro, extrato, comprovante bancário ou sistema de gestão que permita identificar suficientemente as movimentações relacionadas a este contrato, observadas as regras de proteção de dados e sigilo.
      </Clause>

      <Clause>
        <strong>1.5.33. Da responsabilidade e ausência de garantia de resultado.</strong> A ASPPIBRA responderá, na forma da legislação civil aplicável, pelos danos diretamente decorrentes de dolo ou culpa comprovada no exercício das atribuições que lhe forem expressamente cometidas, inclusive em caso de retenção indevida, repasse indevido, desvio de finalidade ou falha injustificada na prestação de contas.
      </Clause>

      <Clause>
        1.5.34. A ASPPIBRA não garante o deferimento, aprovação, registro, reconhecimento de propriedade, conclusão de REURB ou usucapião, nem responde por decisões ou atos de órgãos públicos, Poder Judiciário, serventias, profissionais independentes, terceiros ou pelas informações e omissões imputáveis às demais partes, ressalvada a responsabilidade que lhe seja legalmente atribuível por seus próprios atos.
      </Clause>

      <Clause>
        <strong>1.5.35. Da integridade, conflitos e proteção de dados.</strong> A ASPPIBRA observará as regras de integridade, transparência e gestão de conflitos de interesses previstas em seu Estatuto Social e nas normas internas aplicáveis, devendo comunicar e tratar adequadamente situações de conflito real ou potencial.
      </Clause>

      <Clause>
        1.5.36. O tratamento de dados pessoais realizado pela ASPPIBRA limitar-se-á às finalidades necessárias à execução do contrato, cobrança, recebimento, repasse, prestação de contas, contratação de profissionais, cumprimento de obrigações legais e demais finalidades legítimas relacionadas ao objeto, observada a Lei nº 13.709/2018.
      </Clause>

      <Clause>
        <strong>1.5.37. Da suspensão excepcional.</strong> A ASPPIBRA poderá suspender temporariamente determinada cobrança, pagamento ou repasse quando houver documentação insuficiente, inconsistência relevante, suspeita objetiva de fraude, impedimento bancário, determinação de autoridade competente ou outro risco jurídico ou operacional devidamente justificado, comunicando a parte interessada e limitando a suspensão ao necessário para sua regularização.
      </Clause>

      <Clause>
        <strong>1.5.38. Da substituição e encerramento.</strong> Na hipótese de substituição ou encerramento da atuação da ASPPIBRA, esta deverá apresentar prestação de contas final, interromper novas cobranças, salvo autorização para liquidação de obrigações remanescentes, repassar os valores incontroversos e entregar ou disponibilizar a documentação e informações necessárias à continuidade ou encerramento organizado do contrato.
      </Clause>

      <Clause>
        1.5.39. A substituição ou encerramento da atuação da ASPPIBRA não afasta o dever de prestar contas dos valores por ela recebidos durante o período de sua administração.
      </Clause>

      <Clause>
        <strong>1.5.40. Da alteração dos dados bancários.</strong> Qualquer alteração da conta, agência, chave Pix ou outro dado utilizado para recebimento ou repasse deverá ser formalmente comunicada e, quando modificar elemento essencial do mecanismo financeiro deste instrumento, formalizada por documento escrito ou aditivo, não produzindo efeitos mediante simples comunicação informal.
      </Clause>

      <Clause>
        <strong>1.5.41. Da autenticação institucional.</strong> Eventual selo, código, número ou identificação denominada “AUTENTICAÇÃO DIGITAL” pela ASPPIBRA constitui mecanismo interno de identificação, padronização ou controle documental e <strong>não equivale a autenticação notarial, reconhecimento de firma, registro público, certificação do Registro de Imóveis ou chancela de órgão público</strong>, nem constitui garantia de validade ou resultado registral.
      </Clause>

      <Clause>
        <strong>1.5.42. Da governança e poderes específicos.</strong> A atuação da ASPPIBRA observará as competências de seus órgãos estatutários e, quando aplicável, os procedimentos internos de aprovação e fiscalização previstos em seu Estatuto Social, inclusive aqueles relativos à contratação remunerada de serviços.
      </Clause>

      <Clause>
        1.5.43. Esta cláusula não substitui procuração, autorização, certificado, assinatura ou outro documento específico eventualmente exigido por instituição financeira, órgão público, serventia extrajudicial, profissional habilitado ou legislação aplicável.
      </Clause>

      <Clause>
        1.5.44. As partes declaram estar cientes e de acordo com a estrutura estabelecida nesta cláusula, segundo a qual a ASPPIBRA exercerá função ativa de administração contratual e do fluxo operacional de pagamentos, podendo receber valores em conta de sua titularidade, vinculada ao seu CNPJ, <strong>por conta e ordem do respectivo titular do crédito</strong>, realizando a conciliação, as retenções expressamente autorizadas, os pagamentos previstos e o posterior repasse do saldo devido, com correspondente prestação de contas.
      </Clause>

      <Clause>
        1.5.45. A participação da ASPPIBRA no recebimento e administração dos pagamentos não altera a natureza da obrigação principal entre CEDENTE e CESSIONÁRIO, não transfere à associação a titularidade do imóvel, da posse ou dos créditos pertencentes às partes e não a torna responsável pelas obrigações materiais atribuídas diretamente a CEDENTE ou CESSIONÁRIO.
      </Clause>

      {/* CAPÍTULO II */}
      <SectionTitle>CAPÍTULO II – DAS DECLARAÇÕES PRELIMINARES</SectionTitle>

      <Clause>
        2.1. O CEDENTE declara que exerce sobre o IMÓVEL descrito no Capítulo III posse pública, contínua e pacífica, segundo seu conhecimento efetivo e de acordo com os elementos documentais e possessórios de que dispõe na data da assinatura deste instrumento.
      </Clause>

      <Clause>
        2.1.1. O CEDENTE declara, ainda, que, até a data da assinatura, não tem conhecimento de oposição formal, reivindicação ou disputa de terceiro que lhe tenha sido comunicada e que impeça ou restrinja diretamente a posse ora cedida, ressalvadas as situações, pendências, diligências e hipóteses expressamente informadas neste instrumento e em seus anexos.
      </Clause>

      <Clause>
        2.1.2. A declaração prevista nesta Cláusula é prestada exclusivamente com base no conhecimento efetivo do CEDENTE, não constituindo garantia de inexistência de direitos, pretensões, reivindicações, oposições ou disputas de terceiros que não lhe tenham sido comunicados ou que somente venham a ser identificados posteriormente, inclusive durante o procedimento de regularização fundiária ou de usucapião.
      </Clause>

      <Clause>
        2.1.3. A identificação posterior de terceiro que alegue direito sobre o imóvel não caracteriza, por si só, falsidade, inadimplemento contratual ou culpa do CEDENTE, salvo se demonstrado que o CEDENTE tinha conhecimento anterior e relevante do fato e, deliberadamente, deixou de informá-lo ao(à)(s) CESSIONÁRIO(A)(S), aplicando-se, conforme o caso, o disposto nas Cláusulas 4.8, 10.3 e 11.1.
      </Clause>

      <Clause>
        2.2. O IMÓVEL descrito no Capítulo III possui matrícula individualizada perante o Cartório de Registro de Imóveis da Comarca de <DataTag text="MUNICÍPIO/UF" field="comarcaCartorioImoveis" />, sob o nº <DataTag text="NÚMERO DA MATRÍCULA" field="numeroMatriculaImovel" /> (<DataTag text="IDENTIFICAÇÃO DO LOTE/IMÓVEL" field="identificacaoLoteImovel" />), conforme certidão atualizada a ser juntada ao Anexo II, e encontra-se cadastrado perante a Prefeitura Municipal de <DataTag text="MUNICÍPIO/UF" field="municipioPrefeitura" />, Cadastro Geral Imobiliário, sob a Inscrição Imobiliária nº <DataTag text="NÚMERO DA INSCRIÇÃO MUNICIPAL/IPTU" field="inscricaoMunicipalIptu" />, conforme Certidão Fiscal Venal nº <DataTag text="NÚMERO DA CERTIDÃO FISCAL VENAIS" field="numeroCertidaoFiscalVenal" />, em nome do contribuinte cadastral <DataTag text="NOME DO TITULAR CADASTRAL" field="nomeTitularCadastral" /> (CPF/CNPJ nº <DataTag text="NÚMERO DO CPF/CNPJ DO TITULAR" field="cpfCnpjTitularCadastral" />). O CEDENTE não é titular do domínio registral do IMÓVEL, transmitindo exclusivamente os direitos possessórios sobre ele exercidos, cuja regularização ou eventual aquisição de propriedade observará as vias, condições e documentação disciplinadas no Capítulo IV, não constituindo este instrumento transmissão de propriedade registral.
      </Clause>

      <Clause>
        2.3. O CEDENTE declara, sob as penas da lei, que não cedeu, prometeu ceder, vendeu, hipotecou ou de qualquer forma transferiu ou onerou a posse do imóvel, total ou parcialmente, a qualquer outra pessoa além do(a)(s) CESSIONÁRIO(A)(S) ora contratante(s), respondendo civil e criminalmente pela veracidade desta declaração, sem prejuízo do disposto no Capítulo XI.
      </Clause>

      <Clause>
        2.4. O CEDENTE declara, ainda, conforme seu efetivo conhecimento, que o imóvel: (a) não se localiza em área de preservação permanente, unidade de conservação, área de risco geológico (encosta, alagamento) ou terreno de domínio público; e (b) está sujeito às seguintes restrições urbanísticas (zoneamento, área mínima de lote, recuos): <DataTag text="RESTRIÇÕES URBANÍSTICAS" field="restricoesUrbanisticas" />. Caso o CEDENTE tenha conhecimento de qualquer restrição, risco ou irregularidade urbanística/ambiental não mencionada nesta cláusula, deverá informá-la expressamente antes da assinatura, sob pena de responder pelos prejuízos decorrentes da omissão, nos termos do Capítulo XI.
      </Clause>

      <Clause>
        2.5. Natureza jurídica do contrato: as partes declaram, para todos os fins de direito, que o presente instrumento tem por objeto exclusivo a cessão onerosa de direitos possessórios sobre o imóvel descrito no Capítulo III, não configurando compra e venda de imóvel nem qualquer outro negócio jurídico de transmissão de propriedade sujeito à forma pública exigida pelo art. 108 do Código Civil. As referências a &ldquo;preço&rdquo;, &ldquo;pagamento&rdquo; e &ldquo;quitação&rdquo; ao longo deste instrumento dizem respeito exclusivamente à contraprestação pecuniária pela cessão dos direitos possessórios, e não à transferência do domínio registral do imóvel. A eventual aquisição da propriedade pelo(a)(s) CESSIONÁRIO(A)(S), quando cabível, dar-se-á pelas vias de regularização fundiária ou reconhecimento de usucapião disciplinadas no Capítulo IV, modos que prescindem de outorga de escritura pública de compra e venda pelo CEDENTE.
      </Clause>

      <Clause>
        2.6. Do loteamento e da regularidade urbanística: o imóvel integra o loteamento denominado <DataTag text="NOME DO LOTEAMENTO" field="nomeLoteamento" />, devidamente aprovado pela Prefeitura Municipal de <DataTag text="MUNICÍPIO" field="municipioLoteamento" /> sob o Processo Administrativo nº <DataTag text="Nº PROCESSO ADM" field="processoAdmLoteamento" /> e registrado junto ao <DataTag text="CARTÓRIO DE REGISTRO" field="cartorioLoteamento" /> sob o Registro nº <DataTag text="Nº REGISTRO DO LOTEAMENTO" field="registroLoteamento" />, em conformidade com a Lei nº 6.766/1979. As partes reconhecem e declaram que a responsabilidade legal, administrativa e penal atribuída ao loteador (arts. 50 a 52 da Lei nº 6.766/1979) não recai sobre o CEDENTE, uma vez que este não é o loteador original nem seu sucessor na respectiva posição jurídica perante o empreendimento, figurando exclusivamente como possuidor de lote individualizado, já dotado de matrícula própria, integrante de loteamento regularmente constituído e aprovado, cuja posse foi por ele adquirida na forma da Cláusula 4.1.
      </Clause>

      <Clause>
        2.7. Da eventual dívida ativa: sem prejuízo da situação cadastral e registral descrita na Cláusula 2.2, os débitos tributários municipais incidentes sobre o <DataTag text="IDENTIFICAÇÃO DO LOTE/TERRENO" field="identificacaoLoteTerreno" />, em nome do contribuinte cadastral <DataTag text="NOME DO TITULAR CADASTRAL" field="nomeTitularCadastral" />, são detalhados na Cláusula 2.7.1 e no quadro-resumo a seguir, integrando o acervo informativo e documental do imóvel para fins das providências previstas no Capítulo IV.
      </Clause>

      <Clause>
        2.7.1. O CEDENTE declara ter conhecimento de que o lote possui débitos tributários municipais (IPTU) vencidos e em aberto, conforme apurado junto ao portal de emissão de guias da Prefeitura Municipal de <DataTag text="MUNICÍPIO/UF" field="municipioPrefeitura" />, com data de referência de <DataTag text="DATA DE REFERÊNCIA" field="dataReferenciaIptu" />, relativos aos exercícios de <DataTag text="EXERCÍCIOS/ANOS VENCIDOS" field="exerciciosAnosVencidos" />, no valor total atualizado de aproximadamente R$ <DataTag text="VALOR TOTAL" field="valorTotalDivida" /> (<DataTag text="VALOR POR EXTENSO" field="valorTotalDividaExtenso" />), além da parcela do IPTU/<DataTag text="ANO VIGENTE" field="anoVigenteIptu" /> no valor de R$ <DataTag text="VALOR DA PARCELA" field="valorParcelaIptu" /> (parcelada em <DataTag text="NÚMERO DE PARCELAS" field="numeroParcelasIptu" /> vezes) e saldo a vencer de R$ <DataTag text="VALOR DO SALDO A VENCER" field="saldoVencerIptu" />. Não foi identificada, com base na documentação ora disponível, a efetiva inscrição desses débitos em dívida ativa, nem a existência de execução fiscal ajuizada relativa a tais débitos, cabendo a obtenção de certidão de dívida ativa e de certidão específica de distribuição de ações fiscais em nome do titular registral/cadastral antes da assinatura deste instrumento. Por estarem os valores acima sujeitos à atualização monetária contínua, o CEDENTE obriga-se a reconfirmá-los junto à Prefeitura Municipal de <DataTag text="MUNICÍPIO/UF" field="municipioPrefeitura" /> imediatamente antes da assinatura, comprometendo-se a informar ao(à)(s) CESSIONÁRIO(A)(S) qualquer alteração relevante, inclusive eventual ajuizamento de execução fiscal de que venha a ter conhecimento, sob pena de responder pelos prejuízos decorrentes da omissão, nos termos do Capítulo <DataTag text="NÚMERO DO CAPÍTULO" field="capituloPenalidadesOmissao" />.
      </Clause>

      {/* TABELA SITUAÇÃO FISCAL */}
      <Box sx={{ my: 2, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, borderColor: '#000' }}>
          <Table size="small">
            <TableBody>
              <TableRow sx={{ bgcolor: '#F4F6F8' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '10.5pt', borderBottom: '1.5px solid #000', textAlign: 'center' }}>
                  QUADRO-RESUMO – SITUAÇÃO FISCAL E DÉBITOS DE IPTU DO IMÓVEL
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '38%', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Contribuinte Cadastral / Titular</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>
                  <DataTag text="NOME DO TITULAR CADASTRAL" field="nomeTitularCadastral" /> (CPF/CNPJ: <DataTag text="NÚMERO DO CPF/CNPJ DO TITULAR" field="cpfCnpjTitularCadastral" />)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Exercícios Vencidos</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>
                  <DataTag text="EXERCÍCIOS/ANOS VENCIDOS" field="exerciciosAnosVencidos" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Valor Estimado da Dívida Vencida</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>
                  R$ <DataTag text="VALOR TOTAL" field="valorTotalDivida" /> (Data ref.: <DataTag text="DATA DE REFERÊNCIA" field="dataReferenciaIptu" />)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>IPTU do Ano Vigente (<DataTag text="ANO VIGENTE" field="anoVigenteIptu" />)</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>
                  R$ <DataTag text="VALOR DA PARCELA" field="valorParcelaIptu" /> (<DataTag text="NÚMERO DE PARCELAS" field="numeroParcelasIptu" />x) | Saldo a vencer: R$ <DataTag text="VALOR DO SALDO A VENCER" field="saldoVencerIptu" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '9pt' }}>Responsabilidade de Quitação</TableCell>
                <TableCell sx={{ fontSize: '9pt' }}>
                  Exclusiva do CEDENTE (mediante abatimento no preço, conforme Cláusulas 5.6 e 5.7)
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Clause>
        2.7.2. Sem prejuízo do disposto nas Cláusulas 5.6 e 5.7 quanto à quitação ou ao parcelamento da dívida ativa incidente sobre o imóvel com recursos do preço, e havendo execução fiscal em curso sobre o imóvel, as partes desde já convencionam que: (a) a quitação de débitos tributários incidentes sobre o lote observará a divisão de responsabilidades prevista no Capítulo VII; (b) o(a)(s) CESSIONÁRIO(A)(S), uma vez imitido(a)(s) na posse, poderá(ão) adotar as medidas processuais cabíveis para proteção da posse, inclusive, quando presentes os pressupostos legais, a oposição de embargos de terceiro no respectivo processo, para resguardo da posse ora cedida, cabendo ao CEDENTE prestar toda a colaboração documental necessária a essa defesa; e (c) caso o imóvel venha a ser efetivamente arrematado em hasta pública em decorrência de execução fiscal ajuizada contra o titular registral antes da consolidação da usucapião ou da regularização fundiária em favor do(a)(s) CESSIONÁRIO(A)(S), aplicar-se-á o disposto na Cláusula 10.3.4 (distrato por evicção), sem prejuízo do direito de regresso do CEDENTE contra quem de direito.
      </Clause>

      <Clause>
        2.8. Da titularidade registral em nome de (<DataTag text="NOME DO TITULAR CADASTRAL" field="nomeTitularCadastral" />): sendo o titular registral e/ou cadastral do imóvel <DataTag text="IDENTIFICAÇÃO DO LOTE/TERRENO" field="identificacaoLoteTerreno" /> pessoa (<DataTag text="NOME DO TITULAR CADASTRAL" field="nomeTitularCadastral" />), cujo espólio ainda não tenha sido objeto de partilha ou cujo inventário se encontre em curso, o CEDENTE obriga-se a diligenciar e informar ao(à)(s) CESSIONÁRIO(A)(S), antes da assinatura deste instrumento, sempre que deles tiver conhecimento: (a) se há inventário aberto (judicial ou extrajudicial) relativo ao espólio, com indicação do respectivo número e cartório/vara; (b) a identificação do(a) inventariante e dos herdeiros conhecidos; e (c) se há qualquer manifestação de oposição, reivindicação ou disputa desses herdeiros quanto à posse exercida sobre o imóvel.
      </Clause>

      <Clause>
        2.8.1. A existência de inventário aberto e de herdeiros identificados e cientes da posse exercida pelo CEDENTE, sem oposição destes, não impede, por si só, a adoção das providências de regularização fundiária ou de usucapião referidas no Capítulo IV, mas exige diligência documental redobrada, incluindo a notificação pessoal dos herdeiros conhecidos e do(a) inventariante no âmbito dos procedimentos cabíveis, na forma da legislação aplicável, cujo custeio técnico e preparatório será suportado pelo CEDENTE, nos termos das Cláusulas 5.4 e 7.3.
      </Clause>

      <Clause>
        Havendo oposição de qualquer herdeiro ou inventariante à posse exercida pelo CEDENTE, o CEDENTE deverá comunicar imediatamente o fato ao(à)(s) CESSIONÁRIO(A)(S), fornecer toda a documentação disponível relacionada à oposição e adotar, às suas expensas, as providências juridicamente cabíveis para esclarecimento e regular prosseguimento da situação possessória. Enquanto perdurar a oposição e não estiver definida a viabilidade jurídica de prosseguimento da regularização ou da usucapião, não se presumirá a conclusão do procedimento nem a existência de direito à regularização registral. Caso a oposição resulte em indeferimento, extinção ou arquivamento definitivo do procedimento de regularização fundiária ou de usucapião, sem possibilidade jurídica de prosseguimento pela via adotada, aplicar-se-á a Cláusula 4.8, sem prejuízo das demais responsabilidades contratuais do CEDENTE, quando a causa for a ele imputável.
      </Clause>

      {/* CAPÍTULO III */}
      <SectionTitle>CAPÍTULO III – DO OBJETO</SectionTitle>

      <Clause>
        3.1. O imóvel objeto da presente cessão de posse é o seguinte (doravante designado simplesmente <strong>IMÓVEL</strong> ou <strong>LOTE</strong>):
      </Clause>

      {/* TABELA DO IMÓVEL */}
      <Box sx={{ my: 2, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, borderColor: '#000' }}>
          <Table size="small">
            <TableBody>
              <TableRow sx={{ bgcolor: '#F4F6F8' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '11pt', borderBottom: '1.5px solid #000' }}>
                  <DataTag text="IDENTIFICAÇÃO DO LOTE/IMÓVEL (EX: LOTE 00 - IMÓVEL MUNICIPAL Nº 0000)" field="identificacaoLoteImovel" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '35%', borderBottom: '1px solid #E0E0E0' }}>Lote</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0' }}>
                  <DataTag text="NÚMERO DO LOTE" field="numeroLote" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0' }}>Quadra</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0' }}>
                  <DataTag text="QUADRA" field="quadraLote" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0' }}>Logradouro / Loteamento</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0' }}>
                  <DataTag text="LOGRADOURO COMPLETO, BAIRRO E CEP" field="logradouroImovel" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0' }}>Município/UF</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0' }}>
                  <DataTag text="MUNICÍPIO/UF" field="municipioUfImovel" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0' }}>Área total</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0' }}>
                  <DataTag text="ÁREA TOTAL (M² E EXTENSO)" field="areaTotalImovel" /> – conforme Certidão Fiscal Venal nº <DataTag text="Nº DA CERTIDÃO" field="numeroCertidaoFiscalVenal" />, Inscrição Cadastral <DataTag text="Nº DA INSCRIÇÃO" field="inscricaoCadastral" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0' }}>Matrícula / Registro</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0' }}>
                  <DataTag text="Nº DA MATRÍCULA E CARTÓRIO COMPETENTE" field="matriculaRegistroImovel" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Confrontações e Limites</TableCell>
                <TableCell>
                  <DataTag text="CONFRONTAÇÕES E LIMITES DO LOTE" field="confrontacoesImovel" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Clause>
        3.2. O CEDENTE cede e transfere ao(à)(s) CESSIONÁRIO(A)(S) a totalidade da posse, direitos e ações que exerce sobre o imóvel individualmente descrito na Cláusula 3.1, objeto do preço pactuado na forma do Capítulo V, para que dele use(m), goze(m) e disponha(m) livremente, obrigando-se o CEDENTE, por si, seus herdeiros e sucessores, a manter esta cessão firme, boa e valiosa a qualquer tempo, respondendo pela evicção nos termos dos arts. 447 a 457 do Código Civil e do Capítulo XI deste instrumento, observados os limites e a alocação de risco possessório estabelecidos na Cláusula 11.1.
      </Clause>

      <Clause>
        3.3. O(A)(S) CESSIONÁRIO(A)(S) declara(m) ter vistoriado o imóvel previamente à assinatura deste instrumento e ter ciência do seu estado físico e de conservação, bem como das informações, documentos, ressalvas, pendências, débitos e situações descritos nas Cláusulas 2.2, 2.7, 2.7.1, 2.7.2, 2.8 e 2.8.1 (doravante “Riscos Divulgados”), efetivamente apresentados pelo CEDENTE até a presente data.
      </Clause>

      <Clause>
        3.3.1. Quanto aos Riscos Divulgados, a ciência e a aceitação expressa do(a)(s) CESSIONÁRIO(A)(S) excluem a responsabilidade do CEDENTE pela mera existência, materialização ou desdobramento desses riscos especificamente descritos, incluindo eventual atraso, dificuldade ou custo adicional decorrente de sua natureza já conhecida na data da assinatura, ressalvado o disposto na Cláusula 3.3.3.
      </Clause>

      <Clause>
        3.3.2. Não se incluem entre os Riscos Divulgados, permanecendo sob responsabilidade plena do CEDENTE nos termos deste instrumento: (a) fatos, ônus, gravames, oposições, débitos ou pendências não informados nas cláusulas referidas na Cláusula 3.3, ainda que existentes na data da assinatura; (b) fatos supervenientes cuja origem seja anterior à assinatura e dos quais o CEDENTE tinha efetivo conhecimento e deixou de informar; e (c) qualquer inexatidão relevante nas informações prestadas sobre os Riscos Divulgados que decorra de declaração falsa ou omissão dolosa do CEDENTE.
      </Clause>

      <Clause>
        3.3.3. A exclusão de responsabilidade prevista na Cláusula 3.3.1 não abrange o descumprimento, pelo CEDENTE, das obrigações específicas por ele assumidas neste instrumento em razão dos próprios Riscos Divulgados (por exemplo, as obrigações de custeio e diligência previstas nas Cláusulas 2.7.1, 2.7.2, 2.8.1, 4.3, 5.6 e 5.7), as quais permanecem plenamente exigíveis.
      </Clause>

      <Clause>
        3.4. O CEDENTE declara que os direitos possessórios ora cedidos não foram objeto de cessão anterior, promessa de cessão, hipoteca ou qualquer outra forma de transferência ou oneração a terceiros, e não estão sujeitos a penhora, constrição judicial ou direito de terceiro que impeça ou restrinja sua transferência ao(à)(s) CESSIONÁRIO(A)(S), sob pena de responsabilização do CEDENTE nos termos do Capítulo XI. Fica expressamente ressalvado que os débitos tributários municipais (IPTU) incidentes sobre o imóvel, anteriores à imissão na posse e já declarados na Cláusula 2.7.1, não configuram violação desta declaração, permanecendo de responsabilidade exclusiva do CEDENTE e sujeitos ao tratamento previsto nas Cláusulas 5.6, 5.7 e no Capítulo VII.
      </Clause>

      <Clause>
        3.5. Em caso de fracionamento do imóvel entre múltiplos cessionários, cada fração será identificada em tabela própria (Parte A, Parte B etc.), com medidas e confrontações individualizadas, e cada cessionário responderá exclusivamente pela parte que lhe for atribuída, na forma da Cláusula 1.4.
      </Clause>

      {/* CAPÍTULO IV */}
      <SectionTitle>CAPÍTULO IV – DA ORIGEM DA POSSE, CADEIA POSSESSÓRIA E REGULARIZAÇÃO FUNDIÁRIA</SectionTitle>

      <Clause>
        4.1. O CEDENTE declara exercer sobre o IMÓVEL posse pública, contínua e pacífica desde <DataTag text="DATA DE INÍCIO DA POSSE DECLARADA" field="dataInicioPosseDeclarada" />, conforme declaração e documentação constantes do <strong>Anexo III – Documentação da Posse</strong>, que integra este instrumento.
      </Clause>

      <Clause>
        4.1.1. A origem, o tempo, a natureza e a continuidade da posse, inclusive eventual soma de períodos de possuidores anteriores, serão demonstrados pela documentação indicada no Anexo III, com a identificação dos respectivos possuidores, períodos, forma de transmissão ou sucessão e elementos de prova disponíveis.
      </Clause>

      <Clause>
        4.2. O presente instrumento formaliza exclusivamente a cessão dos direitos possessórios descritos no Capítulo III, não substituindo os documentos, atos notariais, elementos técnicos ou demais provas exigidos pela legislação para eventual usucapião ou regularização fundiária.
      </Clause>

      <Clause>
        4.2.1. Os dados relativos à posse utilizados neste contrato permanecerão vinculados, no sistema eletrônico, às respectivas fontes documentais, sempre que aplicável, com identificação do documento, data e versão. A referência a documento externo não implica certificação de sua veracidade ou suficiência, cuja análise caberá à autoridade, serventia ou profissional competente.
      </Clause>

      <Clause>
        4.3. A regularização da situação possessória e a eventual aquisição da propriedade pelo(a)(s) CESSIONÁRIO(A)(S) serão buscadas pela via juridicamente cabível ao caso concreto, inclusive usucapião, REURB ou outra modalidade legalmente admitida, conforme a situação do IMÓVEL e a documentação disponível.
      </Clause>

      <Clause>
        4.3.1. Quando houver análise de viabilidade da regularização, a via inicialmente indicada constará do <strong>Anexo IV – Enquadramento e Viabilidade da Regularização</strong> e poderá ser alterada quando a análise jurídica, técnica, notarial, administrativa ou registral indicar modalidade ou procedimento diverso, sem que isso constitua, por si só, inadimplemento contratual ou garantia de resultado.
      </Clause>

      <Clause>
        4.4. Sendo juridicamente cabível a usucapião extrajudicial, as partes obrigam-se a cooperar para sua instrução e processamento, fornecendo documentos, informações, declarações, comparecimentos e anuências de sua responsabilidade, observada a legislação e a regulamentação aplicáveis. A eventual ata notarial será lavrada pelo tabelião competente e não implicará, por si só, reconhecimento da propriedade ou garantia de deferimento.
      </Clause>

      <Clause>
        4.5. Quando cabível a REURB, as partes cooperarão com o respectivo procedimento administrativo e com os profissionais habilitados, observadas as competências legais do Município, do Registro de Imóveis, do tabelião, do advogado e dos profissionais técnicos. A modalidade de REURB será aquela definida ou reconhecida no procedimento competente.
      </Clause>

      <Clause>
        4.5.1. A ASPPIBRA poderá prestar apoio administrativo e operacional na organização documental, acompanhamento de protocolos e comunicação entre os envolvidos, sem exercer atribuições privativas das autoridades, serventias ou profissionais legalmente competentes.
      </Clause>

      <Clause>
        4.6. As providências de análise, preparação e regularização poderão ser iniciadas antes da quitação integral do preço, quando juridicamente e operacionalmente possível. O CEDENTE e o(a)(s) CESSIONÁRIO(A)(S) deverão fornecer, nos prazos estabelecidos neste instrumento, os documentos, informações e atos que lhes competirem, respondendo cada parte pelas consequências de seu próprio atraso ou descumprimento.
      </Clause>

      <Clause>
        4.7. A existência ou adoção de procedimento de usucapião, REURB ou outra forma de regularização não constitui garantia de resultado pelas partes ou pela ASPPIBRA, sem prejuízo das obrigações de cooperação expressamente assumidas neste instrumento.
      </Clause>

      <Clause>
        4.8. O indeferimento, extinção ou arquivamento definitivo do procedimento de regularização será tratado conforme a causa e a responsabilidade pelo evento, aplicando-se, conforme o caso, as disposições deste instrumento sobre impossibilidade de cumprimento, inadimplemento, perda da posse e resolução. Se o impedimento decorrer exclusivamente de ato ou decisão de órgão público, serventia, profissional habilitado ou terceiro não vinculado às partes, não haverá presunção de inadimplemento, devendo ser avaliada a existência de outra via juridicamente cabível.
      </Clause>

      <Clause>
        4.9. Enquanto não concluída a regularização registral, este instrumento continuará disciplinando a relação possessória, sem se confundir a cessão dos direitos possessórios com transmissão do domínio. Concluída a regularização e praticado o ato registral correspondente, cessarão os efeitos deste instrumento quanto à sua finalidade de disciplinar a situação possessória objeto da presente cessão, permanecendo vigentes as obrigações que, por sua natureza ou previsão contratual, devam subsistir.
      </Clause>

      {/* CAPÍTULO V */}
      <SectionTitle>CAPÍTULO V – DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO</SectionTitle>

      <Clause>
        5.1. O preço total ajustado para a cessão integral dos direitos possessórios que o CEDENTE exerce sobre o imóvel objeto deste instrumento é de R$ <DataTag text="180.000,00" field="valorTotalPreco" /> (<DataTag text="cento e oitenta mil reais" field="valorTotalPrecoExtenso" />), a ser pago na forma e nos prazos estabelecidos neste Capítulo e no Capítulo VI.
      </Clause>

      <Clause>
        5.2. Havendo pluralidade de CESSIONÁRIOS, cada qual responderá exclusivamente pelo pagamento da fração do preço correspondente à sua participação na aquisição, na forma estabelecida neste instrumento, não havendo solidariedade entre os CESSIONÁRIOS quanto ao inadimplemento de obrigação exclusivamente atribuível a outro CESSIONÁRIO.
      </Clause>

      <Clause>
        5.3. O preço estabelecido na Cláusula 5.1 constitui o valor total da cessão dos direitos possessórios objeto deste instrumento, não compreendendo as despesas e os custos que, por disposição expressa deste contrato, sejam de responsabilidade específica de cada parte.
      </Clause>

      <Clause>
        5.4. As despesas necessárias à regularização fundiária do imóvel e à instrução e desenvolvimento do procedimento de usucapião, quando juridicamente cabível, serão suportadas pelo CEDENTE, na forma estabelecida no Capítulo IV, não sendo tais despesas consideradas parcela adicional do preço de aquisição dos direitos possessórios.
      </Clause>

      <Clause>
        5.5. As custas e os emolumentos devidos ao Registro de Imóveis para os atos de regularização registral final do imóvel não integram o preço previsto na Cláusula 5.1 e serão suportados pelo(a)(s) CESSIONÁRIO(A)(S), na forma estabelecida no Capítulo VII, sendo seus valores apurados no momento próprio conforme os atos efetivamente praticados, a situação registral do imóvel e os demais elementos que possam influenciar sua cobrança.
      </Clause>

      <Clause>
        5.6. Verificada a existência de dívida ativa municipal, execução fiscal ou qualquer outro débito anterior à imissão na posse que seja de responsabilidade do CEDENTE, este deverá adotar, com recursos provenientes do preço da cessão previsto na Cláusula 5.1, as providências necessárias à quitação integral da dívida ou, quando admitido pelo órgão competente e expressamente adequado ao caso, à formalização de parcelamento regular, apresentando ao(à)(s) CESSIONÁRIO(A)(S), no prazo máximo de <DataTag text="PRAZO EM DIAS (EX: 30 DIAS)" field="prazoComprovacaoQuitacaoDivida" /> contados do recebimento de cada parcela do preço, os respectivos comprovantes de quitação ou o instrumento formal de parcelamento, com indicação das parcelas, valores e vencimentos. A utilização dos recursos do preço para essa finalidade não caracteriza transferência da dívida ao(à)(s) CESSIONÁRIO(A)(S) nem cria obrigação adicional além do preço estabelecido na Cláusula 5.1, permanecendo o CEDENTE responsável, com recursos próprios, por eventual diferença não coberta pelos valores recebidos.
      </Clause>

      <Clause>
        5.6.1. O eventual limite financeiro estabelecido no cronograma de pagamento para utilização imediata na quitação de dívida anterior não limitará a responsabilidade do CEDENTE pelo pagamento integral dos débitos, encargos, multas, juros, honorários ou demais valores cuja origem ou fato gerador seja anterior à imissão na posse e que sejam de sua responsabilidade.
      </Clause>

      <Clause>
        5.7. Sendo a dívida objeto de parcelamento, o CEDENTE ficará obrigado a manter todas as parcelas rigorosamente em dia até sua quitação integral, sem transferência dessa obrigação ao(à)(s) CESSIONÁRIO(A)(S). O CEDENTE deverá apresentar os respectivos comprovantes sempre que solicitado, no prazo máximo de <DataTag text="PRAZO EM DIAS (EX: 10 DIAS)" field="prazoApresentacaoComprovanteParcelamento" />.
      </Clause>

      <Clause>
        5.7.1. Na hipótese de o CEDENTE deixar de pagar qualquer parcela de dívida cuja responsabilidade lhe caiba, o(a)(s) CESSIONÁRIO(A)(S) poderá, mediante comunicação prévia por escrito, efetuar diretamente o pagamento ao respectivo credor ou órgão competente e descontar integralmente o valor desembolsado das parcelas do preço ainda devidas ao CEDENTE, considerando-se esse pagamento como cumprimento válido da obrigação de pagar o preço, até o limite do valor efetivamente desembolsado.
      </Clause>

      <Clause>
        5.7.2. O inadimplemento pelo CEDENTE das obrigações previstas nesta Cláusula será considerado descumprimento de obrigação contratual, sujeitando-o às consequências previstas no Capítulo X, sem prejuízo do direito do(a)(s) CESSIONÁRIO(A)(S) de efetuar os pagamentos necessários para evitar a majoração do débito ou prejuízo ao imóvel e promover o respectivo abatimento no saldo do preço.
      </Clause>

      {/* CAPÍTULO VI */}
      <SectionTitle>CAPÍTULO VI – DA FORMA DE PAGAMENTO E COMPROVAÇÃO</SectionTitle>

      <Clause>
        6.1. O preço total da presente cessão de posse, estipulado na Cláusula 5.1, será pago pelo(a)(s) CESSIONÁRIO(A)(S) mediante a estrutura operacional de cobrança, arrecadação e repasse administrada pela ASPPIBRA na qualidade de mandatária do CEDENTE, na forma estabelecida nas Cláusulas 1.5.11 a 1.5.20, conforme os valores, etapas, parcelas e cronograma de vencimentos detalhados no Quadro-Resumo a seguir:
      </Clause>

      {/* QUADRO-RESUMO FINANCEIRO CONSOLIDADO */}
      <Box sx={{ my: 1.5, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, borderColor: '#333' }}>
          <Table size="small">
            <TableBody>
              <TableRow sx={{ bgcolor: '#F4F6F8' }}>
                <TableCell colSpan={3} sx={{ fontWeight: 'bold', fontSize: '9.5pt', borderBottom: '1.5px solid #000', textAlign: 'center', py: 0.8 }}>
                  QUADRO-RESUMO – FLUXO FINANCEIRO DO PREÇO
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                <TableCell sx={{ fontWeight: 'bold', width: '32%', borderBottom: '1px solid #000', fontSize: '8.5pt', py: 0.6 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '26%', borderBottom: '1px solid #000', fontSize: '8.5pt', textAlign: 'center', py: 0.6 }}>Valor (R$)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '42%', borderBottom: '1px solid #000', fontSize: '8.5pt', py: 0.6 }}>Condição / Vencimento</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>Preço Total</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', textAlign: 'center', fontWeight: 'bold', py: 0.6 }}>
                  R$ <DataTag text="180.000,00" field="valorTotalPreco" />
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>Valor global da cessão (Cláusula 5.1)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>Entrada (Sinal)</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', textAlign: 'center', fontWeight: 'bold', py: 0.6 }}>
                  R$ <DataTag text="25.000,00" field="valorEntradaAto" />
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>
                  No ato da assinatura (<DataTag text="À VISTA" field="dataPagamentoAssinatura" />)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>Saldo Financiado</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', textAlign: 'center', fontWeight: 'bold', py: 0.6 }}>
                  R$ <DataTag text="155.000,00" field="valorSaldoRemanescente" />
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>
                  Em <DataTag text="28" field="numeroCiclos" /> ciclos quadrimestrais (<DataTag text="112" field="totalParcelasMensais" /> meses)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>Parcelas Mensais (M1 a M3)</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', textAlign: 'center', py: 0.6 }}>
                  R$ <DataTag text="1.000,00" field="valorParcelaMes1Ciclo" /> / mês
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>
                  Meses 1, 2 e 3 de cada ciclo (mensal)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>Reforço do Ciclo (M4)</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', textAlign: 'center', py: 0.6 }}>
                  R$ <DataTag text="2.500,00" field="valorReforcoMes4Ciclo" />
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>
                  Mês 4 de cada ciclo (balão quadrimestral)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>Total por Ciclo (4 meses)</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', textAlign: 'center', fontWeight: 'bold', py: 0.6 }}>
                  R$ <DataTag text="5.500,00" field="valorTotalCiclo" />
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>
                  3 mensais + 1 reforço (28 ciclos = R$ 154.000)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>Ajuste Final de Quitação</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', textAlign: 'center', py: 0.6 }}>
                  R$ <DataTag text="1.000,00" field="valorParcelaResidualFinal" />
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '8.5pt', py: 0.6 }}>
                  No 113º mês (quitação integral de R$ 155.000)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '8.5pt', py: 0.6 }}>Início dos Vencimentos</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', textAlign: 'center', py: 0.6 }}>1º Ciclo</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>
                  <DataTag text="30 dias após a entrada" field="vencimentoPrimeiroCiclo" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Clause>
        6.2. Da entrada: os valores pagos a título de sinal e parcelas de entrada discriminados no Quadro-Resumo constituem amortização direta do preço ajustado na Cláusula 5.1, não possuindo natureza de arras ou sinal penitencial, aplicando-se a quitação exclusivamente ao valor efetivamente recebido e identificado no respectivo comprovante bancário.
      </Clause>

      <Clause>
        6.3. Dos ciclos e antecipação: após quitada a entrada, o saldo remanescente será pago na sequência estipulada de ciclos quadrimestrais, vencendo-se a primeira parcela na data fixada no Quadro-Resumo e as demais no mesmo dia dos meses subsequentes. É facultado ao(à)(s) CESSIONÁRIO(A)(S) amortizar ou quitar antecipadamente quaisquer parcelas ou ciclos, a qualquer tempo, sem penalidade, com redução nominal imediata do saldo devedor remanescente.
      </Clause>

      <Clause>
        6.4. Havendo pluralidade de CESSIONÁRIOS, os pagamentos previstos no cronograma serão rateados na proporção de suas respectivas quotas-partes na aquisição da posse, respondendo cada qual exclusivamente por sua fração, ressalvadas as hipóteses de compensação ou retenção contratual expressamente previstas neste instrumento.
      </Clause>

      <Clause>
        6.5. Da comprovação e guarda: os pagamentos serão realizados na conta operacional da ASPPIBRA ou mediante meios de pagamento por ela regularmente emitidos (boleto bancário, Pix Cobrança ou transferência identificada), na forma da Cláusula 1.5, comprovando-se mediante recibo ou comprovante de liquidação efetiva que permita identificar o pagador, o beneficiário, o valor, a data e a finalidade. As partes comprometem-se a conservar os comprovantes de pagamento pelo prazo mínimo de 5 (cinco) anos.
      </Clause>

      {/* CAPÍTULO VII */}
      <SectionTitle>CAPÍTULO VII – DAS OBRIGAÇÕES TRIBUTÁRIAS, MUNICIPAIS, NOTARIAIS E REGISTRAIS</SectionTitle>

      <Clause>
        7.1. Até a data da efetiva imissão do(a)(s) CESSIONÁRIO(A)(S) na posse do imóvel, permanecerão sob responsabilidade exclusiva do CEDENTE todos os tributos, taxas, contribuições, tarifas, encargos e demais obrigações incidentes sobre o imóvel ou dele decorrentes, cujo fato gerador ou origem seja anterior à imissão na posse, incluindo, quando aplicável, IPTU, taxas municipais, contribuições de melhoria, encargos de loteamento e obrigações perante associação de moradores.
      </Clause>

      <Clause>
        7.2. A partir da efetiva imissão na posse, passarão a ser de responsabilidade do(a)(s) CESSIONÁRIO(A)(S), na proporção de sua respectiva participação, os tributos, taxas, tarifas, contribuições e demais encargos cujo fato gerador ou origem seja posterior à imissão na posse, incluindo IPTU e taxas municipais, consumo de água, energia elétrica, serviços, contribuições de associação de moradores, loteamento e demais despesas ordinárias relacionadas ao imóvel.
      </Clause>

      <Clause>
        7.2.1. A transferência da responsabilidade prevista na Cláusula 7.2 não abrangerá débitos, multas, juros, encargos ou obrigações cuja origem ou fato gerador seja anterior à imissão na posse, ainda que sua cobrança, lançamento ou exigibilidade ocorra posteriormente, permanecendo tais valores sob responsabilidade exclusiva do CEDENTE, quando a ele imputáveis.
      </Clause>

      <Clause>
        7.3. Serão de responsabilidade do CEDENTE, na forma estabelecida no Capítulo IV, as despesas necessárias à regularização fundiária do imóvel e à instrução, formalização, desenvolvimento e processamento do procedimento de usucapião, quando juridicamente cabível, incluindo despesas técnicas, administrativas, documentais e notariais, independentemente de tais despesas ocorrerem antes ou depois da quitação integral do preço pelo(a)(s) CESSIONÁRIO(A)(S), desde que estejam relacionadas às obrigações atribuídas ao CEDENTE por este instrumento ou à regularização da situação possessória, documental, cadastral, urbanística ou registral existente até a data da imissão na posse. Permanecem excluídas da responsabilidade do CEDENTE as custas e os emolumentos devidos ao Registro de Imóveis pelo registro ou pela regularização registral final em nome do(a)(s) CESSIONÁRIO(A)(S), os quais serão suportados por estes na forma das Cláusulas 5.5 e 7.4.
      </Clause>

      <Clause>
        7.4. Serão de responsabilidade exclusiva do(a)(s) CESSIONÁRIO(A)(S), na proporção de sua respectiva participação, as custas, emolumentos e demais despesas devidas ao Registro de Imóveis para a prática dos atos de regularização registral final do imóvel, inclusive registro, averbação, abertura de matrícula ou outros atos registrais efetivamente exigidos no caso concreto.
      </Clause>

      <Clause>
        7.4.1. Os custos previstos na Cláusula 7.4 não integram o preço estabelecido na Cláusula 5.1 e serão apurados e pagos no momento da prática dos respectivos atos registrais, conforme a situação efetiva do imóvel e os valores oficialmente cobrados pela serventia competente.
      </Clause>

      <Clause>
        7.4.2. As despesas registrais previstas nesta Cláusula poderão considerar, quando legalmente relevantes, a situação física, cadastral e registral do imóvel, inclusive eventual existência ou realização de construções, benfeitorias ou outras circunstâncias que influenciem a prática ou o valor dos atos registrais.
      </Clause>

      <Clause>
        7.4.3. Eventuais tributos incidentes sobre ato específico de transmissão, regularização ou registro somente serão de responsabilidade da parte indicada neste instrumento quando efetivamente exigíveis por lei em razão do ato praticado, não constituindo esta cláusula reconhecimento prévio da incidência de determinado tributo.
      </Clause>

      {/* TABELA MATRIZ DE RESPONSABILIDADES */}
      <Box sx={{ my: 2, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, borderColor: '#000' }}>
          <Table size="small">
            <TableBody>
              <TableRow sx={{ bgcolor: '#F4F6F8' }}>
                <TableCell colSpan={3} sx={{ fontWeight: 'bold', fontSize: '10.5pt', borderBottom: '1.5px solid #000', textAlign: 'center' }}>
                  QUADRO-RESUMO – MATRIZ DE REPARTIÇÃO DE OBRIGAÇÕES, TRIBUTOS E CUSTOS
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                <TableCell sx={{ fontWeight: 'bold', width: '38%', borderBottom: '1px solid #000', fontSize: '9pt' }}>Natureza da Despesa / Obrigação</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '24%', borderBottom: '1px solid #000', fontSize: '9pt', textAlign: 'center' }}>Responsável</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '38%', borderBottom: '1px solid #000', fontSize: '9pt' }}>Período / Condição de Aplicação</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>IPTU, Taxas Municipais e Encargos Pretéritos</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', fontWeight: 'bold', textAlign: 'center' }}>CEDENTE</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Fatos geradores anteriores à imissão na posse (Cl. 7.1)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Dívida Ativa e Regularização Fiscal Anterior</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', fontWeight: 'bold', textAlign: 'center' }}>CEDENTE</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Quitação via preço ou parcelamento próprio (Cl. 5.6 e 7.6)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Regularização Fundiária, Usucapião e Ata Notarial</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', fontWeight: 'bold', textAlign: 'center' }}>CEDENTE</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Custeio integral de despesas técnicas e notariais (Cl. 7.3)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>IPTU, Taxas Municipais e Contribuições Futuras</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', fontWeight: 'bold', textAlign: 'center' }}>CESSIONÁRIO</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>A partir da efetiva imissão na posse (Cl. 7.2)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Contas de Consumo (Água, Energia, Serviços)</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', fontWeight: 'bold', textAlign: 'center' }}>CESSIONÁRIO</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>A partir da efetiva imissão na posse (Cl. 7.2)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '9pt' }}>Custas e Emolumentos Finais do Cartório de Registro (RGI)</TableCell>
                <TableCell sx={{ fontSize: '9pt', fontWeight: 'bold', textAlign: 'center' }}>CESSIONÁRIO</TableCell>
                <TableCell sx={{ fontSize: '9pt' }}>No ato do registro definitivo / matrícula própria (Cl. 7.4)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Clause>
        7.5. O CEDENTE obriga-se a entregar ao(à)(s) CESSIONÁRIO(A)(S), no prazo de até <DataTag text="PRAZO EM DIAS (EX: 15 DIAS)" field="prazoEntregaCertidoes" /> contados da assinatura deste instrumento, as certidões e documentos relativos ao imóvel e à sua situação jurídica que estejam disponíveis e sejam necessários à verificação de débitos, ônus, gravames e restrições existentes, incluindo certidão ou documento equivalente relativo aos débitos municipais e certidão da matrícula, transcrição ou registro disponível, quando existente.
      </Clause>

      <Clause>
        7.5.1. Quando a emissão de qualquer certidão ou documento depender de prazo superior a <DataTag text="PRAZO EM DIAS (EX: 15 DIAS)" field="prazoEntregaCertidoes" /> por parte do órgão ou serventia competente, o CEDENTE deverá comprovar o respectivo requerimento dentro do prazo contratual e entregar o documento ao(à)(s) CESSIONÁRIO(A)(S) no prazo de até <DataTag text="PRAZO EM DIAS ÚTEIS (EX: 5 DIAS ÚTEIS)" field="prazoEntregaCertidoesDisponibilizadas" /> contados de sua disponibilização.
      </Clause>

      <Clause>
        7.5.2. O CEDENTE deverá também fornecer, quando juridicamente pertinentes e disponíveis, certidões pessoais destinadas à verificação de ações, execuções, protestos ou outros fatos que possam repercutir sobre os direitos objeto deste instrumento, observados os limites e a finalidade de cada certidão.
      </Clause>

      <Clause>
        7.6. Constatada, a qualquer tempo, a existência de tributos, taxas, contribuições, encargos, multas, juros, execuções, débitos ou quaisquer outras obrigações cuja origem ou fato gerador seja anterior à imissão na posse e cuja responsabilidade seja do CEDENTE, este ficará obrigado ao seu pagamento integral, independentemente de tais valores terem sido identificados antes ou depois da assinatura deste instrumento.
      </Clause>

      <Clause>
        7.6.1. Caso o(a)(s) CESSIONÁRIO(A)(S) efetue qualquer pagamento de débito cuja responsabilidade seja do CEDENTE, para evitar restrição, acréscimo, execução, prejuízo ao imóvel ou outra consequência, o valor efetivamente desembolsado poderá ser integralmente compensado com parcelas do preço ainda devidas ao CEDENTE, mediante comunicação prévia por escrito e apresentação do respectivo comprovante.
      </Clause>

      <Clause>
        7.6.2. A compensação prevista na Cláusula 7.6.1 não caracterizará inadimplemento do(a)(s) CESSIONÁRIO(A)(S), permanecendo o pagamento realizado diretamente ao credor ou órgão competente reconhecido, até o respectivo limite, como cumprimento da obrigação pecuniária correspondente.
      </Clause>

      <Clause>
        7.7. As responsabilidades previstas neste Capítulo não afastam outras obrigações atribuídas às partes pelos demais capítulos deste instrumento, prevalecendo, em caso de aparente sobreposição, a disposição que atribuir de forma mais específica a responsabilidade pela despesa, tributo, obrigação ou ato correspondente.
      </Clause>

      {/* CAPÍTULO VIII */}
      <SectionTitle>CAPÍTULO VIII – DA IMISSÃO NA POSSE E DAS BENFEITORIAS</SectionTitle>

      <Clause>
        8.1. A imissão do(a)(s) CESSIONÁRIO(A)(S) na posse do imóvel ocorrerá imediatamente após a assinatura deste instrumento por todas as partes e testemunhas, salvo estipulação diversa expressa.
      </Clause>

      <Clause>
        8.2. Em caso de resolução ou distrato deste contrato por inadimplemento do(a)(s) CESSIONÁRIO(A)(S), nos termos do Capítulo X, este(a)(s) fará(ão) jus à indenização ou retenção pelas benfeitorias necessárias e úteis comprovadamente realizadas no imóvel, ressalvado o direito do CEDENTE de optar pelo pagamento do valor de tais benfeitorias, apurado por avaliação de comum acordo ou, na falta deste, por perito nomeado de comum acordo pelas partes, em vez de permitir sua retirada, na forma dos arts. 1.219 e 1.222 do Código Civil.
      </Clause>

      <Clause>
        8.3. Benfeitorias voluptuárias poderão ser levantadas pelo(a)(s) CESSIONÁRIO(A)(S), desde que sua retirada não cause dano ou depreciação ao imóvel, sem indenização.
      </Clause>

      <Clause>
        8.4. Das construções: uma vez imitido(a)(s) na posse, o(a)(s) CESSIONÁRIO(A)(S) poderá(ão) edificar no imóvel, por sua conta e risco, correndo exclusivamente às suas expensas a obtenção de licenciamento junto à Prefeitura Municipal e demais órgãos competentes, a regularização da obra e o cumprimento das obrigações tributárias, administrativas e legais dela decorrentes perante o Município e demais autoridades, respondendo o(a)(s) CESSIONÁRIO(A)(S) por eventuais multas, embargos, demolições ou outras consequências decorrentes de construção irregular ou não licenciada.
      </Clause>

      <Clause>
        8.4.1. Construções de porte relevante (tais como casa, galpão ou estrutura assemelhada), diferentemente das benfeitorias tratadas na Cláusula 8.2, deverão ser comunicadas ao CEDENTE, com indicação de sua natureza e área, e serão consideradas para fins de apuração, no momento próprio, das custas e emolumentos registrais previstos na Cláusula 7.4.1, bem como do respectivo valor em caso de distrato, apurado por avaliação de comum acordo ou, na falta deste, por perito nomeado de comum acordo pelas partes.
      </Clause>

      {/* CAPÍTULO IX */}
      <SectionTitle>CAPÍTULO IX – DO INADIMPLEMENTO, JUROS E MULTA</SectionTitle>

      <Clause>
        9.1. O atraso no pagamento de qualquer parcela devida pelo(a) CESSIONÁRIO(A) sujeitará a obrigação vencida, independentemente de prova de prejuízo, aos seguintes encargos, calculados cumulativamente entre si exclusivamente durante o período de mora:
        <br />
        (a) correção monetária pelo IPCA/IBGE, ou por índice oficial que legalmente o substitua, desde a data do vencimento até a data do efetivo pagamento;
        <br />
        (b) juros moratórios de 1% (um por cento) ao mês, calculados pro rata die sobre o valor atualizado da parcela em atraso; e
        <br />
        (c) multa moratória de 2% (dois por cento) sobre o valor da parcela vencida e não paga.
      </Clause>

      <Clause>
        § 1º. Os encargos previstos nesta Cláusula incidirão somente até a data do efetivo pagamento ou, na hipótese de resolução do contrato, até a data da resolução, observadas as regras de não cumulatividade previstas na Cláusula 9.4.
      </Clause>

      <Clause>
        § 2º. Havendo necessidade efetiva de cobrança extrajudicial por advogado em razão do inadimplemento, poderão ser cobrados honorários advocatícios extrajudiciais correspondentes aos serviços efetivamente prestados, limitados a 10% (dez por cento) do valor atualizado da obrigação vencida e exigida, desde que haja comprovação da atuação profissional e desde que tais honorários não sejam cumulados com honorários sucumbenciais fixados judicialmente relativamente ao mesmo trabalho.
      </Clause>

      <Clause>
        9.2. Verificado o inadimplemento de obrigação com vencimento certo, o(a) CESSIONÁRIO(A) será considerado(a) constituído(a) em mora na forma do art. 397 do Código Civil, sem prejuízo de notificação formal para os fins de resolução contratual. Para fins de constituição de prazo contratual específico para purgação da mora, o CEDENTE notificará o(a) CESSIONÁRIO(A) por escrito, por carta com aviso de recebimento, notificação extrajudicial em cartório ou meio eletrônico que permita comprovação do envio e do recebimento.
      </Clause>

      <Clause>
        § 1º. Recebida a notificação, o(a) CESSIONÁRIO(A) terá prazo de 15 (quinze) dias corridos para purgar integralmente a mora, mediante pagamento das parcelas vencidas e dos encargos previstos na Cláusula 9.1.
      </Clause>

      <Clause>
        § 2º. O pagamento parcial não importará purgação da mora, salvo se expressamente aceito pelo CEDENTE por escrito, hipótese em que o saldo remanescente permanecerá sujeito aos encargos contratuais.
      </Clause>

      <Clause>
        § 3º. A faculdade contratual de purgação da mora prevista nesta Cláusula não constitui renúncia a qualquer direito decorrente da legislação aplicável e não altera, por mera estipulação contratual, a natureza jurídica da relação existente entre as partes.
      </Clause>

      <Clause>
        <strong>9.3. DOS EFEITOS DA MORA E DA LIMITAÇÃO DO GATILHO RESOLUTÓRIO.</strong> A mora do(a) CESSIONÁRIO(A) e sua eventual repercussão na vigência deste contrato observarão as seguintes regras:
        <br />
        (a) o inadimplemento de qualquer parcela, isoladamente considerado, constitui mora do(a) CESSIONÁRIO(A) e autoriza o CEDENTE a exigir o valor devido, acrescido dos encargos previstos na Cláusula 9.1, observado o prazo de 15 (quinze) dias corridos para purgação da mora previsto na Cláusula 9.2, não constituindo, por si só, causa de resolução do contrato;
        <br />
        (b) para fins de resolução por inadimplemento financeiro, somente serão computadas as parcelas que, depois de regularmente vencidas e após o decurso do prazo de 15 (quinze) dias corridos concedido na notificação para purgação da mora, permaneçam sem quitação integral;
        <br />
        (c) a resolução do contrato por inadimplemento financeiro somente poderá ser promovida quando houver <strong>3 (três) parcelas, consecutivas ou não, vencidas e não sanadas</strong>, observado, em relação a cada parcela, o procedimento prévio de notificação e purgação previsto neste Capítulo;
        <br />
        (d) a quitação integral de determinada parcela dentro do prazo de purgação da mora fará com que essa parcela <strong>não seja computada</strong> para o cômputo das 3 (três) parcelas necessárias à resolução;
        <br />
        (e) a ocorrência de uma ou duas parcelas inadimplidas e não sanadas autoriza a cobrança dos valores vencidos e respectivos encargos moratórios, inclusive pela via judicial, mas não autoriza, exclusivamente por esse fundamento, a resolução do contrato; e
        <br />
        (f) a regra deste dispositivo não prejudica as demais hipóteses autônomas de resolução previstas neste contrato, especialmente aquelas decorrentes de fraude, falsidade, cessão duplicada, disposição indevida dos direitos possessórios ou outras faltas graves expressamente qualificadas como causa de resolução no Capítulo X.
      </Clause>

      <Clause>
        Parágrafo único. Verificado o preenchimento do requisito previsto na alínea “c”, o CEDENTE poderá promover a resolução do contrato mediante notificação formal do(a) CESSIONÁRIO(A), aplicando-se os procedimentos de restituição da posse, retenção compensatória, comercialização do imóvel e restituição de saldo previstos no Capítulo X.
      </Clause>

      <Clause>
        9.4. É vedada a cumulação de mecanismos destinados a reparar o mesmo inadimplemento quando houver identidade de fundamento e finalidade econômica, observando-se a seguinte disciplina:
        <br />
        (a) enquanto permanecer vigente o contrato e o CEDENTE não houver optado pela resolução nem pelo procedimento judicial incompatível com a manutenção da relação contratual, incidirão os encargos de mora previstos na Cláusula 9.1;
        <br />
        (b) optando o CEDENTE pela resolução por inadimplemento do(a) CESSIONÁRIO(A), a cláusula penal compensatória prevista na Cláusula 10.2.1 constituirá a reparação contratual prefixada pela resolução e substituirá, a partir da data da resolução, a incidência de multa, juros e demais encargos moratórios futuros, permanecendo os encargos da Cláusula 9.1 limitados ao período anterior à resolução;
        <br />
        (c) optando o CEDENTE pela cobrança judicial sem resolução, poderão ser exigidos o principal vencido, os encargos moratórios da Cláusula 9.1, as despesas processuais recuperáveis e os honorários advocatícios fixados judicialmente, vedada, nessa hipótese, a cobrança da cláusula penal compensatória prevista na Cláusula 10.2.1;
        <br />
        (d) a adoção de uma das alternativas previstas nesta Cláusula não impedirá a posterior adoção de providência juridicamente cabível em razão de novo inadimplemento autônomo, desde que não haja dupla reparação pelo mesmo fato.
      </Clause>

      <Clause>
        9.5. O recebimento de parcela em atraso pelo CEDENTE, sem ressalva escrita quanto a eventual saldo remanescente, não importará novação, renúncia ou alteração das demais disposições contratuais.
      </Clause>

      <Clause>
        9.6. O eventual atraso do CEDENTE no cumprimento de obrigação pecuniária líquida e exigível sujeitará o valor devido, desde o vencimento até o efetivo pagamento, à mesma correção monetária pelo IPCA/IBGE e aos mesmos juros moratórios de 1% (um por cento) ao mês, calculados pro rata die, sem incidência da multa moratória prevista para o atraso do(a) CESSIONÁRIO(A), salvo se outra penalidade específica estiver expressamente prevista neste instrumento.
      </Clause>

      {/* TABELA ENCARGOS MORATÓRIOS E REGRAS DE INADIMPLEMENTO */}
      <Box sx={{ my: 2, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, borderColor: '#000' }}>
          <Table size="small">
            <TableBody>
              <TableRow sx={{ bgcolor: '#F4F6F8' }}>
                <TableCell colSpan={3} sx={{ fontWeight: 'bold', fontSize: '10.5pt', borderBottom: '1.5px solid #000', textAlign: 'center' }}>
                  QUADRO-RESUMO – ENCARGOS MORATÓRIOS E REGRAS DE INADIMPLEMENTO
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                <TableCell sx={{ fontWeight: 'bold', width: '35%', borderBottom: '1px solid #000', fontSize: '9pt' }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '25%', borderBottom: '1px solid #000', fontSize: '9pt', textAlign: 'center' }}>Parâmetro</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '40%', borderBottom: '1px solid #000', fontSize: '9pt' }}>Aplicação</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Correção Monetária</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', textAlign: 'center' }}>
                  IPCA/IBGE
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Desde o vencimento até o pagamento</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Juros de Mora</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', textAlign: 'center' }}>
                  1% ao mês
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Pro rata die</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Multa Moratória</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', textAlign: 'center' }}>
                  2%
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Sobre a parcela vencida</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Prazo de Purgação da Mora</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', textAlign: 'center' }}>
                  15 dias corridos
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Contados do recebimento da notificação</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Gatilho Resolutório por Inadimplemento Financeiro</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', textAlign: 'center' }}>
                  3 parcelas não sanadas
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>
                  Parcelas vencidas consecutivas ou não, cujo prazo de 15 dias de purgação tenha decorrido sem quitação (Cláusula 9.3)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Cláusula Penal Compensatória</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', textAlign: 'center' }}>
                  20%
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>
                  Sobre os valores efetivamente pagos pelo(a) CESSIONÁRIO(A), conforme Cláusula 10.2.1
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Prazo para Início da Comercialização após Resolução</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', textAlign: 'center' }}>
                  30 dias corridos
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Contados da efetiva restituição da posse ao CEDENTE</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Revisão do Preço de Oferta</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', textAlign: 'center' }}>
                  A cada 180 dias
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Ou antes, mediante justificativa objetiva de mercado</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Prazo Máximo para Restituição</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt', textAlign: 'center' }}>
                  12 meses
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E0E0E0', fontSize: '9pt' }}>Contados da restituição da posse ao CEDENTE, independentemente da conclusão da nova venda</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '9pt' }}>Prazo para Repasse após Recebimento de Venda</TableCell>
                <TableCell sx={{ fontSize: '9pt', textAlign: 'center' }}>
                  15 dias úteis
                </TableCell>
                <TableCell sx={{ fontSize: '9pt' }}>Contados do efetivo recebimento dos recursos pelo CEDENTE</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* CAPÍTULO X */}
      <SectionTitle>CAPÍTULO X – DA RESOLUÇÃO, DO DISTRATO E DE SUAS CONSEQUÊNCIAS</SectionTitle>

      <Clause>
        10.1. Constituem causas de resolução deste instrumento por inadimplemento ou impossibilidade superveniente, sem prejuízo de outras hipóteses legalmente admissíveis:
        <br />
        (a) o inadimplemento financeiro qualificado de 3 (três) parcelas, consecutivas ou não, vencidas e não purgadas no prazo contratual, nos exatos termos e limites definidos na Cláusula 9.3;
        <br />
        (b) o descumprimento de obrigação contratual essencial por qualquer das partes, não sanado no prazo de 30 (trinta) dias corridos após notificação escrita, quando a natureza da obrigação admitir saneamento;
        <br />
        (c) a prática comprovada de ato de dolo, fraude, falsidade material relevante, cessão duplicada ou ocultação deliberada de fato relevante por qualquer das partes;
        <br />
        (d) a perda total da posse por decisão judicial ou administrativa definitiva, quando não houver solução contratualmente ou juridicamente admissível para manutenção da relação;
        <br />
        (e) o indeferimento definitivo da regularização fundiária nas hipóteses e condições especificamente previstas no instrumento, desde que a causa do indeferimento não decorra de ato ou omissão imputável à parte que pretenda invocá-lo; e
        <br />
        (f) o distrato formal celebrado por mútuo acordo entre as partes.
      </Clause>

      <Clause>
        § 1º. Sempre que a causa de resolução decorrer de inadimplemento sanável, a resolução somente produzirá efeitos após observados a notificação e o prazo de cura previstos neste instrumento, ressalvadas as hipóteses de inadimplemento grave ou de impossibilidade de saneamento.
      </Clause>

      <Clause>
        § 2º. A resolução por inadimplemento não se confunde com distrato por mútuo acordo, que dependerá de manifestação expressa e escrita de todas as partes envolvidas.
      </Clause>

      <Clause>
        10.2. RESOLUÇÃO POR CULPA OU INADIMPLEMENTO DO(A) CESSIONÁRIO(A). Verificada a hipótese prevista na Cláusula 10.1(a) (três parcelas vencidas e não sanadas nos termos da Cláusula 9.3) ou outra infração contratual que autorize a resolução por culpa do(a) CESSIONÁRIO(A), o contrato poderá ser resolvido mediante notificação formal, retornando a posse ao CEDENTE e aplicando-se o procedimento de retenção, comercialização e restituição estabelecido nesta Cláusula.
      </Clause>

      <Clause>
        <strong>10.2.1. Na hipótese de resolução motivada por culpa ou inadimplemento do(a) CESSIONÁRIO(A), o CEDENTE poderá reter, a título de cláusula penal compensatória e prefixação das perdas e danos decorrentes especificamente da resolução, o equivalente a 20% (vinte por cento) da totalidade dos valores efetivamente pagos pelo(a) CESSIONÁRIO(A) até a data da resolução, incluindo valores pagos a título de entrada ou sinal, desde que estes integrem economicamente a remuneração contratual.</strong>
      </Clause>

      <Clause>
        § 1º. O saldo correspondente a 80% (oitenta por cento) dos valores efetivamente pagos pelo(a) CESSIONÁRIO(A), descontados apenas os valores que este instrumento expressamente qualifique como não restituíveis, constituirá crédito líquido contratual do(a) CESSIONÁRIO(A).
      </Clause>

      <Clause>
        § 2º. A retenção prevista nesta Cláusula não poderá ser utilizada cumulativamente para compensar os mesmos prejuízos que já tenham sido abrangidos pela cláusula penal, sendo vedada a cobrança em duplicidade de despesas, multas ou indenizações com idêntica finalidade econômica.
      </Clause>

      <Clause>
        § 3º. A redução judicial da cláusula penal, quando cabível nos termos da legislação civil, não constitui renúncia prévia das partes à aplicação da penalidade, mas observância ao regime legal aplicável.
      </Clause>

      <Clause>
        <strong>10.2.2. A cláusula penal prevista na Cláusula 10.2.1 destina-se exclusivamente à compensação, conforme o caso concreto, de prejuízos decorrentes da resolução, inclusive fruição do imóvel, despesas administrativas diretamente relacionadas à contratação originária e outros custos comprovadamente vinculados ao inadimplemento, sem prejuízo da vedação de duplicidade de cobrança.</strong>
      </Clause>

      <Clause>
        10.2.3. RESTITUIÇÃO DO SALDO AO(À) CESSIONÁRIO(A). Formalizada a resolução por culpa ou inadimplemento do(a) CESSIONÁRIO(A) e efetivamente restituída a posse ao CEDENTE, o saldo restitutível previsto na Cláusula 10.2.1 deverá ser apurado e reconhecido documentalmente no prazo máximo de 15 (quinze) dias úteis.
      </Clause>

      <Clause>
        § 1º. A nova comercialização do imóvel poderá ser utilizada como mecanismo operacional para geração dos recursos necessários à restituição, mas a restituição NÃO ficará indefinidamente condicionada à venda do imóvel.
      </Clause>

      <Clause>
        § 2º. O CEDENTE deverá iniciar a comercialização do imóvel no prazo máximo de 30 (trinta) dias corridos contados da efetiva desocupação e restituição da posse, mediante divulgação por meios habituais do mercado e, quando conveniente, intermediação profissional.
      </Clause>

      <Clause>
        § 3º. O preço de oferta inicial deverá ser fixado com base em avaliação de mercado realizada por corretor de imóveis regularmente inscrito no CRECI, por empresa de avaliação ou por outro profissional tecnicamente habilitado, ou mediante média de pelo menos 2 (duas) avaliações independentes quando houver disponibilidade razoável desses profissionais.
      </Clause>

      <Clause>
        § 4º. O CEDENTE não poderá fixar deliberadamente preço artificialmente elevado nem adotar conduta que, de forma injustificada, dificulte ou impeça a venda.
      </Clause>

      <Clause>
        § 5º. Decorridos 180 (cento e oitenta) dias sem conclusão da nova alienação, o preço de oferta deverá ser reavaliado com base nas condições reais de mercado, registrando-se a alteração e o respectivo fundamento.
      </Clause>

      <Clause>
        § 6º. O CEDENTE deverá empregar esforços efetivos e razoáveis para a comercialização, podendo o(a) CESSIONÁRIO(A), mediante solicitação escrita não mais frequente que uma vez a cada 60 (sessenta) dias, receber informações objetivas sobre o andamento da comercialização, incluindo meios utilizados para divulgação, preço de oferta vigente e, se houver, propostas formalmente recebidas.
      </Clause>

      <Clause>
        § 7º. Eventuais despesas de intermediação e custos diretamente vinculados à nova alienação somente poderão ser deduzidos do produto da nova venda quando:
        <br />
        (a) forem efetivamente pagos ou inequivocamente devidos;
        <br />
        (b) forem documentalmente comprovados;
        <br />
        (c) forem lícitos e diretamente relacionados à nova operação; e
        <br />
        (d) não tiverem sido anteriormente considerados ou compensados pela cláusula penal da Cláusula 10.2.1.
      </Clause>

      <Clause>
        10.2.3.1. VENDA À VISTA. Sendo o imóvel alienado mediante pagamento à vista, o CEDENTE deverá repassar ao(à) CESSIONÁRIO(A) o saldo restitutível que ainda estiver pendente no prazo máximo de 15 (quinze) dias úteis contados do efetivo recebimento dos respectivos recursos, observadas as deduções expressamente permitidas por este instrumento.
      </Clause>

      <Clause>
        10.2.3.2. VENDA PARCELADA. Sendo a nova alienação realizada mediante pagamento parcelado, o CEDENTE poderá efetuar os repasses ao(à) CESSIONÁRIO(A) de forma proporcional aos valores efetivamente recebidos do novo adquirente, no prazo máximo de 15 (quinze) dias úteis após cada recebimento.
      </Clause>

      <Clause>
        <strong>10.2.3.3. PRAZO MÁXIMO DE RESTITUIÇÃO. Independentemente da realização ou não da nova venda, o saldo restitutível integralmente apurado deverá ser pago pelo CEDENTE ao(à) CESSIONÁRIO(A) no prazo máximo de 12 (doze) meses contados da efetiva restituição da posse ao CEDENTE.</strong>
      </Clause>

      <Clause>
        § 1º. A existência de negociação, anúncio, proposta ou expectativa de venda não prorrogará o prazo máximo previsto nesta Cláusula.
      </Clause>

      <Clause>
        § 2º. Caso, ao final do prazo previsto no caput, ainda exista saldo não restituído, o CEDENTE deverá quitá-lo com recursos próprios, sem prejuízo do direito de prosseguir com a comercialização do imóvel posteriormente.
      </Clause>

      <Clause>
        10.2.3.4. PRESTAÇÃO DE CONTAS. Por ocasião de cada repasse e, obrigatoriamente, na data de quitação do saldo, o CEDENTE entregará ao(à) CESSIONÁRIO(A) demonstrativo escrito contendo:
        <br />
        (a) o valor total efetivamente pago durante a vigência do contrato;
        <br />
        (b) o valor correspondente à retenção de 20% (vinte por cento);
        <br />
        (c) o saldo líquido inicialmente apurado para restituição;
        <br />
        (d) o valor da nova alienação, quando realizada;
        <br />
        (e) os valores efetivamente recebidos do novo adquirente;
        <br />
        (f) a discriminação individualizada de despesas deduzidas;
        <br />
        (g) os respectivos comprovantes, quando exigidos pelo(a) CESSIONÁRIO(A); e
        <br />
        (h) o valor efetivamente repassado e o saldo remanescente, se houver.
      </Clause>

      <Clause>
        10.2.3.5. INSUFICIÊNCIA OU EXCEDENTE DO PRODUTO DA NOVA VENDA.
      </Clause>

      <Clause>
        § 1º. O direito do(a) CESSIONÁRIO(A) à restituição decorre do saldo contratualmente apurado e não do preço obtido pelo CEDENTE na futura alienação.
      </Clause>

      <Clause>
        § 2º. Caso o produto líquido da nova alienação seja inferior ao saldo contratualmente devido ao(à) CESSIONÁRIO(A), o CEDENTE continuará responsável pelo pagamento da diferença, observado o prazo máximo estabelecido na Cláusula 10.2.3.3.
      </Clause>

      <Clause>
        § 3º. Caso o produto líquido da nova alienação seja superior ao saldo devido ao(à) CESSIONÁRIO(A), o excedente pertencerá ao CEDENTE, desde que a alienação tenha observado os critérios objetivos de mercado previstos nesta Cláusula e não tenha ocorrido fraude, simulação ou subavaliação deliberada.
      </Clause>

      <Clause>
        10.2.4. Havendo pluralidade de cessionários, a resolução da parcela ou da posição contratual de um deles não afetará, por si só, a relação jurídica relativa aos demais, desde que as obrigações e os direitos de cada posição contratual sejam autônomos e individualizáveis.
      </Clause>

      <Clause>
        10.3. DA RESPONSABILIDADE DO CEDENTE POR DECLARAÇÃO FALSA, FRAUDE OU OMISSÃO DELIBERADA. Caso se comprove que, na data da assinatura deste instrumento, o CEDENTE:
        <br />
        (a) prestou declaração materialmente falsa sobre fato relevante de seu conhecimento;
        <br />
        (b) omitiu deliberadamente informação relevante sobre cessão anterior, oneração, constrição, oposição ou reivindicação de terceiro de que tivesse conhecimento;
        <br />
        (c) realizou cessão duplicada ou incompatível da mesma posse; ou
        <br />
        (d) praticou ato doloso ou fraudulento destinado a induzir o(a)(s) CESSIONÁRIO(A)(S) em erro quanto à situação possessória objeto deste contrato,
        <br />
        o(a)(s) CESSIONÁRIO(A)(S) poderá(ão) requerer a resolução do contrato, fazendo jus à restituição integral e monetariamente atualizada dos valores efetivamente pagos, acrescida da indenização pelas benfeitorias indenizáveis comprovadamente realizadas, observado o regime contratual previsto neste instrumento e a legislação aplicável.
      </Clause>

      <Clause>
        10.3.1. A mera existência ou posterior descoberta de oposição, reivindicação, pretensão ou direito de terceiro que não fosse do conhecimento do CEDENTE na data da assinatura e que não tenha sido deliberadamente ocultado não caracterizará, por si só, inadimplemento ou culpa contratual do CEDENTE, devendo o fato ser apurado quanto à sua origem, anterioridade, conhecimento e imputabilidade.
      </Clause>

      <Clause>
        § 1º. Nas hipóteses deste item, serão aplicadas, conforme o caso, as regras de alocação de risco, impossibilidade de regularização e perda da posse previstas neste instrumento.
      </Clause>

      <Clause>
        10.3.2. A responsabilidade prevista na Cláusula 10.3 não exclui outros direitos legalmente assegurados quando houver dolo ou fraude comprovados.
      </Clause>

      <Clause>
        § 1º. Na ausência de dolo ou fraude, as consequências indenizatórias observarão a extensão efetivamente comprovada do dano e não haverá cumulação de penalidades com idêntica finalidade.
      </Clause>

      <Clause>
        § 2º. Havendo dolo, fraude, cessão duplicada ou ocultação deliberada, a multa prevista na Cláusula 10.3.3 poderá coexistir com perdas e danos suplementares quando estes forem expressamente comprovados e não estiverem abrangidos pela própria multa, observada a legislação civil aplicável.
      </Clause>

      <Clause>
        10.3.3. Comprovado dolo, fraude, cessão duplicada ou ocultação deliberada nas hipóteses previstas na Cláusula 10.3, será devida ao(à)(s) CESSIONÁRIO(A)(S), além da restituição integral e corrigida dos valores pagos e das benfeitorias indenizáveis cabíveis, multa penal de 10% (dez por cento) sobre o valor total nominal do contrato, sem prejuízo de perdas e danos suplementares comprovados quando juridicamente cabíveis.
      </Clause>

      <Clause>
        10.3.4. PERDA DA POSSE E EVICÇÃO. Caso o(a)(s) CESSIONÁRIO(A)(S) venha(m) a perder total ou parcialmente a posse do imóvel em razão de decisão judicial ou administrativa que reconheça direito anterior de terceiro, a responsabilidade do CEDENTE será determinada de acordo com a origem, anterioridade, conhecimento e imputabilidade do fato.
        <br />
        (a) Se a perda decorrer de fato, ato, omissão, cessão anterior, oneração, falsidade, fraude ou declaração materialmente falsa imputável ao CEDENTE, serão aplicáveis os direitos de resolução, restituição integral e corrigida dos valores pagos, indenização pelas benfeitorias indenizáveis e, quando cabível, a multa penal prevista nas Cláusulas 10.3.2 e 10.3.3.
        <br />
        (b) Se a perda decorrer de direito anterior de terceiro que não fosse conhecido do CEDENTE e que não tenha sido deliberadamente ocultado, não haverá, por esse único fato, presunção de culpa do CEDENTE, sendo assegurada ao(à)(s) CESSIONÁRIO(A)(S), conforme o caso e a natureza jurídica do evento, a restituição integral e corrigida dos valores pagos e o tratamento contratual aplicável à impossibilidade de manutenção da relação.
        <br />
        (c) Em qualquer hipótese de perda parcial, a extensão da restituição, das indenizações e das demais consequências deverá observar a proporção efetivamente atingida, salvo quando a parcela remanescente se mostrar economicamente ou juridicamente inútil ao objeto contratual.
      </Clause>

      <Clause>
        10.4. ALTERNATIVAMENTE À RESOLUÇÃO, o CEDENTE poderá promover a cobrança judicial das obrigações pecuniárias certas, líquidas e exigíveis, desde que permaneça vigente o contrato e que a cobrança não corresponda ao mesmo fundamento econômico já compensado por cláusula penal de resolução.
      </Clause>

      <Clause>
        § 1º. Na hipótese de cobrança judicial sem resolução, o(a) CESSIONÁRIO(A) responderá pelo principal atualizado, pelos encargos de mora previstos na Cláusula 9.1 e pelas despesas processuais e honorários advocatícios fixados judicialmente, na forma da legislação processual.
      </Clause>

      <Clause>
        § 2º. Este instrumento poderá ser utilizado como título executivo extrajudicial quando, na forma definitiva e consideradas as formalidades legalmente exigidas, estiverem presentes os requisitos de certeza, liquidez e exigibilidade da obrigação e os requisitos formais previstos no Código de Processo Civil.
      </Clause>

      <Clause>
        10.5. Em qualquer hipótese de resolução, os valores comprovadamente pagos pelo CEDENTE para quitar débitos anteriores à imissão na posse do(a) CESSIONÁRIO(A), quando contratualmente atribuídos ao(à) CESSIONÁRIO(A) e documentalmente comprovados, poderão ser compensados ou excluídos do saldo restituível na exata medida em que este instrumento assim estabelecer, vedada, em qualquer hipótese, a compensação em duplicidade.
      </Clause>

      <Clause>
        Parágrafo único. Sempre que houver exclusão, compensação ou dedução de valores, o CEDENTE deverá apresentar documentação idônea que demonstre a origem, o valor e a efetiva utilização do montante.
      </Clause>

      {/* CAPÍTULO XI */}
      <SectionTitle>
        CAPÍTULO XI – DA EVICÇÃO, DA PERDA DA POSSE E DA VERACIDADE DAS DECLARAÇÕES DO CEDENTE
      </SectionTitle>

      <Clause>
        11.1. O CEDENTE responderá, nos limites deste instrumento e da legislação aplicável, pelas consequências decorrentes da perda da posse quando esta tiver origem em fato, ato, omissão, cessão anterior, oneração, declaração materialmente falsa, fraude ou outro comportamento juridicamente imputável ao CEDENTE.
      </Clause>

      <Clause>
        § 1º. A responsabilidade do CEDENTE será aferida considerando-se, entre outros elementos:
        <br />
        (a) a anterioridade do direito ou fato em relação à assinatura;
        <br />
        (b) o conhecimento efetivo ou razoavelmente exigível do CEDENTE;
        <br />
        (c) a existência de comunicação prévia ao CEDENTE;
        <br />
        (d) a eventual omissão deliberada de informação relevante; e
        <br />
        (e) o nexo entre o fato e a perda total ou parcial da posse.
      </Clause>

      <Clause>
        11.1.1. A perda total ou parcial da posse decorrente de direito anterior de terceiro que não fosse conhecido do CEDENTE na data da assinatura e que não tenha sido por ele deliberadamente ocultado não caracterizará, isoladamente, inadimplemento contratual ou culpa do CEDENTE.
      </Clause>

      <Clause>
        Parágrafo único. Nessa hipótese, serão observadas as regras deste instrumento relativas à impossibilidade de regularização, à perda da posse e à resolução, conforme a causa e os efeitos concretamente verificados.
      </Clause>

      <Clause>
        11.1.2. A simples existência de herdeiro, sucessor, titular registral ou terceiro que posteriormente apresente pretensão, oposição ou reivindicação sobre o imóvel não implicará automaticamente responsabilidade indenizatória do CEDENTE.
      </Clause>

      <Clause>
        Parágrafo único. Deverão ser apuradas a origem da pretensão, sua anterioridade, a ciência do CEDENTE, eventual omissão deliberada e o nexo causal entre o fato e a perda ou restrição efetivamente suportada pelo(a)(s) CESSIONÁRIO(A)(S).
      </Clause>

      <Clause>
        11.1.3. Nas hipóteses em que a perda da posse não decorrer de dolo, fraude, cessão duplicada ou ocultação deliberada do CEDENTE, eventual responsabilidade deste será limitada às consequências expressamente previstas neste instrumento e à extensão efetivamente demonstrada do prejuízo, vedada a cumulação de múltiplas penalidades destinadas a compensar o mesmo dano.
      </Clause>

      <Clause>
        11.1.4. A existência de procedimento de usucapião, REURB, regularização administrativa, ação judicial ou qualquer outro mecanismo de reconhecimento ou regularização do direito possessório não constitui garantia de resultado por parte do CEDENTE.
      </Clause>

      <Clause>
        Parágrafo único. As obrigações do CEDENTE relacionadas à cooperação, entrega de documentos, prestação de informações ou prática de atos necessários serão de meio, salvo quando este instrumento expressamente estabelecer obrigação de resultado determinada e juridicamente possível.
      </Clause>

      <Clause>
        11.1.5. O CEDENTE obriga-se a comunicar ao(à)(s) CESSIONÁRIO(A)(S), no prazo máximo de 10 (dez) dias corridos contados da ciência, qualquer notificação, ação judicial, reivindicação, oposição, embargo, constrição ou pretensão formal de terceiro relacionada à posse objeto deste instrumento, quando conhecida durante a vigência contratual.
      </Clause>

      <Clause>
        11.2. DA RESPONSABILIDADE POR PERDA DA POSSE E DA EVENTUAL EVICÇÃO. As partes reconhecem que o objeto deste instrumento é a cessão de direitos possessórios, de modo que eventual aplicação do regime jurídico da evicção deverá ser compatibilizada com a natureza possessória da relação e com a causa concreta da perda da posse.
      </Clause>

      <Clause>
        § 1º. Quando juridicamente caracterizada hipótese de evicção ou de perda de direito com fundamento no regime legal aplicável, serão observadas as disposições dos arts. 447 a 457 do Código Civil naquilo que forem compatíveis com a natureza do negócio celebrado e sem prejuízo da disciplina contratual específica estabelecida neste Capítulo.
      </Clause>

      <Clause>
        § 2º. A eventual regularização futura da situação possessória, inclusive por usucapião ou REURB, não exclui nem cria automaticamente responsabilidade do CEDENTE; a responsabilidade será determinada conforme a causa concreta do prejuízo e as disposições deste instrumento.
      </Clause>

      <Clause>
        § 3º. Havendo decisão definitiva que reconheça direito anterior de terceiro e provoque perda total ou substancial da posse, serão aplicadas, conforme o caso, as consequências previstas na Cláusula 10.3.4.
      </Clause>

      <Clause>
        11.3. COOPERAÇÃO E MITIGAÇÃO DO PREJUÍZO. Verificada ameaça concreta de perda da posse ou de restrição relevante ao exercício possessório, as partes deverão cooperar de boa-fé para a preservação de direitos, produção de provas, obtenção de documentos e adoção de medidas administrativas ou judiciais razoáveis.
      </Clause>

      <Clause>
        § 1º. Nenhuma das partes poderá, deliberadamente, agravar o prejuízo ou criar obstáculos artificiais à defesa dos direitos envolvidos.
      </Clause>

      <Clause>
        § 2º. As despesas extraordinárias decorrentes de medidas de defesa somente serão imputadas a uma das partes quando houver previsão contratual específica, ato de responsabilidade comprovada ou determinação legal ou judicial.
      </Clause>

      <Clause>
        11.4. DECLARAÇÕES E RESPONSABILIDADE PELA VERACIDADE. O CEDENTE declara, sob sua responsabilidade, que as informações e documentos por ele fornecidos relacionados à posse são verdadeiros segundo seu conhecimento e que não omitirá deliberadamente fato relevante de que tenha ciência e que possa influenciar a aquisição ou o exercício dos direitos possessórios objeto deste instrumento.
      </Clause>

      <Clause>
        Parágrafo único. A responsabilidade prevista nesta Cláusula não alcança fatos futuros ou fatos de terceiro desconhecidos do CEDENTE, salvo quando houver prova de que o CEDENTE deles tinha conhecimento ou concorreu para sua ocorrência.
      </Clause>

      <Clause>
        11.5. As disposições deste Capítulo deverão ser interpretadas em conjunto com os princípios da boa-fé objetiva, cooperação, equilíbrio contratual, conservação dos negócios jurídicos e vedação ao enriquecimento sem causa, sempre preservando a finalidade econômica lícita do instrumento e a reparação proporcional ao dano efetivamente demonstrado.
      </Clause>

      {/* CAPÍTULO XII */}
      <SectionTitle>CAPÍTULO XII – DO CASO FORTUITO E DA FORÇA MAIOR</SectionTitle>

      <Clause>
        12.1. Nenhuma das partes responderá por descumprimento de obrigação decorrente de caso fortuito ou força maior, assim entendido o fato necessário, imprevisível ou inevitável, cujos efeitos não era possível evitar ou impedir, nos termos do art. 393 do Código Civil, não se caracterizando como tal a paralisação do processo de regularização fundiária decorrente de omissão, documento incorreto, irregularidade ou inadimplemento imputável a qualquer das partes. Configurado o caso fortuito ou força maior, nos termos acima, este poderá decorrer, exemplificativamente, de decisão administrativa ou judicial superveniente não provocada pelas partes, calamidade pública ou determinação de autoridade competente.
      </Clause>

      <Clause>
        12.2. Verificado o evento de força maior, os prazos deste instrumento ficarão suspensos pelo tempo correspondente, devendo a parte impedida comunicar o fato à outra por escrito, no prazo de 10 (dez) dias a contar de seu conhecimento.
      </Clause>

      {/* CAPÍTULO XIII */}
      <SectionTitle>CAPÍTULO XIII – DA PROTEÇÃO DE DADOS PESSOAIS</SectionTitle>

      <Clause>
        13.1. Os dados pessoais das partes e testemunhas constantes deste instrumento serão tratados exclusivamente para fins de formalização, execução, registro e eventual defesa de direitos relacionados a este contrato, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais).
      </Clause>

      <Clause>
        13.2. As partes comprometem-se a manter sigilo sobre os dados pessoais uns dos outros a que tiverem acesso em razão deste contrato, não os utilizando para finalidade diversa nem os compartilhando com terceiros sem autorização ou amparo legal, ressalvado o compartilhamento necessário à execução deste contrato, inclusive com a Prefeitura Municipal, o Cartório de Registro de Imóveis, o Tabelionato de Notas, profissionais habilitados, a câmara ou o(s) árbitro(s) escolhidos e advogados das partes.
      </Clause>

      <Clause>
        13.3. Para os fins da Lei nº 13.709/2018, cada parte é responsável pelo tratamento de dados pessoais que realizar por decisão própria quanto às finalidades e aos meios do tratamento, figurando o CEDENTE como controlador dos dados pessoais cujo tratamento ele efetivamente decida, em regra os necessários à execução deste contrato e ao cumprimento de obrigação legal ou regulatória (art. 7º, incisos II e V, da referida Lei). Os dados serão conservados pelo prazo necessário ao cumprimento das obrigações contratuais, fiscais e de eventual defesa em processo judicial, administrativo ou arbitral, observados os prazos prescricionais aplicáveis.
      </Clause>

      <Clause>
        13.4. O titular dos dados pode exercer, mediante solicitação ao CEDENTE pelos meios de contato informados na Cláusula 1, os direitos previstos no art. 18 da Lei nº 13.709/2018, incluindo confirmação de tratamento, acesso, correção, anonimização ou eliminação de dados desnecessários ou tratados em desconformidade com a lei, observadas as hipóteses de retenção legítima de dados previstas na própria Lei.
      </Clause>

      {/* CAPÍTULO XIV */}
      <SectionTitle>CAPÍTULO XIV – DA MEDIAÇÃO, DA ARBITRAGEM E DO FORO</SectionTitle>

      <Clause>
        14.1. As partes elegem, como forma preferencial de solução de controvérsias relativas a este contrato, a mediação, a ser conduzida por mediador ou câmara de mediação de escolha consensual, no prazo de até 30 (trinta) dias a contar da notificação da controvérsia, sem prejuízo da adoção imediata, por qualquer das partes, das medidas judiciais ou arbitrais de urgência cabíveis, quando necessárias para evitar dano grave ou de difícil reparação.
      </Clause>

      <Clause>
        14.2. Não solucionado o conflito pela mediação, as partes poderão convencionar, mediante compromisso arbitral específico, a submissão do litígio à arbitragem, nos termos da Lei nº 9.307/1996, hipótese em que deverão ser definidos, no respectivo compromisso: a câmara arbitral escolhida, o número de árbitros, a forma de custeio das despesas arbitrais e o direito aplicável.
      </Clause>

      <Clause>
        <strong>14.3. Não havendo consenso quanto à arbitragem, ou nas hipóteses em que a lei exija a via judicial, fica eleito o foro da Comarca de Itatiaia/RJ (município de situação do imóvel, conforme Cláusulas 2.2 e 3.1) para dirimir quaisquer questões oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</strong>
      </Clause>

      {/* CAPÍTULO XV */}
      <SectionTitle>CAPÍTULO XV – DAS CUSTAS E HONORÁRIOS EM CASO DE LITÍGIO</SectionTitle>

      <Clause>
        15.1. As custas processuais e os honorários advocatícios, em qualquer demanda judicial relativa a este contrato, serão suportados pela parte vencida, na proporção de seu decaimento, nos termos da legislação processual aplicável. Na arbitragem, as despesas, custas e honorários observarão a convenção arbitral, o regulamento da instituição escolhida e a decisão do tribunal arbitral, não se aplicando atribuição prévia e automática de responsabilidade a qualquer das partes independentemente do resultado do litígio.
      </Clause>

      {/* CAPÍTULO XVI */}
      <SectionTitle>CAPÍTULO XVI – DA ASSINATURA ELETRÔNICA E DA ATUALIZAÇÃO CADASTRAL</SectionTitle>

      <Clause>
        16.1. As partes reconhecem, desde já, a validade jurídica, a autenticidade e a força probante da assinatura eletrônica aposta a este instrumento, quando firmado por meio de plataforma de assinatura eletrônica de escolha das partes (ex.: <DataTag text="PLATAFORMA DE ASSINATURA" field="plataformaAssinatura" />), nos termos do art. 10, §2º, da Medida Provisória nº 2.200-2/2001, e da Lei nº 14.063/2020, sendo dispensado o reconhecimento de firma em cartório para a validade entre as partes.
      </Clause>

      <Clause>
        16.2. Consideram-se válidas, para fins de celebração e prova deste contrato entre as partes, as assinaturas eletrônicas nas modalidades simples, avançada ou qualificada (certificado ICP-Brasil), sem prejuízo de exigências adicionais de forma que o Registro de Imóveis, o Tabelionato de Notas ou outro órgão competente venham a exigir para os atos de sua respectiva competência, sendo de responsabilidade exclusiva de cada parte a guarda de suas credenciais de acesso à plataforma escolhida, bem como a conferência dos dados do documento antes de assinar.
      </Clause>

      <Clause>
        16.3. Caso este instrumento, ou a cessão de posse nele formalizada, precise ser levado a registro em Cartório de Registro de Imóveis ou de Títulos e Documentos, ou submetido a exigência de reconhecimento de firma por órgão público, as partes comprometem-se a comparecer perante tabelião, quando solicitadas, para as formalidades adicionais eventualmente exigidas, sem que isso afete a validade e a eficácia do contrato já firmado eletronicamente entre elas.
      </Clause>

      <Clause>
        16.4. Cada parte declara e se obriga a manter atualizados, durante toda a vigência deste contrato e até a quitação integral das obrigações dele decorrentes, o endereço de e-mail, o número de telefone/WhatsApp e o endereço residencial informados na Cláusula 1, comunicando à outra parte, por escrito, qualquer alteração no prazo de até 10 (dez) dias contados da mudança.
      </Clause>

      <Clause>
        16.5. Toda comunicação, notificação, cobrança ou aviso previsto neste contrato poderá ser validamente realizado por e-mail ou por mensagem de texto/aplicativo de mensagens (WhatsApp ou similar) dirigido ao endereço eletrônico e ao número de telefone informados na Cláusula 1 ou posteriormente atualizados na forma da Cláusula 16.4, presumindo-se recebida a comunicação, para fins meramente informativos ou de rotina: (a) em se tratando de e-mail, na data de seu envio, salvo prova de erro de transmissão apresentada pelo destinatário; e (b) em se tratando de mensagem por aplicativo, no momento em que exibido o status de entrega/leitura ou equivalente pela plataforma utilizada. Para a constituição em mora (Cláusula 9.2), a notificação de rescisão ou distrato (Capítulo X) e a comunicação de instauração de procedimento arbitral, exige-se comprovação objetiva do efetivo recebimento pelo destinatário, não bastando a presunção prevista nesta Cláusula.
      </Clause>

      <Clause>
        16.6. A parte que deixar de atualizar seus dados de contato na forma da Cláusula 16.4 não poderá alegar, em seu benefício, desconhecimento de comunicação enviada aos dados anteriormente informados, presumindo-se válida e eficaz a notificação assim realizada.
      </Clause>

      {/* CAPÍTULO XVII */}
      <SectionTitle>CAPÍTULO XVII – DISPOSIÇÕES GERAIS</SectionTitle>

      <Clause>
        <strong>17.1. DA VIGÊNCIA, DO CUMPRIMENTO E DA SOBREVIVÊNCIA DAS OBRIGAÇÕES.</strong> Este contrato entra em vigor na data de sua assinatura e permanecerá vigente até o cumprimento integral ou a extinção das obrigações dele decorrentes, observados, conforme o caso, a quitação integral do preço, o cumprimento das obrigações de cooperação e das providências necessárias à regularização da situação possessória ou à adoção da via juridicamente cabível.
      </Clause>

      <Clause>
        § 1º. A tramitação, demora ou pendência de procedimento perante órgão público, serventia extrajudicial, profissional habilitado ou terceiro não vinculado às partes não constituirá, por si só, inadimplemento nem manterá indefinidamente obrigações já integralmente cumpridas, sem prejuízo daquelas que ainda dependerem de ato ou cooperação de responsabilidade de qualquer das partes.
      </Clause>

      <Clause>
        § 2º. Permanecerão vigentes, após o cumprimento ou extinção das obrigações principais, pelo período necessário à sua satisfação e nos limites de sua natureza, as obrigações relativas à restituição de valores, indenizações, responsabilidade por perda da posse ou evicção, tributos e encargos pretéritos, prestação de contas, guarda e disponibilização de documentos, proteção de dados, solução de controvérsias e demais obrigações que, por sua natureza ou por expressa previsão contratual, devam subsistir.
      </Clause>

      <Clause>
        § 3º. A vigência deste contrato não constitui garantia de deferimento, aprovação, registro, reconhecimento de propriedade ou conclusão de procedimento de usucapião, REURB ou outra modalidade de regularização cuja decisão dependa de autoridade pública, serventia, profissional legalmente habilitado ou terceiro.
      </Clause>

      <Clause>
        <strong>17.2. DA BOA-FÉ, DA PROBIDADE, DA FUNÇÃO SOCIAL E DA COOPERAÇÃO.</strong> As partes obrigam-se a executar este contrato de acordo com os princípios da boa-fé objetiva, da probidade e da função social do contrato, nos termos dos arts. 421 e 422 do Código Civil, adotando comportamento leal, transparente e cooperativo durante toda a relação contratual.
      </Clause>

      <Clause>
        Parágrafo único. O dever de cooperação compreende, conforme a responsabilidade de cada parte, a prestação tempestiva de informações, entrega de documentos, comparecimento a atos necessários, comunicação de fatos relevantes e adoção de medidas razoáveis para evitar ou reduzir prejuízos relacionados ao objeto deste contrato, vedada a criação deliberada de obstáculos ao seu cumprimento ou à regularização da situação possessória.
      </Clause>

      <Clause>
        <strong>17.3. DA INTERPRETAÇÃO E DAS CLÁUSULAS DE DESTAQUE.</strong> Este instrumento decorre da negociação e adaptação das partes às condições específicas do imóvel, da situação possessória e da operação contratada, devendo suas disposições ser interpretadas de acordo com a intenção negocial manifestada, a boa-fé, a natureza do negócio e as regras previstas na legislação civil, especialmente nos arts. 112 e 113 do Código Civil.
      </Clause>

      <Clause>
        § 1º. Em caso de aparente divergência entre disposição geral e disposição específica, prevalecerá a disposição específica quanto ao fato, obrigação, despesa, risco ou procedimento por ela diretamente disciplinado, sem prejuízo da interpretação sistemática do contrato.
      </Clause>

      <Clause>
        § 2º. Permanecerão graficamente destacadas na versão final do instrumento as cláusulas que estabeleçam limitação relevante de direitos, retenção ou perda de valores, cláusula penal, alocação especial de riscos, obrigações extraordinárias, hipóteses de resolução ou eleição de foro, de modo a assegurar sua visualização e ciência antes da assinatura.
      </Clause>

      <Clause>
        § 3º. O destaque gráfico não importa renúncia a direito indisponível, não impede o controle de validade ou eficácia pelas autoridades competentes e não afasta a aplicação de normas cogentes.
      </Clause>

      <Clause>
        <strong>17.4. DA VINCULAÇÃO DAS PARTES E DOS SUCESSORES.</strong> Este instrumento obriga as partes, seus herdeiros e sucessores, na medida em que os direitos e obrigações nele previstos sejam transmissíveis, observados a natureza da obrigação, os limites da sucessão e a legislação aplicável.
      </Clause>

      <Clause>
        Parágrafo único. As obrigações de caráter personalíssimo ou que, por disposição legal ou natureza jurídica, não sejam transmissíveis não se estenderão automaticamente aos sucessores.
      </Clause>

      <Clause>
        <strong>17.5. DAS ALTERAÇÕES, DOS ADITIVOS E DAS ATUALIZAÇÕES DOCUMENTAIS.</strong> Qualquer alteração que modifique o objeto, preço, forma de pagamento, direitos, obrigações, responsabilidades, garantias, penalidades, alocação de riscos, hipóteses de resolução ou outro elemento material deste contrato somente será válida se formalizada por escrito, mediante termo aditivo assinado por todas as partes cuja posição jurídica seja afetada.
      </Clause>

      <Clause>
        § 1º. A substituição ou atualização de certidões, comprovantes, documentos técnicos, relatórios, protocolos ou outros documentos que não alterem direitos ou obrigações materiais poderá ser realizada por termo de atualização ou protocolo documental, desde que identificado o documento, sua data, versão, finalidade e vinculação ao presente contrato.
      </Clause>

      <Clause>
        § 2º. Nenhuma atualização de anexo poderá alterar unilateralmente o conteúdo material deste contrato ou substituir obrigação estabelecida em termo aditivo regularmente celebrado.
      </Clause>

      <Clause>
        <strong>17.6. DA TOLERÂNCIA E DA AUSÊNCIA DE RENÚNCIA.</strong> A eventual tolerância de qualquer das partes quanto ao descumprimento ou cumprimento imperfeito de qualquer disposição deste contrato não constituirá novação, alteração contratual, renúncia, remissão ou precedente obrigatório, salvo manifestação expressa e escrita em sentido diverso.
      </Clause>

      <Clause>
        Parágrafo único. A aceitação pontual de pagamento, documento, prazo ou providência em condições diversas das originalmente previstas não impedirá a exigência futura das demais obrigações contratuais, ressalvados os direitos que tenham sido validamente modificados por escrito.
      </Clause>

      <Clause>
        <strong>17.7. DA NULIDADE OU INEFICÁCIA PARCIAL.</strong> Caso qualquer disposição deste instrumento seja declarada nula, inválida, inexigível ou ineficaz, total ou parcialmente, por decisão judicial, arbitral ou determinação de autoridade competente, as demais disposições permanecerão válidas e eficazes na máxima extensão admitida pela legislação.
      </Clause>

      <Clause>
        Parágrafo único. As partes buscarão, de boa-fé, substituir a disposição afetada por outra juridicamente válida que preserve, tanto quanto possível, sua finalidade econômica e jurídica, sem reproduzir o vício que tenha determinado sua invalidação, permanecendo aplicável, na ausência de substituição válida, a disciplina legal pertinente.
      </Clause>

      <Clause>
        <strong>17.8. DOS ANEXOS E DA INTEGRAÇÃO DOCUMENTAL.</strong> Integram este contrato, para todos os fins, os anexos expressamente identificados neste instrumento, observada a seguinte classificação:
        <br /><br />
        <strong>Anexo I – Documentação do regime de bens, estado civil e anuências do CEDENTE</strong>, quando juridicamente pertinentes;<br />
        <strong>Anexo II – Documentação imobiliária, fiscal, registral e de diligência</strong>, incluindo certidão atualizada da matrícula perante o Cartório de Registro de Imóveis, certidões fiscais e negativas imobiliárias;<br />
        <strong>Anexo III – Documentação da origem e da cadeia possessória</strong>, contendo os elementos disponíveis relativos ao início, continuidade, natureza, exercício e transmissão da posse, com identificação dos respectivos possuidores e períodos;<br />
        <strong>Anexo IV – Documentação da regularização</strong>, compreendendo, conforme o procedimento adotado, documentos de análise de viabilidade, usucapião, REURB, requerimentos, plantas, memoriais, atas notariais, protocolos, exigências, decisões e demais atos administrativos, notariais, registrais ou técnicos produzidos durante a execução contratual.
      </Clause>

      <Clause>
        § 1º. Os anexos obrigatórios para a celebração (Anexos I, II e III) deverão estar disponíveis, identificados e vinculados ao instrumento na data da celebração, não sendo admissível deixar em aberto seu conteúdo material essencial.
      </Clause>

      <Clause>
        § 2º. Os documentos produzidos posteriormente serão incorporados ao Anexo IV por termo de atualização, protocolo documental ou mecanismo eletrônico equivalente que permita identificar o documento, sua data, versão e relação com o procedimento correspondente.
      </Clause>

      <Clause>
        § 3º. A ausência de documento exigido pela legislação, autoridade, serventia ou profissional competente não será suprida pela simples previsão desta cláusula, devendo ser obtido o documento ou adotado o meio juridicamente admitido no caso concreto.
      </Clause>

      <Clause>
        <strong>17.9. DA CELEBRAÇÃO, DAS ASSINATURAS E DA FORÇA PROBATÓRIA.</strong> Este instrumento poderá ser celebrado em meio físico ou eletrônico, conforme a modalidade admitida pela legislação aplicável, produzindo efeitos entre os signatários a partir da conclusão válida de sua assinatura.
      </Clause>

      <Clause>
        § 1º. Na modalidade física, o instrumento será assinado pelas partes, pelo(a) cônjuge ou companheiro(a) anuente, quando aplicável, pela ASPPIBRA, na qualidade definida neste contrato, e por 3 (três) testemunhas, em 2 (duas) vias de igual teor e forma, para fins de reforço probatório e observância das formalidades pactuadas.
      </Clause>

      <Clause>
        § 2º. Na modalidade eletrônica, poderão ser utilizadas assinaturas eletrônicas admitidas pela legislação aplicável, observados os requisitos específicos do ato e eventuais exigências do órgão público, serventia extrajudicial, instituição financeira ou terceiro perante o qual o instrumento venha a ser apresentado.
      </Clause>

      <Clause>
        § 3º. A plataforma de assinatura eletrônica utilizada deverá, sempre que tecnicamente disponível, preservar a versão integral do documento, a identificação dos signatários, a data e hora da assinatura e as evidências de autoria e integridade, inclusive do documento e de seus anexos.
      </Clause>

      <Clause>
        § 4º. A assinatura eletrônica não dispensa eventual formalidade adicional exigida por lei ou pela autoridade competente para ato posterior, inclusive reconhecimento de firma, procuração, instrumento público, registro ou apresentação perante serventia extrajudicial.
      </Clause>

      <Clause>
        § 5º. A eventual força executiva deste instrumento dependerá do preenchimento dos requisitos legais aplicáveis ao título e da certeza, liquidez e exigibilidade da obrigação que se pretenda cobrar.
      </Clause>

      <Clause>
        <strong>17.10. DO RECONHECIMENTO DE FIRMA, DO REGISTRO EM TÍTULOS E DOCUMENTOS E DA APRESENTAÇÃO PERANTE TERCEIROS.</strong> Quando celebrado fisicamente, o reconhecimento de firma poderá ser realizado como medida adicional de segurança e comprovação de autoria, especialmente quando o instrumento for destinado à apresentação perante terceiros.
      </Clause>

      <Clause>
        § 1º. O instrumento poderá ser levado ao Registro de Títulos e Documentos quando juridicamente útil ou conveniente, inclusive para os efeitos que a legislação atribua a esse registro, sem que tal providência implique, por si só, transferência do domínio, constituição de direito real imobiliário, reconhecimento de usucapião ou substituição de ato que deva ser praticado no Registro de Imóveis.
      </Clause>

      <Clause>
        § 2º. O reconhecimento de firma, a autenticação, o registro em Títulos e Documentos ou a apresentação deste instrumento a qualquer serventia ou autoridade não constituem, por si sós, reconhecimento da propriedade, aprovação de REURB, reconhecimento de usucapião ou certificação da regularidade urbanística, ambiental, fiscal, possessória ou registral do imóvel.
      </Clause>

      <Clause>
        § 3º. Quando este instrumento for apresentado a órgão público, Registro de Imóveis, Tabelionato de Notas ou outra entidade competente, as partes comprometem-se a fornecer os documentos, assinaturas, reconhecimentos, procurações ou demais formalidades especificamente exigidos para o ato.
      </Clause>

      <Clause>
        § 4º. Nenhuma disposição deste capítulo será interpretada como renúncia antecipada à adoção de forma pública, registro, averbação, certificação, reconhecimento ou qualquer outra formalidade que seja legalmente exigível para determinado ato.
      </Clause>

      <Clause>
        § 5º. Este capítulo não altera a natureza jurídica da cessão de direitos possessórios estabelecida neste instrumento, não constitui transmissão de propriedade registral e não substitui qualquer requisito legal, técnico, administrativo, notarial ou registral exigível para a eventual regularização ou aquisição da propriedade.
      </Clause>

      {/* ENCERRAMENTO E ASSINATURAS */}
      <Box sx={{ mt: 5, mb: 3, textAlign: 'center' }}>
        <ABNTText indent={false} sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          <DataTag text="MUNICÍPIO DA ASSINATURA" field="municipioAssinatura" />,{' '}
          <DataTag text="DIA" field="diaAssinatura" /> de{' '}
          <DataTag text="MÊS" field="mesAssinatura" /> de{' '}
          <DataTag text="ANO" field="anoAssinatura" />.
        </ABNTText>
      </Box>

      {/* BLOCO DE ASSINATURAS DIGITAIS / ELETRÔNICAS */}
      <SectionTitle>ASSINATURAS E VALIDAÇÃO DIGITAL</SectionTitle>
      <Box
        sx={{
          mt: 2,
          mb: 4,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        <DigitalSignature
          title="CEDENTE"
          name={<DataTag text="NOME COMPLETO DO CEDENTE" field="cedenteNome" />}
          field="cedenteAssinatura"
          color="primary"
        />
        <DigitalSignature
          title="CESSIONÁRIO(A)"
          name={<DataTag text="NOME COMPLETO DO CESSIONÁRIO" field="cessionarioNome" />}
          field="cessionarioAssinatura"
          color="warning"
        />
        <DigitalSignature
          title="CÔNJUGE DO CEDENTE (outorgante/anuente)"
          name={<DataTag text="NOME DO CÔNJUGE DO CEDENTE" field="conjugeNome" />}
          field="conjugeAssinatura"
          color="info"
        />
        <DigitalSignature
          title="INTERVENIENTE ASPPIBRA"
          name="ASPPIBRA - Associação dos Proprietários e Posseiros"
          field="asppibraAssinatura"
          color="success"
        />
      </Box>

      {/* TESTEMUNHAS INSTRUMENTÁRIAS */}
      <SectionTitle>TESTEMUNHAS INSTRUMENTÁRIAS</SectionTitle>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
          gap: 2,
          mt: 2,
          mb: 4,
        }}
      >
        <DigitalSignature
          title="TESTEMUNHA 1"
          name={<DataTag text="NOME DA 1ª TESTEMUNHA" field="testemunha1Nome" />}
          field="testemunha1Assinatura"
          color="info"
        />
        <DigitalSignature
          title="TESTEMUNHA 2"
          name={<DataTag text="NOME DA 2ª TESTEMUNHA" field="testemunha2Nome" />}
          field="testemunha2Assinatura"
          color="info"
        />
        <DigitalSignature
          title="TESTEMUNHA 3"
          name={<DataTag text="NOME DA 3ª TESTEMUNHA" field="testemunha3Nome" />}
          field="testemunha3Assinatura"
          color="info"
        />
      </Box>
    </Box>
  );
}
