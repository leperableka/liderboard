import { useState, useCallback, useRef } from 'react';
import type { LeaderboardResponse, LeaderboardCategory, LeaderboardEntry } from '../types';
import { getLeaderboard } from '../api/client';

const PAGE_LIMIT = 50;

interface UseLeaderboardReturn {
  data: LeaderboardResponse | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  category: LeaderboardCategory;
  setCategory: (c: LeaderboardCategory) => void;
  refresh: () => void;
  loadMore: () => void;
}

export function useLeaderboard(telegramId?: number): UseLeaderboardReturn {
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null);
  const [category, setCategoryState] = useState<LeaderboardCategory>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const hasMore = dataLoaded && allEntries.length < totalParticipants;

  const fetchPage = useCallback(async (
    cat: LeaderboardCategory,
    pageNum: number,
    append: boolean,
  ) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await getLeaderboard(cat, telegramId, controller.signal, pageNum, PAGE_LIMIT);

      if (append) {
        setAllEntries((prev) => {
          const existingIds = new Set(prev.map((e) => e.telegramId));
          const newEntries = result.entries.filter((e) => !existingIds.has(e.telegramId));
          return [...prev, ...newEntries];
        });
      } else {
        setAllEntries(result.entries);
        setDataLoaded(true);
      }

      setTotalParticipants(result.totalParticipants);
      setCurrentUser(result.currentUser);
      setPage(pageNum);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        if (!append) setError(err.message || 'Ошибка загрузки');
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [telegramId]);

  const setCategory = useCallback((c: LeaderboardCategory) => {
    setCategoryState(c);
    setAllEntries([]);
    setTotalParticipants(0);
    setDataLoaded(false);
    void fetchPage(c, 1, false);
  }, [fetchPage]);

  const refresh = useCallback(() => {
    setAllEntries([]);
    setTotalParticipants(0);
    setDataLoaded(false);
    void fetchPage(category, 1, false);
  }, [fetchPage, category]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    void fetchPage(category, page + 1, true);
  }, [fetchPage, category, page, loadingMore, hasMore]);

  const data: LeaderboardResponse | null = dataLoaded
    ? { category, totalParticipants, entries: allEntries, currentUser, page, limit: PAGE_LIMIT }
    : null;

  return { data, loading, loadingMore, error, hasMore, category, setCategory, refresh, loadMore };
}
