import React from 'react';

import { ThemeProvider } from './theme-provider';
import { ErrorBoundary } from './error-boundary';

export interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Composição dos provedores de contexto globais da aplicação DevOS Desktop.
 * 
 * Envolve a aplicação com o tema visual oficial e a fronteira de captura de erros.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default AppProviders;
