import type { IconButtonProps } from '@mui/material/IconButton';

import { varAlpha } from 'minimal-shared/utils';

import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type NavToggleButtonProps = IconButtonProps & {
  isNavMini: boolean;
};

export function NavToggleButton({ isNavMini, sx, ...other }: NavToggleButtonProps) {
  return (
    <IconButton
      size="small"
      sx={[
        (theme) => ({
          p: 0.5,
          position: 'absolute',
          color: 'action.active',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          transform: 'translate(-50%, -50%)',
          zIndex: 'var(--layout-nav-zIndex)',
          top: 'calc(var(--layout-header-desktop-height) / 2)',
          left: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
          border: '1px solid rgba(145, 158, 171, 0.25)',
          boxShadow: '0 4px 14px 0 rgba(15, 23, 42, 0.14), inset 0 1.5px 0 #ffffff, inset 0 -1px 0 rgba(0,0,0,0.06)',
          backdropFilter: 'blur(8px)',
          transition: theme.transitions.create(['left', 'transform', 'box-shadow', 'border-color'], {
            easing: 'var(--layout-transition-easing)',
            duration: 'var(--layout-transition-duration)',
          }),
          ...theme.applyStyles('dark', {
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
          }),
          '&:hover': {
            color: 'primary.main',
            borderColor: 'primary.main',
            transform: 'translate(-50%, -50%) scale(1.12)',
            boxShadow: `0 6px 20px 0 ${varAlpha(theme.vars.palette.primary.mainChannel, 0.35)}, inset 0 1.5px 0 #ffffff`,
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Iconify
        width={16}
        icon={isNavMini ? 'eva:arrow-ios-forward-fill' : 'eva:arrow-ios-back-fill'}
        sx={(theme) => ({
          ...(theme.direction === 'rtl' && { transform: 'scaleX(-1)' }),
        })}
      />
    </IconButton>
  );
}
