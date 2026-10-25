import React from 'react';

import { ThemeProvider as DevOSThemeProvider } from '../../theme/theme-provider';

/**
 * Provedor Global de Tema da Aplicação DevOS Desktop.
 * 
 * Camada de composição de aplicação (src/app/providers/) que integra o novo sistema
 * completo de temas, CSS Variables nativas, paletas e tipografia de src/theme/.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <DevOSThemeProvider>{children}</DevOSThemeProvider>;
}

export default ThemeProvider;
