import type { CommunityOpportunity } from '../types/home';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { Iconify } from 'src/shared/components/iconify';

type Props = {
  list: CommunityOpportunity[];
};

export function AppOpportunities({ list }: Props) {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardHeader title="Oportunidades" />
      <Stack spacing={2} sx={{ p: 2.5 }}>
        {list.map((item) => (
          <Stack
            key={item.id}
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
              <Iconify
                icon={item.type === 'edital' ? 'solar:file-check-bold-duotone' : 'solar:users-group-two-rounded-bold-duotone'}
                width={22}
                sx={{ color: item.type === 'edital' ? 'primary.main' : 'info.main' }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2">{item.title}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {item.description}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
