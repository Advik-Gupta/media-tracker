#!/usr/bin/env node
/* ============================================================
   WIKIPEDIA POSTER SWEEP

   Fills the gaps in the film registry from Wikipedia. No key
   needed, and the poster is right there in every film article's
   infobox.

     node build/wiki-posters.js            > sweep.tsv
     node build/wiki-posters.js --limit 50 > sweep.tsv

   Writes key<TAB>url lines for build/apply-sweep.js to merge
   into assets/js/data/_films.js.

   Two things this has to work around:

   1. The REST summary endpoint returns one article per request
      and rate-limits hard — a first pass at that rate would have
      taken hours and still reported false misses. The action API
      takes fifty titles at once, so the whole sweep is a few
      dozen requests.

   2. `prop=pageimages` skips non-free files, and film posters are
      all non-free, so it returns nothing useful here. The
      filename is in the infobox wikitext instead, and an upload
      URL is derived from its MD5 the way MediaWiki does.
   ============================================================ */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const REG = path.join(ROOT, "assets/js/data/_films.js");
const API = "https://en.wikipedia.org/w/api.php";

/* Wikipedia asks for a descriptive User-Agent; generic ones get throttled. */
const UA = "MediaVault/1.0 (personal media tracker) node-fetch";

const BATCH = 50;
const PAUSE = 400;

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const LIMIT = Number(arg("--limit", 0)) || Infinity;

/* ---------- what still needs one ---------- */

const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(REG, "utf8") + ";this.F = FILMS;", ctx);

const pending = new Map(
  Object.entries(ctx.F)
    .filter(([, f]) => !f.poster && f.title)
    .slice(0, LIMIT),
);

process.stderr.write(`${pending.size} entries without a poster\n`);

/* ---------- helpers ---------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function query(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", ...params })}`;
  for (let attempt = 0; attempt < 5; attempt++) {
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
      await sleep(1500 * (attempt + 1));
    }
  }
  return null;
}

/** MediaWiki stores an upload at /<md5[0]>/<md5[0..1]>/<filename>. */
function uploadUrl(file) {
  let name = file
    .trim()
    .replace(/^(File|Image)\s*:/i, "")
    .replace(/\s+/g, "_");
  /* MediaWiki upper-cases the first character of every filename, and the MD5
     is taken of that canonical form — miss it and the URL 404s. */
  name = name.charAt(0).toUpperCase() + name.slice(1);
  if (!/\.(jpe?g|png|gif|webp|svg)$/i.test(name)) return null;
  const h = crypto.createHash("md5").update(name).digest("hex");
  return `https://upload.wikimedia.org/wikipedia/en/${h[0]}/${h.slice(0, 2)}/${encodeURIComponent(name)}`;
}

/** The poster filename out of a film infobox. */
function infoboxImage(wikitext) {
  const m = wikitext.match(/\|\s*image\s*=\s*([^\n|}<]+)/i);
  if (!m) return null;
  const raw = m[1].trim().replace(/^\[\[|\]\]$/g, "").split("|")[0];
  return raw ? uploadUrl(raw) : null;
}

const FILMY = /\b(film|movie|documentary|anime|animated)\b/i;

/* ---------- rounds ----------
   Most specific title first. A disambiguated title has already proved it is
   a film; a bare one has to say so in its short description, or an ambiguous
   name picks up a person or a place. */

const ROUNDS = [
  { name: "Title (YEAR film)", explicit: true,
    of: (f) => (f.release || "").slice(0, 4) ? `${f.title} (${f.release.slice(0, 4)} film)` : null },
  { name: "Title (film)", explicit: true, of: (f) => `${f.title} (film)` },
  { name: "Title", explicit: false, of: (f) => f.title },
];

const found = new Map();

async function runRound(round) {
  const todo = [...pending.entries()].filter(([k]) => !found.has(k));
  const jobs = [];
  for (const [key, f] of todo) {
    const title = round.of(f);
    if (title) jobs.push({ key, title });
  }
  if (!jobs.length) return;

  let hits = 0;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const slice = jobs.slice(i, i + BATCH);

    /* Titles are matched back case-insensitively: the API normalises them and
       follows redirects, so what comes back is rarely what went out. */
    const wanted = new Map();
    slice.forEach((j) => wanted.set(j.title.toLowerCase(), j.key));

    const data = await query({
      action: "query",
      redirects: "1",
      prop: "revisions|description",
      rvprop: "content",
      rvslots: "main",
      titles: slice.map((j) => j.title).join("|"),
    });
    await sleep(PAUSE);
    if (!data || !data.query) continue;

    /* Rebuild the trail from what was asked for to what was returned. */
    const alias = new Map();
    for (const list of [data.query.normalized, data.query.redirects]) {
      (list || []).forEach((n) => alias.set(n.to.toLowerCase(), n.from.toLowerCase()));
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
      const key = origin(page.title);
      if (!key || found.has(key)) continue;

      const text = (((page.revisions || [])[0] || {}).slots || {}).main;
      const wikitext = (text && text["*"]) || "";
      if (!wikitext) continue;

      if (!round.explicit && !FILMY.test(page.description || "")) continue;
      /* A stub that is not a film article will not carry a film infobox. */
      if (!/infobox\s+film/i.test(wikitext)) continue;

      const url = infoboxImage(wikitext);
      if (!url) continue;

      found.set(key, url);
      hits += 1;
      process.stdout.write(`${key}\t${url}\n`);
    }
  }
  process.stderr.write(
    `  ${round.name.padEnd(18)} +${hits}  (${found.size}/${pending.size} total)\n`,
  );
}

(async () => {
  for (const round of ROUNDS) await runRound(round);
  process.stderr.write(`\ndone: ${found.size} of ${pending.size} found\n`);
})();
