(() => {
  const page = window.SeriesPage;
  const trigger = document.getElementById("editPage");
  if (!page || !page.data.hostId || !trigger || typeof UserVault === "undefined") return;

  const DATA = page.data;
  const HOST = DATA.hostId;
  const KIND = document.body.dataset.mode === "anime" ? "anime" : "show";
  const NOUN = KIND === "anime" ? "anime" : "show";
  let tab = "order";

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  trigger.hidden = false;

  const sk = (se) => (se.k != null ? se.k : se.n);
  const snapshot = (extra = {}) => ({
    units: DATA.units,
    films: DATA.films.map(({ film, ...rest }) => rest),
    hidden: (DATA.hiddenSeasons || []).map((h) => h.key),
    splits: DATA.splits || {},
    breaks: DATA.breaks || [],
    ...extra,
  });

  function save() {
    UserVault.savePage(HOST, snapshot());
    page.render();
  }

  function saveAndReload(extra) {
    UserVault.savePage(HOST, snapshot(extra));
    try {
      sessionStorage.setItem("mv.editPage", "order");
    } catch (e) {}
    location.reload();
  }

  function unitLabel(unit) {
    const [type, a, b] = unit.split(":");
    if (type === "s") {
      const show = DATA.shows.find((x) => String(x.id) === a);
      const season = show && show.seasons.find((x) => String(sk(x)) === b);
      if (!season) return null;
      const many = new Set(show.seasons.map((x) => x.n)).size > 1;
      return {
        title:
          (many ? `${show.title} · Season ${season.n}` : show.title) +
          (season.label ? ` · ${season.label}` : ""),
        sub: `${season.episodes.length} episodes`,
        film: false,
        showId: show.id,
        n: season.n,
        part: season.k != null,
      };
    }
    const film = DATA.films.find((x) => x.film === unit.slice(2));
    if (!film) return null;
    return {
      title: film.title,
      sub: ["Film", film.year].filter(Boolean).join(" · "),
      film: true,
    };
  }

  /* ---------- order ---------- */

  const absMode = () => {
    try {
      return !!JSON.parse(localStorage.getItem("mediavault.absnum") || "{}")[page.uni];
    } catch (e) {
      return false;
    }
  };

  const absMaps = new Map();
  function absOf(show, n, e) {
    if (!absMaps.has(show.id)) {
      const map = new Map();
      let i = 0;
      (show.allSeasons || show.seasons).forEach((se) =>
        se.episodes.forEach((ep) => map.set(`${se.n}x${ep.n}`, ++i)),
      );
      absMaps.set(show.id, map);
    }
    return absMaps.get(show.id).get(`${n}x${e}`) || e;
  }

  function seasonOf(unit) {
    const [type, a, b] = unit.split(":");
    if (type !== "s") return null;
    const show = DATA.shows.find((x) => String(x.id) === a);
    const season = show && show.seasons.find((x) => String(sk(x)) === b);
    return season ? { show, season } : null;
  }

  const breaksFor = (showId) =>
    (DATA.breaks || [])
      .filter((x) => String(x).startsWith(`${showId}:`))
      .map((x) => Number(String(x).split(":")[1]));

  /* Rows of the list. Normally one per season or film; in continuous mode a
     show's neighbouring seasons are one row, unless a break sits between them. */
  function groups() {
    if (!absMode()) return DATA.units.map((u) => [u]);
    const out = [];
    for (const u of DATA.units) {
      const cur = seasonOf(u);
      const last = out[out.length - 1];
      const prev = last ? seasonOf(last[last.length - 1]) : null;
      if (cur && prev && prev.show.id === cur.show.id && prev.season.n !== cur.season.n) {
        const eps = prev.season.episodes;
        const end = absOf(prev.show, prev.season.n, eps[eps.length - 1].n);
        if (!breaksFor(cur.show.id).includes(end)) {
          last.push(u);
          continue;
        }
      }
      out.push([u]);
    }
    return out;
  }

  function groupLabel(group) {
    const first = seasonOf(group[0]);
    if (!first || !absMode()) return unitLabel(group[0]);
    const last = seasonOf(group[group.length - 1]);
    const from = absOf(first.show, first.season.n, first.season.episodes[0].n);
    const lastEps = last.season.episodes;
    const to = absOf(last.show, last.season.n, lastEps[lastEps.length - 1].n);
    const count = group.reduce((n, u) => n + seasonOf(u).season.episodes.length, 0);
    return {
      title: `${first.show.title} · Episodes ${from}–${to}`,
      sub: `${count} episodes`,
      film: false,
      showId: first.show.id,
      n: first.season.n,
      part: false,
      abs: true,
    };
  }

  function absCutsText(showId) {
    const show = DATA.shows.find((x) => String(x.id) === String(showId));
    if (!show) return "";
    const cuts = new Set(breaksFor(showId));
    Object.entries(DATA.splits || {}).forEach(([key, list]) => {
      const [, sid, n] = key.split(":");
      if (sid === String(showId)) list.forEach((c) => cuts.add(absOf(show, Number(n), Number(c))));
    });
    return [...cuts].sort((a, b) => a - b).join(", ");
  }

  function orderTab() {
    const list = groups();
    const abs = absMode();
    const seasonRows = list.filter((g) => g[0].startsWith("s:")).length;
    const hidden = DATA.hiddenSeasons || [];
    const formShown = new Set();

    const rows = list
      .map((group, i) => {
        const l = groupLabel(group);
        if (!l) return "";
        const splitKey = l.film ? "" : abs ? `abs:${l.showId}` : `${l.showId}:${l.n}`;
        const showForm = !l.film && splitting === splitKey && !formShown.has(splitKey);
        if (showForm) formShown.add(splitKey);
        const hasCuts = abs ? !!absCutsText(l.showId) : l.part;
        return `
          <li class="pe-row" draggable="true" data-i="${i}">
            <span class="pe-grip" aria-hidden="true">⋮⋮</span>
            <span class="pe-main"><b>${esc(l.title)}</b><small>${esc(l.sub)}</small></span>
            <button class="btn btn-ghost sm" data-move="-1" data-i="${i}" aria-label="Move up" ${i === 0 ? "disabled" : ""}>↑</button>
            <button class="btn btn-ghost sm" data-move="1" data-i="${i}" aria-label="Move down" ${i === list.length - 1 ? "disabled" : ""}>↓</button>
            ${
              l.film
                ? `<button class="btn btn-ghost sm danger" data-drop-film="${esc(group[0].slice(2))}">Remove</button>`
                : `<button class="btn btn-ghost sm" data-split="${splitKey}">${hasCuts ? "Edit split" : "Split"}</button>${
                    seasonRows > 1
                      ? `<button class="btn btn-ghost sm danger" data-hide-group="${i}">Remove</button>`
                      : ""
                  }`
            }
            ${
              showForm
                ? `<form class="pe-split" data-split-form="${splitKey}">
                     <label class="pe-field"><span>${
                       abs
                         ? "End a part after episode… using the overall episode number (several allowed, e.g. 30, 60). Leave empty to join everything back together."
                         : "End a part after episode… (several allowed, e.g. 30, 60). Leave empty to join the season back together."
                     }</span>
                       <input name="cuts" inputmode="numeric" autocomplete="off" value="${esc(
                         abs
                           ? absCutsText(l.showId)
                           : ((DATA.splits || {})[`s:${l.showId}:${l.n}`] || []).join(", "),
                       )}" placeholder="30, 60" /></label>
                     <div class="pe-actions"><button type="button" class="btn btn-ghost sm" data-split-cancel>Cancel</button><button class="btn btn-accent sm" type="submit">Apply</button></div>
                   </form>`
                : ""
            }
          </li>`;
      })
      .join("");
    return `
      <p class="pe-hint">Drag a row, or use the arrows. ${abs ? "Episodes are shown as one run because Continuous episodes is on; split a run to place a film inside it." : "Seasons and films can go in any order."}</p>
      <ol class="pe-list">${rows}</ol>
      ${
        hidden.length
          ? `<h4 class="pe-sub">Removed from this page</h4>
             <ol class="pe-list">${hidden
               .map(
                 (h) => `
               <li class="pe-row">
                 <span class="pe-main"><b>${esc(h.title)} · Season ${h.n}${h.label ? ` · ${esc(h.label)}` : ""}</b><small>${h.episodes} episodes · not shown or counted</small></span>
                 <button class="btn sm" data-restore-season="${esc(h.key)}">Restore</button>
               </li>`,
               )
               .join("")}</ol>`
          : ""
      }`;
  }

  function setHidden(keys) {
    saveAndReload({ hidden: keys });
  }

  let splitting = null;

  const seasonUnit = (showId, n) => (u) => {
    const [t, sid, k] = u.split(":");
    return t === "s" && sid === String(showId) && String(k).split("p")[0] === String(n);
  };

  /* Replace one season's rows with the parts that `cuts` produce, in place. */
  function rewriteSeason(units, show, n, cuts) {
    const eps = show.seasons
      .filter((se) => String(se.n) === String(n))
      .flatMap((se) => se.episodes.map((ep) => ep.n));
    const max = Math.max(...eps);
    const clean = [...new Set(cuts)].filter((c) => c > 0 && c < max).sort((a, b) => a - b);
    const edges = [0, ...clean, Infinity];
    let keys = [];
    for (let i = 0; i < edges.length - 1; i++) {
      if (eps.some((e) => e > edges[i] && e <= edges[i + 1])) keys.push(`s:${show.id}:${n}p${i + 1}`);
    }
    if (keys.length < 2) keys = [`s:${show.id}:${n}`];

    const mine = seasonUnit(show.id, n);
    const at = units.findIndex(mine);
    const rest = units.filter((u) => !mine(u));
    const before = at < 0 ? rest.length : units.slice(0, at).filter((u) => !mine(u)).length;
    rest.splice(before, 0, ...keys);
    return { units: rest, cuts: keys.length > 1 ? clean : [] };
  }

  const numbers = (text) =>
    [...new Set(String(text).split(/[^0-9]+/).map(Number))].filter((c) => c > 0);

  function applySplit(showId, n, text) {
    const show = DATA.shows.find((x) => String(x.id) === String(showId));
    if (!show) return;
    const out = rewriteSeason(DATA.units, show, n, numbers(text));
    const splits = { ...(DATA.splits || {}) };
    if (out.cuts.length) splits[`s:${showId}:${n}`] = out.cuts;
    else delete splits[`s:${showId}:${n}`];
    const stale = new RegExp(`^s:${showId}:${n}p[0-9]+$`);
    const hidden = (DATA.hiddenSeasons || []).map((h) => h.key).filter((k) => !stale.test(k));
    saveAndReload({ units: out.units, splits, hidden });
  }

  /* Continuous mode: cut points are overall episode numbers. A cut inside a
     season splits that season; a cut on a season boundary is kept as a break. */
  function applyAbsSplit(showId, text) {
    const show = DATA.shows.find((x) => String(x.id) === String(showId));
    if (!show) return;
    const wanted = numbers(text);
    const seasons = [...new Set(show.seasons.map((se) => se.n))];
    const bySeason = new Map(seasons.map((n) => [n, []]));
    const breaks = [];

    for (const n of seasons) {
      const eps = show.seasons.filter((se) => se.n === n).flatMap((se) => se.episodes.map((ep) => ep.n));
      const lastEp = Math.max(...eps);
      for (const e of eps) {
        const a = absOf(show, n, e);
        if (!wanted.includes(a)) continue;
        if (e === lastEp) breaks.push(`${showId}:${a}`);
        else bySeason.get(n).push(e);
      }
    }

    let units = DATA.units;
    const splits = { ...(DATA.splits || {}) };
    let hidden = (DATA.hiddenSeasons || []).map((h) => h.key);
    for (const n of seasons) {
      const before = JSON.stringify(splits[`s:${showId}:${n}`] || []);
      const out = rewriteSeason(units, show, n, bySeason.get(n));
      units = out.units;
      if (out.cuts.length) splits[`s:${showId}:${n}`] = out.cuts;
      else delete splits[`s:${showId}:${n}`];
      if (before !== JSON.stringify(out.cuts)) {
        const stale = new RegExp(`^s:${showId}:${n}p[0-9]+$`);
        hidden = hidden.filter((k) => !stale.test(k));
      }
    }
    const keep = (DATA.breaks || []).filter((x) => !String(x).startsWith(`${showId}:`));
    saveAndReload({ units, splits, hidden, breaks: [...keep, ...breaks] });
  }

  function move(from, to) {
    const list = groups();
    if (to < 0 || to >= list.length || from === to) return;
    const [group] = list.splice(from, 1);
    list.splice(to, 0, group);
    DATA.units = list.flat();
    save();
    draw();
  }

  function bindOrder(body) {
    body.querySelectorAll("[data-move]").forEach((b) =>
      b.addEventListener("click", () => move(+b.dataset.i, +b.dataset.i + +b.dataset.move)),
    );
    body.querySelectorAll("[data-drop-film]").forEach((b) =>
      b.addEventListener("click", () => {
        const key = b.dataset.dropFilm;
        DATA.films = DATA.films.filter((f) => f.film !== key);
        DATA.units = DATA.units.filter((u) => u !== `f:${key}`);
        Store.setRefs([[page.uni, `m:${key}`]], false);
        save();
        draw();
      }),
    );
    body.querySelectorAll("[data-hide-group]").forEach((b) =>
      b.addEventListener("click", () =>
        setHidden([
          ...(DATA.hiddenSeasons || []).map((h) => h.key),
          ...groups()[+b.dataset.hideGroup],
        ]),
      ),
    );
    body.querySelectorAll("[data-restore-season]").forEach((b) =>
      b.addEventListener("click", () =>
        setHidden(
          (DATA.hiddenSeasons || []).map((h) => h.key).filter((k) => k !== b.dataset.restoreSeason),
        ),
      ),
    );
    body.querySelectorAll("[data-split]").forEach((b) =>
      b.addEventListener("click", () => {
        splitting = splitting === b.dataset.split ? null : b.dataset.split;
        draw();
      }),
    );
    body.querySelectorAll("[data-split-cancel]").forEach((b) =>
      b.addEventListener("click", () => {
        splitting = null;
        draw();
      }),
    );
    body.querySelectorAll("[data-split-form]").forEach((f) => {
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const [a, b] = f.dataset.splitForm.split(":");
        const text = new FormData(f).get("cuts");
        if (a === "abs") applyAbsSplit(b, text);
        else applySplit(a, b, text);
      });
      f.querySelector("input").focus();
      ["dragstart", "mousedown"].forEach((ev) => f.addEventListener(ev, (e) => e.stopPropagation()));
    });
    let dragging = null;
    body.querySelectorAll(".pe-row[draggable]").forEach((row) => {
      row.addEventListener("dragstart", (e) => {
        dragging = +row.dataset.i;
        row.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });
      row.addEventListener("dragend", () => row.classList.remove("dragging"));
      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        row.classList.add("over");
      });
      row.addEventListener("dragleave", () => row.classList.remove("over"));
      row.addEventListener("drop", (e) => {
        e.preventDefault();
        if (dragging != null) move(dragging, +row.dataset.i);
      });
    });
  }

  /* ---------- movies ---------- */

  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  function localFilms(q) {
    if (typeof FILMS === "undefined") return [];
    const nq = norm(q);
    const out = [];
    for (const [key, f] of Object.entries(FILMS)) {
      if (f.type && f.type !== "film") continue;
      const n = norm(f.title);
      if (!n.includes(nq)) continue;
      out.push({
        key,
        title: f.title,
        year: String(f.release || "").slice(0, 4),
        poster: f.poster || "",
        mins: f.mins || 0,
        src: "registry",
        rank: n === nq ? 0 : n.startsWith(nq) ? 1 : 2,
      });
    }
    return out.sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title)).slice(0, 6);
  }

  const has = (key) => DATA.films.some((f) => f.film === key);

  function addFilm(f) {
    if (has(f.key)) return;
    const { rank, ...film } = f;
    DATA.films.push({ ...film, film: film.key });
    DATA.units.push(`f:${film.key}`);
    save();
    if (typeof toast === "function") toast(`Added ${film.title} to this page`);
  }

  function filmRow(f, i) {
    const owned = has(f.key);
    return `
      <li class="pe-row">
        <span class="pe-thumb">${f.poster ? `<img src="${esc(f.poster)}" alt="" loading="lazy">` : ""}</span>
        <span class="pe-main"><b>${esc(f.title)}</b><small>${esc(f.year || "")}${f.src === "registry" ? " · in your movie library" : ""}</small></span>
        <button class="btn sm" data-pick="${i}" ${owned ? "disabled" : ""}>${owned ? "On this page" : "Add"}</button>
      </li>`;
  }

  function moviesTab() {
    return `
      <label class="pe-field"><span>Search films</span>
        <input id="peSearch" type="text" autocomplete="off" spellcheck="false" placeholder="Film title…" />
      </label>
      <p class="pe-hint" id="peSearchHint">Type a title. Films already in your movie library share their watched state.</p>
      <ol class="pe-list" id="peResults"></ol>

      <details class="pe-custom">
        <summary>Can't find it? Add a custom film</summary>
        <form id="peCustom" class="pe-form">
          <label class="pe-field pe-wide"><span>Title</span><input name="title" required maxlength="140" /></label>
          <label class="pe-field"><span>Year</span><input name="year" inputmode="numeric" maxlength="4" /></label>
          <label class="pe-field"><span>Runtime (min)</span><input name="mins" inputmode="numeric" maxlength="4" /></label>
          <label class="pe-field pe-wide"><span>Poster image link</span><input name="poster" type="url" placeholder="https://…" /></label>
          <label class="pe-field pe-wide"><span>Notes</span><textarea name="note" rows="2" maxlength="400"></textarea></label>
          <div class="pe-actions"><button class="btn btn-accent sm" type="submit">Add custom film</button></div>
        </form>
      </details>`;
  }

  function bindMovies(body) {
    const input = body.querySelector("#peSearch");
    const hint = body.querySelector("#peSearchHint");
    const list = body.querySelector("#peResults");
    let results = [];
    let timer = null;
    let ticket = 0;

    const paint = () => {
      list.innerHTML = results.map(filmRow).join("");
      list.querySelectorAll("[data-pick]").forEach((b) =>
        b.addEventListener("click", () => {
          addFilm(results[+b.dataset.pick]);
          paint();
        }),
      );
    };

    input.addEventListener("input", () => {
      const q = input.value.trim();
      clearTimeout(timer);
      if (q.length < 2) {
        results = [];
        hint.textContent = "Type a title. Films already in your movie library share their watched state.";
        return paint();
      }
      results = localFilms(q);
      hint.textContent = results.length ? "From your movie library. Searching elsewhere…" : "Searching…";
      paint();
      const mine = ++ticket;
      timer = setTimeout(async () => {
        let remote = [];
        let failed = false;
        try {
          if (window.RatingGraph) remote = await window.RatingGraph.search(q);
        } catch (e) {
          failed = true;
        }
        if (mine !== ticket) return;
        const seen = new Set(results.map((r) => `${norm(r.title)}|${r.year}`));
        remote
          .filter((r) => r.kind === "movie")
          .slice(0, 8)
          .forEach((r) => {
            const k = `${norm(r.title)}|${r.year}`;
            if (seen.has(k)) return;
            seen.add(k);
            results.push({ key: `rg-${r.id}`, title: r.title, year: String(r.year || ""), poster: r.poster || "", mins: 0, src: "remote" });
          });
        hint.textContent = results.length
          ? failed
            ? "Could not reach the film search, showing your library only."
            : "Pick a film to add it to this page."
          : failed
            ? "Could not reach the film search. You can add it as a custom film below."
            : "Nothing found. You can add it as a custom film below.";
        paint();
      }, 500);
    });

    body.querySelector("#peCustom").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const title = String(fd.get("title") || "").trim();
      if (!title) return;
      addFilm({
        key: `c-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
        title,
        year: String(fd.get("year") || "").trim(),
        mins: Number(fd.get("mins")) || 0,
        poster: String(fd.get("poster") || "").trim(),
        note: String(fd.get("note") || "").trim(),
        src: "custom",
      });
      e.currentTarget.reset();
    });
    input.focus();
  }

  /* ---------- merge ---------- */

  function mergeTab() {
    const members = UserVault.members(HOST);
    const others = UserVault.list().filter(
      (x) => x.kind === KIND && x.mergedInto == null && String(x.id) !== String(HOST),
    );
    const row = (x, action) => `
      <li class="pe-row">
        <span class="pe-thumb">${x.poster ? `<img src="${esc(x.poster)}" alt="" loading="lazy">` : ""}</span>
        <span class="pe-main"><b>${esc(x.name)}</b><small>${esc(x.year || "")}</small></span>
        ${action}
      </li>`;
    return `
      <h4 class="pe-sub">On this page</h4>
      <ol class="pe-list">
        ${members
          .map((m) =>
            row(
              m,
              String(m.id) === String(HOST)
                ? '<span class="pe-tag">This page</span>'
                : `<button class="btn sm" data-separate="${m.id}">Separate</button>`,
            ),
          )
          .join("")}
      </ol>
      <h4 class="pe-sub">Your other ${NOUN}</h4>
      ${
        others.length
          ? `<ol class="pe-list">${others
              .map((o) =>
                row(
                  o,
                  `<button class="btn sm" data-pull="${o.id}">Bring onto this page</button>
                   <button class="btn btn-ghost sm" data-push="${o.id}">Move this page into it</button>`,
                ),
              )
              .join("")}</ol>`
          : `<p class="pe-hint">Add another ${NOUN} from the ${NOUN === "anime" ? "Anime" : "Shows"} page first, then merge it here.</p>`
      }
      <p class="pe-hint">Merging only changes which page a ${NOUN} appears on. Watched episodes, fillers and arcs stay with each ${NOUN}, so separating later loses nothing.</p>`;
  }

  function bindMerge(body) {
    body.querySelectorAll("[data-separate]").forEach((b) =>
      b.addEventListener("click", () => {
        UserVault.unmerge(b.dataset.separate);
        location.reload();
      }),
    );
    body.querySelectorAll("[data-pull]").forEach((b) =>
      b.addEventListener("click", () => {
        UserVault.merge(b.dataset.pull, HOST);
        location.reload();
      }),
    );
    body.querySelectorAll("[data-push]").forEach((b) =>
      b.addEventListener("click", () => {
        UserVault.merge(HOST, b.dataset.push);
        const q = new URLSearchParams(location.search);
        q.set("id", b.dataset.push);
        location.href = `${location.pathname}?${q}`;
      }),
    );
  }

  /* ---------- dialog ---------- */

  const TABS = [
    ["order", "Order", orderTab, bindOrder],
    ["movies", "Add a movie", moviesTab, bindMovies],
    ["merge", "Merge", mergeTab, bindMerge],
  ];

  function draw() {
    const el = document.getElementById("pageEditModal");
    if (!el) return;
    el.querySelectorAll("[data-tab]").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tab);
      b.setAttribute("aria-selected", String(b.dataset.tab === tab));
    });
    const [, , html, bind] = TABS.find((t) => t[0] === tab);
    const body = el.querySelector(".filler-body");
    body.innerHTML = html();
    bind(body);
  }

  function close() {
    const el = document.getElementById("pageEditModal");
    const bd = document.getElementById("pageEditBackdrop");
    if (!el) return;
    el.classList.remove("show");
    bd.classList.remove("show");
    setTimeout(() => {
      el.remove();
      bd.remove();
    }, 200);
  }

  function open() {
    if (document.getElementById("pageEditModal")) return;
    const bd = document.createElement("div");
    bd.className = "filler-backdrop";
    bd.id = "pageEditBackdrop";
    const el = document.createElement("aside");
    el.className = "filler-modal pe-modal";
    el.id = "pageEditModal";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Edit this page");
    el.innerHTML = `
      <header class="filler-head">
        <div>
          <h3>Edit this page</h3>
          <p>Arrange seasons and films, add a movie, or merge another ${NOUN} in.</p>
        </div>
        <button class="filler-close" aria-label="Close">✕</button>
      </header>
      <div class="pe-tabs" role="tablist">
        ${TABS.map(([id, label]) => `<button class="btn btn-ghost sm" role="tab" data-tab="${id}">${label}</button>`).join("")}
      </div>
      <div class="filler-body"></div>`;
    document.body.append(bd, el);
    bd.addEventListener("click", close);
    el.querySelector(".filler-close").addEventListener("click", close);
    el.querySelectorAll("[data-tab]").forEach((b) =>
      b.addEventListener("click", () => {
        tab = b.dataset.tab;
        draw();
      }),
    );
    draw();
    requestAnimationFrame(() => {
      bd.classList.add("show");
      el.classList.add("show");
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.getElementById("pageEditModal")) close();
  });
  trigger.addEventListener("click", open);
  try {
    if (sessionStorage.getItem("mv.editPage")) {
      tab = sessionStorage.getItem("mv.editPage");
      sessionStorage.removeItem("mv.editPage");
      open();
    }
  } catch (e) {}
})();
