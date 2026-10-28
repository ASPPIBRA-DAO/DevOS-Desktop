import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

// ----------------------------------------------------------------------

export function SignUpTerms({ sx, ...other }: BoxProps) {
  return (
    <Box
      component="span"
      sx={[
        () => ({
          mt: 3,
          display: 'block',
          textAlign: 'center',
          typography: 'caption',
          color: 'text.secondary',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {'Ao se cadastrar, eu concordo com os '}
      <Link underline="always" sx={{ color: 'info.main', fontWeight: 600 }}>
        Termos de serviço
      </Link>
      {' e '}
      <Link underline="always" sx={{ color: 'info.main', fontWeight: 600 }}>
        Política de privacidade
      </Link>
      .
    </Box>
  );
}
