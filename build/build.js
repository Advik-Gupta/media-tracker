#!/usr/bin/env node
/* ============================================================
   BUILD - generates every HTML page and the per-universe accent
   CSS from assets/js/data/universes.js plus the two templates
   in this folder.

     npm run build

   Nothing here runs in the browser. The output is plain static
   HTML, so the site still deploys to any static host with no
   server and no runtime dependencies.
   ============================================================ */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ejs = require("ejs");

/* ------------------------------------------------------------------
   Asset fingerprinting. Browsers were serving stale copies of the CSS
   and JS after a rebuild, which showed up as a half-restyled page. Each
   asset URL gets ?v=<content hash>, so a changed file is always refetched
   and an unchanged one still comes from cache.
   ------------------------------------------------------------------ */
const crypto = require("crypto");
const hashCache = new Map();
function assetHash(rel) {
  if (!hashCache.has(rel)) {
    let h = "0";
    try {
      h = crypto
        .createHash("sha1")
        .update(fs.readFileSync(path.join(ROOT, rel)))
        .digest("hex")
        .slice(0, 8);
    } catch (e) {
      /* asset generated later in the build */
    }
    hashCache.set(rel, h);
  }
  return hashCache.get(rel);
}
function stamp(html) {
  return html.replace(
    /(?:src|href)="(assets\/[^"?]+\.(?:css|js))"/g,
    (m, rel) => m.replace(rel, `${rel}?v=${assetHash(rel)}`),
  );
}
function writeHtml(file, html) {
  const out = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, stamp(html));
}

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "assets/js/data");

/* ---------- load the registry and every catalogue ---------- */

function loadRegistry() {
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(
    fs.readFileSync(path.join(DATA, "universes.js"), "utf8") +
      ";this.U = UNIVERSES;",
    ctx,
  );
  return { universes: ctx.U, catalogues: ctx.window.CATALOGUES || {} };
}

function loadCatalogues() {
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  /* the film registry first - catalogues reference it */
  vm.runInContext(fs.readFileSync(path.join(DATA, "_films.js"), "utf8"), ctx);
  for (const f of fs.readdirSync(DATA)) {
    /* series/ holds generated episode data, not catalogues */
    if (
      f === "universes.js" ||
      f === "countries.js" ||
      f.startsWith("_") ||
      f === "series"
    )
      continue;
    try {
      vm.runInContext(fs.readFileSync(path.join(DATA, f), "utf8"), ctx);
    } catch (e) {
      console.error(`  ! ${f} failed to load: ${e.message}`);
    }
  }
  return ctx.window.CATALOGUES || {};
}

const { universes } = loadRegistry();
const catalogues = loadCatalogues();

/* the registry, for validating film references */
const ctxFilms = (() => {
  const c = { window: {}, console };
  vm.createContext(c);
  vm.runInContext(
    fs.readFileSync(path.join(DATA, "_films.js"), "utf8") + ";this.F = FILMS;",
    c,
  );
  return c.F;
})();

const VAULT_FOLDER = {
  movie: "movies",
  list: "movies",
  show: "shows",
  showlist: "shows",
  anime: "anime",
  animelist: "anime",
};

/* Shows and anime are separate libraries and can hold series of the same
   name, so each vault gets its own folder. Pages sit two deep, uniformly,
   which is why every one of them carries the same <base href="../../">. */
const folderFor = (kind) => VAULT_FOLDER[kind] || "movies";
const pagePath = (kind, id) => `pages/${folderFor(kind)}/${id}.html`;
const PAGE_BASE = "../../";

/* ---------- sanity checks, so a typo cannot ship a blank page ---------- */

