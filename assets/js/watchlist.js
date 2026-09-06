(() => {
  const CATS = window.CATALOGUES || {};
  Store.migrateLinks();
  const ALL = (typeof UNIVERSES !== "undefined" ? UNIVERSES : []).filter(
    (u) => CATS[u.id],
  );
  const UNI = {};
  ALL.forEach((u) => {
    UNI[u.id] = u;
  });

  const el = {
    input: document.getElementById("wlInput"),
    sugg: document.getElementById("wlSuggest"),
    list: document.getElementById("wlList"),
    empty: document.getElementById("wlEmpty"),
    count: document.getElementById("wlCount"),
    add: document.getElementById("wlAdd"),
  };
  if (!el.input) return;

  const esc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  const initials = (t) =>
    t
      .replace(/^(The|A|An)\s+/i, "")
      .split(/[\s:-–-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  const norm = (s) =>
    s
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/^(the|a|an)\s+/, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const INDEX = [];
  const seenRef = new Set();
  Object.entries(CATS).forEach(([uni, cat]) => {
    resolvedItems(cat).forEach((it) => {
      if (it.alias) return;
      const ref = progressRef(uni, it).join("/");
      if (seenRef.has(ref)) return;
      seenRef.add(ref);
      const file = it.poster || (cat.posters && cat.posters[it.id]);
      const poster = !file
        ? null
        : /^https?:\/\//.test(file) || file.startsWith("assets/")
          ? file
          : cat.imgDir + file;
      INDEX.push({
        uni,
        id: it.film || it.id,
        film: it.film || null,
        title: it.title,
        sub: it.sub || "",
        year: (it.release || "").slice(0, 4),
        mins: it.mins,
        eps: it.eps,
        link: it.link,
        poster,
        n: norm(it.title),
      });
    });
  });

  function search(q) {
    const nq = norm(q);
    if (nq.length < 2) return [];
    const terms = nq.split(" ").filter(Boolean);

    return INDEX.map((e) => {
      const tokens = e.n.split(" ");
      let score;

      if (e.n === nq) score = 1000;
      else if (e.n.startsWith(nq)) score = 800;
      else if (e.n.includes(nq)) score = 600;
      else {
        let exact = 0;
        const all = terms.every((t) => {
          const hit = tokens.find(
            (tok) => tok === t || (t.length >= 3 && tok.startsWith(t)),
          );
          if (hit === t) exact += 1;
          return !!hit;
        });
        if (!all) return null;
        score = 300 + exact * 40;
      }
      return { e, score: score - Math.abs(e.n.length - nq.length) * 0.4 };
    })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.e);
  }

  function exactMatch(q) {
    const nq = norm(q);
    return INDEX.find((e) => e.n === nq) || null;
  }

  let active = -1;
  let current = [];

  function renderSuggestions() {
    const q = el.input.value;
    const typed = q.trim();
    current = search(q);
    active = -1;

    const localRows = current
      .map(
        (e, i) => `
      <button class="wl-sugg" data-i="${i}">
        <span class="wl-sugg-thumb${e.poster ? "" : " ph"}">
          <span class="ph-init">${initials(e.title)}</span>
          ${e.poster ? `<img src="${e.poster}" alt="" loading="lazy" onerror="this.closest('.wl-sugg-thumb').classList.add('ph');this.remove();">` : ""}
        </span>
        <span class="wl-sugg-text">
          <b>${esc(e.title)}</b>
          <small>${esc(e.sub ? e.sub + " · " : "")}${e.year} · ${esc((UNI[e.uni] || {}).name || e.uni)}</small>
        </span>
      </button>`,
      )
      .join("");

    const known = new Set(current.map((e) => norm(e.title)));
    const extra = remote.filter((r) => !known.has(norm(r.title)));

    const remoteRows = extra
      .map(
        (r, i) => `
      <button class="wl-sugg wl-remote" data-remote="${i}">
        <span class="wl-sugg-thumb${r.poster ? "" : " ph"}">
          <span class="ph-init">${initials(r.title)}</span>
          ${r.poster ? `<img src="${r.poster}" alt="" loading="lazy" onerror="this.closest('.wl-sugg-thumb').classList.add('ph');this.remove();">` : ""}
        </span>
        <span class="wl-sugg-text">
          <b>${esc(r.title)}</b>
          <small>${r.year || "-"}${r.endYear ? `–${r.endYear}` : ""} · ${r.kind === "series" ? "Series" : "Film"}</small>
        </span>
        <span class="wl-sugg-cta">Add</span>
      </button>`,
      )
      .join("");

    const banner =
      remoteState === "waiting" && typed.length >= 2
        ? `<div class="wl-sugg-state">Searching in a moment…</div>`
        : remoteState === "loading"
          ? `<div class="wl-sugg-state loading"><i class="spinner"></i>Searching ratingraph…</div>`
          : remoteState === "failed"
            ? `<div class="wl-sugg-state">Could not reach ratingraph.</div>`
            : remoteState === "done" && !extra.length && typed.length >= 2
              ? `<div class="wl-sugg-state">Nothing else found.</div>`
              : "";

    if (!localRows && !remoteRows && !banner) {
      el.sugg.hidden = true;
      el.sugg.innerHTML = "";
      return;
    }

    el.sugg.innerHTML =
      localRows +
      (remoteRows
        ? `<div class="wl-sugg-head">Elsewhere</div>${remoteRows}`
        : "") +
      banner +
      `<div class="wl-sugg-foot">Click a match to link it &middot; or press Enter to add
         &ldquo;${esc(typed)}&rdquo; as a new entry</div>`;
    el.sugg.hidden = false;
  }

  function remoteAt(i) {
    const known = new Set(current.map((e) => norm(e.title)));
    return remote.filter((r) => !known.has(norm(r.title)))[i];
  }

  function highlight() {
    [...el.sugg.querySelectorAll(".wl-sugg")].forEach((b, i) =>
      b.classList.toggle("active", i === active),
    );
  }

  el.sugg.addEventListener("click", (ev) => {
    const b = ev.target.closest(".wl-sugg");
    if (!b) return;
    if (b.dataset.remote !== undefined)
      addFromRemote(remoteAt(Number(b.dataset.remote)));
    else addFromIndex(current[Number(b.dataset.i)]);
  });

  const DEBOUNCE = 1500;
  let remoteTimer = null;
  let remoteAbort = null;
  let remote = [];
  let remoteState = "idle";

  function scheduleRemote() {
    clearTimeout(remoteTimer);
    if (remoteAbort) remoteAbort.abort();

    const q = el.input.value.trim();
    remote = [];

    if (q.length < 2 || typeof RatingGraph === "undefined") {
      remoteState = "idle";
      return;
    }

    remoteState = "waiting";
    remoteTimer = setTimeout(async () => {
      remoteState = "loading";
      renderSuggestions({ keepRemote: true });

      remoteAbort = new AbortController();
      try {
        const found = await RatingGraph.search(q, {
          signal: remoteAbort.signal,
        });
        if (el.input.value.trim() !== q) return;
        remote = found;
        remoteState = "done";
      } catch (e) {
        if (e.name === "AbortError") return;
        remoteState = "failed";
      }
      renderSuggestions({ keepRemote: true });
    }, DEBOUNCE);
  }

  el.input.addEventListener("input", () => {
    scheduleRemote();
    renderSuggestions();
  });
  el.input.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowDown" && current.length) {
      ev.preventDefault();
      active = (active + 1) % current.length;
      highlight();
    } else if (ev.key === "ArrowUp" && current.length) {
      ev.preventDefault();
      active = (active - 1 + current.length) % current.length;
      highlight();
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      if (active >= 0) addFromIndex(current[active]);
      else addFreeText();
    } else if (ev.key === "Escape") {
      el.sugg.hidden = true;
    }
  });
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".wl-search")) el.sugg.hidden = true;
  });
  el.add.addEventListener("click", () => {
    if (active >= 0) addFromIndex(current[active]);
    else addFreeText();
  });

  function addFromIndex(e) {
    if (!e) return;
    const ok = Store.watchlistAdd({
      title: e.title,
      sub: e.sub,
      year: e.year,
      uni: e.uni,
      id: e.id,
      film: e.film,
      poster: e.poster,
      link: e.link,
      mins: e.mins,
      eps: e.eps,
    });
    toast(ok ? `Added ${e.title}` : `${e.title} is already on your list`);
    reset();
  }

  function addFromRemote(r) {
    if (!r) return;

    const known = matchCatalogue(r.title, r.year);
    if (known) return addFromIndex(known);

    const ok = Store.watchlistAdd({
      title: r.title,
      year: r.year || "",
      poster: r.poster || "",
      sub: r.kind === "series" ? "Series" : "",
      rgId: r.id,
      rgPath: r.path,
    });
    toast(ok ? `Added ${r.title}` : `${r.title} is already on your list`);
    reset();
    render();
  }

  function matchCatalogue(title, year) {
    const nt = norm(title);
    const hits = INDEX.filter((e) => norm(e.title) === nt);
    if (!hits.length) return null;
    if (!year) return hits[0];

    const exact = hits.find((e) => String(e.year) === String(year));
    if (exact) return exact;

    const near = hits.find((e) => Math.abs(Number(e.year) - Number(year)) <= 1);
    return near || null;
  }

  async function addFreeText() {
    const t = el.input.value.trim();
    if (!t) return;
    const exact = exactMatch(t) || matchCatalogue(t, "");
    if (exact) return addFromIndex(exact);

    const ok = Store.watchlistAdd({ title: t });
    toast(ok ? `Added ${t}` : `${t} is already on your list`);
    reset();
    if (ok && OMDb.enabled()) enrich(t);
  }

  async function enrich(title) {
    const info = await OMDb.lookup({ title });
    if (!info) return;
    const list = Store.watchlist();
    const i = list.findIndex(
      (e) =>
        !e.uni && e.title.toLowerCase().trim() === title.toLowerCase().trim(),
    );
    if (i < 0) return;
    Store.watchlistUpdate(i, {
      title: info.title || list[i].title,
      year: info.year,
      poster: info.poster,
      mins: info.mins,
      imdbID: info.imdbID,
      rating: info.rating,
      kind: info.kind,
    });
    render();
  }

  async function enrichAll() {
    if (!OMDb.enabled()) return;
    const list = Store.watchlist();
    const todo = list
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => !e.uni && !e.poster && !e.omdbTried);
    if (!todo.length) return;
    for (const { e, i } of todo) {
      const info = await OMDb.lookup({ title: e.title, year: e.year });
      Store.watchlistUpdate(
        i,
        info
          ? {
              title: info.title || e.title,
              year: info.year,
              poster: info.poster,
              mins: info.mins,
              imdbID: info.imdbID,
              rating: info.rating,
              kind: info.kind,
              omdbTried: true,
            }
          : { omdbTried: true },
      );
    }
    render();
    toast(
      `Updated ${todo.length} entr${todo.length === 1 ? "y" : "ies"} from OMDb`,
    );
  }

  function reset() {
    el.input.value = "";
    el.sugg.hidden = true;
    current = [];
    active = -1;
    render();
  }

  const SEEN_BUCKET = `__seen_${document.body.dataset.mode || "movie"}`;

  function refOf(entry) {
    const key = filmKeyOf(entry);
    if (key) return [SHARED_BUCKET, key];
    if (entry.link) return [SHARED_BUCKET, entry.link];
    if (entry.uni) return [entry.uni, entry.id];
    return [SEEN_BUCKET, entry.title.toLowerCase().trim()];
  }

  const wlState = { sort: "added", genre: "", status: "all", open: new Set() };

  function filmKeyOf(e) {
    if (e.film) return e.film;
    if (typeof FILMS === "undefined") return null;
    if (e.id && FILMS[e.id]) return e.id;

    const hit = matchCatalogue(e.title, e.year);
    return hit && hit.film ? hit.film : null;
  }

  const omdbCache = new Map();
  const omdbPending = new Set();

  function omdbFor(e) {
    const key = e.imdbID || `${e.title}|${e.year || ""}`;
    if (omdbCache.has(key)) return omdbCache.get(key);

    if (!omdbPending.has(key) && OMDb.enabled()) {
      omdbPending.add(key);
      OMDb.lookup({ title: e.title, year: e.year, imdbID: e.imdbID })
        .then((d) => {
          omdbCache.set(key, d || null);
          omdbPending.delete(key);
          if (d) render();
        })
        .catch(() => omdbPending.delete(key));
    }
    return null;
  }

  function detailOf(e) {
    const key = filmKeyOf(e);
    const reg = key && typeof FILMS !== "undefined" ? FILMS[key] : null;
    const extra = (key && (window.FILM_DETAILS || {})[key]) || {};
    const rating =
      (reg && (typeof reg.rgRating === "number" ? reg.rgRating : reg.score)) ??
      (typeof e.rating === "number" ? e.rating : null);
    const o = omdbFor(e) || {};

    return {
      genres:
        (reg && reg.genres && reg.genres.length ? reg.genres : o.genres) || [],
      rating: rating ?? o.rating ?? null,
      votes: (reg && reg.rgVotes) || o.votes || null,
      director: extra.d || o.director || null,
      writers: o.writers || [],
      cast: o.cast || [],
      synopsis: extra.s || o.plot || null,
      language: extra.l || (o.languages || []).join(", ") || null,
      countries: o.countries || [],
      awards: o.awards || null,
      rated: o.rated || null,
      boxOffice: o.boxOffice || null,
      rt: o.rt || null,
      mc: o.mc || null,
      imdbID: o.imdbID || e.imdbID || null,
      poster: e.poster || (reg && reg.poster) || o.poster || null,
      mins: e.mins || (reg && reg.mins) || o.mins || null,
      year:
        e.year ||
        (reg && reg.release ? reg.release.slice(0, 4) : "") ||
        o.year ||
        "",
      loading:
        !o.title &&
        OMDb.enabled() &&
        !omdbCache.has(e.imdbID || `${e.title}|${e.year || ""}`),
    };
  }

  const WL_SORTS = {
    added: () => 0,
    title: (a, b) => a.e.title.localeCompare(b.e.title),
    year: (a, b) => String(b.d.year).localeCompare(String(a.d.year)),
    rating: (a, b) => (b.d.rating ?? -1) - (a.d.rating ?? -1),
    runtime: (a, b) => (a.d.mins || 1e9) - (b.d.mins || 1e9),
  };

  function wlRows() {
    const rows = Store.watchlist().map((e, i) => ({ e, i, d: detailOf(e) }));

    const filtered = rows.filter((r) => {
      if (wlState.genre && !r.d.genres.includes(wlState.genre)) return false;
      const done = Store.has(...refOf(r.e));
      if (wlState.status === "watched" && !done) return false;
      if (wlState.status === "unwatched" && done) return false;
      return true;
    });

    const cmp = WL_SORTS[wlState.sort] || WL_SORTS.added;
    return wlState.sort === "added" ? filtered : filtered.slice().sort(cmp);
  }

  function renderControls(rows) {
    const box = document.getElementById("wlControls");
    if (!box) return;

    const counts = {};
    Store.watchlist().forEach((e) =>
      detailOf(e).genres.forEach((g) => (counts[g] = (counts[g] || 0) + 1)),
    );
    const genres = Object.keys(counts).sort(
      (a, b) => counts[b] - counts[a] || a.localeCompare(b),
    );

    box.innerHTML = `
      <div class="wl-controls-row">
        <span class="filter-label">Sort</span>
        <div class="chips">
          ${[
            ["added", "Added"],
            ["title", "Title"],
            ["year", "Year"],
            ["rating", "Rating"],
            ["runtime", "Shortest"],
          ]
            .map(
              ([k, label]) =>
                `<button class="chip${wlState.sort === k ? " active" : ""}" data-sort="${k}">${label}</button>`,
            )
            .join("")}
        </div>
      </div>

      <div class="wl-controls-row">
        <span class="filter-label">Status</span>
        <div class="chips">
          ${[
            ["all", "All"],
            ["unwatched", "Not seen"],
            ["watched", "Seen"],
          ]
            .map(
              ([k, label]) =>
                `<button class="chip${wlState.status === k ? " active" : ""}" data-status="${k}">${label}</button>`,
            )
            .join("")}
        </div>
      </div>

      ${
        genres.length
          ? `<div class="wl-controls-row">
               <span class="filter-label">Genre</span>
               <div class="chips">
                 <button class="chip${wlState.genre ? "" : " active"}" data-genre="">Any</button>
                 ${genres
                   .map(
                     (g) =>
                       `<button class="chip${wlState.genre === g ? " active" : ""}" data-genre="${esc(g)}">${esc(g)}<span class="n">${counts[g]}</span></button>`,
                   )
                   .join("")}
               </div>
             </div>`
          : ""
      }

      <p class="wl-shown">${rows.length} shown${
        wlState.genre || wlState.status !== "all"
          ? ` of ${Store.watchlist().length}`
          : ""
      }</p>`;

    box.querySelectorAll("[data-sort]").forEach((b) =>
      b.addEventListener("click", () => {
        wlState.sort = b.dataset.sort;
        render();
      }),
    );
    box.querySelectorAll("[data-status]").forEach((b) =>
      b.addEventListener("click", () => {
        wlState.status = b.dataset.status;
        render();
      }),
    );
    box.querySelectorAll("[data-genre]").forEach((b) =>
      b.addEventListener("click", () => {
        wlState.genre = b.dataset.genre;
        render();
      }),
    );
  }

  function render() {
    const list = Store.watchlist();
    el.count.textContent = list.length
      ? `${list.filter((e) => Store.has(...refOf(e))).length} / ${list.length} watched`
      : "";
    el.empty.hidden = list.length > 0;

    const rows = wlRows();
    renderControls(rows);

    el.list.innerHTML = rows
      .map(({ e, i, d }) => {
        const watched = Store.has(...refOf(e));
        const home = e.uni ? UNI[e.uni] || null : null;
        const open = wlState.open.has(i);

        const chip = (label, value) =>
          value
            ? `<span class="wc-chip"><b>${label}</b>${esc(value)}</span>`
            : "";

        const people = (label, names) =>
          names && names.length
            ? `<div class="wc-people"><dt>${label}</dt><dd>${names
                .map((n) => `<span>${esc(n)}</span>`)
                .join("")}</dd></div>`
            : "";

        return `
      <article class="wcard${watched ? " done" : ""}${open ? " open" : ""}" data-i="${i}"
               style="--rc:${home ? home.accent : "var(--accent)"}">
        <div class="wc-poster${d.poster ? "" : " ph"}">
          <span class="ph-init">${initials(e.title)}</span>
          ${d.poster ? `<img src="${esc(d.poster)}" alt="" loading="lazy" onerror="this.closest('.wc-poster').classList.add('ph');this.remove();">` : ""}
          ${watched ? '<span class="stamp">Seen</span>' : ""}
        </div>

        <div class="wc-body">
          <div class="wc-head">
            <h3 data-act="expand" role="button" tabindex="0"
                aria-expanded="${open}">${esc(e.title)}</h3>
            <div class="wc-actions">
              <button class="btn sm ${watched ? "" : "btn-accent"}" data-act="toggle">
                ${watched ? "Seen" : "Mark seen"}
              </button>
              <button class="wl-del" data-act="remove" title="Remove" aria-label="Remove ${esc(e.title)}">✕</button>
            </div>
          </div>

          <p class="wc-line">
            ${d.rating != null ? `<span class="wc-mini-rating">${d.rating.toFixed(1)}</span>` : ""}
            ${d.year ? `<span>${esc(d.year)}</span>` : ""}
            ${d.rated ? `<span>${esc(d.rated)}</span>` : ""}
            ${d.mins ? `<span>${fmtRuntime(d.mins)}</span>` : ""}
            ${d.countries.length ? `<span>${esc(d.countries[0])}</span>` : ""}
            ${home ? `<a class="badge" style="--bc:${home.accent}" href="${home.href}">${esc(home.name)}</a>` : ""}
          </p>

          ${
            d.genres.length
              ? `<p class="wc-genres">${d.genres
                  .map((g) => `<span class="wc-genre">${esc(g)}</span>`)
                  .join("")}</p>
                 <p class="wc-genres-mini">${esc(d.genres.slice(0, 3).join(" · "))}</p>`
              : ""
          }

          <div class="wc-scores">
            ${d.rating != null ? `<span class="wc-score imdb"><b>${d.rating.toFixed(1)}</b>IMDb${d.votes ? ` · ${esc(String(d.votes))}` : ""}</span>` : ""}
            ${d.rt ? `<span class="wc-score rt"><b>${esc(d.rt)}</b>Rotten Tomatoes</span>` : ""}
            ${d.mc ? `<span class="wc-score mc"><b>${esc(d.mc)}</b>Metacritic</span>` : ""}
            ${d.loading ? '<span class="wc-loading"><i class="spinner"></i>Looking up…</span>' : ""}
          </div>

          ${d.synopsis ? `<p class="wc-plot${open ? " full" : ""}">${esc(d.synopsis)}</p>` : ""}

          <dl class="wc-credits">
            ${d.director ? `<div><dt>Director</dt><dd>${esc(d.director)}</dd></div>` : ""}
            ${people("Cast", d.cast.slice(0, open ? 20 : 4))}
            ${open ? people("Writers", d.writers) : ""}
            ${open && d.language ? `<div><dt>Language</dt><dd>${esc(d.language)}</dd></div>` : ""}
            ${open && d.countries.length ? `<div><dt>Country</dt><dd>${esc(d.countries.join(", "))}</dd></div>` : ""}
            ${open && d.boxOffice ? `<div><dt>Box office</dt><dd>${esc(d.boxOffice)}</dd></div>` : ""}
            ${open && d.awards ? `<div><dt>Awards</dt><dd>${esc(d.awards)}</dd></div>` : ""}
          </dl>

          <div class="wc-foot">
            <button class="wc-more" data-act="expand" aria-expanded="${open}">
              ${open ? "Less" : "More"}
            </button>
            ${d.imdbID ? `<a class="wc-link" href="https://www.imdb.com/title/${esc(d.imdbID)}/" target="_blank" rel="noopener">IMDb ↗</a>` : ""}
          </div>
        </div>
      </article>`;
      })
      .join("");
  }

  el.list.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    const h = ev.target.closest('[data-act="expand"]');
    if (!h) return;
    ev.preventDefault();
    h.click();
  });

  el.list.addEventListener("click", (ev) => {
    const row = ev.target.closest(".wcard");
    if (!row) return;

    if (ev.target.closest('[data-act="expand"]')) {
      const i = Number(row.dataset.i);
      wlState.open.has(i) ? wlState.open.delete(i) : wlState.open.add(i);
      render();
      return;
    }
    const i = Number(row.dataset.i);
    const act = ev.target.closest("[data-act]");
    if (!act) return;
    const entry = Store.watchlist()[i];
    if (act.dataset.act === "toggle") {
      Store.toggle(...refOf(entry));
      render();
    }
    if (act.dataset.act === "remove") {
      Store.watchlistRemove(i);
      toast("Removed");
      render();
    }
  });

  Store.onChange((d, meta) => {
    if (meta && meta.restored) render();
  });
  render();
  initReveal();
  enrichAll();
})();
