import type { IFinancialProfile } from '../../../domain/ledger-models';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

import { Label } from 'src/shared/components/label';
import { Iconify } from 'src/shared/components/iconify';

import { IdentityAvatar } from 'src/auth/components';

// ----------------------------------------------------------------------

type Props = {
  years: string[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
  onSearch: (value: string) => void;
  searchQuery: string;
  profile: IFinancialProfile;
  [key: string]: any;
};

export function FinancialSummaryHeader({
  years,
  selectedYear,
  onSelectYear,
  onSearch,
  searchQuery,
  profile,
  ...other
}: Props) {
  const isEmptyState = profile.associate.id === '--';
  const user = profile.associate;
  const fullName = user.name;
  const displayName = searchQuery || fullName;
  const avatarInitials = isEmptyState
    ? ''
    : user.name
    ? user.name.split(' ')[0].charAt(0).toUpperCase() + (user.name.split(' ')[1]?.charAt(0).toUpperCase() || '')
    : 'NI';

  const [showCpf, setShowCpf] = useState(false);
  const [showRg, setShowRg] = useState(false);

  const mockFinancialProfile = {
    contractedAmount: profile.contract.contractedAmount,
    paidAmount: profile.contract.paidAmount,
    openAmount: profile.contract.openAmount,
    financialStatus: profile.contract.status,
    nextDueDate: profile.obligations.nextDueDate,
    nextDueAmount: profile.obligations.nextDueAmount,
    pendingInstallments: profile.obligations.pendingInstallments,
    overdueInstallments: profile.obligations.overdueInstallments,
  };

  const percentQuitado = isEmptyState
    ? 0
    : mockFinancialProfile.contractedAmount > 0
    ? Math.round((mockFinancialProfile.paidAmount / mockFinancialProfile.contractedAmount) * 100)
    : 0;

  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        borderRadius: 2,
        flexDirection: 'column',
        bgcolor: 'background.neutral',
        ...other,
      }}
    >
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* BLOCO 1 - IDENTIFICAÇÃO */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                height: '100%',
              }}
            >
              <Typography variant="overline" sx={{ color: 'text.disabled', mb: 2, display: 'block' }}>
                IDENTIFICAÇÃO
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IdentityAvatar
                  src={user.photoURL || ''}
                  sx={{
                    width: 64,
                    height: 64,
                    mr: 2,
                    border: '2px solid',
                    borderColor: '#00a76f',
                    bgcolor: 'rgba(0, 167, 111, 0.08)',
                    color: '#00a76f',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                  }}
                >
                  {avatarInitials}
                </IdentityAvatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'common.white', mb: 0.5 }}>
                    {isEmptyState ? '—' : displayName}
                  </Typography>
                  <Label
                    color={
                      isEmptyState
                        ? 'default'
                        : user.status === 'active'
                        ? 'success'
                        : user.status === 'suspended'
                        ? 'warning'
                        : 'default'
                    }
                    sx={{ textTransform: 'uppercase' }}
                  >
                    {isEmptyState ? '—' : user.status === 'active' ? 'Ativo' : user.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                  </Label>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    ASP-ID
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: 'common.white' }}>
                    {isEmptyState ? '—' : `#${user?.id || 'ASP-BR-8A9X2B'}`}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    Categoria
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: 'common.white' }}>
                    {isEmptyState ? '—' : user.category || 'Associado'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    CPF
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: 'common.white' }}>
                      {isEmptyState
                        ? '—'
                        : showCpf
                        ? user?.cpf || 'Não informado'
                        : user?.cpf
                        ? user.cpf.replace(/^\d{3}/, '***').replace(/\d{2}$/, '**')
                        : '***.***.***-**'}
                    </Typography>
                    <IconButton size="small" onClick={() => setShowCpf(!showCpf)} sx={{ p: 0.5 }} disabled={isEmptyState}>
                      <Iconify icon={showCpf ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={16} />
                    </IconButton>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    RG
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: 'common.white' }}>
                      {isEmptyState
                        ? '—'
                        : showRg
                        ? user?.rg || 'Não informado'
                        : user?.rg
                        ? '**.***.***-**'
                        : '**.***.***-**'}
                    </Typography>
                    <IconButton size="small" onClick={() => setShowRg(!showRg)} sx={{ p: 0.5 }} disabled={isEmptyState}>
                      <Iconify icon={showRg ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={16} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* BLOCO 2 - SITUAÇÃO FINANCEIRA */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                height: '100%',
              }}
            >
              <Typography variant="overline" sx={{ color: 'text.disabled', mb: 2, display: 'block' }}>
                SITUAÇÃO FINANCEIRA
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Valor Contratado</Typography>
                  <Typography variant="subtitle1" sx={{ color: 'common.white' }}>
                    {isEmptyState ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mockFinancialProfile.contractedAmount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Valor Pago</Typography>
                  <Typography variant="subtitle1" sx={{ color: isEmptyState ? 'common.white' : 'success.main' }}>
                    {isEmptyState ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mockFinancialProfile.paidAmount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Saldo em Aberto</Typography>
                  <Typography variant="subtitle1" sx={{ color: isEmptyState ? 'common.white' : 'warning.main' }}>
                    {isEmptyState ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mockFinancialProfile.openAmount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Situação</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Label color={isEmptyState ? 'default' : 'success'}>{isEmptyState ? '—' : mockFinancialProfile.financialStatus}</Label>
                  </Box>
                </Box>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Percentual Quitado</Typography>
                  <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 700 }}>{isEmptyState ? '—' : `${percentQuitado}%`}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={percentQuitado}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.08)',
                    '& .MuiLinearProgress-bar': { bgcolor: isEmptyState ? 'transparent' : 'success.main' },
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {/* BLOCO 3 - OBRIGAÇÕES FINANCEIRAS */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                height: '100%',
              }}
            >
              <Typography variant="overline" sx={{ color: 'text.disabled', mb: 2, display: 'block' }}>
                OBRIGAÇÕES FINANCEIRAS
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Próximo Vencimento</Typography>
                  <Typography variant="subtitle1" sx={{ color: 'common.white' }}>{isEmptyState ? '—' : mockFinancialProfile.nextDueDate}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Próxima Cobrança</Typography>
                  <Typography variant="subtitle1" sx={{ color: isEmptyState ? 'common.white' : 'info.main' }}>
                    {isEmptyState ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mockFinancialProfile.nextDueAmount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Parcelas Pendentes</Typography>
                  <Typography variant="subtitle1" sx={{ color: 'common.white' }}>{isEmptyState ? '—' : mockFinancialProfile.pendingInstallments}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Parcelas Vencidas</Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: isEmptyState ? 'common.white' : mockFinancialProfile.overdueInstallments > 0 ? 'error.main' : 'common.white',
                    }}
                  >
                    {isEmptyState ? '—' : mockFinancialProfile.overdueInstallments}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ABA DE FILTRO (PERÍODO) */}
      <Box
        sx={{
          p: { xs: 2.5, md: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px dashed rgba(145, 158, 171, 0.24)',
        }}
      >
        <Tabs
          value={selectedYear}
          onChange={(e, newValue) => onSelectYear(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: 32,
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTab-root': {
              minHeight: 32,
              minWidth: 0,
              px: 2.5,
              py: 0.5,
              borderRadius: 32,
              mr: 1.5,
              color: 'text.secondary',
              typography: 'subtitle2',
              fontWeight: 700,
              bgcolor: 'rgba(145, 158, 171, 0.08)',
              transition: (theme) => theme.transitions.create(['all']),
              '&.Mui-selected': {
                bgcolor: '#00a76f',
                color: 'common.white',
                boxShadow: '0 8px 16px 0 rgba(0, 167, 111, 0.24)',
              },
              '&:hover:not(.Mui-selected)': {
                bgcolor: 'rgba(145, 158, 171, 0.16)',
              },
            },
          }}
        >
          {years.map((year) => (
            <Tab key={year} label={year} value={year} disableRipple />
          ))}
        </Tabs>

        <Typography
          variant="overline"
          sx={{
            color: 'text.disabled',
            letterSpacing: 1,
            display: { xs: 'none', md: 'block' },
          }}
        >
          PERÍODO DE ANÁLISE
        </Typography>
      </Box>
    </Box>
  );
}
