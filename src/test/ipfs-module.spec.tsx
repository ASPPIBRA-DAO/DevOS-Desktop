import type {
  IpfsDaemonStatus,
  ManagedPinRecord,
  IpfsCidCustodyStatus,
} from '../platform/tauri';

import React from 'react';
import { it, vi, expect, describe, afterEach } from 'vitest';

import { IpfsBridge } from '../platform/tauri';
import { clearIpcMock, mockIpcResponse } from './test-utils';
import {
  IpfsView,
  IpfsFileList,
  IpfsNodeStatus,
  IpfsUploadPanel,
  StorageProofCard,
  IpfsDaemonMetric,
  IpfsPinningStatus,
} from '../modules/ipfs';

describe('Módulo 11 — IPFS & Armazenamento Descentralizado (Testes do Módulo Frontend)', () => {
  afterEach(() => {
    vi.clearAllMocks();
    clearIpcMock('get_ipfs_daemon_status');
    clearIpcMock('ipfs_list_managed_pins');
    clearIpcMock('ipfs_upload_file');
    clearIpcMock('ipfs_download_file');
    clearIpcMock('ipfs_pin_cid');
    clearIpcMock('ipfs_unpin_cid');
    clearIpcMock('ipfs_verify_cid_custody');
    clearIpcMock('ipfs_verify_all_pins');
    clearIpcMock('ipfs_query_providers');
    clearIpcMock('execute_storage_proof');
    clearIpcMock('ipfs_start_daemon');
    clearIpcMock('ipfs_stop_daemon');
    clearIpcMock('ipfs_restart_daemon');
  });

  describe('1. Contratos IPC & IpfsBridge', () => {
    it('deve consultar o status do daemon via IpfsBridge.getDaemonStatus()', async () => {
      const mockStatus: IpfsDaemonStatus = {
        running: true,
        peer_id: '12D3KooWGeJjvgmCGAXcdPpoGZTwMpQCdEaf13uCkVw1Zs7zXjSK',
        peers_count: 15,
        repo_size_bytes: 1048576,
        version: '0.43.1',
        origin: 'DevOsSpawned',
      };
      mockIpcResponse('get_ipfs_daemon_status', mockStatus);

      const status = await IpfsBridge.getDaemonStatus();
      expect(status.running).toBe(true);
      expect(status.peer_id).toBe('12D3KooWGeJjvgmCGAXcdPpoGZTwMpQCdEaf13uCkVw1Zs7zXjSK');
      expect(status.peers_count).toBe(15);
      expect(status.version).toBe('0.43.1');
      expect(status.origin).toBe('DevOsSpawned');
    });

    it('deve iniciar o daemon via IpfsBridge.startDaemon()', async () => {
      mockIpcResponse('ipfs_start_daemon', {
        running: true,
        peer_id: '12D3KooWGeJjvgmCGAXcdPpoGZTwMpQCdEaf13uCkVw1Zs7zXjSK',
        peers_count: 1,
        origin: 'DevOsSpawned',
      });
      const status = await IpfsBridge.startDaemon();
      expect(status.running).toBe(true);
      expect(status.origin).toBe('DevOsSpawned');
    });

    it('deve encerrar o daemon via IpfsBridge.stopDaemon()', async () => {
      mockIpcResponse('ipfs_stop_daemon', {
        running: false,
        origin: 'Offline',
      });
      const status = await IpfsBridge.stopDaemon();
      expect(status.running).toBe(false);
    });

    it('deve reiniciar o daemon via IpfsBridge.restartDaemon()', async () => {
      mockIpcResponse('ipfs_restart_daemon', {
        running: true,
        peer_id: '12D3KooWGeJjvgmCGAXcdPpoGZTwMpQCdEaf13uCkVw1Zs7zXjSK',
        origin: 'DevOsSpawned',
      });
      const status = await IpfsBridge.restartDaemon();
      expect(status.running).toBe(true);
      expect(status.origin).toBe('DevOsSpawned');
    });

    it('deve listar conteúdos gerenciados via IpfsBridge.listManagedPins()', async () => {
      const mockPins: ManagedPinRecord[] = [
        {
          cid: 'QmbuBwD15hcuFFTJTAjcmNTpi6S7d8dEBSZZbGjqXd1Hc4',
          name: 'relatorio.pdf',
          original_sha256: '0x869d57418e4eddc6dc38e3af397ae37e0a4215222febd0120ae81818cebf1d3f',
          size_bytes: 5120,
          pinned_at_utc: '2026-11-01T15:00:00Z',
          pin_type: 'recursive',
          origin: 'devos_upload',
          repo_context: 'devos_repo_dedicated',
        },
      ];
      mockIpcResponse('ipfs_list_managed_pins', mockPins);

      const pins = await IpfsBridge.listManagedPins();
      expect(pins.length).toBe(1);
      expect(pins[0].cid).toBe('QmbuBwD15hcuFFTJTAjcmNTpi6S7d8dEBSZZbGjqXd1Hc4');
      expect(pins[0].name).toBe('relatorio.pdf');
    });

    it('deve disparar upload e receber resposta tipada via IpfsBridge.uploadFile()', async () => {
      mockIpcResponse('ipfs_upload_file', {
        cid: 'QmUploadedCID123',
        name: 'documento.pdf',
        size_bytes: 1024,
        sha256_checksum: '0x1234567890abcdef',
        pinned: true,
      });

      const res = await IpfsBridge.uploadFile({
        file_path: '/tmp/documento.pdf',
        pin: true,
      });

      expect(res.cid).toBe('QmUploadedCID123');
      expect(res.pinned).toBe(true);
      expect(res.sha256_checksum).toBe('0x1234567890abcdef');
    });

    it('deve auditar custódia via IpfsBridge.verifyCidCustody()', async () => {
      const mockCustody: IpfsCidCustodyStatus = {
        cid: 'QmUploadedCID123',
        integrity: 'CONFIRMED',
        custody: 'RECURSIVE_PIN',
        availability: 'RECOVERY_CONFIRMED',
        recovered_sha256: '0x1234567890abcdef',
        providers_count: 2,
        is_managed_by_devos: true,
      };
      mockIpcResponse('ipfs_verify_cid_custody', mockCustody);

      const custody = await IpfsBridge.verifyCidCustody('QmUploadedCID123', '0x1234567890abcdef');
      expect(custody.integrity).toBe('CONFIRMED');
      expect(custody.custody).toBe('RECURSIVE_PIN');
      expect(custody.availability).toBe('RECOVERY_CONFIRMED');
    });

    it('deve executar unpin seguro via IpfsBridge.unpinCid()', async () => {
      mockIpcResponse('ipfs_unpin_cid', {
        cid: 'QmUploadedCID123',
        unpinned: true,
        was_managed_by_devos: true,
      });

      const res = await IpfsBridge.unpinCid({
        cid: 'QmUploadedCID123',
        recursive: true,
      });

      expect(res.unpinned).toBe(true);
      expect(res.was_managed_by_devos).toBe(true);
    });

    it('deve resolver prova de desafio DePIN via IpfsBridge.executeStorageProof()', async () => {
      mockIpcResponse('execute_storage_proof', {
        challenge_id: 'chall-001',
        proof_hash: '0x99887766',
        signature: '0x1234',
        node_operational_pubkey: '0x02a1...',
      });

      const res = await IpfsBridge.executeStorageProof({
        challenge_id: 'chall-001',
        cid: 'QmTestCID',
        server_nonce: 'nonce-123',
        deadline_utc: '2026-11-01T18:00:00Z',
      });

      expect(res.challenge_id).toBe('chall-001');
      expect(res.proof_hash).toBe('0x99887766');
    });
  });

  describe('2. Instanciação e Tipagem de Componentes React', () => {
    it('deve instanciar IpfsNodeStatus com propriedades online e offline', () => {
      const onlineElement = (
        <IpfsNodeStatus
          status={{
            running: true,
            peer_id: '12D3KooWGeJjvgmCGAXcdPpoGZTwMpQCdEaf13uCkVw1Zs7zXjSK',
            peers_count: 10,
            repo_size_bytes: 2048576,
            version: '0.43.1',
          }}
        />
      );
      expect(React.isValidElement(onlineElement)).toBe(true);

      const offlineElement = (
        <IpfsNodeStatus
          status={{ running: false, origin: 'Offline' }}
          onStartDaemon={vi.fn()}
        />
      );
      expect(React.isValidElement(offlineElement)).toBe(true);

      const withControlsElement = (
        <IpfsNodeStatus
          status={{
            running: true,
            peer_id: '12D3KooWGeJjvgmCGAXcdPpoGZTwMpQCdEaf13uCkVw1Zs7zXjSK',
            origin: 'DevOsSpawned',
          }}
          onRefresh={vi.fn()}
          onStartDaemon={vi.fn()}
          onStopDaemon={vi.fn()}
          onRestartDaemon={vi.fn()}
        />
      );
      expect(React.isValidElement(withControlsElement)).toBe(true);
    });

    it('deve instanciar IpfsDaemonMetric com propriedades válidas', () => {
      const metricElement = (
        <IpfsDaemonMetric status={{ running: true, peers_count: 5 }} />
      );
      expect(React.isValidElement(metricElement)).toBe(true);
    });

    it('deve instanciar StorageProofCard com tipagem correta', () => {
      expect(React.isValidElement(<StorageProofCard />)).toBe(true);
    });

    it('deve instanciar IpfsPinningStatus com todas as combinações de estados', () => {
      const custodyConfirmedElement = (
        <IpfsPinningStatus
          status={{
            cid: 'QmTest',
            integrity: 'CONFIRMED',
            custody: 'RECURSIVE_PIN',
            availability: 'RECOVERY_CONFIRMED',
            providers_count: 3,
            is_managed_by_devos: true,
          }}
          cid="QmTest"
        />
      );
      expect(React.isValidElement(custodyConfirmedElement)).toBe(true);

      const custodyFailedElement = (
        <IpfsPinningStatus
          status={{
            cid: 'QmTest2',
            integrity: 'FAILED',
            custody: 'NOT_PINNED',
            availability: 'LOOKUP_FAILED',
            providers_count: 0,
            is_managed_by_devos: false,
          }}
        />
      );
      expect(React.isValidElement(custodyFailedElement)).toBe(true);
    });

    it('deve instanciar IpfsUploadPanel com callbacks e lastResult', () => {
      const onUpload = vi.fn().mockResolvedValue({
        cid: 'Qm123',
        name: 'test.pdf',
        size_bytes: 100,
        sha256_checksum: '0x123',
        pinned: true,
      });

      const element = (
        <IpfsUploadPanel
          uploading={false}
          onUpload={onUpload}
          lastResult={{
            cid: 'Qm123',
            name: 'test.pdf',
            size_bytes: 100,
            sha256_checksum: '0x123',
            pinned: true,
          }}
        />
      );
      expect(React.isValidElement(element)).toBe(true);
    });

    it('deve instanciar IpfsFileList com itens reais gerenciados', () => {
      const mockFiles: ManagedPinRecord[] = [
        {
          cid: 'QmbuBwD15hcuFFTJTAjcmNTpi6S7d8dEBSZZbGjqXd1Hc4',
          name: 'arquivo_texto.txt',
          original_sha256: '0x869d57418e4eddc6dc38e3af397ae37e0a4215222febd0120ae81818cebf1d3f',
          size_bytes: 51,
          pinned_at_utc: '2026-11-01T15:00:00Z',
          pin_type: 'recursive',
          origin: 'devos_upload',
        },
      ];

      const element = (
        <IpfsFileList
          files={mockFiles}
          onVerifyCustody={vi.fn().mockResolvedValue({})}
          onDownload={vi.fn().mockResolvedValue({})}
          onUnpin={vi.fn().mockResolvedValue({})}
        />
      );
      expect(React.isValidElement(element)).toBe(true);
    });

    it('deve instanciar a visão centralizada IpfsView', () => {
      expect(React.isValidElement(<IpfsView />)).toBe(true);
    });
  });
});
