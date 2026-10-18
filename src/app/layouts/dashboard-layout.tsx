import React, { useState } from 'react';
import currentEdition from '@edition';
import { Outlet, useLocation } from 'react-router';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ButtonBase from '@mui/material/ButtonBase';

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

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: colors.background.default,
        color: colors.text.primary,
        overflow: 'hidden',
      }}
    >
      {/* ================================================================ */}
      {/* 1. BARRA LATERAL ESQUERDA (LEFT SIDEBAR)                         */}
      {/* ================================================================ */}
      <Box
        component="aside"
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          borderRight: `1px solid ${colors.background.border}`,
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1200,
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
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
            borderBottom: `1px solid ${colors.background.border}`,
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
                  '&:hover': { color: colors.primary.main, backgroundColor: 'rgba(0, 240, 255, 0.08)' },
                }}
              >
                <Iconify icon={"solar:sidebar-minimalistic-outline" as any} width={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Botão de Expandir quando em modo Mini */}
        {isNavMini && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <Tooltip title="Expandir Menu">
              <IconButton
                size="small"
                onClick={() => setIsNavMini(false)}
                sx={{
                  color: colors.text.secondary,
                  '&:hover': { color: colors.primary.main, backgroundColor: 'rgba(0, 240, 255, 0.08)' },
                }}
              >
                <Iconify icon={"solar:hamburger-menu-outline" as any} width={18} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Lista de Navegação com Scrollbar Suave */}
        <Scrollbar sx={{ flexGrow: 1, px: isNavMini ? 1 : 1.5, py: 2 }}>
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
              p: 2,
              m: 1.5,
              borderRadius: 2,
              backgroundColor: colors.background.elevated,
              border: `1px solid ${colors.background.border}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Iconify icon={"solar:shield-check-bold-duotone" as any} width={22} sx={{ color: colors.success.main }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text.primary }}>
                Cofre Seguro BIP-44
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: colors.text.secondary, fontSize: '0.6875rem', display: 'block' }}>
              AEAD AES-256-GCM Ativo
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <Tooltip title="Cofre Seguro BIP-44 Ativo">
              <Iconify icon={"solar:shield-check-bold-duotone" as any} width={24} sx={{ color: colors.success.main }} />
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
          ml: `${sidebarWidth}px`,
          transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ============================================================== */}
        {/* 2. CABEÇALHO DESKTOP SUPERIOR (TOP HEADER)                    */}
        {/* ============================================================== */}
        <Box
          component="header"
          sx={{
            height: 64,
            borderBottom: `1px solid ${colors.background.border}`,
            backgroundColor: 'rgba(11, 15, 25, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            position: 'sticky',
            top: 0,
            zIndex: 1100,
          }}
        >
          {/* Lado Esquerdo: Identificador da Rota Ativa & Pesquisa */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.text.primary }}>
                {currentEdition.routes.find((r) => r.path === location.pathname)?.label ?? 'Dashboard'}
              </Typography>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto', borderColor: colors.background.border }} />

            <ButtonBase
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                backgroundColor: colors.background.elevated,
                border: `1px solid ${colors.background.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: colors.text.secondary,
                fontSize: '0.75rem',
                '&:hover': {
                  borderColor: colors.primary.main,
                  color: colors.text.primary,
                },
              }}
            >
              <Iconify icon={"solar:magnifer-outline" as any} width={14} />
              <span>Buscar nós, CIDs ou transações...</span>
              <Box component="span" sx={{ px: 0.75, py: 0.1, borderRadius: 0.5, backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '0.625rem' }}>
                Ctrl + K
              </Box>
            </ButtonBase>
          </Box>

          {/* Lado Direito: Telemetria Rust IPC + Gaveta de Notificações */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <StatusBadge status="ONLINE" label="Rust IPC v2" />

            <Tooltip title="Centro de Notificações & Telemetria">
              <IconButton
                onClick={() => setIsRightDrawerOpen(true)}
                sx={{
                  color: isRightDrawerOpen ? colors.primary.main : colors.text.secondary,
                  backgroundColor: isRightDrawerOpen ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                  '&:hover': { color: colors.primary.main, backgroundColor: 'rgba(0, 240, 255, 0.08)' },
                }}
              >
                <Badge badgeContent={3} color="primary">
                  <Iconify icon={"solar:bell-bing-bold-duotone" as any} width={20} />
                </Badge>
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto', borderColor: colors.background.border }} />

            {/* Perfil Operador Desktop */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: colors.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  color: '#000',
                  fontSize: '0.75rem',
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
        <Box component="main" sx={{ flexGrow: 1, overflow: 'auto', p: 3, pb: 6 }}>
          <Outlet />
        </Box>

        {/* ============================================================== */}
        {/* 4. RODAPÉ / DESKTOP STATUS BAR (STATUS BAR INFERIOR)           */}
        {/* ============================================================== */}
        <Box
          component="footer"
          sx={{
            height: 30,
            borderTop: `1px solid ${colors.background.border}`,
            backgroundColor: 'rgba(11, 15, 25, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            position: 'fixed',
            bottom: 0,
            left: `${sidebarWidth}px`,
            right: 0,
            transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1100,
            fontSize: '0.6875rem',
            color: colors.text.secondary,
          }}
        >
          {/* Lado Esquerdo: Telemetria Kubo IPFS */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: colors.success.main }} />
              <Typography variant="caption" sx={{ fontSize: 'inherit', fontWeight: 600, color: colors.text.primary }}>
                Kubo Daemon: Ativo
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon={"solar:users-group-two-rounded-bold" as any} width={13} sx={{ color: colors.primary.main }} />
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
              <Iconify icon={"solar:shield-keyhole-bold" as any} width={13} sx={{ color: colors.success.main }} />
              <span>AES-256-GCM</span>
            </Box>

            <Typography variant="caption" sx={{ fontSize: 'inherit', color: colors.text.secondary }}>
              {currentEdition.name} v1.0.0
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ================================================================ */}
      {/* 3. PAINEL LATERAL DIREITO (RIGHT DRAWER)                         */}
      {/* ================================================================ */}
      <Drawer
        anchor="right"
        open={isRightDrawerOpen}
        onClose={() => setIsRightDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              backgroundColor: colors.background.paper,
              borderLeft: `1px solid ${colors.background.border}`,
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
            <Iconify icon={"solar:satellite-bold-duotone" as any} width={22} sx={{ color: colors.primary.main }} />
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
          <Box sx={{ p: 2, mb: 2, borderRadius: 2, backgroundColor: colors.background.elevated, border: `1px solid ${colors.background.border}` }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.primary.main, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Motor IPFS (Kubo Sidecar)
            </Typography>
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1, fontSize: '0.75rem' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.text.secondary }}>Status do Processo:</span>
                <span style={{ color: colors.success.main, fontWeight: 700 }}>Em Execução (PID 4812)</span>
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
            <Box sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(0, 240, 255, 0.04)', border: '1px solid rgba(0, 240, 255, 0.12)' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: colors.primary.main, display: 'block' }}>
                Novo Bloco de Pinning Detectado
              </Typography>
              <Typography variant="caption" sx={{ color: colors.text.secondary, fontSize: '0.6875rem' }}>
                Sincronização completada com 28 nós em 340ms.
              </Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: colors.success.main, display: 'block' }}>
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
