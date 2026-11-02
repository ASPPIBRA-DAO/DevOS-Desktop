import './styles.css';

import type { Theme, SxProps } from '@mui/material/styles';

import React, { useRef, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type BlockchainCubeThemeVariant = 'emerald' | 'teal' | 'gold' | 'quartz';

export interface BlockchainCubeProps {
  /** Tamanho do cubo central em pixels (padrão: 140) */
  size?: number;
  /** Dimensão do palco isométrico 3D (padrão: 320) */
  stageSize?: number;
  /** Paleta de cores temática criptográfica (padrão: 'emerald') */
  themeVariant?: BlockchainCubeThemeVariant;
  /** Sobrescrever cor primária do brilho perimetral e arestas */
  primaryColor?: string;
  /** Sobrescrever cor secundária de ondas e CIDs */
  secondaryColor?: string;
  /** Sobrescrever cor de realce e dados */
  accentColor?: string;
  /** Fator multiplicador de brilho especular e glow neon (padrão: 1.4) */
  glowMultiplier?: number;
  /** Rótulo do bloco (padrão: '#0001 (GENESIS)') */
  blockNumber?: string;
  /** Hash raiz da árvore Merkle */
  merkleRoot?: string;
  /** Nonce de validação criptográfica */
  nonce?: string | number;
  /** Status operacional do bloco (padrão: 'VALIDADO') */
  status?: string;
  /** Hash SHA-256 do bloco */
  hash?: string;
  /** Nome da rede de consenso P2P (padrão: 'MAINNET P2P') */
  network?: string;
  /** Quantidade de nós validadores ativos na rede */
  nodeCount?: string | number;
  /** Mecanismo de consenso (padrão: 'PoS / DePIN') */
  consensusType?: string;
  /** Total de transações registradas no bloco */
  txCount?: string | number;
  /** Taxa de transações por segundo */
  tps?: string | number;
  /** Content Identifier (CID) IPFS atrelado ao bloco */
  cid?: string;
  /** Protocolo de representação de dados (padrão: 'IPFS DAG') */
  protocol?: string;
  /** Permite rotação interativa orbital via clique e arraste do mouse/touch */
  interactive?: boolean;
  /** Ativa rotação automática contínua em torno do eixo Z */
  autoRotate?: boolean;
  /** Velocidade da auto-rotação em graus por frame (padrão: 0.3) */
  autoRotateSpeed?: number;
  /** Ativa flutuação elástica contínua do bloco */
  levitate?: boolean;
  /** Exibe a malha cibernética do piso isométrico */
  showGrid?: boolean;
  /** Exibe o anel holográfico giratório no solo */
  showHalo?: boolean;
  /** Exibe as partículas luminosas em órbita 3D */
  showParticles?: boolean;
  /** Exibe as ondas holográficas de propagação de consenso */
  showWaves?: boolean;
  /** Exibe a sombra dinâmica projetada sob o bloco */
  showShadow?: boolean;
  /** Estilos adicionais via MUI SxProps */
  sx?: SxProps<Theme>;
  /** Classe CSS customizada */
  className?: string;
}

// ----------------------------------------------------------------------

export function BlockchainCube({
  size = 140,
  stageSize = 320,
  themeVariant = 'emerald',
  primaryColor,
  secondaryColor,
  accentColor,
  glowMultiplier = 1.4,
  blockNumber = 'GENESIS #0001',
  merkleRoot = '0x9f8a...e14c',
  nonce = '910482',
  status = 'VALIDADO',
  hash = '0x4a8c...f709',
  network = 'MAINNET P2P',
  nodeCount = '12,480',
  consensusType = 'PoS / DePIN',
  txCount = '3,490',
  tps = '450',
  cid = 'QmXz8...b49e',
  protocol = 'IPFS DAG',
  interactive = true,
  autoRotate = true,
  autoRotateSpeed = 0.3,
  levitate = true,
  showGrid = true,
  showHalo = true,
  showParticles = true,
  showWaves = true,
  showShadow = true,
  sx,
  className,
  ...other
}: BlockchainCubeProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const rotateXRef = useRef(60);
  const rotateZRef = useRef(-45);
  const animFrameRef = useRef<number | null>(null);

  const cubeHalf = size / 2;
  const stageScale = stageSize / 320;

  // Atualiza transform 3D diretamente na GPU sem acionar re-renders no React
  const applyTransform = useCallback(() => {
    if (!stageRef.current) return;
    stageRef.current.style.transform = `scale(${stageScale}) rotateX(${rotateXRef.current}deg) rotateZ(${rotateZRef.current}deg)`;
  }, [stageScale]);

  // Loop de rotação contínua 60 FPS
  useEffect(() => {
    applyTransform();

    const loop = () => {
      if (autoRotate && !isDraggingRef.current && stageRef.current) {
        rotateZRef.current = (rotateZRef.current + autoRotateSpeed) % 360;
        applyTransform();
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [autoRotate, autoRotateSpeed, applyTransform]);

  // Gestão de arraste orbital com mouse e touch
  useEffect(() => {
    if (!interactive) return undefined;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - startXRef.current;
      const deltaY = e.clientY - startYRef.current;

      rotateZRef.current = (rotateZRef.current + deltaX * 0.4) % 360;
      rotateXRef.current = Math.max(10, Math.min(85, rotateXRef.current - deltaY * 0.4));

      applyTransform();
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        stageRef.current?.classList.remove('is-dragging');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - startXRef.current;
      const deltaY = e.touches[0].clientY - startYRef.current;

      rotateZRef.current = (rotateZRef.current + deltaX * 0.4) % 360;
      rotateXRef.current = Math.max(10, Math.min(85, rotateXRef.current - deltaY * 0.4));

      applyTransform();
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        stageRef.current?.classList.remove('is-dragging');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [interactive, applyTransform]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    stageRef.current?.classList.add('is-dragging');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!interactive || e.touches.length !== 1) return;
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    stageRef.current?.classList.add('is-dragging');
  };

  // Variáveis CSS inline customizáveis
  const customCssVars = {
    '--bchain-cube-size': `${size}px`,
    '--bchain-cube-half': `${cubeHalf}px`,
    '--bchain-glow-mult': glowMultiplier,
    ...(primaryColor && { '--bchain-primary': primaryColor }),
    ...(secondaryColor && { '--bchain-secondary': secondaryColor }),
    ...(accentColor && { '--bchain-accent': accentColor }),
  } as React.CSSProperties;

  return (
    <Box
      className={`bchain-cube-viewport bchain-theme-${themeVariant} ${className || ''}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={customCssVars}
      sx={[
        {
          width: '100%',
          height: '100%',
          minHeight: stageSize,
          minWidth: stageSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <div
        ref={stageRef}
        className={`bchain-cube-stage ${interactive ? '' : 'non-interactive'}`}
      >
        {/* Chão Isométrico & Grid Cibernético */}
        {showGrid && <div className="bchain-cube-floor-grid" />}

        {/* Halo Holográfico Giratório */}
        {showHalo && <div className="bchain-cube-floor-halo" />}

        {/* Partículas Orbitais 3D */}
        {showParticles && (
          <>
            <div className="bchain-cube-orbit p1" />
            <div className="bchain-cube-orbit p2" />
          </>
        )}

        {/* Container do Bloco 3D */}
        <div className={`bchain-cube-container ${levitate ? 'levitate' : ''}`}>
          {/* Sombra Projetada */}
          {showShadow && <div className="bchain-cube-shadow" />}

          {/* Ondas Holográficas de Consenso */}
          {showWaves && (
            <>
              <div className="bchain-cube-wave" />
              <div className="bchain-cube-wave w2" />
            </>
          )}

          {/* O Bloco e suas 6 Faces */}
          <div className="bchain-cube-3d">
            {/* 1. Face Superior (Top): Genesis & Merkle Root */}
            <div className="bchain-cube-face top">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: 'var(--bchain-primary)',
                    fontFamily: 'monospace',
                  }}
                >
                  {blockNumber}
                </Typography>
                <Iconify icon="solar:shield-check-bold" width={14} sx={{ color: 'var(--bchain-primary)' }} />
              </Box>

              <Box sx={{ textAlign: 'center', my: 'auto' }}>
                <Typography sx={{ fontSize: '0.58rem', color: '#94A3B8', fontWeight: 600 }}>
                  MERKLE ROOT
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.68rem',
                    color: 'var(--bchain-secondary)',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                >
                  {merkleRoot}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.58rem', color: '#94A3B8', fontWeight: 600 }}>
                  NONCE
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.62rem',
                    color: 'var(--bchain-primary)',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                  }}
                >
                  {nonce}
                </Typography>
              </Box>
            </div>

            {/* 2. Face Inferior (Bottom) */}
            <div className="bchain-cube-face bottom" />

            {/* 3. Face Frontal (Front): Validação & Hash */}
            <div className="bchain-cube-face front">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.58rem', color: '#94A3B8', fontWeight: 700 }}>
                  BLOCK NODE
                </Typography>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: 'var(--bchain-accent)',
                    boxShadow: '0 0 8px var(--bchain-accent)',
                  }}
                />
              </Box>

              <Box sx={{ textAlign: 'center', my: 'auto' }}>
                <Typography sx={{ fontSize: '0.62rem', color: '#94A3B8', fontWeight: 600 }}>
                  STATUS
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    color: 'var(--bchain-accent)',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                  }}
                >
                  {status}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: '0.56rem',
                  color: '#94A3B8',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                }}
              >
                {`HASH: ${hash}`}
              </Typography>
            </div>

            {/* 4. Face Traseira (Back): Rede P2P & Consenso */}
            <div className="bchain-cube-face back">
              <Typography sx={{ fontSize: '0.58rem', color: '#94A3B8', fontWeight: 700 }}>
                NETWORK
              </Typography>

              <Box sx={{ textAlign: 'center', my: 'auto' }}>
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    color: 'var(--bchain-accent)',
                    fontWeight: 800,
                  }}
                >
                  {network}
                </Typography>
                <Typography sx={{ fontSize: '0.58rem', color: '#94A3B8', fontWeight: 600 }}>
                  {`NODES: ${nodeCount}`}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: '0.56rem',
                  color: '#94A3B8',
                  textAlign: 'right',
                  fontWeight: 600,
                }}
              >
                {consensusType}
              </Typography>
            </div>

            {/* 5. Face Esquerda (Left): Transações */}
            <div className="bchain-cube-face left">
              <Typography sx={{ fontSize: '0.58rem', color: '#94A3B8', fontWeight: 700 }}>
                TRANSAÇÕES
              </Typography>

              <Box sx={{ my: 'auto' }}>
                <Typography
                  sx={{
                    fontSize: '0.92rem',
                    color: 'var(--bchain-primary)',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                  }}
                >
                  {txCount}
                </Typography>
                <Typography sx={{ fontSize: '0.56rem', color: '#94A3B8', fontWeight: 600 }}>
                  {`TX/SEC: ${tps}`}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: '0.56rem',
                  color: 'var(--bchain-accent)',
                  fontWeight: 800,
                }}
              >
                CONFIRMADO
              </Typography>
            </div>

            {/* 6. Face Direita (Right): IPFS CID & Merkle DAG */}
            <div className="bchain-cube-face right">
              <Typography sx={{ fontSize: '0.58rem', color: '#94A3B8', fontWeight: 700 }}>
                DESCENTRALIZED
              </Typography>

              <Box sx={{ my: 'auto', textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.58rem', color: '#94A3B8', fontWeight: 600 }}>
                  IPFS CID
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.68rem',
                    color: 'var(--bchain-secondary)',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                  }}
                >
                  {cid}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: '0.56rem',
                  color: '#F8FAFC',
                  fontWeight: 600,
                }}
              >
                {protocol}
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </Box>
  );
}
