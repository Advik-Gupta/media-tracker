/* ============================================================
   ANALYTICS — what your progress actually looks like.

   Everything here is computed in the browser from three sources:
   the catalogues (what exists), the progress store (what you have
   ticked) and _stats.js (one rating, runtime and year per episode,
   baked at build time so the page does not have to load a hundred
   episode files).

   Charts are hand-drawn SVG rather than a library: the palette and
   the flat, unshadowed treatment are the same rules as the rest of
   the site, and a chart library would fight both.
   ============================================================ */

(() => {
  const el = (id) => document.getElementById(id);
  const root = el("analytics");
  if (!root) return;

  const UNIS = typeof UNIVERSES !== "undefined" ? UNIVERSES : [];
  const CATS = window.CATALOGUES || {};
  const COUNTS = window.SERIES_COUNTS || {};
  const EPS = window.EP_STATS || {};

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  const VAULT_OF = (u) =>
    ({ list: "movie", showlist: "show", animelist: "anime" })[u.kind] ||
    u.kind ||
    "movie";

  const VAULTS = [
    { id: "all", label: "Everything" },
    { id: "movie", label: "Movies" },
    { id: "show", label: "Shows" },
    { id: "anime", label: "Anime" },
  ];

  const state = { vault: "all" };

  /* ---------- gathering ----------
     One pass builds every figure the page needs, so a vault switch is a
     recompute rather than a dozen separate walks. */

  const store = Store.exportAll();
  const EP_KEY = /^e\d+-\d+x\d+$/;

  function gather() {
    const inScope = (u) => state.vault === "all" || VAULT_OF(u) === state.vault;

    const seen = new Set();
    let titles = 0;
    let watched = 0;
    /* Episodes are unique to their show, so they never double-count; titles
       can sit on several shelves, so those are deduped through `seen`. */
    let epTotal = 0;
    let epDone = 0;
    let minutes = 0;

    const byDecade = new Map();   // decade -> { total, done }
    const byVault = new Map();    // vault  -> { total, done }
    const ratings = new Array(11).fill(0); // watched episodes, by whole rating
    const filmScores = [];                 // watched films, by IMDb score
    const genres = new Map();              // genre -> { total, done }
    const rated = [];                      // ratings of finished titles
    const shelves = [];           // per-universe progress
    const records = { best: null, worst: null };

    for (const u of UNIS) {
      if (!inScope(u)) continue;
      const vault = VAULT_OF(u);
      const cat = CATS[u.id];
      const meta = COUNTS[u.id];
      const filler = store[`__filler_${u.id}`] || {};
      const bucket = store[u.id] || {};

      let uTotal = 0;
      let uDone = 0;

      /* Episode-based universes report through the baked stats. */
      if (meta && EPS[u.id]) {
        for (const [key, [r10, mins, year, epTitle]] of Object.entries(EPS[u.id])) {
          if (filler[key]) continue;
          uTotal += 1;
          epTotal += 1;
          const done = !!bucket[key];
          if (!done) continue;
          uDone += 1;
          epDone += 1;
          minutes += mins;

          if (r10 != null) {
            const whole = Math.min(10, Math.max(0, Math.round(r10 / 10)));
            ratings[whole] += 1;
            const rating = r10 / 10;
            if (!records.best || rating > records.best.rating)
              records.best = { rating, key, uni: u, title: epTitle };
            if (!records.worst || rating < records.worst.rating)
              records.worst = { rating, key, uni: u, title: epTitle };
          }

          const d = year ? Math.floor(year / 10) * 10 : 0;
          if (d) {
            const row = byDecade.get(d) || { total: 0, done: 0 };
            row.done += 1;
            byDecade.set(d, row);
          }
        }
        /* the decade totals need the unwatched side too */
        for (const [key, [, , year]] of Object.entries(EPS[u.id])) {
          if (filler[key] || bucket[key]) continue;
          const d = year ? Math.floor(year / 10) * 10 : 0;
          if (!d) continue;
          const row = byDecade.get(d) || { total: 0, done: 0 };
          row.total += 1;
          byDecade.set(d, row);
        }
      }

      /* Everything else counts through its catalogue. */
      if (cat && cat.items) {
        const items =
          typeof resolvedItems === "function" ? resolvedItems(cat) : cat.items;
        for (const it of items) {
          if (it.alias) continue;
          const ref = progressRef(u.id, it);
          const key = ref.join("/");
          const first = !seen.has(key);
          seen.add(key);

          /* A film in both the MCU and the IMDb 250 is one title overall but
             belongs to both shelves. Only the global tallies dedupe; a
             shelf's own total has to count everything on it, or its
             percentage is measured against the wrong denominator. */
          if (first) titles += 1;
          uTotal += meta && EPS[u.id] ? 0 : 1;

          const d = it.release ? Math.floor(Number(it.release.slice(0, 4)) / 10) * 10 : 0;
          const row = d ? byDecade.get(d) || { total: 0, done: 0 } : null;

          /* Genres come from the ratingraph pass; a title without them is
             simply not counted rather than bucketed as "unknown". */
          const g = Array.isArray(it.genres) ? it.genres : [];
          const watchedNow = Store.has(...ref);
          if (first) {
            g.forEach((name) => {
              const row = genres.get(name) || { total: 0, done: 0 };
              row.total += 1;
              if (watchedNow) row.done += 1;
              genres.set(name, row);
            });
            const r = typeof it.rgRating === "number" ? it.rgRating : it.score;
            if (watchedNow && typeof r === "number") rated.push(r);
          }

          if (watchedNow) {
            if (!(meta && EPS[u.id])) uDone += 1;
            if (first) {
              watched += 1;
              minutes += it.mins || 0;
              if (it.score) filmScores.push(it.score);
              if (row) row.done += 1;
            }
          } else if (row && first) {
            row.total += 1;
          }
          if (row && first) byDecade.set(d, row);
        }
      }

      const v = byVault.get(vault) || { total: 0, done: 0 };
      v.total += uTotal;
      v.done += uDone;
      byVault.set(vault, v);

      /* A universe holding several series is several things to watch, so it
         is reported as several rows: Berlin's progress says nothing about
         Money Heist's and averaging them together hides both. */
      const perShow = (meta && meta.perShow) || [];
      if (perShow.length > 1 && EPS[u.id]) {
        for (const sh of perShow) {
          const prefix = `e${sh.id}-`;
          let t = 0;
          let dn = 0;
          for (const key of Object.keys(EPS[u.id])) {
            if (!key.startsWith(prefix) || filler[key]) continue;
            t += 1;
            if (bucket[key]) dn += 1;
          }
          if (t > 0) {
            shelves.push({
              id: `${u.id}:${sh.id}`,
              name: sh.title,
              href: u.href,
              vault,
              total: t,
              done: dn,
              pct: (dn / t) * 100,
            });
          }
        }
      } else if (uTotal > 0) {
        shelves.push({
          id: u.id,
          name: u.name,
          href: u.href,
          vault,
          total: uTotal,
          done: uDone,
          pct: (uDone / uTotal) * 100,
        });
      }
    }

    /* Every decade row needs total to mean "all of them", not "the rest". */
    for (const [, row] of byDecade) row.total += row.done;

    return {
      titles,
      watched,
      epTotal,
      epDone,
      minutes,
      byDecade: [...byDecade.entries()].sort((a, b) => a[0] - b[0]),
      byVault,
      ratings,
      filmScores,
      genres: [...genres.entries()]
        .map(([name, r]) => ({ name, ...r, pct: r.total ? (r.done / r.total) * 100 : 0 }))
        .sort((x, y) => y.done - x.done || y.total - x.total),
      rated,
      shelves,
      records,
    };
  }

  /* ---------- drawing ---------- */

  const fmtHours = (m) =>
    m >= 1440 ? `${(m / 1440).toFixed(1)}d` : `${Math.round(m / 60)}h`;

  function statCard(value, label, sub) {
    return `<div class="acard">
      <b data-count="${value}">0</b>
      <span>${esc(label)}</span>
      ${sub ? `<em>${esc(sub)}</em>` : ""}
    </div>`;
  }

  /** A column chart. Bars are buttons so the whole thing is keyboard reachable. */
  function columns(rows, opts = {}) {
    if (!rows.length) return `<p class="a-empty">Nothing to show yet.</p>`;
    const max = Math.max(...rows.map((r) => r.value), 1);

    return `<div class="colchart" role="img" aria-label="${esc(opts.label || "")}">
      ${rows
        .map(
          (r) => `
        <div class="col" tabindex="0"
             title="${esc(r.title || `${r.label}: ${r.value}`)}">
          <span class="col-value">${r.value}</span>
          <span class="col-bar" style="height:${(r.value / max) * 100}%;${
            r.color ? `background:${r.color}` : ""
          }"></span>
          <span class="col-label">${esc(r.label)}</span>
        </div>`,
        )
        .join("")}
    </div>`;
  }

  /** Horizontal bars, for anything with a long label. */
  function bars(rows) {
    if (!rows.length) return `<p class="a-empty">Nothing to show yet.</p>`;
    return `<div class="barlist">
      ${rows
        .map(
          (r) => `
        <a class="barrow" href="${r.href || "#"}" title="${esc(r.title || "")}">
          <span class="barrow-name">${esc(r.label)}</span>
          <span class="barrow-track"><i style="width:${r.pct}%"></i></span>
          <span class="barrow-value">${r.value}</span>
        </a>`,
        )
        .join("")}
    </div>`;
  }

  /** A ring, for one proportion. */
  function ring(done, total, label) {
    const pct = total ? (done / total) * 100 : 0;
    const C = 2 * Math.PI * 52;
    return `<div class="ringwrap">
      <svg viewBox="0 0 120 120" class="bigring" aria-hidden="true">
        <circle cx="60" cy="60" r="52" class="ring-track" />
        <circle cx="60" cy="60" r="52" class="ring-fill"
                style="stroke-dasharray:${C};stroke-dashoffset:${C - (pct / 100) * C}" />
      </svg>
      <div class="ringlabel">
        <b>${Math.round(pct)}%</b>
        <span>${esc(label)}</span>
      </div>
    </div>`;
  }

  const BAND = (r) =>
    r >= 9.7 ? "cinema"
    : r >= 9 ? "awesome"
    : r >= 8 ? "great"
    : r >= 7 ? "good"
    : r >= 6 ? "average"
    : r >= 5 ? "bad"
    : "garbage";

  /* "Ozymandias — Breaking Bad, S05E14". The episode title rides along in the
     stats index and the show name comes from the counts index, so a record
     can name itself without loading any episode data. */
  function describe(rec) {
    if (!rec) return "";
    const m = rec.key.match(/^e(\d+)-(\d+)x(\d+)$/);
    if (!m) return rec.title || rec.key;

    const tmdb = Number(m[1]);
    const meta = (window.SERIES_COUNTS || {})[rec.uni.id];
    const show = ((meta && meta.perShow) || []).find((s) => s.id === tmdb);
    const showName = (show && show.title) || rec.uni.name;

    const code = `S${String(m[2]).padStart(2, "0")}E${String(m[3]).padStart(2, "0")}`;
    return rec.title ? `${rec.title} — ${showName}, ${code}` : `${showName}, ${code}`;
  }

  /* ---------- what each vault measures ----------
     A film shelf counts titles and a series shelf counts episodes, so the
     headline figures cannot be the same four numbers everywhere. */

  const EPISODIC = new Set(["show", "anime"]);

  function headlineCards(d, totalDone, totalAll) {
    const startedCount = d.shelves.filter((s) => s.done > 0).length;
    const doneCount = d.shelves.filter((s) => s.total && s.done === s.total).length;
    const v = state.vault;


    if (EPISODIC.has(v)) {
      return [
        statCard(totalDone, "episodes watched", `of ${totalAll.toLocaleString()}`),
        statCard(Math.round(d.minutes / 60), "hours watched", fmtHours(d.minutes)),
        statCard(startedCount, "series started", `of ${d.shelves.length}`),
        statCard(doneCount, "completed", "every episode"),
      ].join("");
    }

    if (v === "movie") {
      return [
        statCard(totalDone, "films watched", `of ${totalAll.toLocaleString()}`),
        statCard(startedCount, "shelves started", `of ${d.shelves.length}`),
        statCard(doneCount, "completed", "start to finish"),
        statCard(Math.round(d.minutes / 60), "hours logged", "where runtimes are known"),
      ].join("");
    }

    return [
      statCard(totalDone, "finished", `of ${totalAll.toLocaleString()}`),
      statCard(Math.round(d.minutes / 60), "hours watched", fmtHours(d.minutes)),
      statCard(startedCount, "shelves started", `of ${d.shelves.length}`),
      statCard(doneCount, "completed", "start to finish"),
    ].join("");
  }

  /* Ratings only exist per episode. Films carry a score for about a fifth of
     the catalogue, so charting that would be a chart
     of what happens to have data rather than of anything you did. Those
     vaults get a figure that is actually theirs instead. */
  function qualityPanel(d) {
    const v = state.vault;
    const anyEpisodes = d.ratings.some((n) => n > 0);

    if ((v === "all" || EPISODIC.has(v)) && anyEpisodes) {
      return `<section class="a-panel">
        <h2>How good was it?</h2>
        <p class="a-sub">Every episode you have watched, by its rating.</p>
        ${columns(
          d.ratings
            .map((n, i) => ({ n, i }))
            .filter((r) => r.i >= 3)
            .map((r) => ({
              label: String(r.i),
              value: r.n,
              color: `var(--b-${BAND(r.i)})`,
              title: `${r.n} episodes rated around ${r.i}`,
            })),
        )}
      </section>`;
    }

    const top = d.shelves
      .filter((s) => s.done > 0)
      .sort((a, b) => b.done - a.done)
      .slice(0, 8);

    const noun = v === "movie" ? "films" : "titles";

    return `<section class="a-panel">
      <h2>Where it went</h2>
      <p class="a-sub">The shelves you have put the most ${noun} into.</p>
      ${bars(
        top.map((s) => ({
          label: s.name,
          value: String(s.done),
          pct: (s.done / (top[0] ? top[0].done : 1)) * 100,
          href: s.href,
          title: `${s.done} of ${s.total}`,
        })),
      )}
    </section>`;
  }

  const busiestDecade = (d) => {
    const rows = d.byDecade.filter(([, r]) => r.done > 0);
    if (!rows.length) return null;
    const [decade, row] = rows.reduce((a, b) => (b[1].done > a[1].done ? b : a));
    return { decade, done: row.done };
  };

  /* Genres arrive with the ratingraph pass. Until that has run there is
     nothing to draw, so the panel takes itself out rather than showing an
     empty frame. */
  function genrePanel(d) {
    const top = d.genres.filter((g) => g.done > 0).slice(0, 12);
    if (!top.length) return "";

    const max = Math.max(...top.map((g) => g.done), 1);
    return `<section class="a-panel">
      <h2>What you actually watch</h2>
      <p class="a-sub">By genre, counting only what you have finished.</p>
      <div class="barlist">
        ${top
          .map(
            (g) => `
          <div class="barrow" title="${g.done} of ${g.total} in this genre">
            <span class="barrow-name">${esc(g.name)}</span>
            <span class="barrow-track"><i style="width:${(g.done / max) * 100}%"></i></span>
            <span class="barrow-value">${g.done}</span>
          </div>`,
          )
          .join("")}
      </div>
    </section>`;
  }

  /* ---------- render ---------- */

  function render() {
    const d = gather();

    /* The headline counts each thing once. Shelf percentages deliberately do
       not — a film on three lists is one film here and three entries there. */
    const totalDone = d.epDone + d.watched;
    const totalAll = d.epTotal + d.titles;

    /* Ranking everything by percentage just lists the finished ones, which
       says nothing. What is useful is how far through the unfinished ones
       you are — and, separately, what you actually completed. */
    const inProgress = d.shelves
      .filter((s) => s.done > 0 && s.done < s.total)
      .sort((a, b) => b.pct - a.pct || b.done - a.done)
      .slice(0, 10);

    const finished = d.shelves
      .filter((s) => s.total > 0 && s.done === s.total)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    root.innerHTML = `
      <div class="a-filters">
        ${VAULTS.map(
          (v) => `<button class="chip${state.vault === v.id ? " active" : ""}"
                    data-vault="${v.id}">${v.label}</button>`,
        ).join("")}
      </div>

      <section class="a-stats">${headlineCards(d, totalDone, totalAll)}</section>

      <div class="a-row">
        <section class="a-panel a-ring-panel">
          <h2>Overall</h2>
          ${ring(totalDone, totalAll, "of everything in view")}
          <div class="vault-legend">
            ${[...d.byVault.entries()]
              .sort((a, b) => b[1].done - a[1].done)
              .map(
                ([k, v]) => `<div class="vl-row">
                  <span class="vl-name">${esc(k)}</span>
                  <span class="vl-track"><i style="width:${v.total ? (v.done / v.total) * 100 : 0}%"></i></span>
                  <span class="vl-val">${v.done} / ${v.total}</span>
                </div>`,
              )
              .join("")}
          </div>
        </section>

        <section class="a-panel">
          <h2>By decade</h2>
          <p class="a-sub">Everything you have finished, by when it came out.</p>
          ${columns(
            d.byDecade.map(([dec, row]) => ({
              label: `${String(dec).slice(2)}s`,
              value: row.done,
              title: `${dec}s — ${row.done} of ${row.total} finished`,
            })),
            { label: "Finished titles by decade" },
          )}
        </section>
      </div>

      <div class="a-row">
        ${qualityPanel(d)}

        <section class="a-panel">
          <h2>Furthest along</h2>
          <p class="a-sub">Of everything you are partway through, closest to done first.</p>
          ${bars(
            inProgress.map((s) => ({
              label: s.name,
              value: `${Math.round(s.pct)}%`,
              pct: s.pct,
              href: s.href,
              title: `${s.done} of ${s.total}`,
            })),
          )}
        </section>
      </div>

      <div class="a-row">
        ${genrePanel(d)}

        <section class="a-panel">
          <h2>Finished</h2>
          <p class="a-sub">Seen start to finish, biggest first.</p>
          ${bars(
            finished.map((s) => ({
              label: s.name,
              value: `${s.total}`,
              pct: 100,
              href: s.href,
              title: `all ${s.total} watched`,
            })),
          )}
        </section>

        <section class="a-panel">
          <h2>Records</h2>
          <div class="records">
            ${
              d.records.best && (state.vault === "all" || EPISODIC.has(state.vault))
                ? `<div class="record">
                     <span class="rlabel">Best you have seen</span>
                     <b class="r-${BAND(d.records.best.rating)}">${d.records.best.rating.toFixed(1)}</b>
                     <span class="rname">${esc(describe(d.records.best))}</span>
                   </div>`
                : ""
            }
            ${
              d.records.worst && (state.vault === "all" || EPISODIC.has(state.vault))
                ? `<div class="record">
                     <span class="rlabel">Worst you have seen</span>
                     <b class="r-${BAND(d.records.worst.rating)}">${d.records.worst.rating.toFixed(1)}</b>
                     <span class="rname">${esc(describe(d.records.worst))}</span>
                   </div>`
                : ""
            }
            ${
              d.minutes
                ? `<div class="record">
                     <span class="rlabel">Time invested</span>
                     <b>${fmtHours(d.minutes)}</b>
                     <span class="rname">${Math.round(d.minutes / 60).toLocaleString()} hours of screen time</span>
                   </div>`
                : ""
            }
            ${
              d.rated.length
                ? `<div class="record">
                     <span class="rlabel">Your average</span>
                     <b>${(d.rated.reduce((s, r) => s + r, 0) / d.rated.length).toFixed(1)}</b>
                     <span class="rname">across ${d.rated.length} rated titles you finished</span>
                   </div>`
                : ""
            }
            ${
              d.genres.filter((g) => g.done > 0)[0]
                ? `<div class="record">
                     <span class="rlabel">Your genre</span>
                     <b>${esc(d.genres.filter((g) => g.done > 0)[0].name)}</b>
                     <span class="rname">${d.genres.filter((g) => g.done > 0)[0].done} finished, more than any other</span>
                   </div>`
                : ""
            }
            ${
              busiestDecade(d)
                ? `<div class="record">
                     <span class="rlabel">Your decade</span>
                     <b>${busiestDecade(d).decade}s</b>
                     <span class="rname">${busiestDecade(d).done} finished, more than any other</span>
                   </div>`
                : ""
            }
          </div>
        </section>
      </div>`;

    root.querySelectorAll("[data-vault]").forEach((b) =>
      b.addEventListener("click", () => {
        state.vault = b.dataset.vault;
        render();
      }),
    );

    countUp();
  }

  /* The big numbers count up once, on each render. Switching the filter
     re-renders mid-animation, so each run carries a token and a stale frame
     drops out rather than writing its own target into the new markup. */
  let renderToken = 0;

  function countUp() {
    const token = ++renderToken;

    root.querySelectorAll("[data-count]").forEach((node) => {
      const target = Number(node.dataset.count);
      if (!Number.isFinite(target)) {
        node.textContent = node.dataset.count;
        return;
      }

      /* The value is written first and animated second, so an interrupted
         run leaves the real figure rather than whatever frame it died on. */
      const final = target.toLocaleString();
      node.textContent = final;

      const start = performance.now();
      const step = (now) => {
        if (token !== renderToken) {
          node.textContent = final;
          return;
        }
        const p = Math.min(Math.max((now - start) / 700, 0), 1);
        node.textContent = Math.round(
          target * (1 - Math.pow(1 - p, 3)),
        ).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
        else node.textContent = final;
      };
      requestAnimationFrame(step);
    });
  }

  render();
})();
