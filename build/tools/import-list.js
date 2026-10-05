#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "assets/js/data");
const REG = path.join(DATA, "_films.js");
const WIKI = "https://en.wikipedia.org/w/api.php";
const UA = "MediaVault/1.0 (personal media tracker) node-fetch";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const has = (n) => process.argv.includes(`--${n}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VAULT_FOLDER = {
  movie: "movies",
  list: "movies",
  show: "shows",
  showlist: "shows",
  anime: "anime",
  animelist: "anime",
};
const pagePath = (kind, id) =>
  `pages/${VAULT_FOLDER[kind] || "movies"}/${id}.html`;

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/^(the|a|an)\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const keyFor = (title, year) =>
  `${norm(title).replace(/\s+/g, "-")}${year ? `-${year}` : ""}`;

async function query(params) {
  const url = `${WIKI}?${new URLSearchParams({ format: "json", ...params })}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.status === 429 || r.status === 503) {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      if (!r.ok) return null;
      const text = await r.text();
      if (text.startsWith("You are making too many")) {
        await sleep(5000 * (attempt + 1));
        continue;
      }
      return JSON.parse(text);
    } catch (e) {
      await sleep(1200 * (attempt + 1));
    }
  }
  return null;
}

function uploadUrl(file) {
  let name = String(file)
    .trim()
    .replace(/^(File|Image)\s*:/i, "")
    .replace(/\s+/g, "_");
  name = name.charAt(0).toUpperCase() + name.slice(1);
  if (!/\.(jpe?g|png|gif|webp|svg)$/i.test(name)) return null;
  const h = crypto.createHash("md5").update(name).digest("hex");
  return `https://upload.wikimedia.org/wikipedia/en/${h[0]}/${h.slice(0, 2)}/${encodeURIComponent(name)}`;
}

const infoboxImage = (t) => {
  const m = t.match(/\|\s*image\s*=\s*([^\n|}<]+)/i);
  if (!m) return null;
  const raw = m[1]
    .trim()
    .replace(/^\[\[|\]\]$/g, "")
    .split("|")[0];
  return raw ? uploadUrl(raw) : null;
};

function yearOf(page, wikitext) {
  const d = page.description || "";
  const m = d.match(/\b(1[89]\d{2}|20[0-4]\d)\b/);
  if (m) return m[1];
  const rel = wikitext.match(
    /\|\s*released\s*=[\s\S]{0,200}?\b(1[89]\d{2}|20[0-4]\d)\b/i,
  );
  return rel ? rel[1] : "";
}

async function resolve(titles, kind) {
  const out = new Map();
  const isSeries = kind === "showlist" || kind === "animelist";
  const rounds = isSeries
    ? [(t) => `${t} (miniseries)`, (t) => `${t} (TV series)`, (t) => t]
    : [(t) => `${t} (film)`, (t) => `${t} (anime film)`, (t) => t];

  for (const shape of rounds) {
    const todo = titles.filter((t) => !out.has(t));
    if (!todo.length) break;

    for (let i = 0; i < todo.length; i += 50) {
      const slice = todo.slice(i, i + 50);
      const wanted = new Map(slice.map((t) => [shape(t).toLowerCase(), t]));

      const data = await query({
        action: "query",
        redirects: "1",
        prop: "revisions|description",
        rvprop: "content",
        rvslots: "main",
        titles: slice.map(shape).join("|"),
      });
      await sleep(400);
      if (!data || !data.query) continue;

      const alias = new Map();
      for (const list of [data.query.normalized, data.query.redirects]) {
        (list || []).forEach((n) =>
          alias.set(n.to.toLowerCase(), n.from.toLowerCase()),
        );
      }
      const origin = (title) => {
        let cur = title.toLowerCase();
        for (let hop = 0; hop < 4 && !wanted.has(cur); hop++) {
          if (!alias.has(cur)) break;
          cur = alias.get(cur);
        }
        return wanted.get(cur);
      };

      for (const page of Object.values(data.query.pages || {})) {
        if (page.missing !== undefined) continue;
        const src = origin(page.title);
        if (!src || out.has(src)) continue;
        const wikitext = (((page.revisions || [])[0] || {}).slots || {}).main;
        const text = (wikitext && wikitext["*"]) || "";
        const right = isSeries
          ? /infobox\s+(television|animanga|anime)/i.test(text) ||
            /\b(series|miniseries|serial)\b/i.test(page.description || "")
          : /infobox\s+(film|animanga|anime)/i.test(text) ||
            /\b(film|anime|animated)\b/i.test(page.description || "");
        if (!right) continue;
        out.set(src, {
          year: yearOf(page, text),
          poster: infoboxImage(text) || "",
        });
      }
    }
  }
  for (const t of titles.filter((x) => !out.has(x))) {
    const j = await query({
      action: "query",
      list: "search",
      srlimit: "5",
      srsearch: `${t} ${isSeries ? "TV series" : "film"}`,
    });
    await sleep(300);
    const hits = ((j && j.query && j.query.search) || []).map((h) => h.title);

    for (const title of hits) {
      const a = norm(title.replace(/\(.*?\)/g, ""));
      const b = norm(t);
      if (a !== b && !a.startsWith(b) && !b.startsWith(a)) continue;

      const page = await query({
        action: "query",
        redirects: "1",
        prop: "revisions|description",
        rvprop: "content",
        rvslots: "main",
        titles: title,
      });
      await sleep(300);
      const p = Object.values(
        (page && page.query && page.query.pages) || {},
      )[0];
      if (!p || p.missing !== undefined) continue;
      const wt = (((p.revisions || [])[0] || {}).slots || {}).main;
      const text = (wt && wt["*"]) || "";
      const ok = isSeries
        ? /infobox\s+(television|animanga|anime)/i.test(text)
        : /infobox\s+(film|animanga|anime)/i.test(text);
      if (!ok) continue;
      out.set(t, { year: yearOf(p, text), poster: infoboxImage(text) || "" });
      break;
    }
  }

  return out;
}

