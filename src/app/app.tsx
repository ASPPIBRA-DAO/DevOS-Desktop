import React from 'react';

import { AppRouter } from './router';
import { ThemeProvider } from '../shared/theme';

export function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  );
}

export default App;
