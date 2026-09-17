(() => {
  const TABLE = "shared_lists";
  const SAVED_KEY = "mediavault.savedlists";
  const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  const genCode = () =>
    Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

  async function client() {
    await Cloud.ready();
    return Cloud.client();
  }

  function savedLists() {
    try {
      return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function saveSavedLists(list) {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(list));
    } catch {}
  }
  function rememberList(list) {
    const all = savedLists().filter((x) => x.code !== list.code);
    all.unshift({ code: list.code, name: list.name, items: list.items, savedAt: Date.now() });
    saveSavedLists(all.slice(0, 40));
  }
  function forgetList(code) {
    saveSavedLists(savedLists().filter((x) => x.code !== code));
  }

  /* ---------- tabs ---------- */

  const tabs = document.querySelectorAll(".sl-tabs [data-tab]");
  const panels = { create: document.getElementById("slCreate"), open: document.getElementById("slOpen") };
  function showTab(name) {
    tabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    Object.entries(panels).forEach(([k, el]) => (el.hidden = k !== name));
  }
  tabs.forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

  /* ---------- create ---------- */

  const createBody = document.getElementById("slCreateBody");
  let draft = [];
  let watchedOnly = false;
  let searchTimer = null;

  function searchFilms(q) {
    const query = q.trim().toLowerCase();
    if (query.length < 2 || typeof FILMS === "undefined") return [];
    const shared = watchedOnly ? (typeof Store !== "undefined" ? Store.exportAll().__shared || {} : {}) : null;
    const out = [];
    for (const [key, f] of Object.entries(FILMS)) {
      if (watchedOnly && !shared[key]) continue;
      if (!f.title || !f.title.toLowerCase().includes(query)) continue;
      out.push({ key, title: f.title, year: (f.release || "").slice(0, 4), poster: f.poster || "" });
      if (out.length >= 20) break;
    }
    return out;
  }

  function renderCreate() {
    createBody.innerHTML = `
      <label class="sl-field">
        <span>List name</span>
        <input id="slName" type="text" maxlength="80" placeholder="Movies you have to see…" autocomplete="off" />
      </label>

      <div class="sl-search-modes">
        <button class="chip${!watchedOnly ? " active" : ""}" data-mode="all">All movies</button>
        <button class="chip${watchedOnly ? " active" : ""}" data-mode="watched">Already watched</button>
      </div>

      <div class="wl-search">
        <input id="slSearch" type="text" autocomplete="off" spellcheck="false" placeholder="Search a title to add…" />
        <div class="wl-suggest" id="slSuggest" hidden></div>
      </div>

      <div class="sl-picked" id="slPicked"></div>

      <div class="sl-create-actions">
        <button class="btn btn-accent" id="slSubmit">Create share link</button>
        <span class="sl-hint">${draft.length} title${draft.length === 1 ? "" : "s"} picked</span>
      </div>
      <div id="slCreateResult"></div>`;

    createBody.querySelectorAll("[data-mode]").forEach((b) =>
      b.addEventListener("click", () => {
        watchedOnly = b.dataset.mode === "watched";
        renderCreate();
      }),
    );

    const nameInput = document.getElementById("slName");
    const search = document.getElementById("slSearch");
    const suggest = document.getElementById("slSuggest");
    const picked = document.getElementById("slPicked");

    search.addEventListener("input", () => {
      clearTimeout(searchTimer);
      const q = search.value;
      if (q.trim().length < 2) {
        suggest.hidden = true;
        return;
      }
      searchTimer = setTimeout(() => {
        const hits = searchFilms(q).filter((h) => !draft.some((d) => d.key === h.key));
        suggest.hidden = false;
        suggest.innerHTML = hits.length
          ? hits
              .map(
                (h, i) => `
            <button class="wl-sugg" data-i="${i}">
              <span class="wl-sugg-thumb${h.poster ? "" : " ph"}">
                ${h.poster ? `<img src="${esc(h.poster)}" alt="" loading="lazy">` : ""}
              </span>
              <span class="wl-sugg-text"><b>${esc(h.title)}</b><small>${h.year}</small></span>
            </button>`,
              )
              .join("")
          : `<div class="wl-sugg-state">${watchedOnly ? "Nothing watched matches that." : "Nothing found."}</div>`;
        suggest.querySelectorAll("[data-i]").forEach((b) =>
          b.addEventListener("click", () => {
            draft.push(hits[Number(b.dataset.i)]);
            search.value = "";
            suggest.hidden = true;
            renderPicked();
          }),
        );
      }, 350);
    });

    document.addEventListener("click", (e) => {
      if (!suggest.hidden && !e.target.closest(".wl-search")) suggest.hidden = true;
    });

    function renderPicked() {
      picked.innerHTML = draft.length
        ? draft
            .map(
              (d, i) => `
        <div class="sl-picked-row">
          <span class="sl-picked-thumb${d.poster ? "" : " ph"}">${d.poster ? `<img src="${esc(d.poster)}" alt="">` : ""}</span>
          <span class="sl-picked-title">${esc(d.title)} <i>${d.year}</i></span>
          <button class="btn btn-ghost sm" data-remove="${i}">Remove</button>
        </div>`,
            )
            .join("")
        : `<p class="sl-empty-hint">Nothing picked yet - search above to add a title.</p>`;
      picked.querySelectorAll("[data-remove]").forEach((b) =>
        b.addEventListener("click", () => {
          draft.splice(Number(b.dataset.remove), 1);
          renderPicked();
          document.querySelector(".sl-hint").textContent = `${draft.length} title${draft.length === 1 ? "" : "s"} picked`;
        }),
      );
      const hint = document.querySelector(".sl-hint");
      if (hint) hint.textContent = `${draft.length} title${draft.length === 1 ? "" : "s"} picked`;
    }
    renderPicked();

    document.getElementById("slSubmit").addEventListener("click", async () => {
      const name = nameInput.value.trim();
      const result = document.getElementById("slCreateResult");
      if (!name) {
        result.innerHTML = `<p class="sl-error">Give the list a name first.</p>`;
        return;
      }
      if (!draft.length) {
        result.innerHTML = `<p class="sl-error">Add at least one title.</p>`;
        return;
      }
      const btn = document.getElementById("slSubmit");
      btn.disabled = true;
      btn.textContent = "Creating…";
      result.innerHTML = "";

      const c = await client();
      if (!c) {
        result.innerHTML = `<p class="sl-error">This deploy has no Supabase credentials, so sharing isn't available. See <code>.env.example</code>.</p>`;
        btn.disabled = false;
        btn.textContent = "Create share link";
        return;
      }

      let code = null;
      for (let attempt = 0; attempt < 4 && !code; attempt++) {
        const candidate = genCode();
        const { error } = await c.from(TABLE).insert({ code: candidate, name, items: draft });
        if (!error) code = candidate;
        else if (!/duplicate|unique/i.test(error.message)) {
          result.innerHTML = `<p class="sl-error">Could not create the list: ${esc(error.message)}</p>`;
          btn.disabled = false;
          btn.textContent = "Create share link";
          return;
        }
      }

      if (!code) {
        result.innerHTML = `<p class="sl-error">Could not find a free code - try again.</p>`;
        btn.disabled = false;
        btn.textContent = "Create share link";
        return;
      }

      const link = `${location.origin}${location.pathname}?code=${code}`;
      rememberList({ code, name, items: draft });
      result.innerHTML = `
        <div class="sl-result">
          <p class="rlabel">Ready to share</p>
          <div class="sl-code">${code}</div>
          <div class="sl-link-row">
            <input readonly value="${esc(link)}" onclick="this.select()" />
            <button class="btn sm" id="slCopyLink">Copy link</button>
          </div>
          <p class="sl-hint2">Anyone with the code or the link can open this list - no account needed.</p>
        </div>`;
      document.getElementById("slCopyLink").addEventListener("click", async (e) => {
        try {
          await navigator.clipboard.writeText(link);
          e.currentTarget.textContent = "Copied";
        } catch {
          e.currentTarget.textContent = "Select it above";
        }
        setTimeout(() => (e.currentTarget.textContent = "Copy link"), 1800);
      });

      draft = [];
      nameInput.value = "";
      renderPicked();
      renderSaved();
      btn.disabled = false;
      btn.textContent = "Create share link";
    });
  }

  /* ---------- open ---------- */

  const openBody = document.getElementById("slOpenBody");

  function renderOpenForm(message) {
    openBody.innerHTML = `
      <div class="wl-search">
        <input id="slCodeInput" type="text" maxlength="6" autocomplete="off" spellcheck="false"
               placeholder="Enter a 6-character code…" style="text-transform:uppercase" />
        <button class="btn btn-accent" id="slCodeGo">Open</button>
      </div>
      ${message ? `<p class="sl-error">${esc(message)}</p>` : ""}
      <div id="slOpenResult"></div>`;

    const go = async () => {
      const code = document.getElementById("slCodeInput").value.trim().toUpperCase();
      if (code.length !== 6) return renderOpenForm("That code should be 6 characters.");
      await fetchAndRenderList(code);
    };
    document.getElementById("slCodeGo").addEventListener("click", go);
    document.getElementById("slCodeInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") go();
    });
  }

  async function fetchAndRenderList(code) {
    const result = document.getElementById("slOpenResult");
    if (result) result.innerHTML = `<p class="sl-hint">Looking that up…</p>`;

    const c = await client();
    if (!c) {
      renderOpenForm("This deploy has no Supabase credentials, so shared lists aren't available.");
      return;
    }

    const { data, error } = await c.from(TABLE).select("code,name,items,created_at").eq("code", code).maybeSingle();
    if (error || !data) {
      renderOpenForm(error ? error.message : `No list found for code "${code}".`);
      return;
    }
    renderList(data);
  }

  function renderList(list) {
    const already = savedLists().some((x) => x.code === list.code);
    openBody.innerHTML = `
      <div class="sl-view">
        <div class="sl-view-head">
          <div>
            <p class="rlabel">Shared list · ${esc(list.code)}</p>
            <h2>${esc(list.name)}</h2>
          </div>
          <button class="btn btn-accent sm" id="slSave" ${already ? "disabled" : ""}>${already ? "Saved" : "Save for later"}</button>
        </div>
        <div class="wish-grid" id="slViewGrid"></div>
      </div>`;

    const grid = document.getElementById("slViewGrid");
    (list.items || []).forEach((item) => {
      const el = document.createElement("a");
      el.className = "wish-card reveal in";
      el.href = `pages/movies/view.html?film=${encodeURIComponent(item.key)}`;
      el.innerHTML = `
        <div class="wish-cover">${item.poster ? `<img src="${esc(item.poster)}" alt="" loading="lazy">` : ""}</div>
        <div class="wish-body">
          <h3>${esc(item.title)}</h3>
          <p class="wish-year">${esc(item.year || "")}</p>
        </div>`;
      grid.appendChild(el);
    });

    const saveBtn = document.getElementById("slSave");
    if (saveBtn && !already) {
      saveBtn.addEventListener("click", () => {
        rememberList(list);
        saveBtn.disabled = true;
        saveBtn.textContent = "Saved";
        renderSaved();
      });
    }
  }

  /* ---------- saved lists ---------- */

  function renderSaved() {
    const wrap = document.getElementById("slSaved");
    const lists = savedLists();
    if (!lists.length) {
      wrap.innerHTML = `<p class="sl-empty-hint">Lists you save from a code - your own, or someone else's - show up here.</p>`;
      return;
    }
    wrap.innerHTML = lists
      .map(
        (l) => `
      <div class="sl-saved-row">
        <div>
          <b>${esc(l.name)}</b>
          <span class="sl-hint">${(l.items || []).length} title${(l.items || []).length === 1 ? "" : "s"} · code ${esc(l.code)}</span>
        </div>
        <div class="sl-saved-actions">
          <button class="btn sm" data-open="${esc(l.code)}">Open</button>
          <button class="btn btn-ghost sm" data-forget="${esc(l.code)}">Remove</button>
        </div>
      </div>`,
      )
      .join("");
    wrap.querySelectorAll("[data-open]").forEach((b) =>
      b.addEventListener("click", () => {
        showTab("open");
        const saved = savedLists().find((x) => x.code === b.dataset.open);
        if (saved) renderList(saved);
        else fetchAndRenderList(b.dataset.open);
      }),
    );
    wrap.querySelectorAll("[data-forget]").forEach((b) =>
      b.addEventListener("click", () => {
        forgetList(b.dataset.forget);
        renderSaved();
      }),
    );
  }

  /* ---------- boot ---------- */

  renderCreate();
  renderOpenForm();
  renderSaved();

  const urlCode = new URLSearchParams(location.search).get("code");
  if (urlCode && urlCode.length === 6) {
    showTab("open");
    fetchAndRenderList(urlCode.toUpperCase());
  }
})();
