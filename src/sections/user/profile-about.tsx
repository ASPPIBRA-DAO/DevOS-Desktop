import React from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/shared/components/iconify';

import type { UserProfileAbout } from './types';

// ----------------------------------------------------------------------

type Props = {
  about: UserProfileAbout;
};

export function ProfileAbout({ about }: Props) {
  return (
    <Card sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
        About
      </Typography>

      {about.quote && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, lineHeight: 1.6 }}>
          {about.quote}
        </Typography>
      )}

      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Iconify icon="solar:map-point-bold" width={20} sx={{ color: 'text.primary', flexShrink: 0 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Live at <Typography component="span" variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700 }}>{about.country}</Typography>
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Iconify icon="solar:letter-bold" width={20} sx={{ color: 'text.primary', flexShrink: 0 }} />
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
            {about.email}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Iconify icon="solar:briefcase-bold" width={20} sx={{ color: 'text.primary', flexShrink: 0 }} />
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
            {about.role}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Iconify icon="solar:diploma-bold" width={20} sx={{ color: 'text.primary', flexShrink: 0 }} />
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
            {about.school}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}
