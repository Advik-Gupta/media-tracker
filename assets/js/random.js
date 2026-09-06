(() => {
  const CATS = window.CATALOGUES || {};
  const NAME = {};
  const ALL = typeof UNIVERSES !== "undefined" ? UNIVERSES : [];
  ALL.forEach((u) => {
    NAME[u.id] = u;
  });

  const MODE = document.body.dataset.mode || "movie";
  const LIST_IDS = new Set(
    (MODE === "movie"
      ? ALL.filter((u) => u.kind === "list")
      : ALL.filter((u) => u.kind === MODE)
    ).map((u) => u.id),
  );
  const WATCHLIST = "__watchlist";

  function pool() {
    const out = [];
    const seen = new Set();

    if (state.source === WATCHLIST || state.source === "all") {
      Store.watchlist().forEach((e) => {
        const ref = refForEntry(e).join("/");
        if (seen.has(ref)) return;
        seen.add(ref);
        out.push({
          key: WATCHLIST,
          cat: null,
          watchlistEntry: e,
          it: {
            id: e.id || e.title,
            title: e.title,
            sub: e.sub,
            mins: e.mins,
            eps: e.eps,
            link: e.link,
            release: `${e.year || "-"}-01-01`,
            rel: "essential",
            type: "film",
          },
        });
      });
    }

    if (state.source !== WATCHLIST) {
      Object.keys(CATS).forEach((key) => {
        if (state.source === "all" ? !LIST_IDS.has(key) : key !== state.source)
          return;
        const cat = CATS[key];
        if (!cat || !cat.items) return;
        resolvedItems(cat).forEach((it) => {
          if (it.alias) return;
          const ref = progressRef(key, it).join("/");
          if (seen.has(ref))
            return;
          seen.add(ref);
          out.push({ it, key, cat });
        });
      });
    }

    return out;
  }

  const SEEN_BUCKET = `__seen_${document.body.dataset.mode || "movie"}`;

  function refForEntry(e) {
    if (e.film)
      return [SHARED_BUCKET, e.film];
    if (e.link) return [SHARED_BUCKET, e.link];
    if (e.uni) return [e.uni, e.id];
    return [SEEN_BUCKET, String(e.title).toLowerCase().trim()];
  }

  const state = {
    onlyUnwatched: true,
    source: "all",
    current: null,
    history: [],
  };

  function refFor(key, it, entry) {
    return key === WATCHLIST ? refForEntry(entry) : progressRef(key, it);
  }

  const el = {
    backdrop: document.getElementById("rndBackdrop"),
    modal: document.getElementById("rndModal"),
    body: document.getElementById("rndBody"),
  };
  if (!el.modal) return;

  function candidates() {
    let c = pool();
    if (state.onlyUnwatched) {
      const unwatched = c.filter(
        (x) => !Store.has(...refFor(x.key, x.it, x.watchlistEntry)),
      );
      if (unwatched.length) c = unwatched;
    }
    if (c.length > 8) {
      const recent = state.history.slice(-5);
      const fresh = c.filter((x) => !recent.includes(x.key + "/" + x.it.id));
      if (fresh.length) c = fresh;
    }
    return c;
  }

  function roll() {
    const c = candidates();
    if (!c.length) {
      el.body.innerHTML =
        '<p class="rnd-empty">Nothing left to pick - everything is marked watched.</p>';
      return;
    }
    const pick = c[Math.floor(Math.random() * c.length)];
    state.current = pick;
    state.history.push(pick.key + "/" + pick.it.id);
    paint(pick);
  }

  const esc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch],
    );

  const initials = (t) =>
    t
      .replace(/^(The|A|Star Wars:?)\s+/i, "")
      .split(/[\s:-–-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  function paint({ it, key, cat, watchlistEntry }) {
    const uni = cat
      ? NAME[key] || { name: key, href: "#", accent: "#e8393d" }
      : { name: "My List", href: "pages/watchlist.html", accent: "#6a9ee8" };
    const rel = cat
      ? cat.rel[it.rel]
      : { label: "On your list", color: "#6a9ee8", blurb: "" };
    const type = cat
      ? cat.types[it.type]
      : { label: "Film", short: "MY LIST", color: "#6a9ee8" };
    const file = cat
      ? it.poster || (cat.posters && cat.posters[it.id])
      : watchlistEntry && watchlistEntry.poster;
    const src = !file
      ? null
      : /^https?:\/\//.test(file) || file.startsWith("assets/")
        ? file
        : cat.imgDir + file;
    const watched = Store.has(...refFor(key, it, watchlistEntry));

    el.modal.style.setProperty("--rc", rel.color);
    el.modal.style.setProperty("--ua", uni.accent);

    el.body.innerHTML = `
      <div class="rnd-card">
        <div class="rnd-poster${src ? "" : " ph"}">
          <span class="ph-init">${initials(it.title)}</span>
          ${src ? `<img src="${src}" alt="" onerror="this.closest('.rnd-poster').classList.add('ph');this.remove();">` : ""}
        </div>
        <div class="rnd-info">
          <a class="rnd-uni" href="${uni.href}">${esc(uni.name)}</a>
          <h2>${esc(it.title)}</h2>
          ${it.sub ? `<p class="rnd-sub">${esc(it.sub)}</p>` : ""}
          <div class="rnd-badges">
            <span class="badge rel">${rel.label}</span>
            <span class="badge" style="--bc:${type.color}">${type.short}</span>
            <span class="badge plain">${it.eps ? it.eps + " ep · " : ""}${fmtRuntime(it.mins)}</span>
            <span class="badge plain">${it.release.slice(0, 4)}</span>
            ${watched ? '<span class="badge plain">Already watched</span>' : ""}
          </div>
          ${it.note ? `<p class="rnd-note">${esc(it.note)}</p>` : ""}
        </div>
      </div>
      <div class="rnd-actions">
        <button class="btn btn-accent" id="rndAgain">Pick another</button>
        <button class="btn" id="rndWatched">${watched ? "Mark unwatched" : "Mark as watched"}</button>
        <a class="btn" href="${uni.href}">Open ${esc(uni.name)}</a>
        <label class="rnd-toggle">
          <input type="checkbox" id="rndUnwatched" ${state.onlyUnwatched ? "checked" : ""} />
          Unwatched only
        </label>
      </div>
      <div class="rnd-source">
        <label for="rndSource">Draw from</label>
        <select id="rndSource">
          <option value="all"${state.source === "all" ? " selected" : ""}>All lists + My List</option>
          <option value="${WATCHLIST}"${state.source === WATCHLIST ? " selected" : ""}>My List</option>
          ${ALL.filter((u) => u.kind === "list" && CATS[u.id])
            .map(
              (u) =>
                `<option value="${u.id}"${state.source === u.id ? " selected" : ""}>${esc(u.name)}</option>`,
            )
            .join("")}
        </select>
      </div>`;

    document.getElementById("rndAgain").addEventListener("click", roll);
    document.getElementById("rndWatched").addEventListener("click", () => {
      Store.toggle(...refFor(key, it, watchlistEntry));
      paint({ it, key, cat, watchlistEntry });
      if (typeof window.refreshHome === "function") window.refreshHome();
    });
    document.getElementById("rndUnwatched").addEventListener("change", (e) => {
      state.onlyUnwatched = e.target.checked;
    });
    document.getElementById("rndSource").addEventListener("change", (e) => {
      state.source = e.target.value;
      state.history = [];
      roll();
    });
  }

  function open() {
    el.backdrop.hidden = false;
    el.modal.hidden = false;
    requestAnimationFrame(() => {
      el.backdrop.classList.add("show");
      el.modal.classList.add("show");
    });
    roll();
  }

  function close() {
    el.modal.classList.remove("show");
    el.backdrop.classList.remove("show");
    setTimeout(() => {
      el.modal.hidden = true;
      el.backdrop.hidden = true;
    }, 350);
  }

  document
    .querySelectorAll("[data-random-open]")
    .forEach((b) => b.addEventListener("click", open));
  document.getElementById("rndClose").addEventListener("click", close);
  el.backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (el.modal.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "r" || e.key === "R") roll();
  });
})();
