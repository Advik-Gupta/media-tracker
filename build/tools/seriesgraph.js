#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets/js/data/series");
const DATA = path.join(ROOT, "assets/js/data");
const API = "https://seriesgraph.com/api/shows";
const IMG = "https://image.tmdb.org/t/p";

const MAP = {
  theboys: {
    shows: [
      { id: 76479, title: "The Boys" },
      { id: 205715, title: "Gen V" },
      { id: 152483, title: "The Boys Presents: Diabolical" },
    ],
  },
  got: {
    shows: [
      { id: 1399, title: "Game of Thrones" },
      { id: 94997, title: "House of the Dragon" },
      { id: 224372, title: "A Knight of the Seven Kingdoms" },
    ],
  },
  peaky: {
    shows: [{ id: 60574, title: "Peaky Blinders" }],
    films: [
      {
        film: "peaky-blinders-the-immortal-man-2026",
        title: "The Immortal Man",
        year: 2026,
      },
    ],
  },
  suits: {
    shows: [
      { id: 37680, title: "Suits" },
      { id: 259453, title: "Suits LA" },
    ],
  },
  aot: {
    shows: [{ id: 1429, title: "Attack on Titan" }],
  },
  naruto: {
    shows: [
      { id: 46260, title: "Naruto" },
      { id: 31910, title: "Naruto Shippuden" },
      { id: 70881, title: "Boruto: Naruto Next Generations" },
    ],
    films: [
      {
        film: "last-naruto-the-movie-2014",
        title: "The Last: Naruto the Movie",
        year: 2014,
      },
      {
        film: "boruto-naruto-the-movie-2015",
        title: "Boruto: Naruto the Movie",
        year: 2015,
      },
    ],
  },
  vinland: {
    shows: [{ id: 88803, title: "Vinland Saga" }],
  },
  breakingbad: {
    shows: [
      { id: 1396, title: "Breaking Bad" },
      { id: 60059, title: "Better Call Saul" },
    ],
    films: [
      {
        film: "el-camino-a-breaking-bad-movie-2019",
        title: "El Camino",
        year: 2019,
      },
    ],
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VAULT_FOLDER = {
  movie: "movies", list: "movies",
  show: "shows", showlist: "shows",
  anime: "anime", animelist: "anime",
};
const pagePath = (kind, id) => `pages/${VAULT_FOLDER[kind] || "movies"}/${id}.html`;


const ONGOING = new Set(["Returning Series", "In Production", "Planned", "Pilot"]);

async function json(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "media-vault/1.0" },
      });
      if (r.ok) return r.json();
      if (r.status === 404) return null;
    } catch (e) {}
    await sleep(800 * (attempt + 1));
  }
  return null;
}

async function showMeta(title, id) {
  const j = await json(`${API}/search?searchTerm=${encodeURIComponent(title)}`);
  const hit = (j && j.results ? j.results : []).find((d) => d.id === id);
  if (!hit) return {};
  return {
    poster: hit.poster_path ? `${IMG}/w342${hit.poster_path}` : "",
    backdrop: hit.backdrop_path ? `${IMG}/w780${hit.backdrop_path}` : "",
    score: hit.vote_average ? Math.round(hit.vote_average * 10) / 10 : null,
    year: (hit.first_air_date || "").slice(0, 4),
    overview: hit.overview || "",
  };
}

async function seasons(id) {
  const j = await json(`${API}/${id}/season-ratings`);
  if (!Array.isArray(j)) return [];
  return j
    .filter((s) => s.season_number > 0 && (s.episodes || []).length)
    .map((s) => ({
      n: s.season_number,
      episodes: s.episodes
        .slice()
        .sort((a, b) => a.episode_number - b.episode_number)
        .map((e) => ({
          n: e.episode_number,
          t: e.name || `Episode ${e.episode_number}`,
          r: e.imdb_rating != null ? e.imdb_rating : e.vote_average || null,
          v: e.imdb_votes || e.num_votes || 0,
          d: e.air_date || "",
          m: e.runtime || 0,
          s: e.still_path ? `${IMG}/w300${e.still_path}` : "",
          o: e.overview || "",
        })),
    }))
    .sort((a, b) => a.n - b.n);
}

