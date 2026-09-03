#!/usr/bin/env node
/* ============================================================
   Applies resolved poster URLs into the list data files.
   Idempotent - safe to run repeatedly as more URLs resolve.

     node build/apply-list-posters.js [path/to/resolved.tsv]

   TSV format:  <universe>\t<itemId>\t<posterUrl>
   ============================================================ */
const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "..", "assets/js/data");
const src = process.argv[2] || path.join(__dirname, "list-posters.tsv");
if (!fs.existsSync(src)) {
  console.error("no TSV at " + src);
  process.exit(1);
}

const byUni = {};
for (const line of fs.readFileSync(src, "utf8").split("\n")) {
  const [uni, id, url] = line.split("\t");
  if (!uni || !id || !url || !url.startsWith("http")) continue;
  (byUni[uni] ||= {})[id] = url.trim();
}

let total = 0;
for (const [uni, map] of Object.entries(byUni)) {
  const p = path.join(DATA, `${uni}.js`);
  if (!fs.existsSync(p)) {
    console.warn(`  ! no ${uni}.js`);
    continue;
  }
  let s = fs.readFileSync(p, "utf8");
  let added = 0;
  for (const [id, url] of Object.entries(map)) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`'${esc}':`).test(s)) continue; // already present
    s = s.replace(
      "const POSTERS = {\n",
      `const POSTERS = {\n  '${id}': '${url}',\n`,
    );
    added += 1;
  }
  if (added) {
    fs.writeFileSync(p, s);
    total += added;
  }
  console.log(`  ${uni.padEnd(10)} +${added}`);
}
console.log(`applied ${total} poster URL(s)`);
