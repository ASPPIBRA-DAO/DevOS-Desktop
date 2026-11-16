import React from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Iconify } from 'src/shared/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  name: string;
  role?: string;
  avatarUrl?: string;
  coverUrl?: string;
  currentTab: string;
  onChangeTab: (event: React.SyntheticEvent, newValue: string) => void;
};

export const TABS = [
  { value: 'profile', label: 'Profile', icon: 'solar:user-id-bold' },
  { value: 'followers', label: 'Followers', icon: 'solar:heart-bold' },
  { value: 'friends', label: 'Friends', icon: 'solar:users-group-rounded-bold' },
  { value: 'gallery', label: 'Gallery', icon: 'solar:gallery-wide-bold' },
];

export function ProfileCover({
  name,
  role = 'Usuário',
  avatarUrl,
  coverUrl,
  currentTab,
  onChangeTab,
}: Props) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        mb: 3,
        height: 280,
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: theme.shadows[2],
      }}
    >
      {/* Imagem de Capa Panorâmica com Gradiente Fluido */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: coverUrl
            ? `url(${coverUrl}) center center / cover no-repeat`
            : `linear-gradient(135deg, #072e21 0%, #004d35 40%, #007753 75%, #05a06c 100%)`,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(to bottom, rgba(4, 25, 18, 0.1) 0%, rgba(4, 25, 18, 0.75) 100%)',
          },
        }}
      />

      {/* Conteúdo Sobreposto: Avatar + Nome + Tabs */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9,
          px: { xs: 2.5, md: 3 },
          pb: { xs: 1.5, md: 2 },
          alignItems: { xs: 'flex-start', md: 'flex-end' },
          justifyContent: 'space-between',
        }}
      >
        {/* Lado Esquerdo: Avatar Circular e Nome */}
        <Stack direction="row" spacing={2.5} sx={{ alignItems: 'flex-end', mb: { xs: 1.5, md: 0 } }}>
          <Avatar
            src={avatarUrl}
            alt={name}
            sx={{
              width: { xs: 80, md: 108 },
              height: { xs: 80, md: 108 },
              border: `4px solid ${theme.palette.common.white}`,
              bgcolor: 'rgba(255, 255, 255, 0.25)',
              color: theme.palette.common.white,
              boxShadow: theme.shadows[4],
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 800,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </Avatar>

          <Box sx={{ color: 'common.white', mb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              {name}
            </Typography>
            <Typography
              variant="body2"
              sx={{ opacity: 0.85, fontWeight: 500, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
            >
              {role}
            </Typography>
          </Box>
        </Stack>

        {/* Lado Direito: Barra de Abas (Tabs) */}
        <Box
          sx={{
            width: { xs: '100%', md: 'auto' },
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 1.5,
            px: 1,
            py: 0.5,
            boxShadow: theme.shadows[2],
          }}
        >
          <Tabs
            value={currentTab}
            onChange={onChangeTab}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                minHeight: 44,
                fontWeight: 700,
                fontSize: '0.82rem',
                textTransform: 'none',
                px: 2,
              },
            }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                icon={<Iconify icon={tab.icon} width={18} />}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>
      </Stack>
    </Card>
  );
}
