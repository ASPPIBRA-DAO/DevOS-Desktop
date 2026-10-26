import { invokeNative, isTauriDesktop } from '../core/invoke';
import {
  type PropertySummary,
  type RealEstateStats,
  type XlsxPreviewReport,
  type ImportBatchSummary,
  type AuditFindingSummary,
  type ImportExecutionReport,
} from '../contracts/real-estate-contracts';

// Re-exportações de tipos para compatibilidade com consumidores existentes
export type {
  PropertySummary,
  RealEstateStats,
  XlsxPreviewReport,
  ImportBatchSummary,
  AuditFindingSummary,
  ImportExecutionReport,
};

// ----------------------------------------------------------------------
// MOCK / SANDBOX TERRITORIAL DE MARICÁ (ATIVO EXCLUSIVAMENTE NO NAVEGADOR WEB)
// ----------------------------------------------------------------------

const INITIAL_MOCK_PROPERTIES: PropertySummary[] = [
  {
    id: 1,
    uuid: 'a8b3f1c2-7656-49a0-9d1e-847291a0b3f1',
    identifier: '7656.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: DOIS | Num: 0 | Bairro: Chácaras de Inoã | Qd: 0.0 | Lt: 39.0 | Comp: Chácaras de Inoã',
    matricula: '7656.0',
    titular: 'BRUNO NUNES SANTOS',
    bairro: 'Chácaras de Inoã',
    rua: 'DOIS',
    numero: '0',
    quadra: '0.0',
    lote: '39.0',
    complemento: 'Chácaras de Inoã',
    status: 'NORMALIZADO',
    created_at: '2026-10-25 18:30:12',
  },
  {
    id: 2,
    uuid: 'b9c4d2e3-7657-4ab1-8e2f-958302b1c4e2',
    identifier: '7657.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: DOIS | Num: 1735 | Bairro: Chácaras de Inoã | Qd: 0.0 | Lt: 34.0 | Comp: Chácaras de Inoã',
    matricula: '7657.0',
    titular: 'ALESSANDRA DE AZEVEDO BELARMI',
    bairro: 'Chácaras de Inoã',
    rua: 'DOIS',
    numero: '1735',
    quadra: '0.0',
    lote: '34.0',
    complemento: 'Chácaras de Inoã',
    status: 'NORMALIZADO',
    created_at: '2026-10-25 18:30:14',
  },
  {
    id: 3,
    uuid: 'c0d5e3f4-5502-4bc2-9f3a-069413c2d5f3',
    identifier: '55024.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: DOS BOUGANVILLES | Num: 0 | Bairro: Chácaras de Inoã | Qd: 0.0 | Lt: 181.0 | Comp: Chácaras de Inoã',
    matricula: '55024.0',
    titular: 'ROBERTO DE ARAUJO BATISTA',
    bairro: 'Chácaras de Inoã',
    rua: 'DOS BOUGANVILLES',
    numero: '0',
    quadra: '0.0',
    lote: '181.0',
    complemento: 'Chácaras de Inoã',
    status: 'NORMALIZADO',
    created_at: '2026-10-25 18:30:15',
  },
  {
    id: 4,
    uuid: 'd1e6f4a5-5502-4cd3-a04b-170524d3e6a4',
    identifier: '55026.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: CARLOS MARIGHELLA | Num: 0 | Bairro: Chácaras de Inoã | Qd: 0.0 | Lt: 0000000PMM | Comp: Prédio Público',
    matricula: '55026.0',
    titular: 'PREFEITURA MUNICIPAL DE MARICÁ',
    bairro: 'Chácaras de Inoã',
    rua: 'CARLOS MARIGHELLA',
    numero: '0',
    quadra: '0.0',
    lote: 'PMM',
    complemento: 'Patrimônio Público Municipal',
    status: 'NORMALIZADO',
    created_at: '2026-10-25 18:30:16',
  },
  {
    id: 5,
    uuid: 'e2f7a5b6-1248-4de4-b15c-281635e4f7b5',
    identifier: '12480.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: Av. Beira Mar | Num: 104 | Bairro: Itaipuaçu | Qd: 12.0 | Lt: 05.0 | Comp: Loteamento Jardim Atlântico',
    matricula: '12480.0',
    titular: 'MARCOS ANTONIO PEREIRA',
    bairro: 'Itaipuaçu',
    rua: 'Av. Beira Mar',
    numero: '104',
    quadra: '12.0',
    lote: '05.0',
    complemento: 'Jardim Atlântico Leste',
    status: 'NORMALIZADO',
    created_at: '2026-10-25 18:30:18',
  },
  {
    id: 6,
    uuid: 'f3a8b6c7-1248-4ef5-c26d-392746f5a8c6',
    identifier: '12481.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: Rua das Acácias | Num: 250 | Bairro: Itaipuaçu | Qd: 14.0 | Lt: 22.0 | Comp: Casa 1',
    matricula: '12481.0',
    titular: 'CARLA SILVEIRA MENDES',
    bairro: 'Itaipuaçu',
    rua: 'Rua das Acácias',
    numero: '250',
    quadra: '14.0',
    lote: '22.0',
    complemento: 'Residencial Acácias',
    status: 'NORMALIZADO',
    created_at: '2026-10-25 18:30:20',
  },
  {
    id: 7,
    uuid: 'a4b9c7d8-3410-4f06-d37e-403857a6b9d7',
    identifier: '34109.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: Rua Ribeiro de Almeida | Num: 45 | Bairro: Centro | Qd: 03.0 | Lt: 18.0 | Comp: Sala 201',
    matricula: '34109.0',
    titular: 'JOAO CARLOS DE SOUZA',
    bairro: 'Centro',
    rua: 'Rua Ribeiro de Almeida',
    numero: '45',
    quadra: '03.0',
    lote: '18.0',
    complemento: 'Edifício Comercial Central',
    status: 'NORMALIZADO',
    created_at: '2026-10-25 18:30:22',
  },
  {
    id: 8,
    uuid: 'b5c0d8e9-3411-4017-e48f-514968b7cae8',
    identifier: '34110.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: Rua Domício da Gama | Num: 88 | Bairro: Centro | Qd: 05.0 | Lt: 09.0 | Comp: Loja B',
    matricula: '34110.0',
    titular: 'MARIA CLARA BASTOS',
    bairro: 'Centro',
    rua: 'Rua Domício da Gama',
    numero: '88',
    quadra: '05.0',
    lote: '09.0',
    complemento: 'Galeria Municipal',
    status: 'NORMALIZADO',
    created_at: '2026-10-25 18:30:25',
  },
  {
    id: 9,
    uuid: 'c6d1e9fa-9821-4128-f590-625079c8dbf9',
    identifier: '98211.0',
    identifier_type: 'UNCLASSIFIED_MATRICULA_CONFLICTING',
    address: 'Rua: Av. Maysa | Num: 1200 | Bairro: Cordeirinho | Qd: 28.0 | Lt: 01.0 | Comp: Gleba A',
    matricula: '98211.0',
    titular: 'CONSTRUTORA COSTA DO SOL LTDA',
    bairro: 'Cordeirinho',
    rua: 'Av. Maysa',
    numero: '1200',
    quadra: '28.0',
    lote: '01.0',
    complemento: 'Gleba A',
    status: 'COM_INCONSISTENCIA',
    created_at: '2026-10-25 18:30:28',
  },
  {
    id: 10,
    uuid: 'd7e2f0ab-9821-4239-06a1-736180d9eca0',
    identifier: '98212.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: Rua 104 | Num: 40 | Bairro: Cordeirinho | Qd: 30.0 | Lt: 15.0 | Comp: Casa térrea',
    matricula: '98212.0',
    titular: 'PAULO RICARDO GUIMARAES',
    bairro: 'Cordeirinho',
    rua: 'Rua 104',
    numero: '40',
    quadra: '30.0',
    lote: '15.0',
    complemento: 'Casa térrea',
    status: 'NORMALIZADO',
    created_at: '2026-10-25 18:30:30',
  },
  {
    id: 11,
    uuid: 'e8f3a1bc-4410-434a-17b2-847291e0fdb1',
    identifier: '44102.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: Estrada de Ponta Negra | Num: S/N | Bairro: Ponta Negra | Qd: 08.0 | Lt: 12.0 | Comp: Chácara 4',
    matricula: '44102.0',
    titular: 'EMPREENDIMENTOS MARICAENSE',
    bairro: 'Ponta Negra',
    rua: 'Estrada de Ponta Negra',
    numero: 'S/N',
    quadra: '08.0',
    lote: '12.0',
    complemento: 'Chácara 4',
    status: 'COM_INCONSISTENCIA',
    created_at: '2026-10-25 18:30:32',
  },
  {
    id: 12,
    uuid: 'f9a4b2cd-4410-445b-28c3-958302f1aec2',
    identifier: '44103.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: Rua do Farol | Num: 73 | Bairro: Ponta Negra | Qd: 11.0 | Lt: 07.0 | Comp: Vista Panorâmica',
    matricula: '44103.0',
    titular: 'LUCIA HELENA FONTES',
    bairro: 'Ponta Negra',
    rua: 'Rua do Farol',
    numero: '73',
    quadra: '11.0',
    lote: '07.0',
    complemento: 'Vista Panorâmica',
    status: 'NORMALIZADO',
    created_at: '2026-10-25 18:30:35',
  },
  {
    id: 13,
    uuid: 'a0b5c3de-6780-456c-39d4-069413a2bfd3',
    identifier: '67801.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: Estrada Real de Maricá | Num: 512 | Bairro: São José do Imbassaí | Qd: 19.0 | Lt: 03.0 | Comp: KM 22',
    matricula: '67801.0',
    titular: 'SERGIO TAVARES PINTO',
    bairro: 'São José do Imbassaí',
    rua: 'Estrada Real de Maricá',
    numero: '512',
    quadra: '19.0',
    lote: '03.0',
    complemento: 'KM 22',
    status: 'NORMALIZADO',
    created_at: '2026-10-25 18:30:38',
  },
  {
    id: 14,
    uuid: 'b1c6d4ef-6780-467d-4ae5-170524b3c0e4',
    identifier: '67802.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: Rua das Violetas | Num: 89 | Bairro: São José do Imbassaí | Qd: 21.0 | Lt: 14.0 | Comp: Lote 14B',
    matricula: '67802.0',
    titular: 'FABIANA DUARTE LIMA',
    bairro: 'São José do Imbassaí',
    rua: 'Rua das Violetas',
    numero: '89',
    quadra: '21.0',
    lote: '14.0',
    complemento: 'Lote 14B',
    status: 'NORMALIZADO',
    created_at: '2026-10-25 18:30:40',
  },
  {
    id: 15,
    uuid: 'c2d7e5fa-8120-478e-5bf6-281635c4d1f5',
    identifier: '81204.0',
    identifier_type: 'MATRICULA',
    address: 'Rua: Av. Roberto Silveira | Num: 310 | Bairro: Flamengo | Qd: 02.0 | Lt: 40.0 | Comp: Sede Operacional',
    matricula: '81204.0',
    titular: 'BANCO DE TERRAS MARICÁ S/A',
    bairro: 'Flamengo',
    rua: 'Av. Roberto Silveira',
    numero: '310',
    quadra: '02.0',
    lote: '40.0',
    complemento: 'Sede Operacional',
    status: 'NORMALIZADO',
    created_at: '2026-10-25 18:30:45',
  },
];

