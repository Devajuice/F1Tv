/**
 * Shared formatters.
 *
 * Every page used to carry its own copy of these helpers (date formatting in
 * RaceCalendar, flags in RaceCalendar + Drivers, `timeAgo` in News, age
 * calculation in Drivers). They all live here now, backed by cached
 * `Intl` formatters so repeated calls stay cheap.
 *
 * Time-zone handling: the formatters are built per zone rather than once at
 * module load, because the viewer's preferred zone can change at runtime.
 * `setDisplayTimeZone` sets the default for callers with no circuit in hand;
 * the zone-aware helpers take an explicit `timeZone` and bypass it. The zone
 * cache is keyed by zone, so switching back to a previously used zone costs
 * nothing.
 */

/** The zone used when a caller does not name one. Null means "browser zone". */
let displayTimeZone: string | null = null;

/**
 * Set the default display zone. Called by `TimeZoneProvider`; pass null to go
 * back to following the browser.
 */
export function setDisplayTimeZone(zone: string | null): void {
  displayTimeZone = zone;
}

/** The zone currently in effect for callers that do not pass one. */
export function getDisplayTimeZone(): string | null {
  return displayTimeZone;
}

type ZoneOptions = { timeZone?: string | null };

/** key -> formatter. Bounded because it is keyed by zone, and zones are few. */
const FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

/**
 * Build a formatter, memoised per zone so switching is cheap.
 *
 * The `T extends Intl.DateTimeFormat` bound matters: without it `T` is inferred
 * as `unknown` from `fallback`, which then makes the cache write a type error.
 */
function cached<T extends Intl.DateTimeFormat>(
  key: string,
  zone: string | null,
  build: (options: Intl.DateTimeFormatOptions) => Intl.DateTimeFormat,
  fallback: () => T,
): T {
  const cacheKey = `${key}@${zone ?? 'default'}`;
  const hit = FORMATTER_CACHE.get(cacheKey);
  if (hit) return hit as T;

  let value: Intl.DateTimeFormat;
  if (zone) {
    try {
      value = build({ timeZone: zone });
    } catch {
      // Unknown zone (an old stored value, a renamed IANA id): fall back to
      // the browser zone rather than throwing mid-render.
      value = fallback();
    }
  } else {
    value = build({});
  }

  FORMATTER_CACHE.set(cacheKey, value);
  return value as T;
}

/** Merges the explicit zone over the ambient one. */
function zoneOf(options?: ZoneOptions): string | null {
  return options?.timeZone ?? displayTimeZone;
}

