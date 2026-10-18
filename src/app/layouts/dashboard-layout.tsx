import React from 'react';
import currentEdition from '@edition';
import { Link, Outlet, useLocation } from 'react-router';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { colors } from '../../shared/theme/palette';
import { StatusBadge } from '../../shared/components/StatusBadge';

export function DashboardLayout() {
  const location = useLocation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: colors.background.default,
      }}
    >
      {/* Top Header / Desktop Titlebar */}
      <Box
        component="header"
        sx={{
          height: 64,
          borderBottom: `1px solid ${colors.background.border}`,
          backgroundColor: 'rgba(11, 15, 25, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          position: 'sticky',
          top: 0,
          zIndex: 1100,
        }}
      >
        {/* Identificador & Edição */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              color: '#000',
              fontSize: '1rem',
              boxShadow: `0 0 16px -2px ${colors.primary.main}66`,
            }}
          >
            D
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, color: colors.text.primary }}>
              ASPPIBRA DevOS
            </Typography>
            <Typography variant="caption" sx={{ color: colors.text.secondary, fontSize: '0.6875rem' }}>
              {currentEdition.name} • {currentEdition.subtitle}
            </Typography>
          </Box>
        </Box>

        {/* Rotas de Navegação */}
        <Box component="nav" sx={{ display: 'flex', gap: 1 }}>
          {currentEdition.routes.map((r) => {
            const isActive = location.pathname === r.path;
            return (
              <Box
                key={r.path}
                component={Link}
                to={r.path}
                sx={{
                  textDecoration: 'none',
                  px: 2,
                  py: 1,
                  borderRadius: 1.5,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  color: isActive ? colors.primary.main : colors.text.secondary,
                  backgroundColor: isActive ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(0, 240, 255, 0.2)' : 'transparent'}`,
                  '&:hover': {
                    color: colors.text.primary,
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  },
                }}
              >
                {r.label}
              </Box>
            );
          })}
        </Box>

        {/* Status do Motor */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <StatusBadge status="ONLINE" label="Rust IPC v2" />
        </Box>
      </Box>

      {/* Conteúdo Principal */}
      <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
