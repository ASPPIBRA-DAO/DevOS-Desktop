import type { VaultStatus } from 'src/platform/tauri/contracts/vault-contracts';

import React, {
  useRef,
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext,
} from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { isTauriDesktop } from 'src/platform/tauri/core/invoke';
import { VaultBridge } from 'src/platform/tauri/vault/vault-bridge';
import { WindowBridge } from 'src/platform/tauri/window/window-bridge';

import { SplashScreen } from 'src/shared/components/loading-screen';

// ----------------------------------------------------------------------
// Tipos e Estados Estritos da Máquina de Inicialização
// ----------------------------------------------------------------------

export type BootstrapState =
  | 'INITIALIZING' // Handshake e validação SQLite em andamento
  | 'READY_UNLOCKED' // Desktop: cofre inicializado e desbloqueado (acesso total)
  | 'READY_LOCKED' // Desktop: cofre inicializado mas trancado (requer senha mestre)
  | 'UNINITIALIZED' // Desktop: primeiro acesso, requer criação de senha mestre
  | 'WEB_PREVIEW' // Navegador: ambiente web sem cofre nativo de hardware
  | 'TIMEOUT_WARNING' // UX: inicialização excedeu o limite de espera (4.5s)
  | 'FATAL_ERROR'; // Falha física de I/O ou banco SQLite indisponível

export interface BootstrapContextValue {
  state: BootstrapState;
  vaultStatus: VaultStatus | null;
  errorMessage: string | null;
  retry: () => void;
  unlock: (password: string) => Promise<boolean>;
  lock: () => Promise<void>;
  refreshStatus: () => Promise<VaultStatus | null>;
}

const BootstrapContext = createContext<BootstrapContextValue | null>(null);

export function useBootstrap(): BootstrapContextValue {
  const context = useContext(BootstrapContext);
  if (!context) {
    throw new Error('useBootstrap deve ser utilizado dentro de um <AppBootstrapProvider />');
  }
  return context;
}

// ----------------------------------------------------------------------
// Provedor de Bootstrap com Proteção Estrita Contra Race Conditions
// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
  timeoutMs?: number;
  enableThreeAnimation?: boolean;
};

