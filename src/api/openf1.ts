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
}

const OPENF1_BASE = '/api/openf1';

// --- Caching ---
interface CacheEntry<T> { data: T; time: number; }
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 600_000; // 10 minutes
const WEATHER_CACHE_TTL = 300_000; // 5 minutes

function getCached<T>(key: string, ttl = CACHE_TTL): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < ttl) return entry.data as T;
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, time: Date.now() });
}

// --- Fetch with retry on 429 ---
async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url);
    if (res.status === 429 && i < retries) {
      const wait = Math.pow(2, i + 1) * 1000; // 2s, 4s
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    return res;
  }
  return fetch(url); // final attempt
}

// --- Sessions ---
let _sessionsPromise: Promise<F1Session[]> | null = null;

export async function getSessions(year?: number): Promise<F1Session[]> {
  const y = year ?? new Date().getFullYear();
  const key = `sessions-${y}`;
  const cached = getCached<F1Session[]>(key);
  if (cached) return cached;

  // Deduplicate concurrent calls
  if (_sessionsPromise) return _sessionsPromise;

  _sessionsPromise = (async () => {
    try {
      const res = await fetchWithRetry(`${OPENF1_BASE}/sessions?year=${y}`);
      if (!res.ok) throw new Error(`Sessions fetch failed: ${res.status}`);
      const data: F1Session[] = await res.json();
      setCache(key, data);
      return data;
    } finally {
      _sessionsPromise = null;
    }
  })();

  return _sessionsPromise;
}

export function getUpcomingSessions(sessions: F1Session[]): F1Session[] {
  const now = new Date();
  return sessions.filter((s) => new Date(s.date_end) >= now && !s.is_cancelled);
}

export function getNextRaceSession(sessions: F1Session[]): F1Session | null {
  const upcoming = getUpcomingSessions(sessions);
  const races = upcoming.filter((s) => s.session_name === 'Race' || s.session_name === 'Sprint');
  return races.length > 0 ? races[0] : (upcoming.length > 0 ? upcoming[0] : null);
}

export function getCurrentOrNextSession(sessions: F1Session[]): F1Session | null {
  const now = new Date();
  for (const s of sessions) {
    if (s.is_cancelled) continue;
    const start = new Date(s.date_start);
    const end = new Date(s.date_end);
    if (now >= start && now <= end) return s;
  }
  for (const s of sessions) {
    if (s.is_cancelled) continue;
    const start = new Date(s.date_start);
    if (start > now) return s;
  }
  return null;
}

export function getSessionProgress(sessions: F1Session[]): { current: F1Session; upcoming: F1Session[]; finished: F1Session[] } | null {
  const now = new Date();
  const all = sessions.filter((s) => !s.is_cancelled);
  const active: F1Session[] = [];
  const upcoming: F1Session[] = [];
  const finished: F1Session[] = [];
  for (const s of all) {
    const start = new Date(s.date_start);
    const end = new Date(s.date_end);
    if (now >= start && now <= end) active.push(s);
    else if (start > now) upcoming.push(s);
    else finished.push(s);
  }
  const current = active[0] ?? upcoming[0] ?? null;
  if (!current) return null;
  const remaining = [...upcoming, ...active.slice(1)];
  return { current, upcoming: remaining, finished };
}

// --- Weather ---
async function fetchWeatherForSession(sessionKey: number): Promise<F1Weather | null> {
  const key = `weather-${sessionKey}`;
  const cached = getCached<F1Weather | null>(key, WEATHER_CACHE_TTL);
  if (cached !== null) return cached;

  const res = await fetchWithRetry(`${OPENF1_BASE}/weather?session_key=${sessionKey}`);
  if (!res.ok) { setCache(key, null); return null; }
  const data = await res.json();
  if (!data || data.length === 0) { setCache(key, null); return null; }
  const latest = data[data.length - 1];
  const weather: F1Weather = {
    air_temperature: latest.air_temperature,
    track_temperature: latest.track_temperature,
    humidity: latest.humidity,
    wind_speed: latest.wind_speed,
    rainfall: latest.rainfall,
  };
  setCache(key, weather);
  return weather;
}

export async function getLatestWeather(): Promise<F1Weather | null> {
  const key = 'weather-latest';
  const cached = getCached<F1Weather | null>(key, WEATHER_CACHE_TTL);
  if (cached !== null) return cached;

  const res = await fetchWithRetry(`${OPENF1_BASE}/weather?session_key=latest`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.length === 0) { setCache(key, null); return null; }
  const latest = data[data.length - 1];
  const weather: F1Weather = {
    air_temperature: latest.air_temperature,
    track_temperature: latest.track_temperature,
    humidity: latest.humidity,
    wind_speed: latest.wind_speed,
    rainfall: latest.rainfall,
  };
  setCache(key, weather);
  return weather;
}

export async function getWeatherForSession(sessionKey: number): Promise<F1Weather | null> {
  return fetchWeatherForSession(sessionKey);
}

// --- Helpers ---
export function getSessionStatus(session: F1Session): 'live' | 'finished' | 'upcoming' {
  const now = new Date();
  const start = new Date(session.date_start);
  const end = new Date(session.date_end);
  if (now >= start && now <= end) return 'live';
  if (now > end) return 'finished';
  return 'upcoming';
}

export function getSessionLabel(_type: string, name: string): string {
  if (name === 'Practice 1') return 'P1';
  if (name === 'Practice 2') return 'P2';
  if (name === 'Practice 3') return 'P3';
  if (name === 'Sprint Qualifying') return 'SQ';
  if (name === 'Sprint') return 'SPRINT';
  if (name === 'Qualifying') return 'QUALI';
  if (name === 'Race') return 'RACE';
  if (name.startsWith('Day')) return name;
  return _type;
}

export function getTrackImageUrl(circuitShortName: string): string {
  const nameMap: Record<string, string> = {
    'Sakhir': 'Bahrain', 'Melbourne': 'Australia', 'Shanghai': 'China',
    'Suzuka': 'Japan', 'Miami Gardens': 'Miami', 'Imola': 'Emilia%20Romagna',
    'Monte Carlo': 'Monaco', 'Catalunya': 'Spain', 'Montreal': 'Canada',
    'Spielberg': 'Austria', 'Silverstone': 'Great%20Britain',
    'Spa-Francorchamps': 'Belgium', 'Hungaroring': 'Hungary',
    'Zandvoort': 'Netherlands', 'Monza': 'Italy', 'Baku': 'Azerbaijan',
    'Marina%20Bay': 'Singapore', 'Singapore': 'Singapore', 'Austin': 'USA',
    'Mexico City': 'Mexico', 'Interlagos': 'Brazil', 'Las%20Vegas': 'Las%20Vegas',
    'Lusail': 'Qatar', 'Yas Marina Circuit': 'Abu%20Dhabi', 'Yas Island': 'Abu%20Dhabi',
  };
  const mapped = nameMap[circuitShortName] ?? circuitShortName;
  return `https://media.formula1.com/image/upload/f_auto/q_auto/v16772449xx/Digital%20assets%20-%202023/${mapped}%20carbon.png`;
}
