/**
 * News proxy.
 *
 * The browser used to call `api.rss2json.com` directly, which put a free
 * third-party service on the critical path for the whole News page: three
 * requests the app cannot retry, from an unauthenticated public endpoint whose
 * quota and uptime are outside our control. It also handed every visitor's IP
 * to that service.
 *
 * Fetching here instead gives one place to cache, retry and shape the result.
 * RSS2JSON is still the parser — writing an RSS parser for three feeds is not
 * worth the maintenance — but it is now an implementation detail of the server
 * rather than a client dependency.
 *
 * Caching is what makes this worth having: the feeds change on the order of
 * hours, so a 15-minute in-memory window collapses most viewer traffic into
 * one upstream request per feed per window. Vercel keeps the warm instance
 * alive for a while after a request, so this holds for bursts but not across
 * a cold start — hence `stale-while-revalidate` headers as a second layer.
 */

const RSS2JSON = 'https://api.rss2json.com/v1/api.json';

const FEEDS = [
  {
    url: 'https://www.motorsport.com/rss/f1/news/',
    source: 'Motorsport.com',
    sourceUrl: 'https://www.motorsport.com/f1/news/',
  },
  {
    url: 'https://www.autosport.com/rss/f1/news/',
    source: 'Autosport',
    sourceUrl: 'https://www.autosport.com/f1/news/',
  },
  { url: 'https://www.the-race.com/feed/', source: 'The Race', sourceUrl: 'https://www.the-race.com/' },
];

/** How long a fetched result is reused. Matches the client poll interval. */
const TTL_MS = 15 * 60_000;

/** Cap, so a malformed feed cannot balloon the response. */
const MAX_ARTICLES = 90;

let cache = null;
/** Set when a request starts serving from cache, to serve stale on error. */
let stale = null;

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

function getImage(item) {
  if (item.thumbnail) return item.thumbnail;
  if (item.enclosure?.link) return item.enclosure.link;
  const match = item.description.match(/<img[^>]+src="([^"]+)"/);
  return match?.[1] ?? '';
}

function getExcerpt(item) {
  const text = stripHtml(item.description);
  return text.length > 200 ? text.slice(0, 200) + '...' : text;
}

async function fetchFeed(feed) {
  const res = await fetch(`${RSS2JSON}?rss_url=${encodeURIComponent(feed.url)}`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`${feed.source}: ${res.status}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(`${feed.source}: ${data.status}`);

  return (data.items ?? []).map((item) => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate,
    description: getExcerpt(item),
    thumbnail: getImage(item),
    source: feed.source,
    sourceUrl: feed.sourceUrl,
    categories: item.categories ?? [],
  }));
}

async function loadAll() {
  const settled = await Promise.allSettled(FEEDS.map(fetchFeed));

  const articles = [];
  const failed = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') articles.push(...result.value);
    else failed.push(String(result.reason?.message ?? result.reason));
  }

  // One bad feed must not blank the page, but a total failure should fall back
  // to the last good payload rather than an empty grid.
  if (articles.length === 0) throw new Error(failed.join('; ') || 'all feeds empty');

  articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return { articles: articles.slice(0, MAX_ARTICLES), failed };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) {
    return res.status(200).json({ ...cache.payload, cached: true });
  }

  try {
    const payload = await loadAll();
    cache = { at: now, payload };
    stale = cache;
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    return res.status(200).json({ ...payload, cached: false });
  } catch (err) {
    if (stale) {
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.status(200).json({ ...stale.payload, cached: true, stale: true });
    }
    return res.status(502).json({ error: err.message, articles: [] });
  }
}