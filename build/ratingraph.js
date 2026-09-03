#!/usr/bin/env node
/* ============================================================
   RATINGRAPH — genres, ratings and credits for the catalogue.

     npm run rg           fill in whatever is missing
     npm run rg -- --all  refetch everything
     npm run rg -- --limit 50

   Two requests per title: the search endpoint resolves a name to
   a page, and that page carries JSON-LD with the genre list, the
   aggregate rating, the director and a synopsis.

   The search endpoint sends CORS headers, so the browser can call
   it directly — that is what the My List search uses. The detail
   page does not, which is why this runs here instead.

   Progress is cached in build/.rg-cache.json, so a re-run costs
   nothing for titles already done and an interrupted run resumes.
   ============================================================ */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "assets/js/data");
const REG = path.join(DATA, "_films.js");
const CACHE = path.join(__dirname, ".rg-cache.json");
const SITE = "https://www.ratingraph.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 media-vault";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const has = (n) => process.argv.includes(`--${n}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* The synopsis comes back HTML-escaped — &#039; and &quot; and friends. */
const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…",
  mdash: "—", ndash: "–", rsquo: "\u2019", lsquo: "\u2018",
  ldquo: "\u201c", rdquo: "\u201d",
};
function decode(text) {
  if (!text) return text;
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .trim();
}

async function get(url, asJson) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.status === 429) { await sleep(4000 * (attempt + 1)); continue; }
      if (!r.ok) return null;
      return asJson ? r.json() : r.text();
    } catch (e) {
      await sleep(1000 * (attempt + 1));
    }
  }
  return null;
}

/* ---------- matching ---------- */

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/^(the|a|an)\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Prefer an exact title match, then the closest year. */
function pick(results, title, year, wantSeries) {
  if (!results || !results.length) return null;

  const kind = (r) => (r.toplist === "movie" ? "movie" : "series");
  const sameKind = results.filter((r) =>
    wantSeries ? kind(r) === "series" : kind(r) === "movie",
  );
  const pool = sameKind.length ? sameKind : results;

  const exact = pool.filter((r) => norm(r.name) === norm(title));
  const candidates = exact.length ? exact : pool;

  if (!year) return candidates[0];

  return candidates.reduce((best, r) => {
    const d = Math.abs(Number(r.start || 0) - Number(year));
    const bd = Math.abs(Number(best.start || 0) - Number(year));
    return d < bd ? r : best;
  }, candidates[0]);
}

/** The JSON-LD block on a title page is the whole payload we need. */
function parseDetail(html) {
  if (!html) return null;
  const blocks = [...html.matchAll(
    /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g,
  )];

  for (const b of blocks) {
    let parsed;
    try { parsed = JSON.parse(b[1]); } catch (e) { continue; }
    const list = Array.isArray(parsed) ? parsed : [parsed];
    for (const d of list) {
      if (!d || typeof d !== "object") continue;
      if (!/Movie|TVSeries|CreativeWork/.test(d["@type"] || "")) continue;

      const agg = d.aggregateRating || {};
      const person = (p) => (Array.isArray(p) ? p[0] : p) || null;

      return {
        genres: Array.isArray(d.genre) ? d.genre : d.genre ? [d.genre] : [],
        rating: agg.ratingValue ? Number(agg.ratingValue) : null,
        votes: agg.ratingCount ? Number(agg.ratingCount) : null,
        director: person(d.director) ? decode(person(d.director).name) : null,
        writer: person(d.author) ? decode(person(d.author).name) : null,
        language: d.inLanguage || null,
        year: d.dateCreated ? String(d.dateCreated).slice(0, 4) : null,
        synopsis: decode(d.description) || null,
        image: d.image || null,
      };
    }
  }
  return null;
}

/* ---------- registry ---------- */

function loadRegistry() {
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(REG, "utf8") + ";this.F = FILMS;", ctx);
  return ctx.F;
}

/** Merge fields into an existing record, in place, without reformatting it. */
function writeBack(updates, force) {
  let src = fs.readFileSync(REG, "utf8");
  let done = 0;

  for (const [key, extra] of Object.entries(updates)) {
    const at = src.indexOf(`"${key}":`);
    if (at === -1) continue;

    /* find this record's closing brace */
    const open = src.indexOf("{", at);
    let depth = 0;
    let end = open;
    for (let i = open; i < src.length; i++) {
      if (src[i] === "{") depth += 1;
      else if (src[i] === "}") {
        depth -= 1;
        if (depth === 0) { end = i; break; }
      }
    }

    let body = src.slice(open + 1, end).trimEnd().replace(/,\s*$/, "");
    for (const [k, v] of Object.entries(extra)) {
      if (v == null || (Array.isArray(v) && !v.length)) continue;
      const existing = new RegExp(`,?\\s*\\b${k}: (?:"(?:[^"\\\\]|\\\\.)*"|\\[[^\\]]*\\]|[^,}]+)`);
      if (existing.test(body)) {
        if (!force) continue;
        body = body.replace(existing, "");
      }
      body += `, ${k}: ${JSON.stringify(v)}`;
    }

    src = src.slice(0, open + 1) + body + " " + src.slice(end);
    done += 1;
  }

  fs.writeFileSync(REG, src);
  return done;
}

/* ---------- run ---------- */

(async () => {
  const films = loadRegistry();
  const cache = fs.existsSync(CACHE)
    ? JSON.parse(fs.readFileSync(CACHE, "utf8"))
    : {};

  const all = Object.entries(films);
  const todo = all.filter(([key, f]) => {
    if (has("all")) return true;
    if (cache[key]) return false;
    return !f.genres;
  });

  const limit = Number(arg("limit", todo.length));
  const batch = todo.slice(0, limit);

  console.log(`${all.length} in the registry, ${todo.length} to look up`);
  if (limit < todo.length) console.log(`  doing ${limit} this run\n`);

  let found = 0;
  let missed = 0;
  const updates = {};

  for (let i = 0; i < batch.length; i++) {
    const [key, f] = batch[i];
    const year = f.release ? f.release.slice(0, 4) : "";
    const wantSeries = f.type === "tv" || f.type === "show" || f.type === "season";

    const search = await get(
      `${SITE}/search-items/${encodeURIComponent(f.title)}/`,
      true,
    );
    await sleep(250);

    const results = search && search.items && search.items[0] && search.items[0].results;
    const hit = pick(results, f.title, year, wantSeries);

    if (!hit) {
      cache[key] = { missing: true };
      missed += 1;
    } else {
      const detail = parseDetail(await get(SITE + hit.path, false));
      await sleep(250);

      if (detail) {
        const row = {
          genres: detail.genres,
          rgRating: detail.rating,
          rgVotes: detail.votes,
          director: detail.director,
          language: detail.language,
          synopsis: detail.synopsis ? detail.synopsis.slice(0, 400) : null,
        };
        updates[key] = row;
        cache[key] = row;
        found += 1;
      } else {
        cache[key] = { missing: true };
        missed += 1;
      }
    }

    if ((i + 1) % 25 === 0 || i === batch.length - 1) {
      fs.writeFileSync(CACHE, JSON.stringify(cache));
      process.stdout.write(
        `\r  ${i + 1}/${batch.length}  found ${found}  missed ${missed}`,
      );
    }
  }

  process.stdout.write("\n");
  const written = writeBack(updates, has("all"));
  console.log(`\n  ${written} records enriched`);
  console.log("  Run `npm run build`.");
})();
