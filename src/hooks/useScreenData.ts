import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { logError } from '../utils/logger';

interface UseScreenDataOptions {
  reloadOnFocus?: boolean;
  deps?: any[];
}

interface UseScreenDataReturn {
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  reload: () => void;
}

/**
 * Custom hook for screen data loading with automatic focus reload and pull-to-refresh support.
 *
 * @param fetchFunction - Async function that fetches and sets component state
 * @param options.reloadOnFocus - Whether to reload data when screen gains focus (default: true)
 * @param options.deps - Dependencies array to trigger reload (for route params, etc.)
 *
 * @returns loading, refreshing states and onRefresh, reload callbacks
 */
export function useScreenData(
  fetchFunction: () => Promise<void>,
  options: UseScreenDataOptions = {}
): UseScreenDataReturn {
  const { reloadOnFocus = true, deps = [] } = options;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      await fetchFunction();
    } catch (error) {
      logError('Error loading data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchFunction]);

  // Initial load and dependency-based reload
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Reload on screen focus
  useFocusEffect(
    useCallback(() => {
      if (reloadOnFocus) {
        load();
      }
    }, [load, reloadOnFocus])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const reload = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  return { loading, refreshing, onRefresh, reload };
}
