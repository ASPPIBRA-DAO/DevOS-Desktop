import type { EcosystemMetrics } from '../types/home';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/shared/components/iconify';

type Props = {
  metrics: EcosystemMetrics;
};

export function AppEcosystemNumbers({ metrics }: Props) {
  const items = [
    {
      title: 'Membros Ativos',
      total: metrics.activeMembers.toLocaleString('pt-BR'),
      icon: 'solar:users-group-rounded-bold-duotone',
      color: 'info',
    },
    {
      title: 'Projetos',
      total: metrics.activeProjects,
      icon: 'solar:folder-with-files-bold-duotone',
      color: 'warning',
    },
    {
      title: 'Parceiros',
      total: metrics.strategicPartners,
      icon: 'solar:handshake-bold-duotone',
      color: 'success',
    },
    {
      title: 'Propostas DAO',
      total: metrics.openProposals,
      icon: 'solar:diploma-bold-duotone',
      color: 'primary',
    },
  ];

  return (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid size={{ xs: 6 }} key={item.title}>
          <Card
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                mb: 1.5,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: `${item.color}.main`,
                bgcolor: (theme) =>
                  theme.vars
                    ? varAlpha(theme.vars.palette[item.color as 'primary'].mainChannel, 0.12)
                    : 'action.hover',
              }}
            >
              <Iconify icon={item.icon} width={24} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {item.total}
            </Typography>

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {item.title}
            </Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export function AppNetworkGrowth({ metrics }: Props) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 2,
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: 'common.white',
      }}
    >
      <Typography variant="subtitle2" sx={{ opacity: 0.85, mb: 1.5 }}>
        Crescimento da Comunidade
      </Typography>

      <Stack spacing={1}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Novos Membros
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            +{metrics.periodGrowth.members}
          </Typography>
        </Stack>

        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Indicações
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            +{metrics.periodGrowth.referrals}
          </Typography>
        </Stack>

        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Parceiros
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            +{metrics.periodGrowth.partners}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}
