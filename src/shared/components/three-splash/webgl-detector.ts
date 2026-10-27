// ----------------------------------------------------------------------
// Utilitários de Diagnóstico de Ambiente Gráfico e Preferências de Acessibilidade
// ----------------------------------------------------------------------

/**
 * Verifica de forma segura e resiliente se o motor WebGL (ou WebGL2) está
 * disponível e operacional no WebView nativo (WebKitGTK no Linux, WebView2 no Windows).
 * Baseado no padrão canônico do Three.js capabilities detector.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      (window.WebGL2RenderingContext && canvas.getContext('webgl2')) ||
      (window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
    );
  } catch {
    return false;
  }
}

/**
 * Detecta se o usuário configurou no sistema operacional a preferência
 * por redução de movimento (prefers-reduced-motion).
 */
export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
