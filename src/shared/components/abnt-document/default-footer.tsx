import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { useDocumentData } from './document-context';

type DefaultFooterProps = {
  authCode?: string;
  qrCodeIcon?: string;
  pageNumber?: number;
  totalPages?: number;
  showQrCode?: boolean;
};

export function DefaultFooter({
  authCode,
  qrCodeIcon = 'mdi:qrcode',
  pageNumber = 1,
  totalPages = 1,
  showQrCode = true,
}: DefaultFooterProps = {}) {
  const data = useDocumentData();

  const finalAuthCode =
    authCode || (data?.authCode as string) || (data?.trackingNumber as string) || '2026-X7Y9';

  return (
    <Box
      sx={{
        position: 'relative',
        pt: 1.5,
        borderTop: '2px solid #111827',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1.5,
        mt: 2,
        boxSizing: 'border-box',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -3,
          left: 0,
          right: 0,
          height: '1px',
          bgcolor: '#D4AF37', // Filete dourado corporativo #D4AF37
        },
      }}
    >
      {/* Esquerda: QR Code Integrado + Texto Legal de Fé Pública */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1.5 }}>
        {showQrCode && (
          <Box
            sx={{
              width: 32,
              height: 32,
              border: '1.5pt solid #D4AF37',
              borderRadius: 0.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              flexShrink: 0,
            }}
          >
            <Iconify icon={qrCodeIcon as any} width={24} sx={{ color: '#0A3B18' }} />
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: '#111827',
              fontSize: '7pt',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              lineHeight: 1.1,
            }}
          >
            Autenticação Digital
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#4B5563',
              fontSize: '6.5pt',
              lineHeight: 1.2,
              fontFamily: 'Arial, sans-serif',
              mt: 0.2,
            }}
          >
            Lei Federal 14.063/2020 • ICP-Brasil / DAO
          </Typography>
        </Box>
      </Box>

      {/* Centro: Numeração Dinâmica Oficial (Página X de Y) */}
      <Box sx={{ display: 'flex', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            fontSize: '7.5pt',
            color: '#0A3B18', // Verde institucional oficial
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '0.2px',
          }}
        >
          Página {pageNumber} de {totalPages}
        </Typography>
      </Box>

      {/* Direita: Identificação e Código Criptográfico */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          textAlign: 'right',
          flex: 1.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            color: '#111827',
            fontSize: '7pt',
            letterSpacing: '0.3px',
            lineHeight: 1.1,
          }}
        >
          ASPPIBRA DAO
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#4B5563',
            fontSize: '6.5pt',
            mt: 0.2,
          }}
        >
          Cód:{' '}
          <Box
            component="span"
            sx={{
              color: '#111827',
              fontFamily: 'monospace, "Arial", sans-serif',
              fontWeight: 700,
            }}
          >
            {finalAuthCode}
          </Box>
        </Typography>
      </Box>
    </Box>
  );
}