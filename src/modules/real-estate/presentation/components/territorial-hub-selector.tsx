import type { RealEstateStats } from '../../../../platform/tauri/real-estate/real-estate-bridge';

import React, { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import InputAdornment from '@mui/material/InputAdornment';

import { colors } from '../../../../shared/theme/palette';
import { Iconify } from '../../../../shared/components/iconify';
import { StatusBadge } from '../../../../shared/components/StatusBadge';

export interface CityTerritory {
  id: string;
  name: string;
  microRegion: string;
  status: 'ACTIVE' | 'UPCOMING';
  databaseName?: string;
  activeBatchesCount?: number;
  description?: string;
}

export interface StateTerritory {
  uf: string;
  name: string;
  region: string;
  status: 'ACTIVE' | 'UPCOMING' | 'PLANNED';
  cities: CityTerritory[];
}

export const TERRITORIAL_CATALOG: StateTerritory[] = [
  {
    uf: 'RJ',
    name: 'Rio de Janeiro',
    region: 'Sudeste',
    status: 'ACTIVE',
    cities: [
      {
        id: 'marica',
        name: 'Maricá',
        microRegion: 'Região Metropolitana / Costa do Sol',
        status: 'ACTIVE',
        databaseName: 'real_estate.sqlite (WAL)',
        description: 'Primeira base territorial oficial carregada (Planilha Mapa5.xlsx — Cadastro de Logradouros e Lotes).',
      },
      {
        id: 'niteroi',
        name: 'Niterói',
        microRegion: 'Região Metropolitana',
        status: 'UPCOMING',
        description: 'Mapeamento cartográfico preliminar em estruturação.',
      },
      {
        id: 'saquarema',
        name: 'Saquarema',
        microRegion: 'Região dos Lagos',
        status: 'UPCOMING',
        description: 'Levantamento de glebas e registros fundiários em planejamento.',
      },
      {
        id: 'itaborai',
        name: 'Itaboraí',
        microRegion: 'Região Metropolitana Leste',
        status: 'UPCOMING',
        description: 'Integração de dados imobiliários planejada para fases futuras.',
      },
    ],
  },
  {
    uf: 'SP',
    name: 'São Paulo',
    region: 'Sudeste',
    status: 'UPCOMING',
    cities: [
      {
        id: 'santos',
        name: 'Santos',
        microRegion: 'Baixada Santista',
        status: 'UPCOMING',
        description: 'Zona portuária e cadastros imobiliários urbanos.',
      },
      {
        id: 'campinas',
        name: 'Campinas',
        microRegion: 'Metropolitana de Campinas',
        status: 'UPCOMING',
        description: 'Polo tecnológico e loteamentos industriais.',
      },
    ],
  },
  {
    uf: 'MG',
    name: 'Minas Gerais',
    region: 'Sudeste',
    status: 'UPCOMING',
    cities: [
      {
        id: 'bh',
        name: 'Belo Horizonte',
        microRegion: 'Metropolitana de Belo Horizonte',
        status: 'UPCOMING',
        description: 'Levantamento fundiário regional em estudo.',
      },
    ],
  },
  {
    uf: 'DF',
    name: 'Distrito Federal',
    region: 'Centro-Oeste',
    status: 'PLANNED',
    cities: [
      {
        id: 'brasilia',
        name: 'Brasília',
        microRegion: 'Distrito Federal e Entorno',
        status: 'UPCOMING',
        description: 'Setores habitacionais e cartórios de registro de imóveis do DF.',
      },
    ],
  },
  {
    uf: 'BA',
    name: 'Bahia',
    region: 'Nordeste',
    status: 'PLANNED',
    cities: [
      {
        id: 'salvador',
        name: 'Salvador',
        microRegion: 'Metropolitana de Salvador',
        status: 'UPCOMING',
        description: 'Orla marítima e patrimônio imobiliário.',
      },
    ],
  },
  {
    uf: 'PR',
    name: 'Paraná',
    region: 'Sul',
    status: 'PLANNED',
    cities: [
      {
        id: 'curitiba',
        name: 'Curitiba',
        microRegion: 'Metropolitana de Curitiba',
        status: 'UPCOMING',
        description: 'Planejamento urbano e cadastro técnico multifinalitário.',
      },
    ],
  },
];

export interface TerritorialHubSelectorProps {
  selectedStateUf: string;
  onSelectState: (uf: string) => void;
  onSelectCity: (cityId: string) => void;
  stats: RealEstateStats | null;
}

export function TerritorialHubSelector({
  selectedStateUf,
  onSelectState,
  onSelectCity,
  stats,
}: TerritorialHubSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const activeState = useMemo(() => TERRITORIAL_CATALOG.find((s) => s.uf === selectedStateUf) || TERRITORIAL_CATALOG[0], [selectedStateUf]);

  const filteredStates = useMemo(() => {
    if (!searchTerm.trim()) return TERRITORIAL_CATALOG;
    const term = searchTerm.toLowerCase();
    return TERRITORIAL_CATALOG.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.uf.toLowerCase().includes(term) ||
        s.cities.some((c) => c.name.toLowerCase().includes(term))
    );
  }, [searchTerm]);

  return (
    <Box sx={{ mb: 4 }}>
      {/* Banner de Boas-Vindas e Filtro de Busca */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: 3.5,
          borderRadius: 2.5,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(0, 167, 111, 0.12) 0%, rgba(15, 23, 42, 0.05) 50%, rgba(0, 210, 255, 0.08) 100%)',
          border: '1px solid rgba(0, 167, 111, 0.28)',
          boxShadow: '0 8px 32px -4px rgba(0, 167, 111, 0.12)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ maxWidth: 800 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(0, 167, 111, 0.2)',
                  color: colors.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="solar:global-bold" width={22} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                Banco de Dados Imobiliário Nacional
              </Typography>
              <StatusBadge status="ACTIVE" label="Federação ASPPIBRA" />
            </Box>
            <Typography variant="body2" sx={{ color: colors.text.secondary, lineHeight: 1.6 }}>
              Selecione o <strong>Estado da Federação</strong> para filtrar as bases municipais cadastradas. Atualmente, o pioneiro banco territorial de <strong>Maricá (Rio de Janeiro)</strong> está homologado e ativo em armazenamento local segregado (SQLite WAL).
            </Typography>
          </Box>

          <TextField
            size="small"
            placeholder="Buscar Estado ou Município..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-bold" width={18} color="text.secondary" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              minWidth: { xs: '100%', sm: 280 },
              bgcolor: 'background.paper',
              borderRadius: 1.5,
            }}
          />
        </Box>
      </Card>

      {/* 1. SELEÇÃO DE ESTADOS (CARDS INTERATIVOS DE UFs) */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: colors.text.secondary, mb: 1.5, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.75rem' }}>
          Passo 1: Selecione o Estado (UF)
        </Typography>

        <Grid container spacing={2}>
          {filteredStates.map((state) => {
            const isSelected = state.uf === activeState.uf;
            const hasActiveBase = state.status === 'ACTIVE';

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={state.uf}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: isSelected ? 'rgba(0, 167, 111, 0.08)' : 'background.paper',
                    borderColor: isSelected
                      ? colors.primary.main
                      : 'divider',
                    boxShadow: isSelected
                      ? '0 6px 20px -2px rgba(0, 167, 111, 0.25)'
                      : 'none',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    '&:hover': {
                      borderColor: colors.primary.main,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 18px -3px rgba(0, 167, 111, 0.15)',
                    },
                  }}
                  onClick={() => onSelectState(state.uf)}
                >
                  <CardActionArea sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 1.5,
                            bgcolor: isSelected ? colors.primary.main : 'rgba(145, 158, 171, 0.12)',
                            color: isSelected ? '#FFFFFF' : 'text.primary',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '0.95rem',
                          }}
                        >
                          {state.uf}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                            {state.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                            Região {state.region}
                          </Typography>
                        </Box>
                      </Box>

                      {hasActiveBase ? (
                        <Chip
                          size="small"
                          label="1 Base Ativa"
                          sx={{
                            bgcolor: 'rgba(0, 167, 111, 0.16)',
                            color: colors.primary.main,
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            border: '1px solid rgba(0, 167, 111, 0.3)',
                          }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          label={state.status === 'UPCOMING' ? 'Em Breve' : 'Planejado'}
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', color: colors.text.secondary }}
                        />
                      )}
                    </Box>

                    <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block' }}>
                      {state.cities.length} {state.cities.length === 1 ? 'município mapeado' : 'municípios mapeados'}
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* 2. SELEÇÃO DE MUNICÍPIOS DO ESTADO SELECIONADO */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: colors.text.secondary, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Passo 2: Selecione o Município de {activeState.name} ({activeState.uf})
            </Typography>
            <Chip size="small" label={`${activeState.cities.length} Cidades`} />
          </Box>
        </Box>

        <Grid container spacing={2.5}>
          {activeState.cities.map((city) => {
            const isCityActive = city.status === 'ACTIVE';

            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={city.id}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'all 0.25s ease-in-out',
                    border: isCityActive
                      ? '1.5px solid rgba(0, 167, 111, 0.45)'
                      : '1px dashed divider',
                    background: isCityActive
                      ? 'linear-gradient(135deg, rgba(0, 167, 111, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
                      : 'transparent',
                    boxShadow: isCityActive
                      ? '0 8px 24px -4px rgba(0, 167, 111, 0.15)'
                      : 'none',
                    '&:hover': isCityActive
                      ? {
                          borderColor: colors.primary.main,
                          boxShadow: '0 12px 32px -4px rgba(0, 167, 111, 0.25)',
                          transform: 'translateY(-3px)',
                        }
                      : {},
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2,
                            bgcolor: isCityActive ? 'rgba(0, 167, 111, 0.18)' : 'action.hover',
                            color: isCityActive ? colors.primary.main : 'text.disabled',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Iconify icon={isCityActive ? 'solar:city-bold' : 'solar:lock-keyhole-bold'} width={24} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                            {city.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                            {city.microRegion}
                          </Typography>
                        </Box>
                      </Box>

                      {isCityActive ? (
                        <StatusBadge status="ACTIVE" label="Base Operacional" />
                      ) : (
                        <Chip size="small" variant="outlined" label="Em Estruturação" />
                      )}
                    </Box>

                    <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2, fontSize: '0.85rem' }}>
                      {city.description}
                    </Typography>

                    {isCityActive && (
                      <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 0.75 }}>
                        <Chip
                          size="small"
                          label={city.databaseName || 'real_estate.sqlite'}
                          sx={{
                            bgcolor: 'rgba(0, 167, 111, 0.1)',
                            color: colors.primary.main,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        />
                        <Chip
                          size="small"
                          label={stats ? `${stats.total_properties.toLocaleString('pt-BR')} Imóveis` : 'Pronto para Carga'}
                          sx={{
                            bgcolor: 'rgba(0, 210, 255, 0.1)',
                            color: colors.info.main,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        />
                      </Stack>
                    )}
                  </Box>

                  <Box sx={{ pt: 1 }}>
                    {isCityActive ? (
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={() => onSelectCity(city.id)}
                        endIcon={<Iconify icon="solar:arrow-right-bold" />}
                        sx={{ fontWeight: 800, py: 1 }}
                      >
                        Acessar Análise de {city.name}
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        disabled
                        variant="outlined"
                        startIcon={<Iconify icon="solar:clock-circle-bold" />}
                        sx={{ py: 1 }}
                      >
                        Aguardando Carga Territorial
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
}
