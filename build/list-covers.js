#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "assets/js/data");
const ALL = process.argv.includes("--all");

const uctx = { window: {}, console };
vm.createContext(uctx);
vm.runInContext(
  fs.readFileSync(path.join(DATA, "universes.js"), "utf8") + ";this.U = UNIVERSES;",
  uctx,
);

const cctx = { window: {}, console };
vm.createContext(cctx);
vm.runInContext(fs.readFileSync(path.join(DATA, "_films.js"), "utf8") + ";this.F = FILMS;", cctx);
for (const f of fs.readdirSync(DATA)) {
  if (f === "universes.js" || f === "countries.js" || f.startsWith("_") || f === "series") continue;
  try { vm.runInContext(fs.readFileSync(path.join(DATA, f), "utf8"), cctx); } catch (e) {}
}

const FILMS = cctx.F;
const CATS = cctx.window.CATALOGUES || {};

function coverFor(id) {
  const cat = CATS[id];
  if (!cat || !cat.items) return null;

  for (const it of cat.items) {
    if (it.alias) continue;
    const own = it.poster || (cat.posters && cat.posters[it.id]);
    if (own && /^https?:\/\//.test(own)) return own;
    const f = it.film && FILMS[it.film];
    if (f && f.poster) return f.poster;
  }
  return null;
}

const file = path.join(DATA, "universes.js");
let src = fs.readFileSync(file, "utf8");
let done = 0;
let skipped = 0;

for (const u of uctx.U) {
  if (u.kind !== "list") continue;
  if (u.cover && !ALL) continue;

  const cover = coverFor(u.id);
  if (!cover)
    { console.log(`  ! no poster to borrow for ${u.id}`); continue; }

  const at = src.indexOf(`id: "${u.id}"`);
  if (at === -1) { skipped += 1; continue; }
  const end = src.indexOf("\n  },", at);
  const block = src.slice(at, end);

  let next;
  if (/\n\s*cover:/.test(block)) {
    next = block.replace(/\n(\s*)cover:\s*(?:"[^"]*"|[^,\n]*),/, `\n$1cover: ${JSON.stringify(cover)},`);
  } else {
    next = block.replace(/\n(\s*)name:/, `\n$1cover: ${JSON.stringify(cover)},\n$1name:`);
  }
  if (next === block) { skipped += 1; continue; }

  src = src.slice(0, at) + next + src.slice(end);
  done += 1;
  console.log(`  ${u.id.padEnd(14)} ${cover.slice(0, 72)}`);
}

fs.writeFileSync(file, src);
console.log(`\n${done} cover(s) set${skipped ? `, ${skipped} could not be placed` : ""}`);