const q = (s) =>
  `'${String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, " ")}'`;

function serialise(uni, shows, films) {
  const showsSrc = shows
    .map((sh) => {
      const seasonsSrc = sh.seasons
        .map((se) => {
          const eps = se.episodes
            .map(
              (e) =>
                `      { n: ${e.n}, t: ${q(e.t)}, r: ${e.r == null ? "null" : e.r}, v: ${e.v}, ` +
                `d: ${q(e.d)}, m: ${e.m}, s: ${q(e.s)},\n        o: ${q(e.o)} },`,
            )
            .join("\n");
          return `    { n: ${se.n}, episodes: [\n${eps}\n    ] },`;
        })
        .join("\n");
      return (
        `  { id: ${sh.id}, title: ${q(sh.title)}, year: ${q(sh.year || "")}, ` +
        `score: ${sh.score == null ? "null" : sh.score},\n` +
        `    status: ${q(sh.status || "Unknown")}, lastAir: ${q(sh.lastAir || "")},\n` +
        `    poster: ${q(sh.poster)}, backdrop: ${q(sh.backdrop)},\n` +
        `    overview: ${q(sh.overview)},\n` +
        `    seasons: [\n${seasonsSrc}\n    ] },`
      );
    })
    .join("\n");

  const filmsSrc = (films || [])
    .map(
      (f) => `  { film: ${q(f.film)}, title: ${q(f.title)}, year: ${f.year} },`,
    )
    .join("\n");

  return `/* ============================================================
   ${uni.toUpperCase()} - episode data, generated by build/seriesgraph.js
   from seriesgraph.com. Do not edit by hand; run \`npm run series\`.
   ============================================================ */

(window.SERIES ||= {})[${q(uni)}] = {
  shows: [
${showsSrc}
  ],
  films: [
${filmsSrc}
  ],
};
`;
}

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "show";

function uniqueSlug(name, kind) {
  const base = slugify(name);
  const src = fs.readFileSync(path.join(DATA, "universes.js"), "utf8");

  const entry = new RegExp(`id: "${base}",[\\s\\S]{0,600}?"?kind"?: "([a-z]+)"`);
  const found = src.match(entry);
  if (!found) return base;
  if (found[1] === kind) return base;

  let candidate = `${base}-${kind}`;
  let n = 2;
  while (new RegExp(`id: "${candidate}"`).test(src)) candidate = `${base}-${kind}${n++}`;
  return candidate;
}

function catalogueSrc(id, name, shows, films = []) {
  const items = [];
  let w = 0;
  shows.forEach((sh, si) => {
    sh.seasons.forEach((se) => {
      w += 1;
      const first = se.episodes[0] || {};
      items.push(
        `  { w: ${w}, id: ${q(`s${sh.id}-${se.n}`)}, title: ${q(`${sh.title} - Season ${se.n}`)}, ` +
        `release: ${q(first.d || "")},\n` +
        `    mins: ${se.episodes.reduce((t, e) => t + (e.m || 0), 0)}, eps: ${se.episodes.length}, ` +
        `type: 'season', phase: ${si + 1}, chrono: ${w}, cLabel: ${q(`Season ${se.n}`)}, rel: 'essential' },`
      );
    });
  });

  films.forEach((f) => {
    w += 1;
    items.push(
      `  { w: ${w}, film: ${q(f.film)}, type: 'film', phase: 1, ` +
      `chrono: ${f.year || 0}, cLabel: ${q(String(f.year || ""))}, rel: 'recommended' },`,
    );
  });

  const phases = shows
    .map((sh, i) => `  ${i + 1}: { label: ${q(sh.title)}, sub: ${q(sh.year || "")} },`)
    .join("\n");
  const blocks = (() => {
    let max = 0;
    return shows
      .map((sh, i) => {
        max += sh.seasons.length;
        return `  { max: ${max}, phase: ${i + 1} },`;
      })
      .join("\n");
  })();

  return `/* ============================================================
   ${name.toUpperCase()} - generated by \`npm run series add\`.
   Season-level catalogue; the per-episode data lives in
   assets/js/data/series/${id}.js.
   ============================================================ */

(() => {

const ITEMS = [
${items.join("\n")}
];

const TYPE_META = {
  'season': { label: 'Season', short: 'SEASON', color: '#6a9ee8' },
  'film':   { label: 'Film',   short: 'FILM',   color: '#c2453f' },
};

const REL_META = {
  essential:   { label: 'Essential',   rank: 0, color: '#6a9ee8', blurb: 'Part of the main run.' },
  recommended: { label: 'Recommended', rank: 1, color: '#e8913d', blurb: 'Sits alongside the main run.' },
};

const SAGA_META = {};

const PHASE_META = {
${phases}
};

const WATCH_BLOCKS = [
${blocks}
];

const ERAS = [
  { max: 9999, key: 'all', title: ${q(name)}, sub: 'Every season' },
];

const POSTERS = {};

(window.CATALOGUES ||= {})[${q(id)}] = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/${id}/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
`;
}

