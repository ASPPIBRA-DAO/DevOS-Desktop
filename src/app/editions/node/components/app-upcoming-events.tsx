import type { CommunityEvent } from '../types/home';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { Iconify } from 'src/shared/components/iconify';

type Props = {
  events: CommunityEvent[];
};

export function AppUpcomingEvents({ events }: Props) {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardHeader title="Próximos Eventos" />
      <Stack spacing={2} sx={{ p: 2.5 }}>
        {events.map((event) => (
          <Stack
            key={event.id}
            direction="row"
            spacing={2}
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'background.neutral',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="solar:calendar-bold-duotone" width={22} sx={{ color: 'primary.main' }} />
            </Box>

            <Box>
              <Typography variant="subtitle2">{event.title}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {event.date} • {event.category}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
