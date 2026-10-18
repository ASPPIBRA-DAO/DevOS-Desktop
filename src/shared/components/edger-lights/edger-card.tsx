import type { EdgerCardProps } from './types';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from '../iconify';
import { EdgerButton } from './edger-button';
import { EDGER_TOKENS } from './edger-tokens';
import { EdgerSquircleBadge } from './edger-badge';

// ----------------------------------------------------------------------
// EDGER Lights Card: "Soft Colors. Sharp Edges."
// ----------------------------------------------------------------------

export function EdgerCard({
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
}: EdgerCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const token = EDGER_TOKENS[variant];

  // Cálculo da elevação 3D conforme o modelo discriminado:
  // - 'lateral': Destaque tátil na borda lateral esquerda (sem borda inferior)
  // - 'bottom': Destaque tátil na borda inferior em camada sólida 3D (sem borda lateral)
  const getElevationStyles = () => {
    if (!elevation3D) return {};

    if (edgeStyle === 'lateral') {
      return {
        boxShadow: isDark
          ? `-5px 0 0 0 ${token.accent}, -8px 12px 24px -4px rgba(0, 0, 0, 0.6)`
          : `-4.5px 0 0 0 ${token.accent}, -6px 10px 22px -3px ${token.shadow}`,
        '&:hover': {
          transform: 'translateX(2px) translateY(-1px)',
          boxShadow: isDark
            ? `-7px 0 0 0 ${token.accent}, -12px 16px 28px -4px rgba(0, 0, 0, 0.7)`
            : `-6.5px 0 0 0 ${token.accent}, -10px 14px 26px -3px ${token.shadow}`,
        },
      };
    }

    return {
      boxShadow: isDark
        ? `0 5px 0 0 ${token.accent}, 0 12px 24px -4px rgba(0, 0, 0, 0.6)`
        : `0 4.5px 0 0 ${token.accent}, 0 10px 20px -3px ${token.shadow}`,
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: isDark
          ? `0 7px 0 0 ${token.accent}, 0 16px 28px -4px rgba(0, 0, 0, 0.7)`
          : `0 6.5px 0 0 ${token.accent}, 0 14px 24px -3px ${token.shadow}`,
      },
    };
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: 1,
        borderRadius: '16px',
        bgcolor: isDark ? token.bgDark : token.bg,
        border: `1.5px solid ${isDark ? token.borderDark : token.border}`,
        overflow: 'hidden',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        ...getElevationStyles(),
        ...sx,
      }}
    >
      <Box sx={{ p: { xs: 2.2, sm: 2.8 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Squircle Badge com Inner Light Bevel */}
          {icon && (
            <EdgerSquircleBadge
              icon={icon}
              variant={variant}
              pulse={pulse}
              size={48}
            />
          )}

          {/* Conteúdo Central */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {/* Header: Título + Badge de Não Lido + Timestamp + Botão Fechar */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                mb: 0.6,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: isDark ? token.textDark : token.text,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {title}
                </Typography>

                {/* Dot Pulsante de Não Lido */}
                {unread && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      minWidth: 8,
                      borderRadius: '50%',
                      bgcolor: token.accent,
                      boxShadow: `0 0 0 3px ${isDark ? token.borderDark : token.border}`,
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                {timestamp && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: isDark ? token.subtextDark : token.subtext,
                      opacity: 0.85,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {timestamp}
                  </Typography>
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
            </Box>

            {/* Descrição em Tipografia Suave */}
            <Typography
              variant="body2"
              sx={{
                color: isDark ? token.subtextDark : token.subtext,
                fontSize: '0.875rem',
                lineHeight: 1.55,
                mb: actionText ? 2 : 0,
              }}
            >
              {description}
            </Typography>

            {/* Ações Embutidas (EDGER Micro Action Buttons) */}
            {(actionText || secondaryActionText) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mt: 1.8 }}>
                {actionText && onAction && (
                  <EdgerButton
                    variant={variant}
                    size="small"
                    onClick={onAction}
                  >
                    {actionText}
                  </EdgerButton>
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
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