function registerUniverse(id, name, show, kind = "show", fromList = null) {
  const file = path.join(DATA, "universes.js");
  const src = fs.readFileSync(file, "utf8");
  if (new RegExp(`id:\\s*["']${id}["']`).test(src)) {
    console.log(`  "${name}" is already in the registry`);
    return false;
  }

  const year = show.year || "";
  const entry = `  {
    id: ${JSON.stringify(id)},
    page: {
      eyebrow: ${JSON.stringify(name)},
      h1a: "Every season",
      h1b: "of ${name.replace(/"/g, "")}",
      lede: ${JSON.stringify(
        (show.overview || `Every season of ${name}, tracked episode by episode.`).slice(0, 260),
      )},
      desc: ${JSON.stringify(`Every episode of ${name}, with ratings and progress tracking.`)},
      footer: ${JSON.stringify(`${name} - progress stored locally`)},
      filterLabel: "Season",
      sortLabels: {
        watch: "Watch order",
        release: "Release date",
        chrono: "In-universe",
        relevance: "Relevance",
      },
    },
    "kind": ${JSON.stringify(kind)},
    addedAt: ${JSON.stringify(new Date().toISOString())},${
      fromList
        ? `\n    fromList: ${JSON.stringify(fromList)},`
        : ""
    }
    cover: ${JSON.stringify(show.poster || "")},
    name: ${JSON.stringify(name)},
    tagline: ${JSON.stringify(
      `${show.seasons.length} season${show.seasons.length === 1 ? "" : "s"}${year ? ` \u00b7 from ${year}` : ""}`,
    )},
    href: ${JSON.stringify(pagePath(kind, id))},
    accent: "#6a9ee8",
    accent2: "#22436b",
  },
];`;

  fs.writeFileSync(file, src.replace(/\];\s*$/, entry + "\n"));
  return true;
}

async function addShow(term, opts = {}) {
  const kind = opts.kind || "show";
  const quiet = !!opts.quiet;

  if (/^\d+$/.test(term.trim())) {
    const id = Number(term.trim());
    const detail = await json(`${API}/${id}`);
    if (!detail || !detail.name) {
      if (!quiet) console.error(`  ! no show with id ${id}`);
      return { ok: false, reason: "unknown id", term };
    }
    return finishShow(
      {
        id,
        name: detail.name,
        poster_path: detail.poster_path,
        backdrop_path: detail.backdrop_path,
        first_air_date: detail.first_air_date,
        vote_average: detail.vote_average,
        overview: detail.overview,
      },
      detail,
      opts,
    );
  }

  const bare = term.replace(/\s*\((\d{4})\)\s*$/, "").trim();
  const year = (term.match(/\((\d{4})\)\s*$/) || [])[1];

  let results = [];
  for (const q of bare === term ? [term] : [bare, term]) {
    const j = await json(`${API}/search?searchTerm=${encodeURIComponent(q)}`);
    results = (j && j.results) || [];
    if (results.length) break;
    await sleep(200);
  }

  if (year && results.length) {
    const dated = results.filter((d) => String(d.first_air_date || "").startsWith(year));
    if (dated.length) results = dated;
  }

  const norm = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const hit =
    results.find((d) => norm(d.name) === norm(bare)) ||
    results.find((d) => norm(d.original_name) === norm(bare)) ||
    results.find((d) => norm(d.name) === norm(term)) ||
    results[0];

  if (!hit) {
    if (!quiet) console.error(`  ! nothing found for "${term}"`);
    return { ok: false, reason: "not found", term };
  }

  return finishShow(hit, null, opts);
}

