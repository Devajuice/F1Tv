import type { Race } from '../api/f1Api';
import { joinDateTime } from './format';

/** How long a Grand Prix runs, used to decide live vs finished. */
const RACE_WINDOW_MS = 2 * 60 * 60 * 1000;

export type RaceStatus = 'completed' | 'live' | 'upcoming';

/** Start instant of a race, or null when the calendar has no time yet. */
export function getRaceStart(race: Race): Date | null {
  return joinDateTime(race.date, race.time);
}

/** Start instant of qualifying, falling back to the race itself. */
export function getQualifyingStart(race: Race): Date | null {
  return joinDateTime(race.qualifyingDate, race.qualifyingTime) ?? getRaceStart(race);
}

export function getRaceStatus(race: Race, now = Date.now()): RaceStatus {
  const start = getRaceStart(race)?.getTime();
  if (start === undefined) return 'upcoming';
  if (now >= start && now < start + RACE_WINDOW_MS) return 'live';
  return now < start ? 'upcoming' : 'completed';
}

export function isRaceFinished(race: Race, now = Date.now()): boolean {
  return getRaceStatus(race, now) === 'completed';
}

export function isQualifyingFinished(race: Race, now = Date.now()): boolean {
  const start = getQualifyingStart(race)?.getTime();
  if (start === undefined) return false;
  // Qualifying is roughly an hour; add a little slack for overruns.
  return now >= start + 75 * 60 * 1000;
}

function byRound(a: Race, b: Race): number {
  return Number(a.round) - Number(b.round);
}

export function getCompletedRaces(races: Race[], now = Date.now()): Race[] {
  return races.filter((r) => isRaceFinished(r, now)).sort(byRound);
}

export function getUpcomingRaces(races: Race[], now = Date.now()): Race[] {
  return races
    .filter((r) => !isRaceFinished(r, now))
    .sort((a, b) => (getRaceStart(a)?.getTime() ?? 0) - (getRaceStart(b)?.getTime() ?? 0));
}

/** The next race, or the one currently being run. */
export function getNextRace(races: Race[], now = Date.now()): Race | null {
  return getUpcomingRaces(races, now)[0] ?? null;
}

/** The most recently completed race. */
export function getLastRace(races: Race[], now = Date.now()): Race | null {
  return getCompletedRaces(races, now).at(-1) ?? null;
}

/** Races whose qualifying has run — the options on the qualifying/grid pages. */
export function getRacesWithQualifying(races: Race[], now = Date.now()): Race[] {
  return races
    .filter((r) => r.qualifyingDate && isQualifyingFinished(r, now))
    .sort(byRound);
}

/** Round label used in dropdowns and table captions. */
export function raceLabel(race: Race): string {
  return `R${Number(race.round)} · ${race.raceName}`;
}
