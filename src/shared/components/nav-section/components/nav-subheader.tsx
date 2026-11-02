import type { ListSubheaderProps } from '@mui/material/ListSubheader';

import { mergeClasses } from 'minimal-shared/utils';

import { styled } from '@mui/material/styles';
import ListSubheader from '@mui/material/ListSubheader';

import { navSectionClasses } from '../styles';
import { Iconify, iconifyClasses } from '../../iconify';

// ----------------------------------------------------------------------

export type NavSubheaderProps = ListSubheaderProps & { open?: boolean };

export const NavSubheader = styled(
  ({ open, children, className, ...other }: NavSubheaderProps) => (
    <ListSubheader
      disableSticky
      component="div"
      data-open={open ? 'true' : 'false'}
      className={mergeClasses([
        navSectionClasses.subheader,
        open ? 'is-open' : undefined,
        className,
      ])}
      {...other}
    >
      <Iconify
        width={16}
        icon={open ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
      />
      {children}
    </ListSubheader>
  ),
  {
    shouldForwardProp: (prop) => prop !== 'open',
  }
)<NavSubheaderProps>(({ theme, open }) => ({
  ...theme.typography.overline,
  fontFamily: 'var(--font-orbitron), "Orbitron", sans-serif',
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '1.8px',
  cursor: 'pointer',
  alignItems: 'center',
  position: 'relative',
  gap: theme.spacing(1),
  display: 'inline-flex',
  alignSelf: 'flex-start',
  color: open ? 'var(--nav-subheader-hover-color, text.primary)' : 'var(--nav-subheader-color)',
  padding: theme.spacing(2, 1, 0.8, 1.5),
  marginTop: theme.spacing(1.5),
  width: '100%',
  // 🏛️ Ranhura mecânica chanfrada (Efeito baixo-relevo de canaleta no chassi)
  borderTop: '1px solid rgba(145, 158, 171, 0.18)',
  boxShadow: '0 1px 0 rgba(255, 255, 255, 0.95)',
  ...theme.applyStyles('dark', {
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 1px 0 rgba(0, 0, 0, 0.6)',
  }),
  transition: theme.transitions.create(['color', 'padding-left'], {
    duration: theme.transitions.duration.standard,
  }),
  // 🟢 Micro-LED luminoso indicador de seção (mais vivo quando a seção está ativa/aberta)
  '&::before': {
    content: '""',
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    boxShadow: open
      ? `0 0 10px ${theme.palette.primary.main}`
      : `0 0 4px ${theme.palette.primary.main}`,
    flexShrink: 0,
    opacity: open ? 1 : 0.6,
    transform: open ? 'scale(1.15)' : 'scale(1)',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  ...theme.applyStyles('dark', {
    '&::before': {
      backgroundColor: '#00ff7f',
      boxShadow: open ? '0 0 12px #00ff7f' : '0 0 5px rgba(0, 255, 127, 0.6)',
      opacity: open ? 1 : 0.6,
    },
  }),
  [`& .${iconifyClasses.root}`]: {
    left: -4,
    opacity: 0,
    position: 'absolute',
    transition: theme.transitions.create(['opacity'], {
      duration: theme.transitions.duration.standard,
    }),
  },
  '&:hover': {
    paddingLeft: theme.spacing(2),
    color: 'var(--nav-subheader-hover-color)',
    '&::before': {
      transform: 'scale(1.3)',
      boxShadow: `0 0 12px ${theme.palette.primary.main}`,
      opacity: 1,
    },
    [`& .${iconifyClasses.root}`]: { opacity: 1 },
  },
}));
