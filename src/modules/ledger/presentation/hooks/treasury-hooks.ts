import type {
  ICitizenSummary,
  IFinancialProfile,
  ITreasuryAnalytics,
} from '../../domain/ledger-models';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

import {
  MOCK_CITIZENS,
  MOCK_FINANCIAL_PROFILES,
} from '../../domain/ledger-canonical-data';

// ----------------------------------------------------------------------

export function useGetTreasuryAnalytics(year?: string) {
  const url = year
    ? `${endpoints.platform.treasury.analytics}?year=${year}`
    : endpoints.platform.treasury.analytics;

  const { data, error, isLoading, isValidating } = useSWR<{ data: ITreasuryAnalytics }>(
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

  const { data, error, isLoading, isValidating } = useSWR<{ success: boolean; data: IFinancialProfile }>(
    url || null,
    fetcher
  );

  const fallbackProfile = useMemo(() => {
    if (!citizenId) return null;
    return (
      MOCK_FINANCIAL_PROFILES.find((p) => String(p.associate.id) === String(citizenId)) ||
      MOCK_FINANCIAL_PROFILES.find((p) =>
        p.associate.name.toLowerCase().includes(String(citizenId).toLowerCase())
      ) ||
      null
    );
  }, [citizenId]);

  const resolvedProfile = data?.data || fallbackProfile;

  const memoizedValue = useMemo(
    () => ({
      profile: resolvedProfile,
      profileLoading: isLoading && !fallbackProfile,
      profileError: error,
      profileValidating: isValidating,
      profileEmpty: !isLoading && !resolvedProfile,
    }),
    [resolvedProfile, fallbackProfile, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetCitizens() {
  const url = endpoints.platform.identity.citizens;

  const { data, error, isLoading, isValidating } = useSWR<{ success: boolean; data: ICitizenSummary[] }>(
    url,
    fetcher
  );

  const citizens = data?.data || MOCK_CITIZENS;

  const memoizedValue = useMemo(
    () => ({
      citizens,
      citizensLoading: isLoading && !citizens.length,
      citizensError: error,
      citizensValidating: isValidating,
    }),
    [citizens, error, isLoading, isValidating]
  );

  return memoizedValue;
}