const INITIAL_MOCK_BATCHES: ImportBatchSummary[] = [
  {
    id: 1,
    source_filename: 'Mapa5.xlsx',
    source_hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    sheet_name: 'endereco',
    import_mode: 'PILOT',
    started_at: '2026-10-25 18:29:40',
    completed_at: '2026-10-25 18:30:45',
    status: 'COMPLETED',
    total_rows_read: 50,
    total_records_imported: 48,
    total_inconsistencies_detected: 2,
    last_processed_row: 51,
  },
];

const INITIAL_MOCK_FINDINGS: AuditFindingSummary[] = [
  {
    id: 1,
    property_id: 9,
    batch_record_id: 9,
    category: 'DUPLICATE_IDENTIFIER_IN_BATCH',
    severity: 'WARNING',
    source: 'IMPORTER_V1',
    description: "Identificador de matrícula repetido no arquivo: '98211.0' (Linha 44)",
    analysis_status: 'OPEN',
    created_at: '2026-10-25 18:30:28',
  },
  {
    id: 2,
    property_id: 11,
    batch_record_id: 11,
    category: 'INCOMPLETE_ADDRESS',
    severity: 'INFO',
    source: 'IMPORTER_V1',
    description: 'Endereço cadastral com número predial S/N na Linha 58 (Estrada de Ponta Negra)',
    analysis_status: 'OPEN',
    created_at: '2026-10-25 18:30:32',
  },
];

