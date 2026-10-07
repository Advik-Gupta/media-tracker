(() => {
  const KEY = "mediavault.mode";
  const MODES = [
    {
      id: "movie",
      name: "Movies",
      tagline: "Films, lists & franchises",
      href: "index.html",
      icon: "🎬",
      blurb: "Franchises, curated lists, countries and your own watchlist.",
    },
    {
      id: "show",
      name: "Shows",
      tagline: "Television",
      href: "pages/shows.html",
      icon: "📺",
      blurb:
        "Series tracked season by season, from Breaking Bad to Attack on Titan.",
    },
    { id: 'anime', name: 'Anime', tagline: 'Animation', href: 'pages/anime.html', icon: '🌸',
      blurb: 'Every series episode by episode, with ratings season by season.' },
  ];

  const ICONS = {
    movie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>',
    show: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M8 2l4 4 4-4"/></svg>',
    anime: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    sun: '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/></svg>',
  };

  const current = () => document.body.dataset.mode || "movie";
  const remember = (id) => {
    try {
      localStorage.setItem(KEY, id);
    } catch {}
  };

  document.querySelectorAll(".brand").forEach((brand) => {
    const home = MODES.find((x) => x.id === current());
    if (home) brand.setAttribute("href", home.href);
    brand.setAttribute("title", `Back to ${home ? home.name : "home"}`);

    if (brand.parentElement.querySelector(".mode-links")) return;
    const nav = document.createElement("nav");
    nav.className = "mode-links";
    nav.setAttribute("aria-label", "Switch library");
    nav.innerHTML = MODES.map(
      (m) =>
        `<a class="nav-link${m.id === current() ? " active" : ""}" href="${m.href}" data-mode="${m.id}">${m.name}</a>`,
    ).join("");
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => remember(a.dataset.mode)),
    );
    brand.insertAdjacentElement("afterend", nav);
  });

  if (!document.querySelector(".tabbar")) {
    const bar = document.createElement("nav");
    bar.className = "tabbar";
    bar.setAttribute("aria-label", "Switch library");
    bar.innerHTML = MODES.map(
      (m) =>
        `<a class="${m.id === current() ? "active" : ""}" href="${m.href}" data-mode="${m.id}">${ICONS[m.id]}<span>${m.name}</span></a>`,
    ).join("");
    bar.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => remember(a.dataset.mode)),
    );
    document.body.appendChild(bar);
  }

  const PETAL_KEY = "mediavault.petals";
  function petalsOn() {
    try {
      return localStorage.getItem(PETAL_KEY) !== "off";
    } catch {
      return true;
    }
  }
  function drawPetals() {
    const old = document.querySelector(".petals");
    if (old) old.remove();
    if (current() !== "anime" || !petalsOn()) return;
    const box = document.createElement("div");
    box.className = "petals";
    box.setAttribute("aria-hidden", "true");
    const count = window.innerWidth < 640 ? 9 : 16;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("i");
      p.className = "petal";
      const t = 14 + Math.random() * 12;
      p.style.cssText = `--x:${(Math.random() * 100).toFixed(1)}%;--s:${(9 + Math.random() * 8).toFixed(1)}px;--t:${t.toFixed(1)}s;--d:${(-Math.random() * t).toFixed(1)}s;--o:${(0.35 + Math.random() * 0.4).toFixed(2)}`;
      box.appendChild(p);
    }
    document.body.prepend(box);
  }
  drawPetals();
  if (current() === "anime") {
    document.querySelectorAll(".footer-inner").forEach((foot) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "foot-link";
      const label = () => (btn.textContent = petalsOn() ? "Petals: on" : "Petals: off");
      label();
      btn.addEventListener("click", () => {
        try {
          localStorage.setItem(PETAL_KEY, petalsOn() ? "off" : "on");
        } catch {}
        label();
        drawPetals();
      });
      foot.appendChild(btn);
    });
  }

  const THEME_KEY = "mediavault.theme";
  const root = document.documentElement;

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "light" ? "#f4f1ec" : "#121110";
  }
  applyTheme(root.dataset.theme || "dark");

  function toggleTheme() {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
    if (typeof Store !== "undefined" && Store.touch) Store.touch();
    if (document.startViewTransition) document.startViewTransition(() => applyTheme(next));
    else applyTheme(next);
  }

  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {}
    if (!saved || saved === "system") applyTheme(e.matches ? "light" : "dark");
  });

  document.querySelectorAll(".topbar-inner").forEach((bar) => {
    if (bar.querySelector(".theme-toggle")) return;
    const spacer = bar.querySelector(".topbar-spacer");

    const search = document.createElement("button");
    search.type = "button";
    search.className = "search-trigger";
    search.setAttribute("aria-label", "Search everything");
    search.innerHTML = `${ICONS.search}<span>Search</span><kbd class="kbd">${/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl "}K</kbd>`;
    search.addEventListener("click", () => openPalette());

    const theme = document.createElement("button");
    theme.type = "button";
    theme.className = "icon-btn theme-toggle";
    theme.setAttribute("aria-label", "Switch between light and dark");
    theme.title = "Light / dark";
    theme.innerHTML = ICONS.moon + ICONS.sun;
    theme.addEventListener("click", toggleTheme);

    if (spacer) spacer.after(search, theme);
    else bar.append(search, theme);
  });

  /* ---------- phone top bar: everything but the essentials goes in a menu ---------- */

  document.querySelectorAll(".topbar-inner").forEach((bar) => {
    const more = document.createElement("button");
    more.type = "button";
    more.className = "icon-btn topbar-more";
    more.setAttribute("aria-label", "More");
    more.setAttribute("aria-haspopup", "true");
    more.setAttribute("aria-expanded", "false");
    more.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    const panel = document.createElement("div");
    panel.className = "topbar-menu";
    panel.hidden = true;
    bar.append(more);
    document.body.append(panel);

    const keep = (el) =>
      el === more ||
      el.classList.contains("brand") ||
      el.classList.contains("crumb") ||
      el.classList.contains("topbar-spacer") ||
      el.classList.contains("search-trigger") ||
      el.classList.contains("mode-links") ||
      el.classList.contains("btn-accent");
    const marks = new Map();
    const phone = window.matchMedia("(max-width: 640px)");

    const setOpen = (open) => {
      panel.hidden = !open;
      more.setAttribute("aria-expanded", String(open));
    };

    function arrange() {
      if (phone.matches) {
        [...bar.children].forEach((el) => {
          if (keep(el)) return;
          const mark = document.createComment("menu-item");
          el.before(mark);
          marks.set(el, mark);
          panel.append(el);
        });
      } else {
        marks.forEach((mark, el) => {
          mark.replaceWith(el);
        });
        marks.clear();
        setOpen(false);
      }
      more.hidden = !phone.matches || !panel.children.length;
    }
    arrange();
    phone.addEventListener("change", arrange);
    new MutationObserver(() => {
      if (phone.matches) more.hidden = !panel.querySelector("a, button");
    }).observe(panel, { childList: true, subtree: true });

    more.addEventListener("click", (e) => {
      e.stopPropagation();
      setOpen(panel.hidden);
    });
    document.addEventListener("click", (e) => {
      if (!panel.hidden && !panel.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  });

  const PAGES = [
    { name: "Movies", sub: "Franchises, lists and artists", href: "index.html" },
    { name: "Shows", sub: "Television, season by season", href: "pages/shows.html" },
    { name: "Anime", sub: "Episode by episode, with arcs", href: "pages/anime.html" },
    { name: "My List", sub: "Your movie watchlist", href: "pages/watchlist.html" },
    { name: "Countries", sub: "Films on a world map", href: "pages/countries.html" },
    { name: "Analytics", sub: "What your watching looks like", href: "pages/analytics.html" },
    { name: "Share a list", sub: "Send films with a code or link", href: "pages/sharelist.html" },
    { name: "Account", sub: "Sign in and sync", href: "pages/account.html" },
  ];
  const KIND_LABEL = { movie: "Franchise", list: "List", artist: "Artist", show: "Show", anime: "Anime", showlist: "Show list", animelist: "Anime list" };
  const KIND_FOLDER = { movie: "movies", list: "movies", artist: "movies", show: "shows", showlist: "shows", anime: "anime", animelist: "anime" };

  let paletteItems = null;
  let paletteSel = 0;

  function loadScript(src) {
    return new Promise((resolve) => {
      const el = document.createElement("script");
      el.src = src;
      el.onload = el.onerror = resolve;
      document.head.appendChild(el);
    });
  }

  async function gatherItems() {
    if (paletteItems) return paletteItems;
    const items = PAGES.map((p) => ({ ...p, group: "Go to" }));
    if (typeof UNIVERSES === "undefined") await loadScript("assets/js/data/universes.js");
    if (typeof UNIVERSES !== "undefined") {
      for (const u of UNIVERSES) {
        const folder = KIND_FOLDER[u.kind];
        if (!folder) continue;
        items.push({
          name: u.name,
          sub: u.tagline || "",
          href: u.href || `pages/${folder}/${u.id}.html`,
          tag: KIND_LABEL[u.kind] || "",
          group: "Library",
        });
      }
    }
    try {
      const mine = JSON.parse(localStorage.getItem("mediavault.myshows") || "[]");
      for (const s of Array.isArray(mine) ? mine : []) {
        if (!s || !s.id || !s.name) continue;
        const anime = s.vault === "anime" || s.mode === "anime";
        items.push({
          name: s.name,
          sub: s.year ? String(s.year) : "",
          href: `pages/${anime ? "anime" : "shows"}/view.html?id=${s.id}`,
          tag: "Yours",
          group: "Your shows",
        });
      }
    } catch {}
    paletteItems = items;
    return items;
  }

  function closePalette() {
    const el = document.querySelector(".cmdk");
    const bd = document.querySelector(".cmdk-backdrop");
    if (!el) return;
    el.classList.remove("show");
    bd.classList.remove("show");
    setTimeout(() => {
      el.remove();
      bd.remove();
    }, 200);
  }

  async function openPalette() {
    if (document.querySelector(".cmdk")) return;
    const bd = document.createElement("div");
    bd.className = "cmdk-backdrop";
    const el = document.createElement("div");
    el.className = "cmdk";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Search everything");
    el.innerHTML = `
      <label class="cmdk-input">${ICONS.search}
        <input type="text" placeholder="Search franchises, lists, shows, pages…" autocomplete="off" spellcheck="false" />
        <kbd>esc</kbd>
      </label>
      <div class="cmdk-list" role="listbox"></div>`;
    document.body.append(bd, el);
    requestAnimationFrame(() => {
      bd.classList.add("show");
      el.classList.add("show");
    });
    bd.addEventListener("click", closePalette);

    const input = el.querySelector("input");
    const list = el.querySelector(".cmdk-list");
    const items = await gatherItems();
    let shown = [];

    const draw = () => {
      const q = input.value.trim().toLowerCase();
      const words = q.split(/\s+/).filter(Boolean);
      shown = items
        .filter((it) => {
          const hay = `${it.name} ${it.sub} ${it.tag || ""}`.toLowerCase();
          return words.every((w) => hay.includes(w));
        })
        .sort((a, b) => (q ? a.name.toLowerCase().indexOf(q) - b.name.toLowerCase().indexOf(q) || 0 : 0))
        .slice(0, q ? 40 : 14);
      paletteSel = Math.min(paletteSel, Math.max(0, shown.length - 1));
      list.replaceChildren();
      if (!shown.length) {
        const empty = document.createElement("div");
        empty.className = "cmdk-empty";
        empty.textContent = "Nothing matches that.";
        list.append(empty);
        return;
      }
      let group = null;
      shown.forEach((it, i) => {
        if (it.group !== group) {
          group = it.group;
          const g = document.createElement("div");
          g.className = "cmdk-group";
          g.textContent = group;
          list.append(g);
        }
        const row = document.createElement("a");
        row.className = `cmdk-item${i === paletteSel ? " sel" : ""}`;
        row.href = it.href;
        const main = document.createElement("span");
        const b = document.createElement("b");
        b.textContent = it.name;
        main.append(b);
        if (it.sub) {
          const sm = document.createElement("small");
          sm.textContent = it.sub;
          main.append(sm);
        }
        row.append(main);
        if (it.tag) {
          const em = document.createElement("em");
          em.textContent = it.tag;
          row.append(em);
        }
        row.addEventListener("mousemove", () => {
          if (paletteSel === i) return;
          paletteSel = i;
          list.querySelectorAll(".cmdk-item").forEach((r, j) => r.classList.toggle("sel", j === i));
        });
        list.append(row);
      });
    };

    paletteSel = 0;
    draw();
    input.focus();
    input.addEventListener("input", () => {
      paletteSel = 0;
      draw();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        paletteSel = (paletteSel + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % Math.max(1, shown.length);
        draw();
        const sel = list.querySelector(".cmdk-item.sel");
        if (sel) sel.scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter" && shown[paletteSel]) {
        e.preventDefault();
        location.href = shown[paletteSel].href;
      } else if (e.key === "Escape") {
        closePalette();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (document.querySelector(".cmdk")) closePalette();
      else openPalette();
    } else if (e.key === "/" && !isTypingTarget(document.activeElement) && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      openPalette();
    }
  });

  const HOLD_MS = 3000;
  let holding = false;
  let holdTimer = null;
  let hint = null;

  const isTypingTarget = (el) =>
    !!el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      el.isContentEditable);

  function nextMode() {
    const idx = MODES.findIndex((m) => m.id === current());
    return MODES[(idx + 1) % MODES.length];
  }

  function showHint(next) {
    hint = document.createElement("div");
    hint.className = "tabcycle-hint";
    hint.innerHTML = `<i></i><span>Keep holding to switch to ${next.name}</span>`;
    document.body.appendChild(hint);
    requestAnimationFrame(() => hint && hint.classList.add("show"));
  }

  function hideHint() {
    if (!hint) return;
    const el = hint;
    hint = null;
    el.classList.remove("show");
    setTimeout(() => el.remove(), 180);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    if (isTypingTarget(document.activeElement)) return;

    if (holding) {
      e.preventDefault();
      return;
    }

    holding = true;
    showHint(nextMode());
    holdTimer = setTimeout(() => {
      const next = nextMode();
      remember(next.id);
      location.href = next.href;
    }, HOLD_MS);
  });

  document.addEventListener("keyup", (e) => {
    if (e.key !== "Tab") return;
    holding = false;
    clearTimeout(holdTimer);
    hideHint();
  });

  window.addEventListener("blur", () => {
    holding = false;
    clearTimeout(holdTimer);
    hideHint();
  });

  document.querySelectorAll('.foot-link[href="pages/analytics.html"]').forEach((link) => {
    if (link.parentElement.querySelector(".foot-link-share")) return;
    const share = document.createElement("a");
    share.className = "foot-link foot-link-share";
    share.href = "pages/sharelist.html";
    share.textContent = "Share a list";
    link.insertAdjacentElement("afterend", share);
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  const DISMISS_KEY = "mediavault.installDismissed";
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  function installBanner(html, onGo) {
    if (isStandalone || localStorage.getItem(DISMISS_KEY) || document.querySelector(".pwa-install")) return;
    const bar = document.createElement("div");
    bar.className = "pwa-install";
    bar.innerHTML = `
      <span>${html}</span>
      <div class="pwa-install-actions">
        ${onGo ? '<button class="btn btn-accent sm" id="pwaGo">Install</button>' : ""}
        <button class="btn btn-ghost sm" id="pwaNo">${onGo ? "Not now" : "Got it"}</button>
      </div>`;
    document.body.appendChild(bar);
    requestAnimationFrame(() => bar.classList.add("show"));

    const dismiss = () => {
      bar.classList.remove("show");
      setTimeout(() => bar.remove(), 250);
    };
    document.getElementById("pwaNo").addEventListener("click", () => {
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {}
      dismiss();
    });
    if (onGo) document.getElementById("pwaGo").addEventListener("click", () => onGo(dismiss));
  }

  let deferredInstall = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstall = e;
    installBanner("Install Media Vault for quick access from your home screen", async (dismiss) => {
      dismiss();
      if (!deferredInstall) return;
      deferredInstall.prompt();
      await deferredInstall.userChoice;
      deferredInstall = null;
    });
  });

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS && !isStandalone) {
    setTimeout(
      () =>
        installBanner(
          "Add Media Vault to your Home Screen: tap Share, then “Add to Home Screen”.",
        ),
      1500,
    );
  }
})();
