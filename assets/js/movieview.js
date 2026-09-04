/* ============================================================
   MOVIE VIEW — one page for one film.

   Reached from any movie card, as pages/movies/view.html?film=<key>
   where the key is the film registry id (e.g. inception-2010).

   The registry answers immediately — title, year, poster, genres,
   rating — so the page is never blank while the network works.
   OMDb is then asked for everything the registry does not carry:
   cast, writers, plot, runtime, certification, country, awards,
   box office and the Rotten Tomatoes and Metacritic scores.

   OMDb is used rather than ratingraph because ratingraph's detail
   pages send no Access-Control-Allow-Origin header and cannot be
   fetched from a browser at all; its search can, but carries none
   of this. OMDb allows browser requests on every endpoint.

   Plenty of older and non-English films are simply not in OMDb.
   That is expected, not an error: the page keeps what the
   registry knows and says the rest could not be found.
   ============================================================ */

(() => {
  const root = document.getElementById("mvRoot");
  if (!root) return;

  const crumb = document.getElementById("mvCrumb");
  const params = new URLSearchParams(location.search);
  const key = (params.get("film") || "").trim();

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  const reg = (typeof FILMS !== "undefined" && FILMS[key]) || null;

  if (!key || !reg) {
    root.innerHTML = `
      <div class="view-fail" style="margin-top:var(--s5)">
        <b>No film specified.</b>
        <p>This page needs a film key, like ?film=inception-2010.</p>
        <a class="btn" href="index.html">← All universes</a>
      </div>`;
    crumb.textContent = "/ Not found";
    return;
  }

  const year = reg.release ? reg.release.slice(0, 4) : "";
  const ref =
    typeof progressRef === "function"
      ? progressRef("__shared", { film: key })
      : ["__shared", key];

  document.title = `${reg.title} — Media Vault`;
  crumb.textContent = `/ ${reg.title}`;

  /* Which shelves hold this film. Precomputed at build time — working it
     out here would mean loading every catalogue for one lookup. */
  function shelves() {
    const ids = (window.FILM_SHELVES || {})[key] || [];
    const meta = window.SHELF_META || {};
    return ids.map((id) => meta[id]).filter(Boolean);
  }

  /* ---------- render ---------- */

  function render(omdb, state) {
    const watched = Store.has(...ref);
    const poster = reg.poster || (omdb && omdb.poster) || null;
    const genres =
      reg.genres && reg.genres.length ? reg.genres : (omdb && omdb.genres) || [];
    const rating = reg.rgRating != null ? reg.rgRating : reg.score;
    const where = shelves();

    const fact = (label, value) =>
      value ? `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>` : "";

    const people = (label, names) =>
      names && names.length
        ? `<div class="wc-people"><dt>${label}</dt><dd>${names
            .map((n) => `<span>${esc(n)}</span>`)
            .join("")}</dd></div>`
        : "";

    root.innerHTML = `
      <article class="mv">
        <div class="mv-poster${poster ? "" : " ph"}">
          ${poster ? `<img src="${esc(poster)}" alt="Poster for ${esc(reg.title)}">` : `<span class="ph-init">${esc(reg.title.slice(0, 2).toUpperCase())}</span>`}
          ${watched ? '<span class="stamp">Seen</span>' : ""}
        </div>

        <div class="mv-body">
          <p class="eyebrow">${esc((omdb && omdb.rated) || "Film")}</p>
          <h1>${esc(reg.title)}</h1>

          <p class="mv-line">
            ${year ? `<span>${esc(year)}</span>` : ""}
            ${omdb && omdb.mins ? `<span>${fmtRuntime(omdb.mins)}</span>` : reg.mins ? `<span>${fmtRuntime(reg.mins)}</span>` : ""}
            ${omdb && omdb.countries.length ? `<span>${esc(omdb.countries[0])}</span>` : ""}
          </p>

          ${
            genres.length
              ? `<p class="wc-genres">${genres
                  .map((g) => `<span class="wc-genre">${esc(g)}</span>`)
                  .join("")}</p>`
              : ""
          }

          <div class="wc-scores">
            ${rating != null ? `<span class="wc-score imdb"><b>${Number(rating).toFixed(1)}</b>IMDb${reg.rgVotes ? ` · ${reg.rgVotes.toLocaleString()}` : ""}</span>` : ""}
            ${omdb && omdb.rt ? `<span class="wc-score rt"><b>${esc(omdb.rt)}</b>Rotten Tomatoes</span>` : ""}
            ${omdb && omdb.mc ? `<span class="wc-score mc"><b>${esc(omdb.mc)}</b>Metacritic</span>` : ""}
            ${state === "loading" ? '<span class="wc-loading"><i class="spinner"></i>Looking up…</span>' : ""}
          </div>

          <div class="mv-actions">
            <button class="btn ${watched ? "" : "btn-accent"}" id="mvToggle">
              ${watched ? "Mark as unwatched" : "Mark as watched"}
            </button>
            ${omdb && omdb.imdbID ? `<a class="btn" href="https://www.imdb.com/title/${esc(omdb.imdbID)}/" target="_blank" rel="noopener">IMDb ↗</a>` : ""}
          </div>

          ${
            (omdb && omdb.plot) || reg.synopsis
              ? `<p class="mv-plot">${esc((omdb && omdb.plot) || reg.synopsis)}</p>`
              : ""
          }

          <dl class="wc-credits mv-credits">
            ${omdb ? fact("Director", omdb.director) : ""}
            ${omdb ? people("Cast", omdb.cast) : ""}
            ${omdb ? people("Writers", omdb.writers) : ""}
            ${omdb ? fact("Language", (omdb.languages || []).join(", ")) : ""}
            ${omdb ? fact("Country", (omdb.countries || []).join(", ")) : ""}
            ${omdb ? fact("Released", omdb.released) : ""}
            ${omdb ? fact("Box office", omdb.boxOffice) : ""}
            ${omdb ? fact("Awards", omdb.awards) : ""}
          </dl>

          ${
            state === "missing"
              ? `<p class="mv-missing">
                   No further details found for this film — OMDb has no entry
                   for it. Older and non-English titles are often missing.
                 </p>`
              : ""
          }

          ${
            where.length
              ? `<div class="mv-where">
                   <span class="rlabel">Appears in</span>
                   <p>${where
                     .map((u) => `<a class="badge" style="--bc:${u.accent}" href="${u.href}">${esc(u.name)}</a>`)
                     .join(" ")}</p>
                 </div>`
              : ""
          }
        </div>
      </article>`;

    root.querySelector("#mvToggle").addEventListener("click", () => {
      Store.toggle(...ref);
      render(omdb, state);
    });
  }

  /* ---------- go ---------- */

  render(null, "loading");

  if (!OMDb.enabled()) {
    render(null, "missing");
    return;
  }

  OMDb.lookup({ title: reg.title, year })
    .then((d) => render(d, d ? "ok" : "missing"))
    .catch(() => render(null, "missing"));
})();
