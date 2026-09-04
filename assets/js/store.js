/* ============================================================
   STORE - durable progress, shared by the home page and trackers.

   Progress is written to THREE places, so losing one does not lose the data:
     1. localStorage  - the fast, synchronous source read at boot
     2. IndexedDB     - survives some clears that wipe localStorage, and is
                        what browsers protect when storage is "persisted"
     3. a dated JSON export you can download at any time

   Both stores carry an `updated` timestamp and the newer one wins on load,
   so the two can never silently diverge.

   IMPORTANT - storage is per-origin. file:///…/index.html,
   http://127.0.0.1:5500 and http://localhost:5500 are three DIFFERENT
   origins with three separate stores. Opening the site from a different
   one looks exactly like the data was wiped. Always use the same URL,
   and once deployed use the deployed URL.

   Shape: { "<bucket>": { "<itemId>": 1, ... }, ... }
   A value of 1 means watched; absent means unwatched.

   Titles that appear in more than one list carry a `link` and share one
   entry in the SHARED_BUCKET, so ticking one ticks them all.
   ============================================================ */

const SHARED_BUCKET = "__shared";

/* ------------------------------------------------------------------
   Where a generated page lives.

   Shows and anime are separate libraries that can hold series of the
   same name, so their pages are kept in separate folders. Every place
   that needs a page URL asks this rather than building one, which is
   what stops the two from drifting apart.
   ------------------------------------------------------------------ */
const VAULT_FOLDER = {
  movie: "movies",
  list: "movies",
  show: "shows",
  showlist: "shows",
  anime: "anime",
  animelist: "anime",
};

function pagePath(kind, id) {
  return `pages/${VAULT_FOLDER[kind] || "movies"}/${id}.html`;
}

/** Where a given item's progress lives: [bucket, id].

   Every list entry points at a film in the central registry, and that film key
   is the progress key. A title in ten lists is therefore one watched flag with
   no bookkeeping - the old per-universe ids and manual `link`s are only still
   handled so existing saved progress keeps working. */
function progressRef(universe, it) {
  if (it.film) return [SHARED_BUCKET, it.film];
  if (it.link) return [SHARED_BUCKET, it.link];
  return [universe, it.alias || it.id];
}

