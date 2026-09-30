import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  getSessionProgress,
  getSessions,
  getNextRaceSession,
  type F1Session,
} from '../api/openf1';
import { useAsync, useNow } from '../hooks/useAsync';

export interface SessionContextValue {
  sessions: F1Session[];
  loading: boolean;
  error: Error | null;
  /** Currently-running session, if any. */
  live: F1Session | null;
  /** Live session, or failing that the next one to start. */
  current: F1Session | null;
  next: F1Session | null;
  /** Next Race or Sprint specifically. */
  nextRace: F1Session | null;
  active: F1Session[];
  upcoming: F1Session[];
  finished: F1Session[];
  lastUpdated: number;
  refresh: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** How often we re-check for a session transition. */
const POLL_MS = 60_000;
/** Re-derive liveness on a slower tick so "LIVE" flips promptly. */
const TICK_MS = 15_000;

export function SessionProvider({ children }: { children: ReactNode }) {
  const now = useNow(TICK_MS);
  const { data, loading, error, refresh } = useAsync(() => getSessions(), [], {
    intervalMs: POLL_MS,
  });

  const value = useMemo<SessionContextValue>(() => {
    const sessions = data ?? [];
    const progress = getSessionProgress(sessions, now);
    return {
      sessions,
      loading,
      error: error ?? null,
      live: progress.active[0] ?? null,
      current: progress.current,
      next: progress.upcoming[0] ?? null,
      nextRace: getNextRaceSession(sessions, now),
      active: progress.active,
      upcoming: progress.upcoming,
      finished: progress.finished,
      lastUpdated: now,
      refresh,
    };
  }, [data, loading, error, now, refresh]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside <SessionProvider>');
  }
  return ctx;
}

/** "14:00 - 15:00" for a session, in local time. */
export function sessionTimeRange(session: F1Session): string {
  const fmt = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const start = new Date(session.date_start);
  const end = new Date(session.date_end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}
