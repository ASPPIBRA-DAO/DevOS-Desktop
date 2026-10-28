import { useLocation, useNavigate, useSearchParams as useSearchParamsRR } from 'react-router';

// ----------------------------------------------------------------------

export function usePathname(): string {
  const { pathname } = useLocation();
  return pathname;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
  };
}

export function useSearchParams(): URLSearchParams {
  const [searchParams] = useSearchParamsRR();
  return searchParams;
}
