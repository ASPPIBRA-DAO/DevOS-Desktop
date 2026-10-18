import './styles.css';

import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export interface IpfsCubeProps {
  size?: number;
  color?: string;
  colorLight?: string;
  duration?: number | string;
  maskBg?: string;
  showMask?: boolean;
  showGround?: boolean;
  animated?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
}

export function IpfsCube({
  size = 42,
  color,
  colorLight,
  duration = '3s',
  maskBg,
  showMask = false,
  showGround = false,
  animated = true,
  sx,
  className,
  ...other
}: IpfsCubeProps) {
  const theme = useTheme();

  // Escala balanceada com margem de segurança de ~11px em todos os lados (sem corte)
  // O centro geométrico 3D do cubo montado é X = 82px, Y = 122px (dentro da base 200x320).
  // Altura do cubo montado é ~130px. Com scale = (size * 0.46) / 125, o cubo ocupa ~46%
  // da área, garantindo folga generosa em todas as direções sem cortes na animação.
  const scale = (size * 0.46) / 125;

  // Cores IPFS padrão com suporte a tema claro/escuro
  const primaryColor = color || theme.palette.success.main;
  const lightColor = colorLight || theme.palette.success.light;
  const maskColor = maskBg || theme.palette.background.paper;
  const durationStr = typeof duration === 'number' ? `${duration}s` : duration;

  return (
    <Box
      sx={[
        {
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: 1.5,
          flexShrink: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      className={className}
      {...other}
    >
      <div
        className={`ipfs-cube-loader${showMask ? ' with-mask' : ''}`}
        style={
          {
            '--duration': durationStr,
            '--primary': primaryColor,
            '--primary-light': lightColor,
            '--mask-bg': maskColor,
            position: 'absolute',
            left: '50%',
            top: '50%',
            marginLeft: '-82px',
            marginTop: '-122px',
            transformOrigin: '82px 122px',
            transform: `scale(${scale})`,
            animationPlayState: animated ? 'running' : 'paused',
          } as React.CSSProperties
        }
      >
        <div className="box box0">
          <div />
        </div>
        <div className="box box1">
          <div />
        </div>
        <div className="box box2">
          <div />
        </div>
        <div className="box box3">
          <div />
        </div>
        <div className="box box4">
          <div />
        </div>
        <div className="box box5">
          <div />
        </div>
        <div className="box box6">
          <div />
        </div>
        <div className="box box7">
          <div />
        </div>
        {showGround && (
          <div className="ground">
            <div />
          </div>
        )}
      </div>
    </Box>
  );
}
