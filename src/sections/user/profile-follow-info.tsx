import React from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type Props = {
  follower?: number;
  following?: number;
};

export function ProfileFollowInfo({ follower = 1947, following = 9124 }: Props) {
  const formatNumber = (num: number) =>
    num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Card sx={{ py: 2.5, borderRadius: 2 }}>
      <Stack
        direction="row"
        divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
        sx={{ textAlign: 'center' }}
      >
        <Stack sx={{ width: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {formatNumber(follower)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Follower
          </Typography>
        </Stack>

        <Stack sx={{ width: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {formatNumber(following)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Following
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}
