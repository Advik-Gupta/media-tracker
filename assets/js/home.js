/* ============================================================
   HOME - renders the universe grids and the global stat line.
   ============================================================ */

(() => {
  const CATALOGUES = window.CATALOGUES || {};
  /* Every catalogue is loaded here, so this is where a full migration happens. */
  Store.migrateLinks();

  /* Counts for shows this browser added, merged into the build-time index so
     progress, the ongoing badge and the archive treat them identically. */
  if (typeof UserVault !== "undefined") {
    window.SERIES_COUNTS = Object.assign({}, window.SERIES_COUNTS, UserVault.counts());
  }
  Store.migrateMerges();

  /* Each vault page renders only the sections it actually has. */
  const KINDS = {};
  if (document.getElementById("listGrid")) KINDS.list = "listGrid";
  if (document.getElementById("movieGrid")) KINDS.movie = "movieGrid";
  if (document.getElementById("showGrid")) KINDS.show = "showGrid";
  if (document.getElementById("animeGrid")) KINDS.anime = "animeGrid";
  if (document.getElementById("showlistGrid")) KINDS.showlist = "showlistGrid";
  if (document.getElementById("collectionGrid")) KINDS.collection = "collectionGrid";
  /* Derived from KINDS so a new section kind cannot be half-registered. */
  const searches = {};
  const pages = {};
  Object.keys(KINDS).forEach((k) => { searches[k] = ""; pages[k] = 0; });

  /* How many cards fit on one carousel page: a 4x2 grid on a wide screen,
     scaling down to 2x2 on a phone. */
  function perPage() {
    const w = window.innerWidth;
    if (w >= 1100) return { cols: 4, n: 8 };
    if (w >= 820) return { cols: 3, n: 6 };
    if (w >= 560) return { cols: 2, n: 4 };
    return { cols: 2, n: 4 };
  }

  /* Alias entries duplicate a title inside one list; linked entries duplicate
     one across lists. Both must be counted once only. */
  const countable = (list) => list.filter((it) => !it.alias);

  /* A show's progress lives in per-episode keys written by the show page, so
     it cannot be counted from the season catalogue. SERIES_COUNTS carries the
     totals; the ticks are already in local storage. */
  const EP_KEY = /^e\d+-\d+x\d+$/;

  function seriesStats(uni) {
    const meta = (window.SERIES_COUNTS || {})[uni.id];
    if (!meta) return null;

    const all = Store.exportAll();
    const bucket = all[uni.id] || {};

    /* Filler episodes leave the count entirely, watched or not, so both the
       total and the done figure have to drop by them. The filler bucket is
       per universe, which is what lets this run without the episode data. */
    const filler = all[`__filler_${uni.id}`] || {};
    const fillerKeys = Object.keys(filler).filter((k) => EP_KEY.test(k));
    const ticked = Object.keys(bucket).filter((k) => EP_KEY.test(k));
    const doneEps = ticked.filter((k) => !filler[k]).length;

    /* Films in a show universe keep their shared film key. */
    const cat = CATALOGUES[uni.id];
    const films = cat
      ? countable(resolvedItems(cat)).filter((it) => it.type === "film")
      : [];
    const doneFilms = films.filter((it) =>
      Store.has(...progressRef(uni.id, it)),
    ).length;

    /* A universe can hold several series, and those are separate things to
       watch: Berlin finishing says nothing about Money Heist. The card and
       the archive therefore report on the primary series — the first one —
       and the rest are counted on their own further down. */
    const primary = (meta.perShow || [])[0];
    const prefix = primary ? `e${primary.id}-` : null;

    const inPrimary = (k) => !prefix || k.startsWith(prefix);
    const fillerInPrimary = fillerKeys.filter(inPrimary).length;

    const episodes = primary
      ? Math.max(0, primary.episodes - fillerInPrimary)
      : Math.max(0, meta.episodes - fillerKeys.length);

    const donePrimary = ticked.filter((k) => inPrimary(k) && !filler[k]).length;

    const total = episodes + films.length;
    const done = Math.min(donePrimary, episodes) + doneFilms;
    return { total, done, pct: total ? (done / total) * 100 : 0, mins: 0 };
  }

  function statsFor(uni) {
    /* Anything with baked episode data is counted in episodes, whatever
       vault it sits in — the season catalogue is only a stand-in. */
    if ((window.SERIES_COUNTS || {})[uni.id]) {
      const s = seriesStats(uni);
      if (s) return s;
    }
    const cat = CATALOGUES[uni.id];
    const list = cat && resolvedItems(cat);
    if (!list)
      /* Universes registered by the import scripts carry no `counts` block,
         and a vault does not load every catalogue, so this has to cope with
         both being absent. */
      return {
        total: (uni.counts && uni.counts.titles) || 0,
        done: 0,
        pct: 0,
        mins: 0,
      };

    const items = countable(list);
    const done = items.filter((it) =>
      Store.has(...progressRef(uni.id, it)),
    ).length;
    const mins = items.reduce(
      (sum, it) =>
        sum + (Store.has(...progressRef(uni.id, it)) ? it.mins || 0 : 0),
      0,
    );
    return {
      total: items.length,
      done,
      pct: items.length ? (done / items.length) * 100 : 0,
      mins,
    };
  }

  /* ---------- still releasing ----------
     A show you have started that has not finished yet: more is coming, so it
     is worth surfacing separately from the rest of the vault. The status
     comes from seriesgraph and is baked into the episode index at build
     time - see `npm run series status`. */

  let showingOngoing = false;

  /* Seriesgraph is the default answer, but it is sometimes behind — a season
     can be announced before TMDB lists an episode for it. A manual mark
     overrides it in either direction. */
  const isOngoing = (uni) => {
    const flag = Store.exportAll().__flags || {};
    if (flag[`ongoing:${uni.id}`]) return true;
    if (flag[`ended:${uni.id}`]) return false;
    const meta = (window.SERIES_COUNTS || {})[uni.id];
    return !!(meta && meta.ongoing);
  };

  const isStarted = (uni) => statsFor(uni).done > 0;

  function ongoingList(kind) {
    /* Same source as the grid: shows and anime are whatever this browser
       added, not the built-in catalogue. */
    const source =
      (kind === "show" || kind === "anime") && typeof UserVault !== "undefined"
        ? UserVault.asUniverses(kind)
        : UNIVERSES;

    return source.filter(
      (u) =>
        (u.kind || "movie") === kind &&
        !u.fromList &&
        isOngoing(u) &&
        isStarted(u),
    );
  }

  function syncOngoingButton(kind) {
    const btn = document.getElementById("ongoingBtn");
    if (!btn) return;
    const n = ongoingList(kind).length;
    btn.hidden = n === 0 && !showingOngoing;
    btn.classList.toggle("active", showingOngoing);
    btn.setAttribute("aria-pressed", String(showingOngoing));
    btn.textContent = showingOngoing ? "Show all" : `◉ Ongoing${n ? ` (${n})` : ""}`;
  }

  /* ---------- removing a show ----------
     The page cannot delete files, so removing hides the show from the vault
     and remembers that. It is reversible from the Add show panel, and
     `npm run series remove <id>` deletes it properly when you mean it. */

  const HIDDEN_KEY = "mediavault.hidden";

  /* Stored as { id: whenHidden }. It used to be a bare array; that form is
     still read, with an unknown time, so nothing is lost on upgrade. */
  function hiddenMap() {
    try {
      const v = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "{}");
      if (Array.isArray(v)) {
        const out = {};
        v.forEach((id) => (out[id] = 0));
        return out;
      }
      return v && typeof v === "object" ? v : {};
    } catch (e) {
      return {};
    }
  }

  function hiddenIds() {
    const map = hiddenMap();
    const live = new Set();
    let changed = false;

    for (const [id, when] of Object.entries(map)) {
      const uni = UNIVERSES.find((u) => u.id === id);

      /* Gone from the registry entirely - deleted for real, nothing to hide. */
      if (!uni) { changed = true; continue; }

      /* Added back after it was hidden, so the hide refers to a previous
         copy. Removing a show and adding it again should just work rather
         than leaving it invisible with no way to tell why. */
      const added = uni.addedAt ? Date.parse(uni.addedAt) : 0;
      if (added && when && added > when) { changed = true; continue; }

      live.add(id);
    }

    if (changed) setHidden(live);
    return live;
  }

  function setHidden(ids) {
    try {
      const now = Date.now();
      const prev = hiddenMap();
      const out = {};
      [...ids].forEach((id) => (out[id] = prev[id] || now));
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(out));
    } catch (e) { /* private window */ }
  }

  function removeUniverse(uni) {
    const ids = hiddenIds();
    ids.add(uni.id);
    setHidden(ids);
    renderGrid(uni.kind || "movie");
    if (typeof toast === "function") {
      toast(`Removed ${uni.name}`, {
        label: "Undo",
        action: () => {
          const back = hiddenIds();
          back.delete(uni.id);
          setHidden(back);
          renderGrid(uni.kind || "movie");
        },
      });
    }
  }

  /* Exposed so other panels can refresh a vault after changing it. */
  window.vaultHidden = { get: hiddenIds, set: setHidden,
    refresh: () => {
      /* Whichever vault is on screen: shows, anime, or another later. */
      Object.keys(KINDS)
        .filter((k) => ARCHIVE_KINDS.has(k))
        .forEach(renderGrid);
    },
  };

  /* ---------- archive ----------
     A finished show is not gone, just out of the way. Anything at 100% moves
     into the archive on its own and comes straight back out the moment a
     single episode is unticked, so there is nothing to file by hand. */

  const ARCHIVE_KINDS = new Set(["show", "anime"]);
  let showingArchive = false;

  const isArchived = (uni) => {
    if (!ARCHIVE_KINDS.has(uni.kind || "movie")) return false;
    const s = statsFor(uni);
    return s.total > 0 && s.done >= s.total;
  };

  function archiveCard(count, i, kind) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "uni-card reveal uni-card-archive";
    el.style.setProperty("--d", `${Math.min(i, 12) * 55}ms`);
    el.innerHTML = `
      <span class="arch-mark" aria-hidden="true">${showingArchive ? "↩" : "▤"}</span>
      <div class="uni-content">
        <h3>${showingArchive ? "Back to watching" : "Archive"}</h3>
        <p class="uni-tagline">${
          showingArchive
            ? "Everything still in progress"
            : "Finished shows, filed away"
        }</p>
        <div class="uni-foot-row">
          <span><b>${count}</b> finished</span>
          <span class="uni-arrow">${showingArchive ? "←" : "→"}</span>
        </div>
      </div>`;
    el.addEventListener("click", () => {
      showingArchive = !showingArchive;
      pages[kind] = 0;
      renderGrid(kind);
    });
    return el;
  }

  /* ---------- collections ----------
     A curated set of whole series. Its card totals the progress of its
     members, and opening it lands on a page of those members. */

  const COLLECTION =
    (window.COLLECTIONS || {})[document.body.dataset.collection] || null;

  function collectionStats(c) {
    let done = 0;
    let total = 0;
    (c.members || []).forEach((id) => {
      const uni = UNIVERSES.find((u) => u.id === id);
      if (!uni) return;
      const s = statsFor(uni);
      done += s.done;
      total += s.total;
    });
    return { done, total, pct: total ? (done / total) * 100 : 0 };
  }

  function collectionCard(c, i) {
    const s = collectionStats(c);
    const el = document.createElement("a");
    el.href = pagePath(c.kind, c.id);
    el.className = "uni-card reveal";
    el.dataset.name = (c.name + " " + c.tagline).toLowerCase();
    el.style.setProperty("--d", `${Math.min(i, 12) * 55}ms`);
    el.innerHTML = `
      <div class="uni-cover">
        ${c.cover
          ? `<img src="${c.cover}" alt="" loading="lazy" decoding="async" onerror="this.remove();">`
          : ""}
      </div>
      <div class="uni-content">
        <h3>${c.name}</h3>
        <p class="uni-tagline">${c.tagline}</p>
        <div class="uni-meter"><i data-pct="${s.pct}"></i></div>
        <div class="uni-foot-row">
          <span><b>${(c.members || []).length}</b> series</span>
          <span class="uni-arrow">→</span>
        </div>
      </div>`;
    return el;
  }

  /* ---------- cards ---------- */

  /* A show or anime has no page of its own any more — pages/<vault>/view.html
     renders any of them from its TMDB id, which the episode index carries as
     the primary show. Anything without episode data keeps its generated page. */
  function hrefFor(uni) {
    const meta = (window.SERIES_COUNTS || {})[uni.id];
    const kind = uni.kind || "movie";
    if ((kind === "show" || kind === "anime") && meta && meta.primary) {
      return `pages/${kind === "anime" ? "anime" : "shows"}/view.html?id=${meta.primary}`;
    }
    return uni.href;
  }

  function card(uni, i) {
    const s = statsFor(uni);
    const el = document.createElement("a");
    el.href = hrefFor(uni);
    el.className = "uni-card reveal";
    el.dataset.name = (uni.name + " " + uni.tagline).toLowerCase();
    el.dataset.uni = uni.id;
    el.draggable = true;
    el.style.setProperty("--ua", uni.accent);
    el.style.setProperty("--ua-2", uni.accent2);
    el.style.setProperty("--d", `${Math.min(i, 12) * 55}ms`);

    el.innerHTML = `
      <div class="uni-cover">
        ${
          uni.cover
            ? `<img src="${uni.cover}" alt="" loading="lazy" decoding="async"
             onerror="this.remove();">`
            : ""
        }
      </div>
      <div class="uni-content">
        <h3>${uni.name}</h3>
        <p class="uni-tagline">${uni.tagline}</p>
        <div class="uni-meter"><i data-pct="${s.pct}"></i></div>
        <div class="uni-foot-row">
          <span><b>${s.done}</b> / ${s.total}</span>
          ${(() => {
            const meta = (window.SERIES_COUNTS || {})[uni.id];
            if (!meta || meta.shows <= 1) return "";
            /* The bar above measures the primary series only, so the card has
               to say the others are in there and counted separately. */
            const others = (meta.perShow || []).slice(1).map((s) => s.title);
            return `<span class="uni-count" title="Also here: ${others.join(", ")}">+${others.length} more</span>`;
          })()}
          ${isOngoing(uni) ? '<span class="uni-live" title="Still releasing">◉ Ongoing</span>' : ""}
          <span class="uni-arrow">→</span>
        </div>
      </div>`;

    /* Only the vaults you add to can have entries removed - the film
       franchises and curated lists are part of the app. */
    if (ARCHIVE_KINDS.has(uni.kind || "movie")) {
      const del = document.createElement("button");
      del.type = "button";
      del.className = "uni-remove";
      del.title = `Remove ${uni.name}`;
      del.setAttribute("aria-label", `Remove ${uni.name}`);
      del.textContent = "✕";
      del.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeUniverse(uni);
      });
      el.appendChild(del);
    }

    return el;
  }


  function renderGrid(kind) {
    const grid = document.getElementById(KINDS[kind]);
    if (!grid) return;
    const q = searches[kind].trim().toLowerCase();
    const COUNTRY_LISTS =
      typeof COUNTRIES !== "undefined"
        ? new Set(
            Object.values(COUNTRIES)
              .map((c) => c.list)
              .filter(Boolean),
          )
        : new Set();

    const gone = hiddenIds();

    /* On a collection page the grid is the collection's members rather than
       everything of one kind. */
    if (COLLECTION) {
      const members = new Set(COLLECTION.members || []);
      let mine = UNIVERSES.filter((u) => members.has(u.id) && !gone.has(u.id))
        .filter((u) => !q || (u.name + " " + u.tagline).toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name));
      return paint(kind, grid, mine.map((u) => (j) => card(u, j)));
    }

    /* The shows and anime vaults start empty: what is in them is whatever
       this browser added, not a catalogue shipped with the site. The curated
       lists still appear — those are the Lists section, a different kind —
       so a new visitor has something to browse before adding anything.

       Film universes are unaffected: they have no API behind them and are
       still the built-in catalogue. */
    const SELF_SERVE = kind === "show" || kind === "anime";
    const mine =
      typeof UserVault !== "undefined" && SELF_SERVE
        ? UserVault.asUniverses(kind)
        : [];

    let list = (SELF_SERVE ? mine : UNIVERSES)
      .filter((u) => (u.kind || "movie") === kind)
      .filter((u) => !gone.has(u.id))
      /* Anything that arrived as part of a list is reached through that list
         card, not as its own entry in the vault. */
      .filter((u) => !u.fromList)
      /* a country's list is reached through the map, not as its own card */
      .filter((u) => !COUNTRY_LISTS.has(u.id))
      .filter(
        (u) => !q || (u.name + " " + u.tagline).toLowerCase().includes(q),
      );

    /* A vault's Lists section holds two shapes at once: collections, whose
       entries are whole series with their own pages, and catalogue lists,
       whose entries are single titles. Both are cards in the same grid. */
    if (kind === "collection") {
      const mode = document.body.dataset.mode || "movie";
      const matches = (name, tagline) =>
        !q || (name + " " + tagline).toLowerCase().includes(q);

      const collections = Object.values(window.COLLECTIONS || {})
        .filter((c) => (c.kind || "movie") === mode)
        .filter((c) => matches(c.name, c.tagline))
        .map((c) => (j) => collectionCard(c, j));

      const listKind = { movie: "list", show: "showlist", anime: "animelist" }[mode];
      const lists = UNIVERSES.filter((u) => u.kind === listKind)
        .filter((u) => !gone.has(u.id))
        .filter((u) => matches(u.name, u.tagline))
        .map((u) => (j) => card(u, j));

      return paint(kind, grid, [...collections, ...lists]);
    }

    if (showingOngoing && ARCHIVE_KINDS.has(kind)) {
      const live = ongoingList(kind).filter(
        (u) => !gone.has(u.id) &&
          (!q || (u.name + " " + u.tagline).toLowerCase().includes(q)),
      );
      syncOngoingButton(kind);
      return paint(kind, grid, live.map((u) => (j) => card(u, j)));
    }

    let archivedCount = 0;
    if (ARCHIVE_KINDS.has(kind)) {
      const archived = list.filter(isArchived);
      archivedCount = archived.length;
      list = showingArchive ? archived : list.filter((u) => !isArchived(u));

      /* Whatever you are partway through belongs at the front, so sort by how
         far along it is and let untouched shows fall to the back. Anything
         you have dragged into place keeps that place, below the ones you are
         actively watching. */
      list = applyOrder(kind, list);
      const inFlight = list.filter((u) => {
        const s = statsFor(u);
        return s.done > 0 && s.done < s.total;
      });
      const settled = list.filter((u) => !inFlight.includes(u));
      inFlight.sort((a, b) => statsFor(b).pct - statsFor(a).pct);
      list = [...inFlight, ...settled];

      const legacySort = () => list.sort((a, b) => {
        const sa = statsFor(a);
        const sb = statsFor(b);
        const started = (s) => (s.done > 0 ? 1 : 0);
        return (
          started(sb) - started(sa) ||
          sb.pct - sa.pct ||
          a.name.localeCompare(b.name)
        );
      });
      void legacySort;
    }

    const leading = [];
    if (ARCHIVE_KINDS.has(kind) && (archivedCount > 0 || showingArchive)) {
      leading.push(() => archiveCard(archivedCount, 0, kind));
    }

    if (!ARCHIVE_KINDS.has(kind)) list = applyOrder(kind, list);

    syncOngoingButton(kind);
    return paint(kind, grid, [
      ...leading,
      ...list.map((u) => (j) => card(u, j)),
    ]);
  }

  /* Lay a set of card factories out as carousel pages. Everything that fills
     a grid ends here, so paging and the reveal behave the same way whether
     the cells are universes, collections or the archive control. */
  /* ---------- manual order ----------
     Cards can be dragged into whatever order you want. The order is kept per
     vault section and applied over the default sort, so a shelf you have not
     moved keeps its automatic position and one you have stays put.

     On the shows and anime vaults, anything you are partway through still
     floats to the front — that ranking is the point of those vaults — and the
     manual order governs everything after it. */

  const ORDER_KEY = (kind) => `mediavault.order.${kind}`;

  function savedOrder(kind) {
    try {
      const v = JSON.parse(localStorage.getItem(ORDER_KEY(kind)) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  function saveOrder(kind, ids) {
    try {
      localStorage.setItem(ORDER_KEY(kind), JSON.stringify(ids));
    } catch (e) { /* private window */ }
  }

  /** Reorder a list of universes by the saved order, keeping the rest as-is. */
  function applyOrder(kind, list) {
    const order = savedOrder(kind);
    if (!order.length) return list;

    const rank = new Map(order.map((id, i) => [id, i]));
    const placed = list.filter((u) => rank.has(u.id));
    const rest = list.filter((u) => !rank.has(u.id));
    placed.sort((a, b) => rank.get(a.id) - rank.get(b.id));
    return [...placed, ...rest];
  }

  /* Dragging is wired on the container: cards are recreated on every render,
     so per-card listeners would have to be re-attached each time. */
  function makeSortable(kind, grid) {
    if (grid.dataset.sortable) return;
    grid.dataset.sortable = "1";

    let dragging = null;
    let edgeTimer = null;

    /* The grid is chunked into carousel pages, and the next page is off
       screen. Dragging near either edge scrolls the track, so a card can be
       carried to any page rather than only within the one it started on. */
    const track = grid.closest("[data-track]") || grid.parentElement;

    function edgeScroll(x) {
      if (!track) return;
      const box = track.getBoundingClientRect();
      const zone = 90;
      let dir = 0;
      if (x < box.left + zone) dir = -1;
      else if (x > box.right - zone) dir = 1;

      if (!dir) {
        clearInterval(edgeTimer);
        edgeTimer = null;
        return;
      }
      if (edgeTimer) return;
      edgeTimer = setInterval(() => {
        track.scrollBy({ left: dir * 24, behavior: "auto" });
      }, 16);
    }

    function stopEdge() {
      clearInterval(edgeTimer);
      edgeTimer = null;
    }

    grid.addEventListener("dragstart", (e) => {
      const card = e.target.closest("[data-uni]");
      if (!card) return;
      dragging = card;
      card.classList.add("dragging");
      grid.classList.add("reordering");
      e.dataTransfer.effectAllowed = "move";
      /* Firefox will not start a drag without data set on the transfer. */
      e.dataTransfer.setData("text/plain", card.dataset.uni);
    });

    grid.addEventListener("dragend", () => {
      stopEdge();
      grid.classList.remove("reordering");
      if (!dragging) return;
      dragging.classList.remove("dragging");
      dragging = null;
      commitOrder(kind, grid);
    });

    grid.addEventListener("dragover", (e) => {
      if (!dragging) return;
      e.preventDefault();
      edgeScroll(e.clientX);

      const over = e.target.closest("[data-uni]");
      if (over && over !== dragging) {
        /* Insert before or after depending on which half was entered, so the
           card lands where the pointer is rather than always to one side.
           The target may be on a different page; moving between them is the
           point, and the pages are re-balanced when the drag ends. */
        const box = over.getBoundingClientRect();
        const after = e.clientX > box.left + box.width / 2;
        over.parentElement.insertBefore(dragging, after ? over.nextSibling : over);
        return;
      }

      /* Dropped on the empty part of a page: append to it. */
      const page = e.target.closest(".carousel-page");
      if (page && !page.contains(dragging)) page.appendChild(dragging);
    });

    grid.addEventListener("dragleave", (e) => {
      if (!grid.contains(e.relatedTarget)) stopEdge();
    });
  }

  /** Read the order out of the DOM and store it. */
  function commitOrder(kind, grid) {
    const ids = [...grid.querySelectorAll("[data-uni]")].map((c) => c.dataset.uni);
    if (!ids.length) return;
    saveOrder(kind, ids);

    /* Moving a card between pages leaves them unevenly filled, so the grid is
       repainted from the saved order rather than left as the drag arranged it. */
    renderGrid(kind);
    if (typeof toast === "function") {
      toast("Order saved", {
        label: "Reset",
        action: () => {
          saveOrder(kind, []);
          renderGrid(kind);
        },
      });
    }
  }

  function paint(kind, grid, cells) {
    const { cols, n } = perPage();
    grid.innerHTML = "";

    /* A collection page is a single list, so it lays every card out at once
       rather than paging - there is nothing to page between. */
    if (grid.classList.contains("uni-grid")) {
      cells.forEach((make, j) => grid.appendChild(make(j)));
      makeSortable(kind, grid);

      const empty = document.querySelector(`[data-empty="${kind}"]`);
      if (empty) empty.hidden = cells.length > 0;
      const shown = document.getElementById("colShown");
      if (shown) shown.textContent = `${cells.length} shown`;

      initReveal(grid);
      requestAnimationFrame(() => {
        grid.querySelectorAll(".uni-meter i[data-pct]").forEach((bar) => {
          setTimeout(() => { bar.style.width = bar.dataset.pct + "%"; }, 220);
        });
      });
      return;
    }

    for (let i = 0; i < cells.length; i += n) {
      const page = document.createElement("div");
      page.className = "carousel-page";
      page.style.setProperty("--cols", cols);
      cells.slice(i, i + n).forEach((make, j) => page.appendChild(make(j)));
      grid.appendChild(page);
    }

    const empty = document.querySelector(`[data-empty="${kind}"]`);
    if (empty) {
      empty.hidden = cells.length > 0;
      /* A vault you fill yourself starts empty, so say what to do about it
         rather than showing the generic "nothing matches" line. */
      if (!cells.length && (kind === "show" || kind === "anime") && !searches[kind]) {
        const noun = kind === "anime" ? "anime" : "shows";
        empty.className = "vault-empty";
        empty.innerHTML = `
          <b>No ${noun} yet</b>
          <p>Use <strong>+ Add ${kind === "anime" ? "anime" : "show"}</strong> above to search and add
          any series. It is saved to your vault, and the lists below are
          there to browse in the meantime.</p>`;
      }
    }

    const total = Math.max(1, Math.ceil(cells.length / n));
    pages[kind] = Math.min(pages[kind], total - 1);
    updateNav(kind, total);
    scrollToPage(kind, pages[kind], false);

    makeSortable(kind, grid);
    initReveal(grid);
    requestAnimationFrame(() => {
      grid.querySelectorAll(".uni-meter i[data-pct]").forEach((bar) => {
        setTimeout(() => {
          bar.style.width = bar.dataset.pct + "%";
        }, 220);
      });
    });
  }

  function pageCount(kind) {
    const grid = document.getElementById(KINDS[kind]);
    return grid ? Math.max(1, grid.children.length) : 1;
  }

  function updateNav(kind, total) {
    const label = document.querySelector(`[data-page="${kind}"]`);
    if (label) label.textContent = `${pages[kind] + 1} / ${total}`;
    document.querySelectorAll(`.cbtn[data-car="${kind}"]`).forEach((b) => {
      const dir = Number(b.dataset.dir);
      b.disabled = dir < 0 ? pages[kind] === 0 : pages[kind] >= total - 1;
    });
    const nav = label && label.closest(".carousel-nav");
    if (nav) nav.style.display = total > 1 ? "" : "none";
  }

  function scrollToPage(kind, index, smooth = true) {
    const track = document.querySelector(`[data-track="${kind}"]`);
    if (!track) return;
    pages[kind] = index;
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: smooth ? "smooth" : "auto",
    });
    updateNav(kind, pageCount(kind));
  }

  function render() {
    Object.keys(KINDS).forEach(renderGrid);
    updateGlobals();
  }

  /* ---------- carousel wiring ---------- */

  document.querySelectorAll(".cbtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.car;
      const total = pageCount(kind);
      const next = Math.min(
        Math.max(pages[kind] + Number(btn.dataset.dir), 0),
        total - 1,
      );
      scrollToPage(kind, next);
    });
  });

  /* keep the page indicator honest when swiped or scrolled by hand */
  Object.keys(KINDS).forEach((kind) => {
    const track = document.querySelector(`[data-track="${kind}"]`);
    if (!track) return;
    let t;
    track.addEventListener(
      "scroll",
      () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const i = Math.round(
            track.scrollLeft / Math.max(1, track.clientWidth),
          );
          if (i !== pages[kind]) {
            pages[kind] = i;
            updateNav(kind, pageCount(kind));
          }
        }, 90);
      },
      { passive: true },
    );
  });

  /* re-chunk when the column count changes */
  let resizeTimer,
    lastCols = perPage().n;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const n = perPage().n;
      if (n !== lastCols) {
        lastCols = n;
        render();
      } else
        Object.keys(KINDS).forEach((k) => scrollToPage(k, pages[k], false));
    }, 180);
  });

  /* Exposed so the random picker can refresh the numbers after a toggle. */
  window.refreshHome = render;

  /* ---------- global counters ---------- */

  function countUp(el, target) {
    const start = performance.now();
    const from = parseFloat(el.dataset.v || "0");
    function step(now) {
      const p = Math.min((now - start) / 900, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (target - from) * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.dataset.v = target;
    }
    requestAnimationFrame(step);
  }

  function updateGlobals() {
    /* Count each distinct work once, even when it sits in several lists. */
    const seen = new Set();
    let titles = 0,
      watched = 0,
      mins = 0;

    /* A vault page counts only its own shelves. The movies vault carries the
       lists as well as the film franchises, so it stays the whole catalogue;
       the shows and anime vaults report just what they show. */
    const kinds = Object.keys(KINDS);
    /* A collection page reports on its members, which may span kinds — the
       anime list includes Vinland Saga, which lives in the shows vault. */
    const mine = COLLECTION
      ? UNIVERSES.filter((u) => (COLLECTION.members || []).includes(u.id))
      : UNIVERSES.filter((u) => kinds.includes(u.kind || "movie"));


    /* The shows vault is counted in episodes, not season entries — that is
       what its pages track and what "watched" means there. */
    const EPISODIC = new Set(["show", "anime"]);
    const showsOnly =
      mine.length > 0 && mine.every((u) => EPISODIC.has(u.kind || "movie"));
    if (showsOnly && window.SERIES_COUNTS) {
      let eps = 0;
      let epsDone = 0;
      mine.forEach((u) => {
        const s = seriesStats(u);
        if (!s) return;
        eps += s.total;
        epsDone += s.done;
      });
      countUp(document.getElementById("hsUniverses"), mine.length);
      countUp(document.getElementById("hsTitles"), eps);
      countUp(document.getElementById("hsWatched"), epsDone);
      document.getElementById("hsHours").textContent = `${eps - epsDone}`;
      return;
    }

    mine.forEach((u) => {
      const cat = CATALOGUES[u.id];
      if (!cat || !cat.items) return;
      countable(resolvedItems(cat)).forEach((it) => {
        const [bucket, id] = progressRef(u.id, it);
        const key = bucket + "/" + id;
        if (seen.has(key)) return;
        seen.add(key);
        titles += 1;
        if (Store.has(bucket, id)) {
          watched += 1;
          mins += it.mins || 0;
        } else {
        }
      });
    });

    countUp(document.getElementById("hsUniverses"), mine.length);
    countUp(document.getElementById("hsTitles"), titles);
    countUp(document.getElementById("hsWatched"), watched);

    const hours = document.getElementById("hsHours");
    hours.textContent = mins
      ? fmtRuntimeLong(mins)
          .replace(" hours", "h")
          .replace(" days", "d")
          .replace(" minutes", "m")
      : "0h";

    const gs = document.getElementById("globalStat");
    if (gs) gs.textContent = `${watched} / ${titles} watched`;
  }

  /* ---------- search ---------- */

  document.querySelectorAll("[data-search]").forEach((input) => {
    input.addEventListener("input", () => {
      const kind = input.dataset.search;
      searches[kind] = input.value;
      pages[kind] = 0;
      renderGrid(kind);
    });
  });

  /* ---------- data controls ---------- */

  /* Not every vault page has the data panel - the shows vault does not - so
     each of these is optional rather than assumed. */
  const on = (id, ev, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(ev, fn);
  };

  on("exportBtn", "click", () => {
    /* The bundle carries progress plus what you added, hid and reordered —
       but not the cached season data, which comes back from the API. */
    const blob = new Blob([JSON.stringify(Store.exportBundle(), null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `media-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Backup downloaded");
  });

  const fileInput = document.getElementById("importFile");
  on("importBtn", "click", () => fileInput && fileInput.click());
  if (fileInput)
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const res = Store.importBundle(JSON.parse(reader.result));
          /* Added shows come back as ids; their episode data is refetched
             the first time each one is opened. */
          render();
          toast(
            res.prefs
              ? "Backup restored — added shows will refetch when opened"
              : "Backup restored",
          );
        } catch {
          toast("That file could not be read");
        }
        fileInput.value = "";
      };
      reader.readAsText(file);
    });

  on("ongoingBtn", "click", () => {
    showingOngoing = !showingOngoing;
    const kind = Object.keys(KINDS).find((k) => ARCHIVE_KINDS.has(k));
    if (kind) {
      pages[kind] = 0;
      renderGrid(kind);
    }
  });

  on("resetBtn", "click", () => {
    if (
      !confirm(
        "Clear all watched progress across every universe? This cannot be undone.",
      )
    )
      return;
    Store.clearEverything();
    render();
    toast("Progress cleared");
  });

  /* ---------- storage health ---------- */

  function updateStorageNote() {
    const el = document.getElementById("storageNote");
    if (!el) return;
    const { persisted, idb } = Store.health();
    const t = Store.lastSaved();
    const when = t
      ? new Date(t).toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "never";
    el.innerHTML =
      `<span class="dot ${persisted ? "ok" : "warn"}"></span>` +
      `Saved ${when} · mirrored to ${idb ? "IndexedDB" : "localStorage only"} · ` +
      (persisted
        ? "the browser has marked this storage persistent"
        : "not yet marked persistent - export a backup now and then");
  }

  /* ---------- go ---------- */

  render();
  initReveal();
  updateStorageNote();
  setTimeout(updateStorageNote, 1200); // persist() resolves asynchronously
  Store.onChange((data, meta) => {
    updateStorageNote();
    if (meta && meta.restored) render();
  });
})();
