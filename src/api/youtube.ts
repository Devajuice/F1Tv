export interface YoutubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  views: string;
}

export type HighlightType = 'race' | 'sprint' | 'qualifying';

const TITLE_PATTERNS: Record<HighlightType, RegExp> = {
  race: /^Race Highlights \| \d{4} .* Grand Prix$/i,
  sprint: /^Sprint Highlights \| \d{4} .* Grand Prix$/i,
  qualifying: /^Qualifying Highlights \| \d{4} .* Grand Prix$/i,
};

const TAB_QUERIES: Record<HighlightType, string> = {
  race: 'race highlights',
  sprint: 'sprint highlights',
  qualifying: 'qualifying highlights',
};

export async function fetchHighlights(type: HighlightType): Promise<YoutubeVideo[]> {
  const res = await fetch(`/api/youtube?q=${encodeURIComponent(TAB_QUERIES[type])}&maxResults=50`);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();
  const pattern = TITLE_PATTERNS[type];
  return (data.videos || []).filter((v: YoutubeVideo) => pattern.test(v.title));
}
