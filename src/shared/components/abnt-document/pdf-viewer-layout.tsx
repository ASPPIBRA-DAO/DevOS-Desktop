import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useRouter } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';

type PdfViewerLayoutProps = {
  children: React.ReactNode;
  documentTitle: string;
  fixedHeader?: boolean;
};

export function PdfViewerLayout({
  children,
  documentTitle,
  fixedHeader = true,
}: PdfViewerLayoutProps) {
  const router = useRouter();

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      const originalTitle = document.title;
      document.title = `${documentTitle}.pdf`;
      window.print();
      document.title = originalTitle;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#323639',
        py: { xs: 2, md: 5 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        '@media print': {
          bgcolor: 'transparent',
          py: 0,
          display: 'block',
        },
      }}
    >
      {/* Top Bar - Simulating PDF Viewer Controls */}
      <Box
        sx={{
          width: '100%',
          position: fixedHeader ? 'fixed' : 'relative',
          top: fixedHeader ? 0 : 'auto',
          left: fixedHeader ? 0 : 'auto',
          zIndex: 99,
          bgcolor: '#323639',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          px: 2,
          py: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: fixedHeader ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
          mb: fixedHeader ? 0 : 4,
          '@media print': { display: 'none' },
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton onClick={() => router.back()} sx={{ color: '#fff' }}>
            <Iconify icon={'solar:arrow-left-bold-duotone' as any} />
          </IconButton>
          <Typography
            sx={{
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {documentTitle}.pdf
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton onClick={() => handlePrint()} sx={{ color: '#fff' }}>
            <Iconify icon={'solar:printer-bold-duotone' as any} />
          </IconButton>
          <Button
            variant="contained"
            size="small"
            onClick={() => handlePrint()}
            sx={{ bgcolor: '#8ab4f8', color: '#202124', '&:hover': { bgcolor: '#9fbff0' } }}
          >
            Baixar PDF / Imprimir
          </Button>
        </Stack>
      </Box>

      {/* Document Content Wrapper */}
      <Box
        sx={{
          mt: fixedHeader ? 7 : 0,
          width: '100%',
          overflowX: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          '@media print': {
            mt: 0,
            display: 'block',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
