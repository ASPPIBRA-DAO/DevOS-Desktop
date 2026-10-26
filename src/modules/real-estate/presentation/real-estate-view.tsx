import React, { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { colors } from '../../../shared/theme/palette';
import { ReconciliationReportButton } from '../../reports';
import { Iconify } from '../../../shared/components/iconify';
import { RealEstateMetricsBar } from './components/real-estate-metrics-bar';
import { TerritorialHubSelector } from './components/territorial-hub-selector';
import { RealEstateSpreadsheetTable } from './components/real-estate-spreadsheet-table';
import {
  RealEstateBridge,
  type PropertySummary,
  type RealEstateStats,
  type ImportBatchSummary,
  type AuditFindingSummary,
} from '../../../platform/tauri/real-estate/real-estate-bridge';

export function RealEstateView() {
  const [stats, setStats] = useState<RealEstateStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Controle Hierárquico Territorial (Estado / Município)
  const [selectedStateUf, setSelectedStateUf] = useState('RJ');
  const [selectedCityId, setSelectedCityId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('city=marica')) {
      return 'marica';
    }
    return null;
  });

  // Dados auxiliares
  const [batches, setBatches] = useState<ImportBatchSummary[]>([]);
  const [findings, setFindings] = useState<AuditFindingSummary[]>([]);
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadStatsAndData = useCallback(async () => {
    setIsLoading(true);
    try {
      const s = await RealEstateBridge.getStats();
      setStats(s);
      const b = await RealEstateBridge.listBatches(20);
      setBatches(b);
      const f = await RealEstateBridge.listFindings(50);
      setFindings(f);
      const p = await RealEstateBridge.listProperties(100);
      setProperties(p);
    } catch (err: unknown) {
      console.warn('Erro ao carregar dados imobiliários:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatsAndData();
  }, [loadStatsAndData]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 1. VISÃO A: HUB TERRITORIAL (SELETOR DE ESTADOS E MUNICÍPIOS) */}
      {!selectedCityId ? (
        <TerritorialHubSelector
          selectedStateUf={selectedStateUf}
          onSelectState={setSelectedStateUf}
          onSelectCity={(cityId) => setSelectedCityId(cityId)}
          stats={stats}
        />
      ) : (
        /* 2. VISÃO B: AMBIENTE DE ANÁLISE E FILTRAGEM DO MUNICÍPIO SELECIONADO */
        <>
          {/* Barra de Navegação e Contexto Municipal */}
          <Box
            sx={{
              mb: 3.5,
              p: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              background: 'linear-gradient(135deg, rgba(0, 167, 111, 0.08) 0%, rgba(15, 23, 42, 0.04) 100%)',
              border: '1px solid rgba(0, 167, 111, 0.25)',
              boxShadow: '0 4px 16px -2px rgba(0, 167, 111, 0.08)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedCityId(null)}
                startIcon={<Iconify icon="solar:arrow-left-bold" />}
                sx={{
                  fontWeight: 700,
                  bgcolor: 'background.paper',
                  borderColor: 'rgba(0, 167, 111, 0.4)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 167, 111, 0.1)',
                    borderColor: colors.primary.main,
                  },
                }}
              >
                Trocar Estado / Município
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.85rem' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Brasil</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>❯</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Rio de Janeiro (RJ)</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>❯</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Maricá
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <ReconciliationReportButton
                stats={stats}
                batches={batches}
                findings={findings}
                properties={properties}
                selectedNeighborhood={selectedNeighborhood}
                searchTerm={searchTerm}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={loadStatsAndData}
                startIcon={<Iconify icon="solar:restart-bold" />}
              >
                Atualizar Painel
              </Button>
            </Box>
          </Box>

      {/* Métricas Consolidadas */}
      <RealEstateMetricsBar stats={stats} />

      {/* Planilha Cadastral Territorial (Espelho Direto do Banco SQLite WAL) */}
      <Box sx={{ mt: 3.5, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <RealEstateSpreadsheetTable
          properties={properties}
          isLoading={isLoading}
          selectedNeighborhood={selectedNeighborhood}
          onSelectNeighborhood={setSelectedNeighborhood}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={loadStatsAndData}
        />
      </Box>
        </>
      )}
    </Box>
  );
}

export default RealEstateView;
