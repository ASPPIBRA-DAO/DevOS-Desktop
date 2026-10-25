import { useLocation } from 'react-router';

// ----------------------------------------------------------------------

export function usePathname(): string {
  const { pathname } = useLocation();
  return pathname;
}
