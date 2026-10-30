import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { useDocumentData } from './document-context';

type DefaultFooterProps = {
  authCode?: string;
  message?: React.ReactNode;
  qrCodeIcon?: string;
  originIdentifier?: string;
};

export function DefaultFooter({
  authCode,
  message,
  qrCodeIcon = 'mdi:qrcode',
  originIdentifier,
}: DefaultFooterProps = {}) {
  const data = useDocumentData();

  const finalAuthCode = authCode || (data?.authCode as string) || 'FFC-2026-X8Y9Z';
  const finalOrigin = originIdentifier || (data?.originIdentifier as string) || 'FFC Oficial';

  const finalMessage = message || (data?.message as React.ReactNode) || (
    <>
      Este documento foi gerado pelo sistema interno da associação e possui validade <br />
      jurídica para fins de cadastro interno e prova de vínculo.
    </>
  );

  return (
    <Box
      sx={{
        position: 'relative',
        pt: 2,
        // Linha superior combinando com a elegância do cabeçalho
        borderTop: '2px solid #111827',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 2,
        mt: 2,
        minHeight: '2.2cm',
        boxSizing: 'border-box',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -4,
          left: 0,
          right: 0,
          height: '1px',
          bgcolor: '#D4AF37', // Detalhe dourado corporativo sutil combinando com o topo
        },
      }}
    >
      {/* QR Code Lateral posicionado na margem esquerda */}
      <Box
        sx={{
          position: 'absolute',
          left: '-2.5cm',
          top: 8,
          width: '2.2cm',
          height: '2.2cm',
          border: '2px solid #D4AF37', // Borda Dourada
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#FFFFFF',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        }}
      >
        <Iconify icon={qrCodeIcon as any} width={65} sx={{ color: '#0A3B18' }} />
      </Box>

      {/* Mensagem Institucional */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flex: 1, pl: 0.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 900,
              color: '#111827',
              fontSize: '7.5pt',
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Autenticação Digital
          </Typography>
          <Typography variant="caption" sx={{ color: '#4B5563', fontSize: '7pt', lineHeight: 1.3 }}>
            {finalMessage}
          </Typography>
        </Box>
      </Box>

      {/* Identificação de Origem e Código de Autenticação */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          textAlign: 'right',
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 900, color: '#D4AF37', fontSize: '8pt', mb: 0.5, letterSpacing: '0.3px' }}
        >
          {finalOrigin}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: '#111827', fontSize: '7.5pt', fontFamily: 'monospace', fontWeight: 'bold' }}
        >
          Autenticação: {finalAuthCode}
        </Typography>
      </Box>
    </Box>
  );
}