function weekday(zone: string | null) {
  return cached('weekday', zone, (o) => new Intl.DateTimeFormat(undefined, { ...o, weekday: 'short' }), () =>
    new Intl.DateTimeFormat(undefined, { weekday: 'short' }),
  );
}
function dayMonth(zone: string | null) {
  return cached('dayMonth', zone, (o) => new Intl.DateTimeFormat(undefined, { ...o, day: 'numeric', month: 'short' }), () =>
    new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }),
  );
}
function dayMonthYear(zone: string | null) {
  return cached('dayMonthYear', zone, (o) => new Intl.DateTimeFormat(undefined, { ...o, day: 'numeric', month: 'short', year: 'numeric' }), () =>
    new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
  );
}
function fullDate(zone: string | null) {
  return cached('fullDate', zone, (o) => new Intl.DateTimeFormat(undefined, { ...o, weekday: 'long', day: 'numeric', month: 'long' }), () =>
    new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
  );
}
function time24(zone: string | null) {
  return cached('time24', zone, (o) => new Intl.DateTimeFormat(undefined, { ...o, hour: '2-digit', minute: '2-digit', hour12: false }), () =>
    new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
  );
}
function timeZoned(zone: string | null) {
  return cached('timeZoned', zone, (o) => new Intl.DateTimeFormat(undefined, { ...o, hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' }), () =>
    new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' }),
  );
}
/** Just the zone's short name, e.g. "GMT+5:30". */
function zoneName(zone: string | null) {
  return cached('zoneName', zone, (o) => new Intl.DateTimeFormat('en', { ...o, timeZoneName: 'short', hour: 'numeric' }), () =>
    new Intl.DateTimeFormat('en', { timeZoneName: 'short', hour: 'numeric' }),
  );
}

export function toDate(input: string | number | Date): Date | null {
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Sun 16 Mar" */
export function formatShortDate(input: string | Date | null, options?: ZoneOptions): string {
  const d = input ? toDate(input) : null;
  if (!d) return 'TBA';
  const zone = zoneOf(options);
  return `${weekday(zone).format(d)} ${dayMonth(zone).format(d)}`;
}

/** "16 Mar 2025" */
export function formatDate(input: string | Date | null, options?: ZoneOptions): string {
  const d = input ? toDate(input) : null;
  if (!d) return 'TBA';
  return dayMonthYear(zoneOf(options)).format(d);
}

/** "Sunday, 16 March" */
export function formatLongDate(input: string | Date | null, options?: ZoneOptions): string {
  const d = input ? toDate(input) : null;
  if (!d) return 'To be confirmed';
  return fullDate(zoneOf(options)).format(d);
}

/** "15:00 GMT+5:30" — falls back to "TBA" for missing times. */
export function formatTimeZoned(input: string | Date | null, options?: ZoneOptions): string {
  const d = input ? toDate(input) : null;
  if (!d) return 'TBA';
  return timeZoned(zoneOf(options)).format(d);
}

/** "15:00" */
export function formatTime(input: string | Date | null, options?: ZoneOptions): string {
  const d = input ? toDate(input) : null;
  if (!d) return 'TBA';
  return time24(zoneOf(options)).format(d);
}

/**
 * "GMT+5:30" for a zone on its own, for labelling which zone is in use.
 */
export function formatZoneName(zone: string | null): string {
  return zoneName(zone).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? '';
}

/**
 * Jolpica returns `date` ("2025-03-16") and `time` ("13:00:00Z") as separate
 * fields. Stitch them into one instant, or null when either is missing.
 */
export function joinDateTime(
  date?: string,
  time?: string,
): Date | null {
  if (!date) return null;
  const clean = time?.replace(/Z$/i, '');
  return toDate(clean ? `${date}T${clean}Z` : `${date}T12:00:00Z`);
}

/** "2h 14m" / "14m 09s" — for long-running durations. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0m';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function getCountdownParts(target: string | Date | null, now = Date.now()): CountdownParts {
  const d = target ? toDate(target) : null;
  const total = d ? Math.max(0, d.getTime() - now) : 0;
  return {
    total,
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total % 86_400_000) / 3_600_000),
    minutes: Math.floor((total % 3_600_000) / 60_000),
    seconds: Math.floor((total % 60_000) / 1000),
  };
}

/** Calendar-day key for an instant, in the given zone. */
function dayKey(date: Date, zone: string | null): string {
  const parts = cached(
    'dayKey',
    zone,
    (o) =>
      new Intl.DateTimeFormat('en-CA', {
        ...o,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
    () =>
      new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
  ).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Days from one calendar date to another, counted in the given zone. */
function daysBetweenKeys(from: string, to: string): number {
  const MS = 86_400_000;
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS,
  );
}

/**
 * Whole calendar days from now to an instant. 0 today, 1 tomorrow.
 *
 * Measured on calendar dates rather than elapsed milliseconds, so "tomorrow"
 * means tomorrow where the reader is (or where the circuit is) — not 24 hours
 * away, which lands on the wrong label for every race that is not at midnight.
 */
export function daysUntil(
  input: string | Date | null | undefined,
  now = Date.now(),
  options?: ZoneOptions,
): number {
  const d = input ? toDate(input) : null;
  if (!d) return 0;
  const zone = zoneOf(options);
  return daysBetweenKeys(dayKey(new Date(now), zone), dayKey(d, zone));
}

/** "Today" / "Tomorrow" / "In 4 days" / "3 days ago" / "TBA" */
export function relativeDayLabel(
  input: string | Date | null | undefined,
  now = Date.now(),
  options?: ZoneOptions,
): string {
  if (!input) return 'TBA';
  const delta = daysUntil(input, now, options);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  if (delta === -1) return 'Yesterday';
  if (delta > 1) return `In ${delta} days`;
  if (delta < -1) return `${Math.abs(delta)} days ago`;
  return 'Today';
}

/** "just now" / "12m ago" / "5h ago" / "3d ago" / "12 Mar" */
export function timeAgo(input: string | Date | null, now = Date.now()): string {
  const d = input ? toDate(input) : null;
  if (!d) return '';
  const seconds = Math.max(0, Math.floor((now - d.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return dayMonth(displayTimeZone).format(d);
}

/** Integer with thousands separators, safe for API strings. */
export function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString();
}

/** "1.5M" / "845K" / "1,204" — for YouTube view counts. */
export function formatCompact(value: string | number): string {
  const n = typeof value === 'number' ? value : parseViewCount(value);
  if (!Number.isFinite(n) || n <= 0) return '0';
  // Deliberately hand-rolled rather than `Intl` compact notation: that follows
  // the device locale, so 1,500,000 renders as "15L" in en-IN and "15 लाख" in
  // hi-IN (lakh), and "1,5 M" / "1.5 Mio." elsewhere. YouTube view counts are
  // meant to read as K/M/B everywhere, so the suffix is fixed here.
  const units: [number, string][] = [
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  for (const [threshold, suffix] of units) {
    if (n < threshold) continue;
    const scaled = n / threshold;
    // One decimal below 100 ("1.5M", "15.5M"), none above ("100M", "845M").
    // parseFloat drops a trailing ".0", so 2,000,000 reads "2M" not "2.0M".
    const digits = scaled < 100 ? 1 : 0;
    return `${parseFloat(scaled.toFixed(digits))}${suffix}`;
  }
  return n.toLocaleString('en-US');
}

/** Inverse of formatCompact, for sorting by views. */
export function parseViewCount(value: string | number): number {
  if (typeof value === 'number') return value;
  const match = value.replace(/,/g, '').match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return 0;
  const base = parseFloat(match[1] ?? '');
  const suffix = match[2]?.toUpperCase();
  const factor = suffix === 'B' ? 1e9 : suffix === 'M' ? 1e6 : suffix === 'K' ? 1e3 : 1;
  return base * factor;
}

/** "1:23.456" — F1 lap times. */
export function formatLapTime(time: string | null | undefined): string {
  if (!time) return '—';
  return time.replace(/:\d\d\.\d+$/, (m) => `:${m.slice(-5)}`);
}

/** "1:23.456" for a millisecond duration (session elapsed/remaining). */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** "VER" from "Max Verstappen". */
export function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

/** "MV" from "Max Verstappen". */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Age in whole years, birthday-aware. */
export function getAge(dob: string, now = Date.now()): number {
  const birth = toDate(dob);
  if (!birth) return 0;
  const ref = new Date(now);
  let age = ref.getFullYear() - birth.getFullYear();
  const monthDiff = ref.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

/** "point"/"points", and only when the count is non-zero. */
export function pluralizePoints(value: string | number): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n === 0) return '';
  return n === 1 ? 'point' : 'points';
}

/** Position delta between grid and finish, e.g. +3 / -1 / 0 */
export function positionDelta(grid: string, finish: string): number {
  const g = Number(grid);
  const f = Number(finish);
  if (!Number.isFinite(g) || !Number.isFinite(f) || g === 0) return 0;
  return g - f;
}

/* -------------------------------------------------------------------------
   Flags
   One table maps every country name and F1 nationality that Jolpica emits
   to an ISO-3166 alpha-2 code; emoji are derived from that. This replaced two
   separate incomplete maps (23 countries, 20 nationalities) that disagreed
   with each other.
   ------------------------------------------------------------------------- */

const ISO2_BY_NAME: Record<string, string> = {
  // Countries, as returned in Circuit.Location.country
  australia: 'AU', austria: 'AT', azerbaijan: 'AZ', bahrain: 'BH', belgium: 'BE',
  brazil: 'BR', canada: 'CA', china: 'CN', denmark: 'DK', france: 'FR',
  germany: 'DE', hungary: 'HU', india: 'IN', italy: 'IT', japan: 'JP',
  malaysia: 'MY', mexico: 'MX', monaco: 'MC', netherlands: 'NL',
  'new zealand': 'NZ', qatar: 'QA', 'saudi arabia': 'SA', singapore: 'SG',
  spain: 'ES', switzerland: 'CH', uae: 'AE', 'emirates': 'AE', uk: 'GB',
  'united kingdom': 'GB', 'great britain': 'GB', usa: 'US',
  'united states': 'US', vietnam: 'VN', 'south africa': 'ZA', turkey: 'TR',
  'czech republic': 'CZ', portugal: 'PT', belarus: 'BY', korea: 'KR',
  'south korea': 'KR', 'côte d\'ivoire': 'CI', argentina: 'AR',
  // Nationalities, as returned in Driver.nationality
  american: 'US', argentine: 'AR', argentinian: 'AR', australian: 'AU',
  austrian: 'AT', azerbaijani: 'AZ', belgian: 'BE', brazilian: 'BR',
  british: 'GB', canadian: 'CA', chilean: 'CL', chinese: 'CN',
  colombian: 'CO', 'costa rican': 'CR', danish: 'DK', dutch: 'NL',
  ecuadorian: 'EC', estonian: 'EE', finnish: 'FI', french: 'FR',
  german: 'DE', ghanaian: 'GH', greek: 'GR', guatemalan: 'GT',
  hungarian: 'HU', indian: 'IN', indonesian: 'ID', irish: 'IE',
  israeli: 'IL', italian: 'IT', jamaican: 'JM', japanese: 'JP',
  korean: 'KR', kuwaiti: 'KW', latvian: 'LV', lebanese: 'LB',
  malaysian: 'MY', maltese: 'MT', mexican: 'MX', monegasque: 'MC',
  'new zealander': 'NZ', nigerian: 'NG', norwegian: 'NO', pakistani: 'PK',
  panamanian: 'PA', peruvian: 'PE', polish: 'PL', portuguese: 'PT',
  qatari: 'QA', romanian: 'RO', russian: 'RU', 'saudi': 'SA',
  'saudi arabian': 'SA', singaporean: 'SG', slovakian: 'SK',
  slovenian: 'SI', 'south african': 'ZA', 'south korean': 'KR',
  spanish: 'ES', swedish: 'SE', swiss: 'CH', thai: 'TH', turkish: 'TR',
  venezuelan: 'VE', vietnamese: 'VN', haitian: 'HT',
};

const flagCache = new Map<string, string>();

/** Regional-indicator flag emoji for a country name, code or nationality. */
export function countryFlag(value: string | null | undefined): string {
  if (!value) return '🏁';
  const cached = flagCache.get(value);
  if (cached) return cached;

  const key = value.trim().toLowerCase();
  let iso2 = key.length === 2 ? key.toUpperCase() : ISO2_BY_NAME[key];

  // "Great Britain" / "Netherlands" style trailing qualifiers.
  if (!iso2) {
    const stripped = key.replace(/\s+(republic|kingdom|states|empire)$/, '');
    iso2 = ISO2_BY_NAME[stripped];
  }
  if (!iso2 && key.includes('-')) {
    const first = key.split('-')[0];
    // `includes('-')` guarantees a first segment, but not to the checker.
    if (first) iso2 = ISO2_BY_NAME[first];
  }

  const flag = iso2
    ? String.fromCodePoint(
        0x1f1e6 + (iso2.charCodeAt(0) - 65),
        0x1f1e6 + (iso2.charCodeAt(1) - 65),
      )
    : '🏁';

  flagCache.set(value, flag);
  return flag;
}
