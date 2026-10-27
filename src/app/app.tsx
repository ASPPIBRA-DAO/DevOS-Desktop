import React from 'react';
import { HashRouter } from 'react-router';

import { AppRouter } from './router';
import { ThemeProvider, ErrorBoundary, AppBootstrapProvider } from './providers';

export function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <ErrorBoundary>
          <AppBootstrapProvider>
            <AppRouter />
          </AppBootstrapProvider>
        </ErrorBoundary>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
