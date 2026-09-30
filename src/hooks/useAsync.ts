import { useCallback, useEffect, useRef, useState } from 'react';
import type { DependencyList } from 'react';

export interface AsyncResult<T> {
  data: T | undefined;
  error: Error | null;
  /** True only for the very first load, so skeletons don't flash on refresh. */
  loading: boolean;
  /** True for every subsequent (polled / manual) load. */
  refreshing: boolean;
  /** Timestamp of the last successful load, for "updated x ago" labels. */
  lastFetchedAt: number;
  refresh: () => void;
}

interface UseAsyncOptions {
  /** Poll interval in ms. Omit or 0 to fetch once on mount. */
  intervalMs?: number;
  /** When false, nothing is fetched. */
  enabled?: boolean;
  /** Suspend polling while the tab is hidden. Default true. */
  pauseWhenHidden?: boolean;
}

/**
 * Fetch-on-mount with optional polling, race-free results and no
 * setState-after-unmount.
 *
 * This replaces the `useState` + `useEffect` + `setInterval` + `cancelled`
 * flag block that was copy-pasted into ten pages. Stale responses from
 * superseded requests are discarded via a monotonic run id.
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
  { intervalMs = 0, enabled = true, pauseWhenHidden = true }: UseAsyncOptions = {},
): AsyncResult<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState(0);
  const [nonce, setNonce] = useState(0);

  // Always read the latest closure without making it a dependency, so callers
  // can pass an inline arrow function without re-triggering every render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const runIdRef = useRef(0);
  const loadedRef = useRef(false);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const runId = ++runIdRef.current;

    const run = async (isPoll: boolean) => {
      if (isPoll) setRefreshing(true);
      try {
        const result = await fetcherRef.current();
        if (cancelled || runId !== runIdRef.current) return;
        setData(result);
        setError(null);
        setLastFetchedAt(Date.now());
        loadedRef.current = true;
      } catch (err) {
        if (cancelled || runId !== runIdRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled && runId === runIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void run(false);

    if (intervalMs <= 0) return () => { cancelled = true; };

    let timer: ReturnType<typeof setInterval> | undefined;

    const startTimer = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => void run(true), intervalMs);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (timer) clearInterval(timer);
        timer = undefined;
      } else {
        // Catch up immediately on tab focus, then resume the cadence.
        void run(true);
        startTimer();
      }
    };

    if (pauseWhenHidden) {
      if (!document.hidden) startTimer();
      document.addEventListener('visibilitychange', onVisibility);
    } else {
      startTimer();
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled, intervalMs, pauseWhenHidden]);

  return { data, error, loading: loading && !loadedRef.current, refreshing, lastFetchedAt, refresh };
}

/**
 * A `Date.now()` that ticks on an interval. Cheaper than the 1s interval the
 * countdown used to run unconditionally, and it stops entirely when the tab
 * is hidden.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      stop();
      timer = setInterval(() => setNow(Date.now()), intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    // Re-sync when returning so the countdown never shows a stale value.
    const onFocus = () => !document.hidden && setNow(Date.now());
    window.addEventListener('focus', onFocus);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [intervalMs]);

  return now;
}
