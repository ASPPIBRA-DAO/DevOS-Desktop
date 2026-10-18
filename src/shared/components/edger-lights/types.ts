import type { Theme, SxProps } from '@mui/material/styles';

// ----------------------------------------------------------------------

export type EdgerVariant = 'rose' | 'amber' | 'emerald' | 'sky' | 'purple' | 'slate';

export type EdgerCardEdge = 'lateral' | 'bottom';

export type EdgerColorToken = {
  bg: string;
  bgDark: string;
  glassBg?: string;
  glassBgDark?: string;
  border: string;
  borderDark: string;
  accent: string;
  accentHover: string;
  text: string;
  textDark: string;
  subtext: string;
  subtextDark: string;
  badgeBg: string;
  badgeBgDark: string;
  shadow: string;
};

export type EdgerSquircleBadgeProps = {
  icon: string | React.ReactNode;
  variant?: EdgerVariant;
  size?: number;
  pulse?: boolean;
  sx?: SxProps<Theme>;
};

export type EdgerButtonProps = {
  children: React.ReactNode;
  variant?: EdgerVariant;
  size?: 'small' | 'medium' | 'large';
  icon?: string | React.ReactNode;
  iconPosition?: 'start' | 'end';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
};

export type EdgerInlineNotificationProps = {
  title: string;
  description: React.ReactNode;
  variant?: EdgerVariant;
  edgeStyle?: EdgerCardEdge;
  timestamp?: string;
  icon?: string | React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  onClose?: () => void;
  unread?: boolean;
  pulse?: boolean;
  elevation3D?: boolean;
  sx?: SxProps<Theme>;
};

export type EdgerCardProps = {
  title: string;
  description: React.ReactNode;
  variant?: EdgerVariant;
  edgeStyle?: EdgerCardEdge;
  timestamp?: string;
  icon?: string | React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  onClose?: () => void;
  unread?: boolean;
  pulse?: boolean;
  glass?: boolean;
  elevation3D?: boolean;
  sx?: SxProps<Theme>;
};
