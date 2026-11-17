import React from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  name: string;
  role?: string;
  avatarUrl?: string;
  coverUrl?: string;
  currentTab: string;
  onChangeTab: (event: React.SyntheticEvent, newValue: string) => void;
  onUpdateAvatar?: (url: string) => void;
  onUpdateCover?: (url: string) => void;
};

export const TABS = [
  { value: 'profile', label: 'Visão Geral', icon: 'solar:user-id-bold' },
  { value: 'identity', label: 'Identidade Civil', icon: 'solar:document-text-bold' },
  { value: 'notifications', label: 'Notificações', icon: 'solar:bell-bing-bold' },
  { value: 'socials', label: 'Redes Sociais', icon: 'solar:share-bold' },
  { value: 'security', label: 'Segurança', icon: 'ic:round-vpn-key' },
  { value: '2fa', label: 'Autenticador 2FA', icon: 'solar:shield-keyhole-bold' },
];

export function ProfileCover({
  name,
  role = 'Usuário',
  avatarUrl,
  coverUrl,
  currentTab,
  onChangeTab,
  onUpdateAvatar,
  onUpdateCover,
}: Props) {
  const theme = useTheme();

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateCover?.(url);
      toast.success('Foto de capa atualizada!');
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateAvatar?.(url);
      toast.success('Foto de perfil atualizada!');
    }
  };

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

      {/* Botão de Trocar Capa Diretamente no Banner */}
      <IconButton
        component="label"
        size="small"
        sx={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 10,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          color: 'common.white',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
          px: 1.5,
          py: 0.6,
          borderRadius: 1.5,
          gap: 0.8,
        }}
      >
        <Iconify icon="solar:camera-add-bold" width={18} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'common.white' }}>
          Trocar Capa
        </Typography>
        <input type="file" hidden accept="image/*" onChange={handleCoverChange} />
      </IconButton>

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
        {/* Lado Esquerdo: Avatar Circular com Botão de Câmera e Nome */}
        <Stack direction="row" spacing={2.5} sx={{ alignItems: 'flex-end', mb: { xs: 1.5, md: 0 }, flexShrink: 0 }}>
          <Box sx={{ position: 'relative' }}>
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

            <IconButton
              component="label"
              size="small"
              sx={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: theme.shadows[3],
                border: `2px solid ${theme.palette.common.white}`,
                '&:hover': { bgcolor: 'primary.dark' },
                width: 32,
                height: 32,
              }}
            >
              <Iconify icon="solar:camera-bold" width={17} />
              <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
            </IconButton>
          </Box>

          <Box sx={{ color: 'common.white', mb: 1, minWidth: 0, flexShrink: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
              {name}
            </Typography>
            <Typography
              variant="body2"
              sx={{ opacity: 0.85, fontWeight: 500, textShadow: '0 1px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}
            >
              {role}
            </Typography>
          </Box>
        </Stack>

        {/* Lado Direito: Barra de Ícones de Navegação (Dock Otimizado) */}
        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(12px)',
            borderRadius: 2,
            p: 0.5,
            boxShadow: theme.shadows[3],
            border: '1px solid rgba(255, 255, 255, 0.6)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Tabs
            value={currentTab}
            onChange={onChangeTab}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 40,
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
              '& .MuiTab-root': {
                minHeight: 40,
                minWidth: 44,
                width: 44,
                p: 0,
                borderRadius: 1.5,
                transition: 'all 0.2s ease-in-out',
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main',
                  bgcolor: theme.palette.action.selected,
                },
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
              },
            }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                icon={
                  <Tooltip title={tab.label} arrow placement="top">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 1, height: 1 }}>
                      <Iconify icon={tab.icon} width={22} />
                    </Box>
                  </Tooltip>
                }
                aria-label={tab.label}
              />
            ))}
          </Tabs>
        </Box>
      </Stack>
    </Card>
  );
}
