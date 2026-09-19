export default async function handler(req, res) {
  const q = (req.query.q || "").trim();
  if (!q) {
    res.status(400).json({ error: "Missing q" });
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  const fields = "key,title,author_name,author_key,cover_i,first_publish_year,subject,edition_count,ratings_average,number_of_pages_median,language";
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=${fields}&limit=20`;

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "MediaVault/1.0 (+vercel proxy, contact: not-provided)" },
    });

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
