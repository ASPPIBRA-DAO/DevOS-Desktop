import type { IpfsDaemonStatus } from '../../../platform/tauri';

import { useState, useEffect, useCallback } from 'react';

import { IpfsBridge, isTauriDesktop } from '../../../platform/tauri';

export interface UseIpfsDaemonReturn {
  status: IpfsDaemonStatus | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startDaemon: () => Promise<void>;
  stopDaemon: () => Promise<void>;
  restartDaemon: () => Promise<void>;
  isOnline: boolean;
  peerId: string | null;
  peersCount: number;
  repoSizeBytes: number;
  version: string | null;
  origin: string | null;
  isDevOsSpawned: boolean;
}

/**
 * Hook para monitoramento em tempo real e controle do daemon IPFS / Kubo.
 */
export function useIpfsDaemon(pollIntervalMs = 5000): UseIpfsDaemonReturn {
  const [status, setStatus] = useState<IpfsDaemonStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
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
          origin: 'DevOsSpawned',
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

  const startDaemon = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    try {
      if (isDesktop) {
        const res = await IpfsBridge.startDaemon();
        setStatus(res);
      } else {
        setStatus((prev) => ({ ...prev, running: true, origin: 'DevOsSpawned' }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  }, [isDesktop]);

  const stopDaemon = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    try {
      if (isDesktop) {
        const res = await IpfsBridge.stopDaemon();
        setStatus(res);
      } else {
        setStatus((prev) => ({ ...prev, running: false, origin: 'Offline' }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  }, [isDesktop]);

  const restartDaemon = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    try {
      if (isDesktop) {
        const res = await IpfsBridge.restartDaemon();
        setStatus(res);
      } else {
        setStatus((prev) => ({ ...prev, running: true, origin: 'DevOsSpawned' }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
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
  const origin = status?.origin ?? null;
  const isDevOsSpawned = origin === 'DevOsSpawned';

  return {
    status,
    loading,
    actionLoading,
    error,
    refresh: fetchStatus,
    startDaemon,
    stopDaemon,
    restartDaemon,
    isOnline,
    peerId: status?.peer_id ?? null,
    peersCount: status?.peers_count ?? 0,
    repoSizeBytes: status?.repo_size_bytes ?? 0,
    version: status?.version ?? null,
    origin,
    isDevOsSpawned,
  };
}
