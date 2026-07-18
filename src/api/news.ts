const RSS2JSON = 'https://api.rss2json.com/v1/api.json';

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

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail: string;
  enclosure?: { link: string };
  categories: string[];
}

interface Rss2Json {
  status: string;
  items: RssItem[];
  feed: { title: string };
}

const FEEDS = [
  { url: 'https://www.motorsport.com/rss/f1/news/', source: 'Motorsport.com', sourceUrl: 'https://www.motorsport.com/f1/news/' },
  { url: 'https://www.autosport.com/rss/f1/news/', source: 'Autosport', sourceUrl: 'https://www.autosport.com/f1/news/' },
  { url: 'https://www.the-race.com/feed/', source: 'The Race', sourceUrl: 'https://www.the-race.com/' },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

function getImage(item: RssItem): string {
  if (item.thumbnail) return item.thumbnail;
  if (item.enclosure?.link) return item.enclosure.link;
  const match = item.description.match(/<img[^>]+src="([^"]+)"/);
  return match?.[1] ?? '';
}

function getExcerpt(item: RssItem): string {
  const text = stripHtml(item.description);
  return text.length > 200 ? text.slice(0, 200) + '...' : text;
}

export async function fetchNews(): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const res = await fetch(`${RSS2JSON}?rss_url=${encodeURIComponent(feed.url)}`);
      if (!res.ok) return [];
      const data: Rss2Json = await res.json();
      if (data.status !== 'ok') return [];
      return data.items.map((item) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        description: getExcerpt(item),
        thumbnail: getImage(item),
        source: feed.source,
        sourceUrl: feed.sourceUrl,
        categories: item.categories ?? [],
      }));
    })
  );

  const all: NewsArticle[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }

  all.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return all;
}
