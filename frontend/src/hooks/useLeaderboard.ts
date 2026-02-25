import { useState, useCallback, useRef } from 'react';
import type { LeaderboardResponse, Period } from '../types';
import { getLeaderboard } from '../api/client';

interface UseLeaderboardReturn {
  data: LeaderboardResponse | null;
  loading: boolean;
  error: string | null;
  period: Period;
  setPeriod: (p: Period) => void;
  refresh: () => void;
}

export function useLeaderboard(telegramId?: number): UseLeaderboardReturn {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriodState] = useState<Period>('week');
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (p: Period) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const result = await getLeaderboard(p, telegramId);
      setData(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Ошибка загрузки');
      }
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  const setPeriod = useCallback(
    (p: Period) => {
      setPeriodState(p);
      void fetchData(p);
    },
    [fetchData]
  );

  const refresh = useCallback(() => {
    void fetchData(period);
  }, [fetchData, period]);

  return { data, loading, error, period, setPeriod, refresh };
}
