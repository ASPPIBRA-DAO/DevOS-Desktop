import type {
  ActiveProject,
  PriorityAlert,
  PendingAction,
  CommunityEvent,
  EcosystemMetrics,
  CommunicationItem,
  CommunityFeedPost,
  WeeklyRecognition,
  GovernanceHighlight,
  CommunityOpportunity,
} from '../types/home';

import { fAdd, fSub } from '../utils/format-time';

export const _homeCommunications: CommunicationItem[] = [
  {
    id: 'comm-1',
    title: 'Assembleia Geral Ordinária 2026',
    description: 'Participe da votação das diretrizes estratégicas para o próximo trimestre.',
    coverUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
    linkText: 'Ver Pauta',
    linkUrl: '/devos/infrastructure',
    priority: 'urgente',
    channel: 'avisos',
    createdAt: fSub({ days: 1 }),
  },
  {
    id: 'comm-2',
    title: 'Novo Programa de Mentoria Aberto',
    description: 'Conecte-se com especialistas e impulsione suas iniciativas no ecossistema.',
    coverUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=60',
    linkText: 'Inscreva-se',
    linkUrl: '/devos/ipfs',
    priority: 'novidade',
    channel: 'novidades',
    createdAt: fSub({ days: 2 }),
  },
  {
    id: 'comm-3',
    title: 'Atualização do Protocolo de Segurança',
    description: 'Implementação de novas chaves de autenticação federada concluída com sucesso.',
    coverUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
    linkText: 'Saiba Mais',
    linkUrl: '/devos/infrastructure',
    priority: 'importante',
    channel: 'comunicados',
    createdAt: fSub({ days: 3 }),
  },
  {
    id: 'comm-4',
    title: 'Projetos em Destaque',
    description: 'Conheça as iniciativas selecionadas e acompanhe as novidades da comunidade.',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
    linkText: 'Ver Projetos',
    linkUrl: '/devos/ipfs',
    priority: 'destaque',
    channel: 'noticias',
    createdAt: fSub({ hours: 12 }),
  },
];

export const _homeMetrics: EcosystemMetrics = {
  activeMembers: 1240,
  activeProjects: 18,
  strategicPartners: 7,
  openProposals: 3,
  periodGrowth: {
    members: 23,
    referrals: 4,
    partners: 2,
  },
};

export const _homeGovernanceHighlight: GovernanceHighlight = {
  proposalId: '203',
  title: 'Aprovação de Orçamento para o Hub de Inovação Agro',
  summary: 'Alocação de recursos para infraestrutura e conectividade comunitária.',
  votingDeadline: fAdd({ days: 2, hours: 4 }),
  userVoted: false,
  status: 'active',
};

export const _homeActiveProjects: ActiveProject[] = [
  {
    id: 'proj-1',
    name: 'Cultiva Agro',
    summary: 'Expansão de hidropônicos comunitários na Região Leste.',
    status: 'in_progress',
    progress: 72,
    highlightUrl: '/devos/infrastructure',
  },
  {
    id: 'proj-2',
    name: 'Mundo Digital V2',
    summary: 'Novo portal de governança e serviços para associados.',
    status: 'in_progress',
    progress: 95,
    highlightUrl: '/devos/ipfs',
  },
  {
    id: 'proj-3',
    name: 'FFC Hub',
    summary: 'Plataforma de microfinanças comunitárias.',
    status: 'review',
    progress: 30,
    highlightUrl: '/devos/infrastructure',
  },
];

export const _homeCommunityFeed: CommunityFeedPost[] = [
  {
    id: 'feed-1',
    author: {
      name: 'Mundo Digital Visual',
      role: 'Portal Oficial',
      badge: 'Verificado',
    },
    content: 'Parabéns às equipes envolvidas no lançamento do app! Já está disponível para todos os membros ativos.',
    likesCount: 24,
    commentsCount: 6,
    sharesCount: 3,
    publishedAt: fSub({ hours: 3 }),
    isPinned: true,
  },
  {
    id: 'feed-2',
    author: {
      name: 'Comunidade ASPPIBRA',
      role: 'Canal Oficial',
      badge: 'Admin',
    },
    content: 'Chegamos à marca de 1.000 membros no ecossistema de microfinanças.',
    mediaUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=60',
    likesCount: 56,
    commentsCount: 12,
    sharesCount: 8,
    publishedAt: fSub({ hours: 8 }),
  },
  {
    id: 'feed-3',
    author: {
      name: 'Sistema Executivo',
      role: 'Automação',
    },
    content: 'A primeira fase do cultivo agro entrou em novo ciclo e aguarda relatório de validação da comissão de logística.',
    likesCount: 15,
    commentsCount: 2,
    sharesCount: 1,
    publishedAt: fSub({ days: 1 }),
  },
];

export const _homePriorityAlerts: PriorityAlert[] = [
  {
    id: 'alert-1',
    type: 'urgente',
    title: 'Manutenção Programada',
    message: 'Os serviços de sincronização IPFS e nós de validação passarão por manutenção no sábado das 02h às 04h.',
    actionText: 'Mais Info',
    actionUrl: '/devos/infrastructure',
    isDismissible: true,
  },
  {
    id: 'alert-2',
    type: 'importante',
    title: 'Assembleia Extraordinária',
    message: 'Participe da votação para o fechamento orçamentário do projeto de microcrédito e nós de armazenamento.',
    actionText: 'Votar Agora',
    actionUrl: '/devos/infrastructure',
    isDismissible: true,
  },
];

export const _homePendingActions: PendingAction[] = [
  {
    id: 'act-1',
    title: 'Votação Pendente',
    description: 'Proposta de governança aguardando seu voto.',
    actionText: 'Votar',
    actionUrl: '/devos/infrastructure',
    priority: 'high',
  },
  {
    id: 'act-2',
    title: 'Sincronização do Nó',
    description: 'Verificação periódica de SLA de custódia DePIN.',
    actionText: 'Ver Nó',
    actionUrl: '/devos/ipfs',
    priority: 'medium',
  },
  {
    id: 'act-3',
    title: 'Backup da Wallet',
    description: 'Proteja suas chaves e seed phrase no cofre seguro.',
    actionText: 'Verificar',
    actionUrl: '/',
    priority: 'low',
  },
];

export const _homeUpcomingEvents: CommunityEvent[] = [
  { id: '1', title: 'Assembleia Geral', date: '15 de Mar', category: 'Governança' },
  { id: '2', title: 'Oficina de Mentoria', date: '22 de Mar', category: 'Projetos' },
  { id: '3', title: 'Encontro de Embaixadores', date: '29 de Mar', category: 'Comunidade' },
];

export const _homeWeeklyRecognition: WeeklyRecognition[] = [
  { id: '1', title: 'Ana Silva', category: 'Líder no projeto Cultiva Agro' },
  { id: '2', title: 'Cultiva Agro', category: 'Projeto comunitário destaque mensal' },
  { id: '3', title: 'Logística SP', category: 'Parceiro destaque de entrega' },
];

export const _homeOpportunities: CommunityOpportunity[] = [
  {
    id: '1',
    title: 'Edital de Inovação',
    description: 'Financiamento para projetos agro até R$ 50k',
    type: 'edital',
  },
  {
    id: '2',
    title: 'Parcerias Locais',
    description: 'Conecte-se com parceiros de rede logística',
    type: 'parceria',
  },
];