async function finishShow(hit, detail, opts = {}) {
  const kind = opts.kind || "show";
  const quiet = !!opts.quiet;

  const name = hit.name;
  const id = uniqueSlug(name, kind);

  const registry = fs.readFileSync(path.join(DATA, "universes.js"), "utf8");
  if (new RegExp(`id: "${id}"`).test(registry) && !opts.force) {
    if (!quiet) {
      console.error(`  ! "${name}" is already in the vault as "${id}".`);
      console.error("    Re-fetch its data with:  npm run series -- " + id);
      console.error("    Or overwrite it with:    npm run series -- add " + hit.id + " -- --force");
    }
    return { ok: false, reason: "already present", name, id };
  }

  const meta = {
    poster: hit.poster_path ? `${IMG}/w342${hit.poster_path}` : "",
    backdrop: hit.backdrop_path ? `${IMG}/w780${hit.backdrop_path}` : "",
    score: hit.vote_average ? Math.round(hit.vote_average * 10) / 10 : null,
    year: String(hit.first_air_date || "").slice(0, 4),
    overview: hit.overview || "",
  };

  const se = await seasons(hit.id);
  if (!se.length) {
    if (!quiet) console.error(`  ! "${name}" has no episode data`);
    return { ok: false, reason: "no episodes", name };
  }

  if (!detail) {
    detail = await json(`${API}/${hit.id}`);
    await sleep(150);
  }

  const show = {
    id: hit.id,
    title: name,
    ...meta,
    status: (detail && detail.status) || "Unknown",
    lastAir: (detail && detail.last_air_date) || "",
    seasons: se,
  };
  const epCount = se.reduce((n, x) => n + x.episodes.length, 0);

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, `${id}.js`), serialise(id, [show], []));
  fs.writeFileSync(path.join(DATA, `${id}.js`), catalogueSrc(id, name, [show]));
  registerUniverse(id, name, show, kind, opts.fromList || null);

  if (!quiet) {
    console.log(`  matched "${name}" (${hit.id})`);
    console.log(`  ${se.length} seasons, ${epCount} episodes  ->  ${kind} vault`);
    console.log(`\n  Added. Run \`npm run build\` to generate pages/${id}.html`);
  }
  return { ok: true, id, name, seasons: se.length, episodes: epCount, poster: meta.poster };
}

async function addList(file, opts) {
  if (!fs.existsSync(file)) {
    console.error(`  ! no such file: ${file}`);
    process.exit(1);
  }

  const titles = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.endsWith("=") && !/^#/.test(l));

  console.log(`${titles.length} titles in ${path.basename(file)}\n`);

  const members = [];
  const failed = [];
  let first = null;

  for (const t of titles) {
    const r = await addShow(t, {
      kind: opts.kind,
      quiet: true,
      fromList: opts.collection || null,
    });
    if (r.ok) {
      members.push(r.id);
      if (!first && r.poster) first = r.poster;
      console.log(`  ${r.name.padEnd(42)} ${r.seasons}s ${r.episodes}ep`);
    } else {
      failed.push(t);
      console.log(`  ${t.padEnd(42)} ! ${r.reason}`);
    }
    await sleep(200);
  }

  if (opts.collection) {
    writeCollection(opts.collection, opts.name || opts.collection, opts.kind, members, first, opts.tagline);
  }

  console.log(`\n  ${members.length} added, ${failed.length} skipped`);
  if (failed.length) console.log(`  skipped: ${failed.join(", ")}`);
  console.log("\n  Run `npm run build`.");
}

