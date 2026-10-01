/**
 * Time-zone preference.
 *
 * The site has always rendered times in the browser's own zone, which is wrong
 * for roughly half the calendar: a viewer in Los Angeles reading "Monaco 15:00"
 * is looking at the session start, not the local start, and has to do the
 * arithmetic themselves. Three modes are offered:
 *
 * - `local`    — the browser zone. The previous behaviour.
 * - `circuit`  — the zone the circuit is physically in. Correct for "when does
 *                the race start at the track", which is how the calendar and
 *                weekend schedule are framed.
 * - `custom`   — an explicit IANA zone, for viewers who want one fixed zone
 *                across every circuit regardless of where it is.
 *
 * Formatting is delegated to `lib/format`, which holds a mutable "display zone"
 * so every existing call site keeps its single-argument signature.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { getCircuitTimeZone } from '../data/tracks';
import { setDisplayTimeZone } from '../lib/format';

export type TimeZoneMode = 'local' | 'circuit' | 'custom';

export const TIME_ZONE_MODE_LABEL: Record<TimeZoneMode, string> = {
  local: 'My device',
  circuit: 'At the circuit',
  custom: 'Fixed zone',
};

export const TIME_ZONE_MODE_HINT: Record<TimeZoneMode, string> = {
  local: "Follows your device's zone automatically.",
  circuit: 'Shows each session in the time zone the circuit sits in.',
  custom: 'Every time on the site uses one zone you choose.',
};

const STORAGE_KEY = 'f1tv:timezone';

interface TimeZoneContextValue {
  mode: TimeZoneMode;
  /** Only meaningful in `custom` mode. */
  customTimeZone: string;
  /** The zone the browser is in. */
  deviceTimeZone: string;
  /**
   * The zone to format in, given the circuit a page is displaying. Falls back
   * to the device zone when the circuit is unknown or the mode does not want it.
   */
  resolve: (circuit?: string | null) => string;
  setMode: (mode: TimeZoneMode) => void;
  setCustomTimeZone: (zone: string) => void;
}

const TimeZoneContext = createContext<TimeZoneContextValue | null>(null);

/** Intl throws on an unrecognised zone; treat that as "no answer". */
export function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

function deviceZone(): string {
  if (typeof Intl === 'undefined') return 'UTC';
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function readMode(): TimeZoneMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'circuit' || raw === 'custom' ? raw : 'local';
  } catch {
    return 'local';
  }
}

function readCustom(): string {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:custom`);
    if (raw && isValidTimeZone(raw)) return raw;
  } catch {
    /* fall through */
  }
  return deviceZone();
}

export function TimeZoneProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<TimeZoneMode>(readMode);
  const [customTimeZone, setCustomTimeZoneState] = useState<string>(readCustom);
  const device = useMemo(deviceZone, []);

  const resolve = useCallback(
    (circuit?: string | null): string => {
      if (mode === 'custom') return customTimeZone;
      if (mode === 'circuit') return getCircuitTimeZone(circuit) ?? device;
      return device;
    },
    [mode, customTimeZone, device],
  );

  /**
   * Publish the zone for pages that have no circuit in hand (the news feed,
   * session notifications). Circuit-aware pages call `resolve` themselves and
   * pass the result down; this is the sensible fallback, not an override.
   */
  useEffect(() => {
    setDisplayTimeZone(mode === 'local' ? null : mode === 'custom' ? customTimeZone : device);
  }, [mode, customTimeZone, device]);

  const setMode = useCallback((next: TimeZoneMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode: still applies for this session */
    }
  }, []);

  const setCustomTimeZone = useCallback((zone: string) => {
    if (!isValidTimeZone(zone)) return;
    setCustomTimeZoneState(zone);
    try {
      localStorage.setItem(`${STORAGE_KEY}:custom`, zone);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<TimeZoneContextValue>(
    () => ({ mode, customTimeZone, deviceTimeZone: device, resolve, setMode, setCustomTimeZone }),
    [mode, customTimeZone, device, resolve, setMode, setCustomTimeZone],
  );

  return <TimeZoneContext.Provider value={value}>{children}</TimeZoneContext.Provider>;
}

export function useTimeZone(): TimeZoneContextValue {
  const ctx = useContext(TimeZoneContext);
  if (!ctx) throw new Error('useTimeZone must be used inside <TimeZoneProvider>');
  return ctx;
}

/**
 * Time zones worth offering, grouped. A full `Intl.supportedValuesOf` list runs
 * to ~400 entries and mostly names cities no F1 viewer is near, so this offers
 * the zones the calendar actually spans plus the viewer's own device zone.
 */
export const COMMON_TIME_ZONES: { label: string; zone: string }[] = [
  { label: 'London', zone: 'Europe/London' },
  { label: 'Central Europe', zone: 'Europe/Berlin' },
  { label: 'Moscow', zone: 'Europe/Moscow' },
  { label: 'Dubai', zone: 'Asia/Dubai' },
  { label: 'India', zone: 'Asia/Kolkata' },
  { label: 'Bangkok', zone: 'Asia/Bangkok' },
  { label: 'Shanghai / Singapore', zone: 'Asia/Singapore' },
  { label: 'Tokyo', zone: 'Asia/Tokyo' },
  { label: 'Sydney', zone: 'Australia/Sydney' },
  { label: 'New York', zone: 'America/New_York' },
  { label: 'Chicago', zone: 'America/Chicago' },
  { label: 'Mexico City', zone: 'America/Mexico_City' },
  { label: 'São Paulo', zone: 'America/Sao_Paulo' },
  { label: 'Los Angeles', zone: 'America/Los_Angeles' },
  { label: 'Vancouver', zone: 'America/Vancouver' },
  { label: 'UTC', zone: 'UTC' },
];