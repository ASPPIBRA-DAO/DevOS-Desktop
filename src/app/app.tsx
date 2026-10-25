import React from 'react';
import { HashRouter } from 'react-router';

import { AppRouter } from './router';
import { ThemeProvider, ErrorBoundary } from './providers';

export function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
