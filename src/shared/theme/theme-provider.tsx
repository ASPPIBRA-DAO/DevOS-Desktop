import React, { useMemo } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

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
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background.default,
          color: colors.text.primary,
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '3px',
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useMemo(() => devosTheme, []);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