const problems = [];
for (const u of universes) {
  if (!u.page) problems.push(`${u.id}: no page copy in the registry`);
  /* Every generated page lives in pages/. A registry href that forgets the
     prefix builds fine and 404s only when the card is clicked, so it is
     caught here instead. */
  /* A show or anime with episode data is served by view.html and its card
     links there by tmdb id, so only the generated ones are checked. */
  const dynamicHere =
    ["show", "anime"].includes(u.kind) &&
    fs.existsSync(path.join(DATA, "series", `${u.id}.js`));
  const expected = pagePath(u.kind, u.id);
  if (!dynamicHere && u.href !== expected)
    problems.push(`${u.id}: href is "${u.href}", should be "${expected}"`);
  if (!fs.existsSync(path.join(DATA, `${u.id}.js`)))
    problems.push(`${u.id}: assets/js/data/${u.id}.js is missing`);
  const c = catalogues[u.id];
  if (!c) {
    problems.push(`${u.id}: catalogue did not register`);
    continue;
  }
  const phases = new Set(Object.keys(c.phase || {}).map(Number));
  for (const b of c.watchBlocks || []) {
    if (!phases.has(b.phase))
      problems.push(
        `${u.id}: watch block phase ${b.phase} has no PHASE_META entry`,
      );
  }
  for (const it of c.items || []) {
    const name = it.film || it.id;
    if (it.film && !ctxFilms[it.film])
      problems.push(`${u.id}: "${it.film}" is not in the film registry`);
    if (!c.types[it.type])
      problems.push(`${u.id}: item "${name}" has unknown type "${it.type}"`);
    if (!c.rel[it.rel])
      problems.push(
        `${u.id}: item "${name}" has unknown relevance "${it.rel}"`,
      );
    if (it.phase != null && !phases.has(it.phase))
      problems.push(`${u.id}: item "${name}" has unknown phase ${it.phase}`);
  }
}
if (problems.length) {
  console.error("\nBuild aborted - fix these first:\n");
  problems.forEach((p) => console.error("  ✗ " + p));
  process.exit(1);
}

/* ------------------------------------------------------------------
   Vaults. Each one is a self-contained library: its own home page, its
   own personal list, and its own way back. Once you are inside a vault
   the only route to another is the switcher in the logo, so none of
   these links may point across.
   ------------------------------------------------------------------ */
const VAULTS = {
  movie: {
    mode: "movie",
    home: "index.html",
    back: "All universes",
    list: "pages/watchlist.html",
    listLabel: "My List",
    title: "My List",
    eyebrow: "Your own list",
    noun: "watchlist",
  },
  show: {
    mode: "show", home: "pages/shows.html", back: "All shows",
    list: null, listLabel: null,
    title: "Shows", eyebrow: "", noun: "shows",
  },
  anime: {
    mode: "anime", home: "pages/anime.html", back: "All anime",
    list: null, listLabel: null,
    title: "Anime", eyebrow: "", noun: "anime",
  },
};
/* A list belongs to the vault whose media it holds, not to a vault of its
   own: film lists sit in Movies, series lists in Shows. */
const LIST_VAULT = { list: "movie", showlist: "show", animelist: "anime" };
const vaultOf = (u) =>
  VAULTS[LIST_VAULT[u.kind] || u.kind || "movie"];

/* ------------------------------------------------------------------
   Episode counts per show universe. The shows vault needs each show's
   completion percentage to sort by, but the episode files run to
   hundreds of kilobytes and belong on the show page alone. This is the
   small index the vault reads instead: how many aired episodes exist,
   so it can divide by the ticked keys already in local storage.
   ------------------------------------------------------------------ */
