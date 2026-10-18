import IconButton from '@mui/material/IconButton';
import { alpha, styled } from '@mui/material/styles';

import { uploadClasses } from '../classes';

// ----------------------------------------------------------------------

export const UploadWrapper = styled('div')({
  width: '100%',
  position: 'relative',
});

export const UploadArea = styled('div')(({ theme }) => ({
  minHeight: 280,
  outline: 'none',
  display: 'flex',
  cursor: 'pointer',
  overflow: 'hidden',
  position: 'relative',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create(['opacity']),
  backgroundColor: alpha(theme.palette.grey[500], 0.08),
  border: `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
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

export const PlaceholderContainer = styled('div')(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  justifyContent: 'center',
  [`& .${uploadClasses.placeholder.content}`]: {
    display: 'flex',
    textAlign: 'center',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  [`& .${uploadClasses.placeholder.title}`]: {
    ...theme.typography.h6,
  },
  [`& .${uploadClasses.placeholder.description}`]: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    '& span': {
      textDecoration: 'underline',
      color: theme.palette.primary.main,
    },
  },
}));

export const DeleteButton = styled(IconButton)(({ theme }) => ({
  top: 16,
  right: 16,
  zIndex: 9,
  position: 'absolute',
  color: alpha(theme.palette.common.white, 0.8),
  backgroundColor: alpha(theme.palette.grey[900], 0.72),
  '&:hover': {
    backgroundColor: alpha(theme.palette.grey[900], 0.48),
  },
}));
