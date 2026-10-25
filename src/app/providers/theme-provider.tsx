import React, { useMemo } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

import { devosTheme } from '../../shared/theme/theme-provider';

/**
 * Provedor Global de Tema da Aplicação DevOS Desktop.
 * 
 * Camada de composição de aplicação (src/app/providers/) que integra o MuiThemeProvider,
 * a estilização de CssBaseline (com atmosfera radial e vidromorfismo) e a hierarquia de componentes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useMemo(() => devosTheme, []);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

export default ThemeProvider;
