import React from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import { useUserProfile } from './hooks/use-user-profile';
import { AppMyActions } from './components/app-my-actions';
import { AppOnboarding } from './components/app-onboarding';
import { AppOpportunities } from './components/app-opportunities';
import { AppCommunityFeed } from './components/app-community-feed';
import { AppActiveProjects } from './components/app-active-projects';
import { AppPriorityAlerts } from './components/app-priority-alerts';
import { AppUpcomingEvents } from './components/app-upcoming-events';
import { AppChatHubSummary } from './components/app-chat-hub-summary';
import { AppWeeklyRecognition } from './components/app-weekly-recognition';
import { AppGovernanceHighlight } from './components/app-governance-highlight';
import { AppCommunicationCarousel } from './components/app-communication-carousel';
import { AppNetworkGrowth, AppEcosystemNumbers } from './components/app-ecosystem-numbers';
import {
  _homeMetrics,
  _homeCommunityFeed,
  _homeOpportunities,
  _homeActiveProjects,
  _homePendingActions,
  _homePriorityAlerts,
  _homeUpcomingEvents,
  _homeCommunications,
  _homeWeeklyRecognition,
  _homeGovernanceHighlight,
} from './_mock/home-mock';

export function NodeDashboardPage() {
  const user = useUserProfile();
  const isGuestOrNew = !user || user.roles?.includes('guest');
  const isCollaborator = user?.roles?.some((r: string) =>
    ['moderator', 'admin', 'coordinator', 'holder'].includes(r)
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Grid container spacing={3}>
        {/* Banner Carrossel Topo - Destaques e Comunicações */}
        <Grid size={{ xs: 12 }}>
          <AppCommunicationCarousel list={_homeCommunications} />
        </Grid>

        {/* Coluna Principal (Esquerda - 8 colunas) */}
        <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Alertas de Alta Prioridade */}
          <AppPriorityAlerts alerts={_homePriorityAlerts} />

          {/* Minhas Ações Pendentes */}
          <AppMyActions actions={_homePendingActions} />

          {/* Onboarding se for novo usuário */}
          {isGuestOrNew && <AppOnboarding />}

          {/* Oportunidades no fluxo principal para colaboradores */}
          {isCollaborator && <AppOpportunities list={_homeOpportunities} />}

          {/* Feed da Comunidade */}
          <AppCommunityFeed posts={_homeCommunityFeed} />
        </Grid>

        {/* Barra Lateral Direita (4 colunas) */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Números do Ecossistema */}
          <AppEcosystemNumbers metrics={_homeMetrics} />

          {/* Crescimento da Comunidade */}
          <AppNetworkGrowth metrics={_homeMetrics} />

          {/* Destaque de Governança */}
          <AppGovernanceHighlight highlight={_homeGovernanceHighlight} />

          {/* Acesso Rápido ao Chat / Canais */}
          <AppChatHubSummary />

          {/* Projetos em Evidência */}
          <AppActiveProjects projects={_homeActiveProjects} />

          {/* Próximos Eventos */}
          <AppUpcomingEvents events={_homeUpcomingEvents} />

          {/* Reconhecimento da Semana */}
          <AppWeeklyRecognition recognitions={_homeWeeklyRecognition} />

          {/* Oportunidades se não exibido na esquerda */}
          {!isCollaborator && <AppOpportunities list={_homeOpportunities} />}
        </Grid>
      </Grid>
    </Box>
  );
}

// Alias de compatibilidade com nomenclatura anterior
export const NodeDashboardView = NodeDashboardPage;

export default NodeDashboardPage;
