import type { EdgerInlineNotificationProps } from './types';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from '../iconify';
import { EdgerButton } from './edger-button';
import { EDGER_TOKENS } from './edger-tokens';

// ----------------------------------------------------------------------
// EDGER Lights: Inline Notification
// Formato horizontal oficial de barra de notificação tátil com vidro líquido e borda 3D
// ----------------------------------------------------------------------

export function EdgerInlineNotification({
  title,
  description,
  variant = 'rose',
  edgeStyle = 'lateral',
  timestamp,
  icon,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  onClose,
  unread = false,
  pulse = false,
  elevation3D = true,
  sx,
}: EdgerInlineNotificationProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const token = EDGER_TOKENS[variant];

  // Cálculo da elevação e borda 3D conforme o modelo oficial:
  // - 'lateral': borderLeft 5px sólido + sombra difusa e insets de vidro líquido
  // - 'bottom': borderBottom 5px sólido + sombra difusa e insets de vidro líquido
  const getElevationStyles = () => {
    const border3D = elevation3D
      ? edgeStyle === 'lateral'
        ? { borderLeft: `5px solid ${token.accent}` }
        : { borderBottom: `5px solid ${token.accent}` }
      : {};

    const shadowStyles = elevation3D
      ? {
          boxShadow: isDark
            ? `0 8px 28px -4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)`
            : `0 8px 24px -4px ${alpha(token.accent, 0.15)}, inset 0 1.5px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 0 rgba(0, 0, 0, 0.03)`,
        }
      : {};

    return {
      ...border3D,
      ...shadowStyles,
    };
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: 1,
        borderRadius: '16px',
        overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${alpha(token.accent, 0.18)} 0%, rgba(15, 23, 42, 0.90) 100%)`
          : `linear-gradient(135deg, ${alpha(token.accent, 0.12)} 0%, ${alpha(token.accent, 0.05)} 100%)`,
        border: `1px solid ${isDark ? alpha(token.accent, 0.35) : alpha(token.accent, 0.30)}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',

        // Lâmina de Brilho Especular Superior do Vidro Líquido
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.04) 30%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 1,
        },

        ...getElevationStyles(),
        ...sx,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          p: 2,
          px: { xs: 2.2, sm: 2.8 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: { xs: 1.5, sm: 2.2 },
        }}
      >
        {/* Esquerda: Ícone + Conteúdo de Texto */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, flexGrow: 1, minWidth: 0 }}>
          {icon && (
            <Box
              sx={{
                color: token.accent,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {typeof icon === 'string' ? (
                <Iconify icon={icon as any} width={26} />
              ) : (
                icon
              )}
            </Box>
          )}

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {/* Linha 1: Título */}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.88rem', sm: '0.92rem' },
                lineHeight: 1.3,
                color: isDark ? token.textDark : token.text,
                letterSpacing: '-0.01em',
                mb: 0.35,
              }}
            >
              {title}
            </Typography>

            {/* Linha 2: Descrição */}
            <Typography
              variant="body2"
              sx={{
                color: isDark ? token.subtextDark : token.subtext,
                fontSize: { xs: '0.78rem', sm: '0.84rem' },
                lineHeight: 1.45,
                opacity: 0.9,
              }}
            >
              {description}
            </Typography>
          </Box>
        </Box>

        {/* Direita: Ações e Botões alinhados na lateral */}
        {(actionText || secondaryActionText || timestamp || onClose) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              flexShrink: 0,
              ml: { xs: 'auto', sm: 0 },
            }}
          >
            {timestamp && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: isDark ? token.subtextDark : token.subtext,
                  opacity: 0.75,
                  whiteSpace: 'nowrap',
                  mr: 0.5,
                }}
              >
                {timestamp}
              </Typography>
            )}

            {secondaryActionText && onSecondaryAction && (
              <EdgerButton
                variant="slate"
                size="small"
                onClick={onSecondaryAction}
              >
                {secondaryActionText}
              </EdgerButton>
            )}

            {actionText && onAction && (
              <EdgerButton
                variant={variant}
                size="small"
                onClick={onAction}
              >
                {actionText}
              </EdgerButton>
            )}

            {onClose && (
              <IconButton
                size="small"
                onClick={onClose}
                sx={{
                  p: 0.5,
                  color: isDark ? token.subtextDark : token.subtext,
                  opacity: 0.7,
                  '&:hover': {
                    opacity: 1,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Iconify icon="solar:close-circle-bold" width={18} />
              </IconButton>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
