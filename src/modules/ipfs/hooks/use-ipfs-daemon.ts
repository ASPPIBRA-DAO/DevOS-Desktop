import type { IpfsDaemonStatus } from '../../../platform/tauri';

import { useState, useEffect, useCallback } from 'react';

import { IpfsBridge, isTauriDesktop } from '../../../platform/tauri';

export interface UseIpfsDaemonReturn {
  status: IpfsDaemonStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isOnline: boolean;
  peerId: string | null;
  peersCount: number;
  repoSizeBytes: number;
  version: string | null;
}

/**
 * Hook para monitoramento em tempo real do estado do daemon IPFS / Kubo.
 */
export function useIpfsDaemon(pollIntervalMs = 5000): UseIpfsDaemonReturn {
  const [status, setStatus] = useState<IpfsDaemonStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isDesktop = isTauriDesktop();

  const fetchStatus = useCallback(async () => {
    try {
      if (isDesktop) {
        const res = await IpfsBridge.getDaemonStatus();
        setStatus(res);
        setError(null);
      } else {
        // Modo preview para desenvolvimento fora do Tauri
        setStatus({
          running: true,
          peer_id: '12D3KooWGeJjvgmCGAXcdPpoGZTwMpQCdEaf13uCkVw1Zs7zXjSK',
          peers_count: 12,
          repo_size_bytes: 1048576,
          version: '0.43.1',
        });
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus({ running: false });
    } finally {
      setLoading(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    fetchStatus();
    if (pollIntervalMs > 0) {
      const interval = setInterval(fetchStatus, pollIntervalMs);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchStatus, pollIntervalMs]);

  const isOnline = Boolean(status?.running);

  return {
    status,
    loading,
    error,
    refresh: fetchStatus,
    isOnline,
    peerId: status?.peer_id ?? null,
    peersCount: status?.peers_count ?? 0,
    repoSizeBytes: status?.repo_size_bytes ?? 0,
    version: status?.version ?? null,
  };
}
