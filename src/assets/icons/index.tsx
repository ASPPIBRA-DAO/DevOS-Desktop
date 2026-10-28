import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';

import { Iconify } from 'src/shared/components/iconify';

export function PasswordIcon({ sx, ...other }: BoxProps) {
  return (
    <Box sx={sx} {...other}>
      <Iconify icon="solar:shield-keyhole-bold-duotone" width="100%" height="100%" />
    </Box>
  );
}

export function SentIcon({ sx, ...other }: BoxProps) {
  return (
    <Box sx={sx} {...other}>
      <Iconify icon="solar:letter-opened-bold-duotone" width="100%" height="100%" />
    </Box>
  );
}

export function EmailInboxIcon({ sx, ...other }: BoxProps) {
  return (
    <Box sx={sx} {...other}>
      <Iconify icon="solar:mailbox-bold-duotone" width="100%" height="100%" />
    </Box>
  );
}
