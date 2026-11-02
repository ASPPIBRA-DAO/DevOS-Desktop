import { useNavigate } from 'react-router';
import React, { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/app/router/paths';

import { Iconify } from 'src/shared/components/iconify';


// ----------------------------------------------------------------------

export type ModuleStatus = 'active' | 'soon' | 'restricted';
export type ModuleCategory = 'operacional' | 'gestao';

export interface ModuleCardItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  fileTag: string;
  route: string;
  destinationPath?: string;
  status: ModuleStatus;
  statusLabel: string;
  category: ModuleCategory;
  icon: string;
  accent: 'cyan' | 'amber' | 'magenta';
  badges?: string[];
  features?: string[];
}

export const BANKING_MODULES: ModuleCardItem[] = [
  {
    id: 'overview',
    title: 'Visão Geral Bancária',
    subtitle: 'Overview',
    description:
      'Painel executivo consolidado com balanço, despesas e carrossel de transferência rápida.',
    fileTag: 'overview-banking-view.tsx',
    route: '/banking',
    destinationPath: paths.devos.wallets,
    status: 'active',
    statusLabel: 'Ativo',
    category: 'operacional',
    icon: 'solar:widget-5-bold',
    accent: 'cyan',
    features: ['Balanço consolidado multimoeda', 'Métricas de fluxo de caixa', 'Atalhos de remessa instantânea'],
  },
  {
    id: 'conta',
    title: 'Saldos & Custódia',
    subtitle: 'Conta e Assets',
    description:
      'Gestão patrimonial global, privacidade de saldos e sub-ledger de cripto e moedas fiduciárias.',
    fileTag: 'conta-view.tsx',
    route: '/banking/conta',
    status: 'active',
    statusLabel: 'Ativo',
    category: 'gestao',
    icon: 'solar:wallet-bold',
    accent: 'cyan',
    features: ['Cofre criptográfico seguro (BIP-39/BIP-44)', 'Privacidade de saldos on/off', 'Sub-ledger fiduciário pt-BR'],
  },
  {
    id: 'cartoes',
    title: 'Central Operacional de Cartões',
    subtitle: 'Cartões Físicos e Virtuais',
    description:
      'Gestão visual de cartões com autenticação Step-Up, cartões descartáveis e limites.',
    fileTag: 'banking-cartoes-view.tsx',
    route: '/banking/cartoes',
    status: 'active',
    statusLabel: 'Ativo',
    category: 'operacional',
    icon: 'solar:card-bold',
    accent: 'cyan',
    features: ['Cartões virtuais dinâmicos', 'Autenticação 3D Secure / Step-Up', 'Controle dinâmico de limites por categoria'],
  },
  {
    id: 'rede',
    title: 'Rede & Afiliados',
    subtitle: 'Programa de Indicação & DAO',
    description:
      'Grafo hierárquico de rede, fluxo de comissões multimoeda e governança DAO.',
    fileTag: 'banking-rede-view.tsx',
    route: '/banking/rede',
    status: 'active',
    statusLabel: 'Ativo',
    category: 'gestao',
    icon: 'solar:users-group-two-rounded-bold',
    accent: 'cyan',
    features: ['Árvore genealógica de afiliados', 'Comissionamento em tempo real', 'Votações de tesouraria da DAO'],
  },
  {
    id: 'transacoes',
    title: 'Extrato e Auditoria',
    subtitle: 'Transações & Ledger',
    description:
      'Livro-razão auditável e trilha de auditoria em conformidade rigorosa com a LGPD.',
    fileTag: 'banking-transacoes-view.tsx',
    route: '/banking/transacoes',
    destinationPath: paths.devos.ledger,
    status: 'active',
    statusLabel: 'Ativo',
    category: 'gestao',
    icon: 'solar:document-text-bold',
    accent: 'cyan',
    features: ['Extrato bancário autenticado com hash', 'Exportação em PDF/CSV/Typst', 'Pesquisa instantânea por associado'],
  },
  {
    id: 'receber',
    title: 'Módulo de Recebimento',
    subtitle: 'Inbound Gateway',
    description:
      'Geração rápida de cobranças instantâneas via Pix, Boletos e Transferências Múltiplas.',
    fileTag: 'receber/index.tsx',
    route: '/banking/receber',
    status: 'soon',
    statusLabel: 'Em Breve',
    category: 'operacional',
    icon: 'solar:qr-code-bold',
    accent: 'amber',
    features: ['Pix Copia e Cola / QR Code dinâmico', 'Geração de boletos com código de barras', 'Webhook de conciliação automática'],
  },
  {
    id: 'transferencias',
    title: 'Pagamentos & Remessas',
    subtitle: 'Outbound Gateway',
    description:
      'Central de envios para Pix, remessas internacionais SWIFT e Web3 Transfer.',
    fileTag: 'transferencias/index.tsx',
    route: '/banking/transferencias',
    status: 'soon',
    statusLabel: 'Em Breve',
    category: 'operacional',
    icon: 'solar:plain-bold',
    accent: 'amber',
    features: ['Envio Pix 24/7 com chave ou dados', 'Transferências Web3 cross-chain', 'Remessas internacionais SWIFT'],
  },
  {
    id: 'treasury',
    title: 'Tesouraria Bancária',
    subtitle: 'Institucional Admin',
    description:
      'Painel institucional de controle de liquidez, reservas cambiais e custódia total.',
    fileTag: 'treasury.tsx',
    route: '/banking/treasury',
    destinationPath: paths.devos.dao,
    status: 'restricted',
    statusLabel: 'Restrito Admin/Dev',
    category: 'gestao',
    icon: 'solar:city-bold',
    accent: 'magenta',
    features: ['Assinatura multifirmada (Multisig)', 'Controle de reservas cambiais', 'Auditoria formal de solvência'],
  },
  {
    id: 'payments',
    title: 'Gestão de Cobranças & Boletos',
    subtitle: 'Operações em Lote',
    description:
      'Painel de liquidação em lote, acompanhamento CNAB e métricas de inadimplência.',
    fileTag: 'payments.tsx',
    route: '/banking/payments',
    status: 'restricted',
    statusLabel: 'Restrito Admin/Dev',
    category: 'operacional',
    icon: 'solar:bill-list-bold',
    accent: 'magenta',
    features: ['Remessa e Retorno CNAB 240/400', 'Disparo de régua de cobrança', 'Relatório analítico de inadimplência'],
  },
];