function writeSeriesIndex() {
  const dir = path.join(DATA, "series");
  if (!fs.existsSync(dir)) return;

  const ctx = { window: {}, console };
  vm.createContext(ctx);
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".js") || f.startsWith("_")) continue;
    vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), ctx);
  }

  const now = Date.now();
  const counts = {};
  const series = ctx.window.SERIES || {};

  /* Whether a series is still releasing.

     TMDB's own status is not trustworthy for this: Vinland Saga, Boruto and
     One-Punch Man all report "Returning Series" with nothing scheduled, and
     that is the majority of what a status-only rule would surface. What is
     reliable is the episode list — a confirmed next season shows up as
     placeholder episodes with no air date, and an imminent one as episodes
     dated in the future. Either is real evidence; the status alone is not. */
  const unairedIn = (sh) => {
    let n = 0;
    (sh.seasons || []).forEach((se) =>
      se.episodes.forEach((ep) => {
        /* Dated in the future, or announced but unscheduled. A missing date
           on its own is not enough: plenty of older anime have episodes TMDB
           never dated, and those all carry a rating. An episode that has
           neither a date nor a rating has not aired. */
        const future = ep.d && new Date(ep.d).getTime() > now;
        const announced = !ep.d && ep.r == null;
        if (future || announced) n += 1;
      }),
    );
    return n;
  };

  for (const [uni, d] of Object.entries(series)) {
    let episodes = 0;
    (d.shows || []).forEach((sh) =>
      (sh.seasons || []).forEach((se) =>
        se.episodes.forEach((ep) => {
          /* unaired episodes are not counted, here or on the show page */
          if (ep.d && new Date(ep.d).getTime() <= now) episodes += 1;
        }),
      ),
    );

    const live = (d.shows || []).filter((sh) => unairedIn(sh) > 0);

    /* Per show as well as in total. A universe can hold several series —
       Money Heist and Berlin, Breaking Bad and Better Call Saul — and those
       are separate things to watch, so the vault and the stats page need to
       be able to talk about them one at a time. */
    const perShow = (d.shows || []).map((sh) => {
      let n = 0;
      (sh.seasons || []).forEach((se) =>
        se.episodes.forEach((ep) => {
          if (ep.d && new Date(ep.d).getTime() <= now) n += 1;
        }),
      );
      return {
        id: sh.id,
        title: sh.title,
        episodes: n,
        ongoing: unairedIn(sh) > 0,
        poster: sh.poster || "",
      };
    });

    counts[uni] = {
      perShow,
      primary: perShow[0] ? perShow[0].id : null,
      episodes,
      films: (d.films || []).length,
      shows: (d.shows || []).length,
      poster: ((d.shows || [])[0] || {}).poster || "",
      ongoing: live.length > 0,
      ongoingTitles: live.map((sh) => sh.title),
      upcoming: live.reduce((n, sh) => n + unairedIn(sh), 0),
      lastAir: (d.shows || [])
        .map((sh) => sh.lastAir || "")
        .sort()
        .pop() || "",
    };
  }

  fs.writeFileSync(
    path.join(dir, "_counts.js"),
    "/* Generated by build/build.js - episode totals for the shows vault. */\n" +
      "window.SERIES_COUNTS = " + JSON.stringify(counts, null, 2) + ";\n",
  );
  return Object.keys(counts).length;
}
const seriesIndexed = writeSeriesIndex();

/* ------------------------------------------------------------------
   Synopses and credits are half the weight of the film registry, and
   only one page shows them. They are split into their own file so
   every other page stops paying for text it never renders.
   ------------------------------------------------------------------ */
function writeFilmDetails() {
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(
    fs.readFileSync(path.join(DATA, "_films.js"), "utf8") + ";this.F = FILMS;",
    ctx,
  );

  /* Start from what is already there: the registry is stripped after each
     split, so on the next build it has nothing left to give and the file
     would otherwise be emptied. */
  const out = {};
  const existing = path.join(DATA, "_details.js");
  if (fs.existsSync(existing)) {
    const c2 = { window: {}, console };
    vm.createContext(c2);
    try {
      vm.runInContext(fs.readFileSync(existing, "utf8"), c2);
      Object.assign(out, c2.window.FILM_DETAILS || {});
    } catch (e) { /* regenerated below */ }
  }

  let n = 0;
  for (const [key, f] of Object.entries(ctx.F)) {
    const row = {};
    if (f.synopsis) row.s = f.synopsis;
    if (f.director) row.d = f.director;
    if (f.language) row.l = f.language;
    if (Object.keys(row).length) {
      out[key] = { ...(out[key] || {}), ...row };
      n += 1;
    }
  }
  const total = Object.keys(out).length;

  /* The enrichment script writes these fields into the registry; this moves
     them out again on every build, so the registry stays the single place a
     lookup writes to and the shipped file stays lean. */
  if (n) {
    let src = fs.readFileSync(path.join(DATA, "_films.js"), "utf8");
    for (const field of ["synopsis", "director", "language"]) {
      src = src.replace(
        new RegExp(`,\\s*${field}: "(?:[^"\\\\]|\\\\.)*"`, "g"),
        "",
      );
    }
    fs.writeFileSync(path.join(DATA, "_films.js"), src);
  }

  fs.writeFileSync(
    path.join(DATA, "_details.js"),
    "/* Generated by build/build.js - synopsis, director and language. */\n" +
      "window.FILM_DETAILS = " + JSON.stringify(out) + ";\n",
  );
  return total;
}
const detailsWritten = writeFilmDetails();

/* ------------------------------------------------------------------
   Which shelves hold each film. The film page wants to link back to
   the lists a title appears in, and loading every catalogue there to
   work it out would be megabytes. This is that answer, precomputed:
   film key -> the universe ids that list it.
   ------------------------------------------------------------------ */