export function AppBootstrapProvider({
  children,
  timeoutMs = 4500,
  enableThreeAnimation = true,
}: Props) {
  const [state, setState] = useState<BootstrapState>('INITIALIZING');
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Controle sequencial estrito de tentativas (elimina Casos A e B de respostas atrasadas)
  const attemptSeqRef = useRef(0);
  const activeAttemptIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Portão Duplo de Inicialização: IPC Ready + Animation Done
  const isAnimationDoneRef = useRef<boolean>(!enableThreeAnimation);
  const pendingTargetStateRef = useRef<BootstrapState | null>(null);

  const handleAnimationComplete = useCallback(() => {
    isAnimationDoneRef.current = true;
    if (pendingTargetStateRef.current) {
      const next = pendingTargetStateRef.current;
      pendingTargetStateRef.current = null;
      setState(next);
    }
  }, []);

  const runBootstrap = useCallback(() => {
    // 1. Limpa timer ativo da tentativa anterior
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // 2. Incrementa ID de tentativa e define como tentativa ativa
    const attemptId = ++attemptSeqRef.current;
    activeAttemptIdRef.current = attemptId;

    // Reseta portão duplo e estado de janela para nova tentativa
    WindowBridge.reset();
    isAnimationDoneRef.current = !enableThreeAnimation;
    pendingTargetStateRef.current = null;

    setState('INITIALIZING');
    setErrorMessage(null);

    // 3. Verificação de ambiente: se não for Tauri Desktop, transiciona diretamente para WEB_PREVIEW
    if (!isTauriDesktop()) {
      activeAttemptIdRef.current = null;
      if (isAnimationDoneRef.current) {
        setState('WEB_PREVIEW');
      } else {
        pendingTargetStateRef.current = 'WEB_PREVIEW';
      }
      return;
    }

    // 4. Timer de UX (4.5s): invalida a tentativa ativa IMEDIATAMENTE no timeout e interrompe animação
    timerRef.current = setTimeout(() => {
      if (activeAttemptIdRef.current === attemptId) {
        // Regra fiduciária: a tentativa expirada é invalidada aqui (impede Caso A)
        activeAttemptIdRef.current = null;
        pendingTargetStateRef.current = null;
        isAnimationDoneRef.current = true;
        setState('TIMEOUT_WARNING');
      }
    }, timeoutMs);

    // 5. Execução do handshake IPC seguro com o motor Rust
    VaultBridge.getStatus()
      .then((status) => {
        // Verificação estrita: se a tentativa ativa não for EXATAMENTE este attemptId, descarta
        if (activeAttemptIdRef.current !== attemptId) {
          // Descarte seguro de resposta atrasada (impede Casos A e B)
          return;
        }

        // Tentativa válida no prazo
        activeAttemptIdRef.current = null;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        setVaultStatus(status);

        // Invariante de Segurança Fiduciária — Tratamento Exaustivo das 4 Combinações:
        let targetState: BootstrapState;
        if (!status.is_initialized && status.is_unlocked) {
          // Combinação Anômala: desbloqueado sem estar inicializado
          setErrorMessage('Inconsistência de integridade na sessão do cofre.');
          targetState = 'FATAL_ERROR';
        } else if (!status.is_initialized) {
          targetState = 'UNINITIALIZED';
        } else if (!status.is_unlocked) {
          targetState = 'READY_LOCKED';
        } else {
          targetState = 'READY_UNLOCKED';
        }

        // Falha crítica interrompe imediatamente a animação
        if (targetState === 'FATAL_ERROR') {
          pendingTargetStateRef.current = null;
          isAnimationDoneRef.current = true;
          setState('FATAL_ERROR');
          return;
        }

        // Portão Duplo: Se a animação já concluiu, transiciona para o estado alvo
        if (isAnimationDoneRef.current) {
          setState(targetState);
        } else {
          // Aguarda conclusão da animação (tempo regular ou Esc/Pular)
          pendingTargetStateRef.current = targetState;
        }
      })
      .catch((err: unknown) => {
        if (activeAttemptIdRef.current !== attemptId) {
          // Descarte de erro atrasado de tentativa obsoleta
          return;
        }

        activeAttemptIdRef.current = null;
        pendingTargetStateRef.current = null;
        isAnimationDoneRef.current = true;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        const raw = (err as Error)?.message || String(err);
        const sanitized = raw.includes('VAULT_STORAGE_ERR')
          ? 'Falha de acesso ao armazenamento seguro local (devos_vault.sqlite).'
          : 'Erro inesperado na inicialização do subsistema nativo do cofre.';

        setErrorMessage(sanitized);
        setState('FATAL_ERROR');
      });
  }, [timeoutMs, enableThreeAnimation]);

  useEffect(() => {
    runBootstrap();

    return () => {
      // Cleanup no desmonte: anula tentativa ativa e limpa timers
      activeAttemptIdRef.current = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [runBootstrap]);

  // Restauração da Janela: ao concluir o bootstrap, sai de tela cheia para o dashboard
  useEffect(() => {
    if (state !== 'INITIALIZING') {
      void WindowBridge.restoreWindowAfterBoot();
    }
  }, [state]);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    const ok = await VaultBridge.unlock(password);
    if (ok) {
      setState('READY_UNLOCKED');
      return true;
    }
    return false;
  }, []);

  const lock = useCallback(async (): Promise<void> => {
    try {
      await VaultBridge.lock();
    } finally {
      setState('READY_LOCKED');
    }
  }, []);

  const refreshStatus = useCallback(async (): Promise<VaultStatus | null> => {
    try {
      const status = await VaultBridge.getStatus();
      setVaultStatus(status);
      if (!status.is_initialized && status.is_unlocked) {
        setErrorMessage('Inconsistência de integridade na sessão do cofre.');
        setState('FATAL_ERROR');
      } else if (!status.is_initialized) {
        setState('UNINITIALIZED');
      } else if (!status.is_unlocked) {
        setState('READY_LOCKED');
      } else {
        setState('READY_UNLOCKED');
      }
      return status;
    } catch {
      setState('READY_LOCKED');
      return null;
    }
  }, []);

  const value: BootstrapContextValue = {
    state,
    vaultStatus,
    errorMessage,
    retry: runBootstrap,
    unlock,
    lock,
    refreshStatus,
  };

  return (
    <BootstrapContext.Provider value={value}>
      {/* 1. Tela com a Animação do Globo (Three.js Web3 Globe) */}
      {state === 'INITIALIZING' && (
        <SplashScreen
          enableThree={enableThreeAnimation}
          onAnimationComplete={handleAnimationComplete}
        />
      )}

      {/* 2. Tela de Aviso de Timeout da Interface (> 4.5s) */}
      {state === 'TIMEOUT_WARNING' && (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#0b0f19',
            p: 3,
          }}
        >
          <Card
            sx={{
              maxWidth: 480,
              p: 4,
              bgcolor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(145, 158, 171, 0.16)',
              textAlign: 'center',
            }}
          >
            <CircularProgress sx={{ color: 'warning.main', mb: 2 }} size={44} />
            <Typography variant="h6" sx={{ color: 'common.white', mb: 1 }}>
              Inicialização Demorada
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              A verificação do ambiente e banco seguro SQLite está demorando mais do que o esperado.
              Deseja tentar novamente?
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={runBootstrap}
              sx={{ fontWeight: 600 }}
            >
              Tentar Novamente
            </Button>
          </Card>
        </Box>
      )}

      {/* 3. Tela de Erro Fatal de Armazenamento Sanitizado */}
      {state === 'FATAL_ERROR' && (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#0b0f19',
            p: 3,
          }}
        >
          <Card
            sx={{
              maxWidth: 480,
              p: 4,
              bgcolor: 'rgba(26, 5, 5, 0.95)',
              border: '1px solid rgba(255, 86, 48, 0.3)',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: '#ff5630', mb: 1 }}>
              Falha de Inicialização do Cofre
            </Typography>
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {errorMessage || 'Falha de acesso ao armazenamento seguro local.'}
            </Alert>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={runBootstrap}
              sx={{ fontWeight: 600 }}
            >
              Tentar Novamente
            </Button>
          </Card>
        </Box>
      )}

      {/* 4. Banner Fiduciário Institucional de Modo Web */}
      {state === 'WEB_PREVIEW' && (
        <Alert
          severity="info"
          variant="filled"
          sx={{
            borderRadius: 0,
            bgcolor: 'rgba(2, 153, 219, 0.9)',
            py: 0.5,
            fontSize: '0.8rem',
            justifyContent: 'center',
          }}
        >
          <strong>Ambiente Web (Modo Demonstração)</strong> — Chaves criptográficas e cofre nativo de
          hardware operam exclusivamente no aplicativo Desktop nativo.
        </Alert>
      )}

      {/* 5. Renderização da Aplicação quando Pronta ou em Modo Web/Locked */}
      {(state === 'READY_UNLOCKED' ||
        state === 'READY_LOCKED' ||
        state === 'UNINITIALIZED' ||
        state === 'WEB_PREVIEW') &&
        children}
    </BootstrapContext.Provider>
  );
}
