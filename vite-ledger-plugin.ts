import type { Plugin } from 'vite';

import {
  MOCK_CITIZENS,
  MOCK_FINANCIAL_PROFILES,
} from './src/modules/ledger/domain/ledger-canonical-data.ts';

/**
 * ASPPIBRA DevOS — Vite Dev Plugin para Livro-Razão & Identidade
 *
 * Fornece endpoints mockados locais instantâneos para desenvolvimento Web,
 * eliminando erros de conexão ECONNREFUSED com backends não iniciados.
 */
export function cockpitLedgerPlugin(): Plugin {
  return {
    name: 'cockpit-ledger-mock',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();

        const url = new URL(req.url, 'http://localhost');
        const pathname = url.pathname;

        // 1. Endpoint de Associados / Cidadãos
        if (pathname === '/api/identity/citizens') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, data: MOCK_CITIZENS }));
          return;
        }

        // 2. Endpoint de Livro-Razão do Cidadão (/api/treasury/citizen/:id/ledger)
        const citizenMatch = pathname.match(/^\/api\/treasury\/citizen\/([^/]+)\/ledger$/);
        if (citizenMatch) {
          const citizenId = citizenMatch[1];
          const found =
            MOCK_FINANCIAL_PROFILES.find((p) => String(p.associate.id) === String(citizenId)) ||
            MOCK_FINANCIAL_PROFILES.find((p) =>
              p.associate.name.toLowerCase().includes(citizenId.toLowerCase())
            ) ||
            MOCK_FINANCIAL_PROFILES[0];

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, data: found }));
          return;
        }

        // 3. Endpoint de Analytics da Tesouraria
        if (pathname === '/api/treasury/analytics') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              success: true,
              data: {
                summary: {
                  totalInflow: 39223,
                  avgTicket: 933.88,
                  count: 42,
                  topRecipient: 'Tesouraria Consolidada ASPPIBRA',
                },
                monthlyTrend: [],
                distribution: [],
                availableYears: ['2026', '2025', '2024', '2023'],
                transactions: MOCK_FINANCIAL_PROFILES[0]?.transactions || [],
              },
            })
          );
          return;
        }

        next();
      });
    },
  };
}
