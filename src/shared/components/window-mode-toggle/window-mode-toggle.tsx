import React, { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import { isTauriDesktop } from 'src/platform/tauri/core/invoke';
import { WindowBridge } from 'src/platform/tauri/window/window-bridge';

// ----------------------------------------------------------------------
// Botão de Controle de Janela — Alternância entre Tela Cheia e Modo Janela
// ----------------------------------------------------------------------

export function WindowModeToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDesktop = isTauriDesktop();

  const syncState = useCallback(async () => {
    if (!isDesktop) return;
    const fs = await WindowBridge.isFullscreen();
    setIsFullscreen(fs);
  }, [isDesktop]);

  useEffect(() => {
    void syncState();
    const interval = setInterval(syncState, 1500);

    // Atalho global [F11] para alternar tela cheia nativa
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F11') {
        event.preventDefault();
        void WindowBridge.toggleFullscreen().then((next) => setIsFullscreen(next));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [syncState]);

  const handleToggle = async () => {
    const next = await WindowBridge.toggleFullscreen();
    setIsFullscreen(next);
  };

  if (!isDesktop) {
    return null;
  }

  return (
    <Tooltip
      title={
        isFullscreen
          ? 'Reduzir para Janela Normal [F11]'
          : 'Expandir para Tela Cheia [F11]'
      }
      arrow
    >
      <Button
        size="small"
        variant="outlined"
        onClick={handleToggle}
        data-testid="window-mode-toggle-btn"
        sx={{
          py: 0.4,
          px: 1.2,
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: 0.3,
          textTransform: 'none',
          color: isFullscreen ? '#00b8d9' : 'text.secondary',
          borderColor: isFullscreen ? 'rgba(0, 184, 217, 0.4)' : 'rgba(145, 158, 171, 0.24)',
          bgcolor: isFullscreen ? 'rgba(0, 184, 217, 0.08)' : 'transparent',
          borderRadius: 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.8,
          '&:hover': {
            borderColor: '#00b8d9',
            color: '#00b8d9',
            bgcolor: 'rgba(0, 184, 217, 0.12)',
          },
        }}
      >
        {isFullscreen ? (
          <>
            {/* Ícone de Janela / Reduzir */}
            <Box
              component="svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              sx={{ width: 14, height: 14 }}
            >
              <rect x="8" y="8" width="13" height="13" rx="2" />
              <path d="M5 16H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" />
            </Box>
            <span>Modo Janela</span>
          </>
        ) : (
          <>
            {/* Ícone de Expandir Tela Cheia */}
            <Box
              component="svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              sx={{ width: 14, height: 14 }}
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </Box>
            <span>Tela Cheia</span>
          </>
        )}
      </Button>
    </Tooltip>
  );
}
