import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

type A4PageProps = {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  pageNumber?: number;
  preview?: boolean;
};

export function A4Page({ children, headerContent, footerContent, pageNumber }: A4PageProps) {
  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { 
            size: A4 portrait; 
            margin: 0mm; /* REMOVE BROWSER HEADER/FOOTER (Date, URL) */
          }
          html, body { 
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            font-family: "Arial", sans-serif !important;
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
          }
        `}
      </style>
      <Paper
        elevation={12}
        sx={{
          width: { xs: '100%', md: '210mm' },
          minHeight: { xs: 'auto', md: '297mm' },
          flexShrink: 0,
          mx: 'auto',
          mb: { xs: 0, md: 6 },
          bgcolor: '#FFFFFF',
          borderRadius: 0,
          boxSizing: 'border-box',
          // Margens ABNT para tela: Superior 0.9cm, Direita 2cm, Inferior 0.7cm, Esquerda 3cm
          p: { xs: '1rem 1rem', md: '0.9cm 2cm 0.7cm 3cm' },
          fontFamily: '"Arial", "Helvetica", sans-serif',
          position: 'relative',
          '@media print': {
            boxShadow: 'none',
            mb: 0,
            p: 0,
            pl: '3cm', // Margem ABNT Esquerda de Impressão
            pr: '2cm', // Margem ABNT Direita de Impressão
            width: '100%',
            minHeight: 'auto',
          },
        }}
      >
        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            borderSpacing: 0,
          }}
        >
          {/* REPEATING HEADER */}
          <Box
            component="thead"
            sx={{
              display: 'table-header-group',
            }}
          >
            <Box component="tr">
              <Box component="td" sx={{ pb: 1, '@media print': { pt: '0.9cm' } }}>
                {headerContent}
              </Box>
            </Box>
          </Box>

          {/* MAIN CONTENT */}
          <Box component="tbody">
            <Box component="tr">
              <Box component="td" sx={{ pb: 4, pt: 1 }}>
                {children}
              </Box>
            </Box>
          </Box>

          {/* REPEATING FOOTER RESERVES SPACE */}
          <Box
            component="tfoot"
            sx={{
              display: 'table-footer-group',
              '@media print': {
                visibility: 'hidden',
              },
            }}
          >
            <Box component="tr">
              <Box component="td" sx={{ '@media print': { pb: '0.7cm' } }}>
                {footerContent}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ACTUAL FIXED FOOTER (ONLY VISIBLE ON PRINT) */}
        <Box
          sx={{
            display: 'none',
            '@media print': {
              display: 'block',
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              pl: '3cm',
              pr: '2cm',
              pb: '0.7cm',
              boxSizing: 'border-box',
            },
          }}
        >
          {footerContent}
        </Box>
      </Paper>
    </>
  );
}