const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

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
  results?: RaceResult[];
  sprintResults?: RaceResult[];
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
  Results?: Array<{
    position: string;
    positionText: string;
    Driver: { driverId: string; familyName: string; givenName: string; permanentNumber?: string };
    Constructor: { constructorId: string; name: string };
    grid: string;
    points: string;
    status: string;
    Time?: { time: string };
  }>;
  SprintResults?: Array<{
    position: string;
    positionText: string;
    Driver: { driverId: string; familyName: string; givenName: string; permanentNumber?: string };
    Constructor: { constructorId: string; name: string };
    grid: string;
    points: string;
    status: string;
    Time?: { time: string };
  }>;
}

type ErgastResult = NonNullable<ErgastRace['Results']>[number];

function transformResult(r: ErgastResult): RaceResult {
  return {
    position: r.position,
    positionText: r.positionText,
    driverId: r.Driver.driverId,
    driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
    driverNumber: r.Driver.permanentNumber ?? '',
    constructorId: r.Constructor.constructorId,
    constructorName: r.Constructor.name,
    grid: r.grid,
    points: r.points,
    status: r.status,
    time: r.Time?.time,
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
    results: race.Results?.map(transformResult),
    sprintResults: race.SprintResults?.map(transformResult),
  };
}

export async function getSchedule(season?: string): Promise<Race[]> {
  const year = season ?? new Date().getFullYear().toString();
  const res = await fetch(`${BASE_URL}/${year}.json`);
  const data = await res.json();
  return (data.MRData.RaceTable.Races as ErgastRace[]).map(transformRace);
}

export async function getRaceResult(season: string, round: string): Promise<Race | null> {
  const res = await fetch(`${BASE_URL}/${season}/${round}/results.json`);
  const data = await res.json();
  const races = data.MRData.RaceTable.Races as ErgastRace[];
  return races.length > 0 ? transformRace(races[0]) : null;
}

export async function getDriverStandings(season?: string, round?: string): Promise<DriverStanding[]> {
  const year = season ?? new Date().getFullYear().toString();
  let url = `${BASE_URL}/${year}/driverStandings.json`;
  if (round) url = `${BASE_URL}/${year}/${round}/driverStandings.json`;
  const res = await fetch(url);
  const data = await res.json();
  const list = data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
  return list.map((s: Record<string, unknown>) => {
    const d = s.Driver as { driverId: string; givenName: string; familyName: string; permanentNumber?: string };
    const c = (s.Constructors as Array<{ constructorId: string; name: string }>)[0];
    return {
      position: s.position as string,
      positionText: s.positionText as string,
      driverId: d.driverId,
      driverName: `${d.givenName} ${d.familyName}`,
      driverNumber: d.permanentNumber ?? '',
      teamName: c?.name ?? 'Unknown',
      teamId: c?.constructorId ?? 'unknown',
      points: s.points as string,
      wins: s.wins as string,
    };
  });
}

export async function getConstructorStandings(season?: string, round?: string): Promise<ConstructorStanding[]> {
  const year = season ?? new Date().getFullYear().toString();
  let url = `${BASE_URL}/${year}/constructorStandings.json`;
  if (round) url = `${BASE_URL}/${year}/${round}/constructorStandings.json`;
  const res = await fetch(url);
  const data = await res.json();
  const list = data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
  return list.map((s: Record<string, unknown>) => {
    const c = s.Constructor as { constructorId: string; name: string };
    return {
      position: s.position as string,
      positionText: s.positionText as string,
      constructorId: c.constructorId,
      constructorName: c.name,
      points: s.points as string,
      wins: s.wins as string,
    };
  });
}
