import type { ReactNode } from 'react';

// ----------------------------------------------------------------------
// Contratos de Interface do Módulo de Inicialização 3D (Three.js)
// ----------------------------------------------------------------------

export interface ThreeSplashProps {
  /**
   * Callback invocado quando a animação 3D atinge seu ciclo final
   * ou quando o usuário opta por pular a animação (Esc / Botão).
   */
  onComplete?: () => void;

  /**
   * Duração nominal em milissegundos da animação cinematográfica de boot.
   * Padrão: 3500ms (3.5 segundos).
   */
  durationMs?: number;

  /**
   * Determina se o botão/atalho de pular [Esc] deve ser visível na interface.
   * Padrão: true.
   */
  showSkipButton?: boolean;

  /**
   * Ponto de encaixe modular (Slot) para substituição futura pela cena/modelo customizado do usuário.
   */
  slots?: {
    customScene?: ReactNode;
  };
}

// ----------------------------------------------------------------------
// Contratos do Globo Web3 (ThreeGlobe)
// ----------------------------------------------------------------------

export interface ArcData {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt?: number;
  color: string;
}

export interface Hotspot {
  lat: number;
  lng: number;
  size: number;
  connections?: number;
  color?: string;
}

export interface GlobeConfig {
  arcTime?: number;
  arcLength?: number;
  maxRings?: number;
  globeColor?: string;
  polygonColor?: string;
}

export interface Web3GlobeSceneProps {
  hotspots?: Hotspot[];
  globeConfig?: GlobeConfig;
  durationMs?: number;
  onProgress?: (progress: number) => void;
  onFinished?: () => void;
}

