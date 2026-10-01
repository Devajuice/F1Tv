/**
 * Circuit registry.
 *
 * Replaces a 90-entry table of formula1.com CDN slugs. That table existed only
 * to paper over the fact that the CDN keys artwork by a display name ("Emilia
 * Romagna") that matches neither Jolpica's `circuitId` ("imola") nor
 * `locality` ("Imola"). Keying off `circuitId` instead removes the guessing,
 * and artwork is now self-hosted and strokeable in `currentColor`.
 *
 * Geometry lives in `./trackPaths` (lazily imported per layout) and the source
 * SVGs are vendored under `public/tracks/` for the offline cache. Attribution
 * for the CC-BY-4.0 originals is in `public/tracks/CREDITS.md`.
 */

import { loadTrackPath, type TrackPath } from './trackPaths';

export interface Circuit {
  /** Jolpica `circuitId` — the stable key. */
  id: string;
  /** Short display name. */
  name: string;
  /** Country, as returned in `Circuit.Location.country`. */
  country: string;
  /** Layout id in `trackPaths`, e.g. "monza-7". */
  layout: string;
  /** IANA time zone the circuit sits in — drives circuit-local display. */
  timeZone: string;
}

/**
 * The 2024-2026 calendar. `layout` is pinned by hand rather than derived from
 * upstream's `seasons` list, which has gaps (Imola and Bahrain omit 2026) and
 * a couple of wrong 2026 entries.
 */
const CIRCUITS: Circuit[] = [
  { id: 'sakhir', name: 'Bahrain', country: 'Bahrain', layout: 'bahrain-1', timeZone: 'Asia/Bahrain' },
  { id: 'albert_park', name: 'Albert Park', country: 'Australia', layout: 'melbourne-2', timeZone: 'Australia/Melbourne' },
  { id: 'shanghai', name: 'Shanghai', country: 'China', layout: 'shanghai-1', timeZone: 'Asia/Shanghai' },
  { id: 'suzuka', name: 'Suzuka', country: 'Japan', layout: 'suzuka-2', timeZone: 'Asia/Tokyo' },
  { id: 'miami', name: 'Miami', country: 'USA', layout: 'miami-1', timeZone: 'America/New_York' },
  { id: 'imola', name: 'Imola', country: 'Italy', layout: 'imola-3', timeZone: 'Europe/Rome' },
  { id: 'monaco', name: 'Monaco', country: 'Monaco', layout: 'monaco-6', timeZone: 'Europe/Monaco' },
  { id: 'catalunya', name: 'Catalunya', country: 'Spain', layout: 'catalunya-6', timeZone: 'Europe/Madrid' },
  { id: 'spielberg', name: 'Spielberg', country: 'Austria', layout: 'spielberg-3', timeZone: 'Europe/Vienna' },
  { id: 'silverstone', name: 'Silverstone', country: 'UK', layout: 'silverstone-8', timeZone: 'Europe/London' },
  { id: 'spa_francorchamps', name: 'Spa-Francorchamps', country: 'Belgium', layout: 'spa-francorchamps-4', timeZone: 'Europe/Brussels' },
  { id: 'hungaroring', name: 'Hungaroring', country: 'Hungary', layout: 'hungaroring-3', timeZone: 'Europe/Budapest' },
  { id: 'zandvoort', name: 'Zandvoort', country: 'Netherlands', layout: 'zandvoort-5', timeZone: 'Europe/Amsterdam' },
  { id: 'monza', name: 'Monza', country: 'Italy', layout: 'monza-7', timeZone: 'Europe/Rome' },
  { id: 'baku', name: 'Baku', country: 'Azerbaijan', layout: 'baku-1', timeZone: 'Asia/Baku' },
  { id: 'marina_bay', name: 'Marina Bay', country: 'Singapore', layout: 'marina-bay-4', timeZone: 'Asia/Singapore' },
  { id: 'austin', name: 'Austin', country: 'USA', layout: 'austin-1', timeZone: 'America/Chicago' },
  { id: 'mexico_city', name: 'Mexico City', country: 'Mexico', layout: 'mexico-city-3', timeZone: 'America/Mexico_City' },
  { id: 'interlagos', name: 'Interlagos', country: 'Brazil', layout: 'interlagos-2', timeZone: 'America/Sao_Paulo' },
  { id: 'lusail', name: 'Lusail', country: 'Qatar', layout: 'lusail-1', timeZone: 'Asia/Qatar' },
  { id: 'yas_marina', name: 'Yas Marina', country: 'UAE', layout: 'yas-marina-2', timeZone: 'Asia/Dubai' },
  { id: 'las_vegas', name: 'Las Vegas', country: 'USA', layout: 'las-vegas-1', timeZone: 'America/Los_Angeles' },
  { id: 'jeddah', name: 'Jeddah', country: 'Saudi Arabia', layout: 'jeddah-1', timeZone: 'Asia/Riyadh' },
  { id: 'madring', name: 'Madrid', country: 'Spain', layout: 'madring-1', timeZone: 'Europe/Madrid' },
];

