import React from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IpfsCube } from 'src/shared/components/ipfs-cube';
import { BlockchainCube } from 'src/shared/components/blockchain-cube';

import { colors } from 'src/theme';
import { CONFIG } from 'src/global-config';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const metadata = { title: `DevOS Cockpit - Infrastructure - ${CONFIG.appName}` };

interface PinningNode {
  id: string;
  flag: string;
  location: string;
  apy: string;
  operatorStatus: string;
  stake: string;
  monthlyReward: string;
  latency: string;
  uptime: string;
  operationalLoad: number;
}

const PINNING_NODES: PinningNode[] = [
  {
    id: 'node-gru-01',
    flag: '🇧🇷',
    location: 'São Paulo',
    apy: '+8.5% APY',
    operatorStatus: 'Verificado',
    stake: '50.000 ASPP',
    monthlyReward: 'R$ 1.450,00',
    latency: '4 ms',
    uptime: '99.98%',
    operationalLoad: 18,
  },
  {
    id: 'node-gig-01',
    flag: '🇧🇷',
    location: 'Rio de Janeiro',
    apy: '+8.2% APY',
    operatorStatus: 'Verificado',
    stake: '45.000 ASPP',
    monthlyReward: 'R$ 1.320,00',
    latency: '9 ms',
    uptime: '99.95%',
    operationalLoad: 12,
  },
  {
    id: 'node-mia-01',
    flag: '🇺🇸',
    location: 'Miami',
    apy: '+9.1% APY',
    operatorStatus: 'Verificado',
    stake: '60.000 ASPP',
    monthlyReward: 'R$ 1.780,00',
    latency: '32 ms',
    uptime: '99.92%',
    operationalLoad: 45,
  },
  {
    id: 'node-iad-01',
    flag: '🇺🇸',
    location: 'Virginia',
    apy: '+9.4% APY',
    operatorStatus: 'Verificado',
    stake: '75.000 ASPP',
    monthlyReward: 'R$ 2.100,00',
    latency: '41 ms',
    uptime: '99.99%',
    operationalLoad: 38,
  },
];

interface ClusterBucket {
  name: string;
  rootCid: string;
  allocatedVolume: string;
  quotaPercentage: number;
}

const CLUSTER_BUCKETS: ClusterBucket[] = [
  {
    name: 'asppibra-dao-vault-artifacts',
    rootCid: 'bafybeich3...3x4y5z',
    allocatedVolume: '4,80 GB (Quota: 24%)',
    quotaPercentage: 24,
  },
  {
    name: 'asppibra-dao-audit-backups',
    rootCid: 'bafybeid7m...k9l0m1',
    allocatedVolume: '12,40 GB (Quota: 62%)',
    quotaPercentage: 62,
  },
  {
    name: 'asppibra-dao-public-cdn',
    rootCid: 'bafybeie4k...g4h5i6',
    allocatedVolume: '820,00 MB (Quota: 4%)',
    quotaPercentage: 4,
  },
];

