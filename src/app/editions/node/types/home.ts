export type CommunicationPriority = 'urgente' | 'importante' | 'novidade' | 'destaque';

export type CommunicationChannel = 'noticias' | 'avisos' | 'comunicados' | 'novidades';

export type CommunicationItem = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  linkText?: string;
  linkUrl?: string;
  priority: CommunicationPriority;
  channel: CommunicationChannel;
  createdAt: string;
};

export type EcosystemMetrics = {
  activeMembers: number;
  activeProjects: number;
  strategicPartners: number;
  openProposals: number;
  periodGrowth: {
    members: number;
    referrals: number;
    partners: number;
  };
};

export type GovernanceHighlight = {
  proposalId: string;
  title: string;
  summary: string;
  votingDeadline: string;
  userVoted: boolean;
  status: 'active' | 'passed' | 'rejected' | 'pending';
};

export type ActiveProject = {
  id: string;
  name: string;
  summary: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  progress: number;
  highlightUrl?: string;
};

export type CommunityFeedPost = {
  id: string;
  author: {
    name: string;
    avatarUrl?: string;
    role: string;
    badge?: string;
  };
  content: string;
  mediaUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  publishedAt: string;
  isPinned?: boolean;
};

export type PriorityAlert = {
  id: string;
  type: 'urgente' | 'importante';
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  actionHandler?: () => void;
  isDismissible?: boolean;
};

export type PendingAction = {
  id: string;
  title: string;
  description: string;
  actionText: string;
  actionUrl: string;
  priority: 'high' | 'medium' | 'low';
};

export type CommunityEvent = {
  id: string;
  title: string;
  date: string;
  category: string;
};

export type WeeklyRecognition = {
  id: string;
  title: string;
  category: string;
  avatarUrl?: string;
};

export type CommunityOpportunity = {
  id: string;
  title: string;
  description: string;
  type: 'edital' | 'parceria';
};

