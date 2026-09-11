#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ejs = require("ejs");

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
    } catch (e) {}
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
  vm.runInContext(fs.readFileSync(path.join(DATA, "_films.js"), "utf8"), ctx);
  for (const f of fs.readdirSync(DATA)) {
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

const folderFor = (kind) => VAULT_FOLDER[kind] || "movies";
const pagePath = (kind, id) => `pages/${folderFor(kind)}/${id}.html`;
const PAGE_BASE = "../../";

const problems = [];
for (const u of universes) {
  if (!u.page) problems.push(`${u.id}: no page copy in the registry`);
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
    mode: "show",
    home: "pages/shows.html",
    back: "All shows",
    list: "pages/shows/mylist.html",
    listLabel: "My List",
    title: "Shows",
    eyebrow: "",
    noun: "shows",
  },
  anime: {
    mode: "anime",
    home: "pages/anime.html",
    back: "All anime",
    list: "pages/anime/mylist.html",
    listLabel: "My List",
    title: "Anime",
    eyebrow: "",
    noun: "anime",
  },
};
const LIST_VAULT = { list: "movie", showlist: "show", animelist: "anime" };
const vaultOf = (u) => VAULTS[LIST_VAULT[u.kind] || u.kind || "movie"];

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

  const unairedIn = (sh) => {
    let n = 0;
    (sh.seasons || []).forEach((se) =>
      se.episodes.forEach((ep) => {
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
          if (ep.d && new Date(ep.d).getTime() <= now) episodes += 1;
        }),
      ),
    );

    const live = (d.shows || []).filter((sh) => unairedIn(sh) > 0);

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
      lastAir:
        (d.shows || [])
          .map((sh) => sh.lastAir || "")
          .sort()
          .pop() || "",
    };
  }

  fs.writeFileSync(
    path.join(dir, "_counts.js"),
    "/* Generated by build/build.js - episode totals for the shows vault. */\n" +
      "window.SERIES_COUNTS = " +
      JSON.stringify(counts, null, 2) +
      ";\n",
  );
  return Object.keys(counts).length;
}
const seriesIndexed = writeSeriesIndex();

function writeFilmDetails() {
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(
    fs.readFileSync(path.join(DATA, "_films.js"), "utf8") + ";this.F = FILMS;",
    ctx,
  );

  const out = {};
  const existing = path.join(DATA, "_details.js");
  if (fs.existsSync(existing)) {
    const c2 = { window: {}, console };
    vm.createContext(c2);
    try {
      vm.runInContext(fs.readFileSync(existing, "utf8"), c2);
      Object.assign(out, c2.window.FILM_DETAILS || {});
    } catch (e) {}
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
      "window.FILM_DETAILS = " +
      JSON.stringify(out) +
      ";\n",
  );
  return total;
}
const detailsWritten = writeFilmDetails();

function writeShelfIndex() {
  const out = {};
  for (const [uniId, cat] of Object.entries(catalogues)) {
    for (const it of cat.items || []) {
      if (!it.film) continue;
      (out[it.film] = out[it.film] || []).push(uniId);
    }
  }
  const meta = {};
  for (const u of universes) {
    meta[u.id] = { name: u.name, href: u.href, accent: u.accent || "#e3a83b" };
  }

  fs.writeFileSync(
    path.join(DATA, "_shelves.js"),
    "/* Generated by build/build.js - which shelves list each film. */\n" +
      "window.FILM_SHELVES = " +
      JSON.stringify(out) +
      ";\n" +
      "window.SHELF_META = " +
      JSON.stringify(meta) +
      ";\n",
  );
  return Object.keys(out).length;
}
const shelvesWritten = writeShelfIndex();

function writeStats() {
  const dir = path.join(DATA, "series");
  if (!fs.existsSync(dir)) return 0;

  const ctx = { window: {}, console };
  vm.createContext(ctx);
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".js") || f.startsWith("_")) continue;
    try {
      vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), ctx);
    } catch (e) {}
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
      "window.EP_STATS = " +
      JSON.stringify(out) +
      ";\n",
  );
  return count;
}
const statsWritten = writeStats();