/**
 * Extra spellings -> registry id.
 *
 * Call sites hand us whichever field they happen to have: Jolpica `circuitId`,
 * Jolpica `circuitName`, `Location.locality`, or OpenF1's `circuit_short_name`.
 * All four are listed below rather than guessed at the call site.
 */
const ALIASES: Record<string, string> = {
  // circuitName / common display names
  albert_park: 'albert_park',
  enzo_dino_albert_park: 'albert_park',
  // Albert Park's historical names, which older feeds still use.
  madras: 'albert_park',
  buddha_airfield: 'albert_park',
  melbourne: 'albert_park',
  barcelona: 'catalunya',
  catalunya_montmelo: 'catalunya',
  monaco_circuit: 'monaco',
  monte_carlo: 'monaco',
  silverstone_circuit: 'silverstone',
  spa: 'spa_francorchamps',
  ennest: 'spa_francorchamps',
  baku_city_circuit: 'baku',
  hungaroring_circuit: 'hungaroring',
  zandvoort_circuit: 'zandvoort',
  monza_circuit: 'monza',
  mario_moretto: 'imola',
  imola_autodromo: 'imola',
  marina_bay_street: 'marina_bay',
  marina_bay_street_circuit: 'marina_bay',
  yas_island: 'yas_marina',
  yas_marina_circuit: 'yas_marina',
  emirates: 'yas_marina',
  abudhabi: 'yas_marina',
  abu_dhabi: 'yas_marina',
  jeddah_circuit: 'jeddah',
  jeddah_corner: 'jeddah',
  las_vegas_strip: 'las_vegas',
  vegas: 'las_vegas',
  mexicocity: 'mexico_city',
  autodromo_nacional: 'mexico_city',
  // Locality spellings the feeds disagree on.
  great_britain: 'silverstone',
  silverstone: 'silverstone',
  united_kingdom: 'silverstone',
  miami: 'miami',
  miami_international_autodrome: 'miami',
  soa_paulo: 'interlagos',
  sao_paulo: 'interlagos',
  autodromo_joao_carlos_pace: 'interlagos',
  shanghai_international: 'shanghai',
  suzuka_circuit: 'suzuka',
  sakhir: 'sakhir',
  ibn_bu_hasa: 'lusail',
  losail: 'lusail',
  doha: 'lusail',
};

/**
 * Countries that host exactly one circuit on the current calendar.
 *
 * A country is only usable as a lookup key when it is unambiguous. Mapping
 * `usa` unconditionally to Austin is the kind of thing that looks helpful and
 * then silently renders the wrong outline for Miami or Las Vegas, so countries
 * with more than one entry are excluded.
 */
const UNIQUE_COUNTRIES = (() => {
  const seen = new Map<string, number>();
  for (const circuit of CIRCUITS) {
    seen.set(circuit.country, (seen.get(circuit.country) ?? 0) + 1);
  }
  return new Set([...seen].filter(([, n]) => n === 1).map(([country]) => country));
})();

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

const BY_KEY = new Map<string, Circuit>();

for (const circuit of CIRCUITS) {
  // The circuit's own spellings. Only unambiguous countries are included.
  const keys = [circuit.id, circuit.name];
  if (UNIQUE_COUNTRIES.has(circuit.country)) keys.push(circuit.country);
  for (const key of keys) {
    const normalised = normalise(key);
    if (normalised) BY_KEY.set(normalised, circuit);
  }
}

// Aliases point at a registry id, so index them after the ids exist. The
// previous version read `ALIASES[id]` per circuit, which only ever resolved an
// alias whose *value* happened to be a key — every `melbourne -> albert_park`
// style entry was dead, and those are exactly the ones the calendar relies on.
for (const [alias, target] of Object.entries(ALIASES)) {
  const circuit = CIRCUITS.find((c) => c.id === target);
  if (circuit) BY_KEY.set(normalise(alias), circuit);
}

/** Resolve any circuit identifier, locality or country to its registry entry. */
export function getCircuit(input: string | null | undefined): Circuit | null {
  if (!input) return null;
  return BY_KEY.get(normalise(input)) ?? null;
}

/**
 * IANA time zone for a circuit, falling back to the browser's own zone. Every
 * caller treats this as advisory — an unknown circuit still renders, just in
 * the viewer's local time.
 */
export function getCircuitTimeZone(input: string | null | undefined): string | null {
  return getCircuit(input)?.timeZone ?? null;
}

/**
 * Load the outline geometry for a circuit. Null-safe and rejection-safe: an
 * unmapped or missing layout resolves to null so the caller can fall back to
 * the monogram tile.
 */
export async function loadCircuitPath(
  input: string | null | undefined,
): Promise<TrackPath | null> {
  const circuit = getCircuit(input);
  if (!circuit) return null;
  try {
    return await loadTrackPath(circuit.layout);
  } catch {
    return null;
  }
}

/** Every registered circuit, for the settings timezone picker and docs. */
export const allCircuits: readonly Circuit[] = CIRCUITS;