const mockProperties = [...INITIAL_MOCK_PROPERTIES];
let mockBatches = [...INITIAL_MOCK_BATCHES];
const mockFindings = [...INITIAL_MOCK_FINDINGS];

export const RealEstateBridge = {
  isDesktop: isTauriDesktop,

  /**
   * Consulta métricas consolidadas do banco de dados do Cadastro Imobiliário local (real_estate.sqlite).
   */
  async getStats(): Promise<RealEstateStats> {
    if (isTauriDesktop()) {
      return invokeNative<RealEstateStats>('get_real_estate_stats');
    }

    try {
      const res = await fetch('/api/real-estate/stats');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback gracioso para ambiente sem dev server
    }

    // Modo Sandbox Web (Navegador)
    return {
      total_properties: 145756,
      total_identifiers: 291510,
      total_addresses: 145756,
      total_batches: mockBatches.length,
      total_batch_records: 145756,
      open_findings_count: mockFindings.filter((f) => f.analysis_status === 'OPEN').length,
      pending_proposals_count: 0,
      db_path: '/home/sandro/.local/share/br.aspp.devos.cockpit/real_estate/real_estate.sqlite (WAL Oficial)',
    };
  },

  /**
   * Gera prévia detalhada da planilha XLSX sem gravar dados nas tabelas cadastrais.
   */
  async previewImport(filePath: string, sheetName?: string): Promise<XlsxPreviewReport> {
    if (isTauriDesktop()) {
      return invokeNative<XlsxPreviewReport>('preview_real_estate_import', {
        filePath,
        sheetName: sheetName ?? null,
      });
    }

    // Modo Sandbox Web (Navegador)
    const targetSheet = sheetName || 'endereco';
    const sampleRows: Record<string, string>[] = mockProperties.slice(0, 10).map((p) => ({
      Matrícula: String(p.matricula || ''),
      Nome: String(p.titular || ''),
      Bairro: String(p.bairro || ''),
      Rua: String(p.rua || ''),
      Quadra: String(p.quadra || ''),
      Lote: String(p.lote || ''),
      Numero: String(p.numero || ''),
      Complemento: String(p.complemento || ''),
    }));

    return {
      file_path: filePath,
      file_hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      file_size_bytes: 7868809,
      detected_sheets: ['endereco', 'divida', 'enderecoXdivida'],
      target_sheet: targetSheet,
      recognized_headers: [
        'Matrícula',
        'Nome',
        'Bairro',
        'Rua',
        'Quadra',
        'Lote',
        'Numero',
        'Complemento',
      ],
      total_rows_count: 53284,
      sample_rows: sampleRows,
      empty_matricula_sample_count: 0,
      empty_address_sample_count: 0,
      duplicate_matricula_sample_count: 1,
      already_imported_batch_id: 1,
      already_imported_status: 'COMPLETED',
      already_imported_mode: 'PILOT',
    };
  },

  /**
   * Executa a importação controlada em lotes transacionais com proveniência e detecção de duplicidades.
   */
  async executeImport(
    filePath: string,
    sheetName: string,
    rowLimit?: number
  ): Promise<ImportExecutionReport> {
    if (isTauriDesktop()) {
      return invokeNative<ImportExecutionReport>('execute_real_estate_import', {
        filePath,
        sheetName,
        rowLimit: rowLimit ?? null,
      });
    }

    // Modo Sandbox Web (Navegador)
    const newBatchId = mockBatches.length + 1;
    const mode = rowLimit ? 'PILOT' : 'FULL';
    const rows = rowLimit || 50;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newBatch: ImportBatchSummary = {
      id: newBatchId,
      source_filename: filePath.split('/').pop() || 'Mapa5.xlsx',
      source_hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      sheet_name: sheetName,
      import_mode: mode,
      started_at: now,
      completed_at: now,
      status: 'COMPLETED',
      total_rows_read: rows,
      total_records_imported: rows - 1,
      total_inconsistencies_detected: 1,
      last_processed_row: rows + 1,
    };

    mockBatches = [newBatch, ...mockBatches];

    return {
      batch_id: newBatchId,
      file_hash_sha256: newBatch.source_hash_sha256,
      import_mode: mode,
      status: 'COMPLETED',
      total_rows_read: rows,
      total_records_imported: rows - 1,
      total_inconsistencies_detected: 1,
      message: `Importação (${mode}) simulada com sucesso para o banco sandbox de Maricá. ${rows - 1} registros cadastrais associados.`,
      started_at: now,
      completed_at: now,
    };
  },

  /**
   * Lista os lotes de importação já processados.
   */
  async listBatches(limit?: number): Promise<ImportBatchSummary[]> {
    if (isTauriDesktop()) {
      return invokeNative<ImportBatchSummary[]>('list_import_batches', {
        limit: limit ?? null,
      });
    }

    return mockBatches.slice(0, limit || 20);
  },

  /**
   * Lista as inconsistências detectadas pelo importador de auditoria.
   */
  async listFindings(limit?: number): Promise<AuditFindingSummary[]> {
    if (isTauriDesktop()) {
      return invokeNative<AuditFindingSummary[]>('list_audit_findings', {
        limit: limit ?? null,
      });
    }

    return mockFindings.slice(0, limit || 50);
  },

  /**
   * Lista propriedades cadastradas no banco local com suporte a rolagem contínua e filtros.
   */
  async listProperties(
    limit?: number,
    offset?: number,
    bairro?: string,
    search?: string
  ): Promise<PropertySummary[]> {
    if (isTauriDesktop()) {
      return invokeNative<PropertySummary[]>('list_properties', {
        limit: limit ?? null,
      });
    }

    try {
      const params = new URLSearchParams();
      if (limit) params.set('limit', String(limit));
      if (offset) params.set('offset', String(offset));
      if (bairro && bairro !== 'ALL') params.set('bairro', bairro);
      if (search && search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/real-estate/properties?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch {
      // Fallback gracioso para ambiente sem dev server
    }

    let result = [...mockProperties];
    if (bairro && bairro !== 'ALL') {
      result = result.filter((p) => p.bairro === bairro);
    }
    if (search && search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.titular || '').toLowerCase().includes(s) ||
          (p.matricula || '').toLowerCase().includes(s) ||
          (p.rua || '').toLowerCase().includes(s)
      );
    }
    const start = offset || 0;
    const end = start + (limit || 100);
    return result.slice(start, end);
  },

  /**
   * Lista todos os bairros municipais com cadastros territoriais registrados.
   */
  async listNeighborhoods(): Promise<string[]> {
    try {
      const res = await fetch('/api/real-estate/neighborhoods');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Fallback gracioso
    }

    const set = new Set<string>();
    mockProperties.forEach((p) => {
      if (p.bairro?.trim()) set.add(p.bairro.trim());
    });
    return Array.from(set).sort();
  },

  /**
   * Abre o seletor nativo do sistema operacional para escolha de arquivo XLSX.
   */
  async selectFile(): Promise<string | null> {
    if (isTauriDesktop()) {
      return invokeNative<string | null>('select_spreadsheet_file');
    }

    return '/home/sandro/Downloads/Mapa5.xlsx';
  },
};