// ----------------------------------------------------------------------

export function WalletsLandingView() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'operacional' | 'gestao'>('all');
  const [copiedRoute, setCopiedRoute] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleCardItem | null>(null);

  // Contadores dinâmicos
  const counts = useMemo(() => {
    const total = BANKING_MODULES.length;
    const operacional = BANKING_MODULES.filter((m) => m.category === 'operacional').length;
    const gestao = BANKING_MODULES.filter((m) => m.category === 'gestao').length;
    return { total, operacional, gestao };
  }, []);

  // Filtragem combinada (categoria + termo de busca)
  const filteredModules = useMemo(() => BANKING_MODULES.filter((item) => {
    // Filtro de categoria
    if (activeCategory === 'operacional' && item.category !== 'operacional') return false;
    if (activeCategory === 'gestao' && item.category !== 'gestao') return false;

    // Filtro de busca textual
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.route.toLowerCase().includes(q) ||
      item.fileTag.toLowerCase().includes(q)
    );
  }), [activeCategory, searchQuery]);

  const handleCopyRoute = (route: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(route);
      setCopiedRoute(route);
      setTimeout(() => setCopiedRoute(null), 2000);
    }
  };

  const handleAccess = (module: ModuleCardItem) => {
    if (module.destinationPath) {
      navigate(module.destinationPath);
    } else {
      setSelectedModule(module);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100%',
        pb: 8,
        pt: { xs: 2, md: 3 },
        px: { xs: 2, sm: 3, md: 5 },
        color: '#f8fafc',
      }}
    >
      {/* 🌌 Aura luminosa de fundo (Bloom degradê estilo Cyber-Terminal) */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          height: 380,
          background:
            'radial-gradient(ellipse 65% 55% at 50% 0%, rgba(0, 210, 255, 0.16) 0%, rgba(59, 130, 246, 0.08) 45%, transparent 75%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1320, mx: 'auto' }}>
        {/* ================================================================ */}
        {/* 1. CABEÇALHO HERO CENTRALIZADO                                    */}
        {/* ================================================================ */}
        <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4.5 } }}>
          {/* Micro-Pill Tag */}
          <Chip
            size="small"
            label="ID: Navegador do Sistema Integrado / Banking"
            icon={<Iconify icon="solar:shield-check-bold" width={14} sx={{ color: '#00d2ff' }} />}
            sx={{
              mb: 2,
              px: 1.25,
              py: 0.5,
              fontSize: '0.72rem',
              fontWeight: 800,
              fontFamily: 'var(--font-orbitron), "Orbitron", sans-serif',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: '#38bdf8',
              bgcolor: 'rgba(0, 210, 255, 0.08)',
              border: '1px solid rgba(0, 210, 255, 0.28)',
              boxShadow: '0 0 16px rgba(0, 210, 255, 0.18)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Título Principal com Gradiente */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '1.85rem', sm: '2.5rem', md: '2.85rem' },
              lineHeight: 1.15,
              letterSpacing: '-0.8px',
              mb: 1.5,
            }}
          >
            Explore todas as soluções do seu{' '}
            <Box
              component="span"
              sx={{
                display: 'block',
                background:
                  'linear-gradient(90deg, #00d2ff 0%, #38bdf8 30%, #60a5fa 70%, #00ff7f 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 14px rgba(0, 210, 255, 0.35))',
              }}
            >
              Banco Digital & Custódia DeFi
            </Box>
          </Typography>

          {/* Subtítulo Descritivo */}
          <Typography
            variant="body1"
            sx={{
              color: '#94a3b8',
              maxWidth: 780,
              mx: 'auto',
              fontSize: { xs: '0.9rem', md: '1.02rem' },
              lineHeight: 1.6,
            }}
          >
            Acesso centralizado a painéis de controle, extratos auditáveis, gestão de cartões de alto limite, rede de afiliados e ferramentas institucionais de tesouraria.
          </Typography>
        </Box>

        {/* ================================================================ */}
        {/* 2. BARRA DE CONTROLE: BUSCA E FILTROS                            */}
        {/* ================================================================ */}
        <Card
          sx={{
            mb: 4,
            p: 1.25,
            bgcolor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            {/* Campo de Busca em Tempo Real */}
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por módulo, funcionalidade ou rota (ex: /conta, Pix, cartões)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:magnifer-linear" width={20} sx={{ color: '#00d2ff' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ color: 'text.secondary' }}>
                        <Iconify icon="solar:close-circle-bold" width={16} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(2, 6, 23, 0.6)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '0.92rem',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 210, 255, 0.4)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00d2ff',
                    boxShadow: '0 0 12px rgba(0, 210, 255, 0.25)',
                  },
                },
                '& input::placeholder': {
                  color: '#64748b',
                  opacity: 1,
                },
              }}
            />

            {/* Abas / Botões de Filtro */}
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0, width: { xs: '100%', md: 'auto' } }}>
              <Button
                variant={activeCategory === 'all' ? 'contained' : 'outlined'}
                onClick={() => setActiveCategory('all')}
                sx={{
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 2,
                  py: 0.9,
                  ...(activeCategory === 'all'
                    ? {
                      bgcolor: '#00d2ff',
                      color: '#020617',
                      boxShadow: '0 0 18px rgba(0, 210, 255, 0.5)',
                      '&:hover': { bgcolor: '#38bdf8' },
                    }
                    : {
                      color: '#94a3b8',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      bgcolor: 'rgba(15, 23, 42, 0.5)',
                      '&:hover': { borderColor: 'rgba(0, 210, 255, 0.4)', color: '#f8fafc' },
                    }),
                }}
              >
                Todas ({counts.total})
              </Button>

              <Button
                variant={activeCategory === 'operacional' ? 'contained' : 'outlined'}
                onClick={() => setActiveCategory('operacional')}
                sx={{
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 2,
                  py: 0.9,
                  ...(activeCategory === 'operacional'
                    ? {
                      bgcolor: '#00d2ff',
                      color: '#020617',
                      boxShadow: '0 0 18px rgba(0, 210, 255, 0.5)',
                      '&:hover': { bgcolor: '#38bdf8' },
                    }
                    : {
                      color: '#94a3b8',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      bgcolor: 'rgba(15, 23, 42, 0.5)',
                      '&:hover': { borderColor: 'rgba(0, 210, 255, 0.4)', color: '#f8fafc' },
                    }),
                }}
              >
                Operacional ({counts.operacional})
              </Button>

              <Button
                variant={activeCategory === 'gestao' ? 'contained' : 'outlined'}
                onClick={() => setActiveCategory('gestao')}
                sx={{
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 2,
                  py: 0.9,
                  ...(activeCategory === 'gestao'
                    ? {
                      bgcolor: '#00d2ff',
                      color: '#020617',
                      boxShadow: '0 0 18px rgba(0, 210, 255, 0.5)',
                      '&:hover': { bgcolor: '#38bdf8' },
                    }
                    : {
                      color: '#94a3b8',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      bgcolor: 'rgba(15, 23, 42, 0.5)',
                      '&:hover': { borderColor: 'rgba(0, 210, 255, 0.4)', color: '#f8fafc' },
                    }),
                }}
              >
                Gestão & Ativos ({counts.gestao})
              </Button>
            </Stack>
          </Stack>
        </Card>

        {/* ================================================================ */}
        {/* 3. GRID DE CARDS DO MÓDULO BANCÁRIO                              */}
        {/* ================================================================ */}
        {filteredModules.length === 0 ? (
          <Card
            sx={{
              p: 6,
              textAlign: 'center',
              bgcolor: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
            }}
          >
            <Iconify icon="solar:magnifer-linear" width={48} sx={{ color: '#64748b', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#f8fafc', mb: 1 }}>
              Nenhum módulo encontrado
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2.5 }}>
              Nenhuma funcionalidade bate com o termo &quot;{searchQuery}&quot;.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              sx={{ borderColor: '#00d2ff', color: '#00d2ff' }}
            >
              Limpar Filtros
            </Button>
          </Card>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2.75,
            }}
          >
            {filteredModules.map((item) => {
              const isCyan = item.accent === 'cyan';
              const isAmber = item.accent === 'amber';

              const topBorderColor = isCyan
                ? 'linear-gradient(90deg, #00d2ff 0%, #3b82f6 100%)'
                : isAmber
                  ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(90deg, #ec4899 0%, #a855f7 100%)';

              const iconBoxBg = isCyan
                ? 'rgba(0, 210, 255, 0.1)'
                : isAmber
                  ? 'rgba(245, 158, 11, 0.1)'
                  : 'rgba(236, 72, 153, 0.1)';

              const iconColor = isCyan ? '#00d2ff' : isAmber ? '#f59e0b' : '#ec4899';

              const badgeColor = isCyan ? '#22c55e' : isAmber ? '#f59e0b' : '#f43f5e';
              const badgeBg = isCyan
                ? 'rgba(34, 197, 94, 0.08)'
                : isAmber
                  ? 'rgba(245, 158, 11, 0.08)'
                  : 'rgba(244, 63, 94, 0.08)';
              const badgeBorder = isCyan
                ? 'rgba(34, 197, 94, 0.3)'
                : isAmber
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(244, 63, 94, 0.3)';

              return (
                <Card
                  key={item.id}
                  onClick={() => handleAccess(item)}
                  sx={{
                    position: 'relative',
                    p: 2.75,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 290,
                    borderRadius: '16px',
                    bgcolor: 'rgba(15, 23, 42, 0.72)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 12px 36px -6px rgba(0, 0, 0, 0.65)',
                    cursor: 'pointer',
                    transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',

                    // 💎 Borda superior de destaque colorida
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: topBorderColor,
                    },

                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: isCyan
                        ? 'rgba(0, 210, 255, 0.4)'
                        : isAmber
                          ? 'rgba(245, 158, 11, 0.4)'
                          : 'rgba(236, 72, 153, 0.4)',
                      boxShadow: isCyan
                        ? '0 20px 48px -8px rgba(0, 210, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                        : isAmber
                          ? '0 20px 48px -8px rgba(245, 158, 11, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                          : '0 20px 48px -8px rgba(236, 72, 153, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                    },
                  }}
                >
                  <Box>
                    {/* Linha Superior: Ícone + Status Badge */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2.25,
                      }}
                    >
                      {/* Box do Ícone */}
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: iconBoxBg,
                          border: `1px solid ${iconColor}33`,
                          boxShadow: `0 0 14px ${iconColor}22`,
                        }}
                      >
                        <Iconify icon={item.icon} width={24} sx={{ color: iconColor }} />
                      </Box>

                      {/* Status Badge */}
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 1.25,
                          py: 0.4,
                          borderRadius: '20px',
                          bgcolor: badgeBg,
                          border: `1px solid ${badgeBorder}`,
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: badgeColor,
                            boxShadow: `0 0 6px ${badgeColor}`,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: badgeColor,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {item.statusLabel}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Título e Categoria Subtitle */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        fontSize: '1.08rem',
                        lineHeight: 1.25,
                        color: '#f8fafc',
                        mb: 0.5,
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        mb: 1.25,
                      }}
                    >
                      {item.subtitle}
                    </Typography>

                    {/* Descrição */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#94a3b8',
                        fontSize: '0.84rem',
                        lineHeight: 1.55,
                        mb: 2,
                      }}
                    >
                      {item.description}
                    </Typography>

                    {/* Tag de Arquivo Fonte / Componente */}
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.2,
                        py: 0.4,
                        borderRadius: '6px',
                        bgcolor: 'rgba(0, 210, 255, 0.05)',
                        border: '1px solid rgba(0, 210, 255, 0.15)',
                        mb: 2.5,
                      }}
                    >
                      <Iconify icon="solar:bolt-bold" width={12} sx={{ color: '#00d2ff' }} />
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          color: '#38bdf8',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                        }}
                      >
                        {item.fileTag}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Linha Inferior: Rota + Ações */}
                  <Box
                    sx={{
                      pt: 1.75,
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {/* Display da Rota com Botão de Copiar */}
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          color: '#64748b',
                          fontSize: '0.75rem',
                        }}
                      >
                        {item.route}
                      </Typography>

                      <Tooltip
                        title={copiedRoute === item.route ? 'Copiado!' : 'Copiar Rota'}
                        arrow
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => handleCopyRoute(item.route, e)}
                          sx={{
                            p: 0.5,
                            color: copiedRoute === item.route ? '#00ff7f' : '#64748b',
                            '&:hover': { color: '#00d2ff' },
                          }}
                        >
                          <Iconify
                            icon={copiedRoute === item.route ? 'solar:check-read-bold' : 'solar:copy-linear'}
                            width={14}
                          />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    {/* Botão Acessar */}
                    <Button
                      size="small"
                      endIcon={<Iconify icon="solar:arrow-right-up-linear" width={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccess(item);
                      }}
                      sx={{
                        color: isCyan ? '#00d2ff' : isAmber ? '#f59e0b' : '#ec4899',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        px: 1.25,
                        py: 0.4,
                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        '&:hover': {
                          bgcolor: isCyan
                            ? 'rgba(0, 210, 255, 0.15)'
                            : isAmber
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(236, 72, 153, 0.15)',
                          borderColor: isCyan ? '#00d2ff' : isAmber ? '#f59e0b' : '#ec4899',
                        },
                      }}
                    >
                      Acessar
                    </Button>
                  </Box>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      {/* ================================================================ */}
      {/* 4. MODAL DETALHADO DO MÓDULO SELECIONADO                         */}
      {/* ================================================================ */}
      <Dialog
        open={Boolean(selectedModule)}
        onClose={() => setSelectedModule(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#0b1120',
              border: '1px solid rgba(0, 210, 255, 0.3)',
              borderRadius: '18px',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 32px rgba(0, 210, 255, 0.2)',
              color: '#f8fafc',
              p: 1,
            },
          },
        }}
      >
        {selectedModule && (
          <>
            <DialogTitle sx={{ pb: 1, pt: 2, px: 3 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0, 210, 255, 0.1)',
                    border: '1px solid rgba(0, 210, 255, 0.25)',
                  }}
                >
                  <Iconify icon={selectedModule.icon} width={22} sx={{ color: '#00d2ff' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {selectedModule.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    {selectedModule.subtitle} • {selectedModule.route}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2 }}>
              <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2.5, lineHeight: 1.6 }}>
                {selectedModule.description}
              </Typography>

              {/* Status e Arquivo */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  mb: 2.5,
                }}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.25 }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Status Operacional:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#00ff7f' }}>
                    {selectedModule.statusLabel}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.25 }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Arquivo Fonte:
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                    src/modules/wallets/{selectedModule.fileTag}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Nível de Segurança:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                    Cofre Local Hardware (Tauri AES-256-GCM)
                  </Typography>
                </Stack>
              </Box>

              {/* Recursos Inclusos */}
              {selectedModule.features && (
                <Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, mb: 1, display: 'block' }}>
                    RECURSOS DISPONÍVEIS NESTE MÓDULO:
                  </Typography>
                  <Stack spacing={0.75}>
                    {selectedModule.features.map((feat, idx) => (
                      <Stack key={idx} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Iconify icon="solar:check-circle-bold" width={16} sx={{ color: '#00ff7f' }} />
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                          {feat}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setSelectedModule(null)} sx={{ color: '#94a3b8' }}>
                Fechar
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setSelectedModule(null);
                  if (selectedModule.destinationPath) {
                    navigate(selectedModule.destinationPath);
                  }
                }}
                sx={{
                  bgcolor: '#00d2ff',
                  color: '#020617',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#38bdf8' },
                }}
              >
                Abrir Módulo
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
