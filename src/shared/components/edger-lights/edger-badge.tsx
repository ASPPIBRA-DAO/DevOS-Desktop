import type { EdgerSquircleBadgeProps } from './types';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { Iconify } from '../iconify';
import { EDGER_TOKENS } from './edger-tokens';

// ----------------------------------------------------------------------
// EDGER Squircle Badge: "Glass-Squircle com Anel Interno de Luz"
// ----------------------------------------------------------------------

export function EdgerSquircleBadge({
  icon,
  variant = 'sky',
  size = 46,
  pulse = false,
  solid = false,
  sx,
}: EdgerSquircleBadgeProps & { solid?: boolean }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const token = EDGER_TOKENS[variant];

  return (
    <Box
      sx={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: `${Math.round(size * 0.36)}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: solid ? token.accent : (isDark ? token.badgeBgDark : token.badgeBg),
        border: solid ? 'none' : `1.5px solid ${isDark ? token.borderDark : token.border}`,
        color: solid ? '#FFFFFF' : (isDark ? token.textDark : token.accent),
        boxShadow: solid
          ? `inset 0 1px 1.5px rgba(255, 255, 255, 0.42), 0 2.5px 8px ${token.shadow}`
          : (isDark
              ? `inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 4px 12px ${token.shadow}`
              : `inset 0 1px 1.5px rgba(255, 255, 255, 0.9), 0 4px 10px ${token.shadow}`),
        position: 'relative',
        ...sx,
      }}
    >
      {typeof icon === 'string' ? (
        <Iconify icon={icon as any} width={Math.round(size * 0.52)} />
      ) : (
        icon
      )}
    </Box>
  );
}
