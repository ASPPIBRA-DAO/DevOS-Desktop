import { alpha, styled } from '@mui/material/styles';

import { uploadClasses } from '../classes';

// ----------------------------------------------------------------------

export const UploadArea = styled('div')(({ theme }) => ({
  width: 64,
  height: 64,
  flexShrink: 0,
  display: 'flex',
  cursor: 'pointer',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.text.disabled,
  backgroundColor: alpha(theme.palette.grey[500], 0.08),
  border: `dashed 1px ${alpha(theme.palette.grey[500], 0.2)}`,
  '&:hover': {
    opacity: 0.72,
  },
  [`&.${uploadClasses.state.dragActive}`]: {
    opacity: 0.72,
  },
  [`&.${uploadClasses.state.disabled}`]: {
    opacity: 0.48,
    pointerEvents: 'none',
  },
  [`&.${uploadClasses.state.error}`]: {
    color: theme.palette.error.main,
    borderColor: theme.palette.error.main,
    backgroundColor: alpha(theme.palette.error.main, 0.08),
  },
}));
