const SHARED_BUCKET = "__shared";

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
  let cache = null;
  let db = null;
  let status = { persisted: false, idb: false };

  function readLocal() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (!raw)
        return { data: {}, updated: 0 };
      if (raw.data && typeof raw.updated === "number")
        return raw;
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

  cache = readLocal();

  (async () => {
    try {
      if (navigator.storage && navigator.storage.persist) {
        status.persisted = await navigator.storage.persisted();
        if (!status.persisted)
          status.persisted = await navigator.storage.persist();
      }
    } catch {}

    db = await openDB();
    status.idb = !!db;
    if (!db) return;

    const mirrored = await idbGet();
    if (mirrored && mirrored.updated > cache.updated) {
      cache = mirrored;
      writeLocal(cache);
      listeners.forEach((fn) => fn(cache.data, { restored: true }));
      console.info("Media Vault: progress restored from IndexedDB backup.");
    } else if (cache.updated > (mirrored ? mirrored.updated : -1)) {
      idbPut(cache);
    }
  })();

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

    toggle(bucket, id) {
      const b = cache.data[bucket] || (cache.data[bucket] = {});
      if (b[id]) delete b[id];
      else b[id] = 1;
      commit();
      return !!b[id];
    },

    setRefs(refs, value) {
      refs.forEach(([bucket, id]) => {
        const b = cache.data[bucket] || (cache.data[bucket] = {});
        if (value) b[id] = 1;
        else delete b[id];
      });
      commit();
    },

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
      cache.data =
        data.data && typeof data.updated === "number" ? data.data : data;
      commit();
    },

    _refetchable: [
      "mediavault.showdata",
      "mediavault.showdata.meta",
      "watchvault.omdb.v1",
    ],

    exportBundle() {
      const prefs = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || !k.startsWith("mediavault.")) continue;
          if (this._refetchable.includes(k)) continue;
          prefs[k] = localStorage.getItem(k);
        }
      } catch (e) {}

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
      } catch (e) {}

      return { progress: !!obj.progress, prefs: n };
    },

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

    watchlistKey(mode) {
      const m = mode || (document.body && document.body.dataset.mode) || 'movie';
      return m === 'movie' ? '__watchlist' : `__watchlist_${m}`;
    },

    watchlist(mode) {
      return cache.data[this.watchlistKey(mode)] || [];
    },

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
          delete bucket[legacyId];
          if (!Object.keys(bucket).length)
            delete cache.data[uni];
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

    lastSaved() {
      return cache.updated;
    },

    /** Bump the save clock without touching progress data - for changes
     *  that live outside `cache.data` (added shows, wishlist, hidden
     *  universes) but still need `lastSaved()` to be honest and a sync
     *  to be scheduled. */
    touch() {
      commit();
    },

    health() {
      return { ...status };
    },

    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
})();

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

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => initReveal(), {
    once: true,
  });
}

let _toastTimer;
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
