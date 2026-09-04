/* ============================================================
   SERIES VIEW — one page that renders any show or anime by id.

   This replaces the per-show HTML files the build used to
   generate. It reads ?id= from the URL, fetches the show through
   the /api proxy, shapes the response into exactly what
   build/seriesgraph.js used to bake in, and only then loads
   series.js — which cannot tell the difference and renders the
   season grid, filler marking, ticking and the rest unchanged.

   Data is fetched fresh on every visit, so a show that gained a
   season shows it without anything being rebuilt. The last good
   response is kept in local storage and used only when the
   network fails, so a flaky connection degrades to slightly old
   data rather than an empty page.

   Progress is never fetched. It lives in this browser, keyed the
   same way it always was.
   ============================================================ */

(() => {
  const API = "/api";

  const params = new URLSearchParams(location.search);
  const id = (params.get("id") || "").trim();

  const statusEl = document.getElementById("viewStatus");
  const titleEl = document.getElementById("viewTitle");
  const crumbEl = document.getElementById("viewCrumb");
  const eyebrowEl = document.getElementById("viewEyebrow");
  const ledeEl = document.getElementById("viewLede");

  const VAULT = document.body.dataset.mode === "anime" ? "anime" : "show";
  const HOME = `pages/${VAULT === "anime" ? "anime" : "shows"}.html`;

  function fail(message, detail) {
    statusEl.innerHTML = `
      <div class="view-fail">
        <b>${message}</b>
        ${detail ? `<p>${detail}</p>` : ""}
        <a class="btn" href="${HOME}">← Back to the vault</a>
      </div>`;
    titleEl.textContent = "Not found";
    crumbEl.textContent = "/ Not found";
    document.title = "Not found — Media Vault";
  }

  if (!/^\d+$/.test(id)) {
    fail("No show specified.", "This page needs a TMDB id, like ?id=1396.");
    return;
  }

  /* ---------- which universe this is ----------
     A built-in show already has a universe id, a progress bucket full of
     ticks, and possibly several series merged under it. Reusing `u<tmdb>`
     here would orphan all of that, so the episode index is checked first:
     if some built-in universe owns this id, the page adopts that universe
     wholesale — its id for progress, and every show under it. */
  function builtIn(tmdbId) {
    const counts = window.SERIES_COUNTS || {};
    for (const [uniId, meta] of Object.entries(counts)) {
      if ((meta.perShow || []).some((s) => String(s.id) === String(tmdbId))) {
        return { uni: uniId, meta };
      }
    }
    return null;
  }

  const known = builtIn(id);
  const uni = known ? known.uni : UserVault.uniOf(id);
  /* Every TMDB id this page has to fetch — more than one when series were
     merged together, e.g. Breaking Bad and Better Call Saul. */
  const showIds = known
    ? known.meta.perShow.map((s) => String(s.id))
    : [id];

  /* ---------- fetch ---------- */

  async function load({ force } = {}) {
    statusEl.hidden = false;
    statusEl.innerHTML = `<i class="spinner"></i>${force ? "Refreshing" : "Fetching episodes"}…`;

    let failed = false;

    /* One fetch pair per show — usually one, more when series are merged. */
    const fetched = await Promise.all(
      showIds.map(async (sid) => {
        try {
          const [dr, sr] = await Promise.all([
            fetch(`${API}/show/${sid}`),
            fetch(`${API}/show/${sid}/seasons`),
          ]);
          if (!dr.ok || !sr.ok) {
            failed = true;
            return null;
          }
          return { sid, detail: await dr.json(), seasons: await sr.json() };
        } catch (e) {
          failed = true;
          return null;
        }
      }),
    );

    const good = fetched.filter(
      (x) => x && x.detail && Array.isArray(x.seasons) && x.seasons.length,
    );

    if (good.length) {
      const saved = UserVault.list().find((x) => x.uni === uni) || {};
      /* Each show is transformed on its own, then the results are combined
         so a merged universe renders as the several series it holds. */
      const shows = good.map((x) => {
        const hit = {
          id: Number(x.sid),
          name: x.detail.name || saved.name || "Untitled",
          first_air_date: x.detail.first_air_date || "",
          vote_average: x.detail.vote_average,
          poster_path: x.detail.poster_path,
          backdrop_path: x.detail.backdrop_path,
          overview: saved.overview || "",
        };
        return UserVault.transform(hit, x.detail, x.seasons).shows[0];
      });

      const data = { shows, films: [] };
      UserVault.setData(uni, data);
      return render(data, { stale: false });
    }

    /* Live fetch did not work — fall back to whatever was stored last. */
    const cached = UserVault.data(uni);
    if (cached) return render(cached, { stale: true });

    fail(
      failed ? "Could not reach the episode API." : "No episode data for this id.",
      failed
        ? "The /api proxy is unavailable on this host, or the upstream is down. Nothing is cached for this show yet."
        : "The API returned no seasons for it.",
    );
  }

  /* ---------- render ---------- */

  let seriesLoaded = false;

  function render(data, { stale }) {
    const show = (data.shows || [])[0];
    if (!show) return fail("This show has no seasons listed.");

    /* Everything series.js reads, put where it expects to find it. */
    window.SERIES = window.SERIES || {};
    window.SERIES[uni] = data;

    window.SERIES_COUNTS = window.SERIES_COUNTS || {};
    window.SERIES_COUNTS[uni] = UserVault.countsFor(data);

    document.body.dataset.universe = uni;

    const seasonCount = (show.seasons || []).length;
    const epCount = (show.seasons || []).reduce((n, s) => n + s.episodes.length, 0);

    document.title = `${show.title} — Media Vault`;
    crumbEl.textContent = `/ ${show.title}`;
    titleEl.textContent = show.title;
    eyebrowEl.textContent = [
      show.year,
      `${seasonCount} season${seasonCount === 1 ? "" : "s"}`,
      `${epCount} episodes`,
    ]
      .filter(Boolean)
      .join(" · ");
    ledeEl.textContent = show.overview || "";

    statusEl.hidden = !stale;
    if (stale) {
      statusEl.innerHTML =
        '<div class="view-stale">Showing the last saved copy — the live fetch failed.</div>';
    }

    /* series.js is an IIFE that reads the data the moment it runs, so it is
       loaded only now. On a refresh it is already in memory, so the page is
       reloaded instead of trying to re-run it. */
    if (seriesLoaded) {
      location.reload();
      return;
    }
    seriesLoaded = true;
    const s = document.createElement("script");
    s.src = "assets/js/series.js";
    document.body.appendChild(s);
  }

  document.getElementById("viewRefresh").addEventListener("click", () => {
    load({ force: true });
  });

  load();
})();
