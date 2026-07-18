export interface YoutubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  views: string;
}

export type HighlightType = 'race' | 'sprint' | 'qualifying';

const TITLE_PATTERNS: Record<HighlightType, RegExp> = {
  race: /Race Highlights.*\d{4}.*Grand Prix/i,
  sprint: /Sprint Highlights.*\d{4}.*Grand Prix/i,
  qualifying: /Qualifying Highlights.*\d{4}.*Grand Prix/i,
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

async function fetchPage(pageToken: string): Promise<{ videos: YoutubeVideo[]; nextPageToken: string | null }> {
  const params = new URLSearchParams({ maxResults: '50' });
  if (pageToken) params.set('pageToken', pageToken);
  const res = await fetch(`/api/youtube?${params}`);
  if (!res.ok) return { videos: [], nextPageToken: null };
  const data = await res.json();
  return {
    videos: (data.videos || []).map((v: YoutubeVideo) => ({
      ...v,
      _raw: v.title,
    })),
    nextPageToken: data.nextPageToken || null,
  };
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
  for (let i = 0; i < 10; i++) {
    const page = await fetchPage(pageToken);
    for (const v of page.videos) {
      if (EXCLUDE.test(v.title)) continue;
      for (const type of ['race', 'sprint', 'qualifying'] as HighlightType[]) {
        if (TITLE_PATTERNS[type].test(v.title)) {
          result[type].push(v);
        }
      }
    }
    pageToken = page.nextPageToken ?? '';
    if (!pageToken) break;
  }

  setCache(result);
  return result;
}
