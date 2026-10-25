import type { AvatarProps } from '@mui/material/Avatar';

import Avatar from '@mui/material/Avatar';

export function IdentityAvatar({ children, ...other }: AvatarProps) {
  return <Avatar {...other}>{children}</Avatar>;
}
