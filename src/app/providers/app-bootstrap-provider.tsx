import type { VaultStatus } from 'src/platform/tauri/contracts/vault-contracts';

import React, {
  useRef,
  useMemo,
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
// Estados e contratos públicos
// ----------------------------------------------------------------------

export type BootstrapState =
  | 'INITIALIZING'
  | 'READY_UNLOCKED'
  | 'READY_LOCKED'
  | 'UNINITIALIZED'
  | 'WEB_PREVIEW'
  | 'TIMEOUT_WARNING'
  | 'FATAL_ERROR';

export interface BootstrapContextValue {
  state: BootstrapState;
  vaultStatus: VaultStatus | null;
  errorMessage: string | null;
  retry: () => void;
  unlock: (password: string) => Promise<boolean>;
  lock: () => Promise<void>;
  refreshStatus: () => Promise<VaultStatus | null>;
}

type Props = {
  children: React.ReactNode;
  timeoutMs?: number;
  enableThreeAnimation?: boolean;
};

const BootstrapContext = createContext<BootstrapContextValue | null>(null);

// ----------------------------------------------------------------------
// Integração segura com callbacks opcionais do splash
// ----------------------------------------------------------------------

type DevOSWindow = Window & {
  __DEVOS_UPDATE_SPLASH_STAGE__?: (
    text: string,
    progress?: number
  ) => void;

  __DEVOS_FINISH_SPLASH__?: () => void;
};

/**
 * A atualização visual do splash não pode interromper
 * a inicialização do subsistema nativo.
 */
function notifySplashStage(
  text: string,
  progress?: number
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const updater = (window as DevOSWindow)
      .__DEVOS_UPDATE_SPLASH_STAGE__;

    if (typeof updater === 'function') {
      updater(text, progress);
    }
  } catch {
    // Uma falha visual não deve interromper o bootstrap.
  }
}

/**
 * Finaliza a tela HTML inicial, quando o callback estiver disponível.
 */
function finishSplashIfAvailable(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const finishSplash = (window as DevOSWindow)
      .__DEVOS_FINISH_SPLASH__;

    if (typeof finishSplash === 'function') {
      finishSplash();
    }
  } catch {
    // O callback é opcional e não controla o estado do cofre.
  }
}

// ----------------------------------------------------------------------
// Operações de janela: tratamento de exceções e rejeições
// ----------------------------------------------------------------------

/**
 * Executa uma operação de janela sem permitir que uma falha
 * de interface produza uma rejeição assíncrona não tratada.
 *
 * O erro bruto não é enviado ao log.
 */
function runBestEffortWindowAction(
  action: () => unknown,
  failureMessage: string
): void {
  try {
    void Promise.resolve(action()).catch(() => {
      console.warn(failureMessage);
    });
  } catch {
    console.warn(failureMessage);
  }
}

// ----------------------------------------------------------------------
// Validação dos campos essenciais recebidos pelo IPC
// ----------------------------------------------------------------------

/**
 * Valida os dois campos utilizados nas decisões de segurança
 * desta máquina de estados.
 *
 * A validação integral de VaultStatus pertence também à fronteira
 * do contrato IPC, cuja implementação deve ser auditada separadamente.
 */
function hasValidVaultFlags(
  value: unknown
): value is {
  is_initialized: boolean;
  is_unlocked: boolean;
} {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.is_initialized === 'boolean' &&
    typeof record.is_unlocked === 'boolean'
  );
}

// ----------------------------------------------------------------------
// Resolução da máquina de estados a partir do status nativo
// ----------------------------------------------------------------------

type VaultStateResolution = {
  state: BootstrapState;
  errorMessage: string | null;
};

function resolveVaultState(
  status: VaultStatus
): VaultStateResolution {
  // Uma sessão desbloqueada sem cofre inicializado é inconsistente.
  if (!status.is_initialized && status.is_unlocked) {
    return {
      state: 'FATAL_ERROR',
      errorMessage:
        'Inconsistência de integridade na sessão do cofre.',
    };
  }

  if (!status.is_initialized) {
    return {
      state: 'UNINITIALIZED',
      errorMessage: null,
    };
  }

  if (!status.is_unlocked) {
    return {
      state: 'READY_LOCKED',
      errorMessage: null,
    };
  }

  return {
    state: 'READY_UNLOCKED',
    errorMessage: null,
  };
}

