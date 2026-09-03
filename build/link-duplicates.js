#!/usr/bin/env node
/* ============================================================
   LINK DUPLICATES - finds titles that appear in more than one
   catalogue and gives them a shared `link` id, so ticking one
   ticks them all and they count once in the totals.

     node build/link-duplicates.js          report only
     node build/link-duplicates.js --write  apply the links

   Run this after adding any universe.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const DATA = path.join(__dirname, "..", "assets/js/data");
const WRITE = process.argv.includes("--write");

const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of fs.readdirSync(DATA)) {
  if (f === "universes.js") continue;
  vm.runInContext(fs.readFileSync(path.join(DATA, f), "utf8"), ctx);
}
const cats = ctx.window.CATALOGUES;

const norm = (t) =>
  t
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/^(the|a|an)\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/* group by release year, then by normalised title */
const byYear = {};
for (const [uni, c] of Object.entries(cats)) {
  for (const it of c.items) {
    const y = it.release.slice(0, 4);
    (byYear[y] ||= []).push({ uni, it, n: norm(it.title) });
  }
}

const groups = [];
for (const list of Object.values(byYear)) {
  const used = new Set();
  list.forEach((a, i) => {
    if (used.has(i)) return;
    const grp = [a];
    used.add(i);
    for (let j = i + 1; j < list.length; j++) {
      if (used.has(j)) continue;
      const b = list[j];
      const same =
        a.n === b.n ||
        (a.n.length > 7 && b.n.includes(a.n)) ||
        (b.n.length > 7 && a.n.includes(b.n));
      if (same) {
        grp.push(b);
        used.add(j);
      }
    }
    if (new Set(grp.map((g) => g.uni)).size > 1) groups.push(grp);
  });
}

let needed = 0;
const edits = {};
for (const grp of groups) {
  const existing = grp.map((g) => g.it.link).filter(Boolean);
  const slug =
    existing[0] ||
    norm(
      grp.map((g) => g.it.title).sort((x, y) => x.length - y.length)[0],
    ).replace(/\s+/g, "-") +
      "-" +
      grp[0].it.release.slice(0, 4);
  const missing = grp.filter((g) => g.it.link !== slug);
  if (!missing.length) continue;
  needed += missing.length;
  console.log(
    `${grp[0].it.title} (${grp[0].it.release.slice(0, 4)}) -> ${slug}`,
  );
  for (const g of missing) {
    console.log(`   ${g.it.link ? "relink" : "  add "} ${g.uni}/${g.it.id}`);
    (edits[g.uni] ||= []).push({ id: g.it.id, slug, had: g.it.link });
  }
}

if (!needed) {
  console.log("every cross-list duplicate is already linked.");
  process.exit(0);
}
console.log(`\n${needed} entr${needed === 1 ? "y" : "ies"} need linking.`);

if (!WRITE) {
  console.log("re-run with --write to apply.");
  process.exit(0);
}

for (const [uni, list] of Object.entries(edits)) {
  const p = path.join(DATA, `${uni}.js`);
  let src = fs.readFileSync(p, "utf8");
  for (const { id, slug, had } of list) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (had) {
      src = src.replace(
        new RegExp(`(\\{ w: [\\d.]+, id: '${esc}', )link: '[^']*',`),
        `$1link: '${slug}',`,
      );
    } else {
      src = src.replace(
        new RegExp(`(\\{ w: [\\d.]+, id: '${esc}',)(?! link:)`),
        `$1 link: '${slug}',`,
      );
    }
  }
  fs.writeFileSync(p, src);
  console.log(`updated ${uni}.js`);
}
