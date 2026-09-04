/* ============================================================
   USER VAULT — shows and anime a visitor added for themselves.

   The built-in catalogue is generated at build time and is the
   same for everyone. This is the other half: anything you add
   from the site lives in your own browser, and nobody else sees
   it. No accounts, no server, no shared state.

   Two stores, deliberately separate:

     mediavault.myshows   what you added — ids, names, posters.
                          Yours, so it goes in the export.
     mediavault.showdata  the season and episode data behind
                          them. Refetchable from the API, so it
                          stays out of the export and can be
                          thrown away at any time.

   A user-added universe is keyed `u<tmdb id>`, which cannot
   collide with the slug-based ids the build generates. Episode
   progress keys are identical to the built-in ones
   (`e<showId>-<season>x<episode>`), so ticking, filler marking
   and the ongoing override all work unchanged.
   ============================================================ */

const UserVault = (() => {
  const LIST_KEY = "mediavault.myshows";
  const DATA_KEY = "mediavault.showdata";

  const read = (key, fallback) => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "null");
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      /* quota, or a private window */
      return false;
    }
  };

  const uniOf = (tmdbId) => `u${tmdbId}`;

  /* ---------- the API's shape, turned into the build's shape ----------
     build/seriesgraph.js does this server-side when it generates a page.
     The same mapping runs here so the renderer cannot tell the difference
     between a show that was built in and one added five seconds ago. */

  const IMG = "https://image.tmdb.org/t/p";

  function transform(hit, detail, seasonsRaw) {
    const seasons = (Array.isArray(seasonsRaw) ? seasonsRaw : [])
      .filter((s) => s.season_number > 0 && (s.episodes || []).length)
      .map((s) => ({
        n: s.season_number,
        episodes: s.episodes
          .slice()
          .sort((a, b) => a.episode_number - b.episode_number)
          .map((e) => ({
            n: e.episode_number,
            t: e.name || `Episode ${e.episode_number}`,
            r: e.imdb_rating != null ? e.imdb_rating : (e.vote_average ?? null),
            v: e.imdb_votes || e.num_votes || 0,
            d: e.air_date || "",
            m: e.runtime || 0,
            s: e.still_path ? `${IMG}/w300${e.still_path}` : "",
            o: e.overview || "",
          })),
      }))
      .sort((a, b) => a.n - b.n);

    const poster = hit.poster_path
      ? `${IMG}/w342${hit.poster_path}`
      : detail && detail.poster_path
        ? `${IMG}/w342${detail.poster_path}`
        : "";

    return {
      shows: [
        {
          id: Number(hit.id),
          title: hit.name,
          year: String(hit.first_air_date || (detail && detail.first_air_date) || "").slice(0, 4),
          score: hit.vote_average ? Math.round(hit.vote_average * 10) / 10 : null,
          status: (detail && detail.status) || "Unknown",
          lastAir: (detail && detail.last_air_date) || "",
          poster,
          backdrop: hit.backdrop_path ? `${IMG}/w780${hit.backdrop_path}` : "",
          overview: hit.overview || "",
          seasons,
        },
      ],
      films: [],
    };
  }

  /* An episode counts as still to come if it is dated ahead, or announced
     with neither a date nor a rating. Same rule as build/build.js. */
  function unairedIn(show) {
    let n = 0;
    const now = Date.now();
    (show.seasons || []).forEach((se) =>
      se.episodes.forEach((ep) => {
        const future = ep.d && new Date(ep.d).getTime() > now;
        const announced = !ep.d && ep.r == null;
        if (future || announced) n += 1;
      }),
    );
    return n;
  }

  /** The `_counts.js` row for a user-added show, derived the same way. */
  function countsFor(data) {
    const now = Date.now();
    const shows = data.shows || [];
    let episodes = 0;

    const perShow = shows.map((sh) => {
      let aired = 0;
      (sh.seasons || []).forEach((se) =>
        se.episodes.forEach((ep) => {
          if (ep.d && new Date(ep.d).getTime() <= now) aired += 1;
        }),
      );
      episodes += aired;
      return {
        id: sh.id,
        title: sh.title,
        episodes: aired,
        ongoing: unairedIn(sh) > 0,
        poster: sh.poster || "",
      };
    });

    const live = shows.filter((sh) => unairedIn(sh) > 0);

    return {
      perShow,
      primary: perShow[0] ? perShow[0].id : null,
      episodes,
      films: 0,
      shows: shows.length,
      poster: (shows[0] || {}).poster || "",
      ongoing: live.length > 0,
      ongoingTitles: live.map((sh) => sh.title),
      upcoming: live.reduce((n, sh) => n + unairedIn(sh), 0),
      lastAir: shows.map((sh) => sh.lastAir || "").sort().pop() || "",
    };
  }

  return {
    uniOf,
    transform,
    countsFor,

    /** Everything this browser has added, newest first. */
    list() {
      const v = read(LIST_KEY, []);
      return Array.isArray(v) ? v : [];
    },

    has(tmdbId) {
      return this.list().some((x) => String(x.id) === String(tmdbId));
    },

    /** The season/episode data for one, if it is still cached. */
    data(uni) {
      return read(DATA_KEY, {})[uni] || null;
    },

    setData(uni, data) {
      const all = read(DATA_KEY, {});
      all[uni] = data;
      return write(DATA_KEY, all);
    },

    /**
     * Add a show. `data` is the transformed series payload; it is cached
     * immediately because the Add panel already fetched it for the preview,
     * so opening the page afterwards costs no further requests.
     */
    add(entry, data) {
      const list = this.list();
      const uni = uniOf(entry.id);
      if (list.some((x) => x.uni === uni)) return false;

      list.unshift({
        id: Number(entry.id),
        uni,
        name: entry.name,
        kind: entry.kind === "anime" ? "anime" : "show",
        poster: entry.poster || "",
        year: entry.year || "",
        addedAt: Date.now(),
      });

      write(LIST_KEY, list);
      if (data) this.setData(uni, data);
      return true;
    },

    remove(uni) {
      write(LIST_KEY, this.list().filter((x) => x.uni !== uni));
      const all = read(DATA_KEY, {});
      delete all[uni];
      write(DATA_KEY, all);
    },

    /** Shaped like a registry entry, so the vault grid can render it. */
    asUniverses(kind) {
      return this.list()
        .filter((x) => !kind || x.kind === kind)
        .map((x) => ({
          id: x.uni,
          kind: x.kind,
          name: x.name,
          tagline: x.year ? `Added · from ${x.year}` : "Added by you",
          cover: x.poster,
          href: `pages/${x.kind === "anime" ? "anime" : "shows"}/view.html?id=${x.id}`,
          accent: "#6a9ee8",
          accent2: "#22436b",
          userAdded: true,
        }));
    },

    /** Counts for every added show that still has its data cached. */
    counts() {
      const out = {};
      const cache = read(DATA_KEY, {});
      this.list().forEach((x) => {
        const d = cache[x.uni];
        if (d) out[x.uni] = countsFor(d);
      });
      return out;
    },
  };
})();
