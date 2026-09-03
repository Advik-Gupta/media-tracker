/* ============================================================
   ADD SHOW — the shows vault does not need a personal watchlist,
   because a show's full data is one lookup away. This is that
   lookup: type a name, pick from the results, and the show joins
   the vault with every season and episode already filled in.

   seriesgraph.com sends no Access-Control-Allow-Origin header, so
   the browser cannot call it from a page. The search runs against
   it directly anyway — it starts working the moment the API allows
   it, or a proxy is set below — and otherwise falls back to the
   one command that does the same job locally.
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

  /* Set this to your own proxy (it must forward to seriesgraph.com and add
     the CORS header) to make the in-page search work. Empty means direct. */
  const PROXY = "";
  const api = (p) => (PROXY ? PROXY + encodeURIComponent(p) : p);

  const SEARCH = "https://seriesgraph.com/api/shows/search?searchTerm=";
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

  const have = new Set(
    (typeof UNIVERSES !== "undefined" ? UNIVERSES : [])
      .filter((u) => u.kind === "show")
      .map((u) => u.name.toLowerCase()),
  );

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

  async function search(q) {
    if (q === lastQuery && results.children.length) return;
    lastQuery = q;
    hint.textContent = "Searching…";
    results.innerHTML = "";

    let data = null;
    try {
      const r = await fetch(api(SEARCH + encodeURIComponent(q)));
      if (r.ok) data = await r.json();
    } catch (e) {
      /* handled below — almost always the missing CORS header */
    }

    if (!data) return offline(q);

    const hits = (data.results || [])
      .filter((d) => d.poster_path || d.first_air_date)
      .slice(0, 8);

    if (!hits.length) {
      hint.textContent = `Nothing found for “${q}”.`;
      return;
    }

    hint.textContent = "Pick one to add it to the vault.";
    results.innerHTML = hits.map(row).join("");
    results.querySelectorAll("[data-add]").forEach((b) =>
      b.addEventListener("click", () => chose(b.dataset.add, b.dataset.name)),
    );
  }

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
        <span class="wl-sugg-cta">${owned ? "Already here" : "Add"}</span>
      </button>`;
  }

  function chose(id, name) {
    /* An id beats a title: the CLI resolves it directly instead of searching. */
    /* The page cannot write files, so adding is finished by the build. The
       request is queued for reference and the exact command shown. */
    try {
      const queue = JSON.parse(localStorage.getItem("mediavault.addqueue") || "[]");
      if (!queue.some((x) => x.id === id)) queue.push({ id, name, at: Date.now() });
      localStorage.setItem("mediavault.addqueue", JSON.stringify(queue));
    } catch (e) { /* private window */ }
    command(name, id);
  }

  function offline(q) {
    hint.textContent =
      "The seriesgraph API does not allow browser requests, so the search has to run locally.";
    command(q);
  }

  function command(name, id) {
    results.innerHTML = `
      <div class="add-cmd">
        <p>Run this, then reload:</p>
        <code>npm run series add ${id ? id : `&quot;${esc(name)}&quot;`}${KIND_FLAG} &amp;&amp; npm run build</code>
        <button class="btn btn-accent sm" id="addCopy">Copy command</button>
      </div>`;
    const copy = document.getElementById("addCopy");
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
