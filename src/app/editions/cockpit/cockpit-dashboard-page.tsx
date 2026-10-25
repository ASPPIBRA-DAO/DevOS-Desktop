import React from 'react';
import { useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from '../../../routes/paths';
import { colors } from '../../../shared/theme/palette';
import { Iconify } from '../../../shared/components/iconify';
import { MetricBox } from '../../../shared/components/MetricBox';
import { StatusBadge } from '../../../shared/components/StatusBadge';

export function CockpitDashboardPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 4, pb: 3, borderBottom: `1px solid ${colors.background.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            DevOS Admin
          </Typography>
          <StatusBadge status="ACTIVE" label="Edição Administrador" />
        </Box>
        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
          Painel Institucional de Administração de Cluster & Governança ASPPIBRA DAO
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: 'repeat(4, 1fr)',
          },
          gap: 2.5,
        }}
      >
        <MetricBox
          label="Total de Nós Ativos"
          value="128 Nós"
          subtext="Rede global de armazenamento"
          accentColor={colors.primary.main}
        />
        <MetricBox
          label="Capacidade Total Pinada"
          value="512 TB"
          subtext="Replicação mínima 3x por CID"
          accentColor={colors.success.main}
        />
        <MetricBox
          label="SLA Médio da Rede"
          value="99.98%"
          subtext="Desafios DePIN validados com sucesso"
          accentColor={colors.info.main}
        />
        <MetricBox
          label="Tesouraria / Staking"
          value="6.400.000 ASPPBR"
          subtext="Bloqueado em smart contract de nós"
          accentColor={colors.warning.main}
        />
      </Box>

      {/* Acesso Direto às Ferramentas Críticas */}
      <Card
        sx={{
          mt: 4,
          p: 3,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          background: 'linear-gradient(135deg, rgba(0, 167, 111, 0.08) 0%, rgba(0, 210, 255, 0.04) 100%)',
          border: '1px solid rgba(0, 167, 111, 0.25)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 167, 111, 0.16)',
              color: colors.primary.main,
            }}
          >
            <Iconify icon="solar:city-bold" width={28} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Banco de Dados Imobiliário & Auditoria
              </Typography>
              <StatusBadge status="ACTIVE" label="Pronto para Análise" />
            </Box>
            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
              Motor de conciliação territorial com SQLite segregado em modo WAL, proveniência SHA-256 e emissão de laudos oficiais.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(paths.devos.cadastre)}
          endIcon={<Iconify icon="solar:arrow-right-bold" />}
          sx={{ fontWeight: 700, px: 2.5 }}
        >
          Acessar Banco Imobiliário
        </Button>
      </Card>
    </Box>
  );
}

// Alias de compatibilidade com nomenclatura anterior
export const CockpitDashboardView = CockpitDashboardPage;
