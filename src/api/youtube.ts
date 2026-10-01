export interface YoutubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  views: string;
}

export type HighlightType = 'race' | 'sprint' | 'qualifying';

const TITLE_PATTERNS: Record<HighlightType, RegExp> = {
  race: /Race Highlights/i,
  sprint: /Sprint Highlights/i,
  qualifying: /Qualifying Highlights/i,
};

const EXCLUDE = /F2|F3|Formula 2|Formula 3/i;
const CACHE_KEY = 'f1_highlights_cache';
const CACHE_TTL = 15 * 60 * 1000;
const MIN_PER_TYPE = 8;
/**
 * How many playlist pages to walk. The official channel posts ~6 uploads a week
 * across all series, so the current season's race highlights are usually within
 * the first 300 items; this is a backstop, not an expectation. Each page costs
 * two quota units (playlistItems + videos/statistics).
 */
const MAX_PAGES = 20;
/**
 * How far back to look for a season with highlights.
 *
 * The previous version filtered to `new Date().getFullYear()` only, so from 1
 * January until the first round's video was uploaded the page showed "no
 * highlights published yet" — for a few days every year, and for the whole of
 * January in a pre-season gap. Two years covers it without pulling in archival
 * seasons.
 */
const SEASON_LOOKBACK = 2;

interface CacheEntry {
  data: Record<HighlightType, YoutubeVideo[]>;
  timestamp: number;
}

function getCached(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) return null;
    return entry;
  } catch {
    return null;
  }
}

function setCache(data: Record<HighlightType, YoutubeVideo[]>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

/** Normalise the several error shapes YouTube and the stub can return. */
function describeError(payload: unknown, status: number): string {
  const err = (payload as { error?: unknown } | null | undefined)?.error;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return `Highlights request failed (${status}).`;
}

/**
 * Walk the playlist from the newest upload until every category has enough, or
 * the pages run out. Returns every highlight in the seasons it looked at.
 */
async function collectHighlights(seasons: number[]): Promise<Record<HighlightType, YoutubeVideo[]>> {
  const result: Record<HighlightType, YoutubeVideo[]> = {
    race: [],
    sprint: [],
    qualifying: [],
  };

  let pageToken = '';
  for (let i = 0; i < MAX_PAGES; i++) {
    const params = new URLSearchParams({ maxResults: '50' });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`/api/youtube?${params}`);
    let data: {
      videos?: YoutubeVideo[];
      nextPageToken?: string | null;
      error?: unknown;
    };
    try {
      data = await res.json();
    } catch {
      throw new Error(`Highlights request failed (${res.status}).`);
    }

    // A missing or invalid YOUTUBE_API_KEY used to end up here and return
    // three empty lists, which the page then reported as "no highlights
    // published yet" — pointing at the wrong cause. Surface it instead.
    if (!res.ok) throw new Error(describeError(data, res.status));

    // Videos arrive newest-first, so once an upload predates the oldest season
    // we care about there is nothing left to find.
    let pastWindow = false;

    for (const v of data.videos ?? []) {
      if (!v) continue;
      if (EXCLUDE.test(v.title)) continue;

      const year = Number(v.published?.slice(0, 4));
      const inSeason =
        Number.isFinite(year) && seasons.includes(year) ||
        // Titles carry the year too ("Bahrain 2025 Grand Prix Highlights"), which
        // catches uploads published in the wrong calendar year.
        seasons.some((s) => v.title?.includes(String(s)));
      if (!inSeason) {
        if (Number.isFinite(year) && year < Math.min(...seasons)) pastWindow = true;
        continue;
      }

      for (const type of ['race', 'sprint', 'qualifying'] as HighlightType[]) {
        if (TITLE_PATTERNS[type].test(v.title)) result[type].push(v);
      }
    }

    const allFound = (['race', 'sprint', 'qualifying'] as HighlightType[]).every(
      (t) => result[t].length >= MIN_PER_TYPE
    );
    if (allFound || pastWindow) break;

    pageToken = data.nextPageToken ?? '';
    if (!pageToken) break;
  }

  return result;
}

export async function fetchAllHighlights(): Promise<Record<HighlightType, YoutubeVideo[]>> {
  const cached = getCached();
  if (cached) return cached.data;

  const thisYear = new Date().getFullYear();
  const result = await collectHighlights([thisYear]);

  // Still short on any category: the season has barely started (or a
  // pre-season gap means the first round's video is not up yet). Widen the
  // window rather than showing an empty tab.
  const thin = (['race', 'sprint', 'qualifying'] as HighlightType[]).some(
    (t) => result[t].length < MIN_PER_TYPE,
  );
  if (thin) {
    const wider = await collectHighlights(
      Array.from({ length: SEASON_LOOKBACK }, (_, i) => thisYear - i),
    );
    for (const type of ['race', 'sprint', 'qualifying'] as HighlightType[]) {
      if (wider[type].length > result[type].length) result[type] = wider[type];
    }
  }

  setCache(result);
  return result;
}
