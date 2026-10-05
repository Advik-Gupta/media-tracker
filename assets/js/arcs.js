/* Arcs - named story runs inside a long anime that has no real seasons.
   Ranges are absolute episode numbers across the whole series, so
   "Wano 892-1085" means the 892nd to 1085th episode in order. Stored per
   show in this browser (and synced like everything else with mediavault.*).
   Arcs show as faint lines in the gaps of the episode grid, with a tooltip
   on each tile; the editor opens in a popup from the show header. */

const Arcs = (() => {
  const KEY = "mediavault.arcs";
  const VIEW_KEY = "mediavault.arcsview";
  let host = { uni: null, show: null, rerender: null };
  let mapCache = new WeakMap();
  let decorated = null;

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
  const forShow = (id) =>
    (readAll()[id] || []).slice().sort((a, b) => a.from - b.from);

  function saveForShow(id, arcs) {
    const all = readAll();
    all[id] = arcs;
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {}
    mapCache = new WeakMap();
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

  /* Map "season x episode" -> the arc that covers it. Cached until arcs change. */
  function arcMap(show) {
    if (mapCache.has(show)) return mapCache.get(show);
    const flat = flatten(show);
    const map = new Map();
    for (const arc of forShow(show.id)) {
      for (let i = arc.from; i <= Math.min(arc.to, flat.length); i++) {
        const ep = flat[i - 1];
        const k = `${ep.season}x${ep.episode}`;
        if (!map.has(k)) map.set(k, arc);
      }
    }
    mapCache.set(show, map);
    return map;
  }

  function progress(show, arc, flat) {
    const all = (typeof Store !== "undefined" && Store.exportAll()) || {};
    const bucket = all[host.uni] || {};
    const filler = all[`__filler_${host.uni}`] || {};
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

  /* Stable colour per arc so neighbouring arcs look different. */
  function hueOf(id) {
    let h = 0;
    for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  }

  /* Draws arc boundaries into the episode grids under root. Each tile whose
     neighbour (left, right, above, below) belongs to a different arc gets a
     faint line on that side, sitting in the gap between tiles. Works from
     the real layout, so it follows the grid wrapping at any width. */
  function decorate(root, show) {
    if (!root || !show) return;
    decorated = { root, show };
    root.querySelectorAll(".arc-edge").forEach((n) => n.remove());
    root.querySelectorAll(".ep.arc-m").forEach((t) => {
      t.classList.remove("arc-m");
      t.title = t.dataset.baseTitle || t.title;
    });
    if (!enabled()) return;

    const map = arcMap(show);
    if (!map.size) return;
    const arcOf = (t) => map.get(`${t.dataset.season}x${t.dataset.ep}`) || null;

    root.querySelectorAll(".ep-grid").forEach((grid) => {
      const tiles = Array.from(grid.children).filter(
        (t) => t.classList.contains("ep") && t.offsetParent !== null,
      );
      if (!tiles.length) return;

      // Group tiles into visual rows by their top offset.
      const rows = [];
      tiles
        .slice()
        .sort((a, b) => a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft)
        .forEach((t) => {
          const row = rows[rows.length - 1];
          if (row && Math.abs(row[0].offsetTop - t.offsetTop) < 4) row.push(t);
          else rows.push([t]);
        });
      rows.forEach((r) => r.sort((a, b) => a.offsetLeft - b.offsetLeft));

      const width = tiles[0].offsetWidth || 1;
      const nearest = (row, x) => {
        let best = null;
        let bestD = Infinity;
        for (const t of row) {
          const d = Math.abs(t.offsetLeft - x);
          if (d < bestD && d < width / 2) {
            best = t;
            bestD = d;
          }
        }
        return best;
      };

      rows.forEach((row, ri) => {
        row.forEach((t, ci) => {
          const arc = arcOf(t);
          if (!arc) return;
          const hue = hueOf(arc.id);
          const sides = [];
          const left = row[ci - 1];
          const right = row[ci + 1];
          const up = ri > 0 ? nearest(rows[ri - 1], t.offsetLeft) : null;
          const down = ri < rows.length - 1 ? nearest(rows[ri + 1], t.offsetLeft) : null;
          if (!left || arcOf(left) !== arc) sides.push("l");
          if (!right || arcOf(right) !== arc) sides.push("r");
          if (!up || arcOf(up) !== arc) sides.push("t");
          if (!down || arcOf(down) !== arc) sides.push("b");
          if (!sides.length) return;

          t.classList.add("arc-m");
          if (!t.dataset.baseTitle) t.dataset.baseTitle = t.title;
          t.title = `${arc.name} · Ep ${arc.from}–${arc.to}\n${t.dataset.baseTitle}`;
          t.style.setProperty("--arc-h", hue);
          sides.forEach((s) => {
            const i = document.createElement("i");
            i.className = `arc-edge ${s}`;
            i.setAttribute("aria-hidden", "true");
            t.append(i);
          });
        });
      });
    });
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (decorated) decorate(decorated.root, decorated.show);
    }, 150);
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

  /* ---- Popup, opened from the show header next to "Mark fillers" ---- */

  function drawModal(show) {
    const el = document.getElementById("arcsModal");
    if (!el) return;
    const flat = flatten(show);
    const arcs = forShow(show.id);

    el.querySelector(".arcs-modal-body").innerHTML = `
      <div class="arcs-modal-tools">
        <button class="btn btn-ghost sm" data-arc-toggle="paste">Paste arcs</button>
        <button class="btn btn-accent sm" data-arc-toggle="add">+ Add arc</button>
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
                <li class="arc-row">
                  <div class="arc-row-main">
                    <b>${esc(arc.name)}</b>
                    <span class="arc-range">Ep ${arc.from}–${arc.to} · ${span} ep${arc.desc ? ` · ${esc(arc.desc)}` : ""}</span>
                  </div>
                  <span class="arc-count">${p.done} / ${p.total}</span>
                  <button class="btn btn-ghost sm" data-arc-action="${p.total && p.done >= p.total ? "unmark" : "mark"}" data-arc-id="${esc(arc.id)}">${p.total && p.done >= p.total ? "Unmark" : "Mark all"}</button>
                  <button class="btn btn-ghost sm" data-arc-action="remove" data-arc-id="${esc(arc.id)}">Remove</button>
                </li>`;
              })
              .join("")}</ul>`
          : `<p class="arcs-empty">No arcs yet. Add one, or paste a whole list from a wiki page.</p>`
      }`;

    bindModal(el, show);
  }

  function bindModal(el, show) {
    const body = el.querySelector(".arcs-modal-body");
    const refresh = () => {
      drawModal(show);
      host.rerender && host.rerender();
    };

    body.querySelectorAll("[data-arc-toggle]").forEach((b) =>
      b.addEventListener("click", () => {
        const kind = b.dataset.arcToggle;
        body.querySelectorAll("[data-arc-form]").forEach((f) => {
          f.hidden = f.dataset.arcForm === kind ? !f.hidden : true;
        });
      }),
    );

    body.querySelector('[data-arc-form="add"]').addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
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
      refresh();
    });

    const paste = body.querySelector('[data-arc-form="paste"]');
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
      refresh();
    });

    body.querySelectorAll("[data-arc-action]").forEach((b) =>
      b.addEventListener("click", () => {
        const arc = forShow(show.id).find((a) => a.id === b.dataset.arcId);
        if (b.dataset.arcAction === "remove") {
          saveForShow(show.id, forShow(show.id).filter((a) => a.id !== b.dataset.arcId));
        } else if (arc) {
          markRange(show, arc, flatten(show), b.dataset.arcAction === "mark");
        }
        refresh();
      }),
    );
  }

  function open(show) {
    if (!show) return;
    host.show = show;
    let el = document.getElementById("arcsModal");
    if (!el) {
      const backdrop = document.createElement("div");
      backdrop.className = "filler-backdrop";
      backdrop.id = "arcsBackdrop";

      el = document.createElement("aside");
      el.className = "filler-modal arcs-modal";
      el.id = "arcsModal";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", "Arcs");
      el.innerHTML = `
        <header class="filler-head">
          <div>
            <h2>Arcs</h2>
            <p class="arcs-sub">Story runs by absolute episode number. They show as faint lines in the episode list.</p>
          </div>
          <button class="filler-close" aria-label="Close">✕</button>
        </header>
        <div class="arcs-modal-body"></div>`;

      document.body.append(backdrop, el);
      backdrop.addEventListener("click", close);
      el.querySelector(".filler-close").addEventListener("click", close);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && document.getElementById("arcsModal")) close();
      });
    }

    drawModal(show);
    requestAnimationFrame(() => {
      document.getElementById("arcsBackdrop").classList.add("show");
      document.getElementById("arcsModal").classList.add("show");
    });
  }

  function close() {
    const el = document.getElementById("arcsModal");
    const bd = document.getElementById("arcsBackdrop");
    if (!el) return;
    el.classList.remove("show");
    bd.classList.remove("show");
    setTimeout(() => {
      el.remove();
      bd.remove();
    }, 200);
  }

  /* series.js sets the progress bucket, the show, and how to redraw after a change. */
  function setHost(next) {
    host = { ...host, ...next };
  }

  function count(show) {
    return forShow(show.id).length;
  }

  return { decorate, open, count, parseLine, parseJson, flatten, enabled, toggle, setHost };
})();
