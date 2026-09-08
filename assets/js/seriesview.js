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

  const known = builtIn(id);
  const uni = known ? known.uni : UserVault.uniOf(id);
  const showIds = known ? known.meta.perShow.map((s) => String(s.id)) : [id];

  const FRESH_MS = 15 * 60 * 1000;

  async function load({ force } = {}) {
    const cached = UserVault.data(uni);

    if (cached) {
      render(cached, { stale: false });
      if (!force && UserVault.dataAge(uni) < FRESH_MS) return;
    } else {
      statusEl.hidden = false;
      statusEl.innerHTML = `<i class="spinner"></i>${force ? "Refreshing" : "Fetching episodes"}…`;
    }

    let failed = false;

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
      const changed = JSON.stringify(data) !== JSON.stringify(cached);
      UserVault.setData(uni, data);
      if (!cached || changed) return render(data, { stale: false });
      return;
    }

    if (cached) {
      statusEl.hidden = false;
      statusEl.innerHTML =
        '<div class="view-stale">Showing the last saved copy - refreshing it failed.</div>';
      return;
    }

    fail(
      failed
        ? "Could not reach the episode API."
        : "No episode data for this id.",
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

    const seasonCount = (show.seasons || []).length;
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
    s.src = "assets/js/series.js";
    document.body.appendChild(s);
  }

  document.getElementById("viewRefresh").addEventListener("click", () => {
    load({ force: true });
  });

  load();
})();
