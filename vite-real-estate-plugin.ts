import type { Plugin } from 'vite';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = '/home/sandro/.local/share/br.aspp.devos.cockpit/real_estate/real_estate.sqlite';

function parseAddressToken(rawAddr: string | null, tokenPrefix: string): string | null {
  if (!rawAddr) return null;
  for (const part of rawAddr.split('|')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(tokenPrefix)) {
      const val = trimmed.slice(tokenPrefix.length).trim();
      if (val) return val;
    }
  }
  return null;
}

export function cockpitRealEstateSqlitePlugin(): Plugin {
  let db: DatabaseSync | null = null;

  try {
    db = new DatabaseSync(DB_PATH, { readOnly: true });
  } catch (err) {
    console.warn('[Cockpit SQLite Plugin] Banco SQLite WAL não encontrado ou inacessível:', err);
  }

  return {
    name: 'cockpit-real-estate-sqlite',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/real-estate')) {
          return next();
        }

        if (!db) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Database unavailable' }));
          return;
        }

        const url = new URL(req.url, 'http://localhost');
        const pathname = url.pathname;

        // 1. Estatísticas reais do banco
        if (pathname === '/api/real-estate/stats') {
          try {
            const totalProp = (db.prepare('SELECT COUNT(*) as cnt FROM properties').get() as { cnt: number })?.cnt ?? 0;
            const totalIdent = (db.prepare('SELECT COUNT(*) as cnt FROM property_identifiers').get() as { cnt: number })?.cnt ?? 0;
            const totalAddr = (db.prepare('SELECT COUNT(*) as cnt FROM addresses').get() as { cnt: number })?.cnt ?? 0;
            const totalBatches = (db.prepare('SELECT COUNT(*) as cnt FROM import_batches').get() as { cnt: number })?.cnt ?? 0;
            const totalBatchRecs = (db.prepare('SELECT COUNT(*) as cnt FROM import_batch_records').get() as { cnt: number })?.cnt ?? 0;
            const openFindings = (db.prepare("SELECT COUNT(*) as cnt FROM audit_findings WHERE analysis_status = 'OPEN'").get() as { cnt: number })?.cnt ?? 0;

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              total_properties: totalProp,
              total_identifiers: totalIdent,
              total_addresses: totalAddr,
              total_batches: totalBatches,
              total_batch_records: totalBatchRecs,
              open_findings_count: openFindings,
              pending_proposals_count: 0,
              db_path: `${DB_PATH} (WAL Ativo)`,
            }));
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e?.message }));
            return;
          }
        }

        // 2. Lista de propriedades reais com paginação e busca
        if (pathname === '/api/real-estate/properties') {
          try {
            const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 5000);
            const offset = parseInt(url.searchParams.get('offset') || '0', 10);
            const bairro = url.searchParams.get('bairro');
            const search = url.searchParams.get('search');

            let query = `
              SELECT 
                p.id, 
                p.uuid, 
                (SELECT pi.raw_value FROM property_identifiers pi WHERE pi.property_id = p.id AND pi.identifier_type LIKE '%MATRICULA%' ORDER BY pi.id ASC LIMIT 1) AS matricula,
                (SELECT pi.raw_value FROM property_identifiers pi WHERE pi.property_id = p.id AND pi.identifier_type = 'TITULAR_DECLARADO' ORDER BY pi.id ASC LIMIT 1) AS titular,
                a.neighborhood as bairro,
                a.street as rua,
                a.number as numero,
                a.complement as complemento,
                a.raw_address as address,
                p.created_at
              FROM properties p
              LEFT JOIN property_address_links pal ON pal.property_id = p.id AND pal.is_primary = 1
              LEFT JOIN addresses a ON a.id = pal.address_id
            `;

            const conditions: string[] = [];
            const params: (string | number)[] = [];

            if (bairro && bairro !== 'ALL') {
              conditions.push('a.neighborhood = ?');
              params.push(bairro);
            }

            if (search && search.trim()) {
              conditions.push('(a.street LIKE ? OR a.neighborhood LIKE ? OR (SELECT pi.raw_value FROM property_identifiers pi WHERE pi.property_id = p.id AND pi.identifier_type = \'TITULAR_DECLARADO\' LIMIT 1) LIKE ? OR (SELECT pi.raw_value FROM property_identifiers pi WHERE pi.property_id = p.id AND pi.identifier_type LIKE \'%MATRICULA%\' LIMIT 1) LIKE ?)');
              const s = `%${search.trim()}%`;
              params.push(s, s, s, s);
            }

            if (conditions.length > 0) {
              query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY p.id ASC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const rows = db.prepare(query).all(...params) as Array<{
              id: number;
              uuid: string;
              matricula: string | null;
              titular: string | null;
              bairro: string | null;
              rua: string | null;
              numero: string | null;
              complemento: string | null;
              address: string | null;
              created_at: string;
            }>;

            const formatted = rows.map((r) => ({
              id: r.id,
              uuid: r.uuid,
              identifier: r.matricula,
              identifier_type: r.matricula ? 'MATRICULA' : 'ORIGEM_FISICA',
              address: r.address,
              created_at: r.created_at,
              matricula: r.matricula,
              titular: r.titular?.trim() || null,
              bairro: r.bairro?.trim() || (r.complemento?.includes('CHÁCARAS DE INOÃ') ? 'CHÁCARAS DE INOÃ' : null),
              rua: r.rua?.trim() || null,
              numero: r.numero?.trim() || 'S/N',
              quadra: parseAddressToken(r.address, 'Qd:'),
              lote: parseAddressToken(r.address, 'Lt:'),
              complemento: r.complemento?.trim() || null,
              status: 'NORMALIZADO',
            }));

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
            if (conditions.length > 0) {
              try {
                const countSql = `SELECT count(p.id) as total FROM properties p LEFT JOIN property_address_links pal ON pal.property_id = p.id AND pal.is_primary = 1 LEFT JOIN addresses a ON a.id = pal.address_id WHERE ${conditions.join(' AND ')}`;
                const countRow = db.prepare(countSql).get(...params.slice(0, -2)) as { total: number } | undefined;
                res.setHeader('X-Total-Count', String(countRow?.total ?? 0));
              } catch {
                res.setHeader('X-Total-Count', String(formatted.length));
              }
            } else {
              res.setHeader('X-Total-Count', '145756');
            }
            res.end(JSON.stringify(formatted));
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e?.message }));
            return;
          }
        }

        // 3. Bairros distintos
        if (pathname === '/api/real-estate/neighborhoods') {
          try {
            const rows = db.prepare("SELECT DISTINCT neighborhood FROM addresses WHERE neighborhood IS NOT NULL AND trim(neighborhood) != '' ORDER BY neighborhood ASC").all() as Array<{ neighborhood: string }>;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(rows.map((r) => r.neighborhood)));
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e?.message }));
            return;
          }
        }

        // 4. Exportação completa da planilha em formato CSV com streaming de alta velocidade
        if (pathname === '/api/real-estate/export-csv') {
          try {
            const bairro = url.searchParams.get('bairro');
            const search = url.searchParams.get('search');

            let query = `
              SELECT 
                p.id, 
                (SELECT pi.raw_value FROM property_identifiers pi WHERE pi.property_id = p.id AND pi.identifier_type LIKE '%MATRICULA%' ORDER BY pi.id ASC LIMIT 1) AS matricula,
                (SELECT pi.raw_value FROM property_identifiers pi WHERE pi.property_id = p.id AND pi.identifier_type = 'TITULAR_DECLARADO' ORDER BY pi.id ASC LIMIT 1) AS titular,
                a.neighborhood as bairro,
                a.street as rua,
                a.number as numero,
                a.complement as complemento,
                a.raw_address as address
              FROM properties p
              LEFT JOIN property_address_links pal ON pal.property_id = p.id AND pal.is_primary = 1
              LEFT JOIN addresses a ON a.id = pal.address_id
            `;

            const conditions: string[] = [];
            const params: (string | number)[] = [];

            if (bairro && bairro !== 'ALL') {
              conditions.push('a.neighborhood = ?');
              params.push(bairro);
            }

            if (search && search.trim()) {
              conditions.push('(a.street LIKE ? OR a.neighborhood LIKE ? OR (SELECT pi.raw_value FROM property_identifiers pi WHERE pi.property_id = p.id AND pi.identifier_type = \'TITULAR_DECLARADO\' LIMIT 1) LIKE ?)');
              const s = `%${search.trim()}%`;
              params.push(s, s, s);
            }

            if (conditions.length > 0) {
              query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY p.id ASC';

            const filename = bairro && bairro !== 'ALL'
              ? `cadastro-imobiliario-marica-${bairro.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`
              : 'cadastro-imobiliario-marica-completo-145756.csv';

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.write('\uFEFF'); // UTF-8 BOM para garantir acentuação correta no Excel
            res.write('ID;Matrícula;Contribuinte;Bairro;Logradouro;Número;Quadra;Lote;Complemento\n');

            const stmt = db.prepare(query);
            for (const r of stmt.iterate(...params) as Iterable<{
              id: number;
              matricula: string | null;
              titular: string | null;
              bairro: string | null;
              rua: string | null;
              numero: string | null;
              complemento: string | null;
              address: string | null;
            }>) {
              const qd = parseAddressToken(r.address, 'Qd:') || '';
              const lt = parseAddressToken(r.address, 'Lt:') || '';
              const line = [
                r.id,
                `"${(r.matricula || '').replace(/"/g, '""')}"`,
                `"${(r.titular || '').replace(/"/g, '""')}"`,
                `"${(r.bairro || '').replace(/"/g, '""')}"`,
                `"${(r.rua || '').replace(/"/g, '""')}"`,
                `"${(r.numero || 'S/N').replace(/"/g, '""')}"`,
                `"${qd.replace(/"/g, '""')}"`,
                `"${lt.replace(/"/g, '""')}"`,
                `"${(r.complemento || '').replace(/"/g, '""')}"`,
              ].join(';') + '\n';
              res.write(line);
            }

            res.end();
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e?.message }));
            return;
          }
        }

        next();
      });
    },
  };
}
