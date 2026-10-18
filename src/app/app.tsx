import React from 'react';

import { AppRouter } from './router';
import { ThemeProvider } from '../shared/theme';
import { ErrorBoundary } from './providers/error-boundary';

export function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
