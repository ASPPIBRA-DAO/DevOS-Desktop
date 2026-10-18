import { alpha, styled } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';

// ----------------------------------------------------------------------

export const ThumbnailRoot = styled('span')(({ theme }) => ({
  width: 36,
  height: 36,
  flexShrink: 0,
  alignItems: 'center',
  position: 'relative',
  display: 'inline-flex',
  justifyContent: 'center',
  borderRadius: Number(theme.shape.borderRadius) * 1.25,
}));

export const ThumbnailImage = styled('img', {
  shouldForwardProp: (prop: string) => !['showImage', 'sx'].includes(prop),
})<{ showImage?: boolean }>({
  width: '100%',
  height: '100%',
  variants: [
    {
      props: (props) => !!props.showImage,
      style: {
        objectFit: 'cover',
        borderRadius: 'inherit',
      },
    },
  ],
});

export const RemoveButton = styled(IconButton)(({ theme }) => ({
  top: 4,
  right: 4,
  position: 'absolute',
  padding: theme.spacing(0.5),
  color: theme.palette.common.white,
  backgroundColor: alpha('#0d1117', 0.48),
  '&:hover': {
    backgroundColor: alpha('#0d1117', 0.72),
  },
}));

export const DownloadButton = styled(ButtonBase)(({ theme }) => ({
  top: 0,
  right: 0,
  zIndex: 9,
  padding: 0,
  opacity: 0,
  width: '100%',
  height: '100%',
  position: 'absolute',
  borderRadius: 'inherit',
  color: theme.palette.common.white,
  transition: theme.transitions.create(['opacity']),
  '&:hover': {
    backdropFilter: 'blur(6px)',
    backgroundColor: alpha('#0d1117', 0.64),
    opacity: 1,
  },
}));
