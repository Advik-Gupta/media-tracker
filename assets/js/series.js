(() => {
  const UNI = document.body.dataset.universe;
  const DATA = (window.SERIES || {})[UNI];
  const root = document.getElementById("seriesRoot");
  if (!DATA || !root) return;

  const CAT = (window.CATALOGUES || {})[UNI] || {};

  if (Store.migrateMerges) Store.migrateMerges();

  const bucketOf = (showId) => (DATA.buckets && DATA.buckets[showId]) || UNI;
  const fillerBucket = (showId) => `__filler_${bucketOf(showId)}`;
  const epRef = (showId, s, e) => [bucketOf(showId), `e${showId}-${s}x${e}`];
  const filmRef = (f) =>
    f.src && f.src !== "registry"
      ? [UNI, `m:${f.film}`]
      : typeof progressRef === "function"
        ? progressRef(UNI, { film: f.film })
        : [UNI, f.film];

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  const aired = (ep) => ep.d && new Date(ep.d) <= new Date();

  const fillerKey = (showId, s, e) => `e${showId}-${s}x${e}`;
  const isFiller = (showId, s, e) =>
    canMarkFiller && Store.has(fillerBucket(showId), fillerKey(showId, s, e));
  const canMarkFiller = (document.body.dataset.mode || "") === "anime";

  const BANDS = [
    { min: 9.7, key: "cinema", label: "Absolute Cinema" },
    { min: 9.0, key: "awesome", label: "Awesome" },
    { min: 8.0, key: "great", label: "Great" },
    { min: 7.0, key: "good", label: "Good" },
    { min: 6.0, key: "average", label: "Average" },
    { min: 5.0, key: "bad", label: "Bad" },
    { min: -1, key: "garbage", label: "Garbage" },
  ];
  function band(r) {
    if (r == null) return "na";
    return BANDS.find((b) => r >= b.min).key;
  }

  const fmtRating = (r) => (r == null ? "–" : r.toFixed(1));

  const state = {
    collapsed: new Set(),
    hideWatched: false,
    dense: false,
  };

  const COLLAPSE_KEY = `mediavault.collapsed.${UNI}`;
  try {
    const saved = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "[]");
    if (Array.isArray(saved)) saved.forEach((k) => state.collapsed.add(k));
  } catch (e) {}

  function rememberCollapsed() {
    try {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...state.collapsed]));
    } catch (e) {}
  }

  const sk = (se) => (se.k != null ? se.k : se.n);
  const whole = (show) => {
    const byN = new Map();
    show.seasons.forEach((se) => {
      if (!byN.has(se.n)) byN.set(se.n, { n: se.n, episodes: [] });
      byN.get(se.n).episodes.push(...se.episodes);
    });
    return [...byN.values()];
  };

  const ABS_KEY = "mediavault.absnum";
  const absPrefs = () => {
    try {
      const v = JSON.parse(localStorage.getItem(ABS_KEY) || "{}");
      return v && typeof v === "object" ? v : {};
    } catch (e) {
      return {};
    }
  };
  const absOn = () => !!absPrefs()[UNI];
  function toggleAbs() {
    const all = absPrefs();
    if (all[UNI]) delete all[UNI];
    else all[UNI] = 1;
    try {
      localStorage.setItem(ABS_KEY, JSON.stringify(all));
    } catch (e) {}
    Store.touch();
  }
  const absCache = new WeakMap();
  function absOf(show, seasonN, epN) {
    if (!absCache.has(show)) {
      const map = new Map();
      let i = 0;
      (show.allSeasons || whole(show)).forEach((se) =>
        se.episodes.forEach((ep) => map.set(`${se.n}x${ep.n}`, ++i)),
      );
      absCache.set(show, map);
    }
    return absCache.get(show).get(`${seasonN}x${epN}`) || epN;
  }
  const absRange = (show, se) =>
    se.episodes.length
      ? `Ep ${absOf(show, se.n, se.episodes[0].n)}–${absOf(show, se.n, se.episodes[se.episodes.length - 1].n)}`
      : "";

  const BIG_SEASON = 60;
  let firstRender = true;

  const seasonRefs = (show, season) =>
    season.episodes
      .filter(aired)
      .filter((ep) => !isFiller(show.id, season.n, ep.n))
      .map((ep) => epRef(show.id, season.n, ep.n));

  function tally(refs) {
    const done = refs.filter((r) => Store.has(...r)).length;
    return { done, total: refs.length };
  }

  const fillerCount = (show) =>
    show.seasons.reduce(
      (n, se) =>
        n + se.episodes.filter((ep) => isFiller(show.id, se.n, ep.n)).length,
      0,
    );

  function showRefs(show) {
    return show.seasons.flatMap((se) => seasonRefs(show, se));
  }

  function allRefs() {
    return [
      ...DATA.shows.flatMap(showRefs),
      ...(DATA.films || []).map(filmRef),
    ];
  }

  function episodeTile(show, season, ep) {
    const ref = epRef(show.id, season.n, ep.n);
    const done = Store.has(...ref);
    const future = !aired(ep);
    const filler = isFiller(show.id, season.n, ep.n);
    const code = absOn()
      ? `EP ${String(absOf(show, season.n, ep.n)).padStart(3, "0")}`
      : `S${String(season.n).padStart(2, "0")}E${String(ep.n).padStart(2, "0")}`;

    return `
      <button class="ep${done ? " done" : ""}${future ? " future" : ""}${filler ? " filler" : ""}"
              data-show="${show.id}" data-season="${season.n}" data-ep="${ep.n}"
              aria-pressed="${done}"
              data-tip-title="${esc(ep.t)}" data-tip-desc="${esc(ep.o || "")}">
        <span class="ep-rating r-${band(ep.r)}">${future ? "·" : fmtRating(ep.r)}</span>
        <span class="ep-main">
          <span class="ep-code">${code}</span>
          <span class="ep-title">${esc(ep.t)}</span>
        </span>
        ${filler ? '<span class="ep-flag" title="Filler - not counted">F</span>' : ""}
        <span class="ep-tick" aria-hidden="true">✓</span>
      </button>`;
  }

  function seasonBlock(show, season) {
    const key = `${show.id}-${sk(season)}`;
    const { done, total } = tally(seasonRefs(show, season));
    const collapsed = state.collapsed.has(key);
    const rated = season.episodes.filter((e) => e.r != null);
    const avg = rated.length
      ? rated.reduce((s, e) => s + e.r, 0) / rated.length
      : null;
    const best = rated.length
      ? rated.reduce((a, b) => (b.r > a.r ? b : a))
      : null;
    const boxState = done === 0 ? "" : done === total ? " all" : " some";

    return `
      <section class="season${collapsed ? " collapsed" : ""}" data-key="${key}">
        <header class="season-head">
          <button class="season-box${boxState}" data-season-toggle="${key}"
                  aria-label="Mark season ${season.n} watched">✓</button>
          <button class="season-name" data-collapse="${key}"
                  aria-expanded="${!collapsed}">
            <span class="chev">▾</span>
            <b>Season ${season.n}${absOn() ? ` · ${absRange(show, season)}` : season.label ? ` · ${esc(season.label)}` : ""}</b>
          </button>
          <span class="season-meta">
            ${total} ep
            ${avg != null ? `<i class="r-${band(avg)}">${avg.toFixed(1)} avg</i>` : ""}
            ${best ? `<em>best: ${esc(best.t)}</em>` : ""}
          </span>
          <span class="season-count">${done} / ${total}</span>
          <span class="season-bar"><i style="width:${total ? (done / total) * 100 : 0}%"></i></span>
        </header>
        <div class="ep-grid">
          ${season.episodes.map((ep) => episodeTile(show, season, ep)).join("")}
        </div>
      </section>`;
  }

  function chainBlock(show, seasons) {
    const key = `${show.id}-c${sk(seasons[0])}`;
    const refs = seasons.flatMap((se) => seasonRefs(show, se));
    const { done, total } = tally(refs);
    const count = seasons.reduce((n, se) => n + se.episodes.length, 0);
    if (!chainSeen.has(key)) {
      chainSeen.add(key);
      if (count > BIG_SEASON && !chainTouched.has(key)) state.collapsed.add(key);
    }
    const collapsed = state.collapsed.has(key);
    const eps = seasons.flatMap((se) => se.episodes);
    const rated = eps.filter((e) => e.r != null);
    const avg = rated.length ? rated.reduce((n, e) => n + e.r, 0) / rated.length : null;
    const best = rated.length ? rated.reduce((a, b) => (b.r > a.r ? b : a)) : null;
    const first = seasons[0];
    const last = seasons[seasons.length - 1];
    const from = absOf(show, first.n, first.episodes[0].n);
    const to = absOf(show, last.n, last.episodes[last.episodes.length - 1].n);
    const boxState = done === 0 ? "" : done === total ? " all" : " some";

    return `
      <section class="season chain${collapsed ? " collapsed" : ""}" data-key="${key}"
               data-chain="${show.id}|${seasons.map(sk).join(",")}">
        <header class="season-head">
          <button class="season-box${boxState}" data-chain-toggle="${key}"
                  aria-label="Mark episodes ${from} to ${to} watched">✓</button>
          <button class="season-name" data-collapse="${key}" aria-expanded="${!collapsed}">
            <span class="chev">▾</span>
            <b>Episodes ${from}–${to}</b>
          </button>
          <span class="season-meta">
            ${total} ep
            ${avg != null ? `<i class="r-${band(avg)}">${avg.toFixed(1)} avg</i>` : ""}
            ${best ? `<em>best: ${esc(best.t)}</em>` : ""}
          </span>
          <span class="season-count">${done} / ${total}</span>
          <span class="season-bar"><i style="width:${total ? (done / total) * 100 : 0}%"></i></span>
        </header>
        <div class="ep-grid">
          ${seasons.map((se) => se.episodes.map((ep) => episodeTile(show, se, ep)).join("")).join("")}
        </div>
      </section>`;
  }

  const chainSeen = new Set();
  const chainTouched = new Set();

  function chainOf(el) {
    const [showId, keys] = el.dataset.chain.split("|");
    const show = DATA.shows.find((x) => String(x.id) === showId);
    const want = keys.split(",");
    return { show, seasons: show.seasons.filter((se) => want.includes(String(sk(se)))) };
  }

  function seasonsHtml(show, seasons) {
    if (!seasons.length) return "";
    if (!absOn()) return seasons.map((se) => seasonBlock(show, se)).join("");
    const breaks = (DATA.breaks || [])
      .filter((x) => String(x).startsWith(`${show.id}:`))
      .map((x) => Number(String(x).split(":")[1]));
    const runs = [[]];
    seasons.forEach((se) => {
      const run = runs[runs.length - 1];
      if (run.length && run[run.length - 1].n === se.n) runs.push([]);
      runs[runs.length - 1].push(se);
      const end = absOf(show, se.n, se.episodes[se.episodes.length - 1].n);
      if (breaks.includes(end)) runs.push([]);
    });
    return runs.filter((r) => r.length).map((r) => chainBlock(show, r)).join("");
  }

  function showHead(show) {
    const { done, total } = tally(showRefs(show));
    const eps = show.seasons.reduce((n, s) => n + s.episodes.length, 0);

    return `
        <header class="show-head">
          <div class="show-poster">
            ${
              show.poster
                ? `<img src="${show.poster}" alt="Poster for ${esc(show.title)}" loading="lazy" decoding="async">`
                : ""
            }
            <span class="stamp">Seen</span>
          </div>
          <div class="show-info">
            <h2>${esc(show.title)}</h2>
            <p class="show-meta">
              ${show.year ? `<span>${show.year}</span>` : ""}
              <span>${whole(show).length} season${whole(show).length === 1 ? "" : "s"}</span>
              <span>${eps} episodes</span>
              ${show.score != null ? `<span class="r-${band(show.score)}">${show.score.toFixed(1)}</span>` : ""}
            </p>
            ${show.overview ? `<p class="show-blurb">${esc(show.overview)}</p>` : ""}
            <div class="show-progress">
              <span class="season-bar wide"><i style="width:${total ? (done / total) * 100 : 0}%"></i></span>
              <span class="show-count">${done} / ${total} watched</span>
              <button class="btn btn-ghost sm" data-show-toggle="${show.id}">
                ${done === total && total ? "Unmark all" : "Mark all watched"}
              </button>
              ${
                canMarkFiller
                  ? `<button class="btn btn-ghost sm" data-filler-open="${show.id}">
                     Mark fillers${fillerCount(show) ? ` (${fillerCount(show)})` : ""}
                   </button>`
                  : ""
              }
              ${
                canMarkFiller
                  ? `<button class="btn btn-ghost sm" data-arcs-open="${show.id}">
                     Arcs${Arcs.count(show) ? ` (${Arcs.count(show)})` : ""}
                   </button>`
                  : ""
              }
            </div>
          </div>
        </header>`;
  }

  function showBlock(show) {
    return `
      <article class="show reveal" data-show="${show.id}">
        ${showHead(show)}
        ${seasonsHtml(show, show.seasons)}
      </article>`;
  }

  function pageHtml() {
    if (!Array.isArray(DATA.units)) {
      return (
        DATA.shows.map(showBlock).join("") +
        (DATA.films || []).map(filmBlock).join("")
      );
    }
    const seen = new Set();
    let html = "";
    let open = null;
    let run = [];
    let runShow = null;
    const close = () => {
      if (open != null) html += seasonsHtml(runShow, run) + "</article>";
      open = null;
      run = [];
      runShow = null;
    };
    for (const unit of DATA.units) {
      const [type, a, b] = unit.split(":");
      if (type === "s") {
        const show = DATA.shows.find((x) => String(x.id) === a);
        const season = show && show.seasons.find((x) => String(sk(x)) === b);
        if (!season) continue;
        if (open !== a) {
          close();
          html += `<article class="show reveal${seen.has(a) ? " continued" : ""}" data-show="${show.id}">`;
          html += seen.has(a)
            ? `<p class="show-continued">${esc(show.title)}, continued</p>`
            : showHead(show);
          seen.add(a);
          open = a;
          runShow = show;
        }
        run.push(season);
      } else {
        const key = unit.slice(2);
        const film = (DATA.films || []).find((x) => x.film === key);
        if (!film) continue;
        close();
        html += filmBlock(film);
      }
    }
    close();
    return html;
  }

  const runtime = (mins) => {
    const m = Number(mins) || 0;
    if (!m) return "";
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  };

  const filmInfo = new Map();

  function filmDetails(f) {
    const base =
      f.src && f.src !== "registry"
        ? f
        : typeof FILMS !== "undefined" && FILMS[f.film]
          ? FILMS[f.film]
          : f;
    const more = filmInfo.get(f.film) || {};
    return {
      poster: base.poster || more.poster || "",
      mins: base.mins || more.mins || 0,
      score: base.score || more.rating || null,
      plot: f.note || more.plot || "",
      genres: more.genres || [],
      director: more.director || "",
      cast: more.cast || [],
      rated: more.rated || "",
      languages: more.languages || [],
      awards: more.awards || "",
      loading: !filmInfo.has(f.film),
    };
  }

  function filmBlock(f) {
    const ref = filmRef(f);
    const done = Store.has(...ref);
    const d = filmDetails(f);
    const facts = [
      d.director ? ["Director", d.director] : null,
      d.cast.length ? ["Cast", d.cast.slice(0, 4).join(", ")] : null,
      d.languages.length ? ["Language", d.languages.slice(0, 2).join(", ")] : null,
      d.awards ? ["Awards", d.awards] : null,
    ].filter(Boolean);

    return `
      <article class="show film-block reveal${done ? " done" : ""}" data-film="${esc(f.film)}">
        <header class="show-head">
          <div class="show-poster">
            ${
              d.poster
                ? `<img src="${esc(d.poster)}" alt="Poster for ${esc(f.title)}" loading="lazy" decoding="async">`
                : ""
            }
            <span class="stamp">Seen</span>
          </div>
          <div class="show-info">
            <span class="film-kicker">Film${f.src === "custom" ? " · added by you" : ""}</span>
            <h2>${esc(f.title)}</h2>
            <p class="show-meta">
              ${f.year ? `<span>${esc(f.year)}</span>` : ""}
              ${d.mins ? `<span>${runtime(d.mins)}</span>` : ""}
              ${d.rated ? `<span>${esc(d.rated)}</span>` : ""}
              ${d.genres.length ? `<span>${esc(d.genres.slice(0, 3).join(", "))}</span>` : ""}
              ${d.score ? `<span class="r-${band(d.score)}">${Number(d.score).toFixed(1)}</span>` : ""}
            </p>
            ${d.plot ? `<p class="show-blurb film-plot">${esc(d.plot)}</p>` : ""}
            ${
              facts.length
                ? `<dl class="film-facts">${facts
                    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
                    .join("")}</dl>`
                : d.loading && f.src !== "custom"
                  ? '<p class="film-loading">Looking up details…</p>'
                  : ""
            }
            <div class="show-progress">
              <button class="btn ${done ? "btn-ghost" : "btn-accent"} sm" data-film-toggle="${esc(f.film)}">
                ${done ? "Watched" : "Mark watched"}
              </button>
            </div>
          </div>
        </header>
      </article>`;
  }

  let hydrating = false;
  async function hydrateFilms() {
    if (hydrating || typeof OMDb === "undefined" || !OMDb.enabled()) return;
    const todo = (DATA.films || []).filter((f) => !filmInfo.has(f.film) && f.src !== "custom");
    if (!todo.length) return;
    hydrating = true;
    await Promise.all(
      todo.map(async (f) => {
        let info = null;
        try {
          info = await OMDb.lookup({ title: f.title, year: f.year });
          if (!info && f.year) info = await OMDb.lookup({ title: f.title });
        } catch (e) {}
        filmInfo.set(f.film, info || {});
      }),
    );
    hydrating = false;
    render();
  }

  function redrawArcs() {
    if (!canMarkFiller || typeof Arcs === "undefined" || !DATA.shows[0]) return;
    try {
      Arcs.decorate(root, DATA.shows);
    } catch (err) {
      console.error("Arcs could not draw", err);
    }
  }

  let painted = false;

  function render() {
    if (firstRender) {
      DATA.shows.forEach((sh) =>
        sh.seasons.forEach((se) => {
          if (se.episodes.length > BIG_SEASON)
            state.collapsed.add(`${sh.id}-${sk(se)}`);
        }),
      );
      firstRender = false;
    }

    root.innerHTML = pageHtml();

    root.classList.toggle("hide-watched", state.hideWatched);
    root.classList.toggle("dense", state.dense);
    if (canMarkFiller && typeof Arcs !== "undefined" && DATA.shows[0]) {
      Arcs.setHost({ uni: UNI, bucketOf, show: DATA.shows[0], rerender: render });
      redrawArcs();
    }
    const absSwitch = document.getElementById("absNum");
    if (absSwitch) {
      absSwitch.hidden = false;
      absSwitch.classList.toggle("on", absOn());
      absSwitch.setAttribute("aria-checked", String(absOn()));
    }
    const arcsSwitch = document.getElementById("arcsView");
    if (arcsSwitch) {
      arcsSwitch.hidden = !canMarkFiller;
      arcsSwitch.classList.toggle("on", Arcs.enabled());
      arcsSwitch.setAttribute("aria-checked", String(Arcs.enabled()));
    }
    updateSummary();
    hydrateFilms();
    if (painted)
      root.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
    painted = true;
    if (typeof initReveal === "function") initReveal();
  }

  function updateSummary() {
    const refs = allRefs();
    const { done, total } = tally(refs);
    const pct = total ? (done / total) * 100 : 0;

    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    set("figWatched", done);
    set("figLeft", total - done);
    set("figTotal", total);
    set("ringLabel", Math.round(pct) + "%");

    const mins = DATA.shows.reduce(
      (sum, sh) =>
        sum +
        sh.seasons.reduce(
          (s, se) =>
            s +
            se.episodes.reduce(
              (t, ep) =>
                t +
                (aired(ep) && !Store.has(...epRef(sh.id, se.n, ep.n))
                  ? ep.m || 0
                  : 0),
              0,
            ),
          0,
        ),
      0,
    );
    set(
      "figTime",
      mins >= 1440
        ? `${(mins / 1440).toFixed(1)}d`
        : `${Math.round(mins / 60)}h`,
    );

    const rail = document.getElementById("progressRail");
    if (rail) rail.style.width = pct + "%";
    const ring = document.getElementById("ringFg");
    if (ring) {
      const C = 2 * Math.PI * 19;
      ring.style.strokeDashoffset = C - (pct / 100) * C;
    }
  }

  let fillerShow = null;
  let lastPicked = null;

  function openFiller(showId) {
    fillerShow = DATA.shows.find((s) => s.id === showId);
    if (!fillerShow) return;
    lastPicked = null;

    let el = document.getElementById("fillerModal");
    if (!el) {
      const backdrop = document.createElement("div");
      backdrop.className = "filler-backdrop";
      backdrop.id = "fillerBackdrop";

      el = document.createElement("aside");
      el.className = "filler-modal";
      el.id = "fillerModal";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", "Mark filler episodes");

      document.body.append(backdrop, el);
      backdrop.addEventListener("click", closeFiller);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && document.getElementById("fillerModal"))
          closeFiller();
      });
    }

    drawFiller();
    requestAnimationFrame(() => {
      document.getElementById("fillerBackdrop").classList.add("show");
      document.getElementById("fillerModal").classList.add("show");
    });
  }

  function closeFiller() {
    const el = document.getElementById("fillerModal");
    const bd = document.getElementById("fillerBackdrop");
    if (!el) return;
    el.classList.remove("show");
    bd.classList.remove("show");
    setTimeout(() => {
      el.remove();
      bd.remove();
    }, 200);
    fillerShow = null;
    render();
  }

  function drawFiller() {
    const el = document.getElementById("fillerModal");
    const show = fillerShow;
    const marked = fillerCount(show);
    const total = whole(show).reduce((n, se) => n + se.episodes.length, 0);

    el.innerHTML = `
      <div class="filler-head">
        <div>
          <h3>Filler in ${esc(show.title)}</h3>
          <p>${marked} of ${total} marked. Marked episodes leave the count entirely.</p>
        </div>
        <button class="filler-close" aria-label="Close">✕</button>
      </div>

      <div class="filler-tools">
        <input id="fillerRange" type="text" spellcheck="false"
               placeholder="${absOn() ? "Paste a range by overall episode number: 26-97, 101-106" : "Paste a range: 26-97, or 2x1-12 for one season"}" aria-label="Episode ranges" />
        <button class="btn sm" id="fillerApply">Mark range</button>
        <button class="btn sm" id="fillerClear">Clear all</button>
        <button type="button" class="switch${absOn() ? " on" : ""}" id="fillerAbs" role="switch" aria-checked="${absOn()}" title="Number episodes 1 to the end, ignoring seasons"><span class="switch-track"><span class="switch-knob"></span></span><span>Continuous episodes</span></button>
      </div>

      <div class="filler-body">
        ${whole(show)
          .map(
            (se) => `
          <section class="filler-season">
            <header>
              <b>Season ${se.n}${absOn() ? ` · ${absRange(show, se)}` : ""}</b>
              <button class="btn btn-ghost sm" data-filler-season="${se.n}">
                Toggle season
              </button>
            </header>
            <div class="filler-grid">
              ${se.episodes
                .map((ep) => {
                  const on = isFiller(show.id, se.n, ep.n);
                  return `<button class="fsq${on ? " on" : ""}"
                          data-s="${se.n}" data-e="${ep.n}"
                          data-abs="${absOf(show, se.n, ep.n)}"
                          title="${esc(ep.t || "")}">${absOn() ? absOf(show, se.n, ep.n) : ep.n}</button>`;
                })
                .join("")}
            </div>
          </section>`,
          )
          .join("")}
      </div>

      <div class="filler-foot">
        <span>Shift-click to fill a range.</span>
        <button class="btn btn-accent" id="fillerDone">Done</button>
      </div>`;

    el.querySelector(".filler-close").addEventListener("click", closeFiller);
    el.querySelector("#fillerDone").addEventListener("click", closeFiller);

    el.querySelector("#fillerClear").addEventListener("click", () => {
      const refs = [];
      whole(show).forEach((se) =>
        se.episodes.forEach((ep) =>
          refs.push([fillerBucket(show.id), fillerKey(show.id, se.n, ep.n)]),
        ),
      );
      Store.setRefs(refs, false);
      drawFiller();
    });

    el.querySelector("#fillerAbs").addEventListener("click", () => {
      toggleAbs();
      lastPicked = null;
      drawFiller();
      render();
    });

    el.querySelector("#fillerApply").addEventListener("click", applyRange);
    el.querySelector("#fillerRange").addEventListener("keydown", (e) => {
      if (e.key === "Enter") applyRange();
    });

    el.querySelectorAll("[data-filler-season]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const n = Number(btn.dataset.fillerSeason);
        const se = whole(show).find((x) => x.n === n);
        const refs = se.episodes.map((ep) => [
          fillerBucket(show.id),
          fillerKey(show.id, n, ep.n),
        ]);
        const allOn = refs.every((r) => Store.has(...r));
        Store.setRefs(refs, !allOn);
        drawFiller();
      }),
    );

    el.querySelectorAll(".fsq").forEach((sq) =>
      sq.addEventListener("click", (e) => {
        const s = Number(sq.dataset.s);
        const n = Number(sq.dataset.e);

        const abs = Number(sq.dataset.abs);
        if (e.shiftKey && lastPicked && absOn()) {
          const [from, to] = [lastPicked.abs, abs].sort((a, b) => a - b);
          const refs = [];
          whole(show).forEach((se) =>
            se.episodes.forEach((ep) => {
              const a = absOf(show, se.n, ep.n);
              if (a >= from && a <= to) refs.push([fillerBucket(show.id), fillerKey(show.id, se.n, ep.n)]);
            }),
          );
          Store.setRefs(refs, true);
        } else if (e.shiftKey && lastPicked && lastPicked.s === s) {
          const [from, to] = [lastPicked.e, n].sort((a, b) => a - b);
          const se = whole(show).find((x) => x.n === s);
          const refs = se.episodes
            .filter((ep) => ep.n >= from && ep.n <= to)
            .map((ep) => [fillerBucket(show.id), fillerKey(show.id, s, ep.n)]);
          Store.setRefs(refs, true);
        } else {
          Store.toggle(fillerBucket(show.id), fillerKey(show.id, s, n));
        }

        lastPicked = { s, e: n, abs };
        drawFiller();
      }),
    );
  }

  function applyRange() {
    const input = document.getElementById("fillerRange");
    const text = input.value.trim();
    if (!text) return;

    const show = fillerShow;
    const refs = [];

    text.split(/[,;]/).forEach((chunk) => {
      const part = chunk.trim();
      if (!part) return;

      const scoped = part.match(/^(\d+)\s*[x:]\s*(\d+)(?:\s*-\s*(\d+))?$/i);
      const plain = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);

      if (scoped) {
        const s = Number(scoped[1]);
        const from = Number(scoped[2]);
        const to = Number(scoped[3] ?? scoped[2]);
        const se = whole(show).find((x) => x.n === s);
        if (!se) return;
        se.episodes
          .filter((ep) => ep.n >= from && ep.n <= to)
          .forEach((ep) => refs.push([fillerBucket(show.id), fillerKey(show.id, s, ep.n)]));
      } else if (plain) {
        const from = Number(plain[1]);
        const to = Number(plain[2] ?? plain[1]);
        const within = (se, ep) => {
          const v = absOn() ? absOf(show, se.n, ep.n) : ep.n;
          return v >= from && v <= to;
        };
        whole(show).forEach((se) =>
          se.episodes
            .filter((ep) => within(se, ep))
            .forEach((ep) =>
              refs.push([fillerBucket(show.id), fillerKey(show.id, se.n, ep.n)]),
            ),
        );
      }
    });

    if (refs.length) Store.setRefs(refs, true);
    input.value = "";
    drawFiller();
  }

  root.addEventListener("click", (e) => {
    const ep = e.target.closest(".ep");
    if (ep) {
      const ref = epRef(+ep.dataset.show, +ep.dataset.season, +ep.dataset.ep);
      const now = Store.toggle(...ref);
      ep.classList.toggle("done", now);
      ep.setAttribute("aria-pressed", String(now));
      refreshCounters();
      return;
    }

    const collapse = e.target.closest("[data-collapse]");
    if (collapse) {
      const key = collapse.dataset.collapse;
      const block = root.querySelector(`.season[data-key="${key}"]`);
      const nowCollapsed = !state.collapsed.has(key);
      chainTouched.add(key);
      state.collapsed[nowCollapsed ? "add" : "delete"](key);
      block.classList.toggle("collapsed", nowCollapsed);
      collapse.setAttribute("aria-expanded", String(!nowCollapsed));
      rememberCollapsed();
      redrawArcs();
      return;
    }

    const chainBox = e.target.closest("[data-chain-toggle]");
    if (chainBox) {
      const { show, seasons } = chainOf(chainBox.closest(".season"));
      const refs = seasons.flatMap((se) => seasonRefs(show, se));
      Store.setRefs(refs, !refs.every((r) => Store.has(...r)));
      render();
      return;
    }

    const seasonBox = e.target.closest("[data-season-toggle]");
    if (seasonBox) {
      const [showIdRaw, n] = seasonBox.dataset.seasonToggle.split("-");
      const showId = Number(showIdRaw);
      const show = DATA.shows.find((s) => s.id === showId);
      const season = show.seasons.find((s) => String(sk(s)) === n);
      const refs = seasonRefs(show, season);
      const allDone = refs.every((r) => Store.has(...r));
      Store.setRefs(refs, !allDone);
      render();
      return;
    }

    const arcsBtn = e.target.closest("[data-arcs-open]");
    if (arcsBtn) {
      Arcs.open(DATA.shows.find((sh) => String(sh.id) === arcsBtn.dataset.arcsOpen));
      return;
    }
    const fillerBtn = e.target.closest("[data-filler-open]");
    if (fillerBtn) {
      openFiller(Number(fillerBtn.dataset.fillerOpen));
      return;
    }

    const showBtn = e.target.closest("[data-show-toggle]");
    if (showBtn) {
      const show = DATA.shows.find((s) => s.id === +showBtn.dataset.showToggle);
      const refs = showRefs(show);
      Store.setRefs(refs, !refs.every((r) => Store.has(...r)));
      render();
      return;
    }

    const filmBtn = e.target.closest("[data-film-toggle]");
    if (filmBtn) {
      const f = (DATA.films || []).find(
        (x) => x.film === filmBtn.dataset.filmToggle,
      );
      Store.toggle(...filmRef(f));
      render();
    }
  });

  function refreshChains() {
    root.querySelectorAll(".season.chain").forEach((el) => {
      const { show, seasons } = chainOf(el);
      const { done, total } = tally(seasons.flatMap((se) => seasonRefs(show, se)));
      el.querySelector(".season-count").textContent = `${done} / ${total}`;
      el.querySelector(".season-bar i").style.width = (total ? (done / total) * 100 : 0) + "%";
      const box = el.querySelector(".season-box");
      box.classList.toggle("all", total > 0 && done === total);
      box.classList.toggle("some", done > 0 && done < total);
    });
  }

  function refreshCounters() {
    refreshChains();
    DATA.shows.forEach((show) => {
      const showEl = root.querySelector(`.show[data-show="${show.id}"]`);
      if (!showEl) return;

      show.seasons.forEach((season) => {
        const key = `${show.id}-${sk(season)}`;
        const el = root.querySelector(`.season[data-key="${key}"]`);
        if (!el) return;
        const { done, total } = tally(seasonRefs(show, season));
        el.querySelector(".season-count").textContent = `${done} / ${total}`;
        el.querySelector(".season-bar i").style.width =
          (total ? (done / total) * 100 : 0) + "%";
        const box = el.querySelector(".season-box");
        box.classList.toggle("all", total > 0 && done === total);
        box.classList.toggle("some", done > 0 && done < total);
      });

      const { done, total } = tally(showRefs(show));
      if (!showEl.querySelector(".show-count")) return;
      showEl.querySelector(".show-count").textContent =
        `${done} / ${total} watched`;
      showEl.querySelector(".show-progress .season-bar i").style.width =
        (total ? (done / total) * 100 : 0) + "%";
      showEl.querySelector("[data-show-toggle]").textContent =
        done === total && total ? "Unmark all" : "Mark all watched";
    });
    updateSummary();
  }

  const FLAGS = "__flags";
  const ongoingKey = `ongoing:${UNI}`;
  const endedKey = `ended:${UNI}`;

  function autoOngoing() {
    const meta = (window.SERIES_COUNTS || {})[UNI];
    return !!(meta && meta.ongoing);
  }

  function ongoingNow() {
    if (Store.has(FLAGS, ongoingKey)) return true;
    if (Store.has(FLAGS, endedKey)) return false;
    return autoOngoing();
  }

  function syncOngoingBtn() {
    const btn = document.getElementById("markOngoing");
    if (!btn) return;
    const on = ongoingNow();
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? "◉ Ongoing" : "Mark ongoing";
    btn.title = on
      ? "Marked as still releasing - click to mark finished"
      : "Mark as still releasing";
  }

  const ongoingBtn = document.getElementById("markOngoing");
  if (ongoingBtn)
    ongoingBtn.addEventListener("click", () => {
      const next = !ongoingNow();
      Store.setRefs([[FLAGS, ongoingKey]], next);
      Store.setRefs([[FLAGS, endedKey]], !next);
      syncOngoingBtn();
      if (typeof toast === "function") {
        toast(next ? "Marked as still releasing" : "Marked as finished");
      }
    });

  const on = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", fn);
  };

  on("collapseAll", (e) => {
    const blocks = [...root.querySelectorAll(".season[data-key]")];
    const anyOpen = blocks.some((el) => !el.classList.contains("collapsed"));
    blocks.forEach((el) => {
      state.collapsed[anyOpen ? "add" : "delete"](el.dataset.key);
      chainTouched.add(el.dataset.key);
    });
    rememberCollapsed();
    e.currentTarget.textContent = anyOpen ? "Expand all" : "Collapse all";
    render();
  });

  on("hideWatched", (e) => {
    state.hideWatched = !state.hideWatched;
    e.currentTarget.classList.toggle("active", state.hideWatched);
    e.currentTarget.setAttribute("aria-pressed", String(state.hideWatched));
    root.classList.toggle("hide-watched", state.hideWatched);
  });

  const viewBtn = document.getElementById("viewMenuBtn");
  const viewPanel = document.getElementById("viewMenuPanel");
  if (viewBtn && viewPanel) {
    const setOpen = (open) => {
      viewPanel.hidden = !open;
      viewBtn.setAttribute("aria-expanded", String(open));
    };
    viewBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setOpen(viewPanel.hidden);
    });
    document.addEventListener("click", (e) => {
      if (!viewPanel.hidden && !viewPanel.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  on("absNum", () => {
    toggleAbs();
    render();
  });

  on("arcsView", () => {
    Arcs.toggle();
    render();
  });

  on("denseView", (e) => {
    state.dense = !state.dense;
    e.currentTarget.classList.toggle("active", state.dense);
    e.currentTarget.setAttribute("aria-pressed", String(state.dense));
    root.classList.toggle("dense", state.dense);
  });

  on("jumpNext", () => {
    for (const show of DATA.shows) {
      for (const season of show.seasons) {
        const next = season.episodes.find(
          (ep) =>
            aired(ep) &&
            !isFiller(show.id, season.n, ep.n) &&
            !Store.has(...epRef(show.id, season.n, ep.n)),
        );
        if (!next) continue;
        const sel = `.ep[data-show="${show.id}"][data-season="${season.n}"][data-ep="${next.n}"]`;
        const holder = (root.querySelector(sel) || { closest: () => null }).closest(".season");
        if (holder && state.collapsed.has(holder.dataset.key)) {
          state.collapsed.delete(holder.dataset.key);
          chainTouched.add(holder.dataset.key);
          rememberCollapsed();
          render();
        }
        const el = root.querySelector(sel);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("flash");
          setTimeout(() => el.classList.remove("flash"), 1200);
        }
        return;
      }
    }
    if (typeof toast === "function") toast("Everything aired is watched");
  });

  on("resetShow", () => {
    if (!confirm("Clear all progress for this universe?")) return;
    Store.setRefs(allRefs(), false);
    render();
  });

  window.SeriesPage = { uni: UNI, data: DATA, render };

  render();
  syncOngoingBtn();
})();
