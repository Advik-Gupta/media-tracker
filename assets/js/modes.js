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
    { id: 'book', name: 'Books', tagline: 'Reading list', href: 'pages/books.html', icon: '📚',
      blurb: 'Search Open Library, shelve it, track it by author and category.' },
  ];

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

  /* ---------- hold Tab to cycle libraries ----------
     A single Tab press still behaves normally - only a sustained hold
     (which the browser reports as repeated keydowns) is intercepted, so
     keyboard navigation everywhere else is untouched. */

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

  /* ---------- share-list footer link, everywhere ---------- */

  document.querySelectorAll('.foot-link[href="pages/analytics.html"]').forEach((link) => {
    if (link.parentElement.querySelector(".foot-link-share")) return;
    const share = document.createElement("a");
    share.className = "foot-link foot-link-share";
    share.href = "pages/sharelist.html";
    share.textContent = "🔗 Share a list";
    link.insertAdjacentElement("afterend", share);
  });

  /* ---------- PWA: service worker + install prompt ---------- */

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
    installBanner("📲 Install Media Vault for quick access from your home screen", async (dismiss) => {
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
          "📲 Add Media Vault to your Home Screen: tap Share, then “Add to Home Screen”.",
        ),
      1500,
    );
  }
})();
