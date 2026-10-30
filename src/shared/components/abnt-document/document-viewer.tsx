import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';

type DocumentViewerProps = {
  children: React.ReactNode;
};

export function DocumentViewer({ children }: DocumentViewerProps) {
  const theme = useTheme();
  return (
    <Box
      component="main"
      sx={{
        position: 'relative',
        zIndex: 1,
        pt: { xs: 8, sm: 10, md: 12 },
        pb: { xs: 8, sm: 10, md: 12 },
        bgcolor: alpha(theme.palette.grey[900], 0.7),
        overflowX: 'auto',
        '@media print': {
          pt: 0,
          pb: 0,
          bgcolor: 'transparent',
          overflowX: 'visible',
        },
      }}
    >
      <Box
        sx={{
          width: '100%',
          minWidth: { xs: '100%', md: '220mm' },
          py: 4,
          '@media print': {
            minWidth: '100%',
            width: '100%',
            py: 0,
            px: 0,
            m: 0,
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
