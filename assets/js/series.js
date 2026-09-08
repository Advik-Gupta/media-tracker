(() => {
  const UNI = document.body.dataset.universe;
  const DATA = (window.SERIES || {})[UNI];
  const root = document.getElementById("seriesRoot");
  if (!DATA || !root) return;

  const CAT = (window.CATALOGUES || {})[UNI] || {};

  if (Store.migrateMerges) Store.migrateMerges();

  const epRef = (showId, s, e) => [UNI, `e${showId}-${s}x${e}`];
  const filmRef = (f) =>
    typeof progressRef === "function"
      ? progressRef(UNI, { film: f.film })
      : [UNI, f.film];

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  const aired = (ep) => ep.d && new Date(ep.d) <= new Date();

  const FILLER = `__filler_${UNI}`;
  const fillerKey = (showId, s, e) => `e${showId}-${s}x${e}`;
  const isFiller = (showId, s, e) => Store.has(FILLER, fillerKey(showId, s, e));
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
    const code = `S${String(season.n).padStart(2, "0")}E${String(ep.n).padStart(2, "0")}`;

    return `
      <button class="ep${done ? " done" : ""}${future ? " future" : ""}${filler ? " filler" : ""}"
              data-show="${show.id}" data-season="${season.n}" data-ep="${ep.n}"
              aria-pressed="${done}"
              title="${esc(ep.t)}${ep.o ? " - " + esc(ep.o) : ""}">
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
    const key = `${show.id}-${season.n}`;
    const { done, total } = tally(seasonRefs(show, season));
    const collapsed = state.collapsed.has(key);
    const rated = season.episodes.filter((e) => e.r != null);
    const avg = rated.length
      ? rated.reduce((s, e) => s + e.r, 0) / rated.length
      : null;
    const best = rated.length
      ? rated.reduce((a, b) => (b.r > a.r ? b : a))
      : null;
    const skipped =
      season.episodes.length > 0 &&
      season.episodes.every((ep) => isFiller(show.id, season.n, ep.n));

    const boxState = done === 0 ? "" : done === total ? " all" : " some";

    return `
      <section class="season${collapsed ? " collapsed" : ""}${skipped ? " skipped" : ""}" data-key="${key}">
        <header class="season-head">
          <button class="season-box${boxState}" data-season-toggle="${key}"
                  aria-label="Mark season ${season.n} watched">✓</button>
          <button class="season-name" data-collapse="${key}"
                  aria-expanded="${!collapsed}">
            <span class="chev">▾</span>
            <b>Season ${season.n}</b>
          </button>
          <span class="season-meta">
            ${total} ep
            ${avg != null ? `<i class="r-${band(avg)}">${avg.toFixed(1)} avg</i>` : ""}
            ${best ? `<em>best: ${esc(best.t)}</em>` : ""}
          </span>
          <span class="season-count">${done} / ${total}</span>
          <span class="season-bar"><i style="width:${total ? (done / total) * 100 : 0}%"></i></span>
          <button class="season-skip-toggle${skipped ? " on" : ""}" data-season-skip="${show.id}-${season.n}"
                  title="${skipped ? "Not counted toward completion - click to include it again" : "Mark this season not worth watching - excludes it from completion %"}">
            ${skipped ? "Not counted" : "Skip season"}
          </button>
        </header>
        <div class="ep-grid">
          ${season.episodes.map((ep) => episodeTile(show, season, ep)).join("")}
        </div>
      </section>`;
  }

  function showBlock(show) {
    const { done, total } = tally(showRefs(show));
    const eps = show.seasons.reduce((n, s) => n + s.episodes.length, 0);

    return `
      <article class="show reveal" data-show="${show.id}">
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
              <span>${show.seasons.length} season${show.seasons.length === 1 ? "" : "s"}</span>
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
            </div>
          </div>
        </header>
        ${show.seasons.map((se) => seasonBlock(show, se)).join("")}
      </article>`;
  }

  function filmBlock(f) {
    const ref = filmRef(f);
    const done = Store.has(...ref);
    const meta =
      typeof FILMS !== "undefined" && FILMS[f.film] ? FILMS[f.film] : {};

    return `
      <article class="show film-block reveal${done ? " done" : ""}" data-film="${esc(f.film)}">
        <header class="show-head">
          <div class="show-poster">
            ${
              meta.poster
                ? `<img src="${meta.poster}" alt="Poster for ${esc(f.title)}" loading="lazy" decoding="async">`
                : ""
            }
            <span class="stamp">Seen</span>
          </div>
          <div class="show-info">
            <span class="badge">Film</span>
            <h2>${esc(f.title)}</h2>
            <p class="show-meta">
              <span>${f.year}</span>
              ${meta.mins ? `<span>${fmtRuntime(meta.mins)}</span>` : ""}
              ${meta.score ? `<span class="r-${band(meta.score)}">${meta.score.toFixed(1)}</span>` : ""}
            </p>
            <div class="show-progress">
              <button class="btn ${done ? "btn-ghost" : "btn-accent"} sm" data-film-toggle="${esc(f.film)}">
                ${done ? "Watched" : "Mark watched"}
              </button>
            </div>
          </div>
        </header>
      </article>`;
  }

  function render() {
    if (firstRender) {
      DATA.shows.forEach((sh) =>
        sh.seasons.forEach((se) => {
          if (se.episodes.length > BIG_SEASON)
            state.collapsed.add(`${sh.id}-${se.n}`);
        }),
      );
      firstRender = false;
    }

    root.innerHTML =
      DATA.shows.map(showBlock).join("") +
      (DATA.films || []).map(filmBlock).join("");

    root.classList.toggle("hide-watched", state.hideWatched);
    root.classList.toggle("dense", state.dense);
    updateSummary();
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
    const total = show.seasons.reduce((n, se) => n + se.episodes.length, 0);

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
               placeholder="Paste a range: 26-97, 101-106" aria-label="Episode ranges" />
        <button class="btn sm" id="fillerApply">Mark range</button>
        <button class="btn sm" id="fillerClear">Clear all</button>
      </div>

      <div class="filler-body">
        ${show.seasons
          .map(
            (se) => `
          <section class="filler-season">
            <header>
              <b>Season ${se.n}</b>
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
                          title="${esc(ep.t || "")}">${ep.n}</button>`;
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
      show.seasons.forEach((se) =>
        se.episodes.forEach((ep) =>
          refs.push([FILLER, fillerKey(show.id, se.n, ep.n)]),
        ),
      );
      Store.setRefs(refs, false);
      drawFiller();
    });

    el.querySelector("#fillerApply").addEventListener("click", applyRange);
    el.querySelector("#fillerRange").addEventListener("keydown", (e) => {
      if (e.key === "Enter") applyRange();
    });

    el.querySelectorAll("[data-filler-season]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const n = Number(btn.dataset.fillerSeason);
        const se = show.seasons.find((x) => x.n === n);
        const refs = se.episodes.map((ep) => [
          FILLER,
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

        if (e.shiftKey && lastPicked && lastPicked.s === s) {
          const [from, to] = [lastPicked.e, n].sort((a, b) => a - b);
          const se = show.seasons.find((x) => x.n === s);
          const refs = se.episodes
            .filter((ep) => ep.n >= from && ep.n <= to)
            .map((ep) => [FILLER, fillerKey(show.id, s, ep.n)]);
          Store.setRefs(refs, true);
        } else {
          Store.toggle(FILLER, fillerKey(show.id, s, n));
        }

        lastPicked = { s, e: n };
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
        const se = show.seasons.find((x) => x.n === s);
        if (!se) return;
        se.episodes
          .filter((ep) => ep.n >= from && ep.n <= to)
          .forEach((ep) => refs.push([FILLER, fillerKey(show.id, s, ep.n)]));
      } else if (plain) {
        const from = Number(plain[1]);
        const to = Number(plain[2] ?? plain[1]);
        show.seasons.forEach((se) =>
          se.episodes
            .filter((ep) => ep.n >= from && ep.n <= to)
            .forEach((ep) =>
              refs.push([FILLER, fillerKey(show.id, se.n, ep.n)]),
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
      state.collapsed[nowCollapsed ? "add" : "delete"](key);
      block.classList.toggle("collapsed", nowCollapsed);
      collapse.setAttribute("aria-expanded", String(!nowCollapsed));
      rememberCollapsed();
      return;
    }

    const seasonBox = e.target.closest("[data-season-toggle]");
    if (seasonBox) {
      const [showId, n] = seasonBox.dataset.seasonToggle.split("-").map(Number);
      const show = DATA.shows.find((s) => s.id === showId);
      const season = show.seasons.find((s) => s.n === n);
      const refs = seasonRefs(show, season);
      const allDone = refs.every((r) => Store.has(...r));
      Store.setRefs(refs, !allDone);
      render();
      return;
    }

    const seasonSkip = e.target.closest("[data-season-skip]");
    if (seasonSkip) {
      const [showId, n] = seasonSkip.dataset.seasonSkip.split("-").map(Number);
      const show = DATA.shows.find((s) => s.id === showId);
      const season = show.seasons.find((s) => s.n === n);
      const refs = season.episodes.map((ep) => [
        FILLER,
        fillerKey(show.id, n, ep.n),
      ]);
      const allOn = refs.every((r) => Store.has(...r));
      Store.setRefs(refs, !allOn);
      render();
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

  function refreshCounters() {
    DATA.shows.forEach((show) => {
      const showEl = root.querySelector(`.show[data-show="${show.id}"]`);
      if (!showEl) return;

      show.seasons.forEach((season) => {
        const key = `${show.id}-${season.n}`;
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
    const anyOpen = DATA.shows.some((sh) =>
      sh.seasons.some((se) => !state.collapsed.has(`${sh.id}-${se.n}`)),
    );
    DATA.shows.forEach((sh) =>
      sh.seasons.forEach((se) => {
        const k = `${sh.id}-${se.n}`;
        state.collapsed[anyOpen ? "add" : "delete"](k);
      }),
    );
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
          (ep) => aired(ep) && !Store.has(...epRef(show.id, season.n, ep.n)),
        );
        if (!next) continue;
        const key = `${show.id}-${season.n}`;
        if (state.collapsed.has(key)) {
          state.collapsed.delete(key);
          rememberCollapsed();
          render();
        }
        const el = root.querySelector(
          `.ep[data-show="${show.id}"][data-season="${season.n}"][data-ep="${next.n}"]`,
        );
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

  render();
  syncOngoingBtn();
})();
