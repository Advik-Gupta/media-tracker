(() => {
  const UNIVERSE = document.body.dataset.universe;
  const CAT = (window.CATALOGUES || {})[UNIVERSE];
  if (!CAT) {
    console.error(
      `No catalogue registered for "${UNIVERSE}". Is its data file loaded?`,
    );
    return;
  }

  Store.migrateLinks();

  const DATA = CAT.items.map((it) =>
    typeof resolveFilm === "function" && it.film ? resolveFilm(it) : it,
  );
  const TYPE_META = CAT.types;
  const REL_META = CAT.rel;
  const SAGA_META = CAT.saga;
  const PHASE_META = CAT.phase;
  const WATCH_BLOCKS = CAT.watchBlocks;
  const ERAS = CAT.eras;

  const refOf = (it) => progressRef(UNIVERSE, it);
  const isWatched = (it) => Store.has(...refOf(it));
  const sameWork = (a, b) => {
    const x = refOf(a),
      y = refOf(b);
    return x[0] === y[0] && x[1] === y[1];
  };

  const posterKey = (it) =>
    it.film || it.link || `${UNIVERSE}/${it.alias || it.id}`;

  const posterSrc = (it) => {
    const own = Store.posterOf(posterKey(it));
    if (own) return own;
    const f = it.poster || (CAT.posters && CAT.posters[it.id]);
    if (!f) return null;
    if (/^https?:\/\//.test(f) || f.startsWith("assets/")) return f;
    return CAT.imgDir + f;
  };

  const initials = (title) =>
    title
      .replace(/^(The|A|Star Wars:?)\s+/i, "")
      .split(/[\s:-–-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  function posterHTML(it, cls) {
    const src = posterSrc(it);
    const fallback = `<span class="ph-init">${initials(it.title)}</span>`;
    const stamp = '<span class="stamp">Seen</span>';
    if (!src) return `<div class="${cls} ph">${fallback}${stamp}</div>`;
    return `<div class="${cls}">${fallback}<img src="${src}" alt="Poster for ${esc(it.title)}"
      loading="lazy" decoding="async"
      onerror="this.closest('.${cls}').classList.add('ph'); this.remove();">${stamp}</div>`;
  }

  const esc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  const KIND = document.body.dataset.kind || "movie";
  const IS_TIMELINE_KIND = KIND === "movie";
  const VIEWS = IS_TIMELINE_KIND ? ["timeline", "rows"] : ["grid", "rows"];
  const VIEW_KEY = IS_TIMELINE_KIND ? "wv.view" : "wv.view.list";

  const savedView = localStorage.getItem(VIEW_KEY);

  const state = {
    view: VIEWS.includes(savedView) ? savedView : VIEWS[0],
    sort: "watch",
    reversed: false,
    rel: new Set(),
    type: new Set(),
    phase: new Set(),
    genre: new Set(),
    minRating: 0,
    status: null,
    query: "",
  };

  const el = {
    list: document.getElementById("list"),
    empty: document.getElementById("empty"),
    drawer: document.getElementById("drawer"),
    filterToggle: document.getElementById("filterToggle"),
    search: document.getElementById("search"),
    sheet: document.getElementById("sheet"),
    sheetBody: document.getElementById("sheetBody"),
    sheetBackdrop: document.getElementById("sheetBackdrop"),
  };

  const SORTERS = {
    watch: (a, b) => a.w - b.w,
    release: (a, b) => a.release.localeCompare(b.release) || a.w - b.w,
    chrono: (a, b) => a.chrono - b.chrono || a.w - b.w,
    relevance: (a, b) => relOf(a).rank - relOf(b).rank || a.w - b.w,
    rating: (a, b) => (ratingOf(b) ?? -1) - (ratingOf(a) ?? -1) || a.w - b.w,
  };

  const ratingOf = (it) =>
    typeof it.rgRating === "number"
      ? it.rgRating
      : typeof it.score === "number"
        ? it.score
        : null;

  const genresOf = (it) => (Array.isArray(it.genres) ? it.genres : []);

  const GROUPERS = {
    watch: (it) => {
      const side = CAT.sideGroup;
      if (side && it.saga === side.saga) {
        return { key: "side", title: side.title, sub: side.sub };
      }
      const n = (
        WATCH_BLOCKS.find((b) => it.w <= b.max) ||
        WATCH_BLOCKS[WATCH_BLOCKS.length - 1]
      ).phase;
      const p = PHASE_META[n] || { label: "Other", sub: "" };
      return { key: "p" + n, title: p.label, sub: p.sub };
    },
    release: (it) => {
      const y = it.release.slice(0, 4);
      return {
        key: y,
        title: y,
        sub: isFuture(it.release) ? "Upcoming" : "Released",
      };
    },
    chrono: (it) => {
      const e = ERAS.find((x) => it.chrono < x.max) || ERAS[ERAS.length - 1];
      return { key: e.key, title: e.title, sub: e.sub };
    },
    relevance: (it) => {
      const r = relOf(it);
      return { key: it.rel, title: r.label, sub: r.blurb };
    },

    rating: (it) => {
      const r = ratingOf(it);
      if (r == null) return { key: "unrated", title: "Not rated", sub: "" };
      const band = Math.floor(r);
      return {
        key: `r${band}`,
        title: `${band}.0 and up`,
        sub: band >= 8 ? "The good stuff" : "",
      };
    },
  };

  function visible() {
    const q = state.query.trim().toLowerCase();

    return DATA.filter((it) => {
      if (state.rel.size && !state.rel.has(it.rel)) return false;
      if (state.type.size && !state.type.has(it.type))
        return false;

      if (state.genre.size) {
        const g = genresOf(it);
        if (!g.some((x) => state.genre.has(x))) return false;
      }

      if (state.minRating) {
        const r = ratingOf(it);
        if (r == null || r < state.minRating) return false;
      }

      if (state.phase.size) {
        const tokens = [it.saga, it.phase ? "p" + it.phase : null].filter(
          Boolean,
        );
        if (!tokens.some((t) => state.phase.has(t))) return false;
      }

      const isDone = isWatched(it);
      if (state.status === "unwatched" && isDone) return false;
      if (state.status === "watched" && !isDone) return false;
      if (state.status === "released" && isFuture(it.release)) return false;

      if (q) {
        const hay =
          `${it.title} ${it.sub || ""} ${it.note || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  const CHECK_SVG =
    '<svg viewBox="0 0 14 14"><path d="M2 7.5 5.5 11 12 3.5"/></svg>';

  function indexLabel(it) {
    return {
      watch: it.w > 200 ? `X${it.w - 200}` : it.w,
      release: it.release.slice(0, 4),
      chrono: it.cLabel,
      relevance: it.w > 200 ? `X${it.w - 200}` : it.w,
    }[state.sort];
  }

  const typeOf = (it) =>
    TYPE_META[it.type] || {
      label: it.type,
      short: String(it.type).toUpperCase(),
      color: "var(--dim)",
    };
  const relOf = (it) =>
    REL_META[it.rel] || {
      label: it.rel,
      rank: 9,
      color: "var(--dim)",
      blurb: "",
    };

  function timelineItem(it, i) {
    const watched = isWatched(it);
    const type = typeOf(it);
    const rel = relOf(it);

    const wrap = document.createElement("div");
    wrap.className = `tl-item${i % 2 ? " right" : ""}${watched ? " done" : ""}`;
    wrap.style.setProperty("--rc", rel.color);
    wrap.dataset.id = it.film || it.id;

    wrap.innerHTML = `
      <span class="tl-node"></span>
      <article class="tl-card" tabindex="0" role="button" aria-label="${esc(it.title)} - open details">
        <span class="tl-num">${indexLabel(it)}</span>
        ${posterHTML(it, "tl-poster")}
        <div class="tl-body">
          <h3 class="tl-title">${esc(it.title)}</h3>
          ${it.sub ? `<p class="tl-sub">${esc(it.sub)}</p>` : ""}
          <div class="tl-badges">
            <span class="badge rel">${rel.label}</span>
            <span class="badge" style="--bc:${type.color}">${type.short}</span>
            <span class="badge plain">${it.eps ? it.eps + " ep · " : ""}${fmtRuntime(it.mins)}</span>
            <span class="badge plain">${it.release.slice(0, 4)}</span>
            ${it.upcoming ? '<span class="badge up">Upcoming</span>' : ""}
          </div>
          ${it.note ? `<p class="tl-note">${esc(it.note)}</p>` : ""}
        </div>
        <button class="tl-check" aria-label="${watched ? "Mark unwatched" : "Mark watched"}">${CHECK_SVG}</button>
      </article>`;

    bindCard(wrap, it, wrap.querySelector(".tl-card"));
    return wrap;
  }

  const SERIES_BY_TMDB = (() => {
    const map = new Map();
    const counts = window.SERIES_COUNTS || {};
    for (const [uni, meta] of Object.entries(counts)) {
      (meta.perShow || []).forEach((sh) => map.set(sh.id, { uni, show: sh }));
    }
    return map;
  })();

  const EP_RE = /^e(\d+)-\d+x\d+$/;

  function trackedProgress(it) {
    const tmdb = it.tmdb || (typeof FILMS !== "undefined" && FILMS[it.film] && FILMS[it.film].tmdb);
    if (!tmdb) return null;

    const hit = SERIES_BY_TMDB.get(tmdb);
    if (!hit || !hit.show.episodes) return null;

    const store = Store.exportAll();
    const bucket = store[hit.uni] || {};
    const filler = store[`__filler_${hit.uni}`] || {};
    const prefix = `e${tmdb}-`;

    let done = 0;
    for (const key of Object.keys(bucket)) {
      if (key.startsWith(prefix) && !filler[key] && EP_RE.test(key)) done += 1;
    }

    const total = hit.show.episodes;
    return { done, total, pct: total ? Math.min(100, (done / total) * 100) : 0, href: hit.uni };
  }

  function detailLink(it) {
    if (!it.film) return "";
    const isSeries = it.type === "show" || it.type === "season" || tmdbOf(it);
    if (isSeries) return "";
    return `<a class="pcard-info" href="pages/movies/view.html?film=${esc(it.film)}"
               title="Details for ${esc(it.title)}" aria-label="Details for ${esc(it.title)}"
               onclick="event.stopPropagation()">i</a>`;
  }

  function gridItem(it) {
    const watched = isWatched(it);
    const rel = relOf(it);

    const card = document.createElement("article");
    card.className = `pcard${watched ? " done" : ""}`;
    card.style.setProperty("--rc", rel.color);
    card.dataset.id = it.film || it.id;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${esc(it.title)} - open details`);

    const tracked = trackedProgress(it);
    const partial = tracked && tracked.done > 0 && tracked.done < tracked.total;

    if (tracked && tracked.done >= tracked.total && tracked.total > 0) {
      card.classList.add("done");
    }
    if (partial) card.classList.add("part");

    card.innerHTML = `
      ${posterHTML(it, "pcard-poster")}
      ${detailLink(it)}
      ${
        partial
          ? `<span class="pcard-part" style="--pct:${tracked.pct}%"
                   title="${tracked.done} of ${tracked.total} episodes"></span>`
          : ""
      }
      <button class="tl-check" aria-label="${watched ? "Mark unwatched" : "Mark watched"}">${CHECK_SVG}</button>
      <div class="pcard-body">
        <h3 class="pcard-title">${esc(it.title)}</h3>
        <p class="pcard-meta"${partial ? ` data-part="${Math.round(tracked.pct)}%"` : ""}>
          <span>${it.release ? it.release.slice(0, 4) : ""}</span>
          ${it.score ? `<b>${it.score.toFixed(1)}</b>` : ""}
        </p>
      </div>`;

    bindCard(card, it, card);
    return card;
  }

  function rowItem(it) {
    const tracked = trackedProgress(it);
    const watched =
      isWatched(it) || !!(tracked && tracked.total && tracked.done >= tracked.total);
    const type = typeOf(it);
    const rel = relOf(it);

    const row = document.createElement("article");
    row.className = `row${watched ? " done" : ""}`;
    row.style.setProperty("--rc", rel.color);
    row.dataset.id = it.film || it.id;

    row.innerHTML = `
      <button class="tl-check" aria-label="${watched ? "Mark unwatched" : "Mark watched"}">${CHECK_SVG}</button>
      ${posterHTML(it, "row-poster")}
      <div class="r-main">
        <div class="r-title">${esc(it.title)}</div>
        ${it.sub ? `<div class="r-sub">${esc(it.sub)}</div>` : ""}
      </div>
      <div class="r-meta">
        <span class="badge rel">${rel.label}</span>
        <span class="badge" style="--bc:${type.color}">${type.short}</span>
        <span>${it.eps ? it.eps + " ep · " : ""}${fmtRuntime(it.mins)}</span>
        ${detailLink(it)}
        <span class="r-index">${indexLabel(it)}</span>
      </div>`;

    bindCard(row, it, row);
    return row;
  }

  function bindCard(wrap, it, clickTarget) {
    wrap.querySelector(".tl-check").addEventListener("click", (e) => {
      e.stopPropagation();
      toggle(it);
    });
    clickTarget.addEventListener("click", () => openSheet(it));
    clickTarget.addEventListener("keydown", (e) => {
      if (e.key === "Enter") openSheet(it);
      if (e.key === " ") {
        e.preventDefault();
        toggle(it);
      }
    });
  }

  let revealObserver;

  function render() {
    const items = visible().slice().sort(SORTERS[state.sort]);
    if (state.reversed) items.reverse();

    el.list.innerHTML = "";
    el.list.className =
      state.view === "timeline" ? "tl" : state.view === "grid" ? "poster-grid" : "rows";
    el.empty.hidden = items.length > 0;

    const grouper = GROUPERS[state.sort];
    const frag = document.createDocumentFragment();

    if (state.view === "timeline") {
      const fill = document.createElement("div");
      fill.className = "tl-fill";
      fill.id = "tlFill";
      frag.appendChild(fill);
    }

    let lastKey = null;
    let itemIndex = 0;

    items.forEach((it) => {
      const g = grouper(it);
      if (g.key !== lastKey) {
        lastKey = g.key;
        const inGroup = items.filter((x) => grouper(x).key === g.key);
        const done = inGroup.filter(isWatched).length;
        const head = document.createElement("div");
        head.className = "tl-era";
        head.innerHTML = `<div class="tl-era-inner">
            <h2>${esc(g.title)}</h2>
            <span class="gsub">${esc(g.sub)}</span>
            <span class="gcount">${done} / ${inGroup.length} watched</span>
          </div>`;
        frag.appendChild(head);
        itemIndex = 0;
      }
      frag.appendChild(
        state.view === "timeline"
          ? timelineItem(it, itemIndex)
          : state.view === "grid"
            ? gridItem(it)
            : rowItem(it),
      );
      itemIndex++;
    });

    el.list.appendChild(frag);
    observeItems();
    updateSummary(items);
    updateSpine();
  }

  function observeItems() {
    if (revealObserver) revealObserver.disconnect();
    const items = el.list.querySelectorAll(".tl-item");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((n) => n.classList.add("in"));
      return;
    }
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            revealObserver.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    items.forEach((n) => revealObserver.observe(n));
  }

  function updateSpine() {
    const fill = document.getElementById("tlFill");
    if (!fill || state.view !== "timeline") return;
    const box = el.list.getBoundingClientRect();
    const mid = window.innerHeight * 0.55;
    const h = Math.max(0, Math.min(mid - box.top, box.height));
    fill.style.height = h + "px";
  }

  let spineTick = false;
  window.addEventListener(
    "scroll",
    () => {
      if (spineTick) return;
      spineTick = true;
      requestAnimationFrame(() => {
        updateSpine();
        spineTick = false;
      });
    },
    { passive: true },
  );

  function toggle(it) {
    const nowWatched = Store.toggle(...refOf(it));

    document.querySelectorAll(".tl-item, .row, .pcard").forEach((node) => {
      const other = DATA.find((d) => (d.film || d.id) === node.dataset.id);
      if (!other || !sameWork(other, it)) return;
      node.classList.toggle("done", nowWatched);
      const btn = node.querySelector(".tl-check");
      if (btn)
        btn.setAttribute(
          "aria-label",
          nowWatched ? "Mark unwatched" : "Mark watched",
        );
    });

    if (state.status === "unwatched" || state.status === "watched") {
      setTimeout(render, 280);
    } else {
      updateSummary(visible());
      refreshGroupCounts();
    }
  }

  function refreshGroupCounts() {
    const items = visible().slice().sort(SORTERS[state.sort]);
    if (state.reversed) items.reverse();
    const grouper = GROUPERS[state.sort];
    const seen = [];
    items.forEach((it) => {
      const k = grouper(it).key;
      if (!seen.includes(k)) seen.push(k);
    });

    document.querySelectorAll(".tl-era .gcount").forEach((node, i) => {
      const inGroup = items.filter((x) => grouper(x).key === seen[i]);
      node.textContent = `${inGroup.filter(isWatched).length} / ${inGroup.length} watched`;
    });
  }

  function updateSummary(shown) {
    const canonical = DATA.filter((it) => !it.alias);
    const done = canonical.filter(isWatched).length;
    const pct = (done / canonical.length) * 100;

    const remaining = canonical.filter((it) => !isWatched(it));
    const minsLeft = remaining.reduce((s, it) => s + (it.mins || 0), 0);

    document.getElementById("figWatched").textContent = done;
    document.getElementById("figShown").textContent = shown.length;
    document.getElementById("figLeft").textContent = remaining.length;
    document.getElementById("figTime").textContent =
      minsLeft >= 1440
        ? `${(minsLeft / 1440).toFixed(1)}d`
        : `${Math.round(minsLeft / 60)}h`;

    document.getElementById("progressRail").style.width = pct + "%";
    document.getElementById("ringLabel").textContent = Math.round(pct) + "%";
    const C = 2 * Math.PI * 19;
    document.getElementById("ringFg").style.strokeDashoffset =
      C - (pct / 100) * C;
  }

  const ADD_KIND = document.body.dataset.mode === "anime" ? "anime" : "show";

  function tmdbOf(it) {
    if (it.tmdb) return it.tmdb;
    const reg = typeof FILMS !== "undefined" ? FILMS[it.film] : null;
    return reg && reg.tmdb ? reg.tmdb : null;
  }

  function sheetSeriesBlock(it) {
    const tmdb = tmdbOf(it);
    if (!tmdb) return "";

    const viewHref = `pages/${ADD_KIND === "anime" ? "anime" : "shows"}/view.html?id=${tmdb}`;
    const tracked = trackedProgress(it);
    if (tracked) {
      return `
        <div class="sheet-series">
          <span class="rlabel">Tracked</span>
          <p>${tracked.done} of ${tracked.total} episodes watched.</p>
          <a class="btn btn-accent" href="${viewHref}">Open episode guide</a>
        </div>`;
    }

    return `
      <div class="sheet-series">
        <span class="rlabel">Episode guide</span>
        <p>See every season and episode, with ratings. Adding it to your own shows (from the ${ADD_KIND === "anime" ? "anime" : "shows"} page) is separate and optional.</p>
        <a class="btn btn-accent" href="${viewHref}">Open episode guide</a>
      </div>`;
  }

  function openSheet(it) {
    const type = typeOf(it);
    const rel = relOf(it);
    const saga = SAGA_META[it.saga];
    const watched = isWatched(it);
    const src = posterSrc(it);

    el.sheet.style.setProperty("--rc", rel.color);
    el.sheetBody.innerHTML = `
      <div class="sheet-hero${src ? "" : " ph"}">
        ${src ? `<img src="${src}" alt="">` : ""}
      </div>
      <div class="sheet-inner">
        <div class="sheet-tags">
          <span class="badge" style="--bc:${type.color}">${type.label}</span>
          ${saga ? `<span class="badge plain">${saga.label}</span>` : ""}
          ${it.phase ? `<span class="badge plain">${PHASE_META[it.phase].label}</span>` : ""}
        </div>
        <h2>${esc(it.title)}</h2>
        ${it.sub ? `<p class="sheet-sub">${esc(it.sub)}</p>` : ""}

        <div class="sheet-rel">
          <span class="rel-pip"></span>
          <div><b>${rel.label}</b><p>${rel.blurb}</p></div>
        </div>

        <dl class="sheet-facts">
          <div class="fact"><dt>Released</dt><dd>${fmtDate(it.release)}${isFuture(it.release) ? " · upcoming" : ""}</dd></div>
          <div class="fact"><dt>In-universe</dt><dd>${esc(it.cLabel)}</dd></div>
          <div class="fact"><dt>Runtime</dt><dd>${fmtRuntime(it.mins)}${it.eps ? ` · ${it.eps} episodes` : ""}</dd></div>
          <div class="fact"><dt>Watch order</dt><dd>${it.w > 200 ? `X-Men #${it.w - 200}` : `#${it.w}`}</dd></div>
          ${it.score ? `<div class="fact"><dt>IMDb</dt><dd>${it.score.toFixed(1)} / 10</dd></div>` : ""}
        </dl>

        ${it.note ? `<p class="sheet-note">${esc(it.note)}</p>` : ""}

        <div class="sheet-poster">
          <label for="posterUrl">Poster image URL</label>
          <input id="posterUrl" type="url" spellcheck="false"
                 placeholder="https://…"
                 value="${esc(posterSrc(it) || "")}" />
          <div class="sheet-poster-row">
            <button class="btn sm" id="posterSave">Use this</button>
            <button class="btn btn-ghost sm" id="posterReset">Reset</button>
            <span class="sheet-poster-note" id="posterNote">${
              Store.posterOf(posterKey(it)) ? "Your own image" : ""
            }</span>
          </div>
        </div>

        ${sheetSeriesBlock(it)}

        <div class="sheet-actions">
          <button class="btn ${watched ? "" : "btn-accent"}" id="sheetToggle">
            ${watched ? "Mark as unwatched" : "Mark as watched"}
          </button>
        </div>
      </div>`;

    const copyBtn = el.sheetBody.querySelector("#sheetCopy");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const text = el.sheetBody.querySelector("#sheetCmd").textContent.trim();
        try {
          await navigator.clipboard.writeText(`${text} && npm run build`);
          copyBtn.textContent = "Copied";
        } catch (e) {
          copyBtn.textContent = "Select it above";
        }
        setTimeout(() => { copyBtn.textContent = "Copy command"; }, 1800);
      });
    }

    el.sheetBody.querySelector("#sheetToggle").addEventListener("click", () => {
      toggle(it);
      closeSheet();
    });

    const urlField = el.sheetBody.querySelector("#posterUrl");
    const note = el.sheetBody.querySelector("#posterNote");

    el.sheetBody.querySelector("#posterSave").addEventListener("click", () => {
      const value = urlField.value.trim();
      if (value && !/^https?:\/\//i.test(value)) {
        toast("That needs to be a full http(s) image URL");
        return;
      }
      Store.setPoster(posterKey(it), value);
      note.textContent = value ? "Your own image" : "";
      toast(value ? "Poster updated" : "Poster cleared");
      render();
      openSheet(it);
    });

    el.sheetBody.querySelector("#posterReset").addEventListener("click", () => {
      Store.setPoster(posterKey(it), "");
      const fallback = it.poster || (CAT.posters && CAT.posters[it.id]) || "";
      urlField.value = fallback;
      note.textContent = "";
      toast("Back to the default poster");
      render();
      openSheet(it);
    });

    el.sheetBackdrop.hidden = false;
    el.sheet.hidden = false;
    requestAnimationFrame(() => {
      el.sheetBackdrop.classList.add("show");
      el.sheet.classList.add("show");
    });
  }

  function closeSheet() {
    el.sheet.classList.remove("show");
    el.sheetBackdrop.classList.remove("show");
    setTimeout(() => {
      el.sheet.hidden = true;
      el.sheetBackdrop.hidden = true;
    }, 400);
  }

  document.getElementById("sheetClose").addEventListener("click", closeSheet);
  el.sheetBackdrop.addEventListener("click", closeSheet);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet();
  });

  function countBy(fn) {
    const m = {};
    DATA.forEach((it) => {
      const k = fn(it);
      if (k != null) m[k] = (m[k] || 0) + 1;
    });
    return m;
  }

  function buildChips(container, entries, bucket) {
    container.innerHTML = "";
    entries.forEach(({ value, label, color, count }) => {
      if (!count) return;
      const b = document.createElement("button");
      b.className = "chip";
      b.dataset.value = value;
      b.innerHTML = `${color ? `<span class="dot" style="--cc:${color}"></span>` : ""}${label}<span class="n">${count}</span>`;
      b.addEventListener("click", () => {
        if (state[bucket].has(value)) state[bucket].delete(value);
        else state[bucket].add(value);
        b.classList.toggle("active");
        render();
      });
      container.appendChild(b);
    });
  }

  function initFilters() {
    const relCounts = countBy((it) => it.rel);
    buildChips(
      document.getElementById("relChips"),
      Object.keys(REL_META).map((k) => ({
        value: k,
        label: REL_META[k].label,
        color: REL_META[k].color,
        count: relCounts[k] || 0,
      })),
      "rel",
    );

    const typeCounts = countBy((it) => it.type);
    buildChips(
      document.getElementById("typeChips"),
      Object.keys(TYPE_META).map((k) => ({
        value: k,
        label: TYPE_META[k].label,
        color: TYPE_META[k].color,
        count: typeCounts[k] || 0,
      })),
      "type",
    );

    const phaseCounts = countBy((it) => (it.phase ? "p" + it.phase : null));
    const sagaCounts = countBy((it) => it.saga);
    const entries = Object.keys(PHASE_META).map((p) => ({
      value: "p" + p,
      label: PHASE_META[p].label,
      count: phaseCounts["p" + p] || 0,
    }));
    Object.keys(SAGA_META).forEach((s) => {
      if (!PHASE_META[s])
        entries.push({
          value: s,
          label: SAGA_META[s].label,
          count: sagaCounts[s] || 0,
        });
    });
    buildChips(document.getElementById("phaseChips"), entries, "phase");

    const genreBox = document.getElementById("genreChips");
    if (genreBox) {
      const counts = {};
      DATA.forEach((it) =>
        genresOf(it).forEach((g) => (counts[g] = (counts[g] || 0) + 1)),
      );
      const names = Object.keys(counts).sort(
        (a, b) => counts[b] - counts[a] || a.localeCompare(b),
      );

      const group = genreBox.closest(".filter-group");
      if (!names.length) {
        if (group) group.hidden = true;
      } else {
        if (group) group.hidden = false;
        buildChips(
          genreBox,
          names.map((g) => ({ value: g, label: g, count: counts[g] })),
          "genre",
        );
      }
    }

    const ratingBox = document.getElementById("ratingChips");
    if (ratingBox) {
      const rated = DATA.filter((it) => ratingOf(it) != null).length;
      const group = ratingBox.closest(".filter-group");
      if (!rated) {
        if (group) group.hidden = true;
      } else {
        if (group) group.hidden = false;
        ratingBox.innerHTML = "";
        [0, 6, 7, 8, 9].forEach((min) => {
          const b = document.createElement("button");
          b.className = "chip" + (state.minRating === min ? " active" : "");
          b.textContent = min ? `${min}+` : "Any";
          b.addEventListener("click", () => {
            state.minRating = min;
            ratingBox.querySelectorAll(".chip").forEach((c) =>
              c.classList.toggle("active", c === b),
            );
            render();
          });
          ratingBox.appendChild(b);
        });
      }
    }
  }

  el.filterToggle.addEventListener("click", () => {
    const open = el.drawer.hidden;
    el.drawer.hidden = !open;
    el.filterToggle.setAttribute("aria-expanded", String(open));
  });

  document.getElementById("sortChips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip[data-sort]");
    if (!chip) return;
    state.sort = chip.dataset.sort;
    document
      .querySelectorAll("#sortChips .chip[data-sort]")
      .forEach((c) => c.classList.toggle("active", c === chip));
    render();
  });

  document.getElementById("reverseBtn").addEventListener("click", (e) => {
    state.reversed = !state.reversed;
    e.currentTarget.classList.toggle("active", state.reversed);
    render();
  });

  document.querySelectorAll(".chip[data-status]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const v = chip.dataset.status;
      state.status = state.status === v ? null : v;
      document
        .querySelectorAll(".chip[data-status]")
        .forEach((c) =>
          c.classList.toggle("active", c.dataset.status === state.status),
        );
      render();
    });
  });

  document.querySelectorAll(".viewswitch button").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === state.view);
    b.addEventListener("click", () => {
      state.view = b.dataset.view;
      localStorage.setItem(VIEW_KEY, state.view);
      document
        .querySelectorAll(".viewswitch button")
        .forEach((x) => x.classList.toggle("active", x === b));
      render();
    });
  });

  let searchTimer;
  el.search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = el.search.value;
      render();
    }, 160);
  });

  document.getElementById("clearFilters").addEventListener("click", () => {
    state.rel.clear();
    state.type.clear();
    state.phase.clear();
    state.genre.clear();
    state.minRating = 0;
    state.status = null;
    state.query = "";
    state.reversed = false;
    el.search.value = "";
    document.querySelectorAll(".chip").forEach((c) => {
      if (!c.dataset.sort) c.classList.remove("active");
    });
    render();
    toast("Filters cleared");
  });

  document.getElementById("markShown").addEventListener("click", () => {
    const items = visible();
    if (!items.length) return;
    Store.setRefs(items.map(refOf), true);
    render();
    toast(`${items.length} marked as watched`);
  });

  document.getElementById("resetUniverse").addEventListener("click", () => {
    if (
      !confirm("Clear all progress for this universe? This cannot be undone.")
    )
      return;
    Store.clearRefs(UNIVERSE, DATA.map(refOf));
    render();
    toast("Progress cleared");
  });

  document.getElementById("jumpNext").addEventListener("click", () => {
    const next = el.list.querySelector(".tl-item:not(.done), .row:not(.done)");
    if (!next) return toast("Everything in view is watched");
    next.scrollIntoView({ behavior: "smooth", block: "center" });
    const card = next.querySelector(".tl-card") || next;
    card.animate(
      [
        { boxShadow: "0 0 0 0 var(--rc)" },
        { boxShadow: "0 0 0 6px transparent" },
      ],
      { duration: 1200, easing: "ease-out" },
    );
  });

  function initCountdown() {
    const upcoming = DATA.filter((it) => isFuture(it.release)).sort((a, b) =>
      a.release.localeCompare(b.release),
    )[0];
    const box = document.getElementById("countdown");
    if (!box) return;
    if (!upcoming) {
      box.remove();
      return;
    }

    const target = new Date(upcoming.release + "T00:00:00");

    function tick() {
      const diff = target - new Date();
      if (diff <= 0) {
        box.innerHTML = `<div class="cd-box target"><b>${esc(upcoming.title)} is out</b></div>`;
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      const s = Math.floor((diff / 1000) % 60);
      box.innerHTML = `
        <div class="cd-box"><b>${d}</b><span>days</span></div>
        <div class="cd-box"><b>${String(h).padStart(2, "0")}</b><span>hours</span></div>
        <div class="cd-box"><b>${String(m).padStart(2, "0")}</b><span>minutes</span></div>
        <div class="cd-box"><b>${String(s).padStart(2, "0")}</b><span>seconds</span></div>
        <div class="cd-box target"><b>until ${esc(upcoming.title)}</b><span>${fmtDate(upcoming.release)}</span></div>`;
    }
    tick();
    setInterval(tick, 1000);
  }

  initFilters();
  initCountdown();
  render();
  initReveal();

  Store.onChange((data, meta) => {
    if (meta && meta.restored) render();
  });
})();
