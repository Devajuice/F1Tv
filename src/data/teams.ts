/**
 * Canonical team registry.
 *
 * Replaces five divergent `TEAM_COLORS` maps that were duplicated across
 * pages and disagreed on key format (one page keyed on the constructor id,
 * the rest on the display name — which is why Red Bull drivers rendered grey
 * on the Drivers page). Everything resolves through one normaliser, so
 * `getTeamColor('red_bull')` and `getTeamColor('Red Bull Racing')` both work.
 */

export interface Team {
  /** Jolpica constructorId, when known. */
  id: string;
  /** Short display name used in the UI. */
  name: string;
  /** Full constructor name as returned by the API. */
  fullName: string;
  /** Primary livery colour, used for dots, bars and avatar sheens. */
  color: string;
  /** Secondary/accent livery colour, used for gradients. */
  accent: string;
}

/** Order used for legends and colour ranking. */
const REGISTRY: Team[] = [
  { id: 'ferrari', name: 'Ferrari', fullName: 'Ferrari', color: '#e8002d', accent: '#ffd6db' },
  { id: 'red_bull', name: 'Red Bull', fullName: 'Red Bull Racing', color: '#3671c6', accent: '#f5d7a8' },
  { id: 'mclaren', name: 'McLaren', fullName: 'McLaren', color: '#ff8000', accent: '#d6f0ff' },
  { id: 'mercedes', name: 'Mercedes', fullName: 'Mercedes', color: '#27f4d2', accent: '#c9fff8' },
  { id: 'aston_martin', name: 'Aston Martin', fullName: 'Aston Martin', color: '#229971', accent: '#d9f5ea' },
  { id: 'williams', name: 'Williams', fullName: 'Williams', color: '#64c4ff', accent: '#e6f6ff' },
  { id: 'alpine', name: 'Alpine', fullName: 'Alpine', color: '#ff87bc', accent: '#ffe3ee' },
  { id: 'racing_bulls', name: 'Racing Bulls', fullName: 'Visa Cash App Racing Bulls', color: '#6692ff', accent: '#e0eaff' },
  { id: 'rb', name: 'RB', fullName: 'RB', color: '#6692ff', accent: '#e0eaff' },
  { id: 'kick_sauber', name: 'Kick Sauber', fullName: 'Kick Sauber', color: '#52e252', accent: '#e2ffe2' },
  { id: 'sauber', name: 'Sauber', fullName: 'Sauber', color: '#52e252', accent: '#e2ffe2' },
  { id: 'haas', name: 'Haas', fullName: 'Haas', color: '#b6babd', accent: '#f4f5f6' },
  { id: 'audi', name: 'Audi', fullName: 'Audi', color: '#f50535', accent: '#ffd9df' },
  { id: 'cadillac', name: 'Cadillac', fullName: 'Cadillac', color: '#c8a97e', accent: '#f6ecdd' },
];

/** Every spelling that shows up in the wild, normalised to a canonical id. */
const ALIASES: Record<string, string> = {
  mercedes: 'mercedes',
  mercedes_amg: 'mercedes',
  'mercedes amg petronas': 'mercedes',
  red_bull: 'red_bull',
  red_bull_racing: 'red_bull',
  'red bull': 'red_bull',
  'red bull racing': 'red_bull',
  oracle_red_bull_racing: 'red_bull',
  ferrari: 'ferrari',
  scuderia_ferrari: 'ferrari',
  mclaren: 'mclaren',
  mclaren_f1: 'mclaren',
  aston_martin: 'aston_martin',
  'aston martin': 'aston_martin',
  astonmartin: 'aston_martin',
  williams: 'williams',
  alpine: 'alpine',
  renault: 'alpine',
  racing_bulls: 'racing_bulls',
  rb: 'rb',
  alpha_tauri: 'rb',
  alphatauri: 'rb',
  'visa cash app racing bulls': 'racing_bulls',
  kick_sauber: 'kick_sauber',
  sauber: 'sauber',
  haas: 'haas',
  haas_f1: 'haas',
  audi: 'audi',
  cadillac: 'cadillac',
};

export const FALLBACK_TEAM_COLOR = '#6b7280';
const FALLBACK_TEAM: Team = {
  id: 'unknown',
  name: 'Unknown',
  fullName: 'Unknown',
  color: FALLBACK_TEAM_COLOR,
  accent: '#c7ccd4',
};

/** Lowercase and strip everything that isn't a letter or digit. */
function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const BY_KEY = new Map<string, Team>();
for (const team of REGISTRY) {
  const keys = [
    team.id,
    normalise(team.id),
    normalise(team.name),
    normalise(team.fullName),
    ALIASES[normalise(team.name)],
    ALIASES[normalise(team.fullName)],
  ];
  for (const key of keys) {
    if (key) BY_KEY.set(key, team);
  }
}

/** Resolve any team identifier or display name to its registry entry. */
export function getTeam(input: string | null | undefined): Team {
  if (!input) return FALLBACK_TEAM;
  return BY_KEY.get(normalise(input)) ?? FALLBACK_TEAM;
}

/** Livery colour for a constructor id or display name. */
export function getTeamColor(input: string | null | undefined): string {
  return getTeam(input).color;
}

/** Short display name, e.g. "Red Bull Racing" -> "Red Bull". */
export function getTeamName(input: string | null | undefined): string {
  return getTeam(input).name;
}

/** All known teams, for the standings legend. */
export const allTeams: readonly Team[] = REGISTRY;
