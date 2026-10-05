/* Arcs - named story runs inside a long anime that has no real seasons.
   Ranges are absolute episode numbers across the whole series, so
   "Wano 892-1085" means the 892nd to 1085th episode in order. Stored per
   show in this browser (and synced like everything else with mediavault.*). */

const Arcs = (() => {
  const KEY = "mediavault.arcs";
  let lastShow = null;
  let lastUni = null;

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch {
      return {};
    }
  }
  function writeAll(all) {
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {}
    if (typeof Store !== "undefined") Store.touch();
  }
  const forShow = (id) => readAll()[id] || [];
  function saveForShow(id, arcs) {
    const all = readAll();
    all[id] = arcs;
    writeAll(all);
  }

  /* Absolute episode order across every season, as [{season, episode, title}]. */
  function flatten(show) {
    const out = [];
    (show.seasons || []).forEach((se) =>
      se.episodes.forEach((ep) => out.push({ season: se.n, episode: ep.n, title: ep.t })),
    );
    return out;
  }

  /* JSON: an array of { name, from, to, desc } (also accepts start/end,
     description, or "episodes": "892-1085"). Returns null if any entry is bad. */
  function parseJson(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return null;
    }
    if (!Array.isArray(data)) return null;
    const out = [];
    for (const raw of data) {
      if (!raw || typeof raw !== "object") return null;
      let from = Number(raw.from ?? raw.start);
      let to = Number(raw.to ?? raw.end);
      if ((!from || !to) && typeof raw.episodes === "string") {
        const m = raw.episodes.match(/(\d+)\s*(?:-|–|—|to)\s*(\d+)/i);
        if (m) [from, to] = [Number(m[1]), Number(m[2])];
      }
      const name = String(raw.name || "").trim();
      if (!name || !(from >= 1 && to >= from)) return null;
      out.push({
        id: `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        name,
        from,
        to,
        desc: String(raw.desc ?? raw.description ?? "").trim(),
      });
    }
    return out;
  }

  /* Accepts "Name 1-24", "Name: 1 - 24 | description", "Name (25–61)". */
  function parseLine(line) {
    const parts = line.split("|").map((s) => s.trim());
    const head = parts[0];
    const desc = parts.slice(1).join(" | ");
    const m = head.match(/(\d+)\s*(?:-|–|—|to)\s*(\d+)/i);
    if (!m) return null;
    const before = head.slice(0, m.index).replace(/[\s:(\[–—-]+$/, "").trim();
    const after = head.slice(m.index + m[0].length).replace(/^[\s)\]:–—-]+/, "").trim();
    const name = before || after;
    if (!name) return null;
    const from = Number(m[1]);
    const to = Number(m[2]);
    if (from < 1 || to < from) return null;
    return { id: `${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name, from, to, desc };
  }

  function progress(show, uni, arc, flat) {
    const bucket = (typeof Store !== "undefined" && Store.exportAll()[uni]) || {};
    const filler = (typeof Store !== "undefined" && Store.exportAll()[`__filler_${uni}`]) || {};
    let done = 0;
    let total = 0;
    for (let i = arc.from; i <= Math.min(arc.to, flat.length); i++) {
      const ep = flat[i - 1];
      if (filler[`e${show.id}-${ep.season}x${ep.episode}`]) continue;
      total++;
      if (bucket[`e${show.id}-${ep.season}x${ep.episode}`]) done++;
    }
    return { done, total, pct: total ? (done / total) * 100 : 0 };
  }

  function markRange(show, uni, arc, flat, value) {
    const refs = [];
    for (let i = arc.from; i <= Math.min(arc.to, flat.length); i++) {
      const ep = flat[i - 1];
      refs.push([uni, `e${show.id}-${ep.season}x${ep.episode}`]);
    }
    Store.setRefs(refs, value);
  }

  function render(show, uni) {
    lastShow = show;
    lastUni = uni;
    const root = document.getElementById("arcsRoot");
    if (!root || !show) return;
    const flat = flatten(show);
    const arcs = forShow(show.id);

    root.innerHTML = `
      <section class="arcs" aria-label="Arcs">
        <div class="arcs-head">
          <div>
            <h2>Arcs</h2>
            <p class="arcs-sub">Story runs by absolute episode number. Paste a list or add one at a time.</p>
          </div>
          <div class="arcs-actions">
            <button class="btn btn-ghost sm" data-arc-toggle="paste">Paste arcs</button>
            <button class="btn btn-accent sm" data-arc-toggle="add">+ Add arc</button>
          </div>
        </div>

        <form class="arcs-form" data-arc-form="add" hidden>
          <label><span>Name</span><input name="name" required maxlength="80" placeholder="Wano Country" /></label>
          <label><span>From ep</span><input name="from" type="number" min="1" required /></label>
          <label><span>To ep</span><input name="to" type="number" min="1" required /></label>
          <label class="arcs-wide"><span>Description</span><textarea name="desc" rows="2" maxlength="400" placeholder="What happens in this arc"></textarea></label>
          <div class="arcs-form-actions">
            <button type="button" class="btn btn-ghost sm" data-arc-toggle="add">Cancel</button>
            <button type="submit" class="btn btn-accent sm">Save arc</button>
          </div>
        </form>

        <div class="arcs-paste" data-arc-form="paste" hidden>
          <textarea rows="6" placeholder="One arc per line:&#10;Romance Dawn 1-3&#10;Orange Town 4-8 | Luffy's first real fight&#10;&#10;or JSON:&#10;[{&quot;name&quot;:&quot;Wano&quot;,&quot;from&quot;:892,&quot;to&quot;:1085,&quot;desc&quot;:&quot;&quot;}]"></textarea>
          <p class="arcs-hint">Lines: <code>Name from-to</code>, optionally <code>| description</code>. Or paste a JSON array of <code>{name, from, to, desc}</code>.</p>
          <div class="arcs-form-actions">
            <button type="button" class="btn btn-ghost sm" data-arc-toggle="paste">Cancel</button>
            <button type="button" class="btn btn-accent sm" data-arc-import>Import</button>
          </div>
          <p class="arcs-error" hidden></p>
        </div>

        ${
          arcs.length
            ? `<div class="arcs-grid">${arcs
                .map((arc) => {
                  const p = progress(show, uni, arc, flat);
                  const first = flat[arc.from - 1];
                  const last = flat[Math.min(arc.to, flat.length) - 1];
                  const span = arc.to - arc.from + 1;
                  return `
                  <article class="arc-card${p.total && p.done >= p.total ? " done" : ""}" data-arc="${esc(arc.id)}">
                    <div class="arc-top">
                      <span class="arc-range">Ep ${arc.from}–${arc.to}</span>
                      <span class="arc-count">${p.done} / ${p.total} watched</span>
                    </div>
                    <h3>${esc(arc.name)}</h3>
                    ${arc.desc ? `<p class="arc-desc">${esc(arc.desc)}</p>` : ""}
                    <p class="arc-meta">${span} episode${span === 1 ? "" : "s"}${first ? ` · ${esc(first.title)}` : ""}${last && last !== first ? ` → ${esc(last.title)}` : ""}</p>
                    <div class="arc-bar"><i style="width:${p.pct.toFixed(1)}%"></i></div>
                    <div class="arc-actions">
                      <button class="btn btn-ghost sm" data-arc-mark="${p.done >= p.total && p.total ? "off" : "on"}">${p.done >= p.total && p.total ? "Unmark all" : "Mark all"}</button>
                      <button class="btn btn-ghost sm" data-arc-remove>Remove</button>
                    </div>
                  </article>`;
                })
                .join("")}</div>`
            : `<p class="arcs-empty">No arcs yet. Add one, or paste a whole list from a wiki page.</p>`
        }
      </section>`;

    bind(root, show, uni, flat);
  }

  function bind(root, show, uni, flat) {
    root.querySelectorAll("[data-arc-toggle]").forEach((b) =>
      b.addEventListener("click", () => {
        const kind = b.dataset.arcToggle;
        root.querySelectorAll("[data-arc-form]").forEach((f) => {
          f.hidden = f.dataset.arcForm === kind ? !f.hidden : true;
        });
      }),
    );

    const addForm = root.querySelector('[data-arc-form="add"]');
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(addForm);
      const from = Number(fd.get("from"));
      const to = Number(fd.get("to"));
      if (!(from >= 1 && to >= from)) return;
      const arcs = forShow(show.id);
      arcs.push({
        id: `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        name: String(fd.get("name")).trim(),
        from,
        to,
        desc: String(fd.get("desc") || "").trim(),
      });
      saveForShow(show.id, arcs);
      render(show, uni);
    });

    const paste = root.querySelector('[data-arc-form="paste"]');
    paste.querySelector("[data-arc-import]").addEventListener("click", () => {
      const text = paste.querySelector("textarea").value.trim();
      const err = paste.querySelector(".arcs-error");
      let parsed;
      if (text.startsWith("[")) {
        parsed = parseJson(text);
        if (!parsed) {
          err.hidden = false;
          err.textContent = 'JSON not recognised. Expected an array like [{"name":"Wano","from":892,"to":1085,"desc":""}]';
          return;
        }
      } else {
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        parsed = lines.map(parseLine);
        const bad = lines.filter((_, i) => !parsed[i]);
        if (bad.length) {
          err.hidden = false;
          err.textContent = `Could not read: ${bad.slice(0, 3).join("; ")}${bad.length > 3 ? "…" : ""}`;
          return;
        }
      }
      if (!parsed.length) return;
      saveForShow(show.id, forShow(show.id).concat(parsed));
      render(show, uni);
    });

    root.querySelectorAll("[data-arc]").forEach((card) => {
      const id = card.dataset.arc;
      const arc = forShow(show.id).find((a) => a.id === id);
      if (!arc) return;
      card.querySelector("[data-arc-mark]").addEventListener("click", (e) => {
        markRange(show, uni, arc, flat, e.currentTarget.dataset.arcMark === "on");
        render(show, uni);
      });
      card.querySelector("[data-arc-remove]").addEventListener("click", () => {
        saveForShow(show.id, forShow(show.id).filter((a) => a.id !== id));
        render(show, uni);
      });
    });
  }

  if (typeof Store !== "undefined" && Store.onChange) {
    Store.onChange(() => {
      if (lastShow && lastUni) render(lastShow, lastUni);
    });
  }

  return { render, parseLine, flatten };
})();
