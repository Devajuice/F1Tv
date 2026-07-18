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
const OPENF1_API_KEY = import.meta.env.VITE_OPENF1_API_KEY ?? '';

// --- Caching ---
interface CacheEntry<T> { data: T; time: number; }
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 600_000; // 10 minutes
const WEATHER_CACHE_TTL = 300_000; // 5 minutes
const LS_PREFIX = 'f1tv-';
const LS_TTL = 86_400_000; // 24 hours for localStorage

function getCached<T>(key: string, ttl = CACHE_TTL): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < ttl) return entry.data as T;
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, time: Date.now() });
}

function getLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.time > LS_TTL) {
      localStorage.removeItem(LS_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch { return null; }
}

function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ data, time: Date.now() }));
  } catch { /* quota exceeded, ignore */ }
}

// --- Fetch with retry on 429 ---
let _lastAuthFailure = 0;
const AUTH_BACKOFF = 300_000; // 5 minutes

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  if (!OPENF1_API_KEY && Date.now() - _lastAuthFailure < AUTH_BACKOFF) {
    return new Response(null, { status: 401, statusText: 'Backed off' });
  }
  const headers: Record<string, string> = {};
  if (OPENF1_API_KEY) headers['Authorization'] = `Bearer ${OPENF1_API_KEY}`;
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, { headers });
    if (res.status === 401) _lastAuthFailure = Date.now();
    if (res.status === 429 && i < retries) {
      const wait = Math.pow(2, i + 1) * 1000;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    return res;
  }
  return fetch(url, { headers });
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
      if (!res.ok) {
        if (res.status === 401) {
          const local = getLocal<F1Session[]>(key);
          if (local && local.length > 0) return local;
          return [] as F1Session[];
        }
        const local = getLocal<F1Session[]>(key);
        if (local && local.length > 0) return local;
        throw new Error(`Sessions fetch failed: ${res.status}`);
      }
      const data: F1Session[] = await res.json();
      setCache(key, data);
      if (data.length > 0) setLocal(key, data);
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

  const local = getLocal<F1Weather | null>(key);
  if (local !== null) return local;

  const res = await fetchWithRetry(`${OPENF1_BASE}/weather?session_key=${sessionKey}`);
  if (!res.ok) {
    setCache(key, null);
    return null;
  }
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
  setLocal(key, weather);
  return weather;
}

