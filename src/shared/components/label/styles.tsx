import type { LabelColor, LabelVariant } from './types';

import { alpha, styled } from '@mui/material/styles';

export const LabelRoot = styled('span', {
  shouldForwardProp: (prop: string) => !['color', 'variant', 'disabled', 'sx'].includes(prop),
})<{ variant?: LabelVariant; color?: LabelColor; disabled?: boolean }>(({ theme, variant = 'soft', color = 'default', disabled }) => {
  const isDefault = color === 'default';
  const paletteColor = isDefault ? null : theme.palette[color];

  const getStyles = () => {
    if (variant === 'filled') {
      return {
        color: isDefault ? theme.palette.common.white : paletteColor?.contrastText,
        backgroundColor: isDefault ? theme.palette.grey[700] : paletteColor?.main,
      };
    }

    if (variant === 'outlined') {
      return {
        color: isDefault ? theme.palette.text.primary : paletteColor?.main,
        border: `1px solid ${isDefault ? theme.palette.grey[700] : paletteColor?.main}`,
      };
    }

    // Default: 'soft'
    return {
      color: isDefault ? theme.palette.text.secondary : paletteColor?.light ?? paletteColor?.main,
      backgroundColor: isDefault ? alpha(theme.palette.grey[500], 0.16) : alpha(paletteColor?.main ?? '#000', 0.16),
    };
  };

  return {
    height: 24,
    minWidth: 24,
    lineHeight: 1,
    cursor: 'default',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    justifyContent: 'center',
    padding: theme.spacing(0, 0.75),
    fontSize: theme.typography.pxToRem(12),
    fontWeight: 700,
    borderRadius: Number(theme.shape.borderRadius) * 0.75,
    transition: 'all 0.2s ease',
    ...(disabled && {
      opacity: 0.48,
      pointerEvents: 'none',
    }),
    ...getStyles(),
  };
});

export const LabelIcon = styled('span')({
  width: 16,
  height: 16,
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& svg, & img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});
