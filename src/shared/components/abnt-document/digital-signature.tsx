import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { useDocumentData } from './document-context';

// ----------------------------------------------------------------------

type SignatureData = {
  signerName?: string;
  signedAt?: string;
  ip?: string;
  deviceId?: string;
  hash?: string;
};

type DigitalSignatureProps = {
  title: string;
  name: React.ReactNode;
  field?: string;
  color?: 'success' | 'info' | 'primary' | 'warning' | 'error';
};

export function DigitalSignature({ title, name, field, color = 'info' }: DigitalSignatureProps) {
  const contextData = useDocumentData();
  const lookupField = field || title;
  const signatureVal = contextData ? contextData[lookupField] : undefined;

  // Padronização com as cores do logo / Bandeira do Brasil
  const getBrandColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#0A3B18'; // Verde Escuro Institucional FFC
      case 'info':
        return '#002776'; // Azul Marinho Brasil
      case 'warning':
        return '#D4AF37'; // Dourado FFC
      case 'error':
        return '#B71C1C';
      default:
        return '#0A3B18';
    }
  };

  const mainColor = getBrandColor(color);

  // Se o documento estiver assinado e possuir objeto de assinatura rico
  const isObjectSignature = signatureVal && typeof signatureVal === 'object';
  const isStringSignature = signatureVal && typeof signatureVal === 'string';
  const isSigned = isObjectSignature || isStringSignature;

  const sigObj = isObjectSignature ? (signatureVal as SignatureData) : null;

  return (
    <Stack
      spacing={2}
      sx={{
        mt: 3,
        p: 3,
        bgcolor: isSigned ? alpha(mainColor, 0.04) : `${mainColor}0D`, // 0D hex = 8% de opacidade
        border: isSigned ? `2px solid ${mainColor}` : `2px dashed ${mainColor}`,
        borderRadius: 2,
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Selo/Badge de Assinatura Ativa */}
      {isSigned && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 0.5,
            borderRadius: 0.5,
            bgcolor: alpha(mainColor, 0.1),
            color: mainColor,
            fontWeight: 'bold',
            fontSize: '8pt',
            border: `1px solid ${alpha(mainColor, 0.2)}`,
            textTransform: 'uppercase',
          }}
        >
          <Iconify icon="solar:shield-check-bold" width={14} />
          Assinado
        </Box>
      )}

      <Typography
        variant="subtitle2"
        sx={{
          color: mainColor,
          textTransform: 'uppercase',
          fontWeight: 900,
          fontSize: '9pt',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Iconify
          icon={(isSigned ? 'solar:pen-new-round-bold' : 'solar:pen-new-round-linear') as any}
          width={18}
        />
        {title}
      </Typography>

      {isSigned ? (
        <Stack spacing={1}>
          <Typography
            variant="body2"
            sx={{ color: '#000000', fontSize: '11pt', fontWeight: 'bold' }}
          >
            {sigObj?.signerName || name}
          </Typography>

          {isObjectSignature ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
              {sigObj?.signedAt && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#637381',
                    fontSize: '8pt',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Iconify icon={'solar:calendar-date-bold' as any} width={12} />
                  <strong>Data/Hora:</strong> {sigObj.signedAt}
                </Typography>
              )}
              {sigObj?.ip && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#637381',
                    fontSize: '8pt',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Iconify icon={'solar:laptop-bold' as any} width={12} />
                  <strong>IP de Origem:</strong> {sigObj.ip}
                </Typography>
              )}
              {sigObj?.deviceId && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#637381',
                    fontSize: '8pt',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Iconify icon={'solar:ssd-round-bold' as any} width={12} />
                  <strong>Dispositivo:</strong> {sigObj.deviceId}
                </Typography>
              )}
              {sigObj?.hash && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#637381',
                    fontSize: '7.5pt',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    mt: 0.5,
                    bgcolor: '#F4F6F8',
                    p: 1,
                    borderRadius: 0.5,
                    border: '1px solid #E0E0E0',
                  }}
                >
                  <strong>HASH SHA-256:</strong> {sigObj.hash}
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: '#637381', fontSize: '9pt' }}>
              {signatureVal as string}
            </Typography>
          )}
        </Stack>
      ) : (
        <Stack spacing={1}>
          <Typography
            variant="body2"
            sx={{ color: '#000000', fontSize: '11pt', fontWeight: 'bold' }}
          >
            {name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#B8860B',
              fontSize: '8pt',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 'bold',
            }}
          >
            <Iconify icon={'solar:danger-triangle-bold' as any} width={12} />
            AGUARDANDO ASSINATURA ELETRÔNICA
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
