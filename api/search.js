// api/search.js
//
// Proxies seriesgraph.com's show search. The browser cannot call that API
// directly — it sends no Access-Control-Allow-Origin header — so this runs
// server-side, where CORS does not apply, and adds the header itself on the
// way back out.
//
// GET /api/search?q=<title>

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
    // Search results change; a short, revalidating cache keeps repeat
    // keystrokes cheap without serving stale results for long.
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream unreachable" });
  }
}
