import { createTheme } from '@mui/material/styles';

import { colors } from './palette';
import { typography } from './typography';

export const devosTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: colors.text,
    divider: colors.background.border,
  },
  typography,
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background.default,
          backgroundImage: [
            'radial-gradient(at 0% 0%, rgba(0, 255, 127, 0.06) 0px, transparent 50%)',
            'radial-gradient(at 100% 0%, rgba(0, 210, 255, 0.05) 0px, transparent 50%)',
            'radial-gradient(at 50% 50%, rgba(145, 158, 171, 0.03) 0px, transparent 60%)',
            colors.background.default,
          ].join(', '),
          backgroundAttachment: 'fixed',
          color: colors.text.primary,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 167, 111, 0.85) rgba(145, 158, 171, 0.1)',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, rgba(0, 255, 127, 0.85) 0%, rgba(0, 167, 111, 0.75) 100%)',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: colors.background.paper,
          border: `1px solid ${colors.background.border}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
  },
});

