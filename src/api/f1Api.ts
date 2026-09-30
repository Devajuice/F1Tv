/**
 * Jolpica (Ergast) data access.
 *
 * Adds two things the original had none of: a shared request cache (the
 * schedule was previously fetched by four different pages, and standings by
 * three, all independently) and real error propagation, so pages can render
 * an error state instead of silently showing an empty table.
 */

const BASE_URL = '/api/jolpica';

export const currentSeason = new Date().getFullYear().toString();

/* -------------------------------------------------------------------------
   Types
   ------------------------------------------------------------------------- */

export interface DriverStanding {
  position: string;
  positionText: string;
  driverId: string;
  driverName: string;
  driverNumber: string;
  teamName: string;
  teamId: string;
  points: string;
  wins: string;
}

export interface ConstructorStanding {
  position: string;
  positionText: string;
  constructorId: string;
  constructorName: string;
  points: string;
  wins: string;
}

export interface RaceResult {
  position: string;
  positionText: string;
  driverId: string;
  driverName: string;
  driverNumber: string;
  constructorId: string;
  constructorName: string;
  grid: string;
  points: string;
  status: string;
  time?: string;
  /** Fastest lap, when the API reports one. */
  fastestLap?: { rank: string; time: string; driverName: string };
}

export interface QualifyingResult {
  position: string;
  driverId: string;
  driverName: string;
  driverNumber: string;
  constructorId: string;
  constructorName: string;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  nationality: string;
  dateOfBirth: string;
}

export interface DriverProfile {
  driverId: string;
  driverNumber: string;
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  url: string;
  teamName: string;
  teamId: string;
}

export interface Race {
  season: string;
  round: string;
  raceName: string;
  circuitId: string;
  circuitName: string;
  country: string;
  locality: string;
  date: string;
  time?: string;
  qualifyingDate?: string;
  qualifyingTime?: string;
  results?: RaceResult[];
  sprintResults?: RaceResult[];
}

export interface PracticeSession {
  name: string;
  date: string;
  time: string;
}

/* -------------------------------------------------------------------------
   Request cache
   ------------------------------------------------------------------------- */

interface CacheEntry {
  body: unknown;
  time: number;
}

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

/** How long each endpoint stays fresh, in ms. */
const TTL: Array<[RegExp, number]> = [
  [/\/driverStandings\.json$/, 15 * 60_000],
  [/\/constructorStandings\.json$/, 15 * 60_000],
  [/\/qualifying\.json$/, 10 * 60_000],
  [/\/sprint\.json$/, 10 * 60_000],
  [/\/results\.json$/, 10 * 60_000],
  // Season schedules only change when a calendar is amended.
  [/\/\d{4}\.json$/, 6 * 60 * 60_000],
];

function ttlFor(path: string): number {
  for (const [pattern, ttl] of TTL) {
    if (pattern.test(path)) return ttl;
  }
  return 5 * 60_000;
}

/** Drop a cached response, e.g. after a manual refresh. */
export function invalidateCache(matcher?: RegExp): void {
  if (!matcher) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (matcher.test(key)) cache.delete(key);
  }
}

async function request<T>(path: string): Promise<T> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.time < ttlFor(path)) {
    return hit.body as T;
  }

  const pending = inFlight.get(path);
  if (pending) return pending as Promise<T>;

  const promise = (async () => {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? 'That data is not available yet.'
          : `Race data request failed (${res.status}).`,
      );
    }
    const payload: unknown = await res.json();
    // Jolpica wraps every response in a `{ MRData: { … } }` envelope, so
    // `RaceTable` / `StandingsTable` sit one level down. Unwrap it once here —
    // every fetcher below reads the inner object, and unwrapping in `request`
    // means no caller can forget to. The unwrapped payload is what gets
    // cached, so a cache hit skips this step too.
    const body = (
      payload !== null &&
      typeof payload === 'object' &&
      'MRData' in payload
        ? (payload as { MRData: unknown }).MRData
        : payload
    ) as T;
    cache.set(path, { body, time: Date.now() });
    return body;
  })().finally(() => inFlight.delete(path));

  inFlight.set(path, promise);
  return promise as Promise<T>;
}

/* -------------------------------------------------------------------------
   Raw API shapes
   ------------------------------------------------------------------------- */

