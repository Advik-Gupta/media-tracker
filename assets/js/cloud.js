/* ============================================================
   CLOUD — optional accounts, so a vault follows you between
   devices instead of living in one browser.

   Everything still works signed out. Local storage remains the
   working copy and the source of truth for the running page;
   Supabase is a mirror that is pulled on sign-in and pushed,
   debounced, whenever anything changes.

   The whole state travels as one JSON object — the same shape
   `Store.exportBundle()` produces — because nothing is ever
   queried across users. See supabase/schema.sql.

   Conflict resolution is last-write-wins on the app's own clock
   (`Store.lastSaved()`), the same rule the IndexedDB mirror
   already uses. Two devices editing the same account at once
   will not merge; the later save wins. That is a deliberate
   simplification, not an oversight — merging watch state needs a
   per-key clock, which is a great deal of machinery for a
   personal tracker.

   Requires assets/js/config.js, written by the build from the
   environment. With no credentials the module does nothing at
   all and the site behaves exactly as it did before.
   ============================================================ */

const Cloud = (() => {
  const CDN =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
  const TABLE = "user_state";
  const PUSH_DELAY = 2000;

  const cfg = window.MV_CONFIG || {};
  const configured = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);

  let client = null;
  let user = null;
  let token = null; // current access token, for the unload push
  let ready = null;
  let pushTimer = null;
  let pulling = false;
  const listeners = new Set();

  const notify = () => listeners.forEach((fn) => fn(user));

  /* ---------- loading the SDK ----------
     Fetched from a CDN rather than bundled, because this project has no
     bundler. It is only loaded when credentials exist, so a local-only
     deploy pays nothing for it. */

  function loadSdk() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = CDN;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Could not load the Supabase SDK"));
      document.head.appendChild(s);
    });
  }

  async function init() {
    if (!configured) return null;
    if (ready) return ready;

    ready = (async () => {
      await loadSdk();
      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      });

      const { data } = await client.auth.getSession();
      user = (data && data.session && data.session.user) || null;
      token = (data && data.session && data.session.access_token) || null;

      client.auth.onAuthStateChange((event, session) => {
        const next = (session && session.user) || null;
        const changed = (next && next.id) !== (user && user.id);
        user = next;
        token = (session && session.access_token) || null;
        notify();
        /* A fresh sign-in brings that account's state down. */
        if (changed && user) pull();
      });

      if (user) await pull();
      return client;
    })();

    return ready;
  }

  /* ---------- sync ---------- */

  /** Bring the account's state down, if it is newer than what is here. */
  async function pull() {
    if (!client || !user) return { ok: false };

    const { data, error } = await client
      .from(TABLE)
      .select("data, client_updated")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };

    /* Nothing stored yet — this account is new, so seed it from whatever
       this browser already has rather than wiping it. */
    if (!data || !data.data || !Object.keys(data.data).length) {
      await push({ force: true });
      return { ok: true, seeded: true };
    }

    const remoteAt = Number(data.client_updated) || 0;
    if (remoteAt <= Store.lastSaved()) return { ok: true, kept: "local" };

    pulling = true;
    try {
      Store.importBundle(data.data);
    } finally {
      pulling = false;
    }
    return { ok: true, kept: "remote" };
  }

  /** Send the current state up. Debounced by default. */
  async function push({ force } = {}) {
    if (!client || !user) return { ok: false };

    const { error } = await client.from(TABLE).upsert(
      {
        user_id: user.id,
        data: Store.exportBundle(),
        client_updated: Store.lastSaved(),
      },
      { onConflict: "user_id" },
    );

    if (error) return { ok: false, error: error.message };
    return { ok: true, forced: !!force };
  }

  function schedulePush() {
    if (!client || !user || pulling) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push(), PUSH_DELAY);
  }

  /* Any local change is mirrored up, a couple of seconds later so a burst
     of ticking becomes one request rather than twenty. */
  if (typeof Store !== "undefined" && Store.onChange) {
    Store.onChange(() => schedulePush());
  }

  /* And once more on the way out, so a tick made in the last two seconds is
     not lost. The SDK's own call would be cancelled as the page goes away,
     so this is a plain keepalive fetch against PostgREST, which the browser
     is allowed to finish after the page is gone. Best effort by nature. */
  window.addEventListener("beforeunload", () => {
    if (!client || !user || !token || pulling) return;
    clearTimeout(pushTimer);
    try {
      fetch(`${cfg.supabaseUrl}/rest/v1/${TABLE}?on_conflict=user_id`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${token}`,
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          user_id: user.id,
          data: Store.exportBundle(),
          client_updated: Store.lastSaved(),
        }),
      });
    } catch (e) {
      /* best effort only */
    }
  });

  return {
    /** Whether the build was given Supabase credentials at all. */
    configured: () => configured,

    /** The signed-in user, or null. Call after ready(). */
    user: () => user,

    ready: init,

    onAuth(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    async signUp(email, password) {
      await init();
      if (!client) return { error: "Accounts are not configured." };
      const { error } = await client.auth.signUp({ email, password });
      return error ? { error: error.message } : {};
    },

    async signIn(email, password) {
      await init();
      if (!client) return { error: "Accounts are not configured." };
      const { error } = await client.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },

    async signOut() {
      await init();
      if (!client) return;
      /* Push what is here before letting go of the session. */
      await push({ force: true });
      await client.auth.signOut();
    },

    pull,
    push,
  };
})();

/* Start as soon as the page has a Store to sync. Signed out, this is a
   no-op; with no credentials it does not even load the SDK. */
if (Cloud.configured()) Cloud.ready();
