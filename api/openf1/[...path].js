export default async function handler(req, res) {
  const { path } = req.query;
  const target = `https://api.openf1.org/v1/${Array.isArray(path) ? path.join('/') : path}`;
  const url = new URL(target);
  url.search = new URL(req.url, 'http://localhost').search;

  const headers = {};
  const key = process.env.OPENF1_API_KEY;
  if (key) headers['Authorization'] = key;

  try {
    const upstream = await fetch(url.toString(), {
      method: req.method,
      headers,
    });
    res.status(upstream.status);
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);
    const body = await upstream.text();
    res.send(body);
  } catch {
    res.status(502).json({ error: 'Failed to reach OpenF1 API' });
  }
}
