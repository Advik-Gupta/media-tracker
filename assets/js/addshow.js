/* ============================================================
   ADD SHOW — search any series and add it to your own vault.

   seriesgraph.com sends no Access-Control-Allow-Origin header,
   so the browser cannot call it directly. /api/search,
   /api/show/[id] and /api/show/[id]/seasons are Vercel functions
   that fetch it server-side and return it with CORS allowed.

   What gets added is yours alone: the show goes into this
   browser's UserVault, not into the repo, so every visitor
   builds their own collection with no account and no terminal.
   The season data fetched for the preview is stored with it, so
   opening the page afterwards costs nothing further.

   On a host without the proxy (GitHub Pages, file://, npm run
   serve) the request 404s and the panel falls back to the
   command that adds a show to the built-in catalogue instead.
   ============================================================ */

(() => {
  const trigger = document.getElementById("addShow");
  if (!trigger) return;

  /* The anime vault and the shows vault are separate libraries, so what this
     panel adds has to follow the vault it was opened from — otherwise an
     anime lands in the shows vault and has to be moved by hand. */
  const MODE = document.body.dataset.mode === "anime" ? "anime" : "show";
  const NOUN = MODE === "anime" ? "anime" : "show";
  const KIND_FLAG = ` -- --kind ${MODE}`;
  const PLACEHOLDER = `${MODE === "anime" ? "Anime" : "Show"} name or TMDB id…`;

  /* The Vercel functions in api/. Relative, so this works the same on
     whatever domain the site is actually served from. */
  const API = "/api";
  const DEBOUNCE = 1500;

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  /* ---------- shell ---------- */

  const backdrop = document.createElement("div");
  backdrop.className = "rnd-backdrop";
  backdrop.hidden = true;

  const modal = document.createElement("aside");
  modal.className = "rnd-modal add-modal";
  modal.hidden = true;
  modal.setAttribute("aria-label", `Add ${NOUN === "anime" ? "an anime" : "a show"}`);
  modal.innerHTML = `
    <div class="rnd-head">
      <h3>Add ${NOUN === "anime" ? "an anime" : "a show"}</h3>
      <button class="rnd-close" aria-label="Close">✕</button>
    </div>
    <div class="wl-search">
      <input id="addInput" type="text" autocomplete="off" spellcheck="false"
             placeholder="${PLACEHOLDER}" aria-label="Name or id" />
    </div>
    <p class="add-hint" id="addHint">Type a name — results appear once you stop typing.</p>
    <div id="addResults"></div>
    <div id="addMerge"></div>`;

  document.body.append(backdrop, modal);

  const input = modal.querySelector("#addInput");
  const hint = modal.querySelector("#addHint");
  const results = modal.querySelector("#addResults");

  /* ---------- restoring a removed show ---------- */


  /* ---------- merging two series ----------
     Breaking Bad and Better Call Saul are one thing to watch. Merging folds
     the child into the parent, so the parent's page carries both and the
     vault shows a single card. Like adding, the file work happens in the
     build, so this composes the command. */

  function renderMerge() {
    const box = modal.querySelector("#addMerge");
    const mine = (typeof UNIVERSES !== "undefined" ? UNIVERSES : []).filter(
      (u) => (u.kind || "movie") === (document.body.dataset.mode || "show"),
    );
    if (mine.length < 2) { box.innerHTML = ""; return; }

    const opts = (sel) =>
      mine
        .map((u) => `<option value="${esc(u.id)}"${u.id === sel ? " selected" : ""}>${esc(u.name)}</option>`)
        .join("");

    box.innerHTML = `
      <div class="add-restore">
        <h4>Merge two series</h4>
        <p class="add-hint">Fold one into another — the parent keeps its page, and progress moves with it.</p>
        <div class="add-merge-row">
          <select id="mergeChild" aria-label="Series to fold in">${opts(mine[1].id)}</select>
          <span>into</span>
          <select id="mergeParent" aria-label="Series to keep">${opts(mine[0].id)}</select>
        </div>
        <div id="mergeOut"></div>
      </div>`;

    const child = box.querySelector("#mergeChild");
    const parent = box.querySelector("#mergeParent");
    const out = box.querySelector("#mergeOut");

    const update = () => {
      if (child.value === parent.value) {
        out.innerHTML = `<p class="add-hint">Pick two different series.</p>`;
        return;
      }
      out.innerHTML = `
        <div class="add-cmd">
          <code>npm run series merge ${esc(parent.value)} ${esc(child.value)} &amp;&amp; npm run build</code>
          <button class="btn btn-accent sm" id="mergeCopy">Copy command</button>
        </div>`;
      out.querySelector("#mergeCopy").addEventListener("click", async (e) => {
        const text = `npm run series merge ${parent.value} ${child.value} && npm run build`;
        try {
          await navigator.clipboard.writeText(text);
          e.currentTarget.textContent = "Copied";
        } catch (err) {
          e.currentTarget.textContent = "Select it above";
        }
        setTimeout(() => { e.currentTarget.textContent = "Copy command"; }, 1800);
      });
    };

    child.addEventListener("change", update);
    parent.addEventListener("change", update);
    update();
  }

  const open = () => {
    renderMerge();
    backdrop.hidden = modal.hidden = false;
    requestAnimationFrame(() => {
      backdrop.classList.add("show");
      modal.classList.add("show");
      input.focus();
    });
  };
  const close = () => {
    backdrop.classList.remove("show");
    modal.classList.remove("show");
    setTimeout(() => { backdrop.hidden = modal.hidden = true; }, 220);
  };

  trigger.addEventListener("click", open);
  backdrop.addEventListener("click", close);
  modal.querySelector(".rnd-close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  /* ---------- which shows are already here ---------- */

  /* Built-in and self-added both count as "already here". */
  const have = new Set([
    ...(typeof UNIVERSES !== "undefined" ? UNIVERSES : [])
      .filter((u) => u.kind === MODE)
      .map((u) => u.name.toLowerCase()),
    ...(typeof UserVault !== "undefined"
      ? UserVault.list().filter((x) => x.kind === MODE).map((x) => x.name.toLowerCase())
      : []),
  ]);

  /* ---------- search ---------- */

  let timer = null;
  let lastQuery = "";

  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = "";
      hint.textContent = "Type a name — results appear once you stop typing.";
      return;
    }
    hint.textContent = "Waiting for you to finish…";
    timer = setTimeout(() => search(q), DEBOUNCE);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length >= 2) search(q);
    }
  });

  /* Once a proxy call 404s (no api/ on this host) or throws, stop trying it
     for the rest of the session — otherwise every keystroke pays for a
     failed round trip before falling back. */
  let proxyDown = false;

  async function search(q) {
    if (q === lastQuery && results.children.length) return;
    lastQuery = q;
    hint.textContent = "Searching…";
    results.innerHTML = "";

    if (proxyDown) return offline(q);

    let data = null;
    try {
      const r = await fetch(`${API}/search?q=${encodeURIComponent(q)}`);
      if (r.ok) data = await r.json();
      else if (r.status === 404) proxyDown = true;
    } catch (e) {
      proxyDown = true;
    }

    if (!data) return offline(q);

    const hits = (data.results || [])
      .filter((d) => d.poster_path || d.first_air_date)
      .slice(0, 8);

    if (!hits.length) {
      hint.textContent = `Nothing found for “${q}”.`;
      return;
    }

    hint.textContent = "Pick one to see it before adding.";
    lastHits = new Map(hits.map((d) => [String(d.id), d]));
    results.innerHTML = hits.map(row).join("");
    results.querySelectorAll("[data-add]").forEach((b) =>
      b.addEventListener("click", () => preview(lastHits.get(b.dataset.add))),
    );
  }
  let lastHits = new Map();

  function row(d) {
    const year = (d.first_air_date || "").slice(0, 4);
    const owned = have.has((d.name || "").toLowerCase());
    return `
      <button class="wl-sugg" data-add="${d.id}" data-name="${esc(d.name)}" ${owned ? "disabled" : ""}>
        <span class="wl-sugg-thumb${d.poster_path ? "" : " ph"}">
          ${d.poster_path
            ? `<img src="https://image.tmdb.org/t/p/w154${d.poster_path}" alt="" loading="lazy">`
            : ""}
        </span>
        <span class="wl-sugg-main">
          <b class="wl-sugg-title">${esc(d.name)}</b>
          <span class="wl-sugg-sub">${year}${d.vote_average ? ` · ${d.vote_average.toFixed(1)}` : ""}</span>
        </span>
        <span class="wl-sugg-cta">${owned ? "Already here" : "Preview"}</span>
      </button>`;
  }

  function offline(q) {
    hint.textContent = proxyDown
      ? "Live lookup is not available on this host — showing the command instead."
      : "The seriesgraph API does not allow browser requests, so the search has to run locally.";
    command(q);
  }

  /* ---------- preview ----------
     What the proxy buys over a bare command: a look at the actual show —
     poster, overview, whether it is still airing, how many seasons and
     episodes — before you spend the command on the wrong "The Office". */

  const ONGOING_STATUS = new Set([
    "Returning Series",
    "In Production",
    "Planned",
    "Pilot",
  ]);

  /* `d` is the search hit — it already carries the poster, year, overview
     and score, so the poster and blurb show immediately. Only the season
     and episode count, and whether it is still airing, need another call. */
  async function preview(d) {
    if (!d) return;
    const id = String(d.id);
    const name = d.name;

    try {
      const queue = JSON.parse(localStorage.getItem("mediavault.addqueue") || "[]");
      if (!queue.some((x) => x.id === id)) queue.push({ id, name, at: Date.now() });
      localStorage.setItem("mediavault.addqueue", JSON.stringify(queue));
    } catch (e) { /* private window */ }

    hint.textContent = "";
    renderPreview(d, null, null, true);

    let detail = null;
    let seasons = null;
    try {
      const [dr, sr] = await Promise.all([
        fetch(`${API}/show/${id}`),
        fetch(`${API}/show/${id}/seasons`),
      ]);
      if (dr.ok) detail = await dr.json();
      if (sr.ok) seasons = await sr.json();
    } catch (e) {
      /* handled by renderPreview, which falls back to the command */
    }

    renderPreview(d, detail, seasons, false);
  }

  function renderPreview(d, detail, seasons, loading) {
    const id = String(d.id);
    const poster = d.poster_path
      ? `https://image.tmdb.org/t/p/w300${d.poster_path}`
      : null;
    const overview = d.overview;
    const status = detail && detail.status;
    const ongoing = status && ONGOING_STATUS.has(status);

    const seasonList = Array.isArray(seasons)
      ? seasons.filter((s) => s.season_number > 0 && (s.episodes || []).length)
      : [];
    const epCount = seasonList.reduce((n, s) => n + s.episodes.length, 0);

    results.innerHTML = `
      <div class="add-preview">
        <button class="add-preview-back" type="button">← Back to results</button>
        <div class="add-preview-body">
          <div class="add-preview-poster${poster ? "" : " ph"}">
            ${poster ? `<img src="${poster}" alt="" loading="lazy">` : ""}
          </div>
          <div class="add-preview-info">
            <h4>${esc(d.name)}</h4>
            <p class="add-preview-meta">
              ${d.first_air_date ? `<span>${esc(d.first_air_date.slice(0, 4))}</span>` : ""}
              ${d.vote_average ? `<span>${d.vote_average.toFixed(1)} ★</span>` : ""}
              ${
                loading
                  ? '<span class="add-preview-wait"><i class="spinner"></i>Seasons…</span>'
                  : `${seasonList.length ? `<span>${seasonList.length} season${seasonList.length === 1 ? "" : "s"}</span>` : ""}
                     ${epCount ? `<span>${epCount} episodes</span>` : ""}
                     ${ongoing ? '<span class="live">◉ Still releasing</span>' : status ? `<span>${esc(status)}</span>` : ""}`
              }
            </p>
            ${overview ? `<p class="add-preview-overview">${esc(overview)}</p>` : ""}
          </div>
        </div>
        <div id="addCmdBox"></div>
      </div>`;

    results.querySelector(".add-preview-back").addEventListener("click", () => {
      hint.textContent = "Pick one to see it before adding.";
      const q = input.value.trim();
      lastQuery = ""; // force a redraw of the same results
      if (q.length >= 2) search(q);
    });

    if (!loading) addAction(d, detail, seasons, document.getElementById("addCmdBox"));
  }

  /* ---------- adding ----------
     The show goes into this browser's own vault. Nothing is written to the
     repo and nobody else sees it — which is the point: every visitor builds
     their own collection without needing an account or a terminal.

     The season data fetched for the preview is stored with it, so opening
     the page afterwards is instant rather than another round trip. */

  function addAction(d, detail, seasons, mount) {
    if (!mount) return;
    const id = String(d.id);
    const uni = UserVault.uniOf(id);
    const viewHref = `pages/${MODE === "anime" ? "anime" : "shows"}/view.html?id=${id}`;

    if (UserVault.has(id)) {
      mount.innerHTML = `
        <div class="add-done">
          <span>Already in your ${NOUN === "anime" ? "anime" : "shows"}.</span>
          <a class="btn btn-accent sm" href="${viewHref}">Open it</a>
          <button class="btn sm" data-drop="1">Remove</button>
        </div>`;
      mount.querySelector("[data-drop]").addEventListener("click", () => {
        UserVault.remove(uni);
        have.delete((d.name || "").toLowerCase());
        addAction(d, detail, seasons, mount);
        if (window.vaultHidden) window.vaultHidden.refresh();
      });
      return;
    }

    /* Without the season data there is nothing to render later, so the
       command stays as the fallback when the proxy could not be reached. */
    if (!Array.isArray(seasons) || !seasons.length) {
      command(d.name, id, mount);
      return;
    }

    mount.innerHTML = `
      <div class="add-done">
        <button class="btn btn-accent" data-save="1">
          + Add to my ${NOUN === "anime" ? "anime" : "shows"}
        </button>
        <span class="add-note">Saved in this browser only.</span>
      </div>`;

    mount.querySelector("[data-save]").addEventListener("click", () => {
      const data = UserVault.transform(d, detail, seasons);
      const ok = UserVault.add(
        {
          id,
          name: d.name,
          kind: MODE,
          poster: d.poster_path ? `https://image.tmdb.org/t/p/w342${d.poster_path}` : "",
          year: (d.first_air_date || "").slice(0, 4),
        },
        data,
      );

      if (!ok) return addAction(d, detail, seasons, mount);

      have.add((d.name || "").toLowerCase());
      if (typeof toast === "function") toast(`Added ${d.name}`);
      if (window.vaultHidden) window.vaultHidden.refresh();
      addAction(d, detail, seasons, mount);
    });
  }

  function command(name, id, mount) {
    const box = mount || results;
    box.innerHTML = `
      <div class="add-cmd">
        <p>Run this, then reload:</p>
        <code>npm run series add ${id ? id : `&quot;${esc(name)}&quot;`}${KIND_FLAG} &amp;&amp; npm run build</code>
        <button class="btn btn-accent sm" id="addCopy">Copy command</button>
      </div>`;
    const copy = box.querySelector("#addCopy");
    copy.addEventListener("click", async () => {
      const text = `npm run series add ${id ? id : `"${name}"`}${KIND_FLAG} && npm run build`;
      try {
        await navigator.clipboard.writeText(text);
        copy.textContent = "Copied";
      } catch (e) {
        copy.textContent = "Select it above";
      }
      setTimeout(() => { copy.textContent = "Copy command"; }, 1800);
    });
  }
})();
