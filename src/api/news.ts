export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail: string;
  source: string;
  sourceUrl: string;
  categories: string[];
}

export interface NewsResponse {
  articles: NewsArticle[];
  cached: boolean;
  stale?: boolean;
}

async function getNews(): Promise<NewsResponse> {
  const res = await fetch('/api/news', { headers: { accept: 'application/json' } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `News feed unavailable (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch the aggregated feed.
 *
 * Goes through our own `/api/news` function rather than rss2json.com
 * directly: that keeps the free third-party parser off the client, lets every
 * visitor share one cached fetch instead of each making three, and gives the
 * server a place to retry and fall back to its last good payload. See
 * `api/news.js`.
 */
export function fetchNews(): Promise<NewsResponse> {
  return getNews();
}