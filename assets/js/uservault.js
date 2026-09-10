const UserVault = (() => {
  const LIST_KEY = "mediavault.myshows";
  const DATA_KEY = "mediavault.showdata";
  const META_KEY = "mediavault.showdata.meta";
  const WISH_KEY = "mediavault.mywishlist";

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
      return false;
    }
  };

  const uniOf = (tmdbId) => `u${tmdbId}`;

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

    list() {
      const v = read(LIST_KEY, []);
      return Array.isArray(v) ? v : [];
    },

    has(tmdbId) {
      return this.list().some(
        (x) => String(x.id) === String(tmdbId) || x.uni === this.uniFor(tmdbId),
      );
    },

    data(uni) {
      return read(DATA_KEY, {})[uni] || null;
    },

    dataAge(uni) {
      const at = read(META_KEY, {})[uni];
      return at ? Date.now() - at : Infinity;
    },

    setData(uni, data) {
      const all = read(DATA_KEY, {});
      all[uni] = data;
      const meta = read(META_KEY, {});
      meta[uni] = Date.now();
      write(META_KEY, meta);
      return write(DATA_KEY, all);
    },

    uniFor(tmdbId) {
      const counts = window.SERIES_COUNTS || {};
      for (const [uniId, meta] of Object.entries(counts)) {
        if (uniId.startsWith("u")) continue;
        if ((meta.perShow || []).some((s) => String(s.id) === String(tmdbId))) {
          return uniId;
        }
      }
      return uniOf(tmdbId);
    },

    add(entry, data) {
      const list = this.list();
      const uni = this.uniFor(entry.id);
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
      const meta = read(META_KEY, {});
      delete meta[uni];
      write(META_KEY, meta);
    },

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

    counts() {
      const out = {};
      const cache = read(DATA_KEY, {});
      this.list().forEach((x) => {
        const d = cache[x.uni];
        if (d) out[x.uni] = countsFor(d);
      });
      return out;
    },

    /* ---------- wishlist ----------
       A reference, not a tracked show: a name and a poster you jotted down
       to decide on later. It never touches `list()` or the shows/anime
       grid - only Add show does that. */

    wishlist(kind) {
      return read(WISH_KEY, [])
        .filter((x) => !kind || x.kind === kind)
        .filter((x) => x && x.id != null);
    },

    hasWish(tmdbId) {
      return this.wishlist().some((x) => String(x.id) === String(tmdbId));
    },

    /** `hit` is the shape a search result already comes in - kept as-is
     *  (raw `poster_path`, not a resolved URL) so it can be handed straight
     *  to `transform()` later, without a second search, if this gets
     *  promoted into an actual tracked show. */
    addWish(hit, kind) {
      const list = read(WISH_KEY, []);
      if (list.some((x) => String(x.id) === String(hit.id))) return false;
      list.unshift({
        id: Number(hit.id),
        kind: kind === "anime" ? "anime" : "show",
        name: hit.name,
        poster_path: hit.poster_path || "",
        year: String(hit.first_air_date || "").slice(0, 4),
        overview: hit.overview || "",
        addedAt: Date.now(),
      });
      return write(WISH_KEY, list);
    },

    removeWish(tmdbId) {
      const list = read(WISH_KEY, []).filter(
        (x) => String(x.id) !== String(tmdbId),
      );
      return write(WISH_KEY, list);
    },
  };
})();
