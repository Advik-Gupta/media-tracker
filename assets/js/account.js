/* ============================================================
   ACCOUNT — the sign-in page, and the account chip that appears
   in the top bar of every other page.

   Accounts are optional. With no Supabase credentials in the
   build, this says so plainly rather than showing a form that
   cannot work.
   ============================================================ */

(() => {
  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  /* ---------- the page ---------- */

  const panel = document.getElementById("acctPanel");

  if (panel) {
    if (!Cloud.configured()) {
      panel.innerHTML = `
        <div class="acct-card">
          <h3>Accounts are not set up</h3>
          <p>
            This deploy has no Supabase credentials, so there is nothing to
            sign in to. Your vault still saves in this browser, and the
            Export button on the home page still moves it between devices.
          </p>
          <p class="acct-note">
            To turn accounts on: set <code>SUPABASE_URL</code> and
            <code>SUPABASE_ANON_KEY</code> in the deploy environment and
            build again. See <code>.env.example</code>.
          </p>
        </div>`;
    } else {
      render();
      Cloud.onAuth(render);
      Cloud.ready();
    }
  }

  let mode = "in"; // "in" | "up"
  let busy = false;
  let message = null;

  function render() {
    if (!panel) return;
    const user = Cloud.user();

    if (user) {
      panel.innerHTML = `
        <div class="acct-card">
          <h3>Signed in</h3>
          <p class="acct-who">${esc(user.email || "your account")}</p>
          <p>
            This vault syncs automatically — changes are sent up a couple of
            seconds after you make them, and pulled down when you sign in
            somewhere else.
          </p>
          <div class="acct-actions">
            <button class="btn" id="acctSync">Sync now</button>
            <button class="btn" id="acctOut">Sign out</button>
          </div>
          ${message ? `<p class="acct-msg">${esc(message)}</p>` : ""}
        </div>`;

      document.getElementById("acctOut").addEventListener("click", async () => {
        message = "Saving before signing out…";
        render();
        await Cloud.signOut();
        message = null;
        render();
      });

      document.getElementById("acctSync").addEventListener("click", async () => {
        message = "Syncing…";
        render();
        const up = await Cloud.push({ force: true });
        message = up.ok ? "Synced." : `Could not sync: ${up.error}`;
        render();
      });
      return;
    }

    panel.innerHTML = `
      <div class="acct-card">
        <div class="acct-tabs">
          <button class="chip${mode === "in" ? " active" : ""}" data-mode="in">Sign in</button>
          <button class="chip${mode === "up" ? " active" : ""}" data-mode="up">Create account</button>
        </div>

        <form class="acct-form" id="acctForm">
          <label>
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" required />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password"
                   autocomplete="${mode === "up" ? "new-password" : "current-password"}"
                   minlength="8" required />
          </label>
          ${message ? `<p class="acct-msg">${esc(message)}</p>` : ""}
          <button class="btn btn-accent" type="submit" ${busy ? "disabled" : ""}>
            ${busy ? "Working…" : mode === "up" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p class="acct-note">
          Signing in for the first time uploads what is already in this
          browser, so nothing you have ticked is lost.
        </p>
      </div>`;

    panel.querySelectorAll("[data-mode]").forEach((b) =>
      b.addEventListener("click", () => {
        mode = b.dataset.mode;
        message = null;
        render();
      }),
    );

    document.getElementById("acctForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;

      const form = new FormData(e.target);
      const email = String(form.get("email") || "").trim();
      const password = String(form.get("password") || "");

      busy = true;
      message = null;
      render();

      const res =
        mode === "up"
          ? await Cloud.signUp(email, password)
          : await Cloud.signIn(email, password);

      busy = false;
      if (res.error) {
        message = res.error;
      } else if (mode === "up") {
        /* Supabase may be set to require email confirmation, in which case
           there is no session yet and nothing has gone wrong. */
        message = Cloud.user()
          ? "Account created."
          : "Account created — check your email to confirm it.";
      }
      render();
    });
  }

  /* ---------- the chip in every other top bar ---------- */

  const slot = document.getElementById("acctChip");
  if (slot && Cloud.configured()) {
    const paint = () => {
      const user = Cloud.user();
      slot.innerHTML = user
        ? `<a class="btn btn-ghost" href="pages/account.html" title="${esc(user.email || "")}">Synced</a>`
        : `<a class="btn btn-ghost" href="pages/account.html">Sign in</a>`;
    };
    paint();
    Cloud.onAuth(paint);
    Cloud.ready();
  }
})();
