import React from 'react';
import { HashRouter } from 'react-router';

import { AppRouter } from './router';
import { AppProviders } from './providers';
import { AppBootstrapProvider } from './bootstrap';

export function App() {
  return (
    <AppProviders>
      <AppBootstrapProvider>
        <HashRouter>
          <AppRouter />
        </HashRouter>
      </AppBootstrapProvider>
    </AppProviders>
  );
}

export default App;
