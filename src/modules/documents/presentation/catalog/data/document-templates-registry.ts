import type { DocumentRequest } from 'src/platform/tauri/contracts/document-contracts';

export type TemplateCategory = 'todos' | 'contratos' | 'financeiro' | 'territorial' | 'folhas_base';

export type DocumentTemplateItem = {
  id: string;
  title: string;
  subtitle: string;
  category: 'contratos' | 'financeiro' | 'territorial';
  badgeLabel: string;
  badgeColor: 'primary' | 'success' | 'info' | 'warning';
  scope: 'cockpit' | 'universal';
  description: string;
  pageCountApprox: string;
  actionUrl: string;
  actionLabel: string;
  sampleRequest: DocumentRequest;
  tags: string[];
};

export type BlankSheetItem = {
  id: string;
  title: string;
  standard: string;
  orientation: 'portrait' | 'landscape';
  dimensions: string;
  margins: string;
  description: string;
  icon: string;
  accentColor: string;
  actionUrl?: string;
  actionLabel?: string;
  sampleRequest: DocumentRequest;
};

// ----------------------------------------------------------------------
// 1. MODELOS DE FOLHAS E ESTRUTURAS DE PÁGINA PADRONIZADAS
// ----------------------------------------------------------------------

export const BLANK_SHEETS_REGISTRY: BlankSheetItem[] = [
  {
    id: 'sheet-abnt-portrait',
    title: 'Folha A4 ABNT Institucional',
    standard: '',
    orientation: 'portrait',
    dimensions: '210 × 297 mm (A4 Retrato)',
    margins: 'Sup: 0.9cm • Esq: 3.0cm • Dir: 2.0cm • Inf: 0.7cm',
    description:
      '.',
    icon: 'solar:document-bold',
    accentColor: '#00A76F',
    actionUrl: '/devos/cessao-posse',
    actionLabel: 'Usar Padrão ABNT',
    sampleRequest: {
      kind: 'cessao_posse',
      payload: {
        document_number: 'ABNT-NBR-14724/FOLHA-BASE',
        auth_code: '2026-ABNT-CANONICAL',
        data: {
          is_blank_sheet: true,
          sheet_title: 'FOLHA A4 ABNT INSTITUCIONAL (CANÔNICA)',
          contract_title: 'FOLHA A4 ABNT INSTITUCIONAL (CANÔNICA)',
          city: 'Maricá',
          state: 'RJ',
          date: '11 de novembro de 2026',
          total_area_m2: 1250,
          confrontations: {
            north: 'Margem ABNT Superior: 2.5cm',
            south: 'Margem ABNT Inferior: 2.2cm',
            east: 'Margem ABNT Direita: 2.0cm',
            west: 'Margem ABNT Esquerda (Encadernação): 3.0cm',
          },
          possession_history:
            'Estrutura canônica normatizada pela ABNT NBR 14724 e padronizada pela ASPPIBRA-DAO para instrumentos contratuais, minutas deliberativas e termos oficiais.',
          clauses: [
            'CLÁUSULA PRIMEIRA - DA GEOMETRIA: O presente documento adota o padrão internacional ISO 216 / ABNT NBR 14724 em formato A4 (210 mm x 297 mm), com orientação retrato.',
            'CLÁUSULA SEGUNDA - DAS MARGENS INSTITUCIONAIS: Margens rigorosamente fixadas em 3,0 cm à esquerda para encadernação em livro-tombo, 2,0 cm à direita, 2,5 cm superior e 2,2 cm inferior.',
            'CLÁUSULA TERCEIRA - DA INTEGRIDADE: Todo documento emitido sob esta folha gera um selo criptográfico SHA-256 e assinatura digital qualificada em conformidade com o Art. 10 §2º da Medida Provisória nº 2.200-2/2001.',
          ],
          parties: {
            assignor: {
              name: 'ASSOCIAÇÃO DOS PROPRIETÁRIOS E POSSEIROS DE IMÓVEIS NO BRASIL',
              document_id: '55.666.777/0001-88',
              marital_status: 'Pessoa Jurídica de Direito Privado',
              profession: 'Governança DAO',
              address: 'Avenida Central, 450, Centro, Maricá/RJ',
            },
            assignee: {
              name: 'ADMINISTRADOR DE SISTEMAS DEVOS COCKPIT',
              document_id: '00.000.000/0001-00',
              marital_status: 'Entidade Autônoma Descentralizada',
              profession: 'Operador de Nó Core',
              address: 'Rede Local P2P',
            },
          },
        },
      },
    },
  },
  {
    id: 'sheet-report-grid',
    title: 'Folha de Relatório Analítico',
    standard: '',
    orientation: 'portrait',
    dimensions: '210 × 297 mm (A4 Retrato)',
    margins: 'Sup: 1.0cm • Esq: 1.5cm • Dir: 1.5cm • Inf: 1.0cm',
    description:
      '.',
    icon: 'solar:chart-2-bold',
    accentColor: '#0284C7',
    actionUrl: '/devos/ledger',
    actionLabel: 'Usar Padrão de Relatório',
    sampleRequest: {
      kind: 'citizen_ledger',
      payload: {
        associate_id: 'FOLHA-GRID-ANALYTICS-A4',
        data: {
          meta: {
            generated_at: '11/11/2026',
            reference_period: '2026-11 (Estrutura Tabular A4)',
            audit_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          },
          associate: {
            id: 'GRID-HIGH-DENSITY',
            name: 'Padrão Oficial de Relatório Analítico de Alta Densidade',
            cpf: '000.000.000-00',
            email: 'auditoria@asppibra.org',
            avatar_letter: 'R',
            address_line1: 'Margens ABNT: Sup: 1.0cm • Inf: 1.0cm • Esq: 1.5cm • Dir: 1.5cm',
            address_line2: 'Capacidade Otimizada para Planilhas e Balancetes Contábeis',
          },
          summary: {
            total_contracted: '1.250.000,00',
            total_paid: '1.180.000,00',
            outstanding_balance: '70.000,00',
          },
          transactions: [
            {
              date: '11/11/2026',
              counterparty: 'Geometria A4 Retrato de Alta Densidade',
              origin: 'Margens Simétricas 1.5cm',
              destination: 'Linhas Compactas 9pt',
              amount: '100% Auditado',
              direction: 'inbound',
              status_label: 'ABNT Padronizado',
              status_variant: 'confirmed',
            },
            {
              date: '11/11/2026',
              counterparty: 'Typst Core Engine Compilation',
              origin: 'Memória Volátil Protegida',
              destination: 'Visualizador Interno DevOS',
              amount: 'Hash SHA-256',
              direction: 'inbound',
              status_label: 'Imutável',
              status_variant: 'confirmed',
            },
          ],
        },
      },
    },
  },
  {
    id: 'sheet-landscape-certificate',
    title: 'Termo / Certificado Paisagem',
    standard: '',
    orientation: 'landscape',
    dimensions: '297 × 210 mm (A4 Paisagem)',
    margins: 'Bordas simétricas de 2.0cm com moldura ornamental',
    description:
      '.',
    icon: 'solar:diploma-verified-bold',
    accentColor: '#D97706',
    actionUrl: '/devos/relatorios',
    actionLabel: 'Usar Padrão Paisagem',
    sampleRequest: {
      kind: 'real_estate_reconciliation',
      payload: {
        data: {
          batch_id: 'CERT-PAISAGEM-2026',
          generated_at: '11/11/2026',
          metrics: {
            total_records: 1,
            divergent_records: 0,
            reconciled_records: 1,
            reconciliation_rate: 100,
          },
          findings: [
            {
              id: 'GEOM-01',
              title: 'Estrutura A4 Paisagem (297 x 210 mm)',
              severity: 'INFO',
              description:
                'Formato oficial para certidões territoriais de reconhecimento de posse agroflorestal, titulações e termos de governança com moldura e selo criptográfico.',
            },
          ],
        },
      },
    },
  },
];

