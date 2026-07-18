export default async function handler(req, res) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'YOUTUBE_API_KEY not configured' });
  }

  const { pageToken = '' } = req.query;
  const playlistId = 'UUB_qr75-ydFVKSF9Dmo6izg';

  const params = new URLSearchParams({
    part: 'snippet',
    playlistId,
    maxResults: '50',
    key: API_KEY,
  });
  if (pageToken) params.set('pageToken', pageToken);

  try {
    const apiRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
    const data = await apiRes.json();

    if (!apiRes.ok) {
      return res.status(apiRes.status).json(data);
    }

    const videoIds = (data.items || [])
      .map((item) => item.snippet?.resourceId?.videoId)
      .filter(Boolean);

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

    const videos = (data.items || []).map((item) => {
      const id = item.snippet?.resourceId?.videoId || '';
      return {
        id,
        title: item.snippet?.title || '',
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
        published: item.snippet?.publishedAt?.split('T')[0] || '',
        views: statsMap[id] || '',
      };
    });

    return res.status(200).json({
      videos,
      nextPageToken: data.nextPageToken || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
