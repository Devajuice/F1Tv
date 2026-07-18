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
const CACHE_TTL = 30 * 60 * 1000;
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
    if (!res.ok) break;
    const data = await res.json();

    for (const v of data.videos || []) {
      if (EXCLUDE.test(v.title)) continue;
      if (!v.published.startsWith(String(CURRENT_YEAR)) && !v.title.includes(String(CURRENT_YEAR))) continue;
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

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  setCache(result);
  return result;
}
