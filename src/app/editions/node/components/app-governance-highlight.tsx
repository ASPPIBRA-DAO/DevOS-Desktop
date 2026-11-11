import type { GovernanceHighlight } from '../types/home';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { RouterLink } from 'src/app/router/components/router-link';

import { Iconify } from 'src/shared/components/iconify';

import { fToNow } from '../utils/format-time';

type Props = {
  highlight: GovernanceHighlight;
};

export function AppGovernanceHighlight({ highlight }: Props) {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardHeader
        title="Governança em Destaque"
        action={
          <Button
            component={RouterLink}
            href="/devos/infrastructure"
            size="small"
            color="primary"
          >
            Ver Todas
          </Button>
        }
      />

      <Box sx={{ p: 2.5, pt: 1 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Iconify icon="solar:diploma-bold-duotone" width={20} sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Proposta Ativa #{highlight.proposalId}
            </Typography>
          </Stack>

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {highlight.title}
          </Typography>

          <Stack direction="row" sx={{ pt: 1, alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Encerra {fToNow(highlight.votingDeadline)}
            </Typography>

            <Button
              component={RouterLink}
              href="/devos/infrastructure"
              variant="contained"
              size="small"
              color="primary"
            >
              Votar Agora
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Card>
  );
}
