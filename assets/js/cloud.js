const Cloud = (() => {
  const CDN =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
  const TABLE = "user_state";
  const PUSH_DELAY = 2000;

  const cfg = window.MV_CONFIG || {};
  const configured = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);

  let client = null;
  let user = null;
  let token = null;
  let ready = null;
  let pushTimer = null;
  let pulling = false;
  const listeners = new Set();

  const notify = () => listeners.forEach((fn) => fn(user));

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
        if (changed && user)
          pull();
      });

      if (user) await pull();
      return client;
    })();

    return ready;
  }

  async function pull() {
    if (!client || !user) return { ok: false };

    const { data, error } = await client
      .from(TABLE)
      .select("data, client_updated")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error)
      return { ok: false, error: error.message };

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

  if (typeof Store !== "undefined" && Store.onChange) {
    Store.onChange(() => schedulePush());
  }

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
    } catch (e) {}
  });

  return {
    configured: () => configured,

    user: () => user,

    ready: init,

    onAuth(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    async signUp(email, password) {
      try {
        await init();
        if (!client) return { error: "Accounts are not configured." };
        const { error } = await client.auth.signUp({ email, password });
        return error ? { error: error.message } : {};
      } catch (e) {
        return { error: e.message || "Could not reach the server." };
      }
    },

    async signIn(email, password) {
      try {
        await init();
        if (!client) return { error: "Accounts are not configured." };
        const { error } = await client.auth.signInWithPassword({ email, password });
        return error ? { error: error.message } : {};
      } catch (e) {
        return { error: e.message || "Could not reach the server." };
      }
    },

    async signOut() {
      await init();
      if (!client)
        return;
      await push({ force: true });
      await client.auth.signOut();
    },

    pull,
    push,
  };
})();

if (Cloud.configured())
  Cloud.ready();
