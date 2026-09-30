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
const CURRENT_YEAR = new Date().getFullYear();
const CACHE_KEY = 'f1_highlights_cache';
const CACHE_TTL = 15 * 60 * 1000;
const MIN_PER_TYPE = 8;

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

export async function fetchAllHighlights(): Promise<Record<HighlightType, YoutubeVideo[]>> {
  const cached = getCached();
  if (cached) return cached.data;

  const result: Record<HighlightType, YoutubeVideo[]> = {
    race: [],
    sprint: [],
    qualifying: [],
  };

  let pageToken = '';
  for (let i = 0; i < 20; i++) {
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

    for (const v of data.videos ?? []) {
      if (!v) continue;
      if (EXCLUDE.test(v.title)) continue;
      const currentYear = String(CURRENT_YEAR);
      if (!v.published?.startsWith(currentYear) && !v.title?.includes(currentYear)) {
        continue;
      }
      for (const type of ['race', 'sprint', 'qualifying'] as HighlightType[]) {
        if (TITLE_PATTERNS[type].test(v.title)) {
          result[type].push(v);
        }
      }
    }

    const allFound = (['race', 'sprint', 'qualifying'] as HighlightType[]).every(
      (t) => result[t].length >= MIN_PER_TYPE
    );
    if (allFound) break;

    pageToken = data.nextPageToken ?? '';
    if (!pageToken) break;
  }

  setCache(result);
  return result;
}
