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

const SEARCH_QUERIES: Record<HighlightType, string> = {
  race: 'highlights',
  sprint: 'sprint highlights',
  qualifying: 'qualifying highlights',
};

const EXCLUDE = /F2|F3|Formula 2|Formula 3/i;
const CACHE_KEY = 'f1_highlights_cache';
const CACHE_TTL = 30 * 60 * 1000;

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

async function fetchType(type: HighlightType): Promise<YoutubeVideo[]> {
  const results: YoutubeVideo[] = [];
  let pageToken = '';

  for (let i = 0; i < 5; i++) {
    const params = new URLSearchParams({
      q: SEARCH_QUERIES[type],
      maxResults: '50',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`/api/youtube?${params}`);
    if (!res.ok) break;
    const data = await res.json();

    for (const v of data.videos || []) {
      if (!EXCLUDE.test(v.title) && TITLE_PATTERNS[type].test(v.title)) {
        results.push(v);
      }
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return results;
}

export async function fetchAllHighlights(): Promise<Record<HighlightType, YoutubeVideo[]>> {
  const cached = getCached();
  if (cached) return cached.data;

  const [race, sprint, qualifying] = await Promise.all([
    fetchType('race'),
    fetchType('sprint'),
    fetchType('qualifying'),
  ]);

  const result = { race, sprint, qualifying };
  setCache(result);
  return result;
}
