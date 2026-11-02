import React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const metadata = { title: `DevOS Cockpit - Infrastructure - ${CONFIG.appName}` };

const MOCK_NODES = [
  { id: 'node-gru-01', location: 'São Paulo (GRU)', status: 'HEALTHY', latency: '4ms', load: '18%' },
  { id: 'node-gig-01', location: 'Rio de Janeiro (GIG)', status: 'HEALTHY', latency: '9ms', load: '12%' },
  { id: 'node-mia-01', location: 'Miami (MIA)', status: 'HEALTHY', latency: '32ms', load: '45%' },
  { id: 'node-iad-01', location: 'Virginia (IAD)', status: 'HEALTHY', latency: '41ms', load: '38%' },
];

const MOCK_BUCKETS = [
  { name: 'asppibra-dao-vault-artifacts', objects: '14,290', size: '4.8 GB', region: 'WNAM / SAO' },
  { name: 'asppibra-dao-audit-backups', objects: '94,102', size: '12.4 GB', region: 'EEUR / SAO' },
  { name: 'asppibra-dao-public-cdn', objects: '1,048', size: '820 MB', region: 'Global Anycast' },
];

export function InfrastructurePage() {
  return (
    <>
      <title>{metadata.title}</title>

      <Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto', width: '100%' }}>
        {/* Header */}
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#F8FAFC' }}>
              Cloudflare Edge & Infrastructure Mesh
            </Typography>
            <Chip
              label="READ ONLY MOCK"
              size="small"
              sx={{
                bgcolor: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                fontWeight: 700,
                fontSize: '0.68rem',
              }}
            />
          </Stack>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            Topologia de roteamento edge, distribuição de carga e status dos nós regionais (INV-001).
          </Typography>
        </Box>

        {/* Nodes Grid */}
        <Grid container spacing={2}>
          {MOCK_NODES.map((node) => (
            <Grid key={node.id} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 2.5, bgcolor: '#0F172A', border: '1px solid #1E293B', borderRadius: 2 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontFamily: 'monospace' }}>
                    {node.id}
                  </Typography>
                  <Chip
                    label={node.status}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      bgcolor: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                    }}
                  />
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#F1F5F9', mb: 1 }}>
                  {node.location}
                </Typography>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Latency: <strong style={{ color: '#10B981' }}>{node.latency}</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Load: <strong style={{ color: '#38BDF8' }}>{node.load}</strong>
                  </Typography>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Storage Buckets Matrix */}
        <Card sx={{ p: 3, bgcolor: '#0F172A', border: '1px solid #1E293B', borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#F8FAFC', mb: 2 }}>
            R2 Object Storage Buckets (Emulated)
          </Typography>

          <Stack spacing={1.5}>
            {MOCK_BUCKETS.map((b) => (
              <Box
                key={b.name}
                sx={{
                  p: 2,
                  bgcolor: '#0B0F17',
                  border: '1px solid #1E293B',
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Iconify icon="solar:box-minimalistic-bold" width={20} sx={{ color: '#38BDF8' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#F1F5F9', fontFamily: 'monospace' }}>
                      {b.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Region: {b.region}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    {b.objects} Objects
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 700, fontFamily: 'monospace' }}>
                    {b.size}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Card>
      </Stack>
    </>
  );
}

export default InfrastructurePage;
