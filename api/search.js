export default async function handler(req, res) {
  const q = (req.query.q || "").trim();
  if (!q) {
    res.status(400).json({ error: "Missing q" });
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const upstream = await fetch(
      `https://seriesgraph.com/api/shows/search?searchTerm=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": "MediaVault/1.0 (+vercel proxy)" } },
    );

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }

    const data = await upstream.json();
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream unreachable" });
  }
}
