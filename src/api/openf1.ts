export interface F1Session {
  session_key: number;
  session_type: string;
  session_name: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  circuit_key: number;
  circuit_short_name: string;
  country_key: number;
  country_code: string;
  country_name: string;
  location: string;
  gmt_offset: string;
  year: number;
  is_cancelled: boolean;
}

export interface F1Weather {
  air_temperature: number | null;
  track_temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
  rainfall: number | null;
  /** When the reading was taken, so the UI can show staleness. */
  measured_at: string | null;
}

const OPENF1_BASE = '/api/openf1';

/* -------------------------------------------------------------------------
   Two-tier cache: in-memory for the session, localStorage to survive reloads.
   ------------------------------------------------------------------------- */

interface CacheEntry<T> {
  data: T;
  time: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const MEMORY_TTL = 10 * 60 * 1000;
const LS_PREFIX = 'f1tv-';
const LS_TTL = 24 * 60 * 60 * 1000;

function readMemory<T>(key: string, ttl = MEMORY_TTL): T | undefined {
  const entry = memoryCache.get(key);
  if (entry && Date.now() - entry.time < ttl) return entry.data as T;
  return undefined;
}

function writeMemory<T>(key: string, data: T): void {
  memoryCache.set(key, { data, time: Date.now() });
}

function readLocal<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.time > LS_TTL) {
      localStorage.removeItem(LS_PREFIX + key);
      return undefined;
    }
    return entry.data;
  } catch {
    return undefined;
  }
}

function writeLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ data, time: Date.now() }));
  } catch {
    /* Quota exceeded or private mode — memory cache still applies. */
  }
}

/* -------------------------------------------------------------------------
   Fetch helpers
   ------------------------------------------------------------------------- */

