import type { WeeklyRecognition } from '../types/home';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

type Props = {
  recognitions: WeeklyRecognition[];
};

export function AppWeeklyRecognition({ recognitions }: Props) {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardHeader title="Reconhecimento da Semana" />
      <Stack spacing={2} sx={{ p: 2.5 }}>
        {recognitions.map((item) => (
          <Stack key={item.id} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Avatar src={item.avatarUrl} alt={item.title}>
              {item.title.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2">{item.title}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {item.category}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
