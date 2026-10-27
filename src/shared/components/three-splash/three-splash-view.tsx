import type { ThreeSplashProps } from './types';

import React, { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { AnimateLogoZoom } from '../animate';
import { Web3GlobeScene } from './web3-globe-scene';
import { isWebGLAvailable, isReducedMotionPreferred } from './webgl-detector';

// ----------------------------------------------------------------------
// Componente de Inicialização Three.js em Tela Cheia (100vw / 100vh)
// ----------------------------------------------------------------------

export function ThreeSplashView({
  onComplete,
  durationMs = 3500,
  showSkipButton = true,
  slots,
}: ThreeSplashProps) {
  const [progress, setProgress] = useState(0);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Trigger seguro de conclusão única
  const handleComplete = useCallback(() => {
    if (!isFinished) {
      setIsFinished(true);
      onComplete?.();
    }
  }, [isFinished, onComplete]);

  // 1. Verificação de Capacidade de Hardware e Acessibilidade no Primeiro Render
  useEffect(() => {
    const webGLSupported = isWebGLAvailable();
    const prefersReduced = isReducedMotionPreferred();

    setHasWebGL(webGLSupported);
    setReducedMotion(prefersReduced);

    // Se o ambiente não suportar WebGL ou tiver redução de movimento ativada,
    // concede tempo breve (1200ms) com o logo 2D e conclui o splash
    if (!webGLSupported || prefersReduced) {
      const fallbackTimer = setTimeout(() => {
        handleComplete();
      }, 1200);
      return () => clearTimeout(fallbackTimer);
    }

    return undefined;
  }, [handleComplete]);



  // 3. Listener do Teclado para Atalho de Pular [Esc]
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleComplete]);

  // 4. Caso Fallback: WebGL Indisponível ou Redução de Movimento Ativada
  if (!hasWebGL || reducedMotion) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          bgcolor: '#0b0f19',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <AnimateLogoZoom />
        <Typography
          variant="caption"
          sx={{
            mt: 3,
            color: 'text.secondary',
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
          }}
        >
          {reducedMotion ? 'Inicializando DevOS' : 'Inicializando em Modo de Compatibilidade'}
        </Typography>
      </Box>
    );
  }

  // 5. Renderização em Tela Cheia da Cena 3D com HUD Gamer Futurista
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        bgcolor: '#0b0f19',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Ponto de Encaixe 3D: Slot Customizado ou Cena Principal do Globo Web3 */}
      {slots?.customScene ? (
        slots.customScene
      ) : (
        <Web3GlobeScene
          durationMs={durationMs}
          onProgress={(p) => setProgress(Math.round(p * 100))}
          onFinished={handleComplete}
        />
      )}

      {/* HUD Superior: Status do Motor e Marca */}
      <Box
        sx={{
          position: 'absolute',
          top: 32,
          left: 40,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: '#00b8d9',
            letterSpacing: 3,
            fontWeight: 700,
            fontSize: '0.75rem',
          }}
        >
          DevOS // Secure Enterprise Engine
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
            letterSpacing: 1.5,
            fontSize: '0.7rem',
          }}
        >
          Carregando ambiente nativo...
        </Typography>
      </Box>

      {/* HUD Inferior: Barra de Progresso Cinematográfica e Ação Pular */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 36,
          left: 40,
          right: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
        }}
      >
        <Box sx={{ flexGrow: 1, maxWidth: 420 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem', letterSpacing: 1 }}
            >
              INICIALIZAÇÃO DO SUBSISTEMA
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: '#00b8d9', fontWeight: 700, fontSize: '0.7rem' }}
            >
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#00b8d9',
                backgroundImage: 'linear-gradient(90deg, #0c68e9 0%, #00b8d9 100%)',
              },
            }}
          />
        </Box>

        {showSkipButton && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleComplete}
            data-testid="three-splash-skip-button"
            sx={{
              color: 'rgba(255, 255, 255, 0.75)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              fontSize: '0.75rem',
              letterSpacing: 1,
              px: 2,
              py: 0.5,
              backdropFilter: 'blur(8px)',
              bgcolor: 'rgba(11, 15, 25, 0.5)',
              '&:hover': {
                borderColor: '#00b8d9',
                color: '#00b8d9',
                bgcolor: 'rgba(0, 184, 217, 0.12)',
              },
            }}
          >
            Pular [Esc]
          </Button>
        )}
      </Box>
    </Box>
  );
}