export async function getLatestWeather(): Promise<F1Weather | null> {
  const key = 'weather-latest';
  const cached = getCached<F1Weather | null>(key, WEATHER_CACHE_TTL);
  if (cached !== null) return cached;

  const local = getLocal<F1Weather | null>(key);
  if (local !== null) return local;

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
  setLocal(key, weather);
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

function generateWeekendSessions(race: {
  round: string;
  date: string;
  time?: string;
  circuitName: string;
  country: string;
  locality: string;
}, year: number): F1Session[] {
  const raceDate = new Date(race.date);
  const raceDay = raceDate.getUTCDay();
  const friday = new Date(raceDate);
  friday.setUTCDate(raceDate.getUTCDate() - ((raceDay + 7 - 5) % 7 || 7));
  const saturday = new Date(friday);
  saturday.setUTCDate(friday.getUTCDate() + 1);

  const round = parseInt(race.round);
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

  const fmt = (d: Date, h: number, m = 0) => {
    const dt = new Date(d);
    dt.setUTCHours(h, m, 0, 0);
    return dt.toISOString();
  };
  const end = (iso: string, hrs: number) => new Date(new Date(iso).getTime() + hrs * 3600000).toISOString();

  const sessions: F1Session[] = [];

  // Practice 1 - Friday 10:30 UTC
  const p1Start = fmt(friday, 10, 30);
  sessions.push({ ...base, session_key: round * 100 + 1, session_type: 'Practice', session_name: 'Practice 1', date_start: p1Start, date_end: end(p1Start, 1) });

  // Practice 2 - Friday 14:00 UTC
  const p2Start = fmt(friday, 14, 0);
  sessions.push({ ...base, session_key: round * 100 + 2, session_type: 'Practice', session_name: 'Practice 2', date_start: p2Start, date_end: end(p2Start, 1) });

  // Practice 3 - Saturday 10:30 UTC
  const p3Start = fmt(saturday, 10, 30);
  sessions.push({ ...base, session_key: round * 100 + 3, session_type: 'Practice', session_name: 'Practice 3', date_start: p3Start, date_end: end(p3Start, 1) });

  // Qualifying - Saturday 14:00 UTC
  const qStart = fmt(saturday, 14, 0);
  sessions.push({ ...base, session_key: round * 100 + 4, session_type: 'Qualifying', session_name: 'Qualifying', date_start: qStart, date_end: end(qStart, 1) });

  // Race - Sunday
  const raceTime = race.time ? race.time.replace(/Z$/i, '') : '14:00:00';
  const [rh, rm] = raceTime.split(':').map(Number);
  const raceStart = fmt(raceDate, rh, rm);
  sessions.push({ ...base, session_key: round * 100 + 5, session_type: 'Race', session_name: 'Race', date_start: raceStart, date_end: end(raceStart, 2) });

  return sessions;
}

export async function getFallbackSessions(year?: number): Promise<F1Session[]> {
  const y = year ?? new Date().getFullYear();
  const cacheKey = `fallback-sessions-${y}`;
  const cached = getCached<F1Session[]>(cacheKey);
  if (cached) return cached;

  const local = getLocal<F1Session[]>(cacheKey);
  if (local && local.length > 0) return local;

  try {
    const res = await fetch(`/api/jolpica/${y}.json`);
    if (!res.ok) return [];
    const data = await res.json();
    const races: Array<{
      raceName: string;
      date: string;
      time?: string;
      round: string;
      Circuit: {
        circuitName: string;
        Location: { country: string; locality: string };
      };
    }> = data.MRData?.RaceTable?.Races ?? [];

    const sessions: F1Session[] = [];
    for (const race of races) {
      sessions.push(...generateWeekendSessions({
        round: race.round,
        date: race.date,
        time: race.time,
        circuitName: race.Circuit.circuitName,
        country: race.Circuit.Location.country,
        locality: race.Circuit.Location.locality,
      }, y));
    }

    setCache(cacheKey, sessions);
    if (sessions.length > 0) setLocal(cacheKey, sessions);
    return sessions;
  } catch {
    return [];
  }
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

// --- Live Timing: Positions ---
export interface PositionEntry {
  driver_number: number;
  position: number;
  date: string;
}

export async function getPositions(sessionKey: number): Promise<Map<number, number>> {
  const res = await fetchWithRetry(`${OPENF1_BASE}/position?session_key=${sessionKey}`);
  if (!res.ok) return new Map();
  const data: PositionEntry[] = await res.json();
  const map = new Map<number, number>();
  for (const entry of data) {
    map.set(entry.driver_number, entry.position);
  }
  return map;
}

// --- Live Timing: Intervals ---
export interface IntervalEntry {
  driver_number: number;
  gap_to_leader: string | number | null;
  interval: string | number | null;
}

export async function getIntervals(sessionKey: number): Promise<Map<number, { gap: string | number | null; interval: string | number | null }>> {
  const res = await fetchWithRetry(`${OPENF1_BASE}/intervals?session_key=${sessionKey}`);
  if (!res.ok) return new Map();
  const data: IntervalEntry[] = await res.json();
  const map = new Map<number, { gap: string | number | null; interval: string | number | null }>();
  for (const entry of data) {
    map.set(entry.driver_number, { gap: entry.gap_to_leader, interval: entry.interval });
  }
  return map;
}

// --- Live Timing: Drivers ---
export interface DriverInfo {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  team_colour: string;
  headshot_url?: string;
}

export async function getDrivers(sessionKey: number): Promise<Map<number, DriverInfo>> {
  const key = `drivers-${sessionKey}`;
  const cached = getCached<Map<number, DriverInfo>>(key);
  if (cached) return cached;

  const res = await fetchWithRetry(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`);
  if (!res.ok) return new Map();
  const data: DriverInfo[] = await res.json();
  const map = new Map<number, DriverInfo>();
  for (const d of data) {
    map.set(d.driver_number, d);
  }
  setCache(key, map);
  return map;
}

// --- Live Timing: Car Data ---
export interface CarDataEntry {
  driver_number: number;
  speed: number;
  throttle: number;
  brake: number;
  n_gear: number;
  drs: number;
}

export async function getCarData(sessionKey: number): Promise<Map<number, CarDataEntry>> {
  const res = await fetchWithRetry(`${OPENF1_BASE}/car_data?session_key=${sessionKey}`);
  if (!res.ok) return new Map();
  const data: CarDataEntry[] = await res.json();
  const map = new Map<number, CarDataEntry>();
  for (const entry of data) {
    map.set(entry.driver_number, entry);
  }
  return map;
}

// --- Track Map: Location ---
export interface LocationEntry {
  driver_number: number;
  x: number;
  y: number;
  z: number;
  date: string;
}

export async function getLocationData(sessionKey: number): Promise<Map<number, { x: number; y: number }>> {
  const res = await fetchWithRetry(`${OPENF1_BASE}/location?session_key=${sessionKey}`);
  if (!res.ok) return new Map();
  const data: LocationEntry[] = await res.json();
  const map = new Map<number, { x: number; y: number }>();
  for (const entry of data) {
    map.set(entry.driver_number, { x: entry.x, y: entry.y });
  }
  return map;
}

// --- Fastest Laps ---
export interface LapEntry {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  st_speed: number | null;
  is_pit_out_lap: boolean;
}

export async function getLaps(sessionKey: number): Promise<LapEntry[]> {
  const res = await fetchWithRetry(`${OPENF1_BASE}/laps?session_key=${sessionKey}`);
  if (!res.ok) return [];
  const data: LapEntry[] = await res.json();
  return data.filter((l) => l.lap_duration !== null && !l.is_pit_out_lap);
}

export function getTrackImageUrl(circuitShortName: string): string {
  const nameMap: Record<string, string> = {
    // OpenF1 circuit_short_name values
    'Sakhir': 'Bahrain', 'Melbourne': 'Australia', 'Shanghai': 'China',
    'Suzuka': 'Japan', 'Miami Gardens': 'Miami', 'Imola': 'Emilia%20Romagna',
    'Monte Carlo': 'Monaco', 'Catalunya': 'Spain', 'Montreal': 'Canada',
    'Spielberg': 'Austria', 'Silverstone': 'Great%20Britain',
    'Spa-Francorchamps': 'Belgium', 'Hungaroring': 'Hungary',
    'Zandvoort': 'Netherlands', 'Monza': 'Italy', 'Baku': 'Azerbaijan',
    'Marina%20Bay': 'Singapore', 'Singapore': 'Singapore', 'Austin': 'USA',
    'Mexico City': 'Mexico', 'Interlagos': 'Brazil', 'Las%20Vegas': 'Las%20Vegas',
    'Lusail': 'Qatar', 'Yas Marina Circuit': 'Abu%20Dhabi', 'Yas Island': 'Abu%20Dhabi',
    // Jolpica/Ergast locality values
    'São Paulo': 'Brazil', 'Sao Paulo': 'Brazil', 'Barcelona': 'Spain',
    'Madrid': 'Spain', 'Spa': 'Belgium', 'Great Britain': 'Great%20Britain',
    'USA': 'USA', 'Marina Bay': 'Singapore', 'Abu Dhabi': 'Abu%20Dhabi',
    'Las Vegas': 'Las%20Vegas',
  };
  const mapped = nameMap[circuitShortName] ?? circuitShortName;
  return `https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/${mapped}%20carbon.png`;
}
