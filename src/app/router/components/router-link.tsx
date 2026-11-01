import type { LinkProps } from 'react-router';

import { forwardRef } from 'react';
import { Link } from 'react-router';

// ----------------------------------------------------------------------

export type RouterLinkProps = Omit<LinkProps, 'to'> & {
  href?: string;
  to?: LinkProps['to'];
};

export const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(
  ({ to, href, ...other }, ref) => <Link ref={ref} to={to ?? href ?? ''} {...other} />
);
