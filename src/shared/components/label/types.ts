import type { SxProps, Theme } from '@mui/material/styles';

export type LabelColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export type LabelVariant = 'filled' | 'outlined' | 'soft';

export interface LabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  disabled?: boolean;
  color?: LabelColor;
  variant?: LabelVariant;
  endIcon?: React.ReactNode;
  startIcon?: React.ReactNode;
  sx?: SxProps<Theme>;
}
