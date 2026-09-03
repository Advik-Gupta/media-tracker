// api/show/[id].js
export default async function handler(req, res) {
  const { id } = req.query;

  const apiRes = await fetch(`https://seriesgraph-api.example/shows/${id}`);
  if (!apiRes.ok) {
    return res.status(apiRes.status).json({ error: "Upstream error" });
  }
  const data = await apiRes.json();

  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate"); // edge caching
  res.status(200).json(data);
}