function fromFile(file, sectionIndex) {
  const lines = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .map((l) => l.trimEnd());
  const sections = [];
  let cur = null;
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) continue;
    if (/=\s*$/.test(l)) {
      cur = { name: l.replace(/=\s*$/, "").trim(), titles: [] };
      sections.push(cur);
      continue;
    }
    if (!cur) {
      cur = { name: path.basename(file), titles: [] };
      sections.push(cur);
    }
    cur.titles.push(l);
  }
  const s = sections[Number(sectionIndex) - 1] || sections[0];
  return { name: s.name, entries: s.titles.map((title) => ({ title })) };
}

async function fromTopRated(limit) {
  const r = await fetch("https://seriesgraph.com/api/top-rated");
  const j = await r.json();
  const items = Array.isArray(j)
    ? j
    : j.results || j.shows || Object.values(j)[0];
  return {
    name: "Top Rated Shows",
    entries: items.slice(0, limit).map((x) => ({
      title: x.title,
      year: String(x.firstAirDate || "").slice(0, 4),
      poster: x.posterPath
        ? `https://image.tmdb.org/t/p/w342${x.posterPath}`
        : "",
      score: x.finalScore ? Math.round(x.finalScore * 10) / 10 : null,
      type: "show",
    })),
  };
}

function loadRegistry() {
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(REG, "utf8") + ";this.F = FILMS;", ctx);
  return ctx.F;
}

function appendRegistry(rows) {
  if (!rows.length) return 0;
  let src = fs.readFileSync(REG, "utf8");

  const helper = src.search(/\n(function|const)\s+resolveFilm/);
  const at = src.lastIndexOf("};", helper === -1 ? src.length : helper);
  if (at === -1) {
    console.error("  ! could not find the end of the FILMS object");
    process.exit(1);
  }
  const block = rows
    .map((r) => {
      const bits = [`title: ${JSON.stringify(r.title)}`];
      bits.push(`release: ${JSON.stringify(r.release || "")}`);
      bits.push(`type: ${JSON.stringify(r.type || "film")}`);
      if (r.score) bits.push(`score: ${r.score}`);
      if (r.poster) bits.push(`poster: ${JSON.stringify(r.poster)}`);
      return `  ${JSON.stringify(r.key)}: { ${bits.join(", ")} },`;
    })
    .join("\n");
  fs.writeFileSync(REG, src.slice(0, at) + block + "\n" + src.slice(at));
  return rows.length;
}

const q = (s) => `'${String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

function writeList(id, name, tagline, kind, entries) {
  const decade = (y) => (y ? Math.floor(Number(y) / 10) * 10 : 0);
  const decades = [...new Set(entries.map((e) => decade(e.year)))]
    .filter(Boolean)
    .sort((a, b) => a - b);

  const tierOf = (i, n) =>
    i < n * 0.2 ? "essential" : i < n * 0.6 ? "recommended" : "optional";

  const items = entries
    .map((e, i) => {
      const d = decade(e.year);
      return (
        `  { w: ${i + 1}, film: ${q(e.key)}, type: ${q(e.type || "film")}, ` +
        `saga: ${q(d ? `d${d}` : "dna")}, phase: ${Math.floor(i / 25) + 1}, ` +
        `chrono: ${e.year || 0}, cLabel: ${q(e.year || "-")}, rel: ${q(tierOf(i, entries.length))} },`
      );
    })
    .join("\n");

  const phases = [...new Set(entries.map((_, i) => Math.floor(i / 25) + 1))]
    .map(
      (p) =>
        `  ${p}: { label: ${q(`${(p - 1) * 25 + 1} – ${p * 25}`)}, sub: '' },`,
    )
    .join("\n");

  const blocks = [...new Set(entries.map((_, i) => Math.floor(i / 25) + 1))]
    .map((p) => `  { max: ${p * 25}, phase: ${p} },`)
    .join("\n");

  const sagas =
    decades
      .map((d) => `  d${d}: { label: ${q(`${d}s`)}, range: '' },`)
      .join("\n") + "\n  dna: { label: 'Undated', range: '' },";

  const eras =
    decades
      .map(
        (d) =>
          `  { max: ${d + 10}, key: ${q(`d${d}`)}, title: ${q(`${d}s`)}, sub: '' },`,
      )
      .join("\n") + `\n  { max: 9999, key: 'dna', title: 'Undated', sub: '' },`;

  const typeMeta =
    kind === "showlist"
      ? `  'show': { label: 'Series', short: 'SERIES', color: '#6a9ee8' },`
      : `  'film': { label: 'Film', short: 'FILM', color: '#c2453f' },`;

  const src = `/* ============================================================
   ${name.toUpperCase()} - generated by build/import-list.js.
   ============================================================ */

