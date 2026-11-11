import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { RouterLink } from 'src/app/router/components/router-link';

import { Iconify } from 'src/shared/components/iconify';

export function AppChatHubSummary() {
  const channels = [
    { id: 'suporte', name: 'Suporte do Nó & Dúvidas', icon: 'solar:help-bold-duotone', unread: 2 },
    { id: 'governance', name: 'Governança DAO', icon: 'solar:diploma-bold-duotone', unread: 0 },
    { id: 'ai', name: 'Assistente do Ecossistema', icon: 'solar:magic-stick-3-bold-duotone', unread: 0 },
  ];

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardHeader
        title="Canais de Comunicação"
        action={
          <Button component={RouterLink} href="/devos/ipfs" size="small" color="primary">
            Abrir Todos
          </Button>
        }
      />

      <Stack spacing={1.5} sx={{ p: 2.5, pt: 1 }}>
        {channels.map((ch) => (
          <Stack
            key={ch.id}
            direction="row"
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'background.neutral',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'space-between',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Iconify icon={ch.icon} width={20} sx={{ color: 'primary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {ch.name}
              </Typography>
            </Stack>

            {ch.unread > 0 && (
              <Box
                sx={{
                  bgcolor: 'error.main',
                  color: 'white',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                {ch.unread}
              </Box>
            )}
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