// ----------------------------------------------------------------------
// Tratamento seguro de erros desconhecidos
// ----------------------------------------------------------------------

/**
 * Extrai texto de erro somente quando a mensagem é realmente uma string.
 * Não pressupõe que todas as rejeições sejam instâncias de Error.
 */
function extractErrorText(error: unknown): string {
  try {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return typeof error.message === 'string'
        ? error.message
        : '';
    }

    if (typeof error === 'object' && error !== null) {
      const record = error as Record<string, unknown>;

      return typeof record.message === 'string'
        ? record.message
        : '';
    }
  } catch {
    // Um valor de erro malformado não deve interromper o tratamento.
  }

  return '';
}

/**
 * Traduz erros nativos para mensagens permitidas na interface.
 * A mensagem bruta nunca é exibida ao usuário.
 */
function getBootstrapErrorMessage(
  error: unknown
): string {
  const rawMessage = extractErrorText(error);

  if (rawMessage.includes('VAULT_STORAGE_ERR')) {
    return (
      'Falha de acesso ao armazenamento seguro local ' +
      '(devos_vault.sqlite).'
    );
  }

  return (
    'Erro inesperado na inicialização do subsistema nativo ' +
    'do cofre.'
  );
}

// ----------------------------------------------------------------------
// Contexto público
// ----------------------------------------------------------------------

export function useBootstrap(): BootstrapContextValue {
  const context = useContext(BootstrapContext);

  if (!context) {
    throw new Error(
      'useBootstrap deve ser utilizado dentro de um ' +
      '<AppBootstrapProvider />'
    );
  }

  return context;
}

// ----------------------------------------------------------------------
// Provedor de bootstrap
// ----------------------------------------------------------------------

