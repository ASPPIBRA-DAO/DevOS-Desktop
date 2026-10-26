import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

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
import CircularProgress from '@mui/material/CircularProgress';

import { colors } from '../../../../shared/theme/palette';
import { Iconify } from '../../../../shared/components/iconify';
import {
  RealEstateBridge,
  type PropertySummary,
  type XlsxPreviewReport,
} from '../../../../platform/tauri/real-estate/real-estate-bridge';

// ----------------------------------------------------------------------

/**
 * Normaliza strings para o padrão Title Case elegante (primeira letra maiúscula),
 * preservando preposições e artigos em minúsculo.
 */
function toTitleCase(str: string): string {
  if (!str || str === '—' || str === 'S/N') return str;
  const lowerExceptions = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em']);
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && lowerExceptions.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('ALL');

  // Registros carregados dinamicamente para Rolagem Contínua (Infinite Scroll)
  const [items, setItems] = useState<PropertySummary[]>(properties || []);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [totalCount, setTotalCount] = useState(145756);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Lista dinâmica de Bairros carregada do banco de dados oficial
  const [bairrosDb, setBairrosDb] = useState<string[]>([]);

  useEffect(() => {
    RealEstateBridge.listNeighborhoods()
      .then((data) => {
        if (data && data.length > 0) {
          setBairrosDb(data);
        }
      })
      .catch(() => {});

    RealEstateBridge.getStats()
      .then((s) => {
        if (s?.total_properties) {
          setTotalCount(s.total_properties);
        }
      })
      .catch(() => {});
  }, []);

  // Debounce da busca textual em 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Carga inicial e sob mudança de filtros diretamente no banco de dados SQLite
  const loadData = useCallback(async (bairro: string, search: string) => {
    setIsSearching(true);
    try {
      const data = await RealEstateBridge.listProperties(100, 0, bairro, search);
      setItems(data);
      setHasMore(data.length === 100);
      tableContainerRef.current?.scrollTo({ top: 0 });
    } catch (err) {
      console.warn('Erro ao carregar dados territoriais:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedNeighborhood, debouncedSearch);
  }, [selectedNeighborhood, debouncedSearch, loadData]);

  // Rolagem Contínua: carrega mais registros automaticamente conforme o usuário desce a barra de rolagem
  const handleScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop - clientHeight < 450 && !isLoadingMore && hasMore && !isSearching) {
        setIsLoadingMore(true);
        try {
          const nextData = await RealEstateBridge.listProperties(
            100,
            items.length,
            selectedNeighborhood,
            debouncedSearch
          );
          if (nextData && nextData.length > 0) {
            setItems((prev) => [...prev, ...nextData]);
            setHasMore(nextData.length === 100);
          } else {
            setHasMore(false);
          }
        } catch (err) {
          console.warn('Erro ao carregar mais registros:', err);
        } finally {
          setIsLoadingMore(false);
        }
      }
    },
    [isLoadingMore, hasMore, isSearching, items.length, selectedNeighborhood, debouncedSearch]
  );

  const uniqueNeighborhoods = useMemo(() => {
    if (bairrosDb.length > 0) {
      return bairrosDb;
    }
    const set = new Set<string>();
    properties.forEach((p) => {
      const b = p.bairro?.trim();
      if (b) set.add(b);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [bairrosDb, properties]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedNeighborhood('ALL');
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
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Planilha Cadastral Territorial
          </Typography>
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
            placeholder="Buscar imóvel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-linear" width={18} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.5 }}>
                      <Iconify icon="solar:close-circle-bold" width={16} sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }} />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
            sx={{
              minWidth: { xs: '100%', sm: 220, md: 280 },
              flex: { xs: '1 1 100%', sm: '1 1 240px' },
              bgcolor: 'background.paper',
              borderRadius: 1.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                transition: 'all 0.2s ease-in-out',
                '& fieldset': {
                  borderColor: 'rgba(145, 158, 171, 0.24)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(0, 167, 111, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.primary.main,
                  borderWidth: 1.5,
                  boxShadow: '0 0 0 3px rgba(0, 167, 111, 0.12)',
                },
              },
              '& .MuiInputBase-input': {
                fontSize: '0.875rem',
                '&::placeholder': {
                  color: 'text.disabled',
                  opacity: 1,
                },
              },
            }}
          />

          {/* Filtro por Bairro */}
          <FormControl
            size="small"
            sx={{
              minWidth: { xs: '100%', sm: 160 },
              bgcolor: 'background.paper',
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                transition: 'all 0.2s ease-in-out',
                '& fieldset': {
                  borderColor: 'rgba(145, 158, 171, 0.24)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(0, 167, 111, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.primary.main,
                  borderWidth: 1.5,
                  boxShadow: '0 0 0 3px rgba(0, 167, 111, 0.12)',
                },
              },
            }}
          >
            <InputLabel id="neighborhood-filter-label">Bairro</InputLabel>
            <Select
              labelId="neighborhood-filter-label"
              value={selectedNeighborhood}
              label="Bairro"
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
            >
              <MenuItem value="ALL">Todos</MenuItem>
              {uniqueNeighborhoods.map((n) => (
                <MenuItem key={n} value={n}>
                  {toTitleCase(n)}
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
      </Box>

      {/* 3. GRADE DA PLANILHA (DATA GRID COM ESTILIZAÇÃO COMPLETA & ROLAGEM CONTÍNUA) */}
      <TableContainer
        ref={tableContainerRef}
        component={Paper}
        elevation={0}
        onScroll={handleScroll}
        sx={{
          maxHeight: 650,
          border: 'none',
          borderRadius: 0,
          overflowX: 'auto',
          overflowY: 'auto',
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
            ) : isSearching && items.length === 0 ? (
              /* CARREGANDO DADOS DA BUSCA / FILTRO */
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                    <CircularProgress size={28} sx={{ color: colors.primary.main }} />
                    <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                      Consultando base cadastral de Maricá no SQLite WAL...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
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
              <>
                {items.map((prop) => {
                  const matriculaDisplay = prop.matricula || prop.identifier || '—';
                  const hasMatricula = Boolean(prop.matricula || prop.identifier);
                  const titularDisplay = toTitleCase(prop.titular || '—');
                  const bairroDisplay = toTitleCase(prop.bairro || '—');
                  const ruaDisplay = toTitleCase(prop.rua || '—');
                  const numeroDisplay = prop.numero || 'S/N';
                  const quadraDisplay = prop.quadra || '—';
                  const loteDisplay = prop.lote || '—';
                  const complementoDisplay = toTitleCase(prop.complemento || '—');
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
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 400, color: 'text.secondary' }}>
                          #{prop.id}
                        </Typography>
                      </TableCell>

                      {/* Matrícula */}
                      <TableCell>
                        {hasMatricula ? (
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 400,
                              fontSize: '0.82rem',
                              color: colors.primary.main,
                            }}
                          >
                            {matriculaDisplay}
                          </Typography>
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
                            fontWeight: 400,
                            fontSize: '0.82rem',
                            color: 'text.primary',
                          }}
                        >
                          {titularDisplay}
                        </Typography>
                      </TableCell>

                      {/* Bairro */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 400, color: 'text.primary' }}>
                          {bairroDisplay}
                        </Typography>
                      </TableCell>

                      {/* Rua */}
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.82rem',
                            fontWeight: 400,
                            color: 'text.primary',
                          }}
                        >
                          {ruaDisplay}
                        </Typography>
                      </TableCell>

                      {/* Nº */}
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 400, color: 'text.primary' }}>
                          {numeroDisplay}
                        </Typography>
                      </TableCell>

                      {/* Quadra */}
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 400, color: 'text.primary' }}>
                          {quadraDisplay}
                        </Typography>
                      </TableCell>

                      {/* Lote */}
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 400, color: 'text.primary' }}>
                          {loteDisplay}
                        </Typography>
                      </TableCell>

                      {/* Complemento */}
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.82rem',
                            fontWeight: 400,
                            color: 'text.secondary',
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
                })}

                {isLoadingMore && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 2, bgcolor: 'rgba(0, 167, 111, 0.04)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: colors.primary.main }}>
                        <CircularProgress size={16} color="inherit" thickness={4} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          Carregando mais cadastros...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </>
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
          Base Territorial Municipal: <strong>{totalCount.toLocaleString('pt-BR')} Imóveis</strong> | Maricá - RJ
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isLoadingMore && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: colors.primary.main }}>
              <CircularProgress size={14} color="inherit" thickness={4} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Carregando...
              </Typography>
            </Box>
          )}

          <Typography variant="caption" sx={{ color: colors.text.secondary, fontWeight: 600 }}>
            {selectedNeighborhood === 'ALL' && !debouncedSearch
              ? `Exibindo ${items.length.toLocaleString('pt-BR')} de ${totalCount.toLocaleString('pt-BR')} registros (Rolagem Direta)`
              : `Exibindo ${items.length.toLocaleString('pt-BR')} registros filtrados (Rolagem Direta)`}
          </Typography>

          {items.length > 50 && (
            <IconButton
              size="small"
              title="Voltar ao início da tabela"
              onClick={() => tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              sx={{
                p: 0.5,
                color: colors.primary.main,
                bgcolor: 'rgba(0, 167, 111, 0.08)',
                '&:hover': { bgcolor: 'rgba(0, 167, 111, 0.18)' },
              }}
            >
              <Iconify icon="solar:arrow-up-linear" width={16} />
            </IconButton>
          )}
        </Box>
      </Box>
    </Card>
  );
}

export default RealEstateSpreadsheetTable;
