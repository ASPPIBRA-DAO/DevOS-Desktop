import React, { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';

import { colors } from '../../../../shared/theme/palette';
import { Iconify } from '../../../../shared/components/iconify';
import {
  type PropertySummary,
  type XlsxPreviewReport,
} from '../../../../platform/tauri/real-estate/real-estate-bridge';

// ----------------------------------------------------------------------

interface RealEstateSpreadsheetTableProps {
  properties: PropertySummary[];
  preview?: XlsxPreviewReport | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onTriggerPreview?: () => void;
  onTriggerPilot?: () => void;
}

export function RealEstateSpreadsheetTable({
  properties,
  preview,
  isLoading = false,
  onRefresh,
  onTriggerPreview,
  onTriggerPilot,
}: RealEstateSpreadsheetTableProps) {
  // Filtros de Planilha
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('ALL');

  // Paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Lista dinâmica de Bairros únicos presentes nos dados cadastrados
  const uniqueNeighborhoods = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => {
      const b = p.bairro?.trim();
      if (b) set.add(b);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [properties]);

  // Filtragem dos registros
  const filteredProperties = useMemo(() => properties.filter((p) => {
      // 1. Filtro de Bairro
      if (selectedNeighborhood !== 'ALL' && p.bairro?.trim() !== selectedNeighborhood) {
        return false;
      }

      // 2. Busca por texto livre (Matrícula, Contribuinte, Rua, Bairro, UUID)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const mat = (p.matricula || p.identifier || '').toLowerCase();
        const tit = (p.titular || '').toLowerCase();
        const rua = (p.rua || '').toLowerCase();
        const bai = (p.bairro || '').toLowerCase();
        const addr = (p.address || '').toLowerCase();
        const uid = p.uuid.toLowerCase();

        return (
          mat.includes(query) ||
          tit.includes(query) ||
          rua.includes(query) ||
          bai.includes(query) ||
          addr.includes(query) ||
          uid.includes(query)
        );
      }

      return true;
    }), [properties, selectedNeighborhood, searchTerm]);

  // Registros paginados
  const paginatedProperties = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredProperties.slice(start, start + rowsPerPage);
  }, [filteredProperties, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredProperties.length / rowsPerPage);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedNeighborhood('ALL');
    setPage(0);
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() || selectedNeighborhood !== 'ALL'
  );

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        overflow: 'hidden',
        border: '1px solid rgba(145, 158, 171, 0.2)',
        bgcolor: 'background.paper',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. CABEÇALHO DA PLANILHA & METADADOS DO BANCO */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: '1px solid rgba(145, 158, 171, 0.16)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          bgcolor: 'rgba(0, 167, 111, 0.03)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: 'rgba(0, 167, 111, 0.12)',
              color: colors.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="solar:document-text-bold" width={24} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Planilha Cadastral Territorial
              </Typography>
              <Chip
                size="small"
                label="Base SQLite WAL"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(15, 23, 42, 0.08)',
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
              Espelho tabular normalizado do cadastro territorial de Maricá — RJ com proveniência e integridade auditável
            </Typography>
          </Box>
        </Box>

        {onRefresh && (
          <Tooltip title="Atualizar dados do banco local">
            <IconButton size="small" onClick={onRefresh} disabled={isLoading}>
              <Iconify icon="solar:refresh-bold" width={20} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* 2. BARRA DE FILTROS AVANÇADOS DA PLANILHA */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'rgba(145, 158, 171, 0.04)',
          borderBottom: '1px solid rgba(145, 158, 171, 0.12)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
          {/* Busca por texto */}
          <TextField
            size="small"
            placeholder="Buscar por Matrícula, Contribuinte, Rua, Bairro..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-bold" width={18} color="text.secondary" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Iconify icon="solar:close-circle-bold" width={16} />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
            sx={{
              minWidth: { xs: '100%', sm: 220, md: 260 },
              flex: { xs: '1 1 100%', sm: '1 1 240px' },
              bgcolor: 'background.paper',
              borderRadius: 1.5,
            }}
          />

          {/* Filtro por Bairro */}
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 }, bgcolor: 'background.paper' }}>
            <InputLabel id="neighborhood-filter-label">Bairro</InputLabel>
            <Select
              labelId="neighborhood-filter-label"
              value={selectedNeighborhood}
              label="Bairro"
              onChange={(e) => {
                setSelectedNeighborhood(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="ALL">Todos os Bairros ({properties.length})</MenuItem>
              {uniqueNeighborhoods.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasActiveFilters && (
            <Button
              size="small"
              variant="text"
              color="error"
              onClick={handleResetFilters}
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              sx={{ fontWeight: 700 }}
            >
              Limpar Filtros
            </Button>
          )}
        </Box>

        {/* Controles de Linhas por Página */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
            Linhas por página:
          </Typography>
          <Select
            size="small"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            sx={{ height: 32, fontSize: '0.8rem', bgcolor: 'background.paper' }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </Box>
      </Box>

      {/* 3. GRADE DA PLANILHA (DATA GRID COM ESTILIZAÇÃO COMPLETA) */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          maxHeight: 650,
          border: 'none',
          borderRadius: 0,
          overflowX: 'auto',
          width: '100%',
        }}
      >
        <Table stickyHeader size="small" sx={{ minWidth: 860, width: '100%' }}>
          <TableHead>
            <TableRow
              sx={{
                '& th': {
                  bgcolor: 'rgba(15, 23, 42, 0.04)',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  letterSpacing: 0.3,
                  py: 1.5,
                  borderBottom: '2px solid rgba(145, 158, 171, 0.24)',
                  whiteSpace: 'nowrap',
                },
              }}
            >
              <TableCell align="center" sx={{ width: 50 }}># ID</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Matrícula</TableCell>
              <TableCell sx={{ minWidth: 180 }}>Contribuinte</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Bairro</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Rua</TableCell>
              <TableCell align="center" sx={{ width: 60 }}>Nº</TableCell>
              <TableCell align="center" sx={{ width: 70 }}>Quadra</TableCell>
              <TableCell align="center" sx={{ width: 70 }}>Lote</TableCell>
              <TableCell sx={{ minWidth: 130 }}>Complemento</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {properties.length === 0 ? (
              /* CASO 1: BANCO VAZIO (NENHUM REGISTRO IMPORTADO AINDA) */
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Box sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 3,
                        bgcolor: 'rgba(0, 167, 111, 0.1)',
                        color: colors.primary.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <Iconify icon="solar:database-bold" width={32} />
                    </Box>

                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.75 }}>
                      O Banco de Dados Territorial de Maricá está Pronto
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.text.secondary, mb: onTriggerPreview || onTriggerPilot ? 3 : 0 }}>
                      A base territorial <strong>real_estate.sqlite (WAL)</strong> está estruturada e pronta para consulta e auditoria de <strong>Maricá - RJ</strong>.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                      {onTriggerPreview && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={onTriggerPreview}
                          startIcon={<Iconify icon="solar:eye-bold" />}
                        >
                          1. Gerar Prévia
                        </Button>
                      )}
                      {onTriggerPilot && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={onTriggerPilot}
                          startIcon={<Iconify icon="solar:play-bold" />}
                          sx={{ bgcolor: colors.primary.main }}
                        >
                          2. Executar Piloto (50 Linhas)
                        </Button>
                      )}
                    </Box>

                    {/* Exibe amostra da Prévia se gerada antes da importação */}
                    {preview && preview.sample_rows && preview.sample_rows.length > 0 && (
                      <Box
                        sx={{
                          mt: 4,
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'background.neutral',
                          border: '1px dashed rgba(145, 158, 171, 0.3)',
                          textAlign: 'left',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 800, color: colors.primary.main, display: 'block', mb: 1 }}>
                          ℹ️ PRÉVIA DETECTADA NA PLANILHA: {preview.sample_rows.length} LINHAS PRONTAS PARA CARGA
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                          Headers identificados:{' '}
                          <strong>{preview.recognized_headers.join(', ')}</strong>
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : paginatedProperties.length === 0 ? (
              /* CASO 2: NENHUM REGISTRO ENCONTRADO PELOS FILTROS */
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 1.5 }}>
                    Nenhum imóvel corresponde aos critérios de pesquisa selecionados.
                  </Typography>
                  <Button size="small" variant="outlined" onClick={handleResetFilters}>
                    Limpar Filtros de Busca
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              /* CASO 3: REGISTROS ENCONTRADOS */
              paginatedProperties.map((prop, idx) => {
                const matriculaDisplay = prop.matricula || prop.identifier || '—';
                const hasMatricula = Boolean(prop.matricula || prop.identifier);
                const titularDisplay = prop.titular || '—';
                const bairroDisplay = prop.bairro || '—';
                const ruaDisplay = prop.rua || '—';
                const numeroDisplay = prop.numero || 'S/N';
                const quadraDisplay = prop.quadra || '—';
                const loteDisplay = prop.lote || '—';
                const complementoDisplay = prop.complemento || '—';
                const isConflict = prop.status === 'COM_INCONSISTENCIA';

                return (
                  <TableRow
                    key={prop.id}
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(0, 167, 111, 0.04)',
                      },
                      borderLeft: isConflict
                        ? '3px solid #FFAB00'
                        : '3px solid transparent',
                    }}
                  >
                    {/* ID */}
                    <TableCell align="center" sx={{ fontWeight: 700, color: colors.text.secondary }}>
                      #{prop.id}
                    </TableCell>

                    {/* Matrícula */}
                    <TableCell>
                      {hasMatricula ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              color: colors.primary.main,
                            }}
                          >
                            {matriculaDisplay}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip
                          size="small"
                          label="SEM MATRÍCULA"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', color: colors.text.secondary }}
                        />
                      )}
                    </TableCell>

                    {/* Titular / Contribuinte */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.82rem',
                        }}
                      >
                        {titularDisplay}
                      </Typography>
                    </TableCell>

                    {/* Bairro */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 500 }}>
                        {bairroDisplay}
                      </Typography>
                    </TableCell>

                    {/* Rua */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.82rem',
                          fontWeight: 500,
                        }}
                      >
                        {ruaDisplay}
                      </Typography>
                    </TableCell>

                    {/* Nº */}
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        {numeroDisplay}
                      </Typography>
                    </TableCell>

                    {/* Quadra */}
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 500 }}>
                        {quadraDisplay}
                      </Typography>
                    </TableCell>

                    {/* Lote */}
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 500 }}>
                        {loteDisplay}
                      </Typography>
                    </TableCell>

                    {/* Complemento */}
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          color: colors.text.secondary,
                          maxWidth: 160,
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {complementoDisplay}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 4. RODAPÉ DA PLANILHA COM TOTALIZADORES E INFORMAÇÕES DE INTEGRIDADE */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid rgba(145, 158, 171, 0.16)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          bgcolor: 'rgba(145, 158, 171, 0.03)',
        }}
      >
        <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Iconify icon="solar:shield-check-bold" width={14} color="primary.main" />
          Registros espelhados e validados na base SQLite local em modo <strong>WAL (Write-Ahead Logging)</strong>
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
            Página {totalPages > 0 ? page + 1 : 0} de {totalPages} ({filteredProperties.length} registros)
          </Typography>

          <Button
            size="small"
            disabled={page === 0}
            onClick={() => setPage(0)}
            sx={{ minWidth: 28, px: 1, fontSize: '0.75rem' }}
          >
            Início
          </Button>

          <Button
            size="small"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(totalPages - 1)}
            sx={{ minWidth: 28, px: 1, fontSize: '0.75rem' }}
          >
            Fim
          </Button>
        </Box>
      </Box>
    </Card>
  );
}

export default RealEstateSpreadsheetTable;
