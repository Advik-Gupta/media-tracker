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
    document.title = "Not found - Media Vault";
  }

  if (!/^\d+$/.test(id)) {
    fail("No show specified.", "This page needs a TMDB id, like ?id=1396.");
    return;
  }

  function builtIn(tmdbId) {
    const counts = window.SERIES_COUNTS || {};
    for (const [uniId, meta] of Object.entries(counts)) {
      if ((meta.perShow || []).some((s) => String(s.id) === String(tmdbId))) {
        return { uni: uniId, meta };
      }
    }
    return null;
  }

  const saved = UserVault.entry(id);
  const hostId = saved ? UserVault.hostOf(id) : null;
  if (saved && String(hostId) !== String(id)) {
    params.set("id", hostId);
    location.replace(`${location.pathname}?${params}`);
    return;
  }

  const known = saved ? null : builtIn(id);
  const uni = known ? known.uni : UserVault.uniOf(id);
  const memberIds = () =>
    saved
      ? UserVault.members(id).map((m) => String(m.id))
      : known
        ? known.meta.perShow.map((s) => String(s.id))
        : [id];

  const FRESH_MS = 15 * 60 * 1000;

  async function fetchShow(sid) {
    try {
      const [dr, sr] = await Promise.all([
        fetch(`${API}/show/${sid}`),
        fetch(`${API}/show/${sid}/seasons`),
      ]);
      if (!dr.ok || !sr.ok) return null;
      const detail = await dr.json();
      const seasons = await sr.json();
      if (!detail || !Array.isArray(seasons) || !seasons.length) return null;
      const entry = UserVault.entry(sid) || {};
      const hit = {
        id: Number(sid),
        name: detail.name || entry.name || "Untitled",
        first_air_date: detail.first_air_date || "",
        vote_average: detail.vote_average,
        poster_path: detail.poster_path,
        backdrop_path: detail.backdrop_path,
        overview: entry.overview || "",
      };
      return UserVault.transform(hit, detail, seasons).shows[0];
    } catch (e) {
      return null;
    }
  }

  function defaultUnits(shows, films) {
    return [
      ...shows.flatMap((sh) => sh.seasons.map((se) => `s:${sh.id}:${se.k != null ? se.k : se.n}`)),
      ...films.map((f) => `f:${f.key}`),
    ];
  }

  function compose(shows) {
    if (!saved) return { shows, films: [] };
    const page = UserVault.page(id);
    const gone = new Set(page.hidden);
    const hiddenSeasons = [];
    shows = shows.map((sh) => ({
      ...sh,
      seasons: sh.seasons.filter((se) => {
        const key = `s:${sh.id}:${se.n}`;
        if (!gone.has(key)) return true;
        hiddenSeasons.push({ key, title: sh.title, n: se.n, episodes: se.episodes.length });
        return false;
      }),
    }));
    shows = shows.map((sh) => ({
      ...sh,
      seasons: sh.seasons.flatMap((se) => {
        const cuts = (page.splits[`s:${sh.id}:${se.n}`] || [])
          .map(Number)
          .filter((c) => c > 0)
          .sort((a, b) => a - b);
        if (!cuts.length) return [se];
        const edges = [0, ...cuts, Infinity];
        const parts = [];
        for (let i = 0; i < edges.length - 1; i++) {
          const eps = se.episodes.filter((ep) => ep.n > edges[i] && ep.n <= edges[i + 1]);
          if (!eps.length) continue;
          parts.push({
            ...se,
            k: `${se.n}p${i + 1}`,
            label: `Ep ${eps[0].n}–${eps[eps.length - 1].n}`,
            episodes: eps,
          });
        }
        return parts.length > 1 ? parts : [se];
      }),
    }));
    const films = page.films.map((f) => ({ ...f, film: f.key }));
    const valid = new Set(defaultUnits(shows, films));
    const units = page.units.filter((x) => valid.has(x));
    defaultUnits(shows, films).forEach((x) => {
      if (units.includes(x)) return;
      const [type, showId, n] = x.split(":");
      if (type !== "s") return units.push(x);
      const rank = (k) => {
        const [season, part] = String(k).split("p");
        return Number(season) * 10000 + (Number(part) || 0);
      };
      let after = -1;
      let first = -1;
      units.forEach((u, i) => {
        const [t, sid, sn] = u.split(":");
        if (t !== "s" || sid !== showId) return;
        if (first < 0) first = i;
        if (rank(sn) < rank(n)) after = i;
      });
      if (after >= 0) units.splice(after + 1, 0, x);
      else if (first >= 0) units.splice(first, 0, x);
      else units.push(x);
    });
    const buckets = {};
    shows.forEach((sh) => (buckets[sh.id] = UserVault.uniOf(sh.id)));
    return { shows, films, units, buckets, hiddenSeasons, splits: page.splits, hostId: Number(id) };
  }

  async function load({ force } = {}) {
    const ids = memberIds();
    const cacheKey = (sid) => (saved ? UserVault.uniOf(sid) : uni);

    const fromCache = () => {
      if (!saved) {
        const whole = UserVault.data(uni);
        return whole ? whole.shows || [] : null;
      }
      const out = ids.map((sid) => {
        const d = UserVault.data(cacheKey(sid));
        return d && d.shows && d.shows[0] ? d.shows[0] : null;
      });
      return out.every(Boolean) ? out : null;
    };

    const cached = fromCache();
    const fresh = ids.every((sid) => UserVault.dataAge(cacheKey(sid)) < FRESH_MS);

    if (cached) {
      render(compose(cached), { stale: false });
      if (!force && fresh) return;
    } else {
      statusEl.hidden = false;
      statusEl.innerHTML = `<i class="spinner"></i>${force ? "Refreshing" : "Fetching episodes"}…`;
    }

    const fetched = await Promise.all(ids.map(fetchShow));
    const failed = fetched.some((x) => !x);
    const good = fetched.filter(Boolean);

    if (good.length) {
      let shows = good;
      if (saved) {
        good.forEach((sh) => UserVault.setData(UserVault.uniOf(sh.id), { shows: [sh], films: [] }));
        shows = ids
          .map((sid) => {
            const d = UserVault.data(UserVault.uniOf(sid));
            return d && d.shows ? d.shows[0] : null;
          })
          .filter(Boolean);
      } else {
        UserVault.setData(uni, { shows, films: [] });
      }
      const changed = !cached || JSON.stringify(shows) !== JSON.stringify(cached);
      if (changed) return render(compose(shows), { stale: false });
      return;
    }

    if (cached) {
      statusEl.hidden = false;
      statusEl.innerHTML =
        '<div class="view-stale">Showing the last saved copy - refreshing it failed.</div>';
      return;
    }

    fail(
      failed ? "Could not reach the episode API." : "No episode data for this id.",
      failed
        ? "The /api proxy is unavailable on this host, or the upstream is down. Nothing is cached for this show yet."
        : "The API returned no seasons for it.",
    );
  }

  let seriesLoaded = false;

  function render(data, { stale }) {
    const show = (data.shows || [])[0];
    if (!show) return fail("This show has no seasons listed.");

    window.SERIES = window.SERIES || {};
    window.SERIES[uni] = data;

    window.SERIES_COUNTS = window.SERIES_COUNTS || {};
    window.SERIES_COUNTS[uni] = UserVault.countsFor(data);

    document.body.dataset.universe = uni;

    const seasonCount = new Set((show.seasons || []).map((se) => se.n)).size;
    const epCount = (show.seasons || []).reduce(
      (n, s) => n + s.episodes.length,
      0,
    );

    document.title = `${show.title} - Media Vault`;
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
        '<div class="view-stale">Showing the last saved copy - the live fetch failed.</div>';
    }

    if (seriesLoaded) {
      location.reload();
      return;
    }
    seriesLoaded = true;
    const s = document.createElement("script");
    const stamped = document.getElementById("seriesSrc");
    s.src = (stamped && stamped.getAttribute("href")) || "assets/js/series.js";
    s.onload = () => {
      if (!data.hostId) return;
      const edit = document.createElement("script");
      const editSrc = document.getElementById("pageEditSrc");
      edit.src = (editSrc && editSrc.getAttribute("href")) || "assets/js/pageedit.js";
      document.body.appendChild(edit);
    };
    document.body.appendChild(s);
  }

  document.getElementById("viewRefresh").addEventListener("click", () => {
    load({ force: true });
  });

  load();
})();
