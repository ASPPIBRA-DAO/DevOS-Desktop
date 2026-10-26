/// <reference types="vitest" />
import path from 'path';
import checker from 'vite-plugin-checker';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { createRequire } from 'node:module';

import { cockpitRealEstateSqlitePlugin } from './vite-real-estate-plugin.ts';

const require = createRequire(import.meta.url);

const PORT = 8080;
const zodPath = path.dirname(require.resolve('zod/package.json'));

/**
 * Configuração Vite Multi-Edição exclusiva para o DevOS Desktop (Tauri v2).
 * Modos:
 * - 'node': DevOS Node (Edição Operador de Nós / Holders) -> dist-node
 * - 'cockpit': DevOS Cockpit (Edição Fundadores / Devs) -> dist-cockpit
 */
export default defineConfig(({ mode }) => {
  const isCockpit = mode === 'cockpit';
  const outDir = isCockpit ? 'dist-cockpit' : 'dist-node';
  const editionFile = isCockpit
    ? path.resolve(process.cwd(), 'src/app/editions/edition.cockpit.ts')
    : path.resolve(process.cwd(), 'src/app/editions/edition.node.ts');

  return {
    plugins: [
      cockpitRealEstateSqlitePlugin(),
      react(),
      checker({
        typescript: true,
        eslint: {
          useFlatConfig: true,
          lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
          dev: { logLevel: ['error'] },
        },
        overlay: {
          position: 'tl',
          initialIsOpen: false,
        },
        enableBuild: false,
      }),
    ],
    resolve: {
      alias: [
        {
          find: '@edition',
          replacement: editionFile,
        },
        {
          find: 'zod',
          replacement: zodPath,
        },
        {
          find: /^src\/components\/(.*)/,
          replacement: path.resolve(process.cwd(), 'src/shared/components/$1'),
        },
        {
          find: /^src(.+)/,
          replacement: path.resolve(process.cwd(), 'src/$1'),
        },
      ],
    },
    server: {
      port: PORT,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
    preview: { port: PORT, host: true },
    build: {
      outDir,
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: 'index.html',
        output: {
          manualChunks: undefined,
        },
      },
    },
    test: {
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