function writeCollection(id, name, kind, members, cover, tagline) {
  const file = path.join(DATA, "collections.js");
  let all = {};
  if (fs.existsSync(file)) {
    const ctx = { window: {}, console };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(file, "utf8"), ctx);
    all = ctx.window.COLLECTIONS || {};
  }

  const existing = (all[id] && all[id].members) || [];
  const combined = [...new Set([...existing, ...members])];

  all[id] = {
    id,
    kind,
    name,
    tagline: tagline || `${combined.length} series`,
    cover: cover || (all[id] && all[id].cover) || "",
    members: combined,
  };

  fs.writeFileSync(
    file,
    `/* ============================================================
   COLLECTIONS - curated sets of universes.

   A collection is a list card whose entries are whole series
   rather than single titles, so opening one lands on that
   series' own page. Written by \`npm run series add-list\`.
   ============================================================ */

window.COLLECTIONS = ${JSON.stringify(all, null, 2)};
`,
  );
  console.log(`\n  collection "${name}" -> ${combined.length} members`);
}

async function refreshStatus(only) {
  if (!fs.existsSync(OUT)) return;
  const files = fs
    .readdirSync(OUT)
    .filter((f) => f.endsWith(".js") && !f.startsWith("_"))
    .filter((f) => !only.length || only.includes(f.replace(/\.js$/, "")));

  let ongoing = 0;
  for (const file of files) {
    const p = path.join(OUT, file);

    const ctx = { window: {}, console };
    vm.createContext(ctx);
    try { vm.runInContext(fs.readFileSync(p, "utf8"), ctx); }
    catch (e) { console.error(`  ! ${file} did not parse`); continue; }

    const uni = Object.keys(ctx.window.SERIES || {})[0];
    const data = uni && ctx.window.SERIES[uni];
    if (!data || !data.shows) continue;

    const labels = [];
    for (const sh of data.shows) {
      const d = await json(`${API}/${sh.id}`);
      await sleep(180);
      sh.status = (d && d.status) || "Unknown";
      sh.lastAir = (d && d.last_air_date) || "";
      if (ONGOING.has(sh.status)) ongoing += 1;
      labels.push(sh.status);
    }

    fs.writeFileSync(p, serialise(uni, data.shows, data.films || []));
    console.log(`  ${uni.padEnd(22)} ${labels.join(", ")}`);
  }
  console.log(`\n  ${ongoing} series still releasing. Run \`npm run build\`.`);
}

function readSeries(id) {
  const p = path.join(OUT, `${id}.js`);
  if (!fs.existsSync(p)) return null;
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(p, "utf8"), ctx);
  const key = Object.keys(ctx.window.SERIES || {})[0];
  return key ? { key, data: ctx.window.SERIES[key] } : null;
}

function recordMerge(child, parent) {
  const file = path.join(DATA, "merges.js");
  let map = {};
  if (fs.existsSync(file)) {
    const ctx = { window: {}, console };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(file, "utf8"), ctx);
    map = ctx.window.MERGES || {};
  }
  map[child] = parent;
  fs.writeFileSync(
    file,
    `/* ============================================================
   MERGES - a series that was folded into another.

   Episode progress is stored per universe, so when two universes
   become one the old keys have to move. store.js reads this and
   migrates them once. Written by \`npm run series merge\`.
   ============================================================ */

window.MERGES = ${JSON.stringify(map, null, 2)};
`,
  );
}

