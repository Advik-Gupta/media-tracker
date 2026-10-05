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

  function save() {
    UserVault.savePage(HOST, {
      units: DATA.units,
      films: DATA.films.map(({ film, ...rest }) => rest),
      hidden: (DATA.hiddenSeasons || []).map((h) => h.key),
    });
    page.render();
  }

  function unitLabel(unit) {
    const [type, a, b] = unit.split(":");
    if (type === "s") {
      const show = DATA.shows.find((x) => String(x.id) === a);
      const season = show && show.seasons.find((x) => String(x.n) === b);
      if (!season) return null;
      return {
        title: show.seasons.length > 1 ? `${show.title} · Season ${season.n}` : show.title,
        sub: `${season.episodes.length} episodes`,
        film: false,
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

  function orderTab() {
    const seasonCount = DATA.units.filter((u) => u.startsWith("s:")).length;
    const hidden = DATA.hiddenSeasons || [];
    const rows = DATA.units
      .map((unit, i) => {
        const l = unitLabel(unit);
        if (!l) return "";
        return `
          <li class="pe-row" draggable="true" data-i="${i}">
            <span class="pe-grip" aria-hidden="true">⋮⋮</span>
            <span class="pe-main"><b>${esc(l.title)}</b><small>${esc(l.sub)}</small></span>
            <button class="btn btn-ghost sm" data-move="-1" data-i="${i}" aria-label="Move up" ${i === 0 ? "disabled" : ""}>↑</button>
            <button class="btn btn-ghost sm" data-move="1" data-i="${i}" aria-label="Move down" ${i === DATA.units.length - 1 ? "disabled" : ""}>↓</button>
            ${
              l.film
                ? `<button class="btn btn-ghost sm danger" data-drop-film="${esc(unit.slice(2))}">Remove</button>`
                : seasonCount > 1
                  ? `<button class="btn btn-ghost sm danger" data-hide-season="${esc(unit)}">Remove</button>`
                  : ""
            }
          </li>`;
      })
      .join("");
    return `
      <p class="pe-hint">Drag a row, or use the arrows. Seasons and films can go in any order.</p>
      <ol class="pe-list">${rows}</ol>
      ${
        hidden.length
          ? `<h4 class="pe-sub">Removed seasons</h4>
             <ol class="pe-list">${hidden
               .map(
                 (h) => `
               <li class="pe-row">
                 <span class="pe-main"><b>${esc(h.title)} · Season ${h.n}</b><small>${h.episodes} episodes · not shown or counted</small></span>
                 <button class="btn sm" data-restore-season="${esc(h.key)}">Restore</button>
               </li>`,
               )
               .join("")}</ol>`
          : ""
      }`;
  }

  function setHidden(keys) {
    UserVault.savePage(HOST, {
      units: DATA.units,
      films: DATA.films.map(({ film, ...rest }) => rest),
      hidden: keys,
    });
    try {
      sessionStorage.setItem("mv.editPage", "order");
    } catch (e) {}
    location.reload();
  }

  function move(from, to) {
    if (to < 0 || to >= DATA.units.length || from === to) return;
    const [unit] = DATA.units.splice(from, 1);
    DATA.units.splice(to, 0, unit);
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
    body.querySelectorAll("[data-hide-season]").forEach((b) =>
      b.addEventListener("click", () =>
        setHidden([...(DATA.hiddenSeasons || []).map((h) => h.key), b.dataset.hideSeason]),
      ),
    );
    body.querySelectorAll("[data-restore-season]").forEach((b) =>
      b.addEventListener("click", () =>
        setHidden(
          (DATA.hiddenSeasons || []).map((h) => h.key).filter((k) => k !== b.dataset.restoreSeason),
        ),
      ),
    );
    let dragging = null;
    body.querySelectorAll(".pe-row").forEach((row) => {
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
