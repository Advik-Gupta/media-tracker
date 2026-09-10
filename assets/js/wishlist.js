(() => {
  const MODE = document.body.dataset.mode === "anime" ? "anime" : "show";
  const NOUN = MODE === "anime" ? "anime" : "shows";
  const API = "/api";
  const DEBOUNCE = 1500;
  const IMG = "https://image.tmdb.org/t/p";

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  const input = document.getElementById("wishInput");
  const suggest = document.getElementById("wishSuggest");
  const grid = document.getElementById("wishGrid");
  const empty = document.getElementById("wishEmpty");

  let timer = null;
  let lastQuery = "";
  let hits = [];

  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) {
      suggest.hidden = true;
      suggest.innerHTML = "";
      return;
    }
    timer = setTimeout(() => search(q), DEBOUNCE);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length >= 2) search(q);
    }
    if (e.key === "Escape") {
      suggest.hidden = true;
    }
  });

  document.addEventListener("click", (e) => {
    if (!suggest.hidden && !e.target.closest(".wl-search")) suggest.hidden = true;
  });

  async function search(q) {
    if (q === lastQuery) return;
    lastQuery = q;
    suggest.hidden = false;
    suggest.innerHTML = `<div class="wl-sugg-state"><i class="spinner"></i>Searching…</div>`;

    let data = null;
    try {
      const r = await fetch(`${API}/search?q=${encodeURIComponent(q)}`);
      if (r.ok) data = await r.json();
    } catch (e) {}

    if (!data) {
      suggest.innerHTML = `<div class="wl-sugg-state">Search is unavailable right now - try again shortly.</div>`;
      return;
    }

    hits = (data.results || []).filter((d) => d.poster_path || d.first_air_date).slice(0, 8);

    if (!hits.length) {
      suggest.innerHTML = `<div class="wl-sugg-state">Nothing found for "${esc(q)}".</div>`;
      return;
    }

    suggest.innerHTML = hits
      .map((d, i) => {
        const year = (d.first_air_date || "").slice(0, 4);
        const saved = UserVault.hasWish(d.id);
        return `
          <button class="wl-sugg" data-i="${i}" ${saved ? "disabled" : ""}>
            <span class="wl-sugg-thumb${d.poster_path ? "" : " ph"}">
              ${d.poster_path ? `<img src="${IMG}/w154${d.poster_path}" alt="" loading="lazy">` : ""}
            </span>
            <span class="wl-sugg-text">
              <b>${esc(d.name)}</b>
              <small>${year}${d.vote_average ? ` · ${d.vote_average.toFixed(1)}` : ""}${saved ? " · Already saved" : ""}</small>
            </span>
          </button>`;
      })
      .join("");

    suggest.querySelectorAll("[data-i]").forEach((b) =>
      b.addEventListener("click", () => {
        const hit = hits[Number(b.dataset.i)];
        if (!hit) return;
        UserVault.addWish(hit, MODE);
        input.value = "";
        suggest.hidden = true;
        lastQuery = "";
        if (typeof toast === "function") toast(`Saved ${hit.name} to My List`);
        paint();
      }),
    );
  }

  function posterOf(item) {
    return item.poster_path ? `${IMG}/w342${item.poster_path}` : "";
  }

  function card(item) {
    const el = document.createElement("article");
    el.className = "wish-card reveal";
    el.innerHTML = `
      <div class="wish-cover">
        ${
          posterOf(item)
            ? `<img src="${posterOf(item)}" alt="" loading="lazy" decoding="async" onerror="this.remove();">`
            : ""
        }
      </div>
      <div class="wish-body">
        <h3>${esc(item.name)}</h3>
        <p class="wish-year">${esc(item.year || "")}</p>
        ${item.overview ? `<p class="wish-overview">${esc(item.overview)}</p>` : ""}
        <div class="wish-actions">
          <button class="btn btn-accent sm" data-promote="1">+ Add to my ${esc(NOUN)}</button>
          <button class="btn btn-ghost sm" data-remove="1">Remove</button>
        </div>
        <p class="wish-msg" hidden></p>
      </div>`;

    const msg = el.querySelector(".wish-msg");

    el.querySelector("[data-remove]").addEventListener("click", () => {
      UserVault.removeWish(item.id);
      if (typeof toast === "function") toast(`Removed ${item.name}`);
      paint();
    });

    el.querySelector("[data-promote]").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = "Adding…";
      msg.hidden = true;

      try {
        const [dr, sr] = await Promise.all([
          fetch(`${API}/show/${item.id}`),
          fetch(`${API}/show/${item.id}/seasons`),
        ]);
        if (!dr.ok || !sr.ok) throw new Error("unreachable");

        const detail = await dr.json();
        const seasons = await sr.json();
        const hit = {
          id: item.id,
          name: item.name,
          poster_path: item.poster_path,
          first_air_date: item.year ? `${item.year}-01-01` : "",
          overview: item.overview,
        };
        const data = UserVault.transform(hit, detail, seasons);
        const ok = UserVault.add(
          {
            id: item.id,
            name: item.name,
            kind: MODE,
            poster: posterOf(item),
            year: item.year,
          },
          data,
        );

        if (!ok) throw new Error("already added");

        UserVault.removeWish(item.id);
        if (window.vaultHidden) window.vaultHidden.refresh();
        if (typeof toast === "function") toast(`Added ${item.name} to your ${NOUN}`);
        paint();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = `+ Add to my ${esc(NOUN)}`;
        msg.hidden = false;
        msg.textContent = "Could not fetch episode data - try again in a moment.";
      }
    });

    return el;
  }

  function paint() {
    const items = UserVault.wishlist(MODE);
    grid.innerHTML = "";
    empty.hidden = items.length > 0;
    items.forEach((item) => grid.appendChild(card(item)));
  }

  paint();

  /* Repaint on any store change - a cloud sync landing, or an accounts
     pull on load, should never need a manual reload to show up. */
  if (typeof Store !== "undefined" && Store.onChange) {
    Store.onChange(() => paint());
  }
})();