// ----------------------------------------------------------------------
// 2. MODELOS INSTITUCIONAIS PRONTOS COMPILADOS VIA TYPST
// ----------------------------------------------------------------------

export const DOCUMENT_TEMPLATES_REGISTRY: DocumentTemplateItem[] = [
  {
    id: 'template-cessao-posse',
    title: 'Contrato de Cessão de Posse',
    subtitle: 'Instrumento Particular de Cessão de Direitos Possessórios',
    category: 'contratos',
    badgeLabel: 'Exclusivo Admin / Cockpit',
    badgeColor: 'warning',
    scope: 'cockpit',
    description:
      '.',
    pageCountApprox: '4 a 6 páginas',
    actionUrl: '/devos/cessao-posse',
    actionLabel: 'Emitir Contrato',
    tags: [],
    sampleRequest: {
      kind: 'cessao_posse',
      payload: {
        document_number: '2026-MODELO/CP',
        auth_code: '2026-DEMO-CTRL',
        data: {
          cedenteNome: 'CARLOS EDUARDO SILVA (CEDENTE MODELO)',
          cedenteNacionalidade: 'Brasileiro',
          cedenteEstadoCivil: 'Casado',
          cedenteProfissao: 'Produtor Rural',
          cedenteRg: '12.345.678-9 SSP/RJ',
          cedenteCpf: '111.222.333-44',
          cedenteEndereco: 'Estrada Velha de Maricá, Km 12, Maricá/RJ',
          cessionarioNome: 'MARIA APARECIDA SANTOS (CESSIONÁRIA MODELO)',
          cessionarioNacionalidade: 'Brasileira',
          cessionarioEstadoCivil: 'Solteira',
          cessionarioProfissao: 'Engenheira Agrônoma',
          cessionarioRg: '98.765.432-1 DETRAN/RJ',
          cessionarioCpf: '555.666.777-88',
          cessionarioEndereco: 'Avenida Central, 450, Centro, Maricá/RJ',
          imovelDenominacao: 'Sítio Recanto das Águas • Lote 42',
          imovelLocalizacao: 'Distrito de Inoã, Município de Maricá/RJ',
          imovelAreaTotal: '15.000,00 m²',
          imovelConfrontacoes: 'Norte com Estrada Municipal; Sul com Córrego Limpo; Leste e Oeste com terras de posseiros vizinhos.',
          valorTotal: '180.000,00',
          formaPagamento: 'Entrada de R$ 50.000,00 via Pix e o restante em 24 parcelas com custódia em Livro-Razão comunitário.',
        },
      },
    },
  },
  {
    id: 'template-citizen-ledger',
    title: 'Extrato do Livro-Razão do Cidadão',
    subtitle: 'Demonstrativo Oficial de Contas e Participação Associativa',
    category: 'financeiro',
    badgeLabel: 'Universal (Node + Cockpit)',
    badgeColor: 'success',
    scope: 'universal',
    description:
      '.',
    pageCountApprox: '1 a 3 páginas',
    actionUrl: '/devos/ledger',
    actionLabel: 'Abrir Livro-Razão',
    tags: [],
    sampleRequest: {
      kind: 'citizen_ledger',
      payload: {
        associate_id: 'ASSOC-MODELO-01',
        data: {
          meta: {
            generated_at: '11/11/2026',
            reference_period: '2026-11',
            audit_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          },
          associate: {
            id: 'ASSOC-042',
            name: 'Cooperado Exemplar ASPPIBRA',
            cpf: '333.444.555-66',
            email: 'cooperado.exemplo@asppibra.org',
            avatar_letter: 'C',
            address_line1: 'Rua das Palmeiras, 100',
            address_line2: 'Bairro São José do Imbassaí, Maricá/RJ',
          },
          summary: {
            total_contracted: '45.000,00',
            total_paid: '32.500,00',
            outstanding_balance: '12.500,00',
          },
          transactions: [
            {
              date: '02/11/2026',
              counterparty: 'Tesouraria Central ASPPIBRA',
              origin: 'Banco Digital D1',
              destination: 'Fundo Comunitário Agro',
              amount: '1.250,00',
              direction: 'inbound',
              status_label: 'Confirmado',
              status_variant: 'confirmed',
            },
            {
              date: '28/10/2026',
              counterparty: 'Fornecedor de Sementes Maricá',
              origin: 'Conta Custódia',
              destination: 'Cooperativa Agroecológica',
              amount: '850,00',
              direction: 'outbound',
              status_label: 'Liquidado',
              status_variant: 'confirmed',
            },
          ],
        },
      },
    },
  },
  {
    id: 'template-invoice-bill',
    title: 'Fatura Associativa & Recibo (Invoice)',
    subtitle: 'Comprovante Formal de Quitação e Protocolo D1',
    category: 'financeiro',
    badgeLabel: 'Universal (Node + Cockpit)',
    badgeColor: 'success',
    scope: 'universal',
    description:
      '.',
    pageCountApprox: '1 página',
    actionUrl: '/devos/ledger',
    actionLabel: 'Ver Faturas',
    tags: [],
    sampleRequest: {
      kind: 'invoice_bill',
      payload: {
        id: 'FAT-2026-MODELO-88',
        member_name: 'Associado Participante Modelo',
        member_doc: '444.555.666-77',
        member_email: 'associado@asppibra.org',
        member_address: 'Rodovia Amaral Peixoto, Km 28, Maricá/RJ',
        description: 'Mensalidade de Infraestrutura DePIN e Custódia Comunitária',
        reference_month: '2026-11',
        amount: 350.0,
        due_date: '2026-11-20',
        settled_date: '2026-11-10',
        payment_method: 'Pix Instantâneo / D1 Ledger',
        status: 'paid',
        items: [
          {
            id: 'it-1',
            description: 'Taxa de Manutenção de Nó Validador DePIN',
            service: 'Infraestrutura',
            quantity: 1,
            price: 200.0,
            total: 200.0,
          },
          {
            id: 'it-2',
            description: 'Cota de Armazenamento Descentralizado IPFS',
            service: 'Armazenamento',
            quantity: 1,
            price: 150.0,
            total: 150.0,
          },
        ],
        taxes: 0.0,
        discount: 0.0,
        d1_protocol: 'D1-PROT-2026-889911-OK',
      },
    },
  },
  {
    id: 'template-real-estate-reconciliation',
    title: 'Relatório Analítico de Reconciliação Imobiliária',
    subtitle: 'Auditoria Territorial do Cadastro Imobiliário de Maricá/RJ',
    category: 'territorial',
    badgeLabel: 'Exclusivo Admin / Cockpit',
    badgeColor: 'warning',
    scope: 'cockpit',
    description:
      '.',
    pageCountApprox: '16 a 78 páginas',
    actionUrl: '/devos/cadastre',
    actionLabel: 'Abrir Banco Imobiliário',
    tags: [],
    sampleRequest: {
      kind: 'real_estate_reconciliation',
      payload: {
        data: {
          header: {
            title: 'RELATÓRIO OFICIAL DE RECONCILIAÇÃO TERRITORIAL',
            subtitle: 'Prefeitura Municipal de Maricá & ASPPIBRA • Base Cadastral Mapa5',
            generated_at: '11/11/2026 às 10:00:00 UTC',
            auditor: 'Controladoria do Cockpit Admin',
            version: '2.0.4 - Typst Engine',
          },
          metrics: {
            total_properties: 145756,
            total_batches: 12,
            total_findings: 34,
            reconciled_percentage: 98.4,
          },
          sample_rows: [
            {
              matricula: '12044',
              inscricao: '001.042.0089',
              bairro: 'CENTRO',
              logradouro: 'RUA RIBEIRO DE ALMEIDA',
              numero: '150',
              area_terreno: '450.00 m²',
              status: 'Reconciliado',
            },
            {
              matricula: '12045',
              inscricao: '001.042.0090',
              bairro: 'CENTRO',
              logradouro: 'RUA RIBEIRO DE ALMEIDA',
              numero: '162',
              area_terreno: '380.00 m²',
              status: 'Reconciliado',
            },
          ],
        },
      },
    },
  },
];