export function AppBootstrapProvider({
  children,
  timeoutMs = 4500,
  enableThreeAnimation = false,
}: Props) {
  const [state, setState] =
    useState<BootstrapState>('INITIALIZING');

  const [vaultStatus, setVaultStatus] =
    useState<VaultStatus | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  // ------------------------------------------------------------
  // Controle das tentativas de bootstrap
  // ------------------------------------------------------------

  const attemptSeqRef = useRef(0);

  const activeAttemptIdRef =
    useRef<number | null>(null);

  const timerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  // ------------------------------------------------------------
  // Sequenciamento das operações assíncronas
  // ------------------------------------------------------------

  /**
   * A sequência de operações protege as atualizações de estado
   * de bootstrap, refreshStatus, unlock e lock.
   *
   * Não substitui a sincronização ou a exclusão mútua nativa.
   */
  const operationSeqRef = useRef(0);

  // ------------------------------------------------------------
  // Controle da animação e do destino pendente
  // ------------------------------------------------------------

  const isAnimationDoneRef = useRef<boolean>(
    !enableThreeAnimation
  );

  const pendingTargetStateRef =
    useRef<BootstrapState | null>(null);

  /**
   * Identifica a instância da animação correspondente
   * à tentativa atual do bootstrap.
   */
  const [splashAttemptId, setSplashAttemptId] =
    useState(0);

  // ------------------------------------------------------------
  // Invalidação de operações anteriores
  // ------------------------------------------------------------

  /**
   * Invalida resultados assíncronos anteriores e limpa
   * o timer associado a uma tentativa de bootstrap ativa.
   */
  const beginStateOperation = useCallback((): number => {
    const operationId = ++operationSeqRef.current;

    activeAttemptIdRef.current = null;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    pendingTargetStateRef.current = null;

    return operationId;
  }, []);

  // ------------------------------------------------------------
  // Gate da animação
  // ------------------------------------------------------------

  const handleAnimationComplete = useCallback(
    (attemptId: number) => {
      // Uma animação antiga não pode concluir uma tentativa nova.
      if (attemptId !== attemptSeqRef.current) {
        return;
      }

      isAnimationDoneRef.current = true;

      const nextState = pendingTargetStateRef.current;

      if (nextState !== null) {
        pendingTargetStateRef.current = null;
        setState(nextState);
      }
    },
    []
  );

  /**
   * Mantém estável o callback enquanto o identificador da tentativa
   * não mudar, evitando reinicializações desnecessárias da animação.
   */
  const onSplashAnimationComplete = useCallback(() => {
    handleAnimationComplete(splashAttemptId);
  }, [
    handleAnimationComplete,
    splashAttemptId,
  ]);

  // ------------------------------------------------------------
  // Bootstrap: inicialização, handshake IPC e timeout
  // ------------------------------------------------------------

  const runBootstrap = useCallback(() => {
    // Invalida imediatamente os resultados da tentativa anterior.
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const attemptId = ++attemptSeqRef.current;

    const operationId = ++operationSeqRef.current;

    activeAttemptIdRef.current = attemptId;

    setSplashAttemptId(attemptId);

    // Restabelece os invariantes da nova execução.
    isAnimationDoneRef.current = !enableThreeAnimation;

    pendingTargetStateRef.current = null;

    setState('INITIALIZING');
    setVaultStatus(null);
    setErrorMessage(null);

    // A falha na operação de janela não deve impedir o bootstrap.
    runBestEffortWindowAction(
      () => WindowBridge.reset(),
      'Não foi possível redefinir o estado da janela.'
    );

    notifySplashStage(
      'VALIDANDO AMBIENTE DE SEGURANÇA...',
      20
    );

    const isCurrentAttempt = (): boolean =>
      activeAttemptIdRef.current === attemptId &&
      operationSeqRef.current === operationId;

    // ----------------------------------------------------------
    // Execução em navegador: modo de demonstração
    // ----------------------------------------------------------

    if (!isTauriDesktop()) {
      activeAttemptIdRef.current = null;

      if (isAnimationDoneRef.current) {
        setState('WEB_PREVIEW');
      } else {
        pendingTargetStateRef.current = 'WEB_PREVIEW';
      }

      return;
    }

    // ----------------------------------------------------------
    // Timeout de experiência do usuário
    // ----------------------------------------------------------

    timerRef.current = setTimeout(() => {
      if (!isCurrentAttempt()) {
        return;
      }

      // O timeout invalida imediatamente a tentativa pendente.
      activeAttemptIdRef.current = null;
      timerRef.current = null;

      pendingTargetStateRef.current = null;

      // A animação não deve bloquear a apresentação do aviso.
      isAnimationDoneRef.current = true;

      setState('TIMEOUT_WARNING');
    }, timeoutMs);

    notifySplashStage(
      'VERIFICANDO DISPONIBILIDADE DO COFRE LOCAL...',
      45
    );

    // ----------------------------------------------------------
    // Handshake IPC com o backend Rust
    // ----------------------------------------------------------

    VaultBridge.getStatus()
      .then((status) => {
        // Descarta respostas atrasadas ou operações invalidadas.
        if (!isCurrentAttempt()) {
          return;
        }

        // Não interpretar uma resposta malformada como primeiro acesso.
        if (!hasValidVaultFlags(status)) {
          activeAttemptIdRef.current = null;

          if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }

          pendingTargetStateRef.current = null;
          isAnimationDoneRef.current = true;

          setVaultStatus(null);

          setErrorMessage(
            'Não foi possível validar a resposta do subsistema nativo.'
          );

          setState('FATAL_ERROR');

          return;
        }

        // O handshake foi concluído no prazo e a resposta é válida.
        activeAttemptIdRef.current = null;

        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        setVaultStatus(status);

        notifySplashStage(
          'VERIFICANDO CONECTIVIDADE COM A REDE IPFS...',
          75
        );

        const resolution = resolveVaultState(status);

        setErrorMessage(resolution.errorMessage);

        // Falha crítica: não aguardar a animação para exibi-la.
        if (resolution.state === 'FATAL_ERROR') {
          pendingTargetStateRef.current = null;
          isAnimationDoneRef.current = true;

          setState('FATAL_ERROR');

          return;
        }

        notifySplashStage(
          'PREPARANDO AMBIENTE DE OPERAÇÃO...',
          90
        );

        // Portão duplo: IPC concluído + animação concluída.
        if (isAnimationDoneRef.current) {
          setState(resolution.state);
        } else {
          pendingTargetStateRef.current = resolution.state;
        }
      })
      .catch((error: unknown) => {
        // Não permitir que uma rejeição antiga altere o estado.
        if (!isCurrentAttempt()) {
          return;
        }

        activeAttemptIdRef.current = null;
        pendingTargetStateRef.current = null;

        isAnimationDoneRef.current = true;

        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        setVaultStatus(null);

        setErrorMessage(
          getBootstrapErrorMessage(error)
        );

        setState('FATAL_ERROR');
      });
  }, [
    timeoutMs,
    enableThreeAnimation,
  ]);

  // ------------------------------------------------------------
  // Ciclo de vida do bootstrap
  // ------------------------------------------------------------

  useEffect(() => {
    runBootstrap();

    return () => {
      // Invalida callbacks pendentes durante o cleanup.
      activeAttemptIdRef.current = null;

      operationSeqRef.current += 1;
      attemptSeqRef.current += 1;

      pendingTargetStateRef.current = null;

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [runBootstrap]);

  // ------------------------------------------------------------
  // Restauração e dimensionamento da janela
  // ------------------------------------------------------------

  useEffect(() => {
    if (
      state === 'UNINITIALIZED' ||
      state === 'READY_LOCKED'
    ) {
      runBestEffortWindowAction(
        () => WindowBridge.setFullscreen(true),
        'Não foi possível ajustar a janela para a autenticação.'
      );
    } else if (state === 'READY_UNLOCKED') {
      runBestEffortWindowAction(
        () => WindowBridge.restoreWindowAfterBoot(),
        'Não foi possível restaurar as dimensões da janela.'
      );
    }
  }, [state]);

  // ------------------------------------------------------------
  // Finalização da splash nativa
  // ------------------------------------------------------------

  useEffect(() => {
    if (state !== 'INITIALIZING') {
      finishSplashIfAvailable();
    }
  }, [state]);

  // ------------------------------------------------------------
  // Atualização do status nativo
  // ------------------------------------------------------------

  const refreshStatus =
    useCallback(async (): Promise<VaultStatus | null> => {
      const operationId = beginStateOperation();

      try {
        const status = await VaultBridge.getStatus();

        // Descarta resultados substituídos por outra operação.
        if (operationSeqRef.current !== operationId) {
          return null;
        }

        if (!hasValidVaultFlags(status)) {
          throw new Error('INVALID_VAULT_STATUS');
        }

        setVaultStatus(status);

        const resolution = resolveVaultState(status);

        setErrorMessage(resolution.errorMessage);
        setState(resolution.state);

        return status;
      } catch {
        // Só a operação vigente pode alterar o estado.
        if (operationSeqRef.current === operationId) {
          // O status anterior não representa mais uma confirmação atual.
          setVaultStatus(null);

          setErrorMessage(
            'Não foi possível confirmar o estado atual do cofre.'
          );

          // Não afirmar READY_LOCKED sem confirmação do backend.
          setState('FATAL_ERROR');
        }

        return null;
      }
    }, [
      beginStateOperation,
    ]);

  // ------------------------------------------------------------
  // Desbloqueio
  // ------------------------------------------------------------

  const unlock = useCallback(
    async (password: string): Promise<boolean> => {
      const operationId = beginStateOperation();

      setErrorMessage(null);

      try {
        const ok = await VaultBridge.unlock(password);

        // Uma operação posterior invalida esta atualização.
        if (operationSeqRef.current !== operationId) {
          return false;
        }

        if (!ok) {
          return false;
        }

        // Mantém o status em sincronia com o comando confirmado.
        setVaultStatus((currentStatus) =>
          currentStatus
            ? {
                ...currentStatus,
                is_unlocked: true,
              }
            : currentStatus
        );

        setErrorMessage(null);
        setState('READY_UNLOCKED');

        return true;
      } catch {
        if (operationSeqRef.current === operationId) {
          setErrorMessage(
            'Não foi possível concluir o desbloqueio do cofre.'
          );
        }

        // Preserva o contrato Promise<boolean>.
        return false;
      }
    },
    [
      beginStateOperation,
    ]
  );

  // ------------------------------------------------------------
  // Bloqueio
  // ------------------------------------------------------------

  const lock = useCallback(
    async (): Promise<void> => {
      const operationId = beginStateOperation();

      setErrorMessage(null);

      try {
        await VaultBridge.lock();

        if (operationSeqRef.current !== operationId) {
          return;
        }

        // Mantém o status em sincronia com o comando confirmado.
        setVaultStatus((currentStatus) =>
          currentStatus
            ? {
                ...currentStatus,
                is_unlocked: false,
              }
            : currentStatus
        );

        setErrorMessage(null);
        setState('READY_LOCKED');
      } catch {
        // Não registrar o objeto de erro nativo bruto.
        if (operationSeqRef.current !== operationId) {
          return;
        }

        console.warn(
          'Falha ao bloquear o cofre; verificando o estado atual.'
        );

        // O estado será determinado por uma nova consulta nativa.
        await refreshStatus();
      }
    },
    [
      beginStateOperation,
      refreshStatus,
    ]
  );

  // ------------------------------------------------------------
  // Contexto memoizado
  // ------------------------------------------------------------

  const value = useMemo<BootstrapContextValue>(
    () => ({
      state,
      vaultStatus,
      errorMessage,
      retry: runBootstrap,
      unlock,
      lock,
      refreshStatus,
    }),
    [
      state,
      vaultStatus,
      errorMessage,
      runBootstrap,
      unlock,
      lock,
      refreshStatus,
    ]
  );

  // ------------------------------------------------------------
  // Interface
  // ------------------------------------------------------------

  return (
    <BootstrapContext.Provider value={value}>
      {/* 1. Tela com a animação do globo */}
      {state === 'INITIALIZING' && (
        <SplashScreen
          key={splashAttemptId}
          enableThree={enableThreeAnimation}
          onAnimationComplete={onSplashAnimationComplete}
        />
      )}

      {/* 2. Aviso de timeout da inicialização */}
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
            <CircularProgress
              sx={{
                color: 'warning.main',
                mb: 2,
              }}
              size={44}
            />

            <Typography
              variant="h6"
              sx={{
                color: 'common.white',
                mb: 1,
              }}
            >
              Inicialização Demorada
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mb: 3,
              }}
            >
              A verificação do ambiente e do banco seguro
              SQLite está demorando mais do que o esperado.
              Deseja tentar novamente?
            </Typography>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={runBootstrap}
              sx={{
                fontWeight: 600,
              }}
            >
              Tentar Novamente
            </Button>
          </Card>
        </Box>
      )}

      {/* 3. Erro fatal de inicialização */}
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
            <Typography
              variant="h6"
              sx={{
                color: '#ff5630',
                mb: 1,
              }}
            >
              Falha de Inicialização do Cofre
            </Typography>

            <Alert
              severity="error"
              sx={{
                mb: 3,
                textAlign: 'left',
              }}
            >
              {errorMessage ||
                'Falha ao confirmar o estado do armazenamento seguro local.'}
            </Alert>

            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={runBootstrap}
              sx={{
                fontWeight: 600,
              }}
            >
              Tentar Novamente
            </Button>
          </Card>
        </Box>
      )}

      {/* 4. Aviso do modo de demonstração web */}
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
          <strong>
            Ambiente Web (Modo Demonstração)
          </strong>{' '}
          — Chaves criptográficas e cofre nativo de hardware
          operam exclusivamente no aplicativo Desktop nativo.
        </Alert>
      )}

      {/* 5. Aplicação pronta, bloqueada ou em modo web */}
      {(
        state === 'READY_UNLOCKED' ||
        state === 'READY_LOCKED' ||
        state === 'UNINITIALIZED' ||
        state === 'WEB_PREVIEW'
      ) && children}
    </BootstrapContext.Provider>
  );
}
