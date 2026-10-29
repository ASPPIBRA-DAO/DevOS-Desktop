import type {
  VaultStatus,
  StoredWallet,
  RealEstateStats,
  XlsxPreviewReport,
  ImportBatchSummary,
  SaveWalletsRequest,
  AuditFindingSummary,
  GenerateSeedOptions,
  WalletBalanceReport,
  DeviceStatusResponse,
  DerivedWalletPreview,
  ImportExecutionReport,
  GeneratePreviewResponse,
} from '../platform/tauri';

import { it, vi, expect, describe, afterEach } from 'vitest';

import { mockIpcResponse } from './test-utils';
import {
  IpcError,
  VaultBridge,
  SystemBridge,
  WalletBridge,
  MonitoringBridge,
  RealEstateBridge,
  TauriErrorMapper,
} from '../platform/tauri';

describe('Onda 5 — IPC Contracts & Bridges Test Suite', () => {
  afterEach(() => {
    // Limpa o histórico das chamadas e mocks para isolamento entre testes.
    vi.clearAllMocks();
  });

  describe('Error Contracts & Sanitization', () => {
    it('deve sanitizar senhas e credenciais em mensagens de erro do IPC', () => {
      const sensitiveMsg =
        'Falha ao processar: password="SuperSecretPassword123" e private_key=abc123xyz com master_password=MyMasterPass999';
      const error = new IpcError(sensitiveMsg, 'BUSINESS_ERROR', 'unlock_vault');

      expect(error.message).not.toContain('SuperSecretPassword123');
      expect(error.message).not.toContain('abc123xyz');
      expect(error.message).not.toContain('MyMasterPass999');
      expect(error.message).toContain('[REDACTED_CREDENTIAL]');
      expect(error.command).toBe('unlock_vault');
      expect(error.code).toBe('BUSINESS_ERROR');
    });

    it('deve categorizar erros com TauriErrorMapper', () => {
      const validationErr = TauriErrorMapper.normalize(
        'Invalid payload: required field missing',
        'confirm_and_save_wallets'
      );
      expect(validationErr.code).toBe('VALIDATION_ERROR');
      expect(validationErr.command).toBe('confirm_and_save_wallets');

      const notFoundErr = TauriErrorMapper.normalize(
        'Registro nao encontrado no banco',
        'list_stored_wallets'
      );
      expect(notFoundErr.code).toBe('NOT_FOUND_ERROR');

      const unauthorizedErr = TauriErrorMapper.normalize(
        'Permission denied by capability',
        'list_audit_findings'
      );
      expect(unauthorizedErr.code).toBe('PERMISSION_DENIED_ERROR');
    });

    it('deve normalizar acentos e termos em portugues no TauriErrorMapper', () => {
      const accVal = TauriErrorMapper.normalize('Parâmetro com valor inválido');
      expect(accVal.code).toBe('VALIDATION_ERROR');

      const accNotFound = TauriErrorMapper.normalize('Chave não encontrada');
      expect(accNotFound.code).toBe('NOT_FOUND_ERROR');

      const accPerm = TauriErrorMapper.normalize('Operação não permitida: permissão negada');
      expect(accPerm.code).toBe('PERMISSION_DENIED_ERROR');

      const cryptoErr = TauriErrorMapper.normalize('Falha na descriptografia do envelope');
      expect(cryptoErr.code).toBe('CRYPTO_ERROR');

      const storageErr = TauriErrorMapper.normalize('Falha no banco SQLite devos_vault');
      expect(storageErr.code).toBe('STORAGE_ERROR');
    });

    it('deve extrair mensagem com seguranca sem falhar em referencias circulares', () => {
      const circularObj: Record<string, unknown> = { message: 'Erro circular de validacao' };
      circularObj.self = circularObj;

      const result = TauriErrorMapper.normalize(circularObj, 'test_cmd');
      expect(result).toBeInstanceOf(IpcError);
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.command).toBe('test_cmd');
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.message).toBe('Erro circular de validacao');
    });
  });

  describe('SystemBridge Contracts', () => {
    it('deve consultar status do dispositivo com contrato DeviceStatusResponse', async () => {
      const mockStatus: DeviceStatusResponse = { enrolled: true, status: 'READY' };
      mockIpcResponse('get_device_status', mockStatus);

      const status = await SystemBridge.getDeviceStatus();
      expect(status).toEqual(mockStatus);
      expect(status.enrolled).toBe(true);
      expect(status.status).toBe('READY');
    });
  });

  describe('VaultBridge Contracts', () => {
    it('deve obter status do cofre com contrato VaultStatus', async () => {
      const mockVaultStatus: VaultStatus = {
        is_initialized: true,
        is_unlocked: true,
        dao_wallets_count: 2,
        client_wallets_count: 1,
      };
      mockIpcResponse('get_vault_status', mockVaultStatus);

      const res = await VaultBridge.getStatus();
      expect(res).toEqual(mockVaultStatus);
      expect(res.dao_wallets_count).toBe(2);
      expect(res.is_unlocked).toBe(true);
    });

    it('deve definir senha mestre', async () => {
      mockIpcResponse('init_master_password', true);
      const res = await VaultBridge.initMasterPassword('secretPassword123');
      expect(res).toBe(true);
    });

    it('deve desbloquear cofre', async () => {
      mockIpcResponse('unlock_vault', true);
      const res = await VaultBridge.unlock('secretPassword123');
      expect(res).toBe(true);
    });
  });

  describe('WalletBridge Contracts', () => {
    const mockSavedWallets: StoredWallet[] = [
      {
        id: 1,
        target: 'DAO',
        custody_type: 'CUSTODIAL_LOCAL',
        user: 'admin',
        label: 'DAO-001',
        derivation_path: "m/44'/60'/0'/0/0",
        network: 'ethereum',
        address: '0x1111111111111111111111111111111111111111',
        status: 'ACTIVE',
        kyc_status: 'VERIFIED',
        seed_words_count: 12,
        created_at: '2026-10-25T00:00:00Z',
      },
    ];

    const savePayload: SaveWalletsRequest = {
      master_password: 'secretPassword123',
      session_id: 'session-xyz',
      target: 'DAO',
      network: 'ethereum',
      previews: [
        {
          index: 0,
          derivation_path: "m/44'/60'/0'/0/0",
          address: '0x1111111111111111111111111111111111111111',
          label: 'DAO-001',
          network: 'ethereum',
        },
      ],
    };

    it('deve gerar seed e preview com GeneratePreviewResponse', async () => {
      const mockWallets: DerivedWalletPreview[] = [
        {
          index: 0,
          derivation_path: "m/44'/60'/0'/0/0",
          address: '0x1111111111111111111111111111111111111111',
          label: 'DAO-001',
          network: 'ethereum',
        },
      ];
      const mockPreview: GeneratePreviewResponse = {
        session_id: 'session-xyz',
        words_count: 12,
        previews: mockWallets,
      };
      mockIpcResponse('generate_seed_and_preview', mockPreview);

      const options: GenerateSeedOptions = {
        wordCount: 12,
        target: 'DAO',
        accountBranch: 0,
        count: 1,
        baseLabel: 'DAO',
        network: 'ethereum',
      };
      const preview = await WalletBridge.generateSeedAndPreview(options);
      expect(preview.session_id).toBe('session-xyz');
      expect(preview.words_count).toBe(12);
      expect(preview.previews).toHaveLength(1);
      expect(preview.previews[0].address).toBe('0x1111111111111111111111111111111111111111');
    });

    it('deve salvar carteiras com DTOs StoredWallet', async () => {
      mockIpcResponse('confirm_and_save_wallets', mockSavedWallets);
      const saved = await WalletBridge.confirmAndSaveWallets(savePayload);
      expect(saved).toEqual(mockSavedWallets);
    });

    it('deve listar carteiras com DTOs StoredWallet', async () => {
      mockIpcResponse('list_stored_wallets', mockSavedWallets);
      const listed = await WalletBridge.listStoredWallets();
      expect(listed).toHaveLength(1);
      expect(listed[0].id).toBe(1);
      expect(listed[0].address).toBe('0x1111111111111111111111111111111111111111');
    });

    it('deve preservar o método proxy de consulta do status do cofre', async () => {
      const mockVaultStatus: VaultStatus = {
        is_initialized: true,
        is_unlocked: false,
        dao_wallets_count: 0,
        client_wallets_count: 0,
      };
      mockIpcResponse('get_vault_status', mockVaultStatus);

      const vaultStatus = await WalletBridge.getVaultStatus();
      expect(vaultStatus).toEqual(mockVaultStatus);
    });

    it('deve preservar o método proxy de consulta de saldo', async () => {
      const mockBalance: WalletBalanceReport = {
        address: '0x123',
        network: 'ethereum',
        status: 'Confirmed',
        formatted_balance: '1.5000 ETH',
        symbol: 'ETH',
        last_updated_at: '2026-10-25T00:00:00Z',
      };
      mockIpcResponse('fetch_wallet_balance', mockBalance);

      const balance = await WalletBridge.fetchWalletBalance('0x123', 'ethereum');
      expect(balance).toEqual(mockBalance);
      expect(balance.formatted_balance).toBe('1.5000 ETH');
    });
  });

  describe('MonitoringBridge Contracts', () => {
    it('deve consultar saldo de carteira com WalletBalanceReport', async () => {
      const mockBalance: WalletBalanceReport = {
        address: '0x71C...897',
        network: 'ethereum',
        status: 'Confirmed',
        formatted_balance: '2.5400 ETH',
        symbol: 'ETH',
        last_updated_at: '2026-10-25T01:00:00Z',
      };
      mockIpcResponse('fetch_wallet_balance', mockBalance);

      const report = await MonitoringBridge.fetchWalletBalance('0x71C...897', 'ethereum');
      expect(report).toEqual(mockBalance);
      expect(report.formatted_balance).toBe('2.5400 ETH');
      expect(report.network).toBe('ethereum');
    });
  });

  describe('RealEstateBridge Contracts', () => {
    const mockPreview: XlsxPreviewReport = {
      file_path: '/tmp/imoveis.xlsx',
      file_hash_sha256: 'hash123',
      file_size_bytes: 4096,
      detected_sheets: ['Planilha1'],
      target_sheet: 'Planilha1',
      recognized_headers: ['Codigo', 'Endereco', 'Valor'],
      total_rows_count: 10,
      sample_rows: [],
      empty_matricula_sample_count: 0,
      empty_address_sample_count: 0,
      duplicate_matricula_sample_count: 0,
      already_imported_batch_id: null,
      already_imported_status: null,
      already_imported_mode: null,
    };

    const mockExecReport: ImportExecutionReport = {
      batch_id: 1,
      file_hash_sha256: 'hash123',
      import_mode: 'APPEND',
      status: 'COMPLETED',
      total_rows_read: 10,
      total_records_imported: 10,
      total_inconsistencies_detected: 0,
      message: 'Importação realizada com sucesso',
      started_at: '2026-10-25T01:00:00Z',
      completed_at: '2026-10-25T01:00:01Z',
    };

    it('deve obter estatísticas do módulo imobiliário com RealEstateStats', async () => {
      const mockStats: RealEstateStats = {
        total_properties: 15,
        total_identifiers: 15,
        total_addresses: 15,
        total_batches: 2,
        total_batch_records: 150,
        open_findings_count: 3,
        pending_proposals_count: 1,
        db_path: '/path/to/real_estate.sqlite',
      };
      mockIpcResponse('get_real_estate_stats', mockStats);

      const stats = await RealEstateBridge.getStats();
      expect(stats).toEqual(mockStats);
      expect(stats.total_properties).toBe(15);
      expect(stats.open_findings_count).toBe(3);
    });

    it('deve realizar pré-visualização de importação XLSX', async () => {
      mockIpcResponse('preview_real_estate_import', mockPreview);

      const preview = await RealEstateBridge.previewImport('/tmp/imoveis.xlsx');
      expect(preview).toEqual(mockPreview);
      expect(preview.file_path).toBe('/tmp/imoveis.xlsx');
      expect(preview.total_rows_count).toBe(10);
    });

    it('deve executar importação imobiliária e retornar relatório tipado', async () => {
      mockIpcResponse('execute_real_estate_import', mockExecReport);

      const exec = await RealEstateBridge.executeImport('/tmp/imoveis.xlsx', 'Planilha1');
      expect(exec).toEqual(mockExecReport);
      expect(exec.status).toBe('COMPLETED');
      expect(exec.batch_id).toBe(1);
    });

    it('deve listar lotes com DTOs ImportBatchSummary', async () => {
      const mockBatches: ImportBatchSummary[] = [
        {
          id: 1,
          source_filename: 'lote1.xlsx',
          source_hash_sha256: 'sha256...',
          sheet_name: 'Planilha1',
          import_mode: 'APPEND',
          started_at: '2026-10-25T01:00:00Z',
          completed_at: '2026-10-25T01:00:01Z',
          status: 'COMPLETED',
          total_rows_read: 50,
          total_records_imported: 50,
          total_inconsistencies_detected: 0,
          last_processed_row: 50,
        },
      ];
      mockIpcResponse('list_import_batches', mockBatches);

      const batches = await RealEstateBridge.listBatches();
      expect(batches).toEqual(mockBatches);
      expect(batches).toHaveLength(1);
      expect(batches[0].id).toBe(1);
    });

    it('deve listar inconsistências de auditoria com AuditFindingSummary', async () => {
      const mockFindings: AuditFindingSummary[] = [
        {
          id: 1,
          property_id: 10,
          batch_record_id: 1,
          category: 'DUPLICATE_MATRICULA',
          severity: 'HIGH',
          source: 'AUDIT_RULE_ENGINE',
          description: 'Matrícula duplicada detectada',
          analysis_status: 'OPEN',
          created_at: '2026-10-25T01:00:00Z',
        },
      ];
      mockIpcResponse('list_audit_findings', mockFindings);

      const findings = await RealEstateBridge.listFindings();
      expect(findings).toEqual(mockFindings);
      expect(findings).toHaveLength(1);
      expect(findings[0].category).toBe('DUPLICATE_MATRICULA');
    });
  });
});