function writeShelfIndex() {
  const out = {};
  for (const [uniId, cat] of Object.entries(catalogues)) {
    for (const it of cat.items || []) {
      if (!it.film) continue;
      (out[it.film] = out[it.film] || []).push(uniId);
    }
  }
  /* Names and colours too, so the page needs nothing else. */
  const meta = {};
  for (const u of universes) {
    meta[u.id] = { name: u.name, href: u.href, accent: u.accent || "#e3a83b" };
  }

  fs.writeFileSync(
    path.join(DATA, "_shelves.js"),
    "/* Generated by build/build.js - which shelves list each film. */\n" +
      "window.FILM_SHELVES = " + JSON.stringify(out) + ";\n" +
      "window.SHELF_META = " + JSON.stringify(meta) + ";\n",
  );
  return Object.keys(out).length;
}
const shelvesWritten = writeShelfIndex();





/* ------------------------------------------------------------------
   Analytics data. The analytics page reports on episodes as well as
   films, and loading a hundred-odd episode files to do it would mean
   megabytes. This is the compact form it reads instead: one rating
   per episode, stored as an integer tenth, grouped by universe so a
   figure can be attributed back to a show.
   ------------------------------------------------------------------ */
function writeStats() {
  const dir = path.join(DATA, "series");
  if (!fs.existsSync(dir)) return 0;

  const ctx = { window: {}, console };
  vm.createContext(ctx);
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".js") || f.startsWith("_")) continue;
    try { vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), ctx); } catch (e) {}
  }

  const now = Date.now();
  const out = {};
  let count = 0;

  for (const [uni, d] of Object.entries(ctx.window.SERIES || {})) {
    const eps = {};
    (d.shows || []).forEach((sh) =>
      (sh.seasons || []).forEach((se) =>
        se.episodes.forEach((ep) => {
          const airedYet = ep.d && new Date(ep.d).getTime() <= now;
          if (!airedYet) return;
          /* rating as a tenth, runtime in minutes, and the air year */
          /* The title travels with the rating so the analytics page can say
             which episode a record belongs to without loading the episode
             files, which is the whole point of this index. */
          eps[`e${sh.id}-${se.n}x${ep.n}`] = [
            ep.r == null ? null : Math.round(ep.r * 10),
            ep.m || 0,
            ep.d ? Number(ep.d.slice(0, 4)) : 0,
            ep.t || "",
          ];
          count += 1;
        }),
      ),
    );
    if (Object.keys(eps).length) out[uni] = eps;
  }

  fs.writeFileSync(
    path.join(DATA, "_stats.js"),
    "/* Generated by build/build.js - [rating x10, minutes, year] per episode. */\n" +
      "window.EP_STATS = " + JSON.stringify(out) + ";\n",
  );
  return count;
}
const statsWritten = writeStats();




/* Everything except the front page is generated into pages/, so the project
   root stays readable. Those pages carry <base href="../">, which is what
   lets every link in every template stay written the same way — "assets/…",
   "index.html", "pages/marvel.html" — regardless of which folder the file
   that contains it ends up in. */

/* Pages that no longer have a universe behind them are removed, so a rename,
   a deletion or a move between vaults cannot leave a stale page behind that
   still answers a URL. */
function sweepPages() {
  const dir = path.join(ROOT, "pages");
  if (!fs.existsSync(dir)) return 0;

  const wanted = new Set(["pages/analytics.html"]);
  for (const page of ["countries", "shows", "anime"]) wanted.add(`pages/${page}.html`);
  for (const v of Object.values(VAULTS)) if (v.list) wanted.add(v.list);
  wanted.add("pages/account.html");
  wanted.add("pages/movies/view.html");
  wanted.add("pages/shows/view.html");
  wanted.add("pages/anime/view.html");
  for (const u of universes) {
    if (isDynamic(u)) continue;
    wanted.add(pagePath(u.kind, u.id));
  }
  for (const c of Object.values(collections)) wanted.add(pagePath(c.kind, c.id));

  let removed = 0;
  const walk = (rel) => {
    for (const entry of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
      const child = `${rel}/${entry.name}`;
      if (entry.isDirectory()) { walk(child); continue; }
      if (!entry.name.endsWith(".html")) continue;
      if (!wanted.has(child)) { fs.unlinkSync(path.join(ROOT, child)); removed += 1; }
    }
  };
  walk("pages");
  return removed;
}

/* ------------------------------------------------------------------
   Runtime config.

   The site is static, so it cannot read environment variables in the
   browser. The build reads them here and writes them into a small JS
   file the pages load. Vercel exposes project environment variables
   to the build step, which is what makes this work there.

   Only the Supabase URL and the anon key are written. The anon key is
   designed to be public — row level security is what protects the
   data — but the service-role key must never be written here, and is
   deliberately not read.
   ------------------------------------------------------------------ */
