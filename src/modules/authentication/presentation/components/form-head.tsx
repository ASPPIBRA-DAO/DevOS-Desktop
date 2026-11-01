import type { ReactNode } from 'react';
import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type FormHeadProps = BoxProps & {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
};

// ----------------------------------------------------------------------

export function FormHead({
  sx,
  icon,
  title,
  description,
  ...other
}: FormHeadProps) {
  const customSx = Array.isArray(sx)
    ? sx
    : sx == null
      ? []
      : [sx];

  return (
    <>
      {icon && (
        <Box
          component="span"
          sx={{
            mb: 3,
            mx: 'auto',
            display: 'inline-flex',
          }}
        >
          {icon}
        </Box>
      )}

      <Box
        sx={[
          {
            mb: 4,
            gap: 1.5,
            display: 'flex',
            textAlign: 'center',
            whiteSpace: 'pre-line',
            flexDirection: 'column',
          },
          ...customSx,
        ]}
        {...other}
      >
        <Typography
          variant="h5"
          sx={{
            fontFamily: 'var(--font-orbitron), sans-serif',
            fontWeight: 900,
            color: 'info.main',
          }}
        >
          {title}
        </Typography>

        {description != null && description !== false && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
    </>
  );
}
