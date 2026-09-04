// api/show/[id]/seasons.js
//
// Proxies seriesgraph.com's season-ratings — every season and episode,
// with its rating. Used for the preview in the Add Show panel, so you can
// see the season/episode count before you commit to adding something.
//
// GET /api/show/<tmdb id>/seasons

export default async function handler(req, res) {
  const { id } = req.query;
  if (!/^\d+$/.test(String(id || ""))) {
    res.status(400).json({ error: "id must be a TMDB show id" });
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const upstream = await fetch(
      `https://seriesgraph.com/api/shows/${id}/season-ratings`,
      { headers: { "User-Agent": "MediaVault/1.0 (+vercel proxy)" } },
    );

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }

    const data = await upstream.json();
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream unreachable" });
  }
}
