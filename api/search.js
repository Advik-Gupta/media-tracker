// api/search.js
export default async function handler(req, res) {
  const { q } = req.query;
  const apiRes = await fetch(
    `https://seriesgraph-api.example/search?q=${encodeURIComponent(q)}`,
  );
  const data = await apiRes.json();
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate");
  res.status(200).json(data);
}
