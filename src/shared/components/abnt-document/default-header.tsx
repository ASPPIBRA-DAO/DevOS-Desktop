import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useDocumentData } from './document-context';

type DefaultHeaderProps = {
  logoUrl?: string;
  title?: string;
  subtitle?: string;
  documentNumber?: string;
  documentTitle?: string;
  isSubsequentPage?: boolean;
};

export function DefaultHeader({
  logoUrl = '/logo/logo-single.svg',
  title = 'ASPPIBRA-DAO',
  subtitle = 'DOCUMENTO OFICIAL • PROTOCOLO DE REGULARIZAÇÃO',
  documentNumber,
  documentTitle = 'Contrato de Cessão de Posse de Imóvel',
  isSubsequentPage = false,
}: DefaultHeaderProps = {}) {
  const contextData = useDocumentData();

  // Busca dinâmica do número de controle com fallback integrado do sistema
  const finalDocNumber =
    documentNumber ||
    (contextData?.documentNumber as string) ||
    (contextData?.trackingNumber as string) ||
    (contextData?.authCode as string) ||
    '2026-0001/CP';

  // Cabeçalho corrido leve para páginas seguintes (> 1)
  if (isSubsequentPage) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #E5E7EB',
          pb: 0.8,
          mb: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '7pt',
            color: '#6B7280',
            fontWeight: 700,
            fontFamily: 'Arial, sans-serif',
          }}
        >
          {title} • {documentTitle}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            fontSize: '7pt',
            color: '#111827',
            fontFamily: 'monospace, "Arial", sans-serif',
            fontWeight: 700,
          }}
        >
          Nº {finalDocNumber}
        </Typography>
      </Box>
    );
  }

  // Cabeçalho oficial principal (1ª Página)
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #111827',
        pb: 1.5,
        mb: 2.5,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -3,
          left: 0,
          right: 0,
          height: '1px',
          bgcolor: '#D4AF37', // Filete dourado corporativo #D4AF37
        },
      }}
    >
      {/* Lado Esquerdo: Logo Institucional + Título + Subtítulo Oficial */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          component="img"
          src={logoUrl}
          alt="Logo Institucional"
          sx={{
            height: 38,
            width: 'auto',
            objectFit: 'contain',
          }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 800,
              fontSize: '14pt',
              color: '#111827',
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '-0.2px',
              lineHeight: 1.15,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: '7.5pt',
              fontWeight: 700,
              color: '#6B7280',
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '0.4px',
              mt: 0.3,
            }}
          >
            {subtitle}
          </Typography>
        </Box>
      </Box>

      {/* Lado Direito: Caixa de Registro Institucional Destacada */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          bgcolor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          px: 1.5,
          py: 0.8,
          borderRadius: 0.75,
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
            fontWeight: 800,
            color: '#111827',
            fontSize: '10pt',
            fontFamily: 'monospace, "Arial", sans-serif',
            letterSpacing: '0.5px',
            lineHeight: 1,
          }}
        >
          {finalDocNumber}
        </Typography>
      </Box>
    </Box>
  );
}