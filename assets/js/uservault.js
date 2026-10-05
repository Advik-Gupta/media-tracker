const UserVault = (() => {
  const LIST_KEY = "mediavault.myshows";
  const DATA_KEY = "mediavault.showdata";
  const META_KEY = "mediavault.showdata.meta";
  const WISH_KEY = "mediavault.mywishlist";
  const ARCS_KEY = "mediavault.arcs";
  const PAGES_KEY = "mediavault.pages";

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

  let migrated = false;

  function migrateLegacy() {
    if (typeof Store === "undefined") return 0;
    const counts = window.SERIES_COUNTS;
    if (!counts) return 0;
    const raw = read(LIST_KEY, []);
    if (!Array.isArray(raw)) return 0;
    const legacy = raw.filter((x) => x && x.id != null && x.uni && x.uni !== uniOf(x.id));
    if (!legacy.length) return 0;

    const progress = Store.exportAll();
    const cache = read(DATA_KEY, {});
    const list = raw.slice();
    let moved = 0;

    for (const entry of legacy) {
      const old = entry.uni;
      const meta = counts[old];
      const shows = meta && Array.isArray(meta.perShow) && meta.perShow.length
        ? meta.perShow
        : [{ id: entry.id, title: entry.name, poster: entry.poster }];
      const hostId = Number(entry.id);

      for (const sh of shows) {
        const to = uniOf(sh.id);
        const prefix = `e${sh.id}-`;
        for (const [from, dest] of [[old, to], [`__filler_${old}`, `__filler_${to}`]]) {
          const bucket = progress[from];
          if (!bucket) continue;
          for (const key of Object.keys(bucket)) {
            if (!key.startsWith(prefix)) continue;
            (progress[dest] || (progress[dest] = {}))[key] = bucket[key];
            delete bucket[key];
            moved += 1;
          }
          if (!Object.keys(bucket).length) delete progress[from];
        }

        const cached = cache[old] && (cache[old].shows || []).find((x) => String(x.id) === String(sh.id));
        if (cached && !cache[to]) cache[to] = { shows: [cached], films: [] };

        if (Number(sh.id) === hostId) continue;
        if (!list.some((x) => String(x.id) === String(sh.id))) {
          list.push({
            id: Number(sh.id),
            uni: to,
            name: sh.title || `Show ${sh.id}`,
            kind: entry.kind,
            poster: sh.poster || "",
            year: "",
            addedAt: entry.addedAt || Date.now(),
            mergedInto: hostId,
          });
        }
      }

      const flags = progress.__flags || {};
      for (const key of Object.keys(flags)) {
        const [name, ...rest] = key.split(":");
        if (rest.join(":") !== old) continue;
        flags[`${name}:${uniOf(hostId)}`] = flags[key];
        delete flags[key];
      }
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || !k.startsWith("mediavault.order.")) continue;
          const ids = read(k, []);
          if (Array.isArray(ids) && ids.includes(old))
            write(k, ids.map((x) => (x === old ? uniOf(hostId) : x)));
        }
      } catch (e) {}

      delete cache[old];
      entry.uni = uniOf(hostId);
    }

    write(LIST_KEY, list);
    write(DATA_KEY, cache);
    Store.touch();
    return moved;
  }

  const api = {
    uniOf,
    transform,
    countsFor,

    pages() {
      const v = read(PAGES_KEY, {});
      return v && typeof v === "object" ? v : {};
    },

    page(hostId) {
      const p = this.pages()[hostId] || {};
      return {
        units: Array.isArray(p.units) ? p.units : [],
        films: Array.isArray(p.films) ? p.films : [],
        hidden: Array.isArray(p.hidden) ? p.hidden : [],
        splits: p.splits && typeof p.splits === "object" ? p.splits : {},
      };
    },

    savePage(hostId, page) {
      const all = this.pages();
      all[hostId] = {
        units: page.units || [],
        films: page.films || [],
        hidden: page.hidden || [],
        splits: page.splits || {},
      };
      write(PAGES_KEY, all);
      if (typeof Store !== "undefined") Store.touch();
    },

    pageStats(hostId) {
      const host = this.entry(hostId);
      if (!host || typeof Store === "undefined") return null;
      const page = this.page(hostId);
      const gone = new Set(page.hidden);
      const progress = Store.exportAll();
      const now = Date.now();
      const parts = [];

      for (const m of this.members(hostId)) {
        const uni = uniOf(m.id);
        const d = this.data(uni);
        const show = d && d.shows && d.shows[0];
        if (!show) {
          parts.push({ title: m.name, done: 0, total: 0, unknown: true });
          continue;
        }
        const bucket = progress[uni] || {};
        const filler = host.kind === "anime" ? progress[`__filler_${uni}`] || {} : {};
        let done = 0;
        let total = 0;
        (show.seasons || []).forEach((se) => {
          if (gone.has(`s:${show.id}:${se.n}`)) return;
          se.episodes.forEach((ep) => {
            if (!(ep.d && new Date(ep.d).getTime() <= now)) return;
            const key = `e${show.id}-${se.n}x${ep.n}`;
            if (filler[key]) return;
            total += 1;
            if (bucket[key]) done += 1;
          });
        });
        parts.push({ title: show.title || m.name, done, total });
      }

      if (page.films.length) {
        const shared = progress.__shared || {};
        const own = progress[uniOf(hostId)] || {};
        const done = page.films.filter((f) =>
          f.src && f.src !== "registry" ? own[`m:${f.key}`] : shared[f.key],
        ).length;
        parts.push({ title: "Films", done, total: page.films.length, films: true });
      }

      const total = parts.reduce((n, p) => n + p.total, 0);
      const done = parts.reduce((n, p) => n + p.done, 0);
      return { total, done, parts, complete: parts.every((p) => !p.unknown) };
    },

    hostOf(tmdbId) {
      const e = this.entry(tmdbId);
      return e && e.mergedInto != null && this.entry(e.mergedInto)
        ? Number(e.mergedInto)
        : Number(tmdbId);
    },

    members(hostId) {
      const host = this.entry(hostId);
      if (!host) return [];
      return [
        host,
        ...this.list().filter(
          (x) => x.mergedInto != null && String(x.mergedInto) === String(hostId),
        ),
      ];
    },

    merge(childId, hostId) {
      hostId = this.hostOf(hostId);
      if (String(childId) === String(hostId)) return false;
      const list = this.list();
      const child = list.find((x) => String(x.id) === String(childId));
      const host = list.find((x) => String(x.id) === String(hostId));
      if (!child || !host) return false;

      list.forEach((x) => {
        if (x.mergedInto != null && String(x.mergedInto) === String(childId))
          x.mergedInto = Number(hostId);
      });
      child.mergedInto = Number(hostId);
      write(LIST_KEY, list);

      const from = this.page(childId);
      if (from.films.length) {
        const to = this.page(hostId);
        from.films.forEach((f) => {
          if (!to.films.some((x) => x.key === f.key)) to.films.push(f);
        });
        const all = this.pages();
        all[hostId] = { units: to.units, films: to.films, hidden: to.hidden, splits: to.splits };
        delete all[childId];
        write(PAGES_KEY, all);
      }
      if (typeof Store !== "undefined") Store.touch();
      return true;
    },

    unmerge(childId) {
      const list = this.list();
      const child = list.find((x) => String(x.id) === String(childId));
      if (!child || child.mergedInto == null) return false;
      delete child.mergedInto;
      write(LIST_KEY, list);
      if (typeof Store !== "undefined") Store.touch();
      return true;
    },

    list() {
      if (!migrated && window.SERIES_COUNTS && typeof Store !== "undefined") {
        migrated = true;
        try {
          migrateLegacy();
        } catch (e) {
          console.error("Media Vault: could not migrate saved shows", e);
        }
      }
      const v = read(LIST_KEY, []);
      if (!Array.isArray(v)) return [];
      const seen = new Set();
      return v.filter((x) => {
        if (!x || x.id == null || seen.has(String(x.id))) return false;
        seen.add(String(x.id));
        return true;
      });
    },

    entry(tmdbId) {
      return this.list().find((x) => String(x.id) === String(tmdbId)) || null;
    },

    has(tmdbId) {
      return this.list().some((x) => String(x.id) === String(tmdbId));
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
      const uni = entry.uni || uniOf(entry.id);
      if (list.some((x) => String(x.id) === String(entry.id))) return false;

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
      if (typeof Store !== "undefined") Store.touch();
      return true;
    },

    remove(uni) {
      const entry = this.list().find((x) => x.uni === uni) || null;
      const snapshot = { entry, data: this.data(uni), buckets: {}, flags: {}, arcs: null, orders: {}, page: null, children: [] };

      const kept = this.list().filter((x) => x.uni !== uni);
      if (entry) {
        kept.forEach((x) => {
          if (x.mergedInto != null && String(x.mergedInto) === String(entry.id)) {
            snapshot.children.push(x.id);
            delete x.mergedInto;
          }
        });
        const pages = this.pages();
        if (pages[entry.id]) {
          snapshot.page = pages[entry.id];
          delete pages[entry.id];
          write(PAGES_KEY, pages);
        }
      }
      write(LIST_KEY, kept);
      const all = read(DATA_KEY, {});
      delete all[uni];
      write(DATA_KEY, all);
      const meta = read(META_KEY, {});
      delete meta[uni];
      write(META_KEY, meta);

      if (typeof Store !== "undefined") {
        const progress = Store.exportAll();
        for (const bucket of [uni, `__filler_${uni}`]) {
          if (progress[bucket]) {
            snapshot.buckets[bucket] = progress[bucket];
            delete progress[bucket];
          }
        }
        const flags = progress.__flags || {};
        for (const key of Object.keys(flags)) {
          if (key.split(":").slice(1).join(":") === uni) {
            snapshot.flags[key] = flags[key];
            delete flags[key];
          }
        }
      }

      if (entry) {
        const arcs = read(ARCS_KEY, {});
        if (arcs[entry.id]) {
          snapshot.arcs = arcs[entry.id];
          delete arcs[entry.id];
          write(ARCS_KEY, arcs);
        }
      }
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || !k.startsWith("mediavault.order.")) continue;
          const ids = read(k, []);
          if (Array.isArray(ids) && ids.includes(uni)) {
            snapshot.orders[k] = ids;
            write(k, ids.filter((x) => x !== uni));
          }
        }
        localStorage.removeItem(`mediavault.collapsed.${uni}`);
      } catch (e) {}

      if (typeof Store !== "undefined") Store.touch();
      return snapshot;
    },

    restore(snapshot) {
      if (!snapshot || !snapshot.entry) return false;
      const list = this.list();
      if (!list.some((x) => String(x.id) === String(snapshot.entry.id))) {
        list.unshift(snapshot.entry);
        write(LIST_KEY, list);
      }
      if (snapshot.children && snapshot.children.length) {
        const now = this.list();
        now.forEach((x) => {
          if (snapshot.children.some((c) => String(c) === String(x.id)))
            x.mergedInto = Number(snapshot.entry.id);
        });
        write(LIST_KEY, now);
      }
      if (snapshot.page) {
        const pages = this.pages();
        pages[snapshot.entry.id] = snapshot.page;
        write(PAGES_KEY, pages);
      }
      if (snapshot.data) this.setData(snapshot.entry.uni, snapshot.data);
      if (typeof Store !== "undefined") {
        const progress = Store.exportAll();
        Object.assign(progress, snapshot.buckets);
        if (Object.keys(snapshot.flags).length)
          progress.__flags = Object.assign(progress.__flags || {}, snapshot.flags);
      }
      if (snapshot.arcs) {
        const arcs = read(ARCS_KEY, {});
        arcs[snapshot.entry.id] = snapshot.arcs;
        write(ARCS_KEY, arcs);
      }
      for (const [k, ids] of Object.entries(snapshot.orders)) write(k, ids);
      if (typeof Store !== "undefined") Store.touch();
      return true;
    },

    asUniverses(kind) {
      return this.list()
        .filter((x) => !kind || x.kind === kind)
        .filter((x) => x.mergedInto == null || !this.entry(x.mergedInto))
        .map((x) => ({
          id: x.uni,
          tmdbId: x.id,
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

    wishlist(kind) {
      return read(WISH_KEY, [])
        .filter((x) => !kind || x.kind === kind)
        .filter((x) => x && x.id != null);
    },

    hasWish(tmdbId) {
      return this.wishlist().some((x) => String(x.id) === String(tmdbId));
    },

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
      const ok = write(WISH_KEY, list);
      if (typeof Store !== "undefined") Store.touch();
      return ok;
    },

    removeWish(tmdbId) {
      const list = read(WISH_KEY, []).filter(
        (x) => String(x.id) !== String(tmdbId),
      );
      const ok = write(WISH_KEY, list);
      if (typeof Store !== "undefined") Store.touch();
      return ok;
    },
  };

  return api;
})();
