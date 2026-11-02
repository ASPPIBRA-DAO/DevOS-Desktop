import React from 'react';

import { Snackbar } from 'src/shared/components/snackbar';

import { ThemeProvider } from './theme-provider';
import { ErrorBoundary } from './error-boundary';

export interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Composição dos provedores de contexto globais da aplicação DevOS Desktop.
 * 
 * Envolve a aplicação com o tema visual oficial, fronteira de captura de erros e sistema de notificações toast.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        {children}
        <Snackbar />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default AppProviders;
