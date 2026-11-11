import type { PendingAction } from '../types/home';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { RouterLink } from 'src/app/router/components/router-link';

import { Iconify } from 'src/shared/components/iconify';

type Props = {
  actions: PendingAction[];
};

export function AppMyActions({ actions }: Props) {
  if (!actions.length) return null;

  const getIcon = (title: string) => {
    if (title.toLowerCase().includes('votação')) return 'solar:pen-bold-duotone';
    if (title.toLowerCase().includes('nó') || title.toLowerCase().includes('sync')) return 'solar:server-square-bold-duotone';
    return 'solar:wallet-bold-duotone';
  };

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardHeader title="Minhas Pendências" subheader="Ações que requerem sua atenção no ecossistema" />
      <Stack spacing={2} sx={{ p: 3 }}>
        {actions.map((action) => (
          <Stack
            key={action.id}
            direction="row"
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.neutral',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: (theme) => theme.customShadows?.z1 || 1,
                }}
              >
                <Iconify icon={getIcon(action.title)} width={24} sx={{ color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {action.description}
                </Typography>
              </Box>
            </Stack>

            <Button
              component={RouterLink}
              href={action.actionUrl}
              size="small"
              variant="contained"
              color="inherit"
              sx={{ minWidth: 100 }}
            >
              {action.actionText}
            </Button>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