function mergeShows(parentId, childIds) {
  const parent = readSeries(parentId);
  if (!parent) {
    console.error(`  ! "${parentId}" has no episode data`);
    process.exit(1);
  }

  const uctx = { window: {}, console };
  vm.createContext(uctx);
  vm.runInContext(
    fs.readFileSync(path.join(DATA, "universes.js"), "utf8") + ";this.U = UNIVERSES;",
    uctx,
  );
  const parentUni = uctx.U.find((u) => u.id === parentId);
  if (!parentUni) {
    console.error(`  ! "${parentId}" is not in the registry`);
    process.exit(1);
  }

  const shows = [...parent.data.shows];
  const films = [...(parent.data.films || [])];
  const merged = [];

  for (const childId of childIds) {
    if (childId === parentId) continue;
    const child = readSeries(childId);
    if (!child) { console.error(`  ! "${childId}" has no episode data`); continue; }

    const already = new Set(shows.map((s) => s.id));
    child.data.shows.forEach((sh) => { if (!already.has(sh.id)) shows.push(sh); });
    (child.data.films || []).forEach((f) => {
      if (!films.some((x) => x.film === f.film)) films.push(f);
    });

    const childUni = uctx.U.find((u) => u.id === childId);
    merged.push((childUni && childUni.name) || childId);
    recordMerge(childId, parentId);
  }

  if (!merged.length) {
    console.error("  ! nothing to merge");
    process.exit(1);
  }

  fs.writeFileSync(path.join(OUT, `${parentId}.js`), serialise(parentId, shows, films));
  fs.writeFileSync(
    path.join(DATA, `${parentId}.js`),
    catalogueSrc(parentId, parentUni.name, shows, films),
  );

  const src = fs.readFileSync(path.join(DATA, "universes.js"), "utf8");
  const at = src.indexOf(`id: "${parentId}"`);
  const end = src.indexOf("\n  },", at);
  const tagline = shows.map((s) => s.title).join(" \u00b7 ");
  const next = src
    .slice(at, end)
    .replace(/\n(\s*)tagline: "[^"]*",/, `\n$1tagline: ${JSON.stringify(tagline)},`);
  fs.writeFileSync(path.join(DATA, "universes.js"), src.slice(0, at) + next + src.slice(end));

  for (const childId of childIds) {
    if (childId === parentId) continue;
    for (const p of [
      path.join(OUT, `${childId}.js`),
      path.join(DATA, `${childId}.js`),
      path.join(ROOT, `${childId}.html`),
    ]) {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    const s2 = fs.readFileSync(path.join(DATA, "universes.js"), "utf8");
    const block = new RegExp(`\\n  \\{\\n    id: "${childId}",[\\s\\S]*?\\n  \\},(?=\\n)`);
    fs.writeFileSync(path.join(DATA, "universes.js"), s2.replace(block, ""));
  }

  console.log(`  merged ${merged.join(", ")} into "${parentUni.name}"`);
  console.log(`  "${parentUni.name}" now contains ${shows.length} shows`);
  console.log("\n  Run `npm run build`.");
}

function rebuildCatalogue(id) {
  const series = readSeries(id);
  if (!series) {
    console.error(`  ! "${id}" has no episode data`);
    process.exit(1);
  }

  const uctx = { window: {}, console };
  vm.createContext(uctx);
  vm.runInContext(
    fs.readFileSync(path.join(DATA, "universes.js"), "utf8") + ";this.U = UNIVERSES;",
    uctx,
  );
  const uni = uctx.U.find((u) => u.id === id);
  if (!uni) {
    console.error(`  ! "${id}" is not in the registry`);
    process.exit(1);
  }

  const { shows = [], films = [] } = series.data;
  fs.writeFileSync(
    path.join(DATA, `${id}.js`),
    catalogueSrc(id, uni.name, shows, films),
  );

  const seasons = shows.reduce((n, sh) => n + (sh.seasons || []).length, 0);
  console.log(`  ${uni.name}: ${shows.length} show(s), ${seasons} seasons, ${films.length} film(s)`);
  console.log("\n  Run `npm run build`.");
}

function removeShow(term) {
  const key = term.toLowerCase().trim();
  const file = path.join(DATA, "universes.js");
  const src = fs.readFileSync(file, "utf8");

  const entry = new RegExp(
    '\\n  \\{\\n    id: "([^"]+)",[\\s\\S]*?\\n  \\},(?=\\n)',
    "g",
  );

  let hit = null;
  for (const m of src.matchAll(entry)) {
    const id = m[1];
    const name = (m[0].match(/\n    name: "([^"]*)"/) || [])[1] || "";
    if (id.toLowerCase() === key || name.toLowerCase() === key) {
      hit = { id, name, block: m[0] };
      break;
    }
  }

  if (!hit) {
    console.error(`  ! "${term}" is not in the registry`);
    process.exit(1);
  }

  if (MAP[hit.id]) {
    console.error(
      `  ! "${hit.name}" is one of the built-in universes.\n` +
      `    Delete its entry from MAP in build/seriesgraph.js first if you really mean it.`,
    );
    process.exit(1);
  }

  fs.writeFileSync(file, src.replace(hit.block, ""));

  const gone = [];
  for (const p of [
    path.join(OUT, `${hit.id}.js`),
    path.join(DATA, `${hit.id}.js`),
    path.join(ROOT, `${hit.id}.html`),
  ]) {
    if (fs.existsSync(p)) { fs.unlinkSync(p); gone.push(path.relative(ROOT, p)); }
  }

  console.log(`  removed "${hit.name}"`);
  gone.forEach((g) => console.log(`    - ${g}`));
  console.log("\n  Run `npm run build` to refresh the vault.");
}

(async () => {
  const raw = process.argv.slice(2);
  const FLAGS_WITH_VALUES = new Set([
    "--kind", "--collection", "--name", "--tagline", "--section", "--id", "--limit",
  ]);
  const args = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i].startsWith("-")) {
      if (FLAGS_WITH_VALUES.has(raw[i])) i += 1;
      continue;
    }
    args.push(raw[i]);
  }

  if (args[0] === "merge" || args[0] === "link") {
    const [, parent, ...children] = args;
    if (!parent || !children.length) {
      console.error("  usage: npm run series merge <parent> <child> [child...]");
      process.exit(1);
    }
    mergeShows(parent, children);
    return;
  }

  if (args[0] === "rebuild") {
    if (!args[1]) {
      console.error("  usage: npm run series -- rebuild <id>");
      process.exit(1);
    }
    rebuildCatalogue(args[1]);
    return;
  }

  if (args[0] === "status") {
    await refreshStatus(args.slice(1));
    return;
  }

  if (args[0] === "remove" || args[0] === "rm") {
    const term = args.slice(1).join(" ");
    if (!term) {
      console.error('  usage: npm run series remove "show name"');
      process.exit(1);
    }
    removeShow(term);
    return;
  }

  if (args[0] === "add-list") {
    const file = args[1];
    if (!file) {
      console.error('  usage: npm run series add-list <file> -- --kind anime --collection mini-anime --name "Best Short Anime"');
      process.exit(1);
    }
    const flag = (n, d) => {
      const i = process.argv.indexOf(`--${n}`);
      return i > -1 ? process.argv[i + 1] : d;
    };
    await addList(file, {
      kind: flag("kind", "show"),
      collection: flag("collection", null),
      name: flag("name", null),
      tagline: flag("tagline", null),
    });
    return;
  }

  if (args[0] === "add") {
    const flagAt = process.argv.indexOf("--kind");
    const kind = flagAt > -1 ? process.argv[flagAt + 1] : "show";
    if (!["show", "anime"].includes(kind)) {
      console.error(`  ! --kind must be show or anime, not "${kind}"`);
      process.exit(1);
    }

    const term = args.slice(1).join(" ").trim();
    if (!term) {
      console.error('  usage: npm run series add "show name" [-- --kind anime]');
      console.error("         npm run series add 46260 -- --kind anime");
      process.exit(1);
    }
    await addShow(term, { kind, force: process.argv.includes("--force") });
    return;
  }

  fs.mkdirSync(OUT, { recursive: true });
  const targets = args.length ? args : Object.keys(MAP);

  for (const uni of targets) {
    const spec = MAP[uni];
    if (!spec) { console.error(`  ! no mapping for "${uni}"`); continue; }

    const shows = [];
    for (const s of spec.shows) {
      const meta = await showMeta(s.title, s.id);
      await sleep(250);
      const se = await seasons(s.id);
      await sleep(250);
      const epCount = se.reduce((n, x) => n + x.episodes.length, 0);
      if (!epCount) console.error(`  ! ${s.title} (${s.id}) returned no episodes`);
      shows.push({ ...s, ...meta, seasons: se });
      console.log(`  ${s.title.padEnd(34)} ${se.length} seasons, ${epCount} episodes`);
    }

    fs.writeFileSync(path.join(OUT, `${uni}.js`), serialise(uni, shows, spec.films));
    console.log(`\u2192 assets/js/data/series/${uni}.js\n`);
  }
})();
