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

  /* An open arc (still airing) has no end yet: it runs to the latest episode. */
  const endOf = (arc, count) => (arc.open ? count : Math.min(arc.to, count));
  const rangeLabel = (arc) => `Ep ${arc.from}–${arc.open ? "ongoing" : arc.to}`;
  const OPEN_WORD = /^(ongoing|airing|now|present|current|\?)$/i;

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
    if (typeof Store !== "undefined") Store.touch();
    return enabled();
  }

  /* Absolute episode order across every season, as [{season, episode, title}]. */
  function flatten(show) {
    const out = [];
    (show.seasons || []).forEach((se) =>
      se.episodes.forEach((ep) => out.push({ season: se.n, episode: ep.n, title: ep.t, overview: ep.o })),
    );
    return out;
  }

  /* Map "season x episode" -> the arc that covers it. Cached until arcs change. */
  function arcMap(show) {
    if (mapCache.has(show)) return mapCache.get(show);
    const flat = flatten(show);
    const map = new Map();
    for (const arc of forShow(show.id)) {
      for (let i = arc.from; i <= endOf(arc, flat.length); i++) {
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
    for (let i = arc.from; i <= endOf(arc, flat.length); i++) {
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
    for (let i = arc.from; i <= endOf(arc, flat.length); i++) {
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

  function clearMarks(root) {
    hideTip();
    root.querySelectorAll(".arc-edge").forEach((n) => n.remove());
    root.querySelectorAll(".ep.arc-m").forEach((t) => {
      t.classList.remove("arc-m");
      delete t._arcTip;
    });
  }

  /* Draws arc boundaries into the episode grids. Each show on the page gets
     its own arcs, drawn only inside its own block. A tile whose neighbour
     (left, right, above, below) belongs to a different arc gets a faint line
     on that side, sitting in the gap between tiles. Works from the real
     layout, so it follows the grid wrapping at any width. */
  function decorate(root, shows) {
    if (!root || !shows) return;
    shows = Array.isArray(shows) ? shows : [shows];
    decorated = { root, shows };
    clearMarks(root);
    if (!enabled()) return;

    // Pass 1: read every layout value up front, so no writes interleave with reads.
    const jobs = [];
    for (const show of shows) {
      const map = arcMap(show);
      if (!map.size) continue;
      const scope =
        shows.length > 1 ? root.querySelector(`.show[data-show="${show.id}"]`) : root;
      if (!scope) continue;
      const flat = flatten(show);
      const info = new Map(flat.map((ep) => [`${ep.season}x${ep.episode}`, ep]));
      const last = flat[flat.length - 1] || {};
      const keyOf = (t) => `${t.dataset.season}x${t.dataset.ep}`;

      scope.querySelectorAll(".ep-grid").forEach((grid) => {
        const tiles = Array.from(grid.children).filter(
          (t) =>
            t.classList.contains("ep") &&
            t.offsetParent !== null &&
            (shows.length === 1 || String(t.dataset.show) === String(show.id)),
        );
        if (!tiles.length) return;
        const items = tiles.map((el) => ({
          el,
          arc: map.get(keyOf(el)) || null,
          ep: info.get(keyOf(el)) || null,
          top: el.offsetTop,
          left: el.offsetLeft,
        }));
        const width = tiles[0].offsetWidth || 1;
        items.sort((a, b) => a.top - b.top || a.left - b.left);
        const rows = [];
        items.forEach((it) => {
          const row = rows[rows.length - 1];
          if (row && Math.abs(row[0].top - it.top) < 4) row.push(it);
          else rows.push([it]);
        });
        rows.forEach((r) => r.sort((a, b) => a.left - b.left));
        jobs.push({ rows, width, last });
      });
    }

    // Pass 2: work out which sides of each arc tile border another arc.
    const nearest = (row, x, width) => {
      let best = null;
      let bestD = Infinity;
      for (const it of row) {
        const d = Math.abs(it.left - x);
        if (d < bestD && d < width / 2) {
          best = it;
          bestD = d;
        }
      }
      return best;
    };
    const writes = [];
    for (const { rows, width, last } of jobs) {
      rows.forEach((row, ri) => {
        row.forEach((it, ci) => {
          if (!it.arc) return;
          const left = row[ci - 1];
          const right = row[ci + 1];
          const up = ri > 0 ? nearest(rows[ri - 1], it.left, width) : null;
          const down = ri < rows.length - 1 ? nearest(rows[ri + 1], it.left, width) : null;
          // An open arc is left unclosed after its latest episode.
          const isLast =
            it.arc.open &&
            it.el.dataset.season === String(last.season) &&
            it.el.dataset.ep === String(last.episode);
          const sides = [];
          if (!left || left.arc !== it.arc) sides.push("l");
          if ((!right || right.arc !== it.arc) && !isLast) sides.push("r");
          if (!up || up.arc !== it.arc) sides.push("t");
          if (down ? down.arc !== it.arc : !it.arc.open) sides.push("b");
          writes.push({ it, sides });
        });
      });
    }

    // Pass 3: write the classes, tooltip data and lines.
    writes.forEach(({ it, sides }) => {
      const t = it.el;
      t.classList.add("arc-m");
      t._arcTip = { arc: it.arc, ep: it.ep };
      t.style.setProperty("--arc-h", hueOf(it.arc.id));
      if (!sides.length) return;
      const frag = document.createDocumentFragment();
      sides.forEach((s) => {
        const i = document.createElement("i");
        i.className = `arc-edge ${s}`;
        i.setAttribute("aria-hidden", "true");
        frag.append(i);
      });
      t.append(frag);
    });
  }

  /* ---- Episode tooltip: follows the cursor. Arc first (when the tile is in
     one and arcs are on), a gap, then the episode. Replaces the browser's. ---- */

  let tipEl = null;
  let tipTimer = null;
  let tipFor = null;
  let tipX = 0;
  let tipY = 0;

  function hideTip() {
    clearTimeout(tipTimer);
    tipFor = null;
    if (tipEl) tipEl.hidden = true;
  }

  function placeTip() {
    if (!tipEl || tipEl.hidden) return;
    const w = tipEl.offsetWidth;
    const h = tipEl.offsetHeight;
    let left = tipX + 16;
    let top = tipY + 18;
    if (left + w > window.innerWidth - 8) left = tipX - w - 12;
    if (top + h > window.innerHeight - 8) top = tipY - h - 12;
    tipEl.style.left = `${Math.max(8, left)}px`;
    tipEl.style.top = `${Math.max(8, top)}px`;
  }

  function showTip(tile) {
    const title = tile.dataset.tipTitle || "";
    const overview = tile.dataset.tipDesc || "";
    const arc = tile._arcTip ? tile._arcTip.arc : null;
    if (!title && !arc) return;
    if (!tipEl) {
      tipEl = document.createElement("div");
      tipEl.className = "arc-tip";
      tipEl.setAttribute("role", "tooltip");
      document.body.append(tipEl);
    }
    const line = (cls, text) => {
      const el = document.createElement("div");
      el.className = cls;
      el.textContent = text;
      return el;
    };
    tipEl.replaceChildren();
    if (arc) {
      const head = document.createElement("div");
      head.className = "arc-tip-arc";
      head.style.setProperty("--arc-h", hueOf(arc.id));
      head.append(line("arc-tip-name", arc.name), line("arc-tip-range", rangeLabel(arc)));
      if (arc.desc) head.append(line("arc-tip-desc", arc.desc));
      tipEl.append(head);
    }
    if (title) {
      const body = document.createElement("div");
      body.className = `arc-tip-ep${arc ? " after-arc" : ""}`;
      body.append(line("arc-tip-title", title));
      if (overview) body.append(line("arc-tip-desc", overview));
      tipEl.append(body);
    }
    tipEl.hidden = false;
    placeTip();
  }

  document.addEventListener("mouseover", (e) => {
    const tile = e.target.closest && e.target.closest(".ep[data-tip-title]");
    if (tile === tipFor) return;
    hideTip();
    if (!tile) return;
    tipFor = tile;
    tipTimer = setTimeout(() => showTip(tile), 300);
  });
  document.addEventListener("mousemove", (e) => {
    tipX = e.clientX;
    tipY = e.clientY;
    placeTip();
  });
  document.addEventListener("scroll", hideTip, { passive: true, capture: true });
  document.addEventListener("mousedown", hideTip);
  document.documentElement.addEventListener("mouseleave", hideTip);

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (decorated) decorate(decorated.root, decorated.shows);
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
      const toRaw = raw.to ?? raw.end;
      let to = Number(toRaw);
      let open =
        raw.open === true ||
        raw.ongoing === true ||
        ("to" in raw && raw.to === null) ||
        (typeof toRaw === "string" && OPEN_WORD.test(toRaw.trim()));
      if ((!from || !to) && typeof raw.episodes === "string") {
        const m = raw.episodes.match(/(\d+)\s*(?:-|–|—|to)\s*(\d+)/i);
        if (m) [from, to] = [Number(m[1]), Number(m[2])];
        else {
          const o = raw.episodes.match(/^\s*(\d+)\s*(?:(?:-|–|—|to)\s*\D*|\+)\s*$/i);
          if (o) [from, open] = [Number(o[1]), true];
        }
      }
      const name = String(raw.name || "").trim();
      if (!name || !(from >= 1) || (!open && !(to >= from))) return null;
      out.push({
        id: newId(),
        name,
        from,
        to: open ? null : to,
        ...(open ? { open: true } : {}),
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
    let m = head.match(/(\d+)\s*(?:-|–|—|to)\s*(\d+)/i);
    let open = false;
    if (!m) {
      // "Egghead 1086-", "Egghead 1086+", "Egghead 1086-ongoing": no end yet.
      m = head.match(/(\d+)\s*(?:(?:-|–|—|to)\s*(?:ongoing|airing|now|present|current|\?)?|\+)\s*[)\]]?\s*$/i);
      open = !!m;
    }
    if (!m) return null;
    const before = head.slice(0, m.index).replace(/[\s:(\[–—-]+$/, "").trim();
    const after = head.slice(m.index + m[0].length).replace(/^[\s)\]:–—-]+/, "").trim();
    const name = before || after;
    if (!name) return null;
    const from = Number(m[1]);
    if (open) return from >= 1 ? { id: newId(), name, from, to: null, open: true, desc } : null;
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
        <label><span>To ep</span><input name="to" type="number" min="1" /></label>
        <label class="arcs-wide arcs-check"><input name="open" type="checkbox" /><span>Current arc, still airing (no end episode yet)</span></label>
        <label class="arcs-wide"><span>Description</span><textarea name="desc" rows="2" maxlength="400" placeholder="What happens in this arc"></textarea></label>
        <div class="arcs-form-actions">
          <button type="button" class="btn btn-ghost sm" data-arc-toggle="add">Cancel</button>
          <button type="submit" class="btn btn-accent sm">Save arc</button>
        </div>
      </form>

      <div class="arcs-paste" data-arc-form="paste" hidden>
        <textarea rows="6" placeholder="One arc per line:&#10;Romance Dawn 1-3&#10;Orange Town 4-8 | Luffy's first real fight&#10;&#10;or JSON:&#10;[{&quot;name&quot;:&quot;Wano&quot;,&quot;from&quot;:892,&quot;to&quot;:1085,&quot;desc&quot;:&quot;&quot;}]"></textarea>
        <p class="arcs-hint">Lines: <code>Name from-to</code>, optionally <code>| description</code>. For the arc still airing, leave the end off: <code>Egghead 1086-</code>. Or paste a JSON array of <code>{name, from, to, desc}</code>.</p>
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
                const span = Math.max(0, endOf(arc, flat.length) - arc.from + 1);
                return `
                <li class="arc-row">
                  <div class="arc-row-main">
                    <b>${esc(arc.name)}</b>
                    <span class="arc-range">${rangeLabel(arc)} · ${span} ep${arc.open ? " so far" : ""}${arc.desc ? ` · ${esc(arc.desc)}` : ""}</span>
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
      const open = fd.get("open") === "on";
      const to = open ? null : Number(fd.get("to"));
      if (!(from >= 1) || (!open && !(to >= from))) {
        form.querySelector('[name="to"]').focus();
        return;
      }
      saveForShow(show.id, forShow(show.id).concat({
        id: newId(),
        name: String(fd.get("name")).trim(),
        from,
        to,
        ...(open ? { open: true } : {}),
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
