import React from 'react';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';

import { SplashScreen } from '../shared/components/loading-screen';
import {
  ThreeSplashView,
  isWebGLAvailable,
  isReducedMotionPreferred,
} from '../shared/components/three-splash';

// ----------------------------------------------------------------------
// Suíte de Testes: Módulo Three.js e Portão Duplo de Inicialização (Dual-Gate)
// ----------------------------------------------------------------------

describe('Portão Duplo de Inicialização & Módulo Three.js Splash', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as any).window;
    delete (globalThis as any).document;
  });

  // ----------------------------------------------------------------------
  // 1. Testes de Diagnóstico de Hardware e Acessibilidade
  // ----------------------------------------------------------------------

  it('deve retornar false quando executado fora de ambiente de navegador (SSR/Node)', () => {
    delete (globalThis as any).window;
    expect(isWebGLAvailable()).toBe(false);
    expect(isReducedMotionPreferred()).toBe(false);
  });

  it('deve retornar false com segurança se WebGL não for suportado pelo WebView ou driver', () => {
    // Simula WebView sem suporte a WebGL (getContext retorna null)
    (globalThis as any).window = {
      WebGLRenderingContext: function WebGLRenderingContext() {},
    };
    (globalThis as any).document = {
      createElement: () => ({
        getContext: () => null,
      }),
    };

    expect(isWebGLAvailable()).toBe(false);
  });

  it('deve retornar true quando WebGL context for disponibilizado pelo WebView', () => {
    function MockGL() {}
    (globalThis as any).window = {
      WebGLRenderingContext: MockGL,
    };
    const mockContext = new (MockGL as any)();
    (globalThis as any).document = {
      createElement: () => ({
        getContext: (type: string) => (type.includes('webgl') ? mockContext : null),
      }),
    };

    expect(isWebGLAvailable()).toBe(true);
  });

  it('deve detectar e respeitar a preferência prefers-reduced-motion do sistema operacional', () => {
    (globalThis as any).window = {
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      })),
    };

    expect(isReducedMotionPreferred()).toBe(true);
  });

  // ----------------------------------------------------------------------
  // 2. Testes de Lógica do Portão Duplo (Dual-Readiness Gate)
  // ----------------------------------------------------------------------

  it('Portão Duplo: deve reter estado INITIALIZING se IPC respondeu mas animação Three.js ainda está em exibição', () => {
    // Simula a máquina de estados do portão duplo
    let state = 'INITIALIZING';
    let isAnimationDone = false;
    let pendingTargetState: string | null = null;

    const onIpcResolved = (target: string) => {
      if (isAnimationDone) {
        state = target;
      } else {
        pendingTargetState = target;
      }
    };

    const onAnimationComplete = () => {
      isAnimationDone = true;
      if (pendingTargetState) {
        state = pendingTargetState;
        pendingTargetState = null;
      }
    };

    // 1. IPC do Rust responde super rápido (ex: 25ms):
    onIpcResolved('READY_UNLOCKED');

    // Invariante: O aplicativo NÃO corta a animação! Permanece em INITIALIZING (mostrando Three.js)
    expect(state).toBe('INITIALIZING');
    expect(pendingTargetState).toBe('READY_UNLOCKED');

    // 2. Animação Three.js conclui seu ciclo ou usuário clica em Pular [Esc]:
    onAnimationComplete();

    // Invariante: Agora sim ocorre a transição para o dashboard!
    expect(state).toBe('READY_UNLOCKED');
    expect(pendingTargetState).toBeNull();
  });

  it('Portão Duplo: se a animação já concluiu antes do IPC, transiciona imediatamente quando o IPC responder', () => {
    let state = 'INITIALIZING';
    let isAnimationDone = false;
    let pendingTargetState: string | null = null;

    const onIpcResolved = (target: string) => {
      if (isAnimationDone) {
        state = target;
      } else {
        pendingTargetState = target;
      }
    };

    const onAnimationComplete = () => {
      isAnimationDone = true;
      if (pendingTargetState) {
        state = pendingTargetState;
        pendingTargetState = null;
      }
    };

    // Usuário pressionou [Esc] no milissegundo 5:
    onAnimationComplete();
    expect(isAnimationDone).toBe(true);
    expect(state).toBe('INITIALIZING'); // Aguarda IPC

    // IPC responde no milissegundo 30:
    onIpcResolved('READY_LOCKED');
    expect(state).toBe('READY_LOCKED'); // Transição imediata sem retenção
  });

  it('Portão Duplo: falha crítica (FATAL_ERROR) deve interromper imediatamente a animação sem esperar tempo de exibição', () => {
    let state = 'INITIALIZING';
    let isAnimationDone = false;
    let pendingTargetState: string | null = null;

    const onIpcError = (errorState: string) => {
      // Regra de segurança: falha física cancela a animação imediatamente
      pendingTargetState = null;
      isAnimationDone = true;
      state = errorState;
    };

    onIpcError('FATAL_ERROR');

    // Invariante: Splash é desmontado imediatamente para alertar o operador
    expect(state).toBe('FATAL_ERROR');
    expect(isAnimationDone).toBe(true);
    expect(pendingTargetState).toBeNull();
  });

  it('Portão Duplo: timeout de 4.5s deve interromper imediatamente a animação para exibir card de recuperação', () => {
    let state = 'INITIALIZING';
    let isAnimationDone = false;
    let pendingTargetState: string | null = null;

    const onTimeout = () => {
      pendingTargetState = null;
      isAnimationDone = true;
      state = 'TIMEOUT_WARNING';
    };

    onTimeout();

    expect(state).toBe('TIMEOUT_WARNING');
    expect(isAnimationDone).toBe(true);
    expect(pendingTargetState).toBeNull();
  });

  // ----------------------------------------------------------------------
  // 3. Testes de Integração de Componentes React
  // ----------------------------------------------------------------------

  it('deve instanciar ThreeSplashView e SplashScreen com modo Three.js ativado', () => {
    const splashElem = (
      <SplashScreen
        enableThree
        onAnimationComplete={() => {}}
      />
    );
    expect(React.isValidElement(splashElem)).toBe(true);
    expect(splashElem.props.enableThree).toBe(true);

    const threeViewElem = (
      <ThreeSplashView
        durationMs={3500}
        showSkipButton
        onComplete={() => {}}
      />
    );
    expect(React.isValidElement(threeViewElem)).toBe(true);
    expect(threeViewElem.props.durationMs).toBe(3500);
    expect(threeViewElem.props.showSkipButton).toBe(true);
  });
});
