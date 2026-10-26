import React from 'react';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  preview?: boolean;
};

export function A4Page({ children, headerContent, footerContent, preview = false }: Props) {
  return (
    <>
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 12mm 15mm 20mm 15mm !important;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: white !important;
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
            }

            /* Esconde absolutamente qualquer elemento de interface do app */
            header,
            nav,
            aside,
            .no-print,
            .a4-preview-container,
            [class*="layout__nav"],
            [class*="layout__header"],
            [class*="layout__sidebar"],
            [class*="layout__footer"] {
              display: none !important;
            }

            /* Garante que containers principais não criem colunas flexíveis na impressão */
            main,
            [class*="layout__main"],
            .MuiContainer-root {
              display: block !important;
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }

            .print-container {
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background-color: white !important;
              z-index: 9999999 !important;
              user-select: text !important;
            }
            .a4-preview-container {
              display: none !important;
            }
            .a4-sheet {
              box-shadow: none !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              min-height: auto !important;
              background-color: white !important;
              padding: 0 !important;
            }

            .a4-footer {
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              background-color: white !important;
            }
          }
        `}
      </style>

      {/* Na tela normal fica oculto a menos que preview=true, na impressão domina a folha */}
      <Box
        className={preview ? 'a4-preview-container' : 'print-container'}
        sx={{
          display: preview ? 'block' : 'none',
          '@media print': {
            display: preview ? 'none' : 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            bgcolor: 'white',
            color: 'black',
            zIndex: 9999999,
          },
        }}
      >
        <Box
          className="a4-sheet"
          sx={{
            width: { xs: '100%', md: '210mm' },
            minHeight: '297mm',
            bgcolor: 'white',
            mx: 'auto',
            mb: 5,
            boxShadow: (theme) => theme.customShadows.z20,
            color: 'text.primary',
            // Margens ABNT para visualização em TELA
            pt: '0.9cm',
            pb: '1.2cm',
            pl: '3cm',
            pr: '2cm',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            '@media print': {
              p: 0,
              m: 0,
              boxShadow: 'none',
              display: 'block',
              minHeight: 'auto',
            },
          }}
        >
          <Box sx={{ width: '100%' }}>
            {headerContent && <Box sx={{ mb: 2 }}>{headerContent}</Box>}
            {children}
          </Box>

          {footerContent && (
            <Box
              className="a4-footer"
              sx={{
                mt: 4,
                width: '100%',
                bgcolor: 'white',
                '@media print': {
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  mt: 0,
                  pt: 1,
                  bgcolor: 'white',
                },
              }}
            >
              {footerContent}
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
}