const Store = (() => {
  const KEY = "watchvault.v1";
  const DB_NAME = "watchvault";
  const STORE = "kv";
  const REC = "progress";

  const listeners = new Set();
  let cache = null; // { data, updated }
  let db = null;
  let status = { persisted: false, idb: false };

  /* ---------- localStorage ---------- */

  function readLocal() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (!raw) return { data: {}, updated: 0 };
      /* tolerate the original un-versioned shape */
      if (raw.data && typeof raw.updated === "number") return raw;
      return { data: raw, updated: 0 };
    } catch {
      return { data: {}, updated: 0 };
    }
  }

  function writeLocal(rec) {
    try {
      localStorage.setItem(KEY, JSON.stringify(rec));
      return true;
    } catch (e) {
      console.warn("localStorage write failed:", e);
      return false;
    }
  }

  /* ---------- IndexedDB mirror ---------- */

  function openDB() {
    return new Promise((resolve) => {
      if (!("indexedDB" in window)) return resolve(null);
      let req;
      try {
        req = indexedDB.open(DB_NAME, 1);
      } catch {
        return resolve(null);
      }
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    });
  }

  function idbGet() {
    return new Promise((resolve) => {
      if (!db) return resolve(null);
      try {
        const r = db.transaction(STORE, "readonly").objectStore(STORE).get(REC);
        r.onsuccess = () => resolve(r.result || null);
        r.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  function idbPut(rec) {
    if (!db) return;
    try {
      db.transaction(STORE, "readwrite").objectStore(STORE).put(rec, REC);
    } catch (e) {
      console.warn("IndexedDB write failed:", e);
    }
  }

  /* ---------- boot ---------- */

  cache = readLocal();

  (async () => {
    /* Ask the browser not to evict us under storage pressure. */
    try {
      if (navigator.storage && navigator.storage.persist) {
        status.persisted = await navigator.storage.persisted();
        if (!status.persisted)
          status.persisted = await navigator.storage.persist();
      }
    } catch {
      /* not supported - carry on */
    }

    db = await openDB();
    status.idb = !!db;
    if (!db) return;

    const mirrored = await idbGet();
    if (mirrored && mirrored.updated > cache.updated) {
      /* IndexedDB survived something localStorage did not - restore. */
      cache = mirrored;
      writeLocal(cache);
      listeners.forEach((fn) => fn(cache.data, { restored: true }));
      console.info("Media Vault: progress restored from IndexedDB backup.");
    } else if (cache.updated > (mirrored ? mirrored.updated : -1)) {
      idbPut(cache);
    }
  })();

  /* ---------- internals ---------- */

  function commit() {
    cache.updated = Date.now();
    writeLocal(cache);
    idbPut(cache);
    listeners.forEach((fn) => fn(cache.data, {}));
  }

  return {
    get(bucket) {
      return cache.data[bucket] || {};
    },

    has(bucket, id) {
      const b = cache.data[bucket];
      return !!(b && b[id]);
    },

    /** Toggle one id. Returns the new watched state. */
    toggle(bucket, id) {
      const b = cache.data[bucket] || (cache.data[bucket] = {});
      if (b[id]) delete b[id];
      else b[id] = 1;
      commit();
      return !!b[id];
    },

    /** Set many [bucket, id] pairs at once. */
    setRefs(refs, value) {
      refs.forEach(([bucket, id]) => {
        const b = cache.data[bucket] || (cache.data[bucket] = {});
        if (value) b[id] = 1;
        else delete b[id];
      });
      commit();
    },

    /** Clear a universe, plus any shared entries it owns. */
    clearRefs(bucket, refs) {
      delete cache.data[bucket];
      const shared = cache.data[SHARED_BUCKET];
      if (shared)
        refs.forEach(([b, id]) => {
          if (b === SHARED_BUCKET) delete shared[id];
        });
      commit();
    },

    clear(bucket) {
      delete cache.data[bucket];
      commit();
    },

    clearEverything() {
      cache.data = {};
      commit();
    },

    exportAll() {
      return cache.data;
    },

    importAll(data) {
      if (!data || typeof data !== "object")
        throw new Error("Invalid backup file");
      /* accept both a bare map and a full {data, updated} export */
      cache.data =
        data.data && typeof data.updated === "number" ? data.data : data;
      commit();
    },

    /* ---------- backups ----------
       A backup has to carry everything that is yours and cannot be fetched
       again: what you have watched, which shows you added, what you hid,
       the order you dragged things into.

       It must NOT carry anything refetchable. Season and episode data comes
       back from the API on the next visit, and OMDb answers again — baking
       either into the file would make backups large and, worse, stale: a
       show that gained a season would come back from the backup missing it.
       ------------------------------------------------------------------ */

    /* Everything under this prefix is a preference, except these two, which
       are caches of remote data. */
    _refetchable: ["mediavault.showdata", "watchvault.omdb.v1"],

    exportBundle() {
      const prefs = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || !k.startsWith("mediavault.")) continue;
          if (this._refetchable.includes(k)) continue;
          prefs[k] = localStorage.getItem(k);
        }
      } catch (e) { /* private window */ }

      return {
        version: 2,
        exported: new Date().toISOString(),
        progress: cache.data,
        prefs,
      };
    },

    importBundle(obj) {
      if (!obj || typeof obj !== "object")
        throw new Error("Invalid backup file");

      /* Anything without a version is a v1 file: the progress map on its
         own, which is exactly what importAll already understands. */
      if (obj.version !== 2) {
        this.importAll(obj);
        return { progress: true, prefs: 0 };
      }

      if (obj.progress) this.importAll(obj.progress);

      let n = 0;
      try {
        for (const [k, v] of Object.entries(obj.prefs || {})) {
          if (!k.startsWith("mediavault.")) continue;
          if (this._refetchable.includes(k)) continue;
          localStorage.setItem(k, v);
          n += 1;
        }
      } catch (e) { /* quota, or a private window */ }

      return { progress: !!obj.progress, prefs: n };
    },

    /* ---------- poster overrides ----------
       Some titles have no poster anywhere we can reach, and a few of the
       ones we found are the wrong edition. A URL set here wins over the
       registry, is keyed the same way progress is, and rides along in the
       backups like everything else. */

    posterOf(key) {
      const map = cache.data.__posters;
      return (map && map[key]) || null;
    },

    setPoster(key, url) {
      const map = cache.data.__posters || (cache.data.__posters = {});
      const clean = String(url || "").trim();
      if (clean) map[key] = clean;
      else delete map[key];
      commit();
      return clean || null;
    },

    /* ---------- personal lists ----------
       A user-built list living alongside the catalogues. Entries either
       point at a catalogue title (so ticking one syncs everywhere) or are
       free text with no poster. Stored in the same record, so it rides
       along with the IndexedDB mirror and the export/import backups.

       Each vault keeps its own list: a film watchlist, a show watchlist and
       a reading list. The movie list keeps the original `__watchlist` key so
       existing saved data is not stranded by the split. */

    watchlistKey(mode) {
      const m = mode || (document.body && document.body.dataset.mode) || 'movie';
      return m === 'movie' ? '__watchlist' : `__watchlist_${m}`;
    },

    /** The list, oldest first. */
    watchlist(mode) {
      return cache.data[this.watchlistKey(mode)] || [];
    },

    /** Add an entry. `entry` is { title, year, uni, id, poster, link }. */
    watchlistAdd(entry, mode) {
      const key = this.watchlistKey(mode);
      const list = cache.data[key] || (cache.data[key] = []);
      const idOf = (e) =>
        e.uni ? `${e.uni}/${e.id}` : e.title.toLowerCase().trim();
      if (list.some((e) => idOf(e) === idOf(entry))) return false;
      list.push({ ...entry, added: Date.now() });
      commit();
      return true;
    },

    /** Merge fields into one entry - used by the OMDb backfill. */
    watchlistUpdate(index, patch, mode) {
      const list = cache.data[this.watchlistKey(mode)];
      if (!list || !list[index]) return;
      list[index] = { ...list[index], ...patch };
      commit();
    },

    watchlistRemove(index, mode) {
      const list = cache.data[this.watchlistKey(mode)];
      if (!list || !list[index]) return;
      list.splice(index, 1);
      commit();
    },

    /* ---------- merged universes ----------
       When two series become one, episode progress recorded under the old
       universe has to move to the new one. Episode keys already carry their
       TMDB show id, so nothing can collide - only the bucket changes. This
       runs once per merge and leaves a marker so it does not repeat. */

    migrateMerges() {
      const map = window.MERGES;
      if (!map) return 0;

      const doneKey = "__mergedFrom";
      const done = cache.data[doneKey] || (cache.data[doneKey] = {});
      let moved = 0;

      for (const [child, parent] of Object.entries(map)) {
        if (done[child]) continue;
        const from = cache.data[child];
        if (from) {
          const to = cache.data[parent] || (cache.data[parent] = {});
          for (const id of Object.keys(from)) {
            if (!to[id]) { to[id] = 1; moved += 1; }
          }
          delete cache.data[child];
        }
        done[child] = 1;
      }

      if (moved) commit();
      return moved;
    },

    /* ---------- link migration ----------
       A title that appears in several lists is `link`ed and its progress lives
       in the shared bucket. When a link is added AFTER something was already
       ticked, that old tick is still sitting under the per-universe key and the
       item reads as unwatched. This walks whatever catalogues are loaded and
       moves any stranded tick across. Safe to run on every page load: it only
       writes when it actually finds something. */
    migrateLinks() {
      const cats = (typeof window !== "undefined" && window.CATALOGUES) || {};
      let moved = 0;
      const shared =
        cache.data[SHARED_BUCKET] || (cache.data[SHARED_BUCKET] = {});

      Object.entries(cats).forEach(([uni, cat]) => {
        (cat.items || []).forEach((it) => {
          if (!it.link) return;
          const legacyId = it.alias || it.id;
          const bucket = cache.data[uni];
          if (!bucket || !bucket[legacyId]) return;
          if (!shared[it.link]) {
            shared[it.link] = 1;
            moved += 1;
          }
          delete bucket[legacyId]; // the shared key owns it now
          if (!Object.keys(bucket).length) delete cache.data[uni];
        });
      });

      if (moved) {
        commit();
        console.info(
          `Media Vault: moved ${moved} tick(s) onto their shared entries.`,
        );
      }
      return moved;
    },

    /** When progress was last written, as a timestamp (0 if never). */
    lastSaved() {
      return cache.updated;
    },

    /** { persisted, idb } - whether the browser promised not to evict us. */
    health() {
      return { ...status };
    },

    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
})();

