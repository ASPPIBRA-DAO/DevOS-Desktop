import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/shared/components/iconify';

// ----------------------------------------------------------------------

type FormSocialsProps = BoxProps & {
  signInWithGoogle?: () => void;
  singInWithGithub?: () => void;
  signInWithTwitter?: () => void;
  signInWithWeb3?: () => void;
};

export function FormSocials({
  sx,
  signInWithGoogle,
  singInWithGithub,
  signInWithTwitter,
  signInWithWeb3,
  ...other
}: FormSocialsProps) {
  return (
    <Box
      sx={[
        {
          gap: 1.5,
          display: 'flex',
          justifyContent: 'center',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {signInWithGoogle && (
        <IconButton
          color="inherit"
          onClick={signInWithGoogle}
          title="Entrar com Google"
          sx={{
            border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
              transform: 'scale(1.1)',
              boxShadow: (theme) => `0 0 15px ${alpha(theme.palette.info.main, 0.3)}`,
            },
          }}
        >
          <Iconify width={22} icon="logos:google-icon" />
        </IconButton>
      )}

      {singInWithGithub && (
        <IconButton
          color="inherit"
          onClick={singInWithGithub}
          title="Entrar com GitHub"
          sx={{
            border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
              transform: 'scale(1.1)',
              boxShadow: (theme) => `0 0 15px ${alpha(theme.palette.info.main, 0.3)}`,
            },
          }}
        >
          <Iconify width={22} icon="logos:github-icon" />
        </IconButton>
      )}

      {signInWithWeb3 && (
        <IconButton
          color="inherit"
          onClick={signInWithWeb3}
          title="Entrar com Web3 / MetaMask"
          sx={{
            border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
              transform: 'scale(1.1)',
              boxShadow: (theme) => `0 0 15px ${alpha(theme.palette.info.main, 0.3)}`,
            },
          }}
        >
          <Iconify width={22} icon="logos:metamask-icon" />
        </IconButton>
      )}

      {signInWithTwitter && (
        <IconButton
          color="inherit"
          onClick={signInWithTwitter}
          title="Entrar com Twitter"
          sx={{
            border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
              transform: 'scale(1.1)',
              boxShadow: (theme) => `0 0 15px ${alpha(theme.palette.info.main, 0.3)}`,
            },
          }}
        >
          <Iconify width={22} icon={'logos:twitter' as any} />
        </IconButton>
      )}
    </Box>
  );
}
