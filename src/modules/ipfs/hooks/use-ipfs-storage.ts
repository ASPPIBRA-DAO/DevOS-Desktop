import type {
  IpfsCidCustodyStatus,
  IpfsDownloadResult,
  IpfsUploadResult,
  ManagedPinRecord,
} from '../../../platform/tauri';

import { useState, useEffect, useCallback } from 'react';

import { IpfsBridge, isTauriDesktop } from '../../../platform/tauri';

export interface UseIpfsStorageReturn {
  files: ManagedPinRecord[];
  loadingFiles: boolean;
  uploading: boolean;
  downloading: boolean;
  verifying: boolean;
  unpinning: boolean;
  error: string | null;
  lastUploadResult: IpfsUploadResult | null;
  lastDownloadResult: IpfsDownloadResult | null;
  custodyMap: Record<string, IpfsCidCustodyStatus>;
  refreshFiles: () => Promise<void>;
  uploadFile: (filePath: string, pin?: boolean, expectedSha256?: string) => Promise<IpfsUploadResult>;
  downloadFile: (
    cid: string,
    targetPath: string,
    overwrite?: boolean,
    expectedSha256?: string
  ) => Promise<IpfsDownloadResult>;
  pinCid: (cid: string, recursive?: boolean) => Promise<void>;
  unpinCid: (cid: string, forceExternal?: boolean, confirmShared?: boolean) => Promise<void>;
  verifyCustody: (cid: string, expectedSha256?: string) => Promise<IpfsCidCustodyStatus>;
  clearError: () => void;
}

/**
 * Hook para gerenciamento de operações reais de armazenamento do DevOS no IPFS.
 */
export function useIpfsStorage(): UseIpfsStorageReturn {
  const [files, setFiles] = useState<ManagedPinRecord[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [unpinning, setUnpinning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUploadResult, setLastUploadResult] = useState<IpfsUploadResult | null>(null);
  const [lastDownloadResult, setLastDownloadResult] = useState<IpfsDownloadResult | null>(null);
  const [custodyMap, setCustodyMap] = useState<Record<string, IpfsCidCustodyStatus>>({});

  const isDesktop = isTauriDesktop();

  const refreshFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      if (isDesktop) {
        const managed = await IpfsBridge.listManagedPins();
        setFiles(managed);
      } else {
        // Fallback ilustrativo exclusivo de visualização web
        setFiles([
          {
            cid: 'QmbuBwD15hcuFFTJTAjcmNTpi6S7d8dEBSZZbGjqXd1Hc4',
            name: 'arquivo_texto.txt',
            original_sha256: '0x869d57418e4eddc6dc38e3af397ae37e0a4215222febd0120ae81818cebf1d3f',
            size_bytes: 51,
            pinned_at_utc: '2026-11-01T15:00:00Z',
            pin_type: 'recursive',
            origin: 'devos_upload',
            repo_context: 'devos_repo_dedicated',
          },
        ]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingFiles(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const uploadFile = useCallback(
    async (filePath: string, pin = true, expectedSha256?: string): Promise<IpfsUploadResult> => {
      setUploading(true);
      setError(null);
      try {
        const res = await IpfsBridge.uploadFile({
          file_path: filePath,
          pin,
          expected_sha256: expectedSha256,
        });
        setLastUploadResult(res);
        await refreshFiles();
        return res;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [refreshFiles]
  );

  const downloadFile = useCallback(
    async (
      cid: string,
      targetPath: string,
      overwrite = false,
      expectedSha256?: string
    ): Promise<IpfsDownloadResult> => {
      setDownloading(true);
      setError(null);
      try {
        const res = await IpfsBridge.downloadFile({
          cid,
          target_path: targetPath,
          overwrite,
          expected_sha256: expectedSha256,
        });
        setLastDownloadResult(res);
        return res;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setDownloading(false);
      }
    },
    []
  );

  const pinCid = useCallback(
    async (cid: string, recursive = true): Promise<void> => {
      setError(null);
      try {
        await IpfsBridge.pinCid({ cid, recursive });
        await refreshFiles();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      }
    },
    [refreshFiles]
  );

  const unpinCid = useCallback(
    async (cid: string, forceExternal = false, confirmShared = false): Promise<void> => {
      setUnpinning(true);
      setError(null);
      try {
        await IpfsBridge.unpinCid({
          cid,
          recursive: true,
          force_external_unpin: forceExternal,
          confirm_shared_repo_unpin: confirmShared,
        });
        await refreshFiles();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setUnpinning(false);
      }
    },
    [refreshFiles]
  );

  const verifyCustody = useCallback(
    async (cid: string, expectedSha256?: string): Promise<IpfsCidCustodyStatus> => {
      setVerifying(true);
      setError(null);
      try {
        const status = await IpfsBridge.verifyCidCustody(cid, expectedSha256);
        setCustodyMap((prev) => ({ ...prev, [cid]: status }));
        return status;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setVerifying(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    files,
    loadingFiles,
    uploading,
    downloading,
    verifying,
    unpinning,
    error,
    lastUploadResult,
    lastDownloadResult,
    custodyMap,
    refreshFiles,
    uploadFile,
    downloadFile,
    pinCid,
    unpinCid,
    verifyCustody,
    clearError,
  };
}
