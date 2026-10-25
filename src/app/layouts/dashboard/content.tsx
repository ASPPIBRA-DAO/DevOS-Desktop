import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';

export function VerticalDivider({ sx, ...other }: BoxProps) {
  return (
    <Box
      component="span"
      sx={[
        {
          width: 1,
          height: 24,
          flexShrink: 0,
          display: 'none',
          borderRight: '1px dashed rgba(145, 158, 171, 0.2)',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    />
  );
}