function writeConfig() {
  const url = process.env.SUPABASE_URL || "";
  const anon = process.env.SUPABASE_ANON_KEY || "";

  fs.writeFileSync(
    path.join(ROOT, "assets/js/config.js"),
    `/* Generated by build/build.js from the environment. Do not edit,
   and do not commit — see .env.example. */
window.MV_CONFIG = {
  supabaseUrl: ${JSON.stringify(url)},
  supabaseAnonKey: ${JSON.stringify(anon)},
};
`,
  );

  return !!(url && anon);
}
const cloudConfigured = writeConfig();

/* ---------- render ---------- */

const uniTpl = fs.readFileSync(path.join(__dirname, "universe.ejs"), "utf8");
const seriesTpl = fs.readFileSync(path.join(__dirname, "series.ejs"), "utf8");
const idxTpl = fs.readFileSync(path.join(__dirname, "index.ejs"), "utf8");

/* Anything with episode data is rendered by pages/<vault>/view.html at
   request time, which fetches it through the /api proxy. That page replaced
   one generated HTML file per show: the data is the same shape either way,
   so the card just links to view.html?id=<tmdb id> instead. Lists and film
   universes are still generated, because they have no API behind them. */
const EPISODIC = new Set(["show", "anime"]);
const isDynamic = (u) =>
  EPISODIC.has(u.kind) && fs.existsSync(path.join(DATA, "series", `${u.id}.js`));

let pages = 0;
let dynamic = 0;
for (const u of universes) {
  if (isDynamic(u)) {
    dynamic++;
    continue;
  }
  writeHtml(pagePath(u.kind, u.id), ejs.render(uniTpl, { u, vault: vaultOf(u), base: PAGE_BASE }));
  pages++;
}

/* Sign-in, for the optional account sync. */
writeHtml(
  "pages/account.html",
  ejs.render(fs.readFileSync(path.join(__dirname, "account.ejs"), "utf8"), {
    base: "../",
  }),
);

/* One page for one film, reached from any movie card. */
writeHtml(
  "pages/movies/view.html",
  ejs.render(fs.readFileSync(path.join(__dirname, "movie.ejs"), "utf8"), {
    base: PAGE_BASE,
  }),
);

/* The two pages that render every show and every anime. */
const viewTpl = fs.readFileSync(path.join(__dirname, "view.ejs"), "utf8");
for (const mode of ["show", "anime"]) {
  writeHtml(
    `pages/${mode === "anime" ? "anime" : "shows"}/view.html`,
    ejs.render(viewTpl, { vault: VAULTS[mode], base: PAGE_BASE }),
  );
}
void seriesTpl;

/* A collection is a list card whose entries are whole series rather than
   single titles, so its page is a grid of universe cards. */
const collections = (() => {
  const f = path.join(DATA, "collections.js");
  if (!fs.existsSync(f)) return {};
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(f, "utf8"), ctx);
  return ctx.window.COLLECTIONS || {};
})();

const colTpl = fs.readFileSync(path.join(__dirname, "collection.ejs"), "utf8");
for (const c of Object.values(collections)) {
  const vault = VAULTS[c.kind] || VAULTS.movie;
  const members = universes.filter((u) => c.members.includes(u.id));
  writeHtml(pagePath(c.kind, c.id), ejs.render(colTpl, { c, vault, universes: members, base: PAGE_BASE }));
}

/* standalone pages that are not universes */
const PAGE_SECTIONS = {
  shows: [
    { kind: "collection", id: "lists", title: "Lists" },
    { kind: "show", id: "shows", title: "Show universes" },
  ],
  anime: [
    { kind: "collection", id: "lists", title: "Lists" },
    { kind: "anime", id: "anime", title: "Anime" },
  ],
};
/* Which country catalogues the map page has to load for its progress counts. */
const countryData = fs.readFileSync(
  path.join(ROOT, "assets/js/data/countries.js"),
  "utf8",
);
const countryLists = [
  ...new Set(
    [...countryData.matchAll(/list:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]),
  ),
];

