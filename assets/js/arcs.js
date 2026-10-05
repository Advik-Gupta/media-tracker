/* Arcs - named story runs inside a long anime that has no real seasons.
   Ranges are absolute episode numbers across the whole series, so
   "Wano 892-1085" means the 892nd to 1085th episode in order. Stored per
   show in this browser (and synced like everything else with mediavault.*).
   Arcs show as dividers inside the episode grid; the editor sits below it. */

const Arcs = (() => {
  const KEY = "mediavault.arcs";
  const VIEW_KEY = "mediavault.arcsview";
  let host = { uni: null, rerender: null };
  let planCache = new WeakMap();

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  const newId = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch {
      return {};
    }
  }
  const forShow = (id) => {
    const arcs = readAll()[id] || [];
    return arcs.slice().sort((a, b) => a.from - b.from);
  };
  function saveForShow(id, arcs) {
    const all = readAll();
    all[id] = arcs;
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {}
    planCache = new WeakMap();
    if (typeof Store !== "undefined") Store.touch();
  }

  function enabled() {
    try {
      return localStorage.getItem(VIEW_KEY) !== "off";
    } catch {
      return true;
    }
  }
  function toggle() {
    try {
      localStorage.setItem(VIEW_KEY, enabled() ? "off" : "on");
    } catch {}
    return enabled();
  }

  /* Absolute episode order across every season, as [{season, episode, title}]. */
  function flatten(show) {
    const out = [];
    (show.seasons || []).forEach((se) =>
      se.episodes.forEach((ep) => out.push({ season: se.n, episode: ep.n, title: ep.t })),
    );
    return out;
  }

  /* Map "season x episode" -> arcs starting on that episode. Cached per render. */
  function plan(show) {
    if (planCache.has(show)) return planCache.get(show);
    const flat = flatten(show);
    const map = new Map();
    for (const arc of forShow(show.id)) {
      const ep = flat[arc.from - 1];
      if (!ep) continue;
      const k = `${ep.season}x${ep.episode}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(arc);
    }
    planCache.set(show, map);
    return map;
  }

  function progress(show, arc, flat) {
    const uni = host.uni;
    const all = (typeof Store !== "undefined" && Store.exportAll()) || {};
    const bucket = all[uni] || {};
    const filler = all[`__filler_${uni}`] || {};
    let done = 0;
    let total = 0;
    for (let i = arc.from; i <= Math.min(arc.to, flat.length); i++) {
      const ep = flat[i - 1];
      const key = `e${show.id}-${ep.season}x${ep.episode}`;
      if (filler[key]) continue;
      total++;
      if (bucket[key]) done++;
    }
    return { done, total, pct: total ? (done / total) * 100 : 0 };
  }

  function markRange(show, arc, flat, value) {
    const refs = [];
    for (let i = arc.from; i <= Math.min(arc.to, flat.length); i++) {
      const ep = flat[i - 1];
      refs.push([host.uni, `e${show.id}-${ep.season}x${ep.episode}`]);
    }
    Store.setRefs(refs, value);
  }

  /* Divider row placed before the episode where an arc starts. */
  function divider(show, arc, flat) {
    const p = progress(show, arc, flat);
    const complete = p.total > 0 && p.done >= p.total;
    const span = arc.to - arc.from + 1;
    return `
      <div class="arc-divider${complete ? " done" : ""}" style="grid-column: 1 / -1" data-arc-id="${esc(arc.id)}">
        <div class="arc-divider-main">
          <span class="arc-range">Ep ${arc.from}–${arc.to} · ${span} ep</span>
          <h3>${esc(arc.name)}</h3>
          ${arc.desc ? `<p class="arc-desc">${esc(arc.desc)}</p>` : ""}
        </div>
        <div class="arc-divider-side">
          <span class="arc-count">${p.done} / ${p.total}</span>
          <span class="arc-bar"><i style="width:${p.pct.toFixed(1)}%"></i></span>
          <button class="btn btn-ghost sm" data-arc-action="${complete ? "unmark" : "mark"}" data-arc-id="${esc(arc.id)}">${complete ? "Unmark" : "Mark all"}</button>
        </div>
      </div>`;
  }

  /* Called by series.js for every episode tile; returns dividers that start here. */
  function before(show, seasonN, epN) {
    if (!enabled()) return "";
    const arcs = plan(show).get(`${seasonN}x${epN}`);
    if (!arcs) return "";
    const flat = flatten(show);
    return arcs.map((arc) => divider(show, arc, flat)).join("");
  }

  /* Editor below the episode list. */
  function renderManager(show) {
    const root = document.getElementById("arcsRoot");
    if (!root || !show) return;
    root.hidden = !enabled();
    if (!enabled()) {
      root.innerHTML = "";
      return;
    }
    const flat = flatten(show);
    const arcs = forShow(show.id);

    root.innerHTML = `
      <section class="arcs" aria-label="Arcs">
        <div class="arcs-head">
          <div>
            <h2>Arcs <span class="arcs-n">${arcs.length}</span></h2>
            <p class="arcs-sub">Story runs by absolute episode number. They show as dividers in the list above.</p>
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
            ? `<ul class="arcs-list">${arcs
                .map((arc) => {
                  const p = progress(show, arc, flat);
                  const span = arc.to - arc.from + 1;
                  return `
                  <li class="arc-row" data-arc-id="${esc(arc.id)}">
                    <span class="arc-range">Ep ${arc.from}–${arc.to} · ${span} ep</span>
                    <b>${esc(arc.name)}</b>
                    <span class="arc-count">${p.done} / ${p.total} watched</span>
                    <button class="btn btn-ghost sm" data-arc-action="remove" data-arc-id="${esc(arc.id)}">Remove</button>
                  </li>`;
                })
                .join("")}</ul>`
            : `<p class="arcs-empty">No arcs yet. Add one, or paste a whole list from a wiki page.</p>`
        }
      </section>`;

    bind(root, show);
  }

  function bind(root, show) {
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
      saveForShow(show.id, forShow(show.id).concat({
        id: newId(),
        name: String(fd.get("name")).trim(),
        from,
        to,
        desc: String(fd.get("desc") || "").trim(),
      }));
      host.rerender && host.rerender();
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
      host.rerender && host.rerender();
    });

    root.querySelectorAll('[data-arc-action="remove"]').forEach((b) =>
      b.addEventListener("click", () => {
        saveForShow(show.id, forShow(show.id).filter((a) => a.id !== b.dataset.arcId));
        host.rerender && host.rerender();
      }),
    );
  }

  /* Mark / unmark buttons live in the episode grid, so one delegated listener handles them. */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest("[data-arc-action='mark'], [data-arc-action='unmark']");
    if (!btn || !host.show) return;
    const arc = forShow(host.show.id).find((a) => a.id === btn.dataset.arcId);
    if (!arc) return;
    markRange(host.show, arc, flatten(host.show), btn.dataset.arcAction === "mark");
    host.rerender && host.rerender();
  });

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
        id: newId(),
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
    return { id: newId(), name, from, to, desc };
  }

  /* series.js sets the progress bucket, the show, and how to redraw after a change. */
  function setHost(next) {
    host = { ...host, ...next };
  }

  return { before, renderManager, parseLine, parseJson, flatten, enabled, toggle, setHost };
})();
