import type { CSSObject } from '@mui/material/styles';

import { styled } from '@mui/material/styles';
import Popover, { popoverClasses } from '@mui/material/Popover';

// ----------------------------------------------------------------------

export const NavDropdownPaper = styled('div')(({ theme }) => ({
  minWidth: 180,
  borderRadius: 12,
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.48)',
  border: `1px solid ${theme.palette.divider}`,
}));

// ----------------------------------------------------------------------

export const NavDropdown = styled(Popover)(({ open, theme }) => ({
  pointerEvents: 'none',
  [`& .${popoverClasses.paper}`]: {
    boxShadow: 'none',
    overflow: 'unset',
    backdropFilter: 'none',
    background: 'transparent',
    padding: theme.spacing(0, 0.75),
    ...(open && { pointerEvents: 'auto' }),
  } as CSSObject,
}));
