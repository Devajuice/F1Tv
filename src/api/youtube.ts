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

export async function fetchHighlights(type: HighlightType): Promise<YoutubeVideo[]> {
  const allVideos: YoutubeVideo[] = [];
  let pageToken = '';

  for (let i = 0; i < 5 && allVideos.length < 30; i++) {
    const params = new URLSearchParams({ maxResults: '50' });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`/api/youtube?${params}`);
    if (!res.ok) break;
    const data = await res.json();

    for (const v of data.videos || []) {
      if (TITLE_PATTERNS[type].test(v.title) && !EXCLUDE.test(v.title)) {
        allVideos.push(v);
      }
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return allVideos;
}
