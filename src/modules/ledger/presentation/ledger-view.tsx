import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { Iconify } from 'src/shared/components/iconify';

import { CitizenLedgerView } from './citizen-ledger';
import { DoubleEntryChartCard } from './components/double-entry-chart-card';

// ----------------------------------------------------------------------

export function LedgerView() {
  const [activeTab, setActiveTab] = useState<'macro' | 'citizen'>('macro');

  if (activeTab === 'citizen') {
    return (
      <Stack spacing={1.5} sx={{ minWidth: 0, width: '100%' }}>
        <Box
          className="no-print"
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            '@media print': { display: 'none !important' },
          }}
        >
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon={'solar:arrow-left-bold' as any} width={18} />}
            onClick={() => setActiveTab('macro')}
            sx={{ fontWeight: 700, borderRadius: 1.25 }}
          >
            Voltar ao Balanço Geral (Partidas Dobradas)
          </Button>
        </Box>
        <CitizenLedgerView />
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ minWidth: 0, width: '100%' }}>
      <DoubleEntryChartCard onOpenCitizenLedger={() => setActiveTab('citizen')} />
    </Stack>
  );
}