function sweepPages() {
  const dir = path.join(ROOT, "pages");
  if (!fs.existsSync(dir)) return 0;

  const wanted = new Set(["pages/analytics.html"]);
  for (const page of ["countries", "shows", "anime"])
    wanted.add(`pages/${page}.html`);
  for (const v of Object.values(VAULTS)) if (v.list) wanted.add(v.list);
  wanted.add("pages/account.html");
  wanted.add("pages/movies/view.html");
  wanted.add("pages/shows/view.html");
  wanted.add("pages/anime/view.html");
  for (const u of universes) {
    if (isDynamic(u)) continue;
    wanted.add(pagePath(u.kind, u.id));
  }
  for (const c of Object.values(collections))
    wanted.add(pagePath(c.kind, c.id));

  let removed = 0;
  const walk = (rel) => {
    for (const entry of fs.readdirSync(path.join(ROOT, rel), {
      withFileTypes: true,
    })) {
      const child = `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(child);
        continue;
      }
      if (!entry.name.endsWith(".html")) continue;
      if (!wanted.has(child)) {
        fs.unlinkSync(path.join(ROOT, child));
        removed += 1;
      }
    }
  };
  walk("pages");
  return removed;
}

function writeConfig() {
  const url = (process.env.SUPABASE_URL || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(rest|auth|storage|realtime|functions)\/v\d+$/, "");
  const anon = (process.env.SUPABASE_ANON_KEY || "").trim();

  fs.writeFileSync(
    path.join(ROOT, "assets/js/config.js"),
    `/* Generated by build/build.js from the environment. Do not edit,
   and do not commit - see .env.example. */
window.MV_CONFIG = {
  supabaseUrl: ${JSON.stringify(url)},
  supabaseAnonKey: ${JSON.stringify(anon)},
};
`,
  );

  return !!(url && anon);
}
const cloudConfigured = writeConfig();

const uniTpl = fs.readFileSync(path.join(__dirname, "universe.ejs"), "utf8");
const seriesTpl = fs.readFileSync(path.join(__dirname, "series.ejs"), "utf8");
const idxTpl = fs.readFileSync(path.join(__dirname, "index.ejs"), "utf8");

const EPISODIC = new Set(["show", "anime"]);
const isDynamic = (u) =>
  EPISODIC.has(u.kind) &&
  fs.existsSync(path.join(DATA, "series", `${u.id}.js`));

let pages = 0;
let dynamic = 0;
for (const u of universes) {
  if (isDynamic(u)) {
    dynamic++;
    continue;
  }
  writeHtml(
    pagePath(u.kind, u.id),
    ejs.render(uniTpl, { u, vault: vaultOf(u), base: PAGE_BASE }),
  );
  pages++;
}

writeHtml(
  "pages/account.html",
  ejs.render(fs.readFileSync(path.join(__dirname, "account.ejs"), "utf8"), {
    base: "../",
  }),
);

writeHtml(
  "pages/movies/view.html",
  ejs.render(fs.readFileSync(path.join(__dirname, "movie.ejs"), "utf8"), {
    base: PAGE_BASE,
  }),
);

const viewTpl = fs.readFileSync(path.join(__dirname, "view.ejs"), "utf8");
for (const mode of ["show", "anime"]) {
  writeHtml(
    `pages/${mode === "anime" ? "anime" : "shows"}/view.html`,
    ejs.render(viewTpl, { vault: VAULTS[mode], base: PAGE_BASE }),
  );
}
void seriesTpl;

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
  writeHtml(
    pagePath(c.kind, c.id),
    ejs.render(colTpl, { c, vault, universes: members, base: PAGE_BASE }),
  );
}

const wlTpl = fs.readFileSync(path.join(__dirname, "watchlist.ejs"), "utf8");
{
  const vault = VAULTS.movie;
  const mine = universes.filter((u) => vaultOf(u) === vault);
  writeHtml(
    vault.list,
    ejs.render(wlTpl, { universes: mine, vault, base: "../" }),
  );
}

const wishTpl = fs.readFileSync(path.join(__dirname, "wishlist.ejs"), "utf8");
for (const mode of ["show", "anime"]) {
  writeHtml(
    VAULTS[mode].list,
    ejs.render(wishTpl, { vault: VAULTS[mode], base: "../../" }),
  );
}

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

const showsTpl = fs.readFileSync(path.join(__dirname, "shows.ejs"), "utf8");
const animeTpl = fs.readFileSync(path.join(__dirname, "anime.ejs"), "utf8");

function entriesFor(vaultUniverses) {
  return new Set(
    vaultUniverses.flatMap((u) =>
      (catalogues[u.id]?.items || [])
        .filter((it) => !it.alias)
        .map(
          (it) =>
            it.film || (it.link ? `__shared/${it.link}` : `${u.id}/${it.id}`),
        ),
    ),
  ).size;
}

for (const [mode, tpl, sectionTitle] of [
  ["show", showsTpl, "Show universes"],
  ["anime", animeTpl, "Anime universes"],
]) {
  const vaultUniverses = universes.filter((u) => vaultOf(u) === VAULTS[mode]);
  writeHtml(
    VAULTS[mode].home,
    ejs.render(tpl, {
      base: "../",
      universes: vaultUniverses,
      sections: [
        { kind: "collection", id: "lists", title: "Lists" },
        { kind: mode, id: mode === "show" ? "shows" : "anime", title: sectionTitle },
      ],
      totalEntries: entriesFor(vaultUniverses),
      vault: VAULTS[mode],
    }),
  );
}

const countriesTpl = fs.readFileSync(path.join(__dirname, "countries.ejs"), "utf8");
const countryLists = (() => {
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(
    fs.readFileSync(path.join(DATA, "countries.js"), "utf8") + ";this.C = COUNTRIES;",
    ctx,
  );
  return Object.values(ctx.C)
    .map((c) => c.list)
    .filter(Boolean);
})();
writeHtml(
  "pages/countries.html",
  ejs.render(countriesTpl, {
    base: "../",
    countryLists,
    vault: VAULTS.movie,
  }),
);

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
if (seriesIndexed)
  console.log(`episode index written for ${seriesIndexed} show universes`);
if (statsWritten)
  console.log(`analytics data written for ${statsWritten} episodes`);
if (detailsWritten) console.log(`details written for ${detailsWritten} titles`);
if (shelvesWritten)
  console.log(`shelf index written for ${shelvesWritten} films`);
