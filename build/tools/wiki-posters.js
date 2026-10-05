#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const REG = path.join(ROOT, "assets/js/data/_films.js");
const API = "https://en.wikipedia.org/w/api.php";

const UA = "MediaVault/1.0 (personal media tracker) node-fetch";

const BATCH = 50;
const PAUSE = 400;

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const LIMIT = Number(arg("--limit", 0)) || Infinity;

const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(REG, "utf8") + ";this.F = FILMS;", ctx);

const pending = new Map(
  Object.entries(ctx.F)
    .filter(([, f]) => !f.poster && f.title)
    .slice(0, LIMIT),
);

process.stderr.write(`${pending.size} entries without a poster\n`);

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

function uploadUrl(file) {
  let name = file
    .trim()
    .replace(/^(File|Image)\s*:/i, "")
    .replace(/\s+/g, "_");
  name = name.charAt(0).toUpperCase() + name.slice(1);
  if (!/\.(jpe?g|png|gif|webp|svg)$/i.test(name)) return null;
  const h = crypto.createHash("md5").update(name).digest("hex");
  return `https://upload.wikimedia.org/wikipedia/en/${h[0]}/${h.slice(0, 2)}/${encodeURIComponent(name)}`;
}

function infoboxImage(wikitext) {
  const m = wikitext.match(/\|\s*image\s*=\s*([^\n|}<]+)/i);
  if (!m) return null;
  const raw = m[1].trim().replace(/^\[\[|\]\]$/g, "").split("|")[0];
  return raw ? uploadUrl(raw) : null;
}

const FILMY = /\b(film|movie|documentary|anime|animated)\b/i;

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
    if (!data || !data.query)
      continue;

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

      if (!round.explicit && !FILMY.test(page.description || ""))
        continue;
      if (!/infobox\s+film/i.test(wikitext))
        continue;

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
