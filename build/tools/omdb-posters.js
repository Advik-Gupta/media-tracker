#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const KEY = process.env.OMDB_KEY || process.argv.find((a) => /^[0-9a-f]{6,12}$/i.test(a));
if (!KEY) {
  console.error('No OMDb key. Pass it as an argument or set OMDB_KEY.');
  process.exit(1);
}
const DRY = process.argv.includes('--dry');
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;

const DATA = path.join(__dirname, '..', 'assets/js/data');
const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of fs.readdirSync(DATA)) {
  if (f !== 'universes.js') vm.runInContext(fs.readFileSync(path.join(DATA, f), 'utf8'), ctx);
}
const cats = ctx.window.CATALOGUES;

const gaps = [];
for (const [uni, cat] of Object.entries(cats)) {
  for (const it of cat.items) {
    if (!cat.posters[it.id]) {
      gaps.push({ uni, id: it.id, title: it.title, year: it.release.slice(0, 4), type: it.eps ? 'series' : 'movie' });
    }
  }
}
console.log(`${gaps.length} entries without a poster\n`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function lookup({ title, year, type }) {
  const tries = [
    { t: title, y: year, type },
    { t: title, y: year },
    { t: title },
  ];
  for (const params of tries) {
    const qs = new URLSearchParams({ apikey: KEY, ...params });
    try {
      const res = await fetch(`https://www.omdbapi.com/?${qs}`);
      const d = await res.json();
      if (d && d.Response !== 'False' && d.Poster && d.Poster !== 'N/A') return d.Poster;
    } catch (e) {}
    await sleep(120);
  }
  const qs = new URLSearchParams({ apikey: KEY, s: title });
  try {
    const res = await fetch(`https://www.omdbapi.com/?${qs}`);
    const d = await res.json();
    const hit = (d.Search || []).find((x) => x.Poster && x.Poster !== 'N/A');
    if (hit) return hit.Poster;
  } catch (e) {}
  return null;
}

(async () => {
  const found = {};
  let n = 0, hits = 0;
  for (const g of gaps) {
    if (n >= LIMIT) { console.log(`\nstopped at --limit=${LIMIT}`); break; }
    n += 1;
    const url = await lookup(g);
    if (url) { (found[g.uni] ||= {})[g.id] = url; hits += 1; }
    process.stdout.write(`\r  ${n}/${Math.min(gaps.length, LIMIT)}  found ${hits}   `);
    await sleep(150);
  }
  console.log(`\n\n${hits} poster(s) found.`);
  if (DRY) { console.log('--dry: nothing written.'); return; }

  let written = 0;
  for (const [uni, map] of Object.entries(found)) {
    const p = path.join(DATA, `${uni}.js`);
    let s = fs.readFileSync(p, 'utf8');
    for (const [id, url] of Object.entries(map)) {
      const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`'${esc}':`).test(s)) continue;
      s = s.replace('const POSTERS = {\n', `const POSTERS = {\n  '${id}': '${url}',\n`);
      written += 1;
    }
    fs.writeFileSync(p, s);
    console.log(`  ${uni.padEnd(12)} +${Object.keys(map).length}`);
  }
  console.log(`\nwrote ${written} poster URL(s). Now run: npm run build`);
})();