interface ErgastDriver {
  driverId: string;
  givenName: string;
  familyName: string;
  permanentNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
  url?: string;
}

interface ErgastConstructor {
  constructorId: string;
  name: string;
}

interface ErgastResult {
  position: string;
  positionText: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  grid: string;
  points: string;
  status: string;
  Time?: { time: string };
  /** `lapTime` is not a field here — the lap time is nested under `Time`. */
  FastestLap?: { rank: string; lap?: string; Time?: { time: string } };
}

interface ErgastPractice {
  date: string;
  time?: string;
}

interface ErgastRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
    Location: { country: string; locality: string };
  };
  date: string;
  time?: string;
  Qualifying?: ErgastPractice;
  FirstPractice?: ErgastPractice;
  SecondPractice?: ErgastPractice;
  ThirdPractice?: ErgastPractice;
  Sprint?: ErgastPractice;
  SprintQualifying?: ErgastPractice;
  Results?: ErgastResult[];
  SprintResults?: ErgastResult[];
  QualifyingResults?: Array<Record<string, unknown>>;
}

interface MrData {
  RaceTable?: { Races?: ErgastRace[]; season?: string };
  StandingsTable?: {
    StandingsLists?: Array<{
      DriverStandings?: Array<
        Record<string, unknown> & {
          Driver: ErgastDriver;
          Constructors: ErgastConstructor[];
        }
      >;
      ConstructorStandings?: Array<
        Record<string, unknown> & { Constructor: ErgastConstructor }
      >;
    }>;
  };
}

/* -------------------------------------------------------------------------
   Transformers
   ------------------------------------------------------------------------- */

function transformResult(r: ErgastResult): RaceResult {
  const driverName = `${r.Driver.givenName} ${r.Driver.familyName}`;
  const fastestTime = r.FastestLap?.Time?.time;
  return {
    position: r.position,
    positionText: r.positionText,
    driverId: r.Driver.driverId,
    driverName,
    driverNumber: r.Driver.permanentNumber ?? '',
    constructorId: r.Constructor.constructorId,
    constructorName: r.Constructor.name,
    grid: r.grid,
    points: r.points,
    status: r.status,
    time: r.Time?.time,
    // Ergast reports a FastestLap block for every classified driver; only
    // rank "1" is the session's quickest, so anything without a usable time
    // is dropped rather than rendered as an empty pill.
    fastestLap:
      r.FastestLap && fastestTime
        ? {
            rank: r.FastestLap.rank,
            time: fastestTime,
            driverName,
          }
        : undefined,
  };
}

function transformRace(race: ErgastRace): Race {
  return {
    season: race.season,
    round: race.round,
    raceName: race.raceName,
    circuitId: race.Circuit.circuitId,
    circuitName: race.Circuit.circuitName,
    country: race.Circuit.Location.country,
    locality: race.Circuit.Location.locality,
    date: race.date,
    time: race.time,
    qualifyingDate: race.Qualifying?.date,
    qualifyingTime: race.Qualifying?.time,
    results: race.Results?.map(transformResult),
    sprintResults: race.SprintResults?.map(transformResult),
  };
}

function transformQualifying(r: Record<string, unknown>): QualifyingResult {
  const d = r.Driver as ErgastDriver;
  const c = r.Constructor as ErgastConstructor;
  return {
    position: r.position as string,
    driverId: d.driverId,
    driverName: `${d.givenName} ${d.familyName}`,
    driverNumber: d.permanentNumber ?? '',
    constructorId: c.constructorId,
    constructorName: c.name,
    q1: (r.Q1 as string | null) ?? null,
    q2: (r.Q2 as string | null) ?? null,
    q3: (r.Q3 as string | null) ?? null,
    nationality: d.nationality ?? '',
    dateOfBirth: d.dateOfBirth ?? '',
  };
}

/* -------------------------------------------------------------------------
   Fetchers
   ------------------------------------------------------------------------- */

export async function getSchedule(season?: string): Promise<Race[]> {
  const year = season ?? currentSeason;
  const data = await request<MrData>(`/${year}.json`);
  return (data.RaceTable?.Races ?? []).map(transformRace);
}

