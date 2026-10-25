import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { Label } from 'src/components/label';
import { useUserProfile } from 'src/auth/facades';
import { IdentityAvatar } from 'src/auth/components';
import { CyberButton } from 'src/components/cyber-button';

// ----------------------------------------------------------------------

export function NavUpgrade({ sx, ...other }: BoxProps) {
  const { displayName, displayEmail, photoURL, role } = useUserProfile();

  return (
    <Box
      sx={[{ px: 2, py: 2.5, textAlign: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <Box
        sx={(theme) => ({
          p: 2.2,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(248, 250, 252, 0.6) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: [
            '0 8px 24px -4px rgba(15, 23, 42, 0.08)',
            'inset 0 1.5px 0 #ffffff',
            'inset 0 -1px 0 rgba(145, 158, 171, 0.1)',
          ].join(', '),
          ...theme.applyStyles('dark', {
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.55) 0%, rgba(15, 23, 42, 0.7) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          }),
        })}
      >
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              p: '2.5px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00A76F 0%, rgba(145, 158, 171, 0.3) 50%, #00D2FF 100%)',
              boxShadow: '0 4px 14px -2px rgba(0, 167, 111, 0.35), inset 0 1px 1px #ffffff',
            }}
          >
            <IdentityAvatar src={photoURL} alt={displayName} sx={{ width: 48, height: 48 }}>
              {displayName.charAt(0).toUpperCase()}
            </IdentityAvatar>
          </Box>

          <Box
            sx={{
              position: 'absolute',
              bottom: 1,
              right: 1,
              width: 12,
              height: 12,
              bgcolor: '#22c55e',
              border: '2px solid #ffffff',
              borderRadius: '50%',
              boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)',
            }}
          />

          <Label
            color="success"
            variant="filled"
            sx={{
              top: -6,
              px: 0.8,
              left: 38,
              height: 18,
              position: 'absolute',
              fontSize: 10,
              fontWeight: 800,
              fontFamily: 'var(--font-orbitron), "Orbitron", sans-serif',
              letterSpacing: 0.5,
              borderRadius: 0.75,
            }}
          >
            {role?.toUpperCase() || 'USER'}
          </Label>
        </Box>

        <Box sx={{ mb: 2, mt: 1.5, width: 1 }}>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{ mb: 0.5, color: 'var(--layout-nav-text-primary-color)' }}
          >
            {displayName}
          </Typography>

          <Typography
            variant="caption"
            noWrap
            sx={{ color: 'var(--layout-nav-text-disabled-color)' }}
          >
            {displayEmail}
          </Typography>
        </Box>

        <CyberButton
          size="small"
          glowColor="primary"
          href={paths.minimalStore}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            height: 38,
            width: '100%',
            fontSize: 11,
            letterSpacing: 0.5,
          }}
        >
          Upgrade to Pro
        </CyberButton>
      </Box>
    </Box>
  );
}
