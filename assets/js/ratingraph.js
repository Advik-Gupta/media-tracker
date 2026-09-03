/* ============================================================
   RATINGRAPH — live title search.

   ratingraph's search endpoint sends CORS headers, so the browser
   can call it. Its detail pages do not, which is why the genres
   and ratings on the catalogue are baked in by build/ratingraph.js
   instead of fetched here.

   Everything is cached per query for the life of the page, so
   arrowing back and forth over the same search costs nothing.
   ============================================================ */

window.RatingGraph = (() => {
  const SITE = "https://www.ratingraph.com";
  const CDN = "https://cdn.ratingraph.com";
  const cache = new Map();

  /** One result: { id, title, year, kind, poster, path }. */
  function shape(r) {
    const id = (String(r.path || "").match(/-(\d+)\/?$/) || [])[1] || null;
    return {
      id,
      title: r.name,
      year: r.start || "",
      endYear: r.end || "",
      kind: r.toplist === "movie" ? "movie" : "series",
      poster: r.poster ? CDN + r.poster : "",
      path: r.path ? SITE + r.path : "",
    };
  }

  async function search(query, { signal } = {}) {
    const q = String(query || "").trim();
    if (q.length < 2) return [];
    if (cache.has(q)) return cache.get(q);

    const res = await fetch(`${SITE}/search-items/${encodeURIComponent(q)}/`, {
      signal,
    });
    if (!res.ok) throw new Error(`search failed (${res.status})`);

    const data = await res.json();
    const first = (data.items || [])[0] || {};
    const out = (first.results || []).map(shape).filter((r) => r.id);

    cache.set(q, out);
    return out;
  }

  return { search };
})();