export function InfrastructurePage() {
  return (
    <>
      <title>{metadata.title}</title>

      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: 1440,
          mx: 'auto',
          width: '100%',
        }}
      >
        {/* Hero 3D Blockchain Cube & Badge DePIN */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 2.5,
            bgcolor: 'rgba(255, 255, 255, 0.45)',
            border: '1px solid rgba(0, 167, 111, 0.22)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px -4px rgba(0, 167, 111, 0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Dica de Interação 3D Flutuante */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 10,
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              px: 1.5,
              py: 0.6,
              borderRadius: 1.5,
              border: '1px solid rgba(0, 167, 111, 0.25)',
            }}
          >
            <Iconify icon="solar:cursor-bold" width={14} sx={{ color: colors.primary.main }} />
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
              Arraste para girar em 3D
            </Typography>
          </Box>

          {/* Badge DePIN */}
          <Chip
            label="DEPIN • PROOF-OF-STAKE • HOLDERS ATIVOS"
            size="small"
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 10,
              height: 26,
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              bgcolor: 'rgba(0, 167, 111, 0.12)',
              color: colors.primary.main,
              border: '1px solid rgba(0, 167, 111, 0.3)',
              borderRadius: 1,
            }}
          />

          <BlockchainCube
            size={135}
            stageSize={300}
            themeVariant="emerald"
            blockNumber="GENESIS #0001"
            merkleRoot="0x9f8a...e14c"
            nonce="910482"
            status="VALIDADO"
            hash="0x4a8c...f709"
            network="ASPPIBRA DEPIN"
            nodeCount="4 NÓS ATIVOS"
            consensusType="PoS / DePIN"
            txCount="18,02 GB"
            tps="99.98%"
            cid="bafybeich3...3x4y5z"
            protocol="IPFS MESH"
            interactive
            autoRotate
            levitate
          />
        </Box>

        {/* Subheader da Seção: Rede de Pinning */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 2,
          }}
        >
          <Chip
            label="REDE DE PINNING"
            size="small"
            sx={{
              height: 22,
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              bgcolor: 'rgba(0, 167, 111, 0.08)',
              color: colors.primary.main,
              borderRadius: 0.75,
            }}
          />

          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: colors.primary.main,
                boxShadow: '0 0 8px #00A76F',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: colors.primary.main,
                fontSize: '0.78rem',
              }}
            >
              Todos os Nós Aptos a Recompensa
            </Typography>
          </Stack>
        </Box>

        {/* Grid dos 4 Nós Operacionais */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 2.5,
            mb: 3.5,
          }}
        >
          {PINNING_NODES.map((node) => {
            const isWarningLoad = node.operationalLoad > 40;
            const progressColor = isWarningLoad ? colors.warning.main : colors.primary.main;

            return (
              <Box
                key={node.id}
                sx={{
                  position: 'relative',
                  p: 2.5,
                  borderRadius: 2.5,
                  background:
                    'linear-gradient(135deg, rgba(255, 255, 255, 0.90) 0%, rgba(248, 250, 252, 0.80) 50%, rgba(241, 245, 249, 0.90) 100%)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.9)',
                  boxShadow:
                    '0 12px 30px -8px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 16px 36px -8px rgba(0, 167, 111, 0.15)',
                    borderColor: 'rgba(0, 167, 111, 0.35)',
                  },
                }}
              >
                {/* Cabeçalho do Card: ID do Nó + APY */}
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Iconify icon="solar:server-square-bold-duotone" width={18} sx={{ color: colors.primary.main }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        color: 'text.primary',
                        fontSize: '0.82rem',
                      }}
                    >
                      {node.id}
                    </Typography>
                  </Stack>

                  <Chip
                    label={node.apy}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      bgcolor: colors.primary.main,
                      color: '#FFFFFF',
                      borderRadius: 1,
                      px: 0.5,
                    }}
                  />
                </Stack>

                {/* Localização com Bandeira */}
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1 }}>
                    {node.flag}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.9rem' }}>
                    {node.location}
                  </Typography>
                </Stack>

                {/* Linha 1: Holder / Operador */}
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.74rem' }}>
                    Holder / Operador:
                  </Typography>
                  <Chip
                    label={node.operatorStatus}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      bgcolor: 'rgba(0, 167, 111, 0.12)',
                      color: colors.primary.main,
                      borderRadius: 0.75,
                    }}
                  />
                </Stack>

                {/* Linha 2: Stake em Garantia */}
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.75 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.74rem' }}>
                    Stake em Garantia:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: colors.primary.main,
                      fontSize: '0.82rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    {node.stake}
                  </Typography>
                </Stack>

                {/* Divisor sutil */}
                <Box sx={{ borderBottom: '1px solid rgba(145, 158, 171, 0.15)', mb: 1.75 }} />

                {/* Linha 3: Recompensa do Mês */}
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.74rem' }}>
                    Recompensa do Mês:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      color: colors.primary.main,
                      fontSize: '1rem',
                    }}
                  >
                    {node.monthlyReward}
                  </Typography>
                </Stack>

                {/* Linha 4: Latência • Uptime */}
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.74rem' }}>
                    Latência • Uptime:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      fontSize: '0.76rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    {node.latency} • {node.uptime}
                  </Typography>
                </Stack>

                {/* Linha 5: Carga Operacional */}
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.74rem' }}>
                    Carga Operacional:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: 'text.primary',
                      fontSize: '0.76rem',
                    }}
                  >
                    {node.operationalLoad}%
                  </Typography>
                </Stack>

                {/* Barra de Progresso Operacional */}
                <Box
                  sx={{
                    width: '100%',
                    height: 5,
                    bgcolor: 'rgba(145, 158, 171, 0.16)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${node.operationalLoad}%`,
                      height: '100%',
                      bgcolor: progressColor,
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Seção Inferior: Armazenamento em Nuvem (Cluster) */}
        <Box
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 2.5,
            background:
              'linear-gradient(135deg, rgba(255, 255, 255, 0.90) 0%, rgba(248, 250, 252, 0.80) 50%, rgba(241, 245, 249, 0.90) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow:
              '0 12px 30px -8px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          {/* Topo do Cluster */}
          <Stack
            direction="row"
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
              mb: 2.5,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.1rem' }}>
                Armazenamento em Nuvem (Cluster)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                Armazenamento de alta resiliência.
              </Typography>
            </Box>

            <Chip
              label="TOTAL: 18,02 GB"
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                bgcolor: 'rgba(0, 184, 217, 0.14)',
                color: colors.info.darker || '#006C9C',
                border: '1px solid rgba(0, 184, 217, 0.35)',
                borderRadius: 1,
                px: 0.5,
              }}
            />
          </Stack>

          {/* Lista de Buckets */}
          <Stack spacing={1.5}>
            {CLUSTER_BUCKETS.map((bucket) => (
              <Box
                key={bucket.name}
                sx={{
                  p: 2,
                  borderRadius: 1.75,
                  bgcolor: 'rgba(255, 255, 255, 0.65)',
                  border: '1px solid rgba(0, 167, 111, 0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: colors.primary.main,
                    boxShadow: '0 4px 16px -2px rgba(0, 167, 111, 0.12)',
                  },
                }}
              >
                {/* Lado Esquerdo: Animação 3D IpfsCube + Nome + CID */}
                <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center' }}>
                  <IpfsCube
                    size={42}
                    color={colors.primary.main}
                    colorLight={colors.primary.light}
                    animated
                    sx={{
                      bgcolor: 'rgba(0, 167, 111, 0.12)',
                      border: '1px solid rgba(0, 167, 111, 0.25)',
                      boxShadow: 'inset 0 0 10px rgba(0, 167, 111, 0.08)',
                    }}
                  />

                  <Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          color: 'text.primary',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                        }}
                      >
                        {bucket.name}
                      </Typography>

                      <Chip
                        label="CDN Global"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          bgcolor: 'rgba(0, 167, 111, 0.1)',
                          color: colors.primary.main,
                          borderRadius: 0.5,
                        }}
                      />
                    </Stack>

                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontFamily: 'monospace',
                        fontSize: '0.74rem',
                        display: 'block',
                        mt: 0.25,
                      }}
                    >
                      CID Raiz: {bucket.rootCid}
                    </Typography>
                  </Box>
                </Stack>

                {/* Lado Direito: Volume Alocado */}
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.disabled',
                      fontSize: '0.7rem',
                      display: 'block',
                    }}
                  >
                    Volume Alocado
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      color: 'text.primary',
                      fontSize: '0.85rem',
                    }}
                  >
                    {bucket.allocatedVolume}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </>
  );
}

export default InfrastructurePage;