(() => {

const ITEMS = [
${items}
];

const TYPE_META = {
${typeMeta}
};

const REL_META = {
  essential:   { label: 'Top tier',    rank: 0, color: '#e3a83b', blurb: 'The short version of this list.' },
  recommended: { label: 'Recommended', rank: 1, color: '#c2453f', blurb: 'Worth your time.' },
  optional:    { label: 'Also here',   rank: 2, color: '#4ea8f2', blurb: 'Rounds the list out.' },
};

const SAGA_META = {
${sagas}
};

const PHASE_META = {
${phases}
};

const WATCH_BLOCKS = [
${blocks}
];

const ERAS = [
${eras}
];

const POSTERS = {};   // posters live in _films.js

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
  fs.writeFileSync(path.join(DATA, `${id}.js`), src);
}

function registerList(id, name, tagline, kind, cover, count) {
  const file = path.join(DATA, "universes.js");
  const src = fs.readFileSync(file, "utf8");
  if (new RegExp(`id: "${id}"`).test(src)) {
    console.log(`  "${name}" is already in the registry`);
    return;
  }
  const entry = `  {
    id: ${JSON.stringify(id)},
    page: {
      eyebrow: ${JSON.stringify(name)},
      h1a: ${JSON.stringify(name.split(" ").slice(0, 2).join(" "))},
      h1b: ${JSON.stringify(name.split(" ").slice(2).join(" ") || "list")},
      lede: ${JSON.stringify(`${tagline}. Position in the list drives the tier, so the top is the short version.`)},
      desc: ${JSON.stringify(`${name} - ${tagline}.`)},
      footer: ${JSON.stringify(`${count} titles - progress stored locally`)},
      filterLabel: "Decade",
      sortLabels: {
        watch: "List order",
        release: "Release date",
        chrono: "Year",
        relevance: "Tier",
      },
    },
    kind: ${JSON.stringify(kind)},
    addedAt: ${JSON.stringify(new Date().toISOString())},
    cover: ${JSON.stringify(cover || "")},
    name: ${JSON.stringify(name)},
    tagline: ${JSON.stringify(tagline)},
    href: ${JSON.stringify(pagePath(kind, id))},
    accent: "#e3a83b",
    accent2: "#6b4a12",
  },
];`;
  fs.writeFileSync(file, src.replace(/\];\s*$/, entry + "\n"));
}

(async () => {
  const id = arg("id");
  const kind = arg("kind", "list");
  if (!id) {
    console.error("  --id is required");
    process.exit(1);
  }

  const source = has("top-rated")
    ? await fromTopRated(Number(arg("limit", 250)))
    : fromFile(process.argv[2], arg("section", 1));

  const name = arg("name", source.name);
  const tagline = arg("tagline", `${source.entries.length} titles`);
  console.log(`${source.entries.length} titles for "${name}"\n`);

  const needLookup = source.entries.filter((e) => !e.year);
  if (needLookup.length) {
    process.stdout.write(
      `  resolving ${needLookup.length} titles on Wikipedia... `,
    );
    const found = await resolve(
      needLookup.map((e) => e.title),
      kind,
    );
    needLookup.forEach((e) => {
      const hit = found.get(e.title);
      if (hit) {
        e.year = hit.year;
        e.poster = e.poster || hit.poster;
      }
    });
    console.log(`${found.size} resolved`);
  }

  const registry = loadRegistry();
  const missing = [];
  const seen = new Set();

  const defaultType =
    kind === "showlist" || kind === "animelist" ? "show" : "film";
  source.entries.forEach((e) => {
    e.type = e.type || defaultType;
    e.key = keyFor(e.title, e.year);
    if (registry[e.key] || seen.has(e.key)) return;
    seen.add(e.key);
    missing.push({
      key: e.key,
      title: e.title,
      release: e.year ? `${e.year}-01-01` : "",
      type: e.type === "show" ? "tv" : "film",
      score: e.score,
      poster: e.poster,
    });
  });

  const added = appendRegistry(missing);
  writeList(id, name, tagline, kind, source.entries);
  const cover = source.entries.find(
    (e) => e.poster || (registry[e.key] || {}).poster,
  );
  registerList(
    id,
    name,
    tagline,
    kind,
    cover ? cover.poster || registry[cover.key].poster : "",
    source.entries.length,
  );

  const noYear = source.entries.filter((e) => !e.year).map((e) => e.title);
  console.log(
    `\n  ${added} new registry entries, ${source.entries.length - added} already known`,
  );
  if (noYear.length) console.log(`  no year found for: ${noYear.join(", ")}`);
  console.log("\n  Run `npm run build`.");
})();
