import type { EdgerButtonProps } from './types';

import ButtonBase from '@mui/material/ButtonBase';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from '../iconify';
import { EDGER_TOKENS } from './edger-tokens';

// ----------------------------------------------------------------------
// EDGER Micro Action Button: "Sharp Edges, Tactile Feedback"
// Modelo Oficial sincronizado com AppPriorityAlerts
// ----------------------------------------------------------------------

export function EdgerButton({
  children,
  variant = 'sky',
  size = 'medium',
  icon,
  iconPosition = 'start',
  onClick,
  disabled = false,
  fullWidth = false,
  sx,
}: EdgerButtonProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const token = EDGER_TOKENS[variant];

  // Size scales
  const sizeStyles = {
    small: {
      py: 0.5,
      px: 1.5,
      fontSize: '0.75rem',
      borderRadius: '8px',
      iconSize: 15,
      gap: 0.8,
    },
    medium: {
      py: 0.8,
      px: 1.8,
      fontSize: '0.82rem',
      borderRadius: '8px',
      iconSize: 18,
      gap: 1,
    },
    large: {
      py: 1,
      px: 2.2,
      fontSize: '0.90rem',
      borderRadius: '10px',
      iconSize: 20,
      gap: 1.2,
    },
  }[size];

  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={{
        width: fullWidth ? 1 : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontFamily: theme.typography.fontFamily,
        letterSpacing: '0.01em',
        py: sizeStyles.py,
        px: sizeStyles.px,
        fontSize: sizeStyles.fontSize,
        borderRadius: sizeStyles.borderRadius,
        gap: sizeStyles.gap,
        color: isDark ? token.textDark : token.text,
        bgcolor: alpha(token.accent, isDark ? 0.22 : 0.14),
        border: `1px solid ${alpha(token.accent, isDark ? 0.35 : 0.28)}`,
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        userSelect: 'none',

        // Estilo no Hover (sem movimento de transform)
        '&:hover:not(:disabled)': {
          bgcolor: alpha(token.accent, isDark ? 0.30 : 0.22),
          boxShadow: `0 4px 10px ${alpha(token.accent, 0.25)}, inset 0 1px 0 rgba(255, 255, 255, 0.7)`,
        },

        // Feedback de Clique (sem movimento de transform)
        '&:active:not(:disabled)': {
          boxShadow: isDark
            ? `0 1px 3px rgba(0, 0, 0, 0.5)`
            : `0 1px 2px rgba(0, 0, 0, 0.06)`,
        },

        ...sx,
      }}
    >
      {icon && iconPosition === 'start' && (
        typeof icon === 'string' ? (
          <Iconify icon={icon as any} width={sizeStyles.iconSize} sx={{ color: isDark ? token.accent : token.accent }} />
        ) : (
          icon
        )
      )}

      {children}

      {icon && iconPosition === 'end' && (
        typeof icon === 'string' ? (
          <Iconify icon={icon as any} width={sizeStyles.iconSize} sx={{ color: isDark ? token.accent : token.accent }} />
        ) : (
          icon
        )
      )}
    </ButtonBase>
  );
}
