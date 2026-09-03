/* ============================================================
   OMDb - used ONLY by the My List page, to look up titles that
   are not in any of the built-in catalogues.

   Put your key below. Without it the watchlist still works
   exactly as before; entries simply keep the placeholder tile.

   Get one free at https://www.omdbapi.com/apikey.aspx
   ============================================================ */

const OMDB_KEY = "708d81d7"; //  <-- paste your OMDb API key here

const OMDb = (() => {
  const BASE = "https://www.omdbapi.com/";
  const CACHE_KEY = "watchvault.omdb.v1";

  /* Responses are cached in localStorage so the same title is never looked up
     twice - the free tier allows 1,000 requests a day. */
  let cache = {};
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    cache = {};
  }
  const saveCache = () => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      /* full - skip */
    }
  };

  const enabled = () => !!OMDB_KEY;

  async function call(params) {
    if (!enabled()) return null;
    const qs = new URLSearchParams({ apikey: OMDB_KEY, ...params });
    const key = qs.toString().replace(OMDB_KEY, "");
    if (cache[key] !== undefined) return cache[key];
    try {
      const res = await fetch(`${BASE}?${qs}`);
      const json = await res.json();
      const ok = json && json.Response !== "False" ? json : null;
      cache[key] = ok;
      saveCache();
      return ok;
    } catch (e) {
      console.warn("OMDb request failed:", e);
      return null;
    }
  }

  const clean = (v) => (v && v !== "N/A" ? v : null);

  const list = (v) => {
    const c = clean(v);
    return c ? c.split(",").map((x) => x.trim()).filter(Boolean) : [];
  };

  /** Normalise an OMDb payload. Everything it gives is kept — the My List
      card shows the lot, and a second request to fill in a field we already
      had would be wasted against the daily allowance. */
  function shape(d) {
    if (!d) return null;
    const runtime = clean(d.Runtime);
    const scores = {};
    (d.Ratings || []).forEach((r) => {
      if (r.Source === "Rotten Tomatoes") scores.rt = r.Value;
      if (r.Source === "Metacritic") scores.mc = r.Value;
    });

    return {
      title: d.Title,
      year: clean(d.Year) ? String(d.Year).slice(0, 4) : null,
      poster: clean(d.Poster),
      mins: runtime ? parseInt(runtime, 10) || null : null,
      imdbID: clean(d.imdbID),
      rating: clean(d.imdbRating) ? parseFloat(d.imdbRating) : null,
      votes: clean(d.imdbVotes),
      genres: list(d.Genre),
      director: clean(d.Director),
      writers: list(d.Writer),
      cast: list(d.Actors),
      plot: clean(d.Plot),
      languages: list(d.Language),
      countries: list(d.Country),
      awards: clean(d.Awards),
      rated: clean(d.Rated),
      released: clean(d.Released),
      boxOffice: clean(d.BoxOffice),
      metascore: clean(d.Metascore),
      rt: scores.rt || null,
      mc: scores.mc || null,
      kind: clean(d.Type),
    };
  }

  return {
    enabled,

    /** Up to five candidates for a partial title. */
    async search(term) {
      const d = await call({ s: term, type: "" });
      if (!d || !Array.isArray(d.Search)) return [];
      return d.Search.slice(0, 5).map((x) => ({
        title: x.Title,
        year: String(x.Year).slice(0, 4),
        poster: clean(x.Poster),
        imdbID: x.imdbID,
        kind: x.Type,
      }));
    },

    /** Full detail by exact title, or by IMDb id when we have one. */
    async lookup({ title, year, imdbID }) {
      const d = imdbID
        ? await call({ i: imdbID, plot: "full" })
        : await call({ t: title, y: year || "", plot: "full" });
      return shape(d);
    },
  };
})();