/** Retries on 429 (OpenF1 rate limits) with exponential backoff. */
async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 2 ** (attempt + 1) * 1000));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 2 ** (attempt + 1) * 500));
    }
  }
  throw lastError;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${url}`);
  return (await res.json()) as T;
}

/* -------------------------------------------------------------------------
   Sessions
   ------------------------------------------------------------------------- */

/** In-flight requests, keyed by cache key so different years never cross. */
const inFlight = new Map<string, Promise<F1Session[]>>();

async function fetchSessions(year: number): Promise<F1Session[]> {
  const key = `sessions-${year}`;
  const cached = readMemory<F1Session[]>(key);
  if (cached) return cached;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = (async () => {
    try {
      const res = await fetchWithRetry(`${OPENF1_BASE}/sessions?year=${year}`);
      if (!res.ok) {
        // Degrade to whatever we have, then to a synthesised weekend.
        const local = readLocal<F1Session[]>(key);
        if (local?.length) return local;
        return await synthesiseSessions(year);
      }
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        const local = readLocal<F1Session[]>(key);
        if (local?.length) return local;
        return await synthesiseSessions(year);
      }
      const sessions = data as F1Session[];
      writeMemory(key, sessions);
      writeLocal(key, sessions);
      return sessions;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, request);
  return request;
}

/** Live session schedule for a year, with fallbacks. */
export function getSessions(year?: number): Promise<F1Session[]> {
  return fetchSessions(year ?? new Date().getFullYear());
}

export function getUpcomingSessions(
  sessions: F1Session[],
  now = Date.now(),
): F1Session[] {
  return sessions.filter(
    (s) => !s.is_cancelled && new Date(s.date_end).getTime() >= now,
  );
}

/** The next Race or Sprint session — the one people actually care about. */
export function getNextRaceSession(
  sessions: F1Session[],
  now = Date.now(),
): F1Session | null {
  const upcoming = getUpcomingSessions(sessions, now);
  const race = upcoming.find(
    (s) => s.session_name === 'Race' || s.session_name === 'Sprint',
  );
  return race ?? upcoming[0] ?? null;
}

export interface SessionProgress {
  /** Live session if any, otherwise the next one. */
  current: F1Session | null;
  active: F1Session[];
  upcoming: F1Session[];
  finished: F1Session[];
}

export function getSessionProgress(
  sessions: F1Session[],
  now = Date.now(),
): SessionProgress {
  const active: F1Session[] = [];
  const upcoming: F1Session[] = [];
  const finished: F1Session[] = [];

  for (const s of sessions) {
    if (s.is_cancelled) continue;
    const start = new Date(s.date_start).getTime();
    const end = new Date(s.date_end).getTime();
    if (now >= start && now <= end) active.push(s);
    else if (start > now) upcoming.push(s);
    else finished.push(s);
  }

  active.sort((a, b) => a.date_start.localeCompare(b.date_start));
  upcoming.sort((a, b) => a.date_start.localeCompare(b.date_start));

  return {
    current: active[0] ?? upcoming[0] ?? null,
    active,
    upcoming,
    finished,
  };
}

export function getSessionStatus(
  session: F1Session,
  now = Date.now(),
): 'live' | 'finished' | 'upcoming' {
  const start = new Date(session.date_start).getTime();
  const end = new Date(session.date_end).getTime();
  if (now >= start && now <= end) return 'live';
  if (now > end) return 'finished';
  return 'upcoming';
}

/* -------------------------------------------------------------------------
   Weather
   ------------------------------------------------------------------------- */

const WEATHER_TTL = 5 * 60 * 1000;

function toWeather(latest: Record<string, unknown>): F1Weather {
  const num = (v: unknown) => (typeof v === 'number' ? v : null);
  return {
    air_temperature: num(latest.air_temperature),
    track_temperature: num(latest.track_temperature),
    humidity: num(latest.humidity),
    wind_speed: num(latest.wind_speed),
    rainfall: num(latest.rainfall),
    measured_at:
      typeof latest.date === 'string' ? latest.date : null,
  };
}

async function loadWeather(
  key: string,
  url: string,
): Promise<F1Weather | null> {
  const cached = readMemory<F1Weather | null>(key, WEATHER_TTL);
  if (cached !== undefined) return cached;

  const local = readLocal<F1Weather | null>(key);
  if (local !== undefined) return local;

  try {
    const data = await getJson<Array<Record<string, unknown>>>(url);
    if (!Array.isArray(data) || data.length === 0) {
      writeMemory(key, null);
      return null;
    }
    const weather = toWeather(data[data.length - 1]);
    writeMemory(key, weather);
    writeLocal(key, weather);
    return weather;
  } catch {
    writeMemory(key, null);
    return null;
  }
}

/** Latest available reading from the most recent session with data. */
export function getLatestWeather(): Promise<F1Weather | null> {
  return loadWeather('weather-latest', `${OPENF1_BASE}/weather?session_key=latest`);
}

/** Readings for a specific session key. */
export function getWeatherForSession(
  sessionKey: number,
): Promise<F1Weather | null> {
  return loadWeather(`weather-${sessionKey}`, `${OPENF1_BASE}/weather?session_key=${sessionKey}`);
}

/** Wet if measurable rain fell in the last hour, or it is raining now. */
export function isTrackWet(weather: F1Weather | null): boolean | null {
  if (!weather || weather.rainfall === null) return null;
  return weather.rainfall > 0;
}

/* -------------------------------------------------------------------------
   Fallback schedule
   When OpenF1 is unreachable (it needs no key now, but it does rate limit and
   occasionally 401s), we synthesise a plausible weekend from the Jolpica
   race times so the countdown and schedule pages still work.
   ------------------------------------------------------------------------- */

interface SynthRace {
  round: string;
  date: string;
  time?: string;
  country: string;
  locality: string;
}

function at(date: Date, hours: number, minutes = 0): string {
  const d = new Date(date);
  d.setUTCHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function plusHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}

function buildWeekend(race: SynthRace, year: number): F1Session[] {
  const raceDate = new Date(`${race.date}T12:00:00Z`);
  // Race day is normally Sunday; walk back to the preceding Friday.
  const raceDay = raceDate.getUTCDay();
  const friday = new Date(raceDate);
  friday.setUTCDate(raceDate.getUTCDate() - ((raceDay + 7 - 5) % 7 || 7));
  const saturday = new Date(friday);
  saturday.setUTCDate(friday.getUTCDate() + 1);

  const round = Number.parseInt(race.round, 10) || 0;
  const base = {
    country_key: 0,
    country_code: '',
    country_name: race.country,
    circuit_short_name: race.locality,
    location: race.locality,
    gmt_offset: '+00:00',
    year,
    is_cancelled: false,
    meeting_key: round,
    circuit_key: round,
  };

  const make = (
    n: number,
    name: string,
    type: string,
    start: string,
    hours: number,
  ): F1Session => ({
    ...base,
    session_key: round * 100 + n,
    session_name: name,
    session_type: type,
    date_start: start,
    date_end: plusHours(start, hours),
  });

  const raceTime = race.time?.replace(/Z$/i, '') ?? '14:00:00';
  const [rh, rm] = raceTime.split(':').map(Number);
  const raceStart = at(raceDate, Number.isFinite(rh) ? rh : 14, Number.isFinite(rm) ? rm : 0);

  return [
    make(1, 'Practice 1', 'Practice', at(friday, 10, 30), 1),
    make(2, 'Practice 2', 'Practice', at(friday, 14, 0), 1),
    make(3, 'Practice 3', 'Practice', at(saturday, 10, 30), 1),
    make(4, 'Qualifying', 'Qualifying', at(saturday, 14, 0), 1),
    make(5, 'Race', 'Race', raceStart, 2),
  ];
}

async function synthesiseSessions(year: number): Promise<F1Session[]> {
  const key = `fallback-sessions-${year}`;
  const cached = readMemory<F1Session[]>(key);
  if (cached) return cached;

  try {
    const data = await getJson<{
      MRData?: {
        RaceTable?: {
          Races?: Array<{
            date: string;
            time?: string;
            round: string;
            Circuit: { Location: { country: string; locality: string } };
          }>;
        };
      };
    }>(`/api/jolpica/${year}.json`);

    const races = data.MRData?.RaceTable?.Races ?? [];
    const sessions = races.flatMap((race) =>
      buildWeekend(
        {
          round: race.round,
          date: race.date,
          time: race.time,
          country: race.Circuit.Location.country,
          locality: race.Circuit.Location.locality,
        },
        year,
      ),
    );

    if (sessions.length) {
      writeMemory(key, sessions);
      writeLocal(key, sessions);
    }
    return sessions;
  } catch {
    return [];
  }
}

export { synthesiseSessions as getFallbackSessions };