for (const page of ["countries", "shows", "anime"]) {
  const vault =
    VAULTS[
      page === "shows" ? "show" : page === "anime" ? "anime" : "movie"
    ];

  /* A vault only needs the catalogues it actually renders. With a hundred
     universes registered, loading every one on every page is a hundred
     script tags for data the page never looks at. */
  const kinds = new Set((PAGE_SECTIONS[page] || []).map((s) => s.kind));
  const mine = kinds.size
    ? universes.filter((u) => kinds.has(u.kind || "movie"))
    : universes;

  writeHtml(
    `pages/${page}.html`,
    ejs.render(fs.readFileSync(path.join(__dirname, `${page}.ejs`), "utf8"), {
      universes: mine,
      allUniverses: universes,
      sections: PAGE_SECTIONS[page] || [],
      totalEntries: 0,
      countryLists,
      collections,
      vault,
      base: "../",
    }),
  );
}

/* the personal watchlist page - same universe scripts, different shell */
const wlTpl = fs.readFileSync(path.join(__dirname, "watchlist.ejs"), "utf8");
for (const vault of Object.values(VAULTS).filter((v) => v.list)) {
  /* Each list only searches the catalogues of its own vault - a film has no
     business turning up as a suggestion on the reading list. */
  const mine = universes.filter((u) => vaultOf(u) === vault);
  writeHtml(vault.list, ejs.render(wlTpl, { universes: mine, vault, base: "../" }));
}

/* The movies vault shows lists and film franchises. Television lives in its
   own vault, so `show` is deliberately absent here. */
const SECTIONS = [
  { kind: "list", id: "lists", title: "Lists" },
  { kind: "movie", id: "movies", title: "Movie universes" },
];
const totalEntries = new Set(
  universes.flatMap((u) =>
    (catalogues[u.id]?.items || [])
      .filter((it) => !it.alias)
      .map(
        (it) =>
          it.film || (it.link ? `__shared/${it.link}` : `${u.id}/${it.id}`),
      ),
  ),
).size;

/* The analytics page reads every catalogue, so it is rendered with the full
   registry rather than one vault's slice. */
writeHtml(
  "pages/analytics.html",
  ejs.render(fs.readFileSync(path.join(__dirname, "analytics.ejs"), "utf8"), {
    universes,
    base: "../",
  }),
);

writeHtml(
  "index.html",
  ejs.render(idxTpl, {
    base: "",
    universes,
    sections: SECTIONS,
    totalEntries,
    vault: VAULTS.movie,
  }),
);

/* ---------- per-universe accent CSS ---------- */

const css = [
  "/* ============================================================",
  "   UNIVERSE ACCENTS - generated by build/build.js.",
  "   Do not edit; change the accent in assets/js/data/universes.js",
  "   and run `npm run build`.",
  "   ============================================================ */",
  "",
  ...universes.map(
    (u) =>
      `body.u-${u.id} { --accent: ${u.accent}; --accent-2: ${u.accent2}; ` +
      `--accent-soft: color-mix(in srgb, ${u.accent} 14%, transparent); }`,
  ),
  "",
].join("\n");
fs.writeFileSync(path.join(ROOT, "assets/css/universes.css"), css);

/* universes.css is generated after the pages were rendered, so its stamp is
   corrected in place rather than left pointing at the previous build. */
hashCache.delete("assets/css/universes.css");
const uniStamp = assetHash("assets/css/universes.css");
fs.readdirSync(ROOT)
  .filter((f) => f.endsWith(".html"))
  .forEach((f) => {
    const p = path.join(ROOT, f);
    const html = fs.readFileSync(p, "utf8");
    const fixed = html.replace(
      /assets\/css\/universes\.css\?v=[0-9a-f]+/g,
      `assets/css/universes.css?v=${uniStamp}`,
    );
    if (fixed !== html) fs.writeFileSync(p, fixed);
  });

console.log(`built ${pages} universe pages + index.html`);
console.log(`${Object.keys(collections).length} collection page(s)`);
console.log(`accents written for ${universes.length} universes`);
const swept = sweepPages();
if (swept) console.log(`removed ${swept} stale page(s)`);
console.log(
  cloudConfigured
    ? "accounts: Supabase configured"
    : "accounts: no SUPABASE_URL / SUPABASE_ANON_KEY - running local-only",
);
console.log(`${totalEntries} distinct titles catalogued`);
if (seriesIndexed) console.log(`episode index written for ${seriesIndexed} show universes`);
if (statsWritten) console.log(`analytics data written for ${statsWritten} episodes`);
if (detailsWritten) console.log(`details written for ${detailsWritten} titles`);
if (shelvesWritten) console.log(`shelf index written for ${shelvesWritten} films`);
