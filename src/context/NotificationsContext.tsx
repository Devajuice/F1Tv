import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useSession } from './SessionContext';
import { getSessionMeta } from '../data/sessions';
import { formatShortDate, formatTimeZoned } from '../lib/format';

export type NotificationState =
  | 'unsupported'
  | 'default'
  | 'granted'
  | 'denied';

interface NotificationsContextValue {
  state: NotificationState;
  /** True when the user has opted in (permission granted). */
  enabled: boolean;
  /** Ask for permission and start notifying. */
  enable: () => Promise<'granted' | 'denied' | 'default'>;
  /** Stop notifying. */
  disable: () => void;
  /** Test notification, to prove it works. */
  test: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

const OPT_IN_KEY = 'f1tv:notifications';
const SENT_KEY = 'f1tv:notified';
/** Fire the "starting soon" alert this many minutes before lights out. */
const SOON_MINUTES = 5;

function readSent(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SENT_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { current, live } = useSession();
  const [state, setState] = useState<NotificationState>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  // Fired keys live in localStorage, not a ref: the old implementation used an
  // in-memory Set, so every page reload re-notified the same session.
  const sentRef = useRef<Set<string> | null>(null);
  if (sentRef.current === null) sentRef.current = readSent();

  const markSent = useCallback((key: string) => {
    sentRef.current?.add(key);
    try {
      localStorage.setItem(SENT_KEY, JSON.stringify([...sentRef.current!]));
    } catch {
      /* storage full — in-memory set still dedupes for this page */
    }
  }, []);

  const enable = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied' as const;
    const result = await Notification.requestPermission();
    setState(result);
    try {
      if (result === 'granted') localStorage.setItem(OPT_IN_KEY, '1');
      else localStorage.removeItem(OPT_IN_KEY);
    } catch {
      /* ignore */
    }
    return result;
  }, []);

  const disable = useCallback(() => {
    try {
      localStorage.removeItem(OPT_IN_KEY);
    } catch {
      /* ignore */
    }
    setState('default');
  }, []);

  const test = useCallback(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    new Notification('F1TV notifications are on', {
      body: 'You will get an alert before each session and when it goes live.',
      icon: '/favicon.svg',
      tag: 'f1tv-test',
    });
  }, []);

  // Opted in? Derive from the granted permission, not the stored flag, so a
  // user who revoked permission in browser settings is told the truth.
  const enabled = state === 'granted';

  useEffect(() => {
    if (!enabled || !current) return;

    const start = new Date(current.date_start).getTime();
    if (Number.isNaN(start)) return;

    const meta = getSessionMeta(current.session_name, current.session_type);
    const where = [current.location, current.country_name].filter(Boolean).join(', ');

    // --- Session is live right now.
    if (live && live.session_key === current.session_key) {
      const key = `live-${live.session_key}`;
      if (!sentRef.current!.has(key)) {
        markSent(key);
        new Notification(`${meta.label} is LIVE`, {
          body: `${where} — started ${formatTimeZoned(live.date_start)}`,
          icon: '/favicon.svg',
          tag: key,
        });
      }
      return;
    }

    // --- Starting within the alert window.
    const minutesAway = (start - Date.now()) / 60_000;
    if (minutesAway <= SOON_MINUTES && minutesAway > -5) {
      const key = `soon-${current.session_key}-${current.date_start}`;
      if (!sentRef.current!.has(key)) {
        markSent(key);
        new Notification(`${meta.label} starting soon`, {
          body: `${where} — ${formatShortDate(current.date_start)} at ${formatTimeZoned(current.date_start)}`,
          icon: '/favicon.svg',
          tag: key,
        });
      }
    }
  }, [enabled, current, live, markSent]);

  // Clear the dedupe list once a whole weekend is behind us so it can't grow
  // without bound over a season.
  useEffect(() => {
    const sent = sentRef.current!;
    if (sent.size < 80) return;
    const trimmed = new Set([...sent].slice(-40));
    sentRef.current = trimmed;
    try {
      localStorage.setItem(SENT_KEY, JSON.stringify([...trimmed]));
    } catch {
      /* ignore */
    }
  }, [current]);

  const value = useMemo<NotificationsContextValue>(
    () => ({ state, enabled, enable, disable, test }),
    [state, enabled, enable, disable, test],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside <NotificationsProvider>');
  }
  return ctx;
}