/** Full race record including results, or null if the round doesn't exist. */
export async function getRaceResult(
  season: string,
  round: string,
): Promise<Race | null> {
  const data = await request<MrData>(`/${season}/${round}/results.json`);
  const race = data.RaceTable?.Races?.[0];
  return race ? transformRace(race) : null;
}

export async function getDriverStandings(
  season?: string,
  round?: string,
): Promise<DriverStanding[]> {
  const year = season ?? currentSeason;
  const path = round
    ? `/${year}/${round}/driverStandings.json`
    : `/${year}/driverStandings.json`;
  const data = await request<MrData>(path);
  const list = data.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
  return list.map((s) => {
    const team = s.Constructors[0];
    return {
      position: s.position as string,
      positionText: s.positionText as string,
      driverId: s.Driver.driverId,
      driverName: `${s.Driver.givenName} ${s.Driver.familyName}`,
      driverNumber: s.Driver.permanentNumber ?? '',
      teamName: team?.name ?? 'Unknown',
      teamId: team?.constructorId ?? 'unknown',
      points: s.points as string,
      wins: s.wins as string,
    };
  });
}

export async function getConstructorStandings(
  season?: string,
  round?: string,
): Promise<ConstructorStanding[]> {
  const year = season ?? currentSeason;
  const path = round
    ? `/${year}/${round}/constructorStandings.json`
    : `/${year}/constructorStandings.json`;
  const data = await request<MrData>(path);
  const list =
    data.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];
  return list.map((s) => ({
    position: s.position as string,
    positionText: s.positionText as string,
    constructorId: s.Constructor.constructorId,
    constructorName: s.Constructor.name,
    points: s.points as string,
    wins: s.wins as string,
  }));
}

export async function getQualifyingResult(
  season: string,
  round: string,
): Promise<QualifyingResult[]> {
  const data = await request<MrData>(`/${season}/${round}/qualifying.json`);
  const race = data.RaceTable?.Races?.[0];
  return (race?.QualifyingResults ?? []).map(transformQualifying);
}

/** Sprint results. Previously exported but wired to nothing. */
export async function getSprintResult(
  season: string,
  round: string,
): Promise<RaceResult[]> {
  const data = await request<MrData>(`/${season}/${round}/sprint.json`);
  const race = data.RaceTable?.Races?.[0];
  return race?.SprintResults?.map(transformResult) ?? [];
}

/**
 * The starting grid is the qualifying order.
 * (Previously a byte-for-byte duplicate of getQualifyingResult.)
 */
export function getGridLineup(
  season: string,
  round: string,
): Promise<QualifyingResult[]> {
  return getQualifyingResult(season, round);
}

export async function getPracticeSchedule(
  season: string,
  round: string,
): Promise<PracticeSession[]> {
  const data = await request<MrData>(`/${season}/${round}.json`);
  const race = data.RaceTable?.Races?.[0];
  if (!race) return [];

  const sessions: PracticeSession[] = [];
  const push = (label: string, p?: ErgastPractice) => {
    if (p) sessions.push({ name: label, date: p.date, time: p.time ?? '' });
  };

  push('Practice 1', race.FirstPractice);
  push('Practice 2', race.SecondPractice);
  push('Practice 3', race.ThirdPractice);
  push('Sprint Qualifying', race.SprintQualifying);
  push('Sprint', race.Sprint);
  push('Qualifying', race.Qualifying);
  push('Race', { date: race.date, time: race.time });

  return sessions;
}

export async function getDriverList(season?: string): Promise<DriverProfile[]> {
  const year = season ?? currentSeason;
  const data = await request<MrData>(`/${year}/driverStandings.json`);
  const list = data.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
  return list.map((s) => {
    const team = s.Constructors[0];
    return {
      driverId: s.Driver.driverId,
      driverNumber: s.Driver.permanentNumber ?? '',
      firstName: s.Driver.givenName,
      lastName: s.Driver.familyName,
      nationality: s.Driver.nationality ?? '',
      dateOfBirth: s.Driver.dateOfBirth ?? '',
      url: s.Driver.url ? `https://${s.Driver.url}` : '',
      teamName: team?.name ?? 'Unknown',
      teamId: team?.constructorId ?? 'unknown',
    };
  });
}
