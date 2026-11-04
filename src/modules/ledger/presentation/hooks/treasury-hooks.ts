import type {
  ICitizenSummary,
  IFinancialProfile,
  ITreasuryAnalytics,
} from '../../domain/ledger-models';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

export function useGetTreasuryAnalytics(year?: string) {
  const url = year
    ? `${endpoints.platform.treasury.analytics}?year=${year}`
    : endpoints.platform.treasury.analytics;

  const { data, error, isLoading, isValidating } = useSWR<{ success?: boolean; data: ITreasuryAnalytics }>(
    url,
    fetcher
  );

  const memoizedValue = useMemo(
    () => ({
      analytics: data?.data || null,
      analyticsLoading: isLoading,
      analyticsError: error,
      analyticsValidating: isValidating,
      analyticsEmpty: !isLoading && !data?.data,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetCitizenLedger(citizenId: string | number | null) {
  const url = citizenId ? `${endpoints.platform.treasury.root}/citizen/${citizenId}/ledger` : '';

  const { data, error, isLoading, isValidating } = useSWR<{ success?: boolean; data: IFinancialProfile }>(
    url || null,
    fetcher
  );

  const profile = data?.data || null;

  const memoizedValue = useMemo(
    () => ({
      profile,
      profileLoading: isLoading,
      profileError: error,
      profileValidating: isValidating,
      profileEmpty: !isLoading && !profile,
    }),
    [profile, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetCitizens() {
  const url = endpoints.platform.identity.citizens;

  const { data, error, isLoading, isValidating } = useSWR<{ success?: boolean; data: ICitizenSummary[] }>(
    url,
    fetcher
  );

  const citizens = useMemo(() => data?.data || [], [data?.data]);

  const memoizedValue = useMemo(
    () => ({
      citizens,
      citizensLoading: isLoading,
      citizensError: error,
      citizensValidating: isValidating,
      citizensEmpty: !isLoading && !citizens.length,
    }),
    [citizens, error, isLoading, isValidating]
  );

  return memoizedValue;
}
