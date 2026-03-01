import { useState, useCallback, useRef } from 'react';
import type { LeaderboardResponse, LeaderboardCategory } from '../types';
import { getLeaderboard } from '../api/client';

interface UseLeaderboardReturn {
  data: LeaderboardResponse | null;
  loading: boolean;
  error: string | null;
  category: LeaderboardCategory;
  setCategory: (c: LeaderboardCategory) => void;
  refresh: () => void;
}

export function useLeaderboard(telegramId?: number): UseLeaderboardReturn {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategoryState] = useState<LeaderboardCategory>('all');
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (c: LeaderboardCategory) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const result = await getLeaderboard(c, telegramId);
      setData(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Ошибка загрузки');
      }
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  const setCategory = useCallback(
    (c: LeaderboardCategory) => {
      setCategoryState(c);
      void fetchData(c);
    },
    [fetchData]
  );

  const refresh = useCallback(() => {
    void fetchData(category);
  }, [fetchData, category]);

  return { data, loading, error, category, setCategory, refresh };
}
