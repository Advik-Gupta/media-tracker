#!/usr/bin/env node
/* ============================================================
   Merge a sweep TSV (key<TAB>posterURL) into the film registry.

   The registry is written by build/centralise.js and then run
   through the project formatter, so entries are multi-line with
   double-quoted keys. This walks the file line by line rather
   than pattern-matching a one-line shape, which silently matched
   nothing after the reformat.
   ============================================================ */
const fs = require("fs");
const path = require("path");

const tsv = process.argv[2];
if (!tsv || !fs.existsSync(tsv)) {
  console.error("usage: node build/apply-sweep.js <file.tsv>");
  process.exit(1);
}

const posters = new Map();
for (const line of fs.readFileSync(tsv, "utf8").split("\n")) {
  const [key, url] = line.split("\t");
  if (key && url && url.trim().startsWith("http")) posters.set(key.trim(), url.trim());
}

const P = path.join(__dirname, "..", "assets/js/data/_films.js");
const lines = fs.readFileSync(P, "utf8").split("\n");

const out = [];
let added = 0;
let hadOne = 0;
let unmatched = new Set(posters.keys());

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  out.push(line);

  /* The formatter keeps short entries on one line and expands longer ones,
     so both shapes have to be handled. */
  const inline = line.match(/^  "([^"]+)": \{(.*)\},\s*$/);
  if (inline && posters.has(inline[1])) {
    unmatched.delete(inline[1]);
    if (/\bposter:/.test(inline[2])) { hadOne += 1; continue; }
    const url = posters.get(inline[1]).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const body = inline[2].replace(/[\s,]*$/, "");
    out[out.length - 1] = `  "${inline[1]}": {${body}, poster: "${url}" },`;
    added += 1;
    continue;
  }

  const m = line.match(/^  "([^"]+)": \{\s*$/);
  if (!m) continue;
  const key = m[1];
  if (!posters.has(key)) continue;
  unmatched.delete(key);

  /* Find this entry's closing brace, and leave it alone if it already has
     a poster - a sweep must never overwrite a good URL. */
  let end = i + 1;
  let body = [];
  while (end < lines.length && !/^  \},?\s*$/.test(lines[end])) {
    body.push(lines[end]);
    end += 1;
  }
  if (body.some((l) => /^\s*poster:/.test(l))) { hadOne += 1; continue; }

  const url = posters.get(key).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  /* Emit the rest of the entry now, then the new field, so the poster lands
     just before the closing brace. */
  for (const l of body) out.push(l);
  out.push(`    poster: "${url}",`);
  added += 1;
  i = end - 1;
}

fs.writeFileSync(P, out.join("\n"));
console.log(
  `added ${added} poster(s)` +
  (hadOne ? `, ${hadOne} already had one` : "") +
  (unmatched.size ? `, ${unmatched.size} key(s) not in the registry` : ""),
);
