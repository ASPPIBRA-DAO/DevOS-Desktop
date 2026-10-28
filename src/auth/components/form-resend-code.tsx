import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

// ----------------------------------------------------------------------

type FormResendCodeProps = BoxProps & {
  value?: number;
  disabled?: boolean;
  onResendCode?: () => void;
};

export function FormResendCode({
  value,
  disabled,
  onResendCode,
  sx,
  ...other
}: FormResendCodeProps) {
  return (
    <Box
      sx={[
        () => ({
          mt: 3,
          typography: 'body2',
          alignSelf: 'center',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {`Não recebeu o código? `}
      <Link
        variant="subtitle2"
        onClick={onResendCode}
        sx={{
          cursor: 'pointer',
          fontFamily: 'var(--font-orbitron), sans-serif',
          fontWeight: 700,
          color: 'info.main',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
          ...(disabled && { color: 'text.disabled', pointerEvents: 'none' }),
        }}
      >
        Reenviar {disabled && value && value > 0 && `(${value}s)`}
      </Link>
    </Box>
  );
}
