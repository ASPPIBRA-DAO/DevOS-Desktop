import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useDocumentData } from './document-context';

type DefaultHeaderProps = {
  logoUrl?: string;
  title?: string;
  documentNumber?: string;
};

export function DefaultHeader({
  logoUrl = '/logo/logo-single.svg',
  title = 'ASPPIBRA-DAO',
  documentNumber,
}: DefaultHeaderProps = {}) {
  const contextData = useDocumentData();

  // Busca dinâmica do número de controle com fallback integrado do sistema
  const finalDocNumber =
    documentNumber ||
    (contextData?.documentNumber as string) ||
    (contextData?.trackingNumber as string) ||
    (contextData?.authCode as string) ||
    ''; // Vazio ou o fallback padrão caso prefira

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #111827',
        pb: 2,
        mb: 3,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -4,
          left: 0,
          right: 0,
          height: '1px',
          bgcolor: '#D4AF37', // Detalhe dourado corporativo sutil
        },
      }}
    >
      {/* Lado Esquerdo: Logo e Título Principal (Sem Subtítulo) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <Box
          component="img"
          src={logoUrl}
          alt="Logo Institucional"
          sx={{
            height: 42,
            width: 'auto',
            objectFit: 'contain',
          }}
        />
        <Typography
          variant="body1"
          sx={{
            fontWeight: 800,
            fontSize: '14pt',
            color: '#111827',
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '-0.2px',
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Lado Direito: Caixa de Registro Dinâmica */}
      {finalDocNumber && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            bgcolor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            px: 1.5,
            py: 0.8,
            borderRadius: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#4B5563',
              fontSize: '6.5pt',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              mb: 0.2,
            }}
          >
            Nº de Registro
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 900,
              color: '#111827',
              fontSize: '11pt',
              fontFamily: 'monospace, "Arial", sans-serif',
              letterSpacing: '0.5px',
              lineHeight: 1,
            }}
          >
            {finalDocNumber}
          </Typography>
        </Box>
      )}
    </Box>
  );
}