import '@fontsource-variable/inter';
import '@fontsource-variable/public-sans';
import './global.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './app/app';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Falha ao localizar elemento raiz #root no DOM.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
