/**
 * Session metadata: the short badge, accent colour and ordering for every
 * session type. Previously this was split between `getSessionLabel()` in
 * openf1.ts and a `getSessionColor()` switch inside PracticeSchedule, and the
 * two disagreed. Single source of truth now.
 */

export interface SessionMeta {
  /** Short badge shown on the tile, e.g. "P1", "QUALI", "RACE". */
  badge: string;
  /** Full human label. */
  label: string;
  /** Tailwind text colour class for the badge. */
  color: string;
  /** Tailwind background/border colour classes for the tile. */
  surface: string;
  /** Position in the weekend running order. */
  order: number;
}

const DEFAULT_META: SessionMeta = {
  badge: 'SESSION',
  label: 'Session',
  color: 'text-mist-300',
  surface: 'bg-veil/5 border-line/10',
  order: 99,
};

const BY_NAME: Record<string, SessionMeta> = {
  'Practice 1': { badge: 'P1', label: 'Practice 1', color: 'text-telemetry', surface: 'bg-telemetry/10 border-telemetry/25', order: 1 },
  'Practice 2': { badge: 'P2', label: 'Practice 2', color: 'text-telemetry', surface: 'bg-telemetry/10 border-telemetry/25', order: 2 },
  'Practice 3': { badge: 'P3', label: 'Practice 3', color: 'text-telemetry', surface: 'bg-telemetry/10 border-telemetry/25', order: 3 },
  'Sprint Qualifying': { badge: 'SQ', label: 'Sprint Qualifying', color: 'text-sodium', surface: 'bg-sodium/10 border-sodium/25', order: 4 },
  'Sprint Shootout': { badge: 'SQ', label: 'Sprint Shootout', color: 'text-sodium', surface: 'bg-sodium/10 border-sodium/25', order: 4 },
  'Sprint': { badge: 'SPRINT', label: 'Sprint', color: 'text-purple-fp', surface: 'bg-purple-fp/10 border-purple-fp/25', order: 5 },
  'Qualifying': { badge: 'QUALI', label: 'Qualifying', color: 'text-f1-red-bright', surface: 'bg-f1-red/12 border-f1-red/30', order: 6 },
  'Race': { badge: 'RACE', label: 'Race', color: 'text-f1-red-bright', surface: 'bg-f1-red/15 border-f1-red/40', order: 7 },
};

// `BY_NAME['Practice 1']` needs bracket access because of the space, but under
// `noUncheckedIndexedAccess` that widens to `SessionMeta | undefined`. A
// non-null assertion is safe here: the key is one line above in the same file,
// and TypeScript cannot see that. A miss degrades to FALLBACK at the lookup
// site either way, so there is no runtime path that throws.
const BY_TYPE: Record<string, SessionMeta> = {
  Practice: BY_NAME['Practice 1']!,
  Qualifying: BY_NAME.Qualifying!,
  Race: BY_NAME.Race!,
  Sprint: BY_NAME.Sprint!,
};

export function getSessionMeta(
  sessionName: string,
  sessionType?: string,
): SessionMeta {
  if (BY_NAME[sessionName]) return BY_NAME[sessionName];
  if (sessionType && BY_TYPE[sessionType]) return BY_TYPE[sessionType];
  if (sessionName.startsWith('Day')) {
    return { ...DEFAULT_META, badge: sessionName, label: sessionName, color: 'text-sodium' };
  }
  return { ...DEFAULT_META, badge: sessionName || DEFAULT_META.badge, label: sessionName || DEFAULT_META.label };
}

/** Badge text only — the common case. */
export function getSessionBadge(sessionName: string, sessionType?: string): string {
  return getSessionMeta(sessionName, sessionType).badge;
}

export function isRaceSession(sessionName: string, sessionType?: string): boolean {
  const meta = getSessionMeta(sessionName, sessionType);
  return meta.badge === 'RACE' || meta.badge === 'SPRINT';
}
