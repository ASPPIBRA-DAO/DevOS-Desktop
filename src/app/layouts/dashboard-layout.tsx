import currentEdition from '@edition';
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { colors } from '../../shared/theme/palette';
import { Logo } from '../../shared/components/logo';
import { Iconify } from '../../shared/components/iconify';
import { Scrollbar } from '../../shared/components/scrollbar';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { NavSectionMini, NavSectionVertical } from '../../shared/components/nav-section';

// ----------------------------------------------------------------------

export function DashboardLayout() {
  const location = useLocation();

  // Estados de controle do layout
  const [isNavMini, setIsNavMini] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

  // Mapear rotas do manifesto de edição para o formato do NavSection
  const navData = [
    {
      subheader: 'OPERAÇÕES & NÓ',
      items: currentEdition.routes.map((r) => ({
        title: r.label,
        path: r.path,
        icon: <Iconify icon={r.icon as any} width={22} />,
      })),
    },
  ];

  const sidebarWidth = isNavMini ? 88 : 280;
  const contentMarginLeft = isNavMini ? '120px' : '312px';

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: colors.background.default,
        color: colors.text.primary,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ================================================================ */}
      {/* 1. BARRA LATERAL ESQUERDA (3D VIDROMORFISMO FLUTUANTE)           */}
      {/* ================================================================ */}
      <Box
        component="aside"
        sx={{
          width: sidebarWidth,
          height: 'calc(100vh - 32px)',
          position: 'fixed',
          top: 16,
          left: 16,
          bottom: 16,
          zIndex: 1200,
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',

          // 💎 VIDROMORFISMO 3D (OBSIDIANA TRANSLÚCIDA + APPLE RETINA BLUR)
          background: colors.background.glass,
          backdropFilter: 'blur(24px) saturate(190%)',
          WebkitBackdropFilter: 'blur(24px) saturate(190%)',
          border: `1px solid ${colors.background.border}`,
          boxShadow: [
            '0 24px 60px -12px rgba(0, 0, 0, 0.75)',
            '0 10px 24px -4px rgba(0, 0, 0, 0.55)',
            `inset 0 1.5px 0 ${colors.background.borderLight}`,
            'inset 1px 0 0 rgba(255, 255, 255, 0.08)',
            'inset 0 -1.5px 0 rgba(0, 0, 0, 0.5)',
          ].join(', '),

          // ✨ REFLEXO GLOSSY DIAGONAL 3D
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            borderRadius: 'inherit',
            background:
              'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 30%, transparent 60%)',
            pointerEvents: 'none',
            zIndex: 1,
          },
        }}
      >
        {/* Cabeçalho da Sidebar (Logo & Alternância Mini/Full) */}
        <Box
          sx={{
            height: 64,
            px: isNavMini ? 1.5 : 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isNavMini ? 'center' : 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Logo disabled={false} sx={{ width: 36, height: 36 }} />
            {!isNavMini && (
              <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: colors.primary.main, lineHeight: 1.1 }}>
                  ASPPIBRA DAO
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.secondary, fontSize: '0.6875rem' }}>
                  {currentEdition.name}
                </Typography>
              </Box>
            )}
          </Box>

          {!isNavMini && (
            <Tooltip title="Recolher Menu">
              <IconButton
                size="small"
                onClick={() => setIsNavMini(true)}
                sx={{
                  color: colors.text.secondary,
                  '&:hover': { color: colors.neon.green, backgroundColor: 'rgba(0, 255, 127, 0.08)' },
                }}
              >
                <Iconify icon={"solar:sidebar-minimalistic-outline" as any} width={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Botão de Expandir quando em modo Mini */}
        {isNavMini && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1, position: 'relative', zIndex: 2 }}>
            <Tooltip title="Expandir Menu">
              <IconButton
                size="small"
                onClick={() => setIsNavMini(false)}
                sx={{
                  color: colors.text.secondary,
                  '&:hover': { color: colors.neon.green, backgroundColor: 'rgba(0, 255, 127, 0.08)' },
                }}
              >
                <Iconify icon={"solar:hamburger-menu-outline" as any} width={18} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Lista de Navegação com Scrollbar Vidromórfica */}
        <Scrollbar sx={{ flexGrow: 1, px: isNavMini ? 1 : 1.5, py: 2, position: 'relative', zIndex: 2 }}>
          {isNavMini ? (
            <NavSectionMini data={navData} />
          ) : (
            <NavSectionVertical data={navData} />
          )}
        </Scrollbar>

        {/* Rodapé da Sidebar: Status do Cofre Local */}
        {!isNavMini ? (
          <Box
            sx={{
              p: 1.5,
              m: 1.5,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: colors.neon.green,
                  boxShadow: `0 0 8px ${colors.neon.green}`,
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text.primary }}>
                Cofre Seguro BIP-44
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: colors.text.secondary, fontSize: '0.6875rem', display: 'block', pl: 2.5 }}>
              AEAD AES-256-GCM Ativo
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, position: 'relative', zIndex: 2 }}>
            <Tooltip title="Cofre Seguro BIP-44 Ativo">
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: colors.neon.green,
                  boxShadow: `0 0 10px ${colors.neon.green}`,
                }}
              />
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* ================================================================ */}
      {/* ÁREA PRINCIPAL (HEADER + CONTEÚDO + FOOTER STATUS BAR)           */}
      {/* ================================================================ */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          ml: contentMarginLeft,
          pr: 2,
          transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ============================================================== */}
        {/* 2. CABEÇALHO SUPERIOR (3D VIDROMORFISMO COM CHANFRO NEON)      */}
        {/* ============================================================== */}
        <Box
          component="header"
          sx={{
            height: 64,
            position: 'sticky',
            top: 16,
            zIndex: 1100,
            width: '100%',
            borderRadius: '20px',
            overflow: 'hidden',
            isolation: 'isolate',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            mb: 2,

            // 💎 VIDROMORFISMO 3D (PADRÃO DASHBOARD OBSIDIAN)
            background: colors.background.glassHeader,
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            border: `1px solid ${colors.background.border}`,
            boxShadow: [
              '0 24px 60px -12px rgba(0, 0, 0, 0.75)',
              '0 10px 24px -4px rgba(0, 0, 0, 0.55)',
              `inset 0 1.5px 0 ${colors.background.borderLight}`,
              'inset 1px 0 0 rgba(255, 255, 255, 0.08)',
              'inset 0 -1.5px 0 rgba(0, 0, 0, 0.5)',
            ].join(', '),

            // ✨ REFLEXO GLOSSY DIAGONAL
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              borderRadius: 'inherit',
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 30%, transparent 60%)',
              pointerEvents: 'none',
              zIndex: 1,
            },

            // ⚡ CHANFRO DE LUZ NEON INFERIOR
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '2px',
              background:
                'linear-gradient(90deg, rgba(0, 255, 127, 0.6) 0%, rgba(255, 255, 255, 0.12) 35%, rgba(0, 210, 255, 0.5) 100%)',
              pointerEvents: 'none',
              zIndex: 2,
            },
          }}
        >
          {/* Lado Esquerdo: Identificador da Rota Ativa & Pesquisa */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: colors.text.primary, letterSpacing: -0.2 }}>
                {currentEdition.routes.find((r) => r.path === location.pathname)?.label ?? 'Painel do Nó'}
              </Typography>
            </Box>

            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.6,
                borderRadius: 1.5,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'rgba(0, 255, 127, 0.4)',
                  backgroundColor: 'rgba(0, 255, 127, 0.04)',
                },
              }}
            >
              <Iconify icon={"solar:magnifer-linear" as any} width={15} sx={{ color: colors.text.secondary }} />
              <Typography variant="caption" sx={{ color: colors.text.secondary, fontSize: '0.75rem' }}>
                Buscar nós, CIDs ou transações...
              </Typography>
              <Box
                sx={{
                  px: 0.75,
                  py: 0.2,
                  borderRadius: 0.75,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  color: colors.text.disabled,
                }}
              >
                Ctrl + K
              </Box>
            </Box>
          </Box>

          {/* Lado Direito: Ações, Status IPC e Perfil */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative', zIndex: 3 }}>
            {/* Status do Motor Nativo Rust */}
            <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              <StatusBadge
                status="ONLINE"
                label="RUST IPC V2"
                pulse
              />
            </Box>

            {/* Botão de Notificações / Gaveta Direita */}
            <Tooltip title="Central de Notificações & Telemetria">
              <IconButton
                size="small"
                onClick={() => setIsRightDrawerOpen(true)}
                sx={{
                  color: colors.text.secondary,
                  '&:hover': { color: colors.neon.green, backgroundColor: 'rgba(0, 255, 127, 0.08)' },
                }}
              >
                <Badge badgeContent={3} color="primary" variant="dot">
                  <Iconify icon={"solar:bell-bing-bold" as any} width={20} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Avatar e Perfil do Operador */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                pl: 1,
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00FF7F 0%, #00A76F 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  color: '#000',
                  fontSize: '0.75rem',
                  boxShadow: '0 0 10px rgba(0, 255, 127, 0.4)',
                }}
              >
                OP
              </Box>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text.primary, display: 'block', lineHeight: 1 }}>
                  Operador 01
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.secondary, fontSize: '0.625rem' }}>
                  Sessão Soberana
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Conteúdo Principal das Telas */}
        <Box component="main" sx={{ flexGrow: 1, overflow: 'auto', p: 1, pb: 7 }}>
          <Outlet />
        </Box>

        {/* ============================================================== */}
        {/* 4. RODAPÉ / DESKTOP STATUS BAR (VIDROMÓRFICO INFERIOR)         */}
        {/* ============================================================== */}
        <Box
          component="footer"
          sx={{
            height: 32,
            borderTop: `1px solid ${colors.background.border}`,
            backgroundColor: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(20px) saturate(190%)',
            WebkitBackdropFilter: 'blur(20px) saturate(190%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2.5,
            position: 'fixed',
            bottom: 0,
            left: contentMarginLeft,
            right: 0,
            transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1100,
            fontSize: '0.6875rem',
            color: colors.text.secondary,
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Lado Esquerdo: Telemetria Kubo IPFS */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: colors.neon.green,
                  boxShadow: `0 0 6px ${colors.neon.green}`,
                }}
              />
              <Typography variant="caption" sx={{ fontSize: 'inherit', fontWeight: 600, color: colors.text.primary }}>
                Kubo Daemon: Ativo
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon={"solar:users-group-two-rounded-bold" as any} width={13} sx={{ color: colors.neon.cyan }} />
              <span>28 Peers</span>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon={"solar:server-path-outline" as any} width={13} />
              <span>Gateway: 127.0.0.1:8080</span>
            </Box>
          </Box>

          {/* Lado Direito: IPC, Edição e Segurança */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon={"solar:bolt-bold" as any} width={13} sx={{ color: colors.warning.main }} />
              <span>IPC: 0.8ms</span>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon={"solar:shield-keyhole-bold" as any} width={13} sx={{ color: colors.neon.green }} />
              <span>AES-256-GCM</span>
            </Box>

            <Typography variant="caption" sx={{ fontSize: 'inherit', color: colors.text.secondary }}>
              {currentEdition.name} v1.0.0
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ================================================================ */}
      {/* 3. PAINEL LATERAL DIREITO (VIDROMORFISMO 3D TRANSLÚCIDO)         */}
      {/* ================================================================ */}
      <Drawer
        anchor="right"
        open={isRightDrawerOpen}
        onClose={() => setIsRightDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 380,
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.90) 0%, rgba(2, 8, 23, 0.85) 50%, rgba(15, 23, 42, 0.95) 100%)',
              backdropFilter: 'blur(24px) saturate(190%)',
              WebkitBackdropFilter: 'blur(24px) saturate(190%)',
              borderLeft: `1px solid ${colors.background.border}`,
              boxShadow: '-12px 0 48px rgba(0, 0, 0, 0.7), inset 0 1.5px 0 rgba(255, 255, 255, 0.2)',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        {/* Cabeçalho da Gaveta Direita */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon={"solar:satellite-bold-duotone" as any} width={22} sx={{ color: colors.neon.green }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: colors.text.primary }}>
              Central de Telemetria
            </Typography>
          </Box>

          <IconButton size="small" onClick={() => setIsRightDrawerOpen(false)}>
            <Iconify icon={"solar:close-circle-outline" as any} width={20} />
          </IconButton>
        </Box>

        <Scrollbar sx={{ flexGrow: 1 }}>
          {/* Seção de Estado do Daemon Kubo */}
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.neon.green, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Motor IPFS (Kubo Sidecar)
            </Typography>
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1, fontSize: '0.75rem' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.text.secondary }}>Status do Processo:</span>
                <span style={{ color: colors.neon.green, fontWeight: 700 }}>Em Execução (PID 4812)</span>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.text.secondary }}>Swarm Listeners:</span>
                <span>/ip4/0.0.0.0/tcp/4001</span>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.text.secondary }}>Pinning Ativo:</span>
                <span>50.000 ASPPBR Vinculados</span>
              </Box>
            </Box>
          </Box>

          {/* Seção de Notificações Recentes */}
          <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
            Alertas da Rede Recentes
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: 'rgba(0, 255, 127, 0.04)',
                border: '1px solid rgba(0, 255, 127, 0.15)',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: colors.neon.green, display: 'block' }}>
                Novo Bloco de Pinning Detectado
              </Typography>
              <Typography variant="caption" sx={{ color: colors.text.secondary, fontSize: '0.6875rem' }}>
                Sincronização completada com 28 nós em 340ms.
              </Typography>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: 'rgba(0, 210, 255, 0.04)',
                border: '1px solid rgba(0, 210, 255, 0.15)',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: colors.neon.cyan, display: 'block' }}>
                Backup do Cofre Concluído
              </Typography>
              <Typography variant="caption" sx={{ color: colors.text.secondary, fontSize: '0.6875rem' }}>
                Snapshot criptográfico salvo localmente no cofre SQLite.
              </Typography>
            </Box>
          </Box>
        </Scrollbar>
      </Drawer>
    </Box>
  );
}
