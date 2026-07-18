export default async function handler(req, res) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'YOUTUBE_API_KEY not configured' });
  }

  const { q = '', maxResults = '50', pageToken = '' } = req.query;
  const channelId = 'UCB_qr75-ydFVKSF9Dmo6izg';

  const searchParams = new URLSearchParams({
    part: 'snippet',
    channelId,
    type: 'video',
    order: 'date',
    maxResults,
    key: API_KEY,
  });
  if (q) searchParams.set('q', q);
  if (pageToken) searchParams.set('pageToken', pageToken);

  try {
    const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams}`);
    const searchData = await searchRes.json();

    if (!searchRes.ok) {
      return res.status(searchRes.status).json(searchData);
    }

    const videoIds = (searchData.items || []).map((item) => item.id.videoId).filter(Boolean);

    let statsMap = {};
    if (videoIds.length > 0) {
      const statsParams = new URLSearchParams({
        part: 'statistics',
        id: videoIds.join(','),
        key: API_KEY,
      });
      const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${statsParams}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        for (const item of statsData.items || []) {
          const views = parseInt(item.statistics?.viewCount || '0', 10);
          statsMap[item.id] = views >= 1_000_000
            ? `${(views / 1_000_000).toFixed(1)}M`
            : views >= 1_000
              ? `${(views / 1_000).toFixed(1)}K`
              : String(views);
        }
      }
    }

    const videos = (searchData.items || []).map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
      published: item.snippet.publishedAt?.split('T')[0] || '',
      views: statsMap[item.id.videoId] || '',
    }));

    return res.status(200).json({
      videos,
      nextPageToken: searchData.nextPageToken || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
