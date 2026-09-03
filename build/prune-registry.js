#!/usr/bin/env node
/* ============================================================
   Remove film registry entries that no catalogue references.

   A failed or retried import can leave records behind — a list
   written, then rewritten under different keys, leaves the first
   set stranded. Nothing reads them, but they show up in counts
   and in poster sweeps.

     node build/prune-registry.js --dry
     node build/prune-registry.js
   ============================================================ */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const DATA = path.join(__dirname, "..", "assets/js/data");
const REG = path.join(DATA, "_films.js");
const DRY = process.argv.includes("--dry");

const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(REG, "utf8") + ";this.F = FILMS;", ctx);
for (const f of fs.readdirSync(DATA)) {
  if (f === "universes.js" || f === "countries.js" || f.startsWith("_") || f === "series") continue;
  try { vm.runInContext(fs.readFileSync(path.join(DATA, f), "utf8"), ctx); } catch (e) {}
}

const used = new Set();
for (const cat of Object.values(ctx.window.CATALOGUES || {})) {
  (cat.items || []).forEach((it) => { if (it.film) used.add(it.film); });
}

/* A series page renders its films straight from the episode data, so those
   keys are in use even when no catalogue lists them. */
const SERIES_DIR = path.join(DATA, "series");
if (fs.existsSync(SERIES_DIR)) {
  const sctx = { window: {}, console };
  vm.createContext(sctx);
  for (const f of fs.readdirSync(SERIES_DIR)) {
    if (!f.endsWith(".js") || f.startsWith("_")) continue;
    try { vm.runInContext(fs.readFileSync(path.join(SERIES_DIR, f), "utf8"), sctx); } catch (e) {}
  }
  for (const d of Object.values(sctx.window.SERIES || {})) {
    (d.films || []).forEach((f) => { if (f.film) used.add(f.film); });
  }
}

const orphans = Object.keys(ctx.F).filter((k) => !used.has(k));
console.log(`${Object.keys(ctx.F).length} entries, ${used.size} referenced, ${orphans.length} orphaned`);
if (!orphans.length || DRY) {
  orphans.slice(0, 20).forEach((k) => console.log("  -", k, "-", ctx.F[k].title));
  if (orphans.length > 20) console.log(`  ... and ${orphans.length - 20} more`);
  process.exit(0);
}

const lines = fs.readFileSync(REG, "utf8").split("\n");
const out = [];
const drop = new Set(orphans);
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^  "([^"]+)": \{/);
  if (!m || !drop.has(m[1])) { out.push(lines[i]); continue; }
  /* skip the whole record, single-line or expanded */
  if (/\},\s*$/.test(lines[i])) continue;
  while (i < lines.length && !/^  \},?\s*$/.test(lines[i])) i += 1;
}
fs.writeFileSync(REG, out.join("\n"));
console.log(`removed ${orphans.length} orphaned entries`);