/** A catalogue's items, merged with the central film registry. Cached, because
    the home page asks every catalogue for this on each render. */
const _resolved = new WeakMap();
function resolvedItems(cat) {
  if (!cat || !cat.items) return [];
  if (_resolved.has(cat)) return _resolved.get(cat);
  const out =
    typeof resolveFilm === "function"
      ? cat.items.map((it) => (it.film ? resolveFilm(it) : it))
      : cat.items;
  _resolved.set(cat, out);
  return out;
}

/* ---------- small shared helpers ---------- */

const fmtRuntime = (mins) => {
  if (!mins) return "-";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

const fmtRuntimeLong = (mins) => {
  const h = mins / 60;
  if (h < 1) return `${Math.round(mins)} minutes`;
  if (h < 48) return `${h.toFixed(1)} hours`;
  return `${(h / 24).toFixed(1)} days`;
};

const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const isFuture = (iso) => new Date(iso + "T00:00:00") > new Date();

/* Reveal-on-scroll, shared by both pages. */
function initReveal(root = document) {
  const els = root.querySelectorAll(".reveal:not(.in)");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.04 },
  );
  els.forEach((el) => io.observe(el));
}

/* Safety net: every page hides its hero behind `.reveal` until something calls
   initReveal(). A page script that forgets leaves the hero invisible - which has
   now happened twice - so run it once on load regardless. Pages that call it
   themselves are unaffected, since it only ever targets `.reveal:not(.in)`. */
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => initReveal(), {
    once: true,
  });
}

/* Transient message at the bottom of the screen. */
let _toastTimer;
/* `opts` can carry a single action - {label, action} - which is how an
   undo is offered for something destructive like removing a show. The
   toast stays up longer when there is something to click. */
function toast(msg, opts) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }

  el.textContent = "";
  const text = document.createElement("span");
  text.textContent = msg;
  el.appendChild(text);

  if (opts && opts.label && typeof opts.action === "function") {
    const btn = document.createElement("button");
    btn.className = "toast-action";
    btn.type = "button";
    btn.textContent = opts.label;
    btn.addEventListener("click", () => {
      clearTimeout(_toastTimer);
      el.classList.remove("show");
      opts.action();
    });
    el.appendChild(btn);
  }

  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(
    () => el.classList.remove("show"),
    opts && opts.label ? 6000 : 2200,
  );
}
